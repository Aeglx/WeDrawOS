/**
 * 商品路由配置
 * 定义商品相关的API端点
 */

const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

/**
 * 注册商品路由
 * @param {Object} app - Express应用实例
 */
function registerProductRoutes(app) {
  // 商品浏览相关路由
  router.get('/', productController.getProducts);
  router.get('/:id', productController.getProductById);
  router.get('/search', productController.searchProducts);
  
  // 分类和品牌相关路由
  router.get('/categories', productController.getCategories);
  router.get('/brands', productController.getBrands);
  
  // 推荐和特色商品路由
  router.get('/hot/list', productController.getHotProducts);
  router.get('/new/list', productController.getNewArrivals);
  router.get('/recommended/list', productController.getRecommendedProducts);
  
  // 商品评价路由
  router.get('/:id/reviews', productController.getProductReviews);
  
  // 将商品路由注册到应用
  app.use('/api/products', router);
}

module.exports = {
  register: registerProductRoutes,
  router
};