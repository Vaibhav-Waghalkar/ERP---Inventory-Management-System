import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { AppError } from './errorHandler';

type Role = 'SUPER_ADMIN' | 'STORE_ADMIN' | 'DEPT_ADMIN_COMPUTER' | 'DEPT_ADMIN_CIVIL' | 'DEPT_ADMIN_ELECTRICAL' | 'DEPT_ADMIN_ELECTRONICS' | 'DEPT_ADMIN_MECHANICAL';

export const requireRole = (...allowedRoles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      const error: AppError = new Error('Authentication required');
      error.statusCode = 401;
      return next(error);
    }

    if (!allowedRoles.includes(req.user.role as Role)) {
      const error: AppError = new Error('Insufficient permissions');
      error.statusCode = 403;
      return next(error);
    }

    next();
  };
};

export const requireSuperAdmin = requireRole('SUPER_ADMIN');
export const requireStoreAdmin = requireRole('STORE_ADMIN', 'SUPER_ADMIN');
export const requireDeptAdmin = requireRole(
  'DEPT_ADMIN_COMPUTER',
  'DEPT_ADMIN_CIVIL',
  'DEPT_ADMIN_ELECTRICAL',
  'DEPT_ADMIN_ELECTRONICS',
  'DEPT_ADMIN_MECHANICAL',
  'SUPER_ADMIN'
);

