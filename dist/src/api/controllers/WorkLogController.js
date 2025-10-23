import { validationResult } from 'express-validator';
import db from '../models/index.js';
import {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  InternalServerError
} from '../utils/errors.js';

const { WorkLog, User, Conversation, Feedback, WorkSchedule } = db.models;

/**
 * 工作记录控制器
 * 处理客服系统中的工作日志相关业务逻辑
 */
class WorkLogController {
  /**
   * 获取工作日志列表
   */
  static async getWorkLogs(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        userId,
        activityType,
        conversationId,
        startTime,
        endTime,
        actionType,
        includeDetails = false,
        sortBy = 'timestamp',
        sortOrder = 'desc'
      } = req.query;

      const currentUserId = req.user.userId;

      // 构建查询条件
      const where = {};
      
      // 根据权限过滤
      if (req.user.role === 'agent') {
        where.userId = currentUserId;
      } else if (userId) {
        where.userId = userId;
      }
      
      if (activityType) {
        where.activityType = activityType;
      }
      
      if (conversationId) {
        where.conversationId = conversationId;
      }
      
      if (actionType) {
        where.actionType = actionType;
      }
      
      if (startTime) {
        where.timestamp = { ...where.timestamp, [db.Sequelize.Op.gte]: new Date(startTime) };
      }
      
      if (endTime) {
        where.timestamp = { ...where.timestamp, [db.Sequelize.Op.lte]: new Date(endTime) };
      }

      // 计算偏移量
      const offset = (page - 1) * limit;

      // 排序配置
      const order = [[sortBy, sortOrder]];

      // 构建包含关系
      const include = [
        {
          model: User,
          attributes: ['id', 'username', 'firstName', 'lastName', 'role']
        }
      ];

      // 是否包含详情
      if (includeDetails === 'true') {
        include.push({
          model: Conversation,
          attributes: ['id', 'title', 'status', 'userId']
        });
      }

      // 查询日志
      const { count, rows } = await WorkLog.findAndCountAll({
        where,
        offset,
        limit: parseInt(limit),
        order,
        include
      });

