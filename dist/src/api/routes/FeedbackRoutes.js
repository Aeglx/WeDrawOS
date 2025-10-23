/**
 * 反馈路由配置
 * 定义客服系统中与客户反馈相关的API端点
 */
import express from 'express';
import { body, param, query } from 'express-validator';
import FeedbackController from '../controllers/FeedbackController.js';
import authMiddleware from '../middleware/auth.js';
import roleMiddleware from '../middleware/role.js';
import errorHandler from '../middleware/errorHandler.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Feedback
 *   description: 客户反馈管理
 */

/**
 * @swagger
 * /api/feedback:  
 *   post:
 *     summary: 提交反馈
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               conversationId: 
 *                 type: string
 *                 description: 会话ID
 *               rating: 
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: 评分（1-5星）
 *               feedbackType: 
 *                 type: string
 *                 description: 反馈类型
 *               comments: 
 *                 type: string
 *                 description: 反馈内容
 *               metadata: 
 *                 type: object
 *                 description: 元数据
 *     responses:
 *       201: 
 *         description: 反馈提交成功
 *       400: 
 *         description: 请求参数错误
 *       401: 
 *         description: 未授权
 *       403: 
 *         description: 无权限
 */
router.post('/feedback', 
  authMiddleware,
  [
    body('conversationId').notEmpty().withMessage('会话ID不能为空'),
    body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('评分必须在1-5之间')
  ],
  FeedbackController.submitFeedback
);

/**
 * @swagger
 * /api/feedback:  
 *   get:
 *     summary: 获取反馈列表
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: feedbackType
 *         schema:
 *           type: string
 *       - in: query
 *         name: minRating
 *         schema:
 *           type: integer
 *       - in: query
 *         name: maxRating
 *         schema:
 *           type: integer
 *       - in: query
 *         name: agentId
 *         schema:
 *           type: string
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: conversationId
 *         schema:
 *           type: string
 *     responses:
 *       200: 
 *         description: 获取反馈列表成功
 *       401: 
 *         description: 未授权
 *       403: 
 *         description: 无权限
 */
router.get('/feedback', 
  authMiddleware,
  roleMiddleware(['admin', 'supervisor', 'agent']),
  FeedbackController.getFeedbacks
);

/**
 * @swagger
 * /api/feedback/{feedbackId}:
 *   get:
 *     summary: 获取单个反馈详情
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: feedbackId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200: 
 *         description: 获取反馈详情成功
 *       401: 
 *         description: 未授权
 *       403: 
 *         description: 无权限
 *       404: 
 *         description: 反馈不存在
 */
router.get('/feedback/:feedbackId', 
  authMiddleware,
  [
    param('feedbackId').notEmpty().withMessage('反馈ID不能为空')
  ],
  FeedbackController.getFeedbackById
);

/**
 * @swagger
 * /api/feedback/{feedbackId}/status:
 *   patch:
 *     summary: 更新反馈状态
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: feedbackId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: 
 *                 type: string
 *                 enum: [pending, processing, resolved, dismissed]
 *               response: 
 *                 type: string
 *     responses:
 *       200: 
 *         description: 反馈状态更新成功
 *       400: 
 *         description: 请求参数错误
 *       401: 
 *         description: 未授权
 *       403: 
 *         description: 无权限
 *       404: 
 *         description: 反馈不存在
 */
router.patch('/feedback/:feedbackId/status', 
  authMiddleware,
  [
    param('feedbackId').notEmpty().withMessage('反馈ID不能为空'),
    body('status').isIn(['pending', 'processing', 'resolved', 'dismissed']).withMessage('无效的状态值')
  ],
  FeedbackController.updateFeedbackStatus
);

/**
 * @swagger
 * /api/feedback/{feedbackId}/respond:
 *   post:
 *     summary: 回复反馈
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: feedbackId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               response: 
 *                 type: string
 *                 required: true
 *               status: 
 *                 type: string
 *                 enum: [pending, processing, resolved, dismissed]
 *                 default: resolved
 *     responses:
 *       200: 
 *         description: 反馈回复成功
 *       400: 
 *         description: 请求参数错误
 *       401: 
 *         description: 未授权
 *       403: 
 *         description: 无权限
 *       404: 
 *         description: 反馈不存在
 */
