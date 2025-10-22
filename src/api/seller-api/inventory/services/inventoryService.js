/**
 * 卖家端库存管理服务
 * 实现库存处理的核心业务逻辑
 */

const logger = require('../../../core/utils/logger');
const inventoryRepository = require('../repositories/inventoryRepository');
const productService = require('../../product/services/productService');

/**
 * 库存管理服务
 * @class InventoryService
 */
class InventoryService {
  /**
   * 获取库存列表
   * @param {Object} params - 查询参数
   * @param {number} params.sellerId - 卖家ID
   * @param {number} params.page - 页码
   * @param {number} params.pageSize - 每页数量
   * @param {string} params.productId - 产品ID
   * @param {string} params.skuId - SKU ID
   * @param {string} params.keyword - 关键词
   * @param {boolean} params.alertOnly - 仅显示预警
   * @returns {Promise<Object>} 库存列表和分页信息
   */
  async getInventoryList(params) {
    const { sellerId, page, pageSize, productId, skuId, keyword, alertOnly } = params;
    
    try {
      logger.info(`获取库存列表服务`, { sellerId, page, pageSize });
      
      const offset = (page - 1) * pageSize;
      const query = {
        sellerId,
        productId: productId ? parseInt(productId) : null,
        skuId: skuId ? parseInt(skuId) : null,
        keyword,
        alertOnly
      };
      
      const result = await inventoryRepository.getInventoryList(query, offset, pageSize);
      const total = await inventoryRepository.countInventory(query);
      
      return {
        list: result,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      };
    } catch (error) {
      logger.error('获取库存列表服务失败:', error);
      throw new Error('获取库存列表失败');
    }
  }

  /**
   * 更新产品库存
   * @param {Object} params - 更新参数
   * @param {number} params.sellerId - 卖家ID
   * @param {number} params.productId - 产品ID
   * @param {number} params.skuId - SKU ID
   * @param {number} params.quantity - 库存数量
   * @param {string} params.reason - 更新原因
   * @returns {Promise<void>}
   */
  async updateInventory(params) {
    const { sellerId, productId, skuId, quantity, reason } = params;
    
    try {
      // 验证产品是否存在且属于该卖家
      const product = await productService.getProductById(productId, sellerId);
      if (!product) {
        throw new Error('产品不存在或无权操作');
      }
      
      // 验证库存数量
      if (quantity < 0) {
        throw new Error('库存数量不能为负数');
      }
      
      // 更新库存
      const result = await inventoryRepository.updateInventory({
        sellerId,
        productId,
        skuId,
        quantity,
        reason,
        updatedBy: sellerId
      });
      
      if (!result) {
        throw new Error('库存更新失败');
      }
      
    } catch (error) {
      logger.error('更新库存服务失败:', error);
      throw error;
    }
  }

  /**
   * 获取库存预警
   * @param {Object} params - 查询参数
   * @param {number} params.sellerId - 卖家ID
   * @param {number} params.page - 页码
   * @param {number} params.pageSize - 每页数量
   * @returns {Promise<Object>} 库存预警列表和分页信息
   */
  async getInventoryAlerts(params) {
    const { sellerId, page, pageSize } = params;
    
    try {
      logger.info(`获取库存预警服务`, { sellerId, page, pageSize });
      
      const offset = (page - 1) * pageSize;
      const result = await inventoryRepository.getInventoryAlerts(sellerId, offset, pageSize);
      const total = await inventoryRepository.countInventoryAlerts(sellerId);
      
      return {
        list: result,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      };
    } catch (error) {
      logger.error('获取库存预警服务失败:', error);
      throw new Error('获取库存预警失败');
    }
  }

