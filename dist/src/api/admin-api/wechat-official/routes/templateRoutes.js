/**
 * 公众号模板消息管理路由
 * 配置模板消息相关API接口路径和中间件
 */

const express = require('express');
const { authRequired, adminRequired } = require('../../../middlewares/auth');
const { validate } = require('../../../middlewares/validator');
const templateController = require('../controllers/templateController');
const templateValidation = require('../validations/templateValidation');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: WechatTemplate
 *   description: 公众号模板消息管理
 */

/**
 * @swagger
 * /api/admin/wechat-official/templates/public/list:
 *   get:
 *     summary: 获取模板库模板列表
 *     tags: [WechatTemplate]
 *     parameters:
 *       - name: page
 *         in: query
 *         required: false
 *         description: 页码
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: pageSize
 *         in: query
 *         required: false
 *         description: 每页数量
 *         schema:
 *           type: integer
 *           default: 20
 *       - name: industryId
 *         in: query
 *         required: false
 *         description: 行业ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code: { type: number, default: 0 }
 *                 message: { type: string, default: 'success' }
 *                 data: { type: object }
 */
router.get('/public/list', 
  authRequired, 
  adminRequired, 
  validate(templateValidation.getPublicTemplateListRules), 
  templateController.getPublicTemplateList
);

/**
 * @swagger
 * /api/admin/wechat-official/templates/public/search:
 *   get:
 *     summary: 搜索模板库模板
 *     tags: [WechatTemplate]
 *     parameters:
 *       - name: keyword
 *         in: query
 *         required: true
 *         description: 搜索关键词
 *         schema:
 *           type: string
 *       - name: page
 *         in: query
 *         required: false
 *         description: 页码
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: pageSize
 *         in: query
 *         required: false
 *         description: 每页数量
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code: { type: number, default: 0 }
 *                 message: { type: string, default: 'success' }
 *                 data: { type: object }
 */
router.get('/public/search', 
  authRequired, 
  adminRequired, 
  validate(templateValidation.searchPublicTemplateRules), 
  templateController.searchPublicTemplate
);

/**
 * @swagger
 * /api/admin/wechat-official/templates/my/list:
 *   get:
 *     summary: 获取已添加模板列表
 *     tags: [WechatTemplate]
 *     parameters:
 *       - name: status
 *         in: query
 *         required: false
 *         description: 状态 (active/inactive)
 *         schema:
 *           type: string
 *       - name: title
 *         in: query
 *         required: false
 *         description: 标题搜索
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code: { type: number, default: 0 }
 *                 message: { type: string, default: 'success' }
 *                 data: { type: array }
 */
router.get('/my/list', 
  authRequired, 
  adminRequired, 
  validate(templateValidation.getMyTemplateListRules), 
  templateController.getMyTemplateList
);

/**
 * @swagger
 * /api/admin/wechat-official/templates/my/{templateId}:
 *   get:
 *     summary: 获取模板详情
 *     tags: [WechatTemplate]
 *     parameters:
 *       - name: templateId
 *         in: path
 *         required: true
 *         description: 模板ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code: { type: number, default: 0 }
 *                 message: { type: string, default: 'success' }
 *                 data: { type: object }
 */
router.get('/my/:templateId', 
  authRequired, 
  adminRequired, 
  validate(templateValidation.getTemplateDetailRules), 
  templateController.getTemplateDetail
);

/**
 * @swagger
 * /api/admin/wechat-official/templates/add:
 *   post:
 *     summary: 从模板库添加模板
 *     tags: [WechatTemplate]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - templateIdShort
 *               - title
 *             properties:
 *               templateIdShort: { type: string, description: '模板编号' }
 *               title: { type: string, description: '模板标题' }
 *               primaryIndustry: { type: string, description: '主行业' }
 *               deputyIndustry: { type: string, description: '副行业' }
 *               content: { type: string, description: '模板内容' }
 *               example: { type: string, description: '模板示例' }
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code: { type: number, default: 0 }
 *                 message: { type: string, default: 'success' }
 *                 data: { type: object }
 */
