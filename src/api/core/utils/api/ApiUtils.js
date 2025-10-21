/**
 * API工具类
 * 提供API路由、中间件、错误处理、响应格式化等功能
 */

/**
 * API响应格式化类
 */
class ApiResponse {
  /**
   * 成功响应
   * @param {*} data - 响应数据
   * @param {string} message - 响应消息
   * @param {number} statusCode - 状态码
   * @returns {Object} 格式化的响应对象
   */
  static success(data = null, message = '操作成功', statusCode = 200) {
    return {
      code: 0,
      message,
      data,
      timestamp: new Date().toISOString(),
      statusCode
    };
  }

  /**
   * 错误响应
   * @param {number} code - 错误码
   * @param {string} message - 错误消息
   * @param {*} data - 额外数据
   * @param {number} statusCode - 状态码
   * @returns {Object} 格式化的错误响应对象
   */
  static error(code = 500, message = '操作失败', data = null, statusCode = 500) {
    return {
      code,
      message,
      data,
      timestamp: new Date().toISOString(),
      statusCode
    };
  }

  /**
   * 分页响应
   * @param {Array} list - 数据列表
   * @param {Object} pagination - 分页信息
   * @param {string} message - 响应消息
   * @returns {Object} 格式化的分页响应对象
   */
  static pagination(list = [], pagination = {}, message = '获取成功') {
    const {
      page = 1,
      pageSize = 10,
      total = 0,
      totalPages = Math.ceil(total / pageSize)
    } = pagination;

    return {
      code: 0,
      message,
      data: list,
      pagination: {
        page,
        pageSize,
        total,
        totalPages
      },
      timestamp: new Date().toISOString(),
      statusCode: 200
    };
  }

  /**
   * 警告响应
   * @param {string} message - 警告消息
   * @param {*} data - 数据
   * @returns {Object} 格式化的警告响应对象
   */
  static warning(message = '警告', data = null) {
    return {
      code: 1,
      message,
      data,
      timestamp: new Date().toISOString(),
      statusCode: 200
    };
  }
}

/**
 * API错误类
 */
class ApiError extends Error {
  /**
   * 构造函数
   * @param {number} code - 错误码
   * @param {string} message - 错误消息
   * @param {*} data - 额外数据
   * @param {number} statusCode - HTTP状态码
   */
  constructor(code = 500, message = '服务器内部错误', data = null, statusCode = 500) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.data = data;
    this.statusCode = statusCode;
    this.timestamp = new Date().toISOString();
  }

  /**
   * 转换为对象
   * @returns {Object} 错误对象
   */
  toObject() {
    return {
      code: this.code,
      message: this.message,
      data: this.data,
      timestamp: this.timestamp,
      statusCode: this.statusCode
    };
  }
}

/**
 * 预定义错误类
 */
class ApiErrors {
  /**
   * 参数错误
   * @param {string} message - 错误消息
   * @param {*} data - 额外数据
   * @returns {ApiError} 参数错误实例
   */
  static badRequest(message = '请求参数错误', data = null) {
    return new ApiError(400, message, data, 400);
  }

  /**
   * 未授权错误
   * @param {string} message - 错误消息
   * @param {*} data - 额外数据
   * @returns {ApiError} 未授权错误实例
   */
  static unauthorized(message = '未授权访问', data = null) {
    return new ApiError(401, message, data, 401);
  }

  /**
   * 禁止访问错误
   * @param {string} message - 错误消息
   * @param {*} data - 额外数据
   * @returns {ApiError} 禁止访问错误实例
   */
  static forbidden(message = '禁止访问', data = null) {
    return new ApiError(403, message, data, 403);
  }

  /**
   * 资源未找到错误
   * @param {string} message - 错误消息
   * @param {*} data - 额外数据
   * @returns {ApiError} 资源未找到错误实例
   */
  static notFound(message = '请求的资源不存在', data = null) {
    return new ApiError(404, message, data, 404);
  }

  /**
   * 方法不允许错误
   * @param {string} message - 错误消息
   * @param {*} data - 额外数据
   * @returns {ApiError} 方法不允许错误实例
   */
  static methodNotAllowed(message = '不支持的请求方法', data = null) {
    return new ApiError(405, message, data, 405);
  }

  /**
   * 冲突错误
   * @param {string} message - 错误消息
   * @param {*} data - 额外数据
   * @returns {ApiError} 冲突错误实例
   */
  static conflict(message = '请求冲突', data = null) {
    return new ApiError(409, message, data, 409);
  }

  /**
   * 内部服务器错误
   * @param {string} message - 错误消息
   * @param {*} data - 额外数据
   * @returns {ApiError} 内部服务器错误实例
   */
  static internalServerError(message = '服务器内部错误', data = null) {
    return new ApiError(500, message, data, 500);
  }

