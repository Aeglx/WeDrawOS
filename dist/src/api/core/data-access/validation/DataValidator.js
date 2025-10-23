/**
 * 数据验证器
 * 提供数据验证和约束检查功能
 */

const logger = require('../../utils/logger');
const { AppError } = require('../../exception/handlers/errorHandler');
const { ValidationError } = require('../../exception/handlers/errorHandler');

/**
 * 验证规则类型
 */
const RuleType = {
  REQUIRED: 'required',
  TYPE: 'type',
  MIN: 'min',
  MAX: 'max',
  LENGTH: 'length',
  PATTERN: 'pattern',
  CUSTOM: 'custom',
  ENUM: 'enum',
  EMAIL: 'email',
  URL: 'url',
  DATE: 'date',
  TIME: 'time',
  DATETIME: 'datetime',
  BEFORE: 'before',
  AFTER: 'after',
  EQUAL: 'equal',
  NOT_EQUAL: 'notEqual',
  ALPHA: 'alpha',
  ALPHA_NUMERIC: 'alphaNumeric',
  NUMERIC: 'numeric',
  INTEGER: 'integer',
  DECIMAL: 'decimal',
  POSITIVE: 'positive',
  NEGATIVE: 'negative',
  ARRAY: 'array',
  OBJECT: 'object',
  BOOLEAN: 'boolean',
  NULL: 'null',
  NOT_NULL: 'notNull',
  IN: 'in',
  NOT_IN: 'notIn',
  JSON: 'json',
  UUID: 'uuid',
  CREDIT_CARD: 'creditCard',
  IP: 'ip',
  MOBILE_PHONE: 'mobilePhone',
  LATITUDE: 'latitude',
  LONGITUDE: 'longitude'
};

/**
 * 数据验证器
 */
class DataValidator {
  /**
   * 构造函数
   * @param {Object} options - 验证器选项
   */
  constructor(options = {}) {
    this.options = {
      throwOnError: true,
      stopOnFirstError: false,
      defaultMessages: this._getDefaultMessages(),
      customMessages: {},
      ...options
    };

    this.schemas = new Map();
    this.customRules = new Map();
    
    logger.debug('数据验证器初始化完成', { options: this.options });
  }

  /**
   * 获取默认错误消息
   * @private
   * @returns {Object} 默认错误消息映射
   */
  _getDefaultMessages() {
    return {
      [RuleType.REQUIRED]: '字段 {field} 是必填项',
      [RuleType.TYPE]: '字段 {field} 必须是类型 {type}',
      [RuleType.MIN]: '字段 {field} 最小值为 {min}',
      [RuleType.MAX]: '字段 {field} 最大值为 {max}',
      [RuleType.LENGTH]: '字段 {field} 长度必须为 {length}',
      [RuleType.PATTERN]: '字段 {field} 不匹配模式 {pattern}',
      [RuleType.ENUM]: '字段 {field} 必须是以下值之一: {enum}',
      [RuleType.EMAIL]: '字段 {field} 必须是有效的电子邮件地址',
      [RuleType.URL]: '字段 {field} 必须是有效的URL',
      [RuleType.DATE]: '字段 {field} 必须是有效的日期',
      [RuleType.TIME]: '字段 {field} 必须是有效的时间',
      [RuleType.DATETIME]: '字段 {field} 必须是有效的日期时间',
      [RuleType.BEFORE]: '字段 {field} 必须早于 {date}',
      [RuleType.AFTER]: '字段 {field} 必须晚于 {date}',
      [RuleType.EQUAL]: '字段 {field} 必须等于 {value}',
      [RuleType.NOT_EQUAL]: '字段 {field} 不能等于 {value}',
      [RuleType.ALPHA]: '字段 {field} 只能包含字母',
      [RuleType.ALPHA_NUMERIC]: '字段 {field} 只能包含字母和数字',
      [RuleType.NUMERIC]: '字段 {field} 必须是数字',
      [RuleType.INTEGER]: '字段 {field} 必须是整数',
      [RuleType.DECIMAL]: '字段 {field} 必须是小数',
      [RuleType.POSITIVE]: '字段 {field} 必须是正数',
      [RuleType.NEGATIVE]: '字段 {field} 必须是负数',
      [RuleType.ARRAY]: '字段 {field} 必须是数组',
      [RuleType.OBJECT]: '字段 {field} 必须是对象',
      [RuleType.BOOLEAN]: '字段 {field} 必须是布尔值',
      [RuleType.NULL]: '字段 {field} 必须是null',
      [RuleType.NOT_NULL]: '字段 {field} 不能为null',
      [RuleType.IN]: '字段 {field} 必须是以下值之一: {values}',
      [RuleType.NOT_IN]: '字段 {field} 不能是以下值之一: {values}',
      [RuleType.JSON]: '字段 {field} 必须是有效的JSON字符串',
      [RuleType.UUID]: '字段 {field} 必须是有效的UUID',
      [RuleType.CREDIT_CARD]: '字段 {field} 必须是有效的信用卡号',
      [RuleType.IP]: '字段 {field} 必须是有效的IP地址',
      [RuleType.MOBILE_PHONE]: '字段 {field} 必须是有效的手机号码',
      [RuleType.LATITUDE]: '字段 {field} 必须是有效的纬度',
      [RuleType.LONGITUDE]: '字段 {field} 必须是有效的经度',
      custom: '字段 {field} 验证失败: {message}'
    };
  }

