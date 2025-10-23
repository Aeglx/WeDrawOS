/**
 * 公众号管理模块入口
 * 整合公众号管理相关组件，提供模块初始化功能
 */

const accountController = require('./controllers/accountController');
const userController = require('./controllers/userController');
const materialController = require('./controllers/materialController');
const templateController = require('./controllers/templateController');
const subscriptionController = require('./controllers/subscriptionController');
const conversationController = require('./controllers/conversationController');
const menuController = require('./controllers/menuController');

const accountService = require('./services/accountService');
const userService = require('./services/userService');
const materialService = require('./services/materialService');
const templateService = require('./services/templateService');
const subscriptionService = require('./services/subscriptionService');
const conversationService = require('./services/conversationService');
const menuService = require('./services/menuService');

const accountRepository = require('./repositories/accountRepository');
const userRepository = require('./repositories/userRepository');
const materialRepository = require('./repositories/materialRepository');
const templateRepository = require('./repositories/templateRepository');
const subscriptionRepository = require('./repositories/subscriptionRepository');
const conversationRepository = require('./repositories/conversationRepository');
const menuRepository = require('./repositories/menuRepository');

const wechatRoutes = require('./routes/wechatRoutes');
const { container } = require('../../../core/di/dependencyInjector');
const logger = require('../../../core/logger');

/**
 * 初始化公众号管理模块
 * @param {Object} app - Express应用实例
 */
function initialize(app) {
  try {
    // 注册服务到依赖注入容器
    // 仓库层
    container.register('accountRepository', accountRepository);
    container.register('userRepository', userRepository);
    container.register('materialRepository', materialRepository);
    container.register('templateRepository', templateRepository);
    container.register('subscriptionRepository', subscriptionRepository);
    container.register('conversationRepository', conversationRepository);
    container.register('menuRepository', menuRepository);
    
    // 服务层
    container.register('accountService', accountService);
    container.register('userService', userService);
    container.register('materialService', materialService);
    container.register('templateService', templateService);
    container.register('subscriptionService', subscriptionService);
    container.register('conversationService', conversationService);
    container.register('menuService', menuService);
    
    // 控制器层
    container.register('accountController', accountController);
    container.register('userController', userController);
    container.register('materialController', materialController);
    container.register('templateController', templateController);
    container.register('subscriptionController', subscriptionController);
    container.register('conversationController', conversationController);
    container.register('menuController', menuController);
    
    // 注册路由
    wechatRoutes.register(app);
    
    logger.info('公众号管理模块初始化完成');
  } catch (error) {
    logger.error('公众号管理模块初始化失败:', error);
    throw error;
  }
}

// 导出模块配置
module.exports = {
  initialize,
  controllers: {
    accountController,
    userController,
    materialController,
    templateController,
    subscriptionController,
    conversationController,
    menuController
  },
  services: {
    accountService,
    userService,
    materialService,
    templateService,
    subscriptionService,
    conversationService,
    menuService
  },
  repositories: {
    accountRepository,
    userRepository,
    materialRepository,
    templateRepository,
    subscriptionRepository,
    conversationRepository,
    menuRepository
  },
  routes: wechatRoutes
};