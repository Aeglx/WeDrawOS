/**
 * 通用工具函数集合
 * 提供日期处理、文件操作、字符串处理等常用功能
 */

const fs = require('fs').promises;
const path = require('path');
const { AppError } = require('../exception/handlers/errorHandler');

/**
 * 通用工具类
 */
class CommonUtils {
  /**
   * 日期格式化
   * @param {Date} date - 日期对象
   * @param {string} format - 格式化模板
   * @returns {string} 格式化后的日期字符串
   */
  static formatDate(date = new Date(), format = 'YYYY-MM-DD HH:mm:ss') {
    const d = new Date(date);
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    const milliseconds = String(d.getMilliseconds()).padStart(3, '0');

    return format
      .replace('YYYY', year)
      .replace('YY', String(year).slice(2))
      .replace('MM', month)
      .replace('M', d.getMonth() + 1)
      .replace('DD', day)
      .replace('D', d.getDate())
      .replace('HH', hours)
      .replace('H', d.getHours())
      .replace('mm', minutes)
      .replace('m', d.getMinutes())
      .replace('ss', seconds)
      .replace('s', d.getSeconds())
      .replace('SSS', milliseconds);
  }

  /**
   * 获取相对时间描述
   * @param {Date|string|number} date - 日期
   * @returns {string} 相对时间描述
   */
  static getRelativeTime(date) {
    const now = new Date();
    const target = new Date(date);
    const diff = now - target;
    
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    const week = 7 * day;
    const month = 30 * day;
    const year = 365 * day;

    if (diff < minute) {
      return '刚刚';
    } else if (diff < hour) {
      return `${Math.floor(diff / minute)}分钟前`;
    } else if (diff < day) {
      return `${Math.floor(diff / hour)}小时前`;
    } else if (diff < week) {
      return `${Math.floor(diff / day)}天前`;
    } else if (diff < month) {
      return `${Math.floor(diff / week)}周前`;
    } else if (diff < year) {
      return `${Math.floor(diff / month)}个月前`;
    } else {
      return `${Math.floor(diff / year)}年前`;
    }
  }

