import { Router } from 'express';
import {
  login,
  register,
  logout,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  loginSchema,
  registerSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validators/authValidators.js';

const router = Router();

router.post('/login',          validate(loginSchema),          login);
router.post('/register',       validate(registerSchema),       register);
router.post('/logout',         protect,                        logout);
router.get ('/me',             protect,                        getMe);
router.patch('/me',            protect,                        updateProfile);
router.post('/change-password',protect, validate(changePasswordSchema), changePassword);
router.post('/forgot-password',         validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password',          validate(resetPasswordSchema),  resetPassword);

export default router;
