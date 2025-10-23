/**
 * 缓存装饰器工具
 * 提供方法级缓存和自动缓存管理功能
 */

const logger = require('../utils/logger');
const { CacheStrategy, ExpirationPolicy } = require('./CacheStrategy');
const { CommonUtils } = require('../utils/CommonUtils');

/**
 * 缓存键生成器类
 */
class CacheKeyGenerator {
  /**
   * 生成缓存键
   * @param {string} prefix - 键前缀
   * @param {Array} args - 方法参数
   * @returns {string} 生成的缓存键
   */
  static generate(prefix, args = []) {
    // 将参数序列化为字符串
    const argsStr = this._serializeArgs(args);
    return `${prefix}:${argsStr}`;
  }

  /**
   * 序列化参数
   * @private
   * @param {Array} args - 要序列化的参数
   * @returns {string} 序列化后的字符串
   */
  static _serializeArgs(args) {
    try {
      // 移除不能序列化的参数（如函数、undefined等）
      const serializableArgs = args.map(arg => {
        if (typeof arg === 'function' || arg === undefined) {
          return null;
        }
        return arg;
      });

      // 使用JSON序列化
      return JSON.stringify(serializableArgs);
    } catch (error) {
      // 如果序列化失败，使用简单的替代方案
      return args.map(arg => String(arg || '')).join(',');
    }
  }

  /**
   * 从方法信息生成前缀
   * @param {Object} target - 目标对象
   * @param {string} propertyKey - 属性键
   * @returns {string} 方法前缀
   */
  static generateMethodPrefix(target, propertyKey) {
    const className = target.constructor.name;
    return `${className}.${propertyKey}`;
  }
}

/**
 * 缓存装饰器工厂
 */
class CacheDecorator {
  /**
   * 构造函数
   * @param {Object} cacheManager - 缓存管理器实例
   * @param {Object} options - 配置选项
   */
  constructor(cacheManager, options = {}) {
    this.cacheManager = cacheManager;
    this.strategy = CacheStrategy.getInstance();
    this.options = {
      defaultTtl: 3600000, // 默认1小时
      defaultPolicy: ExpirationPolicy.TIME_BASED,
      enabled: true,
      ...options
    };

    logger.info('缓存装饰器初始化完成');
  }

  /**
   * 创建缓存装饰器
   * @param {Object} options - 缓存选项
   * @returns {Function} 装饰器函数
   */
  cache(options = {}) {
    const decorator = this;
    const cacheOptions = {
      ...this.options,
      ...options
    };

    return function(target, propertyKey, descriptor) {
      const originalMethod = descriptor.value;
      
      // 保存原始方法以便后续使用
      if (!target._originalMethods) {
        target._originalMethods = {};
      }
      target._originalMethods[propertyKey] = originalMethod;

      descriptor.value = async function(...args) {
        // 如果缓存被禁用，直接调用原始方法
        if (!cacheOptions.enabled) {
          return originalMethod.apply(this, args);
        }

        try {
          // 生成缓存键
          const prefix = CacheKeyGenerator.generateMethodPrefix(target, propertyKey);
          const cacheKey = CacheKeyGenerator.generate(prefix, args);

          // 检查是否有缓存
          const cachedResult = await decorator.cacheManager.get(cacheKey);
          if (cachedResult !== null && cachedResult !== undefined) {
            logger.debug(`缓存命中: ${cacheKey}`);
            
            // 更新访问信息
            decorator.strategy.updateAccess(cacheKey);
            
            return cachedResult;
          }

          // 缓存未命中，执行原方法
          logger.debug(`缓存未命中: ${cacheKey}`);
          const result = await originalMethod.apply(this, args);

          // 缓存结果（如果满足条件）
          if (decorator.strategy.shouldCache(result, cacheOptions.condition)) {
            await decorator.cacheManager.set(cacheKey, result, {
              ttl: cacheOptions.ttl,
              policy: cacheOptions.policy,
              tags: cacheOptions.tags,
              priority: cacheOptions.priority,
              metadata: {
                method: prefix,
                argsCount: args.length,
                cachedAt: new Date().toISOString()
              }
            });

            logger.debug(`结果已缓存: ${cacheKey}`);
          }

          return result;
        } catch (error) {
          logger.error(`缓存装饰器执行失败: ${propertyKey}`, { error: error.message });
          
          // 即使缓存出错，也应该返回原方法的结果
          try {
            return originalMethod.apply(this, args);
          } catch (originalError) {
            throw originalError;
          }
        }
      };

      return descriptor;
    };
  }

