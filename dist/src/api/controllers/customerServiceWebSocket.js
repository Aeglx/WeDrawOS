/**
 * 客服系统WebSocket控制器
 * 处理实时消息通信、状态同步等功能
 */

const { logger } = require('../core/utils/logger');
const customerService = require('../core/services/customerService');
const pushService = require('../core/services/pushService');

class CustomerServiceWebSocket {
  constructor() {
    // 存储所有连接的客户端
    this.clients = new Map();
    // 客服在线状态管理
    this.customerServiceStatus = new Map();
    // 会话订阅关系
    this.sessionSubscribers = new Map();
  }

  /**
   * 初始化WebSocket连接
   * @param {WebSocket} ws - WebSocket连接实例
   * @param {Object} user - 用户信息
   */
  async initialize(ws, user) {
    try {
      logger.info(`[CS-WS] New connection established for user ${user.id}, type: ${user.type}`);
      
      // 存储连接信息
      this.clients.set(user.id, {
        ws,
        user,
        connectedAt: new Date(),
        lastActivity: new Date()
      });

      // 处理客服在线状态
      if (user.type === 'customer_service') {
        // 设置客服初始在线状态
        await customerService.updateCustomerServiceStatus(user.id, 'online', {
          connectedAt: new Date(),
          ip: user.ip || 'unknown'
        });
        
        // 通知其他客服有新客服上线
        this.broadcastToCustomerServices({
          type: 'customer_service_status_change',
          data: {
            userId: user.id,
            status: 'online',
            userInfo: { id: user.id, name: user.name || '客服' }
          }
        });

        // 发送在线客服列表
        ws.send(JSON.stringify({
          type: 'online_customer_services',
          data: customerService.getOnlineCustomerServices()
        }));
      }

      // 为用户订阅自己相关的会话
      await this.subscribeToUserSessions(user);

      // 设置心跳检测
      this.setupHeartbeat(ws, user.id);

      // 设置消息处理器
      ws.on('message', (message) => this.handleMessage(ws, user, message));
      ws.on('close', () => this.handleDisconnect(user));
      ws.on('error', (error) => this.handleError(user, error));
      
      // 通知其他客服有新客服上线
      if (user.type === 'customer_service') {
        this.broadcastToCustomerServices({
          type: 'customer_service_status_change',
          data: {
            userId: user.id,
            status: 'online',
            userInfo: { id: user.id, name: user.name || '客服' },
            timestamp: new Date().toISOString()
          }
        });
      }

      // 发送连接成功响应
      ws.send(JSON.stringify({
        type: 'connection_established',
        data: {
          userId: user.id,
          userType: user.type,
          timestamp: new Date()
        }
      }));

    } catch (error) {
      logger.error(`[CS-WS] Failed to initialize connection for user ${user.id}:`, error);
      try {
        ws.send(JSON.stringify({
          type: 'error',
          data: { message: '初始化连接失败' }
        }));
      } catch (e) {
        logger.error(`[CS-WS] Failed to send error message:`, e);
      }
      ws.close(1008, '初始化失败');
    }
  }

  /**
   * 处理接收到的消息
   * @param {WebSocket} ws - WebSocket连接实例
   * @param {Object} user - 用户信息
   * @param {Buffer} message - 接收到的消息
   */
  async handleMessage(ws, user, message) {
    try {
      // 更新最后活动时间
      const clientInfo = this.clients.get(user.id);
      if (clientInfo) {
        clientInfo.lastActivity = new Date();
      }

      // 解析消息
      let parsedMessage;
      try {
        parsedMessage = JSON.parse(message.toString());
      } catch (error) {
        ws.send(JSON.stringify({
          type: 'error',
          data: { message: '消息格式无效' }
        }));
        return;
      }

      const { type, data } = parsedMessage;
      logger.debug(`[CS-WS] Received message from ${user.id}: ${type}`);

      // 根据消息类型处理
      switch (type) {
        case 'heartbeat':
          this.handleHeartbeat(ws);
          break;
        case 'message':
          await this.handleChatMessage(user, data);
          break;
        case 'create_session':
          await this.handleCreateSession(user, data);
          break;
        case 'join_session':
          await this.handleJoinSession(user, data.sessionId);
          break;
        case 'leave_session':
          this.handleLeaveSession(user.id, data.sessionId);
          break;
        case 'read_receipt':
          await this.handleReadReceipt(user, data);
          break;
        case 'typing':
          this.handleTyping(user, data);
          break;
        case 'stop_typing':
          this.handleStopTyping(user, data);
          break;
        case 'status_change':
          await this.handleStatusChange(user, data);
          break;
        default:
          logger.warn(`[CS-WS] Unknown message type: ${type}`);
          ws.send(JSON.stringify({
            type: 'error',
            data: { message: '未知的消息类型' }
          }));
      }
    } catch (error) {
      logger.error(`[CS-WS] Error handling message from user ${user.id}:`, error);
      try {
        ws.send(JSON.stringify({
          type: 'error',
          data: { message: '处理消息时发生错误' }
        }));
      } catch (e) {
        logger.error(`[CS-WS] Failed to send error message:`, e);
      }
    }
  }

