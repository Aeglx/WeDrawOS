/**
 * 用户管理路由配置
 * 定义用户管理相关的API端点
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../../../core/security/authMiddleware');
const permissionMiddleware = require('../../../core/security/permissionMiddleware');

/**
 * 注册用户管理路由
 * @param {Object} app - Express应用实例
 */
function registerUserRoutes(app) {
  // 所有用户管理路由都需要认证
  router.use(authMiddleware.authenticate);
  
  // 用户管理功能需要管理员权限
  router.use(permissionMiddleware.requireAdmin);
  
  // 用户列表和统计
  router.get('/', userController.getUserList);
  router.get('/statistics', userController.getUserStatistics);
  
  // 单个用户操作
  router.get('/:id', userController.getUserDetail);
  router.post('/', userController.createUser);
  router.put('/:id', userController.updateUser);
  router.delete('/:id', userController.deleteUser);
  
  // 批量操作
  router.post('/batch-delete', userController.batchDeleteUsers);
  
  // 用户状态管理
  router.put('/:id/status', userController.updateUserStatus);
  
  // 密码管理
  router.put('/:id/password/reset', userController.resetUserPassword);
  
  // 用户日志
  router.get('/:id/logs', userController.getUserLogs);
  
  // 将用户管理路由注册到应用
  app.use('/api/admin/users', router);
}

module.exports = {
  register: registerUserRoutes,
  router
};