/**
 * 服务注册表
 * 提供依赖注入、服务生命周期管理和模块解耦功能
 */

const logger = require('../utils/logger');
const { AppError } = require('../exception/handlers/errorHandler');

/**
 * 服务生命周期枚举
 */
const ServiceLifetime = {
  /** 单例模式 - 整个应用生命周期内只有一个实例 */
  SINGLETON: 'singleton',
  /** 作用域模式 - 每个作用域一个实例（如每个请求） */
  SCOPED: 'scoped',
  /** 瞬态模式 - 每次获取都创建新实例 */
  TRANSIENT: 'transient'
};

/**
 * 服务描述符类
 */
class ServiceDescriptor {
  /**
   * 构造函数
   * @param {string|Symbol|Function} serviceType - 服务类型或标识
   * @param {Function|Object} implementation - 实现类或实例
   * @param {string} lifetime - 生命周期类型
   * @param {Object} options - 额外选项
   */
  constructor(serviceType, implementation, lifetime = ServiceLifetime.SINGLETON, options = {}) {
    this.serviceType = serviceType;
    this.implementation = implementation;
    this.lifetime = lifetime;
    this.options = options;
    this.instance = null; // 单例实例缓存
    this.factory = null;
  }

  /**
   * 设置服务工厂函数
   * @param {Function} factoryFn - 工厂函数
   * @returns {ServiceDescriptor} 当前实例
   */
  withFactory(factoryFn) {
    this.factory = factoryFn;
    return this;
  }

  /**
   * 设置服务初始化函数
   * @param {Function} initFn - 初始化函数
   * @returns {ServiceDescriptor} 当前实例
   */
  withInitializer(initFn) {
    this.options.initializer = initFn;
    return this;
  }

  /**
   * 设置服务销毁函数
   * @param {Function} destroyFn - 销毁函数
   * @returns {ServiceDescriptor} 当前实例
   */
  withDestructor(destroyFn) {
    this.options.destructor = destroyFn;
    return this;
  }
}

/**
 * 依赖注入容器类
 */
class DependencyContainer {
  /**
   * 构造函数
   * @param {ServiceRegistry} registry - 服务注册表
   * @param {Object} parentScope - 父作用域（可选）
   */
  constructor(registry, parentScope = null) {
    this.registry = registry;
    this.parentScope = parentScope;
    this.scopedInstances = new Map();
    this.isDisposed = false;
    this.logger = logger;
  }

  /**
   * 获取服务实例
   * @param {string|Symbol|Function} serviceType - 服务类型
   * @returns {*} 服务实例
   */
  get(serviceType) {
    if (this.isDisposed) {
      throw new Error('容器已被销毁，无法获取服务');
    }

    const descriptor = this.registry.getDescriptor(serviceType);
    if (!descriptor) {
      throw new Error(`未注册的服务: ${this._getServiceTypeName(serviceType)}`);
    }

    try {
      return this._resolveService(descriptor);
    } catch (error) {
      this.logger.error(`解析服务失败: ${this._getServiceTypeName(serviceType)}`, { error });
      throw new AppError(`服务解析失败: ${this._getServiceTypeName(serviceType)}`, 500, error);
    }
  }

  /**
   * 尝试获取服务实例，如果不存在则返回null
   * @param {string|Symbol|Function} serviceType - 服务类型
   * @returns {*} 服务实例或null
   */
  tryGet(serviceType) {
    try {
      return this.get(serviceType);
    } catch {
      return null;
    }
  }

  /**
   * 创建新的作用域
   * @returns {DependencyContainer} 新的作用域容器
   */
  createScope() {
    if (this.isDisposed) {
      throw new Error('容器已被销毁，无法创建新作用域');
    }
    
    const scope = new DependencyContainer(this.registry, this);
    this.registry.registerScope(scope);
    return scope;
  }

  /**
   * 检查服务是否已注册
   * @param {string|Symbol|Function} serviceType - 服务类型
   * @returns {boolean} 是否已注册
   */
  isRegistered(serviceType) {
    return this.registry.hasDescriptor(serviceType);
  }

  /**
   * 解析服务实例
   * @private
   * @param {ServiceDescriptor} descriptor - 服务描述符
   * @returns {*} 服务实例
   */
  _resolveService(descriptor) {
    switch (descriptor.lifetime) {
      case ServiceLifetime.SINGLETON:
        return this._resolveSingleton(descriptor);
      
      case ServiceLifetime.SCOPED:
        return this._resolveScoped(descriptor);
      
      case ServiceLifetime.TRANSIENT:
        return this._resolveTransient(descriptor);
      
      default:
        throw new Error(`未知的服务生命周期: ${descriptor.lifetime}`);
    }
  }

