/**
 * JWT认证管理器
 * 提供令牌生成、验证、刷新等功能
 */

const jwt = require('jsonwebtoken');
const { AppError } = require('../../exception/handlers/errorHandler');
const { SecurityConfigManager } = require('../config/SecurityConfigManager');
const { EncryptionUtils } = require('../../utils/encryption/EncryptionUtils');
const logger = require('../../utils/logger');

/**
 * JWT认证管理器
 */
class JwtManager {
  /**
   * 构造函数
   * @param {Object} options - JWT配置选项
   */
  constructor(options = {}) {
    // 获取安全配置
    this.securityConfig = SecurityConfigManager.getInstance();
    
    // 默认配置
    this.defaults = {
      accessTokenSecret: this.securityConfig.get('jwt.accessTokenSecret') || EncryptionUtils.generateRandomKey(32),
      refreshTokenSecret: this.securityConfig.get('jwt.refreshTokenSecret') || EncryptionUtils.generateRandomKey(32),
      accessTokenExpiresIn: this.securityConfig.get('jwt.accessTokenExpiresIn') || '15m',
      refreshTokenExpiresIn: this.securityConfig.get('jwt.refreshTokenExpiresIn') || '7d',
      issuer: this.securityConfig.get('jwt.issuer') || 'api-server',
      audience: this.securityConfig.get('jwt.audience') || 'api-clients',
      algorithms: ['HS256'],
      ...options
    };
    
    // 验证配置有效性
    this._validateConfig();
    
    logger.info('JWT管理器初始化完成');
  }

  /**
   * 验证配置有效性
   * @private
   */
  _validateConfig() {
    if (!this.defaults.accessTokenSecret || this.defaults.accessTokenSecret.length < 16) {
      throw new Error('访问令牌密钥必须至少16个字符');
    }
    
    if (!this.defaults.refreshTokenSecret || this.defaults.refreshTokenSecret.length < 16) {
      throw new Error('刷新令牌密钥必须至少16个字符');
    }
  }

  /**
   * 生成访问令牌
   * @param {Object} payload - 令牌载荷
   * @param {Object} options - 生成选项
   * @returns {string} JWT令牌
   */
  generateAccessToken(payload, options = {}) {
    const tokenOptions = {
      expiresIn: this.defaults.accessTokenExpiresIn,
      issuer: this.defaults.issuer,
      audience: this.defaults.audience,
      algorithm: this.defaults.algorithms[0],
      ...options
    };

    try {
      // 添加令牌类型标识
      const enrichedPayload = {
        ...payload,
        type: 'access'
      };

      const token = jwt.sign(enrichedPayload, this.defaults.accessTokenSecret, tokenOptions);
      logger.debug('访问令牌生成成功', { userId: payload.sub || payload.userId });
      return token;
    } catch (error) {
      logger.error('生成访问令牌失败', { error });
      throw new AppError('生成访问令牌失败', 500, error);
    }
  }

  /**
   * 生成刷新令牌
   * @param {Object} payload - 令牌载荷
   * @param {Object} options - 生成选项
   * @returns {string} JWT令牌
   */
  generateRefreshToken(payload, options = {}) {
    const tokenOptions = {
      expiresIn: this.defaults.refreshTokenExpiresIn,
      issuer: this.defaults.issuer,
      audience: this.defaults.audience,
      algorithm: this.defaults.algorithms[0],
      ...options
    };

    try {
      // 添加令牌类型标识和随机jti以增强安全性
      const enrichedPayload = {
        ...payload,
        type: 'refresh',
        jti: EncryptionUtils.generateUUID()
      };

      const token = jwt.sign(enrichedPayload, this.defaults.refreshTokenSecret, tokenOptions);
      logger.debug('刷新令牌生成成功', { userId: payload.sub || payload.userId });
      return token;
    } catch (error) {
      logger.error('生成刷新令牌失败', { error });
      throw new AppError('生成刷新令牌失败', 500, error);
    }
  }

