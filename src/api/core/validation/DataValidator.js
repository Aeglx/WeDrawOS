/**
 * 高级数据验证器
 * 提供复杂的数据验证规则、自定义验证和验证链功能
 */

const logger = require('../utils/logger');
const { ValidationError } = require('../exception/handlers/errorHandler');

/**
 * 高级数据验证器类
 */
class DataValidator {
  constructor() {
    this.logger = logger;
    this.rules = new Map();
    this.customValidators = new Map();
    this.logger.info('高级数据验证器初始化');
  }

  /**
   * 注册自定义验证规则
   * @param {string} ruleName - 规则名称
   * @param {Function} validatorFn - 验证函数
   * @param {string} errorMessage - 错误消息模板
   */
  registerRule(ruleName, validatorFn, errorMessage = '{field} failed validation') {
    if (typeof validatorFn !== 'function') {
      throw new Error('验证函数必须是一个函数');
    }

    this.rules.set(ruleName, {
      validate: validatorFn,
      message: errorMessage
    });

    this.logger.debug(`已注册自定义验证规则: ${ruleName}`);
  }

  /**
   * 注册自定义验证器
   * @param {string} validatorName - 验证器名称
   * @param {Function} validatorFn - 验证函数，接收值和选项，返回布尔值或验证错误
   */
  registerCustomValidator(validatorName, validatorFn) {
    if (typeof validatorFn !== 'function') {
      throw new Error('验证器必须是一个函数');
    }

    this.customValidators.set(validatorName, validatorFn);
    this.logger.debug(`已注册自定义验证器: ${validatorName}`);
  }

