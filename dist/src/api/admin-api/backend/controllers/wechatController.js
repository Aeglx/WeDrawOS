const { Controller } = require('../../../core');
const { inject } = require('../../../core/di');
const logger = require('../../../core/logger');

class WechatController extends Controller {
  constructor() {
    super();
    inject(this, 'wechatService');
    this.logger = logger.getLogger('WechatController');
  }

  /**
   * 获取公众号配置列表
   * @param {Request} req - Express请求对象
   * @param {Response} res - Express响应对象
   */
  async getOfficialAccounts(req, res) {
    try {
      const { page = 1, pageSize = 20 } = req.query;
      const accounts = await this.wechatService.getOfficialAccounts({ page, pageSize });
      this.success(res, accounts);
    } catch (error) {
      this.logger.error('获取公众号配置列表失败:', error);
      this.error(res, error.message, 500);
    }
  }

  /**
   * 获取公众号详情
   * @param {Request} req - Express请求对象
   * @param {Response} res - Express响应对象
   */
  async getOfficialAccountDetail(req, res) {
    try {
      const { id } = req.params;
      const account = await this.wechatService.getOfficialAccountDetail(id);
      this.success(res, account);
    } catch (error) {
      this.logger.error(`获取公众号详情失败 [ID: ${req.params.id}]:`, error);
      this.error(res, error.message, 500);
    }
  }

  /**
   * 创建公众号配置
   * @param {Request} req - Express请求对象
   * @param {Response} res - Express响应对象
   */
  async createOfficialAccount(req, res) {
    try {
      const accountData = req.body;
      const account = await this.wechatService.createOfficialAccount(accountData);
      this.success(res, { message: '公众号配置创建成功', data: account });
    } catch (error) {
      this.logger.error('创建公众号配置失败:', error);
      this.error(res, error.message, 500);
    }
  }

  /**
   * 更新公众号配置
   * @param {Request} req - Express请求对象
   * @param {Response} res - Express响应对象
   */
  async updateOfficialAccount(req, res) {
    try {
      const { id } = req.params;
      const accountData = req.body;
      await this.wechatService.updateOfficialAccount(id, accountData);
      this.success(res, { message: '公众号配置更新成功' });
    } catch (error) {
      this.logger.error(`更新公众号配置失败 [ID: ${req.params.id}]:`, error);
      this.error(res, error.message, 500);
    }
  }

  /**
   * 删除公众号配置
   * @param {Request} req - Express请求对象
   * @param {Response} res - Express响应对象
   */
  async deleteOfficialAccount(req, res) {
    try {
      const { id } = req.params;
      await this.wechatService.deleteOfficialAccount(id);
      this.success(res, { message: '公众号配置删除成功' });
    } catch (error) {
      this.logger.error(`删除公众号配置失败 [ID: ${req.params.id}]:`, error);
      this.error(res, error.message, 500);
    }
  }

  /**
   * 获取企业微信配置列表
   * @param {Request} req - Express请求对象
   * @param {Response} res - Express响应对象
   */
  async getCorpWechatConfigs(req, res) {
    try {
      const { page = 1, pageSize = 20 } = req.query;
      const configs = await this.wechatService.getCorpWechatConfigs({ page, pageSize });
      this.success(res, configs);
    } catch (error) {
      this.logger.error('获取企业微信配置列表失败:', error);
      this.error(res, error.message, 500);
    }
  }

  /**
   * 获取企业微信配置详情
   * @param {Request} req - Express请求对象
   * @param {Response} res - Express响应对象
   */
  async getCorpWechatDetail(req, res) {
    try {
      const { id } = req.params;
      const config = await this.wechatService.getCorpWechatDetail(id);
      this.success(res, config);
    } catch (error) {
      this.logger.error(`获取企业微信配置详情失败 [ID: ${req.params.id}]:`, error);
      this.error(res, error.message, 500);
    }
  }

