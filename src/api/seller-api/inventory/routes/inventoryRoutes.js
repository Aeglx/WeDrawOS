/**
 * 卖家端库存管理路由
 * 配置库存列表、更新库存、库存预警等接口
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../core/middleware/authMiddleware');
const inventoryController = require('../controllers/inventoryController');
const inventoryValidation = require('../validations/inventoryValidation');

/**
 * @swagger
 * tags:
 *   name: 卖家库存管理
 *   description: 卖家端库存管理相关接口
 */

// 应用认证中间件
router.use(authMiddleware.authenticateSeller);

/**
 * @swagger
 * /api/seller/inventory:
 *   get:
 *     summary: 获取库存列表
 *     tags: [卖家库存管理]
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
 *         name: productId
 *         schema: { type: integer }
 *         description: 产品ID
 *       - in: query
 *         name: skuId
 *         schema: { type: integer }
 *         description: SKU ID
 *       - in: query
 *         name: keyword
 *         schema: { type: string }
 *         description: 关键词搜索
 *       - in: query
 *         name: alertOnly
 *         schema: { type: boolean }
 *         description: 仅显示预警库存
 *     responses:
 *       200:
 *         description: 成功获取库存列表
 *       400:
 *         description: 请求参数错误
 *       500:
 *         description: 服务器错误
 */
router.get('/', inventoryValidation.validateGetInventoryList, inventoryController.getInventoryList);

/**
 * @swagger
 * /api/seller/inventory/products/{id}:
 *   put:
 *     summary: 更新产品库存
 *     tags: [卖家库存管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: 产品ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity: { type: integer, required: true, minimum: 0, description: '库存数量' }
 *               skuId: { type: integer, description: 'SKU ID' }
 *               reason: { type: string, maxLength: 255, description: '更新原因' }
 *     responses:
 *       200:
 *         description: 成功更新产品库存
 *       400:
 *         description: 请求参数错误
 *       500:
 *         description: 服务器错误
 */
router.put('/products/:id', inventoryValidation.validateUpdateInventory, inventoryController.updateInventory);

/**
 * @swagger
 * /api/seller/inventory/alerts:
 *   get:
 *     summary: 获取库存预警
 *     tags: [卖家库存管理]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *         description: 页码
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, default: 10 }
 *         description: 每页数量
 *     responses:
 *       200:
 *         description: 成功获取库存预警
 *       400:
 *         description: 请求参数错误
 *       500:
 *         description: 服务器错误
 */
router.get('/alerts', inventoryValidation.validateGetInventoryAlerts, inventoryController.getInventoryAlerts);

/**
 * @swagger
 * /api/seller/inventory/alert:
 *   post:
 *     summary: 设置库存预警阈值
 *     tags: [卖家库存管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId: { type: integer, required: true, description: '产品ID' }
 *               alertThreshold: { type: integer, required: true, minimum: 0, description: '预警阈值' }
 *               skuId: { type: integer, description: 'SKU ID' }
 *     responses:
 *       200:
 *         description: 成功设置库存预警阈值
 *       400:
 *         description: 请求参数错误
 *       500:
 *         description: 服务器错误
 */
router.post('/alert', inventoryValidation.validateSetInventoryAlert, inventoryController.setInventoryAlert);

/**
 * @swagger
 * /api/seller/inventory/batch:
 *   put:
 *     summary: 批量更新库存
 *     tags: [卖家库存管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId: { type: integer, required: true }
 *                     skuId: { type: integer }
 *                     quantity: { type: integer, required: true, minimum: 0 }
 *                     reason: { type: string, maxLength: 255 }
 *     responses:
 *       200:
 *         description: 成功批量更新库存
 *       400:
 *         description: 请求参数错误
 *       500:
 *         description: 服务器错误
 */
router.put('/batch', inventoryValidation.validateBatchUpdateInventory, inventoryController.batchUpdateInventory);

/**
 * @swagger
 * /api/seller/inventory/stats:
 *   get:
 *     summary: 获取库存统计信息
 *     tags: [卖家库存管理]
 *     responses:
 *       200:
 *         description: 成功获取库存统计信息
 *       500:
 *         description: 服务器错误
 */
router.get('/stats', inventoryController.getInventoryStats);

/**
 * @swagger
 * /api/seller/inventory/export:
 *   get:
 *     summary: 导出库存数据
 *     tags: [卖家库存管理]
 *     parameters:
 *       - in: query
 *         name: format
 *         schema: { type: string, enum: ['csv', 'json'], default: 'csv' }
 *         description: 导出格式
 *     responses:
 *       200:
 *         description: 成功导出库存数据
 *       400:
 *         description: 请求参数错误
 *       500:
 *         description: 服务器错误
 */
router.get('/export', inventoryValidation.validateExportInventory, inventoryController.exportInventory);

module.exports = router;