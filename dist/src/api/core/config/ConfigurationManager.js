/**
 * 配置管理器
 * 提供配置加载、验证、合并和动态更新功能
 */

const fs = require('fs').promises;
const path = require('path');
const dotenv = require('dotenv');
const { AppError } = require('../exception/handlers/errorHandler');
const { DataValidator } = require('../validation/DataValidator');
const logger = require('../utils/logger');

/**
 * 配置源类型枚举
 */
const ConfigSourceType = {
  /** 环境变量 */
  ENV: 'env',
  /** JSON配置文件 */
  JSON: 'json',
  /** JavaScript配置文件 */
  JS: 'js',
  /** 命令行参数 */
  CLI: 'cli',
  /** 内存配置 */
  MEMORY: 'memory'
};

/**
 * 配置管理器类
 */
class ConfigurationManager {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   */
  constructor(options = {}) {
    this.configSources = new Map();
    this.configValues = new Map();
    this.defaultValues = new Map();
    this.validationRules = new Map();
    this.watchers = new Set();
    this.isInitialized = false;
    this.basePath = options.basePath || process.cwd();
    this.logger = options.logger || logger;
    this.validator = new DataValidator();
    this.logger.info('配置管理器初始化');
  }

  /**
   * 初始化配置管理器
   * @param {Object} options - 初始化选项
   * @returns {Promise<ConfigurationManager>} 配置管理器实例
   */
  async initialize(options = {}) {
    if (this.isInitialized) {
      this.logger.warn('配置管理器已初始化，跳过重复初始化');
      return this;
    }

    try {
      // 加载环境变量
      if (options.loadEnv !== false) {
        await this.loadFromEnvironment(options.envPath || this._getDefaultEnvPath());
      }

      // 加载默认配置
      if (options.defaultConfig) {
        this.setDefault(options.defaultConfig);
      }

      this.isInitialized = true;
      this.logger.info('配置管理器初始化完成');
      return this;
    } catch (error) {
      this.logger.error('配置管理器初始化失败', { error });
      throw new AppError('配置管理器初始化失败', 500, error);
    }
  }

  /**
   * 从环境变量加载配置
   * @param {string} envPath - .env文件路径
   * @returns {Promise<ConfigurationManager>} 配置管理器实例
   */
  async loadFromEnvironment(envPath = null) {
    try {
      // 尝试加载.env文件
      let result = null;
      if (envPath && await this._fileExists(envPath)) {
        result = dotenv.config({ path: envPath });
      } else {
        // 尝试查找默认路径
        const defaultPath = this._getDefaultEnvPath();
        if (await this._fileExists(defaultPath)) {
          result = dotenv.config({ path: defaultPath });
        }
      }

      if (result && result.error) {
        this.logger.warn('加载.env文件时发生警告', { error: result.error.message });
      }

      // 处理所有环境变量
      const config = {};
      for (const [key, value] of Object.entries(process.env)) {
        config[key] = value;
      }

      // 解析嵌套配置
      const parsedConfig = this._parseNestedConfig(config);
      this._mergeConfig(parsedConfig, ConfigSourceType.ENV);
      
      this.logger.debug('环境变量配置已加载');
      return this;
    } catch (error) {
      this.logger.error('加载环境变量失败', { error });
      throw new AppError('加载环境变量失败', 500, error);
    }
  }

  /**
   * 从JSON文件加载配置
   * @param {string} filePath - JSON文件路径
   * @returns {Promise<ConfigurationManager>} 配置管理器实例
   */
  async loadFromJson(filePath) {
    try {
      const configPath = this._resolvePath(filePath);
      const content = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(content);
      
      this._mergeConfig(config, ConfigSourceType.JSON, configPath);
      this.logger.debug(`JSON配置已从${filePath}加载`);
      return this;
    } catch (error) {
      this.logger.error(`加载JSON配置文件失败: ${filePath}`, { error });
      throw new AppError(`加载JSON配置文件失败: ${filePath}`, 500, error);
    }
  }

