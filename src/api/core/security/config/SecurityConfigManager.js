/**
 * 安全配置管理器
 * 负责管理和维护应用程序的安全配置、策略和密钥
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const logger = require('../../utils/logger');
const { AppError } = require('../../exception/handlers/errorHandler');
const { encryptionUtils } = require('../../utils/encryption/EncryptionUtils');

/**
 * 安全配置管理器
 */
class SecurityConfigManager {
  constructor() {
    this.logger = logger;
    this.config = {
      // 默认安全配置
      jwt: {
        secret: null,
        expiresIn: '24h',
        algorithm: 'HS256',
        refreshTokenExpiresIn: '7d'
      },
      password: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
        maxFailedAttempts: 5,
        lockoutDuration: 30 * 60 * 1000 // 30分钟
      },
      session: {
        cookie: {
          httpOnly: true,
          secure: true,
          sameSite: 'strict',
          maxAge: 24 * 60 * 60 * 1000 // 24小时
        },
        secret: null
      },
      cors: {
        origin: [],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
        maxAge: 86400
      },
      rateLimiting: {
        enabled: true,
        windowMs: 15 * 60 * 1000, // 15分钟
        maxRequests: 100,
        trustProxy: false,
        whitelist: []
      },
      dataProtection: {
        encryptionAlgorithm: 'aes-256-cbc',
        sensitiveFields: [
          'password', 'creditCard', 'socialSecurityNumber',
          'bankAccount', 'accessToken', 'refreshToken'
        ],
        maskSensitiveData: true
      },
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'Content-Security-Policy': "default-src 'self'",
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      },
      api: {
        requireAuth: true,
        authExemptPaths: ['/api/public', '/api/auth/login', '/api/auth/register'],
        requestTimeout: 30000 // 30秒
      }
    };
    
    this.secrets = new Map();
    this.encryptionKey = null;
    this.keyRotationSchedule = null;
    
    this.logger.info('安全配置管理器初始化');
  }

  /**
   * 初始化安全配置
   * @param {Object} customConfig - 自定义配置
   * @param {string} encryptionKeyPath - 加密密钥文件路径
   * @returns {Promise<void>}
   */
  async initialize(customConfig = {}, encryptionKeyPath = null) {
    try {
      // 合并自定义配置
      this._mergeConfig(customConfig);
      
      // 加载或生成加密密钥
      await this._initializeEncryptionKey(encryptionKeyPath);
      
      // 生成或加载JWT密钥
      await this._initializeJwtSecret();
      
      // 生成或加载Session密钥
      await this._initializeSessionSecret();
      
      // 验证配置有效性
      this._validateConfig();
      
      // 启动密钥轮换（如果配置了）
      if (this.config.keyRotation?.enabled) {
        this._startKeyRotation();
      }
      
      this.logger.info('安全配置初始化完成');
    } catch (error) {
      this.logger.error('安全配置初始化失败', { error });
      throw new AppError('安全配置初始化失败', 500, error);
    }
  }

  /**
   * 获取完整配置
   * @returns {Object} 安全配置
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * 获取特定部分的配置
   * @param {string} section - 配置部分名称
   * @returns {Object} 配置部分
   */
  getSection(section) {
    if (!this.config[section]) {
      throw new Error(`配置部分 ${section} 不存在`);
    }
    return { ...this.config[section] };
  }

  /**
   * 更新配置
   * @param {string} section - 配置部分
   * @param {Object} newConfig - 新配置
   */
  updateConfig(section, newConfig) {
    if (!this.config[section]) {
      throw new Error(`配置部分 ${section} 不存在`);
    }
    
    this.config[section] = {
      ...this.config[section],
      ...newConfig
    };
    
    // 验证更新后的配置
    this._validateConfig();
    
    this.logger.info(`已更新配置部分: ${section}`, { 
      updatedFields: Object.keys(newConfig) 
    });
  }

  /**
   * 添加CORS允许的源
   * @param {string|Array<string>} origins - 源地址
   */
  addCorsOrigin(origins) {
    const originsArray = Array.isArray(origins) ? origins : [origins];
    
    originsArray.forEach(origin => {
      if (!this.config.cors.origin.includes(origin)) {
        this.config.cors.origin.push(origin);
      }
    });
    
    this.logger.info('已添加CORS允许的源', { origins: originsArray });
  }

  /**
   * 添加API认证豁免路径
   * @param {string|Array<string>} paths - 路径
   */
  addAuthExemptPath(paths) {
    const pathsArray = Array.isArray(paths) ? paths : [paths];
    
    pathsArray.forEach(path => {
      if (!this.config.api.authExemptPaths.includes(path)) {
        this.config.api.authExemptPaths.push(path);
      }
    });
    
    this.logger.info('已添加API认证豁免路径', { paths: pathsArray });
  }

  /**
   * 检查路径是否需要认证
   * @param {string} path - API路径
   * @returns {boolean} 是否需要认证
   */
  isAuthRequired(path) {
    if (!this.config.api.requireAuth) {
      return false;
    }
    
    // 检查是否在豁免列表中
    return !this.config.api.authExemptPaths.some(exemptPath => {
      if (exemptPath.endsWith('*')) {
        // 支持通配符路径
        const prefix = exemptPath.slice(0, -1);
        return path.startsWith(prefix);
      }
      return path === exemptPath;
    });
  }

  /**
   * 获取密码策略
   * @returns {Object} 密码策略
   */
  getPasswordPolicy() {
    return {
      minLength: this.config.password.minLength,
      requireUppercase: this.config.password.requireUppercase,
      requireLowercase: this.config.password.requireLowercase,
      requireNumbers: this.config.password.requireNumbers,
      requireSpecialChars: this.config.password.requireSpecialChars,
      specialChars: this.config.password.specialChars
    };
  }

  /**
   * 验证密码强度
   * @param {string} password - 密码
   * @returns {Object} 验证结果 { isValid: boolean, errors: Array }
   */
  validatePasswordStrength(password) {
    const errors = [];
    const policy = this.getPasswordPolicy();
    
    if (!password || password.length < policy.minLength) {
      errors.push(`密码长度必须至少为 ${policy.minLength} 个字符`);
    }
    
    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('密码必须包含至少一个大写字母');
    }
    
    if (policy.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('密码必须包含至少一个小写字母');
    }
    
    if (policy.requireNumbers && !/[0-9]/.test(password)) {
      errors.push('密码必须包含至少一个数字');
    }
    
    if (policy.requireSpecialChars && !new RegExp(`[${policy.specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`).test(password)) {
      errors.push('密码必须包含至少一个特殊字符');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      strength: this._calculatePasswordStrength(password)
    };
  }

  /**
   * 获取JWT配置
   * @returns {Object} JWT配置
   */
  getJwtConfig() {
    return {
      secret: this.config.jwt.secret,
      expiresIn: this.config.jwt.expiresIn,
      algorithm: this.config.jwt.algorithm,
      refreshTokenExpiresIn: this.config.jwt.refreshTokenExpiresIn
    };
  }

  /**
   * 获取CORS配置
   * @returns {Object} CORS配置
   */
  getCorsConfig() {
    return { ...this.config.cors };
  }

  /**
   * 获取安全响应头配置
   * @returns {Object} 响应头配置
   */
  getSecurityHeaders() {
    return { ...this.config.headers };
  }

  /**
   * 加密敏感配置值
   * @param {string} value - 要加密的值
   * @returns {string} 加密后的值
   */
  encryptConfigValue(value) {
    if (!this.encryptionKey) {
      throw new Error('加密密钥未初始化');
    }
    
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey, iv);
    
    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return `${iv.toString('hex')}:${encrypted}`;
  }

  /**
   * 解密敏感配置值
   * @param {string} encryptedValue - 加密后的值
   * @returns {string} 解密后的值
   */
  decryptConfigValue(encryptedValue) {
    if (!this.encryptionKey) {
      throw new Error('解密密钥未初始化');
    }
    
    const [ivHex, encryptedHex] = encryptedValue.split(':');
    if (!ivHex || !encryptedHex) {
      throw new Error('无效的加密值格式');
    }
    
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', this.encryptionKey, iv);
    
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * 注册敏感密钥
   * @param {string} keyName - 密钥名称
   * @param {string|Buffer} keyValue - 密钥值
   * @param {boolean} encrypt - 是否加密存储
   */
  registerSecret(keyName, keyValue, encrypt = true) {
    if (encrypt && this.encryptionKey) {
      // 加密密钥后存储
      const encryptedKey = this.encryptConfigValue(keyValue.toString());
      this.secrets.set(keyName, encryptedKey);
    } else {
      // 直接存储
      this.secrets.set(keyName, keyValue);
    }
    
    this.logger.debug(`已注册密钥: ${keyName}`);
  }

  /**
   * 获取敏感密钥
   * @param {string} keyName - 密钥名称
   * @returns {string|Buffer} 密钥值
   */
  getSecret(keyName) {
    if (!this.secrets.has(keyName)) {
      throw new Error(`密钥 ${keyName} 不存在`);
    }
    
    const secret = this.secrets.get(keyName);
    
    // 尝试解密（如果是加密格式）
    if (typeof secret === 'string' && secret.includes(':') && this.encryptionKey) {
      try {
        return this.decryptConfigValue(secret);
      } catch (error) {
        // 如果解密失败，返回原始值
        return secret;
      }
    }
    
    return secret;
  }

  /**
   * 生成新的随机密钥
   * @param {number} length - 密钥长度（字节）
   * @param {string} encoding - 输出编码
   * @returns {string} 随机密钥
   */
  generateRandomKey(length = 32, encoding = 'base64') {
    return crypto.randomBytes(length).toString(encoding);
  }

  /**
   * 导出配置（不包含敏感信息）
   * @returns {Object} 安全的配置副本
   */
  exportSafeConfig() {
    const safeConfig = JSON.parse(JSON.stringify(this.config));
    
    // 移除敏感信息
    if (safeConfig.jwt) {
      safeConfig.jwt.secret = safeConfig.jwt.secret ? '[REDACTED]' : null;
    }
    
    if (safeConfig.session) {
      safeConfig.session.secret = safeConfig.session.secret ? '[REDACTED]' : null;
    }
    
    return safeConfig;
  }

  /**
   * 检查配置是否满足安全最佳实践
   * @returns {Object} 安全检查结果
   */
  performSecurityCheck() {
    const issues = [];
    
    // 检查JWT配置
    if (!this.config.jwt.secret || this.config.jwt.secret.length < 32) {
      issues.push('JWT密钥长度不足，建议至少32个字符');
    }
    
    // 检查密码策略
    if (this.config.password.minLength < 8) {
      issues.push('密码最小长度建议至少为8个字符');
    }
    
    // 检查CORS配置
    if (this.config.cors.origin.includes('*')) {
      issues.push('CORS配置使用通配符，建议限制具体域名');
    }
    
    // 检查安全头
    if (!this.config.headers['Strict-Transport-Security']) {
      issues.push('缺少HSTS安全头配置');
    }
    
    // 检查Cookie安全
    if (!this.config.session.cookie.httpOnly) {
      issues.push('Cookie未启用httpOnly标志');
    }
    
    if (process.env.NODE_ENV === 'production' && !this.config.session.cookie.secure) {
      issues.push('生产环境中Cookie应启用secure标志');
    }
    
    return {
      secure: issues.length === 0,
      issues,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 合并自定义配置
   * @private
   * @param {Object} customConfig - 自定义配置
   */
  _mergeConfig(customConfig) {
    this.config = this._deepMerge(this.config, customConfig);
  }

  /**
   * 深度合并对象
   * @private
   * @param {Object} target - 目标对象
   * @param {Object} source - 源对象
   * @returns {Object} 合并后的对象
   */
  _deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          if (!result[key]) {
            result[key] = {};
          }
          result[key] = this._deepMerge(result[key], source[key]);
        } else {
          result[key] = source[key];
        }
      }
    }
    
    return result;
  }

  /**
   * 初始化加密密钥
   * @private
   * @param {string} keyPath - 密钥文件路径
   * @returns {Promise<void>}
   */
  async _initializeEncryptionKey(keyPath) {
    if (keyPath && fs.existsSync(keyPath)) {
      // 从文件加载密钥
      try {
        this.encryptionKey = fs.readFileSync(keyPath);
        this.logger.info('已从文件加载加密密钥');
      } catch (error) {
        this.logger.error('从文件加载加密密钥失败', { error });
        throw error;
      }
    } else {
      // 生成新的随机密钥
      this.encryptionKey = crypto.randomBytes(32);
      
      // 如果提供了路径，保存密钥到文件
      if (keyPath) {
        try {
          const dir = path.dirname(keyPath);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          fs.writeFileSync(keyPath, this.encryptionKey);
          this.logger.info('已生成并保存加密密钥到文件');
        } catch (error) {
          this.logger.warn('保存加密密钥到文件失败', { error });
        }
      } else {
        this.logger.info('已生成临时加密密钥（未保存）');
      }
    }
  }

  /**
   * 初始化JWT密钥
   * @private
   * @returns {Promise<void>}
   */
  async _initializeJwtSecret() {
    // 优先从环境变量获取
    const envSecret = process.env.JWT_SECRET;
    if (envSecret) {
      this.config.jwt.secret = envSecret;
      this.logger.info('已从环境变量配置JWT密钥');
      return;
    }
    
    // 如果已配置则使用现有密钥
    if (this.config.jwt.secret) {
      return;
    }
    
    // 生成新的随机密钥
    this.config.jwt.secret = this.generateRandomKey(64, 'hex');
    this.logger.info('已生成新的JWT密钥');
  }

  /**
   * 初始化Session密钥
   * @private
   * @returns {Promise<void>}
   */
  async _initializeSessionSecret() {
    // 优先从环境变量获取
    const envSecret = process.env.SESSION_SECRET;
    if (envSecret) {
      this.config.session.secret = envSecret;
      this.logger.info('已从环境变量配置Session密钥');
      return;
    }
    
    // 如果已配置则使用现有密钥
    if (this.config.session.secret) {
      return;
    }
    
    // 生成新的随机密钥
    this.config.session.secret = this.generateRandomKey(64, 'hex');
    this.logger.info('已生成新的Session密钥');
  }

  /**
   * 验证配置有效性
   * @private
   */
  _validateConfig() {
    const errors = [];
    
    // 验证JWT配置
    if (!this.config.jwt || !this.config.jwt.secret) {
      errors.push('JWT配置无效：缺少密钥');
    }
    
    // 验证密码策略
    if (this.config.password.minLength < 4) {
      errors.push('密码最小长度不能小于4个字符');
    }
    
    // 验证CORS配置
    if (!Array.isArray(this.config.cors.origin)) {
      errors.push('CORS origin配置必须是数组');
    }
    
    if (errors.length > 0) {
      const errorMessage = `安全配置验证失败: ${errors.join(', ')}`;
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }
  }

  /**
   * 启动密钥轮换
   * @private
   */
  _startKeyRotation() {
    const rotationInterval = this.config.keyRotation.interval || 90 * 24 * 60 * 60 * 1000; // 默认90天
    
    this.keyRotationSchedule = setInterval(() => {
      this._rotateKeys();
    }, rotationInterval);
    
    this.logger.info('密钥轮换已启动', { 
      interval: `${Math.floor(rotationInterval / (24 * 60 * 60 * 1000))} 天` 
    });
  }

  /**
   * 执行密钥轮换
   * @private
   */
  _rotateKeys() {
    try {
      // 生成新的JWT密钥
      const oldJwtSecret = this.config.jwt.secret;
      this.config.jwt.secret = this.generateRandomKey(64, 'hex');
      
      // 生成新的Session密钥
      const oldSessionSecret = this.config.session.secret;
      this.config.session.secret = this.generateRandomKey(64, 'hex');
      
      this.logger.info('密钥轮换完成');
      
      // 这里可以添加通知机制，通知管理员密钥已轮换
      // 也可以保留旧密钥一段时间以支持平滑过渡
    } catch (error) {
      this.logger.error('密钥轮换失败', { error });
    }
  }

  /**
   * 计算密码强度
   * @private
   * @param {string} password - 密码
   * @returns {number} 强度分数（0-100）
   */
  _calculatePasswordStrength(password) {
    let score = 0;
    
    // 基础长度分数
    score += Math.min(password.length * 4, 40);
    
    // 包含小写字母
    if (/[a-z]/.test(password)) score += 10;
    
    // 包含大写字母
    if (/[A-Z]/.test(password)) score += 10;
    
    // 包含数字
    if (/[0-9]/.test(password)) score += 10;
    
    // 包含特殊字符
    if (/[^a-zA-Z0-9]/.test(password)) score += 20;
    
    // 包含多种字符类型
    const charTypeCount = [
      /[a-z]/.test(password),
      /[A-Z]/.test(password),
      /[0-9]/.test(password),
      /[^a-zA-Z0-9]/.test(password)
    ].filter(Boolean).length;
    
    score += (charTypeCount - 1) * 5;
    
    return Math.min(score, 100);
  }

  /**
   * 清理资源
   */
  cleanup() {
    if (this.keyRotationSchedule) {
      clearInterval(this.keyRotationSchedule);
      this.keyRotationSchedule = null;
    }
    
    // 清除敏感信息
    this.secrets.clear();
    
    this.logger.info('安全配置管理器已清理');
  }
}

// 创建单例实例
const securityConfigManager = new SecurityConfigManager();

module.exports = {
  SecurityConfigManager,
  securityConfigManager
};