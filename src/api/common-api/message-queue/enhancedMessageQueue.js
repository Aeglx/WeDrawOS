/**
 * 增强的消息队列管理器
 * 支持消息重试、死信队列和消息监控
 */

const redis = require('redis');
const logger = require('@core/utils/logger');
const { v4: uuidv4 } = require('uuid');

class EnhancedMessageQueue {
  constructor(options = {}) {
    this.options = {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || '',
      db: process.env.REDIS_DB || 0,
      // 重试配置
      maxRetries: 3,
      initialRetryDelay: 1000, // 1秒
      retryBackoff: 2, // 指数退避
      // 死信配置
      deadLetterExpiration: 86400, // 24小时
      // 监控配置
      enableMonitoring: true,
      monitoringInterval: 60000, // 1分钟
      ...options
    };

    this.redisClient = null;
    this.pubClient = null;
    this.subClient = null;
    this.subscribers = new Map();
    this.messageStats = {
      processed: 0,
      failed: 0,
      retried: 0,
      dead: 0,
      successRate: 0,
      latency: 0
    };
    this.startTime = Date.now();
  }

  /**
   * 初始化连接
   */
  async initialize() {
    try {
      // 创建Redis客户端
      this.redisClient = redis.createClient({
        host: this.options.host,
        port: this.options.port,
        password: this.options.password,
        db: this.options.db,
        retry_strategy: options => {
          const delay = Math.min(options.attempt * 100, 3000);
          return delay;
        }
      });

      // 发布订阅客户端
      this.pubClient = redis.createClient({
        host: this.options.host,
        port: this.options.port,
        password: this.options.password,
        db: this.options.db
      });

      this.subClient = redis.createClient({
        host: this.options.host,
        port: this.options.port,
        password: this.options.password,
        db: this.options.db
      });

      // 连接客户端
      await this.redisClient.connect();
      await this.pubClient.connect();
      await this.subClient.connect();

      // 测试连接
      await this.redisClient.ping();
      logger.info('增强消息队列Redis连接成功');

      // 注册错误处理器
      this.redisClient.on('error', this._handleRedisError.bind(this));
      this.pubClient.on('error', this._handleRedisError.bind(this));
      this.subClient.on('error', this._handleRedisError.bind(this));

      // 设置消息处理器
      this.subClient.on('message', this._handleMessage.bind(this));

      // 启动监控
      if (this.options.enableMonitoring) {
        this._startMonitoring();
      }

      return true;
    } catch (error) {
      logger.error('增强消息队列初始化失败:', error);
      return false;
    }
  }

