/**
 * 数组工具类
 * 提供数组处理和操作功能
 */

class ArrayUtils {
  /**
   * 检查值是否为数组
   * @param {any} value - 要检查的值
   * @returns {boolean} 是否为数组
   */
  static isArray(value) {
    return Array.isArray(value);
  }

  /**
   * 检查数组是否为空
   * @param {Array} arr - 要检查的数组
   * @returns {boolean} 是否为空
   */
  static isEmpty(arr) {
    return !this.isArray(arr) || arr.length === 0;
  }

  /**
   * 检查数组是否不为空
   * @param {Array} arr - 要检查的数组
   * @returns {boolean} 是否不为空
   */
  static isNotEmpty(arr) {
    return this.isArray(arr) && arr.length > 0;
  }

  /**
   * 安全地获取数组长度
   * @param {Array} arr - 数组
   * @returns {number} 数组长度
   */
  static length(arr) {
    return this.isArray(arr) ? arr.length : 0;
  }

  /**
   * 将类数组对象转换为数组
   * @param {*} arrayLike - 类数组对象
   * @returns {Array} 数组
   */
  static toArray(arrayLike) {
    if (!arrayLike) return [];
    if (this.isArray(arrayLike)) return [...arrayLike];
    
    try {
      return Array.from(arrayLike);
    } catch (e) {
      // 回退方案
      return [].slice.call(arrayLike);
    }
  }

