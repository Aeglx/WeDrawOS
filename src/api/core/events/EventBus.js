/**
 * 事件总线
 * 提供应用内事件发布订阅机制
 */

const logger = require('../utils/logger');
const { AppError } = require('../exception/handlers/errorHandler');
const { CommonUtils } = require('../utils/CommonUtils');

/**
 * 事件总线
 */
class EventBus {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   */
  constructor(options = {}) {
    this.options = {
      enableLogging: true,
      maxListenersPerEvent: 100,
      enableAsyncHandlers: true,
      errorHandler: null,
      ...options
    };

    // 存储事件监听器
    this.listeners = new Map();
    // 存储事件处理统计信息
    this.stats = {
      eventsPublished: 0,
      eventsProcessed: 0,
      errors: 0
    };
    // 存储事件处理上下文
    this.context = new Map();

    logger.info('事件总线初始化完成');
  }

  /**
   * 订阅事件
   * @param {string} eventName - 事件名称
   * @param {Function} handler - 事件处理函数
   * @param {Object} options - 订阅选项
   * @returns {Object} 订阅对象，包含取消订阅方法
   */
  subscribe(eventName, handler, options = {}) {
    if (typeof handler !== 'function') {
      throw new TypeError('事件处理函数必须是一个函数');
    }

    // 确保事件名称有效
    if (!eventName || typeof eventName !== 'string') {
      throw new TypeError('事件名称必须是非空字符串');
    }

    // 获取或创建事件监听器集合
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Map());
    }

    const eventListeners = this.listeners.get(eventName);

    // 检查监听器数量限制
    if (eventListeners.size >= this.options.maxListenersPerEvent) {
      logger.warn(`事件 "${eventName}" 的监听器数量已达到限制: ${this.options.maxListenersPerEvent}`);
    }

    // 生成唯一ID
    const listenerId = CommonUtils.generateUniqueId();

    // 存储监听器及其选项
    eventListeners.set(listenerId, {
      handler,
      options: {
        once: false,
        priority: 0,
        ...options
      },
      createdAt: Date.now()
    });

    logger.debug(`订阅事件: ${eventName}`, { listenerId, priority: options.priority || 0 });

    // 返回订阅对象
    return {
      unsubscribe: () => this.unsubscribe(eventName, listenerId),
      listenerId,
      eventName
    };
  }

  /**
   * 一次性订阅事件
   * @param {string} eventName - 事件名称
   * @param {Function} handler - 事件处理函数
   * @param {Object} options - 订阅选项
   * @returns {Object} 订阅对象
   */
  once(eventName, handler, options = {}) {
    return this.subscribe(eventName, handler, {
      ...options,
      once: true
    });
  }

  /**
   * 取消订阅
   * @param {string} eventName - 事件名称
   * @param {string} listenerId - 监听器ID
   * @returns {boolean} 是否取消成功
   */
  unsubscribe(eventName, listenerId) {
    if (!this.listeners.has(eventName)) {
      return false;
    }

    const eventListeners = this.listeners.get(eventName);
    const removed = eventListeners.delete(listenerId);

    if (removed) {
      logger.debug(`取消订阅事件: ${eventName}`, { listenerId });

      // 如果没有监听器了，删除事件
      if (eventListeners.size === 0) {
        this.listeners.delete(eventName);
      }
    }

    return removed;
  }

  /**
   * 取消所有订阅
   * @param {string} eventName - 事件名称（可选，不提供则取消所有事件的订阅）
   * @returns {number} 取消的订阅数量
   */
  unsubscribeAll(eventName = null) {
    if (eventName) {
      // 取消特定事件的所有订阅
      if (!this.listeners.has(eventName)) {
        return 0;
      }

      const count = this.listeners.get(eventName).size;
      this.listeners.delete(eventName);
      logger.debug(`取消事件所有订阅: ${eventName}`, { count });
      return count;
    } else {
      // 取消所有事件的所有订阅
      const count = Array.from(this.listeners.values())
        .reduce((total, listeners) => total + listeners.size, 0);
      
      this.listeners.clear();
      logger.debug('取消所有事件订阅', { count });
      return count;
    }
  }

  /**
   * 发布事件
   * @param {string} eventName - 事件名称
   * @param {any} data - 事件数据
   * @param {Object} options - 发布选项
   * @returns {Promise<Array>} 所有事件处理程序的返回值数组
   */
  async publish(eventName, data = {}, options = {}) {
    const { timeout = null, context = null } = options;
    
    this.stats.eventsPublished++;
    logger.debug(`发布事件: ${eventName}`, { dataLength: JSON.stringify(data).length });

    // 如果没有监听器，直接返回空数组
    if (!this.listeners.has(eventName)) {
      logger.debug(`事件 ${eventName} 没有监听器`);
      return [];
    }

    const eventListeners = this.listeners.get(eventName);
    const results = [];
    const onceListenersToRemove = [];

    // 创建事件上下文
    const eventContext = {
      eventName,
      timestamp: Date.now(),
      data,
      ...(context || {})
    };

    // 按优先级排序监听器
    const sortedListeners = this._sortListenersByPriority(eventListeners);

    try {
      // 处理所有监听器
      for (const [listenerId, { handler, options: listenerOptions }] of sortedListeners) {
        try {
          // 记录开始处理时间
          const startTime = Date.now();

          let result;
          
          if (this.options.enableAsyncHandlers) {
            // 异步处理
            if (timeout) {
              // 带超时的异步处理
              result = await CommonUtils.timeoutPromise(
                handler(data, eventContext),
                timeout,
                `事件 ${eventName} 处理超时`
              );
            } else {
              // 不带超时的异步处理
              result = await handler(data, eventContext);
            }
          } else {
            // 同步处理
            result = handler(data, eventContext);
          }

          // 记录处理统计
          const processingTime = Date.now() - startTime;
          this.stats.eventsProcessed++;

          // 记录慢处理警告
          if (processingTime > 1000) {
            logger.warn(`事件 ${eventName} 处理缓慢`, { 
              listenerId, 
              processingTime: `${processingTime}ms` 
            });
          }

          results.push(result);

          // 标记一次性监听器以便移除
          if (listenerOptions.once) {
            onceListenersToRemove.push(listenerId);
          }
        } catch (error) {
          this.stats.errors++;
          logger.error(`处理事件 ${eventName} 时出错`, { 
            listenerId, 
            error: error.message 
          });

          // 处理错误
          this._handleError(error, eventName, data, listenerId);

          // 根据选项决定是否继续处理其他监听器
          if (listenerOptions.abortOnError) {
            break;
          }
        }
      }
    } finally {
      // 移除一次性监听器
      for (const listenerId of onceListenersToRemove) {
        eventListeners.delete(listenerId);
      }

      // 如果没有监听器了，删除事件
      if (eventListeners.size === 0) {
        this.listeners.delete(eventName);
      }
    }

    return results;
  }

  /**
   * 按优先级排序监听器
   * @private
   * @param {Map} listeners - 监听器映射
   * @returns {Array} 排序后的监听器数组
   */
  _sortListenersByPriority(listeners) {
    return Array.from(listeners.entries())
      .sort(([, a], [, b]) => (b.options.priority || 0) - (a.options.priority || 0));
  }

  /**
   * 处理事件处理程序中的错误
   * @private
   * @param {Error} error - 错误对象
   * @param {string} eventName - 事件名称
   * @param {any} data - 事件数据
   * @param {string} listenerId - 监听器ID
   */
  _handleError(error, eventName, data, listenerId) {
    // 使用自定义错误处理器
    if (this.options.errorHandler && typeof this.options.errorHandler === 'function') {
      try {
        this.options.errorHandler(error, eventName, data, listenerId);
      } catch (handlerError) {
        logger.error('事件错误处理器本身出错', { error: handlerError });
      }
    }
  }

  /**
   * 获取事件监听器数量
   * @param {string} eventName - 事件名称（可选）
   * @returns {number} 监听器数量
   */
  getListenerCount(eventName = null) {
    if (eventName) {
      // 获取特定事件的监听器数量
      return this.listeners.has(eventName) ? this.listeners.get(eventName).size : 0;
    } else {
      // 获取所有事件的监听器总数
      return Array.from(this.listeners.values())
        .reduce((total, listeners) => total + listeners.size, 0);
    }
  }

  /**
   * 获取所有注册的事件名称
   * @returns {Array<string>} 事件名称数组
   */
  getEventNames() {
    return Array.from(this.listeners.keys());
  }

  /**
   * 获取事件监听器信息
   * @param {string} eventName - 事件名称
   * @returns {Array<Object>} 监听器信息数组
   */
  getListeners(eventName) {
    if (!this.listeners.has(eventName)) {
      return [];
    }

    return Array.from(this.listeners.get(eventName).entries()).map(([id, listener]) => ({
      id,
      priority: listener.options.priority || 0,
      once: listener.options.once || false,
      createdAt: listener.createdAt
    }));
  }

  /**
   * 设置全局上下文数据
   * @param {string} key - 上下文键
   * @param {any} value - 上下文值
   * @returns {EventBus} 实例本身，支持链式调用
   */
  setContext(key, value) {
    this.context.set(key, value);
    return this;
  }

  /**
   * 获取全局上下文数据
   * @param {string} key - 上下文键
   * @param {any} defaultValue - 默认值
   * @returns {any} 上下文值
   */
  getContext(key, defaultValue = undefined) {
    return this.context.has(key) ? this.context.get(key) : defaultValue;
  }

  /**
   * 清除全局上下文数据
   * @param {string} key - 上下文键（可选，不提供则清除所有）
   * @returns {EventBus} 实例本身，支持链式调用
   */
  clearContext(key = null) {
    if (key) {
      this.context.delete(key);
    } else {
      this.context.clear();
    }
    return this;
  }

  /**
   * 获取事件统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    return {
      ...this.stats,
      eventCount: this.listeners.size,
      totalListeners: this.getListenerCount()
    };
  }

  /**
   * 重置统计信息
   * @returns {EventBus} 实例本身，支持链式调用
   */
  resetStats() {
    this.stats = {
      eventsPublished: 0,
      eventsProcessed: 0,
      errors: 0
    };
    return this;
  }

  /**
   * 检查事件是否有监听器
   * @param {string} eventName - 事件名称
   * @returns {boolean} 是否有监听器
   */
  hasListeners(eventName) {
    return this.listeners.has(eventName) && this.listeners.get(eventName).size > 0;
  }

  /**
   * 创建事件发射器
   * @returns {Object} 事件发射器对象
   */
  createEmitter() {
    const eventBus = this;
    
    return {
      emit: (eventName, data, options) => eventBus.publish(eventName, data, options),
      on: (eventName, handler, options) => eventBus.subscribe(eventName, handler, options),
      once: (eventName, handler, options) => eventBus.once(eventName, handler, options),
      off: (eventName, listenerId) => eventBus.unsubscribe(eventName, listenerId)
    };
  }

  /**
   * 创建事件装饰器
   * @param {string} eventName - 事件名称
   * @returns {Function} 方法装饰器
   */
  createEventDecorator(eventName) {
    const eventBus = this;
    
    return function(target, propertyKey, descriptor) {
      const originalMethod = descriptor.value;
      
      descriptor.value = async function(...args) {
        try {
          // 调用原始方法
          const result = await originalMethod.apply(this, args);
          
          // 发布成功事件
          await eventBus.publish(`${eventName}:success`, {
            result,
            arguments: args,
            context: this
          });
          
          return result;
        } catch (error) {
          // 发布失败事件
          await eventBus.publish(`${eventName}:error`, {
            error,
            arguments: args,
            context: this
          });
          
          // 重新抛出错误
          throw error;
        }
      };
      
      return descriptor;
    };
  }

  /**
   * 关闭事件总线
   */
  close() {
    // 清空所有监听器
    this.unsubscribeAll();
    // 清空上下文
    this.clearContext();
    // 重置统计信息
    this.resetStats();
    
    logger.info('事件总线已关闭');
  }

  /**
   * 获取单例实例
   * @param {Object} options - 配置选项
   * @returns {EventBus} 事件总线实例
   */
  static getInstance(options = {}) {
    if (!EventBus._instance) {
      EventBus._instance = new EventBus(options);
    }
    return EventBus._instance;
  }
}

module.exports = EventBus;