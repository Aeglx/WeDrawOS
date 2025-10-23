/**
 * 卖家端促销管理模块
 * 导出促销相关组件并提供注册函数
 */

const promotionController = require('./controllers/promotionController');
const promotionService = require('./services/promotionService');
const promotionRepository = require('./repositories/promotionRepository');
const promotionRoutes = require('./routes/promotionRoutes');

/**
 * 促销模块
 * @type {Object}
 */
const promotionModule = {
  // 导出控制器
  controllers: {
    promotionController
  },
  
  // 导出服务
  services: {
    promotionService
  },
  
  // 导出仓库
  repositories: {
    promotionRepository
  },
  
  // 导出路由
  routes: promotionRoutes,
  
  /**
   * 注册促销模块到应用
   * @param {Object} app - Express应用实例
   */
  register(app) {
    // 注册促销路由
    app.use('/api/seller/promotions', promotionRoutes);
  }
};

module.exports = promotionModule;