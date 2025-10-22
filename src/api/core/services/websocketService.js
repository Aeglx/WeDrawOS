const WebSocket = require('ws');
const logger = require('../utils/logger');
const authService = require('./authService');

class WebSocketService {
  constructor(server) {
    this.wss = new WebSocket.Server({ server, path: '/ws' });
    this.clients = new Map(); // userId => WebSocket
    this.userConnections = new Map(); // userId => { socket, sessionId, metadata }
    this.init();
  }

  /**
   * 初始化WebSocket服务
   */
  init() {
    this.wss.on('connection', async (ws, req) => {
      try {
        // 解析token
        const token = this.extractTokenFromRequest(req);
        if (!token) {
          ws.close(4001, 'Unauthorized');
          return;
        }

        // 验证token
        const userInfo = await authService.verifyToken(token);
        if (!userInfo) {
          ws.close(4001, 'Invalid token');
          return;
        }

        const { userId, role } = userInfo;
        
        // 保存连接信息
        const connectionInfo = {
          socket: ws,
          userId,
          role,
          connectedAt: new Date(),
          metadata: {}
        };

        this.userConnections.set(userId, connectionInfo);
        
        // 记录连接日志
        logger.info(`用户 ${userId}(${role}) 已连接到WebSocket，当前连接数: ${this.userConnections.size}`);

        // 发送连接成功消息
        this.sendMessage(ws, {
          type: 'connection_established',
          data: {
            userId,
            role,
            timestamp: Date.now()
          }
        });

        // 处理消息
        ws.on('message', (message) => this.handleMessage(userId, message));

        // 处理断开连接
        ws.on('close', () => this.handleDisconnect(userId));

        // 处理错误
        ws.on('error', (error) => {
          logger.error(`WebSocket错误 (${userId}):`, error);
        });

      } catch (error) {
        logger.error('WebSocket连接建立失败:', error);
        ws.close(4000, 'Connection error');
      }
    });

    // 定期清理失效连接
    setInterval(() => this.cleanupConnections(), 30000);
  }

  /**
   * 从请求中提取token
   */
  extractTokenFromRequest(req) {
    // 从查询参数或headers中提取token
    const queryToken = new URLSearchParams(req.url.split('?')[1]).get('token');
    if (queryToken) return queryToken;

    const headerToken = req.headers['sec-websocket-protocol'];
    if (headerToken) return headerToken.split(',')[0].trim();

    return null;
  }

  /**
   * 处理收到的消息
   */
  async handleMessage(userId, message) {
    try {
      const parsedMessage = JSON.parse(message);
      const { type, data, sessionId } = parsedMessage;
      
      logger.debug(`收到来自 ${userId} 的消息:`, type);

      // 更新连接信息
      const connectionInfo = this.userConnections.get(userId);
      if (connectionInfo && sessionId) {
        connectionInfo.sessionId = sessionId;
        this.userConnections.set(userId, connectionInfo);
      }

      // 处理不同类型的消息
      switch (type) {
        case 'ping':
          this.send(userId, {
            type: 'pong',
            timestamp: Date.now()
          });
          break;
        
        case 'typing':
          await this.handleTypingStatus(userId, data);
          break;
        
        case 'join_room':
          await this.handleJoinRoom(userId, data);
          break;
        
        case 'leave_room':
          await this.handleLeaveRoom(userId, data);
          break;
        
        default:
          // 转发给相应的处理器
          this.emitEvent('message', { userId, type, data, sessionId });
      }
    } catch (error) {
      logger.error(`处理消息失败 (${userId}):`, error);
      this.send(userId, {
        type: 'error',
        data: { message: '处理消息失败' }
      });
    }
  }

  /**
   * 处理断开连接
   */
  handleDisconnect(userId) {
    const connectionInfo = this.userConnections.get(userId);
    if (connectionInfo) {
      logger.info(`用户 ${userId}(${connectionInfo.role}) 已断开WebSocket连接，当前连接数: ${this.userConnections.size - 1}`);
      this.userConnections.delete(userId);
      
      // 通知系统用户离线
      this.emitEvent('user_disconnected', { userId, role: connectionInfo.role });
    }
  }

  /**
   * 发送消息给指定用户
   */
  send(userId, message) {
    const connectionInfo = this.userConnections.get(userId);
    if (connectionInfo && connectionInfo.socket.readyState === WebSocket.OPEN) {
      try {
        this.sendMessage(connectionInfo.socket, message);
        return true;
      } catch (error) {
        logger.error(`发送消息失败 (${userId}):`, error);
        this.handleDisconnect(userId);
        return false;
      }
    }
    return false;
  }

