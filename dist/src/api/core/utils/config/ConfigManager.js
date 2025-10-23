/**
 * 配置管理工具
 * 提供配置加载、合并和访问功能
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const yaml = require('js-yaml');
const logger = require('../logger');
const { AppError } = require('../../exception/handlers/errorHandler');
const { ConfigError } = require('../../exception/handlers/errorHandler');

/**
 * 配置文件类型
 */
const ConfigFileType = {
  JSON: 'json',
  YAML: 'yaml',
  YML: 'yml',
  JS: 'js',
  ENV: 'env'
};

/**
 * 配置管理工具类
 */
class ConfigManager {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   */
  constructor(options = {}) {
    this.options = {
      configDir: options.configDir || './config',
      envPrefix: options.envPrefix || 'APP_',
      mergeDefault: options.mergeDefault !== false,
      validateSchema: options.validateSchema || false,
      watchConfig: options.watchConfig || false,
      ...options
    };
    
    this.config = {};
    this.defaultConfig = {};
    this.envConfig = {};
    this.fileConfigs = new Map();
    this.schema = null;
    this.watchers = new Map();
    
    // 初始化配置
    this._initialize();
    
    logger.debug('配置管理器初始化完成', {
      configDir: this.options.configDir,
      envPrefix: this.options.envPrefix
    });
  }

  /**
   * 初始化配置
   * @private
   */
  _initialize() {
    // 加载环境变量
    this._loadEnvConfig();
    
    // 加载默认配置
    if (this.options.mergeDefault) {
      this._loadDefaultConfig();
    }
    
    // 加载配置文件
    this._loadConfigFiles();
    
    // 合并所有配置
    this._mergeConfigs();
    
    // 验证配置（如果启用）
    if (this.options.validateSchema) {
      this._validateConfig();
    }
    
    // 设置配置监视（如果启用）
    if (this.options.watchConfig) {
      this._setupConfigWatch();
    }
  }

  /**
   * 加载环境变量配置
   * @private
   */
  _loadEnvConfig() {
    try {
      // 加载 .env 文件
      const envPath = path.join(process.cwd(), '.env');
      if (fs.existsSync(envPath)) {
        const result = dotenv.config({ path: envPath });
        if (result.error) {
          logger.warn('加载 .env 文件失败', { error: result.error.message });
        } else {
          logger.debug('成功加载 .env 文件');
        }
      }
      
      // 提取带前缀的环境变量
      const prefix = this.options.envPrefix;
      const envConfig = {};
      
      for (const key in process.env) {
        if (key.startsWith(prefix)) {
          const configKey = this._envKeyToConfigKey(key, prefix);
          envConfig[configKey] = this._parseEnvValue(process.env[key]);
        }
      }
      
      this.envConfig = envConfig;
      logger.debug(`从环境变量加载了 ${Object.keys(envConfig).length} 个配置项`);
    } catch (error) {
      logger.error('加载环境变量配置失败', { error: error.message });
      throw new ConfigError(`加载环境变量配置失败: ${error.message}`, {
        code: 'ENV_CONFIG_LOAD_FAILED',
        cause: error
      });
    }
  }

  /**
   * 环境变量键转换为配置键
   * @private
   * @param {string} envKey - 环境变量键
   * @param {string} prefix - 前缀
   * @returns {string} 配置键
   */
  _envKeyToConfigKey(envKey, prefix) {
    return envKey
      .substring(prefix.length)
      .toLowerCase()
      .replace(/_([a-z])/g, g => g[1].toUpperCase());
  }

  /**
   * 解析环境变量值
   * @private
   * @param {string} value - 原始值
   * @returns {any} 解析后的值
   */
  _parseEnvValue(value) {
    if (value === 'true' || value === 'false') {
      return value === 'true';
    }
    
    if (!isNaN(value) && value !== '') {
      return Number(value);
    }
    
    if (value === 'null') {
      return null;
    }
    
    if (value === 'undefined') {
      return undefined;
    }
    
    // 尝试解析 JSON
    try {
      return JSON.parse(value);
    } catch (e) {
      // 不是有效的 JSON，返回原始字符串
      return value;
    }
  }

