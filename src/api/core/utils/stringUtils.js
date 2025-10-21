/**
 * 字符串工具类
 * 提供字符串处理和格式化功能
 */

class StringUtils {
  /**
   * 检查字符串是否为空
   * @param {string} str - 要检查的字符串
   * @returns {boolean} 是否为空
   */
  static isEmpty(str) {
    return str === undefined || str === null || str.trim() === '';
  }

  /**
   * 检查字符串是否不为空
   * @param {string} str - 要检查的字符串
   * @returns {boolean} 是否不为空
   */
  static isNotEmpty(str) {
    return !this.isEmpty(str);
  }

  /**
   * 去除字符串两端空格
   * @param {string} str - 要处理的字符串
   * @returns {string} 处理后的字符串
   */
  static trim(str) {
    return str ? str.trim() : '';
  }

  /**
   * 去除字符串左侧空格
   * @param {string} str - 要处理的字符串
   * @returns {string} 处理后的字符串
   */
  static ltrim(str) {
    return str ? str.replace(/^\s+/, '') : '';
  }

  /**
   * 去除字符串右侧空格
   * @param {string} str - 要处理的字符串
   * @returns {string} 处理后的字符串
   */
  static rtrim(str) {
    return str ? str.replace(/\s+$/, '') : '';
  }

  /**
   * 将字符串转换为小写
   * @param {string} str - 要转换的字符串
   * @returns {string} 小写字符串
   */
  static toLowerCase(str) {
    return str ? str.toLowerCase() : '';
  }

  /**
   * 将字符串转换为大写
   * @param {string} str - 要转换的字符串
   * @returns {string} 大写字符串
   */
  static toUpperCase(str) {
    return str ? str.toUpperCase() : '';
  }

  /**
   * 将字符串首字母大写
   * @param {string} str - 要转换的字符串
   * @returns {string} 首字母大写的字符串
   */
  static capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  /**
   * 将字符串首字母小写
   * @param {string} str - 要转换的字符串
   * @returns {string} 首字母小写的字符串
   */
  static uncapitalize(str) {
    if (!str) return '';
    return str.charAt(0).toLowerCase() + str.slice(1);
  }

