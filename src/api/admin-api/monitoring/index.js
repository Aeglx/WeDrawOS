const { container } = require('../../../core/di');
const logger = require('../../../core/logger');
const monitoringRepository = require('./repositories/monitoringRepository');
const monitoringService = require('./services/monitoringService');
const monitoringController = require('./controllers/monitoringController');
const monitoringRoutes = require('./routes/monitoringRoutes');

const monitoringModule = {
  /**
   * 初始化监控模块
   * @param {express.Application} app - Express应用实例
   */
  async initialize(app) {
    try {
      // 注册依赖到容器
      container.register('monitoringRepository', monitoringRepository);
      container.register('monitoringService', monitoringService);
      container.register('monitoringController', monitoringController);
      
      // 注册路由
      monitoringRoutes.register(app);
      
      logger.info('监控模块初始化成功');
    } catch (error) {
      logger.error('监控模块初始化失败:', error);
      throw error;
    }
  }
};

module.exports = monitoringModule;