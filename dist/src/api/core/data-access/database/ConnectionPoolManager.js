/**
 * 数据库连接池管理器
 * 提供高级数据库连接池管理、监控和优化功能
 */

const mysql = require('mysql2/promise');
const logger = require('../../utils/logger');
const { AppError } = require('../../exception/handlers/errorHandler');

/**
 * 数据库连接池管理器
 */
class ConnectionPoolManager {
  constructor() {
    this.logger = logger;
    this.pools = new Map(); // 存储多个连接池
    this.metrics = new Map(); // 连接池性能指标
    this.connectionLimits = {
      max: 100,
      min: 2,
      idle: 60000 // 空闲连接超时时间（毫秒）
    };
    this.retryConfig = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000
    };
    this.logger.info('数据库连接池管理器初始化');
  }

  /**
   * 初始化数据库连接池
   * @param {string} poolId - 连接池ID
   * @param {Object} config - 连接池配置
   * @returns {Promise<mysql.Pool>} 连接池实例
   */
  async initializePool(poolId, config) {
    try {
      if (this.pools.has(poolId)) {
        this.logger.warn(`连接池 ${poolId} 已存在，跳过初始化`);
        return this.pools.get(poolId);
      }

      // 合并默认配置和用户配置
      const poolConfig = {
        ...this._getDefaultPoolConfig(),
        ...config
      };

      // 创建连接池
      const pool = mysql.createPool(poolConfig);
      this.pools.set(poolId, pool);
      
      // 初始化指标记录
      this.metrics.set(poolId, {
        connectionsCreated: 0,
        connectionsDestroyed: 0,
        queryCount: 0,
        errorCount: 0,
        avgQueryTime: 0,
        totalQueryTime: 0,
        peakConnections: 0,
        createdAt: new Date().toISOString()
      });

      // 设置连接事件监听
      this._setupPoolListeners(poolId, pool);

      // 测试连接
      await this._testPoolConnection(pool);

      this.logger.info(`连接池 ${poolId} 初始化成功`, {
        host: poolConfig.host,
        port: poolConfig.port,
        database: poolConfig.database,
        max: poolConfig.connectionLimit,
        min: poolConfig.waitForConnections ? poolConfig.connectionLimit : 0
      });

      return pool;
    } catch (error) {
      this.logger.error(`连接池 ${poolId} 初始化失败`, { error, config });
      throw new AppError('数据库连接初始化失败', 500, error);
    }
  }

  /**
   * 获取连接池
   * @param {string} poolId - 连接池ID
   * @returns {mysql.Pool} 连接池实例
   * @throws {Error} 如果连接池不存在
   */
  getPool(poolId) {
    const pool = this.pools.get(poolId);
    if (!pool) {
      throw new Error(`连接池 ${poolId} 不存在`);
    }
    return pool;
  }

  /**
   * 从连接池获取数据库连接
   * @param {string} poolId - 连接池ID
   * @param {Object} options - 连接选项
   * @returns {Promise<mysql.PoolConnection>} 数据库连接
   */
  async getConnection(poolId, options = {}) {
    const startTime = Date.now();
    const pool = this.getPool(poolId);
    
    try {
      const connection = await this._withRetry(async () => {
        return await pool.getConnection(options);
      }, poolId);

      this._recordConnectionMetrics(poolId);
      this.logger.debug(`从连接池 ${poolId} 获取连接成功，耗时 ${Date.now() - startTime}ms`);
      
      // 包装连接以记录查询性能
      return this._wrapConnection(connection, poolId);
    } catch (error) {
      this.logger.error(`从连接池 ${poolId} 获取连接失败`, { error, options });
      throw new AppError('数据库连接获取失败', 500, error);
    }
  }

  /**
   * 执行查询（自动管理连接）
   * @param {string} poolId - 连接池ID
   * @param {string} sql - SQL语句
   * @param {Array} params - 查询参数
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} 查询结果
   */
  async executeQuery(poolId, sql, params = [], options = {}) {
    let connection = null;
    const startTime = Date.now();
    
    try {
      // 获取连接
      connection = await this.getConnection(poolId, options.connectionOptions);
      
      // 执行查询
      const result = await this._withRetry(async () => {
        return await connection.execute(sql, params, options.queryOptions);
      }, poolId);

      // 记录查询指标
      this._recordQueryMetrics(poolId, Date.now() - startTime, true);
      
      this.logger.debug(`查询执行成功`, {
        poolId,
        query: sql,
        params: this._maskSensitiveParams(params),
        duration: Date.now() - startTime,
        affectedRows: result[0]?.affectedRows || 0
      });

      return result;
    } catch (error) {
      // 记录错误指标
      this._recordQueryMetrics(poolId, Date.now() - startTime, false, error);
      
      this.logger.error(`查询执行失败`, {
        poolId,
        query: sql,
        params: this._maskSensitiveParams(params),
        error: error.message
      });
      
      throw new AppError('数据库查询执行失败', 500, error);
    } finally {
      // 释放连接
      if (connection) {
        try {
          await connection.release();
        } catch (releaseError) {
          this.logger.error(`释放连接失败`, { poolId, error: releaseError });
        }
      }
    }
  }

  /**
   * 执行事务
   * @param {string} poolId - 连接池ID
   * @param {Function} callback - 事务回调函数
   * @param {Object} options - 事务选项
   * @returns {Promise<any>} 事务结果
   */
  async executeTransaction(poolId, callback, options = {}) {
    let connection = null;
    const startTime = Date.now();
    const transactionId = this._generateTransactionId();
    
    try {
      // 获取连接
      connection = await this.getConnection(poolId, { ...options.connectionOptions, transaction: true });
      
      // 开始事务
      await connection.beginTransaction(options.beginTransactionOptions);
      this.logger.debug(`事务开始`, { poolId, transactionId });
      
      try {
        // 执行事务逻辑
        const result = await callback(connection);
        
        // 提交事务
        await connection.commit(options.commitOptions);
        this.logger.debug(`事务提交成功`, { poolId, transactionId, duration: Date.now() - startTime });
        
        return result;
      } catch (transactionError) {
        // 回滚事务
        try {
          await connection.rollback(options.rollbackOptions);
          this.logger.warn(`事务回滚成功`, { poolId, transactionId, error: transactionError.message });
        } catch (rollbackError) {
          this.logger.error(`事务回滚失败`, { poolId, transactionId, error: rollbackError });
        }
        
        throw transactionError;
      }
    } catch (error) {
      this.logger.error(`事务执行失败`, { poolId, transactionId, error });
      throw new AppError('数据库事务执行失败', 500, error);
    } finally {
      // 释放连接
      if (connection) {
        try {
          await connection.release();
        } catch (releaseError) {
          this.logger.error(`释放事务连接失败`, { poolId, transactionId, error: releaseError });
        }
      }
    }
  }

  /**
   * 获取连接池状态
   * @param {string} poolId - 连接池ID
   * @returns {Object} 连接池状态信息
   */
  getPoolStatus(poolId) {
    const pool = this.getPool(poolId);
    const metrics = this.metrics.get(poolId) || {};
    
    // 获取连接池统计信息（如果支持）
    const poolStats = pool.pool ? {
      size: pool.pool._allConnections.length,
      free: pool.pool._freeConnections.length,
      pending: pool.pool._pendingConnections.length,
      max: pool.pool.config.connectionLimit
    } : {};

    return {
      poolId,
      metrics: {
        ...metrics,
        uptime: this._calculateUptime(metrics.createdAt),
        connections: poolStats
      },
      health: this._calculateHealth(poolStats)
    };
  }

  /**
   * 获取所有连接池状态
   * @returns {Array} 所有连接池的状态信息
   */
  getAllPoolsStatus() {
    return Array.from(this.pools.keys()).map(poolId => 
      this.getPoolStatus(poolId)
    );
  }

  /**
   * 调整连接池大小
   * @param {string} poolId - 连接池ID
   * @param {number} newSize - 新的连接池大小
   */
  resizePool(poolId, newSize) {
    const pool = this.getPool(poolId);
    
    if (!pool.pool) {
      throw new Error('连接池不支持动态调整大小');
    }

    if (newSize < this.connectionLimits.min) {
      this.logger.warn(`连接池大小不能小于最小值 ${this.connectionLimits.min}，已调整为最小值`);
      newSize = this.connectionLimits.min;
    }

    if (newSize > this.connectionLimits.max) {
      this.logger.warn(`连接池大小不能大于最大值 ${this.connectionLimits.max}，已调整为最大值`);
      newSize = this.connectionLimits.max;
    }

    pool.pool.config.connectionLimit = newSize;
    this.logger.info(`连接池 ${poolId} 大小已调整为 ${newSize}`);
  }

  /**
   * 刷新连接池（关闭并重新创建所有连接）
   * @param {string} poolId - 连接池ID
   * @returns {Promise<void>}
   */
  async refreshPool(poolId) {
    const pool = this.getPool(poolId);
    
    try {
      this.logger.info(`开始刷新连接池 ${poolId}`);
      
      // 关闭当前连接池
      await pool.end();
      
      // 获取原始配置
      const originalConfig = pool.pool?.config;
      
      // 移除旧的连接池和指标
      this.pools.delete(poolId);
      
      // 重新创建连接池
      if (originalConfig) {
        await this.initializePool(poolId, originalConfig);
        this.logger.info(`连接池 ${poolId} 刷新成功`);
      } else {
        throw new Error('无法获取原始连接池配置');
      }
    } catch (error) {
      this.logger.error(`刷新连接池 ${poolId} 失败`, { error });
      throw new AppError('数据库连接池刷新失败', 500, error);
    }
  }

  /**
   * 关闭指定连接池
   * @param {string} poolId - 连接池ID
   * @returns {Promise<void>}
   */
  async closePool(poolId) {
    if (!this.pools.has(poolId)) {
      this.logger.warn(`连接池 ${poolId} 不存在，无需关闭`);
      return;
    }

    const pool = this.getPool(poolId);
    
    try {
      await pool.end();
      this.pools.delete(poolId);
      this.metrics.delete(poolId);
      this.logger.info(`连接池 ${poolId} 已成功关闭`);
    } catch (error) {
      this.logger.error(`关闭连接池 ${poolId} 失败`, { error });
      throw new Error(`关闭连接池失败: ${error.message}`);
    }
  }

  /**
   * 关闭所有连接池
   * @returns {Promise<void>}
   */
  async closeAllPools() {
    const poolIds = Array.from(this.pools.keys());
    const closePromises = poolIds.map(poolId => this.closePool(poolId));
    
    await Promise.allSettled(closePromises);
    this.logger.info(`所有连接池已关闭，共 ${poolIds.length} 个`);
  }

  /**
   * 获取默认连接池配置
   * @private
   * @returns {Object} 默认配置
   */
  _getDefaultPoolConfig() {
    return {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      idleTimeout: this.connectionLimits.idle,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
      decimalNumbers: true,
      namedPlaceholders: true
    };
  }

  /**
   * 设置连接池事件监听
   * @private
   * @param {string} poolId - 连接池ID
   * @param {mysql.Pool} pool - 连接池实例
   */
  _setupPoolListeners(poolId, pool) {
    if (!pool.on) return;

    pool.on('connection', (connection) => {
      this.logger.debug(`连接池 ${poolId} 创建新连接`, { threadId: connection.threadId });
      const metrics = this.metrics.get(poolId);
      if (metrics) {
        metrics.connectionsCreated += 1;
        const currentConnections = pool.pool?._allConnections.length || 1;
        metrics.peakConnections = Math.max(metrics.peakConnections, currentConnections);
      }
    });

    pool.on('release', (connection) => {
      this.logger.debug(`连接池 ${poolId} 释放连接`, { threadId: connection.threadId });
    });

    pool.on('enqueue', () => {
      this.logger.debug(`连接池 ${poolId} 所有连接已用尽，请求排队`);
    });
  }

  /**
   * 测试连接池连接
   * @private
   * @param {mysql.Pool} pool - 连接池实例
   * @returns {Promise<void>}
   */
  async _testPoolConnection(pool) {
    const connection = await pool.getConnection();
    try {
      await connection.query('SELECT 1');
      this.logger.debug('连接池测试连接成功');
    } finally {
      connection.release();
    }
  }

  /**
   * 重试执行函数
   * @private
   * @param {Function} fn - 要执行的函数
   * @param {string} poolId - 连接池ID
   * @returns {Promise<any>} 函数执行结果
   */
  async _withRetry(fn, poolId) {
    let lastError;
    
    for (let attempt = 0; attempt < this.retryConfig.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        // 检查是否是可重试的错误类型
        if (!this._isRetryableError(error)) {
          throw error;
        }

        const delay = Math.min(
          this.retryConfig.baseDelay * Math.pow(2, attempt),
          this.retryConfig.maxDelay
        );

        this.logger.warn(`操作失败，将在 ${delay}ms 后重试（尝试 ${attempt + 1}/${this.retryConfig.maxRetries}）`, {
          poolId,
          error: error.message
        });

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  /**
   * 检查错误是否可重试
   * @private
   * @param {Error} error - 错误对象
   * @returns {boolean} 是否可重试
   */
  _isRetryableError(error) {
    const retryableErrorCodes = [
      'ECONNREFUSED',
      'ECONNRESET',
      'ETIMEDOUT',
      'PROTOCOL_CONNECTION_LOST',
      'ER_CON_COUNT_ERROR',
      'ER_BAD_DB_ERROR'
    ];

    return retryableErrorCodes.includes(error.code) || 
           error.message?.includes('timeout');
  }

  /**
   * 包装连接以记录查询性能
   * @private
   * @param {mysql.PoolConnection} connection - 原始连接
   * @param {string} poolId - 连接池ID
   * @returns {mysql.PoolConnection} 包装后的连接
   */
  _wrapConnection(connection, poolId) {
    const originalExecute = connection.execute;
    const originalQuery = connection.query;
    
    connection.execute = async (...args) => {
      const startTime = Date.now();
      try {
        const result = await originalExecute.apply(connection, args);
        this._recordQueryMetrics(poolId, Date.now() - startTime, true);
        return result;
      } catch (error) {
        this._recordQueryMetrics(poolId, Date.now() - startTime, false, error);
        throw error;
      }
    };

    connection.query = async (...args) => {
      const startTime = Date.now();
      try {
        const result = await originalQuery.apply(connection, args);
        this._recordQueryMetrics(poolId, Date.now() - startTime, true);
        return result;
      } catch (error) {
        this._recordQueryMetrics(poolId, Date.now() - startTime, false, error);
        throw error;
      }
    };

    return connection;
  }

  /**
   * 记录连接指标
   * @private
   * @param {string} poolId - 连接池ID
   */
  _recordConnectionMetrics(poolId) {
    const metrics = this.metrics.get(poolId);
    if (metrics) {
      // 可以在这里添加更多连接相关的指标
    }
  }

  /**
   * 记录查询指标
   * @private
   * @param {string} poolId - 连接池ID
   * @param {number} duration - 查询耗时
   * @param {boolean} success - 是否成功
   * @param {Error} error - 错误对象（如果有）
   */
  _recordQueryMetrics(poolId, duration, success, error = null) {
    const metrics = this.metrics.get(poolId);
    if (metrics) {
      metrics.queryCount += 1;
      metrics.totalQueryTime += duration;
      metrics.avgQueryTime = metrics.totalQueryTime / metrics.queryCount;
      
      if (!success) {
        metrics.errorCount += 1;
      }
    }
  }

  /**
   * 计算连接池健康度
   * @private
   * @param {Object} poolStats - 连接池统计信息
   * @returns {Object} 健康度信息
   */
  _calculateHealth(poolStats) {
    if (!poolStats || !poolStats.max) {
      return { status: 'unknown', score: 0 };
    }

    const usagePercentage = (poolStats.size / poolStats.max) * 100;
    let status = 'healthy';
    let score = 100;

    if (usagePercentage > 80) {
      status = 'warning';
      score = 60;
    }

    if (usagePercentage > 95) {
      status = 'critical';
      score = 30;
    }

    return { status, score, usagePercentage };
  }

  /**
   * 计算运行时间
   * @private
   * @param {string} createdAt - 创建时间
   * @returns {number} 运行时间（秒）
   */
  _calculateUptime(createdAt) {
    if (!createdAt) return 0;
    return Math.floor((new Date() - new Date(createdAt)) / 1000);
  }

  /**
   * 生成事务ID
   * @private
   * @returns {string} 事务ID
   */
  _generateTransactionId() {
    return `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 掩码敏感参数
   * @private
   * @param {Array} params - 查询参数
   * @returns {Array} 掩码后的参数
   */
  _maskSensitiveParams(params) {
    if (!Array.isArray(params)) return params;
    
    return params.map(param => {
      if (typeof param === 'string') {
        // 简单的敏感信息检测
        if (param.length > 20 && /^\d+$/.test(param)) {
          return '***masked***';
        }
      }
      return param;
    });
  }
}

// 创建单例实例
const connectionPoolManager = new ConnectionPoolManager();

module.exports = {
  ConnectionPoolManager,
  connectionPoolManager
};