/**
 * 认证服务模块
 * 负责用户认证、JWT令牌管理、密码加密等功能
 */
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// 导入依赖
const config = require('../config/config');
const logger = require('../logging/logger');
const {
  AppError,
  AuthenticationError,
  AuthorizationError
} = require('../errors/appError');
const stringUtils = require('../utils/stringUtils');

/**
 * 认证服务类
 */
class AuthService {
  constructor(di) {
    this.di = di;
    this.userRepository = di.get('userRepository');
    this.cacheService = di.get('cacheService');
  }

  /**
   * 验证用户凭据
   * @param {string} email - 用户邮箱
   * @param {string} password - 用户密码
   * @returns {Promise<Object>} 用户信息
   */
  async verifyCredentials(email, password) {
    try {
      // 查找用户
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        throw AuthenticationError.invalidCredentials('Invalid email or password');
      }

      // 检查用户状态
      if (!user.is_active) {
        throw AuthenticationError.unauthorized('Account is deactivated');
      }

      // 验证密码
      const isMatch = await this.comparePasswords(password, user.password_hash);
      if (!isMatch) {
        throw AuthenticationError.invalidCredentials('Invalid email or password');
      }

      // 清除密码哈希等敏感信息
      const userData = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        is_active: user.is_active,
        last_login: user.last_login
      };

      // 更新最后登录时间
      await this.userRepository.updateLastLogin(user.id);

