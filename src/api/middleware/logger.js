/**
 * 日志中间件
 * 提供请求日志记录、错误日志记录和性能监控功能
 */

// 日志级别枚举
const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
  TRACE: 'TRACE'
};

/**
 * 获取当前时间戳（格式化）
 */
const getTimestamp = () => {
  return new Date().toISOString();
};

/**
 * 格式化日志信息
 */
const formatLog = (level, message, data = null) => {
  const timestamp = getTimestamp();
  const formattedData = data ? ` ${JSON.stringify(data)}` : '';
  return `[${timestamp}] [${level}] ${message}${formattedData}`;
};

/**
 * 日志记录器
 */
export const logger = {
  /**
   * 错误日志
   */
  error: (message, data = null) => {
    console.error(formatLog(LOG_LEVELS.ERROR, message, data));
  },

  /**
   * 警告日志
   */
  warn: (message, data = null) => {
    console.warn(formatLog(LOG_LEVELS.WARN, message, data));
  },

  /**
   * 信息日志
   */
  info: (message, data = null) => {
    console.info(formatLog(LOG_LEVELS.INFO, message, data));
  },

  /**
   * 调试日志
   */
  debug: (message, data = null) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(formatLog(LOG_LEVELS.DEBUG, message, data));
    }
  },

  /**
   * 跟踪日志
   */
  trace: (message, data = null) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(formatLog(LOG_LEVELS.TRACE, message, data));
    }
  }
};

/**
 * 清理敏感数据
 */
const sanitizeData = (data) => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sanitized = { ...data };
  const sensitiveFields = ['password', 'token', 'secret', 'creditCard', 'ssn', 'auth'];

  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '***REDACTED***';
    }
    // 检查嵌套对象
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = sanitizeData(sanitized[key]);
      }
    });
  });

  return sanitized;
};

/**
 * 请求日志中间件
 * 记录所有HTTP请求的详细信息
 */
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  const startTime = new Date().toISOString();
  const { method, url, headers, query, body, ip } = req;

  // 获取用户信息
  const userInfo = req.user ? {
    id: req.user.id,
    username: req.user.username,
    role: req.user.role
  } : null;

  // 清理请求体中的敏感数据
  const sanitizedBody = sanitizeData(body);

  // 记录请求开始
  logger.debug('Request received', {
    method,
    url,
    ip,
    userAgent: headers['user-agent'],
    user: userInfo,
    timestamp: startTime
  });

  // 拦截响应结束事件
  const originalSend = res.send;
  res.send = function(body) {
    // 计算响应时间
    const responseTime = Date.now() - start;
    const endTime = new Date().toISOString();
    
    // 获取响应状态码
    const statusCode = res.statusCode;
    
    // 确定日志级别
    let logLevel;
    if (statusCode >= 500) {
      logLevel = logger.error;
    } else if (statusCode >= 400) {
      logLevel = logger.warn;
    } else {
      logLevel = logger.info;
    }
    
    // 记录请求日志
    logLevel('Request completed', {
      method,
      url,
      statusCode,
      responseTime: `${responseTime}ms`,
      startTime,
      endTime,
      ip,
      userAgent: headers['user-agent'],
      user: userInfo,
      query: query || {},
      body: sanitizedBody,
      // 对于错误响应，记录响应体的一部分用于调试
      responseSample: statusCode >= 400 && body ? 
        typeof body === 'string' ? body.substring(0, 500) : JSON.stringify(body).substring(0, 500)
        : null
    });

    // 调用原始的send方法
    return originalSend.call(this, body);
  };

  next();
};

/**
 * 错误日志中间件
 * 捕获并记录所有错误
 */
export const errorLogger = (err, req, res, next) => {
  const { method, url, ip, user, body } = req;
  const sanitizedBody = sanitizeData(body);
  
  // 根据错误类型记录不同级别的日志
  if (err.name === 'UnauthorizedError' || err.statusCode === 401) {
    logger.warn('Authentication error', {
      error: {
        name: err.name,
        message: err.message
      },
      request: {
        method,
        url,
        ip
      }
    });
  } else if (err.statusCode === 400 || err.name === 'ValidationError') {
    logger.warn('Validation error', {
      error: {
        name: err.name,
        message: err.message
      },
      request: {
        method,
        url,
        body: sanitizedBody
      }
    });
  } else if (err.statusCode === 403) {
    logger.warn('Forbidden access', {
      error: {
        name: err.name,
        message: err.message
      },
      request: {
        method,
        url,
        user: user ? { id: user.id, role: user.role } : null
      }
    });
  } else {
    // 记录详细的错误日志
    logger.error('Internal server error', {
      error: {
        name: err.name,
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      },
      request: {
        method,
        url,
        ip,
        user: user ? { id: user.id, username: user.username, role: user.role } : null,
        body: sanitizedBody
      }
    });
  }

  next(err);
};

