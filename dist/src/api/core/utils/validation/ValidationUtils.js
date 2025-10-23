/**
 * 数据验证工具
 * 提供数据验证和模式检查功能
 */

const { typeUtils } = require('../type');
const { stringUtils } = require('../string');
const { logger } = require('../logger');

/**
 * 验证规则类型枚举
 */
const ValidationRuleType = {
  REQUIRED: 'required',           // 必填
  TYPE: 'type',                   // 类型
  MIN: 'min',                     // 最小值
  MAX: 'max',                     // 最大值
  LENGTH: 'length',               // 长度
  MIN_LENGTH: 'minLength',        // 最小长度
  MAX_LENGTH: 'maxLength',        // 最大长度
  PATTERN: 'pattern',             // 正则表达式
  EMAIL: 'email',                 // 邮箱格式
  URL: 'url',                     // URL格式
  DATE: 'date',                   // 日期格式
  TIME: 'time',                   // 时间格式
  DATETIME: 'datetime',           // 日期时间格式
  BEFORE: 'before',               // 早于某个日期
  AFTER: 'after',                 // 晚于某个日期
  IN: 'in',                       // 在数组中
  NOT_IN: 'notIn',                // 不在数组中
  EQUAL: 'equal',                 // 等于某个值
  NOT_EQUAL: 'notEqual',          // 不等于某个值
  CONTAINS: 'contains',           // 包含某个值
  NOT_CONTAINS: 'notContains',    // 不包含某个值
  CUSTOM: 'custom',               // 自定义验证器
  ALPHA: 'alpha',                 // 字母
  ALPHA_NUMERIC: 'alphaNumeric',  // 字母数字
  NUMERIC: 'numeric',             // 数字
  INTEGER: 'integer',             // 整数
  FLOAT: 'float',                 // 浮点数
  BOOLEAN: 'boolean',             // 布尔值
  ARRAY: 'array',                 // 数组
  OBJECT: 'object',               // 对象
  UUID: 'uuid',                   // UUID
  CREDIT_CARD: 'creditCard',      // 信用卡号
  PHONE: 'phone',                 // 电话号码
  POSTAL_CODE: 'postalCode',      // 邮政编码
  IP: 'ip',                       // IP地址
  IPV4: 'ipv4',                   // IPv4地址
  IPV6: 'ipv6',                   // IPv6地址
  JSON: 'json',                   // JSON格式
  BASE64: 'base64',               // Base64编码
  LATITUDE: 'latitude',           // 纬度
  LONGITUDE: 'longitude',         // 经度
  MAC_ADDRESS: 'macAddress',      // MAC地址
  PORT: 'port'                    // 端口号
};

/**
 * 数据验证工具类
 * 提供数据验证、模式检查和数据清理功能
 */
class ValidationUtils {
  /**
   * 构造函数
   */
  constructor() {
    this._validators = {};
    this._sanitizers = {};
    this._messages = {};
    
    // 初始化默认验证器
    this.initializeValidators();
    // 初始化默认清理器
    this.initializeSanitizers();
    // 初始化默认错误消息
    this.initializeMessages();
  }

