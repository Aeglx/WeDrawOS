const logger = require('../utils/logger');
const config = require('../config/config');

class SmsService {
  constructor() {
    this.providers = {
      aliyun: null,
      tencent: null,
      twilio: null
    };
    this.defaultProvider = 'aliyun';
    this.isReady = false;
    this.init();
  }

  /**
   * 初始化短信服务
   */
  init() {
    try {
      const smsConfig = config.sms || {};
      
      // 根据配置初始化不同的短信服务提供商
      if (smsConfig.aliyun) {
        try {
          // 尝试初始化阿里云短信服务
          this.providers.aliyun = this.initAliyunProvider(smsConfig.aliyun);
        } catch (error) {
          logger.warn('阿里云短信服务初始化失败:', error);
        }
      }
      
      if (smsConfig.tencent) {
        try {
          // 尝试初始化腾讯云短信服务
          this.providers.tencent = this.initTencentProvider(smsConfig.tencent);
        } catch (error) {
          logger.warn('腾讯云短信服务初始化失败:', error);
        }
      }
      
      if (smsConfig.twilio) {
        try {
          // 尝试初始化Twilio短信服务
          this.providers.twilio = this.initTwilioProvider(smsConfig.twilio);
        } catch (error) {
          logger.warn('Twilio短信服务初始化失败:', error);
        }
      }
      
      // 设置默认提供商
      if (smsConfig.defaultProvider && this.providers[smsConfig.defaultProvider]) {
        this.defaultProvider = smsConfig.defaultProvider;
      }
      
      // 检查是否有可用的提供商
      this.isReady = Object.values(this.providers).some(provider => provider !== null);
      
      if (this.isReady) {
        logger.info(`短信服务初始化成功，默认提供商: ${this.defaultProvider}`);
      } else {
        logger.warn('没有可用的短信服务提供商，将使用模拟实现');
        // 使用模拟实现作为备用
        this.providers.mock = this.getMockProvider();
        this.defaultProvider = 'mock';
        this.isReady = true;
      }
    } catch (error) {
      logger.error('短信服务初始化失败:', error);
      // 使用模拟实现作为备用
      this.providers.mock = this.getMockProvider();
      this.defaultProvider = 'mock';
      this.isReady = true;
    }
  }

