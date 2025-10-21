/**
 * 用户数据仓库
 * 负责用户数据的存取操作
 */

const logger = require('@core/utils/logger');
const BaseRepository = require('@core/data-access/repositories/BaseRepository');

class UserRepository extends BaseRepository {
  constructor() {
    super('users'); // 表名
  }
  
  /**
   * 通过用户名查找用户
   * @param {string} username - 用户名
   * @returns {Promise<Object|null>} 用户对象或null
   */
  async findByUsername(username) {
    try {
      // 在实际项目中，这里应该调用数据库查询
      // 这里使用模拟数据进行演示
      return this.getMockUserByField('username', username);
    } catch (error) {
      logger.error('通过用户名查找用户失败:', error);
      throw error;
    }
  }
  
  /**
   * 通过邮箱查找用户
   * @param {string} email - 邮箱
   * @returns {Promise<Object|null>} 用户对象或null
   */
  async findByEmail(email) {
    try {
      // 在实际项目中，这里应该调用数据库查询
      return this.getMockUserByField('email', email);
    } catch (error) {
      logger.error('通过邮箱查找用户失败:', error);
      throw error;
    }
  }
  
  /**
   * 通过ID查找用户
   * @param {string} id - 用户ID
   * @returns {Promise<Object|null>} 用户对象或null
   */
  async findById(id) {
    try {
      // 在实际项目中，这里应该调用数据库查询
      return this.getMockUserByField('id', id);
    } catch (error) {
      logger.error('通过ID查找用户失败:', error);
      throw error;
    }
  }
  
  /**
   * 通过重置令牌查找用户
   * @param {string} resetToken - 重置令牌
   * @returns {Promise<Object|null>} 用户对象或null
   */
  async findByResetToken(resetToken) {
    try {
      // 在实际项目中，这里应该调用数据库查询
      return this.getMockUserByField('resetToken', resetToken);
    } catch (error) {
      logger.error('通过重置令牌查找用户失败:', error);
      throw error;
    }
  }
  
  /**
   * 创建新用户
   * @param {Object} userData - 用户数据
   * @returns {Promise<Object>} 创建的用户对象
   */
  async create(userData) {
    try {
      // 在实际项目中，这里应该调用数据库插入
      logger.info('创建新用户:', { id: userData.id, username: userData.username });
      
      // 存储到模拟数据库
      this.addMockUser(userData);
      
      return userData;
    } catch (error) {
      logger.error('创建用户失败:', error);
      throw error;
    }
  }
  
  /**
   * 更新用户信息
   * @param {string} id - 用户ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<Object|null>} 更新后的用户对象或null
   */
  async update(id, updateData) {
    try {
      // 在实际项目中，这里应该调用数据库更新
      logger.info('更新用户信息:', { id, updateData });
      
      // 更新模拟数据
      const user = this.getMockUserByField('id', id);
      if (user) {
        const updatedUser = { ...user, ...updateData };
        this.updateMockUser(id, updatedUser);
        return updatedUser;
      }
      
      return null;
    } catch (error) {
      logger.error('更新用户信息失败:', error);
      throw error;
    }
  }
  
  /**
   * 更新用户最后登录时间
   * @param {string} id - 用户ID
   * @returns {Promise<void>}
   */
  async updateLastLogin(id) {
    try {
      await this.update(id, {
        lastLoginAt: new Date().toISOString()
      });
    } catch (error) {
      logger.error('更新最后登录时间失败:', error);
      throw error;
    }
  }
  
  /**
   * 保存密码重置令牌
   * @param {string} id - 用户ID
   * @param {string} resetToken - 重置令牌
   * @param {Date} expiresAt - 过期时间
   * @returns {Promise<void>}
   */
  async saveResetToken(id, resetToken, expiresAt) {
    try {
      await this.update(id, {
        resetToken,
        resetTokenExpires: expiresAt
      });
    } catch (error) {
      logger.error('保存重置令牌失败:', error);
      throw error;
    }
  }
  
  /**
   * 删除用户
   * @param {string} id - 用户ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  async delete(id) {
    try {
      // 在实际项目中，这里应该调用数据库删除
      logger.info('删除用户:', { id });
      
      // 从模拟数据库中删除
      return this.deleteMockUser(id);
    } catch (error) {
      logger.error('删除用户失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取用户列表（带分页）
   * @param {Object} query - 查询参数
   * @param {number} page - 页码
   * @param {number} limit - 每页数量
   * @returns {Promise<Object>} 用户列表和分页信息
   */
  async getUsers(query = {}, page = 1, limit = 10) {
    try {
      // 在实际项目中，这里应该调用数据库查询
      logger.info('获取用户列表:', { query, page, limit });
      
      // 返回模拟数据
      return {
        users: this.getMockUsers(query),
        pagination: {
          page,
          limit,
          total: this.getMockUsersCount(query),
          pages: Math.ceil(this.getMockUsersCount(query) / limit)
        }
      };
    } catch (error) {
      logger.error('获取用户列表失败:', error);
      throw error;
    }
  }
  
  // 模拟数据存储
  mockUsers = [];
  
  /**
   * 添加模拟用户
   * @param {Object} user - 用户对象
   */
  addMockUser(user) {
    this.mockUsers.push(user);
  }
  
  /**
   * 更新模拟用户
   * @param {string} id - 用户ID
   * @param {Object} user - 用户对象
   */
  updateMockUser(id, user) {
    const index = this.mockUsers.findIndex(u => u.id === id);
    if (index !== -1) {
      this.mockUsers[index] = user;
    }
  }
  
  /**
   * 删除模拟用户
   * @param {string} id - 用户ID
   * @returns {boolean} 是否删除成功
   */
  deleteMockUser(id) {
    const initialLength = this.mockUsers.length;
    this.mockUsers = this.mockUsers.filter(u => u.id !== id);
    return this.mockUsers.length < initialLength;
  }
  
  /**
   * 通过字段获取模拟用户
   * @param {string} field - 字段名
   * @param {any} value - 字段值
   * @returns {Object|null} 用户对象或null
   */
  getMockUserByField(field, value) {
    return this.mockUsers.find(user => user[field] === value) || null;
  }
  
  /**
   * 获取符合条件的模拟用户列表
   * @param {Object} query - 查询条件
   * @returns {Array} 用户列表
   */
  getMockUsers(query = {}) {
    return this.mockUsers.filter(user => {
      for (const [key, value] of Object.entries(query)) {
        if (user[key] !== value) {
          return false;
        }
      }
      return true;
    });
  }
  
  /**
   * 获取符合条件的模拟用户数量
   * @param {Object} query - 查询条件
   * @returns {number} 用户数量
   */
  getMockUsersCount(query = {}) {
    return this.getMockUsers(query).length;
  }
}

module.exports = new UserRepository();