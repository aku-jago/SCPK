const { PrismaClient } = require('@prisma/client');
const { hashPassword, comparePassword } = require('../utils/hash');
const { generateToken, verifyToken } = require('../utils/jwt');

const prisma = new PrismaClient();

class AuthService {
  /**
   * Register a new user
   */
  async register({ name, email, password, phone, gender, dateOfBirth }) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      const error = new Error('Email sudah terdaftar.');
      error.statusCode = 409;
      throw error;
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone: phone || null,
        gender: gender || null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    const token = generateToken({ userId: user.id, role: user.role });

    return { user, token };
  }

  /**
   * Login an existing user
   */
  async login({ email, password }) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      const error = new Error('Email atau password salah.');
      error.statusCode = 401;
      throw error;
    }

    if (!user.isActive) {
      const error = new Error('Akun Anda telah dinonaktifkan. Hubungi administrator.');
      error.statusCode = 403;
      throw error;
    }

    const isMatch = await comparePassword(password, user.password);

    if (!isMatch) {
      const error = new Error('Email atau password salah.');
      error.statusCode = 401;
      throw error;
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = generateToken({ userId: user.id, role: user.role });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
      },
      token,
    };
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        dateOfBirth: true,
        gender: true,
        role: true,
        avatar: true,
        createdAt: true,
        lastLoginAt: true,
        _count: {
          select: { screenings: true },
        },
      },
    });

    if (!user) {
      const error = new Error('User tidak ditemukan.');
      error.statusCode = 404;
      throw error;
    }

    return user;
  }

  /**
   * Forgot password — generates a reset token
   * In production, this would send an email with the token.
   * For this demo, we return the token in the response.
   */
  async forgotPassword(email) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal whether user exists for security
      return { message: 'Jika email terdaftar, instruksi reset password akan dikirim.' };
    }

    // Generate a short-lived token (15 min)
    const resetToken = generateToken({ userId: user.id, purpose: 'reset' });

    return {
      message: 'Jika email terdaftar, instruksi reset password akan dikirim.',
      // In production, remove this — send via email instead
      resetToken,
    };
  }

  /**
   * Reset password with token
   */
  async resetPassword(token, newPassword) {
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch {
      const error = new Error('Token tidak valid atau telah kedaluwarsa.');
      error.statusCode = 400;
      throw error;
    }

    if (decoded.purpose !== 'reset') {
      const error = new Error('Token tidak valid.');
      error.statusCode = 400;
      throw error;
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: decoded.userId },
      data: { password: hashedPassword },
    });

    return { message: 'Password berhasil direset. Silakan login dengan password baru.' };
  }

  /**
   * Update user profile
   */
  async updateProfile(userId, data) {
    const updateData = {};
    if (data.name) updateData.name = data.name;
    if (data.phone) updateData.phone = data.phone;
    if (data.gender) updateData.gender = data.gender;
    if (data.dateOfBirth) updateData.dateOfBirth = new Date(data.dateOfBirth);

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        dateOfBirth: true,
        gender: true,
        role: true,
        avatar: true,
      },
    });

    return user;
  }

  /**
   * Change password
   */
  async changePassword(userId, { currentPassword, newPassword }) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    const isMatch = await comparePassword(currentPassword, user.password);
    if (!isMatch) {
      const error = new Error('Password saat ini salah.');
      error.statusCode = 400;
      throw error;
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Password berhasil diubah.' };
  }
}

module.exports = new AuthService();
