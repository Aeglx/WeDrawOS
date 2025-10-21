/**
 * 实体管理器
 * 提供ORM功能和实体生命周期管理
 */

const logger = require('../../utils/logger');
const { AppError } = require('../../exception/handlers/errorHandler');
const { EntityError } = require('../../exception/handlers/errorHandler');
const { QueryBuilder } = require('../database/QueryBuilder');
const { TransactionManager } = require('../database/TransactionManager');

/**
 * 实体生命周期事件
 */
const EntityLifecycleEvent = {
  BEFORE_CREATE: 'entity.before_create',
  AFTER_CREATE: 'entity.after_create',
  BEFORE_UPDATE: 'entity.before_update',
  AFTER_UPDATE: 'entity.after_update',
  BEFORE_DELETE: 'entity.before_delete',
  AFTER_DELETE: 'entity.after_delete',
  BEFORE_SAVE: 'entity.before_save',
  AFTER_SAVE: 'entity.after_save',
  BEFORE_LOAD: 'entity.before_load',
  AFTER_LOAD: 'entity.after_load'
};

/**
 * 实体管理器
 */
class EntityManager {
  /**
   * 构造函数
   * @param {Object} connectionPool - 数据库连接池
   * @param {Object} options - 配置选项
   */
  constructor(connectionPool, options = {}) {
    this.connectionPool = connectionPool;
    this.options = {
      entityPrefix: '',
      autoTimestamp: true,
      defaultQueryTimeout: 30000,
      validateEntities: true,
      ...options
    };

    this.entities = new Map();
    this.entityMetadata = new Map();
    this.transactionManager = new TransactionManager(connectionPool, options.transaction || {});
    this.hooks = new Map();

    logger.info('实体管理器初始化完成', { options: this.options });
  }

  /**
   * 注册实体
   * @param {Function} EntityClass - 实体类
   * @returns {EntityManager} 实体管理器实例
   */
  registerEntity(EntityClass) {
    if (typeof EntityClass !== 'function') {
      throw new AppError('实体必须是一个类', {
        code: 'INVALID_ENTITY',
        status: 400
      });
    }

    const entityName = EntityClass.name;
    const metadata = this._extractEntityMetadata(EntityClass);
    
    this.entities.set(entityName, EntityClass);
    this.entityMetadata.set(entityName, metadata);
    
    logger.debug('实体已注册', { entityName, tableName: metadata.tableName });
    
    return this;
  }

  /**
   * 提取实体元数据
   * @private
   * @param {Function} EntityClass - 实体类
   * @returns {Object} 实体元数据
   */
  _extractEntityMetadata(EntityClass) {
    const metadata = {
      tableName: this._getTableName(EntityClass),
      primaryKey: 'id',
      columns: {},
      relationships: {},
      timestamps: {
        createdAt: 'createdAt',
        updatedAt: 'updatedAt'
      }
    };

    // 从类的静态属性中提取元数据
    if (EntityClass.metadata) {
      Object.assign(metadata, EntityClass.metadata);
    }

    // 从装饰器或注解中提取元数据（如果支持）
    if (EntityClass._entityMetadata) {
      Object.assign(metadata, EntityClass._entityMetadata);
    }

    return metadata;
  }

  /**
   * 获取表名
   * @private
   * @param {Function} EntityClass - 实体类
   * @returns {string} 表名
   */
  _getTableName(EntityClass) {
    // 优先使用自定义表名
    if (EntityClass.tableName) {
      return EntityClass.tableName;
    }

    // 使用实体名称的下划线形式
    const entityName = EntityClass.name;
    const tableName = entityName
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .substring(1);

    return this.options.entityPrefix + tableName;
  }

