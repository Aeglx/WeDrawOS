/**
 * 消息队列服务
 * 提供基于AMQP的消息队列操作功能
 */

const amqp = require('amqplib');
const logger = require('../utils/logger');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// AMQP连接配置
const amqpConfig = {
  url: process.env.AMQP_URL || 'amqp://localhost',
  options: {
    reconnectStrategy: (retryCount) => Math.min(retryCount * 1000, 5000)
  }
};

let connection = null;
let channel = null;

/**
 * 初始化消息队列连接
 */
async function initialize() {
  try {
    if (!connection) {
      connection = await amqp.connect(amqpConfig.url, amqpConfig.options);
      logger.info('AMQP连接成功');
      
      // 创建通道
      channel = await connection.createChannel();
      logger.info('AMQP通道创建成功');
      
      // 处理连接关闭事件
      connection.on('close', () => {
        logger.warn('AMQP连接已关闭');
        connection = null;
        channel = null;
      });
      
      // 处理连接错误
      connection.on('error', (err) => {
        logger.error('AMQP连接错误:', err);
        connection = null;
        channel = null;
      });
    }
    
    return channel;
  } catch (error) {
    logger.error('AMQP连接失败:', error);
    throw error;
  }
}

/**
 * 发送消息到队列
 * @param {string} queue - 队列名称
 * @param {Object} message - 要发送的消息
 * @param {Object} options - 消息选项
 */
async function send(queue, message, options = {}) {
  try {
    const ch = await initialize();
    
    // 确保队列存在
    await ch.assertQueue(queue, {
      durable: options.durable !== undefined ? options.durable : true
    });
    
    // 发送消息
    const messageBuffer = Buffer.from(JSON.stringify(message));
    ch.sendToQueue(queue, messageBuffer, {
      persistent: options.persistent !== undefined ? options.persistent : true,
      ...options
    });
    
    logger.info(`消息已发送到队列: ${queue}`);
    return true;
  } catch (error) {
    logger.error(`发送消息到队列 ${queue} 失败:`, error);
    return false;
  }
}

/**
 * 从队列接收消息
 * @param {string} queue - 队列名称
 * @param {Function} callback - 消息处理回调函数
 * @param {Object} options - 消费选项
 */
async function receive(queue, callback, options = {}) {
  try {
    const ch = await initialize();
    
    // 确保队列存在
    await ch.assertQueue(queue, {
      durable: options.durable !== undefined ? options.durable : true
    });
    
    // 设置预取数量，避免消费者过载
    ch.prefetch(options.prefetch || 1);
    
    // 消费消息
    ch.consume(queue, async (msg) => {
      if (msg) {
        try {
          const messageContent = JSON.parse(msg.content.toString());
          await callback(messageContent);
          
          // 确认消息已处理
          ch.ack(msg);
        } catch (error) {
          logger.error(`处理队列 ${queue} 中的消息时出错:`, error);
          
          // 根据配置决定是否拒绝消息
          if (options.requeueOnError !== false) {
            ch.nack(msg, false, true); // 重新入队
          } else {
            ch.nack(msg, false, false); // 丢弃消息
          }
        }
      }
    }, {
      noAck: options.noAck || false
    });
    
    logger.info(`开始消费队列: ${queue}`);
    return true;
  } catch (error) {
    logger.error(`开始消费队列 ${queue} 失败:`, error);
    return false;
  }
}

/**
 * 关闭消息队列连接
 */
async function close() {
  try {
    if (channel) {
      await channel.close();
      channel = null;
    }
    
    if (connection) {
      await connection.close();
      connection = null;
    }
    
    logger.info('AMQP连接已关闭');
    return true;
  } catch (error) {
    logger.error('关闭AMQP连接失败:', error);
    return false;
  }
}

module.exports = {
  initialize,
  send,
  receive,
  close
};