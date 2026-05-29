import { logger } from '../utils/logger.js';

/**
 * ErrorHandler
 *
 * Called by WorkflowEngine whenever a node throws.
 * Returns a decision string that tells the engine what to do next:
 *
 *   'abort'    → stop the entire execution, mark it failed
 *   'continue' → log the error, skip this node, keep running
 *   'retry'    → wait and re-run the node (handled inline)
 *
 * Each node can configure its own error strategy in node.data.onError:
 *   {
 *     strategy:   'abort' | 'continue' | 'retry'
 *     maxRetries: 3          (only for 'retry')
 *     retryDelay: 1000       (ms, only for 'retry')
 *     retryBackoff: true     (exponential backoff)
 *   }
 *
 * Default (if nothing configured): 'abort'
 */
export class ErrorHandler {
  /**
   * Handle a node-level error.
   * If strategy is 'retry', this method runs the retries internally
   * and returns 'abort' if all retries are exhausted, 'continue' if
   * a retry eventually succeeded (caller gets the result via resolve),
   * but since retries need the executor, this method returns a decision
   * and the engine is responsible for retrying via retryNode().
   *
   * @param {object} options
   * @param {object} options.node         - The node that failed
   * @param {Error}  options.error        - The error thrown
   * @param {string} options.executionId
   * @param {object} options.context      - Current execution context
   * @returns {Promise<'abort'|'continue'>}
   */
  async handleNodeError({ node, error, executionId, context }) {
    const config = node.data?.onError || {};
    const strategy = config.strategy || 'abort';
    const nodeLabel = node.data?.label || node.type || node.id;

    logger.warn(
      `[ErrorHandler] Node "${nodeLabel}" failed in execution ${executionId}: ${error.message} | strategy: ${strategy}`
    );

    switch (strategy) {
      case 'continue':
        logger.info(`[ErrorHandler] Continuing after error in node "${nodeLabel}"`);
        return 'continue';

      case 'retry':
        // Retry is handled by the engine calling retryWithBackoff()
        // We return 'abort' here because if we reach handleNodeError
        // it means all retries are already exhausted (engine calls
        // retryWithBackoff first, then only calls handleNodeError on final fail)
        logger.warn(`[ErrorHandler] All retries exhausted for node "${nodeLabel}"`);
        return 'abort';

      case 'abort':
      default:
        logger.error(`[ErrorHandler] Aborting execution ${executionId} due to node "${nodeLabel}"`);
        return 'abort';
    }
  }

  /**
   * Retry a node execution with optional exponential backoff.
   * Called by WorkflowEngine before handleNodeError.
   *
   * @param {Function} fn          - Async function that runs the node: () => Promise<output>
   * @param {object}   retryConfig - { maxRetries, retryDelay, retryBackoff }
   * @param {string}   nodeLabel   - For logging
   * @returns {Promise<{ success: boolean, output?: any, error?: Error }>}
   */
  async retryWithBackoff(fn, retryConfig, nodeLabel) {
    const maxRetries = retryConfig.maxRetries ?? 3;
    const baseDelay = retryConfig.retryDelay ?? 1000;
    const useBackoff = retryConfig.retryBackoff ?? true;

    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info(`[ErrorHandler] Retry ${attempt}/${maxRetries} for node "${nodeLabel}"`);
        const output = await fn();
        logger.info(`[ErrorHandler] Retry ${attempt} succeeded for node "${nodeLabel}"`);
        return { success: true, output };
      } catch (err) {
        lastError = err;
        logger.warn(
          `[ErrorHandler] Retry ${attempt}/${maxRetries} failed for node "${nodeLabel}": ${err.message}`
        );

        if (attempt < maxRetries) {
          const delay = useBackoff
            ? baseDelay * Math.pow(2, attempt - 1)   // 1s, 2s, 4s, 8s...
            : baseDelay;
          await this._sleep(delay);
        }
      }
    }

    return { success: false, error: lastError };
  }

  /**
   * Classify an error to give better log context.
   *
   * @param {Error} err
   * @returns {{ type: string, isRetryable: boolean }}
   */
  classifyError(err) {
    const message = err.message || '';

    // Network / transient errors → retryable
    if (
      message.includes('ECONNRESET') ||
      message.includes('ETIMEDOUT') ||
      message.includes('ENOTFOUND') ||
      message.includes('socket hang up') ||
      message.includes('rate limit') ||
      message.includes('429') ||
      message.includes('503') ||
      message.includes('502')
    ) {
      return { type: 'network', isRetryable: true };
    }

    // Auth errors → not retryable (need human intervention)
    if (
      message.includes('401') ||
      message.includes('403') ||
      message.includes('invalid_grant') ||
      message.includes('token expired') ||
      message.includes('Unauthorized')
    ) {
      return { type: 'auth', isRetryable: false };
    }

    // Validation errors → not retryable
    if (
      message.includes('validation') ||
      message.includes('400') ||
      message.includes('required') ||
      message.includes('invalid param')
    ) {
      return { type: 'validation', isRetryable: false };
    }

    // Timeout → retryable
    if (message.includes('timed out') || message.includes('timeout')) {
      return { type: 'timeout', isRetryable: true };
    }

    return { type: 'unknown', isRetryable: false };
  }

  /**
   * Build a structured error payload for the execution log.
   *
   * @param {Error}  err
   * @param {object} node
   * @returns {object}
   */
  formatError(err, node) {
    const classification = this.classifyError(err);

    return {
      message: err.message,
      type: classification.type,
      isRetryable: classification.isRetryable,
      nodeId: node.id,
      nodeType: node.type,
      nodeLabel: node.data?.label || node.type,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      timestamp: new Date().toISOString(),
    };
  }

  // ─── Internal helpers ──────────────────────────────────────────────────────
  _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
