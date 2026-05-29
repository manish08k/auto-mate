const axios = require('axios');
const crypto = require('crypto');

const SCOPES = {
  instagram: [
    'instagram_basic',
    'instagram_content_publish',
    'instagram_manage_comments',
    'instagram_manage_insights',
    'pages_show_list',
  ],
  whatsapp: [
    'whatsapp_business_messaging',
    'whatsapp_business_management',
  ],
  pages: [
    'pages_manage_posts',
    'pages_read_engagement',
    'pages_manage_metadata',
    'pages_show_list',
  ],
  ads: [
    'ads_management',
    'ads_read',
  ],
  base: [
    'public_profile',
    'email',
  ],
};

class MetaOAuth {
  constructor() {
    this.appId = process.env.META_APP_ID;
    this.appSecret = process.env.META_APP_SECRET;
    this.redirectUri = process.env.META_REDIRECT_URI || `${process.env.APP_URL}/oauth/meta/callback`;
    this.apiVersion = process.env.META_API_VERSION || 'v19.0';
    this.baseUrl = `https://graph.facebook.com/${this.apiVersion}`;
    this.authBase = 'https://www.facebook.com';
  }

  // ─── Authorization URL ────────────────────────────────────────────────────────

  getAuthUrl(scopes = ['base'], userId = null) {
    const state = this._buildState(userId);
    const resolvedScopes = this._resolveScopes(scopes);

    const params = new URLSearchParams({
      client_id: this.appId,
      redirect_uri: this.redirectUri,
      scope: resolvedScopes.join(','),
      response_type: 'code',
      state,
    });

    return `${this.authBase}/${this.apiVersion}/dialog/oauth?${params.toString()}`;
  }

  // ─── Token Exchange ───────────────────────────────────────────────────────────

  async exchangeCode(code) {
    const response = await axios.get(`${this.baseUrl}/oauth/access_token`, {
      params: {
        client_id: this.appId,
        client_secret: this.appSecret,
        redirect_uri: this.redirectUri,
        code,
      },
    });

    const { access_token, token_type, expires_in } = response.data;

    // Exchange short-lived for long-lived token immediately
    const longLived = await this.exchangeForLongLived(access_token);

    return longLived;
  }

  // ─── Long-Lived Token ─────────────────────────────────────────────────────────

  async exchangeForLongLived(shortLivedToken) {
    const response = await axios.get(`${this.baseUrl}/oauth/access_token`, {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: this.appId,
        client_secret: this.appSecret,
        fb_exchange_token: shortLivedToken,
      },
    });

    const { access_token, token_type, expires_in } = response.data;

    return {
      accessToken: access_token,
      tokenType: token_type || 'bearer',
      expiresAt: expires_in
        ? new Date(Date.now() + expires_in * 1000).toISOString()
        : null,
    };
  }

  // ─── Token Refresh ────────────────────────────────────────────────────────────
  // Meta long-lived tokens expire in ~60 days.
  // Refresh by re-exchanging the existing long-lived token.

  async refreshAccessToken(accessToken) {
    return await this.exchangeForLongLived(accessToken);
  }

  isTokenExpired(expiresAt) {
    if (!expiresAt) return false; // page tokens don't expire
    return new Date(expiresAt).getTime() < Date.now() + 24 * 60 * 60 * 1000; // refresh if < 1 day
  }

  async getValidAccessToken(credential) {
    if (!this.isTokenExpired(credential.expiresAt)) return credential.accessToken;
    const refreshed = await this.refreshAccessToken(credential.accessToken);
    return refreshed.accessToken;
  }

  // ─── Token Debug / User Info ──────────────────────────────────────────────────

  async debugToken(accessToken) {
    const response = await axios.get(`${this.baseUrl}/debug_token`, {
      params: {
        input_token: accessToken,
        access_token: `${this.appId}|${this.appSecret}`,
      },
    });

    if (response.data.data?.error) {
      throw new Error(`Meta token debug failed: ${response.data.data.error.message}`);
    }

    return response.data.data;
  }

  async getUserInfo(accessToken) {
    const response = await axios.get(`${this.baseUrl}/me`, {
      params: {
        fields: 'id,name,email,picture',
        access_token: accessToken,
      },
    });

    return {
      id: response.data.id,
      name: response.data.name,
      email: response.data.email || null,
      picture: response.data.picture?.data?.url || null,
    };
  }

  // ─── Page Tokens ─────────────────────────────────────────────────────────────

  async getPageAccessTokens(userAccessToken) {
    const response = await axios.get(`${this.baseUrl}/me/accounts`, {
      params: { access_token: userAccessToken },
    });

    return response.data.data.map((page) => ({
      pageId: page.id,
      pageName: page.name,
      accessToken: page.access_token,
      category: page.category,
    }));
  }

  // ─── WhatsApp Business ────────────────────────────────────────────────────────

  async getWABAId(accessToken) {
    const response = await axios.get(`${this.baseUrl}/me/businesses`, {
      params: { access_token: accessToken },
    });
    return response.data.data?.[0]?.id || null;
  }

  // ─── Webhook Signature Verification ──────────────────────────────────────────

  verifyWebhookSignature(rawBody, signature) {
    if (!signature?.startsWith('sha256=')) {
      throw new Error('Invalid Meta webhook signature format');
    }

    const expected = crypto
      .createHmac('sha256', this.appSecret)
      .update(rawBody)
      .digest('hex');

    const received = signature.replace('sha256=', '');

    if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received))) {
      throw new Error('Meta webhook signature mismatch');
    }

    return true;
  }

  verifyWebhookChallenge(mode, token, challenge) {
    const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN;
    if (mode === 'subscribe' && token === verifyToken) return challenge;
    throw new Error('Meta webhook verification failed');
  }

  // ─── Token Revoke ─────────────────────────────────────────────────────────────

  async revokeToken(accessToken) {
    await axios.delete(`${this.baseUrl}/me/permissions`, {
      params: { access_token: accessToken },
    });
    return { success: true };
  }

  // ─── State / Scope Helpers ────────────────────────────────────────────────────

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

  _resolveScopes(requested) {
    const resolved = new Set(SCOPES.base);
    for (const key of requested) {
      const group = SCOPES[key];
      if (group) group.forEach((s) => resolved.add(s));
      else resolved.add(key);
    }
    return [...resolved];
  }
}

module.exports = new MetaOAuth();
