/**
 * 运营管理控制器
 * 处理运营管理相关的API请求
 */

const { container } = require('../../../core/di/dependencyInjector');
const logger = require('../../../core/logger');

class OperationController {
  constructor() {
    this.operationService = container.get('operationService');
  }

  /**
   * 获取运营活动列表
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async getOperationList(req, res) {
    try {
      const { page, limit, status, keyword } = req.query;
      const operations = await this.operationService.getOperationList({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        status,
        keyword
      });
      res.status(200).json({ success: true, data: operations });
    } catch (error) {
      logger.error('获取运营活动列表失败:', error);
      res.status(500).json({ success: false, message: '获取运营活动列表失败', error: error.message });
    }
  }

  /**
   * 获取运营活动详情
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async getOperationDetail(req, res) {
    try {
      const { id } = req.params;
      const operation = await this.operationService.getOperationDetail(id);
      res.status(200).json({ success: true, data: operation });
    } catch (error) {
      logger.error('获取运营活动详情失败:', error);
      res.status(500).json({ success: false, message: '获取运营活动详情失败', error: error.message });
    }
  }

  /**
   * 创建运营活动
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async createOperation(req, res) {
    try {
      const operationData = req.body;
      const operation = await this.operationService.createOperation(operationData);
      res.status(201).json({ success: true, message: '运营活动创建成功', data: operation });
    } catch (error) {
      logger.error('创建运营活动失败:', error);
      res.status(500).json({ success: false, message: '创建运营活动失败', error: error.message });
    }
  }

  /**
   * 更新运营活动
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async updateOperation(req, res) {
    try {
      const { id } = req.params;
      const operationData = req.body;
      const operation = await this.operationService.updateOperation(id, operationData);
      res.status(200).json({ success: true, message: '运营活动更新成功', data: operation });
    } catch (error) {
      logger.error('更新运营活动失败:', error);
      res.status(500).json({ success: false, message: '更新运营活动失败', error: error.message });
    }
  }

  /**
   * 删除运营活动
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async deleteOperation(req, res) {
    try {
      const { id } = req.params;
      await this.operationService.deleteOperation(id);
      res.status(200).json({ success: true, message: '运营活动删除成功' });
    } catch (error) {
      logger.error('删除运营活动失败:', error);
      res.status(500).json({ success: false, message: '删除运营活动失败', error: error.message });
    }
  }

  /**
   * 批量删除运营活动
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async batchDeleteOperations(req, res) {
    try {
      const { ids } = req.body;
      await this.operationService.batchDeleteOperations(ids);
      res.status(200).json({ success: true, message: '批量删除运营活动成功' });
    } catch (error) {
      logger.error('批量删除运营活动失败:', error);
      res.status(500).json({ success: false, message: '批量删除运营活动失败', error: error.message });
    }
  }

  /**
   * 更新运营活动状态
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async updateOperationStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      await this.operationService.updateOperationStatus(id, status);
      res.status(200).json({ success: true, message: '运营活动状态更新成功' });
    } catch (error) {
      logger.error('更新运营活动状态失败:', error);
      res.status(500).json({ success: false, message: '更新运营活动状态失败', error: error.message });
    }
  }

  /**
   * 获取运营活动模板列表
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async getOperationTemplates(req, res) {
    try {
      const templates = await this.operationService.getOperationTemplates();
      res.status(200).json({ success: true, data: templates });
    } catch (error) {
      logger.error('获取运营活动模板失败:', error);
      res.status(500).json({ success: false, message: '获取运营活动模板失败', error: error.message });
    }
  }

  /**
   * 获取运营数据概览
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async getOperationOverview(req, res) {
    try {
      const { startDate, endDate } = req.query;
      const overview = await this.operationService.getOperationOverview(startDate, endDate);
      res.status(200).json({ success: true, data: overview });
    } catch (error) {
      logger.error('获取运营数据概览失败:', error);
      res.status(500).json({ success: false, message: '获取运营数据概览失败', error: error.message });
    }
  }

  /**
   * 导出运营活动数据
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async exportOperations(req, res) {
    try {
      const { ids, format } = req.query;
      const fileData = await this.operationService.exportOperations(ids ? ids.split(',') : null, format || 'excel');
      
      const contentType = format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv';
      const fileExtension = format === 'excel' ? 'xlsx' : 'csv';
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename=operations-${Date.now()}.${fileExtension}`);
      
      res.status(200).send(fileData);
    } catch (error) {
      logger.error('导出运营活动数据失败:', error);
      res.status(500).json({ success: false, message: '导出运营活动数据失败', error: error.message });
    }
  }

  /**
   * 复制运营活动
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async duplicateOperation(req, res) {
    try {
      const { id } = req.params;
      const duplicated = await this.operationService.duplicateOperation(id);
      res.status(201).json({ success: true, message: '运营活动复制成功', data: duplicated });
    } catch (error) {
      logger.error('复制运营活动失败:', error);
      res.status(500).json({ success: false, message: '复制运营活动失败', error: error.message });
    }
  }
}

module.exports = new OperationController();