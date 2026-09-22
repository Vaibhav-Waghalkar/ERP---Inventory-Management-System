import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import * as analyticsService from '../services/analytics.service';
import { Department } from '@prisma/client';

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

export const getDashboardController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { role, dept } = req.query;
    const userRole = req.user?.role || '';
    const userDept = getDepartmentFromRole(userRole);

    let department: Department | null = null;

    if (role === 'DEPT_ADMIN' || userRole.startsWith('DEPT_ADMIN_')) {
      if (dept) {
        department = dept as Department;
      } else if (userDept) {
        department = userDept;
      } else {
        const error: AppError = new Error('Department not specified');
        error.statusCode = 400;
        throw error;
      }
    }

    if (department) {
      const data = await analyticsService.getDepartmentDashboard(department);
      res.status(200).json({
        success: true,
        data,
      });
    } else {
      // Super admin or store admin dashboard
      res.status(200).json({
        success: true,
        data: {
          message: 'Store/Admin dashboard data coming soon',
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

export const getDepartmentComparisonController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Only super admin and store admin can access
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.role !== 'STORE_ADMIN') {
      const error: AppError = new Error('Unauthorized: Only admins can access comparison data');
      error.statusCode = 403;
      throw error;
    }

    const { departments, period } = req.query;

    let deptArray: Department[] | undefined;
    if (departments) {
      if (departments === 'all') {
        deptArray = undefined;
      } else {
        deptArray = (departments as string).split(',').map((d) => d as Department);
      }
    }

    const comparison = await analyticsService.getDepartmentComparison(
      deptArray,
      (period as 'week' | 'month' | 'year') || 'month'
    );

    res.status(200).json({
      success: true,
      data: comparison,
    });
  } catch (error) {
    next(error);
  }
};

export const getStockPredictionsController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { dept, itemId } = req.query;
    const userRole = req.user?.role || '';
    const userDept = getDepartmentFromRole(userRole);

    let department: Department | null = null;

    if (req.user?.role === 'SUPER_ADMIN') {
      if (dept) {
        department = dept as Department;
      } else {
        const error: AppError = new Error('Department must be specified for super admin');
        error.statusCode = 400;
        throw error;
      }
    } else if (userDept) {
      department = userDept;
    } else {
      const error: AppError = new Error('Unauthorized: Department access denied');
      error.statusCode = 403;
      throw error;
    }

    if (!department) {
      const error: AppError = new Error('Department not found');
      error.statusCode = 404;
      throw error;
    }

    const predictions = await analyticsService.getStockPredictions(
      department,
      itemId as string | undefined
    );

    res.status(200).json({
      success: true,
      data: predictions,
    });
  } catch (error) {
    next(error);
  }
};

