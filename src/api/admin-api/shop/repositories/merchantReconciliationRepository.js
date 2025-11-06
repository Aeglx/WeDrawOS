// 商家对账仓库层
// 模拟数据存储
const mockReconciliationData = [
  {
    orderNo: 'E202510211643250577966720',
    orderTime: '2025-11-02',
    transactionTime: '2025-11-01 08:30:45',
    shopCode: 'SHOP001',
    shopName: '店铺1',
    orderAmount: '¥12.00',
    status: '已结算',
    details: {
      items: [
        {
          productName: '商品A',
          price: '¥6.00',
          quantity: 2,
          total: '¥12.00'
        }
      ],
      commission: '¥0.60',
      settlementAmount: '¥11.40',
      paymentMethod: '微信支付',
      paymentStatus: '已支付'
    }
  },
  {
    orderNo: 'E202510211643250577966721',
    orderTime: '2025-11-02',
    transactionTime: '2025-11-01 09:15:22',
    shopCode: 'SHOP002',
    shopName: '酷品店铺',
    orderAmount: '¥88.50',
    status: '已结算',
    details: {
      items: [
        {
          productName: '高级商品B',
          price: '¥88.50',
          quantity: 1,
          total: '¥88.50'
        }
      ],
      commission: '¥4.43',
      settlementAmount: '¥84.07',
      paymentMethod: '支付宝',
      paymentStatus: '已支付'
    }
  },
  {
    orderNo: 'E202510211643250577966722',
    orderTime: '2025-11-02',
    transactionTime: '2025-11-01 10:20:11',
    shopCode: 'SHOP003',
    shopName: '潮流前线1111',
    orderAmount: '¥128.00',
    status: '已结算',
    details: {
      items: [
        {
          productName: '潮流单品',
          price: '¥128.00',
          quantity: 1,
          total: '¥128.00'
        }
      ],
      commission: '¥6.40',
      settlementAmount: '¥121.60',
      paymentMethod: '微信支付',
      paymentStatus: '已支付'
    }
  },
  {
    orderNo: 'E202510211643250577966723',
    orderTime: '2025-11-02',
    transactionTime: '2025-11-01 11:45:30',
    shopCode: 'SHOP004',
    shopName: '566616',
    orderAmount: '¥56.80',
    status: '已结算',
    details: {
      items: [
        {
          productName: '日用品套装',
          price: '¥56.80',
          quantity: 1,
          total: '¥56.80'
        }
      ],
      commission: '¥2.84',
      settlementAmount: '¥53.96',
      paymentMethod: '支付宝',
      paymentStatus: '已支付'
    }
  },
  {
    orderNo: 'E202510211643250577966724',
    orderTime: '2025-11-02',
    transactionTime: '2025-11-01 14:20:55',
    shopCode: 'SHOP005',
    shopName: '我叫潮潮！',
    orderAmount: '¥99.00',
    status: '已结算',
    details: {
      items: [
        {
          productName: '潮品外套',
          price: '¥99.00',
          quantity: 1,
          total: '¥99.00'
        }
      ],
      commission: '¥4.95',
      settlementAmount: '¥94.05',
      paymentMethod: '微信支付',
      paymentStatus: '已支付'
    }
  },
  {
    orderNo: 'E202510211643250577966725',
    orderTime: '2025-11-02',
    transactionTime: '2025-11-01 15:30:22',
    shopCode: 'SHOP006',
    shopName: '打字小铺',
    orderAmount: '¥23.50',
    status: '已结算',
    details: {
      items: [
        {
          productName: '办公用品',
          price: '¥23.50',
          quantity: 1,
          total: '¥23.50'
        }
      ],
      commission: '¥1.18',
      settlementAmount: '¥22.32',
      paymentMethod: '支付宝',
      paymentStatus: '已支付'
    }
  },
  {
    orderNo: 'E202510211643250577966726',
    orderTime: '2025-11-02',
    transactionTime: '2025-11-01 16:45:10',
    shopCode: 'SHOP007',
    shopName: '小吃街人1',
    orderAmount: '¥45.00',
    status: '已结算',
    details: {
      items: [
        {
          productName: '特色小吃',
          price: '¥45.00',
          quantity: 1,
          total: '¥45.00'
        }
      ],
      commission: '¥2.25',
      settlementAmount: '¥42.75',
      paymentMethod: '微信支付',
      paymentStatus: '已支付'
    }
  },
  {
    orderNo: 'E202510211643250577966727',
    orderTime: '2025-11-02',
    transactionTime: '2025-11-01 17:20:33',
    shopCode: 'SHOP008',
    shopName: '潮流前线11111111',
    orderAmount: '¥199.00',
    status: '已结算',
    details: {
      items: [
        {
          productName: '高级潮流单品',
          price: '¥199.00',
          quantity: 1,
          total: '¥199.00'
        }
      ],
      commission: '¥9.95',
      settlementAmount: '¥189.05',
      paymentMethod: '支付宝',
      paymentStatus: '已支付'
    }
  },
  {
    orderNo: 'E202510211643250577966728',
    orderTime: '2025-11-02',
    transactionTime: '2025-11-01 18:10:45',
    shopCode: 'SHOP009',
    shopName: 'kaopppppppppppp',
    orderAmount: '¥35.80',
    status: '已结算',
    details: {
      items: [
        {
          productName: '时尚配件',
          price: '¥35.80',
          quantity: 1,
          total: '¥35.80'
        }
      ],
      commission: '¥1.79',
      settlementAmount: '¥34.01',
      paymentMethod: '微信支付',
      paymentStatus: '已支付'
    }
  },
  {
    orderNo: 'E202510211643250577966729',
    orderTime: '2025-11-02',
    transactionTime: '2025-11-01 19:50:15',
    shopCode: 'SHOP010',
    shopName: 'dddddddddddddd',
    orderAmount: '¥78.00',
    status: '已结算',
    details: {
      items: [
        {
          productName: '日常用品',
          price: '¥78.00',
          quantity: 1,
          total: '¥78.00'
        }
      ],
      commission: '¥3.90',
      settlementAmount: '¥74.10',
      paymentMethod: '支付宝',
      paymentStatus: '已支付'
    }
  }
];

