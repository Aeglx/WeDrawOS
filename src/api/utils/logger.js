const path = require('path');
const fs = require('fs');

// 确保日志目录存在
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// 创建日志文件
const logFile = path.join(logsDir, `app-${new Date().toISOString().split('T')[0]}.log`);

/**
 * 日志级别枚举
 */
const LogLevel = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

/**
 * 日志工具类
 */
class Logger {
  constructor() {
    this.logLevel = process.env.LOG_LEVEL || LogLevel.INFO;
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  /**
   * 生成时间戳
   * @returns {string} 格式化的时间戳
   */
  getTimestamp() {
    return new Date().toISOString();
  }

  /**
   * 记录日志到文件
   * @param {string} level - 日志级别
   * @param {string} message - 日志消息
   * @param {object} meta - 额外元数据
   */
  logToFile(level, message, meta = {}) {
    try {
      const logEntry = {
        timestamp: this.getTimestamp(),
        level,
        message,
        meta
      };

      const logString = JSON.stringify(logEntry) + '\n';
      fs.appendFileSync(logFile, logString);
    } catch (error) {
      // 如果写入日志文件失败，回退到控制台
      console.error(`无法写入日志文件: ${error.message}`);
    }
  }

  /**
   * 判断日志级别是否应该被记录
   * @param {string} level - 要检查的日志级别
   * @returns {boolean} 是否应该记录
   */
  shouldLog(level) {
    const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG];
    return levels.indexOf(level) <= levels.indexOf(this.logLevel);
  }

  /**
   * 记录调试日志
   * @param {string} message - 日志消息
   * @param {object} meta - 额外元数据
   */
  debug(message, meta = {}) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(`[DEBUG] ${message}`, meta);
      if (this.isProduction) {
        this.logToFile(LogLevel.DEBUG, message, meta);
      }
    }
  }

  /**
   * 记录信息日志
   * @param {string} message - 日志消息
   * @param {object} meta - 额外元数据
   */
  info(message, meta = {}) {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(`[INFO] ${message}`);
      if (meta && Object.keys(meta).length > 0) {
        console.log('  Meta:', meta);
      }
      this.logToFile(LogLevel.INFO, message, meta);
    }
  }

  /**
   * 记录警告日志
   * @param {string} message - 日志消息
   * @param {object} meta - 额外元数据
   */
  warn(message, meta = {}) {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(`[WARN] ${message}`);
      if (meta && Object.keys(meta).length > 0) {
        console.warn('  Meta:', meta);
      }
      this.logToFile(LogLevel.WARN, message, meta);
    }
  }

  /**
   * 记录错误日志
   * @param {string} message - 日志消息
   * @param {Error} error - 错误对象
   */
  error(message, error = {}) {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(`[ERROR] ${message}`);
      if (error instanceof Error) {
        console.error('  Error:', error.message);
        if (this.logLevel === LogLevel.DEBUG) {
          console.error('  Stack:', error.stack);
        }
      } else if (typeof error === 'object' && error !== null) {
        console.error('  Error details:', error);
      }
      this.logToFile(LogLevel.ERROR, message, {
        error: {
          message: error.message || String(error),
          stack: error.stack,
          ...error
        }
      });
    }
  }
}

// 导出单例实例
module.exports = new Logger();