  /**
   * 创建条件缓存装饰器
   * @param {Function} condition - 缓存条件函数
   * @param {Object} options - 缓存选项
   * @returns {Function} 装饰器函数
   */
  conditionalCache(condition, options = {}) {
    return this.cache({
      ...options,
      condition
    });
  }

  /**
   * 创建短期缓存装饰器
   * @param {number} ttlMs - 缓存时间（毫秒）
   * @param {Object} options - 缓存选项
   * @returns {Function} 装饰器函数
   */
  shortCache(ttlMs = 60000, options = {}) {
    return this.cache({
      ...options,
      ttl: ttlMs
    });
  }

  /**
   * 创建长期缓存装饰器
   * @param {number} ttlMs - 缓存时间（毫秒）
   * @param {Object} options - 缓存选项
   * @returns {Function} 装饰器函数
   */
  longCache(ttlMs = 86400000, options = {}) {
    return this.cache({
      ...options,
      ttl: ttlMs
    });
  }

  /**
   * 创建滑动窗口缓存装饰器
   * @param {number} ttlMs - 缓存时间（毫秒）
   * @param {Object} options - 缓存选项
   * @returns {Function} 装饰器函数
   */
  slidingWindowCache(ttlMs = 3600000, options = {}) {
    return this.cache({
      ...options,
      ttl: ttlMs,
      policy: ExpirationPolicy.SLIDING_WINDOW
    });
  }

  /**
   * 创建优先级缓存装饰器
   * @param {number} priority - 缓存优先级（0-10）
   * @param {Object} options - 缓存选项
   * @returns {Function} 装饰器函数
   */
  priorityCache(priority = 5, options = {}) {
    return this.cache({
      ...options,
      priority,
      policy: ExpirationPolicy.PRIORITY_BASED
    });
  }

  /**
   * 创建标签缓存装饰器
   * @param {string|Array<string>} tags - 缓存标签
   * @param {Object} options - 缓存选项
   * @returns {Function} 装饰器函数
   */
  taggedCache(tags, options = {}) {
    return this.cache({
      ...options,
      tags: Array.isArray(tags) ? tags : [tags]
    });
  }

  /**
   * 创建缓存清除装饰器
   * @param {string|Function} keys - 要清除的缓存键或生成函数
   * @returns {Function} 装饰器函数
   */
  invalidateCache(keys) {
    const decorator = this;

    return function(target, propertyKey, descriptor) {
      const originalMethod = descriptor.value;

      descriptor.value = async function(...args) {
        try {
          // 执行原始方法
          const result = await originalMethod.apply(this, args);

          // 清除缓存
          if (typeof keys === 'function') {
            // 动态生成缓存键
            const cacheKeys = await keys.apply(this, [result, ...args]);
            if (Array.isArray(cacheKeys)) {
              await Promise.all(cacheKeys.map(key => decorator._invalidateKey(key)));
            } else if (cacheKeys) {
              await decorator._invalidateKey(cacheKeys);
            }
          } else if (typeof keys === 'string') {
            // 清除特定键
            await decorator._invalidateKey(keys);
          } else if (Array.isArray(keys)) {
            // 清除多个键
            await Promise.all(keys.map(key => decorator._invalidateKey(key)));
          }

          return result;
        } catch (error) {
          logger.error(`缓存清除装饰器执行失败: ${propertyKey}`, { error: error.message });
          throw error;
        }
      };

      return descriptor;
    };
  }

  /**
   * 创建标签清除装饰器
   * @param {string|Array<string>} tags - 要清除的缓存标签
   * @returns {Function} 装饰器函数
   */
  invalidateCacheByTags(tags) {
    const decorator = this;
    const tagsToInvalidate = Array.isArray(tags) ? tags : [tags];

    return function(target, propertyKey, descriptor) {
      const originalMethod = descriptor.value;

      descriptor.value = async function(...args) {
        try {
          // 执行原始方法
          const result = await originalMethod.apply(this, args);

          // 清除带有指定标签的缓存
          const keysToRemove = decorator.strategy.removeByTags(tagsToInvalidate);
          
          if (keysToRemove.length > 0) {
            await decorator.cacheManager.delete(keysToRemove);
            logger.debug(`通过标签清除缓存: ${tagsToInvalidate.join(',')}, 共${keysToRemove.length}个键`);
          }

          return result;
        } catch (error) {
          logger.error(`标签缓存清除装饰器执行失败: ${propertyKey}`, { error: error.message });
          throw error;
        }
      };

      return descriptor;
    };
  }

