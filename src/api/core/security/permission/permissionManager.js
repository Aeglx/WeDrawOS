/**
 * 权限管理器
 * 实现基于角色的访问控制（RBAC）
 */

/**
 * 权限管理器类
 */
class PermissionManager {
  constructor() {
    // 角色权限映射
    this.rolePermissions = new Map();
    // 预定义的角色
    this.defaultRoles = {
      ADMIN: 'admin',
      SELLER: 'seller',
      BUYER: 'buyer',
      GUEST: 'guest'
    };
    
    // 初始化默认权限
    this.initDefaultPermissions();
  }

  /**
   * 初始化默认权限
   */
  initDefaultPermissions() {
    // 管理员权限
    this.setRolePermissions(this.defaultRoles.ADMIN, [
      'user:create',
      'user:read',
      'user:update',
      'user:delete',
      'product:create',
      'product:read',
      'product:update',
      'product:delete',
      'order:create',
      'order:read',
      'order:update',
      'order:delete',
      'system:config',
      'system:logs',
      'system:backup'
    ]);

    // 卖家权限
    this.setRolePermissions(this.defaultRoles.SELLER, [
      'product:create',
      'product:read',
      'product:update',
      'product:delete',
      'order:read',
      'order:update',
      'seller:profile:read',
      'seller:profile:update'
    ]);

    // 买家权限
    this.setRolePermissions(this.defaultRoles.BUYER, [
      'product:read',
      'order:create',
      'order:read',
      'buyer:profile:read',
      'buyer:profile:update',
      'cart:manage'
    ]);

    // 游客权限
    this.setRolePermissions(this.defaultRoles.GUEST, [
      'product:read',
      'public:access'
    ]);
  }

  /**
   * 设置角色的权限
   * @param {string} role - 角色名称
   * @param {Array<string>} permissions - 权限列表
   */
  setRolePermissions(role, permissions) {
    this.rolePermissions.set(role, new Set(permissions));
  }

  /**
   * 添加角色的权限
   * @param {string} role - 角色名称
   * @param {string} permission - 权限
   */
  addRolePermission(role, permission) {
    if (!this.rolePermissions.has(role)) {
      this.rolePermissions.set(role, new Set());
    }
    this.rolePermissions.get(role).add(permission);
  }

  /**
   * 移除角色的权限
   * @param {string} role - 角色名称
   * @param {string} permission - 权限
   */
  removeRolePermission(role, permission) {
    if (this.rolePermissions.has(role)) {
      this.rolePermissions.get(role).delete(permission);
    }
  }

  /**
   * 检查角色是否有权限
   * @param {string} role - 角色名称
   * @param {string} permission - 权限
   * @returns {boolean} 是否有权限
   */
  hasPermission(role, permission) {
    const rolePerms = this.rolePermissions.get(role);
    if (!rolePerms) return false;

    // 完全匹配
    if (rolePerms.has(permission)) {
      return true;
    }

    // 检查通配符权限
    const wildcardPermission = permission.split(':')[0] + ':*';
    if (rolePerms.has(wildcardPermission)) {
      return true;
    }

    return false;
  }

  /**
   * 检查用户是否有权限
   * @param {Object} user - 用户对象，包含role属性
   * @param {string} permission - 权限
   * @returns {boolean} 是否有权限
   */
  userHasPermission(user, permission) {
    if (!user || !user.role) {
      // 未登录用户默认为guest角色
      return this.hasPermission(this.defaultRoles.GUEST, permission);
    }

    return this.hasPermission(user.role, permission);
  }

  /**
   * 获取角色的所有权限
   * @param {string} role - 角色名称
   * @returns {Array<string>} 权限列表
   */
  getRolePermissions(role) {
    const permissions = this.rolePermissions.get(role);
    return permissions ? Array.from(permissions) : [];
  }

  /**
   * 获取所有角色
   * @returns {Array<string>} 角色列表
   */
  getAllRoles() {
    return Array.from(this.rolePermissions.keys());
  }

  /**
   * 权限检查中间件
   * @param {string} permission - 所需权限
   * @returns {Function} 中间件函数
   */
  checkPermission(permission) {
    return (req, res, next) => {
      try {
        const user = req.user;
        
        if (!this.userHasPermission(user, permission)) {
          const { AuthorizationError } = require('../../exception/handlers/errorHandler');
          throw new AuthorizationError(`权限不足，需要 ${permission} 权限`);
        }
        
        next();
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * 批量权限检查中间件
   * 用户拥有任一权限即可通过
   * @param {Array<string>} permissions - 权限列表
   * @returns {Function} 中间件函数
   */
  checkAnyPermission(permissions) {
    return (req, res, next) => {
      try {
        const user = req.user;
        
        const hasAnyPermission = permissions.some(permission => 
          this.userHasPermission(user, permission)
        );
        
        if (!hasAnyPermission) {
          const { AuthorizationError } = require('../../exception/handlers/errorHandler');
          throw new AuthorizationError(`权限不足，需要以下任一权限: ${permissions.join(', ')}`);
        }
        
        next();
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * 批量权限检查中间件
   * 用户必须拥有所有权限才可通过
   * @param {Array<string>} permissions - 权限列表
   * @returns {Function} 中间件函数
   */
  checkAllPermissions(permissions) {
    return (req, res, next) => {
      try {
        const user = req.user;
        
        const hasAllPermissions = permissions.every(permission => 
          this.userHasPermission(user, permission)
        );
        
        if (!hasAllPermissions) {
          const { AuthorizationError } = require('../../exception/handlers/errorHandler');
          throw new AuthorizationError(`权限不足，需要以下所有权限: ${permissions.join(', ')}`);
        }
        
        next();
      } catch (error) {
        next(error);
      }
    };
  }
}

// 导出单例实例
module.exports = new PermissionManager();