import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getDepartmentStockController,
  getDepartmentStockItemController,
  reconcileDepartmentStockController,
  getIncomingItemsController,
  confirmReceiptController,
  createUsageLogController,
  createBulkUsageLogsController,
  getUsageLogsController,
  getUsageLogByIdController,
  updateUsageLogController,
  deleteUsageLogController,
  getDepartmentSummaryController,
  getUsageReportController,
  getMonthlyConsumptionController,
  verifyDepartmentStockController,
} from '../controllers/department.controller';
import {
  validateReconcileStock,
  validateConfirmReceipt,
  validateCreateUsageLog,
  validateBulkUsageLogs,
  validateUpdateUsageLog,
  validateDeleteUsageLog,
} from '../utils/validators';

const router = Router();

// All department routes require authentication
router.use(authenticate);

// ==================== DEPARTMENT STOCK ROUTES ====================
router.get('/:dept/stock', getDepartmentStockController);
router.get('/:dept/stock/:itemId', getDepartmentStockItemController);
router.put(
  '/:dept/stock/:itemId',
  validateReconcileStock(),
  reconcileDepartmentStockController
);

// ==================== INCOMING ITEMS ROUTES ====================
router.get('/:dept/incoming', getIncomingItemsController);
router.put(
  '/:dept/incoming/:id',
  validateConfirmReceipt(),
  confirmReceiptController
);

// ==================== USAGE LOG ROUTES ====================
router.post(
  '/:dept/usage',
  validateCreateUsageLog(),
  createUsageLogController
);
router.post(
  '/:dept/usage/bulk',
  validateBulkUsageLogs(),
  createBulkUsageLogsController
);
router.get('/:dept/usage', getUsageLogsController);
router.get('/:dept/usage/:id', getUsageLogByIdController);
router.put(
  '/:dept/usage/:id',
  validateUpdateUsageLog(),
  updateUsageLogController
);
router.delete(
  '/:dept/usage/:id',
  validateDeleteUsageLog(),
  deleteUsageLogController
);

// ==================== REPORTS ROUTES ====================
router.get('/:dept/reports/summary', getDepartmentSummaryController);
router.get('/:dept/reports/usage', getUsageReportController);
router.get('/:dept/reports/consumption', getMonthlyConsumptionController);

// ==================== VERIFICATION ROUTES ====================
router.get('/:dept/verify', verifyDepartmentStockController);

export default router;

