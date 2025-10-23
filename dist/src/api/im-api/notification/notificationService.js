/**
 * 通知系统服务
 * 提供用户通知管理功能
 */

const logger = require('../../core/utils/logger');
const cacheManager = require('../../core/cache/cacheManager');

class NotificationService {
  constructor() {
    // 模拟数据存储，实际应该使用数据库
    this.notifications = new Map(); // userId -> [通知列表]
    this.notificationCounter = 0;
  }

  /**
   * 创建通知
   * @param {Object} params - 通知参数
   * @param {string} params.userId - 用户ID
   * @param {string} params.title - 通知标题
   * @param {string} params.content - 通知内容
   * @param {string} params.type - 通知类型
   * @param {Object} params.data - 附加数据
   * @param {boolean} params.isRead - 是否已读
   */
  async createNotification(params) {
    const {
      userId,
      title,
      content,
      type = 'info',
      data = {},
      isRead = false
    } = params;

    try {
      this.notificationCounter++;
      const notification = {
        id: `notification_${Date.now()}_${this.notificationCounter}`,
        userId,
        title,
        content,
        type,
        data,
        isRead,
        createdAt: Date.now(),
        readAt: isRead ? Date.now() : null
      };

      // 保存通知
      if (!this.notifications.has(userId)) {
        this.notifications.set(userId, []);
      }
      this.notifications.get(userId).unshift(notification);

      // 限制每个用户的通知数量
      this.limitNotifications(userId, 100);

      // 发布通知事件
      if (cacheManager && typeof cacheManager.publish === 'function') {
        await cacheManager.publish('notification.send', notification);
      }

      logger.info(`创建通知成功: ${notification.id}, 用户: ${userId}`);
      return notification;
    } catch (error) {
      logger.error('创建通知失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户通知列表
   * @param {string} userId - 用户ID
   * @param {Object} options - 查询选项
   * @param {number} options.page - 页码
   * @param {number} options.pageSize - 每页数量
   * @param {string} options.type - 通知类型
   * @param {boolean} options.isRead - 是否已读
   */
  getNotifications(userId, options = {}) {
    const {
      page = 1,
      pageSize = 20,
      type,
      isRead
    } = options;

    try {
      let notifications = this.notifications.get(userId) || [];

      // 应用过滤条件
      if (type) {
        notifications = notifications.filter(n => n.type === type);
      }

      if (typeof isRead === 'boolean') {
        notifications = notifications.filter(n => n.isRead === isRead);
      }

      // 计算分页
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedNotifications = notifications.slice(startIndex, endIndex);

      return {
        list: paginatedNotifications,
        total: notifications.length,
        page,
        pageSize,
        totalPages: Math.ceil(notifications.length / pageSize)
      };
    } catch (error) {
      logger.error(`获取用户 ${userId} 的通知列表失败:`, error);
      throw error;
    }
  }

  /**
   * 获取通知详情
   * @param {string} userId - 用户ID
   * @param {string} notificationId - 通知ID
   */
  getNotification(userId, notificationId) {
    try {
      const notifications = this.notifications.get(userId) || [];
      const notification = notifications.find(n => n.id === notificationId);

      if (!notification) {
        throw new Error('通知不存在');
      }

      return notification;
    } catch (error) {
      logger.error(`获取通知详情失败: ${notificationId}`, error);
      throw error;
    }
  }

  /**
   * 标记通知为已读
   * @param {string} userId - 用户ID
   * @param {string} notificationId - 通知ID
   */
  async markAsRead(userId, notificationId) {
    try {
      const notifications = this.notifications.get(userId);
      if (!notifications) {
        throw new Error('用户没有通知');
      }

      const notification = notifications.find(n => n.id === notificationId);
      if (!notification) {
        throw new Error('通知不存在');
      }

      // 已经是已读状态
      if (notification.isRead) {
        return notification;
      }

      // 更新通知状态
      notification.isRead = true;
      notification.readAt = Date.now();

      logger.info(`通知 ${notificationId} 已标记为已读`);
      return notification;
    } catch (error) {
      logger.error(`标记通知为已读失败: ${notificationId}`, error);
      throw error;
    }
  }

  /**
   * 标记所有通知为已读
   * @param {string} userId - 用户ID
   * @param {string} type - 可选，指定通知类型
   */
  async markAllAsRead(userId, type = null) {
    try {
      const notifications = this.notifications.get(userId);
      if (!notifications) {
        return { marked: 0 };
      }

      let count = 0;

      // 标记符合条件的通知为已读
      notifications.forEach(notification => {
        if (!notification.isRead && (!type || notification.type === type)) {
          notification.isRead = true;
          notification.readAt = Date.now();
          count++;
        }
      });

      logger.info(`用户 ${userId} 的 ${count} 条通知已标记为已读`);
      return { marked: count };
    } catch (error) {
      logger.error(`标记用户 ${userId} 的所有通知为已读失败:`, error);
      throw error;
    }
  }

  /**
   * 删除通知
   * @param {string} userId - 用户ID
   * @param {string} notificationId - 通知ID
   */
  async deleteNotification(userId, notificationId) {
    try {
      const notifications = this.notifications.get(userId);
      if (!notifications) {
        throw new Error('用户没有通知');
      }

      const index = notifications.findIndex(n => n.id === notificationId);
      if (index === -1) {
        throw new Error('通知不存在');
      }

      // 移除通知
      notifications.splice(index, 1);

      // 如果没有通知了，清除用户的通知列表
      if (notifications.length === 0) {
        this.notifications.delete(userId);
      }

      logger.info(`通知 ${notificationId} 已删除`);
      return { success: true };
    } catch (error) {
      logger.error(`删除通知失败: ${notificationId}`, error);
      throw error;
    }
  }

  /**
   * 批量删除通知
   * @param {string} userId - 用户ID
   * @param {Array} notificationIds - 通知ID列表
   */
  async deleteNotifications(userId, notificationIds) {
    try {
      const notifications = this.notifications.get(userId);
      if (!notifications) {
        return { deleted: 0 };
      }

      const originalLength = notifications.length;

      // 过滤保留不在删除列表中的通知
      const filteredNotifications = notifications.filter(
        notification => !notificationIds.includes(notification.id)
      );

      // 更新通知列表
      if (filteredNotifications.length === 0) {
        this.notifications.delete(userId);
      } else {
        this.notifications.set(userId, filteredNotifications);
      }

      const deletedCount = originalLength - filteredNotifications.length;
      logger.info(`已删除 ${deletedCount} 条通知`);
      return { deleted: deletedCount };
    } catch (error) {
      logger.error(`批量删除通知失败:`, error);
      throw error;
    }
  }

  /**
   * 获取未读通知数量
   * @param {string} userId - 用户ID
   * @param {string} type - 可选，指定通知类型
   */
  getUnreadCount(userId, type = null) {
    try {
      const notifications = this.notifications.get(userId) || [];
      
      let unreadCount = 0;
      notifications.forEach(notification => {
        if (!notification.isRead && (!type || notification.type === type)) {
          unreadCount++;
        }
      });

      return { count: unreadCount };
    } catch (error) {
      logger.error(`获取未读通知数量失败:`, error);
      return { count: 0 };
    }
  }

  /**
   * 批量创建通知
   * @param {Array} userIds - 用户ID列表
   * @param {Object} notificationData - 通知数据
   */
  async batchCreateNotifications(userIds, notificationData) {
    try {
      const promises = userIds.map(userId => 
        this.createNotification({
          ...notificationData,
          userId
        })
      );

      const results = await Promise.all(promises);
      logger.info(`已批量创建 ${results.length} 条通知`);
      return results;
    } catch (error) {
      logger.error('批量创建通知失败:', error);
      throw error;
    }
  }

  /**
   * 发送系统广播
   * @param {Object} params - 广播参数
   * @param {string} params.title - 广播标题
   * @param {string} params.content - 广播内容
   * @param {string} params.type - 通知类型
   * @param {Object} params.data - 附加数据
   */
  async sendBroadcast(params) {
    const {
      title,
      content,
      type = 'broadcast',
      data = {}
    } = params;

    try {
      // 发布广播事件
      if (cacheManager && typeof cacheManager.publish === 'function') {
        const broadcast = {
          id: `broadcast_${Date.now()}`,
          title,
          content,
          type,
          data,
          timestamp: Date.now()
        };
        
        await cacheManager.publish('notification.broadcast', broadcast);
        logger.info(`系统广播已发送: ${broadcast.id}`);
        return broadcast;
      }
      
      throw new Error('缓存管理器不可用');
    } catch (error) {
      logger.error('发送系统广播失败:', error);
      throw error;
    }
  }

  /**
   * 限制用户通知数量
   * @param {string} userId - 用户ID
   * @param {number} maxCount - 最大数量
   */
  limitNotifications(userId, maxCount) {
    const notifications = this.notifications.get(userId);
    if (notifications && notifications.length > maxCount) {
      // 只保留最新的maxCount条通知
      const limitedNotifications = notifications.slice(0, maxCount);
      this.notifications.set(userId, limitedNotifications);
      logger.debug(`用户 ${userId} 的通知已限制为 ${maxCount} 条`);
    }
  }

  /**
   * 清理过期通知
   * @param {number} days - 保留天数
   */
  async cleanupExpiredNotifications(days = 30) {
    try {
      const expireTime = Date.now() - (days * 24 * 60 * 60 * 1000);
      let deletedCount = 0;

      for (const [userId, notifications] of this.notifications.entries()) {
        const filteredNotifications = notifications.filter(n => n.createdAt > expireTime);
        
        if (filteredNotifications.length < notifications.length) {
          deletedCount += notifications.length - filteredNotifications.length;
          
          if (filteredNotifications.length === 0) {
            this.notifications.delete(userId);
          } else {
            this.notifications.set(userId, filteredNotifications);
          }
        }
      }

      logger.info(`清理了 ${deletedCount} 条过期通知`);
      return { deleted: deletedCount };
    } catch (error) {
      logger.error('清理过期通知失败:', error);
      throw error;
    }
  }

  /**
   * 获取通知统计信息
   * @param {string} userId - 用户ID
   */
  getStatistics(userId) {
    try {
      const notifications = this.notifications.get(userId) || [];
      
      const stats = {
        total: notifications.length,
        unread: 0,
        read: 0,
        byType: {}
      };

      notifications.forEach(notification => {
        if (notification.isRead) {
          stats.read++;
        } else {
          stats.unread++;
        }

        // 按类型统计
        if (!stats.byType[notification.type]) {
          stats.byType[notification.type] = { total: 0, unread: 0 };
        }
        stats.byType[notification.type].total++;
        if (!notification.isRead) {
          stats.byType[notification.type].unread++;
        }
      });

      return stats;
    } catch (error) {
      logger.error(`获取通知统计信息失败:`, error);
      return null;
    }
  }

  /**
   * 获取用户最近的通知
   * @param {string} userId - 用户ID
   * @param {number} count - 数量
   */
  getRecentNotifications(userId, count = 5) {
    try {
      const notifications = this.notifications.get(userId) || [];
      return notifications.slice(0, count);
    } catch (error) {
      logger.error(`获取最近通知失败:`, error);
      return [];
    }
  }
}

// 导出单例
module.exports = new NotificationService();