import { Router } from 'express';
import {
  getWorkflows,
  getWorkflow,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  duplicateWorkflow,
  getGraph,
  saveGraph,
  getVersions,
  restoreVersion,
  toggleEnabled,
} from '../controllers/workflowController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createWorkflowSchema,
  updateWorkflowSchema,
  saveGraphSchema,
} from '../validators/workflowValidators.js';

const router = Router();

router.use(protect);

router.get   ('/',                          getWorkflows);
router.post  ('/',    validate(createWorkflowSchema), createWorkflow);

router.get   ('/:id',                       getWorkflow);
router.patch ('/:id', validate(updateWorkflowSchema), updateWorkflow);
router.delete('/:id',                       deleteWorkflow);

router.post  ('/:id/duplicate',             duplicateWorkflow);
router.patch ('/:id/enabled',               toggleEnabled);

router.get   ('/:id/graph',                 getGraph);
router.put   ('/:id/graph', validate(saveGraphSchema), saveGraph);

router.get   ('/:id/versions',              getVersions);
router.post  ('/:id/versions/:versionId/restore', restoreVersion);

export default router;
