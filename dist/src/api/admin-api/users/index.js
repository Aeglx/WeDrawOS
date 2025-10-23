/**
 * 管理端API - 用户管理模块入口
 * 整合用户管理相关的控制器、服务、仓库和路由
 */

const di = require('../../../core/di/container');
const userRoutes = require('./routes/userRoutes');
const userController = require('./controllers/userController');
const userService = require('./services/userService');
const userRepository = require('./repositories/userRepository');

/**
 * 初始化用户管理模块
 * @param {Object} app - Express应用实例
 */
function initializeUserModule(app) {
  // 注册服务到DI容器
  registerServices();
  
  // 注册路由
  userRoutes.register(app);
  
  console.log('管理端API用户管理模块初始化完成');
}

/**
 * 注册用户管理相关服务到依赖注入容器
 */
function registerServices() {
  // 注册数据仓库
  di.register('userRepository', () => userRepository);
  
  // 注册服务
  di.register('userService', () => userService);
  
  // 注册控制器
  di.register('userController', () => userController);
  
  console.log('用户管理模块服务注册完成');
}

module.exports = {
  initialize: initializeUserModule,
  controllers: {
    user: userController
  },
  services: {
    user: userService
  },
  repositories: {
    user: userRepository
  },
  routes: userRoutes
};