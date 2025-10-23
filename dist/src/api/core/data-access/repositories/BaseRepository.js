/**
 * 仓库基类
 * 实现通用的数据操作方法，提供统一的数据访问接口
 */

const database = require('../database');
const logger = require('../../utils/logger');

/**
 * 仓库基类
 */
class BaseRepository {
  /**
   * 构造函数
   * @param {string} tableName - 表名
   * @param {string} primaryKey - 主键名，默认为'id'
   */
  constructor(tableName, primaryKey = 'id') {
    if (!tableName) {
      throw new Error('仓库必须指定表名');
    }
    
    this.tableName = tableName;
    this.primaryKey = primaryKey;
  }

  /**
   * 获取数据库连接
   * @returns {Promise<Object>} 数据库连接
   */
  async getConnection() {
    return await database.getConnection();
  }

  /**
   * 查询单个记录
   * @param {Object} conditions - 查询条件
   * @param {Array<string>} fields - 要查询的字段
   * @returns {Promise<Object|null>} 查询结果
   */
  async findOne(conditions = {}, fields = ['*']) {
    try {
      const connection = await this.getConnection();
      const [results] = await connection.query(
        `SELECT ${fields.join(', ')} FROM ?? WHERE ?`,
        [this.tableName, conditions]
      );
      
      return results[0] || null;
    } catch (error) {
      logger.error(`[${this.constructor.name}] 查询单个记录失败: ${error.message}`, { error, conditions });
      throw error;
    }
  }

  /**
   * 根据ID查询记录
   * @param {*} id - 记录ID
   * @param {Array<string>} fields - 要查询的字段
   * @returns {Promise<Object|null>} 查询结果
   */
  async findById(id, fields = ['*']) {
    const conditions = {};
    conditions[this.primaryKey] = id;
    return await this.findOne(conditions, fields);
  }

  /**
   * 查询多个记录
   * @param {Object} conditions - 查询条件
   * @param {Object} options - 查询选项
   * @param {Array<string>} options.fields - 要查询的字段
   * @param {Array<Array<string>>} options.orderBy - 排序条件，格式：[['field', 'ASC|DESC']]
   * @param {number} options.limit - 限制返回数量
   * @param {number} options.offset - 偏移量
   * @returns {Promise<Array>} 查询结果
   */
  async findAll(conditions = {}, options = {}) {
    try {
      const { fields = ['*'], orderBy = [], limit, offset } = options;
      let query = `SELECT ${fields.join(', ')} FROM ??`;
      const params = [this.tableName];
      
      if (Object.keys(conditions).length > 0) {
        query += ' WHERE ?';
        params.push(conditions);
      }
      
      if (orderBy && orderBy.length > 0) {
        const orderClauses = orderBy.map(([field, direction]) => 
          `${field} ${direction || 'ASC'}`
        ).join(', ');
        query += ` ORDER BY ${orderClauses}`;
      }
      
      if (limit !== undefined) {
        query += ' LIMIT ?';
        params.push(limit);
        
        if (offset !== undefined) {
          query += ' OFFSET ?';
          params.push(offset);
        }
      }
      
      const connection = await this.getConnection();
      const [results] = await connection.query(query, params);
      
      return results;
    } catch (error) {
      logger.error(`[${this.constructor.name}] 查询多个记录失败: ${error.message}`, { error, conditions, options });
      throw error;
    }
  }

