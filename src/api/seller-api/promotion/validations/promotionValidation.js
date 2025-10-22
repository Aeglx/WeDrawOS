/**
 * 卖家端促销管理验证规则
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
 * 验证促销活动基本信息
 */
const validatePromotionBase = [
  body('name').isString().trim().notEmpty().withMessage('促销活动名称不能为空'),
  body('type').isIn(['discount', 'full_reduction', 'free_gift', 'coupon', 'flash_sale', 'group_buy'])
    .withMessage('促销类型必须是有效的类型值'),
  body('description').optional().isString().withMessage('促销描述必须是字符串'),
  body('startTime').isISO8601().withMessage('开始时间格式错误'),
  body('endTime').isISO8601().withMessage('结束时间格式错误'),
  body('rule').isObject().withMessage('促销规则必须是对象格式'),
  body('productIds').optional().isArray().withMessage('产品ID列表必须是数组格式'),
  validate
];

/**
 * 验证创建促销活动参数
 */
const validateCreatePromotion = [
  ...validatePromotionBase,
  body('status').optional().isIn(['draft', 'active', 'paused'])
    .withMessage('促销状态必须是有效的状态值'),
  validate
];

/**
 * 验证促销活动列表查询参数
 */
const validatePromotionList = [
  query('status').optional().isIn(['draft', 'active', 'paused', 'ended', 'expired'])
    .withMessage('促销状态必须是有效的状态值'),
  query('type').optional().isIn(['discount', 'full_reduction', 'free_gift', 'coupon', 'flash_sale', 'group_buy'])
    .withMessage('促销类型必须是有效的类型值'),
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须是大于0的整数'),
  query('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('每页大小必须是1-100之间的整数'),
  validate
];

/**
 * 验证促销活动ID参数
 */
const validatePromotionId = [
  param('id').isString().trim().notEmpty().withMessage('促销活动ID不能为空'),
  validate
];

/**
 * 验证更新促销活动参数
 */
const validateUpdatePromotion = [
  param('id').isString().trim().notEmpty().withMessage('促销活动ID不能为空'),
  body('name').optional().isString().trim().notEmpty().withMessage('促销活动名称不能为空'),
  body('type').optional().isIn(['discount', 'full_reduction', 'free_gift', 'coupon', 'flash_sale', 'group_buy'])
    .withMessage('促销类型必须是有效的类型值'),
  body('description').optional().isString().withMessage('促销描述必须是字符串'),
  body('startTime').optional().isISO8601().withMessage('开始时间格式错误'),
  body('endTime').optional().isISO8601().withMessage('结束时间格式错误'),
  body('rule').optional().isObject().withMessage('促销规则必须是对象格式'),
  body('productIds').optional().isArray().withMessage('产品ID列表必须是数组格式'),
  body('status').optional().isIn(['draft', 'active', 'paused', 'ended'])
    .withMessage('促销状态必须是有效的状态值'),
  validate
];

/**
 * 验证更新促销活动状态参数
 */
const validatePromotionStatus = [
  param('id').isString().trim().notEmpty().withMessage('促销活动ID不能为空'),
  body('status').isIn(['active', 'paused']).withMessage('促销状态必须是active或paused'),
  validate
];

/**
 * 验证促销活动统计参数
 */
const validatePromotionStatistics = [
  query('promotionId').optional().isString().trim().notEmpty().withMessage('促销活动ID不能为空'),
  query('startDate').optional().isISO8601().withMessage('开始日期格式错误'),
  query('endDate').optional().isISO8601().withMessage('结束日期格式错误'),
  validate
];

module.exports = {
  validateCreatePromotion,
  validatePromotionList,
  validatePromotionId,
  validateUpdatePromotion,
  validatePromotionStatus,
  validatePromotionStatistics
};