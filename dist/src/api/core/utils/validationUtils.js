/**
 * 验证工具类模块
 * 提供各种数据验证和校验功能
 */

/**
 * 检查值是否为有效数字
 * @param {*} value - 要检查的值
 * @returns {boolean} 是否为有效数字
 */
const isValidNumber = (value) => {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
};

/**
 * 检查值是否为整数
 * @param {*} value - 要检查的值
 * @returns {boolean} 是否为整数
 */
const isInteger = (value) => {
  return Number.isInteger(value);
};

/**
 * 检查值是否为浮点数
 * @param {*} value - 要检查的值
 * @returns {boolean} 是否为浮点数
 */
const isFloat = (value) => {
  return isValidNumber(value) && !isInteger(value);
};

/**
 * 检查数字是否在指定范围内
 * @param {number} value - 要检查的数字
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @param {boolean} inclusive - 是否包含边界值，默认为true
 * @returns {boolean} 是否在范围内
 */
const isInRange = (value, min, max, inclusive = true) => {
  if (!isValidNumber(value) || !isValidNumber(min) || !isValidNumber(max)) {
    return false;
  }
  
  if (inclusive) {
    return value >= min && value <= max;
  }
  
  return value > min && value < max;
};

/**
 * 检查字符串是否为空
 * @param {string} str - 要检查的字符串
 * @returns {boolean} 是否为空字符串
 */
const isEmptyString = (str) => {
  return typeof str !== 'string' || str.trim().length === 0;
};

/**
 * 检查字符串长度是否在指定范围内
 * @param {string} str - 要检查的字符串
 * @param {number} minLength - 最小长度
 * @param {number} maxLength - 最大长度
 * @returns {boolean} 长度是否在范围内
 */
const isLengthValid = (str, minLength, maxLength) => {
  if (typeof str !== 'string') {
    return false;
  }
  
  const length = str.length;
  return length >= minLength && length <= maxLength;
};

/**
 * 检查是否为有效的电子邮箱格式
 * @param {string} email - 要检查的电子邮箱
 * @returns {boolean} 是否为有效邮箱
 */
const isValidEmail = (email) => {
  if (typeof email !== 'string') {
    return false;
  }
  
  // 使用更严格的邮箱验证正则表达式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * 检查是否为有效的手机号格式（中国大陆）
 * @param {string|number} phone - 要检查的手机号
 * @returns {boolean} 是否为有效手机号
 */
const isValidPhoneNumber = (phone) => {
  const phoneStr = String(phone);
  // 中国大陆手机号验证，1开头的11位数字
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phoneStr);
};

/**
 * 检查是否为有效的URL格式
 * @param {string} url - 要检查的URL
 * @returns {boolean} 是否为有效URL
 */
