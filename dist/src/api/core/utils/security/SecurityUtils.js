/**
 * 安全工具
 * 提供加密、解密、哈希和安全验证功能
 */

const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const logger = require('../logger');
const { AppError } = require('../../exception/handlers/errorHandler');
const { SecurityError } = require('../../exception/handlers/errorHandler');

/**
 * 加密算法类型
 */
const EncryptionAlgorithm = {
  AES_256_CBC: 'aes-256-cbc',
  AES_256_GCM: 'aes-256-gcm',
  RSA_OAEP: 'rsa-oaep',
  RSA_PKCS1: 'rsa-pkcs1'
};

/**
 * 哈希算法类型
 */
const HashAlgorithm = {
  SHA256: 'sha256',
  SHA512: 'sha512',
  MD5: 'md5', // 仅用于非安全场景
  BCRYPT: 'bcrypt',
  ARGON2: 'argon2' // 需要额外安装 argon2 包
};

/**
 * 安全工具类
 */
class SecurityUtils {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   */
  constructor(options = {}) {
    this.options = {
      jwtSecret: options.jwtSecret || process.env.JWT_SECRET || this._generateRandomKey(32),
      jwtExpiration: options.jwtExpiration || '24h',
      jwtRefreshExpiration: options.jwtRefreshExpiration || '7d',
      bcryptSaltRounds: options.bcryptSaltRounds || 12,
      encryptionAlgorithm: options.encryptionAlgorithm || EncryptionAlgorithm.AES_256_GCM,
      ...options
    };
    
    logger.debug('安全工具初始化完成');
  }

  /**
   * 生成随机密钥
   * @private
   * @param {number} length - 密钥长度
   * @returns {string} 随机密钥
   */
  _generateRandomKey(length) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * 生成随机IV
   * @private
   * @param {string} algorithm - 加密算法
   * @returns {Buffer} 随机IV
   */
  _generateIv(algorithm) {
    const ivLength = this._getIvLength(algorithm);
    return crypto.randomBytes(ivLength);
  }

  /**
   * 获取IV长度
   * @private
   * @param {string} algorithm - 加密算法
   * @returns {number} IV长度
   */
  _getIvLength(algorithm) {
    switch (algorithm) {
      case EncryptionAlgorithm.AES_256_CBC:
        return 16;
      case EncryptionAlgorithm.AES_256_GCM:
        return 12;
      default:
        return 16;
    }
  }

  /**
   * 加密数据
   * @param {string|Buffer} data - 要加密的数据
   * @param {string} key - 加密密钥
   * @param {Object} options - 加密选项
   * @returns {string} 加密后的数据（Base64编码）
   */
  encrypt(data, key, options = {}) {
    try {
      const algorithm = options.algorithm || this.options.encryptionAlgorithm;
      const iv = this._generateIv(algorithm);
      
      // 确保密钥长度正确
      const validKey = this._normalizeKey(key, algorithm);
      
      let cipher;
      let encrypted;
      let authTag = null;
      
      if (algorithm === EncryptionAlgorithm.AES_256_GCM) {
        // GCM 模式需要认证标签
        cipher = crypto.createCipheriv(algorithm, validKey, iv);
        encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
        authTag = cipher.getAuthTag();
        
        // 将 iv、认证标签和加密数据组合
        const result = Buffer.concat([iv, authTag, encrypted]);
        return result.toString('base64');
      } else {
        // CBC 模式
        cipher = crypto.createCipheriv(algorithm, validKey, iv);
        encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
        
        // 将 iv 和加密数据组合
        const result = Buffer.concat([iv, encrypted]);
        return result.toString('base64');
      }
    } catch (error) {
      logger.error('加密失败', { error: error.message });
      throw new SecurityError(`加密失败: ${error.message}`, {
        code: 'ENCRYPTION_FAILED',
        cause: error
      });
    }
  }

