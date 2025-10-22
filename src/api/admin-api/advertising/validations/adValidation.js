/**
 * 广告管理验证规则
 * 使用express-validator定义API输入验证规则
 */

const { body, param, query } = require('express-validator');

/**
 * 广告位验证规则
 */
const adSlotValidation = {
  // 创建广告位验证
  createAdSlot: [
    body('name')
      .notEmpty().withMessage('广告位名称不能为空')
      .isString().withMessage('广告位名称必须是字符串')
      .trim()
      .isLength({ max: 100 }).withMessage('广告位名称不能超过100个字符'),
    
    body('width')
      .notEmpty().withMessage('广告位宽度不能为空')
      .isInt({ min: 1 }).withMessage('广告位宽度必须是正整数'),
    
    body('height')
      .notEmpty().withMessage('广告位高度不能为空')
      .isInt({ min: 1 }).withMessage('广告位高度必须是正整数'),
    
    body('description')
      .optional()
      .isString().withMessage('描述必须是字符串')
      .trim()
      .isLength({ max: 500 }).withMessage('描述不能超过500个字符'),
    
    body('position')
      .optional()
      .isString().withMessage('位置必须是字符串')
      .trim()
      .isLength({ max: 100 }).withMessage('位置不能超过100个字符'),
    
    body('status')
      .optional()
      .isIn(['active', 'inactive']).withMessage('状态必须是active或inactive'),
    
    body('extraConfig')
      .optional()
      .isObject().withMessage('额外配置必须是对象')
  ],
  
  // 更新广告位验证
  updateAdSlot: [
    param('id')
      .notEmpty().withMessage('广告位ID不能为空')
      .isInt().withMessage('广告位ID必须是整数'),
    
    body('name')
      .optional()
      .isString().withMessage('广告位名称必须是字符串')
      .trim()
      .isLength({ max: 100 }).withMessage('广告位名称不能超过100个字符'),
    
    body('width')
      .optional()
      .isInt({ min: 1 }).withMessage('广告位宽度必须是正整数'),
    
    body('height')
      .optional()
      .isInt({ min: 1 }).withMessage('广告位高度必须是正整数'),
    
    body('description')
      .optional()
      .isString().withMessage('描述必须是字符串')
      .trim()
      .isLength({ max: 500 }).withMessage('描述不能超过500个字符'),
    
    body('position')
      .optional()
      .isString().withMessage('位置必须是字符串')
      .trim()
      .isLength({ max: 100 }).withMessage('位置不能超过100个字符'),
    
    body('status')
      .optional()
      .isIn(['active', 'inactive']).withMessage('状态必须是active或inactive'),
    
    body('extraConfig')
      .optional()
      .isObject().withMessage('额外配置必须是对象')
  ],
  
  // 获取广告位详情验证
  getAdSlotDetail: [
    param('id')
      .notEmpty().withMessage('广告位ID不能为空')
      .isInt().withMessage('广告位ID必须是整数')
  ],
  
  // 删除广告位验证
  deleteAdSlot: [
    param('id')
      .notEmpty().withMessage('广告位ID不能为空')
      .isInt().withMessage('广告位ID必须是整数')
  ],
  
  // 获取广告位列表验证
  getAdSlots: [
    query('page')
      .optional()
      .isInt({ min: 1 }).withMessage('页码必须是大于0的整数'),
    
    query('pageSize')
      .optional()
      .isInt({ min: 1, max: 100 }).withMessage('每页数量必须是1-100之间的整数'),
    
    query('status')
      .optional()
      .isIn(['active', 'inactive']).withMessage('状态必须是active或inactive')
  ]
};

/**
 * 广告素材验证规则
 */
