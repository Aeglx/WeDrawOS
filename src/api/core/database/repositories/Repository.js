/**
 * Repository基类
 * 提供数据库操作的通用方法，作为所有具体Repository的父类
 */

const { Database } = require('../database');
const { DatabaseError } = require('../../errors/appError');
const { Logger } = require('../../logging/logger');

class Repository {
  constructor(tableName, entityName) {
    this.tableName = tableName;
    this.entityName = entityName || tableName;
    this.database = Database.getInstance();
    this.logger = Logger.getInstance();
    
    if (!tableName) {
      throw new Error('Repository requires a table name');
    }
  }

  /**
   * 创建实体
   * @param {Object} data - 实体数据
   * @returns {Promise<Object>} 创建的实体
   */
  async create(data) {
    try {
      const now = new Date();
      const timestampedData = {
        ...data,
        created_at: now,
        updated_at: now
      };

      const columns = Object.keys(timestampedData);
      const placeholders = columns.map((_, index) => `$${index + 1}`);
      const values = Object.values(timestampedData);

      const sql = `
        INSERT INTO ${this.tableName} (${columns.join(', ')})
        VALUES (${placeholders.join(', ')})
        RETURNING *
      `;

      this.logger.debug(`Creating ${this.entityName}:`, { data });
      const result = await this.database.query(sql, values);
      return result.rows[0];
    } catch (error) {
      this.logger.error(`Failed to create ${this.entityName}:`, error);
      throw new DatabaseError(`Failed to create ${this.entityName}`, 500, error);
    }
  }

  /**
   * 根据ID查找实体
   * @param {number|string} id - 实体ID
   * @param {Object} options - 查询选项
   * @param {Array<string>} options.columns - 要返回的列
   * @param {boolean} options.includeDeleted - 是否包含已删除的记录
   * @returns {Promise<Object|null>} 找到的实体或null
   */
  async findById(id, options = {}) {
    try {
      const { columns = ['*'], includeDeleted = false } = options;
      
      let sql = `SELECT ${columns.join(', ')} FROM ${this.tableName} WHERE id = $1`;
      const params = [id];
      
      // 如果不包括已删除的记录，添加过滤条件
      if (!includeDeleted && this._hasSoftDeleteColumn()) {
        sql += ' AND is_deleted = false';
      }
      
      this.logger.debug(`Finding ${this.entityName} by ID: ${id}`);
      const result = await this.database.query(sql, params);
      return result.rows[0] || null;
    } catch (error) {
      this.logger.error(`Failed to find ${this.entityName} by ID ${id}:`, error);
      throw new DatabaseError(`Failed to find ${this.entityName}`, 500, error);
    }
  }

  /**
   * 查找所有实体
   * @param {Object} options - 查询选项
   * @param {Array<string>} options.columns - 要返回的列
   * @param {boolean} options.includeDeleted - 是否包含已删除的记录
   * @param {Object} options.order - 排序选项 { column: 'ASC|DESC' }
   * @returns {Promise<Array>} 实体列表
   */
  async findAll(options = {}) {
    try {
      const { 
        columns = ['*'], 
        includeDeleted = false,
        order = { column: 'created_at', direction: 'DESC' }
      } = options;
      
      let sql = `SELECT ${columns.join(', ')} FROM ${this.tableName}`;
      const params = [];
      
      // 如果不包括已删除的记录，添加过滤条件
      if (!includeDeleted && this._hasSoftDeleteColumn()) {
        sql += ' WHERE is_deleted = false';
      }
      
      // 添加排序
      if (order && order.column) {
        sql += ` ORDER BY ${order.column} ${order.direction || 'ASC'}`;
      }
      
      this.logger.debug(`Finding all ${this.entityName}s`);
      const result = await this.database.query(sql, params);
      return result.rows;
    } catch (error) {
      this.logger.error(`Failed to find all ${this.entityName}s:`, error);
      throw new DatabaseError(`Failed to find ${this.entityName}s`, 500, error);
    }
  }