  /**
   * 服务不可用错误
   * @param {string} message - 错误消息
   * @param {*} data - 额外数据
   * @returns {ApiError} 服务不可用错误实例
   */
  static serviceUnavailable(message = '服务暂不可用', data = null) {
    return new ApiError(503, message, data, 503);
  }

  /**
   * 数据库错误
   * @param {string} message - 错误消息
   * @param {*} data - 额外数据
   * @returns {ApiError} 数据库错误实例
   */
  static databaseError(message = '数据库操作失败', data = null) {
    return new ApiError(5001, message, data, 500);
  }

  /**
   * 验证错误
   * @param {string} message - 错误消息
   * @param {*} data - 额外数据
   * @returns {ApiError} 验证错误实例
   */
  static validationError(message = '数据验证失败', data = null) {
    return new ApiError(4001, message, data, 400);
  }

  /**
   * 业务逻辑错误
   * @param {string} message - 错误消息
   * @param {*} data - 额外数据
   * @returns {ApiError} 业务逻辑错误实例
   */
  static businessLogicError(message = '业务逻辑错误', data = null) {
    return new ApiError(4002, message, data, 400);
  }
}

/**
 * API中间件类
 */
class ApiMiddleware {
  /**
   * CORS中间件
   * @param {Object} options - CORS选项
   * @returns {Function} Express中间件函数
   */
  static cors(options = {}) {
    return (req, res, next) => {
      const {
        origin = '*',
        methods = 'GET,POST,PUT,DELETE,PATCH,OPTIONS',
        allowedHeaders = 'Content-Type,Authorization',
        exposedHeaders = '',
        credentials = false,
        maxAge = 86400
      } = options;

      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Methods', methods);
      res.header('Access-Control-Allow-Headers', allowedHeaders);
      res.header('Access-Control-Expose-Headers', exposedHeaders);
      res.header('Access-Control-Allow-Credentials', credentials.toString());
      res.header('Access-Control-Max-Age', maxAge.toString());

      if (req.method === 'OPTIONS') {
        return res.status(204).end();
      }

      next();
    };
  }

  /**
   * JSON解析中间件
   * @returns {Function} Express中间件函数
   */
  static jsonParser() {
    const bodyParser = require('body-parser');
    return bodyParser.json({
      limit: '10mb',
      extended: true
    });
  }

  /**
   * URL编码解析中间件
   * @returns {Function} Express中间件函数
   */
  static urlencodedParser() {
    const bodyParser = require('body-parser');
    return bodyParser.urlencoded({
      limit: '10mb',
      extended: true
    });
  }

  /**
   * 请求日志中间件
   * @param {Object} logger - 日志记录器
   * @returns {Function} Express中间件函数
   */
  static requestLogger(logger = console) {
    return (req, res, next) => {
      const start = Date.now();
      const { method, url, headers, ip } = req;

      res.on('finish', () => {
        const duration = Date.now() - start;
        const { statusCode, statusMessage } = res;
        
        logger.info({
          method,
          url,
          statusCode,
          statusMessage,
          duration,
          ip,
          userAgent: headers['user-agent']
        });
      });

      next();
    };
  }

  /**
   * 错误处理中间件
   * @returns {Function} Express中间件函数
   */
  static errorHandler() {
    return (err, req, res, next) => {
      // 如果是ApiError类型
      if (err instanceof ApiError) {
        return res.status(err.statusCode).json(err.toObject());
      }

      // 如果是验证错误
      if (err.name === 'ValidationError' || err.name === 'ValidatorError') {
        const validationError = ApiErrors.validationError('数据验证失败', err.details);
        return res.status(validationError.statusCode).json(validationError.toObject());
      }

      // 如果是参数错误
      if (err.name === 'SyntaxError' && err instanceof SyntaxError && err.message.includes('JSON')) {
        const badRequestError = ApiErrors.badRequest('无效的JSON格式');
        return res.status(badRequestError.statusCode).json(badRequestError.toObject());
      }

      // 未知错误
      const errorResponse = ApiErrors.internalServerError(
        '服务器内部错误',
        process.env.NODE_ENV === 'development' ? { stack: err.stack, message: err.message } : null
      );

      console.error('API错误:', err);
      res.status(errorResponse.statusCode).json(errorResponse.toObject());
    };
  }