      logger.info('User login successful', { userId: user.id, email: user.email });
      return userData;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error verifying credentials', error);
      throw AuthenticationError.invalidCredentials('Invalid email or password');
    }
  }

  /**
   * 生成JWT令牌
   * @param {Object} payload - 令牌载荷
   * @param {string} type - 令牌类型 (access/refresh)
   * @returns {string} JWT令牌
   */
  generateToken(payload, type = 'access') {
    const secret = type === 'access' 
      ? config.get('security.jwt.secret')
      : config.get('security.jwt.refreshSecret');
    
    const expiresIn = type === 'access'
      ? config.get('security.jwt.expiresIn')
      : config.get('security.jwt.refreshExpiresIn');

    // 确保payload中不包含敏感信息
    const safePayload = {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      type,
      iat: Date.now()
    };

    try {
      return jwt.sign(safePayload, secret, { expiresIn });
    } catch (error) {
      logger.error('Error generating token', error);
      throw AppError.internalError('Failed to generate authentication token');
    }
  }

  /**
   * 验证JWT令牌
   * @param {string} token - JWT令牌
   * @param {string} type - 令牌类型
   * @returns {Object} 解码后的令牌载荷
   */
  verifyToken(token, type = 'access') {
    const secret = type === 'access'
      ? config.get('security.jwt.secret')
      : config.get('security.jwt.refreshSecret');

    try {
      const decoded = jwt.verify(token, secret);
      
      // 验证令牌类型
      if (decoded.type !== type) {
        throw AuthenticationError.invalidToken('Invalid token type');
      }

      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw AuthenticationError.expiredToken('Token has expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw AuthenticationError.invalidToken('Invalid token format');
      }
      throw AuthenticationError.invalidToken('Invalid or malformed token');
    }
  }

  /**
   * 刷新访问令牌
   * @param {string} refreshToken - 刷新令牌
   * @returns {Promise<Object>} 新的访问令牌
   */
  async refreshToken(refreshToken) {
    try {
      // 验证刷新令牌
      const decoded = this.verifyToken(refreshToken, 'refresh');

      // 检查令牌是否已被撤销
      const isRevoked = await this.isTokenRevoked(refreshToken);
      if (isRevoked) {
        throw AuthenticationError.invalidToken('Token has been revoked');
      }

      // 获取用户信息
      const user = await this.userRepository.findById(decoded.id);
      if (!user || !user.is_active) {
        throw AuthenticationError.unauthorized('User not found or inactive');
      }

      // 生成新的访问令牌
      const userPayload = {
        id: user.id,
        email: user.email,
        role: user.role
      };

      const newAccessToken = this.generateToken(userPayload, 'access');

      return {
        accessToken: newAccessToken,
        expiresIn: config.get('security.jwt.expiresIn')
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error refreshing token', error);
      throw AuthenticationError.invalidToken('Failed to refresh token');
    }
  }

  /**
   * 撤销令牌
   * @param {string} token - 要撤销的令牌
   * @param {string} type - 令牌类型
   * @returns {Promise<void>}
   */
  async revokeToken(token, type = 'refresh') {
    try {
      // 解码令牌以获取过期时间
      const decoded = jwt.decode(token);
      if (!decoded) {
        throw AuthenticationError.invalidToken('Invalid token');
      }

      // 计算剩余有效期
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = decoded.exp;
      const ttl = expiresAt > now ? (expiresAt - now) : 3600; // 至少保留1小时

      // 将令牌加入黑名单
      const tokenKey = `revoked_token:${type}:${token}`;
      await this.cacheService.set(tokenKey, '1', ttl);

      logger.info('Token revoked successfully', { userId: decoded.id, tokenType: type });
    } catch (error) {
      logger.error('Error revoking token', error);
      throw AppError.internalError('Failed to revoke token');
    }
  }

  /**
   * 检查令牌是否已撤销
   * @param {string} token - 要检查的令牌
   * @returns {Promise<boolean>}
   */
  async isTokenRevoked(token) {
    try {
      const tokenKey = `revoked_token:*:${token}`;
      const isRevoked = await this.cacheService.exists(tokenKey);
      return isRevoked;
    } catch (error) {
      logger.error('Error checking if token is revoked', error);
      // 发生错误时默认视为未撤销
      return false;
    }
  }

  /**
   * 加密密码
   * @param {string} password - 原始密码
   * @returns {Promise<string>} 加密后的密码
   */
  async hashPassword(password) {
    try {
      const saltRounds = config.get('security.bcrypt.saltRounds', 10);
      return await bcrypt.hash(password, saltRounds);
    } catch (error) {
      logger.error('Error hashing password', error);
      throw AppError.internalError('Failed to process password');
    }
  }

  /**
   * 比较密码
   * @param {string} plainPassword - 明文密码
   * @param {string} hashedPassword - 哈希密码
   * @returns {Promise<boolean>} 是否匹配
   */
  async comparePasswords(plainPassword, hashedPassword) {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      logger.error('Error comparing passwords', error);
      return false;
    }
  }

  /**
   * 生成密码重置令牌
   * @param {number} userId - 用户ID
   * @returns {Promise<string>} 重置令牌
   */
  async generatePasswordResetToken(userId) {
    try {
      // 生成随机令牌
      const token = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
      
      // 设置过期时间为1小时
      const expiresAt = new Date(Date.now() + 3600000);
      const expiresIn = 3600;
      
      // 存储令牌
      const tokenKey = `password_reset:${userId}`;
      await this.cacheService.set(tokenKey, hashedToken, expiresIn);
      
      logger.info('Password reset token generated', { userId });
      return {
        token,
        expiresAt
      };
    } catch (error) {
      logger.error('Error generating password reset token', error);
      throw AppError.internalError('Failed to generate password reset token');
    }
  }

  /**
   * 验证密码重置令牌
   * @param {number} userId - 用户ID
   * @param {string} token - 重置令牌
   * @returns {Promise<boolean>} 是否有效
   */
  async verifyPasswordResetToken(userId, token) {
    try {
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
      const tokenKey = `password_reset:${userId}`;
      
      const storedToken = await this.cacheService.get(tokenKey);
      if (!storedToken) {
        return false;
      }
      
      return storedToken === hashedToken;
    } catch (error) {
      logger.error('Error verifying password reset token', error);
      return false;
    }
  }

  /**
   * 撤销密码重置令牌
   * @param {number} userId - 用户ID
   * @returns {Promise<void>}
   */
  async revokePasswordResetToken(userId) {
    try {
      const tokenKey = `password_reset:${userId}`;
      await this.cacheService.delete(tokenKey);
      logger.info('Password reset token revoked', { userId });
    } catch (error) {
      logger.error('Error revoking password reset token', error);
    }
  }

  /**
   * 生成邮箱验证令牌
   * @param {number} userId - 用户ID
   * @returns {Promise<string>} 验证令牌
   */
  async generateEmailVerificationToken(userId) {
    try {
      const token = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
      
      // 设置过期时间为24小时
      const expiresAt = new Date(Date.now() + 86400000);
      const expiresIn = 86400;
      
      const tokenKey = `email_verification:${userId}`;
      await this.cacheService.set(tokenKey, hashedToken, expiresIn);
      
      logger.info('Email verification token generated', { userId });
      return {
        token,
        expiresAt
      };
    } catch (error) {
      logger.error('Error generating email verification token', error);
      throw AppError.internalError('Failed to generate email verification token');
    }
  }

  /**
   * 验证邮箱验证令牌
   * @param {number} userId - 用户ID
   * @param {string} token - 验证令牌
   * @returns {Promise<boolean>} 是否有效
   */
  async verifyEmailVerificationToken(userId, token) {
    try {
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
      const tokenKey = `email_verification:${userId}`;
      
      const storedToken = await this.cacheService.get(tokenKey);
      if (!storedToken) {
        return false;
      }
      
      return storedToken === hashedToken;
    } catch (error) {
      logger.error('Error verifying email verification token', error);
      return false;
    }
  }

  /**
   * 检查用户权限
   * @param {Object} user - 用户对象
   * @param {Array<string>} requiredPermissions - 所需权限列表
   * @returns {boolean} 是否有权限
   */
  checkPermissions(user, requiredPermissions) {
    if (!user || !user.role) {
      return false;
    }

    // 管理员角色拥有所有权限
    if (user.role === 'admin') {
      return true;
    }

    // 检查是否拥有所需的任何一个权限
    return requiredPermissions.some(permission => {
      // 根据用户角色定义权限
      const rolePermissions = this._getRolePermissions(user.role);
      return rolePermissions.includes(permission);
    });
  }

  /**
   * 获取角色权限列表
   * @private
   * @param {string} role - 角色名称
   * @returns {Array<string>} 权限列表
   */
  _getRolePermissions(role) {
    const permissions = {
      user: ['read_own_profile', 'update_own_profile', 'read_own_orders'],
      seller: ['read_own_profile', 'update_own_profile', 'manage_products', 'manage_orders'],
      admin: ['all_permissions']
    };

    return permissions[role] || [];
  }

  /**
   * 生成API密钥
   * @param {Object} user - 用户对象
   * @returns {Promise<string>} API密钥
   */
  async generateApiKey(user) {
    try {
      const apiKey = crypto.randomBytes(40).toString('hex');
      const hashedApiKey = crypto.createHash('sha256').update(apiKey).digest('hex');
      
      // 存储API密钥（简化示例，实际应存储在数据库中）
      const apiKeyData = {
        userId: user.id,
        key: hashedApiKey,
        createdAt: new Date(),
        lastUsed: null
      };
      
      const apiKeyKey = `api_key:${user.id}`;
      await this.cacheService.set(apiKeyKey, JSON.stringify(apiKeyData), 0); // 永不过期
      
      logger.info('API key generated', { userId: user.id });
      return apiKey;
    } catch (error) {
      logger.error('Error generating API key', error);
      throw AppError.internalError('Failed to generate API key');
    }
  }

  /**
   * 验证API密钥
   * @param {string} apiKey - API密钥
   * @returns {Promise<Object>} 用户信息
   */
  async verifyApiKey(apiKey) {
    try {
      const hashedApiKey = crypto.createHash('sha256').update(apiKey).digest('hex');
      
      // 查找API密钥（简化示例，实际应从数据库查询）
      // 这里使用扫描来查找匹配的API密钥，实际应用中应优化此逻辑
      const matchingUser = await this._findUserByApiKey(hashedApiKey);
      
      if (!matchingUser) {
        throw AuthenticationError.unauthorized('Invalid API key');
      }
      
      // 更新最后使用时间
      await this._updateApiKeyLastUsed(matchingUser.id);
      
      logger.info('API key verified successfully', { userId: matchingUser.id });
      return matchingUser;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error verifying API key', error);
      throw AuthenticationError.unauthorized('Invalid API key');
    }
  }

  /**
   * 查找拥有指定API密钥的用户
   * @private
   * @param {string} hashedApiKey - 哈希后的API密钥
   * @returns {Promise<Object|null>} 用户对象
   */
  async _findUserByApiKey(hashedApiKey) {
    // 这里是简化实现，实际应查询数据库
    // 此示例仅用于演示
    const users = await this.userRepository.findAll();
    for (const user of users) {
      const apiKeyKey = `api_key:${user.id}`;
      const apiKeyData = await this.cacheService.get(apiKeyKey);
      if (apiKeyData) {
        const parsedData = JSON.parse(apiKeyData);
        if (parsedData.key === hashedApiKey) {
          return user;
        }
      }
    }
    return null;
  }

  /**
   * 更新API密钥最后使用时间
   * @private
   * @param {number} userId - 用户ID
   * @returns {Promise<void>}
   */
  async _updateApiKeyLastUsed(userId) {
    const apiKeyKey = `api_key:${userId}`;
    const apiKeyData = await this.cacheService.get(apiKeyKey);
    if (apiKeyData) {
      const parsedData = JSON.parse(apiKeyData);
      parsedData.lastUsed = new Date().toISOString();
      await this.cacheService.set(apiKeyKey, JSON.stringify(parsedData), 0);
    }
  }

  /**
   * 创建完整的认证响应
   * @param {Object} user - 用户对象
   * @returns {Promise<Object>} 认证响应
   */
  async createAuthResponse(user) {
    try {
      // 生成令牌
      const accessToken = this.generateToken(user, 'access');
      const refreshToken = this.generateToken(user, 'refresh');
      
      // 构建响应
      const authResponse = {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        tokens: {
          access: {
            token: accessToken,
            expiresIn: config.get('security.jwt.expiresIn')
          },
          refresh: {
            token: refreshToken,
            expiresIn: config.get('security.jwt.refreshExpiresIn')
          }
        },
        permissions: this._getRolePermissions(user.role)
      };

      logger.info('Auth response created', { userId: user.id });
      return authResponse;
    } catch (error) {
      logger.error('Error creating auth response', error);
      throw AppError.internalError('Failed to create authentication response');
    }
  }
}

module.exports = AuthService;