/**
 * 买家端用户控制器
 * 处理用户注册、登录、个人信息管理等功能
 */

const logger = require('../../../core/utils/logger');
const userService = require('../services/userService');
const { MESSAGE_TOPICS } = require('../../../common-api/message-queue/topics/messageTopics');
const messageProducer = require('../../../common-api/message-queue/producers/messageProducer');

class UserController {
  /**
   * 用户注册
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async register(req, res) {
    try {
      const { username, email, password, phone } = req.body;
      
      // 验证输入
      if (!username || !email || !password) {
        return res.status(400).json({
          success: false,
          message: '用户名、邮箱和密码为必填项'
        });
      }
      
      // 调用服务层注册用户
      const result = await userService.register({
        username,
        email,
        password,
        phone
      });
      
      // 发送用户注册消息
      await messageProducer.send(MESSAGE_TOPICS.USER.REGISTERED, {
        userId: result.userId,
        username,
        email,
        timestamp: new Date().toISOString()
      });
      
      logger.info(`用户注册成功: ${username} (${email})`);
      
      res.status(201).json({
        success: true,
        message: '注册成功',
        data: {
          userId: result.userId,
          username,
          email,
          token: result.token
        }
      });
    } catch (error) {
      logger.error('用户注册失败:', error);
      res.status(400).json({
        success: false,
        message: error.message || '注册失败'
      });
    }
  }
  
  /**
   * 用户登录
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;
      
      // 验证输入
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: '邮箱和密码为必填项'
        });
      }
      
      // 调用服务层登录
      const result = await userService.login(email, password);
      
      // 发送用户登录消息
      await messageProducer.send(MESSAGE_TOPICS.USER.LOGGED_IN, {
        userId: result.userId,
        username: result.username,
        email,
        timestamp: new Date().toISOString()
      });
      
      logger.info(`用户登录成功: ${result.username} (${email})`);
      
      res.json({
        success: true,
        message: '登录成功',
        data: {
          userId: result.userId,
          username: result.username,
          email: result.email,
          token: result.token,
          refreshToken: result.refreshToken
        }
      });
    } catch (error) {
      logger.error('用户登录失败:', error);
      res.status(401).json({
        success: false,
        message: error.message || '登录失败'
      });
    }
  }
  
  /**
   * 刷新令牌
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: '刷新令牌不能为空'
        });
      }
      
      const result = await userService.refreshToken(refreshToken);
      
      res.json({
        success: true,
        message: '令牌刷新成功',
        data: {
          token: result.token,
          refreshToken: result.refreshToken
        }
      });
    } catch (error) {
      logger.error('刷新令牌失败:', error);
      res.status(401).json({
        success: false,
        message: error.message || '刷新令牌失败'
      });
    }
  }
  
  /**
   * 获取用户信息
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async getUserInfo(req, res) {
    try {
      const userId = req.user.id;
      
      const userInfo = await userService.getUserInfo(userId);
      
      res.json({
        success: true,
        message: '获取用户信息成功',
        data: userInfo
      });
    } catch (error) {
      logger.error('获取用户信息失败:', error);
      res.status(500).json({
        success: false,
        message: error.message || '获取用户信息失败'
      });
    }
  }
  
  /**
   * 更新用户信息
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async updateUserInfo(req, res) {
    try {
      const userId = req.user.id;
      const updateData = req.body;
      
      const updatedUser = await userService.updateUserInfo(userId, updateData);
      
      // 发送用户信息更新消息
      await messageProducer.send(MESSAGE_TOPICS.USER.UPDATED, {
        userId,
        updateData,
        timestamp: new Date().toISOString()
      });
      
      logger.info(`用户信息更新成功: ${userId}`);
      
      res.json({
        success: true,
        message: '用户信息更新成功',
        data: updatedUser
      });
    } catch (error) {
      logger.error('更新用户信息失败:', error);
      res.status(400).json({
        success: false,
        message: error.message || '更新用户信息失败'
      });
    }
  }
  
  /**
   * 修改密码
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async changePassword(req, res) {
    try {
      const userId = req.user.id;
      const { oldPassword, newPassword } = req.body;
      
      if (!oldPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: '请输入旧密码和新密码'
        });
      }
      
      await userService.changePassword(userId, oldPassword, newPassword);
      
      logger.info(`用户密码修改成功: ${userId}`);
      
      res.json({
        success: true,
        message: '密码修改成功'
      });
    } catch (error) {
      logger.error('修改密码失败:', error);
      res.status(400).json({
        success: false,
        message: error.message || '修改密码失败'
      });
    }
  }
  
  /**
   * 忘记密码（发送重置邮件）
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({
          success: false,
          message: '邮箱不能为空'
        });
      }
      
      await userService.forgotPassword(email);
      
      logger.info(`发送密码重置邮件: ${email}`);
      
      res.json({
        success: true,
        message: '密码重置邮件已发送，请查收'
      });
    } catch (error) {
      logger.error('发送密码重置邮件失败:', error);
      res.status(400).json({
        success: false,
        message: error.message || '操作失败'
      });
    }
  }
  
  /**
   * 重置密码
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({
          success: false,
          message: '重置令牌和新密码不能为空'
        });
      }
      
      await userService.resetPassword(token, newPassword);
      
      logger.info('用户密码重置成功');
      
      res.json({
        success: true,
        message: '密码重置成功'
      });
    } catch (error) {
      logger.error('重置密码失败:', error);
      res.status(400).json({
        success: false,
        message: error.message || '重置密码失败'
      });
    }
  }
  
  /**
   * 用户登出
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async logout(req, res) {
    try {
      const userId = req.user.id;
      const token = req.headers.authorization?.split(' ')[1];
      
      // 使令牌失效
      if (token) {
        await userService.invalidateToken(token);
      }
      
      // 发送用户登出消息
      await messageProducer.send(MESSAGE_TOPICS.USER.LOGGED_OUT, {
        userId,
        timestamp: new Date().toISOString()
      });
      
      logger.info(`用户登出成功: ${userId}`);
      
      res.json({
        success: true,
        message: '登出成功'
      });
    } catch (error) {
      logger.error('用户登出失败:', error);
      res.status(500).json({
        success: false,
        message: '登出失败'
      });
    }
  }
}

module.exports = new UserController();