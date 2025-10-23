/**
 * 通知服务模块
 * 提供统一的系统通知、消息推送和提醒功能
 */

const { Config } = require('../config/config');
const { Logger } = require('../logging/logger');
const { AppError } = require('../errors/appError');
const { EmailService } = require('./emailService');
const { NotificationRepository } = require('../database/repositories/NotificationRepository');
const { UserRepository } = require('../database/repositories/UserRepository');

class NotificationService {
  constructor() {
    this.config = Config.getInstance();
    this.logger = Logger.getInstance();
    this.emailService = EmailService.getInstance();
    this.notificationRepository = NotificationRepository.getInstance();
    this.userRepository = UserRepository.getInstance();
    
    // 通知通道配置
    this.channels = {
      email: true,
      inApp: true,
      push: false, // 需要额外配置推送服务
      sms: false   // 需要额外配置短信服务
    };
    
    // 通知模板
    this.templates = this._loadTemplates();
    
    this.logger.info('Notification service initialized');
  }

  /**
   * 获取通知服务实例（单例模式）
   * @returns {NotificationService} 通知服务实例
   */
  static getInstance() {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * 加载通知模板
   * @private
   * @returns {Object} 通知模板
   */
  _loadTemplates() {
    return {
      welcome: {
        title: 'Welcome to {{appName}}',
        message: 'Hello {{userName}}, welcome to {{appName}}!',
        channels: ['inApp', 'email']
      },
      orderConfirmation: {
        title: 'Order Confirmation #{{orderId}}',
        message: 'Your order #{{orderId}} has been confirmed.',
        channels: ['inApp', 'email']
      },
      orderStatusUpdate: {
        title: 'Order Status Update: #{{orderId}}',
        message: 'Your order #{{orderId}} status has changed to {{status}}.',
        channels: ['inApp', 'email']
      },
      passwordReset: {
        title: 'Password Reset Request',
        message: 'We received a request to reset your password.',
        channels: ['email']
      },
      paymentConfirmation: {
        title: 'Payment Confirmation',
        message: 'Your payment of {{amount}} has been processed successfully.',
        channels: ['inApp', 'email']
      },
      securityAlert: {
        title: 'Security Alert',
        message: 'We detected unusual activity on your account.',
        channels: ['inApp', 'email', 'push']
      },
      productRestock: {
        title: '{{productName}} is back in stock!',
        message: 'The product you were interested in is now available.',
        channels: ['inApp', 'email']
      },
      promotion: {
        title: 'Special Offer: {{offerTitle}}',
        message: '{{offerDescription}}',
        channels: ['inApp']
      }
    };
  }

  /**
   * 发送通知
   * @param {Object} notificationData - 通知数据
   * @param {string} notificationData.userId - 用户ID
   * @param {string} notificationData.type - 通知类型
   * @param {Object} notificationData.data - 通知数据
   * @param {Array} notificationData.channels - 通知通道
   * @param {boolean} notificationData.isRead - 是否已读
   * @returns {Promise<Object>} 通知结果
   */
  async sendNotification(notificationData) {
    try {
      this.logger.info('Sending notification', {
        userId: notificationData.userId,
        type: notificationData.type
      });
      
      // 验证必要字段
      if (!notificationData.userId) {
        throw new Error('User ID is required');
      }
      
      if (!notificationData.type) {
        throw new Error('Notification type is required');
      }
      
      // 检查用户是否存在
      const user = await this.userRepository.findById(notificationData.userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      // 获取通知模板
      const template = this.templates[notificationData.type];
      if (!template) {
        this.logger.warn(`Notification template not found for type: ${notificationData.type}`);
      }
      
      // 准备通知内容
      const notification = {
        userId: notificationData.userId,
        type: notificationData.type,
        title: this._renderTemplate(template?.title || 'Notification', notificationData.data || {}),
        message: this._renderTemplate(template?.message || '', notificationData.data || {}),
        data: notificationData.data || {},
        isRead: notificationData.isRead || false,
        createdAt: new Date(),
        channels: notificationData.channels || template?.channels || ['inApp']
      };
      
      // 保存通知到数据库
      const savedNotification = await this.notificationRepository.create(notification);
      
      // 发送到各个通道
      await this._sendToChannels(notification, user);
      
      this.logger.info('Notification sent successfully', {
        notificationId: savedNotification.id,
        userId: notification.userId,
        type: notification.type
      });
      
      return {
        success: true,
        notificationId: savedNotification.id,
        sentChannels: notification.channels
      };
    } catch (error) {
      this.logger.error('Failed to send notification:', error);
      throw new AppError(`Failed to send notification: ${error.message}`, 500, error);
    }
  }

  /**
   * 发送批量通知
   * @param {Array} userIds - 用户ID数组
   * @param {Object} notificationData - 通知数据
   * @returns {Promise<Array>} 通知结果数组
   */
  async sendBulkNotification(userIds, notificationData) {
    try {
      this.logger.info('Sending bulk notification', {
        userCount: userIds.length,
        type: notificationData.type
      });
      
      if (!Array.isArray(userIds) || userIds.length === 0) {
        throw new Error('User IDs array is required');
      }
      
      const results = [];
      
      // 批量发送通知
      for (const userId of userIds) {
        try {
          const result = await this.sendNotification({
            ...notificationData,
            userId
          });
          results.push({ userId, ...result });
        } catch (error) {
          results.push({
            userId,
            success: false,
            error: error.message
          });
          this.logger.error(`Failed to send notification to user ${userId}:`, error);
        }
      }
      
      this.logger.info('Bulk notification processing completed', {
        total: userIds.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      });
      
      return results;
    } catch (error) {
      this.logger.error('Failed to process bulk notification:', error);
      throw new AppError('Failed to process bulk notification', 500, error);
    }
  }

  /**
   * 发送系统通知（给所有用户）
   * @param {Object} notificationData - 通知数据
   * @returns {Promise<Object>} 通知结果
   */
  async sendSystemNotification(notificationData) {
    try {
      this.logger.info('Sending system notification', { type: notificationData.type });
      
      // 获取所有用户ID
      const users = await this.userRepository.findAll({}, { id: 1 }, 0);
      const userIds = users.map(user => user.id);
      
      // 发送批量通知
      const results = await this.sendBulkNotification(userIds, notificationData);
      
      return {
        totalUsers: userIds.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        details: results
      };
    } catch (error) {
      this.logger.error('Failed to send system notification:', error);
      throw new AppError('Failed to send system notification', 500, error);
    }
  }

  /**
   * 发送通知到各个通道
   * @private
   * @param {Object} notification - 通知对象
   * @param {Object} user - 用户对象
   */
  async _sendToChannels(notification, user) {
    try {
      // 处理每个启用的通道
      for (const channel of notification.channels) {
        if (this.channels[channel]) {
          try {
            switch (channel) {
              case 'email':
                await this._sendEmailNotification(notification, user);
                break;
              case 'inApp':
                // 已保存到数据库，不需要额外操作
                this.logger.debug('In-app notification sent', { 
                  notificationId: notification.id,
                  userId: user.id 
                });
                break;
              case 'push':
                await this._sendPushNotification(notification, user);
                break;
              case 'sms':
                await this._sendSmsNotification(notification, user);
                break;
              default:
                this.logger.warn(`Unknown notification channel: ${channel}`);
            }
          } catch (error) {
            this.logger.error(`Failed to send notification via ${channel} channel:`, error);
            // 继续处理其他通道，不中断
          }
        }
      }
    } catch (error) {
      this.logger.error('Error sending notifications to channels:', error);
    }
  }

  /**
   * 发送邮件通知
   * @private
   * @param {Object} notification - 通知对象
   * @param {Object} user - 用户对象
   */
  async _sendEmailNotification(notification, user) {
    if (!user.email) {
      this.logger.warn('User has no email address', { userId: user.id });
      return;
    }
    
    // 根据通知类型选择模板
    const emailTemplate = notification.type === 'welcome' ? 'welcome' : 'notification';
    
    await this.emailService.sendTemplatedEmail(emailTemplate, {
      user: {
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User'
      },
      notification: {
        title: notification.title,
        message: notification.message,
        type: notification.type,
        data: notification.data,
        createdAt: notification.createdAt
      },
      appName: this.config.get('app.name', 'Our Application'),
      appUrl: this.config.get('app.url', 'https://example.com'),
      currentYear: new Date().getFullYear()
    }, {
      to: user.email,
      subject: notification.title
    });
  }

  /**
   * 发送推送通知（模拟实现）
   * @private
   * @param {Object} notification - 通知对象
   * @param {Object} user - 用户对象
   */
  async _sendPushNotification(notification, user) {
    // 实际实现中应该调用推送服务API
    this.logger.info('Sending push notification', {
      userId: user.id,
      title: notification.title
    });
    
    // 这里应该实现与FCM、APNS等推送服务的集成
    // 由于这是模拟实现，我们只记录日志
    
    if (!user.pushToken) {
      this.logger.warn('User has no push token', { userId: user.id });
    }
  }

  /**
   * 发送短信通知（模拟实现）
   * @private
   * @param {Object} notification - 通知对象
   * @param {Object} user - 用户对象
   */
  async _sendSmsNotification(notification, user) {
    // 实际实现中应该调用短信服务API
    this.logger.info('Sending SMS notification', {
      userId: user.id,
      message: notification.message.substring(0, 50) + '...'
    });
    
    if (!user.phoneNumber) {
      this.logger.warn('User has no phone number', { userId: user.id });
    }
  }

  /**
   * 渲染模板
   * @private
   * @param {string} template - 模板字符串
   * @param {Object} data - 模板数据
   * @returns {string} 渲染后的字符串
   */
  _renderTemplate(template, data) {
    if (!template) return '';
    
    return template.replace(/\{\{([^{}]+)\}\}/g, (match, key) => {
      const keys = key.trim().split('.');
      let value = data;
      
      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k];
        } else {
          return '';
        }
      }
      
      return value !== undefined ? value : '';
    });
  }

  /**
   * 获取用户通知
   * @param {string} userId - 用户ID
   * @param {Object} filter - 过滤条件
   * @param {number} page - 页码
   * @param {number} limit - 每页数量
   * @returns {Promise<Object>} 通知列表
   */
  async getUserNotifications(userId, filter = {}, page = 1, limit = 20) {
    try {
      this.logger.info('Getting user notifications', { userId, page, limit });
      
      // 构建查询条件
      const query = {
        userId,
        ...filter
      };
      
      // 获取通知列表
      const notifications = await this.notificationRepository.findPaged(query, page, limit, { createdAt: -1 });
      
      return notifications;
    } catch (error) {
      this.logger.error(`Failed to get notifications for user ${userId}:`, error);
      throw new AppError('Failed to retrieve notifications', 500, error);
    }
  }

  /**
   * 标记通知为已读
   * @param {string} notificationId - 通知ID
   * @param {string} userId - 用户ID
   * @returns {Promise<Object>} 更新后的通知
   */
  async markAsRead(notificationId, userId) {
    try {
      this.logger.info('Marking notification as read', {
        notificationId,
        userId
      });
      
      // 更新通知状态
      const updated = await this.notificationRepository.update(notificationId, {
        isRead: true,
        readAt: new Date()
      }, {
        userId // 确保只更新该用户的通知
      });
      
      if (!updated) {
        throw new Error('Notification not found or access denied');
      }
      
      return updated;
    } catch (error) {
      this.logger.error(`Failed to mark notification ${notificationId} as read:`, error);
      throw new AppError(`Failed to mark notification as read: ${error.message}`, 500, error);
    }
  }

  /**
   * 标记所有通知为已读
   * @param {string} userId - 用户ID
   * @returns {Promise<number>} 更新的通知数量
   */
  async markAllAsRead(userId) {
    try {
      this.logger.info('Marking all notifications as read', { userId });
      
      // 更新所有未读通知
      const result = await this.notificationRepository.updateMany(
        { userId, isRead: false },
        { isRead: true, readAt: new Date() }
      );
      
      return result.modifiedCount;
    } catch (error) {
      this.logger.error(`Failed to mark all notifications as read for user ${userId}:`, error);
      throw new AppError('Failed to mark all notifications as read', 500, error);
    }
  }

  /**
   * 删除通知
   * @param {string} notificationId - 通知ID
   * @param {string} userId - 用户ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  async deleteNotification(notificationId, userId) {
    try {
      this.logger.info('Deleting notification', {
        notificationId,
        userId
      });
      
      // 删除通知
      const deleted = await this.notificationRepository.delete(notificationId, {
        userId // 确保只删除该用户的通知
      });
      
      if (!deleted) {
        throw new Error('Notification not found or access denied');
      }
      
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete notification ${notificationId}:`, error);
      throw new AppError(`Failed to delete notification: ${error.message}`, 500, error);
    }
  }

  /**
   * 清除所有通知
   * @param {string} userId - 用户ID
   * @returns {Promise<number>} 删除的通知数量
   */
  async clearAllNotifications(userId) {
    try {
      this.logger.info('Clearing all notifications', { userId });
      
      // 删除所有通知
      const result = await this.notificationRepository.deleteMany({ userId });
      
      return result.deletedCount;
    } catch (error) {
      this.logger.error(`Failed to clear all notifications for user ${userId}:`, error);
      throw new AppError('Failed to clear all notifications', 500, error);
    }
  }

  /**
   * 获取通知统计信息
   * @param {string} userId - 用户ID
   * @returns {Promise<Object>} 统计信息
   */
  async getNotificationStats(userId) {
    try {
      this.logger.info('Getting notification statistics', { userId });
      
      // 获取统计信息
      const stats = await this.notificationRepository.getStatistics({ userId });
      
      return stats;
    } catch (error) {
      this.logger.error(`Failed to get notification stats for user ${userId}:`, error);
      throw new AppError('Failed to retrieve notification statistics', 500, error);
    }
  }

  /**
   * 创建通知设置
   * @param {string} userId - 用户ID
   * @param {Object} settings - 通知设置
   * @returns {Promise<Object>} 通知设置
   */
  async createNotificationSettings(userId, settings) {
    try {
      this.logger.info('Creating notification settings', { userId });
      
      // 这里应该保存用户的通知首选项
      // 例如：哪些类型的通知通过哪些通道发送
      
      const notificationSettings = {
        userId,
        preferences: settings || {},
        updatedAt: new Date()
      };
      
      // 实际实现中应该保存到数据库
      // 这里返回模拟数据
      return notificationSettings;
    } catch (error) {
      this.logger.error(`Failed to create notification settings for user ${userId}:`, error);
      throw new AppError('Failed to create notification settings', 500, error);
    }
  }

  /**
   * 获取通知设置
   * @param {string} userId - 用户ID
   * @returns {Promise<Object>} 通知设置
   */
  async getNotificationSettings(userId) {
    try {
      this.logger.info('Getting notification settings', { userId });
      
      // 实际实现中应该从数据库获取
      // 这里返回默认设置
      return {
        userId,
        preferences: {
          welcome: { email: true, inApp: true },
          orderConfirmation: { email: true, inApp: true },
          orderStatusUpdate: { email: true, inApp: true },
          passwordReset: { email: true },
          paymentConfirmation: { email: true, inApp: true },
          securityAlert: { email: true, inApp: true, push: true },
          productRestock: { email: false, inApp: true },
          promotion: { email: false, inApp: true }
        },
        updatedAt: new Date()
      };
    } catch (error) {
      this.logger.error(`Failed to get notification settings for user ${userId}:`, error);
      throw new AppError('Failed to retrieve notification settings', 500, error);
    }
  }

  /**
   * 检查是否有未读通知
   * @param {string} userId - 用户ID
   * @returns {Promise<boolean>} 是否有未读通知
   */
  async hasUnreadNotifications(userId) {
    try {
      const count = await this.notificationRepository.count({ 
        userId, 
        isRead: false 
      });
      
      return count > 0;
    } catch (error) {
      this.logger.error(`Failed to check unread notifications for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * 注册设备令牌（用于推送通知）
   * @param {string} userId - 用户ID
   * @param {string} deviceToken - 设备令牌
   * @param {string} deviceType - 设备类型
   * @returns {Promise<Object>} 注册结果
   */
  async registerDeviceToken(userId, deviceToken, deviceType) {
    try {
      this.logger.info('Registering device token', { userId, deviceType });
      
      // 实际实现中应该保存设备令牌到数据库
      // 这里返回模拟数据
      return {
        userId,
        deviceToken,
        deviceType,
        registeredAt: new Date()
      };
    } catch (error) {
      this.logger.error(`Failed to register device token for user ${userId}:`, error);
      throw new AppError('Failed to register device token', 500, error);
    }
  }
}

module.exports = { NotificationService };