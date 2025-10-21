/**
 * 数据库模型工具
 * 提供数据库模型定义和操作功能
 */

const { EventEmitter } = require('events');
const { logger } = require('../logger');
const { logContext } = require('../logger/LogContext');
const { typeUtils } = require('../type');
const { stringUtils } = require('../string');
const { validationUtils } = require('../validation');
const { performanceUtils } = require('../performance');
const { databaseUtils } = require('./DatabaseUtils');

/**
 * 字段类型枚举
 */
const FieldType = {
  STRING: 'string',
  NUMBER: 'number',
  INTEGER: 'integer',
  FLOAT: 'float',
  BOOLEAN: 'boolean',
  DATE: 'date',
  TIME: 'time',
  DATETIME: 'datetime',
  OBJECT: 'object',
  ARRAY: 'array',
  JSON: 'json',
  BINARY: 'binary',
  UUID: 'uuid',
  ENUM: 'enum',
  REFERENCES: 'references'
};

/**
 * 查询操作符枚举
 */
const QueryOperator = {
  EQUAL: '=',
  NOT_EQUAL: '!=',
  GREATER_THAN: '>',
  GREATER_THAN_OR_EQUAL: '>=',
  LESS_THAN: '<',
  LESS_THAN_OR_EQUAL: '<=',
  LIKE: 'LIKE',
  ILIKE: 'ILIKE',
  IN: 'IN',
  NOT_IN: 'NOT IN',
  BETWEEN: 'BETWEEN',
  IS_NULL: 'IS NULL',
  IS_NOT_NULL: 'IS NOT NULL',
  CONTAINS: 'CONTAINS',
  STARTS_WITH: 'STARTS_WITH',
  ENDS_WITH: 'ENDS_WITH'
};

/**
 * 排序方向枚举
 */
const SortDirection = {
  ASC: 'ASC',
  DESC: 'DESC'
};

/**
 * 数据库模型工具类
 * 提供数据库模型的定义、查询构建和CRUD操作功能
 */
class ModelUtils extends EventEmitter {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   */
  constructor(options = {}) {
    super();

    this.options = {
      databaseUtils: options.databaseUtils || databaseUtils,
      enableValidation: options.enableValidation !== undefined ? options.enableValidation : true,
      enableAudit: options.enableAudit !== undefined ? options.enableAudit : true,
      ...options
    };

    // 存储已定义的模型
    this.models = new Map();

    // 设置最大监听器
    this.setMaxListeners(50);

    logger.debug('数据库模型工具初始化完成');
  }

  /**
   * 定义数据库模型
   * @param {string} name - 模型名称
   * @param {Object} schema - 模型模式定义
   * @param {Object} options - 模型选项
   * @returns {Object} 模型定义
   */
  defineModel(name, schema, options = {}) {
    if (!name || !schema) {
      throw new Error('模型名称和模式定义是必需的');
    }

    // 检查模型是否已存在
    if (this.models.has(name)) {
      logger.warn(`模型 ${name} 已存在，将被覆盖`);
    }

    // 验证模式定义
    this._validateSchema(schema);

    // 创建模型定义
    const model = {
      name,
      schema,
      options: {
        tableName: options.tableName || stringUtils.toSnakeCase(name),
        primaryKey: options.primaryKey || 'id',
        timestamps: options.timestamps !== undefined ? options.timestamps : true,
        softDelete: options.softDelete || false,
        indexes: options.indexes || [],
        ...options
      },
      createdAt: new Date(),
      methods: {
        // 基础CRUD方法
        create: this._createCreateMethod(name),
        findById: this._createFindByIdMethod(name),
        findOne: this._createFindOneMethod(name),
        find: this._createFindMethod(name),
        update: this._createUpdateMethod(name),
        delete: this._createDeleteMethod(name),
        count: this._createCountMethod(name),
        exists: this._createExistsMethod(name),
        upsert: this._createUpsertMethod(name),
        // 查询构建器方法
        query: this._createQueryBuilderMethod(name)
      }
    };

    // 添加审计字段
    if (model.options.timestamps) {
      this._addTimestampFields(schema);
    }

    if (model.options.softDelete) {
      this._addSoftDeleteField(schema);
    }

    // 存储模型
    this.models.set(name, model);

    logger.info(`模型 ${name} 已定义`, {
      tableName: model.options.tableName,
      fields: Object.keys(schema).length,
      primaryKey: model.options.primaryKey,
      timestamps: model.options.timestamps,
      softDelete: model.options.softDelete
    });

    this.emit('model.defined', model);

    return model;
  }

  /**
   * 获取模型
   * @param {string} name - 模型名称
   * @returns {Object|null} 模型定义
   */
  getModel(name) {
    return this.models.get(name) || null;
  }

