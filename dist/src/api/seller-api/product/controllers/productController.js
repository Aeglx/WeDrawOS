/**
 * 卖家端商品管理控制器
 */

const logger = require('@core/utils/logger');
const productService = require('../services/productService');
const messageQueue = require('@core/message/messageQueue');
const messageTopics = require('@core/message/messageTopics');

class ProductController {
  /**
   * 创建商品
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @returns {Promise<void>}
   */
  async createProduct(req, res) {
    try {
      const sellerId = req.user.id;
      const productData = { ...req.body, sellerId };
      
      const product = await productService.createProduct(productData);
      
      // 发送商品创建消息
      await messageQueue.publish(messageTopics.PRODUCT.CREATED, {
        sellerId,
        productId: product.id,
        name: product.name,
        createdAt: new Date()
      });
      
      logger.info(`卖家 ${sellerId} 创建商品成功: ${product.id}`);
      
      res.status(201).json({
        code: 0,
        message: '商品创建成功',
        data: product
      });
    } catch (error) {
      logger.error('创建商品失败:', error);
      res.status(error.statusCode || 500).json({
        code: error.code || 500,
        message: error.message || '创建商品失败'
      });
    }
  }
  
  /**
   * 获取商品列表
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @returns {Promise<void>}
   */
  async getProducts(req, res) {
    try {
      const sellerId = req.user.id;
      const { page = 1, pageSize = 10, status, keyword } = req.query;
      
      const result = await productService.getSellerProducts(sellerId, {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        status,
        keyword
      });
      
      res.json({
        code: 0,
        message: '获取商品列表成功',
        data: result
      });
    } catch (error) {
      logger.error('获取商品列表失败:', error);
      res.status(error.statusCode || 500).json({
        code: error.code || 500,
        message: error.message || '获取商品列表失败'
      });
    }
  }
  
  /**
   * 获取商品详情
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @returns {Promise<void>}
   */
  async getProductDetail(req, res) {
    try {
      const sellerId = req.user.id;
      const productId = req.params.id;
      
      const product = await productService.getProductDetail(productId, sellerId);
      
      res.json({
        code: 0,
        message: '获取商品详情成功',
        data: product
      });
    } catch (error) {
      logger.error('获取商品详情失败:', error);
      res.status(error.statusCode || 500).json({
        code: error.code || 500,
        message: error.message || '获取商品详情失败'
      });
    }
  }
  
  /**
   * 更新商品信息
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @returns {Promise<void>}
   */
  async updateProduct(req, res) {
    try {
      const sellerId = req.user.id;
      const productId = req.params.id;
      const updateData = req.body;
      
      const product = await productService.updateProduct(productId, sellerId, updateData);
      
      // 发送商品更新消息
      await messageQueue.publish(messageTopics.PRODUCT.UPDATED, {
        sellerId,
        productId,
        updatedAt: new Date()
      });
      
      logger.info(`卖家 ${sellerId} 更新商品成功: ${productId}`);
      
      res.json({
        code: 0,
        message: '商品更新成功',
        data: product
      });
    } catch (error) {
      logger.error('更新商品失败:', error);
      res.status(error.statusCode || 500).json({
        code: error.code || 500,
        message: error.message || '更新商品失败'
      });
    }
  }
  
  /**
   * 上下架商品
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @returns {Promise<void>}
   */
  async changeStatus(req, res) {
    try {
      const sellerId = req.user.id;
      const productId = req.params.id;
      const { status } = req.body;
      
      const product = await productService.changeProductStatus(productId, sellerId, status);
      
      // 发送商品状态变更消息
      await messageQueue.publish(messageTopics.PRODUCT.STATUS_CHANGED, {
        sellerId,
        productId,
        status,
        changedAt: new Date()
      });
      
      const statusText = status === 'active' ? '上架' : status === 'inactive' ? '下架' : '草稿';
      logger.info(`卖家 ${sellerId} ${statusText}商品成功: ${productId}`);
      
      res.json({
        code: 0,
        message: `商品${statusText}成功`,
        data: product
      });
    } catch (error) {
      logger.error('变更商品状态失败:', error);
      res.status(error.statusCode || 500).json({
        code: error.code || 500,
        message: error.message || '变更商品状态失败'
      });
    }
  }
  
  /**
   * 批量上下架商品
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @returns {Promise<void>}
   */
  async batchChangeStatus(req, res) {
    try {
      const sellerId = req.user.id;
      const { productIds, status } = req.body;
      
      const result = await productService.batchChangeStatus(productIds, sellerId, status);
      
      // 发送批量状态变更消息
      await messageQueue.publish(messageTopics.PRODUCT.BATCH_STATUS_CHANGED, {
        sellerId,
        productIds,
        status,
        changedAt: new Date()
      });
      
      const statusText = status === 'active' ? '上架' : status === 'inactive' ? '下架' : '草稿';
      logger.info(`卖家 ${sellerId} 批量${statusText}商品成功: ${productIds.length}个`);
      
      res.json({
        code: 0,
        message: `商品批量${statusText}成功`,
        data: result
      });
    } catch (error) {
      logger.error('批量变更商品状态失败:', error);
      res.status(error.statusCode || 500).json({
        code: error.code || 500,
        message: error.message || '批量变更商品状态失败'
      });
    }
  }
  
