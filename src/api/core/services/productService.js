/**
 * 产品服务模块
 * 负责产品管理相关的业务逻辑
 */

// 导入依赖
const config = require('../config/config');
const logger = require('../logging/logger');
const {
  AppError,
  ValidationError,
  DatabaseError
} = require('../errors/appError');
const stringUtils = require('../utils/stringUtils');
const arrayUtils = require('../utils/arrayUtils');

/**
 * 产品服务类
 */
class ProductService {
  constructor(di) {
    this.di = di;
    this.productRepository = di.get('productRepository');
    this.categoryRepository = di.get('categoryRepository');
    this.fileUploadService = di.get('fileUploadService');
  }

  /**
   * 创建新产品
   * @param {Object} productData - 产品数据
   * @param {Array} files - 产品图片文件
   * @returns {Promise<Object>} 创建的产品信息
   */
  async createProduct(productData, files = []) {
    try {
      // 验证产品数据
      const validationError = this._validateProductData(productData);
      if (validationError) {
        throw validationError;
      }

      // 验证分类是否存在
      if (productData.category_id) {
        const category = await this.categoryRepository.findById(productData.category_id);
        if (!category) {
          throw AppError.notFound('Category not found', 'CATEGORY_NOT_FOUND');
        }
      }

      // 上传产品图片
      const imageUrls = [];
      if (files && files.length > 0) {
        for (const file of files) {
          const uploadResult = await this.fileUploadService.saveFile(file, {
            directory: 'products',
            allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
          });
          imageUrls.push(uploadResult.fileUrl);
        }
      }

      // 准备产品数据
      const newProduct = {
        name: productData.name,
        description: productData.description,
        price: parseFloat(productData.price),
        discount_price: productData.discount_price ? parseFloat(productData.discount_price) : null,
        stock_quantity: parseInt(productData.stock_quantity, 10),
        category_id: productData.category_id,
        brand: productData.brand,
        sku: productData.sku || this._generateSku(productData.name),
        images: imageUrls,
        is_active: productData.is_active !== undefined ? productData.is_active : true,
        featured: productData.featured || false,
        attributes: productData.attributes || {},
        created_by: productData.created_by,
        created_at: new Date(),
        updated_at: new Date()
      };

      // 保存产品
      const createdProduct = await this.productRepository.create(newProduct);

      logger.info('Product created successfully', { productId: createdProduct.id, name: createdProduct.name });

      return this._formatProductResponse(createdProduct);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error creating product', error);
      throw AppError.internalError('Failed to create product');
    }
  }

  /**
   * 获取产品详情
   * @param {number} productId - 产品ID
   * @returns {Promise<Object>} 产品详情
   */
  async getProductById(productId) {
    try {
      const product = await this.productRepository.findById(productId);
      if (!product) {
        throw AppError.notFound('Product not found', 'PRODUCT_NOT_FOUND');
      }

      // 获取完整的产品信息，包括分类等关联数据
      const fullProduct = await this.productRepository.getProductWithDetails(productId);

      return this._formatProductResponse(fullProduct);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error fetching product', error);
      throw AppError.internalError('Failed to fetch product');
    }
  }