router.post('/add', 
  authRequired, 
  adminRequired, 
  validate(templateValidation.addTemplateRules), 
  templateController.addTemplate
);

/**
 * @swagger
 * /api/admin/wechat-official/templates/my/{templateId}:
 *   put:
 *     summary: 更新模板信息
 *     tags: [WechatTemplate]
 *     parameters:
 *       - name: templateId
 *         in: path
 *         required: true
 *         description: 模板ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string, description: '模板标题' }
 *               status: { type: string, description: '状态 (active/inactive)' }
 *               keywordList: { type: array, description: '关键词列表' }
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code: { type: number, default: 0 }
 *                 message: { type: string, default: 'success' }
 *                 data: { type: object }
 */
router.put('/my/:templateId', 
  authRequired, 
  adminRequired, 
  validate(templateValidation.updateTemplateRules), 
  templateController.updateTemplate
);

/**
 * @swagger
 * /api/admin/wechat-official/templates/delete/{templateId}:
 *   delete:
 *     summary: 删除模板
 *     tags: [WechatTemplate]
 *     parameters:
 *       - name: templateId
 *         in: path
 *         required: true
 *         description: 模板ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code: { type: number, default: 0 }
 *                 message: { type: string, default: 'success' }
 *                 data: { type: object }
 */
router.delete('/delete/:templateId', 
  authRequired, 
  adminRequired, 
  validate(templateValidation.deleteTemplateRules), 
  templateController.deleteTemplate
);

/**
 * @swagger
 * /api/admin/wechat-official/templates/send:
 *   post:
 *     summary: 发送模板消息
 *     tags: [WechatTemplate]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - touser
 *               - templateId
 *               - data
 *             properties:
 *               touser: { type: string, description: '接收者openid' }
 *               templateId: { type: string, description: '模板ID' }
 *               data: { type: object, description: '消息数据' }
 *               url: { type: string, description: '跳转链接' }
 *               miniprogram: { type: object, description: '小程序信息' }
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code: { type: number, default: 0 }
 *                 message: { type: string, default: 'success' }
 *                 data: { type: object }
 */
router.post('/send', 
  authRequired, 
  adminRequired, 
  validate(templateValidation.sendTemplateMessageRules), 
  templateController.sendTemplateMessage
);

/**
 * @swagger
 * /api/admin/wechat-official/templates/preview:
 *   post:
 *     summary: 模板消息预览
 *     tags: [WechatTemplate]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - touser
 *               - templateId
 *               - data
 *             properties:
 *               touser: { type: string, description: '接收者openid' }
 *               templateId: { type: string, description: '模板ID' }
 *               data: { type: object, description: '消息数据' }
 *               url: { type: string, description: '跳转链接' }
 *               miniprogram: { type: object, description: '小程序信息' }
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code: { type: number, default: 0 }
 *                 message: { type: string, default: 'success' }
 *                 data: { type: object }
 */
router.post('/preview', 
  authRequired, 
  adminRequired, 
  validate(templateValidation.previewTemplateMessageRules), 
  templateController.previewTemplateMessage
);

/**
 * @swagger
 * /api/admin/wechat-official/templates/batch-send:
 *   post:
 *     summary: 批量发送模板消息
 *     tags: [WechatTemplate]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - templateId
 *               - data
 *               - openIds
 *             properties:
 *               templateId: { type: string, description: '模板ID' }
 *               data: { type: object, description: '消息数据' }
 *               openIds: { type: array, description: '接收者openid列表' }
 *               url: { type: string, description: '跳转链接' }
 *               miniprogram: { type: object, description: '小程序信息' }
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code: { type: number, default: 0 }
 *                 message: { type: string, default: 'success' }
 *                 data: { type: object }
 */
router.post('/batch-send', 
  authRequired, 
  adminRequired, 
  validate(templateValidation.batchSendTemplateMessageRules), 
  templateController.batchSendTemplateMessage
);

