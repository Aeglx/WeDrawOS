/**
 * 数据转换器
 * 提供数据格式转换和规范化功能
 */

const logger = require('../../utils/logger');
const { AppError } = require('../../exception/handlers/errorHandler');
const { TransformationError } = require('../../exception/handlers/errorHandler');

/**
 * 转换方向
 */
const TransformDirection = {
  TO_DATABASE: 'toDatabase',
  FROM_DATABASE: 'fromDatabase',
  TO_API: 'toApi',
  FROM_API: 'fromApi',
  TO_EXTERNAL: 'toExternal',
  FROM_EXTERNAL: 'fromExternal'
};

/**
 * 数据转换器
 */
class DataTransformer {
  /**
   * 构造函数
   * @param {Object} options - 转换器选项
   */
  constructor(options = {}) {
    this.options = {
      defaultFormat: 'snake_case',
      apiFormat: 'camelCase',
      dateFormat: 'YYYY-MM-DD',
      dateTimeFormat: 'YYYY-MM-DD HH:mm:ss',
      timeZone: 'UTC',
      trimStrings: true,
      nullToUndefined: false,
      undefinedToNull: true,
      stringifyObjects: false,
      parseNumbers: true,
      ...options
    };

    this.transformers = new Map();
    this.propertyMaps = new Map();
    
    logger.debug('数据转换器初始化完成', { options: this.options });
  }

  /**
   * 注册数据转换器
   * @param {string} name - 转换器名称
   * @param {Function} transformer - 转换函数
   * @returns {DataTransformer} 当前实例，支持链式调用
   */
  registerTransformer(name, transformer) {
    if (!name || typeof name !== 'string') {
      throw new AppError('转换器名称必须是有效的字符串', {
        code: 'INVALID_TRANSFORMER_NAME',
        status: 400
      });
    }

    if (typeof transformer !== 'function') {
      throw new AppError('转换函数必须是有效的函数', {
        code: 'INVALID_TRANSFORMER_FUNCTION',
        status: 400
      });
    }

    this.transformers.set(name, transformer);
    logger.debug(`数据转换器注册成功: ${name}`);
    
    return this;
  }

  /**
   * 注册属性映射
   * @param {string} mappingName - 映射名称
   * @param {Object} mapping - 属性映射定义
   * @returns {DataTransformer} 当前实例，支持链式调用
   */
  registerPropertyMap(mappingName, mapping) {
    if (!mappingName || typeof mappingName !== 'string') {
      throw new AppError('映射名称必须是有效的字符串', {
        code: 'INVALID_MAPPING_NAME',
        status: 400
      });
    }

    if (!mapping || typeof mapping !== 'object') {
      throw new AppError('属性映射必须是有效的对象', {
        code: 'INVALID_PROPERTY_MAPPING',
        status: 400
      });
    }

    this.propertyMaps.set(mappingName, mapping);
    logger.debug(`属性映射注册成功: ${mappingName}`);
    
    return this;
  }

  /**
   * 转换单个对象
   * @param {Object} data - 待转换的数据对象
   * @param {Object} options - 转换选项
   * @returns {Promise<Object>} 转换后的数据对象
   */
  async transform(data, options = {}) {
    if (!data || typeof data !== 'object') {
      return data;
    }

    // 合并转换选项
    const transformOptions = {
      ...this.options,
      ...options
    };

    // 根据数据类型进行转换
    if (Array.isArray(data)) {
      return await this.transformArray(data, transformOptions);
    }

    // 处理null值
    if (data === null) {
      return transformOptions.nullToUndefined ? undefined : null;
    }

    try {
      // 检查是否有自定义转换函数
      if (transformOptions.transformer) {
        const customTransformer = typeof transformOptions.transformer === 'function' 
          ? transformOptions.transformer
          : this.transformers.get(transformOptions.transformer);

        if (customTransformer) {
          return await customTransformer(data, transformOptions);
        }
      }

      // 转换对象
      const result = await this._transformObject(data, transformOptions);
      logger.debug('数据对象转换完成', { inputKeys: Object.keys(data), outputKeys: Object.keys(result) });
      
      return result;
    } catch (error) {
      logger.error('数据转换失败', { error: error.message });
      throw new TransformationError('数据转换失败', error);
    }
  }