  /**
   * 解析单例服务
   * @private
   * @param {ServiceDescriptor} descriptor - 服务描述符
   * @returns {*} 单例实例
   */
  _resolveSingleton(descriptor) {
    // 如果实例已存在，直接返回
    if (descriptor.instance !== null) {
      return descriptor.instance;
    }

    // 创建新实例
    const instance = this._createInstance(descriptor);
    descriptor.instance = instance;
    
    // 注册到注册表进行跟踪
    this.registry.registerSingletonInstance(descriptor.serviceType, instance);
    
    return instance;
  }

  /**
   * 解析作用域服务
   * @private
   * @param {ServiceDescriptor} descriptor - 服务描述符
   * @returns {*} 作用域实例
   */
  _resolveScoped(descriptor) {
    // 检查当前作用域是否已有实例
    if (this.scopedInstances.has(descriptor.serviceType)) {
      return this.scopedInstances.get(descriptor.serviceType);
    }

    // 创建新实例
    const instance = this._createInstance(descriptor);
    this.scopedInstances.set(descriptor.serviceType, instance);
    
    return instance;
  }

  /**
   * 解析瞬态服务
   * @private
   * @param {ServiceDescriptor} descriptor - 服务描述符
   * @returns {*} 瞬态实例
   */
  _resolveTransient(descriptor) {
    return this._createInstance(descriptor);
  }

  /**
   * 创建服务实例
   * @private
   * @param {ServiceDescriptor} descriptor - 服务描述符
   * @returns {*} 服务实例
   */
  _createInstance(descriptor) {
    let instance;
    
    // 如果有工厂函数，使用工厂创建
    if (descriptor.factory) {
      instance = descriptor.factory(this);
    } 
    // 如果实现已经是实例，直接返回
    else if (typeof descriptor.implementation !== 'function') {
      instance = descriptor.implementation;
    } 
    // 否则通过构造函数创建
    else {
      instance = this._createFromConstructor(descriptor.implementation);
    }

    // 执行初始化函数
    if (descriptor.options.initializer) {
      descriptor.options.initializer(instance, this);
    }

    return instance;
  }

  /**
   * 从构造函数创建实例
   * @private
   * @param {Function} constructor - 构造函数
   * @returns {*} 实例
   */
  _createFromConstructor(constructor) {
    // 获取构造函数参数
    const paramTypes = this._getConstructorParams(constructor);
    
    // 解析所有依赖
    const dependencies = paramTypes.map(type => {
      if (type === DependencyContainer) {
        return this;
      }
      return this.get(type);
    });

    // 创建实例
    return new constructor(...dependencies);
  }

  /**
   * 获取构造函数参数
   * @private
   * @param {Function} constructor - 构造函数
   * @returns {Array} 参数类型数组
   */
  _getConstructorParams(constructor) {
    // 尝试从依赖元数据获取
    if (constructor.$inject) {
      return constructor.$inject;
    }

    // 默认返回空数组
    return [];
  }

  /**
   * 获取服务类型名称
   * @private
   * @param {*} serviceType - 服务类型
   * @returns {string} 类型名称
   */
  _getServiceTypeName(serviceType) {
    if (typeof serviceType === 'string') {
      return serviceType;
    }
    
    if (typeof serviceType === 'symbol') {
      return serviceType.toString();
    }
    
    if (typeof serviceType === 'function') {
      return serviceType.name || 'UnknownType';
    }
    
    return String(serviceType);
  }

  /**
   * 销毁容器，释放资源
   */
  dispose() {
    if (this.isDisposed) {
      return;
    }

    // 销毁作用域实例
    this.scopedInstances.forEach((instance, serviceType) => {
      this._disposeInstance(serviceType, instance);
    });
    
    this.scopedInstances.clear();
    this.isDisposed = true;
    
    // 从注册表中移除作用域
    this.registry.unregisterScope(this);
  }

  /**
   * 销毁实例
   * @private
   * @param {*} serviceType - 服务类型
   * @param {*} instance - 实例
   */
  _disposeInstance(serviceType, instance) {
    try {
      // 查找服务描述符
      const descriptor = this.registry.getDescriptor(serviceType);
      
      // 执行自定义销毁函数
      if (descriptor && descriptor.options.destructor) {
        descriptor.options.destructor(instance);
      }
      // 如果实例有dispose方法，调用它
      else if (instance && typeof instance.dispose === 'function') {
        instance.dispose();
      }
      // 如果实例有close方法，调用它
      else if (instance && typeof instance.close === 'function') {
        instance.close();
      }
    } catch (error) {
      this.logger.error(`销毁实例失败: ${this._getServiceTypeName(serviceType)}`, { error });
    }
  }
}

