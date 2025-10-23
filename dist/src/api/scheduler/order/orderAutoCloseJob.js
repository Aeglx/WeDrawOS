/**
 * 订单自动关闭任务
 * 处理超时未支付订单的自动关闭
 */
const JobBase = require('../job/jobBase');
const logger = require('../../core/utils/logger');
const cacheManager = require('../../core/cache/cacheManager');

class OrderAutoCloseJob extends JobBase {
  constructor() {
    super({
      name: 'OrderAutoCloseJob',
      cronExpression: '* * * * *', // 每分钟执行一次
      timeout: 60000 // 1分钟超时
    });
    
    // 模拟订单数据（无数据库环境）
    this.mockOrders = [];
  }

  /**
   * 执行订单自动关闭逻辑
   */
  async run() {
    logger.info('开始执行订单自动关闭任务');
    
    try {
      // 1. 获取需要检查的订单
      const ordersToCheck = await this.getPendingPaymentOrders();
      
      logger.info(`找到 ${ordersToCheck.length} 个待支付订单需要检查`);
      
      // 2. 检查并关闭超时订单
      const closedOrders = await this.checkAndCloseTimeoutOrders(ordersToCheck);
      
      logger.info(`成功关闭 ${closedOrders.length} 个超时订单`);
      
      // 3. 处理关闭后的清理工作
      if (closedOrders.length > 0) {
        await this.handlePostCloseActions(closedOrders);
      }
      
    } catch (error) {
      logger.error('处理订单自动关闭时出错:', error);
      throw error;
    }
  }

  /**
   * 获取待支付订单
   */
  async getPendingPaymentOrders() {
    try {
      // 尝试从缓存获取订单数据
      let orders = [];
      
      try {
        const cachedOrders = await cacheManager.get('pending_payment_orders');
        if (cachedOrders) {
          orders = JSON.parse(cachedOrders);
        }
      } catch (cacheError) {
        logger.warn('从缓存获取订单失败，使用模拟数据:', cacheError.message);
      }
      
      // 如果没有缓存数据或缓存读取失败，使用模拟数据
      if (orders.length === 0) {
        orders = this.getMockOrders();
      }
      
      return orders.filter(order => 
        order.status === 'pending_payment' && 
        new Date(order.createdAt) < new Date()
      );
    } catch (error) {
      logger.error('获取待支付订单失败:', error);
      return this.getMockOrders().filter(order => order.status === 'pending_payment');
    }
  }

  /**
   * 检查并关闭超时订单
   */
  async checkAndCloseTimeoutOrders(orders) {
    const closedOrders = [];
    const now = new Date();
    const timeoutMinutes = 30; // 30分钟超时
    
    for (const order of orders) {
      const orderTime = new Date(order.createdAt);
      const timeDiffInMinutes = (now - orderTime) / (1000 * 60);
      
      // 检查是否超时
      if (timeDiffInMinutes >= timeoutMinutes) {
        try {
          // 关闭订单
          await this.closeOrder(order);
          closedOrders.push(order);
          
          logger.info(`订单 ${order.orderId} 已自动关闭，创建时间: ${order.createdAt}，超时时间: ${timeoutMinutes}分钟`);
        } catch (error) {
          logger.error(`关闭订单 ${order.orderId} 失败:`, error);
        }
      }
    }
    
    return closedOrders;
  }

  /**
   * 关闭订单
   */
  async closeOrder(order) {
    try {
      // 更新订单状态
      order.status = 'closed';
      order.closedAt = new Date().toISOString();
      order.closeReason = 'payment_timeout';
      
      // 更新缓存中的订单数据
      try {
        const cachedOrders = await cacheManager.get('pending_payment_orders');
        if (cachedOrders) {
          const orders = JSON.parse(cachedOrders);
          const index = orders.findIndex(o => o.orderId === order.orderId);
          if (index !== -1) {
            orders[index] = order;
            await cacheManager.set('pending_payment_orders', JSON.stringify(orders), 3600);
          }
        }
      } catch (cacheError) {
        logger.warn('更新缓存中的订单数据失败:', cacheError.message);
      }
      
      // 更新模拟数据
      const mockIndex = this.mockOrders.findIndex(o => o.orderId === order.orderId);
      if (mockIndex !== -1) {
        this.mockOrders[mockIndex] = order;
      }
      
      // TODO: 实际环境中，这里应该更新数据库
      
      return order;
    } catch (error) {
      logger.error(`更新订单状态失败:`, error);
      throw error;
    }
  }

