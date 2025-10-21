/**
 * JWT认证中间件
 * 用于验证用户身份和保护API路由
 */

const securityUtils = require('../securityUtils');
const { AuthenticationError, AuthorizationError } = require('../../exception/handlers/errorHandler');

/**
 * JWT认证中间件
 * @param {Array} roles - 允许的角色列表，可选
 */
function auth(roles = []) {
  return (req, res, next) => {
    try {
      // 从请求头获取token
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        throw new AuthenticationError('缺少认证令牌');
      }
      
      // 检查Bearer前缀
      const [bearer, token] = authHeader.split(' ');
      
      if (bearer !== 'Bearer' || !token) {
        throw new AuthenticationError('认证令牌格式错误');
      }
      
      // 验证token
      const decoded = securityUtils.verifyToken(token);
      
      // 将用户信息附加到请求对象
      req.user = decoded;
      
      // 检查角色权限
      if (roles.length > 0 && !roles.includes(decoded.role)) {
        throw new AuthorizationError('权限不足，无法访问此资源');
      }
      
      next();
    } catch (error) {
      if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
        next(error);
      } else {
        next(new AuthenticationError('认证令牌无效或已过期'));
      }
    }
  };
}

/**
 * 可选的认证中间件
 * 如果提供了token则验证，否则继续执行
 * @returns {Function} 中间件函数
 */
function optionalAuth() {
  return (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        return next();
      }
      
      const [bearer, token] = authHeader.split(' ');
      
      if (bearer === 'Bearer' && token) {
        const decoded = securityUtils.verifyToken(token);
        req.user = decoded;
      }
      
      next();
    } catch (error) {
      // token无效时不阻止请求，只是不设置user
      next();
    }
  };
}

/**
 * 管理员认证中间件
 * @returns {Function} 中间件函数
 */
function adminAuth() {
  return auth(['admin']);
}

/**
 * 卖家认证中间件
 * @returns {Function} 中间件函数
 */
function sellerAuth() {
  return auth(['admin', 'seller']);
}

/**
 * 买家认证中间件
 * @returns {Function} 中间件函数
 */
function buyerAuth() {
  return auth(['admin', 'seller', 'buyer']);
}

module.exports = {
  auth,
  optionalAuth,
  adminAuth,
  sellerAuth,
  buyerAuth
};