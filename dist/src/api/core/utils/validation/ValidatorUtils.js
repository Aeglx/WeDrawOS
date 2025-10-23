/**
 * 验证工具类
 * 提供数据验证、验证规则、自定义验证器等功能
 */

const logger = require('../logger');

/**
 * 验证结果类
 */
class ValidationResult {
  constructor() {
    this.isValid = true;
    this.errors = [];
  }

  /**
   * 添加验证错误
   * @param {string} field - 字段名
   * @param {string} message - 错误消息
   * @param {string} rule - 验证规则名称
   */
  addError(field, message, rule) {
    this.isValid = false;
    this.errors.push({
      field,
      message,
      rule,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 获取错误消息列表
   * @returns {string[]} 错误消息数组
   */
  getErrorMessages() {
    return this.errors.map(error => error.message);
  }

  /**
   * 获取特定字段的错误
   * @param {string} field - 字段名
   * @returns {Array} 该字段的错误数组
   */
  getFieldErrors(field) {
    return this.errors.filter(error => error.field === field);
  }

  /**
   * 合并其他验证结果
   * @param {ValidationResult} otherResult - 其他验证结果
   * @returns {ValidationResult} 合并后的结果
   */
  merge(otherResult) {
    if (!otherResult.isValid) {
      this.isValid = false;
      this.errors = [...this.errors, ...otherResult.errors];
    }
    return this;
  }

  /**
   * 转换为字符串
   * @returns {string} 错误信息字符串
   */
  toString() {
    if (this.isValid) {
      return '验证通过';
    }
    return this.getErrorMessages().join(', ');
  }
}

/**
 * 验证规则类
 */
class ValidationRule {
  constructor(name, validatorFn, message) {
    this.name = name;
    this.validatorFn = validatorFn;
    this.message = message;
  }

  /**
   * 执行验证
   * @param {*} value - 要验证的值
   * @param {Object} options - 验证选项
   * @returns {boolean} 验证是否通过
   */
  validate(value, options = {}) {
    return this.validatorFn(value, options);
  }

  /**
   * 获取错误消息
   * @param {string} field - 字段名
   * @param {Object} options - 验证选项
   * @returns {string} 错误消息
   */
  getErrorMessage(field, options = {}) {
    return typeof this.message === 'function' 
      ? this.message(field, options) 
      : this.message.replace(/\{field\}/g, field);
  }
}

/**
 * 验证工具主类
 */
class ValidatorUtils {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   */
  constructor(options = {}) {
    this.options = options;
    this.rules = new Map();
    this.customValidators = new Map();
    
    // 注册内置验证规则
    this._registerBuiltInRules();
    
    logger.debug('创建验证工具实例');
  }

  /**
   * 注册内置验证规则
   * @private
   */
  _registerBuiltInRules() {
    // 必填规则
    this.registerRule('required', (value) => {
      if (value === null || value === undefined) return false;
      if (typeof value === 'string') return value.trim().length > 0;
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'object') return Object.keys(value).length > 0;
      return true;
    }, '{field} 是必填项');

    // 字符串长度规则
    this.registerRule('length', (value, { min, max }) => {
      if (value === null || value === undefined) return true;
      if (typeof value !== 'string') return false;
      const length = value.trim().length;
      if (min !== undefined && length < min) return false;
      if (max !== undefined && length > max) return false;
      return true;
    }, (field, { min, max }) => {
      if (min !== undefined && max !== undefined) {
        return `${field} 长度必须在 ${min} 到 ${max} 个字符之间`;
      } else if (min !== undefined) {
        return `${field} 长度不能少于 ${min} 个字符`;
      } else if (max !== undefined) {
        return `${field} 长度不能超过 ${max} 个字符`;
      }
      return `${field} 长度无效`;
    });

    // 数值范围规则
    this.registerRule('range', (value, { min, max }) => {
      if (value === null || value === undefined) return true;
      const num = Number(value);
      if (isNaN(num)) return false;
      if (min !== undefined && num < min) return false;
      if (max !== undefined && num > max) return false;
      return true;
    }, (field, { min, max }) => {
      if (min !== undefined && max !== undefined) {
        return `${field} 必须在 ${min} 到 ${max} 之间`;
      } else if (min !== undefined) {
        return `${field} 不能小于 ${min}`;
      } else if (max !== undefined) {
        return `${field} 不能大于 ${max}`;
      }
      return `${field} 范围无效`;
    });

    // 邮箱规则
    this.registerRule('email', (value) => {
      if (value === null || value === undefined) return true;
      if (typeof value !== 'string') return false;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    }, '{field} 必须是有效的邮箱地址');

    // URL规则
    this.registerRule('url', (value) => {
      if (value === null || value === undefined) return true;
      if (typeof value !== 'string') return false;
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    }, '{field} 必须是有效的URL');

    // 数字规则
    this.registerRule('number', (value) => {
      if (value === null || value === undefined) return true;
      return !isNaN(Number(value)) && Number.isFinite(Number(value));
    }, '{field} 必须是数字');

    // 整数规则
    this.registerRule('integer', (value) => {
      if (value === null || value === undefined) return true;
      const num = Number(value);
      return !isNaN(num) && Number.isInteger(num);
    }, '{field} 必须是整数');

    // 浮点数规则
    this.registerRule('float', (value) => {
      if (value === null || value === undefined) return true;
      const num = Number(value);
      return !isNaN(num) && Number.isFinite(num) && !Number.isInteger(num);
    }, '{field} 必须是浮点数');

    // 布尔值规则
    this.registerRule('boolean', (value) => {
      if (value === null || value === undefined) return true;
      return typeof value === 'boolean';
    }, '{field} 必须是布尔值');

    // 字符串规则
    this.registerRule('string', (value) => {
      if (value === null || value === undefined) return true;
      return typeof value === 'string';
    }, '{field} 必须是字符串');

    // 数组规则
    this.registerRule('array', (value) => {
      if (value === null || value === undefined) return true;
      return Array.isArray(value);
    }, '{field} 必须是数组');

    // 对象规则
    this.registerRule('object', (value) => {
      if (value === null || value === undefined) return true;
      return typeof value === 'object' && !Array.isArray(value);
    }, '{field} 必须是对象');

    // 正则表达式规则
    this.registerRule('pattern', (value, { regex }) => {
      if (value === null || value === undefined) return true;
      if (typeof value !== 'string') return false;
      if (!(regex instanceof RegExp)) return false;
      return regex.test(value);
    }, '{field} 格式不正确');

    // 日期规则
    this.registerRule('date', (value) => {
      if (value === null || value === undefined) return true;
      const date = new Date(value);
      return !isNaN(date.getTime());
    }, '{field} 必须是有效的日期');

    // 未来日期规则
    this.registerRule('future', (value) => {
      if (value === null || value === undefined) return true;
      const date = new Date(value);
      return !isNaN(date.getTime()) && date > new Date();
    }, '{field} 必须是未来日期');

    // 过去日期规则
    this.registerRule('past', (value) => {
      if (value === null || value === undefined) return true;
      const date = new Date(value);
      return !isNaN(date.getTime()) && date < new Date();
    }, '{field} 必须是过去日期');

    // 数组长度规则
    this.registerRule('arrayLength', (value, { min, max }) => {
      if (value === null || value === undefined) return true;
      if (!Array.isArray(value)) return false;
      if (min !== undefined && value.length < min) return false;
      if (max !== undefined && value.length > max) return false;
      return true;
    }, (field, { min, max }) => {
      if (min !== undefined && max !== undefined) {
        return `${field} 数组长度必须在 ${min} 到 ${max} 之间`;
      } else if (min !== undefined) {
        return `${field} 数组长度不能少于 ${min} 个元素`;
      } else if (max !== undefined) {
        return `${field} 数组长度不能超过 ${max} 个元素`;
      }
      return `${field} 数组长度无效`;
    });

    // 枚举规则
    this.registerRule('enum', (value, { values }) => {
      if (value === null || value === undefined) return true;
      if (!Array.isArray(values)) return false;
      return values.includes(value);
    }, (field, { values }) => {
      return `${field} 必须是以下值之一: ${values.join(', ')}`;
    });

    // 手机号规则（中国大陆）
    this.registerRule('phoneCN', (value) => {
      if (value === null || value === undefined) return true;
      if (typeof value !== 'string') return false;
      const phoneRegex = /^1[3-9]\d{9}$/;
      return phoneRegex.test(value);
    }, '{field} 必须是有效的中国大陆手机号');

    // 身份证号规则（中国大陆）
    this.registerRule('idCardCN', (value) => {
      if (value === null || value === undefined) return true;
      if (typeof value !== 'string') return false;
      const idCardRegex = /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/;
      return idCardRegex.test(value);
    }, '{field} 必须是有效的中国大陆身份证号');

    // 密码强度规则（至少包含大小写字母和数字，长度8-20）
    this.registerRule('strongPassword', (value) => {
      if (value === null || value === undefined) return true;
      if (typeof value !== 'string') return false;
      const hasUpperCase = /[A-Z]/.test(value);
      const hasLowerCase = /[a-z]/.test(value);
      const hasNumbers = /\d/.test(value);
      const lengthValid = value.length >= 8 && value.length <= 20;
      return hasUpperCase && hasLowerCase && hasNumbers && lengthValid;
    }, '{field} 必须包含大小写字母和数字，长度8-20位');
  }

  /**
   * 注册验证规则
   * @param {string} name - 规则名称
   * @param {Function} validatorFn - 验证函数
   * @param {string|Function} message - 错误消息
   */
  registerRule(name, validatorFn, message) {
    if (typeof validatorFn !== 'function') {
      throw new Error('验证函数必须是函数类型');
    }
    
    this.rules.set(name, new ValidationRule(name, validatorFn, message));
    logger.debug(`注册验证规则: ${name}`);
  }

  /**
   * 获取验证规则
   * @param {string} name - 规则名称
   * @returns {ValidationRule|null} 验证规则对象
   */
  getRule(name) {
    return this.rules.get(name) || null;
  }

  /**
   * 验证单个值
   * @param {*} value - 要验证的值
   * @param {Array|Object} rules - 验证规则数组或对象
   * @param {string} fieldName - 字段名称
   * @returns {ValidationResult} 验证结果
   */
  validateValue(value, rules, fieldName = 'value') {
    const result = new ValidationResult();
    
    // 标准化规则格式为数组
    const ruleList = Array.isArray(rules) ? rules : this._normalizeRulesObject(rules);
    
    for (const ruleConfig of ruleList) {
      const rule = this.getRule(ruleConfig.name);
      if (!rule) {
        logger.warn(`未知的验证规则: ${ruleConfig.name}`);
        continue;
      }
      
      const isValid = rule.validate(value, ruleConfig.options || {});
      if (!isValid) {
        const errorMessage = rule.getErrorMessage(fieldName, ruleConfig.options || {});
        result.addError(fieldName, errorMessage, ruleConfig.name);
      }
    }
    
    return result;
  }

  /**
   * 验证对象
   * @param {Object} data - 要验证的数据对象
   * @param {Object} schema - 验证模式
   * @returns {ValidationResult} 验证结果
   */
  validateObject(data, schema) {
    const result = new ValidationResult();
    
    for (const [fieldName, fieldRules] of Object.entries(schema)) {
      const value = data[fieldName];
      const fieldResult = this.validateValue(value, fieldRules, fieldName);
      result.merge(fieldResult);
    }
    
    return result;
  }

  /**
   * 验证数组中的每个元素
   * @param {Array} dataArray - 要验证的数据数组
   * @param {Array|Object} itemRules - 元素的验证规则
   * @param {string} arrayName - 数组名称
   * @returns {ValidationResult} 验证结果
   */
  validateArray(dataArray, itemRules, arrayName = 'array') {
    const result = new ValidationResult();
    
    if (!Array.isArray(dataArray)) {
      result.addError(arrayName, `${arrayName} 必须是数组`, 'array');
      return result;
    }
    
    dataArray.forEach((item, index) => {
      const itemResult = this.validateValue(item, itemRules, `${arrayName}[${index}]`);
      result.merge(itemResult);
    });
    
    return result;
  }

  /**
   * 验证嵌套对象
   * @param {Object} data - 要验证的数据对象
   * @param {Object} schema - 嵌套验证模式
   * @returns {ValidationResult} 验证结果
   */
  validateNested(data, schema) {
    const result = new ValidationResult();
    
    for (const [fieldName, fieldSchema] of Object.entries(schema)) {
      const value = data[fieldName];
      
      if (typeof fieldSchema === 'object' && !Array.isArray(fieldSchema) && fieldSchema !== null) {
        // 如果是嵌套对象模式
        if (fieldSchema.type === 'array' && fieldSchema.items) {
          // 数组类型的嵌套验证
          const arrayResult = this.validateArray(value, fieldSchema.items, fieldName);
          result.merge(arrayResult);
        } else if (fieldSchema.type === 'object' && fieldSchema.properties) {
          // 对象类型的嵌套验证
          if (value === null || value === undefined) {
            if (fieldSchema.required) {
              result.addError(fieldName, `${fieldName} 是必填项`, 'required');
            }
          } else if (typeof value === 'object' && !Array.isArray(value)) {
            const nestedResult = this.validateNested(value, fieldSchema.properties);
            // 为嵌套错误添加前缀
            nestedResult.errors.forEach(error => {
              error.field = `${fieldName}.${error.field}`;
            });
            result.merge(nestedResult);
          } else {
            result.addError(fieldName, `${fieldName} 必须是对象`, 'object');
          }
        } else {
          // 普通字段验证
          const fieldResult = this.validateValue(value, fieldSchema, fieldName);
          result.merge(fieldResult);
        }
      } else {
        // 普通验证规则
        const fieldResult = this.validateValue(value, fieldSchema, fieldName);
        result.merge(fieldResult);
      }
    }
    
    return result;
  }

  /**
   * 标准化规则对象为规则数组
   * @private
   */
  _normalizeRulesObject(rulesObj) {
    const ruleList = [];
    
    for (const [ruleName, options] of Object.entries(rulesObj)) {
      ruleList.push({
        name: ruleName,
        options: typeof options === 'boolean' ? {} : options
      });
    }
    
    return ruleList;
  }

  /**
   * 创建自定义验证器
   * @param {string} name - 验证器名称
   * @param {Function} validatorFn - 验证函数
   */
  registerCustomValidator(name, validatorFn) {
    if (typeof validatorFn !== 'function') {
      throw new Error('验证函数必须是函数类型');
    }
    
    this.customValidators.set(name, validatorFn);
    logger.debug(`注册自定义验证器: ${name}`);
  }

  /**
   * 使用自定义验证器
   * @param {*} value - 要验证的值
   * @param {string} validatorName - 验证器名称
   * @param {*} ...args - 其他参数
   * @returns {boolean} 验证结果
   */
  useCustomValidator(value, validatorName, ...args) {
    const validatorFn = this.customValidators.get(validatorName);
    if (!validatorFn) {
      logger.error(`自定义验证器不存在: ${validatorName}`);
      return false;
    }
    
    return validatorFn(value, ...args);
  }

  /**
   * 验证JSON模式
   * @param {Object} data - 要验证的数据
   * @param {Object} jsonSchema - JSON Schema对象
   * @returns {ValidationResult} 验证结果
   */
  validateJsonSchema(data, jsonSchema) {
    // 简化版JSON Schema验证
    const result = new ValidationResult();
    
    // 基本类型验证
    if (jsonSchema.type) {
      const typeValid = this._validateType(data, jsonSchema.type);
      if (!typeValid) {
        result.addError('data', `数据类型必须是 ${jsonSchema.type}`, 'type');
      }
    }
    
    // 必需属性验证
    if (jsonSchema.required && Array.isArray(jsonSchema.required)) {
      for (const requiredField of jsonSchema.required) {
        if (data[requiredField] === undefined) {
          result.addError(requiredField, `${requiredField} 是必填项`, 'required');
        }
      }
    }
    
    // 属性验证
    if (jsonSchema.properties && typeof jsonSchema.properties === 'object') {
      for (const [field, schema] of Object.entries(jsonSchema.properties)) {
        if (data[field] !== undefined) {
          const fieldResult = this.validateJsonSchema(data[field], schema);
          fieldResult.errors.forEach(error => {
            error.field = field + (error.field === 'data' ? '' : '.' + error.field);
          });
          result.merge(fieldResult);
        }
      }
    }
    
    // 数组项验证
    if (jsonSchema.items && Array.isArray(data)) {
      data.forEach((item, index) => {
        const itemResult = this.validateJsonSchema(item, jsonSchema.items);
        itemResult.errors.forEach(error => {
          error.field = `[${index}]` + (error.field === 'data' ? '' : '.' + error.field);
        });
        result.merge(itemResult);
      });
    }
    
    return result;
  }

  /**
   * 验证数据类型
   * @private
   */
  _validateType(value, type) {
    if (Array.isArray(type)) {
      return type.some(t => this._validateType(value, t));
    }
    
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'integer':
        return Number.isInteger(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return value !== null && typeof value === 'object' && !Array.isArray(value);
      case 'null':
        return value === null;
      case 'undefined':
        return value === undefined;
      default:
        return false;
    }
  }

  /**
   * 创建Express验证中间件
   * @param {Object} schema - 验证模式
   * @returns {Function} Express中间件函数
   */
  createExpressValidator(schema) {
    return (req, res, next) => {
      const validationData = {};
      
      // 根据schema中的位置获取数据
      for (const [field, rules] of Object.entries(schema)) {
        const [location, paramName] = field.split('.');
        
        if (location === 'body' && req.body) {
          validationData[paramName] = req.body[paramName];
        } else if (location === 'query' && req.query) {
          validationData[paramName] = req.query[paramName];
        } else if (location === 'params' && req.params) {
          validationData[paramName] = req.params[paramName];
        } else if (location === 'headers' && req.headers) {
          validationData[paramName] = req.headers[paramName.toLowerCase()];
        }
      }
      
      const result = this.validateObject(validationData, schema);
      
      if (!result.isValid) {
        return res.status(400).json({
          error: 'ValidationError',
          message: '请求数据验证失败',
          details: result.errors
        });
      }
      
      next();
    };
  }

  /**
   * 获取所有注册的规则名称
   * @returns {string[]} 规则名称数组
   */
  getRegisteredRules() {
    return Array.from(this.rules.keys());
  }

  /**
   * 检查是否是有效的邮箱
   * @param {string} email - 邮箱地址
   * @returns {boolean} 是否有效
   */
  isEmail(email) {
    return this.validateValue(email, ['email']).isValid;
  }

  /**
   * 检查是否是有效的URL
   * @param {string} url - URL地址
   * @returns {boolean} 是否有效
   */
  isUrl(url) {
    return this.validateValue(url, ['url']).isValid;
  }

  /**
   * 检查是否是有效的手机号（中国大陆）
   * @param {string} phone - 手机号
   * @returns {boolean} 是否有效
   */
  isPhoneCN(phone) {
    return this.validateValue(phone, ['phoneCN']).isValid;
  }

  /**
   * 检查是否是有效的身份证号（中国大陆）
   * @param {string} idCard - 身份证号
   * @returns {boolean} 是否有效
   */
  isIdCardCN(idCard) {
    return this.validateValue(idCard, ['idCardCN']).isValid;
  }

  /**
   * 检查是否是强密码
   * @param {string} password - 密码
   * @returns {boolean} 是否是强密码
   */
  isStrongPassword(password) {
    return this.validateValue(password, ['strongPassword']).isValid;
  }
}

// 单例模式
let instance = null;

function getInstance(options = {}) {
  if (!instance) {
    instance = new ValidatorUtils(options);
  }
  return instance;
}

module.exports = {
  ValidatorUtils,
  getInstance,
  ValidationResult,
  ValidationRule
};