import api from './api';
import { Department, UsageCategory } from '../types';

export interface DepartmentStockItem {
  id: string;
  itemId: string;
  itemName: string;
  category: string;
  currentStock: number;
  receivedThisMonth: number;
  usedThisMonth: number;
  unit: string;
  status: 'GOOD' | 'LOW' | 'OUT';
  minStockLevel: number;
  lastUpdated: string;
}

export interface UsageLog {
  id: string;
  itemId: string;
  item: {
    id: string;
    name: string;
    category: {
      id: string;
      name: string;
    };
  };
  department: Department;
  quantityUsed: number;
  usageDate: string;
  category: UsageCategory;
  purpose: string;
  attachmentUrl?: string;
  usedBy: {
    id: string;
    fullName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  editLogs?: EditLog[];
}

export interface EditLog {
  id: string;
  entityType: string;
  entityId: string;
  fieldName: string;
  oldValue?: string;
  newValue?: string;
  editedBy: {
    id: string;
    fullName: string;
    email: string;
  };
  editedAt: string;
  reason?: string;
}

export interface CreateUsageLogData {
  itemId: string;
  quantityUsed: number;
  usageDate: string;
  category: UsageCategory;
  purpose: string;
  attachmentUrl?: string;
}

export interface Distribution {
  id: string;
  itemId: string;
  item: {
    id: string;
    name: string;
    category: {
      id: string;
      name: string;
    };
  };
  toDepartment: Department;
  quantity: number;
  receivedQuantity?: number;
  isConfirmed: boolean;
  confirmedAt?: string;
  distributedBy: {
    id: string;
    fullName: string;
    email: string;
  };
  receivedDate: string;
  remarks?: string;
  createdAt: string;
}

// Department Stock
export const getDepartmentStock = async (dept: Department) => {
  const response = await api.get(`/department/${dept}/stock`);
  return response.data.data as DepartmentStockItem[];
};

export const getDepartmentStockItem = async (dept: Department, itemId: string) => {
  const response = await api.get(`/department/${dept}/stock/${itemId}`);
  return response.data.data;
};

export const reconcileDepartmentStock = async (
  dept: Department,
  itemId: string,
  newQuantity: number,
  reason: string
) => {
  const response = await api.put(`/department/${dept}/stock/${itemId}`, {
    newQuantity,
    reason,
  });
  return response.data.data;
};

// Incoming Items
export const getIncomingItems = async (dept: Department) => {
  const response = await api.get(`/department/${dept}/incoming`);
  return response.data.data as Distribution[];
};

export const confirmReceipt = async (
  dept: Department,
  distributionId: string,
  receivedQuantity: number
) => {
  const response = await api.put(`/department/${dept}/incoming/${distributionId}`, {
    receivedQuantity,
  });
  return response.data.data;
};

// Usage Logs
export const createUsageLog = async (dept: Department, data: CreateUsageLogData) => {
  const response = await api.post(`/department/${dept}/usage`, data);
  return response.data.data as UsageLog;
};

export const createBulkUsageLogs = async (dept: Department, logs: CreateUsageLogData[]) => {
  const response = await api.post(`/department/${dept}/usage/bulk`, { logs });
  return response.data.data as UsageLog[];
};

export const getUsageLogs = async (
  dept: Department,
  filters?: {
    startDate?: string;
    endDate?: string;
    itemId?: string;
    category?: UsageCategory;
    usedById?: string;
  }
) => {
  const params = new URLSearchParams();
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);
  if (filters?.itemId) params.append('itemId', filters.itemId);
  if (filters?.category) params.append('category', filters.category);
  if (filters?.usedById) params.append('usedById', filters.usedById);

  const response = await api.get(`/department/${dept}/usage?${params.toString()}`);
  return response.data.data as UsageLog[];
};

export const getUsageLogById = async (dept: Department, id: string) => {
  const response = await api.get(`/department/${dept}/usage/${id}`);
  return response.data.data as UsageLog;
};

export const updateUsageLog = async (
  dept: Department,
  id: string,
  data: Partial<CreateUsageLogData> & { reason: string }
) => {
  const response = await api.put(`/department/${dept}/usage/${id}`, data);
  return response.data.data as UsageLog;
};

export const deleteUsageLog = async (dept: Department, id: string, reason: string) => {
  const response = await api.delete(`/department/${dept}/usage/${id}`, {
    data: { reason },
  });
  return response.data.data;
};

// Reports
export const getDepartmentSummary = async (dept: Department) => {
  const response = await api.get(`/department/${dept}/reports/summary`);
  return response.data.data;
};

export const getUsageReport = async (
  dept: Department,
  startDate: string,
  endDate: string
) => {
  const response = await api.get(
    `/department/${dept}/reports/usage?startDate=${startDate}&endDate=${endDate}`
  );
  return response.data.data;
};

export const getMonthlyConsumption = async (dept: Department, itemId?: string) => {
  const params = itemId ? `?itemId=${itemId}` : '';
  const response = await api.get(`/department/${dept}/reports/consumption${params}`);
  return response.data.data;
};

// Verification
export const verifyDepartmentStock = async (dept: Department, itemId?: string) => {
  const params = itemId ? `?itemId=${itemId}` : '';
  const response = await api.get(`/department/${dept}/verify${params}`);
  return response.data.data;
};

