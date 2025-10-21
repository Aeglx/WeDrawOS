/**
 * 认证工具
 * 提供高级身份验证和授权功能
 */

const crypto = require('crypto');
const { EventEmitter } = require('events');
const { logger } = require('../logger');
const { cryptoUtils } = require('../crypto');
const { typeUtils } = require('../type');
const { stringUtils } = require('../string');
const { timeUtils } = require('../time');
const { performanceUtils } = require('../performance');
const { logContext } = require('../logger/LogContext');

/**
 * 认证策略枚举
 */
const AuthStrategy = {
  JWT: 'jwt',
  SESSION: 'session',
  API_KEY: 'api_key',
  OAUTH2: 'oauth2',
  BASIC: 'basic',
  TOKEN: 'token',
  CUSTOM: 'custom'
};

/**
 * 令牌类型枚举
 */
const TokenType = {
  ACCESS: 'access',
  REFRESH: 'refresh',
  VERIFICATION: 'verification',
  RESET_PASSWORD: 'reset_password',
  SESSION: 'session',
  API: 'api'
};

/**
 * 哈希算法枚举
 */
const HashAlgorithm = {
  BCRYPT: 'bcrypt',
  ARGON2: 'argon2',
  SCRYPT: 'scrypt',
  PBKDF2: 'pbkdf2',
  SHA256: 'sha256'
};

/**
 * 认证工具类
 * 提供高级身份验证和授权功能
 */
class AuthenticationUtils extends EventEmitter {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   */
  constructor(options = {}) {
    super();

    this.options = {
      defaultStrategy: options.defaultStrategy || AuthStrategy.JWT,
      tokenSecret: options.tokenSecret || this._generateRandomSecret(),
      tokenExpiry: options.tokenExpiry || '1h',
      refreshTokenExpiry: options.refreshTokenExpiry || '7d',
      passwordHashAlgorithm: options.passwordHashAlgorithm || HashAlgorithm.PBKDF2,
      pbkdf2Iterations: options.pbkdf2Iterations || 100000,
      pbkdf2KeyLength: options.pbkdf2KeyLength || 64,
      sessionTimeout: options.sessionTimeout || '30m',
      maxFailedAttempts: options.maxFailedAttempts || 5,
      lockoutDuration: options.lockoutDuration || '15m',
      allowedOrigins: options.allowedOrigins || ['*'],
      ...options
    };

    // 内存存储（实际应用中应使用持久化存储）
    this._sessions = new Map();
    this._apiKeys = new Map();
    this._failedAttempts = new Map();
    this._blacklistedTokens = new Set();

    // 统计信息
    this.stats = {
      authentications: 0,
      successfulAuthentications: 0,
      failedAuthentications: 0,
      tokenIssuances: 0,
      tokenRefreshes: 0,
      tokenInvalidations: 0,
      passwordChanges: 0,
      lockouts: 0
    };

    // 延迟加载第三方依赖
    this._dependencies = {};

    // 设置最大监听器
    this.setMaxListeners(50);

    // 启动定期清理任务
    this._startCleanupTasks();

    logger.debug('认证工具初始化完成', {
      defaultStrategy: this.options.defaultStrategy,
      passwordHashAlgorithm: this.options.passwordHashAlgorithm
    });
  }

