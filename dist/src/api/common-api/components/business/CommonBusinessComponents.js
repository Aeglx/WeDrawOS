/**
 * 通用业务组件
 * 提供跨模块共享的业务逻辑功能
 */

const logger = require('@core/utils/logger');
const redisConfig = require('../../cache-config/redisConfig');
const messageProducer = require('../../message-queue/producers/messageProducer');
const { MESSAGE_TOPICS } = require('../../message-queue/topics/messageTopics');

/**
 * 通用业务组件类
 */
class CommonBusinessComponents {
  constructor() {
    this.logger = logger;
    this.logger.info('通用业务组件初始化');
  }

  /**
   * 验证用户权限
   * @param {Object} user - 用户对象
   * @param {Array} requiredRoles - 必需的角色列表
   * @returns {boolean} 是否有权限
   */
  validateUserPermission(user, requiredRoles = []) {
    if (!user) {
      return false;
    }

    // 如果不需要特定角色，则只要登录即可
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // 检查用户角色
    const userRoles = user.roles || [];
    return requiredRoles.some(role => userRoles.includes(role));
  }

  /**
   * 格式化分页参数
   * @param {Object} query - 请求查询参数
   * @param {number} defaultPageSize - 默认页面大小
   * @param {number} maxPageSize - 最大页面大小
   * @returns {Object} 格式化的分页参数
   */
  formatPaginationParams(query, defaultPageSize = 20, maxPageSize = 100) {
    const page = parseInt(query.page, 10) || 1;
    const pageSize = parseInt(query.pageSize, 10) || defaultPageSize;
    
    // 确保页码和每页数量有效
    const validPage = Math.max(1, page);
    const validPageSize = Math.min(Math.max(1, pageSize), maxPageSize);
    const offset = (validPage - 1) * validPageSize;
    
    return {
      page: validPage,
      pageSize: validPageSize,
      offset,
      limit: validPageSize
    };
  }

  /**
   * 格式化排序参数
   * @param {Object} query - 请求查询参数
   * @param {string} defaultSortBy - 默认排序字段
   * @param {string} defaultOrder - 默认排序顺序（asc/desc）
   * @param {Array} allowedSortFields - 允许的排序字段列表
   * @returns {Object} 格式化的排序参数
   */
  formatSortParams(query, defaultSortBy = 'id', defaultOrder = 'desc', allowedSortFields = []) {
    let sortBy = query.sortBy || defaultSortBy;
    let order = query.order || defaultOrder;
    
    // 验证排序字段
    if (allowedSortFields && allowedSortFields.length > 0) {
      sortBy = allowedSortFields.includes(sortBy) ? sortBy : defaultSortBy;
    }
    
    // 验证排序顺序
    order = ['asc', 'desc'].includes(order.toLowerCase()) ? order.toLowerCase() : defaultOrder;
    
    return {
      sortBy,
      order
    };
  }

  /**
   * 生成业务唯一标识符
   * @param {string} prefix - 前缀
   * @param {number} length - 随机部分长度
   * @returns {string} 唯一标识符
   */
  generateBusinessId(prefix = '', length = 8) {
    const timestamp = Date.now().toString(36);
    const randomChars = Math.random().toString(36).substring(2, 2 + length);
    return prefix ? `${prefix}_${timestamp}_${randomChars}` : `${timestamp}_${randomChars}`;
  }

  /**
   * 发送业务通知
   * @param {Object} notificationData - 通知数据
   * @returns {Promise<boolean>} 是否发送成功
   */
  async sendBusinessNotification(notificationData) {
    try {
      const {
        userId,
        type = 'system',
        title,
        content,
        data = {}
      } = notificationData;

      if (!userId || !title || !content) {
        throw new Error('通知数据不完整');
      }

      // 构建通知消息
      const message = {
        userId,
        type,
        title,
        content,
        data,
        timestamp: new Date().toISOString()
      };

      // 发送到消息队列
      await messageProducer.sendMessage(
        MESSAGE_TOPICS.NOTIFICATION.SEND_SYSTEM_MESSAGE,
        message
      );

      this.logger.info(`业务通知发送成功: ${title}`);
      return true;
    } catch (error) {
      this.logger.error('发送业务通知失败:', error);
      return false;
    }
  }

