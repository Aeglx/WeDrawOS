/**
 * WeDraw 应用主入口文件
 * 整合所有模块并启动服务器
 */

// 加载环境变量
require('dotenv').config();

// 导入核心依赖模块
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const http = require('http');

// 导入核心服务模块
const logger = require('./core/utils/logger');
const di = require('./core/di/container');
const database = require('./core/data-access/database');
const cacheManager = require('./core/cache/cacheManager');
const errorHandler = require('./core/exception/handlers/errorHandler');
const responseFormatter = require('./core/exception/response/responseFormatter');
const securityUtils = require('./core/security/securityUtils');
const { setupSwagger } = require('./core/docs/swaggerConfig');
const WebSocketService = require('./core/services/websocketService');
const pushService = require('./core/services/pushService');

// 导入API模块
const commonApi = require('./common-api');
const buyerApi = require('./buyer-api');
const sellerApi = require('./seller-api');
const adminApi = require('./admin-api');
const imApi = require('./im-api');

// 导入中间件
const authMiddleware = require('./middleware/auth');
const middlewareResponseFormatter = require('./middleware/responseFormatter');
const middlewareLogger = require('./middleware/logger');
const validators = require('./middleware/validators');

// 导入数据库模型
const customerServiceDb = require('./models');

// 导入路由模块
const healthRoutes = require('./routes/health');
const infoRoutes = require('./routes/info');
const customerServiceRoutes = require('./routes');
const FeedbackRoutes = require('./routes/FeedbackRoutes');
const SchedulerRoutes = require('./routes/SchedulerRoutes');
const WechatPlatformRoutes = require('./seller-api/wechat/routes/WechatPlatformRoutes');

// 导入API文档模块
const { setupWechatApiDocs } = require('./docs/wechatApiDocs');

// 导入后台服务模块
const messageConsumer = require('./message-consumer');
const scheduler = require('./scheduler');

/**
 * 初始化应用
 */
async function initialize() {
  try {
    logger.info('开始初始化WeDraw应用...');
    
    // 创建Express应用实例
    const app = express();
    
    // 创建HTTP服务器
    const httpServer = http.createServer(app);
    
    // 配置中间件
    configureMiddleware(app);
    
    // 初始化核心服务
    await initializeCoreServices();
    
    // 设置Swagger API文档
    setupSwagger(app);
    
    // 注册API路由
    registerRoutes(app);
    
    // 初始化WebSocket服务
    await initializeWebSocketService(httpServer);
    
    // 初始化推送服务
    pushService.initialize();
    
    // 客服系统错误处理中间件
    try {
      if (logger.errorLogger) {
        app.use(logger.errorLogger);
      }
    } catch (e) {
      // 忽略错误
    }
    
    // 注册统一错误处理
    app.use(errorHandler);
    
    // 启动后台服务
    startBackgroundServices();
    
    // 启动HTTP服务器
    const server = startHttpServer(httpServer);
    
    logger.info('WeDraw应用初始化完成！');
    
    return server;
    
  } catch (error) {
    logger.error('应用初始化失败:', error);
    process.exit(1);
  }
}

/**
 * 配置Express中间件
 * @param {Object} app - Express应用实例
 */
function configureMiddleware(app) {
  logger.info('配置Express中间件...');
  
  // 安全相关中间件
  app.use(helmet());
  
  // 跨域配置
  app.use(cors({
    origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : process.env.CORS_ORIGIN || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  }));
  
  // 请求体解析
  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
  
  // 日志中间件
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  }));
  
  // 静态文件服务
  app.use('/uploads', express.static(process.env.UPLOAD_DIR || './uploads'));
  
  // 提供Swagger UI静态资源
  const swaggerUiAssetPath = require('swagger-ui-dist').getAbsoluteFSPath();
  app.use('/swagger-ui', express.static(swaggerUiAssetPath));
  
  // 客服系统专用中间件
  try {
    // 请求ID中间件
    if (logger.requestId) {
      app.use(logger.requestId);
    }
    // 自定义请求日志
    if (logger.requestLogger) {
      app.use(logger.requestLogger);
    }
  } catch (e) {
    // 忽略中间件错误
  }
  
  // 统一响应格式中间件
  app.use(responseFormatter.formatResponse || function(req, res, next) { next(); });
}

