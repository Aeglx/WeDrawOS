/**
 * 类型工具
 * 提供类型检查和转换功能
 */

const logger = require('../logger');
const { AppError } = require('../../exception/handlers/errorHandler');
const { TypeError } = require('../../exception/handlers/errorHandler');

/**
 * 类型工具类
 */
class TypeUtils {
  /**
   * 构造函数
   */
  constructor() {
    // 初始化类型检查映射
    this.typeCheckers = {
      string: this.isString.bind(this),
      number: this.isNumber.bind(this),
      boolean: this.isBoolean.bind(this),
      object: this.isObject.bind(this),
      array: this.isArray.bind(this),
      function: this.isFunction.bind(this),
      null: this.isNull.bind(this),
      undefined: this.isUndefined.bind(this),
      date: this.isDate.bind(this),
      regexp: this.isRegExp.bind(this),
      symbol: this.isSymbol.bind(this),
      bigint: this.isBigInt.bind(this),
      error: this.isError.bind(this),
      promise: this.isPromise.bind(this),
      map: this.isMap.bind(this),
      set: this.isSet.bind(this),
      weakmap: this.isWeakMap.bind(this),
      weakset: this.isWeakSet.bind(this),
      buffer: this.isBuffer.bind(this),
      arraybuffer: this.isArrayBuffer.bind(this),
      typedarray: this.isTypedArray.bind(this),
      int8array: this.isInt8Array.bind(this),
      uint8array: this.isUint8Array.bind(this),
      uint8clampedarray: this.isUint8ClampedArray.bind(this),
      int16array: this.isInt16Array.bind(this),
      uint16array: this.isUint16Array.bind(this),
      int32array: this.isInt32Array.bind(this),
      uint32array: this.isUint32Array.bind(this),
      float32array: this.isFloat32Array.bind(this),
      float64array: this.isFloat64Array.bind(this),
      dataview: this.isDataView.bind(this)
    };

    logger.debug('类型工具初始化完成');
  }

  /**
   * 获取值的类型
   * @param {*} value - 要检查的值
   * @returns {string} 类型名称
   */
  getType(value) {
    if (value === null) {
      return 'null';
    }
    if (value === undefined) {
      return 'undefined';
    }

    // 使用Object.prototype.toString获取准确类型
    const typeString = Object.prototype.toString.call(value);
    // 提取类型名称（例如：[object String] -> string）
    const typeName = typeString.slice(8, -1).toLowerCase();

    return typeName;
  }

  /**
   * 检查值是否为字符串
   * @param {*} value - 要检查的值
   * @returns {boolean} 是否为字符串
   */
  isString(value) {
    return typeof value === 'string' || value instanceof String;
  }

  /**
   * 检查值是否为数字
   * @param {*} value - 要检查的值
   * @param {Object} options - 选项
   * @param {boolean} options.strict - 是否严格检查（排除NaN和Infinity）
   * @returns {boolean} 是否为数字
   */
  isNumber(value, options = {}) {
    const { strict = false } = options;
    
    if (strict) {
      return typeof value === 'number' && !isNaN(value) && isFinite(value);
    }
    
    return typeof value === 'number' || value instanceof Number;
  }

  /**
   * 检查值是否为整数
   * @param {*} value - 要检查的值
   * @returns {boolean} 是否为整数
   */
  isInteger(value) {
    return Number.isInteger(value);
  }

  /**
   * 检查值是否为布尔值
   * @param {*} value - 要检查的值
   * @returns {boolean} 是否为布尔值
   */
  isBoolean(value) {
    return typeof value === 'boolean' || value instanceof Boolean;
  }

  /**
   * 检查值是否为对象（非null）
   * @param {*} value - 要检查的值
   * @returns {boolean} 是否为对象
   */
  isObject(value) {
    return value !== null && typeof value === 'object';
  }

  /**
   * 检查值是否为普通对象（非数组、函数等）
   * @param {*} value - 要检查的值
   * @returns {boolean} 是否为普通对象
   */
  isPlainObject(value) {
    if (!this.isObject(value)) {
      return false;
    }
    
    // 检查构造函数
    const proto = Object.getPrototypeOf(value);
    
    // null原型对象也是普通对象
    if (proto === null) {
      return true;
    }
    
    // 原型链上只有Object.prototype的对象是普通对象
    return Object.getPrototypeOf(proto) === null;
  }

