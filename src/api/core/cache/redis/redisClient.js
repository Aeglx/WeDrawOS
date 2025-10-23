/**
 * Redis客户端
 * 提供Redis连接和操作功能
 */

const redis = require('redis');
const logger = require('../../utils/logger');
const config = require('../../../config/config');

class RedisClient {
  constructor() {
    this.client = null;
    this.pubClient = null;
    this.subClient = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.config = this.loadConfig();
  }

  /**
   * 加载Redis配置
   */
  loadConfig() {
    const redisConfig = config.redis || {};
    return {
      host: redisConfig.host || 'localhost',
      port: redisConfig.port || 6379,
      password: redisConfig.password || '',
      db: redisConfig.db || 0,
      maxRetriesPerRequest: redisConfig.maxRetriesPerRequest || 5,
      retryStrategy: (times) => {
        if (times > this.maxReconnectAttempts) {
          logger.error('Redis重连次数超过限制，停止重连');
          return undefined;
        }
        const delay = Math.min(times * this.reconnectDelay, 10000);
        logger.warn(`Redis连接失败，${delay}ms后尝试重连...`);
        return delay;
      }
    };
  }

  /**
   * 初始化Redis客户端
   */
  async init() {
    try {
      // 创建主要客户端
      this.client = redis.createClient({
        ...this.config,
        legacyMode: true
      });

      // 创建发布订阅客户端
      this.pubClient = redis.createClient({
        ...this.config,
        legacyMode: true
      });

      this.subClient = redis.createClient({
        ...this.config,
        legacyMode: true
      });

      // 等待连接
      await this.connectClient(this.client);
      await this.connectClient(this.pubClient);
      await this.connectClient(this.subClient);

      // 转换为Promise API
      await this.client.connect();
      await this.pubClient.connect();
      await this.subClient.connect();

      this.setupEventHandlers();
      this.isConnected = true;
      logger.info('Redis客户端初始化成功');
      
      return this;
    } catch (error) {
      logger.error('Redis客户端初始化失败:', error);
      // 创建模拟客户端作为备用
      this.createMockClient();
      return this;
    }
  }

  /**
   * 连接客户端
   */
  async connectClient(client) {
    return new Promise((resolve, reject) => {
      client.once('connect', resolve);
      client.once('error', reject);
    });
  }

