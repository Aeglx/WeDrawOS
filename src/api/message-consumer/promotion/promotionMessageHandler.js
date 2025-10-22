/**
 * 促销活动消息处理器
 * 处理促销活动相关的消息推送
 */

const logger = require('@core/utils/logger');
const { getInstance: getNotificationService } = require('../notification/notificationService');
const { getInstance: getMessageMonitor } = require('../monitoring/messageProcessingMonitor');
const promotionService = require('@api/services/promotionService');
const memberService = require('@api/services/memberService');
const productService = require('@api/services/productService');

class PromotionMessageHandler {
  constructor() {
    this.notificationService = getNotificationService();
    this.monitor = getMessageMonitor();
  }

  /**
   * 处理促销活动开始
   * @param {Object} message - 活动开始消息
   */
  async handlePromotionStarted(message) {
    const messageId = message.id || `promotion_start_${Date.now()}`;
    
    try {
      // 记录处理开始
      this.monitor.recordProcessingStart('promotion.started', messageId);
      
      const { promotionId, promotionName, startTime, endTime, promotionType, productIds, categoryIds } = message;
      
      logger.info(`处理促销活动开始: ${promotionId} (${promotionName})`);
      
      // 获取活动详情
      const promotionDetails = await this._getPromotionDetails(promotionId);
      
      // 获取需要通知的用户
      const usersToNotify = await this._getUsersForPromotion(productIds, categoryIds, promotionType);
      
      logger.info(`找到 ${usersToNotify.length} 位用户需要通知关于活动 ${promotionName}`);
      
      // 发送活动开始通知
      await this._sendPromotionStartNotifications(usersToNotify, {
        promotionId,
        promotionName,
        startTime,
        endTime,
        promotionType,
        ...promotionDetails
      });
      
      // 记录活动推送统计
      await this._recordPromotionPushStats(promotionId, usersToNotify.length);
      
      // 记录处理完成
      this.monitor.recordProcessingComplete('promotion.started', messageId, true, 1);
      
      logger.info(`促销活动开始通知推送完成: ${promotionId}`);
    } catch (error) {
      logger.error(`处理促销活动开始失败: ${messageId}`, error);
      
      // 记录错误
      this.monitor.recordProcessingError('promotion.started', messageId, error);
      this.monitor.recordProcessingComplete('promotion.started', messageId, false, 1);
      
      throw error;
    }
  }

  /**
   * 处理促销活动结束
   * @param {Object} message - 活动结束消息
   */
  async handlePromotionEnded(message) {
    const messageId = message.id || `promotion_end_${Date.now()}`;
    
    try {
      // 记录处理开始
      this.monitor.recordProcessingStart('promotion.ended', messageId);
      
      const { promotionId, promotionName, actualEndTime } = message;
      
      logger.info(`处理促销活动结束: ${promotionId} (${promotionName})`);
      
      // 获取参与过该活动的用户
      const participants = await promotionService.getPromotionParticipants(promotionId);
      
      // 发送活动结束通知给参与者
      if (participants.length > 0) {
        await this._sendPromotionEndNotifications(participants, {
          promotionId,
          promotionName,
          endTime: actualEndTime
        });
        
        logger.info(`已通知 ${participants.length} 位活动参与者关于活动结束`);
      }
      
      // 记录处理完成
      this.monitor.recordProcessingComplete('promotion.ended', messageId, true, 1);
      
      logger.info(`促销活动结束处理完成: ${promotionId}`);
    } catch (error) {
      logger.error(`处理促销活动结束失败: ${messageId}`, error);
      
      // 记录错误
      this.monitor.recordProcessingError('promotion.ended', messageId, error);
      this.monitor.recordProcessingComplete('promotion.ended', messageId, false, 1);
      
      throw error;
    }
  }

  /**
   * 处理促销活动提醒
   * @param {Object} message - 活动提醒消息
   */
  async handlePromotionReminder(message) {
    const messageId = message.id || `promotion_reminder_${Date.now()}`;
    
    try {
      // 记录处理开始
      this.monitor.recordProcessingStart('promotion.reminder', messageId);
      
      const { promotionId, promotionName, startTime, reminderType } = message;
      
      logger.info(`处理促销活动提醒: ${promotionId} (${reminderType})`);
      
      // 获取关注该活动的用户和可能感兴趣的用户
      const interestedUsers = await this._getInterestedUsersForReminder(promotionId);
      
      // 发送提醒通知
      await this._sendPromotionReminders(interestedUsers, {
        promotionId,
        promotionName,
        startTime,
        reminderType
      });
      
      logger.info(`已发送 ${interestedUsers.length} 条活动提醒通知`);
      
      // 记录处理完成
      this.monitor.recordProcessingComplete('promotion.reminder', messageId, true, 1);
    } catch (error) {
      logger.error(`处理促销活动提醒失败: ${messageId}`, error);
      
      // 记录错误
      this.monitor.recordProcessingError('promotion.reminder', messageId, error);
      this.monitor.recordProcessingComplete('promotion.reminder', messageId, false, 1);
      
      throw error;
    }
  }

