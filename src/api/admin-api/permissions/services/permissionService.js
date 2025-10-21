/**
 * 权限控制服务
 * 处理权限相关的业务逻辑
 */

const di = require('../../../core/di/container');
const permissionRepository = di.resolve('permissionRepository') || require('../repositories/permissionRepository');
const userRepository = di.resolve('userRepository');
const logger = di.resolve('logger');
const cacheService = di.resolve('cacheService');

class PermissionService {
  /**
   * 获取角色列表
   * @param {Object} query - 查询参数
   * @returns {Promise<Object>} 角色列表
   */
  async getRoleList(query) {
    try {
      const cacheKey = `role_list:${JSON.stringify(query)}`;
      
      // 尝试从缓存获取
      const cachedData = await cacheService.get(cacheKey);
      if (cachedData) {
        return cachedData;
      }
      
      // 从仓库获取数据
      const result = await permissionRepository.getRoleList(query);
      
      // 缓存结果
      await cacheService.set(cacheKey, result, 300); // 缓存5分钟
      
      logger.info('获取角色列表成功', { page: query.page, limit: query.limit });
      return result;
    } catch (error) {
      logger.error('获取角色列表失败', { error: error.message });
      throw error;
    }
  }
  
  /**
   * 获取角色详情
   * @param {string} roleId - 角色ID
   * @returns {Promise<Object|null>} 角色信息
   */
  async getRoleDetail(roleId) {
    try {
      const cacheKey = `role_detail:${roleId}`;
      
      // 尝试从缓存获取
      const cachedRole = await cacheService.get(cacheKey);
      if (cachedRole) {
        return cachedRole;
      }
      
      // 从仓库获取
      const role = await permissionRepository.getRoleById(roleId);
      
      if (role) {
        // 获取角色权限
        const permissions = await permissionRepository.getRolePermissions(roleId);
        role.permissions = permissions;
        
        // 缓存结果
        await cacheService.set(cacheKey, role, 600); // 缓存10分钟
      }
      
      logger.info('获取角色详情成功', { roleId });
      return role;
    } catch (error) {
      logger.error('获取角色详情失败', { roleId, error: error.message });
      throw error;
    }
  }
  
