/**
 * 运营管理数据仓库
 * 实现运营管理相关的数据操作
 */

const BaseRepository = require('../../../core/repositories/baseRepository');
const logger = require('../../../core/logger');

class OperationRepository extends BaseRepository {
  constructor() {
    super('operations');
    // 模拟数据存储
    this.mockOperations = [
      {
        id: '1',
        name: '春节促销活动',
        description: '2024年春节期间的全场促销活动',
        type: 'promotion',
        status: 'active',
        startTime: '2024-02-01T00:00:00Z',
        endTime: '2024-02-15T23:59:59Z',
        rules: {
          discount: '20%',
          minAmount: 100
        },
        targetAudience: 'all',
        channels: ['app', 'web', 'wechat'],
        createdBy: 'admin',
        createdAt: '2024-01-20T10:00:00Z',
        updatedAt: '2024-01-25T15:30:00Z',
        statistics: {
          views: 15200,
          clicks: 3450,
          conversions: 890,
          revenue: 125000
        }
      },
      {
        id: '2',
        name: '新品发布会',
        description: '春季新品线上发布会',
        type: 'event',
        status: 'scheduled',
        startTime: '2024-03-10T19:00:00Z',
        endTime: '2024-03-10T21:00:00Z',
        rules: {},
        targetAudience: 'vip',
        channels: ['app', 'web', 'wechat', 'video'],
        createdBy: 'marketing',
        createdAt: '2024-02-20T14:20:00Z',
        updatedAt: '2024-02-28T09:15:00Z',
        statistics: {
          views: 0,
          clicks: 0,
          conversions: 0,
          revenue: 0
        }
      },
      {
        id: '3',
        name: '会员日活动',
        description: '每月18日会员专享优惠',
        type: 'member',
        status: 'active',
        startTime: '2024-01-01T00:00:00Z',
        endTime: '2024-12-31T23:59:59Z',
        rules: {
          points: 'double',
          exclusiveProducts: true
        },
        targetAudience: 'members',
        channels: ['app', 'web', 'wechat'],
        createdBy: 'admin',
        createdAt: '2023-12-15T11:45:00Z',
        updatedAt: '2024-01-10T16:20:00Z',
        statistics: {
          views: 28500,
          clicks: 6780,
          conversions: 1560,
          revenue: 235000
        }
      },
      {
        id: '4',
        name: '限时秒杀',
        description: '每日限量秒杀活动',
        type: 'flash_sale',
        status: 'draft',
        startTime: null,
        endTime: null,
        rules: {
          discount: '50%',
          limitedQuantity: 100
        },
        targetAudience: 'all',
        channels: ['app', 'wechat'],
        createdBy: 'marketing',
        createdAt: '2024-02-25T13:30:00Z',
        updatedAt: '2024-02-25T13:30:00Z',
        statistics: {
          views: 0,
          clicks: 0,
          conversions: 0,
          revenue: 0
        }
      },
      {
        id: '5',
        name: '黑色星期五',
        description: '年度最大促销活动',
        type: 'promotion',
        status: 'completed',
        startTime: '2023-11-24T00:00:00Z',
        endTime: '2023-11-26T23:59:59Z',
        rules: {
          discount: '30%',
          specialOffers: true
        },
        targetAudience: 'all',
        channels: ['app', 'web', 'wechat', 'email'],
        createdBy: 'admin',
        createdAt: '2023-11-01T09:00:00Z',
        updatedAt: '2023-11-27T10:45:00Z',
        statistics: {
          views: 89500,
          clicks: 23450,
          conversions: 5678,
          revenue: 1250000
        }
      }
    ];
    
    // 模拟模板数据
    this.mockTemplates = [
      {
        id: 'template_1',
        name: '促销活动模板',
        type: 'promotion',
        description: '适用于各类折扣促销活动',
        config: {
          discount: '10-50%',
          minAmount: 0,
          maxDiscount: 0
        }
      },
      {
        id: 'template_2',
        name: '会员专享模板',
        type: 'member',
        description: '针对会员的专属活动',
        config: {
          pointsMultiplier: 2,
          exclusiveAccess: true
        }
      },
      {
        id: 'template_3',
        name: '新品发布模板',
        type: 'event',
        description: '新品上市推广活动',
        config: {
          duration: '2h',
          liveStream: true
        }
      }
    ];
  }

