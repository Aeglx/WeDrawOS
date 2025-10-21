/**
 * 地址控制器
 * 处理地址管理相关的HTTP请求
 */

const di = require('@core/di/container');
const addressService = di.resolve('addressService');
const logger = di.resolve('logger');

class AddressController {
  /**
   * 获取用户地址列表
   * @param {Object} req - HTTP请求对象
   * @param {Object} res - HTTP响应对象
   * @param {Function} next - 下一个中间件
   */
  async getUserAddresses(req, res, next) {
    try {
      const userId = req.user.id;
      
      logger.info(`获取用户地址列表 - 用户ID: ${userId}`);
      
      const addresses = await addressService.getUserAddresses(userId);
      
      res.json({
        success: true,
        data: addresses
      });
    } catch (error) {
      logger.error('获取用户地址列表失败', { error: error.message, stack: error.stack });
      next(error);
    }
  }
  
  /**
   * 获取地址详情
   * @param {Object} req - HTTP请求对象
   * @param {Object} res - HTTP响应对象
   * @param {Function} next - 下一个中间件
   */
  async getAddressDetail(req, res, next) {
    try {
      const userId = req.user.id;
      const addressId = req.params.id;
      
      logger.info(`获取地址详情 - 用户ID: ${userId}, 地址ID: ${addressId}`);
      
      const address = await addressService.getAddressDetail(userId, addressId);
      
      res.json({
        success: true,
        data: address
      });
    } catch (error) {
      logger.error('获取地址详情失败', { error: error.message, stack: error.stack });
      next(error);
    }
  }
  
  /**
   * 创建新地址
   * @param {Object} req - HTTP请求对象
   * @param {Object} res - HTTP响应对象
   * @param {Function} next - 下一个中间件
   */
  async createAddress(req, res, next) {
    try {
      const userId = req.user.id;
      const addressData = req.body;
      
      logger.info(`创建新地址 - 用户ID: ${userId}`, { addressData });
      
      const address = await addressService.createAddress(userId, addressData);
      
      res.status(201).json({
        success: true,
        message: '地址创建成功',
        data: address
      });
    } catch (error) {
      logger.error('创建地址失败', { error: error.message, stack: error.stack });
      next(error);
    }
  }
  
  /**
   * 更新地址
   * @param {Object} req - HTTP请求对象
   * @param {Object} res - HTTP响应对象
   * @param {Function} next - 下一个中间件
   */
  async updateAddress(req, res, next) {
    try {
      const userId = req.user.id;
      const addressId = req.params.id;
      const addressData = req.body;
      
      logger.info(`更新地址 - 用户ID: ${userId}, 地址ID: ${addressId}`, { addressData });
      
      const address = await addressService.updateAddress(userId, addressId, addressData);
      
      res.json({
        success: true,
        message: '地址更新成功',
        data: address
      });
    } catch (error) {
      logger.error('更新地址失败', { error: error.message, stack: error.stack });
      next(error);
    }
  }
  
  /**
   * 删除地址
   * @param {Object} req - HTTP请求对象
   * @param {Object} res - HTTP响应对象
   * @param {Function} next - 下一个中间件
   */
  async deleteAddress(req, res, next) {
    try {
      const userId = req.user.id;
      const addressId = req.params.id;
      
      logger.info(`删除地址 - 用户ID: ${userId}, 地址ID: ${addressId}`);
      
      await addressService.deleteAddress(userId, addressId);
      
      res.json({
        success: true,
        message: '地址删除成功'
      });
    } catch (error) {
      logger.error('删除地址失败', { error: error.message, stack: error.stack });
      next(error);
    }
  }
  
  /**
   * 设置默认地址
   * @param {Object} req - HTTP请求对象
   * @param {Object} res - HTTP响应对象
   * @param {Function} next - 下一个中间件
   */
  async setDefaultAddress(req, res, next) {
    try {
      const userId = req.user.id;
      const addressId = req.params.id;
      
      logger.info(`设置默认地址 - 用户ID: ${userId}, 地址ID: ${addressId}`);
      
      const address = await addressService.setDefaultAddress(userId, addressId);
      
      res.json({
        success: true,
        message: '默认地址设置成功',
        data: address
      });
    } catch (error) {
      logger.error('设置默认地址失败', { error: error.message, stack: error.stack });
      next(error);
    }
  }
  
  /**
   * 获取默认地址
   * @param {Object} req - HTTP请求对象
   * @param {Object} res - HTTP响应对象
   * @param {Function} next - 下一个中间件
   */
  async getDefaultAddress(req, res, next) {
    try {
      const userId = req.user.id;
      
      logger.info(`获取默认地址 - 用户ID: ${userId}`);
      
      const address = await addressService.getDefaultAddress(userId);
      
      res.json({
        success: true,
        data: address
      });
    } catch (error) {
      logger.error('获取默认地址失败', { error: error.message, stack: error.stack });
      next(error);
    }
  }
}

module.exports = new AddressController();