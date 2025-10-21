/**
 * 数学工具类模块
 * 提供各种数学计算和数值处理功能
 */

/**
 * 生成指定范围内的随机数
 * @param {number} min - 最小值（包含）
 * @param {number} max - 最大值（包含）
 * @returns {number} 随机数
 */
const random = (min = 0, max = 1) => {
  return Math.random() * (max - min) + min;
};

/**
 * 生成指定范围内的随机整数
 * @param {number} min - 最小值（包含）
 * @param {number} max - 最大值（包含）
 * @returns {number} 随机整数
 */
const randomInt = (min = 0, max = 1) => {
  // 确保参数为整数
  min = Math.ceil(min);
  max = Math.floor(max);
  
  // 生成随机整数，包含min和max
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * 生成指定范围内的随机浮点数
 * @param {number} min - 最小值（包含）
 * @param {number} max - 最大值（不包含）
 * @param {number} decimals - 小数位数
 * @returns {number} 随机浮点数
 */
const randomFloat = (min = 0, max = 1, decimals = 2) => {
  const randomNum = Math.random() * (max - min) + min;
  return parseFloat(randomNum.toFixed(decimals));
};

/**
 * 四舍五入到指定小数位
 * @param {number} num - 要四舍五入的数字
 * @param {number} decimals - 小数位数
 * @returns {number} 四舍五入后的数字
 */
const round = (num, decimals = 0) => {
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
};

/**
 * 向上取整到指定小数位
 * @param {number} num - 要处理的数字
 * @param {number} decimals - 小数位数
 * @returns {number} 向上取整后的数字
 */
const ceil = (num, decimals = 0) => {
  const factor = Math.pow(10, decimals);
  return Math.ceil(num * factor) / factor;
};

/**
 * 向下取整到指定小数位
 * @param {number} num - 要处理的数字
 * @param {number} decimals - 小数位数
 * @returns {number} 向下取整后的数字
 */
const floor = (num, decimals = 0) => {
  const factor = Math.pow(10, decimals);
  return Math.floor(num * factor) / factor;
};

/**
 * 限制数字在指定范围内
 * @param {number} num - 要限制的数字
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {number} 限制后的数字
 */
const clamp = (num, min, max) => {
  return Math.min(Math.max(num, min), max);
};

/**
 * 计算两个数字的百分比
 * @param {number} value - 当前值
 * @param {number} total - 总值
 * @param {number} decimals - 小数位数
 * @returns {number} 百分比值
 */
const percentage = (value, total, decimals = 2) => {
  if (total === 0) {
    return 0;
  }
  return round((value / total) * 100, decimals);
};

/**
 * 计算数组的平均值
 * @param {Array<number>} arr - 数字数组
 * @returns {number} 平均值
 */
const average = (arr) => {
  if (!Array.isArray(arr) || arr.length === 0) {
    return 0;
  }
  
  const sum = arr.reduce((acc, val) => acc + (typeof val === 'number' ? val : 0), 0);
  return sum / arr.length;
};

/**
 * 计算数组的中位数
 * @param {Array<number>} arr - 数字数组
 * @returns {number} 中位数
 */
const median = (arr) => {
  if (!Array.isArray(arr) || arr.length === 0) {
    return 0;
  }
  
  // 过滤出数字并排序
  const numbers = arr.filter(val => typeof val === 'number').sort((a, b) => a - b);
  const length = numbers.length;
  const midIndex = Math.floor(length / 2);
  
  if (length % 2 === 0) {
    // 偶数长度，取中间两个数的平均值
    return (numbers[midIndex - 1] + numbers[midIndex]) / 2;
  } else {
    // 奇数长度，取中间的数
    return numbers[midIndex];
  }
};

/**
 * 计算数组的众数
 * @param {Array<number>} arr - 数字数组
 * @returns {Array<number>} 众数数组（可能有多个）
 */
const mode = (arr) => {
  if (!Array.isArray(arr) || arr.length === 0) {
    return [];
  }
  
  // 过滤出数字
  const numbers = arr.filter(val => typeof val === 'number');
  if (numbers.length === 0) {
    return [];
  }
  
  // 计算每个数字出现的次数
  const countMap = {};
  let maxCount = 0;
  
  numbers.forEach(num => {
    countMap[num] = (countMap[num] || 0) + 1;
    maxCount = Math.max(maxCount, countMap[num]);
  });
  
  // 找出所有众数
  const modes = [];
  for (const num in countMap) {
    if (countMap[num] === maxCount) {
      modes.push(parseFloat(num));
    }
  }
  
  return modes;
};

/**
 * 计算数组的标准差
 * @param {Array<number>} arr - 数字数组
 * @returns {number} 标准差
 */
const standardDeviation = (arr) => {
  if (!Array.isArray(arr) || arr.length <= 1) {
    return 0;
  }
  
  // 过滤出数字
  const numbers = arr.filter(val => typeof val === 'number');
  if (numbers.length <= 1) {
    return 0;
  }
  
  // 计算平均值
  const avg = average(numbers);
  
  // 计算方差
  const variance = numbers.reduce((acc, val) => {
    return acc + Math.pow(val - avg, 2);
  }, 0) / numbers.length;
  
  // 计算标准差
  return Math.sqrt(variance);
};

/**
 * 计算斐波那契数列的第n项
 * @param {number} n - 项数（从0开始）
 * @returns {number} 斐波那契数
 */
const fibonacci = (n) => {
  if (n <= 0) {
    return 0;
  }
  if (n === 1) {
    return 1;
  }
  
  // 使用动态规划避免递归栈溢出
  let a = 0, b = 1;
  for (let i = 2; i <= n; i++) {
    const temp = a + b;
    a = b;
    b = temp;
  }
  
  return b;
};

/**
 * 检查一个数是否是质数
 * @param {number} num - 要检查的数字
 * @returns {boolean} 是否是质数
 */
const isPrime = (num) => {
  if (num <= 1) {
    return false;
  }
  if (num <= 3) {
    return true;
  }
  if (num % 2 === 0 || num % 3 === 0) {
    return false;
  }
  
  // 检查到sqrt(num)即可
  const sqrtNum = Math.sqrt(num);
  for (let i = 5; i <= sqrtNum; i += 6) {
    if (num % i === 0 || num % (i + 2) === 0) {
      return false;
    }
  }
  
  return true;
};

/**
 * 计算两个坐标点之间的距离
 * @param {number} x1 - 第一个点的x坐标
 * @param {number} y1 - 第一个点的y坐标
 * @param {number} x2 - 第二个点的x坐标
 * @param {number} y2 - 第二个点的y坐标
 * @returns {number} 两点之间的距离
 */
const distance = (x1, y1, x2, y2) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * 将角度转换为弧度
 * @param {number} degrees - 角度
 * @returns {number} 弧度
 */
const degreesToRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * 将弧度转换为角度
 * @param {number} radians - 弧度
 * @returns {number} 角度
 */
const radiansToDegrees = (radians) => {
  return radians * (180 / Math.PI);
};

/**
 * 计算百分比增长
 * @param {number} oldValue - 旧值
 * @param {number} newValue - 新值
 * @param {number} decimals - 小数位数
 * @returns {number} 增长百分比
 */
const percentChange = (oldValue, newValue, decimals = 2) => {
  if (oldValue === 0) {
    return newValue > 0 ? 100 : 0;
  }
  
  const change = ((newValue - oldValue) / Math.abs(oldValue)) * 100;
  return round(change, decimals);
};

/**
 * 格式化大数字（如添加千分位分隔符）
 * @param {number} num - 要格式化的数字
 * @param {number} decimals - 小数位数
 * @returns {string} 格式化后的字符串
 */
const formatNumber = (num, decimals = 0) => {
  if (typeof num !== 'number') {
    return '0';
  }
  
  // 使用Intl.NumberFormat进行格式化
  return new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num);
};

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @param {number} decimals - 小数位数
 * @returns {string} 格式化后的文件大小
 */
