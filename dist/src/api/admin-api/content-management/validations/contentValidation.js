/**
 * 内容管理验证规则
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

// 公告相关验证规则
const validateAnnouncement = [
  body('title').isString().trim().notEmpty().withMessage('公告标题不能为空'),
  body('content').isString().notEmpty().withMessage('公告内容不能为空'),
  body('status').isIn(['active', 'inactive']).withMessage('公告状态必须是active或inactive'),
  body('priority').optional().isInt({ min: 0 }).withMessage('优先级必须是非负整数'),
  validate
];

const validateAnnouncementUpdate = [
  param('id').isString().trim().notEmpty().withMessage('公告ID不能为空'),
  body('title').optional().isString().trim().notEmpty().withMessage('公告标题不能为空'),
  body('content').optional().isString().notEmpty().withMessage('公告内容不能为空'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('公告状态必须是active或inactive'),
  body('priority').optional().isInt({ min: 0 }).withMessage('优先级必须是非负整数'),
  validate
];

const validateAnnouncementId = [
  param('id').isString().trim().notEmpty().withMessage('公告ID不能为空'),
  validate
];

const validateAnnouncementList = [
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须是大于0的整数'),
  query('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('每页大小必须是1-100之间的整数'),
  query('status').optional().isIn(['active', 'inactive']).withMessage('公告状态必须是active或inactive'),
  validate
];

// 帮助文章相关验证规则
const validateHelpArticle = [
  body('title').isString().trim().notEmpty().withMessage('文章标题不能为空'),
  body('content').isString().notEmpty().withMessage('文章内容不能为空'),
  body('category').isString().trim().notEmpty().withMessage('文章分类不能为空'),
  body('status').isIn(['published', 'draft', 'archived']).withMessage('文章状态必须是published、draft或archived'),
  body('sortOrder').optional().isInt().withMessage('排序必须是整数'),
  validate
];

const validateHelpArticleUpdate = [
  param('id').isString().trim().notEmpty().withMessage('文章ID不能为空'),
  body('title').optional().isString().trim().notEmpty().withMessage('文章标题不能为空'),
  body('content').optional().isString().notEmpty().withMessage('文章内容不能为空'),
  body('category').optional().isString().trim().notEmpty().withMessage('文章分类不能为空'),
  body('status').optional().isIn(['published', 'draft', 'archived']).withMessage('文章状态必须是published、draft或archived'),
  body('sortOrder').optional().isInt().withMessage('排序必须是整数'),
  validate
];

const validateHelpArticleId = [
  param('id').isString().trim().notEmpty().withMessage('文章ID不能为空'),
  validate
];

const validateHelpArticleList = [
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须是大于0的整数'),
  query('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('每页大小必须是1-100之间的整数'),
  query('category').optional().isString().trim().withMessage('文章分类必须是字符串'),
  query('keyword').optional().isString().trim().withMessage('搜索关键词必须是字符串'),
  validate
];

// 知识库文档相关验证规则
const validateKnowledgeDoc = [
  body('title').isString().trim().notEmpty().withMessage('文档标题不能为空'),
  body('content').isString().notEmpty().withMessage('文档内容不能为空'),
  body('category').isString().trim().notEmpty().withMessage('文档分类不能为空'),
  body('status').isIn(['published', 'draft', 'archived']).withMessage('文档状态必须是published、draft或archived'),
  body('tags').optional().isArray().withMessage('标签必须是数组格式'),
  body('tags.*').optional().isString().trim().notEmpty().withMessage('标签必须是非空字符串'),
  validate
];

const validateKnowledgeDocUpdate = [
  param('id').isString().trim().notEmpty().withMessage('文档ID不能为空'),
  body('title').optional().isString().trim().notEmpty().withMessage('文档标题不能为空'),
  body('content').optional().isString().notEmpty().withMessage('文档内容不能为空'),
  body('category').optional().isString().trim().notEmpty().withMessage('文档分类不能为空'),
  body('status').optional().isIn(['published', 'draft', 'archived']).withMessage('文档状态必须是published、draft或archived'),
  body('tags').optional().isArray().withMessage('标签必须是数组格式'),
  body('tags.*').optional().isString().trim().notEmpty().withMessage('标签必须是非空字符串'),
  validate
];

const validateKnowledgeDocId = [
  param('id').isString().trim().notEmpty().withMessage('文档ID不能为空'),
  validate
];

const validateKnowledgeDocList = [
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须是大于0的整数'),
  query('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('每页大小必须是1-100之间的整数'),
  query('category').optional().isString().trim().withMessage('文档分类必须是字符串'),
  query('tag').optional().isString().trim().withMessage('标签必须是字符串'),
  validate
];

module.exports = {
  // 公告验证
  validateAnnouncement,
  validateAnnouncementUpdate,
  validateAnnouncementId,
  validateAnnouncementList,
  
  // 帮助文章验证
  validateHelpArticle,
  validateHelpArticleUpdate,
  validateHelpArticleId,
  validateHelpArticleList,
  
  // 知识库文档验证
  validateKnowledgeDoc,
  validateKnowledgeDocUpdate,
  validateKnowledgeDocId,
  validateKnowledgeDocList
};