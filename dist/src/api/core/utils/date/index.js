/**
 * 日期工具类
 * 提供日期格式化和计算功能
 */

/**
 * 格式化日期
 * @param {Date} date - 日期对象
 * @param {string} format - 格式化字符串，例如 'YYYY-MM-DD HH:mm:ss'
 * @returns {string} 格式化后的日期字符串
 */
function format(date, format) {
  if (!date) return '';
  
  const d = new Date(date);
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

/**
 * 获取相对时间
 * @param {Date|string|number} date - 日期
 * @returns {string} 相对时间描述
 */
function getRelativeTime(date) {
  const now = new Date();
  const target = new Date(date);
  const diff = now - target;
  
  const minute = 60 * 1000;
  const hour = minute * 60;
  const day = hour * 24;
  const week = day * 7;
  const month = day * 30;
  const year = day * 365;
  
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
 * 获取两个日期之间的天数差
 * @param {Date|string|number} date1 - 日期1
 * @param {Date|string|number} date2 - 日期2
 * @returns {number} 天数差
 */
function daysBetween(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  
  // 设置时间为0时0分0秒，避免时间部分影响计算
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);
  
  const diffTime = Math.abs(d2 - d1);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * 添加天数
 * @param {Date|string|number} date - 基准日期
 * @param {number} days - 要添加的天数
 * @returns {Date} 新日期
 */
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * 获取月份的第一天
 * @param {Date|string|number} date - 日期
 * @returns {Date} 月份第一天
 */
function getFirstDayOfMonth(date) {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/**
 * 获取月份的最后一天
 * @param {Date|string|number} date - 日期
 * @returns {Date} 月份最后一天
 */
function getLastDayOfMonth(date) {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

/**
 * 判断是否是闰年
 * @param {number|Date} year - 年份或日期对象
 * @returns {boolean} 是否是闰年
 */
function isLeapYear(year) {
  const y = typeof year === 'number' ? year : year.getFullYear();
  return (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0);
}

/**
 * 获取日期的开始时间（00:00:00）
 * @param {Date|string|number} date - 日期
 * @returns {Date} 当天开始时间
 */
function getStartOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * 获取日期的结束时间（23:59:59）
 * @param {Date|string|number} date - 日期
 * @returns {Date} 当天结束时间
 */
function getEndOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

module.exports = {
  format,
  getRelativeTime,
  daysBetween,
  addDays,
  getFirstDayOfMonth,
  getLastDayOfMonth,
  isLeapYear,
  getStartOfDay,
  getEndOfDay
};