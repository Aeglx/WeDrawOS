/**
 * 公众号模板消息管理验证规则
 * 确保模板消息相关API输入数据的合法性
 */

const { body, param, query } = require('express-validator');

/**
 * 获取模板库模板列表验证规则
 */
exports.getPublicTemplateListRules = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是正整数')
    .toInt(),
  query('pageSize')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量必须在1-100之间')
    .toInt(),
  query('industryId')
    .optional()
    .isString()
    .withMessage('行业ID必须是字符串')
];

/**
 * 搜索模板库模板验证规则
 */
exports.searchPublicTemplateRules = [
  query('keyword')
    .isString()
    .withMessage('搜索关键词不能为空')
    .trim(),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是正整数')
    .toInt(),
  query('pageSize')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量必须在1-100之间')
    .toInt()
];

/**
 * 从模板库添加模板验证规则
 */
exports.addTemplateRules = [
  body('templateIdShort')
    .isString()
    .withMessage('模板编号不能为空')
    .trim()
    .isLength({ min: 1 })
    .withMessage('模板编号不能为空'),
  body('title')
    .isString()
    .withMessage('模板标题不能为空')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('模板标题长度必须在1-100之间'),
  body('primaryIndustry')
    .optional()
    .isString()
    .withMessage('主行业必须是字符串'),
  body('deputyIndustry')
    .optional()
    .isString()
    .withMessage('副行业必须是字符串'),
  body('content')
    .optional()
    .isString()
    .withMessage('模板内容必须是字符串'),
  body('example')
    .optional()
    .isString()
    .withMessage('模板示例必须是字符串')
];

/**
 * 获取已添加模板列表验证规则
 */
exports.getMyTemplateListRules = [
  query('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('状态必须是active或inactive'),
  query('title')
    .optional()
    .isString()
    .withMessage('标题必须是字符串')
    .trim()
];

/**
 * 删除模板验证规则
 */
exports.deleteTemplateRules = [
  param('templateId')
    .isString()
    .withMessage('模板ID不能为空')
    .trim()
    .isLength({ min: 1 })
    .withMessage('模板ID不能为空')
];

/**
 * 发送模板消息验证规则
 */
exports.sendTemplateMessageRules = [
  body('touser')
    .isString()
    .withMessage('接收者openid不能为空')
    .trim()
    .isLength({ min: 1 })
    .withMessage('接收者openid不能为空'),
  body('templateId')
    .isString()
    .withMessage('模板ID不能为空')
    .trim()
    .isLength({ min: 1 })
    .withMessage('模板ID不能为空'),
  body('data')
    .isObject()
    .withMessage('消息数据必须是对象')
    .notEmpty()
    .withMessage('消息数据不能为空'),
  body('url')
    .optional()
    .isURL()
    .withMessage('跳转链接必须是有效的URL'),
  body('miniprogram')
    .optional()
    .isObject()
    .withMessage('小程序信息必须是对象')
    .custom((value) => {
      if (value) {
        if (!value.appid) {
          throw new Error('小程序appid不能为空');
        }
        if (!value.pagepath) {
          throw new Error('小程序页面路径不能为空');
        }
        return true;
      }
      return true;
    })
];

/**
 * 获取发送记录验证规则
 */
exports.getMessageRecordsRules = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是正整数')
    .toInt(),
  query('pageSize')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量必须在1-100之间')
    .toInt(),
  query('status')
    .optional()
    .isIn(['success', 'failed', 'pending'])
    .withMessage('状态必须是success、failed或pending'),
  query('startTime')
    .optional()
    .isISO8601()
    .withMessage('开始时间必须是有效的ISO8601格式'),
  query('endTime')
    .optional()
    .isISO8601()
    .withMessage('结束时间必须是有效的ISO8601格式'),
  query('touser')
    .optional()
    .isString()
    .withMessage('接收者openid必须是字符串')
    .trim(),
  query('templateId')
    .optional()
    .isString()
    .withMessage('模板ID必须是字符串')
    .trim()
];

/**
 * 模板消息预览验证规则
 */
