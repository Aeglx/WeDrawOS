/**
 * 评价控制器
 * 处理商品评价相关的HTTP请求
 */

const logger = require('@core/utils/logger');
const reviewService = require('../services/reviewService');
const { responseHandler } = require('@core/utils/responseHandler');
const messageQueue = require('@core/messaging/messageQueue');
const { MESSAGE_TOPICS } = require('@common-api/message-queue/topics/messageTopics');

class ReviewController {
  /**
   * 创建商品评价
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - 下一个中间件函数
   */
  async createReview(req, res, next) {
    try {
      const userId = req.user.id;
      const { productId, orderItemId, rating, content, images = [] } = req.body;
      
      // 参数验证
      if (!productId || !orderItemId || !rating || !content) {
        return responseHandler.badRequest(res, '商品ID、订单项ID、评分和评价内容为必填项');
      }
      
      if (rating < 1 || rating > 5) {
        return responseHandler.badRequest(res, '评分必须在1-5之间');
      }
      
      const review = await reviewService.createReview({
        userId,
        productId,
        orderItemId,
        rating,
        content,
        images
      });
      
      // 发送评价创建消息到消息队列
      await messageQueue.publish(MESSAGE_TOPICS.REVIEW.CREATED, {
        reviewId: review.id,
        productId,
        userId,
        rating,
        timestamp: new Date().toISOString()
      });
      
      logger.info(`创建评价成功 - 用户ID: ${userId}, 商品ID: ${productId}`);
      return responseHandler.success(res, review, '评价提交成功');
    } catch (error) {
      logger.error(`创建评价失败 - 用户ID: ${req.user.id}`, error);
      return responseHandler.error(res, error);
    }
  }
  
  /**
   * 获取商品评价列表
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - 下一个中间件函数
   */
  async getProductReviews(req, res, next) {
    try {
      const { productId } = req.params;
      const { page = 1, limit = 10, rating, sort = 'createdAt:desc' } = req.query;
      
      const query = {
        productId,
        rating: rating ? parseInt(rating) : null
      };
      
      const reviews = await reviewService.getProductReviews(
        query,
        parseInt(page),
        parseInt(limit),
        sort
      );
      
      return responseHandler.success(res, reviews);
    } catch (error) {
      logger.error(`获取商品评价列表失败 - 商品ID: ${req.params.productId}`, error);
      return responseHandler.error(res, error);
    }
  }
  
  /**
   * 获取用户的评价列表
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - 下一个中间件函数
   */
  async getUserReviews(req, res, next) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10, sort = 'createdAt:desc' } = req.query;
      
      const reviews = await reviewService.getUserReviews(
        userId,
        parseInt(page),
        parseInt(limit),
        sort
      );
      
      return responseHandler.success(res, reviews);
    } catch (error) {
      logger.error(`获取用户评价列表失败 - 用户ID: ${req.user.id}`, error);
      return responseHandler.error(res, error);
    }
  }
  
  /**
   * 获取评价详情
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - 下一个中间件函数
   */
  async getReviewDetail(req, res, next) {
    try {
      const { id } = req.params;
      
      const review = await reviewService.getReviewById(id);
      
      if (!review) {
        return responseHandler.notFound(res, '评价不存在');
      }
      
      return responseHandler.success(res, review);
    } catch (error) {
      logger.error(`获取评价详情失败 - 评价ID: ${req.params.id}`, error);
      return responseHandler.error(res, error);
    }
  }
  
  /**
   * 更新评价
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - 下一个中间件函数
   */
  async updateReview(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { content, images } = req.body;
      
      if (!content && !images) {
        return responseHandler.badRequest(res, '至少需要更新评价内容或图片');
      }
      
      const review = await reviewService.updateReview(id, userId, { content, images });
      
      if (!review) {
        return responseHandler.notFound(res, '评价不存在或无权修改');
      }
      
      // 发送评价更新消息
      await messageQueue.publish(MESSAGE_TOPICS.REVIEW.UPDATED, {
        reviewId: review.id,
        userId,
        timestamp: new Date().toISOString()
      });
      
      logger.info(`更新评价成功 - 用户ID: ${userId}, 评价ID: ${id}`);
      return responseHandler.success(res, review, '评价更新成功');
    } catch (error) {
      logger.error(`更新评价失败 - 用户ID: ${req.user.id}, 评价ID: ${req.params.id}`, error);
      return responseHandler.error(res, error);
    }
  }
  
  /**
   * 删除评价
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - 下一个中间件函数
   */
  async deleteReview(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      
      const success = await reviewService.deleteReview(id, userId);
      
      if (!success) {
        return responseHandler.notFound(res, '评价不存在或无权删除');
      }
      
      // 发送评价删除消息
      await messageQueue.publish(MESSAGE_TOPICS.REVIEW.DELETED, {
        reviewId: id,
        userId,
        timestamp: new Date().toISOString()
      });
      
      logger.info(`删除评价成功 - 用户ID: ${userId}, 评价ID: ${id}`);
      return responseHandler.success(res, null, '评价删除成功');
    } catch (error) {
      logger.error(`删除评价失败 - 用户ID: ${req.user.id}, 评价ID: ${req.params.id}`, error);
      return responseHandler.error(res, error);
    }
  }
  
  /**
   * 回复评价
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - 下一个中间件函数
   */
  async replyReview(req, res, next) {
    try {
      const { id } = req.params;
      const { content } = req.body;
      
      if (!content) {
        return responseHandler.badRequest(res, '回复内容不能为空');
      }
      
      const reply = await reviewService.replyReview(id, content);
      
      if (!reply) {
        return responseHandler.notFound(res, '评价不存在或无法回复');
      }
      
      // 发送评价回复消息
      await messageQueue.publish(MESSAGE_TOPICS.REVIEW.REPLIED, {
        reviewId: id,
        replyId: reply.id,
        timestamp: new Date().toISOString()
      });
      
      logger.info(`回复评价成功 - 评价ID: ${id}`);
      return responseHandler.success(res, reply, '回复成功');
    } catch (error) {
      logger.error(`回复评价失败 - 评价ID: ${req.params.id}`, error);
      return responseHandler.error(res, error);
    }
  }
  
  /**
   * 获取评价统计信息
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - 下一个中间件函数
   */
  async getReviewStatistics(req, res, next) {
    try {
      const { productId } = req.params;
      
      const statistics = await reviewService.getReviewStatistics(productId);
      
      return responseHandler.success(res, statistics);
    } catch (error) {
      logger.error(`获取评价统计失败 - 商品ID: ${req.params.productId}`, error);
      return responseHandler.error(res, error);
    }
  }
}

module.exports = new ReviewController();