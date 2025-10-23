/**
 * 数据库事务管理器
 * 提供事务控制和原子操作功能
 */

const logger = require('../../utils/logger');
const { AppError } = require('../../exception/handlers/errorHandler');
const { TransactionError } = require('../../exception/handlers/errorHandler');
const { EventBus } = require('../../events/EventBus');
const { TimerUtils } = require('../../utils/timer/TimerUtils');

/**
 * 事务隔离级别
 */
const IsolationLevel = {
  READ_UNCOMMITTED: 'READ UNCOMMITTED',
  READ_COMMITTED: 'READ COMMITTED',
  REPEATABLE_READ: 'REPEATABLE READ',
  SERIALIZABLE: 'SERIALIZABLE',
  SNAPSHOT: 'SNAPSHOT'
};

/**
 * 事务状态
 */
const TransactionState = {
  IDLE: 'idle',
  STARTING: 'starting',
  ACTIVE: 'active',
  COMMITTING: 'committing',
  ROLLED_BACK: 'rolled_back',
  COMMITTED: 'committed',
  FAILED: 'failed'
};

/**
 * 事务事件类型
 */
const TransactionEvent = {
  START: 'transaction.start',
  COMMIT: 'transaction.commit',
  ROLLBACK: 'transaction.rollback',
  ERROR: 'transaction.error',
  TIMEOUT: 'transaction.timeout',
  COMPLETE: 'transaction.complete'
};

/**
 * 事务管理器
 */
class TransactionManager {
  /**
   * 构造函数
   * @param {Object} connectionPool - 数据库连接池
   * @param {Object} options - 配置选项
   */
  constructor(connectionPool, options = {}) {
    this.connectionPool = connectionPool;
    this.options = {
      defaultIsolationLevel: IsolationLevel.READ_COMMITTED,
      defaultTimeout: 30000, // 默认30秒超时
      maxRetries: 3,
      retryDelay: 1000,
      enableEvents: true,
      ...options
    };

    this.activeTransactions = new Map();
    this.eventBus = EventBus.getInstance();
    this.timerUtils = TimerUtils.getInstance();

    logger.info('事务管理器初始化完成', { options: this.options });
  }

  /**
   * 开始事务
   * @param {Object} options - 事务选项
   * @returns {Promise<Object>} 事务对象
   */
  async beginTransaction(options = {}) {
    const transactionId = this._generateTransactionId();
    const { isolationLevel, timeout, name } = {
      isolationLevel: this.options.defaultIsolationLevel,
      timeout: this.options.defaultTimeout,
      name: `transaction_${transactionId}`,
      ...options
    };

    logger.debug('开始事务', {
      transactionId,
      isolationLevel,
      timeout,
      name
    });

    try {
      // 从连接池获取连接
      const connection = await this._getConnectionFromPool();
      
      // 创建事务对象
      const transaction = {
        id: transactionId,
        connection,
        state: TransactionState.STARTING,
        startTime: Date.now(),
        isolationLevel,
        timeout,
        name,
        timeoutTimer: null,
        operations: 0,
        error: null
      };

      // 设置隔离级别
      if (isolationLevel && connection.setIsolationLevel) {
        await connection.setIsolationLevel(isolationLevel);
      } else if (isolationLevel && connection.query) {
        await connection.query(`SET TRANSACTION ISOLATION LEVEL ${isolationLevel}`);
      }

      // 开始事务
      if (connection.beginTransaction) {
        await connection.beginTransaction();
      } else if (connection.query) {
        await connection.query('START TRANSACTION');
      } else {
        throw new AppError('不支持的连接接口', {
          code: 'UNSUPPORTED_CONNECTION_INTERFACE',
          status: 500
        });
      }

      // 更新事务状态
      transaction.state = TransactionState.ACTIVE;
      this.activeTransactions.set(transactionId, transaction);

      // 设置事务超时
      if (timeout > 0) {
        transaction.timeoutTimer = this.timerUtils.setTimeout(() => {
          this._handleTransactionTimeout(transaction);
        }, timeout);
      }

      // 触发事务开始事件
      this._emitEvent(TransactionEvent.START, {
        transactionId,
        isolationLevel,
        name,
        timestamp: new Date()
      });

      logger.debug('事务开始成功', { transactionId });
      return transaction;
    } catch (error) {
      logger.error('开始事务失败', { transactionId, error: error.message });
      throw new TransactionError('开始事务失败', error, {
        transactionId,
        isolationLevel
      });
    }
  }