  /**
   * 初始化默认验证器
   * @private
   */
  initializeValidators() {
    // 必填验证器
    this.registerValidator(ValidationRuleType.REQUIRED, (value, options) => {
      return value !== undefined && value !== null && value !== '';
    });

    // 类型验证器
    this.registerValidator(ValidationRuleType.TYPE, (value, type) => {
      if (value === undefined || value === null) return true;
      return typeUtils.getType(value) === type;
    });

    // 最小值验证器
    this.registerValidator(ValidationRuleType.MIN, (value, min) => {
      if (value === undefined || value === null) return true;
      if (typeof value === 'string' || Array.isArray(value)) {
        return value.length >= min;
      }
      return value >= min;
    });

    // 最大值验证器
    this.registerValidator(ValidationRuleType.MAX, (value, max) => {
      if (value === undefined || value === null) return true;
      if (typeof value === 'string' || Array.isArray(value)) {
        return value.length <= max;
      }
      return value <= max;
    });

    // 邮箱验证器
    this.registerValidator(ValidationRuleType.EMAIL, (value) => {
      if (value === undefined || value === null) return true;
      return stringUtils.isEmail(value);
    });

    // URL验证器
    this.registerValidator(ValidationRuleType.URL, (value) => {
      if (value === undefined || value === null) return true;
      return stringUtils.isUrl(value);
    });

    // 正则表达式验证器
    this.registerValidator(ValidationRuleType.PATTERN, (value, pattern) => {
      if (value === undefined || value === null) return true;
      return new RegExp(pattern).test(value);
    });

    // 字母验证器
    this.registerValidator(ValidationRuleType.ALPHA, (value) => {
      if (value === undefined || value === null) return true;
      return /^[a-zA-Z]+$/.test(value);
    });

    // 字母数字验证器
    this.registerValidator(ValidationRuleType.ALPHA_NUMERIC, (value) => {
      if (value === undefined || value === null) return true;
      return /^[a-zA-Z0-9]+$/.test(value);
    });

    // 数字验证器
    this.registerValidator(ValidationRuleType.NUMERIC, (value) => {
      if (value === undefined || value === null) return true;
      return /^-?\d+(\.\d+)?$/.test(value);
    });

    // 整数验证器
    this.registerValidator(ValidationRuleType.INTEGER, (value) => {
      if (value === undefined || value === null) return true;
      return Number.isInteger(Number(value));
    });

    // 浮点数验证器
    this.registerValidator(ValidationRuleType.FLOAT, (value) => {
      if (value === undefined || value === null) return true;
      return !Number.isNaN(parseFloat(value)) && Number.isFinite(value);
    });

    // 布尔值验证器
    this.registerValidator(ValidationRuleType.BOOLEAN, (value) => {
      if (value === undefined || value === null) return true;
      return typeof value === 'boolean' || ['true', 'false', '1', '0'].includes(value.toString().toLowerCase());
    });

    // 数组验证器
    this.registerValidator(ValidationRuleType.ARRAY, (value) => {
      if (value === undefined || value === null) return true;
      return Array.isArray(value);
    });

    // 对象验证器
    this.registerValidator(ValidationRuleType.OBJECT, (value) => {
      if (value === undefined || value === null) return true;
      return typeUtils.isObject(value) && !Array.isArray(value);
    });

    // 在数组中验证器
    this.registerValidator(ValidationRuleType.IN, (value, array) => {
      if (value === undefined || value === null) return true;
      return array.includes(value);
    });

    // 不在数组中验证器
    this.registerValidator(ValidationRuleType.NOT_IN, (value, array) => {
      if (value === undefined || value === null) return true;
      return !array.includes(value);
    });

    // 等于验证器
    this.registerValidator(ValidationRuleType.EQUAL, (value, target) => {
      if (value === undefined || value === null) return true;
      return value === target;
    });

    // 不等于验证器
    this.registerValidator(ValidationRuleType.NOT_EQUAL, (value, target) => {
      if (value === undefined || value === null) return true;
      return value !== target;
    });

    // UUID验证器
    this.registerValidator(ValidationRuleType.UUID, (value) => {
      if (value === undefined || value === null) return true;
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
    });

    // IP地址验证器
    this.registerValidator(ValidationRuleType.IP, (value) => {
      if (value === undefined || value === null) return true;
      return this.validateIpAddress(value);
    });

    // IPv4地址验证器
    this.registerValidator(ValidationRuleType.IPV4, (value) => {
      if (value === undefined || value === null) return true;
      return /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(value);
    });

    // IPv6地址验证器
    this.registerValidator(ValidationRuleType.IPV6, (value) => {
      if (value === undefined || value === null) return true;
      return /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/.test(value);
    });

    // 日期验证器
    this.registerValidator(ValidationRuleType.DATE, (value) => {
      if (value === undefined || value === null) return true;
      const date = new Date(value);
      return date instanceof Date && !isNaN(date);
    });

    // 端口号验证器
    this.registerValidator(ValidationRuleType.PORT, (value) => {
      if (value === undefined || value === null) return true;
      const port = parseInt(value, 10);
      return Number.isInteger(port) && port >= 1 && port <= 65535;
    });
  }

