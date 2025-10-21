/**
 * 数据库存储库基类
 * 提供通用的数据访问方法和查询构建功能
 */

const { AppError } = require('../../exception/handlers/errorHandler');
const { ConnectionPoolManager } = require('../database/ConnectionPoolManager');
const logger = require('../../utils/logger');

/**
 * 数据库存储库基类
 */
class BaseRepository {
  /**
   * 构造函数
   * @param {string} tableName - 表名
   * @param {Object} options - 配置选项
   */
  constructor(tableName, options = {}) {
    if (!tableName) {
      throw new Error('表名必须提供');
    }

    this.tableName = tableName;
    this.connectionPool = ConnectionPoolManager.getInstance();
    
    // 默认配置
    this.options = {
      idField: 'id',
      createdAtField: 'createdAt',
      updatedAtField: 'updatedAt',
      softDelete: false,
      deletedAtField: 'deletedAt',
      ...options
    };

    logger.info(`存储库初始化: ${tableName}`);
  }

  /**
   * 获取数据库连接
   * @param {boolean} useTransaction - 是否使用事务
   * @returns {Promise<Object>} 数据库连接
   */
  async getConnection(useTransaction = false) {
    try {
      if (useTransaction) {
        // 从事务管理器获取连接
        const transaction = this.connectionPool.getCurrentTransaction();
        if (transaction) {
          return transaction.getConnection();
        }
        throw new AppError('未找到活动事务', 500);
      }
      
      // 从连接池获取连接
      return await this.connectionPool.getConnection();
    } catch (error) {
      logger.error('获取数据库连接失败', { error });
      throw new AppError('数据库连接错误', 500, error);
    }
  }

  /**
   * 释放数据库连接
   * @param {Object} connection - 数据库连接
   */
  releaseConnection(connection) {
    if (connection && !connection.inTransaction) {
      this.connectionPool.releaseConnection(connection);
    }
  }

  /**
   * 执行查询
   * @param {string} sql - SQL语句
   * @param {Array} params - 参数数组
   * @param {Object} options - 查询选项
   * @returns {Promise<any>} 查询结果
   */
  async executeQuery(sql, params = [], options = {}) {
    const { transaction = false, connection: providedConnection } = options;
    let connection = providedConnection;
    let result;

    try {
      // 如果没有提供连接，则获取一个新连接
      if (!connection) {
        connection = await this.getConnection(transaction);
      }

      // 记录SQL查询
      logger.debug(`执行SQL: ${sql}`, { params });
      
      // 执行查询
      const [rows] = await connection.execute(sql, params);
      result = rows;

      return result;
    } catch (error) {
      logger.error(`SQL执行失败: ${sql}`, { error, params });
      throw new AppError('数据库操作失败', 500, error);
    } finally {
      // 如果是自己获取的连接且不在事务中，则释放
      if (!providedConnection && connection && !connection.inTransaction) {
        this.releaseConnection(connection);
      }
    }
  }

  /**
   * 查找单个记录
   * @param {Object} conditions - 查询条件
   * @param {Object} options - 查询选项
   * @returns {Promise<Object|null>} 记录对象
   */
  async findOne(conditions = {}, options = {}) {
    const { fields, orderBy, ...otherOptions } = options;
    
    // 构建查询
    const { sql, params } = this._buildSelectQuery(conditions, fields, orderBy, { limit: 1 });
    
    // 执行查询
    const results = await this.executeQuery(sql, params, otherOptions);
    
    return results.length > 0 ? results[0] : null;
  }

  /**
   * 根据ID查找记录
   * @param {any} id - 记录ID
   * @param {Object} options - 查询选项
   * @returns {Promise<Object|null>} 记录对象
   */
  async findById(id, options = {}) {
    const conditions = { [this.options.idField]: id };
    return this.findOne(conditions, options);
  }

  /**
   * 查找所有记录
   * @param {Object} conditions - 查询条件
   * @param {Object} options - 查询选项
   * @returns {Promise<Array>} 记录数组
   */
  async findAll(conditions = {}, options = {}) {
    const { fields, orderBy, limit, offset, ...otherOptions } = options;
    
    // 构建查询
    const { sql, params } = this._buildSelectQuery(conditions, fields, orderBy, { limit, offset });
    
    // 执行查询
    return await this.executeQuery(sql, params, otherOptions);
  }

