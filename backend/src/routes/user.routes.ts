import { Router } from 'express';
import {
  getAllUsersController,
  getUserByIdController,
  createUserController,
  updateUserController,
  deleteUserController,
  toggleUserStatusController,
} from '../controllers/user.controller';
import { authenticate } from '../middleware/auth';
import { requireSuperAdmin } from '../middleware/roleCheck';
import { validateCreateUser, validateUpdateUser } from '../utils/validators';

const router = Router();

// All user routes require authentication and super admin role
router.use(authenticate);
router.use(requireSuperAdmin);

router.get('/', getAllUsersController);
router.get('/:id', getUserByIdController);
router.post('/', validateCreateUser(), createUserController);
router.put('/:id', validateUpdateUser(), updateUserController);
router.delete('/:id', deleteUserController);
router.patch('/:id/toggle-status', toggleUserStatusController);

export default router;

