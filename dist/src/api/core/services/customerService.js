/**
 * 客服服务
 * 提供客服系统核心功能
 */

const { logger } = require('../utils/logger');
const { AppError } = require('../utils/errors');
const WebSocketService = require('./websocketService');
const pushService = require('./pushService');
const customerServiceDb = require('./customerServiceDb');
const customerServiceStats = require('./customerServiceStats');
const autoReplyService = require('./autoReplyService');

class CustomerService {
  constructor() {
    this.sessions = new Map(); // 内存缓存活跃会话
    this.waitingQueue = []; // 等待队列
    this.customerServices = new Map(); // 在线客服
    this.websocketService = WebSocketService.getInstance();
    this.pushService = pushService;
    this.db = customerServiceDb;
    this.stats = customerServiceStats;
    this.autoReply = autoReplyService;
    this.setupWebSocketListeners();
  }

  /**
   * 设置WebSocket监听器
   */
  setupWebSocketListeners() {
    this.websocketService.on('user-connected', this.handleUserConnected.bind(this));
    this.websocketService.on('user-disconnected', this.handleUserDisconnected.bind(this));
    this.websocketService.on('message', this.handleWebSocketMessage.bind(this));
    this.websocketService.on('typing', this.handleTypingStatus.bind(this));
    this.websocketService.on('stop-typing', this.handleStopTypingStatus.bind(this));
    this.websocketService.on('join-session', this.handleJoinSession.bind(this));
    this.websocketService.on('leave-session', this.handleLeaveSession.bind(this));
    this.websocketService.on('read-receipt', this.handleReadReceipt.bind(this));
  }

  /**
   * 处理WebSocket消息
   * @param {Object} data 消息数据
   * @param {Object} socket 客户端Socket
   */
  async handleWebSocketMessage(data, socket) {
    try {
      const { type, conversationId, content, senderId, receiverId } = data;
      
      // 判断消息类型
      if (type === 'customer_service') {
        await this.handleCustomerServiceMessage(data, socket);
      } else if (type === 'customer') {
        await this.handleCustomerMessage(data, socket);
      } else {
        logger.warn(`Unknown message type: ${type}`);
      }
    } catch (error) {
      logger.error('Error handling WebSocket message:', error);
      socket.send(JSON.stringify({
        type: 'error',
        message: '处理消息时发生错误'
      }));
    }
  }

  /**
   * 处理客服消息
   * @param {Object} data 消息数据
   * @param {Object} socket 客户端Socket
   */
  async handleCustomerServiceMessage(data, socket) {
    const { conversationId, content, senderId } = data;
    
    // 验证会话是否存在
    const conversation = await this.db.getConversationById(conversationId);
    if (!conversation) {
      throw new Error(`会话 ${conversationId} 不存在`);
    }
    
    // 验证客服权限
    const role = await this.db.getUserRoleInConversation(conversationId, senderId);
    if (role !== 'customer_service' && role !== 'admin') {
      throw new Error('您没有权限在此会话中发送消息');
    }
    
    // 创建消息
    const message = await this.sendMessage({
      conversationId,
      senderId,
      content,
      type: 'text'
    });
    
    // 通知会话参与者
    this.sendMessageToParticipants(conversationId, message, [senderId]);
  }

  /**
   * 处理客户消息
   * @param {Object} data 消息数据
   * @param {Object} socket 客户端Socket
   */
  async handleCustomerMessage(data, socket) {
    const { conversationId, content, senderId } = data;
    let conversation;
    
    try {
      if (conversationId) {
        // 检查会话是否存在
        conversation = await this.db.getConversationById(conversationId);
        if (!conversation) {
          // 会话不存在，创建新会话
          conversation = await this.createSession({
            customerId: senderId,
            initialMessage: content
          });
        }
      } else {
        // 创建新会话
        conversation = await this.createSession({
          customerId: senderId,
          initialMessage: content
        });
      }
    } catch (error) {
      logger.error('Failed to get or create conversation:', error);
      throw error;
    }
    
    // 创建消息
    const message = await this.sendMessage({
      conversationId: conversation.id,
      senderId,
      content,
      type: 'text'
    });
    
    // 检查是否需要自动回复
    const isAssigned = await this.isConversationAssigned(conversation.id);
    if (!isAssigned) {
      const autoReply = await this.autoReply.processMessage({
        content,
        senderId,
        conversationId: conversation.id
      });
      
      if (autoReply) {
        await this.sendMessage({
          conversationId: conversation.id,
          senderId: 'system',
          content: autoReply.content,
          type: 'text',
          isAutoReply: true,
          isSystem: true
        });
      }
    }
    
    // 通知会话参与者
    this.sendMessageToParticipants(conversation.id, message, [senderId]);
    
    // 如果会话未分配，加入等待队列
    if (!isAssigned) {
      await this.processWaitingQueue();
    }
  }

