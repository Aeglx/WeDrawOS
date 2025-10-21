/**
 * 交易模型
 * 定义交易数据结构和相关功能
 */

const { Logger } = require('../../logging/logger');
const logger = Logger.getInstance();

/**
 * 定义交易模型
 * @param {Object} sequelize - Sequelize实例
 * @param {Object} DataTypes - Sequelize数据类型
 * @returns {Object} Transaction模型
 */
module.exports = (sequelize, DataTypes) => {
  const Transaction = sequelize.define('Transaction', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
      validate: {
        isUUID: 4
      }
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    transaction_type: {
      type: DataTypes.ENUM(
        'purchase',
        'sale',
        'refund',
        'deposit',
        'withdrawal',
        'transfer',
        'subscription',
        'payment',
        'reversal',
        'chargeback',
        'adjustment',
        'bonus',
        'fee',
        'tax'
      ),
      allowNull: false,
      defaultValue: 'purchase'
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Amount cannot be empty' },
        isDecimal: { msg: 'Amount must be a valid decimal number' },
        min: { args: [0.01], msg: 'Amount must be greater than zero' }
      }
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'USD',
      validate: {
        notEmpty: { msg: 'Currency cannot be empty' },
        len: { args: [3, 3], msg: 'Currency must be 3 characters (ISO 4217 code)' }
      }
    },
    status: {
      type: DataTypes.ENUM(
        'pending',
        'processing',
        'completed',
        'failed',
        'cancelled',
        'refunded',
        'partially_refunded',
        'disputed',
        'reversed',
        'chargeback',
        'scheduled'
      ),
      allowNull: false,
      defaultValue: 'pending'
    },
    payment_method: {
      type: DataTypes.ENUM(
        'credit_card',
        'debit_card',
        'paypal',
        'stripe',
        'bank_transfer',
        'crypto',
        'gift_card',
        'check',
        'cash',
        'other'
      ),
      allowNull: true,
      defaultValue: null
    },
    payment_processor: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: null,
      validate: {
        len: { args: [0, 50], msg: 'Payment processor must be less than 50 characters' }
      }
    },
    external_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
      validate: {
        len: { args: [0, 255], msg: 'External ID must be less than 255 characters' }
      }
    },
    reference_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: null,
      validate: {
        len: { args: [0, 100], msg: 'Reference ID must be less than 100 characters' }
      }
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: null,
      validate: {
        len: { args: [0, 500], msg: 'Description must be less than 500 characters' }
      }
    },
    related_transaction_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'transactions',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
      validate: {
        isUUID: 4
      }
    },
    tax_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      defaultValue: 0,
      validate: {
        isDecimal: { msg: 'Tax amount must be a valid decimal number' },
        min: { args: [0], msg: 'Tax amount cannot be negative' }
      }
    },
    fee_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      defaultValue: 0,
      validate: {
        isDecimal: { msg: 'Fee amount must be a valid decimal number' },
        min: { args: [0], msg: 'Fee amount cannot be negative' }
      }
    },
    net_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      defaultValue: null,
      validate: {
        isDecimal: { msg: 'Net amount must be a valid decimal number' }
      }
    },
    shipping_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      defaultValue: 0,
      validate: {
        isDecimal: { msg: 'Shipping amount must be a valid decimal number' },
        min: { args: [0], msg: 'Shipping amount cannot be negative' }
      }
    },
    discount_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      defaultValue: 0,
      validate: {
        isDecimal: { msg: 'Discount amount must be a valid decimal number' },
        min: { args: [0], msg: 'Discount amount cannot be negative' }
      }
    },
    subscription_id: {
      type: DataTypes.UUID,
      allowNull: true,
      defaultValue: null,
      validate: {
        isUUID: 4
      }
    },
    order_id: {
      type: DataTypes.UUID,
      allowNull: true,
      defaultValue: null,
      validate: {
        isUUID: 4
      }
    },
    invoice_id: {
      type: DataTypes.UUID,
      allowNull: true,
      defaultValue: null,
      validate: {
        isUUID: 4
      }
    },
    receipt_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: null,
      validate: {
        len: { args: [0, 500], msg: 'Receipt URL must be less than 500 characters' },
        isUrl: { msg: 'Invalid URL format', skipNull: true }
      }
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    },
    payment_details: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    },
    failure_reason: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: null,
      validate: {
        len: { args: [0, 500], msg: 'Failure reason must be less than 500 characters' }
      }
    },
    dispute_reason: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: null,
      validate: {
        len: { args: [0, 500], msg: 'Dispute reason must be less than 500 characters' }
      }
    },
    scheduled_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null
    },
    refunded_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      onUpdate: DataTypes.NOW
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null
    }
  }, {
    tableName: 'transactions',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['transaction_type'] },
      { fields: ['status'] },
      { fields: ['external_id'] },
      { fields: ['reference_id'] },
      { fields: ['related_transaction_id'] },
      { fields: ['created_at'] },
      { fields: ['completed_at'] },
      { fields: ['subscription_id'] },
      { fields: ['order_id'] },
      { fields: ['invoice_id'] },
      { fields: ['currency'] },
      { fields: ['user_id', 'status'] },
      { fields: ['user_id', 'transaction_type'] },
      { fields: ['user_id', 'created_at'] },
      { fields: ['created_at'], order: 'DESC' },
      { fields: ['status', 'created_at'] },
      { fields: ['transaction_type', 'created_at'] },
      { fields: ['external_id', 'payment_processor'] }
    ],
    hooks: {
      // 保存前计算净额
      beforeSave: async (transaction, options) => {
        // 计算净额
        if (!transaction.net_amount) {
          let net = parseFloat(transaction.amount || 0);
          
          // 减去税费和费用
          net -= parseFloat(transaction.tax_amount || 0);
          net -= parseFloat(transaction.fee_amount || 0);
          
          // 减去折扣
          net -= parseFloat(transaction.discount_amount || 0);
          
          // 添加运费（如果适用）
          if (['purchase', 'sale'].includes(transaction.transaction_type)) {
            net += parseFloat(transaction.shipping_amount || 0);
          }
          
          transaction.net_amount = net;
        }
        
        // 如果交易完成，更新完成时间
        if (transaction.status === 'completed' && !transaction.completed_at) {
          transaction.completed_at = new Date();
        }
        
        // 如果交易退款，更新退款时间
        if (transaction.status === 'refunded' && !transaction.refunded_at) {
          transaction.refunded_at = new Date();
        }
      },
      // 创建前记录
      beforeCreate: async (transaction, options) => {
        logger.debug(`Creating transaction for user ${transaction.user_id}`, { type: transaction.transaction_type, amount: transaction.amount });
      },
      // 创建后记录
      afterCreate: async (transaction, options) => {
        logger.info(`Transaction created: ${transaction.id} for user ${transaction.user_id}`, { type: transaction.transaction_type, amount: transaction.amount, status: transaction.status });
      },
      // 更新前记录状态变化
      beforeUpdate: async (transaction, options) => {
        if (transaction.changed('status')) {
          const oldStatus = transaction.previous('status');
          const newStatus = transaction.status;
          logger.info(`Transaction ${transaction.id} status changed from ${oldStatus} to ${newStatus}`, { userId: transaction.user_id });
        }
      },
      // 删除前记录
      beforeDestroy: async (transaction, options) => {
        logger.info(`Transaction ${transaction.id} is being deleted`, { userId: transaction.user_id });
      }
    }
  });

  /**
   * 设置模型关联
   * @param {Object} models - 所有模型对象
   */
  Transaction.associate = function(models) {
    // 与用户的一对多关系
    Transaction.belongsTo(models.User, {
      as: 'user',
      foreignKey: 'user_id',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    
    // 与自身的自引用关系（关联交易）
    Transaction.belongsTo(models.Transaction, {
      as: 'relatedTransaction',
      foreignKey: 'related_transaction_id',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
    
    // 反向关联（此交易可能是其他交易的关联交易）
    Transaction.hasMany(models.Transaction, {
      as: 'childTransactions',
      foreignKey: 'related_transaction_id',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
  };

  /**
   * 实例方法：更新交易状态
   * @param {string} newStatus - 新状态
   * @param {Object} additionalData - 附加数据
   * @returns {Promise<boolean>} 是否更新成功
   */
  Transaction.prototype.updateStatus = async function(newStatus, additionalData = {}) {
    try {
      this.status = newStatus;
      
      // 设置相关字段
      if (newStatus === 'completed' && !this.completed_at) {
        this.completed_at = new Date();
      }
      
      if (newStatus === 'refunded' && !this.refunded_at) {
        this.refunded_at = new Date();
      }
      
      if (newStatus === 'failed' && additionalData.failureReason) {
        this.failure_reason = additionalData.failureReason;
      }
      
      if (newStatus === 'disputed' && additionalData.disputeReason) {
        this.dispute_reason = additionalData.disputeReason;
      }
      
      // 合并其他数据
      Object.assign(this, additionalData);
      
      await this.save();
      logger.info(`Transaction ${this.id} status updated to ${newStatus}`, { userId: this.user_id });
      return true;
    } catch (error) {
      logger.error(`Error updating transaction ${this.id} status:`, error);
      return false;
    }
  };

  /**
   * 实例方法：处理退款
   * @param {Object} refundData - 退款数据
   * @returns {Promise<Object|null>} 退款交易或null
   */
  Transaction.prototype.processRefund = async function(refundData = {}) {
    try {
      const sequelize = this.sequelize;
      
      // 开始事务
      const result = await sequelize.transaction(async (t) => {
        // 创建退款交易
        const refundTransaction = await sequelize.models.Transaction.create({
          user_id: this.user_id,
          transaction_type: 'refund',
          amount: refundData.amount || this.amount,
          currency: this.currency,
          status: 'completed', // 假设退款立即完成
          payment_method: this.payment_method,
          payment_processor: this.payment_processor,
          external_id: refundData.externalId,
          reference_id: refundData.referenceId,
          description: refundData.description || `Refund for transaction ${this.id}`,
          related_transaction_id: this.id,
          tax_amount: this.tax_amount * (refundData.amount / this.amount),
          fee_amount: this.fee_amount * (refundData.amount / this.amount),
          net_amount: -(refundData.amount || this.amount),
          metadata: {
            ...this.metadata,
            refundReason: refundData.reason,
            originalTransaction: this.id
          },
          completed_at: new Date()
        }, { transaction: t });
        
        // 更新原交易状态
        const refundAmount = refundData.amount || this.amount;
        
        if (refundAmount >= this.amount) {
          // 全额退款
          await this.updateStatus('refunded', {}, { transaction: t });
        } else {
          // 部分退款
          await this.updateStatus('partially_refunded', {}, { transaction: t });
        }
        
        return refundTransaction;
      });
      
      logger.info(`Refund processed for transaction ${this.id}`, { refundTransactionId: result.id, amount: result.amount });
      return result;
    } catch (error) {
      logger.error(`Error processing refund for transaction ${this.id}:`, error);
      return null;
    }
  };

  /**
   * 实例方法：更新支付详情
   * @param {Object} paymentDetails - 支付详情
   * @returns {Promise<boolean>} 是否更新成功
   */
  Transaction.prototype.updatePaymentDetails = async function(paymentDetails) {
    try {
      this.payment_details = { ...this.payment_details, ...paymentDetails };
      await this.save();
      logger.info(`Payment details updated for transaction ${this.id}`, { userId: this.user_id });
      return true;
    } catch (error) {
      logger.error(`Error updating payment details for transaction ${this.id}:`, error);
      return false;
    }
  };

  /**
   * 实例方法：更新元数据
   * @param {Object} metadata - 元数据
   * @returns {Promise<boolean>} 是否更新成功
   */
  Transaction.prototype.updateMetadata = async function(metadata) {
    try {
      this.metadata = { ...this.metadata, ...metadata };
      await this.save();
      logger.info(`Metadata updated for transaction ${this.id}`, { userId: this.user_id });
      return true;
    } catch (error) {
      logger.error(`Error updating metadata for transaction ${this.id}:`, error);
      return false;
    }
  };

  /**
   * 实例方法：获取关联交易
   * @returns {Promise<Array>} 关联交易列表
   */
  Transaction.prototype.getRelatedTransactions = async function() {
    try {
      const sequelize = this.sequelize;
      return await sequelize.models.Transaction.findAll({
        where: {
          [sequelize.Op.or]: [
            { related_transaction_id: this.id },
            { id: this.related_transaction_id }
          ]
        }
      });
    } catch (error) {
      logger.error(`Error getting related transactions for ${this.id}:`, error);
      return [];
    }
  };

  /**
   * 实例方法：检查是否可退款
   * @returns {boolean} 是否可退款
   */
  Transaction.prototype.isRefundable = function() {
    return ['completed', 'partially_refunded'].includes(this.status);
  };

  /**
   * 实例方法：检查是否已过期
   * @returns {boolean} 是否已过期
   */
  Transaction.prototype.isExpired = function() {
    return this.expires_at && this.expires_at < new Date() && this.status === 'pending';
  };

  /**
   * 实例方法：序列化交易数据（用于API响应）
   * @returns {Object} 序列化后的交易数据
   */
  Transaction.prototype.serialize = function() {
    return {
      id: this.id,
      user_id: this.user_id,
      transaction_type: this.transaction_type,
      amount: this.amount,
      currency: this.currency,
      status: this.status,
      payment_method: this.payment_method,
      payment_processor: this.payment_processor,
      external_id: this.external_id,
      reference_id: this.reference_id,
      description: this.description,
      related_transaction_id: this.related_transaction_id,
      tax_amount: this.tax_amount,
      fee_amount: this.fee_amount,
      net_amount: this.net_amount,
      shipping_amount: this.shipping_amount,
      discount_amount: this.discount_amount,
      subscription_id: this.subscription_id,
      order_id: this.order_id,
      invoice_id: this.invoice_id,
      receipt_url: this.receipt_url,
      metadata: this.metadata,
      failure_reason: this.failure_reason,
      dispute_reason: this.dispute_reason,
      scheduled_at: this.scheduled_at,
      completed_at: this.completed_at,
      expires_at: this.expires_at,
      refunded_at: this.refunded_at,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  };

  /**
   * 实例方法：序列化交易数据（安全版本，不包含敏感信息）
   * @returns {Object} 安全序列化后的交易数据
   */
  Transaction.prototype.serializeSecure = function() {
    const serialized = this.serialize();
    // 删除可能包含敏感信息的字段
    delete serialized.payment_details;
    
    // 清理metadata中的敏感信息
    if (serialized.metadata) {
      const { cardNumber, cvv, fullName, ...safeMetadata } = serialized.metadata;
      serialized.metadata = safeMetadata;
    }
    
    return serialized;
  };

  /**
   * 类方法：查找用户的交易
   * @param {string} userId - 用户ID
   * @param {Object} options - 查找选项
   * @returns {Promise<Array>} 交易列表
   */
  Transaction.findByUserId = async function(userId, options = {}) {
    try {
      const where = {
        user_id: userId
      };
      
      // 添加类型条件
      if (options.type) {
        where.transaction_type = options.type;
      }
      
      // 添加状态条件
      if (options.status) {
        where.status = options.status;
      }
      
      // 添加日期范围条件
      if (options.fromDate) {
        where.created_at = {
          ...where.created_at,
          [sequelize.Op.gte]: options.fromDate
        };
      }
      
      if (options.toDate) {
        where.created_at = {
          ...where.created_at,
          [sequelize.Op.lte]: options.toDate
        };
      }
      
      // 添加金额范围条件
      if (options.minAmount !== undefined) {
        where.amount = {
          ...where.amount,
          [sequelize.Op.gte]: options.minAmount
        };
      }
      
      if (options.maxAmount !== undefined) {
        where.amount = {
          ...where.amount,
          [sequelize.Op.lte]: options.maxAmount
        };
      }
      
      // 构建查询选项
      const queryOptions = {
        where,
        limit: options.limit || 20,
        offset: options.offset || 0,
        order: options.order || [['created_at', 'DESC']]
      };
      
      // 加载关联
      if (options.includeRelations) {
        queryOptions.include = [
          { model: sequelize.models.Transaction, as: 'relatedTransaction' },
          { model: sequelize.models.Transaction, as: 'childTransactions' }
        ];
      }
      
      return await this.findAndCountAll(queryOptions);
    } catch (error) {
      logger.error(`Error finding transactions for user ${userId}:`, error);
      return { count: 0, rows: [] };
    }
  };

  /**
   * 类方法：查找外部交易
   * @param {string} externalId - 外部ID
   * @param {string} paymentProcessor - 支付处理器
   * @returns {Promise<Object|null>} 交易实例或null
   */
  Transaction.findByExternalId = async function(externalId, paymentProcessor) {
    try {
      const where = {
        external_id: externalId
      };
      
      if (paymentProcessor) {
        where.payment_processor = paymentProcessor;
      }
      
      return await this.findOne({ where });
    } catch (error) {
      logger.error(`Error finding transaction by external ID ${externalId}:`, error);
      return null;
    }
  };

  /**
   * 类方法：获取用户交易统计
   * @param {string} userId - 用户ID
   * @param {Object} options - 统计选项
   * @returns {Promise<Object>} 统计信息
   */
  Transaction.getUserStatistics = async function(userId, options = {}) {
    try {
      const where = {
        user_id: userId
      };
      
      // 添加日期范围条件
      if (options.fromDate) {
        where.created_at = {
          ...where.created_at,
          [sequelize.Op.gte]: options.fromDate
        };
      }
      
      if (options.toDate) {
        where.created_at = {
          ...where.created_at,
          [sequelize.Op.lte]: options.toDate
        };
      }
      
      // 获取交易总数
      const totalCount = await this.count({ where });
      
      // 获取成功交易数量
      const successfulCount = await this.count({
        where: {
          ...where,
          status: 'completed'
        }
      });
      
      // 获取失败交易数量
      const failedCount = await this.count({
        where: {
          ...where,
          status: 'failed'
        }
      });
      
      // 获取总金额
      const totalAmountResult = await this.sum('amount', { where });
      const totalAmount = totalAmountResult || 0;
      
      // 获取净金额
      const netAmountResult = await this.sum('net_amount', { where });
      const netAmount = netAmountResult || 0;
      
      // 获取按类型分布
      const typeDistribution = await this.count({
        where,
        group: 'transaction_type'
      });
      
      // 获取按状态分布
      const statusDistribution = await this.count({
        where,
        group: 'status'
      });
      
      return {
        totalCount,
        successfulCount,
        failedCount,
        pendingCount: totalCount - successfulCount - failedCount,
        totalAmount,
        netAmount,
        typeDistribution: typeDistribution.reduce((acc, count) => {
          acc[count.transaction_type] = count.count;
          return acc;
        }, {}),
        statusDistribution: statusDistribution.reduce((acc, count) => {
          acc[count.status] = count.count;
          return acc;
        }, {})
      };
    } catch (error) {
      logger.error(`Error getting user transaction statistics for ${userId}:`, error);
      return null;
    }
  };

  /**
   * 类方法：获取每日交易汇总
   * @param {Object} options - 汇总选项
   * @returns {Promise<Array>} 每日汇总数据
   */
  Transaction.getDailySummary = async function(options = {}) {
    try {
      const where = {};
      
      // 添加日期范围条件
      if (options.fromDate) {
        where.created_at = {
          ...where.created_at,
          [sequelize.Op.gte]: options.fromDate
        };
      }
      
      if (options.toDate) {
        where.created_at = {
          ...where.created_at,
          [sequelize.Op.lte]: options.toDate
        };
      }
      
      // 如果指定了用户ID
      if (options.userId) {
        where.user_id = options.userId;
      }
      
      // 按日期分组查询
      const result = await this.findAll({
        attributes: [
          [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'transactionCount'],
          [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'],
          [sequelize.fn('SUM', sequelize.col('net_amount')), 'netAmount'],
          [sequelize.fn('AVG', sequelize.col('amount')), 'averageAmount']
        ],
        where,
        group: [sequelize.fn('DATE', sequelize.col('created_at'))],
        order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']]
      });
      
      return result.map(item => ({
        date: item.dataValues.date,
        transactionCount: item.dataValues.transactionCount,
        totalAmount: parseFloat(item.dataValues.totalAmount) || 0,
        netAmount: parseFloat(item.dataValues.netAmount) || 0,
        averageAmount: parseFloat(item.dataValues.averageAmount) || 0
      }));
    } catch (error) {
      logger.error(`Error getting daily transaction summary:`, error);
      return [];
    }
  };

  /**
   * 类方法：搜索交易
   * @param {string} query - 搜索查询
   * @param {Object} options - 搜索选项
   * @returns {Promise<Array>} 交易列表
   */
  Transaction.search = async function(query, options = {}) {
    try {
      const where = {
        [sequelize.Op.or]: [
          { description: { [sequelize.Op.iLike]: `%${query}%` } },
          { reference_id: { [sequelize.Op.iLike]: `%${query}%` } },
          { external_id: { [sequelize.Op.iLike]: `%${query}%` } }
        ]
      };
      
      // 如果指定了用户ID
      if (options.userId) {
        where.user_id = options.userId;
      }
      
      const searchOptions = {
        where,
        limit: options.limit || 20,
        offset: options.offset || 0,
        order: options.order || [['created_at', 'DESC']]
      };
      
      return await this.findAndCountAll(searchOptions);
    } catch (error) {
      logger.error(`Error searching transactions:`, error);
      return { count: 0, rows: [] };
    }
  };

  /**
   * 类方法：处理过期交易
   * @returns {Promise<number>} 更新的交易数量
   */
  Transaction.processExpired = async function() {
    try {
      const now = new Date();
      const result = await this.update(
        {
          status: 'cancelled',
          failure_reason: 'Transaction expired'
        },
        {
          where: {
            status: 'pending',
            expires_at: {
              [sequelize.Op.lt]: now
            }
          }
        }
      );
      
      logger.info(`Processed ${result[0]} expired transactions`);
      return result[0];
    } catch (error) {
      logger.error(`Error processing expired transactions:`, error);
      return 0;
    }
  };

  return Transaction;
};