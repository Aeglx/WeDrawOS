/**
 * 内容管理路由
 * 配置公告、帮助中心、知识库等内容管理相关的API接口路径
 */

const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');
const { requireAuth } = require('../../../../middlewares/auth');
const { 
  // 公告验证
  validateAnnouncement,
  validateAnnouncementUpdate,
  validateAnnouncementId,
  validateAnnouncementList,
  
  // 帮助文章验证
  validateHelpArticle,
  validateHelpArticleUpdate,
  validateHelpArticleId,
  validateHelpArticleList,
  
  // 知识库文档验证
  validateKnowledgeDoc,
  validateKnowledgeDocUpdate,
  validateKnowledgeDocId,
  validateKnowledgeDocList
} = require('../validations/contentValidation');

/**
 * @swagger
 * tags:
 *   name: Content
 *   description: 内容管理模块
 */

// 公告管理路由
/**
 * @swagger
 * /api/admin/content/announcements:
 *   post:
 *     summary: 创建公告
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string, description: '公告标题' }
 *               content: { type: string, description: '公告内容' }
 *               status: { type: string, enum: [active, inactive], description: '公告状态' }
 *               priority: { type: integer, description: '优先级' }
 *     responses:
 *       201: { description: '创建成功' }
 *       400: { description: '请求参数错误' }
 *       401: { description: '未授权' }
 */
router.post('/announcements', requireAuth, validateAnnouncement, contentController.createAnnouncement);

/**
 * @swagger
 * /api/admin/content/announcements:
 *   get:
 *     summary: 获取公告列表
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *         description: '页码'
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, default: 10 }
 *         description: '每页数量'
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [active, inactive] }
 *         description: '公告状态筛选'
 *     responses:
 *       200: { description: '获取成功' }
 *       401: { description: '未授权' }
 */
router.get('/announcements', requireAuth, validateAnnouncementList, contentController.getAnnouncements);

/**
 * @swagger
 * /api/admin/content/announcements/{id}:
 *   get:
 *     summary: 获取公告详情
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: '公告ID'
 *     responses:
 *       200: { description: '获取成功' }
 *       401: { description: '未授权' }
 *       404: { description: '公告不存在' }
 */
router.get('/announcements/:id', requireAuth, validateAnnouncementId, contentController.getAnnouncementDetail);

/**
 * @swagger
 * /api/admin/content/announcements/{id}:
 *   put:
 *     summary: 更新公告
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: '公告ID'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string, description: '公告标题' }
 *               content: { type: string, description: '公告内容' }
 *               status: { type: string, enum: [active, inactive], description: '公告状态' }
 *               priority: { type: integer, description: '优先级' }
 *     responses:
 *       200: { description: '更新成功' }
 *       400: { description: '请求参数错误' }
 *       401: { description: '未授权' }
 *       404: { description: '公告不存在' }
 */
router.put('/announcements/:id', requireAuth, validateAnnouncementUpdate, contentController.updateAnnouncement);

/**
 * @swagger
 * /api/admin/content/announcements/{id}:
 *   delete:
 *     summary: 删除公告
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: '公告ID'
 *     responses:
 *       200: { description: '删除成功' }
 *       401: { description: '未授权' }
 *       404: { description: '公告不存在' }
 */
router.delete('/announcements/:id', requireAuth, validateAnnouncementId, contentController.deleteAnnouncement);

// 帮助文章管理路由
/**
 * @swagger
 * /api/admin/content/help-articles:
 *   post:
 *     summary: 创建帮助文章
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string, description: '文章标题' }
 *               content: { type: string, description: '文章内容' }
 *               category: { type: string, description: '文章分类' }
 *               status: { type: string, enum: [published, draft, archived], description: '文章状态' }
 *               sortOrder: { type: integer, description: '排序' }
 *     responses:
 *       201: { description: '创建成功' }
 *       400: { description: '请求参数错误' }
 *       401: { description: '未授权' }
 */
router.post('/help-articles', requireAuth, validateHelpArticle, contentController.createHelpArticle);

/**
 * @swagger
 * /api/admin/content/help-articles:
 *   get:
 *     summary: 获取帮助文章列表
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *         description: '页码'
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, default: 10 }
 *         description: '每页数量'
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *         description: '文章分类筛选'
 *       - in: query
 *         name: keyword
 *         schema: { type: string }
 *         description: '搜索关键词'
 *     responses:
 *       200: { description: '获取成功' }
 *       401: { description: '未授权' }
 */
router.get('/help-articles', requireAuth, validateHelpArticleList, contentController.getHelpArticles);

