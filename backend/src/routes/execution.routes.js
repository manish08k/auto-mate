import { Router } from 'express';
import {
  runWorkflow,
  getExecution,
  getExecutions,
  getLogs,
  getNodeOutput,
  cancelExecution,
  retryExecution,
  deleteExecution,
  streamLogs,
} from '../controllers/executionController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);

// run
router.post('/workflows/:workflowId/run',        runWorkflow);
router.get ('/workflows/:workflowId/executions', getExecutions);

// single execution
router.get   ('/:id',                  getExecution);
router.delete('/:id',                  deleteExecution);
router.post  ('/:id/cancel',           cancelExecution);
router.post  ('/:id/retry',            retryExecution);

// logs
router.get('/:id/logs',                getLogs);
router.get('/:id/stream',              streamLogs);   // SSE — no body parser needed

// per-node output
router.get('/:id/nodes/:nodeId',       getNodeOutput);

export default router;
