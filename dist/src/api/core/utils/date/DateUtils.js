/**
 * 日期时间处理工具类
 * 提供日期格式化、解析、计算等常用操作
 */

const logger = require('../logger');

/**
 * 日期时间处理工具
 */
class DateUtils {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   */
  constructor(options = {}) {
    this.options = {
      defaultFormat: 'YYYY-MM-DD HH:mm:ss',
      defaultTimezone: 'Asia/Shanghai',
      ...options
    };
    
    logger.debug('创建日期时间处理工具实例', { options });
  }

  /**
   * 格式化日期
   * @param {Date|string|number} date - 日期对象、字符串或时间戳
   * @param {string} format - 格式化模板
   * @returns {string} 格式化后的日期字符串
   */
  format(date, format = this.options.defaultFormat) {
    const d = this.toDate(date);
    if (!d || isNaN(d.getTime())) {
      logger.warn('无效的日期对象', { date });
      return '';
    }

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    const milliseconds = String(d.getMilliseconds()).padStart(3, '0');

    return format
      .replace('YYYY', year)
      .replace('YY', String(year).slice(-2))
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
   * 解析日期字符串
   * @param {string} dateString - 日期字符串
   * @param {string} format - 日期格式
   * @returns {Date} 解析后的日期对象
   */
  parse(dateString, format) {
    if (!dateString) return null;

    // 如果提供了格式，使用自定义解析
    if (format) {
      return this._parseWithFormat(dateString, format);
    }

    // 尝试自动解析
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  }

  /**
   * 使用指定格式解析日期字符串
   * @private
   * @param {string} dateString - 日期字符串
   * @param {string} format - 日期格式
   * @returns {Date} 解析后的日期对象
   */
  _parseWithFormat(dateString, format) {
    const yearMatch = format.match(/Y{2,4}/);
    const monthMatch = format.match(/M{1,2}/);
    const dayMatch = format.match(/D{1,2}/);
    const hourMatch = format.match(/H{1,2}/);
    const minuteMatch = format.match(/m{1,2}/);
    const secondMatch = format.match(/s{1,2}/);

    let year = 1970, month = 0, day = 1;
    let hours = 0, minutes = 0, seconds = 0;

    if (yearMatch) {
      const yearIndex = format.indexOf(yearMatch[0]);
      const yearStr = dateString.substring(yearIndex, yearIndex + yearMatch[0].length);
      year = parseInt(yearStr, 10);
      if (yearMatch[0].length === 2) {
        year += 2000;
      }
    }

    if (monthMatch) {
      const monthIndex = format.indexOf(monthMatch[0]);
      const monthStr = dateString.substring(monthIndex, monthIndex + monthMatch[0].length);
      month = parseInt(monthStr, 10) - 1;
    }

    if (dayMatch) {
      const dayIndex = format.indexOf(dayMatch[0]);
      const dayStr = dateString.substring(dayIndex, dayIndex + dayMatch[0].length);
      day = parseInt(dayStr, 10);
    }

    if (hourMatch) {
      const hourIndex = format.indexOf(hourMatch[0]);
      const hourStr = dateString.substring(hourIndex, hourIndex + hourMatch[0].length);
      hours = parseInt(hourStr, 10);
    }

    if (minuteMatch) {
      const minuteIndex = format.indexOf(minuteMatch[0]);
      const minuteStr = dateString.substring(minuteIndex, minuteIndex + minuteMatch[0].length);
      minutes = parseInt(minuteStr, 10);
    }

    if (secondMatch) {
      const secondIndex = format.indexOf(secondMatch[0]);
      const secondStr = dateString.substring(secondIndex, secondIndex + secondMatch[0].length);
      seconds = parseInt(secondStr, 10);
    }

    const date = new Date(year, month, day, hours, minutes, seconds);
    return isNaN(date.getTime()) ? null : date;
  }

  /**
   * 转换为Date对象
   * @param {Date|string|number} date - 日期对象、字符串或时间戳
   * @returns {Date} Date对象
   */
  toDate(date) {
    if (date instanceof Date) {
      return date;
    }

    if (typeof date === 'string' || typeof date === 'number') {
      return new Date(date);
    }

    return null;
  }

  /**
   * 获取当前日期时间
   * @returns {Date} 当前日期时间
   */
  now() {
    return new Date();
  }

  /**
   * 获取当前时间戳（毫秒）
   * @returns {number} 时间戳
   */
  timestamp() {
    return Date.now();
  }

  /**
   * 获取当前时间戳（秒）
   * @returns {number} 时间戳
   */
  timestampSeconds() {
    return Math.floor(Date.now() / 1000);
  }

  /**
   * 比较两个日期
   * @param {Date|string|number} date1 - 第一个日期
   * @param {Date|string|number} date2 - 第二个日期
   * @returns {number} 如果date1 > date2返回1，如果date1 < date2返回-1，如果相等返回0
   */
  compare(date1, date2) {
    const d1 = this.toDate(date1);
    const d2 = this.toDate(date2);

    if (!d1 || !d2 || isNaN(d1.getTime()) || isNaN(d2.getTime())) {
      throw new Error('无效的日期参数');
    }

    const time1 = d1.getTime();
    const time2 = d2.getTime();

    if (time1 > time2) return 1;
    if (time1 < time2) return -1;
    return 0;
  }

  /**
   * 添加时间
   * @param {Date|string|number} date - 基础日期
   * @param {number} amount - 数量
   * @param {string} unit - 单位：'year', 'month', 'day', 'hour', 'minute', 'second', 'millisecond'
   * @returns {Date} 新的日期对象
   */
  add(date, amount, unit) {
    const d = new Date(this.toDate(date));
    if (isNaN(d.getTime())) {
      throw new Error('无效的日期参数');
    }

    switch (unit.toLowerCase()) {
      case 'year':
        d.setFullYear(d.getFullYear() + amount);
        break;
      case 'month':
        d.setMonth(d.getMonth() + amount);
        break;
      case 'day':
        d.setDate(d.getDate() + amount);
        break;
      case 'hour':
        d.setHours(d.getHours() + amount);
        break;
      case 'minute':
        d.setMinutes(d.getMinutes() + amount);
        break;
      case 'second':
        d.setSeconds(d.getSeconds() + amount);
        break;
      case 'millisecond':
        d.setMilliseconds(d.getMilliseconds() + amount);
        break;
      default:
        throw new Error('不支持的时间单位');
    }

    return d;
  }

  /**
   * 减去时间
   * @param {Date|string|number} date - 基础日期
   * @param {number} amount - 数量
   * @param {string} unit - 单位：'year', 'month', 'day', 'hour', 'minute', 'second', 'millisecond'
   * @returns {Date} 新的日期对象
   */
  subtract(date, amount, unit) {
    return this.add(date, -amount, unit);
  }

  /**
   * 计算两个日期之间的差值
   * @param {Date|string|number} date1 - 第一个日期
   * @param {Date|string|number} date2 - 第二个日期
   * @param {string} unit - 单位：'year', 'month', 'day', 'hour', 'minute', 'second', 'millisecond'
   * @returns {number} 差值
   */
  diff(date1, date2, unit = 'millisecond') {
    const d1 = this.toDate(date1);
    const d2 = this.toDate(date2);

    if (!d1 || !d2 || isNaN(d1.getTime()) || isNaN(d2.getTime())) {
      throw new Error('无效的日期参数');
    }

    const diffMs = d2.getTime() - d1.getTime();

    switch (unit.toLowerCase()) {
      case 'year':
        return (d2.getFullYear() - d1.getFullYear()) + 
               (d2.getMonth() - d1.getMonth()) / 12 + 
               (d2.getDate() - d1.getDate()) / 365;
      case 'month':
        return (d2.getFullYear() - d1.getFullYear()) * 12 + 
               (d2.getMonth() - d1.getMonth()) + 
               (d2.getDate() - d1.getDate()) / 30;
      case 'day':
        return diffMs / (1000 * 60 * 60 * 24);
      case 'hour':
        return diffMs / (1000 * 60 * 60);
      case 'minute':
        return diffMs / (1000 * 60);
      case 'second':
        return diffMs / 1000;
      case 'millisecond':
        return diffMs;
      default:
        throw new Error('不支持的时间单位');
    }
  }

  /**
   * 获取日期的开始时间（00:00:00）
   * @param {Date|string|number} date - 日期
   * @returns {Date} 开始时间
   */
  startOfDay(date) {
    const d = new Date(this.toDate(date));
    if (isNaN(d.getTime())) {
      throw new Error('无效的日期参数');
    }
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /**
   * 获取日期的结束时间（23:59:59.999）
   * @param {Date|string|number} date - 日期
   * @returns {Date} 结束时间
   */
  endOfDay(date) {
    const d = new Date(this.toDate(date));
    if (isNaN(d.getTime())) {
      throw new Error('无效的日期参数');
    }
    d.setHours(23, 59, 59, 999);
    return d;
  }

  /**
   * 获取月份的开始日期
   * @param {Date|string|number} date - 日期
   * @returns {Date} 月份开始日期
   */
  startOfMonth(date) {
    const d = new Date(this.toDate(date));
    if (isNaN(d.getTime())) {
      throw new Error('无效的日期参数');
    }
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /**
   * 获取月份的结束日期
   * @param {Date|string|number} date - 日期
   * @returns {Date} 月份结束日期
   */
  endOfMonth(date) {
    const d = new Date(this.toDate(date));
    if (isNaN(d.getTime())) {
      throw new Error('无效的日期参数');
    }
    d.setMonth(d.getMonth() + 1, 0);
    d.setHours(23, 59, 59, 999);
    return d;
  }

  /**
   * 获取年份的开始日期
   * @param {Date|string|number} date - 日期
   * @returns {Date} 年份开始日期
   */
  startOfYear(date) {
    const d = new Date(this.toDate(date));
    if (isNaN(d.getTime())) {
      throw new Error('无效的日期参数');
    }
    d.setMonth(0, 1);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /**
   * 获取年份的结束日期
   * @param {Date|string|number} date - 日期
   * @returns {Date} 年份结束日期
   */
  endOfYear(date) {
    const d = new Date(this.toDate(date));
    if (isNaN(d.getTime())) {
      throw new Error('无效的日期参数');
    }
    d.setMonth(11, 31);
    d.setHours(23, 59, 59, 999);
    return d;
  }

  /**
   * 获取星期几
   * @param {Date|string|number} date - 日期
   * @returns {number} 星期几（0-6，0表示星期日）
   */
  getDay(date) {
    const d = this.toDate(date);
    if (isNaN(d.getTime())) {
      throw new Error('无效的日期参数');
    }
    return d.getDay();
  }

  /**
   * 获取星期几的中文名称
   * @param {Date|string|number} date - 日期
   * @returns {string} 星期几的中文名称
   */
  getDayName(date) {
    const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    return days[this.getDay(date)];
  }

  /**
   * 获取月份的中文名称
   * @param {Date|string|number} date - 日期
   * @returns {string} 月份的中文名称
   */
  getMonthName(date) {
    const months = ['一月', '二月', '三月', '四月', '五月', '六月', 
                    '七月', '八月', '九月', '十月', '十一月', '十二月'];
    const d = this.toDate(date);
    if (isNaN(d.getTime())) {
      throw new Error('无效的日期参数');
    }
    return months[d.getMonth()];
  }

  /**
   * 判断是否是闰年
   * @param {Date|string|number} date - 日期或年份
   * @returns {boolean} 是否是闰年
   */
  isLeapYear(date) {
    let year;
    if (typeof date === 'number') {
      year = date;
    } else {
      const d = this.toDate(date);
      if (isNaN(d.getTime())) {
        throw new Error('无效的日期参数');
      }
      year = d.getFullYear();
    }
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  }

  /**
   * 获取月份的天数
   * @param {Date|string|number} date - 日期或年月
   * @returns {number} 天数
   */
  getDaysInMonth(date) {
    const d = this.toDate(date);
    if (isNaN(d.getTime())) {
      throw new Error('无效的日期参数');
    }
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  }

  /**
   * 判断两个日期是否是同一天
   * @param {Date|string|number} date1 - 第一个日期
   * @param {Date|string|number} date2 - 第二个日期
   * @returns {boolean} 是否是同一天
   */
  isSameDay(date1, date2) {
    const d1 = this.toDate(date1);
    const d2 = this.toDate(date2);

    if (!d1 || !d2 || isNaN(d1.getTime()) || isNaN(d2.getTime())) {
      throw new Error('无效的日期参数');
    }

    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  }

  /**
   * 判断日期是否是今天
   * @param {Date|string|number} date - 日期
   * @returns {boolean} 是否是今天
   */
  isToday(date) {
    return this.isSameDay(date, new Date());
  }

  /**
   * 判断日期是否在指定范围内
   * @param {Date|string|number} date - 要检查的日期
   * @param {Date|string|number} start - 开始日期
   * @param {Date|string|number} end - 结束日期
   * @returns {boolean} 是否在范围内
   */
  isBetween(date, start, end) {
    const d = this.toDate(date);
    const s = this.toDate(start);
    const e = this.toDate(end);

    if (!d || !s || !e || isNaN(d.getTime()) || isNaN(s.getTime()) || isNaN(e.getTime())) {
      throw new Error('无效的日期参数');
    }

    return d.getTime() >= s.getTime() && d.getTime() <= e.getTime();
  }

  /**
   * 将日期转换为ISO 8601格式
   * @param {Date|string|number} date - 日期
   * @returns {string} ISO 8601格式的字符串
   */
  toISOString(date) {
    const d = this.toDate(date);
    if (!d || isNaN(d.getTime())) {
      throw new Error('无效的日期参数');
    }
    return d.toISOString();
  }

  /**
   * 将日期转换为本地时间字符串
   * @param {Date|string|number} date - 日期
   * @returns {string} 本地时间字符串
   */
  toLocaleString(date) {
    const d = this.toDate(date);
    if (!d || isNaN(d.getTime())) {
      throw new Error('无效的日期参数');
    }
    return d.toLocaleString();
  }

  /**
   * 获取相对时间描述
   * @param {Date|string|number} date - 日期
   * @returns {string} 相对时间描述
   */
  getRelativeTime(date) {
    const d = this.toDate(date);
    if (!d || isNaN(d.getTime())) {
      throw new Error('无效的日期参数');
    }

    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) {
      return '刚刚';
    } else if (diffMins < 60) {
      return `${diffMins}分钟前`;
    } else if (diffHours < 24) {
      return `${diffHours}小时前`;
    } else if (diffDays < 30) {
      return `${diffDays}天前`;
    } else if (diffDays < 365) {
      return `${Math.floor(diffDays / 30)}个月前`;
    } else {
      return `${Math.floor(diffDays / 365)}年前`;
    }
  }

  /**
   * 生成日期范围内的所有日期
   * @param {Date|string|number} start - 开始日期
   * @param {Date|string|number} end - 结束日期
   * @returns {Array<Date>} 日期数组
   */
  generateDateRange(start, end) {
    const startDate = this.toDate(start);
    const endDate = this.toDate(end);

    if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error('无效的日期参数');
    }

    const dates = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return dates;
  }

  /**
   * 检查日期是否有效
   * @param {*} date - 要检查的值
   * @returns {boolean} 是否有效
   */
  isValid(date) {
    const d = this.toDate(date);
    return d instanceof Date && !isNaN(d.getTime());
  }
}

// 单例模式
let instance = null;

function getInstance(options = {}) {
  if (!instance) {
    instance = new DateUtils(options);
  }
  return instance;
}

module.exports = {
  DateUtils,
  getInstance
};