/**
 * 广告管理路由
 * 配置广告相关的API接口路径和中间件
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const adController = require('../controllers/adController');
const { adSlotValidation, adMaterialValidation, adCampaignValidation, adStatisticsValidation } = require('../validations/adValidation');
const { authMiddleware } = require('../../../middlewares/auth');
const { validationMiddleware } = require('../../../middlewares/validation');
const logger = require('../../../core/logger');

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../../../uploads/ad-materials');
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  // 允许的文件类型
  const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|avi|mov|wmv|flv/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('不支持的文件类型！请上传图片或视频文件。'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  }
});

/**
 * 注册广告管理相关路由
 * @param {Object} app - Express应用实例
 */
function register(app) {
  const router = express.Router();
  
  // 应用认证中间件
  router.use(authMiddleware);
  
  // 广告位管理路由
  /**
   * @swagger
   * /api/admin/advertising/slots:  
   *   post:
   *     summary: 创建广告位
   *     tags: [广告位管理]
   *     security: 
   *       - BearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - width
   *               - height
   *             properties:
   *               name: { type: string, description: '广告位名称' }
   *               width: { type: integer, description: '广告位宽度' }
   *               height: { type: integer, description: '广告位高度' }
   *               description: { type: string, description: '广告位描述' }
   *               position: { type: string, description: '广告位位置' }
   *               status: { type: string, enum: ['active', 'inactive'], description: '状态' }
   *               extraConfig: { type: object, description: '额外配置' }
   *     responses:
   *       201: { description: '创建成功' }
   */
  router.post(
    '/slots',
    adSlotValidation.createAdSlot,
    validationMiddleware,
    adController.createAdSlot
  );
  
  /**
   * @swagger
   * /api/admin/advertising/slots:  
   *   get:
   *     summary: 获取广告位列表
   *     tags: [广告位管理]
   *     security: 
   *       - BearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         type: integer
   *         description: 页码
   *       - in: query
   *         name: pageSize
   *         type: integer
   *         description: 每页数量
   *       - in: query
   *         name: status
   *         type: string
   *         enum: ['active', 'inactive']
   *         description: 状态筛选
   *     responses:
   *       200: { description: '获取成功' }
   */
  router.get(
    '/slots',
    adSlotValidation.getAdSlots,
    validationMiddleware,
    adController.getAdSlots
  );
  
  /**
   * @swagger
   * /api/admin/advertising/slots/{id}:  
   *   get:
   *     summary: 获取广告位详情
   *     tags: [广告位管理]
   *     security: 
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         type: integer
   *         description: 广告位ID
   *     responses:
   *       200: { description: '获取成功' }
   *       404: { description: '广告位不存在' }
   */
  router.get(
    '/slots/:id',
    adSlotValidation.getAdSlotDetail,
    validationMiddleware,
    adController.getAdSlotDetail
  );
  
  /**
   * @swagger
   * /api/admin/advertising/slots/{id}:  
   *   put:
   *     summary: 更新广告位
   *     tags: [广告位管理]
   *     security: 
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         type: integer
   *         description: 广告位ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name: { type: string, description: '广告位名称' }
   *               width: { type: integer, description: '广告位宽度' }
   *               height: { type: integer, description: '广告位高度' }
   *               description: { type: string, description: '广告位描述' }
   *               position: { type: string, description: '广告位位置' }
   *               status: { type: string, enum: ['active', 'inactive'], description: '状态' }
   *               extraConfig: { type: object, description: '额外配置' }
   *     responses:
   *       200: { description: '更新成功' }
   *       404: { description: '广告位不存在' }
   */
  router.put(
    '/slots/:id',
    adSlotValidation.updateAdSlot,
    validationMiddleware,
    adController.updateAdSlot
  );
  
  /**
   * @swagger
   * /api/admin/advertising/slots/{id}:  
   *   delete:
   *     summary: 删除广告位
   *     tags: [广告位管理]
   *     security: 
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         type: integer
   *         description: 广告位ID
   *     responses:
   *       200: { description: '删除成功' }
   *       404: { description: '广告位不存在' }
   */
  router.delete(
    '/slots/:id',
    adSlotValidation.deleteAdSlot,
    validationMiddleware,
    adController.deleteAdSlot
  );

  // 广告素材管理路由
  /**
   * @swagger
   * /api/admin/advertising/materials:  
   *   post:
   *     summary: 上传广告素材
   *     tags: [广告素材管理]
   *     security: 
   *       - BearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - type
   *               - file
   *             properties:
   *               name: { type: string, description: '素材名称' }
   *               type: { type: string, enum: ['image', 'video', 'html', 'text'], description: '素材类型' }
   *               file: { type: string, format: binary, description: '素材文件' }
   *               linkUrl: { type: string, description: '跳转链接' }
   *               description: { type: string, description: '素材描述' }
   *               status: { type: string, enum: ['active', 'inactive'], description: '状态' }
   *     responses:
   *       201: { description: '上传成功' }
   */
  router.post(
    '/materials',
    upload.single('file'),
    adMaterialValidation.uploadAdMaterial,
    validationMiddleware,
    adController.uploadAdMaterial
  );
  
  /**
   * @swagger
   * /api/admin/advertising/materials:  
   *   get:
   *     summary: 获取广告素材列表
   *     tags: [广告素材管理]
   *     security: 
   *       - BearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         type: integer
   *         description: 页码
   *       - in: query
   *         name: pageSize
   *         type: integer
   *         description: 每页数量
   *       - in: query
   *         name: type
   *         type: string
   *         enum: ['image', 'video', 'html', 'text']
   *         description: 素材类型筛选
   *       - in: query
   *         name: status
   *         type: string
   *         enum: ['active', 'inactive']
   *         description: 状态筛选
   *     responses:
   *       200: { description: '获取成功' }
   */
  router.get(
    '/materials',
    adMaterialValidation.getAdMaterials,
    validationMiddleware,
    adController.getAdMaterials
  );
  
  /**
   * @swagger
   * /api/admin/advertising/materials/{id}:  
   *   get:
   *     summary: 获取广告素材详情
   *     tags: [广告素材管理]
   *     security: 
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         type: integer
   *         description: 素材ID
   *     responses:
   *       200: { description: '获取成功' }
   *       404: { description: '素材不存在' }
   */
  router.get(
    '/materials/:id',
    adMaterialValidation.getAdMaterialDetail,
    validationMiddleware,
    adController.getAdMaterialDetail
  );
  
  /**
   * @swagger
   * /api/admin/advertising/materials/{id}:  
   *   put:
   *     summary: 更新广告素材
   *     tags: [广告素材管理]
   *     security: 
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         type: integer
   *         description: 素材ID
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               name: { type: string, description: '素材名称' }
   *               type: { type: string, enum: ['image', 'video', 'html', 'text'], description: '素材类型' }
   *               file: { type: string, format: binary, description: '素材文件(可选)' }
   *               linkUrl: { type: string, description: '跳转链接' }
   *               description: { type: string, description: '素材描述' }
   *               status: { type: string, enum: ['active', 'inactive'], description: '状态' }
   *     responses:
   *       200: { description: '更新成功' }
   *       404: { description: '素材不存在' }
   */
  router.put(
    '/materials/:id',
    upload.single('file'),
    adMaterialValidation.updateAdMaterial,
    validationMiddleware,
    adController.updateAdMaterial
  );
  
  /**
   * @swagger
   * /api/admin/advertising/materials/{id}:  
   *   delete:
   *     summary: 删除广告素材
   *     tags: [广告素材管理]
   *     security: 
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         type: integer
   *         description: 素材ID
   *     responses:
   *       200: { description: '删除成功' }
   *       404: { description: '素材不存在' }
   */
  router.delete(
    '/materials/:id',
    adMaterialValidation.deleteAdMaterial,
    validationMiddleware,
    adController.deleteAdMaterial
  );

  // 广告投放管理路由
  /**
   * @swagger
   * /api/admin/advertising/campaigns:  
   *   post:
   *     summary: 创建广告投放
   *     tags: [广告投放管理]
   *     security: 
   *       - BearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - adSlotId
   *               - materialId
   *             properties:
   *               name: { type: string, description: '广告投放名称' }
   *               description: { type: string, description: '广告投放描述' }
   *               adSlotId: { type: integer, description: '广告位ID' }
   *               materialId: { type: integer, description: '素材ID' }
   *               startTime: { type: string, format: date-time, description: '开始时间' }
   *               endTime: { type: string, format: date-time, description: '结束时间' }
   *               status: { type: string, enum: ['pending', 'active', 'paused', 'ended'], description: '状态' }
   *               displayOrder: { type: integer, description: '显示顺序' }
   *               clickUrl: { type: string, description: '点击URL' }
   *               impressionUrl: { type: string, description: '曝光URL' }
   *               dailyBudget: { type: number, description: '每日预算' }
   *               totalBudget: { type: number, description: '总预算' }
   *     responses:
   *       201: { description: '创建成功' }
   */
  router.post(
    '/campaigns',
    adCampaignValidation.createAdCampaign,
    validationMiddleware,
    adController.createAdCampaign
  );
  
  /**
   * @swagger
   * /api/admin/advertising/campaigns:  
   *   get:
   *     summary: 获取广告投放列表
   *     tags: [广告投放管理]
   *     security: 
   *       - BearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         type: integer
   *         description: 页码
   *       - in: query
   *         name: pageSize
   *         type: integer
   *         description: 每页数量
   *       - in: query
   *         name: status
   *         type: string
   *         enum: ['pending', 'active', 'paused', 'ended']
   *         description: 状态筛选
   *       - in: query
   *         name: adSlotId
   *         type: integer
   *         description: 广告位ID筛选
   *     responses:
   *       200: { description: '获取成功' }
   */
  router.get(
    '/campaigns',
    adCampaignValidation.getAdCampaigns,
    validationMiddleware,
    adController.getAdCampaigns
  );
  
  /**
   * @swagger
   * /api/admin/advertising/campaigns/{id}:  
   *   get:
   *     summary: 获取广告投放详情
   *     tags: [广告投放管理]
   *     security: 
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         type: integer
   *         description: 广告投放ID
   *     responses:
   *       200: { description: '获取成功' }
   *       404: { description: '广告投放不存在' }
   */
  router.get(
    '/campaigns/:id',
    adCampaignValidation.getAdCampaignDetail,
    validationMiddleware,
    adController.getAdCampaignDetail
  );
  
  /**
   * @swagger
   * /api/admin/advertising/campaigns/{id}:  
   *   put:
   *     summary: 更新广告投放
   *     tags: [广告投放管理]
   *     security: 
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         type: integer
   *         description: 广告投放ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name: { type: string, description: '广告投放名称' }
   *               description: { type: string, description: '广告投放描述' }
   *               adSlotId: { type: integer, description: '广告位ID' }
   *               materialId: { type: integer, description: '素材ID' }
   *               startTime: { type: string, format: date-time, description: '开始时间' }
   *               endTime: { type: string, format: date-time, description: '结束时间' }
   *               status: { type: string, enum: ['pending', 'active', 'paused', 'ended'], description: '状态' }
   *               displayOrder: { type: integer, description: '显示顺序' }
   *               clickUrl: { type: string, description: '点击URL' }
   *               impressionUrl: { type: string, description: '曝光URL' }
   *               dailyBudget: { type: number, description: '每日预算' }
   *               totalBudget: { type: number, description: '总预算' }
   *     responses:
   *       200: { description: '更新成功' }
   *       404: { description: '广告投放不存在' }
   */
  router.put(
    '/campaigns/:id',
    adCampaignValidation.updateAdCampaign,
    validationMiddleware,
    adController.updateAdCampaign
  );
  
  /**
   * @swagger
   * /api/admin/advertising/campaigns/{id}/status:  
   *   patch:
   *     summary: 更新广告投放状态
   *     tags: [广告投放管理]
   *     security: 
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         type: integer
   *         description: 广告投放ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - status
   *             properties:
   *               status: { type: string, enum: ['pending', 'active', 'paused', 'ended'], description: '状态' }
   *     responses:
   *       200: { description: '状态更新成功' }
   *       404: { description: '广告投放不存在' }
   */
  router.patch(
    '/campaigns/:id/status',
    adCampaignValidation.updateAdCampaignStatus,
    validationMiddleware,
    adController.updateAdCampaignStatus
  );
  
  /**
   * @swagger
   * /api/admin/advertising/campaigns/{id}:  
   *   delete:
   *     summary: 删除广告投放
   *     tags: [广告投放管理]
   *     security: 
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         type: integer
   *         description: 广告投放ID
   *     responses:
   *       200: { description: '删除成功' }
   *       404: { description: '广告投放不存在' }
   */
  router.delete(
    '/campaigns/:id',
    adCampaignValidation.deleteAdCampaign,
    validationMiddleware,
    adController.deleteAdCampaign
  );

  // 广告统计路由
  /**
   * @swagger
   * /api/admin/advertising/statistics:  
   *   get:
   *     summary: 获取广告统计数据
   *     tags: [广告统计]
   *     security: 
   *       - BearerAuth: []
   *     parameters:
   *       - in: query
   *         name: campaignId
   *         type: integer
   *         description: 广告投放ID筛选
   *       - in: query
   *         name: adSlotId
   *         type: integer
   *         description: 广告位ID筛选
   *       - in: query
   *         name: startDate
   *         type: string
   *         format: date-time
   *         description: 开始日期
   *       - in: query
   *         name: endDate
   *         type: string
   *         format: date-time
   *         description: 结束日期
   *     responses:
   *       200: { description: '获取成功' }
   */
  router.get(
    '/statistics',
    adStatisticsValidation.getAdStatistics,
    validationMiddleware,
    adController.getAdStatistics
  );
  
  // 挂载路由
  app.use('/api/admin/advertising', router);
  
  logger.info('广告管理路由注册完成');
}

module.exports = {
  register
};