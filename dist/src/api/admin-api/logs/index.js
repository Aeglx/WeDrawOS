const { container } = require('../../../core/di');
const logger = require('../../../core/logger');
const logRepository = require('./repositories/logRepository');
const logService = require('./services/logService');
const logController = require('./controllers/logController');
const logRoutes = require('./routes/logRoutes');

const logModule = {
  /**
   * 初始化日志模块
   * @param {express.Application} app - Express应用实例
   */
  async initialize(app) {
    try {
      // 注册依赖到容器
      container.register('logRepository', logRepository);
      container.register('logService', logService);
      container.register('logController', logController);
      
      // 注册路由
      logRoutes.register(app);
      
      logger.info('日志模块初始化成功');
    } catch (error) {
      logger.error('日志模块初始化失败:', error);
      throw error;
    }
  }
};

module.exports = logModule;