/**
 * 服务管理器
 * 统一管理和初始化所有核心服务
 */

const logger = require('../utils/logger');
// 直接导入，不需要额外的路径层级
const emailService = require('./emailService');
const smsService = require('./smsService');

class ServiceManager {
  constructor() {
    this.services = new Map();
    this.isInitialized = false;
    // 延迟加载避免循环依赖
    this.redisClient = null;
    this.cacheManager = null;
  }

  /**
   * 初始化所有服务
   */
  async initializeAllServices() {
    try {
      logger.info('开始初始化所有核心服务...');
      
      // 初始化顺序很重要，基础服务先初始化
      const initializationOrder = [
        { name: 'Redis', initialize: this.initializeRedis.bind(this) },
        { name: 'Cache Manager', initialize: this.initializeCacheManager.bind(this) },
        { name: 'Email Service', initialize: this.initializeEmailService.bind(this) },
        { name: 'SMS Service', initialize: this.initializeSmsService.bind(this) }
      ];

      // 按顺序初始化服务
      for (const { name, initialize } of initializationOrder) {
        try {
          await initialize();
          logger.info(`${name} 初始化成功`);
        } catch (error) {
          logger.error(`${name} 初始化失败:`, error);
          // 某些服务可以降级使用，不阻止其他服务初始化
          this.services.set(name, { status: 'error', error });
        }
      }

      this.isInitialized = true;
      logger.info('所有核心服务初始化完成');
      return true;
    } catch (error) {
      logger.error('服务初始化过程中发生严重错误:', error);
      return false;
    }
  }

  /**
   * 初始化Redis服务
   */
  async initializeRedis() {
    try {
      // 动态导入避免循环依赖
      const { initRedis, redisClient } = require('./cache/redisClient');
      await initRedis();
      this.redisClient = redisClient;
      this.services.set('Redis', { 
        status: 'running', 
        client: redisClient,
        isConnected: redisClient.isConnected
      });
      return redisClient;
    } catch (error) {
      logger.error('Redis初始化失败，将使用模拟模式:', error);
      // Redis客户端内部已有降级逻辑，继续执行
      return null;
    }
  }

  /**
   * 初始化缓存管理器
   */
  async initializeCacheManager() {
    try {
      // 动态导入避免循环依赖
      const cacheManager = require('./cache/cacheManager');
      this.cacheManager = cacheManager;
      // 缓存管理器的初始化已经在模块加载时完成
      this.services.set('Cache Manager', { 
        status: 'running',
        instance: cacheManager
      });
      return cacheManager;
    } catch (error) {
      logger.error('缓存管理器初始化失败:', error);
      throw error;
    }
  }

  /**
   * 初始化邮件服务
   */
  async initializeEmailService() {
    try {
      // 邮件服务不需要额外初始化，直接设置状态
      this.services.set('Email Service', { 
        status: 'running',
        instance: emailService
      });
      return emailService;
    } catch (error) {
      logger.error('邮件服务初始化失败:', error);
      // 邮件服务失败可以降级使用，不阻止其他服务
      this.services.set('Email Service', { 
        status: 'error',
        error,
        fallback: true
      });
      return emailService;
    }
  }

  /**
   * 初始化短信服务
   */
  async initializeSmsService() {
    try {
      // 短信服务不需要额外初始化，直接设置状态
      this.services.set('SMS Service', { 
        status: 'running',
        instance: smsService
      });
      return smsService;
    } catch (error) {
      logger.error('短信服务初始化失败:', error);
      // 短信服务失败可以降级使用，不阻止其他服务
      this.services.set('SMS Service', { 
        status: 'error',
        error,
        fallback: true
      });
      return smsService;
    }
  }

  /**
   * 获取服务状态
   */
  getServicesStatus() {
    const status = {};
    this.services.forEach((serviceInfo, serviceName) => {
      status[serviceName] = {
        status: serviceInfo.status,
        isConnected: serviceInfo.isConnected,
        hasFallback: serviceInfo.fallback || false
      };
    });
    return {
      initialized: this.isInitialized,
      services: status,
      timestamp: new Date()
    };
  }

  /**
   * 检查服务健康状态
   */
  async checkServicesHealth() {
    const healthStatus = [];
    
    // 检查Redis健康状态
    if (this.redisClient) {
      try {
        const redisStatus = await this.redisClient.getStatus();
        healthStatus.push({
          service: 'Redis',
          healthy: redisStatus.connected,
          details: redisStatus
        });
      } catch (error) {
        healthStatus.push({
          service: 'Redis',
          healthy: false,
          error: error.message
        });
      }
    }

    // 检查邮件服务健康状态
    if (emailService && emailService.getStatus) {
      try {
        const emailStatus = emailService.getStatus();
        healthStatus.push({
          service: 'Email',
          healthy: emailStatus.isReady,
          details: emailStatus
        });
      } catch (error) {
        healthStatus.push({
          service: 'Email',
          healthy: false,
          error: error.message
        });
      }
    }

    // 检查短信服务健康状态
    if (smsService && smsService.getStatus) {
      try {
        const smsStatus = smsService.getStatus();
        healthStatus.push({
          service: 'SMS',
          healthy: smsStatus.isReady,
          details: smsStatus
        });
      } catch (error) {
        healthStatus.push({
          service: 'SMS',
          healthy: false,
          error: error.message
        });
      }
    }

    return healthStatus;
  }

  /**
   * 优雅关闭所有服务
   */
  async shutdown() {
    try {
      logger.info('开始关闭所有核心服务...');
      
      // 关闭Redis连接
      if (this.redisClient && this.redisClient.close) {
        try {
          await this.redisClient.close();
          logger.info('Redis连接已关闭');
        } catch (error) {
          logger.error('关闭Redis连接失败:', error);
        }
      }

      // 这里可以添加其他服务的关闭逻辑
      
      this.isInitialized = false;
      logger.info('所有核心服务已关闭');
    } catch (error) {
      logger.error('服务关闭过程中发生错误:', error);
    }
  }
}

// 创建单例实例
const serviceManager = new ServiceManager();

module.exports = {
  serviceManager,
  initializeServices: serviceManager.initializeAllServices.bind(serviceManager),
  getServicesStatus: serviceManager.getServicesStatus.bind(serviceManager),
  checkServicesHealth: serviceManager.checkServicesHealth.bind(serviceManager),
  shutdownServices: serviceManager.shutdown.bind(serviceManager)
};

module.exports.default = serviceManager;