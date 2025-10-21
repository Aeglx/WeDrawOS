/**
 * 集合工具类
 * 提供集合操作、转换、查找、聚合等高级功能
 */

const ArrayUtils = require('../array').getInstance();
const logger = require('../logger');

/**
 * 集合工具
 */
class CollectionUtils {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   */
  constructor(options = {}) {
    this.options = {
      defaultCompareFn: (a, b) => a - b,
      caseSensitive: false,
      maxCollectionSize: 100000,
      ...options
    };
    
    logger.debug('创建集合工具实例', { options });
  }

  /**
   * 创建集合
   * @param {Array|Set|Map|Object} source - 源数据
   * @returns {Set} 集合实例
   */
  createSet(source) {
    if (source instanceof Set) {
      return new Set(source);
    }
    
    if (Array.isArray(source)) {
      return new Set(source);
    }
    
    if (source instanceof Map) {
      return new Set(source.keys());
    }
    
    if (typeof source === 'object' && source !== null) {
      return new Set(Object.keys(source));
    }
    
    return new Set();
  }

  /**
   * 创建映射
   * @param {Array|Object|Map} source - 源数据
   * @param {Function} keyFn - 键生成函数（仅数组源需要）
   * @param {Function} valueFn - 值生成函数（仅数组源需要）
   * @returns {Map} 映射实例
   */
  createMap(source, keyFn, valueFn = item => item) {
    if (source instanceof Map) {
      return new Map(source);
    }
    
    const map = new Map();
    
    if (Array.isArray(source)) {
      if (typeof keyFn !== 'function') {
        throw new Error('从数组创建映射需要提供keyFn');
      }
      
      source.forEach(item => {
        const key = keyFn(item);
        const value = valueFn(item);
        map.set(key, value);
      });
    } else if (typeof source === 'object' && source !== null) {
      Object.entries(source).forEach(([key, value]) => {
        map.set(key, value);
      });
    }
    
    return map;
  }

