/**
 * 用户服务模块
 * 负责用户管理相关的业务逻辑
 */

// 导入依赖
const config = require('../config/config');
const logger = require('../logging/logger');
const {
  AppError,
  ValidationError,
  DatabaseError
} = require('../errors/appError');
const stringUtils = require('../utils/stringUtils');
const arrayUtils = require('../utils/arrayUtils');

/**
 * 用户服务类
 */
class UserService {
  constructor(di) {
    this.di = di;
    this.userRepository = di.get('userRepository');
    this.authService = di.get('authService');
    this.emailService = di.get('emailService');
  }

  /**
   * 创建新用户
   * @param {Object} userData - 用户数据
   * @returns {Promise<Object>} 创建的用户信息
   */
  async createUser(userData) {
    try {
      // 验证用户数据
      const validationError = this._validateUserData(userData);
      if (validationError) {
        throw validationError;
      }

      // 检查邮箱是否已存在
      const existingUser = await this.userRepository.findByEmail(userData.email);
      if (existingUser) {
        throw AppError.conflict('Email already registered', 'EMAIL_EXISTS');
      }

      // 加密密码
      const passwordHash = await this.authService.hashPassword(userData.password);

      // 准备用户数据
      const newUser = {
        name: userData.name,
        email: userData.email.toLowerCase(),
        password_hash: passwordHash,
        role: userData.role || 'user',
        is_active: config.get('app.env') === 'production' ? false : true,
        phone: userData.phone,
        address: userData.address,
        created_at: new Date(),
        updated_at: new Date()
      };

      // 保存用户
      const createdUser = await this.userRepository.create(newUser);

      // 生成邮箱验证令牌
      const { token, expiresAt } = await this.authService.generateEmailVerificationToken(createdUser.id);

      // 发送验证邮件（如果不是开发环境）
      if (config.get('app.env') !== 'development' && config.get('email.enabled')) {
        await this.emailService.sendEmailVerification(createdUser.email, createdUser.name, token);
      }

      logger.info('User created successfully', { userId: createdUser.id, email: createdUser.email });

      // 返回用户信息（不包含敏感数据）
      return this._formatUserResponse(createdUser);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error creating user', error);
      throw AppError.internalError('Failed to create user');
    }
  }

  /**
   * 获取用户信息
   * @param {number} userId - 用户ID
   * @returns {Promise<Object>} 用户信息
   */
  async getUserById(userId) {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw AppError.notFound('User not found', 'USER_NOT_FOUND');
      }

