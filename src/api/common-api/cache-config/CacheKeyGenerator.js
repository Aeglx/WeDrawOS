/**
 * 缓存键生成器
 * 提供统一的缓存键设计和管理
 */

const crypto = require('crypto');
const logger = require('@core/utils/logger');

/**
 * 缓存键生成器类
 */
class CacheKeyGenerator {
  constructor() {
    this.logger = logger;
    
    // 缓存键前缀定义
    this.prefixes = {
      // 基础数据前缀
      USER: 'user:',
      PRODUCT: 'product:',
      CATEGORY: 'category:',
      ORDER: 'order:',
      SHOP: 'shop:',
      
      // 集合数据前缀
      USERS: 'users:',
      PRODUCTS: 'products:',
      CATEGORIES: 'categories:',
      ORDERS: 'orders:',
      SHOPS: 'shops:',
      
      // 统计数据前缀
      STATS: 'stats:',
      DASHBOARD: 'dashboard:',
      
      // 配置前缀
      CONFIG: 'config:',
      SETTINGS: 'settings:',
      
      // 临时数据前缀
      TEMP: 'temp:',
      SESSION: 'session:',
      
      // 搜索前缀
      SEARCH: 'search:',
      SUGGESTION: 'suggestion:',
      
      // 权限前缀
      PERMISSION: 'permission:',
      ROLE: 'role:',
      
      // 限流前缀
      RATE_LIMIT: 'rate_limit:',
      
      // 锁前缀
      LOCK: 'lock:',
      
      // 消息前缀
      MESSAGE: 'message:',
      NOTIFICATION: 'notification:'
    };
    
    // 缓存过期时间定义（秒）
    this.expiration = {
      // 短期缓存
      VERY_SHORT: 10,           // 10秒
      SHORT: 60,                // 1分钟
      MEDIUM_SHORT: 300,        // 5分钟
      
      // 中期缓存
      MEDIUM: 1800,             // 30分钟
      MEDIUM_LONG: 3600,        // 1小时
      
      // 长期缓存
      LONG: 7200,               // 2小时
      VERY_LONG: 86400,         // 1天
      EXTREMELY_LONG: 604800,   // 7天
      
      // 特殊缓存
      NEVER: null,              // 永不过期
      SESSION: 1800,            // 30分钟会话
      
      // 业务特定过期时间
      USER_PROFILE: 1800,       // 用户资料 30分钟
      PRODUCT_DETAIL: 3600,     // 商品详情 1小时
      CATEGORY_LIST: 7200,      // 分类列表 2小时
      ORDER_STATUS: 600,        // 订单状态 10分钟
      CONFIGURATION: 86400,     // 系统配置 1天
      STATISTICS: 300           // 统计数据 5分钟
    };
    
    this.logger.info('缓存键生成器初始化完成');
  }

  /**
   * 获取缓存键前缀
   * @param {string} prefixName - 前缀名称
   * @returns {string} 前缀字符串
   */
  getPrefix(prefixName) {
    return this.prefixes[prefixName] || '';
  }

  /**
   * 获取缓存过期时间
   * @param {string|number} expirationName - 过期时间名称或秒数
   * @returns {number|null} 过期时间（秒）
   */
  getExpiration(expirationName) {
    if (typeof expirationName === 'number') {
      return expirationName;
    }
    return this.expiration[expirationName] || this.expiration.MEDIUM;
  }

  /**
   * 生成基础缓存键
   * @param {string} prefix - 键前缀
   * @param {string|number} id - 标识符
   * @returns {string} 缓存键
   */
  generateKey(prefix, id) {
    return `${prefix}${id}`;
  }

  /**
   * 生成用户相关缓存键
   * @param {string|number} userId - 用户ID
   * @param {string} suffix - 可选的后缀
   * @returns {string} 用户缓存键
   */
  generateUserKey(userId, suffix = '') {
    const baseKey = this.generateKey(this.prefixes.USER, userId);
    return suffix ? `${baseKey}:${suffix}` : baseKey;
  }

