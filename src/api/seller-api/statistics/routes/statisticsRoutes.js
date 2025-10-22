/**
 * 卖家端统计管理路由
 * 配置销售统计、流量统计、产品销量排行等接口
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../core/middleware/authMiddleware');
const statisticsController = require('../controllers/statisticsController');
const statisticsValidation = require('../validations/statisticsValidation');

/**
 * @swagger
 * tags:
 *   name: 卖家统计管理
 *   description: 卖家端统计管理相关接口
 */

// 应用认证中间件
router.use(authMiddleware.authenticateSeller);

/**
 * @swagger
 * /api/seller/statistics/sales:
 *   get:
 *     summary: 获取销售统计
 *     tags: [卖家统计管理]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema: { type: string }
 *         description: 开始日期 (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema: { type: string }
 *         description: 结束日期 (YYYY-MM-DD)
 *       - in: query
 *         name: period
 *         schema: { type: string, enum: ['day', 'week', 'month'], default: 'day' }
 *         description: 统计周期
 *     responses:
 *       200:
 *         description: 成功获取销售统计
 *       400:
 *         description: 请求参数错误
 *       500:
 *         description: 服务器错误
 */
router.get('/sales', statisticsValidation.validateDateRange, statisticsController.getSalesStatistics);

/**
 * @swagger
 * /api/seller/statistics/traffic:
 *   get:
 *     summary: 获取流量统计
 *     tags: [卖家统计管理]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema: { type: string }
 *         description: 开始日期 (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema: { type: string }
 *         description: 结束日期 (YYYY-MM-DD)
 *       - in: query
 *         name: period
 *         schema: { type: string, enum: ['day', 'week', 'month'], default: 'day' }
 *         description: 统计周期
 *     responses:
 *       200:
 *         description: 成功获取流量统计
 *       400:
 *         description: 请求参数错误
 *       500:
 *         description: 服务器错误
 */
router.get('/traffic', statisticsValidation.validateDateRange, statisticsController.getTrafficStatistics);

/**
 * @swagger
 * /api/seller/statistics/products/ranking:
 *   get:
 *     summary: 获取产品销量排行
 *     tags: [卖家统计管理]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema: { type: string }
 *         description: 开始日期 (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema: { type: string }
 *         description: 结束日期 (YYYY-MM-DD)
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *         description: 返回数量限制
 *     responses:
 *       200:
 *         description: 成功获取产品销量排行
 *       400:
 *         description: 请求参数错误
 *       500:
 *         description: 服务器错误
 */
router.get('/products/ranking', statisticsValidation.validateProductRanking, statisticsController.getProductSalesRanking);

/**
 * @swagger
 * /api/seller/statistics/overview:
 *   get:
 *     summary: 获取店铺经营概览
 *     tags: [卖家统计管理]
 *     parameters:
 *       - in: query
 *         name: dateRange
 *         schema: { type: string, enum: ['7days', '30days', '90days'], default: '7days' }
 *         description: 日期范围
 *     responses:
 *       200:
 *         description: 成功获取店铺经营概览
 *       400:
 *         description: 请求参数错误
 *       500:
 *         description: 服务器错误
 */
router.get('/overview', statisticsValidation.validateStoreOverview, statisticsController.getStoreOverview);

/**
 * @swagger
 * /api/seller/statistics/user-behavior:
 *   get:
 *     summary: 获取用户购买行为统计
 *     tags: [卖家统计管理]
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
 *         description: 成功获取用户购买行为统计
 *       400:
 *         description: 请求参数错误
 *       500:
 *         description: 服务器错误
 */
router.get('/user-behavior', statisticsValidation.validateDateRange, statisticsController.getUserPurchaseBehavior);

/**
 * @swagger
 * /api/seller/statistics/orders/status:
 *   get:
 *     summary: 获取订单状态分布
 *     tags: [卖家统计管理]
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
 *         description: 成功获取订单状态分布
 *       400:
 *         description: 请求参数错误
 *       500:
 *         description: 服务器错误
 */
router.get('/orders/status', statisticsValidation.validateDateRange, statisticsController.getOrderStatusDistribution);

module.exports = router;