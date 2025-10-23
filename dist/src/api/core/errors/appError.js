/**
 * 错误处理模块
 * 提供统一的错误类和错误处理工具函数
 */

/**
 * 应用程序错误类
 * 继承自原生Error，提供更丰富的错误信息
 */
class AppError extends Error {
  /**
   * 构造函数
   * @param {string} message - 错误消息
   * @param {number} statusCode - HTTP状态码
   * @param {string} errorCode - 自定义错误代码
   * @param {Object} metadata - 附加的错误元数据
   * @param {boolean} isOperational - 是否为可操作的错误
   */
  constructor(message, statusCode = 500, errorCode = 'INTERNAL_ERROR', metadata = {}, isOperational = false) {
    super(message);
    
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.metadata = metadata;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    
    // 设置错误状态
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    
    // 捕获堆栈跟踪
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * 将错误转换为响应对象
   * @param {boolean} isDev - 是否为开发环境
   * @returns {Object} 格式化的错误响应对象
   */
  toResponse(isDev = false) {
    const response = {
      status: this.status,
      errorCode: this.errorCode,
      message: this.message,
      timestamp: this.timestamp
    };

    // 在开发环境中包含更多详细信息
    if (isDev) {
      response.stack = this.stack;
      if (Object.keys(this.metadata).length > 0) {
        response.metadata = this.metadata;
      }
    }

    return response;
  }

  /**
   * 创建400 Bad Request错误
   * @param {string} message - 错误消息
   * @param {string} errorCode - 错误代码
   * @param {Object} metadata - 元数据
   * @returns {AppError} 错误实例
   */
  static badRequest(message = 'Bad request', errorCode = 'BAD_REQUEST', metadata = {}) {
    return new AppError(message, 400, errorCode, metadata, true);
  }

  /**
   * 创建401 Unauthorized错误
   * @param {string} message - 错误消息
   * @param {string} errorCode - 错误代码
   * @param {Object} metadata - 元数据
   * @returns {AppError} 错误实例
   */
  static unauthorized(message = 'Unauthorized', errorCode = 'UNAUTHORIZED', metadata = {}) {
    return new AppError(message, 401, errorCode, metadata, true);
  }

  /**
   * 创建403 Forbidden错误
   * @param {string} message - 错误消息
   * @param {string} errorCode - 错误代码
   * @param {Object} metadata - 元数据
   * @returns {AppError} 错误实例
   */
  static forbidden(message = 'Forbidden', errorCode = 'FORBIDDEN', metadata = {}) {
    return new AppError(message, 403, errorCode, metadata, true);
  }

  /**
   * 创建404 Not Found错误
   * @param {string} message - 错误消息
   * @param {string} errorCode - 错误代码
   * @param {Object} metadata - 元数据
   * @returns {AppError} 错误实例
   */
  static notFound(message = 'Resource not found', errorCode = 'NOT_FOUND', metadata = {}) {
    return new AppError(message, 404, errorCode, metadata, true);
  }

  /**
   * 创建409 Conflict错误
   * @param {string} message - 错误消息
   * @param {string} errorCode - 错误代码
   * @param {Object} metadata - 元数据
   * @returns {AppError} 错误实例
   */
  static conflict(message = 'Conflict', errorCode = 'CONFLICT', metadata = {}) {
    return new AppError(message, 409, errorCode, metadata, true);
  }

  /**
   * 创建422 Unprocessable Entity错误
   * @param {string} message - 错误消息
   * @param {string} errorCode - 错误代码
   * @param {Object} validationErrors - 验证错误详情
   * @returns {AppError} 错误实例
   */
  static validationError(message = 'Validation failed', errorCode = 'VALIDATION_ERROR', validationErrors = {}) {
    return new AppError(message, 422, errorCode, { validationErrors }, true);
  }

  /**
   * 创建500 Internal Server错误
   * @param {string} message - 错误消息
   * @param {string} errorCode - 错误代码
   * @param {Object} metadata - 元数据
   * @returns {AppError} 错误实例
   */
  static internalError(message = 'Internal server error', errorCode = 'INTERNAL_ERROR', metadata = {}) {
    return new AppError(message, 500, errorCode, metadata, false);
  }

  /**
   * 创建502 Bad Gateway错误
   * @param {string} message - 错误消息
   * @param {string} errorCode - 错误代码
   * @param {Object} metadata - 元数据
   * @returns {AppError} 错误实例
   */
  static badGateway(message = 'Bad gateway', errorCode = 'BAD_GATEWAY', metadata = {}) {
    return new AppError(message, 502, errorCode, metadata, true);
  }

  /**
   * 创建503 Service Unavailable错误
   * @param {string} message - 错误消息
   * @param {string} errorCode - 错误代码
   * @param {Object} metadata - 元数据
   * @returns {AppError} 错误实例
   */
  static serviceUnavailable(message = 'Service unavailable', errorCode = 'SERVICE_UNAVAILABLE', metadata = {}) {
    return new AppError(message, 503, errorCode, metadata, true);
  }
}

/**
 * 数据库错误类
 * 专门用于数据库相关错误
 */
class DatabaseError extends AppError {
  /**
   * 构造函数
   * @param {string} message - 错误消息
   * @param {string} errorCode - 错误代码
   * @param {string} query - SQL查询
   * @param {Array} params - 查询参数
   * @param {Error} originalError - 原始错误
   */
  constructor(message, errorCode = 'DATABASE_ERROR', query = '', params = [], originalError = null) {
    super(message, 500, errorCode, {
      query,
      params,
      originalError: originalError ? originalError.message : null
    }, true);
    this.originalError = originalError;
  }

