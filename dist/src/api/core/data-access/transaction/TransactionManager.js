/**
 * 数据库事务管理器
 * 提供统一的事务处理、并发控制和事务嵌套支持
 */

const logger = require('../../utils/logger');
const { AppError } = require('../../exception/handlers/errorHandler');

/**
 * 事务隔离级别枚举
 */
const ISOLATION_LEVELS = {
  READ_UNCOMMITTED: 'READ UNCOMMITTED',
  READ_COMMITTED: 'READ COMMITTED',
  REPEATABLE_READ: 'REPEATABLE READ',
  SERIALIZABLE: 'SERIALIZABLE'
};

/**
 * 事务管理器类
 */
class TransactionManager {
  constructor() {
    this.logger = logger;
    this.activeTransactions = new Map(); // 存储活动事务
    this.transactionStack = new Map(); // 事务嵌套栈
    this.logger.info('事务管理器初始化');
  }

  /**
   * 创建新事务
   * @param {Object} options - 事务选项
   * @param {string} options.isolationLevel - 隔离级别
   * @param {boolean} options.readOnly - 是否只读
   * @returns {Promise<Object>} 事务对象
   */
  async createTransaction(options = {}) {
    const { 
      isolationLevel = ISOLATION_LEVELS.READ_COMMITTED,
      readOnly = false
    } = options;

    try {
      // 获取数据库连接
      const connection = await this._getConnection();
      
      // 开始事务
      await connection.beginTransaction({
        isolationLevel,
        readOnly
      });

      // 生成事务ID
      const transactionId = this._generateTransactionId();
      
      // 存储事务信息
      const transaction = {
        id: transactionId,
        connection,
        isolationLevel,
        readOnly,
        startTime: Date.now(),
        status: 'active',
        operations: []
      };

      this.activeTransactions.set(transactionId, transaction);
      this.logger.debug(`事务已开始: ${transactionId}`, { isolationLevel, readOnly });
      
      // 初始化事务栈
      if (!this.transactionStack.has(transactionId)) {
        this.transactionStack.set(transactionId, []);
      }

      return transaction;
    } catch (error) {
      this.logger.error('创建事务失败', error);
      throw new AppError(500, '创建数据库事务失败', 500);
    }
  }

  /**
   * 提交事务
   * @param {string|Object} transaction - 事务ID或事务对象
   * @returns {Promise<boolean>} 是否成功
   */
  async commitTransaction(transaction) {
    const transactionId = this._getTransactionId(transaction);
    const tx = this.activeTransactions.get(transactionId);

    if (!tx || tx.status !== 'active') {
      throw new Error(`事务不存在或已结束: ${transactionId}`);
    }

    try {
      await tx.connection.commit();
      tx.status = 'committed';
      tx.endTime = Date.now();
      tx.duration = tx.endTime - tx.startTime;
      
      this.logger.debug(`事务已提交: ${transactionId}`, {
        duration: tx.duration,
        operations: tx.operations.length
      });
      
      // 清理资源
      this._cleanupTransaction(transactionId);
      await tx.connection.release();
      
      return true;
    } catch (error) {
      this.logger.error(`提交事务失败: ${transactionId}`, error);
      throw new AppError(500, '提交数据库事务失败', 500);
    }
  }

  /**
   * 回滚事务
   * @param {string|Object} transaction - 事务ID或事务对象
   * @returns {Promise<boolean>} 是否成功
   */
  async rollbackTransaction(transaction) {
    const transactionId = this._getTransactionId(transaction);
    const tx = this.activeTransactions.get(transactionId);

    if (!tx || (tx.status !== 'active' && tx.status !== 'nested')) {
      throw new Error(`事务不存在或已结束: ${transactionId}`);
    }

    try {
      await tx.connection.rollback();
      tx.status = 'rolledback';
      tx.endTime = Date.now();
      tx.duration = tx.endTime - tx.startTime;
      
      this.logger.debug(`事务已回滚: ${transactionId}`, {
        duration: tx.duration,
        operations: tx.operations.length
      });
      
      // 清理资源
      this._cleanupTransaction(transactionId);
      await tx.connection.release();
      
      return true;
    } catch (error) {
      this.logger.error(`回滚事务失败: ${transactionId}`, error);
      // 即使回滚失败，也要标记事务为失败并清理资源
      if (tx) {
        tx.status = 'failed';
        this._cleanupTransaction(transactionId);
        try {
          await tx.connection.release();
        } catch (releaseError) {
          this.logger.error(`释放连接失败: ${transactionId}`, releaseError);
        }
      }
      throw new AppError(500, '回滚数据库事务失败', 500);
    }
  }