  /**
   * 获取促销活动详情
   * @private
   */
  async _getPromotionDetails(promotionId) {
    try {
      const promotion = await promotionService.getPromotionById(promotionId);
      return {
        discount: promotion.discount,
        description: promotion.description,
        imageUrl: promotion.imageUrl,
        rules: promotion.rules,
        isLimitedQuantity: promotion.isLimitedQuantity,
        remainingQuantity: promotion.remainingQuantity
      };
    } catch (error) {
      logger.error(`获取促销活动详情失败: ${promotionId}`, error);
      return {};
    }
  }

  /**
   * 获取促销活动目标用户
   * @private
   */
  async _getUsersForPromotion(productIds, categoryIds, promotionType) {
    const users = [];
    
    try {
      // 获取关注相关商品的用户
      if (productIds && productIds.length > 0) {
        for (const productId of productIds) {
          const followers = await memberService.getProductFollowers(productId);
          users.push(...followers);
        }
      }
      
      // 获取关注相关分类的用户
      if (categoryIds && categoryIds.length > 0) {
        for (const categoryId of categoryIds) {
          const followers = await memberService.getCategoryFollowers(categoryId);
          users.push(...followers);
        }
      }
      
      // 根据促销类型获取目标用户
      if (promotionType === 'member_exclusive') {
        const members = await memberService.getVipMembers();
        users.push(...members);
      } else if (promotionType === 'new_user') {
        const newUsers = await memberService.getRecentRegisteredUsers(30); // 最近30天注册的用户
        users.push(...newUsers);
      }
      
      // 获取活跃用户
      const activeUsers = await memberService.getActiveUsers(7); // 最近7天活跃的用户
      users.push(...activeUsers);
      
      // 去重并过滤通知偏好
      const uniqueUsers = [...new Map(users.map(user => [user.id, user])).values()];
      
      return uniqueUsers.filter(user => 
        user.notificationPreferences && 
        user.notificationPreferences.promotionAlerts !== false
      );
    } catch (error) {
      logger.error('获取促销活动目标用户失败:', error);
      return [];
    }
  }

  /**
   * 获取活动提醒感兴趣的用户
   * @private
   */
  async _getInterestedUsersForReminder(promotionId) {
    try {
      // 获取活动关注者
      const followers = await promotionService.getPromotionFollowers(promotionId);
      
      // 获取加购但未购买的用户
      const cartUsers = await promotionService.getUsersWithCartItemsInPromotion(promotionId);
      
      // 合并并去重
      const allUsers = [...followers, ...cartUsers];
      return [...new Map(allUsers.map(user => [user.id, user])).values()];
    } catch (error) {
      logger.error('获取活动提醒目标用户失败:', error);
      return [];
    }
  }

  /**
   * 发送促销活动开始通知
   * @private
   */
  async _sendPromotionStartNotifications(users, promotionInfo) {
    const { promotionName, startTime, endTime, promotionType, discount, description } = promotionInfo;
    
    // 生成通知内容
    const { title, content, channels } = this._generatePromotionStartContent(promotionInfo);
    
    // 批量发送通知
    for (const user of users) {
      try {
        // 个性化内容
        const personalizedContent = this._personalizeContent(content, user, promotionInfo);
        
        await this.notificationService.sendNotification({
          userId: user.id,
          title,
          content: personalizedContent,
          type: 'promotion_start',
          channels: user.preferredChannels || channels,
          data: {
            promotionId: promotionInfo.promotionId,
            promotionName,
            startTime,
            endTime,
            promotionType,
            discount,
            imageUrl: promotionInfo.imageUrl,
            timestamp: new Date().toISOString()
          },
          // 设置通知过期时间为活动结束时间
          expireAt: endTime
        });
        
        // 记录用户活动推送记录
        await this._recordUserPushHistory(user.id, promotionInfo.promotionId, 'start_notification');
      } catch (error) {
        logger.error(`发送促销活动通知给用户 ${user.id} 失败:`, error);
        // 继续发送给其他用户
      }
    }
  }

