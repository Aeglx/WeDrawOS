/**
 * 缓存监控器
 * 提供缓存使用情况监控和性能统计功能
 */

const logger = require('../utils/logger');
const { EventBus } = require('../events/EventBus');
const { TimerUtils } = require('../utils/timer/TimerUtils');

/**
 * 缓存事件类型
 */
const CacheEvent = {
  // 缓存操作事件
  GET: 'cache.get',
  SET: 'cache.set',
  DELETE: 'cache.delete',
  CLEAR: 'cache.clear',
  
  // 缓存状态事件
  HIT: 'cache.hit',
  MISS: 'cache.miss',
  EXPIRE: 'cache.expire',
  EVICT: 'cache.evict',
  ERROR: 'cache.error',
  
  // 统计事件
  STATS_UPDATE: 'cache.stats.update'
};

/**
 * 缓存监控数据
 */
class CacheMetrics {
  constructor() {
    this.reset();
  }

  /**
   * 重置统计数据
   */
  reset() {
    this.operations = {
      get: 0,
      set: 0,
      delete: 0,
      clear: 0
    };

    this.hits = 0;
    this.misses = 0;
    this.expirations = 0;
    this.evictions = 0;
    this.errors = 0;

    this.latency = {
      get: { total: 0, count: 0, avg: 0, min: Infinity, max: 0 },
      set: { total: 0, count: 0, avg: 0, min: Infinity, max: 0 },
      delete: { total: 0, count: 0, avg: 0, min: Infinity, max: 0 },
      clear: { total: 0, count: 0, avg: 0, min: Infinity, max: 0 }
    };

    this.size = 0;
    this.memoryUsage = 0;
    this.lastReset = new Date();
  }

  /**
   * 记录操作
   * @param {string} operation - 操作类型
   * @param {number} latency - 延迟时间（毫秒）
   * @param {boolean} hit - 是否命中（仅适用于get操作）
   */
  recordOperation(operation, latency = 0, hit = null) {
    // 更新操作计数
    if (this.operations.hasOwnProperty(operation)) {
      this.operations[operation]++;
    }

    // 更新延迟统计
    if (this.latency.hasOwnProperty(operation)) {
      const lat = this.latency[operation];
      lat.total += latency;
      lat.count++;
      lat.avg = Math.round(lat.total / lat.count);
      lat.min = Math.min(lat.min, latency);
      lat.max = Math.max(lat.max, latency);
    }

    // 更新命中/未命中统计
    if (operation === 'get') {
      if (hit === true) {
        this.hits++;
      } else if (hit === false) {
        this.misses++;
      }
    }
  }

  /**
   * 记录过期
   * @param {number} count - 过期数量
   */
  recordExpirations(count = 1) {
    this.expirations += count;
  }

  /**
   * 记录驱逐
   * @param {number} count - 驱逐数量
   */
  recordEvictions(count = 1) {
    this.evictions += count;
  }

  /**
   * 记录错误
   */
  recordError() {
    this.errors++;
  }

  /**
   * 更新大小
   * @param {number} size - 缓存项数量
   */
  updateSize(size) {
    this.size = size;
  }

  /**
   * 更新内存使用
   * @param {number} memoryUsage - 内存使用量（字节）
   */
  updateMemoryUsage(memoryUsage) {
    this.memoryUsage = memoryUsage;
  }

  /**
   * 获取命中率
   * @returns {number} 命中率百分比
   */
  getHitRate() {
    const totalGets = this.hits + this.misses;
    return totalGets > 0 ? Math.round((this.hits / totalGets) * 100) : 0;
  }

  /**
   * 获取总体延迟统计
   * @returns {Object} 总体延迟统计
   */
  getOverallLatency() {
    const totalLatency = Object.values(this.latency).reduce((sum, l) => sum + l.total, 0);
    const totalCount = Object.values(this.latency).reduce((sum, l) => sum + l.count, 0);
    
    return {
      total: totalLatency,
      count: totalCount,
      avg: totalCount > 0 ? Math.round(totalLatency / totalCount) : 0
    };
  }

