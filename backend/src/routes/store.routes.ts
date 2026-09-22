import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/roleCheck';
import { uploadBill } from '../middleware/upload';
import {
  getAllCategoriesController,
  getCategoryByIdController,
  createCategoryController,
  updateCategoryController,
  deleteCategoryController,
  getAllItemsController,
  getItemByIdController,
  createItemController,
  updateItemController,
  deleteItemController,
  getAllStoreEntriesController,
  getStoreEntryByIdController,
  createStoreEntryController,
  updateStoreEntryController,
  deleteStoreEntryController,
  getAllDistributionsController,
  getDistributionByIdController,
  createDistributionController,
  updateDistributionController,
  getStoreStockController,
  getLowStockItemsController,
  getItemStockController,
  getStockSummaryReportController,
  getInwardReportController,
  getOutwardReportController,
} from '../controllers/store.controller';
import {
  validateCreateCategory,
  validateUpdateCategory,
  validateCreateItem,
  validateUpdateItem,
  validateCreateStoreEntry,
  validateUpdateStoreEntry,
  validateCreateDistribution,
  validateUpdateDistribution,
} from '../utils/validators';

const router = Router();

// Store admin and super admin can access all store routes
const storeAdminOnly = requireRole('STORE_ADMIN', 'SUPER_ADMIN');

// ==================== CATEGORY ROUTES ====================
router.get('/categories', authenticate, getAllCategoriesController);
router.get('/categories/:id', authenticate, getCategoryByIdController);
router.post('/categories', authenticate, storeAdminOnly, validateCreateCategory(), createCategoryController);
router.put('/categories/:id', authenticate, storeAdminOnly, validateUpdateCategory(), updateCategoryController);
router.delete('/categories/:id', authenticate, storeAdminOnly, deleteCategoryController);

// ==================== ITEM ROUTES ====================
router.get('/items', authenticate, getAllItemsController);
router.get('/items/:id', authenticate, getItemByIdController);
router.post('/items', authenticate, storeAdminOnly, validateCreateItem(), createItemController);
router.put('/items/:id', authenticate, storeAdminOnly, validateUpdateItem(), updateItemController);
router.delete('/items/:id', authenticate, storeAdminOnly, deleteItemController);

// ==================== STORE ENTRY ROUTES ====================
router.get('/entries', authenticate, storeAdminOnly, getAllStoreEntriesController);
router.get('/entries/:id', authenticate, storeAdminOnly, getStoreEntryByIdController);
router.post(
  '/entries',
  authenticate,
  storeAdminOnly,
  uploadBill.single('billImage'),
  validateCreateStoreEntry(),
  createStoreEntryController
);
router.put(
  '/entries/:id',
  authenticate,
  storeAdminOnly,
  uploadBill.single('billImage'),
  validateUpdateStoreEntry(),
  updateStoreEntryController
);
router.delete('/entries/:id', authenticate, storeAdminOnly, deleteStoreEntryController);

// ==================== DISTRIBUTION ROUTES ====================
router.get('/distributions', authenticate, getAllDistributionsController);
router.get('/distributions/:id', authenticate, getDistributionByIdController);
router.post(
  '/distributions',
  authenticate,
  storeAdminOnly,
  validateCreateDistribution(),
  createDistributionController
);
router.put(
  '/distributions/:id',
  authenticate,
  storeAdminOnly,
  validateUpdateDistribution(),
  updateDistributionController
);

// ==================== STOCK ROUTES ====================
router.get('/stock', authenticate, getStoreStockController);
router.get('/stock/low', authenticate, getLowStockItemsController);
router.get('/stock/:itemId', authenticate, getItemStockController);

// ==================== REPORTS ROUTES ====================
router.get('/reports/summary', authenticate, storeAdminOnly, getStockSummaryReportController);
router.get('/reports/inward', authenticate, storeAdminOnly, getInwardReportController);
router.get('/reports/outward', authenticate, storeAdminOnly, getOutwardReportController);

export default router;