  /**
   * 提交事务
   * @param {Object} transaction - 事务对象
   * @returns {Promise<void>}
   */
  async commit(transaction) {
    const { id: transactionId } = transaction;

    if (!transaction || !this.activeTransactions.has(transactionId)) {
      throw new AppError('无效的事务对象', {
        code: 'INVALID_TRANSACTION',
        status: 400
      });
    }

    if (transaction.state !== TransactionState.ACTIVE) {
      throw new AppError(`事务状态不允许提交: ${transaction.state}`, {
        code: 'INVALID_TRANSACTION_STATE',
        status: 400
      });
    }

    logger.debug('提交事务', { transactionId });
    transaction.state = TransactionState.COMMITTING;

    try {
      // 清除超时定时器
      this._clearTransactionTimeout(transaction);

      // 提交事务
      if (transaction.connection.commit) {
        await transaction.connection.commit();
      } else if (transaction.connection.query) {
        await transaction.connection.query('COMMIT');
      } else {
        throw new AppError('不支持的连接接口', {
          code: 'UNSUPPORTED_CONNECTION_INTERFACE',
          status: 500
        });
      }

      // 更新事务状态
      transaction.state = TransactionState.COMMITTED;
      transaction.endTime = Date.now();
      transaction.duration = transaction.endTime - transaction.startTime;

      // 从活动事务列表中移除
      this.activeTransactions.delete(transactionId);

      // 释放连接
      await this._releaseConnection(transaction.connection);

      // 触发事务提交事件
      this._emitEvent(TransactionEvent.COMMIT, {
        transactionId,
        duration: transaction.duration,
        operations: transaction.operations,
        timestamp: new Date()
      });

      // 触发事务完成事件
      this._emitEvent(TransactionEvent.COMPLETE, {
        transactionId,
        success: true,
        duration: transaction.duration,
        timestamp: new Date()
      });

      logger.debug('事务提交成功', { transactionId, duration: transaction.duration });
    } catch (error) {
      transaction.state = TransactionState.FAILED;
      transaction.error = error;

      logger.error('事务提交失败', { transactionId, error: error.message });

      // 触发事务错误事件
      this._emitEvent(TransactionEvent.ERROR, {
        transactionId,
        error: error.message,
        timestamp: new Date()
      });

      // 触发事务完成事件
      this._emitEvent(TransactionEvent.COMPLETE, {
        transactionId,
        success: false,
        error: error.message,
        timestamp: new Date()
      });

      throw new TransactionError('提交事务失败', error, {
        transactionId
      });
    } finally {
      // 确保连接被释放
      if (transaction.connection && transaction.state !== TransactionState.COMMITTED) {
        try {
          await this._releaseConnection(transaction.connection);
        } catch (e) {
          logger.error('释放连接失败', { transactionId, error: e.message });
        }
      }
    }
  }

  /**
   * 回滚事务
   * @param {Object} transaction - 事务对象
   * @returns {Promise<void>}
   */
  async rollback(transaction) {
    const { id: transactionId } = transaction;

    if (!transaction || !this.activeTransactions.has(transactionId)) {
      logger.warn('尝试回滚无效的事务', { transactionId });
      return;
    }

    if (transaction.state === TransactionState.COMMITTED || 
        transaction.state === TransactionState.ROLLED_BACK) {
      logger.warn(`事务状态不允许回滚: ${transaction.state}`, { transactionId });
      return;
    }

    logger.debug('回滚事务', { transactionId });

    try {
      // 清除超时定时器
      this._clearTransactionTimeout(transaction);

      // 回滚事务
      if (transaction.connection.rollback) {
        await transaction.connection.rollback();
      } else if (transaction.connection.query) {
        await transaction.connection.query('ROLLBACK');
      } else {
        logger.warn('不支持的连接接口，无法显式回滚', { transactionId });
      }

      // 更新事务状态
      transaction.state = TransactionState.ROLLED_BACK;
      transaction.endTime = Date.now();
      transaction.duration = transaction.endTime - transaction.startTime;

      // 从活动事务列表中移除
      this.activeTransactions.delete(transactionId);

      // 释放连接
      await this._releaseConnection(transaction.connection);

      // 触发事务回滚事件
      this._emitEvent(TransactionEvent.ROLLBACK, {
        transactionId,
        duration: transaction.duration,
        operations: transaction.operations,
        timestamp: new Date()
      });

      // 触发事务完成事件
      this._emitEvent(TransactionEvent.COMPLETE, {
        transactionId,
        success: false,
        rolledBack: true,
        duration: transaction.duration,
        timestamp: new Date()
      });

      logger.debug('事务回滚成功', { transactionId, duration: transaction.duration });
    } catch (error) {
      logger.error('事务回滚失败', { transactionId, error: error.message });

      // 触发事务错误事件
      this._emitEvent(TransactionEvent.ERROR, {
        transactionId,
        error: error.message,
        timestamp: new Date()
      });
    } finally {
      // 确保连接被释放
      if (transaction.connection) {
        try {
          await this._releaseConnection(transaction.connection);
        } catch (e) {
          logger.error('释放连接失败', { transactionId, error: e.message });
        }
      }

      // 确保从活动事务列表中移除
      if (this.activeTransactions.has(transactionId)) {
        this.activeTransactions.delete(transactionId);
      }
    }
  }

