/**
 * 消息消费者模块
 * 用于处理异步消息
 */

const cacheManager = require('../core/cache/cacheManager');
const logger = require('../core/utils/logger');
const di = require('../core/di/container');

// 导入各种消息处理器
const OrderMessageHandler = require('./order/orderMessageHandler');
const ProductMessageHandler = require('./product/productMessageHandler');
const MemberMessageHandler = require('./member/memberMessageHandler');
const AfterSalesMessageHandler = require('./after-sales/afterSalesMessageHandler');
const NotificationService = require('./notification/notificationService');

// 导入增强功能模块
const EnhancedMessageQueue = require('./enhancedMessageQueue');
const MessageProcessingMonitor = require('./monitoring/messageProcessingMonitor');
const PriceChangeHandler = require('./product/priceChangeHandler');
const PromotionMessageHandler = require('./promotion/promotionMessageHandler');
const ComplaintMessageHandler = require('./complaint/complaintMessageHandler');

/**
 * 启动消息消费者
 */
async function start() {
  logger.info('启动消息消费者模块');
  
  try {
    // 初始化增强版消息队列和监控器
    await initializeEnhancedFeatures();
    
    // 确保cacheManager存在
    if (!cacheManager || typeof cacheManager.subscribe !== 'function') {
      throw new Error('cacheManager初始化失败或缺少subscribe方法');
    }
    
    // 注册订单相关的消息处理器
    OrderMessageHandler.registerHandlers(cacheManager);
    
    // 注册商品相关的消息处理器
    ProductMessageHandler.registerHandlers(cacheManager);
    
    // 注册会员相关的消息处理器
    MemberMessageHandler.registerHandlers(cacheManager);
    
    // 注册售后服务相关的消息处理器
    AfterSalesMessageHandler.registerHandlers(cacheManager);
    
    // 注册通知发送处理器
    registerNotificationHandlers();
    
    // 注册支付相关的消息处理器
    registerPaymentHandlers();
    
    logger.info('消息消费者模块启动完成，所有处理器已注册');
  } catch (error) {
    logger.error('消息消费者模块启动失败:', error);
    throw error;
  }
}

/**
 * 初始化增强功能
 */
async function initializeEnhancedFeatures() {
  try {
    logger.info('初始化消息处理增强功能...');
    
    // 初始化增强版消息队列
    const messageQueue = new EnhancedMessageQueue();
    await messageQueue.initialize();
    
    // 初始化监控器
    const monitor = new MessageProcessingMonitor();
    await monitor.initialize();
    
    // 注册新增的消息处理器
    PriceChangeHandler.registerHandlers(messageQueue);
    PromotionMessageHandler.registerHandlers(messageQueue);
    ComplaintMessageHandler.registerHandlers(messageQueue);
    
    // 启动监控统计任务
    startMonitoringTasks(monitor);
    
    logger.info('增强功能初始化完成');
    
    // 存储到di容器中供其他模块使用
    di.set('enhancedMessageQueue', messageQueue);
    di.set('messageProcessingMonitor', monitor);
  } catch (error) {
    logger.error('初始化增强功能失败:', error);
    // 增强功能失败不影响核心功能启动，只记录错误
  }
}

/**
 * 启动监控任务
 */
function startMonitoringTasks(monitor) {
  // 每小时生成一次统计报告
  setInterval(async () => {
    try {
      const stats = await monitor.generateStatisticsReport();
      logger.info('消息处理统计报告:', stats.summary);
    } catch (error) {
      logger.error('生成统计报告失败:', error);
    }
  }, 60 * 60 * 1000);
  
  // 每天清理过期统计数据
  setInterval(async () => {
    try {
      await monitor.cleanupOldStatistics();
    } catch (error) {
      logger.error('清理过期统计数据失败:', error);
    }
  }, 24 * 60 * 60 * 1000);
}

/**
 * 注册通知相关的消息处理器
 */
function registerNotificationHandlers() {
  // 订阅通知发送事件
  cacheManager.subscribe('notification.send', async (message) => {
    try {
      logger.info('收到通知发送事件:', message);
      await NotificationService.sendNotification(message);
    } catch (error) {
      logger.error('处理通知发送事件失败:', error);
    }
  });
  
  // 订阅系统广播事件
  cacheManager.subscribe('notification.broadcast', async (message) => {
    try {
      logger.info('收到系统广播事件:', message);
      await NotificationService.sendBroadcast(message);
    } catch (error) {
      logger.error('处理系统广播事件失败:', error);
    }
  });
  
  // 订阅微信模板消息事件
  cacheManager.subscribe('notification.wechat.template', async (message) => {
    try {
      logger.info('收到微信模板消息事件:', message);
      // 调用微信服务发送模板消息
      const wechatService = di.get('wechatService') || require('../core/services/wechatService');
      await wechatService.sendTemplateMessage(message);
    } catch (error) {
      logger.error('处理微信模板消息事件失败:', error);
    }
  });
}

/**
 * 注册支付相关的消息处理器
 */
function registerPaymentHandlers() {
  // 订阅支付回调事件
  cacheManager.subscribe('payment.callback', async (message) => {
    try {
      logger.info('收到支付回调事件:', message);
      
      // 处理支付回调
      const paymentService = di.get('paymentService') || require('../core/services/paymentService');
      await paymentService.processPaymentCallback(message);
      
    } catch (error) {
      logger.error('处理支付回调事件失败:', error);
    }
  });
  
  // 订阅退款成功事件
  cacheManager.subscribe('refund.success', async (message) => {
    try {
      logger.info('收到退款成功事件:', message);
      
      // 处理退款成功逻辑
      await NotificationService.sendNotification({
        userId: message.userId,
        type: 'refund_success',
        title: '退款成功',
        content: `您的退款申请已处理成功，金额：¥${message.amount.toFixed(2)}`,
        data: message
      });
      
    } catch (error) {
      logger.error('处理退款成功事件失败:', error);
    }
  });
}

module.exports = {
  start,
  // 导出获取监控器的方法
  getMessageMonitor: () => di.get('messageProcessingMonitor'),
  getEnhancedMessageQueue: () => di.get('enhancedMessageQueue')
};

// 提供优雅关闭方法
module.exports.stop = async () => {
  try {
    logger.info('关闭消息消费者模块...');
    
    // 关闭增强功能
    const messageQueue = di.get('enhancedMessageQueue');
    const monitor = di.get('messageProcessingMonitor');
    
    if (messageQueue && messageQueue.shutdown) {
      await messageQueue.shutdown();
    }
    
    if (monitor && monitor.shutdown) {
      await monitor.shutdown();
    }
    
    logger.info('消息消费者模块关闭完成');
    return true;
  } catch (error) {
    logger.error('关闭消息消费者模块失败:', error);
    return false;
  }
};

// 提供获取当前状态的方法
module.exports.getStatus = async () => {
  try {
    const monitor = di.get('messageProcessingMonitor');
    if (monitor && monitor.getStatus) {
      return await monitor.getStatus();
    }
    return { status: 'running' };
  } catch (error) {
    return { status: 'error', error: error.message };
  }
};