  /**
   * 生成随机密钥
   * @param {number} length - 密钥长度
   * @returns {string} 随机密钥
   * @private
   */
  _generateRandomSecret(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * 启动清理任务
   * @private
   */
  _startCleanupTasks() {
    // 每小时清理过期会话和令牌
    setInterval(() => {
      this._cleanupExpiredSessions();
      this._cleanupExpiredBlacklistedTokens();
    }, 60 * 60 * 1000);
  }

  /**
   * 清理过期会话
   * @private
   */
  _cleanupExpiredSessions() {
    const now = Date.now();
    let cleaned = 0;

    for (const [sessionId, session] of this._sessions.entries()) {
      if (session.expiresAt && session.expiresAt < now) {
        this._sessions.delete(sessionId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug(`清理了 ${cleaned} 个过期会话`);
    }
  }

  /**
   * 清理过期的黑名单令牌
   * @private
   */
  _cleanupExpiredBlacklistedTokens() {
    const now = Date.now();
    let cleaned = 0;

    for (const tokenInfo of this._blacklistedTokens) {
      if (tokenInfo && tokenInfo.expiresAt && tokenInfo.expiresAt < now) {
        this._blacklistedTokens.delete(tokenInfo);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug(`清理了 ${cleaned} 个过期的黑名单令牌`);
    }
  }

  /**
   * 加载依赖模块
   * @param {string} moduleName - 模块名称
   * @returns {Promise<any>} 模块实例
   * @private
   */
  async _loadDependency(moduleName) {
    if (!this._dependencies[moduleName]) {
      try {
        this._dependencies[moduleName] = require(moduleName);
      } catch (error) {
        logger.warn(`无法加载依赖模块 ${moduleName}，某些功能可能不可用`, { error: error.message });
        this._dependencies[moduleName] = null;
      }
    }
    return this._dependencies[moduleName];
  }

  /**
   * 验证用户凭据
   * @param {string} username - 用户名
   * @param {string} password - 密码
   * @param {Function} validateUser - 用户验证函数
   * @returns {Promise<Object>} 验证结果
   */
  async authenticate(username, password, validateUser) {
    const startTime = performance.now();
    
    try {
      // 更新统计信息
      this.stats.authentications++;

      // 检查账户是否被锁定
      if (await this._isAccountLocked(username)) {
        const lockoutInfo = this._failedAttempts.get(username);
        const timeLeft = Math.ceil((lockoutInfo.lockoutUntil - Date.now()) / 1000);
        
        logger.warn('账户已被锁定', {
          username,
          timeLeft,
          requestId: logContext.getRequestId()
        });
        
        throw new Error(`账户已被锁定，请在 ${timeLeft} 秒后重试`);
      }

      // 验证用户
      const user = await validateUser(username);
      if (!user) {
        await this._recordFailedAttempt(username);
        throw new Error('用户名或密码不正确');
      }

      // 验证密码
      const isValid = await this.verifyPassword(password, user.passwordHash, user.passwordSalt);
      
      if (isValid) {
        // 重置失败尝试计数
        this._failedAttempts.delete(username);
        
        // 更新统计信息
        this.stats.successfulAuthentications++;
        
        const duration = performance.now() - startTime;
        performanceUtils.recordTimer('auth.authenticate.success', duration);
        
        logger.info('用户认证成功', {
          username,
          userId: user.id,
          duration,
          requestId: logContext.getRequestId()
        });
        
        this.emit('auth.success', {
          username,
          userId: user.id
        });
        
        return {
          success: true,
          user,
          sessionId: null // 稍后生成
        };
      } else {
        // 记录失败尝试
        await this._recordFailedAttempt(username);
        throw new Error('用户名或密码不正确');
      }
    } catch (error) {
      // 更新统计信息
      this.stats.failedAuthentications++;
      
      const duration = performance.now() - startTime;
      performanceUtils.recordTimer('auth.authenticate.failure', duration);
      
      logger.warn('用户认证失败', {
        username,
        error: error.message,
        duration,
        requestId: logContext.getRequestId()
      });
      
      this.emit('auth.failure', {
        username,
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * 记录失败的登录尝试
   * @param {string} username - 用户名
   * @private
   */
  async _recordFailedAttempt(username) {
    const attempts = this._failedAttempts.get(username) || { count: 0, lockoutUntil: null };
    attempts.count++;
    
    // 检查是否需要锁定账户
    if (attempts.count >= this.options.maxFailedAttempts) {
      const lockoutDuration = timeUtils.parseDuration(this.options.lockoutDuration);
      attempts.lockoutUntil = Date.now() + lockoutDuration;
      
      // 更新统计信息
      this.stats.lockouts++;
      
      logger.warn('账户已被锁定', {
        username,
        attempts: attempts.count,
        lockoutUntil: new Date(attempts.lockoutUntil).toISOString(),
        requestId: logContext.getRequestId()
      });
      
      this.emit('auth.lockout', {
        username,
        attempts: attempts.count,
        lockoutDuration: this.options.lockoutDuration
      });
    }
    
    this._failedAttempts.set(username, attempts);
  }

  /**
   * 检查账户是否被锁定
   * @param {string} username - 用户名
   * @returns {Promise<boolean>} 是否被锁定
   * @private
   */
  async _isAccountLocked(username) {
    const attempts = this._failedAttempts.get(username);
    if (!attempts || !attempts.lockoutUntil) {
      return false;
    }
    
    // 检查锁定是否已过期
    if (attempts.lockoutUntil < Date.now()) {
      // 重置失败尝试
      this._failedAttempts.set(username, { count: 0, lockoutUntil: null });
      return false;
    }
    
    return true;
  }

  /**
   * 哈希密码
   * @param {string} password - 原始密码
   * @param {Object} options - 哈希选项
   * @returns {Promise<Object>} 包含哈希和盐的对象
   */
  async hashPassword(password, options = {}) {
    const startTime = performance.now();
    
    try {
      const algorithm = options.algorithm || this.options.passwordHashAlgorithm;
      
      switch (algorithm) {
        case HashAlgorithm.PBKDF2:
          return this._hashPasswordPBKDF2(password, options);
        case HashAlgorithm.BCRYPT:
          return this._hashPasswordBCrypt(password, options);
        case HashAlgorithm.ARGON2:
          return this._hashPasswordArgon2(password, options);
        case HashAlgorithm.SCRYPT:
          return this._hashPasswordScrypt(password, options);
        case HashAlgorithm.SHA256:
          return this._hashPasswordSHA256(password, options);
        default:
          throw new Error(`不支持的哈希算法: ${algorithm}`);
      }
    } catch (error) {
      logger.error('密码哈希失败', {
        error: error.message,
        algorithm: options.algorithm || this.options.passwordHashAlgorithm,
        requestId: logContext.getRequestId()
      });
      throw error;
    } finally {
      const duration = performance.now() - startTime;
      performanceUtils.recordTimer('auth.hashPassword', duration);
    }
  }

  /**
   * 使用PBKDF2哈希密码
   * @param {string} password - 原始密码
   * @param {Object} options - 选项
   * @returns {Promise<Object>} 包含哈希和盐的对象
   * @private
   */
  async _hashPasswordPBKDF2(password, options = {}) {
    const salt = crypto.randomBytes(32).toString('hex');
    const iterations = options.iterations || this.options.pbkdf2Iterations;
    const keyLength = options.keyLength || this.options.pbkdf2KeyLength;
    const digest = options.digest || 'sha256';
    
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(password, salt, iterations, keyLength, digest, (err, derivedKey) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            passwordHash: derivedKey.toString('hex'),
            passwordSalt: salt,
            passwordAlgorithm: HashAlgorithm.PBKDF2,
            passwordIterations: iterations
          });
        }
      });
    });
  }

  /**
   * 使用BCrypt哈希密码
   * @param {string} password - 原始密码
   * @param {Object} options - 选项
   * @returns {Promise<Object>} 包含哈希和盐的对象
   * @private
   */
  async _hashPasswordBCrypt(password, options = {}) {
    const bcrypt = await this._loadDependency('bcrypt');
    if (!bcrypt) {
      logger.warn('bcrypt模块不可用，回退到PBKDF2');
      return this._hashPasswordPBKDF2(password, options);
    }
    
    const saltRounds = options.saltRounds || 12;
    const salt = await bcrypt.genSalt(saltRounds);
    const hash = await bcrypt.hash(password, salt);
    
    return {
      passwordHash: hash,
      passwordSalt: null, // BCrypt在哈希中包含盐
      passwordAlgorithm: HashAlgorithm.BCRYPT,
      passwordSaltRounds: saltRounds
    };
  }

  /**
   * 使用Argon2哈希密码
   * @param {string} password - 原始密码
   * @param {Object} options - 选项
   * @returns {Promise<Object>} 包含哈希和盐的对象
   * @private
   */
  async _hashPasswordArgon2(password, options = {}) {
    const argon2 = await this._loadDependency('argon2');
    if (!argon2) {
      logger.warn('argon2模块不可用，回退到PBKDF2');
      return this._hashPasswordPBKDF2(password, options);
    }
    
    const hash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: options.memoryCost || 65536,
      timeCost: options.timeCost || 3,
      parallelism: options.parallelism || 4
    });
    
    return {
      passwordHash: hash,
      passwordSalt: null, // Argon2在哈希中包含盐和参数
      passwordAlgorithm: HashAlgorithm.ARGON2
    };
  }

