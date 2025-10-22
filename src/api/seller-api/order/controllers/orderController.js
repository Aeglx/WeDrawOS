/**
 * 卖家端订单管理控制器
 * 处理卖家端订单管理相关请求
 */

const logger = require('../../../core/utils/logger');
const orderService = require('../services/orderService');
const messageQueue = require('../../../core/message-queue');

class OrderController {
  /**
   * 获取订单列表
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async getOrderList(req, res) {
    try {
      const sellerId = req.user.id;
      const { page = 1, pageSize = 10, status, startDate, endDate, keyword } = req.query;
      
      const orders = await orderService.getOrderList(sellerId, {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        status,
        startDate,
        endDate,
        keyword
      });
      
      logger.info(`卖家获取订单列表成功，卖家ID: ${sellerId}`);
      return res.status(200).json({
        success: true,
        message: '获取订单列表成功',
        data: orders
      });
    } catch (error) {
      logger.error(`获取订单列表失败: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: error.message || '获取订单列表失败'
      });
    }
  }

  /**
   * 获取订单详情
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async getOrderDetail(req, res) {
    try {
      const sellerId = req.user.id;
      const orderId = req.params.id;
      
      const order = await orderService.getOrderDetail(sellerId, orderId);
      
      logger.info(`卖家获取订单详情成功，卖家ID: ${sellerId}，订单ID: ${orderId}`);
      return res.status(200).json({
        success: true,
        message: '获取订单详情成功',
        data: order
      });
    } catch (error) {
      logger.error(`获取订单详情失败: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: error.message || '获取订单详情失败'
      });
    }
  }

  /**
   * 更新订单状态
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async updateOrderStatus(req, res) {
    try {
      const sellerId = req.user.id;
      const orderId = req.params.id;
      const { status, remark } = req.body;
      
      const updatedOrder = await orderService.updateOrderStatus(sellerId, orderId, status, remark);
      
      // 发送消息队列通知
      await messageQueue.publish('ORDER.STATUS.UPDATED', {
        orderId,
        sellerId,
        status,
        timestamp: new Date()
      });
      
      logger.info(`卖家更新订单状态成功，卖家ID: ${sellerId}，订单ID: ${orderId}，新状态: ${status}`);
      return res.status(200).json({
        success: true,
        message: '更新订单状态成功',
        data: updatedOrder
      });
    } catch (error) {
      logger.error(`更新订单状态失败: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: error.message || '更新订单状态失败'
      });
    }
  }

  /**
   * 发货订单
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async shipOrder(req, res) {
    try {
      const sellerId = req.user.id;
      const orderId = req.params.id;
      const { trackingNumber, shippingCompany, remark } = req.body;
      
      const updatedOrder = await orderService.shipOrder(sellerId, orderId, {
        trackingNumber,
        shippingCompany,
        remark
      });
      
      // 发送消息队列通知
      await messageQueue.publish('ORDER.SHIPPED', {
        orderId,
        sellerId,
        trackingNumber,
        shippingCompany,
        timestamp: new Date()
      });
      
      logger.info(`卖家发货成功，卖家ID: ${sellerId}，订单ID: ${orderId}`);
      return res.status(200).json({
        success: true,
        message: '订单发货成功',
        data: updatedOrder
      });
    } catch (error) {
      logger.error(`订单发货失败: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: error.message || '订单发货失败'
      });
    }
  }

  /**
   * 取消订单
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async cancelOrder(req, res) {
    try {
      const sellerId = req.user.id;
      const orderId = req.params.id;
      const { reason } = req.body;
      
      const updatedOrder = await orderService.cancelOrder(sellerId, orderId, reason);
      
      // 发送消息队列通知
      await messageQueue.publish('ORDER.CANCELED', {
        orderId,
        sellerId,
        reason,
        timestamp: new Date()
      });
      
      logger.info(`卖家取消订单成功，卖家ID: ${sellerId}，订单ID: ${orderId}`);
      return res.status(200).json({
        success: true,
        message: '取消订单成功',
        data: updatedOrder
      });
    } catch (error) {
      logger.error(`取消订单失败: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: error.message || '取消订单失败'
      });
    }
  }

  /**
   * 同意退款
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async approveRefund(req, res) {
    try {
      const sellerId = req.user.id;
      const orderId = req.params.id;
      const { reason } = req.body;
      
      const updatedOrder = await orderService.approveRefund(sellerId, orderId, reason);
      
      // 发送消息队列通知
      await messageQueue.publish('ORDER.REFUND.APPROVED', {
        orderId,
        sellerId,
        reason,
        timestamp: new Date()
      });
      
      logger.info(`卖家同意退款成功，卖家ID: ${sellerId}，订单ID: ${orderId}`);
      return res.status(200).json({
        success: true,
        message: '同意退款成功',
        data: updatedOrder
      });
    } catch (error) {
      logger.error(`同意退款失败: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: error.message || '同意退款失败'
      });
    }
  }

  /**
   * 拒绝退款
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async rejectRefund(req, res) {
    try {
      const sellerId = req.user.id;
      const orderId = req.params.id;
      const { reason } = req.body;
      
      const updatedOrder = await orderService.rejectRefund(sellerId, orderId, reason);
      
      // 发送消息队列通知
      await messageQueue.publish('ORDER.REFUND.REJECTED', {
        orderId,
        sellerId,
        reason,
        timestamp: new Date()
      });
      
      logger.info(`卖家拒绝退款成功，卖家ID: ${sellerId}，订单ID: ${orderId}`);
      return res.status(200).json({
        success: true,
        message: '拒绝退款成功',
        data: updatedOrder
      });
    } catch (error) {
      logger.error(`拒绝退款失败: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: error.message || '拒绝退款失败'
      });
    }
  }

  /**
   * 获取订单统计信息
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async getOrderStats(req, res) {
    try {
      const sellerId = req.user.id;
      const { startDate, endDate } = req.query;
      
      const stats = await orderService.getOrderStats(sellerId, { startDate, endDate });
      
      logger.info(`获取订单统计信息成功，卖家ID: ${sellerId}`);
      return res.status(200).json({
        success: true,
        message: '获取订单统计信息成功',
        data: stats
      });
    } catch (error) {
      logger.error(`获取订单统计信息失败: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: error.message || '获取订单统计信息失败'
      });
    }
  }

  /**
   * 批量发货
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async batchShipOrders(req, res) {
    try {
      const sellerId = req.user.id;
      const { orders } = req.body;
      
      const results = await orderService.batchShipOrders(sellerId, orders);
      
      // 发送消息队列通知
      await messageQueue.publish('ORDER.BATCH.SHIPPED', {
        sellerId,
        orderIds: orders.map(order => order.orderId),
        count: orders.length,
        timestamp: new Date()
      });
      
      logger.info(`卖家批量发货成功，卖家ID: ${sellerId}，订单数量: ${orders.length}`);
      return res.status(200).json({
        success: true,
        message: '批量发货成功',
        data: results
      });
    } catch (error) {
      logger.error(`批量发货失败: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: error.message || '批量发货失败'
      });
    }
  }
}

module.exports = new OrderController();