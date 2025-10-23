/**
 * 依赖注入容器
 * 提供服务注册和获取功能
 */

// 导入核心模块
const config = require('../config/config');
const logger = require('../utils/logger');
const cacheManager = require('../cache/cacheManager');
const authService = require('../security/auth/authService');
const permissionManager = require('../security/permission/permissionManager');
const database = require('../data-access/database');
const UserRepository = require('../data-access/repositories/UserRepository');
const cacheService = require('../services/cacheService');
const emailService = require('../services/emailService');
const fileUploadService = require('../storage/fileUploadService');
const DateUtils = require('../utils/dateUtils');
const StringUtils = require('../utils/stringUtils');
const ArrayUtils = require('../utils/arrayUtils');

class DependencyInjector {
  constructor() {
    this.services = new Map();
    this.instances = new Map();
    this.logger = console;
    this.initialized = false;
  }

  /**
   * 初始化依赖注入容器
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // 设置日志器
      this.setLogger(logger);
      
      // 注册核心服务
      this.register('config', config, true);
      this.register('logger', logger, true);
      this.register('cacheManager', cacheManager, true);
      this.register('database', database, true);
      
      // 注册工具类
      this.register('DateUtils', DateUtils, false);
      this.register('StringUtils', StringUtils, false);
      this.register('ArrayUtils', ArrayUtils, false);
      
      // 注册仓库
      this.register('UserRepository', UserRepository, true);
      
      // 注册业务服务
      this.register('cacheService', cacheService, true);
      this.register('emailService', emailService, true);
      this.register('fileUploadService', fileUploadService, true);
      
      // 注册安全相关服务
      this.register('authService', authService, true);
      this.register('permissionManager', permissionManager, true);
      
      // 初始化数据库连接
      await database.connect();
      
      // 初始化缓存连接
      await cacheManager.connect();
      
      this.initialized = true;
      this.logger.info('依赖注入容器初始化成功');
    } catch (error) {
      this.logger.error('依赖注入容器初始化失败:', error);
      throw error;
    }
  }

  /**
   * 注册服务
   * @param {string} name - 服务名称
   * @param {Function|Object} service - 服务构造函数或实例
   * @param {boolean} singleton - 是否是单例
   */
  register(name, service, singleton = true) {
    this.services.set(name, {
      service,
      singleton
    });
    this.logger.info(`服务注册成功: ${name}`);
  }

  /**
   * 获取服务
   * @param {string} name - 服务名称
   * @returns {Object} 服务实例
   */
  get(name) {
    const serviceInfo = this.services.get(name);
    
    if (!serviceInfo) {
      this.logger.error(`服务未找到: ${name}`);
      throw new Error(`服务未找到: ${name}`);
    }

    if (serviceInfo.singleton) {
      if (!this.instances.has(name)) {
        this.instances.set(name, this.createInstance(serviceInfo.service));
      }
      return this.instances.get(name);
    }

    return this.createInstance(serviceInfo.service);
  }

  /**
   * 创建服务实例
   * @param {Function|Object} service - 服务构造函数或实例
   * @returns {Object} 服务实例
   */
  createInstance(service) {
    if (typeof service === 'function') {
      // 尝试注入依赖
      return new service(this);
    }
    return service;
  }

  /**
   * 检查服务是否存在
   * @param {string} name - 服务名称
   * @returns {boolean} 是否存在
   */
  has(name) {
    return this.services.has(name);
  }

  /**
   * 注销服务
   * @param {string} name - 服务名称
   */
  unregister(name) {
    this.services.delete(name);
    this.instances.delete(name);
    this.logger.info(`服务注销成功: ${name}`);
  }

  /**
   * 获取所有服务名称
   * @returns {string[]} 服务名称数组
   */
  getAllServices() {
    return Array.from(this.services.keys());
  }

  /**
   * 设置日志器
   * @param {Object} logger - 日志器实例
   */
  setLogger(logger) {
    this.logger = logger;
  }

  /**
   * 关闭依赖注入容器
   */
  async shutdown() {
    try {
      // 关闭数据库连接
      if (this.has('database')) {
        const db = this.get('database');
        if (db.close) {
          await db.close();
        }
      }
      
      // 关闭缓存连接
      if (this.has('cacheManager')) {
        const cache = this.get('cacheManager');
        if (cache.close) {
          await cache.close();
        }
      }
      
      this.services.clear();
      this.instances.clear();
      this.initialized = false;
      this.logger.info('依赖注入容器关闭成功');
    } catch (error) {
      this.logger.error('依赖注入容器关闭失败:', error);
    }
  }

  /**
   * 清除所有服务
   */
  clear() {
    this.services.clear();
    this.instances.clear();
    this.logger.info('所有服务已清除');
  }
}

// 创建全局实例
const di = new DependencyInjector();

// 导出辅助函数以便更方便地使用
const getService = (name) => di.get(name);
const registerService = (name, service, singleton = true) => di.register(name, service, singleton);

module.exports = {
  di,
  getService,
  registerService
};

// 同时导出di作为默认值，以保持向后兼容
module.exports.default = di;