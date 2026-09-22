import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getAuditLogsController,
  getAuditStatsController,
} from '../controllers/audit.controller';

const router = Router();

// All audit routes require authentication and super admin role
router.use(authenticate);

router.get('/logs', getAuditLogsController);
router.get('/stats', getAuditStatsController);

export default router;

