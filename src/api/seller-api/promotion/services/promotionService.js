/**
 * 卖家端促销管理服务
 * 处理促销活动相关的核心业务逻辑
 */

const logger = require('../../../core/utils/logger');
const promotionRepository = require('../repositories/promotionRepository');
const productService = require('../../product/services/productService');
const messageQueue = require('../../../core/utils/messageQueue');
const di = require('../../../core/di/container');

/**
 * 促销状态枚举
 */
const PROMOTION_STATUS = {
  DRAFT: 'draft',         // 草稿
  ACTIVE: 'active',       // 启用
  PAUSED: 'paused',       // 暂停
  ENDED: 'ended',         // 已结束
  EXPIRED: 'expired'      // 已过期
};

/**
 * 促销类型枚举
 */
const PROMOTION_TYPE = {
  DISCOUNT: 'discount',           // 折扣
  FULL_REDUCTION: 'full_reduction', // 满减
  FREE_GIFT: 'free_gift',         // 赠品
  COUPON: 'coupon',               // 优惠券
  FLASH_SALE: 'flash_sale',       // 秒杀
  GROUP_BUY: 'group_buy'          // 团购
};

/**
 * 促销管理服务类
 * @class PromotionService
 */
class PromotionService {
  constructor() {
    // 从依赖注入容器获取服务实例
    this.promotionRepository = di.get('promotionRepository') || promotionRepository;
    this.productService = di.get('productService') || productService;
    this.messageQueue = di.get('messageQueue') || messageQueue;
  }

