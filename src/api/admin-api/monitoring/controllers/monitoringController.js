const { Controller } = require('../../../core');
const { inject } = require('../../../core/di');
const logger = require('../../../core/logger');

class MonitoringController extends Controller {
  constructor() {
    super();
    inject(this, 'monitoringService');
    this.logger = logger.getLogger('MonitoringController');
  }

  /**
   * 获取系统监控概览
   * @param {Request} req - Express请求对象
   * @param {Response} res - Express响应对象
   */
  async getSystemOverview(req, res) {
    try {
      const overview = await this.monitoringService.getSystemOverview();
      this.success(res, overview);
    } catch (error) {
      this.logger.error('获取系统监控概览失败:', error);
      this.error(res, error.message, 500);
    }
  }

  /**
   * 获取系统资源使用情况
   * @param {Request} req - Express请求对象
   * @param {Response} res - Express响应对象
   */
  async getResourceUsage(req, res) {
    try {
      const { timeRange = '24h' } = req.query;
      const usage = await this.monitoringService.getResourceUsage(timeRange);
      this.success(res, usage);
    } catch (error) {
      this.logger.error('获取系统资源使用情况失败:', error);
      this.error(res, error.message, 500);
    }
  }

  /**
   * 获取API调用统计
   * @param {Request} req - Express请求对象
   * @param {Response} res - Express响应对象
   */
  async getApiStats(req, res) {
    try {
      const { timeRange = '24h' } = req.query;
      const stats = await this.monitoringService.getApiStats(timeRange);
      this.success(res, stats);
    } catch (error) {
      this.logger.error('获取API调用统计失败:', error);
      this.error(res, error.message, 500);
    }
  }

  /**
   * 获取告警列表
   * @param {Request} req - Express请求对象
   * @param {Response} res - Express响应对象
   */
  async getAlerts(req, res) {
    try {
      const { status = 'all', page = 1, pageSize = 20 } = req.query;
      const alerts = await this.monitoringService.getAlerts({ status, page, pageSize });
      this.success(res, alerts);
    } catch (error) {
      this.logger.error('获取告警列表失败:', error);
      this.error(res, error.message, 500);
    }
  }

  /**
   * 获取告警详情
   * @param {Request} req - Express请求对象
   * @param {Response} res - Express响应对象
   */
  async getAlertDetail(req, res) {
    try {
      const { id } = req.params;
      const alert = await this.monitoringService.getAlertDetail(id);
      this.success(res, alert);
    } catch (error) {
      this.logger.error(`获取告警详情失败 [ID: ${req.params.id}]:`, error);
      this.error(res, error.message, 500);
    }
  }

  /**
   * 处理告警
   * @param {Request} req - Express请求对象
   * @param {Response} res - Express响应对象
   */
  async handleAlert(req, res) {
    try {
      const { id } = req.params;
      const { status, remark } = req.body;
      await this.monitoringService.handleAlert(id, { status, remark, handler: req.user?.userId });
      this.success(res, { message: '告警处理成功' });
    } catch (error) {
      this.logger.error(`处理告警失败 [ID: ${req.params.id}]:`, error);
      this.error(res, error.message, 500);
    }
  }

  /**
   * 获取告警配置列表
   * @param {Request} req - Express请求对象
   * @param {Response} res - Express响应对象
   */
  async getAlertConfigs(req, res) {
    try {
      const configs = await this.monitoringService.getAlertConfigs();
      this.success(res, configs);
    } catch (error) {
      this.logger.error('获取告警配置列表失败:', error);
      this.error(res, error.message, 500);
    }
  }

  /**
   * 更新告警配置
   * @param {Request} req - Express请求对象
   * @param {Response} res - Express响应对象
   */
  async updateAlertConfig(req, res) {
    try {
      const { id } = req.params;
      const configData = req.body;
      await this.monitoringService.updateAlertConfig(id, configData);
      this.success(res, { message: '告警配置更新成功' });
    } catch (error) {
      this.logger.error(`更新告警配置失败 [ID: ${req.params.id}]:`, error);
      this.error(res, error.message, 500);
    }
  }

  /**
   * 获取数据库性能监控
   * @param {Request} req - Express请求对象
   * @param {Response} res - Express响应对象
   */
  async getDatabaseMetrics(req, res) {
    try {
      const { timeRange = '24h' } = req.query;
      const metrics = await this.monitoringService.getDatabaseMetrics(timeRange);
      this.success(res, metrics);
    } catch (error) {
      this.logger.error('获取数据库性能监控失败:', error);
      this.error(res, error.message, 500);
    }
  }

  /**
   * 获取错误率趋势
   * @param {Request} req - Express请求对象
   * @param {Response} res - Express响应对象
   */
  async getErrorRateTrend(req, res) {
    try {
      const { timeRange = '24h' } = req.query;
      const trend = await this.monitoringService.getErrorRateTrend(timeRange);
      this.success(res, trend);
    } catch (error) {
      this.logger.error('获取错误率趋势失败:', error);
      this.error(res, error.message, 500);
    }
  }
}

module.exports = MonitoringController;