  /**
   * 获取实体仓库
   * @param {string|Function} entity - 实体名称或实体类
   * @returns {Object} 实体仓库
   */
  getRepository(entity) {
    const entityName = typeof entity === 'string' ? entity : entity.name;
    
    if (!this.entities.has(entityName)) {
      throw new AppError(`未找到注册的实体: ${entityName}`, {
        code: 'ENTITY_NOT_FOUND',
        status: 404
      });
    }

    const EntityClass = this.entities.get(entityName);
    const metadata = this.entityMetadata.get(entityName);

    // 创建仓库对象
    return {
      // 基础CRUD操作
      create: (data) => this.create(entityName, data),
      findOne: (id, options) => this.findOne(entityName, id, options),
      findById: (id, options) => this.findOne(entityName, id, options),
      findAll: (options) => this.findAll(entityName, options),
      update: (id, data) => this.update(entityName, id, data),
      delete: (id) => this.delete(entityName, id),
      count: (criteria) => this.count(entityName, criteria),
      exists: (id) => this.exists(entityName, id),
      
      // 查询构建器
      createQueryBuilder: () => this.createQueryBuilder(entityName),
      
      // 批量操作
      bulkCreate: (entities) => this.bulkCreate(entityName, entities),
      bulkUpdate: (criteria, data) => this.bulkUpdate(entityName, criteria, data),
      bulkDelete: (criteria) => this.bulkDelete(entityName, criteria),
      
      // 事务操作
      transaction: (operation, options) => this.transaction(entityName, operation, options),
      
      // 关系操作
      findWithRelations: (id, relations) => this.findWithRelations(entityName, id, relations),
      
      // 实体类引用
      entity: EntityClass,
      metadata
    };
  }

  /**
   * 创建实体
   * @param {string} entityName - 实体名称
   * @param {Object} data - 实体数据
   * @param {Object} options - 创建选项
   * @returns {Promise<Object>} 创建的实体
   */
  async create(entityName, data, options = {}) {
    const EntityClass = this.entities.get(entityName);
    const metadata = this.entityMetadata.get(entityName);
    
    // 创建实体实例
    const entity = new EntityClass(data);
    
    // 应用时间戳
    if (this.options.autoTimestamp) {
      const now = new Date();
      if (metadata.timestamps.createdAt) {
        entity[metadata.timestamps.createdAt] = now;
      }
      if (metadata.timestamps.updatedAt) {
        entity[metadata.timestamps.updatedAt] = now;
      }
    }

    // 执行前置钩子
    await this._executeHooks(EntityLifecycleEvent.BEFORE_SAVE, entity);
    await this._executeHooks(EntityLifecycleEvent.BEFORE_CREATE, entity);

    try {
      // 验证实体
      if (this.options.validateEntities && entity.validate) {
        await entity.validate();
      }

      // 构建查询
      const queryBuilder = new QueryBuilder(metadata.tableName);
      const result = await queryBuilder
        .insert(entity)
        .returning(metadata.primaryKey)
        .execute(options.connection || this.connectionPool);

      // 设置主键值
      const primaryKey = metadata.primaryKey;
      if (result.insertId) {
        entity[primaryKey] = result.insertId;
      } else if (result.rows && result.rows.length > 0) {
        entity[primaryKey] = result.rows[0][primaryKey];
      }

      // 执行后置钩子
      await this._executeHooks(EntityLifecycleEvent.AFTER_CREATE, entity);
      await this._executeHooks(EntityLifecycleEvent.AFTER_SAVE, entity);

      logger.debug('实体创建成功', { entityName, id: entity[primaryKey] });
      return entity;
    } catch (error) {
      logger.error('创建实体失败', { entityName, error: error.message });
      throw new EntityError('创建实体失败', error, { entityName });
    }
  }

