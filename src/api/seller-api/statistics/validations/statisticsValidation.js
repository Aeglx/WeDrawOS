/**
 * 卖家端统计管理验证规则
 * 确保API输入数据合法性
 */

const { query, validationResult } = require('express-validator');

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
 * 验证日期范围参数
 */
const validateDateRange = [
  query('startDate').optional().isISO8601().withMessage('开始日期格式错误'),
  query('endDate').optional().isISO8601().withMessage('结束日期格式错误'),
  query('period').optional().isIn(['day', 'week', 'month']).withMessage('统计周期必须是day、week或month'),
  validate
];

/**
 * 验证产品销量排行参数
 */
const validateProductRanking = [
  query('startDate').optional().isISO8601().withMessage('开始日期格式错误'),
  query('endDate').optional().isISO8601().withMessage('结束日期格式错误'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('数量限制必须是1-100之间的整数'),
  validate
];

/**
 * 验证店铺概览参数
 */
const validateStoreOverview = [
  query('dateRange').optional().isIn(['7days', '30days', '90days']).withMessage('日期范围必须是7days、30days或90days'),
  validate
];

module.exports = {
  validateDateRange,
  validateProductRanking,
  validateStoreOverview
};