  /**
   * 注册数据验证模式
   * @param {string} name - 模式名称
   * @param {Object} schema - 验证模式定义
   * @returns {DataValidator} 当前实例，支持链式调用
   */
  registerSchema(name, schema) {
    if (!name || typeof name !== 'string') {
      throw new AppError('模式名称必须是有效的字符串', {
        code: 'INVALID_SCHEMA_NAME',
        status: 400
      });
    }

    if (!schema || typeof schema !== 'object') {
      throw new AppError('模式定义必须是有效的对象', {
        code: 'INVALID_SCHEMA',
        status: 400
      });
    }

    this.schemas.set(name, schema);
    logger.debug(`数据验证模式注册成功: ${name}`);
    
    return this;
  }

  /**
   * 注册自定义验证规则
   * @param {string} name - 规则名称
   * @param {Function} validator - 验证函数
   * @returns {DataValidator} 当前实例，支持链式调用
   */
  registerCustomRule(name, validator) {
    if (!name || typeof name !== 'string') {
      throw new AppError('规则名称必须是有效的字符串', {
        code: 'INVALID_RULE_NAME',
        status: 400
      });
    }

    if (typeof validator !== 'function') {
      throw new AppError('验证函数必须是有效的函数', {
        code: 'INVALID_VALIDATOR',
        status: 400
      });
    }

    this.customRules.set(name, validator);
    logger.debug(`自定义验证规则注册成功: ${name}`);
    
    return this;
  }

  /**
   * 设置自定义错误消息
   * @param {Object} messages - 自定义错误消息映射
   * @returns {DataValidator} 当前实例，支持链式调用
   */
  setCustomMessages(messages) {
    if (typeof messages !== 'object' || messages === null) {
      throw new AppError('自定义错误消息必须是有效的对象', {
        code: 'INVALID_CUSTOM_MESSAGES',
        status: 400
      });
    }

    this.options.customMessages = {
      ...this.options.customMessages,
      ...messages
    };
    
    return this;
  }

  /**
   * 验证数据
   * @param {Object} data - 待验证的数据
   * @param {string|Object} schema - 模式名称或模式定义
   * @param {Object} options - 验证选项
   * @returns {Promise<Object>} 验证结果
   */
  async validate(data, schema, options = {}) {
    // 合并验证选项
    const validationOptions = {
      ...this.options,
      ...options
    };

    // 获取模式定义
    const schemaDef = typeof schema === 'string' 
      ? this.schemas.get(schema)
      : schema;

    if (!schemaDef) {
      throw new AppError(
        typeof schema === 'string' 
          ? `未找到验证模式: ${schema}`
          : '验证模式定义无效',
        {
          code: 'SCHEMA_NOT_FOUND',
          status: 400
        }
      );
    }

    // 初始化验证结果
    const validationResult = {
      valid: true,
      errors: [],
      data: { ...data }
    };

    logger.debug('开始数据验证', {
      schema: typeof schema === 'string' ? schema : 'custom',
      dataKeys: Object.keys(data)
    });

    // 验证所有字段
    for (const [field, rules] of Object.entries(schemaDef)) {
      // 如果不是停止在第一个错误或者没有错误，就继续验证
      if (!validationOptions.stopOnFirstError || validationResult.valid) {
        await this._validateField(
          field,
          data[field],
          rules,
          data,
          validationResult,
          validationOptions
        );
      }
    }

    // 如果有错误并且配置为抛出错误
    if (!validationResult.valid && validationOptions.throwOnError) {
      const errorMessage = `数据验证失败: ${validationResult.errors[0].message}`;
      logger.error(errorMessage, { errors: validationResult.errors });
      
      throw new ValidationError(errorMessage, {
        code: 'VALIDATION_ERROR',
        status: 400,
        details: validationResult.errors
      });
    }

    logger.debug('数据验证完成', {
      valid: validationResult.valid,
      errorCount: validationResult.errors.length
    });

    return validationResult;
  }