  /**
   * 获取所有模型
   * @returns {Map<string, Object>} 所有模型定义
   */
  getAllModels() {
    return new Map(this.models);
  }

  /**
   * 删除模型
   * @param {string} name - 模型名称
   * @returns {boolean} 是否删除成功
   */
  removeModel(name) {
    const result = this.models.delete(name);
    
    if (result) {
      logger.info(`模型 ${name} 已删除`);
      this.emit('model.removed', { name });
    }
    
    return result;
  }

  /**
   * 验证模式定义
   * @param {Object} schema - 模式定义
   * @private
   */
  _validateSchema(schema) {
    if (!typeUtils.isObject(schema)) {
      throw new Error('模式定义必须是对象');
    }

    // 检查每个字段的定义
    Object.entries(schema).forEach(([fieldName, fieldDef]) => {
      if (typeof fieldDef === 'string') {
        // 简单类型定义
        if (!Object.values(FieldType).includes(fieldDef)) {
          throw new Error(`无效的字段类型: ${fieldDef} (字段: ${fieldName})`);
        }
      } else if (typeUtils.isObject(fieldDef)) {
        // 完整字段定义
        if (!fieldDef.type) {
          throw new Error(`字段 ${fieldName} 缺少类型定义`);
        }
        
        if (!Object.values(FieldType).includes(fieldDef.type)) {
          throw new Error(`无效的字段类型: ${fieldDef.type} (字段: ${fieldName})`);
        }

        // 验证特殊字段类型的配置
        if (fieldDef.type === FieldType.ENUM && (!fieldDef.values || !Array.isArray(fieldDef.values))) {
          throw new Error(`枚举字段 ${fieldName} 必须指定值列表`);
        }

        if (fieldDef.type === FieldType.REFERENCES && (!fieldDef.model || !fieldDef.field)) {
          throw new Error(`引用字段 ${fieldName} 必须指定模型和字段`);
        }
      } else {
        throw new Error(`无效的字段定义: ${fieldName}`);
      }
    });
  }

  /**
   * 添加时间戳字段
   * @param {Object} schema - 模式定义
   * @private
   */
  _addTimestampFields(schema) {
    if (!schema.createdAt) {
      schema.createdAt = {
        type: FieldType.DATETIME,
        defaultValue: 'CURRENT_TIMESTAMP',
        required: true
      };
    }

    if (!schema.updatedAt) {
      schema.updatedAt = {
        type: FieldType.DATETIME,
        defaultValue: 'CURRENT_TIMESTAMP',
        onUpdate: 'CURRENT_TIMESTAMP',
        required: true
      };
    }
  }

  /**
   * 添加软删除字段
   * @param {Object} schema - 模式定义
   * @private
   */
  _addSoftDeleteField(schema) {
    if (!schema.deletedAt) {
      schema.deletedAt = {
        type: FieldType.DATETIME,
        defaultValue: null,
        required: false
      };
    }
  }

  /**
   * 创建创建方法
   * @param {string} modelName - 模型名称
   * @returns {Function} 创建方法
   * @private
   */
  _createCreateMethod(modelName) {
    return async (data, options = {}) => {
      const model = this.getModel(modelName);
      if (!model) throw new Error(`模型 ${modelName} 不存在`);

      const startTime = performance.now();
      let result;

      try {
        // 验证数据
        if (this.options.enableValidation) {
          this._validateData(data, model.schema);
        }

        // 准备数据
        const preparedData = this._prepareCreateData(data, model);

        // 构建SQL
        const { sql, params } = this._buildInsertQuery(model, preparedData);

        // 执行SQL
        result = await this.options.databaseUtils.insert(sql, params, options);

        // 记录性能
        const duration = performance.now() - startTime;
        performanceUtils.recordTimer(`model.${modelName}.create`, duration);

        logger.info(`模型 ${modelName} 创建记录成功`, {
          id: result.insertId || 'unknown',
          duration,
          requestId: logContext.getRequestId()
        });

        this.emit('model.create', { model: modelName, data: preparedData, result });

        return result;
      } catch (error) {
        logger.error(`模型 ${modelName} 创建记录失败`, {
          error: error.message,
          requestId: logContext.getRequestId()
        });
        this.emit('model.error', { model: modelName, operation: 'create', error });
        throw error;
      }
    };
  }

