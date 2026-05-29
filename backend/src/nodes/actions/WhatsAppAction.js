import { BaseNode } from '../base/BaseNode.js';

export class WhatsAppAction extends BaseNode {
  static type               = 'whatsapp';
  static displayName        = 'WhatsApp';
  static category           = 'action';
  static icon               = 'brand-whatsapp';
  static color              = '#25D366';
  static description        = 'Send WhatsApp messages via Meta Cloud API.';
  static requiresCredential = true;
  static credentialProvider = 'meta';

  static BASE_URL = 'https://graph.facebook.com/v19.0';

  defineParams() {
    return [
      {
        key: 'operation', label: 'Operation', type: 'select', required: true, default: 'sendText',
        options: [
          { label: 'Send Text Message',    value: 'sendText'     },
          { label: 'Send Template',        value: 'sendTemplate' },
          { label: 'Send Image',           value: 'sendImage'    },
          { label: 'Send Document',        value: 'sendDocument' },
          { label: 'Mark as Read',         value: 'markRead'     },
        ],
      },
      { key: 'phoneNumberId', label: 'Phone Number ID', type: 'string', required: true,  placeholder: '123456789012345' },
      { key: 'to',            label: 'Recipient number', type: 'string', required: true,  placeholder: '919876543210 (no +)' },
      { key: 'message',       label: 'Message',          type: 'textarea', required: false, rows: 4, placeholder: 'Hello {{ $input.name }}!' },
      { key: 'templateName',  label: 'Template name',    type: 'string',   required: false, placeholder: 'hello_world' },
      { key: 'templateLang',  label: 'Template language',type: 'string',   required: false, default: 'en_US' },
      { key: 'templateParams',label: 'Template params (JSON)', type: 'json', required: false, placeholder: '["John", "order #123"]' },
      { key: 'mediaUrl',      label: 'Media URL',        type: 'string',   required: false, placeholder: 'https://...' },
      { key: 'caption',       label: 'Caption',          type: 'string',   required: false },
      { key: 'filename',      label: 'Filename (document)', type: 'string', required: false },
      { key: 'messageId',     label: 'Message ID (mark read)', type: 'string', required: false },
    ];
  }

  validate(params) {
    if (!params.phoneNumberId) return '"Phone Number ID" is required';
    if (!params.to)            return '"Recipient number" is required';
    if (params.operation === 'sendText'     && !params.message)      return '"Message" is required';
    if (params.operation === 'sendTemplate' && !params.templateName) return '"Template name" is required';
    if (params.operation === 'sendImage'    && !params.mediaUrl)     return '"Media URL" is required';
    if (params.operation === 'sendDocument' && !params.mediaUrl)     return '"Media URL" is required';
    if (params.operation === 'markRead'     && !params.messageId)    return '"Message ID" is required';
    return null;
  }

  async execute(params, context, credential) {
    switch (params.operation) {
      case 'sendText':     return this._sendText(params, credential);
      case 'sendTemplate': return this._sendTemplate(params, credential);
      case 'sendImage':    return this._sendMedia(params, credential, 'image');
      case 'sendDocument': return this._sendMedia(params, credential, 'document');
      case 'markRead':     return this._markRead(params, credential);
      default: throw new Error(`Unknown WhatsApp operation: ${params.operation}`);
    }
  }

  async _sendText(params, credential) {
    const body = {
      messaging_product: 'whatsapp',
      to: params.to,
      type: 'text',
      text: { body: params.message, preview_url: false },
    };
    return this._post(params.phoneNumberId, body, credential.accessToken);
  }

  async _sendTemplate(params, credential) {
    const components = [];
    if (params.templateParams) {
      const parsed = typeof params.templateParams === 'string'
        ? JSON.parse(params.templateParams) : params.templateParams;
      components.push({
        type: 'body',
        parameters: parsed.map((val) => ({ type: 'text', text: String(val) })),
      });
    }

    const body = {
      messaging_product: 'whatsapp',
      to: params.to,
      type: 'template',
      template: {
        name: params.templateName,
        language: { code: params.templateLang || 'en_US' },
        components,
      },
    };
    return this._post(params.phoneNumberId, body, credential.accessToken);
  }

  async _sendMedia(params, credential, type) {
    const mediaObj = { link: params.mediaUrl };
    if (params.caption)  mediaObj.caption  = params.caption;
    if (params.filename) mediaObj.filename = params.filename;

    const body = {
      messaging_product: 'whatsapp',
      to: params.to,
      type,
      [type]: mediaObj,
    };
    return this._post(params.phoneNumberId, body, credential.accessToken);
  }

  async _markRead(params, credential) {
    const body = {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: params.messageId,
    };
    return this._post(params.phoneNumberId, body, credential.accessToken);
  }

  async _post(phoneNumberId, body, accessToken) {
    const res = await this.request(
      `${WhatsAppAction.BASE_URL}/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(body),
      }
    );
    this.log(`WhatsApp message sent → ${body.to}`);
    return res;
  }
}