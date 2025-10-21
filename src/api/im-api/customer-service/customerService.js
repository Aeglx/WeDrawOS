/**
 * 在线客服服务
 * 提供客服会话管理和消息处理功能
 */

const logger = require('../../core/utils/logger');
const cacheManager = require('../../core/cache/cacheManager');
const websocketService = require('../websocket/websocketService');
const pushService = require('../push/pushService');

class CustomerService {
  constructor() {
    this.activeSessions = new Map(); // sessionId -> 会话信息
    this.customerServiceUsers = new Map(); // userId -> 客服信息
    this.waitingQueue = []; // 等待队列
    this.loadCustomerServiceUsers();
  }

  /**
   * 初始化客服用户
   */
  loadCustomerServiceUsers() {
    // 模拟客服数据，实际应该从数据库获取
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

    logger.info(`加载了 ${csUsers.length} 名客服人员`);
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
      }

      logger.info(`创建客服会话成功: ${sessionId}`);
      return session;
    } catch (error) {
      logger.error('创建客服会话失败:', error);
      throw error;
    }
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
      contentType = 'text'
    } = params;

    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error('会话不存在或已关闭');
      }

      // 检查会话状态
      if (session.status !== 'active') {
        throw new Error('会话未激活，请等待客服接入');
      }

      // 确定发送者姓名
      let senderName;
      if (senderId === session.userId) {
        senderName = session.userName;
      } else if (senderId === session.csUserId) {
        senderName = session.csUserName;
      } else {
        throw new Error('发送者不是会话参与者');
      }

      // 创建消息
      const message = this.createMessage({
        sessionId,
        senderId,
        senderName,
        content,
        contentType
      });

      // 添加到会话消息列表
      session.messages.push(message);
      session.lastMessageAt = Date.now();

      // 保存会话状态
      this.activeSessions.set(sessionId, session);

      // 通过WebSocket发送消息
      const recipientId = senderId === session.userId ? session.csUserId : session.userId;
      if (websocketService && typeof websocketService.send === 'function') {
        websocketService.send(recipientId, {
          type: 'customer_service_message',
          data: message,
          timestamp: Date.now()
        });
      }

      // 如果消息未送达，使用推送服务
      if (!websocketService || !websocketService.isUserOnline(recipientId)) {
        await pushService.pushMessage({
          userId: recipientId,
          title: `来自${senderName}的消息`,
          content: contentType === 'text' ? content : '[非文本消息]',
          type: 'customer_service',
          data: { sessionId, messageId: message.id },
          channels: ['app', 'sms']
        });
      }

      logger.info(`客服消息已发送: ${message.id}, 会话: ${sessionId}`);
      return message;
    } catch (error) {
      logger.error('发送客服消息失败:', error);
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
  getSessions(filters = {}) {
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

    return sessions;
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
   */
  updateCustomerServiceStatus(csUserId, online) {
    const cs = this.customerServiceUsers.get(csUserId);
    if (!cs) {
      throw new Error('客服不存在');
    }

    cs.online = online;
    this.customerServiceUsers.set(csUserId, cs);

    logger.info(`客服 ${cs.name}(${csUserId}) 状态更新为: ${online ? '在线' : '离线'}`);

    // 如果客服上线，处理等待队列
    if (online) {
      this.processWaitingQueue();
    }

    return cs;
  }

  /**
   * 处理等待队列
   */
  async processWaitingQueue() {
    if (this.waitingQueue.length === 0) return;

    logger.info(`处理等待队列，当前等待数: ${this.waitingQueue.length}`);

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
      read: false
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
  getStatistics() {
    return {
      totalSessions: this.activeSessions.size,
      activeSessions: Array.from(this.activeSessions.values()).filter(s => s.status === 'active').length,
      waitingSessions: this.waitingQueue.length,
      onlineCustomerService: Array.from(this.customerServiceUsers.values()).filter(cs => cs.online).length,
      totalCustomerService: this.customerServiceUsers.size
    };
  }
}

// 导出单例
module.exports = new CustomerService();