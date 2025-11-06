// 商家对账服务层
const merchantReconciliationRepository = require('../repositories/merchantReconciliationRepository');

class MerchantReconciliationService {
  /**
   * 获取商家对账数据
   * @param {Object} params - 查询参数
   * @returns {Promise<Object>} 对账数据和总数
   */
  async getReconciliationData(params) {
    const { shopCode, startTime, endTime, orderStatus, page, pageSize } = params;
    
    // 构建查询条件
    const query = {};
    
    if (shopCode) {
      query.shopCode = shopCode;
    }
    
    if (startTime && endTime) {
      query.orderTime = {
        $gte: startTime,
        $lte: endTime
      };
    }
    
    if (orderStatus) {
      query.status = orderStatus;
    }
    
    // 分页参数
    const skip = (page - 1) * pageSize;
    const limit = pageSize;
    
    // 获取数据和总数
    const data = await merchantReconciliationRepository.findReconciliationData(query, skip, limit);
    const total = await merchantReconciliationRepository.countReconciliationData(query);
    
    return {
      data,
      total
    };
  }
  
  /**
   * 获取对账详情
   * @param {string} orderNo - 订单号
   * @returns {Promise<Object|null>} 对账详情
   */
  async getReconciliationDetail(orderNo) {
    return await merchantReconciliationRepository.findReconciliationDetail(orderNo);
  }
}

module.exports = new MerchantReconciliationService();