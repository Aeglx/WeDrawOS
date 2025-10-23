/**
 * 通知仓库模块
 * 处理系统通知相关的数据库操作
 */

const { Repository } = require('./Repository');
const { Logger } = require('../../logging/logger');
const { AppError } = require('../../errors/appError');

class NotificationRepository extends Repository {
  constructor() {
    super('notifications'); // 通知表名
    this.logger = Logger.getInstance();
    this.logger.info('Notification repository initialized');
  }

  /**
   * 获取通知仓库实例（单例模式）
   * @returns {NotificationRepository} 通知仓库实例
   */
  static getInstance() {
    if (!NotificationRepository.instance) {
      NotificationRepository.instance = new NotificationRepository();
    }
    return NotificationRepository.instance;
  }

  /**
   * 创建新通知
   * @param {Object} notificationData - 通知数据
   * @returns {Promise<Object>} 创建的通知
   */
  async create(notificationData) {
    try {
      // 验证必要字段
      if (!notificationData.userId) {
        throw new Error('User ID is required');
      }
      
      if (!notificationData.title && !notificationData.message) {
        throw new Error('Notification must have either title or message');
      }
      
      // 确保通知数据包含必要字段
      const dataToCreate = {
        ...notificationData,
        createdAt: notificationData.createdAt || new Date(),
        updatedAt: new Date(),
        isRead: notificationData.isRead || false,
        type: notificationData.type || 'general',
        data: notificationData.data || {},
        channels: notificationData.channels || ['inApp']
      };
      
      this.logger.debug('Creating notification', {
        userId: dataToCreate.userId,
        type: dataToCreate.type
      });
      
      const created = await super.create(dataToCreate);
      
      this.logger.info('Notification created successfully', {
        notificationId: created.id,
        userId: created.userId
      });
      
      return created;
    } catch (error) {
      this.logger.error('Failed to create notification:', error);
      throw new AppError(`Failed to create notification: ${error.message}`, 500, error);
    }
  }

  /**
   * 根据ID查找通知
   * @param {string|number} id - 通知ID
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} 通知对象
   */
  async findById(id, options = {}) {
    try {
      this.logger.debug('Finding notification by ID', { notificationId: id });
      
      const notification = await super.findById(id, {
        ...options,
        populate: options.populate || ['userId']
      });
      
      if (notification) {
        return this._formatNotificationData(notification);
      }
      
      return null;
    } catch (error) {
      this.logger.error(`Failed to find notification ${id}:`, error);
      throw new AppError(`Failed to find notification: ${error.message}`, 500, error);
    }
  }

  /**
   * 更新通知
   * @param {string|number} id - 通知ID
   * @param {Object} updateData - 更新数据
   * @param {Object} options - 更新选项
   * @returns {Promise<Object>} 更新后的通知
   */
  async update(id, updateData, options = {}) {
    try {
      this.logger.debug('Updating notification', { notificationId: id });
      
      // 确保包含更新时间
      const dataToUpdate = {
        ...updateData,
        updatedAt: new Date()
      };
      
      // 构建查询条件
      const query = { id };
      
      // 如果指定了userId，添加到查询条件中
      if (options.userId) {
        query.userId = options.userId;
      }
      
      const updated = await super.updateByQuery(query, dataToUpdate);
      
      if (!updated) {
        return null;
      }
      
      this.logger.info('Notification updated successfully', {
        notificationId: id,
        isRead: dataToUpdate.isRead
      });
      
      return this._formatNotificationData(updated);
    } catch (error) {
      this.logger.error(`Failed to update notification ${id}:`, error);
      throw new AppError(`Failed to update notification: ${error.message}`, 500, error);
    }
  }

  /**
   * 批量更新通知
   * @param {Object} query - 查询条件
   * @param {Object} updateData - 更新数据
   * @returns {Promise<Object>} 更新结果
   */
  async updateMany(query, updateData) {
    try {
      this.logger.debug('Updating multiple notifications', {
        query: query.userId ? { userId: query.userId } : 'all users', // 保护隐私
        updateFields: Object.keys(updateData)
      });
      
      // 添加更新时间
      const dataToUpdate = {
        ...updateData,
        updatedAt: new Date()
      };
      
      const result = await super.updateMany(query, dataToUpdate);
      
      this.logger.info('Multiple notifications updated successfully', {
        modifiedCount: result.modifiedCount
      });
      
      return result;
    } catch (error) {
      this.logger.error('Failed to update multiple notifications:', error);
      throw new AppError('Failed to update notifications', 500, error);
    }
  }

