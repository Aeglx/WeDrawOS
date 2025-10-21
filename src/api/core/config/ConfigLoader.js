/**
 * 配置加载器
 * 提供多环境配置管理、配置验证和动态配置更新功能
 */

const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');
const { AppError } = require('../exception/handlers/errorHandler');
const { DataValidator } = require('../validation/DataValidator');
const { CommonUtils } = require('../utils/CommonUtils');

/**
 * 配置源类型枚举
 */
enum ConfigSource {
  ENVIRONMENT = 'environment',
  FILE = 'file',
  DEFAULT = 'default',
  RUNTIME = 'runtime'
}

/**
 * 配置加载器
 */
class ConfigLoader {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   */
  constructor(options = {}) {
    this.options = {
      configDir: path.join(process.cwd(), 'config'),
      env: process.env.NODE_ENV || 'development',
      validateSchema: true,
      watchConfigChanges: false,
      ...options
    };

    // 存储配置
    this.config = {};
    // 存储配置源信息
    this.configSources = {};
    // 存储配置验证规则
    this.validationRules = {};
    // 存储配置变更监听器
    this.listeners = new Map();
    // 存储配置文件监控器
    this.watchers = new Map();

    // 初始化
    this._init();

    logger.info('配置加载器初始化完成', { env: this.options.env });
  }

  /**
   * 初始化配置加载器
   * @private
   */
  _init() {
    // 加载默认配置
    this._loadDefaultConfig();

    // 根据环境加载配置文件
    this._loadConfigFromFiles();

    // 从环境变量加载配置
    this._loadConfigFromEnvironment();

    // 验证配置
    if (this.options.validateSchema) {
      this._validateConfig();
    }

    // 监控配置文件变化
    if (this.options.watchConfigChanges) {
      this._watchConfigFiles();
    }
  }

