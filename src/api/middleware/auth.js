import jwt from 'jsonwebtoken';
import db from '../models/index.js';
import { config } from '../config/config';
import {
  UnauthorizedError,
  ForbiddenError,
  BadRequestError
} from '../utils/errors.js';

/**
 * 验证请求数据
 */
export const validateRequest = (req, res, next) => {
  try {
    const errors = req.validationErrors || [];
    
    if (errors && errors.length > 0) {
      const errorMessages = errors.map(error => error.msg).join('; ');
      throw new BadRequestError(errorMessages);
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * JWT认证中间件
 */
export const requireAuth = async (req, res, next) => {
  try {
    // 从请求头获取token
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('缺少有效的认证令牌');
    }
    
    const token = authHeader.split(' ')[1];
    let decoded;
    
    try {
      // 验证JWT令牌
      decoded = jwt.verify(token, config.jwtSecret || 'your-secret-key');
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        throw new UnauthorizedError('认证令牌已过期');
      }
      throw new UnauthorizedError('无效的认证令牌');
    }
    
    // 检查会话是否存在且有效
    const session = await db.models.Session.findOne({
      where: {
        userId: decoded.id,
        token,
        isActive: true
      },
      include: [{ model: db.models.User }]
    });
    
    if (!session) {
      throw new UnauthorizedError('会话已过期或不存在');
    }
    
    // 检查用户是否存在且有效
    const user = session.User;
    if (!user || user.status !== 'active') {
      throw new UnauthorizedError('用户账户已被禁用或不存在');
    }
    
    // 更新最后活动时间
    await session.update({ lastActivityAt: new Date() });
    
    // 将用户信息添加到请求对象
    req.user = {
      userId: user.id,
      role: user.role,
      username: user.username,
      email: user.email
    };
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * 角色权限检查中间件
 */
export const requireRole = (roles) => {
  return (req, res, next) => {
    try {
      if (!req.user || !req.user.role) {
        throw new UnauthorizedError('用户未认证');
      }
      
      // 将单个角色转换为数组
      const requiredRoles = Array.isArray(roles) ? roles : [roles];
      
      // 检查用户角色是否匹配
      if (!requiredRoles.includes(req.user.role)) {
        throw new ForbiddenError('权限不足，无法执行此操作');
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * 认证中间件（兼容旧版）
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
      req.user = { ...user, userId: user.id };
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
 * 会话权限检查中间件 - 确保用户只能访问自己的会话
 */
export const requireConversationAccess = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const currentUserId = req.user.userId;
    const userRole = req.user.role;
    
    // 管理员和主管可以访问所有会话
    if (userRole === 'admin' || userRole === 'supervisor') {
      return next();
    }
    
    // 检查用户是否是会话参与者或负责人
    const conversation = await db.models.Conversation.findOne({
      where: {
        id: conversationId
      },
      include: [
        {
          model: db.models.ConversationParticipant,
          where: { userId: currentUserId }
        }
      ],
      attributes: ['id', 'assignedToUserId', 'userId']
    });
    
    // 如果会话不存在，或用户不是参与者、负责人或创建者，则拒绝访问
    if (!conversation || 
        conversation.assignedToUserId !== currentUserId && 
        conversation.userId !== currentUserId) {
      throw new ForbiddenError('无权访问此会话');
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * 消息权限检查中间件
 */
export const requireMessageAccess = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const currentUserId = req.user.userId;
    const userRole = req.user.role;
    
    // 管理员和主管可以访问所有消息
    if (userRole === 'admin' || userRole === 'supervisor') {
      return next();
    }
    
    // 查找消息及其关联的会话
    const message = await db.models.Message.findOne({
      where: { id: messageId },
      include: [
        {
          model: db.models.Conversation,
          include: [
            {
              model: db.models.ConversationParticipant,
              where: { userId: currentUserId }
            }
          ],
          attributes: ['id', 'assignedToUserId', 'userId']
        }
      ],
      attributes: ['id', 'userId']
    });
    
    // 检查权限：消息作者、会话参与者、负责人或创建者
    if (!message) {
      throw new ForbiddenError('无权访问此消息');
    }
    
    const conversation = message.Conversation;
    const isMessageAuthor = message.userId === currentUserId;
    const isConversationParticipant = conversation?.ConversationParticipants?.length > 0;
    const isAssignedAgent = conversation?.assignedToUserId === currentUserId;
    const isConversationOwner = conversation?.userId === currentUserId;
    
    if (!isMessageAuthor && !isConversationParticipant && !isAssignedAgent && !isConversationOwner) {
      throw new ForbiddenError('无权访问此消息');
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * 用户数据权限检查中间件
 */
export const requireUserDataAccess = (req, res, next) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.userId;
    const userRole = req.user.role;
    
    // 管理员和主管可以访问所有用户数据
    if (userRole === 'admin' || userRole === 'supervisor') {
      return next();
    }
    
    // 普通用户只能访问自己的数据
    if (userId !== currentUserId) {
      throw new ForbiddenError('无权访问其他用户数据');
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * 速率限制中间件
 */
export const rateLimiter = (limit = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();
  
  return (req, res, next) => {
    try {
      const ip = req.ip;
      const now = Date.now();
      
      if (!requests.has(ip)) {
        requests.set(ip, []);
      }
      
      // 获取该IP的请求记录
      const ipRequests = requests.get(ip);
      
      // 移除过期的请求记录
      const recentRequests = ipRequests.filter(time => now - time < windowMs);
      requests.set(ip, recentRequests);
      
      // 检查是否超过限制
      if (recentRequests.length >= limit) {
        throw new BadRequestError('请求过于频繁，请稍后再试');
      }
      
      // 记录新请求
      recentRequests.push(now);
      
      // 设置限流响应头
      res.setHeader('X-RateLimit-Limit', limit);
      res.setHeader('X-RateLimit-Remaining', limit - recentRequests.length);
      res.setHeader('X-RateLimit-Reset', new Date(now + windowMs).toISOString());
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * 日志记录中间件
 */
export const logRequest = async (req, res, next) => {
  try {
    // 记录请求信息
    const logData = {
      method: req.method,
      path: req.path,
      query: req.query,
      body: sanitizeData(req.body),
      headers: { ...req.headers },
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      timestamp: new Date()
    };
    
    // 移除敏感信息
    delete logData.headers.authorization;
    delete logData.headers.cookie;
    
    // 保存到数据库或日志文件
    console.log('API Request:', JSON.stringify(logData));
    
    // 记录响应时间
    const start = Date.now();
    
    res.on('finish', async () => {
      try {
        const responseTime = Date.now() - start;
        const responseLog = {
          ...logData,
          statusCode: res.statusCode,
          responseTime,
          userId: req.user?.userId
        };
        
        // 如果是已认证用户且不是获取token的请求，记录到工作日志
        if (req.user && req.path !== '/api/auth/refresh-token') {
          await db.models.WorkLog.create({
            userId: req.user.userId,
            activityType: 'api_request',
            actionType: req.method,
            details: `${req.method} ${req.path}`,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            metadata: {
              statusCode: res.statusCode,
              responseTime,
              path: req.path
            }
          });
        }
        
        console.log('API Response:', responseLog.statusCode, responseLog.responseTime, 'ms');
      } catch (err) {
        console.error('Response logging error:', err);
      }
    });
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * CORS中间件
 */
export const cors = (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', config.corsOrigin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
};

/**
 * 清理敏感数据
 */
function sanitizeData(data) {
  if (!data || typeof data !== 'object') return data;
  
  const sanitized = { ...data };
  const sensitiveFields = ['password', 'token', 'creditCard', 'ssn', 'securityCode'];
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '****';
    }
  });
  
  return sanitized;
}

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