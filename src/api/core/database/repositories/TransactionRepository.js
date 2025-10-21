/**
 * 交易仓库模块
 * 处理支付交易相关的数据库操作
 */

const { Repository } = require('./Repository');
const { Logger } = require('../../logging/logger');
const { AppError } = require('../../errors/appError');

class TransactionRepository extends Repository {
  constructor() {
    super('transactions'); // 交易表名
    this.logger = Logger.getInstance();
    this.logger.info('Transaction repository initialized');
  }

  /**
   * 获取交易仓库实例（单例模式）
   * @returns {TransactionRepository} 交易仓库实例
   */
  static getInstance() {
    if (!TransactionRepository.instance) {
      TransactionRepository.instance = new TransactionRepository();
    }
    return TransactionRepository.instance;
  }

  /**
   * 创建新交易记录
   * @param {Object} transactionData - 交易数据
   * @returns {Promise<Object>} 创建的交易记录
   */
  async create(transactionData) {
    try {
      // 验证必要字段
      if (!transactionData.userId) {
        throw new Error('User ID is required');
      }
      
      if (!transactionData.amount || transactionData.amount === 0) {
        throw new Error('Transaction amount must be non-zero');
      }
      
      // 确保交易数据包含必要字段
      const dataToCreate = {
        ...transactionData,
        createdAt: transactionData.createdAt || new Date(),
        updatedAt: new Date(),
        status: transactionData.status || 'pending',
        currency: transactionData.currency || 'USD',
        paymentMethod: transactionData.paymentMethod || 'unknown'
      };
      
      this.logger.debug('Creating transaction', {
        userId: dataToCreate.userId,
        amount: dataToCreate.amount,
        paymentMethod: dataToCreate.paymentMethod
      });
      
      const created = await super.create(dataToCreate);
      
      this.logger.info('Transaction created successfully', {
        transactionId: created.id,
        userId: created.userId
      });
      
      return created;
    } catch (error) {
      this.logger.error('Failed to create transaction:', error);
      throw new AppError(`Failed to create transaction: ${error.message}`, 500, error);
    }
  }

  /**
   * 根据ID查找交易
   * @param {string|number} id - 交易ID
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} 交易记录
   */
  async findById(id, options = {}) {
    try {
      this.logger.debug('Finding transaction by ID', { transactionId: id });
      
      const transaction = await super.findById(id, {
        ...options,
        populate: options.populate || ['userId']
      });
      
      if (transaction) {
        return this._formatTransactionData(transaction);
      }
      
      return null;
    } catch (error) {
      this.logger.error(`Failed to find transaction ${id}:`, error);
      throw new AppError(`Failed to find transaction: ${error.message}`, 500, error);
    }
  }

  /**
   * 更新交易记录
   * @param {string|number} id - 交易ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<Object>} 更新后的交易记录
   */
  async update(id, updateData) {
    try {
      this.logger.debug('Updating transaction', { transactionId: id });
      
      // 确保包含更新时间
      const dataToUpdate = {
        ...updateData,
        updatedAt: new Date()
      };
      
      const updated = await super.update(id, dataToUpdate);
      
      this.logger.info('Transaction updated successfully', {
        transactionId: id,
        status: dataToUpdate.status
      });
      
      return this._formatTransactionData(updated);
    } catch (error) {
      this.logger.error(`Failed to update transaction ${id}:`, error);
      throw new AppError(`Failed to update transaction: ${error.message}`, 500, error);
    }
  }

  /**
   * 查找用户的交易记录（分页）
   * @param {Object} query - 查询条件
   * @param {number} page - 页码
   * @param {number} limit - 每页数量
   * @returns {Promise<Object>} 分页交易列表
   */
  async findPaged(query, page = 1, limit = 20) {
    try {
      this.logger.debug('Finding transactions with pagination', {
        query: { ...query, userId: query.userId }, // 仅记录userId以保护隐私
        page,
        limit
      });
      
      // 构建排序条件
      const sort = query.sort || { createdAt: -1 };
      delete query.sort;
      
      // 执行分页查询
      const result = await super.findPaged(query, page, limit, sort, ['userId']);
      
      // 格式化交易数据
      result.items = result.items.map(transaction => this._formatTransactionData(transaction));
      
      return result;
    } catch (error) {
      this.logger.error('Failed to find transactions with pagination:', error);
      throw new AppError('Failed to retrieve transactions', 500, error);
    }
  }