exports.previewTemplateMessageRules = [
  body('touser')
    .isString()
    .withMessage('接收者openid不能为空')
    .trim()
    .isLength({ min: 1 })
    .withMessage('接收者openid不能为空'),
  body('templateId')
    .isString()
    .withMessage('模板ID不能为空')
    .trim()
    .isLength({ min: 1 })
    .withMessage('模板ID不能为空'),
  body('data')
    .isObject()
    .withMessage('消息数据必须是对象')
    .notEmpty()
    .withMessage('消息数据不能为空'),
  body('url')
    .optional()
    .isURL()
    .withMessage('跳转链接必须是有效的URL'),
  body('miniprogram')
    .optional()
    .isObject()
    .withMessage('小程序信息必须是对象')
    .custom((value) => {
      if (value) {
        if (!value.appid) {
          throw new Error('小程序appid不能为空');
        }
        if (!value.pagepath) {
          throw new Error('小程序页面路径不能为空');
        }
        return true;
      }
      return true;
    })
];

/**
 * 批量发送模板消息验证规则
 */
exports.batchSendTemplateMessageRules = [
  body('templateId')
    .isString()
    .withMessage('模板ID不能为空')
    .trim()
    .isLength({ min: 1 })
    .withMessage('模板ID不能为空'),
  body('data')
    .isObject()
    .withMessage('消息数据必须是对象')
    .notEmpty()
    .withMessage('消息数据不能为空'),
  body('openIds')
    .isArray()
    .withMessage('接收者openid列表必须是数组')
    .notEmpty()
    .withMessage('接收者openid列表不能为空')
    .custom((value) => {
      if (value.length > 100) {
        throw new Error('一次最多发送给100个用户');
      }
      return true;
    }),
  body('url')
    .optional()
    .isURL()
    .withMessage('跳转链接必须是有效的URL'),
  body('miniprogram')
    .optional()
    .isObject()
    .withMessage('小程序信息必须是对象')
    .custom((value) => {
      if (value) {
        if (!value.appid) {
          throw new Error('小程序appid不能为空');
        }
        if (!value.pagepath) {
          throw new Error('小程序页面路径不能为空');
        }
        return true;
      }
      return true;
    })
];

/**
 * 获取发送统计验证规则
 */
exports.getMessageStatisticsRules = [
  query('startTime')
    .optional()
    .isISO8601()
    .withMessage('开始时间必须是有效的ISO8601格式'),
  query('endTime')
    .optional()
    .isISO8601()
    .withMessage('结束时间必须是有效的ISO8601格式')
];

/**
 * 批量删除发送记录验证规则
 */
exports.batchDeleteRecordsRules = [
  body('ids')
    .isArray()
    .withMessage('记录ID列表必须是数组')
    .notEmpty()
    .withMessage('记录ID列表不能为空')
    .custom((value) => {
      // 检查每个元素是否为整数
      value.forEach(id => {
        if (!Number.isInteger(id)) {
          throw new Error('记录ID必须是整数');
        }
      });
      return true;
    })
];

/**
 * 获取模板详情验证规则
 */
exports.getTemplateDetailRules = [
  param('templateId')
    .isString()
    .withMessage('模板ID不能为空')
    .trim()
    .isLength({ min: 1 })
    .withMessage('模板ID不能为空')
];

/**
 * 更新模板信息验证规则
 */
exports.updateTemplateRules = [
  param('templateId')
    .isString()
    .withMessage('模板ID不能为空')
    .trim()
    .isLength({ min: 1 })
    .withMessage('模板ID不能为空'),
  body('title')
    .optional()
    .isString()
    .withMessage('模板标题必须是字符串')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('模板标题长度必须在1-100之间'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('状态必须是active或inactive'),
  body('keywordList')
    .optional()
    .isArray()
    .withMessage('关键词列表必须是数组')
];

/**
 * 搜索发送记录验证规则
 */
exports.searchRecordsRules = [
  query('keyword')
    .isString()
    .withMessage('搜索关键词不能为空')
    .trim(),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是正整数')
    .toInt(),
  query('pageSize')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量必须在1-100之间')
    .toInt()
];

/**
 * 清理过期记录验证规则
 */
exports.cleanupRecordsRules = [
  body('days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('保留天数必须在1-365之间')
    .toInt()
];