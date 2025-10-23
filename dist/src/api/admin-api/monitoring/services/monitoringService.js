const { Service } = require('../../../core');
const { inject } = require('../../../core/di');
const logger = require('../../../core/logger');
const cache = require('../../../core/cache');

class MonitoringService extends Service {
  constructor() {
    super();
    inject(this, 'monitoringRepository');
    this.logger = logger.getLogger('MonitoringService');
    this.cacheTTL = 60; // 缓存60秒
  }

  /**
   * 获取系统监控概览
   * @returns {Promise<Object>} 系统监控概览数据
   */
  async getSystemOverview() {
    const cacheKey = 'monitoring:system:overview';
    
    try {
      // 尝试从缓存获取
      const cached = await cache.get(cacheKey);
      if (cached) {
        return cached;
      }

      const overview = await this.monitoringRepository.getSystemOverview();
      
      // 设置缓存
      await cache.set(cacheKey, overview, this.cacheTTL);
      
      return overview;
    } catch (error) {
      this.logger.error('获取系统监控概览失败:', error);
      throw error;
    }
  }

  /**
   * 获取系统资源使用情况
   * @param {string} timeRange - 时间范围
   * @returns {Promise<Object>} 资源使用情况数据
   */
  async getResourceUsage(timeRange) {
    try {
      return await this.monitoringRepository.getResourceUsage(timeRange);
    } catch (error) {
      this.logger.error(`获取系统资源使用情况失败 [时间范围: ${timeRange}]:`, error);
      throw error;
    }
  }

  /**
   * 获取API调用统计
   * @param {string} timeRange - 时间范围
   * @returns {Promise<Object>} API调用统计数据
   */
  async getApiStats(timeRange) {
    try {
      return await this.monitoringRepository.getApiStats(timeRange);
    } catch (error) {
      this.logger.error(`获取API调用统计失败 [时间范围: ${timeRange}]:`, error);
      throw error;
    }
  }

  /**
   * 获取告警列表
   * @param {Object} params - 查询参数
   * @returns {Promise<Object>} 告警列表数据
   */
  async getAlerts({ status, page, pageSize }) {
    try {
      return await this.monitoringRepository.getAlerts({ status, page, pageSize });
    } catch (error) {
      this.logger.error('获取告警列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取告警详情
   * @param {string} id - 告警ID
   * @returns {Promise<Object>} 告警详情
   */
  async getAlertDetail(id) {
    try {
      return await this.monitoringRepository.getAlertDetail(id);
    } catch (error) {
      this.logger.error(`获取告警详情失败 [ID: ${id}]:`, error);
      throw error;
    }
  }

  /**
   * 处理告警
   * @param {string} id - 告警ID
   * @param {Object} data - 处理数据
   */
  async handleAlert(id, { status, remark, handler }) {
    try {
      await this.monitoringRepository.handleAlert(id, { 
        status, 
        remark, 
        handler,
        handledAt: new Date() 
      });
    } catch (error) {
      this.logger.error(`处理告警失败 [ID: ${id}]:`, error);
      throw error;
    }
  }

  /**
   * 获取告警配置列表
   * @returns {Promise<Array>} 告警配置列表
   */
  async getAlertConfigs() {
    const cacheKey = 'monitoring:alert:configs';
    
    try {
      // 尝试从缓存获取
      const cached = await cache.get(cacheKey);
      if (cached) {
        return cached;
      }

      const configs = await this.monitoringRepository.getAlertConfigs();
      
      // 设置缓存
      await cache.set(cacheKey, configs, this.cacheTTL * 5);
      
      return configs;
    } catch (error) {
      this.logger.error('获取告警配置列表失败:', error);
      throw error;
    }
  }

  /**
   * 更新告警配置
   * @param {string} id - 配置ID
   * @param {Object} configData - 配置数据
   */
  async updateAlertConfig(id, configData) {
    try {
      await this.monitoringRepository.updateAlertConfig(id, configData);
      
      // 清除缓存
      await cache.del('monitoring:alert:configs');
    } catch (error) {
      this.logger.error(`更新告警配置失败 [ID: ${id}]:`, error);
      throw error;
    }
  }

  /**
   * 获取数据库性能监控
   * @param {string} timeRange - 时间范围
   * @returns {Promise<Object>} 数据库性能数据
   */
  async getDatabaseMetrics(timeRange) {
    try {
      return await this.monitoringRepository.getDatabaseMetrics(timeRange);
    } catch (error) {
      this.logger.error(`获取数据库性能监控失败 [时间范围: ${timeRange}]:`, error);
      throw error;
    }
  }

  /**
   * 获取错误率趋势
   * @param {string} timeRange - 时间范围
   * @returns {Promise<Object>} 错误率趋势数据
   */
  async getErrorRateTrend(timeRange) {
    try {
      return await this.monitoringRepository.getErrorRateTrend(timeRange);
    } catch (error) {
      this.logger.error(`获取错误率趋势失败 [时间范围: ${timeRange}]:`, error);
      throw error;
    }
  }
}

module.exports = MonitoringService;