  /**
   * 检查会话是否已分配给客服
   * @param {string} conversationId 会话ID
   * @returns {Promise<boolean>}
   */
  async isConversationAssigned(conversationId) {
    try {
      const participants = await this.db.ConversationParticipant.findAll({
        where: {
          conversationId,
          role: ['customer_service', 'admin'],
          isActive: true
        }
      });
      return participants.length > 0;
    } catch (error) {
      logger.error(`Failed to check if conversation ${conversationId} is assigned:`, error);
      return false;
    }
  }

  /**
   * 处理用户连接
   * @param {Object} data 用户数据
   * @param {Object} socket 客户端Socket
   */
  async handleUserConnected(data, socket) {
    const { userId, userType } = data;
    
    if (userType === 'customer_service') {
      // 客服上线
      this.customerServices.set(userId, {
        id: userId,
        socket,
        status: 'online',
        currentSessions: [],
        lastActive: new Date()
      });
      
      // 加载客服当前会话
      const sessions = await this.db.getUserConversations(userId, {
        role: 'customer_service',
        status: 'active'
      });
      
      if (sessions.data) {
        sessions.data.forEach(session => {
          this.customerServices.get(userId).currentSessions.push(session.id);
        });
      }
      
      logger.info(`Customer service ${userId} is online`);
      
      // 尝试处理等待队列
      await this.processWaitingQueue();
    } else {
      // 普通用户连接
      logger.info(`User ${userId} connected`);
    }
    
    // 存储用户Socket映射
    this.websocketService.setUserSocket(userId, socket);
  }

  /**
   * 处理用户断开连接
   * @param {Object} data 用户数据
   */
  async handleUserDisconnected(data) {
    const { userId, userType } = data;
    
    if (userType === 'customer_service') {
      // 客服下线，处理其会话
      const cs = this.customerServices.get(userId);
      if (cs) {
        // 将会话重新加入等待队列
        for (const conversationId of cs.currentSessions) {
          try {
            const conversation = await this.db.getConversationById(conversationId);
            if (conversation && conversation.status === 'active') {
              // 更新会话元数据，标记为等待
              await this.db.updateConversationStatus(conversationId, 'active', {
                isWaiting: true,
                lastCustomerServiceId: userId
              });
              
              // 从会话中移除客服
              await this.db.removeUserFromConversation(conversationId, userId);
              
              this.waitingQueue.push(conversationId);
              
              // 通知用户客服已离开
              this.sendSessionNotification(conversationId, {
                type: 'customer_service_left',
                message: '客服暂时离开，请稍候'
              });
            }
          } catch (error) {
            logger.error(`Failed to process session ${conversationId} when CS ${userId} disconnected:`, error);
          }
        }
        
        this.customerServices.delete(userId);
        logger.info(`Customer service ${userId} is offline`);
        
        // 尝试处理等待队列
        await this.processWaitingQueue();
      }
    }
    
    // 清理用户Socket映射
    this.websocketService.removeUserSocket(userId);
  }

  /**
   * 处理输入状态
   * @param {Object} data 状态数据
   */
  handleTypingStatus(data) {
    const { conversationId, userId } = data;
    
    this.sendMessageToParticipants(conversationId, {
      type: 'typing',
      userId,
      timestamp: new Date()
    }, [userId]);
  }

  /**
   * 处理停止输入状态
   * @param {Object} data 状态数据
   */
  handleStopTypingStatus(data) {
    const { conversationId, userId } = data;
    
    this.sendMessageToParticipants(conversationId, {
      type: 'stop-typing',
      userId,
      timestamp: new Date()
    }, [userId]);
  }

  /**
   * 处理加入会话
   * @param {Object} data 会话数据
   * @param {Object} socket 客户端Socket
   */
  async handleJoinSession(data, socket) {
    const { conversationId, userId } = data;
    
    try {
      // 验证用户是否有权限加入会话
      const isInConversation = await this.db.isUserInConversation(conversationId, userId);
      if (!isInConversation) {
        throw new Error('您没有权限访问此会话');
      }
      
      // 发送会话历史消息
      const messages = await this.getSessionMessages(conversationId);
      socket.send(JSON.stringify({
        type: 'session_history',
        conversationId,
        messages
      }));
      
      logger.info(`User ${userId} joined conversation ${conversationId}`);
    } catch (error) {
      logger.error(`Failed to join conversation ${conversationId}:`, error);
      socket.send(JSON.stringify({
        type: 'error',
        message: error.message
      }));
    }
  }

