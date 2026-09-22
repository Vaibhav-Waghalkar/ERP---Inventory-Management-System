import prisma from '../config/database';

export interface AuditLogFilters {
  entityType?: string;
  entityId?: string;
  editedById?: string;
  startDate?: Date;
  endDate?: Date;
}

export const getAuditLogs = async (filters: AuditLogFilters = {}) => {
  const where: any = {};

  if (filters.entityType) {
    where.entityType = filters.entityType;
  }

  if (filters.entityId) {
    where.entityId = filters.entityId;
  }

  if (filters.editedById) {
    where.editedById = filters.editedById;
  }

  if (filters.startDate || filters.endDate) {
    where.editedAt = {};
    if (filters.startDate) {
      where.editedAt.gte = filters.startDate;
    }
    if (filters.endDate) {
      where.editedAt.lte = filters.endDate;
    }
  }

  const logs = await prisma.editLog.findMany({
    where,
    include: {
      editedBy: {
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: {
      editedAt: 'desc',
    },
    take: 1000, // Limit to prevent performance issues
  });

  return logs;
};

export const getAuditStats = async () => {
  const [totalLogs, byEntityType, byUser, recentActivity] = await Promise.all([
    prisma.editLog.count(),
    prisma.editLog.groupBy({
      by: ['entityType'],
      _count: {
        id: true,
      },
    }),
    prisma.editLog.groupBy({
      by: ['editedById'],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10,
    }),
    prisma.editLog.findMany({
      take: 10,
      orderBy: {
        editedAt: 'desc',
      },
      include: {
        editedBy: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
    }),
  ]);

  // Get user details for top users
  const topUsers = await Promise.all(
    byUser.map(async (user) => {
      const userData = await prisma.user.findUnique({
        where: { id: user.editedById },
        select: {
          fullName: true,
          email: true,
          role: true,
        },
      });
      return {
        ...user,
        user: userData,
      };
    })
  );

  return {
    totalLogs,
    byEntityType,
    topUsers,
    recentActivity,
  };
};

