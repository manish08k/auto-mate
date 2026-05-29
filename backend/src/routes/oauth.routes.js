import { Router } from 'express';
import {
  oauthAuthorize,
  oauthCallback,
  oauthRevoke,
  getConnectedAccounts,
} from '../controllers/oauthController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);

// GET  /oauth/:provider/authorize  — redirect to provider
// GET  /oauth/:provider/callback   — handle code exchange (also public for redirect)
// DELETE /oauth/:provider/revoke   — disconnect account
// GET  /oauth/accounts             — list all connected OAuth accounts

router.get   ('/accounts',             getConnectedAccounts);
router.get   ('/:provider/authorize',  oauthAuthorize);
router.get   ('/:provider/callback',   oauthCallback);
router.delete('/:provider/revoke',     oauthRevoke);

export default router;