  /**
   * 更新商品库存
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @returns {Promise<void>}
   */
  async updateInventory(req, res) {
    try {
      const sellerId = req.user.id;
      const productId = req.params.id;
      const { variants } = req.body; // [{ skuId, quantity }, ...]
      
      const result = await productService.updateInventory(productId, sellerId, variants);
      
      // 发送库存更新消息
      await messageQueue.publish(messageTopics.PRODUCT.INVENTORY_UPDATED, {
        sellerId,
        productId,
        updatedAt: new Date()
      });
      
      logger.info(`卖家 ${sellerId} 更新商品库存成功: ${productId}`);
      
      res.json({
        code: 0,
        message: '库存更新成功',
        data: result
      });
    } catch (error) {
      logger.error('更新商品库存失败:', error);
      res.status(error.statusCode || 500).json({
        code: error.code || 500,
        message: error.message || '更新商品库存失败'
      });
    }
  }
  
  /**
   * 调整商品价格
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @returns {Promise<void>}
   */
  async updatePrice(req, res) {
    try {
      const sellerId = req.user.id;
      const productId = req.params.id;
      const { variants } = req.body; // [{ skuId, price, originalPrice }, ...]
      
      const result = await productService.updatePrice(productId, sellerId, variants);
      
      // 发送价格更新消息
      await messageQueue.publish(messageTopics.PRODUCT.PRICE_UPDATED, {
        sellerId,
        productId,
        updatedAt: new Date()
      });
      
      logger.info(`卖家 ${sellerId} 更新商品价格成功: ${productId}`);
      
      res.json({
        code: 0,
        message: '价格更新成功',
        data: result
      });
    } catch (error) {
      logger.error('更新商品价格失败:', error);
      res.status(error.statusCode || 500).json({
        code: error.code || 500,
        message: error.message || '更新商品价格失败'
      });
    }
  }
  
  /**
   * 复制商品
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @returns {Promise<void>}
   */
  async copyProduct(req, res) {
    try {
      const sellerId = req.user.id;
      const productId = req.params.id;
      const { name } = req.body;
      
      const newProduct = await productService.copyProduct(productId, sellerId, name);
      
      logger.info(`卖家 ${sellerId} 复制商品成功: ${productId} -> ${newProduct.id}`);
      
      res.status(201).json({
        code: 0,
        message: '商品复制成功',
        data: newProduct
      });
    } catch (error) {
      logger.error('复制商品失败:', error);
      res.status(error.statusCode || 500).json({
        code: error.code || 500,
        message: error.message || '复制商品失败'
      });
    }
  }
  
  /**
   * 删除商品
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @returns {Promise<void>}
   */
  async deleteProduct(req, res) {
    try {
      const sellerId = req.user.id;
      const productId = req.params.id;
      
      await productService.deleteProduct(productId, sellerId);
      
      // 发送商品删除消息
      await messageQueue.publish(messageTopics.PRODUCT.DELETED, {
        sellerId,
        productId,
        deletedAt: new Date()
      });
      
      logger.info(`卖家 ${sellerId} 删除商品成功: ${productId}`);
      
      res.json({
        code: 0,
        message: '商品删除成功'
      });
    } catch (error) {
      logger.error('删除商品失败:', error);
      res.status(error.statusCode || 500).json({
        code: error.code || 500,
        message: error.message || '删除商品失败'
      });
    }
  }
  
  /**
   * 批量删除商品
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @returns {Promise<void>}
   */
  async batchDeleteProducts(req, res) {
    try {
      const sellerId = req.user.id;
      const { productIds } = req.body;
      
      await productService.batchDeleteProducts(productIds, sellerId);
      
      // 发送批量删除消息
      await messageQueue.publish(messageTopics.PRODUCT.BATCH_DELETED, {
        sellerId,
        productIds,
        deletedAt: new Date()
      });
      
      logger.info(`卖家 ${sellerId} 批量删除商品成功: ${productIds.length}个`);
      
      res.json({
        code: 0,
        message: '批量删除商品成功'
      });
    } catch (error) {
      logger.error('批量删除商品失败:', error);
      res.status(error.statusCode || 500).json({
        code: error.code || 500,
        message: error.message || '批量删除商品失败'
      });
    }
  }
}

module.exports = new ProductController();