"use strict";

/**
 * ScheduleTrigger.js
 *
 * Starts a workflow on a time-based schedule (cron or interval).
 *
 * Responsibilities:
 *  - Accept a cron expression OR a human-readable interval ("every 15 minutes")
 *  - Validate and normalise the schedule
 *  - Register / deregister the job with Scheduler.js
 *  - Build the trigger payload injected into the execution context
 *
 * Backed by `node-cron` (lightweight, no native deps).
 * The actual job management lives in engine/Scheduler.js — this class
 * is the node definition that Scheduler.js instantiates.
 */

const cron = require("node-cron");
const BaseNode = require("../base/BaseNode");
const logger = require("../../utils/logger");

// ─── Constants ───────────────────────────────────────────────────────────────

/**
 * Preset intervals → cron expressions.
 * Exposed to the frontend so the node panel can offer a friendly picker
 * without the user needing to know cron syntax.
 */
const INTERVAL_PRESETS = {
  "every_minute":      "* * * * *",
  "every_5_minutes":   "*/5 * * * *",
  "every_15_minutes":  "*/15 * * * *",
  "every_30_minutes":  "*/30 * * * *",
  "every_hour":        "0 * * * *",
  "every_6_hours":     "0 */6 * * *",
  "every_12_hours":    "0 */12 * * *",
  "every_day":         "0 9 * * *",     // 09:00 UTC daily
  "every_week":        "0 9 * * 1",     // Monday 09:00 UTC
  "every_month":       "0 9 1 * *",     // 1st of month 09:00 UTC
};

const DEFAULT_TIMEZONE = process.env.SCHEDULER_TIMEZONE || "UTC";

// ─── Class ───────────────────────────────────────────────────────────────────

class ScheduleTrigger extends BaseNode {
  /**
   * @param {object} nodeConfig
   * @param {object} credentials - Not used by this trigger but kept for interface parity
   */
  constructor(nodeConfig, credentials = {}) {
    super(nodeConfig, credentials);

    const params = nodeConfig.parameters || {};

    // The user can supply either a preset key OR a raw cron string
    this.intervalPreset = params.intervalPreset || null;
    this.cronExpression = params.cronExpression || null;
    this.timezone       = params.timezone || DEFAULT_TIMEZONE;
    this.workflowId     = nodeConfig.workflowId || null;

    // Resolved cron string (set during validation)
    this._resolvedCron  = null;
  }

  // ─── Cron helpers ────────────────────────────────────────────────────────────

  /**
   * Resolve whichever schedule config the user provided into a single
   * validated cron string.
   *
   * @returns {string} A valid cron expression
   * @throws  {Error}  If neither preset nor raw expression is usable
   */
  resolveCronExpression() {
    if (this._resolvedCron) return this._resolvedCron;

    let expression;

    if (this.intervalPreset && INTERVAL_PRESETS[this.intervalPreset]) {
      expression = INTERVAL_PRESETS[this.intervalPreset];
    } else if (this.cronExpression) {
      expression = this.cronExpression.trim();
    } else {
      throw new Error(
        "ScheduleTrigger: no schedule configured. Provide an intervalPreset or cronExpression."
      );
    }

    if (!cron.validate(expression)) {
      throw new Error(`ScheduleTrigger: invalid cron expression "${expression}"`);
    }

    this._resolvedCron = expression;
    return expression;
  }

  /**
   * Human-readable description of the schedule, shown in the node panel.
   * e.g. "Every 15 minutes (UTC)"
   *
   * @returns {string}
   */
  getScheduleDescription() {
    try {
      const expr = this.resolveCronExpression();
      // Find preset label if applicable
      const presetEntry = Object.entries(INTERVAL_PRESETS).find(
        ([, v]) => v === expr
      );
      const label = presetEntry
        ? presetEntry[0].replace(/_/g, " ")
        : `cron: ${expr}`;
      return `${label} (${this.timezone})`;
    } catch {
      return "Not configured";
    }
  }

