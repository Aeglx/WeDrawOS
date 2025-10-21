/**
 * 缓存刷新任务
 * 负责定期刷新系统中的各种缓存
 */
const JobBase = require('../job/jobBase');
const logger = require('../../core/utils/logger');
const cacheManager = require('../../core/cache/cacheManager');

class CacheRefreshJob extends JobBase {
  constructor() {
    super({
      name: 'CacheRefreshJob',
      cronExpression: '0 */3 * * *', // 每3小时执行一次
      timeout: 180000 // 3分钟超时
    });
    
    // 缓存键配置
    this.cacheKeys = {
      product: {
        prefix: 'product:',
        ttl: 3600 // 1小时
      },
      category: {
        prefix: 'category:',
        ttl: 7200 // 2小时
      },
      promotion: {
        prefix: 'promotion:',
        ttl: 1800 // 30分钟
      },
      user: {
        prefix: 'user:',
        ttl: 14400 // 4小时
      },
      configuration: {
        prefix: 'config:',
        ttl: 86400 // 24小时
      }
    };
  }

  /**
   * 执行缓存刷新逻辑
   */
  async run() {
    logger.info('开始执行缓存刷新任务');
    
    try {
      // 1. 刷新商品相关缓存
      await this.refreshProductCache();
      
      // 2. 刷新分类缓存
      await this.refreshCategoryCache();
      
      // 3. 刷新促销活动缓存
      await this.refreshPromotionCache();
      
      // 4. 刷新用户相关缓存
      await this.refreshUserCache();
      
      // 5. 刷新系统配置缓存
      await this.refreshConfigurationCache();
      
      // 6. 清理过期缓存
      await this.cleanupExpiredCache();
      
      // 7. 统计缓存状态
      await this.reportCacheStatus();
      
      logger.info('缓存刷新任务执行完成');
      
    } catch (error) {
      logger.error('缓存刷新任务执行失败:', error);
      throw error;
    }
  }

  /**
   * 刷新商品相关缓存
   */
  async refreshProductCache() {
    logger.info('开始刷新商品缓存');
    
    try {
      // 模拟从数据源获取商品数据
      const products = this.generateMockProducts();
      
      // 刷新单个商品缓存
      for (const product of products) {
        const cacheKey = `${this.cacheKeys.product.prefix}${product.productId}`;
        await cacheManager.set(cacheKey, JSON.stringify(product), this.cacheKeys.product.ttl);
      }
      
      // 刷新商品列表缓存
      const productListKey = 'product:list:all';
      await cacheManager.set(productListKey, JSON.stringify(products.map(p => p.productId)), 3600);
      
      // 刷新热门商品缓存
      const hotProducts = products
        .sort((a, b) => (b.sales || 0) - (a.sales || 0))
        .slice(0, 10);
      await cacheManager.set('product:hot', JSON.stringify(hotProducts), 1800);
      
      logger.info(`成功刷新 ${products.length} 个商品缓存`);
      
    } catch (error) {
      logger.error('刷新商品缓存失败:', error);
      throw error;
    }
  }

  /**
   * 刷新分类缓存
   */
  async refreshCategoryCache() {
    logger.info('开始刷新分类缓存');
    
    try {
      // 模拟从数据源获取分类数据
      const categories = this.generateMockCategories();
      
      // 刷新分类缓存
      for (const category of categories) {
        const cacheKey = `${this.cacheKeys.category.prefix}${category.categoryId}`;
        await cacheManager.set(cacheKey, JSON.stringify(category), this.cacheKeys.category.ttl);
      }
      
      // 刷新分类树缓存
      await cacheManager.set('category:tree', JSON.stringify(this.buildCategoryTree(categories)), 7200);
      
      logger.info(`成功刷新 ${categories.length} 个分类缓存`);
      
    } catch (error) {
      logger.error('刷新分类缓存失败:', error);
      throw error;
    }
  }

  /**
   * 刷新促销活动缓存
   */
  async refreshPromotionCache() {
    logger.info('开始刷新促销活动缓存');
    
    try {
      // 模拟从数据源获取促销活动数据
      const promotions = this.generateMockPromotions();
      
      // 只缓存有效的促销活动
      const activePromotions = promotions.filter(p => this.isPromotionActive(p));
      
      // 刷新促销活动缓存
      for (const promotion of activePromotions) {
        const cacheKey = `${this.cacheKeys.promotion.prefix}${promotion.promotionId}`;
        await cacheManager.set(cacheKey, JSON.stringify(promotion), this.cacheKeys.promotion.ttl);
      }
      
      // 刷新进行中的促销活动列表
      await cacheManager.set('promotion:active', JSON.stringify(activePromotions), 1800);
      
      logger.info(`成功刷新 ${activePromotions.length} 个促销活动缓存`);
      
    } catch (error) {
      logger.error('刷新促销活动缓存失败:', error);
      throw error;
    }
  }