  /**
   * 从JavaScript文件加载配置
   * @param {string} filePath - JavaScript文件路径
   * @returns {Promise<ConfigurationManager>} 配置管理器实例
   */
  async loadFromJs(filePath) {
    try {
      const configPath = this._resolvePath(filePath);
      const configModule = require(configPath);
      const config = typeof configModule === 'function' ? configModule() : configModule;
      
      this._mergeConfig(config, ConfigSourceType.JS, configPath);
      this.logger.debug(`JavaScript配置已从${filePath}加载`);
      return this;
    } catch (error) {
      this.logger.error(`加载JavaScript配置文件失败: ${filePath}`, { error });
      throw new AppError(`加载JavaScript配置文件失败: ${filePath}`, 500, error);
    }
  }

  /**
   * 从对象加载配置
   * @param {Object} config - 配置对象
   * @param {string} source - 配置源标识
   * @returns {ConfigurationManager} 配置管理器实例
   */
  loadFromObject(config, source = ConfigSourceType.MEMORY) {
    this._mergeConfig(config, source);
    this.logger.debug('对象配置已加载');
    return this;
  }

  /**
   * 设置默认配置值
   * @param {Object} defaults - 默认配置对象
   * @returns {ConfigurationManager} 配置管理器实例
   */
  setDefault(defaults) {
    this._flattenConfig(defaults).forEach((value, key) => {
      this.defaultValues.set(key, value);
    });
    
    this.logger.debug('默认配置已设置');
    return this;
  }

  /**
   * 设置配置项
   * @param {string} key - 配置键（支持点分隔）
   * @param {*} value - 配置值
   * @param {string} source - 配置源
   * @returns {ConfigurationManager} 配置管理器实例
   */
  set(key, value, source = ConfigSourceType.MEMORY) {
    const oldValue = this.get(key);
    
    // 验证配置值
    if (this.validationRules.has(key)) {
      const rules = this.validationRules.get(key);
      this.validator.validate(value, rules, `配置项: ${key}`);
    }

    // 设置配置值
    this.configValues.set(key, value);
    
    // 记录配置源
    const sourceInfo = this.configSources.get(source) || new Set();
    sourceInfo.add(key);
    this.configSources.set(source, sourceInfo);

    // 通知变更
    if (oldValue !== value) {
      this._notifyWatchers(key, oldValue, value);
    }

    this.logger.debug(`配置项已设置: ${key}`);
    return this;
  }

  /**
   * 获取配置项
   * @param {string} key - 配置键（支持点分隔）
   * @param {*} defaultValue - 默认值
   * @returns {*} 配置值
   */
  get(key, defaultValue = undefined) {
    // 优先从配置值中获取
    if (this.configValues.has(key)) {
      return this.configValues.get(key);
    }

    // 尝试从默认值中获取
    if (this.defaultValues.has(key)) {
      return this.defaultValues.get(key);
    }

    // 尝试解析嵌套路径
    const value = this._getValueByPath(key);
    if (value !== undefined) {
      return value;
    }

    // 返回提供的默认值
    return defaultValue;
  }

  /**
   * 检查配置项是否存在
   * @param {string} key - 配置键
   * @returns {boolean} 是否存在
   */
  has(key) {
    return this.configValues.has(key) || 
           this.defaultValues.has(key) || 
           this._getValueByPath(key) !== undefined;
  }

  /**
   * 删除配置项
   * @param {string} key - 配置键
   * @returns {boolean} 是否删除成功
   */
  delete(key) {
    if (!this.configValues.has(key)) {
      return false;
    }

    const oldValue = this.configValues.get(key);
    this.configValues.delete(key);

    // 从配置源中移除
    for (const [source, keys] of this.configSources.entries()) {
      keys.delete(key);
      if (keys.size === 0) {
        this.configSources.delete(source);
      }
    }

    // 通知变更
    this._notifyWatchers(key, oldValue, undefined);
    
    this.logger.debug(`配置项已删除: ${key}`);
    return true;
  }

  /**
   * 清除所有配置
   * @returns {ConfigurationManager} 配置管理器实例
   */
  clear() {
    this.configValues.clear();
    this.configSources.clear();
    this.logger.info('所有配置已清除');
    return this;
  }