router.post('/feedback/:feedbackId/respond', 
  authMiddleware,
  [
    param('feedbackId').notEmpty().withMessage('反馈ID不能为空'),
    body('response').notEmpty().withMessage('回复内容不能为空'),
    body('status').optional().isIn(['pending', 'processing', 'resolved', 'dismissed']).withMessage('无效的状态值')
  ],
  FeedbackController.respondToFeedback
);

/**
 * @swagger
 * /api/feedback/stats:
 *   get:
 *     summary: 获取反馈统计
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: agentId
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *           default: day
 *     responses:
 *       200: 
 *         description: 获取反馈统计成功
 *       401: 
 *         description: 未授权
 *       403: 
 *         description: 无权限
 */
router.get('/feedback/stats', 
  authMiddleware,
  roleMiddleware(['admin', 'supervisor']),
  FeedbackController.getFeedbackStats
);

/**
 * @swagger
 * /api/feedback/batch/status:
 *   patch:
 *     summary: 批量更新反馈状态
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               feedbackIds: 
 *                 type: array
 *                 items:
 *                   type: string
 *                 required: true
 *               status: 
 *                 type: string
 *                 enum: [pending, processing, resolved, dismissed]
 *                 required: true
 *     responses:
 *       200: 
 *         description: 批量更新反馈状态成功
 *       400: 
 *         description: 请求参数错误
 *       401: 
 *         description: 未授权
 *       403: 
 *         description: 无权限
 */
router.patch('/feedback/batch/status', 
  authMiddleware,
  roleMiddleware(['admin', 'supervisor']),
  [
    body('feedbackIds').isArray({ min: 1 }).withMessage('请提供有效的反馈ID列表'),
    body('status').isIn(['pending', 'processing', 'resolved', 'dismissed']).withMessage('无效的状态值')
  ],
  FeedbackController.batchUpdateFeedbackStatus
);

/**
 * @swagger
 * /api/feedback/user-history:
 *   get:
 *     summary: 获取用户自己的反馈历史
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: feedbackType
 *         schema:
 *           type: string
 *     responses:
 *       200: 
 *         description: 获取反馈历史成功
 *       401: 
 *         description: 未授权
 */
router.get('/feedback/user-history', 
  authMiddleware,
  FeedbackController.getUserFeedbackHistory
);

/**
 * @swagger
 * /api/feedback/{feedbackId}:
 *   delete:
 *     summary: 删除反馈（仅管理员）
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: feedbackId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200: 
 *         description: 反馈删除成功
 *       401: 
 *         description: 未授权
 *       403: 
 *         description: 无权限
 *       404: 
 *         description: 反馈不存在
 */
router.delete('/feedback/:feedbackId', 
  authMiddleware,
  roleMiddleware(['admin']),
  [
    param('feedbackId').notEmpty().withMessage('反馈ID不能为空')
  ],
  FeedbackController.deleteFeedback
);

/**
 * @swagger
 * /api/feedback/export:
 *   get:
 *     summary: 导出反馈数据
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: feedbackType
 *         schema:
 *           type: string
 *       - in: query
 *         name: minRating
 *         schema:
 *           type: integer
 *       - in: query
 *         name: maxRating
 *         schema:
 *           type: integer
 *       - in: query
 *         name: agentId
 *         schema:
 *           type: string
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv]
 *           default: json
 *     responses:
 *       200: 
 *         description: 导出成功
 *       401: 
 *         description: 未授权
 *       403: 
 *         description: 无权限
 */
router.get('/feedback/export', 
  authMiddleware,
  roleMiddleware(['admin', 'supervisor']),
  FeedbackController.exportFeedbacks
);

// 错误处理中间件
router.use(errorHandler);

export default router;