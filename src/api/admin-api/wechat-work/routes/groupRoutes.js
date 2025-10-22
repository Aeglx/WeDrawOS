/**
 * 企业微信外部群管理路由
 * 配置企业微信外部群相关API接口路径和中间件
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer();
const { validate } = require('../../../middlewares/validation');
const { authenticate } = require('../../../middlewares/authentication');
const groupController = require('../controllers/groupController');
const groupValidation = require('../validations/groupValidation');

/**
 * @swagger
 * tags:
 *   name: 企业微信外部群管理
 *   description: 企业微信外部群的管理接口
 */

// 认证中间件
router.use(authenticate);

/**
 * @swagger
 * /api/admin-api/wechat-work/groups:
 *   get:
 *     summary: 获取群组列表
 *     tags: [企业微信外部群管理]
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
 *           default: 20
 *         description: 每页数量
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: 搜索关键词
 *     responses:
 *       200:
 *         description: 成功获取群组列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: object }
 *                 pagination: { type: object }
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */
router.get('/groups', 
  validate(groupValidation.getGroupsValidation),
  groupController.getGroupList
);

/**
 * @swagger
 * /api/admin-api/wechat-work/groups/{chatId}:
 *   get:
 *     summary: 获取群组详情
 *     tags: [企业微信外部群管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: 群聊ID
 *     responses:
 *       200:
 *         description: 成功获取群组详情
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: object }
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 *       404:
 *         description: 群组不存在
 *       500:
 *         description: 服务器错误
 */
router.get('/groups/:chatId',
  validate(groupValidation.getGroupDetailValidation),
  groupController.getGroupDetail
);

/**
 * @swagger
 * /api/admin-api/wechat-work/groups/{chatId}/members:
 *   get:
 *     summary: 获取群成员列表
 *     tags: [企业微信外部群管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: 群聊ID
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
 *           default: 50
 *         description: 每页数量
 *     responses:
 *       200:
 *         description: 成功获取群成员列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: array }
 *                 pagination: { type: object }
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */
router.get('/groups/:chatId/members',
  validate(groupValidation.getGroupMembersValidation),
  groupController.getGroupMembers
);

/**
 * @swagger
 * /api/admin-api/wechat-work/groups/search:
 *   get:
 *     summary: 搜索群组
 *     tags: [企业微信外部群管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: keyword
 *         required: true
 *         schema:
 *           type: string
 *         description: 搜索关键词
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
 *           default: 20
 *         description: 每页数量
 *     responses:
 *       200:
 *         description: 成功搜索群组
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: array }
 *                 pagination: { type: object }
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */
router.get('/groups/search',
  validate(groupValidation.searchGroupsValidation),
  groupController.searchGroups
);

/**
 * @swagger
 * /api/admin-api/wechat-work/groups/{chatId}/messages:
 *   post:
 *     summary: 发送群消息
 *     tags: [企业微信外部群管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: 群聊ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               msgtype: { type: string, enum: [text, image, file, video, link, miniprogram] }
 *               text: { type: object, properties: { content: { type: string } } }
 *               image: { type: object, properties: { media_id: { type: string } } }
 *               file: { type: object, properties: { media_id: { type: string } } }
 *               video: { type: object, properties: { media_id: { type: string }, title: { type: string }, description: { type: string } } }
 *               link: { type: object, properties: { title: { type: string }, description: { type: string }, url: { type: string }, picurl: { type: string } } }
 *               miniprogram: { type: object, properties: { title: { type: string }, thumb_media_id: { type: string }, appid: { type: string }, page: { type: string } } }
 *     responses:
 *       200:
 *         description: 成功发送消息
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: object, properties: { msgid: { type: string } } }
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */
router.post('/groups/:chatId/messages',
  validate(groupValidation.sendMessageValidation),
  groupController.sendGroupMessage
);