  /**
   * 发送促销活动结束通知
   * @private
   */
  async _sendPromotionEndNotifications(users, promotionInfo) {
    const { promotionName, endTime } = promotionInfo;
    
    const title = `${promotionName} 活动已结束`;
    const content = `尊敬的用户，您参与的「${promotionName}」促销活动已于${new Date(endTime).toLocaleString()}结束。感谢您的参与！`;
    
    for (const user of users) {
      try {
        await this.notificationService.sendNotification({
          userId: user.id,
          title,
          content,
          type: 'promotion_end',
          channels: ['app'],
          data: {
            promotionId: promotionInfo.promotionId,
            promotionName,
            endTime
          }
        });
      } catch (error) {
        logger.error(`发送活动结束通知失败:`, error);
      }
    }
  }

  /**
   * 发送促销活动提醒
   * @private
   */
  async _sendPromotionReminders(users, reminderInfo) {
    const { promotionName, startTime, reminderType } = reminderInfo;
    
    let title, content;
    if (reminderType === 'coming_soon') {
      const hoursUntilStart = Math.ceil((new Date(startTime) - new Date()) / (1000 * 60 * 60));
      title = `${promotionName} 即将开始`;
      content = `提醒您，「${promotionName}」活动将在${hoursUntilStart}小时后开始，敬请期待！`;
    } else if (reminderType === 'ending_soon') {
      title = `${promotionName} 即将结束`;
      content = `您关注的「${promotionName}」活动即将结束，抓紧最后机会参与！`;
    }
    
    for (const user of users) {
      try {
        await this.notificationService.sendNotification({
          userId: user.id,
          title,
          content,
          type: 'promotion_reminder',
          channels: ['app'],
          data: {
            promotionId: reminderInfo.promotionId,
            promotionName,
            startTime,
            reminderType
          }
        });
      } catch (error) {
        logger.error(`发送活动提醒失败:`, error);
      }
    }
  }

  /**
   * 生成促销活动开始通知内容
   * @private
   */
  _generatePromotionStartContent(promotionInfo) {
    const { promotionName, promotionType, discount, description } = promotionInfo;
    
    let title, content, channels;
    
    switch (promotionType) {
      case 'flash_sale':
        title = `${promotionName} 限时抢购开始啦！`;
        content = `🔥 热门活动「${promotionName}」正式开始！${discount || ''}。${description || ''} 抢购倒计时已经开始，先到先得！`;
        channels = ['app', 'sms'];
        break;
      case 'discount':
        title = `${promotionName} 优惠活动上线`;
        content = `🎉 「${promotionName}」优惠活动正式启动！${discount || ''}。${description || ''} 立即查看详情，选购心仪商品！`;
        channels = ['app', 'email'];
        break;
      case 'member_exclusive':
        title = `会员专享 ${promotionName}`;
        content = `✨ 尊敬的会员，「${promotionName}」会员专享活动开始了！${discount || ''}。${description || ''} 这是专为您准备的独家优惠！`;
        channels = ['app', 'email'];
        break;
      default:
        title = `${promotionName} 活动开始`;
        content = `📣 「${promotionName}」活动现已开始！${description || ''} 点击查看详情。`;
        channels = ['app'];
    }
    
    return { title, content, channels };
  }

  /**
   * 个性化通知内容
   * @private
   */
  _personalizeContent(content, user, promotionInfo) {
    let personalized = content;
    
    // 根据用户等级调整称呼
    if (user.level === 'VIP') {
      personalized = personalized.replace('尊敬的用户', '尊敬的VIP会员');
    }
    
    // 添加用户名字
    if (user.name) {
      personalized = `亲爱的${user.name}，${personalized}`;
    }
    
    return personalized;
  }

  /**
   * 记录促销推送统计
   * @private
   */
  async _recordPromotionPushStats(promotionId, userCount) {
    try {
      await promotionService.updatePromotionStats(promotionId, {
        pushCount: userCount,
        lastPushTime: new Date()
      });
    } catch (error) {
      logger.error(`记录促销推送统计失败: ${promotionId}`, error);
    }
  }

  /**
   * 记录用户推送历史
   * @private
   */
  async _recordUserPushHistory(userId, promotionId, pushType) {
    try {
      await memberService.recordPromotionPushHistory(userId, {
        promotionId,
        pushType,
        pushTime: new Date()
      });
    } catch (error) {
      logger.error(`记录用户推送历史失败: ${userId}`, error);
    }
  }

  /**
   * 注册促销活动消息处理器
   * @param {Object} messageQueue - 消息队列实例
   */
  static registerHandlers(messageQueue) {
    logger.info('注册促销活动消息处理器');
    
    const handler = new PromotionMessageHandler();
    messageQueue.subscribe('promotion.started', handler.handlePromotionStarted.bind(handler));
    messageQueue.subscribe('promotion.ended', handler.handlePromotionEnded.bind(handler));
    messageQueue.subscribe('promotion.reminder', handler.handlePromotionReminder.bind(handler));
  }
}

module.exports = PromotionMessageHandler;