  /**
   * 根据用户ID查找交易记录
   * @param {string|number} userId - 用户ID
   * @param {Object} filter - 过滤条件
   * @param {number} limit - 限制数量
   * @returns {Promise<Array>} 交易记录列表
   */
  async findByUserId(userId, filter = {}, limit = 50) {
    try {
      this.logger.debug('Finding transactions by user ID', { userId, limit });
      
      const query = {
        userId,
        ...filter
      };
      
      const transactions = await this.find(query, { createdAt: -1 }, limit, ['userId']);
      
      return transactions.map(transaction => this._formatTransactionData(transaction));
    } catch (error) {
      this.logger.error(`Failed to find transactions for user ${userId}:`, error);
      throw new AppError('Failed to retrieve user transactions', 500, error);
    }
  }

  /**
   * 根据外部交易ID查找交易
   * @param {string} externalTransactionId - 外部交易ID
   * @param {string} paymentMethod - 支付方式
   * @returns {Promise<Object>} 交易记录
   */
  async findByExternalId(externalTransactionId, paymentMethod) {
    try {
      this.logger.debug('Finding transaction by external ID', {
        externalTransactionId,
        paymentMethod
      });
      
      const query = {
        externalTransactionId,
        paymentMethod
      };
      
      const transaction = await this.findOne(query, ['userId']);
      
      if (transaction) {
        return this._formatTransactionData(transaction);
      }
      
      return null;
    } catch (error) {
      this.logger.error(`Failed to find transaction by external ID ${externalTransactionId}:`, error);
      throw new AppError('Failed to retrieve transaction by external ID', 500, error);
    }
  }

  /**
   * 查找相关交易（如退款对应的原始交易）
   * @param {string|number} transactionId - 交易ID
   * @returns {Promise<Object>} 相关交易记录
   */
  async findRelatedTransaction(transactionId) {
    try {
      this.logger.debug('Finding related transaction', { transactionId });
      
      const query = {
        relatedTransactionId: transactionId
      };
      
      const transaction = await this.findOne(query, ['userId']);
      
      if (transaction) {
        return this._formatTransactionData(transaction);
      }
      
      return null;
    } catch (error) {
      this.logger.error(`Failed to find related transaction for ${transactionId}:`, error);
      throw new AppError('Failed to retrieve related transaction', 500, error);
    }
  }

  /**
   * 获取交易统计信息
   * @param {Object} query - 查询条件
   * @returns {Promise<Object>} 统计信息
   */
  async getStatistics(query) {
    try {
      this.logger.debug('Getting transaction statistics', {
        query: query.userId ? { userId: query.userId } : 'all users' // 保护隐私
      });
      
      // 这里应该使用聚合查询来获取统计信息
      // 以下是模拟实现，实际应根据数据库类型调整
      
      // 获取所有符合条件的交易
      const transactions = await this.find(query);
      
      // 计算统计数据
      const totalCount = transactions.length;
      const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
      const averageAmount = totalCount > 0 ? totalAmount / totalCount : 0;
      
      // 按支付方式分组
      const byPaymentMethod = transactions.reduce((acc, t) => {
        if (!acc[t.paymentMethod]) {
          acc[t.paymentMethod] = {
            count: 0,
            totalAmount: 0
          };
        }
        acc[t.paymentMethod].count++;
        acc[t.paymentMethod].totalAmount += t.amount;
        return acc;
      }, {});
      
      // 按状态分组
      const byStatus = transactions.reduce((acc, t) => {
        if (!acc[t.status]) acc[t.status] = 0;
        acc[t.status]++;
        return acc;
      }, {});
      
      return {
        totalCount,
        totalAmount,
        averageAmount,
        byPaymentMethod,
        byStatus
      };
    } catch (error) {
      this.logger.error('Failed to get transaction statistics:', error);
      throw new AppError('Failed to retrieve transaction statistics', 500, error);
    }
  }

