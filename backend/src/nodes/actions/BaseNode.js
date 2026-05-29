/**
 * BaseNode
 * Abstract base class that every trigger, action, and logic node extends.
 * Provides shared error handling, schema validation, and lifecycle hooks.
 */
class BaseNode {
  constructor() {
    if (new.target === BaseNode) {
      throw new Error('BaseNode is abstract — instantiate a subclass instead.');
    }

    this.name = 'BaseNode';
    this.displayName = 'Base Node';
    this.description = '';
    this.version = 1;
  }

  // ─── Lifecycle (override in subclass) ────────────────────────────────────────

  /**
   * Return the JSON schema describing accepted input fields.
   * @returns {Object}
   */
  getInputSchema() {
    return {};
  }

  /**
   * Execute the node with resolved input data and optional credentials.
   * Must be overridden by every concrete node class.
   *
   * @param {Object} inputData   - Resolved key-value map of input fields
   * @param {Object} credentials - Decrypted credential values (optional)
   * @returns {Promise<Object>}  - Output data passed to the next node
   */
  async execute(inputData, credentials) {
    throw new Error(`${this.name}.execute() is not implemented.`);
  }

  // ─── Validation ───────────────────────────────────────────────────────────────

  /**
   * Validate inputData against the node's input schema.
   * Throws a structured error on the first missing required field.
   *
   * @param {Object} inputData
   */
  validate(inputData) {
    const schema = this.getInputSchema();

    for (const [field, rules] of Object.entries(schema)) {
      if (rules.required && (inputData[field] === undefined || inputData[field] === null || inputData[field] === '')) {
        throw this.createError(`"${field}" is required`, 'VALIDATION_ERROR', { field });
      }

      if (inputData[field] !== undefined && rules.enum && !rules.enum.includes(inputData[field])) {
        throw this.createError(
          `"${field}" must be one of: ${rules.enum.join(', ')}`,
          'VALIDATION_ERROR',
          { field, received: inputData[field], allowed: rules.enum }
        );
      }
    }
  }

  /**
   * Apply default values from the schema to any missing fields.
   *
   * @param {Object} inputData
   * @returns {Object} inputData with defaults applied
   */
  applyDefaults(inputData) {
    const schema = this.getInputSchema();
    const result = { ...inputData };

    for (const [field, rules] of Object.entries(schema)) {
      if (result[field] === undefined && rules.default !== undefined) {
        result[field] = rules.default;
      }
    }

    return result;
  }

  // ─── Error Factory ────────────────────────────────────────────────────────────

  /**
   * Create a structured NodeError with a code and optional metadata.
   *
   * @param {string} message
   * @param {string} code        - Machine-readable error code (e.g. MISSING_FIELD)
   * @param {Object} [meta={}]   - Extra context attached to the error
   * @returns {NodeError}
   */
  createError(message, code = 'NODE_ERROR', meta = {}) {
    const err = new Error(message);
    err.name = 'NodeError';
    err.code = code;
    err.nodeName = this.name;
    err.meta = meta;
    return err;
  }

  // ─── Utilities ────────────────────────────────────────────────────────────────

  /**
   * Return a plain-object description of this node for the UI / registry.
   */
  describe() {
    return {
      name: this.name,
      displayName: this.displayName,
      description: this.description,
      version: this.version,
      schema: this.getInputSchema(),
    };
  }

  /**
   * Sleep helper for retry/delay logic inside subclass execute methods.
   *
   * @param {number} ms
   * @returns {Promise<void>}
   */
  _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = BaseNode;
