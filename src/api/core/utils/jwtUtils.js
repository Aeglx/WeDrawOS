/**
 * JWT工具类模块
 * 处理JWT令牌的生成、验证和解析等功能
 */

const jwt = require('jsonwebtoken');
const { config } = require('../config/config');
const { Logger } = require('../logging/logger');
const { AppError } = require('../errors/appError');

class JwtUtils {
  constructor() {
    this.logger = Logger.getInstance();
    this.logger.info('JWT utilities initialized');
  }

  /**
   * 生成JWT令牌
   * @param {Object} payload - 令牌载荷
   * @param {string} secret - 密钥
   * @param {string|number} expiresIn - 过期时间
   * @returns {string} JWT令牌
   */
  generateToken(payload, secret, expiresIn) {
    try {
      if (!payload || !secret) {
        throw new Error('Payload and secret are required');
      }

      // 确保payload是对象
      if (typeof payload !== 'object' || payload === null) {
        throw new Error('Payload must be an object');
      }

      // 添加发布时间
      const payloadWithIat = {
        ...payload,
        iat: Math.floor(Date.now() / 1000)
      };

      // 生成令牌
      const token = jwt.sign(payloadWithIat, secret, {
        expiresIn,
        algorithm: 'HS256'
      });

      this.logger.debug('JWT token generated successfully');
      return token;
    } catch (error) {
      this.logger.error('Failed to generate JWT token:', error);
      throw new Error('Failed to generate JWT token');
    }
  }

  /**
   * 验证JWT令牌
   * @param {string} token - JWT令牌
   * @param {string} secret - 密钥
   * @returns {Object|null} 解析后的载荷或null（如果令牌无效）
   */
  verifyToken(token, secret) {
    try {
      if (!token || !secret) {
        this.logger.warn('Token or secret is missing');
        return null;
      }

      // 验证令牌
      const decoded = jwt.verify(token, secret, {
        algorithms: ['HS256']
      });

      this.logger.debug('JWT token verified successfully');
      return decoded;
    } catch (error) {
      // 记录不同类型的错误
      if (error.name === 'TokenExpiredError') {
        this.logger.warn('JWT token has expired');
      } else if (error.name === 'JsonWebTokenError') {
        this.logger.warn('Invalid JWT token:', error.message);
      } else {
        this.logger.error('Failed to verify JWT token:', error);
      }
      return null;
    }
  }

  /**
   * 解析JWT令牌（不验证签名）
   * @param {string} token - JWT令牌
   * @returns {Object|null} 解析后的载荷或null
   */
  decodeToken(token) {
    try {
      if (!token) {
        this.logger.warn('Token is missing');
        return null;
      }

      // 解码令牌（不验证签名）
      const decoded = jwt.decode(token, { complete: false });

      if (!decoded) {
        this.logger.warn('Failed to decode JWT token');
        return null;
      }

      this.logger.debug('JWT token decoded successfully');
      return decoded;
    } catch (error) {
      this.logger.error('Failed to decode JWT token:', error);
      return null;
    }
  }

  /**
   * 生成访问令牌
   * @param {Object} payload - 令牌载荷
   * @returns {string} 访问令牌
   */
  generateAccessToken(payload) {
    try {
      const secret = config.jwt.accessSecret;
      const expiresIn = config.jwt.accessTokenExpiry || '15m';

      this.logger.debug('Generating access token');
      return this.generateToken(payload, secret, expiresIn);
    } catch (error) {
      this.logger.error('Failed to generate access token:', error);
      throw new Error('Failed to generate access token');
    }
  }

  /**
   * 生成刷新令牌
   * @param {Object} payload - 令牌载荷
   * @returns {string} 刷新令牌
   */
  generateRefreshToken(payload) {
    try {
      const secret = config.jwt.refreshSecret;
      const expiresIn = config.jwt.refreshTokenExpiry || '7d';

      this.logger.debug('Generating refresh token');
      return this.generateToken(payload, secret, expiresIn);
    } catch (error) {
      this.logger.error('Failed to generate refresh token:', error);
      throw new Error('Failed to generate refresh token');
    }
  }

