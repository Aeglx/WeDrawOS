/**
 * 卖家端统计管理模块入口
 * 导出统计相关的控制器、服务、仓库和路由
 * 提供模块注册函数，用于配置路由
 */

const express = require('express');
const statisticsRoutes = require('./routes/statisticsRoutes');
const statisticsController = require('./controllers/statisticsController');
const statisticsService = require('./services/statisticsService');
const statisticsRepository = require('./repositories/statisticsRepository');

/**
 * 统计管理模块
 * @namespace StatisticsModule
 */
const statisticsModule = {
  /**
   * 控制器
   */
  controllers: {
    statisticsController
  },

  /**
   * 服务
   */
  services: {
    statisticsService
  },

  /**
   * 仓库
   */
  repositories: {
    statisticsRepository
  },

  /**
   * 路由
   */
  routes: statisticsRoutes,

  /**
   * 注册统计管理模块路由
   * @param {express.Application} app - Express应用实例
   */
  register: (app) => {
    try {
      // 注册统计管理相关路由
      app.use('/api/seller/statistics', statisticsRoutes);
      
      console.log('卖家端统计管理模块已成功注册');
    } catch (error) {
      console.error('注册卖家端统计管理模块时出错:', error);
      throw error;
    }
  }
};

module.exports = statisticsModule;