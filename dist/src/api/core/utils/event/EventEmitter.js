/**
 * 事件系统工具
 * 提供事件注册、触发和管理功能
 */

const logger = require('../logger');
const { AppError } = require('../../exception/handlers/errorHandler');
const { EventError } = require('../../exception/handlers/errorHandler');

/**
 * 事件系统工具类
 */
class EventEmitter {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   */
  constructor(options = {}) {
    this.options = {
      maxListeners: options.maxListeners || 10,
      debug: options.debug || false,
      errorHandler: options.errorHandler || null,
      ...options
    };
    
    this.events = new Map();
    this.eventHistory = new Map();
    this.globalHandlers = [];
    this.emitting = false;
    this.queuedEvents = [];
    this.listenerCount = 0;
    
    // 监听内置错误事件
    this.on('error', this._handleError.bind(this));
    
    logger.debug('事件系统初始化完成', {
      maxListeners: this.options.maxListeners,
      debug: this.options.debug
    });
  }

  /**
   * 内部错误处理
   * @private
   * @param {Error} error - 错误对象
   */
  _handleError(error) {
    if (this.options.errorHandler) {
      try {
        this.options.errorHandler(error);
      } catch (handlerError) {
        logger.error('事件错误处理器发生错误', {
          originalError: error.message,
          handlerError: handlerError.message
        });
      }
    } else {
      logger.error('未处理的事件错误', { error: error.message, stack: error.stack });
    }
  }

  /**
   * 验证监听器是否有效
   * @private
   * @param {Function} listener - 监听器函数
   * @returns {boolean} 是否有效
   * @throws {EventError} 无效监听器错误
   */
  _validateListener(listener) {
    if (typeof listener !== 'function') {
      throw new EventError('监听器必须是函数', {
        code: 'INVALID_LISTENER',
        details: { listenerType: typeof listener }
      });
    }
    return true;
  }