/**
 * @swagger
 * /api/admin/wechat-official/templates/records:
 *   get:
 *     summary: 获取发送记录
 *     tags: [WechatTemplate]
 *     parameters:
 *       - name: page
 *         in: query
 *         required: false
 *         description: 页码
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: pageSize
 *         in: query
 *         required: false
 *         description: 每页数量
 *         schema:
 *           type: integer
 *           default: 20
 *       - name: status
 *         in: query
 *         required: false
 *         description: 状态 (success/failed/pending)
 *         schema:
 *           type: string
 *       - name: startTime
 *         in: query
 *         required: false
 *         description: 开始时间
 *         schema:
 *           type: string
 *           format: date-time
 *       - name: endTime
 *         in: query
 *         required: false
 *         description: 结束时间
 *         schema:
 *           type: string
 *           format: date-time
 *       - name: touser
 *         in: query
 *         required: false
 *         description: 接收者openid
 *         schema:
 *           type: string
 *       - name: templateId
 *         in: query
 *         required: false
 *         description: 模板ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code: { type: number, default: 0 }
 *                 message: { type: string, default: 'success' }
 *                 data: { type: object }
 */
router.get('/records', 
  authRequired, 
  adminRequired, 
  validate(templateValidation.getMessageRecordsRules), 
  templateController.getMessageRecords
);

/**
 * @swagger
 * /api/admin/wechat-official/templates/records/search:
 *   get:
 *     summary: 搜索发送记录
 *     tags: [WechatTemplate]
 *     parameters:
 *       - name: keyword
 *         in: query
 *         required: true
 *         description: 搜索关键词
 *         schema:
 *           type: string
 *       - name: page
 *         in: query
 *         required: false
 *         description: 页码
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: pageSize
 *         in: query
 *         required: false
 *         description: 每页数量
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code: { type: number, default: 0 }
 *                 message: { type: string, default: 'success' }
 *                 data: { type: object }
 */
router.get('/records/search', 
  authRequired, 
  adminRequired, 
  validate(templateValidation.searchRecordsRules), 
  templateController.searchMessageRecords
);

/**
 * @swagger
 * /api/admin/wechat-official/templates/records/batch-delete:
 *   delete:
 *     summary: 批量删除发送记录
 *     tags: [WechatTemplate]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ids
 *             properties:
 *               ids: { type: array, description: '记录ID列表' }
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code: { type: number, default: 0 }
 *                 message: { type: string, default: 'success' }
 *                 data: { type: object }
 */
router.delete('/records/batch-delete', 
  authRequired, 
  adminRequired, 
  validate(templateValidation.batchDeleteRecordsRules), 
  templateController.batchDeleteMessageRecords
);

/**
 * @swagger
 * /api/admin/wechat-official/templates/statistics:
 *   get:
 *     summary: 获取发送统计
 *     tags: [WechatTemplate]
 *     parameters:
 *       - name: startTime
 *         in: query
 *         required: false
 *         description: 开始时间
 *         schema:
 *           type: string
 *           format: date-time
 *       - name: endTime
 *         in: query
 *         required: false
 *         description: 结束时间
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code: { type: number, default: 0 }
 *                 message: { type: string, default: 'success' }
 *                 data: { type: object }
 */
router.get('/statistics', 
  authRequired, 
  adminRequired, 
  validate(templateValidation.getMessageStatisticsRules), 
  templateController.getMessageStatistics
);

/**
 * @swagger
 * /api/admin/wechat-official/templates/records/cleanup:
 *   post:
 *     summary: 清理过期记录
 *     tags: [WechatTemplate]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               days: { type: integer, description: '保留天数' }
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code: { type: number, default: 0 }
 *                 message: { type: string, default: 'success' }
 *                 data: { type: object }
 */
router.post('/records/cleanup', 
  authRequired, 
  adminRequired, 
  validate(templateValidation.cleanupRecordsRules), 
  templateController.cleanupExpiredMessageRecords
);

module.exports = router;