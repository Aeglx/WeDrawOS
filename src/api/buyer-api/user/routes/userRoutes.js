/**
 * 用户路由配置
 * 定义用户相关的API端点
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../../../core/security/authMiddleware');

/**
 * 注册用户路由
 * @param {Object} app - Express应用实例
 */
function registerUserRoutes(app) {
  // 公开路由（不需要认证）
  router.post('/register', userController.register);
  router.post('/login', userController.login);
  router.post('/refresh-token', userController.refreshToken);
  router.post('/forgot-password', userController.forgotPassword);
  router.post('/reset-password', userController.resetPassword);
  
  // 需要认证的路由
  const protectedRoutes = express.Router();
  protectedRoutes.use(authMiddleware.authenticate);
  
  // 用户信息相关
  protectedRoutes.get('/profile', userController.getUserInfo);
  protectedRoutes.put('/profile', userController.updateUserInfo);
  protectedRoutes.post('/change-password', userController.changePassword);
  protectedRoutes.post('/logout', userController.logout);
  
  // 将保护的路由挂载到主路由
  router.use('/', protectedRoutes);
  
  // 将用户路由注册到应用
  app.use('/api/user', router);
}

module.exports = {
  register: registerUserRoutes,
  router
};