  /**
   * 根据条件查找实体
   * @param {Object} conditions - 查询条件
   * @param {Object} options - 查询选项
   * @param {Array<string>} options.columns - 要返回的列
   * @param {boolean} options.includeDeleted - 是否包含已删除的记录
   * @param {Object} options.order - 排序选项
   * @returns {Promise<Array>} 符合条件的实体列表
   */
  async findByConditions(conditions, options = {}) {
    try {
      const { 
        columns = ['*'], 
        includeDeleted = false,
        order = { column: 'created_at', direction: 'DESC' }
      } = options;
      
      let sql = `SELECT ${columns.join(', ')} FROM ${this.tableName} WHERE `;
      const params = [];
      
      // 构建条件查询
      const conditionClauses = Object.entries(conditions).map(([key, value], index) => {
        params.push(value);
        return `${key} = $${params.length}`;
      });
      
      sql += conditionClauses.join(' AND ');
      
      // 如果不包括已删除的记录，添加过滤条件
      if (!includeDeleted && this._hasSoftDeleteColumn()) {
        sql += conditionClauses.length > 0 ? ' AND is_deleted = false' : ' is_deleted = false';
      }
      
      // 添加排序
      if (order && order.column) {
        sql += ` ORDER BY ${order.column} ${order.direction || 'ASC'}`;
      }
      
      this.logger.debug(`Finding ${this.entityName}s by conditions:`, { conditions });
      const result = await this.database.query(sql, params);
      return result.rows;
    } catch (error) {
      this.logger.error(`Failed to find ${this.entityName}s by conditions:`, { conditions, error });
      throw new DatabaseError(`Failed to find ${this.entityName}s`, 500, error);
    }
  }

  /**
   * 根据条件查找单个实体
   * @param {Object} conditions - 查询条件
   * @param {Object} options - 查询选项
   * @returns {Promise<Object|null>} 找到的实体或null
   */
  async findOneByConditions(conditions, options = {}) {
    try {
      const results = await this.findByConditions(conditions, options);
      return results[0] || null;
    } catch (error) {
      this.logger.error(`Failed to find single ${this.entityName}:`, { conditions, error });
      throw new DatabaseError(`Failed to find ${this.entityName}`, 500, error);
    }
  }

  /**
   * 更新实体
   * @param {number|string} id - 实体ID
   * @param {Object} data - 要更新的数据
   * @returns {Promise<Object|null>} 更新后的实体或null
   */
  async update(id, data) {
    try {
      const updateData = {
        ...data,
        updated_at: new Date()
      };

      const columns = Object.keys(updateData);
      const setClauses = columns.map((column, index) => `${column} = $${index + 1}`);
      const values = [...Object.values(updateData), id];

      let sql = `
        UPDATE ${this.tableName}
        SET ${setClauses.join(', ')}
        WHERE id = $${columns.length + 1}
        RETURNING *
      `;

      // 如果支持软删除，确保只更新未删除的记录
      if (this._hasSoftDeleteColumn()) {
        sql = sql.replace('WHERE id =', 'WHERE id = AND is_deleted = false');
      }

      this.logger.debug(`Updating ${this.entityName} ${id}:`, { data });
      const result = await this.database.query(sql, values);
      return result.rows[0] || null;
    } catch (error) {
      this.logger.error(`Failed to update ${this.entityName} ${id}:`, error);
      throw new DatabaseError(`Failed to update ${this.entityName}`, 500, error);
    }
  }

  /**
   * 根据条件更新多个实体
   * @param {Object} conditions - 更新条件
   * @param {Object} data - 要更新的数据
   * @returns {Promise<number>} 更新的行数
   */
  async updateByConditions(conditions, data) {
    try {
      const updateData = {
        ...data,
        updated_at: new Date()
      };

      const columns = Object.keys(updateData);
      const setClauses = columns.map((column, index) => `${column} = $${index + 1}`);
      
      let sql = `
        UPDATE ${this.tableName}
        SET ${setClauses.join(', ')}
        WHERE 
      `;

      // 构建条件查询
      const conditionParams = Object.values(conditions);
      const conditionClauses = Object.keys(conditions).map((key, index) => 
        `${key} = $${columns.length + index + 1}`
      );
      
      sql += conditionClauses.join(' AND ');
      
      // 如果支持软删除，确保只更新未删除的记录
      if (this._hasSoftDeleteColumn()) {
        sql += conditionClauses.length > 0 ? 
          ' AND is_deleted = false' : 
          ' is_deleted = false';
      }

      sql += ' RETURNING *';
      
      const values = [...Object.values(updateData), ...conditionParams];
      
      this.logger.debug(`Updating ${this.entityName}s by conditions:`, { conditions, data });
      const result = await this.database.query(sql, values);
      return result.rowCount;
    } catch (error) {
      this.logger.error(`Failed to update ${this.entityName}s by conditions:`, { conditions, data, error });
      throw new DatabaseError(`Failed to update ${this.entityName}s`, 500, error);
    }
  }

