/**
 * @swagger
 * tags:
 *   name: AI服务
 *   description: AI模型对话和健康检查接口
 */
const aiModelService = require('./aiModelService');
const logger = require('../utils/logger');

class AIController {
  /**
   * @swagger
   * /api/ai/chat:
   *   post:
   *     summary: AI对话接口
   *     description: 使用AI模型生成对用户输入的回复
   *     tags: [AI服务]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - prompt
   *             properties:
   *               prompt: 
   *                 type: string
   *                 description: 用户输入的对话内容
   *               options:
   *                 type: object
   *                 properties:
   *                   max_tokens:
   *                     type: integer
   *                     description: 最大生成token数
   *                   temperature:
   *                     type: number
   *                     description: 生成温度参数
   *     responses:
   *       200:
   *         description: 成功
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean }
   *                 data: 
   *                   type: object
   *                   properties:
   *                     response: { type: string }
   *                     tokens: 
   *                       type: object
   *                       properties:
   *                         prompt: { type: integer }
   *                         completion: { type: integer }
   */
  static async chat(req, res) {
    try {
      const { prompt, options } = req.body;
      
      if (!prompt) {
        return res.status(400).json({
          success: false,
          message: '请求必须包含prompt参数'
        });
      }

      // 记录请求
      logger.info('收到AI对话请求:', { promptLength: prompt.length });

      // 生成回复
      const response = await aiModelService.generateResponse(prompt, options);

      return res.json({
        success: true,
        data: {
          response,
          tokens: {
            prompt: Math.ceil(prompt.length / 4), // 粗略估算token数
            completion: Math.ceil(response.length / 4)
          }
        }
      });
    } catch (error) {
      logger.error('AI对话处理失败:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'AI服务处理失败',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  /**
   * @swagger
   * /api/ai/health:
   *   get:
   *     summary: AI服务健康检查
   *     description: 检查AI模型服务的运行状态
   *     tags: [AI服务]
   *     responses:
   *       200:
   *         description: 成功
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean }
   *                 data: 
   *                   type: object
   *                   properties:
   *                     status: { type: string }
   *                     modelPath: { type: string }
   *                     memoryStatus: 
   *                       type: object
   *                       properties:
   *                         totalMB: { type: integer }
   *                         availableMB: { type: integer }
   *                         isEnough: { type: boolean }
   *                     mode: { type: string }
   */
  static async healthCheck(req, res) {
    try {
      const healthStatus = await aiModelService.healthCheck();
      
      return res.json({
        success: true,
        data: healthStatus
      });
    } catch (error) {
      logger.error('健康检查失败:', error);
      return res.status(500).json({
        success: false,
        message: '健康检查失败'
      });
    }
  }

  /**
   * @swagger
   * /api/ai/initialize:
   *   post:
   *     summary: 初始化AI模型
   *     description: 手动触发AI模型的加载和初始化
   *     tags: [AI服务]
   *     responses:
   *       200:
   *         description: 成功
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean }
   *                 message: { type: string }
   */
  static async initialize(req, res) {
    try {
      logger.info('手动初始化AI模型请求');
      const result = await aiModelService.initialize();
      
      if (result) {
        return res.json({
          success: true,
          message: '模型初始化成功'
        });
      } else {
        return res.status(500).json({
          success: false,
          message: '模型初始化失败'
        });
      }
    } catch (error) {
      logger.error('手动初始化失败:', error);
      return res.status(500).json({
        success: false,
        message: '初始化失败: ' + error.message
      });
    }
  }

  /**
   * @swagger
   * /api/ai/release:
   *   post:
   *     summary: 释放AI模型资源
   *     description: 手动释放AI模型占用的系统资源
   *     tags: [AI服务]
   *     responses:
   *       200:
   *         description: 成功
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean }
   *                 message: { type: string }
   */
  static async release(req, res) {
    try {
      logger.info('释放AI模型资源请求');
      await aiModelService.release();
      
      return res.json({
        success: true,
        message: '模型资源已释放'
      });
    } catch (error) {
      logger.error('释放资源失败:', error);
      return res.status(500).json({
        success: false,
        message: '释放资源失败'
      });
    }
  }
}

module.exports = AIController;