/**
 * 日志工具
 * 提供结构化日志记录和多级别日志管理功能
 */

const fs = require('fs');
const path = require('path');
const { createLogger, format, transports } = require('winston');
const { v4: uuidv4 } = require('uuid');
const { AppError } = require('../../exception/handlers/errorHandler');
const { LoggerError } = require('../../exception/handlers/errorHandler');

/**
 * 日志级别枚举
 */
const LogLevel = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  CRITICAL: 'critical',
  SILLY: 'silly',
  VERBOSE: 'verbose'
};

/**
 * 日志格式枚举
 */
const LogFormat = {
  JSON: 'json',
  TEXT: 'text',
  COMBINED: 'combined'
};

/**
 * 默认日志配置
 */
const DEFAULT_CONFIG = {
  level: LogLevel.INFO,
  format: LogFormat.JSON,
  console: {
    enabled: true,
    level: LogLevel.INFO,
    colorize: true
  },
  file: {
    enabled: true,
    level: LogLevel.DEBUG,
    directory: './logs',
    maxSize: '20m',
    maxFiles: '14d',
    fileName: 'app.log'
  },
  exception: {
    enabled: true,
    fileName: 'exceptions.log'
  },
  rejection: {
    enabled: true,
    fileName: 'rejections.log'
  },
  metadata: {
    appName: 'api-service',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  },
  timestamp: true,
  correlationId: true,
  prettyPrint: false
};

/**
 * 日志工具类
 */
class Logger {
  /**
   * 构造函数
   * @param {Object} config - 日志配置
   */
  constructor(config = {}) {
    // 合并配置
    this.config = this._mergeConfig(DEFAULT_CONFIG, config);
    
    // 确保日志目录存在
    this._ensureLogDirectory();
    
    // 初始化 winston logger
    this.logger = this._createWinstonLogger();
    
    // 存储活动的日志上下文
    this.contexts = new Map();
    
    // 记录器初始化信息
    this.logger.info('日志系统初始化完成', {
      level: this.config.level,
      format: this.config.format,
      environment: this.config.metadata.environment
    });
  }

  /**
   * 合并配置
   * @private
   * @param {Object} defaultConfig - 默认配置
   * @param {Object} userConfig - 用户配置
   * @returns {Object} 合并后的配置
   */
  _mergeConfig(defaultConfig, userConfig) {
    const merged = { ...defaultConfig };
    
    // 深度合并配置对象
    for (const key in userConfig) {
      if (userConfig.hasOwnProperty(key)) {
        if (typeof defaultConfig[key] === 'object' && 
            typeof userConfig[key] === 'object' && 
            !Array.isArray(defaultConfig[key]) &&
            !Array.isArray(userConfig[key])) {
          merged[key] = this._mergeConfig(defaultConfig[key], userConfig[key]);
        } else {
          merged[key] = userConfig[key];
        }
      }
    }
    
    return merged;
  }

