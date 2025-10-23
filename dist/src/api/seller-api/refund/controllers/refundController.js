/**
 * 卖家端退款管理控制器
 * 处理退款相关的HTTP请求
 */

const logger = require('../../../core/utils/logger');
const refundService = require('../services/refundService');
const di = require('../../../core/di/container');

/**
 * 退款管理控制器类
 * @class RefundController
 */
class RefundController {
  constructor() {
    // 从依赖注入容器获取服务实例
    this.refundService = di.get('refundService') || refundService;
  }

  /**
   * 获取退款列表
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件
   */
  async getRefundList(req, res, next) {
    try {
      const { sellerId } = req.user;
      const { status, startDate, endDate, page = 1, pageSize = 10 } = req.query;

      logger.info(`卖家[${sellerId}]获取退款列表请求`, {
        status,
        startDate,
        endDate,
        page,
        pageSize
      });

      const result = await this.refundService.getRefundList({
        sellerId,
        status,
        startDate,
        endDate,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      });

      logger.info(`卖家[${sellerId}]获取退款列表成功`);
      res.json({
        success: true,
        message: '获取退款列表成功',
        data: result
      });
    } catch (error) {
      logger.error(`获取退款列表失败:`, error);
      next(error);
    }
  }

  /**
   * 获取退款详情
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件
   */
  async getRefundDetail(req, res, next) {
    try {
      const { sellerId } = req.user;
      const { id } = req.params;

      logger.info(`卖家[${sellerId}]获取退款详情请求`, {
        refundId: id
      });

      const refundDetail = await this.refundService.getRefundDetail({
        sellerId,
        refundId: id
      });

      logger.info(`卖家[${sellerId}]获取退款详情成功`);
      res.json({
        success: true,
        message: '获取退款详情成功',
        data: refundDetail
      });
    } catch (error) {
      logger.error(`获取退款详情失败:`, error);
      next(error);
    }
  }

  /**
   * 处理退款申请
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件
   */
  async processRefund(req, res, next) {
    try {
      const { sellerId } = req.user;
      const { id } = req.params;
      const { action, reason, refundAmount } = req.body;

      logger.info(`卖家[${sellerId}]处理退款申请请求`, {
        refundId: id,
        action,
        refundAmount
      });

      const result = await this.refundService.processRefund({
        sellerId,
        refundId: id,
        action,
        reason,
        refundAmount: refundAmount ? parseFloat(refundAmount) : undefined
      });

      logger.info(`卖家[${sellerId}]处理退款申请成功`, { refundId: id });
      res.json({
        success: true,
        message: '退款申请处理成功',
        data: result
      });
    } catch (error) {
      logger.error(`处理退款申请失败:`, error);
      next(error);
    }
  }

  /**
   * 获取退款统计信息
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件
   */
  async getRefundStatistics(req, res, next) {
    try {
      const { sellerId } = req.user;
      const { startDate, endDate } = req.query;

      logger.info(`卖家[${sellerId}]获取退款统计信息请求`, {
        startDate,
        endDate
      });

      const statistics = await this.refundService.getRefundStatistics({
        sellerId,
        startDate,
        endDate
      });

      logger.info(`卖家[${sellerId}]获取退款统计信息成功`);
      res.json({
        success: true,
        message: '获取退款统计信息成功',
        data: statistics
      });
    } catch (error) {
      logger.error(`获取退款统计信息失败:`, error);
      next(error);
    }
  }

  /**
   * 拒绝退款申请
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件
   */
  async rejectRefund(req, res, next) {
    try {
      const { sellerId } = req.user;
      const { id } = req.params;
      const { reason } = req.body;

      logger.info(`卖家[${sellerId}]拒绝退款申请请求`, {
        refundId: id
      });

      const result = await this.refundService.processRefund({
        sellerId,
        refundId: id,
        action: 'reject',
        reason
      });

      logger.info(`卖家[${sellerId}]拒绝退款申请成功`, { refundId: id });
      res.json({
        success: true,
        message: '拒绝退款申请成功',
        data: result
      });
    } catch (error) {
      logger.error(`拒绝退款申请失败:`, error);
      next(error);
    }
  }

  /**
   * 同意退款申请
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件
   */
  async approveRefund(req, res, next) {
    try {
      const { sellerId } = req.user;
      const { id } = req.params;
      const { refundAmount, reason } = req.body;

      logger.info(`卖家[${sellerId}]同意退款申请请求`, {
        refundId: id,
        refundAmount
      });

      const result = await this.refundService.processRefund({
        sellerId,
        refundId: id,
        action: 'approve',
        reason,
        refundAmount: refundAmount ? parseFloat(refundAmount) : undefined
      });

      logger.info(`卖家[${sellerId}]同意退款申请成功`, { refundId: id });
      res.json({
        success: true,
        message: '同意退款申请成功',
        data: result
      });
    } catch (error) {
      logger.error(`同意退款申请失败:`, error);
      next(error);
    }
  }
}

module.exports = new RefundController();