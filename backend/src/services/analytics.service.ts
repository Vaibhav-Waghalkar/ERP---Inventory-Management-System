import prisma from '../config/database';
import { Department, UsageCategory } from '@prisma/client';

// ==================== DASHBOARD ANALYTICS ====================

export interface DashboardData {
  totalItems: number;
  lowStockCount: number;
  todayUsage: number;
  monthlyConsumption: number;
  topUsedItems: Array<{
    itemId: string;
    itemName: string;
    quantity: number;
    category: string;
  }>;
  usageByCategory: Record<UsageCategory, number>;
  monthlyTrend: Array<{
    month: string;
    usage: number;
  }>;
  alerts: Array<{
    type: string;
    message: string;
    severity: 'info' | 'warning' | 'error';
  }>;
}

export const getDepartmentDashboard = async (department: Department): Promise<DashboardData> => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Get basic stats
  const [totalItems, stocks, todayUsage, monthlyUsage] = await Promise.all([
    prisma.departmentStock.count({
      where: { department },
    }),
    prisma.departmentStock.findMany({
      where: { department },
      include: {
        item: {
          include: {
            category: true,
          },
        },
      },
    }),
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

  // Low stock count
  const lowStockCount = stocks.filter(
    (stock) => stock.quantity <= stock.item.minStockLevel
  ).length;

  // Top used items (last 30 days)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const topUsedItemsData = await prisma.usageLog.groupBy({
    by: ['itemId'],
    where: {
      department,
      usageDate: {
        gte: thirtyDaysAgo,
      },
    },
    _sum: {
      quantityUsed: true,
    },
    orderBy: {
      _sum: {
        quantityUsed: 'desc',
      },
    },
    take: 10,
  });

  const topUsedItems = await Promise.all(
    topUsedItemsData.map(async (item) => {
      const itemData = await prisma.item.findUnique({
        where: { id: item.itemId },
        include: { category: true },
      });
      return {
        itemId: item.itemId,
        itemName: itemData?.name || 'Unknown',
        quantity: item._sum.quantityUsed || 0,
        category: itemData?.category.name || 'Unknown',
      };
    })
  );

  // Usage by category (last 30 days)
  const usageByCategoryData = await prisma.usageLog.groupBy({
    by: ['category'],
    where: {
      department,
      usageDate: {
        gte: thirtyDaysAgo,
      },
    },
    _sum: {
      quantityUsed: true,
    },
  });

  const usageByCategory = usageByCategoryData.reduce(
    (acc, item) => {
      acc[item.category] = item._sum.quantityUsed || 0;
      return acc;
    },
    {} as Record<UsageCategory, number>
  );

  // Monthly trend (last 6 months)
  const monthlyTrend = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const usage = await prisma.usageLog.aggregate({
      where: {
        department,
        usageDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: {
        quantityUsed: true,
      },
    });

    monthlyTrend.push({
      month: date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
      usage: usage._sum.quantityUsed || 0,
    });
  }

  // Generate alerts
  const alerts = [];
  if (lowStockCount > 0) {
    alerts.push({
      type: 'low_stock',
      message: `${lowStockCount} item(s) are running low on stock`,
      severity: 'warning' as const,
    });
  }

  // Check for unconfirmed distributions
  const unconfirmedCount = await prisma.distribution.count({
    where: {
      toDepartment: department,
      isConfirmed: false,
    },
  });

  if (unconfirmedCount > 0) {
    alerts.push({
      type: 'pending_confirmation',
      message: `${unconfirmedCount} distribution(s) pending confirmation`,
      severity: 'info' as const,
    });
  }

  // Check for stock discrepancies
  const verifications = await verifyDepartmentStock(department);
  const discrepancies = verifications.filter((v) => !v.isMatch);
  if (discrepancies.length > 0) {
    alerts.push({
      type: 'stock_discrepancy',
      message: `${discrepancies.length} item(s) have stock discrepancies`,
      severity: 'error' as const,
    });
  }

  return {
    totalItems,
    lowStockCount,
    todayUsage: todayUsage._sum.quantityUsed || 0,
    monthlyConsumption: monthlyUsage._sum.quantityUsed || 0,
    topUsedItems,
    usageByCategory,
    monthlyTrend,
    alerts,
  };
};

// ==================== COMPARISON ANALYTICS ====================

export interface DepartmentComparison {
  department: Department;
  totalItems: number;
  monthlyUsage: number;
  lowStockCount: number;
  topItems: Array<{ itemName: string; quantity: number }>;
}

