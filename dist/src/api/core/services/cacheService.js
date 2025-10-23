/**
 * 缓存服务
 * 提供缓存操作功能
 */

const cacheManager = require('../cache/cacheManager');
const { AppError } = require('../exception/handlers/errorHandler');
const logger = require('../utils/logger');
const StringUtils = require('../utils/stringUtils');
const DateUtils = require('../utils/dateUtils');

class CacheService {
  constructor() {
    this.defaultTtl = 3600; // 默认TTL为1小时
  }

  /**
   * 设置缓存
   * @param {string} key - 缓存键
   * @param {*} value - 缓存值
   * @param {number} ttl - 过期时间（秒）
   * @returns {Promise<boolean>} 是否成功
   */
  async set(key, value, ttl = this.defaultTtl) {
    try {
      // 验证缓存键
      if (!StringUtils.isNotEmpty(key)) {
        throw new AppError('缓存键不能为空', 400);
      }

      // 序列化值
      const serializedValue = this.serializeValue(value);
      
      // 设置缓存
      await cacheManager.set(key, serializedValue, ttl);
      
      logger.debug('缓存设置成功', { key, ttl });
      return true;
    } catch (error) {
      logger.error('缓存设置失败', { key, error: error.message });
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError('缓存操作失败', 500);
    }
  }

  /**
   * 获取缓存
   * @param {string} key - 缓存键
   * @param {*} defaultValue - 默认值
   * @returns {Promise<any>} 缓存值或默认值
   */
  async get(key, defaultValue = null) {
    try {
      // 验证缓存键
      if (!StringUtils.isNotEmpty(key)) {
        throw new AppError('缓存键不能为空', 400);
      }

      // 获取缓存
      const value = await cacheManager.get(key);
      
      if (value === null || value === undefined) {
        return defaultValue;
      }

      // 反序列化值
      const deserializedValue = this.deserializeValue(value);
      
      logger.debug('缓存获取成功', { key });
      return deserializedValue;
    } catch (error) {
      logger.error('缓存获取失败', { key, error: error.message });
      
      if (error instanceof AppError) {
        throw error;
      }
      
      // 缓存获取失败时返回默认值，不影响主流程
      return defaultValue;
    }
  }

  /**
   * 删除缓存
   * @param {string|Array<string>} key - 缓存键或键数组
   * @returns {Promise<boolean>} 是否成功
   */
  async delete(key) {
    try {
      if (Array.isArray(key)) {
        // 批量删除
        await Promise.all(key.map(k => cacheManager.del(k)));
        logger.debug('缓存批量删除成功', { keys: key.length });
      } else {
        // 单键删除
        if (!StringUtils.isNotEmpty(key)) {
          throw new AppError('缓存键不能为空', 400);
        }
        await cacheManager.del(key);
        logger.debug('缓存删除成功', { key });
      }
      
      return true;
    } catch (error) {
      logger.error('缓存删除失败', { key, error: error.message });
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError('缓存操作失败', 500);
    }
  }

  /**
   * 检查缓存是否存在
   * @param {string} key - 缓存键
   * @returns {Promise<boolean>} 是否存在
   */
  async exists(key) {
    try {
      const value = await this.get(key);
      return value !== null && value !== undefined;
    } catch (error) {
      logger.error('缓存检查失败', { key, error: error.message });
      return false;
    }
  }

  /**
   * 获取并设置缓存（如果不存在）
   * @param {string} key - 缓存键
   * @param {Function} fn - 获取数据的函数
   * @param {number} ttl - 过期时间（秒）
   * @returns {Promise<any>} 缓存值
   */
  async getOrSet(key, fn, ttl = this.defaultTtl) {
    try {
      // 先尝试获取缓存
      const cachedValue = await this.get(key);
      if (cachedValue !== null && cachedValue !== undefined) {
        return cachedValue;
      }

      // 缓存不存在，执行函数获取数据
      const value = await fn();
      
      // 设置缓存（只有当值不为null/undefined时）
      if (value !== null && value !== undefined) {
        await this.set(key, value, ttl);
      }
      
      return value;
    } catch (error) {
      logger.error('缓存getOrSet操作失败', { key, error: error.message });
      throw error;
    }
  }

  /**
   * 增加计数器
   * @param {string} key - 缓存键
   * @param {number} increment - 增量，默认为1
   * @param {number} ttl - 过期时间（秒）
   * @returns {Promise<number>} 增加后的值
   */
  async increment(key, increment = 1, ttl = this.defaultTtl) {
    try {
      // 注意：这个实现依赖于底层缓存管理器的支持
      // 如果底层不支持incr操作，可以用get和set来模拟
      
      let value = await this.get(key, 0);
      value = Number(value) + increment;
      await this.set(key, value, ttl);
      
      logger.debug('缓存计数器增加', { key, value });
      return value;
    } catch (error) {
      logger.error('缓存计数器增加失败', { key, error: error.message });
      throw new AppError('缓存计数器操作失败', 500);
    }
  }

  /**
   * 减少计数器
   * @param {string} key - 缓存键
   * @param {number} decrement - 减量，默认为1
   * @param {number} ttl - 过期时间（秒）
   * @returns {Promise<number>} 减少后的值
   */
  async decrement(key, decrement = 1, ttl = this.defaultTtl) {
    return this.increment(key, -decrement, ttl);
  }