  /**
   * 设置库存预警阈值
   * @param {Object} params - 设置参数
   * @param {number} params.sellerId - 卖家ID
   * @param {number} params.productId - 产品ID
   * @param {number} params.skuId - SKU ID
   * @param {number} params.alertThreshold - 预警阈值
   * @returns {Promise<void>}
   */
  async setInventoryAlert(params) {
    const { sellerId, productId, skuId, alertThreshold } = params;
    
    try {
      // 验证预警阈值
      if (alertThreshold < 0) {
        throw new Error('预警阈值不能为负数');
      }
      
      // 检查产品是否存在
      const product = await productService.getProductById(productId, sellerId);
      if (!product) {
        throw new Error('产品不存在或无权操作');
      }
      
      // 设置预警阈值
      const result = await inventoryRepository.setInventoryAlert({
        sellerId,
        productId,
        skuId,
        alertThreshold
      });
      
      if (!result) {
        throw new Error('设置库存预警阈值失败');
      }
      
    } catch (error) {
      logger.error('设置库存预警阈值服务失败:', error);
      throw error;
    }
  }

  /**
   * 批量更新库存
   * @param {Object} params - 更新参数
   * @param {number} params.sellerId - 卖家ID
   * @param {Array} params.items - 库存项数组
   * @returns {Promise<Array>} 更新结果
   */
  async batchUpdateInventory(params) {
    const { sellerId, items } = params;
    
    try {
      const results = [];
      
      // 遍历库存项进行更新
      for (const item of items) {
        try {
          await this.updateInventory({
            sellerId,
            productId: parseInt(item.productId),
            skuId: item.skuId ? parseInt(item.skuId) : null,
            quantity: parseInt(item.quantity),
            reason: item.reason || '批量更新'
          });
          
          results.push({
            productId: item.productId,
            skuId: item.skuId,
            success: true,
            message: '更新成功'
          });
        } catch (error) {
          results.push({
            productId: item.productId,
            skuId: item.skuId,
            success: false,
            message: error.message
          });
        }
      }
      
      return results;
    } catch (error) {
      logger.error('批量更新库存服务失败:', error);
      throw new Error('批量更新库存失败');
    }
  }

  /**
   * 获取库存统计信息
   * @param {number} sellerId - 卖家ID
   * @returns {Promise<Object>} 库存统计信息
   */
  async getInventoryStats(sellerId) {
    try {
      logger.info(`获取库存统计服务`, { sellerId });
      
      // 获取总库存产品数
      const totalProducts = await inventoryRepository.countInventory({ sellerId });
      
      // 获取库存预警产品数
      const alertProducts = await inventoryRepository.countInventoryAlerts(sellerId);
      
      // 获取低库存产品数（库存为0的产品）
      const lowStockProducts = await inventoryRepository.countLowStockProducts(sellerId);
      
      // 获取总库存量
      const totalStockQuantity = await inventoryRepository.getTotalStockQuantity(sellerId);
      
      return {
        totalProducts,
        alertProducts,
        lowStockProducts,
        totalStockQuantity
      };
    } catch (error) {
      logger.error('获取库存统计服务失败:', error);
      throw new Error('获取库存统计失败');
    }
  }

  /**
   * 导出库存数据
   * @param {number} sellerId - 卖家ID
   * @param {string} format - 导出格式 (csv/json)
   * @returns {Promise<string>} 导出的数据
   */
  async exportInventory(sellerId, format = 'csv') {
    try {
      logger.info(`导出库存数据服务`, { sellerId, format });
      
      // 获取所有库存数据
      const inventoryData = await inventoryRepository.getAllInventory(sellerId);
      
      if (format === 'csv') {
        // 生成CSV格式数据
        const headers = ['产品ID', '产品名称', 'SKU ID', 'SKU属性', '当前库存', '预警阈值', '更新时间'];
        const csvRows = [headers.join(',')];
        
        for (const item of inventoryData) {
          const row = [
            item.productId,
            `"${item.productName || ''}"`,
            item.skuId || '',
            `"${item.skuAttributes || ''}"`,
            item.quantity,
            item.alertThreshold || '',
            item.updatedAt ? new Date(item.updatedAt).toLocaleString() : ''
          ];
          csvRows.push(row.join(','));
        }
        
        return csvRows.join('\n');
      } else {
        // 返回JSON格式数据
        return JSON.stringify(inventoryData, null, 2);
      }
    } catch (error) {
      logger.error('导出库存数据服务失败:', error);
      throw new Error('导出库存数据失败');
    }
  }
}

module.exports = new InventoryService();