  /**
   * 验证访问令牌
   * @param {string} token - 访问令牌
   * @returns {Object|null} 解析后的载荷或null
   */
  verifyAccessToken(token) {
    try {
      const secret = config.jwt.accessSecret;
      
      this.logger.debug('Verifying access token');
      return this.verifyToken(token, secret);
    } catch (error) {
      this.logger.error('Failed to verify access token:', error);
      return null;
    }
  }

  /**
   * 验证刷新令牌
   * @param {string} token - 刷新令牌
   * @returns {Object|null} 解析后的载荷或null
   */
  verifyRefreshToken(token) {
    try {
      const secret = config.jwt.refreshSecret;
      
      this.logger.debug('Verifying refresh token');
      return this.verifyToken(token, secret);
    } catch (error) {
      this.logger.error('Failed to verify refresh token:', error);
      return null;
    }
  }

  /**
   * 生成令牌对（访问令牌和刷新令牌）
   * @param {Object} payload - 令牌载荷
   * @returns {Object} 令牌对象
   */
  generateTokenPair(payload) {
    try {
      this.logger.debug('Generating token pair');
      
      return {
        accessToken: this.generateAccessToken(payload),
        refreshToken: this.generateRefreshToken(payload)
      };
    } catch (error) {
      this.logger.error('Failed to generate token pair:', error);
      throw new Error('Failed to generate token pair');
    }
  }

