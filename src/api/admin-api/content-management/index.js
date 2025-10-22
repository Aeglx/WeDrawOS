/**
 * 内容管理模块入口
 * 整合内容管理相关组件，提供模块初始化功能
 */

const contentController = require('./controllers/contentController');
const contentService = require('./services/contentService');
const contentRepository = require('./repositories/contentRepository');
const contentRoutes = require('./routes/contentRoutes');
const { container } = require('../../../core/di/dependencyInjector');
const logger = require('../../../core/logger');

/**
 * 初始化内容管理模块
 * @param {Object} app - Express应用实例
 */
function initialize(app) {
  try {
    // 注册服务到依赖注入容器
    container.register('contentRepository', contentRepository);
    container.register('contentService', contentService);
    container.register('contentController', contentController);
    
    // 注册路由
    contentRoutes.register(app);
    
    logger.info('内容管理模块初始化完成');
  } catch (error) {
    logger.error('内容管理模块初始化失败:', error);
    throw error;
  }
}

// 导出模块配置
module.exports = {
  initialize,
  controllers: {
    contentController
  },
  services: {
    contentService
  },
  repositories: {
    contentRepository
  },
  routes: contentRoutes
};