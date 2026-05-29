import { BaseNode } from '../base/BaseNode.js';
import { google } from 'googleapis';

export class GmailAction extends BaseNode {
  static type               = 'gmail';
  static displayName        = 'Gmail';
  static category           = 'action';
  static icon               = 'mail';
  static color              = '#EA4335';
  static description        = 'Send emails, read inbox, create drafts via Gmail.';
  static requiresCredential = true;
  static credentialProvider = 'google';

  defineParams() {
    return [
      {
        key: 'operation', label: 'Operation', type: 'select', required: true, default: 'sendEmail',
        options: [
          { label: 'Send Email',    value: 'sendEmail'   },
          { label: 'Get Emails',    value: 'getEmails'   },
          { label: 'Create Draft',  value: 'createDraft' },
          { label: 'Reply to Email',value: 'reply'       },
        ],
      },
      { key: 'to',       label: 'To',      type: 'string',   required: false, placeholder: 'user@example.com' },
      { key: 'cc',       label: 'CC',      type: 'string',   required: false, placeholder: 'cc@example.com'   },
      { key: 'bcc',      label: 'BCC',     type: 'string',   required: false, placeholder: 'bcc@example.com'  },
      { key: 'subject',  label: 'Subject', type: 'string',   required: false, placeholder: 'Hello from flowbase' },
      { key: 'body',     label: 'Body',    type: 'textarea', required: false, rows: 6, placeholder: 'Email body...' },
      { key: 'bodyType', label: 'Body type', type: 'select', required: false, default: 'plain',
        options: [{ label: 'Plain text', value: 'plain' }, { label: 'HTML', value: 'html' }] },
      { key: 'threadId', label: 'Thread ID (reply)', type: 'string', required: false, placeholder: 'For reply operation' },
      { key: 'maxResults', label: 'Max results (get)',  type: 'number', required: false, default: 10 },
      { key: 'query',      label: 'Search query (get)', type: 'string', required: false, placeholder: 'is:unread from:boss@co.com' },
    ];
  }

  validate(params) {
    if (params.operation === 'sendEmail' || params.operation === 'createDraft') {
      if (!params.to)      return '"To" is required for sending email';
      if (!params.subject) return '"Subject" is required';
      if (!params.body)    return '"Body" is required';
    }
    return null;
  }

  async execute(params, context, credential) {
    const auth = this._buildAuth(credential);
    const gmail = google.gmail({ version: 'v1', auth });

    switch (params.operation) {
      case 'sendEmail':   return this._sendEmail(gmail, params);
      case 'createDraft': return this._createDraft(gmail, params);
      case 'reply':       return this._reply(gmail, params);
      case 'getEmails':   return this._getEmails(gmail, params);
      default: throw new Error(`Unknown Gmail operation: ${params.operation}`);
    }
  }

  // ─── Operations ───────────────────────────────────────────────────────────

  async _sendEmail(gmail, params) {
    const raw = this._buildRaw(params);
    const res = await gmail.users.messages.send({ userId: 'me', requestBody: { raw } });
    this.log(`Email sent → ${params.to} (id: ${res.data.id})`);
    return { messageId: res.data.id, threadId: res.data.threadId, to: params.to, subject: params.subject };
  }

  async _createDraft(gmail, params) {
    const raw = this._buildRaw(params);
    const res = await gmail.users.drafts.create({ userId: 'me', requestBody: { message: { raw } } });
    this.log(`Draft created (id: ${res.data.id})`);
    return { draftId: res.data.id, to: params.to, subject: params.subject };
  }

  async _reply(gmail, params) {
    if (!params.threadId) throw new Error('"Thread ID" is required for reply');
    const raw = this._buildRaw(params);
    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw, threadId: params.threadId },
    });
    return { messageId: res.data.id, threadId: res.data.threadId };
  }

  async _getEmails(gmail, params) {
    const listRes = await gmail.users.messages.list({
      userId: 'me',
      maxResults: params.maxResults || 10,
      q: params.query || '',
    });

    const messages = listRes.data.messages || [];

    const full = await Promise.all(
      messages.slice(0, 10).map((m) =>
        gmail.users.messages.get({ userId: 'me', id: m.id, format: 'metadata',
          metadataHeaders: ['From', 'To', 'Subject', 'Date'] })
      )
    );

    return {
      emails: full.map((r) => {
        const h = Object.fromEntries(r.data.payload.headers.map((x) => [x.name, x.value]));
        return { id: r.data.id, threadId: r.data.threadId, from: h.From, to: h.To, subject: h.Subject, date: h.Date, snippet: r.data.snippet };
      }),
      total: listRes.data.resultSizeEstimate,
    };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  _buildAuth(credential) {
    const oauth2 = new google.auth.OAuth2();
    oauth2.setCredentials({ access_token: credential.accessToken, refresh_token: credential.refreshToken });
    return oauth2;
  }

  _buildRaw(params) {
    const isHtml   = params.bodyType === 'html';
    const mimeType = isHtml ? 'text/html' : 'text/plain';
    const headers  = [
      `To: ${params.to}`,
      params.cc  ? `Cc: ${params.cc}`   : '',
      params.bcc ? `Bcc: ${params.bcc}` : '',
      `Subject: ${params.subject}`,
      'MIME-Version: 1.0',
      `Content-Type: ${mimeType}; charset=utf-8`,
      '',
      params.body,
    ].filter(Boolean).join('\r\n');

    return Buffer.from(headers).toString('base64url');
  }
}