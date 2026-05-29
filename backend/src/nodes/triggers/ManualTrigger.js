"use strict";

/**
 * ManualTrigger.js
 *
 * Starts a workflow on demand — either:
 *  (a) A user clicks "Run" in the canvas UI, or
 *  (b) A direct API call hits POST /api/workflows/:workflowId/execute
 *
 * This is the simplest trigger but the most important for:
 *  - Development and testing (run without setting up a webhook/schedule)
 *  - User-initiated automations ("run now" button in a product)
 *  - One-off / ad-hoc executions triggered by internal tooling
 *
 * Supports optional input data so callers can inject test payloads or
 * dynamic values without hardcoding them inside the workflow nodes.
 */

const BaseNode = require("../base/BaseNode");
const logger = require("../../utils/logger");

// ─── Class ───────────────────────────────────────────────────────────────────

class ManualTrigger extends BaseNode {
  /**
   * @param {object} nodeConfig
   * @param {object} credentials - Unused; here for interface parity with other triggers
   */
  constructor(nodeConfig, credentials = {}) {
    super(nodeConfig, credentials);

    const params = nodeConfig.parameters || {};

    /**
     * Schema of expected input fields shown in the "Run with input" modal.
     * Each entry defines a field the user fills in before clicking Run.
     *
     * Example entry:
     * { name: "email", label: "Customer Email", type: "string", required: true }
     */
    this.inputSchema = params.inputSchema || [];

    /**
     * Optional static test data saved alongside the node config.
     * Pre-fills the "Run with input" modal in the canvas.
     */
    this.testData = params.testData || {};
  }

  // ─── Core methods ────────────────────────────────────────────────────────────

  /**
   * Build the trigger payload.
   *
   * @param {object} providedData - Data submitted by the user via the Run modal
   *                                or the API request body. Falls back to testData.
   * @param {object} meta         - Caller metadata (userId, source, etc.)
   * @returns {object}
   */
  buildTriggerPayload(providedData = {}, meta = {}) {
    const data = Object.keys(providedData).length > 0
      ? providedData
      : this.testData;

    return {
      data,
      triggeredAt: new Date().toISOString(),
      triggeredBy: {
        userId:  meta.userId  || null,
        source:  meta.source  || "manual",   // "manual" | "api" | "test"
        ip:      meta.ip      || null,
      },
    };
  }

  /**
   * Validate that all required input schema fields are present in the data.
   *
   * @param {object} data - The input data to validate
   * @returns {{ valid: boolean, errors: string[] }}
   */
  validateInputData(data = {}) {
    const errors = [];

    for (const field of this.inputSchema) {
      if (field.required && (data[field.name] === undefined || data[field.name] === "")) {
        errors.push(`Required field "${field.label || field.name}" is missing`);
      }

      // Basic type coercion checks
      if (data[field.name] !== undefined) {
        if (field.type === "number" && isNaN(Number(data[field.name]))) {
          errors.push(`Field "${field.label || field.name}" must be a number`);
        }
        if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data[field.name])) {
          errors.push(`Field "${field.label || field.name}" must be a valid email`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  // ─── BaseNode interface ──────────────────────────────────────────────────────

  /**
   * Called by the WorkflowEngine when it processes this trigger node.
   * The engine sets context.triggerPayload before calling execute(), so we
   * just return it as this node's output for downstream nodes to consume.
   *
   * @param {object} inputData - Trigger payload set by the engine on context
   * @param {object} context   - ExecutionContext
   * @returns {Promise<object>}
   */
  async execute(inputData, context) {
    logger.info(`ManualTrigger [${this.nodeId}]: executing`, {
      executionId: context.executionId,
      workflowId: this.workflowId,
      source: inputData?.triggeredBy?.source,
    });

    // If the engine passed a pre-built payload (from the route controller),
    // use it; otherwise fall back to testData with no caller metadata.
    const payload = inputData && Object.keys(inputData).length > 0
      ? inputData
      : this.buildTriggerPayload();

    return {
      json: payload,
    };
  }

  /**
   * Node-level validation (called before saving the workflow).
   * ManualTrigger is always valid — schema fields are optional config.
   *
   * @returns {{ valid: boolean, errors: string[] }}
   */
  validate() {
    const errors = [];

    for (const field of this.inputSchema) {
      if (!field.name || typeof field.name !== "string") {
        errors.push("Each input schema field must have a 'name' string");
      }
      const allowedTypes = ["string", "number", "boolean", "email", "json", "date"];
      if (field.type && !allowedTypes.includes(field.type)) {
        errors.push(
          `Field "${field.name}" has unsupported type "${field.type}". Allowed: ${allowedTypes.join(", ")}`
        );
      }
    }

    return { valid: errors.length === 0, errors };
  }

  // ─── Node definition (frontend metadata) ─────────────────────────────────────

  static get definition() {
    return {
      type: "trigger.manual",
      label: "Manual Trigger",
      description:
        "Run this workflow manually from the canvas or via the API. Optionally define input fields.",
      icon: "play",
      color: "#8B5CF6",
      inputs: 0,
      outputs: 1,
      parameters: [
        {
          name: "inputSchema",
          label: "Input Fields",
          type: "schemaBuilder",           // Custom UI component: a dynamic field list builder
          default: [],
          description:
            "Define fields that the user fills in when triggering this workflow. " +
            "Each field is available to downstream nodes as {{ $trigger.data.fieldName }}",
          optional: true,
        },
        {
          name: "testData",
          label: "Test Data",
          type: "json",
          default: {},
          description:
            "Pre-filled values for the Run modal. Useful for development. " +
            "Only used when no live data is provided.",
          optional: true,
        },
      ],
    };
  }
}

module.exports = ManualTrigger;
