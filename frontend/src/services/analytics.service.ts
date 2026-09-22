import api from './api';
import { Department, UsageCategory } from '../types';

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

export interface DepartmentComparison {
  department: Department;
  totalItems: number;
  monthlyUsage: number;
  lowStockCount: number;
  topItems: Array<{ itemName: string; quantity: number }>;
}

export interface StockPrediction {
  itemId: string;
  itemName: string;
  currentStock: number;
  averageMonthlyUsage: number;
  predictedRunoutDate: string | null;
  daysUntilRunout: number | null;
  recommendation: string;
}

export const getDashboard = async (role?: string, dept?: Department) => {
  const params = new URLSearchParams();
  if (role) params.append('role', role);
  if (dept) params.append('dept', dept);
  const response = await api.get(`/analytics/dashboard?${params.toString()}`);
  return response.data.data as DashboardData;
};

export const getDepartmentComparison = async (
  departments?: Department[],
  period: 'week' | 'month' | 'year' = 'month'
) => {
  const params = new URLSearchParams();
  if (departments) {
    params.append('departments', departments.join(','));
  } else {
    params.append('departments', 'all');
  }
  params.append('period', period);
  const response = await api.get(`/analytics/comparison?${params.toString()}`);
  return response.data.data as DepartmentComparison[];
};

export const getStockPredictions = async (dept: Department, itemId?: string) => {
  const params = new URLSearchParams();
  params.append('dept', dept);
  if (itemId) params.append('itemId', itemId);
  const response = await api.get(`/analytics/predictions?${params.toString()}`);
  return response.data.data as StockPrediction[];
};

