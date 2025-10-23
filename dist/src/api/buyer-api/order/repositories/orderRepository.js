/**
 * 订单数据仓库
 * 处理订单相关的数据操作
 */

const logger = require('../../../core/utils/logger');
const BaseRepository = require('../../../core/repositories/baseRepository');

// 模拟订单数据存储
let orders = [];
let refunds = [];
let orderIdCounter = 1;
let refundIdCounter = 1;

class OrderRepository extends BaseRepository {
  constructor() {
    super();
    logger.info('订单数据仓库初始化');
  }
  
  /**
   * 创建订单
   * @param {Object} orderData - 订单数据
   * @returns {Promise<Object>} 创建的订单
   */
  async createOrder(orderData) {
    try {
      const order = {
        id: `order_${orderIdCounter++}`,
        ...orderData
      };
      
      orders.push(order);
      logger.info('订单创建成功', { orderId: order.id });
      
      return order;
    } catch (error) {
      logger.error('创建订单失败', { error: error.message });
      throw error;
    }
  }
  
  /**
   * 获取用户订单列表
   * @param {string} userId - 用户ID
   * @param {Object} query - 查询参数
   * @returns {Promise<Object>} 订单列表
   */
  async getUserOrders(userId, query) {
    try {
      const { page, limit, status } = query;
      
      // 过滤用户的订单
      let filteredOrders = orders.filter(order => order.userId === userId);
      
      // 按状态过滤
      if (status) {
        filteredOrders = filteredOrders.filter(order => order.status === status);
      }
      
      // 排序（最新的在前）
      filteredOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      // 分页
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedOrders = filteredOrders.slice(startIndex, endIndex);
      
      return {
        items: paginatedOrders,
        total: filteredOrders.length,
        page,
        limit,
        totalPages: Math.ceil(filteredOrders.length / limit)
      };
    } catch (error) {
      logger.error('获取用户订单列表失败', { userId, error: error.message });
      throw error;
    }
  }
  
  /**
   * 根据ID获取订单
   * @param {string} orderId - 订单ID
   * @returns {Promise<Object|null>} 订单对象或null
   */
  async getOrderById(orderId) {
    try {
      const order = orders.find(order => order.id === orderId);
      return order || null;
    } catch (error) {
      logger.error('根据ID获取订单失败', { orderId, error: error.message });
      throw error;
    }
  }
  
  /**
   * 更新订单
   * @param {string} orderId - 订单ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<Object>} 更新后的订单
   */
  async updateOrder(orderId, updateData) {
    try {
      const orderIndex = orders.findIndex(order => order.id === orderId);
      
      if (orderIndex === -1) {
        throw new Error('订单不存在');
      }
      
      orders[orderIndex] = {
        ...orders[orderIndex],
        ...updateData
      };
      
      logger.info('订单更新成功', { orderId });
      return orders[orderIndex];
    } catch (error) {
      logger.error('更新订单失败', { orderId, error: error.message });
      throw error;
    }
  }
  
  /**
   * 创建退款申请
   * @param {Object} refundData - 退款数据
   * @returns {Promise<Object>} 创建的退款申请
   */
  async createRefund(refundData) {
    try {
      const refund = {
        id: `refund_${refundIdCounter++}`,
        ...refundData
      };
      
      refunds.push(refund);
      logger.info('退款申请创建成功', { refundId: refund.id });
      
      return refund;
    } catch (error) {
      logger.error('创建退款申请失败', { error: error.message });
      throw error;
    }
  }
  
  /**
   * 获取订单的退款申请
   * @param {string} orderId - 订单ID
   * @returns {Promise<Object|null>} 退款申请或null
   */
  async getOrderRefund(orderId) {
    try {
      const refund = refunds.find(refund => refund.orderId === orderId);
      return refund || null;
    } catch (error) {
      logger.error('获取订单退款申请失败', { orderId, error: error.message });
      throw error;
    }
  }
  
