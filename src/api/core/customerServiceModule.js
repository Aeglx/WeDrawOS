const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

// 导入客服系统相关模块
const customerServiceRoutes = require('../routes/customerServiceRoutes');
const customerServiceWebSocket = require('../controllers/customerServiceWebSocket');

// 导入服务层
const customerService = require('./services/customerService');
const pushService = require('./services/pushService');
const autoReplyService = require('./services/autoReplyService');
const customerServiceDb = require('./services/customerServiceDb');
const customerServiceStats = require('./services/customerServiceStats');

/**
 * 客服系统模块
 * 负责集成客服系统的所有功能，包括API路由和WebSocket连接管理
 */
class CustomerServiceModule {
  constructor(app) {
    this.app = app;
    this.router = express.Router();
    this.server = null;
    this.io = null;
  }

  /**
   * 初始化客服系统模块
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // 初始化数据库连接和服务
      await this.initializeServices();
      
      // 设置API路由
      this.setupRoutes();
      
      // 设置WebSocket
      this.setupWebSocket();
      
      console.log('客服系统模块初始化成功');
    } catch (error) {
      console.error('客服系统模块初始化失败:', error);
      throw error;
    }
  }

  /**
   * 初始化客服系统相关服务
   * @returns {Promise<void>}
   */
  async initializeServices() {
    try {
      // 初始化数据库服务
      await customerServiceDb.initialize();
      console.log('客服系统数据库服务初始化成功');
      
      // 初始化统计服务
      await customerServiceStats.initialize();
      console.log('客服系统统计服务初始化成功');
      
      // 初始化自动回复服务
      await autoReplyService.initialize();
      console.log('自动回复服务初始化成功');
      
      // 初始化推送服务（客服消息通知）
      pushService.setChannelStatus('customer_service', true);
      console.log('推送服务初始化成功');
      
      // 初始化客服服务
      await customerService.initialize();
      console.log('客服服务初始化成功');
    } catch (error) {
      console.error('服务初始化失败:', error);
      throw error;
    }
  }

  /**
   * 设置客服系统API路由
   */
  setupRoutes() {
    // 使用客服系统路由
    this.router.use('/customer-service', customerServiceRoutes);
    
    // 注册到主应用
    this.app.use('/api', this.router);
    
    console.log('客服系统API路由设置完成');
  }

  /**
   * 设置WebSocket连接
   */
  setupWebSocket() {
    // 获取或创建HTTP服务器
    if (!this.app.server) {
      this.server = http.createServer(this.app);
      this.app.server = this.server;
    } else {
      this.server = this.app.server;
    }
    
    // 初始化Socket.IO
    if (!this.io) {
      this.io = socketIo(this.server, {
        cors: {
          origin: '*', // 实际生产环境中应该设置具体的域名
          methods: ['GET', 'POST']
        },
        pingTimeout: 60000,
        pingInterval: 25000
      });
      
      // 设置WebSocket事件处理
      this.setupSocketEvents();
      
      console.log('WebSocket服务初始化完成');
    }
  }

  /**
   * 设置WebSocket事件处理
   */
  setupSocketEvents() {
    // 初始化WebSocket控制器
    const wsController = new customerServiceWebSocket(this.io);
    
    // 监听连接事件
    this.io.on('connection', (socket) => {
      console.log('新的WebSocket连接:', socket.id);
      
      // 初始化连接
      wsController.initializeConnection(socket);
      
      // 注册消息处理事件
      wsController.registerEventHandlers(socket);
      
      // 监听断开连接事件
      socket.on('disconnect', () => {
        console.log('WebSocket连接断开:', socket.id);
        wsController.handleDisconnect(socket);
      });
    });
  }

  /**
   * 启动客服系统模块
   * @returns {Promise<void>}
   */
  async start() {
    try {
      // 启动自动任务
      await this.startBackgroundTasks();
      
      console.log('客服系统模块启动成功');
    } catch (error) {
      console.error('客服系统模块启动失败:', error);
      throw error;
    }
  }

  /**
   * 启动后台任务
   * @returns {Promise<void>}
   */
  async startBackgroundTasks() {
    // 定时清理过期会话（每小时）
    setInterval(async () => {
      try {
        await customerServiceDb.cleanupExpiredSessions();
      } catch (error) {
        console.error('清理过期会话失败:', error);
      }
    }, 60 * 60 * 1000);
    
    // 定期更新统计数据缓存（每5分钟）
    setInterval(async () => {
      try {
        await customerServiceStats.updateCache();
      } catch (error) {
        console.error('更新统计缓存失败:', error);
      }
    }, 5 * 60 * 1000);
    
    console.log('后台任务启动成功');
  }

  /**
   * 停止客服系统模块
   * @returns {Promise<void>}
   */
  async stop() {
    try {
      // 关闭WebSocket连接
      if (this.io) {
        await this.io.close();
        console.log('WebSocket服务已关闭');
      }
      
      // 清理资源
      await customerServiceDb.cleanup();
      console.log('客服系统模块已停止');
    } catch (error) {
      console.error('客服系统模块停止失败:', error);
      throw error;
    }
  }

  /**
   * 获取客服系统状态
   * @returns {Object} 客服系统状态信息
   */
  getStatus() {
    return {
      initialized: !!this.io,
      activeConnections: this.io ? this.io.engine.clientsCount : 0,
      services: {
        database: customerServiceDb.isInitialized,
        statistics: customerServiceStats.isInitialized,
        autoReply: autoReplyService.isInitialized,
        push: pushService.getChannelStatus('customer_service'),
        customerService: customerService.isInitialized
      }
    };
  }
}

module.exports = CustomerServiceModule;