  /**
   * 初始化默认清理器
   * @private
   */
  initializeSanitizers() {
    // 修剪字符串
    this.registerSanitizer('trim', (value) => {
      return typeof value === 'string' ? value.trim() : value;
    });

    // 转小写
    this.registerSanitizer('toLowerCase', (value) => {
      return typeof value === 'string' ? value.toLowerCase() : value;
    });

    // 转大写
    this.registerSanitizer('toUpperCase', (value) => {
      return typeof value === 'string' ? value.toUpperCase() : value;
    });

    // 转整数
    this.registerSanitizer('toInt', (value) => {
      return parseInt(value, 10);
    });

    // 转浮点数
    this.registerSanitizer('toFloat', (value) => {
      return parseFloat(value);
    });

    // 转布尔值
    this.registerSanitizer('toBoolean', (value) => {
      if (typeof value === 'boolean') return value;
      const truthyValues = ['true', '1', 'yes', 'on'];
      const falsyValues = ['false', '0', 'no', 'off'];
      
      if (typeof value === 'string') {
        const lowerValue = value.toLowerCase();
        if (truthyValues.includes(lowerValue)) return true;
        if (falsyValues.includes(lowerValue)) return false;
      }
      
      return !!value;
    });

    // 移除HTML标签
    this.registerSanitizer('stripHtml', (value) => {
      return typeof value === 'string' ? value.replace(/<[^>]*>/g, '') : value;
    });

    // 转义HTML
    this.registerSanitizer('escapeHtml', (value) => {
      if (typeof value !== 'string') return value;
      return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    });
  }

  /**
   * 初始化默认错误消息
   * @private
   */
  initializeMessages() {
    this._messages = {
      [ValidationRuleType.REQUIRED]: '此字段是必填的',
      [ValidationRuleType.TYPE]: '类型错误',
      [ValidationRuleType.MIN]: '值必须大于或等于 {value}',
      [ValidationRuleType.MAX]: '值必须小于或等于 {value}',
      [ValidationRuleType.MIN_LENGTH]: '长度必须至少为 {value} 个字符',
      [ValidationRuleType.MAX_LENGTH]: '长度不能超过 {value} 个字符',
      [ValidationRuleType.EMAIL]: '请输入有效的邮箱地址',
      [ValidationRuleType.URL]: '请输入有效的URL',
      [ValidationRuleType.PATTERN]: '格式不匹配',
      [ValidationRuleType.ALPHA]: '只能包含字母',
      [ValidationRuleType.ALPHA_NUMERIC]: '只能包含字母和数字',
      [ValidationRuleType.NUMERIC]: '必须是数字',
      [ValidationRuleType.INTEGER]: '必须是整数',
      [ValidationRuleType.FLOAT]: '必须是浮点数',
      [ValidationRuleType.BOOLEAN]: '必须是布尔值',
      [ValidationRuleType.ARRAY]: '必须是数组',
      [ValidationRuleType.OBJECT]: '必须是对象',
      [ValidationRuleType.IN]: '值必须在允许的列表中',
      [ValidationRuleType.NOT_IN]: '值不在允许的列表中',
      [ValidationRuleType.EQUAL]: '值必须等于 {value}',
      [ValidationRuleType.NOT_EQUAL]: '值不能等于 {value}',
      [ValidationRuleType.UUID]: '请输入有效的UUID',
      [ValidationRuleType.IP]: '请输入有效的IP地址',
      [ValidationRuleType.IPV4]: '请输入有效的IPv4地址',
      [ValidationRuleType.IPV6]: '请输入有效的IPv6地址',
      [ValidationRuleType.DATE]: '请输入有效的日期',
      [ValidationRuleType.PORT]: '请输入有效的端口号（1-65535）'
    };
  }

  /**
   * 注册验证器
   * @param {string} name - 验证器名称
   * @param {Function} validator - 验证函数
   */
  registerValidator(name, validator) {
    this._validators[name] = validator;
  }

  /**
   * 注册清理器
   * @param {string} name - 清理器名称
   * @param {Function} sanitizer - 清理函数
   */
  registerSanitizer(name, sanitizer) {
    this._sanitizers[name] = sanitizer;
  }