  /**
   * 获取订单状态统计
   * @param {string} userId - 用户ID
   * @returns {Promise<Object>} 订单统计信息
   */
  async getOrderStats(userId) {
    try {
      const userOrders = orders.filter(order => order.userId === userId);
      
      const stats = {
        total: userOrders.length,
        pending: 0,        // 待支付
        paid: 0,           // 已支付
        shipped: 0,        // 已发货
        completed: 0,      // 已完成
        canceled: 0,       // 已取消
        refunding: 0       // 退款中
      };
      
      // 统计各状态订单数量
      userOrders.forEach(order => {
        if (stats.hasOwnProperty(order.status)) {
          stats[order.status]++;
        }
        
        // 检查是否有退款申请
        const hasRefund = refunds.some(refund => 
          refund.orderId === order.id && refund.status === 'pending'
        );
        if (hasRefund) {
          stats.refunding++;
        }
      });
      
      return stats;
    } catch (error) {
      logger.error('获取订单状态统计失败', { userId, error: error.message });
      throw error;
    }
  }
  
  /**
   * 删除订单
   * @param {string} orderId - 订单ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  async deleteOrder(orderId) {
    try {
      const initialLength = orders.length;
      orders = orders.filter(order => order.id !== orderId);
      
      const deleted = orders.length < initialLength;
      
      if (deleted) {
        logger.info('订单删除成功', { orderId });
        // 同时删除相关退款记录
        refunds = refunds.filter(refund => refund.orderId !== orderId);
      }
      
      return deleted;
    } catch (error) {
      logger.error('删除订单失败', { orderId, error: error.message });
      throw error;
    }
  }
  
  /**
   * 获取订单列表（管理员用）
   * @param {Object} query - 查询参数
   * @returns {Promise<Object>} 订单列表
   */
  async getOrders(query) {
    try {
      const { page = 1, limit = 20, status, userId } = query;
      
      let filteredOrders = [...orders];
      
      // 按条件过滤
      if (status) {
        filteredOrders = filteredOrders.filter(order => order.status === status);
      }
      
      if (userId) {
        filteredOrders = filteredOrders.filter(order => order.userId === userId);
      }
      
      // 排序
      filteredOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      // 分页
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedOrders = filteredOrders.slice(startIndex, endIndex);
      
      return {
        items: paginatedOrders,
        total: filteredOrders.length,
        page,
        limit,
        totalPages: Math.ceil(filteredOrders.length / limit)
      };
    } catch (error) {
      logger.error('获取订单列表失败', { error: error.message });
      throw error;
    }
  }
  
  /**
   * 初始化模拟数据
   */
  initializeMockData() {
    // 添加一些模拟订单数据
    const mockOrders = [
      {
        id: `order_${orderIdCounter++}`,
        userId: 'user_1',
        items: [
          {
            productId: 'product_1',
            name: '智能手机',
            price: 2999,
            quantity: 1,
            image: 'phone.jpg'
          }
        ],
        totalAmount: 2999,
        shippingAddress: {
          id: 'addr_1',
          name: '张三',
          phone: '13800138000',
          province: '北京市',
          city: '北京市',
          district: '朝阳区',
          address: '某某街道123号'
        },
        paymentMethod: 'online',
        status: 'completed',
        orderNumber: '20231201123456789',
        createdAt: new Date('2023-12-01T10:00:00'),
        updatedAt: new Date('2023-12-03T15:30:00'),
        completedAt: new Date('2023-12-03T15:30:00')
      },
      {
        id: `order_${orderIdCounter++}`,
        userId: 'user_1',
        items: [
          {
            productId: 'product_2',
            name: '笔记本电脑',
            price: 5999,
            quantity: 1,
            image: 'laptop.jpg'
          }
        ],
        totalAmount: 5999,
        shippingAddress: {
          id: 'addr_1',
          name: '张三',
          phone: '13800138000',
          province: '北京市',
          city: '北京市',
          district: '朝阳区',
          address: '某某街道123号'
        },
        paymentMethod: 'online',
        status: 'shipped',
        orderNumber: '20231210987654321',
        createdAt: new Date('2023-12-10T14:20:00'),
        updatedAt: new Date('2023-12-11T09:00:00')
      }
    ];
    
    orders = [...orders, ...mockOrders];
    logger.info('订单模拟数据初始化完成', { count: mockOrders.length });
  }
}

// 初始化模拟数据
const repository = new OrderRepository();
repository.initializeMockData();

module.exports = repository;