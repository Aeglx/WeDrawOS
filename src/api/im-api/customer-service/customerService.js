/**
 * 在线客服服务
 * 提供客服会话管理、自动回复和会话转移功能
 */

const logger = require('../../core/utils/logger');
const cacheManager = require('../../core/cache/cacheManager');
const db = require('../../core/database/database');
const WebSocketService = require('../../core/services/websocketService');
const pushService = require('../../core/services/pushService');
let websocketService = null;
try {
  websocketService = WebSocketService.getInstance();
} catch (error) {
  logger.warn('WebSocket服务尚未初始化');
}

class CustomerService {
  constructor() {
    this.activeSessions = new Map(); // sessionId -> 会话信息
    this.customerServiceUsers = new Map(); // userId -> 客服信息
    this.waitingQueue = []; // 等待队列
    this.autoReplyRules = []; // 自动回复规则
    this.loadCustomerServiceUsers();
    this.loadAutoReplyRules();
    
    // 初始化WebSocket事件监听
    this.setupWebSocketListeners();
  }
  
  /**
   * 设置WebSocket事件监听
   */
  setupWebSocketListeners() {
    try {
      if (websocketService) {
        // 监听用户连接事件
        websocketService.on('user_connected', (data) => {
          this.handleUserConnected(data);
        });
        
        // 监听用户断开连接事件
        websocketService.on('user_disconnected', (data) => {
          this.handleUserDisconnected(data);
        });
        
        logger.info('客服系统WebSocket事件监听已设置');
      }
    } catch (error) {
      logger.error('设置WebSocket事件监听失败:', error);
    }
  }
  
  /**
   * 处理WebSocket消息
   */
  async handleWebSocketMessage(message) {
    try {
      const { userId, type, data, sessionId } = message;
      
      switch (type) {
        case 'customer_service_message':
          await this.handleCustomerServiceMessage(userId, data, sessionId);
          break;
          
        case 'customer_service_typing':
          this.handleTypingStatus(userId, data, sessionId);
          break;
          
        case 'customer_service_leave_session':
          await this.handleLeaveSession(userId, sessionId);
          break;
          
        default:
          logger.warn(`未知的客服消息类型: ${type}`);
      }
    } catch (error) {
      logger.error('处理WebSocket消息失败:', error);
      
      // 发送错误响应
      if (websocketService && message.userId) {
        websocketService.send(message.userId, {
          type: 'customer_service_error',
          data: { message: '处理消息失败' },
          timestamp: Date.now()
        });
      }
    }
  }
  
  /**
   * 处理客服消息
   */
  async handleCustomerServiceMessage(userId, data, sessionId) {
    const { content, contentType = 'text' } = data;
    
    // 查找会话
    let session = this.activeSessions.get(sessionId);
    
    // 如果会话不存在，检查用户是否已有活跃会话
    if (!session) {
      // 查找用户的活跃会话
      for (const [id, s] of this.activeSessions.entries()) {
        if (s.userId === userId && s.status === 'active') {
          session = s;
          sessionId = id;
          break;
        }
      }
    }
    
    // 如果仍没有会话，创建新会话
    if (!session) {
      session = await this.createSession({
        userId,
        userName: data.userName || '用户',
        initialMessage: content,
        questionType: data.questionType
      });
      sessionId = session.sessionId;
    }
    
    // 发送消息
    await this.sendMessage({
      sessionId,
      senderId: userId,
      senderName: data.userName || '用户',
      content,
      contentType
    });
    
    // 处理自动回复
    if (this.isUser(userId) && !this.isCustomerService(userId)) {
      await this.handleAutoReply(session, content);
    }
  }
  
  /**
   * 处理输入状态
   */
  handleTypingStatus(userId, data, sessionId) {
    const { isTyping } = data;
    
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      logger.warn(`会话不存在: ${sessionId}`);
      return;
    }
    
    // 确定接收者
    let recipientId;
    if (this.isCustomerService(userId)) {
      recipientId = session.userId;
    } else {
      recipientId = session.csUserId;
    }
    
