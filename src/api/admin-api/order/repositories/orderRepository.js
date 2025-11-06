/**
 * 订单仓库层
 * 实现订单数据的访问和操作
 */

// 模拟订单数据
const mockOrders = [];

// 生成模拟订单数据
const generateMockOrders = () => {
  const statuses = ['pending', 'paid', 'verification', 'completed', 'cancelled'];
  const sources = ['移动端', 'PC端', '小程序端'];
  const buyerNames = ['130****1111', '181****3560', '4e14b7f4e1326cd1b8b577bfa0f1304c097b', '8030294c9f488b7tc'];
  
  // 生成1002条数据
  for (let i = 1; i <= 1002; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    // 生成特定格式的订单号
    const id = `O2025${String(i).padStart(20, '0')}`;
    // 生成特定格式的下单时间
    const year = 2025;
    const month = Math.floor(Math.random() * 3) + 10; // 10-12月
    const day = Math.floor(Math.random() * 30) + 1;
    const hours = Math.floor(Math.random() * 24);
    const minutes = Math.floor(Math.random() * 60);
    const seconds = Math.floor(Math.random() * 60);
    const createdAt = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    // 根据状态设置不同的金额
    let amount;
    if (status === 'completed') {
      amount = 0.01;
    } else if (status === 'paid') {
      amount = 122.00;
    } else if (status === 'pending' || status === 'verification') {
      amount = Math.random() > 0.5 ? 0 : 1.00;
    } else {
      amount = Math.random() > 0.5 ? 0.10 : 899.00;
    }
    
    mockOrders.push({
      id,
      source: sources[Math.floor(Math.random() * sources.length)],
      buyerName: buyerNames[Math.floor(Math.random() * buyerNames.length)],
      amount: amount,
      status: status,
      statusText: getStatusText(status),
      statusColor: getStatusColor(status),
      createdAt
    });
  }
};

// 根据状态获取标签颜色
const getStatusColor = (status) => {
  const colorMap = {
    pending: 'orange', // 未付款
    paid: 'blue',      // 已付款
    verification: 'orange', // 待核验
    completed: 'green', // 已完成
    cancelled: 'red'    // 已关闭
  };
  return colorMap[status] || 'default';
};

// 根据状态值获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    pending: '未付款',
    paid: '已付款',
    verification: '待核验',
    completed: '已完成',
    cancelled: '已关闭'
  };
  return statusMap[status] || status;
};

// 生成模拟数据
if (mockOrders.length === 0) {
  generateMockOrders();
}

/**
 * 订单仓库
 */
const orderRepository = {
  /**
   * 查找订单列表
   * @param {Object} conditions - 查询条件
   * @param {number} page - 页码
   * @param {number} pageSize - 每页数量
   * @returns {Promise<Array>} 订单列表
   */
  async findOrders(conditions = {}, page = 1, pageSize = 10) {
    try {
      let filteredOrders = [...mockOrders];
      
      // 应用查询条件
      if (conditions.orderId) {
        filteredOrders = filteredOrders.filter(order => 
          order.id.toLowerCase().includes(conditions.orderId.toLowerCase())
        );
      }
      
      if (conditions.memberName) {
        filteredOrders = filteredOrders.filter(order => 
          order.buyerName.toLowerCase().includes(conditions.memberName.toLowerCase())
        );
      }
      
      if (conditions.startTime) {
        filteredOrders = filteredOrders.filter(order => 
          new Date(order.createdAt) >= new Date(conditions.startTime)
        );
      }
      
      if (conditions.endTime) {
        filteredOrders = filteredOrders.filter(order => 
          new Date(order.createdAt) <= new Date(conditions.endTime)
        );
      }
      
      if (conditions.status) {
        filteredOrders = filteredOrders.filter(order => 
          order.status === conditions.status
        );
      }
      
      // 计算分页
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedOrders = filteredOrders.slice(startIndex, endIndex);
      
      return paginatedOrders;
    } catch (error) {
      console.error('查询订单列表失败:', error);
      throw error;
    }
  },

  /**
   * 统计订单数量
   * @param {Object} conditions - 查询条件
   * @returns {Promise<number>} 订单数量
   */
  async countOrders(conditions = {}) {
    try {
      let filteredOrders = [...mockOrders];
      
      // 应用查询条件
      if (conditions.orderId) {
        filteredOrders = filteredOrders.filter(order => 
          order.id.toLowerCase().includes(conditions.orderId.toLowerCase())
        );
      }
      
      if (conditions.memberName) {
        filteredOrders = filteredOrders.filter(order => 
          order.buyerName.toLowerCase().includes(conditions.memberName.toLowerCase())
        );
      }
      
      if (conditions.startTime) {
        filteredOrders = filteredOrders.filter(order => 
          new Date(order.createdAt) >= new Date(conditions.startTime)
        );
      }
      
      if (conditions.endTime) {
        filteredOrders = filteredOrders.filter(order => 
          new Date(order.createdAt) <= new Date(conditions.endTime)
        );
      }
      
      if (conditions.status) {
        filteredOrders = filteredOrders.filter(order => 
          order.status === conditions.status
        );
      }
      
      return filteredOrders.length;
    } catch (error) {
      console.error('统计订单数量失败:', error);
      throw error;
    }
  },

  /**
   * 查找订单详情
   * @param {string} orderId - 订单ID
   * @returns {Promise<Object|null>} 订单详情
   */
  async findOrderDetail(orderId) {
    try {
      const order = mockOrders.find(order => order.id === orderId);
      
      if (order) {
        // 模拟订单详情数据
        return {
          ...order,
          products: [
            {
              id: '1',
              name: '测试商品',
              price: order.amount,
              quantity: 1,
              total: order.amount
            }
          ],
          address: {
            province: '广东省',
            city: '深圳市',
            district: '南山区',
            detail: '科技园路1号'
          },
          paymentInfo: {
            method: '在线支付',
            transactionId: `T${Date.now()}`,
            paidAt: order.status === 'paid' || order.status === 'completed' ? order.createdAt : null
          }
        };
      }
      
      return null;
    } catch (error) {
      console.error('查询订单详情失败:', error);
      throw error;
    }
  },

  /**
   * 更新订单状态
   * @param {string} orderId - 订单ID
   * @param {string} status - 新状态
   * @param {Object} params - 更新参数
   * @returns {Promise<Object>} 更新结果
   */
  async updateOrderStatus(orderId, status, params = {}) {
    try {
      const orderIndex = mockOrders.findIndex(order => order.id === orderId);
      
      if (orderIndex === -1) {
        throw new Error('订单不存在');
      }
      
      // 更新订单状态
      mockOrders[orderIndex].status = status;
      mockOrders[orderIndex].statusText = getStatusText(status);
      mockOrders[orderIndex].statusColor = getStatusColor(status);
      
      return {
        success: true,
        orderId,
        status,
        updateTime: new Date().toISOString()
      };
    } catch (error) {
      console.error('更新订单状态失败:', error);
      throw error;
    }
  }
};

module.exports = orderRepository;