  /**
   * 创建角色
   * @param {Object} roleData - 角色数据
   * @returns {Promise<Object>} 创建的角色
   */
  async createRole(roleData) {
    try {
      // 验证角色名称是否已存在
      const existingRole = await permissionRepository.getRoleByName(roleData.name);
      if (existingRole) {
        throw new Error('角色名称已存在');
      }
      
      // 验证角色标识是否已存在
      if (existingRole && existingRole.code === roleData.code) {
        throw new Error('角色标识已存在');
      }
      
      // 创建角色
      const role = {
        ...roleData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const createdRole = await permissionRepository.createRole(role);
      
      // 如果有分配权限
      if (roleData.permissions && Array.isArray(roleData.permissions) && roleData.permissions.length > 0) {
        await permissionRepository.assignRolePermissions(createdRole.id, roleData.permissions);
      }
      
      // 清除缓存
      await cacheService.clearPattern('role_list:*');
      
      logger.info('创建角色成功', { roleId: createdRole.id, roleName: createdRole.name });
      return createdRole;
    } catch (error) {
      logger.error('创建角色失败', { roleData, error: error.message });
      throw error;
    }
  }
  
  /**
   * 更新角色
   * @param {string} roleId - 角色ID
   * @param {Object} roleData - 角色数据
   * @returns {Promise<Object|null>} 更新后的角色
   */
  async updateRole(roleId, roleData) {
    try {
      // 检查角色是否存在
      const existingRole = await permissionRepository.getRoleById(roleId);
      if (!existingRole) {
        return null;
      }
      
      // 验证角色名称是否被其他角色使用
      if (roleData.name && roleData.name !== existingRole.name) {
        const nameRole = await permissionRepository.getRoleByName(roleData.name);
        if (nameRole && nameRole.id !== roleId) {
          throw new Error('角色名称已存在');
        }
      }
      
      // 验证角色标识是否被其他角色使用
      if (roleData.code && roleData.code !== existingRole.code) {
        const codeRole = await permissionRepository.getRoleByCode(roleData.code);
        if (codeRole && codeRole.id !== roleId) {
          throw new Error('角色标识已存在');
        }
      }
      
      // 准备更新数据
      const updateData = {
        ...roleData,
        updatedAt: new Date()
      };
      
      // 移除权限字段（单独处理）
      const permissions = updateData.permissions;
      delete updateData.permissions;
      
      // 更新角色
      const updatedRole = await permissionRepository.updateRole(roleId, updateData);
      
      // 更新权限
      if (permissions !== undefined) {
        await this.updateRolePermissions(roleId, permissions);
      }
      
      // 清除缓存
      await cacheService.delete(`role_detail:${roleId}`);
      await cacheService.clearPattern('role_list:*');
      await cacheService.clearPattern('user_permissions:*'); // 清除用户权限缓存
      
      logger.info('更新角色成功', { roleId });
      return updatedRole;
    } catch (error) {
      logger.error('更新角色失败', { roleId, roleData, error: error.message });
      throw error;
    }
  }
  
  /**
   * 删除角色
   * @param {string} roleId - 角色ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  async deleteRole(roleId) {
    try {
      // 检查角色是否存在
      const role = await permissionRepository.getRoleById(roleId);
      if (!role) {
        return false;
      }
      
      // 检查是否有关联用户
      const userCount = await permissionRepository.getUserCountByRole(roleId);
      if (userCount > 0) {
        throw new Error(`该角色已分配给 ${userCount} 个用户，请先移除用户关联`);
      }
      
      // 删除角色权限关联
      await permissionRepository.removeRolePermissions(roleId);
      
      // 删除角色
      const result = await permissionRepository.deleteRole(roleId);
      
      if (result) {
        // 清除缓存
        await cacheService.delete(`role_detail:${roleId}`);
        await cacheService.clearPattern('role_list:*');
      }
      
      logger.info('删除角色成功', { roleId, roleName: role.name });
      return result;
    } catch (error) {
      logger.error('删除角色失败', { roleId, error: error.message });
      throw error;
    }
  }
  
  /**
   * 获取权限列表
   * @returns {Promise<Array>} 权限列表
   */
  async getPermissionList() {
    try {
      const cacheKey = 'permission_list';
      
      // 尝试从缓存获取
      const cachedPermissions = await cacheService.get(cacheKey);
      if (cachedPermissions) {
        return cachedPermissions;
      }
      
      // 从仓库获取
      const permissions = await permissionRepository.getAllPermissions();
      
      // 缓存结果
      await cacheService.set(cacheKey, permissions, 3600); // 缓存1小时
      
      logger.info('获取权限列表成功');
      return permissions;
    } catch (error) {
      logger.error('获取权限列表失败', { error: error.message });
      throw error;
    }
  }
  
  /**
   * 更新角色权限
   * @param {string} roleId - 角色ID
   * @param {Array} permissions - 权限列表
   * @returns {Promise<boolean>} 是否更新成功
   */
  async updateRolePermissions(roleId, permissions) {
    try {
      // 检查角色是否存在
      const role = await permissionRepository.getRoleById(roleId);
      if (!role) {
        return false;
      }
      
      // 验证权限是否有效
      const validPermissions = await permissionRepository.getAllPermissions();
      const validPermissionCodes = validPermissions.map(p => p.code);
      
      for (const perm of permissions) {
        if (!validPermissionCodes.includes(perm)) {
          throw new Error(`无效的权限代码: ${perm}`);
        }
      }
      
      // 先移除旧权限
      await permissionRepository.removeRolePermissions(roleId);
      
      // 分配新权限
      await permissionRepository.assignRolePermissions(roleId, permissions);
      
      // 清除缓存
      await cacheService.delete(`role_detail:${roleId}`);
      await cacheService.clearPattern('user_permissions:*'); // 清除用户权限缓存
      
      logger.info('更新角色权限成功', { roleId, permissionCount: permissions.length });
      return true;
    } catch (error) {
      logger.error('更新角色权限失败', { roleId, permissionCount: permissions.length, error: error.message });
      throw error;
    }
  }
  
  /**
   * 获取用户角色列表
   * @param {string} userId - 用户ID
   * @returns {Promise<Array>} 角色列表
   */
  async getUserRoles(userId) {
    try {
      // 验证用户是否存在
      const user = await userRepository.getUserById(userId);
      if (!user) {
        throw new Error('用户不存在');
      }
      
      const roles = await permissionRepository.getUserRoles(userId);
      
      logger.info('获取用户角色列表成功', { userId });
      return roles;
    } catch (error) {
      logger.error('获取用户角色列表失败', { userId, error: error.message });
      throw error;
    }
  }
  
  /**
   * 更新用户角色
   * @param {string} userId - 用户ID
   * @param {Array} roleIds - 角色ID列表
   * @returns {Promise<boolean>} 是否更新成功
   */
  async updateUserRoles(userId, roleIds) {
    try {
      // 验证用户是否存在
      const user = await userRepository.getUserById(userId);
      if (!user) {
        throw new Error('用户不存在');
      }
      
      // 验证角色是否有效
      const validRoles = await permissionRepository.getRoleList({ page: 1, limit: 1000 });
      const validRoleIds = validRoles.items.map(r => r.id);
      
      for (const roleId of roleIds) {
        if (!validRoleIds.includes(roleId)) {
          throw new Error(`无效的角色ID: ${roleId}`);
        }
      }
      
      // 先移除旧角色
      await permissionRepository.removeUserRoles(userId);
      
      // 分配新角色
      await permissionRepository.assignUserRoles(userId, roleIds);
      
      // 清除缓存
      await cacheService.clearPattern(`user_permissions:${userId}`);
      
      logger.info('更新用户角色成功', { userId, roleCount: roleIds.length });
      return true;
    } catch (error) {
      logger.error('更新用户角色失败', { userId, roleCount: roleIds.length, error: error.message });
      throw error;
    }
  }
  
  /**
   * 检查用户是否有指定权限
   * @param {string} userId - 用户ID
   * @param {string} permissionCode - 权限代码
   * @returns {Promise<boolean>} 是否有权限
   */
  async checkUserPermission(userId, permissionCode) {
    try {
      const cacheKey = `user_permissions:${userId}`;
      
      // 尝试从缓存获取用户权限
      let userPermissions = await cacheService.get(cacheKey);
      
      if (!userPermissions) {
        // 获取用户角色
        const roles = await permissionRepository.getUserRoles(userId);
        
        // 获取所有角色权限
        userPermissions = new Set();
        for (const role of roles) {
          const permissions = await permissionRepository.getRolePermissions(role.id);
          permissions.forEach(perm => userPermissions.add(perm));
        }
        
        // 缓存用户权限
        await cacheService.set(cacheKey, Array.from(userPermissions), 300); // 缓存5分钟
      }
      
      // 检查是否有管理员角色（管理员拥有所有权限）
      const isAdmin = userPermissions.includes('admin:*') || userPermissions.includes('*');
      
      // 检查是否有所需权限
      const hasPermission = isAdmin || 
                          userPermissions.includes(permissionCode) || 
                          userPermissions.includes(`${permissionCode.split(':')[0]}:*`);
      
      logger.info('检查用户权限', { userId, permissionCode, hasPermission });
      return hasPermission;
    } catch (error) {
      logger.error('检查用户权限失败', { userId, permissionCode, error: error.message });
      throw error;
    }
  }
  
  /**
   * 批量添加角色到用户
   * @param {Array} userIds - 用户ID列表
   * @param {string} roleId - 角色ID
   * @returns {Promise<number>} 受影响的用户数量
   */
  async batchAddUserRoles(userIds, roleId) {
    try {
      // 验证角色是否存在
      const role = await permissionRepository.getRoleById(roleId);
      if (!role) {
        throw new Error('角色不存在');
      }
      
      // 验证用户是否存在
      let validUserIds = [];
      for (const userId of userIds) {
        const user = await userRepository.getUserById(userId);
        if (user) {
          validUserIds.push(userId);
        }
      }
      
      // 批量添加角色
      let affectedCount = 0;
      for (const userId of validUserIds) {
        // 先检查用户是否已有该角色
        const existingRoles = await permissionRepository.getUserRoles(userId);
        const hasRole = existingRoles.some(r => r.id === roleId);
        
        if (!hasRole) {
          await permissionRepository.assignUserRoles(userId, [...existingRoles.map(r => r.id), roleId]);
          affectedCount++;
        }
      }
      
      // 清除相关缓存
      for (const userId of validUserIds) {
        await cacheService.clearPattern(`user_permissions:${userId}`);
      }
      
      logger.info('批量添加用户角色成功', { userCount: affectedCount, roleId });
      return affectedCount;
    } catch (error) {
      logger.error('批量添加用户角色失败', { userCount: userIds.length, roleId, error: error.message });
      throw error;
    }
  }
}

module.exports = new PermissionService();