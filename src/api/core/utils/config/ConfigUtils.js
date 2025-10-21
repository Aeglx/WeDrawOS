/**
 * 配置工具类
 * 提供配置加载、验证、合并、环境变量集成等功能
 */

const fs = require('fs').promises;
const path = require('path');
const dotenv = require('dotenv');
const logger = require('../logger');
const ValidationError = require('../../errors/ValidationError');

/**
 * 配置工具
 */
class ConfigUtils {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   */
  constructor(options = {}) {
    this.options = {
      envPrefix: 'APP_',
      defaultEnv: 'development',
      configDir: './config',
      configFiles: ['default', '{env}', 'local'],
      validationEnabled: true,
      ...options
    };
    
    this.config = {};
    this.schema = null;
    this.env = process.env.NODE_ENV || this.options.defaultEnv;
    this.loaded = false;
    
    logger.debug('创建配置工具实例', { 
      env: this.env,
      configDir: this.options.configDir 
    });
  }
  
  /**
   * 初始化配置
   * @param {Object} options - 初始化选项
   * @returns {Promise<ConfigUtils>} 配置实例
   */
  async initialize(options = {}) {
    if (this.loaded) {
      logger.warn('配置已经初始化');
      return this;
    }
    
    // 合并初始化选项
    this.options = { ...this.options, ...options };
    
    try {
      // 加载环境变量
      await this._loadEnv();
      
      // 加载配置文件
      await this._loadConfigFiles();
      
      // 从环境变量合并配置
      this._mergeEnvConfig();
      
      // 验证配置
      if (this.options.validationEnabled && this.schema) {
        this._validateConfig();
      }
      
      this.loaded = true;
      logger.info('配置初始化成功', { env: this.env });
      
      return this;
    } catch (error) {
      logger.error('配置初始化失败', { error: error.message });
      throw error;
    }
  }
  
  /**
   * 加载环境变量文件
   * @private
   */
  async _loadEnv() {
    // 尝试加载多个.env文件（按优先级）
    const envFiles = [
      '.env',
      `.env.${this.env}`,
      `.env.local`,
      `.env.${this.env}.local`
    ];
    
    for (const envFile of envFiles) {
      try {
        const filePath = path.resolve(process.cwd(), envFile);
        await fs.access(filePath);
        const result = dotenv.config({ path: filePath });
        
        if (!result.error) {
          logger.debug(`加载环境变量文件成功: ${envFile}`);
        }
      } catch (error) {
        // 文件不存在时静默忽略
        if (error.code !== 'ENOENT') {
          logger.warn(`加载环境变量文件失败: ${envFile}`, { error: error.message });
        }
      }
    }
  }
  
  /**
   * 加载配置文件
   * @private
   */
  async _loadConfigFiles() {
    const configDir = path.resolve(process.cwd(), this.options.configDir);
    
    try {
      await fs.access(configDir);
    } catch (error) {
      logger.warn(`配置目录不存在: ${configDir}`);
      return;
    }
    
    // 处理配置文件模板
    const envAwareFiles = this.options.configFiles.map(file => 
      file.replace('{env}', this.env)
    );
    
    for (const fileName of envAwareFiles) {
      await this._loadConfigFile(configDir, fileName);
    }
  }
  
  /**
   * 加载单个配置文件
   * @private
   */
  async _loadConfigFile(configDir, fileName) {
    const extensions = ['js', 'json', 'yaml', 'yml'];
    
    for (const ext of extensions) {
      const filePath = path.join(configDir, `${fileName}.${ext}`);
      
      try {
        await fs.access(filePath);
        
        let configData;
        
        switch (ext) {
          case 'js':
            // 清除模块缓存，确保重新加载
            delete require.cache[require.resolve(filePath)];
            configData = require(filePath);
            break;
            
          case 'json':
            const jsonContent = await fs.readFile(filePath, 'utf8');
            configData = JSON.parse(jsonContent);
            break;
            
          case 'yaml':
          case 'yml':
            // 尝试动态导入yaml解析器
            try {
              const yaml = require('js-yaml');
              const yamlContent = await fs.readFile(filePath, 'utf8');
              configData = yaml.load(yamlContent);
            } catch (e) {
              logger.warn(`需要安装 js-yaml 来解析 YAML 文件: ${filePath}`);
              continue;
            }
            break;
        }
        
        if (configData && typeof configData === 'object') {
          // 深度合并配置
          this.config = this._deepMerge(this.config, configData);
          logger.debug(`加载配置文件成功: ${fileName}.${ext}`);
        }
        
        break; // 找到文件后跳出循环
      } catch (error) {
        if (error.code !== 'ENOENT') {
          logger.error(`加载配置文件失败: ${filePath}`, { error: error.message });
        }
      }
    }
  }
  
