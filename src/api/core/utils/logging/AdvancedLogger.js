/**
 * 高级日志记录器
 * 提供结构化日志、级别控制、多目标输出和上下文跟踪功能
 */

const fs = require('fs');
const path = require('path');
const { format } = require('util');

/**
 * 日志级别枚举
 */
const LogLevel = {
  TRACE: 0,
  DEBUG: 1,
  INFO: 2,
  WARN: 3,
  ERROR: 4,
  FATAL: 5,
  OFF: 6
};

/**
 * 日志级别名称映射
 */
const LogLevelNames = {
  [LogLevel.TRACE]: 'TRACE',
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.FATAL]: 'FATAL',
  [LogLevel.OFF]: 'OFF'
};

/**
 * 日志格式化器基类
 */
class LogFormatter {
  format(logEntry) {
    throw new Error('必须实现format方法');
  }
}

/**
 * 简单文本格式化器
 */
class SimpleTextFormatter extends LogFormatter {
  format(logEntry) {
    const timestamp = new Date(logEntry.timestamp).toISOString();
    const level = LogLevelNames[logEntry.level] || 'UNKNOWN';
    const context = logEntry.context ? `[${logEntry.context}]` : '';
    const message = this._formatMessage(logEntry);
    
    return `${timestamp} ${level} ${context} ${message}`;
  }
  
  _formatMessage(logEntry) {
    if (logEntry.error) {
      const errorInfo = logEntry.error.stack || logEntry.error.toString();
      return `${logEntry.message}\n${errorInfo}`;
    }
    
    if (logEntry.meta && Object.keys(logEntry.meta).length > 0) {
      return `${logEntry.message} ${JSON.stringify(logEntry.meta)}`;
    }
    
    return logEntry.message;
  }
}

/**
 * JSON格式化器
 */
class JsonFormatter extends LogFormatter {
  format(logEntry) {
    const formattedEntry = {
      timestamp: logEntry.timestamp,
      level: LogLevelNames[logEntry.level] || 'UNKNOWN',
      message: logEntry.message,
      context: logEntry.context
    };
    
    if (logEntry.meta) {
      formattedEntry.meta = logEntry.meta;
    }
    
    if (logEntry.error) {
      formattedEntry.error = {
        message: logEntry.error.message,
        stack: logEntry.error.stack,
        code: logEntry.error.code,
        name: logEntry.error.name
      };
    }
    
    if (logEntry.traceId) {
      formattedEntry.traceId = logEntry.traceId;
    }
    
    return JSON.stringify(formattedEntry);
  }
}

/**
 * 日志输出目标基类
 */
class LogAppender {
  append(logEntry) {
    throw new Error('必须实现append方法');
  }
  
  close() {
    // 默认实现为空
  }
}

/**
 * 控制台输出目标
 */
class ConsoleAppender extends LogAppender {
  constructor(formatter = new SimpleTextFormatter()) {
    super();
    this.formatter = formatter;
  }
  
  append(logEntry) {
    const formattedMessage = this.formatter.format(logEntry);
    
    switch (logEntry.level) {
      case LogLevel.TRACE:
      case LogLevel.DEBUG:
        console.debug(formattedMessage);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(formattedMessage);
        break;
    }
  }
}

/**
 * 文件输出目标
 */
class FileAppender extends LogAppender {
  constructor(filePath, formatter = new JsonFormatter()) {
    super();
    this.filePath = filePath;
    this.formatter = formatter;
    this.fileStream = null;
    this._ensureDirectoryExists();
    this._openFileStream();
  }
  
