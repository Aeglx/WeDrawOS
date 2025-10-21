/**
 * 统计报表生成任务
 * 负责生成各类业务报表
 */
const JobBase = require('../job/jobBase');
const logger = require('../../core/utils/logger');
const cacheManager = require('../../core/cache/cacheManager');

class ReportGenerationJob extends JobBase {
  constructor() {
    super({
      name: 'ReportGenerationJob',
      cronExpression: '0 8 * * *', // 每天早上8点执行
      timeout: 600000 // 10分钟超时
    });
    
    // 模拟数据（无数据库环境）
    this.mockOrderData = [];
    this.mockUserData = [];
    this.mockProductData = [];
    
    // 初始化模拟数据
    this.initializeMockData();
  }

  /**
   * 执行报表生成逻辑
   */
  async run() {
    logger.info('开始执行统计报表生成任务');
    
    try {
      const today = new Date();
      const reportDate = new Date(today);
      
      // 1. 生成销售报表
      const salesReport = await this.generateSalesReport(reportDate);
      
      // 2. 生成用户活跃度报表
      const userActivityReport = await this.generateUserActivityReport(reportDate);
      
      // 3. 生成商品销售报表
      const productSalesReport = await this.generateProductSalesReport(reportDate);
      
      // 4. 生成库存预警报表
      const inventoryAlertReport = await this.generateInventoryAlertReport(reportDate);
      
      // 5. 保存报表数据
      await this.saveReports({
        salesReport,
        userActivityReport,
        productSalesReport,
        inventoryAlertReport
      });
      
      // 6. 发送报表通知
      await this.sendReportNotification(reportDate);
      
      logger.info('统计报表生成任务执行完成');
      
    } catch (error) {
      logger.error('统计报表生成任务执行失败:', error);
      throw error;
    }
  }

  /**
   * 生成销售报表
   */
  async generateSalesReport(date) {
    logger.info('开始生成销售报表');
    
    try {
      // 获取指定日期的订单数据
      const dateStr = date.toISOString().split('T')[0];
      const dailyOrders = this.mockOrderData.filter(order => 
        order.orderDate.startsWith(dateStr) && 
        order.status === 'completed'
      );
      
      // 计算销售统计数据
      const totalOrders = dailyOrders.length;
      const totalSales = dailyOrders.reduce((sum, order) => sum + order.amount, 0);
      const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
      const orderStatusDistribution = this.calculateOrderStatusDistribution();
      
      // 按支付方式统计
      const paymentMethodStats = this.calculatePaymentMethodStats(dailyOrders);
      
      const report = {
        reportDate: date.toISOString(),
        totalOrders,
        totalSales: parseFloat(totalSales.toFixed(2)),
        averageOrderValue: parseFloat(averageOrderValue.toFixed(2)),
        orderStatusDistribution,
        paymentMethodStats,
        topSellingProducts: this.getTopSellingProducts(dailyOrders, 5),
        salesTrend: this.calculateSalesTrend(date, 7) // 最近7天趋势
      };
      
      logger.info(`销售报表生成完成，总订单数: ${totalOrders}，总销售额: ${totalSales}`);
      
      return report;
    } catch (error) {
      logger.error('生成销售报表失败:', error);
      throw error;
    }
  }

  /**
   * 生成用户活跃度报表
   */
  async generateUserActivityReport(date) {
    logger.info('开始生成用户活跃度报表');
    
    try {
      const dateStr = date.toISOString().split('T')[0];
      
      // 统计日活跃用户
      const dailyActiveUsers = this.mockUserData.filter(user => 
        user.lastActiveDate && user.lastActiveDate.startsWith(dateStr)
      ).length;
      
      // 统计新注册用户
      const newUsers = this.mockUserData.filter(user => 
        user.registrationDate && user.registrationDate.startsWith(dateStr)
      ).length;
      
      // 统计用户活跃度分布
      const activityDistribution = this.calculateUserActivityDistribution();
      
      const report = {
        reportDate: date.toISOString(),
        dailyActiveUsers,
        newUsers,
        totalUsers: this.mockUserData.length,
        activityDistribution,
        userRetention: this.calculateUserRetention(date, 7) // 7天留存率
      };
      
      logger.info(`用户活跃度报表生成完成，日活: ${dailyActiveUsers}，新增: ${newUsers}`);
      
      return report;
    } catch (error) {
      logger.error('生成用户活跃度报表失败:', error);
      throw error;
    }
  }

