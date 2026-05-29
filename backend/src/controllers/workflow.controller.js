import { apiResponse } from '../utils/apiResponse.js';
import { logger } from '../utils/logger.js';
import Workflow from '../models/Workflow.model.js';
import Execution from '../models/Execution.model.js';
import { WorkflowEngine } from '../engine/WorkflowEngine.js';

// GET /workflows
export const getWorkflows = async (req, res) => {
  try {
    const workflows = await Workflow.findAll({
      where: { userId: req.user.id },
      order: [['updatedAt', 'DESC']],
      attributes: ['id', 'name', 'isEnabled', 'triggerType', 'createdAt', 'updatedAt'],
    });

    return res.status(200).json(apiResponse.success('Workflows fetched', workflows));
  } catch (err) {
    logger.error('getWorkflows error', err);
    return res.status(500).json(apiResponse.error('Failed to fetch workflows'));
  }
};

// GET /workflows/:id
export const getWorkflow = async (req, res) => {
  try {
    const workflow = await Workflow.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!workflow) {
      return res.status(404).json(apiResponse.error('Workflow not found'));
    }

    return res.status(200).json(apiResponse.success('Workflow fetched', workflow));
  } catch (err) {
    logger.error('getWorkflow error', err);
    return res.status(500).json(apiResponse.error('Failed to fetch workflow'));
  }
};

// POST /workflows
export const createWorkflow = async (req, res) => {
  try {
    const { name, nodes, edges, triggerType } = req.body;

    const workflow = await Workflow.create({
      name: name || 'Untitled Workflow',
      nodes: nodes || [],
      edges: edges || [],
      triggerType: triggerType || 'manual',
      isEnabled: false,
      userId: req.user.id,
    });

    logger.info(`Workflow created: ${workflow.id} by user ${req.user.id}`);

    return res.status(201).json(apiResponse.success('Workflow created', workflow));
  } catch (err) {
    logger.error('createWorkflow error', err);
    return res.status(500).json(apiResponse.error('Failed to create workflow'));
  }
};

// PUT /workflows/:id
export const updateWorkflow = async (req, res) => {
  try {
    const workflow = await Workflow.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!workflow) {
      return res.status(404).json(apiResponse.error('Workflow not found'));
    }

    const { name, nodes, edges, triggerType } = req.body;

    await workflow.update({
      ...(name !== undefined && { name }),
      ...(nodes !== undefined && { nodes }),
      ...(edges !== undefined && { edges }),
      ...(triggerType !== undefined && { triggerType }),
    });

    logger.info(`Workflow updated: ${workflow.id}`);

    return res.status(200).json(apiResponse.success('Workflow updated', workflow));
  } catch (err) {
    logger.error('updateWorkflow error', err);
    return res.status(500).json(apiResponse.error('Failed to update workflow'));
  }
};

// DELETE /workflows/:id
export const deleteWorkflow = async (req, res) => {
  try {
    const workflow = await Workflow.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!workflow) {
      return res.status(404).json(apiResponse.error('Workflow not found'));
    }

    await workflow.destroy();

    logger.info(`Workflow deleted: ${req.params.id}`);

    return res.status(200).json(apiResponse.success('Workflow deleted'));
  } catch (err) {
    logger.error('deleteWorkflow error', err);
    return res.status(500).json(apiResponse.error('Failed to delete workflow'));
  }
};

// POST /workflows/:id/duplicate
export const duplicateWorkflow = async (req, res) => {
  try {
    const original = await Workflow.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!original) {
      return res.status(404).json(apiResponse.error('Workflow not found'));
    }

    const copy = await Workflow.create({
      name: `${original.name} (copy)`,
      nodes: original.nodes,
      edges: original.edges,
      triggerType: original.triggerType,
      isEnabled: false,
      userId: req.user.id,
    });

    logger.info(`Workflow duplicated: ${original.id} → ${copy.id}`);

    return res.status(201).json(apiResponse.success('Workflow duplicated', copy));
  } catch (err) {
    logger.error('duplicateWorkflow error', err);
    return res.status(500).json(apiResponse.error('Failed to duplicate workflow'));
  }
};

// GET /workflows/:id/graph
export const getGraph = async (req, res) => {
  try {
    const workflow = await Workflow.findOne({
      where: { id: req.params.id, userId: req.user.id },
      attributes: ['id', 'nodes', 'edges'],
    });

    if (!workflow) {
      return res.status(404).json(apiResponse.error('Workflow not found'));
    }

    return res.status(200).json(
      apiResponse.success('Graph fetched', {
        nodes: workflow.nodes,
        edges: workflow.edges,
      })
    );
  } catch (err) {
    logger.error('getGraph error', err);
    return res.status(500).json(apiResponse.error('Failed to fetch graph'));
  }
};

// PUT /workflows/:id/graph
export const saveGraph = async (req, res) => {
  try {
    const workflow = await Workflow.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!workflow) {
      return res.status(404).json(apiResponse.error('Workflow not found'));
    }

    const { nodes, edges } = req.body;

    await workflow.update({ nodes, edges });

    logger.info(`Graph saved for workflow: ${workflow.id}`);

    return res.status(200).json(apiResponse.success('Graph saved'));
  } catch (err) {
    logger.error('saveGraph error', err);
    return res.status(500).json(apiResponse.error('Failed to save graph'));
  }
};

// GET /workflows/:id/versions
export const getVersions = async (req, res) => {
  try {
    // TODO: implement versioning table (WorkflowVersion model)
    // For now returns last 10 executions as a proxy
    const versions = await Execution.findAll({
      where: { workflowId: req.params.id },
      order: [['createdAt', 'DESC']],
      limit: 10,
      attributes: ['id', 'status', 'createdAt'],
    });

    return res.status(200).json(apiResponse.success('Versions fetched', versions));
  } catch (err) {
    logger.error('getVersions error', err);
    return res.status(500).json(apiResponse.error('Failed to fetch versions'));
  }
};

// POST /workflows/:id/versions/:versionId/restore
export const restoreVersion = async (req, res) => {
  try {
    // TODO: fetch snapshot from WorkflowVersion, restore nodes/edges
    logger.info(`Restore version ${req.params.versionId} for workflow ${req.params.id}`);
    return res.status(200).json(apiResponse.success('Version restored'));
  } catch (err) {
    logger.error('restoreVersion error', err);
    return res.status(500).json(apiResponse.error('Failed to restore version'));
  }
};

// PATCH /workflows/:id/toggle
export const toggleEnabled = async (req, res) => {
  try {
    const workflow = await Workflow.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!workflow) {
      return res.status(404).json(apiResponse.error('Workflow not found'));
    }

    await workflow.update({ isEnabled: !workflow.isEnabled });

    logger.info(`Workflow ${workflow.id} toggled to ${workflow.isEnabled}`);

    return res.status(200).json(
      apiResponse.success(`Workflow ${workflow.isEnabled ? 'enabled' : 'disabled'}`, {
        isEnabled: workflow.isEnabled,
      })
    );
  } catch (err) {
    logger.error('toggleEnabled error', err);
    return res.status(500).json(apiResponse.error('Failed to toggle workflow'));
  }
};
