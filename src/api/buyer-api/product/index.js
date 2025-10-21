/**
 * 买家端API - 商品模块入口
 * 整合商品相关的控制器、服务、仓库和路由
 */

const di = require('@core/di/container');
const productRoutes = require('./routes/productRoutes');
const productController = require('./controllers/productController');
const productService = require('./services/productService');
const productRepository = require('./repositories/productRepository');

/**
 * 初始化商品模块
 * @param {Object} app - Express应用实例
 */
function initializeProductModule(app) {
  // 注册服务到DI容器
  registerServices();
  
  // 注册路由
  productRoutes.register(app);
  
  console.log('买家端API商品模块初始化完成');
}

/**
 * 注册商品相关服务到依赖注入容器
 */
function registerServices() {
  // 注册数据仓库
  di.register('productRepository', () => productRepository);
  
  // 注册服务
  di.register('productService', () => productService);
  
  // 注册控制器
  di.register('productController', () => productController);
  
  console.log('商品模块服务注册完成');
}

module.exports = {
  initialize: initializeProductModule,
  controllers: {
    product: productController
  },
  services: {
    product: productService
  },
  repositories: {
    product: productRepository
  },
  routes: productRoutes
};