/**
 * 购物车服务层
 * 处理购物车相关的业务逻辑
 */

const logger = require('@core/utils/logger');
const cartRepository = require('../repositories/cartRepository');
const productService = require('../../product/services/productService');
const cacheService = require('@core/cache/cacheService');
const messageQueue = require('@core/messaging/messageQueue');

class CartService {
  /**
   * 获取购物车
   * @param {string} userId - 用户ID
   * @returns {Promise<Array>} 购物车商品列表
   */
  async getCart(userId) {
    try {
      // 构建缓存键
      const cacheKey = `cart:user:${userId}`;
      
      // 尝试从缓存获取
      const cachedCart = await cacheService.get(cacheKey);
      if (cachedCart) {
        return cachedCart;
      }
      
      // 从数据库获取购物车商品
      const cartItems = await cartRepository.getCart(userId);
      
      // 增强购物车商品信息（获取最新的商品详情）
      const enhancedItems = await this.enhanceCartItems(cartItems);
      
      // 缓存购物车（1小时）
      await cacheService.set(cacheKey, enhancedItems, 3600);
      
      return enhancedItems;
    } catch (error) {
      logger.error(`获取购物车失败 (用户ID: ${userId}):`, error);
      throw error;
    }
  }
  
  /**
   * 添加商品到购物车
   * @param {string} userId - 用户ID
   * @param {string} productId - 商品ID
   * @param {number} quantity - 数量
   * @param {Object} specs - 规格参数
   * @returns {Promise<Object>} 添加的购物车商品
   */
  async addToCart(userId, productId, quantity, specs = {}) {
    try {
      // 验证商品是否存在
      const product = await productService.getProductById(productId);
      if (!product) {
        throw new Error('商品不存在');
      }
      
      // 验证库存
      if (product.stock < quantity) {
        throw new Error('商品库存不足');
      }
      
      // 检查购物车中是否已存在该商品（相同规格）
      const existingItem = await cartRepository.findCartItem(userId, productId, specs);
      
      let cartItem;
      if (existingItem) {
        // 如果已存在，更新数量
        const newQuantity = existingItem.quantity + quantity;
        // 检查更新后的数量是否超过库存
        if (product.stock < newQuantity) {
          throw new Error('商品库存不足');
        }
        
        cartItem = await cartRepository.updateCartItem(existingItem.id, { quantity: newQuantity });
      } else {
        // 否则，添加新商品
        const itemData = {
          userId,
          productId,
          quantity,
          specs,
          price: product.price,
          selected: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        cartItem = await cartRepository.addToCart(itemData);
      }
      
      // 清除购物车缓存
      const cacheKey = `cart:user:${userId}`;
      await cacheService.delete(cacheKey);
      
      // 增强购物车商品信息
      return await this.enhanceCartItem(cartItem);
    } catch (error) {
      logger.error(`添加商品到购物车失败 (用户ID: ${userId}, 商品ID: ${productId}):`, error);
      throw error;
    }
  }
  
  /**
   * 更新购物车商品
   * @param {string} userId - 用户ID
   * @param {string} itemId - 购物车商品ID
   * @param {number} quantity - 数量
   * @param {Object} specs - 规格参数
   * @returns {Promise<Object|null>} 更新后的购物车商品或null
   */
  async updateCartItem(userId, itemId, quantity = undefined, specs = undefined) {
    try {
      // 获取购物车商品
      const cartItem = await cartRepository.getCartItem(itemId, userId);
      if (!cartItem) {
        return null;
      }
      
      // 准备更新数据
      const updateData = {
        updatedAt: new Date().toISOString()
      };
      
      // 如果要更新数量，验证库存
      if (quantity !== undefined) {
        const product = await productService.getProductById(cartItem.productId);
        if (product.stock < quantity) {
          throw new Error('商品库存不足');
        }
        updateData.quantity = quantity;
      }
      
      // 如果要更新规格
      if (specs !== undefined) {
        updateData.specs = specs;
      }
      
      // 更新购物车商品
      const updatedItem = await cartRepository.updateCartItem(itemId, updateData);
      
      // 清除购物车缓存
      const cacheKey = `cart:user:${userId}`;
      await cacheService.delete(cacheKey);
      
      // 增强购物车商品信息
      return await this.enhanceCartItem(updatedItem);
    } catch (error) {
      logger.error(`更新购物车商品失败 (用户ID: ${userId}, 购物车项ID: ${itemId}):`, error);
      throw error;
    }
  }
  
  /**
   * 从购物车移除商品
   * @param {string} userId - 用户ID
   * @param {string} itemId - 购物车商品ID
   * @returns {Promise<boolean>} 是否移除成功
   */
  async removeFromCart(userId, itemId) {
    try {
      // 验证购物车商品是否属于该用户
      const cartItem = await cartRepository.getCartItem(itemId, userId);
      if (!cartItem) {
        return false;
      }
      
      // 从数据库移除
      await cartRepository.removeFromCart(itemId);
      
      // 清除购物车缓存
      const cacheKey = `cart:user:${userId}`;
      await cacheService.delete(cacheKey);
      
      return true;
    } catch (error) {
      logger.error(`从购物车移除商品失败 (用户ID: ${userId}, 购物车项ID: ${itemId}):`, error);
      throw error;
    }
  }
  
  /**
   * 清空购物车
   * @param {string} userId - 用户ID
   * @returns {Promise<void>}
   */
  async clearCart(userId) {
    try {
      await cartRepository.clearCart(userId);
      
      // 清除购物车缓存
      const cacheKey = `cart:user:${userId}`;
      await cacheService.delete(cacheKey);
    } catch (error) {
      logger.error(`清空购物车失败 (用户ID: ${userId}):`, error);
      throw error;
    }
  }
  
  /**
   * 批量添加商品到购物车
   * @param {string} userId - 用户ID
   * @param {Array} items - 商品列表
   * @returns {Promise<Array>} 添加结果
   */
  async batchAddToCart(userId, items) {
    try {
      const results = [];
      
      for (const item of items) {
        try {
          const addedItem = await this.addToCart(
            userId,
            item.productId,
            item.quantity,
            item.specs || {}
          );
          
          results.push({
            productId: item.productId,
            success: true,
            item: addedItem
          });
        } catch (error) {
          results.push({
            productId: item.productId,
            success: false,
            error: error.message
          });
        }
      }
      
      // 清除购物车缓存
      const cacheKey = `cart:user:${userId}`;
      await cacheService.delete(cacheKey);
      
      return results;
    } catch (error) {
      logger.error(`批量添加商品到购物车失败 (用户ID: ${userId}):`, error);
      throw error;
    }
  }
  
  /**
   * 获取购物车商品数量
   * @param {string} userId - 用户ID
   * @returns {Promise<number>} 购物车商品总数量
   */
  async getCartCount(userId) {
    try {
      // 构建缓存键
      const cacheKey = `cart:count:${userId}`;
      
      // 尝试从缓存获取
      const cachedCount = await cacheService.get(cacheKey);
      if (cachedCount !== null) {
        return cachedCount;
      }
      
      const count = await cartRepository.getCartCount(userId);
      
      // 缓存数量（10分钟）
      await cacheService.set(cacheKey, count, 600);
      
      return count;
    } catch (error) {
      logger.error(`获取购物车商品数量失败 (用户ID: ${userId}):`, error);
      throw error;
    }
  }
  
  /**
   * 检查购物车商品库存
   * @param {string} userId - 用户ID
   * @param {Array} itemIds - 购物车商品ID列表（可选）
   * @returns {Promise<Object>} 库存状态
   */
  async checkInventory(userId, itemIds = null) {
    try {
      // 获取购物车商品
      let cartItems;
      if (itemIds) {
        cartItems = await cartRepository.getCartItemsByIds(userId, itemIds);
      } else {
        cartItems = await cartRepository.getCart(userId);
      }
      
      // 检查每个商品的库存
      const status = [];
      let allInStock = true;
      
      for (const item of cartItems) {
        const product = await productService.getProductById(item.productId);
        const inStock = product && product.stock >= item.quantity;
        
        if (!inStock) {
          allInStock = false;
        }
        
        status.push({
          itemId: item.id,
          productId: item.productId,
          inStock,
          currentStock: product?.stock || 0,
          requestedQuantity: item.quantity,
          availableQuantity: product?.stock || 0
        });
      }
      
      return {
        allInStock,
        items: status
      };
    } catch (error) {
      logger.error(`检查购物车商品库存失败 (用户ID: ${userId}):`, error);
      throw error;
    }
  }
  
  /**
   * 将购物车商品移到收藏夹
   * @param {string} userId - 用户ID
   * @param {string} itemId - 购物车商品ID
   * @returns {Promise<void>}
   */
  async moveToWishlist(userId, itemId) {
    try {
      // 获取购物车商品
      const cartItem = await cartRepository.getCartItem(itemId, userId);
      if (!cartItem) {
        throw new Error('购物车商品不存在');
      }
      
      // 发送到消息队列，由收藏夹服务处理
      messageQueue.publish('wishlist.add', {
        userId,
        productId: cartItem.productId,
        specs: cartItem.specs,
        fromCart: true,
        timestamp: new Date().toISOString()
      });
      
      // 从购物车移除
      await this.removeFromCart(userId, itemId);
    } catch (error) {
      logger.error(`将购物车商品移到收藏夹失败 (用户ID: ${userId}, 购物车项ID: ${itemId}):`, error);
      throw error;
    }
  }
  
  /**
   * 增强购物车商品信息
   * @param {Array} cartItems - 购物车商品列表
   * @returns {Promise<Array>} 增强后的购物车商品列表
   */
  async enhanceCartItems(cartItems) {
    const enhancedItems = [];
    
    for (const item of cartItems) {
      const enhancedItem = await this.enhanceCartItem(item);
      enhancedItems.push(enhancedItem);
    }
    
    return enhancedItems;
  }
  
  /**
   * 增强单个购物车商品信息
   * @param {Object} cartItem - 购物车商品
   * @returns {Promise<Object>} 增强后的购物车商品
   */
  async enhanceCartItem(cartItem) {
    try {
      // 获取商品详情
      const product = await productService.getProductById(cartItem.productId);
      
      if (!product) {
        // 如果商品不存在，标记为失效
        return {
          ...cartItem,
          product: null,
          isValid: false,
          error: '商品已下架或不存在'
        };
      }
      
      // 检查库存状态
      const inStock = product.stock >= cartItem.quantity;
      const priceChanged = product.price !== cartItem.price;
      
      return {
        ...cartItem,
        product: {
          id: product.id,
          name: product.name,
          images: product.images,
          price: product.price,
          originalPrice: product.originalPrice,
          stock: product.stock
        },
        isValid: true,
        inStock,
        priceChanged,
        totalPrice: product.price * cartItem.quantity
      };
    } catch (error) {
      logger.error(`增强购物车商品信息失败 (商品ID: ${cartItem.productId}):`, error);
      
      return {
        ...cartItem,
        product: null,
        isValid: false,
        error: '获取商品信息失败'
      };
    }
  }
}

module.exports = new CartService();