  /**
   * 创建根据ID查找方法
   * @param {string} modelName - 模型名称
   * @returns {Function} 查找方法
   * @private
   */
  _createFindByIdMethod(modelName) {
    return async (id, options = {}) => {
      const model = this.getModel(modelName);
      if (!model) throw new Error(`模型 ${modelName} 不存在`);

      const startTime = performance.now();
      let result;

      try {
        const query = this._buildFindByIdQuery(model, id, options);
        result = await this.options.databaseUtils.query(query.sql, query.params, options);

        // 记录性能
        const duration = performance.now() - startTime;
        performanceUtils.recordTimer(`model.${modelName}.findById`, duration);

        logger.debug(`模型 ${modelName} 根据ID查找记录`, {
          id,
          duration,
          found: result.length > 0,
          requestId: logContext.getRequestId()
        });

        return result[0] || null;
      } catch (error) {
        logger.error(`模型 ${modelName} 根据ID查找记录失败`, {
          id,
          error: error.message,
          requestId: logContext.getRequestId()
        });
        this.emit('model.error', { model: modelName, operation: 'findById', error, id });
        throw error;
      }
    };
  }

  /**
   * 创建查找一个记录方法
   * @param {string} modelName - 模型名称
   * @returns {Function} 查找方法
   * @private
   */
  _createFindOneMethod(modelName) {
    return async (conditions = {}, options = {}) => {
      const model = this.getModel(modelName);
      if (!model) throw new Error(`模型 ${modelName} 不存在`);

      const startTime = performance.now();
      let result;

      try {
        // 限制结果为1条
        options.limit = 1;
        
        const query = this._buildFindQuery(model, conditions, options);
        result = await this.options.databaseUtils.query(query.sql, query.params, options);

        // 记录性能
        const duration = performance.now() - startTime;
        performanceUtils.recordTimer(`model.${modelName}.findOne`, duration);

        logger.debug(`模型 ${modelName} 查找单条记录`, {
          conditions: Object.keys(conditions).length,
          duration,
          found: result.length > 0,
          requestId: logContext.getRequestId()
        });

        return result[0] || null;
      } catch (error) {
        logger.error(`模型 ${modelName} 查找单条记录失败`, {
          error: error.message,
          requestId: logContext.getRequestId()
        });
        this.emit('model.error', { model: modelName, operation: 'findOne', error });
        throw error;
      }
    };
  }

  /**
   * 创建查找多条记录方法
   * @param {string} modelName - 模型名称
   * @returns {Function} 查找方法
   * @private
   */
  _createFindMethod(modelName) {
    return async (conditions = {}, options = {}) => {
      const model = this.getModel(modelName);
      if (!model) throw new Error(`模型 ${modelName} 不存在`);

      const startTime = performance.now();
      let result;

      try {
        const query = this._buildFindQuery(model, conditions, options);
        result = await this.options.databaseUtils.query(query.sql, query.params, options);

        // 记录性能
        const duration = performance.now() - startTime;
        performanceUtils.recordTimer(`model.${modelName}.find`, duration);

        logger.debug(`模型 ${modelName} 查找记录`, {
          conditions: Object.keys(conditions).length,
          duration,
          count: result.length,
          requestId: logContext.getRequestId()
        });

        this.emit('model.find', { model: modelName, conditions, options, count: result.length });

        return result;
      } catch (error) {
        logger.error(`模型 ${modelName} 查找记录失败`, {
          error: error.message,
          requestId: logContext.getRequestId()
        });
        this.emit('model.error', { model: modelName, operation: 'find', error });
        throw error;
      }
    };
  }

  /**
   * 创建更新方法
   * @param {string} modelName - 模型名称
   * @returns {Function} 更新方法
   * @private
   */
  _createUpdateMethod(modelName) {
    return async (conditions, data, options = {}) => {
      const model = this.getModel(modelName);
      if (!model) throw new Error(`模型 ${modelName} 不存在`);

      const startTime = performance.now();
      let result;

      try {
        // 验证数据
        if (this.options.enableValidation) {
          this._validateData(data, model.schema, true);
        }

        // 准备数据
        const preparedData = this._prepareUpdateData(data, model);

        // 构建SQL
        const query = this._buildUpdateQuery(model, conditions, preparedData, options);

        // 执行SQL
        result = await this.options.databaseUtils.update(query.sql, query.params, options);

        // 记录性能
        const duration = performance.now() - startTime;
        performanceUtils.recordTimer(`model.${modelName}.update`, duration);

        logger.info(`模型 ${modelName} 更新记录成功`, {
          affectedRows: result.affectedRows || 0,
          duration,
          requestId: logContext.getRequestId()
        });

        this.emit('model.update', { model: modelName, conditions, data: preparedData, result });

        return result;
      } catch (error) {
        logger.error(`模型 ${modelName} 更新记录失败`, {
          error: error.message,
          requestId: logContext.getRequestId()
        });
        this.emit('model.error', { model: modelName, operation: 'update', error });
        throw error;
      }
    };
  }

