import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import * as departmentService from '../services/department.service';
import * as analyticsService from '../services/analytics.service';
import { Department, UsageCategory } from '@prisma/client';

// Helper to get department from user role
const getDepartmentFromRole = (role: string): Department | null => {
  const roleToDept: Record<string, Department> = {
    DEPT_ADMIN_COMPUTER: Department.COMPUTER_ENGINEERING,
    DEPT_ADMIN_CIVIL: Department.CIVIL_ENGINEERING,
    DEPT_ADMIN_ELECTRICAL: Department.ELECTRICAL_ENGINEERING,
    DEPT_ADMIN_ELECTRONICS: Department.ELECTRONICS_TELECOMMUNICATION,
    DEPT_ADMIN_MECHANICAL: Department.MECHANICAL_ENGINEERING,
  };
  return roleToDept[role] || null;
};

// ==================== DEPARTMENT STOCK CONTROLLERS ====================

export const getDepartmentStockController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { dept } = req.params;
    const userRole = req.user?.role || '';
    const userDept = getDepartmentFromRole(userRole);

    // Super admin can access any department, others only their own
    let department: Department;
    if (req.user?.role === 'SUPER_ADMIN') {
      department = dept as Department;
    } else if (userDept) {
      department = userDept;
    } else {
      const error: AppError = new Error('Unauthorized: Department access denied');
      error.statusCode = 403;
      throw error;
    }

    const stock = await departmentService.getDepartmentStock(department);
    res.status(200).json({
      success: true,
      data: stock,
    });
  } catch (error) {
    next(error);
  }
};

export const getDepartmentStockItemController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { dept, itemId } = req.params;
    const userRole = req.user?.role || '';
    const userDept = getDepartmentFromRole(userRole);

    let department: Department;
    if (req.user?.role === 'SUPER_ADMIN') {
      department = dept as Department;
    } else if (userDept) {
      department = userDept;
    } else {
      const error: AppError = new Error('Unauthorized: Department access denied');
      error.statusCode = 403;
      throw error;
    }

    const data = await departmentService.getDepartmentStockItem(department, itemId);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const reconcileDepartmentStockController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error: AppError = new Error('Validation failed');
      error.statusCode = 400;
      error.data = errors.array();
      throw error;
    }

    const { dept, itemId } = req.params;
    const { newQuantity, reason } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      const error: AppError = new Error('Unauthorized');
      error.statusCode = 401;
      throw error;
    }

    const userRole = req.user?.role || '';
    const userDept = getDepartmentFromRole(userRole);

    let department: Department;
    if (req.user?.role === 'SUPER_ADMIN') {
      department = dept as Department;
    } else if (userDept) {
      department = userDept;
    } else {
      const error: AppError = new Error('Unauthorized: Department access denied');
      error.statusCode = 403;
      throw error;
    }

    const result = await departmentService.reconcileDepartmentStock(
      department,
      itemId,
      parseInt(newQuantity),
      reason,
      userId
    );

    res.status(200).json({
      success: true,
      message: 'Stock reconciled successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== INCOMING ITEMS CONTROLLERS ====================

export const getIncomingItemsController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { dept } = req.params;
    const userRole = req.user?.role || '';
    const userDept = getDepartmentFromRole(userRole);

    let department: Department;
    if (req.user?.role === 'SUPER_ADMIN') {
      department = dept as Department;
    } else if (userDept) {
      department = userDept;
    } else {
      const error: AppError = new Error('Unauthorized: Department access denied');
      error.statusCode = 403;
      throw error;
    }

    const items = await departmentService.getIncomingItems(department);
    res.status(200).json({
      success: true,
      data: items,
    });
  } catch (error) {
    next(error);
  }
};