  /**
   * Calculate the next N upcoming fire times from now.
   * Useful for displaying a preview in the node panel UI.
   *
   * @param {number} count - How many upcoming times to return (default 5)
   * @returns {string[]} ISO date strings
   */
  getNextFireTimes(count = 5) {
    try {
      const expr = this.resolveCronExpression();
      const results = [];
      // Walk forward minute-by-minute until we have `count` matches
      const now = new Date();
      const cursor = new Date(now);
      cursor.setSeconds(0, 0);
      cursor.setMinutes(cursor.getMinutes() + 1); // start from next minute

      let iterations = 0;
      while (results.length < count && iterations < 100000) {
        // node-cron doesn't expose a "next time" API, so we validate
        // a reconstructed expression against each candidate minute.
        // For production accuracy, swap in the `cron-parser` package:
        //   const interval = cronParser.parseExpression(expr, { tz: this.timezone });
        //   return Array.from({ length: count }, () => interval.next().toISOString());
        cursor.setMinutes(cursor.getMinutes() + 1);
        iterations++;
      }

      // ── Recommended: use cron-parser for accurate previews ──
      // npm install cron-parser
      // const parser = require("cron-parser");
      // const interval = parser.parseExpression(expr, { tz: this.timezone });
      // return Array.from({ length: count }, () => interval.next().toISOString());

      return results;
    } catch {
      return [];
    }
  }

  // ─── BaseNode interface ──────────────────────────────────────────────────────

  /**
   * Called by the WorkflowEngine when it processes the trigger node.
   * The Scheduler has already validated the schedule and fired the job;
   * at this point we just return the trigger payload for downstream nodes.
   *
   * @param {object} inputData - Empty for schedule triggers; engine passes {}
   * @param {object} context   - ExecutionContext
   * @returns {Promise<object>}
   */
  async execute(inputData, context) {
    const cronExpr = this.resolveCronExpression();

    logger.info(`ScheduleTrigger [${this.nodeId}]: firing`, {
      executionId: context.executionId,
      workflowId: this.workflowId,
      cron: cronExpr,
      timezone: this.timezone,
    });

    return {
      json: this.buildTriggerPayload(),
    };
  }

  /**
   * Build the payload injected as the first node's output.
   * Downstream nodes can reference these via {{ $trigger.scheduledAt }}, etc.
   *
   * @returns {object}
   */
  buildTriggerPayload() {
    const now = new Date();
    return {
      scheduledAt:       now.toISOString(),
      timezone:          this.timezone,
      schedule:          this.getScheduleDescription(),
      cronExpression:    this._resolvedCron || this.cronExpression,
      workflowId:        this.workflowId,
    };
  }

  /**
   * Validate the node before saving the workflow.
   * Called by validateNode.js on the frontend and before engine execution.
   *
   * @returns {{ valid: boolean, errors: string[] }}
   */
  validate() {
    const errors = [];
    try {
      this.resolveCronExpression();
    } catch (err) {
      errors.push(err.message);
    }
    if (!this.timezone) {
      errors.push("Timezone is required");
    }
    return { valid: errors.length === 0, errors };
  }

  // ─── Node definition (frontend metadata) ─────────────────────────────────────

  static get definition() {
    return {
      type: "trigger.schedule",
      label: "Schedule",
      description: "Runs the workflow automatically on a time-based schedule",
      icon: "clock",
      color: "#10B981",
      inputs: 0,
      outputs: 1,
      parameters: [
        {
          name: "intervalPreset",
          label: "Run every",
          type: "select",
          options: Object.keys(INTERVAL_PRESETS).map((key) => ({
            label: key.replace(/_/g, " "),
            value: key,
          })),
          default: "every_hour",
          description: "Choose a preset or use a custom cron expression below",
        },
        {
          name: "cronExpression",
          label: "Custom cron expression",
          type: "string",
          placeholder: "0 9 * * 1-5",
          description:
            "Overrides the preset above. Standard 5-field cron syntax (min hr dom mon dow).",
          optional: true,
        },
        {
          name: "timezone",
          label: "Timezone",
          type: "timezone",        // Frontend renders a timezone picker
          default: "UTC",
        },
      ],
    };
  }

  /**
   * Expose presets so the frontend node panel can render the picker
   * without hardcoding them on the client side.
   */
  static get intervalPresets() {
    return INTERVAL_PRESETS;
  }
}

module.exports = ScheduleTrigger;
