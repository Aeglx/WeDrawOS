/**
 * 买家端API模块
 * 提供买家端相关的API接口
 */

const logger = require('../core/utils/logger');
const di = require('../core/di/container');

// 导入业务模块
const userModule = require('./user');
const productModule = require('./product');
const cartModule = require('./cart');
const orderModule = require('./order');
const addressModule = require('./address');

/**
 * 注册买家端API模块
 * @param {Object} app - Express应用实例
 */
function register(app) {
  logger.info('注册买家端API模块');
  
  // 注册业务模块
  userModule.initialize(app);
  productModule.initialize(app);
  cartModule.initialize(app);
  orderModule.initialize(app);
  addressModule.initialize(app);
  
  // TODO: 注册其他业务模块
  
  logger.info('买家端API模块注册完成');
}

module.exports = {
  register
};