  /**
   * 更新产品信息
   * @param {number} productId - 产品ID
   * @param {Object} updateData - 更新数据
   * @param {Array} files - 新的图片文件
   * @returns {Promise<Object>} 更新后的产品信息
   */
  async updateProduct(productId, updateData, files = []) {
    try {
      // 获取现有产品
      const existingProduct = await this.productRepository.findById(productId);
      if (!existingProduct) {
        throw AppError.notFound('Product not found', 'PRODUCT_NOT_FOUND');
      }

      // 验证更新数据
      const validationError = this._validateUpdateData(updateData);
      if (validationError) {
        throw validationError;
      }

      // 验证分类是否存在
      if (updateData.category_id) {
        const category = await this.categoryRepository.findById(updateData.category_id);
        if (!category) {
          throw AppError.notFound('Category not found', 'CATEGORY_NOT_FOUND');
        }
      }

      // 准备更新数据
      const updatePayload = {};
      
      if (updateData.name !== undefined) updatePayload.name = updateData.name;
      if (updateData.description !== undefined) updatePayload.description = updateData.description;
      if (updateData.price !== undefined) updatePayload.price = parseFloat(updateData.price);
      if (updateData.discount_price !== undefined) updatePayload.discount_price = updateData.discount_price ? parseFloat(updateData.discount_price) : null;
      if (updateData.stock_quantity !== undefined) updatePayload.stock_quantity = parseInt(updateData.stock_quantity, 10);
      if (updateData.category_id !== undefined) updatePayload.category_id = updateData.category_id;
      if (updateData.brand !== undefined) updatePayload.brand = updateData.brand;
      if (updateData.sku !== undefined) updatePayload.sku = updateData.sku;
      if (updateData.is_active !== undefined) updatePayload.is_active = updateData.is_active;
      if (updateData.featured !== undefined) updatePayload.featured = updateData.featured;
      if (updateData.attributes !== undefined) updatePayload.attributes = updateData.attributes;
      
      updatePayload.updated_at = new Date();

      // 处理图片更新
      if (files && files.length > 0) {
        const imageUrls = [];
        
        // 上传新图片
        for (const file of files) {
          const uploadResult = await this.fileUploadService.saveFile(file, {
            directory: 'products',
            allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
          });
          imageUrls.push(uploadResult.fileUrl);
        }
        
        // 根据更新策略决定是替换还是追加
        if (updateData.replace_images) {
          // 删除旧图片（实际应用中需要实现文件删除逻辑）
          updatePayload.images = imageUrls;
        } else {
          // 追加新图片
          updatePayload.images = [...(existingProduct.images || []), ...imageUrls];
        }
      }

      // 执行更新
      const updatedProduct = await this.productRepository.update(productId, updatePayload);

      logger.info('Product updated successfully', { productId: updatedProduct.id });

      return this._formatProductResponse(updatedProduct);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error updating product', error);
      throw AppError.internalError('Failed to update product');
    }
  }

  /**
   * 删除产品（软删除）
   * @param {number} productId - 产品ID
   * @returns {Promise<boolean>} 是否成功
   */
  async deleteProduct(productId) {
    try {
      // 检查产品是否存在
      const product = await this.productRepository.findById(productId);
      if (!product) {
        throw AppError.notFound('Product not found', 'PRODUCT_NOT_FOUND');
      }

      // 执行软删除
      await this.productRepository.update(productId, {
        is_active: false,
        deleted_at: new Date(),
        updated_at: new Date()
      });

      logger.info('Product deleted successfully', { productId });
      return true;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error deleting product', error);
      throw AppError.internalError('Failed to delete product');
    }
  }

  /**
   * 获取产品列表
   * @param {Object} filterParams - 过滤参数
   * @param {number} page - 页码
   * @param {number} limit - 每页数量
   * @returns {Promise<Object>} 产品列表和分页信息
   */
  async getProducts(filterParams = {}, page = 1, limit = 20) {
    try {
      // 验证分页参数
      page = Math.max(1, parseInt(page, 10) || 1);
      limit = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));

      // 准备过滤条件
      const conditions = {};
      
      if (filterParams.category_id) {
        conditions.category_id = filterParams.category_id;
      }
      
      if (filterParams.brand) {
        conditions.brand = { $like: `%${filterParams.brand}%` };
      }
      
      if (filterParams.min_price) {
        conditions.price = { $gte: parseFloat(filterParams.min_price) };
      }
      
      if (filterParams.max_price) {
        if (conditions.price) {
          conditions.price.$lte = parseFloat(filterParams.max_price);
        } else {
          conditions.price = { $lte: parseFloat(filterParams.max_price) };
        }
      }
      
      if (filterParams.search) {
        conditions.$or = [
          { name: { $like: `%${filterParams.search}%` } },
          { description: { $like: `%${filterParams.search}%` } },
          { sku: { $like: `%${filterParams.search}%` } }
        ];
      }
      
      if (filterParams.featured === true) {
        conditions.featured = true;
      }
      