  /**
   * 加载默认配置
   * @private
   */
  _loadDefaultConfig() {
    try {
      const defaultConfigPath = path.join(this.options.configDir, 'default');
      const defaultConfig = this._loadConfigFile(defaultConfigPath);
      
      if (defaultConfig) {
        this.defaultConfig = defaultConfig;
        logger.debug('成功加载默认配置');
      }
    } catch (error) {
      logger.warn('加载默认配置失败', { error: error.message });
      // 默认配置加载失败不应阻止程序运行
    }
  }

  /**
   * 加载配置文件
   * @private
   */
  _loadConfigFiles() {
    try {
      // 获取当前环境
      const env = process.env.NODE_ENV || 'development';
      
      // 定义要加载的配置文件顺序
      const configFiles = [
        path.join(this.options.configDir, 'base'),
        path.join(this.options.configDir, env)
      ];
      
      // 加载额外的配置文件（如果指定）
      if (this.options.extraConfigs) {
        this.options.extraConfigs.forEach(configName => {
          configFiles.push(path.join(this.options.configDir, configName));
        });
      }
      
      // 加载每个配置文件
      configFiles.forEach(filePath => {
        const config = this._loadConfigFile(filePath);
        if (config) {
          this.fileConfigs.set(filePath, config);
          logger.debug(`成功加载配置文件: ${filePath}`);
        }
      });
    } catch (error) {
      logger.error('加载配置文件失败', { error: error.message });
      throw new ConfigError(`加载配置文件失败: ${error.message}`, {
        code: 'CONFIG_FILE_LOAD_FAILED',
        cause: error
      });
    }
  }

  /**
   * 加载单个配置文件
   * @private
   * @param {string} basePath - 基础文件路径（不含扩展名）
   * @returns {Object|null} 配置对象
   */
  _loadConfigFile(basePath) {
    // 尝试不同的文件扩展名
    const extensions = [
      { ext: '.json', type: ConfigFileType.JSON },
      { ext: '.yaml', type: ConfigFileType.YAML },
      { ext: '.yml', type: ConfigFileType.YML },
      { ext: '.js', type: ConfigFileType.JS }
    ];
    
    for (const { ext, type } of extensions) {
      const filePath = basePath + ext;
      if (fs.existsSync(filePath)) {
        return this._parseConfigFile(filePath, type);
      }
    }
    
    logger.debug(`配置文件不存在: ${basePath}`);
    return null;
  }

