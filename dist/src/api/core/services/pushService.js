const logger = require('../utils/logger');
const db = require('../database/database');
const emailService = require('./emailService');
const smsService = require('./smsService');
const config = require('../config/config');

class PushService {
  constructor() {
    this.enabledChannels = {
      app: config.get('push.channels.app', true),
      email: config.get('push.channels.email', true),
      sms: config.get('push.channels.sms', true)
    };
    this.init();
  }

  /**
   * 初始化推送服务
   */
  init() {
    // 这里可以加载配置、初始化第三方服务等
    logger.info('推送服务已初始化', { enabledChannels: Object.keys(this.enabledChannels).filter(key => this.enabledChannels[key]) });
  }

  /**
   * 推送消息
   * @param {Object} message - 消息对象
   * @returns {Promise<Object>} 推送结果
   */
  async pushMessage(message) {
    try {
      const {
        userId,
        title,
        content,
        type = 'notification',
        data = {},
        channels = ['app'],
        priority = 'normal',
        expireAt = null,
        senderId = null
      } = message;

      if (!userId || !title || !content) {
        throw new Error('缺少必要的消息参数');
      }

      // 首先保存站内信
      const notificationId = await this.saveNotification({
        userId,
        title,
        content,
        type,
        data,
        priority,
        expireAt,
        senderId
      });

      // 获取用户信息
      const userInfo = await this.getUserInfo(userId);
      if (!userInfo) {
        throw new Error('用户不存在');
      }

      // 执行多渠道推送
      const results = {};
      
      // 站内信（已保存）
      results.app = { success: true, notificationId };

      // 邮件推送
      if (channels.includes('email') && this.enabledChannels.email && userInfo.email) {
        results.email = await this.sendEmail(userInfo, {
          title,
          content,
          type,
          data,
          notificationId
        });
      }

      // 短信推送
      if (channels.includes('sms') && this.enabledChannels.sms && userInfo.phone) {
        results.sms = await this.sendSms(userInfo, {
          title,
          content,
          type,
          data,
          notificationId
        });
      }

      // 记录推送日志
      await this.logPushHistory({
        userId,
        notificationId,
        channels,
        results
      });

      logger.info(`消息推送完成，用户: ${userId}, 通知ID: ${notificationId}`);
      return {
        success: true,
        notificationId,
        results
      };
    } catch (error) {
      logger.error('推送消息失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 批量推送消息
   * @param {Array} messages - 消息数组
   * @param {Object} options - 批量推送选项
   * @returns {Promise<Array>} 推送结果数组
   */
  async batchPushMessages(messages, options = {}) {
    const { concurrency = 10 } = options;
    const results = [];
    
    // 分批处理
    for (let i = 0; i < messages.length; i += concurrency) {
      const batch = messages.slice(i, i + concurrency);
      const batchResults = await Promise.all(
        batch.map(msg => this.pushMessage(msg).catch(error => ({ success: false, error: error.message })))
      );
      results.push(...batchResults);
      
      // 避免频率限制
      if (i + concurrency < messages.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  /**
   * 保存站内信通知
   */
  async saveNotification(notificationData) {
    try {
      const result = await db.query(
        `INSERT INTO notifications (
          user_id,
          title,
          message,
          type,
          data,
          priority,
          is_read,
          expire_at,
          sender_id,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id`,
        [
          notificationData.userId,
          notificationData.title,
          notificationData.content,
          notificationData.type,
          JSON.stringify(notificationData.data),
          notificationData.priority,
          false,
          notificationData.expireAt,
          notificationData.senderId,
          new Date()
        ]
      );

      return result.rows[0].id;
    } catch (error) {
      logger.error('保存通知失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户信息
   */
  async getUserInfo(userId) {
    try {
      const result = await db.query(
        `SELECT id, email, phone, preferences, last_seen 
         FROM users 
         WHERE id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      logger.error('获取用户信息失败:', error);
      return null;
    }
  }

  /**
   * 发送邮件
   */
  async sendEmail(userInfo, emailData) {
    try {
      // 对于客服消息，使用更丰富的参数
      if (emailData.type === 'customer_service' || emailData.type === 'customer_service_message') {
        const result = await emailService.sendNotification(userInfo.email, emailData.title, emailData.content, {
          '消息类型': emailData.type === 'customer_service_message' ? '客服消息' : '客服通知',
          '时间': new Date().toLocaleString(),
          '详情': JSON.stringify(emailData.data || {})
        });
        
        return {
          success: true,
          email: userInfo.email,
          messageId: result.messageId || null
        };
      }
      
      // 其他类型的邮件使用模板
      const template = this.getEmailTemplate(emailData.type);
      
      // 构建邮件内容
      const emailContent = {
        to: userInfo.email,
        subject: emailData.title,
        body: template.replace('{{content}}', emailData.content)
          .replace('{{title}}', emailData.title)
          .replace('{{userId}}', userInfo.id)
          .replace('{{notificationId}}', emailData.notificationId)
      };

      // 调用邮件服务发送
      const result = await emailService.send(emailContent);
      
      return {
        success: true,
        email: userInfo.email,
        messageId: result.messageId || null
      };
    } catch (error) {
      logger.error(`发送邮件失败 (${userInfo.email}):`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 发送短信
   */
  async sendSms(userInfo, smsData) {
    try {
      // 短信内容需要简短
      const smsContent = `${smsData.title}: ${this.truncateText(smsData.content, 60)}`;
      
      // 调用短信服务发送
      const result = await smsService.send({
        phone: userInfo.phone,
        content: smsContent,
        type: smsData.type,
        templateCode: smsData.type === 'customer_service' ? 'CUSTOMER_SERVICE_TEMPLATE' : 'NOTIFICATION_TEMPLATE',
        params: {
          title: smsData.title,
          content: smsContent
        }
      });

      return {
        success: true,
        phone: userInfo.phone,
        messageId: result.messageId || null
      };
    } catch (error) {
      logger.error(`发送短信失败 (${userInfo.phone}):`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * 推送客服消息通知
   * @param {Object} params - 推送参数
   */
  async pushCustomerServiceMessage(params) {
    const { userId, sessionId, message, sessionInfo } = params;
    
    // 根据消息类型构建通知内容
    const title = sessionInfo?.csUserName 
      ? `来自${sessionInfo.csUserName}的客服消息` 
      : '客服消息通知';
    
    const content = message.contentType === 'text' 
      ? message.content 
      : `收到一条${this.getContentTypeLabel(message.contentType)}消息`;
    
    // 构建推送数据
    const pushData = {
      sessionId,
      messageId: message.id,
      contentType: message.contentType,
      senderId: message.senderId,
      senderName: message.senderName,
      timestamp: message.timestamp
    };
    
    // 根据用户偏好和消息重要性选择推送渠道
    const channels = ['app'];
    
    // 对于较长时间未响应的消息，添加更多推送渠道
    if (message.timestamp < Date.now() - 5 * 60 * 1000) { // 5分钟未读
      channels.push('email');
    }
    
    return await this.pushMessage({
      userId,
      title,
      content,
      type: 'customer_service_message',
      data: pushData,
      channels,
      priority: 'high',
      senderId: message.senderId
    });
  }
  
  /**
   * 推送客服会话通知（分配、转移、等待等）
   * @param {Object} params - 推送参数
   */
  async pushCustomerServiceNotification(params) {
    const { userId, sessionId, notificationType, sessionInfo, message } = params;
    
    // 根据通知类型构建内容
    let title, content;
    
    switch (notificationType) {
      case 'session_assigned':
        title = '会话已分配';
        content = sessionInfo?.csUserName 
          ? `您的会话已分配给客服${sessionInfo.csUserName}，请等待回复` 
          : '您的会话已分配，请等待客服回复';
        break;
        
      case 'session_transferred':
        title = '会话已转移';
        content = sessionInfo?.csUserName 
          ? `您的会话已转移给客服${sessionInfo.csUserName}` 
          : '您的会话已转移到其他客服';
        break;
        
      case 'session_waiting':
        title = '等待客服接入';
        content = message || '您的会话正在等待客服接入，请稍候';
        break;
        
      case 'session_closed':
        title = '会话已结束';
        content = message || '您的客服会话已结束，感谢您的咨询';
        break;
        
      default:
        title = '客服通知';
        content = message || '您有一条新的客服系统通知';
    }
    
    return await this.pushMessage({
      userId,
      title,
      content,
      type: 'customer_service',
      data: {
        sessionId,
        notificationType,
        sessionInfo,
        timestamp: Date.now()
      },
      channels: ['app']
    });
  }
  
  /**
   * 获取消息类型标签
   */
  getContentTypeLabel(contentType) {
    const labels = {
      'text': '文本',
      'image': '图片',
      'voice': '语音',
      'video': '视频',
      'file': '文件',
      'system': '系统'
    };
    
    return labels[contentType] || '未知';
  }

  /**
   * 获取邮件模板
   */
  getEmailTemplate(type) {
    const templates = {
      notification: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4285f4; color: white; padding: 10px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .footer { text-align: center; padding: 10px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>{{title}}</h2>
            </div>
            <div class="content">
              <p>{{content}}</p>
              <p>请登录系统查看详情。</p>
            </div>
            <div class="footer">
              <p>此邮件由系统自动发送，请勿回复。</p>
            </div>
          </div>
        </body>
        </html>
      `,
      
      customer_service: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #ea4335; color: white; padding: 10px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .footer { text-align: center; padding: 10px; color: #666; font-size: 12px; }
            .button { background-color: #34a853; color: white; padding: 10px 20px; text-decoration: none; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>客服消息通知</h2>
            </div>
            <div class="content">
              <h3>{{title}}</h3>
              <p>{{content}}</p>
              <p><a href="https://app.wedrawos.com/customer-service" class="button">立即查看</a></p>
            </div>
            <div class="footer">
              <p>此邮件由系统自动发送，请勿回复。</p>
            </div>
          </div>
        </body>
        </html>
      `,
      
      default: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #5f6368; color: white; padding: 10px; text-align: center; }
            .content { padding: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>{{title}}</h2>
            </div>
            <div class="content">
              <p>{{content}}</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    return templates[type] || templates.default;
  }

  /**
   * 截断文本
   */
  truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * 记录推送历史
   */
  async logPushHistory(pushData) {
    try {
      await db.query(
        `INSERT INTO push_history (
          user_id,
          notification_id,
          channels,
          results,
          created_at
        ) VALUES ($1, $2, $3, $4, $5)`,
        [
          pushData.userId,
          pushData.notificationId,
          JSON.stringify(pushData.channels),
          JSON.stringify(pushData.results),
          new Date()
        ]
      );
    } catch (error) {
      logger.error('记录推送历史失败:', error);
      // 不影响主流程
    }
  }

  /**
   * 设置推送渠道状态
   */
  setChannelStatus(channel, enabled) {
    if (this.enabledChannels.hasOwnProperty(channel)) {
      this.enabledChannels[channel] = enabled;
      logger.info(`推送渠道 ${channel} 已${enabled ? '启用' : '禁用'}`);
      return true;
    }
    return false;
  }

  /**
   * 获取推送渠道状态
   */
  getChannelStatus() {
    return { ...this.enabledChannels };
  }
  
  /**
   * 推送紧急通知
   * @param {Object} params - 推送参数
   */
  async pushEmergencyNotification(params) {
    const { title, content, data = {}, channels = ['app', 'email', 'sms'] } = params;
    
    try {
      // 获取所有用户或指定用户组
      let users = [];
      
      if (params.userIds) {
        // 推送给定用户列表
        users = params.userIds.map(id => ({ id }));
      } else if (params.userGroup) {
        // 推送特定用户组
        const { rows } = await db.query(
          'SELECT id, email, phone FROM users WHERE user_group = $1',
          [params.userGroup]
        );
        users = rows;
      } else {
        // 推送所有用户（实际项目中应该限制，避免发送过多）
        const { rows } = await db.query(
          'SELECT id, email, phone FROM users WHERE status = $1 LIMIT 1000',
          ['active']
        );
        users = rows;
      }
      
      // 批量推送
      const messages = users.map(user => ({
        userId: user.id,
        title,
        content,
        type: 'emergency',
        data: { ...data, priority: 'high' },
        channels,
        priority: 'high',
        senderId: 'system'
      }));
      
      return await this.batchPushMessages(messages);
    } catch (error) {
      logger.error('推送紧急通知失败:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * 获取推送统计信息
   */
  async getPushStatistics(params = {}) {
    try {
      const { startDate, endDate, type, channel } = params;
      
      let query = 'SELECT COUNT(*) as count, status, channel FROM push_history WHERE 1=1';
      const values = [];
      let paramIndex = 1;
      
      if (startDate) {
        query += ` AND created_at >= $${paramIndex++}`;
        values.push(startDate);
      }
      
      if (endDate) {
        query += ` AND created_at <= $${paramIndex++}`;
        values.push(endDate);
      }
      
      if (type) {
        query += ` AND type = $${paramIndex++}`;
        values.push(type);
      }
      
      if (channel) {
        query += ` AND channel = $${paramIndex++}`;
        values.push(channel);
      }
      
      query += ' GROUP BY status, channel';
      
      const { rows } = await db.query(query, values);
      
      // 格式化统计结果
      const statistics = {};
      rows.forEach(row => {
        if (!statistics[row.channel]) {
          statistics[row.channel] = { total: 0, success: 0, failed: 0, pending: 0 };
        }
        
        statistics[row.channel].total += row.count;
        if (row.status === 'success' || row.status === 'sent') {
          statistics[row.channel].success += row.count;
        } else if (row.status === 'failed') {
          statistics[row.channel].failed += row.count;
        } else if (row.status === 'pending') {
          statistics[row.channel].pending += row.count;
        }
      });
      
      return statistics;
    } catch (error) {
      logger.error('获取推送统计失败:', error);
      return {};
    }
  }

  /**
   * 发送系统公告
   */
  async sendSystemAnnouncement(announcement) {
    try {
      const {
        title,
        content,
        targetUsers = null, // null表示所有用户
        channels = ['app', 'email'],
        priority = 'high'
      } = announcement;

      let userIds = [];
      
      if (targetUsers && Array.isArray(targetUsers) && targetUsers.length > 0) {
        // 指定用户
        userIds = targetUsers;
      } else {
        // 所有用户
        const result = await db.query('SELECT id FROM users WHERE status = \'active\'');
        userIds = result.rows.map(row => row.id);
      }

      // 构建消息数组
      const messages = userIds.map(userId => ({
        userId,
        title,
        content,
        type: 'announcement',
        channels,
        priority,
        senderId: 'system'
      }));

      // 批量推送
      const results = await this.batchPushMessages(messages);
      
      logger.info(`系统公告发送完成，目标用户: ${userIds.length}, 成功: ${results.filter(r => r.success).length}`);
      
      return {
        success: true,
        totalUsers: userIds.length,
        successCount: results.filter(r => r.success).length
      };
    } catch (error) {
      logger.error('发送系统公告失败:', error);
      throw error;
    }
  }

  /**
   * 推送服务单例
   */
  static getInstance() {
    if (!this.instance) {
      this.instance = new PushService();
    }
    return this.instance;
  }
}

module.exports = PushService.getInstance();