export const confirmReceiptController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error: AppError = new Error('Validation failed');
      error.statusCode = 400;
      error.data = errors.array();
      throw error;
    }

    const { dept, id } = req.params;
    const { receivedQuantity } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      const error: AppError = new Error('Unauthorized');
      error.statusCode = 401;
      throw error;
    }

    const userRole = req.user?.role || '';
    const userDept = getDepartmentFromRole(userRole);

    let department: Department;
    if (req.user?.role === 'SUPER_ADMIN') {
      department = dept as Department;
    } else if (userDept) {
      department = userDept;
    } else {
      const error: AppError = new Error('Unauthorized: Department access denied');
      error.statusCode = 403;
      throw error;
    }

    const result = await departmentService.confirmReceipt(
      id,
      parseInt(receivedQuantity),
      department,
      userId
    );

    res.status(200).json({
      success: true,
      message: 'Receipt confirmed successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== USAGE LOG CONTROLLERS ====================

export const createUsageLogController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error: AppError = new Error('Validation failed');
      error.statusCode = 400;
      error.data = errors.array();
      throw error;
    }

    const { dept } = req.params;
    const userRole = req.user?.role || '';
    const userDept = getDepartmentFromRole(userRole);
    const userId = req.user?.id;

    if (!userId) {
      const error: AppError = new Error('Unauthorized');
      error.statusCode = 401;
      throw error;
    }

    let department: Department;
    if (req.user?.role === 'SUPER_ADMIN') {
      department = dept as Department;
    } else if (userDept) {
      department = userDept;
    } else {
      const error: AppError = new Error('Unauthorized: Department access denied');
      error.statusCode = 403;
      throw error;
    }

    const { itemId, quantityUsed, usageDate, category, purpose, attachmentUrl } = req.body;

    const result = await departmentService.createUsageLog(
      department,
      {
        itemId,
        quantityUsed: parseInt(quantityUsed),
        usageDate: new Date(usageDate),
        category: category as UsageCategory,
        purpose,
        attachmentUrl,
      },
      userId
    );

    res.status(201).json({
      success: true,
      message: 'Usage logged successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const createBulkUsageLogsController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error: AppError = new Error('Validation failed');
      error.statusCode = 400;
      error.data = errors.array();
      throw error;
    }

    const { dept } = req.params;
    const userRole = req.user?.role || '';
    const userDept = getDepartmentFromRole(userRole);
    const userId = req.user?.id;

    if (!userId) {
      const error: AppError = new Error('Unauthorized');
      error.statusCode = 401;
      throw error;
    }

    let department: Department;
    if (req.user?.role === 'SUPER_ADMIN') {
      department = dept as Department;
    } else if (userDept) {
      department = userDept;
    } else {
      const error: AppError = new Error('Unauthorized: Department access denied');
      error.statusCode = 403;
      throw error;
    }

    const { logs } = req.body;

    const result = await departmentService.createBulkUsageLogs(
      department,
      {
        logs: logs.map((log: any) => ({
          itemId: log.itemId,
          quantityUsed: parseInt(log.quantityUsed),
          usageDate: new Date(log.usageDate),
          category: log.category as UsageCategory,
          purpose: log.purpose,
          attachmentUrl: log.attachmentUrl,
        })),
      },
      userId
    );

    res.status(201).json({
      success: true,
      message: `${result.length} usage log(s) created successfully`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getUsageLogsController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { dept } = req.params;
    const userRole = req.user?.role || '';
    const userDept = getDepartmentFromRole(userRole);

    let department: Department;
    if (req.user?.role === 'SUPER_ADMIN') {
      department = dept as Department;
    } else if (userDept) {
      department = userDept;
    } else {
      const error: AppError = new Error('Unauthorized: Department access denied');
      error.statusCode = 403;
      throw error;
    }

    const { startDate, endDate, itemId, category, usedById } = req.query;

    const filters: any = {};
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);
    if (itemId) filters.itemId = itemId as string;
    if (category) filters.category = category as UsageCategory;
    if (usedById) filters.usedById = usedById as string;

    const logs = await departmentService.getUsageLogs(department, filters);

    res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};

export const getUsageLogByIdController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { dept, id } = req.params;
    const userRole = req.user?.role || '';
    const userDept = getDepartmentFromRole(userRole);

    let department: Department;
    if (req.user?.role === 'SUPER_ADMIN') {
      department = dept as Department;
    } else if (userDept) {
      department = userDept;
    } else {
      const error: AppError = new Error('Unauthorized: Department access denied');
      error.statusCode = 403;
      throw error;
    }

    const log = await departmentService.getUsageLogById(id, department);

    res.status(200).json({
      success: true,
      data: log,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUsageLogController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error: AppError = new Error('Validation failed');
      error.statusCode = 400;
      error.data = errors.array();
      throw error;
    }

    const { dept, id } = req.params;
    const { quantityUsed, usageDate, category, purpose, attachmentUrl, reason } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      const error: AppError = new Error('Unauthorized');
      error.statusCode = 401;
      throw error;
    }

    const userRole = req.user?.role || '';
    const userDept = getDepartmentFromRole(userRole);

    let department: Department;
    if (req.user?.role === 'SUPER_ADMIN') {
      department = dept as Department;
    } else if (userDept) {
      department = userDept;
    } else {
      const error: AppError = new Error('Unauthorized: Department access denied');
      error.statusCode = 403;
      throw error;
    }

    const updateData: any = {};
    if (quantityUsed !== undefined) updateData.quantityUsed = parseInt(quantityUsed);
    if (usageDate) updateData.usageDate = new Date(usageDate);
    if (category) updateData.category = category as UsageCategory;
    if (purpose) updateData.purpose = purpose;
    if (attachmentUrl !== undefined) updateData.attachmentUrl = attachmentUrl;

    const result = await departmentService.updateUsageLog(
      id,
      department,
      updateData,
      userId,
      reason
    );

    res.status(200).json({
      success: true,
      message: 'Usage log updated successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUsageLogController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error: AppError = new Error('Validation failed');
      error.statusCode = 400;
      error.data = errors.array();
      throw error;
    }

    const { dept, id } = req.params;
    const { reason } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      const error: AppError = new Error('Unauthorized');
      error.statusCode = 401;
      throw error;
    }

    const userRole = req.user?.role || '';
    const userDept = getDepartmentFromRole(userRole);

    let department: Department;
    if (req.user?.role === 'SUPER_ADMIN') {
      department = dept as Department;
    } else if (userDept) {
      department = userDept;
    } else {
      const error: AppError = new Error('Unauthorized: Department access denied');
      error.statusCode = 403;
      throw error;
    }

    const result = await departmentService.deleteUsageLog(id, department, userId, reason);

    res.status(200).json({
      success: true,
      message: 'Usage log deleted successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== REPORTS CONTROLLERS ====================

export const getDepartmentSummaryController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { dept } = req.params;
    const userRole = req.user?.role || '';
    const userDept = getDepartmentFromRole(userRole);

    let department: Department;
    if (req.user?.role === 'SUPER_ADMIN') {
      department = dept as Department;
    } else if (userDept) {
      department = userDept;
    } else {
      const error: AppError = new Error('Unauthorized: Department access denied');
      error.statusCode = 403;
      throw error;
    }

    const summary = await departmentService.getDepartmentSummary(department);

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

export const getUsageReportController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { dept } = req.params;
    const { startDate, endDate } = req.query;
    const userRole = req.user?.role || '';
    const userDept = getDepartmentFromRole(userRole);

    let department: Department;
    if (req.user?.role === 'SUPER_ADMIN') {
      department = dept as Department;
    } else if (userDept) {
      department = userDept;
    } else {
      const error: AppError = new Error('Unauthorized: Department access denied');
      error.statusCode = 403;
      throw error;
    }

    if (!startDate || !endDate) {
      const error: AppError = new Error('Start date and end date are required');
      error.statusCode = 400;
      throw error;
    }

    const report = await departmentService.getUsageReport(
      department,
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

export const getMonthlyConsumptionController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { dept } = req.params;
    const { itemId } = req.query;
    const userRole = req.user?.role || '';
    const userDept = getDepartmentFromRole(userRole);

    let department: Department;
    if (req.user?.role === 'SUPER_ADMIN') {
      department = dept as Department;
    } else if (userDept) {
      department = userDept;
    } else {
      const error: AppError = new Error('Unauthorized: Department access denied');
      error.statusCode = 403;
      throw error;
    }

    const consumption = await departmentService.getMonthlyConsumption(
      department,
      itemId as string | undefined
    );

    res.status(200).json({
      success: true,
      data: consumption,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== VERIFICATION CONTROLLER ====================

export const verifyDepartmentStockController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { dept } = req.params;
    const { itemId } = req.query;
    const userRole = req.user?.role || '';
    const userDept = getDepartmentFromRole(userRole);

    let department: Department;
    if (req.user?.role === 'SUPER_ADMIN') {
      department = dept as Department;
    } else if (userDept) {
      department = userDept;
    } else {
      const error: AppError = new Error('Unauthorized: Department access denied');
      error.statusCode = 403;
      throw error;
    }

    const verifications = await departmentService.verifyDepartmentStock(
      department,
      itemId as string | undefined
    );

    res.status(200).json({
      success: true,
      data: verifications,
    });
  } catch (error) {
    next(error);
  }
};