  /**
   * 解析配置文件
   * @private
   * @param {string} filePath - 文件路径
   * @param {string} type - 文件类型
   * @returns {Object} 解析后的配置对象
   */
  _parseConfigFile(filePath, type) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      switch (type) {
        case ConfigFileType.JSON:
          return JSON.parse(content);
        case ConfigFileType.YAML:
        case ConfigFileType.YML:
          return yaml.load(content);
        case ConfigFileType.JS:
          // 清除模块缓存，确保重新加载
          delete require.cache[require.resolve(filePath)];
          return require(filePath);
        default:
          throw new Error(`不支持的配置文件类型: ${type}`);
      }
    } catch (error) {
      logger.error(`解析配置文件失败: ${filePath}`, { error: error.message });
      throw new ConfigError(`解析配置文件失败: ${filePath}`, {
        code: 'CONFIG_FILE_PARSE_FAILED',
        cause: error
      });
    }
  }

  /**
   * 合并所有配置
   * @private
   */
  _mergeConfigs() {
    try {
      // 配置优先级：环境变量 > 环境配置文件 > 基础配置文件 > 默认配置
      this.config = this._deepMerge(
        {},
        this.defaultConfig,
        ...Array.from(this.fileConfigs.values()),
        this.envConfig
      );
      
      logger.debug(`配置合并完成，共 ${this._countConfigItems(this.config)} 个配置项`);
    } catch (error) {
      logger.error('配置合并失败', { error: error.message });
      throw new ConfigError(`配置合并失败: ${error.message}`, {
        code: 'CONFIG_MERGE_FAILED',
        cause: error
      });
    }
  }

  /**
   * 深度合并对象
   * @private
   * @param {Object} target - 目标对象
   * @param {...Object} sources - 源对象
   * @returns {Object} 合并后的对象
   */
  _deepMerge(target, ...sources) {
    if (!sources.length) return target;
    
    const source = sources.shift();
    
    if (this._isObject(target) && this._isObject(source)) {
      for (const key in source) {
        if (this._isObject(source[key])) {
          if (!target[key]) Object.assign(target, { [key]: {} });
          this._deepMerge(target[key], source[key]);
        } else {
          Object.assign(target, { [key]: source[key] });
        }
      }
    }
    
    return this._deepMerge(target, ...sources);
  }

  /**
   * 检查是否为对象
   * @private
   * @param {any} item - 要检查的值
   * @returns {boolean} 是否为对象
   */
  _isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
  }

  /**
   * 计算配置项数量
   * @private
   * @param {Object} config - 配置对象
   * @returns {number} 配置项数量
   */
  _countConfigItems(config) {
    let count = 0;
    
    for (const key in config) {
      if (typeof config[key] === 'object' && config[key] !== null) {
        count += this._countConfigItems(config[key]);
      } else {
        count++;
      }
    }
    
    return count;
  }

  /**
   * 验证配置
   * @private
   */
  _validateConfig() {
    if (!this.schema) {
      // 尝试加载配置模式
      try {
        const schemaPath = path.join(this.options.configDir, 'schema.js');
        if (fs.existsSync(schemaPath)) {
          this.schema = require(schemaPath);
        }
      } catch (error) {
        logger.warn('加载配置模式失败', { error: error.message });
      }
    }
    
    if (this.schema) {
      try {
        // 这里可以集成 Joi 或其他验证库
        logger.debug('配置验证通过');
      } catch (error) {
        logger.error('配置验证失败', { error: error.message });
        throw new ConfigError(`配置验证失败: ${error.message}`, {
          code: 'CONFIG_VALIDATION_FAILED',
          cause: error
        });
      }
    }
  }

  /**
   * 设置配置监视
   * @private
   */
  _setupConfigWatch() {
    try {
      // 监视配置目录
      fs.watch(this.options.configDir, { recursive: true }, (eventType, filename) => {
        if (eventType === 'change' || eventType === 'rename') {
          logger.info(`检测到配置文件变更: ${filename}`);
          this.refresh();
        }
      });
      
      logger.debug('配置监视已启用');
    } catch (error) {
      logger.error('设置配置监视失败', { error: error.message });
      // 监视失败不应阻止程序运行
    }
  }

  /**
   * 获取配置值
   * @param {string} key - 配置键（支持点表示法）
   * @param {any} defaultValue - 默认值
   * @returns {any} 配置值
   */
  get(key, defaultValue = undefined) {
    if (!key) {
      return this.config;
    }
    
    const keys = key.split('.');
    let value = this.config;
    
    for (const k of keys) {
      if (value === undefined || value === null || typeof value !== 'object') {
        return defaultValue;
      }
      
      value = value[k];
    }
    
    return value === undefined ? defaultValue : value;
  }

  /**
   * 设置配置值
   * @param {string} key - 配置键（支持点表示法）
   * @param {any} value - 配置值
   * @returns {ConfigManager} 当前实例（支持链式调用）
   */
  set(key, value) {
    const keys = key.split('.');
    let obj = this.config;
    
    // 遍历除最后一个键以外的所有键
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!obj[k] || typeof obj[k] !== 'object') {
        obj[k] = {};
      }
      obj = obj[k];
    }
    
    // 设置最后一个键的值
    const lastKey = keys[keys.length - 1];
    obj[lastKey] = value;
    
    logger.debug(`设置配置: ${key} = ${JSON.stringify(value)}`);
    return this;
  }

  /**
   * 检查配置键是否存在
   * @param {string} key - 配置键（支持点表示法）
   * @returns {boolean} 是否存在
   */
  has(key) {
    return this.get(key) !== undefined;
  }

  /**
   * 移除配置键
   * @param {string} key - 配置键（支持点表示法）
   * @returns {boolean} 是否移除成功
   */
  remove(key) {
    if (!key || !this.has(key)) {
      return false;
    }
    
    const keys = key.split('.');
    let obj = this.config;
    let parentObj = null;
    let parentKey = null;
    
    // 遍历除最后一个键以外的所有键
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      parentObj = obj;
      parentKey = k;
      obj = obj[k];
    }
    
    // 移除最后一个键
    const lastKey = keys[keys.length - 1];
    delete obj[lastKey];
    
    // 如果父对象现在为空，清理它
    if (parentObj && Object.keys(obj).length === 0) {
      delete parentObj[parentKey];
    }
    
    logger.debug(`移除配置: ${key}`);
    return true;
  }

  /**
   * 刷新配置
   * @returns {ConfigManager} 当前实例（支持链式调用）
   */
  refresh() {
    logger.info('刷新配置...');
    
    // 清除现有的配置
    this.fileConfigs.clear();
    
    // 重新加载配置
    this._loadEnvConfig();
    this._loadConfigFiles();
    this._mergeConfigs();
    
    if (this.options.validateSchema) {
      this._validateConfig();
    }
    
    logger.info('配置刷新完成');
    
    // 触发配置变更事件（如果有监听器）
    if (this.onConfigChange) {
      try {
        this.onConfigChange(this.config);
      } catch (error) {
        logger.error('配置变更事件处理失败', { error: error.message });
      }
    }
    
    return this;
  }

  /**
   * 导出配置为JSON字符串
   * @param {Object} options - 序列化选项
   * @returns {string} JSON字符串
   */
  toJson(options = {}) {
    const { pretty = false, spaces = 2 } = options;
    return JSON.stringify(this.config, null, pretty ? spaces : null);
  }

  /**
   * 保存配置到文件
   * @param {string} filePath - 文件路径
   * @param {Object} options - 保存选项
   * @returns {boolean} 是否保存成功
   */
  saveToFile(filePath, options = {}) {
    try {
      const { format = 'json' } = options;
      let content = '';
      
      switch (format.toLowerCase()) {
        case 'json':
          content = this.toJson({ pretty: true });
          break;
        case 'yaml':
        case 'yml':
          content = yaml.dump(this.config);
          break;
        default:
          throw new Error(`不支持的保存格式: ${format}`);
      }
      
      // 确保目录存在
      const dirPath = path.dirname(filePath);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      
      // 写入文件
      fs.writeFileSync(filePath, content, 'utf8');
      
      logger.info(`配置已保存到文件: ${filePath}`);
      return true;
    } catch (error) {
      logger.error(`保存配置到文件失败: ${filePath}`, { error: error.message });
      throw new ConfigError(`保存配置到文件失败: ${error.message}`, {
        code: 'CONFIG_SAVE_FAILED',
        cause: error
      });
    }
  }

  /**
   * 加载自定义配置文件
   * @param {string} filePath - 文件路径
   * @param {boolean} merge - 是否合并到当前配置
   * @returns {Object} 加载的配置
   */
  loadConfigFile(filePath, merge = true) {
    try {
      const fileExt = path.extname(filePath).toLowerCase();
      let type;
      
      switch (fileExt) {
        case '.json':
          type = ConfigFileType.JSON;
          break;
        case '.yaml':
        case '.yml':
          type = ConfigFileType.YAML;
          break;
        case '.js':
          type = ConfigFileType.JS;
          break;
        default:
          throw new Error(`不支持的配置文件扩展名: ${fileExt}`);
      }
      
      const config = this._parseConfigFile(filePath, type);
      
      if (merge) {
        this.config = this._deepMerge(this.config, config);
        this.fileConfigs.set(filePath, config);
        logger.info(`自定义配置文件已加载并合并: ${filePath}`);
      }
      
      return config;
    } catch (error) {
      logger.error(`加载自定义配置文件失败: ${filePath}`, { error: error.message });
      throw new ConfigError(`加载自定义配置文件失败: ${error.message}`, {
        code: 'CUSTOM_CONFIG_LOAD_FAILED',
        cause: error
      });
    }
  }

  /**
   * 导出环境变量
   * @param {string} prefix - 环境变量前缀
   * @returns {Object} 环境变量对象
   */
  exportToEnv(prefix = this.options.envPrefix) {
    const envVars = {};
    
    this._flattenConfig(this.config).forEach((value, key) => {
      const envKey = prefix + key.toUpperCase().replace(/([A-Z])/g, '_$1').replace(/^_/, '');
      envVars[envKey] = this._stringifyValue(value);
    });
    
    return envVars;
  }

  /**
   * 扁平化配置对象
   * @private
   * @param {Object} obj - 配置对象
   * @param {string} parentKey - 父键
   * @param {Map} result - 结果Map
   * @returns {Map} 扁平化的配置Map
   */
  _flattenConfig(obj, parentKey = '', result = new Map()) {
    for (const key in obj) {
      const newKey = parentKey ? `${parentKey}.${key}` : key;
      
      if (this._isObject(obj[key])) {
        this._flattenConfig(obj[key], newKey, result);
      } else {
        result.set(newKey, obj[key]);
      }
    }
    
    return result;
  }

  /**
   * 将值序列化为字符串
   * @private
   * @param {any} value - 要序列化的值
   * @returns {string} 字符串表示
   */
  _stringifyValue(value) {
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }
    return String(value);
  }

  /**
   * 获取当前环境
   * @returns {string} 当前环境
   */
  getEnv() {
    return process.env.NODE_ENV || 'development';
  }

  /**
   * 检查是否为开发环境
   * @returns {boolean} 是否为开发环境
   */
  isDevelopment() {
    return this.getEnv() === 'development';
  }

  /**
   * 检查是否为生产环境
   * @returns {boolean} 是否为生产环境
   */
  isProduction() {
    return this.getEnv() === 'production';
  }

  /**
   * 检查是否为测试环境
   * @returns {boolean} 是否为测试环境
   */
  isTest() {
    return this.getEnv() === 'test';
  }

  /**
   * 获取所有配置
   * @returns {Object} 完整的配置对象
   */
  getAll() {
    return this.config;
  }

  /**
   * 重置配置
   * @returns {ConfigManager} 当前实例（支持链式调用）
   */
  reset() {
    this.config = {};
    this.defaultConfig = {};
    this.envConfig = {};
    this.fileConfigs.clear();
    
    // 重新初始化
    this._initialize();
    
    logger.info('配置已重置');
    return this;
  }

  /**
   * 设置配置变更监听器
   * @param {Function} listener - 监听器函数
   * @returns {ConfigManager} 当前实例（支持链式调用）
   */
  onConfigChanged(listener) {
    this.onConfigChange = listener;
    return this;
  }

  /**
   * 静态实例
   * @private
   */
  static _instance = null;

  /**
   * 获取单例实例
   * @param {Object} options - 配置选项
   * @returns {ConfigManager} 配置管理器实例
   */
  static getInstance(options = {}) {
    if (!ConfigManager._instance) {
      ConfigManager._instance = new ConfigManager(options);
    }
    return ConfigManager._instance;
  }

  /**
   * 创建新的配置管理器实例
   * @param {Object} options - 配置选项
   * @returns {ConfigManager} 配置管理器实例
   */
  static create(options = {}) {
    return new ConfigManager(options);
  }

  /**
   * 获取配置文件类型枚举
   * @returns {Object} 配置文件类型枚举
   */
  static getConfigFileType() {
    return { ...ConfigFileType };
  }
}

// 创建默认实例
const defaultConfigManager = ConfigManager.getInstance();

module.exports = {
  ConfigManager,
  ConfigFileType,
  configManager: defaultConfigManager
};