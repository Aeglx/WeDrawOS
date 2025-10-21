/**
 * 系统设置数据仓库
 * 处理系统配置相关的数据操作
 */

const di = require('../../../core/di/container');
const BaseRepository = require('../../../core/repositories/baseRepository');
const logger = di.resolve('logger');
const fs = require('fs');
const path = require('path');

// 模拟系统配置数据存储
let systemConfig = {
  siteName: '电商管理系统',
  siteDescription: '一体化电商管理平台',
  logoUrl: '',
  faviconUrl: '',
  contactEmail: 'admin@example.com',
  contactPhone: '400-123-4567',
  address: '北京市朝阳区某某街道123号',
  defaultPageSize: 20,
  maxPageSize: 100,
  enableRegistration: true,
  enableEmailVerification: true,
  passwordStrength: 'medium', // weak, medium, strong
  sessionTimeout: 3600, // 秒
  cacheExpiration: 3600, // 秒
  createdAt: new Date(),
  updatedAt: new Date()
};

// 模拟日志数据
let systemLogs = [];

class SystemRepository extends BaseRepository {
  constructor() {
    super();
    logger.info('系统设置数据仓库初始化');
    this.initializeMockLogs();
  }
  
  /**
   * 获取系统配置
   * @returns {Promise<Object>} 系统配置
   */
  async getSystemConfig() {
    try {
      logger.info('获取系统配置');
      return { ...systemConfig };
    } catch (error) {
      logger.error('获取系统配置失败', { error: error.message });
      throw error;
    }
  }
  
  /**
   * 更新系统配置
   * @param {Object} configData - 配置数据
   * @returns {Promise<Object>} 更新后的配置
   */
  async updateSystemConfig(configData) {
    try {
      systemConfig = {
        ...systemConfig,
        ...configData,
        updatedAt: new Date()
      };
      
      logger.info('系统配置更新成功');
      return { ...systemConfig };
    } catch (error) {
      logger.error('更新系统配置失败', { error: error.message });
      throw error;
    }
  }
  
  /**
   * 获取系统日志
   * @param {Object} query - 查询参数
   * @returns {Promise<Object>} 日志列表
   */
  async getSystemLogs(query) {
    try {
      const { page, limit, level, date } = query;
      
      // 过滤日志
      let filteredLogs = [...systemLogs];
      
      if (level) {
        filteredLogs = filteredLogs.filter(log => log.level === level);
      }
      
      if (date) {
        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);
        const nextDay = new Date(targetDate);
        nextDay.setDate(nextDay.getDate() + 1);
        
        filteredLogs = filteredLogs.filter(log => {
          const logDate = new Date(log.timestamp);
          return logDate >= targetDate && logDate < nextDay;
        });
      }
      
      // 排序（最新的在前）
      filteredLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      // 分页
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedLogs = filteredLogs.slice(startIndex, endIndex);
      
      return {
        items: paginatedLogs,
        total: filteredLogs.length,
        page,
        limit,
        totalPages: Math.ceil(filteredLogs.length / limit)
      };
    } catch (error) {
      logger.error('获取系统日志失败', { error: error.message });
      throw error;
    }
  }
  
  /**
   * 获取所有系统数据（用于备份）
   * @returns {Promise<Object>} 系统所有数据
   */
  async getAllSystemData() {
    try {
      // 在实际应用中，这里会从各个数据库获取数据
      // 这里模拟获取系统关键数据
      return {
        systemConfig: { ...systemConfig },
        systemLogs: [...systemLogs].slice(0, 1000), // 只备份最近1000条日志
        backupInfo: {
          timestamp: new Date(),
          version: '1.0.0'
        }
      };
    } catch (error) {
      logger.error('获取系统所有数据失败', { error: error.message });
      throw error;
    }
  }
  
  /**
   * 添加系统日志
   * @param {Object} logData - 日志数据
   */
  async addSystemLog(logData) {
    try {
      const log = {
        id: Date.now().toString(),
        timestamp: new Date(),
        ...logData
      };
      
      systemLogs.push(log);
      
      // 保持日志数量在合理范围
      if (systemLogs.length > 10000) {
        systemLogs = systemLogs.slice(-10000);
      }
      
      logger.info('系统日志添加成功', { logId: log.id });
    } catch (error) {
      logger.error('添加系统日志失败', { error: error.message });
      // 日志记录失败不影响主流程
    }
  }
  
  /**
   * 初始化模拟日志数据
   */
  initializeMockLogs() {
    const logLevels = ['info', 'warn', 'error', 'debug'];
    const logMessages = [
      '系统启动成功',
      '用户登录',
      '配置更新',
      '数据备份完成',
      '缓存清除',
      'API调用异常',
      '权限验证失败',
      '数据库连接错误'
    ];
    
    // 生成过去7天的模拟日志
    for (let i = 0; i < 100; i++) {
      const randomDate = new Date();
      randomDate.setDate(randomDate.getDate() - Math.floor(Math.random() * 7));
      randomDate.setHours(Math.floor(Math.random() * 24));
      randomDate.setMinutes(Math.floor(Math.random() * 60));
      
      systemLogs.push({
        id: `log_${Date.now()}_${i}`,
        timestamp: randomDate,
        level: logLevels[Math.floor(Math.random() * logLevels.length)],
        message: logMessages[Math.floor(Math.random() * logMessages.length)],
        user: `user_${Math.floor(Math.random() * 10) + 1}`,
        ip: `192.168.1.${Math.floor(Math.random() * 255) + 1}`
      });
    }
    
    logger.info('系统日志模拟数据初始化完成', { count: systemLogs.length });
  }
  
  /**
   * 获取系统统计信息
   * @returns {Promise<Object>} 系统统计信息
   */
  async getSystemStats() {
    try {
      // 统计各级别日志数量
      const logStats = systemLogs.reduce((stats, log) => {
        stats[log.level] = (stats[log.level] || 0) + 1;
        return stats;
      }, {});
      
      return {
        logStats,
        totalLogs: systemLogs.length,
        configLastUpdated: systemConfig.updatedAt,
        serverUptime: process.uptime()
      };
    } catch (error) {
      logger.error('获取系统统计信息失败', { error: error.message });
      throw error;
    }
  }
}

module.exports = new SystemRepository();