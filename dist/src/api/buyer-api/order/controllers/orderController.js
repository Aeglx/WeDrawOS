/**
 * 订单控制器
 * 处理订单相关的HTTP请求
 */

const logger = require('../../../core/utils/logger');
const orderService = require('../services/orderService');
const messageQueue = require('../../../core/messaging/messageQueue');

class OrderController {
  /**
   * 创建订单
   * @param {Object} req - HTTP请求对象
   * @param {Object} res - HTTP响应对象
   * @param {Function} next - 下一个中间件
   */
  async createOrder(req, res, next) {
    try {
      const userId = req.user.id;
      const orderData = req.body;
      
      logger.info(`创建订单请求 - 用户ID: ${userId}`, { orderData });
      
      const order = await orderService.createOrder(userId, orderData);
      
      // 发送创建订单消息到消息队列
      await messageQueue.publish('order.created', {
        userId,
        orderId: order.id,
        timestamp: new Date()
      });
      
      res.status(201).json({
        success: true,
        message: '订单创建成功',
        data: order
      });
    } catch (error) {
      logger.error('创建订单失败', { error: error.message, stack: error.stack });
      next(error);
    }
  }
  
  /**
   * 获取用户订单列表
   * @param {Object} req - HTTP请求对象
   * @param {Object} res - HTTP响应对象
   * @param {Function} next - 下一个中间件
   */
  async getUserOrders(req, res, next) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10, status } = req.query;
      
      logger.info(`获取用户订单列表 - 用户ID: ${userId}, 页码: ${page}, 每页数量: ${limit}, 状态: ${status}`);
      
      const orders = await orderService.getUserOrders(userId, {
        page: parseInt(page),
        limit: parseInt(limit),
        status
      });
      
      res.json({
        success: true,
        data: orders
      });
    } catch (error) {
      logger.error('获取用户订单列表失败', { error: error.message, stack: error.stack });
      next(error);
    }
  }
  
  /**
   * 获取订单详情
   * @param {Object} req - HTTP请求对象
   * @param {Object} res - HTTP响应对象
   * @param {Function} next - 下一个中间件
   */
  async getOrderDetail(req, res, next) {
    try {
      const userId = req.user.id;
      const orderId = req.params.id;
      
      logger.info(`获取订单详情 - 用户ID: ${userId}, 订单ID: ${orderId}`);
      
      const order = await orderService.getOrderDetail(userId, orderId);
      
      res.json({
        success: true,
        data: order
      });
    } catch (error) {
      logger.error('获取订单详情失败', { error: error.message, stack: error.stack });
      next(error);
    }
  }
  
  /**
   * 取消订单
   * @param {Object} req - HTTP请求对象
   * @param {Object} res - HTTP响应对象
   * @param {Function} next - 下一个中间件
   */
  async cancelOrder(req, res, next) {
    try {
      const userId = req.user.id;
      const orderId = req.params.id;
      
      logger.info(`取消订单请求 - 用户ID: ${userId}, 订单ID: ${orderId}`);
      
      const order = await orderService.cancelOrder(userId, orderId);
      
      // 发送订单取消消息
      await messageQueue.publish('order.canceled', {
        userId,
        orderId,
        timestamp: new Date()
      });
      
      res.json({
        success: true,
        message: '订单取消成功',
        data: order
      });
    } catch (error) {
      logger.error('取消订单失败', { error: error.message, stack: error.stack });
      next(error);
    }
  }
  
  /**
   * 确认收货
   * @param {Object} req - HTTP请求对象
   * @param {Object} res - HTTP响应对象
   * @param {Function} next - 下一个中间件
   */
  async confirmReceipt(req, res, next) {
    try {
      const userId = req.user.id;
      const orderId = req.params.id;
      
      logger.info(`确认收货请求 - 用户ID: ${userId}, 订单ID: ${orderId}`);
      
      const order = await orderService.confirmReceipt(userId, orderId);
      
      // 发送确认收货消息
      await messageQueue.publish('order.received', {
        userId,
        orderId,
        timestamp: new Date()
      });
      
      res.json({
        success: true,
        message: '确认收货成功',
        data: order
      });
    } catch (error) {
      logger.error('确认收货失败', { error: error.message, stack: error.stack });
      next(error);
    }
  }
  
  /**
   * 申请退款
   * @param {Object} req - HTTP请求对象
   * @param {Object} res - HTTP响应对象
   * @param {Function} next - 下一个中间件
   */
  async requestRefund(req, res, next) {
    try {
      const userId = req.user.id;
      const orderId = req.params.id;
      const refundData = req.body;
      
      logger.info(`申请退款请求 - 用户ID: ${userId}, 订单ID: ${orderId}`, { refundData });
      
      const refund = await orderService.requestRefund(userId, orderId, refundData);
      
      // 发送退款申请消息
      await messageQueue.publish('refund.requested', {
        userId,
        orderId,
        refundId: refund.id,
        timestamp: new Date()
      });
      
      res.status(201).json({
        success: true,
        message: '退款申请提交成功',
        data: refund
      });
    } catch (error) {
      logger.error('申请退款失败', { error: error.message, stack: error.stack });
      next(error);
    }
  }
  
  /**
   * 获取订单状态统计
   * @param {Object} req - HTTP请求对象
   * @param {Object} res - HTTP响应对象
   * @param {Function} next - 下一个中间件
   */
  async getOrderStats(req, res, next) {
    try {
      const userId = req.user.id;
      
      logger.info(`获取订单状态统计 - 用户ID: ${userId}`);
      
      const stats = await orderService.getOrderStats(userId);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('获取订单状态统计失败', { error: error.message, stack: error.stack });
      next(error);
    }
  }
}

module.exports = new OrderController();