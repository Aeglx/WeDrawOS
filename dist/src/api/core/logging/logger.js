/**
 * 日志管理模块
 * 提供统一的日志记录功能，支持多级别日志和不同输出目标
 */
const winston = require('winston');
const { format, createLogger, transports } = winston;
const path = require('path');
const fs = require('fs');

// 导入配置
const config = require('../config/config');

/**
 * 日志格式化程序
 * 自定义日志输出格式
 */
const customFormat = format.printf(({ level, message, timestamp, ...metadata }) => {
  const logLevel = level.toUpperCase();
  let logMessage = `${timestamp} [${logLevel}] ${message}`;
  
  // 添加元数据
  if (Object.keys(metadata).length > 0) {
    logMessage += ' ' + JSON.stringify(metadata);
  }
  
  return logMessage;
});

/**
 * 敏感信息过滤器
 * 移除日志中的敏感信息
 */
const sensitiveInfoFilter = format((info) => {
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'creditCard', 'ssn'];
  
  // 过滤消息中的敏感信息
  if (typeof info.message === 'string') {
    sensitiveFields.forEach(field => {
      const regex = new RegExp(`${field}["']?\s*:\s*["']?([^"',}]+)["']?`, 'gi');
      info.message = info.message.replace(regex, `${field}: [FILTERED]`);
    });
  }
  
  // 过滤元数据中的敏感信息
  if (typeof info === 'object') {
    sensitiveFields.forEach(field => {
      if (info[field]) {
        info[field] = '[FILTERED]';
      }
    });
  }
  
  return info;
});

/**
 * Logger类
 * 提供应用程序的日志记录功能
 */
class Logger {
  constructor() {
    this._logger = null;
    this._initializeLogger();
  }

  /**
   * 初始化日志记录器
   * @private
   */
  _initializeLogger() {
    const logLevel = config.get('logging.level', 'info');
    const logFormat = config.get('logging.format', 'json');
    const logFile = config.get('logging.file', path.join(process.cwd(), 'logs/app.log'));
    const maxFileSize = config.get('logging.maxFileSize', 5242880); // 5MB
    const maxFiles = config.get('logging.maxFiles', 5);
    
    // 确保日志目录存在
    const logDir = path.dirname(logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const formatters = [
      sensitiveInfoFilter(),
      format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss.SSS'
      })
    ];

    // 根据配置选择日志格式
    if (logFormat === 'json') {
      formatters.push(format.json());
    } else {
      formatters.push(format.colorize());
      formatters.push(customFormat);
    }

    // 创建传输器数组
    const loggerTransports = [
      // 控制台输出
      new transports.Console({
        level: logLevel,
        format: format.combine(...formatters)
      }),
      
      // 文件输出（所有级别）
      new transports.File({
        filename: logFile,
        level: logLevel,
        format: format.combine(...formatters),
        maxsize: maxFileSize,
        maxFiles: maxFiles,
        tailable: true,
        handleExceptions: true,
        json: logFormat === 'json'
      })
    ];

    // 错误日志单独输出
    const errorLogFile = path.join(logDir, 'error.log');
    loggerTransports.push(
      new transports.File({
        filename: errorLogFile,
        level: 'error',
        format: format.combine(...formatters),
        maxsize: maxFileSize,
        maxFiles: maxFiles,
        tailable: true,
        handleExceptions: true,
        json: logFormat === 'json'
      })
    );

    // 创建日志记录器
    this._logger = createLogger({
      level: logLevel,
      format: format.combine(...formatters),
      defaultMeta: {
        service: config.get('app.name', 'E-commerce API'),
        version: config.get('app.version', '1.0.0'),
        environment: config.get('app.env', 'development')
      },
      transports: loggerTransports,
      exitOnError: false
    });