  /**
   * 检查值是否为数组
   * @param {*} value - 要检查的值
   * @returns {boolean} 是否为数组
   */
  isArray(value) {
    return Array.isArray(value);
  }

  /**
   * 检查值是否为函数
   * @param {*} value - 要检查的值
   * @returns {boolean} 是否为函数
   */
  isFunction(value) {
    return typeof value === 'function';
  }

  /**
   * 检查值是否为null
   * @param {*} value - 要检查的值
   * @returns {boolean} 是否为null
   */
  isNull(value) {
    return value === null;
  }

  /**
   * 检查值是否为undefined
   * @param {*} value - 要检查的值
   * @returns {boolean} 是否为undefined
   */
  isUndefined(value) {
    return value === undefined;
  }

  /**
   * 检查值是否为null或undefined
   * @param {*} value - 要检查的值
   * @returns {boolean} 是否为null或undefined
   */
  isNullOrUndefined(value) {
    return this.isNull(value) || this.isUndefined(value);
  }

  /**
   * 检查值是否为空（null, undefined, 空字符串, 空数组, 空对象）
   * @param {*} value - 要检查的值
   * @returns {boolean} 是否为空
   */
  isEmpty(value) {
    if (this.isNullOrUndefined(value)) {
      return true;
    }
    
    if (this.isString(value) && value.trim() === '') {
      return true;
    }
    
    if (this.isArray(value) && value.length === 0) {
      return true;
    }
    
    if (this.isObject(value)) {
      return Object.keys(value).length === 0;
    }
    
    return false;
  }

  /**
   * 检查值是否为Date对象
   * @param {*} value - 要检查的值
   * @returns {boolean} 是否为Date对象
   */
  isDate(value) {
    return value instanceof Date && !isNaN(value.getTime());
  }

  /**
   * 检查值是否为RegExp对象
   * @param {*} value - 要检查的值
   * @returns {boolean} 是否为RegExp对象
   */
  isRegExp(value) {
    return value instanceof RegExp;
  }

  /**
   * 检查值是否为Symbol
   * @param {*} value - 要检查的值
   * @returns {boolean} 是否为Symbol
   */
  isSymbol(value) {
    return typeof value === 'symbol';
  }

  /**
   * 检查值是否为BigInt
   * @param {*} value - 要检查的值
   * @returns {boolean} 是否为BigInt
   */
  isBigInt(value) {
    return typeof value === 'bigint';
  }

  /**
   * 检查值是否为Error对象
   * @param {*} value - 要检查的值
   * @returns {boolean} 是否为Error对象
   */
  isError(value) {
    return value instanceof Error;
  }

  /**
   * 检查值是否为Promise对象
   * @param {*} value - 要检查的值
   * @returns {boolean} 是否为Promise对象
   */
  isPromise(value) {
    return this.isObject(value) && this.isFunction(value.then) && this.isFunction(value.catch);
  }

  /**
   * 检查值是否为Map对象
   * @param {*} value - 要检查的值
   * @returns {boolean} 是否为Map对象
   */
  isMap(value) {
    return value instanceof Map;
  }

  /**
   * 检查值是否为Set对象
   * @param {*} value - 要检查的值
   * @returns {boolean} 是否为Set对象
   */
  isSet(value) {
    return value instanceof Set;
  }

  /**
   * 检查值是否为WeakMap对象
   * @param {*} value - 要检查的值
   * @returns {boolean} 是否为WeakMap对象
   */
  isWeakMap(value) {
    return value instanceof WeakMap;
  }

  /**
   * 检查值是否为WeakSet对象
   * @param {*} value - 要检查的值
   * @returns {boolean} 是否为WeakSet对象
   */
  isWeakSet(value) {
    return value instanceof WeakSet;
  }

  /**
   * 检查值是否为Buffer对象
   * @param {*} value - 要检查的值
   * @returns {boolean} 是否为Buffer对象
   */
  isBuffer(value) {
    return Buffer.isBuffer(value);
  }

  /**
   * 检查值是否为ArrayBuffer对象
   * @param {*} value - 要检查的值
   * @returns {boolean} 是否为ArrayBuffer对象
   */
  isArrayBuffer(value) {
    return value instanceof ArrayBuffer;
  }

  /**
   * 检查值是否为TypedArray对象
   * @param {*} value - 要检查的值
   * @returns {boolean} 是否为TypedArray对象
   */
  isTypedArray(value) {
    if (!this.isObject(value)) {
      return false;
    }
    
    const typedArrayTypes = [
      Int8Array,
      Uint8Array,
      Uint8ClampedArray,
      Int16Array,
      Uint16Array,
      Int32Array,
      Uint32Array,
      Float32Array,
      Float64Array
    ];
    
    return typedArrayTypes.some(type => value instanceof type);
  }

