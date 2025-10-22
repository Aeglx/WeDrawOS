/**
 * 商品数据仓库
 * 负责商品数据的存取操作
 */

const logger = require('../../../core/utils/logger');
const BaseRepository = require('../../../core/data-access/repositories/BaseRepository');

class ProductRepository extends BaseRepository {
  constructor() {
    super('products'); // 表名
  }
  
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
      // 在实际项目中，这里应该调用数据库查询
      logger.info('获取商品列表:', { query, page, limit, sort });
      
      // 使用模拟数据
      const allProducts = this.getMockProducts(query);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedProducts = allProducts.slice(startIndex, endIndex);
      
      return {
        products: paginatedProducts,
        pagination: {
          page,
          limit,
          total: allProducts.length,
          pages: Math.ceil(allProducts.length / limit)
        }
      };
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
      // 在实际项目中，这里应该调用数据库查询
      logger.info('获取商品详情:', { id });
      
      // 使用模拟数据
      return this.getMockProductById(id);
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
      // 在实际项目中，这里应该调用数据库全文搜索
      logger.info('搜索商品:', { keyword, filters, page, limit, sort });
      
      // 构建搜索查询
      const searchQuery = {
        ...filters,
        keyword
      };
      
      // 使用模拟数据
      const allResults = this.searchMockProducts(searchQuery);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedResults = allResults.slice(startIndex, endIndex);
      
      return {
        products: paginatedResults,
        pagination: {
          page,
          limit,
          total: allResults.length,
          pages: Math.ceil(allResults.length / limit)
        }
      };
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
      // 在实际项目中，这里应该调用数据库查询
      logger.info('获取商品分类');
      
      // 返回模拟分类数据
      return this.getMockCategories();
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
      // 在实际项目中，这里应该调用数据库查询
      logger.info('获取商品品牌:', { category });
      
      // 返回模拟品牌数据
      return this.getMockBrands(category);
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
      // 在实际项目中，这里应该调用数据库查询（基于浏览量、销量等）
      logger.info('获取热门商品:', { limit });
      
      // 返回模拟热门商品数据
      return this.getMockProducts({}).sort((a, b) => b.viewCount - a.viewCount).slice(0, limit);
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
      // 在实际项目中，这里应该调用数据库查询（基于创建时间）
      logger.info('获取新品:', { limit });
      
