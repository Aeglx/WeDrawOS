/**
 * 缓存工具
 * 提供内存缓存和缓存管理功能
 */

const logger = require('../logger');
const { AppError } = require('../../exception/handlers/errorHandler');
const { CacheError } = require('../../exception/handlers/errorHandler');
const { typeUtils } = require('../type');
const { timerUtils } = require('../timer');

/**
 * 缓存项类
 */
class CacheItem {
  /**
   * 构造函数
   * @param {*} value - 缓存值
   * @param {number} ttl - 过期时间（毫秒）
   */
  constructor(value, ttl = null) {
    this.value = value;
    this.createdAt = Date.now();
    this.ttl = ttl;
    this.accessedAt = Date.now();
    this.accessCount = 0;
  }

  /**
   * 是否已过期
   * @returns {boolean} 是否过期
   */
  isExpired() {
    if (this.ttl === null) {
      return false;
    }
    return Date.now() - this.createdAt > this.ttl;
  }

  /**
   * 获取缓存值
   * @returns {*} 缓存值
   */
  getValue() {
    this.accessedAt = Date.now();
    this.accessCount++;
    return this.value;
  }

  /**
   * 获取剩余生存时间
   * @returns {number} 剩余时间（毫秒）
   */
  getRemainingTime() {
    if (this.ttl === null) {
      return Infinity;
    }
    const remaining = this.ttl - (Date.now() - this.createdAt);
    return Math.max(0, remaining);
  }

  /**
   * 更新缓存值
   * @param {*} value - 新值
   */
  updateValue(value) {
    this.value = value;
    this.accessedAt = Date.now();
    this.accessCount++;
  }
}

/**
 * 缓存工具类
 */
class CacheUtils {
  /**
   * 构造函数
   * @param {Object} options - 缓存配置
   */
  constructor(options = {}) {
    this.cache = new Map();
    this.options = {
      maxSize: options.maxSize || 1000,
      defaultTtl: options.defaultTtl || null,
      cleanupInterval: options.cleanupInterval || 60000, // 默认1分钟清理一次
      enableStats: options.enableStats !== false,
      evictionPolicy: options.evictionPolicy || 'LRU' // LRU, LFU, FIFO
    };

    this.stats = {
      hits: 0,
      misses: 0,
      size: 0,
      evictions: 0,
      lastCleanup: Date.now()
    };

    this.cleanupTimer = null;
    this.initializeCleanup();

    logger.debug('缓存工具初始化完成', {
      options: this.options
    });
  }

  /**
   * 初始化定期清理
   * @private
   */
  initializeCleanup() {
    if (this.options.cleanupInterval > 0) {
      this.cleanupTimer = timerUtils.setInterval(() => {
        this.cleanupExpired();
      }, this.options.cleanupInterval);
    }
  }

  /**
   * 设置缓存项
   * @param {string} key - 缓存键
   * @param {*} value - 缓存值
   * @param {Object} options - 缓存选项
   * @returns {boolean} 是否设置成功
   */
  set(key, value, options = {}) {
    if (!key || typeof key !== 'string') {
      throw new CacheError('缓存键必须是非空字符串', {
        code: 'INVALID_CACHE_KEY',
        key
      });
    }

    // 检查缓存大小限制
    if (this.cache.size >= this.options.maxSize && !this.cache.has(key)) {
      this.evictItem();
    }

    const ttl = options.ttl !== undefined ? options.ttl : this.options.defaultTtl;
    const cacheItem = new CacheItem(value, ttl);

    this.cache.set(key, cacheItem);
    this.updateStats({ size: this.cache.size });

    logger.debug('缓存项设置成功', {
      key,
      ttl
    });

    return true;
  }

