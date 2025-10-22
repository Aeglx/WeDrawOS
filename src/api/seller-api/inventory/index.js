/**
 * 卖家端库存管理模块入口
 * 导出库存相关的控制器、服务、仓库和路由
 * 提供模块注册函数，用于配置路由
 */

const express = require('express');
const inventoryRoutes = require('./routes/inventoryRoutes');
const inventoryController = require('./controllers/inventoryController');
const inventoryService = require('./services/inventoryService');
const inventoryRepository = require('./repositories/inventoryRepository');

/**
 * 库存管理模块
 * @namespace InventoryModule
 */
const inventoryModule = {
  /**
   * 控制器
   */
  controllers: {
    inventoryController
  },

  /**
   * 服务
   */
  services: {
    inventoryService
  },

  /**
   * 仓库
   */
  repositories: {
    inventoryRepository
  },

  /**
   * 路由
   */
  routes: inventoryRoutes,

  /**
   * 注册库存管理模块路由
   * @param {express.Application} app - Express应用实例
   */
  register: (app) => {
    try {
      // 注册库存管理相关路由
      app.use('/api/seller/inventory', inventoryRoutes);
      
      console.log('卖家端库存管理模块已成功注册');
    } catch (error) {
      console.error('注册卖家端库存管理模块时出错:', error);
      throw error;
    }
  }
};

module.exports = inventoryModule;