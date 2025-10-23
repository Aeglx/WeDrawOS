/**
 * 日志工具模块
 * 提供统一的日志记录功能
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

// 日志级别
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  FATAL: 4
};

// 当前日志级别
const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL || 'INFO'];

// 日志文件配置
const LOG_DIR = process.env.LOG_DIR || path.join(__dirname, '../../../logs');
const LOG_FILE = process.env.LOG_FILE || 'app.log';
const LOG_FILE_PATH = path.join(LOG_DIR, LOG_FILE);

// 确保日志目录存在
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

/**
 * 获取格式化的时间戳
 * @returns {string} 格式化的时间戳
 */
function getTimestamp() {
  return new Date().toISOString();
}

/**
 * 日志记录器
 * @param {string} level - 日志级别
 * @param {string} message - 日志消息
 * @param {Object} data - 附加数据
 */
function logger(level, message, data = null) {
  const levelValue = LOG_LEVELS[level];
  
  // 如果当前日志级别高于要记录的级别，则不记录
  if (levelValue < currentLevel) {
    return;
  }
  
  const timestamp = getTimestamp();
  const logData = {
    timestamp,
    level,
    message
  };
  
  if (data) {
    logData.data = data;
  }
  
  const logString = JSON.stringify(logData);
  
  // 控制台输出
  console.log(logString);
  
  // 写入文件
  try {
    fs.appendFileSync(LOG_FILE_PATH, logString + '\n', 'utf8');
  } catch (error) {
    console.error('写入日志文件失败:', error);
  }
}

/**
 * 调试日志
 * @param {string} message - 日志消息
 * @param {Object} data - 附加数据
 */
function debug(message, data = null) {
  logger('DEBUG', message, data);
}

/**
 * 信息日志
 * @param {string} message - 日志消息
 * @param {Object} data - 附加数据
 */
function info(message, data = null) {
  logger('INFO', message, data);
}

/**
 * 警告日志
 * @param {string} message - 日志消息
 * @param {Object} data - 附加数据
 */
function warn(message, data = null) {
  logger('WARN', message, data);
}

/**
 * 错误日志
 * @param {string} message - 日志消息
 * @param {Error} error - 错误对象
 * @param {Object} data - 附加数据
 */
function error(message, error = null, data = null) {
  const logData = data || {};
  if (error) {
    logData.error = {
      message: error.message,
      stack: error.stack
    };
  }
  logger('ERROR', message, logData);
}

/**
 * 致命错误日志
 * @param {string} message - 日志消息
 * @param {Error} error - 错误对象
 * @param {Object} data - 附加数据
 */
function fatal(message, error = null, data = null) {
  const logData = data || {};
  if (error) {
    logData.error = {
      message: error.message,
      stack: error.stack
    };
  }
  logger('FATAL', message, logData);
  
  // 致命错误可以在这里添加其他处理，比如发送告警
}

/**
 * 请求日志中间件
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件
 */
function requestLogger(req, res, next) {
  const startTime = Date.now();
  const originalSend = res.send;
  
  // 重写send方法以捕获响应数据
  res.send = function(body) {
    const duration = Date.now() - startTime;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    };
    
    // 根据状态码决定日志级别
    if (res.statusCode >= 500) {
      error('请求失败', null, logData);
    } else if (res.statusCode >= 400) {
      warn('请求异常', null, logData);
    } else {
      debug('请求成功', logData);
    }
    
    return originalSend.call(this, body);
  };
  
  next();
}

module.exports = {
  debug,
  info,
  warn,
  error,
  fatal,
  requestLogger
};