  /**
   * 获取指标快照
   * @returns {Object} 指标快照
   */
  getSnapshot() {
    return {
      operations: { ...this.operations },
      hits: this.hits,
      misses: this.misses,
      expirations: this.expirations,
      evictions: this.evictions,
      errors: this.errors,
      hitRate: this.getHitRate(),
      latency: JSON.parse(JSON.stringify(this.latency)),
      overallLatency: this.getOverallLatency(),
      size: this.size,
      memoryUsage: this.memoryUsage,
      uptime: Date.now() - this.lastReset.getTime(),
      lastReset: this.lastReset.toISOString()
    };
  }
}

/**
 * 缓存监控器
 */
class CacheMonitor {
  /**
   * 构造函数
   * @param {Object} cacheManager - 缓存管理器实例
   * @param {Object} options - 配置选项
   */
  constructor(cacheManager, options = {}) {
    this.cacheManager = cacheManager;
    this.options = {
      enabled: true,
      collectLatency: true,
      collectMemory: true,
      statsInterval: 60000, // 每分钟更新一次统计
      logLevel: 'debug',
      eventBus: null,
      ...options
    };

    this.metrics = new CacheMetrics();
    this.eventBus = this.options.eventBus || EventBus.getInstance();
    this.timerUtils = TimerUtils.getInstance();
    this.watchTimers = new Map();

    // 初始化监控
    this._initializeMonitoring();
    
    logger.info('缓存监控器初始化完成', { options: this.options });
  }

  /**
   * 初始化监控
   * @private
   */
  _initializeMonitoring() {
    // 注册事件监听器
    this._registerEventListeners();

    // 启动统计更新任务
    if (this.options.statsInterval > 0) {
      this._startStatsUpdateTask();
    }

    // 启动内存监控（如果启用）
    if (this.options.collectMemory) {
      this._startMemoryMonitoring();
    }
  }

  /**
   * 注册事件监听器
   * @private
   */
  _registerEventListeners() {
    if (!this.eventBus) return;

    // 监听缓存操作事件
    this.eventBus.on(CacheEvent.GET, this._handleGetEvent.bind(this));
    this.eventBus.on(CacheEvent.SET, this._handleSetEvent.bind(this));
    this.eventBus.on(CacheEvent.DELETE, this._handleDeleteEvent.bind(this));
    this.eventBus.on(CacheEvent.CLEAR, this._handleClearEvent.bind(this));
    this.eventBus.on(CacheEvent.ERROR, this._handleErrorEvent.bind(this));
  }

  /**
   * 处理获取事件
   * @private
   * @param {Object} event - 事件数据
   */
  _handleGetEvent(event) {
    const { key, found, latency } = event;
    this.metrics.recordOperation('get', latency, found);
    
    if (found) {
      this._logEvent(CacheEvent.HIT, { key, latency });
    } else {
      this._logEvent(CacheEvent.MISS, { key, latency });
    }
  }

  /**
   * 处理设置事件
   * @private
   * @param {Object} event - 事件数据
   */
  _handleSetEvent(event) {
    const { key, ttl, latency, size } = event;
    this.metrics.recordOperation('set', latency);
    
    if (size !== undefined) {
      this.metrics.updateSize(size);
    }
    
    this._logEvent(CacheEvent.SET, { key, ttl, latency });
  }

  /**
   * 处理删除事件
   * @private
   * @param {Object} event - 事件数据
   */
  _handleDeleteEvent(event) {
    const { key, deleted, latency, size } = event;
    this.metrics.recordOperation('delete', latency);
    
    if (size !== undefined) {
      this.metrics.updateSize(size);
    }
    
    this._logEvent(CacheEvent.DELETE, { key, deleted, latency });
  }

  /**
   * 处理清除事件
   * @private
   * @param {Object} event - 事件数据
   */
  _handleClearEvent(event) {
    const { count, latency, size } = event;
    this.metrics.recordOperation('clear', latency);
    
    if (size !== undefined) {
      this.metrics.updateSize(size);
    }
    
    this._logEvent(CacheEvent.CLEAR, { count, latency });
  }