  /**
   * 检查集合是否是另一个集合的子集
   * @param {Set} subset - 可能的子集
   * @param {Set} superset - 可能的超集
   * @returns {boolean} 是否为子集
   */
  isSubset(subset, superset) {
    if (!(subset instanceof Set) || !(superset instanceof Set)) {
      return false;
    }
    
    if (subset.size > superset.size) {
      return false;
    }
    
    for (const item of subset) {
      if (!superset.has(item)) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * 检查集合是否是另一个集合的真子集
   * @param {Set} subset - 可能的子集
   * @param {Set} superset - 可能的超集
   * @returns {boolean} 是否为真子集
   */
  isProperSubset(subset, superset) {
    return subset.size < superset.size && this.isSubset(subset, superset);
  }

  /**
   * 计算两个集合的并集
   * @param {Set} set1 - 第一个集合
   * @param {Set} set2 - 第二个集合
   * @returns {Set} 并集
   */
  union(set1, set2) {
    if (!(set1 instanceof Set) || !(set2 instanceof Set)) {
      return new Set();
    }
    
    const result = new Set(set1);
    for (const item of set2) {
      result.add(item);
    }
    
    return result;
  }

  /**
   * 计算多个集合的并集
   * @param {Set[]} sets - 集合数组
   * @returns {Set} 并集
   */
  unionAll(sets) {
    if (!ArrayUtils.isArray(sets) || sets.length === 0) {
      return new Set();
    }
    
    return sets.reduce((result, set) => {
      return this.union(result, set);
    }, new Set());
  }

  /**
   * 计算两个集合的交集
   * @param {Set} set1 - 第一个集合
   * @param {Set} set2 - 第二个集合
   * @returns {Set} 交集
   */
  intersection(set1, set2) {
    if (!(set1 instanceof Set) || !(set2 instanceof Set)) {
      return new Set();
    }
    
    // 优化：遍历较小的集合
    const [smaller, larger] = set1.size <= set2.size ? [set1, set2] : [set2, set1];
    const result = new Set();
    
    for (const item of smaller) {
      if (larger.has(item)) {
        result.add(item);
      }
    }
    
    return result;
  }

  /**
   * 计算多个集合的交集
   * @param {Set[]} sets - 集合数组
   * @returns {Set} 交集
   */
  intersectionAll(sets) {
    if (!ArrayUtils.isArray(sets) || sets.length === 0) {
      return new Set();
    }
    
    return sets.reduce((result, set) => {
      return this.intersection(result, set);
    });
  }

  /**
   * 计算两个集合的差集
   * @param {Set} set1 - 第一个集合
   * @param {Set} set2 - 第二个集合
   * @returns {Set} 差集 (set1 - set2)
   */
  difference(set1, set2) {
    if (!(set1 instanceof Set) || !(set2 instanceof Set)) {
      return new Set(set1);
    }
    
    const result = new Set();
    for (const item of set1) {
      if (!set2.has(item)) {
        result.add(item);
      }
    }
    
    return result;
  }

  /**
   * 计算两个集合的对称差集
   * @param {Set} set1 - 第一个集合
   * @param {Set} set2 - 第二个集合
   * @returns {Set} 对称差集
   */
  symmetricDifference(set1, set2) {
    if (!(set1 instanceof Set) || !(set2 instanceof Set)) {
      return new Set();
    }
    
    const unionSet = this.union(set1, set2);
    const intersectionSet = this.intersection(set1, set2);
    
    return this.difference(unionSet, intersectionSet);
  }

  /**
   * 过滤集合元素
   * @param {Set|Map|Array} collection - 输入集合
   * @param {Function} predicate - 过滤函数
   * @returns {Set|Map|Array} 过滤后的集合
   */
  filter(collection, predicate) {
    if (typeof predicate !== 'function') {
      return collection;
    }
    
    if (collection instanceof Set) {
      const result = new Set();
      for (const item of collection) {
        if (predicate(item)) {
          result.add(item);
        }
      }
      return result;
    }
    
    if (collection instanceof Map) {
      const result = new Map();
      for (const [key, value] of collection) {
        if (predicate(value, key)) {
          result.set(key, value);
        }
      }
      return result;
    }
    
    if (Array.isArray(collection)) {
      return collection.filter(predicate);
    }
    
    return collection;
  }

  /**
   * 映射集合元素
   * @param {Set|Map|Array} collection - 输入集合
   * @param {Function} mapFn - 映射函数
   * @returns {Array} 映射后的数组
   */
  map(collection, mapFn) {
    if (typeof mapFn !== 'function') {
      return [];
    }
    
    const result = [];
    
    if (collection instanceof Set) {
      for (const item of collection) {
        result.push(mapFn(item));
      }
    } else if (collection instanceof Map) {
      for (const [key, value] of collection) {
        result.push(mapFn(value, key));
      }
    } else if (Array.isArray(collection)) {
      return collection.map(mapFn);
    }
    
    return result;
  }

  /**
   * 归约集合元素
   * @param {Set|Map|Array} collection - 输入集合
   * @param {Function} reduceFn - 归约函数
   * @param {*} initialValue - 初始值
   * @returns {*} 归约结果
   */
  reduce(collection, reduceFn, initialValue) {
    if (typeof reduceFn !== 'function') {
      return initialValue;
    }
    
    let result = initialValue;
    let hasInitialValue = arguments.length > 2;
    let index = 0;
    
    if (collection instanceof Set) {
      for (const item of collection) {
        if (!hasInitialValue) {
          result = item;
          hasInitialValue = true;
        } else {
          result = reduceFn(result, item, index);
        }
        index++;
      }
    } else if (collection instanceof Map) {
      for (const [key, value] of collection) {
        if (!hasInitialValue) {
          result = value;
          hasInitialValue = true;
        } else {
          result = reduceFn(result, value, key, index);
        }
        index++;
      }
    } else if (Array.isArray(collection)) {
      return collection.reduce(reduceFn, initialValue);
    }
    
    if (!hasInitialValue) {
      throw new Error('归约空集合需要提供初始值');
    }
    
    return result;
  }

  /**
   * 检查集合中是否所有元素都满足条件
   * @param {Set|Map|Array} collection - 输入集合
   * @param {Function} predicate - 判断函数
   * @returns {boolean} 是否都满足条件
   */
  every(collection, predicate) {
    if (typeof predicate !== 'function') {
      return false;
    }
    
    if (collection instanceof Set) {
      for (const item of collection) {
        if (!predicate(item)) {
          return false;
        }
      }
      return true;
    }
    
    if (collection instanceof Map) {
      for (const [key, value] of collection) {
        if (!predicate(value, key)) {
          return false;
        }
      }
      return true;
    }
    
    if (Array.isArray(collection)) {
      return collection.every(predicate);
    }
    
    return false;
  }

  /**
   * 检查集合中是否有元素满足条件
   * @param {Set|Map|Array} collection - 输入集合
   * @param {Function} predicate - 判断函数
   * @returns {boolean} 是否有元素满足条件
   */
  some(collection, predicate) {
    if (typeof predicate !== 'function') {
      return false;
    }
    
    if (collection instanceof Set) {
      for (const item of collection) {
        if (predicate(item)) {
          return true;
        }
      }
      return false;
    }
    
    if (collection instanceof Map) {
      for (const [key, value] of collection) {
        if (predicate(value, key)) {
          return true;
        }
      }
      return false;
    }
    
    if (Array.isArray(collection)) {
      return collection.some(predicate);
    }
    
    return false;
  }

  /**
   * 查找集合中满足条件的第一个元素
   * @param {Set|Map|Array} collection - 输入集合
   * @param {Function} predicate - 判断函数
   * @returns {*} 找到的元素或undefined
   */
  find(collection, predicate) {
    if (typeof predicate !== 'function') {
      return undefined;
    }
    
    if (collection instanceof Set) {
      for (const item of collection) {
        if (predicate(item)) {
          return item;
        }
      }
    } else if (collection instanceof Map) {
      for (const [key, value] of collection) {
        if (predicate(value, key)) {
          return value;
        }
      }
    } else if (Array.isArray(collection)) {
      return collection.find(predicate);
    }
    
    return undefined;
  }

  /**
   * 将集合转换为数组
   * @param {Set|Map|Array} collection - 输入集合
   * @param {boolean} includeKeys - 对于Map，是否包含键（返回[key, value]对）
   * @returns {Array} 转换后的数组
   */
  toArray(collection, includeKeys = false) {
    if (Array.isArray(collection)) {
      return [...collection];
    }
    
    if (collection instanceof Set) {
      return [...collection];
    }
    
    if (collection instanceof Map) {
      return includeKeys ? [...collection.entries()] : [...collection.values()];
    }
    
    if (typeof collection === 'object' && collection !== null) {
      return Object.values(collection);
    }
    
    return [];
  }

  /**
   * 对集合元素进行分组
   * @param {Set|Map|Array} collection - 输入集合
   * @param {Function|string} keyFn - 分组键函数或属性名
   * @returns {Object} 分组后的对象
   */
  groupBy(collection, keyFn) {
    const array = this.toArray(collection);
    return ArrayUtils.groupBy(array, keyFn);
  }

  /**
   * 对集合进行分页
   * @param {Set|Map|Array} collection - 输入集合
   * @param {number} page - 页码（从1开始）
   * @param {number} pageSize - 每页大小
   * @returns {Object} 分页结果 { items, total, page, pageSize, totalPages }
   */
  paginate(collection, page = 1, pageSize = 10) {
    const array = this.toArray(collection);
    const total = array.length;
    const validPage = Math.max(1, Math.floor(page));
    const validPageSize = Math.max(1, Math.min(Math.floor(pageSize), this.options.maxCollectionSize));
    const start = (validPage - 1) * validPageSize;
    const end = start + validPageSize;
    const items = array.slice(start, end);
    const totalPages = Math.ceil(total / validPageSize);
    
    return {
      items,
      total,
      page: validPage,
      pageSize: validPageSize,
      totalPages
    };
  }

  /**
   * 对集合元素进行排序
   * @param {Set|Map|Array} collection - 输入集合
   * @param {Function} compareFn - 比较函数
   * @returns {Array} 排序后的数组
   */
  sort(collection, compareFn = this.options.defaultCompareFn) {
    const array = this.toArray(collection);
    return ArrayUtils.sort(array, compareFn);
  }

  /**
   * 对集合元素进行去重
   * @param {Set|Map|Array} collection - 输入集合
   * @param {Function} keyFn - 用于提取键的函数
   * @returns {Array} 去重后的数组
   */
  unique(collection, keyFn) {
    const array = this.toArray(collection);
    return ArrayUtils.unique(array, keyFn);
  }

  /**
   * 获取集合的大小
   * @param {Set|Map|Array|Object} collection - 输入集合
   * @returns {number} 集合大小
   */
  size(collection) {
    if (collection instanceof Set || collection instanceof Map) {
      return collection.size;
    }
    
    if (Array.isArray(collection)) {
      return collection.length;
    }
    
    if (typeof collection === 'object' && collection !== null) {
      return Object.keys(collection).length;
    }
    
    return 0;
  }

  /**
   * 检查集合是否为空
   * @param {Set|Map|Array|Object} collection - 输入集合
   * @returns {boolean} 是否为空
   */
  isEmpty(collection) {
    return this.size(collection) === 0;
  }

  /**
   * 创建一个空集合（同类型）
   * @param {Set|Map|Array|Object} collection - 输入集合
   * @returns {Set|Map|Array|Object} 空集合
   */
  createEmpty(collection) {
    if (collection instanceof Set) {
      return new Set();
    }
    
    if (collection instanceof Map) {
      return new Map();
    }
    
    if (Array.isArray(collection)) {
      return [];
    }
    
    if (typeof collection === 'object' && collection !== null) {
      return {};
    }
    
    return null;
  }

  /**
   * 合并多个集合
   * @param {...(Set|Map|Array|Object)} collections - 要合并的集合
   * @returns {Set|Map|Array|Object} 合并后的集合
   */
  merge(...collections) {
    if (collections.length === 0) {
      return null;
    }
    
    const first = collections[0];
    
    if (first instanceof Set) {
      const result = new Set(first);
      collections.slice(1).forEach(collection => {
        if (collection instanceof Set) {
          for (const item of collection) {
            result.add(item);
          }
        }
      });
      return result;
    }
    
    if (first instanceof Map) {
      const result = new Map(first);
      collections.slice(1).forEach(collection => {
        if (collection instanceof Map) {
          for (const [key, value] of collection) {
            result.set(key, value);
          }
        }
      });
      return result;
    }
    
    if (Array.isArray(first)) {
      return collections.flat();
    }
    
    if (typeof first === 'object' && first !== null) {
      return Object.assign({}, ...collections);
    }
    
    return first;
  }

  /**
   * 计算集合中元素的频率
   * @param {Set|Map|Array|Object} collection - 输入集合
   * @returns {Object} 频率统计对象
   */
  frequency(collection) {
    const array = this.toArray(collection);
    return ArrayUtils.frequency(array);
  }

  /**
   * 对集合元素执行批量异步操作
   * @param {Set|Map|Array} collection - 输入集合
   * @param {number} batchSize - 批次大小
   * @param {Function} batchFn - 批次处理函数
   * @returns {Promise<Array>} 处理结果数组
   */
  async batchProcess(collection, batchSize, batchFn) {
    const array = this.toArray(collection);
    return ArrayUtils.batchProcess(array, batchSize, batchFn);
  }

  /**
   * 限制集合的大小
   * @param {Set|Map|Array} collection - 输入集合
   * @param {number} maxSize - 最大大小
   * @returns {Set|Map|Array} 限制后的集合
   */
  limitSize(collection, maxSize) {
    const validMaxSize = Math.max(1, Math.floor(maxSize));
    
    if (collection instanceof Set) {
      const result = new Set();
      let count = 0;
      for (const item of collection) {
        if (count >= validMaxSize) {
          break;
        }
        result.add(item);
        count++;
      }
      return result;
    }
    
    if (collection instanceof Map) {
      const result = new Map();
      let count = 0;
      for (const [key, value] of collection) {
        if (count >= validMaxSize) {
          break;
        }
        result.set(key, value);
        count++;
      }
      return result;
    }
    
    if (Array.isArray(collection)) {
      return collection.slice(0, validMaxSize);
    }
    
    return collection;
  }
}

// 单例模式
let instance = null;

function getInstance(options = {}) {
  if (!instance) {
    instance = new CollectionUtils(options);
  }
  return instance;
}

module.exports = {
  CollectionUtils,
  getInstance
};