  /**
   * 设置错误消息
   * @param {string} rule - 规则名称
   * @param {string} message - 错误消息
   */
  setMessage(rule, message) {
    this._messages[rule] = message;
  }

  /**
   * 获取错误消息
   * @param {string} rule - 规则名称
   * @param {*} value - 规则值
   * @returns {string} 错误消息
   */
  getMessage(rule, value) {
    let message = this._messages[rule] || `验证失败: ${rule}`;
    return message.replace(/\{value\}/g, value);
  }

  /**
   * 验证IP地址
   * @param {string} ip - IP地址
   * @returns {boolean} 是否有效
   * @private
   */
  validateIpAddress(ip) {
    return this._validators.ipv4(ip) || this._validators.ipv6(ip);
  }

  /**
   * 验证单个值
   * @param {*} value - 要验证的值
   * @param {Object|Array} rules - 验证规则
   * @returns {Array<string>} 错误消息数组
   */
  validateValue(value, rules) {
    const errors = [];

    // 处理规则数组
    if (Array.isArray(rules)) {
      rules.forEach(rule => {
        if (typeof rule === 'string') {
          this._validateSingleRule(value, rule, undefined, errors);
        } else if (typeUtils.isObject(rule)) {
          Object.entries(rule).forEach(([ruleName, ruleValue]) => {
            this._validateSingleRule(value, ruleName, ruleValue, errors);
          });
        }
      });
    } 
    // 处理规则对象
    else if (typeUtils.isObject(rules)) {
      Object.entries(rules).forEach(([ruleName, ruleValue]) => {
        this._validateSingleRule(value, ruleName, ruleValue, errors);
      });
    }

    return errors;
  }

  /**
   * 验证单个规则
   * @param {*} value - 要验证的值
   * @param {string} ruleName - 规则名称
   * @param {*} ruleValue - 规则值
   * @param {Array} errors - 错误消息数组
   * @private
   */
  _validateSingleRule(value, ruleName, ruleValue, errors) {
    // 处理简写规则（如 required, email）
    if (ruleValue === true || ruleName === ruleValue) {
      ruleValue = undefined;
    }

    // 检查验证器是否存在
    if (!this._validators[ruleName]) {
      logger.warn(`未知的验证规则: ${ruleName}`);
      return;
    }

    // 执行验证
    const isValid = this._validators[ruleName](value, ruleValue);
    if (!isValid) {
      errors.push(this.getMessage(ruleName, ruleValue));
    }
  }

