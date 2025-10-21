/**
 * 路由管理器
 * 负责统一管理和注册API路由
 */

const express = require('express');
const logger = require('../utils/logger');
const config = require('../config/config');
const { di } = require('../di/dependencyInjector');
const { AppError } = require('../exception/handlers/errorHandler');

class Router {
  constructor() {
    this.router = express.Router();
    this.routes = new Map();
    this.middlewares = [];
    this.prefix = config.get('server.apiPrefix', '/api');
  }

  /**
   * 注册中间件
   * @param {Function|Array} middleware - 中间件函数或数组
   */
  use(middleware) {
    if (Array.isArray(middleware)) {
      middleware.forEach(mw => {
        this.middlewares.push(mw);
        this.router.use(mw);
      });
    } else {
      this.middlewares.push(middleware);
      this.router.use(middleware);
    }
    return this;
  }

  /**
   * 注册路由组
   * @param {string} path - 路由前缀
   * @param {Function} callback - 回调函数，接收子路由实例
   * @param {Array} middlewares - 路由组级别的中间件
   */
  group(path, callback, middlewares = []) {
    const groupRouter = express.Router();
    
    // 应用路由组中间件
    middlewares.forEach(middleware => {
      groupRouter.use(middleware);
    });
    
    // 创建子路由实例
    const childRouter = new Router();
    childRouter.router = groupRouter;
    
    // 执行回调，配置子路由
    callback(childRouter);
    
    // 注册路由组
    this.router.use(path, groupRouter);
    
    logger.info(`已注册路由组: ${path}`);
    
    return this;
  }

  /**
   * 注册GET路由
   * @param {string} path - 路由路径
   * @param {Function} handler - 处理函数
   * @param {Array} middlewares - 中间件数组
   */
  get(path, handler, middlewares = []) {
    return this._registerRoute('GET', path, handler, middlewares);
  }

  /**
   * 注册POST路由
   * @param {string} path - 路由路径
   * @param {Function} handler - 处理函数
   * @param {Array} middlewares - 中间件数组
   */
  post(path, handler, middlewares = []) {
    return this._registerRoute('POST', path, handler, middlewares);
  }

  /**
   * 注册PUT路由
   * @param {string} path - 路由路径
   * @param {Function} handler - 处理函数
   * @param {Array} middlewares - 中间件数组
   */
  put(path, handler, middlewares = []) {
    return this._registerRoute('PUT', path, handler, middlewares);
  }

  /**
   * 注册PATCH路由
   * @param {string} path - 路由路径
   * @param {Function} handler - 处理函数
   * @param {Array} middlewares - 中间件数组
   */
  patch(path, handler, middlewares = []) {
    return this._registerRoute('PATCH', path, handler, middlewares);
  }

  /**
   * 注册DELETE路由
   * @param {string} path - 路由路径
   * @param {Function} handler - 处理函数
   * @param {Array} middlewares - 中间件数组
   */
  delete(path, handler, middlewares = []) {
    return this._registerRoute('DELETE', path, handler, middlewares);
  }

  /**
   * 注册OPTIONS路由
   * @param {string} path - 路由路径
   * @param {Function} handler - 处理函数
   * @param {Array} middlewares - 中间件数组
   */
  options(path, handler, middlewares = []) {
    return this._registerRoute('OPTIONS', path, handler, middlewares);
  }

  /**
   * 注册所有HTTP方法的路由
   * @param {string} path - 路由路径
   * @param {Function} handler - 处理函数
   * @param {Array} middlewares - 中间件数组
   */
  all(path, handler, middlewares = []) {
    return this._registerRoute('ALL', path, handler, middlewares);
  }

  /**
   * 注册路由
   * @param {string} method - HTTP方法
   * @param {string} path - 路由路径
   * @param {Function} handler - 处理函数
   * @param {Array} middlewares - 中间件数组
   * @private
   */
  _registerRoute(method, path, handler, middlewares = []) {
    // 验证处理函数
    if (typeof handler !== 'function') {
      throw new AppError(`路由处理函数必须是函数类型: ${path}`, 500, 'INVALID_HANDLER');
    }

    // 构建完整的处理链
    const handlers = [...middlewares, this._wrapHandler(handler)];
    
    // 注册路由
    if (method === 'ALL') {
      this.router.all(path, ...handlers);
    } else {
      this.router[method.toLowerCase()](path, ...handlers);
    }

    // 保存路由信息
    const routeKey = `${method} ${path}`;
    this.routes.set(routeKey, {
      method,
      path,
      handler: handler.name || 'anonymous',
      middlewares: middlewares.length
    });

    logger.info(`已注册路由: ${method} ${path}`);

    return this;
  }

