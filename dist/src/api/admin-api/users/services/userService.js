/**
 * 用户管理服务
 * 处理用户相关的业务逻辑
 */

const di = require('../../../core/di/container');
const userRepository = di.resolve('userRepository') || require('../repositories/userRepository');
const logger = di.resolve('logger');
const cacheService = di.resolve('cacheService');
const passwordHelper = di.resolve('passwordHelper');
const jwtHelper = di.resolve('jwtHelper');

class UserService {
  /**
   * 获取用户列表
   * @param {Object} query - 查询参数
   * @returns {Promise<Object>} 用户列表
   */
  async getUserList(query) {
    try {
      // 构建缓存键
      const cacheKey = `user_list:${JSON.stringify(query)}`;
      
      // 尝试从缓存获取
      const cachedData = await cacheService.get(cacheKey);
      if (cachedData) {
        return cachedData;
      }
      
      // 从仓库获取数据
      const result = await userRepository.getUserList(query);
      
      // 缓存结果
      await cacheService.set(cacheKey, result, 300); // 缓存5分钟
      
      logger.info('获取用户列表成功', { page: query.page, limit: query.limit });
      return result;
    } catch (error) {
      logger.error('获取用户列表失败', { error: error.message });
      throw error;
    }
  }
  
  /**
   * 获取用户详情
   * @param {string} userId - 用户ID
   * @returns {Promise<Object|null>} 用户信息
   */
  async getUserDetail(userId) {
    try {
      const cacheKey = `user_detail:${userId}`;
      
      // 尝试从缓存获取
      const cachedUser = await cacheService.get(cacheKey);
      if (cachedUser) {
        return cachedUser;
      }
      
      // 从仓库获取
      const user = await userRepository.getUserById(userId);
      
      if (user) {
        // 移除敏感信息
        delete user.password;
        delete user.passwordHash;
        
        // 缓存结果
        await cacheService.set(cacheKey, user, 600); // 缓存10分钟
      }
      
      logger.info('获取用户详情成功', { userId });
      return user;
    } catch (error) {
      logger.error('获取用户详情失败', { userId, error: error.message });
      throw error;
    }
  }
  