  /**
   * 设置哈希字段
   * @param {string} key - 缓存键
   * @param {string} field - 字段名
   * @param {*} value - 字段值
   * @returns {Promise<boolean>} 是否成功
   */
  async hset(key, field, value) {
    try {
      // 这个方法需要底层缓存管理器支持哈希操作
      // 这里使用简单的对象来模拟
      
      const hash = await this.get(key, {});
      hash[field] = value;
      await this.set(key, hash);
      
      logger.debug('哈希字段设置成功', { key, field });
      return true;
    } catch (error) {
      logger.error('哈希字段设置失败', { key, field, error: error.message });
      throw new AppError('哈希操作失败', 500);
    }
  }

  /**
   * 获取哈希字段
   * @param {string} key - 缓存键
   * @param {string} field - 字段名
   * @param {*} defaultValue - 默认值
   * @returns {Promise<any>} 字段值
   */
  async hget(key, field, defaultValue = null) {
    try {
      const hash = await this.get(key, {});
      return field in hash ? hash[field] : defaultValue;
    } catch (error) {
      logger.error('哈希字段获取失败', { key, field, error: error.message });
      return defaultValue;
    }
  }

  /**
   * 删除哈希字段
   * @param {string} key - 缓存键
   * @param {string} field - 字段名
   * @returns {Promise<boolean>} 是否成功
   */
  async hdel(key, field) {
    try {
      const hash = await this.get(key, {});
      if (field in hash) {
        delete hash[field];
        await this.set(key, hash);
      }
      
      logger.debug('哈希字段删除成功', { key, field });
      return true;
    } catch (error) {
      logger.error('哈希字段删除失败', { key, field, error: error.message });
      throw new AppError('哈希操作失败', 500);
    }
  }

  /**
   * 设置带过期时间的缓存（基于时间点）
   * @param {string} key - 缓存键
   * @param {*} value - 缓存值
   * @param {Date|string|number} expireTime - 过期时间点
   * @returns {Promise<boolean>} 是否成功
   */
  async setUntil(key, value, expireTime) {
    try {
      const expireDate = DateUtils.parseDate(expireTime);
      if (!expireDate) {
        throw new AppError('无效的过期时间', 400);
      }

      const now = new Date();
      const ttl = Math.max(0, Math.floor((expireDate - now) / 1000));
      
      return await this.set(key, value, ttl);
    } catch (error) {
      logger.error('设置带过期时间的缓存失败', { key, error: error.message });
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError('缓存操作失败', 500);
    }
  }

  /**
   * 清除所有缓存（谨慎使用）
   * @returns {Promise<boolean>} 是否成功
   */
  async clearAll() {
    try {
      // 注意：这个方法需要底层缓存管理器支持
      // 这里只是一个示例实现
      
      logger.warn('尝试清除所有缓存');
      // 实际项目中可能需要调用cacheManager的flushAll方法
      throw new AppError('清除所有缓存操作未实现', 501);
    } catch (error) {
      logger.error('清除所有缓存失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 生成缓存键
   * @param {string} prefix - 键前缀
   * @param {string|number|Array} params - 参数
   * @returns {string} 缓存键
   */
  generateKey(prefix, params) {
    let key = prefix;
    
    if (Array.isArray(params)) {
      key = `${prefix}:${params.join(':')}`;
    } else if (params !== undefined && params !== null) {
      key = `${prefix}:${params}`;
    }
    
    // 移除特殊字符
    return key.replace(/[^a-zA-Z0-9_:.-]/g, '_');
  }

  /**
   * 序列化值
   * @param {*} value - 要序列化的值
   * @returns {string} 序列化后的值
   */
  serializeValue(value) {
    if (typeof value === 'string') {
      return value;
    }
    
    try {
      return JSON.stringify(value);
    } catch (error) {
      logger.error('值序列化失败', { error: error.message });
      return String(value);
    }
  }

  /**
   * 反序列化值
   * @param {string} value - 要反序列化的值
   * @returns {*} 反序列化后的值
   */
  deserializeValue(value) {
    if (value === null || value === undefined) {
      return value;
    }
    
    // 尝试作为JSON解析
    try {
      return JSON.parse(value);
    } catch (error) {
      // 不是有效的JSON，返回原始字符串
      return value;
    }
  }

  /**
   * 获取缓存统计信息
   * @returns {Promise<Object>} 统计信息
   */
  async getStats() {
    try {
      // 这个方法需要底层缓存管理器支持
      return {
        connected: await cacheManager.isConnected(),
        memoryUsage: 'N/A',
        keyCount: 'N/A'
      };
    } catch (error) {
      logger.error('获取缓存统计失败', { error: error.message });
      return {
        connected: false,
        memoryUsage: 'Error',
        keyCount: 'Error'
      };
    }
  }

  /**
   * 创建缓存键的命名空间
   * @param {string} namespace - 命名空间
   * @returns {Object} 带有命名空间的缓存服务实例
   */
  withNamespace(namespace) {
    const self = this;
    
    return {
      set: (key, value, ttl) => self.set(`${namespace}:${key}`, value, ttl),
      get: (key, defaultValue) => self.get(`${namespace}:${key}`, defaultValue),
      delete: (key) => self.delete(`${namespace}:${key}`),
      exists: (key) => self.exists(`${namespace}:${key}`),
      getOrSet: (key, fn, ttl) => self.getOrSet(`${namespace}:${key}`, fn, ttl)
    };
  }
}

// 创建单例实例
const cacheService = new CacheService();

module.exports = cacheService;