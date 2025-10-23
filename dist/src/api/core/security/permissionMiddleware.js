/**
 * 权限中间件模块
 * 提供权限验证相关的中间件函数
 */

const { AuthorizationError } = require('../exception/handlers/errorHandler');

/**
 * 权限验证中间件
 * 检查用户是否具有指定的权限
 * @param {Array} permissions - 所需权限列表
 */
function checkPermissions(permissions = []) {
  return (req, res, next) => {
    try {
      // 检查用户对象是否存在
      if (!req.user) {
        throw new AuthorizationError('用户未认证');
      }

      // 如果未指定权限，则允许访问
      if (permissions.length === 0) {
        return next();
      }

      // 检查用户权限
      const userPermissions = req.user.permissions || [];
      
      // 检查用户是否具有至少一个所需权限
      const hasPermission = permissions.some(perm => userPermissions.includes(perm));
      
      if (!hasPermission) {
        throw new AuthorizationError('权限不足，无法访问此资源');
      }

      next();
    } catch (error) {
      if (error instanceof AuthorizationError) {
        next(error);
      } else {
        next(new AuthorizationError('权限验证失败'));
      }
    }
  };
}

/**
 * 管理员权限验证中间件
 * 检查用户是否为管理员
 */
function isAdmin(req, res, next) {
  try {
    if (!req.user) {
      throw new AuthorizationError('用户未认证');
    }

    // 检查用户角色是否为管理员
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      throw new AuthorizationError('需要管理员权限');
    }

    next();
  } catch (error) {
    if (error instanceof AuthorizationError) {
      next(error);
    } else {
      next(new AuthorizationError('管理员权限验证失败'));
    }
  }
}

/**
 * 超级管理员权限验证中间件
 * 检查用户是否为超级管理员
 */
function isSuperAdmin(req, res, next) {
  try {
    if (!req.user) {
      throw new AuthorizationError('用户未认证');
    }

    // 检查用户角色是否为超级管理员
    if (req.user.role !== 'superadmin') {
      throw new AuthorizationError('需要超级管理员权限');
    }

    next();
  } catch (error) {
    if (error instanceof AuthorizationError) {
      next(error);
    } else {
      next(new AuthorizationError('超级管理员权限验证失败'));
    }
  }
}

module.exports = {
  checkPermissions,
  isAdmin,
  isSuperAdmin
};