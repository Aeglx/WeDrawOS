const { Service } = require('../../../core');
const { inject } = require('../../../core/di');
const logger = require('../../../core/logger');
const cache = require('../../../core/cache');

class WechatService extends Service {
  constructor() {
    super();
    inject(this, 'wechatRepository');
    this.logger = logger.getLogger('WechatService');
    this.cacheTTL = 3600; // 缓存1小时
  }

  /**
   * 获取公众号配置列表
   * @param {Object} params - 查询参数
   * @returns {Promise<Object>} 公众号配置列表
   */
  async getOfficialAccounts({ page, pageSize }) {
    try {
      return await this.wechatRepository.getOfficialAccounts({ page, pageSize });
    } catch (error) {
      this.logger.error('获取公众号配置列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取公众号详情
   * @param {string} id - 公众号ID
   * @returns {Promise<Object>} 公众号详情
   */
  async getOfficialAccountDetail(id) {
    try {
      return await this.wechatRepository.getOfficialAccountDetail(id);
    } catch (error) {
      this.logger.error(`获取公众号详情失败 [ID: ${id}]:`, error);
      throw error;
    }
  }

  /**
   * 创建公众号配置
   * @param {Object} accountData - 公众号配置数据
   * @returns {Promise<Object>} 创建的公众号配置
   */
  async createOfficialAccount(accountData) {
    try {
      // 验证数据
      this._validateOfficialAccountData(accountData);
      
      const account = await this.wechatRepository.createOfficialAccount(accountData);
      
      // 清除相关缓存
      await cache.delByPattern('wechat:official:accounts:*');
      
      return account;
    } catch (error) {
      this.logger.error('创建公众号配置失败:', error);
      throw error;
    }
  }

  /**
   * 更新公众号配置
   * @param {string} id - 公众号ID
   * @param {Object} accountData - 公众号配置数据
   */
  async updateOfficialAccount(id, accountData) {
    try {
      // 验证数据
      this._validateOfficialAccountData(accountData);
      
      await this.wechatRepository.updateOfficialAccount(id, accountData);
      
      // 清除相关缓存
      await cache.delByPattern('wechat:official:accounts:*');
      await cache.del(`wechat:official:account:${id}`);
    } catch (error) {
      this.logger.error(`更新公众号配置失败 [ID: ${id}]:`, error);
      throw error;
    }
  }

  /**
   * 删除公众号配置
   * @param {string} id - 公众号ID
   */
  async deleteOfficialAccount(id) {
    try {
      await this.wechatRepository.deleteOfficialAccount(id);
      
      // 清除相关缓存
      await cache.delByPattern('wechat:official:accounts:*');
      await cache.del(`wechat:official:account:${id}`);
    } catch (error) {
      this.logger.error(`删除公众号配置失败 [ID: ${id}]:`, error);
      throw error;
    }
  }

  /**
   * 获取企业微信配置列表
   * @param {Object} params - 查询参数
   * @returns {Promise<Object>} 企业微信配置列表
   */
  async getCorpWechatConfigs({ page, pageSize }) {
    try {
      return await this.wechatRepository.getCorpWechatConfigs({ page, pageSize });
    } catch (error) {
      this.logger.error('获取企业微信配置列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取企业微信配置详情
   * @param {string} id - 企业微信配置ID
   * @returns {Promise<Object>} 企业微信配置详情
   */
  async getCorpWechatDetail(id) {
    try {
      return await this.wechatRepository.getCorpWechatDetail(id);
    } catch (error) {
      this.logger.error(`获取企业微信配置详情失败 [ID: ${id}]:`, error);
      throw error;
    }
  }

  /**
   * 创建企业微信配置
   * @param {Object} configData - 企业微信配置数据
   * @returns {Promise<Object>} 创建的企业微信配置
   */
  async createCorpWechat(configData) {
    try {
      // 验证数据
      this._validateCorpWechatData(configData);
      
      const config = await this.wechatRepository.createCorpWechat(configData);
      
      // 清除相关缓存
      await cache.delByPattern('wechat:corp:configs:*');
      
      return config;
    } catch (error) {
      this.logger.error('创建企业微信配置失败:', error);
      throw error;
    }
  }

  /**
   * 更新企业微信配置
   * @param {string} id - 企业微信配置ID
   * @param {Object} configData - 企业微信配置数据
   */
  async updateCorpWechat(id, configData) {
    try {
      // 验证数据
      this._validateCorpWechatData(configData);
      
      await this.wechatRepository.updateCorpWechat(id, configData);
      
      // 清除相关缓存
      await cache.delByPattern('wechat:corp:configs:*');
      await cache.del(`wechat:corp:config:${id}`);
    } catch (error) {
      this.logger.error(`更新企业微信配置失败 [ID: ${id}]:`, error);
      throw error;
    }
  }

  /**
   * 删除企业微信配置
   * @param {string} id - 企业微信配置ID
   */
  async deleteCorpWechat(id) {
    try {
      await this.wechatRepository.deleteCorpWechat(id);
      
      // 清除相关缓存
      await cache.delByPattern('wechat:corp:configs:*');
      await cache.del(`wechat:corp:config:${id}`);
    } catch (error) {
      this.logger.error(`删除企业微信配置失败 [ID: ${id}]:`, error);
      throw error;
    }
  }

  /**
   * 测试微信公众号连接
   * @param {string} id - 公众号ID
   * @returns {Promise<Object>} 测试结果
   */
  async testOfficialAccountConnection(id) {
    try {
      const account = await this.getOfficialAccountDetail(id);
      
      // 模拟连接测试
      // 在实际应用中，这里应该调用微信API进行连接测试
      const result = {
        connected: true,
        accessToken: 'mock_access_token_' + Date.now(),
        timestamp: new Date().toISOString(),
        expiresIn: 7200
      };
      
      return result;
    } catch (error) {
      this.logger.error(`测试公众号连接失败 [ID: ${id}]:`, error);
      throw error;
    }
  }

  /**
   * 测试企业微信连接
   * @param {string} id - 企业微信配置ID
   * @returns {Promise<Object>} 测试结果
   */
  async testCorpWechatConnection(id) {
    try {
      const config = await this.getCorpWechatDetail(id);
      
      // 模拟连接测试
      // 在实际应用中，这里应该调用企业微信API进行连接测试
      const result = {
        connected: true,
        accessToken: 'mock_corp_access_token_' + Date.now(),
        timestamp: new Date().toISOString(),
        expiresIn: 7200
      };
      
      return result;
    } catch (error) {
      this.logger.error(`测试企业微信连接失败 [ID: ${id}]:`, error);
      throw error;
    }
  }

  /**
   * 获取公众号素材列表
   * @param {string} accountId - 公众号ID
   * @param {Object} params - 查询参数
   * @returns {Promise<Object>} 素材列表
   */
  async getOfficialAccountMaterials(accountId, { type, page, pageSize }) {
    try {
      // 验证公众号存在
      await this.getOfficialAccountDetail(accountId);
      
      // 模拟获取素材列表
      // 在实际应用中，这里应该调用微信API获取素材列表
      return await this.wechatRepository.getOfficialAccountMaterials(accountId, { type, page, pageSize });
    } catch (error) {
      this.logger.error('获取公众号素材列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取企业微信部门列表
   * @param {string} configId - 企业微信配置ID
   * @returns {Promise<Array>} 部门列表
   */
  async getCorpWechatDepartments(configId) {
    try {
      // 验证配置存在
      await this.getCorpWechatDetail(configId);
      
      // 模拟获取部门列表
      // 在实际应用中，这里应该调用企业微信API获取部门列表
      return await this.wechatRepository.getCorpWechatDepartments(configId);
    } catch (error) {
      this.logger.error('获取企业微信部门列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取企业微信成员列表
   * @param {string} configId - 企业微信配置ID
   * @param {string} departmentId - 部门ID
   * @returns {Promise<Array>} 成员列表
   */
  async getCorpWechatUsers(configId, departmentId) {
    try {
      // 验证配置存在
      await this.getCorpWechatDetail(configId);
      
      // 模拟获取成员列表
      // 在实际应用中，这里应该调用企业微信API获取成员列表
      return await this.wechatRepository.getCorpWechatUsers(configId, departmentId);
    } catch (error) {
      this.logger.error('获取企业微信成员列表失败:', error);
      throw error;
    }
  }

  // 辅助方法：验证公众号配置数据
  _validateOfficialAccountData(data) {
    if (!data.appId || !data.appSecret) {
      throw new Error('公众号AppID和AppSecret不能为空');
    }
    
    if (!data.name || !data.originalId) {
      throw new Error('公众号名称和原始ID不能为空');
    }
  }

  // 辅助方法：验证企业微信配置数据
  _validateCorpWechatData(data) {
    if (!data.corpId || !data.corpSecret) {
      throw new Error('企业微信CorpID和CorpSecret不能为空');
    }
    
    if (!data.agentId) {
      throw new Error('企业微信应用ID不能为空');
    }
  }
}

module.exports = WechatService;