const axios = require('axios');
const crypto = require('crypto');
const qs = require('querystring');

const SCOPES = {
  bot: [
    'chat:write',
    'channels:read',
    'channels:history',
    'groups:read',
    'groups:history',
    'users:read',
    'files:write',
    'reactions:write',
  ],
  user: [
    'channels:read',
    'chat:write',
    'files:write:user',
  ],
};

class SlackOAuth {
  constructor() {
    this.clientId = process.env.SLACK_CLIENT_ID;
    this.clientSecret = process.env.SLACK_CLIENT_SECRET;
    this.redirectUri = process.env.SLACK_REDIRECT_URI || `${process.env.APP_URL}/oauth/slack/callback`;
    this.authUrl = 'https://slack.com/oauth/v2/authorize';
    this.tokenUrl = 'https://slack.com/api/oauth.v2.access';
    this.revokeUrl = 'https://slack.com/api/auth.revoke';
  }

  // ─── Authorization URL ────────────────────────────────────────────────────────

  getAuthUrl(scopes = SCOPES.bot, userId = null) {
    const state = this._buildState(userId);

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: scopes.join(','),
      user_scope: SCOPES.user.join(','),
      state,
    });

    return `${this.authUrl}?${params.toString()}`;
  }

  // ─── Token Exchange ───────────────────────────────────────────────────────────

  async exchangeCode(code) {
    const response = await axios.post(
      this.tokenUrl,
      qs.stringify({
        code,
        redirect_uri: this.redirectUri,
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        auth: { username: this.clientId, password: this.clientSecret },
      }
    );

    const data = response.data;

    if (!data.ok) {
      throw new Error(`Slack token exchange failed: ${data.error}`);
    }

    return {
      accessToken: data.access_token,
      botUserId: data.bot_user_id,
      teamId: data.team?.id,
      teamName: data.team?.name,
      appId: data.app_id,
      scope: data.scope,
      tokenType: data.token_type || 'bot',
      authedUser: {
        id: data.authed_user?.id,
        accessToken: data.authed_user?.access_token || null,
        scope: data.authed_user?.scope || null,
      },
    };
  }

  // ─── Token Revoke ─────────────────────────────────────────────────────────────

  async revokeToken(accessToken) {
    const response = await axios.post(
      this.revokeUrl,
      {},
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!response.data.ok) {
      throw new Error(`Slack token revocation failed: ${response.data.error}`);
    }

    return { success: true };
  }

  // ─── Token Test / Auth Info ───────────────────────────────────────────────────

  async testAuth(accessToken) {
    const response = await axios.post(
      'https://slack.com/api/auth.test',
      {},
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!response.data.ok) {
      throw new Error(`Slack auth test failed: ${response.data.error}`);
    }

    return {
      userId: response.data.user_id,
      user: response.data.user,
      teamId: response.data.team_id,
      team: response.data.team,
      botId: response.data.bot_id,
      isEnterprise: response.data.is_enterprise_install,
    };
  }

  // ─── Slack does not issue refresh tokens ─────────────────────────────────────
  // Bot tokens are long-lived. Prompt user to reconnect if token is revoked.

  isTokenExpired() {
    return false; // Slack bot tokens don't expire
  }

  // ─── State Helpers ────────────────────────────────────────────────────────────

  _buildState(userId) {
    const payload = { userId, nonce: crypto.randomBytes(16).toString('hex'), ts: Date.now() };
    return Buffer.from(JSON.stringify(payload)).toString('base64url');
  }

  parseState(state) {
    try {
      return JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));
    } catch {
      throw new Error('Invalid OAuth state parameter');
    }
  }

  verifySignature(signingSecret, rawBody, slackSignature, timestamp) {
    const fiveMinutes = 5 * 60;
    if (Math.abs(Date.now() / 1000 - timestamp) > fiveMinutes) {
      throw new Error('Slack request timestamp is too old');
    }

    const baseString = `v0:${timestamp}:${rawBody}`;
    const hmac = crypto.createHmac('sha256', signingSecret);
    const digest = `v0=${hmac.update(baseString).digest('hex')}`;

    if (!crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(slackSignature))) {
      throw new Error('Slack signature verification failed');
    }

    return true;
  }
}

module.exports = new SlackOAuth();
