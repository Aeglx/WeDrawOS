/**
 * 商品价格变动消息处理器
 * 处理商品价格变更事件，发送通知给相关用户
 */

const logger = require('@core/utils/logger');
const { getInstance: getNotificationService } = require('../notification/notificationService');
const { getInstance: getMessageMonitor } = require('../monitoring/messageProcessingMonitor');
const productService = require('@api/services/productService');
const memberService = require('@api/services/memberService');

class PriceChangeHandler {
  constructor() {
    this.notificationService = getNotificationService();
    this.monitor = getMessageMonitor();
    // 价格变动阈值配置
    this.priceChangeThresholds = {
      significantDrop: 0.1, // 显著降价10%
      minorDrop: 0.05, // 小幅降价5%
      significantRise: 0.1, // 显著涨价10%
      notificationEnabled: true
    };
  }

  /**
   * 处理商品价格变更
   * @param {Object} message - 价格变更消息
   */
  async handlePriceChanged(message) {
    const messageId = message.id || `price_change_${Date.now()}`;
    
    try {
      // 记录处理开始
      this.monitor.recordProcessingStart('product.price_changed', messageId);
      
      const { productId, oldPrice, newPrice, productName, categoryId } = message;
      
      logger.info(`处理商品价格变更: ${productId} (${productName}), 旧价格: ${oldPrice}, 新价格: ${newPrice}`);
      
      // 计算价格变动比例
      const priceDiff = newPrice - oldPrice;
      const priceChangeRatio = Math.abs(priceDiff / oldPrice);
      const isPriceDrop = priceDiff < 0;
      
      // 分析价格变动类型
      const changeType = this._analyzePriceChangeType(priceDiff, priceChangeRatio);
      
      // 获取需要通知的用户列表
      const usersToNotify = await this._getUsersToNotify(productId, categoryId, isPriceDrop);
      
      logger.info(`找到 ${usersToNotify.length} 位需要通知的用户关于商品 ${productId} 的价格变动`);
      
      // 发送通知
      await this._sendPriceChangeNotifications(usersToNotify, {
        productId,
        productName,
        oldPrice,
        newPrice,
        priceDiff,
        priceChangeRatio,
        changeType
      });
      
      // 更新商品价格变动历史
      await this._updatePriceChangeHistory(productId, oldPrice, newPrice);
      
      // 记录处理完成
      this.monitor.recordProcessingComplete('product.price_changed', messageId, true, 1);
      
      logger.info(`商品价格变更处理完成: ${productId} (${productName})`);
    } catch (error) {
      logger.error(`处理商品价格变更失败: ${messageId}`, error);
      
      // 记录错误
      this.monitor.recordProcessingError('product.price_changed', messageId, error);
      this.monitor.recordProcessingComplete('product.price_changed', messageId, false, 1);
      
      throw error;
    }
  }

  /**
   * 分析价格变动类型
   * @private
   */
  _analyzePriceChangeType(priceDiff, ratio) {
    if (priceDiff < 0) { // 降价
      if (ratio >= this.priceChangeThresholds.significantDrop) {
        return 'significant_drop'; // 大幅降价
      } else if (ratio >= this.priceChangeThresholds.minorDrop) {
        return 'minor_drop'; // 小幅降价
      }
      return 'small_drop'; // 微小降价
    } else if (priceDiff > 0) { // 涨价
      if (ratio >= this.priceChangeThresholds.significantRise) {
        return 'significant_rise'; // 大幅涨价
      }
      return 'minor_rise'; // 小幅涨价
    }
    return 'no_change'; // 无变化
  }

  /**
   * 获取需要通知的用户
   * @private
   */
  async _getUsersToNotify(productId, categoryId, isPriceDrop) {
    const users = [];
    
    try {
      // 获取关注该商品的用户
      const productFollowers = await memberService.getProductFollowers(productId);
      users.push(...productFollowers);
      
      // 获取关注该分类的用户
      const categoryFollowers = await memberService.getCategoryFollowers(categoryId);
      users.push(...categoryFollowers);
      
      // 获取最近浏览过该商品的用户
      const recentViewers = await memberService.getRecentProductViewers(productId, 100);
      users.push(...recentViewers);
      
      // 如果是降价，获取购物车中有该商品的用户
      if (isPriceDrop) {
        const cartUsers = await memberService.getUsersWithProductInCart(productId);
        users.push(...cartUsers);
      }
      
      // 去重
      const uniqueUsers = [...new Map(users.map(user => [user.id, user])).values()];
      
      // 过滤用户通知偏好
      return uniqueUsers.filter(user => 
        user.notificationPreferences && 
        user.notificationPreferences.priceAlerts !== false
      );
    } catch (error) {
      logger.error('获取价格变动通知用户失败:', error);
      return [];
    }
  }

