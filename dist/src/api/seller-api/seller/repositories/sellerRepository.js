/**
 * 卖家端店铺管理仓库
 * 处理店铺相关的数据访问
 */

const logger = require('../../../core/utils/logger');
const db = require('../../../core/database');

class SellerRepository {
  /**
   * 根据卖家ID获取店铺信息
   * @param {number} sellerId - 卖家ID
   * @returns {Promise<Object>} 店铺信息
   */
  async getShopBySellerId(sellerId) {
    try {
      logger.info(`查询卖家店铺信息，卖家ID: ${sellerId}`);
      
      const shop = await db.query(
        'SELECT * FROM shops WHERE seller_id = ?',
        [sellerId]
      );
      
      return shop[0] || null;
    } catch (error) {
      logger.error(`查询店铺信息失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 根据ID获取店铺信息
   * @param {number} shopId - 店铺ID
   * @returns {Promise<Object>} 店铺信息
   */
  async getShopById(shopId) {
    try {
      logger.info(`根据ID查询店铺信息，店铺ID: ${shopId}`);
      
      const shop = await db.query(
        'SELECT * FROM shops WHERE id = ?',
        [shopId]
      );
      
      return shop[0] || null;
    } catch (error) {
      logger.error(`查询店铺信息失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 更新店铺信息
   * @param {number} shopId - 店铺ID
   * @param {Object} shopData - 店铺数据
   * @returns {Promise<Object>} 更新后的店铺信息
   */
  async updateShop(shopId, shopData) {
    try {
      logger.info(`更新店铺信息，店铺ID: ${shopId}`);
      
      // 构建更新SQL
      const fields = Object.keys(shopData);
      const values = Object.values(shopData);
      const setClause = fields.map(field => `${field} = ?`).join(', ');
      
      await db.query(
        `UPDATE shops SET ${setClause} WHERE id = ?`,
        [...values, shopId]
      );
      
      // 返回更新后的店铺信息
      return this.getShopById(shopId);
    } catch (error) {
      logger.error(`更新店铺信息失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取店铺装修配置
   * @param {number} shopId - 店铺ID
   * @returns {Promise<Object>} 店铺装修配置
   */
  async getShopDecoration(shopId) {
    try {
      logger.info(`获取店铺装修配置，店铺ID: ${shopId}`);
      
      const decoration = await db.query(
        'SELECT * FROM shop_decorations WHERE shop_id = ?',
        [shopId]
      );
      
      if (decoration[0]) {
        // 解析JSON字段
        decoration[0].sections = JSON.parse(decoration[0].sections || '[]');
        decoration[0].settings = JSON.parse(decoration[0].settings || '{}');
      }
      
      return decoration[0] || null;
    } catch (error) {
      logger.error(`获取店铺装修配置失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 创建店铺装修配置
   * @param {Object} decorationData - 装修配置数据
   * @returns {Promise<Object>} 创建的装修配置
   */
  async createShopDecoration(decorationData) {
    try {
      logger.info(`创建店铺装修配置，店铺ID: ${decorationData.shopId}`);
      
      // 准备数据
      const data = {
        shop_id: decorationData.shopId,
        theme: decorationData.theme,
        sections: JSON.stringify(decorationData.sections),
        settings: JSON.stringify(decorationData.settings),
        created_at: new Date(),
        updated_at: new Date()
      };
      
      const result = await db.query(
        'INSERT INTO shop_decorations SET ?',
        data
      );
      
      return this.getShopDecoration(decorationData.shopId);
    } catch (error) {
      logger.error(`创建店铺装修配置失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 更新店铺装修配置
   * @param {number} decorationId - 装修配置ID
   * @param {Object} decorationData - 装修配置数据
   * @returns {Promise<Object>} 更新后的装修配置
   */
  async updateShopDecoration(decorationId, decorationData) {
    try {
      logger.info(`更新店铺装修配置，ID: ${decorationId}`);
      
      // 准备数据
      const data = {
        theme: decorationData.theme,
        sections: JSON.stringify(decorationData.sections),
        settings: JSON.stringify(decorationData.settings),
        updated_at: new Date()
      };
      
      await db.query(
        'UPDATE shop_decorations SET ? WHERE id = ?',
        [data, decorationId]
      );
      
      return this.getShopDecoration(decorationData.shopId);
    } catch (error) {
      logger.error(`更新店铺装修配置失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取店铺设置
   * @param {number} shopId - 店铺ID
   * @returns {Promise<Object>} 店铺设置
   */
  async getShopSettings(shopId) {
    try {
      logger.info(`获取店铺设置，店铺ID: ${shopId}`);
      
      const settings = await db.query(
        'SELECT * FROM shop_settings WHERE shop_id = ?',
        [shopId]
      );
      
      if (settings[0]) {
        // 解析JSON字段
        settings[0].shipping_settings = JSON.parse(settings[0].shipping_settings || '{}');
        settings[0].payment_settings = JSON.parse(settings[0].payment_settings || '{}');
        settings[0].notification_settings = JSON.parse(settings[0].notification_settings || '{}');
        settings[0].other_settings = JSON.parse(settings[0].other_settings || '{}');
      }
      
      return settings[0] || null;
    } catch (error) {
      logger.error(`获取店铺设置失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 创建店铺设置
   * @param {Object} settingsData - 设置数据
   * @returns {Promise<Object>} 创建的店铺设置
   */
  async createShopSettings(settingsData) {
    try {
      logger.info(`创建店铺设置，店铺ID: ${settingsData.shopId}`);
      
      // 准备数据
      const data = {
        shop_id: settingsData.shopId,
        shipping_settings: JSON.stringify(settingsData.shippingSettings),
        payment_settings: JSON.stringify(settingsData.paymentSettings),
        notification_settings: JSON.stringify(settingsData.notificationSettings),
        other_settings: JSON.stringify(settingsData.otherSettings),
        created_at: new Date(),
        updated_at: new Date()
      };
      
      await db.query(
        'INSERT INTO shop_settings SET ?',
        data
      );
      
      return this.getShopSettings(settingsData.shopId);
    } catch (error) {
      logger.error(`创建店铺设置失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 更新店铺设置
   * @param {number} settingsId - 设置ID
   * @param {Object} settingsData - 设置数据
   * @returns {Promise<Object>} 更新后的店铺设置
   */
  async updateShopSettings(settingsId, settingsData) {
    try {
      logger.info(`更新店铺设置，ID: ${settingsId}`);
      
      // 准备数据
      const data = {
        shipping_settings: JSON.stringify(settingsData.shippingSettings),
        payment_settings: JSON.stringify(settingsData.paymentSettings),
        notification_settings: JSON.stringify(settingsData.notificationSettings),
        other_settings: JSON.stringify(settingsData.otherSettings),
        updated_at: new Date()
      };
      
      await db.query(
        'UPDATE shop_settings SET ? WHERE id = ?',
        [data, settingsId]
      );
      
      return this.getShopSettings(settingsData.shopId);
    } catch (error) {
      logger.error(`更新店铺设置失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取店铺统计信息
   * @param {number} shopId - 店铺ID
   * @param {Object} params - 查询参数
   * @returns {Promise<Object>} 统计信息
   */
  async getShopStats(shopId, params) {
    try {
      logger.info(`获取店铺统计信息，店铺ID: ${shopId}`);
      
      const { startDate, endDate } = params;
      
      // 获取订单统计
      const orderStats = await db.query(
        `SELECT 
          COUNT(*) as orderCount, 
          SUM(total_amount) as totalSales,
          AVG(total_amount) as avgOrderValue
        FROM orders 
        WHERE shop_id = ? 
          AND status != 'canceled'
          ${startDate ? 'AND created_at >= ?' : ''}
          ${endDate ? 'AND created_at <= ?' : ''}`,
        this._buildQueryParams([shopId], [startDate, endDate])
      );
      
      // 获取商品统计
      const productStats = await db.query(
        'SELECT COUNT(*) as productCount FROM products WHERE shop_id = ? AND status = ?',
        [shopId, 'active']
      );
      
      // 获取访客统计
      const visitorStats = await db.query(
        `SELECT COUNT(*) as visitorCount FROM shop_visits 
        WHERE shop_id = ? 
          ${startDate ? 'AND visit_date >= ?' : ''}
          ${endDate ? 'AND visit_date <= ?' : ''}`,
        this._buildQueryParams([shopId], [startDate, endDate])
      );
      
      return {
        orderStats: orderStats[0],
        productStats: productStats[0],
        visitorStats: visitorStats[0]
      };
    } catch (error) {
      logger.error(`获取店铺统计信息失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 构建查询参数
   * @param {Array} baseParams - 基础参数
   * @param {Array} conditionalParams - 条件参数
   * @returns {Array} 查询参数数组
   * @private
   */
  _buildQueryParams(baseParams, conditionalParams) {
    const params = [...baseParams];
    
    conditionalParams.forEach(param => {
      if (param) {
        params.push(param);
      }
    });
    
    return params;
  }
}

module.exports = new SellerRepository();