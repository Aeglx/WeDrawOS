/**
 * 商品控制器
 * 处理商品相关的HTTP请求
 */

const logger = require('../../../core/utils/logger');
const productService = require('../services/productService');
const { responseHandler } = require('../../../core/utils/responseHandler');
const messageQueue = require('../../../core/messaging/messageQueue');

class ProductController {
  /**
   * 获取商品列表
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - 下一个中间件函数
   */
  async getProducts(req, res, next) {
    try {
      const { page = 1, limit = 10, sort = 'createdAt:desc', category, brand, minPrice, maxPrice, keyword } = req.query;
      
      const query = {};
      if (category) query.category = category;
      if (brand) query.brand = brand;
      if (minPrice) query.minPrice = parseFloat(minPrice);
      if (maxPrice) query.maxPrice = parseFloat(maxPrice);
      if (keyword) query.keyword = keyword;
      
      const result = await productService.getProducts(query, parseInt(page), parseInt(limit), sort);
      
      // 记录商品浏览日志到消息队列
      messageQueue.publish('product.view.log', {
        userId: req.user?.id || 'anonymous',
        action: 'list_view',
        query: req.query,
        timestamp: new Date().toISOString()
      });
      
      return responseHandler.success(res, result);
    } catch (error) {
      logger.error('获取商品列表失败:', error);
      return responseHandler.error(res, error);
    }
  }
  
  /**
   * 获取商品详情
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - 下一个中间件函数
   */
  async getProductById(req, res, next) {
    try {
      const { id } = req.params;
      const product = await productService.getProductById(id);
      
      if (!product) {
        return responseHandler.notFound(res, '商品不存在');
      }
      
      // 记录商品详情浏览到消息队列
      messageQueue.publish('product.view.log', {
        userId: req.user?.id || 'anonymous',
        productId: id,
        action: 'detail_view',
        timestamp: new Date().toISOString()
      });
      
      return responseHandler.success(res, product);
    } catch (error) {
      logger.error(`获取商品详情失败 (ID: ${req.params.id}):`, error);
      return responseHandler.error(res, error);
    }
  }
  
  /**
   * 搜索商品
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - 下一个中间件函数
   */
  async searchProducts(req, res, next) {
    try {
      const { keyword, page = 1, limit = 10, sort = 'relevance:desc', filters } = req.query;
      
      if (!keyword) {
        return responseHandler.badRequest(res, '搜索关键词不能为空');
      }
      
      const filterObject = filters ? JSON.parse(filters) : {};
      
      const result = await productService.searchProducts(
        keyword,
        filterObject,
        parseInt(page),
        parseInt(limit),
        sort
      );
      
      // 记录搜索日志到消息队列
      messageQueue.publish('product.search.log', {
        userId: req.user?.id || 'anonymous',
        keyword,
        filters: filterObject,
        timestamp: new Date().toISOString()
      });
      
      return responseHandler.success(res, result);
    } catch (error) {
      if (error instanceof SyntaxError && error.message.includes('Unexpected token')) {
        return responseHandler.badRequest(res, '筛选条件格式不正确');
      }
      
      logger.error('搜索商品失败:', error);
      return responseHandler.error(res, error);
    }
  }
  
  /**
   * 获取商品分类
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - 下一个中间件函数
   */
  async getCategories(req, res, next) {
    try {
      const categories = await productService.getCategories();
      return responseHandler.success(res, categories);
    } catch (error) {
      logger.error('获取商品分类失败:', error);
      return responseHandler.error(res, error);
    }
  }
  
  /**
   * 获取商品品牌
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - 下一个中间件函数
   */
  async getBrands(req, res, next) {
    try {
      const { category } = req.query;
      const brands = await productService.getBrands(category);
      return responseHandler.success(res, brands);
    } catch (error) {
      logger.error('获取商品品牌失败:', error);
      return responseHandler.error(res, error);
    }
  }
  
  /**
   * 获取热门商品
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - 下一个中间件函数
   */
  async getHotProducts(req, res, next) {
    try {
      const { limit = 10 } = req.query;
      const products = await productService.getHotProducts(parseInt(limit));
      return responseHandler.success(res, products);
    } catch (error) {
      logger.error('获取热门商品失败:', error);
      return responseHandler.error(res, error);
    }
  }
  
  /**
   * 获取新品
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - 下一个中间件函数
   */
  async getNewArrivals(req, res, next) {
    try {
      const { limit = 10 } = req.query;
      const products = await productService.getNewArrivals(parseInt(limit));
      return responseHandler.success(res, products);
    } catch (error) {
      logger.error('获取新品失败:', error);
      return responseHandler.error(res, error);
    }
  }
  
  /**
   * 获取推荐商品
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - 下一个中间件函数
   */
  async getRecommendedProducts(req, res, next) {
    try {
      const { productId, limit = 10 } = req.query;
      
      const products = await productService.getRecommendedProducts(
        productId,
        req.user?.id,
        parseInt(limit)
      );
      
      return responseHandler.success(res, products);
    } catch (error) {
      logger.error('获取推荐商品失败:', error);
      return responseHandler.error(res, error);
    }
  }
  
  /**
   * 获取商品评价
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - 下一个中间件函数
   */
  async getProductReviews(req, res, next) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10, rating } = req.query;
      
      const query = {};
      if (rating) query.rating = parseInt(rating);
      
      const result = await productService.getProductReviews(
        id,
        query,
        parseInt(page),
        parseInt(limit)
      );
      
      return responseHandler.success(res, result);
    } catch (error) {
      logger.error(`获取商品评价失败 (ID: ${req.params.id}):`, error);
      return responseHandler.error(res, error);
    }
  }
}

module.exports = new ProductController();