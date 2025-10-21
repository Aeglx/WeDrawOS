/**
 * Redis缓存管理器
 * 提供缓存操作和发布订阅功能
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
 * 设置缓存
 * @param {string} key - 缓存键
 * @param {*} value - 缓存值
 * @param {number} ttl - 过期时间（秒）
 */
async function set(key, value, ttl = 3600) {
  try {
    if (!redisClient) {
      logger.warn('Redis客户端未初始化');
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
    logger.error(`设置缓存失败 [${key}]: ${error.message}`);
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
    if (redisClient) {
      await redisClient.quit();
    }
    if (pubClient) {
      await pubClient.quit();
    }
    if (subClient) {
      await subClient.quit();
    }
    
    logger.info('Redis连接已关闭');
  } catch (error) {
    logger.error('关闭Redis连接失败:', error);
  }
}

module.exports = {
  initialize,
  set,
  get,
  del,
  publish,
  subscribe,
  unsubscribe,
  isConnected,
  close
};