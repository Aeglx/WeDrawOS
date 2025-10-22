/**
 * 卖家端店铺管理控制器
 * 处理店铺信息设置、店铺装修等请求
 */

const logger = require('../../../core/utils/logger');
const sellerService = require('../services/sellerService');
const messageQueue = require('../../../core/message-queue');

class SellerController {
  /**
   * 获取店铺信息
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async getShopInfo(req, res) {
    try {
      const sellerId = req.user.id;
      const shopInfo = await sellerService.getShopInfo(sellerId);
      
      logger.info(`获取店铺信息成功，卖家ID: ${sellerId}`);
      return res.status(200).json({
        success: true,
        message: '获取店铺信息成功',
        data: shopInfo
      });
    } catch (error) {
      logger.error(`获取店铺信息失败: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: error.message || '获取店铺信息失败'
      });
    }
  }

  /**
   * 更新店铺基本信息
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async updateShopInfo(req, res) {
    try {
      const sellerId = req.user.id;
      const shopData = req.body;
      
      const updatedShop = await sellerService.updateShopInfo(sellerId, shopData);
      
      // 发送消息队列通知
      await messageQueue.publish('SHOP.INFO.UPDATED', {
        sellerId,
        shopId: updatedShop.id,
        action: 'update',
        timestamp: new Date()
      });
      
      logger.info(`更新店铺信息成功，卖家ID: ${sellerId}`);
      return res.status(200).json({
        success: true,
        message: '更新店铺信息成功',
        data: updatedShop
      });
    } catch (error) {
      logger.error(`更新店铺信息失败: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: error.message || '更新店铺信息失败'
      });
    }
  }

  /**
   * 获取店铺装修配置
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async getShopDecoration(req, res) {
    try {
      const sellerId = req.user.id;
      const decoration = await sellerService.getShopDecoration(sellerId);
      
      logger.info(`获取店铺装修配置成功，卖家ID: ${sellerId}`);
      return res.status(200).json({
        success: true,
        message: '获取店铺装修配置成功',
        data: decoration
      });
    } catch (error) {
      logger.error(`获取店铺装修配置失败: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: error.message || '获取店铺装修配置失败'
      });
    }
  }

  /**
   * 更新店铺装修配置
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async updateShopDecoration(req, res) {
    try {
      const sellerId = req.user.id;
      const decorationData = req.body;
      
      const updatedDecoration = await sellerService.updateShopDecoration(sellerId, decorationData);
      
      // 发送消息队列通知
      await messageQueue.publish('SHOP.DECORATION.UPDATED', {
        sellerId,
        shopId: updatedDecoration.shopId,
        action: 'update',
        timestamp: new Date()
      });
      
      logger.info(`更新店铺装修配置成功，卖家ID: ${sellerId}`);
      return res.status(200).json({
        success: true,
        message: '更新店铺装修配置成功',
        data: updatedDecoration
      });
    } catch (error) {
      logger.error(`更新店铺装修配置失败: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: error.message || '更新店铺装修配置失败'
      });
    }
  }

  /**
   * 获取店铺设置
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async getShopSettings(req, res) {
    try {
      const sellerId = req.user.id;
      const settings = await sellerService.getShopSettings(sellerId);
      
      logger.info(`获取店铺设置成功，卖家ID: ${sellerId}`);
      return res.status(200).json({
        success: true,
        message: '获取店铺设置成功',
        data: settings
      });
    } catch (error) {
      logger.error(`获取店铺设置失败: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: error.message || '获取店铺设置失败'
      });
    }
  }

  /**
   * 更新店铺设置
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async updateShopSettings(req, res) {
    try {
      const sellerId = req.user.id;
      const settingsData = req.body;
      
      const updatedSettings = await sellerService.updateShopSettings(sellerId, settingsData);
      
      // 发送消息队列通知
      await messageQueue.publish('SHOP.SETTINGS.UPDATED', {
        sellerId,
        shopId: updatedSettings.shopId,
        action: 'update',
        timestamp: new Date()
      });
      
      logger.info(`更新店铺设置成功，卖家ID: ${sellerId}`);
      return res.status(200).json({
        success: true,
        message: '更新店铺设置成功',
        data: updatedSettings
      });
    } catch (error) {
      logger.error(`更新店铺设置失败: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: error.message || '更新店铺设置失败'
      });
    }
  }

  /**
   * 获取店铺统计信息
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async getShopStats(req, res) {
    try {
      const sellerId = req.user.id;
      const { startDate, endDate } = req.query;
      
      const stats = await sellerService.getShopStats(sellerId, { startDate, endDate });
      
      logger.info(`获取店铺统计信息成功，卖家ID: ${sellerId}`);
      return res.status(200).json({
        success: true,
        message: '获取店铺统计信息成功',
        data: stats
      });
    } catch (error) {
      logger.error(`获取店铺统计信息失败: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: error.message || '获取店铺统计信息失败'
      });
    }
  }

  /**
   * 更新店铺Logo
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async updateShopLogo(req, res) {
    try {
      const sellerId = req.user.id;
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({
          success: false,
          message: '请上传Logo文件'
        });
      }
      
      const updatedShop = await sellerService.updateShopLogo(sellerId, file);
      
      // 发送消息队列通知
      await messageQueue.publish('SHOP.LOGO.UPDATED', {
        sellerId,
        shopId: updatedShop.id,
        action: 'update',
        timestamp: new Date()
      });
      
      logger.info(`更新店铺Logo成功，卖家ID: ${sellerId}`);
      return res.status(200).json({
        success: true,
        message: '更新店铺Logo成功',
        data: updatedShop
      });
    } catch (error) {
      logger.error(`更新店铺Logo失败: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: error.message || '更新店铺Logo失败'
      });
    }
  }

  /**
   * 更新店铺Banner
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async updateShopBanner(req, res) {
    try {
      const sellerId = req.user.id;
      const files = req.files;
      
      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          message: '请上传Banner文件'
        });
      }
      
      const updatedShop = await sellerService.updateShopBanner(sellerId, files);
      
      // 发送消息队列通知
      await messageQueue.publish('SHOP.BANNER.UPDATED', {
        sellerId,
        shopId: updatedShop.id,
        action: 'update',
        timestamp: new Date()
      });
      
      logger.info(`更新店铺Banner成功，卖家ID: ${sellerId}`);
      return res.status(200).json({
        success: true,
        message: '更新店铺Banner成功',
        data: updatedShop
      });
    } catch (error) {
      logger.error(`更新店铺Banner失败: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: error.message || '更新店铺Banner失败'
      });
    }
  }
}

module.exports = new SellerController();