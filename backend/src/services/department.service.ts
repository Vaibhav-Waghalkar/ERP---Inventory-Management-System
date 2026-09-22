import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { Department, UsageCategory } from '@prisma/client';

// ==================== DEPARTMENT STOCK SERVICE ====================

export interface DepartmentStockItem {
  itemId: string;
  itemName: string;
  category: string;
  currentStock: number;
  receivedThisMonth: number;
  usedThisMonth: number;
  unit: string;
  status: 'GOOD' | 'LOW' | 'OUT';
  minStockLevel: number;
}

export const getDepartmentStock = async (department: Department) => {
  const stocks = await prisma.departmentStock.findMany({
    where: { department },
    include: {
      item: {
        include: {
          category: true,
        },
      },
    },
    orderBy: {
      item: {
        name: 'asc',
      },
    },
  });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const stockWithStats = await Promise.all(
    stocks.map(async (stock) => {
      // Get received this month
      const receivedThisMonth = await prisma.distribution.aggregate({
        where: {
          itemId: stock.itemId,
          toDepartment: department,
          receivedDate: {
            gte: startOfMonth,
          },
        },
        _sum: {
          quantity: true,
        },
      });

      // Get used this month
      const usedThisMonth = await prisma.usageLog.aggregate({
        where: {
          itemId: stock.itemId,
          department,
          usageDate: {
            gte: startOfMonth,
          },
        },
        _sum: {
          quantityUsed: true,
        },
      });

      const currentStock = stock.quantity;
      const minLevel = stock.item.minStockLevel;
      let status: 'GOOD' | 'LOW' | 'OUT' = 'GOOD';
      if (currentStock === 0) {
        status = 'OUT';
      } else if (currentStock <= minLevel) {
        status = 'LOW';
      }

      return {
        id: stock.id,
        itemId: stock.itemId,
        itemName: stock.item.name,
        category: stock.item.category.name,
        currentStock,
        receivedThisMonth: receivedThisMonth._sum.quantity || 0,
        usedThisMonth: usedThisMonth._sum.quantityUsed || 0,
        unit: stock.item.unit,
        status,
        minStockLevel: minLevel,
        lastUpdated: stock.lastUpdated,
      };
    })
  );

  return stockWithStats;
};