const adMaterialValidation = {
  // 上传广告素材验证
  uploadAdMaterial: [
    body('name')
      .notEmpty().withMessage('素材名称不能为空')
      .isString().withMessage('素材名称必须是字符串')
      .trim()
      .isLength({ max: 100 }).withMessage('素材名称不能超过100个字符'),
    
    body('type')
      .notEmpty().withMessage('素材类型不能为空')
      .isIn(['image', 'video', 'html', 'text']).withMessage('素材类型必须是image、video、html或text'),
    
    body('linkUrl')
      .optional()
      .isURL().withMessage('链接URL格式无效'),
    
    body('description')
      .optional()
      .isString().withMessage('描述必须是字符串')
      .trim()
      .isLength({ max: 500 }).withMessage('描述不能超过500个字符'),
    
    body('status')
      .optional()
      .isIn(['active', 'inactive']).withMessage('状态必须是active或inactive')
  ],
  
  // 更新广告素材验证
  updateAdMaterial: [
    param('id')
      .notEmpty().withMessage('素材ID不能为空')
      .isInt().withMessage('素材ID必须是整数'),
    
    body('name')
      .optional()
      .isString().withMessage('素材名称必须是字符串')
      .trim()
      .isLength({ max: 100 }).withMessage('素材名称不能超过100个字符'),
    
    body('type')
      .optional()
      .isIn(['image', 'video', 'html', 'text']).withMessage('素材类型必须是image、video、html或text'),
    
    body('linkUrl')
      .optional()
      .isURL().withMessage('链接URL格式无效'),
    
    body('description')
      .optional()
      .isString().withMessage('描述必须是字符串')
      .trim()
      .isLength({ max: 500 }).withMessage('描述不能超过500个字符'),
    
    body('status')
      .optional()
      .isIn(['active', 'inactive']).withMessage('状态必须是active或inactive')
  ],
  
  // 获取广告素材详情验证
  getAdMaterialDetail: [
    param('id')
      .notEmpty().withMessage('素材ID不能为空')
      .isInt().withMessage('素材ID必须是整数')
  ],
  
  // 删除广告素材验证
  deleteAdMaterial: [
    param('id')
      .notEmpty().withMessage('素材ID不能为空')
      .isInt().withMessage('素材ID必须是整数')
  ],
  
  // 获取广告素材列表验证
  getAdMaterials: [
    query('page')
      .optional()
      .isInt({ min: 1 }).withMessage('页码必须是大于0的整数'),
    
    query('pageSize')
      .optional()
      .isInt({ min: 1, max: 100 }).withMessage('每页数量必须是1-100之间的整数'),
    
    query('type')
      .optional()
      .isIn(['image', 'video', 'html', 'text']).withMessage('素材类型必须是image、video、html或text'),
    
    query('status')
      .optional()
      .isIn(['active', 'inactive']).withMessage('状态必须是active或inactive')
  ]
};

/**
 * 广告投放验证规则
 */