  /**
   * 获取所有配置项
   * @returns {Object} 配置对象
   */
  getAll() {
    const result = {};
    
    // 合并所有配置值
    for (const [key, value] of this.configValues.entries()) {
      this._setNestedValue(result, key, value);
    }

    // 合并默认值（不覆盖已有值）
    for (const [key, value] of this.defaultValues.entries()) {
      if (!this._hasPath(result, key)) {
        this._setNestedValue(result, key, value);
      }
    }

    return result;
  }

  /**
   * 设置配置验证规则
   * @param {string|Object} keyOrRules - 配置键或规则对象
   * @param {Object} rules - 验证规则
   * @returns {ConfigurationManager} 配置管理器实例
   */
  setValidation(keyOrRules, rules = null) {
    if (typeof keyOrRules === 'string' && rules) {
      this.validationRules.set(keyOrRules, rules);
    } else if (typeof keyOrRules === 'object') {
      for (const [key, rule] of Object.entries(keyOrRules)) {
        this.validationRules.set(key, rule);
      }
    }
    
    this.logger.debug('配置验证规则已设置');
    return this;
  }

  /**
   * 验证所有配置
   * @returns {Promise<boolean>} 是否验证通过
   */
  async validateAll() {
    const errors = [];

    // 验证所有配置项
    for (const [key, value] of this.configValues.entries()) {
      if (this.validationRules.has(key)) {
        try {
          const rules = this.validationRules.get(key);
          this.validator.validate(value, rules, `配置项: ${key}`);
        } catch (error) {
          errors.push({ key, error: error.message });
        }
      }
    }

    // 检查必需的配置项
    for (const [key, rules] of this.validationRules.entries()) {
      if (rules.required && !this.has(key)) {
        errors.push({ key, error: `必需的配置项缺失: ${key}` });
      }
    }

    if (errors.length > 0) {
      this.logger.error('配置验证失败', { errors });
      throw new AppError('配置验证失败', 400, { errors });
    }

    this.logger.debug('配置验证通过');
    return true;
  }

  /**
   * 监听配置变更
   * @param {string|Array<string>} keys - 要监听的配置键
   * @param {Function} callback - 回调函数 (key, oldValue, newValue) => void
   * @returns {Function} 取消监听的函数
   */
  watch(keys, callback) {
    const keysArray = Array.isArray(keys) ? keys : [keys];
    const watcher = { keys: keysArray, callback };
    
    this.watchers.add(watcher);
    
    // 返回取消监听的函数
    return () => {
      this.watchers.delete(watcher);
      this.logger.debug(`取消配置监听: ${keysArray.join(', ')}`);
    };
  }

  /**
   * 获取配置源信息
   * @param {string} key - 配置键
   * @returns {string|null} 配置源
   */
  getSource(key) {
    for (const [source, keys] of this.configSources.entries()) {
      if (keys.has(key)) {
        return source;
      }
    }
    return null;
  }

  /**
   * 导出配置到文件
   * @param {string} filePath - 导出文件路径
   * @param {Object} options - 导出选项
   * @returns {Promise<ConfigurationManager>} 配置管理器实例
   */
  async exportToFile(filePath, options = {}) {
    const config = this.getAll();
    const fileContent = options.format === 'json' 
      ? JSON.stringify(config, null, options.indent || 2)
      : `module.exports = ${JSON.stringify(config, null, options.indent || 2)}`;
    
    const exportPath = this._resolvePath(filePath);
    await fs.writeFile(exportPath, fileContent, 'utf-8');
    
    this.logger.debug(`配置已导出到: ${filePath}`);
    return this;
  }

  /**
   * 合并配置
   * @private
   * @param {Object} config - 配置对象
   * @param {string} source - 配置源
   * @param {string} sourcePath - 源文件路径（可选）
   */
  _mergeConfig(config, source, sourcePath = null) {
    const flattened = this._flattenConfig(config);
    
    for (const [key, value] of flattened.entries()) {
      this.set(key, value, sourcePath || source);
    }
  }

