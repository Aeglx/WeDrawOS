/**
 * 卖家端API模块
 * 提供卖家端相关的API接口
 */

const logger = require('../core/utils/logger');
const di = require('../core/di/container');

/**
 * 注册卖家端API模块
 * @param {Object} app - Express应用实例
 */
function register(app) {
  logger.info('注册卖家端API模块');
  
  // 注册路由
  const router = require('express').Router();
  
  // 导入卖家端业务模块路由
  const sellerRoutes = require('./routes/sellerRoutes');
  const productRoutes = require('./routes/productRoutes');
  const orderRoutes = require('./routes/orderRoutes');
  const inventoryRoutes = require('./routes/inventoryRoutes');
  const statisticsRoutes = require('./routes/statisticsRoutes');
  const refundRoutes = require('./routes/refundRoutes');
  const promotionRoutes = require('./routes/promotionRoutes');
  
  // 注册各业务模块路由
  router.use('/sellers', sellerRoutes);
  router.use('/products', productRoutes);
  router.use('/orders', orderRoutes);
  router.use('/inventory', inventoryRoutes);
  router.use('/statistics', statisticsRoutes);
  router.use('/refunds', refundRoutes);
  router.use('/promotions', promotionRoutes);
  
  // 注册到应用
  app.use('/api/seller', router);
  
  logger.info('卖家端API模块注册完成');
}

module.exports = {
  register
};