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

/**
 * 启动消息消费者
 */
async function start() {
  logger.info('启动消息消费者模块');
  
  try {
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
  start
};