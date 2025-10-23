/**
 * 评价相关的验证规则
 */

const { body, param, query } = require('express-validator');

// 创建评价验证规则
const createReview = [
  body('orderItemId')
    .notEmpty()
    .withMessage('订单项ID不能为空')
    .isString()
    .withMessage('订单项ID必须是字符串'),
  
  body('productId')
    .notEmpty()
    .withMessage('商品ID不能为空')
    .isString()
    .withMessage('商品ID必须是字符串'),
  
  body('rating')
    .notEmpty()
    .withMessage('评分不能为空')
    .isInt({ min: 1, max: 5 })
    .withMessage('评分必须是1到5之间的整数'),
  
  body('content')
    .notEmpty()
    .withMessage('评价内容不能为空')
    .isString()
    .withMessage('评价内容必须是字符串')
    .isLength({ min: 5, max: 500 })
    .withMessage('评价内容长度必须在5到500个字符之间'),
  
  body('images')
    .optional()
    .isArray()
    .withMessage('图片列表必须是数组')
    .custom(array => array.every(item => typeof item === 'string'))
    .withMessage('图片URL必须是字符串')
];

// 获取商品评价列表验证规则
const getProductReviews = [
  param('productId')
    .notEmpty()
    .withMessage('商品ID不能为空')
    .isString()
    .withMessage('商品ID必须是字符串'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是大于等于1的整数')
    .toInt(),
  
  query('pageSize')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量必须是1到100之间的整数')
    .toInt(),
  
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'rating', 'hasReply'])
    .withMessage('排序字段只能是createdAt、rating或hasReply'),
  
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('排序方向只能是asc或desc'),
  
  query('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('评分筛选必须是1到5之间的整数')
    .toInt()
];

// 获取用户评价列表验证规则
const getUserReviews = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是大于等于1的整数')
    .toInt(),
  
  query('pageSize')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量必须是1到100之间的整数')
    .toInt(),
  
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'rating'])
    .withMessage('排序字段只能是createdAt或rating'),
  
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('排序方向只能是asc或desc')
];

// 获取评价详情验证规则
const getReviewDetail = [
  param('id')
    .notEmpty()
    .withMessage('评价ID不能为空')
    .isString()
    .withMessage('评价ID必须是字符串')
];

// 更新评价验证规则
const updateReview = [
  param('id')
    .notEmpty()
    .withMessage('评价ID不能为空')
    .isString()
    .withMessage('评价ID必须是字符串'),
  
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('评分必须是1到5之间的整数'),
  
  body('content')
    .optional()
    .isString()
    .withMessage('评价内容必须是字符串')
    .isLength({ min: 5, max: 500 })
    .withMessage('评价内容长度必须在5到500个字符之间'),
  
  body('images')
    .optional()
    .isArray()
    .withMessage('图片列表必须是数组')
    .custom(array => array.every(item => typeof item === 'string'))
    .withMessage('图片URL必须是字符串')
];

// 删除评价验证规则
const deleteReview = [
  param('id')
    .notEmpty()
    .withMessage('评价ID不能为空')
    .isString()
    .withMessage('评价ID必须是字符串')
];

// 获取评价回复验证规则
const getReviewReplies = [
  param('id')
    .notEmpty()
    .withMessage('评价ID不能为空')
    .isString()
    .withMessage('评价ID必须是字符串')
];

// 回复评价验证规则
const replyReview = [
  param('id')
    .notEmpty()
    .withMessage('评价ID不能为空')
    .isString()
    .withMessage('评价ID必须是字符串'),
  
  body('content')
    .notEmpty()
    .withMessage('回复内容不能为空')
    .isString()
    .withMessage('回复内容必须是字符串')
    .isLength({ min: 1, max: 300 })
    .withMessage('回复内容长度必须在1到300个字符之间')
];

// 获取评价统计验证规则
const getReviewStats = [
  param('productId')
    .notEmpty()
    .withMessage('商品ID不能为空')
    .isString()
    .withMessage('商品ID必须是字符串')
];

// 获取可评价项验证规则
const getEvaluableItems = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是大于等于1的整数')
    .toInt(),
  
  query('pageSize')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量必须是1到100之间的整数')
    .toInt()
];

module.exports = {
  createReview,
  getProductReviews,
  getUserReviews,
  getReviewDetail,
  updateReview,
  deleteReview,
  getReviewReplies,
  replyReview,
  getReviewStats,
  getEvaluableItems
};