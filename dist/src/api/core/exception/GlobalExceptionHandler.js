/**
 * 全局异常处理器
 * 统一处理应用中的各类异常，提供标准的错误响应格式
 */

const logger = require('../utils/logger');
const responseFormatter = require('./response/responseFormatter');
const { AppError, ValidationError, AuthenticationError, AuthorizationError, NotFoundError, ServerError } = require('./handlers/errorHandler');

/**
 * 全局异常处理器类
 */
class GlobalExceptionHandler {
  constructor() {
    this.logger = logger;
    this.customHandlers = new Map(); // 自定义异常处理器
    this.logger.info('全局异常处理器初始化');
  }

  /**
   * 注册自定义异常处理器
   * @param {Function|string} errorType - 错误类型或类型名称
   * @param {Function} handler - 处理函数 (err, req, res, next) => {}
   * @returns {GlobalExceptionHandler} 当前实例
   */
  registerCustomHandler(errorType, handler) {
    if (typeof handler !== 'function') {
      throw new Error('处理器必须是函数');
    }

    const typeKey = typeof errorType === 'function' ? errorType.name : String(errorType);
    this.customHandlers.set(typeKey, handler);
    this.logger.debug(`注册自定义异常处理器: ${typeKey}`);
    return this;
  }

  /**
   * 处理数据库错误
   * @param {Error} err - 数据库错误
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @returns {boolean} 是否成功处理
   */
  _handleDatabaseError(err, req, res) {
    // 处理常见数据库错误
    const dbErrorTypes = [
      'SequelizeDatabaseError',
      'SequelizeValidationError',
      'SequelizeForeignKeyConstraintError',
      'SequelizeUniqueConstraintError',
      'ER_DUP_ENTRY',
      'ER_NO_REFERENCED_ROW_2'
    ];

    if (dbErrorTypes.some(type => err.name === type || err.code === type)) {
      let message = '数据库操作失败';
      let code = 400;
      let details = null;

      if (err.name === 'SequelizeValidationError') {
        message = '数据验证失败';
        details = err.errors.map(e => e.message);
      } else if (err.name === 'SequelizeUniqueConstraintError' || err.code === 'ER_DUP_ENTRY') {
        message = '数据重复，请检查输入';
      } else if (err.name === 'SequelizeForeignKeyConstraintError' || err.code === 'ER_NO_REFERENCED_ROW_2') {
        message = '关联数据不存在';
      }

      this.logger.error(`数据库错误: ${err.message}`, { error: err, query: req.query, body: req.body });
      responseFormatter.badRequest(res, message, details);
      return true;
    }

    return false;
  }

  /**
   * 处理JWT错误
   * @param {Error} err - JWT错误
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @returns {boolean} 是否成功处理
   */
  _handleJwtError(err, req, res) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError' || err.name === 'NotBeforeError') {
      let message = '认证令牌无效';
      
      if (err.name === 'TokenExpiredError') {
        message = '认证令牌已过期';
      } else if (err.name === 'NotBeforeError') {
        message = '认证令牌尚未生效';
      }

