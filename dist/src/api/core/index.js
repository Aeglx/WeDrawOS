/**
 * 核心模块
 * 提供框架的基础功能支持 - 增强版
 */

const database = require('./data-access/database');
const cacheManager = require('./cache/cacheManager');
const container = require('./di/container');
const logger = require('./utils/logger');
const { errorHandler, notFoundHandler, asyncErrorHandler } = require('./exception/middlewares/errorHandlerMiddleware');
const permissionManager = require('./security/permission/permissionManager');
const validation = require('./validation');

/**
 * 初始化核心模块
 * @param {Object} options - 初始化选项
 */
async function initialize(options = {}) {
  try {
    logger.info('开始初始化核心模块...');
    
    // 1. 初始化数据库连接
    await database.initialize();
    logger.info('数据库连接初始化成功');
    
    // 2. 初始化缓存管理器
    await cacheManager.initialize();
    logger.info('缓存管理器初始化成功');
    
    // 3. 初始化依赖注入容器
    // 设置日志器
    container.setLogger(logger);
    await container.initialize();
    logger.info('依赖注入容器初始化成功');
    
    // 4. 注册核心服务到依赖注入容器
    registerCoreServices();
    
    // 5. 初始化权限管理器
    logger.info('权限管理器初始化完成');
    
    // 6. 初始化数据校验组件
    logger.info('数据校验组件初始化完成');
    
    logger.info('核心模块初始化完成');
    return true;
  } catch (error) {
    logger.error('核心模块初始化失败:', error);
    throw error;
  }
}

/**
 * 注册核心服务到依赖注入容器
 */
function registerCoreServices() {
  // 注册数据库服务
  container.registerSingleton('database', () => database);
  
  // 注册缓存管理器服务
  container.registerSingleton('cacheManager', () => cacheManager);
  
  // 注册日志服务
  container.registerSingleton('logger', () => logger);
  
  // 注册权限管理器服务
  container.registerSingleton('permissionManager', () => permissionManager);
  
  // 注册数据校验服务
  container.registerSingleton('validation', () => validation);
  
  // 注册响应格式化工具
  try {
    const responseFormatter = require('./utils/responseFormatter');
    container.registerSingleton('responseFormatter', () => responseFormatter);
  } catch (error) {
    logger.warn('响应格式化工具未找到，将创建默认实现');
    container.registerSingleton('responseFormatter', () => ({
      success: (data, message = 'success') => ({ code: 200, message, data }),
      error: (error, code = 500) => ({ code, message: error.message || 'error' })
    }));
  }
  
  logger.debug('核心服务注册完成');
}

/**
 * 获取中间件集合
 * @returns {Object} 中间件对象
 */
function getMiddlewares() {
  return {
    errorHandler,
    notFoundHandler,
    asyncErrorHandler
  };
}

/**
 * 获取安全相关组件
 * @returns {Object} 安全组件对象
 */
function getSecurity() {
  return {
    auth: require('./security/auth/jwtAuth'),
    utils: require('./security/securityUtils'),
    permission: permissionManager
  };
}

/**
 * 获取工具类集合
 * @returns {Object} 工具类对象
 */
function getUtils() {
  return {
    logger,
    common: require('./utils/common'),
    date: require('./utils/date'),
    encryption: require('./utils/encryption'),
    responseFormatter: require('./utils/responseFormatter')
  };
}

/**
 * 获取异常处理相关组件
 * @returns {Object} 异常处理组件对象
 */
function getException() {
  return {
    errors: require('./exception/handlers/errorHandler'),
    middlewares: getMiddlewares()
  };
}

/**
 * 获取数据访问层组件
 * @returns {Object} 数据访问组件对象
 */
function getDataAccess() {
  return {
    database,
    repositories: {
      BaseRepository: require('./data-access/repositories/BaseRepository'),
      UserRepository: require('./data-access/repositories/UserRepository')
    }
  };
}

/**
 * 关闭核心模块
 */
async function shutdown() {
  try {
    logger.info('正在关闭核心模块...');
    
    // 关闭缓存连接
    await cacheManager.close();
    logger.info('缓存连接已关闭');
    
    // 关闭数据库连接
    await database.close();
    logger.info('数据库连接已关闭');
    
    // 清除容器实例
    container.clearAll();
    logger.info('依赖注入容器已清理');
    
    logger.info('核心模块已成功关闭');
  } catch (error) {
    logger.error('关闭核心模块时发生错误:', error);
  }
}

module.exports = {
  // 核心功能
  initialize,
  shutdown,
  
  // 核心服务访问点
  container,
  
  // 模块访问点
  getMiddlewares,
  getSecurity,
  getUtils,
  getException,
  getDataAccess,
  getValidation: () => validation,
  getPermissionManager: () => permissionManager,
  
  // 常用直接导出
  database,
  cacheManager,
  logger
};