  /**
   * 创建企业微信配置
   * @param {Request} req - Express请求对象
   * @param {Response} res - Express响应对象
   */
  async createCorpWechat(req, res) {
    try {
      const configData = req.body;
      const config = await this.wechatService.createCorpWechat(configData);
      this.success(res, { message: '企业微信配置创建成功', data: config });
    } catch (error) {
      this.logger.error('创建企业微信配置失败:', error);
      this.error(res, error.message, 500);
    }
  }

  /**
   * 更新企业微信配置
   * @param {Request} req - Express请求对象
   * @param {Response} res - Express响应对象
   */
  async updateCorpWechat(req, res) {
    try {
      const { id } = req.params;
      const configData = req.body;
      await this.wechatService.updateCorpWechat(id, configData);
      this.success(res, { message: '企业微信配置更新成功' });
    } catch (error) {
      this.logger.error(`更新企业微信配置失败 [ID: ${req.params.id}]:`, error);
      this.error(res, error.message, 500);
    }
  }

  /**
   * 删除企业微信配置
   * @param {Request} req - Express请求对象
   * @param {Response} res - Express响应对象
   */
  async deleteCorpWechat(req, res) {
    try {
      const { id } = req.params;
      await this.wechatService.deleteCorpWechat(id);
      this.success(res, { message: '企业微信配置删除成功' });
    } catch (error) {
      this.logger.error(`删除企业微信配置失败 [ID: ${req.params.id}]:`, error);
      this.error(res, error.message, 500);
    }
  }

  /**
   * 测试微信公众号连接
   * @param {Request} req - Express请求对象
   * @param {Response} res - Express响应对象
   */
  async testOfficialAccountConnection(req, res) {
    try {
      const { id } = req.params;
      const result = await this.wechatService.testOfficialAccountConnection(id);
      this.success(res, { message: '连接测试成功', data: result });
    } catch (error) {
      this.logger.error(`测试公众号连接失败 [ID: ${req.params.id}]:`, error);
      this.error(res, error.message, 500);
    }
  }

  /**
   * 测试企业微信连接
   * @param {Request} req - Express请求对象
   * @param {Response} res - Express响应对象
   */
  async testCorpWechatConnection(req, res) {
    try {
      const { id } = req.params;
      const result = await this.wechatService.testCorpWechatConnection(id);
      this.success(res, { message: '连接测试成功', data: result });
    } catch (error) {
      this.logger.error(`测试企业微信连接失败 [ID: ${req.params.id}]:`, error);
      this.error(res, error.message, 500);
    }
  }

  /**
   * 获取公众号素材列表
   * @param {Request} req - Express请求对象
   * @param {Response} res - Express响应对象
   */
  async getOfficialAccountMaterials(req, res) {
    try {
      const { accountId, type = 'news', page = 1, pageSize = 20 } = req.query;
      const materials = await this.wechatService.getOfficialAccountMaterials(accountId, { type, page, pageSize });
      this.success(res, materials);
    } catch (error) {
      this.logger.error('获取公众号素材列表失败:', error);
      this.error(res, error.message, 500);
    }
  }

  /**
   * 获取企业微信部门列表
   * @param {Request} req - Express请求对象
   * @param {Response} res - Express响应对象
   */
  async getCorpWechatDepartments(req, res) {
    try {
      const { configId } = req.query;
      const departments = await this.wechatService.getCorpWechatDepartments(configId);
      this.success(res, departments);
    } catch (error) {
      this.logger.error('获取企业微信部门列表失败:', error);
      this.error(res, error.message, 500);
    }
  }

  /**
   * 获取企业微信成员列表
   * @param {Request} req - Express请求对象
   * @param {Response} res - Express响应对象
   */
  async getCorpWechatUsers(req, res) {
    try {
      const { configId, departmentId = 1 } = req.query;
      const users = await this.wechatService.getCorpWechatUsers(configId, departmentId);
      this.success(res, users);
    } catch (error) {
      this.logger.error('获取企业微信成员列表失败:', error);
      this.error(res, error.message, 500);
    }
  }
}

module.exports = WechatController;