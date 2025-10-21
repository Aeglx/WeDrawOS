/**
 * 数据校验组件主入口
 * 整合所有校验规则和工具
 */

const { validationResult } = require('express-validator');
const ValidationError = require('../exception/handlers/errorHandler').ValidationError;
const rules = require('./rules');

/**
 * 统一的校验中间件
 * @param {Array} validations - 校验规则数组
 */
function validate(validations) {
  return async (req, res, next) => {
    // 执行所有校验
    await Promise.all(validations.map(validation => validation.run(req)));
    
    // 获取校验结果
    const errors = validationResult(req);
    
    if (errors.isEmpty()) {
      return next();
    }
    
    // 格式化错误信息
    const formattedErrors = {};
    errors.array().forEach(error => {
      if (!formattedErrors[error.param]) {
        formattedErrors[error.param] = [];
      }
      formattedErrors[error.param].push(error.msg);
    });
    
    // 抛出校验错误
    next(new ValidationError('请求参数校验失败', formattedErrors));
  };
}

/**
 * 自定义校验器
 */
const validators = {
  /**
   * 验证是否为有效的URL
   * @param {string} value - 要验证的值
   * @returns {boolean} 是否有效
   */
  isUrl: (value) => {
    try {
      new URL(value);
      return true;
    } catch (e) {
      return false;
    }
  },
  
  /**
   * 验证是否为有效的邮箱
   * @param {string} value - 要验证的值
   * @returns {boolean} 是否有效
   */
  isEmail: (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },
  
  /**
   * 验证是否为有效的手机号（中国大陆）
   * @param {string} value - 要验证的值
   * @returns {boolean} 是否有效
   */
  isPhone: (value) => {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(value);
  },
  
  /**
   * 验证是否为有效的身份证号（中国大陆）
   * @param {string} value - 要验证的值
   * @returns {boolean} 是否有效
   */
  isIdCard: (value) => {
    const idCardRegex = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
    return idCardRegex.test(value);
  }
};

module.exports = {
  validate,
  validators,
  rules
};