  /**
   * 查找用户的通知（分页）
   * @param {Object} query - 查询条件
   * @param {number} page - 页码
   * @param {number} limit - 每页数量
   * @param {Object} sort - 排序条件
   * @returns {Promise<Object>} 分页通知列表
   */
  async findPaged(query, page = 1, limit = 20, sort = { createdAt: -1 }) {
    try {
      this.logger.debug('Finding notifications with pagination', {
        query: query.userId ? { userId: query.userId } : 'all users', // 保护隐私
        page,
        limit
      });
      
      // 执行分页查询
      const result = await super.findPaged(query, page, limit, sort, ['userId']);
      
      // 格式化通知数据
      result.items = result.items.map(notification => this._formatNotificationData(notification));
      
      return result;
    } catch (error) {
      this.logger.error('Failed to find notifications with pagination:', error);
      throw new AppError('Failed to retrieve notifications', 500, error);
    }
  }

  /**
   * 根据用户ID查找通知
   * @param {string|number} userId - 用户ID
   * @param {Object} filter - 过滤条件
   * @param {number} limit - 限制数量
   * @returns {Promise<Array>} 通知列表
   */
  async findByUserId(userId, filter = {}, limit = 50) {
    try {
      this.logger.debug('Finding notifications by user ID', { userId, limit });
      
      const query = {
        userId,
        ...filter
      };
      
      const notifications = await this.find(query, { createdAt: -1 }, limit, ['userId']);
      
      return notifications.map(notification => this._formatNotificationData(notification));
    } catch (error) {
      this.logger.error(`Failed to find notifications for user ${userId}:`, error);
      throw new AppError('Failed to retrieve user notifications', 500, error);
    }
  }

  /**
   * 获取用户的未读通知
   * @param {string|number} userId - 用户ID
   * @param {number} limit - 限制数量
   * @returns {Promise<Array>} 未读通知列表
   */
  async getUnreadNotifications(userId, limit = 50) {
    try {
      this.logger.debug('Finding unread notifications', { userId, limit });
      
      return await this.findByUserId(userId, { isRead: false }, limit);
    } catch (error) {
      this.logger.error(`Failed to find unread notifications for user ${userId}:`, error);
      throw new AppError('Failed to retrieve unread notifications', 500, error);
    }
  }

  /**
   * 计算用户的未读通知数量
   * @param {string|number} userId - 用户ID
   * @returns {Promise<number>} 未读通知数量
   */
  async countUnread(userId) {
    try {
      this.logger.debug('Counting unread notifications', { userId });
      
      return await this.count({ userId, isRead: false });
    } catch (error) {
      this.logger.error(`Failed to count unread notifications for user ${userId}:`, error);
      throw new AppError('Failed to count unread notifications', 500, error);
    }
  }