  /**
   * 确保日志目录存在
   * @private
   */
  _ensureLogDirectory() {
    try {
      const logDir = this.config.file.directory;
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
        this._debug(`创建日志目录: ${logDir}`);
      }
    } catch (error) {
      throw new LoggerError(`无法创建日志目录: ${error.message}`, {
        code: 'LOG_DIRECTORY_CREATION_FAILED',
        cause: error
      });
    }
  }

  /**
   * 创建 winston 日志记录器
   * @private
   * @returns {Object} winston logger 实例
   */
  _createWinstonLogger() {
    const loggerTransports = [];
    const logFormat = this._createLogFormat();
    
    // 添加控制台传输
    if (this.config.console.enabled) {
      loggerTransports.push(
        new transports.Console({
          level: this.config.console.level,
          format: this.config.console.colorize 
            ? format.combine(format.colorize(), logFormat)
            : logFormat
        })
      );
    }
    
    // 添加文件传输
    if (this.config.file.enabled) {
      const logFilePath = path.join(
        this.config.file.directory,
        this.config.file.fileName
      );
      
      loggerTransports.push(
        new transports.RotateFile({
          filename: logFilePath,
          level: this.config.file.level,
          format: logFormat,
          maxSize: this.config.file.maxSize,
          maxFiles: this.config.file.maxFiles,
          tailable: true,
          zippedArchive: true
        })
      );
    }
    
    // 创建 logger
    const logger = createLogger({
      level: this.config.level,
      transports: loggerTransports,
      exitOnError: false
    });
    
    // 配置异常处理
    if (this.config.exception.enabled) {
      const exceptionFilePath = path.join(
        this.config.file.directory,
        this.config.exception.fileName
      );
      
      logger.exceptions.handle(
        new transports.File({
          filename: exceptionFilePath,
          format: logFormat
        })
      );
    }
    
    // 配置拒绝处理
    if (this.config.rejection.enabled) {
      const rejectionFilePath = path.join(
        this.config.file.directory,
        this.config.rejection.fileName
      );
      
      logger.rejections.handle(
        new transports.File({
          filename: rejectionFilePath,
          format: logFormat
        })
      );
    }
    
    return logger;
  }

  /**
   * 创建日志格式
   * @private
   * @returns {Object} winston 格式对象
   */
  _createLogFormat() {
    const formatOptions = [];
    
    // 添加时间戳
    if (this.config.timestamp) {
      formatOptions.push(
        format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss.SSS'
        })
      );
    }
    
    // 添加元数据
    formatOptions.push(
      format((info) => {
        // 添加应用元数据
        info.metadata = { ...this.config.metadata, ...info.metadata };
        
        // 处理错误对象
        if (info.error instanceof Error) {
          info.error = this._formatError(info.error);
        }
        
        // 添加上下文信息
        if (info.contextId && this.contexts.has(info.contextId)) {
          info.context = this.contexts.get(info.contextId);
        }
        
        return info;
      })()
    );
    
    // 根据配置选择输出格式
    if (this.config.format === LogFormat.JSON) {
      formatOptions.push(format.json());
    } else if (this.config.format === LogFormat.TEXT) {
      formatOptions.push(format.simple());
    } else {
      // 组合格式
      formatOptions.push(format.combine(
        format.printf(({ timestamp, level, message, ...metadata }) => {
          const metaString = JSON.stringify(metadata, null, this.config.prettyPrint ? 2 : 0);
          return `${timestamp} [${level.toUpperCase()}] ${message} ${metaString}`;
        })
      ));
    }
    
    return format.combine(...formatOptions);
  }

  /**
   * 格式化错误对象
   * @private
   * @param {Error} error - 错误对象
   * @returns {Object} 格式化后的错误信息
   */
  _formatError(error) {
    return {
      message: error.message,
      name: error.name,
      stack: error.stack,
      code: error.code || null,
      status: error.status || null,
      ...(error.data ? { data: error.data } : {})
    };
  }

  /**
   * 内部 debug 方法
   * @private
   * @param {string} message - 日志消息
   */
  _debug(message) {
    // 避免循环引用
    if (this.logger) {
      this.logger.debug(message);
    } else {
      console.debug(message);
    }
  }

  /**
   * 创建日志上下文
   * @param {Object} contextData - 上下文数据
   * @returns {string} 上下文 ID
   */
  createContext(contextData = {}) {
    const contextId = uuidv4();
    const context = {
      id: contextId,
      createdAt: new Date().toISOString(),
      ...contextData
    };
    
    this.contexts.set(contextId, context);
    this.logger.debug('创建日志上下文', { contextId });
    
    return contextId;
  }

  /**
   * 更新日志上下文
   * @param {string} contextId - 上下文 ID
   * @param {Object} updates - 更新数据
   * @returns {boolean} 是否更新成功
   */
  updateContext(contextId, updates) {
    if (!this.contexts.has(contextId)) {
      this.logger.warn('尝试更新不存在的日志上下文', { contextId });
      return false;
    }
    
    const context = this.contexts.get(contextId);
    this.contexts.set(contextId, { ...context, ...updates });
    
    return true;
  }

  /**
   * 删除日志上下文
   * @param {string} contextId - 上下文 ID
   * @returns {boolean} 是否删除成功
   */
  deleteContext(contextId) {
    if (this.contexts.has(contextId)) {
      this.contexts.delete(contextId);
      this.logger.debug('删除日志上下文', { contextId });
      return true;
    }
    return false;
  }

  /**
   * 获取日志上下文
   * @param {string} contextId - 上下文 ID
   * @returns {Object|null} 上下文对象
   */
  getContext(contextId) {
    return this.contexts.get(contextId) || null;
  }

  /**
   * 清理过期的上下文
   * @param {number} maxAgeMs - 最大保留时间（毫秒）
   */
  cleanupContexts(maxAgeMs = 3600000) { // 默认1小时
    const now = Date.now();
    let removedCount = 0;
    
    for (const [contextId, context] of this.contexts.entries()) {
      const contextAge = now - new Date(context.createdAt).getTime();
      if (contextAge > maxAgeMs) {
        this.contexts.delete(contextId);
        removedCount++;
      }
    }
    
    if (removedCount > 0) {
      this.logger.debug(`清理了 ${removedCount} 个过期的日志上下文`);
    }
  }

  /**
   * 生成相关 ID
   * @returns {string} 唯一的相关 ID
   */
  generateCorrelationId() {
    return uuidv4();
  }

  /**
   * 构建日志元数据
   * @private
   * @param {Object} metadata - 基础元数据
   * @param {string} contextId - 可选的上下文 ID
   * @returns {Object} 完整的日志元数据
   */
  _buildMetadata(metadata = {}, contextId = null) {
    const meta = { ...metadata };
    
    // 添加相关 ID
    if (this.config.correlationId && !meta.correlationId) {
      meta.correlationId = this.generateCorrelationId();
    }
    
    // 添加上下文 ID
    if (contextId) {
      meta.contextId = contextId;
    }
    
    return meta;
  }

  /**
   * 记录 debug 级别日志
   * @param {string} message - 日志消息
   * @param {Object} metadata - 元数据
   * @param {string} contextId - 上下文 ID
   */
  debug(message, metadata = {}, contextId = null) {
    this.logger.debug(message, this._buildMetadata(metadata, contextId));
  }

  /**
   * 记录 info 级别日志
   * @param {string} message - 日志消息
   * @param {Object} metadata - 元数据
   * @param {string} contextId - 上下文 ID
   */
  info(message, metadata = {}, contextId = null) {
    this.logger.info(message, this._buildMetadata(metadata, contextId));
  }

  /**
   * 记录 warn 级别日志
   * @param {string} message - 日志消息
   * @param {Object} metadata - 元数据
   * @param {string} contextId - 上下文 ID
   */
  warn(message, metadata = {}, contextId = null) {
    this.logger.warn(message, this._buildMetadata(metadata, contextId));
  }

  /**
   * 记录 error 级别日志
   * @param {string} message - 日志消息
   * @param {Object} metadata - 元数据
   * @param {string} contextId - 上下文 ID
   */
  error(message, metadata = {}, contextId = null) {
    this.logger.error(message, this._buildMetadata(metadata, contextId));
  }

  /**
   * 记录 critical 级别日志
   * @param {string} message - 日志消息
   * @param {Object} metadata - 元数据
   * @param {string} contextId - 上下文 ID
   */
  critical(message, metadata = {}, contextId = null) {
    // 使用 error 级别但标记为 critical
    const meta = this._buildMetadata(metadata, contextId);
    meta.severity = 'critical';
    this.logger.error(message, meta);
  }

  /**
   * 记录 silly 级别日志
   * @param {string} message - 日志消息
   * @param {Object} metadata - 元数据
   * @param {string} contextId - 上下文 ID
   */
  silly(message, metadata = {}, contextId = null) {
    this.logger.silly(message, this._buildMetadata(metadata, contextId));
  }

  /**
   * 记录 verbose 级别日志
   * @param {string} message - 日志消息
   * @param {Object} metadata - 元数据
   * @param {string} contextId - 上下文 ID
   */
  verbose(message, metadata = {}, contextId = null) {
    this.logger.verbose(message, this._buildMetadata(metadata, contextId));
  }

  /**
   * 记录请求日志
   * @param {Object} req - Express 请求对象
   * @param {Object} metadata - 额外元数据
   */
  logRequest(req, metadata = {}) {
    const requestData = {
      method: req.method,
      url: req.originalUrl,
      path: req.path,
      query: req.query,
      headers: this._sanitizeHeaders(req.headers),
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      ...metadata
    };
    
    this.info('HTTP请求', requestData);
  }

  /**
   * 记录响应日志
   * @param {Object} req - Express 请求对象
   * @param {Object} res - Express 响应对象
   * @param {number} responseTime - 响应时间（毫秒）
   * @param {Object} metadata - 额外元数据
   */
  logResponse(req, res, responseTime, metadata = {}) {
    const responseData = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime,
      contentLength: res.get('content-length'),
      ...metadata
    };
    
    // 根据状态码选择日志级别
    if (res.statusCode >= 500) {
      this.error('HTTP响应错误', responseData);
    } else if (res.statusCode >= 400) {
      this.warn('HTTP响应警告', responseData);
    } else {
      this.info('HTTP响应', responseData);
    }
  }

  /**
   * 清理敏感头信息
   * @private
   * @param {Object} headers - 原始头信息
   * @returns {Object} 清理后的头信息
   */
  _sanitizeHeaders(headers) {
    const sensitiveHeaders = ['authorization', 'x-api-key', 'cookie', 'set-cookie'];
    const sanitized = { ...headers };
    
    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '*** REDACTED ***';
      }
    });
    
    return sanitized;
  }

  /**
   * 记录数据库操作日志
   * @param {string} operation - 操作类型
   * @param {string} query - SQL查询（已脱敏）
   * @param {Array} params - 参数数组
   * @param {number} executionTime - 执行时间（毫秒）
   * @param {Object} metadata - 额外元数据
   */
  logDatabaseOperation(operation, query, params = [], executionTime = 0, metadata = {}) {
    const dbData = {
      operation,
      query: this._sanitizeQuery(query),
      paramsCount: params.length,
      executionTime,
      ...metadata
    };
    
    if (executionTime > 1000) {
      // 慢查询警告
      this.warn('数据库慢查询', dbData);
    } else {
      this.debug('数据库操作', dbData);
    }
  }

  /**
   * 清理SQL查询中的敏感信息
   * @private
   * @param {string} query - 原始查询
   * @returns {string} 清理后的查询
   */
  _sanitizeQuery(query) {
    // 这里可以添加更复杂的SQL清理逻辑
    return query;
  }

  /**
   * 记录性能指标
   * @param {string} metricName - 指标名称
   * @param {number} value - 指标值
   * @param {Object} metadata - 额外元数据
   */
  logMetric(metricName, value, metadata = {}) {
    const metricData = {
      metricName,
      value,
      timestamp: new Date().toISOString(),
      ...metadata
    };
    
    this.debug('性能指标', metricData);
  }

  /**
   * 记录审计日志
   * @param {string} action - 操作类型
   * @param {string} resource - 资源类型
   * @param {string} resourceId - 资源ID
   * @param {Object} user - 用户信息
   * @param {Object} metadata - 额外元数据
   */
  logAudit(action, resource, resourceId, user = {}, metadata = {}) {
    const auditData = {
      action,
      resource,
      resourceId,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      timestamp: new Date().toISOString(),
      ...metadata
    };
    
    this.info('审计日志', auditData);
  }

  /**
   * 创建带上下文的日志记录器
   * @param {Object} contextData - 上下文数据
   * @returns {Object} 上下文日志记录器
   */
  withContext(contextData) {
    const contextId = this.createContext(contextData);
    
    const contextLogger = {
      // 代理所有日志方法
      debug: (message, metadata = {}) => this.debug(message, metadata, contextId),
      info: (message, metadata = {}) => this.info(message, metadata, contextId),
      warn: (message, metadata = {}) => this.warn(message, metadata, contextId),
      error: (message, metadata = {}) => this.error(message, metadata, contextId),
      critical: (message, metadata = {}) => this.critical(message, metadata, contextId),
      silly: (message, metadata = {}) => this.silly(message, metadata, contextId),
      verbose: (message, metadata = {}) => this.verbose(message, metadata, contextId),
      
      // 上下文管理方法
      updateContext: (updates) => this.updateContext(contextId, updates),
      deleteContext: () => this.deleteContext(contextId),
      getContext: () => this.getContext(contextId),
      
      // 原始记录器引用
      _logger: this,
      contextId
    };
    
    return contextLogger;
  }

  /**
   * 获取日志统计信息
   * @returns {Object} 日志统计
   */
  getStats() {
    return {
      contextCount: this.contexts.size,
      config: {
        level: this.config.level,
        format: this.config.format,
        consoleEnabled: this.config.console.enabled,
        fileEnabled: this.config.file.enabled
      }
    };
  }

  /**
   * 关闭日志记录器
   * @returns {Promise<void>}
   */
  async close() {
    try {
      // 关闭所有传输
      await Promise.all(this.logger.transports.map(transport => {
        if (transport.close) {
          return new Promise(resolve => transport.close(resolve));
        }
        return Promise.resolve();
      }));
      
      // 清理上下文
      this.contexts.clear();
      
      this._debug('日志记录器已关闭');
    } catch (error) {
      console.error('关闭日志记录器时发生错误:', error);
    }
  }

  /**
   * 静态实例
   * @private
   */
  static _instance = null;

  /**
   * 获取单例实例
   * @param {Object} config - 日志配置
   * @returns {Logger} 日志记录器实例
   */
  static getInstance(config = {}) {
    if (!Logger._instance) {
      Logger._instance = new Logger(config);
    }
    return Logger._instance;
  }

  /**
   * 创建新的日志记录器实例
   * @param {Object} config - 日志配置
   * @returns {Logger} 日志记录器实例
   */
  static create(config = {}) {
    return new Logger(config);
  }

  /**
   * 获取日志级别枚举
   * @returns {Object} 日志级别枚举
   */
  static getLogLevel() {
    return { ...LogLevel };
  }

  /**
   * 获取日志格式枚举
   * @returns {Object} 日志格式枚举
   */
  static getLogFormat() {
    return { ...LogFormat };
  }

  /**
   * 获取默认配置
   * @returns {Object} 默认配置
   */
  static getDefaultConfig() {
    return { ...DEFAULT_CONFIG };
  }
}

// 创建默认实例
const defaultLogger = Logger.getInstance();

module.exports = {
  Logger,
  LogLevel,
  LogFormat,
  logger: defaultLogger
};