  /**
   * 移除数组中的重复项
   * @param {Array} arr - 原始数组
   * @param {Function} keyFn - 可选的键提取函数，用于比较对象
   * @returns {Array} 去重后的数组
   */
  static unique(arr, keyFn = null) {
    if (!this.isArray(arr)) return [];
    
    if (keyFn) {
      const seen = new Set();
      return arr.filter(item => {
        const key = keyFn(item);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }
    
    // 基本类型去重
    if (arr.length <= 1) return [...arr];
    
    // 处理不同类型的值
    const primitives = new Set();
    const objects = [];
    const objectKeys = new Set();
    
    for (const item of arr) {
      if (item === null || item === undefined) {
        if (!primitives.has(item)) {
          primitives.add(item);
          objects.push(item);
        }
      } else if (typeof item !== 'object') {
        if (!primitives.has(item)) {
          primitives.add(item);
          objects.push(item);
        }
      } else {
        try {
          const key = JSON.stringify(item);
          if (!objectKeys.has(key)) {
            objectKeys.add(key);
            objects.push(item);
          }
        } catch (e) {
          // 无法序列化的对象，直接添加
          objects.push(item);
        }
      }
    }
    
    return objects;
  }

  /**
   * 查找数组中的第一个元素
   * @param {Array} arr - 数组
   * @param {Function} predicate - 断言函数
   * @param {*} defaultValue - 默认值
   * @returns {*} 找到的元素或默认值
   */
  static find(arr, predicate, defaultValue = undefined) {
    if (!this.isArray(arr)) return defaultValue;
    
    const found = arr.find(predicate);
    return found === undefined ? defaultValue : found;
  }

  /**
   * 查找数组中元素的索引
   * @param {Array} arr - 数组
   * @param {Function} predicate - 断言函数
   * @returns {number} 索引，未找到返回-1
   */
  static findIndex(arr, predicate) {
    if (!this.isArray(arr)) return -1;
    return arr.findIndex(predicate);
  }

  /**
   * 分组数组元素
   * @param {Array} arr - 数组
   * @param {Function|string} keyFn - 键生成函数或属性名
   * @returns {Object} 分组后的对象
   */
  static groupBy(arr, keyFn) {
    if (!this.isArray(arr)) return {};
    
    const keyExtractor = typeof keyFn === 'string' 
      ? item => item?.[keyFn] 
      : keyFn;
    
    return arr.reduce((groups, item) => {
      const key = keyExtractor(item);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    }, {});
  }

  /**
   * 按指定键排序数组
   * @param {Array} arr - 数组
   * @param {string} key - 排序键
   * @param {boolean} ascending - 是否升序
   * @returns {Array} 排序后的数组
   */
  static sortBy(arr, key, ascending = true) {
    if (!this.isArray(arr)) return [];
    
    return [...arr].sort((a, b) => {
      const valueA = a?.[key];
      const valueB = b?.[key];
      
      if (valueA === valueB) return 0;
      if (valueA === null || valueA === undefined) return 1;
      if (valueB === null || valueB === undefined) return -1;
      
      const result = typeof valueA === 'string' 
        ? valueA.localeCompare(valueB)
        : (valueA > valueB ? 1 : -1);
      
      return ascending ? result : -result;
    });
  }

  /**
   * 过滤数组中的无效值（null, undefined, '', NaN）
   * @param {Array} arr - 数组
   * @returns {Array} 过滤后的数组
   */
  static compact(arr) {
    if (!this.isArray(arr)) return [];
    
    return arr.filter(item => {
      if (item === null || item === undefined || item === '') {
        return false;
      }
      if (typeof item === 'number' && isNaN(item)) {
        return false;
      }
      return true;
    });
  }

  /**
   * 扁平化数组
   * @param {Array} arr - 嵌套数组
   * @param {number} depth - 扁平化深度，默认为1
   * @returns {Array} 扁平化后的数组
   */
  static flatten(arr, depth = 1) {
    if (!this.isArray(arr)) return [];
    
    if (depth <= 0) return [...arr];
    
    return arr.reduce((result, item) => {
      if (this.isArray(item) && depth > 0) {
        result.push(...this.flatten(item, depth - 1));
      } else {
        result.push(item);
      }
      return result;
    }, []);
  }

  /**
   * 完全扁平化数组
   * @param {Array} arr - 嵌套数组
   * @returns {Array} 完全扁平化后的数组
   */
  static flattenDeep(arr) {
    if (!this.isArray(arr)) return [];
    
    return arr.reduce((result, item) => {
      if (this.isArray(item)) {
        result.push(...this.flattenDeep(item));
      } else {
        result.push(item);
      }
      return result;
    }, []);
  }

  /**
   * 从数组中随机选择一个元素
   * @param {Array} arr - 数组
   * @returns {*} 随机元素
   */
  static randomElement(arr) {
    if (!this.isArray(arr) || arr.length === 0) return undefined;
    
    const index = Math.floor(Math.random() * arr.length);
    return arr[index];
  }

  /**
   * 随机打乱数组元素顺序
   * @param {Array} arr - 数组
   * @returns {Array} 打乱后的数组
   */
  static shuffle(arr) {
    if (!this.isArray(arr)) return [];
    
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    
    return result;
  }

  /**
   * 从数组中移除指定元素
   * @param {Array} arr - 数组
   * @param {*} value - 要移除的值
   * @param {boolean} all - 是否移除所有匹配项
   * @returns {Array} 处理后的数组
   */
  static remove(arr, value, all = false) {
    if (!this.isArray(arr)) return [];
    
    if (!all) {
      const index = arr.indexOf(value);
      if (index > -1) {
        const result = [...arr];
        result.splice(index, 1);
        return result;
      }
      return [...arr];
    }
    
    return arr.filter(item => item !== value);
  }

  /**
   * 根据条件移除数组元素
   * @param {Array} arr - 数组
   * @param {Function} predicate - 断言函数
   * @returns {Array} 处理后的数组
   */
  static removeIf(arr, predicate) {
    if (!this.isArray(arr)) return [];
    return arr.filter(item => !predicate(item));
  }

  /**
   * 检查数组中是否包含指定元素
   * @param {Array} arr - 数组
   * @param {*} value - 要检查的值
   * @param {Function} comparator - 比较函数
   * @returns {boolean} 是否包含
   */
  static includes(arr, value, comparator = null) {
    if (!this.isArray(arr)) return false;
    
    if (comparator) {
      return arr.some(item => comparator(item, value));
    }
    
    return arr.includes(value);
  }

  /**
   * 获取两个数组的交集
   * @param {Array} arr1 - 第一个数组
   * @param {Array} arr2 - 第二个数组
   * @param {Function} keyFn - 键提取函数
   * @returns {Array} 交集数组
   */
  static intersection(arr1, arr2, keyFn = null) {
    if (!this.isArray(arr1) || !this.isArray(arr2)) return [];
    
    if (keyFn) {
      const set = new Set(arr2.map(keyFn));
      return arr1.filter(item => set.has(keyFn(item)));
    }
    
    const set = new Set(arr2);
    return arr1.filter(item => set.has(item));
  }

  /**
   * 获取两个数组的并集
   * @param {Array} arr1 - 第一个数组
   * @param {Array} arr2 - 第二个数组
   * @param {Function} keyFn - 键提取函数
   * @returns {Array} 并集数组
   */
  static union(arr1, arr2, keyFn = null) {
    if (!this.isArray(arr1) && !this.isArray(arr2)) return [];
    if (!this.isArray(arr1)) return this.unique(arr2, keyFn);
    if (!this.isArray(arr2)) return this.unique(arr1, keyFn);
    
    return this.unique([...arr1, ...arr2], keyFn);
  }

  /**
   * 获取两个数组的差集（arr1 - arr2）
   * @param {Array} arr1 - 第一个数组
   * @param {Array} arr2 - 第二个数组
   * @param {Function} keyFn - 键提取函数
   * @returns {Array} 差集数组
   */
  static difference(arr1, arr2, keyFn = null) {
    if (!this.isArray(arr1)) return [];
    if (!this.isArray(arr2)) return [...arr1];
    
    if (keyFn) {
      const set = new Set(arr2.map(keyFn));
      return arr1.filter(item => !set.has(keyFn(item)));
    }
    
    const set = new Set(arr2);
    return arr1.filter(item => !set.has(item));
  }

  /**
   * 安全地获取数组中的元素
   * @param {Array} arr - 数组
   * @param {number} index - 索引
   * @param {*} defaultValue - 默认值
   * @returns {*} 数组元素或默认值
   */
  static get(arr, index, defaultValue = undefined) {
    if (!this.isArray(arr) || index < 0 || index >= arr.length) {
      return defaultValue;
    }
    return arr[index];
  }

  /**
   * 将数组分割成多个指定大小的子数组
   * @param {Array} arr - 数组
   * @param {number} size - 每个子数组的大小
   * @returns {Array} 子数组组成的数组
   */
  static chunk(arr, size) {
    if (!this.isArray(arr) || size <= 0) return [];
    
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    
    return chunks;
  }

  /**
   * 计算数组中元素的出现次数
   * @param {Array} arr - 数组
   * @param {Function} keyFn - 键提取函数
   * @returns {Object} 元素出现次数统计
   */
  static countBy(arr, keyFn = null) {
    if (!this.isArray(arr)) return {};
    
    return arr.reduce((counts, item) => {
      const key = keyFn ? keyFn(item) : item;
      counts[key] = (counts[key] || 0) + 1;
      return counts;
    }, {});
  }

  /**
   * 深拷贝数组
   * @param {Array} arr - 数组
   * @returns {Array} 深拷贝后的数组
   */
  static deepClone(arr) {
    if (!this.isArray(arr)) return arr;
    
    try {
      return JSON.parse(JSON.stringify(arr));
    } catch (e) {
      // 处理无法序列化的对象
      return arr.map(item => {
        if (this.isArray(item)) {
          return this.deepClone(item);
        } else if (item && typeof item === 'object') {
          const cloned = {};
          for (const key in item) {
            if (Object.prototype.hasOwnProperty.call(item, key)) {
              cloned[key] = this.deepClone(item[key]);
            }
          }
          return cloned;
        }
        return item;
      });
    }
  }

  /**
   * 检查两个数组是否相等
   * @param {Array} arr1 - 第一个数组
   * @param {Array} arr2 - 第二个数组
   * @param {Function} comparator - 比较函数
   * @returns {boolean} 是否相等
   */
  static equals(arr1, arr2, comparator = null) {
    if (!this.isArray(arr1) || !this.isArray(arr2)) {
      return arr1 === arr2;
    }
    
    if (arr1.length !== arr2.length) return false;
    
    if (comparator) {
      return arr1.every((item, index) => comparator(item, arr2[index]));
    }
    
    try {
      return JSON.stringify(arr1) === JSON.stringify(arr2);
    } catch (e) {
      // 简单比较
      for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) return false;
      }
      return true;
    }
  }

  /**
   * 对数组元素执行映射操作，并过滤掉undefined和null结果
   * @param {Array} arr - 数组
   * @param {Function} mapFn - 映射函数
   * @returns {Array} 处理后的数组
   */
  static mapFilter(arr, mapFn) {
    if (!this.isArray(arr)) return [];
    
    const result = [];
    for (let i = 0; i < arr.length; i++) {
      const value = mapFn(arr[i], i, arr);
      if (value !== undefined && value !== null) {
        result.push(value);
      }
    }
    
    return result;
  }
}

module.exports = ArrayUtils;