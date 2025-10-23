/**
 * 对象工具类模块
 * 提供各种对象操作、处理和转换功能
 */

/**
 * 检查对象是否为空
 * @param {Object} obj - 要检查的对象
 * @returns {boolean} 是否为空对象
 */
const isEmpty = (obj) => {
  if (obj === null || obj === undefined) {
    return true;
  }
  
  // 检查是否是对象类型
  if (typeof obj !== 'object' || obj instanceof Date || Array.isArray(obj)) {
    return false;
  }
  
  // 检查是否有属性
  return Object.keys(obj).length === 0;
};

/**
 * 检查对象是否非空
 * @param {Object} obj - 要检查的对象
 * @returns {boolean} 是否非空
 */
const isNotEmpty = (obj) => {
  return !isEmpty(obj);
};

/**
 * 深拷贝对象
 * @param {Object} obj - 要拷贝的对象
 * @returns {Object} 深拷贝后的新对象
 */
const deepClone = (obj) => {
  // 处理null和undefined
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  // 处理基本类型和日期
  if (typeof obj !== 'object' || obj instanceof Date) {
    return obj;
  }
  
  // 处理正则表达式
  if (obj instanceof RegExp) {
    return new RegExp(obj.source, obj.flags);
  }
  
  // 处理数组
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item));
  }
  
  // 处理Map
  if (obj instanceof Map) {
    const map = new Map();
    obj.forEach((value, key) => {
      map.set(key, deepClone(value));
    });
    return map;
  }
  
  // 处理Set
  if (obj instanceof Set) {
    const set = new Set();
    obj.forEach(value => {
      set.add(deepClone(value));
    });
    return set;
  }
  
  // 处理普通对象
  try {
    // 尝试使用structuredClone（现代浏览器支持）
    if (typeof structuredClone === 'function') {
      return structuredClone(obj);
    }
  } catch (error) {
    // structuredClone失败时使用递归方法
  }
  
  // 递归拷贝普通对象
  const cloned = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  
  return cloned;
};

/**
 * 浅拷贝对象
 * @param {Object} obj - 要拷贝的对象
 * @returns {Object} 浅拷贝后的新对象
 */
const shallowClone = (obj) => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return [...obj];
  }
  
  return { ...obj };
};

/**
 * 合并多个对象
 * @param {...Object} objects - 要合并的对象
 * @returns {Object} 合并后的新对象
 */
const merge = (...objects) => {
  // 过滤掉非对象参数
  const validObjects = objects.filter(obj => 
    obj !== null && typeof obj === 'object' && !Array.isArray(obj)
  );
  
  if (validObjects.length === 0) {
    return {};
  }
  
  if (validObjects.length === 1) {
    return shallowClone(validObjects[0]);
  }
  
  // 使用Object.assign进行浅合并
  return Object.assign({}, ...validObjects);
};

/**
 * 深度合并多个对象
 * @param {...Object} objects - 要合并的对象
 * @returns {Object} 深度合并后的新对象
 */
const deepMerge = (...objects) => {
  // 过滤掉非对象参数
  const validObjects = objects.filter(obj => 
    obj !== null && typeof obj === 'object' && !Array.isArray(obj)
  );
  
  if (validObjects.length === 0) {
    return {};
  }
  
  if (validObjects.length === 1) {
    return deepClone(validObjects[0]);
  }
  
  const result = {};
  
  validObjects.forEach(obj => {
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        
        // 如果result中已存在该键，并且两者都是对象，则递归合并
        if (result[key] && typeof result[key] === 'object' && !Array.isArray(result[key]) &&
            value && typeof value === 'object' && !Array.isArray(value)) {
          result[key] = deepMerge(result[key], value);
        } else {
          // 否则直接覆盖
          result[key] = deepClone(value);
        }
      }
    }
  });
  
  return result;
};

/**
 * 从对象中获取指定路径的值
 * @param {Object} obj - 源对象
 * @param {string|Array} path - 属性路径，支持点号分隔或数组形式
 * @param {*} defaultValue - 默认值，如果路径不存在则返回
 * @returns {*} 找到的值或默认值
 */
const get = (obj, path, defaultValue = undefined) => {
  if (!obj || typeof obj !== 'object') {
    return defaultValue;
  }
  
  // 标准化路径为数组
  const keys = Array.isArray(path) ? path : path.split('.').filter(Boolean);
  
  let current = obj;
  for (const key of keys) {
    if (current === null || current === undefined || !Object.prototype.hasOwnProperty.call(current, key)) {
      return defaultValue;
    }
    current = current[key];
  }
  
  return current === undefined ? defaultValue : current;
};

/**
 * 设置对象中指定路径的值
 * @param {Object} obj - 源对象
 * @param {string|Array} path - 属性路径，支持点号分隔或数组形式
 * @param {*} value - 要设置的值
 * @returns {Object} 更新后的对象
 */
