/**
 * 日志上下文工具
 * 提供日志上下文管理和跟踪功能
 */

const { AsyncLocalStorage } = require('async_hooks');
const { v4: uuidv4 } = require('uuid');
const { typeUtils } = require('../type');
const { stringUtils } = require('../string');

/**
 * 日志上下文类
 * 提供请求跟踪、上下文变量管理和日志增强功能
 */
class LogContext {
  /**
   * 构造函数
   */
  constructor() {
    // 使用AsyncLocalStorage存储上下文
    this.asyncLocalStorage = new AsyncLocalStorage();
    
    // 默认上下文键
    this.contextKeys = {
      REQUEST_ID: 'requestId',
      SESSION_ID: 'sessionId',
      USER_ID: 'userId',
      CORRELATION_ID: 'correlationId',
      TENANT_ID: 'tenantId',
      ENVIRONMENT: 'environment',
      SERVICE: 'service',
      COMPONENT: 'component',
      OPERATION: 'operation',
      TIMESTAMP: 'timestamp',
      DURATION: 'duration',
      STATUS: 'status',
      ERROR: 'error'
    };

    // 存储上下文的默认值
    this.defaultContext = {
      [this.contextKeys.SERVICE]: process.env.npm_package_name || 'unknown-service',
      [this.contextKeys.ENVIRONMENT]: process.env.NODE_ENV || 'development'
    };

    // 上下文状态
    this.isInitialized = false;
    
    // 初始化
    this.initialize();
  }

  /**
   * 初始化
   * @private
   */
  initialize() {
    if (this.isInitialized) {
      return;
    }

    this.isInitialized = true;
  }

  /**
   * 创建新的上下文
   * @param {Object} initialContext - 初始上下文数据
   * @returns {Object} 创建的上下文对象
   */
  createContext(initialContext = {}) {
    // 生成默认ID
    const context = {
      ...this.defaultContext,
      [this.contextKeys.REQUEST_ID]: uuidv4(),
      [this.contextKeys.TIMESTAMP]: Date.now(),
      ...initialContext
    };

    return context;
  }

  /**
   * 运行带上下文的函数
   * @param {Function} fn - 要执行的函数
   * @param {Object} context - 上下文数据（可选）
   * @returns {*} 函数执行结果
   */
  runWithContext(fn, context = null) {
    // 如果没有提供上下文，则创建新的
    const executionContext = context || this.createContext();

    // 使用AsyncLocalStorage运行函数
    return this.asyncLocalStorage.run(executionContext, () => {
      return fn();
    });
  }

  /**
   * 获取当前上下文
   * @returns {Object|null} 当前上下文对象，如果不存在则返回null
   */
  getContext() {
    return this.asyncLocalStorage.getStore() || null;
  }

  /**
   * 设置上下文值
   * @param {string} key - 键名
   * @param {*} value - 值
   * @returns {boolean} 是否设置成功
   */
  set(key, value) {
    const context = this.getContext();
    if (!context) {
      return false;
    }

    context[key] = value;
    return true;
  }

  /**
   * 获取上下文值
   * @param {string} key - 键名
   * @param {*} defaultValue - 默认值
   * @returns {*} 上下文值或默认值
   */
  get(key, defaultValue = null) {
    const context = this.getContext();
    if (!context) {
      return defaultValue;
    }

    return context[key] !== undefined ? context[key] : defaultValue;
  }

  /**
   * 删除上下文值
   * @param {string} key - 键名
   * @returns {boolean} 是否删除成功
   */
  remove(key) {
    const context = this.getContext();
    if (!context) {
      return false;
    }

    delete context[key];
    return true;
  }

  /**
   * 批量设置上下文值
   * @param {Object} values - 键值对对象
   * @returns {boolean} 是否设置成功
   */
  setMultiple(values) {
    const context = this.getContext();
    if (!context || !typeUtils.isObject(values)) {
      return false;
    }

    Object.assign(context, values);
    return true;
  }

  /**
   * 合并上下文
   * @param {Object} values - 要合并的对象
   * @returns {boolean} 是否合并成功
   */
  merge(values) {
    const context = this.getContext();
    if (!context || !typeUtils.isObject(values)) {
      return false;
    }

    // 深度合并
    this.deepMerge(context, values);
    return true;
  }

