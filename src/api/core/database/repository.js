/**
 * 数据仓库基类
 * 提供基础的CRUD操作和查询构建功能
 */

const database = require('./database');
const { AppError } = require('../exception/handlers/errorHandler');
const logger = require('../utils/logger');

class Repository {
  /**
   * 构造函数
   * @param {string} tableName - 表名
   */
  constructor(tableName) {
    if (!tableName || typeof tableName !== 'string') {
      throw new AppError('表名必须是有效的字符串', 500, 'INVALID_TABLE_NAME');
    }
    
    this.tableName = tableName;
    this.db = database;
  }

  /**
   * 通用查询方法
   * @param {Object} options - 查询选项
   */
  async query(options = {}) {
    try {
      const { 
        fields = '*',
        where = {},
        orderBy = [],
        limit = null,
        offset = 0,
        groupBy = [],
        having = {},
        joins = []
      } = options;

      // 构建SQL查询
      let sql = 'SELECT ';
      const params = [];

      // 处理字段
      sql += Array.isArray(fields) ? fields.join(', ') : fields;

      // 处理表名
      sql += ` FROM ${this.tableName}`;

      // 处理连接
      if (joins && joins.length > 0) {
        joins.forEach(join => {
          const { type = 'INNER', table, on, alias } = join;
          const tableRef = alias ? `${table} AS ${alias}` : table;
          sql += ` ${type} JOIN ${tableRef} ON ${on}`;
        });
      }

      // 处理WHERE条件
      if (Object.keys(where).length > 0) {
        sql += ' WHERE';
        const whereClauses = [];
        
        Object.entries(where).forEach(([key, value]) => {
          if (value === null || value === undefined) {
            whereClauses.push(`${key} IS NULL`);
          } else if (Array.isArray(value)) {
            whereClauses.push(`${key} IN (?)`);
            params.push(value);
          } else if (typeof value === 'object') {
            // 处理操作符
            Object.entries(value).forEach(([operator, val]) => {
              const op = this._getOperator(operator);
              whereClauses.push(`${key} ${op} ?`);
              params.push(val);
            });
          } else {
            whereClauses.push(`${key} = ?`);
            params.push(value);
          }
        });
        
        sql += ' ' + whereClauses.join(' AND ');
      }

      // 处理GROUP BY
      if (groupBy && groupBy.length > 0) {
        sql += ' GROUP BY ' + groupBy.join(', ');
      }

      // 处理HAVING
      if (Object.keys(having).length > 0) {
        sql += ' HAVING';
        const havingClauses = [];
        
        Object.entries(having).forEach(([key, value]) => {
          if (typeof value === 'object' && value !== null) {
            Object.entries(value).forEach(([operator, val]) => {
              const op = this._getOperator(operator);
              havingClauses.push(`${key} ${op} ?`);
              params.push(val);
            });
          } else {
            havingClauses.push(`${key} = ?`);
            params.push(value);
          }
        });
        
        sql += ' ' + havingClauses.join(' AND ');
      }

      // 处理ORDER BY
      if (orderBy && orderBy.length > 0) {
        sql += ' ORDER BY';
        orderBy.forEach((order, index) => {
          if (index > 0) sql += ',';
          if (typeof order === 'object') {
            const { field, direction = 'ASC' } = order;
            sql += ` ${field} ${direction}`;
          } else {
            sql += ` ${order}`;
          }
        });
      }

      // 处理LIMIT和OFFSET
      if (limit !== null) {
        sql += ' LIMIT ?';
        params.push(limit);
        
        if (offset > 0) {
          sql += ' OFFSET ?';
          params.push(offset);
        }
      }

      // 执行查询
      const { results } = await this.db.query(sql, params);
      return results;
    } catch (error) {
      logger.error(`[Repository] 查询失败 [${this.tableName}]:`, { error });
      throw error;
    }
  }

  /**
   * 根据ID查找记录
   * @param {*} id - 记录ID
   * @param {Array|string} fields - 要查询的字段
   */
  async findById(id, fields = '*') {
    try {
      const results = await this.query({
        fields,
        where: { id }
      });
      
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      logger.error(`[Repository] 根据ID查找失败 [${this.tableName}]:`, { error, id });
      throw error;
    }
  }

