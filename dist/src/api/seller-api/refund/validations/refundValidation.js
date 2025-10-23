/**
 * 卖家端退款管理验证规则
 * 确保API输入数据合法性
 */

const { body, query, param, validationResult } = require('express-validator');

/**
 * 验证请求参数
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一个中间件
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: '请求参数错误',
      errors: errors.array()
    });
  }
  return next();
};

/**
 * 验证退款列表查询参数
 */
const validateRefundList = [
  query('status').optional().isIn(['pending', 'processing', 'approved', 'rejected', 'completed', 'failed'])
    .withMessage('退款状态必须是有效的状态值'),
  query('startDate').optional().isISO8601().withMessage('开始日期格式错误'),
  query('endDate').optional().isISO8601().withMessage('结束日期格式错误'),
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须是大于0的整数'),
  query('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('每页大小必须是1-100之间的整数'),
  validate
];

/**
 * 验证退款ID参数
 */
const validateRefundId = [
  param('id').isString().trim().notEmpty().withMessage('退款ID不能为空'),
  validate
];

/**
 * 验证处理退款申请参数
 */
const validateProcessRefund = [
  param('id').isString().trim().notEmpty().withMessage('退款ID不能为空'),
  body('action').isIn(['approve', 'reject']).withMessage('操作类型必须是approve或reject'),
  body('reason').isString().trim().notEmpty().withMessage('处理原因不能为空'),
  body('refundAmount').optional().isFloat({ min: 0 }).withMessage('退款金额必须是大于等于0的数字'),
  validate
];

/**
 * 验证退款统计查询参数
 */
const validateRefundStatistics = [
  query('startDate').optional().isISO8601().withMessage('开始日期格式错误'),
  query('endDate').optional().isISO8601().withMessage('结束日期格式错误'),
  validate
];

module.exports = {
  validateRefundList,
  validateRefundId,
  validateProcessRefund,
  validateRefundStatistics
};