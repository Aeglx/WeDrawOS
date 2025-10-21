/**
 * 用户管理数据仓库
 * 处理用户相关的数据操作
 */

const di = require('../../../core/di/container');
const BaseRepository = require('../../../core/repositories/baseRepository');
const logger = di.resolve('logger');

// 模拟用户数据存储
let users = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@example.com',
    passwordHash: '$2b$10$eD9SfVQ1YvUQ4qW7XZ8X9eK6L5M4N3O2P1Q0R9T8S7U6V5W4E3',
    role: 'admin',
    status: 'active',
    nickname: '系统管理员',
    avatar: '',
    phone: '13800138000',
    lastLoginAt: new Date(),
    loginCount: 123,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date()
  },
  {
    id: '2',
    username: 'editor',
    email: 'editor@example.com',
    passwordHash: '$2b$10$eD9SfVQ1YvUQ4qW7XZ8X9eK6L5M4N3O2P1Q0R9T8S7U6V5W4E3',
    role: 'editor',
    status: 'active',
    nickname: '内容编辑',
    avatar: '',
    phone: '13900139000',
    lastLoginAt: new Date(),
    loginCount: 89,
    createdAt: new Date('2023-01-05'),
    updatedAt: new Date()
  },
  {
    id: '3',
    username: 'user1',
    email: 'user1@example.com',
    passwordHash: '$2b$10$eD9SfVQ1YvUQ4qW7XZ8X9eK6L5M4N3O2P1Q0R9T8S7U6V5W4E3',
    role: 'user',
    status: 'active',
    nickname: '普通用户1',
    avatar: '',
    phone: '13700137000',
    lastLoginAt: new Date(),
    loginCount: 45,
    createdAt: new Date('2023-02-10'),
    updatedAt: new Date()
  }
];

// 模拟用户操作日志
let userLogs = [];

class UserRepository extends BaseRepository {
  constructor() {
    super();
    logger.info('用户管理数据仓库初始化');
    this.initializeMockLogs();
  }
  
  /**
   * 获取用户列表
   * @param {Object} query - 查询参数
   * @returns {Promise<Object>} 用户列表
   */
  async getUserList(query) {
    try {
      const { page, limit, keyword, role, status, startDate, endDate } = query;
      
      // 过滤用户
      let filteredUsers = [...users];
      
      if (keyword) {
        const lowerKeyword = keyword.toLowerCase();
        filteredUsers = filteredUsers.filter(user => 
          user.username.toLowerCase().includes(lowerKeyword) ||
          user.email.toLowerCase().includes(lowerKeyword) ||
          user.nickname.toLowerCase().includes(lowerKeyword) ||
          user.phone.includes(keyword)
        );
      }
      
      if (role) {
        filteredUsers = filteredUsers.filter(user => user.role === role);
      }
      
      if (status) {
        filteredUsers = filteredUsers.filter(user => user.status === status);
      }
      
      if (startDate) {
        const start = new Date(startDate);
        filteredUsers = filteredUsers.filter(user => new Date(user.createdAt) >= start);
      }
      
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filteredUsers = filteredUsers.filter(user => new Date(user.createdAt) <= end);
      }
      
      // 排序（创建时间倒序）
      filteredUsers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      // 分页
      const total = filteredUsers.length;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
      
      // 移除敏感信息
      const safeUsers = paginatedUsers.map(user => {
        const safeUser = { ...user };
        delete safeUser.passwordHash;
        return safeUser;
      });
      
      return {
        items: safeUsers,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error('获取用户列表失败', { error: error.message });
      throw error;
    }
  }
  
  /**
   * 根据ID获取用户
   * @param {string} userId - 用户ID
   * @returns {Promise<Object|null>} 用户信息
   */
  async getUserById(userId) {
    try {
      const user = users.find(u => u.id === userId);
      return user ? { ...user } : null;
    } catch (error) {
      logger.error('根据ID获取用户失败', { userId, error: error.message });
      throw error;
    }
  }
  
  /**
   * 根据用户名获取用户
   * @param {string} username - 用户名
   * @returns {Promise<Object|null>} 用户信息
   */
  async getUserByUsername(username) {
    try {
      const user = users.find(u => u.username === username);
      return user ? { ...user } : null;
    } catch (error) {
      logger.error('根据用户名获取用户失败', { username, error: error.message });
      throw error;
    }
  }
  