  /**
   * 批量创建实体
   * @param {string} entityName - 实体名称
   * @param {Array<Object>} entities - 实体数据数组
   * @param {Object} options - 批量创建选项
   * @returns {Promise<Array<Object>>} 创建的实体数组
   */
  async bulkCreate(entityName, entities, options = {}) {
    const EntityClass = this.entities.get(entityName);
    const metadata = this.entityMetadata.get(entityName);
    
    // 转换数据为实体实例
    const entityInstances = entities.map(data => {
      const entity = new EntityClass(data);
      
      // 应用时间戳
      if (this.options.autoTimestamp) {
        const now = new Date();
        if (metadata.timestamps.createdAt) {
          entity[metadata.timestamps.createdAt] = now;
        }
        if (metadata.timestamps.updatedAt) {
          entity[metadata.timestamps.updatedAt] = now;
        }
      }
      
      return entity;
    });

    try {
      // 批量验证
      if (this.options.validateEntities) {
        for (const entity of entityInstances) {
          if (entity.validate) {
            await entity.validate();
          }
        }
      }

      // 构建批量插入查询
      const queryBuilder = new QueryBuilder(metadata.tableName);
      const result = await queryBuilder
        .insert(entityInstances)
        .returning('*')
        .execute(options.connection || this.connectionPool);

      logger.debug('批量创建实体成功', { entityName, count: entityInstances.length });
      return result.rows || entityInstances;
    } catch (error) {
      logger.error('批量创建实体失败', { entityName, error: error.message });
      throw new EntityError('批量创建实体失败', error, { entityName });
    }
  }

  /**
   * 根据ID查找实体
   * @param {string} entityName - 实体名称
   * @param {*} id - 实体ID
   * @param {Object} options - 查询选项
   * @returns {Promise<Object|null>} 找到的实体或null
   */
  async findOne(entityName, id, options = {}) {
    const metadata = this.entityMetadata.get(entityName);
    const EntityClass = this.entities.get(entityName);

    try {
      const queryBuilder = this._createFindQueryBuilder(entityName)
        .where(metadata.primaryKey, id);

      // 应用关系加载
      if (options.relations) {
        this._applyRelations(queryBuilder, entityName, options.relations);
      }

      const result = await queryBuilder.execute(options.connection || this.connectionPool);
      const row = result.rows && result.rows.length > 0 ? result.rows[0] : null;

      if (!row) {
        return null;
      }

      // 执行前置加载钩子
      await this._executeHooks(EntityLifecycleEvent.BEFORE_LOAD, row);

      // 创建实体实例
      const entity = new EntityClass(row);

      // 执行后置加载钩子
      await this._executeHooks(EntityLifecycleEvent.AFTER_LOAD, entity);

      return entity;
    } catch (error) {
      logger.error('查找实体失败', { entityName, id, error: error.message });
      throw new EntityError('查找实体失败', error, { entityName, id });
    }
  }

  /**
   * 查找所有实体
   * @param {string} entityName - 实体名称
   * @param {Object} options - 查询选项
   * @returns {Promise<Array<Object>>} 实体数组
   */
  async findAll(entityName, options = {}) {
    const metadata = this.entityMetadata.get(entityName);
    const EntityClass = this.entities.get(entityName);

    try {
      const queryBuilder = this._createFindQueryBuilder(entityName);

      // 应用过滤条件
      if (options.where) {
        queryBuilder.where(options.where);
      }

      // 应用排序
      if (options.order) {
        queryBuilder.orderBy(options.order);
      }

      // 应用分页
      if (options.limit !== undefined) {
        queryBuilder.limit(options.limit);
        if (options.offset !== undefined) {
          queryBuilder.offset(options.offset);
        }
      }

      // 应用关系加载
      if (options.relations) {
        this._applyRelations(queryBuilder, entityName, options.relations);
      }

      const result = await queryBuilder.execute(options.connection || this.connectionPool);
      const rows = result.rows || [];

      // 转换为实体实例
      const entities = [];
      for (const row of rows) {
        // 执行前置加载钩子
        await this._executeHooks(EntityLifecycleEvent.BEFORE_LOAD, row);

        // 创建实体实例
        const entity = new EntityClass(row);

        // 执行后置加载钩子
        await this._executeHooks(EntityLifecycleEvent.AFTER_LOAD, entity);

        entities.push(entity);
      }

      return entities;
    } catch (error) {
      logger.error('查找所有实体失败', { entityName, error: error.message });
      throw new EntityError('查找所有实体失败', error, { entityName });
    }
  }

