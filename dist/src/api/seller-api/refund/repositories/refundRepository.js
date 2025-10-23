/**
 * 卖家端退款管理仓库
 * 实现退款相关的数据访问层功能
 */

const logger = require('../../../core/utils/logger');
const db = require('../../../core/database/database');
const di = require('../../../core/di/container');

/**
 * 退款管理仓库类
 * @class RefundRepository
 */
class RefundRepository {
  constructor() {
    // 从依赖注入容器获取数据库实例
    this.db = di.get('db') || db;
  }

  /**
   * 开启数据库事务
   * @returns {Promise<Object>} 事务对象
   */
  async beginTransaction() {
    return this.db.transaction();
  }

  /**
   * 获取退款列表
   * @param {Object} params - 查询参数
   * @param {string} params.sellerId - 卖家ID
   * @param {string} [params.status] - 退款状态
   * @param {string} [params.startDate] - 开始日期
   * @param {string} [params.endDate] - 结束日期
   * @param {number} params.page - 页码
   * @param {number} params.pageSize - 每页大小
   * @param {Object} [transaction] - 事务对象
   * @returns {Promise<Object>} 退款列表和总数
   */
  async getRefundList(params, transaction = null) {
    try {
      const { sellerId, status, startDate, endDate, page, pageSize } = params;
      const queryBuilder = this.db('refunds as r')
        .select(
          'r.id',
          'r.order_id',
          'r.order_no',
          'r.product_info',
          'r.user_id',
          'r.amount',
          'r.refund_amount',
          'r.reason',
          'r.status',
          'r.seller_remark',
          'r.created_at',
          'r.updated_at'
        )
        .leftJoin('orders as o', 'r.order_id', '=', 'o.id')
        .where('o.seller_id', '=', sellerId);

      // 添加状态筛选
      if (status) {
        queryBuilder.where('r.status', '=', status);
      }

      // 添加日期范围筛选
      if (startDate) {
        queryBuilder.where('r.created_at', '>=', new Date(startDate));
      }
      if (endDate) {
        queryBuilder.where('r.created_at', '<=', new Date(endDate + ' 23:59:59'));
      }

      // 获取总数
      const total = await queryBuilder.clone().count('r.id as count').first();

      // 分页查询
      const items = await queryBuilder
        .orderBy('r.created_at', 'desc')
        .limit(pageSize)
        .offset((page - 1) * pageSize)
        .transacting(transaction);

      return {
        items,
        total: parseInt(total.count)
      };
    } catch (error) {
      logger.error('获取退款列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取退款详情
   * @param {Object} params - 查询参数
   * @param {string} params.sellerId - 卖家ID
   * @param {string} params.refundId - 退款ID
   * @param {Object} [transaction] - 事务对象
   * @returns {Promise<Object>} 退款详情
   */
  async getRefundDetail(params, transaction = null) {
    try {
      const { sellerId, refundId } = params;
      
      const refund = await this.db('refunds as r')
        .select(
          'r.*',
          'o.seller_id as order_seller_id'
        )
        .leftJoin('orders as o', 'r.order_id', '=', 'o.id')
        .where('r.id', '=', refundId)
        .where('o.seller_id', '=', sellerId)
        .first()
        .transacting(transaction);

      return refund;
    } catch (error) {
      logger.error('获取退款详情失败:', error);
      throw error;
    }
  }

  /**
   * 更新退款状态
   * @param {Object} params - 更新参数
   * @param {string} params.refundId - 退款ID
   * @param {Object} params.data - 更新数据
   * @param {Object} [transaction] - 事务对象
   * @returns {Promise<number>} 更新结果
   */
  async updateRefund(params, transaction = null) {
    try {
      const { refundId, data } = params;
      
      const result = await this.db('refunds')
        .where('id', '=', refundId)
        .update(data)
        .transacting(transaction);

      return result;
    } catch (error) {
      logger.error('更新退款状态失败:', error);
      throw error;
    }
  }

  /**
   * 获取退款统计信息
   * @param {Object} params - 查询参数
   * @param {string} params.sellerId - 卖家ID
   * @param {string} [params.startDate] - 开始日期
   * @param {string} [params.endDate] - 结束日期
   * @returns {Promise<Object>} 退款统计信息
   */
  async getRefundStatistics(params) {
    try {
      const { sellerId, startDate, endDate } = params;
      
      // 构建基础查询
      const baseQuery = this.db('refunds as r')
        .leftJoin('orders as o', 'r.order_id', '=', 'o.id')
        .where('o.seller_id', '=', sellerId);

      // 添加日期范围筛选
      if (startDate) {
        baseQuery.where('r.created_at', '>=', new Date(startDate));
      }
      if (endDate) {
        baseQuery.where('r.created_at', '<=', new Date(endDate + ' 23:59:59'));
      }

      // 查询不同状态的退款数量
      const statusCounts = await baseQuery.clone()
        .select('r.status', this.db.raw('COUNT(*) as count'))
        .groupBy('r.status');

      // 统计总退款金额
      const amountSum = await baseQuery.clone()
        .select(this.db.raw('SUM(r.refund_amount) as total_amount'))
        .first();

      // 获取该卖家在指定时间范围内的订单总数
      const orderQuery = this.db('orders')
        .where('seller_id', '=', sellerId);
        
      if (startDate) {
        orderQuery.where('created_at', '>=', new Date(startDate));
      }
      if (endDate) {
        orderQuery.where('created_at', '<=', new Date(endDate + ' 23:59:59'));
      }
      
      const totalOrders = await orderQuery.count('id as count').first();

      // 构建统计结果
      const result = {
        totalRefunds: 0,
        pendingRefunds: 0,
        approvedRefunds: 0,
        rejectedRefunds: 0,
        completedRefunds: 0,
        totalRefundAmount: amountSum.total_amount || 0,
        totalOrders: totalOrders.count
      };

      // 填充各状态的数量
      statusCounts.forEach(item => {
        result.totalRefunds += item.count;
        switch (item.status) {
          case 'pending':
            result.pendingRefunds = item.count;
            break;
          case 'approved':
            result.approvedRefunds = item.count;
            break;
          case 'rejected':
            result.rejectedRefunds = item.count;
            break;
          case 'completed':
            result.completedRefunds = item.count;
            break;
        }
      });

      return result;
    } catch (error) {
      logger.error('获取退款统计信息失败:', error);
      throw error;
    }
  }

  /**
   * 创建退款记录（可选，用于处理内部退款创建）
   * @param {Object} refundData - 退款数据
   * @param {Object} [transaction] - 事务对象
   * @returns {Promise<Object>} 创建的退款记录
   */
  async createRefund(refundData, transaction = null) {
    try {
      const [refundId] = await this.db('refunds')
        .insert(refundData)
        .transacting(transaction);

      return this.getRefundDetail({ refundId });
    } catch (error) {
      logger.error('创建退款记录失败:', error);
      throw error;
    }
  }

  /**
   * 获取指定订单的所有退款记录
   * @param {string} orderId - 订单ID
   * @param {Object} [transaction] - 事务对象
   * @returns {Promise<Array>} 退款记录列表
   */
  async getRefundsByOrderId(orderId, transaction = null) {
    try {
      return await this.db('refunds')
        .where('order_id', '=', orderId)
        .orderBy('created_at', 'desc')
        .transacting(transaction);
    } catch (error) {
      logger.error('获取订单退款记录失败:', error);
      throw error;
    }
  }
}

// 创建仓库实例
const refundRepository = new RefundRepository();

// 注册到依赖注入容器
try {
  di.register('refundRepository', refundRepository);
} catch (error) {
  logger.warn('依赖注入容器注册退款仓库失败:', error);
}

module.exports = refundRepository;