  /**
   * 驼峰命名转下划线命名
   * @param {string} str - 驼峰命名的字符串
   * @returns {string} 下划线命名的字符串
   */
  static camelToSnake(str) {
    if (!str) return '';
    return str
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '');
  }

  /**
   * 下划线命名转驼峰命名
   * @param {string} str - 下划线命名的字符串
   * @param {boolean} pascalCase - 是否使用帕斯卡命名法（首字母大写）
   * @returns {string} 驼峰命名的字符串
   */
  static snakeToCamel(str, pascalCase = false) {
    if (!str) return '';
    
    const result = str
      .toLowerCase()
      .replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    
    return pascalCase ? this.capitalize(result) : result;
  }

  /**
   * 截断字符串
   * @param {string} str - 要截断的字符串
   * @param {number} maxLength - 最大长度
   * @param {string} suffix - 后缀，默认为'...'
   * @returns {string} 截断后的字符串
   */
  static truncate(str, maxLength, suffix = '...') {
    if (!str || str.length <= maxLength) return str || '';
    
    const suffixLength = suffix.length;
    const actualMaxLength = maxLength - suffixLength;
    
    if (actualMaxLength <= 0) return suffix;
    
    return str.substring(0, actualMaxLength) + suffix;
  }

  /**
   * 填充字符串到指定长度
   * @param {string} str - 原始字符串
   * @param {number} length - 目标长度
   * @param {string} padChar - 填充字符
   * @param {boolean} left - 是否在左侧填充
   * @returns {string} 填充后的字符串
   */
  static pad(str, length, padChar = ' ', left = true) {
    const strLength = String(str || '').length;
    if (strLength >= length) return String(str || '');
    
    const padLength = length - strLength;
    const padding = padChar.repeat(padLength).slice(0, padLength);
    
    return left ? padding + str : str + padding;
  }

  /**
   * 左侧填充
   * @param {string} str - 原始字符串
   * @param {number} length - 目标长度
   * @param {string} padChar - 填充字符
   * @returns {string} 填充后的字符串
   */
  static padLeft(str, length, padChar = ' ') {
    return this.pad(str, length, padChar, true);
  }

  /**
   * 右侧填充
   * @param {string} str - 原始字符串
   * @param {number} length - 目标长度
   * @param {string} padChar - 填充字符
   * @returns {string} 填充后的字符串
   */
  static padRight(str, length, padChar = ' ') {
    return this.pad(str, length, padChar, false);
  }

  /**
   * 格式化字符串（类似printf）
   * @param {string} str - 格式字符串
   * @param  {...any} args - 替换参数
   * @returns {string} 格式化后的字符串
   */
  static format(str, ...args) {
    if (!str) return '';
    
    return str.replace(/{(\d+)}/g, (match, index) => {
      return index in args ? String(args[index]) : match;
    });
  }

  /**
   * 替换所有匹配项
   * @param {string} str - 原始字符串
   * @param {string|RegExp} find - 要查找的字符串或正则表达式
   * @param {string|Function} replace - 替换字符串或函数
   * @returns {string} 替换后的字符串
   */
  static replaceAll(str, find, replace) {
    if (!str) return '';
    
    if (typeof find === 'string') {
      // 如果是字符串，使用split和join实现全局替换
      return str.split(find).join(replace);
    }
    
    // 如果是正则表达式，确保有g标志
    if (find instanceof RegExp && !find.global) {
      const flags = find.flags.includes('g') ? find.flags : find.flags + 'g';
      find = new RegExp(find.source, flags);
    }
    
    return str.replace(find, replace);
  }

  /**
   * 生成随机字符串
   * @param {number} length - 字符串长度
   * @param {string} chars - 可选字符集
   * @returns {string} 随机字符串
   */
  static random(length, chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
    let result = '';
    const charsLength = chars.length;
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * charsLength));
    }
    
    return result;
  }

  /**
   * 检查字符串是否以指定前缀开头
   * @param {string} str - 要检查的字符串
   * @param {string} prefix - 前缀
   * @returns {boolean} 是否以指定前缀开头
   */
  static startsWith(str, prefix) {
    return str ? str.startsWith(prefix) : false;
  }

  /**
   * 检查字符串是否以指定后缀结尾
   * @param {string} str - 要检查的字符串
   * @param {string} suffix - 后缀
   * @returns {boolean} 是否以指定后缀结尾
   */
  static endsWith(str, suffix) {
    return str ? str.endsWith(suffix) : false;
  }

  /**
   * 计算字符串相似度（Levenshtein距离）
   * @param {string} str1 - 第一个字符串
   * @param {string} str2 - 第二个字符串
   * @returns {number} 相似度（0-1之间的值，1表示完全相同）
   */
  static similarity(str1, str2) {
    if (!str1 || !str2) return 0;
    if (str1 === str2) return 1;
    
    const len1 = str1.length;
    const len2 = str2.length;
    
    // 计算Levenshtein距离
    const matrix = Array(len2 + 1).fill().map(() => Array(len1 + 1).fill(0));
    
    for (let i = 0; i <= len1; i++) {
      matrix[0][i] = i;
    }
    
    for (let j = 0; j <= len2; j++) {
      matrix[j][0] = j;
    }
    
    for (let j = 1; j <= len2; j++) {
      for (let i = 1; i <= len1; i++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j - 1][i] + 1,       // 删除
          matrix[j][i - 1] + 1,       // 插入
          matrix[j - 1][i - 1] + cost // 替换
        );
      }
    }
    
    const distance = matrix[len2][len1];
    const maxLength = Math.max(len1, len2);
    
    return maxLength === 0 ? 1 : 1 - distance / maxLength;
  }

  /**
   * 转义HTML特殊字符
   * @param {string} str - 要转义的字符串
   * @returns {string} 转义后的字符串
   */
  static escapeHtml(str) {
    if (!str) return '';
    
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    
    return str.replace(/[&<>"']/g, char => map[char]);
  }

  /**
   * 反转义HTML特殊字符
   * @param {string} str - 要反转义的字符串
   * @returns {string} 反转义后的字符串
   */
  static unescapeHtml(str) {
    if (!str) return '';
    
    const map = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'"
    };
    
    return str.replace(/&amp;|&lt;|&gt;|&quot;|&#39;/g, entity => map[entity]);
  }

  /**
   * 提取URL中的域名
   * @param {string} url - URL字符串
   * @returns {string} 域名
   */
  static extractDomain(url) {
    if (!url) return '';
    
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (e) {
      // 简单的回退方案
      const match = url.match(/^(?:https?:\/\/)?(?:[^@\/\n]+@)?(?:www\.)?([^:\/\n]+)/im);
      return match ? match[1] : url;
    }
  }

  /**
   * 验证电子邮件格式
   * @param {string} email - 电子邮件地址
   * @returns {boolean} 是否有效
   */
  static isValidEmail(email) {
    if (!email) return false;
    
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  /**
   * 验证手机号码格式（中国）
   * @param {string} phone - 手机号码
   * @returns {boolean} 是否有效
   */
  static isValidChinesePhone(phone) {
    if (!phone) return false;
    
    const re = /^1[3-9]\d{9}$/;
    return re.test(phone);
  }

  /**
   * 隐藏字符串中间部分（用于敏感信息展示）
   * @param {string} str - 原始字符串
   * @param {number} showFirst - 前几位展示
   * @param {number} showLast - 后几位展示
   * @param {string} mask - 掩码字符
   * @returns {string} 处理后的字符串
   */
  static maskString(str, showFirst = 3, showLast = 4, mask = '*') {
    if (!str) return '';
    
    const length = str.length;
    if (length <= showFirst + showLast) return str;
    
    const maskLength = length - showFirst - showLast;
    return str.substring(0, showFirst) + mask.repeat(maskLength) + str.substring(length - showLast);
  }

  /**
   * 计算字符串字节长度
   * @param {string} str - 字符串
   * @param {string} encoding - 编码方式
   * @returns {number} 字节长度
   */
  static getByteLength(str, encoding = 'utf8') {
    if (!str) return 0;
    
    // 简单实现，对于复杂编码可能需要更精确的计算
    if (encoding.toLowerCase() === 'utf8') {
      // UTF-8编码下，中文字符通常占3字节
      return str.split('').reduce((length, char) => {
        const codePoint = char.codePointAt(0);
        if (codePoint <= 0x7F) return length + 1;
        if (codePoint <= 0x7FF) return length + 2;
        if (codePoint <= 0xFFFF) return length + 3;
        return length + 4;
      }, 0);
    }
    
    return str.length;
  }

  /**
   * 打乱字符串字符顺序
   * @param {string} str - 原始字符串
   * @returns {string} 打乱后的字符串
   */
  static shuffle(str) {
    if (!str) return '';
    
    const arr = str.split('');
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    
    return arr.join('');
  }
}

module.exports = StringUtils;