  /**
   * 分页查询
   * @param {Object} conditions - 查询条件
   * @param {Object} options - 查询选项
   * @param {number} options.page - 页码，从1开始
   * @param {number} options.pageSize - 每页数量
   * @param {Array<string>} options.fields - 要查询的字段
   * @param {Array<Array<string>>} options.orderBy - 排序条件
   * @returns {Promise<Object>} 包含数据和分页信息的对象
   */
  async findWithPagination(conditions = {}, options = {}) {
    const { page = 1, pageSize = 10, fields = ['*'], orderBy = [[this.primaryKey, 'DESC']] } = options;
    const offset = (page - 1) * pageSize;
    
    // 查询数据
    const data = await this.findAll(conditions, {
      fields,
      orderBy,
      limit: pageSize,
      offset
    });
    
    // 查询总数
    const total = await this.count(conditions);
    
    return {
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  }

  /**
   * 统计记录数
   * @param {Object} conditions - 查询条件
   * @returns {Promise<number>} 记录数
   */
  async count(conditions = {}) {
    try {
      const connection = await this.getConnection();
      let query = 'SELECT COUNT(*) as count FROM ??';
      const params = [this.tableName];
      
      if (Object.keys(conditions).length > 0) {
        query += ' WHERE ?';
        params.push(conditions);
      }
      
      const [results] = await connection.query(query, params);
      
      return results[0].count;
    } catch (error) {
      logger.error(`[${this.constructor.name}] 统计记录数失败: ${error.message}`, { error, conditions });
      throw error;
    }
  }

  /**
   * 创建记录
   * @param {Object} data - 要插入的数据
   * @returns {Promise<Object>} 创建的记录
   */
  async create(data) {
    try {
      const connection = await this.getConnection();
      const [result] = await connection.query(
        'INSERT INTO ?? SET ?',
        [this.tableName, data]
      );
      
      // 如果有自动生成的ID，返回完整记录
      if (result.insertId) {
        return await this.findById(result.insertId);
      }
      
      return data;
    } catch (error) {
      logger.error(`[${this.constructor.name}] 创建记录失败: ${error.message}`, { error, data });
      throw error;
    }
  }

  /**
   * 批量创建记录
   * @param {Array<Object>} dataList - 要插入的数据列表
   * @returns {Promise<number>} 插入的记录数
   */
  async bulkCreate(dataList) {
    try {
      if (!dataList || dataList.length === 0) {
        return 0;
      }
      
      const connection = await this.getConnection();
      const [result] = await connection.query(
        'INSERT INTO ?? VALUES ?',
        [this.tableName, dataList]
      );
      
      return result.affectedRows;
    } catch (error) {
      logger.error(`[${this.constructor.name}] 批量创建记录失败: ${error.message}`, { error, dataList });
      throw error;
    }
  }

  /**
   * 更新记录
   * @param {Object} conditions - 更新条件
   * @param {Object} data - 要更新的数据
   * @returns {Promise<number>} 更新的记录数
   */
  async update(conditions, data) {
    try {
      const connection = await this.getConnection();
      const [result] = await connection.query(
        'UPDATE ?? SET ? WHERE ?',
        [this.tableName, data, conditions]
      );
      
      return result.affectedRows;
    } catch (error) {
      logger.error(`[${this.constructor.name}] 更新记录失败: ${error.message}`, { error, conditions, data });
      throw error;
    }
  }

  /**
   * 根据ID更新记录
   * @param {*} id - 记录ID
   * @param {Object} data - 要更新的数据
   * @returns {Promise<number>} 更新的记录数
   */
  async updateById(id, data) {
    const conditions = {};
    conditions[this.primaryKey] = id;
    return await this.update(conditions, data);
  }

  /**
   * 删除记录
   * @param {Object} conditions - 删除条件
   * @returns {Promise<number>} 删除的记录数
   */
  async delete(conditions) {
    try {
      const connection = await this.getConnection();
      const [result] = await connection.query(
        'DELETE FROM ?? WHERE ?',
        [this.tableName, conditions]
      );
      
      return result.affectedRows;
    } catch (error) {
      logger.error(`[${this.constructor.name}] 删除记录失败: ${error.message}`, { error, conditions });
      throw error;
    }
  }

  /**
   * 根据ID删除记录
   * @param {*} id - 记录ID
   * @returns {Promise<number>} 删除的记录数
   */
  async deleteById(id) {
    const conditions = {};
    conditions[this.primaryKey] = id;
    return await this.delete(conditions);
  }

  /**
   * 执行原始SQL查询
   * @param {string} sql - SQL语句
   * @param {Array} params - 参数列表
   * @returns {Promise<any>} 查询结果
   */
  async execute(sql, params = []) {
    try {
      const connection = await this.getConnection();
      const [results] = await connection.query(sql, params);
      return results;
    } catch (error) {
      logger.error(`[${this.constructor.name}] 执行SQL失败: ${error.message}`, { error, sql, params });
      throw error;
    }
  }

  /**
   * 执行事务
   * @param {Function} callback - 事务回调函数
   * @returns {Promise<any>} 事务执行结果
   */
  async transaction(callback) {
    const connection = await this.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // 执行回调，传入连接
      const result = await callback(connection);
      
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      logger.error(`[${this.constructor.name}] 事务执行失败: ${error.message}`, { error });
      throw error;
    } finally {
      // 释放连接
      connection.release();
    }
  }
}

module.exports = BaseRepository;