/**
 * 缓存策略管理器
 * 提供缓存过期策略、条件缓存和缓存预热功能
 */

const logger = require('../utils/logger');
const { AppError } = require('../exception/handlers/errorHandler');

/**
 * 缓存过期策略枚举
 */
const ExpirationPolicy = {
  // 基于时间的过期策略
  TIME_BASED: 'TIME_BASED',
  // 基于滑动窗口的过期策略
  SLIDING_WINDOW: 'SLIDING_WINDOW',
  // 基于使用次数的过期策略
  USAGE_COUNT: 'USAGE_COUNT',
  // 基于优先级的过期策略
  PRIORITY_BASED: 'PRIORITY_BASED',
  // 永不过期策略
  NEVER_EXPIRE: 'NEVER_EXPIRE'
};

/**
 * 缓存项元数据
 */
class CacheItemMetadata {
  constructor(options = {}) {
    this.key = options.key;
    this.createdAt = new Date();
    this.lastAccessedAt = new Date();
    this.accessCount = 0;
    this.expirationTime = options.expirationTime;
    this.expirationPolicy = options.expirationPolicy || ExpirationPolicy.TIME_BASED;
    this.priority = options.priority || 0; // 0-10，10为最高优先级
    this.maxUses = options.maxUses;
    this.tags = options.tags || [];
    this.metadata = options.metadata || {};
  }

  /**
   * 更新访问信息
   */
  updateAccess() {
    this.lastAccessedAt = new Date();
    this.accessCount += 1;
  }

  /**
   * 检查是否过期
   * @returns {boolean} 是否过期
   */
  isExpired() {
    const now = new Date();

    switch (this.expirationPolicy) {
      case ExpirationPolicy.TIME_BASED:
        return this.expirationTime && now > this.expirationTime;

      case ExpirationPolicy.SLIDING_WINDOW:
        return this.expirationTime && now > this.expirationTime;

      case ExpirationPolicy.USAGE_COUNT:
        return this.maxUses && this.accessCount >= this.maxUses;

      case ExpirationPolicy.PRIORITY_BASED:
        // 优先级策略需要在外部根据优先级和缓存压力决定
        return false;

      case ExpirationPolicy.NEVER_EXPIRE:
      default:
        return false;
    }
  }

  /**
   * 重置滑动窗口
   * @param {number} ttlMs - 新的TTL毫秒数
   */
  resetSlidingWindow(ttlMs) {
    if (this.expirationPolicy === ExpirationPolicy.SLIDING_WINDOW) {
      this.expirationTime = new Date(Date.now() + ttlMs);
    }
  }

  /**
   * 转换为JSON
   * @returns {Object} JSON对象
   */
  toJSON() {
    return {
      key: this.key,
      createdAt: this.createdAt.toISOString(),
      lastAccessedAt: this.lastAccessedAt.toISOString(),
      accessCount: this.accessCount,
      expirationTime: this.expirationTime?.toISOString(),
      expirationPolicy: this.expirationPolicy,
      priority: this.priority,
      maxUses: this.maxUses,
      tags: this.tags,
      metadata: this.metadata
    };
  }
}

/**
 * 缓存策略管理器
 */
class CacheStrategy {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   */
  constructor(options = {}) {
    this.options = {
      defaultTtl: 3600000, // 默认1小时
      defaultPolicy: ExpirationPolicy.TIME_BASED,
      cleanupInterval: 60000, // 1分钟清理一次过期缓存
      maxItems: 1000, // 最大缓存项数量
      ...options
    };

    // 缓存元数据存储
    this.metadataStore = new Map();

    // 启动清理任务
    this._startCleanupTask();

    logger.info('缓存策略管理器初始化完成', { options: this.options });
  }

