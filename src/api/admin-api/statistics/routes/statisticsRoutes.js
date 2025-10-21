/**
 * 数据统计路由配置
 * 定义数据统计相关的API端点
 */

const express = require('express');
const router = express.Router();
const statisticsController = require('../controllers/statisticsController');
const authMiddleware = require('../../../core/security/authMiddleware');
const permissionMiddleware = require('../../../core/security/permissionMiddleware');

/**
 * 注册数据统计路由
 * @param {Object} app - Express应用实例
 */
function registerStatisticsRoutes(app) {
  // 所有数据统计路由都需要认证
  router.use(authMiddleware.authenticate);
  
  // 数据统计功能需要管理员或数据分析权限
  router.use(permissionMiddleware.requirePermission(['ADMIN', 'DATA_ANALYST']));
  
  // 系统概览
  router.get('/overview', statisticsController.getSystemOverview);
  
  // 用户统计
  router.get('/users/growth', statisticsController.getUserGrowthStats);
  router.get('/users/activity', statisticsController.getUserActivityStats);
  
  // 内容统计
  router.get('/content', statisticsController.getContentStats);
  
  // 运营统计
  router.get('/operation', statisticsController.getOperationStats);
  
  // 广告统计
  router.get('/advertisement', statisticsController.getAdvertisementStats);
  
  // 公众号统计
  router.get('/wechat', statisticsController.getWechatStats);
  
  // 企业微信统计
  router.get('/work-wechat', statisticsController.getWorkWechatStats);
  
  // 数据趋势
  router.get('/trend', statisticsController.getStatisticsTrend);
  
  // 数据导出
  router.get('/export', statisticsController.exportStatisticsReport);
  
  // 将数据统计路由注册到应用
  app.use('/api/admin/statistics', router);
}

module.exports = {
  register: registerStatisticsRoutes,
  router
};