/**
 * @swagger
 * /api/admin-api/wechat-work/groups/{chatId}/messages/text:
 *   post:
 *     summary: 发送文本消息
 *     tags: [企业微信外部群管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: 群聊ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content: { type: string, minLength: 1, maxLength: 2000 }
 *     responses:
 *       200:
 *         description: 成功发送文本消息
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: object, properties: { msgid: { type: string } } }
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */
router.post('/groups/:chatId/messages/text',
  validate(groupValidation.sendTextMessageValidation),
  groupController.sendTextMessage
);

/**
 * @swagger
 * /api/admin-api/wechat-work/groups/{chatId}/messages/image:
 *   post:
 *     summary: 发送图片消息
 *     tags: [企业微信外部群管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: 群聊ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               mediaId: { type: string }
 *     responses:
 *       200:
 *         description: 成功发送图片消息
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: object, properties: { msgid: { type: string } } }
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */
router.post('/groups/:chatId/messages/image',
  validate(groupValidation.sendImageMessageValidation),
  groupController.sendImageMessage
);

/**
 * @swagger
 * /api/admin-api/wechat-work/groups/{chatId}/messages/file:
 *   post:
 *     summary: 发送文件消息
 *     tags: [企业微信外部群管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: 群聊ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               mediaId: { type: string }
 *     responses:
 *       200:
 *         description: 成功发送文件消息
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: object, properties: { msgid: { type: string } } }
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */
router.post('/groups/:chatId/messages/file',
  validate(groupValidation.sendFileMessageValidation),
  groupController.sendFileMessage
);

/**
 * @swagger
 * /api/admin-api/wechat-work/groups/{chatId}/messages/video:
 *   post:
 *     summary: 发送视频消息
 *     tags: [企业微信外部群管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: 群聊ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               mediaId: { type: string }
 *               title: { type: string, maxLength: 100 }
 *               description: { type: string, maxLength: 200 }
 *     responses:
 *       200:
 *         description: 成功发送视频消息
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: object, properties: { msgid: { type: string } } }
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */
router.post('/groups/:chatId/messages/video',
  validate(groupValidation.sendVideoMessageValidation),
  groupController.sendVideoMessage
);

/**
 * @swagger
 * /api/admin-api/wechat-work/groups/{chatId}/messages/link:
 *   post:
 *     summary: 发送链接消息
 *     tags: [企业微信外部群管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: 群聊ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string, minLength: 1, maxLength: 100 }
 *               description: { type: string, maxLength: 200 }
 *               url: { type: string, format: uri }
 *               picUrl: { type: string, format: uri }
 *     responses:
 *       200:
 *         description: 成功发送链接消息
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: object, properties: { msgid: { type: string } } }
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */
router.post('/groups/:chatId/messages/link',
  validate(groupValidation.sendLinkMessageValidation),
  groupController.sendLinkMessage
);

/**
 * @swagger
 * /api/admin-api/wechat-work/groups/batch-send:
 *   post:
 *     summary: 批量发送消息
 *     tags: [企业微信外部群管理]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               groups: { type: array, items: { type: object, properties: { chat_id: { type: string } } } }
 *               msgtype: { type: string, enum: [text, image, file, video, link, miniprogram] }
 *               text: { type: object, properties: { content: { type: string } } }
 *               image: { type: object, properties: { media_id: { type: string } } }
 *               file: { type: object, properties: { media_id: { type: string } } }
 *               video: { type: object, properties: { media_id: { type: string }, title: { type: string }, description: { type: string } } }
 *               link: { type: object, properties: { title: { type: string }, description: { type: string }, url: { type: string }, picurl: { type: string } } }
 *     responses:
 *       200:
 *         description: 成功批量发送消息
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: object, properties: { success: { type: array }, failed: { type: array } } }
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */
router.post('/groups/batch-send',
  validate(groupValidation.batchSendMessageValidation),
  groupController.batchSendGroupMessage
);

/**
 * @swagger
 * /api/admin-api/wechat-work/groups/{chatId}/chat-records:
 *   get:
 *     summary: 获取聊天记录
 *     tags: [企业微信外部群管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: 群聊ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: 记录数量
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *         description: 分页游标
 *       - in: query
 *         name: startTime
 *         schema:
 *           type: string
 *           format: date-time
 *         description: 开始时间
 *       - in: query
 *         name: endTime
 *         schema:
 *           type: string
 *           format: date-time
 *         description: 结束时间
 *     responses:
 *       200:
 *         description: 成功获取聊天记录
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: array }
 *                 pagination: { type: object }
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */
router.get('/groups/:chatId/chat-records',
  validate(groupValidation.getChatRecordsValidation),
  groupController.getGroupChatRecords
);

