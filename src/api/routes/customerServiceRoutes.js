/**
 * 客服系统API路由
 */

const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');
const customerService = require('../core/services/customerService');
const { logger } = require('../core/utils/logger');

// 确保中间件路径正确
function ensureAuthMiddleware() {
  try {
    return require('../middleware/auth');
  } catch (err) {
    logger.warn('Auth middleware not found, using mock middleware');
    return {
      auth: (req, res, next) => {
        // Mock认证，设置默认用户
        req.user = {
          id: 'mock_user_123',
          type: 'customer',
          permissions: ['customer']
        };
        next();
      }
    };
  }
}

function ensurePermissionMiddleware() {
  try {
    return require('../middleware/permission');
  } catch (err) {
    logger.warn('Permission middleware not found, using mock middleware');
    return {
      checkPermission: (permission) => (req, res, next) => {
        // Mock权限检查，允许所有请求
        next();
      }
    };
  }
}

const authMiddleware = ensureAuthMiddleware();
const permissionMiddleware = ensurePermissionMiddleware();

/**
 * @swagger
 * tags:
 *   name: CustomerService
 *   description: 客服系统API
 */

/**
 * 客服相关路由
 */
router.use('/customer-service', authMiddleware.auth);

/**
 * @swagger
 * /api/customer-service/sessions:
 *   get:
 *     summary: 获取会话列表
 *     tags: [CustomerService]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: 会话状态筛选
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
 *         description: 会话列表
 */
router.get('/customer-service/sessions', async (req, res) => {
  try {
    const { status, page = 1, pageSize = 10 } = req.query;
    const { id, type } = req.user;
    
    // 根据用户类型设置不同的过滤条件
    const filters = {
      status,
      ...(type === 'customer_service' ? { customerServiceId: id } : { customerId: id })
    };
    
    const sessions = await customerService.getSessions(filters, { page, pageSize });
    res.json(sessions);
  } catch (error) {
    logger.error('Failed to get sessions:', error);
    res.status(500).json({ error: '获取会话列表失败', details: error.message });
  }
});

/**
 * @swagger
 * /api/customer-service/sessions/{sessionId}:
 *   get:
 *     summary: 获取会话详情
 *     tags: [CustomerService]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: 会话ID
 *     responses:
 *       200:
 *         description: 会话详情
 *       404:
 *         description: 会话不存在
 */
router.get('/customer-service/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // 从数据库服务获取会话详情
    const db = customerService.db;
    const session = await db.getConversationById(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: '会话不存在' });
    }
    
    res.json(session);
  } catch (error) {
    logger.error(`Failed to get session ${req.params.sessionId}:`, error);
    res.status(500).json({ error: '获取会话详情失败', details: error.message });
  }
});

/**
 * @swagger
 * /api/customer-service/sessions/{sessionId}/messages:
 *   get:
 *     summary: 获取会话消息
 *     tags: [CustomerService]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: 会话ID
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
 *         description: 消息列表
 *       404:
 *         description: 会话不存在
 */
router.get('/customer-service/sessions/:sessionId/messages', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { page = 1, pageSize = 50 } = req.query;
    
    const messages = await customerService.getSessionMessages(sessionId, { page, pageSize });
    res.json({ data: messages });
  } catch (error) {
    logger.error(`Failed to get messages for session ${req.params.sessionId}:`, error);
    res.status(500).json({ error: '获取消息失败', details: error.message });
  }
});

/**
 * @swagger
 * /api/customer-service/sessions/{sessionId}/messages:
 *   post:
 *     summary: 发送消息
 *     tags: [CustomerService]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: 会话ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *               type:
 *                 type: string
 *                 default: text
 *     responses:
 *       200:
 *         description: 消息发送成功
 *       400:
 *         description: 请求参数错误
 */
router.post('/customer-service/sessions/:sessionId/messages', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { content, type = 'text' } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: '消息内容不能为空' });
    }
    
    const message = await customerService.sendMessage({
      conversationId: sessionId,
      senderId: req.user.id,
      content,
      type
    });
    
    res.json(message);
  } catch (error) {
    logger.error(`Failed to send message to session ${req.params.sessionId}:`, error);
    res.status(500).json({ error: '发送消息失败', details: error.message });
  }
});