  /**
   * 加载默认配置
   * @private
   */
  _loadDefaultConfig() {
    const defaultConfig = {
      server: {
        port: 3000,
        host: '0.0.0.0',
        timeout: 30000
      },
      database: {
        host: 'localhost',
        port: 3306,
        username: 'root',
        password: '',
        database: 'app_db',
        pool: {
          min: 2,
          max: 10,
          acquireTimeoutMillis: 30000
        }
      },
      security: {
        jwt: {
          secret: 'default_secret_key',
          expiresIn: '1h',
          refreshTokenExpiresIn: '7d'
        },
        password: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumber: true,
          requireSpecialChar: true
        }
      },
      logging: {
        level: 'info',
        format: 'json',
        file: null
      },
      cache: {
        enabled: true,
        ttl: 3600,
        maxKeys: 10000
      },
      cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
      }
    };

    this._mergeConfig(defaultConfig, ConfigSource.DEFAULT);
  }

  /**
   * 从配置文件加载配置
   * @private
   */
  async _loadConfigFromFiles() {
    try {
      // 确保配置目录存在
      const configDirExists = await CommonUtils.directoryExists(this.options.configDir);
      if (!configDirExists) {
        logger.warn(`配置目录不存在: ${this.options.configDir}`);
        return;
      }

      // 加载基础配置
      await this._loadConfigFile('config.js');
      await this._loadConfigFile('config.json');

      // 加载环境特定配置
      await this._loadConfigFile(`config.${this.options.env}.js`);
      await this._loadConfigFile(`config.${this.options.env}.json`);

    } catch (error) {
      logger.error('从文件加载配置失败', { error });
    }
  }

  /**
   * 加载单个配置文件
   * @private
   * @param {string} fileName - 文件名
   */
  async _loadConfigFile(fileName) {
    try {
      const filePath = path.join(this.options.configDir, fileName);
      const fileExists = await CommonUtils.fileExists(filePath);
      
      if (!fileExists) {
        return;
      }

      let configData;
      
      if (fileName.endsWith('.js')) {
        // 清除缓存并重新加载JS文件
        delete require.cache[require.resolve(filePath)];
        configData = require(filePath);
      } else if (fileName.endsWith('.json')) {
        // 读取JSON文件
        const fileContent = await fs.readFile(filePath, 'utf8');
        configData = JSON.parse(fileContent);
      }

      if (configData && typeof configData === 'object') {
        this._mergeConfig(configData, ConfigSource.FILE, fileName);
        logger.info(`配置文件加载成功: ${fileName}`);
      }
    } catch (error) {
      logger.error(`加载配置文件失败: ${fileName}`, { error });
    }
  }

  /**
   * 从环境变量加载配置
   * @private
   */
  _loadConfigFromEnvironment() {
    try {
      const envConfig = {};
      
      // 解析环境变量
      for (const [key, value] of Object.entries(process.env)) {
        // 支持两种格式: NODE_ENV 或 APP__SERVER__PORT
        if (key.startsWith('APP__')) {
          const configPath = key.substring(5).toLowerCase().split('__');
          CommonUtils.setNestedProperty(envConfig, configPath, this._parseEnvValue(value));
        }
      }

      if (Object.keys(envConfig).length > 0) {
        this._mergeConfig(envConfig, ConfigSource.ENVIRONMENT);
        logger.info('环境变量配置加载成功');
      }
    } catch (error) {
      logger.error('从环境变量加载配置失败', { error });
    }
  }

  /**
   * 解析环境变量值
   * @private
   * @param {string} value - 环境变量值
   * @returns {any} 解析后的值
   */
  _parseEnvValue(value) {
    // 尝试解析为数字
    if (!isNaN(value) && value !== '') {
      return Number(value);
    }

    // 尝试解析为布尔值
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;

    // 尝试解析为JSON
    try {
      return JSON.parse(value);
    } catch (e) {
      // 如果不是JSON，返回原始字符串
      return value;
    }
  }

  /**
   * 合并配置
   * @private
   * @param {Object} sourceConfig - 源配置
   * @param {ConfigSource} source - 配置源
   * @param {string} sourceName - 源名称
   */
  _mergeConfig(sourceConfig, source, sourceName = null) {
    // 深度合并配置
    this.config = CommonUtils.deepMerge(this.config, sourceConfig);
    
    // 记录配置源
    for (const key of Object.keys(sourceConfig)) {
      const fullPath = this._getConfigPathFromObject(sourceConfig, key);
      fullPath.forEach(path => {
        this.configSources[path] = { source, sourceName };
      });
    }
  }

  /**
   * 获取配置路径
   * @private
   * @param {Object} obj - 配置对象
   * @param {string} prefix - 前缀路径
   * @returns {Array<string>} 配置路径数组
   */
  _getConfigPathFromObject(obj, prefix = '') {
    const paths = [];
    
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'object' && value !== null) {
        paths.push(...this._getConfigPathFromObject(value, currentPath));
      } else {
        paths.push(currentPath);
      }
    }
    
    return paths;
  }

  /**
   * 验证配置
   * @private
   */
  _validateConfig() {
    try {
      const validator = new DataValidator();
      const validationResult = validator.validate(this.config, this.validationRules);
      
      if (!validationResult.isValid) {
        logger.error('配置验证失败', { errors: validationResult.errors });
        throw new AppError('配置验证失败', 500, validationResult.errors);
      }
      
      logger.info('配置验证通过');
    } catch (error) {
      logger.error('配置验证过程出错', { error });
      if (!(error instanceof AppError)) {
        throw new AppError('配置验证错误', 500, error);
      }
      throw error;
    }
  }

  /**
   * 监控配置文件变化
   * @private
   */
  async _watchConfigFiles() {
    try {
      const watchFile = async (fileName) => {
        const filePath = path.join(this.options.configDir, fileName);
        const fileExists = await CommonUtils.fileExists(filePath);
        
        if (!fileExists) {
          return;
        }

        // 使用fs.watch监控文件变化
        fs.watch(filePath, { persistent: true }, async (eventType) => {
          if (eventType === 'change') {
            logger.info(`配置文件已更改: ${fileName}`);
            await this._loadConfigFile(fileName);
            this._notifyConfigChange(fileName);
          }
        });

        this.watchers.set(fileName, filePath);
      };

      // 监控所有配置文件
      await watchFile('config.js');
      await watchFile('config.json');
      await watchFile(`config.${this.options.env}.js`);
      await watchFile(`config.${this.options.env}.json`);

      logger.info('配置文件监控已启动');
    } catch (error) {
      logger.error('启动配置文件监控失败', { error });
    }
  }

  /**
   * 通知配置变更
   * @private
   * @param {string} source - 变更源
   */
  _notifyConfigChange(source) {
    for (const [key, callbacks] of this.listeners.entries()) {
      if (key === '*' || this._isConfigPathAffected(key)) {
        callbacks.forEach(callback => {
          try {
            callback(this.config, source);
          } catch (error) {
            logger.error('执行配置变更监听器失败', { error, key });
          }
        });
      }
    }
  }

  /**
   * 检查配置路径是否受影响
   * @private
   * @param {string} configPath - 配置路径
   * @returns {boolean} 是否受影响
   */
  _isConfigPathAffected(configPath) {
    // 简单实现：检查配置路径是否存在于当前配置中
    return this.has(configPath);
  }

  /**
   * 获取配置值
   * @param {string} path - 配置路径（如 'server.port'）
   * @param {any} defaultValue - 默认值
   * @returns {any} 配置值
   */
  get(path, defaultValue = undefined) {
    const value = CommonUtils.getNestedProperty(this.config, path);
    return value !== undefined ? value : defaultValue;
  }

  /**
   * 设置配置值
   * @param {string} path - 配置路径
   * @param {any} value - 配置值
   * @returns {ConfigLoader} 实例本身，支持链式调用
   */
  set(path, value) {
    const oldValue = this.get(path);
    
    // 设置配置值
    CommonUtils.setNestedProperty(this.config, path, value);
    
    // 记录配置源
    this.configSources[path] = { source: ConfigSource.RUNTIME, sourceName: 'runtime' };
    
    // 如果值发生变化，通知监听器
    if (oldValue !== value) {
      this._notifyConfigChange('runtime');
    }
    
    return this;
  }

  /**
   * 检查配置是否存在
   * @param {string} path - 配置路径
   * @returns {boolean} 是否存在
   */
  has(path) {
    return CommonUtils.hasNestedProperty(this.config, path);
  }

  /**
   * 删除配置项
   * @param {string} path - 配置路径
   * @returns {boolean} 是否删除成功
   */
  delete(path) {
    if (!this.has(path)) {
      return false;
    }

    // 删除配置值
    CommonUtils.deleteNestedProperty(this.config, path);
    
    // 删除配置源信息
    delete this.configSources[path];
    
    // 通知监听器
    this._notifyConfigChange('runtime');
    
    return true;
  }

  /**
   * 获取所有配置
   * @returns {Object} 完整配置对象
   */
  getAll() {
    return { ...this.config };
  }

  /**
   * 获取配置源信息
   * @param {string} path - 配置路径
   * @returns {Object|null} 配置源信息
   */
  getSource(path) {
    return this.configSources[path] || null;
  }

  /**
   * 设置验证规则
   * @param {Object} rules - 验证规则
   * @returns {ConfigLoader} 实例本身，支持链式调用
   */
  setValidationRules(rules) {
    this.validationRules = rules;
    
    // 立即验证配置
    if (this.options.validateSchema) {
      this._validateConfig();
    }
    
    return this;
  }

  /**
   * 注册配置变更监听器
   * @param {string} path - 配置路径（'*'表示所有变更）
   * @param {Function} callback - 回调函数
   * @returns {ConfigLoader} 实例本身，支持链式调用
   */
  onConfigChange(path, callback) {
    if (!this.listeners.has(path)) {
      this.listeners.set(path, []);
    }
    
    this.listeners.get(path).push(callback);
    return this;
  }

  /**
   * 移除配置变更监听器
   * @param {string} path - 配置路径
   * @param {Function} callback - 回调函数（可选，不提供则移除该路径下所有监听器）
   * @returns {ConfigLoader} 实例本身，支持链式调用
   */
  offConfigChange(path, callback = undefined) {
    if (!this.listeners.has(path)) {
      return this;
    }
    
    if (callback) {
      // 移除特定回调
      const callbacks = this.listeners.get(path);
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
      
      // 如果没有回调了，删除该路径的监听器集合
      if (callbacks.length === 0) {
        this.listeners.delete(path);
      }
    } else {
      // 移除该路径下所有回调
      this.listeners.delete(path);
    }
    
    return this;
  }

  /**
   * 重新加载配置
   * @returns {Promise<ConfigLoader>} 实例本身，支持链式调用
   */
  async reload() {
    try {
      // 重置配置
      this.config = {};
      this.configSources = {};
      
      // 重新加载
      this._init();
      
      logger.info('配置已重新加载');
      
      // 通知所有监听器
      this._notifyConfigChange('reload');
      
      return this;
    } catch (error) {
      logger.error('重新加载配置失败', { error });
      throw new AppError('重新加载配置失败', 500, error);
    }
  }

  /**
   * 导出配置到文件
   * @param {string} filePath - 导出文件路径
   * @param {boolean} pretty - 是否美化输出
   * @returns {Promise<boolean>} 是否导出成功
   */
  async exportConfig(filePath, pretty = true) {
    try {
      const configData = pretty 
        ? JSON.stringify(this.config, null, 2) 
        : JSON.stringify(this.config);
      
      await fs.writeFile(filePath, configData, 'utf8');
      logger.info(`配置已导出到: ${filePath}`);
      return true;
    } catch (error) {
      logger.error('导出配置失败', { error, filePath });
      return false;
    }
  }

  /**
   * 导入配置
   * @param {string} filePath - 导入文件路径
   * @param {boolean} merge - 是否合并到现有配置
   * @returns {Promise<ConfigLoader>} 实例本身，支持链式调用
   */
  async importConfig(filePath, merge = true) {
    try {
      const fileContent = await fs.readFile(filePath, 'utf8');
      const importedConfig = JSON.parse(fileContent);
      
      if (merge) {
        // 合并配置
        this._mergeConfig(importedConfig, ConfigSource.FILE, filePath);
      } else {
        // 替换配置
        this.config = importedConfig;
        this.configSources = {};
        this._mergeConfig(importedConfig, ConfigSource.FILE, filePath);
      }
      
      // 验证配置
      if (this.options.validateSchema) {
        this._validateConfig();
      }
      
      logger.info(`配置已从: ${filePath} 导入`);
      
      // 通知监听器
      this._notifyConfigChange(filePath);
      
      return this;
    } catch (error) {
      logger.error('导入配置失败', { error, filePath });
      throw new AppError('导入配置失败', 500, error);
    }
  }

  /**
   * 获取配置统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    return {
      configCount: Object.keys(this.config).length,
      sourceStats: this._getSourceStats(),
      listenerCount: Array.from(this.listeners.values()).reduce((total, callbacks) => total + callbacks.length, 0),
      watcherCount: this.watchers.size
    };
  }

  /**
   * 获取配置源统计
   * @private
   * @returns {Object} 配置源统计
   */
  _getSourceStats() {
    const stats = {};
    
    // 初始化各源计数
    Object.values(ConfigSource).forEach(source => {
      stats[source] = 0;
    });
    
    // 统计各源配置数量
    Object.values(this.configSources).forEach(sourceInfo => {
      if (stats.hasOwnProperty(sourceInfo.source)) {
        stats[sourceInfo.source]++;
      }
    });
    
    return stats;
  }

  /**
   * 清理资源
   */
  cleanup() {
    // 关闭所有文件监控器
    this.watchers.clear();
    
    // 清除所有监听器
    this.listeners.clear();
    
    logger.info('配置加载器资源已清理');
  }

  /**
   * 获取单例实例
   * @param {Object} options - 配置选项
   * @returns {ConfigLoader} 配置加载器实例
   */
  static getInstance(options = {}) {
    if (!ConfigLoader._instance) {
      ConfigLoader._instance = new ConfigLoader(options);
    }
    return ConfigLoader._instance;
  }
}

// 导出
module.exports = {
  ConfigLoader,
  ConfigSource
};