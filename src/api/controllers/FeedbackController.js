import { validationResult } from 'express-validator';
import db from '../models/index.js';
import {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  InternalServerError
} from '../utils/errors.js';

const { Feedback, User, Conversation, Message } = db.models;

/**
 * 反馈控制器
 * 处理客服系统中的客户反馈相关业务逻辑
 */
class FeedbackController {
  /**
   * 提交反馈（用户功能）
   */
  static async submitFeedback(req, res, next) {
    try {
      // 验证请求数据
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new BadRequestError('请求数据验证失败', errors.array());
      }

      const { conversationId, rating, feedbackType, comments, metadata } = req.body;
      const currentUserId = req.user.userId;

      // 查找会话
      const conversation = await Conversation.findByPk(conversationId);
      if (!conversation) {
        throw new NotFoundError('会话不存在');
      }

      // 检查权限：只有会话参与者可以提交反馈
      if (conversation.userId !== currentUserId && !['admin', 'supervisor'].includes(req.user.role)) {
        throw new ForbiddenError('无权为此会话提交反馈');
      }

      // 检查是否已经提交过反馈
      const existingFeedback = await Feedback.findOne({
        where: { conversationId }
      });

      if (existingFeedback) {
        throw new ConflictError('此会话已提交过反馈');
      }

      // 验证评分
      if (rating !== undefined && (rating < 1 || rating > 5)) {
        throw new BadRequestError('评分必须在1-5之间');
      }

      // 开始事务
      const transaction = await db.sequelize.transaction();
      
      try {
        // 创建反馈
        const feedback = await Feedback.create({
          conversationId,
          userId: currentUserId,
          agentId: conversation.assignedTo,
          rating,
          feedbackType,
          comments,
          metadata,
          status: 'pending',
          createdAt: new Date()
        }, { transaction });

        // 更新会话标记为已评价
        await conversation.update({
          hasFeedback: true,
          feedbackRating: rating
        }, { transaction });

        // 如果有客服分配，创建通知
        if (conversation.assignedTo) {
          await db.models.Notification.create({
            userId: conversation.assignedTo,
            conversationId,
            type: 'feedback_received',
            title: '收到新反馈',
            message: `您负责的会话收到了${rating || '无评分'}星反馈`,
            metadata: { feedbackId: feedback.id, rating }
          }, { transaction });
        }

        // 提交事务
        await transaction.commit();

        // 记录反馈日志
        await db.models.WorkLog.logFeedbackSubmitted({
          userId: currentUserId,
          feedbackId: feedback.id,
          conversationId,
          rating,
          feedbackType
        });

        res.status(201).json({
          success: true,
          message: '反馈提交成功',
          data: { feedback: feedback.toResponseObject() }
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
   * 获取反馈列表（管理员/主管功能）
   */
  static async getFeedbacks(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        feedbackType,
        minRating,
        maxRating,
        agentId,
        userId,
        conversationId,
        startDate,
        endDate,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      // 检查权限：只有管理员、主管和客服可以查看反馈
      if (!['admin', 'supervisor', 'agent'].includes(req.user.role)) {
        throw new ForbiddenError('无权查看反馈列表');
      }

      // 构建查询条件
      const where = {};
      
      if (status) {
        where.status = status;
      }
      
      if (feedbackType) {
        where.feedbackType = feedbackType;
      }
      
      if (minRating) {
        where.rating = { ...where.rating, [db.Sequelize.Op.gte]: parseInt(minRating) };
      }
      
      if (maxRating) {
        where.rating = { ...where.rating, [db.Sequelize.Op.lte]: parseInt(maxRating) };
      }
      
      if (agentId) {
        where.agentId = agentId;
      }
      
      if (userId) {
        where.userId = userId;
      }
      
      if (conversationId) {
        where.conversationId = conversationId;
      }
      
      if (startDate) {
        where.createdAt = { ...where.createdAt, [db.Sequelize.Op.gte]: new Date(startDate) };
      }
      
      if (endDate) {
        where.createdAt = { ...where.createdAt, [db.Sequelize.Op.lte]: new Date(endDate) };
      }

      // 如果是客服，只能查看自己负责的反馈
      if (req.user.role === 'agent') {
        where.agentId = req.user.userId;
      }

      // 计算偏移量
      const offset = (page - 1) * limit;

      // 排序配置
      const order = [[sortBy, sortOrder]];

      // 查询反馈
      const { count, rows } = await Feedback.findAndCountAll({
        where,
        offset,
        limit: parseInt(limit),
        order,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'firstName', 'lastName', 'email']
          },
          {
            model: User,
            as: 'agent',
            attributes: ['id', 'username', 'firstName', 'lastName', 'email']
          },
          {
            model: Conversation,
            attributes: ['id', 'title', 'status', 'createdAt', 'closedAt']
          }
        ]
      });

      res.status(200).json({
        success: true,
        data: {
          feedbacks: rows.map(feedback => feedback.toResponseObject()),
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
   * 获取单个反馈详情
   */
  static async getFeedbackById(req, res, next) {
    try {
      const { feedbackId } = req.params;
      const currentUserId = req.user.userId;

      // 查找反馈
      const feedback = await Feedback.findByPk(feedbackId, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'firstName', 'lastName', 'email']
          },
          {
            model: User,
            as: 'agent',
            attributes: ['id', 'username', 'firstName', 'lastName', 'email']
          },
          {
            model: Conversation,
            attributes: ['id', 'title', 'status', 'createdAt', 'closedAt']
          }
        ]
      });

      if (!feedback) {
        throw new NotFoundError('反馈不存在');
      }

      // 检查权限：只有管理员、主管、客服本人或提交反馈的用户可以查看
      const hasPermission = req.user.role === 'admin' ||
                           req.user.role === 'supervisor' ||
                           feedback.agentId === currentUserId ||
                           feedback.userId === currentUserId;
      
      if (!hasPermission) {
        throw new ForbiddenError('无权查看此反馈');
      }

      res.status(200).json({
        success: true,
        data: { feedback: feedback.toResponseObject() }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 更新反馈状态（管理员/客服功能）
   */
  static async updateFeedbackStatus(req, res, next) {
    try {
      // 验证请求数据
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new BadRequestError('请求数据验证失败', errors.array());
      }

      const { feedbackId } = req.params;
      const { status, response } = req.body;
      const currentUserId = req.user.userId;

      // 查找反馈
      const feedback = await Feedback.findByPk(feedbackId);
      if (!feedback) {
        throw new NotFoundError('反馈不存在');
      }

      // 检查权限：只有管理员、主管或负责的客服可以更新状态
      const hasPermission = req.user.role === 'admin' ||
                           req.user.role === 'supervisor' ||
                           feedback.agentId === currentUserId;
      
      if (!hasPermission) {
        throw new ForbiddenError('无权更新此反馈状态');
      }

      // 验证状态值
      const validStatuses = ['pending', 'processing', 'resolved', 'dismissed'];
      if (status && !validStatuses.includes(status)) {
        throw new BadRequestError(`无效的状态值，必须是以下之一: ${validStatuses.join(', ')}`);
      }

      // 构建更新数据
      const updateData = {};
      if (status) updateData.status = status;
      if (response) updateData.response = response;
      updateData.resolvedBy = currentUserId;
      updateData.updatedAt = new Date();

      // 如果状态变为已解决，记录解决时间
      if (status === 'resolved') {
        updateData.resolvedAt = new Date();
      }

      // 更新反馈
      await feedback.update(updateData);

      // 记录操作日志
      await db.models.WorkLog.logFeedbackUpdated({
        userId: currentUserId,
        feedbackId: feedback.id,
        conversationId: feedback.conversationId,
        changes: updateData
      });

      // 如果有响应内容，创建系统消息通知用户
      if (response) {
        await Message.createSystemMessage({
          conversationId: feedback.conversationId,
          content: `关于您的反馈，我们的回复是：${response}`,
          createdBy: currentUserId,
          metadata: { feedbackId: feedback.id, action: 'feedback_response' }
        });

        // 创建通知
        await db.models.Notification.create({
          userId: feedback.userId,
          conversationId: feedback.conversationId,
          type: 'feedback_response',
          title: '反馈收到回复',
          message: '您的反馈已收到回复，请查看会话详情',
          metadata: { feedbackId: feedback.id }
        });
      }

      // 重新获取反馈（包含关联数据）
      const updatedFeedback = await Feedback.findByPk(feedbackId, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'firstName', 'lastName', 'email']
          },
          {
            model: User,
            as: 'agent',
            attributes: ['id', 'username', 'firstName', 'lastName', 'email']
          },
          {
            model: Conversation,
            attributes: ['id', 'title', 'status', 'createdAt', 'closedAt']
          }
        ]
      });

      res.status(200).json({
        success: true,
        message: '反馈状态更新成功',
        data: { feedback: updatedFeedback.toResponseObject() }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 回复反馈
   */
  static async respondToFeedback(req, res, next) {
    try {
      // 验证请求数据
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new BadRequestError('请求数据验证失败', errors.array());
      }

      const { feedbackId } = req.params;
      const { response, status = 'resolved' } = req.body;
      const currentUserId = req.user.userId;

      // 查找反馈
      const feedback = await Feedback.findByPk(feedbackId);
      if (!feedback) {
        throw new NotFoundError('反馈不存在');
      }

      // 检查权限：只有管理员、主管或负责的客服可以回复
      const hasPermission = req.user.role === 'admin' ||
                           req.user.role === 'supervisor' ||
                           feedback.agentId === currentUserId;
      
      if (!hasPermission) {
        throw new ForbiddenError('无权回复此反馈');
      }

      // 更新反馈
      await feedback.update({
        response,
        status,
        resolvedBy: currentUserId,
        resolvedAt: status === 'resolved' ? new Date() : feedback.resolvedAt,
        updatedAt: new Date()
      });

      // 记录操作日志
      await db.models.WorkLog.logFeedbackResponded({
        userId: currentUserId,
        feedbackId: feedback.id,
        conversationId: feedback.conversationId,
        responseLength: response.length,
        status
      });

      // 创建系统消息通知用户
      await Message.createSystemMessage({
        conversationId: feedback.conversationId,
        content: `关于您的反馈，我们的回复是：${response}`,
        createdBy: currentUserId,
        metadata: { feedbackId: feedback.id, action: 'feedback_response' }
      });

      // 创建通知
      await db.models.Notification.create({
        userId: feedback.userId,
        conversationId: feedback.conversationId,
        type: 'feedback_response',
        title: '反馈收到回复',
        message: '您的反馈已收到回复，请查看会话详情',
        metadata: { feedbackId: feedback.id }
      });

      // 重新获取反馈（包含关联数据）
      const updatedFeedback = await Feedback.findByPk(feedbackId, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'firstName', 'lastName', 'email']
          },
          {
            model: User,
            as: 'agent',
            attributes: ['id', 'username', 'firstName', 'lastName', 'email']
          },
          {
            model: Conversation,
            attributes: ['id', 'title', 'status', 'createdAt', 'closedAt']
          }
        ]
      });

      res.status(200).json({
        success: true,
        message: '反馈回复成功',
        data: { feedback: updatedFeedback.toResponseObject() }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取反馈统计
   */
  static async getFeedbackStats(req, res, next) {
    try {
      const {
        agentId,
        startDate,
        endDate,
        groupBy = 'day'
      } = req.query;

      // 检查权限：只有管理员和主管可以查看统计
      if (req.user.role !== 'admin' && req.user.role !== 'supervisor') {
        throw new ForbiddenError('无权查看反馈统计');
      }

      // 构建查询条件
      const where = {};
      
      if (agentId) {
        where.agentId = agentId;
      }
      
      if (startDate) {
        where.createdAt = { ...where.createdAt, [db.Sequelize.Op.gte]: new Date(startDate) };
      }
      
      if (endDate) {
        where.createdAt = { ...where.createdAt, [db.Sequelize.Op.lte]: new Date(endDate) };
      }

      // 获取总体统计
      const totalFeedbacks = await Feedback.count({ where });
      const averageRating = await Feedback.findOne({
        where,
        attributes: [[db.Sequelize.fn('AVG', db.Sequelize.col('rating')), 'average']]
      });
      const statusDistribution = await Feedback.count({
        where,
        group: ['status']
      });
      const typeDistribution = await Feedback.count({
        where,
        group: ['feedbackType']
      });
      const ratingDistribution = await Feedback.count({
        where: { ...where, rating: { [db.Sequelize.Op.not]: null } },
        group: ['rating']
      });

      // 获取按客服分组的统计
      const agentStats = await Feedback.findAll({
        where,
        attributes: [
          'agentId',
          [db.Sequelize.fn('COUNT', 'id'), 'total'],
          [db.Sequelize.fn('AVG', db.Sequelize.col('rating')), 'averageRating'],
          [db.Sequelize.fn('SUM', db.Sequelize.literal('CASE WHEN "status" = "resolved" THEN 1 ELSE 0 END')), 'resolved']
        ],
        group: ['agentId'],
        include: [{
          model: User,
          as: 'agent',
          attributes: ['username', 'firstName', 'lastName']
        }]
      });

      // 获取时间趋势统计
      let trendQuery = '';
      let dateFormat = '';
      
      switch (groupBy) {
        case 'day':
          dateFormat = 'DATE(createdAt)';
          break;
        case 'week':
          dateFormat = 'DATE_TRUNC(\'week\', createdAt)';
          break;
        case 'month':
          dateFormat = 'DATE_TRUNC(\'month\', createdAt)';
          break;
        default:
          dateFormat = 'DATE(createdAt)';
      }

      trendQuery = `
        SELECT 
          ${dateFormat} as period,
          COUNT(*) as total,
          AVG(rating) as averageRating,
          SUM(CASE WHEN "status" = "resolved" THEN 1 ELSE 0 END) as resolved
        FROM feedbacks
        WHERE ${Object.keys(where).map(key => {
          if (key === 'createdAt') {
            return Object.keys(where[key]).map(op => {
              return `createdAt ${op === db.Sequelize.Op.gte ? '>=' : '<='} :${key}_${op}`;
            }).join(' AND ');
          }
          return `${key} = :${key}`;
        }).join(' AND ')}
        GROUP BY period
        ORDER BY period ASC
      `;

      const replacements = { ...where };
      if (where.createdAt) {
        if (where.createdAt[db.Sequelize.Op.gte]) {
          replacements['createdAt_' + db.Sequelize.Op.gte] = where.createdAt[db.Sequelize.Op.gte];
        }
        if (where.createdAt[db.Sequelize.Op.lte]) {
          replacements['createdAt_' + db.Sequelize.Op.lte] = where.createdAt[db.Sequelize.Op.lte];
        }
      }

      const trends = await db.sequelize.query(trendQuery, {
        replacements,
        type: db.sequelize.QueryTypes.SELECT
      });

      res.status(200).json({
        success: true,
        data: {
          summary: {
            totalFeedbacks,
            averageRating: parseFloat(averageRating.dataValues.average) || 0,
            resolvedCount: statusDistribution.find(s => s.status === 'resolved')?.count || 0,
            resolutionRate: totalFeedbacks > 0 ? 
              ((statusDistribution.find(s => s.status === 'resolved')?.count || 0) / totalFeedbacks * 100).toFixed(2) : 0
          },
          statusDistribution: statusDistribution.map(item => ({
            status: item.status,
            count: item.count,
            percentage: (item.count / totalFeedbacks * 100).toFixed(2)
          })),
          typeDistribution: typeDistribution.map(item => ({
            type: item.feedbackType,
            count: item.count
          })),
          ratingDistribution: ratingDistribution.map(item => ({
            rating: item.rating,
            count: item.count
          })),
          agentStats: agentStats.map(stat => ({
            agentId: stat.agentId,
            agentName: stat.agent ? `${stat.agent.firstName} ${stat.agent.lastName}` : '未分配',
            username: stat.agent?.username,
            totalFeedbacks: parseInt(stat.total),
            averageRating: parseFloat(stat.averageRating) || 0,
            resolvedCount: parseInt(stat.resolved) || 0
          })),
          trends: trends.map(trend => ({
            period: trend.period,
            total: parseInt(trend.total),
            averageRating: parseFloat(trend.averageRating) || 0,
            resolvedCount: parseInt(trend.resolved) || 0
          }))
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 批量更新反馈状态
   */
  static async batchUpdateFeedbackStatus(req, res, next) {
    try {
      // 验证请求数据
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new BadRequestError('请求数据验证失败', errors.array());
      }

      const { feedbackIds, status } = req.body;
      const currentUserId = req.user.userId;

      // 检查权限：只有管理员和主管可以批量更新
      if (req.user.role !== 'admin' && req.user.role !== 'supervisor') {
        throw new ForbiddenError('无权批量更新反馈状态');
      }

      // 验证参数
      if (!feedbackIds || !Array.isArray(feedbackIds) || feedbackIds.length === 0) {
        throw new BadRequestError('请提供有效的反馈ID列表');
      }

      if (!status) {
        throw new BadRequestError('请提供状态值');
      }

      // 验证状态值
      const validStatuses = ['pending', 'processing', 'resolved', 'dismissed'];
      if (!validStatuses.includes(status)) {
        throw new BadRequestError(`无效的状态值，必须是以下之一: ${validStatuses.join(', ')}`);
      }

      // 批量更新状态
      const updateData = {
        status,
        resolvedBy: currentUserId,
        updatedAt: new Date()
      };

      // 如果状态变为已解决，记录解决时间
      if (status === 'resolved') {
        updateData.resolvedAt = new Date();
      }

      const updatedCount = await Feedback.update(updateData, {
        where: { id: feedbackIds }
      });

      // 记录操作日志
      await db.models.WorkLog.logFeedbacksBatchUpdated({
        userId: currentUserId,
        feedbackIds,
        status,
        updatedCount: updatedCount[0]
      });

      res.status(200).json({
        success: true,
        message: `成功更新 ${updatedCount[0]} 条反馈状态`,
        data: { updatedCount: updatedCount[0] }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取用户自己的反馈历史
   */
  static async getUserFeedbackHistory(req, res, next) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        feedbackType
      } = req.query;
      const currentUserId = req.user.userId;

      // 构建查询条件
      const where = {
        userId: currentUserId
      };
      
      if (status) {
        where.status = status;
      }
      
      if (feedbackType) {
        where.feedbackType = feedbackType;
      }

      // 计算偏移量
      const offset = (page - 1) * limit;

      // 查询反馈
      const { count, rows } = await Feedback.findAndCountAll({
        where,
        offset,
        limit: parseInt(limit),
        order: [['createdAt', 'desc']],
        include: [
          {
            model: Conversation,
            attributes: ['id', 'title', 'status']
          },
          {
            model: User,
            as: 'agent',
            attributes: ['id', 'username', 'firstName', 'lastName']
          }
        ]
      });

      res.status(200).json({
        success: true,
        data: {
          feedbacks: rows.map(feedback => feedback.toResponseObject()),
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
   * 删除反馈（管理员功能）
   */
  static async deleteFeedback(req, res, next) {
    try {
      const { feedbackId } = req.params;
      const currentUserId = req.user.userId;

      // 检查权限：只有管理员可以删除反馈
      if (req.user.role !== 'admin') {
        throw new ForbiddenError('无权删除反馈');
      }

      // 查找反馈
      const feedback = await Feedback.findByPk(feedbackId);
      if (!feedback) {
        throw new NotFoundError('反馈不存在');
      }

      // 记录删除前信息
      const feedbackInfo = {
        id: feedback.id,
        conversationId: feedback.conversationId,
        rating: feedback.rating,
        feedbackType: feedback.feedbackType
      };

      // 软删除反馈
      await feedback.destroy();

      // 更新会话标记
      await Conversation.update(
        { hasFeedback: false, feedbackRating: null },
        { where: { id: feedback.conversationId } }
      );

      // 记录操作日志
      await db.models.WorkLog.logFeedbackDeleted({
        userId: currentUserId,
        feedbackInfo
      });

      res.status(200).json({
        success: true,
        message: '反馈已删除'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 导出反馈数据
   */
  static async exportFeedbacks(req, res, next) {
    try {
      const {
        status,
        feedbackType,
        minRating,
        maxRating,
        agentId,
        userId,
        startDate,
        endDate,
        format = 'json'
      } = req.query;

      // 检查权限：只有管理员和主管可以导出
      if (req.user.role !== 'admin' && req.user.role !== 'supervisor') {
        throw new ForbiddenError('无权导出反馈数据');
      }

      // 构建查询条件
      const where = {};
      
      if (status) where.status = status;
      if (feedbackType) where.feedbackType = feedbackType;
      if (minRating) where.rating = { ...where.rating, [db.Sequelize.Op.gte]: parseInt(minRating) };
      if (maxRating) where.rating = { ...where.rating, [db.Sequelize.Op.lte]: parseInt(maxRating) };
      if (agentId) where.agentId = agentId;
      if (userId) where.userId = userId;
      if (startDate) where.createdAt = { ...where.createdAt, [db.Sequelize.Op.gte]: new Date(startDate) };
      if (endDate) where.createdAt = { ...where.createdAt, [db.Sequelize.Op.lte]: new Date(endDate) };

      // 查询反馈
      const feedbacks = await Feedback.findAll({
        where,
        include: [
          { model: User, as: 'user', attributes: ['id', 'username', 'email'] },
          { model: User, as: 'agent', attributes: ['id', 'username', 'email'] },
          { model: Conversation, attributes: ['id', 'title', 'status'] }
        ],
        order: [['createdAt', 'desc']]
      });

      // 转换为导出格式
      const exportData = feedbacks.map(feedback => ({
        id: feedback.id,
        conversationId: feedback.conversationId,
        conversationTitle: feedback.Conversation?.title,
        userId: feedback.userId,
        userName: feedback.user?.username,
        userEmail: feedback.user?.email,
        agentId: feedback.agentId,
        agentName: feedback.agent?.username,
        agentEmail: feedback.agent?.email,
        rating: feedback.rating,
        feedbackType: feedback.feedbackType,
        comments: feedback.comments,
        response: feedback.response,
        status: feedback.status,
        createdAt: feedback.createdAt,
        updatedAt: feedback.updatedAt,
        resolvedAt: feedback.resolvedAt,
        metadata: feedback.metadata
      }));

      // 设置响应头
      const fileName = `feedbacks-${new Date().toISOString().split('T')[0]}`;
      
      if (format === 'csv') {
        // 这里可以实现CSV格式化逻辑
        // 简单实现，实际可能需要更复杂的CSV处理
        const headers = Object.keys(exportData[0] || {}).join(',');
        const csvContent = exportData.map(row => 
          Object.values(row).map(val => 
            typeof val === 'object' ? JSON.stringify(val) : `"${val}"`
          ).join(',')
        ).join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}.csv"`);
        res.status(200).send(`${headers}\n${csvContent}`);
      } else {
        // JSON格式
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}.json"`);
        res.status(200).json(exportData);
      }
    } catch (error) {
      next(error);
    }
  }
}

export default FeedbackController;