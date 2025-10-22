/**
 * 卖家端促销管理仓库
 * 实现促销活动相关的数据访问层功能
 */

const logger = require('../../../core/utils/logger');
const db = require('../../../core/database/database');
const di = require('../../../core/di/container');

/**
 * 促销管理仓库类
 * @class PromotionRepository
 */
class PromotionRepository {
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
   * 创建促销活动
   * @param {Object} data - 促销活动数据
   * @param {Object} [transaction] - 事务对象
   * @returns {Promise<Object>} 创建的促销活动
   */
  async createPromotion(data, transaction = null) {
    try {
      const [id] = await this.db('promotions')
        .insert(data)
        .transacting(transaction);

      return this.db('promotions')
        .where('id', '=', id)
        .first()
        .transacting(transaction);
    } catch (error) {
      logger.error('创建促销活动失败:', error);
      throw error;
    }
  }

  /**
   * 获取促销活动列表
   * @param {Object} params - 查询参数
   * @param {string} params.sellerId - 卖家ID
   * @param {string} [params.status] - 促销状态
   * @param {string} [params.type] - 促销类型
   * @param {number} params.page - 页码
   * @param {number} params.pageSize - 每页大小
   * @returns {Promise<Object>} 促销活动列表和总数
   */
  async getPromotionList(params) {
    try {
      const { sellerId, status, type, page, pageSize } = params;
      const queryBuilder = this.db('promotions')
        .where('seller_id', '=', sellerId);

      // 添加状态筛选
      if (status) {
        queryBuilder.where('status', '=', status);
      }

      // 添加类型筛选
      if (type) {
        queryBuilder.where('type', '=', type);
      }

      // 获取总数
      const total = await queryBuilder.clone().count('id as count').first();

      // 分页查询
      const items = await queryBuilder
        .orderBy('created_at', 'desc')
        .limit(pageSize)
        .offset((page - 1) * pageSize);

      return {
        items,
        total: parseInt(total.count)
      };
    } catch (error) {
      logger.error('获取促销活动列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取促销活动详情
   * @param {Object} params - 查询参数
   * @param {string} params.sellerId - 卖家ID
   * @param {string} params.promotionId - 促销活动ID
   * @param {Object} [transaction] - 事务对象
   * @returns {Promise<Object>} 促销活动详情
   */
  async getPromotionDetail(params, transaction = null) {
    try {
      const { sellerId, promotionId } = params;
      
      return this.db('promotions')
        .where('id', '=', promotionId)
        .where('seller_id', '=', sellerId)
        .first()
        .transacting(transaction);
    } catch (error) {
      logger.error('获取促销活动详情失败:', error);
      throw error;
    }
  }

  /**
   * 更新促销活动
   * @param {Object} params - 更新参数
   * @param {string} params.promotionId - 促销活动ID
   * @param {Object} params.data - 更新数据
   * @param {Object} [transaction] - 事务对象
   * @returns {Promise<Object>} 更新后的促销活动
   */
  async updatePromotion(params, transaction = null) {
    try {
      const { promotionId, data } = params;
      
      await this.db('promotions')
        .where('id', '=', promotionId)
        .update(data)
        .transacting(transaction);

      return this.db('promotions')
        .where('id', '=', promotionId)
        .first()
        .transacting(transaction);
    } catch (error) {
      logger.error('更新促销活动失败:', error);
      throw error;
    }
  }

  /**
   * 删除促销活动
   * @param {Object} params - 删除参数
   * @param {string} params.promotionId - 促销活动ID
   * @param {Object} [transaction] - 事务对象
   * @returns {Promise<number>} 删除结果
   */
  async deletePromotion(params, transaction = null) {
    try {
      const { promotionId } = params;
      
      return this.db('promotions')
        .where('id', '=', promotionId)
        .delete()
        .transacting(transaction);
    } catch (error) {
      logger.error('删除促销活动失败:', error);
      throw error;
    }
  }

  /**
   * 添加促销活动产品关联
   * @param {Object} params - 关联参数
   * @param {string} params.promotionId - 促销活动ID
   * @param {Array} params.productIds - 产品ID列表
   * @param {Object} [transaction] - 事务对象
   * @returns {Promise<void>}
   */
  async addPromotionProducts(params, transaction = null) {
    try {
      const { promotionId, productIds } = params;
      
      const promotionProducts = productIds.map(productId => ({
        promotion_id: promotionId,
        product_id: productId,
        created_at: new Date()
      }));

      await this.db('promotion_products')
        .insert(promotionProducts)
        .transacting(transaction);
    } catch (error) {
      logger.error('添加促销活动产品关联失败:', error);
      throw error;
    }
  }

  /**
   * 获取促销活动关联的产品ID列表
   * @param {Object} params - 查询参数
   * @param {string} params.promotionId - 促销活动ID
   * @returns {Promise<Array>} 产品ID列表
   */
  async getPromotionProductIds(params) {
    try {
      const { promotionId } = params;
      
      const results = await this.db('promotion_products')
        .select('product_id')
        .where('promotion_id', '=', promotionId);

      return results.map(row => row.product_id);
    } catch (error) {
      logger.error('获取促销活动产品ID列表失败:', error);
      throw error;
    }
  }

  /**
   * 更新促销活动产品关联
   * @param {Object} params - 更新参数
   * @param {string} params.promotionId - 促销活动ID
   * @param {Array} params.productIds - 产品ID列表
   * @param {Object} [transaction] - 事务对象
   * @returns {Promise<void>}
   */
  async updatePromotionProducts(params, transaction = null) {
    try {
      const { promotionId, productIds } = params;
      
      // 删除旧的关联
      await this.db('promotion_products')
        .where('promotion_id', '=', promotionId)
        .delete()
        .transacting(transaction);

      // 添加新的关联
      if (productIds && productIds.length > 0) {
        await this.addPromotionProducts(params, transaction);
      }
    } catch (error) {
      logger.error('更新促销活动产品关联失败:', error);
      throw error;
    }
  }

  /**
   * 删除促销活动产品关联
   * @param {Object} params - 删除参数
   * @param {string} params.promotionId - 促销活动ID
   * @param {Object} [transaction] - 事务对象
   * @returns {Promise<void>}
   */
  async deletePromotionProducts(params, transaction = null) {
    try {
      const { promotionId } = params;
      
      await this.db('promotion_products')
        .where('promotion_id', '=', promotionId)
        .delete()
        .transacting(transaction);
    } catch (error) {
      logger.error('删除促销活动产品关联失败:', error);
      throw error;
    }
  }

  /**
   * 获取促销活动效果统计
   * @param {Object} params - 查询参数
   * @param {string} params.sellerId - 卖家ID
   * @param {string} [params.promotionId] - 促销活动ID
   * @param {string} [params.startDate] - 开始日期
   * @param {string} [params.endDate] - 结束日期
   * @returns {Promise<Object>} 统计信息
   */
  async getPromotionStatistics(params) {
    try {
      const { sellerId, promotionId, startDate, endDate } = params;
      
      // 构建基础查询
      const baseQuery = this.db('order_items as oi')
        .select(
          this.db.raw('COUNT(DISTINCT oi.order_id) as order_count'),
          this.db.raw('COUNT(*) as item_count'),
          this.db.raw('SUM(oi.price * oi.quantity) as total_sales'),
          this.db.raw('SUM(oi.original_price * oi.quantity - oi.price * oi.quantity) as discount_amount')
        )
        .leftJoin('orders as o', 'oi.order_id', '=', 'o.id')
        .leftJoin('promotion_products as pp', 'oi.product_id', '=', 'pp.product_id')
        .leftJoin('promotions as p', 'pp.promotion_id', '=', 'p.id')
        .where('o.seller_id', '=', sellerId)
        .where('o.status', '=', 'completed');

      // 添加促销ID筛选
      if (promotionId) {
        baseQuery.where('p.id', '=', promotionId);
      }

      // 添加日期范围筛选
      if (startDate) {
        baseQuery.where('o.created_at', '>=', new Date(startDate));
      }
      if (endDate) {
        baseQuery.where('o.created_at', '<=', new Date(endDate + ' 23:59:59'));
      }

      // 执行查询
      const result = await baseQuery.first();

      // 获取参与促销的产品数量
      let productCount = 0;
      if (promotionId) {
        const productResult = await this.db('promotion_products')
          .count('product_id as count')
          .where('promotion_id', '=', promotionId)
          .first();
        productCount = productResult.count;
      } else {
        // 如果没有指定促销ID，获取所有活动的产品数量
        const productResult = await this.db('promotion_products as pp')
          .countDistinct('pp.product_id as count')
          .leftJoin('promotions as p', 'pp.promotion_id', '=', 'p.id')
          .where('p.seller_id', '=', sellerId)
          .first();
        productCount = productResult.count;
      }

      return {
        orderCount: result.order_count || 0,
        itemCount: result.item_count || 0,
        totalSales: result.total_sales || 0,
        discountAmount: result.discount_amount || 0,
        productCount
      };
    } catch (error) {
      logger.error('获取促销活动效果统计失败:', error);
      throw error;
    }
  }
}

// 创建仓库实例
const promotionRepository = new PromotionRepository();

// 注册到依赖注入容器
try {
  di.register('promotionRepository', promotionRepository);
} catch (error) {
  logger.warn('依赖注入容器注册促销仓库失败:', error);
}

module.exports = promotionRepository;