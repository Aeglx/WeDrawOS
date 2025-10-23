/**
 * 高级缓存策略管理器
 * 整合多种缓存策略（内存缓存、Redis缓存等），提供智能缓存控制
 */

const logger = require('../utils/logger');
const { AppError } = require('../exception/handlers/errorHandler');

/**
 * 缓存策略管理器类
 */
class CacheStrategyManager {
  constructor() {
    this.strategies = {};
    this.defaultStrategy = null;
    this.logger = logger;
    this.logger.info('缓存策略管理器初始化');
  }

  /**
   * 注册缓存策略
   * @param {string} name - 策略名称
   * @param {Object} strategy - 策略对象
   * @param {boolean} isDefault - 是否设为默认策略
   */
  registerStrategy(name, strategy, isDefault = false) {
    if (!strategy || 
        typeof strategy.get !== 'function' || 
        typeof strategy.set !== 'function' || 
        typeof strategy.delete !== 'function') {
      throw new Error('缓存策略必须实现get、set和delete方法');
    }

    this.strategies[name] = strategy;
    
    if (isDefault || !this.defaultStrategy) {
      this.defaultStrategy = name;
      this.logger.info(`设置默认缓存策略: ${name}`);
    }
    
    this.logger.info(`缓存策略 ${name} 注册成功`);
  }

  /**
   * 设置默认缓存策略
   * @param {string} name - 策略名称
   */
  setDefaultStrategy(name) {
    if (!this.strategies[name]) {
      throw new Error(`缓存策略 ${name} 不存在`);
    }
    
    this.defaultStrategy = name;
    this.logger.info(`默认缓存策略更改为: ${name}`);
  }

  /**
   * 获取缓存策略实例
   * @param {string} name - 策略名称（可选，默认使用默认策略）
   * @returns {Object} 缓存策略实例
   */
  getStrategy(name = null) {
    const strategyName = name || this.defaultStrategy;
    
    if (!strategyName || !this.strategies[strategyName]) {
      throw new Error('未找到可用的缓存策略');
    }
    
    return this.strategies[strategyName];
  }

  /**
   * 获取缓存
   * @param {string} key - 缓存键
   * @param {Object} options - 选项
   * @param {string} options.strategy - 使用的缓存策略
   * @returns {Promise<any>} 缓存值
   */
  async get(key, options = {}) {
    const strategy = this.getStrategy(options.strategy);
    
    try {
      const value = await strategy.get(key);
      this.logger.debug(`从缓存获取数据: ${key}`, { strategy: options.strategy || this.defaultStrategy });
      return value;
    } catch (error) {
      this.logger.error(`获取缓存失败: ${key}`, error);
      
      // 如果配置了降级策略，尝试使用降级策略
      if (options.fallbackStrategy && options.fallbackStrategy !== (options.strategy || this.defaultStrategy)) {
        try {
          this.logger.warn(`尝试使用降级策略获取缓存: ${key}`);
          const fallbackStrategy = this.getStrategy(options.fallbackStrategy);
          return await fallbackStrategy.get(key);
        } catch (fallbackError) {
          this.logger.error(`降级策略获取缓存失败: ${key}`, fallbackError);
        }
      }
      
      return null;
    }
  }

