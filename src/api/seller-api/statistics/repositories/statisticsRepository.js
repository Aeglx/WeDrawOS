/**
 * 卖家端统计管理仓库
 * 实现统计相关的数据访问层功能
 */

const logger = require('../../../core/utils/logger');
const db = require('../../../core/database/db');

/**
 * 统计管理仓库
 * @class StatisticsRepository
 */
class StatisticsRepository {
  /**
   * 根据周期获取销售额统计
   * @param {Object} params - 查询参数
   * @param {number} params.sellerId - 卖家ID
   * @param {string} params.startDate - 开始日期
   * @param {string} params.endDate - 结束日期
   * @param {string} params.period - 统计周期
   * @returns {Promise<Array>} 销售统计数据
   */
  async getSalesByPeriod(params) {
    const { sellerId, startDate, endDate, period } = params;
    
    try {
      // 根据周期构建日期格式化函数
      let dateFormat;
      switch (period) {
        case 'week':
          dateFormat = 'DATE_FORMAT(o.created_at, \'%Y-%u\')';
          break;
        case 'month':
          dateFormat = 'DATE_FORMAT(o.created_at, \'%Y-%m\')';
          break;
        case 'day':
        default:
          dateFormat = 'DATE_FORMAT(o.created_at, \'%Y-%m-%d\')';
      }
      
      const sql = `
        SELECT
          ${dateFormat} as date,
          SUM(o.total_amount) as salesAmount,
          COUNT(o.id) as orderCount
        FROM orders o
        WHERE o.seller_id = ?
          AND o.status != 'CANCELLED'
          AND o.created_at >= ?
          AND o.created_at <= ?
        GROUP BY date
        ORDER BY date
      `;
      
      const [rows] = await db.execute(sql, [sellerId, startDate, endDate]);
      return rows;
    } catch (error) {
      logger.error('获取销售额统计数据库操作失败:', error);
      throw error;
    }
  }

  /**
   * 根据周期获取流量统计
   * @param {Object} params - 查询参数
   * @param {number} params.sellerId - 卖家ID
   * @param {string} params.startDate - 开始日期
   * @param {string} params.endDate - 结束日期
   * @param {string} params.period - 统计周期
   * @returns {Promise<Array>} 流量统计数据
   */
  async getTrafficByPeriod(params) {
    const { sellerId, startDate, endDate, period } = params;
    
    try {
      // 根据周期构建日期格式化函数
      let dateFormat;
      switch (period) {
        case 'week':
          dateFormat = 'DATE_FORMAT(v.visit_time, \'%Y-%u\')';
          break;
        case 'month':
          dateFormat = 'DATE_FORMAT(v.visit_time, \'%Y-%m\')';
          break;
        case 'day':
        default:
          dateFormat = 'DATE_FORMAT(v.visit_time, \'%Y-%m-%d\')';
      }
      
      const sql = `
        SELECT
          ${dateFormat} as date,
          COUNT(v.id) as pv,
          COUNT(DISTINCT v.user_id) as uv
        FROM store_visits v
        WHERE v.seller_id = ?
          AND v.visit_time >= ?
          AND v.visit_time <= ?
        GROUP BY date
        ORDER BY date
      `;
      
      const [rows] = await db.execute(sql, [sellerId, startDate, endDate]);
      return rows;
    } catch (error) {
      logger.error('获取流量统计数据库操作失败:', error);
      throw error;
    }
  }

  /**
   * 获取产品销量排行
   * @param {Object} params - 查询参数
   * @param {number} params.sellerId - 卖家ID
   * @param {string} params.startDate - 开始日期
   * @param {string} params.endDate - 结束日期
   * @param {number} params.limit - 限制数量
   * @returns {Promise<Array>} 产品销量排行数据
   */
  async getProductSalesRanking(params) {
    const { sellerId, startDate, endDate, limit } = params;
    
    try {
      const sql = `
        SELECT
          p.id as productId,
          p.name as productName,
          SUM(oi.quantity) as salesQuantity,
          SUM(oi.price * oi.quantity) as salesAmount
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        JOIN products p ON oi.product_id = p.id
        WHERE o.seller_id = ?
          AND o.status != 'CANCELLED'
          AND o.created_at >= ?
          AND o.created_at <= ?
        GROUP BY p.id, p.name
        ORDER BY salesQuantity DESC
        LIMIT ?
      `;
      
      const [rows] = await db.execute(sql, [sellerId, startDate, endDate, limit]);
      return rows;
    } catch (error) {
      logger.error('获取产品销量排行数据库操作失败:', error);
      throw error;
    }
  }

