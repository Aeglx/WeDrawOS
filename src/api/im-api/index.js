/**
 * 即时通讯API模块
 */

const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const messageRoutes = require('./routes/messageRoutes');
const conversationRoutes = require('./routes/conversationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const authMiddleware = require('../core/middleware/authMiddleware');
const logger = require('../core/utils/logger');
const websocketService = require('./websocket/websocketService');
const customerService = require('./customer-service/customerService');
const notificationService = require('./notification/notificationService');
const pushService = require('./push/pushService');

// WebSocket服务器实例
let wss = null;

/**
 * 初始化WebSocket服务
 * @param {Object} server - HTTP服务器实例
 */
function initializeWebSocket(server) {
  // 创建WebSocket服务器
  wss = new WebSocket.Server({
    server,
    path: '/api/im/ws',
    verifyClient: (info, done) => {
      const origins = (process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
      const reqOrigin = info.origin || info.req.headers.origin;
      if (origins.length && reqOrigin && !origins.includes(reqOrigin)) {
        logger.warn('WebSocket连接拒绝：非法来源 ' + reqOrigin);
        return done(false, 403, 'Forbidden');
      }
      // 从请求头或URL中获取token进行验证
      const token = info.req.headers['sec-websocket-protocol'] || 
                   info.req.headers.authorization || 
                   new URL(info.req.url, `http://${info.req.headers.host}`).searchParams.get('token');
      
      // 简单的token验证，实际项目中应该使用更安全的验证方式
      if (!token) {
        logger.warn('WebSocket连接拒绝：缺少token');
        return done(false, 401, 'Unauthorized');
      }
      
      // 模拟验证token并提取用户信息
      try {
        // 这里应该调用authService验证token
        // 为了演示，我们直接从token中解析用户信息
        const mockUserInfo = { userId: 'user1', sessionId: null };
        info.req.userInfo = mockUserInfo;
        done(true);
      } catch (error) {
        logger.error('WebSocket token验证失败:', error);
        done(false, 401, 'Unauthorized');
      }
    }
  });

  // 监听连接事件
  wss.on('connection', (ws, req) => {
    const userInfo = req.userInfo;
    
    if (!userInfo || !userInfo.userId) {
      logger.error('WebSocket连接失败：缺少用户信息');
      ws.close(4001, 'Invalid user info');
      return;
    }

    logger.info(`用户 ${userInfo.userId} 连接到WebSocket`);
    
    // 处理连接错误
    ws.on('error', (error) => {
      logger.error(`WebSocket错误，用户 ${userInfo.userId}:`, error);
    });

    // 处理关闭事件
    ws.on('close', () => {
      logger.info(`用户 ${userInfo.userId} 断开WebSocket连接`);
      // websocketService会在handleMessage中处理关闭事件
    });

    // 初始化连接
    websocketService.connect(ws, userInfo);
  });

  // 监听WebSocket服务器错误
  wss.on('error', (error) => {
    logger.error('WebSocket服务器错误:', error);
  });

  logger.info('WebSocket服务器已启动');
}

/**
 * 注册即时通讯相关路由
 * @param {Object} app - Express应用实例
 */
function register(app) {
  // 创建路由
  const router = express.Router();
  
  // 应用认证中间件
  router.use(authMiddleware);
  
  // 注册消息路由
  messageRoutes.register(router);
  
  // 注册会话路由
  conversationRoutes.register(router);
  
  // 注册通知路由
  notificationRoutes.register(router);
  
  // 注册客服相关路由
  registerCustomerServiceRoutes(router);
  
  // 注册推送相关路由
  registerPushRoutes(router);
  
  // 注册WebSocket状态路由
  registerWebSocketStatusRoutes(router);
  
  // 挂载到主应用
  app.use('/api/im', router);
  
  // 获取或创建HTTP服务器
  let server = app.get('server');
  if (!server) {
    // 如果应用没有关联服务器，创建一个新的
    server = http.createServer(app);
    app.set('server', server);
  }
  
  // 初始化WebSocket
  initializeWebSocket(server);
  
  logger.info('即时通讯API路由已注册');
}

/**
 * 注册客服相关路由
 * @param {Object} router - Express路由实例
 */
function registerCustomerServiceRoutes(router) {
  const csRouter = express.Router();
  
  // 创建客服会话
  csRouter.post('/session', async (req, res) => {
    try {
      const result = await customerService.createSession({
        userId: req.user.id,
        name: req.user.name || '用户',
        questionType: req.body.questionType,
        initialQuestion: req.body.initialQuestion
      });
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // 获取客服会话列表
  csRouter.get('/sessions', async (req, res) => {
    try {
      const filters = {};
      
      // 如果是客服用户，获取分配给自己的会话
      if (req.user.role === 'customer_service') {
        filters.csUserId = req.user.id;
      } else {
        // 普通用户只能获取自己的会话
        filters.userId = req.user.id;
      }
      
      if (req.query.status) {
        filters.status = req.query.status;
      }
      
      const sessions = customerService.getSessions(filters);
      res.json({ success: true, data: sessions });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // 获取会话详情
  csRouter.get('/session/:sessionId', async (req, res) => {
    try {
      const session = customerService.getSession(req.params.sessionId);
      
      // 验证权限
      if (session.userId !== req.user.id && session.csUserId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, error: '无权访问该会话' });
      }
      
      res.json({ success: true, data: session });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // 发送客服消息
  csRouter.post('/session/:sessionId/message', async (req, res) => {
    try {
      const message = await customerService.sendMessage({
        sessionId: req.params.sessionId,
        senderId: req.user.id,
        content: req.body.content,
        contentType: req.body.contentType
      });
      res.json({ success: true, data: message });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // 关闭会话
  csRouter.post('/session/:sessionId/close', async (req, res) => {
    try {
      const session = await customerService.closeSession(
        req.params.sessionId,
        req.user.id,
        req.body.reason
      );
      res.json({ success: true, data: session });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // 客服状态更新（仅客服用户）
  csRouter.post('/status', async (req, res) => {
    try {
      if (req.user.role !== 'customer_service') {
        return res.status(403).json({ success: false, error: '权限不足' });
      }
      
      const status = await customerService.updateCustomerServiceStatus(
        req.user.id,
        req.body.online
      );
      res.json({ success: true, data: status });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // 挂载客服路由
  router.use('/customer-service', csRouter);
}

/**
 * 注册推送相关路由
 * @param {Object} router - Express路由实例
 */
function registerPushRoutes(router) {
  const pushRouter = express.Router();
  
  // 发送推送消息（管理员功能）
  pushRouter.post('/send', async (req, res) => {
    try {
      // 验证权限
      if (req.user.role !== 'admin' && req.user.role !== 'system_admin') {
        return res.status(403).json({ success: false, error: '权限不足' });
      }
      
      const result = await pushService.pushMessage(req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // 批量推送消息（管理员功能）
  pushRouter.post('/batch', async (req, res) => {
    try {
      // 验证权限
      if (req.user.role !== 'admin' && req.user.role !== 'system_admin') {
        return res.status(403).json({ success: false, error: '权限不足' });
      }
      
      const results = await pushService.batchPush(req.body.userIds, req.body.messageOptions);
      res.json({ success: true, data: results });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // 发送系统广播（管理员功能）
  pushRouter.post('/broadcast', async (req, res) => {
    try {
      // 验证权限
      if (req.user.role !== 'admin' && req.user.role !== 'system_admin') {
        return res.status(403).json({ success: false, error: '权限不足' });
      }
      
      const result = await pushService.sendBroadcast(req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // 挂载推送路由
  router.use('/push', pushRouter);
}

/**
 * 注册WebSocket状态路由
 * @param {Object} router - Express路由实例
 */
function registerWebSocketStatusRoutes(router) {
  const wsRouter = express.Router();
  
  // 获取在线状态
  wsRouter.get('/status', (req, res) => {
    res.json({
      success: true,
      data: {
        online: true,
        onlineUsers: websocketService.getOnlineUserCount(),
        timestamp: Date.now()
      }
    });
  });
  
  // 检查用户是否在线
  wsRouter.get('/user/:userId/online', (req, res) => {
    const isOnline = websocketService.isUserOnline(req.params.userId);
    res.json({
      success: true,
      data: { userId: req.params.userId, online: isOnline }
    });
  });
  
  // 挂载WebSocket状态路由
  router.use('/ws', wsRouter);
}

/**
 * 停止WebSocket服务
 */
function stop() {
  if (wss) {
    wss.close(() => {
      logger.info('WebSocket服务器已停止');
    });
  }
}

module.exports = {
  register,
  stop,
  // 导出服务实例，方便其他模块使用
  services: {
    websocket: websocketService,
    customerService: customerService,
    notification: notificationService,
    push: pushService
  }
};