  /**
   * 按类型获取通知统计
   * @param {Object} query - 查询条件
   * @returns {Promise<Object>} 统计信息
   */
  async getStatistics(query) {
    try {
      this.logger.debug('Getting notification statistics', {
        query: query.userId ? { userId: query.userId } : 'all users' // 保护隐私
      });
      
      // 获取所有通知
      const notifications = await this.find(query);
      
      // 计算总数
      const totalCount = notifications.length;
      const unreadCount = notifications.filter(n => !n.isRead).length;
      const readCount = totalCount - unreadCount;
      
      // 按类型分组
      const byType = notifications.reduce((acc, notification) => {
        if (!acc[notification.type]) {
          acc[notification.type] = {
            count: 0,
            unread: 0
          };
        }
        acc[notification.type].count++;
        if (!notification.isRead) {
          acc[notification.type].unread++;
        }
        return acc;
      }, {});
      
      // 按日期分组（最近7天）
      const byDay = {};
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      notifications.forEach(notification => {
        const date = new Date(notification.createdAt);
        if (date >= sevenDaysAgo) {
          const dateKey = date.toISOString().split('T')[0];
          if (!byDay[dateKey]) {
            byDay[dateKey] = {
              date: dateKey,
              count: 0,
              unread: 0
            };
          }
          byDay[dateKey].count++;
          if (!notification.isRead) {
            byDay[dateKey].unread++;
          }
        }
      });
      
      return {
        totalCount,
        unreadCount,
        readCount,
        byType,
        byDay: Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date)),
        lastNotification: notifications.length > 0 ? 
          notifications.reduce((latest, current) => 
            new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest
          ) : null
      };
    } catch (error) {
      this.logger.error('Failed to get notification statistics:', error);
      throw new AppError('Failed to retrieve notification statistics', 500, error);
    }
  }

  /**
   * 批量创建通知
   * @param {Array} notifications - 通知数组
   * @returns {Promise<Array>} 创建的通知列表
   */
  async bulkCreate(notifications) {
    try {
      this.logger.debug('Creating bulk notifications', { count: notifications.length });
      
      // 准备通知数据
      const notificationsToCreate = notifications.map(n => ({
        ...n,
        createdAt: n.createdAt || new Date(),
        updatedAt: new Date(),
        isRead: n.isRead || false,
        type: n.type || 'general',
        data: n.data || {},
        channels: n.channels || ['inApp']
      }));
      
      const created = await super.bulkCreate(notificationsToCreate);
      
      this.logger.info('Bulk notifications created successfully', { count: created.length });
      
      return created.map(notification => this._formatNotificationData(notification));
    } catch (error) {
      this.logger.error('Failed to create bulk notifications:', error);
      throw new AppError('Failed to create bulk notifications', 500, error);
    }
  }

  /**
   * 删除通知
   * @param {string|number} id - 通知ID
   * @param {Object} options - 删除选项
   * @returns {Promise<boolean>} 是否删除成功
   */
  async delete(id, options = {}) {
    try {
      this.logger.debug('Deleting notification', { notificationId: id });
      
      // 构建查询条件
      const query = { id };
      
      // 如果指定了userId，添加到查询条件中
      if (options.userId) {
        query.userId = options.userId;
      }
      
      const result = await super.deleteByQuery(query);
      
      if (result.deletedCount > 0) {
        this.logger.info('Notification deleted successfully', { notificationId: id });
        return true;
      }
      
      return false;
    } catch (error) {
      this.logger.error(`Failed to delete notification ${id}:`, error);
      throw new AppError('Failed to delete notification', 500, error);
    }
  }

  /**
   * 批量删除通知
   * @param {Object} query - 查询条件
   * @returns {Promise<Object>} 删除结果
   */
  async deleteMany(query) {
    try {
      this.logger.debug('Deleting multiple notifications', {
        query: query.userId ? { userId: query.userId } : 'all users' // 保护隐私
      });
      
      const result = await super.deleteMany(query);
      
      this.logger.info('Multiple notifications deleted successfully', {
        deletedCount: result.deletedCount
      });
      
      return result;
    } catch (error) {
      this.logger.error('Failed to delete multiple notifications:', error);
      throw new AppError('Failed to delete notifications', 500, error);
    }
  }

  /**
   * 清理旧通知
   * @param {Date} beforeDate - 删除此日期之前的通知
   * @param {Object} options - 额外选项
   * @returns {Promise<Object>} 清理结果
   */
  async cleanupOldNotifications(beforeDate, options = {}) {
    try {
      this.logger.debug('Cleaning up old notifications', {
        beforeDate: beforeDate.toISOString(),
        options
      });
      
      // 构建查询条件
      const query = { createdAt: { $lt: beforeDate } };
      
      // 如果指定了用户ID，只清理该用户的通知
      if (options.userId) {
        query.userId = options.userId;
      }
      
      // 如果指定了只清理已读通知
      if (options.onlyRead) {
        query.isRead = true;
      }
      
      const result = await this.deleteMany(query);
      
      this.logger.info('Old notifications cleaned up', {
        deletedCount: result.deletedCount,
        beforeDate: beforeDate.toISOString()
      });
      
      return result;
    } catch (error) {
      this.logger.error('Failed to clean up old notifications:', error);
      throw new AppError('Failed to clean up old notifications', 500, error);
    }
  }

  /**
   * 搜索通知
   * @param {Object} searchCriteria - 搜索条件
   * @param {number} page - 页码
   * @param {number} limit - 每页数量
   * @returns {Promise<Object>} 搜索结果
   */
  async search(searchCriteria, page = 1, limit = 20) {
    try {
      this.logger.debug('Searching notifications', {
        searchTerm: searchCriteria.searchTerm,
        page,
        limit
      });
      
      // 构建搜索查询
      const query = {};
      
      // 用户ID过滤
      if (searchCriteria.userId) {
        query.userId = searchCriteria.userId;
      }
      
      // 类型过滤
      if (searchCriteria.type) {
        query.type = searchCriteria.type;
      }
      
      // 已读/未读过滤
      if (searchCriteria.isRead !== undefined) {
        query.isRead = searchCriteria.isRead;
      }
      
      // 日期范围过滤
      if (searchCriteria.startDate) {
        query.createdAt = { ...query.createdAt, $gte: new Date(searchCriteria.startDate) };
      }
      
      if (searchCriteria.endDate) {
        query.createdAt = { ...query.createdAt, $lte: new Date(searchCriteria.endDate) };
      }
      
      // 文本搜索（如果支持）
      if (searchCriteria.searchTerm) {
        // 这里应该根据数据库类型实现全文搜索
        query.$or = [
          { title: { $regex: searchCriteria.searchTerm, $options: 'i' } },
          { message: { $regex: searchCriteria.searchTerm, $options: 'i' } }
        ];
      }
      
      // 执行分页查询
      const result = await this.findPaged(query, page, limit, { createdAt: -1 });
      
      return result;
    } catch (error) {
      this.logger.error('Failed to search notifications:', error);
      throw new AppError('Failed to search notifications', 500, error);
    }
  }

  /**
   * 按类型获取通知
   * @param {string|number} userId - 用户ID
   * @param {string} type - 通知类型
   * @param {number} limit - 限制数量
   * @returns {Promise<Array>} 通知列表
   */
  async findByType(userId, type, limit = 50) {
    try {
      this.logger.debug('Finding notifications by type', { userId, type, limit });
      
      return await this.findByUserId(userId, { type }, limit);
    } catch (error) {
      this.logger.error(`Failed to find notifications by type for user ${userId}:`, error);
      throw new AppError('Failed to retrieve notifications by type', 500, error);
    }
  }

  /**
   * 获取最近的通知
   * @param {string|number} userId - 用户ID
   * @param {number} limit - 限制数量
   * @returns {Promise<Array>} 最近的通知
   */
  async getRecentNotifications(userId, limit = 10) {
    try {
      this.logger.debug('Getting recent notifications', { userId, limit });
      
      return await this.findByUserId(userId, {}, limit);
    } catch (error) {
      this.logger.error(`Failed to get recent notifications for user ${userId}:`, error);
      throw new AppError('Failed to retrieve recent notifications', 500, error);
    }
  }

  /**
   * 格式化通知数据
   * @private
   * @param {Object} notification - 原始通知数据
   * @returns {Object} 格式化后的通知数据
   */
  _formatNotificationData(notification) {
    // 避免修改原始对象
    const formatted = { ...notification };
    
    // 确保日期是正确的Date对象
    if (formatted.createdAt && !(formatted.createdAt instanceof Date)) {
      formatted.createdAt = new Date(formatted.createdAt);
    }
    
    if (formatted.updatedAt && !(formatted.updatedAt instanceof Date)) {
      formatted.updatedAt = new Date(formatted.updatedAt);
    }
    
    if (formatted.readAt && !(formatted.readAt instanceof Date)) {
      formatted.readAt = new Date(formatted.readAt);
    }
    
    // 计算相对时间
    if (formatted.createdAt) {
      formatted.relativeTime = this._getRelativeTime(formatted.createdAt);
    }
    
    // 确保数据字段是对象
    if (!formatted.data || typeof formatted.data !== 'object') {
      formatted.data = {};
    }
    
    return formatted;
  }

  /**
   * 获取相对时间描述
   * @private
   * @param {Date} date - 日期
   * @returns {string} 相对时间描述
   */
  _getRelativeTime(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffSecs < 60) {
      return 'just now';
    } else if (diffMins < 60) {
      return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays < 30) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  /**
   * 设置通知已读状态
   * @param {Array} notificationIds - 通知ID数组
   * @param {string|number} userId - 用户ID
   * @param {boolean} isRead - 是否已读
   * @returns {Promise<number>} 更新的通知数量
   */
  async setReadStatus(notificationIds, userId, isRead = true) {
    try {
      this.logger.debug('Setting notification read status', {
        count: notificationIds.length,
        userId,
        isRead
      });
      
      const updateData = {
        isRead,
        updatedAt: new Date()
      };
      
      if (isRead) {
        updateData.readAt = new Date();
      }
      
      const result = await this.updateMany(
        { 
          id: { $in: notificationIds },
          userId 
        },
        updateData
      );
      
      this.logger.info('Notification read status updated', {
        updatedCount: result.modifiedCount,
        isRead
      });
      
      return result.modifiedCount;
    } catch (error) {
      this.logger.error('Failed to set notification read status:', error);
      throw new AppError('Failed to update notification read status', 500, error);
    }
  }

  /**
   * 开始事务
   * @returns {Promise<Object>} 事务对象
   */
  async startTransaction() {
    try {
      this.logger.debug('Starting notification transaction');
      return await super.startTransaction();
    } catch (error) {
      this.logger.error('Failed to start notification transaction:', error);
      throw new AppError('Failed to start transaction', 500, error);
    }
  }

  /**
   * 提交事务
   * @param {Object} transaction - 事务对象
   * @returns {Promise<void>}
   */
  async commitTransaction(transaction) {
    try {
      this.logger.debug('Committing notification transaction');
      await super.commitTransaction(transaction);
    } catch (error) {
      this.logger.error('Failed to commit notification transaction:', error);
      throw new AppError('Failed to commit transaction', 500, error);
    }
  }

  /**
   * 回滚事务
   * @param {Object} transaction - 事务对象
   * @returns {Promise<void>}
   */
  async rollbackTransaction(transaction) {
    try {
      this.logger.debug('Rolling back notification transaction');
      await super.rollbackTransaction(transaction);
    } catch (error) {
      this.logger.error('Failed to rollback notification transaction:', error);
      throw new AppError('Failed to rollback transaction', 500, error);
    }
  }
}

module.exports = { NotificationRepository };