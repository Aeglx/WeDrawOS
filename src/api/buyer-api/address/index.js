/**
 * 买家端API - 地址模块入口
 * 整合地址管理相关的控制器、服务、仓库和路由
 */

const di = require('@core/di/container');
const addressRoutes = require('./routes/addressRoutes');
const addressController = require('./controllers/addressController');
const addressService = require('./services/addressService');
const addressRepository = require('./repositories/addressRepository');

/**
 * 初始化地址模块
 * @param {Object} app - Express应用实例
 */
function initializeAddressModule(app) {
  // 注册服务到DI容器
  registerServices();
  
  // 注册路由
  addressRoutes.register(app);
  
  console.log('买家端API地址模块初始化完成');
}

/**
 * 注册地址相关服务到依赖注入容器
 */
function registerServices() {
  // 注册数据仓库
  di.register('addressRepository', () => addressRepository);
  
  // 注册服务
  di.register('addressService', () => addressService);
  
  // 注册控制器
  di.register('addressController', () => addressController);
  
  console.log('地址模块服务注册完成');
}

module.exports = {
  initialize: initializeAddressModule,
  controllers: {
    address: addressController
  },
  services: {
    address: addressService
  },
  repositories: {
    address: addressRepository
  },
  routes: addressRoutes
};