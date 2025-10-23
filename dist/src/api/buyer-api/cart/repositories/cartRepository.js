/**
 * 购物车数据仓库
 * 负责购物车数据的存取操作
 */

const logger = require('../../../core/utils/logger');
const BaseRepository = require('../../../core/data-access/repositories/BaseRepository');
const { v4: uuidv4 } = require('uuid');

class CartRepository extends BaseRepository {
  constructor() {
    super('cart_items'); // 表名
  }
  
  /**
   * 获取用户购物车
   * @param {string} userId - 用户ID
   * @returns {Promise<Array>} 购物车商品列表
   */
  async getCart(userId) {
    try {
      // 在实际项目中，这里应该调用数据库查询
      logger.info('获取用户购物车:', { userId });
      
      // 使用模拟数据
      return this.getMockCartItems(userId);
    } catch (error) {
      logger.error(`获取用户购物车失败 (用户ID: ${userId}):`, error);
      throw error;
    }
  }
  
  /**
   * 获取单个购物车商品
   * @param {string} itemId - 购物车商品ID
   * @param {string} userId - 用户ID
   * @returns {Promise<Object|null>} 购物车商品或null
   */
  async getCartItem(itemId, userId) {
    try {
      // 在实际项目中，这里应该调用数据库查询
      logger.info('获取购物车商品:', { itemId, userId });
      
      // 使用模拟数据
      const items = this.getMockCartItems(userId);
      return items.find(item => item.id === itemId) || null;
    } catch (error) {
      logger.error(`获取购物车商品失败 (ID: ${itemId}, 用户ID: ${userId}):`, error);
      throw error;
    }
  }
  
  /**
   * 通过ID列表获取购物车商品
   * @param {string} userId - 用户ID
   * @param {Array} itemIds - 购物车商品ID列表
   * @returns {Promise<Array>} 购物车商品列表
   */
  async getCartItemsByIds(userId, itemIds) {
    try {
      // 在实际项目中，这里应该调用数据库查询
      logger.info('通过ID列表获取购物车商品:', { userId, itemIds });
      
      // 使用模拟数据
      const items = this.getMockCartItems(userId);
      return items.filter(item => itemIds.includes(item.id));
    } catch (error) {
      logger.error(`通过ID列表获取购物车商品失败 (用户ID: ${userId}):`, error);
      throw error;
    }
  }
  
  /**
   * 查找特定商品在购物车中的项
   * @param {string} userId - 用户ID
   * @param {string} productId - 商品ID
   * @param {Object} specs - 规格参数
   * @returns {Promise<Object|null>} 购物车商品或null
   */
  async findCartItem(userId, productId, specs = {}) {
    try {
      // 在实际项目中，这里应该调用数据库查询
      logger.info('查找购物车商品:', { userId, productId, specs });
      
      // 使用模拟数据
      const items = this.getMockCartItems(userId);
      return items.find(item => 
        item.productId === productId && 
        this.areSpecsEqual(item.specs, specs)
      ) || null;
    } catch (error) {
      logger.error(`查找购物车商品失败 (用户ID: ${userId}, 商品ID: ${productId}):`, error);
      throw error;
    }
  }
  
  /**
   * 添加商品到购物车
   * @param {Object} itemData - 购物车商品数据
   * @returns {Promise<Object>} 添加的购物车商品
   */
  async addToCart(itemData) {
    try {
      // 在实际项目中，这里应该调用数据库插入
      logger.info('添加商品到购物车:', itemData);
      
      // 生成唯一ID
      const cartItem = {
        id: uuidv4(),
        ...itemData
      };
      
      // 添加到模拟数据
      this.addMockCartItem(cartItem);
      
      return cartItem;
    } catch (error) {
      logger.error('添加商品到购物车失败:', error);
      throw error;
    }
  }
  
  /**
   * 更新购物车商品
   * @param {string} itemId - 购物车商品ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<Object>} 更新后的购物车商品
   */
  async updateCartItem(itemId, updateData) {
    try {
      // 在实际项目中，这里应该调用数据库更新
      logger.info('更新购物车商品:', { itemId, updateData });
      
      // 更新模拟数据
      const updatedItem = this.updateMockCartItem(itemId, updateData);
      
      if (!updatedItem) {
        throw new Error('购物车商品不存在');
      }
      
      return updatedItem;
    } catch (error) {
      logger.error(`更新购物车商品失败 (ID: ${itemId}):`, error);
      throw error;
    }
  }
  
