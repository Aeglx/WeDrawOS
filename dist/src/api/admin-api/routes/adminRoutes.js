/**
 * @swagger
 * tags:
 *   name: 管理员管理
 *   description: 管理端管理员相关接口
 */

const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /admin-api/admin/login:
 *   post:
 *     summary: 管理员登录
 *     tags: [管理员管理]
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
 *               username: { type: string, description: '管理员用户名' }
 *               password: { type: string, description: '管理员密码' }
 *     responses:
 *       200: { $ref: '#/components/responses/200' }
 *       400: { $ref: '#/components/responses/400' }
 *       401: { $ref: '#/components/responses/401' }
 */
router.post('/login', async (req, res, next) => {
  try {
    res.json({ code: 200, message: '管理员登录路由', data: null });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /admin-api/admin/logout:
 *   post:
 *     summary: 管理员登出
 *     tags: [管理员管理]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200: { $ref: '#/components/responses/200' }
 *       401: { $ref: '#/components/responses/401' }
 */
router.post('/logout', async (req, res, next) => {
  try {
    res.json({ code: 200, message: '管理员登出路由', data: null });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /admin-api/admin/profile:
 *   get:
 *     summary: 获取管理员信息
 *     tags: [管理员管理]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200: { $ref: '#/components/responses/200' }
 *       401: { $ref: '#/components/responses/401' }
 */
router.get('/profile', async (req, res, next) => {
  try {
    res.json({ code: 200, message: '获取管理员信息路由', data: null });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /admin-api/admin/profile:
 *   put:
 *     summary: 更新管理员信息
 *     tags: [管理员管理]
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
 *     responses:
 *       200: { $ref: '#/components/responses/200' }
 *       400: { $ref: '#/components/responses/400' }
 *       401: { $ref: '#/components/responses/401' }
 */
router.put('/profile', async (req, res, next) => {
  try {
    res.json({ code: 200, message: '更新管理员信息路由', data: null });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /admin-api/admin/password:
 *   put:
 *     summary: 修改密码
 *     tags: [管理员管理]
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
 * /admin-api/admin/list:
 *   get:
 *     summary: 获取管理员列表
 *     tags: [管理员管理]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *         description: 页码
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, default: 10 }
 *         description: 每页数量
 *     responses:
 *       200: { $ref: '#/components/responses/200' }
 *       401: { $ref: '#/components/responses/401' }
 *       403: { $ref: '#/components/responses/403' }
 */
router.get('/list', async (req, res, next) => {
  try {
    res.json({ code: 200, message: '获取管理员列表路由', data: null });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /admin-api/admin/create:
 *   post:
 *     summary: 创建管理员
 *     tags: [管理员管理]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - roleId
 *             properties:
 *               username: { type: string, description: '用户名' }
 *               password: { type: string, description: '密码' }
 *               roleId: { type: integer, description: '角色ID' }
 *               email: { type: string, description: '邮箱' }
 *               phone: { type: string, description: '手机号' }
 *     responses:
 *       200: { $ref: '#/components/responses/200' }
 *       400: { $ref: '#/components/responses/400' }
 *       401: { $ref: '#/components/responses/401' }
 *       403: { $ref: '#/components/responses/403' }
 */
router.post('/create', async (req, res, next) => {
  try {
    res.json({ code: 200, message: '创建管理员路由', data: null });
  } catch (error) {
    next(error);
  }
});

module.exports = router;