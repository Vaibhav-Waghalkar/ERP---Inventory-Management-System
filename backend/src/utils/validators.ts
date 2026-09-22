import { body, ValidationChain } from 'express-validator';

export const validateEmail = (): ValidationChain => {
  return body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail();
};

export const validatePassword = (): ValidationChain => {
  return body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number');
};

export const validateLogin = (): ValidationChain[] => {
  return [
    validateEmail(),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
  ];
};

export const validateChangePassword = (): ValidationChain[] => {
  return [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number'),
    body('confirmPassword')
      .custom((value, { req }) => {
        if (value !== req.body.newPassword) {
          throw new Error('Passwords do not match');
        }
        return true;
      }),
  ];
};

export const validateCreateUser = (): ValidationChain[] => {
  return [
    validateEmail(),
    validatePassword(),
    body('fullName')
      .trim()
      .notEmpty()
      .withMessage('Full name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Full name must be between 2 and 100 characters'),
    body('role')
      .isIn(['SUPER_ADMIN', 'STORE_ADMIN', 'DEPT_ADMIN_COMPUTER', 'DEPT_ADMIN_CIVIL', 'DEPT_ADMIN_ELECTRICAL', 'DEPT_ADMIN_ELECTRONICS', 'DEPT_ADMIN_MECHANICAL'])
      .withMessage('Invalid role'),
    body('department')
      .optional()
      .isIn(['STORE', 'COMPUTER_ENGINEERING', 'CIVIL_ENGINEERING', 'ELECTRICAL_ENGINEERING', 'ELECTRONICS_TELECOMMUNICATION', 'MECHANICAL_ENGINEERING'])
      .withMessage('Invalid department'),
  ];
};

export const validateUpdateUser = (): ValidationChain[] => {
  return [
    body('fullName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Full name must be between 2 and 100 characters'),
    body('role')
      .optional()
      .isIn(['SUPER_ADMIN', 'STORE_ADMIN', 'DEPT_ADMIN_COMPUTER', 'DEPT_ADMIN_CIVIL', 'DEPT_ADMIN_ELECTRICAL', 'DEPT_ADMIN_ELECTRONICS', 'DEPT_ADMIN_MECHANICAL'])
      .withMessage('Invalid role'),
    body('department')
      .optional()
      .isIn(['STORE', 'COMPUTER_ENGINEERING', 'CIVIL_ENGINEERING', 'ELECTRICAL_ENGINEERING', 'ELECTRONICS_TELECOMMUNICATION', 'MECHANICAL_ENGINEERING'])
      .withMessage('Invalid department'),
  ];
};

// ==================== STORE VALIDATORS ====================

export const validateCreateCategory = (): ValidationChain[] => {
  return [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Category name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Category name must be between 2 and 100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description must be less than 500 characters'),
  ];
};

export const validateUpdateCategory = (): ValidationChain[] => {
  return [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Category name must be between 2 and 100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description must be less than 500 characters'),
  ];
};

export const validateCreateItem = (): ValidationChain[] => {
  return [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Item name is required')
      .isLength({ min: 3, max: 100 })
      .withMessage('Item name must be between 3 and 100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description must be less than 500 characters'),
    body('categoryId')
      .notEmpty()
      .withMessage('Category is required')
      .isUUID()
      .withMessage('Invalid category ID'),
    body('unit')
      .trim()
      .notEmpty()
      .withMessage('Unit is required')
      .isLength({ min: 1, max: 20 })
      .withMessage('Unit must be between 1 and 20 characters'),
    body('minStockLevel')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Minimum stock level must be a non-negative integer'),
  ];
};

export const validateUpdateItem = (): ValidationChain[] => {
  return [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Item name must be between 3 and 100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description must be less than 500 characters'),
    body('categoryId')
      .optional()
      .isUUID()
      .withMessage('Invalid category ID'),
    body('unit')
      .optional()
      .trim()
      .isLength({ min: 1, max: 20 })
      .withMessage('Unit must be between 1 and 20 characters'),
    body('minStockLevel')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Minimum stock level must be a non-negative integer'),
  ];
};