      this.logger.warn(`JWT错误: ${err.message}`, { url: req.originalUrl });
      responseFormatter.unauthorized(res, message);
      return true;
    }

    return false;
  }

  /**
   * 处理请求验证错误
   * @param {Error} err - 验证错误
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @returns {boolean} 是否成功处理
   */
  _handleValidationError(err, req, res) {
    if (err.name === 'ValidationError' || err.name === 'SyntaxError' || err.message.includes('validation failed')) {
      let message = '请求参数验证失败';
      let details = null;

      if (err.errors) {
        details = err.errors;
      } else if (err.message) {
        details = [err.message];
      }

      this.logger.warn(`验证错误: ${err.message}`, { errors: details, body: req.body });
      responseFormatter.badRequest(res, message, details);
      return true;
    }

    return false;
  }

  /**
   * 处理文件上传错误
   * @param {Error} err - 文件上传错误
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @returns {boolean} 是否成功处理
   */
  _handleFileUploadError(err, req, res) {
    if (err.code === 'LIMIT_FILE_SIZE' || err.code === 'LIMIT_FILE_COUNT' || 
        err.code === 'LIMIT_FIELD_KEY' || err.code === 'LIMIT_UNEXPECTED_FILE') {
      let message = '文件上传失败';
      
      switch (err.code) {
        case 'LIMIT_FILE_SIZE':
          message = '文件大小超过限制';
          break;
        case 'LIMIT_FILE_COUNT':
          message = '文件数量超过限制';
          break;
        case 'LIMIT_UNEXPECTED_FILE':
          message = '不允许的文件类型';
          break;
      }

      this.logger.warn(`文件上传错误: ${err.code}`, { error: err });
      responseFormatter.badRequest(res, message);
      return true;
    }

    return false;
  }

  /**
   * 处理系统级错误
   * @param {Error} err - 系统错误
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  _handleSystemError(err, req, res) {
    // 记录详细错误信息
    this.logger.error('系统内部错误', {
      error: {
        message: err.message,
        stack: err.stack,
        name: err.name
      },
      request: {
        url: req.originalUrl,
        method: req.method,
        headers: req.headers,
        body: this._sanitizeData(req.body),
        query: req.query,
        params: req.params
      }
    });

    // 返回安全的错误信息给客户端
    const errorMessage = process.env.NODE_ENV === 'production' 
      ? '服务器内部错误，请稍后重试' 
      : err.message;

    responseFormatter.serverError(res, errorMessage);
  }

  /**
   * 清理敏感数据
   * @private
   * @param {Object} data - 要清理的数据
   * @returns {Object} 清理后的数据
   */
  _sanitizeData(data) {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sanitized = { ...data };
    const sensitiveFields = ['password', 'token', 'secret', 'creditCard', 'cvv'];

    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '***';
      }
    });

    return sanitized;
  }

  /**
   * 创建Express错误处理中间件
   * @returns {Function} 中间件函数
   */
  createMiddleware() {
    const self = this;

    return function errorHandlerMiddleware(err, req, res, next) {
      // 确保错误对象存在
      if (!err) {
        return next();
      }

      try {
        // 检查是否有自定义处理器
        const customHandler = self.customHandlers.get(err.name) || self.customHandlers.get('*');
        if (customHandler) {
          const handled = customHandler(err, req, res, next);
          if (handled === true) {
            return;
          }
        }

        // 处理已知的错误类型
        if (err instanceof ValidationError) {
          responseFormatter.badRequest(res, err.message, err.errors);
        } else if (err instanceof AuthenticationError) {
          responseFormatter.unauthorized(res, err.message);
        } else if (err instanceof AuthorizationError) {
          responseFormatter.forbidden(res, err.message);
        } else if (err instanceof NotFoundError) {
          responseFormatter.notFound(res, err.message);
        } else if (err instanceof ServerError || err instanceof AppError) {
          responseFormatter.error(res, err.code, err.message, null, err.statusCode);
        } else if (self._handleDatabaseError(err, req, res)) {
          // 数据库错误已处理
        } else if (self._handleJwtError(err, req, res)) {
          // JWT错误已处理
        } else if (self._handleValidationError(err, req, res)) {
          // 验证错误已处理
        } else if (self._handleFileUploadError(err, req, res)) {
          // 文件上传错误已处理
        } else {
          // 未识别的错误，作为系统错误处理
          self._handleSystemError(err, req, res);
        }
      } catch (handlerError) {
        // 防止错误处理器本身出错
        self.logger.error('错误处理器执行失败', {
          originalError: err,
          handlerError: handlerError
        });
        responseFormatter.serverError(res, '处理错误时发生异常');
      }
    };
  }

  /**
   * 包装异步路由处理器，自动捕获异常
   * @param {Function} fn - 路由处理函数
   * @returns {Function} 包装后的处理函数
   */
  wrapAsync(fn) {
    return (req, res, next) => {
      // 确保是Promise
      Promise.resolve(fn(req, res, next))
        .catch(next);
    };
  }

  /**
   * 记录未捕获的异常
   */
  setupUncaughtExceptionHandler() {
    process.on('uncaughtException', (error) => {
      this.logger.error('未捕获的异常', {
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        },
        timestamp: new Date().toISOString()
      });
      
      // 注意：在生产环境中，应该优雅地关闭应用
      if (process.env.NODE_ENV === 'production') {
        // 可以在这里添加关闭数据库连接、清理资源等逻辑
        // process.exit(1); // 不建议直接exit，应该使用进程管理器
      }
    });

    process.on('unhandledRejection', (reason, promise) => {
      this.logger.error('未处理的Promise拒绝', {
        reason: reason instanceof Error ? {
          message: reason.message,
          stack: reason.stack,
          name: reason.name
        } : reason,
        promise
      });
    });
  }
}

// 创建单例实例
const globalExceptionHandler = new GlobalExceptionHandler();

module.exports = {
  GlobalExceptionHandler,
  globalExceptionHandler
};