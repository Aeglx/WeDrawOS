/**
 * 卖家端退款管理模块入口
 * 导出退款相关的控制器、服务、仓库和路由
 * 提供模块注册函数，用于配置路由
 */

const express = require('express');
const refundRoutes = require('./routes/refundRoutes');
const refundController = require('./controllers/refundController');
const refundService = require('./services/refundService');
const refundRepository = require('./repositories/refundRepository');

/**
 * 退款管理模块
 * @namespace RefundModule
 */
const refundModule = {
  /**
   * 控制器
   */
  controllers: {
    refundController
  },

  /**
   * 服务
   */
  services: {
    refundService
  },

  /**
   * 仓库
   */
  repositories: {
    refundRepository
  },

  /**
   * 路由
   */
  routes: refundRoutes,

  /**
   * 注册退款管理模块路由
   * @param {express.Application} app - Express应用实例
   */
  register: (app) => {
    try {
      // 注册退款管理相关路由
      app.use('/api/seller/refunds', refundRoutes);
      
      console.log('卖家端退款管理模块已成功注册');
    } catch (error) {
      console.error('注册卖家端退款管理模块时出错:', error);
      throw error;
    }
  }
};

module.exports = refundModule;