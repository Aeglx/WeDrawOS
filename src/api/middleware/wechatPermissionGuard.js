/**
 * 企业微信和公众号权限控制中间件
 * 限制卖家对企业微信和公众号核心功能的直接访问
 */

const logger = require('../core/utils/logger');
const { ForbiddenError } = require('../core/exception/types/BusinessExceptions');

/**
 * 企业微信和公众号权限控制中间件
 * 根据用户角色限制对企业微信和公众号功能的访问
 * - 管理员：完全访问权限
 * - 卖家：只能通过平台接口访问，不能直接操作核心功能
 * - 买家：无访问权限
 */
const wechatPermissionGuard = () => {
  return (req, res, next) => {
    try {
      // 检查用户是否登录
      if (!req.user || !req.user.role) {
        return res.status(401).json({
          success: false,
          message: '未授权访问',
          error: '用户信息缺失'
        });
      }

      // 获取用户角色和路径信息
      const { role } = req.user;
      const { path, method } = req;

      // 定义核心功能路径模式
      const coreWechatPaths = [
        /\/wechat\/core\/api/i,
        /\/wechat\/enterprise\/config/i,
        /\/wechat\/public\/account\/settings/i,
        /\/wechat\/token\/manage/i,
        /\/wechat\/menu\/customize/i,
        /\/wechat\/user\/manage/i,
        /\/wechat\/template\/admin/i,
        /\/wechat\/analytics\/raw/i,
        /\/wechat\/permissions\/manage/i
      ];

      // 定义平台接口路径模式（卖家可以访问）
      const platformInterfacePaths = [
        /\/wechat\/platform\/message\/send/i,
        /\/wechat\/platform\/template\/use/i,
        /\/wechat\/platform\/menu\/preview/i,
        /\/wechat\/platform\/qrcode\/generate/i,
        /\/wechat\/platform\/media\/upload/i,
        /\/wechat\/platform\/analytics\/summary/i
      ];

      // 检查是否是企业微信或公众号相关路径
      const isWechatPath = coreWechatPaths.some(pattern => pattern.test(path)) ||
                         platformInterfacePaths.some(pattern => pattern.test(path));

      if (!isWechatPath) {
        // 非企业微信相关路径，直接通过
        return next();
      }

      // 根据角色处理访问权限
      switch (role) {
        case 'admin':
          // 管理员拥有完全访问权限
          logger.debug(`管理员访问企业微信/公众号功能: ${method} ${path}`);
          return next();

        case 'seller':
          // 卖家只能访问平台接口，不能直接操作核心功能
          const isPlatformInterface = platformInterfacePaths.some(pattern => pattern.test(path));
          const isCoreFunction = coreWechatPaths.some(pattern => pattern.test(path));

          if (isCoreFunction) {
            // 卖家尝试直接访问核心功能
            logger.warn(`卖家尝试直接访问企业微信/公众号核心功能: ${method} ${path}，用户ID: ${req.user.id}`);
            throw new ForbiddenError('您没有权限直接操作企业微信和公众号核心功能，请通过平台提供的接口使用');
          }

          if (isPlatformInterface) {
            // 卖家通过平台接口访问，需要检查是否有权限
            if (hasSellerPermission(req.user, getRequiredPermissionForPath(path))) {
              logger.debug(`卖家通过平台接口访问企业微信/公众号功能: ${method} ${path}`);
              return next();
            } else {
              logger.warn(`卖家权限不足，无法访问企业微信/公众号平台接口: ${method} ${path}，用户ID: ${req.user.id}`);
              throw new ForbiddenError('权限不足，无法访问该功能，请联系管理员授权');
            }
          }
          break;

        case 'buyer':
          // 买家无访问权限
          logger.warn(`买家尝试访问企业微信/公众号功能: ${method} ${path}，用户ID: ${req.user.id}`);
          throw new ForbiddenError('您没有权限访问该功能');

        default:
          logger.warn(`未知角色尝试访问企业微信/公众号功能: ${method} ${path}，角色: ${role}`);
          throw new ForbiddenError('您没有权限访问该功能');
      }

      // 默认情况：不允许访问
      throw new ForbiddenError('您没有权限访问该功能');
    } catch (error) {
      if (error.name === 'ForbiddenError') {
        return res.status(403).json({
          success: false,
          message: error.message,
          error: 'PERMISSION_DENIED'
        });
      }

      logger.error('企业微信权限控制中间件错误:', error);
      return res.status(500).json({
        success: false,
        message: '权限验证过程中发生错误',
        error: 'INTERNAL_ERROR'
      });
    }
  };
};

/**
 * 检查卖家是否具有特定权限
 * @param {Object} user - 用户对象
 * @param {string} permission - 权限代码
 * @returns {boolean} 是否有权限
 */
function hasSellerPermission(user, permission) {
  // 检查用户权限列表
  if (!user.permissions || !Array.isArray(user.permissions)) {
    return false;
  }

  // 精确匹配权限
  if (user.permissions.includes(permission)) {
    return true;
  }

  // 检查是否有通配符权限（例如 wechat:platform:*）
  const permissionGroup = permission.split(':').slice(0, 2).join(':') + ':*';
  if (user.permissions.includes(permissionGroup)) {
    return true;
  }

  // 检查是否有更高级别的通配符权限
  if (user.permissions.includes('wechat:*') || user.permissions.includes('*')) {
    return true;
  }

  return false;
}

/**
 * 根据路径获取所需的权限
 * @param {string} path - 请求路径
 * @returns {string} 所需的权限代码
 */
function getRequiredPermissionForPath(path) {
  // 根据路径映射到对应的权限
  if (path.includes('/wechat/platform/message/send')) {
    return 'wechat:platform:message:send';
  }
  if (path.includes('/wechat/platform/template/use')) {
    return 'wechat:platform:template:use';
  }
  if (path.includes('/wechat/platform/menu/preview')) {
    return 'wechat:platform:menu:preview';
  }
  if (path.includes('/wechat/platform/qrcode/generate')) {
    return 'wechat:platform:qrcode:generate';
  }
  if (path.includes('/wechat/platform/media/upload')) {
    return 'wechat:platform:media:upload';
  }
  if (path.includes('/wechat/platform/analytics/summary')) {
    return 'wechat:platform:analytics:view';
  }
  
  // 默认权限
  return 'wechat:platform:access';
}

module.exports = wechatPermissionGuard;