  /**
   * 生成令牌对（访问令牌+刷新令牌）
   * @param {Object} payload - 用户信息载荷
   * @param {Object} options - 生成选项
   * @returns {Object} 令牌对
   */
  generateTokenPair(payload, options = {}) {
    // 基础载荷
    const basePayload = {
      sub: payload.userId || payload.id || payload.sub,
      username: payload.username || payload.email,
      roles: payload.roles || [],
      ...payload,
      // 移除敏感信息
      password: undefined,
      refreshToken: undefined
    };

    const accessToken = this.generateAccessToken(basePayload, options.accessTokenOptions);
    const refreshToken = this.generateRefreshToken(basePayload, options.refreshTokenOptions);

    // 解析访问令牌过期时间
    const accessTokenExpiresAt = this.getTokenExpiration(accessToken);
    const refreshTokenExpiresAt = this.getTokenExpiration(refreshToken);

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
      expiresIn: Math.floor((accessTokenExpiresAt - Date.now()) / 1000)
    };
  }

  /**
   * 验证访问令牌
   * @param {string} token - 要验证的令牌
   * @param {Object} options - 验证选项
   * @returns {Object} 解码后的令牌载荷
   */
  verifyAccessToken(token, options = {}) {
    const verifyOptions = {
      issuer: this.defaults.issuer,
      audience: this.defaults.audience,
      algorithms: this.defaults.algorithms,
      ...options
    };

    try {
      const decoded = jwt.verify(token, this.defaults.accessTokenSecret, verifyOptions);
      
      // 验证令牌类型
      if (decoded.type !== 'access') {
        throw new AppError('无效的令牌类型', 401);
      }
      
      logger.debug('访问令牌验证成功', { userId: decoded.sub });
      return decoded;
    } catch (error) {
      logger.error('访问令牌验证失败', { error });
      
      // 转换JWT错误为应用错误
      if (error.name === 'TokenExpiredError') {
        throw new AppError('令牌已过期', 401, error);
      } else if (error.name === 'JsonWebTokenError') {
        throw new AppError('无效的令牌', 401, error);
      } else if (error.name === 'NotBeforeError') {
        throw new AppError('令牌尚未生效', 401, error);
      }
      
      throw error;
    }
  }

  /**
   * 验证刷新令牌
   * @param {string} token - 要验证的令牌
   * @param {Object} options - 验证选项
   * @returns {Object} 解码后的令牌载荷
   */
  verifyRefreshToken(token, options = {}) {
    const verifyOptions = {
      issuer: this.defaults.issuer,
      audience: this.defaults.audience,
      algorithms: this.defaults.algorithms,
      ...options
    };

    try {
      const decoded = jwt.verify(token, this.defaults.refreshTokenSecret, verifyOptions);
      
      // 验证令牌类型
      if (decoded.type !== 'refresh') {
        throw new AppError('无效的令牌类型', 401);
      }
      
      logger.debug('刷新令牌验证成功', { userId: decoded.sub });
      return decoded;
    } catch (error) {
      logger.error('刷新令牌验证失败', { error });
      
      // 转换JWT错误为应用错误
      if (error.name === 'TokenExpiredError') {
        throw new AppError('刷新令牌已过期', 401, error);
      } else if (error.name === 'JsonWebTokenError') {
        throw new AppError('无效的刷新令牌', 401, error);
      } else if (error.name === 'NotBeforeError') {
        throw new AppError('刷新令牌尚未生效', 401, error);
      }
      
      throw error;
    }
  }

  /**
   * 解码令牌（不验证签名）
   * @param {string} token - 要解码的令牌
   * @returns {Object} 解码后的令牌载荷
   */
  decodeToken(token) {
    try {
      return jwt.decode(token, { complete: true });
    } catch (error) {
      logger.error('令牌解码失败', { error });
      throw new AppError('无效的令牌格式', 401, error);
    }
  }

  /**
   * 使用刷新令牌获取新的访问令牌
   * @param {string} refreshToken - 刷新令牌
   * @param {Object} options - 选项
   * @returns {Object} 新的令牌对
   */
  async refreshToken(refreshToken, options = {}) {
    try {
      // 验证刷新令牌
      const decoded = this.verifyRefreshToken(refreshToken);
      
      // 检查是否在黑名单中（如果有实现）
      if (options.checkBlacklist && typeof options.checkBlacklist === 'function') {
        const isBlacklisted = await options.checkBlacklist(decoded.jti);
        if (isBlacklisted) {
          throw new AppError('刷新令牌已被撤销', 401);
        }
      }
      
      // 根据业务需求可能需要更新载荷信息
      const payload = options.updatePayload 
        ? await options.updatePayload(decoded) 
        : decoded;
      
      // 生成新的令牌对
      const newTokenPair = this.generateTokenPair(payload, {
        accessTokenOptions: options.accessTokenOptions,
        refreshTokenOptions: options.refreshTokenOptions
      });
      
      logger.debug('令牌刷新成功', { userId: decoded.sub });
      return newTokenPair;
    } catch (error) {
      logger.error('令牌刷新失败', { error });
      throw error;
    }
  }

  /**
   * 撤销令牌（添加到黑名单）
   * @param {string} token - 要撤销的令牌
   * @param {Object} options - 选项
   * @returns {Promise<boolean>} 是否成功撤销
   */
  async revokeToken(token, options = {}) {
    try {
      // 解码令牌以获取信息
      const decoded = this.decodeToken(token);
      
      if (!decoded || !decoded.payload) {
        throw new AppError('无效的令牌', 400);
      }
      
      const { payload } = decoded;
      const tokenId = payload.jti;
      
      if (!tokenId) {
        throw new AppError('令牌缺少必要的标识符', 400);
      }
      
      // 计算令牌剩余有效期
      const expiresIn = Math.max(0, payload.exp * 1000 - Date.now());
      
      // 调用黑名单服务
      if (options.blacklistService && typeof options.blacklistService.add === 'function') {
        await options.blacklistService.add(tokenId, expiresIn / 1000);
        logger.debug('令牌已撤销', { userId: payload.sub, tokenId });
        return true;
      }
      
      throw new AppError('撤销令牌服务不可用', 500);
    } catch (error) {
      logger.error('撤销令牌失败', { error });
      throw error;
    }
  }

  /**
   * 获取令牌过期时间
   * @param {string} token - JWT令牌
   * @returns {number} 过期时间戳
   */
  getTokenExpiration(token) {
    try {
      const decoded = jwt.decode(token);
      if (!decoded || !decoded.exp) {
        throw new Error('令牌缺少过期时间');
      }
      return decoded.exp * 1000; // 转换为毫秒
    } catch (error) {
      logger.error('获取令牌过期时间失败', { error });
      throw new AppError('无效的令牌格式', 401, error);
    }
  }

  /**
   * 检查令牌是否即将过期
   * @param {string} token - JWT令牌
   * @param {number} thresholdSeconds - 阈值秒数
   * @returns {boolean} 是否即将过期
   */
  isTokenExpiringSoon(token, thresholdSeconds = 300) {
    try {
      const expiresAt = this.getTokenExpiration(token);
      const now = Date.now();
      const timeUntilExpiration = expiresAt - now;
      
      return timeUntilExpiration > 0 && timeUntilExpiration < thresholdSeconds * 1000;
    } catch {
      return true; // 如果无法解析，视为即将过期
    }
  }

  /**
   * 从请求中提取令牌
   * @param {Object} req - Express请求对象
   * @param {string} headerName - 头部名称
   * @param {string} queryParam - 查询参数名
   * @returns {string|null} 提取的令牌
   */
  extractToken(req, headerName = 'Authorization', queryParam = 'token') {
    // 从请求头中提取
    if (req.headers[headerName]) {
      const authHeader = req.headers[headerName];
      if (authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
      }
      return authHeader;
    }

    // 从查询参数中提取
    if (req.query && req.query[queryParam]) {
      return req.query[queryParam];
    }

    // 从cookie中提取（如果有）
    if (req.cookies && req.cookies[queryParam]) {
      return req.cookies[queryParam];
    }

    return null;
  }

  /**
   * 创建JWT认证中间件
   * @param {Object} options - 中间件选项
   * @returns {Function} Express中间件
   */
  createAuthMiddleware(options = {}) {
    const {
      extractToken = this.extractToken.bind(this),
      tokenType = 'access',
      onError,
      onSuccess
    } = options;

    return async (req, res, next) => {
      try {
        // 提取令牌
        const token = extractToken(req);
        if (!token) {
          throw new AppError('未提供认证令牌', 401);
        }

        // 验证令牌
        const decoded = tokenType === 'access' 
          ? this.verifyAccessToken(token) 
          : this.verifyRefreshToken(token);

        // 将用户信息附加到请求对象
        req.user = decoded;
        req.authToken = token;

        // 调用成功回调
        if (onSuccess) {
          await onSuccess(req, res, decoded);
        }

        next();
      } catch (error) {
        // 调用错误回调
        if (onError) {
          return onError(error, req, res, next);
        }

        // 默认错误处理
        const statusCode = error.statusCode || 401;
        const message = error.message || '认证失败';
        
        res.status(statusCode).json({
          error: 'AuthenticationError',
          message,
          code: statusCode
        });
      }
    };
  }

  /**
   * 创建可选的认证中间件（不强制要求认证）
   * @param {Object} options - 中间件选项
   * @returns {Function} Express中间件
   */
  createOptionalAuthMiddleware(options = {}) {
    const {
      extractToken = this.extractToken.bind(this),
      onSuccess
    } = options;

    return async (req, res, next) => {
      try {
        // 尝试提取并验证令牌
        const token = extractToken(req);
        if (token) {
          try {
            const decoded = this.verifyAccessToken(token);
            req.user = decoded;
            req.authToken = token;
            
            if (onSuccess) {
              await onSuccess(req, res, decoded);
            }
          } catch (error) {
            // 令牌无效时不中断请求，仅记录警告
            logger.warn('可选认证令牌验证失败', { error });
          }
        }
      } catch (error) {
        logger.error('可选认证中间件错误', { error });
      }
      
      // 无论如何都继续处理请求
      next();
    };
  }

  /**
   * 生成带有角色权限的令牌
   * @param {Object} userInfo - 用户信息
   * @param {Array<string>} permissions - 权限列表
   * @param {Object} options - 生成选项
   * @returns {Object} 令牌对
   */
  generateTokenWithPermissions(userInfo, permissions = [], options = {}) {
    const payload = {
      ...userInfo,
      permissions: permissions,
      // 添加权限验证辅助信息
      perm: permissions.reduce((acc, permission) => {
        acc[permission] = true;
        return acc;
      }, {})
    };

    return this.generateTokenPair(payload, options);
  }

  /**
   * 验证令牌是否包含指定权限
   * @param {string} token - JWT令牌
   * @param {string|Array<string>} requiredPermissions - 所需权限
   * @returns {boolean} 是否有权限
   */
  hasPermission(token, requiredPermissions) {
    try {
      const decoded = this.decodeToken(token).payload;
      const userPermissions = decoded.permissions || [];
      const userPermMap = decoded.perm || {};

      if (Array.isArray(requiredPermissions)) {
        // 检查所有权限是否都具备（AND关系）
        return requiredPermissions.every(permission => 
          userPermissions.includes(permission) || userPermMap[permission]
        );
      } else {
        // 检查单个权限
        return userPermissions.includes(requiredPermissions) || 
               userPermMap[requiredPermissions];
      }
    } catch {
      return false;
    }
  }

  /**
   * 生成临时令牌
   * @param {Object} payload - 令牌载荷
   * @param {number} expiresIn - 过期时间（秒）
   * @returns {string} 临时令牌
   */
  generateTemporaryToken(payload, expiresIn = 300) {
    const enrichedPayload = {
      ...payload,
      type: 'temporary',
      temp: true,
      jti: EncryptionUtils.generateUUID()
    };

    return jwt.sign(enrichedPayload, this.defaults.accessTokenSecret, {
      expiresIn,
      issuer: this.defaults.issuer,
      audience: this.defaults.audience
    });
  }

  /**
   * 设置新的密钥（用于密钥轮换）
   * @param {string} type - 密钥类型 ('access' 或 'refresh')
   * @param {string} newSecret - 新密钥
   * @returns {boolean} 是否成功设置
   */
  rotateSecret(type, newSecret) {
    if (!newSecret || newSecret.length < 16) {
      throw new Error('新密钥必须至少16个字符');
    }

    if (type === 'access') {
      this.defaults.accessTokenSecret = newSecret;
      logger.info('访问令牌密钥已轮换');
      return true;
    } else if (type === 'refresh') {
      this.defaults.refreshTokenSecret = newSecret;
      logger.info('刷新令牌密钥已轮换');
      return true;
    }

    throw new Error('无效的密钥类型');
  }

  /**
   * 获取JWT配置信息（不包含敏感信息）
   * @returns {Object} 配置信息
   */
  getConfigInfo() {
    return {
      accessTokenExpiresIn: this.defaults.accessTokenExpiresIn,
      refreshTokenExpiresIn: this.defaults.refreshTokenExpiresIn,
      issuer: this.defaults.issuer,
      audience: this.defaults.audience,
      algorithms: this.defaults.algorithms
    };
  }
}

// 导出单例实例
const jwtManager = new JwtManager();
module.exports = {
  JwtManager,
  jwtManager
};