  /**
   * 处理聊天消息
   * @param {Object} user - 发送者信息
   * @param {Object} data - 消息数据
   */
  async handleChatMessage(user, data) {
    const { conversationId, content, type = 'text' } = data;

    // 验证必要参数
    if (!conversationId || !content) {
      this.sendToUser(user.id, {
        type: 'error',
        data: { message: '缺少必要参数' }
      });
      return;
    }

    try {
      // 发送消息
      const message = await customerService.sendMessage({
        conversationId,
        senderId: user.id,
        content,
        type
      });

      // 向会话所有订阅者广播消息
      this.broadcastToSession(conversationId, {
        type: 'new_message',
        data: message
      });

      // 如果消息是从客户发送的，检查是否需要自动回复
      if (user.type === 'customer') {
        const autoReply = await customerService.checkAutoReply(message);
        if (autoReply) {
          // 延迟发送自动回复，模拟人工响应
          setTimeout(async () => {
            const replyMessage = await customerService.sendMessage({
              conversationId,
              senderId: 'system',
              content: autoReply.reply,
              type: 'text',
              isAutoReply: true
            });

            this.broadcastToSession(conversationId, {
              type: 'new_message',
              data: replyMessage
            });
          }, 1000 + Math.random() * 2000);
        } else {
          // 如果没有自动回复，检查是否有在线客服并推送通知
          this.notifyCustomerServicesAboutNewMessage(conversationId, message);
        }
      }

    } catch (error) {
      logger.error(`[CS-WS] Error sending message from ${user.id}:`, error);
      this.sendToUser(user.id, {
        type: 'error',
        data: { message: '发送消息失败' }
      });
    }
  }

  /**
   * 处理创建会话请求
   * @param {Object} user - 用户信息
   * @param {Object} data - 会话数据
   */
  async handleCreateSession(user, data) {
    try {
      const { initialMessage, metadata } = data;

      // 创建会话
      const session = await customerService.createSession({
        customerId: user.id,
        initialMessage,
        metadata
      });

      // 向用户发送会话创建成功消息
      this.sendToUser(user.id, {
        type: 'session_created',
        data: session
      });

      // 为用户订阅该会话
      this.subscribeToSession(user.id, session.id);

      // 通知所有在线客服有新会话
      this.broadcastToCustomerServices({
        type: 'new_session',
        data: {
          session: {
            id: session.id,
            createdAt: session.createdAt,
            status: session.status,
            unreadCount: session.unreadCount || 1
          },
          customerInfo: { id: user.id, name: user.name || '用户' }
        }
      });

      // 如果有初始消息，自动处理
      if (initialMessage) {
        const message = await customerService.sendMessage({
          conversationId: session.id,
          senderId: user.id,
          content: initialMessage,
          type: 'text'
        });

        // 广播初始消息
        this.broadcastToSession(session.id, {
          type: 'new_message',
          data: message
        });

        // 检查自动回复
        const autoReply = await customerService.checkAutoReply(message);
        if (autoReply) {
          setTimeout(async () => {
            const replyMessage = await customerService.sendMessage({
              conversationId: session.id,
              senderId: 'system',
              content: autoReply.reply,
              type: 'text',
              isAutoReply: true
            });

            this.broadcastToSession(session.id, {
              type: 'new_message',
              data: replyMessage
            });
          }, 1000 + Math.random() * 2000);
        }
      }

    } catch (error) {
      logger.error(`[CS-WS] Error creating session for user ${user.id}:`, error);
      this.sendToUser(user.id, {
        type: 'error',
        data: { message: '创建会话失败' }
      });
    }
  }