export const getDepartmentComparison = async (
  departments?: Department[],
  period: 'week' | 'month' | 'year' = 'month'
) => {
  const now = new Date();
  let startDate: Date;

  switch (period) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
  }

  const deptsToCompare = departments || [
    Department.COMPUTER_ENGINEERING,
    Department.CIVIL_ENGINEERING,
    Department.ELECTRICAL_ENGINEERING,
    Department.ELECTRONICS_TELECOMMUNICATION,
    Department.MECHANICAL_ENGINEERING,
  ];

  const comparisons = await Promise.all(
    deptsToCompare.map(async (dept) => {
      const [totalItems, stocks, monthlyUsage, topItemsData] = await Promise.all([
        prisma.departmentStock.count({
          where: { department: dept },
        }),
        prisma.departmentStock.findMany({
          where: { department: dept },
          include: { item: true },
        }),
        prisma.usageLog.aggregate({
          where: {
            department: dept,
            usageDate: {
              gte: startDate,
            },
          },
          _sum: {
            quantityUsed: true,
          },
        }),
        prisma.usageLog.groupBy({
          by: ['itemId'],
          where: {
            department: dept,
            usageDate: {
              gte: startDate,
            },
          },
          _sum: {
            quantityUsed: true,
          },
          orderBy: {
            _sum: {
              quantityUsed: 'desc',
            },
          },
          take: 5,
        }),
      ]);

      const lowStockCount = stocks.filter(
        (stock) => stock.quantity <= stock.item.minStockLevel
      ).length;

      const topItems = await Promise.all(
        topItemsData.map(async (item) => {
          const itemData = await prisma.item.findUnique({
            where: { id: item.itemId },
          });
          return {
            itemName: itemData?.name || 'Unknown',
            quantity: item._sum.quantityUsed || 0,
          };
        })
      );

      return {
        department: dept,
        totalItems,
        monthlyUsage: monthlyUsage._sum.quantityUsed || 0,
        lowStockCount,
        topItems,
      };
    })
  );

  return comparisons;
};

// ==================== PREDICTIONS ====================

export interface StockPrediction {
  itemId: string;
  itemName: string;
  currentStock: number;
  averageMonthlyUsage: number;
  predictedRunoutDate: Date | null;
  daysUntilRunout: number | null;
  recommendation: string;
}

export const getStockPredictions = async (department: Department, itemId?: string) => {
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

  const predictions = await Promise.all(
    stocks.map(async (stock) => {
      // Calculate average monthly usage (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const usage = await prisma.usageLog.aggregate({
        where: {
          itemId: stock.itemId,
          department,
          usageDate: {
            gte: sixMonthsAgo,
          },
        },
        _sum: {
          quantityUsed: true,
        },
      });

      const totalUsage = usage._sum.quantityUsed || 0;
      const averageMonthlyUsage = totalUsage / 6;

      let predictedRunoutDate: Date | null = null;
      let daysUntilRunout: number | null = null;
      let recommendation = '';

      if (averageMonthlyUsage > 0) {
        const monthsUntilRunout = stock.quantity / averageMonthlyUsage;
        predictedRunoutDate = new Date();
        predictedRunoutDate.setMonth(predictedRunoutDate.getMonth() + monthsUntilRunout);
        daysUntilRunout = Math.ceil(monthsUntilRunout * 30);

        if (daysUntilRunout < 30) {
          recommendation = 'URGENT: Reorder immediately';
        } else if (daysUntilRunout < 60) {
          recommendation = 'Order soon';
        } else if (daysUntilRunout < 90) {
          recommendation = 'Plan for reorder';
        } else {
          recommendation = 'Stock level adequate';
        }
      } else {
        recommendation = 'No usage history available';
      }

      return {
        itemId: stock.itemId,
        itemName: stock.item.name,
        currentStock: stock.quantity,
        averageMonthlyUsage: Math.round(averageMonthlyUsage * 100) / 100,
        predictedRunoutDate,
        daysUntilRunout,
        recommendation,
      };
    })
  );

  return predictions;
};

// Helper function for stock verification
async function verifyDepartmentStock(department: Department) {
  const stocks = await prisma.departmentStock.findMany({
    where: { department },
    include: { item: true },
  });

  const verifications = await Promise.all(
    stocks.map(async (stock) => {
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

      const expectedStock =
        (distributions._sum.quantity || 0) - (usageLogs._sum.quantityUsed || 0);
      const actualStock = stock.quantity;

      return {
        itemId: stock.itemId,
        expectedStock,
        actualStock,
        isMatch: expectedStock === actualStock,
      };
    })
  );

  return verifications;
}