      // 返回模拟新品数据
      return this.getMockProducts({}).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, limit);
    } catch (error) {
      logger.error('获取新品失败:', error);
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
      // 在实际项目中，这里应该基于商品属性、分类等计算相似度
      logger.info('获取相似商品:', { productId, limit });
      
      // 获取当前商品
      const currentProduct = this.getMockProductById(productId);
      if (!currentProduct) {
        return [];
      }
      
      // 返回相同分类的其他商品作为相似商品
      return this.getMockProducts({ categoryId: currentProduct.categoryId })
        .filter(product => product.id !== productId)
        .slice(0, limit);
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
      // 在实际项目中，这里应该调用数据库查询
      logger.info('获取商品评价:', { productId, query, page, limit });
      
      // 返回模拟评价数据
      const allReviews = this.getMockReviews(productId, query);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedReviews = allReviews.slice(startIndex, endIndex);
      
      return {
        reviews: paginatedReviews,
        pagination: {
          page,
          limit,
          total: allReviews.length,
          pages: Math.ceil(allReviews.length / limit)
        },
        averageRating: this.calculateAverageRating(allReviews)
      };
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
      // 在实际项目中，这里应该调用数据库更新
      logger.info('增加商品浏览次数:', { productId });
      
      // 更新模拟数据
      const product = this.getMockProductById(productId);
      if (product) {
        product.viewCount = (product.viewCount || 0) + 1;
      }
    } catch (error) {
      logger.error(`增加商品浏览次数失败 (ID: ${productId}):`, error);
      throw error;
    }
  }
  
  // 模拟数据管理
  mockProducts = [];
  mockCategories = [];
  mockBrands = [];
  mockReviews = [];
  
  /**
   * 初始化模拟数据
   */
  initializeMockData() {
    // 初始化模拟分类
    this.mockCategories = [
      { id: '1', name: '手机数码', parentId: null },
      { id: '2', name: '电脑办公', parentId: null },
      { id: '3', name: '家用电器', parentId: null },
      { id: '4', name: '服装鞋包', parentId: null },
      { id: '5', name: '美妆护肤', parentId: null }
    ];
    
    // 初始化模拟品牌
    this.mockBrands = [
      { id: '1', name: 'Apple', categoryId: '1' },
      { id: '2', name: 'Samsung', categoryId: '1' },
      { id: '3', name: 'Xiaomi', categoryId: '1' },
      { id: '4', name: 'Dell', categoryId: '2' },
      { id: '5', name: 'HP', categoryId: '2' },
      { id: '6', name: 'Sony', categoryId: '3' },
      { id: '7', name: 'Nike', categoryId: '4' },
      { id: '8', name: 'Adidas', categoryId: '4' },
      { id: '9', name: 'L\'Oreal', categoryId: '5' }
    ];
    
    // 初始化模拟商品
    this.mockProducts = [
      {
        id: '1',
        name: 'iPhone 15 Pro',
        description: '最新款iPhone，搭载A17 Pro芯片',
        price: 7999,
        originalPrice: 8999,
        stock: 100,
        categoryId: '1',
        brandId: '1',
        images: ['/uploads/iphone15pro-1.jpg', '/uploads/iphone15pro-2.jpg'],
        colors: ['深空黑', '原色钛金属', '白色钛金属', '蓝色钛金属'],
        specs: [{ name: '内存', options: ['128GB', '256GB', '512GB', '1TB'] }],
        isHot: true,
        isNew: true,
        viewCount: 1567,
        salesCount: 432,
        rating: 4.8,
        reviewCount: 125,
        createdAt: '2024-01-15T00:00:00Z'
      },
      {
        id: '2',
        name: 'Samsung Galaxy S24 Ultra',
        description: '三星旗舰手机，配备S Pen',
        price: 9699,
        originalPrice: 9699,
        stock: 85,
        categoryId: '1',
        brandId: '2',
        images: ['/uploads/samsungs24ultra-1.jpg'],
        colors: ['钛灰色', '钛黑色', '钛紫色', '钛黄色'],
        specs: [{ name: '内存', options: ['256GB', '512GB', '1TB'] }],
        isHot: true,
        isNew: true,
        viewCount: 1345,
        salesCount: 321,
        rating: 4.7,
        reviewCount: 89,
        createdAt: '2024-01-20T00:00:00Z'
      },
      {
        id: '3',
        name: 'Dell XPS 13',
        description: '超轻薄笔记本，无边触控屏',
        price: 8999,
        originalPrice: 9999,
        stock: 67,
        categoryId: '2',
        brandId: '4',
        images: ['/uploads/dellxps13-1.jpg'],
        colors: ['银色', '黑色'],
        specs: [
          { name: '处理器', options: ['i5-1335U', 'i7-1355U'] },
          { name: '内存', options: ['8GB', '16GB', '32GB'] },
          { name: '存储', options: ['256GB', '512GB', '1TB'] }
        ],
        isHot: true,
        isNew: false,
        viewCount: 987,
        salesCount: 156,
        rating: 4.6,
        reviewCount: 67,
        createdAt: '2023-12-10T00:00:00Z'
      }
    ];
    
    // 初始化模拟评价
    this.mockReviews = [
      {
        id: '1',
        productId: '1',
        userId: '101',
        username: '张三',
        rating: 5,
        content: '非常好用，拍照效果很棒！',
        images: [],
        createdAt: '2024-01-18T00:00:00Z'
      },
      {
        id: '2',
        productId: '1',
        userId: '102',
        username: '李四',
        rating: 4,
        content: '整体不错，就是价格有点高',
        images: [],
        createdAt: '2024-01-19T00:00:00Z'
      }
    ];
  }
  
  /**
   * 获取模拟商品列表
   * @param {Object} query - 查询条件
   * @returns {Array} 商品列表
   */
  getMockProducts(query = {}) {
    if (this.mockProducts.length === 0) {
      this.initializeMockData();
    }
    
    return this.mockProducts.filter(product => {
      for (const [key, value] of Object.entries(query)) {
        if (key === 'keyword' && value) {
          const lowerKeyword = value.toLowerCase();
          if (!product.name.toLowerCase().includes(lowerKeyword) && 
              !product.description.toLowerCase().includes(lowerKeyword)) {
            return false;
          }
        } else if (product[key] !== value) {
          return false;
        }
      }
      return true;
    });
  }
  
  /**
   * 搜索模拟商品
   * @param {Object} searchQuery - 搜索条件
   * @returns {Array} 搜索结果
   */
  searchMockProducts(searchQuery = {}) {
    const { keyword, ...filters } = searchQuery;
    
    return this.mockProducts.filter(product => {
      // 关键词搜索
      if (keyword) {
        const lowerKeyword = keyword.toLowerCase();
        if (!product.name.toLowerCase().includes(lowerKeyword) && 
            !product.description.toLowerCase().includes(lowerKeyword)) {
          return false;
        }
      }
      
      // 筛选条件
      for (const [key, value] of Object.entries(filters)) {
        if (product[key] !== value) {
          return false;
        }
      }
      
      return true;
    });
  }
  
  /**
   * 通过ID获取模拟商品
   * @param {string} id - 商品ID
   * @returns {Object|null} 商品对象或null
   */
  getMockProductById(id) {
    if (this.mockProducts.length === 0) {
      this.initializeMockData();
    }
    
    return this.mockProducts.find(product => product.id === id) || null;
  }
  
  /**
   * 获取模拟分类列表
   * @returns {Array} 分类列表
   */
  getMockCategories() {
    if (this.mockCategories.length === 0) {
      this.initializeMockData();
    }
    return this.mockCategories;
  }
  
  /**
   * 获取模拟品牌列表
   * @param {string} categoryId - 分类ID（可选）
   * @returns {Array} 品牌列表
   */
  getMockBrands(categoryId = null) {
    if (this.mockBrands.length === 0) {
      this.initializeMockData();
    }
    
    if (categoryId) {
      return this.mockBrands.filter(brand => brand.categoryId === categoryId);
    }
    return this.mockBrands;
  }
  
  /**
   * 获取模拟评价列表
   * @param {string} productId - 商品ID
   * @param {Object} query - 查询条件
   * @returns {Array} 评价列表
   */
  getMockReviews(productId, query = {}) {
    if (this.mockReviews.length === 0) {
      this.initializeMockData();
    }
    
    return this.mockReviews
      .filter(review => review.productId === productId)
      .filter(review => {
        for (const [key, value] of Object.entries(query)) {
          if (review[key] !== value) {
            return false;
          }
        }
        return true;
      });
  }
  
  /**
   * 计算平均评分
   * @param {Array} reviews - 评价列表
   * @returns {number} 平均评分
   */
  calculateAverageRating(reviews) {
    if (reviews.length === 0) {
      return 0;
    }
    
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return Math.round((sum / reviews.length) * 10) / 10;
  }
}

module.exports = new ProductRepository();