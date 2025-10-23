/**
 * 管理端API - 系统设置模块入口
 * 整合系统设置相关的控制器、服务、仓库和路由
 */

const di = require('../../../core/di/container');
const systemRoutes = require('./routes/systemRoutes');
const systemController = require('./controllers/systemController');
const systemService = require('./services/systemService');
const systemRepository = require('./repositories/systemRepository');

/**
 * 初始化系统设置模块
 * @param {Object} app - Express应用实例
 */
function initializeSystemModule(app) {
  // 注册服务到DI容器
  registerServices();
  
  // 注册路由
  systemRoutes.register(app);
  
  console.log('管理端API系统设置模块初始化完成');
}

/**
 * 注册系统设置相关服务到依赖注入容器
 */
function registerServices() {
  // 注册数据仓库
  di.register('systemRepository', () => systemRepository);
  
  // 注册服务
  di.register('systemService', () => systemService);
  
  // 注册控制器
  di.register('systemController', () => systemController);
  
  console.log('系统设置模块服务注册完成');
}

module.exports = {
  initialize: initializeSystemModule,
  controllers: {
    system: systemController
  },
  services: {
    system: systemService
  },
  repositories: {
    system: systemRepository
  },
  routes: systemRoutes
};