  /**
   * 检查值是否为Int8Array对象
   * @param {*} value - 要检查的值
   * @returns {boolean} 是否为Int8Array对象
   */
  isInt8Array(value) {
    return value instanceof Int8Array;
  }

  /**
   * 检查值是否为Uint8Array对象
   * @param {*} value - 要检查的值
   * @returns {boolean} 是否为Uint8Array对象
   */
  isUint8Array(value) {
    return value instanceof Uint8Array;
  }

  /**
   * 检查值是否为Uint8ClampedArray对象
   * @param {*} value - 要检查的值
   * @returns {boolean} 是否为Uint8ClampedArray对象
   */
  isUint8ClampedArray(value) {
    return value instanceof Uint8ClampedArray;
  }

  /**
   * 检查值是否为Int16Array对象
   * @param {*} value - 要检查的值
   * @returns {boolean} 是否为Int16Array对象
   */
  isInt16Array(value) {
    return value instanceof Int16Array;
  }

  /**
   * 检查值是否为Uint16Array对象
   * @param {*} value - 要检查的值
   * @returns {boolean} 是否为Uint16Array对象
   */
  isUint16Array(value) {
    return value instanceof Uint16Array;
  }

  /**
   * 检查值是否为Int32Array对象
   * @param {*} value - 要检查的值
   * @returns {boolean} 是否为Int32Array对象
   */
  isInt32Array(value) {
    return value instanceof Int32Array;
  }

  /**
   * 检查值是否为Uint32Array对象
   * @param {*} value - 要检查的值
   * @returns {boolean} 是否为Uint32Array对象
   */
  isUint32Array(value) {
    return value instanceof Uint32Array;
  }

  /**
   * 检查值是否为Float32Array对象
   * @param {*} value - 要检查的值
   * @returns {boolean} 是否为Float32Array对象
   */
  isFloat32Array(value) {
    return value instanceof Float32Array;
  }

  /**
   * 检查值是否为Float64Array对象
   * @param {*} value - 要检查的值
   * @returns {boolean} 是否为Float64Array对象
   */
  isFloat64Array(value) {
    return value instanceof Float64Array;
  }

  /**
   * 检查值是否为DataView对象
   * @param {*} value - 要检查的值
   * @returns {boolean} 是否为DataView对象
   */
  isDataView(value) {
    return value instanceof DataView;
  }

  /**
   * 检查值是否为指定类型
   * @param {*} value - 要检查的值
   * @param {string|Array<string>} type - 类型或类型数组
   * @returns {boolean} 是否为指定类型
   */
  isType(value, type) {
    if (this.isString(type)) {
      const typeChecker = this.typeCheckers[type.toLowerCase()];
      if (typeChecker) {
        return typeChecker(value);
      }
      return false;
    }
    
    if (this.isArray(type)) {
      return type.some(t => this.isType(value, t));
    }
    
    return false;
  }

  /**
   * 将值转换为字符串
   * @param {*} value - 要转换的值
   * @param {Object} options - 选项
   * @param {string} options.defaultValue - 默认值
   * @returns {string} 转换后的字符串
   */
  toString(value, options = {}) {
    const { defaultValue = '' } = options;
    
    if (this.isNullOrUndefined(value)) {
      return defaultValue;
    }
    
    try {
      if (this.isObject(value) && !this.isString(value)) {
        // 对于对象，使用JSON序列化
        return JSON.stringify(value);
      }
      return String(value);
    } catch (error) {
      logger.error('转换为字符串失败', {
        value,
        error: error.message
      });
      return defaultValue;
    }
  }

  /**
   * 将值转换为数字
   * @param {*} value - 要转换的值
   * @param {Object} options - 选项
   * @param {number} options.defaultValue - 默认值
   * @param {boolean} options.strict - 是否严格转换（失败返回默认值）
   * @returns {number} 转换后的数字
   */
  toNumber(value, options = {}) {
    const { defaultValue = 0, strict = false } = options;
    
    if (this.isNullOrUndefined(value)) {
      return defaultValue;
    }
    
    // 已经是数字且非NaN
    if (this.isNumber(value, { strict: true })) {
      return value;
    }
    
    try {
      const num = Number(value);
      
      if (strict && (isNaN(num) || !isFinite(num))) {
        return defaultValue;
      }
      
      return num;
    } catch (error) {
      logger.error('转换为数字失败', {
        value,
        error: error.message
      });
      return defaultValue;
    }
  }

