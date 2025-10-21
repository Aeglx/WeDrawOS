/**
 * 购物车路由配置
 * 定义购物车相关的API端点
 */

const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const authMiddleware = require('@core/security/authMiddleware');

/**
 * 注册购物车路由
 * @param {Object} app - Express应用实例
 */
function registerCartRoutes(app) {
  // 所有购物车路由都需要认证
  router.use(authMiddleware.authenticate);
  
  // 购物车基本操作
  router.get('/', cartController.getCart);
  router.post('/', cartController.addToCart);
  router.put('/:id', cartController.updateCartItem);
  router.delete('/:id', cartController.removeFromCart);
  router.delete('/', cartController.clearCart);
  
  // 批量操作
  router.post('/batch', cartController.batchAddToCart);
  
  // 其他购物车相关操作
  router.get('/count', cartController.getCartCount);
  router.post('/check-inventory', cartController.checkCartInventory);
  router.post('/:id/move-to-wishlist', cartController.moveToWishlist);
  
  // 将购物车路由注册到应用
  app.use('/api/cart', router);
}

module.exports = {
  register: registerCartRoutes,
  router
};