  _ensureDirectoryExists() {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
  
  _openFileStream() {
    try {
      this.fileStream = fs.createWriteStream(this.filePath, { flags: 'a' });
    } catch (error) {
      console.error(`无法打开日志文件: ${this.filePath}`, error);
      this.fileStream = null;
    }
  }
  
  append(logEntry) {
    if (!this.fileStream) {
      this._openFileStream();
      if (!this.fileStream) return;
    }
    
    try {
      const formattedMessage = this.formatter.format(logEntry);
      this.fileStream.write(`${formattedMessage}\n`);
    } catch (error) {
      console.error('写入日志文件失败', error);
      this._closeFileStream();
    }
  }
  
  close() {
    this._closeFileStream();
  }
  
  _closeFileStream() {
    if (this.fileStream) {
      try {
        this.fileStream.end();
      } catch (error) {
        console.error('关闭日志文件流失败', error);
      }
      this.fileStream = null;
    }
  }
}

/**
 * 高级日志记录器类
 */
class AdvancedLogger {
  constructor() {
    this.logLevel = LogLevel.INFO;
    this.appenders = [new ConsoleAppender()];
    this.context = null;
    this.traceId = null;
    this.logQueue = [];
    this.isProcessing = false;
    this.metrics = {
      logCount: 0,
      errorCount: 0,
      levels: {}
    };
    
    // 初始化级别计数器
    Object.values(LogLevel).forEach(level => {
      this.metrics.levels[LogLevelNames[level]] = 0;
    });
    
    // 捕获未处理的异常
    process.on('uncaughtException', (error) => {
      this.fatal('未捕获的异常', { error });
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      this.error('未处理的Promise拒绝', { reason, promise });
    });
    
    // 进程退出时关闭所有appender
    process.on('exit', () => {
      this._closeAllAppenders();
    });
  }

  /**
   * 设置日志级别
   * @param {number|string} level - 日志级别
   */
  setLevel(level) {
    if (typeof level === 'string') {
      const levelKey = Object.keys(LogLevelNames).find(
        key => LogLevelNames[key].toUpperCase() === level.toUpperCase()
      );
      
      if (levelKey !== undefined) {
        this.logLevel = parseInt(levelKey, 10);
      } else {
        console.warn(`未知的日志级别: ${level}`);
      }
    } else if (typeof level === 'number' && Object.values(LogLevel).includes(level)) {
      this.logLevel = level;
    }
    
    this.info(`日志级别已设置为: ${LogLevelNames[this.logLevel]}`);
  }

  /**
   * 添加日志输出目标
   * @param {LogAppender} appender - 日志输出目标
   */
  addAppender(appender) {
    if (appender instanceof LogAppender) {
      this.appenders.push(appender);
      this.info(`已添加日志输出目标: ${appender.constructor.name}`);
    } else {
      throw new Error('日志输出目标必须是LogAppender的实例');
    }
  }

  /**
   * 移除日志输出目标
   * @param {LogAppender} appender - 要移除的日志输出目标
   * @returns {boolean} 是否成功移除
   */
  removeAppender(appender) {
    const index = this.appenders.indexOf(appender);
    if (index !== -1) {
      try {
        appender.close();
        this.appenders.splice(index, 1);
        this.info(`已移除日志输出目标: ${appender.constructor.name}`);
        return true;
      } catch (error) {
        this.error('移除日志输出目标失败', { error });
        return false;
      }
    }
    return false;
  }

  /**
   * 设置日志上下文
   * @param {string} context - 上下文名称
   * @returns {AdvancedLogger} 当前日志记录器实例
   */
  withContext(context) {
    this.context = context;
    return this;
  }

  /**
   * 设置跟踪ID
   * @param {string} traceId - 跟踪ID
   * @returns {AdvancedLogger} 当前日志记录器实例
   */
  withTraceId(traceId) {
    this.traceId = traceId;
    return this;
  }

  /**
   * 创建带上下文的日志记录器
   * @param {string} context - 上下文名称
   * @returns {Object} 带上下文的日志方法对象
   */
  createLogger(context) {
    const logger = this;
    return {
      trace: (message, meta) => logger.trace(message, meta, context),
      debug: (message, meta) => logger.debug(message, meta, context),
      info: (message, meta) => logger.info(message, meta, context),
      warn: (message, meta) => logger.warn(message, meta, context),
      error: (message, meta) => logger.error(message, meta, context),
      fatal: (message, meta) => logger.fatal(message, meta, context),
      withTraceId: (traceId) => logger.withTraceId(traceId).createLogger(context)
    };
  }