  /**
   * 处理离开会话
   * @param {Object} data 会话数据
   */
  handleLeaveSession(data) {
    const { conversationId, userId } = data;
    logger.info(`User ${userId} left conversation ${conversationId}`);
  }

  /**
   * 处理已读回执
   * @param {Object} data 回执数据
   */
  async handleReadReceipt(data) {
    const { conversationId, userId, messageId } = data;
    
    try {
      // 更新消息状态为已读
      await this.db.markMessagesAsRead(conversationId, userId, messageId);
      
      // 通知发送者
      this.sendMessageToParticipants(conversationId, {
        type: 'read-receipt',
        messageId,
        userId,
        timestamp: new Date()
      });
    } catch (error) {
      logger.error(`Failed to process read receipt for message ${messageId}:`, error);
    }
  }

  /**
   * 创建会话
   * @param {Object} sessionData 会话数据
   * @returns {Promise<Object>} 创建的会话
   */
  async createSession(sessionData) {
    const { customerId, initialMessage } = sessionData;
    
    try {
      // 创建会话
      const conversation = await this.db.createCustomerServiceConversation(
        {
          name: `客服会话-${customerId}`,
          metadata: {
            isWaiting: true,
            createdAt: new Date()
          }
        },
        [{
          id: customerId,
          role: 'customer'
        }]
      );
      
      // 如果有初始消息，创建消息记录
      if (initialMessage) {
        await this.sendMessage({
          conversationId: conversation.id,
          senderId: customerId,
          content: initialMessage,
          type: 'text'
        });
      }
      
      // 添加到等待队列
      this.waitingQueue.push(conversation.id);
      
      logger.info(`Created new conversation: ${conversation.id} for customer ${customerId}`);
      
      return conversation;
    } catch (error) {
      logger.error('Failed to create conversation:', error);
      throw error;
    }
  }

  /**
   * 获取会话列表
   * @param {Object} filters 过滤条件
   * @param {Object} pagination 分页参数
   * @returns {Promise<Object>} 会话列表
   */
  async getSessions(filters = {}, pagination = {}) {
    try {
      // 转换过滤条件
      const dbFilters = {};
      
      if (filters.customerServiceId) {
        dbFilters.userId = filters.customerServiceId;
      }
      
      if (filters.customerId) {
        dbFilters.userId = filters.customerId;
      }
      
      if (filters.status) {
        dbFilters.status = filters.status;
      }
      
      if (filters.type) {
        dbFilters.type = filters.type;
      }
      
      if (filters.startTime || filters.endTime) {
        dbFilters.startTime = filters.startTime;
        dbFilters.endTime = filters.endTime;
      }
      
      // 调用数据库服务获取会话
      const result = await this.db.getConversations(dbFilters, pagination);
      
      // 更新内存缓存
      result.data.forEach(session => {
        this.sessions.set(session.id, session);
      });
      
      return result;
    } catch (error) {
      logger.error('Failed to get sessions:', error);
      throw error;
    }
  }

  /**
   * 获取会话消息
   * @param {string} conversationId 会话ID
   * @param {Object} pagination 分页参数
   * @returns {Promise<Array>} 消息列表
   */
  async getSessionMessages(conversationId, pagination = {}) {
    try {
      const result = await this.db.getConversationMessages(conversationId, pagination);
      return result.data;
    } catch (error) {
      logger.error(`Failed to get messages for conversation ${conversationId}:`, error);
      return [];
    }
  }

