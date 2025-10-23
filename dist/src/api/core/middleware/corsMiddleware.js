/**
 * 跨域中间件
 * 处理跨域资源共享(CORS)相关配置
 */

const cors = require('cors');
const config = require('../config/config');
const logger = require('../utils/logger');

class CorsMiddleware {
  /**
   * 创建CORS中间件
   * @param {Object} options - CORS选项
   */
  create(options = {}) {
    // 合并配置选项
    const corsOptions = this._mergeCorsOptions(options);
    
    // 记录CORS配置
    this._logCorsConfig(corsOptions);
    
    // 创建并返回CORS中间件
    return cors(corsOptions);
  }

  /**
   * 严格模式的CORS配置
   * 适用于生产环境
   */
  strict() {
    return this.create({
      credentials: true,
      optionsSuccessStatus: 200,
      preflightContinue: false
    });
  }

  /**
   * 宽松模式的CORS配置
   * 适用于开发环境
   */
  relaxed() {
    return this.create({
      origin: '*',
      methods: '*',
      allowedHeaders: '*',
      exposedHeaders: '*',
      credentials: true,
      maxAge: 86400
    });
  }

  /**
   * 自定义CORS配置
   * 根据环境自动选择配置模式
   */
  auto() {
    const env = process.env.NODE_ENV || 'development';
    
    if (env === 'production') {
      return this.strict();
    } else {
      return this.relaxed();
    }
  }

  /**
   * 基于域名的CORS配置
   * 只允许特定的域名访问
   * @param {Array|string} allowedOrigins - 允许的域名列表
   */
  domainBased(allowedOrigins) {
    const origins = Array.isArray(allowedOrigins) ? allowedOrigins : [allowedOrigins];
    
    return this.create({
      origin: (origin, callback) => {
        // 检查请求来源是否在允许列表中
        if (!origin || origins.includes(origin)) {
          callback(null, true);
        } else {
          const error = new Error(`不允许的跨域请求: ${origin}`);
          error.status = 403;
          callback(error);
        }
      }
    });
  }

  /**
   * API专用的CORS配置
   * 适用于API服务
   */
  api() {
    return this.create({
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-API-Key',
        'X-CSRF-Token'
      ],
      exposedHeaders: [
        'Content-Length',
        'X-Response-Time',
        'X-Request-ID'
      ],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      preflightContinue: false,
      optionsSuccessStatus: 204
    });
  }

  /**
   * 与凭据一起使用的CORS配置
   * 支持跨域Cookie和认证
   */
  withCredentials() {
    return this.create({
      credentials: true,
      origin: (origin, callback) => {
        // 允许所有来源，实际生产环境中应该限制特定域名
        callback(null, true);
      },
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-CSRF-Token'
      ],
      exposedHeaders: ['Set-Cookie']
    });
  }

  /**
   * 合并CORS配置选项
   * @param {Object} customOptions - 自定义选项
   * @private
   */
  _mergeCorsOptions(customOptions = {}) {
    // 从配置文件获取默认选项
    const defaultOptions = config.get('server.cors', {});
    
    // 合并选项
    const merged = { ...defaultOptions, ...customOptions };
    
    // 处理origin特殊情况
    if (merged.origin === '*' && merged.credentials === true) {
      logger.warn('CORS配置警告: 当credentials为true时，origin不能设置为*');
      // 删除credentials以避免冲突
      delete merged.credentials;
    }
    
    return merged;
  }

  /**
   * 记录CORS配置信息
   * @param {Object} options - CORS选项
   * @private
   */
  _logCorsConfig(options) {
    // 创建安全的配置副本（不记录敏感信息）
    const safeOptions = { ...options };
    
    // 如果origin是函数，只记录类型
    if (typeof safeOptions.origin === 'function') {
      safeOptions.origin = '[Function]';
    }
    
    logger.info('CORS中间件已配置', safeOptions);
  }

  /**
   * 预检请求处理器
   * 专门处理OPTIONS请求
   */
  preflightHandler() {
    return (req, res) => {
      // 设置允许的方法
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      
      // 设置允许的请求头
      res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      
      // 设置允许凭据
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      
      // 设置预检缓存时间（秒）
      res.setHeader('Access-Control-Max-Age', '86400');
      
      // 发送204响应
      res.status(204).end();
    };
  }

  /**
   * 安全增强的CORS配置
   * 添加额外的安全头
   */
  secure() {
    // 先应用标准CORS配置
    const corsMiddleware = this.strict();
    
    // 创建复合中间件
    return (req, res, next) => {
      // 应用标准CORS
      corsMiddleware(req, res, () => {
        // 添加额外的安全头
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Content-Security-Policy', "default-src 'self'");
        
        next();
      });
    };
  }

  /**
   * 获取当前环境的CORS配置
   */
  getCurrentConfig() {
    const env = process.env.NODE_ENV || 'development';
    const configOptions = config.get('server.cors', {});
    
    return {
      environment: env,
      options: configOptions
    };
  }
}

// 创建并导出中间件实例
const corsMiddleware = new CorsMiddleware();
module.exports = corsMiddleware;

// 导出便捷的中间件函数
module.exports.create = (options) => corsMiddleware.create(options);
module.exports.strict = () => corsMiddleware.strict();
module.exports.relaxed = () => corsMiddleware.relaxed();
module.exports.auto = () => corsMiddleware.auto();
module.exports.domainBased = (allowedOrigins) => corsMiddleware.domainBased(allowedOrigins);
module.exports.api = () => corsMiddleware.api();
module.exports.withCredentials = () => corsMiddleware.withCredentials();
module.exports.preflightHandler = () => corsMiddleware.preflightHandler();
module.exports.secure = () => corsMiddleware.secure();