  /**
   * 获取运营活动列表
   * @param {Object} queryParams - 查询参数
   * @returns {Promise<Object>} 运营活动列表和分页信息
   */
  async getOperationList(queryParams) {
    try {
      let operations = [...this.mockOperations];
      
      // 应用筛选条件
      if (queryParams.status) {
        operations = operations.filter(op => op.status === queryParams.status);
      }
      
      if (queryParams.keyword) {
        const keyword = queryParams.keyword.toLowerCase();
        operations = operations.filter(op => 
          op.name.toLowerCase().includes(keyword) || 
          op.description.toLowerCase().includes(keyword)
        );
      }
      
      // 计算分页
      const total = operations.length;
      const page = queryParams.page || 1;
      const limit = queryParams.limit || 10;
      const offset = (page - 1) * limit;
      const paginatedOperations = operations.slice(offset, offset + limit);
      
      return {
        list: paginatedOperations,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      };
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
      const operation = this.mockOperations.find(op => op.id === id);
      if (!operation) {
        throw new Error('运营活动不存在');
      }
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
      const newOperation = {
        id: String(this.mockOperations.length + 1),
        ...operationData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        statistics: operationData.statistics || {
          views: 0,
          clicks: 0,
          conversions: 0,
          revenue: 0
        }
      };
      
      this.mockOperations.push(newOperation);
      return newOperation;
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
      const index = this.mockOperations.findIndex(op => op.id === id);
      if (index === -1) {
        throw new Error('运营活动不存在');
      }
      
      this.mockOperations[index] = {
        ...this.mockOperations[index],
        ...operationData,
        updatedAt: new Date().toISOString()
      };
      
      return this.mockOperations[index];
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
      const index = this.mockOperations.findIndex(op => op.id === id);
      if (index === -1) {
        throw new Error('运营活动不存在');
      }
      
      this.mockOperations.splice(index, 1);
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
      this.mockOperations = this.mockOperations.filter(op => !ids.includes(op.id));
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
      await this.updateOperation(id, { status });
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
      return this.mockTemplates;
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
      // 模拟数据
      return {
        totalOperations: this.mockOperations.length,
        activeOperations: this.mockOperations.filter(op => op.status === 'active').length,
        scheduledOperations: this.mockOperations.filter(op => op.status === 'scheduled').length,
        completedOperations: this.mockOperations.filter(op => op.status === 'completed').length,
        totalViews: this.mockOperations.reduce((sum, op) => sum + op.statistics.views, 0),
        totalClicks: this.mockOperations.reduce((sum, op) => sum + op.statistics.clicks, 0),
        totalConversions: this.mockOperations.reduce((sum, op) => sum + op.statistics.conversions, 0),
        totalRevenue: this.mockOperations.reduce((sum, op) => sum + op.statistics.revenue, 0),
        dateRange: startDate && endDate ? `${startDate} to ${endDate}` : 'All time'
      };
    } catch (error) {
      logger.error('获取运营数据概览失败:', error);
      throw error;
    }
  }

  /**
   * 获取导出用的运营活动数据
   * @param {Array<string>} ids - 运营活动ID列表（可选）
   * @returns {Promise<Array<Object>>} 运营活动数据
   */
  async getOperationsForExport(ids) {
    try {
      if (ids) {
        return this.mockOperations.filter(op => ids.includes(op.id));
      }
      return this.mockOperations;
    } catch (error) {
      logger.error('获取导出用的运营活动数据失败:', error);
      throw error;
    }
  }
}

module.exports = new OperationRepository();