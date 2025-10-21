/**
 * 公共API模块入口
 * 提供通用功能、文件上传等公共服务
 */

const express = require('express');
const router = express.Router();
const commonController = require('./components/commonController');
const fileUploadController = require('./components/fileUploadController');
const logger = require('../core/utils/logger');

/**
 * 初始化公共API模块
 * @param {Object} app - Express应用实例
 * @param {Object} options - 配置选项
 */
function initializeCommonApi(app, options = {}) {
  try {
    // 设置静态文件服务，提供上传文件访问
    app.use('/uploads', express.static('uploads'));
    
    logger.info('初始化公共API模块...');
    
    // 注册中间件
    router.use(express.json());
    router.use(express.urlencoded({ extended: true }));
    
    // 健康检查接口
    router.get('/health', commonController.healthCheck);
    
    // 公共数据接口
    router.get('/categories', commonController.getCategories || (req, res) => res.status(501).send('Not implemented'));
    router.get('/regions', commonController.getRegions || (req, res) => res.status(501).send('Not implemented'));
    router.get('/suggestions', commonController.getSearchSuggestions || (req, res) => res.status(501).send('Not implemented'));
    
    // 系统配置接口
    router.get('/config', commonController.getSystemConfig);
    
    // 消息发送接口
    router.post('/messages', commonController.sendSystemMessage || (req, res) => res.status(501).send('Not implemented'));
    
    // 文件上传接口 - 单个图片
    router.post('/upload/image', 
      fileUploadController.uploadImage(),
      fileUploadController.handleImageUpload
    );
    
    // 文件上传接口 - 多个图片
    router.post('/upload/images', 
      fileUploadController.uploadMultipleImages(),
      fileUploadController.handleMultipleImagesUpload
    );
    
    // 文件上传接口 - 单个文件
    router.post('/upload/file', 
      fileUploadController.uploadFile(),
      fileUploadController.handleFileUpload
    );
    
    logger.info('公共API模块初始化完成');
    return router;
  } catch (error) {
    logger.error('初始化公共API模块失败:', error);
    throw error;
  }
}

/**
 * 注册公共API模块到DI容器
 * @param {Object} container - DI容器实例
 */
function registerServices(container) {
  try {
    // 尝试注册服务，如果文件存在的话
    try {
      const commonService = require('./services/commonService');
      container.register('commonService', () => commonService);
    } catch (e) {
      logger.warn('公共服务文件不存在，跳过注册');
    }
    
    try {
      const fileUploadService = require('./services/fileUploadService');
      container.register('fileUploadService', () => fileUploadService);
    } catch (e) {
      logger.warn('文件上传服务文件不存在，跳过注册');
    }
    
    // 注册控制器到容器
    container.register('commonController', () => commonController);
    container.register('fileUploadController', () => fileUploadController);
    
    logger.info('公共API服务注册完成');
  } catch (error) {
    logger.error('注册公共API服务失败:', error);
    throw error;
  }
}

/**
 * 注册公共API模块
 * @param {Object} app - Express应用实例
 */
function register(app) {
  const router = initializeCommonApi(app);
  // 注册到应用
  app.use('/api/common', router);
}

// 导出模块
module.exports = {
  initialize: initializeCommonApi,
  registerServices,
  register,
  router
};