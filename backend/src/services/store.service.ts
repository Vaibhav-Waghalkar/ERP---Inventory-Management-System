import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { Decimal } from '@prisma/client/runtime/library';

// ==================== CATEGORY SERVICE ====================

export interface CreateCategoryData {
  name: string;
  description?: string;
}

export interface UpdateCategoryData {
  name?: string;
  description?: string;
}

export const getAllCategories = async () => {
  return await prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { items: true },
      },
    },
  });
};

export const getCategoryById = async (id: string) => {
  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          storeStock: true,
        },
      },
    },
  });

  if (!category) {
    const error: AppError = new Error('Category not found');
    error.statusCode = 404;
    throw error;
  }

  return category;
};

export const createCategory = async (data: CreateCategoryData) => {
  // Check if category already exists
  const existing = await prisma.category.findUnique({
    where: { name: data.name },
  });

  if (existing) {
    const error: AppError = new Error('Category with this name already exists');
    error.statusCode = 409;
    throw error;
  }

  return await prisma.category.create({
    data,
  });
};

export const updateCategory = async (id: string, data: UpdateCategoryData) => {
  const category = await prisma.category.findUnique({ where: { id } });

  if (!category) {
    const error: AppError = new Error('Category not found');
    error.statusCode = 404;
    throw error;
  }

  // Check name uniqueness if name is being updated
  if (data.name && data.name !== category.name) {
    const existing = await prisma.category.findUnique({
      where: { name: data.name },
    });

    if (existing) {
      const error: AppError = new Error('Category with this name already exists');
      error.statusCode = 409;
      throw error;
    }
  }

  return await prisma.category.update({
    where: { id },
    data,
  });
};

export const deleteCategory = async (id: string) => {
  const category = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { items: true } } },
  });

  if (!category) {
    const error: AppError = new Error('Category not found');
    error.statusCode = 404;
    throw error;
  }

  if (category._count.items > 0) {
    const error: AppError = new Error('Cannot delete category with existing items');
    error.statusCode = 400;
    throw error;
  }

  await prisma.category.delete({ where: { id } });
};

// ==================== ITEM SERVICE ====================

export interface CreateItemData {
  name: string;
  description?: string;
  categoryId: string;
  unit: string;
  minStockLevel?: number;
}

export interface UpdateItemData {
  name?: string;
  description?: string;
  categoryId?: string;
  unit?: string;
  minStockLevel?: number;
}

export const getAllItems = async (search?: string, categoryId?: string) => {
  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' as const } },
      { description: { contains: search, mode: 'insensitive' as const } },
    ];
  }

  if (categoryId) {
    where.categoryId = categoryId;
  }

  const items = await prisma.item.findMany({
    where,
    include: {
      category: true,
      storeStock: true,
    },
    orderBy: { name: 'asc' },
  });

  return items.map((item) => ({
    ...item,
    currentStock: item.storeStock?.quantity || 0,
    stockStatus: getStockStatus(item.storeStock?.quantity || 0, item.minStockLevel),
  }));
};

export const getItemById = async (id: string) => {
  const item = await prisma.item.findUnique({
    where: { id },
    include: {
      category: true,
      storeStock: true,
      departmentStocks: {
        include: {
          item: true,
        },
      },
    },
  });

  if (!item) {
    const error: AppError = new Error('Item not found');
    error.statusCode = 404;
    throw error;
  }

  return {
    ...item,
    currentStock: item.storeStock?.quantity || 0,
    stockStatus: getStockStatus(item.storeStock?.quantity || 0, item.minStockLevel),
  };
};

export const createItem = async (data: CreateItemData) => {
  // Check if item already exists in category
  const existing = await prisma.item.findUnique({
    where: {
      name_categoryId: {
        name: data.name,
        categoryId: data.categoryId,
      },
    },
  });

  if (existing) {
    const error: AppError = new Error('Item with this name already exists in this category');
    error.statusCode = 409;
    throw error;
  }

  // Verify category exists
  const category = await prisma.category.findUnique({
    where: { id: data.categoryId },
  });

  if (!category) {
    const error: AppError = new Error('Category not found');
    error.statusCode = 404;
    throw error;
  }

  // Create item and initialize store stock
  const item = await prisma.item.create({
    data: {
      name: data.name,
      description: data.description,
      categoryId: data.categoryId,
      unit: data.unit,
      minStockLevel: data.minStockLevel || 10,
      storeStock: {
        create: {
          quantity: 0,
        },
      },
    },
    include: {
      category: true,
      storeStock: true,
    },
  });

  return item;
};

