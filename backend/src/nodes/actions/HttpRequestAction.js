const BaseNode = require('../base/BaseNode');
const axios = require('axios');

/**
 * HttpRequestAction
 * Makes HTTP/HTTPS requests with full control over method, headers,
 * body, auth schemes, and retry strategy.
 */
class HttpRequestAction extends BaseNode {
  constructor() {
    super();
    this.name = 'HttpRequestAction';
    this.displayName = 'HTTP Request';
    this.description = 'Make any HTTP/HTTPS request to external APIs or services';
    this.version = 1;
  }

  // ─── Input Schema ────────────────────────────────────────────────────────────

  getInputSchema() {
    return {
      url: {
        type: 'string',
        required: true,
        description: 'Full URL including protocol (https://...)',
      },
      method: {
        type: 'string',
        required: true,
        enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
        default: 'GET',
        description: 'HTTP method',
      },
      headers: {
        type: 'object',
        required: false,
        description: 'Key-value map of request headers',
        default: {},
      },
      queryParams: {
        type: 'object',
        required: false,
        description: 'Key-value map of URL query parameters',
        default: {},
      },
      body: {
        type: 'object',
        required: false,
        description: 'Request body. Sent as JSON by default.',
      },
      bodyType: {
        type: 'string',
        required: false,
        enum: ['json', 'form-urlencoded', 'multipart', 'raw'],
        default: 'json',
        description: 'How to encode the request body',
      },
      authType: {
        type: 'string',
        required: false,
        enum: ['none', 'bearer', 'basic', 'apiKey'],
        default: 'none',
        description: 'Authentication scheme',
      },
      authValue: {
        type: 'string',
        required: false,
        sensitive: true,
        description: 'Token, password, or API key depending on authType',
      },
      authHeader: {
        type: 'string',
        required: false,
        default: 'Authorization',
        description: 'Header name for apiKey auth (default: Authorization)',
      },
      timeout: {
        type: 'number',
        required: false,
        default: 30000,
        description: 'Request timeout in milliseconds',
      },
      retries: {
        type: 'number',
        required: false,
        default: 0,
        description: 'Number of retry attempts on failure (max 5)',
      },
      retryDelay: {
        type: 'number',
        required: false,
        default: 1000,
        description: 'Delay in ms between retries (exponential backoff applied)',
      },
      followRedirects: {
        type: 'boolean',
        required: false,
        default: true,
        description: 'Follow HTTP redirects automatically',
      },
      responseType: {
        type: 'string',
        required: false,
        enum: ['json', 'text', 'arraybuffer'],
        default: 'json',
        description: 'Expected response format',
      },
    };
  }

  // ─── Executor ────────────────────────────────────────────────────────────────

  async execute(inputData) {
    const {
      url,
      method = 'GET',
      headers = {},
      queryParams = {},
      body,
      bodyType = 'json',
      authType = 'none',
      authValue,
      authHeader = 'Authorization',
      timeout = 30000,
      retries = 0,
      retryDelay = 1000,
      followRedirects = true,
      responseType = 'json',
    } = inputData;

    if (!url) throw this.createError('url is required', 'MISSING_FIELD');

    const maxRetries = Math.min(retries, 5);
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = retryDelay * Math.pow(2, attempt - 1);
          await this._sleep(delay);
        }

        const config = this._buildConfig({
          url,
          method,
          headers,
          queryParams,
          body,
          bodyType,
          authType,
          authValue,
          authHeader,
          timeout,
          followRedirects,
          responseType,
        });

        const response = await axios(config);

        return {
          success: true,
          statusCode: response.status,
          statusText: response.statusText,
          headers: response.headers,
          data: response.data,
          attempt: attempt + 1,
        };
      } catch (err) {
        lastError = err;
        const status = err.response?.status;

        // Don't retry on client errors (4xx) except 429
        if (status && status >= 400 && status < 500 && status !== 429) break;
      }
    }

    throw this.createError(
      `HTTP request failed: ${lastError?.message}`,
      'HTTP_ERROR',
      {
        statusCode: lastError?.response?.status,
        responseData: lastError?.response?.data,
        attempts: maxRetries + 1,
      }
    );
  }

  // ─── Config Builder ───────────────────────────────────────────────────────────

  _buildConfig({ url, method, headers, queryParams, body, bodyType, authType, authValue, authHeader, timeout, followRedirects, responseType }) {
    const config = {
      url,
      method: method.toUpperCase(),
      headers: { ...headers },
      params: queryParams,
      timeout,
      maxRedirects: followRedirects ? 5 : 0,
      responseType,
      validateStatus: () => true, // handle all status codes manually
    };

    // Auth
    if (authType === 'bearer' && authValue) {
      config.headers['Authorization'] = `Bearer ${authValue}`;
    } else if (authType === 'basic' && authValue) {
      const [user, pass] = authValue.split(':');
      config.auth = { username: user || '', password: pass || '' };
    } else if (authType === 'apiKey' && authValue) {
      config.headers[authHeader] = authValue;
    }

    // Body
    if (body && !['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase())) {
      if (bodyType === 'json') {
        config.data = body;
        config.headers['Content-Type'] = 'application/json';
      } else if (bodyType === 'form-urlencoded') {
        config.data = new URLSearchParams(body).toString();
        config.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      } else if (bodyType === 'raw') {
        config.data = body;
      }
    }

    return config;
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = HttpRequestAction;
