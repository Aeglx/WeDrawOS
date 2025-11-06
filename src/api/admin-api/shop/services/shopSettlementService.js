// 店铺结算服务层
const shopSettlementRepository = require('../repositories/shopSettlementRepository');

class ShopSettlementService {
  /**
   * 获取店铺结算列表
   * @param {Object} params - 查询参数
   * @returns {Promise<Object>} 结算数据和总数
   */
  async getSettlementList(params) {
    const { billNo, startTime, endTime, billStatus, page, pageSize } = params;
    
    // 构建查询条件
    const query = {};
    
    if (billNo) {
      query.billNo = billNo;
    }
    
    if (startTime && endTime) {
      query.createTime = {
        $gte: startTime,
        $lte: endTime
      };
    }
    
    if (billStatus) {
      query.status = billStatus;
    }
    
    // 分页参数
    const skip = (page - 1) * pageSize;
    const limit = pageSize;
    
    // 获取数据和总数
    const data = await shopSettlementRepository.findSettlements(query, skip, limit);
    const total = await shopSettlementRepository.countSettlements(query);
    
    return {
      data,
      total
    };
  }
  
  /**
   * 获取结算详情
   * @param {string} billNo - 账单号
   * @returns {Promise<Object|null>} 结算详情
   */
  async getSettlementDetail(billNo) {
    return await shopSettlementRepository.findSettlementDetail(billNo);
  }
}

module.exports = new ShopSettlementService();