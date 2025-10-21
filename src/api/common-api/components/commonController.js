/**
 * 公共API控制器
 * 提供平台通用的接口入口
 */

const commonService = require('../services/commonService');
const logger = require('@core/utils/logger');

class CommonController {
  /**
   * 健康检查接口
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件
   */
  async healthCheck(req, res, next) {
    try {
      const healthInfo = await commonService.healthCheck();
      res.json(healthInfo);
    } catch (error) {
      logger.error('健康检查接口错误:', error);
      res.status(503).json({
        status: 'error',
        message: '服务暂时不可用',
      });
    }
  }
  
  /**
   * 获取商品分类列表
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async getCategories(req, res) {
    try {
      const { withChildren } = req.query;
      const categories = await commonService.getCategories(withChildren !== 'false');
      res.json(categories);
    } catch (error) {
      logger.error('获取分类列表错误:', error);
      res.status(500).json({
        error: '获取分类列表失败',
      });
    }
  }
  
  /**
   * 获取地区列表
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async getRegions(req, res) {
    try {
      const { parentId = 0 } = req.query;
      const regions = await commonService.getRegions(parseInt(parentId, 10));
      res.json(regions);
    } catch (error) {
      logger.error('获取地区列表错误:', error);
      res.status(500).json({
        error: '获取地区列表失败',
      });
    }
  }
  
  /**
   * 获取搜索建议
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async getSearchSuggestions(req, res) {
    try {
      const { keyword, type = 'product' } = req.query;
      
      if (!keyword || keyword.trim().length < 2) {
        return res.json([]);
      }
      
      const suggestions = await commonService.getSearchSuggestions(keyword, type);
      res.json(suggestions);
    } catch (error) {
      logger.error('获取搜索建议错误:', error);
      res.json([]);
    }
  }
  
  /**
   * 发送系统消息
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async sendSystemMessage(req, res) {
    try {
      const messageData = req.body;
      const success = await commonService.sendSystemMessage(messageData);
      
      res.json({
        success,
      });
    } catch (error) {
      logger.error('发送系统消息错误:', error);
      res.status(400).json({
        error: error.message || '发送消息失败',
      });
    }
  }
  
  /**
   * 获取系统配置
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async getSystemConfig(req, res) {
    try {
      const { configKey } = req.params;
      const config = await commonService.getSystemConfig(configKey);
      
      if (config) {
        res.json(config);
      } else {
        res.status(404).json({
          error: '配置不存在',
        });
      }
    } catch (error) {
      logger.error('获取系统配置错误:', error);
      res.status(500).json({
        error: '获取配置失败',
      });
    }
  }
}

module.exports = new CommonController();