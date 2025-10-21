/**
 * 数组处理工具类
 * 提供数组操作、转换、查找、排序等常用功能
 */

const logger = require('../logger');

/**
 * 数组处理工具
 */
class ArrayUtils {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   */
  constructor(options = {}) {
    this.options = {
      defaultCompareFn: (a, b) => a - b,
      caseSensitive: false,
      ...options
    };
    
    logger.debug('创建数组处理工具实例', { options });
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
   * 检查数组是否为空
   * @param {Array} array - 要检查的数组
   * @returns {boolean} 是否为空
   */
  isEmpty(array) {
    return !this.isArray(array) || array.length === 0;
  }

  /**
   * 确保值是数组，如果不是则包装成数组
   * @param {*} value - 要处理的值
   * @returns {Array} 处理后的数组
   */
  ensureArray(value) {
    if (value === null || value === undefined) {
      return [];
    }
    return this.isArray(value) ? value : [value];
  }

  /**
   * 获取数组的最后一个元素
   * @param {Array} array - 输入数组
   * @returns {*} 最后一个元素或undefined
   */
  last(array) {
    if (!this.isArray(array) || array.length === 0) {
      return undefined;
    }
    return array[array.length - 1];
  }

  /**
   * 获取数组的第一个元素
   * @param {Array} array - 输入数组
   * @returns {*} 第一个元素或undefined
   */
  first(array) {
    if (!this.isArray(array) || array.length === 0) {
      return undefined;
    }
    return array[0];
  }

  /**
   * 随机获取数组中的一个元素
   * @param {Array} array - 输入数组
   * @returns {*} 随机元素或undefined
   */
  randomElement(array) {
    if (!this.isArray(array) || array.length === 0) {
      return undefined;
    }
    const randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
  }

  /**
   * 从数组中随机选择指定数量的元素
   * @param {Array} array - 输入数组
   * @param {number} count - 要选择的元素数量
   * @returns {Array} 选择的元素数组
   */
  randomSample(array, count) {
    if (!this.isArray(array) || array.length === 0) {
      return [];
    }
    
    const validCount = Math.min(Math.max(1, count), array.length);
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, validCount);
  }

  /**
   * 数组去重
   * @param {Array} array - 输入数组
   * @param {Function} keyFn - 用于提取键的函数
   * @returns {Array} 去重后的数组
   */
  unique(array, keyFn) {
    if (!this.isArray(array)) {
      return [];
    }
    
    if (keyFn) {
      const seen = new Set();
      return array.filter(item => {
        const key = keyFn(item);
        const isNew = !seen.has(key);
        if (isNew) {
          seen.add(key);
        }
        return isNew;
      });
    }
    
    // 对于基本类型
    if (array.length === 0) return [];
    
    // 尝试使用Set（对于原始类型）
    if (typeof array[0] !== 'object' && array[0] !== null) {
      return [...new Set(array)];
    }
    
    // 对于对象类型，使用JSON字符串比较
    const seen = new Set();
    return array.filter(item => {
      const key = JSON.stringify(item);
      const isNew = !seen.has(key);
      if (isNew) {
        seen.add(key);
      }
      return isNew;
    });
  }

  /**
   * 扁平化数组
   * @param {Array} array - 嵌套数组
   * @param {number} depth - 扁平化深度，默认1
   * @returns {Array} 扁平化后的数组
   */
  flatten(array, depth = 1) {
    if (!this.isArray(array)) {
      return [];
    }
    
    // 使用原生flat方法（如果可用）
    if (Array.prototype.flat) {
      return array.flat(depth);
    }
    
    // 手动实现
    if (depth === 0) {
      return [...array];
    }
    
    return array.reduce((acc, val) => {
      if (this.isArray(val)) {
        acc.push(...this.flatten(val, depth - 1));
      } else {
        acc.push(val);
      }
      return acc;
    }, []);
  }

