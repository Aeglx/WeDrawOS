/**
 * 自定义错误类
 * 提供统一的错误处理机制
 */

/**
 * 基础错误类
 */
class BaseError extends Error {
  constructor(message, statusCode, errorCode, details = {}) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode || 500;
    this.errorCode = errorCode || 'INTERNAL_ERROR';
    this.details = details;
    this.timestamp = new Date().toISOString();
    
    // 捕获堆栈跟踪
    Error.captureStackTrace(this, this.constructor);
  }
  
  /**
   * 转换为响应格式
   */
  toResponse() {
    return {
      error: this.errorCode,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp
    };
  }
}

/**
 * 400 Bad Request 错误
 */
class BadRequestError extends BaseError {
  constructor(message, details = {}) {
    super(message, 400, 'BAD_REQUEST', details);
  }
}

/**
 * 401 Unauthorized 错误
 */
class UnauthorizedError extends BaseError {
  constructor(message, details = {}) {
    super(message, 401, 'UNAUTHORIZED', details);
  }
}

/**
 * 403 Forbidden 错误
 */
class ForbiddenError extends BaseError {
  constructor(message, details = {}) {
    super(message, 403, 'FORBIDDEN', details);
  }
}

/**
 * 404 Not Found 错误
 */
class NotFoundError extends BaseError {
  constructor(message, details = {}) {
    super(message, 404, 'NOT_FOUND', details);
  }
}

/**
 * 409 Conflict 错误
 */
class ConflictError extends BaseError {
  constructor(message, details = {}) {
    super(message, 409, 'CONFLICT', details);
  }
}

/**
 * 422 Unprocessable Entity 错误
 */
class UnprocessableEntityError extends BaseError {
  constructor(message, details = {}) {
    super(message, 422, 'UNPROCESSABLE_ENTITY', details);
  }
}

/**
 * 500 Internal Server Error 错误
 */
class InternalServerError extends BaseError {
  constructor(message, details = {}) {
    super(message || '服务器内部错误', 500, 'INTERNAL_SERVER_ERROR', details);
  }
}

/**
 * 502 Bad Gateway 错误
 */
class BadGatewayError extends BaseError {
  constructor(message, details = {}) {
    super(message || '网关错误', 502, 'BAD_GATEWAY', details);
  }
}

/**
 * 503 Service Unavailable 错误
 */
class ServiceUnavailableError extends BaseError {
  constructor(message, details = {}) {
    super(message || '服务不可用', 503, 'SERVICE_UNAVAILABLE', details);
  }
}

/**
 * 验证错误类
 */
class ValidationError extends BadRequestError {
  constructor(message, validationErrors = []) {
    super(message || '验证失败', { validationErrors });
    this.name = 'ValidationError';
    this.validationErrors = validationErrors;
  }
  
  /**
   * 添加验证错误
   */
  addError(field, message) {
    this.validationErrors.push({ field, message });
    return this;
  }
  
  /**
   * 检查是否有验证错误
   */
  hasErrors() {
    return this.validationErrors.length > 0;
  }
  
  /**
   * 获取第一个错误消息
   */
  getFirstErrorMessage() {
    return this.validationErrors.length > 0 ? this.validationErrors[0].message : this.message;
  }
}

/**
 * 数据库错误类
 */
class DatabaseError extends InternalServerError {
  constructor(message, originalError = null) {
    super(message || '数据库操作失败', { originalError });
    this.name = 'DatabaseError';
    this.originalError = originalError;
  }
}

/**
 * API错误类
 */
class ApiError extends BaseError {
  constructor(message, statusCode, apiCode, details = {}) {
    super(message, statusCode, apiCode, details);
    this.name = 'ApiError';
  }
}

/**
 * WebSocket错误类
 */
class WebSocketError extends BaseError {
  constructor(message, code = 1000, details = {}) {
    super(message, 400, 'WEBSOCKET_ERROR', details);
    this.code = code;
    this.name = 'WebSocketError';
  }
}

/**
 * 错误响应格式化工具
 * @param {Error} error - 错误对象
 * @returns {Object} 格式化的错误响应
 */
const formatErrorResponse = (error) => {
  if (error instanceof BaseError) {
    return error.toResponse();
  }
  
  // 处理其他类型的错误
  return {
    error: 'UNEXPECTED_ERROR',
    message: error.message || '发生未知错误',
    statusCode: 500,
    timestamp: new Date().toISOString(),
    details: process.env.NODE_ENV === 'development' ? {
      stack: error.stack,
      originalError: error
    } : {}
  };
};

/**
 * 错误处理中间件
 * @param {Error} err - 错误对象
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件
 */
const errorHandler = (err, req, res, next) => {
  const errorResponse = formatErrorResponse(err);
  
  // 记录错误日志
  console.error('错误处理中间件捕获到错误:', {
    path: req.path,
    method: req.method,
    error: errorResponse,
    stack: err.stack
  });
  
  // 发送错误响应
  res.status(errorResponse.statusCode).json(errorResponse);
};

/**
 * 创建参数验证错误
 * @param {string} field - 字段名
 * @param {string} message - 错误消息
 * @returns {ValidationError} 验证错误对象
 */
const createValidationError = (field, message) => {
  return new ValidationError('参数验证失败', [{ field, message }]);
};

/**
 * 创建API错误
 * @param {string} message - 错误消息
 * @param {number} statusCode - HTTP状态码
 * @param {string} apiCode - 自定义API错误码
 * @param {Object} details - 附加信息
 * @returns {ApiError} API错误对象
 */
const createApiError = (message, statusCode = 500, apiCode = 'API_ERROR', details = {}) => {
  return new ApiError(message, statusCode, apiCode, details);
};

// 导出所有错误类和工具函数
module.exports = {
  BaseError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  UnprocessableEntityError,
  InternalServerError,
  BadGatewayError,
  ServiceUnavailableError,
  ValidationError,
  DatabaseError,
  ApiError,
  WebSocketError,
  formatErrorResponse,
  errorHandler,
  createValidationError,
  createApiError
};