const formatFileSize = (bytes, decimals = 2) => {
  if (bytes === 0) {
    return '0 B';
  }
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return round(bytes / Math.pow(k, i), decimals) + ' ' + sizes[i];
};

/**
 * 将数字转换为货币格式
 * @param {number} amount - 金额
 * @param {string} currency - 货币代码（如'CNY'、'USD'等）
 * @param {string} locale - 地区代码（如'zh-CN'、'en-US'等）
 * @returns {string} 格式化后的货币字符串
 */
const formatCurrency = (amount, currency = 'CNY', locale = 'zh-CN') => {
  if (typeof amount !== 'number') {
    return '';
  }
  
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(amount);
  } catch (error) {
    return amount.toString();
  }
};

/**
 * 计算数组的总和
 * @param {Array<number>} arr - 数字数组
 * @returns {number} 总和
 */
const sum = (arr) => {
  if (!Array.isArray(arr)) {
    return 0;
  }
  
  return arr.reduce((acc, val) => acc + (typeof val === 'number' ? val : 0), 0);
};

/**
 * 计算数组的最大值
 * @param {Array<number>} arr - 数字数组
 * @returns {number} 最大值
 */
const max = (arr) => {
  if (!Array.isArray(arr) || arr.length === 0) {
    return -Infinity;
  }
  
  return Math.max(...arr.filter(val => typeof val === 'number'));
};