const set = (obj, path, value) => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  const keys = Array.isArray(path) ? path : path.split('.').filter(Boolean);
  
  // 创建对象的浅拷贝以避免直接修改原对象
  const result = shallowClone(obj);
  let current = result;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    
    // 如果路径不存在或不是对象，创建新对象
    if (!current[key] || typeof current[key] !== 'object') {
      // 检查下一个键是否是数字，以决定创建数组还是对象
      const nextKey = keys[i + 1];
      current[key] = !isNaN(parseInt(nextKey)) && nextKey == parseInt(nextKey) ? [] : {};
    } else if (Array.isArray(current[key])) {
      // 如果是数组，确保索引有效
      const nextKey = keys[i + 1];
      const index = parseInt(nextKey);
      if (nextKey == index && index >= current[key].length) {
        // 扩展数组以包含该索引
        current[key].length = index + 1;
      }
    }
    
    current = current[key];
  }
  
  // 设置最终值
  const lastKey = keys[keys.length - 1];
  current[lastKey] = value;
  
  return result;
};

/**
 * 删除对象中指定路径的属性
 * @param {Object} obj - 源对象
 * @param {string|Array} path - 属性路径，支持点号分隔或数组形式
 * @returns {Object} 更新后的对象
 */
const remove = (obj, path) => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  const keys = Array.isArray(path) ? path : path.split('.').filter(Boolean);
  
  // 创建对象的浅拷贝
  const result = shallowClone(obj);
  let current = result;
  let parent = null;
  let lastKey = null;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    
    if (!current[key] || typeof current[key] !== 'object') {
      // 路径不存在，直接返回
      return result;
    }
    
    parent = current;
    lastKey = key;
    current = current[key];
  }
  
  // 删除最后一个属性
  const finalKey = keys[keys.length - 1];
  if (Array.isArray(current)) {
    // 如果是数组，使用splice
    const index = parseInt(finalKey);
    if (finalKey == index && index >= 0 && index < current.length) {
      current.splice(index, 1);
    }
  } else if (current && Object.prototype.hasOwnProperty.call(current, finalKey)) {
    // 如果是对象，使用delete
    delete current[finalKey];
    
    // 如果删除后对象为空，且不是顶层对象，可以考虑删除整个父对象属性
    if (parent && lastKey && isEmpty(current)) {
      delete parent[lastKey];
    }
  }
  
  return result;
};

/**
 * 检查对象是否包含指定路径的属性
 * @param {Object} obj - 源对象
 * @param {string|Array} path - 属性路径，支持点号分隔或数组形式
 * @returns {boolean} 是否包含该属性
 */
const has = (obj, path) => {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  
  const keys = Array.isArray(path) ? path : path.split('.').filter(Boolean);
  let current = obj;
  
  for (const key of keys) {
    if (current === null || current === undefined || !Object.prototype.hasOwnProperty.call(current, key)) {
      return false;
    }
    current = current[key];
  }
  
  return true;
};

/**
 * 从对象中提取指定的属性
 * @param {Object} obj - 源对象
 * @param {Array<string>|string} keys - 要提取的属性名或属性名数组
 * @returns {Object} 提取后的新对象
 */
const pick = (obj, keys) => {
  if (!obj || typeof obj !== 'object') {
    return {};
  }
  
  const keyArray = Array.isArray(keys) ? keys : [keys];
  const result = {};
  
  keyArray.forEach(key => {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = obj[key];
    }
  });
  
  return result;
};

/**
 * 从对象中排除指定的属性
 * @param {Object} obj - 源对象
 * @param {Array<string>|string} keys - 要排除的属性名或属性名数组
 * @returns {Object} 排除后的新对象
 */
const omit = (obj, keys) => {
  if (!obj || typeof obj !== 'object') {
    return {};
  }
  
  const keyArray = Array.isArray(keys) ? keys : [keys];
  const result = {};
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key) && !keyArray.includes(key)) {
      result[key] = obj[key];
    }
  }
  
  return result;
};

/**
 * 过滤对象中的属性
 * @param {Object} obj - 源对象
 * @param {Function} predicate - 过滤函数，接收(key, value)参数，返回true保留，false排除
 * @returns {Object} 过滤后的新对象
 */
const filter = (obj, predicate) => {
  if (!obj || typeof obj !== 'object' || typeof predicate !== 'function') {
    return {};
  }
  
  const result = {};
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      if (predicate(key, value)) {
        result[key] = value;
      }
    }
  }
  
  return result;
};

/**
 * 映射对象中的属性
 * @param {Object} obj - 源对象
 * @param {Function} mapper - 映射函数，接收(value, key)参数，返回新值
 * @returns {Object} 映射后的新对象
 */
const map = (obj, mapper) => {
  if (!obj || typeof obj !== 'object' || typeof mapper !== 'function') {
    return {};
  }
  
  const result = {};
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = mapper(obj[key], key);
    }
  }
  
  return result;
};

/**
 * 将对象转换为键值对数组
 * @param {Object} obj - 源对象
 * @returns {Array<Array>} 键值对数组，每个元素为[key, value]
 */
const toPairs = (obj) => {
  if (!obj || typeof obj !== 'object') {
    return [];
  }
  
  const pairs = [];
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      pairs.push([key, obj[key]]);
    }
  }
  
  return pairs;
};