  /**
   * 包装处理函数，添加错误处理
   * @param {Function} handler - 原始处理函数
   * @private
   */
  _wrapHandler(handler) {
    return async (req, res, next) => {
      try {
        // 执行处理函数
        const result = await handler(req, res, next);
        
        // 如果处理函数返回了结果并且没有发送响应，则自动发送
        if (result !== undefined && !res.headersSent) {
          res.success(result);
        }
      } catch (error) {
        // 传递错误给错误处理中间件
        next(error);
      }
    };
  }

  /**
   * 导入路由模块
   * @param {string} modulePath - 路由模块路径
   */
  async importRoutes(modulePath) {
    try {
      // 动态导入路由模块
      const routeModule = await require(modulePath);
      
      // 检查模块是否导出了路由配置函数
      if (typeof routeModule === 'function') {
        // 调用路由配置函数，传入当前路由实例
        routeModule(this);
        logger.info(`已导入路由模块: ${modulePath}`);
      } else {
        logger.warn(`路由模块不是函数类型: ${modulePath}`);
      }
      
      return this;
    } catch (error) {
      logger.error(`导入路由模块失败: ${modulePath}`, { error });
      throw error;
    }
  }

  /**
   * 批量导入路由模块
   * @param {Array} modulePaths - 路由模块路径数组
   */
  async importRoutesBatch(modulePaths) {
    try {
      for (const path of modulePaths) {
        await this.importRoutes(path);
      }
      return this;
    } catch (error) {
      logger.error('批量导入路由模块失败', { error });
      throw error;
    }
  }

  /**
   * 获取Express路由器实例
   */
  getRouter() {
    return this.router;
  }

  /**
   * 获取所有注册的路由
   */
  getRoutes() {
    return Array.from(this.routes.values());
  }

  /**
   * 记录所有注册的路由
   */
  logRoutes() {
    const routes = this.getRoutes();
    
    if (routes.length === 0) {
      logger.info('没有注册任何路由');
      return;
    }

    logger.info(`已注册 ${routes.length} 个路由:`);
    
    // 格式化输出路由信息
    routes.forEach(route => {
      logger.info(`  ${route.method.padEnd(8)} ${route.path} (中间件: ${route.middlewares})`);
    });
  }

  /**
   * 清空所有路由
   */
  clear() {
    this.router = express.Router();
    this.routes.clear();
    this.middlewares = [];
    logger.info('所有路由已清空');
    return this;
  }

  /**
   * 创建资源路由（CRUD操作）
   * @param {string} path - 资源路径
   * @param {Object} controllers - 控制器对象
   * @param {Object} options - 选项
   */
  resource(path, controllers, options = {}) {
    const { middlewares = {}, except = [], only = null } = options;
    
    // 定义标准的CRUD路由映射
    const crudRoutes = [
      { method: 'get', path: '', action: 'index', name: '列表' },
      { method: 'get', path: '/:id', action: 'show', name: '详情' },
      { method: 'post', path: '', action: 'create', name: '创建' },
      { method: 'put', path: '/:id', action: 'update', name: '更新' },
      { method: 'delete', path: '/:id', action: 'destroy', name: '删除' }
    ];

    // 过滤路由
    let filteredRoutes = crudRoutes;
    
    if (only && Array.isArray(only)) {
      filteredRoutes = crudRoutes.filter(route => only.includes(route.action));
    } else if (except && Array.isArray(except)) {
      filteredRoutes = crudRoutes.filter(route => !except.includes(route.action));
    }

    // 注册路由
    filteredRoutes.forEach(route => {
      const action = controllers[route.action];
      if (typeof action === 'function') {
        const routeMiddlewares = middlewares[route.action] || middlewares.all || [];
        this[route.method](`${path}${route.path}`, action, routeMiddlewares);
        logger.info(`已注册资源路由: ${path}${route.path} (${route.name})`);
      } else {
        logger.warn(`控制器缺少${route.name}方法: ${route.action}`);
      }
    });

    return this;
  }

  /**
   * 注册健康检查路由
   */
  healthCheck() {
    this.get('/health', (req, res) => {
      res.success({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: config.get('app.version', '1.0.0'),
        environment: process.env.NODE_ENV || 'development'
      }, '服务运行正常');
    });
    return this;
  }

  /**
   * 注册API文档路由
   * @param {string} path - 文档路径
   * @param {Function} handler - 文档处理函数
   */
  documentation(path = '/docs', handler) {
    if (handler && typeof handler === 'function') {
      this.get(path, handler);
    } else {
      // 默认文档路由
      this.get(path, (req, res) => {
        res.success({
          name: config.get('app.name', 'API'),
          version: config.get('app.version', '1.0.0'),
          description: config.get('app.description', 'API文档'),
          routes: this.getRoutes().map(route => ({
            method: route.method,
            path: route.path
          }))
        }, 'API文档');
      });
    }
    return this;
  }
}

// 创建并导出路由管理器实例
const router = new Router();
module.exports = router;

// 导出Router类供测试使用
module.exports.Router = Router;