export const updateItem = async (id: string, data: UpdateItemData) => {
  const item = await prisma.item.findUnique({ where: { id } });

  if (!item) {
    const error: AppError = new Error('Item not found');
    error.statusCode = 404;
    throw error;
  }

  // Check name uniqueness if name is being updated
  if (data.name && (data.name !== item.name || data.categoryId !== item.categoryId)) {
    const categoryId = data.categoryId || item.categoryId;
    const existing = await prisma.item.findUnique({
      where: {
        name_categoryId: {
          name: data.name,
          categoryId,
        },
      },
    });

    if (existing && existing.id !== id) {
      const error: AppError = new Error('Item with this name already exists in this category');
      error.statusCode = 409;
      throw error;
    }
  }

  // Verify category if being updated
  if (data.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });

    if (!category) {
      const error: AppError = new Error('Category not found');
      error.statusCode = 404;
      throw error;
    }
  }

  return await prisma.item.update({
    where: { id },
    data,
    include: {
      category: true,
      storeStock: true,
    },
  });
};

export const deleteItem = async (id: string) => {
  const item = await prisma.item.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          storeEntries: true,
          distributions: true,
          usageLogs: true,
        },
      },
    },
  });

  if (!item) {
    const error: AppError = new Error('Item not found');
    error.statusCode = 404;
    throw error;
  }

  // Soft delete - just mark as inactive or prevent deletion if has transactions
  if (item._count.storeEntries > 0 || item._count.distributions > 0 || item._count.usageLogs > 0) {
    const error: AppError = new Error('Cannot delete item with existing transactions');
    error.statusCode = 400;
    throw error;
  }

  // Delete store stock first
  await prisma.storeStock.deleteMany({
    where: { itemId: id },
  });

  await prisma.item.delete({ where: { id } });
};

// ==================== STORE ENTRY SERVICE ====================

export interface CreateStoreEntryData {
  itemId: string;
  quantity: number;
  billNumber: string;
  billDate: Date;
  billAmount: number;
  vendorName: string;
  vendorContact?: string;
  billImageUrl?: string;
  remarks?: string;
  addedById: string;
}

export interface UpdateStoreEntryData {
  itemId?: string;
  quantity?: number;
  billNumber?: string;
  billDate?: Date;
  billAmount?: number;
  vendorName?: string;
  vendorContact?: string;
  billImageUrl?: string;
  remarks?: string;
}