  /**
   * 将值转换为整数
   * @param {*} value - 要转换的值
   * @param {Object} options - 选项
   * @param {number} options.defaultValue - 默认值
   * @param {boolean} options.strict - 是否严格转换
   * @returns {number} 转换后的整数
   */
  toInteger(value, options = {}) {
    const { defaultValue = 0, strict = false } = options;
    
    try {
      const num = this.toNumber(value, { strict });
      
      if (strict && (isNaN(num) || !isFinite(num))) {
        return defaultValue;
      }
      
      return Math.floor(num);
    } catch (error) {
      return defaultValue;
    }
  }

  /**
   * 将值转换为布尔值
   * @param {*} value - 要转换的值
   * @param {Object} options - 选项
   * @param {boolean} options.strict - 是否严格转换（只有true、'true'、1、'1' 转换为true）
   * @returns {boolean} 转换后的布尔值
   */
  toBoolean(value, options = {}) {
    const { strict = false } = options;
    
    if (strict) {
      return value === true || value === 'true' || value === 1 || value === '1';
    }
    
    return !!value;
  }

  /**
   * 将值转换为数组
   * @param {*} value - 要转换的值
   * @returns {Array} 转换后的数组
   */
  toArray(value) {
    if (this.isArray(value)) {
      return value;
    }
    
    if (this.isNullOrUndefined(value)) {
      return [];
    }
    
    if (this.isString(value)) {
      return [value];
    }
    
    if (this.isSet(value) || this.isMap(value)) {
      return Array.from(value);
    }
    
    if (this.isObject(value) && value.length !== undefined) {
      return Array.from(value);
    }
    
    return [value];
  }

  /**
   * 将值转换为对象
   * @param {*} value - 要转换的值
   * @param {Object} options - 选项
   * @param {Object} options.defaultValue - 默认值
   * @returns {Object} 转换后的对象
   */
  toObject(value, options = {}) {
    const { defaultValue = {} } = options;
    
    if (this.isNull(value)) {
      return defaultValue;
    }
    
    if (this.isUndefined(value)) {
      return defaultValue;
    }
    
    if (this.isPlainObject(value)) {
      return value;
    }
    
    if (this.isArray(value)) {
      // 将数组转换为索引对象
      const obj = {};
      value.forEach((item, index) => {
        obj[index] = item;
      });
      return obj;
    }
    
    if (this.isMap(value)) {
      // 将Map转换为对象
      const obj = {};
      value.forEach((val, key) => {
        obj[key] = val;
      });
      return obj;
    }
    
    if (this.isSet(value)) {
      // 将Set转换为对象
      const obj = {};
      value.forEach((val, index) => {
        obj[index] = val;
      });
      return obj;
    }
    
    try {
      // 尝试通过JSON序列化和反序列化转换
      return JSON.parse(JSON.stringify(value));
    } catch (error) {
      logger.error('转换为对象失败', {
        value,
        error: error.message
      });
      return defaultValue;
    }
  }

  /**
   * 将值转换为Date对象
   * @param {*} value - 要转换的值
   * @param {Object} options - 选项
   * @param {Date} options.defaultValue - 默认值
   * @returns {Date|null} 转换后的Date对象
   */
  toDate(value, options = {}) {
    const { defaultValue = null } = options;
    
    if (this.isNullOrUndefined(value)) {
      return defaultValue;
    }
    
    if (this.isDate(value)) {
      return value;
    }
    
    try {
      const date = new Date(value);
      
      if (isNaN(date.getTime())) {
        return defaultValue;
      }
      
      return date;
    } catch (error) {
      logger.error('转换为Date对象失败', {
        value,
        error: error.message
      });
      return defaultValue;
    }
  }

