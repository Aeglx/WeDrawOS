/**
 * 运营管理模块入口
 * 整合运营管理相关组件，提供模块初始化功能
 */

const operationController = require('./controllers/operationController');
const operationService = require('./services/operationService');
const operationRepository = require('./repositories/operationRepository');
const operationRoutes = require('./routes/operationRoutes');
const { container } = require('../../../core/di/dependencyInjector');
const logger = require('../../../core/logger');

/**
 * 初始化运营管理模块
 * @param {Object} app - Express应用实例
 */
function initialize(app) {
  try {
    // 注册服务到依赖注入容器
    container.register('operationRepository', operationRepository);
    container.register('operationService', operationService);
    container.register('operationController', operationController);
    
    // 注册路由
    operationRoutes.register(app);
    
    logger.info('运营管理模块初始化完成');
  } catch (error) {
    logger.error('运营管理模块初始化失败:', error);
    throw error;
  }
}

// 导出模块配置
module.exports = {
  initialize,
  controllers: {
    operationController
  },
  services: {
    operationService
  },
  repositories: {
    operationRepository
  },
  routes: operationRoutes
};