  /**
   * 创建删除方法
   * @param {string} modelName - 模型名称
   * @returns {Function} 删除方法
   * @private
   */
  _createDeleteMethod(modelName) {
    return async (conditions, options = {}) => {
      const model = this.getModel(modelName);
      if (!model) throw new Error(`模型 ${modelName} 不存在`);

      const startTime = performance.now();
      let result;

      try {
        // 构建SQL
        const query = model.options.softDelete 
          ? this._buildSoftDeleteQuery(model, conditions, options)
          : this._buildDeleteQuery(model, conditions, options);

        // 执行SQL
        result = await this.options.databaseUtils.delete(query.sql, query.params, options);

        // 记录性能
        const duration = performance.now() - startTime;
        performanceUtils.recordTimer(`model.${modelName}.delete`, duration);

        logger.info(`模型 ${modelName} 删除记录成功`, {
          affectedRows: result.affectedRows || 0,
          isSoftDelete: model.options.softDelete,
          duration,
          requestId: logContext.getRequestId()
        });

        this.emit('model.delete', { 
          model: modelName, 
          conditions, 
          isSoftDelete: model.options.softDelete,
          result 
        });

        return result;
      } catch (error) {
        logger.error(`模型 ${modelName} 删除记录失败`, {
          error: error.message,
          requestId: logContext.getRequestId()
        });
        this.emit('model.error', { model: modelName, operation: 'delete', error });
        throw error;
      }
    };
  }

  /**
   * 创建计数方法
   * @param {string} modelName - 模型名称
   * @returns {Function} 计数方法
   * @private
   */
  _createCountMethod(modelName) {
    return async (conditions = {}, options = {}) => {
      const model = this.getModel(modelName);
      if (!model) throw new Error(`模型 ${modelName} 不存在`);

      const startTime = performance.now();
      let result;

      try {
        // 构建SQL
        const query = this._buildCountQuery(model, conditions, options);
        
        // 执行SQL
        result = await this.options.databaseUtils.query(query.sql, query.params, options);

        // 记录性能
        const duration = performance.now() - startTime;
        performanceUtils.recordTimer(`model.${modelName}.count`, duration);

        const count = result[0]?.count || 0;
        
        logger.debug(`模型 ${modelName} 计数`, {
          conditions: Object.keys(conditions).length,
          count,
          duration,
          requestId: logContext.getRequestId()
        });

        return count;
      } catch (error) {
        logger.error(`模型 ${modelName} 计数失败`, {
          error: error.message,
          requestId: logContext.getRequestId()
        });
        this.emit('model.error', { model: modelName, operation: 'count', error });
        throw error;
      }
    };
  }

  /**
   * 创建存在检查方法
   * @param {string} modelName - 模型名称
   * @returns {Function} 存在检查方法
   * @private
   */
  _createExistsMethod(modelName) {
    return async (conditions = {}, options = {}) => {
      const count = await model.methods.count(conditions, options);
      return count > 0;
    };
  }

  /**
   * 创建Upsert方法
   * @param {string} modelName - 模型名称
   * @returns {Function} Upsert方法
   * @private
   */
  _createUpsertMethod(modelName) {
    return async (conditions, data, options = {}) => {
      const model = this.getModel(modelName);
      if (!model) throw new Error(`模型 ${modelName} 不存在`);

      const startTime = performance.now();
      let result;

      try {
        // 检查记录是否存在
        const exists = await model.methods.exists(conditions, options);

        if (exists) {
          // 更新现有记录
          result = await model.methods.update(conditions, data, options);
        } else {
          // 创建新记录
          const combinedData = { ...conditions, ...data };
          result = await model.methods.create(combinedData, options);
        }

        // 记录性能
        const duration = performance.now() - startTime;
        performanceUtils.recordTimer(`model.${modelName}.upsert`, duration);

        logger.info(`模型 ${modelName} upsert 成功`, {
          action: exists ? 'update' : 'create',
          duration,
          requestId: logContext.getRequestId()
        });

        this.emit('model.upsert', { 
          model: modelName, 
          conditions, 
          data,
          action: exists ? 'update' : 'create',
          result 
        });

        return result;
      } catch (error) {
        logger.error(`模型 ${modelName} upsert 失败`, {
          error: error.message,
          requestId: logContext.getRequestId()
        });
        this.emit('model.error', { model: modelName, operation: 'upsert', error });
        throw error;
      }
    };
  }

  /**
   * 创建查询构建器方法
   * @param {string} modelName - 模型名称
   * @returns {Function} 查询构建器方法
   * @private
   */
  _createQueryBuilderMethod(modelName) {
    return () => {
      const model = this.getModel(modelName);
      if (!model) throw new Error(`模型 ${modelName} 不存在`);

      // 返回查询构建器实例
      return new QueryBuilder(model, this.options.databaseUtils);
    };
  }