const isValidUrl = (url) => {
  if (typeof url !== 'string') {
    return false;
  }
  
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * 检查是否为有效的HTTP/HTTPS URL
 * @param {string} url - 要检查的URL
 * @returns {boolean} 是否为有效HTTP/HTTPS URL
 */
const isValidHttpUrl = (url) => {
  if (typeof url !== 'string') {
    return false;
  }
  
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch (error) {
    return false;
  }
};

/**
 * 检查是否为有效的IP地址（IPv4）
 * @param {string} ip - 要检查的IP地址
 * @returns {boolean} 是否为有效IPv4地址
 */
const isValidIpv4 = (ip) => {
  if (typeof ip !== 'string') {
    return false;
  }
  
  const ipRegex = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipRegex.test(ip);
};

/**
 * 检查是否为有效的身份证号（中国大陆）
 * @param {string} idCard - 要检查的身份证号
 * @returns {boolean} 是否为有效身份证号
 */
const isValidIdCard = (idCard) => {
  if (typeof idCard !== 'string') {
    return false;
  }
  
  // 简单的18位身份证号格式验证
  const idCardRegex = /^[1-9]\d{5}(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/;
  
  if (!idCardRegex.test(idCard)) {
    return false;
  }
  
  // 校验码验证（简单实现）
  const factors = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  const codes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
  
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    sum += parseInt(idCard[i]) * factors[i];
  }
  
  const checkCode = codes[sum % 11];
  return idCard[17].toUpperCase() === checkCode;
};

/**
 * 检查是否为有效的银行卡号
 * @param {string|number} cardNumber - 要检查的银行卡号
 * @returns {boolean} 是否为有效银行卡号
 */
const isValidBankCard = (cardNumber) => {
  const cardStr = String(cardNumber).replace(/\s/g, '');
  
  // 银行卡号一般为16-19位数字
  if (!/^\d{16,19}$/.test(cardStr)) {
    return false;
  }
  
  // Luhn算法验证
  let sum = 0;
  let isEven = false;
  
  for (let i = cardStr.length - 1; i >= 0; i--) {
    let digit = parseInt(cardStr[i]);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
};

/**
 * 检查密码强度
 * @param {string} password - 要检查的密码
 * @returns {object} 包含强度和提示的对象
 */
const checkPasswordStrength = (password) => {
  if (typeof password !== 'string') {
    return {
      strength: 0,
      message: '无效的密码',
      score: 0
    };
  }
  
  let score = 0;
  const feedback = [];
  
  // 密码长度检查
  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('密码长度应至少为8位');
  }
  
  if (password.length >= 12) {
    score += 1;
  }
  
  // 包含数字
  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push('密码应包含数字');
  }
  
  // 包含小写字母
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('密码应包含小写字母');
  }
  
  // 包含大写字母
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('密码应包含大写字母');
  }
  
  // 包含特殊字符
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1;
  } else {
    feedback.push('密码应包含特殊字符');
  }
  
  // 计算强度
  let strength = '弱';
  if (score >= 5) {
    strength = '强';
  } else if (score >= 3) {
    strength = '中';
  }
  
  return {
    strength,
    message: feedback.length > 0 ? feedback.join('；') : '密码强度良好',
    score
  };
};

/**
 * 验证密码是否符合要求
 * @param {string} password - 要验证的密码
 * @param {object} options - 验证选项
 * @param {number} options.minLength - 最小长度
 * @param {boolean} options.requireUppercase - 是否需要大写字母
 * @param {boolean} options.requireLowercase - 是否需要小写字母
 * @param {boolean} options.requireNumbers - 是否需要数字
 * @param {boolean} options.requireSpecialChars - 是否需要特殊字符
 * @returns {object} 验证结果
 */