      // 默认只显示活跃产品
      if (filterParams.show_inactive !== true) {
        conditions.is_active = true;
      }

      // 准备排序
      let sortBy = ['created_at', 'DESC'];
      if (filterParams.sort) {
        const validSorts = ['price_asc', 'price_desc', 'newest', 'popularity'];
        if (validSorts.includes(filterParams.sort)) {
          switch (filterParams.sort) {
            case 'price_asc':
              sortBy = ['price', 'ASC'];
              break;
            case 'price_desc':
              sortBy = ['price', 'DESC'];
              break;
            case 'newest':
              sortBy = ['created_at', 'DESC'];
              break;
            case 'popularity':
              sortBy = ['views', 'DESC'];
              break;
          }
        }
      }

      // 执行查询
      const { items, total } = await this.productRepository.search(
        conditions,
        page,
        limit,
        sortBy
      );

      // 格式化结果
      const formattedProducts = items.map(product => this._formatProductResponse(product));

      return {
        products: formattedProducts,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error fetching products', error);
      throw AppError.internalError('Failed to fetch products');
    }
  }

  /**
   * 更新产品库存
   * @param {number} productId - 产品ID
   * @param {number} quantity - 调整的库存数量（正数增加，负数减少）
   * @returns {Promise<Object>} 更新后的产品信息
   */
  async updateStock(productId, quantity) {
    try {
      const product = await this.productRepository.findById(productId);
      if (!product) {
        throw AppError.notFound('Product not found', 'PRODUCT_NOT_FOUND');
      }

      const newQuantity = product.stock_quantity + parseInt(quantity, 10);
      
      if (newQuantity < 0) {
        throw AppError.badRequest('Insufficient stock', 'INSUFFICIENT_STOCK');
      }

      const updatedProduct = await this.productRepository.update(productId, {
        stock_quantity: newQuantity,
        updated_at: new Date()
      });

      logger.info('Product stock updated', { productId, quantity, newStock: newQuantity });
      return this._formatProductResponse(updatedProduct);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error updating product stock', error);
      throw AppError.internalError('Failed to update product stock');
    }
  }

  /**
   * 搜索产品
   * @param {string} query - 搜索关键词
   * @param {Object} options - 搜索选项
   * @returns {Promise<Array>} 搜索结果
   */
  async searchProducts(query, options = {}) {
    try {
      if (!query || query.trim().length < 2) {
        throw AppError.badRequest('Search query must be at least 2 characters', 'INVALID_QUERY');
      }

      // 执行搜索
      const results = await this.productRepository.searchByNameOrDescription(
        query,
        options.limit || 50,
        options.category_id
      );

      return results.map(product => this._formatProductResponse(product));
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error searching products', error);
      throw AppError.internalError('Failed to search products');
    }
  }

  /**
   * 获取相关产品
   * @param {number} productId - 产品ID
   * @param {number} limit - 限制数量
   * @returns {Promise<Array>} 相关产品列表
   */
  async getRelatedProducts(productId, limit = 4) {
    try {
      const product = await this.productRepository.findById(productId);
      if (!product) {
        throw AppError.notFound('Product not found', 'PRODUCT_NOT_FOUND');
      }

      // 根据分类获取相关产品
      const relatedProducts = await this.productRepository.findRelatedProducts(
        productId,
        product.category_id,
        limit
      );

      return relatedProducts.map(p => this._formatProductResponse(p));
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error getting related products', error);
      throw AppError.internalError('Failed to get related products');
    }
  }

  /**
   * 增加产品浏览次数
   * @param {number} productId - 产品ID
   * @returns {Promise<void>}
   */
  async incrementProductViews(productId) {
    try {
      await this.productRepository.incrementViews(productId);
    } catch (error) {
      // 浏览次数更新失败不应影响主流程，只记录日志
      logger.warn('Failed to increment product views', { productId, error: error.message });
    }
  }

  /**
   * 验证产品数据
   * @private
   * @param {Object} productData - 产品数据
   * @returns {ValidationError|null} 验证错误或null
   */
  _validateProductData(productData) {
    const errors = {};

    // 验证必填字段
    if (!productData.name || stringUtils.isEmpty(productData.name)) {
      errors.name = 'Product name is required';
    }

    if (!productData.price || parseFloat(productData.price) <= 0) {
      errors.price = 'Valid price is required';
    }

    if (productData.discount_price && parseFloat(productData.discount_price) >= parseFloat(productData.price)) {
      errors.discount_price = 'Discount price must be less than regular price';
    }

    if (productData.stock_quantity === undefined || productData.stock_quantity < 0) {
      errors.stock_quantity = 'Valid stock quantity is required';
    }

    if (Object.keys(errors).length > 0) {
      return ValidationError('Validation failed', errors);
    }

    return null;
  }

  /**
   * 验证更新数据
   * @private
   * @param {Object} updateData - 更新数据
   * @returns {ValidationError|null} 验证错误或null
   */
  _validateUpdateData(updateData) {
    const errors = {};

    if (updateData.name !== undefined && stringUtils.isEmpty(updateData.name)) {
      errors.name = 'Product name cannot be empty';
    }

    if (updateData.price !== undefined && parseFloat(updateData.price) <= 0) {
      errors.price = 'Price must be greater than zero';
    }

    if (updateData.discount_price !== undefined && updateData.price !== undefined) {
      if (parseFloat(updateData.discount_price) >= parseFloat(updateData.price)) {
        errors.discount_price = 'Discount price must be less than regular price';
      }
    }

    if (updateData.stock_quantity !== undefined && updateData.stock_quantity < 0) {
      errors.stock_quantity = 'Stock quantity cannot be negative';
    }

    if (Object.keys(errors).length > 0) {
      return ValidationError('Validation failed', errors);
    }

    return null;
  }

  /**
   * 生成SKU码
   * @private
   * @param {string} productName - 产品名称
   * @returns {string} SKU码
   */
  _generateSku(productName) {
    const prefix = productName
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 3);
    const suffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}${suffix}`;
  }

  /**
   * 格式化产品响应
   * @private
   * @param {Object} product - 产品对象
   * @returns {Object} 格式化后的产品信息
   */
  _formatProductResponse(product) {
    // 计算折扣百分比
    let discountPercentage = null;
    if (product.discount_price && product.price > product.discount_price) {
      discountPercentage = Math.round(((product.price - product.discount_price) / product.price) * 100);
    }

    // 计算最终价格
    const finalPrice = product.discount_price || product.price;

    // 检查是否有库存
    const inStock = product.stock_quantity > 0;

    const response = {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      discount_price: product.discount_price,
      discount_percentage: discountPercentage,
      final_price: finalPrice,
      stock_quantity: product.stock_quantity,
      in_stock: inStock,
      category_id: product.category_id,
      brand: product.brand,
      sku: product.sku,
      images: product.images || [],
      is_active: product.is_active,
      featured: product.featured,
      attributes: product.attributes || {},
      views: product.views || 0,
      created_at: product.created_at,
      updated_at: product.updated_at
    };

    // 如果产品包含分类信息，添加到响应中
    if (product.category) {
      response.category = {
        id: product.category.id,
        name: product.category.name,
        slug: product.category.slug
      };
    }

    return response;
  }

  /**
   * 获取产品统计信息
   * @returns {Promise<Object>} 统计信息
   */
  async getProductStatistics() {
    try {
      const stats = {
        total: await this.productRepository.count(),
        active: await this.productRepository.count({ is_active: true }),
        inactive: await this.productRepository.count({ is_active: false }),
        featured: await this.productRepository.count({ featured: true }),
        low_stock: await this.productRepository.count({ stock_quantity: { $lt: 10 } }),
        out_of_stock: await this.productRepository.count({ stock_quantity: 0 }),
        by_category: await this.productRepository.countByCategory()
      };

      return stats;
    } catch (error) {
      logger.error('Error getting product statistics', error);
      throw AppError.internalError('Failed to get product statistics');
    }
  }
}

module.exports = ProductService;