  /**
   * 验证单个字段
   * @private
   * @param {string} field - 字段名
   * @param {*} value - 字段值
   * @param {Object} rules - 验证规则
   * @param {Object} data - 完整数据对象
   * @param {Object} result - 验证结果对象
   * @param {Object} options - 验证选项
   * @returns {Promise<void>}
   */
  async _validateField(field, value, rules, data, result, options) {
    // 如果值是undefined，检查是否必填
    if (value === undefined) {
      if (rules.required) {
        this._addError(result, field, RuleType.REQUIRED, { field });
      }
      // 非必填字段，值为undefined时跳过其他验证
      return;
    }

    // 遍历所有规则
    for (const [rule, params] of Object.entries(rules)) {
      // 跳过必填规则，已经在前面处理过
      if (rule === 'required') continue;

      // 规则参数可能是布尔值或对象/数组
      const ruleParams = params === true ? {} : params;

      // 执行验证规则
      const valid = await this._executeRule(
        field,
        value,
        rule,
        ruleParams,
        data
      );

      // 如果验证失败，添加错误
      if (!valid) {
        this._addError(
          result,
          field,
          rule,
          this._getRuleParams(field, value, rule, ruleParams, data)
        );

        // 如果配置为停止在第一个错误，就返回
        if (options.stopOnFirstError) {
          return;
        }
      }
    }
  }

  /**
   * 执行验证规则
   * @private
   * @param {string} field - 字段名
   * @param {*} value - 字段值
   * @param {string} rule - 规则名称
   * @param {Object} params - 规则参数
   * @param {Object} data - 完整数据对象
   * @returns {Promise<boolean>} 验证是否通过
   */
  async _executeRule(field, value, rule, params, data) {
    // 检查是否是自定义规则
    if (this.customRules.has(rule)) {
      return await this.customRules.get(rule)(value, params, data, field);
    }

    // 内置规则处理
    switch (rule) {
      case RuleType.TYPE:
        return this._validateType(value, params);
      case RuleType.MIN:
        return this._validateMin(value, params);
      case RuleType.MAX:
        return this._validateMax(value, params);
      case RuleType.LENGTH:
        return this._validateLength(value, params);
      case RuleType.PATTERN:
        return this._validatePattern(value, params);
      case RuleType.ENUM:
        return this._validateEnum(value, params);
      case RuleType.EMAIL:
        return this._validateEmail(value);
      case RuleType.URL:
        return this._validateUrl(value);
      case RuleType.DATE:
        return this._validateDate(value);
      case RuleType.TIME:
        return this._validateTime(value);
      case RuleType.DATETIME:
        return this._validateDateTime(value);
      case RuleType.BEFORE:
        return this._validateBefore(value, params);
      case RuleType.AFTER:
        return this._validateAfter(value, params);
      case RuleType.EQUAL:
        return this._validateEqual(value, params, data);
      case RuleType.NOT_EQUAL:
        return this._validateNotEqual(value, params, data);
      case RuleType.ALPHA:
        return this._validateAlpha(value);
      case RuleType.ALPHA_NUMERIC:
        return this._validateAlphaNumeric(value);
      case RuleType.NUMERIC:
        return this._validateNumeric(value);
      case RuleType.INTEGER:
        return this._validateInteger(value);
      case RuleType.DECIMAL:
        return this._validateDecimal(value);
      case RuleType.POSITIVE:
        return this._validatePositive(value);
      case RuleType.NEGATIVE:
        return this._validateNegative(value);
      case RuleType.ARRAY:
        return this._validateArray(value, params);
      case RuleType.OBJECT:
        return this._validateObject(value, params);
      case RuleType.BOOLEAN:
        return this._validateBoolean(value);
      case RuleType.NULL:
        return this._validateNull(value);
      case RuleType.NOT_NULL:
        return this._validateNotNull(value);
      case RuleType.IN:
        return this._validateIn(value, params);
      case RuleType.NOT_IN:
        return this._validateNotIn(value, params);
      case RuleType.JSON:
        return this._validateJson(value);
      case RuleType.UUID:
        return this._validateUuid(value);
      case RuleType.CREDIT_CARD:
        return this._validateCreditCard(value);
      case RuleType.IP:
        return this._validateIp(value);
      case RuleType.MOBILE_PHONE:
        return this._validateMobilePhone(value, params);
      case RuleType.LATITUDE:
        return this._validateLatitude(value);
      case RuleType.LONGITUDE:
        return this._validateLongitude(value);
      case RuleType.CUSTOM:
        return this._validateCustom(value, params, data, field);
      default:
        logger.warn(`未知的验证规则: ${rule}`);
        return true;
    }
  }

