/**
 * 订单消息处理器
 * 处理与订单相关的各种消息事件
 */

const logger = require('../../core/utils/logger');
const notificationService = require('../notification/notificationService');
const inventoryService = require('../../core/services/inventoryService');

class OrderMessageHandler {
  /**
   * 处理订单创建消息
   * @param {Object} message - 订单创建消息
   */
  static async handleOrderCreated(message) {
    try {
      logger.info('处理订单创建消息:', message);
      
      const { orderId, userId, items, totalAmount } = message;
      
      // 1. 锁定库存
      if (items && items.length > 0) {
        for (const item of items) {
          await inventoryService.lockInventory(item.productId, item.quantity);
        }
      }
      
      // 2. 发送订单创建通知
      await notificationService.sendNotification({
        userId,
        type: 'order_created',
        title: '订单创建成功',
        content: `您的订单 #${orderId} 已创建成功，总金额：¥${totalAmount.toFixed(2)}`,
        data: { orderId, totalAmount }
      });
      
      // 3. 记录操作日志
      logger.info(`订单 #${orderId} 创建成功，已锁定库存并发送通知`);
      
    } catch (error) {
      logger.error('处理订单创建消息失败:', error);
      // 这里可以添加重试逻辑或死信队列处理
    }
  }

  /**
   * 处理订单支付成功消息
   * @param {Object} message - 订单支付成功消息
   */
  static async handleOrderPaid(message) {
    try {
      logger.info('处理订单支付成功消息:', message);
      
      const { orderId, userId, items, totalAmount, paymentInfo } = message;
      
      // 1. 确认库存
      if (items && items.length > 0) {
        for (const item of items) {
          await inventoryService.confirmInventory(item.productId, item.quantity);
        }
      }
      
      // 2. 发送支付成功通知给买家
      await notificationService.sendNotification({
        userId,
        type: 'payment_success',
        title: '支付成功',
        content: `您的订单 #${orderId} 支付成功，我们将尽快为您发货`,
        data: { orderId, paymentInfo }
      });
      
      // 3. 发送新订单通知给卖家
      if (items && items.length > 0) {
        const uniqueSellerIds = [...new Set(items.map(item => item.sellerId))];
        for (const sellerId of uniqueSellerIds) {
          await notificationService.sendNotification({
            userId: sellerId,
            type: 'new_order',
            title: '您有一笔新订单',
            content: `您有一笔新订单 #${orderId}，请及时处理`,
            data: { orderId }
          });
        }
      }
      
      logger.info(`订单 #${orderId} 支付成功，已确认库存并发送通知`);
      
    } catch (error) {
      logger.error('处理订单支付成功消息失败:', error);
    }
  }

  /**
   * 处理订单取消消息
   * @param {Object} message - 订单取消消息
   */
  static async handleOrderCanceled(message) {
    try {
      logger.info('处理订单取消消息:', message);
      
      const { orderId, userId, items, reason } = message;
      
      // 1. 释放库存
      if (items && items.length > 0) {
        for (const item of items) {
          await inventoryService.releaseInventory(item.productId, item.quantity);
        }
      }
      
      // 2. 发送订单取消通知
      await notificationService.sendNotification({
        userId,
        type: 'order_canceled',
        title: '订单已取消',
        content: `您的订单 #${orderId} 已取消${reason ? '，原因：' + reason : ''}`,
        data: { orderId, reason }
      });
      
      logger.info(`订单 #${orderId} 已取消，已释放库存并发送通知`);
      
    } catch (error) {
      logger.error('处理订单取消消息失败:', error);
    }
  }

  /**
   * 处理订单发货消息
   * @param {Object} message - 订单发货消息
   */
  static async handleOrderShipped(message) {
    try {
      logger.info('处理订单发货消息:', message);
      
      const { orderId, userId, trackingNumber, logisticsCompany } = message;
      
      // 发送发货通知
      await notificationService.sendNotification({
        userId,
        type: 'order_shipped',
        title: '订单已发货',
        content: `您的订单 #${orderId} 已发货，物流单号：${trackingNumber}，物流公司：${logisticsCompany}`,
        data: { orderId, trackingNumber, logisticsCompany }
      });
      
      logger.info(`订单 #${orderId} 已发货，已发送通知`);
      
    } catch (error) {
      logger.error('处理订单发货消息失败:', error);
    }
  }

  /**
   * 处理订单完成消息
   * @param {Object} message - 订单完成消息
   */
  static async handleOrderCompleted(message) {
    try {
      logger.info('处理订单完成消息:', message);
      
      const { orderId, userId, totalAmount } = message;
      
      // 发送订单完成通知
      await notificationService.sendNotification({
        userId,
        type: 'order_completed',
        title: '订单已完成',
        content: `您的订单 #${orderId} 已完成，感谢您的购买`,
        data: { orderId, totalAmount }
      });
      
      logger.info(`订单 #${orderId} 已完成，已发送通知`);
      
    } catch (error) {
      logger.error('处理订单完成消息失败:', error);
    }
  }

  /**
   * 注册订单消息处理器
   * @param {Object} cacheManager - 缓存管理器实例
   */
  static registerHandlers(cacheManager) {
    logger.info('注册订单消息处理器');
    
    cacheManager.subscribe('order.created', this.handleOrderCreated.bind(this));
    cacheManager.subscribe('order.paid', this.handleOrderPaid.bind(this));
    cacheManager.subscribe('order.canceled', this.handleOrderCanceled.bind(this));
    cacheManager.subscribe('order.shipped', this.handleOrderShipped.bind(this));
    cacheManager.subscribe('order.completed', this.handleOrderCompleted.bind(this));
  }
}

module.exports = OrderMessageHandler;