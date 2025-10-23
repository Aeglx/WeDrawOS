/**
 * 评价路由配置
 */

const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const authMiddleware = require('../../../core/security/authMiddleware');
const { validate } = require('../../../core/validation/index');
const reviewValidation = require('../validations/reviewValidation');

/**
 * @swagger
 * tags:
 *   name: 评价管理
 *   description: 买家端评价相关接口
 */

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     summary: 创建商品评价
 *     description: 为已购买的商品创建评价
 *     tags: [评价管理]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderItemId
 *               - productId
 *               - rating
 *               - content
 *             properties:
 *               orderItemId: 
 *                 type: string
 *                 description: 订单项ID
 *               productId: 
 *                 type: string
 *                 description: 商品ID
 *               rating: 
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: 评分（1-5星）
 *               content: 
 *                 type: string
 *                 description: 评价内容
 *               images: 
 *                 type: array
 *                 items: 
 *                   type: string
 *                 description: 评价图片URL列表
 *     responses:
 *       201:
 *         description: 评价创建成功
 *       400:
 *         description: 参数错误
 *       401:
 *         description: 未授权
 *       403:
 *         description: 无权评价
 */
router.post('/', 
  authMiddleware.authenticate, 
  validate(reviewValidation.createReview), 
  reviewController.createReview
);

/**
 * @swagger
 * /api/reviews/product/{productId}:
 *   get:
 *     summary: 获取商品评价列表
 *     description: 获取指定商品的评价列表，支持分页、排序和评分筛选
 *     tags: [评价管理]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: 商品ID
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
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: 排序字段
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           default: desc
 *         description: 排序方向（asc/desc）
 *       - in: query
 *         name: rating
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         description: 筛选评分
 *     responses:
 *       200:
 *         description: 获取成功
 *       404:
 *         description: 商品不存在
 */
router.get('/product/:productId', 
  validate(reviewValidation.getProductReviews), 
  reviewController.getProductReviews
);

/**
 * @swagger
 * /api/reviews/user:
 *   get:
 *     summary: 获取用户评价列表
 *     description: 获取当前登录用户的评价列表
 *     tags: [评价管理]
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
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: 排序字段
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           default: desc
 *         description: 排序方向（asc/desc）
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未授权
 */
router.get('/user', 
  authMiddleware.authenticate, 
  validate(reviewValidation.getUserReviews), 
  reviewController.getUserReviews
);

/**
 * @swagger
 * /api/reviews/{id}:
 *   get:
 *     summary: 获取评价详情
 *     description: 获取指定评价的详细信息，包括回复
 *     tags: [评价管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 评价ID
 *     responses:
 *       200:
 *         description: 获取成功
 *       404:
 *         description: 评价不存在
 */
router.get('/:id', 
  validate(reviewValidation.getReviewDetail), 
  reviewController.getReviewDetail
);

/**
 * @swagger
 * /api/reviews/{id}:
 *   put:
 *     summary: 更新评价
 *     description: 更新用户自己的评价
 *     tags: [评价管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 评价ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating: 
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: 评分（1-5星）
 *               content: 
 *                 type: string
 *                 description: 评价内容
 *               images: 
 *                 type: array
 *                 items: 
 *                   type: string
 *                 description: 评价图片URL列表
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
 *         description: 评价不存在
 */
router.put('/:id', 
  authMiddleware.authenticate, 
  validate(reviewValidation.updateReview), 
  reviewController.updateReview
);

/**
 * @swagger
 * /api/reviews/{id}:
 *   delete:
 *     summary: 删除评价
 *     description: 删除用户自己的评价（软删除）
 *     tags: [评价管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 评价ID
 *     responses:
 *       200:
 *         description: 删除成功
 *       401:
 *         description: 未授权
 *       403:
 *         description: 无权删除
 *       404:
 *         description: 评价不存在
 */
router.delete('/:id', 
  authMiddleware.authenticate, 
  validate(reviewValidation.deleteReview), 
  reviewController.deleteReview
);

/**
 * @swagger
 * /api/reviews/{id}/replies:
 *   get:
 *     summary: 获取评价回复
 *     description: 获取指定评价的所有回复
 *     tags: [评价管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 评价ID
 *     responses:
 *       200:
 *         description: 获取成功
 *       404:
 *         description: 评价不存在
 */
router.get('/:id/replies', 
  validate(reviewValidation.getReviewReplies), 
  reviewController.getReviewReplies
);

/**
 * @swagger
 * /api/reviews/{id}/reply:
 *   post:
 *     summary: 回复评价
 *     description: 商家回复买家的评价（卖家端接口，此处为演示）
 *     tags: [评价管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 评价ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content: 
 *                 type: string
 *                 description: 回复内容
 *     responses:
 *       201:
 *         description: 回复成功
 *       400:
 *         description: 参数错误
 *       401:
 *         description: 未授权
 *       403:
 *         description: 无权回复
 *       404:
 *         description: 评价不存在
 */
router.post('/:id/reply', 
  authMiddleware.authenticate, 
  validate(reviewValidation.replyReview), 
  reviewController.replyReview
);

/**
 * @swagger
 * /api/reviews/product/{productId}/stats:
 *   get:
 *     summary: 获取商品评价统计
 *     description: 获取指定商品的评价统计信息
 *     tags: [评价管理]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: 商品ID
 *     responses:
 *       200:
 *         description: 获取成功
 *       404:
 *         description: 商品不存在
 */
router.get('/product/:productId/stats', 
  validate(reviewValidation.getReviewStats), 
  reviewController.getReviewStats
);

/**
 * @swagger
 * /api/reviews/order-items/evaluable:
 *   get:
 *     summary: 获取可评价的订单项
 *     description: 获取当前登录用户可以评价的订单项列表
 *     tags: [评价管理]
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
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未授权
 */
router.get('/order-items/evaluable', 
  authMiddleware.authenticate, 
  validate(reviewValidation.getEvaluableItems), 
  reviewController.getEvaluableItems
);

module.exports = router;