/**
 * 数学工具
 * 提供数学运算和计算功能
 */

const logger = require('../logger');
const { AppError } = require('../../exception/handlers/errorHandler');
const { MathError } = require('../../exception/handlers/errorHandler');
const { typeUtils } = require('../type');

/**
 * 数学工具类
 */
class MathUtils {
  /**
   * 构造函数
   */
  constructor() {
    // 数学常量
    this.constants = {
      PI: Math.PI,
      E: Math.E,
      GOLDEN_RATIO: (1 + Math.sqrt(5)) / 2,
      SQRT2: Math.SQRT2,
      SQRT1_2: Math.SQRT1_2,
      LN2: Math.LN2,
      LN10: Math.LN10,
      LOG2E: Math.LOG2E,
      LOG10E: Math.LOG10E,
      DEGREES_TO_RADIANS: Math.PI / 180,
      RADIANS_TO_DEGREES: 180 / Math.PI
    };

    // 精度配置
    this.defaultPrecision = 10;

    logger.debug('数学工具初始化完成');
  }

  /**
   * 加法运算（避免浮点数精度问题）
   * @param {number} a - 第一个数
   * @param {number} b - 第二个数
   * @param {number} precision - 精度
   * @returns {number} 结果
   */
  add(a, b, precision = this.defaultPrecision) {
    const multiplier = Math.pow(10, precision);
    return Math.round((a * multiplier + b * multiplier) / multiplier);
  }

  /**
   * 减法运算（避免浮点数精度问题）
   * @param {number} a - 第一个数
   * @param {number} b - 第二个数
   * @param {number} precision - 精度
   * @returns {number} 结果
   */
  subtract(a, b, precision = this.defaultPrecision) {
    const multiplier = Math.pow(10, precision);
    return Math.round((a * multiplier - b * multiplier) / multiplier);
  }

  /**
   * 乘法运算（避免浮点数精度问题）
   * @param {number} a - 第一个数
   * @param {number} b - 第二个数
   * @param {number} precision - 精度
   * @returns {number} 结果
   */
  multiply(a, b, precision = this.defaultPrecision) {
    const multiplier = Math.pow(10, precision);
    return Math.round((a * b) * multiplier) / multiplier;
  }

  /**
   * 除法运算（避免浮点数精度问题）
   * @param {number} a - 被除数
   * @param {number} b - 除数
   * @param {number} precision - 精度
   * @returns {number} 结果
   */
  divide(a, b, precision = this.defaultPrecision) {
    if (b === 0) {
      throw new MathError('除数不能为零', {
        code: 'DIVISION_BY_ZERO',
        dividend: a,
        divisor: b
      });
    }
    
    const multiplier = Math.pow(10, precision);
    return Math.round((a / b) * multiplier) / multiplier;
  }

  /**
   * 幂运算
   * @param {number} base - 底数
   * @param {number} exponent - 指数
   * @returns {number} 结果
   */
  power(base, exponent) {
    return Math.pow(base, exponent);
  }

  /**
   * 平方根
   * @param {number} x - 要计算平方根的数
   * @returns {number} 平方根
   */
  squareRoot(x) {
    if (x < 0) {
      throw new MathError('不能计算负数的平方根', {
        code: 'NEGATIVE_SQUARE_ROOT',
        value: x
      });
    }
    return Math.sqrt(x);
  }

  /**
   * n次方根
   * @param {number} x - 要计算n次方根的数
   * @param {number} n - 根指数
   * @returns {number} n次方根
   */
  nthRoot(x, n) {
    if (n === 0) {
      throw new MathError('根指数不能为零', {
        code: 'ZERO_ROOT_EXPONENT',
        value: x,
        exponent: n
      });
    }
    
    if (x < 0 && n % 2 === 0) {
      throw new MathError('不能计算负数的偶次方根', {
        code: 'NEGATIVE_EVEN_ROOT',
        value: x,
        exponent: n
      });
    }
    
    return Math.pow(x, 1 / n);
  }

