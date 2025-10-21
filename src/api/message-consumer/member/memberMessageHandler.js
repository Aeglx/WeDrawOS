/**
 * 会员消息处理器
 * 处理与会员相关的各种消息事件
 */

const logger = require('../../core/utils/logger');
const notificationService = require('../notification/notificationService');
const pointService = require('../../core/services/pointService');
const memberCardService = require('../../core/services/memberCardService');

class MemberMessageHandler {
  /**
   * 处理会员注册消息
   * @param {Object} message - 会员注册消息
   */
  static async handleMemberRegistered(message) {
    try {
      logger.info('处理会员注册消息:', message);
      
      const { userId, username, email, phone } = message;
      
      // 1. 为新会员初始化积分账户
      await pointService.initMemberPoints(userId, 100); // 新注册送100积分
      
      // 2. 为新会员分配会员卡
      await memberCardService.assignNewMemberCard(userId);
      
      // 3. 发送欢迎通知
      await notificationService.sendNotification({
        userId,
        type: 'welcome',
        title: '欢迎加入我们',
        content: `亲爱的 ${username || '用户'}，欢迎您注册成为我们的会员！您已获得100积分奖励，祝您购物愉快！`,
        data: { userId, points: 100 }
      });
      
      logger.info(`会员 #${userId} 注册成功，已初始化积分账户并分配会员卡`);
      
    } catch (error) {
      logger.error('处理会员注册消息失败:', error);
    }
  }

  /**
   * 处理会员等级变更消息
   * @param {Object} message - 会员等级变更消息
   */
  static async handleMemberLevelChanged(message) {
    try {
      logger.info('处理会员等级变更消息:', message);
      
      const { userId, username, oldLevel, newLevel, levelBenefits } = message;
      
      // 发送等级变更通知
      await notificationService.sendNotification({
        userId,
        type: 'member_level_changed',
        title: '会员等级提升',
        content: `恭喜您 ${username || '用户'}，您的会员等级已从 ${oldLevel} 升级到 ${newLevel}！${levelBenefits ? '新等级特权：' + levelBenefits : ''}`,
        data: { userId, oldLevel, newLevel, levelBenefits }
      });
      
      logger.info(`会员 #${userId} 等级从 ${oldLevel} 变更为 ${newLevel}`);
      
    } catch (error) {
      logger.error('处理会员等级变更消息失败:', error);
    }
  }

  /**
   * 处理积分变更消息
   * @param {Object} message - 积分变更消息
   */
  static async handlePointsChanged(message) {
    try {
      logger.info('处理积分变更消息:', message);
      
      const { userId, username, changeAmount, currentBalance, reason } = message;
      
      // 发送积分变更通知
      await notificationService.sendNotification({
        userId,
        type: 'points_changed',
        title: changeAmount > 0 ? '积分入账' : '积分使用',
        content: `您的积分${changeAmount > 0 ? '增加' : '减少'}了 ${Math.abs(changeAmount)} 点${reason ? '，原因：' + reason : ''}，当前余额：${currentBalance}`,
        data: { userId, changeAmount, currentBalance, reason }
      });
      
      logger.info(`会员 #${userId} 积分变更 ${changeAmount > 0 ? '+' : ''}${changeAmount}，当前余额：${currentBalance}`);
      
    } catch (error) {
      logger.error('处理积分变更消息失败:', error);
    }
  }

  /**
   * 处理会员生日消息
   * @param {Object} message - 会员生日消息
   */
  static async handleMemberBirthday(message) {
    try {
      logger.info('处理会员生日消息:', message);
      
      const { userId, username, birthdayGift } = message;
      
      // 发放生日礼品或积分
      if (birthdayGift && birthdayGift.points > 0) {
        await pointService.addPoints(userId, birthdayGift.points, '生日奖励');
      }
      
      // 发送生日祝福通知
      await notificationService.sendNotification({
        userId,
        type: 'birthday_wish',
        title: '生日快乐',
        content: `亲爱的 ${username || '用户'}，祝您生日快乐！${birthdayGift ? `我们为您准备了${birthdayGift.name || birthdayGift.points + '积分'}的生日礼物` : ''}`,
        data: { userId, birthdayGift }
      });
      
      logger.info(`会员 #${userId} 生日祝福已发送${birthdayGift ? '，礼品已发放' : ''}`);
      
    } catch (error) {
      logger.error('处理会员生日消息失败:', error);
    }
  }

  /**
   * 处理会员黑名单变更消息
   * @param {Object} message - 会员黑名单变更消息
   */
  static async handleBlacklistChanged(message) {
    try {
      logger.info('处理会员黑名单变更消息:', message);
      
      const { userId, username, isBlacklisted, reason } = message;
      
      // 发送黑名单状态变更通知（如果不是系统自动操作）
      if (!message.systemGenerated) {
        await notificationService.sendNotification({
          userId,
          type: 'blacklist_changed',
          title: isBlacklisted ? '账号限制' : '限制解除',
          content: isBlacklisted 
            ? `很遗憾，您的账号已被限制使用${reason ? '，原因：' + reason : ''}`
            : '您的账号限制已解除，感谢您的理解与支持',
          data: { userId, isBlacklisted, reason }
        });
      }
      
      logger.info(`会员 #${userId} 黑名单状态变更为 ${isBlacklisted}${reason ? '，原因：' + reason : ''}`);
      
    } catch (error) {
      logger.error('处理会员黑名单变更消息失败:', error);
    }
  }

  /**
   * 注册会员消息处理器
   * @param {Object} cacheManager - 缓存管理器实例
   */
  static registerHandlers(cacheManager) {
    logger.info('注册会员消息处理器');
    
    cacheManager.subscribe('member.registered', this.handleMemberRegistered.bind(this));
    cacheManager.subscribe('member.level_changed', this.handleMemberLevelChanged.bind(this));
    cacheManager.subscribe('member.points_changed', this.handlePointsChanged.bind(this));
    cacheManager.subscribe('member.birthday', this.handleMemberBirthday.bind(this));
    cacheManager.subscribe('member.blacklist_changed', this.handleBlacklistChanged.bind(this));
  }
}

module.exports = MemberMessageHandler;