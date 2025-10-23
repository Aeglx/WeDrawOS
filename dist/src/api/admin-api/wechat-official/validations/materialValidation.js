/**
 * 公众号素材管理验证规则
 * 确保公众号素材管理相关API输入数据的合法性
 */

const { body, param, query } = require('express-validator');

/**
 * 永久素材上传验证规则
 */
const permanentMaterialValidations = {
  // 上传永久图片素材验证
  uploadPermanentImage: [
    // 文件验证在multer中间件中处理
  ],

  // 上传永久语音素材验证
  uploadPermanentVoice: [
    body('title').optional().isString().withMessage('标题必须是字符串'),
    body('introduction').optional().isString().withMessage('介绍必须是字符串')
    // 文件验证在multer中间件中处理
  ],

  // 上传永久视频素材验证
  uploadPermanentVideo: [
    body('title').isString().withMessage('标题必须是字符串').notEmpty().withMessage('标题不能为空'),
    body('description').isString().withMessage('描述必须是字符串').notEmpty().withMessage('描述不能为空')
    // 文件验证在multer中间件中处理
  ],

  // 上传永久图文素材验证
  uploadPermanentArticle: [
    body().isArray().withMessage('请求体必须是数组'),
    body('*.title').isString().withMessage('文章标题必须是字符串').notEmpty().withMessage('文章标题不能为空'),
    body('*.thumb_media_id').isString().withMessage('缩略图媒体ID必须是字符串').notEmpty().withMessage('缩略图媒体ID不能为空'),
    body('*.author').optional().isString().withMessage('作者必须是字符串'),
    body('*.digest').optional().isString().withMessage('摘要必须是字符串'),
    body('*.show_cover_pic').optional().isBoolean().withMessage('是否显示封面必须是布尔值'),
    body('*.content').isString().withMessage('文章内容必须是字符串').notEmpty().withMessage('文章内容不能为空'),
    body('*.content_source_url').optional().isURL().withMessage('原文链接必须是有效的URL'),
    body('*.need_open_comment').optional().isBoolean().withMessage('是否打开评论必须是布尔值'),
    body('*.only_fans_can_comment').optional().isBoolean().withMessage('是否只有粉丝可以评论必须是布尔值')
  ],

  // 更新图文素材验证
  updatePermanentArticle: [
    param('mediaId').isString().withMessage('素材ID必须是字符串').notEmpty().withMessage('素材ID不能为空'),
    body('index').isInt({ min: 0 }).withMessage('文章索引必须是非负整数'),
    body('articles').isObject().withMessage('文章数据必须是对象'),
    body('articles.title').isString().withMessage('文章标题必须是字符串').notEmpty().withMessage('文章标题不能为空'),
    body('articles.thumb_media_id').isString().withMessage('缩略图媒体ID必须是字符串').notEmpty().withMessage('缩略图媒体ID不能为空'),
    body('articles.author').optional().isString().withMessage('作者必须是字符串'),
    body('articles.digest').optional().isString().withMessage('摘要必须是字符串'),
    body('articles.show_cover_pic').optional().isBoolean().withMessage('是否显示封面必须是布尔值'),
    body('articles.content').isString().withMessage('文章内容必须是字符串').notEmpty().withMessage('文章内容不能为空'),
    body('articles.content_source_url').optional().isURL().withMessage('原文链接必须是有效的URL'),
    body('articles.need_open_comment').optional().isBoolean().withMessage('是否打开评论必须是布尔值'),
    body('articles.only_fans_can_comment').optional().isBoolean().withMessage('是否只有粉丝可以评论必须是布尔值')
  ],

  // 获取永久素材列表验证
  getPermanentMaterials: [
    query('type').isIn(['image', 'video', 'voice', 'news']).withMessage('素材类型必须是image、video、voice或news之一'),
    query('offset').optional().isInt({ min: 0 }).withMessage('偏移量必须是非负整数').toInt(),
    query('count').optional().isInt({ min: 1, max: 20 }).withMessage('数量必须是1到20之间的整数').toInt()
  ],

  // 获取永久素材详情验证
  getPermanentMaterialDetail: [
    param('mediaId').isString().withMessage('素材ID必须是字符串').notEmpty().withMessage('素材ID不能为空'),
    query('type').optional().isIn(['image', 'video', 'voice', 'news']).withMessage('素材类型必须是image、video、voice或news之一')
  ],

  // 删除永久素材验证
  deletePermanentMaterial: [
    param('mediaId').isString().withMessage('素材ID必须是字符串').notEmpty().withMessage('素材ID不能为空')
  ]
};

