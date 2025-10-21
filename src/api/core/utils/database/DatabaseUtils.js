/**
 * 数据库操作工具
 * 提供数据库连接、查询和事务管理功能
 */

const { EventEmitter } = require('events');
const { logger } = require('../logger');
const { logContext } = require('../logger/LogContext');
const { typeUtils } = require('../type');
const { performanceUtils } = require('../performance');

/**
 * 数据库连接状态枚举
 */
const ConnectionStatus = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  ERROR: 'error'
};

/**
 * 数据库操作类型枚举
 */
const OperationType = {
  SELECT: 'select',
  INSERT: 'insert',
  UPDATE: 'update',
  DELETE: 'delete',
  EXECUTE: 'execute',
  TRANSACTION: 'transaction',
  RAW: 'raw'
};

/**
 * 数据库工具类
 * 提供数据库连接管理、查询执行和事务处理功能
 */
class DatabaseUtils extends EventEmitter {
  /**
   * 构造函数
   * @param {Object} options - 数据库配置选项
   */
  constructor(options = {}) {
    super();

    this.options = {
      driver: options.driver || null,
      connectionString: options.connectionString || null,
      connectionOptions: options.connectionOptions || {},
      poolSize: options.poolSize || 10,
      enableMetrics: options.enableMetrics !== undefined ? options.enableMetrics : true,
      enableLogging: options.enableLogging !== undefined ? options.enableLogging : true,
      queryTimeout: options.queryTimeout || 30000, // 默认30秒
      retryCount: options.retryCount || 3,
      retryDelay: options.retryDelay || 1000,
      ...options
    };

    // 数据库连接相关
    this.connection = null;
    this.connectionPool = null;
    this.connectionStatus = ConnectionStatus.DISCONNECTED;
    this.connectionError = null;

    // 事务相关
    this.activeTransactions = new Map();
    this.transactionCounter = 0;

    // 操作统计
    this.operationStats = {
      select: { count: 0, totalTime: 0 },
      insert: { count: 0, totalTime: 0 },
      update: { count: 0, totalTime: 0 },
      delete: { count: 0, totalTime: 0 },
      execute: { count: 0, totalTime: 0 },
      transaction: { count: 0, totalTime: 0 },
      raw: { count: 0, totalTime: 0 },
      errors: 0
    };

    // 设置最大监听器
    this.setMaxListeners(50);

    logger.debug('数据库工具初始化完成', {
      driver: this.options.driver,
      poolSize: this.options.poolSize,
      enableMetrics: this.options.enableMetrics
    });
  }

  /**
   * 获取当前连接状态
   * @returns {string} 连接状态
   */
  getStatus() {
    return this.connectionStatus;
  }

