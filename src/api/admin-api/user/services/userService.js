const userRepository = require('../repositories/userRepository');
const logger = require('../../../../utils/logger');

/**
 * 用户服务层
 */
class UserService {
  /**
   * 获取用户列表
   * @param {Object} query - 查询条件
   * @param {Object} pagination - 分页参数
   * @returns {Promise<Object>} 用户列表和总数
   */
  async getUsers(query, pagination) {
    try {
      logger.info('服务层获取用户列表', { query, pagination });
      
      // 调用仓库层获取用户列表
      const users = await userRepository.findUsers(query, pagination);
      
      // 获取总数
      const total = await userRepository.countUsers(query);
      
      return { users, total };
    } catch (error) {
      logger.error('服务层获取用户列表失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 获取用户详情
   * @param {string} userId - 用户ID
   * @returns {Promise<Object>} 用户详情
   */
  async getUserDetail(userId) {
    try {
      logger.info('服务层获取用户详情', { userId });
      
      const user = await userRepository.findUserDetail(userId);
      
      if (!user) {
        logger.warn('用户不存在', { userId });
        return null;
      }
      
      return user;
    } catch (error) {
      logger.error('服务层获取用户详情失败', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * 添加用户
   * @param {Object} userData - 用户数据
   * @returns {Promise<Object>} 新创建的用户
   */
  async addUser(userData) {
    try {
      logger.info('服务层添加用户', { userData });
      
      // 验证必要字段
      if (!userData.username && !userData.phone && !userData.email) {
        throw new Error('用户名、手机号或邮箱至少填写一项');
      }
      
      // 生成用户ID
      const totalUsers = await userRepository.countUsers({});
      const newId = `U${String(totalUsers + 1).padStart(10, '0')}`;
      
      // 生成OpenID（如果没有提供）
      const openid = userData.openid || `o${String(Date.now()).padEnd(20, '0')}`;
      
      // 创建用户对象
      const newUser = {
        id: newId,
        username: userData.username || '',
        avatar: 'https://picsum.photos/40/40',
        email: userData.email || '',
        phone: userData.phone || '',
        openid,
        status: userData.status || 1,
        role: userData.role || 'buyer',
        membership: userData.membership || '普通会员',
        createdAt: new Date().toLocaleString('zh-CN'),
        lastLogin: new Date().toLocaleString('zh-CN')
      };
      
      // 调用仓库层添加用户
      const result = await userRepository.addUser(newUser);
      
      return result;
    } catch (error) {
      logger.error('服务层添加用户失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 更新用户状态
   * @param {string} userId - 用户ID
   * @param {number} status - 新状态
   * @returns {Promise<Object|null>} 更新后的用户
   */
  async updateUserStatus(userId, status) {
    try {
      logger.info('服务层更新用户状态', { userId, status });
      
      // 验证用户是否存在
      const user = await userRepository.findUserDetail(userId);
      if (!user) {
        logger.warn('用户不存在', { userId });
        return null;
      }
      
      // 调用仓库层更新状态
      const result = await userRepository.updateUserStatus(userId, status);
      
      return result;
    } catch (error) {
      logger.error('服务层更新用户状态失败', { userId, status, error: error.message });
      throw error;
    }
  }

  /**
   * 删除用户
   * @param {string} userId - 用户ID
   * @returns {Promise<boolean>} 删除结果
   */
  async deleteUser(userId) {
    try {
      logger.info('服务层删除用户', { userId });
      
      // 验证用户是否存在
      const user = await userRepository.findUserDetail(userId);
      if (!user) {
        logger.warn('用户不存在', { userId });
        return null;
      }
      
      // 调用仓库层删除用户
      const result = await userRepository.deleteUser(userId);
      
      return result;
    } catch (error) {
      logger.error('服务层删除用户失败', { userId, error: error.message });
      throw error;
    }
  }
}

module.exports = new UserService();