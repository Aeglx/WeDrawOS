/**
 * 卖家端商品服务
 */

const logger = require('@core/utils/logger');
const productRepository = require('../repositories/productRepository');
const { BusinessError, NotFoundError, ForbiddenError } = require('@core/errors/customErrors');

class ProductService {
  /**
   * 创建商品
   * @param {Object} productData - 商品数据
   * @returns {Promise<Object>} 创建的商品
   */
  async createProduct(productData) {
    try {
      // 验证必填字段
      if (!productData.name || !productData.categoryId || !productData.price) {
        throw new BusinessError('缺少必填字段', 400, 'MISSING_REQUIRED_FIELDS');
      }
      
      // 设置默认值
      productData.status = productData.status || 'draft';
      productData.createdAt = new Date();
      productData.updatedAt = new Date();
      
      // 调用仓库层创建商品
      return await productRepository.create(productData);
    } catch (error) {
      if (error instanceof BusinessError) {
        throw error;
      }
      throw new BusinessError('创建商品失败', 500, 'CREATE_PRODUCT_FAILED');
    }
  }
  
  /**
   * 获取卖家的商品列表
   * @param {string} sellerId - 卖家ID
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} 分页结果
   */
  async getSellerProducts(sellerId, options = {}) {
    const { page = 1, pageSize = 10, status, keyword } = options;
    
    // 构建查询条件
    const query = {
      sellerId
    };
    
    if (status) {
      query.status = status;
    }
    
    if (keyword) {
      query.keyword = keyword;
    }
    
    // 计算偏移量
    const offset = (page - 1) * pageSize;
    
    // 查询商品列表和总数
    const products = await productRepository.findBySellerId(sellerId, offset, pageSize, query);
    const total = await productRepository.countBySellerId(sellerId, query);
    
    return {
      list: products,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  }
  
  /**
   * 获取商品详情
   * @param {string} productId - 商品ID
   * @param {string} sellerId - 卖家ID
   * @returns {Promise<Object>} 商品详情
   */
  async getProductDetail(productId, sellerId) {
    // 查询商品
    const product = await productRepository.findById(productId);
    
    if (!product) {
      throw new NotFoundError('商品不存在', 404, 'PRODUCT_NOT_FOUND');
    }
    
    // 验证商品归属
    if (product.sellerId !== sellerId) {
      throw new ForbiddenError('无权查看此商品', 403, 'NO_PERMISSION');
    }
    
    // 获取商品变体
    const variants = await productRepository.findProductVariants(productId);
    
    // 获取商品图片
    const images = await productRepository.findProductImages(productId);
    
    // 获取商品属性
    const attributes = await productRepository.findProductAttributes(productId);
    
    return {
      ...product,
      variants,
      images,
      attributes
    };
  }
  
  /**
   * 更新商品信息
   * @param {string} productId - 商品ID
   * @param {string} sellerId - 卖家ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<Object>} 更新后的商品
   */
  async updateProduct(productId, sellerId, updateData) {
    // 验证商品归属
    await this._validateProductOwnership(productId, sellerId);
    
    // 更新商品信息
    updateData.updatedAt = new Date();
    return await productRepository.update(productId, updateData);
  }
  
  /**
   * 变更商品状态
   * @param {string} productId - 商品ID
   * @param {string} sellerId - 卖家ID
   * @param {string} status - 新状态
   * @returns {Promise<Object>} 更新后的商品
   */
  async changeProductStatus(productId, sellerId, status) {
    // 验证状态值
    const validStatuses = ['active', 'inactive', 'draft'];
    if (!validStatuses.includes(status)) {
      throw new BusinessError('无效的状态值', 400, 'INVALID_STATUS');
    }
    
    // 验证商品归属
    await this._validateProductOwnership(productId, sellerId);
    
    // 更新状态
    return await productRepository.update(productId, {
      status,
      updatedAt: new Date()
    });
  }
  
  /**
   * 批量变更商品状态
   * @param {Array<string>} productIds - 商品ID列表
   * @param {string} sellerId - 卖家ID
   * @param {string} status - 新状态
   * @returns {Promise<Object>} 操作结果
   */
  async batchChangeStatus(productIds, sellerId, status) {
    // 验证状态值
    const validStatuses = ['active', 'inactive', 'draft'];
    if (!validStatuses.includes(status)) {
      throw new BusinessError('无效的状态值', 400, 'INVALID_STATUS');
    }
    
    // 验证所有商品的归属
    for (const productId of productIds) {
      await this._validateProductOwnership(productId, sellerId);
    }
    
    // 批量更新状态
    const updatedCount = await productRepository.batchUpdate(productIds, {
      status,
      updatedAt: new Date()
    });
    
    return {
      updatedCount,
      productIds
    };
  }
  
  /**
   * 更新商品库存
   * @param {string} productId - 商品ID
   * @param {string} sellerId - 卖家ID
   * @param {Array<Object>} variants - 变体库存数据
   * @returns {Promise<Object>} 操作结果
   */
  async updateInventory(productId, sellerId, variants) {
    // 验证商品归属
    await this._validateProductOwnership(productId, sellerId);
    
    // 验证库存数据
    for (const variant of variants) {
      if (!variant.skuId || variant.quantity === undefined || variant.quantity < 0) {
        throw new BusinessError('无效的库存数据', 400, 'INVALID_INVENTORY_DATA');
      }
    }
    
    // 更新库存
    const updatedCount = await productRepository.updateInventory(variants);
    
    // 记录库存变更日志
    await productRepository.createInventoryLogs({
      productId,
      sellerId,
      changes: variants,
      changeType: 'manual',
      timestamp: new Date()
    });
    
    return {
      updatedCount,
      productId
    };
  }
  
  /**
   * 更新商品价格
   * @param {string} productId - 商品ID
   * @param {string} sellerId - 卖家ID
   * @param {Array<Object>} variants - 变体价格数据
   * @returns {Promise<Object>} 操作结果
   */
  async updatePrice(productId, sellerId, variants) {
    // 验证商品归属
    await this._validateProductOwnership(productId, sellerId);
    
    // 验证价格数据
    for (const variant of variants) {
      if (!variant.skuId) {
        throw new BusinessError('缺少SKU ID', 400, 'MISSING_SKU_ID');
      }
      if (variant.price !== undefined && variant.price < 0) {
        throw new BusinessError('价格不能为负数', 400, 'INVALID_PRICE');
      }
    }
    
    // 更新价格
    const updatedCount = await productRepository.updatePrice(variants);
    
    return {
      updatedCount,
      productId
    };
  }
  
  /**
   * 复制商品
   * @param {string} productId - 原商品ID
   * @param {string} sellerId - 卖家ID
   * @param {string} newName - 新商品名称（可选）
   * @returns {Promise<Object>} 新创建的商品
   */
  async copyProduct(productId, sellerId, newName) {
    // 获取原商品信息
    const originalProduct = await this.getProductDetail(productId, sellerId);
    
    // 准备新商品数据
    const newProductData = {
      ...originalProduct,
      id: undefined, // 让数据库生成新ID
      name: newName || `${originalProduct.name} (复制)`,
      status: 'draft', // 复制的商品默认为草稿状态
      createdAt: new Date(),
      updatedAt: new Date(),
      variants: originalProduct.variants || [],
      images: originalProduct.images || [],
      attributes: originalProduct.attributes || []
    };
    
    // 创建新商品
    return await productRepository.copy(productId, newProductData);
  }
  
  /**
   * 删除商品
   * @param {string} productId - 商品ID
   * @param {string} sellerId - 卖家ID
   * @returns {Promise<void>}
   */
  async deleteProduct(productId, sellerId) {
    // 验证商品归属
    await this._validateProductOwnership(productId, sellerId);
    
    // 验证商品状态（草稿商品才能删除）
    const product = await productRepository.findById(productId);
    if (product.status === 'active') {
      throw new BusinessError('已上架商品不能删除，请先下架', 400, 'CANNOT_DELETE_ACTIVE_PRODUCT');
    }
    
    // 删除商品
    await productRepository.delete(productId);
  }
  
  /**
   * 批量删除商品
   * @param {Array<string>} productIds - 商品ID列表
   * @param {string} sellerId - 卖家ID
   * @returns {Promise<void>}
   */
  async batchDeleteProducts(productIds, sellerId) {
    // 验证所有商品的归属和状态
    for (const productId of productIds) {
      const product = await productRepository.findById(productId);
      if (!product) {
        throw new NotFoundError(`商品不存在: ${productId}`, 404, 'PRODUCT_NOT_FOUND');
      }
      if (product.sellerId !== sellerId) {
        throw new ForbiddenError(`无权删除商品: ${productId}`, 403, 'NO_PERMISSION');
      }
      if (product.status === 'active') {
        throw new BusinessError(`商品已上架不能删除: ${productId}`, 400, 'CANNOT_DELETE_ACTIVE_PRODUCT');
      }
    }
    
    // 批量删除商品
    await productRepository.batchDelete(productIds);
  }
  
  /**
   * 验证商品归属
   * @param {string} productId - 商品ID
   * @param {string} sellerId - 卖家ID
   * @returns {Promise<void>}
   */
  async _validateProductOwnership(productId, sellerId) {
    const product = await productRepository.findById(productId);
    
    if (!product) {
      throw new NotFoundError('商品不存在', 404, 'PRODUCT_NOT_FOUND');
    }
    
    if (product.sellerId !== sellerId) {
      throw new ForbiddenError('无权操作此商品', 403, 'NO_PERMISSION');
    }
  }
}

module.exports = new ProductService();