/**
 * 卖家端店铺管理验证规则
 * 确保店铺管理相关API输入数据的合法性
 */

const { body, query, validationResult } = require('express-validator');

/**
 * 验证更新店铺信息
 */
const validateUpdateShopInfo = [
  body('name')
    .isLength({ min: 1, max: 100 })
    .withMessage('店铺名称长度必须在1-100个字符之间'),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('店铺描述不能超过500个字符'),
  
  body('contactPhone')
    .optional()
    .matches(/^1[3-9]\d{9}$/)
    .withMessage('联系电话格式不正确'),
  
  body('contactEmail')
    .optional()
    .isEmail()
    .withMessage('联系邮箱格式不正确'),
  
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
 * 验证更新店铺装修配置
 */
const validateUpdateShopDecoration = [
  body('theme')
    .isLength({ min: 1, max: 50 })
    .withMessage('主题名称长度必须在1-50个字符之间'),
  
  body('sections')
    .optional()
    .isArray()
    .withMessage('区块配置必须是数组格式'),
  
  body('settings')
    .optional()
    .isObject()
    .withMessage('设置必须是对象格式'),
  
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
 * 验证更新店铺设置
 */
const validateUpdateShopSettings = [
  body('shippingSettings')
    .optional()
    .isObject()
    .withMessage('物流设置必须是对象格式'),
  
  body('paymentSettings')
    .optional()
    .isObject()
    .withMessage('支付设置必须是对象格式'),
  
  body('notificationSettings')
    .optional()
    .isObject()
    .withMessage('通知设置必须是对象格式'),
  
  body('otherSettings')
    .optional()
    .isObject()
    .withMessage('其他设置必须是对象格式'),
  
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
 * 验证获取店铺统计信息
 */
const validateGetShopStats = [
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
 * 验证上传Logo
 */
const validateUploadLogo = [
  (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请上传Logo文件'
      });
    }
    
    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: '只允许上传JPG、PNG、GIF格式的图片'
      });
    }
    
    // 验证文件大小（5MB）
    if (req.file.size > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: 'Logo文件大小不能超过5MB'
      });
    }
    
    next();
  }
];

/**
 * 验证上传Banner
 */
const validateUploadBanner = [
  (req, res, next) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请上传Banner文件'
      });
    }
    
    // 验证文件数量
    if (req.files.length > 5) {
      return res.status(400).json({
        success: false,
        message: '最多只能上传5个Banner文件'
      });
    }
    
    // 验证每个文件
    for (const file of req.files) {
      // 验证文件类型
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: '只允许上传JPG、PNG、GIF格式的图片'
        });
      }
      
      // 验证文件大小（10MB）
      if (file.size > 10 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          message: 'Banner文件大小不能超过10MB'
        });
      }
    }
    
    next();
  }
];

module.exports = {
  validateUpdateShopInfo,
  validateUpdateShopDecoration,
  validateUpdateShopSettings,
  validateGetShopStats,
  validateUploadLogo,
  validateUploadBanner
};