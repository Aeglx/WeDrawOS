/**
 * @swagger
 * tags:
 *   name: 买家用户
 *   description: 买家端用户管理相关接口
 */

const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /buyer-api/user/register:
 *   post:
 *     summary: 用户注册
 *     tags: [买家用户]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - email
 *               - phone
 *             properties:
 *               username: { type: string, description: '用户名' }
 *               password: { type: string, description: '密码' }
 *               email: { type: string, description: '邮箱' }
 *               phone: { type: string, description: '手机号' }
 *     responses:
 *       200: { $ref: '#/components/responses/200' }
 *       400: { $ref: '#/components/responses/400' }
 */
router.post('/register', async (req, res, next) => {
  try {
    res.json({ code: 200, message: '用户注册路由', data: null });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /buyer-api/user/login:
 *   post:
 *     summary: 用户登录
 *     tags: [买家用户]
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
    res.json({ code: 200, message: '用户登录路由', data: null });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /buyer-api/user/profile:
 *   get:
 *     summary: 获取用户信息
 *     tags: [买家用户]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200: { $ref: '#/components/responses/200' }
 *       401: { $ref: '#/components/responses/401' }
 */
router.get('/profile', async (req, res, next) => {
  try {
    res.json({ code: 200, message: '获取用户信息路由', data: null });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /buyer-api/user/profile:
 *   put:
 *     summary: 更新用户信息
 *     tags: [买家用户]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username: { type: string, description: '用户名' }
 *               email: { type: string, description: '邮箱' }
 *               phone: { type: string, description: '手机号' }
 *               avatar: { type: string, description: '头像URL' }
 *     responses:
 *       200: { $ref: '#/components/responses/200' }
 *       400: { $ref: '#/components/responses/400' }
 *       401: { $ref: '#/components/responses/401' }
 */
router.put('/profile', async (req, res, next) => {
  try {
    res.json({ code: 200, message: '更新用户信息路由', data: null });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /buyer-api/user/password:
 *   put:
 *     summary: 修改密码
 *     tags: [买家用户]
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

module.exports = router;