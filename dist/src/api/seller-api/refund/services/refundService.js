/**
 * 卖家端退款管理服务
 * 处理退款相关的核心业务逻辑
 */

const logger = require('../../../core/utils/logger');
const refundRepository = require('../repositories/refundRepository');
const orderService = require('../../order/services/orderService');
const inventoryService = require('../../inventory/services/inventoryService');
const paymentService = require('../../../core/services/paymentService');
const messageQueue = require('../../../core/utils/messageQueue');
const di = require('../../../core/di/container');

/**
 * 退款状态枚举
 */
const REFUND_STATUS = {
  PENDING: 'pending',      // 待处理
  PROCESSING: 'processing', // 处理中
  APPROVED: 'approved',    // 已同意
  REJECTED: 'rejected',    // 已拒绝
  COMPLETED: 'completed',  // 已完成
  FAILED: 'failed'         // 失败
};

/**
 * 退款管理服务类
 * @class RefundService
 */
class RefundService {
  constructor() {
    // 从依赖注入容器获取服务实例
    this.refundRepository = di.get('refundRepository') || refundRepository;
    this.orderService = di.get('orderService') || orderService;
    this.inventoryService = di.get('inventoryService') || inventoryService;
    this.paymentService = di.get('paymentService') || paymentService;
    this.messageQueue = di.get('messageQueue') || messageQueue;
  }

  /**
   * 获取退款列表
   * @param {Object} params - 查询参数
   * @param {string} params.sellerId - 卖家ID
   * @param {string} [params.status] - 退款状态
   * @param {string} [params.startDate] - 开始日期
   * @param {string} [params.endDate] - 结束日期
   * @param {number} params.page - 页码
   * @param {number} params.pageSize - 每页大小
   * @returns {Promise<Object>} 退款列表和分页信息
   */
  async getRefundList(params) {
    try {
      const { sellerId, status, startDate, endDate, page, pageSize } = params;

      // 调用仓库层获取退款列表
      const result = await this.refundRepository.getRefundList({
        sellerId,
        status,
        startDate,
        endDate,
        page,
        pageSize
      });

      // 格式化退款列表数据
      const formattedRefunds = result.items.map(refund => ({
        id: refund.id,
        orderId: refund.order_id,
        orderNo: refund.order_no,
        productInfo: JSON.parse(refund.product_info),
        userId: refund.user_id,
        amount: refund.amount,
        refundAmount: refund.refund_amount,
        reason: refund.reason,
        status: refund.status,
        sellerRemark: refund.seller_remark,
        createdAt: refund.created_at,
        updatedAt: refund.updated_at
      }));

      return {
        list: formattedRefunds,
        pagination: {
          total: result.total,
          page,
          pageSize,
          totalPages: Math.ceil(result.total / pageSize)
        }
      };
    } catch (error) {
      logger.error('获取退款列表失败:', error);
      throw new Error(`获取退款列表失败: ${error.message}`);
    }
  }

  /**
   * 获取退款详情
   * @param {Object} params - 查询参数
   * @param {string} params.sellerId - 卖家ID
   * @param {string} params.refundId - 退款ID
   * @returns {Promise<Object>} 退款详情
   */
  async getRefundDetail(params) {
    try {
      const { sellerId, refundId } = params;

      // 调用仓库层获取退款详情
      const refund = await this.refundRepository.getRefundDetail({
        sellerId,
        refundId
      });

      if (!refund) {
        throw new Error('退款记录不存在');
      }

      // 获取关联的订单信息
      const orderDetail = await this.orderService.getOrderDetail({
        orderId: refund.order_id,
        sellerId
      });

      // 格式化退款详情数据
      return {
        id: refund.id,
        orderId: refund.order_id,
        orderNo: refund.order_no,
        orderDetail,
        productInfo: JSON.parse(refund.product_info),
        userId: refund.user_id,
        userName: refund.user_name,
        userPhone: refund.user_phone,
        amount: refund.amount,
        refundAmount: refund.refund_amount,
        reason: refund.reason,
        description: refund.description,
        status: refund.status,
        sellerRemark: refund.seller_remark,
        images: refund.images ? JSON.parse(refund.images) : [],
        createdAt: refund.created_at,
        updatedAt: refund.updated_at,
        processedAt: refund.processed_at,
        processBy: refund.process_by
      };
    } catch (error) {
      logger.error('获取退款详情失败:', error);
      throw error;
    }
  }

