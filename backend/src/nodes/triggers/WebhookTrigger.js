import { BaseNode } from '../BaseNode.js';
import { logger } from '../../utils/logger.js';
import crypto from 'crypto';

export class WebhookTrigger extends BaseNode {
  static type                = 'webhook';
  static displayName         = 'Webhook';
  static category            = 'trigger';
  static icon                = 'webhook';
  static color               = '#6366F1';
  static description         = 'Starts the workflow when an HTTP request hits the webhook URL.';
  static requiresCredential  = false;

  defineParams() {
    return [
      {
        key:         'method',
        label:       'HTTP Method',
        type:        'select',
        required:    true,
        default:     'POST',
        options: [
          { label: 'POST', value: 'POST' },
          { label: 'GET',  value: 'GET'  },
          { label: 'PUT',  value: 'PUT'  },
        ],
      },
      {
        key:         'responseMode',
        label:       'Response mode',
        type:        'select',
        required:    true,
        default:     'onReceived',
        description: 'When to send the HTTP response back to the caller.',
        options: [
          { label: 'Immediately on receive', value: 'onReceived'  },
          { label: 'After workflow finishes', value: 'lastNode'   },
        ],
      },
      {
        key:         'responseCode',
        label:       'Response status code',
        type:        'number',
        required:    false,
        default:     200,
      },
      {
        key:         'responseBody',
        label:       'Response body',
        type:        'textarea',
        required:    false,
        default:     '{"received": true}',
        placeholder: '{"received": true}',
        rows:        3,
      },
      {
        key:         'secretToken',
        label:       'Secret token (optional)',
        type:        'string',
        required:    false,
        placeholder: 'Used to verify the X-Webhook-Secret header',
        description: 'If set, incoming requests must include this value in X-Webhook-Secret.',
      },
      {
        key:         'rawBody',
        label:       'Return raw body',
        type:        'boolean',
        required:    false,
        default:     false,
        description: 'Return the raw string body instead of parsed JSON.',
      },
    ];
  }

  /**
   * execute() is called by WorkflowEngine when a webhook request comes in.
   * The Express webhook route (webhook.routes.js) puts the request data
   * into inputData before queuing — so by the time we run, context.$input
   * already contains { body, headers, query, params, method }.
   *
   * This node normalises that data and passes it downstream.
   */
  async execute(params, context, _credentialData) {
    const { body = {}, headers = {}, query = {}, method = 'POST' } = context.$input;

    // Verify secret token if configured
    const secretToken = this.param(params, 'secretToken');
    if (secretToken) {
      const incoming = headers['x-webhook-secret'] || headers['X-Webhook-Secret'] || '';
      const valid = crypto.timingSafeEqual(
        Buffer.from(incoming),
        Buffer.from(secretToken)
      );
      if (!valid) {
        throw new Error('Webhook secret token mismatch — request rejected');
      }
    }

    const rawBody = this.param(params, 'rawBody', false);

    const output = {
      body:       rawBody ? JSON.stringify(body) : body,
      headers,
      query,
      method,
      receivedAt: new Date().toISOString(),
    };

    this.log(`Webhook triggered via ${method}`);

    return this.output(output, { trigger: 'webhook' });
  }

  /**
   * Generate a unique webhook path for a workflow.
   * Called when a workflow is saved with a webhook trigger node.
   */
  static generateWebhookPath(workflowId) {
    const token = crypto.randomBytes(16).toString('hex');
    return `/webhook/${workflowId}/${token}`;
  }

  /**
   * onActivate — nothing to register externally; the Express route
   * at /webhook/:workflowId/:token handles all incoming requests.
   */
  async onActivate(params, _credentialData) {
    this.log('Webhook trigger activated — listening for requests');
  }

  async onDeactivate(params, _credentialData) {
    this.log('Webhook trigger deactivated');
  }
}