  /**
   * 处理错误事件
   * @private
   * @param {Object} event - 事件数据
   */
  _handleErrorEvent(event) {
    const { operation, key, error } = event;
    this.metrics.recordError();
    
    this._logEvent(CacheEvent.ERROR, { operation, key, error: error.message }, 'error');
  }

  /**
   * 记录事件日志
   * @private
   * @param {string} event - 事件类型
   * @param {Object} data - 事件数据
   * @param {string} level - 日志级别
   */
  _logEvent(event, data, level = this.options.logLevel) {
    if (!this.options.enabled) return;
    
    logger[level](`缓存事件: ${event}`, data);
  }

  /**
   * 启动统计更新任务
   * @private
   */
  _startStatsUpdateTask() {
    this.statsTimer = this.timerUtils.setInterval(() => {
      this._updateStats();
    }, this.options.statsInterval);
  }

  /**
   * 启动内存监控
   * @private
   */
  _startMemoryMonitoring() {
    // 在Node.js环境中监控内存使用
    if (typeof process !== 'undefined' && process.memoryUsage) {
      this.memoryTimer = this.timerUtils.setInterval(() => {
        const memoryUsage = process.memoryUsage();
        this.metrics.updateMemoryUsage(memoryUsage.rss);
      }, 5000); // 每5秒更新一次
    }
  }

  /**
   * 更新统计信息
   * @private
   */
  _updateStats() {
    if (!this.options.enabled) return;

    try {
      // 获取并发布统计信息
      const stats = this.getStats();
      
      // 发布统计更新事件
      this.eventBus.emit(CacheEvent.STATS_UPDATE, stats);
      
      // 记录统计日志
      logger.info('缓存统计更新', {
        hitRate: `${stats.hitRate}%`,
        operations: stats.operations,
        size: stats.size,
        memoryUsage: this._formatMemory(stats.memoryUsage),
        avgLatency: `${stats.overallLatency.avg}ms`
      });
    } catch (error) {
      logger.error('更新缓存统计失败', { error: error.message });
    }
  }

  /**
   * 获取缓存统计信息
   * @returns {Object} 缓存统计信息
   */
  getStats() {
    const snapshot = this.metrics.getSnapshot();
    
    // 尝试从缓存管理器获取实时大小
    if (this.cacheManager && typeof this.cacheManager.getSize === 'function') {
      try {
        snapshot.size = this.cacheManager.getSize();
        this.metrics.updateSize(snapshot.size);
      } catch (error) {
        logger.error('获取缓存大小失败', { error: error.message });
      }
    }
    
    return snapshot;
  }

  /**
   * 开始监控特定键
   * @param {string} key - 缓存键
   * @param {number} interval - 监控间隔（毫秒）
   * @returns {string} 监控ID
   */
  watchKey(key, interval = 10000) {
    const watchId = `watch_${key}_${Date.now()}`;
    
    const timer = this.timerUtils.setInterval(async () => {
      try {
        const exists = await this.cacheManager.has(key);
        const stats = {
          key,
          exists,
          timestamp: new Date().toISOString()
        };
        
        if (exists && typeof this.cacheManager.getMetadata === 'function') {
          try {
            stats.metadata = await this.cacheManager.getMetadata(key);
          } catch (e) {
            // 忽略元数据获取错误
          }
        }
        
        this.eventBus.emit(`cache.watch.${key}`, stats);
      } catch (error) {
        logger.error(`监控缓存键失败: ${key}`, { error: error.message });
      }
    }, interval);
    
    this.watchTimers.set(watchId, timer);
    return watchId;
  }

  /**
   * 停止监控
   * @param {string} watchId - 监控ID
   * @returns {boolean} 停止是否成功
   */
  unwatchKey(watchId) {
    const timer = this.watchTimers.get(watchId);
    if (timer) {
      this.timerUtils.clearInterval(timer);
      this.watchTimers.delete(watchId);
      return true;
    }
    return false;
  }

