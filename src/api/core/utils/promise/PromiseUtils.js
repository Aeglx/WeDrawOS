/**
 * Promise工具类
 * 提供Promise操作、异步流程控制、错误处理等功能
 */

const logger = require('../logger');

/**
 * Promise工具
 */
class PromiseUtils {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   */
  constructor(options = {}) {
    this.options = {
      defaultTimeout: 30000, // 默认超时时间（毫秒）
      defaultRetryDelay: 1000, // 默认重试延迟（毫秒）
      maxConcurrent: 10, // 默认最大并发数
      ...options
    };
    
    logger.debug('创建Promise工具实例', { options });
    
    // 确保Promise可用
    if (!global.Promise) {
      throw new Error('环境不支持Promise');
    }
  }

  /**
   * 创建已解决的Promise
   * @param {*} value - 解决的值
   * @returns {Promise} 已解决的Promise
   */
  resolve(value) {
    return Promise.resolve(value);
  }

  /**
   * 创建已拒绝的Promise
   * @param {*} reason - 拒绝的原因
   * @returns {Promise} 已拒绝的Promise
   */
  reject(reason) {
    return Promise.reject(reason);
  }

  /**
   * 等待所有Promise完成
   * @param {Promise[]} promises - Promise数组
   * @returns {Promise<Array>} 包含所有结果的Promise
   */
  all(promises) {
    if (!Array.isArray(promises)) {
      return Promise.reject(new Error('参数必须是Promise数组'));
    }
    
    return Promise.all(promises);
  }

  /**
   * 等待任一Promise完成
   * @param {Promise[]} promises - Promise数组
   * @returns {Promise} 第一个完成的Promise的结果
   */
  race(promises) {
    if (!Array.isArray(promises)) {
      return Promise.reject(new Error('参数必须是Promise数组'));
    }
    
    return Promise.race(promises);
  }

  /**
   * 等待所有Promise完成（无论成功或失败）
   * @param {Promise[]} promises - Promise数组
   * @returns {Promise<Array>} 包含所有结果的Promise
   */
  allSettled(promises) {
    if (!Array.isArray(promises)) {
      return Promise.reject(new Error('参数必须是Promise数组'));
    }
    
    // 使用原生allSettled（如果可用）
    if (Promise.allSettled) {
      return Promise.allSettled(promises);
    }
    
    // 手动实现
    return Promise.all(promises.map(p => 
      Promise.resolve(p).then(
        value => ({ status: 'fulfilled', value }),
        reason => ({ status: 'rejected', reason })
      )
    ));
  }

  /**
   * 等待任一Promise成功
   * @param {Promise[]} promises - Promise数组
   * @returns {Promise} 第一个成功的Promise的结果
   */
  any(promises) {
    if (!Array.isArray(promises)) {
      return Promise.reject(new Error('参数必须是Promise数组'));
    }
    
    // 使用原生any（如果可用）
    if (Promise.any) {
      return Promise.any(promises);
    }
    
    // 手动实现
    return new Promise((resolve, reject) => {
      if (promises.length === 0) {
        return reject(new AggregateError([], 'No promises resolved'));
      }
      
      let rejectedCount = 0;
      const reasons = [];
      
      promises.forEach((promise, index) => {
        Promise.resolve(promise).then(
          value => resolve(value),
          reason => {
            rejectedCount++;
            reasons[index] = reason;
            if (rejectedCount === promises.length) {
              reject(new AggregateError(reasons, 'All promises were rejected'));
            }
          }
        );
      });
    });
  }

