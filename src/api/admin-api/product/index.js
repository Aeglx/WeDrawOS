/**
 * 产品管理模块
 * 提供产品相关的API接口
 */

const logger = require('../../core/utils/logger');
const productRoutes = require('./routes/productRoutes');

/**
 * 初始化产品模块
 * @param {Object} app - Express应用实例
 */
function initializeProductModule(app) {
  try {
    logger.info('初始化产品管理模块');
    
    // 注册产品管理路由
    app.use('/api/admin/products', productRoutes);
    
    logger.info('产品管理模块初始化完成');
  } catch (error) {
    logger.error('初始化产品管理模块失败:', error);
    throw error;
  }
}

module.exports = {
  initialize: initializeProductModule
};