  /**
   * 深度合并对象
   * @param {Object} target - 目标对象
   * @param {Object} source - 源对象
   * @private
   */
  deepMerge(target, source) {
    Object.keys(source).forEach(key => {
      if (typeUtils.isPlainObject(source[key]) && typeUtils.isPlainObject(target[key])) {
        this.deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    });
  }

  /**
   * 清除上下文
   * @returns {boolean} 是否清除成功
   */
  clear() {
    const context = this.getContext();
    if (!context) {
      return false;
    }

    // 保留默认上下文值
    Object.keys(context).forEach(key => {
      if (!this.defaultContext.hasOwnProperty(key)) {
        delete context[key];
      }
    });

    return true;
  }

  /**
   * 重置上下文
   * @returns {boolean} 是否重置成功
   */
  reset() {
    const context = this.getContext();
    if (!context) {
      return false;
    }

    // 清除所有值并重置为默认值
    Object.keys(context).forEach(key => {
      delete context[key];
    });

    Object.assign(context, this.defaultContext);
    return true;
  }

  /**
   * 克隆上下文
   * @returns {Object|null} 上下文的克隆
   */
  clone() {
    const context = this.getContext();
    if (!context) {
      return null;
    }

    return this.deepClone(context);
  }

  /**
   * 深度克隆对象
   * @param {Object} obj - 要克隆的对象
   * @private
   */
  deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (typeUtils.isDate(obj)) {
      return new Date(obj.getTime());
    }

    if (typeUtils.isArray(obj)) {
      return obj.map(item => this.deepClone(item));
    }

    if (typeUtils.isPlainObject(obj)) {
      const clone = {};
      Object.keys(obj).forEach(key => {
        clone[key] = this.deepClone(obj[key]);
      });
      return clone;
    }

    return obj;
  }

  /**
   * 检查是否存在上下文
   * @returns {boolean} 是否存在上下文
   */
  hasContext() {
    return this.getContext() !== null;
  }

  /**
   * 检查上下文是否包含某个键
   * @param {string} key - 要检查的键
   * @returns {boolean} 是否包含
   */
  has(key) {
    const context = this.getContext();
    return context !== null && key in context;
  }

  /**
   * 获取所有上下文键
   * @returns {Array<string>} 键名数组
   */
  keys() {
    const context = this.getContext();
    if (!context) {
      return [];
    }

    return Object.keys(context);
  }

  /**
   * 获取所有上下文值
   * @returns {Array<*>} 值数组
   */
  values() {
    const context = this.getContext();
    if (!context) {
      return [];
    }

    return Object.values(context);
  }

  /**
   * 获取所有上下文键值对
   * @returns {Array<Array<*>>} 键值对数组
   */
  entries() {
    const context = this.getContext();
    if (!context) {
      return [];
    }

    return Object.entries(context);
  }

  /**
   * 设置请求ID
   * @param {string} requestId - 请求ID
   * @returns {boolean} 是否设置成功
   */
  setRequestId(requestId = null) {
    const id = requestId || uuidv4();
    return this.set(this.contextKeys.REQUEST_ID, id);
  }

  /**
   * 获取请求ID
   * @returns {string|null} 请求ID
   */
  getRequestId() {
    let id = this.get(this.contextKeys.REQUEST_ID);
    
    // 如果不存在，生成一个并设置
    if (!id) {
      id = uuidv4();
      this.setRequestId(id);
    }
    
    return id;
  }

  /**
   * 设置会话ID
   * @param {string} sessionId - 会话ID
   * @returns {boolean} 是否设置成功
   */
  setSessionId(sessionId) {
    return this.set(this.contextKeys.SESSION_ID, sessionId);
  }

  /**
   * 获取会话ID
   * @returns {string|null} 会话ID
   */
  getSessionId() {
    return this.get(this.contextKeys.SESSION_ID);
  }

  /**
   * 设置用户ID
   * @param {string|number} userId - 用户ID
   * @returns {boolean} 是否设置成功
   */
  setUserId(userId) {
    return this.set(this.contextKeys.USER_ID, userId);
  }

  /**
   * 获取用户ID
   * @returns {string|number|null} 用户ID
   */
  getUserId() {
    return this.get(this.contextKeys.USER_ID);
  }

