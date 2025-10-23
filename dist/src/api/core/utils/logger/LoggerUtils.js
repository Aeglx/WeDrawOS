/**
 * 日志工具类
 * 提供多级别日志记录、格式化、过滤、轮转等功能
 */

const path = require('path');
const fs = require('fs').promises;
const util = require('util');

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

const LogLevelNames = {
  0: 'TRACE',
  1: 'DEBUG',
  2: 'INFO', 
  3: 'WARN',
  4: 'ERROR',
  5: 'FATAL',
  6: 'OFF'
};

/**
 * 日志格式化器基类
 */
class LogFormatter {
  format(logRecord) {
    throw new Error('必须实现format方法');
  }
}

/**
 * 简单文本格式化器
 */
class SimpleFormatter extends LogFormatter {
  format(logRecord) {
    const timestamp = new Date(logRecord.timestamp).toISOString();
    const level = LogLevelNames[logRecord.level] || 'UNKNOWN';
    const message = logRecord.message;
    const meta = logRecord.meta ? ` ${JSON.stringify(logRecord.meta)}` : '';
    const stack = logRecord.stack ? `\n${logRecord.stack}` : '';
    
    return `[${timestamp}] [${level}] ${message}${meta}${stack}`;
  }
}

/**
 * JSON格式化器
 */
class JsonFormatter extends LogFormatter {
  format(logRecord) {
    const logObject = {
      timestamp: logRecord.timestamp,
      level: LogLevelNames[logRecord.level] || 'UNKNOWN',
      message: logRecord.message,
      ...logRecord.meta,
      stack: logRecord.stack
    };
    
    // 移除undefined字段
    Object.keys(logObject).forEach(key => {
      if (logObject[key] === undefined) {
        delete logObject[key];
      }
    });
    
    return JSON.stringify(logObject);
  }
}

/**
 * 彩色控制台格式化器
 */
class ColoredConsoleFormatter extends LogFormatter {
  constructor() {
    super();
    
    // ANSI颜色代码
    this.colors = {
      TRACE: '\x1b[36m', // 青色
      DEBUG: '\x1b[34m', // 蓝色
      INFO: '\x1b[32m',  // 绿色
      WARN: '\x1b[33m',  // 黄色
      ERROR: '\x1b[31m', // 红色
      FATAL: '\x1b[41m', // 红色背景
      RESET: '\x1b[0m'   // 重置
    };
  }
  
  format(logRecord) {
    const timestamp = new Date(logRecord.timestamp).toISOString();
    const level = LogLevelNames[logRecord.level] || 'UNKNOWN';
    const color = this.colors[level] || '';
    const reset = this.colors.RESET;
    const message = logRecord.message;
    
    let formatted = `${color}[${timestamp}] [${level}] ${message}${reset}`;
    
    if (logRecord.meta) {
      const metaStr = util.inspect(logRecord.meta, {
        colors: true,
        depth: 3,
        compact: true
      });
      formatted += ` ${metaStr}`;
    }
    
    if (logRecord.stack) {
      formatted += `\n${logRecord.stack}`;
    }
    
    return formatted;
  }
}

/**
 * 日志输出器基类
 */
class LogAppender {
  append(logRecord) {
    throw new Error('必须实现append方法');
  }
  
  async shutdown() {
    // 默认实现
  }
}

/**
 * 控制台输出器
 */
class ConsoleAppender extends LogAppender {
  constructor(formatter = new ColoredConsoleFormatter()) {
    super();
    this.formatter = formatter;
  }
  
  append(logRecord) {
    const formatted = this.formatter.format(logRecord);
    
    switch (logRecord.level) {
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(formatted);
        break;
      case LogLevel.WARN:
        console.warn(formatted);
        break;
      case LogLevel.INFO:
        console.info(formatted);
        break;
      default:
        console.log(formatted);
    }
  }
}

/**
 * 文件输出器
 */
class FileAppender extends LogAppender {
  constructor(options = {}) {
    super();
    this.options = {
      filename: path.join(process.cwd(), 'logs', 'app.log'),
      formatter: new SimpleFormatter(),
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      ...options
    };
    
    this.formatter = this.options.formatter;
    this.fileStream = null;
    this.currentSize = 0;
    this.fileIndex = 0;
    
    // 确保日志目录存在
    this.ensureLogDirectory();
  }
  
