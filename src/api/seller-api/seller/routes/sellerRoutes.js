/**
 * 卖家端店铺管理路由
 * 配置店铺信息设置、店铺装修等接口
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../core/middleware/authMiddleware');
const sellerController = require('../controllers/sellerController');
const sellerValidation = require('../validations/sellerValidation');
const uploadMiddleware = require('../../../core/middleware/uploadMiddleware');

/**
 * @swagger
 * tags:
 *   name: 卖家店铺管理
 *   description: 卖家店铺信息和装修管理
 */

// 应用认证中间件
router.use(authMiddleware.authenticateSeller);

/**
 * @swagger
 * /api/seller/shop/info:
 *   get:
 *     summary: 获取店铺信息
 *     tags: [卖家店铺管理]
 *     responses:
 *       200:
 *         description: 成功获取店铺信息
 *       500:
 *         description: 服务器错误
 */
router.get('/shop/info', sellerController.getShopInfo);

/**
 * @swagger
 * /api/seller/shop/info:
 *   put:
 *     summary: 更新店铺基本信息
 *     tags: [卖家店铺管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, description: '店铺名称' }
 *               description: { type: string, description: '店铺描述' }
 *               contactPhone: { type: string, description: '联系电话' }
 *               contactEmail: { type: string, description: '联系邮箱' }
 *               location: { type: object, description: '店铺位置' }
 *               businessHours: { type: object, description: '营业时间' }
 *     responses:
 *       200:
 *         description: 成功更新店铺信息
 *       400:
 *         description: 请求参数错误
 *       500:
 *         description: 服务器错误
 */
router.put(
  '/shop/info',
  sellerValidation.validateUpdateShopInfo,
  sellerController.updateShopInfo
);

/**
 * @swagger
 * /api/seller/shop/decoration:
 *   get:
 *     summary: 获取店铺装修配置
 *     tags: [卖家店铺管理]
 *     responses:
 *       200:
 *         description: 成功获取店铺装修配置
 *       500:
 *         description: 服务器错误
 */
router.get('/shop/decoration', sellerController.getShopDecoration);

/**
 * @swagger
 * /api/seller/shop/decoration:
 *   put:
 *     summary: 更新店铺装修配置
 *     tags: [卖家店铺管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               theme: { type: string, required: true, description: '店铺主题' }
 *               sections: { type: array, description: '装修区块配置' }
 *               settings: { type: object, description: '装修设置' }
 *     responses:
 *       200:
 *         description: 成功更新店铺装修配置
 *       400:
 *         description: 请求参数错误
 *       500:
 *         description: 服务器错误
 */
router.put(
  '/shop/decoration',
  sellerValidation.validateUpdateShopDecoration,
  sellerController.updateShopDecoration
);

/**
 * @swagger
 * /api/seller/shop/settings:
 *   get:
 *     summary: 获取店铺设置
 *     tags: [卖家店铺管理]
 *     responses:
 *       200:
 *         description: 成功获取店铺设置
 *       500:
 *         description: 服务器错误
 */
router.get('/shop/settings', sellerController.getShopSettings);

/**
 * @swagger
 * /api/seller/shop/settings:
 *   put:
 *     summary: 更新店铺设置
 *     tags: [卖家店铺管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               shippingSettings: { type: object, description: '物流设置' }
 *               paymentSettings: { type: object, description: '支付设置' }
 *               notificationSettings: { type: object, description: '通知设置' }
 *               otherSettings: { type: object, description: '其他设置' }
 *     responses:
 *       200:
 *         description: 成功更新店铺设置
 *       400:
 *         description: 请求参数错误
 *       500:
 *         description: 服务器错误
 */
router.put(
  '/shop/settings',
  sellerValidation.validateUpdateShopSettings,
  sellerController.updateShopSettings
);

/**
 * @swagger
 * /api/seller/shop/stats:
 *   get:
 *     summary: 获取店铺统计信息
 *     tags: [卖家店铺管理]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema: { type: string }
 *         description: 开始日期
 *       - in: query
 *         name: endDate
 *         schema: { type: string }
 *         description: 结束日期
 *     responses:
 *       200:
 *         description: 成功获取店铺统计信息
 *       500:
 *         description: 服务器错误
 */
router.get(
  '/shop/stats',
  sellerValidation.validateGetShopStats,
  sellerController.getShopStats
);

/**
 * @swagger
 * /api/seller/shop/logo:
 *   put:
 *     summary: 更新店铺Logo
 *     tags: [卖家店铺管理]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               logo: { type: string, format: binary, description: 'Logo文件' }
 *     responses:
 *       200:
 *         description: 成功更新店铺Logo
 *       400:
 *         description: 请求参数错误
 *       500:
 *         description: 服务器错误
 */
router.put(
  '/shop/logo',
  uploadMiddleware.single('logo'),
  sellerController.updateShopLogo
);

/**
 * @swagger
 * /api/seller/shop/banner:
 *   put:
 *     summary: 更新店铺Banner
 *     tags: [卖家店铺管理]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               banners: { type: array, items: { type: string, format: binary }, description: 'Banner文件' }
 *     responses:
 *       200:
 *         description: 成功更新店铺Banner
 *       400:
 *         description: 请求参数错误
 *       500:
 *         description: 服务器错误
 */
router.put(
  '/shop/banner',
  uploadMiddleware.array('banners', 5),
  sellerController.updateShopBanner
);

module.exports = router;