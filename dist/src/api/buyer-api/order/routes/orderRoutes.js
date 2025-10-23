/**
 * 订单路由配置
 * 定义订单相关的API端点
 */

const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../../../core/security/authMiddleware');

/**
 * 注册订单路由
 * @param {Object} app - Express应用实例
 */
function registerOrderRoutes(app) {
  // 所有订单路由都需要认证
  router.use(authMiddleware.authenticate);
  
  // 订单基本操作
  router.post('/', orderController.createOrder);
  router.get('/', orderController.getUserOrders);
  router.get('/stats', orderController.getOrderStats);
  router.get('/:id', orderController.getOrderDetail);
  router.put('/:id/cancel', orderController.cancelOrder);
  router.put('/:id/confirm-receipt', orderController.confirmReceipt);
  router.post('/:id/refund', orderController.requestRefund);
  
  // 将订单路由注册到应用
  app.use('/api/orders', router);
}

module.exports = {
  register: registerOrderRoutes,
  router
};