export const getDepartmentStockItem = async (department: Department, itemId: string) => {
  const stock = await prisma.departmentStock.findUnique({
    where: {
      itemId_department: {
        itemId,
        department,
      },
    },
    include: {
      item: {
        include: {
          category: true,
        },
      },
    },
  });

  if (!stock) {
    const error: AppError = new Error('Item not found in department stock');
    error.statusCode = 404;
    throw error;
  }

  // Get distribution history
  const distributions = await prisma.distribution.findMany({
    where: {
      itemId,
      toDepartment: department,
    },
    include: {
      distributedBy: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
    orderBy: {
      receivedDate: 'desc',
    },
  });

  // Get usage history
  const usageLogs = await prisma.usageLog.findMany({
    where: {
      itemId,
      department,
    },
    include: {
      usedBy: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
    orderBy: {
      usageDate: 'desc',
    },
    take: 50, // Last 50 usage entries
  });

  // Calculate expected stock
  const totalReceived = distributions.reduce((sum, d) => sum + d.quantity, 0);
  const totalUsed = usageLogs.reduce((sum, u) => sum + u.quantityUsed, 0);
  const expectedStock = totalReceived - totalUsed;

  return {
    stock,
    distributions,
    usageLogs,
    expectedStock,
    discrepancy: stock.quantity - expectedStock,
  };
};

export const reconcileDepartmentStock = async (
  department: Department,
  itemId: string,
  newQuantity: number,
  reason: string,
  userId: string
) => {
  if (reason.length < 20) {
    const error: AppError = new Error('Reason must be at least 20 characters');
    error.statusCode = 400;
    throw error;
  }

  const stock = await prisma.departmentStock.findUnique({
    where: {
      itemId_department: {
        itemId,
        department,
      },
    },
  });

  if (!stock) {
    const error: AppError = new Error('Item not found in department stock');
    error.statusCode = 404;
    throw error;
  }

  const oldQuantity = stock.quantity;

  const result = await prisma.$transaction(async (tx) => {
    // Update stock
    const updatedStock = await tx.departmentStock.update({
      where: { id: stock.id },
      data: { quantity: newQuantity },
    });

    // Create edit log
    await tx.editLog.create({
      data: {
        entityType: 'DepartmentStock',
        entityId: stock.id,
        fieldName: 'quantity',
        oldValue: oldQuantity.toString(),
        newValue: newQuantity.toString(),
        editedById: userId,
        reason,
      },
    });

    return updatedStock;
  });

  return result;
};

// ==================== INCOMING ITEMS SERVICE ====================

export const getIncomingItems = async (department: Department) => {
  const distributions = await prisma.distribution.findMany({
    where: {
      toDepartment: department,
      fromStore: true,
    },
    include: {
      item: {
        include: {
          category: true,
        },
      },
      distributedBy: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
    orderBy: {
      receivedDate: 'desc',
    },
  });

  return distributions;
};

export const confirmReceipt = async (
  distributionId: string,
  receivedQuantity: number,
  department: Department,
  userId: string
) => {
  const distribution = await prisma.distribution.findUnique({
    where: { id: distributionId },
  });

  if (!distribution) {
    const error: AppError = new Error('Distribution not found');
    error.statusCode = 404;
    throw error;
  }

  if (distribution.toDepartment !== department) {
    const error: AppError = new Error('Unauthorized: This distribution does not belong to your department');
    error.statusCode = 403;
    throw error;
  }

  const result = await prisma.$transaction(async (tx) => {
    // Update distribution
    const updated = await tx.distribution.update({
      where: { id: distributionId },
      data: {
        receivedQuantity,
        isConfirmed: true,
        confirmedAt: new Date(),
        confirmedBy: userId,
      },
    });

    // Update or create department stock
    const existingStock = await tx.departmentStock.findUnique({
      where: {
        itemId_department: {
          itemId: distribution.itemId,
          department,
        },
      },
    });

    if (existingStock) {
      await tx.departmentStock.update({
        where: { id: existingStock.id },
        data: {
          quantity: {
            increment: receivedQuantity,
          },
        },
      });
    } else {
      await tx.departmentStock.create({
        data: {
          itemId: distribution.itemId,
          department,
          quantity: receivedQuantity,
          managedById: userId,
        },
      });
    }

    return updated;
  });

  return result;
};

// ==================== USAGE LOG SERVICE ====================

export interface CreateUsageLogData {
  itemId: string;
  quantityUsed: number;
  usageDate: Date;
  category: UsageCategory;
  purpose: string;
  attachmentUrl?: string;
}

export interface BulkUsageLogData {
  logs: CreateUsageLogData[];
}

export const createUsageLog = async (
  department: Department,
  data: CreateUsageLogData,
  userId: string
) => {
  // Validate purpose length
  if (data.purpose.length < 10) {
    const error: AppError = new Error('Purpose must be at least 10 characters');
    error.statusCode = 400;
    throw error;
  }

  // Validate quantity
  if (data.quantityUsed <= 0) {
    const error: AppError = new Error('Quantity must be positive');
    error.statusCode = 400;
    throw error;
  }

  // Validate date (cannot be future)
  if (data.usageDate > new Date()) {
    const error: AppError = new Error('Usage date cannot be in the future');
    error.statusCode = 400;
    throw error;
  }

  // Check if item exists in department stock
  const stock = await prisma.departmentStock.findUnique({
    where: {
      itemId_department: {
        itemId: data.itemId,
        department,
      },
    },
  });

  if (!stock) {
    const error: AppError = new Error('Item not found in department stock');
    error.statusCode = 404;
    throw error;
  }

  // Check sufficient quantity
  if (stock.quantity < data.quantityUsed) {
    const error: AppError = new Error(
      `Insufficient stock. Available: ${stock.quantity}, Requested: ${data.quantityUsed}`
    );
    error.statusCode = 400;
    throw error;
  }

  const result = await prisma.$transaction(async (tx) => {
    // Create usage log
    const usageLog = await tx.usageLog.create({
      data: {
        itemId: data.itemId,
        department,
        quantityUsed: data.quantityUsed,
        usageDate: data.usageDate,
        category: data.category,
        purpose: data.purpose,
        attachmentUrl: data.attachmentUrl,
        usedById: userId,
      },
      include: {
        item: {
          include: {
            category: true,
          },
        },
        usedBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    // Reduce stock
    await tx.departmentStock.update({
      where: { id: stock.id },
      data: {
        quantity: {
          decrement: data.quantityUsed,
        },
      },
    });

    return usageLog;
  });

  return result;
};

export const createBulkUsageLogs = async (
  department: Department,
  data: BulkUsageLogData,
  userId: string
) => {
  // Validate all logs first
  for (const log of data.logs) {
    if (log.purpose.length < 10) {
      const error: AppError = new Error(`Purpose for item must be at least 10 characters`);
      error.statusCode = 400;
      throw error;
    }
    if (log.quantityUsed <= 0) {
      const error: AppError = new Error('All quantities must be positive');
      error.statusCode = 400;
      throw error;
    }
    if (log.usageDate > new Date()) {
      const error: AppError = new Error('Usage date cannot be in the future');
      error.statusCode = 400;
      throw error;
    }
  }

  // Check all stocks and quantities
  const stockChecks = await Promise.all(
    data.logs.map(async (log) => {
      const stock = await prisma.departmentStock.findUnique({
        where: {
          itemId_department: {
            itemId: log.itemId,
            department,
          },
        },
      });

      if (!stock) {
        throw new Error(`Item not found in department stock: ${log.itemId}`);
      }

      if (stock.quantity < log.quantityUsed) {
        throw new Error(
          `Insufficient stock for item. Available: ${stock.quantity}, Requested: ${log.quantityUsed}`
        );
      }

      return { stock, log };
    })
  );

  // Create all logs and update stocks in transaction
  const result = await prisma.$transaction(async (tx) => {
    const createdLogs = [];

    for (const { stock, log } of stockChecks) {
      // Create usage log
      const usageLog = await tx.usageLog.create({
        data: {
          itemId: log.itemId,
          department,
          quantityUsed: log.quantityUsed,
          usageDate: log.usageDate,
          category: log.category,
          purpose: log.purpose,
          attachmentUrl: log.attachmentUrl,
          usedById: userId,
        },
        include: {
          item: {
            include: {
              category: true,
            },
          },
          usedBy: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      });

      // Reduce stock
      await tx.departmentStock.update({
        where: { id: stock.id },
        data: {
          quantity: {
            decrement: log.quantityUsed,
          },
        },
      });

      createdLogs.push(usageLog);
    }

    return createdLogs;
  });

  return result;
};

export const getUsageLogs = async (
  department: Department,
  filters: {
    startDate?: Date;
    endDate?: Date;
    itemId?: string;
    category?: UsageCategory;
    usedById?: string;
  }
) => {
  const where: any = {
    department,
  };

  if (filters.startDate || filters.endDate) {
    where.usageDate = {};
    if (filters.startDate) {
      where.usageDate.gte = filters.startDate;
    }
    if (filters.endDate) {
      where.usageDate.lte = filters.endDate;
    }
  }

  if (filters.itemId) {
    where.itemId = filters.itemId;
  }

  if (filters.category) {
    where.category = filters.category;
  }

  if (filters.usedById) {
    where.usedById = filters.usedById;
  }

  const logs = await prisma.usageLog.findMany({
    where,
    include: {
      item: {
        include: {
          category: true,
        },
      },
      usedBy: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
      editLogs: {
        include: {
          editedBy: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
        orderBy: {
          editedAt: 'desc',
        },
      },
    },
    orderBy: {
      usageDate: 'desc',
    },
  });

  return logs;
};

export const getUsageLogById = async (id: string, department: Department) => {
  const log = await prisma.usageLog.findUnique({
    where: { id },
    include: {
      item: {
        include: {
          category: true,
        },
      },
      usedBy: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
      editLogs: {
        include: {
          editedBy: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
        orderBy: {
          editedAt: 'desc',
        },
      },
    },
  });

  if (!log) {
    const error: AppError = new Error('Usage log not found');
    error.statusCode = 404;
    throw error;
  }

  if (log.department !== department) {
    const error: AppError = new Error('Unauthorized: This usage log does not belong to your department');
    error.statusCode = 403;
    throw error;
  }

  return log;
};

export const updateUsageLog = async (
  id: string,
  department: Department,
  data: Partial<CreateUsageLogData>,
  userId: string,
  reason: string
) => {
  if (reason.length < 20) {
    const error: AppError = new Error('Reason must be at least 20 characters');
    error.statusCode = 400;
    throw error;
  }

  const log = await prisma.usageLog.findUnique({
    where: { id },
  });

  if (!log) {
    const error: AppError = new Error('Usage log not found');
    error.statusCode = 404;
    throw error;
  }

  if (log.department !== department) {
    const error: AppError = new Error('Unauthorized: This usage log does not belong to your department');
    error.statusCode = 403;
    throw error;
  }

  // Get current stock
  const stock = await prisma.departmentStock.findUnique({
    where: {
      itemId_department: {
        itemId: log.itemId,
        department,
      },
    },
  });

  if (!stock) {
    const error: AppError = new Error('Department stock not found');
    error.statusCode = 404;
    throw error;
  }

  const result = await prisma.$transaction(async (tx) => {
    const changes: { fieldName: string; oldValue: string; newValue: string }[] = [];

    // Handle quantity change
    if (data.quantityUsed !== undefined && data.quantityUsed !== log.quantityUsed) {
      const quantityDiff = data.quantityUsed - log.quantityUsed;

      if (quantityDiff > 0 && stock.quantity < quantityDiff) {
        const error: AppError = new Error(
          `Insufficient stock to increase usage. Available: ${stock.quantity}, Needed: ${quantityDiff}`
        );
        error.statusCode = 400;
        throw error;
      }

      // Adjust stock
      await tx.departmentStock.update({
        where: { id: stock.id },
        data: {
          quantity: {
            decrement: quantityDiff,
          },
        },
      });

      changes.push({
        fieldName: 'quantityUsed',
        oldValue: log.quantityUsed.toString(),
        newValue: data.quantityUsed.toString(),
      });
    }

    // Track other changes
    if (data.purpose && data.purpose !== log.purpose) {
      if (data.purpose.length < 10) {
        const error: AppError = new Error('Purpose must be at least 10 characters');
        error.statusCode = 400;
        throw error;
      }
      changes.push({
        fieldName: 'purpose',
        oldValue: log.purpose,
        newValue: data.purpose,
      });
    }

    if (data.category && data.category !== log.category) {
      changes.push({
        fieldName: 'category',
        oldValue: log.category,
        newValue: data.category,
      });
    }

    if (data.usageDate && data.usageDate.getTime() !== log.usageDate.getTime()) {
      if (data.usageDate > new Date()) {
        const error: AppError = new Error('Usage date cannot be in the future');
        error.statusCode = 400;
        throw error;
      }
      changes.push({
        fieldName: 'usageDate',
        oldValue: log.usageDate.toISOString(),
        newValue: data.usageDate.toISOString(),
      });
    }

    // Update usage log
    const updated = await tx.usageLog.update({
      where: { id },
      data: {
        ...(data.quantityUsed !== undefined && { quantityUsed: data.quantityUsed }),
        ...(data.purpose && { purpose: data.purpose }),
        ...(data.category && { category: data.category }),
        ...(data.usageDate && { usageDate: data.usageDate }),
        ...(data.attachmentUrl !== undefined && { attachmentUrl: data.attachmentUrl }),
      },
      include: {
        item: {
          include: {
            category: true,
          },
        },
        usedBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    // Create edit logs
    if (changes.length > 0) {
      await Promise.all(
        changes.map((change) =>
          tx.editLog.create({
            data: {
              entityType: 'UsageLog',
              entityId: id,
              fieldName: change.fieldName,
              oldValue: change.oldValue,
              newValue: change.newValue,
              editedById: userId,
              reason,
              usageLogId: id,
            },
          })
        )
      );
    }

    return updated;
  });

  return result;
};

export const deleteUsageLog = async (id: string, department: Department, userId: string, reason: string) => {
  if (reason.length < 20) {
    const error: AppError = new Error('Reason must be at least 20 characters');
    error.statusCode = 400;
    throw error;
  }

  const log = await prisma.usageLog.findUnique({
    where: { id },
  });

  if (!log) {
    const error: AppError = new Error('Usage log not found');
    error.statusCode = 404;
    throw error;
  }

  if (log.department !== department) {
    const error: AppError = new Error('Unauthorized: This usage log does not belong to your department');
    error.statusCode = 403;
    throw error;
  }

  const result = await prisma.$transaction(async (tx) => {
    // Restore stock
    const stock = await tx.departmentStock.findUnique({
      where: {
        itemId_department: {
          itemId: log.itemId,
          department,
        },
      },
    });

    if (stock) {
      await tx.departmentStock.update({
        where: { id: stock.id },
        data: {
          quantity: {
            increment: log.quantityUsed,
          },
        },
      });
    }

    // Create edit log for deletion
    await tx.editLog.create({
      data: {
        entityType: 'UsageLog',
        entityId: id,
        fieldName: 'deleted',
        oldValue: JSON.stringify({
          quantityUsed: log.quantityUsed,
          purpose: log.purpose,
          usageDate: log.usageDate,
        }),
        newValue: null,
        editedById: userId,
        reason,
        usageLogId: id,
      },
    });

    // Delete usage log
    await tx.usageLog.delete({
      where: { id },
    });

    return { success: true };
  });

  return result;
};

// ==================== STOCK VERIFICATION SERVICE ====================

export const verifyDepartmentStock = async (department: Department, itemId?: string) => {
  const where: any = { department };
  if (itemId) {
    where.itemId = itemId;
  }

  const stocks = await prisma.departmentStock.findMany({
    where,
    include: {
      item: true,
    },
  });

  const verifications = await Promise.all(
    stocks.map(async (stock) => {
      // Calculate expected stock
      const distributions = await prisma.distribution.aggregate({
        where: {
          itemId: stock.itemId,
          toDepartment: department,
        },
        _sum: {
          quantity: true,
        },
      });

      const usageLogs = await prisma.usageLog.aggregate({
        where: {
          itemId: stock.itemId,
          department,
        },
        _sum: {
          quantityUsed: true,
        },
      });

      const totalReceived = distributions._sum.quantity || 0;
      const totalUsed = usageLogs._sum.quantityUsed || 0;
      const expectedStock = totalReceived - totalUsed;
      const actualStock = stock.quantity;
      const discrepancy = actualStock - expectedStock;

      return {
        itemId: stock.itemId,
        itemName: stock.item.name,
        expectedStock,
        actualStock,
        discrepancy,
        isMatch: discrepancy === 0,
      };
    })
  );

  return verifications;
};

// ==================== REPORTS SERVICE ====================

export const getDepartmentSummary = async (department: Department) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Get stocks with items to check low stock
  const stocksWithItems = await prisma.departmentStock.findMany({
    where: { department },
    include: { item: true },
  });

  const totalItems = stocksWithItems.length;
  const lowStockCount = stocksWithItems.filter(
    (stock) => stock.quantity <= stock.item.minStockLevel
  ).length;

  const [todayUsage, monthlyConsumption] = await Promise.all([
    prisma.usageLog.aggregate({
      where: {
        department,
        usageDate: {
          gte: startOfDay,
        },
      },
      _sum: {
        quantityUsed: true,
      },
    }),
    prisma.usageLog.aggregate({
      where: {
        department,
        usageDate: {
          gte: startOfMonth,
        },
      },
      _sum: {
        quantityUsed: true,
      },
    }),
  ]);

  return {
    totalItems,
    lowStockCount,
    todayUsage: todayUsage._sum.quantityUsed || 0,
    monthlyConsumption: monthlyConsumption._sum.quantityUsed || 0,
  };
};

export const getUsageReport = async (
  department: Department,
  startDate: Date,
  endDate: Date
) => {
  const logs = await prisma.usageLog.findMany({
    where: {
      department,
      usageDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      item: {
        include: {
          category: true,
        },
      },
      usedBy: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
    orderBy: {
      usageDate: 'desc',
    },
  });

  // Group by category
  const usageByCategory = logs.reduce((acc, log) => {
    const category = log.category;
    if (!acc[category]) {
      acc[category] = { count: 0, quantity: 0 };
    }
    acc[category].count += 1;
    acc[category].quantity += log.quantityUsed;
    return acc;
  }, {} as Record<UsageCategory, { count: number; quantity: number }>);

  // Group by item
  const usageByItem = logs.reduce((acc, log) => {
    const itemId = log.itemId;
    if (!acc[itemId]) {
      acc[itemId] = {
        itemName: log.item.name,
        quantity: 0,
        count: 0,
      };
    }
    acc[itemId].quantity += log.quantityUsed;
    acc[itemId].count += 1;
    return acc;
  }, {} as Record<string, { itemName: string; quantity: number; count: number }>);

  // Top used items
  const topUsedItems = Object.values(usageByItem)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  return {
    logs,
    usageByCategory,
    usageByItem,
    topUsedItems,
    totalUsage: logs.reduce((sum, log) => sum + log.quantityUsed, 0),
    totalLogs: logs.length,
  };
};

export const getMonthlyConsumption = async (department: Department, itemId?: string) => {
  const now = new Date();
  const months: { month: string; consumption: number }[] = [];

  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const where: any = {
      department,
      usageDate: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    };

    if (itemId) {
      where.itemId = itemId;
    }

    const consumption = await prisma.usageLog.aggregate({
      where,
      _sum: {
        quantityUsed: true,
      },
    });

    months.push({
      month: date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
      consumption: consumption._sum.quantityUsed || 0,
    });
  }

  return months;
};

