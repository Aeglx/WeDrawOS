/**
 * 卖家端订单管理验证规则
 * 确保订单管理相关API输入数据的合法性
 */

const { body, query, param, validationResult } = require('express-validator');

/**
 * 验证获取订单列表参数
 */
const validateGetOrderList = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是大于等于1的整数'),
  
  query('pageSize')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量必须在1-100之间'),
  
  query('status')
    .optional()
    .isIn(['pending_payment', 'paid', 'pending_shipment', 'shipped', 'delivered', 'completed', 'canceled', 'refund_requested', 'refunded'])
    .withMessage('状态值无效'),
  
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('开始日期格式必须是ISO8601格式'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('结束日期格式必须是ISO8601格式'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '请求参数错误',
        errors: errors.array()
      });
    }
    next();
  }
];

/**
 * 验证订单ID参数
 */
const validateOrderId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('订单ID必须是大于等于1的整数'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '请求参数错误',
        errors: errors.array()
      });
    }
    next();
  }
];

/**
 * 验证更新订单状态参数
 */
const validateUpdateOrderStatus = [
  ...validateOrderId,
  
  body('status')
    .isIn(['pending_payment', 'paid', 'pending_shipment', 'shipped', 'delivered', 'completed', 'canceled', 'refund_requested', 'refunded'])
    .withMessage('状态值无效'),
  
  body('remark')
    .optional()
    .isLength({ max: 500 })
    .withMessage('备注不能超过500个字符'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '请求参数错误',
        errors: errors.array()
      });
    }
    next();
  }
];

/**
 * 验证发货参数
 */
const validateShipOrder = [
  ...validateOrderId,
  
  body('trackingNumber')
    .notEmpty()
    .withMessage('物流单号不能为空')
    .isLength({ min: 1, max: 100 })
    .withMessage('物流单号长度必须在1-100个字符之间'),
  
  body('shippingCompany')
    .notEmpty()
    .withMessage('物流公司不能为空')
    .isLength({ min: 1, max: 50 })
    .withMessage('物流公司名称长度必须在1-50个字符之间'),
  
  body('remark')
    .optional()
    .isLength({ max: 500 })
    .withMessage('备注不能超过500个字符'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '请求参数错误',
        errors: errors.array()
      });
    }
    next();
  }
];

/**
 * 验证取消订单参数
 */
const validateCancelOrder = [
  ...validateOrderId,
  
  body('reason')
    .notEmpty()
    .withMessage('取消原因不能为空')
    .isLength({ min: 1, max: 500 })
    .withMessage('取消原因长度必须在1-500个字符之间'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '请求参数错误',
        errors: errors.array()
      });
    }
    next();
  }
];

/**
 * 验证退款参数
 */
const validateRefundAction = [
  ...validateOrderId,
  
  body('reason')
    .notEmpty()
    .withMessage('原因不能为空')
    .isLength({ min: 1, max: 500 })
    .withMessage('原因长度必须在1-500个字符之间'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '请求参数错误',
        errors: errors.array()
      });
    }
    next();
  }
];

/**
 * 验证批量发货参数
 */
const validateBatchShipOrders = [
  body('orders')
    .isArray()
    .withMessage('订单列表必须是数组格式')
    .notEmpty()
    .withMessage('订单列表不能为空')
    .custom((orders) => {
      if (orders.length > 100) {
        throw new Error('批量操作最多支持100个订单');
      }
      
      // 验证每个订单的数据
      for (const order of orders) {
        if (!order.orderId || typeof order.orderId !== 'number') {
          throw new Error('每个订单必须包含有效的orderId');
        }
        if (!order.trackingNumber || order.trackingNumber.length > 100) {
          throw new Error('每个订单必须包含有效的trackingNumber且长度不超过100');
        }
        if (!order.shippingCompany || order.shippingCompany.length > 50) {
          throw new Error('每个订单必须包含有效的shippingCompany且长度不超过50');
        }
      }
      
      return true;
    }),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '请求参数错误',
        errors: errors.array()
      });
    }
    next();
  }
];

module.exports = {
  validateGetOrderList,
  validateOrderId,
  validateUpdateOrderStatus,
  validateShipOrder,
  validateCancelOrder,
  validateRefundAction,
  validateBatchShipOrders
};