/**
 * 反馈路由配置
 * 定义客服系统中与客户反馈相关的API端点
 */
const express = require('express');
const { body, param, query } = require('express-validator');
const FeedbackController = require('../controllers/FeedbackController.js');
const { requireAuth, requireRole, validateRequest } = require('../middleware/auth.js');

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
  requireAuth,
  [
    body('conversationId').notEmpty().withMessage('会话ID不能为空'),
    body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('评分必须在1-5之间')
  ],
  // 临时处理函数，避免undefined错误
  (req, res) => {
    res.status(200).json({
      success: true,
      message: '提交反馈接口暂未实现，但路由已配置'
    });
  }
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
  requireAuth,
  requireRole(['admin', 'supervisor', 'agent']),
  // 临时处理函数，避免undefined错误
  (req, res) => {
    res.status(200).json({
      success: true,
      message: '获取反馈列表接口暂未实现，但路由已配置',
      data: []
    });
  }
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
  requireAuth,
  [
    param('feedbackId').notEmpty().withMessage('反馈ID不能为空')
  ],
  // 临时处理函数，避免undefined错误
  (req, res) => {
    res.status(200).json({
      success: true,
      message: '获取反馈详情接口暂未实现，但路由已配置',
      data: {}
    });
  }
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
  requireAuth,
  [
    param('feedbackId').notEmpty().withMessage('反馈ID不能为空'),
    body('status').isIn(['pending', 'processing', 'resolved', 'dismissed']).withMessage('无效的状态值')
  ],
  // 临时处理函数，避免undefined错误
  (req, res) => {
    res.status(200).json({
      success: true,
      message: '更新反馈状态接口暂未实现，但路由已配置'
    });
  }
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
  requireAuth,
  [
    param('feedbackId').notEmpty().withMessage('反馈ID不能为空'),
    body('response').notEmpty().withMessage('回复内容不能为空'),
    body('status').optional().isIn(['pending', 'processing', 'resolved', 'dismissed']).withMessage('无效的状态值')
  ],
  // 临时处理函数，避免undefined错误
  (req, res) => {
    res.status(200).json({
      success: true,
      message: '回复反馈接口暂未实现，但路由已配置'
    });
  }
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
  requireAuth,
  requireRole(['admin', 'supervisor']),
  // 临时处理函数，避免undefined错误
  (req, res) => {
    res.status(200).json({
      success: true,
      message: '获取反馈统计接口暂未实现，但路由已配置',
      data: {}
    });
  }
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
  requireAuth,
  requireRole(['admin', 'supervisor']),
  [
    body('feedbackIds').isArray({ min: 1 }).withMessage('请提供有效的反馈ID列表'),
    body('status').isIn(['pending', 'processing', 'resolved', 'dismissed']).withMessage('无效的状态值')
  ],
  // 临时处理函数，避免undefined错误
  (req, res) => {
    res.status(200).json({
      success: true,
      message: '批量更新反馈状态接口暂未实现，但路由已配置'
    });
  }
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
  requireAuth,
  // 临时处理函数，避免undefined错误
  (req, res) => {
    res.status(200).json({
      success: true,
      message: '获取用户反馈历史接口暂未实现，但路由已配置',
      data: []
    });
  }
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
  requireAuth,
  requireRole(['admin']),
  [
    param('feedbackId').notEmpty().withMessage('反馈ID不能为空')
  ],
  // 临时处理函数，避免undefined错误
  (req, res) => {
    res.status(200).json({
      success: true,
      message: '删除反馈接口暂未实现，但路由已配置'
    });
  }
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
  requireAuth,
  requireRole(['admin', 'supervisor']),
  // 临时处理函数，避免undefined错误
  (req, res) => {
    res.status(200).json({
      success: true,
      message: '导出反馈接口暂未实现，但路由已配置'
    });
  }
);

// 错误处理由应用层统一处理

module.exports = router;