/**
 * 性能监控中间件
 * 记录慢请求和性能指标
 */
export const performanceLogger = (threshold = 500) => {
  return (req, res, next) => {
    const start = Date.now();
    const { method, url } = req;
    
    // 拦截响应结束
    res.on('finish', () => {
      const duration = Date.now() - start;
      
      // 如果请求超过阈值，记录为慢请求
      if (duration > threshold) {
        logger.warn('Slow request detected', {
          method,
          url,
          duration: `${duration}ms`,
          threshold: `${threshold}ms`,
          statusCode: res.statusCode,
          user: req.user ? { id: req.user.id, role: req.user.role } : null
        });
      }
    });
    
    next();
  };
};

/**
 * 路由访问统计中间件
 */
export const routeStatistics = (stats = {}) => {
  return (req, res, next) => {
    const route = `${req.method} ${req.path}`;
    
    // 初始化路由统计
    if (!stats[route]) {
      stats[route] = {
        count: 0,
        totalTime: 0,
        errors: 0,
        lastAccessed: null
      };
    }
    
    const start = Date.now();
    
    // 记录请求开始
    stats[route].count += 1;
    stats[route].lastAccessed = new Date().toISOString();
    
    // 拦截响应结束
    res.on('finish', () => {
      const duration = Date.now() - start;
      stats[route].totalTime += duration;
      
      // 记录错误
      if (res.statusCode >= 400) {
        stats[route].errors += 1;
      }
    });
    
    next();
  };
};

/**
 * 安全事件日志记录
 */
export const securityLogger = {
  /**
   * 记录登录尝试
   */
  loginAttempt: (success, username, ip, userAgent, reason = null) => {
    logger[success ? 'info' : 'warn'](success ? 'Login successful' : 'Login failed', {
      success,
      username,
      ip,
      userAgent,
      reason
    });
  },
  
  /**
   * 记录权限提升
   */
  privilegeEscalation: (userId, username, action, resource) => {
    logger.warn('Privilege escalation attempt', {
      userId,
      username,
      action,
      resource
    });
  },
  
  /**
   * 记录敏感操作
   */
  sensitiveOperation: (userId, username, action, resource, details = null) => {
    logger.info('Sensitive operation performed', {
      userId,
      username,
      action,
      resource,
      details
    });
  },
  
  /**
   * 记录数据访问
   */
  dataAccess: (userId, username, dataType, action, recordsAffected = 1) => {
    logger.debug('Data access', {
      userId,
      username,
      dataType,
      action,
      recordsAffected
    });
  }
};

/**
 * API调用日志
 */
export const apiLogger = {
  /**
   * 记录API调用开始
   */
  start: (req) => {
    req.apiCallId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    req.apiStartTime = Date.now();
    
    logger.debug('API call started', {
      callId: req.apiCallId,
      endpoint: `${req.method} ${req.path}`,
      userId: req.user ? req.user.id : null
    });
  },
  
  /**
   * 记录API调用结束
   */
  end: (req, res, success) => {
    if (req.apiCallId) {
      const duration = Date.now() - req.apiStartTime;
      
      logger.debug('API call ended', {
        callId: req.apiCallId,
        endpoint: `${req.method} ${req.path}`,
        success,
        duration: `${duration}ms`,
        statusCode: res.statusCode,
        userId: req.user ? req.user.id : null
      });
    }
  }
};

/**
 * API调用追踪中间件
 */
export const apiTracing = (req, res, next) => {
  apiLogger.start(req);
  
  // 拦截响应结束
  const originalSend = res.send;
  res.send = function(body) {
    const success = res.statusCode >= 200 && res.statusCode < 400;
    apiLogger.end(req, res, success);
    return originalSend.call(this, body);
  };
  
  next();
};

/**
 * 生成唯一请求ID中间件
 */
export const requestId = (req, res, next) => {
  // 如果请求头中有X-Request-ID，使用它，否则生成新的
  const requestId = req.headers['x-request-id'] || Date.now().toString(36) + Math.random().toString(36).substr(2);
  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
};

/**
 * 日志中间件组合
 */
export const combineLoggers = (...loggers) => {
  return (req, res, next) => {
    let index = 0;
    
    const callNextLogger = (err) => {
      if (err) {
        return next(err);
      }
      
      if (index < loggers.length) {
        const currentLogger = loggers[index];
        index++;
        currentLogger(req, res, callNextLogger);
      } else {
        next();
      }
    };
    
    callNextLogger();
  };
};

export default {
  logger,
  requestLogger,
  errorLogger,
  performanceLogger,
  routeStatistics,
  securityLogger,
  apiLogger,
  apiTracing,
  requestId,
  combineLoggers,
  LOG_LEVELS
};