  async ensureLogDirectory() {
    const logDir = path.dirname(this.options.filename);
    try {
      await fs.mkdir(logDir, { recursive: true });
    } catch (error) {
      console.error('创建日志目录失败:', error.message);
    }
  }
  
  async getFileStream() {
    if (!this.fileStream) {
      try {
        // 获取文件信息以跟踪大小
        try {
          const stats = await fs.stat(this.options.filename);
          this.currentSize = stats.size;
        } catch (error) {
          // 文件不存在，从头开始
          this.currentSize = 0;
        }
        
        this.fileStream = await fs.open(this.options.filename, 'a');
      } catch (error) {
        console.error('打开日志文件失败:', error.message);
      }
    }
    
    return this.fileStream;
  }
  
  async append(logRecord) {
    try {
      const formatted = this.formatter.format(logRecord) + '\n';
      
      // 检查是否需要轮转日志
      if (this.currentSize + formatted.length >= this.options.maxFileSize) {
        await this.rotateLog();
      }
      
      const fileStream = await this.getFileStream();
      if (fileStream) {
        await fileStream.write(formatted);
        this.currentSize += formatted.length;
      }
    } catch (error) {
      console.error('写入日志文件失败:', error.message);
    }
  }
  
  async rotateLog() {
    // 关闭当前文件流
    if (this.fileStream) {
      await this.fileStream.close();
      this.fileStream = null;
    }
    
    const baseName = this.options.filename;
    const ext = path.extname(baseName);
    const nameWithoutExt = baseName.replace(ext, '');
    
    // 删除最旧的日志文件
    const oldestLog = `${nameWithoutExt}.${this.options.maxFiles - 1}${ext}`;
    try {
      await fs.unlink(oldestLog);
    } catch (error) {
      // 文件可能不存在，忽略错误
    }
    
    // 将现有日志文件向后移动
    for (let i = this.options.maxFiles - 2; i >= 0; i--) {
      const source = `${nameWithoutExt}${i > 0 ? `.${i}` : ''}${ext}`;
      const target = `${nameWithoutExt}.${i + 1}${ext}`;
      
      try {
        await fs.rename(source, target);
      } catch (error) {
        // 文件可能不存在，忽略错误
      }
    }
    
    // 重置计数器
    this.currentSize = 0;
    this.fileIndex = 0;
  }
  
  async shutdown() {
    if (this.fileStream) {
      await this.fileStream.close();
      this.fileStream = null;
    }
  }
}

/**
 * 日志过滤器
 */
class LogFilter {
  constructor(options = {}) {
    this.options = {
      minLevel: LogLevel.DEBUG,
      maxLevel: LogLevel.FATAL,
      excludePatterns: [],
      includePatterns: [],
      ...options
    };
  }
  
  shouldLog(logRecord) {
    // 检查日志级别
    if (logRecord.level < this.options.minLevel || logRecord.level > this.options.maxLevel) {
      return false;
    }
    
    // 检查包含模式
    if (this.options.includePatterns.length > 0) {
      const hasMatch = this.options.includePatterns.some(pattern => {
        return typeof logRecord.message === 'string' && 
               logRecord.message.match(pattern);
      });
      
      if (!hasMatch) {
        return false;
      }
    }
    
    // 检查排除模式
    if (this.options.excludePatterns.length > 0) {
      const hasMatch = this.options.excludePatterns.some(pattern => {
        return typeof logRecord.message === 'string' && 
               logRecord.message.match(pattern);
      });
      
      if (hasMatch) {
        return false;
      }
    }
    
    return true;
  }
}

/**
 * 日志记录器类
 */
