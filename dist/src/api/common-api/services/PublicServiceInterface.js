/**
 * 公共服务接口
 * 提供跨模块调用的标准服务接口
 */

const logger = require('@core/utils/logger');
const commonBusinessComponents = require('../components/business/CommonBusinessComponents');
const cacheKeyGenerator = require('../cache-config/CacheKeyGenerator');
const messageProducer = require('../message-queue/producers/messageProducer');
const { MESSAGE_TOPICS } = require('../message-queue/topics/messageTopics');

/**
 * 公共服务接口类
 * 提供统一的服务访问入口，确保跨模块调用的一致性
 */
class PublicServiceInterface {
  constructor() {
    this.logger = logger;
    this.businessComponents = commonBusinessComponents;
    this.cacheKeyGenerator = cacheKeyGenerator;
    this.logger.info('公共服务接口初始化完成');
  }

  /**
   * 初始化公共服务
   * @returns {Promise<boolean>} 是否初始化成功
   */
  async initialize() {
    try {
      this.logger.info('正在初始化公共服务接口...');
      
      // 这里可以添加初始化逻辑
      
      this.logger.info('公共服务接口初始化成功');
      return true;
    } catch (error) {
      this.logger.error('公共服务接口初始化失败:', error);
      return false;
    }
  }

  // ========== 用户相关服务 ==========

  /**
   * 获取用户信息
   * @param {string|number} userId - 用户ID
   * @returns {Promise<Object>} 用户信息
   */
  async getUserInfo(userId) {
    try {
      // 实际项目中应该调用用户服务
      // 这里提供一个模拟实现
      this.logger.info(`获取用户信息: ${userId}`);
      
      // 生成缓存键
      const cacheKey = this.cacheKeyGenerator.generateUserKey(userId, 'info');
      
      // 尝试从缓存获取
      // const cachedUser = await this.cacheService.get(cacheKey);
      // if (cachedUser) return cachedUser;
      
      // 模拟用户数据
      const userInfo = {
        id: userId,
        username: `user_${userId}`,
        email: `user${userId}@example.com`,
        phone: `1380013800${userId % 10}`,
        nickname: `用户${userId}`,
        avatar: `/uploads/avatars/default.jpg`,
        roles: ['user'],
        status: 'active',
        createdAt: new Date().toISOString()
      };
      
      // 缓存用户信息
      // await this.cacheService.set(cacheKey, userInfo, this.cacheKeyGenerator.getExpiration('USER_PROFILE'));
      
      return userInfo;
    } catch (error) {
      this.logger.error(`获取用户信息失败: ${userId}`, error);
      throw error;
    }
  }

  /**
   * 验证用户权限
   * @param {Object} user - 用户对象
   * @param {Array} requiredPermissions - 必需的权限列表
   * @returns {Promise<boolean>} 是否有权限
   */
  async validateUserPermission(user, requiredPermissions = []) {
    try {
      return this.businessComponents.validateUserPermission(user, requiredPermissions);
    } catch (error) {
      this.logger.error('验证用户权限失败:', error);
      return false;
    }
  }

  // ========== 商品相关服务 ==========

  /**
   * 获取商品信息
   * @param {string|number} productId - 商品ID
   * @returns {Promise<Object>} 商品信息
   */
  async getProductInfo(productId) {
    try {
      this.logger.info(`获取商品信息: ${productId}`);
      
      // 生成缓存键
      const cacheKey = this.cacheKeyGenerator.generateProductKey(productId);
      
      // 尝试从缓存获取
      // const cachedProduct = await this.cacheService.get(cacheKey);
      // if (cachedProduct) return cachedProduct;
      
      // 模拟商品数据
      const productInfo = {
        id: productId,
        name: `商品${productId}`,
        price: 99.99,
        originalPrice: 199.99,
        description: '这是一个示例商品',
        images: ['/uploads/images/products/sample1.jpg', '/uploads/images/products/sample2.jpg'],
        stock: 100,
        sales: 0,
        categoryId: 1,
        shopId: 1,
        status: 'active',
        createdAt: new Date().toISOString()
      };
      
      // 缓存商品信息
      // await this.cacheService.set(cacheKey, productInfo, this.cacheKeyGenerator.getExpiration('PRODUCT_DETAIL'));
      
      return productInfo;
    } catch (error) {
      this.logger.error(`获取商品信息失败: ${productId}`, error);
      throw error;
    }
  }

