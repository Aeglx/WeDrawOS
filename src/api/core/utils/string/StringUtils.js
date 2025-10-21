/**
 * 字符串工具
 * 提供字符串操作和格式化功能
 */

const logger = require('../logger');
const { AppError } = require('../../exception/handlers/errorHandler');
const { StringError } = require('../../exception/handlers/errorHandler');

/**
 * 字符串工具类
 */
class StringUtils {
  /**
   * 构造函数
   */
  constructor() {
    // 预定义的正则表达式
    this.regex = {
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
      phone: /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/,
      ipv4: /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/,
      ipv6: /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4})$/,
      date: /^\d{4}-\d{2}-\d{2}$/,
      time: /^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/,
      datetime: /^\d{4}-\d{2}-\d{2}([T ])([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9](\.[0-9]+)?(Z)?$/,
      number: /^[-+]?\d*\.?\d+$/,
      integer: /^[-+]?\d+$/,
      hexColor: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
      uuid: /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/,
      base64: /^[A-Za-z0-9+/]+=*$/,
      strongPassword: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      camelCase: /^[a-z][a-zA-Z0-9]*$/,
      pascalCase: /^[A-Z][a-zA-Z0-9]*$/,
      snakeCase: /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/,
      kebabCase: /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/,
      htmlTag: /<[^>]*>/g,
      whitespace: /\s+/g,
      punctuation: /[!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]/g,
      chinese: /[\u4e00-\u9fa5]/,
      emoji: /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u
    };
    