  /**
   * 解密数据
   * @param {string} encryptedData - 加密的数据（Base64编码）
   * @param {string} key - 解密密钥
   * @param {Object} options - 解密选项
   * @returns {string} 解密后的数据
   */
  decrypt(encryptedData, key, options = {}) {
    try {
      const algorithm = options.algorithm || this.options.encryptionAlgorithm;
      const buffer = Buffer.from(encryptedData, 'base64');
      const ivLength = this._getIvLength(algorithm);
      
      // 确保密钥长度正确
      const validKey = this._normalizeKey(key, algorithm);
      
      let iv;
      let encrypted;
      let authTag = null;
      
      if (algorithm === EncryptionAlgorithm.AES_256_GCM) {
        // 提取 iv、认证标签和加密数据
        iv = buffer.slice(0, ivLength);
        authTag = buffer.slice(ivLength, ivLength + 16); // GCM认证标签长度为16字节
        encrypted = buffer.slice(ivLength + 16);
        
        // 解密
        const decipher = crypto.createDecipheriv(algorithm, validKey, iv);
        decipher.setAuthTag(authTag);
        const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
        
        return decrypted.toString('utf8');
      } else {
        // 提取 iv 和加密数据
        iv = buffer.slice(0, ivLength);
        encrypted = buffer.slice(ivLength);
        
        // 解密
        const decipher = crypto.createDecipheriv(algorithm, validKey, iv);
        const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
        
        return decrypted.toString('utf8');
      }
    } catch (error) {
      logger.error('解密失败', { error: error.message });
      throw new SecurityError(`解密失败: ${error.message}`, {
        code: 'DECRYPTION_FAILED',
        cause: error
      });
    }
  }

  /**
   * 规范化密钥
   * @private
   * @param {string} key - 原始密钥
   * @param {string} algorithm - 加密算法
   * @returns {Buffer} 规范化后的密钥
   */
  _normalizeKey(key, algorithm) {
    switch (algorithm) {
      case EncryptionAlgorithm.AES_256_CBC:
      case EncryptionAlgorithm.AES_256_GCM:
        // AES-256 需要 32 字节密钥
        return crypto.createHash('sha256').update(key).digest();
      default:
        return key;
    }
  }

  /**
   * 生成哈希值
   * @param {string|Buffer} data - 要哈希的数据
   * @param {Object} options - 哈希选项
   * @returns {string} 哈希值（十六进制字符串）
   */
  generateHash(data, options = {}) {
    try {
      const algorithm = options.algorithm || HashAlgorithm.SHA256;
      
      if (algorithm === HashAlgorithm.BCRYPT) {
        throw new AppError('请使用专门的 bcryptHash 方法处理 bcrypt 哈希', {
          code: 'INVALID_HASH_METHOD',
          status: 400
        });
      }
      
      const hash = crypto.createHash(algorithm)
        .update(data)
        .digest('hex');
      
      return hash;
    } catch (error) {
      logger.error('哈希生成失败', { error: error.message });
      throw new SecurityError(`哈希生成失败: ${error.message}`, {
        code: 'HASH_GENERATION_FAILED',
        cause: error
      });
    }
  }

  /**
   * 使用 bcrypt 哈希密码
   * @param {string} password - 明文密码
   * @param {Object} options - 哈希选项
   * @returns {Promise<string>} 哈希后的密码
   */
  async bcryptHash(password, options = {}) {
    try {
      const saltRounds = options.saltRounds || this.options.bcryptSaltRounds;
      const salt = await bcrypt.genSalt(saltRounds);
      const hash = await bcrypt.hash(password, salt);
      
      return hash;
    } catch (error) {
      logger.error('密码哈希失败', { error: error.message });
      throw new SecurityError(`密码哈希失败: ${error.message}`, {
        code: 'PASSWORD_HASH_FAILED',
        cause: error
      });
    }
  }

