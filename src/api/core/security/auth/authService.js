/**
 * 认证服务
 * 提供用户认证相关的核心功能
 */

const UserRepository = require('../../data-access/repositories/UserRepository');
const securityUtils = require('../securityUtils');
const cacheManager = require('../../cache/cacheManager');
const logger = require('../../utils/logger');
const {
  AuthenticationError,
  ValidationError,
  ServerError
} = require('../../exception/handlers/errorHandler');

class AuthService {
  constructor() {
    this.userRepository = new UserRepository();
  }

  /**
   * 用户登录
   * @param {Object} credentials - 登录凭证
   * @param {string} credentials.username - 用户名
   * @param {string} credentials.password - 密码
   * @returns {Promise<Object>} 包含令牌和用户信息的对象
   */
  async login(credentials) {
    try {
      const { username, password } = credentials;

      // 验证输入
      if (!username || !password) {
        throw new ValidationError('用户名和密码不能为空');
      }

      // 查找用户
      const user = await this.userRepository.findByUsername(username);
      if (!user) {
        throw new AuthenticationError('用户名或密码错误');
      }

      // 验证密码
      const isValidPassword = securityUtils.verifyPassword(password, user.password);
      if (!isValidPassword) {
        throw new AuthenticationError('用户名或密码错误');
      }

      // 检查用户状态
      if (user.status !== 'active') {
        throw new AuthenticationError('用户账号已被禁用');
      }

      // 生成令牌
      const tokenPayload = {
        id: user.id,
        username: user.username,
        role: user.role,
        email: user.email
      };

      const token = securityUtils.generateToken(tokenPayload);
      const refreshToken = securityUtils.generateToken(tokenPayload, '7d');

      // 将刷新令牌存入缓存
      const refreshTokenKey = `refresh_token:${user.id}`;
      await cacheManager.set(refreshTokenKey, refreshToken, 7 * 24 * 60 * 60); // 7天

      // 移除敏感信息
      const { password: _, ...userInfo } = user;

      return {
        token,
        refreshToken,
        user: userInfo
      };
    } catch (error) {
      logger.error('用户登录失败', error, { credentials });
      throw error;
    }
  }

  /**
   * 用户注册
   * @param {Object} userData - 用户注册数据
   * @returns {Promise<Object>} 注册成功的用户信息
   */
  async register(userData) {
    try {
      const { username, email, password, confirmPassword } = userData;

      // 验证输入
      if (!username || !email || !password || !confirmPassword) {
        throw new ValidationError('所有字段都不能为空');
      }

      if (password !== confirmPassword) {
        throw new ValidationError('两次输入的密码不一致');
      }

      // 检查用户名是否已存在
      const existingUser = await this.userRepository.findByUsername(username);
      if (existingUser) {
        throw new ValidationError('用户名已被使用');
      }

      // 检查邮箱是否已存在
      const existingEmail = await this.userRepository.findByEmail(email);
      if (existingEmail) {
        throw new ValidationError('邮箱已被注册');
      }

      // 哈希密码
      const hashedPassword = securityUtils.hashPassword(password);

      // 创建用户
      const newUser = await this.userRepository.createUser({
        ...userData,
        password: hashedPassword,
        role: userData.role || 'buyer', // 默认角色为买家
        status: 'active' // 默认状态为激活
      });

      // 移除敏感信息
      const { password: _, ...userInfo } = newUser;

      return userInfo;
    } catch (error) {
      logger.error('用户注册失败', error, { userData });
      throw error;
    }
  }

  /**
   * 用户登出
   * @param {number} userId - 用户ID
   * @returns {Promise<boolean>} 登出结果
   */
  async logout(userId) {
    try {
      // 从缓存中删除刷新令牌
      const refreshTokenKey = `refresh_token:${userId}`;
      await cacheManager.del(refreshTokenKey);

      // 在实际项目中，还可以将令牌加入黑名单
      return true;
    } catch (error) {
      logger.error('用户登出失败', error, { userId });
      throw new ServerError('登出失败');
    }
  }

