/**
 * 商品消息处理器
 * 处理与商品相关的各种消息事件
 */

const logger = require('../../core/utils/logger');
const notificationService = require('../notification/notificationService');
const searchService = require('../../core/services/searchService');

class ProductMessageHandler {
  /**
   * 处理商品创建消息
   * @param {Object} message - 商品创建消息
   */
  static async handleProductCreated(message) {
    try {
      logger.info('处理商品创建消息:', message);
      
      const { productId, sellerId, name, categoryId } = message;
      
      // 1. 更新搜索索引
      await searchService.indexProduct({
        id: productId,
        name,
        categoryId,
        ...message
      });
      
      // 2. 发送商品创建成功通知
      await notificationService.sendNotification({
        userId: sellerId,
        type: 'product_created',
        title: '商品创建成功',
        content: `您的商品 "${name}" 已创建成功`,
        data: { productId, name }
      });
      
      logger.info(`商品 #${productId} ${name} 创建成功，已更新搜索索引`);
      
    } catch (error) {
      logger.error('处理商品创建消息失败:', error);
    }
  }

  /**
   * 处理商品更新消息
   * @param {Object} message - 商品更新消息
   */
  static async handleProductUpdated(message) {
    try {
      logger.info('处理商品更新消息:', message);
      
      const { productId, sellerId, name } = message;
      
      // 1. 更新搜索索引
      await searchService.updateProductIndex({
        id: productId,
        ...message
      });
      
      // 2. 发送商品更新通知
      await notificationService.sendNotification({
        userId: sellerId,
        type: 'product_updated',
        title: '商品更新成功',
        content: `您的商品 "${name || 'ID:' + productId}" 已更新`,
        data: { productId, name }
      });
      
      logger.info(`商品 #${productId} 更新成功，已更新搜索索引`);
      
    } catch (error) {
      logger.error('处理商品更新消息失败:', error);
    }
  }

  /**
   * 处理商品上下架消息
   * @param {Object} message - 商品上下架消息
   */
  static async handleProductStatusChanged(message) {
    try {
      logger.info('处理商品上下架消息:', message);
      
      const { productId, sellerId, name, status } = message;
      const isActive = status === 'active';
      
      // 1. 更新搜索索引状态
      await searchService.updateProductStatus(productId, isActive);
      
      // 2. 发送状态变更通知
      await notificationService.sendNotification({
        userId: sellerId,
        type: 'product_status_changed',
        title: isActive ? '商品已上架' : '商品已下架',
        content: `您的商品 "${name || 'ID:' + productId}" 已${isActive ? '上架' : '下架'}`,
        data: { productId, name, status }
      });
      
      logger.info(`商品 #${productId} 状态变更为 ${status}，已更新搜索索引`);
      
    } catch (error) {
      logger.error('处理商品上下架消息失败:', error);
    }
  }

  /**
   * 处理商品库存变更消息
   * @param {Object} message - 商品库存变更消息
   */
  static async handleInventoryChanged(message) {
    try {
      logger.info('处理商品库存变更消息:', message);
      
      const { productId, sellerId, name, stockChange, currentStock, thresholdAlert } = message;
      
      // 如果库存低于阈值，发送告警通知
      if (thresholdAlert) {
        await notificationService.sendNotification({
          userId: sellerId,
          type: 'stock_warning',
          title: '库存预警',
          content: `您的商品 "${name || 'ID:' + productId}" 库存不足，当前库存：${currentStock}`,
          data: { productId, name, currentStock }
        });
      }
      
      logger.info(`商品 #${productId} 库存变更 ${stockChange > 0 ? '+' : ''}${stockChange}，当前库存：${currentStock}`);
      
    } catch (error) {
      logger.error('处理商品库存变更消息失败:', error);
    }
  }

  /**
   * 处理商品评价消息
   * @param {Object} message - 商品评价消息
   */
  static async handleProductReviewed(message) {
    try {
      logger.info('处理商品评价消息:', message);
      
      const { productId, sellerId, userId, rating, content } = message;
      
      // 发送新评价通知给卖家
      await notificationService.sendNotification({
        userId: sellerId,
        type: 'new_product_review',
        title: '您的商品收到新评价',
        content: `用户 ${userId} 给您的商品评价了 ${rating} 星${content ? '：' + content : ''}`,
        data: { productId, userId, rating, content }
      });
      
      logger.info(`商品 #${productId} 收到新评价，评分：${rating} 星`);
      
    } catch (error) {
      logger.error('处理商品评价消息失败:', error);
    }
  }

  /**
   * 注册商品消息处理器
   * @param {Object} cacheManager - 缓存管理器实例
   */
  static registerHandlers(cacheManager) {
    logger.info('注册商品消息处理器');
    
    cacheManager.subscribe('product.created', this.handleProductCreated.bind(this));
    cacheManager.subscribe('product.updated', this.handleProductUpdated.bind(this));
    cacheManager.subscribe('product.status_changed', this.handleProductStatusChanged.bind(this));
    cacheManager.subscribe('product.inventory_changed', this.handleInventoryChanged.bind(this));
    cacheManager.subscribe('product.reviewed', this.handleProductReviewed.bind(this));
  }
}

module.exports = ProductMessageHandler;