  /**
   * 为Promise添加超时
   * @param {Promise} promise - 要包装的Promise
   * @param {number} timeoutMs - 超时时间（毫秒）
   * @param {string} timeoutMessage - 超时错误消息
   * @returns {Promise} 带超时的Promise
   */
  withTimeout(promise, timeoutMs = this.options.defaultTimeout, timeoutMessage = '操作超时') {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(timeoutMessage));
      }, timeoutMs);
      
      Promise.resolve(promise)
        .then((value) => {
          clearTimeout(timeoutId);
          resolve(value);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  /**
   * 重试Promise操作
   * @param {Function} fn - 返回Promise的函数
   * @param {Object} options - 重试选项
   * @param {number} options.maxRetries - 最大重试次数（默认3）
   * @param {number} options.delay - 重试延迟（毫秒）
   * @param {Function} options.shouldRetry - 判断是否应该重试的函数
   * @param {Function} options.onRetry - 重试前的回调函数
   * @returns {Promise} 重试逻辑包装的Promise
   */
  retry(fn, options = {}) {
    const {
      maxRetries = 3,
      delay = this.options.defaultRetryDelay,
      shouldRetry = (error) => true,
      onRetry = () => {}
    } = options;
    
    let retries = 0;
    
    const attempt = () => {
      return Promise.resolve()
        .then(() => fn())
        .catch((error) => {
          if (retries < maxRetries && shouldRetry(error)) {
            retries++;
            
            logger.debug(`操作失败，将在 ${delay}ms 后进行第 ${retries} 次重试`, {
              error: error.message,
              retries,
              maxRetries
            });
            
            // 调用重试回调
            onRetry(error, retries);
            
            // 等待延迟后重试
            return this.delay(delay).then(attempt);
          }
          
          // 超过重试次数或不应该重试，抛出错误
          throw error;
        });
    };
    
    return attempt();
  }

  /**
   * 延迟指定时间
   * @param {number} ms - 延迟时间（毫秒）
   * @returns {Promise} 延迟后的Promise
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 重试带退避策略的Promise操作
   * @param {Function} fn - 返回Promise的函数
   * @param {Object} options - 重试选项
   * @param {number} options.maxRetries - 最大重试次数
   * @param {number} options.initialDelay - 初始延迟（毫秒）
   * @param {number} options.maxDelay - 最大延迟（毫秒）
   * @param {number} options.backoffFactor - 退避因子（默认2）
   * @param {Function} options.shouldRetry - 判断是否应该重试的函数
   * @returns {Promise} 重试逻辑包装的Promise
   */
  backoffRetry(fn, options = {}) {
    const {
      maxRetries = 5,
      initialDelay = this.options.defaultRetryDelay,
      maxDelay = 30000,
      backoffFactor = 2,
      shouldRetry = (error) => true
    } = options;
    
    let retries = 0;
    
    const attempt = () => {
      return Promise.resolve()
        .then(() => fn())
        .catch((error) => {
          if (retries < maxRetries && shouldRetry(error)) {
            retries++;
            
            // 计算退避延迟（带抖动）
            const delay = Math.min(
              initialDelay * Math.pow(backoffFactor, retries - 1),
              maxDelay
            );
            
            // 添加随机抖动（±15%）
            const jitter = delay * 0.15;
            const actualDelay = delay - jitter + (Math.random() * jitter * 2);
            
            logger.debug(`操作失败，将在 ${Math.round(actualDelay)}ms 后进行第 ${retries} 次重试（带退避）`, {
              error: error.message,
              retries,
              maxRetries,
              delay: Math.round(actualDelay)
            });
            
            return this.delay(actualDelay).then(attempt);
          }
          
          throw error;
        });
    };
    
    return attempt();
  }

  /**
   * 并发执行Promise操作
   * @param {Array} items - 要处理的项目数组
   * @param {Function} fn - 处理函数，接收item并返回Promise
   * @param {Object} options - 并发选项
   * @param {number} options.concurrent - 并发数量
   * @param {boolean} options.failFast - 是否在任一操作失败时立即停止
   * @returns {Promise<Array>} 包含所有结果的Promise
   */
  async concurrentMap(items, fn, options = {}) {
    const {
      concurrent = this.options.maxConcurrent,
      failFast = true
    } = options;
    
    if (!Array.isArray(items)) {
      return Promise.reject(new Error('items参数必须是数组'));
    }
    
    if (typeof fn !== 'function') {
      return Promise.reject(new Error('fn参数必须是函数'));
    }
    
    const results = new Array(items.length);
    const queue = [...items];
    const running = new Set();
    let isRejected = false;
    
    const runNext = async () => {
      if (queue.length === 0 || (failFast && isRejected)) {
        return;
      }
      
      const index = items.length - queue.length;
      const item = queue.shift();
      
      // 创建一个任务标识符
      const taskId = Symbol('task');
      running.add(taskId);
      
      try {
        const result = await fn(item, index, items);
        results[index] = result;
      } catch (error) {
        if (failFast) {
          isRejected = true;
          throw error;
        }
        // 如果不是failFast模式，记录错误但继续执行
        results[index] = { error };
      } finally {
        running.delete(taskId);
      }
      
      await runNext();
    };
    
    // 启动并发任务
    const promises = [];
    const numConcurrent = Math.min(concurrent, items.length);
    
    for (let i = 0; i < numConcurrent; i++) {
      promises.push(runNext());
    }
    
    await Promise.all(promises);
    
    return results;
  }

  /**
   * 串行执行Promise操作
   * @param {Array} items - 要处理的项目数组
   * @param {Function} fn - 处理函数，接收item并返回Promise
   * @param {boolean} stopOnError - 是否在错误时停止
   * @returns {Promise<Array>} 包含所有结果的Promise
   */
  async serialMap(items, fn, stopOnError = true) {
    if (!Array.isArray(items)) {
      return Promise.reject(new Error('items参数必须是数组'));
    }
    
    if (typeof fn !== 'function') {
      return Promise.reject(new Error('fn参数必须是函数'));
    }
    
    const results = [];
    
    for (let i = 0; i < items.length; i++) {
      try {
        const result = await fn(items[i], i, items);
        results.push(result);
      } catch (error) {
        if (stopOnError) {
          throw error;
        }
        results.push({ error });
      }
    }
    
    return results;
  }

  /**
   * 批量执行Promise操作
   * @param {Array} items - 要处理的项目数组
   * @param {Function} fn - 处理函数，接收item数组并返回Promise数组
   * @param {number} batchSize - 批次大小
   * @returns {Promise<Array>} 包含所有结果的Promise
   */
  async batchMap(items, fn, batchSize = 10) {
    if (!Array.isArray(items)) {
      return Promise.reject(new Error('items参数必须是数组'));
    }
    
    if (typeof fn !== 'function') {
      return Promise.reject(new Error('fn参数必须是函数'));
    }
    
    const batches = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    
    const results = [];
    for (const batch of batches) {
      const batchResults = await Promise.all(fn(batch));
      results.push(...batchResults);
    }
    
    return results;
  }

  /**
   * 创建可取消的Promise
   * @param {Function} executor - Promise执行器函数
   * @returns {Object} 包含promise和cancel方法的对象
   */
  cancellable(executor) {
    let cancelFn;
    
    const promise = new Promise((resolve, reject) => {
      cancelFn = reject;
      
      // 执行原始executor，但捕获cancel操作
      try {
        executor(
          (value) => !cancelled && resolve(value),
          (reason) => !cancelled && reject(reason)
        );
      } catch (error) {
        if (!cancelled) {
          reject(error);
        }
      }
    });
    
    let cancelled = false;
    
    return {
      promise,
      cancel: (reason = new Error('Promise被取消')) => {
        if (!cancelled) {
          cancelled = true;
          cancelFn(reason);
        }
      }
    };
  }

  /**
   * 防抖Promise操作
   * @param {Function} fn - 返回Promise的函数
   * @param {number} delay - 延迟时间（毫秒）
   * @returns {Function} 防抖处理后的函数
   */
  debounce(fn, delay) {
    let timeoutId;
    
    return function(...args) {
      return new Promise((resolve, reject) => {
        clearTimeout(timeoutId);
        
        timeoutId = setTimeout(() => {
          Promise.resolve()
            .then(() => fn.apply(this, args))
            .then(resolve)
            .catch(reject);
        }, delay);
      });
    };
  }

  /**
   * 节流Promise操作
   * @param {Function} fn - 返回Promise的函数
   * @param {number} limit - 时间限制（毫秒）
   * @returns {Function} 节流处理后的函数
   */
  throttle(fn, limit) {
    let inThrottle;
    let lastResult;
    
    return function(...args) {
      if (!inThrottle) {
        inThrottle = true;
        
        return Promise.resolve()
          .then(() => fn.apply(this, args))
          .then(result => {
            lastResult = result;
            setTimeout(() => inThrottle = false, limit);
            return result;
          });
      }
      
      // 如果在节流中，返回最后一次的结果
      return Promise.resolve(lastResult);
    };
  }

  /**
   * 重试直到成功
   * @param {Function} fn - 返回Promise的函数
   * @param {Object} options - 重试选项
   * @param {number} options.delay - 重试间隔（毫秒）
   * @param {number} options.maxAttempts - 最大尝试次数（0表示无限）
   * @returns {Promise} 成功后的结果
   */
  retryUntilSuccess(fn, options = {}) {
    const {
      delay = this.options.defaultRetryDelay,
      maxAttempts = 0
    } = options;
    
    let attempts = 0;
    
    const attempt = () => {
      attempts++;
      
      if (maxAttempts > 0 && attempts > maxAttempts) {
        return Promise.reject(new Error(`超过最大尝试次数 ${maxAttempts}`));
      }
      
      return Promise.resolve()
        .then(() => fn())
        .catch(() => {
          logger.debug(`操作失败，将在 ${delay}ms 后重试`, { attempts });
          return this.delay(delay).then(attempt);
        });
    };
    
    return attempt();
  }

  /**
   * 执行异步函数并确保finally块执行
   * @param {Function} fn - 异步函数
   * @param {Function} finallyFn - finally回调
   * @returns {Promise} 结果Promise
   */
  async withFinally(fn, finallyFn) {
    try {
      return await fn();
    } catch (error) {
      throw error;
    } finally {
      await finallyFn();
    }
  }

  /**
   * 安全执行异步函数（不抛出异常）
   * @param {Function} fn - 异步函数
   * @returns {Promise<Object>} { success: boolean, result/error: * }
   */
  async safeExecute(fn) {
    try {
      const result = await fn();
      return { success: true, result };
    } catch (error) {
      return { success: false, error };
    }
  }
}

// 单例模式
let instance = null;

function getInstance(options = {}) {
  if (!instance) {
    instance = new PromiseUtils(options);
  }
  return instance;
}

module.exports = {
  PromiseUtils,
  getInstance
};