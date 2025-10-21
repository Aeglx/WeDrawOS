/**
 * 运营管理服务
 * 实现运营管理相关的业务逻辑
 */

const { container } = require('../../../core/di/dependencyInjector');
const logger = require('../../../core/logger');
const cacheService = require('../../../core/cache/cacheService');

class OperationService {
  constructor() {
    this.operationRepository = container.get('operationRepository');
  }

  /**
   * 获取运营活动列表
   * @param {Object} queryParams - 查询参数
   * @returns {Promise<Object>} 运营活动列表
   */
  async getOperationList(queryParams) {
    try {
      // 尝试从缓存获取
      const cacheKey = `operations:list:${JSON.stringify(queryParams)}`;
      const cachedData = await cacheService.get(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      const operations = await this.operationRepository.getOperationList(queryParams);
      
      // 缓存结果，有效期2分钟
      await cacheService.set(cacheKey, operations, 120);
      
      return operations;
    } catch (error) {
      logger.error('获取运营活动列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取运营活动详情
   * @param {string} id - 运营活动ID
   * @returns {Promise<Object>} 运营活动详情
   */
  async getOperationDetail(id) {
    try {
      // 尝试从缓存获取
      const cacheKey = `operations:detail:${id}`;
      const cachedData = await cacheService.get(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      const operation = await this.operationRepository.getOperationDetail(id);
      
      // 缓存结果，有效期5分钟
      await cacheService.set(cacheKey, operation, 300);
      
      return operation;
    } catch (error) {
      logger.error(`获取运营活动详情失败，ID: ${id}`, error);
      throw error;
    }
  }

  /**
   * 创建运营活动
   * @param {Object} operationData - 运营活动数据
   * @returns {Promise<Object>} 创建的运营活动
   */
  async createOperation(operationData) {
    try {
      const operation = await this.operationRepository.createOperation(operationData);
      
      // 清除相关缓存
      await this.clearOperationsCache();
      
      logger.info(`创建运营活动成功，ID: ${operation.id}`);
      return operation;
    } catch (error) {
      logger.error('创建运营活动失败:', error);
      throw error;
    }
  }

  /**
   * 更新运营活动
   * @param {string} id - 运营活动ID
   * @param {Object} operationData - 运营活动数据
   * @returns {Promise<Object>} 更新后的运营活动
   */
  async updateOperation(id, operationData) {
    try {
      const operation = await this.operationRepository.updateOperation(id, operationData);
      
      // 清除相关缓存
      await this.clearOperationsCache(id);
      
      logger.info(`更新运营活动成功，ID: ${id}`);
      return operation;
    } catch (error) {
      logger.error(`更新运营活动失败，ID: ${id}`, error);
      throw error;
    }
  }

  /**
   * 删除运营活动
   * @param {string} id - 运营活动ID
   * @returns {Promise<void>}
   */
  async deleteOperation(id) {
    try {
      await this.operationRepository.deleteOperation(id);
      
      // 清除相关缓存
      await this.clearOperationsCache(id);
      
      logger.info(`删除运营活动成功，ID: ${id}`);
    } catch (error) {
      logger.error(`删除运营活动失败，ID: ${id}`, error);
      throw error;
    }
  }

  /**
   * 批量删除运营活动
   * @param {Array<string>} ids - 运营活动ID列表
   * @returns {Promise<void>}
   */
  async batchDeleteOperations(ids) {
    try {
      await this.operationRepository.batchDeleteOperations(ids);
      
      // 清除相关缓存
      await this.clearOperationsCache();
      
      logger.info(`批量删除运营活动成功，数量: ${ids.length}`);
    } catch (error) {
      logger.error('批量删除运营活动失败:', error);
      throw error;
    }
  }

  /**
   * 更新运营活动状态
   * @param {string} id - 运营活动ID
   * @param {string} status - 新状态
   * @returns {Promise<void>}
   */
  async updateOperationStatus(id, status) {
    try {
      await this.operationRepository.updateOperationStatus(id, status);
      
      // 清除相关缓存
      await this.clearOperationsCache(id);
      
      logger.info(`更新运营活动状态成功，ID: ${id}，状态: ${status}`);
    } catch (error) {
      logger.error(`更新运营活动状态失败，ID: ${id}`, error);
      throw error;
    }
  }

  /**
   * 获取运营活动模板列表
   * @returns {Promise<Array<Object>>} 模板列表
   */
  async getOperationTemplates() {
    try {
      return await this.operationRepository.getOperationTemplates();
    } catch (error) {
      logger.error('获取运营活动模板失败:', error);
      throw error;
    }
  }

  /**
   * 获取运营数据概览
   * @param {string} startDate - 开始日期
   * @param {string} endDate - 结束日期
   * @returns {Promise<Object>} 运营数据概览
   */
  async getOperationOverview(startDate, endDate) {
    try {
      return await this.operationRepository.getOperationOverview(startDate, endDate);
    } catch (error) {
      logger.error('获取运营数据概览失败:', error);
      throw error;
    }
  }

  /**
   * 导出运营活动数据
   * @param {Array<string>} ids - 运营活动ID列表（可选）
   * @param {string} format - 导出格式
   * @returns {Promise<Buffer|string>} 导出文件数据
   */
  async exportOperations(ids, format = 'excel') {
    try {
      const operations = await this.operationRepository.getOperationsForExport(ids);
      
      // 模拟生成导出数据
      // 实际项目中应该使用适当的库生成Excel或CSV
      if (format === 'excel') {
        // 模拟Excel文件数据
        return Buffer.from(JSON.stringify(operations, null, 2));
      } else {
        // 模拟CSV数据
        return JSON.stringify(operations, null, 2);
      }
    } catch (error) {
      logger.error('导出运营活动数据失败:', error);
      throw error;
    }
  }

  /**
   * 复制运营活动
   * @param {string} id - 运营活动ID
   * @returns {Promise<Object>} 复制的运营活动
   */
  async duplicateOperation(id) {
    try {
      const originalOperation = await this.getOperationDetail(id);
      
      // 移除ID和创建时间，设置为草稿状态
      const { id: _, createdAt, updatedAt, ...operationData } = originalOperation;
      const newOperationData = {
        ...operationData,
        name: `${operationData.name} (复制)`,
        status: 'draft',
        startTime: null,
        endTime: null
      };
      
      const duplicated = await this.createOperation(newOperationData);
      logger.info(`复制运营活动成功，原ID: ${id}，新ID: ${duplicated.id}`);
      
      return duplicated;
    } catch (error) {
      logger.error(`复制运营活动失败，ID: ${id}`, error);
      throw error;
    }
  }

  /**
   * 清除运营活动相关缓存
   * @param {string} id - 特定运营活动ID（可选）
   * @private
   */
  async clearOperationsCache(id) {
    // 清除列表缓存
    await cacheService.deletePattern('operations:list:*');
    
    // 如果指定了ID，清除详情缓存
    if (id) {
      await cacheService.delete(`operations:detail:${id}`);
    } else {
      // 否则清除所有详情缓存
      await cacheService.deletePattern('operations:detail:*');
    }
  }
}

module.exports = new OperationService();