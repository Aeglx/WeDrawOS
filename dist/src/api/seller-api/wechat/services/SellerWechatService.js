/**
 * 卖家企业微信服务
 * 提供卖家相关的企业微信和公众号功能服务
 * 处理权限验证、业务逻辑和安全控制
 */

const logger = require('../../../core/utils/logger');
const { ForbiddenError, ServiceUnavailableError } = require('../../../core/exception/types/BusinessExceptions');
const wechatService = require('../../../core/services/wechatService');
const permissionService = require('../../../admin-api/permissions/services/permissionService');
const redisClient = require('../../../core/cache/redisClient');

class SellerWechatService {
  /**
   * 验证卖家是否有权限使用特定微信功能
   * @param {string} sellerId - 卖家ID
   * @param {string} permissionCode - 权限代码
   * @returns {Promise<boolean>}
   */
  async verifyPermission(sellerId, permissionCode) {
    try {
      const hasPermission = await permissionService.checkSellerPermission(sellerId, permissionCode);
      
      if (!hasPermission) {
        logger.warn(`卖家权限验证失败，卖家ID: ${sellerId}，权限代码: ${permissionCode}`);
        throw new ForbiddenError('您没有权限执行此操作');
      }
      
      return true;
    } catch (error) {
      if (error instanceof ForbiddenError) {
        throw error;
      }
      logger.error(`权限验证服务错误: ${error.message}`);
      throw new ServiceUnavailableError('权限验证服务暂时不可用');
    }
  }

  /**
   * 获取卖家可用的消息模板列表
   * @param {string} sellerId - 卖家ID
   * @returns {Promise<Array>}
   */
  async getAvailableTemplates(sellerId) {
    try {
      // 验证卖家是否有权限查看模板
      await this.verifyPermission(sellerId, 'wechat:template:view');
      
      // 从缓存获取可用模板（如果有）
      const cacheKey = `seller:${sellerId}:wechat:templates`;
      const cachedTemplates = await redisClient.get(cacheKey);
      
      if (cachedTemplates) {
        return JSON.parse(cachedTemplates);
      }
      
      // 获取卖家可用的模板列表
      const templates = await wechatService.getSellerTemplates(sellerId);
      
      // 缓存模板列表（30分钟）
      await redisClient.set(cacheKey, JSON.stringify(templates), 'EX', 1800);
      
      return templates;
    } catch (error) {
      logger.error(`获取卖家模板失败，卖家ID: ${sellerId}，错误: ${error.message}`);
      throw error;
    }
  }

  /**
   * 检查卖家消息发送配额
   * @param {string} sellerId - 卖家ID
   * @param {number} messageCount - 计划发送的消息数量
   * @returns {Promise<{hasQuota: boolean, remaining: number, dailyLimit: number}>}
   */
  async checkMessageQuota(sellerId, messageCount) {
    try {
      // 获取卖家消息配额配置
      const quotaConfig = await wechatService.getSellerMessageQuota(sellerId);
      
      if (!quotaConfig) {
        // 默认配额配置
        quotaConfig = {
          dailyLimit: 1000,
          monthlyLimit: 30000
        };
      }
      
      // 获取今日已发送消息数
      const today = new Date().toISOString().split('T')[0];
      const dailyCount = await wechatService.getSellerDailyMessageCount(sellerId, today);
      
      // 检查是否超出配额
      const remainingQuota = Math.max(0, quotaConfig.dailyLimit - dailyCount);
      const hasQuota = messageCount <= remainingQuota;
      
      if (!hasQuota) {
        logger.warn(`卖家消息配额不足，卖家ID: ${sellerId}，已发送: ${dailyCount}，请求: ${messageCount}，限额: ${quotaConfig.dailyLimit}`);
      }
      
      return {
        hasQuota,
        remaining: remainingQuota,
        dailyLimit: quotaConfig.dailyLimit,
        used: dailyCount
      };
    } catch (error) {
      logger.error(`检查消息配额失败，卖家ID: ${sellerId}，错误: ${error.message}`);
      throw new ServiceUnavailableError('消息配额检查失败');
    }
  }

