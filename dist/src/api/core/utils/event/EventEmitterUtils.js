/**
 * 事件工具类
 * 提供事件发布订阅、事件总线、事件节流防抖等功能
 */

const logger = require('../logger');
const PromiseUtils = require('../promise').getInstance();

/**
 * 基础事件发射器类
 */
class EventEmitter {
  constructor(options = {}) {
    this.options = {
      maxListeners: 10,
      enableDebug: false,
      ...options
    };
    this.events = new Map(); // 存储事件及其监听器
    this.onceEvents = new Map(); // 存储一次性事件及其监听器
    this.eventHistory = new Map(); // 存储事件历史记录
    this.defaultMaxListeners = this.options.maxListeners;
    this.isDebug = this.options.enableDebug;
    this.isPaused = false;
    this.pausedEvents = [];
    
    logger.debug('创建事件发射器实例', { 
      maxListeners: this.defaultMaxListeners 
    });
  }

  /**
   * 设置最大监听器数量
   * @param {number} n - 最大监听器数量
   * @returns {EventEmitter} 当前实例
   */
  setMaxListeners(n) {
    if (typeof n !== 'number' || n < 0 || !Number.isInteger(n)) {
      throw new TypeError('监听器数量必须是非负整数');
    }
    
    this.defaultMaxListeners = n;
    return this;
  }

  /**
   * 获取最大监听器数量
   * @returns {number} 最大监听器数量
   */
  getMaxListeners() {
    return this.defaultMaxListeners;
  }

  /**
   * 添加事件监听器
   * @param {string|symbol} eventName - 事件名称
   * @param {Function} listener - 监听器函数
   * @returns {EventEmitter} 当前实例
   */
  on(eventName, listener) {
    if (typeof listener !== 'function') {
      throw new TypeError('监听器必须是函数');
    }
    
    // 初始化事件监听器数组
    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }
    
    const listeners = this.events.get(eventName);
    
    // 检查监听器数量
    if (listeners.length >= this.defaultMaxListeners) {
      logger.warn(`监听器警告: '${String(eventName)}' 事件的监听器数量(${listeners.length})已达到最大值(${this.defaultMaxListeners})`);
    }
    
    // 添加监听器
    listeners.push(listener);
    
    if (this.isDebug) {
      logger.debug(`添加事件监听器: '${String(eventName)}'`, { listenerCount: listeners.length });
    }
    
