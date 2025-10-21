/**
 * 验证器模块
 * 提供请求参数验证功能
 */

const { ValidationError } = require('../exception/handlers/errorHandler');
const logger = require('../utils/logger');

/**
 * 验证器类
 */
class Validator {
  /**
   * 构造函数
   * @param {Object} rules - 验证规则
   */
  constructor(rules = {}) {
    this.rules = rules;
    this.errors = {};
  }

  /**
   * 设置验证规则
   * @param {Object} rules - 验证规则
   * @returns {Validator} 当前实例
   */
  setRules(rules) {
    this.rules = rules;
    return this;
  }

  /**
   * 验证数据
   * @param {Object} data - 要验证的数据
   * @returns {boolean} 是否验证通过
   */
  validate(data) {
    this.errors = {};

    // 遍历规则进行验证
    Object.keys(this.rules).forEach(field => {
      const rules = this.rules[field];
      const value = data[field];

      // 执行每个规则的验证
      rules.forEach(rule => {
        const [ruleName, ...params] = rule.split(':');
        const validatorFn = this.validators[ruleName];

        if (validatorFn && !validatorFn(value, ...params)) {
          this.addError(field, this.getErrorMessage(ruleName, field, ...params));
        }
      });
    });

    return Object.keys(this.errors).length === 0;
  }

  /**
   * 获取验证错误
   * @returns {Object} 验证错误信息
   */
  getErrors() {
    return this.errors;
  }

  /**
   * 添加错误信息
   * @param {string} field - 字段名
   * @param {string} message - 错误信息
   */
  addError(field, message) {
    if (!this.errors[field]) {
      this.errors[field] = [];
    }
    this.errors[field].push(message);
  }

  /**
   * 获取错误消息
   * @param {string} ruleName - 规则名称
   * @param {string} field - 字段名
   * @param  {...any} params - 规则参数
   * @returns {string} 错误消息
   */
  getErrorMessage(ruleName, field, ...params) {
    const messages = {
      required: `${field} 是必填项`,
      email: `${field} 必须是有效的邮箱地址`,
      min: `${field} 长度不能小于 ${params[0]}`,
      max: `${field} 长度不能大于 ${params[0]}`,
      length: `${field} 长度必须等于 ${params[0]}`,
      numeric: `${field} 必须是数字`,
      integer: `${field} 必须是整数`,
      positive: `${field} 必须是正数`,
      negative: `${field} 必须是负数`,
      boolean: `${field} 必须是布尔值`,
      array: `${field} 必须是数组`,
      object: `${field} 必须是对象`,
      string: `${field} 必须是字符串`,
      date: `${field} 必须是有效的日期`,
      enum: `${field} 必须是以下值之一: ${params.join(', ')}`,
      match: `${field} 格式不正确`,
      confirmed: `${field} 两次输入不一致`,
      alpha: `${field} 只能包含字母`,
      alphanumeric: `${field} 只能包含字母和数字`,
      url: `${field} 必须是有效的URL`,
      uuid: `${field} 必须是有效的UUID`,
      hex: `${field} 必须是有效的十六进制字符串`,
      json: `${field} 必须是有效的JSON字符串`
    };

    return messages[ruleName] || `${field} 验证失败`;
  }

