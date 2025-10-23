/**
 * 卖家端库存管理控制器
 * 实现库存列表查询、更新库存、库存预警等功能
 */

const logger = require('../../../core/utils/logger');
const inventoryService = require('../services/inventoryService');
const messageQueue = require('../../../core/services/messageQueue');

/**
 * 库存管理控制器
 * @class InventoryController
 */
class InventoryController {
  /**
   * 获取库存列表
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async getInventoryList(req, res) {
    try {
      const sellerId = req.user.id;
      const { page = 1, pageSize = 10, productId, skuId, keyword, alertOnly = false } = req.query;
      
      logger.info(`卖家[${sellerId}]获取库存列表`, { 
        page, pageSize, productId, skuId, keyword, alertOnly 
      });
      
      const result = await inventoryService.getInventoryList({
        sellerId,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        productId,
        skuId,
        keyword,
        alertOnly: alertOnly === 'true' || alertOnly === true
      });
      
      logger.info(`卖家[${sellerId}]获取库存列表成功`);
      
      return res.json({
        success: true,
        message: '获取库存列表成功',
        data: result
      });
    } catch (error) {
      logger.error('获取库存列表失败:', error);
      
      return res.status(500).json({
        success: false,
        message: error.message || '获取库存列表失败'
      });
    }
  }

  /**
   * 更新产品库存
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async updateInventory(req, res) {
    try {
      const sellerId = req.user.id;
      const { id: productId } = req.params;
      const { quantity, skuId, reason } = req.body;
      
      logger.info(`卖家[${sellerId}]更新产品[${productId}]库存`, { 
        quantity, skuId, reason 
      });
      
      await inventoryService.updateInventory({
        sellerId,
        productId: parseInt(productId),
        skuId: skuId ? parseInt(skuId) : null,
        quantity: parseInt(quantity),
        reason
      });
      
      // 发布库存变更消息到消息队列
      await messageQueue.publish('INVENTORY_CHANGED', {
        sellerId,
        productId: parseInt(productId),
        skuId: skuId ? parseInt(skuId) : null,
        quantity: parseInt(quantity),
        operator: sellerId,
        timestamp: new Date().toISOString(),
        reason: reason || '手动调整'
      });
      
      logger.info(`卖家[${sellerId}]更新产品[${productId}]库存成功`);
      
      return res.json({
        success: true,
        message: '产品库存更新成功'
      });
    } catch (error) {
      logger.error('更新产品库存失败:', error);
      
      return res.status(500).json({
        success: false,
        message: error.message || '更新产品库存失败'
      });
    }
  }

  /**
   * 获取库存预警
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async getInventoryAlerts(req, res) {
    try {
      const sellerId = req.user.id;
      const { page = 1, pageSize = 10 } = req.query;
      
      logger.info(`卖家[${sellerId}]获取库存预警`, { page, pageSize });
      
      const result = await inventoryService.getInventoryAlerts({
        sellerId,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      });
      
      logger.info(`卖家[${sellerId}]获取库存预警成功`);
      
      return res.json({
        success: true,
        message: '获取库存预警成功',
        data: result
      });
    } catch (error) {
      logger.error('获取库存预警失败:', error);
      
      return res.status(500).json({
        success: false,
        message: error.message || '获取库存预警失败'
      });
    }
  }

  /**
   * 设置库存预警阈值
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async setInventoryAlert(req, res) {
    try {
      const sellerId = req.user.id;
      const { productId, skuId, alertThreshold } = req.body;
      
      logger.info(`卖家[${sellerId}]设置库存预警阈值`, { 
        productId, skuId, alertThreshold 
      });
      
      await inventoryService.setInventoryAlert({
        sellerId,
        productId: parseInt(productId),
        skuId: skuId ? parseInt(skuId) : null,
        alertThreshold: parseInt(alertThreshold)
      });
      
      logger.info(`卖家[${sellerId}]设置库存预警阈值成功`);
      
      return res.json({
        success: true,
        message: '设置库存预警阈值成功'
      });
    } catch (error) {
      logger.error('设置库存预警阈值失败:', error);
      
      return res.status(500).json({
        success: false,
        message: error.message || '设置库存预警阈值失败'
      });
    }
  }

  /**
   * 批量更新库存
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async batchUpdateInventory(req, res) {
    try {
      const sellerId = req.user.id;
      const { items } = req.body;
      
      logger.info(`卖家[${sellerId}]批量更新库存`, { itemCount: items?.length || 0 });
      
      const results = await inventoryService.batchUpdateInventory({
        sellerId,
        items
      });
      
      // 发布批量库存变更消息
      for (const item of items) {
        await messageQueue.publish('INVENTORY_CHANGED', {
          sellerId,
          productId: parseInt(item.productId),
          skuId: item.skuId ? parseInt(item.skuId) : null,
          quantity: parseInt(item.quantity),
          operator: sellerId,
          timestamp: new Date().toISOString(),
          reason: item.reason || '批量调整'
        });
      }
      
      logger.info(`卖家[${sellerId}]批量更新库存成功`);
      
      return res.json({
        success: true,
        message: '批量更新库存成功',
        data: results
      });
    } catch (error) {
      logger.error('批量更新库存失败:', error);
      
      return res.status(500).json({
        success: false,
        message: error.message || '批量更新库存失败'
      });
    }
  }

  /**
   * 获取库存统计信息
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async getInventoryStats(req, res) {
    try {
      const sellerId = req.user.id;
      
      logger.info(`卖家[${sellerId}]获取库存统计信息`);
      
      const stats = await inventoryService.getInventoryStats(sellerId);
      
      logger.info(`卖家[${sellerId}]获取库存统计信息成功`);
      
      return res.json({
        success: true,
        message: '获取库存统计信息成功',
        data: stats
      });
    } catch (error) {
      logger.error('获取库存统计信息失败:', error);
      
      return res.status(500).json({
        success: false,
        message: error.message || '获取库存统计信息失败'
      });
    }
  }

  /**
   * 导出库存数据
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async exportInventory(req, res) {
    try {
      const sellerId = req.user.id;
      const { format = 'csv' } = req.query;
      
      logger.info(`卖家[${sellerId}]导出库存数据`, { format });
      
      const exportData = await inventoryService.exportInventory(sellerId, format);
      
      // 设置响应头
      res.setHeader('Content-Disposition', `attachment; filename=inventory_${Date.now()}.${format}`);
      res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/json');
      
      logger.info(`卖家[${sellerId}]导出库存数据成功`);
      
      return res.send(exportData);
    } catch (error) {
      logger.error('导出库存数据失败:', error);
      
      return res.status(500).json({
        success: false,
        message: error.message || '导出库存数据失败'
      });
    }
  }
}

module.exports = new InventoryController();