// 商家对账控制器
const merchantReconciliationService = require('../services/merchantReconciliationService');
const logger = require('../../../../utils/logger');

class MerchantReconciliationController {
  /**
   * 获取商家对账数据
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async getReconciliationData(req, res) {
    try {
      logger.info('获取商家对账数据请求', { query: req.query });
      const { shopCode, startTime, endTime, orderStatus, page = 1, pageSize = 10 } = req.query;
      
      const result = await merchantReconciliationService.getReconciliationData({
        shopCode,
        startTime,
        endTime,
        orderStatus,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      });
      
      res.status(200).json({
        success: true,
        data: result.data,
        total: result.total,
        message: '获取商家对账数据成功'
      });
    } catch (error) {
      logger.error('获取商家对账数据失败', { error: error.message });
      res.status(500).json({
        success: false,
        message: '获取商家对账数据失败',
        error: error.message
      });
    }
  }
  
  /**
   * 获取对账详情
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async getReconciliationDetail(req, res) {
    try {
      logger.info('获取对账详情请求', { params: req.params });
      const { orderNo } = req.params;
      
      const detail = await merchantReconciliationService.getReconciliationDetail(orderNo);
      
      if (!detail) {
        return res.status(404).json({
          success: false,
          message: '对账记录不存在'
        });
      }
      
      res.status(200).json({
        success: true,
        data: detail,
        message: '获取对账详情成功'
      });
    } catch (error) {
      logger.error('获取对账详情失败', { error: error.message });
      res.status(500).json({
        success: false,
        message: '获取对账详情失败',
        error: error.message
      });
    }
  }
}

module.exports = new MerchantReconciliationController();