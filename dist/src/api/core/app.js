/**
 * 应用主模块
 * 负责初始化和配置Express应用
 */

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const { di } = require('./di/dependencyInjector');
const { errorHandler } = require('./exception/handlers/errorHandler');
const { responseFormatter } = require('./response/responseFormatter');
const logger = require('./utils/logger');
const config = require('./config/config');

class App {
  constructor() {
    this.app = express();
    this.port = config.get('server.port', 3000);
    this.env = config.get('server.env', 'development');
    this.server = null;
    
    // 初始化标志
    this.initialized = false;
  }

  /**
   * 初始化应用
   */
  async initialize() {
    try {
      // 设置安全相关的中间件
      this.setupSecurityMiddleware();
      
      // 设置基础中间件
      this.setupBaseMiddleware();
      
      // 设置请求日志中间件
      this.setupLoggingMiddleware();
      
      // 初始化依赖注入容器
      await di.initialize();
      
      // 注册路由
      this.registerRoutes();
      
      // 设置响应格式化中间件
      this.setupResponseFormatter();
      
      // 设置错误处理中间件
      this.setupErrorHandler();
      
      // 设置404处理
      this.setupNotFoundHandler();
      
      this.initialized = true;
      logger.info('应用初始化成功');
      
      return this.app;
    } catch (error) {
      logger.error('应用初始化失败:', { error });
      throw error;
    }
  }

  /**
   * 设置安全相关的中间件
   */
  setupSecurityMiddleware() {
    // 使用Helmet增强安全性
    this.app.use(helmet());
    
    // 配置CORS
    const corsOptions = config.get('server.cors', {});
    this.app.use(cors(corsOptions));
    
    // 设置安全头
    this.app.use((req, res, next) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      next();
    });
  }

  /**
   * 设置基础中间件
   */
  setupBaseMiddleware() {
    // 使用压缩中间件
    this.app.use(compression());
    
    // 解析JSON请求体
    this.app.use(express.json({ 
      limit: config.get('server.maxBodySize', '10mb') 
    }));
    
    // 解析URL编码的请求体
    this.app.use(express.urlencoded({ 
      extended: true,
      limit: config.get('server.maxBodySize', '10mb') 
    }));
    
    // 设置静态文件目录
    const staticDir = config.get('server.staticDir', 'public');
    if (staticDir) {
      this.app.use(express.static(staticDir));
    }
  }

  /**
   * 设置日志中间件
   */
  setupLoggingMiddleware() {
    // 使用logger.js中的requestLogger中间件
    this.app.use(logger.requestLogger);
    
    // 健康检查端点
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: config.get('app.version', '1.0.0')
      });
    });
  }

  /**
   * 注册路由
   */
  registerRoutes() {
    // 这里将在实际项目中实现
    // 目前只是一个占位符，后面需要根据业务需求添加路由
    
    // API路由前缀
    const apiPrefix = config.get('server.apiPrefix', '/api');
    
    // 创建API路由组
    const apiRouter = express.Router();
    
    // 示例路由 - 在实际项目中应该从单独的文件导入
    apiRouter.get('/status', (req, res) => {
      res.json({
        message: 'API is running',
        env: this.env,
        version: config.get('app.version', '1.0.0')
      });
    });
    
    // 注册API路由
    this.app.use(apiPrefix, apiRouter);
    
    logger.info(`路由注册完成，API前缀: ${apiPrefix}`);
  }

  /**
   * 设置响应格式化中间件
   */
  setupResponseFormatter() {
    // 使用responseFormatter中间件
    this.app.use(responseFormatter);
    
    // 为响应对象添加成功响应方法
    this.app.use((req, res, next) => {
      res.success = (data, message = '操作成功') => {
        res.json({
          success: true,
          message,
          data,
          timestamp: new Date().toISOString()
        });
      };
      
      res.error = (message, code = 500, data = null) => {
        res.status(code).json({
          success: false,
          message,
          data,
          timestamp: new Date().toISOString()
        });
      };
      
      next();
    });
  }

  /**
   * 设置错误处理中间件
   */
  setupErrorHandler() {
    // 使用全局错误处理中间件
    this.app.use(errorHandler);
  }

  /**
   * 设置404处理
   */
  setupNotFoundHandler() {
    this.app.use((req, res, next) => {
      const error = new Error(`路径不存在: ${req.originalUrl}`);
      error.statusCode = 404;
      next(error);
    });
  }

  /**
   * 启动服务器
   */
  async start() {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      this.server = this.app.listen(this.port, () => {
        logger.info(`服务器启动成功`);
        logger.info(`环境: ${this.env}`);
        logger.info(`端口: ${this.port}`);
        logger.info(`健康检查: http://localhost:${this.port}/health`);
        
        if (config.get('server.apiPrefix')) {
          logger.info(`API基础路径: http://localhost:${this.port}${config.get('server.apiPrefix')}`);
        }
      });
      
      // 处理服务器错误
      this.server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
          logger.error(`端口 ${this.port} 已被占用`);
        } else {
          logger.error('服务器启动失败:', { error });
        }
        process.exit(1);
      });
      
      // 处理进程终止信号
      this.setupGracefulShutdown();
      
      return this.server;
    } catch (error) {
      logger.error('服务器启动失败:', { error });
      throw error;
    }
  }

  /**
   * 关闭服务器
   */
  async stop() {
    try {
      if (this.server) {
        await new Promise((resolve, reject) => {
          this.server.close((error) => {
            if (error) {
              reject(error);
            } else {
              resolve();
            }
          });
        });
        
        logger.info('服务器已关闭');
      }
      
      // 关闭依赖注入容器
      await di.shutdown();
      
    } catch (error) {
      logger.error('服务器关闭失败:', { error });
      throw error;
    }
  }

  /**
   * 设置优雅关闭
   */
  setupGracefulShutdown() {
    // 处理SIGINT信号（Ctrl+C）
    process.on('SIGINT', async () => {
      logger.info('收到关闭信号，正在优雅关闭...');
      try {
        await this.stop();
        process.exit(0);
      } catch (error) {
        logger.error('优雅关闭失败:', { error });
        process.exit(1);
      }
    });
    
    // 处理SIGTERM信号（kill命令）
    process.on('SIGTERM', async () => {
      logger.info('收到终止信号，正在优雅关闭...');
      try {
        await this.stop();
        process.exit(0);
      } catch (error) {
        logger.error('优雅关闭失败:', { error });
        process.exit(1);
      }
    });
    
    // 处理未捕获的异常
    process.on('uncaughtException', (error) => {
      logger.error('未捕获的异常:', { error });
      // 可以选择在这里执行一些清理操作
    });
    
    // 处理未处理的Promise拒绝
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('未处理的Promise拒绝:', { reason, promise });
    });
  }

  /**
   * 获取Express应用实例
   */
  getApp() {
    return this.app;
  }

  /**
   * 获取服务器实例
   */
  getServer() {
    return this.server;
  }

  /**
   * 检查应用是否已初始化
   */
  isInitialized() {
    return this.initialized;
  }
}

// 创建应用实例
const appInstance = new App();

// 导出应用实例和启动函数
module.exports = {
  app: appInstance,
  start: () => appInstance.start(),
  stop: () => appInstance.stop(),
  getApp: () => appInstance.getApp()
};

// 作为默认导出
module.exports.default = appInstance;