  /**
   * 扁平化配置对象
   * @private
   * @param {Object} config - 配置对象
   * @param {string} prefix - 前缀
   * @returns {Map<string, *>} 扁平化的配置映射
   */
  _flattenConfig(config, prefix = '') {
    const result = new Map();
    
    for (const [key, value] of Object.entries(config)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const nested = this._flattenConfig(value, fullKey);
        nested.forEach((nestedValue, nestedKey) => {
          result.set(nestedKey, nestedValue);
        });
      } else {
        result.set(fullKey, value);
      }
    }
    
    return result;
  }

  /**
   * 通过点分隔路径获取值
   * @private
   * @param {string} path - 点分隔的路径
   * @returns {*} 值
   */
  _getValueByPath(path) {
    const parts = path.split('.');
    let value = this.getAll();
    
    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  /**
   * 设置嵌套值
   * @private
   * @param {Object} obj - 对象
   * @param {string} path - 点分隔的路径
   * @param {*} value - 值
   */
  _setNestedValue(obj, path, value) {
    const parts = path.split('.');
    let current = obj;
    
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current[part]) {
        current[part] = {};
      }
      current = current[part];
    }
    
    current[parts[parts.length - 1]] = value;
  }

  /**
   * 检查对象是否有指定路径
   * @private
   * @param {Object} obj - 对象
   * @param {string} path - 点分隔的路径
   * @returns {boolean} 是否存在
   */
  _hasPath(obj, path) {
    const parts = path.split('.');
    let current = obj;
    
    for (const part of parts) {
      if (!current || typeof current !== 'object' || !(part in current)) {
        return false;
      }
      current = current[part];
    }
    
    return true;
  }

  /**
   * 解析嵌套配置（从环境变量等）
   * @private
   * @param {Object} config - 配置对象
   * @returns {Object} 解析后的配置
   */
  _parseNestedConfig(config) {
    const result = {};
    
    for (const [key, value] of Object.entries(config)) {
      // 支持使用下划线或点分隔的嵌套配置
      const normalizedKey = key.replace(/_/g, '.').toLowerCase();
      this._setNestedValue(result, normalizedKey, value);
      
      // 保留原始键名
      result[key] = value;
    }
    
    return result;
  }

  /**
   * 通知配置监听器
   * @private
   * @param {string} key - 配置键
   * @param {*} oldValue - 旧值
   * @param {*} newValue - 新值
   */
  _notifyWatchers(key, oldValue, newValue) {
    this.watchers.forEach(watcher => {
      if (watcher.keys.includes(key) || watcher.keys.includes('*')) {
        try {
          watcher.callback(key, oldValue, newValue);
        } catch (error) {
          this.logger.error(`配置变更监听器执行失败: ${key}`, { error });
        }
      }
    });
  }

  /**
   * 获取默认的.env文件路径
   * @private
   * @returns {string} .env文件路径
   */
  _getDefaultEnvPath() {
    const env = process.env.NODE_ENV || 'development';
    const possiblePaths = [
      path.join(this.basePath, `.env.${env}`),
      path.join(this.basePath, '.env')
    ];
    
    // 返回第一个存在的路径
    for (const envPath of possiblePaths) {
      if (this._fileExistsSync(envPath)) {
        return envPath;
      }
    }
    
    return path.join(this.basePath, '.env');
  }

  /**
   * 解析文件路径
   * @private
   * @param {string} filePath - 文件路径
   * @returns {string} 绝对路径
   */
  _resolvePath(filePath) {
    return path.isAbsolute(filePath) ? filePath : path.join(this.basePath, filePath);
  }

  /**
   * 检查文件是否存在（异步）
   * @private
   * @param {string} filePath - 文件路径
   * @returns {Promise<boolean>} 是否存在
   */
  async _fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 检查文件是否存在（同步）
   * @private
   * @param {string} filePath - 文件路径
   * @returns {boolean} 是否存在
   */
  _fileExistsSync(filePath) {
    try {
      fs.accessSync(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

// 创建全局配置管理器实例
const globalConfigManager = new ConfigurationManager();

module.exports = {
  ConfigurationManager,
  ConfigSourceType,
  globalConfigManager
};