  /**
   * TRACE级别日志
   * @param {string} message - 日志消息
   * @param {Object} meta - 元数据
   * @param {string} context - 上下文（可选）
   */
  trace(message, meta = {}, context = null) {
    this._log(LogLevel.TRACE, message, meta, context);
  }

  /**
   * DEBUG级别日志
   * @param {string} message - 日志消息
   * @param {Object} meta - 元数据
   * @param {string} context - 上下文（可选）
   */
  debug(message, meta = {}, context = null) {
    this._log(LogLevel.DEBUG, message, meta, context);
  }

  /**
   * INFO级别日志
   * @param {string} message - 日志消息
   * @param {Object} meta - 元数据
   * @param {string} context - 上下文（可选）
   */
  info(message, meta = {}, context = null) {
    this._log(LogLevel.INFO, message, meta, context);
  }

  /**
   * WARN级别日志
   * @param {string} message - 日志消息
   * @param {Object} meta - 元数据
   * @param {string} context - 上下文（可选）
   */
  warn(message, meta = {}, context = null) {
    this._log(LogLevel.WARN, message, meta, context);
  }

  /**
   * ERROR级别日志
   * @param {string} message - 日志消息
   * @param {Object|Error} errorOrMeta - 错误对象或元数据
   * @param {string} context - 上下文（可选）
   */
  error(message, errorOrMeta = {}, context = null) {
    let meta = {};
    let error = null;
    
    if (errorOrMeta instanceof Error) {
      error = errorOrMeta;
    } else if (typeof errorOrMeta === 'object') {
      if (errorOrMeta.error instanceof Error) {
        error = errorOrMeta.error;
        meta = { ...errorOrMeta };
        delete meta.error;
      } else {
        meta = errorOrMeta;
      }
    }
    
    this._log(LogLevel.ERROR, message, meta, context, error);
  }

  /**
   * FATAL级别日志
   * @param {string} message - 日志消息
   * @param {Object|Error} errorOrMeta - 错误对象或元数据
   * @param {string} context - 上下文（可选）
   */
  fatal(message, errorOrMeta = {}, context = null) {
    let meta = {};
    let error = null;
    
    if (errorOrMeta instanceof Error) {
      error = errorOrMeta;
    } else if (typeof errorOrMeta === 'object') {
      if (errorOrMeta.error instanceof Error) {
        error = errorOrMeta.error;
        meta = { ...errorOrMeta };
        delete meta.error;
      } else {
        meta = errorOrMeta;
      }
    }
    
    this._log(LogLevel.FATAL, message, meta, context, error);
  }

  /**
   * 记录方法执行时间
   * @param {string} methodName - 方法名称
   * @param {Function} fn - 要执行的函数
   * @param {Object} options - 选项
   * @returns {any} 函数执行结果
   */
  async time(methodName, fn, options = {}) {
    const startTime = Date.now();
    const level = options.level || LogLevel.DEBUG;
    const context = options.context || this.context;
    
    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      
      if (level >= this.logLevel) {
        this._log(level, `${methodName} 执行完成`, {
          duration,
          resultType: typeof result,
          ...options.meta
        }, context);
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.error(`${methodName} 执行失败`, {
        duration,
        error,
        ...options.meta
      }, context);
      throw error;
    }
  }

  /**
   * 创建性能监控装饰器
   * @param {Object} options - 监控选项
   * @returns {Function} 装饰器函数
   */
  monitor(options = {}) {
    return (target, propertyKey, descriptor) => {
      const originalMethod = descriptor.value;
      const methodName = options.name || `${target.constructor.name}.${propertyKey}`;
      
      descriptor.value = async function(...args) {
        const logger = options.logger || this.logger || advancedLogger;
        
        // 检查是否应该记录参数
        let meta = {};
        if (options.logArgs && args.length > 0) {
          // 尝试序列化参数，但避免循环引用
          try {
            meta.args = JSON.parse(JSON.stringify(args, (key, value) => {
              if (typeof value === 'object' && value !== null && Object.keys(value).length > 50) {
                return `[Object with ${Object.keys(value).length} properties]`;
              }
              return value;
            }));
          } catch (e) {
            meta.argsCount = args.length;
          }
        }
        
        return logger.time(methodName, () => originalMethod.apply(this, args), {
          level: options.level,
          context: options.context,
          meta
        });
      };
      
      return descriptor;
    };
  }