  /**
   * 获取销售概览
   * @param {number} sellerId - 卖家ID
   * @param {string} startDate - 开始日期
   * @param {string} endDate - 结束日期
   * @returns {Promise<Object>} 销售概览数据
   */
  async getSalesOverview(sellerId, startDate, endDate) {
    try {
      const sql = `
        SELECT
          SUM(total_amount) as totalSales,
          COUNT(id) as totalOrders
        FROM orders
        WHERE seller_id = ?
          AND status != 'CANCELLED'
          AND created_at >= ?
          AND created_at <= ?
      `;
      
      const [rows] = await db.execute(sql, [sellerId, startDate, endDate]);
      const result = rows[0];
      
      return {
        totalSales: result.totalSales || 0,
        totalOrders: result.totalOrders || 0,
        averageOrderValue: result.totalOrders > 0 ? (result.totalSales / result.totalOrders) : 0
      };
    } catch (error) {
      logger.error('获取销售概览数据库操作失败:', error);
      throw error;
    }
  }

  /**
   * 获取流量概览
   * @param {number} sellerId - 卖家ID
   * @param {string} startDate - 开始日期
   * @param {string} endDate - 结束日期
   * @returns {Promise<Object>} 流量概览数据
   */
  async getTrafficOverview(sellerId, startDate, endDate) {
    try {
      const sql = `
        SELECT
          COUNT(id) as totalPV,
          COUNT(DISTINCT user_id) as totalUV
        FROM store_visits
        WHERE seller_id = ?
          AND visit_time >= ?
          AND visit_time <= ?
      `;
      
      const [rows] = await db.execute(sql, [sellerId, startDate, endDate]);
      const result = rows[0];
      
      return {
        totalPV: result.totalPV || 0,
        totalUV: result.totalUV || 0,
        averagePV: result.totalUV > 0 ? (result.totalPV / result.totalUV) : 0
      };
    } catch (error) {
      logger.error('获取流量概览数据库操作失败:', error);
      throw error;
    }
  }

  /**
   * 获取订单概览
   * @param {number} sellerId - 卖家ID
   * @param {string} startDate - 开始日期
   * @param {string} endDate - 结束日期
   * @returns {Promise<Object>} 订单概览数据
   */
  async getOrderOverview(sellerId, startDate, endDate) {
    try {
      const sql = `
        SELECT
          status,
          COUNT(id) as count
        FROM orders
        WHERE seller_id = ?
          AND created_at >= ?
          AND created_at <= ?
        GROUP BY status
      `;
      
      const [rows] = await db.execute(sql, [sellerId, startDate, endDate]);
      
      // 转换为对象格式
      const statusCounts = {};
      rows.forEach(row => {
        statusCounts[row.status] = row.count;
      });
      
      return statusCounts;
    } catch (error) {
      logger.error('获取订单概览数据库操作失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户购买行为统计
   * @param {Object} params - 查询参数
   * @param {number} params.sellerId - 卖家ID
   * @param {string} params.startDate - 开始日期
   * @param {string} params.endDate - 结束日期
   * @returns {Promise<Object>} 用户购买行为统计
   */
  async getUserPurchaseBehavior(params) {
    const { sellerId, startDate, endDate } = params;
    
    try {
      // 并行获取各项指标
      const [visitResult, orderResult, cartResult] = await Promise.all([
        // 访问次数
        db.execute(
          'SELECT COUNT(id) as count FROM store_visits WHERE seller_id = ? AND visit_time >= ? AND visit_time <= ?',
          [sellerId, startDate, endDate]
        ),
        // 订单数
        db.execute(
          'SELECT COUNT(id) as count FROM orders WHERE seller_id = ? AND status != ? AND created_at >= ? AND created_at <= ?',
          [sellerId, 'CANCELLED', startDate, endDate]
        ),
        // 加入购物车次数
        db.execute(
          'SELECT COUNT(id) as count FROM cart_events WHERE seller_id = ? AND event_type = ? AND created_at >= ? AND created_at <= ?',
          [sellerId, 'ADD_TO_CART', startDate, endDate]
        )
      ]);
      
      return {
        visitCount: visitResult[0][0].count || 0,
        orderCount: orderResult[0][0].count || 0,
        addToCartCount: cartResult[0][0].count || 0
      };
    } catch (error) {
      logger.error('获取用户购买行为统计数据库操作失败:', error);
      throw error;
    }
  }

  /**
   * 获取订单状态分布
   * @param {Object} params - 查询参数
   * @param {number} params.sellerId - 卖家ID
   * @param {string} params.startDate - 开始日期
   * @param {string} params.endDate - 结束日期
   * @returns {Promise<Array>} 订单状态分布
   */
  async getOrderStatusDistribution(params) {
    const { sellerId, startDate, endDate } = params;
    
    try {
      const sql = `
        SELECT
          status,
          COUNT(id) as count
        FROM orders
        WHERE seller_id = ?
          AND created_at >= ?
          AND created_at <= ?
        GROUP BY status
        ORDER BY count DESC
      `;
      
      const [rows] = await db.execute(sql, [sellerId, startDate, endDate]);
      return rows;
    } catch (error) {
      logger.error('获取订单状态分布数据库操作失败:', error);
      throw error;
    }
  }
}

module.exports = new StatisticsRepository();