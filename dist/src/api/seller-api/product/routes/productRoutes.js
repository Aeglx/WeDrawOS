/**
 * 卖家端商品管理路由配置
 */

const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('@core/middlewares/authMiddleware');
const { validate } = require('@core/middlewares/validationMiddleware');
const productValidation = require('../validations/productValidation');

/**
 * @swagger
 * tags:
 *   name: 卖家商品管理
 *   description: 卖家端商品发布、管理相关接口
 */

/**
 * @swagger
 * /api/seller/products:
 *   post:
 *     summary: 创建商品
 *     description: 卖家创建新商品
 *     tags: [卖家商品管理]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - categoryId
 *               - price
 *             properties:
 *               name: 
 *                 type: string
 *                 description: 商品名称
 *               categoryId: 
 *                 type: string
 *                 description: 分类ID
 *               price: 
 *                 type: number
 *                 description: 售价
 *               originalPrice: 
 *                 type: number
 *                 description: 原价
 *               description: 
 *                 type: string
 *                 description: 商品描述
 *               status: 
 *                 type: string
 *                 enum: [draft, active, inactive]
 *                 description: 商品状态
 *               stock: 
 *                 type: integer
 *                 description: 库存数量
 *               variants: 
 *                 type: array
 *                 items: 
 *                   type: object
 *                 description: 商品变体
 *               images: 
 *                 type: array
 *                 items: 
 *                   type: string
 *                 description: 商品图片URL列表
 *     responses:
 *       201:
 *         description: 商品创建成功
 *       400:
 *         description: 参数错误
 *       401:
 *         description: 未授权
 */
router.post('/', 
  authMiddleware.authenticate, 
  validate(productValidation.createProduct), 
  productController.createProduct
);

/**
 * @swagger
 * /api/seller/products:
 *   get:
 *     summary: 获取商品列表
 *     description: 获取当前卖家的商品列表
 *     tags: [卖家商品管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 每页数量
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, active, inactive]
 *         description: 商品状态筛选
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: 搜索关键词
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未授权
 */
router.get('/', 
  authMiddleware.authenticate, 
  validate(productValidation.getProducts), 
  productController.getProducts
);

/**
 * @swagger
 * /api/seller/products/{id}:
 *   get:
 *     summary: 获取商品详情
 *     description: 获取指定商品的详细信息
 *     tags: [卖家商品管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 商品ID
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未授权
 *       403:
 *         description: 无权查看
 *       404:
 *         description: 商品不存在
 */
router.get('/:id', 
  authMiddleware.authenticate, 
  validate(productValidation.getProductDetail), 
  productController.getProductDetail
);

/**
 * @swagger
 * /api/seller/products/{id}:
 *   put:
 *     summary: 更新商品信息
 *     description: 更新商品的基本信息
 *     tags: [卖家商品管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 商品ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: 
 *                 type: string
 *                 description: 商品名称
 *               categoryId: 
 *                 type: string
 *                 description: 分类ID
 *               price: 
 *                 type: number
 *                 description: 售价
 *               originalPrice: 
 *                 type: number
 *                 description: 原价
 *               description: 
 *                 type: string
 *                 description: 商品描述
 *               images: 
 *                 type: array
 *                 items: 
 *                   type: string
 *                 description: 商品图片URL列表
 *     responses:
 *       200:
 *         description: 更新成功
 *       400:
 *         description: 参数错误
 *       401:
 *         description: 未授权
 *       403:
 *         description: 无权更新
 *       404:
 *         description: 商品不存在
 */
router.put('/:id', 
  authMiddleware.authenticate, 
  validate(productValidation.updateProduct), 
  productController.updateProduct
);

/**
 * @swagger
 * /api/seller/products/{id}/status:
 *   patch:
 *     summary: 变更商品状态
 *     description: 上下架商品或设置为草稿
 *     tags: [卖家商品管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 商品ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status: 
 *                 type: string
 *                 enum: [draft, active, inactive]
 *                 description: 新状态
 *     responses:
 *       200:
 *         description: 状态变更成功
 *       400:
 *         description: 参数错误
 *       401:
 *         description: 未授权
 *       403:
 *         description: 无权操作
 *       404:
 *         description: 商品不存在
 */
router.patch('/:id/status', 
  authMiddleware.authenticate, 
  validate(productValidation.changeStatus), 
  productController.changeStatus
);