  /**
   * 从SQL错误创建数据库错误
   * @param {Error} sqlError - SQL错误对象
   * @param {string} query - SQL查询
   * @param {Array} params - 查询参数
   * @returns {DatabaseError} 数据库错误实例
   */
  static fromSqlError(sqlError, query = '', params = []) {
    let message = 'Database operation failed';
    let errorCode = 'DATABASE_ERROR';

    // 根据错误代码定制消息
    if (sqlError.code) {
      switch (sqlError.code) {
        case 'ER_DUP_ENTRY':
          message = 'Duplicate entry found';
          errorCode = 'DUPLICATE_ENTRY';
          break;
        case 'ER_NO_REFERENCED_ROW_2':
          message = 'Foreign key constraint violation';
          errorCode = 'FOREIGN_KEY_CONSTRAINT';
          break;
        case 'ER_DATA_TOO_LONG':
          message = 'Data too long for column';
          errorCode = 'DATA_TOO_LONG';
          break;
        case 'ER_ACCESS_DENIED_ERROR':
          message = 'Database access denied';
          errorCode = 'ACCESS_DENIED';
          break;
        case 'ER_BAD_DB_ERROR':
          message = 'Database does not exist';
          errorCode = 'DATABASE_NOT_FOUND';
          break;
        case 'ER_CONN_HOST_ERROR':
          message = 'Database connection error';
          errorCode = 'CONNECTION_ERROR';
          break;
      }
    }

    return new DatabaseError(message, errorCode, query, params, sqlError);
  }
}

/**
 * 认证错误类
 * 专门用于认证相关错误
 */
class AuthenticationError extends AppError {
  /**
   * 构造函数
   * @param {string} message - 错误消息
   * @param {string} errorCode - 错误代码
   * @param {Object} metadata - 元数据
   */
  constructor(message, errorCode = 'AUTHENTICATION_ERROR', metadata = {}) {
    super(message, 401, errorCode, metadata, true);
  }

  /**
   * 创建令牌无效错误
   * @param {string} message - 错误消息
   * @returns {AuthenticationError} 认证错误实例
   */
  static invalidToken(message = 'Invalid token') {
    return new AuthenticationError(message, 'INVALID_TOKEN');
  }

  /**
   * 创建令牌过期错误
   * @param {string} message - 错误消息
   * @returns {AuthenticationError} 认证错误实例
   */
  static expiredToken(message = 'Token expired') {
    return new AuthenticationError(message, 'EXPIRED_TOKEN');
  }

  /**
   * 创建凭据错误
   * @param {string} message - 错误消息
   * @returns {AuthenticationError} 认证错误实例
   */
  static invalidCredentials(message = 'Invalid credentials') {
    return new AuthenticationError(message, 'INVALID_CREDENTIALS');
  }
}

/**
 * 授权错误类
 * 专门用于授权相关错误
 */
class AuthorizationError extends AppError {
  /**
   * 构造函数
   * @param {string} message - 错误消息
   * @param {string} errorCode - 错误代码
   * @param {string} requiredPermission - 所需权限
   * @param {Object} metadata - 元数据
   */
  constructor(message, errorCode = 'AUTHORIZATION_ERROR', requiredPermission = null, metadata = {}) {
    super(message, 403, errorCode, {
      requiredPermission,
      ...metadata
    }, true);
    this.requiredPermission = requiredPermission;
  }
}

/**
 * 验证错误类
 * 专门用于输入验证错误
 */
class ValidationError extends AppError {
  /**
   * 构造函数
   * @param {string} message - 错误消息
   * @param {Object} validationErrors - 验证错误详情
   */
  constructor(message, validationErrors = {}) {
    super(message, 422, 'VALIDATION_ERROR', { validationErrors }, true);
    this.validationErrors = validationErrors;
  }

  /**
   * 从Joi验证错误创建验证错误
   * @param {Error} joiError - Joi验证错误
   * @returns {ValidationError} 验证错误实例
   */
  static fromJoiError(joiError) {
    const validationErrors = {};
    
    if (joiError.details) {
      joiError.details.forEach(detail => {
        const field = detail.path.join('.');
        validationErrors[field] = detail.message;
      });
    }

    return new ValidationError('Validation failed', validationErrors);
  }