  /**
   * 在事务中执行操作
   * @param {Function} operation - 要执行的操作函数
   * @param {Object} options - 事务选项
   * @returns {Promise<any>} 操作结果
   */
  async executeInTransaction(operation, options = {}) {
    const { retries = 0, retryDelay = this.options.retryDelay } = options;
    let transaction = null;

    try {
      // 开始事务
      transaction = await this.beginTransaction(options);

      // 执行操作
      const result = await operation(transaction.connection, transaction);

      // 提交事务
      await this.commit(transaction);

      return result;
    } catch (error) {
      // 回滚事务
      if (transaction) {
        await this.rollback(transaction);
      }

      // 处理重试逻辑
      if (retries < this.options.maxRetries && this._isRetryableError(error)) {
        logger.debug(`事务操作失败，准备重试 (${retries + 1}/${this.options.maxRetries})`, {
          error: error.message,
          retryDelay
        });

        // 延迟后重试
        await this.timerUtils.sleep(retryDelay);

        // 递归重试
        return this.executeInTransaction(operation, {
          ...options,
          retries: retries + 1,
          retryDelay: retryDelay * 2 // 指数退避
        });
      }

      logger.error('事务操作失败', { error: error.message });
      throw new TransactionError('事务操作失败', error);
    }
  }

  /**
   * 执行原子操作（自动事务）
   * @param {Function} operation - 要执行的操作函数
   * @param {Object} options - 事务选项
   * @returns {Promise<any>} 操作结果
   */
  async atomic(operation, options = {}) {
    return this.executeInTransaction(operation, options);
  }

  /**
   * 批量执行事务操作
   * @param {Array<Function>} operations - 操作函数数组
   * @param {Object} options - 事务选项
   * @returns {Promise<Array>} 操作结果数组
   */
  async executeBatchInTransaction(operations, options = {}) {
    return this.executeInTransaction(async (connection) => {
      const results = [];
      
      for (const operation of operations) {
        const result = await operation(connection);
        results.push(result);
      }
      
      return results;
    }, options);
  }

  /**
   * 获取活动事务数量
   * @returns {number} 活动事务数量
   */
  getActiveTransactionCount() {
    return this.activeTransactions.size;
  }

  /**
   * 获取所有活动事务
   * @returns {Array<Object>} 活动事务列表
   */
  getActiveTransactions() {
    return Array.from(this.activeTransactions.values());
  }

  /**
   * 查找事务
   * @param {string} transactionId - 事务ID
   * @returns {Object|null} 事务对象
   */
  findTransaction(transactionId) {
    return this.activeTransactions.get(transactionId) || null;
  }

  /**
   * 强制回滚所有活动事务
   * @returns {Promise<void>}
   */
  async forceRollbackAll() {
    const transactions = this.getActiveTransactions();
    logger.info(`准备强制回滚 ${transactions.length} 个活动事务`);

    const rollbackPromises = transactions.map(transaction => 
      this.rollback(transaction).catch(error => {
        logger.error(`强制回滚事务失败: ${transaction.id}`, { error: error.message });
      })
    );

    await Promise.all(rollbackPromises);
    logger.info('所有活动事务已尝试回滚');
  }

  /**
   * 增加事务操作计数
   * @param {Object} transaction - 事务对象
   */
  incrementOperationCount(transaction) {
    if (transaction && this.activeTransactions.has(transaction.id)) {
      transaction.operations++;
    }
  }

  /**
   * 检查错误是否可重试
   * @private
   * @param {Error} error - 错误对象
   * @returns {boolean} 是否可重试
   */
  _isRetryableError(error) {
    const retryableErrorPatterns = [
      'deadlock',
      'lock wait timeout',
      'connection timeout',
      'connection lost',
      'Transaction rolled back',
      'Serialization failure',
      'concurrent update'
    ];

    const errorMessage = (error.message || '').toLowerCase();
    return retryableErrorPatterns.some(pattern => 
      errorMessage.includes(pattern)
    );
  }

