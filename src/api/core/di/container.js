/**
 * 依赖注入容器
 * 增强版 - 实现服务的自动注册、依赖解析和生命周期管理
 */

// 存储服务定义
const services = new Map();
// 存储已创建的服务实例
const instances = new Map();
// 默认使用console作为日志器
let logger = console;

/**
 * 注册服务到容器
 * 保持向后兼容的同时增强功能
 * @param {string} name - 服务名称
 * @param {Function|Object} factory - 服务工厂函数，用于创建服务实例
 * @param {Object} options - 注册选项
 * @param {boolean} options.singleton - 是否为单例，默认为true
 * @param {Array<string>} options.deps - 服务依赖的其他服务名称
 */
function register(name, factory, options = {}) {
  if (typeof name !== 'string') {
    throw new Error('服务名称必须是字符串');
  }
  
  const { singleton = true, deps = [] } = options;
  
  services.set(name, {
    factory,
    singleton,
    deps
  });
  
  // 清除已存在的实例
  instances.delete(name);
  
  if (logger.debug) {
    logger.debug(`依赖注入容器: 注册服务 ${name}${singleton ? ' (单例)' : ''}`);
  }
}

/**
 * 从容器获取服务实例
 * @param {string} name - 服务名称
 * @returns {*} 服务实例
 * @throws {Error} 当服务未注册时抛出错误
 */
function get(name) {
  const service = services.get(name);
  
  if (!service) {
    throw new Error(`服务 ${name} 未注册`);
  }
  
  // 如果是单例且已有实例，直接返回
  if (service.singleton && instances.has(name)) {
    return instances.get(name);
  }
  
  // 解析依赖
  const dependencies = service.deps.map(depName => get(depName));
  
  // 创建服务实例
  let instance;
  if (typeof service.factory === 'function') {
    try {
      // 对于向后兼容，如果工厂函数不需要依赖，就不传递参数
      if (service.deps.length === 0) {
        instance = service.factory();
      } else {
        instance = service.factory(...dependencies);
      }
    } catch (error) {
      logger.error(`创建服务 ${name} 实例失败:`, error);
      throw error;
    }
  } else {
    instance = service.factory;
  }
  
  // 对于单例服务，保存实例
  if (service.singleton) {
    instances.set(name, instance);
  }
  
  return instance;
}

/**
 * 检查服务是否已注册
 * @param {string} name - 服务名称
 * @returns {boolean} 是否已注册
 */
function has(name) {
  return services.has(name);
}

/**
 * 移除注册的服务
 * @param {string} name - 服务名称
 */
function unregister(name) {
  services.delete(name);
  instances.delete(name);
}

/**
 * 清空容器
 */
function clear() {
  services.clear();
  instances.clear();
  
  if (logger.debug) {
    logger.debug('依赖注入容器: 已清空所有服务');
  }
}

/**
 * 初始化依赖注入容器
 */
async function initialize() {
  try {
    // 尝试加载logger服务，优先使用项目中的logger
    try {
      const appLogger = require('../utils/logger');
      setLogger(appLogger);
    } catch (error) {
      // 如果加载失败，继续使用console
    }
    
    if (logger.info) {
      logger.info('依赖注入容器初始化成功');
    } else {
      console.log('依赖注入容器初始化成功');
    }
    return true;
  } catch (error) {
    if (logger.error) {
      logger.error('依赖注入容器初始化失败:', error);
    } else {
      console.error('依赖注入容器初始化失败:', error);
    }
    return false;
  }
}

/**
 * 设置日志器
 * @param {Object} log - 日志器实例
 */
function setLogger(log) {
  logger = log;
}

/**
 * 注册单例服务（增强功能）
 * @param {string} name - 服务名称
 * @param {Function|Object} factory - 服务工厂函数或服务实例
 * @param {Array<string>} deps - 服务依赖
 */
function registerSingleton(name, factory, deps = []) {
  register(name, factory, { singleton: true, deps });
}

/**
 * 注册瞬态服务（增强功能）
 * @param {string} name - 服务名称
 * @param {Function} factory - 服务工厂函数
 * @param {Array<string>} deps - 服务依赖
 */
function registerTransient(name, factory, deps = []) {
  register(name, factory, { singleton: false, deps });
}

/**
 * 直接注册服务实例（增强功能）
 * @param {string} name - 服务名称
 * @param {Object} instance - 服务实例
 */
function registerInstance(name, instance) {
  services.set(name, {
    factory: () => instance,
    singleton: true,
    deps: []
  });
  instances.set(name, instance);
  
  if (logger.debug) {
    logger.debug(`依赖注入容器: 注册服务实例 ${name}`);
  }
}

/**
 * 获取所有已注册的服务名称（增强功能）
 * @returns {Array<string>} 服务名称列表
 */
function getAllServices() {
  return Array.from(services.keys());
}

/**
 * 自动注入辅助函数（增强功能）
 * @param {Function} Constructor - 构造函数
 * @param {Array<string>} deps - 依赖的服务名称
 * @returns {Object} 实例化后的对象
 */
function inject(Constructor, deps = []) {
  const dependencies = deps.map(depName => get(depName));
  return new Constructor(...dependencies);
}

module.exports = { 
  register, 
  get, 
  has, 
  unregister, 
  clear,
  initialize,
  setLogger,
  // 增强功能
  registerSingleton,
  registerTransient,
  registerInstance,
  getAllServices,
  inject
};