  /**
   * 从Express-validator错误创建验证错误
   * @param {Array} errors - Express-validator错误数组
   * @returns {ValidationError} 验证错误实例
   */
  static fromExpressValidator(errors) {
    const validationErrors = {};
    
    errors.forEach(error => {
      validationErrors[error.param] = error.msg;
    });

    return new ValidationError('Validation failed', validationErrors);
  }
}

/**
 * 文件错误类
 * 专门用于文件操作相关错误
 */
class FileError extends AppError {
  /**
   * 构造函数
   * @param {string} message - 错误消息
   * @param {string} errorCode - 错误代码
   * @param {string} filename - 文件名
   * @param {Object} metadata - 元数据
   */
  constructor(message, errorCode = 'FILE_ERROR', filename = '', metadata = {}) {
    super(message, 400, errorCode, {
      filename,
      ...metadata
    }, true);
    this.filename = filename;
  }

  /**
   * 创建文件过大错误
   * @param {string} filename - 文件名
   * @param {number} maxSize - 最大允许大小
   * @returns {FileError} 文件错误实例
   */
  static fileTooLarge(filename, maxSize) {
    return new FileError(
      `File too large. Maximum size is ${maxSize} bytes`,
      'FILE_TOO_LARGE',
      filename,
      { maxSize }
    );
  }

  /**
   * 创建文件类型不允许错误
   * @param {string} filename - 文件名
   * @param {string} mimeType - MIME类型
   * @param {Array} allowedTypes - 允许的类型
   * @returns {FileError} 文件错误实例
   */
  static invalidFileType(filename, mimeType, allowedTypes) {
    return new FileError(
      `File type ${mimeType} is not allowed`,
      'INVALID_FILE_TYPE',
      filename,
      { mimeType, allowedTypes }
    );
  }

  /**
   * 创建文件上传错误
   * @param {string} filename - 文件名
   * @param {string} reason - 错误原因
   * @returns {FileError} 文件错误实例
   */
  static uploadError(filename, reason) {
    return new FileError(
      `Failed to upload file: ${reason}`,
      'UPLOAD_ERROR',
      filename,
      { reason }
    );
  }
}

/**
 * 错误处理工具函数
 */
const errorUtils = {
  /**
   * 规范化错误
   * 将任何错误转换为AppError实例
   * @param {Error} err - 原始错误
   * @returns {AppError} 规范化的错误实例
   */
  normalizeError(err) {
    if (err instanceof AppError) {
      return err;
    }

    // 处理常见错误类型
    if (err.name === 'ValidationError') {
      return ValidationError.fromExpressValidator([err]);
    }

    if (err.name === 'JsonWebTokenError') {
      return AuthenticationError.invalidToken('Invalid token format');
    }

    if (err.name === 'TokenExpiredError') {
      return AuthenticationError.expiredToken('Token has expired');
    }

    // 数据库连接错误
    if (err.code && err.code.startsWith('ER_')) {
      return DatabaseError.fromSqlError(err);
    }

    // 默认转换为内部错误
    return AppError.internalError(
      err.message || 'An unexpected error occurred',
      'UNEXPECTED_ERROR',
      { originalError: err.message, stack: err.stack }
    );
  },

  /**
   * 格式化错误响应
   * @param {Error} err - 错误对象
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @returns {Object} 格式化的响应对象
   */
  formatErrorResponse(err, req, res) {
    const normalizedError = this.normalizeError(err);
    const isDev = process.env.NODE_ENV === 'development';
    const response = normalizedError.toResponse(isDev);
    
    // 添加请求信息（仅在开发环境）
    if (isDev && req) {
      response.request = {
        method: req.method,
        url: req.originalUrl,
        path: req.path,
        params: req.params,
        query: req.query
      };
    }

    return response;
  },

  /**
   * 创建Express错误处理中间件
   * @param {Object} logger - 日志记录器
   * @returns {Function} 错误处理中间件
   */
  createErrorHandler(logger) {
    return (err, req, res, next) => {
      const normalizedError = this.normalizeError(err);
      const response = this.formatErrorResponse(normalizedError, req, res);
      const statusCode = normalizedError.statusCode || 500;

      // 记录错误日志
      if (statusCode >= 500 || !normalizedError.isOperational) {
        logger.error(
          'Unhandled error',
          normalizedError,
          {
            path: req.path,
            method: req.method,
            statusCode,
            userId: req.user ? req.user.id : null
          }
        );
      } else {
        logger.warn(
          'Operational error',
          {
            message: normalizedError.message,
            errorCode: normalizedError.errorCode,
            path: req.path,
            method: req.method,
            statusCode
          }
        );
      }

      // 发送错误响应
      res.status(statusCode).json(response);
    };
  },

  /**
   * 捕获异步函数错误的包装器
   * @param {Function} fn - 异步函数
   * @returns {Function} 包装后的函数
   */
  catchAsync(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  },

  /**
   * 验证请求数据并返回验证错误
   * @param {Object} schema - 验证模式
   * @param {Object} data - 要验证的数据
   * @returns {ValidationError|null} 验证错误或null
   */
  validateData(schema, data) {
    try {
      const result = schema.validate(data, { abortEarly: false });
      if (result.error) {
        return ValidationError.fromJoiError(result.error);
      }
      return null;
    } catch (err) {
      return ValidationError.fromJoiError(err);
    }
  }
};

// 导出各种错误类和工具函数
module.exports = {
  AppError,
  DatabaseError,
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  FileError,
  ...errorUtils
};