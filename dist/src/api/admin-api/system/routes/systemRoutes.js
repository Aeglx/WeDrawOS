/**
 * 系统设置路由配置
 * 定义系统管理相关的API端点
 */

const express = require('express');
const router = express.Router();
const systemController = require('../controllers/systemController');
const authMiddleware = require('../../../core/security/authMiddleware');
const permissionMiddleware = require('../../../core/security/permissionMiddleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

/**
 * 注册系统设置路由
 * @param {Object} app - Express应用实例
 */
function registerSystemRoutes(app) {
  // 所有系统设置路由都需要认证
  router.use(authMiddleware.authenticate);
  
  // 需要管理员权限
  router.use(permissionMiddleware.requireAdmin);
  
  // 系统配置管理
  router.get('/config', systemController.getSystemConfig);
  router.put('/config', systemController.updateSystemConfig);
  
  // 系统日志管理
  router.get('/logs', systemController.getSystemLogs);
  
  // 系统信息
  router.get('/info', systemController.getSystemInfo);
  
  // 系统维护操作
  router.post('/cache/clear', systemController.clearSystemCache);
  router.post('/backup', systemController.backupSystemData);
  
  // 文件上传
  router.post('/logo/upload', upload.single('logo'), systemController.uploadSystemLogo);
  
  // 将系统设置路由注册到应用
  app.use('/api/admin/system', router);
}

module.exports = {
  register: registerSystemRoutes,
  router
};