  /**
   * 处理加入会话请求
   * @param {Object} user - 用户信息
   * @param {string} sessionId - 会话ID
   */
  async handleJoinSession(user, sessionId) {
    try {
      // 验证用户是否有权限加入会话
      const canJoin = await customerService.checkSessionAccess(user.id, sessionId);
      
      if (!canJoin) {
        this.sendToUser(user.id, {
          type: 'error',
          data: { message: '无权访问该会话' }
        });
        return;
      }

      // 订阅会话
      this.subscribeToSession(user.id, sessionId);

      // 发送会话历史消息
      const recentMessages = await customerService.getSessionMessages(sessionId, { page: 1, pageSize: 50 });
      
      this.sendToUser(user.id, {
        type: 'session_joined',
        data: {
          sessionId,
          recentMessages
        }
      });

      // 通知其他会话参与者有新用户加入
      this.broadcastToSessionExcluding(sessionId, user.id, {
        type: 'user_joined',
        data: {
          userId: user.id,
          userType: user.type
        }
      });

      // 标记消息为已读
      await customerService.markMessagesAsRead(sessionId, user.id);

    } catch (error) {
      logger.error(`[CS-WS] Error joining session ${sessionId} for user ${user.id}:`, error);
      this.sendToUser(user.id, {
        type: 'error',
        data: { message: '加入会话失败' }
      });
    }
  }

  /**
   * 处理离开会话
   * @param {string} userId - 用户ID
   * @param {string} sessionId - 会话ID
   */
  handleLeaveSession(userId, sessionId) {
    try {
      // 取消订阅会话
      this.unsubscribeFromSession(userId, sessionId);

      // 通知其他参与者
      this.broadcastToSessionExcluding(sessionId, userId, {
        type: 'user_left',
        data: {
          userId
        }
      });

    } catch (error) {
      logger.error(`[CS-WS] Error leaving session ${sessionId} for user ${userId}:`, error);
    }
  }

  /**
   * 处理已读回执
   * @param {Object} user - 用户信息
   * @param {Object} data - 回执数据
   */
  async handleReadReceipt(user, data) {
    try {
      const { conversationId, messageId } = data;

      await customerService.handleReadReceipt({
        conversationId,
        userId: user.id,
        messageId
      });

      // 广播已读状态
      this.broadcastToSessionExcluding(conversationId, user.id, {
        type: 'read_receipt',
        data: {
          userId: user.id,
          messageId
        }
      });

    } catch (error) {
      logger.error(`[CS-WS] Error handling read receipt for user ${user.id}:`, error);
    }
  }

  /**
   * 处理输入状态
   * @param {Object} user - 用户信息
   * @param {Object} data - 输入状态数据
   */
  handleTyping(user, data) {
    const { conversationId } = data;
    
    this.broadcastToSessionExcluding(conversationId, user.id, {
      type: 'typing',
      data: {
        userId: user.id,
        userType: user.type
      }
    });
  }

  /**
   * 处理停止输入状态
   * @param {Object} user - 用户信息
   * @param {Object} data - 停止输入状态数据
   */
  handleStopTyping(user, data) {
    const { conversationId } = data;
    
    this.broadcastToSessionExcluding(conversationId, user.id, {
      type: 'stop_typing',
      data: {
        userId: user.id,
        userType: user.type
      }
    });
  }

  /**
   * 处理状态变更
   * @param {Object} user - 用户信息
   * @param {Object} data - 状态数据
   */
  async handleStatusChange(user, data) {
    if (user.type !== 'customer_service') {
      return;
    }

    try {
      const { status, metadata } = data;

      await customerService.updateCustomerServiceStatus(user.id, status, metadata);

      // 广播状态变更
      this.broadcastToCustomerServices({
        type: 'customer_service_status_change',
        data: {
          userId: user.id,
          status,
          userInfo: { id: user.id, name: user.name || '客服' }
        }
      });

    } catch (error) {
      logger.error(`[CS-WS] Error handling status change for user ${user.id}:`, error);
    }
  }

