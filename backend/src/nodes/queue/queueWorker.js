const { Worker }             = require("bullmq");
const { bullMQConnection }   = require("../config/redis");
const { QUEUE_NAMES }        = require("./workflowQueue");
const WorkflowEngine         = require("../engine/WorkflowEngine");
const { Execution, Workflow } = require("../models");
const logger                 = require("../utils/logger");

// ─── Concurrency Config ────────────────────────────────────────────

const CONCURRENCY = Number(process.env.WORKER_CONCURRENCY) || 5;

// ─── Core Job Processor ────────────────────────────────────────────

/**
 * Handles a single workflow execution job.
 * Called for both manual/webhook jobs and scheduled jobs.
 */
async function processWorkflowJob(job) {
  const { workflowId, userId, executionId, triggerType, triggerData } = job.data;

  logger.info(`[Worker] Starting job ${job.id} | workflow=${workflowId} | trigger=${triggerType}`);

  // 1. Load the Execution row
  const execution = await Execution.findByPk(executionId);
  if (!execution) {
    throw new Error(`Execution record not found: ${executionId}`);
  }

  // 2. Load the Workflow definition
  const workflow = await Workflow.findByPk(workflowId);
  if (!workflow) {
    throw new Error(`Workflow not found: ${workflowId}`);
  }
  if (!workflow.is_active) {
    logger.warn(`[Worker] Workflow ${workflowId} is inactive — skipping`);
    await execution.update({ status: "cancelled", finished_at: new Date() });
    return { skipped: true, reason: "workflow_inactive" };
  }

  // 3. Mark execution as running
  await execution.update({
    status:     "running",
    started_at: new Date(),
    queue_job_id: String(job.id),
  });

  const startTime = Date.now();

  try {
    // 4. Hand off to the engine
    const result = await WorkflowEngine.run({
      workflow,
      execution,
      triggerData: triggerData ?? {},
      onNodeComplete: async (nodeId, nodeResult) => {
        // Persist each node result incrementally so partial progress is visible
        const current = execution.node_results ?? {};
        await execution.update({
          node_results: { ...current, [nodeId]: nodeResult },
        });

        // Report progress to BullMQ (0–100) so dashboards can show it
        const nodes       = workflow.definition?.nodes ?? [];
        const doneCount   = Object.keys({ ...current, [nodeId]: nodeResult }).length;
        const progress    = Math.round((doneCount / Math.max(nodes.length, 1)) * 100);
        await job.updateProgress(progress);
      },
    });

    const duration = Date.now() - startTime;

    // 5. Mark success
    await execution.update({
      status:       "success",
      output:       result,
      finished_at:  new Date(),
      duration_ms:  duration,
    });

    // 6. Update workflow metadata
    await workflow.update({
      last_run_at:     new Date(),
      last_run_status: "success",
      run_count:       workflow.run_count + 1,
    });

    logger.info(`[Worker] Job ${job.id} succeeded in ${duration}ms`);
    return { success: true, duration_ms: duration };

  } catch (err) {
    const duration = Date.now() - startTime;

    logger.error(`[Worker] Job ${job.id} failed: ${err.message}`);

    // 7. Mark failure — only update DB on final attempt (no more retries)
    const isFinalAttempt = job.attemptsMade >= (job.opts.attempts ?? 1) - 1;

    if (isFinalAttempt) {
      await execution.update({
        status:          "failed",
        error_message:   err.message,
        failed_node_id:  err.nodeId ?? null,
        finished_at:     new Date(),
        duration_ms:     duration,
      });

      await workflow.update({
        last_run_at:     new Date(),
        last_run_status: "failed",
        run_count:       workflow.run_count + 1,
      });
    }

    // Re-throw so BullMQ records the failure and triggers retries
    throw err;
  }
}

// ─── Scheduled Job Processor ──────────────────────────────────────

/**
 * For cron-triggered jobs we create a fresh Execution row then
 * delegate to the same processWorkflowJob logic.
 */
async function processScheduledJob(job) {
  const { workflowId, userId, cronExpression } = job.data;

  logger.info(`[Worker] Scheduled trigger for workflow ${workflowId} (${cronExpression})`);

  const workflow = await Workflow.findByPk(workflowId);
  if (!workflow || !workflow.is_active) {
    logger.warn(`[Worker] Skipping inactive/missing scheduled workflow ${workflowId}`);
    return { skipped: true };
  }

  // Create the execution row on the fly for cron jobs
  const execution = await Execution.create({
    workflow_id:  workflowId,
    user_id:      userId,
    status:       "pending",
    trigger_type: "schedule",
    trigger_data: { cronExpression, firedAt: new Date().toISOString() },
    node_results: {},
  });

  // Re-use main processor with the new execution row
  return processWorkflowJob({
    ...job,
    data: {
      ...job.data,
      executionId:  execution.id,
      triggerType:  "schedule",
      triggerData:  { cronExpression },
    },
  });
}

// ─── Workers ──────────────────────────────────────────────────────

const workflowWorker = new Worker(
  QUEUE_NAMES.WORKFLOW,
  processWorkflowJob,
  {
    connection:  bullMQConnection,
    concurrency: CONCURRENCY,
    limiter: {
      max:      50,    // max 50 jobs per duration window
      duration: 10000, // per 10 seconds
    },
  }
);

const scheduledWorker = new Worker(
  QUEUE_NAMES.SCHEDULED,
  processScheduledJob,
  {
    connection:  bullMQConnection,
    concurrency: 3, // fewer concurrent scheduled jobs
  }
);

// ─── Worker Event Listeners ────────────────────────────────────────

function attachListeners(worker, workerName) {
  worker.on("active", (job) => {
    logger.debug(`[${workerName}] Job ${job.id} is now active`);
  });

  worker.on("completed", (job, result) => {
    logger.info(`[${workerName}] Job ${job.id} completed`, result);
  });

  worker.on("failed", (job, err) => {
    const attemptsLeft = (job?.opts?.attempts ?? 1) - (job?.attemptsMade ?? 0);
    logger.error(
      `[${workerName}] Job ${job?.id} failed (${attemptsLeft} attempts left): ${err.message}`
    );
  });

  worker.on("error", (err) => {
    logger.error(`[${workerName}] Worker error: ${err.message}`);
  });

  worker.on("stalled", (jobId) => {
    logger.warn(`[${workerName}] Job ${jobId} stalled — will be requeued`);
  });

  worker.on("progress", (job, progress) => {
    logger.debug(`[${workerName}] Job ${job.id} progress: ${progress}%`);
  });
}

attachListeners(workflowWorker,  "WorkflowWorker");
attachListeners(scheduledWorker, "ScheduledWorker");

// ─── Graceful Shutdown ─────────────────────────────────────────────

const shutdownWorkers = async () => {
  logger.info("[Worker] Graceful shutdown initiated — waiting for active jobs to finish...");
  await Promise.all([
    workflowWorker.close(),
    scheduledWorker.close(),
  ]);
  logger.info("[Worker] All workers stopped");
};

process.on("SIGTERM", shutdownWorkers);
process.on("SIGINT",  shutdownWorkers);

module.exports = {
  workflowWorker,
  scheduledWorker,
  shutdownWorkers,
};
