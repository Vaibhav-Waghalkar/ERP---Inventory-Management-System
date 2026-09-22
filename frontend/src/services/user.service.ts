import api from './api';
import { User, CreateUserData, UpdateUserData, ApiResponse, PaginationMeta } from '../types';

interface UsersResponse {
  users: User[];
  pagination: PaginationMeta;
}

export const userService = {
  getAllUsers: async (page: number = 1, limit: number = 10, search?: string): Promise<UsersResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (search) {
      params.append('search', search);
    }

    const response = await api.get<ApiResponse<User[]>>(`/users?${params.toString()}`);
    if (response.data.success && response.data.data && response.data.pagination) {
      return {
        users: response.data.data,
        pagination: response.data.pagination,
      };
    }
    throw new Error(response.data.error || 'Failed to fetch users');
  },

  getUserById: async (id: string): Promise<User> => {
    const response = await api.get<ApiResponse<User>>(`/users/${id}`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to fetch user');
  },

  createUser: async (data: CreateUserData): Promise<User> => {
    const response = await api.post<ApiResponse<User>>('/users', data);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to create user');
  },

  updateUser: async (id: string, data: UpdateUserData): Promise<User> => {
    const response = await api.put<ApiResponse<User>>(`/users/${id}`, data);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to update user');
  },

  deleteUser: async (id: string): Promise<void> => {
    const response = await api.delete<ApiResponse>(`/users/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete user');
    }
  },

  toggleUserStatus: async (id: string): Promise<User> => {
    const response = await api.patch<ApiResponse<User>>(`/users/${id}/toggle-status`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to toggle user status');
  },
};