  /**
   * 根据邮箱获取用户
   * @param {string} email - 邮箱
   * @returns {Promise<Object|null>} 用户信息
   */
  async getUserByEmail(email) {
    try {
      const user = users.find(u => u.email === email);
      return user ? { ...user } : null;
    } catch (error) {
      logger.error('根据邮箱获取用户失败', { email, error: error.message });
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
      const newUser = {
        id: Date.now().toString(),
        ...userData
      };
      
      users.push(newUser);
      
      // 记录操作日志
      await this.addUserLog(newUser.id, 'create', '创建用户');
      
      logger.info('创建用户成功', { userId: newUser.id, username: newUser.username });
      return { ...newUser };
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
      const userIndex = users.findIndex(u => u.id === userId);
      
      if (userIndex === -1) {
        return null;
      }
      
      users[userIndex] = {
        ...users[userIndex],
        ...userData
      };
      
      // 记录操作日志
      await this.addUserLog(userId, 'update', '更新用户信息');
      
      logger.info('更新用户成功', { userId });
      return { ...users[userIndex] };
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
      const userIndex = users.findIndex(u => u.id === userId);
      
      if (userIndex === -1) {
        return false;
      }
      
      users.splice(userIndex, 1);
      
      // 记录操作日志
      await this.addUserLog(userId, 'delete', '删除用户');
      
      logger.info('删除用户成功', { userId });
      return true;
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
      const initialLength = users.length;
      
      // 过滤掉要删除的用户
      users = users.filter(user => !userIds.includes(user.id));
      
      const deletedCount = initialLength - users.length;
      
      // 记录批量删除日志
      await this.addUserLog('system', 'batch_delete', `批量删除用户 ${deletedCount} 个`);
      
      logger.info('批量删除用户成功', { deletedCount });
      return deletedCount;
    } catch (error) {
      logger.error('批量删除用户失败', { userIds, error: error.message });
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
      const { page, limit } = query;
      
      // 过滤指定用户的日志
      const filteredLogs = userLogs.filter(log => log.userId === userId);
      
      // 排序（时间倒序）
      filteredLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      // 分页
      const total = filteredLogs.length;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedLogs = filteredLogs.slice(startIndex, endIndex);
      
      return {
        items: paginatedLogs,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
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
      // 统计各角色用户数量
      const roleStats = users.reduce((stats, user) => {
        stats[user.role] = (stats[user.role] || 0) + 1;
        return stats;
      }, {});
      
      // 统计各状态用户数量
      const statusStats = users.reduce((stats, user) => {
        stats[user.status] = (stats[user.status] || 0) + 1;
        return stats;
      }, {});
      
      // 统计今日新增用户
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayUsers = users.filter(user => new Date(user.createdAt) >= today).length;
      
      // 统计本周新增用户
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekUsers = users.filter(user => new Date(user.createdAt) >= weekAgo).length;
      
      // 统计本月新增用户
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      const monthUsers = users.filter(user => new Date(user.createdAt) >= monthAgo).length;
      
      return {
        total: users.length,
        roleStats,
        statusStats,
        newUsers: {
          today: todayUsers,
          week: weekUsers,
          month: monthUsers
        },
        lastUpdated: new Date()
      };
    } catch (error) {
      logger.error('获取用户统计信息失败', { error: error.message });
      throw error;
    }
  }
  
  /**
   * 添加用户操作日志
   * @param {string} userId - 用户ID
   * @param {string} action - 操作类型
   * @param {string} description - 操作描述
   */
  async addUserLog(userId, action, description) {
    try {
      const log = {
        id: Date.now().toString(),
        userId,
        action,
        description,
        timestamp: new Date(),
        ip: '127.0.0.1' // 在实际应用中，这里应该从请求中获取
      };
      
      userLogs.push(log);
      
      // 保持日志数量在合理范围
      if (userLogs.length > 100000) {
        userLogs = userLogs.slice(-100000);
      }
    } catch (error) {
      logger.error('添加用户操作日志失败', { error: error.message });
      // 日志记录失败不影响主流程
    }
  }
  
  /**
   * 初始化模拟日志数据
   */
  initializeMockLogs() {
    const actions = ['login', 'logout', 'create', 'update', 'delete', 'view', 'search', 'export'];
    const descriptions = [
      '用户登录',
      '用户登出',
      '创建商品',
      '更新订单',
      '查看用户列表',
      '搜索商品',
      '导出数据'
    ];
    
    // 为每个用户生成一些操作日志
    for (const user of users) {
      for (let i = 0; i < 20; i++) {
        const randomDate = new Date();
        randomDate.setDate(randomDate.getDate() - Math.floor(Math.random() * 30));
        randomDate.setHours(Math.floor(Math.random() * 24));
        randomDate.setMinutes(Math.floor(Math.random() * 60));
        
        userLogs.push({
          id: `user_log_${Date.now()}_${i}`,
          userId: user.id,
          action: actions[Math.floor(Math.random() * actions.length)],
          description: descriptions[Math.floor(Math.random() * descriptions.length)],
          timestamp: randomDate,
          ip: `192.168.1.${Math.floor(Math.random() * 255) + 1}`
        });
      }
    }
    
    logger.info('用户操作日志模拟数据初始化完成', { count: userLogs.length });
  }
}

module.exports = new UserRepository();