  /**
   * 深扁平化数组（无限深度）
   * @param {Array} array - 嵌套数组
   * @returns {Array} 扁平化后的数组
   */
  deepFlatten(array) {
    if (!this.isArray(array)) {
      return [];
    }
    
    // 使用原生flat方法（如果可用）
    if (Array.prototype.flat) {
      return array.flat(Infinity);
    }
    
    // 手动实现
    return array.reduce((acc, val) => {
      if (this.isArray(val)) {
        acc.push(...this.deepFlatten(val));
      } else {
        acc.push(val);
      }
      return acc;
    }, []);
  }

  /**
   * 将数组分块
   * @param {Array} array - 输入数组
   * @param {number} size - 每块的大小
   * @returns {Array} 分块后的二维数组
   */
  chunk(array, size) {
    if (!this.isArray(array) || array.length === 0 || size <= 0) {
      return [];
    }
    
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * 从数组中移除指定元素
   * @param {Array} array - 输入数组
   * @param {*} element - 要移除的元素
   * @returns {Array} 移除后的新数组
   */
  remove(array, element) {
    if (!this.isArray(array)) {
      return [];
    }
    
    return array.filter(item => item !== element);
  }

  /**
   * 根据条件移除数组元素
   * @param {Array} array - 输入数组
   * @param {Function} predicate - 判断函数
   * @returns {Array} 移除后的新数组
   */
  removeIf(array, predicate) {
    if (!this.isArray(array) || typeof predicate !== 'function') {
      return [];
    }
    
    return array.filter(item => !predicate(item));
  }

  /**
   * 查找数组中满足条件的第一个元素的索引
   * @param {Array} array - 输入数组
   * @param {Function} predicate - 判断函数
   * @returns {number} 索引或-1
   */
  findIndex(array, predicate) {
    if (!this.isArray(array) || typeof predicate !== 'function') {
      return -1;
    }
    
    return array.findIndex(predicate);
  }

  /**
   * 查找数组中满足条件的最后一个元素的索引
   * @param {Array} array - 输入数组
   * @param {Function} predicate - 判断函数
   * @returns {number} 索引或-1
   */
  findLastIndex(array, predicate) {
    if (!this.isArray(array) || typeof predicate !== 'function') {
      return -1;
    }
    
    // 使用原生findLastIndex方法（如果可用）
    if (Array.prototype.findLastIndex) {
      return array.findLastIndex(predicate);
    }
    
    // 手动实现
    for (let i = array.length - 1; i >= 0; i--) {
      if (predicate(array[i], i, array)) {
        return i;
      }
    }
    return -1;
  }

  /**
   * 检查数组是否包含指定元素
   * @param {Array} array - 输入数组
   * @param {*} element - 要检查的元素
   * @param {boolean} caseSensitive - 是否区分大小写（仅对字符串有效）
   * @returns {boolean} 是否包含
   */
  contains(array, element, caseSensitive = this.options.caseSensitive) {
    if (!this.isArray(array) || array.length === 0) {
      return false;
    }
    
    if (typeof element === 'string' && !caseSensitive) {
      const lowerElement = element.toLowerCase();
      return array.some(item => 
        typeof item === 'string' && item.toLowerCase() === lowerElement
      );
    }
    
    return array.includes(element);
  }

  /**
   * 检查数组是否包含所有指定元素
   * @param {Array} array - 输入数组
   * @param {Array} elements - 要检查的元素数组
   * @returns {boolean} 是否包含所有元素
   */
  containsAll(array, elements) {
    if (!this.isArray(array) || !this.isArray(elements) || elements.length === 0) {
      return false;
    }
    
    return elements.every(element => this.contains(array, element));
  }

  /**
   * 检查数组是否包含任何指定元素
   * @param {Array} array - 输入数组
   * @param {Array} elements - 要检查的元素数组
   * @returns {boolean} 是否包含任何元素
   */
  containsAny(array, elements) {
    if (!this.isArray(array) || !this.isArray(elements) || array.length === 0 || elements.length === 0) {
      return false;
    }
    
    return elements.some(element => this.contains(array, element));
  }

  /**
   * 获取两个数组的交集
   * @param {Array} array1 - 第一个数组
   * @param {Array} array2 - 第二个数组
   * @returns {Array} 交集数组
   */
  intersection(array1, array2) {
    if (!this.isArray(array1) || !this.isArray(array2)) {
      return [];
    }
    
    const set2 = new Set(array2);
    return array1.filter(item => set2.has(item));
  }

  /**
   * 获取两个数组的并集
   * @param {Array} array1 - 第一个数组
   * @param {Array} array2 - 第二个数组
   * @returns {Array} 并集数组
   */
  union(array1, array2) {
    if (!this.isArray(array1)) array1 = [];
    if (!this.isArray(array2)) array2 = [];
    
    return this.unique([...array1, ...array2]);
  }

  /**
   * 获取两个数组的差集（在array1中但不在array2中的元素）
   * @param {Array} array1 - 第一个数组
   * @param {Array} array2 - 第二个数组
   * @returns {Array} 差集数组
   */
  difference(array1, array2) {
    if (!this.isArray(array1)) return [];
    if (!this.isArray(array2)) return [...array1];
    
    const set2 = new Set(array2);
    return array1.filter(item => !set2.has(item));
  }

  /**
   * 从数组中随机打乱元素顺序
   * @param {Array} array - 输入数组
   * @returns {Array} 打乱后的新数组
   */
  shuffle(array) {
    if (!this.isArray(array)) {
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
   * 对数组进行排序
   * @param {Array} array - 输入数组
   * @param {Function} compareFn - 比较函数
   * @returns {Array} 排序后的新数组
   */
  sort(array, compareFn = this.options.defaultCompareFn) {
    if (!this.isArray(array)) {
      return [];
    }
    
    return [...array].sort(compareFn);
  }

  /**
   * 对数组进行降序排序
   * @param {Array} array - 输入数组
   * @param {Function} compareFn - 基础比较函数
   * @returns {Array} 降序排序后的新数组
   */
  sortDesc(array, compareFn = this.options.defaultCompareFn) {
    if (!this.isArray(array)) {
      return [];
    }
    
    const descCompareFn = (a, b) => compareFn(b, a);
    return [...array].sort(descCompareFn);
  }

  /**
   * 根据对象属性对数组进行排序
   * @param {Array} array - 输入数组
   * @param {string} property - 属性名
   * @param {boolean} descending - 是否降序
   * @returns {Array} 排序后的新数组
   */
  sortBy(array, property, descending = false) {
    if (!this.isArray(array)) {
      return [];
    }
    
    const compareFn = (a, b) => {
      const valA = a[property];
      const valB = b[property];
      
      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;
      
      if (typeof valA === 'string' && typeof valB === 'string' && !this.options.caseSensitive) {
        return valA.toLowerCase().localeCompare(valB.toLowerCase()) * (descending ? -1 : 1);
      }
      
      return (valA < valB ? -1 : 1) * (descending ? -1 : 1);
    };
    
    return [...array].sort(compareFn);
  }

  /**
   * 对数组中的元素进行分组
   * @param {Array} array - 输入数组
   * @param {Function|string} keyFn - 分组键函数或属性名
   * @returns {Object} 分组后的对象
   */
  groupBy(array, keyFn) {
    if (!this.isArray(array)) {
      return {};
    }
    
    const getKey = typeof keyFn === 'function' 
      ? keyFn 
      : (item) => item[keyFn];
    
    return array.reduce((groups, item) => {
      const key = getKey(item);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    }, {});
  }

  /**
   * 将数组映射到对象（键值对）
   * @param {Array} array - 输入数组
   * @param {Function} keyFn - 键生成函数
   * @param {Function} valueFn - 值生成函数
   * @returns {Object} 映射后的对象
   */
  toMap(array, keyFn, valueFn = item => item) {
    if (!this.isArray(array) || typeof keyFn !== 'function') {
      return {};
    }
    
    return array.reduce((map, item) => {
      const key = keyFn(item);
      const value = valueFn(item);
      map[key] = value;
      return map;
    }, {});
  }

  /**
   * 从数组中提取指定属性的值
   * @param {Array} array - 输入数组
   * @param {string} property - 属性名
   * @returns {Array} 提取的值数组
   */
  pluck(array, property) {
    if (!this.isArray(array)) {
      return [];
    }
    
    return array.map(item => item[property]);
  }

  /**
   * 计算数组中元素出现的频率
   * @param {Array} array - 输入数组
   * @returns {Object} 频率统计对象
   */
  frequency(array) {
    if (!this.isArray(array)) {
      return {};
    }
    
    return array.reduce((freq, item) => {
      freq[item] = (freq[item] || 0) + 1;
      return freq;
    }, {});
  }

  /**
   * 获取数组中最常见的元素
   * @param {Array} array - 输入数组
   * @returns {*} 最常见的元素
   */
  mostFrequent(array) {
    if (!this.isArray(array) || array.length === 0) {
      return undefined;
    }
    
    const freq = this.frequency(array);
    let maxFreq = 0;
    let mostFrequent;
    
    for (const [item, count] of Object.entries(freq)) {
      if (count > maxFreq) {
        maxFreq = count;
        mostFrequent = item;
      }
    }
    
    return mostFrequent;
  }

  /**
   * 填充数组到指定长度
   * @param {Array} array - 输入数组
   * @param {number} length - 目标长度
   * @param {*} value - 填充值
   * @returns {Array} 填充后的新数组
   */
  pad(array, length, value) {
    if (!this.isArray(array)) {
      array = [];
    }
    
    const result = [...array];
    while (result.length < length) {
      result.push(value);
    }
    return result;
  }

  /**
   * 安全地获取数组元素
   * @param {Array} array - 输入数组
   * @param {number} index - 索引
   * @param {*} defaultValue - 默认值
   * @returns {*} 元素或默认值
   */
  get(array, index, defaultValue = undefined) {
    if (!this.isArray(array) || index < 0 || index >= array.length) {
      return defaultValue;
    }
    return array[index];
  }

  /**
   * 反转数组
   * @param {Array} array - 输入数组
   * @returns {Array} 反转后的新数组
   */
  reverse(array) {
    if (!this.isArray(array)) {
      return [];
    }
    return [...array].reverse();
  }

  /**
   * 截取数组（安全版本）
   * @param {Array} array - 输入数组
   * @param {number} start - 起始索引
   * @param {number} end - 结束索引
   * @returns {Array} 截取后的新数组
   */
  slice(array, start = 0, end) {
    if (!this.isArray(array)) {
      return [];
    }
    return array.slice(start, end);
  }

  /**
   * 检查两个数组是否相等
   * @param {Array} array1 - 第一个数组
   * @param {Array} array2 - 第二个数组
   * @returns {boolean} 是否相等
   */
  equals(array1, array2) {
    if (!this.isArray(array1) || !this.isArray(array2)) {
      return false;
    }
    
    if (array1.length !== array2.length) {
      return false;
    }
    
    for (let i = 0; i < array1.length; i++) {
      if (array1[i] !== array2[i]) {
        // 对于对象，尝试深度比较
        if (typeof array1[i] === 'object' && array1[i] !== null && 
            typeof array2[i] === 'object' && array2[i] !== null) {
          try {
            if (JSON.stringify(array1[i]) !== JSON.stringify(array2[i])) {
              return false;
            }
          } catch (e) {
            return false;
          }
        } else {
          return false;
        }
      }
    }
    
    return true;
  }

  /**
   * 对数组元素执行批量操作
   * @param {Array} array - 输入数组
   * @param {number} batchSize - 批次大小
   * @param {Function} batchFn - 批次处理函数
   * @returns {Promise<Array>} 处理结果数组
   */
  async batchProcess(array, batchSize, batchFn) {
    if (!this.isArray(array) || typeof batchFn !== 'function') {
      return [];
    }
    
    const batches = this.chunk(array, batchSize);
    const results = [];
    
    for (const batch of batches) {
      const batchResult = await batchFn(batch);
      if (Array.isArray(batchResult)) {
        results.push(...batchResult);
      } else {
        results.push(batchResult);
      }
    }
    
    return results;
  }
}

// 单例模式
let instance = null;

function getInstance(options = {}) {
  if (!instance) {
    instance = new ArrayUtils(options);
  }
  return instance;
}

module.exports = {
  ArrayUtils,
  getInstance
};