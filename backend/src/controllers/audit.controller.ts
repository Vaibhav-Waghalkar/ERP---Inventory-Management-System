import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import * as auditService from '../services/audit.service';

export const getAuditLogsController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Only super admin can access audit logs
    if (req.user?.role !== 'SUPER_ADMIN') {
      const error: AppError = new Error('Unauthorized: Only super admin can access audit logs');
      error.statusCode = 403;
      throw error;
    }

    const { entityType, entityId, editedById, startDate, endDate } = req.query;

    const filters: any = {};
    if (entityType) filters.entityType = entityType as string;
    if (entityId) filters.entityId = entityId as string;
    if (editedById) filters.editedById = editedById as string;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);

    const logs = await auditService.getAuditLogs(filters);

    res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};

export const getAuditStatsController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Only super admin can access audit stats
    if (req.user?.role !== 'SUPER_ADMIN') {
      const error: AppError = new Error('Unauthorized: Only super admin can access audit stats');
      error.statusCode = 403;
      throw error;
    }

    const stats = await auditService.getAuditStats();

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

