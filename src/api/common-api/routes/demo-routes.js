/**
 * @swagger
 * tags:
 *   name: 示例接口
 *   description: 用于演示的示例API接口集合
 */

const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /api/common/health:
 *   get:
 *     summary: 健康检查接口
 *     tags: [示例接口]
 *     description: 检查服务器运行状态
 *     responses:
 *       200:
 *         description: 服务器正常运行
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: '服务器运行正常'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 serverTime:
 *                   type: string
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '服务器运行正常',
    timestamp: new Date().toISOString(),
    serverTime: new Date().toString()
  });
});

/**
 * @swagger
 * /api/common/info:
 *   get:
 *     summary: 获取服务器信息
 *     tags: [示例接口]
 *     description: 获取当前服务器的详细信息
 *     responses:
 *       200:
 *         description: 成功获取服务器信息
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: 'WeDraw API'
 *                     version:
 *                       type: string
 *                       example: '1.0.0'
 *                     nodeVersion:
 *                       type: string
 *                     uptime:
 *                       type: number
 */
router.get('/info', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'WeDraw API',
      version: '1.0.0',
      nodeVersion: process.version,
      uptime: process.uptime()
    }
  });
});

/**
 * @swagger
 * /api/common/test:
 *   post:
 *     summary: 测试接口
 *     tags: [示例接口]
 *     description: 用于测试API请求和响应的接口
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: '测试名称'
 *               value:
 *                 type: object
 *                 description: '测试值'
 *     responses:
 *       200:
 *         description: 测试成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 received:
 *                   type: object
 *                 message:
 *                   type: string
 */
router.post('/test', (req, res) => {
  res.json({
    success: true,
    received: req.body,
    message: '测试请求处理成功'
  });
});

module.exports = router;