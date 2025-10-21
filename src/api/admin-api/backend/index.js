const logger = require('../../../core/logger');
const WechatRepository = require('./repositories/wechatRepository');
const WechatService = require('./services/wechatService');
const WechatController = require('./controllers/wechatController');
const WechatRoutes = require('./routes/wechatRoutes');

const wechatModule = {
  /**
   * 初始化微信模块
   * @param {Object} app - Express应用实例
   */
  async initialize(app) {
    try {
      logger.info('开始初始化微信模块...');
      
      // 确保依赖存在
      if (!app || !app.container || !app.Router) {
        throw new Error('应用实例缺少必要的属性: container 或 Router');
      }
      
      const container = app.container;
      
      // 注册仓库
      container.register('wechatRepository', new WechatRepository());
      logger.info('微信仓库注册成功');
      
      // 注册服务
      container.register('wechatService', new WechatService(container));
      logger.info('微信服务注册成功');
      
      // 注册控制器
      container.register('wechatController', new WechatController(container));
      logger.info('微信控制器注册成功');
      
      // 注册路由
      const wechatRoutes = new WechatRoutes(container);
      wechatRoutes.register(app);
      
      logger.info('微信模块初始化完成');
      
      return {
        name: 'wechat',
        status: 'initialized',
        routes: ['/api/admin/backend/wechat/*']
      };
    } catch (error) {
      logger.error('微信模块初始化失败:', error);
      throw error;
    }
  }
};

module.exports = wechatModule;