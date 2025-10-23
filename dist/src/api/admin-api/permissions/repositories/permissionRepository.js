/**
 * 权限控制数据仓库
 * 处理权限相关的数据操作
 */

const di = require('../../../core/di/container');
const BaseRepository = require('../../../core/repositories/baseRepository');
const logger = di.resolve('logger');

// 模拟角色数据
let roles = [
  {
    id: 'admin',
    name: '超级管理员',
    code: 'admin',
    description: '拥有系统所有权限',
    isSystem: true,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date()
  },
  {
    id: 'editor',
    name: '编辑',
    code: 'editor',
    description: '内容编辑权限',
    isSystem: true,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date()
  },
  {
    id: 'user',
    name: '普通用户',
    code: 'user',
    description: '基础功能权限',
    isSystem: true,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date()
  }
];

// 模拟权限数据
let permissions = [
  // 系统管理权限
  { id: '1', code: 'system:config:view', name: '查看系统配置', group: '系统管理', description: '查看系统配置信息' },
  { id: '2', code: 'system:config:update', name: '修改系统配置', group: '系统管理', description: '修改系统配置信息' },
  { id: '3', code: 'system:log:view', name: '查看系统日志', group: '系统管理', description: '查看系统运行日志' },
  { id: '4', code: 'system:backup', name: '系统备份', group: '系统管理', description: '备份系统数据' },
  
  // 用户管理权限
  { id: '5', code: 'user:list', name: '查看用户列表', group: '用户管理', description: '查看所有用户列表' },
  { id: '6', code: 'user:create', name: '创建用户', group: '用户管理', description: '创建新用户' },
  { id: '7', code: 'user:update', name: '更新用户', group: '用户管理', description: '更新用户信息' },
  { id: '8', code: 'user:delete', name: '删除用户', group: '用户管理', description: '删除用户' },
  { id: '9', code: 'user:status', name: '修改用户状态', group: '用户管理', description: '启用/禁用用户' },
  { id: '10', code: 'user:password:reset', name: '重置用户密码', group: '用户管理', description: '重置用户密码' },
  
  // 权限管理权限
  { id: '11', code: 'role:list', name: '查看角色列表', group: '权限管理', description: '查看所有角色列表' },
  { id: '12', code: 'role:create', name: '创建角色', group: '权限管理', description: '创建新角色' },
  { id: '13', code: 'role:update', name: '更新角色', group: '权限管理', description: '更新角色信息' },
  { id: '14', code: 'role:delete', name: '删除角色', group: '权限管理', description: '删除角色' },
  { id: '15', code: 'role:permission:assign', name: '分配角色权限', group: '权限管理', description: '为角色分配权限' },
  { id: '16', code: 'user:role:assign', name: '分配用户角色', group: '权限管理', description: '为用户分配角色' },
  
  // 商品管理权限
  { id: '17', code: 'product:list', name: '查看商品列表', group: '商品管理', description: '查看所有商品列表' },
  { id: '18', code: 'product:create', name: '创建商品', group: '商品管理', description: '创建新商品' },
  { id: '19', code: 'product:update', name: '更新商品', group: '商品管理', description: '更新商品信息' },
  { id: '20', code: 'product:delete', name: '删除商品', group: '商品管理', description: '删除商品' },
  { id: '21', code: 'product:status', name: '修改商品状态', group: '商品管理', description: '上架/下架商品' },
  
  // 订单管理权限
  { id: '22', code: 'order:list', name: '查看订单列表', group: '订单管理', description: '查看所有订单列表' },
  { id: '23', code: 'order:detail', name: '查看订单详情', group: '订单管理', description: '查看订单详细信息' },
  { id: '24', code: 'order:update', name: '更新订单', group: '订单管理', description: '更新订单信息' },
  { id: '25', code: 'order:status', name: '修改订单状态', group: '订单管理', description: '修改订单状态' },
  { id: '26', code: 'order:refund:process', name: '处理退款', group: '订单管理', description: '处理订单退款申请' },
  
  // 数据统计权限
  { id: '27', code: 'statistics:order', name: '订单统计', group: '数据统计', description: '查看订单统计数据' },
  { id: '28', code: 'statistics:product', name: '商品统计', group: '数据统计', description: '查看商品统计数据' },
  { id: '29', code: 'statistics:user', name: '用户统计', group: '数据统计', description: '查看用户统计数据' },
  { id: '30', code: 'statistics:sales', name: '销售统计', group: '数据统计', description: '查看销售统计数据' },
  
  // 运营管理权限
  { id: '31', code: 'promotion:create', name: '创建促销', group: '运营管理', description: '创建促销活动' },
  { id: '32', code: 'promotion:update', name: '更新促销', group: '运营管理', description: '更新促销活动' },
  { id: '33', code: 'promotion:delete', name: '删除促销', group: '运营管理', description: '删除促销活动' },
  { id: '34', code: 'coupon:create', name: '创建优惠券', group: '运营管理', description: '创建优惠券' },
  { id: '35', code: 'coupon:update', name: '更新优惠券', group: '运营管理', description: '更新优惠券' },
  { id: '36', code: 'coupon:delete', name: '删除优惠券', group: '运营管理', description: '删除优惠券' },
  
  // 企业微信和公众号平台接口权限（卖家可通过平台访问）
  { id: '37', code: 'wechat:platform:message:send', name: '发送消息', group: '企业微信接口', description: '通过平台发送企业微信或公众号消息' },
  { id: '38', code: 'wechat:platform:template:use', name: '使用模板', group: '企业微信接口', description: '使用预设模板发送消息' },
  { id: '39', code: 'wechat:platform:menu:preview', name: '预览菜单', group: '企业微信接口', description: '预览自定义菜单效果' },
  { id: '40', code: 'wechat:platform:qrcode:generate', name: '生成二维码', group: '企业微信接口', description: '生成推广二维码' },
  { id: '41', code: 'wechat:platform:media:upload', name: '上传素材', group: '企业微信接口', description: '上传图片、视频等素材' },
  { id: '42', code: 'wechat:platform:analytics:view', name: '查看分析数据', group: '企业微信接口', description: '查看消息发送和用户互动数据' },
  { id: '43', code: 'wechat:platform:access', name: '平台接口访问', group: '企业微信接口', description: '访问企业微信平台接口的基础权限' }
];

