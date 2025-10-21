/**
 * 分布式锁管理器
 * 提供分布式系统中的并发控制功能
 */

const crypto = require('crypto');
const logger = require('../utils/logger');
const { AppError } = require('../exception/handlers/errorHandler');
const { TimerUtils } = require('../utils/timer/TimerUtils');

/**
 * 分布式锁管理器
 */
class DistributedLock {
  /**
   * 构造函数
   * @param {Object} cacheClient - 缓存客户端实例
   * @param {Object} options - 配置选项
   */
  constructor(cacheClient, options = {}) {
    this.cacheClient = cacheClient;
    
    this.options = {
      defaultTtl: 30000, // 默认锁超时时间 30秒
      autoRenewal: true, // 自动续期
      renewalInterval: 10000, // 续期间隔 10秒
      retryCount: 3, // 重试次数
      retryDelay: 1000, // 重试延迟 1秒
      ...options
    };

    // 存储活动锁信息
    this.activeLocks = new Map();
    // 存储续期定时器
    this.renewalTimers = new Map();

    logger.info('分布式锁管理器初始化完成');
  }

  /**
   * 生成唯一锁标识
   * @private
   * @returns {string} 唯一标识
   */
  _generateLockId() {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * 生成锁键
   * @private
   * @param {string} resource - 资源名称
   * @returns {string} 锁键
   */
  _generateLockKey(resource) {
    return `distributed_lock:${resource}`;
  }

  /**
   * 获取锁
   * @param {string} resource - 资源名称
   * @param {Object} options - 锁选项
   * @returns {Promise<string|null>} 锁ID或null
   */
  async acquire(resource, options = {}) {
    const {
      ttl = this.options.defaultTtl,
      wait = false,
      waitTimeout = null
    } = options;

    const lockKey = this._generateLockKey(resource);
    const lockId = this._generateLockId();
    
    logger.debug(`尝试获取锁: ${resource}`, { lockKey, ttl });

    try {
      if (wait) {
        // 等待锁可用
        return await this._waitForLock(lockKey, lockId, ttl, waitTimeout);
      } else {
        // 立即尝试获取锁
        const acquired = await this._tryAcquireLock(lockKey, lockId, ttl);
        
        if (acquired) {
          this._registerLock(resource, lockKey, lockId, ttl);
          logger.debug(`成功获取锁: ${resource}`);
          return lockId;
        }
        
        logger.debug(`获取锁失败: ${resource} (已被占用)`);
        return null;
      }
    } catch (error) {
      logger.error(`获取锁异常: ${resource}`, { error });
      throw new AppError('获取分布式锁失败', 500, error);
    }
  }

  /**
   * 尝试获取锁
   * @private
   * @param {string} lockKey - 锁键
   * @param {string} lockId - 锁ID
   * @param {number} ttl - 过期时间
   * @returns {Promise<boolean>} 是否获取成功
   */
  async _tryAcquireLock(lockKey, lockId, ttl) {
    try {
      // 使用SETNX命令的等效操作（如果不存在则设置）
      const result = await this.cacheClient.set(lockKey, lockId, {
        nx: true, // 仅当键不存在时设置
        ex: Math.floor(ttl / 1000) // 过期时间（秒）
      });
      
      return result === 'OK' || result === true;
    } catch (error) {
      // 如果缓存客户端不支持nx选项，使用其他方式实现
      try {
        // 检查锁是否已存在
        const existingLock = await this.cacheClient.get(lockKey);
        
        if (existingLock === null) {
          // 锁不存在，尝试设置
          await this.cacheClient.set(lockKey, lockId, Math.floor(ttl / 1000));
          return true;
        }
        
        return false;
      } catch (fallbackError) {
        throw fallbackError;
      }
    }
  }

  /**
   * 等待获取锁
   * @private
   * @param {string} lockKey - 锁键
   * @param {string} lockId - 锁ID
   * @param {number} ttl - 过期时间
   * @param {number|null} waitTimeout - 等待超时时间
   * @returns {Promise<string|null>} 锁ID或null
   */
  async _waitForLock(lockKey, lockId, ttl, waitTimeout) {
    const startTime = Date.now();
    const retryDelay = this.options.retryDelay;
    
    while (true) {
      // 尝试获取锁
      const acquired = await this._tryAcquireLock(lockKey, lockId, ttl);
      
      if (acquired) {
        this._registerLock(lockKey, lockId, ttl);
        logger.debug(`成功获取锁: ${lockKey}`);
        return lockId;
      }
      
      // 检查是否超过等待时间
      if (waitTimeout && (Date.now() - startTime) > waitTimeout) {
        logger.debug(`获取锁超时: ${lockKey}`);
        return null;
      }
      
      // 等待一段时间后重试
      await TimerUtils.sleep(retryDelay);
    }
  }

  /**
   * 注册锁
   * @private
   * @param {string} resource - 资源名称
   * @param {string} lockKey - 锁键
   * @param {string} lockId - 锁ID
   * @param {number} ttl - 过期时间
   */
  _registerLock(resource, lockKey, lockId, ttl) {
    // 存储锁信息
    this.activeLocks.set(lockKey, {
      resource,
      lockKey,
      lockId,
      ttl,
      acquiredAt: Date.now()
    });

    // 设置自动续期（如果启用）
    if (this.options.autoRenewal) {
      this._setupRenewal(lockKey, lockId, ttl);
    }
  }

  /**
   * 设置锁续期
   * @private
   * @param {string} lockKey - 锁键
   * @param {string} lockId - 锁ID
   * @param {number} ttl - 过期时间
   */
  _setupRenewal(lockKey, lockId, ttl) {
    // 取消已存在的续期定时器
    if (this.renewalTimers.has(lockKey)) {
      clearInterval(this.renewalTimers.get(lockKey));
    }

    // 创建新的续期定时器
    const interval = setInterval(async () => {
      try {
        // 检查锁是否仍然有效且属于当前实例
        const lockInfo = this.activeLocks.get(lockKey);
        if (!lockInfo) {
          // 锁信息不存在，清除定时器
          clearInterval(interval);
          this.renewalTimers.delete(lockKey);
          return;
        }

        // 执行续期
        await this._renewLock(lockKey, lockId, ttl);
        logger.debug(`锁已续期: ${lockKey}`);
      } catch (error) {
        logger.error(`锁续期失败: ${lockKey}`, { error });
        // 续期失败，清除定时器
        clearInterval(interval);
        this.renewalTimers.delete(lockKey);
      }
    }, this.options.renewalInterval);

    // 存储定时器引用
    this.renewalTimers.set(lockKey, interval);
  }

  /**
   * 续期锁
   * @private
   * @param {string} lockKey - 锁键
   * @param {string} lockId - 锁ID
   * @param {number} ttl - 过期时间
   * @returns {Promise<boolean>} 是否续期成功
   */
  async _renewLock(lockKey, lockId, ttl) {
    try {
      // 先检查锁是否属于当前实例
      const currentLockId = await this.cacheClient.get(lockKey);
      
      if (currentLockId === lockId) {
        // 锁属于当前实例，执行续期
        await this.cacheClient.set(lockKey, lockId, Math.floor(ttl / 1000));
        return true;
      }
      
      // 锁已被其他实例获取
      logger.warn(`无法续期锁: ${lockKey} (锁已被其他实例获取)`);
      return false;
    } catch (error) {
      logger.error(`续期锁失败: ${lockKey}`, { error });
      throw error;
    }
  }

  /**
   * 释放锁
   * @param {string} resource - 资源名称
   * @param {string} lockId - 锁ID
   * @returns {Promise<boolean>} 是否释放成功
   */
  async release(resource, lockId) {
    const lockKey = this._generateLockKey(resource);
    
    try {
      // 验证锁ID
      const lockInfo = this.activeLocks.get(lockKey);
      
      if (!lockInfo || lockInfo.lockId !== lockId) {
        logger.warn(`尝试释放无效锁: ${resource} (无效的锁ID)`);
        return false;
      }

      // 执行释放操作
      const released = await this._releaseLock(lockKey, lockId);
      
      if (released) {
        // 清理锁信息
        this._cleanupLock(lockKey);
        logger.debug(`锁已释放: ${resource}`);
      }
      
      return released;
    } catch (error) {
      logger.error(`释放锁失败: ${resource}`, { error });
      throw new AppError('释放分布式锁失败', 500, error);
    }
  }

  /**
   * 执行锁释放操作
   * @private
   * @param {string} lockKey - 锁键
   * @param {string} lockId - 锁ID
   * @returns {Promise<boolean>} 是否释放成功
   */
  async _releaseLock(lockKey, lockId) {
    try {
      // 获取当前锁ID
      const currentLockId = await this.cacheClient.get(lockKey);
      
      // 验证锁是否属于当前实例
      if (currentLockId === lockId) {
        // 删除锁
        await this.cacheClient.delete(lockKey);
        return true;
      }
      
      // 锁不属于当前实例
      logger.warn(`无法释放锁: ${lockKey} (锁ID不匹配)`);
      return false;
    } catch (error) {
      logger.error(`执行锁释放操作失败: ${lockKey}`, { error });
      throw error;
    }
  }

  /**
   * 清理锁资源
   * @private
   * @param {string} lockKey - 锁键
   */
  _cleanupLock(lockKey) {
    // 删除锁信息
    this.activeLocks.delete(lockKey);
    
    // 清除续期定时器
    if (this.renewalTimers.has(lockKey)) {
      clearInterval(this.renewalTimers.get(lockKey));
      this.renewalTimers.delete(lockKey);
    }
  }

  /**
   * 强制释放锁（不验证锁ID）
   * @param {string} resource - 资源名称
   * @returns {Promise<boolean>} 是否释放成功
   */
  async forceRelease(resource) {
    const lockKey = this._generateLockKey(resource);
    
    try {
      // 直接删除锁
      await this.cacheClient.delete(lockKey);
      
      // 清理锁资源
      this._cleanupLock(lockKey);
      
      logger.debug(`锁已强制释放: ${resource}`);
      return true;
    } catch (error) {
      logger.error(`强制释放锁失败: ${resource}`, { error });
      throw new AppError('强制释放分布式锁失败', 500, error);
    }
  }

  /**
   * 检查锁是否存在
   * @param {string} resource - 资源名称
   * @returns {Promise<boolean>} 锁是否存在
   */
  async isLocked(resource) {
    const lockKey = this._generateLockKey(resource);
    
    try {
      const lockId = await this.cacheClient.get(lockKey);
      return lockId !== null;
    } catch (error) {
      logger.error(`检查锁状态失败: ${resource}`, { error });
      throw new AppError('检查锁状态失败', 500, error);
    }
  }

  /**
   * 获取锁信息
   * @param {string} resource - 资源名称
   * @returns {Promise<Object|null>} 锁信息
   */
  async getLockInfo(resource) {
    const lockKey = this._generateLockKey(resource);
    
    try {
      // 检查本地记录
      const lockInfo = this.activeLocks.get(lockKey);
      
      if (lockInfo) {
        // 检查锁是否仍然有效
        const currentLockId = await this.cacheClient.get(lockKey);
        
        if (currentLockId === lockInfo.lockId) {
          return {
            ...lockInfo,
            isActive: true,
            remainingTtl: lockInfo.ttl - (Date.now() - lockInfo.acquiredAt)
          };
        }
      }
      
      // 检查是否存在其他实例持有的锁
      const currentLockId = await this.cacheClient.get(lockKey);
      if (currentLockId) {
        return {
          resource,
          lockKey,
          lockId: currentLockId,
          isActive: true,
          isOwned: false
        };
      }
      
      return null;
    } catch (error) {
      logger.error(`获取锁信息失败: ${resource}`, { error });
      throw new AppError('获取锁信息失败', 500, error);
    }
  }

  /**
   * 在锁保护下执行操作
   * @param {string} resource - 资源名称
   * @param {Function} callback - 回调函数
   * @param {Object} options - 锁选项
   * @returns {Promise<any>} 回调函数的返回值
   */
  async executeWithLock(resource, callback, options = {}) {
    let lockId = null;
    
    try {
      // 获取锁
      lockId = await this.acquire(resource, options);
      
      if (!lockId) {
        throw new AppError(`无法获取资源锁: ${resource}`, 408);
      }
      
      // 执行回调
      return await callback();
    } finally {
      // 确保释放锁
      if (lockId) {
        await this.release(resource, lockId).catch(error => {
          logger.error(`释放锁时出现错误: ${resource}`, { error });
        });
      }
    }
  }

  /**
   * 获取活动锁数量
   * @returns {number} 活动锁数量
   */
  getActiveLockCount() {
    return this.activeLocks.size;
  }

  /**
   * 获取所有活动锁信息
   * @returns {Array<Object>} 活动锁列表
   */
  getActiveLocks() {
    return Array.from(this.activeLocks.values());
  }

  /**
   * 释放所有由当前实例持有的锁
   * @returns {Promise<void>}
   */
  async releaseAllLocks() {
    const lockKeys = Array.from(this.activeLocks.keys());
    
    for (const lockKey of lockKeys) {
      const lockInfo = this.activeLocks.get(lockKey);
      
      try {
        await this._releaseLock(lockKey, lockInfo.lockId);
        this._cleanupLock(lockKey);
        logger.debug(`释放锁: ${lockInfo.resource}`);
      } catch (error) {
        logger.error(`释放锁失败: ${lockInfo.resource}`, { error });
        // 继续尝试释放其他锁
      }
    }
    
    logger.info(`已释放所有活动锁，共 ${lockKeys.length} 个`);
  }

  /**
   * 关闭锁管理器
   * @returns {Promise<void>}
   */
  async close() {
    // 释放所有锁
    await this.releaseAllLocks();
    
    // 清除所有定时器
    for (const timer of this.renewalTimers.values()) {
      clearInterval(timer);
    }
    
    // 清空映射
    this.activeLocks.clear();
    this.renewalTimers.clear();
    
    logger.info('分布式锁管理器已关闭');
  }
}

module.exports = DistributedLock;