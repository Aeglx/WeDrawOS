const express = require('express');
const { inject } = require('../../../core/di');
const authMiddleware = require('../../../middleware/authMiddleware');
const permissionMiddleware = require('../../../middleware/permissionMiddleware');
const logger = require('../../../core/logger');

class LogRoutes {
  constructor() {
    this.logger = logger.getLogger('LogRoutes');
    this.router = express.Router();
  }

  /**
   * 注册日志相关路由
   * @param {express.Application} app - Express应用实例
   */
  register(app) {
    try {
      // 注入控制器
      inject(this, 'logController');
      
      // 所有路由都需要认证
      const auth = [authMiddleware.authenticate()];
      
      // 日志查询权限（普通管理员和系统管理员都可以查看）
      const logViewPermission = permissionMiddleware.requirePermission(['ADMIN', 'SYSTEM_ADMIN', 'DATA_ANALYST']);
      
      // 日志管理权限（仅系统管理员可以操作）
      const logManagePermission = permissionMiddleware.requirePermission(['SYSTEM_ADMIN']);

      // 系统日志管理
      this.router.get('/system', [...auth, logViewPermission], this.logController.getLogs.bind(this.logController));
      this.router.get('/system/:id', [...auth, logViewPermission], this.logController.getLogDetail.bind(this.logController));
      this.router.get('/stats', [...auth, logViewPermission], this.logController.getLogStats.bind(this.logController));
      this.router.get('/modules', [...auth, logViewPermission], this.logController.getLogModules.bind(this.logController));
      this.router.get('/export', [...auth, logViewPermission], this.logController.exportLogs.bind(this.logController));
      this.router.post('/clean', [...auth, logManagePermission], this.logController.cleanLogs.bind(this.logController));
      
      // 用户操作日志
      this.router.get('/user-operations', [...auth, logViewPermission], this.logController.getUserOperationLogs.bind(this.logController));
      
      // 登录日志
      this.router.get('/login', [...auth, logViewPermission], this.logController.getLoginLogs.bind(this.logController));

      // 注册路由到应用
      app.use('/api/admin/logs', this.router);
      
      this.logger.info('日志相关路由注册成功');
    } catch (error) {
      this.logger.error('日志路由注册失败:', error);
      throw error;
    }
  }
}

module.exports = new LogRoutes();