    logger.debug('字符串工具初始化完成');
  }

  /**
   * 检查字符串是否为空
   * @param {string} str - 要检查的字符串
   * @returns {boolean} 是否为空
   */
  isEmpty(str) {
    return str === null || str === undefined || str.trim() === '';
  }

  /**
   * 检查字符串是否为空白
   * @param {string} str - 要检查的字符串
   * @returns {boolean} 是否为空白
   */
  isBlank(str) {
    return str === null || str === undefined || /^\s*$/.test(str);
  }

  /**
   * 检查字符串是否非空
   * @param {string} str - 要检查的字符串
   * @returns {boolean} 是否非空
   */
  isNotEmpty(str) {
    return !this.isEmpty(str);
  }

  /**
   * 检查字符串是否非空白
   * @param {string} str - 要检查的字符串
   * @returns {boolean} 是否非空白
   */
  isNotBlank(str) {
    return !this.isBlank(str);
  }

  /**
   * 截断字符串
   * @param {string} str - 要截断的字符串
   * @param {number} length - 最大长度
   * @param {string} suffix - 后缀
   * @returns {string} 截断后的字符串
   */
  truncate(str, length, suffix = '...') {
    if (this.isEmpty(str) || str.length <= length) {
      return str || '';
    }
    return str.substring(0, length - suffix.length) + suffix;
  }

  /**
   * 首字母大写
   * @param {string} str - 要转换的字符串
   * @returns {string} 转换后的字符串
   */
  capitalize(str) {
    if (this.isEmpty(str)) {
      return str || '';
    }
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  /**
   * 首字母小写
   * @param {string} str - 要转换的字符串
   * @returns {string} 转换后的字符串
   */
  decapitalize(str) {
    if (this.isEmpty(str)) {
      return str || '';
    }
    return str.charAt(0).toLowerCase() + str.slice(1);
  }

  /**
   * 驼峰命名法转下划线命名法
   * @param {string} str - 要转换的字符串
   * @returns {string} 转换后的字符串
   */
  camelToSnake(str) {
    if (this.isEmpty(str)) {
      return str || '';
    }
    return str.replace(/([A-Z])/g, '_$1').toLowerCase();
  }

  /**
   * 下划线命名法转驼峰命名法
   * @param {string} str - 要转换的字符串
   * @returns {string} 转换后的字符串
   */
  snakeToCamel(str) {
    if (this.isEmpty(str)) {
      return str || '';
    }
    return str.replace(/_([a-z])/g, g => g[1].toUpperCase());
  }

  /**
   * 驼峰命名法转短横线命名法
   * @param {string} str - 要转换的字符串
   * @returns {string} 转换后的字符串
   */
  camelToKebab(str) {
    if (this.isEmpty(str)) {
      return str || '';
    }
    return str.replace(/([A-Z])/g, '-$1').toLowerCase();
  }

  /**
   * 短横线命名法转驼峰命名法
   * @param {string} str - 要转换的字符串
   * @returns {string} 转换后的字符串
   */
  kebabToCamel(str) {
    if (this.isEmpty(str)) {
      return str || '';
    }
    return str.replace(/-([a-z])/g, g => g[1].toUpperCase());
  }

  /**
   * 下划线命名法转短横线命名法
   * @param {string} str - 要转换的字符串
   * @returns {string} 转换后的字符串
   */
  snakeToKebab(str) {
    if (this.isEmpty(str)) {
      return str || '';
    }
    return str.replace(/_/g, '-');
  }

  /**
   * 短横线命名法转下划线命名法
   * @param {string} str - 要转换的字符串
   * @returns {string} 转换后的字符串
   */
  kebabToSnake(str) {
    if (this.isEmpty(str)) {
      return str || '';
    }
    return str.replace(/-/g, '_');
  }

  /**
   * 驼峰命名法转帕斯卡命名法
   * @param {string} str - 要转换的字符串
   * @returns {string} 转换后的字符串
   */
  camelToPascal(str) {
    if (this.isEmpty(str)) {
      return str || '';
    }
    return this.capitalize(str);
  }

  /**
   * 帕斯卡命名法转驼峰命名法
   * @param {string} str - 要转换的字符串
   * @returns {string} 转换后的字符串
   */
  pascalToCamel(str) {
    if (this.isEmpty(str)) {
      return str || '';
    }
    return this.decapitalize(str);
  }

  /**
   * 移除字符串中的HTML标签
   * @param {string} str - 要处理的字符串
   * @returns {string} 处理后的字符串
   */
  stripHtml(str) {
    if (this.isEmpty(str)) {
      return str || '';
    }
    return str.replace(this.regex.htmlTag, '');
  }

  /**
   * 转义HTML特殊字符
   * @param {string} str - 要转义的字符串
   * @returns {string} 转义后的字符串
   */
  escapeHtml(str) {
    if (this.isEmpty(str)) {
      return str || '';
    }
    const escapeMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return str.replace(/[&<>"']/g, char => escapeMap[char]);
  }

  /**
   * 反转义HTML特殊字符
   * @param {string} str - 要反转义的字符串
   * @returns {string} 反转义后的字符串
   */
  unescapeHtml(str) {
    if (this.isEmpty(str)) {
      return str || '';
    }
    const unescapeMap = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'"
    };
    return str.replace(/&amp;|&lt;|&gt;|&quot;|&#39;/g, entity => unescapeMap[entity]);
  }

  /**
   * 生成指定长度的随机字符串
   * @param {number} length - 字符串长度
   * @param {string} chars - 字符集
   * @returns {string} 随机字符串
   */
  randomString(length = 16, chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
    let result = '';
    const charsLength = chars.length;
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * charsLength));
    }
    
    return result;
  }

  /**
   * 生成随机字母数字字符串
   * @param {number} length - 字符串长度
   * @returns {string} 随机字符串
   */
  randomAlphanumeric(length = 16) {
    return this.randomString(length, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789');
  }

  /**
   * 生成随机数字字符串
   * @param {number} length - 字符串长度
   * @returns {string} 随机字符串
   */
  randomNumeric(length = 8) {
    return this.randomString(length, '0123456789');
  }

  /**
   * 生成随机大写字母字符串
   * @param {number} length - 字符串长度
   * @returns {string} 随机字符串
   */
  randomUppercase(length = 8) {
    return this.randomString(length, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ');
  }

  /**
   * 生成随机小写字母字符串
   * @param {number} length - 字符串长度
   * @returns {string} 随机字符串
   */
  randomLowercase(length = 8) {
    return this.randomString(length, 'abcdefghijklmnopqrstuvwxyz');
  }

  /**
   * 生成随机密码
   * @param {number} length - 密码长度
   * @param {Object} options - 密码选项
   * @returns {string} 随机密码
   */
  randomPassword(length = 12, options = {}) {
    const { 
      useUppercase = true, 
      useLowercase = true, 
      useNumbers = true, 
      useSymbols = true 
    } = options;
    
    let chars = '';
    if (useUppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (useLowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (useNumbers) chars += '0123456789';
    if (useSymbols) chars += '!@#$%^&*()-_=+[]{}|;:,.<>?';
    
    if (!chars) {
      chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    }
    
    let password = this.randomString(length, chars);
    
    // 确保密码包含所有要求的字符类型
    if (useUppercase && !/[A-Z]/.test(password)) {
      password = password.replace(/[a-z0-9!@#$%^&*()-_=+\[\]{}|;:,.<>?]/, 'A');
    }
    if (useLowercase && !/[a-z]/.test(password)) {
      password = password.replace(/[A-Z0-9!@#$%^&*()-_=+\[\]{}|;:,.<>?]/, 'a');
    }
    if (useNumbers && !/[0-9]/.test(password)) {
      password = password.replace(/[A-Za-z!@#$%^&*()-_=+\[\]{}|;:,.<>?]/, '0');
    }
    if (useSymbols && !/[!@#$%^&*()-_=+\[\]{}|;:,.<>?]/.test(password)) {
      password = password.replace(/[A-Za-z0-9]/, '!');
    }
    
    return password;
  }

  /**
   * 格式化数字为千分位格式
   * @param {number|string} num - 数字
   * @param {Object} options - 格式化选项
   * @returns {string} 格式化后的字符串
   */
  formatNumber(num, options = {}) {
    const { 
      decimals = 0, 
      decimalSeparator = '.', 
      thousandSeparator = ',' 
    } = options;
    
    if (num === null || num === undefined) {
      return '0';
    }
    
    const n = Number(num);
    if (isNaN(n)) {
      return '0';
    }
    
    return n.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).replace(/\./g, decimalSeparator).replace(/,/g, thousandSeparator);
  }

  /**
   * 格式化货币
   * @param {number|string} amount - 金额
   * @param {Object} options - 格式化选项
   * @returns {string} 格式化后的字符串
   */
  formatCurrency(amount, options = {}) {
    const { 
      currency = 'CNY', 
      locale = 'zh-CN',
      style = 'currency',
      ...restOptions 
    } = options;
    
    if (amount === null || amount === undefined) {
      return '0';
    }
    
    const n = Number(amount);
    if (isNaN(n)) {
      return '0';
    }
    
    return new Intl.NumberFormat(locale, {
      style,
      currency,
      ...restOptions
    }).format(n);
  }

  /**
   * 检查字符串是否包含子字符串
   * @param {string} str - 原始字符串
   * @param {string} search - 要搜索的子字符串
   * @param {Object} options - 搜索选项
   * @returns {boolean} 是否包含
   */
  contains(str, search, options = {}) {
    if (this.isEmpty(str) || this.isEmpty(search)) {
      return false;
    }
    
    const { ignoreCase = false } = options;
    
    if (ignoreCase) {
      return str.toLowerCase().includes(search.toLowerCase());
    }
    
    return str.includes(search);
  }

  /**
   * 计算字符串相似度
   * @param {string} str1 - 第一个字符串
   * @param {string} str2 - 第二个字符串
   * @returns {number} 相似度（0-1之间）
   */
  similarity(str1, str2) {
    if (this.isEmpty(str1) || this.isEmpty(str2)) {
      return 0;
    }
    
    // 使用Levenshtein距离算法
    const m = str1.length;
    const n = str2.length;
    const dp = Array(m + 1).fill().map(() => Array(n + 1).fill(0));
    
    for (let i = 0; i <= m; i++) {
      dp[i][0] = i;
    }
    
    for (let j = 0; j <= n; j++) {
      dp[0][j] = j;
    }
    
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,     // 删除
          dp[i][j - 1] + 1,     // 插入
          dp[i - 1][j - 1] + cost // 替换
        );
      }
    }
    
    // 计算相似度
    const maxLength = Math.max(m, n);
    return (maxLength - dp[m][n]) / maxLength;
  }

  /**
   * 验证字符串是否匹配正则表达式
   * @param {string} str - 要验证的字符串
   * @param {RegExp|string} pattern - 正则表达式或预定义模式名
   * @returns {boolean} 是否匹配
   */
  matches(str, pattern) {
    if (this.isEmpty(str)) {
      return false;
    }
    
    if (pattern instanceof RegExp) {
      return pattern.test(str);
    }
    
    if (typeof pattern === 'string' && this.regex[pattern]) {
      return this.regex[pattern].test(str);
    }
    
    throw new StringError('无效的正则表达式模式', {
      code: 'INVALID_PATTERN',
      pattern
    });
  }

  /**
   * 验证电子邮件格式
   * @param {string} email - 电子邮件地址
   * @returns {boolean} 是否有效
   */
  isValidEmail(email) {
    return this.matches(email, 'email');
  }

  /**
   * 验证URL格式
   * @param {string} url - URL地址
   * @returns {boolean} 是否有效
   */
  isValidUrl(url) {
    return this.matches(url, 'url');
  }

  /**
   * 验证手机号码格式
   * @param {string} phone - 手机号码
   * @returns {boolean} 是否有效
   */
  isValidPhone(phone) {
    return this.matches(phone, 'phone');
  }

  /**
   * 验证日期格式 (YYYY-MM-DD)
   * @param {string} date - 日期字符串
   * @returns {boolean} 是否有效
   */
  isValidDate(date) {
    if (!this.matches(date, 'date')) {
      return false;
    }
    
    // 进一步验证日期有效性
    const [year, month, day] = date.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
  }

  /**
   * 验证密码强度
   * @param {string} password - 密码
   * @returns {Object} 密码强度信息
   */
  checkPasswordStrength(password) {
    if (this.isEmpty(password)) {
      return { strength: 'weak', score: 0, feedback: '密码不能为空' };
    }
    
    let score = 0;
    
    // 长度检查
    if (password.length >= 8) score += 25;
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 5;
    
    // 包含小写字母
    if (/[a-z]/.test(password)) score += 10;
    
    // 包含大写字母
    if (/[A-Z]/.test(password)) score += 10;
    
    // 包含数字
    if (/[0-9]/.test(password)) score += 10;
    
    // 包含特殊字符
    if (/[^A-Za-z0-9]/.test(password)) score += 20;
    
    // 多种字符类型
    const charTypes = [
      /[a-z]/.test(password),
      /[A-Z]/.test(password),
      /[0-9]/.test(password),
      /[^A-Za-z0-9]/.test(password)
    ].filter(Boolean).length;
    
    score += (charTypes - 1) * 5;
    
    // 强度评级
    let strength, feedback;
    if (score < 30) {
      strength = 'weak';
      feedback = '密码强度弱，请增加长度和复杂性';
    } else if (score < 60) {
      strength = 'medium';
      feedback = '密码强度中等，可以添加更多特殊字符';
    } else {
      strength = 'strong';
      feedback = '密码强度强';
    }
    
    return { strength, score, feedback };
  }

  /**
   * 脱敏处理
   * @param {string} str - 要脱敏的字符串
   * @param {Object} options - 脱敏选项
   * @returns {string} 脱敏后的字符串
   */
  mask(str, options = {}) {
    if (this.isEmpty(str)) {
      return str || '';
    }
    
    const { 
      type = 'custom', 
      start = 0, 
      end = str.length, 
      maskChar = '*',
      maskLength = 4 
    } = options;
    
    switch (type) {
      case 'email':
        // 电子邮件脱敏
        const emailParts = str.split('@');
        if (emailParts.length === 2) {
          const username = emailParts[0];
          const domain = emailParts[1];
          if (username.length <= 3) {
            return `${username.charAt(0)}***@${domain}`;
          } else {
            const maskedUsername = username.slice(0, 3) + '*'.repeat(Math.min(username.length - 3, 5));
            return `${maskedUsername}@${domain}`;
          }
        }
        break;
        
      case 'phone':
        // 手机号脱敏
        if (str.length >= 11) {
          return str.slice(0, 3) + '*'.repeat(4) + str.slice(-4);
        }
        break;
        
      case 'idcard':
        // 身份证脱敏
        if (str.length >= 15) {
          return str.slice(0, 6) + '*'.repeat(Math.min(str.length - 10, 8)) + str.slice(-4);
        }
        break;
        
      case 'custom':
      default:
        // 自定义脱敏
        const actualStart = Math.max(0, Math.min(start, str.length));
        const actualEnd = Math.max(0, Math.min(end, str.length));
        
        if (actualStart >= actualEnd) {
          return str;
        }
        
        const visibleStart = str.slice(0, actualStart);
        const visibleEnd = str.slice(actualEnd);
        const maskLengthActual = actualEnd - actualStart;
        
        return visibleStart + maskChar.repeat(maskLengthActual) + visibleEnd;
    }
    
    return str;
  }

  /**
   * 填充字符串
   * @param {string} str - 要填充的字符串
   * @param {number} length - 目标长度
   * @param {string} padChar - 填充字符
   * @param {string} padPosition - 填充位置 ('left', 'right', 'both')
   * @returns {string} 填充后的字符串
   */
  pad(str, length, padChar = ' ', padPosition = 'left') {
    str = str || '';
    
    if (str.length >= length) {
      return str;
    }
    
    const padLength = length - str.length;
    const pad = padChar.repeat(padLength);
    
    switch (padPosition) {
      case 'right':
        return str + pad;
      case 'both':
        const leftPad = Math.floor(padLength / 2);
        const rightPad = padLength - leftPad;
        return pad.slice(0, leftPad) + str + pad.slice(0, rightPad);
      case 'left':
      default:
        return pad + str;
    }
  }

  /**
   * 左填充
   * @param {string} str - 要填充的字符串
   * @param {number} length - 目标长度
   * @param {string} padChar - 填充字符
   * @returns {string} 填充后的字符串
   */
  padLeft(str, length, padChar = ' ') {
    return this.pad(str, length, padChar, 'left');
  }

  /**
   * 右填充
   * @param {string} str - 要填充的字符串
   * @param {number} length - 目标长度
   * @param {string} padChar - 填充字符
   * @returns {string} 填充后的字符串
   */
  padRight(str, length, padChar = ' ') {
    return this.pad(str, length, padChar, 'right');
  }

  /**
   * 去除字符串两端的空白字符
   * @param {string} str - 要处理的字符串
   * @returns {string} 处理后的字符串
   */
  trim(str) {
    if (str === null || str === undefined) {
      return '';
    }
    return str.trim();
  }

  /**
   * 去除字符串左侧的空白字符
   * @param {string} str - 要处理的字符串
   * @returns {string} 处理后的字符串
   */
  trimLeft(str) {
    if (str === null || str === undefined) {
      return '';
    }
    return str.trimLeft();
  }

  /**
   * 去除字符串右侧的空白字符
   * @param {string} str - 要处理的字符串
   * @returns {string} 处理后的字符串
   */
  trimRight(str) {
    if (str === null || str === undefined) {
      return '';
    }
    return str.trimRight();
  }

  /**
   * 重复字符串
   * @param {string} str - 要重复的字符串
   * @param {number} times - 重复次数
   * @returns {string} 重复后的字符串
   */
  repeat(str, times) {
    if (str === null || str === undefined) {
      return '';
    }
    return str.repeat(times);
  }

  /**
   * 替换字符串中的所有匹配项
   * @param {string} str - 原始字符串
   * @param {string|RegExp} search - 搜索模式
   * @param {string|Function} replace - 替换内容
   * @returns {string} 替换后的字符串
   */
  replaceAll(str, search, replace) {
    if (this.isEmpty(str)) {
      return str || '';
    }
    
    if (typeof search === 'string') {
      // 使用String.prototype.replaceAll
      if (str.replaceAll) {
        return str.replaceAll(search, replace);
      } else {
        // 兼容旧版Node.js
        return str.split(search).join(replace);
      }
    }
    
    return str.replace(search, replace);
  }

  /**
   * 将字符串拆分为数组
   * @param {string} str - 要拆分的字符串
   * @param {string|RegExp} separator - 分隔符
   * @param {Object} options - 拆分选项
   * @returns {Array} 拆分后的数组
   */
  split(str, separator = ',', options = {}) {
    if (this.isEmpty(str)) {
      return [];
    }
    
    const { limit = undefined, trim = true, filterEmpty = true } = options;
    
    let result = str.split(separator, limit);
    
    if (trim) {
      result = result.map(item => item.trim());
    }
    
    if (filterEmpty) {
      result = result.filter(item => item !== '');
    }
    
    return result;
  }

  /**
   * 格式化字符串模板
   * @param {string} template - 字符串模板
   * @param {Object} data - 数据对象
   * @param {RegExp} pattern - 模板模式
   * @returns {string} 格式化后的字符串
   */
  format(template, data, pattern = /\{([^{}]*)\}/g) {
    if (this.isEmpty(template)) {
      return template || '';
    }
    
    if (!data || typeof data !== 'object') {
      return template;
    }
    
    return template.replace(pattern, (match, key) => {
      const value = data[key];
      return value !== undefined && value !== null ? String(value) : match;
    });
  }

  /**
   * 统计字符串中指定字符的出现次数
   * @param {string} str - 原始字符串
   * @param {string|RegExp} char - 要统计的字符或正则表达式
   * @returns {number} 出现次数
   */
  countOccurrences(str, char) {
    if (this.isEmpty(str)) {
      return 0;
    }
    
    if (char instanceof RegExp) {
      const matches = str.match(char);
      return matches ? matches.length : 0;
    }
    
    return str.split(char).length - 1;
  }

  /**
   * 获取字符串的字节长度
   * @param {string} str - 字符串
   * @param {string} encoding - 编码方式
   * @returns {number} 字节长度
   */
  byteLength(str, encoding = 'utf8') {
    if (this.isEmpty(str)) {
      return 0;
    }
    return Buffer.byteLength(str, encoding);
  }

  /**
   * 静态实例
   * @private
   */
  static _instance = null;

  /**
   * 获取单例实例
   * @returns {StringUtils} 字符串工具实例
   */
  static getInstance() {
    if (!StringUtils._instance) {
      StringUtils._instance = new StringUtils();
    }
    return StringUtils._instance;
  }

  /**
   * 创建新的字符串工具实例
   * @returns {StringUtils} 字符串工具实例
   */
  static create() {
    return new StringUtils();
  }
}

// 创建默认实例
const defaultStringUtils = StringUtils.getInstance();

module.exports = {
  StringUtils,
  stringUtils: defaultStringUtils
};