/**
 * @swagger
 * /api/admin/content/help-articles/{id}:
 *   get:
 *     summary: 获取帮助文章详情
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: '文章ID'
 *     responses:
 *       200: { description: '获取成功' }
 *       401: { description: '未授权' }
 *       404: { description: '文章不存在' }
 */
router.get('/help-articles/:id', requireAuth, validateHelpArticleId, contentController.getHelpArticleDetail);

/**
 * @swagger
 * /api/admin/content/help-articles/{id}:
 *   put:
 *     summary: 更新帮助文章
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: '文章ID'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string, description: '文章标题' }
 *               content: { type: string, description: '文章内容' }
 *               category: { type: string, description: '文章分类' }
 *               status: { type: string, enum: [published, draft, archived], description: '文章状态' }
 *               sortOrder: { type: integer, description: '排序' }
 *     responses:
 *       200: { description: '更新成功' }
 *       400: { description: '请求参数错误' }
 *       401: { description: '未授权' }
 *       404: { description: '文章不存在' }
 */
router.put('/help-articles/:id', requireAuth, validateHelpArticleUpdate, contentController.updateHelpArticle);

/**
 * @swagger
 * /api/admin/content/help-articles/{id}:
 *   delete:
 *     summary: 删除帮助文章
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: '文章ID'
 *     responses:
 *       200: { description: '删除成功' }
 *       401: { description: '未授权' }
 *       404: { description: '文章不存在' }
 */
router.delete('/help-articles/:id', requireAuth, validateHelpArticleId, contentController.deleteHelpArticle);

// 知识库文档管理路由
/**
 * @swagger
 * /api/admin/content/knowledge-docs:
 *   post:
 *     summary: 创建知识库文档
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string, description: '文档标题' }
 *               content: { type: string, description: '文档内容' }
 *               category: { type: string, description: '文档分类' }
 *               status: { type: string, enum: [published, draft, archived], description: '文档状态' }
 *               tags: { type: array, items: { type: string }, description: '标签列表' }
 *     responses:
 *       201: { description: '创建成功' }
 *       400: { description: '请求参数错误' }
 *       401: { description: '未授权' }
 */
router.post('/knowledge-docs', requireAuth, validateKnowledgeDoc, contentController.createKnowledgeDoc);

/**
 * @swagger
 * /api/admin/content/knowledge-docs:
 *   get:
 *     summary: 获取知识库文档列表
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *         description: '页码'
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, default: 10 }
 *         description: '每页数量'
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *         description: '文档分类筛选'
 *       - in: query
 *         name: tag
 *         schema: { type: string }
 *         description: '标签筛选'
 *     responses:
 *       200: { description: '获取成功' }
 *       401: { description: '未授权' }
 */
router.get('/knowledge-docs', requireAuth, validateKnowledgeDocList, contentController.getKnowledgeDocs);

/**
 * @swagger
 * /api/admin/content/knowledge-docs/{id}:
 *   get:
 *     summary: 获取知识库文档详情
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: '文档ID'
 *     responses:
 *       200: { description: '获取成功' }
 *       401: { description: '未授权' }
 *       404: { description: '文档不存在' }
 */
router.get('/knowledge-docs/:id', requireAuth, validateKnowledgeDocId, contentController.getKnowledgeDocDetail);

/**
 * @swagger
 * /api/admin/content/knowledge-docs/{id}:
 *   put:
 *     summary: 更新知识库文档
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: '文档ID'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string, description: '文档标题' }
 *               content: { type: string, description: '文档内容' }
 *               category: { type: string, description: '文档分类' }
 *               status: { type: string, enum: [published, draft, archived], description: '文档状态' }
 *               tags: { type: array, items: { type: string }, description: '标签列表' }
 *     responses:
 *       200: { description: '更新成功' }
 *       400: { description: '请求参数错误' }
 *       401: { description: '未授权' }
 *       404: { description: '文档不存在' }
 */
router.put('/knowledge-docs/:id', requireAuth, validateKnowledgeDocUpdate, contentController.updateKnowledgeDoc);

/**
 * @swagger
 * /api/admin/content/knowledge-docs/{id}:
 *   delete:
 *     summary: 删除知识库文档
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: '文档ID'
 *     responses:
 *       200: { description: '删除成功' }
 *       401: { description: '未授权' }
 *       404: { description: '文档不存在' }
 */
router.delete('/knowledge-docs/:id', requireAuth, validateKnowledgeDocId, contentController.deleteKnowledgeDoc);

/**
 * 注册内容管理路由
 * @param {Object} app - Express应用实例
 */
function register(app) {
  // 注册内容管理路由，前缀为/api/admin/content
  app.use('/api/admin/content', router);
}

module.exports = {
  register,
  router
};