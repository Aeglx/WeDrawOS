/**
 * 支付服务模块
 * 提供统一的支付处理、交易管理和支付方式集成功能
 */

const { Config } = require('../config/config');
const { Logger } = require('../logging/logger');
const { AppError } = require('../errors/appError');
const { TransactionRepository } = require('../database/repositories/TransactionRepository');
const { UserRepository } = require('../database/repositories/UserRepository');
const crypto = require('crypto');

class PaymentService {
  constructor() {
    this.config = Config.getInstance();
    this.logger = Logger.getInstance();
    this.transactionRepository = TransactionRepository.getInstance();
    this.userRepository = UserRepository.getInstance();
    
    // 支付处理器注册表
    this.paymentProcessors = {};
    
    // 初始化支付处理器
    this._initPaymentProcessors();
    
    this.logger.info('Payment service initialized');
  }

  /**
   * 获取支付服务实例（单例模式）
   * @returns {PaymentService} 支付服务实例
   */
  static getInstance() {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  /**
   * 初始化支付处理器
   * @private
   */
  _initPaymentProcessors() {
    try {
      const paymentConfig = this.config.get('payment', {});
      const processors = paymentConfig.processors || [];
      
      this.logger.debug('Initializing payment processors', { count: processors.length });
      
      // 注册内置支付处理器
      this._registerStripeProcessor();
      this._registerPayPalProcessor();
      this._registerCreditCardProcessor();
      
      // 可以根据配置动态加载其他处理器
      processors.forEach(procConfig => {
        try {
          if (procConfig.enabled) {
            this.logger.info(`Initializing custom payment processor: ${procConfig.name}`);
            // 这里可以根据配置动态加载自定义处理器
          }
        } catch (error) {
          this.logger.error(`Failed to initialize payment processor: ${procConfig.name}`, error);
        }
      });
      
    } catch (error) {
      this.logger.error('Failed to initialize payment processors:', error);
    }
  }

  /**
   * 注册Stripe支付处理器
   * @private
   */
  _registerStripeProcessor() {
    const stripeConfig = this.config.get('payment.stripe', {});
    
    if (!stripeConfig.enabled) {
      this.logger.debug('Stripe payment processor is disabled');
      return;
    }
    
    try {
      // 这里应该导入stripe库，但为了避免依赖问题，我们使用模拟实现
      this.paymentProcessors.stripe = {
        name: 'Stripe',
        enabled: true,
        config: stripeConfig,
        processPayment: async (paymentData) => {
          this.logger.info('Processing payment with Stripe', { amount: paymentData.amount });
          // 实际实现中应该调用Stripe API
          return {
            success: true,
            transactionId: `stripe_${crypto.randomUUID()}`,
            processor: 'stripe',
            timestamp: new Date()
          };
        },
        createPaymentIntent: async (paymentData) => {
          this.logger.info('Creating Stripe payment intent', { amount: paymentData.amount });
          // 实际实现中应该调用Stripe API创建支付意向
          return {
            clientSecret: `stripe_client_secret_${crypto.randomUUID()}`,
            paymentIntentId: `pi_${crypto.randomUUID().substring(0, 24)}`
          };
        }
      };
      
      this.logger.info('Stripe payment processor registered');
    } catch (error) {
      this.logger.error('Failed to register Stripe payment processor:', error);
    }
  }

  /**
   * 注册PayPal支付处理器
   * @private
   */
  _registerPayPalProcessor() {
    const paypalConfig = this.config.get('payment.paypal', {});
    
    if (!paypalConfig.enabled) {
      this.logger.debug('PayPal payment processor is disabled');
      return;
    }
    
    try {
      this.paymentProcessors.paypal = {
        name: 'PayPal',
        enabled: true,
        config: paypalConfig,
        processPayment: async (paymentData) => {
          this.logger.info('Processing payment with PayPal', { amount: paymentData.amount });
          // 实际实现中应该调用PayPal API
          return {
            success: true,
            transactionId: `paypal_${crypto.randomUUID()}`,
            processor: 'paypal',
            timestamp: new Date()
          };
        },
        createPaymentOrder: async (paymentData) => {
          this.logger.info('Creating PayPal payment order', { amount: paymentData.amount });
          // 实际实现中应该调用PayPal API创建支付订单
          return {
            orderId: `PAYPAL${Date.now()}`,
            approvalUrl: `https://paypal.com/checkoutnow?token=EC-${crypto.randomUUID().substring(0, 17)}`
          };
        }
      };
      
      this.logger.info('PayPal payment processor registered');
    } catch (error) {
      this.logger.error('Failed to register PayPal payment processor:', error);
    }
  }

  /**
   * 注册信用卡支付处理器
   * @private
   */
  _registerCreditCardProcessor() {
    const ccConfig = this.config.get('payment.creditCard', {});
    
    if (!ccConfig.enabled) {
      this.logger.debug('Credit card payment processor is disabled');
      return;
    }
    
    try {
      this.paymentProcessors.creditCard = {
        name: 'Credit Card',
        enabled: true,
        config: ccConfig,
        processPayment: async (paymentData) => {
          this.logger.info('Processing payment with Credit Card', { amount: paymentData.amount });
          // 实际实现中应该调用信用卡处理API
          return {
            success: true,
            transactionId: `cc_${crypto.randomUUID()}`,
            processor: 'creditCard',
            timestamp: new Date()
          };
        },
        validateCard: (cardData) => {
          // 简单的信用卡验证逻辑
          if (!cardData || !cardData.number) return false;
          
          // 移除空格和破折号
          const cardNumber = cardData.number.replace(/[\s-]/g, '');
          
          // Luhn算法验证
          return this._luhnCheck(cardNumber);
        }
      };
      
      this.logger.info('Credit Card payment processor registered');
    } catch (error) {
      this.logger.error('Failed to register Credit Card payment processor:', error);
    }
  }

  /**
   * Luhn算法验证信用卡号
   * @private
   * @param {string} cardNumber - 信用卡号
   * @returns {boolean} 是否有效
   */
  _luhnCheck(cardNumber) {
    const digits = cardNumber.split('').map(Number);
    let sum = 0;
    let isEven = false;
    
    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = digits[i];
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  }

  /**
   * 处理支付
   * @param {Object} paymentData - 支付数据
   * @param {string} paymentData.userId - 用户ID
   * @param {number} paymentData.amount - 支付金额
   * @param {string} paymentData.currency - 货币代码
   * @param {string} paymentData.paymentMethod - 支付方式
   * @param {Object} paymentData.paymentDetails - 支付详情
   * @param {string} paymentData.description - 支付描述
   * @returns {Promise<Object>} 支付结果
   */
  async processPayment(paymentData) {
    try {
      this.logger.info('Processing payment request', { 
        userId: paymentData.userId, 
        amount: paymentData.amount,
        paymentMethod: paymentData.paymentMethod 
      });
      
      // 验证支付数据
      this._validatePaymentData(paymentData);
      
      // 检查支付方式是否支持
      const processor = this.paymentProcessors[paymentData.paymentMethod];
      if (!processor || !processor.enabled) {
        throw new Error(`Unsupported or disabled payment method: ${paymentData.paymentMethod}`);
      }
      
      // 检查用户是否存在
      const user = await this.userRepository.findById(paymentData.userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      // 创建交易记录
      const transaction = {
        userId: paymentData.userId,
        amount: paymentData.amount,
        currency: paymentData.currency || this.config.get('payment.defaultCurrency', 'USD'),
        paymentMethod: paymentData.paymentMethod,
        status: 'pending',
        description: paymentData.description || `Payment of ${paymentData.amount}`,
        paymentDetails: this._sanitizePaymentDetails(paymentData.paymentDetails),
        createdAt: new Date()
      };
      
      // 保存交易记录
      const savedTransaction = await this.transactionRepository.create(transaction);
      
      try {
        // 处理支付
        const paymentResult = await processor.processPayment(paymentData);
        
        // 更新交易记录
        await this.transactionRepository.update(savedTransaction.id, {
          status: 'completed',
          externalTransactionId: paymentResult.transactionId,
          processedAt: new Date(),
          paymentResult: paymentResult
        });
        
        this.logger.info('Payment processed successfully', { 
          transactionId: savedTransaction.id,
          externalTransactionId: paymentResult.transactionId 
        });
        
        return {
          success: true,
          transactionId: savedTransaction.id,
          externalTransactionId: paymentResult.transactionId,
          paymentMethod: paymentData.paymentMethod,
          amount: paymentData.amount,
          currency: transaction.currency
        };
      } catch (paymentError) {
        // 更新交易记录为失败
        await this.transactionRepository.update(savedTransaction.id, {
          status: 'failed',
          errorMessage: paymentError.message,
          failedAt: new Date()
        });
        
        this.logger.error('Payment processing failed', { 
          transactionId: savedTransaction.id,
          error: paymentError.message 
        });
        
        throw new AppError(`Payment processing failed: ${paymentError.message}`, 400, paymentError);
      }
    } catch (error) {
      this.logger.error('Payment request failed', error);
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError(`Failed to process payment: ${error.message}`, 500, error);
    }
  }

  /**
   * 创建支付意向（用于客户端支付流程）
   * @param {Object} paymentData - 支付数据
   * @returns {Promise<Object>} 支付意向
   */
  async createPaymentIntent(paymentData) {
    try {
      this.logger.info('Creating payment intent', { 
        userId: paymentData.userId, 
        amount: paymentData.amount,
        paymentMethod: paymentData.paymentMethod 
      });
      
      // 验证支付数据
      this._validatePaymentData(paymentData);
      
      // 检查支付方式
      const processor = this.paymentProcessors[paymentData.paymentMethod];
      if (!processor || !processor.enabled) {
        throw new Error(`Unsupported or disabled payment method: ${paymentData.paymentMethod}`);
      }
      
      // 根据支付方式创建意向
      let intentResult;
      
      if (paymentData.paymentMethod === 'stripe' && processor.createPaymentIntent) {
        intentResult = await processor.createPaymentIntent(paymentData);
      } else if (paymentData.paymentMethod === 'paypal' && processor.createPaymentOrder) {
        intentResult = await processor.createPaymentOrder(paymentData);
      } else {
        throw new Error(`Payment intent creation not supported for ${paymentData.paymentMethod}`);
      }
      
      // 记录支付意向
      const intentRecord = {
        userId: paymentData.userId,
        amount: paymentData.amount,
        currency: paymentData.currency || this.config.get('payment.defaultCurrency', 'USD'),
        paymentMethod: paymentData.paymentMethod,
        intentId: intentResult.paymentIntentId || intentResult.orderId,
        intentDetails: intentResult,
        createdAt: new Date()
      };
      
      // 这里可以保存意向记录到数据库
      this.logger.info('Payment intent created successfully', { 
        intentId: intentRecord.intentId 
      });
      
      return {
        success: true,
        paymentMethod: paymentData.paymentMethod,
        intentId: intentRecord.intentId,
        clientSecret: intentResult.clientSecret,
        approvalUrl: intentResult.approvalUrl,
        ...intentResult
      };
    } catch (error) {
      this.logger.error('Failed to create payment intent', error);
      throw new AppError(`Failed to create payment intent: ${error.message}`, 500, error);
    }
  }

  /**
   * 验证支付数据
   * @private
   * @param {Object} paymentData - 支付数据
   * @throws {Error} 验证失败时抛出错误
   */
  _validatePaymentData(paymentData) {
    if (!paymentData) {
      throw new Error('Payment data is required');
    }
    
    if (!paymentData.userId) {
      throw new Error('User ID is required');
    }
    
    if (!paymentData.amount || paymentData.amount <= 0) {
      throw new Error('Valid payment amount is required');
    }
    
    if (!paymentData.paymentMethod) {
      throw new Error('Payment method is required');
    }
    
    // 验证信用卡信息（如果是信用卡支付）
    if (paymentData.paymentMethod === 'creditCard' && paymentData.paymentDetails) {
      const processor = this.paymentProcessors.creditCard;
      if (processor && processor.validateCard && !processor.validateCard(paymentData.paymentDetails)) {
        throw new Error('Invalid credit card information');
      }
    }
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
    
    const sanitized = { ...paymentDetails };
    
    // 移除敏感信息
    delete sanitized.cardNumber;
    delete sanitized.cvv;
    delete sanitized.fullName;
    delete sanitized.securityCode;
    
    // 掩码处理部分信息
    if (paymentDetails.lastFour) {
      sanitized.lastFour = paymentDetails.lastFour;
    } else if (paymentDetails.cardNumber) {
      sanitized.lastFour = paymentDetails.cardNumber.slice(-4);
    }
    
    return sanitized;
  }

  /**
   * 退款交易
   * @param {string} transactionId - 交易ID
   * @param {number} amount - 退款金额（可选，默认全额）
   * @param {string} reason - 退款原因
   * @returns {Promise<Object>} 退款结果
   */
  async refundTransaction(transactionId, amount = null, reason = 'Customer request') {
    try {
      this.logger.info('Processing refund request', { 
        transactionId,
        amount
      });
      
      // 查找交易记录
      const transaction = await this.transactionRepository.findById(transactionId);
      if (!transaction) {
        throw new Error('Transaction not found');
      }
      
      // 检查交易状态
      if (transaction.status !== 'completed') {
        throw new Error(`Cannot refund a transaction with status: ${transaction.status}`);
      }
      
      // 验证退款金额
      const refundAmount = amount || transaction.amount;
      if (refundAmount <= 0 || refundAmount > transaction.amount) {
        throw new Error('Invalid refund amount');
      }
      
      // 检查处理器是否支持退款
      const processor = this.paymentProcessors[transaction.paymentMethod];
      if (!processor || !processor.enabled) {
        throw new Error(`Refund not supported for payment method: ${transaction.paymentMethod}`);
      }
      
      // 这里应该调用支付处理器的退款API
      // 为了示例，我们模拟退款过程
      const refundResult = {
        success: true,
        refundId: `refund_${crypto.randomUUID()}`,
        amount: refundAmount,
        currency: transaction.currency,
        timestamp: new Date()
      };
      
      // 更新交易记录
      await this.transactionRepository.update(transactionId, {
        refundStatus: 'refunded',
        refundAmount: refundAmount,
        refundReason: reason,
        refundDetails: refundResult,
        refundedAt: new Date()
      });
      
      // 创建退款交易记录
      const refundTransaction = {
        userId: transaction.userId,
        amount: -refundAmount, // 负数表示退款
        currency: transaction.currency,
        paymentMethod: transaction.paymentMethod,
        status: 'completed',
        description: `Refund for transaction ${transactionId}`,
        relatedTransactionId: transactionId,
        refundDetails: refundResult,
        createdAt: new Date()
      };
      
      await this.transactionRepository.create(refundTransaction);
      
      this.logger.info('Refund processed successfully', { 
        transactionId,
        refundId: refundResult.refundId,
        amount: refundAmount 
      });
      
      return {
        success: true,
        transactionId,
        refundId: refundResult.refundId,
        amount: refundAmount,
        currency: transaction.currency,
        reason
      };
    } catch (error) {
      this.logger.error('Refund request failed', { transactionId, error: error.message });
      throw new AppError(`Failed to process refund: ${error.message}`, 500, error);
    }
  }

  /**
   * 获取交易历史
   * @param {string} userId - 用户ID
   * @param {Object} filter - 过滤条件
   * @param {number} page - 页码
   * @param {number} limit - 每页数量
   * @returns {Promise<Object>} 交易历史
   */
  async getTransactionHistory(userId, filter = {}, page = 1, limit = 20) {
    try {
      this.logger.info('Getting transaction history', { userId, page, limit });
      
      // 构建查询条件
      const query = {
        userId,
        ...filter
      };
      
      // 获取交易记录
      const transactions = await this.transactionRepository.findPaged(query, page, limit);
      
      return transactions;
    } catch (error) {
      this.logger.error('Failed to get transaction history', { userId, error: error.message });
      throw new AppError('Failed to get transaction history', 500, error);
    }
  }

  /**
   * 获取交易统计信息
   * @param {string} userId - 用户ID
   * @param {Object} timeRange - 时间范围
   * @returns {Promise<Object>} 统计信息
   */
  async getPaymentStatistics(userId, timeRange = {}) {
    try {
      this.logger.info('Getting payment statistics', { userId });
      
      // 构建查询条件
      const query = {
        userId,
        status: 'completed'
      };
      
      if (timeRange.startDate) {
        query.createdAt = { $gte: new Date(timeRange.startDate) };
      }
      
      if (timeRange.endDate) {
        query.createdAt = {
          ...query.createdAt,
          $lte: new Date(timeRange.endDate)
        };
      }
      
      // 获取统计信息
      const stats = await this.transactionRepository.getStatistics(query);
      
      return {
        totalTransactions: stats.totalCount || 0,
        totalAmount: stats.totalAmount || 0,
        averageTransaction: stats.averageAmount || 0,
        paymentsByMethod: stats.byPaymentMethod || {},
        timeRange
      };
    } catch (error) {
      this.logger.error('Failed to get payment statistics', { userId, error: error.message });
      throw new AppError('Failed to get payment statistics', 500, error);
    }
  }

  /**
   * 验证支付回调
   * @param {string} paymentMethod - 支付方式
   * @param {Object} payload - 回调数据
   * @param {Object} headers - 请求头
   * @returns {Promise<Object>} 验证结果
   */
  async verifyWebhook(paymentMethod, payload, headers) {
    try {
      this.logger.info('Verifying webhook', { paymentMethod });
      
      // 检查支付方式
      const processor = this.paymentProcessors[paymentMethod];
      if (!processor || !processor.enabled) {
        throw new Error(`Unsupported payment method: ${paymentMethod}`);
      }
      
      // 根据支付方式验证webhook
      let verificationResult = { valid: false };
      
      if (paymentMethod === 'stripe') {
        // Stripe webhook验证逻辑
        const stripeConfig = processor.config;
        const signature = headers['stripe-signature'];
        
        if (!signature || !stripeConfig.webhookSecret) {
          throw new Error('Missing webhook signature or secret');
        }
        
        // 实际实现中应该使用Stripe SDK验证
        verificationResult = { 
          valid: true,
          event: payload.type,
          data: payload.data 
        };
      } else if (paymentMethod === 'paypal') {
        // PayPal webhook验证逻辑
        verificationResult = { 
          valid: true,
          event: payload.event_type,
          resource: payload.resource 
        };
      }
      
      if (!verificationResult.valid) {
        throw new Error('Invalid webhook signature');
      }
      
      this.logger.info('Webhook verified successfully', { paymentMethod, event: verificationResult.event });
      
      // 处理webhook事件
      await this._processWebhookEvent(paymentMethod, verificationResult);
      
      return verificationResult;
    } catch (error) {
      this.logger.error('Webhook verification failed', { paymentMethod, error: error.message });
      throw new AppError(`Webhook verification failed: ${error.message}`, 400, error);
    }
  }

  /**
   * 处理webhook事件
   * @private
   * @param {string} paymentMethod - 支付方式
   * @param {Object} eventData - 事件数据
   */
  async _processWebhookEvent(paymentMethod, eventData) {
    try {
      // 根据事件类型处理
      if (eventData.event === 'payment_intent.succeeded' || eventData.event === 'CHECKOUT.ORDER.APPROVED') {
        // 支付成功事件处理
        this.logger.info('Processing payment success event', { paymentMethod });
        
        // 更新相应的交易记录
        // 这里应该根据externalTransactionId查找并更新
      } else if (eventData.event === 'payment_intent.payment_failed' || eventData.event === 'CHECKOUT.ORDER.CANCELLED') {
        // 支付失败事件处理
        this.logger.info('Processing payment failure event', { paymentMethod });
      }
    } catch (error) {
      this.logger.error('Failed to process webhook event', { paymentMethod, event: eventData.event, error: error.message });
    }
  }

  /**
   * 获取支持的支付方式
   * @returns {Array} 支持的支付方式
   */
  getAvailablePaymentMethods() {
    return Object.values(this.paymentProcessors)
      .filter(processor => processor.enabled)
      .map(processor => ({
        id: processor.name.toLowerCase(),
        name: processor.name,
        config: {
          // 只返回必要的配置信息
          currencies: processor.config.supportedCurrencies || ['USD', 'EUR', 'GBP'],
          minAmount: processor.config.minAmount || 0.01,
          maxAmount: processor.config.maxAmount || 999999.99
        }
      }));
  }
}

module.exports = { PaymentService };