  /**
   * 生成商品销售报表
   */
  async generateProductSalesReport(date) {
    logger.info('开始生成商品销售报表');
    
    try {
      const dateStr = date.toISOString().split('T')[0];
      const dailyOrders = this.mockOrderData.filter(order => 
        order.orderDate && order.orderDate.startsWith(dateStr)
      );
      
      // 统计商品销售数据
      const productStats = {};
      
      dailyOrders.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach(item => {
            if (!productStats[item.productId]) {
              productStats[item.productId] = {
                productId: item.productId,
                productName: item.productName || 'Unknown',
                quantity: 0,
                sales: 0,
                orders: 0
              };
            }
            
            productStats[item.productId].quantity += item.quantity;
            productStats[item.productId].sales += item.price * item.quantity;
            productStats[item.productId].orders += 1;
          });
        }
      });
      
      // 转换为数组并排序
      const sortedProducts = Object.values(productStats)
        .sort((a, b) => b.sales - a.sales);
      
      const report = {
        reportDate: date.toISOString(),
        totalProductsSold: Object.keys(productStats).length,
        productSalesDetails: sortedProducts,
        bestSellingProduct: sortedProducts.length > 0 ? sortedProducts[0] : null
      };
      
      logger.info(`商品销售报表生成完成，售出商品种类: ${Object.keys(productStats).length}`);
      
      return report;
    } catch (error) {
      logger.error('生成商品销售报表失败:', error);
      throw error;
    }
  }

  /**
   * 生成库存预警报表
   */
  async generateInventoryAlertReport(date) {
    logger.info('开始生成库存预警报表');
    
    try {
      // 模拟库存数据
      const inventoryData = this.mockProductData.map(product => ({
        productId: product.productId,
        productName: product.name,
        currentStock: Math.floor(Math.random() * 200),
        minStockLevel: 50,
        maxStockLevel: 200
      }));
      
      // 找出需要预警的商品
      const lowStockItems = inventoryData.filter(item => 
        item.currentStock <= item.minStockLevel
      );
      
      const overStockItems = inventoryData.filter(item => 
        item.currentStock >= item.maxStockLevel
      );
      
      const report = {
        reportDate: date.toISOString(),
        totalProducts: inventoryData.length,
        lowStockItems,
        overStockItems,
        stockHealth: {
          healthy: inventoryData.length - lowStockItems.length - overStockItems.length,
          lowStock: lowStockItems.length,
          overStock: overStockItems.length
        }
      };
      
      logger.info(`库存预警报表生成完成，低库存商品: ${lowStockItems.length}，超库存商品: ${overStockItems.length}`);
      
      return report;
    } catch (error) {
      logger.error('生成库存预警报表失败:', error);
      throw error;
    }
  }

  /**
   * 保存报表数据
   */
  async saveReports(reports) {
    try {
      const reportDate = reports.salesReport.reportDate.split('T')[0];
      
      // 保存到缓存
      for (const [reportType, reportData] of Object.entries(reports)) {
        const cacheKey = `${reportType}_${reportDate}`;
        await cacheManager.set(cacheKey, JSON.stringify(reportData), 86400 * 7); // 保存7天
        logger.info(`报表 ${reportType} 已保存到缓存，键: ${cacheKey}`);
      }
      
      // 保存最新报表索引
      await cacheManager.set('latest_reports', JSON.stringify({
        date: reportDate,
        generatedAt: new Date().toISOString(),
        reportTypes: Object.keys(reports)
      }), 86400);
      
    } catch (error) {
      logger.error('保存报表数据失败:', error);
      throw error;
    }
  }

  /**
   * 发送报表通知
   */
  async sendReportNotification(date) {
    try {
      logger.info(`发送报表通知，报表日期: ${date.toISOString().split('T')[0]}`);
      
      // TODO: 实际环境中，这里应该发送邮件或短信通知
      // 模拟发送通知
      await new Promise(resolve => setTimeout(resolve, 500));
      
      logger.info('报表通知发送成功');
      
    } catch (error) {
      logger.error('发送报表通知失败:', error);
      // 不抛出异常，以免影响主要功能
    }
  }

  /**
   * 计算订单状态分布
   */
  calculateOrderStatusDistribution() {
    const distribution = {};
    
    this.mockOrderData.forEach(order => {
      distribution[order.status] = (distribution[order.status] || 0) + 1;
    });
    
    return distribution;
  }

  /**
   * 计算支付方式统计
   */
  calculatePaymentMethodStats(orders) {
    const stats = {};
    
    orders.forEach(order => {
      const method = order.paymentMethod || 'unknown';
      if (!stats[method]) {
        stats[method] = {
          count: 0,
          amount: 0
        };
      }
      
      stats[method].count += 1;
      stats[method].amount += order.amount || 0;
    });
    
    return stats;
  }

  /**
   * 获取畅销商品
   */
  getTopSellingProducts(orders, limit = 5) {
    const productSales = {};
    
    orders.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          if (!productSales[item.productId]) {
            productSales[item.productId] = {
              productId: item.productId,
              productName: item.productName || 'Unknown',
              quantity: 0,
              sales: 0
            };
          }
          
          productSales[item.productId].quantity += item.quantity;
          productSales[item.productId].sales += item.price * item.quantity;
        });
      }
    });
    
    return Object.values(productSales)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, limit);
  }

  /**
   * 计算销售趋势
   */
  calculateSalesTrend(date, days = 7) {
    const trend = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const targetDate = new Date(date);
      targetDate.setDate(targetDate.getDate() - i);
      const dateStr = targetDate.toISOString().split('T')[0];
      
      const dayOrders = this.mockOrderData.filter(order => 
        order.orderDate && order.orderDate.startsWith(dateStr) && 
        order.status === 'completed'
      );
      
      trend.push({
        date: dateStr,
        orders: dayOrders.length,
        sales: dayOrders.reduce((sum, order) => sum + (order.amount || 0), 0)
      });
    }
    
    return trend;
  }

  /**
   * 计算用户活跃度分布
   */
  calculateUserActivityDistribution() {
    const distribution = {
      highlyActive: 0, // 每天活跃
      active: 0, // 每周活跃3次以上
      moderatelyActive: 0, // 每周活跃1-2次
      inactive: 0, // 每月活跃
      dormant: 0 // 超过一个月未活跃
    };
    
    const now = new Date();
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    
    this.mockUserData.forEach(user => {
      if (!user.lastActiveDate) {
        distribution.dormant++;
        return;
      }
      
      const lastActive = new Date(user.lastActiveDate);
      
      if (lastActive >= oneDayAgo) {
        distribution.highlyActive++;
      } else if (lastActive >= oneWeekAgo) {
        distribution.active++;
      } else if (lastActive >= oneMonthAgo) {
        distribution.moderatelyActive++;
      } else {
        distribution.inactive++;
      }
    });
    
    return distribution;
  }

  /**
   * 计算用户留存率
   */
  calculateUserRetention(date, days = 7) {
    const targetDate = new Date(date);
    targetDate.setDate(targetDate.getDate() - days);
    const retentionDateStr = targetDate.toISOString().split('T')[0];
    const todayStr = date.toISOString().split('T')[0];
    
    // 获取指定日期注册的用户
    const newUsers = this.mockUserData.filter(user => 
      user.registrationDate && user.registrationDate.startsWith(retentionDateStr)
    );
    
    // 计算这些用户中今天仍然活跃的数量
    const retainedUsers = newUsers.filter(user => 
      user.lastActiveDate && user.lastActiveDate.startsWith(todayStr)
    );
    
    const retentionRate = newUsers.length > 0 ? 
      (retainedUsers.length / newUsers.length * 100).toFixed(2) : 0;
    
    return {
      period: `${days}天`,
      newUsersCount: newUsers.length,
      retainedUsersCount: retainedUsers.length,
      retentionRate: parseFloat(retentionRate)
    };
  }

  /**
   * 初始化模拟数据
   */
  initializeMockData() {
    // 生成模拟订单数据
    const orderStatuses = ['pending_payment', 'paid', 'shipping', 'completed', 'cancelled'];
    const paymentMethods = ['alipay', 'wechatpay', 'creditcard', 'banktransfer'];
    
    // 生成过去30天的订单
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // 每天生成10-30个订单
      const orderCount = Math.floor(Math.random() * 20) + 10;
      
      for (let j = 0; j < orderCount; j++) {
        const orderItems = [];
        const itemCount = Math.floor(Math.random() * 3) + 1; // 1-3个商品
        
        for (let k = 0; k < itemCount; k++) {
          const productId = `PROD${String(Math.floor(Math.random() * 100) + 1).padStart(3, '0')}`;
          const price = Math.floor(Math.random() * 900) + 100; // 100-1000元
          const quantity = Math.floor(Math.random() * 5) + 1;
          
          orderItems.push({
            productId,
            productName: `商品${productId}`,
            price,
            quantity
          });
        }
        
        const totalAmount = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        
        this.mockOrderData.push({
          orderId: `ORD${Date.now()}${String(j).padStart(3, '0')}`,
          userId: `USER${String(Math.floor(Math.random() * 1000) + 1).padStart(4, '0')}`,
          orderDate: `${dateStr}T${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}.000Z`,
          amount: totalAmount,
          status: orderStatuses[Math.floor(Math.random() * orderStatuses.length)],
          paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
          items: orderItems
        });
      }
    }
    
    // 生成模拟用户数据
    for (let i = 0; i < 500; i++) {
      const registrationDate = new Date();
      registrationDate.setDate(registrationDate.getDate() - Math.floor(Math.random() * 90));
      
      const lastActiveDate = new Date();
      lastActiveDate.setDate(lastActiveDate.getDate() - Math.floor(Math.random() * 30));
      
      this.mockUserData.push({
        userId: `USER${String(i + 1).padStart(4, '0')}`,
        username: `user${i + 1}`,
        registrationDate: registrationDate.toISOString(),
        lastActiveDate: Math.random() > 0.3 ? lastActiveDate.toISOString() : null,
        email: `user${i + 1}@example.com`
      });
    }
    
    // 生成模拟商品数据
    for (let i = 0; i < 100; i++) {
      this.mockProductData.push({
        productId: `PROD${String(i + 1).padStart(3, '0')}`,
        name: `商品${i + 1}`,
        category: `类别${Math.floor(i / 20) + 1}`,
        price: Math.floor(Math.random() * 900) + 100
      });
    }
  }
}

module.exports = ReportGenerationJob;