  /**
   * 从授权头中提取令牌
   * @param {string} authorizationHeader - 授权头字符串
   * @returns {string|null} 提取的令牌或null
   */
  extractTokenFromHeader(authorizationHeader) {
    try {
      if (!authorizationHeader) {
        this.logger.warn('Authorization header is missing');
        return null;
      }

      // 检查Bearer前缀
      const parts = authorizationHeader.split(' ');
      if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
        this.logger.warn('Invalid authorization header format');
        return null;
      }

      const token = parts[1];
      
      // 验证令牌格式
      if (!this._isValidTokenFormat(token)) {
        this.logger.warn('Invalid token format');
        return null;
      }

      return token;
    } catch (error) {
      this.logger.error('Failed to extract token from header:', error);
      return null;
    }
  }

  /**
   * 检查令牌是否过期
   * @param {string} token - JWT令牌
   * @returns {boolean} 是否已过期
   */
  isTokenExpired(token) {
    try {
      const decoded = this.decodeToken(token);
      
      if (!decoded || !decoded.exp) {
        return true;
      }

      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch (error) {
      this.logger.error('Failed to check token expiry:', error);
      return true;
    }
  }

  /**
   * 获取令牌剩余有效期（秒）
   * @param {string} token - JWT令牌
   * @returns {number} 剩余秒数，如果令牌无效或已过期则返回0
   */
  getTokenRemainingValidity(token) {
    try {
      const decoded = this.decodeToken(token);
      
      if (!decoded || !decoded.exp) {
        return 0;
      }

      const currentTime = Math.floor(Date.now() / 1000);
      const remainingSeconds = decoded.exp - currentTime;
      
      return Math.max(0, remainingSeconds);
    } catch (error) {
      this.logger.error('Failed to get token remaining validity:', error);
      return 0;
    }
  }

  /**
   * 生成用户会话令牌
   * @param {Object} userData - 用户数据
   * @returns {string} 会话令牌
   */
  generateSessionToken(userData) {
    try {
      // 准备会话令牌载荷
      const payload = {
        userId: userData.id,
        email: userData.email,
        role: userData.role,
        sessionId: this._generateSessionId()
      };

      // 使用专用的会话密钥
      const secret = config.jwt.sessionSecret || config.jwt.accessSecret;
      const expiresIn = config.jwt.sessionTokenExpiry || '24h';

      this.logger.debug('Generating session token');
      return this.generateToken(payload, secret, expiresIn);
    } catch (error) {
      this.logger.error('Failed to generate session token:', error);
      throw new Error('Failed to generate session token');
    }
  }

  /**
   * 生成临时令牌（用于密码重置、邮箱验证等）
   * @param {Object} payload - 令牌载荷
   * @param {number} expiryHours - 过期时间（小时）
   * @returns {string} 临时令牌
   */
  generateTemporaryToken(payload, expiryHours = 24) {
    try {
      // 使用临时令牌密钥
      const secret = config.jwt.temporarySecret || config.jwt.accessSecret;
      const expiresIn = `${expiryHours}h`;

      this.logger.debug('Generating temporary token');
      return this.generateToken(payload, secret, expiresIn);
    } catch (error) {
      this.logger.error('Failed to generate temporary token:', error);
      throw new Error('Failed to generate temporary token');
    }
  }

  /**
   * 刷新令牌并返回新的访问令牌
   * @param {string} refreshToken - 刷新令牌
   * @param {Function} validateUser - 用户验证函数
   * @returns {Promise<Object|null>} 新的访问令牌或null
   */
  async refreshAccessToken(refreshToken, validateUser) {
    try {
      // 验证刷新令牌
      const decoded = this.verifyRefreshToken(refreshToken);
      if (!decoded || !decoded.userId) {
        throw new Error('Invalid refresh token');
      }

      // 通过回调函数验证用户
      if (typeof validateUser !== 'function') {
        throw new Error('validateUser callback is required');
      }

      const user = await validateUser(decoded.userId);
      if (!user) {
        throw new Error('User not found');
      }

      // 生成新的访问令牌
      const newAccessToken = this.generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role
      });

      this.logger.info('Access token refreshed successfully', { userId: user.id });
      
      return {
        accessToken: newAccessToken
      };
    } catch (error) {
      this.logger.error('Failed to refresh access token:', error);
      return null;
    }
  }

  /**
   * 验证令牌并处理常见错误
   * @param {string} token - JWT令牌
   * @param {string} secret - 密钥
   * @returns {Promise<Object>} 验证结果
   * @throws {AppError} 验证失败时抛出错误
   */
  async validateTokenWithErrorHandling(token, secret) {
    try {
      const decoded = this.verifyToken(token, secret);
      
      if (!decoded) {
        throw new AppError('Invalid or expired token', 401);
      }

      // 检查令牌是否被撤销（可以从缓存或数据库中检查）
      // 这里可以添加自定义的撤销检查逻辑
      
      return decoded;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      this.logger.error('Token validation failed:', error);
      throw new AppError('Token validation failed', 401, error);
    }
  }

  /**
   * 生成唯一会话ID
   * @private
   * @returns {string} 会话ID
   */
  _generateSessionId() {
    const crypto = require('crypto');
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * 验证令牌格式
   * @private
   * @param {string} token - JWT令牌
   * @returns {boolean} 是否有效格式
   */
  _isValidTokenFormat(token) {
    // JWT令牌格式：header.payload.signature
    const parts = token.split('.');
    return parts.length === 3 && 
           parts.every(part => part.length > 0) &&
           /^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/.test(token);
  }

  /**
   * 生成设备认证令牌
   * @param {Object} deviceInfo - 设备信息
   * @param {string} userId - 用户ID
   * @returns {string} 设备令牌
   */
  generateDeviceToken(deviceInfo, userId) {
    try {
      const payload = {
        userId,
        deviceId: deviceInfo.deviceId,
        deviceType: deviceInfo.deviceType,
        deviceName: deviceInfo.deviceName,
        ipAddress: deviceInfo.ipAddress,
        userAgent: deviceInfo.userAgent
      };

      const secret = config.jwt.deviceSecret || config.jwt.refreshSecret;
      const expiresIn = config.jwt.deviceTokenExpiry || '30d';

      this.logger.debug('Generating device token');
      return this.generateToken(payload, secret, expiresIn);
    } catch (error) {
      this.logger.error('Failed to generate device token:', error);
      throw new Error('Failed to generate device token');
    }
  }
}

// 导出单例实例
const jwtUtils = new JwtUtils();

module.exports = {
  jwtUtils,
  JwtUtils
};