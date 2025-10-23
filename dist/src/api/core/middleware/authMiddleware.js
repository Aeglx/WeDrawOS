/**
 * 认证中间件
 * 负责验证用户身份和权限
 */

const { di } = require('../di/dependencyInjector');
const { AppError, AuthenticationError, AuthorizationError } = require('../exception/handlers/errorHandler');
const logger = require('../utils/logger');
const securityUtils = require('../security/securityUtils');

class AuthMiddleware {
  constructor() {
    this.authService = null;
  }

  /**
   * 初始化中间件
   */
  initialize() {
    // 从依赖注入容器获取认证服务
    this.authService = di.get('authService');
  }

  /**
   * 身份验证中间件
   * 验证用户是否已登录
   */
  authenticate() {
    return async (req, res, next) => {
      try {
        // 确保中间件已初始化
        if (!this.authService) {
          this.initialize();
        }

        // 从请求头获取token
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
          throw new AuthenticationError('缺少认证令牌', 'MISSING_TOKEN');
        }

        // 检查Bearer前缀
        const [bearer, token] = authHeader.split(' ');
        
        if (bearer !== 'Bearer' || !token) {
          throw new AuthenticationError('无效的认证格式', 'INVALID_TOKEN_FORMAT');
        }

        // 验证token
        const decoded = await this.authService.validateToken(token);
        
        if (!decoded || !decoded.userId) {
          throw new AuthenticationError('无效的认证令牌', 'INVALID_TOKEN');
        }

        // 检查token是否在缓存中（黑名单）
        const isTokenBlacklisted = await this.authService.isTokenBlacklisted(token);
        
        if (isTokenBlacklisted) {
          throw new AuthenticationError('认证令牌已被撤销', 'REVOKED_TOKEN');
        }

        // 获取用户信息
        const user = await this.authService.getUserInfo(decoded.userId);
        
        if (!user) {
          throw new AuthenticationError('用户不存在', 'USER_NOT_FOUND');
        }

        // 验证用户状态
        const isValidStatus = await this.authService.validateUserStatus(user.status);
        
        if (!isValidStatus) {
          throw new AuthenticationError('用户账户已被禁用', 'USER_DISABLED');
        }

        // 将用户信息和token添加到请求对象
        req.user = user;
        req.token = token;
        req.tokenData = decoded;

        // 继续处理请求
        next();
      } catch (error) {
        // 记录错误日志
        logger.warn('认证失败:', { 
          error: error.message,
          path: req.path,
          method: req.method,
          ip: req.ip
        });

        // 处理错误
        if (error instanceof AppError) {
          next(error);
        } else {
          next(new AuthenticationError('认证失败', 'AUTHENTICATION_FAILED'));
        }
      }
    };
  }

  /**
   * 可选的身份验证
   * 如果提供了token则验证，但不强制要求
   */
  optionalAuthenticate() {
    return async (req, res, next) => {
      try {
        // 确保中间件已初始化
        if (!this.authService) {
          this.initialize();
        }

        // 从请求头获取token
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
          // 没有提供token，继续处理
          return next();
        }

        // 检查Bearer前缀
        const [bearer, token] = authHeader.split(' ');
        
        if (bearer !== 'Bearer' || !token) {
          // 格式错误，继续处理
          return next();
        }

        try {
          // 尝试验证token
          const decoded = await this.authService.validateToken(token);
          
          if (decoded && decoded.userId) {
            // 检查token是否在黑名单中
            const isBlacklisted = await this.authService.isTokenBlacklisted(token);
            
            if (!isBlacklisted) {
              // 获取用户信息
              const user = await this.authService.getUserInfo(decoded.userId);
              
              if (user && await this.authService.validateUserStatus(user.status)) {
                // 将用户信息和token添加到请求对象
                req.user = user;
                req.token = token;
                req.tokenData = decoded;
              }
            }
          }
        } catch (error) {
          // token验证失败，但不阻止请求继续
          logger.debug('可选认证token验证失败:', { error: error.message });
        }

        // 继续处理请求
        next();
      } catch (error) {
        // 发生其他错误，记录但不阻止请求
        logger.error('可选认证中间件错误:', { error });
        next();
      }
    };
  }

  /**
   * 角色验证中间件
   * 验证用户是否具有指定角色
   * @param {Array|string} roles - 允许的角色列表
   */
  authorize(roles) {
    // 确保roles是数组
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    return (req, res, next) => {
      try {
        // 检查是否已认证
        if (!req.user || !req.user.role) {
          throw new AuthenticationError('未认证的用户', 'UNAUTHENTICATED');
        }

        // 检查角色
        if (!allowedRoles.includes(req.user.role)) {
          throw new AuthorizationError(
            `需要以下角色之一: ${allowedRoles.join(', ')}`,
            'INSUFFICIENT_PERMISSIONS'
          );
        }

        // 角色验证通过
        next();
      } catch (error) {
        logger.warn('权限验证失败:', { 
          error: error.message,
          userId: req.user?.id,
          userRole: req.user?.role,
          requiredRoles: allowedRoles,
          path: req.path,
          method: req.method
        });

        if (error instanceof AppError) {
          next(error);
        } else {
          next(new AuthorizationError('权限不足', 'INSUFFICIENT_PERMISSIONS'));
        }
      }
    };
  }

  /**
   * 管理员验证中间件
   * 验证用户是否为管理员
   */
  isAdmin() {
    return this.authorize(['admin', 'superadmin']);
  }

  /**
   * 多因素认证验证中间件
   * 验证用户是否已完成多因素认证
   */
  mfaAuthenticated() {
    return (req, res, next) => {
      try {
        // 检查是否已认证
        if (!req.user) {
          throw new AuthenticationError('未认证的用户', 'UNAUTHENTICATED');
        }

        // 检查是否已完成MFA
        if (!req.tokenData?.mfaVerified) {
          throw new AuthenticationError('需要完成多因素认证', 'MFA_REQUIRED');
        }

        next();
      } catch (error) {
        logger.warn('MFA验证失败:', { 
          error: error.message,
          userId: req.user?.id,
          path: req.path,
          method: req.method
        });

        if (error instanceof AppError) {
          next(error);
        } else {
          next(new AuthenticationError('MFA验证失败', 'MFA_FAILED'));
        }
      }
    };
  }

  /**
   * API密钥认证中间件
   * 通过API密钥验证请求
   */
  apiKeyAuth() {
    return async (req, res, next) => {
      try {
        // 从请求头获取API密钥
        const apiKey = req.headers['x-api-key'] || req.query.api_key;
        
        if (!apiKey) {
          throw new AuthenticationError('缺少API密钥', 'MISSING_API_KEY');
        }

        // 验证API密钥（这里只是示例，实际应该从数据库或缓存中验证）
        // 在实际项目中，应该调用相应的服务来验证API密钥
        const isValid = await this.verifyApiKey(apiKey);
        
        if (!isValid) {
          throw new AuthenticationError('无效的API密钥', 'INVALID_API_KEY');
        }

        // 将API密钥信息添加到请求对象
        req.apiKey = apiKey;
        
        next();
      } catch (error) {
        logger.warn('API密钥认证失败:', { 
          error: error.message,
          path: req.path,
          method: req.method,
          ip: req.ip
        });

        if (error instanceof AppError) {
          next(error);
        } else {
          next(new AuthenticationError('API密钥认证失败', 'API_KEY_AUTH_FAILED'));
        }
      }
    };
  }

  /**
   * 验证API密钥
   * @param {string} apiKey - API密钥
   * @private
   */
  async verifyApiKey(apiKey) {
    // 这是一个示例实现
    // 在实际项目中，应该从数据库或缓存中验证API密钥
    try {
      // 可以从依赖注入容器获取API密钥服务
      const apiKeyService = di.get('apiKeyService');
      if (apiKeyService) {
        return await apiKeyService.verifyKey(apiKey);
      }

      // 临时实现 - 在实际项目中应该删除
      const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];
      return validApiKeys.includes(apiKey);
    } catch (error) {
      logger.error('验证API密钥失败:', { error });
      return false;
    }
  }

  /**
   * CSRF保护中间件
   * 防止跨站请求伪造攻击
   */
  csrfProtection() {
    return (req, res, next) => {
      try {
        // 只对非GET请求进行CSRF保护
        if (['GET', 'HEAD', 'OPTIONS', 'TRACE'].includes(req.method)) {
          return next();
        }

        // 从请求头获取CSRF令牌
        const csrfToken = req.headers['x-csrf-token'];
        
        if (!csrfToken) {
          throw new AuthenticationError('缺少CSRF令牌', 'MISSING_CSRF_TOKEN');
        }

        // 验证CSRF令牌
        // 在实际项目中，应该从用户会话或cookie中获取令牌并验证
        const isValid = this.verifyCsrfToken(csrfToken, req);
        
        if (!isValid) {
          throw new AuthenticationError('无效的CSRF令牌', 'INVALID_CSRF_TOKEN');
        }

        next();
      } catch (error) {
        logger.warn('CSRF验证失败:', { 
          error: error.message,
          path: req.path,
          method: req.method,
          ip: req.ip
        });

        if (error instanceof AppError) {
          next(error);
        } else {
          next(new AuthenticationError('CSRF验证失败', 'CSRF_FAILED'));
        }
      }
    };
  }

  /**
   * 验证CSRF令牌
   * @param {string} token - CSRF令牌
   * @param {Object} req - 请求对象
   * @private
   */
  verifyCsrfToken(token, req) {
    // 这是一个示例实现
    // 在实际项目中，应该从用户会话或cookie中获取令牌并验证
    try {
      // 如果有用户会话，从会话中获取CSRF令牌
      if (req.session && req.session.csrfToken) {
        return securityUtils.compareHash(token, req.session.csrfToken);
      }

      // 如果使用cookie存储CSRF令牌
      if (req.cookies && req.cookies.csrfToken) {
        return securityUtils.compareHash(token, req.cookies.csrfToken);
      }

      // 临时实现 - 在实际项目中应该删除
      return true;
    } catch (error) {
      logger.error('验证CSRF令牌失败:', { error });
      return false;
    }
  }

  /**
   * 限制访问频率中间件
   * 防止暴力攻击
   */
  rateLimit(options = {}) {
    const {
      windowMs = 15 * 60 * 1000, // 15分钟
      max = 100, // 最大请求数
      message = '请求过于频繁，请稍后再试',
      keyGenerator = req => req.ip,
      skipSuccessfulRequests = false
    } = options;

    // 请求计数器（内存存储，实际项目应使用Redis等）
    const requestCounts = new Map();

    return (req, res, next) => {
      try {
        // 生成限流键
        const key = keyGenerator(req);
        const now = Date.now();
        
        // 获取当前键的请求记录
        let requests = requestCounts.get(key) || [];
        
        // 清理过期的请求记录
        requests = requests.filter(time => now - time < windowMs);
        
        // 检查是否超过限制
        if (requests.length >= max) {
          throw new AppError(message, 429, 'RATE_LIMIT_EXCEEDED');
        }

        // 添加当前请求记录
        requests.push(now);
        requestCounts.set(key, requests);

        // 如果需要跳过成功请求的计数
        if (!skipSuccessfulRequests) {
          // 保存请求计数到响应结束时
          const originalEnd = res.end;
          res.end = function(...args) {
            // 如果是成功响应，不做处理
            // 如果是错误响应，可以考虑不增加计数
            return originalEnd.apply(this, args);
          };
        }

        // 设置限流相关的响应头
        res.setHeader('X-RateLimit-Limit', max);
        res.setHeader('X-RateLimit-Remaining', max - requests.length);
        res.setHeader('X-RateLimit-Reset', Math.floor((now - windowMs + max * 1000) / 1000));

        next();
      } catch (error) {
        logger.warn('请求限流触发:', { 
          error: error.message,
          path: req.path,
          method: req.method,
          ip: req.ip
        });

        if (error instanceof AppError) {
          next(error);
        } else {
          next(error);
        }
      }
    };
  }
}

// 创建并导出中间件实例
const authMiddleware = new AuthMiddleware();
module.exports = authMiddleware;

// 导出便捷的中间件函数
module.exports.authenticate = () => authMiddleware.authenticate();
module.exports.optionalAuthenticate = () => authMiddleware.optionalAuthenticate();
module.exports.authorize = (roles) => authMiddleware.authorize(roles);
module.exports.isAdmin = () => authMiddleware.isAdmin();
module.exports.mfaAuthenticated = () => authMiddleware.mfaAuthenticated();
module.exports.apiKeyAuth = () => authMiddleware.apiKeyAuth();
module.exports.csrfProtection = () => authMiddleware.csrfProtection();
module.exports.rateLimit = (options) => authMiddleware.rateLimit(options);