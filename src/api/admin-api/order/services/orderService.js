/**
 * 订单服务层
 * 实现订单相关的业务逻辑
 */

// 引入订单仓库层
const orderRepository = require('../repositories/orderRepository');

/**
 * 订单服务
 */
const orderService = {
  /**
   * 获取订单列表
   * @param {Object} params - 查询参数
   * @returns {Promise<Object>} 订单列表数据
   */
  async getOrderList(params) {
    try {
      // 处理查询条件
      const queryConditions = {};
      
      if (params.orderId) {
        queryConditions.orderId = params.orderId;
      }
      
      if (params.memberName) {
        queryConditions.memberName = params.memberName;
      }
      
      if (params.startTime) {
        queryConditions.startTime = params.startTime;
      }
      
      if (params.endTime) {
        queryConditions.endTime = params.endTime;
      }
      
      if (params.status && params.status !== 'all') {
        queryConditions.status = params.status;
      }
      
      // 调用仓库层获取订单数据
      const data = await orderRepository.findOrders(
        queryConditions,
        params.page,
        params.pageSize
      );
      
      // 获取总数
      const total = await orderRepository.countOrders(queryConditions);
      
      return {
        data,
        total
      };
    } catch (error) {
      console.error('获取订单列表服务失败:', error);
      throw error;
    }
  },

  /**
   * 获取订单详情
   * @param {string} orderId - 订单ID
   * @returns {Promise<Object>} 订单详情
   */
  async getOrderDetail(orderId) {
    try {
      // 调用仓库层获取订单详情
      const orderDetail = await orderRepository.findOrderDetail(orderId);
      
      if (!orderDetail) {
        throw new Error('订单不存在');
      }
      
      return orderDetail;
    } catch (error) {
      console.error('获取订单详情服务失败:', error);
      throw error;
    }
  },

  /**
   * 订单收款操作
   * @param {string} orderId - 订单ID
   * @param {Object} params - 收款参数
   * @returns {Promise<Object>} 操作结果
   */
  async collectPayment(orderId, params) {
    try {
      // 检查订单是否存在
      const order = await orderRepository.findOrderDetail(orderId);
      if (!order) {
        throw new Error('订单不存在');
      }
      
      // 检查订单状态
      if (order.status !== 'pending' && order.status !== 'paid') {
        throw new Error('当前订单状态不允许进行收款操作');
      }
      
      // 调用仓库层更新订单状态
      const result = await orderRepository.updateOrderStatus(orderId, 'paid', params);
      
      return result;
    } catch (error) {
      console.error('订单收款服务失败:', error);
      throw error;
    }
  }
};

module.exports = orderService;