  /**
   * 处理退款申请
   * @param {Object} params - 处理参数
   * @param {string} params.sellerId - 卖家ID
   * @param {string} params.refundId - 退款ID
   * @param {string} params.action - 操作类型(approve/reject)
   * @param {string} params.reason - 处理原因
   * @param {number} [params.refundAmount] - 退款金额
   * @returns {Promise<Object>} 处理结果
   */
  async processRefund(params) {
    try {
      const { sellerId, refundId, action, reason, refundAmount } = params;

      // 开启事务
      const transaction = await this.refundRepository.beginTransaction();

      try {
        // 获取退款详情
        const refund = await this.refundRepository.getRefundDetail({
          sellerId,
          refundId,
          transaction
        });

        if (!refund) {
          throw new Error('退款记录不存在');
        }

        if (refund.status !== REFUND_STATUS.PENDING) {
          throw new Error('该退款申请已处理');
        }

        // 更新退款状态
        const updateData = {
          status: action === 'approve' ? REFUND_STATUS.APPROVED : REFUND_STATUS.REJECTED,
          seller_remark: reason,
          processed_at: new Date(),
          process_by: sellerId
        };

        if (refundAmount) {
          updateData.refund_amount = refundAmount;
        }

        await this.refundRepository.updateRefund({
          refundId,
          data: updateData,
          transaction
        });

        // 如果同意退款
        if (action === 'approve') {
          // 处理退款支付
          const paymentResult = await this.paymentService.refund({
            orderId: refund.order_id,
            refundAmount: refundAmount || refund.refund_amount,
            reason
          });

          // 更新退款状态为已完成
          await this.refundRepository.updateRefund({
            refundId,
            data: {
              status: REFUND_STATUS.COMPLETED,
              payment_info: JSON.stringify(paymentResult)
            },
            transaction
          });

          // 如果是退货退款，需要恢复库存
          if (refund.type === 'return') {
            const productInfo = JSON.parse(refund.product_info);
            await this.inventoryService.updateProductInventory({
              productId: productInfo.productId,
              quantity: productInfo.quantity,
              operation: 'increase',
              reason: '退款退货恢复库存',
              transaction
            });
          }

          // 更新订单状态为已退款
          await this.orderService.updateOrderStatus({
            orderId: refund.order_id,
            status: 'refunded',
            transaction
          });
        }

        // 提交事务
        await transaction.commit();

        // 发送消息通知用户
        await this.messageQueue.publish('REFUND_PROCESSED', {
          refundId,
          status: updateData.status,
          orderId: refund.order_id,
          userId: refund.user_id,
          reason
        });

        return {
          id: refundId,
          status: updateData.status,
          processedAt: updateData.processed_at
        };
      } catch (error) {
        // 回滚事务
        await transaction.rollback();
        logger.error('处理退款申请失败，事务回滚:', error);
        throw error;
      }
    } catch (error) {
      logger.error('处理退款申请失败:', error);
      throw error;
    }
  }

  /**
   * 获取退款统计信息
   * @param {Object} params - 查询参数
   * @param {string} params.sellerId - 卖家ID
   * @param {string} [params.startDate] - 开始日期
   * @param {string} [params.endDate] - 结束日期
   * @returns {Promise<Object>} 退款统计信息
   */
  async getRefundStatistics(params) {
    try {
      const { sellerId, startDate, endDate } = params;

      // 调用仓库层获取退款统计
      const statistics = await this.refundRepository.getRefundStatistics({
        sellerId,
        startDate,
        endDate
      });

      // 计算退款率
      const totalOrders = statistics.totalOrders || 1;
      const refundRate = (statistics.totalRefunds / totalOrders * 100).toFixed(2);

      return {
        totalRefunds: statistics.totalRefunds,
        pendingRefunds: statistics.pendingRefunds,
        approvedRefunds: statistics.approvedRefunds,
        rejectedRefunds: statistics.rejectedRefunds,
        completedRefunds: statistics.completedRefunds,
        totalRefundAmount: statistics.totalRefundAmount,
        refundRate: parseFloat(refundRate)
      };
    } catch (error) {
      logger.error('获取退款统计信息失败:', error);
      throw new Error(`获取退款统计信息失败: ${error.message}`);
    }
  }
}

// 创建服务实例
const refundService = new RefundService();

// 注册到依赖注入容器
try {
  di.register('refundService', refundService);
} catch (error) {
  logger.warn('依赖注入容器注册退款服务失败:', error);
}

module.exports = refundService;