  /**
   * 生成性能报告
   * @returns {Object} 性能报告
   */
  generatePerformanceReport() {
    const stats = this.getStats();
    
    return {
      summary: {
        hitRate: `${stats.hitRate}%`,
        operations: stats.operations,
        uptime: this._formatTime(stats.uptime),
        size: stats.size,
        memoryUsage: this._formatMemory(stats.memoryUsage)
      },
      latency: {
        get: `${stats.latency.get.avg}ms (min: ${stats.latency.get.min}ms, max: ${stats.latency.get.max}ms)`,
        set: `${stats.latency.set.avg}ms (min: ${stats.latency.set.min}ms, max: ${stats.latency.set.max}ms)`,
        delete: `${stats.latency.delete.avg}ms (min: ${stats.latency.delete.min}ms, max: ${stats.latency.delete.max}ms)`,
        overall: `${stats.overallLatency.avg}ms`
      },
      errors: {
        total: stats.errors,
        rate: stats.operations.get + stats.operations.set + stats.operations.delete > 0 
          ? `${Math.round((stats.errors / (stats.operations.get + stats.operations.set + stats.operations.delete)) * 1000)} errors/1000 ops`
          : 'N/A'
      }
    };
  }

  /**
   * 重置统计数据
   */
  resetStats() {
    this.metrics.reset();
    logger.info('缓存统计数据已重置');
  }

  /**
   * 启用/禁用监控
   * @param {boolean} enabled - 是否启用
   */
  setEnabled(enabled) {
    this.options.enabled = enabled;
    logger.info(`缓存监控已${enabled ? '启用' : '禁用'}`);
  }

  /**
   * 格式化内存大小
   * @private
   * @param {number} bytes - 字节数
   * @returns {string} 格式化后的内存大小
   */
  _formatMemory(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(2)} MB`;
    return `${(bytes / 1073741824).toFixed(2)} GB`;
  }

  /**
   * 格式化时间
   * @private
   * @param {number} ms - 毫秒数
   * @returns {string} 格式化后的时间
   */
  _formatTime(ms) {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(2)}m`;
    return `${(ms / 3600000).toFixed(2)}h`;
  }

  /**
   * 监控缓存键的访问模式
   * @param {string} key - 缓存键
   * @param {number} duration - 监控持续时间（毫秒）
   * @returns {Promise<Object>} 访问模式分析
   */
  async analyzeAccessPattern(key, duration = 60000) {
    const startTime = Date.now();
    const accessLog = [];
    
    const handler = (event) => {
      if (event.key === key) {
        accessLog.push({
          type: event.found ? 'hit' : 'miss',
          time: Date.now() - startTime,
          latency: event.latency
        });
      }
    };
    
    // 注册事件处理器
    this.eventBus.on(CacheEvent.GET, handler);
    
    // 等待监控完成
    await this.timerUtils.sleep(duration);
    
    // 移除事件处理器
    this.eventBus.off(CacheEvent.GET, handler);
    
    // 分析访问模式
    const hits = accessLog.filter(log => log.type === 'hit').length;
    const total = accessLog.length;
    
    return {
      key,
      duration,
      totalAccesses: total,
      hits,
      hitRate: total > 0 ? Math.round((hits / total) * 100) : 0,
      accessLog,
      averageInterval: total > 1 ? Math.round(duration / total) : null
    };
  }

  /**
   * 销毁监控器
   */
  destroy() {
    // 清除定时器
    if (this.statsTimer) {
      this.timerUtils.clearInterval(this.statsTimer);
    }
    
    if (this.memoryTimer) {
      this.timerUtils.clearInterval(this.memoryTimer);
    }
    
    // 清除所有监控定时器
    for (const timer of this.watchTimers.values()) {
      this.timerUtils.clearInterval(timer);
    }
    this.watchTimers.clear();
    
    // 移除事件监听器
    if (this.eventBus) {
      this.eventBus.off(CacheEvent.GET);
      this.eventBus.off(CacheEvent.SET);
      this.eventBus.off(CacheEvent.DELETE);
      this.eventBus.off(CacheEvent.CLEAR);
      this.eventBus.off(CacheEvent.ERROR);
    }
    
    logger.info('缓存监控器已销毁');
  }

  /**
   * 获取缓存事件类型
   * @returns {Object} 缓存事件类型枚举
   */
  static getEvents() {
    return { ...CacheEvent };
  }
}

module.exports = {
  CacheMonitor,
  CacheEvent,
  CacheMetrics
};