  /**
   * 刷新令牌
   * @param {string} refreshToken - 刷新令牌
   * @returns {Promise<Object>} 新的访问令牌
   */
  async refreshToken(refreshToken) {
    try {
      if (!refreshToken) {
        throw new ValidationError('刷新令牌不能为空');
      }

      // 验证刷新令牌
      const decoded = securityUtils.verifyToken(refreshToken);
      const userId = decoded.id;

      // 从缓存中获取刷新令牌
      const refreshTokenKey = `refresh_token:${userId}`;
      const storedRefreshToken = await cacheManager.get(refreshTokenKey);

      if (!storedRefreshToken || storedRefreshToken !== refreshToken) {
        throw new AuthenticationError('刷新令牌无效或已过期');
      }

      // 生成新的访问令牌
      const newToken = securityUtils.generateToken({
        id: decoded.id,
        username: decoded.username,
        role: decoded.role,
        email: decoded.email
      });

      return { token: newToken };
    } catch (error) {
      if (error instanceof ValidationError || error instanceof AuthenticationError) {
        throw error;
      }
      logger.error('刷新令牌失败', error, { refreshToken });
      throw new AuthenticationError('刷新令牌无效或已过期');
    }
  }

  /**
   * 修改密码
   * @param {number} userId - 用户ID
   * @param {Object} passwordData - 密码数据
   * @param {string} passwordData.oldPassword - 旧密码
   * @param {string} passwordData.newPassword - 新密码
   * @param {string} passwordData.confirmPassword - 确认新密码
   * @returns {Promise<boolean>} 修改结果
   */
  async changePassword(userId, passwordData) {
    try {
      const { oldPassword, newPassword, confirmPassword } = passwordData;

      // 验证输入
      if (!oldPassword || !newPassword || !confirmPassword) {
        throw new ValidationError('所有字段都不能为空');
      }

      if (newPassword !== confirmPassword) {
        throw new ValidationError('两次输入的新密码不一致');
      }

      // 查找用户
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new AuthenticationError('用户不存在');
      }

      // 验证旧密码
      const isValidPassword = securityUtils.verifyPassword(oldPassword, user.password);
      if (!isValidPassword) {
        throw new AuthenticationError('旧密码错误');
      }

      // 哈希新密码
      const hashedPassword = securityUtils.hashPassword(newPassword);

      // 更新密码
      await this.userRepository.updateById(userId, { password: hashedPassword });

      // 强制用户重新登录
      await this.logout(userId);

      return true;
    } catch (error) {
      logger.error('修改密码失败', error, { userId, passwordData });
      throw error;
    }
  }

  /**
   * 重置密码（管理员功能）
   * @param {number} userId - 用户ID
   * @param {string} newPassword - 新密码
   * @returns {Promise<boolean>} 重置结果
   */
  async resetPassword(userId, newPassword) {
    try {
      if (!newPassword) {
        throw new ValidationError('新密码不能为空');
      }

      // 查找用户
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new AuthenticationError('用户不存在');
      }

      // 哈希新密码
      const hashedPassword = securityUtils.hashPassword(newPassword);

      // 更新密码
      await this.userRepository.updateById(userId, { password: hashedPassword });

      // 强制用户重新登录
      await this.logout(userId);

      return true;
    } catch (error) {
      logger.error('重置密码失败', error, { userId });
      throw error;
    }
  }

  /**
   * 获取用户信息
   * @param {number} userId - 用户ID
   * @returns {Promise<Object>} 用户信息
   */
  async getUserInfo(userId) {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new AuthenticationError('用户不存在');
      }

      // 移除敏感信息
      const { password: _, ...userInfo } = user;

      return userInfo;
    } catch (error) {
      logger.error('获取用户信息失败', error, { userId });
      throw error;
    }
  }

  /**
   * 验证用户状态
   * @param {number} userId - 用户ID
   * @returns {Promise<Object>} 用户状态信息
   */
  async validateUserStatus(userId) {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return { valid: false, message: '用户不存在' };
      }

      if (user.status !== 'active') {
        return { valid: false, message: '用户账号已被禁用' };
      }

      return { valid: true, user };
    } catch (error) {
      logger.error('验证用户状态失败', error, { userId });
      return { valid: false, message: '验证失败' };
    }
  }

  /**
   * 检查令牌有效性
   * @param {string} token - JWT令牌
   * @returns {Promise<Object>} 令牌验证结果
   */
  async checkToken(token) {
    try {
      const decoded = securityUtils.verifyToken(token);
      const { id } = decoded;

      // 验证用户状态
      const statusCheck = await this.validateUserStatus(id);
      if (!statusCheck.valid) {
        return { valid: false, message: statusCheck.message };
      }

      return { valid: true, decoded };
    } catch (error) {
      logger.error('检查令牌有效性失败', error);
      return { valid: false, message: '令牌无效或已过期' };
    }
  }
}

// 导出单例实例
module.exports = new AuthService();