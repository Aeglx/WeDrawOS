const userService = require('../services/userService');
const logger = require('../../../../utils/logger');

/**
 * 用户管理控制器
 */
class UserController {
  /**
   * 获取用户列表
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async getUsers(req, res) {
    try {
      logger.info('获取用户列表请求', { query: req.query });
      
      // 解析查询参数
      const { 
        page = 1, 
        pageSize = 10, 
        id, 
        username, 
        email, 
        phone, 
        openid, 
        status, 
        role,
        membership
      } = req.query;
      
      // 构建查询条件
      const query = {
        id,
        username,
        email,
        phone,
        openid,
        status: status === 'active' ? 1 : status === 'inactive' ? 0 : undefined,
        role,
        membership
      };
      
      // 调用服务层获取用户列表
      const { users, total } = await userService.getUsers(query, {
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      });
      
      res.json({
        success: true,
        data: {
          users,
          total,
          page: parseInt(page),
          pageSize: parseInt(pageSize)
        }
      });
    } catch (error) {
      logger.error('获取用户列表失败', { error: error.message });
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
      const { userId } = req.params;
      logger.info('获取用户详情请求', { userId });
      
      const user = await userService.getUserDetail(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }
      
      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      logger.error('获取用户详情失败', { userId: req.params.userId, error: error.message });
      res.status(500).json({
        success: false,
        message: '获取用户详情失败',
        error: error.message
      });
    }
  }

  /**
   * 添加用户
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async addUser(req, res) {
    try {
      logger.info('添加用户请求', { body: req.body });
      
      const userData = {
        ...req.body,
        status: req.body.status === 'active' ? 1 : 0
      };
      
      const newUser = await userService.addUser(userData);
      
      res.json({
        success: true,
        message: '添加用户成功',
        data: newUser
      });
    } catch (error) {
      logger.error('添加用户失败', { error: error.message });
      res.status(500).json({
        success: false,
        message: '添加用户失败',
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
      const { userId } = req.params;
      const { status } = req.body;
      logger.info('更新用户状态请求', { userId, status });
      
      const result = await userService.updateUserStatus(userId, status);
      
      if (!result) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }
      
      res.json({
        success: true,
        message: '更新状态成功',
        data: result
      });
    } catch (error) {
      logger.error('更新用户状态失败', { userId: req.params.userId, error: error.message });
      res.status(500).json({
        success: false,
        message: '更新状态失败',
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
      const { userId } = req.params;
      logger.info('删除用户请求', { userId });
      
      const result = await userService.deleteUser(userId);
      
      if (!result) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }
      
      res.json({
        success: true,
        message: '删除用户成功'
      });
    } catch (error) {
      logger.error('删除用户失败', { userId: req.params.userId, error: error.message });
      res.status(500).json({
        success: false,
        message: '删除用户失败',
        error: error.message
      });
    }
  }
}

module.exports = new UserController();