  /**
   * 延迟执行
   * @param {number} ms - 延迟毫秒数
   * @returns {Promise<void>}
   */
  static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 重试函数执行
   * @param {Function} fn - 要执行的函数
   * @param {Object} options - 重试选项
   * @returns {Promise<*>} 函数执行结果
   */
  static async retry(fn, options = {}) {
    const {
      retries = 3,
      delay = 1000,
      maxDelay = 10000,
      factor = 2,
      onRetry = null,
      shouldRetry = (error) => true
    } = options;

    let lastError;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await fn(attempt);
      } catch (error) {
        lastError = error;
        
        // 检查是否应该重试
        if (attempt === retries || !shouldRetry(error)) {
          throw error;
        }

        // 执行重试前的回调
        if (onRetry) {
          await onRetry(error, attempt, retries);
        }

        // 计算重试延迟（指数退避）
        const nextDelay = Math.min(delay * Math.pow(factor, attempt), maxDelay);
        await this.sleep(nextDelay);
      }
    }

    throw lastError; // 这一行理论上不会执行到，但为了安全起见保留
  }

  /**
   * 深拷贝对象
   * @param {*} obj - 要拷贝的对象
   * @returns {*} 拷贝后的对象
   */
  static deepClone(obj) {
    // 处理基本类型和null
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    // 处理日期
    if (obj instanceof Date) {
      return new Date(obj.getTime());
    }

    // 处理正则表达式
    if (obj instanceof RegExp) {
      return new RegExp(obj.source, obj.flags);
    }

    // 处理Map
    if (obj instanceof Map) {
      const map = new Map();
      for (const [key, value] of obj.entries()) {
        map.set(this.deepClone(key), this.deepClone(value));
      }
      return map;
    }

    // 处理Set
    if (obj instanceof Set) {
      const set = new Set();
      for (const value of obj.values()) {
        set.add(this.deepClone(value));
      }
      return set;
    }

    // 处理数组
    if (Array.isArray(obj)) {
      return obj.map(item => this.deepClone(item));
    }

    // 处理普通对象
    const clonedObj = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        clonedObj[key] = this.deepClone(obj[key]);
      }
    }
    return clonedObj;
  }

  /**
   * 合并对象（深度合并）
   * @param {Object} target - 目标对象
   * @param {...Object} sources - 源对象
   * @returns {Object} 合并后的对象
   */
  static merge(target, ...sources) {
    if (!sources.length) return target;
    
    const source = sources.shift();

    // 处理基本类型和null
    if (source === null || typeof source !== 'object') {
      return this.merge(target, ...sources);
    }

    // 确保target是对象
    if (target === null || typeof target !== 'object') {
      target = Array.isArray(source) ? [] : {};
    }

    // 处理数组
    if (Array.isArray(source) && Array.isArray(target)) {
      target = [...target, ...source];
    } else {
      // 处理普通对象
      for (const key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            // 深度合并嵌套对象
            if (!target[key] || typeof target[key] !== 'object') {
              target[key] = Array.isArray(source[key]) ? [] : {};
            }
            this.merge(target[key], source[key]);
          } else {
            // 直接覆盖
            target[key] = source[key];
          }
        }
      }
    }

    return this.merge(target, ...sources);
  }

  /**
   * 防抖函数
   * @param {Function} func - 要防抖的函数
   * @param {number} wait - 等待时间（毫秒）
   * @param {boolean} immediate - 是否立即执行
   * @returns {Function} 防抖后的函数
   */
  static debounce(func, wait = 300, immediate = false) {
    let timeout;
    
    return function executedFunction(...args) {
      const later = () => {
        timeout = null;
        if (!immediate) func.apply(this, args);
      };

      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);

      if (callNow) func.apply(this, args);
    };
  }

  /**
   * 节流函数
   * @param {Function} func - 要节流的函数
   * @param {number} limit - 时间限制（毫秒）
   * @returns {Function} 节流后的函数
   */
  static throttle(func, limit = 300) {
    let inThrottle;
    
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * 生成随机字符串
   * @param {number} length - 字符串长度
   * @param {string} charset - 字符集
   * @returns {string} 随机字符串
   */
  static randomString(length = 16, charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789') {
    let result = '';
    const charsetLength = charset.length;
    
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charsetLength));
    }
    
    return result;
  }

  /**
   * 数组去重
   * @param {Array} array - 源数组
   * @param {Function} keyFn - 用于生成唯一键的函数
   * @returns {Array} 去重后的数组
   */
  static unique(array, keyFn) {
    if (!Array.isArray(array)) {
      return [];
    }
    
    if (keyFn) {
      const seen = new Set();
      return array.filter(item => {
        const key = keyFn(item);
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });
    }
    
    // 简单去重
    return [...new Set(array)];
  }

  /**
   * 数组分组
   * @param {Array} array - 源数组
   * @param {Function|string} keyFn - 分组键生成函数或属性名
   * @returns {Object} 分组后的对象
   */
  static groupBy(array, keyFn) {
    if (!Array.isArray(array)) {
      return {};
    }
    
    const getKey = typeof keyFn === 'string' 
      ? item => item[keyFn] 
      : keyFn;

    return array.reduce((result, item) => {
      const key = getKey(item);
      if (!result[key]) {
        result[key] = [];
      }
      result[key].push(item);
      return result;
    }, {});
  }

  /**
   * 安全地访问嵌套属性
   * @param {Object} obj - 对象
   * @param {Array|string} path - 属性路径
   * @param {*} defaultValue - 默认值
   * @returns {*} 属性值
   */
  static get(obj, path, defaultValue = undefined) {
    if (!obj || typeof obj !== 'object') {
      return defaultValue;
    }

    const keys = Array.isArray(path) ? path : path.split('.');
    let result = obj;

    for (const key of keys) {
      if (result === null || result === undefined) {
        return defaultValue;
      }
      result = result[key];
    }

    return result === undefined ? defaultValue : result;
  }

  /**
   * 安全地设置嵌套属性
   * @param {Object} obj - 对象
   * @param {Array|string} path - 属性路径
   * @param {*} value - 值
   * @returns {Object} 修改后的对象
   */
  static set(obj, path, value) {
    if (!obj || typeof obj !== 'object') {
      throw new Error('目标必须是对象');
    }

    const keys = Array.isArray(path) ? path : path.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }

    current[keys[keys.length - 1]] = value;
    return obj;
  }

  /**
   * 递归创建目录
   * @param {string} dirPath - 目录路径
   * @returns {Promise<void>}
   */
  static async ensureDir(dirPath) {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      throw new AppError(`创建目录失败: ${dirPath}`, 500, error);
    }
  }

  /**
   * 获取文件扩展名
   * @param {string} filename - 文件名
   * @returns {string} 扩展名（不含点）
   */
  static getFileExtension(filename) {
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop().toLowerCase() : '';
  }

  /**
   * 获取文件大小的友好格式
   * @param {number} bytes - 字节数
   * @returns {string} 格式化后的大小
   */
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB, 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 解析JSON字符串，出错时返回默认值
   * @param {string} jsonString - JSON字符串
   * @param {*} defaultValue - 默认值
   * @returns {*} 解析后的对象
   */
  static safeJsonParse(jsonString, defaultValue = null) {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      return defaultValue;
    }
  }

  /**
   * 生成唯一ID
   * @param {number} length - ID长度
   * @returns {string} 唯一ID
   */
  static generateId(length = 16) {
    const timestamp = Date.now().toString(36);
    const randomStr = this.randomString(length - timestamp.length);
    return timestamp + randomStr;
  }

  /**
   * 检查值是否为空
   * @param {*} value - 要检查的值
   * @returns {boolean} 是否为空
   */
  static isEmpty(value) {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim().length === 0;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  }

  /**
   * 截断文本
   * @param {string} text - 原始文本
   * @param {number} maxLength - 最大长度
   * @param {string} suffix - 后缀
   * @returns {string} 截断后的文本
   */
  static truncateText(text, maxLength = 100, suffix = '...') {
    if (typeof text !== 'string' || text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength - suffix.length) + suffix;
  }

  /**
   * 首字母大写
   * @param {string} str - 字符串
   * @returns {string} 首字母大写后的字符串
   */
  static capitalize(str) {
    if (typeof str !== 'string' || str.length === 0) {
      return str;
    }
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * 驼峰命名转换为连字符命名
   * @param {string} str - 驼峰命名字符串
   * @returns {string} 连字符命名字符串
   */
  static camelToKebab(str) {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  }

  /**
   * 连字符命名转换为驼峰命名
   * @param {string} str - 连字符命名字符串
   * @returns {string} 驼峰命名字符串
   */
  static kebabToCamel(str) {
    return str.replace(/-([a-z])/g, g => g[1].toUpperCase());
  }

  /**
   * 执行异步函数并捕获错误
   * @param {Function} fn - 异步函数
   * @returns {Promise<Array>} [error, result]
   */
  static async safeAsync(fn, ...args) {
    try {
      const result = await fn(...args);
      return [null, result];
    } catch (error) {
      return [error, null];
    }
  }

  /**
   * 限制并发执行的异步函数
   * @param {Array} items - 要处理的项目数组
   * @param {Function} processor - 处理函数
   * @param {number} concurrency - 并发数量
   * @returns {Promise<Array>} 处理结果数组
   */
  static async parallelLimit(items, processor, concurrency = 5) {
    const results = [];
    const running = new Set();
    const queue = [...items];
    
    const runNext = async () => {
      if (queue.length === 0) return;
      
      const item = queue.shift();
      const index = items.indexOf(item);
      
      const promise = processor(item, index)
        .then(result => {
          results[index] = result;
          running.delete(promise);
        })
        .catch(error => {
          results[index] = error;
          running.delete(promise);
        })
        .finally(() => {
          runNext();
        });
      
      running.add(promise);
    };
    
    // 启动初始并发任务
    const initialRuns = Math.min(concurrency, items.length);
    for (let i = 0; i < initialRuns; i++) {
      runNext();
    }
    
    // 等待所有任务完成
    while (running.size > 0) {
      await Promise.race(Array.from(running));
    }
    
    return results;
  }

  /**
   * 格式化数字
   * @param {number} num - 数字
   * @param {Object} options - 格式化选项
   * @returns {string} 格式化后的字符串
   */
  static formatNumber(num, options = {}) {
    const {
      decimals = 2,
      thousandsSeparator = ',',
      decimalSeparator = '.'
    } = options;

    const parts = num.toFixed(decimals).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);
    
    return parts.join(decimalSeparator);
  }

  /**
   * 检查值是否在指定范围内
   * @param {number} value - 要检查的值
   * @param {number} min - 最小值
   * @param {number} max - 最大值
   * @returns {boolean} 是否在范围内
   */
  static inRange(value, min, max) {
    return value >= min && value <= max;
  }

  /**
   * 从数组中随机选择一个元素
   * @param {Array} array - 源数组
   * @returns {*} 随机元素
   */
  static randomChoice(array) {
    if (!Array.isArray(array) || array.length === 0) {
      return null;
    }
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * 打乱数组
   * @param {Array} array - 源数组
   * @returns {Array} 打乱后的数组
   */
  static shuffle(array) {
    if (!Array.isArray(array)) {
      return [];
    }
    
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    
    return result;
  }

  /**
   * 计算数组元素的总和
   * @param {Array} array - 数字数组
   * @returns {number} 总和
   */
  static sum(array) {
    if (!Array.isArray(array)) {
      return 0;
    }
    return array.reduce((acc, val) => acc + (Number(val) || 0), 0);
  }

  /**
   * 计算数组元素的平均值
   * @param {Array} array - 数字数组
   * @returns {number} 平均值
   */
  static average(array) {
    if (!Array.isArray(array) || array.length === 0) {
      return 0;
    }
    return this.sum(array) / array.length;
  }

  /**
   * 格式化耗时
   * @param {number} milliseconds - 毫秒数
   * @returns {string} 格式化后的耗时
   */
  static formatDuration(milliseconds) {
    if (milliseconds < 1000) {
      return `${milliseconds}ms`;
    } else if (milliseconds < 60000) {
      return `${(milliseconds / 1000).toFixed(2)}s`;
    } else if (milliseconds < 3600000) {
      const minutes = Math.floor(milliseconds / 60000);
      const seconds = ((milliseconds % 60000) / 1000).toFixed(0);
      return `${minutes}m ${seconds}s`;
    } else {
      const hours = Math.floor(milliseconds / 3600000);
      const minutes = Math.floor((milliseconds % 3600000) / 60000);
      return `${hours}h ${minutes}m`;
    }
  }
}

module.exports = CommonUtils;