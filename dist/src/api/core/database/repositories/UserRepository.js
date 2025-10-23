/**
 * 用户数据仓库
 * 负责用户相关的数据操作
 */

const Repository = require('../repository');
const { AppError } = require('../../exception/handlers/errorHandler');
const logger = require('../../utils/logger');

class UserRepository extends Repository {
  constructor() {
    // 调用父类构造函数，指定表名
    super('users');
  }

  /**
   * 根据用户名查找用户
   * @param {string} username - 用户名
   */
  async findByUsername(username) {
    try {
      return await this.findOne({ username });
    } catch (error) {
      logger.error('根据用户名查找用户失败:', { error, username });
      throw error;
    }
  }

  /**
   * 根据邮箱查找用户
   * @param {string} email - 邮箱
   */
  async findByEmail(email) {
    try {
      return await this.findOne({ email });
    } catch (error) {
      logger.error('根据邮箱查找用户失败:', { error, email });
      throw error;
    }
  }

  /**
   * 根据手机号查找用户
   * @param {string} phone - 手机号
   */
  async findByPhone(phone) {
    try {
      return await this.findOne({ phone });
    } catch (error) {
      logger.error('根据手机号查找用户失败:', { error, phone });
      throw error;
    }
  }

  /**
   * 检查用户名是否已存在
   * @param {string} username - 用户名
   * @param {*} excludeId - 排除的用户ID
   */
  async isUsernameExists(username, excludeId = null) {
    const where = { username };
    if (excludeId) {
      where.id = { neq: excludeId };
    }
    return await this.exists(where);
  }

  /**
   * 检查邮箱是否已存在
   * @param {string} email - 邮箱
   * @param {*} excludeId - 排除的用户ID
   */
  async isEmailExists(email, excludeId = null) {
    const where = { email };
    if (excludeId) {
      where.id = { neq: excludeId };
    }
    return await this.exists(where);
  }

  /**
   * 检查手机号是否已存在
   * @param {string} phone - 手机号
   * @param {*} excludeId - 排除的用户ID
   */
  async isPhoneExists(phone, excludeId = null) {
    const where = { phone };
    if (excludeId) {
      where.id = { neq: excludeId };
    }
    return await this.exists(where);
  }

  /**
   * 创建新用户
   * @param {Object} userData - 用户数据
   */
  async createUser(userData) {
    try {
      // 验证必填字段
      const requiredFields = ['username', 'password', 'email'];
      const missingFields = requiredFields.filter(field => !userData[field]);
      
      if (missingFields.length > 0) {
        throw new AppError(`缺少必填字段: ${missingFields.join(', ')}`, 400, 'MISSING_REQUIRED_FIELDS');
      }

      // 检查唯一性
      if (await this.isUsernameExists(userData.username)) {
        throw new AppError('用户名已存在', 400, 'USERNAME_EXISTS');
      }

      if (await this.isEmailExists(userData.email)) {
        throw new AppError('邮箱已被注册', 400, 'EMAIL_EXISTS');
      }

      if (userData.phone && await this.isPhoneExists(userData.phone)) {
        throw new AppError('手机号已被注册', 400, 'PHONE_EXISTS');
      }

      // 设置默认值
      const defaultData = {
        status: 'active',
        role: 'user',
        created_at: new Date(),
        updated_at: new Date()
      };

      const data = { ...defaultData, ...userData };
      
      const result = await this.create(data);
      
      // 返回创建的用户信息
      return await this.findById(result.insertId);
    } catch (error) {
      logger.error('创建用户失败:', { error });
      throw error;
    }
  }

  /**
   * 更新用户信息
   * @param {*} userId - 用户ID
   * @param {Object} userData - 要更新的用户数据
   */
  async updateUser(userId, userData) {
    try {
      // 检查用户是否存在
      const existingUser = await this.findById(userId);
      if (!existingUser) {
        throw new AppError('用户不存在', 404, 'USER_NOT_FOUND');
      }

      // 检查字段唯一性
      if (userData.username && userData.username !== existingUser.username) {
        if (await this.isUsernameExists(userData.username, userId)) {
          throw new AppError('用户名已存在', 400, 'USERNAME_EXISTS');
        }
      }

      if (userData.email && userData.email !== existingUser.email) {
        if (await this.isEmailExists(userData.email, userId)) {
          throw new AppError('邮箱已被注册', 400, 'EMAIL_EXISTS');
        }
      }

      if (userData.phone && userData.phone !== existingUser.phone) {
        if (await this.isPhoneExists(userData.phone, userId)) {
          throw new AppError('手机号已被注册', 400, 'PHONE_EXISTS');
        }
      }

      // 更新时间
      userData.updated_at = new Date();

      // 执行更新
      const result = await this.updateById(userId, userData);
      
      // 返回更新后的用户信息
      return await this.findById(userId);
    } catch (error) {
      logger.error('更新用户失败:', { error, userId });
      throw error;
    }
  }

  /**
   * 更新用户密码
   * @param {*} userId - 用户ID
   * @param {string} newPassword - 新密码（已加密）
   */
  async updatePassword(userId, newPassword) {
    try {
      return await this.updateById(userId, {
        password: newPassword,
        updated_at: new Date(),
        password_updated_at: new Date()
      });
    } catch (error) {
      logger.error('更新用户密码失败:', { error, userId });
      throw error;
    }
  }