  /**
   * 批量处理数据
   * @param {Array} items - 要处理的数据项
   * @param {Function} processor - 处理函数
   * @param {number} batchSize - 批次大小
   * @returns {Promise<Array>} 处理结果
   */
  async processInBatches(items, processor, batchSize = 100) {
    if (!items || !Array.isArray(items) || items.length === 0) {
      return [];
    }

    const results = [];
    const totalItems = items.length;

    for (let i = 0; i < totalItems; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      
      try {
        const batchResults = await processor(batch);
        results.push(...batchResults);
        
        this.logger.info(`批次处理完成: ${i + batch.length}/${totalItems}`);
      } catch (error) {
        this.logger.error(`批次处理失败: ${i}-${i + batch.length}`, error);
        // 可以选择继续处理下一批或抛出错误
        throw error;
      }
    }

    return results;
  }

  /**
   * 缓存业务数据
   * @param {string} key - 缓存键
   * @param {*} data - 要缓存的数据
   * @param {number} expiration - 过期时间（秒）
   * @returns {Promise<boolean>} 是否缓存成功
   */
  async cacheBusinessData(key, data, expiration = redisConfig.expirationTimes.MEDIUM) {
    try {
      await redisConfig.set(key, data, expiration);
      this.logger.info(`业务数据缓存成功: ${key}`);
      return true;
    } catch (error) {
      this.logger.error(`业务数据缓存失败: ${key}`, error);
      return false;
    }
  }

  /**
   * 从缓存获取业务数据
   * @param {string} key - 缓存键
   * @returns {Promise<any>} 缓存的数据
   */
  async getBusinessDataFromCache(key) {
    try {
      const data = await redisConfig.get(key);
      if (data) {
        this.logger.info(`从缓存获取业务数据: ${key}`);
      }
      return data;
    } catch (error) {
      this.logger.error(`从缓存获取业务数据失败: ${key}`, error);
      return null;
    }
  }

  /**
   * 记录业务操作日志
   * @param {Object} logData - 日志数据
   * @returns {Promise<void>}
   */
  async logBusinessOperation(logData) {
    try {
      const {
        userId,
        operation,
        entityType,
        entityId,
        details = {},
        success = true
      } = logData;

      const logEntry = {
        userId,
        operation,
        entityType,
        entityId,
        details,
        success,
        timestamp: new Date().toISOString(),
        ipAddress: logData.ipAddress || 'unknown'
      };

      // 可以选择记录到数据库或发送到日志系统
      this.logger.info(`业务操作日志: ${operation}`, logEntry);

      // 发送日志事件到消息队列
      await messageProducer.sendMessage(
        MESSAGE_TOPICS.SYSTEM.ERROR_LOGGED,
        {
          level: success ? 'info' : 'error',
          source: 'business_operation',
          message: `${operation} ${success ? 'success' : 'failed'}`,
          data: logEntry
        }
      );
    } catch (error) {
      this.logger.error('记录业务操作日志失败:', error);
    }
  }

  /**
   * 验证业务规则
   * @param {Object} data - 要验证的数据
   * @param {Object} rules - 验证规则
   * @returns {Object} 验证结果 { valid, errors }
   */
  validateBusinessRules(data, rules) {
    const errors = [];

    Object.entries(rules).forEach(([field, fieldRules]) => {
      const value = data[field];
      
      // 验证必填
      if (fieldRules.required && (value === undefined || value === null || value === '')) {
        errors.push({ field, message: fieldRules.requiredMessage || `${field} 是必填字段` });
        return;
      }

      // 如果值为空且不是必填，跳过其他验证
      if (value === undefined || value === null || value === '') {
        return;
      }

      // 验证最小长度
      if (fieldRules.minLength && String(value).length < fieldRules.minLength) {
        errors.push({ field, message: fieldRules.minLengthMessage || `${field} 长度不能小于 ${fieldRules.minLength}` });
      }

      // 验证最大长度
      if (fieldRules.maxLength && String(value).length > fieldRules.maxLength) {
        errors.push({ field, message: fieldRules.maxLengthMessage || `${field} 长度不能大于 ${fieldRules.maxLength}` });
      }

      // 验证正则表达式
      if (fieldRules.pattern && !fieldRules.pattern.test(value)) {
        errors.push({ field, message: fieldRules.patternMessage || `${field} 格式不正确` });
      }

      // 自定义验证函数
      if (fieldRules.validator && typeof fieldRules.validator === 'function') {
        const validatorResult = fieldRules.validator(value, data);
        if (validatorResult !== true) {
          errors.push({ field, message: validatorResult || `${field} 验证失败` });
        }
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 构建响应数据
   * @param {*} data - 数据
   * @param {string} message - 消息
   * @param {boolean} success - 是否成功
   * @returns {Object} 响应对象
   */
  buildResponse(data = null, message = '操作成功', success = true) {
    return {
      success,
      message,
      data,
      timestamp: new Date().toISOString()
    };
  }
}

// 创建单例实例
const commonBusinessComponents = new CommonBusinessComponents();

module.exports = commonBusinessComponents;