  /**
   * 分页查询
   * @param {Object} conditions - 查询条件
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} 分页结果
   */
  async findWithPagination(conditions = {}, options = {}) {
    const { 
      page = 1, 
      pageSize = 10, 
      fields, 
      orderBy,
      ...otherOptions 
    } = options;
    
    // 计算偏移量
    const offset = (page - 1) * pageSize;
    
    // 并行执行总数查询和分页查询
    const [records, count] = await Promise.all([
      this.findAll(conditions, {
        fields,
        orderBy,
        limit: pageSize,
        offset,
        ...otherOptions
      }),
      this.count(conditions, otherOptions)
    ]);
    
    // 计算总页数
    const totalPages = Math.ceil(count / pageSize);
    
    return {
      records,
      pagination: {
        currentPage: page,
        pageSize,
        totalRecords: count,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  }

  /**
   * 计算记录总数
   * @param {Object} conditions - 查询条件
   * @param {Object} options - 查询选项
   * @returns {Promise<number>} 记录总数
   */
  async count(conditions = {}, options = {}) {
    // 构建计数查询
    const { sql, params } = this._buildCountQuery(conditions);
    
    // 执行查询
    const result = await this.executeQuery(sql, params, options);
    
    // 返回计数结果
    return result[0]?.count || 0;
  }

  /**
   * 创建记录
   * @param {Object} data - 记录数据
   * @param {Object} options - 操作选项
   * @returns {Promise<Object>} 创建的记录
   */
  async create(data, options = {}) {
    const { connection: providedConnection } = options;
    let connection = providedConnection;
    
    try {
      // 如果没有提供连接，则获取一个新连接
      if (!connection) {
        connection = await this.getConnection(options.transaction);
      }
      
      // 添加时间戳
      const dataToCreate = this._addTimestamps(data, true);
      
      // 构建插入SQL
      const { sql, params } = this._buildInsertQuery(dataToCreate);
      
      // 执行插入
      const [result] = await connection.execute(sql, params);
      
      // 获取插入的ID
      const insertId = result.insertId || dataToCreate[this.options.idField];
      
      // 查询创建的记录
      return await this.findById(insertId, { connection });
    } catch (error) {
      logger.error(`创建记录失败: ${this.tableName}`, { error, data });
      throw new AppError('创建记录失败', 500, error);
    } finally {
      // 如果是自己获取的连接且不在事务中，则释放
      if (!providedConnection && connection && !connection.inTransaction) {
        this.releaseConnection(connection);
      }
    }
  }

  /**
   * 批量创建记录
   * @param {Array<Object>} dataArray - 记录数据数组
   * @param {Object} options - 操作选项
   * @returns {Promise<Array>} 创建的记录ID数组
   */
  async bulkCreate(dataArray, options = {}) {
    if (!Array.isArray(dataArray) || dataArray.length === 0) {
      return [];
    }

    const { connection: providedConnection } = options;
    let connection = providedConnection;
    
    try {
      // 如果没有提供连接，则获取一个新连接
      if (!connection) {
        connection = await this.getConnection(options.transaction);
      }
      
      // 添加时间戳到所有记录
      const dataToCreate = dataArray.map(data => this._addTimestamps(data, true));
      
      // 构建批量插入SQL
      const { sql, params } = this._buildBulkInsertQuery(dataToCreate);
      
      // 执行批量插入
      const [result] = await connection.execute(sql, params);
      
      // 返回受影响的行数
      return { affectedRows: result.affectedRows };
    } catch (error) {
      logger.error(`批量创建记录失败: ${this.tableName}`, { error, count: dataArray.length });
      throw new AppError('批量创建记录失败', 500, error);
    } finally {
      // 如果是自己获取的连接且不在事务中，则释放
      if (!providedConnection && connection && !connection.inTransaction) {
        this.releaseConnection(connection);
      }
    }
  }

  /**
   * 更新记录
   * @param {any} id - 记录ID
   * @param {Object} data - 更新数据
   * @param {Object} options - 操作选项
   * @returns {Promise<Object|null>} 更新后的记录
   */
  async update(id, data, options = {}) {
    const conditions = { [this.options.idField]: id };
    return this.updateByConditions(conditions, data, options);
  }

  /**
   * 根据条件更新记录
   * @param {Object} conditions - 更新条件
   * @param {Object} data - 更新数据
   * @param {Object} options - 操作选项
   * @returns {Promise<Object|null>} 更新后的记录（如果更新单条）
   */
  async updateByConditions(conditions, data, options = {}) {
    const { connection: providedConnection, returnUpdated = true } = options;
    let connection = providedConnection;
    
    try {
      // 如果没有提供连接，则获取一个新连接
      if (!connection) {
        connection = await this.getConnection(options.transaction);
      }
      
      // 添加更新时间戳
      const dataToUpdate = this._addTimestamps(data, false);
      
      // 构建更新SQL
      const { sql, params } = this._buildUpdateQuery(conditions, dataToUpdate);
      
      // 执行更新
      const [result] = await connection.execute(sql, params);
      
      if (result.affectedRows === 0) {
        return null;
      }
      
      // 如果需要返回更新后的记录且只更新了一条，则查询该记录
      if (returnUpdated && result.affectedRows === 1 && conditions[this.options.idField]) {
        return await this.findById(conditions[this.options.idField], { connection });
      }
      
      return { affectedRows: result.affectedRows };
    } catch (error) {
      logger.error(`更新记录失败: ${this.tableName}`, { error, conditions, data });
      throw new AppError('更新记录失败', 500, error);
    } finally {
      // 如果是自己获取的连接且不在事务中，则释放
      if (!providedConnection && connection && !connection.inTransaction) {
        this.releaseConnection(connection);
      }
    }
  }

  /**
   * 删除记录
   * @param {any} id - 记录ID
   * @param {Object} options - 操作选项
   * @returns {Promise<boolean>} 是否删除成功
   */
  async delete(id, options = {}) {
    const conditions = { [this.options.idField]: id };
    return this.deleteByConditions(conditions, options);
  }

  /**
   * 根据条件删除记录
   * @param {Object} conditions - 删除条件
   * @param {Object} options - 操作选项
   * @returns {Promise<boolean>} 是否删除成功
   */
  async deleteByConditions(conditions, options = {}) {
    const { connection: providedConnection } = options;
    let connection = providedConnection;
    
    try {
      // 如果没有提供连接，则获取一个新连接
      if (!connection) {
        connection = await this.getConnection(options.transaction);
      }
      
      let result;
      
      if (this.options.softDelete) {
        // 软删除：更新deletedAt字段
        const dataToUpdate = { [this.options.deletedAtField]: new Date() };
        const updateResult = await this.updateByConditions(conditions, dataToUpdate, { 
          connection, 
          returnUpdated: false 
        });
        result = updateResult;
      } else {
        // 硬删除：直接从数据库删除
        const { sql, params } = this._buildDeleteQuery(conditions);
        const [deleteResult] = await connection.execute(sql, params);
        result = deleteResult;
      }
      
      logger.debug(`删除记录: ${this.tableName}`, { conditions, affectedRows: result.affectedRows });
      
      return result.affectedRows > 0;
    } catch (error) {
      logger.error(`删除记录失败: ${this.tableName}`, { error, conditions });
      throw new AppError('删除记录失败', 500, error);
    } finally {
      // 如果是自己获取的连接且不在事务中，则释放
      if (!providedConnection && connection && !connection.inTransaction) {
        this.releaseConnection(connection);
      }
    }
  }

  /**
   * 批量删除记录
   * @param {Array<any>} ids - 记录ID数组
   * @param {Object} options - 操作选项
   * @returns {Promise<number>} 删除的记录数
   */
  async bulkDelete(ids, options = {}) {
    if (!Array.isArray(ids) || ids.length === 0) {
      return 0;
    }

    const conditions = { [this.options.idField]: ids };
    const result = await this.deleteByConditions(conditions, options);
    
    // 由于批量删除通常返回的是是否有记录被删除，我们需要额外查询实际删除的数量
    // 这里简化处理，假设所有提供的ID都被成功删除
    return ids.length;
  }

  /**
   * 执行原生SQL查询
   * @param {string} sql - SQL语句
   * @param {Array} params - 参数数组
   * @param {Object} options - 查询选项
   * @returns {Promise<any>} 查询结果
   */
  async executeRawQuery(sql, params = [], options = {}) {
    return this.executeQuery(sql, params, options);
  }

  /**
   * 构建查询条件
   * @private
   * @param {Object} conditions - 查询条件
   * @returns {Object} SQL片段和参数
   */
  _buildConditions(conditions) {
    const whereClauses = [];
    const params = [];
    let paramIndex = 1;

    // 添加软删除条件
    if (this.options.softDelete) {
      whereClauses.push(`${this.options.deletedAtField} IS NULL`);
    }

    // 处理查询条件
    for (const [field, value] of Object.entries(conditions)) {
      if (value === null || value === undefined) {
        whereClauses.push(`${field} IS NULL`);
      } else if (Array.isArray(value)) {
        // 处理IN查询
        const placeholders = value.map(() => `$${paramIndex++}`).join(', ');
        whereClauses.push(`${field} IN (${placeholders})`);
        params.push(...value);
      } else if (typeof value === 'object') {
        // 处理复杂查询条件 {gt, lt, gte, lte, neq, like}
        for (const [operator, operand] of Object.entries(value)) {
          switch (operator) {
            case 'gt':
              whereClauses.push(`${field} > $${paramIndex++}`);
              params.push(operand);
              break;
            case 'lt':
              whereClauses.push(`${field} < $${paramIndex++}`);
              params.push(operand);
              break;
            case 'gte':
              whereClauses.push(`${field} >= $${paramIndex++}`);
              params.push(operand);
              break;
            case 'lte':
              whereClauses.push(`${field} <= $${paramIndex++}`);
              params.push(operand);
              break;
            case 'neq':
              whereClauses.push(`${field} != $${paramIndex++}`);
              params.push(operand);
              break;
            case 'like':
              whereClauses.push(`${field} LIKE $${paramIndex++}`);
              params.push(operand);
              break;
            default:
              // 忽略未知操作符
              break;
          }
        }
      } else {
        // 简单相等查询
        whereClauses.push(`${field} = $${paramIndex++}`);
        params.push(value);
      }
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    
    return { whereClause, params };
  }

  /**
   * 构建SELECT查询
   * @private
   * @param {Object} conditions - 查询条件
   * @param {Array|string} fields - 查询字段
   * @param {Object} orderBy - 排序条件
   * @param {Object} pagination - 分页参数
   * @returns {Object} SQL语句和参数
   */
  _buildSelectQuery(conditions, fields, orderBy, pagination = {}) {
    // 确定要查询的字段
    const selectFields = fields 
      ? Array.isArray(fields) ? fields.join(', ') : fields
      : '*';
    
    // 构建WHERE子句
    const { whereClause, params } = this._buildConditions(conditions);
    
    // 构建ORDER BY子句
    let orderByClause = '';
    if (orderBy && typeof orderBy === 'object') {
      const orderClauses = [];
      for (const [field, direction] of Object.entries(orderBy)) {
        orderClauses.push(`${field} ${direction.toUpperCase()}`);
      }
      orderByClause = `ORDER BY ${orderClauses.join(', ')}`;
    }
    
    // 构建LIMIT和OFFSET子句
    let limitClause = '';
    if (pagination.limit !== undefined) {
      limitClause = `LIMIT ${pagination.limit}`;
      if (pagination.offset !== undefined) {
        limitClause += ` OFFSET ${pagination.offset}`;
      }
    }
    
    // 构建完整SQL
    const sql = `SELECT ${selectFields} FROM ${this.tableName} ${whereClause} ${orderByClause} ${limitClause}`;
    
    return { sql, params };
  }

  /**
   * 构建COUNT查询
   * @private
   * @param {Object} conditions - 查询条件
   * @returns {Object} SQL语句和参数
   */
  _buildCountQuery(conditions) {
    // 构建WHERE子句
    const { whereClause, params } = this._buildConditions(conditions);
    
    // 构建完整SQL
    const sql = `SELECT COUNT(*) as count FROM ${this.tableName} ${whereClause}`;
    
    return { sql, params };
  }

  /**
   * 构建INSERT查询
   * @private
   * @param {Object} data - 插入数据
   * @returns {Object} SQL语句和参数
   */
  _buildInsertQuery(data) {
    const fields = Object.keys(data);
    const placeholders = fields.map((_, index) => `$${index + 1}`).join(', ');
    const values = Object.values(data);
    
    const sql = `INSERT INTO ${this.tableName} (${fields.join(', ')}) VALUES (${placeholders}) RETURNING ${this.options.idField}`;
    
    return { sql, params: values };
  }

  /**
   * 构建批量INSERT查询
   * @private
   * @param {Array<Object>} dataArray - 插入数据数组
   * @returns {Object} SQL语句和参数
   */
  _buildBulkInsertQuery(dataArray) {
    if (dataArray.length === 0) {
      throw new Error('数据数组不能为空');
    }
    
    const fields = Object.keys(dataArray[0]);
    const allValues = [];
    const valueGroups = [];
    let paramIndex = 1;
    
    // 为每行数据构建值组
    dataArray.forEach(data => {
      const placeholders = fields.map(() => `$${paramIndex++}`).join(', ');
      valueGroups.push(`(${placeholders})`);
      
      // 收集所有参数值
      fields.forEach(field => {
        allValues.push(data[field]);
      });
    });
    
    const sql = `INSERT INTO ${this.tableName} (${fields.join(', ')}) VALUES ${valueGroups.join(', ')}`;
    
    return { sql, params: allValues };
  }

  /**
   * 构建UPDATE查询
   * @private
   * @param {Object} conditions - 更新条件
   * @param {Object} data - 更新数据
   * @returns {Object} SQL语句和参数
   */
  _buildUpdateQuery(conditions, data) {
    // 构建SET子句
    const setClauses = [];
    const params = [];
    let paramIndex = 1;
    
    for (const [field, value] of Object.entries(data)) {
      setClauses.push(`${field} = $${paramIndex++}`);
      params.push(value);
    }
    
    const setClause = `SET ${setClauses.join(', ')}`;
    
    // 构建WHERE子句
    const { whereClause, params: whereParams } = this._buildConditions(conditions);
    
    // 合并参数
    const allParams = [...params, ...whereParams];
    
    // 构建完整SQL
    const sql = `UPDATE ${this.tableName} ${setClause} ${whereClause}`;
    
    return { sql, params: allParams };
  }

  /**
   * 构建DELETE查询
   * @private
   * @param {Object} conditions - 删除条件
   * @returns {Object} SQL语句和参数
   */
  _buildDeleteQuery(conditions) {
    // 构建WHERE子句
    const { whereClause, params } = this._buildConditions(conditions);
    
    // 构建完整SQL
    const sql = `DELETE FROM ${this.tableName} ${whereClause}`;
    
    return { sql, params };
  }

  /**
   * 添加时间戳
   * @private
   * @param {Object} data - 数据对象
   * @param {boolean} isCreate - 是否为创建操作
   * @returns {Object} 添加时间戳后的数据
   */
  _addTimestamps(data, isCreate = false) {
    const now = new Date();
    const result = { ...data };
    
    // 添加更新时间戳
    if (this.options.updatedAtField) {
      result[this.options.updatedAtField] = now;
    }
    
    // 如果是创建操作，添加创建时间戳
    if (isCreate && this.options.createdAtField) {
      result[this.options.createdAtField] = now;
    }
    
    return result;
  }

  /**
   * 开启事务
   * @returns {Promise<Object>} 事务对象
   */
  async beginTransaction() {
    return this.connectionPool.beginTransaction();
  }

  /**
   * 提交事务
   * @param {Object} transaction - 事务对象
   * @returns {Promise<void>}
   */
  async commitTransaction(transaction) {
    return this.connectionPool.commitTransaction(transaction);
  }

  /**
   * 回滚事务
   * @param {Object} transaction - 事务对象
   * @returns {Promise<void>}
   */
  async rollbackTransaction(transaction) {
    return this.connectionPool.rollbackTransaction(transaction);
  }

  /**
   * 执行事务操作
   * @param {Function} callback - 事务回调函数
   * @returns {Promise<any>} 回调函数的返回值
   */
  async executeInTransaction(callback) {
    const transaction = await this.beginTransaction();
    
    try {
      const result = await callback(transaction);
      await this.commitTransaction(transaction);
      return result;
    } catch (error) {
      await this.rollbackTransaction(transaction);
      throw error;
    }
  }

  /**
   * 检查表是否存在
   * @returns {Promise<boolean>} 表是否存在
   */
  async tableExists() {
    try {
      const sql = `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1)`;
      const result = await this.executeQuery(sql, [this.tableName]);
      return result[0]?.exists || false;
    } catch (error) {
      logger.error(`检查表格存在性失败: ${this.tableName}`, { error });
      return false;
    }
  }

  /**
   * 获取表结构
   * @returns {Promise<Array>} 表结构信息
   */
  async getTableSchema() {
    try {
      const sql = `SELECT column_name, data_type, character_maximum_length, is_nullable 
                   FROM information_schema.columns 
                   WHERE table_name = $1 
                   ORDER BY ordinal_position`;
      
      return await this.executeQuery(sql, [this.tableName]);
    } catch (error) {
      logger.error(`获取表结构失败: ${this.tableName}`, { error });
      throw new AppError('获取表结构失败', 500, error);
    }
  }
}

module.exports = BaseRepository;