// 模拟角色权限关联
let rolePermissions = [
  // 超级管理员拥有所有权限
  { roleId: 'admin', permissionCode: '*' },
  
  // 编辑权限
  { roleId: 'editor', permissionCode: 'product:list' },
  { roleId: 'editor', permissionCode: 'product:create' },
  { roleId: 'editor', permissionCode: 'product:update' },
  { roleId: 'editor', permissionCode: 'product:status' },
  { roleId: 'editor', permissionCode: 'order:list' },
  { roleId: 'editor', permissionCode: 'order:detail' },
  { roleId: 'editor', permissionCode: 'statistics:order' },
  { roleId: 'editor', permissionCode: 'statistics:product' },
  
  // 普通用户权限（基础功能）
  { roleId: 'user', permissionCode: 'product:list' },
  { roleId: 'user', permissionCode: 'order:list' },
  { roleId: 'user', permissionCode: 'order:detail' }
];

// 模拟用户角色关联
let userRoles = [
  { userId: '1', roleId: 'admin' }, // admin用户拥有管理员角色
  { userId: '2', roleId: 'editor' }, // editor用户拥有编辑角色
  { userId: '3', roleId: 'user' }    // user1用户拥有普通用户角色
];

class PermissionRepository extends BaseRepository {
  constructor() {
    super();
    logger.info('权限控制数据仓库初始化');
  }
  
