import { Router } from 'express';
import {
  triggerWebhook,
  getWebhookInfo,
} from '../controllers/webhookController.js';
import { verifyWebhookSignature } from '../middleware/webhookAuth.js';

const router = Router();

// Public — no JWT auth, protected by per-webhook signature verification
// POST /webhook/:id       — trigger a workflow via webhook
// GET  /webhook/:id       — return webhook metadata (method, headers expected)

router.get ('/:id',                          getWebhookInfo);
router.post('/:id', verifyWebhookSignature,  triggerWebhook);
router.put ('/:id', verifyWebhookSignature,  triggerWebhook);   // allow PUT triggers too

export default router;