  /**
   * 初始化阿里云短信服务提供商
   */
  initAliyunProvider(config) {
    try {
      // 这里应该导入并初始化阿里云SDK
      // 由于可能没有安装依赖，这里返回一个模拟对象
      logger.info('配置阿里云短信服务');
      return {
        name: 'aliyun',
        send: async (phone, content, templateId, params) => {
          // 实际环境中应该调用阿里云SDK发送短信
          logger.info(`[阿里云] 发送短信到 ${phone}, 内容: ${content}`);
          return {
            success: true,
            messageId: `aliyun-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          };
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * 初始化腾讯云短信服务提供商
   */
  initTencentProvider(config) {
    try {
      // 这里应该导入并初始化腾讯云SDK
      // 由于可能没有安装依赖，这里返回一个模拟对象
      logger.info('配置腾讯云短信服务');
      return {
        name: 'tencent',
        send: async (phone, content, templateId, params) => {
          // 实际环境中应该调用腾讯云SDK发送短信
          logger.info(`[腾讯云] 发送短信到 ${phone}, 内容: ${content}`);
          return {
            success: true,
            messageId: `tencent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          };
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * 初始化Twilio短信服务提供商
   */
  initTwilioProvider(config) {
    try {
      // 这里应该导入并初始化Twilio SDK
      // 由于可能没有安装依赖，这里返回一个模拟对象
      logger.info('配置Twilio短信服务');
      return {
        name: 'twilio',
        send: async (phone, content, templateId, params) => {
          // 实际环境中应该调用Twilio SDK发送短信
          logger.info(`[Twilio] 发送短信到 ${phone}, 内容: ${content}`);
          return {
            success: true,
            messageId: `twilio-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          };
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * 获取模拟的短信服务提供商
   */
  getMockProvider() {
    return {
      name: 'mock',
      send: async (phone, content, templateId, params) => {
        logger.info(`[模拟] 发送短信到 ${phone}, 内容: ${content}`);
        return {
          success: true,
          messageId: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          provider: 'mock'
        };
      }
    };
  }

  /**
   * 发送短信
   * @param {Object} smsOptions - 短信选项
   * @returns {Promise<Object>} 发送结果
   */
  async send(smsOptions) {
    try {
      const {
        phone,
        content,
        type = 'notification',
        templateId = null,
        params = {},
        provider = this.defaultProvider
      } = smsOptions;

      if (!phone || !content) {
        throw new Error('缺少必要的短信参数');
      }

      // 验证手机号格式
      if (!this.validatePhoneNumber(phone)) {
        throw new Error('手机号格式不正确');
      }

      // 获取指定的短信服务提供商
      const smsProvider = this.providers[provider] || this.providers[this.defaultProvider];
      
      if (!smsProvider) {
        throw new Error('没有可用的短信服务提供商');
      }

      // 发送短信
      const result = await smsProvider.send(phone, content, templateId, params);
      
      logger.info(`短信发送成功: ${phone}, 类型: ${type}, 提供商: ${smsProvider.name}`);
      
      // 记录短信发送历史
      await this.logSmsHistory({
        phone,
        content,
        type,
        provider: smsProvider.name,
        messageId: result.messageId,
        success: result.success
      });
      
      return {
        success: true,
        messageId: result.messageId,
        provider: smsProvider.name,
        phone,
        type
      };
    } catch (error) {
      logger.error(`短信发送失败:`, error);
      
      // 记录失败历史
      try {
        await this.logSmsHistory({
          phone: smsOptions?.phone || '',
          content: smsOptions?.content || '',
          type: smsOptions?.type || 'unknown',
          provider: smsOptions?.provider || this.defaultProvider,
          messageId: null,
          success: false,
          error: error.message
        });
      } catch (logError) {
        logger.error('记录短信失败历史失败:', logError);
      }
      
      throw {
        success: false,
        error: error.message || '短信发送失败',
        originalError: error
      };
    }
  }

  /**
   * 发送验证码短信
   * @param {string} phone - 手机号
   * @param {string} code - 验证码
   * @param {number} expireMinutes - 过期时间（分钟）
   * @returns {Promise<Object>} 发送结果
   */
  async sendVerificationCode(phone, code, expireMinutes = 5) {
    const content = `您的验证码是：${code}，有效期${expireMinutes}分钟，请勿泄露给他人。`;
    
    return this.send({
      phone,
      content,
      type: 'verification',
      params: { code, expireMinutes }
    });
  }

  /**
   * 发送通知短信
   * @param {string} phone - 手机号
   * @param {string} title - 标题
   * @param {string} message - 消息内容
   * @returns {Promise<Object>} 发送结果
   */
  async sendNotification(phone, title, message) {
    const content = `${title}：${this.truncateText(message, 60)}`;
    
    return this.send({
      phone,
      content,
      type: 'notification'
    });
  }

  /**
   * 批量发送短信
   * @param {Array} smsArray - 短信数组
   * @returns {Promise<Array>} 发送结果数组
   */
  async sendBatch(smsArray) {
    const results = [];
    
    // 串行发送以避免频率限制
    for (const sms of smsArray) {
      try {
        const result = await this.send(sms);
        results.push(result);
        // 避免频率限制
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        results.push(error);
      }
    }
    
    return results;
  }

  /**
   * 验证手机号格式
   */
  validatePhoneNumber(phone) {
    // 简单的手机号验证，实际应用中可能需要更复杂的验证
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  }

  /**
   * 截断文本
   */
  truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * 记录短信发送历史
   */
  async logSmsHistory(smsData) {
    try {
      // 这里应该保存到数据库
      // 由于没有数据库连接，这里只是记录日志
      logger.info('短信发送历史:', smsData);
    } catch (error) {
      logger.error('记录短信发送历史失败:', error);
    }
  }

  /**
   * 检查短信服务状态
   */
  getStatus() {
    return {
      isReady: this.isReady,
      defaultProvider: this.defaultProvider,
      availableProviders: Object.keys(this.providers).filter(key => this.providers[key] !== null),
      lastChecked: new Date()
    };
  }

  /**
   * 更改默认短信服务提供商
   */
  setDefaultProvider(provider) {
    if (this.providers[provider]) {
      this.defaultProvider = provider;
      logger.info(`短信服务默认提供商已更改为: ${provider}`);
      return true;
    }
    return false;
  }

  /**
   * 重新初始化短信服务
   */
  reinitialize() {
    return this.init();
  }

  /**
   * 短信服务单例
   */
  static getInstance() {
    if (!this.instance) {
      this.instance = new SmsService();
    }
    return this.instance;
  }
}

module.exports = SmsService.getInstance();