  /**
   * 验证规则集
   */
  validators = {
    /**
     * 必填项验证
     */
    required: (value) => {
      if (value === null || value === undefined) return false;
      if (typeof value === 'string') return value.trim().length > 0;
      if (Array.isArray(value)) return value.length > 0;
      return true;
    },

    /**
     * 邮箱验证
     */
    email: (value) => {
      if (!value) return true;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    },

    /**
     * 最小长度验证
     */
    min: (value, min) => {
      if (!value) return true;
      min = parseInt(min, 10);
      if (typeof value === 'string') return value.length >= min;
      if (Array.isArray(value)) return value.length >= min;
      if (typeof value === 'number') return value >= min;
      return true;
    },

    /**
     * 最大长度验证
     */
    max: (value, max) => {
      if (!value) return true;
      max = parseInt(max, 10);
      if (typeof value === 'string') return value.length <= max;
      if (Array.isArray(value)) return value.length <= max;
      if (typeof value === 'number') return value <= max;
      return true;
    },

    /**
     * 固定长度验证
     */
    length: (value, length) => {
      if (!value) return true;
      length = parseInt(length, 10);
      if (typeof value === 'string') return value.length === length;
      if (Array.isArray(value)) return value.length === length;
      return true;
    },

    /**
     * 数字验证
     */
    numeric: (value) => {
      if (value === null || value === undefined) return true;
      return !isNaN(parseFloat(value)) && isFinite(value);
    },

    /**
     * 整数验证
     */
    integer: (value) => {
      if (value === null || value === undefined) return true;
      return Number.isInteger(Number(value));
    },

    /**
     * 正数验证
     */
    positive: (value) => {
      if (value === null || value === undefined) return true;
      return Number(value) > 0;
    },

    /**
     * 负数验证
     */
    negative: (value) => {
      if (value === null || value === undefined) return true;
      return Number(value) < 0;
    },

    /**
     * 布尔值验证
     */
    boolean: (value) => {
      if (value === null || value === undefined) return true;
      return typeof value === 'boolean';
    },

    /**
     * 数组验证
     */
    array: (value) => {
      if (value === null || value === undefined) return true;
      return Array.isArray(value);
    },

    /**
     * 对象验证
     */
    object: (value) => {
      if (value === null || value === undefined) return true;
      return typeof value === 'object' && !Array.isArray(value);
    },

    /**
     * 字符串验证
     */
    string: (value) => {
      if (value === null || value === undefined) return true;
      return typeof value === 'string';
    },

    /**
     * 日期验证
     */
    date: (value) => {
      if (value === null || value === undefined) return true;
      return !isNaN(Date.parse(value));
    },

    /**
     * 枚举验证
     */
    enum: (value, ...options) => {
      if (value === null || value === undefined) return true;
      return options.includes(value.toString());
    },

    /**
     * 正则匹配验证
     */
    match: (value, pattern) => {
      if (value === null || value === undefined) return true;
      try {
        const regex = new RegExp(pattern);
        return regex.test(value);
      } catch (e) {
        return false;
      }
    },

    /**
     * 确认密码验证
     */
    confirmed: (value, confirmField, data) => {
      if (value === null || value === undefined) return true;
      return value === data[confirmField];
    },

    /**
     * 字母验证
     */
    alpha: (value) => {
      if (value === null || value === undefined) return true;
      const alphaRegex = /^[a-zA-Z]+$/;
      return alphaRegex.test(value);
    },

    /**
     * 字母数字验证
     */
    alphanumeric: (value) => {
      if (value === null || value === undefined) return true;
      const alphanumericRegex = /^[a-zA-Z0-9]+$/;
      return alphanumericRegex.test(value);
    },

    /**
     * URL验证
     */
    url: (value) => {
      if (value === null || value === undefined) return true;
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },

    /**
     * UUID验证
     */
    uuid: (value) => {
      if (value === null || value === undefined) return true;
      const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
      return uuidRegex.test(value);
    },

    /**
     * 十六进制验证
     */
    hex: (value) => {
      if (value === null || value === undefined) return true;
      const hexRegex = /^[0-9a-fA-F]+$/;
      return hexRegex.test(value);
    },

    /**
     * JSON字符串验证
     */
    json: (value) => {
      if (value === null || value === undefined) return true;
      if (typeof value !== 'string') return false;
      try {
        JSON.parse(value);
        return true;
      } catch {
        return false;
      }
    }
  };

  /**
   * 创建验证中间件
   * @param {Object} rules - 验证规则
   * @returns {Function} 中间件函数
   */
  static middleware(rules) {
    return (req, res, next) => {
      const validator = new Validator(rules);
      
      // 合并请求参数
      const data = {
        ...req.body,
        ...req.query,
        ...req.params
      };

      if (!validator.validate(data)) {
        const errors = validator.getErrors();
        logger.warn('请求参数验证失败', { errors, data });
        return next(new ValidationError('请求参数验证失败', errors));
      }

      next();
    };
  }

  /**
   * 验证单个值
   * @param {*} value - 要验证的值
   * @param {Array<string>} rules - 验证规则
   * @returns {Object} 验证结果
   */
  static validateValue(value, rules) {
    const validator = new Validator({ value: rules });
    const isValid = validator.validate({ value });
    
    return {
      valid: isValid,
      errors: validator.getErrors().value || []
    };
  }

  /**
   * 验证邮箱
   * @param {string} email - 邮箱地址
   * @returns {boolean} 是否有效
   */
  static isValidEmail(email) {
    const { valid } = this.validateValue(email, ['required', 'email']);
    return valid;
  }

  /**
   * 验证手机号（中国大陆）
   * @param {string} phone - 手机号
   * @returns {boolean} 是否有效
   */
  static isValidPhone(phone) {
    const { valid } = this.validateValue(phone, ['required', 'match:^1[3-9]\d{9}$']);
    return valid;
  }

  /**
   * 验证密码强度
   * @param {string} password - 密码
   * @returns {boolean} 是否有效
   */
  static isValidPassword(password) {
    // 至少包含6个字符
    const { valid } = this.validateValue(password, ['required', 'min:6']);
    return valid;
  }

  /**
   * 验证身份证号（中国大陆）
   * @param {string} idCard - 身份证号
   * @returns {boolean} 是否有效
   */
  static isValidIdCard(idCard) {
    const { valid } = this.validateValue(idCard, ['required', 'match:^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$']);
    return valid;
  }

  /**
   * 清理和转义输入数据
   * @param {*} data - 要清理的数据
   * @returns {*} 清理后的数据
   */
  static sanitize(data) {
    if (data === null || data === undefined) return data;
    
    if (typeof data === 'string') {
      // 去除首尾空格
      return data.trim();
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.sanitize(item));
    }
    
    if (typeof data === 'object') {
      const sanitized = {};
      Object.keys(data).forEach(key => {
        sanitized[key] = this.sanitize(data[key]);
      });
      return sanitized;
    }
    
    return data;
  }
}

module.exports = Validator;