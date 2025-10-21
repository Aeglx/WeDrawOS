/**
 * 权限控制控制器
 * 处理管理端权限相关的请求
 */

const di = require('../../../core/di/container');
const permissionService = di.resolve('permissionService');
const logger = di.resolve('logger');

class PermissionController {
  /**
   * 获取角色列表
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async getRoleList(req, res) {
    try {
      const query = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        keyword: req.query.keyword || ''
      };
      
      const result = await permissionService.getRoleList(query);
      
      res.json({
        success: true,
        data: result,
        message: '获取角色列表成功'
      });
    } catch (error) {
      logger.error('获取角色列表失败', { error: error.message });
      res.status(500).json({
        success: false,
        message: '获取角色列表失败',
        error: error.message
      });
    }
  }
  
  /**
   * 获取角色详情
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async getRoleDetail(req, res) {
    try {
      const roleId = req.params.id;
      
      const role = await permissionService.getRoleDetail(roleId);
      
      if (!role) {
        return res.status(404).json({
          success: false,
          message: '角色不存在'
        });
      }
      
      res.json({
        success: true,
        data: role,
        message: '获取角色详情成功'
      });
    } catch (error) {
      logger.error('获取角色详情失败', { roleId, error: error.message });
      res.status(500).json({
        success: false,
        message: '获取角色详情失败',
        error: error.message
      });
    }
  }
  
  /**
   * 创建角色
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async createRole(req, res) {
    try {
      const roleData = req.body;
      
      const role = await permissionService.createRole(roleData);
      
      res.status(201).json({
        success: true,
        data: role,
        message: '角色创建成功'
      });
    } catch (error) {
      logger.error('创建角色失败', { roleData, error: error.message });
      res.status(400).json({
        success: false,
        message: '创建角色失败',
        error: error.message
      });
    }
  }
  
  /**
   * 更新角色
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async updateRole(req, res) {
    try {
      const roleId = req.params.id;
      const roleData = req.body;
      
      const role = await permissionService.updateRole(roleId, roleData);
      
      if (!role) {
        return res.status(404).json({
          success: false,
          message: '角色不存在'
        });
      }
      
      res.json({
        success: true,
        data: role,
        message: '角色更新成功'
      });
    } catch (error) {
      logger.error('更新角色失败', { roleId, roleData, error: error.message });
      res.status(400).json({
        success: false,
        message: '更新角色失败',
        error: error.message
      });
    }
  }
  
  /**
   * 删除角色
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async deleteRole(req, res) {
    try {
      const roleId = req.params.id;
      
      // 不允许删除内置角色
      if (roleId === 'admin' || roleId === 'editor' || roleId === 'user') {
        return res.status(400).json({
          success: false,
          message: '不允许删除内置角色'
        });
      }
      
      const result = await permissionService.deleteRole(roleId);
      
      if (!result) {
        return res.status(404).json({
          success: false,
          message: '角色不存在'
        });
      }
      
      res.json({
        success: true,
        message: '角色删除成功'
      });
    } catch (error) {
      logger.error('删除角色失败', { roleId, error: error.message });
      res.status(500).json({
        success: false,
        message: '删除角色失败',
        error: error.message
      });
    }
  }
  
  /**
   * 获取权限列表
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async getPermissionList(req, res) {
    try {
      const permissions = await permissionService.getPermissionList();
      
      res.json({
        success: true,
        data: permissions,
        message: '获取权限列表成功'
      });
    } catch (error) {
      logger.error('获取权限列表失败', { error: error.message });
      res.status(500).json({
        success: false,
        message: '获取权限列表失败',
        error: error.message
      });
    }
  }
  
  /**
   * 更新角色权限
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async updateRolePermissions(req, res) {
    try {
      const roleId = req.params.id;
      const { permissions } = req.body;
      
      const result = await permissionService.updateRolePermissions(roleId, permissions);
      
      if (!result) {
        return res.status(404).json({
          success: false,
          message: '角色不存在'
        });
      }
      
      res.json({
        success: true,
        message: '角色权限更新成功'
      });
    } catch (error) {
      logger.error('更新角色权限失败', { roleId, permissions: req.body.permissions, error: error.message });
      res.status(400).json({
        success: false,
        message: '更新角色权限失败',
        error: error.message
      });
    }
  }
  
  /**
   * 获取用户角色列表
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async getUserRoles(req, res) {
    try {
      const userId = req.params.userId;
      
      const roles = await permissionService.getUserRoles(userId);
      
      res.json({
        success: true,
        data: roles,
        message: '获取用户角色列表成功'
      });
    } catch (error) {
      logger.error('获取用户角色列表失败', { userId: req.params.userId, error: error.message });
      res.status(500).json({
        success: false,
        message: '获取用户角色列表失败',
        error: error.message
      });
    }
  }
  
  /**
   * 更新用户角色
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async updateUserRoles(req, res) {
    try {
      const userId = req.params.userId;
      const { roleIds } = req.body;
      
      // 不允许将普通用户设置为管理员（除非当前用户是管理员）
      if (roleIds.includes('admin') && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: '没有权限设置管理员角色'
        });
      }
      
      const result = await permissionService.updateUserRoles(userId, roleIds);
      
      res.json({
        success: true,
        message: '用户角色更新成功'
      });
    } catch (error) {
      logger.error('更新用户角色失败', { userId, roleIds: req.body.roleIds, error: error.message });
      res.status(400).json({
        success: false,
        message: '更新用户角色失败',
        error: error.message
      });
    }
  }
  
  /**
   * 检查用户权限
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async checkPermission(req, res) {
    try {
      const { permission } = req.query;
      
      const hasPermission = await permissionService.checkUserPermission(req.user.id, permission);
      
      res.json({
        success: true,
        data: { hasPermission },
        message: '权限检查成功'
      });
    } catch (error) {
      logger.error('检查用户权限失败', { userId: req.user.id, permission: req.query.permission, error: error.message });
      res.status(500).json({
        success: false,
        message: '权限检查失败',
        error: error.message
      });
    }
  }
  
  /**
   * 批量添加角色到用户
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async batchAddUserRoles(req, res) {
    try {
      const { userIds, roleId } = req.body;
      
      // 不允许批量设置管理员角色
      if (roleId === 'admin' && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: '没有权限批量设置管理员角色'
        });
      }
      
      const result = await permissionService.batchAddUserRoles(userIds, roleId);
      
      res.json({
        success: true,
        data: { affectedCount: result },
        message: `成功为 ${result} 个用户添加角色`
      });
    } catch (error) {
      logger.error('批量添加用户角色失败', { userIds: req.body.userIds, roleId: req.body.roleId, error: error.message });
      res.status(400).json({
        success: false,
        message: '批量添加用户角色失败',
        error: error.message
      });
    }
  }
}

module.exports = new PermissionController();