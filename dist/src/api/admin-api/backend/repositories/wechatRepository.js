const { BaseRepository } = require('../../../core');
const logger = require('../../../core/logger');

class WechatRepository extends BaseRepository {
  constructor() {
    super();
    this.logger = logger.getLogger('WechatRepository');
    
    // 模拟数据存储
    this.officialAccounts = this._generateMockOfficialAccounts();
    this.corpWechatConfigs = this._generateMockCorpWechatConfigs();
  }

  /**
   * 获取公众号配置列表
   * @param {Object} params - 查询参数
   * @returns {Promise<Object>} 公众号配置列表
   */
  async getOfficialAccounts({ page, pageSize }) {
    try {
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const paginated = this.officialAccounts.slice(start, end);
      
      return {
        list: paginated,
        pagination: {
          total: this.officialAccounts.length,
          page,
          pageSize,
          totalPages: Math.ceil(this.officialAccounts.length / pageSize)
        }
      };
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
      const account = this.officialAccounts.find(a => a.id === id);
      if (!account) {
        throw new Error('公众号配置不存在');
      }
      return account;
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
      const newAccount = {
        id: `wx-account-${Date.now()}`,
        ...accountData,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'active'
      };
      
      this.officialAccounts.unshift(newAccount);
      return newAccount;
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
      const index = this.officialAccounts.findIndex(a => a.id === id);
      if (index === -1) {
        throw new Error('公众号配置不存在');
      }
      
      this.officialAccounts[index] = {
        ...this.officialAccounts[index],
        ...accountData,
        updatedAt: new Date()
      };
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
      const index = this.officialAccounts.findIndex(a => a.id === id);
      if (index === -1) {
        throw new Error('公众号配置不存在');
      }
      
      this.officialAccounts.splice(index, 1);
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
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const paginated = this.corpWechatConfigs.slice(start, end);
      
      return {
        list: paginated,
        pagination: {
          total: this.corpWechatConfigs.length,
          page,
          pageSize,
          totalPages: Math.ceil(this.corpWechatConfigs.length / pageSize)
        }
      };
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
      const config = this.corpWechatConfigs.find(c => c.id === id);
      if (!config) {
        throw new Error('企业微信配置不存在');
      }
      return config;
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
      const newConfig = {
        id: `wx-corp-${Date.now()}`,
        ...configData,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'active'
      };
      
      this.corpWechatConfigs.unshift(newConfig);
      return newConfig;
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
      const index = this.corpWechatConfigs.findIndex(c => c.id === id);
      if (index === -1) {
        throw new Error('企业微信配置不存在');
      }
      
      this.corpWechatConfigs[index] = {
        ...this.corpWechatConfigs[index],
        ...configData,
        updatedAt: new Date()
      };
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
      const index = this.corpWechatConfigs.findIndex(c => c.id === id);
      if (index === -1) {
        throw new Error('企业微信配置不存在');
      }
      
      this.corpWechatConfigs.splice(index, 1);
    } catch (error) {
      this.logger.error(`删除企业微信配置失败 [ID: ${id}]:`, error);
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
      // 模拟素材数据
      const materials = this._generateMockMaterials(type, 50);
      
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const paginated = materials.slice(start, end);
      
      return {
        list: paginated,
        pagination: {
          total: materials.length,
          page,
          pageSize,
          totalPages: Math.ceil(materials.length / pageSize)
        }
      };
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
      // 模拟部门数据
      return [
        { id: 1, name: '总公司', parentid: 0 },
        { id: 2, name: '技术部', parentid: 1 },
        { id: 3, name: '市场部', parentid: 1 },
        { id: 4, name: '财务部', parentid: 1 },
        { id: 5, name: '研发组', parentid: 2 },
        { id: 6, name: '测试组', parentid: 2 }
      ];
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
      // 模拟成员数据
      const users = [];
      const departmentNames = {
        '1': '总公司',
        '2': '技术部',
        '3': '市场部',
        '4': '财务部',
        '5': '研发组',
        '6': '测试组'
      };
      
      for (let i = 1; i <= 10; i++) {
        users.push({
          userid: `user${i}`,
          name: `用户${i}`,
          department: [parseInt(departmentId)],
          position: `${departmentNames[departmentId]}${i % 3 === 0 ? '经理' : i % 3 === 1 ? '主管' : '专员'}`,
          mobile: `1380013800${i}`,
          email: `user${i}@example.com`,
          enable: true
        });
      }
      
      return users;
    } catch (error) {
      this.logger.error('获取企业微信成员列表失败:', error);
      throw error;
    }
  }

