/**
 * 卖家端促销管理控制器
 * 处理促销活动相关的HTTP请求
 */

const logger = require('../../../core/utils/logger');
const promotionService = require('../services/promotionService');
const di = require('../../../core/di/container');

/**
 * 促销管理控制器类
 * @class PromotionController
 */
class PromotionController {
  constructor() {
    // 从依赖注入容器获取服务实例
    this.promotionService = di.get('promotionService') || promotionService;
  }

  /**
   * 创建促销活动
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件
   */
  async createPromotion(req, res, next) {
    try {
      const { sellerId } = req.user;
      const promotionData = req.body;

      logger.info(`卖家[${sellerId}]创建促销活动请求`, {
        promotionType: promotionData.type,
        name: promotionData.name
      });

      const result = await this.promotionService.createPromotion({
        sellerId,
        ...promotionData
      });

      logger.info(`卖家[${sellerId}]创建促销活动成功`, { promotionId: result.id });
      res.json({
        success: true,
        message: '促销活动创建成功',
        data: result
      });
    } catch (error) {
      logger.error(`创建促销活动失败:`, error);
      next(error);
    }
  }

  /**
   * 获取促销活动列表
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件
   */
  async getPromotionList(req, res, next) {
    try {
      const { sellerId } = req.user;
      const { status, type, page = 1, pageSize = 10 } = req.query;

      logger.info(`卖家[${sellerId}]获取促销活动列表请求`, {
        status,
        type,
        page,
        pageSize
      });

      const result = await this.promotionService.getPromotionList({
        sellerId,
        status,
        type,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      });

      logger.info(`卖家[${sellerId}]获取促销活动列表成功`);
      res.json({
        success: true,
        message: '获取促销活动列表成功',
        data: result
      });
    } catch (error) {
      logger.error(`获取促销活动列表失败:`, error);
      next(error);
    }
  }

  /**
   * 获取促销活动详情
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件
   */
  async getPromotionDetail(req, res, next) {
    try {
      const { sellerId } = req.user;
      const { id } = req.params;

      logger.info(`卖家[${sellerId}]获取促销活动详情请求`, {
        promotionId: id
      });

      const promotionDetail = await this.promotionService.getPromotionDetail({
        sellerId,
        promotionId: id
      });

      logger.info(`卖家[${sellerId}]获取促销活动详情成功`);
      res.json({
        success: true,
        message: '获取促销活动详情成功',
        data: promotionDetail
      });
    } catch (error) {
      logger.error(`获取促销活动详情失败:`, error);
      next(error);
    }
  }

  /**
   * 更新促销活动
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件
   */
  async updatePromotion(req, res, next) {
    try {
      const { sellerId } = req.user;
      const { id } = req.params;
      const updateData = req.body;

      logger.info(`卖家[${sellerId}]更新促销活动请求`, {
        promotionId: id
      });

      const result = await this.promotionService.updatePromotion({
        sellerId,
        promotionId: id,
        data: updateData
      });

      logger.info(`卖家[${sellerId}]更新促销活动成功`, { promotionId: id });
      res.json({
        success: true,
        message: '促销活动更新成功',
        data: result
      });
    } catch (error) {
      logger.error(`更新促销活动失败:`, error);
      next(error);
    }
  }

  /**
   * 暂停促销活动
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件
   */
  async pausePromotion(req, res, next) {
    try {
      const { sellerId } = req.user;
      const { id } = req.params;

      logger.info(`卖家[${sellerId}]暂停促销活动请求`, {
        promotionId: id
      });

      const result = await this.promotionService.updatePromotionStatus({
        sellerId,
        promotionId: id,
        status: 'paused'
      });

      logger.info(`卖家[${sellerId}]暂停促销活动成功`, { promotionId: id });
      res.json({
        success: true,
        message: '促销活动暂停成功',
        data: result
      });
    } catch (error) {
      logger.error(`暂停促销活动失败:`, error);
      next(error);
    }
  }

  /**
   * 启用促销活动
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件
   */
  async activatePromotion(req, res, next) {
    try {
      const { sellerId } = req.user;
      const { id } = req.params;

      logger.info(`卖家[${sellerId}]启用促销活动请求`, {
        promotionId: id
      });

      const result = await this.promotionService.updatePromotionStatus({
        sellerId,
        promotionId: id,
        status: 'active'
      });

      logger.info(`卖家[${sellerId}]启用促销活动成功`, { promotionId: id });
      res.json({
        success: true,
        message: '促销活动启用成功',
        data: result
      });
    } catch (error) {
      logger.error(`启用促销活动失败:`, error);
      next(error);
    }
  }

  /**
   * 删除促销活动
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件
   */
  async deletePromotion(req, res, next) {
    try {
      const { sellerId } = req.user;
      const { id } = req.params;

      logger.info(`卖家[${sellerId}]删除促销活动请求`, {
        promotionId: id
      });

      await this.promotionService.deletePromotion({
        sellerId,
        promotionId: id
      });

      logger.info(`卖家[${sellerId}]删除促销活动成功`, { promotionId: id });
      res.json({
        success: true,
        message: '促销活动删除成功'
      });
    } catch (error) {
      logger.error(`删除促销活动失败:`, error);
      next(error);
    }
  }

  /**
   * 获取促销活动效果统计
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件
   */
  async getPromotionStatistics(req, res, next) {
    try {
      const { sellerId } = req.user;
      const { promotionId, startDate, endDate } = req.query;

      logger.info(`卖家[${sellerId}]获取促销活动效果统计请求`, {
        promotionId,
        startDate,
        endDate
      });

      const statistics = await this.promotionService.getPromotionStatistics({
        sellerId,
        promotionId,
        startDate,
        endDate
      });

      logger.info(`卖家[${sellerId}]获取促销活动效果统计成功`);
      res.json({
        success: true,
        message: '获取促销活动效果统计成功',
        data: statistics
      });
    } catch (error) {
      logger.error(`获取促销活动效果统计失败:`, error);
      next(error);
    }
  }
}

module.exports = new PromotionController();