/**
 * 计算数组的最小值
 * @param {Array<number>} arr - 数字数组
 * @returns {number} 最小值
 */
const min = (arr) => {
  if (!Array.isArray(arr) || arr.length === 0) {
    return Infinity;
  }
  
  return Math.min(...arr.filter(val => typeof val === 'number'));
};

/**
 * 计算阶乘
 * @param {number} n - 非负整数
 * @returns {number} 阶乘值
 */
const factorial = (n) => {
  if (n < 0 || !Number.isInteger(n)) {
    return 0;
  }
  if (n === 0 || n === 1) {
    return 1;
  }
  
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  
  return result;
};

/**
 * 检查两个数字是否近似相等
 * @param {number} a - 第一个数字
 * @param {number} b - 第二个数字
 * @param {number} epsilon - 允许的误差范围
 * @returns {boolean} 是否近似相等
 */
const approximatelyEqual = (a, b, epsilon = 0.0001) => {
  return Math.abs(a - b) < epsilon;
};

/**
 * 计算数字的绝对值
 * @param {number} num - 要计算的数字
 * @returns {number} 绝对值
 */
const abs = (num) => {
  return Math.abs(num);
};

/**
 * 计算幂
 * @param {number} base - 底数
 * @param {number} exponent - 指数
 * @returns {number} 幂值
 */
const power = (base, exponent) => {
  return Math.pow(base, exponent);
};

/**
 * 计算平方根
 * @param {number} num - 要计算的数字
 * @returns {number} 平方根
 */
const squareRoot = (num) => {
  return Math.sqrt(num);
};

/**
 * 线性插值
 * @param {number} start - 起始值
 * @param {number} end - 结束值
 * @param {number} ratio - 插值比例（0-1）
 * @returns {number} 插值结果
 */
const lerp = (start, end, ratio) => {
  // 确保ratio在0-1范围内
  ratio = clamp(ratio, 0, 1);
  return start + (end - start) * ratio;
};

module.exports = {
  random,
  randomInt,
  randomFloat,
  round,
  ceil,
  floor,
  clamp,
  percentage,
  average,
  median,
  mode,
  standardDeviation,
  fibonacci,
  isPrime,
  distance,
  degreesToRadians,
  radiansToDegrees,
  percentChange,
  formatNumber,
  formatFileSize,
  formatCurrency,
  sum,
  max,
  min,
  factorial,
  approximatelyEqual,
  abs,
  power,
  squareRoot,
  lerp
};