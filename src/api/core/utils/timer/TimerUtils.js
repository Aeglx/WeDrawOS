/**
 * 定时器管理工具类
 * 提供延迟执行、定时任务和调度管理功能
 */

const { AppError } = require('../../exception/handlers/errorHandler');
const logger = require('../logger');

/**
 * 定时器管理工具类
 */
class TimerUtils {
  /**
   * 私有构造函数（单例模式）
   * @private
   */
  constructor() {
    this._timers = new Map();
    this._intervals = new Map();
    this._timeouts = new Map();
    this._tasks = new Map();
    this._nextId = 1;
  }

  /**
   * 获取实例（单例模式）
   * @returns {TimerUtils} 定时器工具实例
   */
  static getInstance() {
    if (!TimerUtils._instance) {
      TimerUtils._instance = new TimerUtils();
    }
    return TimerUtils._instance;
  }

  /**
   * 生成唯一ID
   * @private
   * @returns {string} 唯一ID
   */
  _generateId() {
    return `timer_${this._nextId++}`;
  }

  /**
   * 延迟执行函数
   * @param {Function} fn - 要执行的函数
   * @param {number} delay - 延迟时间（毫秒）
   * @returns {Promise} Promise对象
   */
  static delay(fn, delay = 0) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        try {
          if (typeof fn === 'function') {
            resolve(fn());
          } else {
            resolve();
          }
        } catch (error) {
          reject(error);
        }
      }, delay);

      // 保存timeout引用以便可能的取消操作
      const timerId = TimerUtils.getInstance()._generateId();
      TimerUtils.getInstance()._timeouts.set(timerId, {
        id: timeoutId,
        created: Date.now(),
        delay
      });

      // 清理引用
      const cleanup = () => {
        TimerUtils.getInstance()._timeouts.delete(timerId);
      };

      // 添加清理方法到Promise
      const originalThen = resolve;
      resolve = (...args) => {
        cleanup();
        return originalThen.apply(this, args);
      };

      const originalCatch = reject;
      reject = (...args) => {
        cleanup();
        return originalCatch.apply(this, args);
      };
    });
  }

  /**
   * 等待指定时间
   * @param {number} ms - 等待时间（毫秒）
   * @returns {Promise<void>} Promise对象
   */
  static sleep(ms = 0) {
    return this.delay(() => {}, ms);
  }

  /**
   * 创建一次性定时器
   * @param {Function} callback - 回调函数
   * @param {number} delay - 延迟时间（毫秒）
   * @param {Object} options - 选项
   * @returns {string} 定时器ID
   */
  createTimeout(callback, delay = 0, options = {}) {
    const timerId = this._generateId();
    const timeoutId = setTimeout(async () => {
      try {
        await callback();
      } catch (error) {
        logger.error(`定时器执行失败: ${timerId}`, { error });
        if (options.onError) {
          options.onError(error);
        }
      } finally {
        this._timeouts.delete(timerId);
        if (options.onComplete) {
          options.onComplete();
        }
      }
    }, delay);

    this._timeouts.set(timerId, {
      id: timeoutId,
      created: Date.now(),
      delay,
      callback,
      options
    });

    logger.debug(`一次性定时器创建成功: ${timerId}, 延迟${delay}ms`);
    return timerId;
  }

  /**
   * 创建周期性定时器
   * @param {Function} callback - 回调函数
   * @param {number} interval - 间隔时间（毫秒）
   * @param {Object} options - 选项
   * @returns {string} 定时器ID
   */
  createInterval(callback, interval = 1000, options = {}) {
    const timerId = this._generateId();
    
    let lastExecution = 0;
    let executionCount = 0;
    let maxExecutions = options.maxExecutions || Infinity;
    let immediate = options.immediate || false;
    let running = false;

    const intervalCallback = async () => {
      if (running) return; // 防止重叠执行
      
      running = true;
      lastExecution = Date.now();
      executionCount++;

      try {
        await callback(executionCount);
      } catch (error) {
        logger.error(`周期性定时器执行失败: ${timerId}`, { error });
        if (options.onError) {
          options.onError(error, executionCount);
        }
        
        // 如果配置了遇到错误停止，则清除定时器
        if (options.stopOnError) {
          this.clearInterval(timerId);
          return;
        }
      } finally {
        running = false;
      }

      // 检查是否达到最大执行次数
      if (executionCount >= maxExecutions) {
        this.clearInterval(timerId);
        if (options.onComplete) {
          options.onComplete(executionCount);
        }
      }
    };

    // 立即执行（如果需要）
    if (immediate) {
      process.nextTick(intervalCallback);
    }

    const intervalId = setInterval(intervalCallback, interval);

    this._intervals.set(timerId, {
      id: intervalId,
      created: Date.now(),
      interval,
      callback,
      options,
      lastExecution,
      executionCount,
      maxExecutions
    });

    logger.debug(`周期性定时器创建成功: ${timerId}, 间隔${interval}ms`);
    return timerId;
  }

  /**
   * 清除一次性定时器
   * @param {string} timerId - 定时器ID
   * @returns {boolean} 是否成功清除
   */
  clearTimeout(timerId) {
    const timer = this._timeouts.get(timerId);
    if (timer) {
      clearTimeout(timer.id);
      this._timeouts.delete(timerId);
      logger.debug(`一次性定时器已清除: ${timerId}`);
      return true;
    }
    return false;
  }

  /**
   * 清除周期性定时器
   * @param {string} timerId - 定时器ID
   * @returns {boolean} 是否成功清除
   */
  clearInterval(timerId) {
    const timer = this._intervals.get(timerId);
    if (timer) {
      clearInterval(timer.id);
      this._intervals.delete(timerId);
      logger.debug(`周期性定时器已清除: ${timerId}`);
      return true;
    }
    return false;
  }

  /**
   * 取消所有定时器
   * @returns {Object} 取消统计信息
   */
  clearAll() {
    const timeoutsCount = this._timeouts.size;
    const intervalsCount = this._intervals.size;

    // 清除所有timeout
    for (const [id, timer] of this._timeouts.entries()) {
      clearTimeout(timer.id);
    }
    this._timeouts.clear();

    // 清除所有interval
    for (const [id, timer] of this._intervals.entries()) {
      clearInterval(timer.id);
    }
    this._intervals.clear();

    logger.debug(`所有定时器已清除: ${timeoutsCount}个一次性, ${intervalsCount}个周期性`);

    return {
      timeoutsCleared: timeoutsCount,
      intervalsCleared: intervalsCount,
      totalCleared: timeoutsCount + intervalsCount
    };
  }

  /**
   * 创建一个定时任务
   * @param {string} name - 任务名称
   * @param {Function} taskFn - 任务函数
   * @param {number|Object} schedule - 调度配置
   * @returns {string} 任务ID
   */
  scheduleTask(name, taskFn, schedule) {
    const taskId = this._generateId();
    let interval;
    let timeout;
    let nextRunTime;
    let lastRunTime;
    let running = false;

    // 解析调度配置
    if (typeof schedule === 'number') {
      // 如果是数字，当作固定间隔（毫秒）
      interval = schedule;
    } else if (schedule && typeof schedule === 'object') {
      interval = schedule.interval;
      timeout = schedule.timeout;
    }

    // 任务执行函数
    const executeTask = async () => {
      if (running) return;
      
      running = true;
      lastRunTime = Date.now();

      try {
        logger.debug(`任务开始执行: ${name} (${taskId})`);
        await taskFn();
        logger.debug(`任务执行完成: ${name} (${taskId})`);
      } catch (error) {
        logger.error(`任务执行失败: ${name} (${taskId})`, { error });
      } finally {
        running = false;
        
        // 如果是周期性任务，安排下一次执行
        if (interval) {
          nextRunTime = Date.now() + interval;
          this._tasks.get(taskId).timeoutId = setTimeout(executeTask, interval);
        }
      }
    };

    // 初始化任务
    const task = {
      id: taskId,
      name,
      taskFn,
      schedule,
      interval,
      timeout,
      nextRunTime: interval ? Date.now() + interval : null,
      lastRunTime: null,
      running: false,
      timeoutId: null,
      createdAt: Date.now()
    };

    // 安排第一次执行
    if (interval) {
      task.timeoutId = setTimeout(executeTask, interval);
    } else if (timeout) {
      task.timeoutId = setTimeout(() => {
        executeTask();
        this._tasks.delete(taskId);
      }, timeout);
    }

    this._tasks.set(taskId, task);
    logger.debug(`任务已调度: ${name} (${taskId})`);
    
    return taskId;
  }

  /**
   * 取消定时任务
   * @param {string} taskId - 任务ID
   * @returns {boolean} 是否成功取消
   */
  cancelTask(taskId) {
    const task = this._tasks.get(taskId);
    if (task) {
      if (task.timeoutId) {
        clearTimeout(task.timeoutId);
      }
      this._tasks.delete(taskId);
      logger.debug(`任务已取消: ${task.name} (${taskId})`);
      return true;
    }
    return false;
  }

  /**
   * 立即执行定时任务
   * @param {string} taskId - 任务ID
   * @returns {Promise<boolean>} 是否成功执行
   */
  async executeTaskNow(taskId) {
    const task = this._tasks.get(taskId);
    if (task && !task.running) {
      logger.debug(`任务立即执行: ${task.name} (${taskId})`);
      
      task.running = true;
      task.lastRunTime = Date.now();
      
      try {
        await task.taskFn();
        return true;
      } catch (error) {
        logger.error(`任务立即执行失败: ${task.name} (${taskId})`, { error });
        return false;
      } finally {
        task.running = false;
      }
    }
    return false;
  }

  /**
   * 获取任务信息
   * @param {string} taskId - 任务ID
   * @returns {Object|null} 任务信息
   */
  getTaskInfo(taskId) {
    const task = this._tasks.get(taskId);
    if (!task) return null;

    return {
      id: task.id,
      name: task.name,
      schedule: task.schedule,
      nextRunTime: task.nextRunTime,
      lastRunTime: task.lastRunTime,
      running: task.running,
      createdAt: task.createdAt,
      timeSinceLastRun: task.lastRunTime ? Date.now() - task.lastRunTime : null
    };
  }

  /**
   * 获取所有任务列表
   * @returns {Array} 任务列表
   */
  getAllTasks() {
    const tasks = [];
    for (const task of this._tasks.values()) {
      tasks.push(this.getTaskInfo(task.id));
    }
    return tasks;
  }

  /**
   * 按名称查找任务
   * @param {string} name - 任务名称
   * @returns {Array} 匹配的任务列表
   */
  findTasksByName(name) {
    const tasks = [];
    for (const task of this._tasks.values()) {
      if (task.name === name) {
        tasks.push(this.getTaskInfo(task.id));
      }
    }
    return tasks;
  }

  /**
   * 创建节流函数
   * @param {Function} fn - 要节流的函数
   * @param {number} limit - 时间限制（毫秒）
   * @returns {Function} 节流后的函数
   */
  static throttle(fn, limit = 1000) {
    let inThrottle;
    
    return function(...args) {
      if (!inThrottle) {
        fn.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * 创建防抖函数
   * @param {Function} fn - 要防抖的函数
   * @param {number} delay - 延迟时间（毫秒）
   * @returns {Function} 防抖后的函数
   */
  static debounce(fn, delay = 1000) {
    let timeoutId;
    
    return function(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  /**
   * 创建带结果的防抖函数
   * @param {Function} fn - 要防抖的函数
   * @param {number} delay - 延迟时间（毫秒）
   * @returns {Function} 防抖后的函数
   */
  static debounceWithResult(fn, delay = 1000) {
    let timeoutId;
    let lastPromise;
    let lastResolve;
    let lastReject;
    
    return function(...args) {
      clearTimeout(timeoutId);
      
      if (!lastPromise) {
        lastPromise = new Promise((resolve, reject) => {
          lastResolve = resolve;
          lastReject = reject;
        });
      }
      
      timeoutId = setTimeout(async () => {
        try {
          const result = await fn.apply(this, args);
          lastResolve(result);
        } catch (error) {
          lastReject(error);
        } finally {
          lastPromise = null;
          lastResolve = null;
          lastReject = null;
        }
      }, delay);
      
      return lastPromise;
    };
  }

  /**
   * 重试函数执行
   * @param {Function} fn - 要执行的函数
   * @param {Object} options - 重试选项
   * @returns {Promise<any>} 执行结果
   */
  static async retry(fn, options = {}) {
    const {
      retries = 3,
      delay = 1000,
      maxDelay = 10000,
      factor = 2,
      onRetry = null,
      retryableErrors = null
    } = options;

    let lastError;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await fn(attempt);
      } catch (error) {
        lastError = error;
        
        // 检查是否是可重试的错误
        if (retryableErrors && !retryableErrors.some(errType => error instanceof errType || error.name === errType.name)) {
          throw error;
        }
        
        // 如果是最后一次尝试，抛出错误
        if (attempt >= retries) {
          throw error;
        }
        
        // 计算延迟时间（指数退避）
        const currentDelay = Math.min(
          delay * Math.pow(factor, attempt),
          maxDelay
        );
        
        // 添加随机抖动（±10%）
        const jitter = currentDelay * 0.1;
        const actualDelay = currentDelay + (Math.random() * jitter * 2 - jitter);
        
        // 执行重试回调
        if (onRetry) {
          onRetry(attempt + 1, retries, actualDelay, error);
        }
        
        logger.debug(`函数执行失败，将在${actualDelay}ms后重试 (尝试 ${attempt + 1}/${retries})`, { error });
        
        // 等待延迟时间
        await this.sleep(actualDelay);
      }
    }
    
    // 理论上不会执行到这里，但为了类型安全
    throw lastError || new Error('重试失败');
  }

  /**
   * 创建定时器组
   * @param {string} groupName - 组名称
   * @returns {Object} 定时器组对象
   */
  createTimerGroup(groupName) {
    const timers = [];
    const group = {
      name: groupName,
      addTimeout: (callback, delay, options) => {
        const id = this.createTimeout(callback, delay, options);
        timers.push({ type: 'timeout', id });
        return id;
      },
      addInterval: (callback, interval, options) => {
        const id = this.createInterval(callback, interval, options);
        timers.push({ type: 'interval', id });
        return id;
      },
      clearAll: () => {
        for (const timer of timers) {
          if (timer.type === 'timeout') {
            this.clearTimeout(timer.id);
          } else if (timer.type === 'interval') {
            this.clearInterval(timer.id);
          }
        }
        timers.length = 0;
        logger.debug(`定时器组已清除: ${groupName}`);
        return true;
      },
      getTimers: () => [...timers]
    };
    
    logger.debug(`定时器组创建成功: ${groupName}`);
    return group;
  }

  /**
   * 获取定时器统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    return {
      timeoutCount: this._timeouts.size,
      intervalCount: this._intervals.size,
      taskCount: this._tasks.size,
      totalTimers: this._timeouts.size + this._intervals.size + this._tasks.size,
      uptime: process.uptime() * 1000
    };
  }

  /**
   * 检查定时器是否存在
   * @param {string} timerId - 定时器ID
   * @returns {Object|null} 定时器信息或null
   */
  getTimerInfo(timerId) {
    let timer;
    let type;
    
    if (this._timeouts.has(timerId)) {
      timer = this._timeouts.get(timerId);
      type = 'timeout';
    } else if (this._intervals.has(timerId)) {
      timer = this._intervals.get(timerId);
      type = 'interval';
    } else if (this._tasks.has(timerId)) {
      return this.getTaskInfo(timerId);
    } else {
      return null;
    }
    
    return {
      id: timerId,
      type,
      created: timer.created,
      age: Date.now() - timer.created,
      ...timer
    };
  }

  /**
   * 安全地执行异步操作，并在超时后自动取消
   * @param {Function} fn - 异步函数
   * @param {number} timeoutMs - 超时时间（毫秒）
   * @param {string} errorMessage - 超时错误消息
   * @returns {Promise<any>} 执行结果
   */
  static async withTimeout(fn, timeoutMs = 30000, errorMessage = '操作超时') {
    // 创建一个超时Promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new AppError(errorMessage, 408));
      }, timeoutMs);
    });

    // 创建一个执行Promise
    const executionPromise = Promise.resolve().then(() => fn());

    // 使用Promise.race来实现超时控制
    return Promise.race([executionPromise, timeoutPromise]);
  }

  /**
   * 执行一系列异步任务，限制并发数
   * @param {Array<Function>} tasks - 任务函数数组
   * @param {number} concurrency - 最大并发数
   * @returns {Promise<Array>} 任务结果数组
   */
  static async runWithConcurrency(tasks, concurrency = 5) {
    const results = [];
    const executing = new Set();
    const taskQueue = [...tasks];

    async function executeNext() {
      if (taskQueue.length === 0) return;
      
      const task = taskQueue.shift();
      const promise = Promise.resolve().then(() => task());
      
      executing.add(promise);
      
      try {
        const result = await promise;
        results.push(result);
      } catch (error) {
        results.push(error);
      } finally {
        executing.delete(promise);
        await executeNext();
      }
    }

    // 启动初始并发任务
    const initialTasks = [];
    for (let i = 0; i < Math.min(concurrency, tasks.length); i++) {
      initialTasks.push(executeNext());
    }

    // 等待所有任务完成
    await Promise.all(initialTasks);
    
    return results;
  }
}

module.exports = TimerUtils;