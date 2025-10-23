/**
 * WeDraw 应用主入口文件
 * 整合所有模块并启动服务器
 */

// 立即输出日志，确认文件开始加载
console.log('========================================');
console.log('【DEBUG】app.js: 文件开始加载');
console.log('========================================');

// 加载环境变量
console.log('【DEBUG】app.js: 正在加载环境变量');
require('dotenv').config();
console.log('【DEBUG】app.js: 环境变量加载完成，PORT:', process.env.PORT);

// 导入核心依赖模块
console.log('【DEBUG】app.js: 开始导入核心依赖模块');
const express = require('express');
console.log('【DEBUG】app.js: 导入express完成');
const cors = require('cors');
console.log('【DEBUG】app.js: 导入cors完成');
const helmet = require('helmet');
console.log('【DEBUG】app.js: 导入helmet完成');
const bodyParser = require('body-parser');
console.log('【DEBUG】app.js: 导入bodyParser完成');
const morgan = require('morgan');
console.log('【DEBUG】app.js: 导入morgan完成');
const http = require('http');
console.log('【DEBUG】app.js: 导入http完成');

// 导入核心服务模块
console.log('【DEBUG】app.js: 开始导入核心服务模块');
const logger = require('./core/utils/logger');
console.log('【DEBUG】app.js: 导入logger完成');
const di = require('./core/di/container');
console.log('【DEBUG】app.js: 导入di完成');
const database = require('./core/data-access/database');
console.log('【DEBUG】app.js: 导入database完成');
const cacheManager = require('./core/cache/cacheManager');
console.log('【DEBUG】app.js: 导入cacheManager完成');
const errorHandler = require('./core/exception/handlers/errorHandler');
console.log('【DEBUG】app.js: 导入errorHandler完成');
const responseFormatter = require('./core/exception/response/responseFormatter');
console.log('【DEBUG】app.js: 导入responseFormatter完成');
const securityUtils = require('./core/security/securityUtils');
console.log('【DEBUG】app.js: 导入securityUtils完成');
const { setupSwagger } = require('./core/docs/swaggerConfig');
console.log('【DEBUG】app.js: 导入setupSwagger完成');
const WebSocketService = require('./core/services/websocketService');
console.log('【DEBUG】app.js: 导入WebSocketService完成');
const pushService = require('./core/services/pushService');
console.log('【DEBUG】app.js: 导入pushService完成');

// 导入API模块
const commonApi = require('./common-api');
const buyerApi = require('./buyer-api');
const sellerApi = require('./seller-api');
const adminApi = require('./admin-api');
const imApi = require('./im-api');

// 安全导入中间件
let authMiddleware = null;
try {
  console.log('【DEBUG】app.js: 尝试导入auth中间件');
  authMiddleware = require('./middleware/auth');
  console.log('【DEBUG】app.js: 成功导入auth中间件');
} catch (authError) {
  console.error('【严重警告】app.js: 导入auth中间件失败:', authError.message);
  // 创建一个空的中间件对象
  authMiddleware = {};
}

let middlewareResponseFormatter = null;
try {
  console.log('【DEBUG】app.js: 尝试导入responseFormatter中间件');
  middlewareResponseFormatter = require('./middleware/responseFormatter');
  console.log('【DEBUG】app.js: 成功导入responseFormatter中间件');
} catch (rfError) {
  console.error('【严重警告】app.js: 导入responseFormatter中间件失败:', rfError.message);
  middlewareResponseFormatter = { formatResponse: (req, res, next) => next() };
}

let middlewareLogger = null;
try {
  console.log('【DEBUG】app.js: 尝试导入logger中间件');
  middlewareLogger = require('./middleware/logger');
  console.log('【DEBUG】app.js: 成功导入logger中间件');
} catch (loggerError) {
  console.error('【严重警告】app.js: 导入logger中间件失败:', loggerError.message);
  middlewareLogger = { logRequest: (req, res, next) => next() };
}

let validators = null;
try {
  console.log('【DEBUG】app.js: 尝试导入validators');
  validators = require('./middleware/validators');
  console.log('【DEBUG】app.js: 成功导入validators');
} catch (validatorsError) {
  console.error('【严重警告】app.js: 导入validators失败:', validatorsError.message);
  validators = {};
}

// 导入数据库模型
console.log('【DEBUG】app.js: 正在导入models');
let customerServiceDb = {};
try {
  customerServiceDb = require('./models');
  console.log('【DEBUG】app.js: 导入models完成');
  console.log('【DEBUG】app.js: models内容:', Object.keys(customerServiceDb || {}));
  console.log('【DEBUG】app.js: sequelize实例存在:', customerServiceDb && !!customerServiceDb.sequelize);
} catch (modelsError) {
  console.error('【严重警告】app.js: 导入models失败:', modelsError.message);
  console.error('【严重警告】app.js: 导入models错误堆栈:', modelsError.stack);
  // 不抛出错误，而是创建一个空的数据库对象，让应用能够继续启动
  customerServiceDb = {
    sequelize: null,
    models: {}
  };
  console.log('【警告】app.js: 使用空数据库对象继续启动应用');
}

