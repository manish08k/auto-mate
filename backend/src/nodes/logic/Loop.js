const BaseNode = require('../base/BaseNode');

class Loop extends BaseNode {
  constructor() {
    super();
    this.name = 'Loop';
    this.displayName = 'Loop';
    this.description = 'Iterate over an array and execute downstream nodes for each item';
    this.version = 1;
  }

  getInputSchema() {
    return {
      items: {
        type: 'array',
        required: true,
        description: 'Array to iterate over. Supports {{ }} expressions.',
      },
      batchSize: {
        type: 'number',
        required: false,
        default: 1,
        description: 'Number of items to process per batch (1 = one at a time)',
      },
      maxIterations: {
        type: 'number',
        required: false,
        default: 1000,
        description: 'Hard cap on iterations to prevent runaway loops',
      },
      itemVariableName: {
        type: 'string',
        required: false,
        default: 'item',
        description: 'Variable name used to reference the current item in downstream nodes',
      },
      indexVariableName: {
        type: 'string',
        required: false,
        default: 'index',
        description: 'Variable name used to reference the current index',
      },
      continueOnError: {
        type: 'boolean',
        required: false,
        default: false,
        description: 'Continue iterating even if a downstream node fails on one item',
      },
    };
  }

  async execute(inputData) {
    const {
      items,
      batchSize = 1,
      maxIterations = 1000,
      itemVariableName = 'item',
      indexVariableName = 'index',
      continueOnError = false,
    } = inputData;

    const resolvedItems = this._resolveItems(items, inputData);

    if (!Array.isArray(resolvedItems)) {
      throw this.createError('items must resolve to an array', 'INVALID_TYPE');
    }

    const cappedItems = resolvedItems.slice(0, maxIterations);
    const totalItems = cappedItems.length;
    const batches = this._chunk(cappedItems, Math.max(1, batchSize));

    return {
      success: true,
      totalItems,
      totalBatches: batches.length,
      batchSize,
      cappedAt: resolvedItems.length > maxIterations ? maxIterations : null,
      continueOnError,
      itemVariableName,
      indexVariableName,
      // Loop metadata emitted so the engine knows how to iterate
      _loopMeta: {
        type: 'loop',
        items: cappedItems,
        batches,
        itemVariableName,
        indexVariableName,
        continueOnError,
      },
    };
  }

  /**
   * Called by the WorkflowEngine per iteration to build the scoped context
   * that downstream nodes receive for this loop step.
   *
   * @param {*}      item    - Current item value
   * @param {number} index   - Current iteration index
   * @param {Object} options - { itemVariableName, indexVariableName }
   * @returns {Object}
   */
  buildIterationContext(item, index, options = {}) {
    const { itemVariableName = 'item', indexVariableName = 'index' } = options;

    return {
      [itemVariableName]: item,
      [indexVariableName]: index,
      _loop: {
        item,
        index,
        isFirst: index === 0,
      },
    };
  }

  _resolveItems(items, inputData) {
    if (typeof items === 'string' && items.startsWith('{{') && items.endsWith('}}')) {
      const path = items.slice(2, -2).trim();
      return this._getNestedValue(inputData, path);
    }
    return items;
  }

  _getNestedValue(obj, path) {
    return path.split('.').reduce((acc, key) => {
      if (acc === null || acc === undefined) return undefined;
      return acc[key];
    }, obj);
  }

  _chunk(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

module.exports = Loop;