  /**
   * 验证数据
   * @param {Object} data - 要验证的数据
   * @param {Object} schema - 模型模式
   * @param {boolean} partial - 是否部分验证
   * @private
   */
  _validateData(data, schema, partial = false) {
    const validationSchema = {};

    // 构建验证模式
    Object.entries(schema).forEach(([fieldName, fieldDef]) => {
      // 跳过部分验证中的可选字段
      if (partial && data[fieldName] === undefined) {
        return;
      }

      const fieldType = typeof fieldDef === 'string' ? fieldDef : fieldDef.type;
      const isRequired = typeof fieldDef === 'object' && fieldDef.required;

      validationSchema[fieldName] = [];

      // 添加必填验证
      if (isRequired && !partial) {
        validationSchema[fieldName].push({ required: true });
      }

      // 添加类型验证
      switch (fieldType) {
        case FieldType.STRING:
          validationSchema[fieldName].push({ type: 'string' });
          break;
        case FieldType.NUMBER:
        case FieldType.FLOAT:
          validationSchema[fieldName].push({ type: 'number' });
          break;
        case FieldType.INTEGER:
          validationSchema[fieldName].push({ integer: true });
          break;
        case FieldType.BOOLEAN:
          validationSchema[fieldName].push({ boolean: true });
          break;
        case FieldType.DATE:
        case FieldType.DATETIME:
          validationSchema[fieldName].push({ date: true });
          break;
        case FieldType.ARRAY:
          validationSchema[fieldName].push({ array: true });
          break;
        case FieldType.OBJECT:
        case FieldType.JSON:
          validationSchema[fieldName].push({ object: true });
          break;
        case FieldType.UUID:
          validationSchema[fieldName].push({ uuid: true });
          break;
        case FieldType.ENUM:
          if (typeof fieldDef === 'object' && fieldDef.values) {
            validationSchema[fieldName].push({ in: fieldDef.values });
          }
          break;
      }

      // 添加自定义验证规则
      if (typeof fieldDef === 'object' && fieldDef.validation) {
        if (Array.isArray(fieldDef.validation)) {
          validationSchema[fieldName].push(...fieldDef.validation);
        } else {
          validationSchema[fieldName].push(fieldDef.validation);
        }
      }
    });

    // 执行验证
    const result = validationUtils.validate(data, validationSchema);
    
    if (!result.isValid) {
      throw new Error(`数据验证失败: ${JSON.stringify(result.errors)}`);
    }
  }

  /**
   * 准备创建数据
   * @param {Object} data - 原始数据
   * @param {Object} model - 模型定义
   * @returns {Object} 准备好的数据
   * @private
   */
  _prepareCreateData(data, model) {
    const prepared = { ...data };
    const now = new Date();

    // 设置时间戳
    if (model.options.timestamps) {
      if (!prepared.createdAt) {
        prepared.createdAt = now;
      }
      if (!prepared.updatedAt) {
        prepared.updatedAt = now;
      }
    }

    // 处理特殊字段
    Object.entries(model.schema).forEach(([fieldName, fieldDef]) => {
      const fieldType = typeof fieldDef === 'string' ? fieldDef : fieldDef.type;
      const fieldValue = prepared[fieldName];

      // 处理默认值
      if (fieldValue === undefined && typeof fieldDef === 'object' && fieldDef.defaultValue !== undefined) {
        if (typeof fieldDef.defaultValue === 'function') {
          prepared[fieldName] = fieldDef.defaultValue();
        } else {
          prepared[fieldName] = fieldDef.defaultValue;
        }
      }

      // 类型转换
      this._convertFieldType(prepared, fieldName, fieldType);
    });

    return prepared;
  }

  /**
   * 准备更新数据
   * @param {Object} data - 原始数据
   * @param {Object} model - 模型定义
   * @returns {Object} 准备好的数据
   * @private
   */
  _prepareUpdateData(data, model) {
    const prepared = { ...data };

    // 更新时间戳
    if (model.options.timestamps) {
      prepared.updatedAt = new Date();
    }

    // 移除不允许更新的字段
    if (model.options.immutableFields) {
      model.options.immutableFields.forEach(field => {
        if (prepared[field] !== undefined) {
          delete prepared[field];
        }
      });
    }

    // 类型转换
    Object.entries(prepared).forEach(([fieldName, fieldValue]) => {
      const fieldDef = model.schema[fieldName];
      if (fieldDef) {
        const fieldType = typeof fieldDef === 'string' ? fieldDef : fieldDef.type;
        this._convertFieldType(prepared, fieldName, fieldType);
      }
    });

    return prepared;
  }