/**
 * @swagger
 * /api/seller/products/batch/status:
 *   patch:
 *     summary: 批量变更商品状态
 *     description: 批量上下架商品
 *     tags: [卖家商品管理]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productIds
 *               - status
 *             properties:
 *               productIds: 
 *                 type: array
 *                 items: 
 *                   type: string
 *                 description: 商品ID列表
 *               status: 
 *                 type: string
 *                 enum: [draft, active, inactive]
 *                 description: 新状态
 *     responses:
 *       200:
 *         description: 批量状态变更成功
 *       400:
 *         description: 参数错误
 *       401:
 *         description: 未授权
 *       403:
 *         description: 无权操作
 */
router.patch('/batch/status', 
  authMiddleware.authenticate, 
  validate(productValidation.batchChangeStatus), 
  productController.batchChangeStatus
);

/**
 * @swagger
 * /api/seller/products/{id}/inventory:
 *   patch:
 *     summary: 更新商品库存
 *     description: 更新商品变体的库存
 *     tags: [卖家商品管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 商品ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - variants
 *             properties:
 *               variants: 
 *                 type: array
 *                 items: 
 *                   type: object
 *                   properties:
 *                     skuId: 
 *                       type: string
 *                       description: SKU ID
 *                     quantity: 
 *                       type: integer
 *                       description: 库存数量
 *                 description: 变体库存数据
 *     responses:
 *       200:
 *         description: 库存更新成功
 *       400:
 *         description: 参数错误
 *       401:
 *         description: 未授权
 *       403:
 *         description: 无权操作
 *       404:
 *         description: 商品不存在
 */
router.patch('/:id/inventory', 
  authMiddleware.authenticate, 
  validate(productValidation.updateInventory), 
  productController.updateInventory
);

/**
 * @swagger
 * /api/seller/products/{id}/price:
 *   patch:
 *     summary: 更新商品价格
 *     description: 更新商品变体的价格
 *     tags: [卖家商品管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 商品ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - variants
 *             properties:
 *               variants: 
 *                 type: array
 *                 items: 
 *                   type: object
 *                   properties:
 *                     skuId: 
 *                       type: string
 *                       description: SKU ID
 *                     price: 
 *                       type: number
 *                       description: 售价
 *                     originalPrice: 
 *                       type: number
 *                       description: 原价
 *                 description: 变体价格数据
 *     responses:
 *       200:
 *         description: 价格更新成功
 *       400:
 *         description: 参数错误
 *       401:
 *         description: 未授权
 *       403:
 *         description: 无权操作
 *       404:
 *         description: 商品不存在
 */
router.patch('/:id/price', 
  authMiddleware.authenticate, 
  validate(productValidation.updatePrice), 
  productController.updatePrice
);

/**
 * @swagger
 * /api/seller/products/{id}/copy:
 *   post:
 *     summary: 复制商品
 *     description: 复制现有商品创建新商品
 *     tags: [卖家商品管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 原商品ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: 
 *                 type: string
 *                 description: 新商品名称（可选）
 *     responses:
 *       201:
 *         description: 商品复制成功
 *       401:
 *         description: 未授权
 *       403:
 *         description: 无权操作
 *       404:
 *         description: 商品不存在
 */
router.post('/:id/copy', 
  authMiddleware.authenticate, 
  validate(productValidation.copyProduct), 
  productController.copyProduct
);

/**
 * @swagger
 * /api/seller/products/{id}:
 *   delete:
 *     summary: 删除商品
 *     description: 删除商品（只能删除草稿状态的商品）
 *     tags: [卖家商品管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 商品ID
 *     responses:
 *       200:
 *         description: 商品删除成功
 *       400:
 *         description: 商品状态不允许删除
 *       401:
 *         description: 未授权
 *       403:
 *         description: 无权删除
 *       404:
 *         description: 商品不存在
 */
router.delete('/:id', 
  authMiddleware.authenticate, 
  validate(productValidation.deleteProduct), 
  productController.deleteProduct
);

/**
 * @swagger
 * /api/seller/products/batch:
 *   delete:
 *     summary: 批量删除商品
 *     description: 批量删除商品（只能删除草稿状态的商品）
 *     tags: [卖家商品管理]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productIds
 *             properties:
 *               productIds: 
 *                 type: array
 *                 items: 
 *                   type: string
 *                 description: 商品ID列表
 *     responses:
 *       200:
 *         description: 批量删除成功
 *       400:
 *         description: 参数错误或商品状态不允许删除
 *       401:
 *         description: 未授权
 *       403:
 *         description: 无权删除
 */
router.delete('/batch', 
  authMiddleware.authenticate, 
  validate(productValidation.batchDeleteProducts), 
  productController.batchDeleteProducts
);

module.exports = router;