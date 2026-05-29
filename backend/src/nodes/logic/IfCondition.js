const BaseNode = require('../base/BaseNode');

class IfCondition extends BaseNode {
  constructor() {
    super();
    this.name = 'IfCondition';
    this.displayName = 'IF Condition';
    this.description = 'Branch workflow execution based on one or more conditions';
    this.version = 1;
  }

  getInputSchema() {
    return {
      conditions: {
        type: 'array',
        required: true,
        description: 'Array of condition objects to evaluate',
      },
      combineOperation: {
        type: 'string',
        required: false,
        enum: ['AND', 'OR'],
        default: 'AND',
        description: 'How to combine multiple conditions: AND (all must pass) or OR (any must pass)',
      },
    };
  }

  async execute(inputData) {
    const { conditions, combineOperation = 'AND' } = inputData;

    if (!conditions || !Array.isArray(conditions) || conditions.length === 0) {
      throw this.createError('conditions array is required and cannot be empty', 'MISSING_FIELD');
    }

    const results = conditions.map((condition, index) => {
      try {
        return this._evaluateCondition(condition, inputData);
      } catch (err) {
        throw this.createError(
          `Error evaluating condition[${index}]: ${err.message}`,
          'CONDITION_ERROR',
          { index, condition }
        );
      }
    });

    const passed =
      combineOperation === 'OR'
        ? results.some(Boolean)
        : results.every(Boolean);

    return {
      success: true,
      passed,
      branch: passed ? 'true' : 'false',
      conditionResults: results,
      totalConditions: conditions.length,
      combineOperation,
    };
  }

  _evaluateCondition(condition, inputData) {
    const { leftValue, operator, rightValue } = condition;

    if (!operator) throw this.createError('operator is required in each condition', 'MISSING_FIELD');

    const left = this._resolveValue(leftValue, inputData);
    const right = this._resolveValue(rightValue, inputData);

    switch (operator) {
      case 'equals':
        return String(left) === String(right);
      case 'notEquals':
        return String(left) !== String(right);
      case 'contains':
        return String(left).includes(String(right));
      case 'notContains':
        return !String(left).includes(String(right));
      case 'startsWith':
        return String(left).startsWith(String(right));
      case 'endsWith':
        return String(left).endsWith(String(right));
      case 'greaterThan':
        return Number(left) > Number(right);
      case 'lessThan':
        return Number(left) < Number(right);
      case 'greaterThanOrEqual':
        return Number(left) >= Number(right);
      case 'lessThanOrEqual':
        return Number(left) <= Number(right);
      case 'isEmpty':
        return left === null || left === undefined || left === '' || (Array.isArray(left) && left.length === 0);
      case 'isNotEmpty':
        return left !== null && left !== undefined && left !== '' && !(Array.isArray(left) && left.length === 0);
      case 'isTrue':
        return left === true || left === 'true' || left === 1;
      case 'isFalse':
        return left === false || left === 'false' || left === 0;
      case 'regex': {
        try {
          const regex = new RegExp(String(right));
          return regex.test(String(left));
        } catch {
          throw this.createError(`Invalid regex pattern: ${right}`, 'INVALID_REGEX');
        }
      }
      default:
        throw this.createError(`Unknown operator: ${operator}`, 'INVALID_OPERATOR');
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

module.exports = IfCondition;
