/**
 * 卖家端订单管理模块入口
 * 导出订单相关的控制器、服务、仓库和路由
 * 提供模块注册函数，用于配置路由
 */

const express = require('express');
const orderRoutes = require('./routes/orderRoutes');
const orderController = require('./controllers/orderController');
const orderService = require('./services/orderService');
const orderRepository = require('./repositories/orderRepository');

/**
 * 订单管理模块
 * @namespace OrderModule
 */
const orderModule = {
  /**
   * 控制器
   */
  controllers: {
    orderController
  },

  /**
   * 服务
   */
  services: {
    orderService
  },

  /**
   * 仓库
   */
  repositories: {
    orderRepository
  },

  /**
   * 路由
   */
  routes: orderRoutes,

  /**
   * 注册订单管理模块路由
   * @param {express.Application} app - Express应用实例
   */
  register: (app) => {
    try {
      // 注册订单管理相关路由
      app.use('/api/seller/orders', orderRoutes);
      
      console.log('卖家端订单管理模块已成功注册');
    } catch (error) {
      console.error('注册卖家端订单管理模块时出错:', error);
      throw error;
    }
  }
};

module.exports = orderModule;