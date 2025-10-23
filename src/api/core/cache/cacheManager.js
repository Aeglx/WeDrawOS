/**
 * Redis缓存管理器
 * 提供缓存操作、发布订阅功能和缓存策略支持
 */

const logger = require('../utils/logger');
// 使用我们新创建的Redis客户端模块
const { redisClient } = require('./redisClient');

// 订阅者回调映射
const subscriberCallbacks = new Map();

// 本地内存缓存（用于Redis不可用时的降级方案）
const localCache = new Map();
const localCacheTtl = new Map();

/**
 * 初始化缓存管理器
 */
async function initialize() {
  try {
    // 初始化Redis客户端
    await redisClient.init();
    
    logger.info('Redis缓存管理器初始化成功');
    
    // 测试连接
    const status = redisClient.getStatus();
    if (status && status.connected) {
      logger.info('Redis连接状态: 已连接');
    }
    
  } catch (error) {
    logger.error('Redis缓存管理器初始化失败:', error);
    logger.warn('将使用本地内存缓存作为降级方案');
    // Redis连接失败不应该导致应用崩溃，可以在功能上降级
  }
}

/**
 * 处理Redis错误
 * @param {Error} error - 错误对象
 */
function handleRedisError(error) {
  logger.error('Redis错误:', error);
  // 可以在这里实现错误重试逻辑
}

/**
 * 获取本地缓存
 * @param {string} key - 缓存键
 * @returns {any} 缓存值
 */
function getLocalCache(key) {
  const now = Date.now();
  const expiry = localCacheTtl.get(key);
  
  if (expiry && expiry > now) {
    return JSON.parse(localCache.get(key));
  }
  
  // 清理过期缓存
  localCache.delete(key);
  localCacheTtl.delete(key);
  return null;
}

/**
 * 设置本地缓存
 * @param {string} key - 缓存键
 * @param {*} value - 缓存值
 * @param {number} ttl - 过期时间（秒）
 */
function setLocalCache(key, value, ttl = 3600) {
  localCache.set(key, JSON.stringify(value));
  localCacheTtl.set(key, Date.now() + ttl * 1000);
}

/**
 * 设置缓存
 * @param {string} key - 缓存键
 * @param {*} value - 缓存值
 * @param {number} ttl - 过期时间（秒）
 */
async function set(key, value, ttl = 0) {
  try {
    if (!key) {
      return;
    }
    
    const jsonValue = JSON.stringify(value);
    
    // 尝试设置Redis缓存
    if (redisClient && redisClient.isConnected) {
      await redisClient.set(key, jsonValue, ttl);
    }
    
    // 更新本地缓存
    setLocalCache(key, value, ttl);
  } catch (error) {
    logger.error(`设置缓存失败 (${key}):`, error);
    // 降级到本地缓存
    setLocalCache(key, value, ttl);
  }
}

/**
 * 获取缓存
 * @param {string} key - 缓存键
 * @returns {Promise<any>} 缓存值
 */
async function get(key) {
  try {
    // 优先从Redis获取缓存
    if (redisClient) {
      const value = await redisClient.get(key);
      if (value !== null) {
        const parsedValue = JSON.parse(value);
        // 同时更新本地缓存
        setLocalCache(key, parsedValue);
        logger.debug(`从Redis获取缓存成功: ${key}`);
        return parsedValue;
      }
    }
    
    // Redis不可用或缓存未命中，尝试从本地缓存获取
    const localValue = getLocalCache(key);
    if (localValue !== null) {
      logger.debug(`从本地缓存获取缓存成功: ${key}`);
      return localValue;
    }
    
    logger.debug(`缓存未命中: ${key}`);
    return null;
  } catch (error) {
    logger.error(`获取缓存失败 [${key}]: ${error.message}`);
    // 出错时尝试从本地缓存获取
    return getLocalCache(key);
  }
}

/**
 * 删除缓存
 * @param {string} key - 缓存键
 * @returns {Promise<void>}
 */
async function deleteCache(key) {
  try {
    // 同时删除本地缓存和Redis缓存
    localCache.delete(key);
    localCacheTtl.delete(key);
    
    if (redisClient) {
      await redisClient.del(key);
    }
    
    logger.debug(`缓存删除成功: ${key}`);
  } catch (error) {
    logger.error(`删除缓存失败 [${key}]: ${error.message}`);
  }
}

/**
 * 批量删除缓存（支持模式匹配）
 * @param {string} pattern - 键模式
 * @returns {Promise<number>} 删除的键数量
 */
async function deleteByPattern(pattern) {
  try {
    let deletedCount = 0;
    
    // 删除本地缓存中匹配的键
    for (const key of localCache.keys()) {
      if (key.match(pattern)) {
        localCache.delete(key);
        localCacheTtl.delete(key);
        deletedCount++;
      }
    }
    
    // 删除Redis中匹配的键
    if (redisClient) {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        const redisDeleted = await redisClient.del(keys);
        deletedCount += redisDeleted;
      }
    }
    
    logger.debug(`批量删除缓存成功，模式: ${pattern}，删除数量: ${deletedCount}`);
    return deletedCount;
  } catch (error) {
    logger.error(`批量删除缓存失败 [${pattern}]: ${error.message}`);
    return 0;
  }
}

/**
 * 清理所有缓存
 * @returns {Promise<void>}
 */
async function clearAll() {
  try {
    // 清理本地缓存
    localCache.clear();
    localCacheTtl.clear();
    
    // 清理Redis缓存
    if (redisClient) {
      await redisClient.flushDb();
    }
    
    logger.debug('所有缓存已清理');
  } catch (error) {
    logger.error('清理缓存失败:', error);
  }
}

