const { Queue, QueueEvents } = require("bullmq");
const { bullMQConnection }   = require("../config/redis");
const logger                 = require("../utils/logger");

// ─── Queue Names ───────────────────────────────────────────────────

const QUEUE_NAMES = {
  WORKFLOW:  "workflow-execution",
  SCHEDULED: "scheduled-workflows",
  RETRY:     "workflow-retry",
};

// ─── Main Workflow Execution Queue ─────────────────────────────────

const workflowQueue = new Queue(QUEUE_NAMES.WORKFLOW, {
  connection: bullMQConnection,
  defaultJobOptions: {
    attempts:    3,
    backoff: {
      type:  "exponential",
      delay: 2000, // 2s → 4s → 8s
    },
    removeOnComplete: { count: 500 },  // keep last 500 completed jobs
    removeOnFail:     { count: 1000 }, // keep last 1000 failed for inspection
    timeout: 5 * 60 * 1000,           // 5 min max per job
  },
});

// ─── Scheduled Workflows Queue ─────────────────────────────────────

const scheduledQueue = new Queue(QUEUE_NAMES.SCHEDULED, {
  connection: bullMQConnection,
  defaultJobOptions: {
    attempts: 2,
    backoff:  { type: "fixed", delay: 5000 },
    removeOnComplete: { count: 200 },
    removeOnFail:     { count: 500 },
    timeout: 5 * 60 * 1000,
  },
});

// ─── Queue Events (for monitoring / logging) ───────────────────────

const workflowQueueEvents = new QueueEvents(QUEUE_NAMES.WORKFLOW, {
  connection: bullMQConnection,
});

workflowQueueEvents.on("completed", ({ jobId }) => {
  logger.info(`[Queue] Job ${jobId} completed`);
});

workflowQueueEvents.on("failed", ({ jobId, failedReason }) => {
  logger.error(`[Queue] Job ${jobId} failed — ${failedReason}`);
});

workflowQueueEvents.on("stalled", ({ jobId }) => {
  logger.warn(`[Queue] Job ${jobId} stalled — will be retried`);
});

workflowQueueEvents.on("delayed", ({ jobId, delay }) => {
  logger.debug(`[Queue] Job ${jobId} delayed by ${delay}ms`);
});

// ─── Job Adders ────────────────────────────────────────────────────

/**
 * Enqueue a workflow triggered manually or by webhook.
 *
 * @param {object} payload
 * @param {string} payload.workflowId
 * @param {string} payload.userId
 * @param {string} payload.executionId   - pre-created Execution row ID
 * @param {"manual"|"webhook"} payload.triggerType
 * @param {object} [payload.triggerData] - webhook body / manual input
 */
const addWorkflowJob = async (payload) => {
  const job = await workflowQueue.add(
    `run:${payload.workflowId}`,
    payload,
    {
      jobId: payload.executionId, // idempotency — one job per execution row
      priority: payload.priority ?? 2,
    }
  );
  logger.info(`[Queue] Enqueued workflow job ${job.id} for workflow ${payload.workflowId}`);
  return job;
};

/**
 * Enqueue a workflow triggered by a cron schedule.
 *
 * @param {object} payload
 * @param {string} payload.workflowId
 * @param {string} payload.userId
 * @param {string} payload.executionId
 * @param {string} payload.cronExpression
 */
const addScheduledJob = async (payload) => {
  const job = await scheduledQueue.add(
    `schedule:${payload.workflowId}`,
    payload,
    {
      jobId: payload.executionId,
    }
  );
  logger.info(`[Queue] Enqueued scheduled job ${job.id} for workflow ${payload.workflowId}`);
  return job;
};

/**
 * Register a repeatable cron job for a workflow.
 * Safe to call on every app start — BullMQ deduplicates by jobId pattern.
 *
 * @param {string} workflowId
 * @param {string} userId
 * @param {string} cronExpression  - standard 5-part cron string
 */
const registerCronWorkflow = async (workflowId, userId, cronExpression) => {
  await scheduledQueue.add(
    `cron:${workflowId}`,
    { workflowId, userId, triggerType: "schedule", cronExpression },
    {
      repeat: { pattern: cronExpression },
      jobId:  `cron:${workflowId}`, // stable ID prevents duplicates
    }
  );
  logger.info(`[Queue] Registered cron "${cronExpression}" for workflow ${workflowId}`);
};

/**
 * Remove a repeatable cron job (called when workflow is deactivated or deleted).
 */
const removeCronWorkflow = async (workflowId, cronExpression) => {
  await scheduledQueue.removeRepeatable(`cron:${workflowId}`, {
    pattern: cronExpression,
  });
  logger.info(`[Queue] Removed cron for workflow ${workflowId}`);
};

// ─── Queue Health Check ────────────────────────────────────────────

const getQueueStats = async () => {
  const [wActive, wWaiting, wFailed, wCompleted] = await Promise.all([
    workflowQueue.getActiveCount(),
    workflowQueue.getWaitingCount(),
    workflowQueue.getFailedCount(),
    workflowQueue.getCompletedCount(),
  ]);

  return {
    workflowQueue: {
      active:    wActive,
      waiting:   wWaiting,
      failed:    wFailed,
      completed: wCompleted,
    },
  };
};

// ─── Graceful Shutdown ─────────────────────────────────────────────

const closeQueues = async () => {
  await Promise.all([
    workflowQueue.close(),
    scheduledQueue.close(),
    workflowQueueEvents.close(),
  ]);
  logger.info("[Queue] All queues closed");
};

module.exports = {
  workflowQueue,
  scheduledQueue,
  QUEUE_NAMES,
  addWorkflowJob,
  addScheduledJob,
  registerCronWorkflow,
  removeCronWorkflow,
  getQueueStats,
  closeQueues,
};