    // 在开发环境中添加调试日志
    if (config.get('app.env') === 'development') {
      this._logger.debug('Logger initialized successfully');
    }
  }

  /**
   * 记录调试级别日志
   * @param {string} message - 日志消息
   * @param {Object} metadata - 附加的元数据
   */
  debug(message, metadata = {}) {
    this._logger.debug(message, metadata);
  }

  /**
   * 记录信息级别日志
   * @param {string} message - 日志消息
   * @param {Object} metadata - 附加的元数据
   */
  info(message, metadata = {}) {
    this._logger.info(message, metadata);
  }

  /**
   * 记录警告级别日志
   * @param {string} message - 日志消息
   * @param {Object} metadata - 附加的元数据
   */
  warn(message, metadata = {}) {
    this._logger.warn(message, metadata);
  }

  /**
   * 记录错误级别日志
   * @param {string} message - 日志消息
   * @param {Error} error - 错误对象
   * @param {Object} metadata - 附加的元数据
   */
  error(message, error = null, metadata = {}) {
    if (error instanceof Error) {
      metadata.error = {
        message: error.message,
        stack: error.stack,
        name: error.name
      };
    }
    this._logger.error(message, metadata);
  }

  /**
   * 记录致命错误级别日志
   * @param {string} message - 日志消息
   * @param {Error} error - 错误对象
   * @param {Object} metadata - 附加的元数据
   */
  fatal(message, error = null, metadata = {}) {
    if (error instanceof Error) {
      metadata.error = {
        message: error.message,
        stack: error.stack,
        name: error.name
      };
    }
    this._logger.error(`[FATAL] ${message}`, metadata);
  }

  /**
   * 记录请求日志
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {number} responseTime - 响应时间（毫秒）
   */
  logRequest(req, res, responseTime) {
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      responseTime: `${responseTime}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      userId: req.user ? req.user.id : null,
      correlationId: req.headers['x-correlation-id'] || null
    };

    // 根据状态码选择日志级别
    if (res.statusCode >= 500) {
      this.error('Request failed', null, logData);
    } else if (res.statusCode >= 400) {
      this.warn('Request warning', null, logData);
    } else {
      this.info('Request completed', logData);
    }
  }

  /**
   * 记录数据库操作日志
   * @param {string} operation - 操作类型（query, insert, update, delete等）
   * @param {string} query - SQL查询字符串
   * @param {Array} params - 查询参数
   * @param {number} executionTime - 执行时间（毫秒）
   * @param {Error} error - 错误对象（如果有）
   */
  logDatabaseOperation(operation, query, params = [], executionTime = 0, error = null) {
    const logData = {
      operation,
      query,
      params,
      executionTime: `${executionTime}ms`
    };

    if (error) {
      this.error('Database operation failed', error, logData);
    } else if (executionTime > 1000) { // 慢查询警告
      this.warn('Slow database query', null, logData);
    } else {
      this.debug('Database operation completed', logData);
    }
  }

  /**
   * 记录安全事件日志
   * @param {string} eventType - 事件类型（login, logout, permission_denied等）
   * @param {Object} details - 事件详情
   * @param {boolean} isError - 是否为错误事件
   */
  logSecurityEvent(eventType, details = {}, isError = false) {
    const logData = {
      eventType,
      timestamp: new Date().toISOString(),
      ...details
    };

    if (isError) {
      this.error('Security event', null, logData);
    } else {
      this.info('Security event', logData);
    }
  }

  /**
   * 设置日志级别
   * @param {string} level - 日志级别（debug, info, warn, error）
   */
  setLevel(level) {
    const validLevels = ['debug', 'info', 'warn', 'error'];
    if (validLevels.includes(level)) {
      this._logger.level = level;
      this.info(`Logger level set to ${level}`);
    } else {
      this.warn(`Invalid log level: ${level}, using current level: ${this._logger.level}`);
    }
  }

  /**
   * 获取当前日志级别
   * @returns {string} 当前日志级别
   */
  getLevel() {
    return this._logger.level;
  }

  /**
   * 创建命名空间日志记录器
   * @param {string} namespace - 命名空间名称
   * @returns {Object} 命名空间日志记录器
   */
  createNamespace(namespace) {
    const namespaceLogger = {
      debug: (message, metadata = {}) => this.debug(message, { ...metadata, namespace }),
      info: (message, metadata = {}) => this.info(message, { ...metadata, namespace }),
      warn: (message, metadata = {}) => this.warn(message, { ...metadata, namespace }),
      error: (message, error = null, metadata = {}) => this.error(message, error, { ...metadata, namespace }),
      fatal: (message, error = null, metadata = {}) => this.fatal(message, error, { ...metadata, namespace })
    };

    return namespaceLogger;
  }

  /**
   * 记录性能指标
   * @param {string} metric - 指标名称
   * @param {number} value - 指标值
   * @param {Object} tags - 相关标签
   */
  logPerformance(metric, value, tags = {}) {
    this.debug('Performance metric', {
      metric,
      value,
      ...tags
    });
  }

  /**
   * 记录批量日志（减少I/O操作）
   * @param {Array} logs - 日志数组 [{level, message, metadata}]
   */
  logBatch(logs) {
    logs.forEach(log => {
      switch (log.level) {
        case 'debug':
          this.debug(log.message, log.metadata || {});
          break;
        case 'info':
          this.info(log.message, log.metadata || {});
          break;
        case 'warn':
          this.warn(log.message, log.metadata || {});
          break;
        case 'error':
          this.error(log.message, log.error || null, log.metadata || {});
          break;
        default:
          this.info(log.message, log.metadata || {});
      }
    });
  }
}

// 创建单例实例
const logger = new Logger();

// 监听未捕获的异常
process.on('uncaughtException', (error) => {
  logger.fatal('Uncaught exception', error);
  // 延迟退出，确保日志写入完成
  setTimeout(() => process.exit(1), 1000);
});

// 监听未处理的Promise拒绝
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled promise rejection', new Error(String(reason)), {
    promise: promise.toString()
  });
});

module.exports = logger;
module.exports.Logger = Logger;