  /**
   * 更新实体
   * @param {string} entityName - 实体名称
   * @param {*} id - 实体ID
   * @param {Object} data - 更新数据
   * @param {Object} options - 更新选项
   * @returns {Promise<Object|null>} 更新后的实体或null
   */
  async update(entityName, id, data, options = {}) {
    const metadata = this.entityMetadata.get(entityName);
    
    // 先查找实体
    const entity = await this.findOne(entityName, id, options);
    if (!entity) {
      return null;
    }

    // 更新实体属性
    Object.assign(entity, data);

    // 应用更新时间戳
    if (this.options.autoTimestamp && metadata.timestamps.updatedAt) {
      entity[metadata.timestamps.updatedAt] = new Date();
    }

    // 执行前置钩子
    await this._executeHooks(EntityLifecycleEvent.BEFORE_SAVE, entity);
    await this._executeHooks(EntityLifecycleEvent.BEFORE_UPDATE, entity);

    try {
      // 验证实体
      if (this.options.validateEntities && entity.validate) {
        await entity.validate();
      }

      // 构建更新查询
      const queryBuilder = new QueryBuilder(metadata.tableName)
        .update(entity)
        .where(metadata.primaryKey, id)
        .returning('*');

      const result = await queryBuilder.execute(options.connection || this.connectionPool);

      // 执行后置钩子
      await this._executeHooks(EntityLifecycleEvent.AFTER_UPDATE, entity);
      await this._executeHooks(EntityLifecycleEvent.AFTER_SAVE, entity);

      logger.debug('实体更新成功', { entityName, id });
      return entity;
    } catch (error) {
      logger.error('更新实体失败', { entityName, id, error: error.message });
      throw new EntityError('更新实体失败', error, { entityName, id });
    }
  }

  /**
   * 批量更新实体
   * @param {string} entityName - 实体名称
   * @param {Object} criteria - 更新条件
   * @param {Object} data - 更新数据
   * @param {Object} options - 更新选项
   * @returns {Promise<number>} 更新的行数
   */
  async bulkUpdate(entityName, criteria, data, options = {}) {
    const metadata = this.entityMetadata.get(entityName);
    
    // 应用更新时间戳
    if (this.options.autoTimestamp && metadata.timestamps.updatedAt) {
      data[metadata.timestamps.updatedAt] = new Date();
    }

    try {
      // 构建批量更新查询
      const queryBuilder = new QueryBuilder(metadata.tableName)
        .update(data);

      // 应用条件
      if (criteria) {
        queryBuilder.where(criteria);
      }

      const result = await queryBuilder.execute(options.connection || this.connectionPool);
      const affectedRows = result.affectedRows || 0;

      logger.debug('批量更新实体成功', { entityName, affectedRows });
      return affectedRows;
    } catch (error) {
      logger.error('批量更新实体失败', { entityName, error: error.message });
      throw new EntityError('批量更新实体失败', error, { entityName });
    }
  }

  /**
   * 删除实体
   * @param {string} entityName - 实体名称
   * @param {*} id - 实体ID
   * @param {Object} options - 删除选项
   * @returns {Promise<boolean>} 是否成功删除
   */
  async delete(entityName, id, options = {}) {
    const metadata = this.entityMetadata.get(entityName);
    
    // 先查找实体
    const entity = await this.findOne(entityName, id, options);
    if (!entity) {
      return false;
    }

    // 执行前置钩子
    await this._executeHooks(EntityLifecycleEvent.BEFORE_DELETE, entity);

    try {
      // 构建删除查询
      const queryBuilder = new QueryBuilder(metadata.tableName)
        .delete()
        .where(metadata.primaryKey, id);

      const result = await queryBuilder.execute(options.connection || this.connectionPool);

      // 执行后置钩子
      await this._executeHooks(EntityLifecycleEvent.AFTER_DELETE, entity);

      logger.debug('实体删除成功', { entityName, id });
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('删除实体失败', { entityName, id, error: error.message });
      throw new EntityError('删除实体失败', error, { entityName, id });
    }
  }

