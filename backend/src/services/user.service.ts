import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { hashPassword } from './auth.service';

export interface CreateUserData {
  email: string;
  password: string;
  fullName: string;
  role: string;
  department?: string | null;
}

export interface UpdateUserData {
  fullName?: string;
  role?: string;
  department?: string | null;
  isActive?: boolean;
}

export const getAllUsers = async (page: number = 1, limit: number = 10, search?: string) => {
  const skip = (page - 1) * limit;
  const where = search
    ? {
        OR: [
          { email: { contains: search, mode: 'insensitive' as const } },
          { fullName: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        department: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getUserById = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      department: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    const error: AppError = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  return user;
};

export const createUser = async (data: CreateUserData) => {
  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
  });

  if (existingUser) {
    const error: AppError = new Error('Email already exists');
    error.statusCode = 409;
    throw error;
  }

  // Hash password
  const hashedPassword = await hashPassword(data.password);

  // Create user
  const user = await prisma.user.create({
    data: {
      email: data.email.toLowerCase(),
      password: hashedPassword,
      fullName: data.fullName,
      role: data.role as any,
      department: data.department as any,
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      department: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user;
};

export const updateUser = async (id: string, data: UpdateUserData) => {
  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id },
  });

  if (!existingUser) {
    const error: AppError = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  // Update user
  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(data.fullName && { fullName: data.fullName }),
      ...(data.role && { role: data.role as any }),
      ...(data.department !== undefined && { department: data.department as any }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      department: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user;
};

export const deleteUser = async (id: string) => {
  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id },
  });

  if (!existingUser) {
    const error: AppError = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  // Prevent deleting super admin
  if (existingUser.role === 'SUPER_ADMIN') {
    const error: AppError = new Error('Cannot delete super admin user');
    error.statusCode = 403;
    throw error;
  }

  // Delete user
  await prisma.user.delete({
    where: { id },
  });
};

export const toggleUserStatus = async (id: string) => {
  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id },
  });

  if (!existingUser) {
    const error: AppError = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  // Prevent deactivating super admin
  if (existingUser.role === 'SUPER_ADMIN' && existingUser.isActive) {
    const error: AppError = new Error('Cannot deactivate super admin user');
    error.statusCode = 403;
    throw error;
  }

  // Toggle status
  const user = await prisma.user.update({
    where: { id },
    data: { isActive: !existingUser.isActive },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      department: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user;
};