// 安全导入路由模块
let healthRoutes = null;
try {
  console.log('【DEBUG】app.js: 尝试导入healthRoutes');
  healthRoutes = require('./routes/health');
  console.log('【DEBUG】app.js: 成功导入healthRoutes');
} catch (healthError) {
  console.error('【严重警告】app.js: 导入healthRoutes失败:', healthError.message);
  healthRoutes = require('express').Router();
}

let infoRoutes = null;
try {
  console.log('【DEBUG】app.js: 尝试导入infoRoutes');
  infoRoutes = require('./routes/info');
  console.log('【DEBUG】app.js: 成功导入infoRoutes');
} catch (infoError) {
  console.error('【严重警告】app.js: 导入infoRoutes失败:', infoError.message);
  infoRoutes = require('express').Router();
}

let customerServiceRoutes = null;
try {
  console.log('【DEBUG】app.js: 尝试导入customerServiceRoutes');
  customerServiceRoutes = require('./routes');
  console.log('【DEBUG】app.js: 成功导入customerServiceRoutes');
} catch (csError) {
  console.error('【严重警告】app.js: 导入customerServiceRoutes失败:', csError.message);
  customerServiceRoutes = require('express').Router();
}

let FeedbackRoutes = null;
try {
  console.log('【DEBUG】app.js: 尝试导入FeedbackRoutes');
  FeedbackRoutes = require('./routes/FeedbackRoutes');
  console.log('【DEBUG】app.js: 成功导入FeedbackRoutes');
} catch (fbError) {
  console.error('【严重警告】app.js: 导入FeedbackRoutes失败:', fbError.message);
  FeedbackRoutes = require('express').Router();
}

let SchedulerRoutes = null;
try {
  console.log('【DEBUG】app.js: 尝试导入SchedulerRoutes');
  SchedulerRoutes = require('./routes/SchedulerRoutes');
  console.log('【DEBUG】app.js: 成功导入SchedulerRoutes');
} catch (schedError) {
  console.error('【严重警告】app.js: 导入SchedulerRoutes失败:', schedError.message);
  SchedulerRoutes = require('express').Router();
}

let WechatPlatformRoutes = null;
try {
  console.log('【DEBUG】app.js: 尝试导入WechatPlatformRoutes');
  WechatPlatformRoutes = require('./seller-api/wechat/routes/WechatPlatformRoutes');
  console.log('【DEBUG】app.js: 成功导入WechatPlatformRoutes');
} catch (wxError) {
  console.error('【严重警告】app.js: 导入WechatPlatformRoutes失败:', wxError.message);
  WechatPlatformRoutes = require('express').Router();
}

// 安全导入API文档模块
let setupWechatApiDocs = null;
try {
  console.log('【DEBUG】app.js: 尝试导入wechatApiDocs');
  const docsModule = require('./docs/wechatApiDocs');
  setupWechatApiDocs = docsModule.setupWechatApiDocs || function() {};
  console.log('【DEBUG】app.js: 成功导入wechatApiDocs');
} catch (docsError) {
  console.error('【严重警告】app.js: 导入wechatApiDocs失败:', docsError.message);
  setupWechatApiDocs = function() {};
}

// 安全导入后台服务模块
let messageConsumer = null;
try {
  console.log('【DEBUG】app.js: 尝试导入messageConsumer');
  messageConsumer = require('./message-consumer');
  console.log('【DEBUG】app.js: 成功导入messageConsumer');
} catch (mcError) {
  console.error('【严重警告】app.js: 导入messageConsumer失败:', mcError.message);
  messageConsumer = { start: function() { console.log('messageConsumer skipped'); } };
}

let scheduler = null;
try {
  console.log('【DEBUG】app.js: 尝试导入scheduler');
  scheduler = require('./scheduler');
  console.log('【DEBUG】app.js: 成功导入scheduler');
} catch (schedulerError) {
  console.error('【严重警告】app.js: 导入scheduler失败:', schedulerError.message);
  scheduler = { start: function() { console.log('scheduler skipped'); } };
}

/**
 * 初始化应用
 */