  /**
   * 从环境变量合并配置
   * @private
   */
  _mergeEnvConfig() {
    const prefix = this.options.envPrefix;
    const envConfig = {};
    
    Object.keys(process.env).forEach(key => {
      if (key.startsWith(prefix)) {
        // 转换环境变量键为配置路径
        const configKey = key
          .substring(prefix.length)
          .toLowerCase()
          .replace(/_([a-z])/g, (g) => g[1].toUpperCase())
          .replace(/__/g, '.');
        
        // 设置配置值
        this._setValueByPath(envConfig, configKey, this._parseEnvValue(process.env[key]));
      }
    });
    
    // 合并环境变量配置到主配置
    this.config = this._deepMerge(this.config, envConfig);
  }
  
  /**
   * 解析环境变量值
   * @private
   */
  _parseEnvValue(value) {
    // 尝试解析为数字
    if (!isNaN(value) && value !== '') {
      return Number(value);
    }
    
    // 解析布尔值
    const lowerValue = value.toLowerCase();
    if (lowerValue === 'true') return true;
    if (lowerValue === 'false') return false;
    if (lowerValue === 'null') return null;
    if (lowerValue === 'undefined') return undefined;
    
    // 尝试解析JSON
    try {
      if (value.startsWith('[') || value.startsWith('{')) {
        return JSON.parse(value);
      }
    } catch (e) {
      // 不是有效的JSON，保持字符串
    }
    
    return value;
  }
  
  /**
   * 设置配置验证模式
   * @param {Object} schema - 验证模式（Joi或简单对象）
   * @returns {ConfigUtils} 配置实例
   */
  setValidationSchema(schema) {
    this.schema = schema;
    return this;
  }
  
  /**
   * 验证配置
   * @private
   */
  _validateConfig() {
    if (!this.schema) {
      return;
    }
    
    try {
      // 检查是否有Joi可用
      let validateResult;
      
      try {
        const Joi = require('joi');
        if (Joi.isSchema(this.schema)) {
          validateResult = Joi.attempt(this.config, this.schema);
          this.config = validateResult;
          logger.debug('配置验证通过（使用Joi）');
          return;
        }
      } catch (e) {
        // Joi不可用或schema不是Joi模式
      }
      
      // 简单验证实现
      this._simpleValidate(this.config, this.schema);
      logger.debug('配置验证通过（使用简单验证）');
    } catch (error) {
      logger.error('配置验证失败', { error: error.message });
      throw new ValidationError(`配置验证失败: ${error.message}`);
    }
  }
  
  /**
   * 简单配置验证
   * @private
   */
  _simpleValidate(config, schema) {
    Object.keys(schema).forEach(key => {
      const schemaDef = schema[key];
      const configValue = config[key];
      
      // 检查必需字段
      if (schemaDef.required && configValue === undefined) {
        throw new Error(`缺少必需配置: ${key}`);
      }
      
      // 检查类型
      if (configValue !== undefined && schemaDef.type) {
        const expectedType = schemaDef.type;
        const actualType = Array.isArray(configValue) ? 'array' : typeof configValue;
        
        if (actualType !== expectedType) {
          throw new Error(`配置类型错误: ${key} 期望 ${expectedType}，实际 ${actualType}`);
        }
      }
      
      // 递归验证嵌套对象
      if (configValue && typeof configValue === 'object' && !Array.isArray(configValue) &&
          schemaDef.properties) {
        this._simpleValidate(configValue, schemaDef.properties);
      }
    });
  }
  
  /**
   * 获取配置值
   * @param {string} keyPath - 配置键路径（支持点表示法）
   * @param {*} defaultValue - 默认值
   * @returns {*} 配置值
   */
  get(keyPath, defaultValue = undefined) {
    if (!this.loaded) {
      logger.warn('配置未初始化，请先调用initialize方法');
    }
    
    if (!keyPath) {
      return this.config;
    }
    
    const keys = keyPath.split('.');
    let value = this.config;
    
    for (const key of keys) {
      if (value === null || value === undefined || typeof value !== 'object') {
        return defaultValue;
      }
      
      value = value[key];
      
      if (value === undefined) {
        return defaultValue;
      }
    }
    
    return value;
  }
  
  /**
   * 设置配置值
   * @param {string} keyPath - 配置键路径
   * @param {*} value - 配置值
   * @returns {ConfigUtils} 配置实例
   */
  set(keyPath, value) {
    this._setValueByPath(this.config, keyPath, value);
    return this;
  }
  
  /**
   * 根据路径设置值
   * @private
   */
  _setValueByPath(obj, path, value) {
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
  }
  