export const validateCreateStoreEntry = (): ValidationChain[] => {
  return [
    body('itemId')
      .notEmpty()
      .withMessage('Item is required')
      .isUUID()
      .withMessage('Invalid item ID'),
    body('quantity')
      .notEmpty()
      .withMessage('Quantity is required')
      .isInt({ min: 1 })
      .withMessage('Quantity must be a positive integer'),
    body('billNumber')
      .trim()
      .notEmpty()
      .withMessage('Bill number is required')
      .isLength({ min: 1, max: 100 })
      .withMessage('Bill number must be between 1 and 100 characters'),
    body('billDate')
      .notEmpty()
      .withMessage('Bill date is required')
      .isISO8601()
      .withMessage('Invalid bill date format')
      .custom((value) => {
        if (new Date(value) > new Date()) {
          throw new Error('Bill date cannot be in the future');
        }
        return true;
      }),
    body('billAmount')
      .notEmpty()
      .withMessage('Bill amount is required')
      .isFloat({ min: 0 })
      .withMessage('Bill amount must be a non-negative number'),
    body('vendorName')
      .trim()
      .notEmpty()
      .withMessage('Vendor name is required')
      .isLength({ min: 3, max: 100 })
      .withMessage('Vendor name must be between 3 and 100 characters'),
    body('vendorContact')
      .optional()
      .trim()
      .matches(/^[0-9+\-\s()]+$/)
      .withMessage('Invalid vendor contact number'),
    body('remarks')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Remarks must be less than 1000 characters'),
  ];
};

export const validateUpdateStoreEntry = (): ValidationChain[] => {
  return [
    body('itemId')
      .optional()
      .isUUID()
      .withMessage('Invalid item ID'),
    body('quantity')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Quantity must be a positive integer'),
    body('billNumber')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Bill number must be between 1 and 100 characters'),
    body('billDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid bill date format')
      .custom((value) => {
        if (new Date(value) > new Date()) {
          throw new Error('Bill date cannot be in the future');
        }
        return true;
      }),
    body('billAmount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Bill amount must be a non-negative number'),
    body('vendorName')
      .optional()
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Vendor name must be between 3 and 100 characters'),
    body('vendorContact')
      .optional()
      .trim()
      .matches(/^[0-9+\-\s()]+$/)
      .withMessage('Invalid vendor contact number'),
    body('remarks')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Remarks must be less than 1000 characters'),
    body('reason')
      .optional()
      .trim()
      .isLength({ min: 5, max: 500 })
      .withMessage('Reason for edit must be between 5 and 500 characters'),
  ];
};

export const validateCreateDistribution = (): ValidationChain[] => {
  return [
    body('itemId')
      .notEmpty()
      .withMessage('Item is required')
      .isUUID()
      .withMessage('Invalid item ID'),
    body('toDepartment')
      .notEmpty()
      .withMessage('Department is required')
      .isIn(['COMPUTER_ENGINEERING', 'CIVIL_ENGINEERING', 'ELECTRICAL_ENGINEERING', 'ELECTRONICS_TELECOMMUNICATION', 'MECHANICAL_ENGINEERING'])
      .withMessage('Invalid department'),
    body('quantity')
      .notEmpty()
      .withMessage('Quantity is required')
      .isInt({ min: 1 })
      .withMessage('Quantity must be a positive integer'),
    body('remarks')
      .optional()
      .trim()
      .isLength({ min: 10, max: 1000 })
      .withMessage('Purpose/Remarks must be between 10 and 1000 characters'),
    body('receivedDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid date format')
      .custom((value) => {
        if (new Date(value) > new Date()) {
          throw new Error('Distribution date cannot be in the future');
        }
        return true;
      }),
  ];
};

export const validateUpdateDistribution = (): ValidationChain[] => {
  return [
    body('itemId')
      .optional()
      .isUUID()
      .withMessage('Invalid item ID'),
    body('toDepartment')
      .optional()
      .isIn(['COMPUTER_ENGINEERING', 'CIVIL_ENGINEERING', 'ELECTRICAL_ENGINEERING', 'ELECTRONICS_TELECOMMUNICATION', 'MECHANICAL_ENGINEERING'])
      .withMessage('Invalid department'),
    body('quantity')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Quantity must be a positive integer'),
    body('remarks')
      .optional()
      .trim()
      .isLength({ min: 10, max: 1000 })
      .withMessage('Purpose/Remarks must be between 10 and 1000 characters'),
    body('receivedDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid date format')
      .custom((value) => {
        if (new Date(value) > new Date()) {
          throw new Error('Distribution date cannot be in the future');
        }
        return true;
      }),
    body('reason')
      .optional()
      .trim()
      .isLength({ min: 5, max: 500 })
      .withMessage('Reason for edit must be between 5 and 500 characters'),
  ];
};

// ==================== DEPARTMENT VALIDATORS ====================

export const validateReconcileStock = (): ValidationChain[] => {
  return [
    body('newQuantity')
      .notEmpty()
      .withMessage('New quantity is required')
      .isInt({ min: 0 })
      .withMessage('Quantity must be a non-negative integer'),
    body('reason')
      .trim()
      .notEmpty()
      .withMessage('Reason is required')
      .isLength({ min: 20, max: 1000 })
      .withMessage('Reason must be between 20 and 1000 characters'),
  ];
};

