/**
 * 卖家端统计管理控制器
 * 实现销售统计、流量统计、产品销量排行等功能
 */

const logger = require('../../../core/utils/logger');
const statisticsService = require('../services/statisticsService');

/**
 * 统计管理控制器
 * @class StatisticsController
 */
class StatisticsController {
  /**
   * 获取销售统计
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async getSalesStatistics(req, res) {
    try {
      const sellerId = req.user.id;
      const { startDate, endDate, period = 'day' } = req.query;
      
      logger.info(`卖家[${sellerId}]获取销售统计`, { startDate, endDate, period });
      
      const statistics = await statisticsService.getSalesStatistics({
        sellerId,
        startDate,
        endDate,
        period
      });
      
      logger.info(`卖家[${sellerId}]获取销售统计成功`);
      
      return res.json({
        success: true,
        message: '获取销售统计成功',
        data: statistics
      });
    } catch (error) {
      logger.error('获取销售统计失败:', error);
      
      return res.status(500).json({
        success: false,
        message: error.message || '获取销售统计失败'
      });
    }
  }

  /**
   * 获取流量统计
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async getTrafficStatistics(req, res) {
    try {
      const sellerId = req.user.id;
      const { startDate, endDate, period = 'day' } = req.query;
      
      logger.info(`卖家[${sellerId}]获取流量统计`, { startDate, endDate, period });
      
      const statistics = await statisticsService.getTrafficStatistics({
        sellerId,
        startDate,
        endDate,
        period
      });
      
      logger.info(`卖家[${sellerId}]获取流量统计成功`);
      
      return res.json({
        success: true,
        message: '获取流量统计成功',
        data: statistics
      });
    } catch (error) {
      logger.error('获取流量统计失败:', error);
      
      return res.status(500).json({
        success: false,
        message: error.message || '获取流量统计失败'
      });
    }
  }

  /**
   * 获取产品销量排行
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async getProductSalesRanking(req, res) {
    try {
      const sellerId = req.user.id;
      const { startDate, endDate, limit = 10 } = req.query;
      
      logger.info(`卖家[${sellerId}]获取产品销量排行`, { startDate, endDate, limit });
      
      const ranking = await statisticsService.getProductSalesRanking({
        sellerId,
        startDate,
        endDate,
        limit: parseInt(limit)
      });
      
      logger.info(`卖家[${sellerId}]获取产品销量排行成功`);
      
      return res.json({
        success: true,
        message: '获取产品销量排行成功',
        data: ranking
      });
    } catch (error) {
      logger.error('获取产品销量排行失败:', error);
      
      return res.status(500).json({
        success: false,
        message: error.message || '获取产品销量排行失败'
      });
    }
  }

  /**
   * 获取店铺经营概览
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async getStoreOverview(req, res) {
    try {
      const sellerId = req.user.id;
      const { dateRange = '7days' } = req.query;
      
      logger.info(`卖家[${sellerId}]获取店铺经营概览`, { dateRange });
      
      const overview = await statisticsService.getStoreOverview({
        sellerId,
        dateRange
      });
      
      logger.info(`卖家[${sellerId}]获取店铺经营概览成功`);
      
      return res.json({
        success: true,
        message: '获取店铺经营概览成功',
        data: overview
      });
    } catch (error) {
      logger.error('获取店铺经营概览失败:', error);
      
      return res.status(500).json({
        success: false,
        message: error.message || '获取店铺经营概览失败'
      });
    }
  }

  /**
   * 获取用户购买行为统计
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async getUserPurchaseBehavior(req, res) {
    try {
      const sellerId = req.user.id;
      const { startDate, endDate } = req.query;
      
      logger.info(`卖家[${sellerId}]获取用户购买行为统计`, { startDate, endDate });
      
      const behavior = await statisticsService.getUserPurchaseBehavior({
        sellerId,
        startDate,
        endDate
      });
      
      logger.info(`卖家[${sellerId}]获取用户购买行为统计成功`);
      
      return res.json({
        success: true,
        message: '获取用户购买行为统计成功',
        data: behavior
      });
    } catch (error) {
      logger.error('获取用户购买行为统计失败:', error);
      
      return res.status(500).json({
        success: false,
        message: error.message || '获取用户购买行为统计失败'
      });
    }
  }

  /**
   * 获取订单状态分布
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async getOrderStatusDistribution(req, res) {
    try {
      const sellerId = req.user.id;
      const { startDate, endDate } = req.query;
      
      logger.info(`卖家[${sellerId}]获取订单状态分布`, { startDate, endDate });
      
      const distribution = await statisticsService.getOrderStatusDistribution({
        sellerId,
        startDate,
        endDate
      });
      
      logger.info(`卖家[${sellerId}]获取订单状态分布成功`);
      
      return res.json({
        success: true,
        message: '获取订单状态分布成功',
        data: distribution
      });
    } catch (error) {
      logger.error('获取订单状态分布失败:', error);
      
      return res.status(500).json({
        success: false,
        message: error.message || '获取订单状态分布失败'
      });
    }
  }
}

module.exports = new StatisticsController();