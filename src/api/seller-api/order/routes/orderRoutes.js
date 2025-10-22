/**
 * 卖家端订单管理路由
 * 配置订单列表、订单详情、订单状态更新等接口
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../core/middleware/authMiddleware');
const orderController = require('../controllers/orderController');
const orderValidation = require('../validations/orderValidation');

/**
 * @swagger
 * tags:
 *   name: 卖家订单管理
 *   description: 卖家端订单管理相关接口
 */

// 应用认证中间件
router.use(authMiddleware.authenticateSeller);

/**
 * @swagger
 * /api/seller/orders:
 *   get:
 *     summary: 获取订单列表
 *     tags: [卖家订单管理]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *         description: 页码
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, default: 10 }
 *         description: 每页数量
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *         description: 订单状态
 *       - in: query
 *         name: startDate
 *         schema: { type: string }
 *         description: 开始日期
 *       - in: query
 *         name: endDate
 *         schema: { type: string }
 *         description: 结束日期
 *       - in: query
 *         name: keyword
 *         schema: { type: string }
 *         description: 关键词搜索
 *     responses:
 *       200:
 *         description: 成功获取订单列表
 *       500:
 *         description: 服务器错误
 */
router.get('/', orderValidation.validateGetOrderList, orderController.getOrderList);

/**
 * @swagger
 * /api/seller/orders/{id}:
 *   get:
 *     summary: 获取订单详情
 *     tags: [卖家订单管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: 订单ID
 *     responses:
 *       200:
 *         description: 成功获取订单详情
 *       400:
 *         description: 请求参数错误
 *       500:
 *         description: 服务器错误
 */
router.get('/:id', orderValidation.validateOrderId, orderController.getOrderDetail);

/**
 * @swagger
 * /api/seller/orders/{id}/status:
 *   put:
 *     summary: 更新订单状态
 *     tags: [卖家订单管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: 订单ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: string, required: true, description: '新状态' }
 *               remark: { type: string, description: '备注' }
 *     responses:
 *       200:
 *         description: 成功更新订单状态
 *       400:
 *         description: 请求参数错误
 *       500:
 *         description: 服务器错误
 */
router.put('/:id/status', orderValidation.validateUpdateOrderStatus, orderController.updateOrderStatus);

/**
 * @swagger
 * /api/seller/orders/{id}/ship:
 *   put:
 *     summary: 发货订单
 *     tags: [卖家订单管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: 订单ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               trackingNumber: { type: string, required: true, description: '物流单号' }
 *               shippingCompany: { type: string, required: true, description: '物流公司' }
 *               remark: { type: string, description: '备注' }
 *     responses:
 *       200:
 *         description: 成功发货
 *       400:
 *         description: 请求参数错误
 *       500:
 *         description: 服务器错误
 */
router.put('/:id/ship', orderValidation.validateShipOrder, orderController.shipOrder);

/**
 * @swagger
 * /api/seller/orders/{id}/cancel:
 *   put:
 *     summary: 取消订单
 *     tags: [卖家订单管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: 订单ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason: { type: string, required: true, description: '取消原因' }
 *     responses:
 *       200:
 *         description: 成功取消订单
 *       400:
 *         description: 请求参数错误
 *       500:
 *         description: 服务器错误
 */
router.put('/:id/cancel', orderValidation.validateCancelOrder, orderController.cancelOrder);

/**
 * @swagger
 * /api/seller/orders/{id}/refund/approve:
 *   put:
 *     summary: 同意退款
 *     tags: [卖家订单管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: 订单ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason: { type: string, required: true, description: '退款原因' }
 *     responses:
 *       200:
 *         description: 成功同意退款
 *       400:
 *         description: 请求参数错误
 *       500:
 *         description: 服务器错误
 */
router.put('/:id/refund/approve', orderValidation.validateRefundAction, orderController.approveRefund);

/**
 * @swagger
 * /api/seller/orders/{id}/refund/reject:
 *   put:
 *     summary: 拒绝退款
 *     tags: [卖家订单管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: 订单ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason: { type: string, required: true, description: '拒绝原因' }
 *     responses:
 *       200:
 *         description: 成功拒绝退款
 *       400:
 *         description: 请求参数错误
 *       500:
 *         description: 服务器错误
 */
router.put('/:id/refund/reject', orderValidation.validateRefundAction, orderController.rejectRefund);

/**
 * @swagger
 * /api/seller/orders/stats:
 *   get:
 *     summary: 获取订单统计信息
 *     tags: [卖家订单管理]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema: { type: string }
 *         description: 开始日期
 *       - in: query
 *         name: endDate
 *         schema: { type: string }
 *         description: 结束日期
 *     responses:
 *       200:
 *         description: 成功获取订单统计信息
 *       500:
 *         description: 服务器错误
 */
router.get('/stats', orderController.getOrderStats);

/**
 * @swagger
 * /api/seller/orders/batch/ship:
 *   post:
 *     summary: 批量发货
 *     tags: [卖家订单管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orders:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     orderId: { type: integer, required: true }
 *                     trackingNumber: { type: string, required: true }
 *                     shippingCompany: { type: string, required: true }
 *                     remark: { type: string }
 *     responses:
 *       200:
 *         description: 成功批量发货
 *       400:
 *         description: 请求参数错误
 *       500:
 *         description: 服务器错误
 */
router.post('/batch/ship', orderValidation.validateBatchShipOrders, orderController.batchShipOrders);

module.exports = router;