/**
 * 响应格式化工具
 * 提供统一的API响应格式和错误处理
 */

const logger = require('../../utils/logger');
const { AppError } = require('../../exception/handlers/errorHandler');

/**
 * HTTP状态码枚举
 */
const HttpStatus = {
  // 成功响应
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  
  // 重定向
  MOVED_PERMANENTLY: 301,
  FOUND: 302,
  NOT_MODIFIED: 304,
  
  // 客户端错误
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  
  // 服务器错误
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504
};

/**
 * 响应格式化工具
 */
class ResponseFormatter {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   */
  constructor(options = {}) {
    this.options = {
      includeTimestamp: true,
      includeRequestId: true,
      includeMeta: true,
      errorDetails: process.env.NODE_ENV !== 'production',
      ...options
    };

    logger.info('响应格式化工具初始化完成');
  }

  /**
   * 创建成功响应
   * @param {Object} res - Express响应对象
   * @param {any} data - 响应数据
   * @param {Object} options - 响应选项
   * @returns {Object} 响应对象
   */
  success(res, data = null, options = {}) {
    const {
      status = HttpStatus.OK,
      message = '操作成功',
      meta = {},
      headers = {}
    } = options;

    // 构建响应体
    const responseBody = this._buildResponse(data, message, 'success', meta);

    // 设置响应头
    this._setResponseHeaders(res, headers);

    // 发送响应
    return res.status(status).json(responseBody);
  }

  /**
   * 创建错误响应
   * @param {Object} res - Express响应对象
   * @param {Error|Object} error - 错误对象
   * @param {Object} options - 响应选项
   * @returns {Object} 响应对象
   */
  error(res, error, options = {}) {
    // 标准化错误对象
    const normalizedError = this._normalizeError(error);
    
    const {
      status = normalizedError.status || HttpStatus.INTERNAL_SERVER_ERROR,
      message = normalizedError.message,
      code = normalizedError.code || 'UNKNOWN_ERROR',
      meta = {}
    } = options;

    // 构建错误详情
    const errorDetails = this._buildErrorDetails(normalizedError);

    // 构建响应体
    const responseBody = this._buildResponse(
      null, 
      message,
      'error',
      { ...meta, error: errorDetails },
      code
    );

    // 记录错误日志
    this._logError(normalizedError, status);

    // 发送响应
    return res.status(status).json(responseBody);
  }

  /**
   * 创建分页响应
   * @param {Object} res - Express响应对象
   * @param {Array} items - 数据项数组
   * @param {Object} pagination - 分页信息
   * @param {Object} options - 响应选项
   * @returns {Object} 响应对象
   */
  paginated(res, items = [], pagination = {}, options = {}) {
    const {
      status = HttpStatus.OK,
      message = '查询成功',
      meta = {}
    } = options;

    // 标准化分页信息
    const normalizedPagination = {
      page: pagination.page || 1,
      pageSize: pagination.pageSize || 10,
      totalItems: pagination.totalItems || 0,
      totalPages: pagination.totalPages || 0,
      ...pagination
    };

    // 构建响应体
    const responseBody = this._buildResponse(
      items,
      message,
      'success',
      { ...meta, pagination: normalizedPagination }
    );

    // 发送响应
    return res.status(status).json(responseBody);
  }

  /**
   * 创建空响应
   * @param {Object} res - Express响应对象
   * @param {Object} options - 响应选项
   * @returns {Object} 响应对象
   */
  noContent(res, options = {}) {
    const { headers = {} } = options;
    
    // 设置响应头
    this._setResponseHeaders(res, headers);
    
    // 发送无内容响应
    return res.status(HttpStatus.NO_CONTENT).end();
  }

  /**
   * 创建重定向响应
   * @param {Object} res - Express响应对象
   * @param {string} url - 重定向URL
   * @param {Object} options - 响应选项
   * @returns {Object} 响应对象
   */
  redirect(res, url, options = {}) {
    const {
      status = HttpStatus.FOUND,
      message = '正在重定向'
    } = options;

    // 如果是API请求，返回JSON响应
    if (this._isApiRequest(res.req)) {
      return this.success(res, { url }, {
        status: HttpStatus.OK,
        message
      });
    }

    // 否则执行HTTP重定向
    return res.redirect(status, url);
  }

