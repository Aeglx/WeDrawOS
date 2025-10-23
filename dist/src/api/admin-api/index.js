/**
 * 管理端API模块
 * 提供管理后台相关的API接口
 */

const logger = require('../core/utils/logger');
const di = require('../core/di/container');

/**
 * 注册管理端API模块
 * @param {Object} app - Express应用实例
 */
function register(app) {
  logger.info('注册管理端API模块');
  
  // 注册路由
  const router = require('express').Router();
  
  // 导入管理端业务模块路由
  const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const sellerRoutes = require('./routes/sellerRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const statisticsRoutes = require('./routes/statisticsRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const legacySystemRoutes = require('./routes/systemRoutes');
const systemModule = require('./system');
const userModule = require('./users');
const permissionModule = require('./permissions');
const statisticsModule = require('./statistics');
const operationModule = require('./operations');
const monitoringModule = require('./monitoring');
const logModule = require('./logs');
const wechatModule = require('./backend');
  
  // 注册各业务模块路由
  router.use('/admins', adminRoutes);
  router.use('/users', userRoutes);
  router.use('/sellers', sellerRoutes);
  router.use('/products', productRoutes);
  router.use('/orders', orderRoutes);
  router.use('/statistics', statisticsRoutes);
  router.use('/categories', categoryRoutes);
  
  // 初始化新版模块
  systemModule.initialize(app);
  userModule.initialize(app);
  permissionModule.initialize(app);
  statisticsModule.initialize(app);
  operationModule.initialize(app);
  monitoringModule.initialize(app);
  logModule.initialize(app);
  wechatModule.initialize(app);
  
  // 保留旧版系统路由作为兼容（后续可移除）
  router.use('/system', legacySystemRoutes);
  
  // 注册到应用
  app.use('/api/admin', router);
  
  logger.info('管理端API模块注册完成');
}

module.exports = {
  register
};