  /**
   * 获取角色列表
   * @param {Object} query - 查询参数
   * @returns {Promise<Object>} 角色列表
   */
  async getRoleList(query) {
    try {
      const { page, limit, keyword } = query;
      
      // 过滤角色
      let filteredRoles = [...roles];
      
      if (keyword) {
        const lowerKeyword = keyword.toLowerCase();
        filteredRoles = filteredRoles.filter(role => 
          role.name.toLowerCase().includes(lowerKeyword) ||
          role.code.toLowerCase().includes(lowerKeyword) ||
          role.description.toLowerCase().includes(lowerKeyword)
        );
      }
      
      // 排序（创建时间倒序）
      filteredRoles.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      // 分页
      const total = filteredRoles.length;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedRoles = filteredRoles.slice(startIndex, endIndex);
      
      return {
        items: paginatedRoles,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error('获取角色列表失败', { error: error.message });
      throw error;
    }
  }
  
  /**
   * 根据ID获取角色
   * @param {string} roleId - 角色ID
   * @returns {Promise<Object|null>} 角色信息
   */
  async getRoleById(roleId) {
    try {
      const role = roles.find(r => r.id === roleId);
      return role ? { ...role } : null;
    } catch (error) {
      logger.error('根据ID获取角色失败', { roleId, error: error.message });
      throw error;
    }
  }
  
  /**
   * 根据名称获取角色
   * @param {string} name - 角色名称
   * @returns {Promise<Object|null>} 角色信息
   */
  async getRoleByName(name) {
    try {
      const role = roles.find(r => r.name === name);
      return role ? { ...role } : null;
    } catch (error) {
      logger.error('根据名称获取角色失败', { name, error: error.message });
      throw error;
    }
  }
  
  /**
   * 根据代码获取角色
   * @param {string} code - 角色代码
   * @returns {Promise<Object|null>} 角色信息
   */
  async getRoleByCode(code) {
    try {
      const role = roles.find(r => r.code === code);
      return role ? { ...role } : null;
    } catch (error) {
      logger.error('根据代码获取角色失败', { code, error: error.message });
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
      const newRole = {
        id: Date.now().toString(),
        ...roleData,
        isSystem: false // 非系统角色
      };
      
      roles.push(newRole);
      
      logger.info('创建角色成功', { roleId: newRole.id, roleName: newRole.name });
      return { ...newRole };
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
      const roleIndex = roles.findIndex(r => r.id === roleId);
      
      if (roleIndex === -1) {
        return null;
      }
      
      // 不能修改系统角色的关键信息
      if (roles[roleIndex].isSystem) {
        delete roleData.code;
        delete roleData.isSystem;
      }
      
      roles[roleIndex] = {
        ...roles[roleIndex],
        ...roleData
      };
      
      logger.info('更新角色成功', { roleId });
      return { ...roles[roleIndex] };
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
      const roleIndex = roles.findIndex(r => r.id === roleId);
      
      if (roleIndex === -1) {
        return false;
      }
      
      // 不能删除系统角色
      if (roles[roleIndex].isSystem) {
        throw new Error('不能删除系统角色');
      }
      
      roles.splice(roleIndex, 1);
      
      logger.info('删除角色成功', { roleId });
      return true;
    } catch (error) {
      logger.error('删除角色失败', { roleId, error: error.message });
      throw error;
    }
  }
  
  /**
   * 获取所有权限
   * @returns {Promise<Array>} 权限列表
   */
  async getAllPermissions() {
    try {
      // 按组分类
      const permissionsByGroup = permissions.reduce((groups, permission) => {
        if (!groups[permission.group]) {
          groups[permission.group] = [];
        }
        groups[permission.group].push(permission);
        return groups;
      }, {});
      
      // 转换为数组格式
      const result = Object.entries(permissionsByGroup).map(([group, perms]) => ({
        group,
        permissions: perms
      }));
      
      return result;
    } catch (error) {
      logger.error('获取所有权限失败', { error: error.message });
      throw error;
    }
  }
  
  /**
   * 获取角色权限
   * @param {string} roleId - 角色ID
   * @returns {Promise<Array>} 权限代码列表
   */
  async getRolePermissions(roleId) {
    try {
      const rolePerms = rolePermissions
        .filter(rp => rp.roleId === roleId)
        .map(rp => rp.permissionCode);
      
      // 如果有通配符权限，返回所有权限代码
      if (rolePerms.includes('*')) {
        return permissions.map(p => p.code);
      }
      
      return rolePerms;
    } catch (error) {
      logger.error('获取角色权限失败', { roleId, error: error.message });
      throw error;
    }
  }
  
  /**
   * 分配角色权限
   * @param {string} roleId - 角色ID
   * @param {Array} permissionCodes - 权限代码列表
   */
  async assignRolePermissions(roleId, permissionCodes) {
    try {
      for (const permissionCode of permissionCodes) {
        rolePermissions.push({
          roleId,
          permissionCode
        });
      }
      
      logger.info('分配角色权限成功', { roleId, permissionCount: permissionCodes.length });
    } catch (error) {
      logger.error('分配角色权限失败', { roleId, permissionCount: permissionCodes.length, error: error.message });
      throw error;
    }
  }
  
  /**
   * 移除角色所有权限
   * @param {string} roleId - 角色ID
   */
  async removeRolePermissions(roleId) {
    try {
      rolePermissions = rolePermissions.filter(rp => rp.roleId !== roleId);
      
      logger.info('移除角色权限成功', { roleId });
    } catch (error) {
      logger.error('移除角色权限失败', { roleId, error: error.message });
      throw error;
    }
  }
  
  /**
   * 获取用户角色
   * @param {string} userId - 用户ID
   * @returns {Promise<Array>} 角色列表
   */
  async getUserRoles(userId) {
    try {
      const userRoleIds = userRoles
        .filter(ur => ur.userId === userId)
        .map(ur => ur.roleId);
      
      // 获取角色信息
      const userRolesInfo = roles.filter(r => userRoleIds.includes(r.id));
      
      return userRolesInfo;
    } catch (error) {
      logger.error('获取用户角色失败', { userId, error: error.message });
      throw error;
    }
  }
  
  /**
   * 分配用户角色
   * @param {string} userId - 用户ID
   * @param {Array} roleIds - 角色ID列表
   */
  async assignUserRoles(userId, roleIds) {
    try {
      for (const roleId of roleIds) {
        userRoles.push({
          userId,
          roleId
        });
      }
      
      logger.info('分配用户角色成功', { userId, roleCount: roleIds.length });
    } catch (error) {
      logger.error('分配用户角色失败', { userId, roleCount: roleIds.length, error: error.message });
      throw error;
    }
  }
  
  /**
   * 移除用户所有角色
   * @param {string} userId - 用户ID
   */
  async removeUserRoles(userId) {
    try {
      userRoles = userRoles.filter(ur => ur.userId !== userId);
      
      logger.info('移除用户角色成功', { userId });
    } catch (error) {
      logger.error('移除用户角色失败', { userId, error: error.message });
      throw error;
    }
  }
  
  /**
   * 获取角色关联的用户数量
   * @param {string} roleId - 角色ID
   * @returns {Promise<number>} 用户数量
   */
  async getUserCountByRole(roleId) {
    try {
      const userCount = userRoles.filter(ur => ur.roleId === roleId).length;
      return userCount;
    } catch (error) {
      logger.error('获取角色关联用户数量失败', { roleId, error: error.message });
      throw error;
    }
  }
  
  /**
   * 根据权限代码获取权限信息
   * @param {string} code - 权限代码
   * @returns {Promise<Object|null>} 权限信息
   */
  async getPermissionByCode(code) {
    try {
      const permission = permissions.find(p => p.code === code);
      return permission ? { ...permission } : null;
    } catch (error) {
      logger.error('根据代码获取权限失败', { code, error: error.message });
      throw error;
    }
  }
}

module.exports = new PermissionRepository();