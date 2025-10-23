/**
 * @swagger
 * tags:
 *   name: 卖家管理
 *   description: 卖家端管理相关接口
 */

const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /seller-api/seller/register:
 *   post:
 *     summary: 卖家注册
 *     tags: [卖家管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - shopName
 *               - contactPhone
 *               - contactEmail
 *             properties:
 *               username: { type: string, description: '用户名' }
 *               password: { type: string, description: '密码' }
 *               shopName: { type: string, description: '店铺名称' }
 *               contactPhone: { type: string, description: '联系电话' }
 *               contactEmail: { type: string, description: '联系邮箱' }
 *               address: { type: string, description: '店铺地址' }
 *     responses:
 *       200: { $ref: '#/components/responses/200' }
 *       400: { $ref: '#/components/responses/400' }
 */
router.post('/register', async (req, res, next) => {
  try {
    res.json({ code: 200, message: '卖家注册路由', data: null });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /seller-api/seller/login:
 *   post:
 *     summary: 卖家登录
 *     tags: [卖家管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username: { type: string, description: '用户名' }
 *               password: { type: string, description: '密码' }
 *     responses:
 *       200: { $ref: '#/components/responses/200' }
 *       400: { $ref: '#/components/responses/400' }
 *       401: { $ref: '#/components/responses/401' }
 */
router.post('/login', async (req, res, next) => {
  try {
    res.json({ code: 200, message: '卖家登录路由', data: null });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /seller-api/seller/profile:
 *   get:
 *     summary: 获取卖家信息
 *     tags: [卖家管理]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200: { $ref: '#/components/responses/200' }
 *       401: { $ref: '#/components/responses/401' }
 */
router.get('/profile', async (req, res, next) => {
  try {
    res.json({ code: 200, message: '获取卖家信息路由', data: null });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /seller-api/seller/profile:
 *   put:
 *     summary: 更新卖家信息
 *     tags: [卖家管理]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               shopName: { type: string, description: '店铺名称' }
 *               contactPhone: { type: string, description: '联系电话' }
 *               contactEmail: { type: string, description: '联系邮箱' }
 *               address: { type: string, description: '店铺地址' }
 *               description: { type: string, description: '店铺描述' }
 *               logo: { type: string, description: '店铺logo URL' }
 *     responses:
 *       200: { $ref: '#/components/responses/200' }
 *       400: { $ref: '#/components/responses/400' }
 *       401: { $ref: '#/components/responses/401' }
 */
router.put('/profile', async (req, res, next) => {
  try {
    res.json({ code: 200, message: '更新卖家信息路由', data: null });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /seller-api/seller/password:
 *   put:
 *     summary: 修改密码
 *     tags: [卖家管理]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword: { type: string, description: '旧密码' }
 *               newPassword: { type: string, description: '新密码' }
 *     responses:
 *       200: { $ref: '#/components/responses/200' }
 *       400: { $ref: '#/components/responses/400' }
 *       401: { $ref: '#/components/responses/401' }
 */
router.put('/password', async (req, res, next) => {
  try {
    res.json({ code: 200, message: '修改密码路由', data: null });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /seller-api/seller/verify:
 *   post:
 *     summary: 卖家认证
 *     tags: [卖家管理]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - businessLicense
 *               - idCardFront
 *               - idCardBack
 *             properties:
 *               businessLicense: { type: string, description: '营业执照图片URL' }
 *               idCardFront: { type: string, description: '身份证正面图片URL' }
 *               idCardBack: { type: string, description: '身份证背面图片URL' }
 *               legalPersonName: { type: string, description: '法人姓名' }
 *               legalPersonIdCard: { type: string, description: '法人身份证号' }
 *     responses:
 *       200: { $ref: '#/components/responses/200' }
 *       400: { $ref: '#/components/responses/400' }
 *       401: { $ref: '#/components/responses/401' }
 */
router.post('/verify', async (req, res, next) => {
  try {
    res.json({ code: 200, message: '卖家认证路由', data: null });
  } catch (error) {
    next(error);
  }
});

module.exports = router;