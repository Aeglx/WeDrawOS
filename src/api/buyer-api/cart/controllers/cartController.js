/**
 * 购物车控制器
 * 处理购物车相关的HTTP请求
 */

const logger = require('@core/utils/logger');
const cartService = require('../services/cartService');
const { responseHandler } = require('@core/utils/responseHandler');
const messageQueue = require('@core/messaging/messageQueue');

class CartController {
  /**
   * 获取购物车列表
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - 下一个中间件函数
   */
  async getCart(req, res, next) {
    try {
      const userId = req.user.id;
      const cartItems = await cartService.getCart(userId);
      
      return responseHandler.success(res, cartItems);
    } catch (error) {
      logger.error(`获取购物车失败 (用户ID: ${req.user.id}):`, error);
      return responseHandler.error(res, error);
    }
  }
  
  /**
   * 添加商品到购物车
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - 下一个中间件函数
   */
  async addToCart(req, res, next) {
    try {
      const userId = req.user.id;
      const { productId, quantity, specs } = req.body;
      
      // 参数验证
      if (!productId || !quantity || quantity <= 0) {
        return responseHandler.badRequest(res, '商品ID和数量为必填项，且数量必须大于0');
      }
      
      const cartItem = await cartService.addToCart(userId, productId, quantity, specs);
      
      // 发送购物车操作日志到消息队列
      messageQueue.publish('cart.operation', {
        userId,
        productId,
        operation: 'add',
        quantity,
        specs,
        timestamp: new Date().toISOString()
      });
      
      return responseHandler.success(res, cartItem, '添加到购物车成功');
    } catch (error) {
      logger.error(`添加到购物车失败 (用户ID: ${req.user.id}):`, error);
      return responseHandler.error(res, error);
    }
  }
  
  /**
   * 更新购物车商品数量
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - 下一个中间件函数
   */
  async updateCartItem(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { quantity, specs } = req.body;
      
      // 参数验证
      if (quantity !== undefined && quantity <= 0) {
        return responseHandler.badRequest(res, '数量必须大于0');
      }
      
      const cartItem = await cartService.updateCartItem(userId, id, quantity, specs);
      
      if (!cartItem) {
        return responseHandler.notFound(res, '购物车商品不存在');
      }
      
      // 发送购物车操作日志到消息队列
      messageQueue.publish('cart.operation', {
        userId,
        cartItemId: id,
        operation: 'update',
        quantity,
        specs,
        timestamp: new Date().toISOString()
      });
      
      return responseHandler.success(res, cartItem, '更新成功');
    } catch (error) {
      logger.error(`更新购物车商品失败 (用户ID: ${req.user.id}, 购物车项ID: ${req.params.id}):`, error);
      return responseHandler.error(res, error);
    }
  }
  
  /**
   * 从购物车移除商品
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - 下一个中间件函数
   */
  async removeFromCart(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      
      const success = await cartService.removeFromCart(userId, id);
      
      if (!success) {
        return responseHandler.notFound(res, '购物车商品不存在');
      }
      
      // 发送购物车操作日志到消息队列
      messageQueue.publish('cart.operation', {
        userId,
        cartItemId: id,
        operation: 'remove',
        timestamp: new Date().toISOString()
      });
      
      return responseHandler.success(res, null, '从购物车移除成功');
    } catch (error) {
      logger.error(`从购物车移除商品失败 (用户ID: ${req.user.id}, 购物车项ID: ${req.params.id}):`, error);
      return responseHandler.error(res, error);
    }
  }
  
  /**
   * 清空购物车
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - 下一个中间件函数
   */
  async clearCart(req, res, next) {
    try {
      const userId = req.user.id;
      
      await cartService.clearCart(userId);
      
      // 发送购物车操作日志到消息队列
      messageQueue.publish('cart.operation', {
        userId,
        operation: 'clear',
        timestamp: new Date().toISOString()
      });
      
      return responseHandler.success(res, null, '购物车已清空');
    } catch (error) {
      logger.error(`清空购物车失败 (用户ID: ${req.user.id}):`, error);
      return responseHandler.error(res, error);
    }
  }
  
  /**
   * 批量添加商品到购物车
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - 下一个中间件函数
   */
  async batchAddToCart(req, res, next) {
    try {
      const userId = req.user.id;
      const items = req.body.items;
      
      // 参数验证
      if (!Array.isArray(items) || items.length === 0) {
        return responseHandler.badRequest(res, '请提供有效的商品列表');
      }
      
      // 验证每个商品项
      for (const item of items) {
        if (!item.productId || !item.quantity || item.quantity <= 0) {
          return responseHandler.badRequest(res, '每个商品项必须包含商品ID和有效的数量');
        }
      }
      
      const results = await cartService.batchAddToCart(userId, items);
      
      return responseHandler.success(res, results, '批量添加成功');
    } catch (error) {
      logger.error(`批量添加到购物车失败 (用户ID: ${req.user.id}):`, error);
      return responseHandler.error(res, error);
    }
  }
  
  /**
   * 获取购物车商品数量
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - 下一个中间件函数
   */
  async getCartCount(req, res, next) {
    try {
      const userId = req.user.id;
      const count = await cartService.getCartCount(userId);
      
      return responseHandler.success(res, { count });
    } catch (error) {
      logger.error(`获取购物车数量失败 (用户ID: ${req.user.id}):`, error);
      return responseHandler.error(res, error);
    }
  }
  
  /**
   * 检查购物车商品库存
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - 下一个中间件函数
   */
  async checkCartInventory(req, res, next) {
    try {
      const userId = req.user.id;
      const { itemIds } = req.body;
      
      const inventoryStatus = await cartService.checkInventory(userId, itemIds);
      
      return responseHandler.success(res, inventoryStatus);
    } catch (error) {
      logger.error(`检查购物车库存失败 (用户ID: ${req.user.id}):`, error);
      return responseHandler.error(res, error);
    }
  }
  
  /**
   * 将商品移到收藏夹
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - 下一个中间件函数
   */
  async moveToWishlist(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      
      await cartService.moveToWishlist(userId, id);
      
      return responseHandler.success(res, null, '已移至收藏夹');
    } catch (error) {
      logger.error(`移至收藏夹失败 (用户ID: ${req.user.id}, 购物车项ID: ${req.params.id}):`, error);
      return responseHandler.error(res, error);
    }
  }
}

module.exports = new CartController();