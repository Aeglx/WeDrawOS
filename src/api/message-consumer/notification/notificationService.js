/**
 * 通知服务
 * 提供各种通知发送功能
 */

const logger = require('../../core/utils/logger');
const emailService = require('../../core/services/emailService');
const smsService = require('../../core/services/smsService');
const pushService = require('../../core/services/pushService');
const wechatService = require('../../core/services/wechatService');

class NotificationService {
  /**
   * 发送通知
   * @param {Object} notification - 通知对象
   * @param {string} notification.userId - 用户ID
   * @param {string} notification.type - 通知类型
   * @param {string} notification.title - 通知标题
   * @param {string} notification.content - 通知内容
   * @param {Object} notification.data - 通知数据
   * @param {Array} notification.channels - 通知渠道 ['app', 'email', 'sms', 'wechat']
   */
  static async sendNotification(notification) {
    try {
      logger.info('发送通知:', notification);
      
      const { userId, type, title, content, data, channels = ['app'] } = notification;
      
      // 确保通知对象有效
      if (!userId || !type || !title) {
        throw new Error('通知对象缺少必要字段');
      }
      
      // 获取用户联系方式（实际应该从数据库获取）
      const userContact = await this._getUserContactInfo(userId);
      
      // 定义通知任务
      const notificationTasks = [];
      
      // 应用内推送
      if (channels.includes('app') && userContact.deviceToken) {
        notificationTasks.push(
          pushService.sendPushNotification({
            token: userContact.deviceToken,
            title,
            body: content,
            data: { ...data, type, userId }
          })
        );
      }
      
      // 邮件通知
      if (channels.includes('email') && userContact.email) {
        notificationTasks.push(
          emailService.sendEmail({
            to: userContact.email,
            subject: title,
            text: content,
            html: this._formatEmailHtml(title, content, data)
          })
        );
      }
      
      // 短信通知
      if (channels.includes('sms') && userContact.phone) {
        notificationTasks.push(
          smsService.sendSMS({
            phone: userContact.phone,
            content: `${title}：${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`
          })
        );
      }
      
      // 微信通知
      if (channels.includes('wechat') && userContact.openId) {
        notificationTasks.push(
          wechatService.sendTemplateMessage({
            touser: userContact.openId,
            template_id: this._getWechatTemplateId(type),
            data: this._formatWechatTemplateData(title, content, data)
          })
        );
      }
      
      // 执行所有通知任务
      const results = await Promise.allSettled(notificationTasks);
      
      // 处理通知结果
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failCount = results.filter(r => r.status === 'rejected').length;
      
      logger.info(`通知发送完成，成功: ${successCount}, 失败: ${failCount}`);
      
      // 记录通知历史（实际应该存入数据库）
      await this._recordNotificationHistory(notification, results);
      
      return {
        success: true,
        successCount,
        failCount
      };
    } catch (error) {
      logger.error('发送通知失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 批量发送通知
   * @param {Array} notifications - 通知数组
   */
  static async sendBatchNotifications(notifications) {
    try {
      logger.info(`批量发送通知，数量: ${notifications.length}`);
      
      const results = await Promise.all(
        notifications.map(notification => this.sendNotification(notification))
      );
      
      return results;
    } catch (error) {
      logger.error('批量发送通知失败:', error);
      throw error;
    }
  }

  /**
   * 发送系统广播
   * @param {Object} broadcast - 广播信息
   */
  static async sendBroadcast(broadcast) {
    try {
      logger.info('发送系统广播:', broadcast);
      
      const { title, content, data, channels = ['app'], targetUsers = 'all' } = broadcast;
      
      // 获取目标用户ID列表（实际应该从数据库查询）
      const userIds = targetUsers === 'all' 
        ? await this._getAllActiveUserIds()
        : targetUsers;
      
      // 创建通知数组
      const notifications = userIds.map(userId => ({
        userId,
        type: 'broadcast',
        title,
        content,
        data,
        channels
      }));
      
      // 分批发送，避免一次性处理太多
      const batchSize = 100;
      const results = [];
      
      for (let i = 0; i < notifications.length; i += batchSize) {
        const batch = notifications.slice(i, i + batchSize);
        const batchResults = await this.sendBatchNotifications(batch);
        results.push(...batchResults);
        
        // 避免API限流
        if (i + batchSize < notifications.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      logger.info(`系统广播发送完成，总计: ${notifications.length}`);
      
      return results;
    } catch (error) {
      logger.error('发送系统广播失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户联系方式（模拟）
   * @private
   */
  static async _getUserContactInfo(userId) {
    // 模拟用户联系方式数据
    return {
      userId,
      email: `user${userId}@example.com`,
      phone: `1380013800${userId.slice(-2)}`,
      deviceToken: `device_token_${userId}`,
      openId: `openid_${userId}`
    };
  }

  /**
   * 获取所有活跃用户ID（模拟）
   * @private
   */
  static async _getAllActiveUserIds() {
    // 模拟返回一些用户ID
    const userIds = [];
    for (let i = 1; i <= 100; i++) {
      userIds.push(`user_${i}`);
    }
    return userIds;
  }

  /**
   * 格式化邮件HTML内容
   * @private
   */
  static _formatEmailHtml(title, content, data) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${title}</h2>
        <p>${content}</p>
        ${data ? `<div style="margin-top: 20px; font-size: 14px; color: #666;">详情：${JSON.stringify(data)}</div>` : ''}
      </div>
    `;
  }

  /**
   * 获取微信模板ID
   * @private
   */
  static _getWechatTemplateId(type) {
    // 根据通知类型返回对应的微信模板ID
    const templateMap = {
      order_created: 'template_order_created',
      payment_success: 'template_payment_success',
      order_shipped: 'template_order_shipped',
      stock_warning: 'template_stock_warning',
      member_level_changed: 'template_member_level',
      points_changed: 'template_points_changed',
      welcome: 'template_welcome',
      broadcast: 'template_broadcast'
    };
    
    return templateMap[type] || 'template_default';
  }

  /**
   * 格式化微信模板消息数据
   * @private
   */
  static _formatWechatTemplateData(title, content, data) {
    return {
      first: { value: title, color: '#173177' },
      keyword1: { value: content, color: '#1d2129' },
      keyword2: { value: new Date().toLocaleString(), color: '#1d2129' },
      remark: { value: data ? JSON.stringify(data).substring(0, 100) : '', color: '#8c8c8c' }
    };
  }

  /**
   * 记录通知历史
   * @private
   */
  static async _recordNotificationHistory(notification, results) {
    // 模拟记录通知历史到数据库
    logger.info('记录通知历史:', { notification, results });
  }
}

module.exports = NotificationService;