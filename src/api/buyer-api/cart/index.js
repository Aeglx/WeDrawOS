/**
 * 买家端API - 购物车模块入口
 * 整合购物车相关的控制器、服务、仓库和路由
 */

const di = require('../../core/di/container');
const cartRoutes = require('./routes/cartRoutes');
const cartController = require('./controllers/cartController');
const cartService = require('./services/cartService');
const cartRepository = require('./repositories/cartRepository');

/**
 * 初始化购物车模块
 * @param {Object} app - Express应用实例
 */
function initializeCartModule(app) {
  // 注册服务到DI容器
  registerServices();
  
  // 注册路由
  cartRoutes.register(app);
  
  console.log('买家端API购物车模块初始化完成');
}

/**
 * 注册购物车相关服务到依赖注入容器
 */
function registerServices() {
  // 注册数据仓库
  di.register('cartRepository', () => cartRepository);
  
  // 注册服务
  di.register('cartService', () => cartService);
  
  // 注册控制器
  di.register('cartController', () => cartController);
  
  console.log('购物车模块服务注册完成');
}

module.exports = {
  initialize: initializeCartModule,
  controllers: {
    cart: cartController
  },
  services: {
    cart: cartService
  },
  repositories: {
    cart: cartRepository
  },
  routes: cartRoutes
};