  /**
   * 处理心跳包
   * @param {WebSocket} ws - WebSocket连接实例
   */
  handleHeartbeat(ws) {
    try {
      ws.send(JSON.stringify({
        type: 'heartbeat',
        data: { timestamp: new Date() }
      }));
    } catch (error) {
      logger.error('[CS-WS] Error sending heartbeat response:', error);
    }
  }

  /**
   * 处理输入状态
   * @param {Object} user - 用户信息
   * @param {Object} data - 输入状态数据
   */
  handleTyping(user, data) {
    const { conversationId } = data;
    
    this.broadcastToSessionExcluding(conversationId, user.id, {
      type: 'typing',
      data: {
        userId: user.id,
        userType: user.type,
        timestamp: new Date().getTime()
      }
    });
  }

  /**
   * 处理停止输入状态
   * @param {Object} user - 用户信息
   * @param {Object} data - 停止输入状态数据
   */
  handleStopTyping(user, data) {
    const { conversationId } = data;
    
    this.broadcastToSessionExcluding(conversationId, user.id, {
      type: 'stop_typing',
      data: {
        userId: user.id,
        userType: user.type,
        timestamp: new Date().getTime()
      }
    });
  }

  /**
   * 设置心跳检测
   * @param {WebSocket} ws - WebSocket连接实例
   * @param {string} userId - 用户ID
   */
  setupHeartbeat(ws, userId) {
    const heartbeatInterval = setInterval(() => {
      const client = this.clients.get(userId);
      if (!client) {
        clearInterval(heartbeatInterval);
        return;
      }

      // 检查最后活动时间，如果超过30秒没有活动，断开连接
      const lastActivity = client.lastActivity;
      const now = new Date();
      const inactiveTime = now - lastActivity;

      if (inactiveTime > 30000) { // 30秒
        logger.warn(`[CS-WS] User ${userId} inactive for ${inactiveTime}ms, closing connection`);
        clearInterval(heartbeatInterval);
        try {
          ws.close(1000, 'Heartbeat timeout');
        } catch (e) {
          // 连接可能已经关闭
        }
        this.handleDisconnect({ id: userId });
      }
    }, 15000); // 每15秒检查一次

    ws.on('close', () => clearInterval(heartbeatInterval));
  }

  /**
   * 处理连接断开
   * @param {Object} user - 用户信息
   */
  async handleDisconnect(user) {
    try {
      const userId = user.id;
      logger.info(`[CS-WS] Connection disconnected for user ${userId}`);

      // 移除客户端连接
      this.clients.delete(userId);

      // 取消所有会话订阅
      this.unsubscribeFromAllSessions(userId);

      // 如果是客服，更新状态
      if (user.type === 'customer_service') {
        await customerService.updateCustomerServiceStatus(userId, 'offline', {
          disconnectedAt: new Date()
        });

        // 广播客服离线状态
        this.broadcastToCustomerServices({
          type: 'customer_service_status_change',
          data: {
            userId,
            status: 'offline',
            userInfo: { id: userId, name: user.name || '客服' }
          }
        });
      }

    } catch (error) {
      logger.error(`[CS-WS] Error handling disconnect for user ${user.id}:`, error);
    }
  }

  /**
   * 处理错误
   * @param {Object} user - 用户信息
   * @param {Error} error - 错误信息
   */
  handleError(user, error) {
    logger.error(`[CS-WS] WebSocket error for user ${user.id}:`, error);
  }

  /**
   * 向特定用户发送消息
   * @param {string} userId - 用户ID
   * @param {Object} message - 消息对象
   */
  sendToUser(userId, message) {
    const client = this.clients.get(userId);
    if (client && client.ws && client.ws.readyState === 1) {
      try {
        client.ws.send(JSON.stringify(message));
      } catch (error) {
        logger.error(`[CS-WS] Failed to send message to user ${userId}:`, error);
      }
    }
  }

  /**
   * 向会话所有订阅者广播消息
   * @param {string} sessionId - 会话ID
   * @param {Object} message - 消息对象
   */
  broadcastToSession(sessionId, message) {
    const subscribers = this.sessionSubscribers.get(sessionId);
    if (subscribers) {
      subscribers.forEach(userId => {
        this.sendToUser(userId, message);
      });
    }
  }