  /**
   * 生成商品相关缓存键
   * @param {string|number} productId - 商品ID
   * @param {string} suffix - 可选的后缀
   * @returns {string} 商品缓存键
   */
  generateProductKey(productId, suffix = '') {
    const baseKey = this.generateKey(this.prefixes.PRODUCT, productId);
    return suffix ? `${baseKey}:${suffix}` : baseKey;
  }

  /**
   * 生成分类相关缓存键
   * @param {string|number} categoryId - 分类ID
   * @param {string} suffix - 可选的后缀
   * @returns {string} 分类缓存键
   */
  generateCategoryKey(categoryId, suffix = '') {
    const baseKey = this.generateKey(this.prefixes.CATEGORY, categoryId);
    return suffix ? `${baseKey}:${suffix}` : baseKey;
  }

  /**
   * 生成订单相关缓存键
   * @param {string|number} orderId - 订单ID
   * @param {string} suffix - 可选的后缀
   * @returns {string} 订单缓存键
   */
  generateOrderKey(orderId, suffix = '') {
    const baseKey = this.generateKey(this.prefixes.ORDER, orderId);
    return suffix ? `${baseKey}:${suffix}` : baseKey;
  }

  /**
   * 生成搜索相关缓存键
   * @param {string} keyword - 搜索关键词
   * @param {Object} filters - 过滤条件
   * @returns {string} 搜索缓存键
   */
  generateSearchKey(keyword, filters = {}) {
    // 生成过滤条件的哈希值
    const filtersHash = this._generateHash(JSON.stringify(filters));
    return `${this.prefixes.SEARCH}${keyword}:${filtersHash}`;
  }

  /**
   * 生成列表缓存键
   * @param {string} prefix - 列表前缀
   * @param {Object} params - 查询参数
   * @returns {string} 列表缓存键
   */
  generateListKey(prefix, params = {}) {
    const { page = 1, pageSize = 20, sortBy = 'id', order = 'desc', ...filters } = params;
    
    // 生成过滤条件的哈希值
    const filtersHash = this._generateHash(JSON.stringify(filters));
    
    return `${prefix}list:p${page}:s${pageSize}:${sortBy}:${order}:${filtersHash}`;
  }

  /**
   * 生成用户列表缓存键
   * @param {Object} params - 查询参数
   * @returns {string} 用户列表缓存键
   */
  generateUserListKey(params = {}) {
    return this.generateListKey(this.prefixes.USERS, params);
  }

  /**
   * 生成商品列表缓存键
   * @param {Object} params - 查询参数
   * @returns {string} 商品列表缓存键
   */
  generateProductListKey(params = {}) {
    return this.generateListKey(this.prefixes.PRODUCTS, params);
  }

  /**
   * 生成订单列表缓存键
   * @param {Object} params - 查询参数
   * @returns {string} 订单列表缓存键
   */
  generateOrderListKey(params = {}) {
    return this.generateListKey(this.prefixes.ORDERS, params);
  }

  /**
   * 生成配置缓存键
   * @param {string} configKey - 配置键名
   * @returns {string} 配置缓存键
   */
  generateConfigKey(configKey) {
    return `${this.prefixes.CONFIG}${configKey}`;
  }

  /**
   * 生成统计数据缓存键
   * @param {string} statType - 统计类型
   * @param {Object} params - 统计参数
   * @returns {string} 统计数据缓存键
   */
  generateStatsKey(statType, params = {}) {
    const paramsHash = this._generateHash(JSON.stringify(params));
    return `${this.prefixes.STATS}${statType}:${paramsHash}`;
  }

  /**
   * 生成会话缓存键
   * @param {string} sessionId - 会话ID
   * @returns {string} 会话缓存键
   */
  generateSessionKey(sessionId) {
    return `${this.prefixes.SESSION}${sessionId}`;
  }

