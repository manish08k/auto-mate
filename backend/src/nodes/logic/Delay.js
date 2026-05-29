const BaseNode = require('../base/BaseNode');

class Delay extends BaseNode {
  constructor() {
    super();
    this.name = 'Delay';
    this.displayName = 'Delay';
    this.description = 'Pause workflow execution for a specified amount of time';
    this.version = 1;
    this.MAX_DELAY_MS = 24 * 60 * 60 * 1000; // 24 hours hard cap
  }

  getInputSchema() {
    return {
      unit: {
        type: 'string',
        required: true,
        enum: ['milliseconds', 'seconds', 'minutes', 'hours'],
        default: 'seconds',
        description: 'Time unit for the delay amount',
      },
      amount: {
        type: 'number',
        required: true,
        description: 'How long to wait. Must be a positive number.',
      },
      resumeAt: {
        type: 'string',
        required: false,
        description: 'ISO 8601 datetime to resume at instead of a relative delay',
      },
      mode: {
        type: 'string',
        required: false,
        enum: ['wait', 'schedule'],
        default: 'wait',
        description: 'wait: block in-process. schedule: hand off to queue for long delays.',
      },
    };
  }

  async execute(inputData) {
    const { unit = 'seconds', amount, resumeAt, mode = 'wait' } = inputData;

    let delayMs;

    if (resumeAt) {
      const target = new Date(resumeAt).getTime();
      const now = Date.now();
      delayMs = Math.max(0, target - now);
    } else {
      if (amount === undefined || amount === null) {
        throw this.createError('amount is required when resumeAt is not set', 'MISSING_FIELD');
      }
      if (amount < 0) {
        throw this.createError('amount must be a positive number', 'INVALID_VALUE');
      }
      delayMs = this._toMilliseconds(amount, unit);
    }

    if (delayMs > this.MAX_DELAY_MS) {
      throw this.createError(
        `Delay exceeds maximum allowed (24h). Requested: ${delayMs}ms`,
        'DELAY_TOO_LONG',
        { requestedMs: delayMs, maxMs: this.MAX_DELAY_MS }
      );
    }

    const startedAt = new Date().toISOString();

    if (mode === 'wait') {
      await this._sleep(delayMs);
    }
    // In 'schedule' mode the engine picks up _scheduleMeta and enqueues a
    // delayed job — actual sleeping happens outside this node.

    const resumedAt = new Date().toISOString();

    return {
      success: true,
      mode,
      delayMs,
      delayHuman: this._humanize(delayMs),
      startedAt,
      resumedAt: mode === 'wait' ? resumedAt : null,
      _scheduleMeta: mode === 'schedule' ? { delayMs, resumeAt: resumeAt || null } : null,
    };
  }

  _toMilliseconds(amount, unit) {
    const multipliers = {
      milliseconds: 1,
      seconds: 1_000,
      minutes: 60_000,
      hours: 3_600_000,
    };

    const multiplier = multipliers[unit];
    if (!multiplier) {
      throw this.createError(`Unknown time unit: ${unit}`, 'INVALID_UNIT');
    }

    return amount * multiplier;
  }

  _humanize(ms) {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3_600_000) return `${(ms / 60_000).toFixed(1)}m`;
    return `${(ms / 3_600_000).toFixed(2)}h`;
  }

  _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = Delay;
