const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class UserService {
  /**
   * Get all users with pagination
   */
  async getUsers(page = 1, limit = 20, search = '') {
    const skip = (page - 1) * limit;
    const where = search
      ? {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          gender: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          _count: { select: { screenings: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Update user (admin)
   */
  async updateUser(userId, data) {
    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true, email: true, name: true, role: true, isActive: true,
      },
    });
  }

  /**
   * Delete user
   */
  async deleteUser(userId) {
    return prisma.user.delete({ where: { id: userId } });
  }
}

module.exports = new UserService();
