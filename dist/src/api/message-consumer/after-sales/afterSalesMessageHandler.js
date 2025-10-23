/**
 * 售后服务消息处理器
 * 处理与售后服务相关的各种消息事件
 */

const logger = require('../../core/utils/logger');
const notificationService = require('../notification/notificationService');
const refundService = require('../../core/services/refundService');
const inventoryService = require('../../core/services/inventoryService');

class AfterSalesMessageHandler {
  /**
   * 处理售后申请创建消息
   * @param {Object} message - 售后申请创建消息
   */
  static async handleAfterSalesCreated(message) {
    try {
      logger.info('处理售后申请创建消息:', message);
      
      const { requestId, userId, orderId, productId, reason, type } = message;
      
      // 发送售后申请通知给买家
      await notificationService.sendNotification({
        userId,
        type: 'after_sales_created',
        title: '售后申请已提交',
        content: `您的${type === 'refund' ? '退款' : type === 'exchange' ? '换货' : '退货'}申请已提交，申请号：${requestId}`,
        data: { requestId, orderId, productId, reason, type }
      });
      
      // 发送售后申请通知给卖家（假设商品有卖家信息）
      await notificationService.sendNotification({
        userId: 'seller_' + Math.floor(Math.random() * 10), // 模拟卖家ID
        type: 'new_after_sales_request',
        title: '您有新的售后申请',
        content: `订单 #${orderId} 的商品申请${type === 'refund' ? '退款' : type === 'exchange' ? '换货' : '退货'}，申请号：${requestId}`,
        data: { requestId, orderId, productId, userId, reason, type }
      });
      
      logger.info(`售后申请 #${requestId} 创建成功，已通知相关方`);
      
    } catch (error) {\ {\ {
      
      logger.error('处理售后申请创建消息失败:', error);
    }
  }

  /**
   * 处理售后申请审批消息
   * @param {Object} message - 售后申请审批消息
   */
  static async handleAfterSalesApproved(message) {
    try {
      logger.info('处理售后申请审批消息:', message);
      
      const { requestId, userId, orderId, approved, rejectReason, refundAmount } = message;
      
      if (approved) {
        // 审批通过
        await notificationService.sendNotification({
          userId,
          type: 'after_sales_approved',
          title: '售后申请已通过',
          content: `您的售后申请 #${requestId} 已通过审批${refundAmount ? '，退款金额：¥' + refundAmount.toFixed(2) : ''}`,
          data: { requestId, orderId, approved, refundAmount }
        });
        
        // 如果是退款，发起退款流程
        if (refundAmount > 0) {
          await refundService.initiateRefund(requestId, orderId, refundAmount);
        }
      } else {
        // 审批拒绝
        await notificationService.sendNotification({
          userId,
          type: 'after_sales_rejected',
          title: '售后申请未通过',
          content: `您的售后申请 #${requestId} 未通过审批${rejectReason ? '，原因：' + rejectReason : ''}`,
          data: { requestId, orderId, approved, rejectReason }
        });
      }
      
      logger.info(`售后申请 #${requestId} 审批${approved ? '通过' : '拒绝'}`);
      
    } catch (error) {
      logger.error('处理售后申请审批消息失败:', error);
    }
  }

  /**
   * 处理买家退货发货消息
   * @param {Object} message - 买家退货发货消息
   */
  static async handleReturnShipped(message) {
    try {
      logger.info('处理买家退货发货消息:', message);
      
      const { requestId, userId, orderId, trackingNumber, logisticsCompany } = message;
      
      // 发送退货发货通知给卖家
      await notificationService.sendNotification({
        userId: 'seller_' + Math.floor(Math.random() * 10), // 模拟卖家ID
        type: 'return_shipped',
        title: '买家已退货',
        content: `售后申请 #${requestId} 的买家已退货，物流单号：${trackingNumber}，物流公司：${logisticsCompany}`,
        data: { requestId, orderId, trackingNumber, logisticsCompany }
      });
      
      logger.info(`售后申请 #${requestId} 买家已退货，物流单号：${trackingNumber}`);
      
    } catch (error) {
      logger.error('处理买家退货发货消息失败:', error);
    }
  }

  /**
   * 处理卖家收货确认消息
   * @param {Object} message - 卖家收货确认消息
   */
  static async handleReturnReceived(message) {
    try {
      logger.info('处理卖家收货确认消息:', message);
      
      const { requestId, userId, orderId, refundAmount, type } = message;
      
      // 1. 如果是退货退款，恢复库存
      if (type === 'refund_with_return') {
        // 假设消息中包含商品信息
        if (message.productInfo) {
          await inventoryService.addInventory(message.productInfo.productId, message.productInfo.quantity);
        }
      }
      
      // 2. 发送收货确认通知给买家
      await notificationService.sendNotification({
        userId,
        type: 'return_received',
        title: '退货已签收',
        content: `您的退货已被签收，退款金额 ¥${refundAmount.toFixed(2)} 将尽快到账`,
        data: { requestId, orderId, refundAmount }
      });
      
      logger.info(`售后申请 #${requestId} 卖家已确认收货，已恢复库存`);
      
    } catch (error) {
      logger.error('处理卖家收货确认消息失败:', error);
    }
  }

  /**
   * 处理退款完成消息
   * @param {Object} message - 退款完成消息
   */
  static async handleRefundCompleted(message) {
    try {
      logger.info('处理退款完成消息:', message);
      
      const { requestId, userId, orderId, refundAmount, refundTime, refundMethod } = message;
      
      // 发送退款完成通知给买家
      await notificationService.sendNotification({
        userId,
        type: 'refund_completed',
        title: '退款已完成',
        content: `您的退款 ¥${refundAmount.toFixed(2)} 已成功支付，预计1-3个工作日到账您的${refundMethod || '支付账户'}`,
        data: { requestId, orderId, refundAmount, refundTime, refundMethod }
      });
      
      logger.info(`售后申请 #${requestId} 退款完成，金额：¥${refundAmount.toFixed(2)}`);
      
    } catch (error) {
      logger.error('处理退款完成消息失败:', error);
    }
  }

  /**
   * 处理售后完成消息
   * @param {Object} message - 售后完成消息
   */
  static async handleAfterSalesCompleted(message) {
    try {
      logger.info('处理售后完成消息:', message);
      
      const { requestId, userId, orderId, type, resolution } = message;
      
      // 发送售后完成通知给买家
      await notificationService.sendNotification({
        userId,
        type: 'after_sales_completed',
        title: '售后已完成',
        content: `您的${type === 'refund' ? '退款' : type === 'exchange' ? '换货' : '退货'}申请 #${requestId} 已完成处理${resolution ? '，解决方案：' + resolution : ''}`,
        data: { requestId, orderId, type, resolution }
      });
      
      // 发送售后完成通知给卖家
      await notificationService.sendNotification({
        userId: 'seller_' + Math.floor(Math.random() * 10), // 模拟卖家ID
        type: 'after_sales_completed',
        title: '售后申请已处理完成',
        content: `售后申请 #${requestId} 已完成处理`,
        data: { requestId, orderId, type }
      });
      
      logger.info(`售后申请 #${requestId} 已完成处理`);
      
    } catch (error) {
      logger.error('处理售后完成消息失败:', error);
    }
  }

  /**
   * 注册售后服务消息处理器
   * @param {Object} cacheManager - 缓存管理器实例
   */
  static registerHandlers(cacheManager) {
    logger.info('注册售后服务消息处理器');
    
    cacheManager.subscribe('after_sales.created', this.handleAfterSalesCreated.bind(this));
    cacheManager.subscribe('after_sales.approved', this.handleAfterSalesApproved.bind(this));
    cacheManager.subscribe('after_sales.return_shipped', this.handleReturnShipped.bind(this));
    cacheManager.subscribe('after_sales.return_received', this.handleReturnReceived.bind(this));
    cacheManager.subscribe('after_sales.refund_completed', this.handleRefundCompleted.bind(this));
    cacheManager.subscribe('after_sales.completed', this.handleAfterSalesCompleted.bind(this));
  }
}

module.exports = AfterSalesMessageHandler;