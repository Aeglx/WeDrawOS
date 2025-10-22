/**
 * 评价服务
 * 提供评价相关的业务逻辑处理
 */

const logger = require('../../../core/utils/logger');
const reviewRepository = require('../repositories/reviewRepository');
const orderService = require('../../order/services/orderService');
const AppError = require('../../../core/errors/AppError');

class ReviewService {
  /**
   * 创建评价
   * @param {Object} reviewData - 评价数据
   * @returns {Promise<Object>} 创建的评价对象
   */
  async createReview(reviewData) {
    try {
      const { userId, productId, orderItemId, rating, content, images } = reviewData;
      
      // 验证用户是否有权评价该订单项
      const orderItem = await orderService.getOrderItemById(orderItemId);
      if (!orderItem) {
        throw new AppError('订单项不存在', 404);
      }
      
      if (orderItem.userId !== userId) {
        throw new AppError('无权评价该订单项', 403);
      }
      
      if (orderItem.status !== 'completed') {
        throw new AppError('只能评价已完成的订单', 400);
      }
      
      // 检查是否已经评价过
      const existingReview = await reviewRepository.findByOrderItemId(orderItemId);
      if (existingReview) {
        throw new AppError('该订单项已经评价过', 400);
      }
      
      // 创建评价
      const review = await reviewRepository.create({
        userId,
        productId,
        orderItemId,
        rating,
        content,
        images,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // 更新订单项评价状态
      await orderService.updateOrderItemReviewStatus(orderItemId, true);
      
      return review;
    } catch (error) {
      logger.error('创建评价失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取商品评价列表
   * @param {Object} query - 查询条件
   * @param {number} page - 页码
   * @param {number} limit - 每页数量
   * @param {string} sort - 排序方式
   * @returns {Promise<Object>} 评价列表和分页信息
   */
  async getProductReviews(query, page, limit, sort) {
    try {
      // 验证查询参数
      if (!query.productId) {
        throw new AppError('商品ID不能为空', 400);
      }
      
      // 处理排序参数
      let sortBy = 'createdAt';
      let order = 'desc';
      
      if (sort) {
        const [field, direction] = sort.split(':');
        sortBy = field;
        if (direction) {
          order = direction.toLowerCase();
        }
      }
      
      // 计算偏移量
      const offset = (page - 1) * limit;
      
      // 查询评价列表
      const [reviews, total] = await Promise.all([
        reviewRepository.findByProductId(query.productId, offset, limit, sortBy, order, query.rating),
        reviewRepository.countByProductId(query.productId, query.rating)
      ]);
      
      // 获取每个评价的回复
      const reviewsWithReplies = await Promise.all(
        reviews.map(async review => {
          const replies = await reviewRepository.findRepliesByReviewId(review.id);
          return {
            ...review,
            replies
          };
        })
      );
      
      return {
        items: reviewsWithReplies,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('获取商品评价列表失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取用户评价列表
   * @param {string} userId - 用户ID
   * @param {number} page - 页码
   * @param {number} limit - 每页数量
   * @param {string} sort - 排序方式
   * @returns {Promise<Object>} 评价列表和分页信息
   */
  async getUserReviews(userId, page, limit, sort) {
    try {
      // 处理排序参数
      let sortBy = 'createdAt';
      let order = 'desc';
      
      if (sort) {
        const [field, direction] = sort.split(':');
        sortBy = field;
        if (direction) {
          order = direction.toLowerCase();
        }
      }
      
      // 计算偏移量
      const offset = (page - 1) * limit;
      
      // 查询评价列表
      const [reviews, total] = await Promise.all([
        reviewRepository.findByUserId(userId, offset, limit, sortBy, order),
        reviewRepository.countByUserId(userId)
      ]);
      
      return {
        items: reviews,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('获取用户评价列表失败:', error);
      throw error;
    }
  }
  
  /**
   * 根据ID获取评价详情
   * @param {string} id - 评价ID
   * @returns {Promise<Object>} 评价详情
   */
  async getReviewById(id) {
    try {
      const review = await reviewRepository.findById(id);
      if (!review) {
        throw new AppError('评价不存在', 404);
      }
      
      // 获取评价回复
      const replies = await reviewRepository.findRepliesByReviewId(id);
      
      return {
        ...review,
        replies
      };
    } catch (error) {
      logger.error(`获取评价详情失败 - ID: ${id}`, error);
      throw error;
    }
  }
  
  /**
   * 更新评价
   * @param {string} id - 评价ID
   * @param {string} userId - 用户ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<Object|null>} 更新后的评价
   */
  async updateReview(id, userId, updateData) {
    try {
      // 查找评价
      const review = await reviewRepository.findById(id);
      if (!review) {
        return null;
      }
      
      // 验证权限
      if (review.userId !== userId) {
        return null;
      }
      
      // 更新评价
      const updatedReview = await reviewRepository.update(id, {
        ...updateData,
        updatedAt: new Date()
      });
      
      return updatedReview;
    } catch (error) {
      logger.error(`更新评价失败 - ID: ${id}`, error);
      throw error;
    }
  }
  
  /**
   * 删除评价
   * @param {string} id - 评价ID
   * @param {string} userId - 用户ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  async deleteReview(id, userId) {
    try {
      // 查找评价
      const review = await reviewRepository.findById(id);
      if (!review) {
        return false;
      }
      
      // 验证权限
      if (review.userId !== userId) {
        return false;
      }
      
      // 删除评价（软删除）
      await reviewRepository.softDelete(id);
      
      // 更新订单项评价状态
      await orderService.updateOrderItemReviewStatus(review.orderItemId, false);
      
      return true;
    } catch (error) {
      logger.error(`删除评价失败 - ID: ${id}`, error);
      throw error;
    }
  }
  
  /**
   * 回复评价
   * @param {string} reviewId - 评价ID
   * @param {string} content - 回复内容
   * @returns {Promise<Object|null>} 回复信息
   */
  async replyReview(reviewId, content) {
    try {
      // 检查评价是否存在
      const review = await reviewRepository.findById(reviewId);
      if (!review) {
        return null;
      }
      
      // 创建回复
      const reply = await reviewRepository.createReply({
        reviewId,
        content,
        createdAt: new Date()
      });
      
      // 更新评价的回复状态
      await reviewRepository.update(reviewId, {
        hasReply: true,
        replyAt: new Date()
      });
      
      return reply;
    } catch (error) {
      logger.error(`回复评价失败 - 评价ID: ${reviewId}`, error);
      throw error;
    }
  }
  
  /**
   * 获取评价统计信息
   * @param {string} productId - 商品ID
   * @returns {Promise<Object>} 统计信息
   */
  async getReviewStatistics(productId) {
    try {
      // 获取评价总数
      const total = await reviewRepository.countByProductId(productId);
      
      // 获取各评分的数量
      const ratingCounts = await reviewRepository.countByRatings(productId);
      
      // 计算评分分布
      const ratingDistribution = {
        5: ratingCounts[5] || 0,
        4: ratingCounts[4] || 0,
        3: ratingCounts[3] || 0,
        2: ratingCounts[2] || 0,
        1: ratingCounts[1] || 0
      };
      
      // 计算平均评分
      let averageRating = 0;
      if (total > 0) {
        let sum = 0;
        Object.entries(ratingDistribution).forEach(([rating, count]) => {
          sum += parseInt(rating) * count;
        });
        averageRating = Number((sum / total).toFixed(1));
      }
      
      // 获取有图评价数量
      const imageCount = await reviewRepository.countWithImages(productId);
      
      // 获取有回复评价数量
      const replyCount = await reviewRepository.countWithReplies(productId);
      
      return {
        total,
        averageRating,
        ratingDistribution,
        imageCount,
        replyCount
      };
    } catch (error) {
      logger.error(`获取评价统计失败 - 商品ID: ${productId}`, error);
      throw error;
    }
  }
  
  /**
   * 验证用户是否可以评价指定订单
   * @param {string} userId - 用户ID
   * @param {string} orderId - 订单ID
   * @returns {Promise<Array>} 可评价的订单项列表
   */
  async getReviewableItems(userId, orderId) {
    try {
      // 获取订单信息
      const order = await orderService.getOrderById(orderId);
      if (!order || order.userId !== userId) {
        throw new AppError('订单不存在或无权访问', 404);
      }
      
      if (order.status !== 'completed') {
        throw new AppError('只能评价已完成的订单', 400);
      }
      
      // 获取可评价的订单项
      const reviewableItems = await orderService.getReviewableOrderItems(orderId);
      
      return reviewableItems;
    } catch (error) {
      logger.error(`获取可评价项失败 - 用户ID: ${userId}, 订单ID: ${orderId}`, error);
      throw error;
    }
  }
}

module.exports = new ReviewService();