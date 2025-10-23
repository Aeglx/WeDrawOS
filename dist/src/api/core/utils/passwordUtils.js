/**
 * 密码工具类模块
 * 处理密码哈希、验证和安全令牌生成等功能
 */

const crypto = require('crypto');
const { config } = require('../config/config');
const { Logger } = require('../logging/logger');

class PasswordUtils {
  constructor() {
    this.logger = Logger.getInstance();
    this.saltRounds = config.auth.passwordSaltRounds || 12;
    this.logger.info('Password utilities initialized');
  }

  /**
   * 哈希密码
   * @param {string} password - 明文密码
   * @returns {Promise<string>} 哈希后的密码
   */
  async hashPassword(password) {
    try {
      if (!password || typeof password !== 'string') {
        throw new Error('Password must be a non-empty string');
      }

      // 使用crypto.pbkdf2Sync生成密码哈希
      // 生成随机盐
      const salt = crypto.randomBytes(16).toString('hex');
      
      // 生成哈希
      const derivedKey = crypto.pbkdf2Sync(
        password,
        salt,
        100000, // 迭代次数
        64,     // 密钥长度（字节）
        'sha256' // 哈希算法
      );
      
      // 返回格式: 算法$迭代次数$盐$哈希
      const hashedPassword = `pbkdf2$100000$${salt}$${derivedKey.toString('hex')}`;
      
      this.logger.debug('Password hashed successfully');
      return hashedPassword;
    } catch (error) {
      this.logger.error('Failed to hash password:', error);
      throw new Error('Failed to hash password');
    }
  }

  /**
   * 验证密码
   * @param {string} password - 明文密码
   * @param {string} hashedPassword - 存储的哈希密码
   * @returns {Promise<boolean>} 密码是否匹配
   */
  async verifyPassword(password, hashedPassword) {
    try {
      if (!password || !hashedPassword) {
        return false;
      }

      // 解析存储的哈希密码
      // 格式: 算法$迭代次数$盐$哈希
      const parts = hashedPassword.split('$');
      
      if (parts.length !== 4) {
        this.logger.warn('Invalid password hash format');
        return false;
      }

      const algorithm = parts[0];
      const iterations = parseInt(parts[1], 10);
      const salt = parts[2];
      const storedHash = parts[3];

      // 仅支持pbkdf2算法
      if (algorithm !== 'pbkdf2') {
        this.logger.warn('Unsupported password hashing algorithm:', algorithm);
        return false;
      }

      // 使用相同参数生成哈希
      const derivedKey = crypto.pbkdf2Sync(
        password,
        salt,
        iterations,
        64,
        'sha256'
      );
      
      const computedHash = derivedKey.toString('hex');

      // 比较哈希值（使用时间恒定比较防止时序攻击）
      return this._timingSafeEqual(computedHash, storedHash);
    } catch (error) {
      this.logger.error('Failed to verify password:', error);
      return false;
    }
  }

  /**
   * 生成安全随机令牌
   * @param {number} length - 令牌长度
   * @returns {string} 安全令牌
   */
  generateSecureToken(length = 32) {
    try {
      if (length <= 0 || !Number.isInteger(length)) {
        throw new Error('Token length must be a positive integer');
      }

      // 生成随机字节并转换为十六进制字符串
      const token = crypto.randomBytes(length).toString('hex');
      
      this.logger.debug(`Secure token generated with length ${length}`);
      return token;
    } catch (error) {
      this.logger.error('Failed to generate secure token:', error);
      throw new Error('Failed to generate secure token');
    }
  }

