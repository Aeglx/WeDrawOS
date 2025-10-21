/**
 * 买家端用户服务
 * 实现用户注册、登录、个人信息管理等核心业务逻辑
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const uuid = require('uuid').v4;
const logger = require('@core/utils/logger');
const redisConfig = require('@common-api/cache-config/redisConfig');
const userRepository = require('../repositories/userRepository');

// JWT配置
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

class UserService {
  /**
   * 用户注册
   * @param {Object} userData - 用户注册数据
   * @returns {Object} 注册结果
   */
  async register(userData) {
    const { username, email, password, phone } = userData;
    
    // 检查用户名是否已存在
    const existingUserByUsername = await userRepository.findByUsername(username);
    if (existingUserByUsername) {
      throw new Error('用户名已存在');
    }
    
    // 检查邮箱是否已存在
    const existingUserByEmail = await userRepository.findByEmail(email);
    if (existingUserByEmail) {
      throw new Error('邮箱已被注册');
    }
    
    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 创建用户数据
    const user = {
      id: uuid(),
      username,
      email,
      password: hashedPassword,
      phone,
      role: 'buyer',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // 保存用户
    await userRepository.create(user);
    
    // 生成JWT令牌
    const token = this.generateToken(user.id, user.role);
    const refreshToken = this.generateRefreshToken(user.id);
    
    // 缓存刷新令牌
    await this.cacheRefreshToken(user.id, refreshToken);
    
    return {
      userId: user.id,
      username,
      email,
      token,
      refreshToken
    };
  }
  
  /**
   * 用户登录
   * @param {string} email - 用户邮箱
   * @param {string} password - 用户密码
   * @returns {Object} 登录结果
   */
  async login(email, password) {
    // 查找用户
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error('邮箱或密码错误');
    }
    
    // 检查用户状态
    if (user.status !== 'active') {
      throw new Error('账户已被禁用');
    }
    
    // 验证密码
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new Error('邮箱或密码错误');
    }
    
    // 生成令牌
    const token = this.generateToken(user.id, user.role);
    const refreshToken = this.generateRefreshToken(user.id);
    
    // 更新缓存的刷新令牌
    await this.cacheRefreshToken(user.id, refreshToken);
    
    // 更新最后登录时间
    await userRepository.updateLastLogin(user.id);
    
    return {
      userId: user.id,
      username: user.username,
      email: user.email,
      token,
      refreshToken
    };
  }
  
  /**
   * 刷新令牌
   * @param {string} refreshToken - 刷新令牌
   * @returns {Object} 新的令牌
   */
  async refreshToken(refreshToken) {
    try {
      // 验证刷新令牌
      const decoded = jwt.verify(refreshToken, JWT_SECRET);
      const userId = decoded.userId;
      
      // 检查刷新令牌是否在缓存中
      const cachedToken = await redisConfig.get(`refresh_token:${userId}`);
      if (!cachedToken || cachedToken !== refreshToken) {
        throw new Error('无效的刷新令牌');
      }
      
      // 查找用户
      const user = await userRepository.findById(userId);
      if (!user || user.status !== 'active') {
        throw new Error('用户不存在或已被禁用');
      }
      
      // 生成新的令牌
      const newToken = this.generateToken(userId, user.role);
      const newRefreshToken = this.generateRefreshToken(userId);
      
      // 更新缓存
      await this.cacheRefreshToken(userId, newRefreshToken);
      
      return {
        token: newToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      throw new Error('刷新令牌失败: ' + error.message);
    }
  }
  
  /**
   * 获取用户信息
   * @param {string} userId - 用户ID
   * @returns {Object} 用户信息
   */
  async getUserInfo(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('用户不存在');
    }
    
    // 过滤敏感信息
    const { password, ...userInfo } = user;
    return userInfo;
  }
  
  /**
   * 更新用户信息
   * @param {string} userId - 用户ID
   * @param {Object} updateData - 更新数据
   * @returns {Object} 更新后的用户信息
   */
  async updateUserInfo(userId, updateData) {
    // 过滤不允许更新的字段
    const { password, id, role, status, createdAt, ...allowedUpdates } = updateData;
    
    // 如果要更新邮箱，检查是否已被使用
    if (allowedUpdates.email) {
      const existingUser = await userRepository.findByEmail(allowedUpdates.email);
      if (existingUser && existingUser.id !== userId) {
        throw new Error('邮箱已被使用');
      }
    }
    
    // 更新用户信息
    allowedUpdates.updatedAt = new Date().toISOString();
    const updatedUser = await userRepository.update(userId, allowedUpdates);
    
    if (!updatedUser) {
      throw new Error('用户不存在');
    }
    
    // 过滤敏感信息
    const { password: _, ...userInfo } = updatedUser;
    return userInfo;
  }
  
  /**
   * 修改密码
   * @param {string} userId - 用户ID
   * @param {string} oldPassword - 旧密码
   * @param {string} newPassword - 新密码
   */
  async changePassword(userId, oldPassword, newPassword) {
    // 查找用户
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('用户不存在');
    }
    
    // 验证旧密码
    const passwordMatch = await bcrypt.compare(oldPassword, user.password);
    if (!passwordMatch) {
      throw new Error('旧密码错误');
    }
    
    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // 更新密码
    await userRepository.update(userId, {
      password: hashedPassword,
      updatedAt: new Date().toISOString()
    });
  }
  
  /**
   * 忘记密码（发送重置邮件）
   * @param {string} email - 用户邮箱
   */
  async forgotPassword(email) {
    // 查找用户
    const user = await userRepository.findByEmail(email);
    if (!user) {
      // 不提示邮箱是否存在，防止枚举攻击
      return;
    }
    
    // 生成重置令牌
    const resetToken = uuid();
    const resetTokenExpires = new Date(Date.now() + 3600000); // 1小时后过期
    
    // 保存重置令牌到数据库
    await userRepository.saveResetToken(user.id, resetToken, resetTokenExpires);
    
    // 这里应该发送邮件，目前只记录日志
    logger.info(`密码重置令牌已生成: ${resetToken} 用于邮箱: ${email}`);
    
    // TODO: 集成邮件服务发送重置邮件
  }
  
  /**
   * 重置密码
   * @param {string} token - 重置令牌
   * @param {string} newPassword - 新密码
   */
  async resetPassword(token, newPassword) {
    // 查找使用该重置令牌的用户
    const user = await userRepository.findByResetToken(token);
    if (!user) {
      throw new Error('无效的重置令牌');
    }
    
    // 检查令牌是否过期
    if (user.resetTokenExpires && new Date(user.resetTokenExpires) < new Date()) {
      throw new Error('重置令牌已过期');
    }
    
    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // 更新密码并清除重置令牌
    await userRepository.update(user.id, {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpires: null,
      updatedAt: new Date().toISOString()
    });
    
    // 使所有旧令牌失效
    await this.invalidateAllTokens(user.id);
  }
  
  /**
   * 使令牌失效
   * @param {string} token - 令牌
   */
  async invalidateToken(token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true });
      const userId = decoded.userId;
      const expiresAt = decoded.exp;
      
      // 计算令牌剩余有效期
      const now = Math.floor(Date.now() / 1000);
      const ttl = expiresAt - now;
      
      if (ttl > 0) {
        // 将令牌加入黑名单
        await redisConfig.set(`blacklist_token:${token}`, '1', ttl);
      }
    } catch (error) {
      logger.error('使令牌失效失败:', error);
    }
  }
  
  /**
   * 使所有令牌失效
   * @param {string} userId - 用户ID
   */
  async invalidateAllTokens(userId) {
    // 移除刷新令牌
    await redisConfig.del(`refresh_token:${userId}`);
    
    // TODO: 可以实现更复杂的令牌黑名单机制
  }
  
  /**
   * 生成JWT令牌
   * @param {string} userId - 用户ID
   * @param {string} role - 用户角色
   * @returns {string} JWT令牌
   */
  generateToken(userId, role) {
    return jwt.sign(
      { userId, role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  }
  
  /**
   * 生成刷新令牌
   * @param {string} userId - 用户ID
   * @returns {string} 刷新令牌
   */
  generateRefreshToken(userId) {
    return jwt.sign(
      { userId },
      JWT_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
    );
  }
  
  /**
   * 缓存刷新令牌
   * @param {string} userId - 用户ID
   * @param {string} refreshToken - 刷新令牌
   */
  async cacheRefreshToken(userId, refreshToken) {
    // 解析刷新令牌的过期时间
    const decoded = jwt.verify(refreshToken, JWT_SECRET, { ignoreExpiration: true });
    const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
    
    await redisConfig.set(`refresh_token:${userId}`, refreshToken, expiresIn);
  }
}

module.exports = new UserService();