import { apiResponse } from '../utils/apiResponse.js';
import { logger } from '../utils/logger.js';
import { encrypt } from '../utils/encrypt.js';
import Credential from '../models/Credential.model.js';
import { googleOAuth } from '../oauth/google.oauth.js';
import { slackOAuth } from '../oauth/slack.oauth.js';
import { metaOAuth } from '../oauth/meta.oauth.js';
import { githubOAuth } from '../oauth/github.oauth.js';

// Supported OAuth providers map
const providers = {
  google: googleOAuth,
  slack: slackOAuth,
  meta: metaOAuth,
  github: githubOAuth,
};

// GET /oauth/:provider/connect
// Redirect user to the provider's OAuth consent page
export const redirectToProvider = (req, res) => {
  try {
    const { provider } = req.params;
    const oAuth = providers[provider];

    if (!oAuth) {
      return res.status(400).json(apiResponse.error(`Unsupported provider: ${provider}`));
    }

    // Encode userId in state so we can attach the credential after callback
    const state = Buffer.from(
      JSON.stringify({ userId: req.user.id, provider })
    ).toString('base64');

    const authUrl = oAuth.getAuthUrl(state);

    logger.info(`OAuth redirect: user ${req.user.id} → ${provider}`);

    return res.redirect(authUrl);
  } catch (err) {
    logger.error('redirectToProvider error', err);
    return res.status(500).json(apiResponse.error('OAuth redirect failed'));
  }
};

// GET /oauth/:provider/callback
// Provider redirects back here with a code — exchange for tokens and save
export const handleCallback = async (req, res) => {
  try {
    const { provider } = req.params;
    const { code, state, error } = req.query;

    if (error) {
      logger.warn(`OAuth denied by user for ${provider}: ${error}`);
      return res.redirect(`${process.env.FRONTEND_URL}/credentials?error=oauth_denied`);
    }

    if (!code || !state) {
      return res.status(400).json(apiResponse.error('Missing code or state'));
    }

    let decoded;
    try {
      decoded = JSON.parse(Buffer.from(state, 'base64').toString('utf8'));
    } catch {
      return res.status(400).json(apiResponse.error('Invalid state parameter'));
    }

    const { userId } = decoded;

    const oAuth = providers[provider];
    if (!oAuth) {
      return res.status(400).json(apiResponse.error(`Unsupported provider: ${provider}`));
    }

    // Exchange code for access + refresh tokens
    const tokenData = await oAuth.exchangeCode(code);

    // Fetch the connected account display info (name, email, workspace name etc.)
    const accountInfo = await oAuth.getAccountInfo(tokenData.access_token);

    // Encrypt all token data before storing
    const encryptedData = encrypt(
      JSON.stringify({
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || null,
        expiresAt: tokenData.expires_in
          ? Date.now() + tokenData.expires_in * 1000
          : null,
        scope: tokenData.scope || null,
        ...accountInfo,
      })
    );

    // Upsert: one credential per provider per user
    const [credential, created] = await Credential.findOrCreate({
      where: { userId, provider },
      defaults: {
        name: accountInfo.name || accountInfo.email || provider,
        provider,
        type: 'oauth',
        data: encryptedData,
        isValid: true,
        userId,
      },
    });

    if (!created) {
      await credential.update({
        data: encryptedData,
        isValid: true,
        name: accountInfo.name || accountInfo.email || provider,
      });
    }

    logger.info(`OAuth connected: ${provider} for user ${userId} (credential ${credential.id})`);

    return res.redirect(
      `${process.env.FRONTEND_URL}/credentials?connected=${provider}`
    );
  } catch (err) {
    logger.error('handleCallback error', err);
    return res.redirect(
      `${process.env.FRONTEND_URL}/credentials?error=oauth_failed`
    );
  }
};

// POST /oauth/:provider/disconnect
// Remove the OAuth credential for a provider
export const disconnectProvider = async (req, res) => {
  try {
    const { provider } = req.params;

    const credential = await Credential.findOne({
      where: { provider, userId: req.user.id, type: 'oauth' },
    });

    if (!credential) {
      return res.status(404).json(apiResponse.error('No connected account found for this provider'));
    }

    // Attempt to revoke the token with the provider
    try {
      const oAuth = providers[provider];
      if (oAuth?.revokeToken) {
        await oAuth.revokeToken(credential.data);
      }
    } catch (revokeErr) {
      // Non-fatal — still delete from our side
      logger.warn(`Token revocation failed for ${provider}: ${revokeErr.message}`);
    }

    await credential.destroy();

    logger.info(`OAuth disconnected: ${provider} for user ${req.user.id}`);

    return res.status(200).json(apiResponse.success(`${provider} disconnected`));
  } catch (err) {
    logger.error('disconnectProvider error', err);
    return res.status(500).json(apiResponse.error('Disconnect failed'));
  }
};

// POST /oauth/:provider/refresh
// Refresh an expired OAuth access token using the stored refresh token
export const refreshToken = async (req, res) => {
  try {
    const { provider } = req.params;

    const credential = await Credential.findOne({
      where: { provider, userId: req.user.id, type: 'oauth' },
    });

    if (!credential) {
      return res.status(404).json(apiResponse.error('No connected account for this provider'));
    }

    const oAuth = providers[provider];
    if (!oAuth?.refreshAccessToken) {
      return res.status(400).json(apiResponse.error(`${provider} does not support token refresh`));
    }

    const { decrypt } = await import('../utils/encrypt.js');
    const existing = JSON.parse(decrypt(credential.data));

    if (!existing.refreshToken) {
      return res.status(400).json(apiResponse.error('No refresh token stored'));
    }

    const newTokenData = await oAuth.refreshAccessToken(existing.refreshToken);

    const updated = {
      ...existing,
      accessToken: newTokenData.access_token,
      expiresAt: newTokenData.expires_in
        ? Date.now() + newTokenData.expires_in * 1000
        : null,
    };

    await credential.update({
      data: encrypt(JSON.stringify(updated)),
      isValid: true,
    });

    logger.info(`Token refreshed: ${provider} for user ${req.user.id}`);

    return res.status(200).json(apiResponse.success('Token refreshed'));
  } catch (err) {
    logger.error('refreshToken error', err);
    return res.status(500).json(apiResponse.error('Token refresh failed'));
  }
};

// GET /oauth/connected
// List all connected OAuth providers for the current user
export const getConnectedProviders = async (req, res) => {
  try {
    const credentials = await Credential.findAll({
      where: { userId: req.user.id, type: 'oauth' },
      attributes: ['id', 'name', 'provider', 'isValid', 'updatedAt'],
    });

    return res.status(200).json(
      apiResponse.success('Connected providers fetched', credentials)
    );
  } catch (err) {
    logger.error('getConnectedProviders error', err);
    return res.status(500).json(apiResponse.error('Failed to fetch connected providers'));
  }
};