  /**
   * 生成随机密码
   * @param {number} length - 密码长度
   * @param {Object} options - 密码选项
   * @returns {string} 随机密码
   */
  generateRandomPassword(length = 12, options = {}) {
    try {
      const { 
        useUppercase = true,
        useLowercase = true,
        useNumbers = true,
        useSymbols = true
      } = options;

      // 确保至少有一种字符类型
      if (!useUppercase && !useLowercase && !useNumbers && !useSymbols) {
        throw new Error('At least one character type must be enabled');
      }

      // 定义字符集
      let charset = '';
      if (useUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      if (useLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
      if (useNumbers) charset += '0123456789';
      if (useSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

      let password = '';
      const charsetLength = charset.length;

      // 生成随机密码
      for (let i = 0; i < length; i++) {
        const randomIndex = crypto.randomInt(0, charsetLength);
        password += charset.charAt(randomIndex);
      }

      // 确保密码包含至少一个指定类型的字符
      password = this._ensurePasswordComplexity(password, options);

      this.logger.debug('Random password generated');
      return password;
    } catch (error) {
      this.logger.error('Failed to generate random password:', error);
      throw new Error('Failed to generate random password');
    }
  }

  /**
   * 检查密码强度
   * @param {string} password - 要检查的密码
   * @returns {Object} 密码强度评估
   */
  checkPasswordStrength(password) {
    try {
      if (!password || typeof password !== 'string') {
        return {
          score: 0,
          strength: 'Very Weak',
          feedback: 'Password is empty or invalid'
        };
      }

      let score = 0;
      const feedback = [];

      // 长度检查
      if (password.length < 8) {
        feedback.push('Password should be at least 8 characters long');
      } else if (password.length >= 12) {
        score += 2;
        feedback.push('Good password length');
      } else {
        score += 1;
        feedback.push('Password length is acceptable');
      }

      // 包含小写字母
      if (/[a-z]/.test(password)) {
        score += 1;
      } else {
        feedback.push('Should contain lowercase letters');
      }

      // 包含大写字母
      if (/[A-Z]/.test(password)) {
        score += 1;
      } else {
        feedback.push('Should contain uppercase letters');
      }

      // 包含数字
      if (/\d/.test(password)) {
        score += 1;
      } else {
        feedback.push('Should contain numbers');
      }

      // 包含特殊字符
      if (/[^A-Za-z0-9]/.test(password)) {
        score += 1;
      } else {
        feedback.push('Should contain special characters');
      }

      // 包含至少5个不同字符
      const uniqueChars = new Set(password);
      if (uniqueChars.size >= 5) {
        score += 1;
      } else {
        feedback.push('Should contain more unique characters');
      }

      // 不包含连续字符
      if (!/([a-zA-Z0-9])\1{2,}/.test(password)) {
        score += 1;
      } else {
        feedback.push('Should not contain repeated characters');
      }

      // 不包含常见密码模式
      if (!this._containsCommonPattern(password)) {
        score += 1;
      } else {
        feedback.push('Should not contain common patterns');
      }

      // 计算强度评级
      let strength;
      if (score < 3) {
        strength = 'Very Weak';
      } else if (score < 5) {
        strength = 'Weak';
      } else if (score < 7) {
        strength = 'Moderate';
      } else if (score < 9) {
        strength = 'Strong';
      } else {
        strength = 'Very Strong';
      }

      return {
        score: Math.min(10, score),
        strength,
        feedback: feedback.join('; ')
      };
    } catch (error) {
      this.logger.error('Failed to check password strength:', error);
      return {
        score: 0,
        strength: 'Unknown',
        feedback: 'Error checking password strength'
      };
    }
  }

  /**
   * 生成密码重置令牌
   * @returns {Object} 重置令牌和过期时间
   */
  generatePasswordResetToken() {
    try {
      // 生成随机令牌
      const token = this.generateSecureToken(32);
      
      // 计算过期时间（默认24小时）
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + (config.auth.resetTokenExpiryHours || 24));
      
      this.logger.debug('Password reset token generated');
      return {
        token,
        expiresAt
      };
    } catch (error) {
      this.logger.error('Failed to generate password reset token:', error);
      throw new Error('Failed to generate password reset token');
    }
  }

  /**
   * 生成API密钥
   * @param {string} prefix - 密钥前缀
   * @returns {string} API密钥
   */
  generateApiKey(prefix = 'api_') {
    try {
      // 生成随机部分
      const randomPart = crypto.randomBytes(24).toString('base64')
        .replace(/\+/g, '-') // 替换+为-
        .replace(/\//g, '_') // 替换/为_
        .replace(/=+$/, ''); // 移除末尾的=
      
      const apiKey = `${prefix}${randomPart}`;
      
      this.logger.debug('API key generated');
      return apiKey;
    } catch (error) {
      this.logger.error('Failed to generate API key:', error);
      throw new Error('Failed to generate API key');
    }
  }

  /**
   * 哈希敏感数据（用于日志或临时存储）
   * @param {string} data - 要哈希的敏感数据
   * @returns {string} 哈希后的字符串
   */
  hashSensitiveData(data) {
    try {
      if (!data) {
        return '';
      }

      // 使用SHA-256进行单向哈希
      const hash = crypto.createHash('sha256');
      hash.update(data);
      const hashedData = hash.digest('hex');
      
      this.logger.debug('Sensitive data hashed for logging/storage');
      return hashedData;
    } catch (error) {
      this.logger.error('Failed to hash sensitive data:', error);
      return '';
    }
  }

  /**
   * 掩码敏感数据（如信用卡、手机号）
   * @param {string} data - 要掩码的数据
   * @param {Object} options - 掩码选项
   * @returns {string} 掩码后的数据
   */
  maskSensitiveData(data, options = {}) {
    try {
      if (!data || typeof data !== 'string') {
        return '';
      }

      const {
        showFirst = 4,
        showLast = 4,
        maskChar = '*'
      } = options;

      // 如果数据太短，返回全部掩码
      if (data.length <= showFirst + showLast) {
        return maskChar.repeat(data.length);
      }

      // 构建掩码数据
      const firstPart = data.substring(0, showFirst);
      const lastPart = data.substring(data.length - showLast);
      const maskedPart = maskChar.repeat(data.length - showFirst - showLast);

      return `${firstPart}${maskedPart}${lastPart}`;
    } catch (error) {
      this.logger.error('Failed to mask sensitive data:', error);
      return '';
    }
  }

  /**
   * 时间恒定比较（防止时序攻击）
   * @private
   * @param {string} a - 第一个字符串
   * @param {string} b - 第二个字符串
   * @returns {boolean} 是否相等
   */
  _timingSafeEqual(a, b) {
    try {
      // 使用crypto.timingSafeEqual进行时间恒定比较
      // 注意：需要确保两个缓冲区长度相同
      const aBuffer = Buffer.from(a);
      const bBuffer = Buffer.from(b);
      
      // 如果长度不同，直接返回false
      if (aBuffer.length !== bBuffer.length) {
        return false;
      }
      
      return crypto.timingSafeEqual(aBuffer, bBuffer);
    } catch (error) {
      this.logger.error('Timing safe comparison failed:', error);
      
      // 回退到普通比较（不太安全，但总比没有好）
      return a === b;
    }
  }

  /**
   * 确保密码满足复杂度要求
   * @private
   * @param {string} password - 密码
   * @param {Object} options - 复杂度选项
   * @returns {string} 符合要求的密码
   */
  _ensurePasswordComplexity(password, options) {
    const { 
      useUppercase = true,
      useLowercase = true,
      useNumbers = true,
      useSymbols = true
    } = options;

    // 定义各类型字符
    const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
    const numberChars = '0123456789';
    const symbolChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    // 转换密码为数组以便修改
    const passwordArray = password.split('');

    // 确保包含大写字母
    if (useUppercase && !/[A-Z]/.test(password)) {
      const randomIndex = crypto.randomInt(0, passwordArray.length);
      passwordArray[randomIndex] = uppercaseChars.charAt(crypto.randomInt(0, uppercaseChars.length));
    }

    // 确保包含小写字母
    if (useLowercase && !/[a-z]/.test(password)) {
      const randomIndex = crypto.randomInt(0, passwordArray.length);
      passwordArray[randomIndex] = lowercaseChars.charAt(crypto.randomInt(0, lowercaseChars.length));
    }

    // 确保包含数字
    if (useNumbers && !/\d/.test(password)) {
      const randomIndex = crypto.randomInt(0, passwordArray.length);
      passwordArray[randomIndex] = numberChars.charAt(crypto.randomInt(0, numberChars.length));
    }

    // 确保包含特殊字符
    if (useSymbols && !/[^A-Za-z0-9]/.test(password)) {
      const randomIndex = crypto.randomInt(0, passwordArray.length);
      passwordArray[randomIndex] = symbolChars.charAt(crypto.randomInt(0, symbolChars.length));
    }

    return passwordArray.join('');
  }

  /**
   * 检查密码是否包含常见模式
   * @private
   * @param {string} password - 要检查的密码
   * @returns {boolean} 是否包含常见模式
   */
  _containsCommonPattern(password) {
    const commonPatterns = [
      // 常见密码
      'password', '123456', 'qwerty', 'admin', 'welcome',
      // 键盘序列
      'qwertyuiop', 'asdfghjkl', 'zxcvbnm', '1qaz2wsx',
      // 数字序列
      '123456789', '987654321', '111111', '222222',
      // 日期模式
      /\d{4}[-/]?\d{2}[-/]?\d{2}/,
      // 重复字符
      /(.)\1{3,}/
    ];

    // 转换为小写进行不区分大小写的检查
    const lowerPassword = password.toLowerCase();

    for (const pattern of commonPatterns) {
      if (typeof pattern === 'string') {
        if (lowerPassword.includes(pattern)) {
          return true;
        }
      } else if (pattern instanceof RegExp) {
        if (pattern.test(password)) {
          return true;
        }
      }
    }

    return false;
  }
}

// 导出单例实例
const passwordUtils = new PasswordUtils();

module.exports = {
  passwordUtils,
  PasswordUtils
};