/**
 * 卖家端库存管理验证规则
 * 确保API输入数据合法性
 */

const { body, param, query, validationResult } = require('express-validator');

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
 * 验证获取库存列表参数
 */
const validateGetInventoryList = [
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
  query('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须是1-100之间的整数'),
  query('productId').optional().isInt({ min: 1 }).withMessage('产品ID必须是正整数'),
  query('skuId').optional().isInt({ min: 1 }).withMessage('SKU ID必须是正整数'),
  query('alertOnly').optional().isBoolean().withMessage('alertOnly必须是布尔值'),
  validate
];

/**
 * 验证产品ID参数
 */
const validateProductId = [
  param('id').isInt({ min: 1 }).withMessage('产品ID必须是正整数'),
  validate
];

/**
 * 验证更新库存参数
 */
const validateUpdateInventory = [
  param('id').isInt({ min: 1 }).withMessage('产品ID必须是正整数'),
  body('quantity').isInt({ min: 0 }).withMessage('库存数量必须是非负整数'),
  body('skuId').optional().isInt({ min: 1 }).withMessage('SKU ID必须是正整数'),
  body('reason').optional().trim().isLength({ max: 255 }).withMessage('更新原因不能超过255个字符'),
  validate
];

/**
 * 验证获取库存预警参数
 */
const validateGetInventoryAlerts = [
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
  query('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须是1-100之间的整数'),
  validate
];

/**
 * 验证设置库存预警阈值参数
 */
const validateSetInventoryAlert = [
  body('productId').isInt({ min: 1 }).withMessage('产品ID必须是正整数'),
  body('alertThreshold').isInt({ min: 0 }).withMessage('预警阈值必须是非负整数'),
  body('skuId').optional().isInt({ min: 1 }).withMessage('SKU ID必须是正整数'),
  validate
];

/**
 * 验证批量更新库存参数
 */
const validateBatchUpdateInventory = [
  body('items').isArray().withMessage('items必须是数组'),
  body('items.*.productId').isInt({ min: 1 }).withMessage('产品ID必须是正整数'),
  body('items.*.quantity').isInt({ min: 0 }).withMessage('库存数量必须是非负整数'),
  body('items.*.skuId').optional().isInt({ min: 1 }).withMessage('SKU ID必须是正整数'),
  body('items.*.reason').optional().trim().isLength({ max: 255 }).withMessage('更新原因不能超过255个字符'),
  validate
];

/**
 * 验证导出库存参数
 */
const validateExportInventory = [
  query('format').optional().isIn(['csv', 'json']).withMessage('导出格式必须是csv或json'),
  validate
];

module.exports = {
  validateGetInventoryList,
  validateProductId,
  validateUpdateInventory,
  validateGetInventoryAlerts,
  validateSetInventoryAlert,
  validateBatchUpdateInventory,
  validateExportInventory
};