  /**
   * 生成事务ID
   * @private
   * @returns {string} 事务ID
   */
  _generateTransactionId() {
    return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 从连接池获取连接
   * @private
   * @returns {Promise<Object>} 数据库连接
   */
  async _getConnectionFromPool() {
    try {
      if (this.connectionPool.getConnection) {
        return await this.connectionPool.getConnection();
      } else if (this.connectionPool.acquire) {
        return await this.connectionPool.acquire();
      } else {
        throw new AppError('不支持的连接池接口', {
          code: 'UNSUPPORTED_POOL_INTERFACE',
          status: 500
        });
      }
    } catch (error) {
      logger.error('从连接池获取连接失败', { error: error.message });
      throw new AppError('获取数据库连接失败', {
        code: 'CONNECTION_ACQUISITION_FAILED',
        status: 503,
        originalError: error
      });
    }
  }

  /**
   * 释放数据库连接
   * @private
   * @param {Object} connection - 数据库连接
   * @returns {Promise<void>}
   */
  async _releaseConnection(connection) {
    try {
      if (connection.release) {
        await connection.release();
      } else if (connection.close) {
        await connection.close();
      } else if (this.connectionPool.release) {
        await this.connectionPool.release(connection);
      }
    } catch (error) {
      logger.error('释放数据库连接失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 处理事务超时
   * @private
   * @param {Object} transaction - 事务对象
   */
  async _handleTransactionTimeout(transaction) {
    const { id: transactionId } = transaction;

    if (transaction.state === TransactionState.ACTIVE) {
      logger.warn('事务超时，准备自动回滚', { transactionId });

      // 触发事务超时事件
      this._emitEvent(TransactionEvent.TIMEOUT, {
        transactionId,
        timeout: transaction.timeout,
        timestamp: new Date()
      });

      // 自动回滚
      await this.rollback(transaction).catch(error => {
        logger.error('事务超时自动回滚失败', { transactionId, error: error.message });
      });
    }
  }

  /**
   * 清除事务超时定时器
   * @private
   * @param {Object} transaction - 事务对象
   */
  _clearTransactionTimeout(transaction) {
    if (transaction.timeoutTimer) {
      this.timerUtils.clearTimeout(transaction.timeoutTimer);
      transaction.timeoutTimer = null;
    }
  }

  /**
   * 触发事务事件
   * @private
   * @param {string} eventType - 事件类型
   * @param {Object} data - 事件数据
   */
  _emitEvent(eventType, data) {
    if (this.options.enableEvents) {
      this.eventBus.emit(eventType, data);
    }
  }

  /**
   * 注册事务事件监听器
   * @param {string} eventType - 事件类型
   * @param {Function} listener - 监听器函数
   * @returns {TransactionManager} 事务管理器实例
   */
  on(eventType, listener) {
    if (this.options.enableEvents) {
      this.eventBus.on(eventType, listener);
    }
    return this;
  }

  /**
   * 移除事务事件监听器
   * @param {string} eventType - 事件类型
   * @param {Function} listener - 监听器函数
   * @returns {TransactionManager} 事务管理器实例
   */
  off(eventType, listener) {
    if (this.options.enableEvents) {
      this.eventBus.off(eventType, listener);
    }
    return this;
  }

  /**
   * 获取事务统计信息
   * @returns {Object} 统计信息
   */
  getStatistics() {
    const activeTx = this.getActiveTransactions();
    const now = Date.now();
    
    return {
      activeTransactionCount: activeTx.length,
      activeTransactionIds: activeTx.map(tx => tx.id),
      oldestActiveTransaction: activeTx.length > 0 ? 
        Math.max(...activeTx.map(tx => now - tx.startTime)) : 0,
      averageActiveTransactionDuration: activeTx.length > 0 ?
        Math.round(activeTx.reduce((sum, tx) => sum + (now - tx.startTime), 0) / activeTx.length) : 0
    };
  }

  /**
   * 关闭事务管理器
   * @returns {Promise<void>}
   */
  async shutdown() {
    logger.info('正在关闭事务管理器...');

    // 强制回滚所有活动事务
    await this.forceRollbackAll();

    logger.info('事务管理器已关闭');
  }

  /**
   * 获取事务隔离级别枚举
   * @returns {Object} 隔离级别枚举
   */
  static getIsolationLevels() {
    return { ...IsolationLevel };
  }

  /**
   * 获取事务状态枚举
   * @returns {Object} 状态枚举
   */
  static getTransactionStates() {
    return { ...TransactionState };
  }

  /**
   * 获取事务事件类型枚举
   * @returns {Object} 事件类型枚举
   */
  static getEvents() {
    return { ...TransactionEvent };
  }
}

module.exports = {
  TransactionManager,
  IsolationLevel,
  TransactionState,
  TransactionEvent
};