/**
 * 初始化核心服务
 */
async function initializeCoreServices() {
  logger.info('初始化核心服务...');
  
  try {
    // 初始化数据库连接
    await database.initialize();
    
    // 初始化客服系统数据库
    try {
      if (customerServiceDb && customerServiceDb.sequelize) {
        logger.info('初始化客服系统数据库...');
        await customerServiceDb.sequelize.authenticate();
        // 在开发环境自动同步模型
        if (process.env.NODE_ENV !== 'production') {
          await customerServiceDb.sequelize.sync({ alter: true });
        }
        logger.info('客服系统数据库初始化成功');
      }
    } catch (csDbError) {
      logger.error('客服系统数据库初始化失败:', csDbError);
      // 不阻止主应用启动
    }
    
    // 初始化Redis缓存
    await cacheManager.initialize();
    
    // 初始化依赖注入容器
    await di.initialize();
    
    // 注册核心服务到依赖注入容器
    di.register('logger', () => logger);
    di.register('database', () => database);
    di.register('cacheManager', () => cacheManager);
    di.register('responseFormatter', () => responseFormatter);
    di.register('securityUtils', () => securityUtils);
    di.register('pushService', () => pushService);
    
    logger.info('核心服务初始化成功');
  } catch (error) {
    logger.error('核心服务初始化失败:', error);
    throw error;
  }
}

/**
 * 注册API路由
 * @param {Object} app - Express应用实例
 */
function registerRoutes(app) {
  logger.info('注册API路由...');
  
  // 健康检查路由
  app.get('/health', (req, res) => {
    res.status(200).json({
      success: true,
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: {
          database: 'connected',
          redis: 'connected',
          websocket: 'available',
          push: 'available'
        }
      }
    });
  });
  
  // API信息端点
  app.get('/api/info', (req, res) => {
    res.status(200).json({
      success: true,
      data: {
        version: '1.0.0',
        name: 'WeDrawOS Customer Service API',
        timestamp: new Date().toISOString()
      }
    });
  });
  
  // 客服系统API路由
  try {
    logger.info('注册客服系统API路由...');
    // 客服系统API基础路径
    const csApiPath = '/api/v1';
    
    // 客服系统数据库连接检查中间件
    const checkCsDatabaseConnection = async (req, res, next) => {
      try {
        if (customerServiceDb && customerServiceDb.sequelize) {
          await customerServiceDb.sequelize.authenticate();
        }
        next();
      } catch (error) {
        return res.status(503).json({
          success: false,
          message: '客服系统数据库连接失败',
          data: null
        });
      }
    };
    
    // 注册客服系统路由
    if (typeof customerServiceRoutes === 'function') {
      app.use(csApiPath, checkCsDatabaseConnection, customerServiceRoutes);
    } else if (typeof customerServiceRoutes === 'object') {
      app.use(csApiPath, checkCsDatabaseConnection, customerServiceRoutes);
    }
    
    logger.info(`客服系统API路由已注册，基础路径: ${csApiPath}`);
  } catch (csRouteError) {
    logger.error('客服系统API路由注册失败:', csRouteError);
  }
  
  // 注册原有系统各模块路由
  commonApi.register(app);
  buyerApi.register(app);
  sellerApi.register(app);
  adminApi.register(app);
  imApi.register(app);
  
  // 注册反馈系统API路由
  if (typeof FeedbackRoutes !== 'undefined') {
    app.use('/api/v1/feedback', checkCsDatabaseConnection, FeedbackRoutes);
  }
  
  // 注册调度器监控API路由
    if (typeof SchedulerRoutes !== 'undefined') {
      app.use('/api/v1/scheduler', checkDatabaseConnection, SchedulerRoutes);
    }
    
    // 卖家企业微信平台接口路由
    if (typeof WechatPlatformRoutes !== 'undefined') {
      app.use('/api/v1/seller/wechat/platform', WechatPlatformRoutes);
    }
  
    // 设置微信开发文档风格的API文档
    setupWechatApiDocs(app);
  
  // 404处理
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: '接口不存在',
      data: {
        path: req.path
      }
    });
  });
}