  /**
   * 获取缓存项
   * @param {string} key - 缓存键
   * @param {*} defaultValue - 默认值
   * @returns {*} 缓存值或默认值
   */
  get(key, defaultValue = undefined) {
    if (!key || typeof key !== 'string') {
      return defaultValue;
    }

    const cacheItem = this.cache.get(key);

    if (!cacheItem) {
      this.updateStats({ misses: 1 });
      logger.debug('缓存未命中', {
        key
      });
      return defaultValue;
    }

    // 检查是否过期
    if (cacheItem.isExpired()) {
      this.delete(key);
      this.updateStats({ misses: 1 });
      logger.debug('缓存已过期', {
        key
      });
      return defaultValue;
    }

    this.updateStats({ hits: 1 });
    logger.debug('缓存命中', {
      key
    });

    return cacheItem.getValue();
  }

  /**
   * 检查缓存键是否存在
   * @param {string} key - 缓存键
   * @returns {boolean} 是否存在
   */
  has(key) {
    if (!key || typeof key !== 'string') {
      return false;
    }

    const cacheItem = this.cache.get(key);

    if (!cacheItem) {
      return false;
    }

    // 检查是否过期
    if (cacheItem.isExpired()) {
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * 删除缓存项
   * @param {string} key - 缓存键
   * @returns {boolean} 是否删除成功
   */
  delete(key) {
    if (!key || typeof key !== 'string') {
      return false;
    }

    const success = this.cache.delete(key);
    
    if (success) {
      this.updateStats({ size: this.cache.size });
      logger.debug('缓存项删除成功', {
        key
      });
    }

    return success;
  }

  /**
   * 清空缓存
   * @returns {boolean} 是否清空成功
   */
  clear() {
    this.cache.clear();
    this.updateStats({ size: 0 });
    logger.debug('缓存已清空');
    return true;
  }

  /**
   * 批量设置缓存
   * @param {Array<Array<string, *, Object>>} items - 缓存项数组
   * @returns {number} 设置成功的数量
   */
  multiSet(items) {
    if (!typeUtils.isArray(items)) {
      throw new CacheError('multiSet参数必须是数组', {
        code: 'INVALID_MULTI_SET_PARAM',
        items
      });
    }

    let count = 0;
    
    items.forEach(([key, value, options]) => {
      try {
        if (this.set(key, value, options)) {
          count++;
        }
      } catch (error) {
        logger.error('批量设置缓存项失败', {
          key,
          error: error.message
        });
      }
    });

    return count;
  }

  /**
   * 批量获取缓存
   * @param {Array<string>} keys - 缓存键数组
   * @returns {Object} 键值对对象
   */
  multiGet(keys) {
    if (!typeUtils.isArray(keys)) {
      throw new CacheError('multiGet参数必须是数组', {
        code: 'INVALID_MULTI_GET_PARAM',
        keys
      });
    }

    const result = {};
    
    keys.forEach(key => {
      const value = this.get(key);
      if (value !== undefined) {
        result[key] = value;
      }
    });

    return result;
  }

  /**
   * 批量删除缓存
   * @param {Array<string>} keys - 缓存键数组
   * @returns {number} 删除成功的数量
   */
  multiDelete(keys) {
    if (!typeUtils.isArray(keys)) {
      throw new CacheError('multiDelete参数必须是数组', {
        code: 'INVALID_MULTI_DELETE_PARAM',
        keys
      });
    }

    let count = 0;
    
    keys.forEach(key => {
      if (this.delete(key)) {
        count++;
      }
    });

    return count;
  }

  /**
   * 获取缓存大小
   * @returns {number} 缓存项数量
   */
  size() {
    return this.cache.size;
  }

  /**
   * 获取所有缓存键
   * @returns {Array<string>} 缓存键数组
   */
  keys() {
    return Array.from(this.cache.keys());
  }

  /**
   * 获取所有缓存值
   * @returns {Array<*>} 缓存值数组
   */
  values() {
    return Array.from(this.cache.values())
      .filter(item => !item.isExpired())
      .map(item => item.getValue());
  }

  /**
   * 获取所有缓存项
   * @returns {Array<{key: string, value: *, item: CacheItem}>} 缓存项数组
   */
  entries() {
    const entries = [];
    
    this.cache.forEach((item, key) => {
      if (!item.isExpired()) {
        entries.push({
          key,
          value: item.getValue(),
          item
        });
      }
    });

    return entries;
  }

  /**
   * 清理过期缓存
   * @returns {number} 清理的数量
   */
  cleanupExpired() {
    let count = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (item.isExpired()) {
        this.delete(key);
        count++;
      }
    }

    this.updateStats({ 
      lastCleanup: Date.now(),
      evictions: this.stats.evictions + count
    });

    logger.debug('过期缓存清理完成', {
      count
    });

    return count;
  }

  /**
   * 根据策略驱逐缓存项
   * @private
   */
  evictItem() {
    if (this.cache.size === 0) {
      return;
    }

    let evictKey = null;
    let evictValue = null;

    switch (this.options.evictionPolicy) {
      case 'LRU':
        // 最近最少使用
        let oldestAccessTime = Infinity;
        this.cache.forEach((item, key) => {
          if (item.accessedAt < oldestAccessTime) {
            oldestAccessTime = item.accessedAt;
            evictKey = key;
            evictValue = item;
          }
        });
        break;

      case 'LFU':
        // 最少频率使用
        let minAccessCount = Infinity;
        let oldestAccessTimeForLFU = Infinity;
        
        this.cache.forEach((item, key) => {
          if (item.accessCount < minAccessCount) {
            minAccessCount = item.accessCount;
            oldestAccessTimeForLFU = item.accessedAt;
            evictKey = key;
            evictValue = item;
          } else if (item.accessCount === minAccessCount && item.accessedAt < oldestAccessTimeForLFU) {
            oldestAccessTimeForLFU = item.accessedAt;
            evictKey = key;
            evictValue = item;
          }
        });
        break;

      case 'FIFO':
        // 先进先出
        let oldestCreatedTime = Infinity;
        this.cache.forEach((item, key) => {
          if (item.createdAt < oldestCreatedTime) {
            oldestCreatedTime = item.createdAt;
            evictKey = key;
            evictValue = item;
          }
        });
        break;

      default:
        // 默认使用LRU
        let defaultOldestAccessTime = Infinity;
        this.cache.forEach((item, key) => {
          if (item.accessedAt < defaultOldestAccessTime) {
            defaultOldestAccessTime = item.accessedAt;
            evictKey = key;
            evictValue = item;
          }
        });
    }

    if (evictKey) {
      this.delete(evictKey);
      this.updateStats({ evictions: this.stats.evictions + 1 });
      logger.debug('缓存项驱逐', {
        key: evictKey,
        policy: this.options.evictionPolicy
      });
    }
  }

  /**
   * 更新统计信息
   * @param {Object} updates - 要更新的统计项
   * @private
   */
  updateStats(updates) {
    if (!this.options.enableStats) {
      return;
    }

    Object.assign(this.stats, updates);
  }

  /**
   * 获取缓存统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    if (!this.options.enableStats) {
      return null;
    }

    // 计算命中率
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;

    return {
      ...this.stats,
      hitRate,
      missRate: 100 - hitRate,
      totalOperations: total
    };
  }

  /**
   * 重置统计信息
   * @returns {boolean} 是否重置成功
   */
  resetStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      size: this.cache.size,
      evictions: 0,
      lastCleanup: Date.now()
    };