/**
 * 服务注册表类
 */
class ServiceRegistry {
  constructor() {
    this.descriptors = new Map();
    this.singletonInstances = new Map();
    this.scopes = new Set();
    this.logger = logger;
    this.logger.info('服务注册表初始化');
  }

  /**
   * 注册服务
   * @param {string|Symbol|Function} serviceType - 服务类型
   * @param {Function|Object} implementation - 实现类或实例
   * @param {string} lifetime - 生命周期
   * @returns {ServiceDescriptor} 服务描述符
   */
  register(serviceType, implementation = serviceType, lifetime = ServiceLifetime.SINGLETON) {
    const descriptor = new ServiceDescriptor(serviceType, implementation, lifetime);
    this.descriptors.set(serviceType, descriptor);
    
    this.logger.debug(`服务已注册: ${this._getServiceTypeName(serviceType)}`, {
      lifetime,
      implementationType: implementation.name || 'Instance'
    });
    
    return descriptor;
  }

  /**
   * 注册单例服务
   * @param {string|Symbol|Function} serviceType - 服务类型
   * @param {Function|Object} implementation - 实现类或实例
   * @returns {ServiceDescriptor} 服务描述符
   */
  registerSingleton(serviceType, implementation = serviceType) {
    return this.register(serviceType, implementation, ServiceLifetime.SINGLETON);
  }

  /**
   * 注册作用域服务
   * @param {string|Symbol|Function} serviceType - 服务类型
   * @param {Function|Object} implementation - 实现类或实例
   * @returns {ServiceDescriptor} 服务描述符
   */
  registerScoped(serviceType, implementation = serviceType) {
    return this.register(serviceType, implementation, ServiceLifetime.SCOPED);
  }

  /**
   * 注册瞬态服务
   * @param {string|Symbol|Function} serviceType - 服务类型
   * @param {Function|Object} implementation - 实现类或实例
   * @returns {ServiceDescriptor} 服务描述符
   */
  registerTransient(serviceType, implementation = serviceType) {
    return this.register(serviceType, implementation, ServiceLifetime.TRANSIENT);
  }

  /**
   * 注册工厂服务
   * @param {string|Symbol|Function} serviceType - 服务类型
   * @param {Function} factoryFn - 工厂函数
   * @param {string} lifetime - 生命周期
   * @returns {ServiceDescriptor} 服务描述符
   */
  registerFactory(serviceType, factoryFn, lifetime = ServiceLifetime.SINGLETON) {
    const descriptor = new ServiceDescriptor(serviceType, null, lifetime);
    descriptor.factory = factoryFn;
    this.descriptors.set(serviceType, descriptor);
    
    this.logger.debug(`工厂服务已注册: ${this._getServiceTypeName(serviceType)}`, {
      lifetime
    });
    
    return descriptor;
  }

  /**
   * 检查服务是否已注册
   * @param {string|Symbol|Function} serviceType - 服务类型
   * @returns {boolean} 是否已注册
   */
  isRegistered(serviceType) {
    return this.descriptors.has(serviceType);
  }

  /**
   * 获取服务描述符
   * @param {string|Symbol|Function} serviceType - 服务类型
   * @returns {ServiceDescriptor|null} 服务描述符
   */
  getDescriptor(serviceType) {
    return this.descriptors.get(serviceType) || null;
  }

  /**
   * 检查是否有服务描述符
   * @param {string|Symbol|Function} serviceType - 服务类型
   * @returns {boolean} 是否有描述符
   */
  hasDescriptor(serviceType) {
    return this.descriptors.has(serviceType);
  }

  /**
   * 移除服务注册
   * @param {string|Symbol|Function} serviceType - 服务类型
   * @returns {boolean} 是否移除成功
   */
  unregister(serviceType) {
    const descriptor = this.descriptors.get(serviceType);
    if (!descriptor) {
      return false;
    }

    // 如果是单例，清理实例
    if (descriptor.lifetime === ServiceLifetime.SINGLETON && descriptor.instance) {
      this._disposeInstance(serviceType, descriptor.instance);
      this.singletonInstances.delete(serviceType);
      descriptor.instance = null;
    }

    this.descriptors.delete(serviceType);
    this.logger.debug(`服务已注销: ${this._getServiceTypeName(serviceType)}`);
    return true;
  }

  /**
   * 创建服务容器
   * @returns {DependencyContainer} 依赖注入容器
   */
  createContainer() {
    return new DependencyContainer(this);
  }