/**
 * 将键值对数组转换为对象
 * @param {Array<Array>} pairs - 键值对数组
 * @returns {Object} 转换后的对象
 */
const fromPairs = (pairs) => {
  if (!Array.isArray(pairs)) {
    return {};
  }
  
  const result = {};
  pairs.forEach(([key, value]) => {
    if (key !== undefined && key !== null) {
      result[key] = value;
    }
  });
  
  return result;
};

/**
 * 冻结对象，防止修改
 * @param {Object} obj - 要冻结的对象
 * @returns {Object} 冻结后的对象
 */
const freeze = (obj) => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  Object.freeze(obj);
  
  // 递归冻结所有属性
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key) &&
        obj[key] !== null && typeof obj[key] === 'object' &&
        !Object.isFrozen(obj[key])) {
      freeze(obj[key]);
    }
  }
  
  return obj;
};

/**
 * 计算对象的大小（属性数量）
 * @param {Object} obj - 源对象
 * @returns {number} 属性数量
 */
const size = (obj) => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return 0;
  }
  
  return Object.keys(obj).length;
};

/**
 * 将对象的键转换为小写
 * @param {Object} obj - 源对象
 * @returns {Object} 转换后的对象
 */
const keysToLowerCase = (obj) => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  const result = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const newKey = typeof key === 'string' ? key.toLowerCase() : key;
      result[newKey] = obj[key];
    }
  }
  
  return result;
};

/**
 * 将对象的键转换为大写
 * @param {Object} obj - 源对象
 * @returns {Object} 转换后的对象
 */
const keysToUpperCase = (obj) => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  const result = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const newKey = typeof key === 'string' ? key.toUpperCase() : key;
      result[newKey] = obj[key];
    }
  }
  
  return result;
};

/**
 * 检查两个对象是否深度相等
 * @param {Object} obj1 - 第一个对象
 * @param {Object} obj2 - 第二个对象
 * @returns {boolean} 是否深度相等
 */
const isEqual = (obj1, obj2) => {
  // 检查基本类型和引用相等
  if (obj1 === obj2) {
    return true;
  }
  
  // 检查null和undefined
  if (obj1 === null || obj2 === null || 
      typeof obj1 !== 'object' || typeof obj2 !== 'object') {
    return false;
  }
  
  // 检查日期
  if (obj1 instanceof Date && obj2 instanceof Date) {
    return obj1.getTime() === obj2.getTime();
  }
  
  // 检查正则表达式
  if (obj1 instanceof RegExp && obj2 instanceof RegExp) {
    return obj1.source === obj2.source && 
           obj1.flags === obj2.flags;
  }
  
  // 检查数组
  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    if (obj1.length !== obj2.length) {
      return false;
    }
    
    return obj1.every((item, index) => isEqual(item, obj2[index]));
  }
  
  // 检查Map
  if (obj1 instanceof Map && obj2 instanceof Map) {
    if (obj1.size !== obj2.size) {
      return false;
    }
    
    for (const [key, value] of obj1) {
      if (!obj2.has(key) || !isEqual(value, obj2.get(key))) {
        return false;
      }
    }
    
    return true;
  }
  
  // 检查Set
  if (obj1 instanceof Set && obj2 instanceof Set) {
    if (obj1.size !== obj2.size) {
      return false;
    }
    
    const arr1 = Array.from(obj1);
    const arr2 = Array.from(obj2);
    
    return arr1.every(item1 => 
      arr2.some(item2 => isEqual(item1, item2))
    );
  }
  
  // 检查普通对象
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) {
    return false;
  }
  
  return keys1.every(key => 
    keys2.includes(key) && isEqual(obj1[key], obj2[key])
  );
};

/**
 * 将对象扁平化，使用点号分隔嵌套属性
 * @param {Object} obj - 源对象
 * @param {string} prefix - 可选的前缀
 * @returns {Object} 扁平化后的对象
 */
const flatten = (obj, prefix = '') => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return {};
  }
  
  let flattened = {};
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (value && typeof value === 'object' && !Array.isArray(value) && !value instanceof Date) {
        // 递归扁平化嵌套对象
        flattened = { ...flattened, ...flatten(value, newKey) };
      } else {
        flattened[newKey] = value;
      }
    }
  }
  
  return flattened;
};

/**
 * 将扁平化的对象还原为嵌套结构
 * @param {Object} obj - 扁平化的对象
 * @returns {Object} 还原后的嵌套对象
 */
const unflatten = (obj) => {
  if (!obj || typeof obj !== 'object') {
    return {};
  }
  
  const result = {};
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      // 使用set函数设置嵌套属性
      set(result, key, obj[key]);
    }
  }
  
  return result;
};

module.exports = {
  isEmpty,
  isNotEmpty,
  deepClone,
  shallowClone,
  merge,
  deepMerge,
  get,
  set,
  remove,
  has,
  pick,
  omit,
  filter,
  map,
  toPairs,
  fromPairs,
  freeze,
  size,
  keysToLowerCase,
  keysToUpperCase,
  isEqual,
  flatten,
  unflatten
};