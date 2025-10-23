/**
 * 日期工具类
 * 提供日期格式化和处理功能
 */

class DateUtils {
  /**
   * 格式化日期
   * @param {Date|string|number} date - 日期对象、字符串或时间戳
   * @param {string} format - 格式化字符串，默认为 'YYYY-MM-DD HH:mm:ss'
   * @returns {string} 格式化后的日期字符串
   */
  static format(date, format = 'YYYY-MM-DD HH:mm:ss') {
    const d = this.parseDate(date);
    if (!d) return '';

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    return format
      .replace('YYYY', year)
      .replace('YY', String(year).slice(-2))
      .replace('MM', month)
      .replace('M', String(d.getMonth() + 1))
      .replace('DD', day)
      .replace('D', String(d.getDate()))
      .replace('HH', hours)
      .replace('H', String(d.getHours()))
      .replace('mm', minutes)
      .replace('m', String(d.getMinutes()))
      .replace('ss', seconds)
      .replace('s', String(d.getSeconds()));
  }

  /**
   * 解析日期字符串
   * @param {string|number|Date} date - 要解析的日期
   * @returns {Date|null} 日期对象或null（如果解析失败）
   */
  static parseDate(date) {
    if (!date) return null;
    
    if (date instanceof Date) {
      return isNaN(date.getTime()) ? null : date;
    }
    
    const d = new Date(date);
    return isNaN(d.getTime()) ? null : d;
  }

  /**
   * 获取相对时间（如：3分钟前）
   * @param {Date|string|number} date - 日期
   * @returns {string} 相对时间字符串
   */
  static getRelativeTime(date) {
    const d = this.parseDate(date);
    if (!d) return '';

    const now = new Date();
    const diff = now - d;
    
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    const week = 7 * day;
    const month = 30 * day;
    const year = 365 * day;

    if (diff < minute) {
      return '刚刚';
    } else if (diff < hour) {
      const minutes = Math.floor(diff / minute);
      return `${minutes}分钟前`;
    } else if (diff < day) {
      const hours = Math.floor(diff / hour);
      return `${hours}小时前`;
    } else if (diff < week) {
      const days = Math.floor(diff / day);
      return `${days}天前`;
    } else if (diff < month) {
      const weeks = Math.floor(diff / week);
      return `${weeks}周前`;
    } else if (diff < year) {
      const months = Math.floor(diff / month);
      return `${months}个月前`;
    } else {
      const years = Math.floor(diff / year);
      return `${years}年前`;
    }
  }

  /**
   * 获取两个日期之间的差值
   * @param {Date|string|number} startDate - 开始日期
   * @param {Date|string|number} endDate - 结束日期
   * @param {string} unit - 单位：'millisecond', 'second', 'minute', 'hour', 'day', 'week', 'month', 'year'
   * @returns {number} 差值
   */
  static getDateDiff(startDate, endDate, unit = 'day') {
    const start = this.parseDate(startDate);
    const end = this.parseDate(endDate);
    
    if (!start || !end) return 0;

    const diff = end - start;
    
    switch (unit) {
      case 'millisecond':
        return diff;
      case 'second':
        return Math.floor(diff / 1000);
      case 'minute':
        return Math.floor(diff / (1000 * 60));
      case 'hour':
        return Math.floor(diff / (1000 * 60 * 60));
      case 'day':
        return Math.floor(diff / (1000 * 60 * 60 * 24));
      case 'week':
        return Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
      case 'month':
        return Math.floor(diff / (1000 * 60 * 60 * 24 * 30));
      case 'year':
        return Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
      default:
        return Math.floor(diff / (1000 * 60 * 60 * 24));
    }
  }

  /**
   * 添加时间
   * @param {Date|string|number} date - 基础日期
   * @param {number} amount - 添加的数量
   * @param {string} unit - 单位：'millisecond', 'second', 'minute', 'hour', 'day', 'month', 'year'
   * @returns {Date} 新的日期对象
   */
  static addTime(date, amount, unit = 'day') {
    const d = this.parseDate(date);
    if (!d) return new Date();

    const newDate = new Date(d);

    switch (unit) {
      case 'millisecond':
        newDate.setMilliseconds(newDate.getMilliseconds() + amount);
        break;
      case 'second':
        newDate.setSeconds(newDate.getSeconds() + amount);
        break;
      case 'minute':
        newDate.setMinutes(newDate.getMinutes() + amount);
        break;
      case 'hour':
        newDate.setHours(newDate.getHours() + amount);
        break;
      case 'day':
        newDate.setDate(newDate.getDate() + amount);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + amount);
        break;
      case 'year':
        newDate.setFullYear(newDate.getFullYear() + amount);
        break;
    }

