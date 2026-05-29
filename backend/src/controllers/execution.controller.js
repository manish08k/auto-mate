import { apiResponse } from '../utils/apiResponse.js';
import { logger } from '../utils/logger.js';
import Execution from '../models/Execution.model.js';
import Workflow from '../models/Workflow.model.js';
import { WorkflowEngine } from '../engine/WorkflowEngine.js';
import { workflowQueue } from '../queue/workflowQueue.js';

// POST /executions/:workflowId/run
// Manually trigger a workflow run
export const runWorkflow = async (req, res) => {
  try {
    const { workflowId } = req.params;
    const inputData = req.body?.inputData || {};

    const workflow = await Workflow.findOne({
      where: { id: workflowId, userId: req.user.id },
    });

    if (!workflow) {
      return res.status(404).json(apiResponse.error('Workflow not found'));
    }

    if (!workflow.nodes || workflow.nodes.length === 0) {
      return res.status(400).json(apiResponse.error('Workflow has no nodes'));
    }

    // Create execution record immediately so the client gets an ID back
    const execution = await Execution.create({
      workflowId,
      status: 'queued',
      triggerType: 'manual',
      inputData,
      userId: req.user.id,
    });

    // Push to Bull queue for background processing
    await workflowQueue.add(
      'run',
      { executionId: execution.id, workflowId, inputData },
      { attempts: 3, backoff: { type: 'exponential', delay: 2000 } }
    );

    logger.info(`Execution queued: ${execution.id} for workflow: ${workflowId}`);

    return res.status(202).json(
      apiResponse.success('Workflow queued for execution', { executionId: execution.id })
    );
  } catch (err) {
    logger.error('runWorkflow error', err);
    return res.status(500).json(apiResponse.error('Failed to queue workflow'));
  }
};

// GET /executions
// Get all executions for the authenticated user (across all workflows)
export const getExecutions = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, workflowId } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = { userId: req.user.id };
    if (status) where.status = status;
    if (workflowId) where.workflowId = workflowId;

    const { count, rows: executions } = await Execution.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset,
      attributes: [
        'id', 'workflowId', 'status', 'triggerType',
        'startedAt', 'finishedAt', 'durationMs', 'createdAt'
      ],
      include: [
        {
          model: Workflow,
          attributes: ['name'],
        },
      ],
    });

    return res.status(200).json(
      apiResponse.success('Executions fetched', {
        executions,
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / parseInt(limit)),
      })
    );
  } catch (err) {
    logger.error('getExecutions error', err);
    return res.status(500).json(apiResponse.error('Failed to fetch executions'));
  }
};

// GET /executions/:id
// Full detail of a single execution including per-node logs
export const getExecution = async (req, res) => {
  try {
    const execution = await Execution.findOne({
      where: { id: req.params.id, userId: req.user.id },
      include: [{ model: Workflow, attributes: ['name', 'nodes'] }],
    });

    if (!execution) {
      return res.status(404).json(apiResponse.error('Execution not found'));
    }

    return res.status(200).json(apiResponse.success('Execution fetched', execution));
  } catch (err) {
    logger.error('getExecution error', err);
    return res.status(500).json(apiResponse.error('Failed to fetch execution'));
  }
};

// GET /executions/:id/logs
// Step-by-step node execution logs for the run detail view
export const getExecutionLogs = async (req, res) => {
  try {
    const execution = await Execution.findOne({
      where: { id: req.params.id, userId: req.user.id },
      attributes: ['id', 'nodeLogs', 'status', 'error'],
    });

    if (!execution) {
      return res.status(404).json(apiResponse.error('Execution not found'));
    }

    return res.status(200).json(
      apiResponse.success('Logs fetched', {
        logs: execution.nodeLogs || [],
        status: execution.status,
        error: execution.error || null,
      })
    );
  } catch (err) {
    logger.error('getExecutionLogs error', err);
    return res.status(500).json(apiResponse.error('Failed to fetch logs'));
  }
};

// DELETE /executions/:id
// Delete a single execution record
export const deleteExecution = async (req, res) => {
  try {
    const execution = await Execution.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!execution) {
      return res.status(404).json(apiResponse.error('Execution not found'));
    }

    await execution.destroy();

    logger.info(`Execution deleted: ${req.params.id}`);

    return res.status(200).json(apiResponse.success('Execution deleted'));
  } catch (err) {
    logger.error('deleteExecution error', err);
    return res.status(500).json(apiResponse.error('Failed to delete execution'));
  }
};

// POST /executions/:id/retry
// Re-run a failed execution with the same input data
export const retryExecution = async (req, res) => {
  try {
    const original = await Execution.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!original) {
      return res.status(404).json(apiResponse.error('Execution not found'));
    }

    if (original.status !== 'failed' && original.status !== 'error') {
      return res.status(400).json(apiResponse.error('Only failed executions can be retried'));
    }

    const retryExecution = await Execution.create({
      workflowId: original.workflowId,
      status: 'queued',
      triggerType: 'manual',
      inputData: original.inputData,
      userId: req.user.id,
      retriedFromId: original.id,
    });

    await workflowQueue.add(
      'run',
      {
        executionId: retryExecution.id,
        workflowId: original.workflowId,
        inputData: original.inputData,
      },
      { attempts: 3, backoff: { type: 'exponential', delay: 2000 } }
    );

    logger.info(`Execution retried: ${original.id} → ${retryExecution.id}`);

    return res.status(202).json(
      apiResponse.success('Retry queued', { executionId: retryExecution.id })
    );
  } catch (err) {
    logger.error('retryExecution error', err);
    return res.status(500).json(apiResponse.error('Failed to retry execution'));
  }
};

// GET /executions/stats
// Summary stats for the dashboard header
export const getExecutionStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const [total, successful, failed, running] = await Promise.all([
      Execution.count({ where: { userId } }),
      Execution.count({ where: { userId, status: 'success' } }),
      Execution.count({ where: { userId, status: 'failed' } }),
      Execution.count({ where: { userId, status: 'running' } }),
    ]);

    const successRate = total > 0 ? ((successful / total) * 100).toFixed(1) : '0.0';

    return res.status(200).json(
      apiResponse.success('Stats fetched', {
        total,
        successful,
        failed,
        running,
        successRate: parseFloat(successRate),
      })
    );
  } catch (err) {
    logger.error('getExecutionStats error', err);
    return res.status(500).json(apiResponse.error('Failed to fetch stats'));
  }
};
