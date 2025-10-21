/**
 * WeDraw 应用主入口文件
 * 整合所有模块并启动服务器
 */

// 加载环境变量
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const morgan = require('morgan');

// 导入核心模块
const logger = require('./core/utils/logger');
const di = require('./core/di/container');
const database = require('./core/data-access/database');
const cacheManager = require('./core/cache/cacheManager');
const errorHandler = require('./core/exception/handlers/errorHandler');
const responseFormatter = require('./core/exception/response/responseFormatter');
const securityUtils = require('./core/security/securityUtils');
const { setupSwagger } = require('./core/docs/swaggerConfig');

// 导入API模块
const commonApi = require('./common-api');
const buyerApi = require('./buyer-api');
const sellerApi = require('./seller-api');
const adminApi = require('./admin-api');
const imApi = require('./im-api');

// 导入后台模块
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
    
    // 配置中间件
    configureMiddleware(app);
    
    // 初始化核心服务
  await initializeCoreServices();
  
  // 设置Swagger API文档
  setupSwagger(app);
  
  // 注册API路由
  registerRoutes(app);
    
    // 注册统一错误处理
    app.use(errorHandler);
    
    // 启动后台服务
    startBackgroundServices();
    
    // 启动HTTP服务器
    const server = startHttpServer(app);
    
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
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
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
  
  // 统一响应格式中间件
  app.use(responseFormatter.formatResponse);
}

/**
 * 初始化核心服务
 */
async function initializeCoreServices() {
  logger.info('初始化核心服务...');
  
  try {
    // 初始化数据库连接
    await database.initialize();
    
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
  
  // 注册各模块路由
  commonApi.register(app);
  buyerApi.register(app);
  sellerApi.register(app);
  adminApi.register(app);
  imApi.register(app);
  
  // 404处理
  app.use((req, res, next) => {
    res.status(404).json({
      success: false,
      message: '接口不存在',
      data: null
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
 * 启动HTTP服务器
 * @param {Object} app - Express应用实例
 * @returns {Object} HTTP服务器实例
 */
function startHttpServer(app) {
  const port = process.env.PORT || 3000;
  
  const server = app.listen(port, () => {
    logger.info(`HTTP服务器启动成功，监听端口: ${port}`);
    logger.info(`环境: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`API文档地址: http://localhost:${port}/api/docs`);
  });
  
  // 处理服务器关闭
  process.on('SIGINT', () => {
    logger.info('正在关闭服务器...');
    server.close(() => {
      logger.info('服务器已关闭');
      process.exit(0);
    });
  });
  
  return server;
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