const adCampaignValidation = {
  // 创建广告投放验证
  createAdCampaign: [
    body('name')
      .notEmpty().withMessage('广告投放名称不能为空')
      .isString().withMessage('广告投放名称必须是字符串')
      .trim()
      .isLength({ max: 100 }).withMessage('广告投放名称不能超过100个字符'),
    
    body('adSlotId')
      .notEmpty().withMessage('广告位ID不能为空')
      .isInt().withMessage('广告位ID必须是整数'),
    
    body('materialId')
      .notEmpty().withMessage('素材ID不能为空')
      .isInt().withMessage('素材ID必须是整数'),
    
    body('startTime')
      .optional()
      .isISO8601().withMessage('开始时间格式无效，应为ISO8601格式'),
    
    body('endTime')
      .optional()
      .isISO8601().withMessage('结束时间格式无效，应为ISO8601格式'),
    
    body('status')
      .optional()
      .isIn(['pending', 'active', 'paused', 'ended']).withMessage('状态必须是pending、active、paused或ended'),
    
    body('displayOrder')
      .optional()
      .isInt().withMessage('显示顺序必须是整数'),
    
    body('clickUrl')
      .optional()
      .isURL().withMessage('点击URL格式无效'),
    
    body('impressionUrl')
      .optional()
      .isURL().withMessage('曝光URL格式无效'),
    
    body('dailyBudget')
      .optional()
      .isFloat({ min: 0 }).withMessage('每日预算必须是非负浮点数'),
    
    body('totalBudget')
      .optional()
      .isFloat({ min: 0 }).withMessage('总预算必须是非负浮点数'),
    
    body('description')
      .optional()
      .isString().withMessage('描述必须是字符串')
      .trim()
      .isLength({ max: 500 }).withMessage('描述不能超过500个字符')
  ],
  
  // 更新广告投放验证
  updateAdCampaign: [
    param('id')
      .notEmpty().withMessage('广告投放ID不能为空')
      .isInt().withMessage('广告投放ID必须是整数'),
    
    body('name')
      .optional()
      .isString().withMessage('广告投放名称必须是字符串')
      .trim()
      .isLength({ max: 100 }).withMessage('广告投放名称不能超过100个字符'),
    
    body('adSlotId')
      .optional()
      .isInt().withMessage('广告位ID必须是整数'),
    
    body('materialId')
      .optional()
      .isInt().withMessage('素材ID必须是整数'),
    
    body('startTime')
      .optional()
      .isISO8601().withMessage('开始时间格式无效，应为ISO8601格式'),
    
    body('endTime')
      .optional()
      .isISO8601().withMessage('结束时间格式无效，应为ISO8601格式'),
    
    body('status')
      .optional()
      .isIn(['pending', 'active', 'paused', 'ended']).withMessage('状态必须是pending、active、paused或ended'),
    
    body('displayOrder')
      .optional()
      .isInt().withMessage('显示顺序必须是整数'),
    
    body('clickUrl')
      .optional()
      .isURL().withMessage('点击URL格式无效'),
    
    body('impressionUrl')
      .optional()
      .isURL().withMessage('曝光URL格式无效'),
    
    body('dailyBudget')
      .optional()
      .isFloat({ min: 0 }).withMessage('每日预算必须是非负浮点数'),
    
    body('totalBudget')
      .optional()
      .isFloat({ min: 0 }).withMessage('总预算必须是非负浮点数'),
    
    body('description')
      .optional()
      .isString().withMessage('描述必须是字符串')
      .trim()
      .isLength({ max: 500 }).withMessage('描述不能超过500个字符')
  ],
  
  // 更新广告投放状态验证
  updateAdCampaignStatus: [
    param('id')
      .notEmpty().withMessage('广告投放ID不能为空')
      .isInt().withMessage('广告投放ID必须是整数'),
    
    body('status')
      .notEmpty().withMessage('状态不能为空')
      .isIn(['pending', 'active', 'paused', 'ended']).withMessage('状态必须是pending、active、paused或ended')
  ],
  
  // 获取广告投放详情验证
  getAdCampaignDetail: [
    param('id')
      .notEmpty().withMessage('广告投放ID不能为空')
      .isInt().withMessage('广告投放ID必须是整数')
  ],
  
  // 删除广告投放验证
  deleteAdCampaign: [
    param('id')
      .notEmpty().withMessage('广告投放ID不能为空')
      .isInt().withMessage('广告投放ID必须是整数')
  ],
  
  // 获取广告投放列表验证
  getAdCampaigns: [
    query('page')
      .optional()
      .isInt({ min: 1 }).withMessage('页码必须是大于0的整数'),
    
    query('pageSize')
      .optional()
      .isInt({ min: 1, max: 100 }).withMessage('每页数量必须是1-100之间的整数'),
    
    query('status')
      .optional()
      .isIn(['pending', 'active', 'paused', 'ended']).withMessage('状态必须是pending、active、paused或ended'),
    
    query('adSlotId')
      .optional()
      .isInt().withMessage('广告位ID必须是整数')
  ]
};

/**
 * 广告统计验证规则
 */
const adStatisticsValidation = {
  getAdStatistics: [
    query('campaignId')
      .optional()
      .isInt().withMessage('广告投放ID必须是整数'),
    
    query('adSlotId')
      .optional()
      .isInt().withMessage('广告位ID必须是整数'),
    
    query('startDate')
      .optional()
      .isISO8601().withMessage('开始日期格式无效，应为ISO8601格式'),
    
    query('endDate')
      .optional()
      .isISO8601().withMessage('结束日期格式无效，应为ISO8601格式')
  ]
};

// 导出所有验证规则
module.exports = {
  adSlotValidation,
  adMaterialValidation,
  adCampaignValidation,
  adStatisticsValidation
};