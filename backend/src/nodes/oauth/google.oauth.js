const { google } = require('googleapis');
const crypto = require('crypto');

const SCOPES = {
  gmail: [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.modify',
  ],
  sheets: [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.readonly',
  ],
  drive: [
    'https://www.googleapis.com/auth/drive',
  ],
  calendar: [
    'https://www.googleapis.com/auth/calendar',
  ],
  profile: [
    'openid',
    'email',
    'profile',
  ],
};

class GoogleOAuth {
  constructor() {
    this.clientId = process.env.GOOGLE_CLIENT_ID;
    this.clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    this.redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.APP_URL}/oauth/google/callback`;
  }

  // ─── OAuth Client ─────────────────────────────────────────────────────────────

  _createClient(tokens = null) {
    const client = new google.auth.OAuth2(
      this.clientId,
      this.clientSecret,
      this.redirectUri
    );
    if (tokens) client.setCredentials(tokens);
    return client;
  }

  // ─── Authorization URL ────────────────────────────────────────────────────────

  getAuthUrl(scopes = ['profile'], userId = null) {
    const client = this._createClient();
    const state = this._buildState(userId);

    const resolvedScopes = this._resolveScopes(scopes);

    return client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: resolvedScopes,
      state,
      include_granted_scopes: true,
    });
  }

  // ─── Token Exchange ───────────────────────────────────────────────────────────

  async exchangeCode(code) {
    const client = this._createClient();

    const { tokens } = await client.getToken(code);

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      idToken: tokens.id_token || null,
      expiresAt: tokens.expiry_date
        ? new Date(tokens.expiry_date).toISOString()
        : null,
      tokenType: tokens.token_type || 'Bearer',
      scope: tokens.scope,
    };
  }

  // ─── Token Refresh ────────────────────────────────────────────────────────────

  async refreshAccessToken(refreshToken) {
    if (!refreshToken) throw new Error('refreshToken is required');

    const client = this._createClient({ refresh_token: refreshToken });

    const { credentials } = await client.refreshAccessToken();

    return {
      accessToken: credentials.access_token,
      expiresAt: credentials.expiry_date
        ? new Date(credentials.expiry_date).toISOString()
        : null,
      tokenType: credentials.token_type || 'Bearer',
    };
  }

  // ─── Token Revoke ─────────────────────────────────────────────────────────────

  async revokeToken(accessToken) {
    const client = this._createClient();
    await client.revokeToken(accessToken);
    return { success: true };
  }

  // ─── User Info ────────────────────────────────────────────────────────────────

  async getUserInfo(accessToken) {
    const client = this._createClient({ access_token: accessToken });
    const oauth2 = google.oauth2({ version: 'v2', auth: client });
    const { data } = await oauth2.userinfo.get();

    return {
      id: data.id,
      email: data.email,
      name: data.name,
      picture: data.picture,
      verified: data.verified_email,
    };
  }

  // ─── Token Validity ───────────────────────────────────────────────────────────

  isTokenExpired(expiresAt) {
    if (!expiresAt) return true;
    return new Date(expiresAt).getTime() < Date.now() + 60_000; // 1 min buffer
  }

  async getValidAccessToken(credential) {
    if (!this.isTokenExpired(credential.expiresAt)) {
      return credential.accessToken;
    }
    const refreshed = await this.refreshAccessToken(credential.refreshToken);
    return refreshed.accessToken;
  }

  // ─── State Helpers ────────────────────────────────────────────────────────────

  _buildState(userId) {
    const payload = {
      userId,
      nonce: crypto.randomBytes(16).toString('hex'),
      ts: Date.now(),
    };
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
    const resolved = new Set(SCOPES.profile);
    for (const key of requested) {
      const group = SCOPES[key];
      if (group) group.forEach((s) => resolved.add(s));
      else resolved.add(key); // raw scope string
    }
    return [...resolved];
  }
}

module.exports = new GoogleOAuth();