    return this;
  }

  /**
   * 添加一次性事件监听器
   * @param {string|symbol} eventName - 事件名称
   * @param {Function} listener - 监听器函数
   * @returns {EventEmitter} 当前实例
   */
  once(eventName, listener) {
    if (typeof listener !== 'function') {
      throw new TypeError('监听器必须是函数');
    }
    
    // 创建包装函数，执行后移除监听器
    const onceWrapper = (...args) => {
      this.off(eventName, onceWrapper);
      this.onceEvents.get(eventName)?.delete(onceWrapper);
      return listener.apply(this, args);
    };
    
    onceWrapper.listener = listener;
    
    // 存储一次性监听器映射
    if (!this.onceEvents.has(eventName)) {
      this.onceEvents.set(eventName, new Set());
    }
    this.onceEvents.get(eventName).add(onceWrapper);
    
    // 使用普通on方法添加包装后的监听器
    this.on(eventName, onceWrapper);
    
    return this;
  }

  /**
   * 移除事件监听器
   * @param {string|symbol} eventName - 事件名称
   * @param {Function} [listener] - 要移除的监听器函数，不提供则移除所有该事件的监听器
   * @returns {EventEmitter} 当前实例
   */
  off(eventName, listener) {
    const listeners = this.events.get(eventName);
    
    if (!listeners) {
      return this;
    }
    
    if (!listener) {
      // 移除所有监听器
      this.events.delete(eventName);
      this.onceEvents.delete(eventName);
      
      if (this.isDebug) {
        logger.debug(`移除事件所有监听器: '${String(eventName)}'`);
      }
      
      return this;
    }
    
    // 查找并移除特定监听器
    const index = listeners.findIndex(l => {
      return l === listener || l.listener === listener;
    });
    
    if (index !== -1) {
      listeners.splice(index, 1);
      
      // 如果没有监听器了，清理映射
      if (listeners.length === 0) {
        this.events.delete(eventName);
        this.onceEvents.delete(eventName);
      }
      
      if (this.isDebug) {
        logger.debug(`移除事件监听器: '${String(eventName)}'`, { remainingListeners: listeners.length });
      }
    }
    
    return this;
  }

  /**
   * 移除所有事件的所有监听器
   * @param {Array<string|symbol>} [eventNames] - 要清理的事件名称数组，不提供则清理所有
   * @returns {EventEmitter} 当前实例
   */
  removeAllListeners(eventNames) {
    if (eventNames && Array.isArray(eventNames)) {
      // 只清理指定事件
      eventNames.forEach(eventName => {
        this.off(eventName);
      });
    } else {
      // 清理所有事件
      this.events.clear();
      this.onceEvents.clear();
      
      if (this.isDebug) {
        logger.debug('移除所有事件的所有监听器');
      }
    }
    
    return this;
  }

  /**
   * 获取指定事件的监听器数组
   * @param {string|symbol} eventName - 事件名称
   * @returns {Array<Function>} 监听器数组
   */
  listeners(eventName) {
    const listeners = this.events.get(eventName);
    return listeners ? [...listeners] : [];
  }

  /**
   * 获取指定事件的原始监听器数组（不包含once包装器）
   * @param {string|symbol} eventName - 事件名称
   * @returns {Array<Function>} 原始监听器数组
   */
  rawListeners(eventName) {
    const listeners = this.events.get(eventName);
    if (!listeners) {
      return [];
    }
    
    return listeners.map(l => l.listener || l);
  }

  /**
   * 获取指定事件的监听器数量
   * @param {string|symbol} eventName - 事件名称
   * @returns {number} 监听器数量
   */
  listenerCount(eventName) {
    const listeners = this.events.get(eventName);
    return listeners ? listeners.length : 0;
  }

  /**
   * 触发事件
   * @param {string|symbol} eventName - 事件名称
   * @param {...*} args - 传递给监听器的参数
   * @returns {boolean} 是否有监听器被调用
   */
  emit(eventName, ...args) {
    // 记录事件历史
    this._recordEventHistory(eventName, args);
    
    // 如果事件被暂停，将事件加入队列
    if (this.isPaused) {
      this.pausedEvents.push({ eventName, args });
      return this.events.has(eventName);
    }
    
    const listeners = this.events.get(eventName);
    if (!listeners || listeners.length === 0) {
      // 如果没有监听器但有'error'事件，抛出错误
      if (eventName === 'error') {
        const error = args[0] instanceof Error ? args[0] : new Error(String(args[0]));
        throw error;
      }
      return false;
    }
    
    // 复制监听器数组以防在执行过程中被修改
    const listenersCopy = [...listeners];
    
    // 异步执行所有监听器
    const promises = listenersCopy.map(listener => {
      try {
        const result = listener.apply(this, args);
        // 如果监听器返回Promise，等待其完成
        if (result && typeof result.then === 'function') {
          return result;
        }
        return Promise.resolve(result);
      } catch (error) {
        logger.error(`事件监听器执行错误: '${String(eventName)}'`, { error: error.message });
        // 触发error事件
        this.emit('error', error);
        return Promise.reject(error);
      }
    });
    
    // 等待所有监听器执行完成
    Promise.allSettled(promises).catch(error => {
      logger.error(`事件处理出错: '${String(eventName)}'`, { error: error.message });
    });
    
    if (this.isDebug) {
      logger.debug(`触发事件: '${String(eventName)}'`, { listenersCount: listenersCopy.length });
    }
    
    return true;
  }

  /**
   * 异步触发事件
   * @param {string|symbol} eventName - 事件名称
   * @param {...*} args - 传递给监听器的参数
   * @returns {Promise<Array>} 所有监听器执行结果的Promise
   */
  async emitAsync(eventName, ...args) {
    this._recordEventHistory(eventName, args);
    
    if (this.isPaused) {
      this.pausedEvents.push({ eventName, args });
      return [];
    }
    
    const listeners = this.events.get(eventName);
    if (!listeners || listeners.length === 0) {
      if (eventName === 'error') {
        const error = args[0] instanceof Error ? args[0] : new Error(String(args[0]));
        throw error;
      }
      return [];
    }
    
    const listenersCopy = [...listeners];
    
    try {
      const results = await PromiseUtils.all(listenersCopy.map(listener => {
        try {
          return Promise.resolve(listener.apply(this, args));
        } catch (error) {
          // 触发error事件但不中断其他监听器
          this.emit('error', error);
          return Promise.reject(error);
        }
      }));
      
      return results;
    } catch (error) {
      logger.error(`异步事件处理出错: '${String(eventName)}'`, { error: error.message });
      throw error;
    }
  }

  /**
   * 记录事件历史
   * @private
   */
  _recordEventHistory(eventName, args) {
    if (!this.eventHistory.has(eventName)) {
      this.eventHistory.set(eventName, []);
    }
    
    const history = this.eventHistory.get(eventName);
    history.push({
      timestamp: Date.now(),
      args: args.length === 1 ? args[0] : args
    });
    
    // 限制历史记录数量
    if (history.length > 1000) {
      history.shift();
    }
  }

  /**
   * 获取事件历史
   * @param {string|symbol} eventName - 事件名称
   * @param {number} [limit=100] - 返回记录数量限制
   * @returns {Array} 事件历史记录
   */
  getEventHistory(eventName, limit = 100) {
    const history = this.eventHistory.get(eventName) || [];
    return history.slice(-limit);
  }

  /**
   * 清除事件历史
   * @param {string|symbol} [eventName] - 事件名称，不提供则清除所有
   */
  clearEventHistory(eventName) {
    if (eventName) {
      this.eventHistory.delete(eventName);
    } else {
      this.eventHistory.clear();
    }
  }

  /**
   * 获取所有已注册的事件名称
   * @returns {Array<string|symbol>} 事件名称数组
   */
  eventNames() {
    return Array.from(this.events.keys());
  }

  /**
   * 暂停事件触发
   */
  pauseEvents() {
    this.isPaused = true;
    if (this.isDebug) {
      logger.debug('事件触发已暂停');
    }
  }

  /**
   * 恢复事件触发并处理暂停期间的事件
   */
  resumeEvents() {
    this.isPaused = false;
    
    // 处理暂停期间积累的事件
    while (this.pausedEvents.length > 0) {
      const { eventName, args } = this.pausedEvents.shift();
      this.emit(eventName, ...args);
    }
    
    if (this.isDebug) {
      logger.debug('事件触发已恢复');
    }
  }

  /**
   * 创建节流事件处理器
   * @param {string|symbol} eventName - 事件名称
   * @param {number} delayMs - 延迟时间（毫秒）
   * @returns {Function} 节流后的事件处理器
   */
  throttle(eventName, delayMs) {
    let lastCall = 0;
    let timeoutId = null;
    
    return (...args) => {
      const now = Date.now();
      const remaining = delayMs - (now - lastCall);
      
      if (remaining <= 0) {
        // 如果已经超过延迟时间，立即触发
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        
        lastCall = now;
        this.emit(eventName, ...args);
      } else if (!timeoutId) {
        // 如果没有等待中的触发，设置延迟触发
        timeoutId = setTimeout(() => {
          lastCall = Date.now();
          timeoutId = null;
          this.emit(eventName, ...args);
        }, remaining);
      }
    };
  }

  /**
   * 创建防抖事件处理器
   * @param {string|symbol} eventName - 事件名称
   * @param {number} delayMs - 延迟时间（毫秒）
   * @param {boolean} [immediate=false] - 是否立即触发第一次
   * @returns {Function} 防抖后的事件处理器
   */
  debounce(eventName, delayMs, immediate = false) {
    let timeoutId = null;
    
    return (...args) => {
      const later = () => {
        timeoutId = null;
        if (!immediate) {
          this.emit(eventName, ...args);
        }
      };
      
      const callNow = immediate && !timeoutId;
      
      clearTimeout(timeoutId);
      timeoutId = setTimeout(later, delayMs);
      
      if (callNow) {
        this.emit(eventName, ...args);
      }
    };
  }
}