  /**
   * 创建促销活动
   * @param {Object} params - 创建参数
   * @param {string} params.sellerId - 卖家ID
   * @param {string} params.name - 促销活动名称
   * @param {string} params.type - 促销类型
   * @param {string} params.description - 促销活动描述
   * @param {Date} params.startTime - 开始时间
   * @param {Date} params.endTime - 结束时间
   * @param {Object} params.rule - 促销规则
   * @param {Array} params.productIds - 适用产品ID列表
   * @param {string} [params.status] - 促销状态
   * @returns {Promise<Object>} 创建的促销活动
   */
  async createPromotion(params) {
    try {
      const { sellerId, name, type, description, startTime, endTime, rule, productIds, status = 'draft' } = params;

      // 验证促销类型
      if (!Object.values(PROMOTION_TYPE).includes(type)) {
        throw new Error('无效的促销类型');
      }

      // 验证时间范围
      if (startTime && endTime && new Date(startTime) >= new Date(endTime)) {
        throw new Error('开始时间必须早于结束时间');
      }

      // 验证产品是否属于该卖家
      if (productIds && productIds.length > 0) {
        const products = await this.productService.getProductsByIds({
          sellerId,
          productIds
        });

        if (products.length !== productIds.length) {
          throw new Error('部分产品不存在或不属于当前卖家');
        }
      }

      // 构建促销活动数据
      const promotionData = {
        seller_id: sellerId,
        name,
        type,
        description,
        start_time: startTime,
        end_time: endTime,
        rule: JSON.stringify(rule),
        status,
        created_at: new Date(),
        updated_at: new Date()
      };

      // 创建促销活动
      const promotion = await this.promotionRepository.createPromotion(promotionData);

      // 关联产品
      if (productIds && productIds.length > 0) {
        await this.promotionRepository.addPromotionProducts({
          promotionId: promotion.id,
          productIds
        });
      }

      // 发送促销创建消息
      await this.messageQueue.publish('PROMOTION_CREATED', {
        promotionId: promotion.id,
        sellerId,
        type,
        status
      });

      return {
        ...promotion,
        rule: JSON.parse(promotion.rule),
        productIds: productIds || []
      };
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
   * @returns {Promise<Object>} 促销活动列表和分页信息
   */
  async getPromotionList(params) {
    try {
      const { sellerId, status, type, page, pageSize } = params;

      // 调用仓库层获取促销活动列表
      const result = await this.promotionRepository.getPromotionList({
        sellerId,
        status,
        type,
        page,
        pageSize
      });

      // 格式化促销活动数据
      const formattedPromotions = result.items.map(promotion => ({
        id: promotion.id,
        name: promotion.name,
        type: promotion.type,
        description: promotion.description,
        status: promotion.status,
        startTime: promotion.start_time,
        endTime: promotion.end_time,
        createdAt: promotion.created_at,
        updatedAt: promotion.updated_at
      }));

      return {
        list: formattedPromotions,
        pagination: {
          total: result.total,
          page,
          pageSize,
          totalPages: Math.ceil(result.total / pageSize)
        }
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
   * @returns {Promise<Object>} 促销活动详情
   */
  async getPromotionDetail(params) {
    try {
      const { sellerId, promotionId } = params;

      // 获取促销活动基本信息
      const promotion = await this.promotionRepository.getPromotionDetail({
        sellerId,
        promotionId
      });

      if (!promotion) {
        throw new Error('促销活动不存在');
      }

      // 获取关联的产品ID列表
      const productIds = await this.promotionRepository.getPromotionProductIds({
        promotionId
      });

      // 格式化返回数据
      return {
        id: promotion.id,
        name: promotion.name,
        type: promotion.type,
        description: promotion.description,
        status: promotion.status,
        startTime: promotion.start_time,
        endTime: promotion.end_time,
        rule: JSON.parse(promotion.rule),
        productIds,
        createdAt: promotion.created_at,
        updatedAt: promotion.updated_at
      };
    } catch (error) {
      logger.error('获取促销活动详情失败:', error);
      throw error;
    }
  }

  /**
   * 更新促销活动
   * @param {Object} params - 更新参数
   * @param {string} params.sellerId - 卖家ID
   * @param {string} params.promotionId - 促销活动ID
   * @param {Object} params.data - 更新数据
   * @returns {Promise<Object>} 更新后的促销活动
   */
  async updatePromotion(params) {
    try {
      const { sellerId, promotionId, data } = params;

      // 检查促销活动是否存在
      const existingPromotion = await this.promotionRepository.getPromotionDetail({
        sellerId,
        promotionId
      });

      if (!existingPromotion) {
        throw new Error('促销活动不存在');
      }

      // 准备更新数据
      const updateData = { ...data };
      updateData.updated_at = new Date();

      // 如果更新规则，需要序列化
      if (updateData.rule) {
        updateData.rule = JSON.stringify(updateData.rule);
      }

      // 更新促销活动
      const result = await this.promotionRepository.updatePromotion({
        promotionId,
        data: updateData
      });

      // 如果更新了产品列表
      if (data.productIds) {
        // 验证产品是否属于该卖家
        const products = await this.productService.getProductsByIds({
          sellerId,
          productIds: data.productIds
        });

        if (products.length !== data.productIds.length) {
          throw new Error('部分产品不存在或不属于当前卖家');
        }

        // 更新关联产品
        await this.promotionRepository.updatePromotionProducts({
          promotionId,
          productIds: data.productIds
        });
      }

      // 发送促销更新消息
      await this.messageQueue.publish('PROMOTION_UPDATED', {
        promotionId,
        sellerId,
        updatedFields: Object.keys(data)
      });

      return result;
    } catch (error) {
      logger.error('更新促销活动失败:', error);
      throw error;
    }
  }

  /**
   * 更新促销活动状态
   * @param {Object} params - 更新参数
   * @param {string} params.sellerId - 卖家ID
   * @param {string} params.promotionId - 促销活动ID
   * @param {string} params.status - 新状态
   * @returns {Promise<Object>} 更新结果
   */
  async updatePromotionStatus(params) {
    try {
      const { sellerId, promotionId, status } = params;

      // 验证状态值
      if (!Object.values(PROMOTION_STATUS).includes(status)) {
        throw new Error('无效的促销状态');
      }

      // 更新状态
      const result = await this.promotionRepository.updatePromotion({
        promotionId,
        data: {
          status,
          updated_at: new Date()
        }
      });

      // 发送状态变更消息
      await this.messageQueue.publish('PROMOTION_STATUS_CHANGED', {
        promotionId,
        sellerId,
        status
      });

      return result;
    } catch (error) {
      logger.error('更新促销活动状态失败:', error);
      throw error;
    }
  }

  /**
   * 删除促销活动
   * @param {Object} params - 删除参数
   * @param {string} params.sellerId - 卖家ID
   * @param {string} params.promotionId - 促销活动ID
   * @returns {Promise<void>}
   */
  async deletePromotion(params) {
    try {
      const { sellerId, promotionId } = params;

      // 检查促销活动是否存在
      const existingPromotion = await this.promotionRepository.getPromotionDetail({
        sellerId,
        promotionId
      });

      if (!existingPromotion) {
        throw new Error('促销活动不存在');
      }

      // 开启事务
      const transaction = await this.promotionRepository.beginTransaction();

      try {
        // 删除促销产品关联
        await this.promotionRepository.deletePromotionProducts({
          promotionId,
          transaction
        });

        // 删除促销活动
        await this.promotionRepository.deletePromotion({
          promotionId,
          transaction
        });

        // 提交事务
        await transaction.commit();

        // 发送删除消息
        await this.messageQueue.publish('PROMOTION_DELETED', {
          promotionId,
          sellerId
        });
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      logger.error('删除促销活动失败:', error);
      throw error;
    }
  }

  /**
   * 获取促销活动效果统计
   * @param {Object} params - 查询参数
   * @param {string} params.sellerId - 卖家ID
   * @param {string} [params.promotionId] - 促销活动ID（可选，不提供则统计所有活动）
   * @param {string} [params.startDate] - 开始日期
   * @param {string} [params.endDate] - 结束日期
   * @returns {Promise<Object>} 统计信息
   */
  async getPromotionStatistics(params) {
    try {
      const { sellerId, promotionId, startDate, endDate } = params;

      // 获取促销活动效果统计
      const statistics = await this.promotionRepository.getPromotionStatistics({
        sellerId,
        promotionId,
        startDate,
        endDate
      });

      return statistics;
    } catch (error) {
      logger.error('获取促销活动效果统计失败:', error);
      throw error;
    }
  }
}

// 创建服务实例
const promotionService = new PromotionService();

// 注册到依赖注入容器
try {
  di.register('promotionService', promotionService);
} catch (error) {
  logger.warn('依赖注入容器注册促销服务失败:', error);
}

module.exports = promotionService;