/**
 * 临时素材上传验证规则
 */
const temporaryMaterialValidations = {
  // 上传临时图片素材验证
  uploadTemporaryImage: [
    // 文件验证在multer中间件中处理
  ],

  // 上传临时语音素材验证
  uploadTemporaryVoice: [
    // 文件验证在multer中间件中处理
  ],

  // 上传临时视频素材验证
  uploadTemporaryVideo: [
    // 文件验证在multer中间件中处理
  ],

  // 上传临时缩略图验证
  uploadTemporaryThumb: [
    // 文件验证在multer中间件中处理
  ],

  // 获取临时素材验证
  getTemporaryMaterial: [
    param('mediaId').isString().withMessage('素材ID必须是字符串').notEmpty().withMessage('素材ID不能为空'),
    query('type').optional().isIn(['image', 'video', 'voice', 'thumb']).withMessage('素材类型必须是image、video、voice或thumb之一')
  ]
};

/**
 * 图文消息相关验证规则
 */
const articleMaterialValidations = {
  // 上传图文消息内的图片验证
  uploadArticleImage: [
    // 文件验证在multer中间件中处理
  ],

  // 批量上传图片验证
  batchUploadImages: [
    // 文件验证在multer中间件中处理
  ]
};

/**
 * 素材列表查询验证规则
 */
const materialListValidations = {
  // 获取素材列表验证
  getMaterials: [
    query('type').optional().isIn(['image', 'video', 'voice', 'news', 'thumb']).withMessage('素材类型必须是image、video、voice、news或thumb之一'),
    query('isPermanent').optional().isBoolean().withMessage('是否永久素材必须是布尔值'),
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数').toInt(),
    query('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须是1到100之间的整数').toInt(),
    query('keyword').optional().isString().withMessage('关键词必须是字符串')
  ],

  // 搜索素材验证
  searchMaterials: [
    query('keyword').isString().withMessage('搜索关键词必须是字符串').notEmpty().withMessage('搜索关键词不能为空'),
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数').toInt(),
    query('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须是1到100之间的整数').toInt()
  ],

  // 导出素材验证
  exportMaterials: [
    query('type').optional().isIn(['image', 'video', 'voice', 'news', 'thumb']).withMessage('素材类型必须是image、video、voice、news或thumb之一'),
    query('isPermanent').optional().isBoolean().withMessage('是否永久素材必须是布尔值'),
    query('startDate').optional().isISO8601().withMessage('开始日期必须是有效的ISO 8601格式'),
    query('endDate').optional().isISO8601().withMessage('结束日期必须是有效的ISO 8601格式')
  ]
};

/**
 * 批量操作验证规则
 */
const batchOperationValidations = {
  // 批量删除素材验证
  batchDeleteMaterials: [
    body('mediaIds').isArray().withMessage('素材ID列表必须是数组'),
    body('mediaIds.*').isString().withMessage('素材ID必须是字符串').notEmpty().withMessage('素材ID不能为空')
  ]
};

/**
 * 导出所有验证规则
 */
module.exports = {
  permanentMaterialValidations,
  temporaryMaterialValidations,
  articleMaterialValidations,
  materialListValidations,
  batchOperationValidations
};