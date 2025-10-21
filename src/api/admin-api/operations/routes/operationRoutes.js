/**
 * 运营管理路由配置
 * 定义运营管理相关的API端点
 */

const express = require('express');
const router = express.Router();
const operationController = require('../controllers/operationController');
const authMiddleware = require('../../../core/security/authMiddleware');
const permissionMiddleware = require('../../../core/security/permissionMiddleware');

/**
 * 注册运营管理路由
 * @param {Object} app - Express应用实例
 */
function registerOperationRoutes(app) {
  // 所有运营管理路由都需要认证
  router.use(authMiddleware.authenticate);
  
  // 运营管理功能需要管理员或运营权限
  router.use(permissionMiddleware.requirePermission(['ADMIN', 'OPERATION_MANAGER']));
  
  // 运营活动管理
  router.get('/', operationController.getOperationList);
  router.get('/:id', operationController.getOperationDetail);
  router.post('/', operationController.createOperation);
  router.put('/:id', operationController.updateOperation);
  router.delete('/:id', operationController.deleteOperation);
  router.post('/batch-delete', operationController.batchDeleteOperations);
  router.patch('/:id/status', operationController.updateOperationStatus);
  router.post('/:id/duplicate', operationController.duplicateOperation);
  
  // 模板管理
  router.get('/templates/list', operationController.getOperationTemplates);
  
  // 数据统计
  router.get('/overview/stats', operationController.getOperationOverview);
  
  // 数据导出
  router.get('/export', operationController.exportOperations);
  
  // 将运营管理路由注册到应用
  app.use('/api/admin/operations', router);
}

module.exports = {
  register: registerOperationRoutes,
  router
};