    return newDate;
  }

  /**
   * 获取指定日期的开始时间
   * @param {Date|string|number} date - 日期
   * @param {string} unit - 单位：'day', 'month', 'year'
   * @returns {Date} 开始时间
   */
  static startOf(date, unit = 'day') {
    const d = this.parseDate(date);
    if (!d) return new Date();

    const newDate = new Date(d);

    switch (unit) {
      case 'day':
        newDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        newDate.setDate(1);
        newDate.setHours(0, 0, 0, 0);
        break;
      case 'year':
        newDate.setMonth(0, 1);
        newDate.setHours(0, 0, 0, 0);
        break;
    }

    return newDate;
  }

  /**
   * 获取指定日期的结束时间
   * @param {Date|string|number} date - 日期
   * @param {string} unit - 单位：'day', 'month', 'year'
   * @returns {Date} 结束时间
   */
  static endOf(date, unit = 'day') {
    const d = this.parseDate(date);
    if (!d) return new Date();

    const newDate = new Date(d);

    switch (unit) {
      case 'day':
        newDate.setHours(23, 59, 59, 999);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + 1, 0);
        newDate.setHours(23, 59, 59, 999);
        break;
      case 'year':
        newDate.setMonth(11, 31);
        newDate.setHours(23, 59, 59, 999);
        break;
    }

    return newDate;
  }

  /**
   * 判断是否是今天
   * @param {Date|string|number} date - 日期
   * @returns {boolean} 是否是今天
   */
  static isToday(date) {
    const d = this.parseDate(date);
    if (!d) return false;

    const today = new Date();
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    );
  }

  /**
   * 判断是否是闰年
   * @param {number|Date} year - 年份或日期对象
   * @returns {boolean} 是否是闰年
   */
  static isLeapYear(year) {
    const y = year instanceof Date ? year.getFullYear() : parseInt(year, 10);
    return (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0);
  }

  /**
   * 获取月份的天数
   * @param {number} year - 年份
   * @param {number} month - 月份（0-11）
   * @returns {number} 天数
   */
  static getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }

  /**
   * 获取时间戳（秒）
   * @param {Date|string|number} date - 日期
   * @returns {number} 时间戳（秒）
   */
  static getTimestamp(date) {
    const d = this.parseDate(date);
    if (!d) return Math.floor(Date.now() / 1000);
    return Math.floor(d.getTime() / 1000);
  }

  /**
   * 获取时间戳（毫秒）
   * @param {Date|string|number} date - 日期
   * @returns {number} 时间戳（毫秒）
   */
  static getTimeInMs(date) {
    const d = this.parseDate(date);
    if (!d) return Date.now();
    return d.getTime();
  }

  /**
   * 比较两个日期
   * @param {Date|string|number} date1 - 第一个日期
   * @param {Date|string|number} date2 - 第二个日期
   * @returns {number} -1: date1 < date2, 0: date1 = date2, 1: date1 > date2
   */
  static compare(date1, date2) {
    const d1 = this.parseDate(date1);
    const d2 = this.parseDate(date2);
    
    if (!d1 || !d2) return 0;

    const time1 = d1.getTime();
    const time2 = d2.getTime();

    if (time1 < time2) return -1;
    if (time1 > time2) return 1;
    return 0;
  }

  /**
   * 格式化持续时间
   * @param {number} milliseconds - 毫秒数
   * @returns {string} 格式化的持续时间
   */
  static formatDuration(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const totalHours = Math.floor(totalMinutes / 60);
    const totalDays = Math.floor(totalHours / 24);

    const seconds = totalSeconds % 60;
    const minutes = totalMinutes % 60;
    const hours = totalHours % 24;

    const parts = [];
    if (totalDays > 0) parts.push(`${totalDays}天`);
    if (hours > 0) parts.push(`${hours}小时`);
    if (minutes > 0) parts.push(`${minutes}分钟`);
    if (seconds > 0) parts.push(`${seconds}秒`);

    return parts.join(' ') || '0秒';
  }

  /**
   * 获取ISO格式的日期字符串
   * @param {Date|string|number} date - 日期
   * @returns {string} ISO格式字符串
   */
  static toISOString(date) {
    const d = this.parseDate(date);
    if (!d) return new Date().toISOString();
    return d.toISOString();
  }

  /**
   * 获取本地格式的日期字符串
   * @param {Date|string|number} date - 日期
   * @param {Object} options - Intl.DateTimeFormat选项
   * @param {string} locale - 语言环境
   * @returns {string} 本地格式字符串
   */
  static toLocaleString(date, options = {}, locale = 'zh-CN') {
    const d = this.parseDate(date);
    if (!d) return new Date().toLocaleString(locale, options);
    return d.toLocaleString(locale, options);
  }
}

module.exports = DateUtils;