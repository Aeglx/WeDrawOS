const { validationResult } = require('express-validator');
const db = require('../models/index.js');
const {
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    ConflictError,
    InternalServerError
  } = require('../utils/errors.js');

const { Conversation, Message, User, ConversationAssignment, Tag } = db.models;

/**
 * 会话控制器
 * 处理会话相关的业务逻辑
 */
class ConversationController {
  /**
   * 创建新会话
   */
  static async createConversation(req, res, next) {
    try {
      // 验证请求数据
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new BadRequestError('请求数据验证失败', errors.array());
      }

      const { 
        title, 
        type = 'customer_service', 
        initialQuestion,
        source = 'web',
        customerInfo = {},
        participants = []
      } = req.body;

      // 获取当前用户ID
      const currentUserId = req.user.userId;

      // 添加当前用户为参与者
      if (!participants.includes(currentUserId)) {
        participants.push(currentUserId);
      }

      // 创建会话
      const conversation = await Conversation.createConversation({
        title,
        type,
        initialQuestion,
        source,
        customerInfo,
        participants
      });

      // 记录创建日志
      await db.models.WorkLog.logSessionStart({
        userId: currentUserId,
        conversationId: conversation.id,
        details: { type, source }
      });

      res.status(201).json({
        success: true,
        message: '会话创建成功',
        data: { conversation: conversation.toResponseObject(true) }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取会话列表
   */
  static async getConversations(req, res, next) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        status, 
        type, 
        priority,
        search,
        source,
        sortBy = 'lastMessageAt',
        sortOrder = 'desc',
        includeClosed = false
      } = req.query;

      // 获取当前用户ID和角色
      const currentUserId = req.user.userId;
      const currentUserRole = req.user.role;

      // 构建基础查询条件
      const where = {};
      
      if (status) {
        where.status = status;
      }
      
      if (type) {
        where.type = type;
      }
      
      if (priority) {
        where.priority = priority;
      }
      
      if (source) {
        where.source = source;
      }
      
      if (!includeClosed && !status) {
        where.status = { [db.Sequelize.Op.ne]: 'closed' };
      }
      
      if (search) {
        where[db.Sequelize.Op.or] = [
          { title: { [db.Sequelize.Op.iLike]: `%${search}%` } },
          { subject: { [db.Sequelize.Op.iLike]: `%${search}%` } },
          { initialQuestion: { [db.Sequelize.Op.iLike]: `%${search}%` } }
        ];
      }

      // 计算偏移量
      const offset = (page - 1) * limit;

      // 排序配置
      const order = [[sortBy, sortOrder]];

      // 包含关联数据
      const include = [
        { model: User, as: 'participants', attributes: ['id', 'username', 'firstName', 'lastName', 'avatar', 'role'] },
        { model: Message, as: 'lastMessage', attributes: ['id', 'content', 'type', 'createdAt', 'senderId'] },
        { model: Tag, as: 'tags', attributes: ['id', 'name', 'color'] }
      ];

      // 根据用户角色构建查询
      let query = {};
      
      if (currentUserRole === 'admin' || currentUserRole === 'supervisor') {
        // 管理员和主管可以查看所有会话
        query = {
          where,
          include,
          offset,
          limit: parseInt(limit),
          order
        };
      } else if (currentUserRole === 'agent') {
        // 客服只能查看分配给他们的会话和他们参与的会话
        const assignedConversations = await ConversationAssignment.findAll({
          where: { assigneeId: currentUserId, status: 'active' },
          attributes: ['conversationId']
        });
        
        const conversationIds = assignedConversations.map(assignment => assignment.conversationId);
        
        // 使用关联查询获取用户参与的会话
        query = {
          include: [
            ...include,
            {
              model: User,
              as: 'participants',
              where: { id: currentUserId }
            }
          ],
          where: {
            [db.Sequelize.Op.or]: [
              { id: { [db.Sequelize.Op.in]: conversationIds } },
              // 其他条件通过参与者关联隐式过滤
            ],
            ...where
          },
          offset,
          limit: parseInt(limit),
          order
        };
      } else {
        // 普通用户只能查看自己参与的会话
        query = {
          include: [
            ...include,
            {
              model: User,
              as: 'participants',
              where: { id: currentUserId }
            }
          ],
          where,
          offset,
          limit: parseInt(limit),
          order
        };
      }

      // 查询会话
      const { count, rows } = await Conversation.findAndCountAll(query);

      // 获取每个会话的未读消息数
      const conversationsWithUnread = await Promise.all(
        rows.map(async (conversation) => {
          const unreadCount = await Message.getUnreadCount(conversation.id, currentUserId);
          const response = conversation.toResponseObject(true);
          return { ...response, unreadCount };
        })
      );

      res.status(200).json({
        success: true,
        data: {
          conversations: conversationsWithUnread,
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
   * 获取会话详情
   */
  static async getConversationById(req, res, next) {
    try {
      const { conversationId } = req.params;
      const currentUserId = req.user.userId;
      const currentUserRole = req.user.role;

      // 查找会话
      const conversation = await Conversation.findByPk(conversationId, {
        include: [
          { model: User, as: 'participants', attributes: ['id', 'username', 'firstName', 'lastName', 'avatar', 'role'] },
          { model: Message, as: 'lastMessage', attributes: ['id', 'content', 'type', 'createdAt', 'senderId'] },
          { model: Tag, as: 'tags', attributes: ['id', 'name', 'color'] },
          { 
            model: ConversationAssignment, 
            as: 'assignments',
            where: { status: 'active' },
            required: false,
            include: [{ model: User, as: 'assignee', attributes: ['id', 'username', 'firstName', 'lastName', 'avatar'] }]
          }
        ]
      });

      if (!conversation) {
        throw new NotFoundError('会话不存在');
      }

      // 检查权限：管理员和主管可以查看所有会话，其他用户只能查看自己参与的会话
      const isParticipant = conversation.participants.some(p => p.id === currentUserId);
      const isAssigned = conversation.assignments.some(a => a.assigneeId === currentUserId);
      
      if (currentUserRole !== 'admin' && currentUserRole !== 'supervisor' && !isParticipant && !isAssigned) {
        throw new ForbiddenError('无权查看此会话');
      }

      // 获取未读消息数
      const unreadCount = await Message.getUnreadCount(conversationId, currentUserId);
      
      // 标记所有消息为已读
      await Message.markConversationMessagesAsRead(conversationId, currentUserId);

      // 获取当前分配的客服
      const currentAssignee = await conversation.getCurrentAssignee();

      res.status(200).json({
        success: true,
        data: {
          conversation: {
            ...conversation.toResponseObject(true),
            unreadCount,
            currentAssignee: currentAssignee ? currentAssignee.toSafeObject() : null
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 更新会话
   */
  static async updateConversation(req, res, next) {
    try {
      // 验证请求数据
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new BadRequestError('请求数据验证失败', errors.array());
      }

      const { conversationId } = req.params;
      const { 
        title, 
        subject, 
        status, 
        priority,
        category,
        subcategory,
        notes,
        requiresFollowUp,
        followUpBy,
        expectedResolutionTime
      } = req.body;
      
      const currentUserId = req.user.userId;

      // 查找会话
      const conversation = await Conversation.findByPk(conversationId, {
        include: [{ model: User, as: 'participants' }]
      });

      if (!conversation) {
        throw new NotFoundError('会话不存在');
      }

      // 检查权限
      const isParticipant = conversation.participants.some(p => p.id === currentUserId);
      if (!isParticipant && req.user.role !== 'admin' && req.user.role !== 'supervisor') {
        throw new ForbiddenError('无权修改此会话');
      }

      // 构建更新数据
      const updateData = {};
      if (title !== undefined) updateData.title = title;
      if (subject !== undefined) updateData.subject = subject;
      if (category !== undefined) updateData.category = category;
      if (subcategory !== undefined) updateData.subcategory = subcategory;
      if (notes !== undefined) updateData.notes = notes;
      if (requiresFollowUp !== undefined) updateData.requiresFollowUp = requiresFollowUp;
      if (followUpBy !== undefined) updateData.followUpBy = followUpBy;
      if (expectedResolutionTime !== undefined) updateData.expectedResolutionTime = expectedResolutionTime;
      
      // 只有管理员、主管和客服可以更新状态和优先级
      const canUpdateStatus = req.user.role === 'admin' || req.user.role === 'supervisor' || req.user.role === 'agent';
      if (status !== undefined && canUpdateStatus) {
        updateData.status = status;
      }
      if (priority !== undefined && canUpdateStatus) {
        updateData.priority = priority;
      }

      // 更新会话
      await conversation.update(updateData);

      // 记录更新日志
      await db.models.WorkLog.logConversationUpdate({
        userId: currentUserId,
        conversationId: conversation.id,
        changes: updateData
      });

      res.status(200).json({
        success: true,
        message: '会话更新成功',
        data: { conversation: conversation.toResponseObject(true) }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 关闭会话
   */
  static async closeConversation(req, res, next) {
    try {
      const { conversationId } = req.params;
      const { reason, solution, satisfactionScore } = req.body;
      const currentUserId = req.user.userId;

      // 查找会话
      const conversation = await Conversation.findByPk(conversationId, {
        include: [{ model: User, as: 'participants' }]
      });

      if (!conversation) {
        throw new NotFoundError('会话不存在');
      }

      // 检查权限
      const isParticipant = conversation.participants.some(p => p.id === currentUserId);
      if (!isParticipant && req.user.role !== 'admin' && req.user.role !== 'supervisor') {
        throw new ForbiddenError('无权关闭此会话');
      }

      // 检查会话状态
      if (conversation.status === 'closed') {
        throw new ConflictError('会话已经关闭');
      }

      // 关闭会话
      await conversation.close({
        reason: reason || '已解决',
        solution,
        closedBy: currentUserId,
        satisfactionScore
      });

      // 记录关闭日志
      await db.models.WorkLog.logSessionEnd({
        userId: currentUserId,
        conversationId: conversation.id,
        reason: reason || '已解决',
        satisfactionScore
      });

      res.status(200).json({
        success: true,
        message: '会话已关闭',
        data: { conversation: conversation.toResponseObject(true) }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 重新打开会话
   */
  static async reopenConversation(req, res, next) {
    try {
      const { conversationId } = req.params;
      const { reason } = req.body;
      const currentUserId = req.user.userId;

      // 查找会话
      const conversation = await Conversation.findByPk(conversationId, {
        include: [{ model: User, as: 'participants' }]
      });

      if (!conversation) {
        throw new NotFoundError('会话不存在');
      }

      // 检查权限
      const isParticipant = conversation.participants.some(p => p.id === currentUserId);
      if (!isParticipant && req.user.role !== 'admin' && req.user.role !== 'supervisor') {
        throw new ForbiddenError('无权重新打开此会话');
      }

      // 检查会话状态
      if (conversation.status !== 'closed') {
        throw new ConflictError('会话未关闭');
      }

      // 重新打开会话
      await conversation.reopen(currentUserId, reason || '需要进一步处理');

      // 记录重新打开日志
      await db.models.WorkLog.logSessionReopen({
        userId: currentUserId,
        conversationId: conversation.id,
        reason: reason || '需要进一步处理'
      });

      res.status(200).json({
        success: true,
        message: '会话已重新打开',
        data: { conversation: conversation.toResponseObject(true) }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 分配会话给客服
   */
  static async assignConversation(req, res, next) {
    try {
      const { conversationId } = req.params;
      const { assigneeId, reason } = req.body;
      const currentUserId = req.user.userId;

      // 检查权限：只有管理员、主管和客服可以分配会话
      if (req.user.role !== 'admin' && req.user.role !== 'supervisor' && req.user.role !== 'agent') {
        throw new ForbiddenError('无权分配会话');
      }

      // 查找会话
      const conversation = await Conversation.findByPk(conversationId);
      if (!conversation) {
        throw new NotFoundError('会话不存在');
      }

      // 查找被分配的客服
      const assignee = await User.findByPk(assigneeId);
      if (!assignee) {
        throw new NotFoundError('客服不存在');
      }

      // 检查客服角色
      if (!['agent', 'supervisor', 'admin'].includes(assignee.role)) {
        throw new BadRequestError('只能分配给客服角色的用户');
      }

      // 分配会话
      const assignment = await conversation.assignTo(assigneeId, currentUserId, reason || '手动分配');

      // 记录分配日志
      await db.models.WorkLog.logConversationAssignment({
        userId: currentUserId,
        conversationId: conversation.id,
        assigneeId,
        reason: reason || '手动分配'
      });

      res.status(200).json({
        success: true,
        message: '会话分配成功',
        data: {
          conversation: conversation.toResponseObject(true),
          assignment: assignment.toResponseObject()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取会话消息列表
   */
  static async getConversationMessages(req, res, next) {
    try {
      const { conversationId } = req.params;
      const { limit = 50, beforeId } = req.query;
      const currentUserId = req.user.userId;

      // 查找会话
      const conversation = await Conversation.findByPk(conversationId, {
        include: [{ model: User, as: 'participants' }]
      });

      if (!conversation) {
        throw new NotFoundError('会话不存在');
      }

      // 检查权限
      const isParticipant = conversation.participants.some(p => p.id === currentUserId);
      if (!isParticipant && req.user.role !== 'admin' && req.user.role !== 'supervisor') {
        throw new ForbiddenError('无权查看此会话消息');
      }

      // 获取消息列表
      const messages = await Message.getRecentMessages(conversationId, parseInt(limit), beforeId);

      res.status(200).json({
        success: true,
        data: {
          messages: messages.map(message => message.toResponseObject()),
          hasMore: messages.length === parseInt(limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }

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

      const { conversationId } = req.params;
      const { 
        content, 
        type = 'text', 
        mediaUrl, 
        mediaFilename,
        mediaSize,
        mediaType,
        parentMessageId,
        quotedMessageId,
        priority = 'medium'
      } = req.body;
      const currentUserId = req.user.userId;

      // 查找会话
      const conversation = await Conversation.findByPk(conversationId, {
        include: [{ model: User, as: 'participants' }]
      });

      if (!conversation) {
        throw new NotFoundError('会话不存在');
      }

      // 检查权限
      const isParticipant = conversation.participants.some(p => p.id === currentUserId);
      if (!isParticipant && req.user.role !== 'admin' && req.user.role !== 'supervisor') {
        throw new ForbiddenError('无权在此会话中发送消息');
      }

      // 检查会话状态
      if (conversation.status === 'closed') {
        throw new ForbiddenError('无法在已关闭的会话中发送消息');
      }

      // 创建消息
      const message = await Message.create({
        conversationId,
        senderId: currentUserId,
        type,
        content,
        mediaUrl,
        mediaFilename,
        mediaSize,
        mediaType,
        parentMessageId,
        quotedMessageId,
        status: 'sent',
        priority,
        source: 'web', // 可以根据请求来源设置
        metadata: {
          senderName: req.user.username || '用户',
          senderRole: req.user.role
        }
      });

      // 更新会话响应统计
      const now = new Date();
      const lastMessageAt = conversation.lastMessageAt || conversation.createdAt;
      const responseTime = Math.floor((now - lastMessageAt) / 1000);
      
      if (req.user.role === 'agent' || req.user.role === 'supervisor' || req.user.role === 'admin') {
        await conversation.updateResponseStats(responseTime);
      }

      // 记录发送消息日志
      await db.models.WorkLog.logMessageSent({
        userId: currentUserId,
        conversationId: conversation.id,
        messageId: message.id,
        messageType: type
      });

      res.status(201).json({
        success: true,
        message: '消息发送成功',
        data: { message: message.toResponseObject() }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 标记会话消息为已读
   */
  static async markMessagesAsRead(req, res, next) {
    try {
      const { conversationId } = req.params;
      const currentUserId = req.user.userId;

      // 查找会话
      const conversation = await Conversation.findByPk(conversationId, {
        include: [{ model: User, as: 'participants' }]
      });

      if (!conversation) {
        throw new NotFoundError('会话不存在');
      }

      // 检查权限
      const isParticipant = conversation.participants.some(p => p.id === currentUserId);
      if (!isParticipant && req.user.role !== 'admin' && req.user.role !== 'supervisor') {
        throw new ForbiddenError('无权操作此会话');
      }

      // 标记所有消息为已读
      const markedCount = await Message.markConversationMessagesAsRead(conversationId, currentUserId);

      res.status(200).json({
        success: true,
        message: `已标记 ${markedCount} 条消息为已读`,
        data: { markedCount }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 为会话添加标签
   */
  static async addTagsToConversation(req, res, next) {
    try {
      const { conversationId } = req.params;
      const { tagIds } = req.body;
      const currentUserId = req.user.userId;

      // 查找会话
      const conversation = await Conversation.findByPk(conversationId, {
        include: [{ model: User, as: 'participants' }]
      });

      if (!conversation) {
        throw new NotFoundError('会话不存在');
      }

      // 检查权限：只有客服、主管和管理员可以添加标签
      const isParticipant = conversation.participants.some(p => p.id === currentUserId);
      if (!isParticipant && req.user.role !== 'admin' && req.user.role !== 'supervisor') {
        throw new ForbiddenError('无权为此会话添加标签');
      }

      // 添加标签
      await conversation.addTags(tagIds);

      // 记录添加标签日志
      await db.models.WorkLog.logConversationTagAdded({
        userId: currentUserId,
        conversationId: conversation.id,
        tagIds
      });

      // 重新获取会话数据（包含更新的标签）
      const updatedConversation = await Conversation.findByPk(conversationId, {
        include: [{ model: Tag, as: 'tags' }]
      });

      res.status(200).json({
        success: true,
        message: '标签添加成功',
        data: { 
          conversation: updatedConversation.toResponseObject(true),
          tags: updatedConversation.tags.map(tag => tag.toResponseObject())
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 从会话中移除标签
   */
  static async removeTagsFromConversation(req, res, next) {
    try {
      const { conversationId } = req.params;
      const { tagIds } = req.body;
      const currentUserId = req.user.userId;

      // 查找会话
      const conversation = await Conversation.findByPk(conversationId, {
        include: [{ model: User, as: 'participants' }]
      });

      if (!conversation) {
        throw new NotFoundError('会话不存在');
      }

      // 检查权限：只有客服、主管和管理员可以移除标签
      const isParticipant = conversation.participants.some(p => p.id === currentUserId);
      if (!isParticipant && req.user.role !== 'admin' && req.user.role !== 'supervisor') {
        throw new ForbiddenError('无权为此会话移除标签');
      }

      // 移除标签
      await conversation.removeTags(tagIds);

      // 记录移除标签日志
      await db.models.WorkLog.logConversationTagRemoved({
        userId: currentUserId,
        conversationId: conversation.id,
        tagIds
      });

      // 重新获取会话数据（包含更新的标签）
      const updatedConversation = await Conversation.findByPk(conversationId, {
        include: [{ model: Tag, as: 'tags' }]
      });

      res.status(200).json({
        success: true,
        message: '标签移除成功',
        data: { 
          conversation: updatedConversation.toResponseObject(true),
          tags: updatedConversation.tags.map(tag => tag.toResponseObject())
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = ConversationController;