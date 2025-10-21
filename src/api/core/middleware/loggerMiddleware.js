/**
 * 日志中间件模块
 * 负责记录请求、响应和错误信息
 */

const logger = require('../utils/logger');
const securityUtils = require('../security/securityUtils');
const config = require('../config/config');

class LoggerMiddleware {
  /**
   * 请求日志中间件
   * 记录所有HTTP请求的详细信息
   */
  requestLogger() {
    return (req, res, next) => {
      const startTime = Date.now();
      const requestId = this.generateRequestId(req);
      
      // 将请求ID添加到请求和响应对象
      req.requestId = requestId;
      res.setHeader('X-Request-ID', requestId);

      // 获取客户端IP
      const clientIp = this.getClientIp(req);
      
      // 获取请求体的安全副本（过滤敏感信息）
      const safeBody = this.getSafeRequestBody(req.body);
      
      // 获取请求参数的安全副本
      const safeQuery = this.getSafeQueryParams(req.query);

      // 记录请求开始
      logger.info('请求开始', {
        requestId,
        method: req.method,
        url: req.originalUrl,
        path: req.path,
        ip: clientIp,
        userAgent: req.headers['user-agent'],
        referer: req.headers.referer || req.headers.referrer,
        // 只在debug级别记录请求体和查询参数
        ...(logger.isDebugEnabled() && { query: safeQuery }),
        ...(logger.isDebugEnabled() && safeBody && { body: safeBody })
      });

      // 保存原始的end方法
      const originalEnd = res.end;
      
      // 重写end方法以记录响应信息
      res.end = function(...args) {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // 获取响应状态码和大小
        const statusCode = res.statusCode;
        const contentLength = res.getHeader('content-length') || 0;
        
        // 确定日志级别
        const logLevel = this.getLogLevel(statusCode);
        
        // 记录响应信息
        const responseLog = {
          requestId,
          method: req.method,
          url: req.originalUrl,
          statusCode,
          duration: `${duration}ms`,
          contentLength,
          ip: clientIp,
          // 记录用户信息（如果已认证）
          ...(req.user && { 
            userId: req.user.id,
            username: req.user.username,
            role: req.user.role
          })
        };
        
        // 根据状态码使用不同的日志级别
        if (logLevel === 'error') {
          logger.error('请求失败', responseLog);
        } else if (logLevel === 'warn') {
          logger.warn('请求完成（警告）', responseLog);
        } else {
          logger.info('请求完成', responseLog);
        }
        
        // 检查是否为慢请求
        const slowRequestThreshold = config.get('server.slowRequestThreshold', 1000);
        if (duration > slowRequestThreshold) {
          logger.warn('慢请求警告', {
            ...responseLog,
            threshold: `${slowRequestThreshold}ms`
          });
        }
        
        // 调用原始的end方法
        return originalEnd.apply(this, args);
      };

      next();
    };
  }

  /**
   * 错误日志中间件
   * 记录所有未处理的错误
   */
  errorLogger() {
    return (err, req, res, next) => {
      // 生成请求ID（如果不存在）
      const requestId = req.requestId || this.generateRequestId(req);
      
      // 获取客户端IP
      const clientIp = this.getClientIp(req);

      // 构建错误日志信息
      const errorLog = {
        requestId,
        method: req.method,
        url: req.originalUrl,
        ip: clientIp,
        statusCode: err.statusCode || 500,
        errorName: err.name,
        errorMessage: err.message,
        // 只在非生产环境记录堆栈
        ...(process.env.NODE_ENV !== 'production' && err.stack && { stack: err.stack }),
        // 记录错误代码（如果有）
        ...(err.code && { errorCode: err.code }),
        // 记录用户信息（如果已认证）
        ...(req.user && { 
          userId: req.user.id,
          username: req.user.username,
          role: req.user.role
        })
      };

      // 根据错误类型和状态码确定日志级别
      if (err.statusCode >= 500) {
        logger.error('服务器错误', errorLog);
      } else if (err.statusCode >= 400) {
        logger.warn('客户端错误', errorLog);
      } else {
        logger.error('未知错误', errorLog);
      }

      // 继续处理错误
      next(err);
    };
  }

  /**
   * 性能监控中间件
   * 记录请求处理的各个阶段的性能指标
   */
  performanceMonitor() {
    return (req, res, next) => {
      req.performance = {
        startTime: Date.now(),
        timings: {}
      };

      // 记录路由匹配完成时间
      const originalRoute = req._parsedUrl;
      const routeMatchTime = Date.now();
      req.performance.timings.routeMatch = routeMatchTime - req.performance.startTime;

      // 在响应结束时记录性能指标
      const originalEnd = res.end;
      res.end = function(...args) {
        // 记录总处理时间
        req.performance.timings.total = Date.now() - req.performance.startTime;
        
        // 只在debug级别记录性能指标
        if (logger.isDebugEnabled()) {
          logger.debug('请求性能指标', {
            requestId: req.requestId,
            method: req.method,
            url: req.originalUrl,
            timings: req.performance.timings
          });
        }
        
        // 将性能指标添加到响应头（如果启用）
        if (config.get('server.exposePerformanceMetrics', false)) {
          res.setHeader('X-Response-Time', req.performance.timings.total);
        }
        
        return originalEnd.apply(this, args);
      };

      next();
    };
  }