  /**
   * 将值深拷贝
   * @param {*} value - 要拷贝的值
   * @returns {*} 拷贝后的值
   */
  deepClone(value) {
    if (this.isNullOrUndefined(value)) {
      return value;
    }
    
    if (this.isPrimitive(value)) {
      return value;
    }
    
    if (this.isDate(value)) {
      return new Date(value.getTime());
    }
    
    if (this.isRegExp(value)) {
      return new RegExp(value.source, value.flags);
    }
    
    if (this.isMap(value)) {
      const map = new Map();
      value.forEach((val, key) => {
        map.set(this.deepClone(key), this.deepClone(val));
      });
      return map;
    }
    
    if (this.isSet(value)) {
      const set = new Set();
      value.forEach(val => {
        set.add(this.deepClone(val));
      });
      return set;
    }
    
    if (this.isArray(value)) {
      return value.map(item => this.deepClone(item));
    }
    
    if (this.isObject(value)) {
      const cloned = {};
      Object.keys(value).forEach(key => {
        cloned[key] = this.deepClone(value[key]);
      });
      return cloned;
    }
    
    // 其他类型直接返回
    return value;
  }

  /**
   * 检查值是否为原始类型
   * @param {*} value - 要检查的值
   * @returns {boolean} 是否为原始类型
   */
  isPrimitive(value) {
    return (
      this.isString(value) ||
      this.isNumber(value) ||
      this.isBoolean(value) ||
      this.isNull(value) ||
      this.isUndefined(value) ||
      this.isSymbol(value) ||
      this.isBigInt(value)
    );
  }

  /**
   * 检查两个值是否相等（支持深度比较）
   * @param {*} value1 - 第一个值
   * @param {*} value2 - 第二个值
   * @param {Object} options - 选项
   * @param {boolean} options.strict - 是否严格比较（包括类型）
   * @returns {boolean} 是否相等
   */
  isEqual(value1, value2, options = {}) {
    const { strict = true } = options;
    
    // 严格比较类型
    if (strict && this.getType(value1) !== this.getType(value2)) {
      return false;
    }
    
    // 处理null和undefined
    if (this.isNullOrUndefined(value1) && this.isNullOrUndefined(value2)) {
      return true;
    }
    
    if (this.isNullOrUndefined(value1) || this.isNullOrUndefined(value2)) {
      return false;
    }
    
    // 处理原始类型
    if (this.isPrimitive(value1) || this.isPrimitive(value2)) {
      return strict ? value1 === value2 : String(value1) === String(value2);
    }
    
    // 处理Date对象
    if (this.isDate(value1) && this.isDate(value2)) {
      return value1.getTime() === value2.getTime();
    }
    
    // 处理RegExp对象
    if (this.isRegExp(value1) && this.isRegExp(value2)) {
      return value1.source === value2.source && value1.flags === value2.flags;
    }
    
    // 处理数组
    if (this.isArray(value1) && this.isArray(value2)) {
      if (value1.length !== value2.length) {
        return false;
      }
      
      return value1.every((item, index) => 
        this.isEqual(item, value2[index], options)
      );
    }
    
    // 处理对象
    if (this.isObject(value1) && this.isObject(value2)) {
      const keys1 = Object.keys(value1);
      const keys2 = Object.keys(value2);
      
      if (keys1.length !== keys2.length) {
        return false;
      }
      
      return keys1.every(key => {
        if (!keys2.includes(key)) {
          return false;
        }
        return this.isEqual(value1[key], value2[key], options);
      });
    }
    
    return false;
  }

  /**
   * 验证值的类型
   * @param {*} value - 要验证的值
   * @param {string|Array<string>} type - 期望的类型
   * @param {Object} options - 选项
   * @param {string} options.message - 自定义错误信息
   * @throws {TypeError} 类型不匹配时抛出异常
   */
  validateType(value, type, options = {}) {
    const { message } = options;
    
    if (!this.isType(value, type)) {
      const expectedType = Array.isArray(type) ? type.join('|') : type;
      const actualType = this.getType(value);
      
      const errorMessage = message || 
        `类型不匹配: 期望 ${expectedType}，实际是 ${actualType}`;
      
      throw new TypeError(errorMessage, {
        code: 'TYPE_MISMATCH',
        expectedType,
        actualType,
        value
      });
    }
  }

  /**
   * 静态实例
   * @private
   */
  static _instance = null;

  /**
   * 获取单例实例
   * @returns {TypeUtils} 类型工具实例
   */
  static getInstance() {
    if (!TypeUtils._instance) {
      TypeUtils._instance = new TypeUtils();
    }
    return TypeUtils._instance;
  }

  /**
   * 创建新的类型工具实例
   * @returns {TypeUtils} 类型工具实例
   */
  static create() {
    return new TypeUtils();
  }
}

// 创建默认实例
const defaultTypeUtils = TypeUtils.getInstance();

module.exports = {
  TypeUtils,
  typeUtils: defaultTypeUtils
};