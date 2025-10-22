/**
 * 卖家端订单管理服务
 * 处理订单列表查询、订单状态更新等业务逻辑
 */

const logger = require('../../../core/utils/logger');
const orderRepository = require('../repositories/orderRepository');
const inventoryService = require('../../inventory/services/inventoryService');

class OrderService {
  /**
   * 获取订单列表
   * @param {number} sellerId - 卖家ID
   * @param {Object} params - 查询参数
   * @returns {Promise<Object>} 订单列表和分页信息
   */
  async getOrderList(sellerId, params) {
    try {
      logger.info(`查询订单列表，卖家ID: ${sellerId}`);
      
      const { page, pageSize, status, startDate, endDate, keyword } = params;
      
      // 构建查询条件
      const query = {
        sellerId,
        status,
        startDate,
        endDate,
        keyword
      };
      
      // 获取订单列表
      const orders = await orderRepository.getOrderList(query, page, pageSize);
      const total = await orderRepository.countOrders(query);
      
      return {
        list: orders,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      };
    } catch (error) {
      logger.error(`获取订单列表失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取订单详情
   * @param {number} sellerId - 卖家ID
   * @param {number} orderId - 订单ID
   * @returns {Promise<Object>} 订单详情
   */
  async getOrderDetail(sellerId, orderId) {
    try {
      logger.info(`查询订单详情，卖家ID: ${sellerId}，订单ID: ${orderId}`);
      
      const order = await orderRepository.getOrderById(orderId);
      
      // 验证订单归属
      if (!order || order.sellerId !== sellerId) {
        throw new Error('订单不存在或无权查看');
      }
      
      // 获取订单项
      const orderItems = await orderRepository.getOrderItemsByOrderId(orderId);
      order.items = orderItems;
      
      // 获取订单日志
      const orderLogs = await orderRepository.getOrderLogsByOrderId(orderId);
      order.logs = orderLogs;
      
      return order;
    } catch (error) {
      logger.error(`获取订单详情失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 更新订单状态
   * @param {number} sellerId - 卖家ID
   * @param {number} orderId - 订单ID
   * @param {string} status - 新状态
   * @param {string} remark - 备注
   * @returns {Promise<Object>} 更新后的订单
   */
  async updateOrderStatus(sellerId, orderId, status, remark = '') {
    try {
      logger.info(`更新订单状态，卖家ID: ${sellerId}，订单ID: ${orderId}，新状态: ${status}`);
      
      // 获取订单
      const order = await orderRepository.getOrderById(orderId);
      
      // 验证订单归属
      if (!order || order.sellerId !== sellerId) {
        throw new Error('订单不存在或无权操作');
      }
      
      // 验证状态变更合法性
      this._validateStatusTransition(order.status, status);
      
      // 更新订单状态
      const updatedOrder = await orderRepository.updateOrder(orderId, {
        status,
        updatedAt: new Date()
      });
      
      // 记录订单日志
      await orderRepository.createOrderLog({
        orderId,
        action: 'status_change',
        content: `订单状态从 ${order.status} 变更为 ${status}`,
        remark,
        operatorId: sellerId,
        operatorType: 'seller'
      });
      
      return updatedOrder;
    } catch (error) {
      logger.error(`更新订单状态失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 发货订单
   * @param {number} sellerId - 卖家ID
   * @param {number} orderId - 订单ID
   * @param {Object} shippingInfo - 物流信息
   * @returns {Promise<Object>} 更新后的订单
   */
  async shipOrder(sellerId, orderId, shippingInfo) {
    try {
      logger.info(`订单发货，卖家ID: ${sellerId}，订单ID: ${orderId}`);
      
      // 获取订单
      const order = await orderRepository.getOrderById(orderId);
      
      // 验证订单归属
      if (!order || order.sellerId !== sellerId) {
        throw new Error('订单不存在或无权操作');
      }
      
      // 验证订单状态
      if (order.status !== 'pending_shipment') {
        throw new Error('只有待发货订单才能发货');
      }
      
      // 更新订单信息
      const updatedOrder = await orderRepository.updateOrder(orderId, {
        status: 'shipped',
        trackingNumber: shippingInfo.trackingNumber,
        shippingCompany: shippingInfo.shippingCompany,
        shippedAt: new Date(),
        updatedAt: new Date()
      });
      
      // 记录订单日志
      await orderRepository.createOrderLog({
        orderId,
        action: 'ship',
        content: `订单发货，物流公司: ${shippingInfo.shippingCompany}，运单号: ${shippingInfo.trackingNumber}`,
        remark: shippingInfo.remark,
        operatorId: sellerId,
        operatorType: 'seller'
      });
      
      return updatedOrder;
    } catch (error) {
      logger.error(`订单发货失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 取消订单
   * @param {number} sellerId - 卖家ID
   * @param {number} orderId - 订单ID
   * @param {string} reason - 取消原因
   * @returns {Promise<Object>} 更新后的订单
   */
  async cancelOrder(sellerId, orderId, reason) {
    try {
      logger.info(`取消订单，卖家ID: ${sellerId}，订单ID: ${orderId}`);
      
      // 获取订单
      const order = await orderRepository.getOrderById(orderId);
      
      // 验证订单归属
      if (!order || order.sellerId !== sellerId) {
        throw new Error('订单不存在或无权操作');
      }
      
      // 验证订单状态
      if (['canceled', 'completed', 'refunded'].includes(order.status)) {
        throw new Error('该订单状态不允许取消');
      }
      
      // 更新订单状态
      const updatedOrder = await orderRepository.updateOrder(orderId, {
        status: 'canceled',
        cancelReason: reason,
        canceledAt: new Date(),
        updatedAt: new Date()
      });
      
      // 获取订单项
      const orderItems = await orderRepository.getOrderItemsByOrderId(orderId);
      
      // 恢复库存
      for (const item of orderItems) {
        await inventoryService.restoreInventory(item.productId, item.skuId, item.quantity);
      }
      
      // 记录订单日志
      await orderRepository.createOrderLog({
        orderId,
        action: 'cancel',
        content: `卖家取消订单: ${reason}`,
        operatorId: sellerId,
        operatorType: 'seller'
      });
      
      return updatedOrder;
    } catch (error) {
      logger.error(`取消订单失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 同意退款
   * @param {number} sellerId - 卖家ID
   * @param {number} orderId - 订单ID
   * @param {string} reason - 退款原因
   * @returns {Promise<Object>} 更新后的订单
   */
  async approveRefund(sellerId, orderId, reason) {
    try {
      logger.info(`同意退款，卖家ID: ${sellerId}，订单ID: ${orderId}`);
      
      // 获取订单
      const order = await orderRepository.getOrderById(orderId);
      
      // 验证订单归属
      if (!order || order.sellerId !== sellerId) {
        throw new Error('订单不存在或无权操作');
      }
      
      // 验证订单状态
      if (order.status !== 'refund_requested') {
        throw new Error('只有退款申请中的订单才能同意退款');
      }
      
      // 更新订单状态
      const updatedOrder = await orderRepository.updateOrder(orderId, {
        status: 'refunded',
        refundReason: reason,
        refundedAt: new Date(),
        updatedAt: new Date()
      });
      
      // 获取订单项
      const orderItems = await orderRepository.getOrderItemsByOrderId(orderId);
      
      // 恢复库存
      for (const item of orderItems) {
        await inventoryService.restoreInventory(item.productId, item.skuId, item.quantity);
      }
      
      // 记录订单日志
      await orderRepository.createOrderLog({
        orderId,
        action: 'approve_refund',
        content: `卖家同意退款: ${reason}`,
        operatorId: sellerId,
        operatorType: 'seller'
      });
      
      return updatedOrder;
    } catch (error) {
      logger.error(`同意退款失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 拒绝退款
   * @param {number} sellerId - 卖家ID
   * @param {number} orderId - 订单ID
   * @param {string} reason - 拒绝原因
   * @returns {Promise<Object>} 更新后的订单
   */
  async rejectRefund(sellerId, orderId, reason) {
    try {
      logger.info(`拒绝退款，卖家ID: ${sellerId}，订单ID: ${orderId}`);
      
      // 获取订单
      const order = await orderRepository.getOrderById(orderId);
      
      // 验证订单归属
      if (!order || order.sellerId !== sellerId) {
        throw new Error('订单不存在或无权操作');
      }
      
      // 验证订单状态
      if (order.status !== 'refund_requested') {
        throw new Error('只有退款申请中的订单才能拒绝退款');
      }
      
      // 更新订单状态
      const updatedOrder = await orderRepository.updateOrder(orderId, {
        status: 'delivered',
        refundRejectReason: reason,
        updatedAt: new Date()
      });
      
      // 记录订单日志
      await orderRepository.createOrderLog({
        orderId,
        action: 'reject_refund',
        content: `卖家拒绝退款: ${reason}`,
        operatorId: sellerId,
        operatorType: 'seller'
      });
      
      return updatedOrder;
    } catch (error) {
      logger.error(`拒绝退款失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取订单统计信息
   * @param {number} sellerId - 卖家ID
   * @param {Object} params - 查询参数
   * @returns {Promise<Object>} 订单统计信息
   */
  async getOrderStats(sellerId, params) {
    try {
      logger.info(`获取订单统计信息，卖家ID: ${sellerId}`);
      
      const { startDate, endDate } = params;
      
      // 获取状态分布统计
      const statusStats = await orderRepository.getOrderStatusStats(sellerId, { startDate, endDate });
      
      // 获取销售额统计
      const salesStats = await orderRepository.getOrderSalesStats(sellerId, { startDate, endDate });
      
      // 获取订单数量趋势
      const trendStats = await orderRepository.getOrderTrendStats(sellerId, { startDate, endDate });
      
      return {
        statusStats,
        salesStats,
        trendStats
      };
    } catch (error) {
      logger.error(`获取订单统计信息失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 批量发货
   * @param {number} sellerId - 卖家ID
   * @param {Array} orders - 订单发货信息数组
   * @returns {Promise<Array>} 发货结果
   */
  async batchShipOrders(sellerId, orders) {
    try {
      logger.info(`批量发货，卖家ID: ${sellerId}，订单数量: ${orders.length}`);
      
      const results = [];
      
      for (const orderInfo of orders) {
        try {
          const order = await this.shipOrder(sellerId, orderInfo.orderId, {
            trackingNumber: orderInfo.trackingNumber,
            shippingCompany: orderInfo.shippingCompany,
            remark: orderInfo.remark
          });
          
          results.push({
            orderId: orderInfo.orderId,
            success: true,
            data: order
          });
        } catch (error) {
          results.push({
            orderId: orderInfo.orderId,
            success: false,
            error: error.message
          });
        }
      }
      
      return results;
    } catch (error) {
      logger.error(`批量发货失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 验证状态变更合法性
   * @param {string} currentStatus - 当前状态
   * @param {string} newStatus - 新状态
   * @private
   */
  _validateStatusTransition(currentStatus, newStatus) {
    const allowedTransitions = {
      'pending_payment': ['canceled', 'paid'],
      'paid': ['pending_shipment'],
      'pending_shipment': ['shipped', 'canceled'],
      'shipped': ['delivered', 'canceled'],
      'delivered': ['completed', 'refund_requested'],
      'refund_requested': ['refunded', 'delivered']
    };
    
    if (allowedTransitions[currentStatus] && !allowedTransitions[currentStatus].includes(newStatus)) {
      throw new Error(`不允许从 ${currentStatus} 状态变更为 ${newStatus} 状态`);
    }
  }
}

module.exports = new OrderService();