  /**
   * 发送价格变动通知
   * @private
   */
  async _sendPriceChangeNotifications(users, priceInfo) {
    const { productId, productName, oldPrice, newPrice, priceDiff, priceChangeRatio, changeType } = priceInfo;
    
    // 根据价格变动类型生成不同的通知内容
    const { title, content, channels } = this._generateNotificationContent(priceInfo);
    
    // 批量发送通知
    for (const user of users) {
      try {
        await this.notificationService.sendNotification({
          userId: user.id,
          title,
          content,
          type: 'price_alert',
          channels: user.preferredChannels || channels,
          data: {
            productId,
            productName,
            oldPrice,
            newPrice,
            priceDiff,
            priceChangePercentage: (priceChangeRatio * 100).toFixed(2),
            changeType,
            timestamp: new Date().toISOString()
          }
        });
      } catch (error) {
        logger.error(`发送价格变动通知给用户 ${user.id} 失败:`, error);
        // 继续发送给其他用户
      }
    }
  }

  /**
   * 生成通知内容
   * @private
   */
  _generateNotificationContent(priceInfo) {
    const { productName, oldPrice, newPrice, priceDiff, priceChangeRatio, changeType } = priceInfo;
    const percentage = Math.abs(priceChangeRatio * 100).toFixed(2);
    
    let title, content, channels;
    
    if (changeType === 'significant_drop') {
      title = `${productName} 大幅降价 ${percentage}%！`;
      content = `您关注的商品 ${productName} 价格从 ¥${oldPrice.toFixed(2)} 降至 ¥${newPrice.toFixed(2)}，降幅达 ${percentage}%，机会难得，赶紧抢购吧！`;
      channels = ['app', 'email', 'sms']; // 大幅降价发送多渠道通知
    } else if (changeType === 'minor_drop') {
      title = `${productName} 价格下调 ${percentage}%`;
      content = `您关注的商品 ${productName} 价格有所下调，现在仅需 ¥${newPrice.toFixed(2)}，比之前便宜了 ¥${Math.abs(priceDiff).toFixed(2)}。`;
      channels = ['app', 'email'];
    } else if (changeType === 'significant_rise') {
      title = `${productName} 价格上涨提醒`;
      content = `温馨提示：您关注的商品 ${productName} 价格已上涨 ${percentage}%，现在价格为 ¥${newPrice.toFixed(2)}。如需购买请尽快决定。`;
      channels = ['app'];
    } else {
      // 其他变动类型
      const direction = priceDiff < 0 ? '下降' : '上涨';
      title = `${productName} 价格变动通知`;
      content = `您关注的商品 ${productName} 价格${direction}至 ¥${newPrice.toFixed(2)}，变动幅度 ${percentage}%。`;
      channels = ['app'];
    }
    
    return { title, content, channels };
  }

  /**
   * 更新价格变动历史
   * @private
   */
  async _updatePriceChangeHistory(productId, oldPrice, newPrice) {
    try {
      await productService.updatePriceHistory(productId, {
        oldPrice,
        newPrice,
        changeTime: new Date(),
        changePercentage: ((newPrice - oldPrice) / oldPrice * 100).toFixed(2)
      });
    } catch (error) {
      logger.error(`更新商品价格变动历史失败: ${productId}`, error);
      // 不抛出异常，继续处理
    }
  }

  /**
   * 注册价格变动消息处理器
   * @param {Object} messageQueue - 消息队列实例
   */
  static registerHandlers(messageQueue) {
    logger.info('注册商品价格变动消息处理器');
    
    const handler = new PriceChangeHandler();
    messageQueue.subscribe('product.price_changed', handler.handlePriceChanged.bind(handler));
  }
}

module.exports = PriceChangeHandler;