      res.status(200).json({
        success: true,
        data: {
          workLogs: rows.map(log => log.toResponseObject()),
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
   * 获取单个工作日志详情
   */
  static async getWorkLogById(req, res, next) {
    try {
      const { logId } = req.params;
      const currentUserId = req.user.userId;

      // 查找日志
      const workLog = await WorkLog.findByPk(logId, {
        include: [
          {
            model: User,
            attributes: ['id', 'username', 'firstName', 'lastName', 'role']
          },
          {
            model: Conversation,
            attributes: ['id', 'title', 'status', 'userId']
          }
        ]
      });

      if (!workLog) {
        throw new NotFoundError('工作日志不存在');
      }

      // 检查权限：只有管理员、主管或日志所属用户可以查看
      if (req.user.role !== 'admin' && 
          req.user.role !== 'supervisor' && 
          workLog.userId !== currentUserId) {
        throw new ForbiddenError('无权查看此工作日志');
      }

      res.status(200).json({
        success: true,
        data: { workLog: workLog.toResponseObject() }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取工作活动统计
   */
  static async getActivityStats(req, res, next) {
    try {
      const {
        userId,
        activityType,
        startDate,
        endDate,
        groupBy = 'day'
      } = req.query;

      const currentUserId = req.user.userId;

      // 检查权限：只有管理员、主管或查看自己的统计
      if (req.user.role !== 'admin' && 
          req.user.role !== 'supervisor' && 
          userId && userId !== currentUserId) {
        throw new ForbiddenError('无权查看其他用户的活动统计');
      }

      // 构建查询条件
      const where = {};
      
      if (userId) {
        where.userId = userId;
      } else if (req.user.role === 'agent') {
        where.userId = currentUserId;
      }
      
      if (activityType) {
        where.activityType = activityType;
      }
      
      if (startDate) {
        where.timestamp = { ...where.timestamp, [db.Sequelize.Op.gte]: new Date(startDate) };
      }
      
      if (endDate) {
        where.timestamp = { ...where.timestamp, [db.Sequelize.Op.lte]: new Date(endDate) };
      }

      // 获取活动类型分布
      const activityTypeStats = await WorkLog.count({
        where,
        group: ['activityType']
      });

      // 获取操作类型分布
      const actionTypeStats = await WorkLog.count({
        where,
        group: ['actionType']
      });

      // 获取按客服分组的统计
      const userStats = await WorkLog.findAll({
        where,
        attributes: [
          'userId',
          [db.Sequelize.fn('COUNT', 'id'), 'totalActivities'],
          [db.Sequelize.fn('COUNT', db.Sequelize.literal('DISTINCT "conversationId"')), 'uniqueConversations']
        ],
        group: ['userId'],
        include: [{
          model: User,
          attributes: ['username', 'firstName', 'lastName', 'role']
        }]
      });

      // 获取时间趋势统计
      let trendQuery = '';
      let dateFormat = '';
      
      switch (groupBy) {
        case 'day':
          dateFormat = 'DATE(timestamp)';
          break;
        case 'hour':
          dateFormat = 'DATE(timestamp), EXTRACT(HOUR FROM timestamp)';
          break;
        case 'week':
          dateFormat = 'DATE_TRUNC(\'week\', timestamp)';
          break;
        case 'month':
          dateFormat = 'DATE_TRUNC(\'month\', timestamp)';
          break;
        default:
          dateFormat = 'DATE(timestamp)';
      }

      trendQuery = `
        SELECT 
          ${dateFormat} as period,
          COUNT(*) as activityCount,
          COUNT(DISTINCT "userId") as userCount,
          COUNT(DISTINCT "conversationId") as conversationCount
        FROM work_logs
        WHERE ${Object.keys(where).map(key => {
          if (key === 'timestamp') {
            return Object.keys(where[key]).map(op => {
              return `timestamp ${op === db.Sequelize.Op.gte ? '>=' : '<='} :${key}_${op}`;
            }).join(' AND ');
          }
          return `${key} = :${key}`;
        }).join(' AND ')}
        GROUP BY period
        ORDER BY period ASC
      `;

      const replacements = { ...where };
      if (where.timestamp) {
        if (where.timestamp[db.Sequelize.Op.gte]) {
          replacements['timestamp_' + db.Sequelize.Op.gte] = where.timestamp[db.Sequelize.Op.gte];
        }
        if (where.timestamp[db.Sequelize.Op.lte]) {
          replacements['timestamp_' + db.Sequelize.Op.lte] = where.timestamp[db.Sequelize.Op.lte];
        }
      }

      const trends = await db.sequelize.query(trendQuery, {
        replacements,
        type: db.sequelize.QueryTypes.SELECT
      });

      // 获取工作效率统计
      const efficiencyStats = await db.sequelize.query(`
        SELECT
          wl.userId,
          COUNT(DISTINCT wl.conversationId) as handledConversations,
          SUM(CASE WHEN wl.actionType = 'close_conversation' THEN 1 ELSE 0 END) as closedConversations,
          SUM(CASE WHEN wl.actionType = 'send_message' THEN 1 ELSE 0 END) as sentMessages,
          SUM(CASE WHEN wl.actionType = 'receive_message' THEN 1 ELSE 0 END) as receivedMessages
        FROM work_logs wl
        WHERE ${Object.keys(where).map(key => {
          if (key === 'timestamp') {
            return Object.keys(where[key]).map(op => {
              return `wl.timestamp ${op === db.Sequelize.Op.gte ? '>=' : '<='} :${key}_${op}`;
            }).join(' AND ');
          }
          return `wl.${key} = :${key}`;
        }).join(' AND ')}
        GROUP BY wl.userId
      `, {
        replacements,
        type: db.sequelize.QueryTypes.SELECT
      });

      res.status(200).json({
        success: true,
        data: {
          activityTypeDistribution: activityTypeStats.map(item => ({
            activityType: item.activityType,
            count: item.count
          })),
          actionTypeDistribution: actionTypeStats.map(item => ({
            actionType: item.actionType,
            count: item.count
          })),
          userStats: userStats.map(stat => ({
            userId: stat.userId,
            userName: stat.User ? `${stat.User.firstName} ${stat.User.lastName}` : '未知',
            username: stat.User?.username,
            role: stat.User?.role,
            totalActivities: parseInt(stat.totalActivities),
            uniqueConversations: parseInt(stat.uniqueConversations)
          })),
          trends: trends.map(trend => ({
            period: trend.period,
            activityCount: parseInt(trend.activityCount),
            userCount: parseInt(trend.userCount),
            conversationCount: parseInt(trend.conversationCount)
          })),
          efficiencyStats: efficiencyStats.map(stat => {
            const user = userStats.find(u => u.userId === stat.userId)?.User;
            return {
              userId: stat.userId,
              userName: user ? `${user.firstName} ${user.lastName}` : '未知',
              username: user?.username,
              handledConversations: parseInt(stat.handledConversations),
              closedConversations: parseInt(stat.closedConversations),
              sentMessages: parseInt(stat.sentMessages),
              receivedMessages: parseInt(stat.receivedMessages),
              closeRate: stat.handledConversations > 0 ? 
                (stat.closedConversations / stat.handledConversations * 100).toFixed(2) : 0
            };
          })
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取客服绩效统计
   */
  static async getAgentPerformance(req, res, next) {
    try {
      const {
        userId,
        startDate,
        endDate,
        groupBy = 'day'
      } = req.query;

      // 检查权限：只有管理员和主管可以查看
      if (req.user.role !== 'admin' && req.user.role !== 'supervisor') {
        throw new ForbiddenError('无权查看绩效统计');
      }

      // 构建查询条件
      const where = {};
      const logWhere = {};
      const scheduleWhere = {};
      const feedbackWhere = {};
      
      if (userId) {
        where.userId = userId;
        logWhere.userId = userId;
        scheduleWhere.userId = userId;
        feedbackWhere.agentId = userId;
      }
      
      // 日期范围过滤
      if (startDate) {
        logWhere.timestamp = { ...logWhere.timestamp, [db.Sequelize.Op.gte]: new Date(startDate) };
        scheduleWhere.date = { ...scheduleWhere.date, [db.Sequelize.Op.gte]: startDate };
        feedbackWhere.createdAt = { ...feedbackWhere.createdAt, [db.Sequelize.Op.gte]: new Date(startDate) };
      }
      
      if (endDate) {
        logWhere.timestamp = { ...logWhere.timestamp, [db.Sequelize.Op.lte]: new Date(endDate) };
        scheduleWhere.date = { ...scheduleWhere.date, [db.Sequelize.Op.lte]: endDate };
        feedbackWhere.createdAt = { ...feedbackWhere.createdAt, [db.Sequelize.Op.lte]: new Date(endDate) };
      }

      // 获取客服列表
      const agents = await User.findAll({
        where: { ...where, role: 'agent' },
        attributes: ['id', 'username', 'firstName', 'lastName', 'email']
      });

      const performanceStats = [];

      for (const agent of agents) {
        // 工作时间统计
        const workMinutes = await WorkSchedule.findOne({
          where: { ...scheduleWhere, userId: agent.id },
          attributes: [[db.Sequelize.fn('SUM', db.Sequelize.col('netWorkMinutes')), 'totalMinutes']]
        });

        // 会话统计
        const conversationStats = await WorkLog.findOne({
          where: { ...logWhere, userId: agent.id },
          attributes: [
            [db.Sequelize.fn('COUNT', db.Sequelize.literal('DISTINCT CASE WHEN "activityType" = "conversation" THEN "conversationId" END')), 'handledConversations'],
            [db.Sequelize.fn('COUNT', db.Sequelize.literal('CASE WHEN "actionType" = "close_conversation" THEN 1 END')), 'closedConversations'],
            [db.Sequelize.fn('COUNT', db.Sequelize.literal('CASE WHEN "actionType" = "assign_conversation" THEN 1 END')), 'assignedConversations'],
            [db.Sequelize.fn('COUNT', db.Sequelize.literal('CASE WHEN "actionType" = "transfer_conversation" THEN 1 END')), 'transferredConversations']
          ]
        });

        // 消息统计
        const messageStats = await WorkLog.findOne({
          where: { ...logWhere, userId: agent.id },
          attributes: [
            [db.Sequelize.fn('COUNT', db.Sequelize.literal('CASE WHEN "actionType" = "send_message" THEN 1 END')), 'sentMessages'],
            [db.Sequelize.fn('COUNT', db.Sequelize.literal('CASE WHEN "actionType" = "receive_message" THEN 1 END')), 'receivedMessages']
          ]
        });

        // 反馈统计
        const feedbackStats = await Feedback.findOne({
          where: { ...feedbackWhere, agentId: agent.id },
          attributes: [
            [db.Sequelize.fn('COUNT', 'id'), 'totalFeedbacks'],
            [db.Sequelize.fn('AVG', db.Sequelize.col('rating')), 'avgRating'],
            [db.Sequelize.fn('SUM', db.Sequelize.literal('CASE WHEN "rating" >= 4 THEN 1 ELSE 0 END')), 'positiveFeedbacks']
          ]
        });

        // 自动回复统计
        const autoReplyStats = await WorkLog.findOne({
          where: { ...logWhere, userId: agent.id, actionType: 'auto_reply_triggered' },
          attributes: [[db.Sequelize.fn('COUNT', 'id'), 'autoRepliesUsed']]
        });

        const totalMinutes = parseInt(workMinutes.dataValues.totalMinutes) || 0;
        const handledConversations = parseInt(conversationStats.dataValues.handledConversations) || 0;
        const closedConversations = parseInt(conversationStats.dataValues.closedConversations) || 0;
        const sentMessages = parseInt(messageStats.dataValues.sentMessages) || 0;
        const totalFeedbacks = parseInt(feedbackStats.dataValues.totalFeedbacks) || 0;
        const avgRating = parseFloat(feedbackStats.dataValues.avgRating) || 0;
        const positiveFeedbacks = parseInt(feedbackStats.dataValues.positiveFeedbacks) || 0;

        performanceStats.push({
          agentId: agent.id,
          agentName: `${agent.firstName} ${agent.lastName}`,
          username: agent.username,
          workHours: Math.floor(totalMinutes / 60),
          workMinutes: totalMinutes % 60,
          handledConversations,
          closedConversations,
          assignedConversations: parseInt(conversationStats.dataValues.assignedConversations) || 0,
          transferredConversations: parseInt(conversationStats.dataValues.transferredConversations) || 0,
          sentMessages,
          receivedMessages: parseInt(messageStats.dataValues.receivedMessages) || 0,
          messageRate: totalMinutes > 0 ? (sentMessages / (totalMinutes / 60)).toFixed(2) : 0,
          conversationRate: totalMinutes > 0 ? (handledConversations / (totalMinutes / 60)).toFixed(2) : 0,
          closeRate: handledConversations > 0 ? (closedConversations / handledConversations * 100).toFixed(2) : 0,
          totalFeedbacks,
          avgRating,
          positiveFeedbackRate: totalFeedbacks > 0 ? (positiveFeedbacks / totalFeedbacks * 100).toFixed(2) : 0,
          autoRepliesUsed: parseInt(autoReplyStats.dataValues.autoRepliesUsed) || 0
        });
      }

      res.status(200).json({
        success: true,
        data: {
          performanceStats,
          summary: {
            totalAgents: performanceStats.length,
            avgWorkHours: performanceStats.length > 0 ? 
              performanceStats.reduce((sum, stat) => sum + stat.workHours, 0) / performanceStats.length : 0,
            avgHandledConversations: performanceStats.length > 0 ?
              performanceStats.reduce((sum, stat) => sum + stat.handledConversations, 0) / performanceStats.length : 0,
            avgSentMessages: performanceStats.length > 0 ?
              performanceStats.reduce((sum, stat) => sum + stat.sentMessages, 0) / performanceStats.length : 0,
            avgRating: performanceStats.length > 0 ?
              performanceStats.reduce((sum, stat) => sum + parseFloat(stat.avgRating), 0) / performanceStats.length : 0
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取会话处理时间统计
   */
  static async getConversationHandlingTime(req, res, next) {
    try {
      const {
        userId,
        startDate,
        endDate
      } = req.query;

      // 检查权限
      const currentUserId = req.user.userId;
      if (req.user.role !== 'admin' && 
          req.user.role !== 'supervisor' && 
          userId && userId !== currentUserId) {
        throw new ForbiddenError('无权查看其他用户的处理时间统计');
      }

      // 构建查询条件
      const where = {};
      
      if (userId) {
        where.userId = userId;
      } else if (req.user.role === 'agent') {
        where.userId = currentUserId;
      }
      
      if (startDate) {
        where.timestamp = { ...where.timestamp, [db.Sequelize.Op.gte]: new Date(startDate) };
      }
      
      if (endDate) {
        where.timestamp = { ...where.timestamp, [db.Sequelize.Op.lte]: new Date(endDate) };
      }

      // 获取会话开始和结束时间
      const conversationTimes = await db.sequelize.query(`
        WITH conversation_starts AS (
          SELECT 
            "conversationId",
            userId,
            MIN(timestamp) as startTime
          FROM work_logs
          WHERE "actionType" IN ('create_conversation', 'assign_conversation')
          AND ${Object.keys(where).map(key => {
            if (key === 'timestamp') {
              return Object.keys(where[key]).map(op => {
                return `timestamp ${op === db.Sequelize.Op.gte ? '>=' : '<='} :${key}_${op}`;
              }).join(' AND ');
            }
            return `${key} = :${key}`;
          }).join(' AND ')}
          GROUP BY "conversationId", userId
        ),
        conversation_ends AS (
          SELECT 
            "conversationId",
            MAX(timestamp) as endTime
          FROM work_logs
          WHERE "actionType" = 'close_conversation'
          AND ${Object.keys(where).map(key => {
            if (key === 'timestamp') {
              return Object.keys(where[key]).map(op => {
                return `timestamp ${op === db.Sequelize.Op.gte ? '>=' : '<='} :${key}_${op}`;
              }).join(' AND ');
            }
            return `${key} = :${key}`;
          }).join(' AND ')}
          GROUP BY "conversationId"
        )
        SELECT 
          cs.userId,
          cs."conversationId",
          cs.startTime,
          ce.endTime,
          EXTRACT(EPOCH FROM (ce.endTime - cs.startTime))/60 as handlingMinutes
        FROM conversation_starts cs
        LEFT JOIN conversation_ends ce ON cs."conversationId" = ce."conversationId"
        WHERE ce.endTime IS NOT NULL
        ORDER BY handlingMinutes DESC
      `, {
        replacements: where,
        type: db.sequelize.QueryTypes.SELECT
      });

      // 按用户分组计算统计
      const userStats = {};
      conversationTimes.forEach(time => {
        if (!userStats[time.userId]) {
          userStats[time.userId] = {
            userId: time.userId,
            totalConversations: 0,
            totalMinutes: 0,
            minutes: [],
            avgMinutes: 0,
            maxMinutes: 0,
            minMinutes: Infinity
          };
        }

        const stats = userStats[time.userId];
        const minutes = parseFloat(time.handlingMinutes);
        
        stats.totalConversations++;
        stats.totalMinutes += minutes;
        stats.minutes.push(minutes);
        stats.maxMinutes = Math.max(stats.maxMinutes, minutes);
        stats.minutes = Math.min(stats.minutes, minutes);
      });

      // 计算平均值和百分位数
      for (const userId in userStats) {
        const stats = userStats[userId];
        stats.avgMinutes = stats.totalMinutes / stats.totalConversations;
        stats.minutes.sort((a, b) => a - b);
        stats.p50 = stats.minutes[Math.floor(stats.minutes.length * 0.5)];
        stats.p90 = stats.minutes[Math.floor(stats.minutes.length * 0.9)];
        stats.p95 = stats.minutes[Math.floor(stats.minutes.length * 0.95)];
      }

      // 获取用户信息
      const userIds = Object.keys(userStats);
      const users = await User.findAll({
        where: { id: userIds },
        attributes: ['id', 'username', 'firstName', 'lastName']
      });

      // 合并用户信息
      const resultStats = users.map(user => {
        const stats = userStats[user.id];
        return {
          agentId: user.id,
          agentName: `${user.firstName} ${user.lastName}`,
          username: user.username,
          totalConversations: stats.totalConversations,
          avgHandlingMinutes: stats.avgMinutes.toFixed(2),
          maxHandlingMinutes: stats.maxMinutes.toFixed(2),
          minHandlingMinutes: stats.minMinutes.toFixed(2),
          medianHandlingMinutes: stats.p50.toFixed(2),
          p90HandlingMinutes: stats.p90.toFixed(2),
          p95HandlingMinutes: stats.p95.toFixed(2)
        };
      });

      res.status(200).json({
        success: true,
        data: {
          conversationHandlingTimes: conversationTimes.map(time => ({
            conversationId: time.conversationId,
            userId: time.userId,
            startTime: time.startTime,
            endTime: time.endTime,
            handlingMinutes: parseFloat(time.handlingMinutes).toFixed(2),
            handlingHours: (parseFloat(time.handlingMinutes) / 60).toFixed(2)
          })),
          userStats: resultStats,
          overallStats: {
            totalConversations: conversationTimes.length,
            avgHandlingMinutes: conversationTimes.length > 0 ? 
              (conversationTimes.reduce((sum, time) => sum + parseFloat(time.handlingMinutes), 0) / conversationTimes.length).toFixed(2) : 0,
            maxHandlingMinutes: conversationTimes.length > 0 ? 
              Math.max(...conversationTimes.map(time => parseFloat(time.handlingMinutes))).toFixed(2) : 0,
            minHandlingMinutes: conversationTimes.length > 0 ? 
              Math.min(...conversationTimes.map(time => parseFloat(time.handlingMinutes))).toFixed(2) : 0
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取响应时间统计
   */
  static async getResponseTimeStats(req, res, next) {
    try {
      const {
        userId,
        startDate,
        endDate
      } = req.query;

      // 检查权限
      const currentUserId = req.user.userId;
      if (req.user.role !== 'admin' && 
          req.user.role !== 'supervisor' && 
          userId && userId !== currentUserId) {
        throw new ForbiddenError('无权查看其他用户的响应时间统计');
      }

      // 构建查询条件
      const where = {};
      
      if (userId) {
        where.userId = userId;
      } else if (req.user.role === 'agent') {
        where.userId = currentUserId;
      }
      
      if (startDate) {
        where.timestamp = { ...where.timestamp, [db.Sequelize.Op.gte]: new Date(startDate) };
      }
      
      if (endDate) {
        where.timestamp = { ...where.timestamp, [db.Sequelize.Op.lte]: new Date(endDate) };
      }

      // 获取响应时间数据
      const responseTimes = await db.sequelize.query(`
        WITH received_messages AS (
          SELECT 
            "conversationId",
            timestamp as receivedTime
          FROM work_logs
          WHERE "actionType" = 'receive_message'
          AND userId != :currentUserId
          AND ${Object.keys(where).map(key => {
            if (key === 'timestamp') {
              return Object.keys(where[key]).map(op => {
                return `timestamp ${op === db.Sequelize.Op.gte ? '>=' : '<='} :${key}_${op}`;
              }).join(' AND ');
            }
            return `${key} = :${key}`;
          }).join(' AND ')}
        ),
        sent_messages AS (
          SELECT 
            "conversationId",
            timestamp as sentTime
          FROM work_logs
          WHERE "actionType" = 'send_message'
          AND ${Object.keys(where).map(key => {
            if (key === 'timestamp') {
              return Object.keys(where[key]).map(op => {
                return `timestamp ${op === db.Sequelize.Op.gte ? '>=' : '<='} :${key}_${op}`;
              }).join(' AND ');
            }
            return `${key} = :${key}`;
          }).join(' AND ')}
        )
        SELECT 
          rm."conversationId",
          rm.receivedTime,
          sm.sentTime,
          EXTRACT(EPOCH FROM (sm.sentTime - rm.receivedTime))/60 as responseMinutes
        FROM received_messages rm
        JOIN sent_messages sm ON rm."conversationId" = sm."conversationId"
        WHERE sm.sentTime > rm.receivedTime
        AND sm.sentTime = (
          SELECT MIN(sentTime) 
          FROM sent_messages 
          WHERE "conversationId" = rm."conversationId" 
          AND sentTime > rm.receivedTime
        )
        ORDER BY responseMinutes DESC
      `, {
        replacements: { ...where, currentUserId },
        type: db.sequelize.QueryTypes.SELECT
      });

      // 按时间段分组统计
      const hourlyStats = {};
      responseTimes.forEach(time => {
        const hour = new Date(time.receivedTime).getHours();
        if (!hourlyStats[hour]) {
          hourlyStats[hour] = { hour, total: 0, minutes: [] };
        }
        hourlyStats[hour].total++;
        hourlyStats[hour].minutes.push(parseFloat(time.responseMinutes));
      });

      // 计算每小时平均响应时间
      for (const hour in hourlyStats) {
        const stats = hourlyStats[hour];
        stats.avgMinutes = stats.minutes.reduce((sum, min) => sum + min, 0) / stats.total;
        stats.p50 = [...stats.minutes].sort((a, b) => a - b)[Math.floor(stats.total * 0.5)];
      }

      res.status(200).json({
        success: true,
        data: {
          responseTimes: responseTimes.map(time => ({
            conversationId: time.conversationId,
            receivedTime: time.receivedTime,
            sentTime: time.sentTime,
            responseMinutes: parseFloat(time.responseMinutes).toFixed(2),
            responseSeconds: Math.floor(parseFloat(time.responseMinutes) * 60)
          })),
          hourlyStats: Object.values(hourlyStats).map(stats => ({
            hour: stats.hour,
            totalResponses: stats.total,
            avgResponseMinutes: stats.avgMinutes.toFixed(2),
            medianResponseMinutes: stats.p50.toFixed(2)
          })),
          overallStats: {
            totalResponses: responseTimes.length,
            avgResponseMinutes: responseTimes.length > 0 ? 
              (responseTimes.reduce((sum, time) => sum + parseFloat(time.responseMinutes), 0) / responseTimes.length).toFixed(2) : 0,
            maxResponseMinutes: responseTimes.length > 0 ? 
              Math.max(...responseTimes.map(time => parseFloat(time.responseMinutes))).toFixed(2) : 0,
            minResponseMinutes: responseTimes.length > 0 ? 
              Math.min(...responseTimes.map(time => parseFloat(time.responseMinutes))).toFixed(2) : 0,
            p50ResponseMinutes: responseTimes.length > 0 ? 
              [...responseTimes.map(time => parseFloat(time.responseMinutes))].sort((a, b) => a - b)[Math.floor(responseTimes.length * 0.5)].toFixed(2) : 0,
            under5MinutesRate: responseTimes.length > 0 ? 
              ((responseTimes.filter(time => parseFloat(time.responseMinutes) <= 5).length / responseTimes.length) * 100).toFixed(2) : 0,
            under1MinuteRate: responseTimes.length > 0 ? 
              ((responseTimes.filter(time => parseFloat(time.responseMinutes) <= 1).length / responseTimes.length) * 100).toFixed(2) : 0
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 导出工作日志
   */
  static async exportWorkLogs(req, res, next) {
    try {
      const {
        userId,
        activityType,
        startDate,
        endDate,
        format = 'json'
      } = req.query;

      // 检查权限：只有管理员和主管可以导出
      if (req.user.role !== 'admin' && req.user.role !== 'supervisor') {
        throw new ForbiddenError('无权导出工作日志');
      }

      // 构建查询条件
      const where = {};
      
      if (userId) where.userId = userId;
      if (activityType) where.activityType = activityType;
      if (startDate) where.timestamp = { ...where.timestamp, [db.Sequelize.Op.gte]: new Date(startDate) };
      if (endDate) where.timestamp = { ...where.timestamp, [db.Sequelize.Op.lte]: new Date(endDate) };

      // 查询日志
      const workLogs = await WorkLog.findAll({
        where,
        include: [
          { model: User, attributes: ['id', 'username', 'firstName', 'lastName'] },
          { model: Conversation, attributes: ['id', 'title', 'status'] }
        ],
        order: [['timestamp', 'desc']]
      });

      // 转换为导出格式
      const exportData = workLogs.map(log => ({
        id: log.id,
        timestamp: log.timestamp,
        userId: log.userId,
        userName: log.User ? `${log.User.firstName} ${log.User.lastName}` : '未知',
        username: log.User?.username,
        activityType: log.activityType,
        actionType: log.actionType,
        conversationId: log.conversationId,
        conversationTitle: log.Conversation?.title,
        details: log.details,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        metadata: log.metadata
      }));

      // 设置响应头
      const fileName = `worklogs-${new Date().toISOString().split('T')[0]}`;
      
      if (format === 'csv') {
        // 简单的CSV格式化
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

  /**
   * 清理旧日志（管理员功能）
   */
  static async cleanupOldLogs(req, res, next) {
    try {
      const { daysToKeep = 90 } = req.query;
      const currentUserId = req.user.userId;

      // 检查权限：只有管理员可以清理日志
      if (req.user.role !== 'admin') {
        throw new ForbiddenError('无权清理工作日志');
      }

      // 计算截止日期
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(daysToKeep));

      // 记录要删除的日志数量
      const countBefore = await WorkLog.count({ 
        where: { timestamp: { [db.Sequelize.Op.lt]: cutoffDate } }
      });

      // 删除旧日志
      const deletedCount = await WorkLog.destroy({
        where: { timestamp: { [db.Sequelize.Op.lt]: cutoffDate } }
      });

      // 记录操作日志
      await WorkLog.create({
        userId: currentUserId,
        activityType: 'system',
        actionType: 'cleanup_logs',
        details: `清理了${daysToKeep}天前的旧日志`,
        metadata: {
          daysToKeep: parseInt(daysToKeep),
          cutoffDate,
          deletedCount
        }
      });

      res.status(200).json({
        success: true,
        message: `成功清理了 ${deletedCount} 条旧日志`,
        data: {
          deletedCount,
          daysToKeep: parseInt(daysToKeep),
          cutoffDate
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取实时活动监控
   */
  static async getRealtimeActivity(req, res, next) {
    try {
      const { minutes = 30 } = req.query;

      // 检查权限：只有管理员和主管可以查看
      if (req.user.role !== 'admin' && req.user.role !== 'supervisor') {
        throw new ForbiddenError('无权查看实时活动监控');
      }

      // 计算时间范围
      const startTime = new Date();
      startTime.setMinutes(startTime.getMinutes() - parseInt(minutes));

      // 获取活跃用户
      const activeUsers = await WorkLog.findAll({
        where: { timestamp: { [db.Sequelize.Op.gte]: startTime } },
        attributes: ['userId', [db.Sequelize.fn('COUNT', 'id'), 'activityCount']],
        group: ['userId'],
        include: [{
          model: User,
          attributes: ['id', 'username', 'firstName', 'lastName', 'role', 'availabilityStatus']
        }],
        order: [[db.Sequelize.fn('COUNT', 'id'), 'desc']]
      });

      // 获取活动类型统计
      const activityStats = await WorkLog.count({
        where: { timestamp: { [db.Sequelize.Op.gte]: startTime } },
        group: ['activityType']
      });

      // 获取最近活动
      const recentActivities = await WorkLog.findAll({
        where: { timestamp: { [db.Sequelize.Op.gte]: startTime } },
        limit: 50,
        order: [['timestamp', 'desc']],
        include: [
          { model: User, attributes: ['id', 'username', 'firstName', 'lastName'] },
          { model: Conversation, attributes: ['id', 'title'] }
        ]
      });

      // 获取活跃会话
      const activeConversations = await db.sequelize.query(`
        SELECT 
          "conversationId",
          COUNT(DISTINCT userId) as participantCount,
          COUNT(*) as activityCount,
          MAX(timestamp) as lastActivity
        FROM work_logs
        WHERE timestamp >= :startTime
        AND "conversationId" IS NOT NULL
        GROUP BY "conversationId"
        ORDER BY lastActivity DESC
        LIMIT 20
      `, {
        replacements: { startTime },
        type: db.sequelize.QueryTypes.SELECT
      });

      res.status(200).json({
        success: true,
        data: {
          monitoringPeriod: `${minutes}分钟`,
          startTime,
          activeUserCount: activeUsers.length,
          totalActivities: activityStats.reduce((sum, stat) => sum + stat.count, 0),
          activeUsers: activeUsers.map(user => ({
            userId: user.userId,
            userName: user.User ? `${user.User.firstName} ${user.User.lastName}` : '未知',
            username: user.User?.username,
            role: user.User?.role,
            availabilityStatus: user.User?.availabilityStatus,
            activityCount: parseInt(user.activityCount)
          })),
          activityStats: activityStats.map(stat => ({
            activityType: stat.activityType,
            count: stat.count
          })),
          recentActivities: recentActivities.map(activity => ({
            id: activity.id,
            timestamp: activity.timestamp,
            userId: activity.userId,
            userName: activity.User ? `${activity.User.firstName} ${activity.User.lastName}` : '未知',
            activityType: activity.activityType,
            actionType: activity.actionType,
            conversationId: activity.conversationId,
            conversationTitle: activity.Conversation?.title,
            details: activity.details
          })),
          activeConversations: activeConversations.map(conv => ({
            conversationId: conv.conversationId,
            participantCount: parseInt(conv.participantCount),
            activityCount: parseInt(conv.activityCount),
            lastActivity: conv.lastActivity
          }))
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

export default WorkLogController;