/**
 * @swagger
 * /api/customer-service/sessions:
 *   post:
 *     summary: 创建新会话
 *     tags: [CustomerService]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               initialMessage:
 *                 type: string
 *                 description: 初始消息内容
 *     responses:
 *       200:
 *         description: 会话创建成功
 *       400:
 *         description: 请求参数错误
 */
router.post('/customer-service/sessions', async (req, res) => {
  try {
    const { initialMessage } = req.body;
    
    if (!initialMessage) {
      return res.status(400).json({ error: '初始消息不能为空' });
    }
    
    const session = await customerService.createSession({
      customerId: req.user.id,
      initialMessage
    });
    
    res.json(session);
  } catch (error) {
    logger.error('Failed to create session:', error);
    res.status(500).json({ error: '创建会话失败', details: error.message });
  }
});

/**
 * @swagger
 * /api/customer-service/sessions/{sessionId}/assign:
 *   post:
 *     summary: 分配会话给客服
 *     tags: [CustomerService]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: 会话ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customerServiceId:
 *                 type: string
 *                 description: 客服ID
 *     responses:
 *       200:
 *         description: 分配成功
 *       403:
 *         description: 没有权限
 */
router.post('/customer-service/sessions/:sessionId/assign', 
  permissionMiddleware.checkPermission(['customer_service', 'admin']),
  async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { customerServiceId } = req.body;
      
      if (!customerServiceId) {
        return res.status(400).json({ error: '客服ID不能为空' });
      }
      
      const success = await customerService.assignSessionToCustomerService(
        sessionId, 
        customerServiceId
      );
      
      if (success) {
        res.json({ success: true, message: '会话分配成功' });
      } else {
        res.status(400).json({ success: false, message: '会话分配失败' });
      }
    } catch (error) {
      logger.error(`Failed to assign session ${req.params.sessionId}:`, error);
      res.status(500).json({ error: '分配会话失败', details: error.message });
    }
  }
);

/**
 * @swagger
 * /api/customer-service/sessions/{sessionId}/transfer:
 *   post:
 *     summary: 转移会话给其他客服
 *     tags: [CustomerService]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: 会话ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newCustomerServiceId:
 *                 type: string
 *                 description: 新客服ID
 *     responses:
 *       200:
 *         description: 转移成功
 *       403:
 *         description: 没有权限
 */
router.post('/customer-service/sessions/:sessionId/transfer', 
  permissionMiddleware.checkPermission(['customer_service', 'admin']),
  async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { newCustomerServiceId } = req.body;
      
      if (!newCustomerServiceId) {
        return res.status(400).json({ error: '新客服ID不能为空' });
      }
      
      const success = await customerService.transferSession(
        sessionId, 
        newCustomerServiceId
      );
      
      if (success) {
        res.json({ success: true, message: '会话转移成功' });
      } else {
        res.status(400).json({ success: false, message: '会话转移失败' });
      }
    } catch (error) {
      logger.error(`Failed to transfer session ${req.params.sessionId}:`, error);
      res.status(500).json({ error: '转移会话失败', details: error.message });
    }
  }
);

/**
 * @swagger
 * /api/customer-service/sessions/{sessionId}/close:
 *   post:
 *     summary: 关闭会话
 *     tags: [CustomerService]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: 会话ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: 关闭原因
 *     responses:
 *       200:
 *         description: 会话关闭成功
 */
router.post('/customer-service/sessions/:sessionId/close', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { reason } = req.body;
    
    await customerService.closeSession(sessionId, reason);
    res.json({ success: true, message: '会话已关闭' });
  } catch (error) {
    logger.error(`Failed to close session ${req.params.sessionId}:`, error);
    res.status(500).json({ error: '关闭会话失败', details: error.message });
  }
});

/**
 * @swagger
 * /api/customer-service/sessions/{sessionId}/read-receipt:
 *   post:
 *     summary: 发送已读回执
 *     tags: [CustomerService]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: 会话ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               messageId:
 *                 type: string
 *                 description: 消息ID
 *     responses:
 *       200:
 *         description: 已读回执发送成功
 */