  /**
   * 批量删除实体
   * @param {string} entityName - 实体名称
   * @param {Object} criteria - 删除条件
   * @param {Object} options - 删除选项
   * @returns {Promise<number>} 删除的行数
   */
  async bulkDelete(entityName, criteria, options = {}) {
    const metadata = this.entityMetadata.get(entityName);

    try {
      // 构建批量删除查询
      const queryBuilder = new QueryBuilder(metadata.tableName)
        .delete();

      // 应用条件
      if (criteria) {
        queryBuilder.where(criteria);
      }

      const result = await queryBuilder.execute(options.connection || this.connectionPool);
      const affectedRows = result.affectedRows || 0;

      logger.debug('批量删除实体成功', { entityName, affectedRows });
      return affectedRows;
    } catch (error) {
      logger.error('批量删除实体失败', { entityName, error: error.message });
      throw new EntityError('批量删除实体失败', error, { entityName });
    }
  }

  /**
   * 计算实体数量
   * @param {string} entityName - 实体名称
   * @param {Object} criteria - 计数条件
   * @param {Object} options - 计数选项
   * @returns {Promise<number>} 实体数量
   */
  async count(entityName, criteria = {}, options = {}) {
    const metadata = this.entityMetadata.get(entityName);

    try {
      const queryBuilder = new QueryBuilder(metadata.tableName)
        .count()
        .where(criteria);

      const result = await queryBuilder.execute(options.connection || this.connectionPool);
      return parseInt(result.rows[0].count || 0, 10);
    } catch (error) {
      logger.error('计算实体数量失败', { entityName, error: error.message });
      throw new EntityError('计算实体数量失败', error, { entityName });
    }
  }

  /**
   * 检查实体是否存在
   * @param {string} entityName - 实体名称
   * @param {*} id - 实体ID
   * @param {Object} options - 检查选项
   * @returns {Promise<boolean>} 是否存在
   */
  async exists(entityName, id, options = {}) {
    const metadata = this.entityMetadata.get(entityName);

    try {
      const queryBuilder = new QueryBuilder(metadata.tableName)
        .select(metadata.primaryKey)
        .where(metadata.primaryKey, id)
        .limit(1);

      const result = await queryBuilder.execute(options.connection || this.connectionPool);
      return result.rows && result.rows.length > 0;
    } catch (error) {
      logger.error('检查实体是否存在失败', { entityName, id, error: error.message });
      throw new EntityError('检查实体是否存在失败', error, { entityName, id });
    }
  }

  /**
   * 查找实体及其关联
   * @param {string} entityName - 实体名称
   * @param {*} id - 实体ID
   * @param {Array<string>} relations - 要加载的关联
   * @param {Object} options - 查询选项
   * @returns {Promise<Object|null>} 实体及其关联
   */
  async findWithRelations(entityName, id, relations, options = {}) {
    // 先查找基本实体
    const entity = await this.findOne(entityName, id, {
      ...options,
      relations
    });

    if (!entity) {
      return null;
    }

    // 加载关联数据
    await this._loadRelations(entityName, entity, relations, options.connection);

    return entity;
  }

  /**
   * 创建查询构建器
   * @param {string} entityName - 实体名称
   * @returns {QueryBuilder} 查询构建器实例
   */
  createQueryBuilder(entityName) {
    const metadata = this.entityMetadata.get(entityName);
    if (!metadata) {
      throw new AppError(`未找到实体元数据: ${entityName}`, {
        code: 'METADATA_NOT_FOUND',
        status: 404
      });
    }

    return new QueryBuilder(metadata.tableName);
  }

