/**
 * 企业微信平台接口路由
 * 为卖家提供安全的企业微信功能API访问
 * 所有接口都需要权限验证和安全控制
 */

const express = require('express');
const router = express.Router();
const WechatPlatformController = require('../controllers/WechatPlatformController');
const { authorize } = require('../../../middleware/authorize');
const wechatPermissionGuard = require('../../../middleware/wechatPermissionGuard');
const logger = require('../../../core/utils/logger');

// 权限验证和日志中间件
const logAccess = (req, res, next) => {
  logger.info(`卖家访问企业微信平台接口: ${req.path}，卖家ID: ${req.user?.id}`);
  next();
};

// 验证权限并记录访问
router.use(authorize('SELLER'), logAccess);

/**
 * @swagger
 * tags:
 *   name: 卖家企业微信平台接口
 *   description: 为卖家提供的企业微信和公众号功能访问接口
 */

/**
 * @swagger
 * /api/v1/seller/wechat/platform/message: 
 *   post:
 *     summary: 发送企业微信或公众号消息
 *     description: 卖家通过平台发送预设模板的消息，不能自定义所有内容
 *     tags: [卖家企业微信平台接口]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               templateId: 
 *                 type: string
 *                 description: 消息模板ID
 *               receiverType: 
 *                 type: string
 *                 enum: [user, group, all]
 *                 description: 接收者类型
 *               receiverIds: 
 *                 type: array
 *                 items: 
 *                   type: string
 *                 description: 接收者ID列表
 *               params: 
 *                 type: object
 *                 description: 消息参数
 *               type: 
 *                 type: string
 *                 enum: [template, text, image]
 *                 default: template
 *                 description: 消息类型
 *     responses:
 *       200: 
 *         description: 消息发送成功
 *       400: 
 *         description: 参数错误
 *       403: 
 *         description: 权限不足
 */
router.post('/message', wechatPermissionGuard, WechatPlatformController.sendMessage);

/**
 * @swagger
 * /api/v1/seller/wechat/platform/template: 
 *   post:
 *     summary: 使用预设模板发送消息
 *     description: 卖家可以选择平台提供的模板，填入参数后发送
 *     tags: [卖家企业微信平台接口]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               templateKey: 
 *                 type: string
 *                 description: 模板标识
 *               receiverId: 
 *                 type: string
 *                 description: 接收者ID
 *               data: 
 *                 type: object
 *                 description: 模板参数数据
 *     responses:
 *       200: 
 *         description: 模板消息发送成功
 *       400: 
 *         description: 参数错误
 *       403: 
 *         description: 权限不足或没有模板使用权限
 */
router.post('/template', wechatPermissionGuard, WechatPlatformController.useTemplate);

/**
 * @swagger
 * /api/v1/seller/wechat/platform/menu/preview: 
 *   post:
 *     summary: 预览自定义菜单效果
 *     description: 卖家可以预览菜单效果，但不能直接修改生产环境菜单
 *     tags: [卖家企业微信平台接口]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               menuConfig: 
 *                 type: object
 *                 description: 菜单配置
 *     responses:
 *       200: 
 *         description: 菜单预览生成成功
 *       400: 
 *         description: 参数错误
 *       403: 
 *         description: 权限不足
 */
router.post('/menu/preview', wechatPermissionGuard, WechatPlatformController.previewMenu);

/**
 * @swagger
 * /api/v1/seller/wechat/platform/qrcode: 
 *   post:
 *     summary: 生成推广二维码
 *     description: 卖家可以生成带参数的二维码用于推广
 *     tags: [卖家企业微信平台接口]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               scene: 
 *                 type: string
 *                 description: 场景值
 *               expireSeconds: 
 *                 type: number
 *                 default: 604800
 *                 description: 过期时间（秒）
 *               size: 
 *                 type: number
 *                 default: 430
 *                 description: 二维码大小
 *     responses:
 *       200: 
 *         description: 二维码生成成功
 *       400: 
 *         description: 参数错误
 *       403: 
 *         description: 权限不足
 */
router.post('/qrcode', wechatPermissionGuard, WechatPlatformController.generateQrcode);

/**
 * @swagger
 * /api/v1/seller/wechat/platform/media: 
 *   post:
 *     summary: 上传素材
 *     description: 卖家可以上传图片、视频等素材，但有大小和类型限制
 *     tags: [卖家企业微信平台接口]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type: 
 *                 type: string
 *                 enum: [image, voice, video, file]
 *                 description: 媒体类型
 *               media: 
 *                 type: string
 *                 format: binary
 *                 description: 媒体文件（Base64编码或文件流）
 *     responses:
 *       200: 
 *         description: 媒体上传成功
 *       400: 
 *         description: 参数错误
 *       403: 
 *         description: 权限不足
 */
router.post('/media', wechatPermissionGuard, WechatPlatformController.uploadMedia);

/**
 * @swagger
 * /api/v1/seller/wechat/platform/analytics: 
 *   get:
 *     summary: 查看分析数据
 *     description: 卖家可以查看消息发送和用户互动的统计数据
 *     tags: [卖家企业微信平台接口]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema: 
 *           type: string
 *         description: 开始日期
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema: 
 *           type: string
 *         description: 结束日期
 *       - in: query
 *         name: type
 *         default: message
 *         schema: 
 *           type: string
 *         description: 数据类型
 *     responses:
 *       200: 
 *         description: 获取分析数据成功
 *       400: 
 *         description: 参数错误
 *       403: 
 *         description: 权限不足
 */
router.get('/analytics', wechatPermissionGuard, WechatPlatformController.getAnalyticsSummary);

/**
 * @swagger
 * /api/v1/seller/wechat/platform/resources: 
 *   get:
 *     summary: 获取资源使用情况
 *     description: 卖家可以查看企业微信相关功能的资源使用情况
 *     tags: [卖家企业微信平台接口]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: 
 *         description: 获取资源使用情况成功
 *       403: 
 *         description: 权限不足
 */
router.get('/resources', wechatPermissionGuard, WechatPlatformController.getResourceUsage);

module.exports = router;