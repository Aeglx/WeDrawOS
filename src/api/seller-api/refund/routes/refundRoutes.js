/**
 * 卖家端退款管理路由
 * 配置退款列表、退款详情、处理退款申请等接口
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../core/middleware/authMiddleware');
const refundController = require('../controllers/refundController');
const refundValidation = require('../validations/refundValidation');

/**
 * @swagger
 * tags:
 *   name: 卖家退款管理
 *   description: 卖家端退款管理相关接口
 */

// 应用认证中间件
router.use(authMiddleware.authenticateSeller);

/**
 * @swagger
 * /api/seller/refunds:
 *   get:
 *     summary: 获取退款列表
 *     tags: [卖家退款管理]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: ['pending', 'processing', 'approved', 'rejected', 'completed', 'failed'] }
 *         description: 退款状态
 *       - in: query
 *         name: startDate
 *         schema: { type: string }
 *         description: 开始日期 (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema: { type: string }
 *         description: 结束日期 (YYYY-MM-DD)
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *         description: 页码
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, default: 10 }
 *         description: 每页大小
 *     responses:
 *       200:
 *         description: 成功获取退款列表
 *       400:
 *         description: 请求参数错误
 *       500:
 *         description: 服务器错误
 */
router.get('/', refundValidation.validateRefundList, refundController.getRefundList);

/**
 * @swagger
 * /api/seller/refunds/{id}:
 *   get:
 *     summary: 获取退款详情
 *     tags: [卖家退款管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: 退款ID
 *     responses:
 *       200:
 *         description: 成功获取退款详情
 *       400:
 *         description: 请求参数错误
 *       404:
 *         description: 退款记录不存在
 *       500:
 *         description: 服务器错误
 */
router.get('/:id', refundValidation.validateRefundId, refundController.getRefundDetail);

/**
 * @swagger
 * /api/seller/refunds/{id}/process:
 *   put:
 *     summary: 处理退款申请
 *     tags: [卖家退款管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: 退款ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               action:
 *                 type: string
 *                 enum: ['approve', 'reject']
 *                 description: 操作类型
 *               reason:
 *                 type: string
 *                 description: 处理原因
 *               refundAmount:
 *                 type: number
 *                 description: 退款金额（可选）
 *     responses:
 *       200:
 *         description: 成功处理退款申请
 *       400:
 *         description: 请求参数错误
 *       404:
 *         description: 退款记录不存在
 *       500:
 *         description: 服务器错误
 */
router.put('/:id/process', refundValidation.validateProcessRefund, refundController.processRefund);

/**
 * @swagger
 * /api/seller/refunds/{id}/approve:
 *   put:
 *     summary: 同意退款申请
 *     tags: [卖家退款管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: 退款ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refundAmount:
 *                 type: number
 *                 description: 退款金额（可选）
 *               reason:
 *                 type: string
 *                 description: 处理原因
 *     responses:
 *       200:
 *         description: 成功同意退款申请
 *       400:
 *         description: 请求参数错误
 *       404:
 *         description: 退款记录不存在
 *       500:
 *         description: 服务器错误
 */
router.put('/:id/approve', refundValidation.validateRefundId, refundController.approveRefund);

/**
 * @swagger
 * /api/seller/refunds/{id}/reject:
 *   put:
 *     summary: 拒绝退款申请
 *     tags: [卖家退款管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: 退款ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: 拒绝原因
 *     responses:
 *       200:
 *         description: 成功拒绝退款申请
 *       400:
 *         description: 请求参数错误
 *       404:
 *         description: 退款记录不存在
 *       500:
 *         description: 服务器错误
 */
router.put('/:id/reject', refundValidation.validateRefundId, refundController.rejectRefund);

/**
 * @swagger
 * /api/seller/refunds/statistics:
 *   get:
 *     summary: 获取退款统计信息
 *     tags: [卖家退款管理]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema: { type: string }
 *         description: 开始日期 (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema: { type: string }
 *         description: 结束日期 (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: 成功获取退款统计信息
 *       400:
 *         description: 请求参数错误
 *       500:
 *         description: 服务器错误
 */
router.get('/statistics', refundValidation.validateRefundStatistics, refundController.getRefundStatistics);

module.exports = router;