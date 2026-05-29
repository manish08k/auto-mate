const BaseNode = require('../base/BaseNode');

class Switch extends BaseNode {
  constructor() {
    super();
    this.name = 'Switch';
    this.displayName = 'Switch';
    this.description = 'Route workflow to one of many branches based on a value match';
    this.version = 1;
  }

  getInputSchema() {
    return {
      value: {
        type: 'string',
        required: true,
        description: 'The value to match against cases (supports {{ }} expressions)',
      },
      cases: {
        type: 'array',
        required: true,
        description: 'Array of {condition, output} objects. condition = value to match against.',
      },
      fallbackOutput: {
        type: 'string',
        required: false,
        default: 'default',
        description: 'Output branch name when no case matches',
      },
      mode: {
        type: 'string',
        required: false,
        enum: ['first', 'all'],
        default: 'first',
        description: 'first: route to first matching case only. all: route to all matching cases.',
      },
    };
  }

  async execute(inputData) {
    const { value, cases, fallbackOutput = 'default', mode = 'first' } = inputData;

    if (!value && value !== 0) throw this.createError('value is required', 'MISSING_FIELD');
    if (!Array.isArray(cases) || cases.length === 0) {
      throw this.createError('cases array is required and cannot be empty', 'MISSING_FIELD');
    }

    const resolvedValue = this._resolveValue(value, inputData);
    const matchedCases = [];
    const caseResults = [];

    for (let i = 0; i < cases.length; i++) {
      const caseItem = cases[i];
      const { condition, output, operator = 'equals' } = caseItem;

      const matched = this._matchCase(resolvedValue, condition, operator, inputData);

      caseResults.push({
        index: i,
        condition,
        operator,
        output: output || `case_${i}`,
        matched,
      });

      if (matched) {
        matchedCases.push(output || `case_${i}`);
        if (mode === 'first') break;
      }
    }

    const activeBranches = matchedCases.length > 0 ? matchedCases : [fallbackOutput];
    const isDefault = matchedCases.length === 0;

    return {
      success: true,
      matchedValue: resolvedValue,
      activeBranches,
      isDefault,
      matchedCount: matchedCases.length,
      caseResults,
      mode,
    };
  }

  _matchCase(value, condition, operator, inputData) {
    const resolvedCondition = this._resolveValue(condition, inputData);

    switch (operator) {
      case 'equals':
        return String(value) === String(resolvedCondition);
      case 'notEquals':
        return String(value) !== String(resolvedCondition);
      case 'contains':
        return String(value).includes(String(resolvedCondition));
      case 'startsWith':
        return String(value).startsWith(String(resolvedCondition));
      case 'endsWith':
        return String(value).endsWith(String(resolvedCondition));
      case 'greaterThan':
        return Number(value) > Number(resolvedCondition);
      case 'lessThan':
        return Number(value) < Number(resolvedCondition);
      case 'regex': {
        try {
          return new RegExp(String(resolvedCondition)).test(String(value));
        } catch {
          return false;
        }
      }
      default:
        return String(value) === String(resolvedCondition);
    }
  }

  _resolveValue(value, inputData) {
    if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
      const path = value.slice(2, -2).trim();
      return this._getNestedValue(inputData, path);
    }
    return value;
  }

  _getNestedValue(obj, path) {
    return path.split('.').reduce((acc, key) => {
      if (acc === null || acc === undefined) return undefined;
      return acc[key];
    }, obj);
  }
}

module.exports = Switch;