async function initialize() {
  console.log('========================================');
  console.log('【DEBUG】app.js: initialize函数开始执行');
  console.log('========================================');
  
  try {
    console.log('【DEBUG】app.js: 开始创建Express应用实例');
    logger.info('开始初始化WeDraw应用...');
    
    // 创建Express应用实例
    const app = express();
    console.log('【DEBUG】app.js: Express应用实例创建成功');
    
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
    logger.info('准备初始化WebSocket服务...');
    try {
      await initializeWebSocketService(httpServer);
      logger.info('WebSocket服务初始化函数执行完成');
    } catch (wsError) {
      logger.error('WebSocket服务初始化异常:', wsError);
      // 不抛出异常，允许服务继续运行
    }
    
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
    console.log('【DEBUG】app.js: 准备调用startHttpServer函数');
    const server = startHttpServer(httpServer);
    console.log('【DEBUG】app.js: 调用startHttpServer函数完成，返回server:', !!server ? '有效' : '无效');
    
    logger.info('WeDraw应用初始化完成！');
    console.log('【DEBUG】app.js: initialize函数即将返回server实例');
    
    return server;
    
  } catch (error) {
    console.error('【严重错误】app.js: initialize函数捕获到异常:', error);
    console.error('【严重错误】app.js: 异常堆栈:', error ? error.stack : '无堆栈');
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
    
    // 初始化客服服务（需要在数据库连接初始化后）
    try {
      const customerService = require('./im-api/customer-service/customerService');
      if (customerService.initialize) {
        await customerService.initialize();
        logger.info('客服服务初始化成功');
      }
    } catch (csError) {
      logger.error('客服服务初始化失败:', csError);
      // 不阻止主应用启动
    }
    
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
    app.use('/api/v1/scheduler', checkCsDatabaseConnection, SchedulerRoutes);
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
    logger.info('开始执行WebSocket服务初始化...');
    
    // 检查httpServer是否有效
    if (!httpServer) {
      logger.warn('HTTP服务器实例无效，跳过WebSocket服务初始化');
      return null;
    }
    
    // 启动WebSocket服务
    logger.info('调用WebSocketService.start()...');
    let wsService;
    try {
      wsService = WebSocketService.start(httpServer);
    } catch (startError) {
      logger.error('WebSocket服务启动失败:', startError.message);
      return null;
    }
    
    if (!wsService) {
      logger.warn('WebSocket服务实例创建失败，但允许应用继续运行');
      return null;
    }
    
    // 注册WebSocket事件处理
    logger.info('设置WebSocket事件处理...');
    try {
      setupWebSocketEvents(wsService);
    } catch (eventError) {
      logger.error('设置WebSocket事件处理失败:', eventError.message);
      // 继续执行，不阻止服务启动
    }
    
    // 注册到依赖注入容器
    logger.info('注册WebSocket服务到DI容器...');
    di.register('websocketService', () => wsService);
    
    logger.info('WebSocket服务初始化成功');
    return wsService;
  } catch (error) {
    logger.error('WebSocket服务初始化失败:', error.message);
    logger.error('WebSocket初始化错误堆栈:', error.stack);
    // 不抛出异常，允许服务继续运行
    return null;
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
  console.log('【DEBUG】app.js: 开始执行startHttpServer函数');
  const port = process.env.PORT || 3000;
  console.log(`【DEBUG】app.js: 服务器将在端口 ${port} 启动`);
  
  // 添加错误处理
  httpServer.on('error', (error) => {
    console.error('【严重错误】HTTP服务器启动失败:', error);
    logger.error('HTTP服务器启动失败:', error);
    if (error.code === 'EADDRINUSE') {
      console.error(`【严重错误】端口 ${port} 已被占用`);
      logger.error(`端口 ${port} 已被占用`);
    }
    // 不在这里退出，让主错误处理逻辑处理
  });
  
  try {
    httpServer.listen(port, () => {
      console.log(`【DEBUG】app.js: HTTP服务器启动成功，监听端口: ${port}`);
      logger.info(`HTTP服务器启动成功，监听端口: ${port}`);
      logger.info(`WebSocket服务运行在 ws://localhost:${port}/ws`);
      logger.info(`环境: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`API文档地址: http://localhost:${port}/api/docs`);
    });
  } catch (listenError) {
    console.error('【严重错误】监听端口时发生异常:', listenError);
    logger.error('监听端口时发生异常:', listenError);
  }
  
  // 返回HTTP服务器实例
  console.log('【DEBUG】app.js: startHttpServer函数返回httpServer');
  return httpServer;
  
  // 处理服务器关闭
  process.on('SIGINT', async () => {
    console.log('【DEBUG】app.js: 收到SIGINT信号');
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
  
  console.log('【DEBUG】app.js: startHttpServer函数执行完成，返回httpServer实例');
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

// 确保初始化函数正确导出
console.log('【DEBUG】app.js: 导出initialize函数');
if (typeof initialize !== 'function') {
  console.error('【严重错误】app.js: initialize不是一个函数!');
}

// 简单的导出方式，确保initialize函数被正确导出
module.exports = {
  initialize: initialize
};

// 验证导出是否成功
console.log('【DEBUG】app.js: 模块导出完成');