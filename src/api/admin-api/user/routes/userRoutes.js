const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

/**
 * @swagger
 * tags:
 *   name: 用户管理
 *   description: 管理员用户管理相关接口
 */

/**
 * @swagger
 * /api/admin/user/list:
 *   get:
 *     summary: 获取用户列表
 *     tags: [用户管理]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: 页码，默认1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *         description: 每页数量，默认10
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         description: 用户ID（模糊搜索）
 *       - in: query
 *         name: username
 *         schema:
 *           type: string
 *         description: 用户名（模糊搜索）
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         description: 邮箱（模糊搜索）
 *       - in: query
 *         name: phone
 *         schema:
 *           type: string
 *         description: 手机号（模糊搜索）
 *       - in: query
 *         name: openid
 *         schema:
 *           type: string
 *         description: 公众号OpenID（模糊搜索）
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: 状态筛选
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [buyer, seller]
 *         description: 角色筛选
 *       - in: query
 *         name: membership
 *         schema:
 *           type: string
 *         description: 会员等级筛选
 *     responses:
 *       200:
 *         description: 成功获取用户列表
 *       500:
 *         description: 服务器内部错误
 */
router.get('/list', userController.getUsers);

/**
 * @swagger
 * /api/admin/user/detail/{userId}:
 *   get:
 *     summary: 获取用户详情
 *     tags: [用户管理]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: 用户ID
 *     responses:
 *       200:
 *         description: 成功获取用户详情
 *       404:
 *         description: 用户不存在
 *       500:
 *         description: 服务器内部错误
 */
router.get('/detail/:userId', userController.getUserDetail);

/**
 * @swagger
 * /api/admin/user/add:
 *   post:
 *     summary: 添加用户
 *     tags: [用户管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: 用户名
 *               email:
 *                 type: string
 *                 description: 邮箱
 *               phone:
 *                 type: string
 *                 description: 手机号
 *               openid:
 *                 type: string
 *                 description: 公众号OpenID
 *               role:
 *                 type: string
 *                 enum: [buyer, seller]
 *                 description: 角色
 *               membership:
 *                 type: string
 *                 description: 会员等级
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 description: 状态
 *     responses:
 *       200:
 *         description: 成功添加用户
 *       500:
 *         description: 服务器内部错误
 */
router.post('/add', userController.addUser);

/**
 * @swagger
 * /api/admin/user/status/{userId}:
 *   put:
 *     summary: 更新用户状态
 *     tags: [用户管理]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: 用户ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: number
 *                 enum: [0, 1]
 *                 description: 状态(0-禁用, 1-启用)
 *     responses:
 *       200:
 *         description: 成功更新状态
 *       404:
 *         description: 用户不存在
 *       500:
 *         description: 服务器内部错误
 */
router.put('/status/:userId', userController.updateUserStatus);

/**
 * @swagger
 * /api/admin/user/delete/{userId}:
 *   delete:
 *     summary: 删除用户
 *     tags: [用户管理]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: 用户ID
 *     responses:
 *       200:
 *         description: 成功删除用户
 *       404:
 *         description: 用户不存在
 *       500:
 *         description: 服务器内部错误
 */
router.delete('/delete/:userId', userController.deleteUser);

module.exports = router;