  /**
   * 构建响应体
   * @private
   * @param {any} data - 响应数据
   * @param {string} message - 响应消息
   * @param {string} status - 响应状态
   * @param {Object} meta - 元数据
   * @param {string} code - 状态码
   * @returns {Object} 响应体
   */
  _buildResponse(data, message, status, meta = {}, code = null) {
    const response = {
      status,
      message,
      ...(data !== null && { data })
    };

    // 添加代码（如果提供）
    if (code) {
      response.code = code;
    }

    // 添加元数据
    if (this.options.includeMeta || Object.keys(meta).length > 0) {
      response.meta = {
        ...this._getDefaultMeta(),
        ...meta
      };
    }

    return response;
  }

  /**
   * 获取默认元数据
   * @private
   * @returns {Object} 默认元数据
   */
  _getDefaultMeta() {
    const meta = {};

    // 添加时间戳
    if (this.options.includeTimestamp) {
      meta.timestamp = new Date().toISOString();
    }

    return meta;
  }

  /**
   * 标准化错误对象
   * @private
   * @param {Error|Object} error - 错误对象
   * @returns {Object} 标准化的错误对象
   */
  _normalizeError(error) {
    if (error instanceof AppError) {
      // 已经是标准化的AppError
      return error;
    }

    if (error instanceof Error) {
      // 原生Error对象
      return {
        message: error.message || '未知错误',
        stack: error.stack,
        name: error.name
      };
    }

    if (typeof error === 'object' && error !== null) {
      // 普通对象错误
      return {
        message: error.message || '未知错误',
        ...error
      };
    }

    // 原始值错误
    return {
      message: String(error) || '未知错误'
    };
  }

  /**
   * 构建错误详情
   * @private
   * @param {Object} error - 标准化的错误对象
   * @returns {Object} 错误详情
   */
  _buildErrorDetails(error) {
    const details = {
      message: error.message,
      code: error.code || 'UNKNOWN_ERROR'
    };

    // 开发环境下添加详细信息
    if (this.options.errorDetails) {
      if (error.stack) {
        details.stack = error.stack.split('\n').map(line => line.trim());
      }
      
      if (error.details) {
        details.details = error.details;
      }
      
      if (error.validationErrors) {
        details.validationErrors = error.validationErrors;
      }
    }

    return details;
  }

  /**
   * 设置响应头
   * @private
   * @param {Object} res - Express响应对象
   * @param {Object} headers - 要设置的响应头
   */
  _setResponseHeaders(res, headers) {
    for (const [key, value] of Object.entries(headers)) {
      res.setHeader(key, value);
    }

    // 添加默认响应头
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('X-Content-Type-Options', 'nosniff');
  }

  /**
   * 记录错误日志
   * @private
   * @param {Object} error - 错误对象
   * @param {number} statusCode - HTTP状态码
   */
  _logError(error, statusCode) {
    const logData = {
      statusCode,
      message: error.message,
      code: error.code
    };

    // 4xx错误记录为警告
    if (statusCode >= 400 && statusCode < 500) {
      logger.warn('客户端错误响应', logData);
    } else {
      // 5xx错误记录为错误
      logger.error('服务器错误响应', {
        ...logData,
        stack: error.stack
      });
    }
  }

  /**
   * 判断是否为API请求
   * @private
   * @param {Object} req - Express请求对象
   * @returns {boolean} 是否为API请求
   */
  _isApiRequest(req) {
    // 检查Accept头
    const acceptHeader = req.headers.accept || '';
    if (acceptHeader.includes('application/json')) {
      return true;
    }

    // 检查URL路径
    if (req.path.startsWith('/api/')) {
      return true;
    }

    return false;
  }

  /**
   * 创建Express中间件
   * @returns {Function} Express中间件
   */
  createMiddleware() {
    const formatter = this;
    
    return function(req, res, next) {
      // 扩展响应对象
      res.success = function(data, options) {
        return formatter.success(res, data, options);
      };

      res.error = function(error, options) {
        return formatter.error(res, error, options);
      };

      res.paginated = function(items, pagination, options) {
        return formatter.paginated(res, items, pagination, options);
      };

      res.noContent = function(options) {
        return formatter.noContent(res, options);
      };

      res.redirect = function(url, options) {
        return formatter.redirect(res, url, options);
      };

      next();
    };
  }

  /**
   * 获取HTTP状态码
   * @returns {Object} HTTP状态码枚举
   */
  static getStatusCodes() {
    return { ...HttpStatus };
  }

  /**
   * 获取单例实例
   * @param {Object} options - 配置选项
   * @returns {ResponseFormatter} 响应格式化工具实例
   */
  static getInstance(options = {}) {
    if (!ResponseFormatter._instance) {
      ResponseFormatter._instance = new ResponseFormatter(options);
    }
    return ResponseFormatter._instance;
  }
}

module.exports = {
  ResponseFormatter,
  HttpStatus
};