  /**
   * 发送消息
   * @param {Object} messageData 消息数据
   * @returns {Promise<Object>} 创建的消息
   */
  async sendMessage(messageData) {
    const { conversationId, senderId, content, type = 'text', isAutoReply = false, isSystem = false } = messageData;
    
    try {
      // 创建消息
      const message = await this.db.createMessage({
        conversationId,
        senderId,
        receiverId: isSystem ? null : undefined, // 系统消息可以设置为null
        content,
        type,
        status: 'sent',
        metadata: {
          isAutoReply,
          isSystem
        }
      });
      
      // 记录日志
      logger.info(`Message sent: ${message.id} in conversation ${conversationId}`);
      
      // 如果是系统消息或自动回复，不需要推送通知
      if (!isSystem && !isAutoReply) {
        // 获取会话参与者
        const conversation = await this.db.getConversationById(conversationId);
        
        // 推送通知给除了发送者之外的所有参与者
        for (const participant of conversation.participants) {
          if (participant.userId !== senderId) {
            // 使用客服专用推送方法
            await this.pushService.pushCustomerServiceMessage({
              userId: participant.userId,
              conversationId,
              senderId,
              messageContent: type === 'text' ? content : `${type}消息`,
              messageType: type
            });
          }
        }
      }
      
      return message;
    } catch (error) {
      logger.error('Failed to send message:', error);
      throw error;
    }
  }

  /**
   * 将会话分配给客服
   * @param {string} conversationId 会话ID
   * @param {string} customerServiceId 客服ID
   * @returns {Promise<boolean>} 是否分配成功
   */
  async assignSessionToCustomerService(conversationId, customerServiceId) {
    try {
      // 验证会话和客服存在
      const conversation = await this.db.getConversationById(conversationId);
      if (!conversation) {
        return false;
      }
      
      // 添加客服到会话
      await this.db.addUserToConversation(conversationId, customerServiceId, 'customer_service');
      
      // 更新会话状态
      await this.db.updateConversationStatus(conversationId, 'active', {
        isWaiting: false,
        assignedCustomerServiceId: customerServiceId,
        assignedAt: new Date()
      });
      
      // 更新内存中的客服状态
      const cs = this.customerServices.get(customerServiceId);
      if (cs && !cs.currentSessions.includes(conversationId)) {
        cs.currentSessions.push(conversationId);
      }
      
      // 从等待队列移除
      const queueIndex = this.waitingQueue.indexOf(conversationId);
      if (queueIndex > -1) {
        this.waitingQueue.splice(queueIndex, 1);
      }
      
      // 通知客服有新会话
      this.sendSessionNotification(conversationId, {
        type: 'session_assigned',
        message: '您有新的会话',
        conversationId
      });
      
      // 推送通知给客服
      await this.pushService.pushCustomerServiceNotification({
        userId: customerServiceId,
        type: 'new_session',
        content: '您有新的客服会话需要处理',
        conversationId
      });
      
      logger.info(`Conversation ${conversationId} assigned to customer service ${customerServiceId}`);
      
      return true;
    } catch (error) {
      logger.error(`Failed to assign conversation ${conversationId} to CS ${customerServiceId}:`, error);
      return false;
    }
  }

  /**
   * 处理等待队列
   */
  async processWaitingQueue() {
    // 获取可用客服，按当前会话数排序
    const availableCustomerServices = Array.from(this.customerServices.values())
      .filter(cs => cs.status === 'online')
      .sort((a, b) => a.currentSessions.length - b.currentSessions.length);
    
    // 分配会话
    while (this.waitingQueue.length > 0 && availableCustomerServices.length > 0) {
      const conversationId = this.waitingQueue.shift();
      const cs = availableCustomerServices[0];
      
      await this.assignSessionToCustomerService(conversationId, cs.id);
      
      // 通知等待中的用户他们的位置
      for (let i = 0; i < this.waitingQueue.length; i++) {
        this.sendSessionNotification(this.waitingQueue[i], {
          type: 'waiting_position',
          position: i + 1,
          estimatedWaitTime: this.calculateEstimatedWaitTime(i + 1)
        });
      }
    }
  }

  /**
   * 计算预计等待时间
   * @param {number} position 等待位置
   * @returns {number} 预计等待时间（秒）
   */
  calculateEstimatedWaitTime(position) {
    // 简单估算，假设每个会话平均处理3分钟
    const avgProcessingTime = 3 * 60; // 3分钟 = 180秒
    return position * avgProcessingTime;
  }