  /**
   * 刷新用户相关缓存
   */
  async refreshUserCache() {
    logger.info('开始刷新用户缓存');
    
    try {
      // 模拟从数据源获取活跃用户数据
      const activeUsers = this.generateMockActiveUsers();
      
      // 刷新用户信息缓存（只刷新活跃用户）
      for (const user of activeUsers) {
        const cacheKey = `${this.cacheKeys.user.prefix}${user.userId}`;
        // 只缓存必要的用户信息，避免敏感数据
        const userCacheData = {
          userId: user.userId,
          username: user.username,
          nickname: user.nickname,
          avatar: user.avatar,
          level: user.level
        };
        await cacheManager.set(cacheKey, JSON.stringify(userCacheData), this.cacheKeys.user.ttl);
      }
      
      logger.info(`成功刷新 ${activeUsers.length} 个活跃用户缓存`);
      
    } catch (error) {
      logger.error('刷新用户缓存失败:', error);
      throw error;
    }
  }

  /**
   * 刷新系统配置缓存
   */
  async refreshConfigurationCache() {
    logger.info('开始刷新系统配置缓存');
    
    try {
      // 模拟从数据源获取系统配置
      const configurations = this.generateMockConfigurations();
      
      // 刷新配置缓存
      for (const [key, value] of Object.entries(configurations)) {
        const cacheKey = `${this.cacheKeys.configuration.prefix}${key}`;
        await cacheManager.set(cacheKey, JSON.stringify(value), this.cacheKeys.configuration.ttl);
      }
      
      // 刷新配置列表
      await cacheManager.set('config:list', JSON.stringify(Object.keys(configurations)), 86400);
      
      logger.info(`成功刷新 ${Object.keys(configurations).length} 项系统配置缓存`);
      
    } catch (error) {
      logger.error('刷新系统配置缓存失败:', error);
      throw error;
    }
  }

  /**
   * 清理过期缓存
   */
  async cleanupExpiredCache() {
    logger.info('开始清理过期缓存');
    
    try {
      // 模拟清理过程，实际环境中可能需要更复杂的逻辑
      // 在Redis中，过期键会自动删除，这里只是记录清理日志
      
      // 清理一些特定的临时缓存
      const tempCachePatterns = [
        'temp:*',
        'session:temp:*',
        'preview:*'
      ];
      
      for (const pattern of tempCachePatterns) {
        try {
          // 模拟删除操作
          logger.debug(`清理临时缓存: ${pattern}`);
          // 实际环境中可能需要：await cacheManager.delByPattern(pattern);
        } catch (error) {
          logger.warn(`清理缓存模式 ${pattern} 失败:`, error.message);
        }
      }
      
      logger.info('过期缓存清理完成');
      
    } catch (error) {
      logger.error('清理过期缓存失败:', error);
      // 不抛出异常，以免影响主要功能
    }
  }

  /**
   * 报告缓存状态
   */
  async reportCacheStatus() {
    try {
      // 模拟缓存统计
      const cacheStats = {
        product: { count: 100, size: '~5MB' },
        category: { count: 50, size: '~1MB' },
        promotion: { count: 20, size: '~500KB' },
        user: { count: 500, size: '~10MB' },
        configuration: { count: 100, size: '~500KB' }
      };
      
      logger.info('缓存状态报告:');
      for (const [type, stats] of Object.entries(cacheStats)) {
        logger.info(`  - ${type}: ${stats.count} 项, 约 ${stats.size}`);
      }
      
      // 保存缓存状态到日志文件
      await cacheManager.set('cache:status:latest', JSON.stringify({
        timestamp: new Date().toISOString(),
        stats: cacheStats
      }), 3600);
      
    } catch (error) {
      logger.error('报告缓存状态失败:', error);
      // 不抛出异常，以免影响主要功能
    }
  }