  /**
   * 验证 bcrypt 哈希
   * @param {string} password - 明文密码
   * @param {string} hash - 哈希值
   * @returns {Promise<boolean>} 是否匹配
   */
  async verifyBcryptHash(password, hash) {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      logger.error('密码验证失败', { error: error.message });
      throw new SecurityError(`密码验证失败: ${error.message}`, {
        code: 'PASSWORD_VERIFICATION_FAILED',
        cause: error
      });
    }
  }

  /**
   * 生成 HMAC
   * @param {string|Buffer} data - 要签名的数据
   * @param {string} secret - 密钥
   * @param {Object} options - 选项
   * @returns {string} HMAC值（十六进制字符串）
   */
  generateHmac(data, secret, options = {}) {
    try {
      const algorithm = options.algorithm || HashAlgorithm.SHA256;
      const hmac = crypto.createHmac(algorithm, secret)
        .update(data)
        .digest('hex');
      
      return hmac;
    } catch (error) {
      logger.error('HMAC生成失败', { error: error.message });
      throw new SecurityError(`HMAC生成失败: ${error.message}`, {
        code: 'HMAC_GENERATION_FAILED',
        cause: error
      });
    }
  }

  /**
   * 验证 HMAC
   * @param {string|Buffer} data - 数据
   * @param {string} secret - 密钥
   * @param {string} hmac - HMAC值
   * @param {Object} options - 选项
   * @returns {boolean} 是否匹配
   */
  verifyHmac(data, secret, hmac, options = {}) {
    const generatedHmac = this.generateHmac(data, secret, options);
    return crypto.timingSafeEqual(
      Buffer.from(generatedHmac),
      Buffer.from(hmac)
    );
  }

  /**
   * 生成 JWT token
   * @param {Object} payload - token 载荷
   * @param {Object} options - JWT 选项
   * @returns {string} JWT token
   */
  generateJwt(payload, options = {}) {
    try {
      const secret = options.secret || this.options.jwtSecret;
      const expiration = options.expiration || this.options.jwtExpiration;
      
      const jwtOptions = {
        expiresIn: expiration,
        issuer: options.issuer || 'api-service',
        audience: options.audience,
        subject: options.subject,
        notBefore: options.notBefore,
        ...options
      };
      
      // 移除非JWT标准选项
      delete jwtOptions.secret;
      delete jwtOptions.expiration;
      
      const token = jwt.sign(payload, secret, jwtOptions);
      
      logger.debug('JWT token 生成成功', {
        subject: payload.sub || payload.userId,
        expiresIn: expiration
      });
      
      return token;
    } catch (error) {
      logger.error('JWT生成失败', { error: error.message });
      throw new SecurityError(`JWT生成失败: ${error.message}`, {
        code: 'JWT_GENERATION_FAILED',
        cause: error
      });
    }
  }

  /**
   * 验证 JWT token
   * @param {string} token - JWT token
   * @param {Object} options - 验证选项
   * @returns {Object} 解码后的 payload
   */
  verifyJwt(token, options = {}) {
    try {
      const secret = options.secret || this.options.jwtSecret;
      
      const jwtOptions = {
        issuer: options.issuer || 'api-service',
        audience: options.audience,
        subject: options.subject,
        ...options
      };
      
      // 移除非JWT标准选项
      delete jwtOptions.secret;
      
      const decoded = jwt.verify(token, secret, jwtOptions);
      
      logger.debug('JWT token 验证成功', {
        subject: decoded.sub || decoded.userId
      });
      
      return decoded;
    } catch (error) {
      logger.error('JWT验证失败', { error: error.message });
      throw new SecurityError(`JWT验证失败: ${error.message}`, {
        code: 'JWT_VERIFICATION_FAILED',
        cause: error
      });
    }
  }

  /**
   * 解码 JWT token（不验证签名）
   * @param {string} token - JWT token
   * @returns {Object} 解码后的 payload
   */
  decodeJwt(token) {
    try {
      return jwt.decode(token);
    } catch (error) {
      logger.error('JWT解码失败', { error: error.message });
      throw new SecurityError(`JWT解码失败: ${error.message}`, {
        code: 'JWT_DECODE_FAILED',
        cause: error
      });
    }
  }

  /**
   * 生成刷新 token
   * @param {Object} payload - token 载荷
   * @param {Object} options - 选项
   * @returns {string} 刷新 token
   */
  generateRefreshToken(payload, options = {}) {
    return this.generateJwt(payload, {
      ...options,
      expiration: options.expiration || this.options.jwtRefreshExpiration,
      issuer: options.issuer || 'api-service-refresh'
    });
  }

  /**
   * 生成随机字符串
   * @param {number} length - 字符串长度
   * @param {Object} options - 选项
   * @returns {string} 随机字符串
   */
  generateRandomString(length = 32, options = {}) {
    const charset = options.charset || 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, charset.length);
      result += charset[randomIndex];
    }
    
    return result;
  }

  /**
   * 生成 UUID
   * @returns {string} UUID v4
   */
  generateUuid() {
    return uuidv4();
  }

  /**
   * 生成 API 密钥
   * @param {Object} options - 选项
   * @returns {string} API 密钥
   */
  generateApiKey(options = {}) {
    const prefix = options.prefix || 'api_';
    const length = options.length || 32;
    const secretPart = this.generateRandomString(length, {
      charset: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    });
    
    return `${prefix}${secretPart}`;
  }

  /**
   * 生成会话ID
   * @returns {string} 会话ID
   */
  generateSessionId() {
    return this.generateRandomString(32, {
      charset: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._'
    });
  }

  /**
   * 生成盐值
   * @param {number} rounds - 轮数（用于bcrypt）
   * @returns {Promise<string>} 盐值
   */
  async generateSalt(rounds = this.options.bcryptSaltRounds) {
    try {
      return await bcrypt.genSalt(rounds);
    } catch (error) {
      logger.error('盐值生成失败', { error: error.message });
      throw new SecurityError(`盐值生成失败: ${error.message}`, {
        code: 'SALT_GENERATION_FAILED',
        cause: error
      });
    }
  }

  /**
   * 验证密码强度
   * @param {string} password - 密码
   * @param {Object} rules - 验证规则
   * @returns {Object} 验证结果
   */
  validatePasswordStrength(password, rules = {}) {
    const defaultRules = {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumber: true,
      requireSpecialChar: true
    };
    
    const mergedRules = { ...defaultRules, ...rules };
    const errors = [];
    
    // 检查长度
    if (password.length < mergedRules.minLength) {
      errors.push(`密码长度必须至少为 ${mergedRules.minLength} 个字符`);
    }
    
    // 检查大写字母
    if (mergedRules.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('密码必须包含至少一个大写字母');
    }
    
    // 检查小写字母
    if (mergedRules.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('密码必须包含至少一个小写字母');
    }
    
    // 检查数字
    if (mergedRules.requireNumber && !/[0-9]/.test(password)) {
      errors.push('密码必须包含至少一个数字');
    }
    
    // 检查特殊字符
    if (mergedRules.requireSpecialChar && !/[^A-Za-z0-9]/.test(password)) {
      errors.push('密码必须包含至少一个特殊字符');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      score: this._calculatePasswordScore(password)
    };
  }

  /**
   * 计算密码强度分数
   * @private
   * @param {string} password - 密码
   * @returns {number} 强度分数（0-100）
   */
  _calculatePasswordScore(password) {
    let score = 0;
    
    // 长度得分
    score += Math.min(password.length * 4, 40);
    
    // 复杂度得分
    if (/[A-Z]/.test(password)) score += 10;
    if (/[a-z]/.test(password)) score += 10;
    if (/[0-9]/.test(password)) score += 10;
    if (/[^A-Za-z0-9]/.test(password)) score += 15;
    
    // 组合得分
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 5;
    if (/[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) score += 5;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password)) score += 5;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password) && /[^A-Za-z0-9]/.test(password)) score += 5;
    
    return Math.min(score, 100);
  }

  /**
   * 生成安全问题和答案哈希
   * @param {string} answer - 答案
   * @returns {Promise<string>} 答案哈希
   */
  async hashSecurityAnswer(answer) {
    // 标准化答案（小写，去除多余空格）
    const normalizedAnswer = answer.trim().toLowerCase();
    return this.bcryptHash(normalizedAnswer, { saltRounds: 10 });
  }

  /**
   * 验证安全问题答案
   * @param {string} answer - 答案
   * @param {string} hash - 哈希值
   * @returns {Promise<boolean>} 是否匹配
   */
  async verifySecurityAnswer(answer, hash) {
    const normalizedAnswer = answer.trim().toLowerCase();
    return this.verifyBcryptHash(normalizedAnswer, hash);
  }

  /**
   * 生成 CSRF token
   * @param {string} sessionId - 会话ID
   * @returns {string} CSRF token
   */
  generateCsrfToken(sessionId) {
    const randomPart = this.generateRandomString(32);
    const timestamp = Date.now();
    const data = `${sessionId}:${randomPart}:${timestamp}`;
    const token = this.generateHmac(data, this.options.jwtSecret);
    
    return `${randomPart}:${timestamp}:${token}`;
  }

  /**
   * 验证 CSRF token
   * @param {string} token - CSRF token
   * @param {string} sessionId - 会话ID
   * @returns {boolean} 是否有效
   */
  verifyCsrfToken(token, sessionId) {
    try {
      const [randomPart, timestamp, hmac] = token.split(':');
      
      if (!randomPart || !timestamp || !hmac) {
        return false;
      }
      
      // 检查是否过期（24小时）
      const tokenAge = Date.now() - parseInt(timestamp);
      if (tokenAge > 24 * 60 * 60 * 1000) {
        return false;
      }
      
      // 重新计算 HMAC 并验证
      const data = `${sessionId}:${randomPart}:${timestamp}`;
      const expectedHmac = this.generateHmac(data, this.options.jwtSecret);
      
      return crypto.timingSafeEqual(
        Buffer.from(expectedHmac),
        Buffer.from(hmac)
      );
    } catch (error) {
      logger.warn('CSRF token 验证失败', { error: error.message });
      return false;
    }
  }

  /**
   * 脱敏敏感数据
   * @param {string} data - 原始数据
   * @param {Object} options - 选项
   * @returns {string} 脱敏后的数据
   */
  maskSensitiveData(data, options = {}) {
    const { type, showFirst = 4, showLast = 4, maskChar = '*' } = options;
    
    if (!data) return data;
    
    const dataStr = String(data);
    const totalLength = dataStr.length;
    
    // 如果数据太短，全部脱敏
    if (totalLength <= showFirst + showLast) {
      return maskChar.repeat(totalLength);
    }
    
    // 根据类型进行脱敏
    switch (type) {
      case 'email':
        return this._maskEmail(dataStr);
      case 'phone':
        return this._maskPhone(dataStr);
      case 'idcard':
        return this._maskIdCard(dataStr);
      case 'bankcard':
        return this._maskBankCard(dataStr);
      default:
        // 默认脱敏中间部分
        const visiblePart = showFirst + showLast;
        const maskLength = totalLength - visiblePart;
        return (
          dataStr.substring(0, showFirst) +
          maskChar.repeat(maskLength) +
          dataStr.substring(totalLength - showLast)
        );
    }
  }

  /**
   * 脱敏邮箱
   * @private
   * @param {string} email - 邮箱地址
   * @returns {string} 脱敏后的邮箱
   */
  _maskEmail(email) {
    const [username, domain] = email.split('@');
    if (!username || !domain) return email;
    
    if (username.length <= 2) {
      return '*'.repeat(username.length) + '@' + domain;
    }
    
    const maskedUsername = username[0] + '*'.repeat(username.length - 2) + username[username.length - 1];
    return maskedUsername + '@' + domain;
  }

  /**
   * 脱敏手机号
   * @private
   * @param {string} phone - 手机号
   * @returns {string} 脱敏后的手机号
   */
  _maskPhone(phone) {
    const cleanedPhone = phone.replace(/\D/g, '');
    if (cleanedPhone.length !== 11) return phone;
    
    return cleanedPhone.substring(0, 3) + '****' + cleanedPhone.substring(7);
  }

  /**
   * 脱敏身份证号
   * @private
   * @param {string} idCard - 身份证号
   * @returns {string} 脱敏后的身份证号
   */
  _maskIdCard(idCard) {
    const cleanedIdCard = idCard.replace(/\s/g, '');
    if (cleanedIdCard.length !== 18) return idCard;
    
    return cleanedIdCard.substring(0, 6) + '********' + cleanedIdCard.substring(14);
  }

  /**
   * 脱敏银行卡号
   * @private
   * @param {string} bankCard - 银行卡号
   * @returns {string} 脱敏后的银行卡号
   */
  _maskBankCard(bankCard) {
    const cleanedBankCard = bankCard.replace(/\D/g, '');
    if (cleanedBankCard.length < 8) return bankCard;
    
    const lastFour = cleanedBankCard.slice(-4);
    const firstFour = cleanedBankCard.slice(0, 4);
    return firstFour + ' **** **** ' + lastFour;
  }

  /**
   * 生成临时令牌
   * @param {number} expirationMinutes - 过期时间（分钟）
   * @returns {Object} 包含令牌和过期时间的对象
   */
  generateTemporaryToken(expirationMinutes = 15) {
    const token = this.generateRandomString(64);
    const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000);
    
    return {
      token,
      expiresAt,
      expiresIn: expirationMinutes * 60 * 1000
    };
  }

  /**
   * 静态实例
   * @private
   */
  static _instance = null;

  /**
   * 获取单例实例
   * @param {Object} options - 配置选项
   * @returns {SecurityUtils} 安全工具实例
   */
  static getInstance(options = {}) {
    if (!SecurityUtils._instance) {
      SecurityUtils._instance = new SecurityUtils(options);
    }
    return SecurityUtils._instance;
  }

  /**
   * 创建新的安全工具实例
   * @param {Object} options - 配置选项
   * @returns {SecurityUtils} 安全工具实例
   */
  static create(options = {}) {
    return new SecurityUtils(options);
  }

  /**
   * 获取加密算法枚举
   * @returns {Object} 加密算法枚举
   */
  static getEncryptionAlgorithm() {
    return { ...EncryptionAlgorithm };
  }

  /**
   * 获取哈希算法枚举
   * @returns {Object} 哈希算法枚举
   */
  static getHashAlgorithm() {
    return { ...HashAlgorithm };
  }
}

// 创建默认实例
const defaultSecurityUtils = SecurityUtils.getInstance();

module.exports = {
  SecurityUtils,
  EncryptionAlgorithm,
  HashAlgorithm,
  securityUtils: defaultSecurityUtils
};