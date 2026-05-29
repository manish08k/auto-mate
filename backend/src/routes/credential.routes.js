import { Router } from 'express';
import {
  getCredentials,
  getCredential,
  createCredential,
  updateCredential,
  deleteCredential,
  testCredential,
  getCredentialTypes,
  getCredentialUsage,
} from '../controllers/credentialController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createCredentialSchema,
  updateCredentialSchema,
} from '../validators/credentialValidators.js';

const router = Router();

router.use(protect);

router.get ('/types',                        getCredentialTypes);
router.get ('/',                             getCredentials);
router.post('/', validate(createCredentialSchema), createCredential);

router.get   ('/:id',                        getCredential);
router.patch ('/:id', validate(updateCredentialSchema), updateCredential);
router.delete('/:id',                        deleteCredential);
router.post  ('/:id/test',                   testCredential);
router.get   ('/:id/usage',                  getCredentialUsage);

export default router;
