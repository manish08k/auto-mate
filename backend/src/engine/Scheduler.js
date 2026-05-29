import cron from 'node-cron';
import { logger } from '../utils/logger.js';
import { workflowQueue } from '../queue/workflowQueue.js';
import Workflow from '../models/Workflow.model.js';
import Execution from '../models/Execution.model.js';

/**
 * Scheduler
 *
 * Manages cron-based workflow triggers.
 *
 * On boot:
 *   1. Load all enabled workflows with triggerType === 'schedule'
 *   2. Validate their cron expressions
 *   3. Register a node-cron job for each
 *
 * When a workflow is enabled/disabled/updated at runtime:
 *   - Call schedule(workflow) or unschedule(workflowId) accordingly
 *
 * On each cron tick:
 *   - Create an Execution record with status 'queued'
 *   - Push to Bull queue — queueWorker picks it up and runs WorkflowEngine
 *
 * Singleton — import and call Scheduler.getInstance()
 */
export class Scheduler {
  constructor() {
    // Map of workflowId → node-cron task instance
    this._jobs = new Map();
  }

  static getInstance() {
    if (!Scheduler._instance) {
      Scheduler._instance = new Scheduler();
    }
    return Scheduler._instance;
  }

  // ─── Boot: load and register all active schedule triggers ─────────────────
  async init() {
    try {
      const scheduledWorkflows = await Workflow.findAll({
        where: { isEnabled: true, triggerType: 'schedule' },
      });

      logger.info(`[Scheduler] Initialising ${scheduledWorkflows.length} scheduled workflow(s)`);

      for (const workflow of scheduledWorkflows) {
        await this.schedule(workflow);
      }

      logger.info('[Scheduler] Ready');
    } catch (err) {
      logger.error(`[Scheduler] Init failed: ${err.message}`);
      throw err;
    }
  }

  // ─── Register a cron job for a workflow ───────────────────────────────────
  async schedule(workflow) {
    const { id: workflowId, name } = workflow;
    const cronExpr = workflow.nodes?.find(
      (n) => n.type === 'schedule'
    )?.data?.params?.cronExpression;

    if (!cronExpr) {
      logger.warn(`[Scheduler] Workflow "${name}" (${workflowId}) has no cron expression — skipping`);
      return;
    }

    if (!cron.validate(cronExpr)) {
      logger.error(`[Scheduler] Invalid cron expression "${cronExpr}" for workflow "${name}"`);
      return;
    }

    // Unschedule existing job if re-scheduling
    this.unschedule(workflowId);

    const task = cron.schedule(cronExpr, async () => {
      await this._triggerWorkflow(workflowId, workflow.userId);
    });

    this._jobs.set(workflowId, task);

    logger.info(`[Scheduler] Scheduled workflow "${name}" (${workflowId}) → "${cronExpr}"`);
  }

  // ─── Remove a workflow's cron job ─────────────────────────────────────────
  unschedule(workflowId) {
    const existing = this._jobs.get(workflowId);
    if (existing) {
      existing.destroy();
      this._jobs.delete(workflowId);
      logger.info(`[Scheduler] Unscheduled workflow ${workflowId}`);
    }
  }

  // ─── Pause without destroying ──────────────────────────────────────────────
  pause(workflowId) {
    const task = this._jobs.get(workflowId);
    if (task) {
      task.stop();
      logger.info(`[Scheduler] Paused workflow ${workflowId}`);
    }
  }

  // ─── Resume a paused job ──────────────────────────────────────────────────
  resume(workflowId) {
    const task = this._jobs.get(workflowId);
    if (task) {
      task.start();
      logger.info(`[Scheduler] Resumed workflow ${workflowId}`);
    }
  }

  // ─── List all active job IDs ──────────────────────────────────────────────
  getActiveJobs() {
    return Array.from(this._jobs.keys());
  }

  // ─── Graceful shutdown ────────────────────────────────────────────────────
  shutdown() {
    logger.info('[Scheduler] Shutting down all cron jobs...');
    for (const [workflowId, task] of this._jobs.entries()) {
      task.destroy();
      logger.info(`[Scheduler] Destroyed job for workflow ${workflowId}`);
    }
    this._jobs.clear();
  }

  // ─── Convert human-friendly interval to cron expression ───────────────────
  // Convenience helper used by the Schedule trigger node UI
  static intervalToCron(interval) {
    const map = {
      'every_minute':    '* * * * *',
      'every_5_minutes': '*/5 * * * *',
      'every_15_minutes':'*/15 * * * *',
      'every_30_minutes':'*/30 * * * *',
      'every_hour':      '0 * * * *',
      'every_6_hours':   '0 */6 * * *',
      'every_12_hours':  '0 */12 * * *',
      'every_day':       '0 9 * * *',
      'every_week':      '0 9 * * 1',
      'every_month':     '0 9 1 * *',
    };

    return map[interval] || interval; // fall back to raw cron string
  }

  // ─── Validate a cron expression ───────────────────────────────────────────
  static validateCron(expr) {
    return cron.validate(expr);
  }

  // ─── Internal: create execution record and enqueue ────────────────────────
  async _triggerWorkflow(workflowId, userId) {
    try {
      // Re-check that workflow is still enabled (could have been disabled since boot)
      const workflow = await Workflow.findOne({
        where: { id: workflowId, isEnabled: true },
      });

      if (!workflow) {
        logger.warn(`[Scheduler] Workflow ${workflowId} no longer enabled — skipping run`);
        this.unschedule(workflowId);
        return;
      }

      const execution = await Execution.create({
        workflowId,
        userId,
        status: 'queued',
        triggerType: 'schedule',
        inputData: {},
      });

      await workflowQueue.add(
        'run',
        { executionId: execution.id, workflowId, inputData: {} },
        { attempts: 2, backoff: { type: 'fixed', delay: 5000 } }
      );

      logger.info(
        `[Scheduler] Triggered workflow ${workflowId} → execution ${execution.id}`
      );
    } catch (err) {
      logger.error(
        `[Scheduler] Failed to trigger workflow ${workflowId}: ${err.message}`
      );
    }
  }
}