class MerchantReconciliationRepository {
  /**
   * 查找对账数据
   * @param {Object} query - 查询条件
   * @param {number} skip - 跳过数量
   * @param {number} limit - 限制数量
   * @returns {Promise<Array>} 对账数据列表
   */
  async findReconciliationData(query, skip, limit) {
    // 在实际项目中，这里应该从数据库查询
    // 这里使用模拟数据进行过滤和分页
    let filteredData = [...mockReconciliationData];
    
    // 应用过滤条件
    if (query.shopCode) {
      filteredData = filteredData.filter(item => item.shopCode === query.shopCode);
    }
    
    if (query.orderTime) {
      const { $gte, $lte } = query.orderTime;
      if ($gte && $lte) {
        filteredData = filteredData.filter(item => 
          item.orderTime >= $gte && item.orderTime <= $lte
        );
      }
    }
    
    if (query.status) {
      filteredData = filteredData.filter(item => item.status === query.status);
    }
    
    // 应用分页
    const paginatedData = filteredData.slice(skip, skip + limit);
    
    // 返回基本信息，不包含详情
    return paginatedData.map(item => ({
      key: item.orderNo,
      orderNo: item.orderNo,
      orderTime: item.orderTime,
      transactionTime: item.transactionTime,
      shopName: item.shopName,
      orderAmount: item.orderAmount,
      status: item.status
    }));
  }
  
  /**
   * 统计对账数据总数
   * @param {Object} query - 查询条件
   * @returns {Promise<number>} 数据总数
   */
  async countReconciliationData(query) {
    // 在实际项目中，这里应该从数据库查询总数
    // 这里使用模拟数据进行过滤和统计
    let filteredData = [...mockReconciliationData];
    
    // 应用过滤条件
    if (query.shopCode) {
      filteredData = filteredData.filter(item => item.shopCode === query.shopCode);
    }
    
    if (query.orderTime) {
      const { $gte, $lte } = query.orderTime;
      if ($gte && $lte) {
        filteredData = filteredData.filter(item => 
          item.orderTime >= $gte && item.orderTime <= $lte
        );
      }
    }
    
    if (query.status) {
      filteredData = filteredData.filter(item => item.status === query.status);
    }
    
    return filteredData.length;
  }
  
  /**
   * 查找对账详情
   * @param {string} orderNo - 订单号
   * @returns {Promise<Object|null>} 对账详情
   */
  async findReconciliationDetail(orderNo) {
    // 在实际项目中，这里应该从数据库查询
    // 这里使用模拟数据查找
    return mockReconciliationData.find(item => item.orderNo === orderNo) || null;
  }
}

module.exports = new MerchantReconciliationRepository();