/**
 * 公众号模板消息管理控制器
 * 处理公众号模板消息的获取、添加、删除等功能
 */

const logger = require('../../../core/logger');
const templateService = require('../services/templateService');

/**
 * 公众号模板消息管理控制器类
 */
class TemplateController {
  /**
   * 获取模板库模板列表
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express中间件回调函数
   */
  async getPublicTemplates(req, res, next) {
    try {
      const { offset = 0, count = 20 } = req.query;
      const result = await templateService.getPublicTemplates({
        offset: parseInt(offset),
        count: parseInt(count)
      });
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('获取模板库模板列表失败:', error);
      next(error);
    }
  }

  /**
   * 搜索模板库模板
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express中间件回调函数
   */
  async searchPublicTemplates(req, res, next) {
    try {
      const { keyword, offset = 0, count = 20 } = req.query;
      const result = await templateService.searchPublicTemplates(keyword, {
        offset: parseInt(offset),
        count: parseInt(count)
      });
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('搜索模板库模板失败:', error);
      next(error);
    }
  }

  /**
   * 从模板库添加模板
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express中间件回调函数
   */
  async addTemplate(req, res, next) {
    try {
      const { templateIdShort, keywordList } = req.body;
      const result = await templateService.addTemplate(templateIdShort, keywordList);
      res.status(201).json({
        success: true,
        message: '添加模板成功',
        data: result
      });
    } catch (error) {
      logger.error('从模板库添加模板失败:', error);
      next(error);
    }
  }

  /**
   * 获取已添加的模板列表
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express中间件回调函数
   */
  async getTemplates(req, res, next) {
    try {
      const templates = await templateService.getTemplates();
      res.json({
        success: true,
        data: templates
      });
    } catch (error) {
      logger.error('获取已添加的模板列表失败:', error);
      next(error);
    }
  }

  /**
   * 删除模板
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express中间件回调函数
   */
  async deleteTemplate(req, res, next) {
    try {
      const { templateId } = req.params;
      await templateService.deleteTemplate(templateId);
      res.json({
        success: true,
        message: '模板删除成功'
      });
    } catch (error) {
      logger.error('删除模板失败:', error);
      next(error);
    }
  }

  /**
   * 发送模板消息
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express中间件回调函数
   */
  async sendTemplateMessage(req, res, next) {
    try {
      const messageData = req.body;
      const result = await templateService.sendTemplateMessage(messageData);
      res.status(201).json({
        success: true,
        message: '模板消息发送成功',
        data: result
      });
    } catch (error) {
      logger.error('发送模板消息失败:', error);
      next(error);
    }
  }

  /**
   * 获取模板消息发送记录
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express中间件回调函数
   */
  async getMessageRecords(req, res, next) {
    try {
      const { page = 1, pageSize = 20, status, startTime, endTime } = req.query;
      const result = await templateService.getMessageRecords({
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        status,
        startTime,
        endTime
      });
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('获取模板消息发送记录失败:', error);
      next(error);
    }
  }

  /**
   * 预览模板消息
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express中间件回调函数
   */
  async previewTemplateMessage(req, res, next) {
    try {
      const { touser, templateId, data, url, miniprogram } = req.body;
      const result = await templateService.previewTemplateMessage({
        touser,
        template_id: templateId,
        data,
        url,
        miniprogram
      });
      res.json({
        success: true,
        message: '模板消息预览成功',
        data: result
      });
    } catch (error) {
      logger.error('预览模板消息失败:', error);
      next(error);
    }
  }

  /**
   * 批量发送模板消息
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express中间件回调函数
   */
  async batchSendTemplateMessage(req, res, next) {
    try {
      const { templateId, data, userList, url, miniprogram } = req.body;
      const result = await templateService.batchSendTemplateMessage({
        template_id: templateId,
        data,
        user_list: userList,
        url,
        miniprogram
      });
      res.status(201).json({
        success: true,
        message: '批量发送模板消息成功',
        data: result
      });
    } catch (error) {
      logger.error('批量发送模板消息失败:', error);
      next(error);
    }
  }

  /**
   * 获取模板消息发送统计
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express中间件回调函数
   */
  async getMessageStatistics(req, res, next) {
    try {
      const { startTime, endTime } = req.query;
      const statistics = await templateService.getMessageStatistics(startTime, endTime);
      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      logger.error('获取模板消息发送统计失败:', error);
      next(error);
    }
  }
}

module.exports = new TemplateController();