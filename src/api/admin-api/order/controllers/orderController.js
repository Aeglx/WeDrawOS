/**
 * 订单管理控制器
 * 负责处理订单相关的API请求
 */

// 引入订单服务
const orderService = require('../services/orderService');

/**
 * 订单控制器
 */
const orderController = {
  /**
   * 获取订单列表
   * @param {Object} req - HTTP请求对象
   * @param {Object} res - HTTP响应对象
   */
  async getOrderList(req, res) {
    try {
      // 解析请求参数
      const params = {
        page: parseInt(req.query.page) || 1,
        pageSize: parseInt(req.query.pageSize) || 10,
        orderId: req.query.orderId || '',
        memberName: req.query.memberName || '',
        startTime: req.query.startTime || '',
        endTime: req.query.endTime || '',
        status: req.query.status || ''
      };

      console.log('获取订单列表请求参数:', params);

      // 调用服务层获取订单列表
      const result = await orderService.getOrderList(params);

      // 返回成功响应
      res.json({
        success: true,
        data: result.data,
        total: result.total,
        message: '获取订单列表成功'
      });
    } catch (error) {
      console.error('获取订单列表失败:', error);
      res.status(500).json({
        success: false,
        message: error.message || '获取订单列表失败'
      });
    }
  },

  /**
   * 获取订单详情
   * @param {Object} req - HTTP请求对象
   * @param {Object} res - HTTP响应对象
   */
  async getOrderDetail(req, res) {
    try {
      const { orderId } = req.params;
      
      console.log('获取订单详情请求参数:', { orderId });

      // 调用服务层获取订单详情
      const result = await orderService.getOrderDetail(orderId);

      // 返回成功响应
      res.json({
        success: true,
        data: result,
        message: '获取订单详情成功'
      });
    } catch (error) {
      console.error('获取订单详情失败:', error);
      res.status(500).json({
        success: false,
        message: error.message || '获取订单详情失败'
      });
    }
  },

  /**
   * 订单收款操作
   * @param {Object} req - HTTP请求对象
   * @param {Object} res - HTTP响应对象
   */
  async collectPayment(req, res) {
    try {
      const { orderId } = req.params;
      const collectParams = req.body;
      
      console.log('订单收款请求参数:', { orderId, collectParams });

      // 调用服务层进行收款操作
      const result = await orderService.collectPayment(orderId, collectParams);

      // 返回成功响应
      res.json({
        success: true,
        data: result,
        message: '收款操作成功'
      });
    } catch (error) {
      console.error('收款操作失败:', error);
      res.status(500).json({
        success: false,
        message: error.message || '收款操作失败'
      });
    }
  }
};

module.exports = orderController;