  /**
   * 获取分类列表
   * @returns {Promise<Array>} 分类列表
   */
  async getCategoryList() {
    try {
      this.logger.info('获取分类列表');
      
      // 生成缓存键
      const cacheKey = this.cacheKeyGenerator.generateCategoryKey('all');
      
      // 尝试从缓存获取
      // const cachedCategories = await this.cacheService.get(cacheKey);
      // if (cachedCategories) return cachedCategories;
      
      // 模拟分类数据
      const categories = [
        {
          id: 1,
          name: '数码产品',
          parentId: 0,
          level: 1,
          icon: '/icons/digital.svg',
          sort: 1
        },
        {
          id: 2,
          name: '服装鞋帽',
          parentId: 0,
          level: 1,
          icon: '/icons/clothing.svg',
          sort: 2
        },
        {
          id: 3,
          name: '家居用品',
          parentId: 0,
          level: 1,
          icon: '/icons/home.svg',
          sort: 3
        }
      ];
      
      // 缓存分类列表
      // await this.cacheService.set(cacheKey, categories, this.cacheKeyGenerator.getExpiration('CATEGORY_LIST'));
      
      return categories;
    } catch (error) {
      this.logger.error('获取分类列表失败:', error);
      throw error;
    }
  }

  // ========== 订单相关服务 ==========

  /**
   * 获取订单状态
   * @param {string|number} orderId - 订单ID
   * @returns {Promise<Object>} 订单状态信息
   */
  async getOrderStatus(orderId) {
    try {
      this.logger.info(`获取订单状态: ${orderId}`);
      
      // 生成缓存键
      const cacheKey = this.cacheKeyGenerator.generateOrderKey(orderId, 'status');
      
      // 尝试从缓存获取
      // const cachedStatus = await this.cacheService.get(cacheKey);
      // if (cachedStatus) return cachedStatus;
      
      // 模拟订单状态
      const orderStatus = {
        orderId,
        status: 'pending_payment',
        statusText: '待付款',
        updatedAt: new Date().toISOString()
      };
      
      // 缓存订单状态
      // await this.cacheService.set(cacheKey, orderStatus, this.cacheKeyGenerator.getExpiration('ORDER_STATUS'));
      
      return orderStatus;
    } catch (error) {
      this.logger.error(`获取订单状态失败: ${orderId}`, error);
      throw error;
    }
  }

  // ========== 系统配置服务 ==========

  /**
   * 获取系统配置
   * @param {string} configKey - 配置键
   * @returns {Promise<Object>} 配置信息
   */
  async getSystemConfig(configKey) {
    try {
      this.logger.info(`获取系统配置: ${configKey}`);
      
      // 生成缓存键
      const cacheKey = this.cacheKeyGenerator.generateConfigKey(configKey);
      
      // 尝试从缓存获取
      // const cachedConfig = await this.cacheService.get(cacheKey);
      // if (cachedConfig) return cachedConfig;
      
      // 模拟配置数据
      const configMap = {
        upload: {
          maxFileSize: 10485760, // 10MB
          allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
          allowedFileTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        },
        pagination: {
          defaultPageSize: 20,
          maxPageSize: 100,
        },
        security: {
          passwordMinLength: 8,
          passwordMaxLength: 20,
          tokenExpireTime: 3600,
        },
      };
      
      const config = configMap[configKey];
      
      // 缓存配置
      if (config) {
        // await this.cacheService.set(cacheKey, config, this.cacheKeyGenerator.getExpiration('CONFIGURATION'));
      }
      
      return config || null;
    } catch (error) {
      this.logger.error(`获取系统配置失败: ${configKey}`, error);
      throw error;
    }
  }

  // ========== 通知服务 ==========

  /**
   * 发送系统通知
   * @param {Object} notificationData - 通知数据
   * @returns {Promise<boolean>} 是否发送成功
   */
  async sendSystemNotification(notificationData) {
    try {
      return await this.businessComponents.sendBusinessNotification(notificationData);
    } catch (error) {
      this.logger.error('发送系统通知失败:', error);
      return false;
    }
  }

  /**
   * 发送邮件通知
   * @param {Object} emailData - 邮件数据
   * @returns {Promise<boolean>} 是否发送成功
   */
  async sendEmailNotification(emailData) {
    try {
      const {
        to,
        subject,
        content,
        templateId,
        variables = {}
      } = emailData;

      if (!to || !subject || !content) {
        throw new Error('邮件数据不完整');
      }

      // 发送到消息队列
      await messageProducer.sendMessage(
        MESSAGE_TOPICS.NOTIFICATION.SEND_EMAIL,
        {
          to,
          subject,
          content,
          templateId,
          variables,
          timestamp: new Date().toISOString()
        }
      );

      this.logger.info(`邮件通知发送成功: ${subject}`);
      return true;
    } catch (error) {
      this.logger.error('发送邮件通知失败:', error);
      return false;
    }
  }