class Logger {
  constructor(options = {}) {
    this.options = {
      name: 'root',
      level: LogLevel.DEBUG,
      appenders: [new ConsoleAppender()],
      filters: [],
      ...options
    };
    
    this.name = this.options.name;
    this.level = this.options.level;
    this.appenders = this.options.appenders;
    this.filters = this.options.filters;
    
    // 缓存日志级别检查
    this.isTraceEnabled = this.level <= LogLevel.TRACE;
    this.isDebugEnabled = this.level <= LogLevel.DEBUG;
    this.isInfoEnabled = this.level <= LogLevel.INFO;
    this.isWarnEnabled = this.level <= LogLevel.WARN;
    this.isErrorEnabled = this.level <= LogLevel.ERROR;
    this.isFatalEnabled = this.level <= LogLevel.FATAL;
  }
  
  /**
   * 创建子记录器
   * @param {string} name - 子记录器名称
   * @returns {Logger} 子记录器实例
   */
  getLogger(name) {
    const fullName = this.name === 'root' ? name : `${this.name}.${name}`;
    return new Logger({
      ...this.options,
      name: fullName
    });
  }
  
  /**
   * 设置日志级别
   * @param {number|string} level - 日志级别
   */
  setLevel(level) {
    if (typeof level === 'string') {
      const levelUpper = level.toUpperCase();
      const levelValue = Object.values(LogLevel).find(
        (v, k) => k === levelUpper
      );
      if (levelValue !== undefined) {
        this.level = levelValue;
      }
    } else if (typeof level === 'number' && level >= 0 && level <= 6) {
      this.level = level;
    }
    
    // 更新缓存
    this.isTraceEnabled = this.level <= LogLevel.TRACE;
    this.isDebugEnabled = this.level <= LogLevel.DEBUG;
    this.isInfoEnabled = this.level <= LogLevel.INFO;
    this.isWarnEnabled = this.level <= LogLevel.WARN;
    this.isErrorEnabled = this.level <= LogLevel.ERROR;
    this.isFatalEnabled = this.level <= LogLevel.FATAL;
  }
  
  /**
   * 添加输出器
   * @param {LogAppender} appender - 日志输出器
   */
  addAppender(appender) {
    if (appender instanceof LogAppender) {
      this.appenders.push(appender);
    }
  }
  
  /**
   * 添加过滤器
   * @param {LogFilter} filter - 日志过滤器
   */
  addFilter(filter) {
    if (filter instanceof LogFilter) {
      this.filters.push(filter);
    }
  }
  
  /**
   * 记录日志
   * @private
   */
  _log(level, message, meta) {
    if (level < this.level) {
      return;
    }
    
    // 处理错误对象
    let error = null;
    let stack = null;
    
    if (message instanceof Error) {
      error = message;
      message = error.message;
      stack = error.stack;
    }
    
    // 如果meta中包含错误对象，提取stack
    if (meta && meta.error instanceof Error) {
      stack = meta.error.stack;
    }
    
    const logRecord = {
      timestamp: Date.now(),
      level,
      name: this.name,
      message,
      meta,
      stack
    };
    
    // 应用过滤器
    for (const filter of this.filters) {
      if (!filter.shouldLog(logRecord)) {
        return;
      }
    }
    
    // 通过所有输出器输出
    for (const appender of this.appenders) {
      appender.append(logRecord);
    }
  }
  
  // 各级别日志方法
  trace(message, meta) {
    this._log(LogLevel.TRACE, message, meta);
  }
  
  debug(message, meta) {
    this._log(LogLevel.DEBUG, message, meta);
  }
  
  info(message, meta) {
    this._log(LogLevel.INFO, message, meta);
  }
  
  warn(message, meta) {
    this._log(LogLevel.WARN, message, meta);
  }
  
  error(message, meta) {
    this._log(LogLevel.ERROR, message, meta);
  }
  
  fatal(message, meta) {
    this._log(LogLevel.FATAL, message, meta);
  }
  
  // 条件日志方法
  traceIf(condition, message, meta) {
    if (condition) {
      this.trace(message, meta);
    }
  }
  
  debugIf(condition, message, meta) {
    if (condition) {
      this.debug(message, meta);
    }
  }
  
  infoIf(condition, message, meta) {
    if (condition) {
      this.info(message, meta);
    }
  }
  
  // 带计时的日志方法
  time(label) {
    this.timeStart = Date.now();
    this.timeLabel = label || 'operation';
    return this.timeLabel;
  }
  