  /**
   * 发布消息
   * @param {string} channel - 消息通道
   * @param {Object} data - 消息数据
   * @param {Object} options - 消息选项
   */
  async publish(channel, data, options = {}) {
    try {
      // 生成消息ID
      const messageId = uuidv4();
      
      // 创建消息对象
      const message = {
        id: messageId,
        channel,
        data,
        attempts: 0,
        createdAt: Date.now(),
        lastAttempt: null,
        options: {
          maxRetries: this.options.maxRetries,
          ...options
        }
      };

      // 发布消息
      const jsonMessage = JSON.stringify(message);
      await this.pubClient.publish(channel, jsonMessage);
      
      logger.debug(`消息发布成功: ${channel} (ID: ${messageId})`);
      return { success: true, messageId };
    } catch (error) {
      logger.error(`发布消息失败 [${channel}]: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * 订阅消息
   * @param {string} channel - 消息通道
   * @param {Function} handler - 消息处理函数
   * @param {Object} options - 订阅选项
   */
  async subscribe(channel, handler, options = {}) {
    try {
      // 存储订阅者信息
      if (!this.subscribers.has(channel)) {
        this.subscribers.set(channel, []);
        // 首次订阅时，执行实际的Redis订阅
        await this.subClient.subscribe(channel);
        logger.info(`开始订阅通道: ${channel}`);
      }

      this.subscribers.get(channel).push({
        handler,
        options: {
          autoAck: true,
          ...options
        }
      });

      return true;
    } catch (error) {
      logger.error(`订阅消息失败 [${channel}]: ${error.message}`);
      return false;
    }
  }

  /**
   * 取消订阅
   * @param {string} channel - 消息通道
   * @param {Function} handler - 要取消的处理函数（可选）
   */
  async unsubscribe(channel, handler = null) {
    try {
      if (!this.subscribers.has(channel)) {
        return false;
      }

      if (handler) {
        // 移除特定处理函数
        const subscribers = this.subscribers.get(channel);
        const filtered = subscribers.filter(sub => sub.handler !== handler);
        
        if (filtered.length === 0) {
          // 没有处理函数了，取消Redis订阅
          this.subscribers.delete(channel);
          await this.subClient.unsubscribe(channel);
          logger.info(`取消订阅通道: ${channel}`);
        } else {
          this.subscribers.set(channel, filtered);
        }
      } else {
        // 取消所有处理函数
        this.subscribers.delete(channel);
        await this.subClient.unsubscribe(channel);
        logger.info(`取消订阅通道: ${channel}`);
      }

      return true;
    } catch (error) {
      logger.error(`取消订阅失败 [${channel}]: ${error.message}`);
      return false;
    }
  }

  /**
   * 处理接收到的消息
   * @private
   */
  async _handleMessage(channel, message) {
    try {
      const parsedMessage = JSON.parse(message);
      const startTime = Date.now();
      
      // 获取订阅者
      const subscribers = this.subscribers.get(channel);
      if (!subscribers || subscribers.length === 0) {
        logger.warn(`没有找到通道 ${channel} 的订阅者`);
        return;
      }

      // 处理消息
      for (const subscriber of subscribers) {
        await this._processMessageWithRetry(subscriber, parsedMessage, startTime);
      }
    } catch (parseError) {
      logger.error(`解析消息失败: ${parseError.message}`);
      // 增加失败统计
      this.messageStats.failed++;
    }
  }

  /**
   * 使用重试机制处理消息
   * @private
   */
  async _processMessageWithRetry(subscriber, message, startTime) {
    try {
      // 更新消息尝试次数
      message.attempts++;
      message.lastAttempt = Date.now();
      
      // 调用处理函数
      await subscriber.handler(message.data);
      
      // 更新统计
      this.messageStats.processed++;
      this.messageStats.latency = Date.now() - startTime;
      
      logger.debug(`消息处理成功: ${message.channel} (ID: ${message.id}, 尝试: ${message.attempts})`);
    } catch (error) {
      logger.error(`消息处理失败: ${message.channel} (ID: ${message.id}, 尝试: ${message.attempts})`, error);
      
      // 检查是否需要重试
      const maxRetries = message.options.maxRetries || this.options.maxRetries;
      if (message.attempts < maxRetries) {
        // 计算重试延迟（指数退避）
        const delay = this.options.initialRetryDelay * Math.pow(this.options.retryBackoff, message.attempts - 1);
        
        // 计划重试
        setTimeout(async () => {
          try {
            await this.publish(message.channel, message.data, message.options);
            this.messageStats.retried++;
            logger.info(`消息已重新发布用于重试: ${message.channel} (ID: ${message.id}, 下次尝试: ${message.attempts + 1})`);
          } catch (retryError) {
            logger.error(`消息重试发布失败: ${message.channel} (ID: ${message.id})`, retryError);
            // 直接移至死信队列
            await this._sendToDeadLetter(message, error);
          }
        }, delay);
      } else {
        // 达到最大重试次数，移至死信队列
        await this._sendToDeadLetter(message, error);
      }
    }
  }

  /**
   * 将消息移至死信队列
   * @private
   */
  async _sendToDeadLetter(message, error) {
    try {
      const deadLetterMessage = {
        ...message,
        error: error.message,
        errorStack: error.stack,
        deadAt: Date.now()
      };

      const deadLetterKey = `deadletter:${message.channel}:${message.id}`;
      await this.redisClient.set(deadLetterKey, JSON.stringify(deadLetterMessage));
      await this.redisClient.expire(deadLetterKey, this.options.deadLetterExpiration);
      
      // 发布死信事件
      await this.pubClient.publish('deadletter.message', deadLetterMessage);
      
      this.messageStats.dead++;
      this.messageStats.failed++;
      
      logger.warn(`消息已移至死信队列: ${message.channel} (ID: ${message.id})`);
    } catch (dlqError) {
      logger.error(`将消息移至死信队列失败: ${message.channel} (ID: ${message.id})`, dlqError);
    }
  }

  /**
   * 启动监控
   * @private
   */
  _startMonitoring() {
    setInterval(() => {
      this._reportStats();
    }, this.options.monitoringInterval);
  }

  /**
   * 报告统计信息
   * @private
   */
  async _reportStats() {
    try {
      // 计算成功率
      const totalProcessed = this.messageStats.processed + this.messageStats.failed;
      this.messageStats.successRate = totalProcessed > 0 
        ? (this.messageStats.processed / totalProcessed * 100).toFixed(2)
        : 0;

      // 保存统计信息
      const statsKey = 'messagequeue:stats:latest';
      await this.redisClient.set(statsKey, JSON.stringify({
        timestamp: new Date().toISOString(),
        stats: this.messageStats,
        uptime: (Date.now() - this.startTime) / 1000 // 秒
      }), 3600);

      logger.info(`消息队列统计: 处理 ${this.messageStats.processed}, 失败 ${this.messageStats.failed}, 重试 ${this.messageStats.retried}, 死信 ${this.messageStats.dead}, 成功率 ${this.messageStats.successRate}%`);
    } catch (error) {
      logger.error('报告消息队列统计失败:', error);
    }
  }

  /**
   * 获取统计信息
   */
  async getStats() {
    try {
      const statsKey = 'messagequeue:stats:latest';
      const statsJson = await this.redisClient.get(statsKey);
      return statsJson ? JSON.parse(statsJson) : { stats: this.messageStats };
    } catch (error) {
      logger.error('获取消息队列统计失败:', error);
      return { stats: this.messageStats };
    }
  }

  /**
   * 获取死信消息
   * @param {string} channel - 可选的通道过滤
   * @param {number} limit - 返回的最大消息数
   */
  async getDeadLetterMessages(channel = null, limit = 100) {
    try {
      const pattern = channel ? `deadletter:${channel}:*` : 'deadletter:*';
      const keys = await this.redisClient.keys(pattern);
      const limitedKeys = keys.slice(0, limit);
      
      const messages = [];
      for (const key of limitedKeys) {
        const messageJson = await this.redisClient.get(key);
        if (messageJson) {
          messages.push(JSON.parse(messageJson));
        }
      }
      
      return messages;
    } catch (error) {
      logger.error('获取死信消息失败:', error);
      return [];
    }
  }

  /**
   * 重新发布死信消息
   * @param {string} messageId - 消息ID
   * @param {string} channel - 消息通道
   */
  async retryDeadLetterMessage(messageId, channel) {
    try {
      const deadLetterKey = `deadletter:${channel}:${messageId}`;
      const messageJson = await this.redisClient.get(deadLetterKey);
      
      if (!messageJson) {
        logger.warn(`死信消息不存在: ${channel} (ID: ${messageId})`);
        return false;
      }

      const message = JSON.parse(messageJson);
      
      // 重置尝试次数
      message.attempts = 0;
      
      // 重新发布
      await this.publish(channel, message.data, message.options);
      
      // 从死信队列移除
      await this.redisClient.del(deadLetterKey);
      
      logger.info(`死信消息已重新发布: ${channel} (ID: ${messageId})`);
      return true;
    } catch (error) {
      logger.error(`重新发布死信消息失败: ${channel} (ID: ${messageId})`, error);
      return false;
    }
  }

  /**
   * 处理Redis错误
   * @private
   */
  _handleRedisError(error) {
    logger.error('Redis错误:', error);
  }

  /**
   * 关闭连接
   */
  async close() {
    try {
      if (this.redisClient) {
        await this.redisClient.quit();
      }
      if (this.pubClient) {
        await this.pubClient.quit();
      }
      if (this.subClient) {
        await this.subClient.quit();
      }
      logger.info('增强消息队列连接已关闭');
    } catch (error) {
      logger.error('关闭增强消息队列连接失败:', error);
    }
  }
}

// 导出单例实例
let instance = null;
function getInstance(options = {}) {
  if (!instance) {
    instance = new EnhancedMessageQueue(options);
  }
  return instance;
}

module.exports = {
  EnhancedMessageQueue,
  getInstance
};