  /**
   * 获取规则参数
   * @private
   * @param {string} field - 字段名
   * @param {*} value - 字段值
   * @param {string} rule - 规则名称
   * @param {Object} params - 规则参数
   * @param {Object} data - 完整数据对象
   * @returns {Object} 处理后的规则参数
   */
  _getRuleParams(field, value, rule, params, data) {
    const baseParams = {
      field,
      value,
      rule
    };

    // 根据规则类型添加特定参数
    switch (rule) {
      case RuleType.TYPE:
        return { ...baseParams, type: params };
      case RuleType.MIN:
        return { ...baseParams, min: params };
      case RuleType.MAX:
        return { ...baseParams, max: params };
      case RuleType.LENGTH:
        return { ...baseParams, length: params };
      case RuleType.PATTERN:
        return { ...baseParams, pattern: params.toString() };
      case RuleType.ENUM:
      case RuleType.IN:
      case RuleType.NOT_IN:
        return { ...baseParams, values: Array.isArray(params) ? params.join(', ') : params };
      case RuleType.BEFORE:
      case RuleType.AFTER:
        return { ...baseParams, date: params };
      case RuleType.EQUAL:
      case RuleType.NOT_EQUAL:
        return { ...baseParams, value: typeof params === 'string' && params.startsWith('$') 
          ? data[params.substring(1)] 
          : params };
      case RuleType.CUSTOM:
        return { ...baseParams, message: params.message || '自定义验证失败' };
      default:
        return baseParams;
    }
  }

  /**
   * 添加验证错误
   * @private
   * @param {Object} result - 验证结果对象
   * @param {string} field - 字段名
   * @param {string} rule - 规则名称
   * @param {Object} params - 错误参数
   */
  _addError(result, field, rule, params) {
    // 获取错误消息模板
    let messageTemplate = this.options.customMessages[`${field}.${rule}`] || 
                         this.options.customMessages[rule] ||
                         this.options.defaultMessages[rule] ||
                         this.options.defaultMessages.custom;

    // 替换消息模板中的占位符
    let message = messageTemplate;
    for (const [key, value] of Object.entries(params)) {
      message = message.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }

    // 添加错误
    result.errors.push({
      field,
      rule,
      message,
      params
    });

    // 更新验证状态
    result.valid = false;
  }

  // ===== 内置验证规则实现 =====