  /**
   * 设置相关ID
   * @param {string} correlationId - 相关ID
   * @returns {boolean} 是否设置成功
   */
  setCorrelationId(correlationId = null) {
    const id = correlationId || uuidv4();
    return this.set(this.contextKeys.CORRELATION_ID, id);
  }

  /**
   * 获取相关ID
   * @returns {string|null} 相关ID
   */
  getCorrelationId() {
    let id = this.get(this.contextKeys.CORRELATION_ID);
    
    // 如果不存在，使用请求ID或生成新的
    if (!id) {
      id = this.getRequestId() || uuidv4();
      this.setCorrelationId(id);
    }
    
    return id;
  }

  /**
   * 设置租户ID
   * @param {string|number} tenantId - 租户ID
   * @returns {boolean} 是否设置成功
   */
  setTenantId(tenantId) {
    return this.set(this.contextKeys.TENANT_ID, tenantId);
  }

  /**
   * 获取租户ID
   * @returns {string|number|null} 租户ID
   */
  getTenantId() {
    return this.get(this.contextKeys.TENANT_ID);
  }

  /**
   * 设置组件
   * @param {string} component - 组件名称
   * @returns {boolean} 是否设置成功
   */
  setComponent(component) {
    return this.set(this.contextKeys.COMPONENT, component);
  }

  /**
   * 获取组件
   * @returns {string|null} 组件名称
   */
  getComponent() {
    return this.get(this.contextKeys.COMPONENT);
  }

  /**
   * 设置操作
   * @param {string} operation - 操作名称
   * @returns {boolean} 是否设置成功
   */
  setOperation(operation) {
    return this.set(this.contextKeys.OPERATION, operation);
  }

  /**
   * 获取操作
   * @returns {string|null} 操作名称
   */
  getOperation() {
    return this.get(this.contextKeys.OPERATION);
  }

  /**
   * 设置状态
   * @param {string} status - 状态值
   * @returns {boolean} 是否设置成功
   */
  setStatus(status) {
    return this.set(this.contextKeys.STATUS, status);
  }

  /**
   * 获取状态
   * @returns {string|null} 状态值
   */
  getStatus() {
    return this.get(this.contextKeys.STATUS);
  }

  /**
   * 设置错误信息
   * @param {Error|string} error - 错误对象或字符串
   * @returns {boolean} 是否设置成功
   */
  setError(error) {
    const errorInfo = typeUtils.isError(error) 
      ? {
          message: error.message,
          stack: error.stack,
          name: error.name,
          code: error.code || null
        }
      : { message: String(error) };

    return this.set(this.contextKeys.ERROR, errorInfo);
  }

  /**
   * 获取错误信息
   * @returns {Object|null} 错误信息对象
   */
  getError() {
    return this.get(this.contextKeys.ERROR);
  }

  /**
   * 开始计时
   * @param {string} name - 计时器名称
   * @returns {boolean} 是否开始成功
   */
  startTime(name = 'default') {
    const context = this.getContext();
    if (!context) {
      return false;
    }

    if (!context._timers) {
      context._timers = {};
    }

    context._timers[name] = Date.now();
    return true;
  }

  /**
   * 结束计时并返回持续时间
   * @param {string} name - 计时器名称
   * @returns {number|null} 持续时间（毫秒）
   */
  endTime(name = 'default') {
    const context = this.getContext();
    if (!context || !context._timers || !context._timers[name]) {
      return null;
    }

    const duration = Date.now() - context._timers[name];
    delete context._timers[name];

    // 设置持续时间到上下文
    this.set(this.contextKeys.DURATION, duration);

    return duration;
  }

  /**
   * 执行函数并记录执行时间
   * @param {Function} fn - 要执行的函数
   * @param {string} name - 计时器名称
   * @returns {*} 函数执行结果
   */
  async measure(fn, name = 'default') {
    this.startTime(name);
    
    try {
      const result = fn instanceof Promise ? await fn : fn();
      const duration = this.endTime(name);
      
      // 如果有持续时间，记录到上下文
      if (duration !== null) {
        this.set(`${name}Duration`, duration);
      }
      
      return result;
    } catch (error) {
      this.endTime(name);
      throw error;
    }
  }