  /**
   * 查找所有记录
   * @param {Object} options - 查询选项
   */
  async findAll(options = {}) {
    return this.query(options);
  }

  /**
   * 根据条件查找单个记录
   * @param {Object} where - WHERE条件
   * @param {Array|string} fields - 要查询的字段
   */
  async findOne(where, fields = '*') {
    try {
      const results = await this.query({
        fields,
        where,
        limit: 1
      });
      
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      logger.error(`[Repository] 查找单个记录失败 [${this.tableName}]:`, { error, where });
      throw error;
    }
  }

  /**
   * 创建记录
   * @param {Object} data - 要插入的数据
   */
  async create(data) {
    try {
      if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
        throw new AppError('插入数据不能为空', 400, 'EMPTY_DATA');
      }

      const fields = Object.keys(data);
      const placeholders = fields.map(() => '?');
      const values = fields.map(field => data[field]);

      const sql = `INSERT INTO ${this.tableName} (${fields.join(', ')}) VALUES (${placeholders.join(', ')})`;
      
      const { results } = await this.db.query(sql, values);
      
      // 返回创建的记录ID
      return { insertId: results.insertId };
    } catch (error) {
      logger.error(`[Repository] 创建记录失败 [${this.tableName}]:`, { error });
      throw error;
    }
  }

  /**
   * 批量创建记录
   * @param {Array} dataArray - 要插入的数据数组
   */
  async bulkCreate(dataArray) {
    try {
      if (!Array.isArray(dataArray) || dataArray.length === 0) {
        throw new AppError('批量插入数据不能为空', 400, 'EMPTY_DATA_ARRAY');
      }

      const fields = Object.keys(dataArray[0]);
      const sql = `INSERT INTO ${this.tableName} (${fields.join(', ')}) VALUES ?`;
      
      // 准备批量数据
      const values = dataArray.map(item => 
        fields.map(field => item[field])
      );
      
      // 使用数据库的批量执行方法
      return await this.db.bulkExecute(sql, values);
    } catch (error) {
      logger.error(`[Repository] 批量创建记录失败 [${this.tableName}]:`, { error });
      throw error;
    }
  }

  /**
   * 更新记录
   * @param {Object} where - WHERE条件
   * @param {Object} data - 要更新的数据
   */
  async update(where, data) {
    try {
      if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
        throw new AppError('更新数据不能为空', 400, 'EMPTY_UPDATE_DATA');
      }

      if (!where || typeof where !== 'object' || Object.keys(where).length === 0) {
        throw new AppError('更新条件不能为空', 400, 'EMPTY_UPDATE_WHERE');
      }

      // 构建SET子句
      const setClauses = [];
      const params = [];
      
      Object.entries(data).forEach(([field, value]) => {
        if (value === null || value === undefined) {
          setClauses.push(`${field} = NULL`);
        } else {
          setClauses.push(`${field} = ?`);
          params.push(value);
        }
      });

      // 构建WHERE子句
      const whereClauses = [];
      Object.entries(where).forEach(([field, value]) => {
        if (value === null || value === undefined) {
          whereClauses.push(`${field} IS NULL`);
        } else if (Array.isArray(value)) {
          whereClauses.push(`${field} IN (?)`);
          params.push(value);
        } else {
          whereClauses.push(`${field} = ?`);
          params.push(value);
        }
      });

      const sql = `UPDATE ${this.tableName} SET ${setClauses.join(', ')} WHERE ${whereClauses.join(' AND ')}`;
      
      const { results } = await this.db.query(sql, params);
      return { affectedRows: results.affectedRows };
    } catch (error) {
      logger.error(`[Repository] 更新记录失败 [${this.tableName}]:`, { error, where });
      throw error;
    }
  }

  /**
   * 根据ID更新记录
   * @param {*} id - 记录ID
   * @param {Object} data - 要更新的数据
   */
  async updateById(id, data) {
    return this.update({ id }, data);
  }

  /**
   * 删除记录
   * @param {Object} where - WHERE条件
   */
  async delete(where) {
    try {
      if (!where || typeof where !== 'object' || Object.keys(where).length === 0) {
        throw new AppError('删除条件不能为空', 400, 'EMPTY_DELETE_WHERE');
      }

      // 构建WHERE子句
      const whereClauses = [];
      const params = [];
      
      Object.entries(where).forEach(([field, value]) => {
        if (value === null || value === undefined) {
          whereClauses.push(`${field} IS NULL`);
        } else if (Array.isArray(value)) {
          whereClauses.push(`${field} IN (?)`);
          params.push(value);
        } else {
          whereClauses.push(`${field} = ?`);
          params.push(value);
        }
      });

      const sql = `DELETE FROM ${this.tableName} WHERE ${whereClauses.join(' AND ')}`;
      
      const { results } = await this.db.query(sql, params);
      return { affectedRows: results.affectedRows };
    } catch (error) {
      logger.error(`[Repository] 删除记录失败 [${this.tableName}]:`, { error, where });
      throw error;
    }
  }

  /**
   * 根据ID删除记录
   * @param {*} id - 记录ID
   */
  async deleteById(id) {
    return this.delete({ id });
  }

  /**
   * 统计记录数量
   * @param {Object} where - WHERE条件
   */
  async count(where = {}) {
    try {
      const results = await this.query({
        fields: 'COUNT(*) as count',
        where
      });
      
      return results[0].count;
    } catch (error) {
      logger.error(`[Repository] 统计记录失败 [${this.tableName}]:`, { error, where });
      throw error;
    }
  }

  /**
   * 分页查询
   * @param {Object} options - 查询选项
   */
  async paginate(options = {}) {
    const { page = 1, pageSize = 10, ...queryOptions } = options;
    
    // 计算偏移量
    const offset = (page - 1) * pageSize;
    
    // 获取总记录数
    const total = await this.count(queryOptions.where);
    
    // 获取分页数据
    const data = await this.query({
      ...queryOptions,
      limit: pageSize,
      offset
    });
    
    // 计算总页数
    const totalPages = Math.ceil(total / pageSize);
    
    return {
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }

  /**
   * 获取唯一值列表
   * @param {string} field - 字段名
   * @param {Object} where - WHERE条件
   */
  async distinct(field, where = {}) {
    try {
      const results = await this.query({
        fields: `DISTINCT ${field}`,
        where
      });
      
      return results.map(row => row[field]);
    } catch (error) {
      logger.error(`[Repository] 获取唯一值失败 [${this.tableName}]:`, { error, field });
      throw error;
    }
  }

  /**
   * 执行自定义SQL
   * @param {string} sql - SQL语句
   * @param {Array|Object} params - 参数
   */
  async execute(sql, params = []) {
    try {
      return await this.db.query(sql, params);
    } catch (error) {
      logger.error(`[Repository] 执行自定义SQL失败 [${this.tableName}]:`, { error });
      throw error;
    }
  }

  /**
   * 执行事务
   * @param {Function} callback - 事务回调
   */
  async transaction(callback) {
    return this.db.transaction(callback);
  }

  /**
   * 获取操作符映射
   * @private
   */
  _getOperator(operator) {
    const operators = {
      'eq': '=',
      'neq': '!=',
      'gt': '>',
      'gte': '>=',
      'lt': '<',
      'lte': '<=',
      'like': 'LIKE',
      'notLike': 'NOT LIKE',
      'in': 'IN',
      'notIn': 'NOT IN',
      'isNull': 'IS NULL',
      'isNotNull': 'IS NOT NULL'
    };
    
    return operators[operator.toLowerCase()] || '=';
  }

  /**
   * 检查记录是否存在
   * @param {Object} where - WHERE条件
   */
  async exists(where) {
    const count = await this.count(where);
    return count > 0;
  }

  /**
   * 根据ID检查记录是否存在
   * @param {*} id - 记录ID
   */
  async existsById(id) {
    return this.exists({ id });
  }

  /**
   * 获取表名
   */
  getTableName() {
    return this.tableName;
  }
}

module.exports = Repository;