/**
 * 卖家端库存管理仓库
 * 实现库存相关的数据访问层功能
 */

const logger = require('../../../core/utils/logger');
const db = require('../../../core/database/db');

/**
 * 库存管理仓库
 * @class InventoryRepository
 */
class InventoryRepository {
  /**
   * 获取库存列表
   * @param {Object} query - 查询条件
   * @param {number} offset - 偏移量
   * @param {number} limit - 限制数量
   * @returns {Promise<Array>} 库存列表
   */
  async getInventoryList(query, offset, limit) {
    try {
      const { sellerId, productId, skuId, keyword, alertOnly } = query;
      
      let sql = `
        SELECT 
          i.product_id as productId,
          p.name as productName,
          i.sku_id as skuId,
          s.attributes as skuAttributes,
          i.quantity,
          i.alert_threshold as alertThreshold,
          i.updated_at as updatedAt
        FROM inventory i
        JOIN products p ON i.product_id = p.id
        LEFT JOIN product_skus s ON i.sku_id = s.id
        WHERE i.seller_id = ?
      `;
      
      const params = [sellerId];
      
      // 添加查询条件
      if (productId) {
        sql += ' AND i.product_id = ?';
        params.push(productId);
      }
      
      if (skuId) {
        sql += ' AND i.sku_id = ?';
        params.push(skuId);
      }
      
      if (keyword) {
        sql += ' AND (p.name LIKE ? OR p.sku LIKE ?)';
        params.push(`%${keyword}%`, `%${keyword}%`);
      }
      
      if (alertOnly) {
        sql += ' AND (i.quantity <= i.alert_threshold AND i.alert_threshold > 0)';
      }
      
      sql += ' ORDER BY i.updated_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);
      
      const [rows] = await db.execute(sql, params);
      return rows;
    } catch (error) {
      logger.error('获取库存列表数据库操作失败:', error);
      throw error;
    }
  }

  /**
   * 统计库存数量
   * @param {Object} query - 查询条件
   * @returns {Promise<number>} 库存总数
   */
  async countInventory(query) {
    try {
      const { sellerId, productId, skuId, keyword, alertOnly } = query;
      
      let sql = 'SELECT COUNT(*) as count FROM inventory WHERE seller_id = ?';
      const params = [sellerId];
      
      // 添加查询条件
      if (productId) {
        sql += ' AND product_id = ?';
        params.push(productId);
      }
      
      if (skuId) {
        sql += ' AND sku_id = ?';
        params.push(skuId);
      }
      
      if (keyword) {
        sql += ' AND product_id IN (SELECT id FROM products WHERE name LIKE ? OR sku LIKE ?)';
        params.push(`%${keyword}%`, `%${keyword}%`);
      }
      
      if (alertOnly) {
        sql += ' AND (quantity <= alert_threshold AND alert_threshold > 0)';
      }
      
      const [rows] = await db.execute(sql, params);
      return rows[0].count;
    } catch (error) {
      logger.error('统计库存数量数据库操作失败:', error);
      throw error;
    }
  }

  /**
   * 更新库存
   * @param {Object} data - 库存数据
   * @returns {Promise<boolean>} 更新是否成功
   */
  async updateInventory(data) {
    try {
      const { sellerId, productId, skuId, quantity, reason, updatedBy } = data;
      
      // 开始事务
      await db.beginTransaction();
      
      try {
        // 检查库存记录是否存在
        const [existing] = await db.execute(
          'SELECT id FROM inventory WHERE seller_id = ? AND product_id = ? AND sku_id = ?',
          [sellerId, productId, skuId || null]
        );
        
        let result;
        if (existing.length > 0) {
          // 更新现有库存
          [result] = await db.execute(
            'UPDATE inventory SET quantity = ?, updated_by = ?, updated_at = NOW() WHERE id = ?',
            [quantity, updatedBy, existing[0].id]
          );
        } else {
          // 创建新库存记录
          [result] = await db.execute(
            'INSERT INTO inventory (seller_id, product_id, sku_id, quantity, updated_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
            [sellerId, productId, skuId || null, quantity, updatedBy]
          );
        }
        
        // 记录库存变更日志
        await db.execute(
          'INSERT INTO inventory_logs (seller_id, product_id, sku_id, old_quantity, new_quantity, reason, operator_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
          [sellerId, productId, skuId || null, 0, quantity, reason || '手动调整', updatedBy]
        );
        
        // 提交事务
        await db.commit();
        
        return result.affectedRows > 0;
      } catch (error) {
        // 回滚事务
        await db.rollback();
        throw error;
      }
    } catch (error) {
      logger.error('更新库存数据库操作失败:', error);
      throw error;
    }
  }

