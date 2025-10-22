/**
 * 卖家端店铺管理模块入口
 */

const sellerController = require('./controllers/sellerController');
const sellerService = require('./services/sellerService');
const sellerRepository = require('./repositories/sellerRepository');
const sellerRoutes = require('./routes/sellerRoutes');

/**
 * 注册店铺管理模块
 * @param {Object} app - Express应用实例
 */
function register(app) {
  // 注册店铺管理相关路由
  app.use('/api/seller', sellerRoutes);
}

module.exports = {
  register,
  controllers: {
    sellerController
  },
  services: {
    sellerService
  },
  repositories: {
    sellerRepository
  },
  routes: {
    sellerRoutes
  }
};