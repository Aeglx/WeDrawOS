/**
 * 广告管理模块入口
 * 整合广告管理相关组件，提供模块初始化功能
 */

const adController = require('./controllers/adController');
const adService = require('./services/adService');
const adRepository = require('./repositories/adRepository');
const adRoutes = require('./routes/adRoutes');
const { container } = require('../../../core/di/dependencyInjector');
const logger = require('../../../core/logger');

/**
 * 初始化广告管理模块
 * @param {Object} app - Express应用实例
 */
function initialize(app) {
  try {
    // 注册服务到依赖注入容器
    container.register('adRepository', adRepository);
    container.register('adService', adService);
    container.register('adController', adController);
    
    // 注册路由
    adRoutes.register(app);
    
    logger.info('广告管理模块初始化完成');
  } catch (error) {
    logger.error('广告管理模块初始化失败:', error);
    throw error;
  }
}

// 导出模块配置
module.exports = {
  initialize,
  controllers: {
    adController
  },
  services: {
    adService
  },
  repositories: {
    adRepository
  },
  routes: adRoutes
};