/**
 * 消息队列生产者
 * 负责向消息队列发送各类消息
 */

const amqp = require('amqplib');
const logger = require('../../../core/utils/logger');
const { MESSAGE_TOPICS, isValidTopic } = require('../topics/messageTopics');

class MessageProducer {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.config = {
      host: process.env.RABBITMQ_HOST || 'localhost',
      port: process.env.RABBITMQ_PORT || 5672,
      username: process.env.RABBITMQ_USERNAME || 'guest',
      password: process.env.RABBITMQ_PASSWORD || 'guest',
      vhost: process.env.RABBITMQ_VHOST || '/',
    };
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 5000; // 5秒
  }
  
  /**
   * 初始化消息生产者
   */
  async initialize() {
    try {
      const url = `amqp://${this.config.username}:${this.config.password}@${this.config.host}:${this.config.port}/${this.config.vhost}`;
      
      this.connection = await amqp.connect(url);
      this.channel = await this.connection.createChannel();
      
      // 设置连接事件处理
      this.connection.on('error', (err) => {
        logger.error('RabbitMQ连接错误:', err);
        this.connected = false;
        this.handleReconnect();
      });
      
      this.connection.on('close', () => {
        logger.info('RabbitMQ连接关闭');
        this.connected = false;
        this.handleReconnect();
      });
      
      this.connected = true;
      this.reconnectAttempts = 0;
      logger.info('消息队列生产者初始化完成');
      
      // 初始化常用的交换机和队列
      await this.setupExchangesAndQueues();
      
      return true;
    } catch (error) {
      logger.error('消息队列生产者初始化失败:', error);
      this.handleReconnect();
      return false;
    }
  }
  
  /**
   * 设置交换机和队列
   */
  async setupExchangesAndQueues() {
    try {
      if (!this.channel) return;
      
      // 创建主题交换机
      await this.channel.assertExchange('topic_exchange', 'topic', {
        durable: true,
      });
      
      // 创建一些常用的队列和绑定
      const queueBindings = [
        // 用户相关队列
        { queue: 'user_events', routingKey: 'user.*' },
        // 订单相关队列
        { queue: 'order_events', routingKey: 'order.*' },
        // 系统通知队列
        { queue: 'notification_events', routingKey: 'notification.*' },
        // 错误日志队列
        { queue: 'error_logs', routingKey: 'system.error.logged' },
      ];
      
      // 声明队列并绑定
      for (const binding of queueBindings) {
        await this.channel.assertQueue(binding.queue, {
          durable: true,
        });
        await this.channel.bindQueue(binding.queue, 'topic_exchange', binding.routingKey);
      }
      
      logger.info('消息队列交换机和队列设置完成');
    } catch (error) {
      logger.error('设置交换机和队列失败:', error);
    }
  }
  
  /**
   * 发送消息
   * @param {string} topic 消息主题
   * @param {object} data 消息数据
   * @param {object} options 发送选项
   * @returns {Promise<boolean>} 是否发送成功
   */
  async send(topic, data, options = {}) {
    try {
      // 验证主题
      if (!isValidTopic(topic)) {
        logger.error(`无效的消息主题: ${topic}`);
        return false;
      }
      
      // 检查连接状态
      if (!this.connected || !this.channel) {
        logger.error('消息队列未连接，无法发送消息');
        return false;
      }
      
      // 准备消息内容
      const message = {
        topic,
        data,
        timestamp: new Date().toISOString(),
        messageId: this.generateMessageId(),
      };
      
      const messageOptions = {
        persistent: options.persistent !== undefined ? options.persistent : true,
        expiration: options.expiration,
        headers: options.headers || {},
      };
      
      // 发送消息到交换机
      const sent = await this.channel.publish(
        'topic_exchange',
        topic,
        Buffer.from(JSON.stringify(message)),
        messageOptions
      );
      
      if (sent) {
        logger.info(`消息发送成功: ${topic}`);
        return true;
      } else {
        logger.error(`消息发送失败: ${topic}`);
        return false;
      }
    } catch (error) {
      logger.error(`发送消息失败 [${topic}]:`, error);
      return false;
    }
  }
  
  /**
   * 批量发送消息
   * @param {Array<{topic: string, data: object, options?: object}>} messages 消息数组
   * @returns {Promise<{success: Array, failed: Array}>} 发送结果
   */
  async sendBatch(messages) {
    const success = [];
    const failed = [];
    
    for (const message of messages) {
      const result = await this.send(message.topic, message.data, message.options);
      if (result) {
        success.push(message);
      } else {
        failed.push(message);
      }
    }
    
    return { success, failed };
  }
  
  /**
   * 生成消息ID
   * @returns {string} 唯一的消息ID
   */
  generateMessageId() {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
  
  /**
   * 处理重连逻辑
   */
  handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('已达到最大重连次数，停止重连');
      return;
    }
    
    this.reconnectAttempts++;
    logger.info(`尝试第 ${this.reconnectAttempts} 次重连...`);
    
    setTimeout(async () => {
      await this.initialize();
    }, this.reconnectDelay);
  }
  
  /**
   * 关闭连接
   */
  async shutdown() {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      
      if (this.connection) {
        await this.connection.close();
      }
      
      this.connected = false;
      logger.info('消息队列生产者已关闭');
    } catch (error) {
      logger.error('关闭消息队列生产者失败:', error);
    }
  }
}

module.exports = new MessageProducer();