  /**
   * 设置缓存
   * @param {string} key - 缓存键
   * @param {*} value - 缓存值
   * @param {Object} options - 选项
   * @param {number} options.ttl - 过期时间（秒）
   * @param {string} options.strategy - 使用的缓存策略
   * @param {boolean} options.multiStrategy - 是否在多个策略中设置
   * @returns {Promise<boolean>} 是否成功
   */
  async set(key, value, options = {}) {
    const { ttl = 3600, strategy = null, multiStrategy = false } = options;
    
    try {
      // 序列化值
      const serializedValue = this._serializeValue(value);
      
      if (multiStrategy) {
        // 在所有策略中设置
        const promises = Object.values(this.strategies).map(async (s) => {
          try {
            await s.set(key, serializedValue, ttl);
            return true;
          } catch (error) {
            this.logger.error(`多策略缓存设置失败: ${key}`, error);
            return false;
          }
        });
        
        const results = await Promise.all(promises);
        const success = results.some(r => r);
        
        if (success) {
          this.logger.debug(`多策略缓存设置成功: ${key}`);
          return true;
        } else {
          throw new Error('所有缓存策略设置均失败');
        }
      } else {
        // 单策略设置
        const cacheStrategy = this.getStrategy(strategy);
        await cacheStrategy.set(key, serializedValue, ttl);
        this.logger.debug(`缓存设置成功: ${key}`, { ttl, strategy: strategy || this.defaultStrategy });
        return true;
      }
    } catch (error) {
      this.logger.error(`设置缓存失败: ${key}`, error);
      return false;
    }
  }

  /**
   * 删除缓存
   * @param {string} key - 缓存键
   * @param {Object} options - 选项
   * @param {string} options.strategy - 使用的缓存策略
   * @param {boolean} options.multiStrategy - 是否在多个策略中删除
   * @returns {Promise<boolean>} 是否成功
   */
  async delete(key, options = {}) {
    const { strategy = null, multiStrategy = false } = options;
    
    try {
      if (multiStrategy) {
        // 在所有策略中删除
        const promises = Object.values(this.strategies).map(async (s) => {
          try {
            await s.delete(key);
            return true;
          } catch (error) {
            this.logger.error(`多策略缓存删除失败: ${key}`, error);
            return false;
          }
        });
        
        const results = await Promise.all(promises);
        const success = results.some(r => r);
        
        if (success) {
          this.logger.debug(`多策略缓存删除成功: ${key}`);
        }
        
        return success;
      } else {
        // 单策略删除
        const cacheStrategy = this.getStrategy(strategy);
        await cacheStrategy.delete(key);
        this.logger.debug(`缓存删除成功: ${key}`, { strategy: strategy || this.defaultStrategy });
        return true;
      }
    } catch (error) {
      this.logger.error(`删除缓存失败: ${key}`, error);
      return false;
    }
  }

  /**
   * 批量获取缓存
   * @param {Array<string>} keys - 缓存键数组
   * @param {Object} options - 选项
   * @returns {Promise<Object>} 键值映射
   */
  async getMultiple(keys, options = {}) {
    const strategy = this.getStrategy(options.strategy);
    
    try {
      // 如果策略支持批量获取
      if (typeof strategy.getMultiple === 'function') {
        const result = await strategy.getMultiple(keys);
        this.logger.debug(`批量获取缓存成功: ${keys.length} 个键`);
        return result;
      } else {
        // 不支持批量获取时，逐个获取
        const result = {};
        const promises = keys.map(async (key) => {
          result[key] = await this.get(key, options);
        });
        
        await Promise.all(promises);
        return result;
      }
    } catch (error) {
      this.logger.error(`批量获取缓存失败`, error);
      return {};
    }
  }

  /**
   * 批量设置缓存
   * @param {Array<{key: string, value: *, ttl?: number}>} items - 缓存项数组
   * @param {Object} options - 选项
   * @returns {Promise<Array<string>>} 成功设置的键数组
   */
  async setMultiple(items, options = {}) {
    const strategy = this.getStrategy(options.strategy);
    
    try {
      // 如果策略支持批量设置
      if (typeof strategy.setMultiple === 'function') {
        const serializedItems = items.map(item => ({
          key: item.key,
          value: this._serializeValue(item.value),
          ttl: item.ttl || options.ttl || 3600
        }));
        
        const result = await strategy.setMultiple(serializedItems);
        this.logger.debug(`批量设置缓存成功: ${result.length} 个键`);
        return result;
      } else {
        // 不支持批量设置时，逐个设置
        const successKeys = [];
        const promises = items.map(async (item) => {
          const success = await this.set(item.key, item.value, {
            ttl: item.ttl || options.ttl,
            strategy: options.strategy
          });
          
          if (success) {
            successKeys.push(item.key);
          }
        });
        
        await Promise.all(promises);
        return successKeys;
      }
    } catch (error) {
      this.logger.error(`批量设置缓存失败`, error);
      return [];
    }
  }

