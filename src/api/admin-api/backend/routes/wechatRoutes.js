const authMiddleware = require('../../../middleware/auth');
const permissionMiddleware = require('../../../middleware/permission');
const logger = require('../../../core/logger');

class WechatRoutes {
  constructor(container) {
    this.logger = logger.getLogger('WechatRoutes');
    this.wechatController = container.get('wechatController');
  }

  /**
   * 注册微信相关路由
   * @param {Object} app - Express应用实例
   */
  register(app) {
    try {
      const router = app.Router();
      
      // 确保middleware存在
      if (!authMiddleware || !permissionMiddleware) {
        throw new Error('缺少必要的中间件: authMiddleware 或 permissionMiddleware');
      }

      // 设置权限检查中间件
      const requirePermission = permissionMiddleware(['ADMIN', 'SYSTEM_ADMIN']);

      // 公众号相关路由
      router.get('/official-accounts', authMiddleware, requirePermission, this.wechatController.getOfficialAccounts.bind(this.wechatController));
      router.get('/official-accounts/:id', authMiddleware, requirePermission, this.wechatController.getOfficialAccountDetail.bind(this.wechatController));
      router.post('/official-accounts', authMiddleware, requirePermission, this.wechatController.createOfficialAccount.bind(this.wechatController));
      router.put('/official-accounts/:id', authMiddleware, requirePermission, this.wechatController.updateOfficialAccount.bind(this.wechatController));
      router.delete('/official-accounts/:id', authMiddleware, requirePermission, this.wechatController.deleteOfficialAccount.bind(this.wechatController));
      router.post('/official-accounts/:id/test', authMiddleware, requirePermission, this.wechatController.testOfficialAccountConnection.bind(this.wechatController));
      
      // 公众号素材相关路由
      router.get('/official-accounts/:id/materials', authMiddleware, requirePermission, this.wechatController.getOfficialAccountMaterials.bind(this.wechatController));
      router.post('/official-accounts/:id/materials/image', authMiddleware, requirePermission, this.wechatController.uploadImageMaterial.bind(this.wechatController));
      router.post('/official-accounts/:id/materials/news', authMiddleware, requirePermission, this.wechatController.uploadNewsMaterial.bind(this.wechatController));
      router.delete('/official-accounts/:id/materials/:mediaId', authMiddleware, requirePermission, this.wechatController.deleteMaterial.bind(this.wechatController));
      
      // 企业微信相关路由
      router.get('/corp-wechat', authMiddleware, requirePermission, this.wechatController.getCorpWechatConfigs.bind(this.wechatController));
      router.get('/corp-wechat/:id', authMiddleware, requirePermission, this.wechatController.getCorpWechatDetail.bind(this.wechatController));
      router.post('/corp-wechat', authMiddleware, requirePermission, this.wechatController.createCorpWechat.bind(this.wechatController));
      router.put('/corp-wechat/:id', authMiddleware, requirePermission, this.wechatController.updateCorpWechat.bind(this.wechatController));
      router.delete('/corp-wechat/:id', authMiddleware, requirePermission, this.wechatController.deleteCorpWechat.bind(this.wechatController));
      router.post('/corp-wechat/:id/test', authMiddleware, requirePermission, this.wechatController.testCorpWechatConnection.bind(this.wechatController));
      
      // 企业微信组织架构相关路由
      router.get('/corp-wechat/:id/departments', authMiddleware, requirePermission, this.wechatController.getCorpWechatDepartments.bind(this.wechatController));
      router.get('/corp-wechat/:id/users', authMiddleware, requirePermission, this.wechatController.getCorpWechatUsers.bind(this.wechatController));
      router.post('/corp-wechat/:id/sync', authMiddleware, requirePermission, this.wechatController.syncCorpWechatData.bind(this.wechatController));

      // 注册到主应用
      app.use('/api/admin/backend/wechat', router);
      
      this.logger.info('微信相关路由注册成功');
    } catch (error) {
      this.logger.error('微信相关路由注册失败:', error);
      throw error;
    }
  }
}

module.exports = WechatRoutes;