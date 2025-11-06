/**
 * 产品管理路由
 * 定义产品相关的API端点
 */

const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

/**
 * @swagger
 * /api/admin/product/list:  
 *   get:
 *     summary: 获取产品列表
 *     tags: [产品管理]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: 页码
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *         description: 每页数量
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: 产品名称
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         description: 产品ID
 *       - in: query
 *         name: auditStatus
 *         schema:
 *           type: string
 *         description: 审核状态
 *     responses:
 *       200:
 *         description: 成功
 */
router.get('/list', productController.getProducts);

/**
 * @swagger
 * /api/admin/product/detail/{productId}:
 *   get:
 *     summary: 获取产品详情
 *     tags: [产品管理]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: 产品ID
 *     responses:
 *       200:
 *         description: 成功
 */
router.get('/detail/:productId', productController.getProductDetail);

/**
 * @swagger
 * /api/admin/product/audit/{productId}:
 *   put:
 *     summary: 审核产品
 *     tags: [产品管理]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: 产品ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               result:
 *                 type: string
 *                 enum: [pass, reject]
 *                 description: 审核结果
 *               remark:
 *                 type: string
 *                 description: 审核备注
 *     responses:
 *       200:
 *         description: 成功
 */
router.put('/audit/:productId', productController.auditProduct);

/**
 * @swagger
 * /api/admin/product/offline/{productId}:
 *   put:
 *     summary: 下架产品
 *     tags: [产品管理]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: 产品ID
 *     responses:
 *       200:
 *         description: 成功
 */
router.put('/offline/:productId', productController.offlineProduct);

module.exports = router;