  /**
   * 缓存包装器 - 自动处理缓存逻辑
   * @param {string} key - 缓存键
   * @param {Function} fetchFn - 获取数据的函数
   * @param {Object} options - 选项
   * @returns {Promise<any>} 数据
   */
  async withCache(key, fetchFn, options = {}) {
    const { ttl = 3600, strategy = null, forceRefresh = false } = options;
    
    // 尝试从缓存获取数据
    if (!forceRefresh) {
      try {
        const cachedData = await this.get(key, { strategy });
        if (cachedData !== null && cachedData !== undefined) {
          this.logger.debug(`缓存命中: ${key}`);
          return this._deserializeValue(cachedData);
        }
      } catch (error) {
        this.logger.warn(`缓存获取失败，将重新获取数据: ${key}`, error);
      }
    }
    
    // 缓存未命中，执行获取函数
    try {
      this.logger.debug(`缓存未命中，执行获取函数: ${key}`);
      const data = await fetchFn();
      
      // 设置缓存
      if (data !== null && data !== undefined) {
        await this.set(key, data, { ttl, strategy });
      }
      
      return data;
    } catch (error) {
      this.logger.error(`获取数据失败: ${key}`, error);
      throw new AppError(500, '数据获取失败', 500);
    }
  }

  /**
   * 清空缓存
   * @param {Object} options - 选项
   * @returns {Promise<boolean>} 是否成功
   */
  async clear(options = {}) {
    const { strategy = null } = options;
    
    try {
      if (strategy) {
        // 清空特定策略
        const cacheStrategy = this.getStrategy(strategy);
        await cacheStrategy.clear();
        this.logger.info(`清空缓存策略: ${strategy}`);
      } else {
        // 清空所有策略
        const promises = Object.entries(this.strategies).map(async ([name, s]) => {
          try {
            await s.clear();
            return true;
          } catch (error) {
            this.logger.error(`清空缓存策略失败: ${name}`, error);
            return false;
          }
        });
        
        await Promise.all(promises);
        this.logger.info('清空所有缓存策略');
      }
      
      return true;
    } catch (error) {
      this.logger.error('清空缓存失败', error);
      return false;
    }
  }

  /**
   * 获取缓存统计信息
   * @returns {Promise<Object>} 统计信息
   */
  async getStats() {
    const stats = {};
    
    for (const [name, strategy] of Object.entries(this.strategies)) {
      try {
        if (typeof strategy.getStats === 'function') {
          stats[name] = await strategy.getStats();
        } else {
          stats[name] = { supported: false };
        }
      } catch (error) {
        this.logger.error(`获取缓存统计失败: ${name}`, error);
        stats[name] = { error: error.message };
      }
    }
    
    return stats;
  }

  /**
   * 序列化值
   * @private
   * @param {*} value - 要序列化的值
   * @returns {string|Buffer} 序列化后的值
   */
  _serializeValue(value) {
    if (value === null || value === undefined) {
      return value;
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    
    return value;
  }

  /**
   * 反序列化值
   * @private
   * @param {string|Buffer} value - 要反序列化的值
   * @returns {*} 反序列化后的值
   */
  _deserializeValue(value) {
    if (value === null || value === undefined || typeof value !== 'string') {
      return value;
    }
    
    // 尝试JSON解析
    try {
      return JSON.parse(value);
    } catch (error) {
      // 不是JSON格式，直接返回
      return value;
    }
  }
}

// 创建单例实例
const cacheStrategyManager = new CacheStrategyManager();

module.exports = {
  CacheStrategyManager,
  cacheStrategyManager
};