  /**
   * 记录卖家微信操作日志
   * @param {string} sellerId - 卖家ID
   * @param {string} operation - 操作类型
   * @param {object} details - 操作详情
   * @returns {Promise<void>}
   */
  async logWechatOperation(sellerId, operation, details = {}) {
    try {
      const logData = {
        sellerId,
        operation,
        timestamp: new Date(),
        details: {
          ...details,
          // 隐藏敏感信息
          params: details.params ? this._maskSensitiveData(details.params) : undefined
        }
      };
      
      await wechatService.logSellerOperation(logData);
      
      // 异步记录到审计日志
      process.nextTick(() => {
        logger.info(`卖家微信操作: ${operation}`, {
          sellerId,
          operation,
          details: logData.details
        });
      });
    } catch (error) {
      // 日志记录失败不应影响主要功能
      logger.error(`记录微信操作日志失败: ${error.message}`);
    }
  }

  /**
   * 获取卖家微信资源使用情况
   * @param {string} sellerId - 卖家ID
   * @returns {Promise<object>}
   */
  async getResourceUsage(sellerId) {
    try {
      // 验证卖家是否有权限查看资源使用情况
      await this.verifyPermission(sellerId, 'wechat:analytics:view');
      
      // 获取各类资源使用数据
      const [messageUsage, mediaUsage, qrcodeUsage] = await Promise.all([
        this._getMessageUsage(sellerId),
        this._getMediaUsage(sellerId),
        this._getQrcodeUsage(sellerId)
      ]);
      
      return {
        message: messageUsage,
        media: mediaUsage,
        qrcode: qrcodeUsage,
        lastUpdated: new Date()
      };
    } catch (error) {
      logger.error(`获取资源使用情况失败，卖家ID: ${sellerId}，错误: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取消息使用统计（辅助方法）
   * @private
   */
  async _getMessageUsage(sellerId) {
    const today = new Date().toISOString().split('T')[0];
    const weeklyStats = await wechatService.getSellerWeeklyMessageStats(sellerId);
    const todayCount = await wechatService.getSellerDailyMessageCount(sellerId, today);
    
    return {
      today: todayCount,
      weekly: weeklyStats.reduce((sum, day) => sum + day.count, 0),
      trend: weeklyStats.map(day => ({ date: day.date, count: day.count })),
      byType: weeklyStats
        .flatMap(day => day.byType || [])
        .reduce((acc, type) => {
          acc[type.type] = (acc[type.type] || 0) + type.count;
          return acc;
        }, {})
    };
  }

  /**
   * 获取媒体资源使用统计（辅助方法）
   * @private
   */
  async _getMediaUsage(sellerId) {
    const mediaStats = await wechatService.getSellerMediaStats(sellerId);
    
    return {
      totalCount: mediaStats.total || 0,
      byType: mediaStats.byType || {},
      storageUsed: mediaStats.storageUsed || 0,
      storageLimit: 50 * 1024 * 1024 // 50MB默认限制
    };
  }

  /**
   * 获取二维码使用统计（辅助方法）
   * @private
   */
  async _getQrcodeUsage(sellerId) {
    const qrcodeStats = await wechatService.getSellerQrcodeStats(sellerId);
    
    return {
      active: qrcodeStats.active || 0,
      expired: qrcodeStats.expired || 0,
      total: qrcodeStats.total || 0,
      scanCount: qrcodeStats.scanCount || 0
    };
  }

  /**
   * 隐藏敏感数据（辅助方法）
   * @private
   */
  _maskSensitiveData(data) {
    if (!data || typeof data !== 'object') {
      return data;
    }
    
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'credit_card'];
    const maskedData = { ...data };
    
    sensitiveFields.forEach(field => {
      if (maskedData[field]) {
        maskedData[field] = '***已隐藏***';
      }
    });
    
    // 隐藏部分手机号、身份证等
    if (maskedData.phone) {
      maskedData.phone = maskedData.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
    }
    
    if (maskedData.idCard) {
      maskedData.idCard = maskedData.idCard.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2');
    }
    
    return maskedData;
  }
}

module.exports = new SellerWechatService();