  // ========== 统计服务 ==========

  /**
   * 获取统计数据
   * @param {string} statType - 统计类型
   * @param {Object} params - 统计参数
   * @returns {Promise<Object>} 统计数据
   */
  async getStatistics(statType, params = {}) {
    try {
      this.logger.info(`获取统计数据: ${statType}`, params);
      
      // 生成缓存键
      const cacheKey = this.cacheKeyGenerator.generateStatsKey(statType, params);
      
      // 尝试从缓存获取
      // const cachedStats = await this.cacheService.get(cacheKey);
      // if (cachedStats) return cachedStats;
      
      // 模拟统计数据
      let statistics = {};
      
      switch (statType) {
        case 'dailySales':
          statistics = {
            date: new Date().toISOString().split('T')[0],
            totalSales: 10000,
            orderCount: 100,
            avgOrderAmount: 100
          };
          break;
        case 'userActivity':
          statistics = {
            activeUsers: 500,
            newRegistrations: 50,
            totalLogins: 1000
          };
          break;
        default:
          statistics = { data: '暂无数据' };
      }
      
      // 缓存统计数据
      // await this.cacheService.set(cacheKey, statistics, this.cacheKeyGenerator.getExpiration('STATISTICS'));
      
      return statistics;
    } catch (error) {
      this.logger.error(`获取统计数据失败: ${statType}`, error);
      throw error;
    }
  }

  // ========== 通用工具服务 ==========

  /**
   * 格式化响应数据
   * @param {*} data - 数据
   * @param {string} message - 消息
   * @param {boolean} success - 是否成功
   * @returns {Object} 格式化的响应数据
   */
  formatResponse(data = null, message = '操作成功', success = true) {
    return this.businessComponents.buildResponse(data, message, success);
  }

  /**
   * 格式化分页参数
   * @param {Object} query - 请求查询参数
   * @returns {Object} 格式化的分页参数
   */
  formatPagination(query) {
    return this.businessComponents.formatPaginationParams(query);
  }

  /**
   * 格式化排序参数
   * @param {Object} query - 请求查询参数
   * @param {Array} allowedFields - 允许的排序字段
   * @returns {Object} 格式化的排序参数
   */
  formatSort(query, allowedFields = []) {
    return this.businessComponents.formatSortParams(query, 'id', 'desc', allowedFields);
  }

  /**
   * 记录业务操作日志
   * @param {Object} logData - 日志数据
   * @returns {Promise<void>}
   */
  async logOperation(logData) {
    await this.businessComponents.logBusinessOperation(logData);
  }

  /**
   * 验证业务数据
   * @param {Object} data - 要验证的数据
   * @param {Object} rules - 验证规则
   * @returns {Object} 验证结果
   */
  validateData(data, rules) {
    return this.businessComponents.validateBusinessRules(data, rules);
  }

  // ========== 服务状态管理 ==========

  /**
   * 检查服务健康状态
   * @returns {Promise<Object>} 健康状态信息
   */
  async checkHealth() {
    try {
      const healthInfo = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        components: {
          messageQueue: true,
          cache: true,
          services: true
        }
      };
      
      return healthInfo;
    } catch (error) {
      this.logger.error('健康检查失败:', error);
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  /**
   * 清理缓存
   * @param {string} pattern - 缓存键模式
   * @returns {Promise<boolean>} 是否清理成功
   */
  async clearCache(pattern = '*') {
    try {
      this.logger.info(`清理缓存: ${pattern}`);
      
      // 发送缓存清理事件
      await messageProducer.sendMessage(
        MESSAGE_TOPICS.SYSTEM.CACHE_INVALIDATED,
        { pattern, timestamp: new Date().toISOString() }
      );
      
      return true;
    } catch (error) {
      this.logger.error('清理缓存失败:', error);
      return false;
    }
  }
}

// 创建单例实例
const publicServiceInterface = new PublicServiceInterface();

// 导出公共服务接口实例
module.exports = publicServiceInterface;

// 导出服务接口类，便于扩展
module.exports.PublicServiceInterface = PublicServiceInterface;