router.post('/customer-service/sessions/:sessionId/read-receipt', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { messageId } = req.body;
    
    await customerService.handleReadReceipt({
      conversationId: sessionId,
      userId: req.user.id,
      messageId
    });
    
    res.json({ success: true });
  } catch (error) {
    logger.error(`Failed to send read receipt for session ${req.params.sessionId}:`, error);
    res.status(500).json({ error: '发送已读回执失败', details: error.message });
  }
});

/**
 * 客服管理路由
 */
router.use('/customer-service/customer-service', 
  authMiddleware.auth,
  permissionMiddleware.checkPermission(['customer_service', 'admin'])
);

/**
 * @swagger
 * /api/customer-service/customer-service/status:
 *   put:
 *     summary: 更新客服状态
 *     tags: [CustomerService]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [online, offline, away, busy]
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: 状态更新成功
 */
router.put('/customer-service/customer-service/status', async (req, res) => {
  try {
    const { status, metadata } = req.body;
    const userId = req.user.id;
    
    await customerService.updateCustomerServiceStatus(userId, status, metadata);
    res.json({ success: true, message: '状态更新成功' });
  } catch (error) {
    logger.error(`Failed to update customer service status for user ${req.user.id}:`, error);
    res.status(500).json({ error: '更新状态失败', details: error.message });
  }
});

/**
 * @swagger
 * /api/customer-service/customer-service/online-list:
 *   get:
 *     summary: 获取在线客服列表
 *     tags: [CustomerService]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 在线客服列表
 */
router.get('/customer-service/customer-service/online-list', async (req, res) => {
  try {
    const onlineCS = customerService.getOnlineCustomerServices();
    res.json({ data: onlineCS });
  } catch (error) {
    logger.error('Failed to get online customer services:', error);
    res.status(500).json({ error: '获取在线客服列表失败', details: error.message });
  }
});

/**
 * @swagger
 * /api/customer-service/customer-service/transfer-all:
 *   post:
 *     summary: 转移所有会话
 *     tags: [CustomerService]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               toCustomerServiceId:
 *                 type: string
 *                 description: 目标客服ID
 *     responses:
 *       200:
 *         description: 转移结果
 *       403:
 *         description: 没有权限
 */
router.post('/customer-service/customer-service/transfer-all', 
  permissionMiddleware.checkPermission(['admin']),
  async (req, res) => {
    try {
      const { toCustomerServiceId } = req.body;
      
      if (!toCustomerServiceId) {
        return res.status(400).json({ error: '目标客服ID不能为空' });
      }
      
      const result = await customerService.transferAllSessions(
        req.user.id, 
        toCustomerServiceId
      );
      
      res.json(result);
    } catch (error) {
      logger.error(`Failed to transfer all sessions from ${req.user.id}:`, error);
      res.status(500).json({ error: '转移会话失败', details: error.message });
    }
  }
);

/**
 * 统计相关路由
 */
router.use('/customer-service/statistics', authMiddleware.auth);

/**
 * @swagger
 * /api/customer-service/statistics/overview:
 *   get:
 *     summary: 获取系统概览统计
 *     tags: [CustomerService]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startTime
 *         schema:
 *           type: string
 *         description: 开始时间
 *       - in: query
 *         name: endTime
 *         schema:
 *           type: string
 *         description: 结束时间
 *     responses:
 *       200:
 *         description: 统计数据
 *       403:
 *         description: 没有权限
 */
router.get('/customer-service/statistics/overview', 
  permissionMiddleware.checkPermission(['customer_service', 'admin']),
  async (req, res) => {
    try {
      const { startTime, endTime } = req.query;
      
      const statistics = await customerService.getStatistics({
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined
      });
      
      res.json(statistics);
    } catch (error) {
      logger.error('Failed to get statistics:', error);
      res.status(500).json({ error: '获取统计数据失败', details: error.message });
    }
  }
);

/**
 * @swagger
 * /api/customer-service/statistics/personal:
 *   get:
 *     summary: 获取个人统计
 *     tags: [CustomerService]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startTime
 *         schema:
 *           type: string
 *         description: 开始时间
 *       - in: query
 *         name: endTime
 *         schema:
 *           type: string
 *         description: 结束时间
 *     responses:
 *       200:
 *         description: 个人统计数据
 */
