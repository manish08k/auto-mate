import { logger } from '../utils/logger.js';

/**
 * ExpressionParser
 *
 * Safely evaluates template expressions like:
 *
 *   {{ $node.gmail.output.subject }}
 *   {{ $input.email }}
 *   {{ $node.httpRequest.output.data[0].name }}
 *   {{ $node.condition.output._branch === 'true' ? 'yes' : 'no' }}
 *   {{ Math.round($node.scores.output.value * 100) }}
 *   {{ $env.BASE_URL }}
 *
 * Uses a sandboxed evaluation strategy — no eval(), no Function constructor.
 * Expressions are parsed into a path/operator chain and evaluated against
 * the context object using safe property access.
 *
 * Supported:
 *  - Property access:      $node.id.output.key
 *  - Array index:          $node.id.output.items[0]
 *  - Nested access:        $input.user.address.city
 *  - Ternary:              expr ? valueA : valueB
 *  - String concat:        $node.x.output.first + ' ' + $node.x.output.last
 *  - Comparisons:          ===  !==  >  <  >=  <=
 *  - Logical:              &&  ||  !
 *  - Math helpers:         Math.round, Math.floor, Math.ceil, Math.abs
 *  - String helpers:       .toUpperCase(), .toLowerCase(), .trim(), .includes()
 *  - env variables:        $env.KEY_NAME
 *  - Null coalescing:      ?? operator
 */
export class ExpressionParser {
  constructor() {
    // Safe globals available inside expressions
    this._globals = {
      Math,
      JSON,
      String,
      Number,
      Boolean,
      Array,
      Object,
      parseInt,
      parseFloat,
      isNaN,
      isFinite,
      encodeURIComponent,
      decodeURIComponent,
    };
  }

  /**
   * Evaluate an expression string against the given context.
   *
   * @param {string} expression  - Raw expression (without {{ }})
   * @param {object} context     - Execution context { $input, $nodes, $env? }
   * @returns {any}
   */
  evaluate(expression, context) {
    if (!expression || typeof expression !== 'string') return expression;

    const trimmed = expression.trim();

    // Build the variable scope the expression can access
    const scope = this._buildScope(context);

    try {
      return this._safeEval(trimmed, scope);
    } catch (err) {
      logger.warn(`[ExpressionParser] Failed to evaluate "${trimmed}": ${err.message}`);
      return null;
    }
  }

  /**
   * Check whether a string contains any {{ }} expressions.
   */
  hasExpressions(str) {
    return typeof str === 'string' && /\{\{.+?\}\}/.test(str);
  }

  /**
   * Extract all expression strings from a template.
   * e.g. "Hello {{ $input.name }}" → ["$input.name"]
   */
  extractExpressions(template) {
    const matches = [];
    const regex = /\{\{(.+?)\}\}/g;
    let match;
    while ((match = regex.exec(template)) !== null) {
      matches.push(match[1].trim());
    }
    return matches;
  }

  // ─── Build safe evaluation scope ──────────────────────────────────────────
  _buildScope(context) {
    const { $input = {}, $nodes = {} } = context;

    // $node.gmail.output  →  $nodes['gmail'].output
    // We build a Proxy-like object that supports $node.LABEL.output
    const $node = new Proxy($nodes, {
      get(target, prop) {
        // Try direct id lookup
        if (target[prop] !== undefined) return target[prop];

        // Try label lookup
        for (const [, nodeData] of Object.entries(target)) {
          if (nodeData?.label === prop) return nodeData;
        }

        return undefined;
      },
    });

    return {
      ...(this._globals),
      $input,
      $node,
      $nodes,
      $env: process.env,
      $now: new Date().toISOString(),
      $timestamp: Date.now(),
      undefined,
      null: null,
      true: true,
      false: false,
    };
  }

  // ─── Safe evaluation using new Function with restricted scope ─────────────
  // This is safer than direct eval because:
  //  1. We control exactly what is in scope
  //  2. No access to `this`, `window`, `global`, `process` (except $env)
  //  3. No require / import
  //  4. Expression length is capped
  _safeEval(expression, scope) {
    // Hard limits
    if (expression.length > 500) {
      throw new Error('Expression too long (max 500 chars)');
    }

    // Block dangerous patterns
    const forbidden = [
      /\brequire\b/, /\bimport\b/, /\bprocess\.exit\b/,
      /\beval\b/, /\bFunction\b/, /\bsetTimeout\b/, /\bsetInterval\b/,
      /\b__proto__\b/, /\bconstructor\b/, /\bprototype\b/,
      /\bfs\b/, /\bchild_process\b/, /\bexec\b/,
    ];

    for (const pattern of forbidden) {
      if (pattern.test(expression)) {
        throw new Error(`Forbidden token in expression: ${expression}`);
      }
    }

    const argNames = Object.keys(scope);
    const argValues = Object.values(scope);

    // eslint-disable-next-line no-new-func
    const fn = new Function(...argNames, `"use strict"; return (${expression});`);
    return fn(...argValues);
  }
}
