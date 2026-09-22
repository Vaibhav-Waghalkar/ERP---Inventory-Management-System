import api from './api';
import {
  Category,
  Item,
  StoreStock,
  StoreEntry,
  Distribution,
  CreateCategoryData,
  UpdateCategoryData,
  CreateItemData,
  UpdateItemData,
  CreateStoreEntryData,
  UpdateStoreEntryData,
  CreateDistributionData,
  UpdateDistributionData,
  StoreEntryFilters,
  DistributionFilters,
  ApiResponse,
  PaginationMeta,
} from '../types';

// ==================== CATEGORY SERVICE ====================

export const categoryService = {
  getAll: async (): Promise<Category[]> => {
    const response = await api.get<ApiResponse<Category[]>>('/store/categories');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to fetch categories');
  },

  getById: async (id: string): Promise<Category> => {
    const response = await api.get<ApiResponse<Category>>(`/store/categories/${id}`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to fetch category');
  },

  create: async (data: CreateCategoryData): Promise<Category> => {
    const response = await api.post<ApiResponse<Category>>('/store/categories', data);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to create category');
  },

  update: async (id: string, data: UpdateCategoryData): Promise<Category> => {
    const response = await api.put<ApiResponse<Category>>(`/store/categories/${id}`, data);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to update category');
  },

  delete: async (id: string): Promise<void> => {
    const response = await api.delete<ApiResponse>(`/store/categories/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete category');
    }
  },
};

// ==================== ITEM SERVICE ====================

export const itemService = {
  getAll: async (search?: string, categoryId?: string): Promise<Item[]> => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (categoryId) params.append('categoryId', categoryId);

    const response = await api.get<ApiResponse<Item[]>>(
      `/store/items${params.toString() ? `?${params.toString()}` : ''}`
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to fetch items');
  },

  getById: async (id: string): Promise<Item> => {
    const response = await api.get<ApiResponse<Item>>(`/store/items/${id}`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to fetch item');
  },

  create: async (data: CreateItemData): Promise<Item> => {
    const response = await api.post<ApiResponse<Item>>('/store/items', data);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to create item');
  },

  update: async (id: string, data: UpdateItemData): Promise<Item> => {
    const response = await api.put<ApiResponse<Item>>(`/store/items/${id}`, data);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to update item');
  },

  delete: async (id: string): Promise<void> => {
    const response = await api.delete<ApiResponse>(`/store/items/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete item');
    }
  },
};

// ==================== STORE ENTRY SERVICE ====================

export const storeEntryService = {
  getAll: async (
    page: number = 1,
    limit: number = 50,
    filters?: StoreEntryFilters
  ): Promise<{ entries: StoreEntry[]; pagination: PaginationMeta }> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (filters) {
      if (filters.itemId) params.append('itemId', filters.itemId);
      if (filters.vendorName) params.append('vendorName', filters.vendorName);
      if (filters.billNumber) params.append('billNumber', filters.billNumber);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.amountFrom) params.append('amountFrom', filters.amountFrom.toString());
      if (filters.amountTo) params.append('amountTo', filters.amountTo.toString());
    }

    const response = await api.get<ApiResponse<StoreEntry[]>>(`/store/entries?${params.toString()}`);
    if (response.data.success && response.data.data && response.data.pagination) {
      return {
        entries: response.data.data,
        pagination: response.data.pagination,
      };
    }
    throw new Error(response.data.error || 'Failed to fetch store entries');
  },

  getById: async (id: string): Promise<StoreEntry> => {
    const response = await api.get<ApiResponse<StoreEntry>>(`/store/entries/${id}`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to fetch store entry');
  },

  create: async (data: CreateStoreEntryData): Promise<StoreEntry> => {
    const formData = new FormData();
    formData.append('itemId', data.itemId);
    formData.append('quantity', data.quantity.toString());
    formData.append('billNumber', data.billNumber);
    formData.append('billDate', data.billDate);
    formData.append('billAmount', data.billAmount.toString());
    formData.append('vendorName', data.vendorName);
    if (data.vendorContact) formData.append('vendorContact', data.vendorContact);
    if (data.billImage) formData.append('billImage', data.billImage);
    if (data.remarks) formData.append('remarks', data.remarks);

    const response = await api.post<ApiResponse<StoreEntry>>('/store/entries', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to create store entry');
  },

  update: async (id: string, data: UpdateStoreEntryData): Promise<StoreEntry> => {
    const formData = new FormData();
    if (data.itemId) formData.append('itemId', data.itemId);
    if (data.quantity !== undefined) formData.append('quantity', data.quantity.toString());
    if (data.billNumber) formData.append('billNumber', data.billNumber);
    if (data.billDate) formData.append('billDate', data.billDate);
    if (data.billAmount !== undefined) formData.append('billAmount', data.billAmount.toString());
    if (data.vendorName) formData.append('vendorName', data.vendorName);
    if (data.vendorContact !== undefined) formData.append('vendorContact', data.vendorContact);
    if (data.billImage) formData.append('billImage', data.billImage);
    if (data.remarks !== undefined) formData.append('remarks', data.remarks);
    if (data.reason) formData.append('reason', data.reason);

    const response = await api.put<ApiResponse<StoreEntry>>(`/store/entries/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to update store entry');
  },

  delete: async (id: string): Promise<void> => {
    const response = await api.delete<ApiResponse>(`/store/entries/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete store entry');
    }
  },
};

// ==================== DISTRIBUTION SERVICE ====================

export const distributionService = {
  getAll: async (
    page: number = 1,
    limit: number = 50,
    filters?: DistributionFilters
  ): Promise<{ distributions: Distribution[]; pagination: PaginationMeta }> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (filters) {
      if (filters.itemId) params.append('itemId', filters.itemId);
      if (filters.toDepartment) params.append('toDepartment', filters.toDepartment);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
    }

    const response = await api.get<ApiResponse<Distribution[]>>(
      `/store/distributions?${params.toString()}`
    );
    if (response.data.success && response.data.data && response.data.pagination) {
      return {
        distributions: response.data.data,
        pagination: response.data.pagination,
      };
    }
    throw new Error(response.data.error || 'Failed to fetch distributions');
  },

  getById: async (id: string): Promise<Distribution> => {
    const response = await api.get<ApiResponse<Distribution>>(`/store/distributions/${id}`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to fetch distribution');
  },

  create: async (data: CreateDistributionData): Promise<Distribution> => {
    const response = await api.post<ApiResponse<Distribution>>('/store/distributions', data);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to create distribution');
  },

  update: async (id: string, data: UpdateDistributionData): Promise<Distribution> => {
    const response = await api.put<ApiResponse<Distribution>>(`/store/distributions/${id}`, data);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to update distribution');
  },
};

// ==================== STOCK SERVICE ====================

export const stockService = {
  getAll: async (itemId?: string): Promise<StoreStock[]> => {
    const params = new URLSearchParams();
    if (itemId) params.append('itemId', itemId);

    const response = await api.get<ApiResponse<StoreStock[]>>(
      `/store/stock${params.toString() ? `?${params.toString()}` : ''}`
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to fetch stock');
  },

  getLowStock: async (): Promise<StoreStock[]> => {
    const response = await api.get<ApiResponse<StoreStock[]>>('/store/stock/low');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to fetch low stock items');
  },

  getByItemId: async (itemId: string): Promise<StoreStock> => {
    const response = await api.get<ApiResponse<StoreStock>>(`/store/stock/${itemId}`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to fetch item stock');
  },
};

// ==================== REPORTS SERVICE ====================

export const reportService = {
  getStockSummary: async (dateFrom?: string, dateTo?: string): Promise<any> => {
    const params = new URLSearchParams();
    if (dateFrom) params.append('dateFrom', dateFrom);
    if (dateTo) params.append('dateTo', dateTo);

    const response = await api.get<ApiResponse<any>>(
      `/store/reports/summary${params.toString() ? `?${params.toString()}` : ''}`
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to fetch stock summary report');
  },

  getInwardReport: async (dateFrom?: string, dateTo?: string): Promise<any> => {
    const params = new URLSearchParams();
    if (dateFrom) params.append('dateFrom', dateFrom);
    if (dateTo) params.append('dateTo', dateTo);

    const response = await api.get<ApiResponse<any>>(
      `/store/reports/inward${params.toString() ? `?${params.toString()}` : ''}`
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to fetch inward report');
  },

  getOutwardReport: async (dateFrom?: string, dateTo?: string): Promise<any> => {
    const params = new URLSearchParams();
    if (dateFrom) params.append('dateFrom', dateFrom);
    if (dateTo) params.append('dateTo', dateTo);

    const response = await api.get<ApiResponse<any>>(
      `/store/reports/outward${params.toString() ? `?${params.toString()}` : ''}`
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to fetch outward report');
  },
};