const validatePassword = (password, options = {}) => {
  const defaultOptions = {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true
  };
  
  const config = { ...defaultOptions, ...options };
  const errors = [];
  
  if (typeof password !== 'string') {
    return { isValid: false, errors: ['密码必须是字符串'] };
  }
  
  if (password.length < config.minLength) {
    errors.push(`密码长度至少为${config.minLength}位`);
  }
  
  if (config.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('密码必须包含大写字母');
  }
  
  if (config.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('密码必须包含小写字母');
  }
  
  if (config.requireNumbers && !/\d/.test(password)) {
    errors.push('密码必须包含数字');
  }
  
  if (config.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('密码必须包含特殊字符');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * 验证用户名是否合法
 * @param {string} username - 要验证的用户名
 * @param {object} options - 验证选项
 * @returns {object} 验证结果
 */
const validateUsername = (username, options = {}) => {
  const defaultOptions = {
    minLength: 3,
    maxLength: 20,
    allowChinese: true,
    allowUnderscore: true,
    allowHyphen: true
  };
  
  const config = { ...defaultOptions, ...options };
  const errors = [];
  
  if (typeof username !== 'string') {
    return { isValid: false, errors: ['用户名必须是字符串'] };
  }
  
  const trimmed = username.trim();
  if (trimmed.length !== username.length) {
    errors.push('用户名首尾不能有空格');
  }
  
  if (trimmed.length < config.minLength) {
    errors.push(`用户名长度至少为${config.minLength}位`);
  }
  
  if (trimmed.length > config.maxLength) {
    errors.push(`用户名长度不能超过${config.maxLength}位`);
  }
  
  // 构建允许的字符正则表达式
  let pattern = '^[a-zA-Z0-9';
  
  if (config.allowChinese) {
    pattern += '\u4e00-\u9fa5';
  }
  
  if (config.allowUnderscore) {
    pattern += '_';
  }
  
  if (config.allowHyphen) {
    pattern += '-';
  }
  
  pattern += ']+$';
  
  const regex = new RegExp(pattern);
  if (!regex.test(trimmed)) {
    errors.push('用户名包含非法字符');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * 检查是否为有效的日期字符串
 * @param {string} dateStr - 要检查的日期字符串
 * @returns {boolean} 是否为有效日期
 */
const isValidDate = (dateStr) => {
  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date.getTime());
};

/**
 * 检查是否为有效的JSON字符串
 * @param {string} jsonStr - 要检查的JSON字符串
 * @returns {boolean} 是否为有效JSON
 */
const isValidJSON = (jsonStr) => {
  if (typeof jsonStr !== 'string') {
    return false;
  }
  
  try {
    JSON.parse(jsonStr);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * 检查字符串是否只包含字母
 * @param {string} str - 要检查的字符串
 * @returns {boolean} 是否只包含字母
 */
const isAlphabetic = (str) => {
  if (typeof str !== 'string') {
    return false;
  }
  
  return /^[a-zA-Z]+$/.test(str);
};

/**
 * 检查字符串是否只包含字母和数字
 * @param {string} str - 要检查的字符串
 * @returns {boolean} 是否只包含字母和数字
 */
const isAlphanumeric = (str) => {
  if (typeof str !== 'string') {
    return false;
  }
  
  return /^[a-zA-Z0-9]+$/.test(str);
};

/**
 * 检查字符串是否只包含数字
 * @param {string} str - 要检查的字符串
 * @returns {boolean} 是否只包含数字
 */
const isNumeric = (str) => {
  if (typeof str !== 'string') {
    return false;
  }
  
  return /^\d+$/.test(str);
};

/**
 * 检查值是否为有效的布尔值
 * @param {*} value - 要检查的值
 * @returns {boolean} 是否为有效布尔值
 */
const isValidBoolean = (value) => {
  return typeof value === 'boolean';
};

/**
 * 检查值是否为有效的数组
 * @param {*} value - 要检查的值
 * @param {number} minLength - 最小长度
 * @returns {boolean} 是否为有效数组
 */
const isValidArray = (value, minLength = 0) => {
  return Array.isArray(value) && value.length >= minLength;
};

/**
 * 检查值是否为有效的对象
 * @param {*} value - 要检查的值
 * @returns {boolean} 是否为有效对象
 */
const isValidObject = (value) => {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
};

/**
 * 检查两个密码是否一致
 * @param {string} password - 第一个密码
 * @param {string} confirmPassword - 确认密码
 * @returns {boolean} 是否一致
 */
const passwordsMatch = (password, confirmPassword) => {
  return password === confirmPassword;
};

/**
 * 使用自定义正则表达式验证字符串
 * @param {string} str - 要验证的字符串
 * @param {RegExp} regex - 正则表达式
 * @returns {boolean} 是否匹配
 */
const matchesRegex = (str, regex) => {
  if (typeof str !== 'string' || !(regex instanceof RegExp)) {
    return false;
  }
  
  return regex.test(str);
};

module.exports = {
  isValidNumber,
  isInteger,
  isFloat,
  isInRange,
  isEmptyString,
  isLengthValid,
  isValidEmail,
  isValidPhoneNumber,
  isValidUrl,
  isValidHttpUrl,
  isValidIpv4,
  isValidIdCard,
  isValidBankCard,
  checkPasswordStrength,
  validatePassword,
  validateUsername,
  isValidDate,
  isValidJSON,
  isAlphabetic,
  isAlphanumeric,
  isNumeric,
  isValidBoolean,
  isValidArray,
  isValidObject,
  passwordsMatch,
  matchesRegex
};