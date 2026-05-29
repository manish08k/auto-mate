const axios = require('axios');
const crypto = require('crypto');

const SCOPES = {
  repo: ['repo', 'read:org'],
  issues: ['repo', 'read:org'],
  actions: ['repo', 'workflow'],
  user: ['read:user', 'user:email'],
  webhooks: ['admin:repo_hook', 'admin:org_hook'],
  packages: ['read:packages', 'write:packages'],
  base: ['read:user', 'user:email'],
};

class GitHubOAuth {
  constructor() {
    this.clientId = process.env.GITHUB_CLIENT_ID;
    this.clientSecret = process.env.GITHUB_CLIENT_SECRET;
    this.redirectUri = process.env.GITHUB_REDIRECT_URI || `${process.env.APP_URL}/oauth/github/callback`;
    this.authUrl = 'https://github.com/login/oauth/authorize';
    this.tokenUrl = 'https://github.com/login/oauth/access_token';
    this.apiBase = 'https://api.github.com';
  }

  // ─── Authorization URL ────────────────────────────────────────────────────────

  getAuthUrl(scopes = ['base'], userId = null) {
    const state = this._buildState(userId);
    const resolvedScopes = this._resolveScopes(scopes);

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: resolvedScopes.join(' '),
      state,
      allow_signup: 'true',
    });

    return `${this.authUrl}?${params.toString()}`;
  }

  // ─── Token Exchange ───────────────────────────────────────────────────────────

  async exchangeCode(code, state) {
    const response = await axios.post(
      this.tokenUrl,
      {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        redirect_uri: this.redirectUri,
        state,
      },
      { headers: { Accept: 'application/json' } }
    );

    const data = response.data;

    if (data.error) {
      throw new Error(`GitHub token exchange failed: ${data.error_description || data.error}`);
    }

    return {
      accessToken: data.access_token,
      tokenType: data.token_type || 'bearer',
      scope: data.scope,
      // GitHub OAuth tokens do not expire unless using fine-grained tokens
      expiresAt: data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000).toISOString()
        : null,
      refreshToken: data.refresh_token || null,
      refreshTokenExpiresAt: data.refresh_token_expires_in
        ? new Date(Date.now() + data.refresh_token_expires_in * 1000).toISOString()
        : null,
    };
  }

  // ─── Token Refresh ────────────────────────────────────────────────────────────
  // Only applicable for GitHub Apps with expiring tokens (not classic OAuth apps).

  async refreshAccessToken(refreshToken) {
    if (!refreshToken) throw new Error('refreshToken is required');

    const response = await axios.post(
      this.tokenUrl,
      {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      },
      { headers: { Accept: 'application/json' } }
    );

    const data = response.data;

    if (data.error) {
      throw new Error(`GitHub token refresh failed: ${data.error_description || data.error}`);
    }

    return {
      accessToken: data.access_token,
      tokenType: data.token_type || 'bearer',
      expiresAt: data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000).toISOString()
        : null,
      refreshToken: data.refresh_token,
      refreshTokenExpiresAt: data.refresh_token_expires_in
        ? new Date(Date.now() + data.refresh_token_expires_in * 1000).toISOString()
        : null,
    };
  }

  isTokenExpired(expiresAt) {
    if (!expiresAt) return false; // classic OAuth tokens don't expire
    return new Date(expiresAt).getTime() < Date.now() + 60_000;
  }

  async getValidAccessToken(credential) {
    if (!this.isTokenExpired(credential.expiresAt)) return credential.accessToken;
    if (!credential.refreshToken) throw new Error('GitHub token expired and no refresh token available');
    const refreshed = await this.refreshAccessToken(credential.refreshToken);
    return refreshed.accessToken;
  }

  // ─── Token Revoke ─────────────────────────────────────────────────────────────

  async revokeToken(accessToken) {
    await axios.delete(
      `${this.apiBase}/applications/${this.clientId}/token`,
      {
        data: { access_token: accessToken },
        auth: { username: this.clientId, password: this.clientSecret },
        headers: { Accept: 'application/vnd.github+json' },
      }
    );
    return { success: true };
  }

  // ─── User Info ────────────────────────────────────────────────────────────────

  async getUserInfo(accessToken) {
    const [userRes, emailsRes] = await Promise.all([
      axios.get(`${this.apiBase}/user`, {
        headers: this._headers(accessToken),
      }),
      axios.get(`${this.apiBase}/user/emails`, {
        headers: this._headers(accessToken),
      }),
    ]);

    const primary = emailsRes.data.find((e) => e.primary && e.verified);

    return {
      id: String(userRes.data.id),
      login: userRes.data.login,
      name: userRes.data.name,
      email: primary?.email || userRes.data.email,
      avatarUrl: userRes.data.avatar_url,
      htmlUrl: userRes.data.html_url,
      company: userRes.data.company,
      bio: userRes.data.bio,
    };
  }

  // ─── Installations (GitHub Apps) ──────────────────────────────────────────────

  async getUserInstallations(accessToken) {
    const response = await axios.get(`${this.apiBase}/user/installations`, {
      headers: {
        ...this._headers(accessToken),
        Accept: 'application/vnd.github+json',
      },
    });
    return response.data.installations || [];
  }

  // ─── Webhook Signature Verification ──────────────────────────────────────────

  verifyWebhookSignature(rawBody, signature, secret) {
    if (!signature?.startsWith('sha256=')) {
      throw new Error('Invalid GitHub webhook signature format');
    }

    const expected = `sha256=${crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex')}`;

    if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
      throw new Error('GitHub webhook signature mismatch');
    }

    return true;
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  _headers(accessToken) {
    return {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };
  }

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

module.exports = new GitHubOAuth();
