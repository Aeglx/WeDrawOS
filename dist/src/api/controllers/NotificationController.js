import { validationResult } from 'express-validator';
import db from '../models/index.js';
import {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  InternalServerError
} from '../utils/errors.js';

const { Notification, User, Conversation, Message } = db.models;

/**
 * 通知控制器
 * 处理客服系统中的通知相关业务逻辑
 */
class NotificationController {
  /**
   * 获取用户通知列表
   */
  static async getUserNotifications(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        isRead,
        type,
        onlyUnread = false,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;
      const currentUserId = req.user.userId;

      // 构建查询条件
      const where = {
        userId: currentUserId
      };
      
      if (onlyUnread) {
        where.isRead = false;
      } else if (isRead !== undefined) {
        where.isRead = isRead === 'true' || isRead === true;
      }
      
      if (type) {
        where.type = type;
      }

      // 计算偏移量
      const offset = (page - 1) * limit;

      // 排序配置
      const order = [[sortBy, sortOrder]];

      // 查询通知
      const { count, rows } = await Notification.findAndCountAll({
        where,
        offset,
        limit: parseInt(limit),
        order,
        include: [
          {
            model: Conversation,
            as: 'conversation',
            attributes: ['id', 'title', 'status', 'assignedTo'],
            required: false
          },
          {
            model: Message,
            as: 'message',
            attributes: ['id', 'content', 'type', 'senderId'],
            include: [{ model: User, as: 'sender', attributes: ['id', 'username', 'firstName', 'lastName'] }],
            required: false
          }
        ]
      });

      res.status(200).json({
        success: true,
        data: {
          notifications: rows.map(notification => notification.toResponseObject()),
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(count / limit)
          },
          unreadCount: await Notification.count({ where: { userId: currentUserId, isRead: false } })
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取单个通知详情
   */
  static async getNotificationById(req, res, next) {
    try {
      const { notificationId } = req.params;
      const currentUserId = req.user.userId;

      // 查找通知
      const notification = await Notification.findByPk(notificationId, {
        include: [
          {
            model: Conversation,
            as: 'conversation',
            attributes: ['id', 'title', 'status', 'assignedTo'],
            required: false
          },
          {
            model: Message,
            as: 'message',
            attributes: ['id', 'content', 'type', 'senderId'],
            include: [{ model: User, as: 'sender', attributes: ['id', 'username', 'firstName', 'lastName'] }],
            required: false
          }
        ]
      });

      if (!notification) {
        throw new NotFoundError('通知不存在');
      }

      // 检查权限：只有通知接收者可以查看
      if (notification.userId !== currentUserId) {
        throw new ForbiddenError('无权查看此通知');
      }

      // 自动标记为已读
      if (!notification.isRead) {
        await notification.update({ isRead: true, readAt: new Date() });
      }

      res.status(200).json({
        success: true,
        data: { notification: notification.toResponseObject() }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 标记通知为已读
   */
  static async markAsRead(req, res, next) {
    try {
      const { notificationId } = req.params;
      const currentUserId = req.user.userId;

      // 查找通知
      const notification = await Notification.findByPk(notificationId);

      if (!notification) {
        throw new NotFoundError('通知不存在');
      }

      // 检查权限：只有通知接收者可以标记
      if (notification.userId !== currentUserId) {
        throw new ForbiddenError('无权操作此通知');
      }

      // 检查是否已经是已读状态
      if (notification.isRead) {
        return res.status(200).json({
          success: true,
          message: '通知已经是已读状态'
        });
      }

      // 标记为已读
      await notification.update({ isRead: true, readAt: new Date() });

      res.status(200).json({
        success: true,
        message: '通知已标记为已读',
        data: { notification: notification.toResponseObject() }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 批量标记通知为已读
   */
  static async batchMarkAsRead(req, res, next) {
    try {
      const { notificationIds } = req.body;
      const currentUserId = req.user.userId;

      // 验证参数
      if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
        throw new BadRequestError('请提供有效的通知ID列表');
      }

      // 检查所有通知是否属于当前用户
      const notifications = await Notification.findAll({
        where: { id: notificationIds, userId: currentUserId }
      });

      if (notifications.length !== notificationIds.length) {
        throw new ForbiddenError('部分通知无权操作');
      }

      // 批量标记为已读
      const updatedCount = await Notification.update(
        { isRead: true, readAt: new Date() },
        { where: { id: notificationIds, isRead: false } }
      );

      // 记录操作日志
      await db.models.WorkLog.logNotificationsMarkedAsRead({
        userId: currentUserId,
        notificationIds,
        markedCount: updatedCount[0]
      });

      res.status(200).json({
        success: true,
        message: `成功标记 ${updatedCount[0]} 条通知为已读`,
        data: { markedCount: updatedCount[0] }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 标记所有通知为已读
   */
  static async markAllAsRead(req, res, next) {
    try {
      const { type } = req.query;
      const currentUserId = req.user.userId;

      // 构建查询条件
      const where = {
        userId: currentUserId,
        isRead: false
      };
      
      if (type) {
        where.type = type;
      }

      // 批量标记为已读
      const updatedCount = await Notification.update(
        { isRead: true, readAt: new Date() },
        { where }
      );

      // 记录操作日志
      await db.models.WorkLog.logAllNotificationsMarkedAsRead({
        userId: currentUserId,
        type,
        markedCount: updatedCount[0]
      });

      res.status(200).json({
        success: true,
        message: `成功标记 ${updatedCount[0]} 条通知为已读`,
        data: { markedCount: updatedCount[0] }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 删除通知
   */
  static async deleteNotification(req, res, next) {
    try {
      const { notificationId } = req.params;
      const currentUserId = req.user.userId;

      // 查找通知
      const notification = await Notification.findByPk(notificationId);

      if (!notification) {
        throw new NotFoundError('通知不存在');
      }

      // 检查权限：只有通知接收者可以删除
      if (notification.userId !== currentUserId) {
        throw new ForbiddenError('无权删除此通知');
      }

      // 软删除通知
      await notification.destroy();

      res.status(200).json({
        success: true,
        message: '通知已删除'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 批量删除通知
   */
  static async batchDeleteNotifications(req, res, next) {
    try {
      const { notificationIds } = req.body;
      const currentUserId = req.user.userId;

      // 验证参数
      if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
        throw new BadRequestError('请提供有效的通知ID列表');
      }

      // 检查所有通知是否属于当前用户
      const notifications = await Notification.findAll({
        where: { id: notificationIds, userId: currentUserId }
      });

      if (notifications.length !== notificationIds.length) {
        throw new ForbiddenError('部分通知无权操作');
      }

      // 批量删除通知
      await Notification.destroy({ where: { id: notificationIds } });

      // 记录操作日志
      await db.models.WorkLog.logNotificationsDeleted({
        userId: currentUserId,
        notificationIds,
        deletedCount: notificationIds.length
      });

      res.status(200).json({
        success: true,
        message: `成功删除 ${notificationIds.length} 条通知`,
        data: { deletedCount: notificationIds.length }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 删除所有已读通知
   */
  static async deleteAllReadNotifications(req, res, next) {
    try {
      const { type } = req.query;
      const currentUserId = req.user.userId;

      // 构建查询条件
      const where = {
        userId: currentUserId,
        isRead: true
      };
      
      if (type) {
        where.type = type;
      }

      // 删除通知
      const deletedCount = await Notification.destroy({ where });

      // 记录操作日志
      await db.models.WorkLog.logAllReadNotificationsDeleted({
        userId: currentUserId,
        type,
        deletedCount
      });

      res.status(200).json({
        success: true,
        message: `成功删除 ${deletedCount} 条已读通知`,
        data: { deletedCount }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取未读通知数量
   */
  static async getUnreadCount(req, res, next) {
    try {
      const { type } = req.query;
      const currentUserId = req.user.userId;

      // 构建查询条件
      const where = {
        userId: currentUserId,
        isRead: false
      };
      
      if (type) {
        where.type = type;
      }

      // 统计未读数量
      const unreadCount = await Notification.count({ where });

      res.status(200).json({
        success: true,
        data: { unreadCount }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 创建通知（管理员功能）
   */
  static async createNotification(req, res, next) {
    try {
      // 验证请求数据
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new BadRequestError('请求数据验证失败', errors.array());
      }

      const { userId, title, message, type, metadata, conversationId, messageId } = req.body;
      const currentUserId = req.user.userId;

      // 检查权限：只有管理员和主管可以创建通知
      if (req.user.role !== 'admin' && req.user.role !== 'supervisor') {
        throw new ForbiddenError('无权创建通知');
      }

      // 验证用户存在
      const user = await User.findByPk(userId);
      if (!user) {
        throw new NotFoundError('用户不存在');
      }

      // 验证关联资源
      if (conversationId) {
        const conversation = await Conversation.findByPk(conversationId);
        if (!conversation) {
          throw new NotFoundError('会话不存在');
        }
      }

      if (messageId) {
        const msg = await Message.findByPk(messageId);
        if (!msg) {
          throw new NotFoundError('消息不存在');
        }
      }

      // 创建通知
      const notification = await Notification.create({
        userId,
        title,
        message,
        type,
        metadata,
        conversationId,
        messageId,
        createdBy: currentUserId,
        isRead: false
      });

      // 记录操作日志
      await db.models.WorkLog.logNotificationCreated({
        userId: currentUserId,
        notificationId: notification.id,
        recipientId: userId,
        notificationType: type,
        title
      });

      res.status(201).json({
        success: true,
        message: '通知创建成功',
        data: { notification: notification.toResponseObject() }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 批量发送通知（管理员功能）
   */
  static async batchSendNotifications(req, res, next) {
    try {
      // 验证请求数据
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new BadRequestError('请求数据验证失败', errors.array());
      }

      const { userIds, role, title, message, type, metadata } = req.body;
      const currentUserId = req.user.userId;

      // 检查权限：只有管理员可以批量发送通知
      if (req.user.role !== 'admin') {
        throw new ForbiddenError('无权批量发送通知');
      }

      // 获取目标用户
      let targetUsers = [];
      
      if (userIds && userIds.length > 0) {
        // 按用户ID发送
        targetUsers = await User.findAll({
          where: { id: userIds }
        });
      } else if (role) {
        // 按角色发送
        targetUsers = await User.findAll({
          where: { role }
        });
      } else {
        throw new BadRequestError('请指定用户ID列表或角色');
      }

      if (targetUsers.length === 0) {
        throw new NotFoundError('未找到目标用户');
      }

      // 批量创建通知
      const notificationData = targetUsers.map(user => ({
        userId: user.id,
        title,
        message,
        type,
        metadata,
        createdBy: currentUserId,
        isRead: false
      }));

      const notifications = await Notification.bulkCreate(notificationData);

      // 记录操作日志
      await db.models.WorkLog.logBatchNotificationsSent({
        userId: currentUserId,
        userCount: targetUsers.length,
        notificationCount: notifications.length,
        notificationType: type,
        title,
        targetRole: role
      });

      res.status(200).json({
        success: true,
        message: `成功发送 ${notifications.length} 条通知`,
        data: {
          sentCount: notifications.length,
          targetUsers: targetUsers.length
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取通知设置
   */
  static async getNotificationSettings(req, res, next) {
    try {
      const currentUserId = req.user.userId;

      // 查找用户的通知设置
      const user = await User.findByPk(currentUserId, {
        attributes: ['notificationSettings']
      });

      if (!user) {
        throw new NotFoundError('用户不存在');
      }

      // 默认设置
      const defaultSettings = {
        newMessage: true,
        conversationAssigned: true,
        conversationClosed: true,
        customerFeedback: true,
        systemAnnouncements: true,
        emailNotifications: true,
        pushNotifications: true,
        soundEnabled: true,
        desktopNotifications: true
      };

      // 合并用户设置和默认设置
      const settings = {
        ...defaultSettings,
        ...user.notificationSettings
      };

      res.status(200).json({
        success: true,
        data: { settings }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 更新通知设置
   */
  static async updateNotificationSettings(req, res, next) {
    try {
      // 验证请求数据
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new BadRequestError('请求数据验证失败', errors.array());
      }

      const newSettings = req.body;
      const currentUserId = req.user.userId;

      // 查找用户
      const user = await User.findByPk(currentUserId);
      if (!user) {
        throw new NotFoundError('用户不存在');
      }

      // 更新通知设置
      const updatedSettings = {
        ...user.notificationSettings,
        ...newSettings
      };

      await user.update({ notificationSettings: updatedSettings });

      // 记录操作日志
      await db.models.WorkLog.logNotificationSettingsUpdated({
        userId: currentUserId,
        settingsChanged: Object.keys(newSettings)
      });

      res.status(200).json({
        success: true,
        message: '通知设置更新成功',
        data: { settings: updatedSettings }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取通知统计信息
   */
  static async getNotificationStats(req, res, next) {
    try {
      const currentUserId = req.user.userId;
      
      // 获取不同类型通知的数量统计
      const typeStats = await Notification.findAll({
        where: { userId: currentUserId },
        attributes: [
          'type',
          [db.Sequelize.fn('COUNT', 'id'), 'total'],
          [db.Sequelize.fn('SUM', db.Sequelize.literal('CASE WHEN "isRead" = false THEN 1 ELSE 0 END')), 'unread']
        ],
        group: ['type']
      });

      // 获取最近7天的通知趋势
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const dailyStats = await db.sequelize.query(
        `SELECT 
          DATE(createdAt) as date,
          COUNT(*) as total,
          SUM(CASE WHEN "isRead" = false THEN 1 ELSE 0 END) as unread
        FROM notifications 
        WHERE "userId" = :userId AND "createdAt" >= :startDate
        GROUP BY DATE(createdAt)
        ORDER BY date ASC`,
        {
          replacements: { userId: currentUserId, startDate: sevenDaysAgo },
          type: db.sequelize.QueryTypes.SELECT
        }
      );

      // 计算总统计
      const totalNotifications = await Notification.count({ where: { userId: currentUserId } });
      const unreadNotifications = await Notification.count({ where: { userId: currentUserId, isRead: false } });

      res.status(200).json({
        success: true,
        data: {
          summary: {
            total: totalNotifications,
            unread: unreadNotifications,
            read: totalNotifications - unreadNotifications,
            unreadPercentage: totalNotifications > 0 ? (unreadNotifications / totalNotifications * 100).toFixed(2) : 0
          },
          typeStats: typeStats.map(stat => ({
            type: stat.type,
            total: parseInt(stat.total),
            unread: parseInt(stat.unread) || 0,
            read: parseInt(stat.total) - (parseInt(stat.unread) || 0)
          })),
          dailyStats: dailyStats.map(stat => ({
            date: stat.date,
            total: parseInt(stat.total),
            unread: parseInt(stat.unread) || 0
          }))
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 清理过期通知
   */
  static async cleanupExpiredNotifications(req, res, next) {
    try {
      const daysToKeep = parseInt(req.query.daysToKeep) || 30;
      const currentUserId = req.user.userId;

      // 计算过期时间
      const expireDate = new Date();
      expireDate.setDate(expireDate.getDate() - daysToKeep);

      // 只清理已读的过期通知
      const deletedCount = await Notification.destroy({
        where: {
          userId: currentUserId,
          isRead: true,
          createdAt: { [db.Sequelize.Op.lt]: expireDate }
        }
      });

      // 记录操作日志
      await db.models.WorkLog.logExpiredNotificationsCleaned({
        userId: currentUserId,
        daysToKeep,
        deletedCount
      });

      res.status(200).json({
        success: true,
        message: `成功清理 ${deletedCount} 条过期通知`,
        data: { deletedCount }
      });
    } catch (error) {
      next(error);
    }
  }
}

export default NotificationController;