export const getAllStoreEntries = async (
  page: number = 1,
  limit: number = 50,
  filters?: {
    itemId?: string;
    vendorName?: string;
    billNumber?: string;
    dateFrom?: Date;
    dateTo?: Date;
    amountFrom?: number;
    amountTo?: number;
  }
) => {
  const skip = (page - 1) * limit;
  const where: any = {};

  if (filters?.itemId) {
    where.itemId = filters.itemId;
  }

  if (filters?.vendorName) {
    where.vendorName = { contains: filters.vendorName, mode: 'insensitive' as const };
  }

  if (filters?.billNumber) {
    where.billNumber = { contains: filters.billNumber, mode: 'insensitive' as const };
  }

  if (filters?.dateFrom || filters?.dateTo) {
    where.billDate = {};
    if (filters.dateFrom) {
      where.billDate.gte = filters.dateFrom;
    }
    if (filters.dateTo) {
      where.billDate.lte = filters.dateTo;
    }
  }

  if (filters?.amountFrom || filters?.amountTo) {
    where.billAmount = {};
    if (filters.amountFrom) {
      where.billAmount.gte = new Decimal(filters.amountFrom);
    }
    if (filters.amountTo) {
      where.billAmount.lte = new Decimal(filters.amountTo);
    }
  }

  const [entries, total] = await Promise.all([
    prisma.storeEntry.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        item: {
          include: {
            category: true,
          },
        },
        addedBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    }),
    prisma.storeEntry.count({ where }),
  ]);

  return {
    entries,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getStoreEntryById = async (id: string) => {
  const entry = await prisma.storeEntry.findUnique({
    where: { id },
    include: {
      item: {
        include: {
          category: true,
          storeStock: true,
        },
      },
      addedBy: {
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
        orderBy: { editedAt: 'desc' },
      },
    },
  });

  if (!entry) {
    const error: AppError = new Error('Store entry not found');
    error.statusCode = 404;
    throw error;
  }

  return entry;
};

export const createStoreEntry = async (data: CreateStoreEntryData) => {
  // Verify item exists
  const item = await prisma.item.findUnique({
    where: { id: data.itemId },
    include: { storeStock: true },
  });

  if (!item) {
    const error: AppError = new Error('Item not found');
    error.statusCode = 404;
    throw error;
  }

  // Validate quantity
  if (data.quantity <= 0) {
    const error: AppError = new Error('Quantity must be greater than 0');
    error.statusCode = 400;
    throw error;
  }

  // Validate bill date (cannot be in future)
  if (data.billDate > new Date()) {
    const error: AppError = new Error('Bill date cannot be in the future');
    error.statusCode = 400;
    throw error;
  }

  // Validate bill amount
  if (data.billAmount < 0) {
    const error: AppError = new Error('Bill amount cannot be negative');
    error.statusCode = 400;
    throw error;
  }

  // Validate vendor name
  if (data.vendorName.length < 3 || data.vendorName.length > 100) {
    const error: AppError = new Error('Vendor name must be between 3 and 100 characters');
    error.statusCode = 400;
    throw error;
  }

  // Create entry and update stock in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create store entry
    const entry = await tx.storeEntry.create({
      data: {
        itemId: data.itemId,
        quantity: data.quantity,
        billNumber: data.billNumber,
        billDate: data.billDate,
        billAmount: new Decimal(data.billAmount),
        vendorName: data.vendorName,
        vendorContact: data.vendorContact,
        billImageUrl: data.billImageUrl,
        remarks: data.remarks,
        addedById: data.addedById,
      },
      include: {
        item: {
          include: {
            category: true,
            storeStock: true,
          },
        },
        addedBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    // Update or create store stock
    const currentStock = item.storeStock?.quantity || 0;
    await tx.storeStock.upsert({
      where: { itemId: data.itemId },
      update: {
        quantity: { increment: data.quantity },
      },
      create: {
        itemId: data.itemId,
        quantity: data.quantity,
      },
    });

    return entry;
  });

  return result;
};

export const updateStoreEntry = async (
  id: string,
  data: UpdateStoreEntryData,
  editedById: string,
  reason?: string
) => {
  const entry = await prisma.storeEntry.findUnique({
    where: { id },
    include: {
      item: {
        include: { storeStock: true },
      },
    },
  });

  if (!entry) {
    const error: AppError = new Error('Store entry not found');
    error.statusCode = 404;
    throw error;
  }

  // Calculate quantity difference if quantity is being updated
  const quantityDiff = data.quantity !== undefined ? data.quantity - entry.quantity : 0;

  // Update entry and adjust stock in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Log changes
    const changes: { fieldName: string; oldValue: string; newValue: string }[] = [];

    if (data.itemId && data.itemId !== entry.itemId) {
      changes.push({
        fieldName: 'itemId',
        oldValue: entry.itemId,
        newValue: data.itemId,
      });
    }

    if (data.quantity !== undefined && data.quantity !== entry.quantity) {
      changes.push({
        fieldName: 'quantity',
        oldValue: entry.quantity.toString(),
        newValue: data.quantity.toString(),
      });
    }

    if (data.billNumber && data.billNumber !== entry.billNumber) {
      changes.push({
        fieldName: 'billNumber',
        oldValue: entry.billNumber,
        newValue: data.billNumber,
      });
    }

    if (data.billAmount !== undefined && data.billAmount !== Number(entry.billAmount)) {
      changes.push({
        fieldName: 'billAmount',
        oldValue: entry.billAmount.toString(),
        newValue: data.billAmount.toString(),
      });
    }

    if (data.vendorName && data.vendorName !== entry.vendorName) {
      changes.push({
        fieldName: 'vendorName',
        oldValue: entry.vendorName,
        newValue: data.vendorName,
      });
    }

    // Update entry
    const updatedEntry = await tx.storeEntry.update({
      where: { id },
      data: {
        ...(data.itemId && { itemId: data.itemId }),
        ...(data.quantity !== undefined && { quantity: data.quantity }),
        ...(data.billNumber && { billNumber: data.billNumber }),
        ...(data.billDate && { billDate: data.billDate }),
        ...(data.billAmount !== undefined && { billAmount: new Decimal(data.billAmount) }),
        ...(data.vendorName && { vendorName: data.vendorName }),
        ...(data.vendorContact !== undefined && { vendorContact: data.vendorContact }),
        ...(data.billImageUrl !== undefined && { billImageUrl: data.billImageUrl }),
        ...(data.remarks !== undefined && { remarks: data.remarks }),
      },
      include: {
        item: {
          include: {
            category: true,
            storeStock: true,
          },
        },
        addedBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    // Adjust stock if quantity changed
    if (quantityDiff !== 0) {
      const itemId = data.itemId || entry.itemId;
      await tx.storeStock.update({
        where: { itemId },
        data: {
          quantity: { increment: quantityDiff },
        },
      });
    }

    // Create edit logs
    if (changes.length > 0) {
      await Promise.all(
        changes.map((change) =>
          tx.editLog.create({
            data: {
              entityType: 'StoreEntry',
              entityId: id,
              fieldName: change.fieldName,
              oldValue: change.oldValue,
              newValue: change.newValue,
              editedById,
              reason,
              storeEntryId: id,
            },
          })
        )
      );
    }

    return updatedEntry;
  });

  return result;
};

export const deleteStoreEntry = async (id: string) => {
  const entry = await prisma.storeEntry.findUnique({
    where: { id },
    include: {
      item: {
        include: { storeStock: true },
      },
    },
  });

  if (!entry) {
    const error: AppError = new Error('Store entry not found');
    error.statusCode = 404;
    throw error;
  }

  // Delete entry and adjust stock in a transaction
  await prisma.$transaction(async (tx) => {
    // Adjust stock (subtract quantity)
    if (entry.item.storeStock) {
      await tx.storeStock.update({
        where: { itemId: entry.itemId },
        data: {
          quantity: { decrement: entry.quantity },
        },
      });
    }

    // Delete entry
    await tx.storeEntry.delete({ where: { id } });
  });
};

// ==================== DISTRIBUTION SERVICE ====================

export interface CreateDistributionData {
  itemId: string;
  toDepartment: string;
  quantity: number;
  remarks?: string;
  distributedById: string;
  receivedDate?: Date;
}

export interface UpdateDistributionData {
  itemId?: string;
  toDepartment?: string;
  quantity?: number;
  remarks?: string;
  receivedDate?: Date;
}

export const getAllDistributions = async (
  page: number = 1,
  limit: number = 50,
  filters?: {
    itemId?: string;
    toDepartment?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }
) => {
  const skip = (page - 1) * limit;
  const where: any = {};

  if (filters?.itemId) {
    where.itemId = filters.itemId;
  }

  if (filters?.toDepartment) {
    where.toDepartment = filters.toDepartment;
  }

  if (filters?.dateFrom || filters?.dateTo) {
    where.receivedDate = {};
    if (filters.dateFrom) {
      where.receivedDate.gte = filters.dateFrom;
    }
    if (filters.dateTo) {
      where.receivedDate.lte = filters.dateTo;
    }
  }

  const [distributions, total] = await Promise.all([
    prisma.distribution.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
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
    }),
    prisma.distribution.count({ where }),
  ]);

  return {
    distributions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getDistributionById = async (id: string) => {
  const distribution = await prisma.distribution.findUnique({
    where: { id },
    include: {
      item: {
        include: {
          category: true,
          storeStock: true,
        },
      },
      distributedBy: {
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
        orderBy: { editedAt: 'desc' },
      },
    },
  });

  if (!distribution) {
    const error: AppError = new Error('Distribution not found');
    error.statusCode = 404;
    throw error;
  }

  return distribution;
};

export const createDistribution = async (data: CreateDistributionData) => {
  // Verify item exists and has sufficient stock
  const item = await prisma.item.findUnique({
    where: { id: data.itemId },
    include: { storeStock: true },
  });

  if (!item) {
    const error: AppError = new Error('Item not found');
    error.statusCode = 404;
    throw error;
  }

  const availableStock = item.storeStock?.quantity || 0;

  if (data.quantity <= 0) {
    const error: AppError = new Error('Quantity must be greater than 0');
    error.statusCode = 400;
    throw error;
  }

  if (data.quantity > availableStock) {
    const error: AppError = new Error(`Insufficient stock. Available: ${availableStock}`);
    error.statusCode = 400;
    throw error;
  }

  // Validate department
  const validDepartments = [
    'COMPUTER_ENGINEERING',
    'CIVIL_ENGINEERING',
    'ELECTRICAL_ENGINEERING',
    'ELECTRONICS_TELECOMMUNICATION',
    'MECHANICAL_ENGINEERING',
  ];

  if (!validDepartments.includes(data.toDepartment)) {
    const error: AppError = new Error('Invalid department');
    error.statusCode = 400;
    throw error;
  }

  // Validate remarks
  if (data.remarks && data.remarks.length < 10) {
    const error: AppError = new Error('Purpose/Remarks must be at least 10 characters');
    error.statusCode = 400;
    throw error;
  }

  // Validate date
  const receivedDate = data.receivedDate || new Date();
  if (receivedDate > new Date()) {
    const error: AppError = new Error('Distribution date cannot be in the future');
    error.statusCode = 400;
    throw error;
  }

  // Create distribution and update stocks in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Reduce store stock
    await tx.storeStock.update({
      where: { itemId: data.itemId },
      data: {
        quantity: { decrement: data.quantity },
      },
    });

    // Update or create department stock
    await tx.departmentStock.upsert({
      where: {
        itemId_department: {
          itemId: data.itemId,
          department: data.toDepartment as any,
        },
      },
      update: {
        quantity: { increment: data.quantity },
        lastUpdated: new Date(),
      },
      create: {
        itemId: data.itemId,
        department: data.toDepartment as any,
        quantity: data.quantity,
        managedById: data.distributedById,
      },
    });

    // Create distribution record
    const distribution = await tx.distribution.create({
      data: {
        itemId: data.itemId,
        toDepartment: data.toDepartment as any,
        quantity: data.quantity,
        remarks: data.remarks,
        distributedById: data.distributedById,
        receivedDate,
      },
      include: {
        item: {
          include: {
            category: true,
            storeStock: true,
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
    });

    return distribution;
  });

  return result;
};

export const updateDistribution = async (
  id: string,
  data: UpdateDistributionData,
  editedById: string,
  reason?: string
) => {
  const distribution = await prisma.distribution.findUnique({
    where: { id },
    include: {
      item: {
        include: { storeStock: true },
      },
    },
  });

  if (!distribution) {
    const error: AppError = new Error('Distribution not found');
    error.statusCode = 404;
    throw error;
  }

  // Calculate quantity difference if quantity is being updated
  const quantityDiff = data.quantity !== undefined ? data.quantity - distribution.quantity : 0;

  // Update distribution and adjust stocks in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Log changes
    const changes: { fieldName: string; oldValue: string; newValue: string }[] = [];

    if (data.quantity !== undefined && data.quantity !== distribution.quantity) {
      changes.push({
        fieldName: 'quantity',
        oldValue: distribution.quantity.toString(),
        newValue: data.quantity.toString(),
      });
    }

    if (data.toDepartment && data.toDepartment !== distribution.toDepartment) {
      changes.push({
        fieldName: 'toDepartment',
        oldValue: distribution.toDepartment,
        newValue: data.toDepartment,
      });
    }

    // Update distribution
    const updatedDistribution = await tx.distribution.update({
      where: { id },
      data: {
        ...(data.itemId && { itemId: data.itemId }),
        ...(data.toDepartment && { toDepartment: data.toDepartment as any }),
        ...(data.quantity !== undefined && { quantity: data.quantity }),
        ...(data.remarks !== undefined && { remarks: data.remarks }),
        ...(data.receivedDate && { receivedDate: data.receivedDate }),
      },
      include: {
        item: {
          include: {
            category: true,
            storeStock: true,
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
    });

    // Adjust stocks if quantity changed
    if (quantityDiff !== 0) {
      const itemId = data.itemId || distribution.itemId;
      const toDepartment = data.toDepartment || distribution.toDepartment;

      // Adjust store stock
      await tx.storeStock.update({
        where: { itemId },
        data: {
          quantity: { increment: -quantityDiff }, // Negative because we're distributing
        },
      });

      // Adjust department stock
      await tx.departmentStock.update({
        where: {
          itemId_department: {
            itemId,
            department: toDepartment as any,
          },
        },
        data: {
          quantity: { increment: quantityDiff },
        },
      });
    }

    // Create edit logs
    if (changes.length > 0) {
      await Promise.all(
        changes.map((change) =>
          tx.editLog.create({
            data: {
              entityType: 'Distribution',
              entityId: id,
              fieldName: change.fieldName,
              oldValue: change.oldValue,
              newValue: change.newValue,
              editedById,
              reason,
              distributionId: id,
            },
          })
        )
      );
    }

    return updatedDistribution;
  });

  return result;
};

// ==================== STOCK SERVICE ====================

export const getStoreStock = async (itemId?: string) => {
  const where: any = {};

  if (itemId) {
    where.itemId = itemId;
  }

  const stocks = await prisma.storeStock.findMany({
    where,
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

  return stocks.map((stock) => ({
    ...stock,
    stockStatus: getStockStatus(stock.quantity, stock.item.minStockLevel),
  }));
};

export const getLowStockItems = async () => {
  const stocks = await prisma.storeStock.findMany({
    include: {
      item: {
        include: {
          category: true,
        },
      },
    },
  });

  return stocks
    .filter((stock) => stock.quantity < stock.item.minStockLevel)
    .map((stock) => ({
      ...stock,
      stockStatus: getStockStatus(stock.quantity, stock.item.minStockLevel),
      reorderQuantity: stock.item.minStockLevel - stock.quantity,
    }))
    .sort((a, b) => a.quantity - b.quantity);
};

export const getItemStock = async (itemId: string) => {
  const stock = await prisma.storeStock.findUnique({
    where: { itemId },
    include: {
      item: {
        include: {
          category: true,
        },
      },
    },
  });

  if (!stock) {
    return {
      itemId,
      quantity: 0,
      lastUpdated: new Date(),
      item: null,
      stockStatus: 'OUT_OF_STOCK' as const,
    };
  }

  return {
    ...stock,
    stockStatus: getStockStatus(stock.quantity, stock.item.minStockLevel),
  };
};

// ==================== REPORTS SERVICE ====================

export const getStockSummaryReport = async (dateFrom?: Date, dateTo?: Date) => {
  const stocks = await prisma.storeStock.findMany({
    include: {
      item: {
        include: {
          category: true,
        },
      },
    },
  });

  const totalItems = stocks.length;
  const totalValue = stocks.reduce((sum, stock) => {
    // Calculate average price per item from entries
    return sum; // Placeholder - would need to calculate from entries
  }, 0);

  const categorySummary = stocks.reduce((acc, stock) => {
    const categoryName = stock.item.category.name;
    if (!acc[categoryName]) {
      acc[categoryName] = { count: 0, totalQuantity: 0 };
    }
    acc[categoryName].count += 1;
    acc[categoryName].totalQuantity += stock.quantity;
    return acc;
  }, {} as Record<string, { count: number; totalQuantity: number }>);

  // Get distributions in date range
  const distributionWhere: any = {};
  if (dateFrom || dateTo) {
    distributionWhere.receivedDate = {};
    if (dateFrom) distributionWhere.receivedDate.gte = dateFrom;
    if (dateTo) distributionWhere.receivedDate.lte = dateTo;
  }

  const distributions = await prisma.distribution.findMany({
    where: distributionWhere,
    include: {
      item: {
        include: { category: true },
      },
    },
  });

  const departmentDistribution = distributions.reduce((acc, dist) => {
    const dept = dist.toDepartment;
    if (!acc[dept]) {
      acc[dept] = { count: 0, totalQuantity: 0 };
    }
    acc[dept].count += 1;
    acc[dept].totalQuantity += dist.quantity;
    return acc;
  }, {} as Record<string, { count: number; totalQuantity: number }>);

  return {
    totalItems,
    totalValue,
    categorySummary,
    departmentDistribution,
    lowStockItems: await getLowStockItems(),
  };
};

export const getInwardReport = async (dateFrom?: Date, dateTo?: Date) => {
  const where: any = {};
  if (dateFrom || dateTo) {
    where.billDate = {};
    if (dateFrom) where.billDate.gte = dateFrom;
    if (dateTo) where.billDate.lte = dateTo;
  }

  const entries = await prisma.storeEntry.findMany({
    where,
    include: {
      item: {
        include: { category: true },
      },
      addedBy: {
        select: {
          fullName: true,
          email: true,
        },
      },
    },
    orderBy: { billDate: 'desc' },
  });

  const totalQuantity = entries.reduce((sum, entry) => sum + entry.quantity, 0);
  const totalAmount = entries.reduce((sum, entry) => sum + Number(entry.billAmount), 0);

  const vendorSummary = entries.reduce((acc, entry) => {
    const vendor = entry.vendorName;
    if (!acc[vendor]) {
      acc[vendor] = { count: 0, totalAmount: 0, totalQuantity: 0 };
    }
    acc[vendor].count += 1;
    acc[vendor].totalAmount += Number(entry.billAmount);
    acc[vendor].totalQuantity += entry.quantity;
    return acc;
  }, {} as Record<string, { count: number; totalAmount: number; totalQuantity: number }>);

  return {
    entries,
    summary: {
      totalEntries: entries.length,
      totalQuantity,
      totalAmount,
      vendorSummary,
    },
  };
};

export const getOutwardReport = async (dateFrom?: Date, dateTo?: Date) => {
  const where: any = {};
  if (dateFrom || dateTo) {
    where.receivedDate = {};
    if (dateFrom) where.receivedDate.gte = dateFrom;
    if (dateTo) where.receivedDate.lte = dateTo;
  }

  const distributions = await prisma.distribution.findMany({
    where,
    include: {
      item: {
        include: { category: true },
      },
      distributedBy: {
        select: {
          fullName: true,
          email: true,
        },
      },
    },
    orderBy: { receivedDate: 'desc' },
  });

  const totalQuantity = distributions.reduce((sum, dist) => sum + dist.quantity, 0);

  const departmentSummary = distributions.reduce((acc, dist) => {
    const dept = dist.toDepartment;
    if (!acc[dept]) {
      acc[dept] = { count: 0, totalQuantity: 0 };
    }
    acc[dept].count += 1;
    acc[dept].totalQuantity += dist.quantity;
    return acc;
  }, {} as Record<string, { count: number; totalQuantity: number }>);

  const itemSummary = distributions.reduce((acc, dist) => {
    const itemName = dist.item.name;
    if (!acc[itemName]) {
      acc[itemName] = { count: 0, totalQuantity: 0 };
    }
    acc[itemName].count += 1;
    acc[itemName].totalQuantity += dist.quantity;
    return acc;
  }, {} as Record<string, { count: number; totalQuantity: number }>);

  return {
    distributions,
    summary: {
      totalDistributions: distributions.length,
      totalQuantity,
      departmentSummary,
      itemSummary,
    },
  };
};

// ==================== HELPER FUNCTIONS ====================

const getStockStatus = (quantity: number, minLevel: number): 'GOOD' | 'LOW' | 'CRITICAL' | 'OUT_OF_STOCK' => {
  if (quantity === 0) return 'OUT_OF_STOCK';
  if (quantity < minLevel * 0.5) return 'CRITICAL';
  if (quantity < minLevel) return 'LOW';
  return 'GOOD';
};

