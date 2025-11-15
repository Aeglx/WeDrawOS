/**
 * 卖家端API模块
 * 提供卖家端相关的API接口
 */

const logger = require('../core/utils/logger');

/**
 * 注册卖家端API模块
 * @param {Object} app - Express应用实例
 */
function register(app) {
  logger.info('注册卖家端API模块');
  const sellerRoutes = require('./routes/sellerRoutes');
  app.use('/api/seller', sellerRoutes);
  logger.info('卖家端API模块注册完成');
}

module.exports = {
  register
};