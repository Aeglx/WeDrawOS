// 店铺结算控制器
const shopSettlementService = require('../services/shopSettlementService');
const logger = require('../../../../utils/logger');

class ShopSettlementController {
  /**
   * 获取店铺结算列表
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async getSettlementList(req, res) {
    try {
      logger.info('获取店铺结算列表请求', { query: req.query });
      const { billNo, startTime, endTime, billStatus, page = 1, pageSize = 10 } = req.query;
      
      const result = await shopSettlementService.getSettlementList({
        billNo,
        startTime,
        endTime,
        billStatus,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      });
      
      res.status(200).json({
        success: true,
        data: result.data,
        total: result.total,
        message: '获取店铺结算列表成功'
      });
    } catch (error) {
      logger.error('获取店铺结算列表失败', { error: error.message });
      res.status(500).json({
        success: false,
        message: '获取店铺结算列表失败',
        error: error.message
      });
    }
  }
  
  /**
   * 获取结算详情
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async getSettlementDetail(req, res) {
    try {
      logger.info('获取结算详情请求', { params: req.params });
      const { billNo } = req.params;
      
      const detail = await shopSettlementService.getSettlementDetail(billNo);
      
      if (!detail) {
        return res.status(404).json({
          success: false,
          message: '结算记录不存在'
        });
      }
      
      res.status(200).json({
        success: true,
        data: detail,
        message: '获取结算详情成功'
      });
    } catch (error) {
      logger.error('获取结算详情失败', { error: error.message });
      res.status(500).json({
        success: false,
        message: '获取结算详情失败',
        error: error.message
      });
    }
  }
}

module.exports = new ShopSettlementController();