  /**
   * 注册单例实例
   * @param {*} serviceType - 服务类型
   * @param {*} instance - 实例
   */
  registerSingletonInstance(serviceType, instance) {
    this.singletonInstances.set(serviceType, instance);
  }

  /**
   * 注册作用域
   * @param {DependencyContainer} scope - 作用域容器
   */
  registerScope(scope) {
    this.scopes.add(scope);
  }

  /**
   * 注销作用域
   * @param {DependencyContainer} scope - 作用域容器
   */
  unregisterScope(scope) {
    this.scopes.delete(scope);
  }

  /**
   * 获取所有注册的服务类型
   * @returns {Array} 服务类型数组
   */
  getRegisteredServices() {
    return Array.from(this.descriptors.keys());
  }

  /**
   * 注销所有服务
   */
  clear() {
    // 销毁所有单例实例
    this.singletonInstances.forEach((instance, serviceType) => {
      this._disposeInstance(serviceType, instance);
    });

    // 清理所有描述符
    this.descriptors.clear();
    this.singletonInstances.clear();

    // 销毁所有作用域
    this.scopes.forEach(scope => {
      try {
        scope.dispose();
      } catch (error) {
        this.logger.error('销毁作用域失败', { error });
      }
    });
    this.scopes.clear();

    this.logger.info('服务注册表已清空');
  }

  /**
   * 批量注册服务
   * @param {Array<{type: *, implementation?: *, lifetime?: string}>} services - 服务配置数组
   */
  registerMultiple(services) {
    services.forEach(serviceConfig => {
      this.register(
        serviceConfig.type,
        serviceConfig.implementation || serviceConfig.type,
        serviceConfig.lifetime || ServiceLifetime.SINGLETON
      );
    });
  }

  /**
   * 销毁实例
   * @private
   * @param {*} serviceType - 服务类型
   * @param {*} instance - 实例
   */
  _disposeInstance(serviceType, instance) {
    try {
      // 获取服务描述符
      const descriptor = this.descriptors.get(serviceType);
      
      // 执行自定义销毁函数
      if (descriptor && descriptor.options.destructor) {
        descriptor.options.destructor(instance);
      }
      // 如果实例有dispose方法，调用它
      else if (instance && typeof instance.dispose === 'function') {
        instance.dispose();
      }
      // 如果实例有close方法，调用它
      else if (instance && typeof instance.close === 'function') {
        instance.close();
      }
    } catch (error) {
      this.logger.error(`销毁实例失败: ${this._getServiceTypeName(serviceType)}`, { error });
    }
  }

  /**
   * 获取服务类型名称
   * @private
   * @param {*} serviceType - 服务类型
   * @returns {string} 类型名称
   */
  _getServiceTypeName(serviceType) {
    if (typeof serviceType === 'string') {
      return serviceType;
    }
    
    if (typeof serviceType === 'symbol') {
      return serviceType.toString();
    }
    
    if (typeof serviceType === 'function') {
      return serviceType.name || 'UnknownType';
    }
    
    return String(serviceType);
  }

  /**
   * 自动扫描并注册装饰了@Injectable的类
   * @param {Array<Function>} classes - 类数组
   */
  scanAndRegister(classes) {
    classes.forEach(cls => {
      if (cls.$injectable) {
        this.register(cls, cls, cls.$injectableLifetime || ServiceLifetime.SINGLETON);
      }
    });
  }
}

/**
 * 注入装饰器 - 标记构造函数参数依赖
 * @param {...Function|Symbol|string} dependencies - 依赖类型
 * @returns {Function} 装饰器函数
 */
function Inject(...dependencies) {
  return function(constructor) {
    constructor.$inject = dependencies;
    return constructor;
  };
}

/**
 * 可注入装饰器 - 标记类为可注入的服务
 * @param {Object} options - 选项
 * @returns {Function} 装饰器函数
 */
function Injectable(options = {}) {
  const lifetime = options.lifetime || ServiceLifetime.SINGLETON;
  
  return function(constructor) {
    constructor.$injectable = true;
    constructor.$injectableLifetime = lifetime;
    return constructor;
  };
}

// 创建全局服务注册表实例
const globalServiceRegistry = new ServiceRegistry();
const globalContainer = globalServiceRegistry.createContainer();

// 注册基础服务
globalServiceRegistry.registerSingleton('ServiceRegistry', globalServiceRegistry);
globalServiceRegistry.registerSingleton('DependencyContainer', globalContainer);

module.exports = {
  ServiceRegistry,
  DependencyContainer,
  ServiceDescriptor,
  ServiceLifetime,
  Inject,
  Injectable,
  globalServiceRegistry,
  globalContainer
};