  /**
   * 获取事件的监听器数组
   * @private
   * @param {string} event - 事件名称
   * @returns {Array} 监听器数组
   */
  _getListeners(event) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    return this.events.get(event);
  }

  /**
   * 检查监听器数量是否超出限制
   * @private
   * @param {string} event - 事件名称
   * @param {Array} listeners - 监听器数组
   */
  _checkMaxListeners(event, listeners) {
    if (listeners.length >= this.options.maxListeners && this.options.maxListeners > 0) {
      logger.warn(`事件 '${event}' 的监听器数量(${listeners.length})已达到或超过最大限制(${this.options.maxListeners})`, {
        event,
        currentListeners: listeners.length,
        maxListeners: this.options.maxListeners
      });
    }
  }

  /**
   * 记录事件历史
   * @private
   * @param {string} event - 事件名称
   * @param {Array} args - 事件参数
   */
  _recordEventHistory(event, args) {
    if (!this.options.debug) return;
    
    if (!this.eventHistory.has(event)) {
      this.eventHistory.set(event, []);
    }
    
    const history = this.eventHistory.get(event);
    history.push({
      timestamp: Date.now(),
      args: args.slice(0, 3) // 只记录前3个参数以节省内存
    });
    
    // 限制历史记录数量
    if (history.length > 100) {
      history.shift();
    }
  }

  /**
   * 触发单个监听器
   * @private
   * @param {Function} listener - 监听器函数
   * @param {string} event - 事件名称
   * @param {Array} args - 事件参数
   */
  _emitToListener(listener, event, args) {
    try {
      if (this.options.debug) {
        const startTime = process.hrtime();
        
        listener.apply(this, args);
        
        const [seconds, nanoseconds] = process.hrtime(startTime);
        const duration = seconds * 1000 + nanoseconds / 1000000;
        
        logger.debug(`事件 '${event}' 监听器执行完成`, {
          duration: `${duration.toFixed(3)}ms`,
          listenerName: listener.name || 'anonymous'
        });
      } else {
        listener.apply(this, args);
      }
    } catch (error) {
      logger.error(`事件 '${event}' 监听器执行失败`, {
        error: error.message,
        stack: error.stack,
        listenerName: listener.name || 'anonymous'
      });
      
      // 触发错误事件但不阻止其他监听器执行
      if (event !== 'error') {
        this.emit('error', error, { event, listener });
      }
    }
  }

  /**
   * 注册事件监听器
   * @param {string} event - 事件名称
   * @param {Function} listener - 监听器函数
   * @returns {EventEmitter} 当前实例（支持链式调用）
   */
  on(event, listener) {
    this._validateListener(listener);
    
    const listeners = this._getListeners(event);
    
    // 避免重复添加相同的监听器
    if (!listeners.includes(listener)) {
      listeners.push(listener);
      this.listenerCount++;
      
      this._checkMaxListeners(event, listeners);
      
      if (this.options.debug) {
        logger.debug(`事件 '${event}' 注册了新的监听器`, {
          listenerName: listener.name || 'anonymous',
          listenerCount: listeners.length
        });
      }
    }
    
    return this;
  }

  /**
   * 注册一次性事件监听器
   * @param {string} event - 事件名称
   * @param {Function} listener - 监听器函数
   * @returns {EventEmitter} 当前实例（支持链式调用）
   */
  once(event, listener) {
    this._validateListener(listener);
    
    const onceWrapper = (...args) => {
      this.off(event, onceWrapper);
      listener.apply(this, args);
    };
    
    // 保存原始监听器引用以便于移除
    onceWrapper.originalListener = listener;
    
    return this.on(event, onceWrapper);
  }

  /**
   * 注册优先级事件监听器（会优先执行）
   * @param {string} event - 事件名称
   * @param {Function} listener - 监听器函数
   * @returns {EventEmitter} 当前实例（支持链式调用）
   */
  prependListener(event, listener) {
    this._validateListener(listener);
    
    const listeners = this._getListeners(event);
    
    // 避免重复添加相同的监听器
    if (!listeners.includes(listener)) {
      listeners.unshift(listener);
      this.listenerCount++;
      
      this._checkMaxListeners(event, listeners);
      
      if (this.options.debug) {
        logger.debug(`事件 '${event}' 注册了优先级监听器`, {
          listenerName: listener.name || 'anonymous',
          listenerCount: listeners.length
        });
      }
    }
    
    return this;
  }

  /**
   * 注册一次性优先级事件监听器
   * @param {string} event - 事件名称
   * @param {Function} listener - 监听器函数
   * @returns {EventEmitter} 当前实例（支持链式调用）
   */
  prependOnceListener(event, listener) {
    this._validateListener(listener);
    
    const onceWrapper = (...args) => {
      this.off(event, onceWrapper);
      listener.apply(this, args);
    };
    
    // 保存原始监听器引用以便于移除
    onceWrapper.originalListener = listener;
    
    return this.prependListener(event, onceWrapper);
  }

  /**
   * 移除事件监听器
   * @param {string} event - 事件名称
   * @param {Function} listener - 监听器函数
   * @returns {EventEmitter} 当前实例（支持链式调用）
   */
  off(event, listener) {
    if (!this.events.has(event)) {
      return this;
    }
    
    const listeners = this.events.get(event);
    const originalLength = listeners.length;
    
    // 移除匹配的监听器
    const filteredListeners = listeners.filter(l => {
      // 处理一次性监听器的情况
      return l !== listener && l.originalListener !== listener;
    });
    
    const removedCount = originalLength - filteredListeners.length;
    
    if (removedCount > 0) {
      this.events.set(event, filteredListeners);
      this.listenerCount -= removedCount;
      
      if (filteredListeners.length === 0) {
        this.events.delete(event);
      }
      
      if (this.options.debug) {
        logger.debug(`从事件 '${event}' 移除了 ${removedCount} 个监听器`, {
          remainingListeners: filteredListeners.length
        });
      }
    }
    
    return this;
  }

  /**
   * 移除指定事件的所有监听器
   * @param {string} event - 事件名称
   * @returns {EventEmitter} 当前实例（支持链式调用）
   */
  removeAllListeners(event) {
    if (event) {
      if (this.events.has(event)) {
        const listeners = this.events.get(event);
        this.listenerCount -= listeners.length;
        
        this.events.delete(event);
        
        if (this.options.debug) {
          logger.debug(`移除了事件 '${event}' 的所有监听器`, {
            removedCount: listeners.length
          });
        }
      }
    } else {
      // 移除所有事件的所有监听器
      const totalListeners = this.listenerCount;
      this.events.clear();
      this.listenerCount = 0;
      
      // 重新添加错误处理器
      this.on('error', this._handleError.bind(this));
      
      if (this.options.debug) {
        logger.debug('移除了所有事件的所有监听器', {
          removedCount: totalListeners - 1 // 减去重新添加的错误处理器
        });
      }
    }
    
    return this;
  }

  /**
   * 获取指定事件的监听器数量
   * @param {string} event - 事件名称
   * @returns {number} 监听器数量
   */
  listenerCount(event) {
    if (!this.events.has(event)) {
      return 0;
    }
    return this.events.get(event).length;
  }

  /**
   * 获取指定事件的所有监听器
   * @param {string} event - 事件名称
   * @returns {Array} 监听器数组
   */
  listeners(event) {
    if (!this.events.has(event)) {
      return [];
    }
    return [...this.events.get(event)];
  }

  /**
   * 获取所有注册的事件名称
   * @returns {Array} 事件名称数组
   */
  eventNames() {
    return Array.from(this.events.keys());
  }

  /**
   * 触发事件
   * @param {string} event - 事件名称
   * @param {...any} args - 事件参数
   * @returns {boolean} 是否有监听器被调用
   */
  emit(event, ...args) {
    const listeners = this.events.get(event) || [];
    const hasListeners = listeners.length > 0;
    
    // 记录事件历史
    this._recordEventHistory(event, args);
    
    if (this.options.debug) {
      logger.debug(`触发事件 '${event}'`, {
        listenerCount: listeners.length,
        argsCount: args.length
      });
    }
    
    if (!hasListeners && event !== 'error') {
      // 如果没有监听器且不是错误事件，则返回false
      return false;
    }
    
    // 如果正在触发其他事件，将当前事件加入队列
    if (this.emitting) {
      this.queuedEvents.push({ event, args });
      return hasListeners;
    }
    
    try {
      this.emitting = true;
      
      // 触发全局监听器
      this.globalHandlers.forEach(handler => {
        this._emitToListener(handler, event, [event, ...args]);
      });
      
      // 触发事件特定监听器
      [...listeners].forEach(listener => {
        this._emitToListener(listener, event, args);
      });
      
    } finally {
      this.emitting = false;
      
      // 处理队列中的事件
      if (this.queuedEvents.length > 0) {
        const queuedEvent = this.queuedEvents.shift();
        this.emit(queuedEvent.event, ...queuedEvent.args);
      }
    }
    
    return hasListeners;
  }

  /**
   * 异步触发事件
   * @param {string} event - 事件名称
   * @param {...any} args - 事件参数
   * @returns {Promise<boolean>} 是否有监听器被调用
   */
  async emitAsync(event, ...args) {
    const listeners = this.events.get(event) || [];
    const hasListeners = listeners.length > 0;
    
    // 记录事件历史
    this._recordEventHistory(event, args);
    
    if (this.options.debug) {
      logger.debug(`异步触发事件 '${event}'`, {
        listenerCount: listeners.length,
        argsCount: args.length
      });
    }
    
    if (!hasListeners && event !== 'error') {
      return false;
    }
    
    try {
      // 异步触发全局监听器
      await Promise.allSettled(
        this.globalHandlers.map(handler => {
          return Promise.resolve().then(() => {
            return handler.call(this, event, ...args);
          });
        })
      );
      
      // 异步触发事件特定监听器
      await Promise.allSettled(
        listeners.map(listener => {
          return Promise.resolve().then(() => {
            return listener.apply(this, args);
          });
        })
      );
      
    } catch (error) {
      logger.error(`异步事件 '${event}' 处理失败`, {
        error: error.message,
        stack: error.stack
      });
      
      if (event !== 'error') {
        this.emit('error', error, { event, isAsync: true });
      }
    }
    
    return hasListeners;
  }

  /**
   * 设置最大监听器数量
   * @param {number} maxListeners - 最大监听器数量
   * @returns {EventEmitter} 当前实例（支持链式调用）
   */
  setMaxListeners(maxListeners) {
    this.options.maxListeners = maxListeners;
    
    logger.debug(`设置最大监听器数量为 ${maxListeners}`);
    
    return this;
  }

  /**
   * 获取最大监听器数量
   * @returns {number} 最大监听器数量
   */
  getMaxListeners() {
    return this.options.maxListeners;
  }

  /**
   * 添加全局事件监听器（监听所有事件）
   * @param {Function} listener - 监听器函数
   * @returns {EventEmitter} 当前实例（支持链式调用）
   */
  addGlobalListener(listener) {
    this._validateListener(listener);
    
    if (!this.globalHandlers.includes(listener)) {
      this.globalHandlers.push(listener);
      
      if (this.options.debug) {
        logger.debug('添加了全局事件监听器', {
          listenerName: listener.name || 'anonymous'
        });
      }
    }
    
    return this;
  }

  /**
   * 移除全局事件监听器
   * @param {Function} listener - 监听器函数
   * @returns {EventEmitter} 当前实例（支持链式调用）
   */
  removeGlobalListener(listener) {
    const index = this.globalHandlers.indexOf(listener);
    
    if (index !== -1) {
      this.globalHandlers.splice(index, 1);
      
      if (this.options.debug) {
        logger.debug('移除了全局事件监听器', {
          listenerName: listener.name || 'anonymous'
        });
      }
    }
    
    return this;
  }

  /**
   * 获取事件历史记录
   * @param {string} event - 事件名称（可选）
   * @returns {Array} 事件历史记录
   */
  getEventHistory(event) {
    if (!this.options.debug) {
      logger.warn('获取事件历史记录需要启用debug模式');
      return [];
    }
    
    if (event) {
      return this.eventHistory.get(event) || [];
    }
    
    // 返回所有事件的历史记录
    const allHistory = [];
    
    for (const [eventName, history] of this.eventHistory.entries()) {
      allHistory.push(...history.map(entry => ({ ...entry, event: eventName })));
    }
    
    // 按时间戳排序
    return allHistory.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * 清除事件历史记录
   * @param {string} event - 事件名称（可选）
   * @returns {EventEmitter} 当前实例（支持链式调用）
   */
  clearEventHistory(event) {
    if (event) {
      this.eventHistory.delete(event);
    } else {
      this.eventHistory.clear();
    }
    
    if (this.options.debug) {
      logger.debug(`清除了${event ? `事件 '${event}' 的` : '所有'}事件历史记录`);
    }
    
    return this;
  }

  /**
   * 获取事件统计信息
   * @returns {Object} 事件统计信息
   */
  getEventStats() {
    const stats = {
      totalEvents: this.events.size,
      totalListeners: this.listenerCount,
      totalGlobalListeners: this.globalHandlers.length,
      events: {}
    };
    
    for (const [event, listeners] of this.events.entries()) {
      stats.events[event] = {
        listenerCount: listeners.length
      };
    }
    
    return stats;
  }

  /**
   * 暂停事件触发
   * @returns {EventEmitter} 当前实例（支持链式调用）
   */
  pauseEvents() {
    this.isPaused = true;
    
    if (this.options.debug) {
      logger.debug('事件触发已暂停');
    }
    
    return this;
  }

  /**
   * 恢复事件触发
   * @returns {EventEmitter} 当前实例（支持链式调用）
   */
  resumeEvents() {
    this.isPaused = false;
    
    // 处理暂停期间积累的事件
    while (this.pausedEvents && this.pausedEvents.length > 0) {
      const { event, args } = this.pausedEvents.shift();
      this.emit(event, ...args);
    }
    
    if (this.options.debug) {
      logger.debug('事件触发已恢复');
    }
    
    return this;
  }

  /**
   * 检查事件系统是否已暂停
   * @returns {boolean} 是否已暂停
   */
  isEventsPaused() {
    return this.isPaused;
  }

  /**
   * 销毁事件系统
   */
  destroy() {
    this.removeAllListeners();
    this.globalHandlers = [];
    this.eventHistory.clear();
    this.queuedEvents = [];
    this.pausedEvents = null;
    
    logger.debug('事件系统已销毁');
  }

  /**
   * 静态实例
   * @private
   */
  static _instance = null;

  /**
   * 获取单例实例
   * @param {Object} options - 配置选项
   * @returns {EventEmitter} 事件系统实例
   */
  static getInstance(options = {}) {
    if (!EventEmitter._instance) {
      EventEmitter._instance = new EventEmitter(options);
    }
    return EventEmitter._instance;
  }

  /**
   * 创建新的事件系统实例
   * @param {Object} options - 配置选项
   * @returns {EventEmitter} 事件系统实例
   */
  static create(options = {}) {
    return new EventEmitter(options);
  }

  /**
   * 导出常用的事件名称常量
   */
  static Events = {
    // 生命周期事件
    INIT: 'init',
    READY: 'ready',
    START: 'start',
    STOP: 'stop',
    RESTART: 'restart',
    SHUTDOWN: 'shutdown',
    DESTROY: 'destroy',
    
    // 错误事件
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info',
    
    // 数据事件
    DATA: 'data',
    DATA_CHANGED: 'dataChanged',
    DATA_LOADED: 'dataLoaded',
    DATA_SAVED: 'dataSaved',
    DATA_DELETED: 'dataDeleted',
    
    // 用户事件
    USER_LOGIN: 'userLogin',
    USER_LOGOUT: 'userLogout',
    USER_REGISTER: 'userRegister',
    USER_UPDATE: 'userUpdate',
    USER_DELETE: 'userDelete',
    
    // 系统事件
    CONFIG_CHANGED: 'configChanged',
    CACHE_CLEARED: 'cacheCleared',
    DATABASE_CONNECTED: 'databaseConnected',
    DATABASE_DISCONNECTED: 'databaseDisconnected',
    
    // HTTP事件
    HTTP_REQUEST: 'httpRequest',
    HTTP_RESPONSE: 'httpResponse',
    HTTP_ERROR: 'httpError',
    
    // 定时任务事件
    SCHEDULE_START: 'scheduleStart',
    SCHEDULE_COMPLETE: 'scheduleComplete',
    SCHEDULE_ERROR: 'scheduleError',
    
    // 日志事件
    LOG_DEBUG: 'logDebug',
    LOG_INFO: 'logInfo',
    LOG_WARN: 'logWarn',
    LOG_ERROR: 'logError',
    LOG_FATAL: 'logFatal'
  };
}

// 创建默认实例
const defaultEventEmitter = EventEmitter.getInstance();

module.exports = {
  EventEmitter,
  eventEmitter: defaultEventEmitter,
  Events: EventEmitter.Events
};