  /**
   * 转换字段类型
   * @param {Object} data - 数据对象
   * @param {string} fieldName - 字段名称
   * @param {string} fieldType - 字段类型
   * @private
   */
  _convertFieldType(data, fieldName, fieldType) {
    const value = data[fieldName];
    if (value === undefined || value === null) return;

    switch (fieldType) {
      case FieldType.STRING:
        data[fieldName] = String(value);
        break;
      case FieldType.NUMBER:
      case FieldType.FLOAT:
        data[fieldName] = parseFloat(value);
        break;
      case FieldType.INTEGER:
        data[fieldName] = parseInt(value, 10);
        break;
      case FieldType.BOOLEAN:
        data[fieldName] = Boolean(value);
        break;
      case FieldType.JSON:
        if (typeof value === 'object') {
          data[fieldName] = JSON.stringify(value);
        }
        break;
      case FieldType.DATE:
      case FieldType.DATETIME:
        if (!(value instanceof Date)) {
          data[fieldName] = new Date(value);
        }
        break;
    }
  }

  /**
   * 构建插入查询
   * @param {Object} model - 模型定义
   * @param {Object} data - 数据
   * @returns {Object} SQL和参数
   * @private
   */
  _buildInsertQuery(model, data) {
    const fields = Object.keys(data);
    const placeholders = fields.map((_, index) => `$${index + 1}`);
    const params = Object.values(data);

    const sql = `
      INSERT INTO ${model.options.tableName} (${fields.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING *
    `;

    return { sql, params };
  }

  /**
   * 构建根据ID查找查询
   * @param {Object} model - 模型定义
   * @param {*} id - ID值
   * @param {Object} options - 选项
   * @returns {Object} SQL和参数
   * @private
   */
  _buildFindByIdQuery(model, id, options) {
    const conditions = { [model.options.primaryKey]: id };
    return this._buildFindQuery(model, conditions, options);
  }

  /**
   * 构建查找查询
   * @param {Object} model - 模型定义
   * @param {Object} conditions - 查询条件
   * @param {Object} options - 查询选项
   * @returns {Object} SQL和参数
   * @private
   */
  _buildFindQuery(model, conditions, options) {
    const { fields, joins, whereClause, params } = this._buildWhereClause(model, conditions, options);
    const { limit, offset } = this._buildPagination(options);
    const orderBy = this._buildOrderBy(model, options);

    let sql = `SELECT ${fields || '*'} FROM ${model.options.tableName}`;

    if (joins && joins.length > 0) {
      sql += ' ' + joins.join(' ');
    }

    if (whereClause) {
      sql += ' WHERE ' + whereClause;
    } else if (model.options.softDelete) {
      sql += ' WHERE deletedAt IS NULL';
    }

    if (orderBy) {
      sql += ' ORDER BY ' + orderBy;
    }

    if (limit !== undefined) {
      sql += ` LIMIT ${limit}`;
    }

    if (offset !== undefined) {
      sql += ` OFFSET ${offset}`;
    }

    return { sql, params };
  }

  /**
   * 构建更新查询
   * @param {Object} model - 模型定义
   * @param {Object} conditions - 查询条件
   * @param {Object} data - 更新数据
   * @param {Object} options - 查询选项
   * @returns {Object} SQL和参数
   * @private
   */
  _buildUpdateQuery(model, conditions, data, options) {
    const { whereClause, params: whereParams } = this._buildWhereClause(model, conditions, options);
    
    // 构建SET子句
    const setFields = Object.keys(data);
    const setPlaceholders = setFields.map((_, index) => `${_} = $${index + 1}`);
    const setParams = Object.values(data);

    // 组合参数
    const allParams = [...setParams, ...whereParams];

    let sql = `
      UPDATE ${model.options.tableName}
      SET ${setPlaceholders.join(', ')}
    `;

    if (whereClause) {
      sql += ' WHERE ' + whereClause;
    } else if (model.options.softDelete) {
      sql += ' WHERE deletedAt IS NULL';
    }

    sql += ' RETURNING *';

    return { sql, params: allParams };
  }

  /**
   * 构建删除查询
   * @param {Object} model - 模型定义
   * @param {Object} conditions - 查询条件
   * @param {Object} options - 查询选项
   * @returns {Object} SQL和参数
   * @private
   */
  _buildDeleteQuery(model, conditions, options) {
    const { whereClause, params } = this._buildWhereClause(model, conditions, options);

    let sql = `DELETE FROM ${model.options.tableName}`;

    if (whereClause) {
      sql += ' WHERE ' + whereClause;
    }

    return { sql, params };
  }

  /**
   * 构建软删除查询
   * @param {Object} model - 模型定义
   * @param {Object} conditions - 查询条件
   * @param {Object} options - 查询选项
   * @returns {Object} SQL和参数
   * @private
   */
  _buildSoftDeleteQuery(model, conditions, options) {
    const { whereClause, params } = this._buildWhereClause(model, conditions, options);
    
    // 添加deletedAt条件
    const deleteWhereClause = whereClause 
      ? `${whereClause} AND deletedAt IS NULL`
      : 'deletedAt IS NULL';

    const sql = `
      UPDATE ${model.options.tableName}
      SET deletedAt = CURRENT_TIMESTAMP
      WHERE ${deleteWhereClause}
      RETURNING *
    `;

    return { sql, params };
  }

