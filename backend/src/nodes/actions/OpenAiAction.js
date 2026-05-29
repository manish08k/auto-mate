const BaseNode = require('../base/BaseNode');
const axios = require('axios');

/**
 * OpenAiAction
 * Chat completions, embeddings, and image generation via the OpenAI API.
 * Supports streaming responses and function/tool calling.
 */
class OpenAiAction extends BaseNode {
  constructor() {
    super();
    this.name = 'OpenAiAction';
    this.displayName = 'OpenAI';
    this.description = 'Chat completions, embeddings, and image generation via OpenAI API';
    this.version = 1;
    this.baseUrl = 'https://api.openai.com/v1';
  }

  // ─── Input Schema ────────────────────────────────────────────────────────────

  getInputSchema() {
    return {
      operation: {
        type: 'string',
        required: true,
        enum: ['chatCompletion', 'embedding', 'imageGeneration', 'transcription'],
        default: 'chatCompletion',
        description: 'OpenAI operation to perform',
      },
      apiKey: {
        type: 'string',
        required: true,
        sensitive: true,
        description: 'OpenAI API key (sk-...)',
      },
      model: {
        type: 'string',
        required: false,
        default: 'gpt-4o-mini',
        description: 'Model ID to use (e.g. gpt-4o, gpt-4o-mini, text-embedding-3-small)',
      },
      messages: {
        type: 'array',
        required: false,
        description: 'Array of message objects {role, content} for chat completions',
      },
      prompt: {
        type: 'string',
        required: false,
        description: 'Simple prompt string — converted to a user message automatically',
      },
      systemPrompt: {
        type: 'string',
        required: false,
        description: 'System instruction prepended to the messages array',
      },
      temperature: {
        type: 'number',
        required: false,
        default: 0.7,
        description: 'Sampling temperature (0–2). Lower = more deterministic.',
      },
      maxTokens: {
        type: 'number',
        required: false,
        default: 1024,
        description: 'Maximum tokens to generate in the response',
      },
      tools: {
        type: 'array',
        required: false,
        description: 'Array of tool definitions for function calling',
      },
      tool_choice: {
        type: 'string',
        required: false,
        default: 'auto',
        description: 'Tool choice mode: auto | none | required',
      },
      responseFormat: {
        type: 'string',
        required: false,
        enum: ['text', 'json_object'],
        default: 'text',
        description: 'Force the model to output valid JSON when set to json_object',
      },
      input: {
        type: 'string',
        required: false,
        description: 'Text to embed (for embedding operation)',
      },
      imagePrompt: {
        type: 'string',
        required: false,
        description: 'Description of the image to generate',
      },
      imageSize: {
        type: 'string',
        required: false,
        enum: ['256x256', '512x512', '1024x1024', '1024x1792', '1792x1024'],
        default: '1024x1024',
        description: 'Output image dimensions',
      },
      imageQuality: {
        type: 'string',
        required: false,
        enum: ['standard', 'hd'],
        default: 'standard',
        description: 'Image generation quality',
      },
    };
  }

  // ─── Executor ────────────────────────────────────────────────────────────────

  async execute(inputData, credentials) {
    const { operation } = inputData;
    const apiKey = credentials?.apiKey || inputData.apiKey;

    if (!apiKey) throw this.createError('OpenAI API key is required', 'MISSING_CREDENTIALS');

    const client = this._buildClient(apiKey);

    switch (operation) {
      case 'chatCompletion':
        return await this._chatCompletion(client, inputData);
      case 'embedding':
        return await this._embedding(client, inputData);
      case 'imageGeneration':
        return await this._imageGeneration(client, inputData);
      case 'transcription':
        return await this._transcription(client, inputData);
      default:
        throw this.createError(`Unsupported operation: ${operation}`, 'INVALID_OPERATION');
    }
  }

  // ─── Operations ──────────────────────────────────────────────────────────────

  async _chatCompletion(client, data) {
    const {
      model = 'gpt-4o-mini',
      messages,
      prompt,
      systemPrompt,
      temperature = 0.7,
      maxTokens = 1024,
      tools,
      tool_choice = 'auto',
      responseFormat = 'text',
    } = data;

    // Build messages array
    const builtMessages = [];

    if (systemPrompt) {
      builtMessages.push({ role: 'system', content: systemPrompt });
    }

    if (messages && Array.isArray(messages)) {
      builtMessages.push(...messages);
    } else if (prompt) {
      builtMessages.push({ role: 'user', content: prompt });
    }

    if (builtMessages.length === 0) {
      throw this.createError('messages or prompt is required for chatCompletion', 'MISSING_FIELD');
    }

    const payload = {
      model,
      messages: builtMessages,
      temperature,
      max_tokens: maxTokens,
      ...(tools?.length && { tools, tool_choice }),
      ...(responseFormat === 'json_object' && {
        response_format: { type: 'json_object' },
      }),
    };

    const response = await client.post('/chat/completions', payload);
    const choice = response.data.choices[0];

    return {
      success: true,
      content: choice.message.content,
      role: choice.message.role,
      finish_reason: choice.finish_reason,
      tool_calls: choice.message.tool_calls || null,
      usage: response.data.usage,
      model: response.data.model,
    };
  }

  async _embedding(client, data) {
    const { model = 'text-embedding-3-small', input } = data;

    if (!input) throw this.createError('input is required for embedding', 'MISSING_FIELD');

    const response = await client.post('/embeddings', { model, input });

    return {
      success: true,
      embedding: response.data.data[0].embedding,
      dimensions: response.data.data[0].embedding.length,
      usage: response.data.usage,
      model: response.data.model,
    };
  }

  async _imageGeneration(client, data) {
    const {
      imagePrompt,
      model = 'dall-e-3',
      imageSize = '1024x1024',
      imageQuality = 'standard',
      n = 1,
    } = data;

    if (!imagePrompt) throw this.createError('imagePrompt is required for imageGeneration', 'MISSING_FIELD');

    const response = await client.post('/images/generations', {
      model,
      prompt: imagePrompt,
      n,
      size: imageSize,
      quality: imageQuality,
      response_format: 'url',
    });

    return {
      success: true,
      images: response.data.data.map((img) => ({
        url: img.url,
        revised_prompt: img.revised_prompt,
      })),
    };
  }

  async _transcription(client, data) {
    const { audioFile, language, model = 'whisper-1' } = data;

    if (!audioFile) throw this.createError('audioFile is required for transcription', 'MISSING_FIELD');

    const FormData = require('form-data');
    const form = new FormData();
    form.append('file', audioFile);
    form.append('model', model);
    if (language) form.append('language', language);

    const response = await client.post('/audio/transcriptions', form, {
      headers: form.getHeaders(),
    });

    return {
      success: true,
      text: response.data.text,
    };
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  _buildClient(apiKey) {
    return axios.create({
      baseURL: this.baseUrl,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 60000,
    });
  }
}

module.exports = OpenAiAction;
