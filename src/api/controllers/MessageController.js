const { validationResult } = require('express-validator');
const db = require('../models/index.js');
const {
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    InternalServerError
  } = require('../utils/errors.js');

const { Message, Conversation, User, Tag, Notification, AutoReplyLog } = db.models;

/**
 * 消息控制器
 * 处理客服系统中的消息相关业务逻辑
 */
class MessageController {
  /**
   * 发送消息
   */
  static async sendMessage(req, res, next) {
    try {
      // 验证请求数据
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new BadRequestError('请求数据验证失败', errors.array());
      }

      const { conversationId, content, type = 'text', metadata } = req.body;
      const currentUserId = req.user.userId;

      // 查找会话
      const conversation = await Conversation.findByPk(conversationId);
      if (!conversation) {
        throw new NotFoundError('会话不存在');
      }

      // 检查用户是否有权限发送消息到此会话
      const hasPermission = await conversation.hasParticipant(currentUserId) || 
                           await conversation.isAssignedTo(currentUserId);
      
      if (!hasPermission) {
        throw new ForbiddenError('无权向此会话发送消息');
      }

      // 检查会话状态
      if (conversation.status === 'closed' && !['admin', 'supervisor'].includes(req.user.role)) {
        throw new BadRequestError('无法向已关闭的会话发送消息');
      }

      // 开始事务
      const transaction = await db.sequelize.transaction();
      
      try {
        // 创建消息
        const message = await Message.create({
          conversationId,
          senderId: currentUserId,
          content,
          type,
          metadata,
          status: 'sent'
        }, { transaction });

        // 更新会话状态
        await conversation.update({
          lastMessageAt: new Date(),
          lastMessageSenderId: currentUserId,
          unreadCount: conversation.unreadCount + 1
        }, { transaction });

        // 创建或更新分配记录
        const assigneeId = conversation.assignedTo;
        if (assigneeId && assigneeId !== currentUserId) {
          // 为客服创建新通知
          await Notification.create({
            userId: assigneeId,
            conversationId,
            type: 'new_message',
            title: '新消息',
            message: `您有一条来自会话 ${conversation.id} 的新消息`,
            metadata: { messageId: message.id, senderId: currentUserId }
          }, { transaction });

          // 记录工作日志
          await db.models.WorkLog.logMessageReceived({
            userId: assigneeId,
            conversationId,
            messageId: message.id,
            transaction
          });
        }

        // 提交事务
        await transaction.commit();

        // 如果是用户（非客服）发送的消息，检查是否需要自动回复
        if (req.user.role === 'user') {
          // 异步触发自动回复检查，不阻塞主流程
          setTimeout(async () => {
            try {
              // 检查是否已有客服回复或最近的自动回复
              const recentMessages = await Message.findAll({
                where: { conversationId },
                order: [['createdAt', 'desc']],
                limit: 2
              });

              // 如果最近只有一条消息（就是刚发送的这条），则触发自动回复
              if (recentMessages.length <= 1) {
                // 这里可以调用AutoReplyController的processAutoReply方法
                // 或者直接调用模型层方法
                await Message.checkAndApplyAutoReply(conversationId, content);
              }
            } catch (error) {
              console.error('自动回复处理失败:', error);
              // 记录错误日志但不影响主流程
            }
          }, 100);
        }

        // 记录发送日志
        await db.models.WorkLog.logMessageSent({
          userId: currentUserId,
          conversationId,
          messageId: message.id,
          messageType: type
        });

        // 返回完整的消息信息
        const fullMessage = await Message.findByPk(message.id, {
          include: [
            { model: User, as: 'sender', attributes: ['id', 'username', 'firstName', 'lastName', 'avatar'] },
            { model: Tag, as: 'tags' }
          ]
        });

        res.status(201).json({
          success: true,
          message: '消息发送成功',
          data: { message: fullMessage.toResponseObject() }
        });
      } catch (error) {
        // 回滚事务
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取会话的消息列表
   */
  static async getConversationMessages(req, res, next) {
    try {
      const { conversationId } = req.params;
      const {
        page = 1,
        limit = 50,
        before,
        after,
        includeSystem = true
      } = req.query;
      const currentUserId = req.user.userId;

      // 查找会话
      const conversation = await Conversation.findByPk(conversationId);
      if (!conversation) {
        throw new NotFoundError('会话不存在');
      }

      // 检查用户是否有权限查看此会话的消息
      const hasPermission = await conversation.hasParticipant(currentUserId) || 
                           await conversation.isAssignedTo(currentUserId) ||
                           ['admin', 'supervisor'].includes(req.user.role);
      
      if (!hasPermission) {
        throw new ForbiddenError('无权查看此会话的消息');
      }

      // 构建查询条件
      const where = { conversationId };
      
      // 消息类型过滤
      if (!includeSystem) {
        where.type = { [db.Sequelize.Op.not]: 'system' };
      }
      
      // 时间过滤
      if (before) {
        where.createdAt = { [db.Sequelize.Op.lt]: new Date(before) };
      } else if (after) {
        where.createdAt = { [db.Sequelize.Op.gt]: new Date(after) };
      }

      // 计算偏移量
      const offset = before || after ? 0 : (page - 1) * limit;

      // 排序配置
      const order = [[before ? 'createdAt' : 'createdAt', before ? 'desc' : 'desc']];

      // 查询消息
      const { count, rows } = await Message.findAndCountAll({
        where,
        offset,
        limit: parseInt(limit),
        order,
        include: [
          { model: User, as: 'sender', attributes: ['id', 'username', 'firstName', 'lastName', 'avatar'] },
          { model: Tag, as: 'tags' }
        ]
      });

      // 标记消息为已读（如果用户是客服且是会话的当前负责人）
      if (req.user.role !== 'user' && conversation.assignedTo === currentUserId) {
        // 获取消息ID列表
        const messageIds = rows.map(msg => msg.id);
        
        // 如果有消息，更新为已读
        if (messageIds.length > 0) {
          await Message.update(
            { status: 'read' },
            { where: { id: messageIds, status: 'sent', senderId: { [db.Sequelize.Op.ne]: currentUserId } } }
          );
          
          // 更新会话的未读计数
          await conversation.updateUnreadCount();
        }
      }

      // 重新获取更新后的消息
      const updatedMessages = await Message.findAll({
        where: { id: rows.map(msg => msg.id) },
        include: [
          { model: User, as: 'sender', attributes: ['id', 'username', 'firstName', 'lastName', 'avatar'] },
          { model: Tag, as: 'tags' }
        ]
      });

      // 按时间排序
      updatedMessages.sort((a, b) => a.createdAt - b.createdAt);

      res.status(200).json({
        success: true,
        data: {
          messages: updatedMessages.map(msg => msg.toResponseObject()),
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(count / limit),
            hasMore: rows.length === parseInt(limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取单个消息详情
   */
  static async getMessageById(req, res, next) {
    try {
      const { messageId } = req.params;
      const currentUserId = req.user.userId;

      // 查找消息
      const message = await Message.findByPk(messageId, {
        include: [
          { model: User, as: 'sender', attributes: ['id', 'username', 'firstName', 'lastName', 'avatar'] },
          { model: Tag, as: 'tags' },
          { model: Conversation, attributes: ['id', 'status', 'assignedTo'] }
        ]
      });

      if (!message) {
        throw new NotFoundError('消息不存在');
      }

      // 检查用户是否有权限查看此消息
      const conversation = message.Conversation;
      const hasPermission = await conversation.hasParticipant(currentUserId) || 
                           await conversation.isAssignedTo(currentUserId) ||
                           ['admin', 'supervisor'].includes(req.user.role);
      
      if (!hasPermission) {
        throw new ForbiddenError('无权查看此消息');
      }

      // 如果是客服且是会话负责人，标记为已读
      if (req.user.role !== 'user' && conversation.assignedTo === currentUserId) {
        await message.update({ status: 'read' });
        await conversation.updateUnreadCount();
      }

      res.status(200).json({
        success: true,
        data: { message: message.toResponseObject() }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 更新消息
   */
  static async updateMessage(req, res, next) {
    try {
      // 验证请求数据
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new BadRequestError('请求数据验证失败', errors.array());
      }

      const { messageId } = req.params;
      const { content, metadata } = req.body;
      const currentUserId = req.user.userId;

      // 查找消息
      const message = await Message.findByPk(messageId, {
        include: [{ model: Conversation }]
      });

      if (!message) {
        throw new NotFoundError('消息不存在');
      }

      // 检查权限：只有消息发送者或管理员可以更新消息
      if (message.senderId !== currentUserId && req.user.role !== 'admin') {
        throw new ForbiddenError('无权更新此消息');
      }

      // 检查消息类型：系统消息无法更新
      if (message.type === 'system') {
        throw new BadRequestError('系统消息无法更新');
      }

      // 构建更新数据
      const updateData = {};
      if (content !== undefined) updateData.content = content;
      if (metadata !== undefined) updateData.metadata = metadata;
      updateData.updatedAt = new Date();

      // 更新消息
      await message.update(updateData);

      // 记录更新日志
      await db.models.WorkLog.logMessageUpdated({
        userId: currentUserId,
        messageId: message.id,
        conversationId: message.conversationId,
        changes: updateData
      });

      // 返回更新后的消息
      const updatedMessage = await Message.findByPk(messageId, {
        include: [
          { model: User, as: 'sender', attributes: ['id', 'username', 'firstName', 'lastName', 'avatar'] },
          { model: Tag, as: 'tags' }
        ]
      });

      res.status(200).json({
        success: true,
        message: '消息更新成功',
        data: { message: updatedMessage.toResponseObject() }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 删除消息
   */
  static async deleteMessage(req, res, next) {
    try {
      const { messageId } = req.params;
      const currentUserId = req.user.userId;

      // 查找消息
      const message = await Message.findByPk(messageId, {
        include: [{ model: Conversation }]
      });

      if (!message) {
        throw new NotFoundError('消息不存在');
      }

      // 检查权限：只有消息发送者、会话负责人或管理员可以删除消息
      const canDelete = message.senderId === currentUserId || 
                        message.Conversation.assignedTo === currentUserId ||
                        req.user.role === 'admin';
      
      if (!canDelete) {
        throw new ForbiddenError('无权删除此消息');
      }

      // 检查消息类型：系统消息无法删除
      if (message.type === 'system') {
        throw new BadRequestError('系统消息无法删除');
      }

      // 软删除消息
      await message.destroy();

      // 记录删除日志
      await db.models.WorkLog.logMessageDeleted({
        userId: currentUserId,
        messageId: message.id,
        conversationId: message.conversationId,
        messageType: message.type
      });

      res.status(200).json({
        success: true,
        message: '消息删除成功'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 标记消息为已读
   */
  static async markAsRead(req, res, next) {
    try {
      const { messageId } = req.params;
      const currentUserId = req.user.userId;

      // 查找消息
      const message = await Message.findByPk(messageId, {
        include: [{ model: Conversation }]
      });

      if (!message) {
        throw new NotFoundError('消息不存在');
      }

      // 检查权限：只有会话负责人或管理员可以标记已读
      const canMarkAsRead = message.Conversation.assignedTo === currentUserId ||
                           ['admin', 'supervisor'].includes(req.user.role);
      
      if (!canMarkAsRead) {
        throw new ForbiddenError('无权标记此消息为已读');
      }

      // 检查消息状态
      if (message.status === 'read') {
        return res.status(200).json({
          success: true,
          message: '消息已经是已读状态'
        });
      }

      // 标记为已读
      await message.update({ status: 'read' });

      // 更新会话的未读计数
      await message.Conversation.updateUnreadCount();

      res.status(200).json({
        success: true,
        message: '消息已标记为已读',
        data: { message: message.toResponseObject() }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 批量标记消息为已读
   */
  static async batchMarkAsRead(req, res, next) {
    try {
      const { messageIds, conversationId } = req.body;
      const currentUserId = req.user.userId;

      // 验证参数
      if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
        throw new BadRequestError('请提供有效的消息ID列表');
      }

      // 如果指定了会话ID，验证所有消息都属于该会话
      if (conversationId) {
        const messages = await Message.findAll({
          where: { id: messageIds },
          attributes: ['conversationId']
        });

        const allInConversation = messages.every(msg => msg.conversationId === conversationId);
        if (!allInConversation) {
          throw new BadRequestError('部分消息不属于指定会话');
        }
      }

      // 获取消息所属的会话ID
      const messages = await Message.findAll({
        where: { id: messageIds },
        include: [{ model: Conversation }]
      });

      if (messages.length === 0) {
        throw new NotFoundError('未找到指定的消息');
      }

      // 检查权限：确保用户有权限访问所有消息
      for (const message of messages) {
        const canAccess = message.Conversation.assignedTo === currentUserId ||
                          ['admin', 'supervisor'].includes(req.user.role);
        
        if (!canAccess) {
          throw new ForbiddenError(`无权访问消息 ${message.id}`);
        }
      }

      // 批量标记为已读
      const updatedCount = await Message.update(
        { status: 'read' },
        { where: { id: messageIds, status: 'sent' } }
      );

      // 更新所有相关会话的未读计数
      const conversationIds = [...new Set(messages.map(msg => msg.conversationId))];
      for (const id of conversationIds) {
        const conversation = await Conversation.findByPk(id);
        await conversation.updateUnreadCount();
      }

      // 记录操作日志
      await db.models.WorkLog.logMessagesMarkedAsRead({
        userId: currentUserId,
        messageIds,
        conversationIds,
        markedCount: updatedCount[0]
      });

      res.status(200).json({
        success: true,
        message: `成功标记 ${updatedCount[0]} 条消息为已读`,
        data: { markedCount: updatedCount[0] }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 发送系统消息
   */
  static async sendSystemMessage(req, res, next) {
    try {
      // 验证请求数据
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new BadRequestError('请求数据验证失败', errors.array());
      }

      const { conversationId, content, metadata } = req.body;
      const currentUserId = req.user.userId;

      // 检查权限：只有管理员、主管或客服可以发送系统消息
      if (!['admin', 'supervisor', 'agent'].includes(req.user.role)) {
        throw new ForbiddenError('无权发送系统消息');
      }

      // 查找会话
      const conversation = await Conversation.findByPk(conversationId);
      if (!conversation) {
        throw new NotFoundError('会话不存在');
      }

      // 创建系统消息
      const message = await Message.createSystemMessage({
        conversationId,
        content,
        createdBy: currentUserId,
        metadata
      });

      // 更新会话
      await conversation.update({
        lastMessageAt: new Date(),
        lastMessageSenderId: 'system'
      });

      // 记录操作日志
      await db.models.WorkLog.logSystemMessageSent({
        userId: currentUserId,
        conversationId,
        messageId: message.id,
        messageContent: content
      });

      res.status(201).json({
        success: true,
        message: '系统消息发送成功',
        data: { message: message.toResponseObject() }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 搜索消息
   */
  static async searchMessages(req, res, next) {
    try {
      const {
        query,
        conversationId,
        senderId,
        messageType,
        startDate,
        endDate,
        page = 1,
        limit = 20
      } = req.query;
      const currentUserId = req.user.userId;

      // 构建查询条件
      const where = {};
      const conversationWhere = {};

      // 检查权限：普通用户只能搜索自己会话的消息
      if (req.user.role === 'user') {
        conversationWhere.userId = currentUserId;
      }

      // 消息内容搜索
      if (query) {
        where.content = { [db.Sequelize.Op.iLike]: `%${query}%` };
      }
      
      // 会话过滤
      if (conversationId) {
        // 验证用户是否有权限访问该会话
        const conversation = await Conversation.findByPk(conversationId);
        if (!conversation) {
          throw new NotFoundError('会话不存在');
        }

        const hasPermission = await conversation.hasParticipant(currentUserId) ||
                             await conversation.isAssignedTo(currentUserId) ||
                             ['admin', 'supervisor'].includes(req.user.role);
        
        if (!hasPermission) {
          throw new ForbiddenError('无权搜索此会话的消息');
        }

        where.conversationId = conversationId;
      }
      
      // 发送者过滤
      if (senderId) {
        where.senderId = senderId;
      }
      
      // 消息类型过滤
      if (messageType) {
        where.type = messageType;
      }
      
      // 时间范围过滤
      if (startDate) {
        where.createdAt = { ...where.createdAt, [db.Sequelize.Op.gte]: new Date(startDate) };
      }
      
      if (endDate) {
        where.createdAt = { ...where.createdAt, [db.Sequelize.Op.lte]: new Date(endDate) };
      }

      // 计算偏移量
      const offset = (page - 1) * limit;

      // 查询消息
      const { count, rows } = await Message.findAndCountAll({
        where,
        offset,
        limit: parseInt(limit),
        order: [['createdAt', 'desc']],
        include: [
          { model: User, as: 'sender', attributes: ['id', 'username', 'firstName', 'lastName', 'avatar'] },
          { model: Tag, as: 'tags' },
          {
            model: Conversation,
            where: conversationWhere,
            attributes: ['id', 'title', 'status', 'assignedTo']
          }
        ]
      });

      res.status(200).json({
        success: true,
        data: {
          messages: rows.map(msg => {
            const msgObj = msg.toResponseObject();
            // 添加会话信息
            msgObj.conversation = {
              id: msg.Conversation.id,
              title: msg.Conversation.title,
              status: msg.Conversation.status,
              assignedTo: msg.Conversation.assignedTo
            };
            return msgObj;
          }),
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(count / limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取消息统计
   */
  static async getMessageStats(req, res, next) {
    try {
      const {
        conversationId,
        startDate,
        endDate,
        groupBy = 'day'
      } = req.query;
      const currentUserId = req.user.userId;

      // 构建查询条件
      const where = {};

      // 如果指定了会话，验证权限
      if (conversationId) {
        const conversation = await Conversation.findByPk(conversationId);
        if (!conversation) {
          throw new NotFoundError('会话不存在');
        }

        const hasPermission = await conversation.hasParticipant(currentUserId) ||
                             await conversation.isAssignedTo(currentUserId) ||
                             ['admin', 'supervisor'].includes(req.user.role);
        
        if (!hasPermission) {
          throw new ForbiddenError('无权查看此会话的统计信息');
        }

        where.conversationId = conversationId;
      } else if (req.user.role !== 'user') {
        // 客服、主管和管理员可以查看自己负责会话的统计
        if (req.user.role === 'agent') {
          const assignedConversations = await Conversation.findAll({
            where: { assignedTo: currentUserId },
            attributes: ['id']
          });
          where.conversationId = assignedConversations.map(c => c.id);
        }
      } else {
        // 普通用户只能查看自己会话的统计
        const userConversations = await Conversation.findAll({
          where: { userId: currentUserId },
          attributes: ['id']
        });
        where.conversationId = userConversations.map(c => c.id);
      }

      // 时间范围过滤
      if (startDate) {
        where.createdAt = { ...where.createdAt, [db.Sequelize.Op.gte]: new Date(startDate) };
      }
      
      if (endDate) {
        where.createdAt = { ...where.createdAt, [db.Sequelize.Op.lte]: new Date(endDate) };
      }

      // 查询消息统计
      const stats = await Message.getStats(where, groupBy);

      // 获取消息类型分布
      const typeDistribution = await Message.count({
        where,
        group: ['type'],
        attributes: ['type', [db.Sequelize.fn('COUNT', 'id'), 'count']]
      });

      // 获取发送者分布
      const senderDistribution = await Message.count({
        where,
        group: ['senderId'],
        attributes: ['senderId', [db.Sequelize.fn('COUNT', 'id'), 'count']],
        include: [{ model: User, as: 'sender', attributes: ['username', 'firstName', 'lastName'] }]
      });

      res.status(200).json({
        success: true,
        data: {
          stats,
          typeDistribution: typeDistribution.map(item => ({
            type: item.type,
            count: parseInt(item.count)
          })),
          senderDistribution: senderDistribution.map(item => ({
            senderId: item.senderId,
            count: parseInt(item.count),
            sender: item.sender ? {
              username: item.sender.username,
              firstName: item.sender.firstName,
              lastName: item.sender.lastName
            } : null
          })),
          totalMessages: stats.reduce((sum, item) => sum + item.count, 0)
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = MessageController;