  /**
   * 创建缓存刷新装饰器
   * @param {Object} options - 缓存选项
   * @returns {Function} 装饰器函数
   */
  refreshCache(options = {}) {
    const decorator = this;

    return function(target, propertyKey, descriptor) {
      const originalMethod = descriptor.value;

      descriptor.value = async function(...args) {
        try {
          // 生成缓存键
          const prefix = CacheKeyGenerator.generateMethodPrefix(target, propertyKey);
          const cacheKey = CacheKeyGenerator.generate(prefix, args);

          // 执行原始方法
          const result = await originalMethod.apply(this, args);

          // 刷新缓存
          if (decorator.strategy.shouldCache(result, options.condition)) {
            await decorator.cacheManager.set(cacheKey, result, options);
            logger.debug(`缓存已刷新: ${cacheKey}`);
          }

          return result;
        } catch (error) {
          logger.error(`缓存刷新装饰器执行失败: ${propertyKey}`, { error: error.message });
          throw error;
        }
      };

      return descriptor;
    };
  }

  /**
   * 清除指定键的缓存
   * @private
   * @param {string} key - 缓存键
   */
  async _invalidateKey(key) {
    try {
      await this.cacheManager.delete(key);
      this.strategy.removeMetadata(key);
      logger.debug(`缓存已清除: ${key}`);
    } catch (error) {
      logger.error(`清除缓存失败: ${key}`, { error: error.message });
    }
  }

  /**
   * 手动清除方法的缓存
   * @param {Object} instance - 类实例
   * @param {string} methodName - 方法名
   * @param {Array} args - 方法参数（可选）
   * @returns {Promise<boolean>} 清除是否成功
   */
  async clearMethodCache(instance, methodName, args = null) {
    if (!instance || !methodName) {
      return false;
    }

    try {
      const prefix = `${instance.constructor.name}.${methodName}`;
      
      if (args === null) {
        // 清除该方法的所有缓存（使用通配符）
        const pattern = `${prefix}:*`;
        await this.cacheManager.deletePattern(pattern);
        return true;
      } else {
        // 清除特定参数组合的缓存
        const cacheKey = CacheKeyGenerator.generate(prefix, args);
        await this._invalidateKey(cacheKey);
        return true;
      }
    } catch (error) {
      logger.error(`清除方法缓存失败: ${methodName}`, { error: error.message });
      return false;
    }
  }

  /**
   * 创建缓存性能跟踪装饰器
   * @param {Object} options - 缓存选项
   * @returns {Function} 装饰器函数
   */
  tracedCache(options = {}) {
    const decorator = this;

    return function(target, propertyKey, descriptor) {
      const originalMethod = descriptor.value;

      descriptor.value = async function(...args) {
        const startTime = Date.now();
        let cacheHit = false;

        try {
          // 生成缓存键
          const prefix = CacheKeyGenerator.generateMethodPrefix(target, propertyKey);
          const cacheKey = CacheKeyGenerator.generate(prefix, args);

          // 检查缓存
          const cachedResult = await decorator.cacheManager.get(cacheKey);
          if (cachedResult !== null && cachedResult !== undefined) {
            cacheHit = true;
            decorator.strategy.updateAccess(cacheKey);
            
            // 记录缓存命中性能
            const duration = Date.now() - startTime;
            logger.debug(`缓存命中性能: ${prefix}, 耗时: ${duration}ms`);
            
            return cachedResult;
          }

          // 执行原方法
          const result = await originalMethod.apply(this, args);

          // 缓存结果
          if (decorator.strategy.shouldCache(result, options.condition)) {
            await decorator.cacheManager.set(cacheKey, result, options);
          }

          // 记录缓存未命中性能
          const duration = Date.now() - startTime;
          logger.debug(`缓存未命中性能: ${prefix}, 耗时: ${duration}ms`);

          return result;
        } catch (error) {
          const duration = Date.now() - startTime;
          logger.error(`缓存跟踪失败: ${propertyKey}, 耗时: ${duration}ms`, { 
            error: error.message,
            cacheHit 
          });
          
          // 尝试调用原始方法
          return originalMethod.apply(this, args);
        }
      };

      return descriptor;
    };
  }

  /**
   * 启用/禁用缓存
   * @param {boolean} enabled - 是否启用缓存
   */
  setEnabled(enabled) {
    this.options.enabled = enabled;
    logger.info(`缓存装饰器已${enabled ? '启用' : '禁用'}`);
  }

  /**
   * 创建缓存装饰器工厂（工厂方法）
   * @param {Object} cacheManager - 缓存管理器
   * @param {Object} options - 配置选项
   * @returns {CacheDecorator} 缓存装饰器实例
   */
  static create(cacheManager, options = {}) {
    return new CacheDecorator(cacheManager, options);
  }
}

module.exports = {
  CacheDecorator,
  CacheKeyGenerator
};