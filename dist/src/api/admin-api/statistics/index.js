/**
 * 数据统计模块入口
 * 整合数据统计相关组件，提供模块初始化功能
 */

const statisticsController = require('./controllers/statisticsController');
const statisticsService = require('./services/statisticsService');
const statisticsRepository = require('./repositories/statisticsRepository');
const statisticsRoutes = require('./routes/statisticsRoutes');
const { container } = require('../../../core/di/dependencyInjector');
const logger = require('../../../core/logger');

/**
 * 初始化数据统计模块
 * @param {Object} app - Express应用实例
 */
function initialize(app) {
  try {
    // 注册服务到依赖注入容器
    container.register('statisticsRepository', statisticsRepository);
    container.register('statisticsService', statisticsService);
    container.register('statisticsController', statisticsController);
    
    // 注册路由
    statisticsRoutes.register(app);
    
    logger.info('数据统计模块初始化完成');
  } catch (error) {
    logger.error('数据统计模块初始化失败:', error);
    throw error;
  }
}

// 导出模块配置
module.exports = {
  initialize,
  controllers: {
    statisticsController
  },
  services: {
    statisticsService
  },
  repositories: {
    statisticsRepository
  },
  routes: statisticsRoutes
};