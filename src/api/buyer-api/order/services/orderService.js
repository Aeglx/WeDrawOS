/**
 * 订单服务
 * 处理订单相关的业务逻辑
 */

const di = require('@core/di/container');
const orderRepository = di.resolve('orderRepository');
const productService = di.resolve('productService');
const cartService = di.resolve('cartService');
const logger = di.resolve('logger');
const cache = di.resolve('cache');
const messageQueue = di.resolve('messageQueue');

class OrderService {
  /**
   * 创建订单
   * @param {string} userId - 用户ID
   * @param {Object} orderData - 订单数据
   * @returns {Promise<Object>} 创建的订单
   */
  async createOrder(userId, orderData) {
    try {
      // 验证收货地址
      if (!orderData.shippingAddress || !orderData.shippingAddress.id) {
        throw new Error('请选择收货地址');
      }
      
      // 获取购物车商品
      const cart = await cartService.getCart(userId);
      if (!cart || cart.items.length === 0) {
        throw new Error('购物车为空，无法创建订单');
      }
      
      // 检查库存
      for (const item of cart.items) {
        const product = await productService.getProductById(item.productId);
        if (!product || product.stock < item.quantity) {
          throw new Error(`${product.name}库存不足`);
        }
      }
      
      // 计算订单金额
      const totalAmount = cart.items.reduce((sum, item) => {
        return sum + item.price * item.quantity;
      }, 0);
      
      // 构建订单数据
      const order = {
        userId,
        items: cart.items,
        totalAmount,
        shippingAddress: orderData.shippingAddress,
        paymentMethod: orderData.paymentMethod || 'online',
        status: 'pending', // 待支付
        orderNumber: this.generateOrderNumber(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // 创建订单
      const createdOrder = await orderRepository.createOrder(order);
      
      // 扣减库存
      for (const item of cart.items) {
        await productService.updateStock(item.productId, -item.quantity);
      }
      
      // 清空购物车
      await cartService.clearCart(userId);
      
      // 清除缓存
      await cache.delete(`user:${userId}:orders`);
      
      logger.info('订单创建成功', { orderId: createdOrder.id, userId });
      
      return createdOrder;
    } catch (error) {
      logger.error('创建订单失败', { userId, error: error.message });
      throw error;
    }
  }
  
  /**
   * 获取用户订单列表
   * @param {string} userId - 用户ID
   * @param {Object} query - 查询参数
   * @returns {Promise<Object>} 订单列表
   */
  async getUserOrders(userId, query) {
    try {
      // 尝试从缓存获取
      const cacheKey = `user:${userId}:orders:${query.page}:${query.limit}:${query.status || 'all'}`;
      const cachedOrders = await cache.get(cacheKey);
      if (cachedOrders) {
        return JSON.parse(cachedOrders);
      }
      
      const orders = await orderRepository.getUserOrders(userId, query);
      
      // 缓存结果
      await cache.set(cacheKey, JSON.stringify(orders), 300); // 5分钟缓存
      
      return orders;
    } catch (error) {
      logger.error('获取用户订单列表失败', { userId, error: error.message });
      throw error;
    }
  }
  
  /**
   * 获取订单详情
   * @param {string} userId - 用户ID
   * @param {string} orderId - 订单ID
   * @returns {Promise<Object>} 订单详情
   */
  async getOrderDetail(userId, orderId) {
    try {
      const order = await orderRepository.getOrderById(orderId);
      
      if (!order) {
        throw new Error('订单不存在');
      }
      
      if (order.userId !== userId) {
        throw new Error('无权访问该订单');
      }
      
      return order;
    } catch (error) {
      logger.error('获取订单详情失败', { userId, orderId, error: error.message });
      throw error;
    }
  }
  
  /**
   * 取消订单
   * @param {string} userId - 用户ID
   * @param {string} orderId - 订单ID
   * @returns {Promise<Object>} 取消后的订单
   */
  async cancelOrder(userId, orderId) {
    try {
      const order = await this.getOrderDetail(userId, orderId);
      
      // 只有待支付的订单可以取消
      if (order.status !== 'pending') {
        throw new Error('该订单状态不允许取消');
      }
      
      // 更新订单状态
      const updatedOrder = await orderRepository.updateOrder(orderId, {
        status: 'canceled',
        updatedAt: new Date(),
        canceledAt: new Date()
      });
      
      // 恢复库存
      for (const item of order.items) {
        await productService.updateStock(item.productId, item.quantity);
      }
      
      // 清除缓存
      await cache.deleteByPattern(`user:${userId}:orders:*`);
      
      logger.info('订单取消成功', { orderId, userId });
      
      return updatedOrder;
    } catch (error) {
      logger.error('取消订单失败', { userId, orderId, error: error.message });
      throw error;
    }
  }
  
  /**
   * 确认收货
   * @param {string} userId - 用户ID
   * @param {string} orderId - 订单ID
   * @returns {Promise<Object>} 更新后的订单
   */
  async confirmReceipt(userId, orderId) {
    try {
      const order = await this.getOrderDetail(userId, orderId);
      
      // 只有已发货的订单可以确认收货
      if (order.status !== 'shipped') {
        throw new Error('该订单状态不允许确认收货');
      }
      
      // 更新订单状态
      const updatedOrder = await orderRepository.updateOrder(orderId, {
        status: 'completed',
        updatedAt: new Date(),
        completedAt: new Date()
      });
      
      // 清除缓存
      await cache.deleteByPattern(`user:${userId}:orders:*`);
      
      logger.info('确认收货成功', { orderId, userId });
      
      return updatedOrder;
    } catch (error) {
      logger.error('确认收货失败', { userId, orderId, error: error.message });
      throw error;
    }
  }
  
  /**
   * 申请退款
   * @param {string} userId - 用户ID
   * @param {string} orderId - 订单ID
   * @param {Object} refundData - 退款数据
   * @returns {Promise<Object>} 退款申请
   */
  async requestRefund(userId, orderId, refundData) {
    try {
      const order = await this.getOrderDetail(userId, orderId);
      
      // 检查订单状态是否允许退款
      if (!['shipped', 'completed'].includes(order.status)) {
        throw new Error('该订单状态不允许申请退款');
      }
      
      // 检查是否已申请过退款
      const existingRefund = await orderRepository.getOrderRefund(orderId);
      if (existingRefund) {
        throw new Error('该订单已有退款申请');
      }
      
      // 创建退款申请
      const refund = {
        orderId,
        userId,
        amount: order.totalAmount,
        reason: refundData.reason,
        description: refundData.description,
        status: 'pending',
        createdAt: new Date()
      };
      
      const createdRefund = await orderRepository.createRefund(refund);
      
      logger.info('退款申请提交成功', { refundId: createdRefund.id, orderId, userId });
      
      return createdRefund;
    } catch (error) {
      logger.error('申请退款失败', { userId, orderId, error: error.message });
      throw error;
    }
  }
  
  /**
   * 获取订单状态统计
   * @param {string} userId - 用户ID
   * @returns {Promise<Object>} 订单统计信息
   */
  async getOrderStats(userId) {
    try {
      // 尝试从缓存获取
      const cacheKey = `user:${userId}:orderStats`;
      const cachedStats = await cache.get(cacheKey);
      if (cachedStats) {
        return JSON.parse(cachedStats);
      }
      
      const stats = await orderRepository.getOrderStats(userId);
      
      // 缓存结果
      await cache.set(cacheKey, JSON.stringify(stats), 600); // 10分钟缓存
      
      return stats;
    } catch (error) {
      logger.error('获取订单状态统计失败', { userId, error: error.message });
      throw error;
    }
  }
  
  /**
   * 生成订单号
   * @returns {string} 订单号
   */
  generateOrderNumber() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `${timestamp}${random.toString().padStart(3, '0')}`;
  }
}

module.exports = new OrderService();