  /**
   * 绝对值
   * @param {number} x - 要计算绝对值的数
   * @returns {number} 绝对值
   */
  absolute(x) {
    return Math.abs(x);
  }

  /**
   * 取整（四舍五入）
   * @param {number} x - 要取整的数
   * @returns {number} 整数
   */
  round(x) {
    return Math.round(x);
  }

  /**
   * 向上取整
   * @param {number} x - 要取整的数
   * @returns {number} 整数
   */
  ceil(x) {
    return Math.ceil(x);
  }

  /**
   * 向下取整
   * @param {number} x - 要取整的数
   * @returns {number} 整数
   */
  floor(x) {
    return Math.floor(x);
  }

  /**
   * 取模运算
   * @param {number} a - 被除数
   * @param {number} b - 除数
   * @returns {number} 余数
   */
  modulo(a, b) {
    if (b === 0) {
      throw new MathError('模运算的除数不能为零', {
        code: 'MODULO_BY_ZERO',
        dividend: a,
        divisor: b
      });
    }
    return ((a % b) + b) % b; // 确保结果为正数
  }

  /**
   * 最大值
   * @param {Array<number>} numbers - 数字数组
   * @returns {number} 最大值
   */
  max(numbers) {
    if (!typeUtils.isArray(numbers) || numbers.length === 0) {
      throw new MathError('max函数需要非空数字数组', {
        code: 'INVALID_ARRAY',
        numbers
      });
    }
    return Math.max(...numbers);
  }

  /**
   * 最小值
   * @param {Array<number>} numbers - 数字数组
   * @returns {number} 最小值
   */
  min(numbers) {
    if (!typeUtils.isArray(numbers) || numbers.length === 0) {
      throw new MathError('min函数需要非空数字数组', {
        code: 'INVALID_ARRAY',
        numbers
      });
    }
    return Math.min(...numbers);
  }

  /**
   * 求和
   * @param {Array<number>} numbers - 数字数组
   * @returns {number} 和
   */
  sum(numbers) {
    if (!typeUtils.isArray(numbers)) {
      return 0;
    }
    return numbers.reduce((acc, num) => acc + num, 0);
  }

  /**
   * 平均值
   * @param {Array<number>} numbers - 数字数组
   * @returns {number} 平均值
   */
  average(numbers) {
    if (!typeUtils.isArray(numbers) || numbers.length === 0) {
      return 0;
    }
    return this.sum(numbers) / numbers.length;
  }

  /**
   * 中位数
   * @param {Array<number>} numbers - 数字数组
   * @returns {number} 中位数
   */
  median(numbers) {
    if (!typeUtils.isArray(numbers) || numbers.length === 0) {
      return 0;
    }
    
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    if (sorted.length % 2 === 0) {
      return (sorted[mid - 1] + sorted[mid]) / 2;
    }
    
    return sorted[mid];
  }

  /**
   * 众数
   * @param {Array<number>} numbers - 数字数组
   * @returns {number} 众数
   */
  mode(numbers) {
    if (!typeUtils.isArray(numbers) || numbers.length === 0) {
      return 0;
    }
    
    const frequency = {};
    numbers.forEach(num => {
      frequency[num] = (frequency[num] || 0) + 1;
    });
    
    let maxFreq = 0;
    let mode = numbers[0];
    
    Object.entries(frequency).forEach(([num, freq]) => {
      if (freq > maxFreq) {
        maxFreq = freq;
        mode = Number(num);
      }
    });
    
    return mode;
  }

  /**
   * 标准差
   * @param {Array<number>} numbers - 数字数组
   * @returns {number} 标准差
   */
  standardDeviation(numbers) {
    if (!typeUtils.isArray(numbers) || numbers.length === 0) {
      return 0;
    }
    
    const avg = this.average(numbers);
    const squaredDiffs = numbers.map(num => Math.pow(num - avg, 2));
    const variance = this.average(squaredDiffs);
    
    return Math.sqrt(variance);
  }

  /**
   * 随机数（0到1之间）
   * @returns {number} 随机数
   */
  random() {
    return Math.random();
  }