  /**
   * 检查配置是否存在
   * @param {string} keyPath - 配置键路径
   * @returns {boolean} 是否存在
   */
  has(keyPath) {
    return this.get(keyPath) !== undefined;
  }
  
  /**
   * 获取所有配置
   * @returns {Object} 完整配置对象
   */
  getAll() {
    return { ...this.config };
  }
  
  /**
   * 合并配置
   * @param {Object} config - 要合并的配置
   * @returns {ConfigUtils} 配置实例
   */
  merge(config) {
    this.config = this._deepMerge(this.config, config);
    return this;
  }
  
  /**
   * 深度合并对象
   * @private
   */
  _deepMerge(target, source) {
    if (!source || typeof source !== 'object') {
      return target;
    }
    
    if (!target || typeof target !== 'object') {
      return source;
    }
    
    // 处理数组
    if (Array.isArray(source)) {
      return Array.isArray(target) ? [...target, ...source] : source;
    }
    
    const result = { ...target };
    
    Object.keys(source).forEach(key => {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        // 递归合并嵌套对象
        if (!result[key] || typeof result[key] !== 'object') {
          result[key] = {};
        }
        result[key] = this._deepMerge(result[key], source[key]);
      } else {
        // 直接覆盖
        result[key] = source[key];
      }
    });
    
    return result;
  }
  
  /**
   * 重新加载配置
   * @returns {Promise<ConfigUtils>} 配置实例
   */
  async reload() {
    this.config = {};
    this.loaded = false;
    return this.initialize();
  }
  
  /**
   * 获取当前环境
   * @returns {string} 环境名称
   */
  getEnv() {
    return this.env;
  }
  
  /**
   * 检查是否为开发环境
   * @returns {boolean} 是否为开发环境
   */
  isDevelopment() {
    return this.env === 'development';
  }
  
  /**
   * 检查是否为生产环境
   * @returns {boolean} 是否为生产环境
   */
  isProduction() {
    return this.env === 'production';
  }
  
  /**
   * 检查是否为测试环境
   * @returns {boolean} 是否为测试环境
   */
  isTest() {
    return this.env === 'test';
  }
  
  /**
   * 导出配置为JSON
   * @param {boolean} pretty - 是否美化输出
   * @returns {string} JSON字符串
   */
  toJSON(pretty = false) {
    const indent = pretty ? 2 : 0;
    return JSON.stringify(this.config, null, indent);
  }
  
  /**
   * 保存配置到文件
   * @param {string} filePath - 文件路径
   * @returns {Promise<void>}
   */
  async saveToFile(filePath) {
    const jsonContent = this.toJSON(true);
    await fs.writeFile(filePath, jsonContent, 'utf8');
    logger.info(`配置已保存到: ${filePath}`);
  }
  
  /**
   * 从配置中获取连接字符串
   * @param {string} section - 配置节名称
   * @returns {string} 连接字符串
   */
  getConnectionString(section) {
    const config = this.get(section);
    if (!config) {
      return null;
    }
    
    // 根据配置类型构建连接字符串
    if (config.url) {
      return config.url;
    }
    
    // 数据库连接字符串示例
    if (config.host && config.port && config.database) {
      const userPass = config.username && config.password 
        ? `${config.username}:${config.password}@` 
        : '';
      
      return `${config.protocol || 'http'}://${userPass}${config.host}:${config.port}/${config.database}`;
    }
    
    return null;
  }
  
  /**
   * 获取安全配置（过滤敏感信息）
   * @returns {Object} 过滤后的配置
   */
  getSecureConfig() {
    const secureConfig = { ...this.config };
    
    // 敏感字段列表
    const sensitiveFields = [
      'password', 'secret', 'key', 'token', 'auth', 'credential',
      'private', 'cert', 'passphrase', 'hash'
    ];
    
    const maskSensitive = (obj) => {
      if (!obj || typeof obj !== 'object') {
        return obj;
      }
      
      const masked = Array.isArray(obj) ? [] : {};
      
      Object.keys(obj).forEach(key => {
        const lowerKey = key.toLowerCase();
        const isSensitive = sensitiveFields.some(field => 
          lowerKey.includes(field)
        );
        
        if (isSensitive) {
          masked[key] = '******';
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          masked[key] = maskSensitive(obj[key]);
        } else {
          masked[key] = obj[key];
        }
      });
      
      return masked;
    };
    
    return maskSensitive(secureConfig);
  }
}

// 单例模式
let instance = null;

function getInstance(options = {}) {
  if (!instance) {
    instance = new ConfigUtils(options);
  }
  return instance;
}

module.exports = {
  ConfigUtils,
  getInstance
};