/**
 * 启动后台服务
 */
function startBackgroundServices() {
  logger.info('启动后台服务...');
  
  // 启动消息消费者
  messageConsumer.start();
  
  // 初始化定时任务
  scheduler.initialize();
}

/**
 * 初始化WebSocket服务
 * @param {Object} httpServer - HTTP服务器实例
 */
async function initializeWebSocketService(httpServer) {
  try {
    logger.info('初始化WebSocket服务...');
    
    // 启动WebSocket服务
    const wsService = WebSocketService.start(httpServer);
    
    // 注册WebSocket事件处理
    setupWebSocketEvents(wsService);
    
    // 注册到依赖注入容器
    di.register('websocketService', () => wsService);
    
    logger.info('WebSocket服务初始化成功');
  } catch (error) {
    logger.error('WebSocket服务初始化失败:', error);
    throw error;
  }
}

/**
 * 设置WebSocket事件处理
 * @param {Object} wsService - WebSocket服务实例
 */
function setupWebSocketEvents(wsService) {
  // 用户连接事件
  wsService.on('user_connected', (data) => {
    logger.info(`用户 ${data.userId} 已连接`);
    // 处理用户上线逻辑
  });
  
  // 用户断开连接事件
  wsService.on('user_disconnected', (data) => {
    logger.info(`用户 ${data.userId} 已断开连接`);
    // 处理用户下线逻辑
  });
  
  // 消息事件处理
  wsService.on('message', async (message) => {
    try {
      logger.debug('收到WebSocket消息:', message.type);
      
      // 根据消息类型分发处理
      if (message.type === 'chat_message') {
        // 聊天消息处理
        const chatService = di.resolve('chatService');
        await chatService.handleMessage(message);
      } else if (message.type === 'notification_subscribe') {
        // 通知订阅处理
        pushService.handleSubscription(message);
      }
    } catch (error) {
      logger.error('处理WebSocket消息失败:', error);
    }
  });
}

/**
 * 启动HTTP服务器
 * @param {Object} httpServer - HTTP服务器实例
 * @returns {Object} HTTP服务器实例
 */
function startHttpServer(httpServer) {
  const port = process.env.PORT || 3000;
  
  httpServer.listen(port, () => {
    logger.info(`HTTP服务器启动成功，监听端口: ${port}`);
    logger.info(`WebSocket服务运行在 ws://localhost:${port}/ws`);
    logger.info(`环境: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`API文档地址: http://localhost:${port}/api/docs`);
  });
  
  // 处理服务器关闭
  process.on('SIGINT', async () => {
    logger.info('正在关闭服务器...');
    
    try {
      // 关闭WebSocket服务
      const wsService = di.has('websocketService') ? di.resolve('websocketService') : null;
      if (wsService && typeof wsService.shutdown === 'function') {
        await wsService.shutdown();
      }
      
      // 关闭数据库连接
      await database.disconnect();
      
      // 关闭服务器
      await new Promise(resolve => httpServer.close(resolve));
      
      logger.info('服务器已关闭');
      process.exit(0);
    } catch (error) {
      logger.error('关闭服务器时发生错误:', error);
      process.exit(1);
    }
  });
  
  return httpServer;
}

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  logger.error('未捕获的异常:', error);
  process.exit(1);
});

// 处理未处理的Promise拒绝
process.on('unhandledRejection', (reason, promise) => {
  logger.error('未处理的Promise拒绝:', reason);
});

// 如果直接运行此文件，则初始化应用
if (require.main === module) {
  initialize();
}

module.exports = { initialize };