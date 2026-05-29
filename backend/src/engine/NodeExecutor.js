import { logger } from '../utils/logger.js';
import { getDecryptedCredential } from '../controllers/credential.controller.js';

// Action node implementations
import { GmailAction } from '../nodes/actions/GmailAction.js';
import { SlackAction } from '../nodes/actions/SlackAction.js';
import { WhatsAppAction } from '../nodes/actions/WhatsAppAction.js';
import { TelegramAction } from '../nodes/actions/TelegramAction.js';
import { GoogleSheetsAction } from '../nodes/actions/GoogleSheetsAction.js';
import { HttpRequestAction } from '../nodes/actions/HttpRequestAction.js';
import { OpenAiAction } from '../nodes/actions/OpenAiAction.js';
import { RazorpayAction } from '../nodes/actions/RazorpayAction.js';

// Logic node implementations
import { IfCondition } from '../nodes/logic/IfCondition.js';
import { Switch } from '../nodes/logic/Switch.js';
import { Loop } from '../nodes/logic/Loop.js';
import { Delay } from '../nodes/logic/Delay.js';
import { MergeData } from '../nodes/logic/MergeData.js';

// Trigger node implementations
import { WebhookTrigger } from '../nodes/triggers/WebhookTrigger.js';
import { ScheduleTrigger } from '../nodes/triggers/ScheduleTrigger.js';
import { ManualTrigger } from '../nodes/triggers/ManualTrigger.js';

/**
 * NodeExecutor
 *
 * Resolves the node type → concrete implementation class,
 * injects credentials if needed, calls execute(), and returns output.
 *
 * All node classes follow the same interface:
 *   class XNode extends BaseNode {
 *     async execute(params, context, credentialData?) → any
 *   }
 */
export class NodeExecutor {
  constructor() {
    // Registry maps node type string → implementation class
    this._registry = {
      // Triggers
      webhook:        WebhookTrigger,
      schedule:       ScheduleTrigger,
      manual:         ManualTrigger,

      // Actions
      gmail:          GmailAction,
      slack:          SlackAction,
      whatsapp:       WhatsAppAction,
      telegram:       TelegramAction,
      googleSheets:   GoogleSheetsAction,
      httpRequest:    HttpRequestAction,
      openai:         OpenAiAction,
      razorpay:       RazorpayAction,

      // Logic / flow control
      ifCondition:    IfCondition,
      switch:         Switch,
      loop:           Loop,
      delay:          Delay,
      mergeData:      MergeData,
    };
  }

  /**
   * Execute a single node.
   *
   * @param {object} node       - Full node object from the graph { id, type, data }
   * @param {object} context    - Current execution context { $input, $nodes }
   * @param {string} executionId
   * @returns {Promise<any>}    - The node's output (stored in context.$nodes[nodeId])
   */
  async execute({ node, context, executionId }) {
    const { type, data } = node;
    const params = data?.params || {};
    const credentialId = data?.credentialId || null;
    const userId = data?.userId || context?.$userId;

    // ── 1. Resolve implementation ──────────────────────────────────────────
    const NodeClass = this._registry[type];

    if (!NodeClass) {
      throw new Error(`Unknown node type: "${type}". Is it registered in NodeExecutor?`);
    }

    const instance = new NodeClass();

    // ── 2. Load credential if this node requires one ───────────────────────
    let credentialData = null;

    if (credentialId && userId) {
      try {
        credentialData = await getDecryptedCredential(credentialId, userId);
      } catch (err) {
        throw new Error(
          `Could not load credential for node "${data?.label || type}": ${err.message}`
        );
      }
    }

    // ── 3. Validate required params before execution ───────────────────────
    if (typeof instance.validate === 'function') {
      const validationError = instance.validate(params);
      if (validationError) {
        throw new Error(`Node "${data?.label || type}" validation failed: ${validationError}`);
      }
    }

    // ── 4. Execute with timeout (default 30s, overridable per node) ────────
    const timeoutMs = data?.timeoutMs || 30_000;

    const output = await this._withTimeout(
      instance.execute(params, context, credentialData),
      timeoutMs,
      `Node "${data?.label || type}" timed out after ${timeoutMs}ms`
    );

    logger.debug(`[NodeExecutor] Node ${node.id} (${type}) output:`, output);

    return output;
  }

  // ─── Register a custom node type at runtime ───────────────────────────────
  register(type, NodeClass) {
    if (this._registry[type]) {
      logger.warn(`[NodeExecutor] Overwriting existing node type: ${type}`);
    }
    this._registry[type] = NodeClass;
  }

  // ─── List all registered node types ──────────────────────────────────────
  getRegisteredTypes() {
    return Object.keys(this._registry);
  }

  // ─── Internal: race a promise against a timeout ───────────────────────────
  _withTimeout(promise, ms, message) {
    let timer;
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(message)), ms);
    });

    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
  }
}
