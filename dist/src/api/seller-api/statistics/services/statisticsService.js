/**
 * 卖家端统计管理服务
 * 实现销售统计、流量统计等核心业务逻辑
 */

const logger = require('../../../core/utils/logger');
const statisticsRepository = require('../repositories/statisticsRepository');

/**
 * 统计管理服务
 * @class StatisticsService
 */
class StatisticsService {
  /**
   * 获取销售统计
   * @param {Object} params - 查询参数
   * @param {number} params.sellerId - 卖家ID
   * @param {string} params.startDate - 开始日期
   * @param {string} params.endDate - 结束日期
   * @param {string} params.period - 统计周期 (day/week/month)
   * @returns {Promise<Object>} 销售统计数据
   */
  async getSalesStatistics(params) {
    const { sellerId, startDate, endDate, period } = params;
    
    try {
      logger.info(`获取销售统计服务`, { sellerId, startDate, endDate, period });
      
      // 调用仓库获取统计数据
      const dailyStats = await statisticsRepository.getSalesByPeriod({
        sellerId,
        startDate,
        endDate,
        period
      });
      
      // 计算汇总数据
      const totalSales = dailyStats.reduce((sum, item) => sum + item.salesAmount, 0);
      const totalOrders = dailyStats.reduce((sum, item) => sum + item.orderCount, 0);
      const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
      
      return {
        dailyStats,
        summary: {
          totalSales,
          totalOrders,
          averageOrderValue: parseFloat(averageOrderValue.toFixed(2))
        }
      };
    } catch (error) {
      logger.error('获取销售统计服务失败:', error);
      throw new Error('获取销售统计失败');
    }
  }

  /**
   * 获取流量统计
   * @param {Object} params - 查询参数
   * @param {number} params.sellerId - 卖家ID
   * @param {string} params.startDate - 开始日期
   * @param {string} params.endDate - 结束日期
   * @param {string} params.period - 统计周期 (day/week/month)
   * @returns {Promise<Object>} 流量统计数据
   */
  async getTrafficStatistics(params) {
    const { sellerId, startDate, endDate, period } = params;
    
    try {
      logger.info(`获取流量统计服务`, { sellerId, startDate, endDate, period });
      
      // 调用仓库获取统计数据
      const dailyStats = await statisticsRepository.getTrafficByPeriod({
        sellerId,
        startDate,
        endDate,
        period
      });
      
      // 计算汇总数据
      const totalPV = dailyStats.reduce((sum, item) => sum + item.pv, 0);
      const totalUV = dailyStats.reduce((sum, item) => sum + item.uv, 0);
      const averagePV = totalUV > 0 ? totalPV / totalUV : 0;
      
      return {
        dailyStats,
        summary: {
          totalPV,
          totalUV,
          averagePV: parseFloat(averagePV.toFixed(2))
        }
      };
    } catch (error) {
      logger.error('获取流量统计服务失败:', error);
      throw new Error('获取流量统计失败');
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
      logger.info(`获取产品销量排行服务`, { sellerId, startDate, endDate, limit });
      
      // 调用仓库获取产品销量排行
      return await statisticsRepository.getProductSalesRanking({
        sellerId,
        startDate,
        endDate,
        limit
      });
    } catch (error) {
      logger.error('获取产品销量排行服务失败:', error);
      throw new Error('获取产品销量排行失败');
    }
  }

  /**
   * 获取店铺经营概览
   * @param {Object} params - 查询参数
   * @param {number} params.sellerId - 卖家ID
   * @param {string} params.dateRange - 日期范围 (7days/30days/90days)
   * @returns {Promise<Object>} 店铺经营概览数据
   */
  async getStoreOverview(params) {
    const { sellerId, dateRange } = params;
    
    try {
      logger.info(`获取店铺经营概览服务`, { sellerId, dateRange });
      
      // 计算日期范围
      const now = new Date();
      const endDate = now.toISOString().split('T')[0];
      let startDate;
      
      if (dateRange === '7days') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      } else if (dateRange === '30days') {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      } else if (dateRange === '90days') {
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      } else {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      }
      
      // 并行获取各项统计数据
      const [salesOverview, trafficOverview, orderOverview] = await Promise.all([
        statisticsRepository.getSalesOverview(sellerId, startDate, endDate),
        statisticsRepository.getTrafficOverview(sellerId, startDate, endDate),
        statisticsRepository.getOrderOverview(sellerId, startDate, endDate)
      ]);
      
      return {
        salesOverview,
        trafficOverview,
        orderOverview,
        dateRange,
        period: {
          startDate,
          endDate
        }
      };
    } catch (error) {
      logger.error('获取店铺经营概览服务失败:', error);
      throw new Error('获取店铺经营概览失败');
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
      logger.info(`获取用户购买行为统计服务`, { sellerId, startDate, endDate });
      
      // 调用仓库获取用户购买行为统计
      const behaviorStats = await statisticsRepository.getUserPurchaseBehavior({
        sellerId,
        startDate,
        endDate
      });
      
      // 计算转化率等指标
      const { visitCount, orderCount, addToCartCount } = behaviorStats;
      const conversionRate = visitCount > 0 ? (orderCount / visitCount) * 100 : 0;
      const cartToOrderRate = addToCartCount > 0 ? (orderCount / addToCartCount) * 100 : 0;
      
      return {
        ...behaviorStats,
        conversionRate: parseFloat(conversionRate.toFixed(2)),
        cartToOrderRate: parseFloat(cartToOrderRate.toFixed(2))
      };
    } catch (error) {
      logger.error('获取用户购买行为统计服务失败:', error);
      throw new Error('获取用户购买行为统计失败');
    }
  }

  /**
   * 获取订单状态分布
   * @param {Object} params - 查询参数
   * @param {number} params.sellerId - 卖家ID
   * @param {string} params.startDate - 开始日期
   * @param {string} params.endDate - 结束日期
   * @returns {Promise<Object>} 订单状态分布
   */
  async getOrderStatusDistribution(params) {
    const { sellerId, startDate, endDate } = params;
    
    try {
      logger.info(`获取订单状态分布服务`, { sellerId, startDate, endDate });
      
      // 调用仓库获取订单状态分布
      const statusDistribution = await statisticsRepository.getOrderStatusDistribution({
        sellerId,
        startDate,
        endDate
      });
      
      // 计算总数
      const totalCount = statusDistribution.reduce((sum, item) => sum + item.count, 0);
      
      // 计算百分比
      const withPercentage = statusDistribution.map(item => ({
        ...item,
        percentage: totalCount > 0 ? parseFloat(((item.count / totalCount) * 100).toFixed(2)) : 0
      }));
      
      return {
        distribution: withPercentage,
        totalCount
      };
    } catch (error) {
      logger.error('获取订单状态分布服务失败:', error);
      throw new Error('获取订单状态分布失败');
    }
  }
}

module.exports = new StatisticsService();