  /**
   * 删除实体（支持软删除）
   * @param {number|string} id - 实体ID
   * @param {Object} options - 删除选项
   * @param {boolean} options.force - 是否强制删除（物理删除）
   * @returns {Promise<boolean>} 删除是否成功
   */
  async delete(id, options = {}) {
    try {
      const { force = false } = options;
      
      if (force || !this._hasSoftDeleteColumn()) {
        // 物理删除
        const sql = `DELETE FROM ${this.tableName} WHERE id = $1`;
        this.logger.debug(`Forced deleting ${this.entityName} ${id}`);
        const result = await this.database.query(sql, [id]);
        return result.rowCount > 0;
      } else {
        // 软删除
        const sql = `
          UPDATE ${this.tableName}
          SET is_deleted = true, deleted_at = $1
          WHERE id = $2 AND is_deleted = false
        `;
        this.logger.debug(`Soft deleting ${this.entityName} ${id}`);
        const result = await this.database.query(sql, [new Date(), id]);
        return result.rowCount > 0;
      }
    } catch (error) {
      this.logger.error(`Failed to delete ${this.entityName} ${id}:`, error);
      throw new DatabaseError(`Failed to delete ${this.entityName}`, 500, error);
    }
  }

  /**
   * 根据条件删除多个实体
   * @param {Object} conditions - 删除条件
   * @param {Object} options - 删除选项
   * @returns {Promise<number>} 删除的行数
   */
  async deleteByConditions(conditions, options = {}) {
    try {
      const { force = false } = options;
      const conditionParams = Object.values(conditions);
      
      if (force || !this._hasSoftDeleteColumn()) {
        // 物理删除
        let sql = 'DELETE FROM ${this.tableName} WHERE ';
        const conditionClauses = Object.keys(conditions).map((key, index) => 
          `${key} = $${index + 1}`
        );
        sql += conditionClauses.join(' AND ');
        
        this.logger.debug(`Forced deleting ${this.entityName}s by conditions:`, { conditions });
        const result = await this.database.query(sql, conditionParams);
        return result.rowCount;
      } else {
        // 软删除
        let sql = `
          UPDATE ${this.tableName}
          SET is_deleted = true, deleted_at = $1
          WHERE 
        `;
        
        const conditionClauses = Object.keys(conditions).map((key, index) => 
          `${key} = $${index + 2}`
        );
        
        sql += conditionClauses.join(' AND ');
        sql += ' AND is_deleted = false';
        
        this.logger.debug(`Soft deleting ${this.entityName}s by conditions:`, { conditions });
        const result = await this.database.query(sql, [new Date(), ...conditionParams]);
        return result.rowCount;
      }
    } catch (error) {
      this.logger.error(`Failed to delete ${this.entityName}s by conditions:`, { conditions, error });
      throw new DatabaseError(`Failed to delete ${this.entityName}s`, 500, error);
    }
  }

  /**
   * 恢复已软删除的实体
   * @param {number|string} id - 实体ID
   * @returns {Promise<Object|null>} 恢复后的实体或null
   */
  async restore(id) {
    try {
      if (!this._hasSoftDeleteColumn()) {
        throw new Error(`Table ${this.tableName} does not support soft delete`);
      }

      const sql = `
        UPDATE ${this.tableName}
        SET is_deleted = false, deleted_at = NULL
        WHERE id = $1 AND is_deleted = true
        RETURNING *
      `;

      this.logger.debug(`Restoring ${this.entityName} ${id}`);
      const result = await this.database.query(sql, [id]);
      return result.rows[0] || null;
    } catch (error) {
      this.logger.error(`Failed to restore ${this.entityName} ${id}:`, error);
      throw new DatabaseError(`Failed to restore ${this.entityName}`, 500, error);
    }
  }

  /**
   * 检查实体是否存在
   * @param {number|string} id - 实体ID
   * @param {Object} options - 选项
   * @returns {Promise<boolean>} 是否存在
   */
  async exists(id, options = {}) {
    try {
      const { includeDeleted = false } = options;
      let sql = `SELECT EXISTS(SELECT 1 FROM ${this.tableName} WHERE id = $1`;
      const params = [id];
      
      if (!includeDeleted && this._hasSoftDeleteColumn()) {
        sql += ' AND is_deleted = false';
      }
      
      sql += ')';
      
      const result = await this.database.query(sql, params);
      return result.rows[0].exists;
    } catch (error) {
      this.logger.error(`Failed to check if ${this.entityName} exists:`, error);
      throw new DatabaseError(`Failed to check ${this.entityName} existence`, 500, error);
    }
  }