/**
 * 增加计数器
 * @param {string} key - 缓存键
 * @param {number} increment - 增量，默认为1
 * @returns {Promise<number>} 增加后的值
 */
async function increment(key, increment = 1) {
  try {
    if (redisClient) {
      const value = await redisClient.incrBy(key, increment);
      logger.debug(`计数器增加成功: ${key}, 值: ${value}`);
      return value;
    }
    
    // Redis不可用时，使用本地缓存模拟
    let currentValue = getLocalCache(key) || 0;
    currentValue += increment;
    setLocalCache(key, currentValue);
    return currentValue;
  } catch (error) {
    logger.error(`计数器增加失败 [${key}]: ${error.message}`);
    // 出错时使用本地缓存
    let currentValue = getLocalCache(key) || 0;
    currentValue += increment;
    setLocalCache(key, currentValue);
    return currentValue;
  }
}

/**
 * 设置缓存过期时间
 * @param {string} key - 缓存键
 * @param {number} ttl - 过期时间（秒）
 * @returns {Promise<boolean>} 是否设置成功
 */
async function expire(key, ttl) {
  try {
    if (redisClient) {
      const result = await redisClient.expire(key, ttl);
      logger.debug(`设置缓存过期时间成功: ${key}, ttl: ${ttl}`);
      return result === 1;
    }
    
    // Redis不可用时，更新本地缓存的过期时间
    const value = getLocalCache(key);
    if (value !== null) {
      setLocalCache(key, value, ttl);
      return true;
    }
    
    return false;
  } catch (error) {
    logger.error(`设置缓存过期时间失败 [${key}]: ${error.message}`);
    return false;
  }
}

/**
 * 获取缓存值
 * @param {string} key - 缓存键
 * @returns {Promise<any>} 缓存值
 */
async function get(key) {
  try {
    if (!key) {
      return null;
    }
    
    // 尝试从Redis获取
    if (redisClient && redisClient.isConnected) {
      const value = await redisClient.get(key);
      if (value !== null) {
        try {
          return JSON.parse(value);
        } catch (e) {
          // 如果不是JSON格式，则直接返回字符串
          return value;
        }
      }
    }
    
    // 降级到本地缓存
    const cachedValue = getLocalCache(key);
    return cachedValue;
  } catch (error) {
    logger.error(`获取缓存失败 (${key}):`, error);
    // 降级到本地缓存
    return getLocalCache(key);
  }
}

/**
 * 删除缓存
 * @param {string} key - 缓存键
 */
async function del(key) {
  try {
    if (!key) {
      return;
    }
    
    // 尝试删除Redis缓存
    if (redisClient && redisClient.isConnected) {
      await redisClient.del(key);
    }
    
    // 同步删除本地缓存
    localCache.delete(key);
    localCacheTtl.delete(key);
    logger.debug(`缓存删除成功: ${key}`);
  } catch (error) {
    logger.error(`删除缓存失败 (${key}):`, error);
    // 降级到本地缓存
    localCache.delete(key);
    localCacheTtl.delete(key);
  }
}

/**
 * 发布消息
 * @param {string} channel - 频道名
 * @param {*} message - 消息内容
 */
async function publish(channel, message) {
  try {
    if (!channel) {
      return;
    }
    
    // 尝试发布到Redis
    if (redisClient && redisClient.isConnected) {
      await redisClient.publish(channel, message);
    }
    
    logger.debug(`消息发布成功: ${channel}`);
  } catch (error) {
    logger.error(`消息发布失败 (${channel}):`, error);
  }
}

/**
 * 订阅频道
 * @param {string} channel - 频道名
 * @param {Function} callback - 回调函数
 */
async function subscribe(channel, callback) {
  try {
    if (!channel || typeof callback !== 'function') {
      return;
    }
    
    // 尝试订阅Redis频道
    if (redisClient && redisClient.isConnected) {
      await redisClient.subscribe(channel, (channelName, message) => {
        callback(message);
      });
    }
    
    logger.debug(`频道订阅成功: ${channel}`);
  } catch (error) {
    logger.error(`频道订阅失败 (${channel}):`, error);
  }
}

/**
 * 取消订阅
 * @param {string} channel - 频道名
 */
async function unsubscribe(channel) {
  try {
    if (!channel) {
      return;
    }
    
    // 尝试取消Redis订阅
    if (redisClient && redisClient.isConnected) {
      await redisClient.unsubscribe(channel);
    }
    
    logger.debug(`频道取消订阅成功: ${channel}`);
  } catch (error) {
    logger.error(`频道取消订阅失败 (${channel}):`, error);
  }
}

/**
 * 检查Redis连接状态
 * @returns {boolean} 连接状态
 */
function isConnected() {
  return redisClient && redisClient.isOpen;
}

/**
 * 关闭Redis连接
 */
async function close() {
  try {
    // 关闭所有Redis客户端连接
    if (redisClient) {
      await redisClient.quit();
      redisClient = null;
    }
    
    if (pubClient) {
      await pubClient.quit();
      pubClient = null;
    }
    
    if (subClient) {
      await subClient.quit();
      subClient = null;
    }
    
    // 清空本地缓存
    localCache.clear();
    localCacheTtl.clear();
    subscriberCallbacks.clear();
    
    logger.info('Redis连接已关闭，本地缓存已清空');
  } catch (error) {
    logger.error('关闭Redis连接失败:', error);
  }
}

module.exports = {
  initialize,
  get,
  set,
  delete: deleteCache,
  deleteCache,
  deleteByPattern,
  clearAll,
  increment,
  expire,
  publish,
  subscribe,
  unsubscribe,
  close
};