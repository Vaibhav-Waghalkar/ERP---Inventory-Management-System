import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import * as storeService from '../services/store.service';
import { processBillImage } from '../middleware/upload';
import path from 'path';

// ==================== CATEGORY CONTROLLERS ====================

export const getAllCategoriesController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const categories = await storeService.getAllCategories();
    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

export const getCategoryByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const category = await storeService.getCategoryById(id);
    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

export const createCategoryController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error: AppError = new Error('Validation failed');
      error.statusCode = 400;
      (error as any).errors = errors.array();
      throw error;
    }

    const category = await storeService.createCategory(req.body);
    res.status(201).json({
      success: true,
      data: category,
      message: 'Category created successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const updateCategoryController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error: AppError = new Error('Validation failed');
      error.statusCode = 400;
      (error as any).errors = errors.array();
      throw error;
    }

    const { id } = req.params;
    const category = await storeService.updateCategory(id, req.body);
    res.status(200).json({
      success: true,
      data: category,
      message: 'Category updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCategoryController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    await storeService.deleteCategory(id);
    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ==================== ITEM CONTROLLERS ====================

export const getAllItemsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { search, categoryId } = req.query;
    const items = await storeService.getAllItems(
      search as string,
      categoryId as string
    );
    res.status(200).json({
      success: true,
      data: items,
    });
  } catch (error) {
    next(error);
  }
};

export const getItemByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const item = await storeService.getItemById(id);
    res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

export const createItemController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error: AppError = new Error('Validation failed');
      error.statusCode = 400;
      (error as any).errors = errors.array();
      throw error;
    }

    const item = await storeService.createItem(req.body);
    res.status(201).json({
      success: true,
      data: item,
      message: 'Item created successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const updateItemController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error: AppError = new Error('Validation failed');
      error.statusCode = 400;
      (error as any).errors = errors.array();
      throw error;
    }

    const { id } = req.params;
    const item = await storeService.updateItem(id, req.body);
    res.status(200).json({
      success: true,
      data: item,
      message: 'Item updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteItemController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    await storeService.deleteItem(id);
    res.status(200).json({
      success: true,
      message: 'Item deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ==================== STORE ENTRY CONTROLLERS ====================

export const getAllStoreEntriesController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const filters: any = {};
    if (req.query.itemId) filters.itemId = req.query.itemId as string;
    if (req.query.vendorName) filters.vendorName = req.query.vendorName as string;
    if (req.query.billNumber) filters.billNumber = req.query.billNumber as string;
    if (req.query.dateFrom) filters.dateFrom = new Date(req.query.dateFrom as string);
    if (req.query.dateTo) filters.dateTo = new Date(req.query.dateTo as string);
    if (req.query.amountFrom) filters.amountFrom = parseFloat(req.query.amountFrom as string);
    if (req.query.amountTo) filters.amountTo = parseFloat(req.query.amountTo as string);

    const result = await storeService.getAllStoreEntries(page, limit, filters);
    res.status(200).json({
      success: true,
      data: result.entries,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const getStoreEntryByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const entry = await storeService.getStoreEntryById(id);
    res.status(200).json({
      success: true,
      data: entry,
    });
  } catch (error) {
    next(error);
  }
};

export const createStoreEntryController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error: AppError = new Error('Validation failed');
      error.statusCode = 400;
      (error as any).errors = errors.array();
      throw error;
    }

    if (!req.user) {
      const error: AppError = new Error('Authentication required');
      error.statusCode = 401;
      throw error;
    }

    let billImageUrl: string | undefined;

    // Process uploaded file if exists
    if (req.file) {
      const processedPath = await processBillImage(req.file.path);
      billImageUrl = `/uploads/bills/${path.basename(processedPath)}`;
    }

    const entryData: storeService.CreateStoreEntryData = {
      ...req.body,
      billDate: new Date(req.body.billDate),
      billAmount: parseFloat(req.body.billAmount),
      quantity: parseInt(req.body.quantity),
      billImageUrl,
      addedById: req.user.userId,
    };

    const entry = await storeService.createStoreEntry(entryData);
    res.status(201).json({
      success: true,
      data: entry,
      message: 'Stock entry created successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const updateStoreEntryController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error: AppError = new Error('Validation failed');
      error.statusCode = 400;
      (error as any).errors = errors.array();
      throw error;
    }

    if (!req.user) {
      const error: AppError = new Error('Authentication required');
      error.statusCode = 401;
      throw error;
    }

    const { id } = req.params;
    const { reason } = req.body;

    let billImageUrl: string | undefined;

    // Process uploaded file if exists
    if (req.file) {
      const processedPath = await processBillImage(req.file.path);
      billImageUrl = `/uploads/bills/${path.basename(processedPath)}`;
    }

    const updateData: storeService.UpdateStoreEntryData = {
      ...req.body,
      ...(req.body.billDate && { billDate: new Date(req.body.billDate) }),
      ...(req.body.billAmount !== undefined && { billAmount: parseFloat(req.body.billAmount) }),
      ...(req.body.quantity !== undefined && { quantity: parseInt(req.body.quantity) }),
      ...(billImageUrl && { billImageUrl }),
    };

    // Remove reason from update data
    delete (updateData as any).reason;

    const entry = await storeService.updateStoreEntry(id, updateData, req.user.userId, reason);
    res.status(200).json({
      success: true,
      data: entry,
      message: 'Stock entry updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteStoreEntryController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    await storeService.deleteStoreEntry(id);
    res.status(200).json({
      success: true,
      message: 'Stock entry deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ==================== DISTRIBUTION CONTROLLERS ====================

export const getAllDistributionsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const filters: any = {};
    if (req.query.itemId) filters.itemId = req.query.itemId as string;
    if (req.query.toDepartment) filters.toDepartment = req.query.toDepartment as string;
    if (req.query.dateFrom) filters.dateFrom = new Date(req.query.dateFrom as string);
    if (req.query.dateTo) filters.dateTo = new Date(req.query.dateTo as string);

    const result = await storeService.getAllDistributions(page, limit, filters);
    res.status(200).json({
      success: true,
      data: result.distributions,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const getDistributionByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const distribution = await storeService.getDistributionById(id);
    res.status(200).json({
      success: true,
      data: distribution,
    });
  } catch (error) {
    next(error);
  }
};

export const createDistributionController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error: AppError = new Error('Validation failed');
      error.statusCode = 400;
      (error as any).errors = errors.array();
      throw error;
    }

    if (!req.user) {
      const error: AppError = new Error('Authentication required');
      error.statusCode = 401;
      throw error;
    }

    const distributionData: storeService.CreateDistributionData = {
      ...req.body,
      quantity: parseInt(req.body.quantity),
      ...(req.body.receivedDate && { receivedDate: new Date(req.body.receivedDate) }),
      distributedById: req.user.userId,
    };

    const distribution = await storeService.createDistribution(distributionData);
    res.status(201).json({
      success: true,
      data: distribution,
      message: 'Items distributed successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const updateDistributionController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error: AppError = new Error('Validation failed');
      error.statusCode = 400;
      (error as any).errors = errors.array();
      throw error;
    }

    if (!req.user) {
      const error: AppError = new Error('Authentication required');
      error.statusCode = 401;
      throw error;
    }

    const { id } = req.params;
    const { reason } = req.body;

    const updateData: storeService.UpdateDistributionData = {
      ...req.body,
      ...(req.body.quantity !== undefined && { quantity: parseInt(req.body.quantity) }),
      ...(req.body.receivedDate && { receivedDate: new Date(req.body.receivedDate) }),
    };

    // Remove reason from update data
    delete (updateData as any).reason;

    const distribution = await storeService.updateDistribution(id, updateData, req.user.userId, reason);
    res.status(200).json({
      success: true,
      data: distribution,
      message: 'Distribution updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ==================== STOCK CONTROLLERS ====================

export const getStoreStockController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { itemId } = req.query;
    const stocks = await storeService.getStoreStock(itemId as string);
    res.status(200).json({
      success: true,
      data: stocks,
    });
  } catch (error) {
    next(error);
  }
};

export const getLowStockItemsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const lowStockItems = await storeService.getLowStockItems();
    res.status(200).json({
      success: true,
      data: lowStockItems,
    });
  } catch (error) {
    next(error);
  }
};

export const getItemStockController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { itemId } = req.params;
    const stock = await storeService.getItemStock(itemId);
    res.status(200).json({
      success: true,
      data: stock,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== REPORTS CONTROLLERS ====================

export const getStockSummaryReportController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined;
    const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : undefined;

    const report = await storeService.getStockSummaryReport(dateFrom, dateTo);
    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

export const getInwardReportController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined;
    const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : undefined;

    const report = await storeService.getInwardReport(dateFrom, dateTo);
    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

export const getOutwardReportController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined;
    const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : undefined;

    const report = await storeService.getOutwardReport(dateFrom, dateTo);
    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

