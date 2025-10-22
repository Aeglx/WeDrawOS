/**
 * 公众号素材管理路由
 * 配置公众号素材管理相关的API接口路径和中间件
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const materialController = require('../controllers/materialController');
const { validate } = require('../../../core/middlewares/validationMiddleware');
const { auth } = require('../../../core/middlewares/authMiddleware');
const {
  permanentMaterialValidations,
  temporaryMaterialValidations,
  articleMaterialValidations,
  materialListValidations,
  batchOperationValidations
} = require('../validations/materialValidation');

// 配置文件上传存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../../../uploads/wechat-materials'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

// 创建文件上传中间件
const upload = multer({ storage });

// 文件类型限制
const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('只允许上传图片文件'), false);
  }
};

const voiceFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('audio/')) {
    cb(null, true);
  } else {
    cb(new Error('只允许上传音频文件'), false);
  }
};

const videoFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('只允许上传视频文件'), false);
  }
};

const thumbFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/') && file.size <= 64 * 1024) {
    cb(null, true);
  } else {
    cb(new Error('缩略图必须是图片且大小不超过64KB'), false);
  }
};

// 使用认证中间件
router.use(auth);

/**
 * @swagger
 * tags:
 *   name: 公众号素材管理
 *   description: 公众号图文、视频、语音等素材管理接口
 */

// 永久素材相关接口
/**
 * @swagger
 * /api/admin/wechat/material/permanent/image:
 *   post:
 *     summary: 上传永久图片素材
 *     tags: [公众号素材管理]
 *     consumes: multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: media
 *         type: file
 *         description: 图片文件
 *         required: true
 *     responses:
 *       201: 
 *         description: 上传成功
 *       400: 
 *         description: 请求错误
 */
router.post(
  '/permanent/image',
  upload.single('media'),
  validate(permanentMaterialValidations.uploadPermanentImage),
  materialController.uploadPermanentImage
);

/**
 * @swagger
 * /api/admin/wechat/material/permanent/voice:
 *   post:
 *     summary: 上传永久语音素材
 *     tags: [公众号素材管理]
 *     consumes: multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: media
 *         type: file
 *         description: 语音文件
 *         required: true
 *       - in: formData
 *         name: title
 *         type: string
 *         description: 语音标题
 *       - in: formData
 *         name: introduction
 *         type: string
 *         description: 语音介绍
 *     responses:
 *       201: 
 *         description: 上传成功
 *       400: 
 *         description: 请求错误
 */
router.post(
  '/permanent/voice',
  upload.single('media'),
  validate(permanentMaterialValidations.uploadPermanentVoice),
  materialController.uploadPermanentVoice
);

/**
 * @swagger
 * /api/admin/wechat/material/permanent/video:
 *   post:
 *     summary: 上传永久视频素材
 *     tags: [公众号素材管理]
 *     consumes: multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: media
 *         type: file
 *         description: 视频文件
 *         required: true
 *       - in: formData
 *         name: title
 *         type: string
 *         description: 视频标题
 *         required: true
 *       - in: formData
 *         name: description
 *         type: string
 *         description: 视频描述
 *         required: true
 *     responses:
 *       201: 
 *         description: 上传成功
 *       400: 
 *         description: 请求错误
 */
router.post(
  '/permanent/video',
  upload.single('media'),
  validate(permanentMaterialValidations.uploadPermanentVideo),
  materialController.uploadPermanentVideo
);

/**
 * @swagger
 * /api/admin/wechat/material/permanent/article:
 *   post:
 *     summary: 上传永久图文素材
 *     tags: [公众号素材管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               properties:
 *                 title: { type: string, required: true }
 *                 thumb_media_id: { type: string, required: true }
 *                 author: { type: string }
 *                 digest: { type: string }
 *                 show_cover_pic: { type: boolean }
 *                 content: { type: string, required: true }
 *                 content_source_url: { type: string }
 *                 need_open_comment: { type: boolean }
 *                 only_fans_can_comment: { type: boolean }
 *     responses:
 *       201: 
 *         description: 上传成功
 *       400: 
 *         description: 请求错误
 */
router.post(
  '/permanent/article',
  validate(permanentMaterialValidations.uploadPermanentArticle),
  materialController.uploadPermanentArticle
);

/**
 * @swagger
 * /api/admin/wechat/material/permanent/article/{mediaId}:
 *   put:
 *     summary: 更新永久图文素材
 *     tags: [公众号素材管理]
 *     parameters:
 *       - in: path
 *         name: mediaId
 *         type: string
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               index: { type: integer, required: true }
 *               articles: { type: object, required: true }
 *     responses:
 *       200: 
 *         description: 更新成功
 *       400: 
 *         description: 请求错误
 */
router.put(
  '/permanent/article/:mediaId',
  validate(permanentMaterialValidations.updatePermanentArticle),
  materialController.updatePermanentArticle
);

/**
 * @swagger
 * /api/admin/wechat/material/permanent:
 *   get:
 *     summary: 获取永久素材列表
 *     tags: [公众号素材管理]
 *     parameters:
 *       - in: query
 *         name: type
 *         type: string
 *         required: true
 *         enum: [image, video, voice, news]
 *       - in: query
 *         name: offset
 *         type: integer
 *         default: 0
 *       - in: query
 *         name: count
 *         type: integer
 *         default: 20
 *     responses:
 *       200: 
 *         description: 获取成功
 *       400: 
 *         description: 请求错误
 */
router.get(
  '/permanent',
  validate(permanentMaterialValidations.getPermanentMaterials),
  materialController.getPermanentMaterials
);