  /**
   * 范围内的随机整数
   * @param {number} min - 最小值（包含）
   * @param {number} max - 最大值（包含）
   * @returns {number} 随机整数
   */
  randomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * 范围内的随机浮点数
   * @param {number} min - 最小值
   * @param {number} max - 最大值
   * @returns {number} 随机浮点数
   */
  randomFloat(min, max) {
    return Math.random() * (max - min) + min;
  }

  /**
   * 角度转弧度
   * @param {number} degrees - 角度
   * @returns {number} 弧度
   */
  degreesToRadians(degrees) {
    return degrees * this.constants.DEGREES_TO_RADIANS;
  }

  /**
   * 弧度转角度
   * @param {number} radians - 弧度
   * @returns {number} 角度
   */
  radiansToDegrees(radians) {
    return radians * this.constants.RADIANS_TO_DEGREES;
  }

  /**
   * 正弦函数
   * @param {number} radians - 弧度
   * @returns {number} 正弦值
   */
  sin(radians) {
    return Math.sin(radians);
  }

  /**
   * 余弦函数
   * @param {number} radians - 弧度
   * @returns {number} 余弦值
   */
  cos(radians) {
    return Math.cos(radians);
  }

  /**
   * 正切函数
   * @param {number} radians - 弧度
   * @returns {number} 正切值
   */
  tan(radians) {
    return Math.tan(radians);
  }

  /**
   * 反正弦函数
   * @param {number} value - 正弦值（-1到1之间）
   * @returns {number} 弧度
   */
  asin(value) {
    if (value < -1 || value > 1) {
      throw new MathError('asin函数的参数必须在-1到1之间', {
        code: 'INVALID_ASIN_ARGUMENT',
        value
      });
    }
    return Math.asin(value);
  }

  /**
   * 反余弦函数
   * @param {number} value - 余弦值（-1到1之间）
   * @returns {number} 弧度
   */
  acos(value) {
    if (value < -1 || value > 1) {
      throw new MathError('acos函数的参数必须在-1到1之间', {
        code: 'INVALID_ACOS_ARGUMENT',
        value
      });
    }
    return Math.acos(value);
  }

  /**
   * 反正切函数
   * @param {number} value - 正切值
   * @returns {number} 弧度
   */
  atan(value) {
    return Math.atan(value);
  }

  /**
   * 反正切2函数
   * @param {number} y - y坐标
   * @param {number} x - x坐标
   * @returns {number} 弧度
   */
  atan2(y, x) {
    return Math.atan2(y, x);
  }

  /**
   * 自然对数
   * @param {number} x - 要计算自然对数的数（x > 0）
   * @returns {number} 自然对数
   */
  ln(x) {
    if (x <= 0) {
      throw new MathError('自然对数的参数必须大于零', {
        code: 'INVALID_LN_ARGUMENT',
        value: x
      });
    }
    return Math.log(x);
  }

  /**
   * 以10为底的对数
   * @param {number} x - 要计算对数的数（x > 0）
   * @returns {number} 以10为底的对数
   */
  log10(x) {
    if (x <= 0) {
      throw new MathError('log10函数的参数必须大于零', {
        code: 'INVALID_LOG10_ARGUMENT',
        value: x
      });
    }
    return Math.log10(x);
  }

  /**
   * 以任意底的对数
   * @param {number} x - 要计算对数的数（x > 0）
   * @param {number} base - 底数（base > 0, base !== 1）
   * @returns {number} 对数
   */
  log(x, base) {
    if (x <= 0) {
      throw new MathError('log函数的参数必须大于零', {
        code: 'INVALID_LOG_ARGUMENT',
        value: x,
        base
      });
    }
    
    if (base <= 0 || base === 1) {
      throw new MathError('log函数的底数必须大于零且不等于1', {
        code: 'INVALID_LOG_BASE',
        value: x,
        base
      });
    }
    
    return Math.log(x) / Math.log(base);
  }

  /**
   * 指数函数（e^x）
   * @param {number} x - 指数
   * @returns {number} e的x次方
   */
  exp(x) {
    return Math.exp(x);
  }