  /**
   * 转换数组
   * @param {Array} data - 待转换的数据数组
   * @param {Object} options - 转换选项
   * @returns {Promise<Array>} 转换后的数据数组
   */
  async transformArray(data, options = {}) {
    if (!Array.isArray(data)) {
      throw new AppError('数据必须是数组', {
        code: 'INVALID_ARRAY_DATA',
        status: 400
      });
    }

    const result = [];
    
    for (const item of data) {
      result.push(await this.transform(item, options));
    }

    logger.debug(`数据数组转换完成，共 ${data.length} 项`);
    return result;
  }

  /**
   * 转换对象属性
   * @private
   * @param {Object} data - 待转换的数据对象
   * @param {Object} options - 转换选项
   * @returns {Promise<Object>} 转换后的数据对象
   */
  async _transformObject(data, options) {
    const result = {};
    
    // 获取属性映射
    const propertyMap = this._getPropertyMap(options.mapping);
    
    // 遍历所有属性
    for (const [key, value] of Object.entries(data)) {
      // 应用属性映射
      const mappedKey = this._getMappedKey(key, propertyMap, options.direction);
      
      // 转换值
      const transformedValue = await this._transformValue(value, options);
      
      // 设置转换后的属性
      result[mappedKey] = transformedValue;
    }

    // 应用属性名格式转换
    if (options.format) {
      return this._formatPropertyNames(result, options.format);
    }

    return result;
  }

  /**
   * 转换单个值
   * @private
   * @param {*} value - 待转换的值
   * @param {Object} options - 转换选项
   * @returns {Promise<*>} 转换后的值
   */
  async _transformValue(value, options) {
    // 处理undefined
    if (value === undefined) {
      return options.undefinedToNull ? null : undefined;
    }

    // 处理null
    if (value === null) {
      return options.nullToUndefined ? undefined : null;
    }

    // 处理字符串
    if (typeof value === 'string') {
      let result = value;
      
      // 去除首尾空格
      if (options.trimStrings) {
        result = result.trim();
      }
      
      // 空字符串转换
      if (result === '' && options.emptyStringToNull) {
        return null;
      }
      
      // 解析数字
      if (options.parseNumbers && /^\d+(\.\d+)?$/.test(result)) {
        return Number(result);
      }
      
      // 解析JSON
      if (options.parseJson && this._isJsonString(result)) {
        try {
          return JSON.parse(result);
        } catch (error) {
          // JSON解析失败，保持原样
        }
      }
      
      return result;
    }

    // 处理数字
    if (typeof value === 'number') {
      // 处理NaN和Infinity
      if (!isFinite(value)) {
        return options.invalidNumberToNull ? null : value;
      }
      
      return value;
    }

    // 处理布尔值
    if (typeof value === 'boolean') {
      return value;
    }

    // 处理日期
    if (value instanceof Date) {
      return this._formatDate(value, options);
    }

    // 处理数组
    if (Array.isArray(value)) {
      return await this.transformArray(value, options);
    }

    // 处理对象
    if (typeof value === 'object') {
      // 字符串化对象
      if (options.stringifyObjects && !options.recursive) {
        try {
          return JSON.stringify(value);
        } catch (error) {
          logger.warn('对象字符串化失败', { error: error.message });
          return value;
        }
      }
      
      // 递归转换对象
      if (options.recursive !== false) {
        return await this._transformObject(value, options);
      }
      
      return value;
    }

    return value;
  }

  /**
   * 获取属性映射
   * @private
   * @param {string|Object} mapping - 映射名称或映射对象
   * @returns {Object} 属性映射
   */
  _getPropertyMap(mapping) {
    if (!mapping) return {};
    
    if (typeof mapping === 'string') {
      return this.propertyMaps.get(mapping) || {};
    }
    
    return mapping || {};
  }

  /**
   * 获取映射后的键名
   * @private
   * @param {string} key - 原始键名
   * @param {Object} propertyMap - 属性映射
   * @param {string} direction - 转换方向
   * @returns {string} 映射后的键名
   */
  _getMappedKey(key, propertyMap, direction) {
    if (!propertyMap || !direction) return key;
    
    // 根据转换方向获取映射
    const directionMap = propertyMap[direction];
    if (directionMap && directionMap[key] !== undefined) {
      return directionMap[key];
    }
    
    // 检查双向映射
    if (propertyMap[key] !== undefined) {
      return propertyMap[key];
    }
    
    return key;
  }

