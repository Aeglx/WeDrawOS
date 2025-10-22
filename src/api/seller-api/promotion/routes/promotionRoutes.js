/**
 * 卖家端促销管理路由
 * 配置API接口路径和中间件
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../../../middlewares/auth');
const promotionController = require('../controllers/promotionController');
const { 
  validateCreatePromotion,
  validatePromotionList,
  validatePromotionId,
  validateUpdatePromotion,
  validatePromotionStatus,
  validatePromotionStatistics
} = require('../validations/promotionValidation');

/**
 * @swagger
 * tags:
 *   name: Promotion
 *   description: 卖家促销活动管理
 */

/**
 * @swagger
 * /api/seller/promotions:
 *   post:
 *     summary: 创建促销活动
 *     tags: [Promotion]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, description: '促销活动名称' }
 *               type: { type: string, enum: [discount, full_reduction, free_gift, coupon, flash_sale, group_buy], description: '促销类型' }
 *               description: { type: string, description: '促销活动描述' }
 *               startTime: { type: string, format: date-time, description: '开始时间' }
 *               endTime: { type: string, format: date-time, description: '结束时间' }
 *               rule: { type: object, description: '促销规则配置' }
 *               productIds: { type: array, items: { type: string }, description: '参与促销的产品ID列表' }
 *               status: { type: string, enum: [draft, active, paused], default: draft, description: '促销活动状态' }
 *     responses:
 *       200: { description: '创建成功' }
 *       400: { description: '请求参数错误' }
 *       401: { description: '未授权' }
 */
router.post('/', requireAuth, validateCreatePromotion, promotionController.createPromotion);

/**
 * @swagger
 * /api/seller/promotions:
 *   get:
 *     summary: 获取促销活动列表
 *     tags: [Promotion]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [draft, active, paused, ended, expired] }
 *         description: '促销活动状态筛选'
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [discount, full_reduction, free_gift, coupon, flash_sale, group_buy] }
 *         description: '促销类型筛选'
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *         description: '页码'
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, default: 10 }
 *         description: '每页数量'
 *     responses:
 *       200: { description: '获取成功' }
 *       401: { description: '未授权' }
 */
router.get('/', requireAuth, validatePromotionList, promotionController.getPromotionList);

/**
 * @swagger
 * /api/seller/promotions/{id}:
 *   get:
 *     summary: 获取促销活动详情
 *     tags: [Promotion]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: '促销活动ID'
 *     responses:
 *       200: { description: '获取成功' }
 *       401: { description: '未授权' }
 *       404: { description: '促销活动不存在' }
 */
router.get('/:id', requireAuth, validatePromotionId, promotionController.getPromotionDetail);

/**
 * @swagger
 * /api/seller/promotions/{id}:
 *   put:
 *     summary: 更新促销活动
 *     tags: [Promotion]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: '促销活动ID'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, description: '促销活动名称' }
 *               description: { type: string, description: '促销活动描述' }
 *               startTime: { type: string, format: date-time, description: '开始时间' }
 *               endTime: { type: string, format: date-time, description: '结束时间' }
 *               rule: { type: object, description: '促销规则配置' }
 *               productIds: { type: array, items: { type: string }, description: '参与促销的产品ID列表' }
 *               status: { type: string, enum: [draft, active, paused, ended], description: '促销活动状态' }
 *     responses:
 *       200: { description: '更新成功' }
 *       400: { description: '请求参数错误' }
 *       401: { description: '未授权' }
 *       404: { description: '促销活动不存在' }
 */
router.put('/:id', requireAuth, validateUpdatePromotion, promotionController.updatePromotion);

/**
 * @swagger
 * /api/seller/promotions/{id}/status:
 *   patch:
 *     summary: 更新促销活动状态
 *     tags: [Promotion]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: '促销活动ID'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: string, enum: [active, paused], description: '促销活动状态' }
 *     responses:
 *       200: { description: '更新成功' }
 *       400: { description: '请求参数错误' }
 *       401: { description: '未授权' }
 *       404: { description: '促销活动不存在' }
 */
router.patch('/:id/status', requireAuth, validatePromotionStatus, promotionController.updatePromotionStatus);

/**
 * @swagger
 * /api/seller/promotions/{id}:
 *   delete:
 *     summary: 删除促销活动
 *     tags: [Promotion]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: '促销活动ID'
 *     responses:
 *       200: { description: '删除成功' }
 *       401: { description: '未授权' }
 *       404: { description: '促销活动不存在' }
 */
router.delete('/:id', requireAuth, validatePromotionId, promotionController.deletePromotion);

/**
 * @swagger
 * /api/seller/promotions/statistics:
 *   get:
 *     summary: 获取促销活动效果统计
 *     tags: [Promotion]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: promotionId
 *         schema: { type: string }
 *         description: '促销活动ID（可选，不传则统计所有活动）'
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date-time }
 *         description: '统计开始日期'
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date-time }
 *         description: '统计结束日期'
 *     responses:
 *       200: { description: '获取成功' }
 *       401: { description: '未授权' }
 */
router.get('/statistics', requireAuth, validatePromotionStatistics, promotionController.getPromotionStatistics);

module.exports = router;