  /**
   * 构建计数查询
   * @param {Object} model - 模型定义
   * @param {Object} conditions - 查询条件
   * @param {Object} options - 查询选项
   * @returns {Object} SQL和参数
   * @private
   */
  _buildCountQuery(model, conditions, options) {
    const { whereClause, params } = this._buildWhereClause(model, conditions, options);

    let sql = `SELECT COUNT(*) as count FROM ${model.options.tableName}`;

    if (whereClause) {
      sql += ' WHERE ' + whereClause;
    } else if (model.options.softDelete) {
      sql += ' WHERE deletedAt IS NULL';
    }

    return { sql, params };
  }

  /**
   * 构建WHERE子句
   * @param {Object} model - 模型定义
   * @param {Object} conditions - 查询条件
   * @param {Object} options - 查询选项
   * @returns {Object} WHERE子句和参数
   * @private
   */
  _buildWhereClause(model, conditions, options) {
    const clauses = [];
    const params = [];
    let paramIndex = 1;

    // 处理字段选择
    const fields = options.fields ? options.fields.join(', ') : null;

    // 处理连接
    const joins = this._buildJoins(model, options);

    // 处理基本条件
    Object.entries(conditions).forEach(([field, value]) => {
      if (value === undefined || value === null) {
        clauses.push(`${field} IS NULL`);
      } else if (Array.isArray(value)) {
        clauses.push(`${field} IN (${value.map(() => `$${paramIndex++}`).join(', ')})`);
        params.push(...value);
      } else if (typeof value === 'object') {
        // 处理操作符条件
        Object.entries(value).forEach(([operator, opValue]) => {
          const op = this._getOperator(operator);
          if (op) {
            clauses.push(`${field} ${op} $${paramIndex++}`);
            params.push(opValue);
          }
        });
      } else {
        clauses.push(`${field} = $${paramIndex++}`);
        params.push(value);
      }
    });

    // 添加软删除条件
    if (model.options.softDelete && !conditions.deletedAt) {
      clauses.push('deletedAt IS NULL');
    }

    // 组合WHERE子句
    const whereClause = clauses.length > 0 ? clauses.join(' AND ') : null;

    return { fields, joins, whereClause, params };
  }

  /**
   * 获取查询操作符
   * @param {string} operator - 操作符名称
   * @returns {string} SQL操作符
   * @private
   */
  _getOperator(operator) {
    switch (operator.toLowerCase()) {
      case 'eq':
      case 'equal':
        return QueryOperator.EQUAL;
      case 'ne':
      case 'not_equal':
        return QueryOperator.NOT_EQUAL;
      case 'gt':
      case 'greater_than':
        return QueryOperator.GREATER_THAN;
      case 'gte':
      case 'greater_than_or_equal':
        return QueryOperator.GREATER_THAN_OR_EQUAL;
      case 'lt':
      case 'less_than':
        return QueryOperator.LESS_THAN;
      case 'lte':
      case 'less_than_or_equal':
        return QueryOperator.LESS_THAN_OR_EQUAL;
      case 'like':
        return QueryOperator.LIKE;
      case 'ilike':
        return QueryOperator.ILIKE;
      case 'in':
        return QueryOperator.IN;
      case 'not_in':
        return QueryOperator.NOT_IN;
      case 'between':
        return QueryOperator.BETWEEN;
      default:
        return null;
    }
  }

  /**
   * 构建分页
   * @param {Object} options - 查询选项
   * @returns {Object} 分页参数
   * @private
   */
  _buildPagination(options) {
    let limit = options.limit;
    let offset = options.offset;

    // 处理页码分页
    if (options.page && options.pageSize) {
      limit = options.pageSize;
      offset = (options.page - 1) * options.pageSize;
    }

    return { limit, offset };
  }

  /**
   * 构建ORDER BY
   * @param {Object} model - 模型定义
   * @param {Object} options - 查询选项
   * @returns {string|null} ORDER BY子句
   * @private
   */
  _buildOrderBy(model, options) {
    if (!options.orderBy) {
      return null;
    }

    const orderClauses = [];

    if (typeof options.orderBy === 'string') {
      orderClauses.push(options.orderBy);
    } else if (Array.isArray(options.orderBy)) {
      options.orderBy.forEach(order => {
        if (typeof order === 'string') {
          orderClauses.push(order);
        } else if (typeof order === 'object') {
          Object.entries(order).forEach(([field, direction]) => {
            const validDirection = direction.toUpperCase() === SortDirection.DESC ? SortDirection.DESC : SortDirection.ASC;
            orderClauses.push(`${field} ${validDirection}`);
          });
        }
      });
    } else if (typeof options.orderBy === 'object') {
      Object.entries(options.orderBy).forEach(([field, direction]) => {
        const validDirection = direction.toUpperCase() === SortDirection.DESC ? SortDirection.DESC : SortDirection.ASC;
        orderClauses.push(`${field} ${validDirection}`);
      });
    }

    return orderClauses.length > 0 ? orderClauses.join(', ') : null;
  }