/**
 * @swagger
 * /api/admin-api/wechat-work/groups/{chatId}/remark:
 *   put:
 *     summary: 更新群组备注
 *     tags: [企业微信外部群管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: 群聊ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               remark: { type: string, maxLength: 500 }
 *     responses:
 *       200:
 *         description: 成功更新群组备注
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: object }
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 *       404:
 *         description: 群组不存在
 *       500:
 *         description: 服务器错误
 */
router.put('/groups/:chatId/remark',
  validate(groupValidation.updateGroupRemarkValidation),
  groupController.updateGroupRemark
);

/**
 * @swagger
 * /api/admin-api/wechat-work/groups/statistics:
 *   get:
 *     summary: 获取群组统计信息
 *     tags: [企业微信外部群管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startTime
 *         schema:
 *           type: string
 *           format: date-time
 *         description: 开始时间
 *       - in: query
 *         name: endTime
 *         schema:
 *           type: string
 *           format: date-time
 *         description: 结束时间
 *     responses:
 *       200:
 *         description: 成功获取群组统计信息
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: object }
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */
router.get('/groups/statistics',
  validate(groupValidation.getGroupStatisticsValidation),
  groupController.getGroupStatistics
);

/**
 * @swagger
 * /api/admin-api/wechat-work/groups/{chatId}/important:
 *   put:
 *     summary: 标记群组重要性
 *     tags: [企业微信外部群管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: 群聊ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isImportant: { type: boolean }
 *     responses:
 *       200:
 *         description: 成功标记群组重要性
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: object }
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 *       404:
 *         description: 群组不存在
 *       500:
 *         description: 服务器错误
 */
router.put('/groups/:chatId/important',
  validate(groupValidation.markGroupImportantValidation),
  groupController.markGroupImportant
);

/**
 * @swagger
 * /api/admin-api/wechat-work/groups/{chatId}/reminders:
 *   post:
 *     summary: 设置群提醒
 *     tags: [企业微信外部群管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: 群聊ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type: { type: string, enum: [text, link, image] }
 *               content: { type: string, minLength: 1, maxLength: 1000 }
 *               reminderTime: { type: string, format: date-time }
 *               isRecurring: { type: boolean }
 *               recurringRule: { type: object }
 *     responses:
 *       200:
 *         description: 成功设置群提醒
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: object }
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */
router.post('/groups/:chatId/reminders',
  validate(groupValidation.setGroupReminderValidation),
  groupController.setGroupReminder
);

/**
 * @swagger
 * /api/admin-api/wechat-work/groups/{chatId}/reminders:
 *   get:
 *     summary: 获取群提醒列表
 *     tags: [企业微信外部群管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: 群聊ID
 *     responses:
 *       200:
 *         description: 成功获取群提醒列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: array }
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */
router.get('/groups/:chatId/reminders',
  validate(groupValidation.getGroupRemindersValidation),
  groupController.getGroupReminders
);

/**
 * @swagger
 * /api/admin-api/wechat-work/reminders/{reminderId}:
 *   delete:
 *     summary: 删除群提醒
 *     tags: [企业微信外部群管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reminderId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 提醒ID
 *     responses:
 *       200:
 *         description: 成功删除群提醒
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: object }
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 *       404:
 *         description: 提醒不存在
 *       500:
 *         description: 服务器错误
 */
router.delete('/reminders/:reminderId',
  validate(groupValidation.deleteGroupReminderValidation),
  groupController.deleteGroupReminder
);