  /**
   * API访问日志中间件
   * 专门用于记录API访问信息
   */
  apiAccessLogger() {
    return (req, res, next) => {
      // 检查是否为API请求
      const apiPrefix = config.get('server.apiPrefix', '/api');
      if (!req.originalUrl.startsWith(apiPrefix)) {
        return next();
      }

      const startTime = Date.now();
      const requestId = req.requestId || this.generateRequestId(req);
      
      // 保存原始的end方法
      const originalEnd = res.end;
      
      res.end = function(...args) {
        const duration = Date.now() - startTime;
        
        logger.info('API访问', {
          requestId,
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration: `${duration}ms`,
          userId: req.user?.id,
          clientId: req.headers['x-client-id'],
          version: req.headers['x-api-version']
        });
        
        return originalEnd.apply(this, args);
      };

      next();
    };
  }

  /**
   * 安全日志中间件
   * 记录安全相关的事件
   */
  securityLogger() {
    return (req, res, next) => {
      // 检查是否为敏感操作
      const sensitivePaths = config.get('security.sensitivePaths', [
        '/auth/login',
        '/auth/logout',
        '/auth/reset-password',
        '/admin',
        '/users/profile'
      ]);

      const isSensitive = sensitivePaths.some(path => 
        req.originalUrl.includes(path)
      );

      if (isSensitive) {
        logger.info('安全操作尝试', {
          requestId: req.requestId || this.generateRequestId(req),
          method: req.method,
          path: req.path,
          ip: this.getClientIp(req),
          userId: req.user?.id,
          userAgent: req.headers['user-agent']
        });
      }

      next();
    };
  }

  /**
   * 根据状态码确定日志级别
   * @param {number} statusCode - HTTP状态码
   * @private
   */
  getLogLevel(statusCode) {
    if (statusCode >= 500) {
      return 'error';
    } else if (statusCode >= 400) {
      return 'warn';
    } else {
      return 'info';
    }
  }

  /**
   * 生成请求ID
   * @param {Object} req - 请求对象
   * @private
   */
  generateRequestId(req) {
    // 检查请求头中是否已有请求ID
    const existingId = req.headers['x-request-id'] || req.headers['x-correlation-id'];
    if (existingId) {
      return existingId;
    }
    
    // 生成新的请求ID
    return securityUtils.generateUUID();
  }

  /**
   * 获取客户端真实IP
   * @param {Object} req - 请求对象
   * @private
   */
  getClientIp(req) {
    // 检查代理头
    return req.headers['x-forwarded-for']?.split(',')[0].trim() ||
           req.headers['x-real-ip'] ||
           req.connection.remoteAddress ||
           req.socket.remoteAddress ||
           req.connection.socket.remoteAddress;
  }

  /**
   * 获取请求体的安全副本（过滤敏感信息）
   * @param {Object} body - 请求体
   * @private
   */
  getSafeRequestBody(body) {
    if (!body || typeof body !== 'object') {
      return body;
    }

    // 创建副本以避免修改原始数据
    const safeBody = { ...body };
    
    // 定义需要过滤的敏感字段
    const sensitiveFields = config.get('security.sensitiveFields', [
      'password',
      'passwordConfirm',
      'creditCard',
      'cvv',
      'socialSecurityNumber',
      'token',
      'secret',
      'apiKey',
      'authKey'
    ]);

    // 过滤敏感字段
    sensitiveFields.forEach(field => {
      if (safeBody.hasOwnProperty(field)) {
        safeBody[field] = '[REDACTED]';
      }
    });

    return safeBody;
  }

  /**
   * 获取查询参数的安全副本（过滤敏感信息）
   * @param {Object} query - 查询参数
   * @private
   */
  getSafeQueryParams(query) {
    if (!query || typeof query !== 'object') {
      return query;
    }

    // 创建副本以避免修改原始数据
    const safeQuery = { ...query };
    
    // 定义需要过滤的敏感查询参数
    const sensitiveQueryParams = config.get('security.sensitiveQueryParams', [
      'token',
      'key',
      'secret',
      'apiKey',
      'authToken'
    ]);

    // 过滤敏感查询参数
    sensitiveQueryParams.forEach(param => {
      if (safeQuery.hasOwnProperty(param)) {
        safeQuery[param] = '[REDACTED]';
      }
    });

    return safeQuery;
  }

  /**
   * 组合日志中间件
   * 返回所有日志中间件的组合
   */
  all() {
    return [
      this.requestLogger(),
      this.performanceMonitor(),
      this.apiAccessLogger(),
      this.securityLogger(),
      this.errorLogger()
    ];
  }
}

// 创建并导出中间件实例
const loggerMiddleware = new LoggerMiddleware();
module.exports = loggerMiddleware;

// 导出便捷的中间件函数
module.exports.requestLogger = () => loggerMiddleware.requestLogger();
module.exports.errorLogger = () => loggerMiddleware.errorLogger();
module.exports.performanceMonitor = () => loggerMiddleware.performanceMonitor();
module.exports.apiAccessLogger = () => loggerMiddleware.apiAccessLogger();
module.exports.securityLogger = () => loggerMiddleware.securityLogger();
module.exports.all = () => loggerMiddleware.all();