  /**
   * 处理关闭后的操作
   */
  async handlePostCloseActions(closedOrders) {
    try {
      // 1. 恢复库存
      await this.restoreInventory(closedOrders);
      
      // 2. 发送通知
      await this.sendCloseNotifications(closedOrders);
      
      // 3. 记录日志
      await this.logClosedOrders(closedOrders);
      
    } catch (error) {
      logger.error('处理订单关闭后操作失败:', error);
      // 这里不抛出异常，以免影响主要功能
    }
  }

  /**
   * 恢复库存
   */
  async restoreInventory(closedOrders) {
    try {
      // TODO: 实际环境中，这里应该恢复商品库存
      logger.info(`为 ${closedOrders.length} 个订单恢复库存`);
      
      // 模拟恢复库存操作
      for (const order of closedOrders) {
        if (order.items && order.items.length > 0) {
          for (const item of order.items) {
            logger.debug(`恢复商品 ${item.productId} 库存，数量: ${item.quantity}`);
          }
        }
      }
      
    } catch (error) {
      logger.error('恢复库存失败:', error);
      throw error;
    }
  }

  /**
   * 发送关闭通知
   */
  async sendCloseNotifications(closedOrders) {
    try {
      // TODO: 实际环境中，这里应该发送通知给用户
      logger.info(`为 ${closedOrders.length} 个订单发送关闭通知`);
      
    } catch (error) {
      logger.error('发送关闭通知失败:', error);
      throw error;
    }
  }

  /**
   * 记录关闭订单日志
   */
  async logClosedOrders(closedOrders) {
    try {
      // 记录到日志文件
      logger.info(`订单自动关闭日志: 共关闭 ${closedOrders.length} 个订单`);
      closedOrders.forEach(order => {
        logger.info(`  - 订单号: ${order.orderId}, 用户: ${order.userId}, 金额: ${order.totalAmount}, 关闭原因: ${order.closeReason}`);
      });
      
    } catch (error) {
      logger.error('记录关闭订单日志失败:', error);
      throw error;
    }
  }

  /**
   * 获取模拟订单数据
   */
  getMockOrders() {
    // 如果模拟数据为空，初始化一些测试数据
    if (this.mockOrders.length === 0) {
      const now = new Date();
      const thirtyMinutesAgo = new Date(now - 30 * 60 * 1000);
      const sixtyMinutesAgo = new Date(now - 60 * 60 * 1000);
      
      this.mockOrders = [
        {
          orderId: 'ORD' + Date.now() + '001',
          userId: 'USER001',
          totalAmount: 199.99,
          status: 'pending_payment',
          createdAt: sixtyMinutesAgo.toISOString(),
          items: [
            { productId: 'PROD001', quantity: 2, price: 99.99 }
          ]
        },
        {
          orderId: 'ORD' + Date.now() + '002',
          userId: 'USER002',
          totalAmount: 599.00,
          status: 'pending_payment',
          createdAt: thirtyMinutesAgo.toISOString(),
          items: [
            { productId: 'PROD002', quantity: 1, price: 599.00 }
          ]
        },
        {
          orderId: 'ORD' + Date.now() + '003',
          userId: 'USER003',
          totalAmount: 1299.50,
          status: 'pending_payment',
          createdAt: new Date().toISOString(), // 刚刚创建的订单
          items: [
            { productId: 'PROD003', quantity: 1, price: 1299.50 }
          ]
        }
      ];
    }
    
    return this.mockOrders;
  }
}

module.exports = OrderAutoCloseJob;