  timeEnd(label) {
    const endTime = Date.now();
    const startTime = this.timeStart;
    const finalLabel = label || this.timeLabel || 'operation';
    
    if (startTime) {
      const duration = endTime - startTime;
      this.debug(`${finalLabel} 完成时间: ${duration}ms`);
      return duration;
    }
    
    return 0;
  }
  
  /**
   * 异步关闭所有输出器
   */
  async shutdown() {
    const promises = this.appenders.map(appender => appender.shutdown());
    await Promise.all(promises);
  }
}

/**
 * 日志工具主类
 */
class LoggerUtils {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   */
  constructor(options = {}) {
    this.options = options;
    this.loggers = new Map();
    this.rootLogger = new Logger(options);
    this.loggers.set('root', this.rootLogger);
  }
  
  /**
   * 获取日志记录器
   * @param {string} [name='root'] - 记录器名称
   * @returns {Logger} 日志记录器实例
   */
  getLogger(name = 'root') {
    if (!this.loggers.has(name)) {
      // 处理层级名称
      const parts = name.split('.');
      let parent = this.rootLogger;
      let currentName = '';
      
      for (const part of parts) {
        currentName = currentName ? `${currentName}.${part}` : part;
        
        if (!this.loggers.has(currentName)) {
          const logger = parent.getLogger(part);
          this.loggers.set(currentName, logger);
          parent = logger;
        } else {
          parent = this.loggers.get(currentName);
        }
      }
    }
    
    return this.loggers.get(name);
  }
  
  /**
   * 设置全局日志级别
   * @param {number|string} level - 日志级别
   */
  setGlobalLevel(level) {
    this.rootLogger.setLevel(level);
    
    // 更新所有已创建的记录器
    for (const logger of this.loggers.values()) {
      logger.setLevel(level);
    }
  }
  
  /**
   * 为所有记录器添加输出器
   * @param {LogAppender} appender - 日志输出器
   */
  addGlobalAppender(appender) {
    this.rootLogger.addAppender(appender);
    
    // 为所有已创建的记录器添加
    for (const logger of this.loggers.values()) {
      logger.addAppender(appender);
    }
  }
  
  /**
   * 为所有记录器添加过滤器
   * @param {LogFilter} filter - 日志过滤器
   */
  addGlobalFilter(filter) {
    this.rootLogger.addFilter(filter);
    
    // 为所有已创建的记录器添加
    for (const logger of this.loggers.values()) {
      logger.addFilter(filter);
    }
  }
  
  /**
   * 创建默认配置的日志系统
   * @param {Object} options - 配置选项
   * @returns {LoggerUtils} 日志工具实例
   */
  static createDefault(options = {}) {
    const env = process.env.NODE_ENV || 'development';
    const defaultLevel = env === 'production' ? LogLevel.INFO : LogLevel.DEBUG;
    
    const loggerOptions = {
      level: defaultLevel,
      appenders: [
        new ConsoleAppender(),
        new FileAppender({
          filename: path.join(process.cwd(), 'logs', 'app.log')
        })
      ],
      ...options
    };
    
    return new LoggerUtils(loggerOptions);
  }
  
  /**
   * 异步关闭所有记录器
   */
  async shutdown() {
    const promises = Array.from(this.loggers.values()).map(logger => logger.shutdown());
    await Promise.all(promises);
  }
  
  // 导出枚举和工具类
  get LogLevel() {
    return LogLevel;
  }
  
  get LogFormatter() {
    return LogFormatter;
  }
  
  get LogAppender() {
    return LogAppender;
  }
  
  get LogFilter() {
    return LogFilter;
  }
}

// 单例模式
let instance = null;

function getInstance(options = {}) {
  if (!instance) {
    instance = LoggerUtils.createDefault(options);
  }
  return instance;
}

// 默认导出根记录器，方便直接使用
const rootLogger = getInstance().getLogger();

module.exports = {
  LoggerUtils,
  getInstance,
  LogLevel,
  LogFormatter,
  SimpleFormatter,
  JsonFormatter,
  ColoredConsoleFormatter,
  LogAppender,
  ConsoleAppender,
  FileAppender,
  LogFilter,
  Logger,
  // 默认导出根记录器
  ...rootLogger,
  // 兼容性导出
  default: rootLogger
};