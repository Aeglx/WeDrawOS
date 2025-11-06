// 商家对账路由
const express = require('express');
const router = express.Router();
const merchantReconciliationController = require('../controllers/merchantReconciliationController');

/**
 * @swagger
 * /api/admin/shop/reconciliation:description: 获取商家对账数据
 * @swagger
 * /api/admin/shop/reconciliation:method: GET
 * @swagger
 * /api/admin/shop/reconciliation:parameters:
 *   - name: shopCode
 *     description: 店铺编号
 *     in: query
 *     type: string
 *   - name: startTime
 *     description: 开始时间
 *     in: query
 *     type: string
 *   - name: endTime
 *     description: 结束时间
 *     in: query
 *     type: string
 *   - name: orderStatus
 *     description: 订单状态
 *     in: query
 *     type: string
 *   - name: page
 *     description: 页码
 *     in: query
 *     type: integer
 *     default: 1
 *   - name: pageSize
 *     description: 每页数量
 *     in: query
 *     type: integer
 *     default: 10
 */
router.get('/reconciliation', merchantReconciliationController.getReconciliationData);

/**
 * @swagger
 * /api/admin/shop/reconciliation/{orderNo}:description: 获取对账详情
 * @swagger
 * /api/admin/shop/reconciliation/{orderNo}:method: GET
 * @swagger
 * /api/admin/shop/reconciliation/{orderNo}:parameters:
 *   - name: orderNo
 *     description: 订单号
 *     in: path
 *     type: string
 *     required: true
 */
router.get('/reconciliation/:orderNo', merchantReconciliationController.getReconciliationDetail);

module.exports = router;