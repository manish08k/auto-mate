import { NodeExecutor } from './NodeExecutor.js';
import { DataMapper } from './DataMapper.js';
import { ErrorHandler } from './ErrorHandler.js';
import { logger } from '../utils/logger.js';
import Execution from '../models/Execution.model.js';
import Workflow from '../models/Workflow.model.js';

/**
 * WorkflowEngine
 *
 * The central brain. Given a workflowId + executionId it:
 *  1. Loads the workflow graph (nodes + edges)
 *  2. Resolves execution order via topological sort
 *  3. Runs each node through NodeExecutor in order
 *  4. Passes output data between nodes via DataMapper
 *  5. Handles branching (If/Switch), loops, and parallel paths
 *  6. Writes per-node logs back to the Execution record in real time
 *  7. Marks the execution success / failed when done
 */
export class WorkflowEngine {
  constructor() {
    this.nodeExecutor = new NodeExecutor();
    this.dataMapper = new DataMapper();
    this.errorHandler = new ErrorHandler();
  }

  // ─── Entry point called by queueWorker ────────────────────────────────────
  async run({ executionId, workflowId, inputData = {} }) {
    let execution;

    try {
      execution = await Execution.findByPk(executionId);
      if (!execution) throw new Error(`Execution ${executionId} not found`);

      const workflow = await Workflow.findByPk(workflowId);
      if (!workflow) throw new Error(`Workflow ${workflowId} not found`);

      if (!workflow.isEnabled && execution.triggerType !== 'manual') {
        await this._markSkipped(execution, 'Workflow is disabled');
        return;
      }

      await execution.update({ status: 'running', startedAt: new Date() });

      logger.info(`[Engine] Starting execution ${executionId} for workflow ${workflowId}`);

      const { nodes, edges } = workflow;

      if (!nodes || nodes.length === 0) {
        throw new Error('Workflow has no nodes');
      }

      // Build adjacency maps
      const graph = this._buildGraph(nodes, edges);

      // Topological sort — determines safe execution order
      const executionOrder = this._topologicalSort(graph, nodes);

      // Context holds all node outputs keyed by nodeId
      // Starts with the trigger input data
      const context = {
        $input: inputData,
        $nodes: {},
      };

      const nodeLogs = [];

      // ── Execute nodes in topological order ──────────────────────────────
      for (const nodeId of executionOrder) {
        const node = nodes.find((n) => n.id === nodeId);
        if (!node) continue;

        // Skip disabled nodes
        if (node.data?.disabled) {
          nodeLogs.push(this._nodeLog(node, 'skipped', null, null, 0));
          continue;
        }

        // Resolve any {{ expressions }} in node params using current context
        const resolvedParams = this.dataMapper.resolveParams(node.data?.params || {}, context);

        const nodeStart = Date.now();
        let nodeLog;

        try {
          logger.info(`[Engine] Executing node ${nodeId} (${node.type})`);

          const output = await this.nodeExecutor.execute({
            node: { ...node, data: { ...node.data, params: resolvedParams } },
            context,
            executionId,
          });

          const durationMs = Date.now() - nodeStart;

          // Store this node's output in context for downstream nodes
          context.$nodes[nodeId] = { output, status: 'success' };

          nodeLog = this._nodeLog(node, 'success', resolvedParams, output, durationMs);
          logger.info(`[Engine] Node ${nodeId} completed in ${durationMs}ms`);

          // Handle If/Switch branching — disable edges not taken
          if (node.type === 'ifCondition' || node.type === 'switch') {
            this._applyBranchDecision(graph, nodeId, output, context);
          }
        } catch (nodeErr) {
          const durationMs = Date.now() - nodeStart;
          logger.error(`[Engine] Node ${nodeId} failed: ${nodeErr.message}`);

          const decision = await this.errorHandler.handleNodeError({
            node,
            error: nodeErr,
            executionId,
            context,
          });

          context.$nodes[nodeId] = { output: null, status: 'failed', error: nodeErr.message };
          nodeLog = this._nodeLog(node, 'failed', resolvedParams, null, durationMs, nodeErr.message);

          if (decision === 'abort') {
            nodeLogs.push(nodeLog);
            await this._persistLogs(execution, nodeLogs);
            throw nodeErr; // bubble up to mark whole execution failed
          }

          // decision === 'continue' → log the error and keep going
        }

        nodeLogs.push(nodeLog);

        // Persist logs incrementally so the UI can stream them
        await this._persistLogs(execution, nodeLogs);
      }

      // ── All nodes done ───────────────────────────────────────────────────
      const durationMs = Date.now() - new Date(execution.startedAt).getTime();

      await execution.update({
        status: 'success',
        finishedAt: new Date(),
        durationMs,
        nodeLogs,
        outputData: context.$nodes,
      });

      logger.info(`[Engine] Execution ${executionId} completed in ${durationMs}ms`);
    } catch (err) {
      logger.error(`[Engine] Execution ${executionId} failed: ${err.message}`);

      if (execution) {
        await execution.update({
          status: 'failed',
          finishedAt: new Date(),
          durationMs: execution.startedAt
            ? Date.now() - new Date(execution.startedAt).getTime()
            : 0,
          error: err.message,
        }).catch(() => {}); // don't throw during error handling
      }

      throw err; // re-throw so Bull marks the job failed and can retry
    }
  }

