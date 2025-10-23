/**
 * 管理端企业微信管理模块入口
 * 整合企业微信管理相关组件
 */

const logger = require('../../../core/logger');

/**
 * 初始化企业微信管理模块
 * @param {Object} container - 依赖注入容器
 * @param {Object} app - Express应用实例
 */
function initEnterpriseWechatModule(container, app) {
  try {
    logger.info('初始化企业微信管理模块');
    
    // 注册企业微信管理相关仓库
    container.register('groupRepository', require('./repositories/groupRepository'));
    container.register('materialRepository', require('./repositories/materialRepository'));
    container.register('messageRepository', require('./repositories/messageRepository'));
    container.register('statisticRepository', require('./repositories/statisticRepository'));
    
    // 注册企业微信管理相关服务
    container.register('groupService', require('./services/groupService'));
    container.register('materialService', require('./services/materialService'));
    container.register('messageService', require('./services/messageService'));
    container.register('statisticService', require('./services/statisticService'));
    container.register('wechatWorkUtil', require('./utils/wechatWorkUtil'));
    
    // 注册企业微信管理相关控制器
    container.register('groupController', require('./controllers/groupController'));
    container.register('materialController', require('./controllers/materialController'));
    container.register('messageController', require('./controllers/messageController'));
    container.register('statisticController', require('./controllers/statisticController'));
    
    // 注册路由
    registerRoutes(app, container);
    
    logger.info('企业微信管理模块初始化完成');
  } catch (error) {
    logger.error('企业微信管理模块初始化失败:', error);
    throw error;
  }
}

/**
 * 注册企业微信管理相关路由
 * @param {Object} app - Express应用实例
 * @param {Object} container - 依赖注入容器
 */
function registerRoutes(app, container) {
  // 获取控制器实例
  const groupController = container.get('groupController');
  const materialController = container.get('materialController');
  const messageController = container.get('messageController');
  const statisticController = container.get('statisticController');
  
  // 导入路由
  const groupRoutes = require('./routes/groupRoutes');
  const materialRoutes = require('./routes/materialRoutes');
  const messageRoutes = require('./routes/messageRoutes');
  const statisticRoutes = require('./routes/statisticRoutes');
  
  // 注册企业微信管理相关路由
  app.use('/api/admin/wechat-work/groups', groupRoutes);
  app.use('/api/admin/wechat-work/materials', materialRoutes);
  app.use('/api/admin/wechat-work/messages', messageRoutes);
  app.use('/api/admin/wechat-work/statistics', statisticRoutes);
  
  logger.info('企业微信管理相关路由注册完成');
}

module.exports = {
  init: initEnterpriseWechatModule
};