  /**
   * 获取每日交易汇总
   * @param {Object} query - 查询条件
   * @param {Date} startDate - 开始日期
   * @param {Date} endDate - 结束日期
   * @returns {Promise<Array>} 每日汇总数据
   */
  async getDailySummary(query, startDate, endDate) {
    try {
      this.logger.debug('Getting daily transaction summary', {
        query: query.userId ? { userId: query.userId } : 'all users',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });
      
      // 构建查询条件
      const dateQuery = {
        ...query,
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      };
      
      // 获取交易记录
      const transactions = await this.find(dateQuery, { createdAt: 1 });
      
      // 按日期分组
      const dailyData = {};
      
      transactions.forEach(transaction => {
        const dateKey = new Date(transaction.createdAt).toISOString().split('T')[0];
        
        if (!dailyData[dateKey]) {
          dailyData[dateKey] = {
            date: dateKey,
            totalAmount: 0,
            transactionCount: 0,
            successfulCount: 0,
            failedCount: 0,
            paymentMethods: {}
          };
        }
        
        dailyData[dateKey].totalAmount += transaction.amount;
        dailyData[dateKey].transactionCount++;
        
        if (transaction.status === 'completed') {
          dailyData[dateKey].successfulCount++;
        } else if (transaction.status === 'failed') {
          dailyData[dateKey].failedCount++;
        }
        
        // 统计支付方式
        if (!dailyData[dateKey].paymentMethods[transaction.paymentMethod]) {
          dailyData[dateKey].paymentMethods[transaction.paymentMethod] = 0;
        }
        dailyData[dateKey].paymentMethods[transaction.paymentMethod]++;
      });
      
      // 转换为数组并排序
      return Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      this.logger.error('Failed to get daily transaction summary:', error);
      throw new AppError('Failed to retrieve daily transaction summary', 500, error);
    }
  }

  /**
   * 批量创建交易记录
   * @param {Array} transactions - 交易数组
   * @returns {Promise<Array>} 创建的交易记录
   */
  async bulkCreate(transactions) {
    try {
      this.logger.debug('Creating bulk transactions', { count: transactions.length });
      
      // 准备交易数据
      const transactionsToCreate = transactions.map(t => ({
        ...t,
        createdAt: t.createdAt || new Date(),
        updatedAt: new Date(),
        status: t.status || 'pending',
        currency: t.currency || 'USD'
      }));
      
      const created = await super.bulkCreate(transactionsToCreate);
      
      this.logger.info('Bulk transactions created successfully', { count: created.length });
      
      return created.map(transaction => this._formatTransactionData(transaction));
    } catch (error) {
      this.logger.error('Failed to create bulk transactions:', error);
      throw new AppError('Failed to create bulk transactions', 500, error);
    }
  }

  /**
   * 软删除交易记录
   * @param {string|number} id - 交易ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  async softDelete(id) {
    try {
      this.logger.debug('Soft deleting transaction', { transactionId: id });
      
      const result = await super.softDelete(id);
      
      if (result) {
        this.logger.info('Transaction soft deleted successfully', { transactionId: id });
      }
      
      return result;
    } catch (error) {
      this.logger.error(`Failed to soft delete transaction ${id}:`, error);
      throw new AppError('Failed to delete transaction', 500, error);
    }
  }

  /**
   * 恢复软删除的交易记录
   * @param {string|number} id - 交易ID
   * @returns {Promise<boolean>} 是否恢复成功
   */
  async restore(id) {
    try {
      this.logger.debug('Restoring transaction', { transactionId: id });
      
      const result = await super.restore(id);
      
      if (result) {
        this.logger.info('Transaction restored successfully', { transactionId: id });
      }
      
      return result;
    } catch (error) {
      this.logger.error(`Failed to restore transaction ${id}:`, error);
      throw new AppError('Failed to restore transaction', 500, error);
    }
  }

  /**
   * 格式化交易数据
   * @private
   * @param {Object} transaction - 原始交易数据
   * @returns {Object} 格式化后的交易数据
   */
  _formatTransactionData(transaction) {
    // 避免修改原始对象
    const formatted = { ...transaction };
    
    // 确保日期是ISO格式
    if (formatted.createdAt && !(formatted.createdAt instanceof Date)) {
      formatted.createdAt = new Date(formatted.createdAt);
    }
    
    if (formatted.updatedAt && !(formatted.updatedAt instanceof Date)) {
      formatted.updatedAt = new Date(formatted.updatedAt);
    }
    
    if (formatted.processedAt && !(formatted.processedAt instanceof Date)) {
      formatted.processedAt = new Date(formatted.processedAt);
    }
    
    if (formatted.refundedAt && !(formatted.refundedAt instanceof Date)) {
      formatted.refundedAt = new Date(formatted.refundedAt);
    }
    
    // 移除敏感信息
    if (formatted.paymentDetails) {
      formatted.paymentDetails = this._sanitizePaymentDetails(formatted.paymentDetails);
    }
    
    // 计算交易类型（收入或支出）
    formatted.transactionType = formatted.amount > 0 ? 'income' : 'expense';
    
    // 计算是否完全退款
    if (formatted.refundAmount && formatted.amount) {
      formatted.isFullyRefunded = Math.abs(formatted.refundAmount) >= Math.abs(formatted.amount);
    } else {
      formatted.isFullyRefunded = false;
    }
    
    return formatted;
  }

