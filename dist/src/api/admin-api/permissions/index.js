/**
 * 权限控制模块入口
 * 整合权限控制相关组件，提供模块初始化功能
 */

const permissionController = require('./controllers/permissionController');
const permissionService = require('./services/permissionService');
const permissionRepository = require('./repositories/permissionRepository');
const permissionRoutes = require('./routes/permissionRoutes');
const { container } = require('../../../core/di/dependencyInjector');
const logger = require('../../../core/logger');

/**
 * 初始化权限控制模块
 * @param {Object} app - Express应用实例
 */
function initialize(app) {
  try {
    // 注册服务到依赖注入容器
    container.register('permissionRepository', permissionRepository);
    container.register('permissionService', permissionService);
    container.register('permissionController', permissionController);
    
    // 注册路由
    permissionRoutes.register(app);
    
    logger.info('权限控制模块初始化完成');
  } catch (error) {
    logger.error('权限控制模块初始化失败:', error);
    throw error;
  }
}

// 导出模块配置
module.exports = {
  initialize,
  controllers: {
    permissionController
  },
  services: {
    permissionService
  },
  repositories: {
    permissionRepository
  },
  routes: permissionRoutes
};