/**
 * @swagger
 * /api/admin/wechat/material/permanent/{mediaId}:
 *   get:
 *     summary: 获取永久素材详情
 *     tags: [公众号素材管理]
 *     parameters:
 *       - in: path
 *         name: mediaId
 *         type: string
 *         required: true
 *       - in: query
 *         name: type
 *         type: string
 *         enum: [image, video, voice, news]
 *     responses:
 *       200: 
 *         description: 获取成功
 *       400: 
 *         description: 请求错误
 */
router.get(
  '/permanent/:mediaId',
  validate(permanentMaterialValidations.getPermanentMaterialDetail),
  materialController.getPermanentMaterialDetail
);

/**
 * @swagger
 * /api/admin/wechat/material/permanent/{mediaId}:
 *   delete:
 *     summary: 删除永久素材
 *     tags: [公众号素材管理]
 *     parameters:
 *       - in: path
 *         name: mediaId
 *         type: string
 *         required: true
 *     responses:
 *       200: 
 *         description: 删除成功
 *       400: 
 *         description: 请求错误
 */
router.delete(
  '/permanent/:mediaId',
  validate(permanentMaterialValidations.deletePermanentMaterial),
  materialController.deletePermanentMaterial
);

/**
 * @swagger
 * /api/admin/wechat/material/permanent/count:
 *   get:
 *     summary: 获取永久素材总数
 *     tags: [公众号素材管理]
 *     responses:
 *       200: 
 *         description: 获取成功
 */
router.get('/permanent/count', materialController.getPermanentMaterialCount);

// 临时素材相关接口
/**
 * @swagger
 * /api/admin/wechat/material/temporary/image:
 *   post:
 *     summary: 上传临时图片素材
 *     tags: [公众号素材管理]
 *     consumes: multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: media
 *         type: file
 *         description: 图片文件
 *         required: true
 *     responses:
 *       201: 
 *         description: 上传成功
 *       400: 
 *         description: 请求错误
 */
router.post(
  '/temporary/image',
  upload.single('media'),
  validate(temporaryMaterialValidations.uploadTemporaryImage),
  materialController.uploadTemporaryImage
);

/**
 * @swagger
 * /api/admin/wechat/material/temporary/voice:
 *   post:
 *     summary: 上传临时语音素材
 *     tags: [公众号素材管理]
 *     consumes: multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: media
 *         type: file
 *         description: 语音文件
 *         required: true
 *     responses:
 *       201: 
 *         description: 上传成功
 *       400: 
 *         description: 请求错误
 */
router.post(
  '/temporary/voice',
  upload.single('media'),
  validate(temporaryMaterialValidations.uploadTemporaryVoice),
  materialController.uploadTemporaryVoice
);

/**
 * @swagger
 * /api/admin/wechat/material/temporary/video:
 *   post:
 *     summary: 上传临时视频素材
 *     tags: [公众号素材管理]
 *     consumes: multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: media
 *         type: file
 *         description: 视频文件
 *         required: true
 *     responses:
 *       201: 
 *         description: 上传成功
 *       400: 
 *         description: 请求错误
 */
router.post(
  '/temporary/video',
  upload.single('media'),
  validate(temporaryMaterialValidations.uploadTemporaryVideo),
  materialController.uploadTemporaryVideo
);

/**
 * @swagger
 * /api/admin/wechat/material/temporary/thumb:
 *   post:
 *     summary: 上传临时缩略图
 *     tags: [公众号素材管理]
 *     consumes: multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: media
 *         type: file
 *         description: 缩略图文件
 *         required: true
 *     responses:
 *       201: 
 *         description: 上传成功
 *       400: 
 *         description: 请求错误
 */
router.post(
  '/temporary/thumb',
  upload.single('media'),
  validate(temporaryMaterialValidations.uploadTemporaryThumb),
  materialController.uploadTemporaryThumb
);

/**
 * @swagger
 * /api/admin/wechat/material/temporary/{mediaId}:
 *   get:
 *     summary: 获取临时素材
 *     tags: [公众号素材管理]
 *     parameters:
 *       - in: path
 *         name: mediaId
 *         type: string
 *         required: true
 *       - in: query
 *         name: type
 *         type: string
 *         enum: [image, video, voice, thumb]
 *     responses:
 *       200: 
 *         description: 获取成功
 *       400: 
 *         description: 请求错误
 */
router.get(
  '/temporary/:mediaId',
  validate(temporaryMaterialValidations.getTemporaryMaterial),
  materialController.getTemporaryMaterial
);

// 图文消息相关接口
/**
 * @swagger
 * /api/admin/wechat/material/article/image:
 *   post:
 *     summary: 上传图文消息内的图片
 *     tags: [公众号素材管理]
 *     consumes: multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: media
 *         type: file
 *         description: 图片文件
 *         required: true
 *     responses:
 *       201: 
 *         description: 上传成功
 *       400: 
 *         description: 请求错误
 */
router.post(
  '/article/image',
  upload.single('media'),
  validate(articleMaterialValidations.uploadArticleImage),
  materialController.uploadArticleImage
);

/**
 * @swagger
 * /api/admin/wechat/material/batch/images:
 *   post:
 *     summary: 批量上传图片
 *     tags: [公众号素材管理]
 *     consumes: multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: media
 *         type: file
 *         description: 图片文件数组
 *         required: true
 *         collectionFormat: multi
 *     responses:
 *       201: 
 *         description: 上传成功
 *       400: 
 *         description: 请求错误
 */
router.post(
  '/batch/images',
  upload.array('media'),
  validate(articleMaterialValidations.batchUploadImages),
  materialController.batchUploadImages
);

module.exports = router;