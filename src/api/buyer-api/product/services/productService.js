/**
 * 商品服务层
 * 处理商品相关的业务逻辑
 */

const logger = require('../../../core/utils/logger');
const productRepository = require('../repositories/productRepository');
const cacheService = require('../../../core/cache/cacheService');
const messageQueue = require('../../../core/messaging/messageQueue');

class ProductService {
  /**
   * 获取商品列表
   * @param {Object} query - 查询参数
   * @param {number} page - 页码
   * @param {number} limit - 每页数量
   * @param {string} sort - 排序方式
   * @returns {Promise<Object>} 商品列表和分页信息
   */
  async getProducts(query, page = 1, limit = 10, sort = 'createdAt:desc') {
    try {
      // 构建缓存键
      const cacheKey = `products:list:${JSON.stringify(query)}:${page}:${limit}:${sort}`;
      
      // 尝试从缓存获取
      const cachedData = await cacheService.get(cacheKey);
      if (cachedData) {
        return cachedData;
      }
      
      // 从数据库获取商品列表
      const result = await productRepository.getProducts(query, page, limit, sort);
      
      // 缓存结果（5分钟）
      await cacheService.set(cacheKey, result, 300);
      
      return result;
    } catch (error) {
      logger.error('获取商品列表失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取商品详情
   * @param {string} id - 商品ID
   * @returns {Promise<Object|null>} 商品对象或null
   */
  async getProductById(id) {
    try {
      // 构建缓存键
      const cacheKey = `products:detail:${id}`;
      
      // 尝试从缓存获取
      const cachedProduct = await cacheService.get(cacheKey);
      if (cachedProduct) {
        // 更新商品浏览次数（异步，不阻塞返回）
        this.incrementViewCount(id).catch(err => {
          logger.warn(`更新商品浏览次数失败 (ID: ${id}):`, err);
        });
        
        return cachedProduct;
      }
      
      // 从数据库获取商品详情
      const product = await productRepository.getProductById(id);
      
      if (product) {
        // 缓存商品详情（10分钟）
        await cacheService.set(cacheKey, product, 600);
        
        // 更新商品浏览次数（异步，不阻塞返回）
        this.incrementViewCount(id).catch(err => {
          logger.warn(`更新商品浏览次数失败 (ID: ${id}):`, err);
        });
      }
      
      return product;
    } catch (error) {
      logger.error(`获取商品详情失败 (ID: ${id}):`, error);
      throw error;
    }
  }
  
  /**
   * 搜索商品
   * @param {string} keyword - 搜索关键词
   * @param {Object} filters - 筛选条件
   * @param {number} page - 页码
   * @param {number} limit - 每页数量
   * @param {string} sort - 排序方式
   * @returns {Promise<Object>} 搜索结果和分页信息
   */
  async searchProducts(keyword, filters = {}, page = 1, limit = 10, sort = 'relevance:desc') {
    try {
      // 构建缓存键
      const cacheKey = `products:search:${keyword}:${JSON.stringify(filters)}:${page}:${limit}:${sort}`;
      
      // 尝试从缓存获取
      const cachedResult = await cacheService.get(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }
      
      // 执行搜索
      const result = await productRepository.searchProducts(keyword, filters, page, limit, sort);
      
      // 缓存搜索结果（3分钟）
      await cacheService.set(cacheKey, result, 180);
      
      // 发送搜索记录到消息队列（用于搜索分析）
      messageQueue.publish('search.analytics', {
        keyword,
        filters,
        resultsCount: result.total,
        timestamp: new Date().toISOString()
      });
      
      return result;
    } catch (error) {
      logger.error('搜索商品失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取商品分类
   * @returns {Promise<Array>} 分类列表
   */
  async getCategories() {
    try {
      const cacheKey = 'products:categories';
      
      // 尝试从缓存获取
      const cachedCategories = await cacheService.get(cacheKey);
      if (cachedCategories) {
        return cachedCategories;
      }
      
      // 从数据库获取分类
      const categories = await productRepository.getCategories();
      
      // 缓存分类（1小时）
      await cacheService.set(cacheKey, categories, 3600);
      
      return categories;
    } catch (error) {
      logger.error('获取商品分类失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取商品品牌
   * @param {string} category - 分类ID（可选）
   * @returns {Promise<Array>} 品牌列表
   */
  async getBrands(category = null) {
    try {
      const cacheKey = category ? `products:brands:${category}` : 'products:brands:all';
      
      // 尝试从缓存获取
      const cachedBrands = await cacheService.get(cacheKey);
      if (cachedBrands) {
        return cachedBrands;
      }
      
      // 从数据库获取品牌
      const brands = await productRepository.getBrands(category);
      
      // 缓存品牌（30分钟）
      await cacheService.set(cacheKey, brands, 1800);
      
      return brands;
    } catch (error) {
      logger.error('获取商品品牌失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取热门商品
   * @param {number} limit - 返回数量
   * @returns {Promise<Array>} 热门商品列表
   */
  async getHotProducts(limit = 10) {
    try {
      const cacheKey = `products:hot:${limit}`;
      
      // 尝试从缓存获取
      const cachedProducts = await cacheService.get(cacheKey);
      if (cachedProducts) {
        return cachedProducts;
      }
      
      // 从数据库获取热门商品
      const products = await productRepository.getHotProducts(limit);
      
      // 缓存热门商品（15分钟）
      await cacheService.set(cacheKey, products, 900);
      
      return products;
    } catch (error) {
      logger.error('获取热门商品失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取新品
   * @param {number} limit - 返回数量
   * @returns {Promise<Array>} 新品列表
   */
  async getNewArrivals(limit = 10) {
    try {
      const cacheKey = `products:new:${limit}`;
      
      // 尝试从缓存获取
      const cachedProducts = await cacheService.get(cacheKey);
      if (cachedProducts) {
        return cachedProducts;
      }
      
      // 从数据库获取新品
      const products = await productRepository.getNewArrivals(limit);
      
      // 缓存新品（10分钟）
      await cacheService.set(cacheKey, products, 600);
      
      return products;
    } catch (error) {
      logger.error('获取新品失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取推荐商品
   * @param {string} productId - 当前商品ID（可选）
   * @param {string} userId - 用户ID（可选）
   * @param {number} limit - 返回数量
   * @returns {Promise<Array>} 推荐商品列表
   */
  async getRecommendedProducts(productId = null, userId = null, limit = 10) {
    try {
      // 如果有用户ID，尝试个性化推荐
      if (userId) {
        return this.getPersonalizedRecommendations(userId, limit);
      }
      
      // 如果有商品ID，推荐相似商品
      if (productId) {
        return this.getSimilarProducts(productId, limit);
      }
      
      // 默认返回热门商品
      return this.getHotProducts(limit);
    } catch (error) {
      logger.error('获取推荐商品失败:', error);
      // 出错时返回热门商品作为降级方案
      return this.getHotProducts(limit);
    }
  }
  
  /**
   * 获取个性化推荐商品
   * @param {string} userId - 用户ID
   * @param {number} limit - 返回数量
   * @returns {Promise<Array>} 推荐商品列表
   */
  async getPersonalizedRecommendations(userId, limit = 10) {
    try {
      // 构建缓存键
      const cacheKey = `recommendations:user:${userId}:${limit}`;
      
      // 尝试从缓存获取
      const cachedRecommendations = await cacheService.get(cacheKey);
      if (cachedRecommendations) {
        return cachedRecommendations;
      }
      
      // TODO: 实现基于用户历史行为的个性化推荐算法
      // 这里使用热门商品作为替代
      const recommendations = await this.getHotProducts(limit);
      
      // 缓存推荐结果（30分钟）
      await cacheService.set(cacheKey, recommendations, 1800);
      
      return recommendations;
    } catch (error) {
      logger.error(`获取个性化推荐失败 (用户ID: ${userId}):`, error);
      throw error;
    }
  }
  
  /**
   * 获取相似商品
   * @param {string} productId - 商品ID
   * @param {number} limit - 返回数量
   * @returns {Promise<Array>} 相似商品列表
   */
  async getSimilarProducts(productId, limit = 10) {
    try {
      // 构建缓存键
      const cacheKey = `recommendations:similar:${productId}:${limit}`;
      
      // 尝试从缓存获取
      const cachedRecommendations = await cacheService.get(cacheKey);
      if (cachedRecommendations) {
        return cachedRecommendations;
      }
      
      // 从数据库获取相似商品
      const similarProducts = await productRepository.getSimilarProducts(productId, limit);
      
      // 缓存相似商品（1小时）
      await cacheService.set(cacheKey, similarProducts, 3600);
      
      return similarProducts;
    } catch (error) {
      logger.error(`获取相似商品失败 (ID: ${productId}):`, error);
      throw error;
    }
  }
  
  /**
   * 获取商品评价
   * @param {string} productId - 商品ID
   * @param {Object} query - 查询参数
   * @param {number} page - 页码
   * @param {number} limit - 每页数量
   * @returns {Promise<Object>} 评价列表和分页信息
   */
  async getProductReviews(productId, query = {}, page = 1, limit = 10) {
    try {
      // 构建缓存键
      const cacheKey = `products:reviews:${productId}:${JSON.stringify(query)}:${page}:${limit}`;
      
      // 尝试从缓存获取
      const cachedReviews = await cacheService.get(cacheKey);
      if (cachedReviews) {
        return cachedReviews;
      }
      
      // 从数据库获取评价
      const reviews = await productRepository.getProductReviews(productId, query, page, limit);
      
      // 缓存评价（5分钟）
      await cacheService.set(cacheKey, reviews, 300);
      
      return reviews;
    } catch (error) {
      logger.error(`获取商品评价失败 (ID: ${productId}):`, error);
      throw error;
    }
  }
  
  /**
   * 增加商品浏览次数
   * @param {string} productId - 商品ID
   * @returns {Promise<void>}
   */
  async incrementViewCount(productId) {
    try {
      await productRepository.incrementViewCount(productId);
      
      // 清除缓存
      const cacheKey = `products:detail:${productId}`;
      await cacheService.delete(cacheKey);
      
      // 发送浏览事件到消息队列
      messageQueue.publish('product.view', {
        productId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error(`增加商品浏览次数失败 (ID: ${productId}):`, error);
      throw error;
    }
  }
}

module.exports = new ProductService();