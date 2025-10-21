/**
 * 用户仓库
 * 展示如何扩展BaseRepository实现具体的数据访问逻辑
 */

const BaseRepository = require('./BaseRepository');
const logger = require('../../utils/logger');

/**
 * 用户仓库类
 */
class UserRepository extends BaseRepository {
  /**
   * 构造函数
   */
  constructor() {
    // 指定表名为'users'，主键为'id'
    super('users', 'id');
  }

  /**
   * 根据用户名查找用户
   * @param {string} username - 用户名
   * @returns {Promise<Object|null>} 用户信息
   */
  async findByUsername(username) {
    return await this.findOne({ username });
  }

  /**
   * 根据邮箱查找用户
   * @param {string} email - 邮箱地址
   * @returns {Promise<Object|null>} 用户信息
   */
  async findByEmail(email) {
    return await this.findOne({ email });
  }

  /**
   * 根据角色查找用户列表
   * @param {string} role - 用户角色
   * @param {Object} options - 查询选项
   * @returns {Promise<Array>} 用户列表
   */
  async findByRole(role, options = {}) {
    return await this.findAll({ role }, options);
  }

  /**
   * 创建用户
   * @param {Object} userData - 用户数据
   * @returns {Promise<Object>} 创建的用户信息
   */
  async createUser(userData) {
    try {
      // 添加创建时间和更新时间
      const now = new Date();
      const userToCreate = {
        ...userData,
        created_at: now,
        updated_at: now
      };
      
      return await this.create(userToCreate);
    } catch (error) {
      logger.error('创建用户失败:', error);
      throw error;
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
      // 添加更新时间
      const updateDataWithTimestamp = {
        ...updateData,
        updated_at: new Date()
      };
      
      const affectedRows = await this.updateById(userId, updateDataWithTimestamp);
      
      if (affectedRows === 0) {
        throw new Error(`用户ID ${userId} 不存在`);
      }
      
      return await this.findById(userId);
    } catch (error) {
      logger.error(`更新用户 ${userId} 失败:`, error);
      throw error;
    }
  }

  /**
   * 分页获取用户列表
   * @param {Object} filters - 过滤条件
   * @param {Object} pagination - 分页参数
   * @returns {Promise<Object>} 分页数据
   */
  async getUsersWithPagination(filters = {}, pagination = {}) {
    const { role, status, keyword } = filters;
    const { page = 1, pageSize = 10 } = pagination;
    
    // 构建查询条件
    const conditions = {};
    
    if (role) {
      conditions.role = role;
    }
    
    if (status !== undefined) {
      conditions.status = status;
    }
    
    // 如果有关键字搜索，需要使用模糊查询
    if (keyword) {
      // 这里会使用事务进行自定义查询
      return await this.executeCustomSearch(keyword, conditions, page, pageSize);
    }
    
    // 基本分页查询
    return await this.findWithPagination(conditions, {
      page,
      pageSize,
      orderBy: [['created_at', 'DESC']],
      fields: ['id', 'username', 'email', 'role', 'status', 'created_at']
    });
  }

  /**
   * 执行自定义搜索（使用事务和复杂查询）
   * @param {string} keyword - 搜索关键字
   * @param {Object} baseConditions - 基础查询条件
   * @param {number} page - 页码
   * @param {number} pageSize - 每页数量
   * @returns {Promise<Object>} 查询结果
   */
  async executeCustomSearch(keyword, baseConditions, page, pageSize) {
    const offset = (page - 1) * pageSize;
    
    return await this.transaction(async (connection) => {
      // 构建复杂查询条件
      let queryConditions = Object.keys(baseConditions).map(key => 
        `${key} = ?`
      ).join(' AND ');
      
      const params = [...Object.values(baseConditions)];
      
      // 添加关键字搜索条件
      if (keyword) {
        if (queryConditions) {
          queryConditions += ' AND ';
        }
        queryConditions += '(username LIKE ? OR email LIKE ? OR name LIKE ?)';
        params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
      }
      
      // 查询数据
      const query = `
        SELECT id, username, email, role, status, created_at 
        FROM ?? 
        ${queryConditions ? 'WHERE ' + queryConditions : ''}
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      `;
      
      const queryParams = [this.tableName, ...params, pageSize, offset];
      const [results] = await connection.query(query, queryParams);
      
      // 查询总数
      const countQuery = `
        SELECT COUNT(*) as count 
        FROM ?? 
        ${queryConditions ? 'WHERE ' + queryConditions : ''}
      `;
      
      const countParams = [this.tableName, ...params];
      const [countResults] = await connection.query(countQuery, countParams);
      
      const total = countResults[0].count;
      
      return {
        data: results,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      };
    });
  }

  /**
   * 批量更新用户状态
   * @param {Array<number>} userIds - 用户ID数组
   * @param {string} status - 新状态
   * @returns {Promise<number>} 更新的用户数量
   */
  async bulkUpdateStatus(userIds, status) {
    try {
      const connection = await this.getConnection();
      const [result] = await connection.query(
        'UPDATE ?? SET status = ?, updated_at = ? WHERE id IN (?)',
        [this.tableName, status, new Date(), userIds]
      );
      
      return result.affectedRows;
    } catch (error) {
      logger.error('批量更新用户状态失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户统计信息
   * @returns {Promise<Object>} 统计数据
   */
  async getStatistics() {
    try {
      const connection = await this.getConnection();
      const [results] = await connection.query(
        `SELECT 
          role, 
          status, 
          COUNT(*) as count, 
          DATE(created_at) as date 
        FROM ?? 
        GROUP BY role, status, DATE(created_at) 
        ORDER BY date DESC`,
        [this.tableName]
      );
      
      // 处理统计结果
      const statistics = {
        byRole: {},
        byStatus: {},
        total: 0
      };
      
      results.forEach(row => {
        // 按角色统计
        if (!statistics.byRole[row.role]) {
          statistics.byRole[row.role] = 0;
        }
        statistics.byRole[row.role] += row.count;
        
        // 按状态统计
        if (!statistics.byStatus[row.status]) {
          statistics.byStatus[row.status] = 0;
        }
        statistics.byStatus[row.status] += row.count;
        
        // 总计
        statistics.total += row.count;
      });
      
      return statistics;
    } catch (error) {
      logger.error('获取用户统计信息失败:', error);
      throw error;
    }
  }
}

module.exports = UserRepository;