  /**
   * 在事务中执行操作
   * @param {Function} callback - 事务回调函数
   * @param {Object} options - 事务选项
   * @returns {Promise<any>} 回调函数的返回值
   */
  async withTransaction(callback, options = {}) {
    let transaction = null;
    let result = null;

    try {
      // 创建事务
      transaction = await this.createTransaction(options);
      
      // 执行回调
      result = await callback(transaction);
      
      // 提交事务
      await this.commitTransaction(transaction);
      
      return result;
    } catch (error) {
      // 回滚事务
      if (transaction) {
        try {
          await this.rollbackTransaction(transaction);
        } catch (rollbackError) {
          this.logger.error('事务回滚失败', { originalError: error, rollbackError });
        }
      }
      
      // 重新抛出原始错误
      throw error;
    }
  }

  /**
   * 执行事务嵌套操作
   * @param {string|Object} parentTransaction - 父事务
   * @param {Function} callback - 嵌套事务回调
   * @returns {Promise<any>} 回调函数的返回值
   */
  async nestedTransaction(parentTransaction, callback) {
    const transactionId = this._getTransactionId(parentTransaction);
    const tx = this.activeTransactions.get(transactionId);

    if (!tx || tx.status !== 'active') {
      throw new Error(`父事务不存在或已结束: ${transactionId}`);
    }

    try {
      // 记录嵌套操作开始
      const savepoint = `sp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await tx.connection.query(`SAVEPOINT ${savepoint}`);
      
      tx.transactionStack.get(transactionId).push(savepoint);
      tx.operations.push(`SAVEPOINT ${savepoint}`);
      
      this.logger.debug(`创建嵌套事务保存点: ${savepoint}`, { transactionId });
      
      try {
        // 执行嵌套操作
        const result = await callback(tx);
        
        // 嵌套操作成功，释放保存点（可选，MySQL会自动释放）
        await tx.connection.query(`RELEASE SAVEPOINT ${savepoint}`);
        this.logger.debug(`释放嵌套事务保存点: ${savepoint}`, { transactionId });
        
        return result;
      } catch (nestedError) {
        // 嵌套操作失败，回滚到保存点
        await tx.connection.query(`ROLLBACK TO SAVEPOINT ${savepoint}`);
        this.logger.debug(`回滚到嵌套事务保存点: ${savepoint}`, { transactionId });
        
        // 重新抛出嵌套错误
        throw nestedError;
      }
    } catch (error) {
      this.logger.error(`嵌套事务失败: ${transactionId}`, error);
      throw error;
    }
  }

  /**
   * 获取事务信息
   * @param {string|Object} transaction - 事务ID或事务对象
   * @returns {Object|null} 事务信息
   */
  getTransactionInfo(transaction) {
    const transactionId = this._getTransactionId(transaction);
    const tx = this.activeTransactions.get(transactionId);
    
    if (!tx) {
      return null;
    }
    
    return {
      id: tx.id,
      status: tx.status,
      isolationLevel: tx.isolationLevel,
      readOnly: tx.readOnly,
      startTime: tx.startTime,
      duration: tx.endTime ? tx.endTime - tx.startTime : Date.now() - tx.startTime,
      operations: tx.operations.length
    };
  }

  /**
   * 获取所有活动事务
   * @returns {Array} 活动事务列表
   */
  getActiveTransactions() {
    const transactions = [];
    
    this.activeTransactions.forEach((tx, id) => {
      if (tx.status === 'active') {
        transactions.push(this.getTransactionInfo(id));
      }
    });
    
    return transactions;
  }

  /**
   * 强制关闭长时间运行的事务
   * @param {number} maxDuration - 最大允许持续时间（毫秒）
   * @returns {Promise<Array>} 被关闭的事务列表
   */
  async forceCloseLongRunningTransactions(maxDuration = 300000) { // 默认5分钟
    const now = Date.now();
    const closedTransactions = [];
    
    for (const [id, tx] of this.activeTransactions.entries()) {
      if (tx.status === 'active' && (now - tx.startTime) > maxDuration) {
        this.logger.warn(`强制关闭长时间运行的事务: ${id}`, {
          duration: now - tx.startTime,
          operations: tx.operations.length
        });
        
        try {
          await this.rollbackTransaction(id);
          closedTransactions.push(id);
        } catch (error) {
          this.logger.error(`强制关闭事务失败: ${id}`, error);
        }
      }
    }
    
    return closedTransactions;
  }

  /**
   * 执行带锁的操作（悲观锁）
   * @param {string|Object} transaction - 事务对象
   * @param {string} tableName - 表名
   * @param {Object} conditions - 查询条件
   * @param {Function} callback - 回调函数
   * @returns {Promise<any>} 回调函数的返回值
   */
  async withPessimisticLock(transaction, tableName, conditions, callback) {
    const transactionId = this._getTransactionId(transaction);
    const tx = this.activeTransactions.get(transactionId);

    if (!tx || tx.status !== 'active') {
      throw new Error(`事务不存在或已结束: ${transactionId}`);
    }

    try {
      // 构建锁查询SQL
      const whereClause = Object.entries(conditions)
        .map(([key, value]) => `${key} = ?`)
        .join(' AND ');
      
      const sql = `SELECT * FROM ${tableName} WHERE ${whereClause} FOR UPDATE`;
      const params = Object.values(conditions);
      
      // 执行锁查询
      const [rows] = await tx.connection.query(sql, params);
      tx.operations.push(`LOCK ${tableName}`);
      
      this.logger.debug(`获取悲观锁: ${tableName}`, { conditions, transactionId });
      
      // 执行回调
      return await callback(rows);
    } catch (error) {
      this.logger.error(`获取悲观锁失败: ${tableName}`, { conditions, error });
      throw error;
    }
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
   * 获取事务ID
   * @private
   * @param {string|Object} transaction - 事务ID或事务对象
   * @returns {string} 事务ID
   */
  _getTransactionId(transaction) {
    if (typeof transaction === 'string') {
      return transaction;
    } else if (transaction && transaction.id) {
      return transaction.id;
    }
    throw new Error('无效的事务参数');
  }

  /**
   * 获取数据库连接
   * @private
   * @returns {Promise<Object>} 数据库连接
   */
  async _getConnection() {
    try {
      // 这里应该引入实际的数据库连接池
      const database = require('../database');
      return await database.getConnection();
    } catch (error) {
      this.logger.error('获取数据库连接失败', error);
      throw new AppError(500, '获取数据库连接失败', 500);
    }
  }

  /**
   * 清理事务资源
   * @private
   * @param {string} transactionId - 事务ID
   */
  _cleanupTransaction(transactionId) {
    this.activeTransactions.delete(transactionId);
    this.transactionStack.delete(transactionId);
  }

  /**
   * 监控事务状态
   * @param {Function} onStatusChange - 状态变更回调
   * @param {number} interval - 监控间隔（毫秒）
   * @returns {Object} 监控控制器
   */
  monitorTransactions(onStatusChange, interval = 10000) { // 默认10秒
    let lastTransactionCount = 0;
    let timer = null;
    
    const startMonitoring = () => {
      timer = setInterval(() => {
        const activeTxs = this.getActiveTransactions();
        const currentCount = activeTxs.length;
        
        if (currentCount !== lastTransactionCount || onStatusChange) {
          onStatusChange && onStatusChange({
            count: currentCount,
            transactions: activeTxs,
            changed: currentCount !== lastTransactionCount
          });
          lastTransactionCount = currentCount;
        }
      }, interval);
    };
    
    const stopMonitoring = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };
    
    startMonitoring();
    
    return {
      start: startMonitoring,
      stop: stopMonitoring
    };
  }
}

// 创建单例实例
const transactionManager = new TransactionManager();

module.exports = {
  TransactionManager,
  transactionManager,
  ISOLATION_LEVELS
};