/**
 * 事件总线类
 * 全局单例事件管理器
 */
class EventBus extends EventEmitter {
  constructor(options = {}) {
    super(options);
    this.namespaces = new Map();
    logger.debug('创建事件总线实例');
  }

  /**
   * 获取或创建命名空间
   * @param {string} namespace - 命名空间名称
   * @returns {EventEmitter} 命名空间的事件发射器
   */
  namespace(namespace) {
    if (!this.namespaces.has(namespace)) {
      const emitter = new EventEmitter(this.options);
      this.namespaces.set(namespace, emitter);
      logger.debug(`创建事件命名空间: '${namespace}'`);
    }
    
    return this.namespaces.get(namespace);
  }

  /**
   * 移除命名空间
   * @param {string} namespace - 命名空间名称
   * @returns {boolean} 是否移除成功
   */
  removeNamespace(namespace) {
    if (this.namespaces.has(namespace)) {
      const emitter = this.namespaces.get(namespace);
      emitter.removeAllListeners();
      this.namespaces.delete(namespace);
      logger.debug(`移除事件命名空间: '${namespace}'`);
      return true;
    }
    return false;
  }

  /**
   * 获取所有命名空间名称
   * @returns {Array<string>} 命名空间名称数组
   */
  getNamespaces() {
    return Array.from(this.namespaces.keys());
  }