  // ─── Build adjacency maps from edges ──────────────────────────────────────
  _buildGraph(nodes, edges) {
    const graph = {
      // nodeId → array of child nodeIds
      children: {},
      // nodeId → array of parent nodeIds
      parents: {},
      // nodeId → edge metadata (for branch handling)
      edgeMeta: {},
    };

    for (const node of nodes) {
      graph.children[node.id] = [];
      graph.parents[node.id] = [];
    }

    for (const edge of edges || []) {
      graph.children[edge.source]?.push(edge.target);
      graph.parents[edge.target]?.push(edge.source);
      graph.edgeMeta[`${edge.source}→${edge.target}`] = edge;
    }

    return graph;
  }

  // ─── Kahn's algorithm topological sort ────────────────────────────────────
  _topologicalSort(graph, nodes) {
    const inDegree = {};
    for (const node of nodes) {
      inDegree[node.id] = graph.parents[node.id]?.length || 0;
    }

    const queue = nodes
      .filter((n) => inDegree[n.id] === 0)
      .map((n) => n.id);

    const order = [];

    while (queue.length > 0) {
      const nodeId = queue.shift();
      order.push(nodeId);

      for (const child of graph.children[nodeId] || []) {
        inDegree[child]--;
        if (inDegree[child] === 0) queue.push(child);
      }
    }

    if (order.length !== nodes.length) {
      logger.warn('[Engine] Cycle detected in workflow graph — executing reachable nodes only');
    }

    return order;
  }

  // ─── If/Switch: mark skipped branches in context ──────────────────────────
  _applyBranchDecision(graph, nodeId, output, context) {
    const takenBranch = output?._branch; // NodeExecutor sets this
    if (!takenBranch) return;

    for (const childId of graph.children[nodeId] || []) {
      const edgeKey = `${nodeId}→${childId}`;
      const edge = graph.edgeMeta[edgeKey];
      if (edge?.data?.branch && edge.data.branch !== takenBranch) {
        // Mark this node as skipped so the executor skips it
        context.$nodes[childId] = { output: null, status: 'skipped' };
      }
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────
  _nodeLog(node, status, input, output, durationMs, error = null) {
    return {
      nodeId: node.id,
      nodeName: node.data?.label || node.type,
      nodeType: node.type,
      status,
      input,
      output,
      durationMs,
      error,
      timestamp: new Date().toISOString(),
    };
  }

  async _persistLogs(execution, nodeLogs) {
    await execution.update({ nodeLogs }).catch((e) =>
      logger.warn(`[Engine] Failed to persist logs: ${e.message}`)
    );
  }

  async _markSkipped(execution, reason) {
    await execution.update({ status: 'skipped', error: reason, finishedAt: new Date() });
    logger.info(`[Engine] Execution ${execution.id} skipped: ${reason}`);
  }
}
