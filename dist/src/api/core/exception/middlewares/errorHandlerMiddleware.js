/**
 * HTTP错误处理中间件
 * 统一处理API错误并格式化响应
 */

const logger = require('../../utils/logger');
const responseFormatter = require('../../utils/responseFormatter');
const { AppError, ValidationError, AuthenticationError, AuthorizationError, NotFoundError } = require('../handlers/errorHandler');

/**
 * 错误处理中间件
 * @param {Error} err - 错误对象
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件
 */
function errorHandler(err, req, res, next) {
  // 确保是错误对象
  const error = err instanceof Error ? err : new Error(String(err));
  
  // 记录错误日志
  logError(error, req);
  
  // 根据错误类型处理
  if (error instanceof ValidationError) {
    handleValidationError(error, req, res);
  } else if (error instanceof AuthenticationError) {
    handleAuthenticationError(error, req, res);
  } else if (error instanceof AuthorizationError) {
    handleAuthorizationError(error, req, res);
  } else if (error instanceof NotFoundError) {
    handleNotFoundError(error, req, res);
  } else if (error instanceof AppError) {
    handleAppError(error, req, res);
  } else {
    handleUnknownError(error, req, res);
  }
}

/**
 * 记录错误日志
 * @param {Error} error - 错误对象
 * @param {Object} req - 请求对象
 */
function logError(error, req) {
  const logData = {
    method: req.method,
    path: req.originalUrl,
    headers: { ...req.headers },
    query: req.query,
    body: sanitizeRequestBody(req.body),
    params: req.params,
    user: req.user || null,
    ip: req.ip,
    error: {
      message: error.message,
      stack: error.stack,
      type: error.constructor.name
    }
  };
  
  // 对于已知错误，使用warn级别
  if (error instanceof AppError) {
    logger.warn(`API错误: ${error.message}`, logData);
  } else {
    logger.error(`未处理的API错误: ${error.message}`, logData);
  }
}

/**
 * 清理请求体，移除敏感信息
 * @param {Object} body - 请求体
 * @returns {Object} 清理后的请求体
 */
function sanitizeRequestBody(body) {
  if (!body) return null;
  
  const sanitized = { ...body };
  
  // 移除敏感字段
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'creditCard', 'cvv'];
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '******';
    }
  });
  
  return sanitized;
}

/**
 * 处理验证错误
 * @param {ValidationError} error - 验证错误
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
function handleValidationError(error, req, res) {
  res.status(400).json(responseFormatter.error({
    code: 'VALIDATION_ERROR',
    message: error.message,
    details: error.details || [],
    timestamp: new Date().toISOString()
  }, 400));
}

/**
 * 处理认证错误
 * @param {AuthenticationError} error - 认证错误
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
function handleAuthenticationError(error, req, res) {
  res.status(401).json(responseFormatter.error({
    code: 'AUTHENTICATION_ERROR',
    message: error.message,
    timestamp: new Date().toISOString()
  }, 401));
}

/**
 * 处理授权错误
 * @param {AuthorizationError} error - 授权错误
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
function handleAuthorizationError(error, req, res) {
  res.status(403).json(responseFormatter.error({
    code: 'AUTHORIZATION_ERROR',
    message: error.message,
    timestamp: new Date().toISOString()
  }, 403));
}

/**
 * 处理资源未找到错误
 * @param {NotFoundError} error - 未找到错误
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
function handleNotFoundError(error, req, res) {
  res.status(404).json(responseFormatter.error({
    code: 'NOT_FOUND',
    message: error.message || '请求的资源不存在',
    timestamp: new Date().toISOString()
  }, 404));
}

/**
 * 处理应用错误
 * @param {AppError} error - 应用错误
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
function handleAppError(error, req, res) {
  const statusCode = error.statusCode || 500;
  res.status(statusCode).json(responseFormatter.error({
    code: error.code || 'APP_ERROR',
    message: error.message,
    details: error.details || null,
    timestamp: new Date().toISOString()
  }, statusCode));
}

/**
 * 处理未知错误
 * @param {Error} error - 未知错误
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
function handleUnknownError(error, req, res) {
  // 在生产环境中，不暴露详细错误信息
  const message = process.env.NODE_ENV === 'production' 
    ? '服务器内部错误，请稍后再试'
    : error.message;
  
  res.status(500).json(responseFormatter.error({
    code: 'INTERNAL_SERVER_ERROR',
    message,
    timestamp: new Date().toISOString()
  }, 500));
}

/**
 * 404错误处理中间件
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件
 */
function notFoundHandler(req, res, next) {
  const notFoundError = new NotFoundError(`请求的路径 '${req.originalUrl}' 不存在`);
  next(notFoundError);
}

/**
 * 异常捕获中间件
 * 用于捕获async函数中的异常
 * @param {Function} fn - 异步函数
 * @returns {Function} 包装后的中间件函数
 */
function asyncErrorHandler(fn) {
  return function(req, res, next) {
    Promise.resolve(fn(req, res, next))
      .catch(next);
  };
}

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncErrorHandler
};