  /**
   * 连接到数据库
   * @returns {Promise<void>}
   */
  async connect() {
    if (this.connectionStatus === ConnectionStatus.CONNECTED) {
      logger.debug('数据库已经连接');
      return;
    }

    this.connectionStatus = ConnectionStatus.CONNECTING;
    this.connectionError = null;

    try {
      logger.info('正在连接到数据库');
      
      // 根据驱动类型创建连接
      if (this.options.driver) {
        await this._createConnection();
      } else {
        throw new Error('未指定数据库驱动');
      }

      this.connectionStatus = ConnectionStatus.CONNECTED;
      logger.info('数据库连接成功');
      this.emit('connected');

    } catch (error) {
      this.connectionStatus = ConnectionStatus.ERROR;
      this.connectionError = error;
      logger.error('数据库连接失败', { error: error.message });
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * 断开数据库连接
   * @returns {Promise<void>}
   */
  async disconnect() {
    if (this.connectionStatus !== ConnectionStatus.CONNECTED) {
      logger.debug('数据库未连接，无需断开');
      return;
    }

    try {
      logger.info('正在断开数据库连接');

      if (this.connectionPool) {
        await this.connectionPool.end();
        this.connectionPool = null;
      } else if (this.connection) {
        await this.connection.end();
        this.connection = null;
      }

      this.connectionStatus = ConnectionStatus.DISCONNECTED;
      logger.info('数据库连接已断开');
      this.emit('disconnected');

    } catch (error) {
      logger.error('断开数据库连接失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 创建数据库连接
   * @private
   * @returns {Promise<void>}
   */
  async _createConnection() {
    const startTime = performance.now();
    
    try {
      // 根据不同的数据库驱动创建连接
      switch (this.options.driver.toLowerCase()) {
        case 'mysql':
        case 'mysql2':
          await this._createMySqlConnection();
          break;
        case 'postgres':
        case 'postgresql':
        case 'pg':
          await this._createPostgresConnection();
          break;
        case 'mongodb':
        case 'mongoose':
          await this._createMongoDbConnection();
          break;
        case 'sqlite':
        case 'sqlite3':
          await this._createSqliteConnection();
          break;
        default:
          // 尝试使用通用连接方式
          if (typeof this.options.driver === 'function') {
            await this._createCustomConnection();
          } else {
            throw new Error(`不支持的数据库驱动: ${this.options.driver}`);
          }
      }

      const duration = performance.now() - startTime;
      logger.debug('数据库连接创建完成', { duration, driver: this.options.driver });

    } catch (error) {
      throw new Error(`创建数据库连接失败: ${error.message}`);
    }
  }

  /**
   * 创建MySQL连接
   * @private
   * @returns {Promise<void>}
   */
  async _createMySqlConnection() {
    try {
      const mysql = require('mysql2/promise');
      
      if (this.options.poolSize > 1) {
        // 创建连接池
        this.connectionPool = mysql.createPool({
          uri: this.options.connectionString,
          waitForConnections: true,
          connectionLimit: this.options.poolSize,
          queueLimit: 0,
          ...this.options.connectionOptions
        });
        
        // 测试连接
        await this.connectionPool.getConnection();
      } else {
        // 创建单个连接
        this.connection = await mysql.createConnection({
          uri: this.options.connectionString,
          ...this.options.connectionOptions
        });
      }
    } catch (error) {
      throw new Error(`MySQL连接失败: ${error.message}`);
    }
  }

  /**
   * 创建PostgreSQL连接
   * @private
   * @returns {Promise<void>}
   */
  async _createPostgresConnection() {
    try {
      const { Pool, Client } = require('pg');
      
      if (this.options.poolSize > 1) {
        // 创建连接池
        this.connectionPool = new Pool({
          connectionString: this.options.connectionString,
          max: this.options.poolSize,
          ...this.options.connectionOptions
        });
        
        // 测试连接
        await this.connectionPool.query('SELECT 1');
      } else {
        // 创建单个连接
        this.connection = new Client({
          connectionString: this.options.connectionString,
          ...this.options.connectionOptions
        });
        await this.connection.connect();
      }
    } catch (error) {
      throw new Error(`PostgreSQL连接失败: ${error.message}`);
    }
  }

  /**
   * 创建MongoDB连接
   * @private
   * @returns {Promise<void>}
   */
  async _createMongoDbConnection() {
    try {
      const mongoose = require('mongoose');
      
      await mongoose.connect(this.options.connectionString, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        ...this.options.connectionOptions
      });
      
      this.connection = mongoose.connection;
      
      // 监听MongoDB连接事件
      this.connection.on('error', (error) => {
        logger.error('MongoDB连接错误', { error: error.message });
        this.emit('error', error);
      });
    } catch (error) {
      throw new Error(`MongoDB连接失败: ${error.message}`);
    }
  }

  /**
   * 创建SQLite连接
   * @private
   * @returns {Promise<void>}
   */
  async _createSqliteConnection() {
    try {
      const sqlite3 = require('sqlite3').verbose();
      const { open } = require('sqlite');
      
      this.connection = await open({
        filename: this.options.connectionString || ':memory:',
        driver: sqlite3.Database,
        ...this.options.connectionOptions
      });
    } catch (error) {
      throw new Error(`SQLite连接失败: ${error.message}`);
    }
  }

  /**
   * 创建自定义连接
   * @private
   * @returns {Promise<void>}
   */
  async _createCustomConnection() {
    try {
      // 使用自定义驱动函数创建连接
      this.connection = await this.options.driver(this.options.connectionString, this.options.connectionOptions);
    } catch (error) {
      throw new Error(`自定义驱动连接失败: ${error.message}`);
    }
  }

  /**
   * 执行查询
   * @param {string} query - SQL查询语句
   * @param {Array} params - 查询参数
   * @param {Object} options - 查询选项
   * @returns {Promise<*>}
   */
  async query(query, params = [], options = {}) {
    return this._executeOperation(OperationType.SELECT, async () => {
      await this._ensureConnected();
      
      const startTime = performance.now();
      let result;
      
      try {
        // 执行查询
        result = await this._executeQuery(query, params, options);
        
        const duration = performance.now() - startTime;
        this._recordOperationStats(OperationType.SELECT, duration);
        
        this._logQuery(query, params, duration, null);
        this.emit('query', { query, params, duration, result });
        
        return result;
      } catch (error) {
        const duration = performance.now() - startTime;
        this.operationStats.errors++;
        
        this._logQuery(query, params, duration, error);
        this.emit('query.error', { query, params, error });
        
        throw error;
      }
    });
  }

  /**
   * 执行更新操作
   * @param {string} query - SQL更新语句
   * @param {Array} params - 查询参数
   * @param {Object} options - 操作选项
   * @returns {Promise<*>}
   */
  async update(query, params = [], options = {}) {
    return this._executeOperation(OperationType.UPDATE, async () => {
      await this._ensureConnected();
      
      const startTime = performance.now();
      let result;
      
      try {
        // 执行更新
        result = await this._executeQuery(query, params, options);
        
        const duration = performance.now() - startTime;
        this._recordOperationStats(OperationType.UPDATE, duration);
        
        this._logQuery(query, params, duration, null);
        this.emit('update', { query, params, duration, result });
        
        return result;
      } catch (error) {
        const duration = performance.now() - startTime;
        this.operationStats.errors++;
        
        this._logQuery(query, params, duration, error);
        this.emit('update.error', { query, params, error });
        
        throw error;
      }
    });
  }

  /**
   * 执行插入操作
   * @param {string} query - SQL插入语句
   * @param {Array} params - 查询参数
   * @param {Object} options - 操作选项
   * @returns {Promise<*>}
   */
  async insert(query, params = [], options = {}) {
    return this._executeOperation(OperationType.INSERT, async () => {
      await this._ensureConnected();
      
      const startTime = performance.now();
      let result;
      
      try {
        // 执行插入
        result = await this._executeQuery(query, params, options);
        
        const duration = performance.now() - startTime;
        this._recordOperationStats(OperationType.INSERT, duration);
        
        this._logQuery(query, params, duration, null);
        this.emit('insert', { query, params, duration, result });
        
        return result;
      } catch (error) {
        const duration = performance.now() - startTime;
        this.operationStats.errors++;
        
        this._logQuery(query, params, duration, error);
        this.emit('insert.error', { query, params, error });
        
        throw error;
      }
    });
  }

  /**
   * 执行删除操作
   * @param {string} query - SQL删除语句
   * @param {Array} params - 查询参数
   * @param {Object} options - 操作选项
   * @returns {Promise<*>}
   */
  async delete(query, params = [], options = {}) {
    return this._executeOperation(OperationType.DELETE, async () => {
      await this._ensureConnected();
      
      const startTime = performance.now();
      let result;
      
      try {
        // 执行删除
        result = await this._executeQuery(query, params, options);
        
        const duration = performance.now() - startTime;
        this._recordOperationStats(OperationType.DELETE, duration);
        
        this._logQuery(query, params, duration, null);
        this.emit('delete', { query, params, duration, result });
        
        return result;
      } catch (error) {
        const duration = performance.now() - startTime;
        this.operationStats.errors++;
        
        this._logQuery(query, params, duration, error);
        this.emit('delete.error', { query, params, error });
        
        throw error;
      }
    });
  }

  /**
   * 执行原始SQL
   * @param {string} sql - SQL语句
   * @param {Array} params - 参数
   * @param {Object} options - 选项
   * @returns {Promise<*>}
   */
  async execute(sql, params = [], options = {}) {
    return this._executeOperation(OperationType.RAW, async () => {
      await this._ensureConnected();
      
      const startTime = performance.now();
      let result;
      
      try {
        // 执行SQL
        result = await this._executeQuery(sql, params, options);
        
        const duration = performance.now() - startTime;
        this._recordOperationStats(OperationType.RAW, duration);
        
        this._logQuery(sql, params, duration, null);
        this.emit('execute', { sql, params, duration, result });
        
        return result;
      } catch (error) {
        const duration = performance.now() - startTime;
        this.operationStats.errors++;
        
        this._logQuery(sql, params, duration, error);
        this.emit('execute.error', { sql, params, error });
        
        throw error;
      }
    });
  }

  /**
   * 开始事务
   * @param {Object} options - 事务选项
   * @returns {Promise<string>} 事务ID
   */
  async beginTransaction(options = {}) {
    await this._ensureConnected();
    
    const transactionId = `tx_${++this.transactionCounter}_${Date.now()}`;
    const startTime = performance.now();
    
    try {
      // 根据不同的数据库驱动开始事务
      let transaction;
      
      if (this.options.driver.toLowerCase().includes('mysql')) {
        transaction = await this.connectionPool.getConnection();
        await transaction.beginTransaction();
      } else if (this.options.driver.toLowerCase().includes('postgres')) {
        transaction = await this.connectionPool.connect();
        await transaction.query('BEGIN');
      } else if (this.options.driver.toLowerCase().includes('sqlite')) {
        transaction = this.connection;
        await transaction.run('BEGIN TRANSACTION');
      } else {
        // 默认事务处理
        transaction = this.connection;
        await this._executeQuery('BEGIN TRANSACTION', [], { transaction });
      }
      
      // 存储事务信息
      this.activeTransactions.set(transactionId, {
        id: transactionId,
        transaction,
        startTime,
        queries: [],
        options
      });
      
      logger.debug('事务已开始', { transactionId });
      this.emit('transaction.begin', { transactionId });
      
      return transactionId;
    } catch (error) {
      logger.error('开始事务失败', { error: error.message });
      this.emit('transaction.error', { transactionId, error });
      throw error;
    }
  }

  /**
   * 提交事务
   * @param {string} transactionId - 事务ID
   * @returns {Promise<void>}
   */
  async commitTransaction(transactionId) {
    const transactionInfo = this._getTransactionInfo(transactionId);
    
    try {
      // 根据不同的数据库驱动提交事务
      if (this.options.driver.toLowerCase().includes('mysql')) {
        await transactionInfo.transaction.commit();
        transactionInfo.transaction.release();
      } else if (this.options.driver.toLowerCase().includes('postgres')) {
        await transactionInfo.transaction.query('COMMIT');
        transactionInfo.transaction.release();
      } else if (this.options.driver.toLowerCase().includes('sqlite')) {
        await transactionInfo.transaction.run('COMMIT TRANSACTION');
      } else {
        await this._executeQuery('COMMIT TRANSACTION', [], { transaction: transactionInfo.transaction });
      }
      
      const duration = performance.now() - transactionInfo.startTime;
      this._recordOperationStats(OperationType.TRANSACTION, duration);
      
      logger.debug('事务已提交', { transactionId, duration, queryCount: transactionInfo.queries.length });
      this.emit('transaction.commit', { transactionId, duration });
      
      // 清理事务信息
      this.activeTransactions.delete(transactionId);
    } catch (error) {
      logger.error('提交事务失败', { transactionId, error: error.message });
      this.emit('transaction.error', { transactionId, error });
      throw error;
    }
  }

  /**
   * 回滚事务
   * @param {string} transactionId - 事务ID
   * @returns {Promise<void>}
   */
  async rollbackTransaction(transactionId) {
    const transactionInfo = this._getTransactionInfo(transactionId);
    
    try {
      // 根据不同的数据库驱动回滚事务
      if (this.options.driver.toLowerCase().includes('mysql')) {
        await transactionInfo.transaction.rollback();
        transactionInfo.transaction.release();
      } else if (this.options.driver.toLowerCase().includes('postgres')) {
        await transactionInfo.transaction.query('ROLLBACK');
        transactionInfo.transaction.release();
      } else if (this.options.driver.toLowerCase().includes('sqlite')) {
        await transactionInfo.transaction.run('ROLLBACK TRANSACTION');
      } else {
        await this._executeQuery('ROLLBACK TRANSACTION', [], { transaction: transactionInfo.transaction });
      }
      
      logger.debug('事务已回滚', { transactionId });
      this.emit('transaction.rollback', { transactionId });
      
      // 清理事务信息
      this.activeTransactions.delete(transactionId);
    } catch (error) {
      logger.error('回滚事务失败', { transactionId, error: error.message });
      this.emit('transaction.error', { transactionId, error });
      throw error;
    }
  }

  /**
   * 在事务中执行操作
   * @param {Function} callback - 事务回调函数
   * @param {Object} options - 事务选项
   * @returns {Promise<*>} 回调函数的返回值
   */
  async withTransaction(callback, options = {}) {
    const transactionId = await this.beginTransaction(options);
    
    try {
      const transaction = this.activeTransactions.get(transactionId).transaction;
      const result = await callback(transactionId, transaction);
      await this.commitTransaction(transactionId);
      return result;
    } catch (error) {
      await this.rollbackTransaction(transactionId);
      throw error;
    }
  }

  /**
   * 执行带事务的查询
   * @param {string} transactionId - 事务ID
   * @param {string} query - SQL查询语句
   * @param {Array} params - 查询参数
   * @param {Object} options - 查询选项
   * @returns {Promise<*>}
   */
  async queryWithTransaction(transactionId, query, params = [], options = {}) {
    const transactionInfo = this._getTransactionInfo(transactionId);
    
    // 记录查询
    transactionInfo.queries.push({ query, params, timestamp: Date.now() });
    
    // 使用事务执行查询
    options.transaction = transactionInfo.transaction;
    return this._executeQuery(query, params, options);
  }

  /**
   * 获取事务信息
   * @param {string} transactionId - 事务ID
   * @returns {Object} 事务信息
   * @private
   */
  _getTransactionInfo(transactionId) {
    const transactionInfo = this.activeTransactions.get(transactionId);
    
    if (!transactionInfo) {
      throw new Error(`事务不存在或已结束: ${transactionId}`);
    }
    
    return transactionInfo;
  }

  /**
   * 确保数据库已连接
   * @private
   * @returns {Promise<void>}
   */
  async _ensureConnected() {
    if (this.connectionStatus !== ConnectionStatus.CONNECTED) {
      await this.connect();
    }
  }

  /**
   * 执行数据库查询
   * @param {string} query - SQL查询语句
   * @param {Array} params - 查询参数
   * @param {Object} options - 查询选项
   * @returns {Promise<*>}
   * @private
   */
  async _executeQuery(query, params, options = {}) {
    // 检查是否有事务
    if (options.transaction) {
      return this._executeQueryWithTransaction(options.transaction, query, params, options);
    }

    // 使用连接池或连接执行查询
    if (this.connectionPool) {
      return this._executeQueryWithPool(query, params, options);
    } else if (this.connection) {
      return this._executeQueryWithConnection(query, params, options);
    } else {
      throw new Error('数据库未连接');
    }
  }

  /**
   * 使用连接池执行查询
   * @param {string} query - SQL查询语句
   * @param {Array} params - 查询参数
   * @param {Object} options - 查询选项
   * @returns {Promise<*>}
   * @private
   */
  async _executeQueryWithPool(query, params, options) {
    // 根据不同的数据库驱动执行查询
    if (this.options.driver.toLowerCase().includes('mysql')) {
      const [rows] = await this.connectionPool.execute(query, params);
      return rows;
    } else if (this.options.driver.toLowerCase().includes('postgres')) {
      const result = await this.connectionPool.query(query, params);
      return result.rows;
    } else if (this.options.driver.toLowerCase().includes('sqlite')) {
      return this.connection.all(query, params);
    } else {
      // 默认查询方式
      return this.connectionPool.query(query, params);
    }
  }

  /**
   * 使用连接执行查询
   * @param {string} query - SQL查询语句
   * @param {Array} params - 查询参数
   * @param {Object} options - 查询选项
   * @returns {Promise<*>}
   * @private
   */
  async _executeQueryWithConnection(query, params, options) {
    // 根据不同的数据库驱动执行查询
    if (this.options.driver.toLowerCase().includes('mysql')) {
      const [rows] = await this.connection.execute(query, params);
      return rows;
    } else if (this.options.driver.toLowerCase().includes('postgres')) {
      const result = await this.connection.query(query, params);
      return result.rows;
    } else if (this.options.driver.toLowerCase().includes('sqlite')) {
      return this.connection.all(query, params);
    } else if (this.options.driver.toLowerCase().includes('mongo')) {
      // MongoDB特殊处理
      return this.connection.execute(query, params, options);
    } else {
      // 默认查询方式
      return this.connection.query(query, params);
    }
  }

  /**
   * 使用事务执行查询
   * @param {Object} transaction - 事务对象
   * @param {string} query - SQL查询语句
   * @param {Array} params - 查询参数
   * @param {Object} options - 查询选项
   * @returns {Promise<*>}
   * @private
   */
  async _executeQueryWithTransaction(transaction, query, params, options) {
    // 根据不同的数据库驱动执行查询
    if (this.options.driver.toLowerCase().includes('mysql')) {
      const [rows] = await transaction.execute(query, params);
      return rows;
    } else if (this.options.driver.toLowerCase().includes('postgres')) {
      const result = await transaction.query(query, params);
      return result.rows;
    } else if (this.options.driver.toLowerCase().includes('sqlite')) {
      return transaction.all(query, params);
    } else {
      // 默认查询方式
      return transaction.query(query, params);
    }
  }

  /**
   * 记录查询日志
   * @param {string} query - SQL查询语句
   * @param {Array} params - 查询参数
   * @param {number} duration - 执行时间
   * @param {Error} error - 错误信息
   * @private
   */
  _logQuery(query, params, duration, error) {
    if (!this.options.enableLogging) return;

    const logData = {
      query: this._sanitizeQuery(query),
      params: this._sanitizeParams(params),
      duration,
      requestId: logContext.getRequestId(),
      userId: logContext.getUserId()
    };

    if (error) {
      logger.error('数据库查询失败', { ...logData, error: error.message });
    } else if (duration > 500) { // 慢查询日志
      logger.warn('数据库慢查询', logData);
    } else {
      logger.debug('数据库查询执行', logData);
    }
  }

  /**
   * 清理查询语句，移除敏感信息
   * @param {string} query - SQL查询语句
   * @returns {string} 清理后的查询语句
   * @private
   */
  _sanitizeQuery(query) {
    // 移除多余的空格和换行
    return query.replace(/\s+/g, ' ').trim();
  }

  /**
   * 清理查询参数，移除敏感信息
   * @param {Array} params - 查询参数
   * @returns {Array} 清理后的查询参数
   * @private
   */
  _sanitizeParams(params) {
    // 如果参数包含可能的敏感信息，可以在这里进行清理
    // 例如密码字段可以被替换为 ****
    if (!Array.isArray(params)) return params;
    
    return params.map(param => {
      // 检查是否是对象
      if (typeUtils.isObject(param)) {
        const sanitized = { ...param };
        // 清理常见的敏感字段
        ['password', 'token', 'secret', 'key'].forEach(field => {
          if (sanitized[field] !== undefined) {
            sanitized[field] = '****';
          }
        });
        return sanitized;
      }
      return param;
    });
  }

  /**
   * 记录操作统计
   * @param {string} type - 操作类型
   * @param {number} duration - 执行时间
   * @private
   */
  _recordOperationStats(type, duration) {
    if (!this.options.enableMetrics) return;

    if (this.operationStats[type]) {
      this.operationStats[type].count++;
      this.operationStats[type].totalTime += duration;
    }

    // 记录到性能监控工具
    performanceUtils.recordTimer(`db.${type}`, duration);
    performanceUtils.incrementCounter(`db.${type}.count`);
  }

  /**
   * 执行带重试机制的操作
   * @param {string} type - 操作类型
   * @param {Function} operation - 操作函数
   * @returns {Promise<*>}
   * @private
   */
  async _executeOperation(type, operation) {
    let lastError;

    for (let attempt = 0; attempt < this.options.retryCount; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        // 判断是否需要重试（如连接错误）
        const shouldRetry = this._shouldRetryOperation(error);
        
        if (attempt === this.options.retryCount - 1 || !shouldRetry) {
          throw error;
        }

        const delay = this.options.retryDelay * Math.pow(2, attempt); // 指数退避
        logger.warn(`数据库操作失败，尝试重试 (${attempt + 1}/${this.options.retryCount})`, {
          type,
          error: error.message,
          delay
        });

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  /**
   * 判断是否应该重试操作
   * @param {Error} error - 错误信息
   * @returns {boolean} 是否重试
   * @private
   */
  _shouldRetryOperation(error) {
    // 根据错误类型判断是否需要重试
    const retryableErrors = [
      'connection lost',
      'connection timeout',
      'deadlock',
      'lock wait timeout',
      'too many connections'
    ];

    const errorMessage = error.message.toLowerCase();
    return retryableErrors.some(msg => errorMessage.includes(msg));
  }

  /**
   * 获取操作统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    // 计算平均值
    const stats = { ...this.operationStats };
    
    Object.keys(stats).forEach(key => {
      if (stats[key].count && stats[key].totalTime) {
        stats[key].avgTime = stats[key].totalTime / stats[key].count;
      }
    });

    return stats;
  }

  /**
   * 创建数据库连接池
   * @param {Object} options - 池配置
   * @returns {Promise<Object>} 连接池
   */
  async createPool(options = {}) {
    // 根据驱动类型创建连接池
    // 此方法可以用于需要单独管理连接池的场景
    // 具体实现可以根据需要扩展
    throw new Error('createPool 方法需要根据具体的数据库驱动实现');
  }

  /**
   * 静态实例
   * @private
   */
  static _instance = null;

  /**
   * 获取单例实例
   * @param {Object} options - 配置选项
   * @returns {DatabaseUtils} 数据库工具实例
   */
  static getInstance(options = {}) {
    if (!DatabaseUtils._instance) {
      DatabaseUtils._instance = new DatabaseUtils(options);
    }
    return DatabaseUtils._instance;
  }

  /**
   * 创建新的数据库工具实例
   * @param {Object} options - 配置选项
   * @returns {DatabaseUtils} 数据库工具实例
   */
  static create(options = {}) {
    return new DatabaseUtils(options);
  }
}

// 导出常量
module.exports.ConnectionStatus = ConnectionStatus;
module.exports.OperationType = OperationType;

// 创建默认实例
const defaultDatabaseUtils = DatabaseUtils.getInstance();

module.exports = {
  DatabaseUtils,
  databaseUtils: defaultDatabaseUtils
};