  /**
   * 从HTTP请求创建上下文
   * @param {Object} req - HTTP请求对象
   * @returns {Object} 创建的上下文
   */
  createContextFromRequest(req) {
    if (!req) {
      return this.createContext();
    }

    // 尝试从请求头中获取跟踪ID
    const requestId = req.headers['x-request-id'] || 
                      req.headers['x-correlation-id'] || 
                      req.headers['request-id'] || 
                      null;

    const sessionId = req.headers['x-session-id'] || 
                      (req.session ? req.session.id : null) ||
                      null;

    const userId = req.headers['x-user-id'] || 
                  (req.user ? req.user.id : null) || 
                  null;

    // 创建上下文
    return this.createContext({
      [this.contextKeys.REQUEST_ID]: requestId,
      [this.contextKeys.SESSION_ID]: sessionId,
      [this.contextKeys.USER_ID]: userId,
      [this.contextKeys.CORRELATION_ID]: req.headers['x-correlation-id'] || requestId,
      httpMethod: req.method,
      httpPath: req.path,
      httpUrl: req.originalUrl,
      clientIp: this.getClientIp(req),
      userAgent: req.headers['user-agent']
    });
  }

  /**
   * 获取客户端IP地址
   * @param {Object} req - HTTP请求对象
   * @returns {string|null} IP地址
   * @private
   */
  getClientIp(req) {
    if (!req) {
      return null;
    }

    // 尝试从各种代理头获取真实IP
    return req.headers['x-forwarded-for'] ||
           req.headers['x-real-ip'] ||
           req.connection?.remoteAddress ||
           req.socket?.remoteAddress ||
           req.connection?.socket?.remoteAddress ||
           null;
  }

  /**
   * 创建Express中间件
   * @returns {Function} Express中间件函数
   */
  createExpressMiddleware() {
    return (req, res, next) => {
      // 从请求创建上下文
      const context = this.createContextFromRequest(req);

      // 在响应头中设置跟踪ID
      res.setHeader('x-request-id', context[this.contextKeys.REQUEST_ID]);
      res.setHeader('x-correlation-id', context[this.contextKeys.CORRELATION_ID]);

      // 开始计时
      this.startTime('request');

      // 使用上下文运行下一个中间件
      this.runWithContext(() => {
        // 请求结束时设置持续时间
        res.on('finish', () => {
          const duration = this.endTime('request');
          if (duration !== null) {
            // 记录请求信息
            const requestInfo = {
              method: req.method,
              path: req.path,
              statusCode: res.statusCode,
              duration,
              clientIp: this.getClientIp(req)
            };
            
            // 将请求信息添加到上下文
            this.set('requestInfo', requestInfo);
          }
        });

        next();
      }, context);
    };
  }

  /**
   * 将上下文转换为可序列化的对象
   * @param {Object} context - 上下文对象（可选，默认为当前上下文）
   * @returns {Object} 可序列化的对象
   */
  toJSON(context = null) {
    const ctx = context || this.getContext();
    if (!ctx) {
      return {};
    }

    // 创建一个可序列化的副本
    const serializable = {};

    Object.entries(ctx).forEach(([key, value]) => {
      // 跳过内部计时器
      if (key === '_timers') {
        return;
      }

      // 处理各种类型的值
      if (value === null || value === undefined) {
        serializable[key] = null;
      } else if (typeUtils.isError(value)) {
        serializable[key] = {
          message: value.message,
          name: value.name,
          code: value.code || null,
          stack: String(value.stack).split('\n')
        };
      } else if (typeUtils.isDate(value)) {
        serializable[key] = value.toISOString();
      } else if (typeUtils.isObject(value) || typeUtils.isArray(value)) {
        try {
          // 尝试序列化
          JSON.stringify(value);
          serializable[key] = value;
        } catch (e) {
          // 如果无法序列化，转换为字符串
          serializable[key] = String(value);
        }
      } else {
        serializable[key] = value;
      }
    });

    return serializable;
  }

  /**
   * 静态实例
   * @private
   */
  static _instance = null;

  /**
   * 获取单例实例
   * @returns {LogContext} 日志上下文实例
   */
  static getInstance() {
    if (!LogContext._instance) {
      LogContext._instance = new LogContext();
    }
    return LogContext._instance;
  }

  /**
   * 创建新的日志上下文实例
   * @returns {LogContext} 日志上下文实例
   */
  static create() {
    return new LogContext();
  }
}

// 创建默认实例
const defaultLogContext = LogContext.getInstance();

module.exports = {
  LogContext,
  logContext: defaultLogContext
};