  /**
   * 更新客服状态
   * @param {string} customerServiceId 客服ID
   * @param {string} status 状态
   * @param {Object} metadata 额外信息
   */
  async updateCustomerServiceStatus(customerServiceId, status, metadata = {}) {
    const cs = this.customerServices.get(customerServiceId);
    
    if (cs) {
      cs.status = status;
      cs.metadata = { ...cs.metadata, ...metadata };
      
      // 如果客服离线，处理其会话
      if (status === 'offline' || status === 'away') {
        // 将会话重新加入等待队列（如果状态为离线）
        if (status === 'offline') {
          for (const conversationId of cs.currentSessions) {
            try {
              const conversation = await this.db.getConversationById(conversationId);
              if (conversation && conversation.status === 'active') {
                // 更新会话状态
                await this.db.updateConversationStatus(conversationId, 'active', {
                  isWaiting: true,
                  lastCustomerServiceId: customerServiceId
                });
                
                // 从会话中移除客服
                await this.db.removeUserFromConversation(conversationId, customerServiceId);
                
                this.waitingQueue.push(conversationId);
                
                // 通知用户客服已离开
                this.sendSessionNotification(conversationId, {
                  type: 'customer_service_left',
                  message: '客服暂时离开，请稍候'
                });
              }
            } catch (error) {
              logger.error(`Failed to update conversation ${conversationId} when CS ${customerServiceId} went offline:`, error);
            }
          }
          
          cs.currentSessions = [];
          
          // 尝试处理等待队列
          await this.processWaitingQueue();
        }
      }
      
      logger.info(`Updated customer service ${customerServiceId} status to ${status}`);
    }
  }

  /**
   * 获取统计数据
   * @param {Object} timeRange 时间范围
   * @returns {Promise<Object>} 统计数据
   */
  async getStatistics(timeRange = {}) {
    try {
      const overview = await this.stats.getSystemOverview(timeRange);
      const realtimeStatus = await this.stats.getRealtimeStatus();
      
      return {
        ...overview,
        ...realtimeStatus
      };
    } catch (error) {
      logger.error('Failed to get statistics:', error);
      throw error;
    }
  }

  /**
   * 将会话消息发送给参与者
   * @param {string} conversationId 会话ID
   * @param {Object} message 消息对象
   * @param {Array} excludeUsers 排除的用户ID列表
   */
  async sendMessageToParticipants(conversationId, message, excludeUsers = []) {
    try {
      const conversation = await this.db.getConversationById(conversationId);
      if (!conversation) return;
      
      for (const participant of conversation.participants) {
        if (!excludeUsers.includes(participant.userId)) {
          const socket = this.websocketService.getUserSocket(participant.userId);
          if (socket) {
            socket.send(JSON.stringify({
              type: 'message',
              data: message
            }));
          }
        }
      }
    } catch (error) {
      logger.error(`Failed to send message to participants of conversation ${conversationId}:`, error);
    }
  }

  /**
   * 发送会话通知
   * @param {string} conversationId 会话ID
   * @param {Object} notification 通知内容
   */
  async sendSessionNotification(conversationId, notification) {
    try {
      const conversation = await this.db.getConversationById(conversationId);
      if (!conversation) return;
      
      for (const participant of conversation.participants) {
        const socket = this.websocketService.getUserSocket(participant.userId);
        if (socket) {
          socket.send(JSON.stringify({
            type: 'session_notification',
            conversationId,
            data: notification
          }));
        }
      }
    } catch (error) {
      logger.error(`Failed to send notification to conversation ${conversationId}:`, error);
    }
  }

  /**
   * 转移会话给其他客服
   * @param {string} conversationId 会话ID
   * @param {string} newCustomerServiceId 新客服ID
   * @returns {Promise<boolean>} 是否转移成功
   */
  async transferSession(conversationId, newCustomerServiceId) {
    try {
      // 获取会话信息
      const conversation = await this.db.getConversationById(conversationId);
      if (!conversation) {
        return false;
      }
      
      // 找出当前的客服
      let oldCustomerServiceId = null;
      for (const participant of conversation.participants) {
        if (participant.role === 'customer_service' || participant.role === 'admin') {
          oldCustomerServiceId = participant.userId;
          break;
        }
      }
      
      // 从旧客服移除会话
      if (oldCustomerServiceId) {
        await this.db.removeUserFromConversation(conversationId, oldCustomerServiceId);
        
        // 更新内存中的客服状态
        const oldCs = this.customerServices.get(oldCustomerServiceId);
        if (oldCs) {
          oldCs.currentSessions = oldCs.currentSessions.filter(id => id !== conversationId);
        }
      }
      
      // 分配给新客服
      const success = await this.assignSessionToCustomerService(conversationId, newCustomerServiceId);
      
      if (success) {
        // 更新会话元数据
        await this.db.updateConversationStatus(conversationId, 'active', {
          transferred: true,
          transferredFrom: oldCustomerServiceId,
          transferredTo: newCustomerServiceId,
          transferredAt: new Date()
        });
        
        // 通知相关人员
        this.sendSessionNotification(conversationId, {
          type: 'session_transferred',
          message: '会话已转移',
          from: oldCustomerServiceId,
          to: newCustomerServiceId
        });
        
        logger.info(`Conversation ${conversationId} transferred from ${oldCustomerServiceId} to ${newCustomerServiceId}`);
      }
      
      return success;
    } catch (error) {
      logger.error(`Failed to transfer conversation ${conversationId}:`, error);
      return false;
    }
  }

