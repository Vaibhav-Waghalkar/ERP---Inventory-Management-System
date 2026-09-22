import api from './api';
import { EditLog } from '../types';

export interface AuditLogFilters {
  entityType?: string;
  entityId?: string;
  editedById?: string;
  startDate?: string;
  endDate?: string;
}

export interface AuditStats {
  totalLogs: number;
  byEntityType: Array<{ entityType: string; _count: { id: number } }>;
  topUsers: Array<{
    editedById: string;
    _count: { id: number };
    user?: {
      fullName: string;
      email: string;
      role: string;
    };
  }>;
  recentActivity: EditLog[];
}

export const getAuditLogs = async (filters?: AuditLogFilters) => {
  const params = new URLSearchParams();
  if (filters?.entityType) params.append('entityType', filters.entityType);
  if (filters?.entityId) params.append('entityId', filters.entityId);
  if (filters?.editedById) params.append('editedById', filters.editedById);
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);

  const response = await api.get(`/audit/logs?${params.toString()}`);
  return response.data.data as EditLog[];
};

export const getAuditStats = async () => {
  const response = await api.get('/audit/stats');
  return response.data.data as AuditStats;
};