  /**
   * 生成模拟商品数据
   */
  generateMockProducts() {
    const products = [];
    for (let i = 1; i <= 100; i++) {
      products.push({
        productId: `PROD${String(i).padStart(3, '0')}`,
        name: `商品${i}`,
        description: `这是商品${i}的详细描述`,
        price: Math.floor(Math.random() * 900) + 100,
        originalPrice: Math.floor(Math.random() * 500) + 1000,
        categoryId: `CAT${String(Math.floor((i - 1) / 20) + 1).padStart(2, '0')}`,
        stock: Math.floor(Math.random() * 500),
        sales: Math.floor(Math.random() * 1000),
        status: 'active',
        images: [`/images/product${i}.jpg`],
        attributes: {
          color: ['红色', '蓝色', '黑色'][Math.floor(Math.random() * 3)],
          size: ['S', 'M', 'L', 'XL'][Math.floor(Math.random() * 4)]
        },
        createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    return products;
  }

  /**
   * 生成模拟分类数据
   */
  generateMockCategories() {
    const categories = [
      { categoryId: 'CAT01', name: '电子产品', parentId: null, level: 1, sort: 1 },
      { categoryId: 'CAT02', name: '服装鞋帽', parentId: null, level: 1, sort: 2 },
      { categoryId: 'CAT03', name: '家居日用', parentId: null, level: 1, sort: 3 },
      { categoryId: 'CAT04', name: '食品饮料', parentId: null, level: 1, sort: 4 },
      { categoryId: 'CAT05', name: '美妆个护', parentId: null, level: 1, sort: 5 },
      // 二级分类
      { categoryId: 'CAT0101', name: '手机', parentId: 'CAT01', level: 2, sort: 1 },
      { categoryId: 'CAT0102', name: '电脑', parentId: 'CAT01', level: 2, sort: 2 },
      { categoryId: 'CAT0103', name: '数码配件', parentId: 'CAT01', level: 2, sort: 3 },
      { categoryId: 'CAT0201', name: '男装', parentId: 'CAT02', level: 2, sort: 1 },
      { categoryId: 'CAT0202', name: '女装', parentId: 'CAT02', level: 2, sort: 2 },
      { categoryId: 'CAT0203', name: '鞋子', parentId: 'CAT02', level: 2, sort: 3 }
    ];
    return categories;
  }

  /**
   * 构建分类树
   */
  buildCategoryTree(categories) {
    const map = {};
    const tree = [];
    
    // 创建ID到节点的映射
    categories.forEach(category => {
      map[category.categoryId] = { ...category, children: [] };
    });
    
    // 构建树
    categories.forEach(category => {
      if (category.parentId === null) {
        tree.push(map[category.categoryId]);
      } else if (map[category.parentId]) {
        map[category.parentId].children.push(map[category.categoryId]);
      }
    });
    
    return tree;
  }

  /**
   * 生成模拟促销活动数据
   */
  generateMockPromotions() {
    const now = new Date();
    const promotions = [
      {
        promotionId: 'PROMO001',
        name: '限时秒杀',
        type: 'flash_sale',
        discount: 0.5,
        startTime: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(now + 48 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        applicableProducts: ['PROD001', 'PROD002', 'PROD003']
      },
      {
        promotionId: 'PROMO002',
        name: '满减活动',
        type: 'full_reduction',
        condition: 1000,
        reduction: 100,
        startTime: new Date(now - 72 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(now + 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        applicableProducts: [] // 空数组表示全场适用
      },
      {
        promotionId: 'PROMO003',
        name: '新品折扣',
        type: 'discount',
        discount: 0.8,
        startTime: new Date(now).toISOString(),
        endTime: new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        applicableProducts: ['PROD090', 'PROD091', 'PROD092', 'PROD093', 'PROD094', 'PROD095']
      },
      {
        promotionId: 'PROMO004',
        name: '过期活动',
        type: 'discount',
        discount: 0.7,
        startTime: new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'inactive',
        applicableProducts: ['PROD050', 'PROD051']
      }
    ];
    return promotions;
  }

  /**
   * 检查促销活动是否有效
   */
  isPromotionActive(promotion) {
    const now = new Date();
    const startTime = new Date(promotion.startTime);
    const endTime = new Date(promotion.endTime);
    
    return promotion.status === 'active' && 
           now >= startTime && 
           now <= endTime;
  }

  /**
   * 生成模拟活跃用户数据
   */
  generateMockActiveUsers() {
    const users = [];
    for (let i = 1; i <= 100; i++) {
      users.push({
        userId: `USER${String(i).padStart(4, '0')}`,
        username: `user${i}`,
        nickname: `用户${i}`,
        avatar: `/avatars/user${i}.jpg`,
        level: Math.floor(Math.random() * 10) + 1,
        points: Math.floor(Math.random() * 10000),
        lastActiveTime: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString()
      });
    }
    return users;
  }

  /**
   * 生成模拟系统配置
   */
  generateMockConfigurations() {
    return {
      site: {
        name: '测试商城',
        description: '这是一个测试用的电商网站',
        logo: '/images/logo.png',
        favicon: '/images/favicon.ico'
      },
      shipping: {
        freeThreshold: 99,
        defaultFee: 10,
        regions: [
          { name: '北京市', fee: 0 },
          { name: '上海市', fee: 0 },
          { name: '广东省', fee: 5 }
        ]
      },
      payment: {
        methods: ['alipay', 'wechatpay', 'creditcard'],
        timeout: 1800, // 30分钟
        refundDays: 7
      },
      seo: {
        title: '测试商城 - 品质生活从这里开始',
        keywords: '电商,购物,优惠,品质',
        description: '测试商城提供优质的商品和服务，品质生活从这里开始'
      },
      cache: {
        enabled: true,
        defaultTtl: 3600,
        compress: true
      }
    };
  }
}

module.exports = CacheRefreshJob;