  /**
   * 验证单个值
   * @param {string} field - 字段名称
   * @param {*} value - 要验证的值
   * @param {Array<string>|Object} validationRules - 验证规则数组或对象
   * @param {Object} options - 验证选项
   * @returns {Object} 验证结果 { isValid: boolean, errors: Array }
   */
  validateField(field, value, validationRules, options = {}) {
    const errors = [];
    const rulesArray = Array.isArray(validationRules) ? validationRules : Object.entries(validationRules);

    for (const rule of rulesArray) {
      let ruleName, ruleOptions = {};

      // 处理数组格式的规则 ["required", "email"]
      if (typeof rule === 'string') {
        ruleName = rule;
      } 
      // 处理对象格式的规则 { "minLength": 5, "maxLength": 50 }
      else if (Array.isArray(rule)) {
        [ruleName, ruleOptions] = rule;
      }
      // 处理对象格式的规则 { "minLength": 5, "maxLength": 50 }
      else {
        ruleName = rule;
      }

      try {
        const result = this._applyRule(field, value, ruleName, ruleOptions, options);
        if (!result.isValid) {
          errors.push(result.message);
        }
      } catch (error) {
        this.logger.error(`验证规则 ${ruleName} 执行失败`, { error, field, value });
        errors.push(`${field}: 验证过程发生错误`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 验证整个数据对象
   * @param {Object} data - 要验证的数据对象
   * @param {Object} schema - 验证模式，包含字段及其规则
   * @param {Object} options - 验证选项
   * @returns {Object} 验证结果 { isValid: boolean, errors: Object, validatedData: Object }
   */
  validate(data, schema, options = {}) {
    const errors = {};
    const validatedData = {};
    let isValid = true;

    // 处理默认选项
    const validationOptions = {
      allowUnknownFields: options.allowUnknownFields || false,
      stripUnknownFields: options.stripUnknownFields || false,
      skipEmptyValues: options.skipEmptyValues || false,
      ...options
    };

    // 验证已知字段
    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];
      
      // 如果字段不存在且规则不包含required，则跳过
      if (value === undefined || value === null) {
        const hasRequiredRule = this._hasRequiredRule(rules);
        if (!hasRequiredRule && validationOptions.skipEmptyValues) {
          continue;
        }
      }

      const fieldResult = this.validateField(field, value, rules, validationOptions);
      
      if (!fieldResult.isValid) {
        errors[field] = fieldResult.errors;
        isValid = false;
      } else if (value !== undefined) {
        // 只有验证通过的字段才会被包含在validatedData中
        validatedData[field] = value;
      }
    }

    // 检查未知字段
    if (!validationOptions.allowUnknownFields) {
      const schemaFields = new Set(Object.keys(schema));
      for (const field of Object.keys(data)) {
        if (!schemaFields.has(field)) {
          const errorMessage = validationOptions.unknownFieldMessage || 
                              `未知字段: ${field}`;
          
          if (!errors._unknown) {
            errors._unknown = [];
          }
          errors._unknown.push(errorMessage);
          isValid = false;
        }
      }
    }

    // 处理stripUnknownFields选项
    if (validationOptions.stripUnknownFields && isValid) {
      return {
        isValid,
        errors,
        validatedData
      };
    }

    return {
      isValid,
      errors,
      validatedData: isValid ? data : {}
    };
  }

  /**
   * 验证并抛出异常
   * @param {Object} data - 要验证的数据
   * @param {Object} schema - 验证模式
   * @param {Object} options - 验证选项
   * @returns {Object} 验证后的数据
   * @throws {ValidationError} 验证失败时抛出错误
   */
  validateOrThrow(data, schema, options = {}) {
    const result = this.validate(data, schema, options);
    
    if (!result.isValid) {
      this.logger.warn('数据验证失败', { errors: result.errors });
      throw new ValidationError('数据验证失败', result.errors);
    }
    
    return options.stripUnknownFields ? result.validatedData : data;
  }

  /**
   * 创建验证链
   * @param {*} value - 初始值
   * @returns {Object} 验证链对象
   */
  chain(value) {
    const chain = {
      value,
      errors: [],
      
      /**
       * 添加验证规则
       */
      check(ruleName, options = {}, message = null) {
        const result = this._applyChainRule('value', this.value, ruleName, options, message);
        if (!result.isValid) {
          this.errors.push(result.message);
        }
        return this;
      },
      
      /**
       * 条件验证
       */
      when(condition, ifRule, elseRule = null) {
        if (typeof condition === 'function' ? condition(this.value) : condition) {
          this.check(ifRule);
        } else if (elseRule) {
          this.check(elseRule);
        }
        return this;
      },
      
      /**
       * 转换值
       */
      transform(transformFn) {
        if (this.errors.length === 0) {
          try {
            this.value = transformFn(this.value);
          } catch (error) {
            this.errors.push('值转换失败');
          }
        }
        return this;
      },
      
      /**
       * 获取结果
       */
      result() {
        return {
          isValid: this.errors.length === 0,
          errors: this.errors,
          value: this.errors.length === 0 ? this.value : null
        };
      },
      
      /**
       * 获取值或抛出异常
       */
      valueOrThrow() {
        if (this.errors.length > 0) {
          throw new ValidationError('验证失败', this.errors);
        }
        return this.value;
      },
      
      /**
       * 内部方法：应用链式验证规则
       */
      _applyChainRule(field, value, ruleName, options, customMessage) {
        const rule = this.rules.get(ruleName) || this._getBuiltInRule(ruleName);
        
        if (!rule) {
          return {
            isValid: false,
            message: `未知的验证规则: ${ruleName}`
          };
        }
        
        const isValid = rule.validate(value, options);
        
        if (!isValid) {
          return {
            isValid: false,
            message: customMessage || rule.message.replace('{field}', field)
          };
        }
        
        return { isValid: true, message: '' };
      }
    };
    
    return chain;
  }

  /**
   * 应用单个验证规则
   * @private
   * @param {string} field - 字段名
   * @param {*} value - 要验证的值
   * @param {string} ruleName - 规则名称
   * @param {*} ruleOptions - 规则选项
   * @param {Object} options - 验证选项
   * @returns {Object} 规则应用结果 { isValid: boolean, message: string }
   */
  _applyRule(field, value, ruleName, ruleOptions, options) {
    // 检查是否是自定义验证器
    if (this.customValidators.has(ruleName)) {
      const validator = this.customValidators.get(ruleName);
      try {
        const result = validator(value, ruleOptions);
        if (result === true) {
          return { isValid: true, message: '' };
        }
        return {
          isValid: false,
          message: typeof result === 'string' ? result : `${field} 验证失败`
        };
      } catch (error) {
        return {
          isValid: false,
          message: error.message || `${field} 验证失败`
        };
      }
    }

    // 检查是否是注册的规则
    const rule = this.rules.get(ruleName) || this._getBuiltInRule(ruleName);
    
    if (!rule) {
      return {
        isValid: false,
        message: `${field}: 未知的验证规则 '${ruleName}'`
      };
    }
    
    try {
      const isValid = rule.validate(value, ruleOptions, options);
      
      if (!isValid) {
        let message = rule.message;
        
        // 替换消息模板中的变量
        message = message
          .replace('{field}', field)
          .replace('{value}', String(value))
          .replace('{options}', JSON.stringify(ruleOptions));
        
        // 替换特定规则的参数
        if (typeof ruleOptions === 'object' && ruleOptions !== null) {
          for (const [key, val] of Object.entries(ruleOptions)) {
            message = message.replace(`{${key}}`, String(val));
          }
        }
        
        return { isValid: false, message };
      }
      
      return { isValid: true, message: '' };
    } catch (error) {
      return {
        isValid: false,
        message: `${field}: 验证规则 '${ruleName}' 执行失败: ${error.message}`
      };
    }
  }

  /**
   * 获取内置验证规则
   * @private
   * @param {string} ruleName - 规则名称
   * @returns {Object|null} 规则对象或null
   */
  _getBuiltInRule(ruleName) {
    const builtInRules = {
      required: {
        validate: (value) => value !== undefined && value !== null && value !== '',
        message: '{field} 是必填项'
      },
      
      email: {
        validate: (value) => {
          if (value === undefined || value === null || value === '') return true;
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(value);
        },
        message: '{field} 必须是有效的电子邮件地址'
      },
      
      minLength: {
        validate: (value, min) => {
          if (value === undefined || value === null) return true;
          return String(value).length >= min;
        },
        message: '{field} 长度不能少于 {min} 个字符'
      },
      
      maxLength: {
        validate: (value, max) => {
          if (value === undefined || value === null) return true;
          return String(value).length <= max;
        },
        message: '{field} 长度不能超过 {max} 个字符'
      },
      
      length: {
        validate: (value, length) => {
          if (value === undefined || value === null) return true;
          return String(value).length === length;
        },
        message: '{field} 长度必须是 {length} 个字符'
      },
      
      min: {
        validate: (value, min) => {
          if (value === undefined || value === null) return true;
          const numValue = Number(value);
          return !isNaN(numValue) && numValue >= min;
        },
        message: '{field} 不能小于 {min}'
      },
      
      max: {
        validate: (value, max) => {
          if (value === undefined || value === null) return true;
          const numValue = Number(value);
          return !isNaN(numValue) && numValue <= max;
        },
        message: '{field} 不能大于 {max}'
      },
      
      number: {
        validate: (value) => {
          if (value === undefined || value === null) return true;
          return !isNaN(Number(value));
        },
        message: '{field} 必须是数字'
      },
      
      integer: {
        validate: (value) => {
          if (value === undefined || value === null) return true;
          return Number.isInteger(Number(value));
        },
        message: '{field} 必须是整数'
      },
      
      boolean: {
        validate: (value) => {
          if (value === undefined || value === null) return true;
          return typeof value === 'boolean' || ['true', 'false', '1', '0'].includes(String(value).toLowerCase());
        },
        message: '{field} 必须是布尔值'
      },
      
      array: {
        validate: (value) => {
          if (value === undefined || value === null) return true;
          return Array.isArray(value);
        },
        message: '{field} 必须是数组'
      },
      
      object: {
        validate: (value) => {
          if (value === undefined || value === null) return true;
          return typeof value === 'object' && !Array.isArray(value);
        },
        message: '{field} 必须是对象'
      },
      
      regex: {
        validate: (value, pattern) => {
          if (value === undefined || value === null) return true;
          const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
          return regex.test(String(value));
        },
        message: '{field} 格式不正确'
      },
      
      in: {
        validate: (value, allowedValues) => {
          if (value === undefined || value === null) return true;
          return allowedValues.includes(value);
        },
        message: '{field} 必须是以下值之一: {allowedValues}'
      },
      
      notIn: {
        validate: (value, disallowedValues) => {
          if (value === undefined || value === null) return true;
          return !disallowedValues.includes(value);
        },
        message: '{field} 不能是以下值: {disallowedValues}'
      },
      
      url: {
        validate: (value) => {
          if (value === undefined || value === null) return true;
          try {
            new URL(value);
            return true;
          } catch {
            return false;
          }
        },
        message: '{field} 必须是有效的URL'
      },
      
      date: {
        validate: (value) => {
          if (value === undefined || value === null) return true;
          return !isNaN(new Date(value).getTime());
        },
        message: '{field} 必须是有效的日期'
      },
      
      alpha: {
        validate: (value) => {
          if (value === undefined || value === null) return true;
          const alphaRegex = /^[a-zA-Z]+$/;
          return alphaRegex.test(value);
        },
        message: '{field} 只能包含字母'
      },
      
      alphanumeric: {
        validate: (value) => {
          if (value === undefined || value === null) return true;
          const alphanumericRegex = /^[a-zA-Z0-9]+$/;
          return alphanumericRegex.test(value);
        },
        message: '{field} 只能包含字母和数字'
      },
      
      numeric: {
        validate: (value) => {
          if (value === undefined || value === null) return true;
          const numericRegex = /^\d+$/;
          return numericRegex.test(value);
        },
        message: '{field} 只能包含数字'
      },
      
      creditCard: {
        validate: (value) => {
          if (value === undefined || value === null) return true;
          // 简单的信用卡号码验证（Luhn算法）
          const cardNumber = String(value).replace(/\s/g, '');
          if (!/^\d{13,19}$/.test(cardNumber)) return false;
          
          let sum = 0;
          let shouldDouble = false;
          for (let i = cardNumber.length - 1; i >= 0; i--) {
            let digit = parseInt(cardNumber.charAt(i));
            
            if (shouldDouble) {
              digit *= 2;
              if (digit > 9) digit -= 9;
            }
            
            sum += digit;
            shouldDouble = !shouldDouble;
          }
          
          return sum % 10 === 0;
        },
        message: '{field} 必须是有效的信用卡号码'
      },
      
      phone: {
        validate: (value) => {
          if (value === undefined || value === null) return true;
          const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/;
          return phoneRegex.test(value);
        },
        message: '{field} 必须是有效的电话号码'
      },
      
      uuid: {
        validate: (value) => {
          if (value === undefined || value === null) return true;
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          return uuidRegex.test(value);
        },
        message: '{field} 必须是有效的UUID'
      },
      
      equals: {
        validate: (value, comparison) => {
          if (value === undefined || value === null) return comparison === undefined || comparison === null;
          return value === comparison;
        },
        message: '{field} 必须等于 {comparison}'
      },
      
      notEquals: {
        validate: (value, comparison) => {
          if (value === undefined || value === null) return comparison !== undefined && comparison !== null;
          return value !== comparison;
        },
        message: '{field} 不能等于 {comparison}'
      },
      
      isEmpty: {
        validate: (value) => {
          if (value === undefined || value === null || value === '') return true;
          if (Array.isArray(value)) return value.length === 0;
          if (typeof value === 'object') return Object.keys(value).length === 0;
          return false;
        },
        message: '{field} 必须为空'
      },
      
      notEmpty: {
        validate: (value) => {
          if (value === undefined || value === null || value === '') return false;
          if (Array.isArray(value)) return value.length > 0;
          if (typeof value === 'object') return Object.keys(value).length > 0;
          return true;
        },
        message: '{field} 不能为空'
      }
    };

    return builtInRules[ruleName] || null;
  }

  /**
   * 检查规则是否包含required
   * @private
   * @param {Array|Object} rules - 规则数组或对象
   * @returns {boolean} 是否包含required规则
   */
  _hasRequiredRule(rules) {
    if (Array.isArray(rules)) {
      return rules.includes('required');
    }
    
    if (typeof rules === 'object' && rules !== null) {
      return Object.keys(rules).includes('required');
    }
    
    return false;
  }

  /**
   * 创建模式验证器
   * @param {Object} schema - 验证模式
   * @returns {Function} 验证函数
   */
  createSchemaValidator(schema) {
    return (data, options = {}) => {
      return this.validate(data, schema, options);
    };
  }

  /**
   * 创建Express中间件验证器
   * @param {Object} schema - 验证模式
   * @param {string} source - 数据来源 ('body', 'query', 'params', 'headers')
   * @returns {Function} Express中间件
   */
  createMiddleware(schema, source = 'body') {
    return (req, res, next) => {
      const data = req[source];
      const result = this.validate(data, schema);
      
      if (!result.isValid) {
        next(new ValidationError('请求数据验证失败', result.errors));
      } else {
        // 将验证后的数据重新赋值给请求对象
        req[`validated_${source}`] = result.validatedData;
        next();
      }
    };
  }

  /**
   * 获取所有可用的验证规则列表
   * @returns {Array<string>} 规则名称列表
   */
  getAvailableRules() {
    const builtInRuleNames = Object.keys(this._getBuiltInRule('required') ? {} : this._getBuiltInRule);
    const customRuleNames = Array.from(this.rules.keys());
    
    return [...new Set([...builtInRuleNames, ...customRuleNames])];
  }
}

// 创建单例实例
const dataValidator = new DataValidator();

module.exports = {
  DataValidator,
  dataValidator
};