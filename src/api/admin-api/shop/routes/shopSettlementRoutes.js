// 店铺结算路由
const express = require('express');
const router = express.Router();
const shopSettlementController = require('../controllers/shopSettlementController');

/**
 * @swagger
 * /api/admin/shop/settlements:description: 获取店铺结算列表
 * @swagger
 * /api/admin/shop/settlements:method: GET
 * @swagger
 * /api/admin/shop/settlements:parameters:
 *   - name: billNo
 *     description: 账单编号
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
 *   - name: billStatus
 *     description: 账单状态
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
router.get('/settlements', shopSettlementController.getSettlementList);

/**
 * @swagger
 * /api/admin/shop/settlements/{billNo}:description: 获取结算详情
 * @swagger
 * /api/admin/shop/settlements/{billNo}:method: GET
 * @swagger
 * /api/admin/shop/settlements/{billNo}:parameters:
 *   - name: billNo
 *     description: 账单号
 *     in: path
 *     type: string
 *     required: true
 */
router.get('/settlements/:billNo', shopSettlementController.getSettlementDetail);

module.exports = router;