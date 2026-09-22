import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getDashboardController,
  getDepartmentComparisonController,
  getStockPredictionsController,
} from '../controllers/analytics.controller';

const router = Router();

// All analytics routes require authentication
router.use(authenticate);

// ==================== DASHBOARD ROUTES ====================
router.get('/dashboard', getDashboardController);

// ==================== COMPARISON ROUTES ====================
router.get('/comparison', getDepartmentComparisonController);

// ==================== PREDICTIONS ROUTES ====================
router.get('/predictions', getStockPredictionsController);

export default router;