  /**
   * 超时中间件
   * @param {number} timeoutMs - 超时时间（毫秒）
   * @returns {Function} Express中间件函数
   */
  static timeout(timeoutMs = 30000) {
    return (req, res, next) => {
      let timeoutId;

      const clearTimeoutHandler = () => {
        clearTimeout(timeoutId);
      };

      const timeoutHandler = () => {
        const timeoutError = ApiErrors.serviceUnavailable('请求超时');
        res.status(timeoutError.statusCode).json(timeoutError.toObject());
      };

      // 设置超时
      timeoutId = setTimeout(timeoutHandler, timeoutMs);

      // 清除超时
      res.on('finish', clearTimeoutHandler);
      res.on('close', clearTimeoutHandler);

      next();
    };
  }

  /**
   * 速率限制中间件
   * @param {Object} options - 速率限制选项
   * @returns {Function} Express中间件函数
   */
  static rateLimit(options = {}) {
    const {
      windowMs = 60000, // 1分钟
      max = 100, // 每个窗口最大请求数
      message = '请求过于频繁，请稍后再试'
    } = options;

    const ipRequests = new Map();

    return (req, res, next) => {
      const ip = req.ip || req.connection.remoteAddress;
      const now = Date.now();
      
      if (!ipRequests.has(ip)) {
        ipRequests.set(ip, []);
      }

      const requests = ipRequests.get(ip);
      
      // 清除过期的请求记录
      const validRequests = requests.filter(time => now - time < windowMs);
      ipRequests.set(ip, validRequests);

      // 检查是否超过限制
      if (validRequests.length >= max) {
        const rateLimitError = ApiErrors.serviceUnavailable(message);
        return res.status(rateLimitError.statusCode).json(rateLimitError.toObject());
      }

      // 记录当前请求
      validRequests.push(now);

      next();
    };
  }

  /**
   * 认证中间件
   * @param {Function} verifyFn - 验证函数
   * @returns {Function} Express中间件函数
   */
  static auth(verifyFn) {
    return async (req, res, next) => {
      try {
        const user = await verifyFn(req);
        if (!user) {
          throw ApiErrors.unauthorized('认证失败');
        }
        req.user = user;
        next();
      } catch (error) {
        if (error instanceof ApiError) {
          return res.status(error.statusCode).json(error.toObject());
        }
        const authError = ApiErrors.unauthorized('认证失败');
        res.status(authError.statusCode).json(authError.toObject());
      }
    };
  }

  /**
   * 权限中间件
   * @param {Function} permissionFn - 权限检查函数
   * @returns {Function} Express中间件函数
   */
  static permission(permissionFn) {
    return async (req, res, next) => {
      try {
        const hasPermission = await permissionFn(req, req.user);
        if (!hasPermission) {
          throw ApiErrors.forbidden('权限不足');
        }
        next();
      } catch (error) {
        if (error instanceof ApiError) {
          return res.status(error.statusCode).json(error.toObject());
        }
        const permissionError = ApiErrors.forbidden('权限不足');
        res.status(permissionError.statusCode).json(permissionError.toObject());
      }
    };
  }
}

/**
 * API路由类
 */
class ApiRouter {
  /**
   * 创建路由组
   * @param {Object} router - Express路由实例
   * @param {Function} groupFn - 路由组函数
   * @returns {Object} 路由实例
   */
  static group(router, groupFn) {
    if (typeof groupFn === 'function') {
      groupFn(router);
    }
    return router;
  }

  /**
   * 注册路由
   * @param {Object} router - Express路由实例
   * @param {Array} routes - 路由配置数组
   * @returns {Object} 路由实例
   */
  static registerRoutes(router, routes) {
    routes.forEach(route => {
      const {
        method = 'GET',
        path = '/',
        handler,
        middleware = [],
        name = '',
        description = ''
      } = route;

      if (!handler || typeof handler !== 'function') {
        throw new Error(`路由 ${path} 缺少有效的处理器`);
      }

      const handlers = Array.isArray(middleware) 
        ? [...middleware, handler] 
        : [middleware, handler];

      router[method.toLowerCase()](path, ...handlers);

      // 记录路由信息
      if (name) {
        router.routeNameMap = router.routeNameMap || new Map();
        router.routeNameMap.set(name, {
          method,
          path,
          description
        });
      }
    });

    return router;
  }

  /**
   * 分页中间件
   * @param {Object} options - 分页选项
   * @returns {Function} Express中间件函数
   */
  static pagination(options = {}) {
    return (req, res, next) => {
      const {
        defaultPage = 1,
        defaultPageSize = 10,
        maxPageSize = 100
      } = options;

      const page = parseInt(req.query.page) || defaultPage;
      const pageSize = Math.min(
        parseInt(req.query.pageSize) || defaultPageSize,
        maxPageSize
      );
      const offset = (page - 1) * pageSize;

      req.pagination = {
        page: Math.max(1, page),
        pageSize: Math.max(1, pageSize),
        offset
      };

      next();
    };
  }

