const BaseNode = require('../base/BaseNode');
const axios = require('axios');

/**
 * SlackAction
 * Sends messages, uploads files, and manages Slack workspace events
 * via the Slack Web API.
 */
class SlackAction extends BaseNode {
  constructor() {
    super();
    this.name = 'SlackAction';
    this.displayName = 'Slack';
    this.description = 'Send messages, create channels, upload files via Slack Web API';
    this.version = 1;
    this.baseUrl = 'https://slack.com/api';
  }

  // ─── Input Schema ────────────────────────────────────────────────────────────

  getInputSchema() {
    return {
      operation: {
        type: 'string',
        required: true,
        enum: ['sendMessage', 'sendReply', 'uploadFile', 'createChannel', 'getChannelHistory'],
        default: 'sendMessage',
        description: 'The Slack operation to perform',
      },
      token: {
        type: 'string',
        required: true,
        description: 'Bot OAuth token (xoxb-...)',
        sensitive: true,
      },
      channel: {
        type: 'string',
        required: true,
        description: 'Channel ID or name (e.g. #general or C01234567)',
      },
      text: {
        type: 'string',
        required: false,
        description: 'Message text. Supports Slack mrkdwn formatting.',
      },
      blocks: {
        type: 'array',
        required: false,
        description: 'Block Kit layout array for rich message composition',
      },
      thread_ts: {
        type: 'string',
        required: false,
        description: 'Timestamp of parent message to post as a threaded reply',
      },
      username: {
        type: 'string',
        required: false,
        description: 'Override the bot display name for this message',
      },
      icon_emoji: {
        type: 'string',
        required: false,
        description: 'Emoji to use as the bot icon (e.g. :robot_face:)',
      },
    };
  }

  // ─── Executor ────────────────────────────────────────────────────────────────

  async execute(inputData, credentials) {
    const { operation } = inputData;
    const token = credentials?.token || inputData.token;

    if (!token) throw this.createError('Slack token is required', 'MISSING_CREDENTIALS');

    const client = this._buildClient(token);

    switch (operation) {
      case 'sendMessage':
        return await this._sendMessage(client, inputData);
      case 'sendReply':
        return await this._sendReply(client, inputData);
      case 'uploadFile':
        return await this._uploadFile(client, inputData);
      case 'createChannel':
        return await this._createChannel(client, inputData);
      case 'getChannelHistory':
        return await this._getChannelHistory(client, inputData);
      default:
        throw this.createError(`Unsupported operation: ${operation}`, 'INVALID_OPERATION');
    }
  }

  // ─── Operations ──────────────────────────────────────────────────────────────

  async _sendMessage(client, data) {
    const { channel, text, blocks, username, icon_emoji, thread_ts } = data;

    if (!channel) throw this.createError('channel is required for sendMessage', 'MISSING_FIELD');
    if (!text && !blocks) throw this.createError('text or blocks is required', 'MISSING_FIELD');

    const payload = {
      channel,
      text: text || '',
      ...(blocks && { blocks }),
      ...(username && { username }),
      ...(icon_emoji && { icon_emoji }),
      ...(thread_ts && { thread_ts }),
    };

    const response = await client.post('/chat.postMessage', payload);
    this._assertOk(response.data);

    return {
      success: true,
      ts: response.data.ts,
      channel: response.data.channel,
      message: response.data.message,
    };
  }

  async _sendReply(client, data) {
    const { channel, text, thread_ts } = data;

    if (!thread_ts) throw this.createError('thread_ts is required for sendReply', 'MISSING_FIELD');

    return await this._sendMessage(client, { channel, text, thread_ts });
  }

  async _uploadFile(client, data) {
    const { channel, filename, content, filetype, title } = data;

    if (!content) throw this.createError('content is required for uploadFile', 'MISSING_FIELD');

    const payload = {
      channels: channel,
      content,
      filename: filename || 'upload.txt',
      filetype: filetype || 'text',
      ...(title && { title }),
    };

    const response = await client.post('/files.upload', payload);
    this._assertOk(response.data);

    return {
      success: true,
      file: response.data.file,
    };
  }

  async _createChannel(client, data) {
    const { name, is_private = false } = data;

    if (!name) throw this.createError('name is required for createChannel', 'MISSING_FIELD');

    const response = await client.post('/conversations.create', {
      name: name.toLowerCase().replace(/\s+/g, '-'),
      is_private,
    });
    this._assertOk(response.data);

    return {
      success: true,
      channel: response.data.channel,
    };
  }

  async _getChannelHistory(client, data) {
    const { channel, limit = 20, oldest, latest } = data;

    if (!channel) throw this.createError('channel is required for getChannelHistory', 'MISSING_FIELD');

    const params = {
      channel,
      limit,
      ...(oldest && { oldest }),
      ...(latest && { latest }),
    };

    const response = await client.get('/conversations.history', { params });
    this._assertOk(response.data);

    return {
      success: true,
      messages: response.data.messages,
      has_more: response.data.has_more,
    };
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  _buildClient(token) {
    return axios.create({
      baseURL: this.baseUrl,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
      timeout: 15000,
    });
  }

  _assertOk(data) {
    if (!data.ok) {
      throw this.createError(
        `Slack API error: ${data.error || 'unknown_error'}`,
        'SLACK_API_ERROR',
        { slackError: data.error, warning: data.warning }
      );
    }
  }
}

module.exports = SlackAction;
