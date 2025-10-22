/**
 * 卖家端订单管理仓库
 * 处理订单相关的数据访问
 */

const logger = require('../../../core/utils/logger');
const db = require('../../../core/database');

class OrderRepository {
  /**
   * 获取订单列表
   * @param {Object} query - 查询条件
   * @param {number} page - 页码
   * @param {number} pageSize - 每页数量
   * @returns {Promise<Array>} 订单列表
   */
  async getOrderList(query, page, pageSize) {
    try {
      logger.info(`查询订单列表，条件: ${JSON.stringify(query)}`);
      
      const { sellerId, status, startDate, endDate, keyword } = query;
      
      // 构建SQL查询
      let sql = `SELECT o.* FROM orders o WHERE o.seller_id = ?`;
      const params = [sellerId];
      
      // 添加状态过滤
      if (status) {
        sql += ` AND o.status = ?`;
        params.push(status);
      }
      
      // 添加日期过滤
      if (startDate) {
        sql += ` AND o.created_at >= ?`;
        params.push(startDate);
      }
      
      if (endDate) {
        sql += ` AND o.created_at <= ?`;
        params.push(endDate);
      }
      
      // 添加关键词搜索
      if (keyword) {
        sql += ` AND (o.order_no LIKE ? OR o.buyer_name LIKE ? OR o.contact_phone LIKE ?)`;
        params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
      }
      
      // 添加排序和分页
      sql += ` ORDER BY o.created_at DESC LIMIT ? OFFSET ?`;
      params.push(pageSize, (page - 1) * pageSize);
      
      const orders = await db.query(sql, params);
      return orders;
    } catch (error) {
      logger.error(`查询订单列表失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 统计订单数量
   * @param {Object} query - 查询条件
   * @returns {Promise<number>} 订单数量
   */
  async countOrders(query) {
    try {
      logger.info(`统计订单数量，条件: ${JSON.stringify(query)}`);
      
      const { sellerId, status, startDate, endDate, keyword } = query;
      
      // 构建SQL查询
      let sql = `SELECT COUNT(*) as count FROM orders o WHERE o.seller_id = ?`;
      const params = [sellerId];
      
      // 添加状态过滤
      if (status) {
        sql += ` AND o.status = ?`;
        params.push(status);
      }
      
      // 添加日期过滤
      if (startDate) {
        sql += ` AND o.created_at >= ?`;
        params.push(startDate);
      }
      
      if (endDate) {
        sql += ` AND o.created_at <= ?`;
        params.push(endDate);
      }
      
      // 添加关键词搜索
      if (keyword) {
        sql += ` AND (o.order_no LIKE ? OR o.buyer_name LIKE ? OR o.contact_phone LIKE ?)`;
        params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
      }
      
      const result = await db.query(sql, params);
      return result[0].count;
    } catch (error) {
      logger.error(`统计订单数量失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 根据ID获取订单
   * @param {number} orderId - 订单ID
   * @returns {Promise<Object>} 订单信息
   */
  async getOrderById(orderId) {
    try {
      logger.info(`根据ID查询订单，订单ID: ${orderId}`);
      
      const order = await db.query(
        'SELECT * FROM orders WHERE id = ?',
        [orderId]
      );
      
      return order[0] || null;
    } catch (error) {
      logger.error(`查询订单失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 更新订单
   * @param {number} orderId - 订单ID
   * @param {Object} orderData - 订单数据
   * @returns {Promise<Object>} 更新后的订单
   */
  async updateOrder(orderId, orderData) {
    try {
      logger.info(`更新订单，订单ID: ${orderId}`);
      
      // 构建更新SQL
      const fields = Object.keys(orderData);
      const values = Object.values(orderData);
      const setClause = fields.map(field => `${field} = ?`).join(', ');
      
      await db.query(
        `UPDATE orders SET ${setClause} WHERE id = ?`,
        [...values, orderId]
      );
      
      // 返回更新后的订单
      return this.getOrderById(orderId);
    } catch (error) {
      logger.error(`更新订单失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取订单项
   * @param {number} orderId - 订单ID
   * @returns {Promise<Array>} 订单项列表
   */
  async getOrderItemsByOrderId(orderId) {
    try {
      logger.info(`查询订单项，订单ID: ${orderId}`);
      
      const items = await db.query(
        `SELECT oi.*, p.name as productName, p.sku_name as skuName, p.price as unitPrice 
         FROM order_items oi 
         LEFT JOIN products p ON oi.product_id = p.id 
         WHERE oi.order_id = ?`,
        [orderId]
      );
      
      return items;
    } catch (error) {
      logger.error(`查询订单项失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 创建订单日志
   * @param {Object} logData - 日志数据
   * @returns {Promise<Object>} 创建的日志
   */
  async createOrderLog(logData) {
    try {
      logger.info(`创建订单日志，订单ID: ${logData.orderId}`);
      
      const data = {
        order_id: logData.orderId,
        action: logData.action,
        content: logData.content,
        remark: logData.remark,
        operator_id: logData.operatorId,
        operator_type: logData.operatorType,
        created_at: new Date()
      };
      
      const result = await db.query(
        'INSERT INTO order_logs SET ?',
        data
      );
      
      return {
        id: result.insertId,
        ...data
      };
    } catch (error) {
      logger.error(`创建订单日志失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取订单日志
   * @param {number} orderId - 订单ID
   * @returns {Promise<Array>} 订单日志列表
   */
  async getOrderLogsByOrderId(orderId) {
    try {
      logger.info(`查询订单日志，订单ID: ${orderId}`);
      
      const logs = await db.query(
        'SELECT * FROM order_logs WHERE order_id = ? ORDER BY created_at DESC',
        [orderId]
      );
      
      return logs;
    } catch (error) {
      logger.error(`查询订单日志失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取订单状态统计
   * @param {number} sellerId - 卖家ID
   * @param {Object} params - 查询参数
   * @returns {Promise<Object>} 状态统计
   */
  async getOrderStatusStats(sellerId, params) {
    try {
      logger.info(`获取订单状态统计，卖家ID: ${sellerId}`);
      
      const { startDate, endDate } = params;
      
      let sql = `SELECT status, COUNT(*) as count FROM orders WHERE seller_id = ?`;
      const queryParams = [sellerId];
      
      if (startDate) {
        sql += ` AND created_at >= ?`;
        queryParams.push(startDate);
      }
      
      if (endDate) {
        sql += ` AND created_at <= ?`;
        queryParams.push(endDate);
      }
      
      sql += ` GROUP BY status`;
      
      const stats = await db.query(sql, queryParams);
      
      // 转换为对象格式
      const result = {};
      stats.forEach(item => {
        result[item.status] = item.count;
      });
      
      return result;
    } catch (error) {
      logger.error(`获取订单状态统计失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取订单销售统计
   * @param {number} sellerId - 卖家ID
   * @param {Object} params - 查询参数
   * @returns {Promise<Object>} 销售统计
   */
  async getOrderSalesStats(sellerId, params) {
    try {
      logger.info(`获取订单销售统计，卖家ID: ${sellerId}`);
      
      const { startDate, endDate } = params;
      
      let sql = `SELECT 
        COUNT(*) as orderCount, 
        SUM(total_amount) as totalSales, 
        AVG(total_amount) as avgOrderValue, 
        SUM(payment_amount) as paymentAmount 
        FROM orders WHERE seller_id = ? AND status != 'canceled'`;
      
      const queryParams = [sellerId];
      
      if (startDate) {
        sql += ` AND created_at >= ?`;
        queryParams.push(startDate);
      }
      
      if (endDate) {
        sql += ` AND created_at <= ?`;
        queryParams.push(endDate);
      }
      
      const stats = await db.query(sql, queryParams);
      return stats[0];
    } catch (error) {
      logger.error(`获取订单销售统计失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取订单趋势统计
   * @param {number} sellerId - 卖家ID
   * @param {Object} params - 查询参数
   * @returns {Promise<Array>} 趋势统计
   */
  async getOrderTrendStats(sellerId, params) {
    try {
      logger.info(`获取订单趋势统计，卖家ID: ${sellerId}`);
      
      const { startDate, endDate } = params;
      
      let sql = `SELECT 
        DATE(created_at) as date, 
        COUNT(*) as orderCount, 
        SUM(total_amount) as salesAmount 
        FROM orders WHERE seller_id = ?`;
      
      const queryParams = [sellerId];
      
      if (startDate) {
        sql += ` AND created_at >= ?`;
        queryParams.push(startDate);
      }
      
      if (endDate) {
        sql += ` AND created_at <= ?`;
        queryParams.push(endDate);
      }
      
      sql += ` GROUP BY DATE(created_at) ORDER BY date ASC`;
      
      const stats = await db.query(sql, queryParams);
      return stats;
    } catch (error) {
      logger.error(`获取订单趋势统计失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 根据订单号获取订单
   * @param {string} orderNo - 订单号
   * @returns {Promise<Object>} 订单信息
   */
  async getOrderByOrderNo(orderNo) {
    try {
      logger.info(`根据订单号查询订单，订单号: ${orderNo}`);
      
      const order = await db.query(
        'SELECT * FROM orders WHERE order_no = ?',
        [orderNo]
      );
      
      return order[0] || null;
    } catch (error) {
      logger.error(`根据订单号查询订单失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 批量获取订单
   * @param {Array} orderIds - 订单ID数组
   * @returns {Promise<Array>} 订单列表
   */
  async getOrdersByIds(orderIds) {
    try {
      logger.info(`批量查询订单，订单ID: ${orderIds.join(', ')}`);
      
      const orders = await db.query(
        'SELECT * FROM orders WHERE id IN (?)',
        [orderIds]
      );
      
      return orders;
    } catch (error) {
      logger.error(`批量查询订单失败: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new OrderRepository();