  /**
   * 创建缓存项元数据
   * @param {string} key - 缓存键
   * @param {Object} options - 缓存选项
   * @returns {CacheItemMetadata} 缓存项元数据
   */
  createMetadata(key, options = {}) {
    const ttlMs = options.ttl ?? this.options.defaultTtl;
    const expirationPolicy = options.policy ?? this.options.defaultPolicy;
    
    let expirationTime = null;
    if (expirationPolicy === ExpirationPolicy.TIME_BASED || 
        expirationPolicy === ExpirationPolicy.SLIDING_WINDOW) {
      expirationTime = new Date(Date.now() + ttlMs);
    }

    const metadata = new CacheItemMetadata({
      key,
      expirationTime,
      expirationPolicy,
      priority: options.priority,
      maxUses: options.maxUses,
      tags: options.tags,
      metadata: options.metadata
    });

    // 存储元数据
    this.metadataStore.set(key, metadata);

    // 检查缓存项数量限制
    this._enforceSizeLimit();

    return metadata;
  }

  /**
   * 更新缓存项访问
   * @param {string} key - 缓存键
   * @returns {boolean} 更新是否成功
   */
  updateAccess(key) {
    const metadata = this.metadataStore.get(key);
    if (!metadata) {
      return false;
    }

    // 更新访问信息
    metadata.updateAccess();

    // 对于滑动窗口策略，重置过期时间
    if (metadata.expirationPolicy === ExpirationPolicy.SLIDING_WINDOW) {
      const ttlMs = this.options.defaultTtl;
      metadata.resetSlidingWindow(ttlMs);
    }

    return true;
  }

  /**
   * 获取缓存项元数据
   * @param {string} key - 缓存键
   * @returns {CacheItemMetadata|null} 缓存项元数据或null
   */
  getMetadata(key) {
    return this.metadataStore.get(key) || null;
  }

  /**
   * 检查缓存项是否过期
   * @param {string} key - 缓存键
   * @returns {boolean} 是否过期
   */
  isExpired(key) {
    const metadata = this.metadataStore.get(key);
    return metadata ? metadata.isExpired() : false;
  }

  /**
   * 删除缓存项元数据
   * @param {string} key - 缓存键
   * @returns {boolean} 删除是否成功
   */
  removeMetadata(key) {
    return this.metadataStore.delete(key);
  }

  /**
   * 批量删除带有特定标签的缓存项
   * @param {string|Array<string>} tags - 标签或标签数组
   * @returns {Array<string>} 删除的缓存键列表
   */
  removeByTags(tags) {
    const tagsToRemove = Array.isArray(tags) ? tags : [tags];
    const removedKeys = [];

    for (const [key, metadata] of this.metadataStore.entries()) {
      if (metadata.tags.some(tag => tagsToRemove.includes(tag))) {
        this.metadataStore.delete(key);
        removedKeys.push(key);
      }
    }

    return removedKeys;
  }

  /**
   * 获取所有缓存键
   * @returns {Array<string>} 缓存键数组
   */
  getAllKeys() {
    return Array.from(this.metadataStore.keys());
  }

  /**
   * 获取缓存统计信息
   * @returns {Object} 缓存统计信息
   */
  getStats() {
    const now = new Date();
    const stats = {
      totalItems: this.metadataStore.size,
      expiredItems: 0,
      policyDistribution: {},
      priorityDistribution: {},
      averageAge: 0,
      averageAccessCount: 0
    };

    let totalAge = 0;
    let totalAccessCount = 0;

    for (const metadata of this.metadataStore.values()) {
      // 统计过期项
      if (metadata.isExpired()) {
        stats.expiredItems++;
      }

      // 统计策略分布
      stats.policyDistribution[metadata.expirationPolicy] = 
        (stats.policyDistribution[metadata.expirationPolicy] || 0) + 1;

      // 统计优先级分布
      stats.priorityDistribution[metadata.priority] = 
        (stats.priorityDistribution[metadata.priority] || 0) + 1;

      // 计算总年龄
      totalAge += now - metadata.createdAt;
      
      // 计算总访问次数
      totalAccessCount += metadata.accessCount;
    }

    // 计算平均值
    if (stats.totalItems > 0) {
      stats.averageAge = Math.floor(totalAge / stats.totalItems);
      stats.averageAccessCount = totalAccessCount / stats.totalItems;
    }

    return stats;
  }

