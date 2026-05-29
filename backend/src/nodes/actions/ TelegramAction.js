import { BaseNode } from '../base/BaseNode.js';

export class TelegramAction extends BaseNode {
  static type               = 'telegram';
  static displayName        = 'Telegram';
  static category           = 'action';
  static icon               = 'brand-telegram';
  static color              = '#2AABEE';
  static description        = 'Send messages, files, and alerts via a Telegram bot.';
  static requiresCredential = true;
  static credentialProvider = 'telegram';

  defineParams() {
    return [
      {
        key: 'operation', label: 'Operation', type: 'select', required: true, default: 'sendMessage',
        options: [
          { label: 'Send Message',   value: 'sendMessage'  },
          { label: 'Send Photo',     value: 'sendPhoto'    },
          { label: 'Send Document',  value: 'sendDocument' },
          { label: 'Send Poll',      value: 'sendPoll'     },
          { label: 'Pin Message',    value: 'pinMessage'   },
          { label: 'Get Chat Info',  value: 'getChat'      },
        ],
      },
      { key: 'chatId',       label: 'Chat ID',  type: 'string',   required: true,  placeholder: '-1001234567890 or @username' },
      { key: 'text',         label: 'Message',  type: 'textarea', required: false, rows: 5, placeholder: 'Hello {{ $input.name }}!' },
      { key: 'parseMode',    label: 'Parse mode', type: 'select', required: false, default: 'HTML',
        options: [{ label: 'HTML', value: 'HTML' }, { label: 'Markdown', value: 'MarkdownV2' }, { label: 'None', value: '' }] },
      { key: 'disablePreview', label: 'Disable link preview', type: 'boolean', required: false, default: false },
      { key: 'photoUrl',     label: 'Photo URL', type: 'string', required: false },
      { key: 'documentUrl',  label: 'Document URL', type: 'string', required: false },
      { key: 'caption',      label: 'Caption',   type: 'string', required: false },
      { key: 'pollQuestion', label: 'Poll question', type: 'string', required: false },
      { key: 'pollOptions',  label: 'Poll options (comma separated)', type: 'string', required: false, placeholder: 'Yes, No, Maybe' },
      { key: 'messageId',    label: 'Message ID (pin)', type: 'string', required: false },
      { key: 'replyToMessageId', label: 'Reply to message ID', type: 'string', required: false },
    ];
  }

  validate(params) {
    if (!params.chatId) return '"Chat ID" is required';
    if (params.operation === 'sendMessage'  && !params.text)        return '"Message" is required';
    if (params.operation === 'sendPhoto'    && !params.photoUrl)    return '"Photo URL" is required';
    if (params.operation === 'sendDocument' && !params.documentUrl) return '"Document URL" is required';
    if (params.operation === 'sendPoll'     && !params.pollQuestion) return '"Poll question" is required';
    if (params.operation === 'sendPoll'     && !params.pollOptions)  return '"Poll options" are required';
    if (params.operation === 'pinMessage'   && !params.messageId)   return '"Message ID" is required for pin';
    return null;
  }

  async execute(params, context, credential) {
    const token = credential.botToken;
    const base  = `https://api.telegram.org/bot${token}`;

    switch (params.operation) {
      case 'sendMessage':  return this._call(base, 'sendMessage',  this._messageBody(params));
      case 'sendPhoto':    return this._call(base, 'sendPhoto',    { chat_id: params.chatId, photo: params.photoUrl, caption: params.caption, parse_mode: params.parseMode || undefined });
      case 'sendDocument': return this._call(base, 'sendDocument', { chat_id: params.chatId, document: params.documentUrl, caption: params.caption });
      case 'sendPoll':     return this._call(base, 'sendPoll',     { chat_id: params.chatId, question: params.pollQuestion, options: params.pollOptions.split(',').map((s) => s.trim()) });
      case 'pinMessage':   return this._call(base, 'pinChatMessage', { chat_id: params.chatId, message_id: Number(params.messageId) });
      case 'getChat':      return this._call(base, 'getChat',     { chat_id: params.chatId });
      default: throw new Error(`Unknown Telegram operation: ${params.operation}`);
    }
  }

  _messageBody(params) {
    const body = { chat_id: params.chatId, text: params.text };
    if (params.parseMode)         body.parse_mode              = params.parseMode;
    if (params.disablePreview)    body.disable_web_page_preview = true;
    if (params.replyToMessageId)  body.reply_to_message_id     = Number(params.replyToMessageId);
    return body;
  }

  async _call(base, method, body) {
    const res = await this.request(`${base}/${method}`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Telegram API error: ${res.description}`);
    this.log(`${method} → chat ${body.chat_id}`);
    return res.result;
  }
}