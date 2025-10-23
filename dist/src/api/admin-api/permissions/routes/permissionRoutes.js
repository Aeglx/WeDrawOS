/**
 * 权限控制路由配置
 * 定义权限管理相关的API端点
 */

const express = require('express');
const router = express.Router();
const permissionController = require('../controllers/permissionController');
const authMiddleware = require('../../../core/security/authMiddleware');
const permissionMiddleware = require('../../../core/security/permissionMiddleware');

/**
 * 注册权限控制路由
 * @param {Object} app - Express应用实例
 */
function registerPermissionRoutes(app) {
  // 所有权限管理路由都需要认证
  router.use(authMiddleware.authenticate);
  
  // 权限管理功能需要管理员权限
  router.use(permissionMiddleware.requireAdmin);
  
  // 角色管理
  router.get('/roles', permissionController.getRoleList);
  router.get('/roles/:id', permissionController.getRoleDetail);
  router.post('/roles', permissionController.createRole);
  router.put('/roles/:id', permissionController.updateRole);
  router.delete('/roles/:id', permissionController.deleteRole);
  
  // 角色权限管理
  router.put('/roles/:id/permissions', permissionController.updateRolePermissions);
  
  // 权限列表
  router.get('/permissions', permissionController.getPermissionList);
  
  // 用户角色管理
  router.get('/users/:userId/roles', permissionController.getUserRoles);
  router.put('/users/:userId/roles', permissionController.updateUserRoles);
  
  // 批量操作
  router.post('/batch/user-roles', permissionController.batchAddUserRoles);
  
  // 权限检查（任何已登录用户都可以检查自己的权限）
  router.get('/check', authMiddleware.authenticate, permissionController.checkPermission);
  
  // 将权限控制路由注册到应用
  app.use('/api/admin/permissions', router);
}

module.exports = {
  register: registerPermissionRoutes,
  router
};