  /**
   * 获取实体数量
   * @param {Object} conditions - 过滤条件
   * @param {boolean} includeDeleted - 是否包含已删除的记录
   * @returns {Promise<number>} 实体数量
   */
  async count(conditions = {}, includeDeleted = false) {
    try {
      let sql = 'SELECT COUNT(*) FROM ${this.tableName}';
      const params = [];
      
      const hasConditions = Object.keys(conditions).length > 0;
      const hasWhere = hasConditions || !includeDeleted;
      
      if (hasWhere) {
        sql += ' WHERE';
      }
      
      if (!includeDeleted && this._hasSoftDeleteColumn()) {
        sql += ' is_deleted = false';
      }
      
      if (hasConditions) {
        if (!includeDeleted && this._hasSoftDeleteColumn()) {
          sql += ' AND';
        }
        
        const conditionClauses = Object.entries(conditions).map(([key, value], index) => {
          params.push(value);
          return ` ${key} = $${params.length}`;
        });
        
        sql += conditionClauses.join(' AND');
      }
      
      const result = await this.database.query(sql, params);
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      this.logger.error(`Failed to count ${this.entityName}s:`, error);
      throw new DatabaseError(`Failed to count ${this.entityName}s`, 500, error);
    }
  }

  /**
   * 分页查询
   * @param {Object} options - 分页选项
   * @param {number} options.page - 页码（从1开始）
   * @param {number} options.limit - 每页数量
   * @param {Object} options.conditions - 过滤条件
   * @param {Array<string>} options.columns - 要返回的列
   * @param {Object} options.order - 排序选项
   * @param {boolean} options.includeDeleted - 是否包含已删除的记录
   * @returns {Promise<Object>} 分页结果 { items, total, page, limit, pages }
   */
  async paginate(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        conditions = {},
        columns = ['*'],
        order = { column: 'created_at', direction: 'DESC' },
        includeDeleted = false
      } = options;

      const offset = (page - 1) * limit;
      const hasConditions = Object.keys(conditions).length > 0;
      
      // 构建查询条件
      let whereClause = '';
      const params = [];
      
      if (!includeDeleted && this._hasSoftDeleteColumn()) {
        whereClause = ' WHERE is_deleted = false';
      }
      
      if (hasConditions) {
        const prefix = whereClause ? ' AND' : ' WHERE';
        const conditionClauses = Object.entries(conditions).map(([key, value]) => {
          params.push(value);
          return `${key} = $${params.length}`;
        });
        
        whereClause += `${prefix} ${conditionClauses.join(' AND ')}`;
      }
      
      // 构建排序
      const orderClause = order && order.column 
        ? ` ORDER BY ${order.column} ${order.direction || 'ASC'}` 
        : '';

      // 查询数据
      const itemsSql = `
        SELECT ${columns.join(', ')}
        FROM ${this.tableName}
        ${whereClause}
        ${orderClause}
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `;
      
      const itemsParams = [...params, limit, offset];
      const itemsResult = await this.database.query(itemsSql, itemsParams);
      
      // 查询总数
      const countSql = `
        SELECT COUNT(*)
        FROM ${this.tableName}
        ${whereClause}
      `;
      
      const countResult = await this.database.query(countSql, params);
      const total = parseInt(countResult.rows[0].count, 10);
      const pages = Math.ceil(total / limit);

      this.logger.debug(`Paginating ${this.entityName}s: page ${page}, limit ${limit}`, { conditions });
      
