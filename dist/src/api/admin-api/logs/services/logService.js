const { Service } = require('../../../core');
const { inject } = require('../../../core/di');
const logger = require('../../../core/logger');
const cache = require('../../../core/cache');

class LogService extends Service {
  constructor() {
    super();
    inject(this, 'logRepository');
    this.logger = logger.getLogger('LogService');
    this.cacheTTL = 60; // 缓存60秒
  }

  /**
   * 获取系统日志列表
   * @param {Object} params - 查询参数
   * @returns {Promise<Object>} 日志列表数据
   */
  async getLogs({ page, pageSize, level, module, search, startTime, endTime }) {
    try {
      return await this.logRepository.getLogs({
        page,
        pageSize,
        level,
        module,
        search,
        startTime,
        endTime
      });
    } catch (error) {
      this.logger.error('获取系统日志列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取日志详情
   * @param {string} id - 日志ID
   * @returns {Promise<Object>} 日志详情
   */
  async getLogDetail(id) {
    try {
      return await this.logRepository.getLogDetail(id);
    } catch (error) {
      this.logger.error(`获取日志详情失败 [ID: ${id}]:`, error);
      throw error;
    }
  }

  /**
   * 获取日志统计信息
   * @param {string} timeRange - 时间范围
   * @returns {Promise<Object>} 日志统计数据
   */
  async getLogStats(timeRange) {
    const cacheKey = `logs:stats:${timeRange}`;
    
    try {
      // 尝试从缓存获取
      const cached = await cache.get(cacheKey);
      if (cached) {
        return cached;
      }

      const stats = await this.logRepository.getLogStats(timeRange);
      
      // 设置缓存
      await cache.set(cacheKey, stats, this.cacheTTL);
      
      return stats;
    } catch (error) {
      this.logger.error(`获取日志统计信息失败 [时间范围: ${timeRange}]:`, error);
      throw error;
    }
  }

  /**
   * 导出日志数据
   * @param {Object} params - 导出参数
   * @returns {Promise<string|Buffer>} 导出的数据
   */
  async exportLogs({ format, level, module, startTime, endTime }) {
    try {
      return await this.logRepository.exportLogs({
        format,
        level,
        module,
        startTime,
        endTime
      });
    } catch (error) {
      this.logger.error('导出日志数据失败:', error);
      throw error;
    }
  }

  /**
   * 获取日志模块列表
   * @returns {Promise<Array>} 日志模块列表
   */
  async getLogModules() {
    const cacheKey = 'logs:modules';
    
    try {
      // 尝试从缓存获取
      const cached = await cache.get(cacheKey);
      if (cached) {
        return cached;
      }

      const modules = await this.logRepository.getLogModules();
      
      // 设置缓存
      await cache.set(cacheKey, modules, this.cacheTTL * 5);
      
      return modules;
    } catch (error) {
      this.logger.error('获取日志模块列表失败:', error);
      throw error;
    }
  }

  /**
   * 清理日志
   * @param {number} days - 保留天数
   */
  async cleanLogs(days) {
    try {
      await this.logRepository.cleanLogs(days);
      
      // 清除相关缓存
      await cache.delByPattern('logs:stats:*');
      await cache.del('logs:modules');
    } catch (error) {
      this.logger.error(`清理日志失败 [保留天数: ${days}]:`, error);
      throw error;
    }
  }

  /**
   * 获取用户操作日志
   * @param {Object} params - 查询参数
   * @returns {Promise<Object>} 用户操作日志列表
   */
  async getUserOperationLogs({ page, pageSize, userId, operationType, startTime, endTime }) {
    try {
      return await this.logRepository.getUserOperationLogs({
        page,
        pageSize,
        userId,
        operationType,
        startTime,
        endTime
      });
    } catch (error) {
      this.logger.error('获取用户操作日志失败:', error);
      throw error;
    }
  }

  /**
   * 获取登录日志
   * @param {Object} params - 查询参数
   * @returns {Promise<Object>} 登录日志列表
   */
  async getLoginLogs({ page, pageSize, userId, status, startTime, endTime }) {
    try {
      return await this.logRepository.getLoginLogs({
        page,
        pageSize,
        userId,
        status,
        startTime,
        endTime
      });
    } catch (error) {
      this.logger.error('获取登录日志失败:', error);
      throw error;
    }
  }
}

module.exports = LogService;