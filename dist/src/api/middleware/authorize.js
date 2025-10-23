const { ForbiddenError } = require('../utils/errors');

/**
 * 角色授权中间件
 * 验证用户是否拥有指定的角色之一
 * @param {Array<string>} allowedRoles - 允许的角色列表
 */
const authorizeRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      // 检查请求中是否有用户信息
      if (!req.user || !req.user.role) {
        return res.status(401).json({
          error: '未授权',
          message: '用户信息缺失'
        });
      }
      
      // 检查用户角色是否在允许列表中
      if (allowedRoles.includes(req.user.role)) {
        return next();
      }
      
      // 对于客服角色，进行更详细的权限检查
      if (req.user.role === 'customer_service') {
        // 检查是否有特定权限
        if (req.user.permissions && req.user.permissions.length > 0) {
          // 这里可以根据具体的API路径进行更细粒度的权限检查
          const path = req.path;
          
          // 客服基本权限检查
          if (path.includes('/chat') || path.includes('/messages')) {
            return next();
          }
          
          // 检查是否有管理权限
          if (req.user.permissions.includes('manage_sessions') && path.includes('/sessions')) {
            return next();
          }
        }
      }
      
      // 权限不足
      throw new ForbiddenError('您没有权限执行此操作');
    } catch (error) {
      if (error.name === 'ForbiddenError') {
        return res.status(403).json({
          error: '权限不足',
          message: error.message
        });
      }
      
      console.error('授权中间件错误:', error);
      return res.status(500).json({
        error: '服务器错误',
        message: '权限验证过程中发生错误'
      });
    }
  };

};

module.exports = {
  authorizeRole,
  authorizePermission,
  authorizeSessionAccess,
  authorizeCustomerServiceAction
};

/**
 * 权限授权中间件
 * 验证用户是否拥有特定权限
 * @param {Array<string>} requiredPermissions - 必需的权限列表
 */
const authorizePermission = (requiredPermissions) => {
  return (req, res, next) => {
    try {
      // 检查请求中是否有用户信息
      if (!req.user || !req.user.permissions || !Array.isArray(req.user.permissions)) {
        return res.status(401).json({
          error: '未授权',
          message: '用户权限信息缺失'
        });
      }
      
      // 超级管理员拥有所有权限
      if (req.user.role === 'admin') {
        return next();
      }
      
      // 检查用户是否拥有所有必需的权限
      const hasAllPermissions = requiredPermissions.every(permission => 
        req.user.permissions.includes(permission)
      );
      
      if (hasAllPermissions) {
        return next();
      }
      
      // 权限不足
      throw new ForbiddenError('您没有足够的权限执行此操作');
    } catch (error) {
      if (error.name === 'ForbiddenError') {
        return res.status(403).json({
          error: '权限不足',
          message: error.message
        });
      }
      
      console.error('权限授权中间件错误:', error);
      return res.status(500).json({
        error: '服务器错误',
        message: '权限验证过程中发生错误'
      });
    }
  };
};

/**
 * 会话访问权限中间件
 * 验证用户是否有权访问特定会话
 */
const authorizeSessionAccess = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    
    // 验证会话ID是否存在
    if (!sessionId) {
      return res.status(400).json({
        error: '参数错误',
        message: '缺少会话ID'
      });
    }
    
    // 这里需要查询数据库验证用户与会话的关联
    // 由于我们还没有实际的数据库查询方法，先使用模拟逻辑
    // 实际应用中需要替换为真实的数据库查询
    
    // 超级管理员和客服管理员可以访问所有会话
    if (req.user.role === 'admin' || req.user.role === 'customer_service_manager') {
      return next();
    }
    
    // 模拟验证：检查用户是否是会话的参与者或分配的客服
    // 实际应用中需要从数据库查询会话参与者信息
    const isSessionParticipant = true; // 这里应该是实际的查询结果
    
    if (isSessionParticipant) {
      return next();
    }
    
    // 访问被拒绝
    throw new ForbiddenError('您无权访问此会话');
  } catch (error) {
    if (error.name === 'ForbiddenError') {
      return res.status(403).json({
        error: '访问拒绝',
        message: error.message
      });
    }
    
    console.error('会话访问权限验证错误:', error);
    return res.status(500).json({
      error: '服务器错误',
      message: '验证会话访问权限时发生错误'
    });
  }
};

/**
 * 客服操作权限中间件
 * 验证客服是否有权执行特定操作
 * @param {string} operation - 操作类型
 */
const authorizeCustomerServiceAction = (operation) => {
  return (req, res, next) => {
    try {
      // 只有客服角色可以执行客服操作
      if (req.user.role !== 'customer_service' && 
          req.user.role !== 'admin' && 
          req.user.role !== 'customer_service_manager') {
        throw new ForbiddenError('只有客服人员可以执行此操作');
      }
      
      // 根据操作类型进行特定权限检查
      const operationPermissions = {
        'assign_session': ['assign_sessions'],
        'transfer_session': ['transfer_sessions'],
        'close_session': ['close_sessions'],
        'manage_auto_reply': ['manage_auto_reply'],
        'view_statistics': ['view_statistics']
      };
      
      // 检查是否需要特定权限
      if (operationPermissions[operation]) {
        const requiredPermissions = operationPermissions[operation];
        const hasPermission = requiredPermissions.some(permission => 
          req.user.permissions?.includes(permission)
        );
        
        // 非管理员需要检查权限
        if (req.user.role !== 'admin' && !hasPermission) {
          throw new ForbiddenError(`您没有权限执行${getOperationName(operation)}操作`);
        }
      }
      
      next();
    } catch (error) {
      if (error.name === 'ForbiddenError') {
        return res.status(403).json({
          error: '权限不足',
          message: error.message
        });
      }
      
      console.error('客服操作权限验证错误:', error);
      return res.status(500).json({
        error: '服务器错误',
        message: '验证客服操作权限时发生错误'
      });
    }
  };
};

/**
 * 获取操作的中文名称
 * @param {string} operation - 操作类型
 * @returns {string} 中文操作名称
 */
function getOperationName(operation) {
  const operationNames = {
    'assign_session': '分配会话',
    'transfer_session': '转移会话',
    'close_session': '关闭会话',
    'manage_auto_reply': '管理自动回复',
    'view_statistics': '查看统计'  
  };
  
  return operationNames[operation] || operation;
}

module.exports = {
  authorizeRole,
  authorizePermission,
  authorizeSessionAccess,
  authorizeCustomerServiceAction
};