    // 发送输入状态给接收者
    if (websocketService && recipientId) {
      websocketService.send(recipientId, {
        type: 'customer_service_typing',
        data: {
          sessionId,
          userId,
          isTyping,
          userName: this.isCustomerService(userId) ? session.csUserName : session.userName
        },
        timestamp: Date.now()
      });
    }
  }
  
  /**
   * 处理离开会话
   */
  async handleLeaveSession(userId, sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      logger.warn(`会话不存在: ${sessionId}`);
      return;
    }
    
    // 判断用户类型
    if (this.isCustomerService(userId)) {
      // 客服离开，需要转移会话
      await this.transferSession(sessionId, null, '客服主动离开');
    } else if (session.userId === userId) {
      // 用户离开，关闭会话
      await this.closeSession(sessionId, 'user_left');
    }
  }
  
  /**
   * 处理用户连接
   */
  handleUserConnected(data) {
    const { userId, role } = data;
    
    if (role === 'customer_service') {
      // 客服上线，更新状态
      this.updateCustomerServiceStatus(userId, true, 'online').catch(error => {
        logger.error('更新客服在线状态失败:', error);
      });
    } else {
      // 普通用户上线，检查是否有等待中的会话
      this.checkPendingSessions(userId);
    }
  }
  
  /**
   * 处理用户断开连接
   */
  handleUserDisconnected(data) {
    const { userId, role } = data;
    
    if (role === 'customer_service') {
      // 客服下线，处理会话转移
      this.updateCustomerServiceStatus(userId, false).catch(error => {
        logger.error('更新客服离线状态失败:', error);
      });
    }
  }
  
  /**
   * 检查用户待处理会话
   */
  checkPendingSessions(userId) {
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (session.userId === userId && session.status === 'waiting') {
        // 通知用户有等待中的会话
        if (websocketService) {
          websocketService.send(userId, {
            type: 'customer_service_pending_session',
            data: {
              sessionId,
              waitingTime: Date.now() - session.createdAt
            },
            timestamp: Date.now()
          });
        }
        break;
      }
    }
  }
  
  /**
   * 判断是否为客服
   */
  isCustomerService(userId) {
    return this.customerServiceUsers.has(userId);
  }
  
  /**
   * 判断是否为普通用户
   */
  isUser(userId) {
    return !this.isCustomerService(userId);
  }

  /**
   * 初始化客服用户
   */
  async loadCustomerServiceUsers() {
    try {
      // 从数据库获取客服数据
      const result = await db.query(
        `SELECT id, name, max_sessions, specialties 
         FROM users 
         WHERE role = 'customer_service' AND status = 'active'`,
        []
      );

      const csUsers = result.rows.map(row => ({
        userId: row.id,
        name: row.name,
        online: false,
        maxSessions: row.max_sessions || 10,
        currentSessions: 0,
        specialties: row.specialties || ['general']
      }));

      csUsers.forEach(user => {
        this.customerServiceUsers.set(user.userId, user);
      });

      logger.info(`加载了 ${csUsers.length} 名客服人员`);
    } catch (error) {
      logger.error('加载客服人员失败:', error);
      // 使用模拟数据作为备用
      this.loadMockCustomerServiceUsers();
    }
  }

  /**
   * 加载模拟客服数据（备用）
   */
  loadMockCustomerServiceUsers() {
    const csUsers = [
      {
        userId: 'cs1',
        name: '客服小王',
        online: false,
        maxSessions: 10,
        currentSessions: 0,
        specialties: ['订单', '退款']
      },
      {
        userId: 'cs2',
        name: '客服小李',
        online: false,
        maxSessions: 10,
        currentSessions: 0,
        specialties: ['商品咨询', '会员服务']
      },
      {
        userId: 'cs3',
        name: '客服小张',
        online: false,
        maxSessions: 10,
        currentSessions: 0,
        specialties: ['技术支持', '售后']
      }
    ];

    csUsers.forEach(user => {
      this.customerServiceUsers.set(user.userId, user);
    });

    logger.info(`加载了 ${csUsers.length} 名模拟客服人员`);
  }

  /**
   * 加载自动回复规则
   */
  async loadAutoReplyRules() {
    try {
      // 从数据库加载自动回复规则
      const result = await db.query(
        `SELECT keyword, response, priority 
         FROM auto_reply_rules 
         WHERE status = 'active' 
         ORDER BY priority DESC`,
        []
      );

      this.autoReplyRules = result.rows;
    } catch (error) {
      logger.error('加载自动回复规则失败:', error);
      // 使用默认规则
      this.autoReplyRules = [
        {
          keyword: '订单',
          response: '关于订单问题，请您提供订单号，我们的客服会尽快为您处理。',
          priority: 1
        },
        {
          keyword: '退款',
          response: '关于退款问题，一般会在1-7个工作日内处理完成。如有特殊情况，请联系在线客服为您加急处理。',
          priority: 1
        },
        {
          keyword: '帮助',
          response: '您好，欢迎使用我们的客服系统。请问有什么可以帮助您的？',
          priority: 0
        },
        {
          keyword: '你好',
          response: '您好！很高兴为您服务，请问有什么可以帮助您的吗？',
          priority: 0
        }
      ];
    }
    logger.info(`加载了 ${this.autoReplyRules.length} 条自动回复规则`);
  }

  /**
   * 创建客服会话
   * @param {Object} params - 创建会话参数
   * @param {string} params.userId - 用户ID
   * @param {string} params.name - 用户姓名
   * @param {string} params.questionType - 问题类型
   * @param {string} params.initialQuestion - 初始问题
   */
  async createSession(params) {
    const {
      userId,
      name,
      questionType,
      initialQuestion
    } = params;

    try {
      // 检查用户是否已有活跃会话
      const existingSession = this.getUserActiveSession(userId);
      if (existingSession) {
        logger.info(`用户 ${userId} 已有活跃会话: ${existingSession.sessionId}`);
        return existingSession;
      }

      // 创建新会话
      const sessionId = `cs_session_${Date.now()}_${userId}`;
      const session = {
        sessionId,
        userId,
        userName: name,
        questionType,
        status: 'waiting', // waiting, active, closed
        createdAt: Date.now(),
        assignedAt: null,
        closedAt: null,
        csUserId: null,
        csUserName: null,
        messages: [],
        lastMessageAt: Date.now()
      };

      // 添加初始问题
      if (initialQuestion) {
        const initialMessage = this.createMessage({
          sessionId,
          senderId: userId,
          senderName: name,
          content: initialQuestion,
          contentType: 'text'
        });
        session.messages.push(initialMessage);
      }

      // 保存会话
      this.activeSessions.set(sessionId, session);
      
      // 尝试分配客服
      const assigned = await this.assignCustomerService(session);
      
      if (!assigned) {
        // 加入等待队列
        this.waitingQueue.push(sessionId);
        logger.info(`用户 ${userId} 的会话已加入等待队列`);
        
        // 发送等待通知
      await this.sendWaitingNotification(session);
      
      // 如果有初始问题，尝试自动回复
      if (initialQuestion) {
        await this.handleAutoReply(session, initialQuestion);
      }
    }

    logger.info(`创建客服会话成功: ${sessionId}`);
    return session;
  } catch (error) {
    logger.error('创建客服会话失败:', error);
    throw error;
  }
  }

  /**
   * 处理自动回复
   * @param {Object} session - 会话信息
   * @param {string} userMessage - 用户消息
   */
  async handleAutoReply(session, userMessage) {
    try {
      // 查找匹配的自动回复规则
      const reply = this.getAutoReply(userMessage);
      
      if (reply) {
        // 创建自动回复消息
        const autoReplyMessage = this.createMessage({
          sessionId: session.sessionId,
          senderId: 'system',
          senderName: '系统',
          content: reply,
          contentType: 'text',
          isAutoReply: true
        });
        
        // 添加到会话
        session.messages.push(autoReplyMessage);
        session.lastMessageAt = Date.now();
        this.activeSessions.set(session.sessionId, session);
        
        // 发送给用户
        if (websocketService && typeof websocketService.send === 'function') {
          websocketService.send(session.userId, {
            type: 'customer_service_message',
            data: autoReplyMessage,
            timestamp: Date.now()
          });
        } else {
          // 如果WebSocket不可用，使用推送服务
          await pushService.pushMessage({
            userId: session.userId,
            title: '系统回复',
            content: reply,
            type: 'customer_service',
            data: { sessionId: session.sessionId },
            channels: ['app']
          });
        }
        
        logger.info(`自动回复已发送: ${session.sessionId}`);
      }
    } catch (error) {
      logger.error('处理自动回复失败:', error);
    }
  }

  /**
   * 获取自动回复内容
   * @param {string} message - 用户消息
   * @returns {string|null} 匹配的回复内容
   */
  getAutoReply(message) {
    if (!message || typeof message !== 'string') {
      return null;
    }
    
    const lowerMessage = message.toLowerCase();
    
    // 查找匹配的规则
    for (const rule of this.autoReplyRules) {
      if (lowerMessage.includes(rule.keyword.toLowerCase())) {
        return rule.response;
      }
    }
    
    return null;
  }

  /**
   * 分配客服人员
   * @param {Object} session - 会话信息
   */
  async assignCustomerService(session) {
    // 查找合适的客服
    const availableCS = this.findAvailableCustomerService(session.questionType);
    
    if (!availableCS) {
      return false;
    }

    // 分配客服
    session.csUserId = availableCS.userId;
    session.csUserName = availableCS.name;
    session.status = 'active';
    session.assignedAt = Date.now();
    
    // 更新客服状态
    availableCS.currentSessions += 1;
    
    // 从等待队列移除
    const queueIndex = this.waitingQueue.indexOf(session.sessionId);
    if (queueIndex > -1) {
      this.waitingQueue.splice(queueIndex, 1);
    }

    // 更新数据库
    try {
      await db.query(
        `UPDATE customer_service_sessions 
         SET cs_user_id = $1, cs_user_name = $2, status = 'active', assigned_at = $3 
         WHERE id = $4`,
        [availableCS.userId, availableCS.name, new Date(), session.sessionId]
      );
    } catch (dbError) {
      logger.warn('更新会话分配状态失败:', dbError);
    }

    logger.info(`会话 ${session.sessionId} 已分配给客服 ${availableCS.name}(${availableCS.userId})`);

    // 发送通知给用户和客服
    await this.notifySessionAssigned(session);
    
    return true;
  }

  /**
   * 查找可用的客服
   * @param {string} questionType - 问题类型
   */
  findAvailableCustomerService(questionType) {
    // 获取在线且未达到会话上限的客服
    const availableCS = Array.from(this.customerServiceUsers.values())
      .filter(cs => cs.online && cs.currentSessions < cs.maxSessions)
      .sort((a, b) => {
        // 优先选择有相关专长的客服
        const aHasSpecialty = a.specialties.includes(questionType);
        const bHasSpecialty = b.specialties.includes(questionType);
        
        if (aHasSpecialty && !bHasSpecialty) return -1;
        if (!aHasSpecialty && bHasSpecialty) return 1;
        
        // 然后按照当前会话数排序
        return a.currentSessions - b.currentSessions;
      });

    return availableCS[0] || null;
  }

  /**
   * 发送消息
   * @param {Object} params - 消息参数
   * @param {string} params.sessionId - 会话ID
   * @param {string} params.senderId - 发送者ID
   * @param {string} params.content - 消息内容
   * @param {string} params.contentType - 消息类型
   */
  async sendMessage(params) {
    const {
      sessionId,
      senderId,
      content,
      contentType = 'text',
      isAutoReply = false,
      isSystem = false
    } = params;

    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error('会话不存在或已关闭');
      }

      // 确定发送者姓名
      let senderName;
      if (senderId === session.userId) {
        senderName = session.userName;
        
        // 如果会话未激活，等待客服接入但仍保存消息
        if (session.status !== 'active') {
          // 保存消息
          const message = this.createMessage({
            sessionId,
            senderId,
            senderName,
            content,
            contentType,
            isAutoReply,
            isSystem
          });
          
          session.messages.push(message);
          session.lastMessageAt = Date.now();
          this.activeSessions.set(sessionId, session);
          
          // 尝试自动回复
          await this.handleAutoReply(session, content);
          
          // 构建消息发送数据
          const messageData = {
            ...message,
            sessionInfo: {
              id: session.sessionId,
              userName: session.userName,
              csUserName: session.csUserName,
              status: session.status
            }
          };
          
          // 发送消息给用户
          if (websocketService && websocketService.isUserOnline(session.userId)) {
            websocketService.send(session.userId, {
              type: 'customer_service_message',
              data: messageData,
              timestamp: Date.now()
            });
          }
          
          return message;
        }
      } else if (senderId === session.csUserId) {
        senderName = session.csUserName;
      } else if (senderId === 'system') {
        senderName = '系统';
      } else {
        throw new Error('发送者不是会话参与者');
      }

      // 创建消息
      const message = this.createMessage({
        sessionId,
        senderId,
        senderName,
        content,
        contentType,
        isAutoReply,
        isSystem
      });

      // 添加到会话消息列表
      session.messages.push(message);
      session.lastMessageAt = Date.now();

      // 保存到数据库
      try {
        await db.query(
          `INSERT INTO customer_service_messages 
           (id, session_id, sender_id, sender_name, content, content_type, 
            is_auto_reply, is_system, created_at) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [message.id, sessionId, senderId, senderName, content, contentType, 
           isAutoReply, isSystem, new Date(message.timestamp)]
        );
      } catch (dbError) {
        logger.warn('保存消息到数据库失败:', dbError);
      }

      // 更新会话状态
      this.activeSessions.set(sessionId, session);

      // 构建消息发送数据
      const messageData = {
        ...message,
        sessionInfo: {
          id: session.sessionId,
          userName: session.userName,
          csUserName: session.csUserName,
          status: session.status
        }
      };

      // 发送消息给会话双方
      this.sendMessageToParticipants(sessionId, messageData);

      logger.info(`客服消息已发送: ${message.id}, 会话: ${sessionId}${isAutoReply ? ' (自动回复)' : ''}`);
      return message;
    } catch (error) {
      logger.error('发送客服消息失败:', error);
      throw error;
    }
  }
  
  /**
   * 将会话消息发送给参与者
   */
  async sendMessageToParticipants(sessionId, messageData) {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;
    
    const message = {
      type: 'customer_service_message',
      data: messageData,
      timestamp: Date.now()
    };
    
    // 发送给用户
    if (websocketService) {
      // 发送给当前会话用户
      if (websocketService.isUserOnline && websocketService.isUserOnline(session.userId)) {
        websocketService.send(session.userId, message);
      } else {
        // 用户不在线，发送离线推送
        await pushService.pushMessage({
          userId: session.userId,
          title: session.csUserName ? `来自${session.csUserName}的消息` : '客服消息',
          content: messageData.content,
          type: 'customer_service',
          data: { sessionId, messageId: messageData.id },
          channels: ['app', 'email']
        });
      }
      
      // 发送给客服
      if (session.csUserId && websocketService.isUserOnline && websocketService.isUserOnline(session.csUserId)) {
        websocketService.send(session.csUserId, message);
      } else if (session.csUserId) {
        // 客服不在线，发送离线推送
        await pushService.pushMessage({
          userId: session.csUserId,
          title: `来自${session.userName}的消息`,
          content: messageData.content,
          type: 'customer_service',
          data: { sessionId, messageId: messageData.id },
          channels: ['app', 'email']
        });
      }
    }
  }
  
  /**
   * 发送系统通知给会话参与者
   */
  async sendSessionNotification(sessionId, notificationType, data) {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;
    
    const notification = {
      type: 'customer_service_notification',
      data: {
        sessionId,
        notificationType,
        ...data
      },
      timestamp: Date.now()
    };
    
    // 发送给用户
    if (websocketService && websocketService.isUserOnline && websocketService.isUserOnline(session.userId)) {
      websocketService.send(session.userId, notification);
    }
    
    // 发送给客服
    if (session.csUserId && websocketService && websocketService.isUserOnline && websocketService.isUserOnline(session.csUserId)) {
      websocketService.send(session.csUserId, notification);
    }
    
    logger.info(`发送会话通知到 ${sessionId}: ${notificationType}`);
  }

  /**
   * 转移会话给其他客服
   * @param {string} sessionId - 会话ID
   * @param {string} targetCsUserId - 目标客服ID
   * @param {string} reason - 转移原因
   */
  async transferSession(sessionId, targetCsUserId, reason) {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error('会话不存在或已关闭');
      }

      if (session.status === 'closed') {
        throw new Error('不能转移已关闭的会话');
      }

      // 检查目标客服是否存在且在线
      const targetCs = this.customerServiceUsers.get(targetCsUserId);
      if (!targetCs || !targetCs.online) {
        throw new Error('目标客服不在线或不存在');
      }

      // 检查目标客服是否达到会话上限
      if (targetCs.currentSessions >= targetCs.maxSessions) {
        throw new Error('目标客服当前会话已满');
      }

      const sourceCsUserId = session.csUserId;
      const sourceCsUserName = session.csUserName;

      // 更新原客服的会话数
      if (sourceCsUserId && this.customerServiceUsers.has(sourceCsUserId)) {
        const sourceCs = this.customerServiceUsers.get(sourceCsUserId);
        if (sourceCs.currentSessions > 0) {
          sourceCs.currentSessions -= 1;
        }
      }

      // 更新目标客服的会话数
      targetCs.currentSessions += 1;

      // 更新会话信息
      session.csUserId = targetCsUserId;
      session.csUserName = targetCs.name;
      session.transferredAt = Date.now();
      session.transferredFrom = sourceCsUserId;
      session.transferReason = reason;

      // 更新数据库
      try {
        await db.query(
          `UPDATE customer_service_sessions 
           SET cs_user_id = $1, cs_user_name = $2, 
               transferred_at = $3, transferred_from = $4, transfer_reason = $5,
               updated_at = $6 
           WHERE id = $7`,
          [targetCsUserId, targetCs.name, new Date(), sourceCsUserId, reason, new Date(), sessionId]
        );
      } catch (dbError) {
        logger.warn('更新会话转移信息失败:', dbError);
      }

      // 创建系统消息通知双方
      const transferMessage = this.createMessage({
        sessionId,
        senderId: 'system',
        senderName: '系统',
        content: `会话已从${sourceCsUserName || '未知客服'}转移给${targetCs.name}，原因：${reason || '无'}`,
        contentType: 'text',
        isSystem: true
      });
      session.messages.push(transferMessage);
      this.activeSessions.set(sessionId, session);

      // 通知用户
      await pushService.pushMessage({
        userId: session.userId,
        title: '会话已转移',
        content: `您的会话已转移给客服${targetCs.name}，请继续咨询`,
        type: 'customer_service',
        data: { sessionId },
        channels: ['websocket', 'app']
      });

      // 通知新旧客服
      if (websocketService && typeof websocketService.send === 'function') {
        // 通知新客服
        websocketService.send(targetCsUserId, {
          type: 'session_transferred',
          data: {
            sessionId,
            userInfo: { userId: session.userId, userName: session.userName },
            transferredFrom: sourceCsUserId,
            transferredFromName: sourceCsUserName,
            reason
          },
          timestamp: Date.now()
        });

        // 通知原客服
        if (sourceCsUserId) {
          websocketService.send(sourceCsUserId, {
            type: 'session_transferred_away',
            data: {
              sessionId,
              transferredTo: targetCsUserId,
              transferredToName: targetCs.name,
              reason
            },
            timestamp: Date.now()
          });
        }

        // 发送系统消息给双方
        websocketService.send(session.userId, {
          type: 'customer_service_message',
          data: transferMessage,
          timestamp: Date.now()
        });
        websocketService.send(targetCsUserId, {
          type: 'customer_service_message',
          data: transferMessage,
          timestamp: Date.now()
        });
      }

      logger.info(`会话 ${sessionId} 已从客服 ${sourceCsUserId} 转移到客服 ${targetCsUserId}`);
      return session;
    } catch (error) {
      logger.error('转移客服会话失败:', error);
      throw error;
    }
  }

  /**
   * 关闭会话
   * @param {string} sessionId - 会话ID
   * @param {string} closedBy - 关闭者ID
   * @param {string} reason - 关闭原因
   */
  async closeSession(sessionId, closedBy, reason = '') {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error('会话不存在或已关闭');
      }

      if (session.status === 'closed') {
        logger.warn(`会话 ${sessionId} 已经关闭`);
        return session;
      }

      // 更新会话状态
      session.status = 'closed';
      session.closedAt = Date.now();
      session.closedBy = closedBy;
      session.closeReason = reason;

      // 如果有分配客服，减少其当前会话数
      if (session.csUserId && this.customerServiceUsers.has(session.csUserId)) {
        const cs = this.customerServiceUsers.get(session.csUserId);
        if (cs.currentSessions > 0) {
          cs.currentSessions -= 1;
        }
      }

      // 更新数据库
      try {
        await db.query(
          `UPDATE customer_service_sessions 
           SET status = 'closed', closed_at = $1, closed_by = $2, close_reason = $3, updated_at = $4 
           WHERE id = $5`,
          [new Date(), closedBy, reason, new Date(), sessionId]
        );
      } catch (dbError) {
        logger.warn('更新会话关闭状态失败:', dbError);
      }

      // 保存会话状态
      this.activeSessions.set(sessionId, session);

      // 通知双方会话已关闭
      await this.notifySessionClosed(session);

      // 处理等待队列中的下一个会话
      await this.processWaitingQueue();

      logger.info(`客服会话已关闭: ${sessionId}`);
      return session;
    } catch (error) {
      logger.error('关闭客服会话失败:', error);
      throw error;
    }
  }

  /**
   * 获取会话列表
   * @param {Object} filters - 过滤条件
   */
  async getSessions(filters = {}) {
    try {
      // 先尝试从数据库获取（支持分页和更完整的数据）
      let query = `SELECT * FROM customer_service_sessions WHERE 1=1`;
      const params = [];
      
      if (filters.userId) {
        query += ` AND user_id = $${params.length + 1}`;
        params.push(filters.userId);
      }

      if (filters.csUserId) {
        query += ` AND cs_user_id = $${params.length + 1}`;
        params.push(filters.csUserId);
      }

      if (filters.status) {
        query += ` AND status = $${params.length + 1}`;
        params.push(filters.status);
      }

      // 添加时间范围过滤
      if (filters.startTime) {
        query += ` AND created_at >= $${params.length + 1}`;
        params.push(new Date(filters.startTime));
      }

      if (filters.endTime) {
        query += ` AND created_at <= $${params.length + 1}`;
        params.push(new Date(filters.endTime));
      }

      // 添加排序和分页
      query += ` ORDER BY last_message_at DESC NULLS LAST`;
      
      if (filters.limit) {
        query += ` LIMIT $${params.length + 1}`;
        params.push(filters.limit);
      }

      if (filters.offset) {
        query += ` OFFSET $${params.length + 1}`;
        params.push(filters.offset);
      }

      const result = await db.query(query, params);
      const dbSessions = result.rows;
      
      if (dbSessions.length > 0) {
        return dbSessions;
      }
    } catch (dbError) {
      logger.warn('从数据库获取会话列表失败，将使用内存数据:', dbError);
    }
    
    // 从内存获取
    let sessions = Array.from(this.activeSessions.values());

    // 应用过滤条件
    if (filters.userId) {
      sessions = sessions.filter(s => s.userId === filters.userId);
    }

    if (filters.csUserId) {
      sessions = sessions.filter(s => s.csUserId === filters.csUserId);
    }

    if (filters.status) {
      sessions = sessions.filter(s => s.status === filters.status);
    }

    // 按最后消息时间倒序排序
    sessions.sort((a, b) => b.lastMessageAt - a.lastMessageAt);
    
    // 应用分页
    if (filters.limit !== undefined) {
      const offset = filters.offset || 0;
      sessions = sessions.slice(offset, offset + filters.limit);
    }

    return sessions;
  }

  /**
   * 获取会话消息历史
   * @param {string} sessionId - 会话ID
   * @param {Object} options - 选项
   */
  async getSessionMessages(sessionId, options = {}) {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error('会话不存在');
      }
      
      // 先尝试从数据库获取
      try {
        let query = `SELECT * FROM customer_service_messages WHERE session_id = $1 ORDER BY created_at DESC`;
        const params = [sessionId];
        
        if (options.limit) {
          query += ` LIMIT $2`;
          params.push(options.limit);
        }
        
        if (options.offset) {
          query += ` OFFSET $${options.limit ? 3 : 2}`;
          params.push(options.offset);
        }
        
        const result = await db.query(query, params);
        const dbMessages = result.rows;
        
        if (dbMessages.length > 0) {
          return dbMessages.reverse(); // 返回按时间正序
        }
      } catch (dbError) {
        logger.warn('从数据库获取消息历史失败，将使用内存数据:', dbError);
      }
      
      // 从内存获取
      let messages = [...session.messages];
      
      // 应用分页
      if (options.limit !== undefined) {
        const offset = options.offset || 0;
        messages = messages.slice(offset, offset + options.limit);
      }
      
      return messages;
    } catch (error) {
      logger.error('获取会话消息历史失败:', error);
      throw error;
    }
  }

  /**
   * 获取会话详情
   * @param {string} sessionId - 会话ID
   */
  getSession(sessionId) {
    return this.activeSessions.get(sessionId);
  }

  /**
   * 获取用户的活跃会话
   * @param {string} userId - 用户ID
   */
  getUserActiveSession(userId) {
    for (const session of this.activeSessions.values()) {
      if (session.userId === userId && session.status !== 'closed') {
        return session;
      }
    }
    return null;
  }

  /**
   * 更新客服在线状态
   * @param {string} csUserId - 客服ID
   * @param {boolean} online - 是否在线
   * @param {string} status - 详细状态 (online, busy, away)
   */
  async updateCustomerServiceStatus(csUserId, online, status = 'online') {
    const cs = this.customerServiceUsers.get(csUserId);
    if (!cs) {
      throw new Error('客服不存在');
    }

    cs.online = online;
    cs.status = status;
    this.customerServiceUsers.set(csUserId, cs);
    
    // 更新数据库
    try {
      await db.query(
        `UPDATE users SET status = $1, last_seen = $2 WHERE id = $3`,
        [online ? status : 'offline', new Date(), csUserId]
      );
    } catch (dbError) {
      logger.warn('更新客服状态到数据库失败:', dbError);
    }

    logger.info(`客服 ${cs.name}(${csUserId}) 状态更新为: ${online ? status : '离线'}`);

    // 如果客服上线，处理等待队列
    if (online) {
      await this.processWaitingQueue();
    } else {
      // 如果客服下线，转移其会话
      await this.transferAllSessions(csUserId, '客服离线');
    }

    return cs;
  }

  /**
   * 转移客服的所有会话
   * @param {string} csUserId - 客服ID
   * @param {string} reason - 转移原因
   */
  async transferAllSessions(csUserId, reason) {
    try {
      const sessionsToTransfer = [];
      
      // 找出该客服的所有活跃会话
      this.activeSessions.forEach((session, sessionId) => {
        if (session.csUserId === csUserId && session.status === 'active') {
          sessionsToTransfer.push(sessionId);
        }
      });
      
      // 逐个转移会话
      for (const sessionId of sessionsToTransfer) {
        const session = this.activeSessions.get(sessionId);
        if (session) {
          // 查找其他可用客服
          const availableCS = this.findAvailableCustomerService(session.questionType);
          
          if (availableCS && availableCS.userId !== csUserId) {
            try {
              await this.transferSession(sessionId, availableCS.userId, reason);
            } catch (error) {
              logger.error(`转移会话 ${sessionId} 失败:`, error);
              // 将会话标记为等待中
              session.status = 'waiting';
              session.csUserId = null;
              session.csUserName = null;
              this.activeSessions.set(sessionId, session);
              this.waitingQueue.push(sessionId);
            }
          } else {
            // 没有可用客服，加入等待队列
            session.status = 'waiting';
            session.csUserId = null;
            session.csUserName = null;
            this.activeSessions.set(sessionId, session);
            this.waitingQueue.push(sessionId);
          }
        }
      }
      
      logger.info(`已处理客服 ${csUserId} 的 ${sessionsToTransfer.length} 个会话`);
    } catch (error) {
      logger.error('转移客服会话失败:', error);
    }
  }

  /**
   * 处理等待队列
   */
  async processWaitingQueue() {
    if (this.waitingQueue.length === 0) return;

    logger.info(`处理等待队列，当前等待数: ${this.waitingQueue.length}`);

    // 更新队列中所有用户的等待位置
    for (let i = 0; i < this.waitingQueue.length; i++) {
      const sessionId = this.waitingQueue[i];
      const session = this.activeSessions.get(sessionId);
      
      if (session) {
        // 估算等待时间
        const estimatedWaitTime = (i + 1) * 3; // 平均每人3分钟
        
        // 发送等待位置更新通知
        if (websocketService && websocketService.isUserOnline(session.userId)) {
          websocketService.send(session.userId, {
            type: 'waiting_position_update',
            data: {
              sessionId,
              position: i + 1,
              estimatedWaitTime
            },
            timestamp: Date.now()
          });
        } else {
          // 使用推送服务
          await pushService.pushMessage({
            userId: session.userId,
            title: '排队位置更新',
            content: `您当前排在第${i + 1}位，预计等待时间约${estimatedWaitTime}分钟`,
            type: 'customer_service',
            data: { sessionId, position: i + 1 },
            channels: ['app']
          });
        }
      }
    }

    // 尝试为队列中的会话分配客服
    for (let i = 0; i < this.waitingQueue.length; i++) {
      const sessionId = this.waitingQueue[i];
      const session = this.activeSessions.get(sessionId);
      
      if (session && session.status === 'waiting') {
        const assigned = await this.assignCustomerService(session);
        if (assigned) {
          // 从队列中移除
          this.waitingQueue.splice(i, 1);
          i--; // 调整索引
        }
      }
    }
  }

  /**
   * 创建消息对象
   * @param {Object} params - 消息参数
   */
  createMessage(params) {
    return {
      id: `cs_msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionId: params.sessionId,
      senderId: params.senderId,
      senderName: params.senderName,
      content: params.content,
      contentType: params.contentType || 'text',
      timestamp: Date.now(),
      read: false,
      isAutoReply: params.isAutoReply || false,
      isSystem: params.isSystem || false
    };
  }

  /**
   * 发送等待通知
   * @param {Object} session - 会话信息
   */
  async sendWaitingNotification(session) {
    // 估算等待时间
    const estimatedWaitTime = this.waitingQueue.length * 3; // 平均每人3分钟
    
    await pushService.pushMessage({
      userId: session.userId,
      title: '正在排队等待客服',
      content: `您当前排在第${this.waitingQueue.length}位，预计等待时间约${estimatedWaitTime}分钟`,
      type: 'customer_service',
      data: { sessionId: session.sessionId },
      channels: ['websocket', 'app']
    });
  }

  /**
   * 通知会话已分配
   * @param {Object} session - 会话信息
   */
  async notifySessionAssigned(session) {
    // 通知用户
    await pushService.pushMessage({
      userId: session.userId,
      title: '客服已接入',
      content: `客服${session.csUserName}已为您服务，请描述您的问题`,
      type: 'customer_service',
      data: { sessionId: session.sessionId },
      channels: ['websocket', 'app']
    });

    // 通知客服
    if (session.csUserId) {
      await pushService.pushMessage({
        userId: session.csUserId,
        title: '新的客服会话',
        content: `用户${session.userName}的咨询已接入，问题类型：${session.questionType}`,
        type: 'customer_service',
        data: { sessionId: session.sessionId },
        channels: ['websocket', 'app']
      });
    }
  }

  /**
   * 通知会话已关闭
   * @param {Object} session - 会话信息
   */
  async notifySessionClosed(session) {
    // 通知用户
    await pushService.pushMessage({
      userId: session.userId,
      title: '会话已结束',
      content: `客服会话已结束，感谢您的咨询`,
      type: 'customer_service',
      data: { sessionId: session.sessionId },
      channels: ['websocket', 'app']
    });

    // 通知客服
    if (session.csUserId) {
      await pushService.pushMessage({
        userId: session.csUserId,
        title: '会话已结束',
        content: `与用户${session.userName}的会话已结束`,
        type: 'customer_service',
        data: { sessionId: session.sessionId },
        channels: ['websocket', 'app']
      });
    }
  }

  /**
   * 获取统计信息
   */
  async getStatistics() {
    try {
      // 从数据库获取更全面的统计信息
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const result = await db.query(
        `SELECT 
          COUNT(*) as total_today,
          SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed_today,
          AVG(EXTRACT(EPOCH FROM (closed_at - assigned_at))/60) as avg_handle_time_minutes
         FROM customer_service_sessions 
         WHERE created_at >= $1`,
        [today]
      );
      
      const dbStats = result.rows[0];
      
      return {
        // 内存数据
        totalActiveSessions: this.activeSessions.size,
        activeSessions: Array.from(this.activeSessions.values()).filter(s => s.status === 'active').length,
        waitingSessions: this.waitingQueue.length,
        onlineCustomerService: Array.from(this.customerServiceUsers.values()).filter(cs => cs.online).length,
        totalCustomerService: this.customerServiceUsers.size,
        
        // 数据库统计
        totalToday: parseInt(dbStats.total_today) || 0,
        closedToday: parseInt(dbStats.closed_today) || 0,
        avgHandleTimeMinutes: dbStats.avg_handle_time_minutes ? parseFloat(dbStats.avg_handle_time_minutes) : 0
      };
    } catch (error) {
      logger.error('获取统计信息失败，将使用内存数据:', error);
      
      // 仅使用内存数据
      return {
        totalActiveSessions: this.activeSessions.size,
        activeSessions: Array.from(this.activeSessions.values()).filter(s => s.status === 'active').length,
        waitingSessions: this.waitingQueue.length,
        onlineCustomerService: Array.from(this.customerServiceUsers.values()).filter(cs => cs.online).length,
        totalCustomerService: this.customerServiceUsers.size,
        totalToday: 0,
        closedToday: 0,
        avgHandleTimeMinutes: 0
      };
    }
  }

  /**
   * 添加自动回复规则
   * @param {Object} rule - 规则对象
   */
  async addAutoReplyRule(rule) {
    try {
      const { keyword, response, priority = 0 } = rule;
      
      // 保存到数据库
      try {
        await db.query(
          `INSERT INTO auto_reply_rules (keyword, response, priority, status, created_at) 
           VALUES ($1, $2, $3, 'active', $4)`,
          [keyword, response, priority, new Date()]
        );
      } catch (dbError) {
        logger.warn('保存自动回复规则到数据库失败:', dbError);
      }
      
      // 添加到内存
      this.autoReplyRules.push({ keyword, response, priority });
      // 按优先级排序
      this.autoReplyRules.sort((a, b) => b.priority - a.priority);
      
      logger.info(`添加自动回复规则成功: ${keyword}`);
    } catch (error) {
      logger.error('添加自动回复规则失败:', error);
      throw error;
    }
  }

  /**
   * 获取客服绩效统计
   * @param {string} csUserId - 客服ID
   * @param {Object} timeRange - 时间范围
   */
  async getCustomerServiceStatistics(csUserId, timeRange) {
    try {
      const { startDate, endDate } = timeRange;
      
      const result = await db.query(
        `SELECT 
          COUNT(*) as total_sessions,
          SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed_sessions,
          AVG(EXTRACT(EPOCH FROM (closed_at - assigned_at))/60) as avg_handle_time_minutes,
          MAX(EXTRACT(EPOCH FROM (closed_at - assigned_at))/60) as max_handle_time_minutes
         FROM customer_service_sessions 
         WHERE cs_user_id = $1 AND created_at >= $2 AND created_at <= $3`,
        [csUserId, new Date(startDate), new Date(endDate)]
      );
      
      const stats = result.rows[0];
      
      return {
        totalSessions: parseInt(stats.total_sessions) || 0,
        closedSessions: parseInt(stats.closed_sessions) || 0,
        avgHandleTimeMinutes: stats.avg_handle_time_minutes ? parseFloat(stats.avg_handle_time_minutes) : 0,
        maxHandleTimeMinutes: stats.max_handle_time_minutes ? parseFloat(stats.max_handle_time_minutes) : 0
      };
    } catch (error) {
      logger.error('获取客服绩效统计失败:', error);
      throw error;
    }
  }
}

// 导出单例
module.exports = new CustomerService();