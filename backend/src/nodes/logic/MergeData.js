const BaseNode = require('../base/BaseNode');

class MergeData extends BaseNode {
  constructor() {
    super();
    this.name = 'MergeData';
    this.displayName = 'Merge Data';
    this.description = 'Combine outputs from multiple upstream branches into a single data object';
    this.version = 1;
  }

  getInputSchema() {
    return {
      inputs: {
        type: 'array',
        required: true,
        description: 'Array of data objects to merge (one per upstream branch)',
      },
      mode: {
        type: 'string',
        required: false,
        enum: ['merge', 'append', 'zip', 'passThrough'],
        default: 'merge',
        description: [
          'merge: deep-merge all input objects into one.',
          'append: collect all inputs into an array.',
          'zip: pair inputs by index into [{branch0, branch1}] tuples.',
          'passThrough: return first non-null input unchanged.',
        ].join(' | '),
      },
      conflictResolution: {
        type: 'string',
        required: false,
        enum: ['overwrite', 'keepFirst', 'array'],
        default: 'overwrite',
        description: 'How to handle duplicate keys in merge mode: overwrite (last wins) | keepFirst | array (collect into array)',
      },
      outputKey: {
        type: 'string',
        required: false,
        default: 'merged',
        description: 'Top-level key wrapping the result in the output object',
      },
      waitForAll: {
        type: 'boolean',
        required: false,
        default: true,
        description: 'Wait until all upstream branches have produced output before merging',
      },
    };
  }

  async execute(inputData) {
    const {
      inputs,
      mode = 'merge',
      conflictResolution = 'overwrite',
      outputKey = 'merged',
      waitForAll = true,
    } = inputData;

    if (!Array.isArray(inputs) || inputs.length === 0) {
      throw this.createError('inputs must be a non-empty array', 'MISSING_FIELD');
    }

    const validInputs = waitForAll
      ? inputs
      : inputs.filter((i) => i !== null && i !== undefined);

    if (validInputs.length === 0) {
      return {
        success: true,
        [outputKey]: null,
        inputCount: 0,
        mode,
        skipped: true,
      };
    }

    let result;

    switch (mode) {
      case 'merge':
        result = this._deepMerge(validInputs, conflictResolution);
        break;
      case 'append':
        result = this._append(validInputs);
        break;
      case 'zip':
        result = this._zip(validInputs);
        break;
      case 'passThrough':
        result = validInputs[0];
        break;
      default:
        throw this.createError(`Unknown merge mode: ${mode}`, 'INVALID_MODE');
    }

    return {
      success: true,
      [outputKey]: result,
      inputCount: validInputs.length,
      mode,
      conflictResolution: mode === 'merge' ? conflictResolution : undefined,
    };
  }

  // ─── Merge strategies ────────────────────────────────────────────────────────

  _deepMerge(inputs, conflictResolution) {
    return inputs.reduce((acc, input) => {
      return this._mergeTwo(acc, input, conflictResolution);
    }, {});
  }

  _mergeTwo(target, source, conflictResolution) {
    if (typeof source !== 'object' || source === null) return target;

    const result = { ...target };

    for (const [key, value] of Object.entries(source)) {
      if (!(key in result)) {
        result[key] = value;
        continue;
      }

      switch (conflictResolution) {
        case 'keepFirst':
          // Keep existing value — do nothing
          break;
        case 'array': {
          const existing = result[key];
          if (Array.isArray(existing)) {
            result[key] = [...existing, value];
          } else {
            result[key] = [existing, value];
          }
          break;
        }
        case 'overwrite':
        default:
          if (
            typeof value === 'object' &&
            value !== null &&
            typeof result[key] === 'object' &&
            result[key] !== null &&
            !Array.isArray(value)
          ) {
            result[key] = this._mergeTwo(result[key], value, conflictResolution);
          } else {
            result[key] = value;
          }
      }
    }

    return result;
  }

  _append(inputs) {
    // Flatten one level — if an input is already an array, spread it
    return inputs.reduce((acc, input) => {
      if (Array.isArray(input)) return [...acc, ...input];
      return [...acc, input];
    }, []);
  }

  _zip(inputs) {
    const maxLength = Math.max(...inputs.map((i) => (Array.isArray(i) ? i.length : 1)));
    const normalised = inputs.map((i) => (Array.isArray(i) ? i : [i]));

    return Array.from({ length: maxLength }, (_, idx) => {
      const tuple = {};
      normalised.forEach((arr, branchIdx) => {
        tuple[`branch${branchIdx}`] = arr[idx] !== undefined ? arr[idx] : null;
      });
      return tuple;
    });
  }
}

module.exports = MergeData;