  /**
   * 关闭会话
   * @param {string} conversationId 会话ID
   * @param {string} reason 关闭原因
   */
  async closeSession(conversationId, reason = 'normal') {
    try {
      // 更新会话状态
      await this.db.updateConversationStatus(conversationId, 'closed', {
        closedReason: reason,
        closedAt: new Date()
      });
      
      // 获取会话信息
      const conversation = await this.db.getConversationById(conversationId);
      
      // 从客服当前会话列表移除
      for (const participant of conversation.participants) {
        if (participant.role === 'customer_service' || participant.role === 'admin') {
          const cs = this.customerServices.get(participant.userId);
          if (cs) {
            cs.currentSessions = cs.currentSessions.filter(id => id !== conversationId);
          }
          
          // 标记客服离开会话
          await this.db.removeUserFromConversation(conversationId, participant.userId);
        }
      }
      
      // 通知参与者
      this.sendSessionNotification(conversationId, {
        type: 'session_closed',
        reason
      });
      
      logger.info(`Conversation ${conversationId} closed: ${reason}`);
    } catch (error) {
      logger.error(`Failed to close conversation ${conversationId}:`, error);
    }
  }

  /**
   * 获取在线客服列表
   * @returns {Array} 客服列表
   */
  getOnlineCustomerServices() {
    return Array.from(this.customerServices.values());
  }

  /**
   * 转移所有会话
   * @param {string} fromCustomerServiceId 源客服ID
   * @param {string} toCustomerServiceId 目标客服ID
   * @returns {Promise<Object>} 转移结果
   */
  async transferAllSessions(fromCustomerServiceId, toCustomerServiceId) {
    try {
      const cs = this.customerServices.get(fromCustomerServiceId);
      if (!cs) {
        return { success: false, message: '源客服不存在' };
      }
      
      const transferredConversations = [];
      const failedConversations = [];
      
      for (const conversationId of cs.currentSessions) {
        const success = await this.transferSession(conversationId, toCustomerServiceId);
        if (success) {
          transferredConversations.push(conversationId);
        } else {
          failedConversations.push(conversationId);
        }
      }
      
      return {
        success: true,
        transferred: transferredConversations,
        failed: failedConversations
      };
    } catch (error) {
      logger.error(`Failed to transfer all sessions from ${fromCustomerServiceId} to ${toCustomerServiceId}:`, error);
      return { success: false, message: error.message };
    }
  }

  /**
   * 添加自动回复规则
   * @param {Object} rule 规则数据
   * @returns {Object} 添加的规则
   */
  addAutoReplyRule(rule) {
    return this.autoReply.addAutoReplyRule(rule);
  }

  /**
   * 获取客服统计数据
   * @param {string} customerServiceId 客服ID
   * @param {Object} timeRange 时间范围
   * @returns {Promise<Object>} 统计数据
   */
  async getCustomerServiceStatistics(customerServiceId, timeRange = {}) {
    try {
      return await this.stats.getCustomerServiceStats(customerServiceId, timeRange);
    } catch (error) {
      logger.error(`Failed to get statistics for customer service ${customerServiceId}:`, error);
      return null;
    }
  }

  /**
   * 生成工作报表
   * @param {string} customerServiceId 客服ID
   * @param {Object} timeRange 时间范围
   * @returns {Promise<Object>} 工作报表
   */
  async generateWorkReport(customerServiceId, timeRange = {}) {
    try {
      return await this.stats.generateWorkReport(customerServiceId, timeRange);
    } catch (error) {
      logger.error(`Failed to generate work report for customer service ${customerServiceId}:`, error);
      throw error;
    }
  }

  /**
   * 获取会话趋势数据
   * @param {string} interval 时间间隔
   * @param {number} limit 数据点数量
   * @returns {Promise<Array>} 趋势数据
   */
  async getConversationTrends(interval = 'day', limit = 7) {
    try {
      return await this.stats.getConversationTrends(interval, limit);
    } catch (error) {
      logger.error('Failed to get conversation trends:', error);
      throw error;
    }
  }
}

module.exports = new CustomerService();