  /**
   * 获取库存预警
   * @param {number} sellerId - 卖家ID
   * @param {number} offset - 偏移量
   * @param {number} limit - 限制数量
   * @returns {Promise<Array>} 库存预警列表
   */
  async getInventoryAlerts(sellerId, offset, limit) {
    try {
      const sql = `
        SELECT 
          i.product_id as productId,
          p.name as productName,
          i.sku_id as skuId,
          s.attributes as skuAttributes,
          i.quantity,
          i.alert_threshold as alertThreshold,
          (i.alert_threshold - i.quantity) as shortage
        FROM inventory i
        JOIN products p ON i.product_id = p.id
        LEFT JOIN product_skus s ON i.sku_id = s.id
        WHERE i.seller_id = ? AND i.quantity <= i.alert_threshold AND i.alert_threshold > 0
        ORDER BY shortage DESC LIMIT ? OFFSET ?
      `;
      
      const [rows] = await db.execute(sql, [sellerId, limit, offset]);
      return rows;
    } catch (error) {
      logger.error('获取库存预警数据库操作失败:', error);
      throw error;
    }
  }

  /**
   * 统计库存预警数量
   * @param {number} sellerId - 卖家ID
   * @returns {Promise<number>} 预警数量
   */
  async countInventoryAlerts(sellerId) {
    try {
      const sql = 'SELECT COUNT(*) as count FROM inventory WHERE seller_id = ? AND quantity <= alert_threshold AND alert_threshold > 0';
      const [rows] = await db.execute(sql, [sellerId]);
      return rows[0].count;
    } catch (error) {
      logger.error('统计库存预警数量数据库操作失败:', error);
      throw error;
    }
  }

  /**
   * 设置库存预警阈值
   * @param {Object} data - 设置数据
   * @returns {Promise<boolean>} 设置是否成功
   */
  async setInventoryAlert(data) {
    try {
      const { sellerId, productId, skuId, alertThreshold } = data;
      
      // 更新库存预警阈值
      const [result] = await db.execute(
        'UPDATE inventory SET alert_threshold = ? WHERE seller_id = ? AND product_id = ? AND sku_id = ?',
        [alertThreshold, sellerId, productId, skuId || null]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('设置库存预警阈值数据库操作失败:', error);
      throw error;
    }
  }

  /**
   * 统计低库存产品数量
   * @param {number} sellerId - 卖家ID
   * @returns {Promise<number>} 低库存产品数量
   */
  async countLowStockProducts(sellerId) {
    try {
      const sql = 'SELECT COUNT(*) as count FROM inventory WHERE seller_id = ? AND quantity = 0';
      const [rows] = await db.execute(sql, [sellerId]);
      return rows[0].count;
    } catch (error) {
      logger.error('统计低库存产品数据库操作失败:', error);
      throw error;
    }
  }

  /**
   * 获取总库存量
   * @param {number} sellerId - 卖家ID
   * @returns {Promise<number>} 总库存量
   */
  async getTotalStockQuantity(sellerId) {
    try {
      const sql = 'SELECT SUM(quantity) as total FROM inventory WHERE seller_id = ?';
      const [rows] = await db.execute(sql, [sellerId]);
      return rows[0].total || 0;
    } catch (error) {
      logger.error('获取总库存量数据库操作失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有库存数据
   * @param {number} sellerId - 卖家ID
   * @returns {Promise<Array>} 所有库存数据
   */
  async getAllInventory(sellerId) {
    try {
      const sql = `
        SELECT 
          i.product_id as productId,
          p.name as productName,
          i.sku_id as skuId,
          s.attributes as skuAttributes,
          i.quantity,
          i.alert_threshold as alertThreshold,
          i.updated_at as updatedAt
        FROM inventory i
        JOIN products p ON i.product_id = p.id
        LEFT JOIN product_skus s ON i.sku_id = s.id
        WHERE i.seller_id = ?
        ORDER BY i.product_id, i.sku_id
      `;
      
      const [rows] = await db.execute(sql, [sellerId]);
      return rows;
    } catch (error) {
      logger.error('获取所有库存数据库操作失败:', error);
      throw error;
    }
  }
}

module.exports = new InventoryRepository();