  /**
   * 验证对象
   * @param {Object} data - 要验证的数据对象
   * @param {Object} schema - 验证模式
   * @returns {Object} 验证结果 { isValid, errors, data }
   */
  validate(data, schema) {
    const errors = {};
    const isValid = true;

    // 遍历模式中的所有字段
    Object.entries(schema).forEach(([fieldName, fieldRules]) => {
      const fieldValue = data[fieldName];
      const fieldErrors = this.validateValue(fieldValue, fieldRules);

      if (fieldErrors.length > 0) {
        errors[fieldName] = fieldErrors;
      }
    });

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      data
    };
  }

  /**
   * 清理数据
   * @param {*} data - 要清理的数据
   * @param {Array<string>|Object} sanitizers - 清理器列表或映射
   * @returns {*} 清理后的数据
   */
  sanitize(data, sanitizers) {
    // 如果是清理器数组
    if (Array.isArray(sanitizers)) {
      return sanitizers.reduce((value, sanitizerName) => {
        const sanitizer = this._sanitizers[sanitizerName];
        if (sanitizer) {
          return sanitizer(value);
        }
        return value;
      }, data);
    }

    // 如果是对象，递归清理
    if (typeUtils.isObject(data) && !Array.isArray(data) && data !== null) {
      const result = {};
      Object.entries(data).forEach(([key, value]) => {
        if (sanitizers[key]) {
          result[key] = this.sanitize(value, sanitizers[key]);
        } else {
          result[key] = value;
        }
      });
      return result;
    }

    return data;
  }

  /**
   * 验证并清理数据
   * @param {Object} data - 要验证和清理的数据
   * @param {Object} schema - 验证模式
   * @param {Object} sanitizers - 清理器映射
   * @returns {Object} 结果 { isValid, errors, data }
   */
  validateAndSanitize(data, schema, sanitizers = {}) {
    // 先验证
    const validationResult = this.validate(data, schema);
    
    // 如果验证通过，进行清理
    if (validationResult.isValid && Object.keys(sanitizers).length > 0) {
      validationResult.data = this.sanitize(data, sanitizers);
    }

    return validationResult;
  }

  /**
   * 创建自定义验证器
   * @param {Function} validatorFn - 验证函数
   * @param {string} message - 错误消息
   * @returns {Object} 验证器配置
   */
  createCustomValidator(validatorFn, message = '自定义验证失败') {
    const name = `custom_${Date.now()}`;
    this.registerValidator(name, validatorFn);
    this.setMessage(name, message);
    
    return { [name]: true };
  }

  /**
   * 验证密码强度
   * @param {string} password - 密码
   * @param {Object} options - 选项
   * @returns {Object} 验证结果 { isValid, strength, errors }
   */
  validatePassword(password, options = {}) {
    const defaults = {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumber: true,
      requireSpecialChar: true
    };

    const config = { ...defaults, ...options };
    const errors = [];
    let strength = 0;

    // 最小长度
    if (password.length < config.minLength) {
      errors.push(`密码长度必须至少为 ${config.minLength} 个字符`);
    } else {
      strength++;
    }

    // 大写字母
    if (config.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('密码必须包含至少一个大写字母');
    } else if (config.requireUppercase) {
      strength++;
    }

    // 小写字母
    if (config.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('密码必须包含至少一个小写字母');
    } else if (config.requireLowercase) {
      strength++;
    }

    // 数字
    if (config.requireNumber && !/[0-9]/.test(password)) {
      errors.push('密码必须包含至少一个数字');
    } else if (config.requireNumber) {
      strength++;
    }

    // 特殊字符
    if (config.requireSpecialChar && !/[^A-Za-z0-9]/.test(password)) {
      errors.push('密码必须包含至少一个特殊字符');
    } else if (config.requireSpecialChar) {
      strength++;
    }

    // 计算密码强度级别
    const strengthLevel = ['弱', '中低', '中', '中高', '强', '非常强'][strength] || '未知';

    return {
      isValid: errors.length === 0,
      strength: strengthLevel,
      errors
    };
  }

  /**
   * 验证JSON
   * @param {string} jsonString - JSON字符串
   * @returns {Object} 验证结果 { isValid, data, error }
   */
  validateJson(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      return {
        isValid: true,
        data,
        error: null
      };
    } catch (error) {
      return {
        isValid: false,
        data: null,
        error: error.message
      };
    }
  }

  /**
   * 创建Express验证中间件
   * @param {Object} schema - 验证模式
   * @param {Object} options - 选项
   * @returns {Function} Express中间件
   */
  createExpressValidator(schema, options = {}) {
    const { sanitizers = {}, source = 'body' } = options;

    return (req, res, next) => {
      const data = req[source];
      const result = this.validateAndSanitize(data, schema, sanitizers);

      if (!result.isValid) {
        return res.status(400).json({
          error: 'validation_error',
          errors: result.errors,
          message: '请求数据验证失败'
        });
      }

      // 更新请求对象中的数据
      req[source] = result.data;
      next();
    };
  }

  /**
   * 静态实例
   * @private
   */
  static _instance = null;

  /**
   * 获取单例实例
   * @returns {ValidationUtils} 验证工具实例
   */
  static getInstance() {
    if (!ValidationUtils._instance) {
      ValidationUtils._instance = new ValidationUtils();
    }
    return ValidationUtils._instance;
  }

  /**
   * 创建新的验证工具实例
   * @returns {ValidationUtils} 验证工具实例
   */
  static create() {
    return new ValidationUtils();
  }
}

// 导出常量
module.exports.ValidationRuleType = ValidationRuleType;

// 创建默认实例
const defaultValidationUtils = ValidationUtils.getInstance();

module.exports = {
  ValidationUtils,
  validationUtils: defaultValidationUtils
};