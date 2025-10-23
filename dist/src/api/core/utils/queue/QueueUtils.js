/**
 * 队列工具
 * 提供任务队列和异步任务处理功能
 */

const { EventEmitter } = require('events');
const { timerUtils } = require('../timer');
const { typeUtils } = require('../type');
const { logger } = require('../logger');

/**
 * 队列处理状态枚举
 */
const QueueStatus = {
  IDLE: 'idle',       // 空闲
  RUNNING: 'running', // 运行中
  PAUSED: 'paused',   // 已暂停
  STOPPED: 'stopped'  // 已停止
};

/**
 * 任务优先级枚举
 */
const TaskPriority = {
  LOW: 0,
  NORMAL: 1,
  HIGH: 2,
  CRITICAL: 3
};

/**
 * 队列工具类
 * 提供异步任务队列管理、优先级排序、并发控制等功能
 */
class QueueUtils extends EventEmitter {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   */
  constructor(options = {}) {
    super();

    this.options = {
      concurrency: options.concurrency || 1,
      autoStart: options.autoStart !== undefined ? options.autoStart : true,
      timeout: options.timeout || null,
      retryAttempts: options.retryAttempts || 0,
      retryDelay: options.retryDelay || 1000,
      maxSize: options.maxSize || null,
      priorityMode: options.priorityMode !== undefined ? options.priorityMode : true,
      ...options
    };

    // 队列存储
    this.queue = [];
    
    // 正在处理的任务
    this.processingTasks = new Map();
    
    // 队列状态
    this.status = QueueStatus.IDLE;
    
    // 任务计数器
    this.taskCounter = 0;
    
    // 统计信息
    this.stats = {
      processed: 0,
      failed: 0,
      succeeded: 0,
      totalWaitTime: 0,
      totalProcessTime: 0,
      averageWaitTime: 0,
      averageProcessTime: 0
    };

    // 初始化
    this.initialize();
  }

  /**
   * 初始化队列
   * @private
   */
  initialize() {
    // 设置最大监听器数量
    this.setMaxListeners(100);

    // 如果设置了自动启动，启动队列
    if (this.options.autoStart) {
      this.start();
    }

    logger.debug('队列工具初始化完成', {
      concurrency: this.options.concurrency,
      maxSize: this.options.maxSize,
      priorityMode: this.options.priorityMode
    });
  }

  /**
   * 添加任务到队列
   * @param {Function} task - 任务函数
   * @param {Object} options - 任务选项
   * @returns {string} 任务ID
   */
  add(task, options = {}) {
    if (typeof task !== 'function') {
      throw new TypeError('Task must be a function');
    }

    // 检查队列大小限制
    if (this.options.maxSize && this.queue.length >= this.options.maxSize) {
      throw new Error('Queue is full');
    }

    // 生成任务ID
    const taskId = `task-${this.taskCounter++}`;
    
    // 创建任务对象
    const taskObject = {
      id: taskId,
      task,
      priority: options.priority || TaskPriority.NORMAL,
      attempts: 0,
      maxAttempts: options.maxAttempts !== undefined ? options.maxAttempts : this.options.retryAttempts,
      retryDelay: options.retryDelay !== undefined ? options.retryDelay : this.options.retryDelay,
      timeout: options.timeout !== undefined ? options.timeout : this.options.timeout,
      createdAt: Date.now(),
      startedAt: null,
      completedAt: null,
      waitTime: null,
      processTime: null,
      metadata: options.metadata || {}
    };

    // 添加到队列
    this.queue.push(taskObject);

    // 如果启用了优先级模式，按优先级排序
    if (this.options.priorityMode) {
      this.queue.sort((a, b) => b.priority - a.priority);
    }

    // 触发任务添加事件
    this.emit('task.added', taskObject);

    // 如果队列正在运行，尝试处理任务
    if (this.status === QueueStatus.RUNNING) {
      this.processQueue();
    }

    return taskId;
  }

  /**
   * 批量添加任务
   * @param {Array<Function|Object>} tasks - 任务数组
   * @returns {Array<string>} 任务ID数组
   */
  addAll(tasks) {
    if (!Array.isArray(tasks)) {
      throw new TypeError('Tasks must be an array');
    }

    const taskIds = [];

    for (const item of tasks) {
      if (typeof item === 'function') {
        taskIds.push(this.add(item));
      } else if (typeUtils.isObject(item)) {
        taskIds.push(this.add(item.task, item.options || {}));
      }
    }

    return taskIds;
  }