  /**
   * 生成速率限制缓存键
   * @param {string} key - 限流键（如IP地址或用户ID）
   * @param {string} endpoint - API端点
   * @returns {string} 速率限制缓存键
   */
  generateRateLimitKey(key, endpoint = '') {
    return endpoint 
      ? `${this.prefixes.RATE_LIMIT}${key}:${endpoint}`
      : `${this.prefixes.RATE_LIMIT}${key}`;
  }

  /**
   * 生成分布式锁缓存键
   * @param {string} resource - 资源名称
   * @param {string} id - 资源ID
   * @returns {string} 分布式锁缓存键
   */
  generateLockKey(resource, id) {
    return `${this.prefixes.LOCK}${resource}:${id}`;
  }

  /**
   * 生成通知缓存键
   * @param {string|number} userId - 用户ID
   * @param {string} type - 通知类型
   * @returns {string} 通知缓存键
   */
  generateNotificationKey(userId, type = 'all') {
    return `${this.prefixes.NOTIFICATION}${userId}:${type}`;
  }

  /**
   * 解析缓存键
   * @param {string} key - 缓存键
   * @returns {Object} 解析后的键信息
   */
  parseKey(key) {
    for (const [prefixName, prefix] of Object.entries(this.prefixes)) {
      if (key.startsWith(prefix)) {
        const suffix = key.substring(prefix.length);
        
        return {
          prefix: prefixName,
          fullPrefix: prefix,
          suffix,
          key
        };
      }
    }
    
    return {
      prefix: 'unknown',
      fullPrefix: '',
      suffix: key,
      key
    };
  }

  /**
   * 生成缓存键模式
   * @param {string} prefix - 前缀
   * @param {string} pattern - 模式
   * @returns {string} 缓存键模式
   */
  generatePattern(prefix, pattern = '*') {
    return `${prefix}${pattern}`;
  }

  /**
   * 批量生成缓存键
   * @param {string} prefix - 前缀
   * @param {Array} ids - ID数组
   * @returns {Array} 缓存键数组
   */
  generateKeys(prefix, ids) {
    return ids.map(id => this.generateKey(prefix, id));
  }

  /**
   * 生成哈希值
   * @private
   * @param {string} data - 要哈希的数据
   * @returns {string} 哈希值
   */
  _generateHash(data) {
    return crypto
      .createHash('md5')
      .update(data)
      .digest('hex');
  }

  /**
   * 获取缓存策略建议
   * @param {string} dataType - 数据类型
   * @returns {Object} 缓存策略建议
   */
  getCacheStrategy(dataType) {
    const strategies = {
      userProfile: {
        expiration: this.expiration.USER_PROFILE,
        keyGenerator: (userId) => this.generateUserKey(userId, 'profile'),
        description: '用户资料缓存，过期时间30分钟'
      },
      productDetail: {
        expiration: this.expiration.PRODUCT_DETAIL,
        keyGenerator: (productId) => this.generateProductKey(productId),
        description: '商品详情缓存，过期时间1小时'
      },
      categoryList: {
        expiration: this.expiration.CATEGORY_LIST,
        keyGenerator: () => this.generateCategoryKey('all'),
        description: '分类列表缓存，过期时间2小时'
      },
      orderStatus: {
        expiration: this.expiration.ORDER_STATUS,
        keyGenerator: (orderId) => this.generateOrderKey(orderId, 'status'),
        description: '订单状态缓存，过期时间10分钟'
      },
      configuration: {
        expiration: this.expiration.CONFIGURATION,
        keyGenerator: (configKey) => this.generateConfigKey(configKey),
        description: '系统配置缓存，过期时间1天'
      },
      statistics: {
        expiration: this.expiration.STATISTICS,
        keyGenerator: (statType, params) => this.generateStatsKey(statType, params),
        description: '统计数据缓存，过期时间5分钟'
      }
    };
    
    return strategies[dataType] || {
      expiration: this.expiration.MEDIUM,
      keyGenerator: (id) => this.generateKey(this.prefixes.TEMP, id),
      description: '默认缓存策略，过期时间30分钟'
    };
  }
}

// 创建单例实例
const cacheKeyGenerator = new CacheKeyGenerator();

module.exports = cacheKeyGenerator;