  /**
   * 验证数据类型
   * @private
   * @param {*} value - 待验证的值
   * @param {string|Function} type - 目标类型
   * @returns {boolean} 验证是否通过
   */
  _validateType(value, type) {
    if (typeof type === 'function') {
      return value instanceof type;
    }

    switch (type.toLowerCase()) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      case 'null':
        return value === null;
      case 'undefined':
        return value === undefined;
      case 'function':
        return typeof value === 'function';
      default:
        return false;
    }
  }

  /**
   * 验证最小值
   * @private
   * @param {*} value - 待验证的值
   * @param {number} min - 最小值
   * @returns {boolean} 验证是否通过
   */
  _validateMin(value, min) {
    if (typeof value === 'string' || Array.isArray(value)) {
      return value.length >= min;
    }
    return typeof value === 'number' && value >= min;
  }

  /**
   * 验证最大值
   * @private
   * @param {*} value - 待验证的值
   * @param {number} max - 最大值
   * @returns {boolean} 验证是否通过
   */
  _validateMax(value, max) {
    if (typeof value === 'string' || Array.isArray(value)) {
      return value.length <= max;
    }
    return typeof value === 'number' && value <= max;
  }

  /**
   * 验证长度
   * @private
   * @param {*} value - 待验证的值
   * @param {number} length - 目标长度
   * @returns {boolean} 验证是否通过
   */
  _validateLength(value, length) {
    if (typeof value === 'string' || Array.isArray(value)) {
      return value.length === length;
    }
    return false;
  }

  /**
   * 验证正则表达式模式
   * @private
   * @param {*} value - 待验证的值
   * @param {RegExp|string} pattern - 正则表达式模式
   * @returns {boolean} 验证是否通过
   */
  _validatePattern(value, pattern) {
    if (typeof value !== 'string') return false;
    
    const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
    return regex.test(value);
  }

  /**
   * 验证枚举值
   * @private
   * @param {*} value - 待验证的值
   * @param {Array} enumValues - 枚举值数组
   * @returns {boolean} 验证是否通过
   */
  _validateEnum(value, enumValues) {
    return Array.isArray(enumValues) && enumValues.includes(value);
  }

  /**
   * 验证电子邮件地址
   * @private
   * @param {*} value - 待验证的值
   * @returns {boolean} 验证是否通过
   */
  _validateEmail(value) {
    if (typeof value !== 'string') return false;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  }

  /**
   * 验证URL
   * @private
   * @param {*} value - 待验证的值
   * @returns {boolean} 验证是否通过
   */
  _validateUrl(value) {
    if (typeof value !== 'string') return false;
    
    try {
      new URL(value);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 验证日期
   * @private
   * @param {*} value - 待验证的值
   * @returns {boolean} 验证是否通过
   */
  _validateDate(value) {
    const date = new Date(value);
    return !isNaN(date.getTime()) && 
           date.toISOString().split('T')[0] === value;
  }

  /**
   * 验证时间
   * @private
   * @param {*} value - 待验证的值
   * @returns {boolean} 验证是否通过
   */
  _validateTime(value) {
    if (typeof value !== 'string') return false;
    
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
    return timeRegex.test(value);
  }

  /**
   * 验证日期时间
   * @private
   * @param {*} value - 待验证的值
   * @returns {boolean} 验证是否通过
   */
  _validateDateTime(value) {
    const date = new Date(value);
    return !isNaN(date.getTime());
  }

  /**
   * 验证日期是否早于指定日期
   * @private
   * @param {*} value - 待验证的值
   * @param {string|Date} date - 比较日期
   * @returns {boolean} 验证是否通过
   */
  _validateBefore(value, date) {
    const valueDate = new Date(value);
    const compareDate = new Date(date);
    
    return !isNaN(valueDate.getTime()) && 
           !isNaN(compareDate.getTime()) && 
           valueDate < compareDate;
  }

  /**
   * 验证日期是否晚于指定日期
   * @private
   * @param {*} value - 待验证的值
   * @param {string|Date} date - 比较日期
   * @returns {boolean} 验证是否通过
   */
  _validateAfter(value, date) {
    const valueDate = new Date(value);
    const compareDate = new Date(date);
    
    return !isNaN(valueDate.getTime()) && 
           !isNaN(compareDate.getTime()) && 
           valueDate > compareDate;
  }

  /**
   * 验证是否等于指定值
   * @private
   * @param {*} value - 待验证的值
   * @param {*} compareValue - 比较值
   * @param {Object} data - 完整数据对象
   * @returns {boolean} 验证是否通过
   */
  _validateEqual(value, compareValue, data) {
    // 如果比较值以$开头，从data中获取
    const actualCompareValue = typeof compareValue === 'string' && compareValue.startsWith('$')
      ? data[compareValue.substring(1)]
      : compareValue;
    
    return value === actualCompareValue;
  }

  /**
   * 验证是否不等于指定值
   * @private
   * @param {*} value - 待验证的值
   * @param {*} compareValue - 比较值
   * @param {Object} data - 完整数据对象
   * @returns {boolean} 验证是否通过
   */
  _validateNotEqual(value, compareValue, data) {
    // 如果比较值以$开头，从data中获取
    const actualCompareValue = typeof compareValue === 'string' && compareValue.startsWith('$')
      ? data[compareValue.substring(1)]
      : compareValue;
    
    return value !== actualCompareValue;
  }

  /**
   * 验证是否只包含字母
   * @private
   * @param {*} value - 待验证的值
   * @returns {boolean} 验证是否通过
   */
  _validateAlpha(value) {
    if (typeof value !== 'string') return false;
    
    const alphaRegex = /^[a-zA-Z]+$/;
    return alphaRegex.test(value);
  }

  /**
   * 验证是否只包含字母和数字
   * @private
   * @param {*} value - 待验证的值
   * @returns {boolean} 验证是否通过
   */
  _validateAlphaNumeric(value) {
    if (typeof value !== 'string') return false;
    
    const alphaNumericRegex = /^[a-zA-Z0-9]+$/;
    return alphaNumericRegex.test(value);
  }

  /**
   * 验证是否为数字
   * @private
   * @param {*} value - 待验证的值
   * @returns {boolean} 验证是否通过
   */
  _validateNumeric(value) {
    return typeof value === 'number' && !isNaN(value);
  }

  /**
   * 验证是否为整数
   * @private
   * @param {*} value - 待验证的值
   * @returns {boolean} 验证是否通过
   */
  _validateInteger(value) {
    return Number.isInteger(value);
  }

  /**
   * 验证是否为小数
   * @private
   * @param {*} value - 待验证的值
   * @returns {boolean} 验证是否通过
   */
  _validateDecimal(value) {
    return typeof value === 'number' && !Number.isInteger(value) && !isNaN(value);
  }

  /**
   * 验证是否为正数
   * @private
   * @param {*} value - 待验证的值
   * @returns {boolean} 验证是否通过
   */
  _validatePositive(value) {
    return typeof value === 'number' && value > 0;
  }

  /**
   * 验证是否为负数
   * @private
   * @param {*} value - 待验证的值
   * @returns {boolean} 验证是否通过
   */
  _validateNegative(value) {
    return typeof value === 'number' && value < 0;
  }

  /**
   * 验证是否为数组
   * @private
   * @param {*} value - 待验证的值
   * @param {Object} options - 数组验证选项
   * @returns {boolean} 验证是否通过
   */
  _validateArray(value, options = {}) {
    if (!Array.isArray(value)) return false;
    
    // 验证数组长度
    if (options.min !== undefined && value.length < options.min) {
      return false;
    }
    
    if (options.max !== undefined && value.length > options.max) {
      return false;
    }
    
    // 验证数组元素类型
    if (options.items) {
      for (const item of value) {
        if (!this._validateType(item, options.items)) {
          return false;
        }
      }
    }
    
    return true;
  }

  /**
   * 验证是否为对象
   * @private
   * @param {*} value - 待验证的值
   * @param {Object} schema - 对象验证模式
   * @returns {boolean} 验证是否通过
   */
  _validateObject(value, schema = {}) {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return false;
    }
    
    // 如果提供了对象模式，递归验证
    if (Object.keys(schema).length > 0) {
      const result = { valid: true, errors: [] };
      
      for (const [field, rules] of Object.entries(schema)) {
        if (value[field] !== undefined) {
          this._validateField(
            field,
            value[field],
            rules,
            value,
            result,
            { stopOnFirstError: false }
          );
        }
      }
      
      return result.valid;
    }
    
    return true;
  }

  /**
   * 验证是否为布尔值
   * @private
   * @param {*} value - 待验证的值
   * @returns {boolean} 验证是否通过
   */
  _validateBoolean(value) {
    return typeof value === 'boolean';
  }

  /**
   * 验证是否为null
   * @private
   * @param {*} value - 待验证的值
   * @returns {boolean} 验证是否通过
   */
  _validateNull(value) {
    return value === null;
  }

  /**
   * 验证是否不为null
   * @private
   * @param {*} value - 待验证的值
   * @returns {boolean} 验证是否通过
   */
  _validateNotNull(value) {
    return value !== null;
  }

  /**
   * 验证是否在指定值列表中
   * @private
   * @param {*} value - 待验证的值
   * @param {Array} values - 值列表
   * @returns {boolean} 验证是否通过
   */
  _validateIn(value, values) {
    return Array.isArray(values) && values.includes(value);
  }

  /**
   * 验证是否不在指定值列表中
   * @private
   * @param {*} value - 待验证的值
   * @param {Array} values - 值列表
   * @returns {boolean} 验证是否通过
   */
  _validateNotIn(value, values) {
    return Array.isArray(values) && !values.includes(value);
  }

  /**
   * 验证是否为有效的JSON字符串
   * @private
   * @param {*} value - 待验证的值
   * @returns {boolean} 验证是否通过
   */
  _validateJson(value) {
    if (typeof value !== 'string') return false;
    
    try {
      JSON.parse(value);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 验证是否为有效的UUID
   * @private
   * @param {*} value - 待验证的值
   * @returns {boolean} 验证是否通过
   */
  _validateUuid(value) {
    if (typeof value !== 'string') return false;
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }

  /**
   * 验证是否为有效的信用卡号
   * @private
   * @param {*} value - 待验证的值
   * @returns {boolean} 验证是否通过
   */
  _validateCreditCard(value) {
    if (typeof value !== 'string') return false;
    
    // 移除空格和连字符
    const cardNumber = value.replace(/[-\s]/g, '');
    
    // 基本格式检查
    if (!/^\d{13,19}$/.test(cardNumber)) return false;
    
    // Luhn算法验证
    let sum = 0;
    let double = false;
    
    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber.charAt(i));
      
      if (double) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      
      sum += digit;
      double = !double;
    }
    
    return sum % 10 === 0;
  }

  /**
   * 验证是否为有效的IP地址
   * @private
   * @param {*} value - 待验证的值
   * @returns {boolean} 验证是否通过
   */
  _validateIp(value) {
    if (typeof value !== 'string') return false;
    
    // IPv4 验证
    const ipv4Regex = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/;
    if (ipv4Regex.test(value)) return true;
    
    // IPv6 验证
    const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
    return ipv6Regex.test(value);
  }

  /**
   * 验证是否为有效的手机号码
   * @private
   * @param {*} value - 待验证的值
   * @param {string} region - 地区代码
   * @returns {boolean} 验证是否通过
   */
  _validateMobilePhone(value, region = 'zh-CN') {
    if (typeof value !== 'string') return false;
    
    // 移除国际区号和空格
    const phoneNumber = value.replace(/[+\s-]/g, '');
    
    switch (region.toLowerCase()) {
      case 'zh-cn': // 中国大陆
        return /^1[3-9]\d{9}$/.test(phoneNumber);
      case 'us': // 美国
        return /^1?[2-9]\d{2}[2-9]\d{2}\d{4}$/.test(phoneNumber);
      case 'uk': // 英国
        return /^(?:(?:\+|00)44|0)\s*[1-9]\d{1,4}[\s-]?\d{3,8}$/.test(phoneNumber);
      default:
        // 通用验证
        return /^[+]?[(]?[0-9]{1,4}[)]?[\s.-]?[0-9]{1,4}[\s.-]?[0-9]{1,9}$/.test(phoneNumber);
    }
  }

  /**
   * 验证是否为有效的纬度
   * @private
   * @param {*} value - 待验证的值
   * @returns {boolean} 验证是否通过
   */
  _validateLatitude(value) {
    const num = parseFloat(value);
    return !isNaN(num) && num >= -90 && num <= 90;
  }

  /**
   * 验证是否为有效的经度
   * @private
   * @param {*} value - 待验证的值
   * @returns {boolean} 验证是否通过
   */
  _validateLongitude(value) {
    const num = parseFloat(value);
    return !isNaN(num) && num >= -180 && num <= 180;
  }

  /**
   * 执行自定义验证
   * @private
   * @param {*} value - 待验证的值
   * @param {Object} options - 自定义验证选项
   * @param {Object} data - 完整数据对象
   * @param {string} field - 字段名
   * @returns {Promise<boolean>} 验证是否通过
   */
  async _validateCustom(value, options, data, field) {
    if (typeof options.validator === 'function') {
      return await options.validator(value, data, field, options);
    }
    return true;
  }

  /**
   * 获取验证规则类型枚举
   * @returns {Object} 验证规则类型枚举
   */
  static getRuleType() {
    return { ...RuleType };
  }

  /**
   * 创建验证器实例
   * @param {Object} options - 验证器选项
   * @returns {DataValidator} 验证器实例
   */
  static create(options = {}) {
    return new DataValidator(options);
  }
}

module.exports = {
  DataValidator,
  RuleType
};