  /**
   * 双曲正弦函数
   * @param {number} x - 自变量
   * @returns {number} 双曲正弦值
   */
  sinh(x) {
    return (Math.exp(x) - Math.exp(-x)) / 2;
  }

  /**
   * 双曲余弦函数
   * @param {number} x - 自变量
   * @returns {number} 双曲余弦值
   */
  cosh(x) {
    return (Math.exp(x) + Math.exp(-x)) / 2;
  }

  /**
   * 双曲正切函数
   * @param {number} x - 自变量
   * @returns {number} 双曲正切值
   */
  tanh(x) {
    if (x === Infinity) return 1;
    if (x === -Infinity) return -1;
    
    const e2x = Math.exp(2 * x);
    return (e2x - 1) / (e2x + 1);
  }

  /**
   * 限制数值在指定范围内
   * @param {number} value - 要限制的值
   * @param {number} min - 最小值
   * @param {number} max - 最大值
   * @returns {number} 限制后的值
   */
  clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  /**
   * 线性插值
   * @param {number} start - 起始值
   * @param {number} end - 结束值
   * @param {number} t - 插值因子（0到1之间）
   * @returns {number} 插值结果
   */
  lerp(start, end, t) {
    t = this.clamp(t, 0, 1);
    return start + (end - start) * t;
  }

  /**
   * 计算两点之间的距离
   * @param {number} x1 - 第一点x坐标
   * @param {number} y1 - 第一点y坐标
   * @param {number} x2 - 第二点x坐标
   * @param {number} y2 - 第二点y坐标
   * @returns {number} 距离
   */
  distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 计算点到直线的距离
   * @param {number} x - 点的x坐标
   * @param {number} y - 点的y坐标
   * @param {number} a - 直线方程ax + by + c = 0的a系数
   * @param {number} b - 直线方程ax + by + c = 0的b系数
   * @param {number} c - 直线方程ax + by + c = 0的c系数
   * @returns {number} 距离
   */
  distanceToLine(x, y, a, b, c) {
    const denominator = Math.sqrt(a * a + b * b);
    if (denominator === 0) {
      throw new MathError('直线参数无效', {
        code: 'INVALID_LINE_PARAMETERS',
        a,
        b,
        c
      });
    }
    return Math.abs(a * x + b * y + c) / denominator;
  }

  /**
   * 计算圆的面积
   * @param {number} radius - 半径
   * @returns {number} 面积
   */
  circleArea(radius) {
    if (radius < 0) {
      throw new MathError('圆的半径不能为负数', {
        code: 'NEGATIVE_RADIUS',
        radius
      });
    }
    return Math.PI * radius * radius;
  }

  /**
   * 计算圆的周长
   * @param {number} radius - 半径
   * @returns {number} 周长
   */
  circleCircumference(radius) {
    if (radius < 0) {
      throw new MathError('圆的半径不能为负数', {
        code: 'NEGATIVE_RADIUS',
        radius
      });
    }
    return 2 * Math.PI * radius;
  }

  /**
   * 计算矩形的面积
   * @param {number} width - 宽度
   * @param {number} height - 高度
   * @returns {number} 面积
   */
  rectangleArea(width, height) {
    if (width < 0 || height < 0) {
      throw new MathError('矩形的宽度和高度不能为负数', {
        code: 'NEGATIVE_DIMENSIONS',
        width,
        height
      });
    }
    return width * height;
  }

  /**
   * 计算矩形的周长
   * @param {number} width - 宽度
   * @param {number} height - 高度
   * @returns {number} 周长
   */
  rectanglePerimeter(width, height) {
    if (width < 0 || height < 0) {
      throw new MathError('矩形的宽度和高度不能为负数', {
        code: 'NEGATIVE_DIMENSIONS',
        width,
        height
      });
    }
    return 2 * (width + height);
  }