  /**
   * 构建JOIN子句
   * @param {Object} model - 模型定义
   * @param {Object} options - 查询选项
   * @returns {Array<string>} JOIN子句数组
   * @private
   */
  _buildJoins(model, options) {
    const joins = [];

    if (options.joins && Array.isArray(options.joins)) {
      options.joins.forEach(join => {
        if (typeof join === 'string') {
          joins.push(join);
        } else if (typeof join === 'object') {
          const { type = 'INNER', table, on } = join;
          if (table && on) {
            joins.push(`${type} JOIN ${table} ON ${on}`);
          }
        }
      });
    }

    return joins;
  }

  /**
   * 静态实例
   * @private
   */
  static _instance = null;

  /**
   * 获取单例实例
   * @param {Object} options - 配置选项
   * @returns {ModelUtils} 模型工具实例
   */
  static getInstance(options = {}) {
    if (!ModelUtils._instance) {
      ModelUtils._instance = new ModelUtils(options);
    }
    return ModelUtils._instance;
  }

  /**
   * 创建新的模型工具实例
   * @param {Object} options - 配置选项
   * @returns {ModelUtils} 模型工具实例
   */
  static create(options = {}) {
    return new ModelUtils(options);
  }
}

/**
 * 查询构建器类
 * 提供流畅的查询构建API
 */
class QueryBuilder {
  constructor(model, databaseUtils) {
    this.model = model;
    this.databaseUtils = databaseUtils;
    this.conditions = {};
    this.options = {
      fields: null,
      limit: null,
      offset: null,
      orderBy: null,
      joins: null,
      groupBy: null,
      having: null
    };
  }

  /**
   * 添加WHERE条件
   */
  where(field, operator, value) {
    if (arguments.length === 2) {
      this.conditions[field] = operator;
    } else if (arguments.length === 3) {
      if (!this.conditions[field]) {
        this.conditions[field] = {};
      }
      this.conditions[field][operator] = value;
    }
    return this;
  }

  /**
   * 添加OR条件
   */
  or(field, operator, value) {
    // 简化实现，实际应用中可能需要更复杂的OR条件处理
    return this.where(field, operator, value);
  }

  /**
   * 选择字段
   */
  select(...fields) {
    this.options.fields = fields;
    return this;
  }

  /**
   * 限制结果数量
   */
  limit(limit) {
    this.options.limit = limit;
    return this;
  }

  /**
   * 跳过结果
   */
  offset(offset) {
    this.options.offset = offset;
    return this;
  }

  /**
   * 分页
   */
  page(page, pageSize) {
    this.options.page = page;
    this.options.pageSize = pageSize;
    return this;
  }

  /**
   * 排序
   */
  orderBy(field, direction = SortDirection.ASC) {
    if (!this.options.orderBy) {
      this.options.orderBy = [];
    }
    this.options.orderBy.push({ [field]: direction });
    return this;
  }

  /**
   * 添加JOIN
   */
  join(type, table, on) {
    if (!this.options.joins) {
      this.options.joins = [];
    }
    this.options.joins.push({ type, table, on });
    return this;
  }

  /**
   * 执行查询
   */
  async execute() {
    const query = this._buildQuery();
    return this.databaseUtils.query(query.sql, query.params);
  }

  /**
   * 获取单个结果
   */
  async first() {
    this.limit(1);
    const results = await this.execute();
    return results[0] || null;
  }

  /**
   * 获取结果数量
   */
  async count() {
    const query = this._buildCountQuery();
    const results = await this.databaseUtils.query(query.sql, query.params);
    return results[0]?.count || 0;
  }

  /**
   * 构建查询
   * @private
   */
  _buildQuery() {
    const modelUtils = ModelUtils.getInstance();
    return modelUtils._buildFindQuery(this.model, this.conditions, this.options);
  }

  /**
   * 构建计数查询
   * @private
   */
  _buildCountQuery() {
    const modelUtils = ModelUtils.getInstance();
    return modelUtils._buildCountQuery(this.model, this.conditions, this.options);
  }
}

// 导出常量
module.exports.FieldType = FieldType;
module.exports.QueryOperator = QueryOperator;
module.exports.SortDirection = SortDirection;

// 创建默认实例
const defaultModelUtils = ModelUtils.getInstance();

module.exports = {
  ModelUtils,
  modelUtils: defaultModelUtils,
  QueryBuilder
};