      return this._formatUserResponse(user);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error fetching user', error);
      throw AppError.internalError('Failed to fetch user');
    }
  }

  /**
   * 更新用户信息
   * @param {number} userId - 用户ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<Object>} 更新后的用户信息
   */
  async updateUser(userId, updateData) {
    try {
      // 获取现有用户
      const existingUser = await this.userRepository.findById(userId);
      if (!existingUser) {
        throw AppError.notFound('User not found', 'USER_NOT_FOUND');
      }

      // 验证更新数据
      const validationError = this._validateUpdateData(updateData);
      if (validationError) {
        throw validationError;
      }

      // 如果更新邮箱，检查是否已存在
      if (updateData.email && updateData.email.toLowerCase() !== existingUser.email) {
        const emailExists = await this.userRepository.findByEmail(updateData.email.toLowerCase());
        if (emailExists && emailExists.id !== userId) {
          throw AppError.conflict('Email already registered', 'EMAIL_EXISTS');
        }
      }

      // 准备更新数据
      const updatePayload = {};
      
      if (updateData.name) updatePayload.name = updateData.name;
      if (updateData.email) updatePayload.email = updateData.email.toLowerCase();
      if (updateData.phone) updatePayload.phone = updateData.phone;
      if (updateData.address) updatePayload.address = updateData.address;
      
      // 如果更新密码，需要重新加密
      if (updateData.password) {
        updatePayload.password_hash = await this.authService.hashPassword(updateData.password);
      }
      
      updatePayload.updated_at = new Date();

      // 执行更新
      const updatedUser = await this.userRepository.update(userId, updatePayload);

      logger.info('User updated successfully', { userId: updatedUser.id });

      return this._formatUserResponse(updatedUser);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error updating user', error);
      throw AppError.internalError('Failed to update user');
    }
  }

  /**
   * 删除用户（软删除）
   * @param {number} userId - 用户ID
   * @returns {Promise<boolean>} 是否成功
   */
  async deleteUser(userId) {
    try {
      // 检查用户是否存在
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw AppError.notFound('User not found', 'USER_NOT_FOUND');
      }

      // 执行软删除
      await this.userRepository.update(userId, {
        is_active: false,
        deleted_at: new Date(),
        updated_at: new Date()
      });

      logger.info('User deleted successfully', { userId });
      return true;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error deleting user', error);
      throw AppError.internalError('Failed to delete user');
    }
  }

  /**
   * 激活用户账户
   * @param {number} userId - 用户ID
   * @returns {Promise<Object>} 激活后的用户信息
   */
  async activateUser(userId) {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw AppError.notFound('User not found', 'USER_NOT_FOUND');
      }

      if (user.is_active) {
        throw AppError.conflict('User is already active', 'USER_ACTIVE');
      }

      const updatedUser = await this.userRepository.update(userId, {
        is_active: true,
        updated_at: new Date()
      });

      logger.info('User activated successfully', { userId });
      return this._formatUserResponse(updatedUser);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error activating user', error);
      throw AppError.internalError('Failed to activate user');
    }
  }

  /**
   * 停用用户账户
   * @param {number} userId - 用户ID
   * @returns {Promise<Object>} 停用后的用户信息
   */
  async deactivateUser(userId) {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw AppError.notFound('User not found', 'USER_NOT_FOUND');
      }

      if (!user.is_active) {
        throw AppError.conflict('User is already inactive', 'USER_INACTIVE');
      }

      const updatedUser = await this.userRepository.update(userId, {
        is_active: false,
        updated_at: new Date()
      });

      logger.info('User deactivated successfully', { userId });
      return this._formatUserResponse(updatedUser);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error deactivating user', error);
      throw AppError.internalError('Failed to deactivate user');
    }
  }

  /**
   * 搜索用户
   * @param {Object} searchParams - 搜索参数
   * @param {number} page - 页码
   * @param {number} limit - 每页数量
   * @returns {Promise<Object>} 搜索结果和分页信息
   */
  async searchUsers(searchParams, page = 1, limit = 20) {
    try {
      // 验证分页参数
      page = Math.max(1, parseInt(page, 10) || 1);
      limit = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));

      // 准备搜索条件
      const conditions = {};
      
      if (searchParams.name) {
        conditions.name = { $like: `%${searchParams.name}%` };
      }
      
      if (searchParams.email) {
        conditions.email = { $like: `%${searchParams.email}%` };
      }
      
      if (searchParams.role) {
        conditions.role = searchParams.role;
      }
      
      if (typeof searchParams.is_active === 'boolean') {
        conditions.is_active = searchParams.is_active;
      }

      // 执行搜索
      const { items, total } = await this.userRepository.search(
        conditions,
        page,
        limit,
        ['created_at', 'DESC']
      );

      // 格式化结果
      const formattedUsers = items.map(user => this._formatUserResponse(user));

      return {
        users: formattedUsers,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error searching users', error);
      throw AppError.internalError('Failed to search users');
    }
  }

  /**
   * 更新用户角色
   * @param {number} userId - 用户ID
   * @param {string} role - 新角色
   * @returns {Promise<Object>} 更新后的用户信息
   */
  async updateUserRole(userId, role) {
    try {
      const validRoles = ['user', 'seller', 'admin'];
      
      if (!validRoles.includes(role)) {
        throw ValidationError('Invalid role', { role: 'Role must be one of: user, seller, admin' });
      }

      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw AppError.notFound('User not found', 'USER_NOT_FOUND');
      }

      const updatedUser = await this.userRepository.update(userId, {
        role,
        updated_at: new Date()
      });

      logger.info('User role updated', { userId, oldRole: user.role, newRole: role });
      return this._formatUserResponse(updatedUser);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error updating user role', error);
      throw AppError.internalError('Failed to update user role');
    }
  }

  /**
   * 验证用户邮箱
   * @param {number} userId - 用户ID
   * @param {string} token - 验证令牌
   * @returns {Promise<boolean>} 是否成功
   */
  async verifyEmail(userId, token) {
    try {
      // 验证令牌
      const isValid = await this.authService.verifyEmailVerificationToken(userId, token);
      if (!isValid) {
        throw AppError.badRequest('Invalid or expired verification token', 'INVALID_TOKEN');
      }

      // 更新用户邮箱验证状态
      await this.userRepository.update(userId, {
        is_email_verified: true,
        is_active: true, // 邮箱验证后自动激活账户
        updated_at: new Date()
      });

      // 撤销验证令牌
      await this.authService.revokeEmailVerificationToken(userId);

      logger.info('Email verified successfully', { userId });
      return true;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error verifying email', error);
      throw AppError.internalError('Failed to verify email');
    }
  }

  /**
   * 重置用户密码
   * @param {number} userId - 用户ID
   * @param {string} token - 重置令牌
   * @param {string} newPassword - 新密码
   * @returns {Promise<boolean>} 是否成功
   */
  async resetPassword(userId, token, newPassword) {
    try {
      // 验证令牌
      const isValid = await this.authService.verifyPasswordResetToken(userId, token);
      if (!isValid) {
        throw AppError.badRequest('Invalid or expired reset token', 'INVALID_TOKEN');
      }

      // 验证密码强度
      const passwordError = this._validatePassword(newPassword);
      if (passwordError) {
        throw passwordError;
      }

      // 加密新密码
      const passwordHash = await this.authService.hashPassword(newPassword);

      // 更新密码
      await this.userRepository.update(userId, {
        password_hash: passwordHash,
        updated_at: new Date()
      });

      // 撤销重置令牌
      await this.authService.revokePasswordResetToken(userId);

      // 记录密码更改日志
      logger.info('Password reset successfully', { userId });
      
      return true;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error resetting password', error);
      throw AppError.internalError('Failed to reset password');
    }
  }

  /**
   * 更改用户密码
   * @param {number} userId - 用户ID
   * @param {string} currentPassword - 当前密码
   * @param {string} newPassword - 新密码
   * @returns {Promise<boolean>} 是否成功
   */
  async changePassword(userId, currentPassword, newPassword) {
    try {
      // 获取用户信息
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw AppError.notFound('User not found', 'USER_NOT_FOUND');
      }

      // 验证当前密码
      const isMatch = await this.authService.comparePasswords(currentPassword, user.password_hash);
      if (!isMatch) {
        throw AppError.badRequest('Current password is incorrect', 'INVALID_CURRENT_PASSWORD');
      }

      // 验证新密码
      const passwordError = this._validatePassword(newPassword);
      if (passwordError) {
        throw passwordError;
      }

      // 加密新密码
      const passwordHash = await this.authService.hashPassword(newPassword);

      // 更新密码
      await this.userRepository.update(userId, {
        password_hash: passwordHash,
        updated_at: new Date()
      });

      logger.info('Password changed successfully', { userId });
      return true;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error changing password', error);
      throw AppError.internalError('Failed to change password');
    }
  }

  /**
   * 获取用户统计信息
   * @returns {Promise<Object>} 统计信息
   */
  async getUserStatistics() {
    try {
      const stats = {
        total: await this.userRepository.count(),
        active: await this.userRepository.count({ is_active: true }),
        inactive: await this.userRepository.count({ is_active: false }),
        byRole: await this.userRepository.countByRole()
      };

      return stats;
    } catch (error) {
      logger.error('Error getting user statistics', error);
      throw AppError.internalError('Failed to get user statistics');
    }
  }

  /**
   * 验证用户数据
   * @private
   * @param {Object} userData - 用户数据
   * @returns {ValidationError|null} 验证错误或null
   */
  _validateUserData(userData) {
    const errors = {};

    // 验证必填字段
    if (!userData.name || stringUtils.isEmpty(userData.name)) {
      errors.name = 'Name is required';
    }

    if (!userData.email || stringUtils.isEmpty(userData.email)) {
      errors.email = 'Email is required';
    } else if (!stringUtils.isValidEmail(userData.email)) {
      errors.email = 'Invalid email format';
    }

    if (!userData.password) {
      errors.password = 'Password is required';
    } else {
      const passwordError = this._validatePassword(userData.password);
      if (passwordError) {
        errors.password = passwordError.message;
      }
    }

    if (Object.keys(errors).length > 0) {
      return ValidationError('Validation failed', errors);
    }

    return null;
  }

  /**
   * 验证更新数据
   * @private
   * @param {Object} updateData - 更新数据
   * @returns {ValidationError|null} 验证错误或null
   */
  _validateUpdateData(updateData) {
    const errors = {};

    if (updateData.name && stringUtils.isEmpty(updateData.name)) {
      errors.name = 'Name cannot be empty';
    }

    if (updateData.email) {
      if (stringUtils.isEmpty(updateData.email)) {
        errors.email = 'Email cannot be empty';
      } else if (!stringUtils.isValidEmail(updateData.email)) {
        errors.email = 'Invalid email format';
      }
    }

    if (updateData.password) {
      const passwordError = this._validatePassword(updateData.password);
      if (passwordError) {
        errors.password = passwordError.message;
      }
    }

    if (Object.keys(errors).length > 0) {
      return ValidationError('Validation failed', errors);
    }

    return null;
  }

  /**
   * 验证密码强度
   * @private
   * @param {string} password - 密码
   * @returns {ValidationError|null} 验证错误或null
   */
  _validatePassword(password) {
    if (password.length < 8) {
      return ValidationError('Password too short', { password: 'Password must be at least 8 characters long' });
    }

    if (!/[A-Z]/.test(password)) {
      return ValidationError('Password too weak', { password: 'Password must contain at least one uppercase letter' });
    }

    if (!/[a-z]/.test(password)) {
      return ValidationError('Password too weak', { password: 'Password must contain at least one lowercase letter' });
    }

    if (!/[0-9]/.test(password)) {
      return ValidationError('Password too weak', { password: 'Password must contain at least one number' });
    }

    return null;
  }

  /**
   * 格式化用户响应
   * @private
   * @param {Object} user - 用户对象
   * @returns {Object} 格式化后的用户信息
   */
  _formatUserResponse(user) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
      is_email_verified: user.is_email_verified || false,
      phone: user.phone,
      address: user.address,
      last_login: user.last_login,
      created_at: user.created_at,
      updated_at: user.updated_at
    };
  }
}

module.exports = UserService;