  /**
   * 清理过期缓存
   * @returns {number} 清理的缓存项数量
   */
  cleanupExpired() {
    let removedCount = 0;

    for (const [key, metadata] of this.metadataStore.entries()) {
      if (metadata.isExpired()) {
        this.metadataStore.delete(key);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      logger.debug(`清理了${removedCount}个过期缓存项`);
    }

    return removedCount;
  }

  /**
   * 清理所有缓存
   */
  clear() {
    const size = this.metadataStore.size;
    this.metadataStore.clear();
    logger.info(`缓存已清空，共${size}个缓存项`);
  }

  /**
   * 根据条件缓存策略检查是否应该缓存
   * @param {any} data - 要缓存的数据
   * @param {Function} condition - 条件函数
   * @returns {boolean} 是否应该缓存
   */
  shouldCache(data, condition = null) {
    if (condition && typeof condition === 'function') {
      return condition(data);
    }

    // 默认缓存策略：缓存非null、非undefined的数据
    return data !== null && data !== undefined;
  }

  /**
   * 基于优先级的缓存驱逐
   * @param {number} count - 要驱逐的缓存项数量
   */
  evictByPriority(count) {
    // 将缓存项按优先级和最后访问时间排序
    const items = Array.from(this.metadataStore.entries())
      .sort(([, a], [, b]) => {
        // 先按优先级排序（优先级低的先被驱逐）
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }
        // 优先级相同则按最后访问时间排序（最久未使用的先被驱逐）
        return a.lastAccessedAt - b.lastAccessedAt;
      });

    // 驱逐指定数量的缓存项
    const toEvict = items.slice(0, count);
    for (const [key] of toEvict) {
      this.metadataStore.delete(key);
    }

    if (toEvict.length > 0) {
      logger.debug(`基于优先级驱逐了${toEvict.length}个缓存项`);
    }

    return toEvict.map(([key]) => key);
  }

  /**
   * 执行缓存预热
   * @param {Array<Object>} items - 预热项数组
   * @returns {Promise<number>} 预热的缓存项数量
   */
  async prewarm(items = []) {
    let prewarmedCount = 0;

    for (const item of items) {
      try {
        const { key, dataFn, options = {} } = item;
        
        // 执行数据获取函数
        const data = typeof dataFn === 'function' ? await dataFn() : dataFn;
        
        // 检查是否应该缓存
        if (this.shouldCache(data)) {
          // 创建元数据（实际缓存操作由缓存管理器处理）
          this.createMetadata(key, options);
          prewarmedCount++;
        }
      } catch (error) {
        logger.error(`缓存预热失败: ${item.key}`, { error: error.message });
      }
    }

    logger.info(`缓存预热完成，共预热${prewarmedCount}个缓存项`);
    return prewarmedCount;
  }

  /**
   * 启动定期清理任务
   * @private
   */
  _startCleanupTask() {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpired();
    }, this.options.cleanupInterval);

    // 确保进程退出时清除定时器
    process.on('exit', () => {
      if (this.cleanupTimer) {
        clearInterval(this.cleanupTimer);
      }
    });
  }

  /**
   * 强制实施缓存大小限制
   * @private
   */
  _enforceSizeLimit() {
    if (this.metadataStore.size > this.options.maxItems) {
      const excessCount = this.metadataStore.size - this.options.maxItems;
      this.evictByPriority(excessCount);
    }
  }

  /**
   * 获取缓存策略管理器实例（单例）
   * @param {Object} options - 配置选项
   * @returns {CacheStrategy} 缓存策略管理器实例
   */
  static getInstance(options = {}) {
    if (!CacheStrategy._instance) {
      CacheStrategy._instance = new CacheStrategy(options);
    }
    return CacheStrategy._instance;
  }
}

module.exports = {
  CacheStrategy,
  ExpirationPolicy,
  CacheItemMetadata
};