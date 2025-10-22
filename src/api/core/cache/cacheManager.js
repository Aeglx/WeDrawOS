/**
 * Redis缓存管理器
 * 提供缓存操作、发布订阅功能和缓存策略支持
 */

const redis = require('redis');
const logger = require('../utils/logger');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// Redis客户端配置
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || '',
  db: process.env.REDIS_DB || 0,
  retry_strategy: options => {
    const delay = Math.min(options.attempt * 50, 2000);
    return delay;
  }
};

// 创建Redis客户端实例
let redisClient = null;
let pubClient = null;
let subClient = null;

// 订阅者回调映射
const subscriberCallbacks = new Map();

// 本地内存缓存（用于Redis不可用时的降级方案）
const localCache = new Map();
const localCacheTtl = new Map();

/**
 * 初始化Redis连接
 */
async function initialize() {
  try {
    // 普通Redis客户端（用于一般缓存操作）
    redisClient = redis.createClient(redisConfig);
    
    // 发布订阅客户端
    pubClient = redis.createClient(redisConfig);
    subClient = redis.createClient(redisConfig);
    
    // 连接到Redis
    await redisClient.connect();
    await pubClient.connect();
    await subClient.connect();
    
    // 测试连接
    await redisClient.ping();
    logger.info('Redis连接成功');
    
    // 注册错误处理
    redisClient.on('error', handleRedisError);
    pubClient.on('error', handleRedisError);
    subClient.on('error', handleRedisError);
    
    // 设置订阅消息处理器
    subClient.on('message', (channel, message) => {
      const callbacks = subscriberCallbacks.get(channel);
      if (callbacks && callbacks.length > 0) {
        try {
          const parsedMessage = JSON.parse(message);
          callbacks.forEach(callback => {
            try {
              callback(parsedMessage);
            } catch (err) {
              logger.error(`执行订阅回调时出错: ${err.message}`);
            }
          });
        } catch (parseError) {
          logger.error(`解析Redis消息时出错: ${parseError.message}`);
        }
      }
    });
    
  } catch (error) {
    logger.error('Redis连接失败:', error);
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
async function set(key, value, ttl = 3600) {
  try {
    // 无论Redis是否可用，都设置本地缓存作为降级方案
    setLocalCache(key, value, ttl);
    
    if (!redisClient) {
      logger.warn(`Redis客户端未初始化，仅设置本地缓存: ${key}`);
      return;
    }
    
    const jsonValue = JSON.stringify(value);
    if (ttl > 0) {
      await redisClient.set(key, jsonValue, { EX: ttl });
    } else {
      await redisClient.set(key, jsonValue);
    }
    
    logger.debug(`缓存设置成功: ${key}`);
  } catch (error) {
    logger.error(`设置Redis缓存失败 [${key}]: ${error.message}，已设置本地缓存`);
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
async function delete(key) {
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
 * 获取缓存
 * @param {string} key - 缓存键
 * @returns {*} 缓存值
 */
async function get(key) {
  try {
    if (!redisClient) {
      logger.warn('Redis客户端未初始化');
      return null;
    }
    
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    logger.error(`获取缓存失败 [${key}]: ${error.message}`);
    return null;
  }
}

/**
 * 删除缓存
 * @param {string} key - 缓存键
 */
async function del(key) {
  try {
    if (!redisClient) {
      logger.warn('Redis客户端未初始化');
      return;
    }
    
    await redisClient.del(key);
    logger.debug(`缓存删除成功: ${key}`);
  } catch (error) {
    logger.error(`删除缓存失败 [${key}]: ${error.message}`);
  }
}

/**
 * 发布消息
 * @param {string} channel - 通道名称
 * @param {*} message - 消息内容
 */
async function publish(channel, message) {
  try {
    if (!pubClient) {
      logger.warn('Redis发布客户端未初始化');
      return;
    }
    
    const jsonMessage = JSON.stringify(message);
    await pubClient.publish(channel, jsonMessage);
    logger.debug(`消息发布成功: ${channel}`);
  } catch (error) {
    logger.error(`发布消息失败 [${channel}]: ${error.message}`);
  }
}

/**
 * 订阅消息
 * @param {string} channel - 通道名称
 * @param {Function} callback - 回调函数
 */
async function subscribe(channel, callback) {
  try {
    if (!subClient) {
      logger.warn('Redis订阅客户端未初始化');
      return;
    }
    
    // 添加回调到映射
    if (!subscriberCallbacks.has(channel)) {
      subscriberCallbacks.set(channel, []);
      // 首次订阅时，执行实际的Redis订阅
      await subClient.subscribe(channel);
      logger.info(`开始订阅通道: ${channel}`);
    }
    
    subscriberCallbacks.get(channel).push(callback);
  } catch (error) {
    logger.error(`订阅消息失败 [${channel}]: ${error.message}`);
  }
}

/**
 * 取消订阅
 * @param {string} channel - 通道名称
 * @param {Function} callback - 回调函数（可选，不传则取消所有订阅）
 */
async function unsubscribe(channel, callback = null) {
  try {
    if (!subClient) {
      logger.warn('Redis订阅客户端未初始化');
      return;
    }
    
    if (subscriberCallbacks.has(channel)) {
      if (callback) {
        // 移除特定回调
        const callbacks = subscriberCallbacks.get(channel);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
        
        // 如果没有回调了，取消Redis订阅
        if (callbacks.length === 0) {
          subscriberCallbacks.delete(channel);
          await subClient.unsubscribe(channel);
          logger.info(`取消订阅通道: ${channel}`);
        }
      } else {
        // 取消所有回调
        subscriberCallbacks.delete(channel);
        await subClient.unsubscribe(channel);
        logger.info(`取消订阅通道: ${channel}`);
      }
    }
  } catch (error) {
    logger.error(`取消订阅失败 [${channel}]: ${error.message}`);
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
  delete,
  deleteByPattern,
  clearAll,
  increment,
  expire,
  publish,
  subscribe,
  unsubscribe,
  close
};