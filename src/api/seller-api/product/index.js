/**
 * 卖家端商品模块入口
 */

const productController = require('./controllers/productController');
const productService = require('./services/productService');
const productRepository = require('./repositories/productRepository');
const productRoutes = require('./routes/productRoutes');

/**
 * 注册商品模块
 * @param {Object} app - Express应用实例
 */
function register(app) {
  // 注册商品相关路由
  app.use('/api/seller/products', productRoutes);
}

module.exports = {
  register,
  controllers: {
    productController
  },
  services: {
    productService
  },
  repositories: {
    productRepository
  },
  routes: {
    productRoutes
  }
};