  /**
   * 更新用户状态
   * @param {*} userId - 用户ID
   * @param {string} status - 状态值
   */
  async updateStatus(userId, status) {
    try {
      const validStatuses = ['active', 'inactive', 'suspended', 'deleted'];
      if (!validStatuses.includes(status)) {
        throw new AppError(`无效的用户状态: ${status}`, 400, 'INVALID_STATUS');
      }

      return await this.updateById(userId, {
        status,
        updated_at: new Date()
      });
    } catch (error) {
      logger.error('更新用户状态失败:', { error, userId, status });
      throw error;
    }
  }

  /**
   * 查找活跃用户
   * @param {Object} options - 查询选项
   */
  async findActiveUsers(options = {}) {
    return await this.query({
      ...options,
      where: {
        ...options.where,
        status: 'active'
      }
    });
  }

  /**
   * 根据角色查找用户
   * @param {string} role - 角色
   * @param {Object} options - 查询选项
   */
  async findByRole(role, options = {}) {
    return await this.query({
      ...options,
      where: {
        ...options.where,
        role
      }
    });
  }

  /**
   * 分页查询用户列表
   * @param {Object} options - 分页选项
   */
  async paginateUsers(options = {}) {
    return await this.paginate({
      ...options,
      orderBy: options.orderBy || [{ field: 'created_at', direction: 'DESC' }]
    });
  }

  /**
   * 批量删除用户
   * @param {Array} userIds - 用户ID数组
   */
  async bulkDeleteUsers(userIds) {
    try {
      if (!Array.isArray(userIds) || userIds.length === 0) {
        throw new AppError('用户ID数组不能为空', 400, 'EMPTY_USER_IDS');
      }

      return await this.delete({ id: userIds });
    } catch (error) {
      logger.error('批量删除用户失败:', { error });
      throw error;
    }
  }

  /**
   * 软删除用户（更新状态为deleted）
   * @param {*} userId - 用户ID
   */
  async softDeleteUser(userId) {
    return await this.updateStatus(userId, 'deleted');
  }

  /**
   * 恢复软删除的用户
   * @param {*} userId - 用户ID
   */
  async restoreUser(userId) {
    return await this.updateStatus(userId, 'active');
  }

  /**
   * 获取用户统计信息
   */
  async getUserStatistics() {
    try {
      // 获取不同状态的用户数量
      const activeCount = await this.count({ status: 'active' });
      const inactiveCount = await this.count({ status: 'inactive' });
      const suspendedCount = await this.count({ status: 'suspended' });
      const deletedCount = await this.count({ status: 'deleted' });

      // 获取不同角色的用户数量
      const results = await this.execute(
        'SELECT role, COUNT(*) as count FROM users GROUP BY role'
      );

      const roleStats = results.results.reduce((acc, row) => {
        acc[row.role] = row.count;
        return acc;
      }, {});

      // 获取最近注册的用户数（例如：今天、本周）
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const todayCount = await this.count({ created_at: { gte: today } });
      const weekCount = await this.count({ created_at: { gte: weekAgo } });

      return {
        total: activeCount + inactiveCount + suspendedCount,
        byStatus: {
          active: activeCount,
          inactive: inactiveCount,
          suspended: suspendedCount,
          deleted: deletedCount
        },
        byRole: roleStats,
        recent: {
          today: todayCount,
          week: weekCount
        }
      };
    } catch (error) {
      logger.error('获取用户统计信息失败:', { error });
      throw error;
    }
  }

  /**
   * 搜索用户
   * @param {string} keyword - 搜索关键词
   * @param {Object} options - 查询选项
   */
  async searchUsers(keyword, options = {}) {
    try {
      if (!keyword || keyword.trim() === '') {
        return this.paginateUsers(options);
      }

      const searchPattern = `%${keyword}%`;
      
      return await this.paginate({
        ...options,
        where: {
          ...options.where,
          $or: [
            { username: { like: searchPattern } },
            { email: { like: searchPattern } },
            { phone: { like: searchPattern } },
            { name: { like: searchPattern } }
          ]
        }
      });
    } catch (error) {
      logger.error('搜索用户失败:', { error, keyword });
      throw error;
    }
  }

  /**
   * 查找用户的详细信息（包括关联表）
   * @param {*} userId - 用户ID
   */
  async findUserWithDetails(userId) {
    try {
      // 这里可以根据实际的数据库设计，查询用户的详细信息
      // 例如：用户资料、角色、权限等
      const sql = `
        SELECT 
          u.*
        FROM 
          users u
        WHERE 
          u.id = ?
      `;

      const { results } = await this.execute(sql, [userId]);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      logger.error('查找用户详细信息失败:', { error, userId });
      throw error;
    }
  }

  /**
   * 更新用户最后登录时间
   * @param {*} userId - 用户ID
   */
  async updateLastLogin(userId) {
    try {
      return await this.updateById(userId, {
        last_login_at: new Date(),
        updated_at: new Date()
      });
    } catch (error) {
      logger.error('更新用户最后登录时间失败:', { error, userId });
      // 这里不抛出错误，因为登录时间更新失败不应该影响登录流程
      return null;
    }
  }

  /**
   * 增加用户登录次数
   * @param {*} userId - 用户ID
   */
  async incrementLoginCount(userId) {
    try {
      const sql = `
        UPDATE users 
        SET login_count = COALESCE(login_count, 0) + 1,
            updated_at = ? 
        WHERE id = ?
      `;
      
      await this.execute(sql, [new Date(), userId]);
      return true;
    } catch (error) {
      logger.error('增加用户登录次数失败:', { error, userId });
      // 这里不抛出错误，因为登录次数更新失败不应该影响登录流程
      return false;
    }
  }
}

module.exports = UserRepository;