  /**
   * 向会话订阅者广播消息，但排除特定用户
   * @param {string} sessionId - 会话ID
   * @param {string} excludeUserId - 排除的用户ID
   * @param {Object} message - 消息对象
   */
  broadcastToSessionExcluding(sessionId, excludeUserId, message) {
    const subscribers = this.sessionSubscribers.get(sessionId);
    if (subscribers) {
      subscribers.forEach(userId => {
        if (userId !== excludeUserId) {
          this.sendToUser(userId, message);
        }
      });
    }
  }

  /**
   * 向所有客服广播消息
   * @param {Object} message - 消息对象
   */
  broadcastToCustomerServices(message) {
    this.clients.forEach((client, userId) => {
      if (client.user.type === 'customer_service') {
        this.sendToUser(userId, message);
      }
    });
  }

  /**
   * 订阅会话
   * @param {string} userId - 用户ID
   * @param {string} sessionId - 会话ID
   */
  subscribeToSession(userId, sessionId) {
    if (!this.sessionSubscribers.has(sessionId)) {
      this.sessionSubscribers.set(sessionId, new Set());
    }
    this.sessionSubscribers.get(sessionId).add(userId);
    logger.debug(`[CS-WS] User ${userId} subscribed to session ${sessionId}`);
  }

  /**
   * 取消订阅会话
   * @param {string} userId - 用户ID
   * @param {string} sessionId - 会话ID
   */
  unsubscribeFromSession(userId, sessionId) {
    const subscribers = this.sessionSubscribers.get(sessionId);
    if (subscribers) {
      subscribers.delete(userId);
      // 如果没有订阅者了，删除会话订阅关系
      if (subscribers.size === 0) {
        this.sessionSubscribers.delete(sessionId);
      }
      logger.debug(`[CS-WS] User ${userId} unsubscribed from session ${sessionId}`);
    }
  }

  /**
   * 取消所有会话订阅
   * @param {string} userId - 用户ID
   */
  unsubscribeFromAllSessions(userId) {
    this.sessionSubscribers.forEach((subscribers, sessionId) => {
      if (subscribers.has(userId)) {
        this.unsubscribeFromSession(userId, sessionId);
      }
    });
  }

  /**
   * 为用户订阅相关会话
   * @param {Object} user - 用户信息
   */
  async subscribeToUserSessions(user) {
    try {
      // 获取用户相关的活跃会话
      const sessions = await customerService.getUserSessions(user.id);
      
      sessions.forEach(session => {
        this.subscribeToSession(user.id, session.id);
      });
      
      logger.info(`[CS-WS] User ${user.id} subscribed to ${sessions.length} sessions`);
    } catch (error) {
      logger.error(`[CS-WS] Failed to subscribe user ${user.id} to sessions:`, error);
    }
  }

  /**
   * 通知客服有新消息
   * @param {string} conversationId - 会话ID
   * @param {Object} message - 消息对象
   */
  notifyCustomerServicesAboutNewMessage(conversationId, message) {
    // 获取在线客服
    const onlineCS = customerService.getOnlineCustomerServices();
    
    // 查找当前会话分配的客服
    const assignedCS = onlineCS.find(cs => 
      cs.assignedSessions && cs.assignedSessions.includes(conversationId)
    );

    if (assignedCS) {
      // 如果有分配的客服，只通知该客服
      this.sendToUser(assignedCS.id, {
        type: 'new_message_notification',
        data: {
          conversationId,
          message,
          from: 'customer'
        }
      });
    } else {
      // 否则通知所有在线客服
      onlineCS.forEach(cs => {
        this.sendToUser(cs.id, {
          type: 'new_message_notification',
          data: {
            conversationId,
            message,
            from: 'customer',
            unassigned: true
          }
        });
      });
    }

    // 同时通过其他渠道（如邮件、短信）推送通知
    pushService.pushCustomerServiceNotification({
      type: 'new_message',
      conversationId,
      message,
      timestamp: new Date()
    });
  }
}

module.exports = new CustomerServiceWebSocket();