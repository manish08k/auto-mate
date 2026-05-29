import { ExpressionParser } from './ExpressionParser.js';
import { logger } from '../utils/logger.js';

/**
 * DataMapper
 *
 * Responsible for passing data between nodes in the execution context.
 *
 * Two jobs:
 *  1. resolveParams  — walk a node's param object and replace any
 *                      {{ expression }} strings with real values from context
 *  2. mapOutput      — let a node define an explicit output shape that
 *                      renames / picks fields before storing in context
 */
export class DataMapper {
  constructor() {
    this.parser = new ExpressionParser();
  }

  /**
   * Recursively resolve all {{ expr }} strings in a params object.
   *
   * Supports:
   *   strings       → "Hello {{ $node.gmail.output.subject }}"
   *   arrays        → each element resolved
   *   plain objects → each value resolved
   *   primitives    → returned as-is
   *
   * @param {any}    params  - Raw params from node.data.params
   * @param {object} context - Current execution context { $input, $nodes }
   * @returns {any} Resolved params (same shape, expressions replaced)
   */
  resolveParams(params, context) {
    if (params === null || params === undefined) return params;

    if (typeof params === 'string') {
      return this._resolveString(params, context);
    }

    if (Array.isArray(params)) {
      return params.map((item) => this.resolveParams(item, context));
    }

    if (typeof params === 'object') {
      const resolved = {};
      for (const [key, value] of Object.entries(params)) {
        resolved[key] = this.resolveParams(value, context);
      }
      return resolved;
    }

    // number, boolean — return as-is
    return params;
  }

  /**
   * Apply an optional output mapping defined by the node.
   *
   * outputMap example:
   *   {
   *     "emailSubject": "{{ $output.subject }}",
   *     "recipientName": "{{ $output.to[0].name }}"
   *   }
   *
   * This lets downstream nodes reference clean aliases instead of
   * digging into raw API response shapes.
   *
   * @param {any}    rawOutput  - What the node implementation returned
   * @param {object} outputMap  - Key/value map from node.data.outputMap
   * @param {object} context    - Execution context (for cross-node refs)
   * @returns {object}
   */
  mapOutput(rawOutput, outputMap, context) {
    if (!outputMap || Object.keys(outputMap).length === 0) {
      return rawOutput;
    }

    // Make the raw output available as $output in expressions
    const localContext = {
      ...context,
      $output: rawOutput,
    };

    const mapped = {};
    for (const [alias, expr] of Object.entries(outputMap)) {
      try {
        mapped[alias] = this._resolveString(String(expr), localContext);
      } catch (err) {
        logger.warn(`[DataMapper] Failed to map output key "${alias}": ${err.message}`);
        mapped[alias] = null;
      }
    }

    return mapped;
  }

  /**
   * Get the output of a specific node from the context by node ID or label.
   *
   * @param {string} nodeIdOrLabel
   * @param {object} context
   * @returns {any}
   */
  getNodeOutput(nodeIdOrLabel, context) {
    // Try direct id lookup first
    if (context.$nodes?.[nodeIdOrLabel]) {
      return context.$nodes[nodeIdOrLabel].output;
    }

    // Fall back to label search
    for (const [, nodeData] of Object.entries(context.$nodes || {})) {
      if (nodeData?.label === nodeIdOrLabel) {
        return nodeData.output;
      }
    }

    return undefined;
  }

  /**
   * Merge outputs from multiple upstream nodes into one flat object.
   * Used by the MergeData logic node.
   *
   * Strategy:
   *  'first'      → use the first non-null output
   *  'merge'      → shallow merge all outputs (later keys win)
   *  'array'      → wrap all outputs in an array
   *
   * @param {string[]} nodeIds
   * @param {object}   context
   * @param {string}   strategy
   * @returns {any}
   */
  mergeOutputs(nodeIds, context, strategy = 'merge') {
    const outputs = nodeIds
      .map((id) => context.$nodes?.[id]?.output)
      .filter((o) => o !== null && o !== undefined);

    if (outputs.length === 0) return null;

    switch (strategy) {
      case 'first':
        return outputs[0];

      case 'array':
        return outputs;

      case 'merge':
      default:
        return outputs.reduce((acc, out) => {
          if (typeof out === 'object' && !Array.isArray(out)) {
            return { ...acc, ...out };
          }
          return out; // primitive — just return latest
        }, {});
    }
  }

  // ─── Internal ─────────────────────────────────────────────────────────────

  /**
   * Resolve all {{ expr }} occurrences in a single string.
   * If the ENTIRE string is one expression (no surrounding text),
   * return the raw evaluated value (so objects/arrays pass through).
   * Otherwise, coerce to string and interpolate.
   */
  _resolveString(str, context) {
    const trimmed = str.trim();

    // Pure expression → return raw value (preserves type)
    const pureMatch = trimmed.match(/^\{\{(.+?)\}\}$/);
    if (pureMatch) {
      return this.parser.evaluate(pureMatch[1].trim(), context);
    }

    // Mixed string → replace each {{ }} with string-coerced value
    return str.replace(/\{\{(.+?)\}\}/g, (_, expr) => {
      try {
        const val = this.parser.evaluate(expr.trim(), context);
        return val === null || val === undefined ? '' : String(val);
      } catch (err) {
        logger.warn(`[DataMapper] Expression error in "${expr}": ${err.message}`);
        return '';
      }
    });
  }
}
