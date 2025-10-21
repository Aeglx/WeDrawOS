/**
 * Redis缓存配置
 */

const { Redis } = require('ioredis');
const logger = require('@core/utils/logger');

class RedisConfig {
  constructor() {
    this.redisClient = null;
    this.config = {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || null,
      db: process.env.REDIS_DB || 0,
      retryStrategy(times) {
        return Math.min(times * 50, 2000);
      },
      keepAlive: 30000,
    };
    
    // 缓存键前缀
    this.keyPrefixes = {
      CATEGORY: 'category:',
      REGION: 'region:',
      USER: 'user:',
      PRODUCT: 'product:',
      SEARCH: 'search:',
      CONFIG: 'config:',
      STATISTICS: 'stats:',
    };
    
    // 缓存过期时间（秒）
    this.expirationTimes = {
      SHORT: 60, // 1分钟
      MEDIUM: 300, // 5分钟
      LONG: 3600, // 1小时
      VERY_LONG: 86400, // 1天
      NEVER: null, // 永不过期
    };
  }
  
  /**
   * 初始化Redis连接
   */
  async initialize() {
    try {
      this.redisClient = new Redis(this.config);
      
      // 监听连接事件
      this.redisClient.on('connect', () => {
        logger.info('Redis连接成功');
      });
      
      this.redisClient.on('error', (error) => {
        logger.error('Redis连接错误:', error);
      });
      
      this.redisClient.on('reconnecting', () => {
        logger.info('Redis重新连接中...');
      });
      
      this.redisClient.on('end', () => {
        logger.info('Redis连接已关闭');
      });
      
      // 测试连接
      await this.redisClient.ping();
      logger.info('Redis缓存服务初始化完成');
      
      return true;
    } catch (error) {
      logger.error('Redis初始化失败:', error);
      return false;
    }
  }
  
  /**
   * 获取缓存键
   * @param {string} prefix 键前缀
   * @param {string} id 标识符
   * @returns {string} 完整的缓存键
   */
  getKey(prefix, id) {
    return `${prefix}${id}`;
  }
  
  /**
   * 设置缓存
   * @param {string} key 缓存键
   * @param {*} value 缓存值
   * @param {number} expiresIn 过期时间（秒）
   */
  async set(key, value, expiresIn = this.expirationTimes.MEDIUM) {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      
      if (expiresIn) {
        await this.redisClient.setex(key, expiresIn, stringValue);
      } else {
        await this.redisClient.set(key, stringValue);
      }
      
      return true;
    } catch (error) {
      logger.error('Redis设置缓存失败:', error);
      return false;
    }
  }
  
  /**
   * 获取缓存
   * @param {string} key 缓存键
   * @param {boolean} parseJson 是否解析JSON
   * @returns {*} 缓存值
   */
  async get(key, parseJson = true) {
    try {
      const value = await this.redisClient.get(key);
      
      if (value === null) {
        return null;
      }
      
      return parseJson ? JSON.parse(value) : value;
    } catch (error) {
      logger.error('Redis获取缓存失败:', error);
      return null;
    }
  }
  
  /**
   * 删除缓存
   * @param {string} key 缓存键
   */
  async delete(key) {
    try {
      await this.redisClient.del(key);
      return true;
    } catch (error) {
      logger.error('Redis删除缓存失败:', error);
      return false;
    }
  }
  
  /**
   * 批量删除缓存（支持通配符）
   * @param {string} pattern 键模式
   */
  async deletePattern(pattern) {
    try {
      const keys = await this.redisClient.keys(pattern);
      if (keys.length > 0) {
        await this.redisClient.del(keys);
      }
      return true;
    } catch (error) {
      logger.error('Redis批量删除缓存失败:', error);
      return false;
    }
  }
  
  /**
   * 设置哈希表缓存
   * @param {string} key 缓存键
   * @param {string} field 字段名
   * @param {*} value 字段值
   */
  async hset(key, field, value) {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      await this.redisClient.hset(key, field, stringValue);
      return true;
    } catch (error) {
      logger.error('Redis设置哈希表缓存失败:', error);
      return false;
    }
  }
  
  /**
   * 获取哈希表缓存
   * @param {string} key 缓存键
   * @param {string} field 字段名
   * @returns {*} 字段值
   */
  async hget(key, field) {
    try {
      const value = await this.redisClient.hget(key, field);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Redis获取哈希表缓存失败:', error);
      return null;
    }
  }
  
  /**
   * 设置缓存过期时间
   * @param {string} key 缓存键
   * @param {number} expiresIn 过期时间（秒）
   */
  async expire(key, expiresIn) {
    try {
      await this.redisClient.expire(key, expiresIn);
      return true;
    } catch (error) {
      logger.error('Redis设置过期时间失败:', error);
      return false;
    }
  }
  
  /**
   * 缓存预热 - 预加载常用数据
   */
  async warmup() {
    try {
      logger.info('开始缓存预热...');
      
      // 这里可以添加需要预热的数据
      // 例如：预加载商品分类、地区信息等
      
      logger.info('缓存预热完成');
      return true;
    } catch (error) {
      logger.error('缓存预热失败:', error);
      return false;
    }
  }
  
  /**
   * 关闭Redis连接
   */
  async shutdown() {
    try {
      if (this.redisClient) {
        await this.redisClient.quit();
        logger.info('Redis连接已关闭');
      }
    } catch (error) {
      logger.error('Redis关闭连接失败:', error);
    }
  }
}

module.exports = new RedisConfig();