  /**
   * 响应格式化中间件
   * @returns {Function} Express中间件函数
   */
  static responseFormatter() {
    return (req, res, next) => {
      // 保存原始的send方法
      const originalSend = res.send;

      // 重写send方法
      res.send = function(body) {
        // 如果已经是JSON响应且不是Buffer，不做处理
        if (this.get('Content-Type')?.includes('application/json') && typeof body === 'object' && !Buffer.isBuffer(body)) {
          return originalSend.call(this, body);
        }

        // 格式化响应
        const responseBody = ApiResponse.success(body);
        this.set('Content-Type', 'application/json');
        return originalSend.call(this, JSON.stringify(responseBody));
      };

      // 添加成功响应方法
      res.success = function(data, message) {
        const response = ApiResponse.success(data, message);
        this.status(response.statusCode).json(response);
      };

      // 添加错误响应方法
      res.error = function(code, message, data, statusCode) {
        const response = ApiResponse.error(code, message, data, statusCode);
        this.status(response.statusCode).json(response);
      };

      // 添加分页响应方法
      res.paginate = function(list, pagination, message) {
        const response = ApiResponse.pagination(list, pagination, message);
        this.status(response.statusCode).json(response);
      };

      next();
    };
  }
}

/**
 * API文档生成类
 */
class ApiDocumentation {
  /**
   * 从路由生成API文档
   * @param {Array} routes - 路由配置数组
   * @returns {Object} API文档对象
   */
  static generate(routes) {
    const docs = {
      openapi: '3.0.0',
      info: {
        title: 'API文档',
        version: '1.0.0',
        description: '自动生成的API文档'
      },
      paths: {}
    };

    routes.forEach(route => {
      const {
        method = 'GET',
        path,
        name = '',
        description = '',
        parameters = [],
        requestBody = null,
        responses = {}
      } = route;

      const formattedPath = path.replace(/:([^/]+)/g, '{$1}');
      
      if (!docs.paths[formattedPath]) {
        docs.paths[formattedPath] = {};
      }

      docs.paths[formattedPath][method.toLowerCase()] = {
        summary: name,
        description,
        parameters,
        ...(requestBody && { requestBody }),
        responses: {
          ...responses,
          'default': {
            description: '默认响应',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'integer' },
                    message: { type: 'string' },
                    data: { type: 'object' },
                    timestamp: { type: 'string', format: 'date-time' }
                  }
                }
              }
            }
          }
        }
      };
    });

    return docs;
  }

  /**
   * 导出API文档为JSON文件
   * @param {Object} docs - API文档对象
   * @param {string} filePath - 文件路径
   */
  static exportToJson(docs, filePath) {
    const fs = require('fs');
    const path = require('path');

    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, JSON.stringify(docs, null, 2));
  }
}

/**
 * API工具主类
 */
class ApiUtils {
  constructor(options = {}) {
    this.options = options;
  }

  /**
   * 创建Express应用
   * @param {Object} options - 应用选项
   * @returns {Object} Express应用实例
   */
  createExpressApp(options = {}) {
    const express = require('express');
    const app = express();

    // 应用默认中间件
    app.use(ApiMiddleware.cors());
    app.use(ApiMiddleware.jsonParser());
    app.use(ApiMiddleware.urlencodedParser());
    app.use(ApiMiddleware.requestLogger());
    app.use(ApiMiddleware.timeout());
    app.use(ApiRouter.responseFormatter());

    // 404处理
    app.use((req, res, next) => {
      next(ApiErrors.notFound(`未找到路径: ${req.method} ${req.path}`));
    });

    // 错误处理
    app.use(ApiMiddleware.errorHandler());

    return app;
  }

  /**
   * 启动API服务器
   * @param {Object} app - Express应用实例
   * @param {Object} options - 服务器选项
   * @returns {Object} 服务器实例
   */
  startServer(app, options = {}) {
    const {
      port = process.env.PORT || 3000,
      host = '0.0.0.0',
      callback = null
    } = options;

    const server = app.listen(port, host, () => {
      console.log(`API服务器启动在 http://${host}:${port}`);
      if (typeof callback === 'function') {
        callback(server);
      }
    });

    // 优雅关闭
    const gracefulShutdown = () => {
      console.log('正在关闭API服务器...');
      server.close(() => {
        console.log('API服务器已关闭');
        process.exit(0);
      });
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

    return server;
  }
}

module.exports = {
  ApiUtils,
  ApiResponse,
  ApiError,
  ApiErrors,
  ApiMiddleware,
  ApiRouter,
  ApiDocumentation
};