  /**
   * 在命名空间中触发事件
   * @param {string} namespace - 命名空间名称
   * @param {string|symbol} eventName - 事件名称
   * @param {...*} args - 传递给监听器的参数
   * @returns {boolean} 是否有监听器被调用
   */
  emitTo(namespace, eventName, ...args) {
    const emitter = this.namespaces.get(namespace);
    if (emitter) {
      return emitter.emit(eventName, ...args);
    }
    return false;
  }

  /**
   * 清除所有命名空间
   */
  clearNamespaces() {
    for (const namespace of this.namespaces.keys()) {
      this.removeNamespace(namespace);
    }
  }

  /**
   * 销毁事件总线
   */
  destroy() {
    this.clearNamespaces();
    this.removeAllListeners();
    this.clearEventHistory();
  }
}

/**
 * 事件工具主类
 */
class EventEmitterUtils {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   */
  constructor(options = {}) {
    this.options = options;
    this.globalBus = new EventBus(options);
    logger.debug('创建事件工具实例');
  }

  /**
   * 创建事件发射器
   * @param {Object} options - 配置选项
   * @returns {EventEmitter} 事件发射器实例
   */
  createEmitter(options = {}) {
    return new EventEmitter({ ...this.options, ...options });
  }

  /**
   * 获取全局事件总线
   * @returns {EventBus} 全局事件总线实例
   */
  getGlobalBus() {
    return this.globalBus;
  }

  /**
   * 创建自定义事件对象
   * @param {string} type - 事件类型
   * @param {Object} [options={}] - 事件选项
   * @returns {Event} 事件对象
   */
  createEvent(type, options = {}) {
    if (typeof window !== 'undefined' && typeof window.CustomEvent === 'function') {
      return new window.CustomEvent(type, options);
    }
    
    // Node.js环境或不支持CustomEvent的浏览器的兼容实现
    const event = {
      type,
      bubbles: !!options.bubbles,
      cancelable: !!options.cancelable,
      composed: !!options.composed,
      detail: options.detail || null,
      defaultPrevented: false,
      
      preventDefault: function() {
        if (this.cancelable) {
          this.defaultPrevented = true;
        }
      },
      
      stopPropagation: function() {
        this.propagationStopped = true;
      },
      
      stopImmediatePropagation: function() {
        this.propagationStopped = true;
        this.immediatePropagationStopped = true;
      }
    };
    
    return event;
  }

  /**
   * 事件监听器组合器
   * @param {...Function} listeners - 要组合的监听器函数
   * @returns {Function} 组合后的监听器函数
   */
  composeListeners(...listeners) {
    return function composedListener(...args) {
      for (const listener of listeners) {
        if (typeof listener === 'function') {
          try {
            listener.apply(this, args);
          } catch (error) {
            logger.error('组合监听器执行错误', { error: error.message });
          }
        }
      }
    };
  }

  /**
   * 监听DOM事件（浏览器环境）
   * @param {HTMLElement|EventTarget} target - 事件目标
   * @param {string} eventName - 事件名称
   * @param {Function} listener - 监听器函数
   * @param {Object} [options={}] - 监听选项
   * @returns {Object} 包含remove方法的控制器对象
   */
  listenToDOM(target, eventName, listener, options = {}) {
    if (!target || typeof target.addEventListener !== 'function') {
      throw new Error('无效的DOM目标');
    }
    
    target.addEventListener(eventName, listener, options);
    
    return {
      remove: () => {
        target.removeEventListener(eventName, listener, options);
      }
    };
  }

  /**
   * 创建事件过滤器
   * @param {Function} predicate - 过滤条件函数
   * @returns {Function} 过滤后的事件处理器
   */
  filterEvents(predicate) {
    return function filteredHandler(event, ...args) {
      if (predicate(event, ...args)) {
        return this.emit(event.name || event.type, event, ...args);
      }
    };
  }
}

// 单例模式
let instance = null;

function getInstance(options = {}) {
  if (!instance) {
    instance = new EventEmitterUtils(options);
  }
  return instance;
}

module.exports = {
  EventEmitterUtils,
  getInstance,
  // 导出各事件类供直接使用
  EventEmitter,
  EventBus
};