router.get('/customer-service/statistics/personal', 
  permissionMiddleware.checkPermission(['customer_service']),
  async (req, res) => {
    try {
      const { startTime, endTime } = req.query;
      
      const statistics = await customerService.getCustomerServiceStatistics(
        req.user.id,
        {
          startTime: startTime ? new Date(startTime) : undefined,
          endTime: endTime ? new Date(endTime) : undefined
        }
      );
      
      res.json(statistics);
    } catch (error) {
      logger.error(`Failed to get personal statistics for user ${req.user.id}:`, error);
      res.status(500).json({ error: '获取个人统计数据失败', details: error.message });
    }
  }
);

/**
 * @swagger
 * /api/customer-service/statistics/reports/{customerServiceId}:
 *   get:
 *     summary: 获取客服工作报表
 *     tags: [CustomerService]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerServiceId
 *         required: true
 *         schema:
 *           type: string
 *         description: 客服ID
 *       - in: query
 *         name: startTime
 *         schema:
 *           type: string
 *         description: 开始时间
 *       - in: query
 *         name: endTime
 *         schema:
 *           type: string
 *         description: 结束时间
 *     responses:
 *       200:
 *         description: 工作报表
 *       403:
 *         description: 没有权限
 */
router.get('/customer-service/statistics/reports/:customerServiceId', 
  permissionMiddleware.checkPermission(['admin']),
  async (req, res) => {
    try {
      const { customerServiceId } = req.params;
      const { startTime, endTime } = req.query;
      
      const report = await customerService.generateWorkReport(
        customerServiceId,
        {
          startTime: startTime ? new Date(startTime) : undefined,
          endTime: endTime ? new Date(endTime) : undefined
        }
      );
      
      res.json(report);
    } catch (error) {
      logger.error(`Failed to generate work report for CS ${req.params.customerServiceId}:`, error);
      res.status(500).json({ error: '生成工作报表失败', details: error.message });
    }
  }
);

/**
 * @swagger
 * /api/customer-service/statistics/trends:
 *   get:
 *     summary: 获取会话趋势数据
 *     tags: [CustomerService]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: interval
 *         schema:
 *           type: string
 *           enum: [hour, day, week, month]
 *           default: day
 *         description: 时间间隔
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 7
 *         description: 数据点数量
 *     responses:
 *       200:
 *         description: 趋势数据
 *       403:
 *         description: 没有权限
 */
router.get('/customer-service/statistics/trends', 
  permissionMiddleware.checkPermission(['customer_service', 'admin']),
  async (req, res) => {
    try {
      const { interval = 'day', limit = 7 } = req.query;
      
      const trends = await customerService.getConversationTrends(interval, parseInt(limit, 10));
      res.json({ data: trends });
    } catch (error) {
      logger.error('Failed to get conversation trends:', error);
      res.status(500).json({ error: '获取趋势数据失败', details: error.message });
    }
  }
);

/**
 * 自动回复管理路由
 */
router.use('/customer-service/auto-replies', 
  authMiddleware.auth,
  permissionMiddleware.checkPermission(['customer_service', 'admin'])
);

/**
 * @swagger
 * /api/customer-service/auto-replies:
 *   post:
 *     summary: 添加自动回复规则
 *     tags: [CustomerService]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               keywords:
 *                 type: array
 *                 items:
 *                   type: string
 *               reply:
 *                 type: string
 *               priority:
 *                 type: integer
 *                 default: 0
 *     responses:
 *       200:
 *         description: 规则添加成功
 */
router.post('/customer-service/auto-replies', async (req, res) => {
  try {
    const { name, keywords, reply, priority = 0 } = req.body;
    
    const rule = customerService.addAutoReplyRule({
      name,
      keywords,
      reply,
      priority
    });
    
    res.json({ success: true, rule });
  } catch (error) {
    logger.error('Failed to add auto reply rule:', error);
    res.status(500).json({ error: '添加自动回复规则失败', details: error.message });
  }
});

module.exports = router;