  /**
   * 创建用户
   * @param {Object} userData - 用户数据
   * @returns {Promise<Object>} 创建的用户
   */
  async createUser(userData) {
    try {
      // 验证用户名是否已存在
      const existingUser = await userRepository.getUserByUsername(userData.username);
      if (existingUser) {
        throw new Error('用户名已存在');
      }
      
      // 验证邮箱是否已存在
      if (userData.email) {
        const emailUser = await userRepository.getUserByEmail(userData.email);
        if (emailUser) {
          throw new Error('邮箱已被注册');
        }
      }
      
      // 生成密码哈希
      const passwordHash = await passwordHelper.hashPassword(userData.password);
      
      // 准备用户数据
      const user = {
        ...userData,
        passwordHash,
        password: undefined, // 移除明文密码
        status: userData.status || 'active',
        role: userData.role || 'user',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // 创建用户
      const createdUser = await userRepository.createUser(user);
      
      // 移除敏感信息
      delete createdUser.passwordHash;
      
      // 清除相关缓存
      await cacheService.clearPattern('user_list:*');
      
      logger.info('创建用户成功', { userId: createdUser.id, username: createdUser.username });
      return createdUser;
    } catch (error) {
      logger.error('创建用户失败', { userData, error: error.message });
      throw error;
    }
  }
  
  /**
   * 更新用户
   * @param {string} userId - 用户ID
   * @param {Object} userData - 用户数据
   * @returns {Promise<Object|null>} 更新后的用户
   */
  async updateUser(userId, userData) {
    try {
      // 检查用户是否存在
      const existingUser = await userRepository.getUserById(userId);
      if (!existingUser) {
        return null;
      }
      
      // 验证用户名是否被其他用户使用
      if (userData.username && userData.username !== existingUser.username) {
        const usernameUser = await userRepository.getUserByUsername(userData.username);
        if (usernameUser && usernameUser.id !== userId) {
          throw new Error('用户名已存在');
        }
      }
      
      // 验证邮箱是否被其他用户使用
      if (userData.email && userData.email !== existingUser.email) {
        const emailUser = await userRepository.getUserByEmail(userData.email);
        if (emailUser && emailUser.id !== userId) {
          throw new Error('邮箱已被注册');
        }
      }
      
      // 准备更新数据
      const updateData = {
        ...userData,
        updatedAt: new Date()
      };
      
      // 如果包含密码，则哈希处理
      if (updateData.password) {
        updateData.passwordHash = await passwordHelper.hashPassword(updateData.password);
        delete updateData.password;
      }
      
      // 更新用户
      const updatedUser = await userRepository.updateUser(userId, updateData);
      
      if (updatedUser) {
        // 移除敏感信息
        delete updatedUser.passwordHash;
        
        // 清除缓存
        await cacheService.delete(`user_detail:${userId}`);
        await cacheService.clearPattern('user_list:*');
      }
      
      logger.info('更新用户成功', { userId });
      return updatedUser;
    } catch (error) {
      logger.error('更新用户失败', { userId, userData, error: error.message });
      throw error;
    }
  }
  
  /**
   * 删除用户
   * @param {string} userId - 用户ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  async deleteUser(userId) {
    try {
      // 检查用户是否存在
      const user = await userRepository.getUserById(userId);
      if (!user) {
        return false;
      }
      
      // 删除用户
      const result = await userRepository.deleteUser(userId);
      
      if (result) {
        // 清除缓存
        await cacheService.delete(`user_detail:${userId}`);
        await cacheService.clearPattern('user_list:*');
      }
      
      logger.info('删除用户成功', { userId, username: user.username });
      return result;
    } catch (error) {
      logger.error('删除用户失败', { userId, error: error.message });
      throw error;
    }
  }
  
  /**
   * 批量删除用户
   * @param {Array<string>} userIds - 用户ID数组
   * @returns {Promise<number>} 删除的用户数量
   */
  async batchDeleteUsers(userIds) {
    try {
      // 批量删除用户
      const deletedCount = await userRepository.batchDeleteUsers(userIds);
      
      // 清除相关缓存
      for (const userId of userIds) {
        await cacheService.delete(`user_detail:${userId}`);
      }
      await cacheService.clearPattern('user_list:*');
      
      logger.info('批量删除用户成功', { count: deletedCount });
      return deletedCount;
    } catch (error) {
      logger.error('批量删除用户失败', { userIds, error: error.message });
      throw error;
    }
  }
  
  /**
   * 更新用户状态
   * @param {string} userId - 用户ID
   * @param {string} status - 状态
   * @returns {Promise<Object|null>} 更新后的用户
   */
  async updateUserStatus(userId, status) {
    try {
      const updateData = { status, updatedAt: new Date() };
      
      const updatedUser = await userRepository.updateUser(userId, updateData);
      
      if (updatedUser) {
        // 清除缓存
        await cacheService.delete(`user_detail:${userId}`);
        await cacheService.clearPattern('user_list:*');
        
        // 移除敏感信息
        delete updatedUser.passwordHash;
      }
      
      logger.info('更新用户状态成功', { userId, status });
      return updatedUser;
    } catch (error) {
      logger.error('更新用户状态失败', { userId, status, error: error.message });
      throw error;
    }
  }
  
  /**
   * 重置用户密码
   * @param {string} userId - 用户ID
   * @param {string} newPassword - 新密码
   * @returns {Promise<boolean>} 是否重置成功
   */
  async resetUserPassword(userId, newPassword) {
    try {
      // 检查用户是否存在
      const user = await userRepository.getUserById(userId);
      if (!user) {
        return false;
      }
      
      // 哈希新密码
      const passwordHash = await passwordHelper.hashPassword(newPassword);
      
      // 更新密码
      await userRepository.updateUser(userId, {
        passwordHash,
        updatedAt: new Date()
      });
      
      // 清除缓存
      await cacheService.delete(`user_detail:${userId}`);
      
      logger.info('重置用户密码成功', { userId });
      return true;
    } catch (error) {
      logger.error('重置用户密码失败', { userId, error: error.message });
      throw error;
    }
  }
  
  /**
   * 获取用户操作日志
   * @param {string} userId - 用户ID
   * @param {Object} query - 查询参数
   * @returns {Promise<Object>} 日志列表
   */
  async getUserLogs(userId, query) {
    try {
      const logs = await userRepository.getUserLogs(userId, query);
      
      logger.info('获取用户操作日志成功', { userId, page: query.page });
      return logs;
    } catch (error) {
      logger.error('获取用户操作日志失败', { userId, error: error.message });
      throw error;
    }
  }
  
  /**
   * 获取用户统计信息
   * @returns {Promise<Object>} 统计信息
   */
  async getUserStatistics() {
    try {
      const cacheKey = 'user_statistics';
      
      // 尝试从缓存获取
      const cachedStats = await cacheService.get(cacheKey);
      if (cachedStats) {
        return cachedStats;
      }
      
      // 获取统计信息
      const statistics = await userRepository.getUserStatistics();
      
      // 缓存结果
      await cacheService.set(cacheKey, statistics, 300); // 缓存5分钟
      
      logger.info('获取用户统计信息成功');
      return statistics;
    } catch (error) {
      logger.error('获取用户统计信息失败', { error: error.message });
      throw error;
    }
  }
}

module.exports = new UserService();