const express = require('express');
const { inject } = require('../../../core/di');
const authMiddleware = require('../../../middleware/authMiddleware');
const permissionMiddleware = require('../../../middleware/permissionMiddleware');
const logger = require('../../../core/logger');

class MonitoringRoutes {
  constructor() {
    this.logger = logger.getLogger('MonitoringRoutes');
    this.router = express.Router();
  }

  /**
   * 注册监控相关路由
   * @param {express.Application} app - Express应用实例
   */
  register(app) {
    try {
      // 注入控制器
      inject(this, 'monitoringController');
      
      // 所有路由都需要认证和权限验证
      const auth = [
        authMiddleware.authenticate(),
        permissionMiddleware.requirePermission(['ADMIN', 'DATA_ANALYST', 'SYSTEM_ADMIN'])
      ];

      // 监控概览和资源使用情况
      this.router.get('/overview', auth, this.monitoringController.getSystemOverview.bind(this.monitoringController));
      this.router.get('/resources', auth, this.monitoringController.getResourceUsage.bind(this.monitoringController));
      
      // API调用统计
      this.router.get('/api-stats', auth, this.monitoringController.getApiStats.bind(this.monitoringController));
      
      // 告警管理
      this.router.get('/alerts', auth, this.monitoringController.getAlerts.bind(this.monitoringController));
      this.router.get('/alerts/:id', auth, this.monitoringController.getAlertDetail.bind(this.monitoringController));
      this.router.put('/alerts/:id/handle', auth, this.monitoringController.handleAlert.bind(this.monitoringController));
      
      // 告警配置
      this.router.get('/alert-configs', auth, this.monitoringController.getAlertConfigs.bind(this.monitoringController));
      this.router.put('/alert-configs/:id', auth, this.monitoringController.updateAlertConfig.bind(this.monitoringController));
      
      // 数据库监控
      this.router.get('/database', auth, this.monitoringController.getDatabaseMetrics.bind(this.monitoringController));
      
      // 错误率监控
      this.router.get('/error-rate', auth, this.monitoringController.getErrorRateTrend.bind(this.monitoringController));

      // 注册路由到应用
      app.use('/api/admin/monitoring', this.router);
      
      this.logger.info('监控相关路由注册成功');
    } catch (error) {
      this.logger.error('监控路由注册失败:', error);
      throw error;
    }
  }
}

module.exports = new MonitoringRoutes();