  /**
   * 从购物车移除商品
   * @param {string} itemId - 购物车商品ID
   * @returns {Promise<void>}
   */
  async removeFromCart(itemId) {
    try {
      // 在实际项目中，这里应该调用数据库删除
      logger.info('从购物车移除商品:', { itemId });
      
      // 从模拟数据中删除
      const success = this.removeMockCartItem(itemId);
      
      if (!success) {
        throw new Error('购物车商品不存在');
      }
    } catch (error) {
      logger.error(`从购物车移除商品失败 (ID: ${itemId}):`, error);
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
      // 在实际项目中，这里应该调用数据库删除
      logger.info('清空购物车:', { userId });
      
      // 清空模拟数据
      this.clearMockCartItems(userId);
    } catch (error) {
      logger.error(`清空购物车失败 (用户ID: ${userId}):`, error);
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
      // 在实际项目中，这里应该调用数据库聚合查询
      logger.info('获取购物车商品数量:', { userId });
      
      // 计算模拟数据中的商品数量
      const items = this.getMockCartItems(userId);
      return items.reduce((total, item) => total + item.quantity, 0);
    } catch (error) {
      logger.error(`获取购物车商品数量失败 (用户ID: ${userId}):`, error);
      throw error;
    }
  }
  
  /**
   * 批量更新购物车商品选中状态
   * @param {string} userId - 用户ID
   * @param {Array} itemIds - 购物车商品ID列表
   * @param {boolean} selected - 是否选中
   * @returns {Promise<number>} 更新的商品数量
   */
  async batchUpdateSelected(userId, itemIds, selected) {
    try {
      // 在实际项目中，这里应该调用数据库更新
      logger.info('批量更新购物车商品选中状态:', { userId, itemIds, selected });
      
      // 更新模拟数据
      let updatedCount = 0;
      const items = this.getMockCartItems(userId);
      
      items.forEach(item => {
        if (itemIds.includes(item.id)) {
          item.selected = selected;
          item.updatedAt = new Date().toISOString();
          updatedCount++;
        }
      });
      
      return updatedCount;
    } catch (error) {
      logger.error(`批量更新购物车商品选中状态失败 (用户ID: ${userId}):`, error);
      throw error;
    }
  }
  
  // 模拟数据管理
  mockCartItems = [];
  
  /**
   * 初始化模拟数据
   */
  initializeMockData() {
    // 添加一些示例购物车数据
    this.mockCartItems = [
      {
        id: '1',
        userId: '101',
        productId: '1',
        quantity: 2,
        specs: { memory: '256GB', color: '深空黑' },
        price: 7999,
        selected: true,
        createdAt: '2024-01-20T10:00:00Z',
        updatedAt: '2024-01-20T10:00:00Z'
      },
      {
        id: '2',
        userId: '101',
        productId: '3',
        quantity: 1,
        specs: { processor: 'i7-1355U', memory: '16GB', storage: '512GB' },
        price: 8999,
        selected: true,
        createdAt: '2024-01-21T14:30:00Z',
        updatedAt: '2024-01-21T14:30:00Z'
      }
    ];
  }
  
  /**
   * 获取用户的模拟购物车商品
   * @param {string} userId - 用户ID
   * @returns {Array} 购物车商品列表
   */
  getMockCartItems(userId) {
    if (this.mockCartItems.length === 0) {
      this.initializeMockData();
    }
    
    return this.mockCartItems.filter(item => item.userId === userId);
  }
  
  /**
   * 添加模拟购物车商品
   * @param {Object} cartItem - 购物车商品
   */
  addMockCartItem(cartItem) {
    this.mockCartItems.push(cartItem);
  }
  
  /**
   * 更新模拟购物车商品
   * @param {string} itemId - 购物车商品ID
   * @param {Object} updateData - 更新数据
   * @returns {Object|null} 更新后的购物车商品或null
   */
  updateMockCartItem(itemId, updateData) {
    const item = this.mockCartItems.find(i => i.id === itemId);
    if (item) {
      Object.assign(item, updateData);
      return item;
    }
    return null;
  }
  
  /**
   * 移除模拟购物车商品
   * @param {string} itemId - 购物车商品ID
   * @returns {boolean} 是否移除成功
   */
  removeMockCartItem(itemId) {
    const initialLength = this.mockCartItems.length;
    this.mockCartItems = this.mockCartItems.filter(item => item.id !== itemId);
    return this.mockCartItems.length < initialLength;
  }
  
  /**
   * 清空用户的模拟购物车
   * @param {string} userId - 用户ID
   */
  clearMockCartItems(userId) {
    this.mockCartItems = this.mockCartItems.filter(item => item.userId !== userId);
  }
  
  /**
   * 比较两个规格对象是否相等
   * @param {Object} specs1 - 规格1
   * @param {Object} specs2 - 规格2
   * @returns {boolean} 是否相等
   */
  areSpecsEqual(specs1, specs2) {
    const keys1 = Object.keys(specs1).sort();
    const keys2 = Object.keys(specs2).sort();
    
    if (keys1.length !== keys2.length) {
      return false;
    }
    
    for (let i = 0; i < keys1.length; i++) {
      if (keys1[i] !== keys2[i] || specs1[keys1[i]] !== specs2[keys2[i]]) {
        return false;
      }
    }
    
    return true;
  }
}

module.exports = new CartRepository();