  /**
   * 使用Scrypt哈希密码
   * @param {string} password - 原始密码
   * @param {Object} options - 选项
   * @returns {Promise<Object>} 包含哈希和盐的对象
   * @private
   */
  async _hashPasswordScrypt(password, options = {}) {
    const salt = crypto.randomBytes(32).toString('hex');
    const keylen = options.keylen || 64;
    const cost = options.cost || 16384;
    const blockSize = options.blockSize || 8;
    const parallelization = options.parallelization || 1;
    
    return new Promise((resolve, reject) => {
      crypto.scrypt(password, salt, keylen, {
        cost,
        blockSize,
        parallelization
      }, (err, derivedKey) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            passwordHash: derivedKey.toString('hex'),
            passwordSalt: salt,
            passwordAlgorithm: HashAlgorithm.SCRYPT,
            passwordCost: cost
          });
        }
      });
    });
  }

  /**
   * 使用SHA256哈希密码（仅用于测试，不安全）
   * @param {string} password - 原始密码
   * @param {Object} options - 选项
   * @returns {Promise<Object>} 包含哈希和盐的对象
   * @private
   */
  async _hashPasswordSHA256(password, options = {}) {
    const salt = crypto.randomBytes(32).toString('hex');
    const combined = password + salt;
    const hash = crypto.createHash('sha256').update(combined).digest('hex');
    
    return {
      passwordHash: hash,
      passwordSalt: salt,
      passwordAlgorithm: HashAlgorithm.SHA256
    };
  }

  /**
   * 验证密码
   * @param {string} password - 原始密码
   * @param {string} storedHash - 存储的哈希值
   * @param {string} storedSalt - 存储的盐值（如果有）
   * @param {Object} options - 验证选项
   * @returns {Promise<boolean>} 验证结果
   */
  async verifyPassword(password, storedHash, storedSalt = null, options = {}) {
    const algorithm = options.algorithm || this.options.passwordHashAlgorithm;
    
    try {
      switch (algorithm) {
        case HashAlgorithm.PBKDF2:
          return this._verifyPasswordPBKDF2(password, storedHash, storedSalt, options);
        case HashAlgorithm.BCRYPT:
          return this._verifyPasswordBCrypt(password, storedHash, options);
        case HashAlgorithm.ARGON2:
          return this._verifyPasswordArgon2(password, storedHash, options);
        case HashAlgorithm.SCRYPT:
          return this._verifyPasswordScrypt(password, storedHash, storedSalt, options);
        case HashAlgorithm.SHA256:
          return this._verifyPasswordSHA256(password, storedHash, storedSalt);
        default:
          logger.warn(`未知的密码哈希算法: ${algorithm}，默认使用PBKDF2验证`);
          return this._verifyPasswordPBKDF2(password, storedHash, storedSalt, options);
      }
    } catch (error) {
      logger.error('密码验证失败', {
        error: error.message,
        algorithm,
        requestId: logContext.getRequestId()
      });
      return false;
    }
  }

  /**
   * 使用PBKDF2验证密码
   * @param {string} password - 原始密码
   * @param {string} storedHash - 存储的哈希值
   * @param {string} storedSalt - 存储的盐值
   * @param {Object} options - 选项
   * @returns {Promise<boolean>} 验证结果
   * @private
   */
  async _verifyPasswordPBKDF2(password, storedHash, storedSalt, options = {}) {
    const iterations = options.iterations || this.options.pbkdf2Iterations;
    const keyLength = options.keyLength || this.options.pbkdf2KeyLength;
    const digest = options.digest || 'sha256';
    
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(password, storedSalt, iterations, keyLength, digest, (err, derivedKey) => {
        if (err) {
          reject(err);
        } else {
          const hash = derivedKey.toString('hex');
          // 使用时间安全的比较
          resolve(crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(storedHash)));
        }
      });
    });
  }

  /**
   * 使用BCrypt验证密码
   * @param {string} password - 原始密码
   * @param {string} storedHash - 存储的哈希值
   * @param {Object} options - 选项
   * @returns {Promise<boolean>} 验证结果
   * @private
   */
  async _verifyPasswordBCrypt(password, storedHash, options = {}) {
    const bcrypt = await this._loadDependency('bcrypt');
    if (!bcrypt) {
      logger.warn('bcrypt模块不可用，无法验证BCrypt哈希');
      return false;
    }
    
    return bcrypt.compare(password, storedHash);
  }

  /**
   * 使用Argon2验证密码
   * @param {string} password - 原始密码
   * @param {string} storedHash - 存储的哈希值
   * @param {Object} options - 选项
   * @returns {Promise<boolean>} 验证结果
   * @private
   */
  async _verifyPasswordArgon2(password, storedHash, options = {}) {
    const argon2 = await this._loadDependency('argon2');
    if (!argon2) {
      logger.warn('argon2模块不可用，无法验证Argon2哈希');
      return false;
    }
    
    try {
      return await argon2.verify(storedHash, password);
    } catch (error) {
      return false;
    }
  }

  /**
   * 使用Scrypt验证密码
   * @param {string} password - 原始密码
   * @param {string} storedHash - 存储的哈希值
   * @param {string} storedSalt - 存储的盐值
   * @param {Object} options - 选项
   * @returns {Promise<boolean>} 验证结果
   * @private
   */
  async _verifyPasswordScrypt(password, storedHash, storedSalt, options = {}) {
    const keylen = options.keylen || 64;
    const cost = options.cost || 16384;
    const blockSize = options.blockSize || 8;
    const parallelization = options.parallelization || 1;
    
    return new Promise((resolve, reject) => {
      crypto.scrypt(password, storedSalt, keylen, {
        cost,
        blockSize,
        parallelization
      }, (err, derivedKey) => {
        if (err) {
          reject(err);
        } else {
          const hash = derivedKey.toString('hex');
          resolve(crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(storedHash)));
        }
      });
    });
  }

  /**
   * 使用SHA256验证密码
   * @param {string} password - 原始密码
   * @param {string} storedHash - 存储的哈希值
   * @param {string} storedSalt - 存储的盐值
   * @returns {Promise<boolean>} 验证结果
   * @private
   */
  async _verifyPasswordSHA256(password, storedHash, storedSalt) {
    const combined = password + storedSalt;
    const hash = crypto.createHash('sha256').update(combined).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(storedHash));
  }

  /**
   * 生成JWT令牌
   * @param {Object} payload - 令牌载荷
   * @param {Object} options - 选项
   * @returns {Promise<string>} JWT令牌
   */
  async generateToken(payload, options = {}) {
    const startTime = performance.now();
    
    try {
      const tokenType = options.type || TokenType.ACCESS;
      const secret = options.secret || this.options.tokenSecret;
      const expiry = options.expiry || this.options.tokenExpiry;
      
      // 创建载荷
      const now = Math.floor(Date.now() / 1000);
      const tokenPayload = {
        ...payload,
        iat: now,
        exp: now + timeUtils.parseDuration(expiry) / 1000,
        type: tokenType,
        jti: crypto.randomBytes(16).toString('hex')
      };
      
      // 生成JWT
      const jwt = await this._generateJWT(tokenPayload, secret);
      
      // 更新统计信息
      this.stats.tokenIssuances++;
      
      const duration = performance.now() - startTime;
      performanceUtils.recordTimer('auth.generateToken', duration);
      
      logger.debug('令牌生成成功', {
        type: tokenType,
        userId: payload.sub || payload.userId,
        expiry,
        duration,
        requestId: logContext.getRequestId()
      });
      
      this.emit('auth.tokenGenerated', {
        type: tokenType,
        userId: payload.sub || payload.userId
      });
      
      return jwt;
    } catch (error) {
      logger.error('令牌生成失败', {
        error: error.message,
        payloadKeys: Object.keys(payload).join(', '),
        requestId: logContext.getRequestId()
      });
      throw error;
    }
  }

  /**
   * 生成JWT（简化版，不依赖外部库）
   * @param {Object} payload - 载荷
   * @param {string} secret - 密钥
   * @returns {Promise<string>} JWT字符串
   * @private
   */
  async _generateJWT(payload, secret) {
    // 头部
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };
    
    // 编码
    const encodedHeader = this._base64url(JSON.stringify(header));
    const encodedPayload = this._base64url(JSON.stringify(payload));
    
    // 签名
    const signature = this._createHMAC(`${encodedHeader}.${encodedPayload}`, secret);
    
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  /**
   * 验证JWT令牌
   * @param {string} token - JWT令牌
   * @param {Object} options - 选项
   * @returns {Promise<Object>} 令牌载荷
   */
  async verifyToken(token, options = {}) {
    const startTime = performance.now();
    
    try {
      const secret = options.secret || this.options.tokenSecret;
      const requiredType = options.type;
      
      // 检查令牌是否在黑名单中
      if (this._isTokenBlacklisted(token)) {
        throw new Error('令牌已被撤销');
      }
      
      // 验证JWT
      const payload = await this._verifyJWT(token, secret);
      
      // 验证令牌类型
      if (requiredType && payload.type !== requiredType) {
        throw new Error(`无效的令牌类型，期望: ${requiredType}，实际: ${payload.type}`);
      }
      
      const duration = performance.now() - startTime;
      performanceUtils.recordTimer('auth.verifyToken', duration);
      
      logger.debug('令牌验证成功', {
        type: payload.type,
        userId: payload.sub || payload.userId,
        duration,
        requestId: logContext.getRequestId()
      });
      
      return payload;
    } catch (error) {
      logger.warn('令牌验证失败', {
        error: error.message,
        requestId: logContext.getRequestId()
      });
      throw error;
    }
  }

  /**
   * 验证JWT（简化版）
   * @param {string} token - JWT字符串
   * @param {string} secret - 密钥
   * @returns {Promise<Object>} 令牌载荷
   * @private
   */
  async _verifyJWT(token, secret) {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('无效的JWT格式');
    }
    
    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    
    // 验证签名
    const expectedSignature = this._createHMAC(`${encodedHeader}.${encodedPayload}`, secret);
    if (!crypto.timingSafeEqual(Buffer.from(encodedSignature), Buffer.from(expectedSignature))) {
      throw new Error('无效的JWT签名');
    }
    
    // 解析载荷
    try {
      const payload = JSON.parse(this._unbase64url(encodedPayload));
      
      // 检查过期时间
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        throw new Error('JWT已过期');
      }
      
      // 检查生效时间
      if (payload.nbf && payload.nbf > now) {
        throw new Error('JWT尚未生效');
      }
      
      return payload;
    } catch (error) {
      if (error.message === 'JWT已过期' || error.message === 'JWT尚未生效') {
        throw error;
      }
      throw new Error('无效的JWT载荷');
    }
  }

  /**
   * 刷新令牌
   * @param {string} refreshToken - 刷新令牌
   * @param {Function} validateUser - 用户验证函数
   * @param {Object} options - 选项
   * @returns {Promise<Object>} 新的令牌对
   */
  async refreshToken(refreshToken, validateUser, options = {}) {
    const startTime = performance.now();
    
    try {
      // 验证刷新令牌
      const payload = await this.verifyToken(refreshToken, {
        ...options,
        type: TokenType.REFRESH
      });
      
      // 获取用户ID
      const userId = payload.sub || payload.userId;
      if (!userId) {
        throw new Error('刷新令牌中缺少用户ID');
      }
      
      // 验证用户是否仍然有效
      const user = await validateUser(userId);
      if (!user) {
        throw new Error('用户不存在或已被禁用');
      }
      
      // 生成新的访问令牌
      const accessToken = await this.generateToken({
        sub: userId,
        username: user.username,
        roles: user.roles,
        permissions: user.permissions
      }, options);
      
      // 生成新的刷新令牌
      const newRefreshToken = await this.generateToken({
        sub: userId
      }, {
        ...options,
        type: TokenType.REFRESH,
        expiry: options.refreshTokenExpiry || this.options.refreshTokenExpiry
      });
      
      // 撤销旧的刷新令牌
      await this.invalidateToken(refreshToken);
      
      // 更新统计信息
      this.stats.tokenRefreshes++;
      
      const duration = performance.now() - startTime;
      performanceUtils.recordTimer('auth.refreshToken', duration);
      
      logger.info('令牌刷新成功', {
        userId,
        duration,
        requestId: logContext.getRequestId()
      });
      
      this.emit('auth.tokenRefreshed', {
        userId
      });
      
      return {
        accessToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      logger.warn('令牌刷新失败', {
        error: error.message,
        duration: performance.now() - startTime,
        requestId: logContext.getRequestId()
      });
      throw error;
    }
  }

  /**
   * 撤销令牌
   * @param {string} token - 要撤销的令牌
   * @param {Object} options - 选项
   * @returns {Promise<boolean>} 撤销结果
   */
  async invalidateToken(token, options = {}) {
    try {
      // 尝试解析令牌以获取过期时间
      let expiry = null;
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(this._unbase64url(parts[1]));
          if (payload.exp) {
            expiry = payload.exp * 1000; // 转换为毫秒
          }
        }
      } catch (error) {
        // 解析失败，使用默认过期时间
        expiry = Date.now() + 24 * 60 * 60 * 1000; // 24小时
      }
      
      // 将令牌添加到黑名单
      this._blacklistedTokens.add({
        token,
        expiresAt: expiry,
        invalidatedAt: Date.now()
      });
      
      // 更新统计信息
      this.stats.tokenInvalidations++;
      
      logger.info('令牌已撤销', {
        requestId: logContext.getRequestId()
      });
      
      this.emit('auth.tokenInvalidated');
      
      return true;
    } catch (error) {
      logger.error('令牌撤销失败', {
        error: error.message,
        requestId: logContext.getRequestId()
      });
      return false;
    }
  }

  /**
   * 检查令牌是否在黑名单中
   * @param {string} token - 要检查的令牌
   * @returns {boolean} 是否在黑名单中
   * @private
   */
  _isTokenBlacklisted(token) {
    for (const tokenInfo of this._blacklistedTokens) {
      if (tokenInfo && tokenInfo.token === token) {
        // 检查是否已过期
        if (tokenInfo.expiresAt && tokenInfo.expiresAt < Date.now()) {
          this._blacklistedTokens.delete(tokenInfo);
          return false;
        }
        return true;
      }
    }
    return false;
  }

  /**
   * 创建API密钥
   * @param {Object} metadata - API密钥元数据
   * @param {Object} options - 选项
   * @returns {Promise<Object>} 包含API密钥和ID的对象
   */
  async createApiKey(metadata, options = {}) {
    const keyId = crypto.randomBytes(16).toString('hex');
    const secretKey = this._generateRandomSecret(32);
    const expiry = options.expiry ? Date.now() + timeUtils.parseDuration(options.expiry) : null;
    
    const apiKey = {
      id: keyId,
      key: secretKey,
      fullKey: `${keyId}.${secretKey}`,
      createdAt: new Date().toISOString(),
      expiresAt: expiry ? new Date(expiry).toISOString() : null,
      ...metadata
    };
    
    // 存储API密钥（实际应用中应加密存储）
    this._apiKeys.set(keyId, apiKey);
    
    logger.info('API密钥创建成功', {
      keyId,
      client: metadata.client || 'unknown',
      requestId: logContext.getRequestId()
    });
    
    this.emit('auth.apiKeyCreated', {
      keyId,
      client: metadata.client
    });
    
    return apiKey;
  }

  /**
   * 验证API密钥
   * @param {string} apiKey - API密钥
   * @returns {Promise<Object|null>} 验证结果
   */
  async verifyApiKey(apiKey) {
    try {
      const [keyId, secretKey] = apiKey.split('.');
      
      const storedKey = this._apiKeys.get(keyId);
      if (!storedKey) {
        return null;
      }
      
      // 检查是否过期
      if (storedKey.expiresAt && new Date(storedKey.expiresAt) < new Date()) {
        return null;
      }
      
      // 验证密钥
      if (crypto.timingSafeEqual(Buffer.from(secretKey), Buffer.from(storedKey.key))) {
        return storedKey;
      }
      
      return null;
    } catch (error) {
      logger.warn('API密钥验证失败', {
        error: error.message,
        requestId: logContext.getRequestId()
      });
      return null;
    }
  }

  /**
   * 撤销API密钥
   * @param {string} keyId - API密钥ID
   * @returns {Promise<boolean>} 撤销结果
   */
  async revokeApiKey(keyId) {
    const result = this._apiKeys.delete(keyId);
    
    if (result) {
      logger.info('API密钥已撤销', {
        keyId,
        requestId: logContext.getRequestId()
      });
      
      this.emit('auth.apiKeyRevoked', {
        keyId
      });
    }
    
    return result;
  }

  /**
   * 生成随机密码
   * @param {Object} options - 选项
   * @returns {string} 随机密码
   */
  generateRandomPassword(options = {}) {
    const length = options.length || 12;
    const useUppercase = options.useUppercase !== undefined ? options.useUppercase : true;
    const useLowercase = options.useLowercase !== undefined ? options.useLowercase : true;
    const useNumbers = options.useNumbers !== undefined ? options.useNumbers : true;
    const useSymbols = options.useSymbols !== undefined ? options.useSymbols : true;
    
    let charset = '';
    let password = '';
    
    if (useLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (useUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (useNumbers) charset += '0123456789';
    if (useSymbols) charset += '!@#$%^&*()-_=+[]{}|;:,.<>?';
    
    if (charset === '') {
      charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    }
    
    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, charset.length);
      password += charset[randomIndex];
    }
    
    return password;
  }

  /**
   * 检查密码强度
   * @param {string} password - 要检查的密码
   * @returns {Object} 密码强度评估
   */
  checkPasswordStrength(password) {
    let strength = 0;
    const feedback = [];
    
    // 长度检查
    if (password.length >= 12) {
      strength += 25;
    } else if (password.length >= 8) {
      strength += 15;
      feedback.push('密码长度建议至少12个字符');
    } else {
      feedback.push('密码长度过短，建议至少8个字符');
    }
    
    // 包含小写字母
    if (/[a-z]/.test(password)) {
      strength += 15;
    } else {
      feedback.push('应包含小写字母');
    }
    
    // 包含大写字母
    if (/[A-Z]/.test(password)) {
      strength += 15;
    } else {
      feedback.push('应包含大写字母');
    }
    
    // 包含数字
    if (/[0-9]/.test(password)) {
      strength += 15;
    } else {
      feedback.push('应包含数字');
    }
    
    // 包含特殊字符
    if (/[^a-zA-Z0-9]/.test(password)) {
      strength += 15;
    } else {
      feedback.push('应包含特殊字符');
    }
    
    // 检查连续字符
    if (/([a-zA-Z0-9])\1{2,}/.test(password)) {
      strength -= 10;
      feedback.push('避免使用连续重复字符');
    }
    
    // 检查键盘序列
    const keyboardSequences = [
      'qwerty', 'asdfgh', 'zxcvbn', '12345', '54321',
      'qazwsx', 'wsxedc', 'asdzxc', 'poiuyt', 'lkjhgf'
    ];
    
    for (const sequence of keyboardSequences) {
      if (password.toLowerCase().includes(sequence)) {
        strength -= 10;
        feedback.push('避免使用键盘序列');
        break;
      }
    }
    
    // 确保强度在0-100之间
    strength = Math.max(0, Math.min(100, strength));
    
    // 确定强度级别
    let level = '弱';
    if (strength >= 80) {
      level = '强';
    } else if (strength >= 60) {
      level = '中强';
    } else if (strength >= 40) {
      level = '中';
    }
    
    return {
      strength,
      level,
      feedback,
      suggestions: feedback.length > 0 ? feedback : ['密码强度良好']
    };
  }

  /**
   * Base64URL编码
   * @param {string} str - 要编码的字符串
   * @returns {string} Base64URL编码后的字符串
   * @private
   */
  _base64url(str) {
    return Buffer.from(str)
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }

  /**
   * Base64URL解码
   * @param {string} str - 要解码的字符串
   * @returns {string} 解码后的字符串
   * @private
   */
  _unbase64url(str) {
    const padded = str.padEnd(str.length + ((4 - str.length % 4) % 4), '=');
    return Buffer.from(padded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString();
  }

  /**
   * 创建HMAC签名
   * @param {string} data - 要签名的数据
   * @param {string} secret - 密钥
   * @returns {string} HMAC签名
   * @private
   */
  _createHMAC(data, secret) {
    return crypto.createHmac('sha256', secret)
      .update(data)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }

  /**
   * 获取统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    return {
      ...this.stats,
      activeSessions: this._sessions.size,
      activeApiKeys: this._apiKeys.size,
      blacklistedTokens: this._blacklistedTokens.size,
      lockedAccounts: Array.from(this._failedAttempts.values())
        .filter(attempt => attempt.lockoutUntil && attempt.lockoutUntil > Date.now())
        .length
    };
  }

  /**
   * 重置统计信息
   */
  resetStats() {
    this.stats = {
      authentications: 0,
      successfulAuthentications: 0,
      failedAuthentications: 0,
      tokenIssuances: 0,
      tokenRefreshes: 0,
      tokenInvalidations: 0,
      passwordChanges: 0,
      lockouts: 0
    };
    
    logger.debug('认证工具统计信息已重置');
  }

  /**
   * 创建Express认证中间件
   * @param {Object} options - 中间件选项
   * @returns {Function} Express中间件
   */
  createAuthMiddleware(options = {}) {
    return async (req, res, next) => {
      try {
        const strategy = options.strategy || this.options.defaultStrategy;
        
        switch (strategy) {
          case AuthStrategy.JWT:
            await this._jwtAuthMiddleware(req, res, next, options);
            break;
          case AuthStrategy.API_KEY:
            await this._apiKeyAuthMiddleware(req, res, next, options);
            break;
          case AuthStrategy.BASIC:
            await this._basicAuthMiddleware(req, res, next, options);
            break;
          default:
            throw new Error(`不支持的认证策略: ${strategy}`);
        }
      } catch (error) {
        res.status(401).json({
          error: '未授权',
          message: error.message,
          code: 'UNAUTHORIZED'
        });
      }
    };
  }

  /**
   * JWT认证中间件
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - 下一个中间件
   * @param {Object} options - 选项
   * @private
   */
  async _jwtAuthMiddleware(req, res, next, options = {}) {
    // 从头部获取令牌
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new Error('缺少授权头部');
    }
    
    const [bearer, token] = authHeader.split(' ');
    if (bearer !== 'Bearer' || !token) {
      throw new Error('无效的授权头部格式');
    }
    
    // 验证令牌
    const payload = await this.verifyToken(token, options);
    
    // 将用户信息附加到请求
    req.user = payload;
    req.token = token;
    
    next();
  }

  /**
   * API密钥认证中间件
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - 下一个中间件
   * @param {Object} options - 选项
   * @private
   */
  async _apiKeyAuthMiddleware(req, res, next, options = {}) {
    // 从头部或查询参数获取API密钥
    let apiKey = req.headers['x-api-key'] || req.query.api_key;
    if (!apiKey) {
      throw new Error('缺少API密钥');
    }
    
    // 验证API密钥
    const keyInfo = await this.verifyApiKey(apiKey);
    if (!keyInfo) {
      throw new Error('无效的API密钥');
    }
    
    // 将API密钥信息附加到请求
    req.apiKey = keyInfo;
    
    next();
  }

  /**
   * 基本认证中间件
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - 下一个中间件
   * @param {Object} options - 选项
   * @private
   */
  async _basicAuthMiddleware(req, res, next, options = {}) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new Error('缺少授权头部');
    }
    
    const [basic, credentials] = authHeader.split(' ');
    if (basic !== 'Basic' || !credentials) {
      throw new Error('无效的授权头部格式');
    }
    
    // 解码凭据
    const decoded = Buffer.from(credentials, 'base64').toString('utf8');
    const [username, password] = decoded.split(':');
    
    if (!username || !password) {
      throw new Error('无效的凭据格式');
    }
    
    // 验证用户
    const validateUser = options.validateUser || (async () => null);
    const result = await this.authenticate(username, password, validateUser);
    
    // 将用户信息附加到请求
    req.user = result.user;
    
    next();
  }

  /**
   * 静态实例
   * @private
   */
  static _instance = null;

  /**
   * 获取单例实例
   * @param {Object} options - 配置选项
   * @returns {AuthenticationUtils} 认证工具实例
   */
  static getInstance(options = {}) {
    if (!AuthenticationUtils._instance) {
      AuthenticationUtils._instance = new AuthenticationUtils(options);
    }
    return AuthenticationUtils._instance;
  }

  /**
   * 创建新的认证工具实例
   * @param {Object} options - 配置选项
   * @returns {AuthenticationUtils} 认证工具实例
   */
  static create(options = {}) {
    return new AuthenticationUtils(options);
  }
}

// 创建默认实例
const defaultAuthUtils = AuthenticationUtils.getInstance();

module.exports = {
  AuthenticationUtils,
  authUtils: defaultAuthUtils,
  AuthStrategy,
  TokenType,
  HashAlgorithm
};