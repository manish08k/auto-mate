import { logger } from '../../utils/logger.js';

/**
 * BaseNode
 *
 * All trigger, action, and logic nodes extend this class.
 *
 * Subclass contract:
 *   - Define static `type`        → unique string id  e.g. 'gmail'
 *   - Define static `displayName` → shown in the UI   e.g. 'Gmail'
 *   - Define static `category`    → 'trigger' | 'action' | 'logic'
 *   - Define static `icon`        → icon name or url
 *   - Override `defineParams()`   → return param schema array
 *   - Override `execute()`        → implement the node logic
 *   - Override `validate()`       → optional extra validation
 */
export class BaseNode {
  // ─── Metadata (override in subclass) ──────────────────────────────────────
  static type        = 'base';
  static displayName = 'Base Node';
  static category    = 'action';       // 'trigger' | 'action' | 'logic'
  static icon        = 'box';
  static color       = '#3F3F46';
  static description = '';
  static docsUrl     = '';

  // Whether this node requires an OAuth / API key credential
  static requiresCredential = false;
  static credentialProvider = null;    // e.g. 'gmail', 'slack'

  // ─── Constructor ──────────────────────────────────────────────────────────
  constructor() {
    this.type        = this.constructor.type;
    this.displayName = this.constructor.displayName;
    this.category    = this.constructor.category;
  }

  // ─── Param schema ─────────────────────────────────────────────────────────
  /**
   * Return an array of parameter definitions used by:
   *  - The NodePanel UI to render form fields
   *  - validate() to check required fields
   *
   * Each entry:
   * {
   *   key:          string    — param key in node.data.params
   *   label:        string    — UI label
   *   type:         'string' | 'number' | 'boolean' | 'select' |
   *                 'textarea' | 'code' | 'credential' | 'json'
   *   required:     boolean
   *   default:      any
   *   placeholder:  string
   *   description:  string
   *   options:      [{ label, value }]   — for type 'select'
   *   rows:         number               — for type 'textarea' | 'code'
   * }
   */
  defineParams() {
    return [];
  }

  // ─── Validation ───────────────────────────────────────────────────────────
  /**
   * Validate params before execution.
   * Called by NodeExecutor before execute().
   *
   * @param {object} params - Resolved params from node.data.params
   * @returns {string|null}  Error message string, or null if valid
   */
  validate(params) {
    const schema = this.defineParams();

    for (const field of schema) {
      if (field.required) {
        const val = params[field.key];
        const isEmpty =
          val === undefined ||
          val === null ||
          (typeof val === 'string' && val.trim() === '');

        if (isEmpty) {
          return `"${field.label || field.key}" is required`;
        }
      }
    }

    return null;
  }

  // ─── Execute (must override) ───────────────────────────────────────────────
  /**
   * Run the node logic.
   *
   * @param {object}      params          - Resolved params (expressions already evaluated)
   * @param {object}      context         - Execution context { $input, $nodes, $userId }
   * @param {object|null} credentialData  - Decrypted credential data (null if not needed)
   * @returns {Promise<any>}              - Output stored in context.$nodes[nodeId].output
   */
  async execute(params, context, credentialData) {
    throw new Error(`Node "${this.type}" must implement execute()`);
  }

  // ─── Optional lifecycle hooks ──────────────────────────────────────────────
  /**
   * Called once when the workflow is activated (isEnabled → true).
   * Use for things like registering a webhook with a third-party service.
   */
  async onActivate(params, credentialData) {}

  /**
   * Called once when the workflow is deactivated (isEnabled → false).
   * Use for cleanup — deregistering webhooks etc.
   */
  async onDeactivate(params, credentialData) {}

  // ─── Shared helpers available to all subclasses ───────────────────────────

  /**
   * Make a fetch request with automatic error handling.
   * Throws a descriptive error if the response is not ok.
   */
  async request(url, options = {}) {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options,
    });

    if (!res.ok) {
      let body = '';
      try { body = await res.text(); } catch {}
      throw new Error(`HTTP ${res.status} from ${url}: ${body.slice(0, 200)}`);
    }

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return res.json();
    }

    return res.text();
  }

  /**
   * Resolve a value that might be a static default or come from params.
   * Falls back to defaultValue if param is empty.
   */
  param(params, key, defaultValue = null) {
    const val = params?.[key];
    if (val === undefined || val === null || val === '') return defaultValue;
    return val;
  }

  /**
   * Sleep for a given number of milliseconds.
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Log a message scoped to this node type.
   */
  log(message, level = 'info') {
    logger[level]?.(`[${this.displayName}] ${message}`);
  }

  /**
   * Return a standardised output envelope.
   * Nodes can return raw data too — this is just a convention helper.
   */
  output(data, meta = {}) {
    return {
      ...data,
      _meta: {
        nodeType: this.type,
        timestamp: new Date().toISOString(),
        ...meta,
      },
    };
  }

  /**
   * Serialize this node's definition for the frontend node picker.
   */
  toJSON() {
    return {
      type:                this.constructor.type,
      displayName:         this.constructor.displayName,
      category:            this.constructor.category,
      icon:                this.constructor.icon,
      color:               this.constructor.color,
      description:         this.constructor.description,
      docsUrl:             this.constructor.docsUrl,
      requiresCredential:  this.constructor.requiresCredential,
      credentialProvider:  this.constructor.credentialProvider,
      params:              this.defineParams(),
    };
  }
}