  /**
   * 向socket发送消息
   */
  sendMessage(socket, message) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        ...message,
        timestamp: message.timestamp || Date.now()
      }));
    }
  }

  /**
   * 广播消息给所有在线用户
   */
  broadcast(message, filter = null) {
    let count = 0;
    this.userConnections.forEach((connectionInfo, userId) => {
      if (!filter || filter(connectionInfo)) {
        if (this.send(userId, message)) {
          count++;
        }
      }
    });
    logger.debug(`广播消息发送给 ${count} 个用户`);
    return count;
  }

  /**
   * 发送消息给多个用户
   */
  sendToUsers(userIds, message) {
    let count = 0;
    userIds.forEach(userId => {
      if (this.send(userId, message)) {
        count++;
      }
    });
    return count;
  }

  /**
   * 处理输入状态
   */
  async handleTypingStatus(userId, data) {
    try {
      const { sessionId, isTyping } = data;
      
      // 获取会话信息（通过事件系统）
      const sessionInfo = await this.emitEventAsync('get_session_info', { sessionId });
      
      if (!sessionInfo) return;
      
      // 确定要发送给谁
      let targetIds = [];
      if (sessionInfo.type === 'private') {
        // 私聊，发送给对方
        targetIds = [sessionInfo.userId === userId ? sessionInfo.otherUserId : sessionInfo.userId];
      } else if (sessionInfo.type === 'group') {
        // 群聊，发送给群里其他人
        targetIds = sessionInfo.participants.filter(id => id !== userId);
      }
      
      // 发送输入状态
      this.sendToUsers(targetIds, {
        type: 'typing_status',
        data: {
          sessionId,
          userId,
          isTyping
        }
      });
    } catch (error) {
      logger.error('处理输入状态失败:', error);
    }
  }

  /**
   * 处理加入房间
   */
  async handleJoinRoom(userId, data) {
    try {
      const { roomId } = data;
      
      // 这里可以实现房间管理逻辑
      await this.emitEventAsync('join_room', { userId, roomId });
      
      // 通知房间内其他人
      this.broadcast(
        {
          type: 'user_joined',
          data: { userId, roomId }
        },
        conn => conn.roomId === roomId && conn.userId !== userId
      );
    } catch (error) {
      logger.error('处理加入房间失败:', error);
    }
  }

  /**
   * 处理离开房间
   */
  async handleLeaveRoom(userId, data) {
    try {
      const { roomId } = data;
      
      // 这里可以实现房间管理逻辑
      await this.emitEventAsync('leave_room', { userId, roomId });
      
      // 通知房间内其他人
      this.broadcast(
        {
          type: 'user_left',
          data: { userId, roomId }
        },
        conn => conn.roomId === roomId && conn.userId !== userId
      );
    } catch (error) {
      logger.error('处理离开房间失败:', error);
    }
  }

  /**
   * 检查用户是否在线
   */
  isUserOnline(userId) {
    return this.userConnections.has(userId);
  }

  /**
   * 获取在线用户数量
   */
  getOnlineCount() {
    return this.userConnections.size;
  }

  /**
   * 获取指定角色的在线用户
   */
  getOnlineUsersByRole(role) {
    const users = [];
    this.userConnections.forEach((connectionInfo, userId) => {
      if (connectionInfo.role === role) {
        users.push(userId);
      }
    });
    return users;
  }

  /**
   * 清理失效连接
   */
  cleanupConnections() {
    const now = Date.now();
    let cleanedCount = 0;
    
    this.userConnections.forEach((connectionInfo, userId) => {
      // 检查连接是否仍处于OPEN状态
      if (connectionInfo.socket.readyState !== WebSocket.OPEN) {
        this.userConnections.delete(userId);
        cleanedCount++;
      }
    });
    
    if (cleanedCount > 0) {
      logger.info(`清理了 ${cleanedCount} 个失效的WebSocket连接`);
    }
  }

  /**
   * 强制断开用户连接
   */
  disconnectUser(userId, reason = 'Server disconnected') {
    const connectionInfo = this.userConnections.get(userId);
    if (connectionInfo) {
      try {
        connectionInfo.socket.close(1000, reason);
        this.handleDisconnect(userId);
        return true;
      } catch (error) {
        logger.error(`断开用户连接失败 (${userId}):`, error);
        return false;
      }
    }
    return false;
  }

  // 事件系统
  on(event, handler) {
    if (!this.eventHandlers) {
      this.eventHandlers = {};
    }
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }
    this.eventHandlers[event].push(handler);
  }

  off(event, handler) {
    if (this.eventHandlers && this.eventHandlers[event]) {
      this.eventHandlers[event] = this.eventHandlers[event].filter(h => h !== handler);
    }
  }

  emitEvent(event, data) {
    if (this.eventHandlers && this.eventHandlers[event]) {
      this.eventHandlers[event].forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          logger.error(`事件处理失败 (${event}):`, error);
        }
      });
    }
  }

  async emitEventAsync(event, data) {
    if (this.eventHandlers && this.eventHandlers[event]) {
      const results = await Promise.all(
        this.eventHandlers[event].map(async handler => {
          try {
            return await handler(data);
          } catch (error) {
            logger.error(`异步事件处理失败 (${event}):`, error);
            return null;
          }
        })
      );
      return results.find(result => result !== null);
    }
    return null;
  }

  /**
   * 启动WebSocket服务
   */
  static start(httpServer) {
    if (!this.instance) {
      this.instance = new WebSocketService(httpServer);
      logger.info('WebSocket服务已启动');
    }
    return this.instance;
  }

  /**
   * 获取WebSocket服务实例
   */
  static getInstance() {
    if (!this.instance) {
      throw new Error('WebSocket服务尚未启动');
    }
    return this.instance;
  }
}

module.exports = WebSocketService;