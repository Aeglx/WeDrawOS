/**
 * WebSocket服务
 * 提供实时消息通信功能
 */

const logger = require('../../core/utils/logger');
const cacheManager = require('../../core/cache/cacheManager');

class WebSocketService {
  constructor() {
    this.clients = new Map(); // userId -> WebSocket连接映射
    this.userSessions = new Map(); // userId -> sessionId映射
    this.sessionUsers = new Map(); // sessionId -> 用户列表映射
    this.setupEventListeners();
  }

  /**
   * 初始化WebSocket连接
   * @param {Object} ws - WebSocket连接实例
   * @param {Object} userInfo - 用户信息
   */
  connect(ws, userInfo) {
    const { userId, sessionId } = userInfo;
    
    // 保存连接信息
    this.clients.set(userId, ws);
    
    if (sessionId) {
      this.userSessions.set(userId, sessionId);
      
      // 更新会话用户列表
      if (!this.sessionUsers.has(sessionId)) {
        this.sessionUsers.set(sessionId, new Set());
      }
      this.sessionUsers.get(sessionId).add(userId);
    }
    
    logger.info(`用户 ${userId} 连接到WebSocket，会话ID: ${sessionId || '无'}`);
    
    // 发送连接成功消息
    this.send(userId, {
      type: 'system',
      message: '连接成功',
      timestamp: Date.now()
    });
    
    // 监听连接关闭
    ws.on('close', () => this.disconnect(userId));
    
    // 监听消息
    ws.on('message', (message) => this.handleMessage(userId, message));
  }

  /**
   * 断开WebSocket连接
   * @param {string} userId - 用户ID
   */
  disconnect(userId) {
    if (!this.clients.has(userId)) return;
    
    const sessionId = this.userSessions.get(userId);
    
    // 清理连接信息
    this.clients.delete(userId);
    this.userSessions.delete(userId);
    
    // 更新会话用户列表
    if (sessionId && this.sessionUsers.has(sessionId)) {
      this.sessionUsers.get(sessionId).delete(userId);
      if (this.sessionUsers.get(sessionId).size === 0) {
        this.sessionUsers.delete(sessionId);
      }
    }
    
    logger.info(`用户 ${userId} 断开WebSocket连接`);
  }

  /**
   * 向指定用户发送消息
   * @param {string} userId - 用户ID
   * @param {Object} message - 消息内容
   */
  send(userId, message) {
    const ws = this.clients.get(userId);
    
    if (ws && typeof ws.send === 'function') {
      try {
        ws.send(JSON.stringify(message));
        logger.debug(`向用户 ${userId} 发送消息:`, message.type);
        return true;
      } catch (error) {
        logger.error(`向用户 ${userId} 发送消息失败:`, error);
        this.disconnect(userId);
        return false;
      }
    }
    
    logger.warn(`用户 ${userId} 未连接WebSocket`);
    return false;
  }

  /**
   * 向会话中的所有用户发送消息
   * @param {string} sessionId - 会话ID
   * @param {Object} message - 消息内容
   * @param {string} excludeUserId - 排除的用户ID
   */
  broadcastToSession(sessionId, message, excludeUserId = null) {
    const users = this.sessionUsers.get(sessionId);
    
    if (!users) {
      logger.warn(`会话 ${sessionId} 不存在或没有连接的用户`);
      return;
    }
    
    for (const userId of users) {
      if (userId !== excludeUserId) {
        this.send(userId, message);
      }
    }
    
    logger.info(`向会话 ${sessionId} 广播消息，排除用户: ${excludeUserId || '无'}`);
  }

  /**
   * 向所有连接的用户广播消息
   * @param {Object} message - 消息内容
   */
  broadcastToAll(message) {
    for (const userId of this.clients.keys()) {
      this.send(userId, message);
    }
    
    logger.info('向所有连接的用户广播消息');
  }

  /**
   * 处理收到的消息
   * @param {string} userId - 发送消息的用户ID
   * @param {string} rawMessage - 原始消息数据
   */
  handleMessage(userId, rawMessage) {
    try {
      const message = JSON.parse(rawMessage);
      
      logger.debug(`收到用户 ${userId} 的消息:`, message.type);
      
      // 验证消息格式
      if (!message.type) {
        throw new Error('消息缺少type字段');
      }
      
      // 处理不同类型的消息
      switch (message.type) {
        case 'chat':
          this.handleChatMessage(userId, message);
          break;
        case 'typing':
          this.handleTypingMessage(userId, message);
          break;
        case 'read':
          this.handleReadMessage(userId, message);
          break;
        case 'heartbeat':
          this.handleHeartbeat(userId);
          break;
        default:
          logger.warn(`未知消息类型: ${message.type}`);
      }
    } catch (error) {
      logger.error(`处理用户 ${userId} 的消息失败:`, error);
      
      // 发送错误消息给用户
      this.send(userId, {
        type: 'error',
        message: '消息格式错误',
        timestamp: Date.now()
      });
    }
  }

