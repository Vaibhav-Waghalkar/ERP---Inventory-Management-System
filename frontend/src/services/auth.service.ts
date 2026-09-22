import api from './api';
import { AuthResponse, LoginCredentials, ChangePasswordData, User, ApiResponse } from '../types';

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
    if (response.data.success && response.data.data) {
      // Store tokens and user data
      localStorage.setItem('accessToken', response.data.data.accessToken);
      localStorage.setItem('refreshToken', response.data.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
      return response.data.data;
    }
    throw new Error(response.data.error || 'Login failed');
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  },

  refreshToken: async (): Promise<string> => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await api.post<ApiResponse<{ accessToken: string }>>('/auth/refresh-token', {
      refreshToken,
    });

    if (response.data.success && response.data.data) {
      localStorage.setItem('accessToken', response.data.data.accessToken);
      return response.data.data.accessToken;
    }
    throw new Error(response.data.error || 'Token refresh failed');
  },

  getMe: async (): Promise<User> => {
    const response = await api.get<ApiResponse<User>>('/auth/me');
    if (response.data.success && response.data.data) {
      localStorage.setItem('user', JSON.stringify(response.data.data));
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to get user data');
  },

  changePassword: async (data: ChangePasswordData): Promise<void> => {
    const response = await api.put<ApiResponse>('/auth/change-password', {
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });

    if (!response.data.success) {
      throw new Error(response.data.error || 'Password change failed');
    }
  },
};

