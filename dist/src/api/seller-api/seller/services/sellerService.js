/**
 * 卖家端店铺管理服务
 * 处理店铺信息设置、店铺装修等业务逻辑
 */

const logger = require('../../../core/utils/logger');
const sellerRepository = require('../repositories/sellerRepository');
const fileService = require('../../../core/services/fileService');

class SellerService {
  /**
   * 获取店铺信息
   * @param {number} sellerId - 卖家ID
   * @returns {Promise<Object>} 店铺信息
   */
  async getShopInfo(sellerId) {
    try {
      logger.info(`查询店铺信息，卖家ID: ${sellerId}`);
      const shop = await sellerRepository.getShopBySellerId(sellerId);
      
      if (!shop) {
        throw new Error('店铺不存在');
      }
      
      return shop;
    } catch (error) {
      logger.error(`获取店铺信息失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 更新店铺基本信息
   * @param {number} sellerId - 卖家ID
   * @param {Object} shopData - 店铺数据
   * @returns {Promise<Object>} 更新后的店铺信息
   */
  async updateShopInfo(sellerId, shopData) {
    try {
      logger.info(`更新店铺信息，卖家ID: ${sellerId}`);
      
      // 验证店铺是否存在
      const existingShop = await sellerRepository.getShopBySellerId(sellerId);
      if (!existingShop) {
        throw new Error('店铺不存在');
      }
      
      // 构建更新数据
      const updateData = {
        name: shopData.name,
        description: shopData.description,
        contactPhone: shopData.contactPhone,
        contactEmail: shopData.contactEmail,
        location: shopData.location,
        businessHours: shopData.businessHours,
        updatedAt: new Date()
      };
      
      // 更新店铺信息
      const updatedShop = await sellerRepository.updateShop(existingShop.id, updateData);
      return updatedShop;
    } catch (error) {
      logger.error(`更新店铺信息失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取店铺装修配置
   * @param {number} sellerId - 卖家ID
   * @returns {Promise<Object>} 店铺装修配置
   */
  async getShopDecoration(sellerId) {
    try {
      logger.info(`获取店铺装修配置，卖家ID: ${sellerId}`);
      
      // 获取店铺信息
      const shop = await sellerRepository.getShopBySellerId(sellerId);
      if (!shop) {
        throw new Error('店铺不存在');
      }
      
      // 获取装修配置
      const decoration = await sellerRepository.getShopDecoration(shop.id);
      return decoration || { shopId: shop.id, theme: 'default', sections: [] };
    } catch (error) {
      logger.error(`获取店铺装修配置失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 更新店铺装修配置
   * @param {number} sellerId - 卖家ID
   * @param {Object} decorationData - 装修配置数据
   * @returns {Promise<Object>} 更新后的装修配置
   */
  async updateShopDecoration(sellerId, decorationData) {
    try {
      logger.info(`更新店铺装修配置，卖家ID: ${sellerId}`);
      
      // 获取店铺信息
      const shop = await sellerRepository.getShopBySellerId(sellerId);
      if (!shop) {
        throw new Error('店铺不存在');
      }
      
      // 验证装修数据
      if (!decorationData.theme) {
        throw new Error('主题不能为空');
      }
      
      // 构建装修数据
      const decoration = {
        shopId: shop.id,
        theme: decorationData.theme,
        sections: decorationData.sections || [],
        settings: decorationData.settings || {},
        updatedAt: new Date()
      };
      
      // 保存装修配置
      let result;
      const existingDecoration = await sellerRepository.getShopDecoration(shop.id);
      
      if (existingDecoration) {
        result = await sellerRepository.updateShopDecoration(existingDecoration.id, decoration);
      } else {
        result = await sellerRepository.createShopDecoration(decoration);
      }
      
      return result;
    } catch (error) {
      logger.error(`更新店铺装修配置失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取店铺设置
   * @param {number} sellerId - 卖家ID
   * @returns {Promise<Object>} 店铺设置
   */
  async getShopSettings(sellerId) {
    try {
      logger.info(`获取店铺设置，卖家ID: ${sellerId}`);
      
      // 获取店铺信息
      const shop = await sellerRepository.getShopBySellerId(sellerId);
      if (!shop) {
        throw new Error('店铺不存在');
      }
      
      // 获取店铺设置
      const settings = await sellerRepository.getShopSettings(shop.id);
      return settings || { 
        shopId: shop.id,
        shippingSettings: {},
        paymentSettings: {},
        notificationSettings: {},
        otherSettings: {}
      };
    } catch (error) {
      logger.error(`获取店铺设置失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 更新店铺设置
   * @param {number} sellerId - 卖家ID
   * @param {Object} settingsData - 设置数据
   * @returns {Promise<Object>} 更新后的店铺设置
   */
  async updateShopSettings(sellerId, settingsData) {
    try {
      logger.info(`更新店铺设置，卖家ID: ${sellerId}`);
      
      // 获取店铺信息
      const shop = await sellerRepository.getShopBySellerId(sellerId);
      if (!shop) {
        throw new Error('店铺不存在');
      }
      
      // 构建设置数据
      const settings = {
        shopId: shop.id,
        shippingSettings: settingsData.shippingSettings || {},
        paymentSettings: settingsData.paymentSettings || {},
        notificationSettings: settingsData.notificationSettings || {},
        otherSettings: settingsData.otherSettings || {},
        updatedAt: new Date()
      };
      
      // 保存店铺设置
      let result;
      const existingSettings = await sellerRepository.getShopSettings(shop.id);
      
      if (existingSettings) {
        result = await sellerRepository.updateShopSettings(existingSettings.id, settings);
      } else {
        result = await sellerRepository.createShopSettings(settings);
      }
      
      return result;
    } catch (error) {
      logger.error(`更新店铺设置失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取店铺统计信息
   * @param {number} sellerId - 卖家ID
   * @param {Object} params - 查询参数
   * @returns {Promise<Object>} 店铺统计信息
   */
  async getShopStats(sellerId, params) {
    try {
      logger.info(`获取店铺统计信息，卖家ID: ${sellerId}`);
      
      // 获取店铺信息
      const shop = await sellerRepository.getShopBySellerId(sellerId);
      if (!shop) {
        throw new Error('店铺不存在');
      }
      
      // 获取统计数据
      const stats = await sellerRepository.getShopStats(shop.id, params);
      return stats;
    } catch (error) {
      logger.error(`获取店铺统计信息失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 更新店铺Logo
   * @param {number} sellerId - 卖家ID
   * @param {Object} file - 文件对象
   * @returns {Promise<Object>} 更新后的店铺信息
   */
  async updateShopLogo(sellerId, file) {
    try {
      logger.info(`更新店铺Logo，卖家ID: ${sellerId}`);
      
      // 获取店铺信息
      const shop = await sellerRepository.getShopBySellerId(sellerId);
      if (!shop) {
        throw new Error('店铺不存在');
      }
      
      // 上传Logo文件
      const logoPath = await fileService.uploadFile(file, 'shop-logos', shop.id);
      
      // 更新店铺Logo
      const updatedShop = await sellerRepository.updateShop(shop.id, {
        logoUrl: logoPath,
        updatedAt: new Date()
      });
      
      return updatedShop;
    } catch (error) {
      logger.error(`更新店铺Logo失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 更新店铺Banner
   * @param {number} sellerId - 卖家ID
   * @param {Array} files - 文件数组
   * @returns {Promise<Object>} 更新后的店铺信息
   */
  async updateShopBanner(sellerId, files) {
    try {
      logger.info(`更新店铺Banner，卖家ID: ${sellerId}`);
      
      // 获取店铺信息
      const shop = await sellerRepository.getShopBySellerId(sellerId);
      if (!shop) {
        throw new Error('店铺不存在');
      }
      
      // 上传Banner文件
      const bannerPaths = [];
      for (const file of files) {
        const path = await fileService.uploadFile(file, 'shop-banners', shop.id);
        bannerPaths.push(path);
      }
      
      // 更新店铺Banner
      const updatedShop = await sellerRepository.updateShop(shop.id, {
        bannerUrls: bannerPaths,
        updatedAt: new Date()
      });
      
      return updatedShop;
    } catch (error) {
      logger.error(`更新店铺Banner失败: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new SellerService();