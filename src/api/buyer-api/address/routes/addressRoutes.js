/**
 * 地址路由配置
 * 定义地址管理相关的API端点
 */

const express = require('express');
const router = express.Router();
const addressController = require('../controllers/addressController');
const authMiddleware = require('@core/security/authMiddleware');

/**
 * 注册地址路由
 * @param {Object} app - Express应用实例
 */
function registerAddressRoutes(app) {
  // 所有地址路由都需要认证
  router.use(authMiddleware.authenticate);
  
  // 地址管理相关路由
  router.get('/', addressController.getUserAddresses);
  router.get('/default', addressController.getDefaultAddress);
  router.get('/:id', addressController.getAddressDetail);
  router.post('/', addressController.createAddress);
  router.put('/:id', addressController.updateAddress);
  router.delete('/:id', addressController.deleteAddress);
  router.put('/:id/default', addressController.setDefaultAddress);
  
  // 将地址路由注册到应用
  app.use('/api/addresses', router);
}

module.exports = {
  register: registerAddressRoutes,
  router
};