  /**
   * 处理队列中的任务
   * @private
   */
  processQueue() {
    // 如果队列未运行或没有任务，直接返回
    if (this.status !== QueueStatus.RUNNING || this.queue.length === 0) {
      return;
    }

    // 计算可处理的任务数量
    const availableSlots = this.options.concurrency - this.processingTasks.size;
    if (availableSlots <= 0) {
      return;
    }

    // 处理任务
    const tasksToProcess = Math.min(availableSlots, this.queue.length);
    for (let i = 0; i < tasksToProcess; i++) {
      const taskObject = this.queue.shift();
      this.processTask(taskObject);
    }
  }

  /**
   * 处理单个任务
   * @param {Object} taskObject - 任务对象
   * @private
   */
  async processTask(taskObject) {
    // 更新任务状态
    taskObject.startedAt = Date.now();
    taskObject.waitTime = taskObject.startedAt - taskObject.createdAt;
    
    // 添加到处理中的任务
    this.processingTasks.set(taskObject.id, taskObject);

    // 触发任务开始事件
    this.emit('task.started', taskObject);

    let timeoutId;
    let processPromise;

    try {
      // 增加尝试次数
      taskObject.attempts++;

      // 如果设置了超时，创建超时Promise
      if (taskObject.timeout) {
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error(`Task timed out after ${taskObject.timeout}ms`));
          }, taskObject.timeout);
        });

        // 使用Promise.race实现超时控制
        processPromise = Promise.race([
          Promise.resolve(taskObject.task(taskObject)),
          timeoutPromise
        ]);
      } else {
        // 正常执行任务
        processPromise = Promise.resolve(taskObject.task(taskObject));
      }

      // 执行任务
      const result = await processPromise;

      // 清除超时
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // 更新任务完成时间
      taskObject.completedAt = Date.now();
      taskObject.processTime = taskObject.completedAt - taskObject.startedAt;

      // 更新统计信息
      this.updateStats(taskObject, true);

      // 从处理中的任务移除
      this.processingTasks.delete(taskObject.id);

      // 触发任务完成事件
      this.emit('task.completed', taskObject, result);

    } catch (error) {
      // 清除超时
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // 更新任务状态
      taskObject.error = error;

      // 检查是否需要重试
      if (taskObject.attempts < taskObject.maxAttempts) {
        // 延迟重试
        await timerUtils.delay(taskObject.retryDelay);
        
        // 重新添加到队列
        this.queue.push(taskObject);
        
        // 触发任务重试事件
        this.emit('task.retry', taskObject, error, taskObject.attempts);
      } else {
        // 更新任务完成时间
        taskObject.completedAt = Date.now();
        taskObject.processTime = taskObject.completedAt - taskObject.startedAt;

        // 更新统计信息
        this.updateStats(taskObject, false);

        // 从处理中的任务移除
        this.processingTasks.delete(taskObject.id);

        // 触发任务失败事件
        this.emit('task.failed', taskObject, error);
      }
    } finally {
      // 继续处理队列
      this.processQueue();

      // 检查是否队列为空
      if (this.queue.length === 0 && this.processingTasks.size === 0) {
        this.emit('empty');
      }
    }
  }

  /**
   * 更新统计信息
   * @param {Object} taskObject - 任务对象
   * @param {boolean} succeeded - 是否成功
   * @private
   */
  updateStats(taskObject, succeeded) {
    this.stats.processed++;
    
    if (succeeded) {
      this.stats.succeeded++;
    } else {
      this.stats.failed++;
    }

    // 更新等待时间统计
    if (taskObject.waitTime !== null) {
      this.stats.totalWaitTime += taskObject.waitTime;
      this.stats.averageWaitTime = this.stats.totalWaitTime / this.stats.processed;
    }

    // 更新处理时间统计
    if (taskObject.processTime !== null) {
      this.stats.totalProcessTime += taskObject.processTime;
      this.stats.averageProcessTime = this.stats.totalProcessTime / this.stats.processed;
    }
  }

  /**
   * 启动队列
   * @returns {boolean} 是否启动成功
   */
  start() {
    if (this.status === QueueStatus.RUNNING) {
      return false;
    }

    this.status = QueueStatus.RUNNING;
    this.emit('started');

    // 开始处理队列
    this.processQueue();

    return true;
  }

  /**
   * 暂停队列
   * @returns {boolean} 是否暂停成功
   */
  pause() {
    if (this.status !== QueueStatus.RUNNING) {
      return false;
    }

    this.status = QueueStatus.PAUSED;
    this.emit('paused');

    return true;
  }

  /**
   * 恢复队列
   * @returns {boolean} 是否恢复成功
   */
  resume() {
    if (this.status !== QueueStatus.PAUSED) {
      return false;
    }

    this.status = QueueStatus.RUNNING;
    this.emit('resumed');

    // 继续处理队列
    this.processQueue();

    return true;
  }

  /**
   * 停止队列
   * @param {boolean} force - 是否强制停止
   * @returns {Promise<boolean>} 是否停止成功
   */
  async stop(force = false) {
    if (this.status === QueueStatus.STOPPED) {
      return false;
    }

    this.status = QueueStatus.STOPPED;
    this.emit('stopping');

    // 如果不是强制停止，等待当前任务处理完成
    if (!force && this.processingTasks.size > 0) {
      await this.waitForTasks();
    }

    this.emit('stopped');
    return true;
  }

  /**
   * 等待所有任务处理完成
   * @returns {Promise<void>}
   */
  async waitForTasks() {
    if (this.queue.length === 0 && this.processingTasks.size === 0) {
      return;
    }

    return new Promise(resolve => {
      const checkComplete = () => {
        if (this.queue.length === 0 && this.processingTasks.size === 0) {
          resolve();
        } else {
          // 短暂延迟后再次检查
          timerUtils.setTimeout(checkComplete, 100);
        }
      };

      checkComplete();
    });
  }

  /**
   * 清空队列
   * @param {boolean} clearProcessing - 是否同时清空正在处理的任务
   * @returns {number} 清空的任务数量
   */
  clear(clearProcessing = false) {
    const clearedCount = this.queue.length;
    this.queue = [];

    if (clearProcessing) {
      this.processingTasks.clear();
    }

    this.emit('cleared', clearedCount);
    return clearedCount;
  }

  /**
   * 获取队列长度
   * @returns {number} 队列中的任务数量
   */
  get length() {
    return this.queue.length;
  }

  /**
   * 获取正在处理的任务数量
   * @returns {number} 正在处理的任务数量
   */
  get processingCount() {
    return this.processingTasks.size;
  }

  /**
   * 获取总任务数量
   * @returns {number} 队列中的任务数量 + 正在处理的任务数量
   */
  get totalCount() {
    return this.queue.length + this.processingTasks.size;
  }

  /**
   * 检查队列是否为空
   * @returns {boolean} 是否为空
   */
  isEmpty() {
    return this.queue.length === 0 && this.processingTasks.size === 0;
  }

  /**
   * 检查队列是否正在运行
   * @returns {boolean} 是否正在运行
   */
  isRunning() {
    return this.status === QueueStatus.RUNNING;
  }

  /**
   * 检查队列是否已暂停
   * @returns {boolean} 是否已暂停
   */
  isPaused() {
    return this.status === QueueStatus.PAUSED;
  }

  /**
   * 检查队列是否已停止
   * @returns {boolean} 是否已停止
   */
  isStopped() {
    return this.status === QueueStatus.STOPPED;
  }

  /**
   * 获取队列状态
   * @returns {Object} 队列状态信息
   */
  getStatus() {
    return {
      status: this.status,
      length: this.queue.length,
      processingCount: this.processingTasks.size,
      stats: this.stats
    };
  }

  /**
   * 获取任务
   * @param {string} taskId - 任务ID
   * @returns {Object|null} 任务对象
   */
  getTask(taskId) {
    // 先检查正在处理的任务
    if (this.processingTasks.has(taskId)) {
      return this.processingTasks.get(taskId);
    }

    // 再检查队列中的任务
    return this.queue.find(task => task.id === taskId) || null;
  }

  /**
   * 移除任务
   * @param {string} taskId - 任务ID
   * @returns {boolean} 是否移除成功
   */
  removeTask(taskId) {
    // 检查队列中的任务
    const queueIndex = this.queue.findIndex(task => task.id === taskId);
    if (queueIndex !== -1) {
      this.queue.splice(queueIndex, 1);
      this.emit('task.removed', taskId);
      return true;
    }

    // 检查正在处理的任务（通常不应该移除正在处理的任务）
    if (this.processingTasks.has(taskId)) {
      this.processingTasks.delete(taskId);
      this.emit('task.removed', taskId);
      return true;
    }

    return false;
  }

  /**
   * 设置并发数
   * @param {number} concurrency - 并发数量
   * @returns {boolean} 是否设置成功
   */
  setConcurrency(concurrency) {
    if (typeof concurrency !== 'number' || concurrency < 1) {
      return false;
    }

    this.options.concurrency = concurrency;
    
    // 如果队列正在运行，立即处理队列
    if (this.status === QueueStatus.RUNNING) {
      this.processQueue();
    }

    return true;
  }

  /**
   * 设置优先级模式
   * @param {boolean} enabled - 是否启用
   * @returns {boolean} 是否设置成功
   */
  setPriorityMode(enabled) {
    this.options.priorityMode = !!enabled;
    
    // 如果启用了优先级模式，重新排序队列
    if (this.options.priorityMode && this.queue.length > 0) {
      this.queue.sort((a, b) => b.priority - a.priority);
    }

    return true;
  }

  /**
   * 设置最大队列大小
   * @param {number|null} maxSize - 最大队列大小，null表示无限制
   * @returns {boolean} 是否设置成功
   */
  setMaxSize(maxSize) {
    if (maxSize !== null && (typeof maxSize !== 'number' || maxSize < 1)) {
      return false;
    }

    this.options.maxSize = maxSize;
    return true;
  }

  /**
   * 重置统计信息
   */
  resetStats() {
    this.stats = {
      processed: 0,
      failed: 0,
      succeeded: 0,
      totalWaitTime: 0,
      totalProcessTime: 0,
      averageWaitTime: 0,
      averageProcessTime: 0
    };
  }

  /**
   * 创建批处理队列
   * @param {Function} processor - 批处理函数
   * @param {Object} options - 批处理选项
   * @returns {QueueUtils} 批处理队列实例
   */
  static createBatchQueue(processor, options = {}) {
    const { batchSize = 10, batchDelay = 1000 } = options;
    const batchQueue = new QueueUtils({
      concurrency: 1,
      autoStart: true,
      ...options
    });

    let batch = [];
    let timeoutId = null;

    const flushBatch = async () => {
      if (batch.length === 0) {
        return;
      }

      const currentBatch = [...batch];
      batch = [];

      try {
        await processor(currentBatch);
      } catch (error) {
        logger.error('批处理失败', { error: error.message, batchSize: currentBatch.length });
        batchQueue.emit('batch.failed', currentBatch, error);
      } finally {
        batchQueue.emit('batch.completed', currentBatch);
      }
    };

    const scheduleFlush = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(flushBatch, batchDelay);
    };

    // 添加任务到批处理队列
    const addToBatch = (task) => {
      batch.push(task);
      
      // 如果达到批次大小，立即刷新
      if (batch.length >= batchSize) {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        flushBatch();
      } else {
        // 否则安排延迟刷新
        scheduleFlush();
      }
    };

    // 重写add方法
    batchQueue.add = (task) => {
      addToBatch(task);
      return `batch-task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    };

    return batchQueue;
  }

  /**
   * 创建优先级队列
   * @param {Object} options - 队列选项
   * @returns {QueueUtils} 优先级队列实例
   */
  static createPriorityQueue(options = {}) {
    return new QueueUtils({
      priorityMode: true,
      ...options
    });
  }

  /**
   * 创建限流队列
   * @param {Object} options - 限流选项
   * @returns {QueueUtils} 限流队列实例
   */
  static createRateLimitedQueue(options = {}) {
    const { rateLimit = 10, timeWindow = 1000 } = options;
    let tokens = rateLimit;
    let lastRefillTime = Date.now();

    // 创建队列
    const queue = new QueueUtils({
      concurrency: 1,
      ...options
    });

    // 令牌桶算法实现限流
    const refillTokens = () => {
      const now = Date.now();
      const elapsed = now - lastRefillTime;
      
      if (elapsed > timeWindow) {
        // 计算可以添加的令牌数量
        const newTokens = Math.floor((elapsed / timeWindow) * rateLimit);
        tokens = Math.min(tokens + newTokens, rateLimit);
        lastRefillTime = now;
      }
    };

    // 包装原始的processQueue方法
    const originalProcessQueue = queue.processQueue;
    queue.processQueue = function() {
      refillTokens();
      
      if (tokens > 0 && this.status === QueueStatus.RUNNING) {
        tokens--;
        originalProcessQueue.call(this);
      } else {
        // 没有令牌，稍后再试
        timerUtils.setTimeout(() => {
          this.processQueue();
        }, 100);
      }
    };

    return queue;
  }

  /**
   * 静态实例
   * @private
   */
  static _instance = null;

  /**
   * 获取单例实例
   * @returns {QueueUtils} 队列工具实例
   */
  static getInstance() {
    if (!QueueUtils._instance) {
      QueueUtils._instance = new QueueUtils();
    }
    return QueueUtils._instance;
  }

  /**
   * 创建新的队列工具实例
   * @returns {QueueUtils} 队列工具实例
   */
  static create() {
    return new QueueUtils();
  }
}

// 导出常量
module.exports.QueueStatus = QueueStatus;
module.exports.TaskPriority = TaskPriority;

// 创建默认实例
const defaultQueueUtils = QueueUtils.getInstance();

module.exports = {
  QueueUtils,
  queueUtils: defaultQueueUtils
};