export const validateConfirmReceipt = (): ValidationChain[] => {
  return [
    body('receivedQuantity')
      .notEmpty()
      .withMessage('Received quantity is required')
      .isInt({ min: 0 })
      .withMessage('Received quantity must be a non-negative integer'),
  ];
};

export const validateCreateUsageLog = (): ValidationChain[] => {
  return [
    body('itemId')
      .notEmpty()
      .withMessage('Item is required')
      .isUUID()
      .withMessage('Invalid item ID'),
    body('quantityUsed')
      .notEmpty()
      .withMessage('Quantity used is required')
      .isInt({ min: 1 })
      .withMessage('Quantity must be a positive integer'),
    body('usageDate')
      .notEmpty()
      .withMessage('Usage date is required')
      .isISO8601()
      .withMessage('Invalid date format')
      .custom((value) => {
        if (new Date(value) > new Date()) {
          throw new Error('Usage date cannot be in the future');
        }
        return true;
      }),
    body('category')
      .notEmpty()
      .withMessage('Category is required')
      .isIn(['TEACHING_CLASSROOM', 'LAB_EXPERIMENT', 'STUDENT_DISTRIBUTION', 'ADMINISTRATIVE', 'MAINTENANCE_REPAIRS', 'EVENTS_ACTIVITIES', 'OTHER'])
      .withMessage('Invalid usage category'),
    body('purpose')
      .trim()
      .notEmpty()
      .withMessage('Purpose is required')
      .isLength({ min: 10, max: 1000 })
      .withMessage('Purpose must be between 10 and 1000 characters'),
    body('attachmentUrl')
      .optional()
      .isURL()
      .withMessage('Invalid attachment URL'),
  ];
};

export const validateBulkUsageLogs = (): ValidationChain[] => {
  return [
    body('logs')
      .isArray({ min: 1 })
      .withMessage('At least one usage log is required'),
    body('logs.*.itemId')
      .notEmpty()
      .withMessage('Item is required for all logs')
      .isUUID()
      .withMessage('Invalid item ID'),
    body('logs.*.quantityUsed')
      .notEmpty()
      .withMessage('Quantity used is required for all logs')
      .isInt({ min: 1 })
      .withMessage('Quantity must be a positive integer'),
    body('logs.*.usageDate')
      .notEmpty()
      .withMessage('Usage date is required for all logs')
      .isISO8601()
      .withMessage('Invalid date format'),
    body('logs.*.category')
      .notEmpty()
      .withMessage('Category is required for all logs')
      .isIn(['TEACHING_CLASSROOM', 'LAB_EXPERIMENT', 'STUDENT_DISTRIBUTION', 'ADMINISTRATIVE', 'MAINTENANCE_REPAIRS', 'EVENTS_ACTIVITIES', 'OTHER'])
      .withMessage('Invalid usage category'),
    body('logs.*.purpose')
      .trim()
      .notEmpty()
      .withMessage('Purpose is required for all logs')
      .isLength({ min: 10, max: 1000 })
      .withMessage('Purpose must be between 10 and 1000 characters'),
  ];
};

export const validateUpdateUsageLog = (): ValidationChain[] => {
  return [
    body('quantityUsed')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Quantity must be a positive integer'),
    body('usageDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid date format')
      .custom((value) => {
        if (new Date(value) > new Date()) {
          throw new Error('Usage date cannot be in the future');
        }
        return true;
      }),
    body('category')
      .optional()
      .isIn(['TEACHING_CLASSROOM', 'LAB_EXPERIMENT', 'STUDENT_DISTRIBUTION', 'ADMINISTRATIVE', 'MAINTENANCE_REPAIRS', 'EVENTS_ACTIVITIES', 'OTHER'])
      .withMessage('Invalid usage category'),
    body('purpose')
      .optional()
      .trim()
      .isLength({ min: 10, max: 1000 })
      .withMessage('Purpose must be between 10 and 1000 characters'),
    body('attachmentUrl')
      .optional()
      .isURL()
      .withMessage('Invalid attachment URL'),
    body('reason')
      .trim()
      .notEmpty()
      .withMessage('Reason for edit is required')
      .isLength({ min: 20, max: 1000 })
      .withMessage('Reason must be between 20 and 1000 characters'),
  ];
};

export const validateDeleteUsageLog = (): ValidationChain[] => {
  return [
    body('reason')
      .trim()
      .notEmpty()
      .withMessage('Reason for deletion is required')
      .isLength({ min: 20, max: 1000 })
      .withMessage('Reason must be between 20 and 1000 characters'),
  ];
};