  /**
   * 处理聊天消息
   * @param {string} userId - 发送消息的用户ID
   * @param {Object} message - 消息内容
   */
  async handleChatMessage(userId, message) {
    // 验证必要字段
    if (!message.sessionId || !message.content) {
      this.send(userId, {
        type: 'error',
        message: '聊天消息缺少必要字段',
        timestamp: Date.now()
      });
      return;
    }
    
    // 构建标准消息格式
    const chatMessage = {
      id: `msg_${Date.now()}_${userId}`,
      type: 'chat',
      sessionId: message.sessionId,
      senderId: userId,
      content: message.content,
      contentType: message.contentType || 'text',
      timestamp: Date.now(),
      status: 'sent'
    };
    
    try {
      // 保存消息到缓存或数据库
      if (cacheManager && typeof cacheManager.publish === 'function') {
        await cacheManager.publish('im.message.created', chatMessage);
      }
      
      // 广播消息到会话中的所有用户
      this.broadcastToSession(message.sessionId, chatMessage);
      
      // 确认消息发送成功
      this.send(userId, {
        type: 'confirm',
        messageId: chatMessage.id,
        timestamp: Date.now()
      });
    } catch (error) {
      logger.error(`保存聊天消息失败:`, error);
      
      this.send(userId, {
        type: 'error',
        message: '消息发送失败',
        messageId: chatMessage.id,
        timestamp: Date.now()
      });
    }
  }

  /**
   * 处理正在输入消息
   * @param {string} userId - 发送消息的用户ID
   * @param {Object} message - 消息内容
   */
  handleTypingMessage(userId, message) {
    if (!message.sessionId) return;
    
    const typingMessage = {
      type: 'typing',
      sessionId: message.sessionId,
      userId: userId,
      timestamp: Date.now()
    };
    
    // 广播给会话中的其他用户
    this.broadcastToSession(message.sessionId, typingMessage, userId);
  }

  /**
   * 处理已读消息
   * @param {string} userId - 用户ID
   * @param {Object} message - 消息内容
   */
  async handleReadMessage(userId, message) {
    if (!message.sessionId || !message.messageId) return;
    
    const readMessage = {
      type: 'read',
      sessionId: message.sessionId,
      userId: userId,
      messageId: message.messageId,
      timestamp: Date.now()
    };
    
    // 通知发送者消息已读
    if (message.senderId && message.senderId !== userId) {
      this.send(message.senderId, readMessage);
    }
    
    // 保存已读状态
    if (cacheManager && typeof cacheManager.publish === 'function') {
      await cacheManager.publish('im.message.read', readMessage);
    }
  }

  /**
   * 处理心跳消息
   * @param {string} userId - 用户ID
   */
  handleHeartbeat(userId) {
    this.send(userId, {
      type: 'heartbeat',
      timestamp: Date.now()
    });
  }

  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    // 监听系统通知
    if (cacheManager && typeof cacheManager.subscribe === 'function') {
      cacheManager.subscribe('notification.send', (notification) => {
        if (notification.userId) {
          this.send(notification.userId, {
            type: 'notification',
            data: notification,
            timestamp: Date.now()
          });
        }
      });
      
      // 监听系统广播
      cacheManager.subscribe('notification.broadcast', (broadcast) => {
        this.broadcastToAll({
          type: 'broadcast',
          data: broadcast,
          timestamp: Date.now()
        });
      });
    }
  }

  /**
   * 获取在线用户数
   */
  getOnlineUserCount() {
    return this.clients.size;
  }

  /**
   * 获取会话在线用户数
   * @param {string} sessionId - 会话ID
   */
  getSessionOnlineUserCount(sessionId) {
    const users = this.sessionUsers.get(sessionId);
    return users ? users.size : 0;
  }

  /**
   * 获取用户连接状态
   * @param {string} userId - 用户ID
   */
  isUserOnline(userId) {
    return this.clients.has(userId);
  }
}

// 导出单例
module.exports = new WebSocketService();