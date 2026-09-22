import { Router } from 'express';
import {
  loginController,
  logoutController,
  refreshTokenController,
  getMeController,
  changePasswordController,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validateLogin, validateChangePassword } from '../utils/validators';

const router = Router();

router.post('/login', validateLogin(), loginController);
router.post('/logout', logoutController);
router.post('/refresh-token', refreshTokenController);
router.get('/me', authenticate, getMeController);
router.put('/change-password', authenticate, validateChangePassword(), changePasswordController);

export default router;