  /**
   * 清理支付详情，移除敏感信息
   * @private
   * @param {Object} paymentDetails - 支付详情
   * @returns {Object} 清理后的支付详情
   */
  _sanitizePaymentDetails(paymentDetails) {
    if (!paymentDetails || typeof paymentDetails !== 'object') {
      return {};
    }
    
    // 创建副本以避免修改原始对象
    const sanitized = { ...paymentDetails };
    
    // 移除敏感字段
    const sensitiveFields = [
      'cardNumber', 'cvv', 'securityCode', 'expiryDate',
      'fullName', 'address', 'phone', 'token', 'secret'
    ];
    
    sensitiveFields.forEach(field => {
      delete sanitized[field];
    });
    
    // 递归清理嵌套对象
    Object.keys(sanitized).forEach(key => {
      if (sanitized[key] && typeof sanitized[key] === 'object' && !Array.isArray(sanitized[key])) {
        sanitized[key] = this._sanitizePaymentDetails(sanitized[key]);
      }
    });
    
    return sanitized;
  }

  /**
   * 搜索交易记录
   * @param {Object} searchCriteria - 搜索条件
   * @param {number} page - 页码
   * @param {number} limit - 每页数量
   * @returns {Promise<Object>} 搜索结果
   */
  async search(searchCriteria, page = 1, limit = 20) {
    try {
      this.logger.debug('Searching transactions', {
        searchTerm: searchCriteria.searchTerm,
        page,
        limit
      });
      
      // 构建搜索查询
      const query = {};
      
      // 用户ID过滤
      if (searchCriteria.userId) {
        query.userId = searchCriteria.userId;
      }
      
      // 金额范围过滤
      if (searchCriteria.minAmount !== undefined) {
        query.amount = { ...query.amount, $gte: searchCriteria.minAmount };
      }
      
      if (searchCriteria.maxAmount !== undefined) {
        query.amount = { ...query.amount, $lte: searchCriteria.maxAmount };
      }
      
      // 状态过滤
      if (searchCriteria.status) {
        query.status = searchCriteria.status;
      }
      
      // 支付方式过滤
      if (searchCriteria.paymentMethod) {
        query.paymentMethod = searchCriteria.paymentMethod;
      }
      
      // 日期范围过滤
      if (searchCriteria.startDate) {
        query.createdAt = { ...query.createdAt, $gte: new Date(searchCriteria.startDate) };
      }
      
      if (searchCriteria.endDate) {
        query.createdAt = { ...query.createdAt, $lte: new Date(searchCriteria.endDate) };
      }
      
      // 文本搜索（如果支持）
      if (searchCriteria.searchTerm) {
        // 这里应该根据数据库类型实现全文搜索
        // 例如MongoDB的$text搜索或SQL的LIKE查询
        query.$or = [
          { description: { $regex: searchCriteria.searchTerm, $options: 'i' } },
          { externalTransactionId: { $regex: searchCriteria.searchTerm, $options: 'i' } }
        ];
      }
      
      // 执行分页查询
      const result = await this.findPaged(query, page, limit, { createdAt: -1 });
      
      return result;
    } catch (error) {
      this.logger.error('Failed to search transactions:', error);
      throw new AppError('Failed to search transactions', 500, error);
    }
  }

  /**
   * 开始事务
   * @returns {Promise<Object>} 事务对象
   */
  async startTransaction() {
    try {
      this.logger.debug('Starting transaction');
      return await super.startTransaction();
    } catch (error) {
      this.logger.error('Failed to start transaction:', error);
      throw new AppError('Failed to start transaction', 500, error);
    }
  }

  /**
   * 提交事务
   * @param {Object} transaction - 事务对象
   * @returns {Promise<void>}
   */
  async commitTransaction(transaction) {
    try {
      this.logger.debug('Committing transaction');
      await super.commitTransaction(transaction);
    } catch (error) {
      this.logger.error('Failed to commit transaction:', error);
      throw new AppError('Failed to commit transaction', 500, error);
    }
  }

  /**
   * 回滚事务
   * @param {Object} transaction - 事务对象
   * @returns {Promise<void>}
   */
  async rollbackTransaction(transaction) {
    try {
      this.logger.debug('Rolling back transaction');
      await super.rollbackTransaction(transaction);
    } catch (error) {
      this.logger.error('Failed to rollback transaction:', error);
      throw new AppError('Failed to rollback transaction', 500, error);
    }
  }
}

module.exports = { TransactionRepository };