      return {
        items: itemsResult.rows,
        total,
        page,
        limit,
        pages
      };
    } catch (error) {
      this.logger.error(`Failed to paginate ${this.entityName}s:`, error);
      throw new DatabaseError(`Failed to paginate ${this.entityName}s`, 500, error);
    }
  }

  /**
   * 批量创建实体
   * @param {Array<Object>} items - 实体数据数组
   * @returns {Promise<Array>} 创建的实体列表
   */
  async bulkCreate(items) {
    try {
      if (!items || items.length === 0) {
        return [];
      }

      const now = new Date();
      const timestampedItems = items.map(item => ({
        ...item,
        created_at: now,
        updated_at: now
      }));

      const columns = Object.keys(timestampedItems[0]);
      const valuesPlaceholders = timestampedItems.map((_, rowIndex) =>
        `(${columns.map((_, colIndex) => `$${rowIndex * columns.length + colIndex + 1}`).join(', ')})`
      ).join(', ');

      const allValues = timestampedItems.flatMap(item => Object.values(item));

      const sql = `
        INSERT INTO ${this.tableName} (${columns.join(', ')})
        VALUES ${valuesPlaceholders}
        RETURNING *
      `;

      this.logger.debug(`Bulk creating ${timestampedItems.length} ${this.entityName}s`);
      const result = await this.database.query(sql, allValues);
      return result.rows;
    } catch (error) {
      this.logger.error(`Failed to bulk create ${this.entityName}s:`, error);
      throw new DatabaseError(`Failed to bulk create ${this.entityName}s`, 500, error);
    }
  }

  /**
   * 批量更新实体
   * @param {Array<Object>} items - 要更新的实体数组，每个实体必须包含id字段
   * @returns {Promise<Array>} 更新结果
   */
  async bulkUpdate(items) {
    try {
      if (!items || items.length === 0) {
        return [];
      }

      const results = [];
      
      // 对于PostgreSQL，我们可以使用事务和循环来处理批量更新
      await this.database.transaction(async (client) => {
        for (const item of items) {
          if (!item.id) {
            throw new Error('Each item must have an id for bulk update');
          }

          const { id, ...updateData } = { ...item, updated_at: new Date() };
          const columns = Object.keys(updateData);
          const setClauses = columns.map((column, index) => `${column} = $${index + 1}`);
          const values = [...Object.values(updateData), id];

          const sql = `
            UPDATE ${this.tableName}
            SET ${setClauses.join(', ')}
            WHERE id = $${columns.length + 1}
            RETURNING *
          `;

          const result = await client.query(sql, values);
          if (result.rows.length > 0) {
            results.push(result.rows[0]);
          }
        }
      });

      this.logger.debug(`Bulk updated ${results.length} ${this.entityName}s`);
      return results;
    } catch (error) {
      this.logger.error(`Failed to bulk update ${this.entityName}s:`, error);
      throw new DatabaseError(`Failed to bulk update ${this.entityName}s`, 500, error);
    }
  }

  /**
   * 执行自定义SQL查询
   * @param {string} sql - SQL查询语句
   * @param {Array} params - 查询参数
   * @returns {Promise<Object>} 查询结果
   */
  async executeQuery(sql, params = []) {
    try {
      this.logger.debug(`Executing custom query on ${this.tableName}:`, { sql, params });
      return await this.database.query(sql, params);
    } catch (error) {
      this.logger.error(`Failed to execute query on ${this.tableName}:`, { sql, error });
      throw new DatabaseError(`Failed to execute query on ${this.tableName}`, 500, error);
    }
  }

  /**
   * 检查表是否支持软删除
   * @private
   * @returns {boolean} 是否支持软删除
   */
  _hasSoftDeleteColumn() {
    // 假设表支持软删除，如果需要更准确的检查，可以查询表结构
    return ['users', 'products', 'categories'].includes(this.tableName);
  }

  /**
   * 安全地解析JSON字段
   * @param {Object} row - 数据库行数据
   * @param {Array<string>} jsonColumns - JSON字段名称数组
   * @returns {Object} 解析后的对象
   */
  parseJsonColumns(row, jsonColumns) {
    if (!row) return row;
    
    const result = { ...row };
    
    jsonColumns.forEach(column => {
      if (result[column] && typeof result[column] === 'string') {
        try {
          result[column] = JSON.parse(result[column]);
        } catch (error) {
          this.logger.warn(`Failed to parse JSON column ${column}:`, error);
          // 保留原始值
        }
      }
    });
    
    return result;
  }

  /**
   * 安全地格式化日期字段
   * @param {Object} row - 数据库行数据
   * @param {Array<string>} dateColumns - 日期字段名称数组
   * @returns {Object} 格式化后的对象
   */
  formatDateColumns(row, dateColumns) {
    if (!row) return row;
    
    const result = { ...row };
    
    dateColumns.forEach(column => {
      if (result[column] && result[column] instanceof Date) {
        result[column] = result[column].toISOString();
      }
    });
    
    return result;
  }
}

module.exports = Repository;