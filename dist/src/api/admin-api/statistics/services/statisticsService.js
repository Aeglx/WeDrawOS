/**
 * 数据统计服务
 * 实现数据统计相关的业务逻辑
 */

const { container } = require('../../../core/di/dependencyInjector');
const logger = require('../../../core/logger');
const cacheService = require('../../../core/cache/cacheService');

class StatisticsService {
  constructor() {
    this.statisticsRepository = container.get('statisticsRepository');
  }

  /**
   * 获取系统概览统计
   * @returns {Promise<Object>} 系统概览统计数据
   */
  async getSystemOverview() {
    try {
      // 尝试从缓存获取
      const cacheKey = 'statistics:system_overview';
      const cachedData = await cacheService.get(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      // 获取各项统计数据
      const [userStats, contentStats, operationStats, wechatStats] = await Promise.all([
        this.statisticsRepository.getUserStats(),
        this.statisticsRepository.getContentStats(),
        this.statisticsRepository.getOperationStats(),
        this.statisticsRepository.getWechatStats()
      ]);

      const overview = {
        totalUsers: userStats.total,
        activeUsers: userStats.active,
        newUsersToday: userStats.newToday,
        totalContents: contentStats.total,
        contentsToday: contentStats.today,
        totalOperations: operationStats.total,
        operationsToday: operationStats.today,
        wechatAccounts: wechatStats.accounts,
        wechatMessages: wechatStats.messages,
        workWechatGroups: wechatStats.workGroups,
        onlineStatus: '正常',
        systemTime: new Date().toISOString()
      };

      // 缓存结果，有效期5分钟
      await cacheService.set(cacheKey, overview, 300);

      return overview;
    } catch (error) {
      logger.error('获取系统概览失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户增长统计
   * @param {string} startDate - 开始日期
   * @param {string} endDate - 结束日期
   * @param {string} interval - 时间间隔（day/week/month）
   * @returns {Promise<Object>} 用户增长统计数据
   */
  async getUserGrowthStats(startDate, endDate, interval = 'day') {
    try {
      return await this.statisticsRepository.getUserGrowthStats(startDate, endDate, interval);
    } catch (error) {
      logger.error('获取用户增长统计失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户活跃度统计
   * @param {string} period - 统计周期（day/week/month）
   * @returns {Promise<Object>} 用户活跃度统计数据
   */
  async getUserActivityStats(period = 'week') {
    try {
      return await this.statisticsRepository.getUserActivityStats(period);
    } catch (error) {
      logger.error('获取用户活跃度统计失败:', error);
      throw error;
    }
  }

  /**
   * 获取内容数据统计
   * @param {string} contentType - 内容类型
   * @param {string} startDate - 开始日期
   * @param {string} endDate - 结束日期
   * @returns {Promise<Object>} 内容数据统计
   */
  async getContentStats(contentType, startDate, endDate) {
    try {
      return await this.statisticsRepository.getDetailedContentStats(contentType, startDate, endDate);
    } catch (error) {
      logger.error('获取内容数据统计失败:', error);
      throw error;
    }
  }

  /**
   * 获取运营数据统计
   * @param {string} metric - 统计指标
   * @param {string} startDate - 开始日期
   * @param {string} endDate - 结束日期
   * @returns {Promise<Object>} 运营数据统计
   */
  async getOperationStats(metric, startDate, endDate) {
    try {
      return await this.statisticsRepository.getOperationMetricStats(metric, startDate, endDate);
    } catch (error) {
      logger.error('获取运营数据统计失败:', error);
      throw error;
    }
  }

  /**
   * 获取广告数据统计
   * @param {string} adId - 广告ID
   * @param {string} startDate - 开始日期
   * @param {string} endDate - 结束日期
   * @returns {Promise<Object>} 广告数据统计
   */
  async getAdvertisementStats(adId, startDate, endDate) {
    try {
      return await this.statisticsRepository.getAdvertisementStats(adId, startDate, endDate);
    } catch (error) {
      logger.error('获取广告数据统计失败:', error);
      throw error;
    }
  }

  /**
   * 获取公众号数据统计
   * @param {string} accountId - 账号ID
   * @param {string} startDate - 开始日期
   * @param {string} endDate - 结束日期
   * @param {string} metric - 统计指标
   * @returns {Promise<Object>} 公众号数据统计
   */
  async getWechatStats(accountId, startDate, endDate, metric) {
    try {
      return await this.statisticsRepository.getWechatAccountStats(accountId, startDate, endDate, metric);
    } catch (error) {
      logger.error('获取公众号数据统计失败:', error);
      throw error;
    }
  }

  /**
   * 获取企业微信数据统计
   * @param {string} corpId - 企业ID
   * @param {string} startDate - 开始日期
   * @param {string} endDate - 结束日期
   * @param {string} metric - 统计指标
   * @returns {Promise<Object>} 企业微信数据统计
   */
  async getWorkWechatStats(corpId, startDate, endDate, metric) {
    try {
      return await this.statisticsRepository.getWorkWechatStats(corpId, startDate, endDate, metric);
    } catch (error) {
      logger.error('获取企业微信数据统计失败:', error);
      throw error;
    }
  }

  /**
   * 生成数据统计报告
   * @param {string} type - 报告类型
   * @param {string} startDate - 开始日期
   * @param {string} endDate - 结束日期
   * @param {string} format - 导出格式
   * @returns {Promise<Buffer|string>} 报告数据
   */
  async generateStatisticsReport(type, startDate, endDate, format = 'excel') {
    try {
      // 根据类型获取相应的统计数据
      let data;
      
      switch (type) {
        case 'user':
          data = await this.getUserGrowthStats(startDate, endDate);
          break;
        case 'content':
          data = await this.getContentStats(null, startDate, endDate);
          break;
        case 'operation':
          data = await this.getOperationStats(null, startDate, endDate);
          break;
        case 'wechat':
          data = await this.getWechatStats(null, startDate, endDate);
          break;
        default:
          // 综合报告
          data = await this.getSystemOverview();
      }

      // 模拟生成报告数据
      // 实际项目中应该使用适当的库生成Excel或CSV
      if (format === 'excel') {
        // 模拟Excel文件数据
        return Buffer.from(JSON.stringify(data, null, 2));
      } else {
        // 模拟CSV数据
        return JSON.stringify(data, null, 2);
      }
    } catch (error) {
      logger.error('生成数据统计报告失败:', error);
      throw error;
    }
  }

  /**
   * 获取数据统计趋势
   * @param {string} metric - 统计指标
   * @param {string} startDate - 开始日期
   * @param {string} endDate - 结束日期
   * @param {string} interval - 时间间隔
   * @returns {Promise<Object>} 数据统计趋势
   */
  async getStatisticsTrend(metric, startDate, endDate, interval = 'day') {
    try {
      return await this.statisticsRepository.getStatisticsTrend(metric, startDate, endDate, interval);
    } catch (error) {
      logger.error('获取数据统计趋势失败:', error);
      throw error;
    }
  }
}

module.exports = new StatisticsService();