/**
 * 用户管理控制器
 * 处理管理端用户相关的请求
 */

const di = require('../../../core/di/container');
const userService = di.resolve('userService');
const logger = di.resolve('logger');

class UserController {
  /**
   * 获取用户列表
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async getUserList(req, res) {
    try {
      const query = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        keyword: req.query.keyword || '',
        role: req.query.role || '',
        status: req.query.status || '',
        startDate: req.query.startDate || '',
        endDate: req.query.endDate || ''
      };
      
      const result = await userService.getUserList(query);
      
      res.json({
        success: true,
        data: result,
        message: '获取用户列表成功'
      });
    } catch (error) {
      logger.error('获取用户列表失败', { error: error.message, userId: req.user?.id });
      res.status(500).json({
        success: false,
        message: '获取用户列表失败',
        error: error.message
      });
    }
  }
  
  /**
   * 获取用户详情
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async getUserDetail(req, res) {
    try {
      const userId = req.params.id;
      
      const user = await userService.getUserDetail(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }
      
      res.json({
        success: true,
        data: user,
        message: '获取用户详情成功'
      });
    } catch (error) {
      logger.error('获取用户详情失败', { userId: req.params.id, error: error.message });
      res.status(500).json({
        success: false,
        message: '获取用户详情失败',
        error: error.message
      });
    }
  }
  
  /**
   * 创建用户
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async createUser(req, res) {
    try {
      const userData = req.body;
      
      const user = await userService.createUser(userData);
      
      res.status(201).json({
        success: true,
        data: user,
        message: '用户创建成功'
      });
    } catch (error) {
      logger.error('创建用户失败', { userData: req.body, error: error.message });
      res.status(400).json({
        success: false,
        message: '创建用户失败',
        error: error.message
      });
    }
  }
  
  /**
   * 更新用户
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async updateUser(req, res) {
    try {
      const userId = req.params.id;
      const userData = req.body;
      
      const user = await userService.updateUser(userId, userData);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }
      
      res.json({
        success: true,
        data: user,
        message: '用户更新成功'
      });
    } catch (error) {
      logger.error('更新用户失败', { userId, userData, error: error.message });
      res.status(400).json({
        success: false,
        message: '更新用户失败',
        error: error.message
      });
    }
  }
  
  /**
   * 删除用户
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async deleteUser(req, res) {
    try {
      const userId = req.params.id;
      
      // 不允许删除自己
      if (userId === req.user.id) {
        return res.status(400).json({
          success: false,
          message: '不允许删除当前登录用户'
        });
      }
      
      const result = await userService.deleteUser(userId);
      
      if (!result) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }
      
      res.json({
        success: true,
        message: '用户删除成功'
      });
    } catch (error) {
      logger.error('删除用户失败', { userId, error: error.message });
      res.status(500).json({
        success: false,
        message: '删除用户失败',
        error: error.message
      });
    }
  }
  
  /**
   * 批量删除用户
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async batchDeleteUsers(req, res) {
    try {
      const userIds = req.body.userIds;
      
      // 检查是否包含当前用户
      if (userIds.includes(req.user.id)) {
        return res.status(400).json({
          success: false,
          message: '不允许删除当前登录用户'
        });
      }
      
      const result = await userService.batchDeleteUsers(userIds);
      
      res.json({
        success: true,
        data: { deletedCount: result },
        message: `成功删除 ${result} 个用户`
      });
    } catch (error) {
      logger.error('批量删除用户失败', { userIds: req.body.userIds, error: error.message });
      res.status(500).json({
        success: false,
        message: '批量删除用户失败',
        error: error.message
      });
    }
  }
  
  /**
   * 更新用户状态
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async updateUserStatus(req, res) {
    try {
      const userId = req.params.id;
      const { status } = req.body;
      
      // 不允许修改自己的状态
      if (userId === req.user.id) {
        return res.status(400).json({
          success: false,
          message: '不允许修改当前登录用户状态'
        });
      }
      
      const user = await userService.updateUserStatus(userId, status);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }
      
      res.json({
        success: true,
        data: user,
        message: '用户状态更新成功'
      });
    } catch (error) {
      logger.error('更新用户状态失败', { userId, status: req.body.status, error: error.message });
      res.status(400).json({
        success: false,
        message: '更新用户状态失败',
        error: error.message
      });
    }
  }
  
  /**
   * 重置用户密码
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async resetUserPassword(req, res) {
    try {
      const userId = req.params.id;
      const { newPassword } = req.body;
      
      const result = await userService.resetUserPassword(userId, newPassword);
      
      if (!result) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }
      
      res.json({
        success: true,
        message: '密码重置成功'
      });
    } catch (error) {
      logger.error('重置用户密码失败', { userId, error: error.message });
      res.status(400).json({
        success: false,
        message: '重置用户密码失败',
        error: error.message
      });
    }
  }
  
  /**
   * 获取用户操作日志
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async getUserLogs(req, res) {
    try {
      const userId = req.params.id;
      const query = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20
      };
      
      const logs = await userService.getUserLogs(userId, query);
      
      res.json({
        success: true,
        data: logs,
        message: '获取用户操作日志成功'
      });
    } catch (error) {
      logger.error('获取用户操作日志失败', { userId, error: error.message });
      res.status(500).json({
        success: false,
        message: '获取用户操作日志失败',
        error: error.message
      });
    }
  }
  
  /**
   * 获取用户统计信息
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async getUserStatistics(req, res) {
    try {
      const statistics = await userService.getUserStatistics();
      
      res.json({
        success: true,
        data: statistics,
        message: '获取用户统计信息成功'
      });
    } catch (error) {
      logger.error('获取用户统计信息失败', { error: error.message });
      res.status(500).json({
        success: false,
        message: '获取用户统计信息失败',
        error: error.message
      });
    }
  }
}

module.exports = new UserController();