/**
 * @swagger
 * /api/admin-api/wechat-work/groups/batch-update-status:
 *   put:
 *     summary: 批量更新群组状态
 *     tags: [企业微信外部群管理]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               chatIds: { type: array, items: { type: string } }
 *               status: { type: string, enum: [active, inactive] }
 *     responses:
 *       200:
 *         description: 成功批量更新群组状态
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: object, properties: { updated: { type: integer } } }
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */
router.put('/groups/batch-update-status',
  validate(groupValidation.batchUpdateGroupStatusValidation),
  groupController.batchUpdateGroupStatus
);

/**
 * @swagger
 * /api/admin-api/wechat-work/media/upload/{type}:
 *   post:
 *     summary: 上传媒体文件
 *     tags: [企业微信外部群管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [image, file, video]
 *         description: 文件类型
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: 成功上传媒体文件
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: object, properties: { media_id: { type: string } } }
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */
router.post('/media/upload/:type',
  validate(groupValidation.uploadMediaValidation),
  upload.single('file'),
  groupController.uploadMediaFile
);

/**
 * @swagger
 * /api/admin-api/wechat-work/groups/export:
 *   get:
 *     summary: 导出群组列表
 *     tags: [企业微信外部群管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [excel, csv]
 *           default: excel
 *         description: 导出格式
 *     responses:
 *       200:
 *         description: 成功导出群组列表
 *         content:
 *           application/vnd.ms-excel: {}
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */
router.get('/groups/export',
  groupController.exportGroupList
);

/**
 * @swagger
 * /api/admin-api/wechat-work/groups/sync: 
 *   post:
 *     summary: 同步企业微信外部群列表
 *     tags: [企业微信外部群管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: forceUpdate
 *         schema:
 *           type: boolean
 *         description: 是否强制更新
 *     responses:
 *       200:
 *         description: 同步成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: object }
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */
router.post('/groups/sync',
  validate(groupValidation.syncGroupValidation),
  groupController.syncGroupList
);

/**
 * @swagger
 * /api/admin-api/wechat-work/groups/{chatId}/sync: 
 *   post:
 *     summary: 同步特定群组信息
 *     tags: [企业微信外部群管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: 群聊ID
 *     responses:
 *       200:
 *         description: 同步成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: object }
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */
router.post('/groups/:chatId/sync',
  validate(groupValidation.getGroupDetailValidation),
  groupController.syncGroupInfo
);

/**
 * @swagger
 * /api/admin-api/wechat-work/groups/owners: 
 *   get:
 *     summary: 获取所有群主列表
 *     tags: [企业微信外部群管理]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: array }
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */
router.get('/groups/owners',
  groupController.getGroupOwners
);

/**
 * @swagger
 * /api/admin-api/wechat-work/messages/statistics: 
 *   get:
 *     summary: 获取消息发送统计
 *     tags: [企业微信外部群管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startTime
 *         schema:
 *           type: string
 *           format: date-time
 *         description: 开始时间
 *       - in: query
 *         name: endTime
 *         schema:
 *           type: string
 *           format: date-time
 *         description: 结束时间
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: object }
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */
router.get('/messages/statistics',
  validate(groupValidation.getMessageStatisticsValidation),
  groupController.getMessageStatistics
);

/**
 * @swagger
 * /api/admin-api/wechat-work/messages/clean: 
 *   delete:
 *     summary: 清理过期消息记录
 *     tags: [企业微信外部群管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: 保留天数
 *     responses:
 *       200:
 *         description: 清理成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: object }
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */
router.delete('/messages/clean',
  validate(groupValidation.cleanExpiredMessagesValidation),
  groupController.cleanExpiredMessages
);

/**
 * @swagger
 * /api/admin-api/wechat-work/groups/activity-rank: 
 *   get:
 *     summary: 获取群活跃度排行
 *     tags: [企业微信外部群管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startTime
 *         schema:
 *           type: string
 *           format: date-time
 *         description: 开始时间
 *       - in: query
 *         name: endTime
 *         schema:
 *           type: string
 *           format: date-time
 *         description: 结束时间
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 返回数量
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: array }
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */
router.get('/groups/activity-rank',
  validate(groupValidation.getGroupActivityRankValidation),
  groupController.getGroupActivityRank
);

module.exports = router;