  // 辅助方法：生成模拟公众号数据
  _generateMockOfficialAccounts() {
    return [
      {
        id: 'wx-account-1',
        name: '测试公众号1',
        originalId: 'gh_123456789012',
        appId: 'wx1234567890123456',
        appSecret: 'abcdef1234567890abcdef1234567890ab',
        token: 'test_token_1',
        encodingAESKey: 'test_encoding_aes_key_1',
        type: 'service',
        status: 'active',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        id: 'wx-account-2',
        name: '测试公众号2',
        originalId: 'gh_234567890123',
        appId: 'wx2345678901234567',
        appSecret: 'bcdef1234567890abcdef1234567890abc',
        token: 'test_token_2',
        encodingAESKey: 'test_encoding_aes_key_2',
        type: 'subscription',
        status: 'active',
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02')
      },
      {
        id: 'wx-account-3',
        name: '测试公众号3',
        originalId: 'gh_345678901234',
        appId: 'wx3456789012345678',
        appSecret: 'cdef1234567890abcdef1234567890abcd',
        token: 'test_token_3',
        encodingAESKey: 'test_encoding_aes_key_3',
        type: 'service',
        status: 'inactive',
        createdAt: new Date('2024-01-03'),
        updatedAt: new Date('2024-01-03')
      }
    ];
  }

  // 辅助方法：生成模拟企业微信配置数据
  _generateMockCorpWechatConfigs() {
    return [
      {
        id: 'wx-corp-1',
        name: '测试企业微信1',
        corpId: 'ww1234567890123456',
        corpSecret: 'abcdef1234567890abcdef1234567890ab',
        agentId: '1000001',
        token: 'test_corp_token_1',
        encodingAESKey: 'test_corp_encoding_aes_key_1',
        status: 'active',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        id: 'wx-corp-2',
        name: '测试企业微信2',
        corpId: 'ww2345678901234567',
        corpSecret: 'bcdef1234567890abcdef1234567890abc',
        agentId: '1000002',
        token: 'test_corp_token_2',
        encodingAESKey: 'test_corp_encoding_aes_key_2',
        status: 'active',
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02')
      }
    ];
  }

  // 辅助方法：生成模拟素材数据
  _generateMockMaterials(type, count) {
    const materials = [];
    const now = new Date();
    
    for (let i = 1; i <= count; i++) {
      let material;
      
      switch (type) {
        case 'news':
          material = {
            mediaId: `news_media_${i}`,
            title: `图文素材标题${i}`,
            author: '管理员',
            digest: `这是图文素材摘要内容${i}`,
            content: `<p>这是图文素材详细内容${i}</p>`,
            thumbMediaId: `thumb_${i}`,
            url: `https://example.com/news/${i}`,
            updateTime: new Date(now - i * 24 * 60 * 60 * 1000).getTime()
          };
          break;
        case 'image':
          material = {
            mediaId: `image_media_${i}`,
            name: `图片素材${i}.jpg`,
            url: `https://example.com/images/${i}.jpg`,
            updateTime: new Date(now - i * 24 * 60 * 60 * 1000).getTime()
          };
          break;
        case 'voice':
          material = {
            mediaId: `voice_media_${i}`,
            name: `语音素材${i}.mp3`,
            format: 'mp3',
            updateTime: new Date(now - i * 24 * 60 * 60 * 1000).getTime()
          };
          break;
        case 'video':
          material = {
            mediaId: `video_media_${i}`,
            name: `视频素材${i}.mp4`,
            description: `视频素材描述${i}`,
            updateTime: new Date(now - i * 24 * 60 * 60 * 1000).getTime()
          };
          break;
        default:
          material = {
            mediaId: `material_${i}`,
            title: `素材标题${i}`,
            updateTime: new Date(now - i * 24 * 60 * 60 * 1000).getTime()
          };
      }
      
      materials.push(material);
    }
    
    // 按更新时间倒序排序
    materials.sort((a, b) => b.updateTime - a.updateTime);
    
    return materials;
  }
}

module.exports = WechatRepository;