    logger.debug('缓存统计已重置');
    return true;
  }

  /**
   * 创建缓存键（用于生成复杂键）
   * @param {...*} parts - 键的组成部分
   * @returns {string} 组合后的缓存键
   */
  createKey(...parts) {
    return parts
      .map(part => {
        if (typeUtils.isObject(part)) {
          try {
            return JSON.stringify(part);
          } catch (error) {
            return String(part);
          }
        }
        return String(part);
      })
      .join(':');
  }

  /**
   * 设置带TTL的缓存
   * @param {string} key - 缓存键
   * @param {*} value - 缓存值
   * @param {number} ttl - 过期时间（毫秒）
   * @returns {boolean} 是否设置成功
   */
  setWithExpiry(key, value, ttl) {
    return this.set(key, value, { ttl });
  }

  /**
   * 递增数值缓存
   * @param {string} key - 缓存键
   * @param {number} increment - 递增量
   * @returns {number} 递增后的值
   */
  increment(key, increment = 1) {
    const current = this.get(key, 0);
    const newValue = current + increment;
    this.set(key, newValue);
    return newValue;
  }

  /**
   * 递减数值缓存
   * @param {string} key - 缓存键
   * @param {number} decrement - 递减量
   * @returns {number} 递减后的值
   */
  decrement(key, decrement = 1) {
    const current = this.get(key, 0);
    const newValue = current - decrement;
    this.set(key, newValue);
    return newValue;
  }

  /**
   * 原子操作：获取并设置
   * @param {string} key - 缓存键
   * @param {*} value - 新值
   * @returns {*} 旧值
   */
  getAndSet(key, value) {
    const oldValue = this.get(key);
    this.set(key, value);
    return oldValue;
  }

  /**
   * 原子操作：设置并获取
   * @param {string} key - 缓存键
   * @param {*} value - 新值
   * @returns {*} 新值
   */
  setAndGet(key, value) {
    this.set(key, value);
    return value;
  }

  /**
   * 原子操作：只有在键不存在时设置
   * @param {string} key - 缓存键
   * @param {*} value - 新值
   * @returns {boolean} 是否设置成功
   */
  setIfNotExists(key, value) {
    if (!this.has(key)) {
      this.set(key, value);
      return true;
    }
    return false;
  }

  /**
   * 销毁缓存实例
   */
  destroy() {
    // 清除定时器
    if (this.cleanupTimer) {
      timerUtils.clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    // 清空缓存
    this.clear();

    logger.debug('缓存实例已销毁');
  }

  /**
   * 创建专用缓存实例
   * @param {Object} options - 缓存配置
   * @returns {CacheUtils} 缓存实例
   */
  createCache(options) {
    return new CacheUtils(options);
  }

  /**
   * 创建LRU缓存
   * @param {Object} options - 缓存配置
   * @returns {CacheUtils} 缓存实例
   */
  createLruCache(options = {}) {
    return new CacheUtils({
      ...options,
      evictionPolicy: 'LRU'
    });
  }

  /**
   * 创建LFU缓存
   * @param {Object} options - 缓存配置
   * @returns {CacheUtils} 缓存实例
   */
  createLfuCache(options = {}) {
    return new CacheUtils({
      ...options,
      evictionPolicy: 'LFU'
    });
  }

  /**
   * 创建FIFO缓存
   * @param {Object} options - 缓存配置
   * @returns {CacheUtils} 缓存实例
   */
  createFifoCache(options = {}) {
    return new CacheUtils({
      ...options,
      evictionPolicy: 'FIFO'
    });
  }

  /**
   * 静态实例
   * @private
   */
  static _instance = null;

  /**
   * 获取单例实例
   * @returns {CacheUtils} 缓存工具实例
   */
  static getInstance() {
    if (!CacheUtils._instance) {
      CacheUtils._instance = new CacheUtils();
    }
    return CacheUtils._instance;
  }

  /**
   * 创建新的缓存工具实例
   * @returns {CacheUtils} 缓存工具实例
   */
  static create() {
    return new CacheUtils();
  }
}

// 创建默认实例
const defaultCacheUtils = CacheUtils.getInstance();

module.exports = {
  CacheUtils,
  cacheUtils: defaultCacheUtils,
  CacheItem
};