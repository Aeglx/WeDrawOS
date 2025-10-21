/**
 * 全局错误处理中间件
 * 统一处理应用中的各种异常
 */

const logger = require('../../utils/logger');
const responseFormatter = require('../response/responseFormatter');

/**
 * 自定义错误类
 */
class AppError extends Error {
  constructor(code, message, statusCode = 500) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 参数验证错误类
 */
class ValidationError extends AppError {
  constructor(message, errors = null) {
    super(400, message || '参数验证失败', 400);
    this.errors = errors;
  }
}

/**
 * 认证错误类
 */
class AuthenticationError extends AppError {
  constructor(message) {
    super(401, message || '认证失败', 401);
  }
}

/**
 * 授权错误类
 */
class AuthorizationError extends AppError {
  constructor(message) {
    super(403, message || '权限不足', 403);
  }
}

/**
 * 资源不存在错误类
 */
class NotFoundError extends AppError {
  constructor(message) {
    super(404, message || '资源不存在', 404);
  }
}

/**
 * 服务器错误类
 */
class ServerError extends AppError {
  constructor(message) {
    super(500, message || '服务器内部错误', 500);
  }
}

/**
 * 错误处理中间件
 * @param {Error} err - 错误对象
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件
 */
function errorHandler(err, req, res, next) {
  // 确保错误对象存在
  if (!err) {
    return next();
  }
  
  // 记录错误日志
  logger.error('未处理的异常', err, {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip
  });
  
  // 根据错误类型返回不同的响应
  if (err instanceof AppError) {
    // 自定义错误
    if (err instanceof ValidationError) {
      responseFormatter.badRequest(res, err.message, err.errors);
    } else if (err instanceof AuthenticationError) {
      responseFormatter.unauthorized(res, err.message);
    } else if (err instanceof AuthorizationError) {
      responseFormatter.forbidden(res, err.message);
    } else if (err instanceof NotFoundError) {
      responseFormatter.notFound(res, err.message);
    } else {
      responseFormatter.error(res, err.code, err.message, null, err.statusCode);
    }
  } else if (err.name === 'SyntaxError' && err instanceof SyntaxError) {
    // JSON解析错误
    responseFormatter.badRequest(res, '请求体格式错误');
  } else if (err.name === 'ValidationError') {
    // Mongoose验证错误
    const errors = {};
    Object.keys(err.errors).forEach(key => {
      errors[key] = err.errors[key].message;
    });
    responseFormatter.badRequest(res, '数据验证失败', errors);
  } else if (err.name === 'UnauthorizedError') {
    // JWT验证错误
    responseFormatter.unauthorized(res, '令牌无效或已过期');
  } else if (err.code === 'ER_DUP_ENTRY') {
    // MySQL唯一约束错误
    responseFormatter.badRequest(res, '数据已存在');
  } else {
    // 其他未分类的错误
    const statusCode = err.statusCode || 500;
    const message = process.env.NODE_ENV === 'production' 
      ? '服务器内部错误' 
      : err.message;
    
    responseFormatter.serverError(res, message);
  }
}

module.exports = errorHandler;

// 导出错误类供其他模块使用
module.exports.AppError = AppError;
module.exports.ValidationError = ValidationError;
module.exports.AuthenticationError = AuthenticationError;
module.exports.AuthorizationError = AuthorizationError;
module.exports.NotFoundError = NotFoundError;
module.exports.ServerError = ServerError;