  /**
   * 设置事件处理器
   */
  setupEventHandlers() {
    // 主客户端事件
    this.client.on('error', (error) => {
      logger.error('Redis客户端错误:', error);
      this.isConnected = false;
    });

    this.client.on('reconnecting', (params) => {
      logger.warn('Redis客户端正在重连:', params);
    });

    this.client.on('ready', () => {
      logger.info('Redis客户端已准备就绪');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.client.on('end', () => {
      logger.info('Redis客户端连接已关闭');
      this.isConnected = false;
    });
  }

  /**
   * 创建模拟客户端
   */
  createMockClient() {
    logger.warn('使用模拟Redis客户端');
    const mockData = {};
    const mockSubscriptions = new Map();

    const mockClient = {
      get: async (key) => mockData[key] || null,
      set: async (key, value, ...args) => {
        mockData[key] = value;
        // 处理过期时间
        if (args[0] === 'EX' && args[1]) {
          setTimeout(() => {
            delete mockData[key];
          }, args[1] * 1000);
        }
        return 'OK';
      },
      del: async (key) => {
        const exists = key in mockData;
        delete mockData[key];
        return exists ? 1 : 0;
      },
      exists: async (key) => key in mockData ? 1 : 0,
      expire: async (key, seconds) => {
        if (key in mockData) {
          setTimeout(() => {
            delete mockData[key];
          }, seconds * 1000);
          return 1;
        }
        return 0;
      },
      ttl: async (key) => key in mockData ? -1 : -2,
      hset: async (key, field, value) => {
        if (!mockData[key]) mockData[key] = {};
        mockData[key][field] = value;
        return 1;
      },
      hget: async (key, field) => mockData[key]?.[field] || null,
      hgetall: async (key) => mockData[key] || {},
      hdel: async (key, field) => {
        if (mockData[key] && field in mockData[key]) {
          delete mockData[key][field];
          return 1;
        }
        return 0;
      },
      lpush: async (key, value) => {
        if (!mockData[key]) mockData[key] = [];
        mockData[key].unshift(value);
        return mockData[key].length;
      },
      rpush: async (key, value) => {
        if (!mockData[key]) mockData[key] = [];
        mockData[key].push(value);
        return mockData[key].length;
      },
      lrange: async (key, start, stop) => mockData[key] || [],
      llen: async (key) => mockData[key]?.length || 0,
      incr: async (key) => {
        if (!mockData[key]) mockData[key] = 0;
        return ++mockData[key];
      },
      decr: async (key) => {
        if (!mockData[key]) mockData[key] = 0;
        return --mockData[key];
      },
      sadd: async (key, value) => {
        if (!mockData[key]) mockData[key] = new Set();
        mockData[key].add(value);
        return 1;
      },
      srem: async (key, value) => {
        if (mockData[key] && mockData[key].has(value)) {
          mockData[key].delete(value);
          return 1;
        }
        return 0;
      },
      smembers: async (key) => mockData[key] ? Array.from(mockData[key]) : [],
      connect: async () => Promise.resolve(),
      disconnect: async () => Promise.resolve()
    };

    this.client = mockClient;
    this.pubClient = {
      publish: async (channel, message) => {
        logger.info(`[模拟] 发布消息到频道 ${channel}:`, message);
        // 模拟发布订阅
        if (mockSubscriptions.has(channel)) {
          mockSubscriptions.get(channel).forEach(callback => {
            try {
              callback(channel, message);
            } catch (error) {
              logger.error('订阅回调执行失败:', error);
            }
          });
        }
        return 1;
      },
      connect: async () => Promise.resolve()
    };

    this.subClient = {
      subscribe: async (channel, callback) => {
        logger.info(`[模拟] 订阅频道 ${channel}`);
        if (!mockSubscriptions.has(channel)) {
          mockSubscriptions.set(channel, []);
        }
        mockSubscriptions.get(channel).push(callback);
        return 1;
      },
      unsubscribe: async (channel) => {
        logger.info(`[模拟] 取消订阅频道 ${channel}`);
        mockSubscriptions.delete(channel);
        return 1;
      },
      connect: async () => Promise.resolve()
    };

    this.isConnected = true;
  }

  /**
   * 获取Redis客户端
   */
  getClient() {
    return this.client;
  }

  /**
   * 设置键值对
   */
  async set(key, value, expiration = null) {
    try {
      if (expiration) {
        return await this.client.set(key, value, 'EX', expiration);
      }
      return await this.client.set(key, value);
    } catch (error) {
      logger.error(`Redis set操作失败 (${key}):`, error);
      throw error;
    }
  }

  /**
   * 获取键值
   */
  async get(key) {
    try {
      return await this.client.get(key);
    } catch (error) {
      logger.error(`Redis get操作失败 (${key}):`, error);
      throw error;
    }
  }

  /**
   * 删除键
   */
  async del(key) {
    try {
      return await this.client.del(key);
    } catch (error) {
      logger.error(`Redis del操作失败 (${key}):`, error);
      throw error;
    }
  }

  /**
   * 检查键是否存在
   */
  async exists(key) {
    try {
      return await this.client.exists(key) > 0;
    } catch (error) {
      logger.error(`Redis exists操作失败 (${key}):`, error);
      throw error;
    }
  }

  /**
   * 设置过期时间
   */
  async expire(key, seconds) {
    try {
      return await this.client.expire(key, seconds);
    } catch (error) {
      logger.error(`Redis expire操作失败 (${key}):`, error);
      throw error;
    }
  }

  /**
   * 获取剩余过期时间
   */
  async ttl(key) {
    try {
      return await this.client.ttl(key);
    } catch (error) {
      logger.error(`Redis ttl操作失败 (${key}):`, error);
      throw error;
    }
  }

  /**
   * 设置哈希字段
   */
  async hset(key, field, value) {
    try {
      return await this.client.hset(key, field, value);
    } catch (error) {
      logger.error(`Redis hset操作失败 (${key}:${field}):`, error);
      throw error;
    }
  }

  /**
   * 获取哈希字段
   */
  async hget(key, field) {
    try {
      return await this.client.hget(key, field);
    } catch (error) {
      logger.error(`Redis hget操作失败 (${key}:${field}):`, error);
      throw error;
    }
  }

  /**
   * 获取所有哈希字段
   */
  async hgetall(key) {
    try {
      return await this.client.hgetall(key);
    } catch (error) {
      logger.error(`Redis hgetall操作失败 (${key}):`, error);
      throw error;
    }
  }

  /**
   * 删除哈希字段
   */
  async hdel(key, field) {
    try {
      return await this.client.hdel(key, field);
    } catch (error) {
      logger.error(`Redis hdel操作失败 (${key}:${field}):`, error);
      throw error;
    }
  }

  /**
   * 列表操作 - 左侧推入
   */
  async lpush(key, value) {
    try {
      return await this.client.lpush(key, value);
    } catch (error) {
      logger.error(`Redis lpush操作失败 (${key}):`, error);
      throw error;
    }
  }

  /**
   * 列表操作 - 右侧推入
   */
  async rpush(key, value) {
    try {
      return await this.client.rpush(key, value);
    } catch (error) {
      logger.error(`Redis rpush操作失败 (${key}):`, error);
      throw error;
    }
  }

  /**
   * 列表操作 - 获取范围
   */
  async lrange(key, start, stop) {
    try {
      return await this.client.lrange(key, start, stop);
    } catch (error) {
      logger.error(`Redis lrange操作失败 (${key}):`, error);
      throw error;
    }
  }

  /**
   * 列表操作 - 获取长度
   */
  async llen(key) {
    try {
      return await this.client.llen(key);
    } catch (error) {
      logger.error(`Redis llen操作失败 (${key}):`, error);
      throw error;
    }
  }

  /**
   * 递增操作
   */
  async incr(key) {
    try {
      return await this.client.incr(key);
    } catch (error) {
      logger.error(`Redis incr操作失败 (${key}):`, error);
      throw error;
    }
  }

  /**
   * 递减操作
   */
  async decr(key) {
    try {
      return await this.client.decr(key);
    } catch (error) {
      logger.error(`Redis decr操作失败 (${key}):`, error);
      throw error;
    }
  }

  /**
   * 集合操作 - 添加元素
   */
  async sadd(key, value) {
    try {
      return await this.client.sadd(key, value);
    } catch (error) {
      logger.error(`Redis sadd操作失败 (${key}):`, error);
      throw error;
    }
  }

  /**
   * 集合操作 - 删除元素
   */
  async srem(key, value) {
    try {
      return await this.client.srem(key, value);
    } catch (error) {
      logger.error(`Redis srem操作失败 (${key}):`, error);
      throw error;
    }
  }

  /**
   * 集合操作 - 获取所有元素
   */
  async smembers(key) {
    try {
      return await this.client.smembers(key);
    } catch (error) {
      logger.error(`Redis smembers操作失败 (${key}):`, error);
      throw error;
    }
  }

  /**
   * 发布消息
   */
  async publish(channel, message) {
    try {
      const msgStr = typeof message === 'string' ? message : JSON.stringify(message);
      return await this.pubClient.publish(channel, msgStr);
    } catch (error) {
      logger.error(`Redis publish操作失败 (${channel}):`, error);
      throw error;
    }
  }

  /**
   * 订阅频道
   */
  async subscribe(channel, callback) {
    try {
      return await this.subClient.subscribe(channel, (message, channelName) => {
        try {
          // 尝试解析JSON
          let parsedMessage = message;
          if (typeof message === 'string') {
            try {
              parsedMessage = JSON.parse(message);
            } catch (e) {
              // 不是JSON，保持原字符串
            }
          }
          callback(channelName, parsedMessage);
        } catch (error) {
          logger.error('订阅回调执行失败:', error);
        }
      });
    } catch (error) {
      logger.error(`Redis subscribe操作失败 (${channel}):`, error);
      throw error;
    }
  }

  /**
   * 取消订阅
   */
  async unsubscribe(channel) {
    try {
      return await this.subClient.unsubscribe(channel);
    } catch (error) {
      logger.error(`Redis unsubscribe操作失败 (${channel}):`, error);
      throw error;
    }
  }

  /**
   * 获取连接状态
   */
  getStatus() {
    return {
      connected: this.isConnected,
      host: this.config.host,
      port: this.config.port,
      db: this.config.db
    };
  }

  /**
   * 关闭连接
   */
  async close() {
    try {
      if (this.client) {
        await this.client.disconnect();
      }
      if (this.pubClient) {
        await this.pubClient.disconnect();
      }
      if (this.subClient) {
        await this.subClient.disconnect();
      }
      logger.info('Redis连接已关闭');
    } catch (error) {
      logger.error('关闭Redis连接失败:', error);
    }
  }

  /**
   * 清理缓存（谨慎使用）
   */
  async flushdb() {
    try {
      logger.warn('执行Redis flushdb操作');
      return await this.client.flushdb();
    } catch (error) {
      logger.error('Redis flushdb操作失败:', error);
      throw error;
    }
  }
}

// 创建单例实例
const redisClient = new RedisClient();

// 导出初始化函数和实例
module.exports = {
  redisClient,
  initRedis: async () => {
    await redisClient.init();
    return redisClient;
  }
};

// 同时导出redisClient作为默认导出，保持向后兼容
module.exports.default = redisClient;