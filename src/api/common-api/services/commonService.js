/**
 * 公共服务模块
 * 提供平台通用的业务功能接口
 */

const logger = require('@core/utils/logger');
const redisConfig = require('../cache-config/redisConfig');
const messageProducer = require('../message-queue/producers/messageProducer');
const { MESSAGE_TOPICS } = require('../message-queue/topics/messageTopics');

class CommonService {
  /**
   * 健康检查
   * @returns {Promise<object>} 健康状态信息
   */
  async healthCheck() {
    try {
      const healthInfo = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: process.env.APP_VERSION || '1.0.0',
      };
      
      // 可以在这里添加更多检查项，如数据库连接状态等
      logger.info('健康检查完成');
      return healthInfo;
    } catch (error) {
      logger.error('健康检查失败:', error);
      throw new Error('健康检查失败');
    }
  }
  
  /**
   * 获取商品分类列表
   * @param {boolean} withChildren 是否包含子分类
   * @returns {Promise<Array>} 分类列表
   */
  async getCategories(withChildren = true) {
    try {
      // 先尝试从缓存获取
      const cacheKey = redisConfig.getKey(redisConfig.keyPrefixes.CATEGORY, 'all');
      const cachedCategories = await redisConfig.get(cacheKey);
      
      if (cachedCategories) {
        logger.info('从缓存获取分类列表');
        return cachedCategories;
      }
      
      // 模拟从数据库获取分类数据
      // 实际项目中应该从数据库查询
      const categories = [
        {
          id: 1,
          name: '数码产品',
          parentId: 0,
          level: 1,
          icon: '/icons/digital.svg',
          sort: 1,
          children: [
            {
              id: 11,
              name: '手机',
              parentId: 1,
              level: 2,
              icon: '/icons/phone.svg',
              sort: 1,
              children: [
                { id: 111, name: '智能手机', parentId: 11, level: 3, icon: '', sort: 1 },
                { id: 112, name: '功能机', parentId: 11, level: 3, icon: '', sort: 2 },
              ],
            },
            {
              id: 12,
              name: '电脑',
              parentId: 1,
              level: 2,
              icon: '/icons/computer.svg',
              sort: 2,
              children: [
                { id: 121, name: '笔记本', parentId: 12, level: 3, icon: '', sort: 1 },
                { id: 122, name: '台式机', parentId: 12, level: 3, icon: '', sort: 2 },
              ],
            },
          ],
        },
        {
          id: 2,
          name: '服装鞋帽',
          parentId: 0,
          level: 1,
          icon: '/icons/clothing.svg',
          sort: 2,
          children: [
            { id: 21, name: '男装', parentId: 2, level: 2, icon: '/icons/men.svg', sort: 1 },
            { id: 22, name: '女装', parentId: 2, level: 2, icon: '/icons/women.svg', sort: 2 },
          ],
        },
        {
          id: 3,
          name: '家居用品',
          parentId: 0,
          level: 1,
          icon: '/icons/home.svg',
          sort: 3,
        },
      ];
      
      // 缓存分类数据
      await redisConfig.set(cacheKey, categories, redisConfig.expirationTimes.VERY_LONG);
      
      return categories;
    } catch (error) {
      logger.error('获取分类列表失败:', error);
      throw new Error('获取分类列表失败');
    }
  }
  
  /**
   * 获取地区列表
   * @param {number} parentId 父地区ID
   * @returns {Promise<Array>} 地区列表
   */
  async getRegions(parentId = 0) {
    try {
      // 先尝试从缓存获取
      const cacheKey = redisConfig.getKey(redisConfig.keyPrefixes.REGION, parentId);
      const cachedRegions = await redisConfig.get(cacheKey);
      
      if (cachedRegions) {
        logger.info('从缓存获取地区列表');
        return cachedRegions;
      }
      
      // 模拟从数据库获取地区数据
      // 实际项目中应该从数据库查询
      let regions = [];
      
      if (parentId === 0) {
        // 省份数据
        regions = [
          { id: 110000, name: '北京市', parentId: 0, level: 1 },
          { id: 120000, name: '天津市', parentId: 0, level: 1 },
          { id: 310000, name: '上海市', parentId: 0, level: 1 },
          { id: 440000, name: '广东省', parentId: 0, level: 1 },
          { id: 330000, name: '浙江省', parentId: 0, level: 1 },
        ];
      } else if (parentId === 440000) {
        // 广东省城市
        regions = [
          { id: 440100, name: '广州市', parentId: 440000, level: 2 },
          { id: 440300, name: '深圳市', parentId: 440000, level: 2 },
          { id: 440400, name: '珠海市', parentId: 440000, level: 2 },
        ];
      }
      
      // 缓存地区数据
      await redisConfig.set(cacheKey, regions, redisConfig.expirationTimes.VERY_LONG);
      
      return regions;
    } catch (error) {
      logger.error('获取地区列表失败:', error);
      throw new Error('获取地区列表失败');
    }
  }
  
  /**
   * 获取搜索建议
   * @param {string} keyword 搜索关键词
   * @param {string} type 搜索类型
   * @returns {Promise<Array>} 搜索建议列表
   */
  async getSearchSuggestions(keyword, type = 'product') {
    try {
      if (!keyword || keyword.trim().length < 2) {
        return [];
      }
      
      // 尝试从缓存获取
      const cacheKey = redisConfig.getKey(redisConfig.keyPrefixes.SEARCH, `${type}_${keyword}`);
      const cachedSuggestions = await redisConfig.get(cacheKey);
      
      if (cachedSuggestions) {
        return cachedSuggestions;
      }
      
      // 模拟搜索建议数据
      // 实际项目中应该从搜索引擎或数据库查询
      const suggestions = [];
      
      if (type === 'product') {
        suggestions.push(
          `${keyword} 官方`,
          `${keyword} 最新款`,
          `${keyword} 优惠`,
          `${keyword} 配件`,
          `${keyword} 套装`
        );
      } else if (type === 'shop') {
        suggestions.push(
          `${keyword} 旗舰店`,
          `${keyword} 专卖店`,
          `优质${keyword}店铺`,
          `销量最高${keyword}`
        );
      }
      
      // 缓存搜索建议
      await redisConfig.set(cacheKey, suggestions, redisConfig.expirationTimes.MEDIUM);
      
      return suggestions;
    } catch (error) {
      logger.error('获取搜索建议失败:', error);
      return [];
    }
  }
  
  /**
   * 发送系统消息
   * @param {object} messageData 消息数据
   * @returns {Promise<boolean>} 是否发送成功
   */
  async sendSystemMessage(messageData) {
    try {
      const { userId, type, title, content, data } = messageData;
      
      // 验证必要参数
      if (!userId || !type || !title || !content) {
        throw new Error('缺少必要的消息参数');
      }
      
      // 构建消息对象
      const message = {
        userId,
        type,
        title,
        content,
        data: data || {},
        read: false,
        createdAt: new Date().toISOString(),
      };
      
      // 发送到消息队列
      const result = await messageProducer.send(
        MESSAGE_TOPICS.NOTIFICATION.SEND_SYSTEM_MESSAGE,
        message
      );
      
      if (result) {
        logger.info(`系统消息发送成功，用户ID: ${userId}`);
      }
      
      return result;
    } catch (error) {
      logger.error('发送系统消息失败:', error);
      throw new Error('发送系统消息失败');
    }
  }
  
  /**
   * 清除缓存
   * @param {string} pattern 缓存键模式
   * @returns {Promise<boolean>} 是否清除成功
   */
  async clearCache(pattern) {
    try {
      const result = await redisConfig.deletePattern(pattern);
      
      if (result) {
        logger.info(`缓存清除成功，模式: ${pattern}`);
      }
      
      return result;
    } catch (error) {
      logger.error('清除缓存失败:', error);
      throw new Error('清除缓存失败');
    }
  }
  
  /**
   * 获取系统配置
   * @param {string} configKey 配置键
   * @returns {Promise<object>} 配置信息
   */
  async getSystemConfig(configKey) {
    try {
      // 先尝试从缓存获取
      const cacheKey = redisConfig.getKey(redisConfig.keyPrefixes.CONFIG, configKey);
      const cachedConfig = await redisConfig.get(cacheKey);
      
      if (cachedConfig) {
        return cachedConfig;
      }
      
      // 模拟配置数据
      // 实际项目中应该从数据库或配置服务获取
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
        await redisConfig.set(cacheKey, config, redisConfig.expirationTimes.LONG);
      }
      
      return config || null;
    } catch (error) {
      logger.error('获取系统配置失败:', error);
      throw new Error('获取系统配置失败');
    }
  }
}

module.exports = new CommonService();