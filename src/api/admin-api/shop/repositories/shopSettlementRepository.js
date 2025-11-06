// 店铺结算仓库层
// 模拟数据存储
const mockSettlementData = [
  {
    id: '1',
    billNo: 'B20251102198468326657566720',
    createTime: '2025-11-02',
    settleTimeRange: '2025-10-02至2025-11-02',
    shopName: '薇薇',
    shopCode: 'SHOP001',
    settleAmount: '0.00',
    status: '已出账',
    details: {
      orderCount: 0,
      orderAmount: '0.00',
      commission: '0.00',
      settlementAmount: '0.00',
      orderDetails: []
    }
  },
  {
    id: '2',
    billNo: 'B20251102198468326598089472',
    createTime: '2025-11-02',
    settleTimeRange: '2025-11-01至2025-11-02',
    shopName: '薇品出露',
    shopCode: 'SHOP002',
    settleAmount: '0.00',
    status: '已出账',
    details: {
      orderCount: 0,
      orderAmount: '0.00',
      commission: '0.00',
      settlementAmount: '0.00',
      orderDetails: []
    }
  },
  {
    id: '3',
    billNo: 'B202511021984683265130840064',
    createTime: '2025-11-02',
    settleTimeRange: '2025-11-01至2025-11-02',
    shopName: '薇品批发111',
    shopCode: 'SHOP003',
    settleAmount: '0.00',
    status: '已出账',
    details: {
      orderCount: 0,
      orderAmount: '0.00',
      commission: '0.00',
      settlementAmount: '0.00',
      orderDetails: []
    }
  },
  {
    id: '4',
    billNo: 'B202511021984683264364776736',
    createTime: '2025-11-02',
    settleTimeRange: '2025-10-02至2025-11-02',
    shopName: '564616',
    shopCode: 'SHOP004',
    settleAmount: '0.00',
    status: '已出账',
    details: {
      orderCount: 0,
      orderAmount: '0.00',
      commission: '0.00',
      settlementAmount: '0.00',
      orderDetails: []
    }
  },
  {
    id: '5',
    billNo: 'B202511021984683263230905040',
    createTime: '2025-11-02',
    settleTimeRange: '2025-10-14至2025-11-02',
    shopName: '软件店铺1',
    shopCode: 'SHOP005',
    settleAmount: '0.00',
    status: '已出账',
    details: {
      orderCount: 0,
      orderAmount: '0.00',
      commission: '0.00',
      settlementAmount: '0.00',
      orderDetails: []
    }
  },
  {
    id: '6',
    billNo: 'B20251102198468326277641216',
    createTime: '2025-11-02',
    settleTimeRange: '2025-11-01至2025-11-02',
    shopName: '群丁的小铺',
    shopCode: 'SHOP006',
    settleAmount: '0.00',
    status: '已出账',
    details: {
      orderCount: 0,
      orderAmount: '0.00',
      commission: '0.00',
      settlementAmount: '0.00',
      orderDetails: []
    }
  },
  {
    id: '7',
    billNo: 'B202511021984683261349852544',
    createTime: '2025-11-02',
    settleTimeRange: '2025-11-01至2025-11-02',
    shopName: '小型无人机',
    shopCode: 'SHOP007',
    settleAmount: '0.00',
    status: '已出账',
    details: {
      orderCount: 0,
      orderAmount: '0.00',
      commission: '0.00',
      settlementAmount: '0.00',
      orderDetails: []
    }
  },
  {
    id: '8',
    billNo: 'B202511021984683260360351872',
    createTime: '2025-11-02',
    settleTimeRange: '2025-10-02至2025-11-02',
    shopName: '测试店铺11111111',
    shopCode: 'SHOP008',
    settleAmount: '0.00',
    status: '已出账',
    details: {
      orderCount: 0,
      orderAmount: '0.00',
      commission: '0.00',
      settlementAmount: '0.00',
      orderDetails: []
    }
  },
  {
    id: '9',
    billNo: 'B202511021984683259580211238',
    createTime: '2025-11-02',
    settleTimeRange: '2025-11-01至2025-11-02',
    shopName: 'jdjhdjhdjdjdioskjd',
    shopCode: 'SHOP009',
    settleAmount: '0.00',
    status: '已出账',
    details: {
      orderCount: 0,
      orderAmount: '0.00',
      commission: '0.00',
      settlementAmount: '0.00',
      orderDetails: []
    }
  },
  {
    id: '10',
    billNo: 'B202511021984683258759692288',
    createTime: '2025-11-02',
    settleTimeRange: '2025-10-02至2025-11-02',
    shopName: 'dfdvdfvdvdfvdvdfvdv',
    shopCode: 'SHOP010',
    settleAmount: '0.00',
    status: '已出账',
    details: {
      orderCount: 0,
      orderAmount: '0.00',
      commission: '0.00',
      settlementAmount: '0.00',
      orderDetails: []
    }
  }
];

class ShopSettlementRepository {
  /**
   * 查找结算数据
   * @param {Object} query - 查询条件
   * @param {number} skip - 跳过数量
   * @param {number} limit - 限制数量
   * @returns {Promise<Array>} 结算数据列表
   */
  async findSettlements(query, skip, limit) {
    // 在实际项目中，这里应该从数据库查询
    // 这里使用模拟数据进行过滤和分页
    let filteredData = [...mockSettlementData];
    
    // 应用过滤条件
    if (query.billNo) {
      filteredData = filteredData.filter(item => item.billNo.includes(query.billNo));
    }
    
    if (query.createTime) {
      const { $gte, $lte } = query.createTime;
      if ($gte && $lte) {
        filteredData = filteredData.filter(item => 
          item.createTime >= $gte && item.createTime <= $lte
        );
      }
    }
    
    if (query.status) {
      filteredData = filteredData.filter(item => item.status === query.status);
    }
    
    // 应用分页
    const paginatedData = filteredData.slice(skip, skip + limit);
    
    return paginatedData;
  }
  
  /**
   * 统计结算数据总数
   * @param {Object} query - 查询条件
   * @returns {Promise<number>} 数据总数
   */
  async countSettlements(query) {
    // 在实际项目中，这里应该从数据库查询总数
    // 这里使用模拟数据进行过滤和统计
    let filteredData = [...mockSettlementData];
    
    // 应用过滤条件
    if (query.billNo) {
      filteredData = filteredData.filter(item => item.billNo.includes(query.billNo));
    }
    
    if (query.createTime) {
      const { $gte, $lte } = query.createTime;
      if ($gte && $lte) {
        filteredData = filteredData.filter(item => 
          item.createTime >= $gte && item.createTime <= $lte
        );
      }
    }
    
    if (query.status) {
      filteredData = filteredData.filter(item => item.status === query.status);
    }
    
    return filteredData.length;
  }
  
  /**
   * 查找结算详情
   * @param {string} billNo - 账单号
   * @returns {Promise<Object|null>} 结算详情
   */
  async findSettlementDetail(billNo) {
    // 在实际项目中，这里应该从数据库查询
    // 这里使用模拟数据查找
    return mockSettlementData.find(item => item.billNo === billNo) || null;
  }
}

module.exports = new ShopSettlementRepository();