  /**
   * 格式化属性名
   * @private
   * @param {Object} data - 数据对象
   * @param {string} format - 目标格式
   * @returns {Object} 格式化后的数据对象
   */
  _formatPropertyNames(data, format) {
    const result = {};
    
    for (const [key, value] of Object.entries(data)) {
      let newKey = key;
      
      switch (format) {
        case 'camelCase':
          newKey = this._toCamelCase(key);
          break;
        case 'snake_case':
          newKey = this._toSnakeCase(key);
          break;
        case 'kebab-case':
          newKey = this._toKebabCase(key);
          break;
        case 'PascalCase':
          newKey = this._toPascalCase(key);
          break;
        case 'UPPER_CASE':
          newKey = key.toUpperCase();
          break;
        case 'lower_case':
          newKey = key.toLowerCase();
          break;
        default:
          newKey = key;
      }
      
      result[newKey] = value;
    }
    
    return result;
  }

  /**
   * 格式化日期
   * @private
   * @param {Date} date - 日期对象
   * @param {Object} options - 格式化选项
   * @returns {string|Date} 格式化后的日期
   */
  _formatDate(date, options) {
    if (!options.formatDates) {
      return date;
    }
    
    // 这里可以集成日期格式化库，现在使用简单的格式化
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    switch (options.dateTimeFormat) {
      case 'ISO':
        return date.toISOString();
      case 'YYYY-MM-DD HH:mm:ss':
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`;
      case 'MM/DD/YYYY':
        return `${month}/${day}/${year}`;
      case 'DD/MM/YYYY':
        return `${day}/${month}/${year}`;
      default:
        return date.toISOString();
    }
  }

  /**
   * 检查字符串是否为有效的JSON
   * @private
   * @param {string} str - 待检查的字符串
   * @returns {boolean} 是否为有效的JSON
   */
  _isJsonString(str) {
    try {
      JSON.parse(str);
      return true;
    } catch (error) {
      return false;
    }
  }

  // ===== 字符串格式转换方法 =====

  /**
   * 转换为驼峰命名法
   * @private
   * @param {string} str - 待转换的字符串
   * @returns {string} 转换后的字符串
   */
  _toCamelCase(str) {
    return str.replace(/[-_]([a-z])/g, (g) => g[1].toUpperCase())
      .replace(/^([A-Z])/, (g) => g.toLowerCase());
  }

  /**
   * 转换为蛇形命名法
   * @private
   * @param {string} str - 待转换的字符串
   * @returns {string} 转换后的字符串
   */
  _toSnakeCase(str) {
    return str.replace(/[A-Z]/g, (g) => `_${g.toLowerCase()}`)
      .replace(/[- ]/g, '_')
      .replace(/^_/, '');
  }

  /**
   * 转换为短横线命名法
   * @private
   * @param {string} str - 待转换的字符串
   * @returns {string} 转换后的字符串
   */
  _toKebabCase(str) {
    return str.replace(/[A-Z]/g, (g) => `-${g.toLowerCase()}`)
      .replace(/[_ ]/g, '-')
      .replace(/^-/, '');
  }

  /**
   * 转换为帕斯卡命名法
   * @private
   * @param {string} str - 待转换的字符串
   * @returns {string} 转换后的字符串
   */
  _toPascalCase(str) {
    const camelCase = this._toCamelCase(str);
    return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
  }

  /**
   * 转换为数据库格式
   * @param {Object|Array} data - 待转换的数据
   * @param {Object} options - 转换选项
   * @returns {Promise<Object|Array>} 转换后的数据
   */
  async toDatabase(data, options = {}) {
    return await this.transform(data, {
      ...options,
      direction: TransformDirection.TO_DATABASE,
      format: options.format || this.options.defaultFormat
    });
  }

  /**
   * 从数据库格式转换
   * @param {Object|Array} data - 待转换的数据
   * @param {Object} options - 转换选项
   * @returns {Promise<Object|Array>} 转换后的数据
   */
  async fromDatabase(data, options = {}) {
    return await this.transform(data, {
      ...options,
      direction: TransformDirection.FROM_DATABASE,
      format: options.format || this.options.apiFormat
    });
  }

  /**
   * 转换为API格式
   * @param {Object|Array} data - 待转换的数据
   * @param {Object} options - 转换选项
   * @returns {Promise<Object|Array>} 转换后的数据
   */
  async toApi(data, options = {}) {
    return await this.transform(data, {
      ...options,
      direction: TransformDirection.TO_API,
      format: options.format || this.options.apiFormat
    });
  }

  /**
   * 从API格式转换
   * @param {Object|Array} data - 待转换的数据
   * @param {Object} options - 转换选项
   * @returns {Promise<Object|Array>} 转换后的数据
   */
  async fromApi(data, options = {}) {
    return await this.transform(data, {
      ...options,
      direction: TransformDirection.FROM_API,
      format: options.format || this.options.defaultFormat
    });
  }

  /**
   * 过滤数据对象的属性
   * @param {Object} data - 数据对象
   * @param {Array<string>} allowedFields - 允许的字段列表
   * @returns {Object} 过滤后的数据对象
   */
  filterFields(data, allowedFields) {
    if (!data || typeof data !== 'object' || data === null) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.filterFields(item, allowedFields));
    }

    const result = {};
    
    for (const field of allowedFields) {
      if (data.hasOwnProperty(field)) {
        result[field] = data[field];
      }
    }

    return result;
  }

  /**
   * 排除数据对象的属性
   * @param {Object} data - 数据对象
   * @param {Array<string>} excludedFields - 排除的字段列表
   * @returns {Object} 排除后的数据对象
   */
  excludeFields(data, excludedFields) {
    if (!data || typeof data !== 'object' || data === null) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.excludeFields(item, excludedFields));
    }

    const result = { ...data };
    
    for (const field of excludedFields) {
      delete result[field];
    }

    return result;
  }

  /**
   * 合并多个数据对象
   * @param {...Object} objects - 待合并的对象
   * @returns {Object} 合并后的对象
   */
  mergeObjects(...objects) {
    return objects.reduce((result, obj) => {
      if (!obj || typeof obj !== 'object') return result;
      
      for (const [key, value] of Object.entries(obj)) {
        // 如果是嵌套对象，递归合并
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          result[key] = this.mergeObjects(result[key] || {}, value);
        } else {
          result[key] = value;
        }
      }
      
      return result;
    }, {});
  }

  /**
   * 规范化数据
   * @param {Object|Array} data - 待规范化的数据
   * @param {Object} schema - 规范化模式
   * @returns {Promise<Object|Array>} 规范化后的数据
   */
  async normalize(data, schema) {
    if (!schema || typeof schema !== 'object') {
      return data;
    }

    if (Array.isArray(data)) {
      return await Promise.all(data.map(item => this.normalize(item, schema)));
    }

    if (!data || typeof data !== 'object') {
      return data;
    }

    const result = {};
    
    for (const [field, definition] of Object.entries(schema)) {
      const sourceField = definition.source || field;
      let value = data[sourceField];
      
      // 应用默认值
      if (value === undefined && definition.default !== undefined) {
        value = definition.default;
      }
      
      // 应用类型转换
      if (value !== undefined && definition.type) {
        value = this._castType(value, definition.type);
      }
      
      // 应用转换函数
      if (value !== undefined && definition.transform) {
        const transformer = typeof definition.transform === 'function' 
          ? definition.transform
          : this.transformers.get(definition.transform);
        
        if (transformer) {
          value = await transformer(value, definition.options || {});
        }
      }
      
      // 应用嵌套规范化
      if (value !== undefined && definition.schema) {
        value = await this.normalize(value, definition.schema);
      }
      
      result[field] = value;
    }
    
    return result;
  }

  /**
   * 类型转换
   * @private
   * @param {*} value - 待转换的值
   * @param {string} type - 目标类型
   * @returns {*} 转换后的值
   */
  _castType(value, type) {
    switch (type.toLowerCase()) {
      case 'string':
        return String(value);
      case 'number':
        return Number(value);
      case 'boolean':
        return Boolean(value);
      case 'integer':
        return parseInt(value, 10);
      case 'float':
      case 'double':
        return parseFloat(value);
      case 'date':
        return new Date(value);
      case 'array':
        return Array.isArray(value) ? value : [value];
      case 'object':
        if (typeof value === 'string' && this._isJsonString(value)) {
          return JSON.parse(value);
        }
        return typeof value === 'object' ? value : {};
      case 'null':
        return null;
      default:
        return value;
    }
  }

  /**
   * 创建数据转换器实例
   * @param {Object} options - 转换器选项
   * @returns {DataTransformer} 数据转换器实例
   */
  static create(options = {}) {
    return new DataTransformer(options);
  }

  /**
   * 获取转换方向枚举
   * @returns {Object} 转换方向枚举
   */
  static getTransformDirection() {
    return { ...TransformDirection };
  }
}

module.exports = {
  DataTransformer,
  TransformDirection
};