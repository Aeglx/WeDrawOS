const logger = require('../../../../utils/logger');

/**
 * 生成模拟用户数据
 * @returns {Array} 用户数据数组
 */
function generateMockUsers() {
  const users = [];
  const usernames = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十'];
  const roles = ['buyer', 'seller'];
  const memberships = ['普通会员', '高级会员', 'VIP'];
  
  for (let i = 1; i <= 50; i++) {
    users.push({
      id: `U${String(i).padStart(10, '0')}`,
      username: `${usernames[i % usernames.length]}${i}`,
      avatar: 'https://picsum.photos/40/40',
      email: `user${i}@example.com`,
      phone: `138${String(i).padStart(8, '0')}`,
      openid: `o${String(i).padStart(20, '0')}`,
      status: Math.random() > 0.2 ? 1 : 0, // 80%启用，20%禁用
      role: roles[Math.floor(Math.random() * roles.length)],
      membership: memberships[Math.floor(Math.random() * memberships.length)],
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toLocaleString('zh-CN'),
      lastLogin: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleString('zh-CN')
    });
  }
  
  return users;
}

// 模拟数据库 - 存储用户数据
let mockUsers = generateMockUsers();

/**
 * 用户仓库层
 */
class UserRepository {
  /**
   * 查找用户列表
   * @param {Object} query - 查询条件
   * @param {Object} pagination - 分页参数
   * @returns {Promise<Array>} 用户列表
   */
  async findUsers(query, pagination) {
    try {
      logger.info('仓库层查找用户列表', { query, pagination });
      
      let filteredUsers = [...mockUsers];
      
      // 应用查询条件
      if (query.id) {
        filteredUsers = filteredUsers.filter(user => user.id.includes(query.id));
      }
      if (query.username) {
        filteredUsers = filteredUsers.filter(user => user.username.includes(query.username));
      }
      if (query.email) {
        filteredUsers = filteredUsers.filter(user => user.email.includes(query.email));
      }
      if (query.phone) {
        filteredUsers = filteredUsers.filter(user => user.phone.includes(query.phone));
      }
      if (query.openid) {
        filteredUsers = filteredUsers.filter(user => user.openid.includes(query.openid));
      }
      if (query.status !== undefined) {
        filteredUsers = filteredUsers.filter(user => user.status === query.status);
      }
      if (query.role) {
        filteredUsers = filteredUsers.filter(user => user.role === query.role);
      }
      if (query.membership) {
        filteredUsers = filteredUsers.filter(user => user.membership === query.membership);
      }
      
      // 应用分页
      const startIndex = (pagination.page - 1) * pagination.pageSize;
      const endIndex = startIndex + pagination.pageSize;
      const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
      
      return paginatedUsers;
    } catch (error) {
      logger.error('仓库层查找用户列表失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 统计用户数量
   * @param {Object} query - 查询条件
   * @returns {Promise<number>} 用户总数
   */
  async countUsers(query) {
    try {
      logger.info('仓库层统计用户数量', { query });
      
      let filteredUsers = [...mockUsers];
      
      // 应用查询条件
      if (query.id) {
        filteredUsers = filteredUsers.filter(user => user.id.includes(query.id));
      }
      if (query.username) {
        filteredUsers = filteredUsers.filter(user => user.username.includes(query.username));
      }
      if (query.email) {
        filteredUsers = filteredUsers.filter(user => user.email.includes(query.email));
      }
      if (query.phone) {
        filteredUsers = filteredUsers.filter(user => user.phone.includes(query.phone));
      }
      if (query.openid) {
        filteredUsers = filteredUsers.filter(user => user.openid.includes(query.openid));
      }
      if (query.status !== undefined) {
        filteredUsers = filteredUsers.filter(user => user.status === query.status);
      }
      if (query.role) {
        filteredUsers = filteredUsers.filter(user => user.role === query.role);
      }
      if (query.membership) {
        filteredUsers = filteredUsers.filter(user => user.membership === query.membership);
      }
      
      return filteredUsers.length;
    } catch (error) {
      logger.error('仓库层统计用户数量失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 查找用户详情
   * @param {string} userId - 用户ID
   * @returns {Promise<Object|null>} 用户详情
   */
  async findUserDetail(userId) {
    try {
      logger.info('仓库层查找用户详情', { userId });
      
      const user = mockUsers.find(user => user.id === userId);
      return user || null;
    } catch (error) {
      logger.error('仓库层查找用户详情失败', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * 添加用户
   * @param {Object} userData - 用户数据
   * @returns {Promise<Object>} 新添加的用户
   */
  async addUser(userData) {
    try {
      logger.info('仓库层添加用户', { userData });
      
      mockUsers.push(userData);
      
      return userData;
    } catch (error) {
      logger.error('仓库层添加用户失败', { error: error.message });
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
      logger.info('仓库层更新用户状态', { userId, status });
      
      const userIndex = mockUsers.findIndex(user => user.id === userId);
      
      if (userIndex === -1) {
        return null;
      }
      
      mockUsers[userIndex].status = status;
      
      return mockUsers[userIndex];
    } catch (error) {
      logger.error('仓库层更新用户状态失败', { userId, status, error: error.message });
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
      logger.info('仓库层删除用户', { userId });
      
      const initialLength = mockUsers.length;
      mockUsers = mockUsers.filter(user => user.id !== userId);
      
      // 如果数组长度减少了，说明删除成功
      return mockUsers.length < initialLength;
    } catch (error) {
      logger.error('仓库层删除用户失败', { userId, error: error.message });
      throw error;
    }
  }
}

module.exports = new UserRepository();