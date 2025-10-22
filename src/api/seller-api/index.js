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
  const sellerModule = require('./seller');
  const productModule = require('./product');
  const orderRoutes = require('./routes/orderRoutes');
  const inventoryRoutes = require('./routes/inventoryRoutes');
  const statisticsRoutes = require('./routes/statisticsRoutes');
  const refundRoutes = require('./routes/refundRoutes');
  const promotionRoutes = require('./routes/promotionRoutes');
  
  // 注册卖家端各个业务模块
  sellerModule.register(app);
  productModule.register(app);
  app.use('/api/seller/orders', orderRoutes);
  app.use('/api/seller/inventory', inventoryRoutes);
  app.use('/api/seller/statistics', statisticsRoutes);
  app.use('/api/seller/refunds', refundRoutes);
  app.use('/api/seller/promotions', promotionRoutes);
  
  logger.info('卖家端API模块注册完成');
}

module.exports = {
  register
};