  /**
   * 计算三角形的面积（海伦公式）
   * @param {number} a - 第一条边
   * @param {number} b - 第二条边
   * @param {number} c - 第三条边
   * @returns {number} 面积
   */
  triangleArea(a, b, c) {
    // 检查三角形不等式
    if (a + b <= c || a + c <= b || b + c <= a) {
      throw new MathError('无效的三角形边长', {
        code: 'INVALID_TRIANGLE_SIDES',
        a,
        b,
        c
      });
    }
    
    // 检查边长是否为正数
    if (a <= 0 || b <= 0 || c <= 0) {
      throw new MathError('三角形的边长必须为正数', {
        code: 'NON_POSITIVE_TRIANGLE_SIDES',
        a,
        b,
        c
      });
    }
    
    // 海伦公式
    const s = (a + b + c) / 2;
    return Math.sqrt(s * (s - a) * (s - b) * (s - c));
  }

  /**
   * 格式化数字（保留指定小数位）
   * @param {number} value - 要格式化的数字
   * @param {number} decimals - 小数位数
   * @returns {number} 格式化后的数字
   */
  formatDecimal(value, decimals = 2) {
    const multiplier = Math.pow(10, decimals);
    return Math.round(value * multiplier) / multiplier;
  }

  /**
   * 格式化百分比
   * @param {number} value - 要格式化的数字
   * @param {number} decimals - 小数位数
   * @returns {string} 百分比字符串
   */
  formatPercent(value, decimals = 2) {
    const percent = this.formatDecimal(value * 100, decimals);
    return `${percent}%`;
  }

  /**
   * 计算增长率
   * @param {number} current - 当前值
   * @param {number} previous - 之前的值
   * @returns {number} 增长率（小数形式）
   */
  growthRate(current, previous) {
    if (previous === 0) {
      return current > 0 ? Infinity : 0;
    }
    return (current - previous) / Math.abs(previous);
  }

  /**
   * 计算复利
   * @param {number} principal - 本金
   * @param {number} rate - 年利率（小数形式）
   * @param {number} time - 时间（年）
   * @param {number} compoundingFrequency - 复利频率（每年复利次数）
   * @returns {number} 最终金额
   */
  compoundInterest(principal, rate, time, compoundingFrequency = 1) {
    return principal * Math.pow(1 + rate / compoundingFrequency, compoundingFrequency * time);
  }

  /**
   * 验证是否为质数
   * @param {number} n - 要检查的数
   * @returns {boolean} 是否为质数
   */
  isPrime(n) {
    if (!Number.isInteger(n) || n <= 1) {
      return false;
    }
    
    if (n <= 3) {
      return true;
    }
    
    if (n % 2 === 0 || n % 3 === 0) {
      return false;
    }
    
    const sqrtN = Math.sqrt(n);
    for (let i = 5; i <= sqrtN; i += 6) {
      if (n % i === 0 || n % (i + 2) === 0) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * 计算最大公约数（GCD）
   * @param {number} a - 第一个数
   * @param {number} b - 第二个数
   * @returns {number} 最大公约数
   */
  gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    
    while (b !== 0) {
      const temp = b;
      b = a % b;
      a = temp;
    }
    
    return a;
  }

  /**
   * 计算最小公倍数（LCM）
   * @param {number} a - 第一个数
   * @param {number} b - 第二个数
   * @returns {number} 最小公倍数
   */
  lcm(a, b) {
    if (a === 0 || b === 0) {
      return 0;
    }
    
    a = Math.abs(a);
    b = Math.abs(b);
    
    return (a * b) / this.gcd(a, b);
  }

  /**
   * 静态实例
   * @private
   */
  static _instance = null;

  /**
   * 获取单例实例
   * @returns {MathUtils} 数学工具实例
   */
  static getInstance() {
    if (!MathUtils._instance) {
      MathUtils._instance = new MathUtils();
    }
    return MathUtils._instance;
  }

  /**
   * 创建新的数学工具实例
   * @returns {MathUtils} 数学工具实例
   */
  static create() {
    return new MathUtils();
  }
}

// 创建默认实例
const defaultMathUtils = MathUtils.getInstance();

module.exports = {
  MathUtils,
  mathUtils: defaultMathUtils
};