import jwt from 'jsonwebtoken';
import { config } from '../config/config';

/**
 * 认证中间件
 * 验证请求中的JWT令牌并解析用户信息
 */
export const authenticateToken = (req, res, next) => {
  try {
    // 检查是否为公开路由
    if (req.isPublicRoute) {
      return next();
    }
    
    // 从请求头获取令牌
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    // 检查令牌是否存在
    if (!token) {
      return res.status(401).json({
        error: '未授权',
        message: '缺少认证令牌'
      });
    }
    
    // 验证令牌
    jwt.verify(token, config.jwtSecret, (err, user) => {
      if (err) {
        // 处理令牌过期错误
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({
            error: '令牌过期',
            message: '认证令牌已过期，请重新登录'
          });
        }
        
        // 处理其他验证错误
        return res.status(403).json({
          error: '令牌无效',
          message: '认证令牌无效或已被撤销'
        });
      }
      
      // 将用户信息存储在请求对象中
      req.user = user;
      next();
    });
  } catch (error) {
    console.error('认证中间件错误:', error);
    return res.status(500).json({
      error: '服务器错误',
      message: '认证过程中发生错误'
    });
  }
};

/**
 * 可选认证中间件
 * 尝试验证令牌，但不强制要求令牌存在
 */
export const optionalAuthenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      // 没有令牌也允许通过，但不设置用户信息
      return next();
    }
    
    // 尝试验证令牌
    jwt.verify(token, config.jwtSecret, (err, user) => {
      if (!err) {
        req.user = user;
      }
      // 即使令牌无效也继续处理请求
      next();
    });
  } catch (error) {
    console.error('可选认证中间件错误:', error);
    // 发生错误也继续处理请求
    next();
  }
};

/**
 * 刷新令牌中间件
 * 用于验证刷新令牌的有效性
 */
export const validateRefreshToken = (req, res, next) => {
  try {
    const refreshToken = req.body.refreshToken || req.cookies.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({
        error: '缺少刷新令牌',
        message: '无法刷新认证令牌'
      });
    }
    
    // 验证刷新令牌
    jwt.verify(refreshToken, config.jwtRefreshSecret, (err, user) => {
      if (err) {
        return res.status(403).json({
          error: '刷新令牌无效',
          message: '刷新令牌已过期或无效'
        });
      }
      
      req.user = user;
      req.refreshToken = refreshToken;
      next();
    });
  } catch (error) {
    console.error('刷新令牌验证错误:', error);
    return res.status(500).json({
      error: '服务器错误',
      message: '验证刷新令牌时发生错误'
    });
  }
};

/**
 * 生成访问令牌
 * @param {Object} user - 用户信息对象
 * @returns {string} JWT令牌
 */
export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      permissions: user.permissions
    },
    config.jwtSecret,
    {
      expiresIn: config.jwtExpiration || '1h'
    }
  );
};

/**
 * 生成刷新令牌
 * @param {Object} user - 用户信息对象
 * @returns {string} 刷新令牌
 */
export const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username
    },
    config.jwtRefreshSecret,
    {
      expiresIn: config.jwtRefreshExpiration || '7d'
    }
  );
};