  /**
   * 获取日志统计信息
   * @returns {Object} 日志统计
   */
  getMetrics() {
    return { ...this.metrics };
  }

  /**
   * 重置日志统计信息
   */
  resetMetrics() {
    this.metrics = {
      logCount: 0,
      errorCount: 0,
      levels: {}
    };
    
    Object.values(LogLevel).forEach(level => {
      this.metrics.levels[LogLevelNames[level]] = 0;
    });
  }

  /**
   * 内部日志方法
   * @private
   * @param {number} level - 日志级别
   * @param {string} message - 日志消息
   * @param {Object} meta - 元数据
   * @param {string} context - 上下文
   * @param {Error} error - 错误对象
   */
  _log(level, message, meta = {}, context = null, error = null) {
    if (level < this.logLevel) {
      return;
    }
    
    // 格式化消息（支持类似console.log的格式化）
    if (arguments.length > 5) {
      message = format(message, ...Array.from(arguments).slice(5));
    }
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: context || this.context,
      meta,
      traceId: this.traceId,
      error
    };
    
    // 更新统计信息
    this._updateMetrics(level, error);
    
    // 将日志添加到队列
    this.logQueue.push(logEntry);
    
    // 处理日志队列
    if (!this.isProcessing) {
      this._processLogQueue();
    }
  }

  /**
   * 处理日志队列
   * @private
   */
  _processLogQueue() {
    if (this.isProcessing || this.logQueue.length === 0) {
      return;
    }
    
    this.isProcessing = true;
    
    // 批量处理日志，避免阻塞
    const batchSize = 10;
    const batch = this.logQueue.splice(0, batchSize);
    
    setImmediate(() => {
      try {
        batch.forEach(logEntry => {
          this._appendToAllAppenders(logEntry);
        });
      } catch (error) {
        // 避免日志处理错误影响应用
        console.error('处理日志队列失败', error);
      } finally {
        this.isProcessing = false;
        
        // 继续处理剩余的日志
        if (this.logQueue.length > 0) {
          this._processLogQueue();
        }
      }
    });
  }

  /**
   * 输出日志到所有appender
   * @private
   * @param {Object} logEntry - 日志条目
   */
  _appendToAllAppenders(logEntry) {
    this.appenders.forEach(appender => {
      try {
        appender.append(logEntry);
      } catch (error) {
        // 避免单个appender错误影响其他appender
        console.error(`日志输出到 ${appender.constructor.name} 失败`, error);
      }
    });
  }

  /**
   * 更新日志统计信息
   * @private
   * @param {number} level - 日志级别
   * @param {Error} error - 错误对象
   */
  _updateMetrics(level, error) {
    this.metrics.logCount++;
    const levelName = LogLevelNames[level];
    
    if (this.metrics.levels[levelName] !== undefined) {
      this.metrics.levels[levelName]++;
    }
    
    if (error || level >= LogLevel.ERROR) {
      this.metrics.errorCount++;
    }
  }

  /**
   * 关闭所有日志输出目标
   * @private
   */
  _closeAllAppenders() {
    this.appenders.forEach(appender => {
      try {
        appender.close();
      } catch (error) {
        console.error('关闭日志输出目标失败', error);
      }
    });
    
    this.appenders = [];
  }
}

// 创建单例实例
const advancedLogger = new AdvancedLogger();

module.exports = {
  AdvancedLogger,
  advancedLogger,
  LogLevel,
  LogLevelNames,
  LogFormatter,
  SimpleTextFormatter,
  JsonFormatter,
  LogAppender,
  ConsoleAppender,
  FileAppender
};