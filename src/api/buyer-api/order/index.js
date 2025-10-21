/**
 * 买家端API - 订单模块入口
 * 整合订单相关的控制器、服务、仓库和路由
 */

const di = require('@core/di/container');
const orderRoutes = require('./routes/orderRoutes');
const orderController = require('./controllers/orderController');
const orderService = require('./services/orderService');
const orderRepository = require('./repositories/orderRepository');

/**
 * 初始化订单模块
 * @param {Object} app - Express应用实例
 */
function initializeOrderModule(app) {
  // 注册服务到DI容器
  registerServices();
  
  // 注册路由
  orderRoutes.register(app);
  
  console.log('买家端API订单模块初始化完成');
}

/**
 * 注册订单相关服务到依赖注入容器
 */
function registerServices() {
  // 注册数据仓库
  di.register('orderRepository', () => orderRepository);
  
  // 注册服务
  di.register('orderService', () => orderService);
  
  // 注册控制器
  di.register('orderController', () => orderController);
  
  console.log('订单模块服务注册完成');
}

module.exports = {
  initialize: initializeOrderModule,
  controllers: {
    order: orderController
  },
  services: {
    order: orderService
  },
  repositories: {
    order: orderRepository
  },
  routes: orderRoutes
};