  /**
   * 在事务中执行操作
   * @param {string} entityName - 实体名称
   * @param {Function} operation - 操作函数
   * @param {Object} options - 事务选项
   * @returns {Promise<any>} 操作结果
   */
  async transaction(entityName, operation, options = {}) {
    return this.transactionManager.executeInTransaction(async (connection) => {
      // 包装连接，增加操作计数
      const wrappedConnection = {
        ...connection,
        query: (...args) => {
          // 增加操作计数的逻辑
          return connection.query(...args);
        }
      };

      // 执行用户操作
      return await operation(wrappedConnection);
    }, options);
  }

  /**
   * 注册实体生命周期钩子
   * @param {string} eventType - 事件类型
   * @param {Function} hook - 钩子函数
   * @returns {EntityManager} 实体管理器实例
   */
  registerHook(eventType, hook) {
    if (!this.hooks.has(eventType)) {
      this.hooks.set(eventType, []);
    }
    this.hooks.get(eventType).push(hook);
    return this;
  }

  /**
   * 执行生命周期钩子
   * @private
   * @param {string} eventType - 事件类型
   * @param {Object} entity - 实体实例
   */
  async _executeHooks(eventType, entity) {
    const hooks = this.hooks.get(eventType) || [];
    for (const hook of hooks) {
      try {
        await hook(entity);
      } catch (error) {
        logger.error('执行实体钩子失败', { eventType, error: error.message });
        throw error;
      }
    }
  }

  /**
   * 创建查找查询构建器
   * @private
   * @param {string} entityName - 实体名称
   * @returns {QueryBuilder} 查询构建器实例
   */
  _createFindQueryBuilder(entityName) {
    const metadata = this.entityMetadata.get(entityName);
    return new QueryBuilder(metadata.tableName).select('*');
  }

  /**
   * 应用关系到查询构建器
   * @private
   * @param {QueryBuilder} queryBuilder - 查询构建器
   * @param {string} entityName - 实体名称
   * @param {Array<string>} relations - 关联列表
   */
  _applyRelations(queryBuilder, entityName, relations) {
    const metadata = this.entityMetadata.get(entityName);
    
    if (!metadata.relationships) return;

    relations.forEach(relation => {
      const relationInfo = metadata.relationships[relation];
      if (relationInfo) {
        // 应用JOIN
        const joinCondition = `${metadata.tableName}.${relationInfo.foreignKey} = ${relationInfo.targetTable}.${relationInfo.targetKey}`;
        queryBuilder.join(relationInfo.targetTable, joinCondition);
      }
    });
  }

  /**
   * 加载实体关联
   * @private
   * @param {string} entityName - 实体名称
   * @param {Object} entity - 实体实例
   * @param {Array<string>} relations - 关联列表
   * @param {Object} connection - 数据库连接
   */
  async _loadRelations(entityName, entity, relations, connection) {
    const metadata = this.entityMetadata.get(entityName);
    
    if (!metadata.relationships) return;

    // 这里可以实现更复杂的关联加载逻辑
    // 例如：1:N, N:1, N:M 关联
  }

  /**
   * 获取已注册的实体名称列表
   * @returns {Array<string>} 实体名称列表
   */
  getRegisteredEntities() {
    return Array.from(this.entities.keys());
  }

  /**
   * 获取实体元数据
   * @param {string} entityName - 实体名称
   * @returns {Object|null} 实体元数据
   */
  getEntityMetadata(entityName) {
    return this.entityMetadata.get(entityName) || null;
  }

  /**
   * 获取事务管理器
   * @returns {TransactionManager} 事务管理器实例
   */
  getTransactionManager() {
    return this.transactionManager;
  }

  /**
   * 关闭实体管理器
   * @returns {Promise<void>}
   */
  async close() {
    logger.info('正在关闭实体管理器...');
    
    // 关闭事务管理器
    await this.transactionManager.shutdown();
    
    logger.info('实体管理器已关闭');
  }

  /**
   * 获取实体生命周期事件类型
   * @returns {Object} 事件类型枚举
   */
  static getLifecycleEvents() {
    return { ...EntityLifecycleEvent };
  }
}

module.exports = {
  EntityManager,
  EntityLifecycleEvent
};