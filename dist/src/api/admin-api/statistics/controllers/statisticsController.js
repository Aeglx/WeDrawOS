/**
 * 数据统计控制器
 * 处理数据统计相关的API请求
 */

const { container } = require('../../../core/di/dependencyInjector');
const logger = require('../../../core/logger');

class StatisticsController {
  constructor() {
    this.statisticsService = container.get('statisticsService');
  }

  /**
   * 获取系统概览统计
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async getSystemOverview(req, res) {
    try {
      const stats = await this.statisticsService.getSystemOverview();
      res.status(200).json({ success: true, data: stats });
    } catch (error) {
      logger.error('获取系统概览失败:', error);
      res.status(500).json({ success: false, message: '获取系统概览失败', error: error.message });
    }
  }

  /**
   * 获取用户增长统计
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async getUserGrowthStats(req, res) {
    try {
      const { startDate, endDate, interval } = req.query;
      const stats = await this.statisticsService.getUserGrowthStats(startDate, endDate, interval);
      res.status(200).json({ success: true, data: stats });
    } catch (error) {
      logger.error('获取用户增长统计失败:', error);
      res.status(500).json({ success: false, message: '获取用户增长统计失败', error: error.message });
    }
  }

  /**
   * 获取用户活跃度统计
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async getUserActivityStats(req, res) {
    try {
      const { period } = req.query;
      const stats = await this.statisticsService.getUserActivityStats(period);
      res.status(200).json({ success: true, data: stats });
    } catch (error) {
      logger.error('获取用户活跃度统计失败:', error);
      res.status(500).json({ success: false, message: '获取用户活跃度统计失败', error: error.message });
    }
  }

  /**
   * 获取内容数据统计
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async getContentStats(req, res) {
    try {
      const { contentType, startDate, endDate } = req.query;
      const stats = await this.statisticsService.getContentStats(contentType, startDate, endDate);
      res.status(200).json({ success: true, data: stats });
    } catch (error) {
      logger.error('获取内容数据统计失败:', error);
      res.status(500).json({ success: false, message: '获取内容数据统计失败', error: error.message });
    }
  }

  /**
   * 获取运营数据统计
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async getOperationStats(req, res) {
    try {
      const { metric, startDate, endDate } = req.query;
      const stats = await this.statisticsService.getOperationStats(metric, startDate, endDate);
      res.status(200).json({ success: true, data: stats });
    } catch (error) {
      logger.error('获取运营数据统计失败:', error);
      res.status(500).json({ success: false, message: '获取运营数据统计失败', error: error.message });
    }
  }

  /**
   * 获取广告数据统计
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async getAdvertisementStats(req, res) {
    try {
      const { adId, startDate, endDate } = req.query;
      const stats = await this.statisticsService.getAdvertisementStats(adId, startDate, endDate);
      res.status(200).json({ success: true, data: stats });
    } catch (error) {
      logger.error('获取广告数据统计失败:', error);
      res.status(500).json({ success: false, message: '获取广告数据统计失败', error: error.message });
    }
  }

  /**
   * 获取公众号数据统计
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async getWechatStats(req, res) {
    try {
      const { accountId, startDate, endDate, metric } = req.query;
      const stats = await this.statisticsService.getWechatStats(accountId, startDate, endDate, metric);
      res.status(200).json({ success: true, data: stats });
    } catch (error) {
      logger.error('获取公众号数据统计失败:', error);
      res.status(500).json({ success: false, message: '获取公众号数据统计失败', error: error.message });
    }
  }

  /**
   * 获取企业微信数据统计
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async getWorkWechatStats(req, res) {
    try {
      const { corpId, startDate, endDate, metric } = req.query;
      const stats = await this.statisticsService.getWorkWechatStats(corpId, startDate, endDate, metric);
      res.status(200).json({ success: true, data: stats });
    } catch (error) {
      logger.error('获取企业微信数据统计失败:', error);
      res.status(500).json({ success: false, message: '获取企业微信数据统计失败', error: error.message });
    }
  }

  /**
   * 导出数据统计报告
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async exportStatisticsReport(req, res) {
    try {
      const { type, startDate, endDate, format } = req.query;
      const report = await this.statisticsService.generateStatisticsReport(type, startDate, endDate, format);
      
      // 设置响应头，根据format决定导出类型
      const contentType = format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv';
      const fileExtension = format === 'excel' ? 'xlsx' : 'csv';
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename=statistics-report-${Date.now()}.${fileExtension}`);
      
      res.status(200).send(report);
    } catch (error) {
      logger.error('导出数据统计报告失败:', error);
      res.status(500).json({ success: false, message: '导出数据统计报告失败', error: error.message });
    }
  }

  /**
   * 获取数据统计趋势
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async getStatisticsTrend(req, res) {
    try {
      const { metric, startDate, endDate, interval } = req.query;
      const trend = await this.statisticsService.getStatisticsTrend(metric, startDate, endDate, interval);
      res.status(200).json({ success: true, data: trend });
    } catch (error) {
      logger.error('获取数据统计趋势失败:', error);
      res.status(500).json({ success: false, message: '获取数据统计趋势失败', error: error.message });
    }
  }
}

module.exports = new StatisticsController();