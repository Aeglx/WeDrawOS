import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../config/config.js';
import db from '../models/index.js';
import {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  InternalServerError
} from '../utils/errors.js';

const { User } = db.models;
const jwtConfig = config.getConfig('jwt');

/**
 * 用户控制器
 * 处理用户相关的业务逻辑
 */
class UserController {
  /**
   * 用户注册
   */
  static async register(req, res, next) {
    try {
      // 验证请求数据
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new BadRequestError('请求数据验证失败', errors.array());
      }

      const { 
        username, 
        email, 
        password, 
        firstName, 
        lastName, 
        role = 'customer' 
      } = req.body;

      // 检查用户名是否已存在
      const existingUser = await User.findOne({
        where: { 
          [db.Sequelize.Op.or]: [{ username }, { email }] 
        }
      });

      if (existingUser) {
        if (existingUser.username === username) {
          throw new ConflictError('用户名已存在');
        }
        throw new ConflictError('邮箱已被注册');
      }

      // 生成密码哈希
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // 创建用户
      const user = await User.create({
        username,
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role,
        status: role === 'admin' ? 'active' : 'pending', // 非管理员用户需要审核
        profilePicture: null,
        lastLogin: null,
        loginCount: 0
      });

      // 生成令牌
      const token = jwt.sign(
        { userId: user.id, role: user.role },
        jwtConfig.secret,
        { expiresIn: jwtConfig.accessTokenExpiry }
      );

      const refreshToken = jwt.sign(
        { userId: user.id },
        jwtConfig.refreshSecret,
        { expiresIn: jwtConfig.refreshTokenExpiry }
      );

      // 记录创建日志
      await db.models.WorkLog.logUserCreation({
        userId: user.id,
        createdBy: req.user?.id || 'system',
        details: { role: user.role, status: user.status }
      });

      res.status(201).json({
        success: true,
        message: '用户注册成功',
        data: {
          user: user.toSafeObject(),
          token,
          refreshToken
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 用户登录
   */
  static async login(req, res, next) {
    try {
      // 验证请求数据
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new BadRequestError('请求数据验证失败', errors.array());
      }

      const { username, password } = req.body;

      // 查找用户
      const user = await User.findOne({
        where: { 
          [db.Sequelize.Op.or]: [{ username }, { email: username }] 
        }
      });

      if (!user) {
        throw new UnauthorizedError('用户名或密码错误');
      }

      // 检查用户状态
      if (user.status !== 'active') {
        if (user.status === 'pending') {
          throw new ForbiddenError('账号正在审核中，请稍后再试');
        } else if (user.status === 'suspended') {
          throw new ForbiddenError('账号已被禁用，请联系管理员');
        } else if (user.status === 'inactive') {
          throw new ForbiddenError('账号未激活');
        }
      }

      // 验证密码
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        throw new UnauthorizedError('用户名或密码错误');
      }

      // 更新登录信息
      await user.update({
        lastLogin: new Date(),
        loginCount: user.loginCount + 1
      });

      // 生成令牌
      const token = jwt.sign(
        { userId: user.id, role: user.role },
        jwtConfig.secret,
        { expiresIn: jwtConfig.accessTokenExpiry }
      );

      const refreshToken = jwt.sign(
        { userId: user.id },
        jwtConfig.refreshSecret,
        { expiresIn: jwtConfig.refreshTokenExpiry }
      );

      // 记录登录日志
      await db.models.WorkLog.logLogin({
        userId: user.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || 'unknown'
      });

      res.status(200).json({
        success: true,
        message: '登录成功',
        data: {
          user: user.toSafeObject(),
          token,
          refreshToken,
          expiresIn: jwtConfig.accessTokenExpiry
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 刷新令牌
   */
  static async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new BadRequestError('未提供刷新令牌');
      }

      // 验证刷新令牌
      let decoded;
      try {
        decoded = jwt.verify(refreshToken, jwtConfig.refreshSecret);
      } catch (error) {
        throw new UnauthorizedError('无效的刷新令牌');
      }

      // 查找用户
      const user = await User.findByPk(decoded.userId);
      if (!user) {
        throw new UnauthorizedError('用户不存在');
      }

      // 检查用户状态
      if (user.status !== 'active') {
        throw new ForbiddenError('用户账号状态异常');
      }

      // 生成新的访问令牌
      const newAccessToken = jwt.sign(
        { userId: user.id, role: user.role },
        jwtConfig.secret,
        { expiresIn: jwtConfig.accessTokenExpiry }
      );

      res.status(200).json({
        success: true,
        message: '令牌刷新成功',
        data: {
          token: newAccessToken,
          expiresIn: jwtConfig.accessTokenExpiry
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取当前用户信息
   */
  static async getCurrentUser(req, res, next) {
    try {
      const user = await User.findByPk(req.user.userId, {
        include: [
          { model: db.models.Conversation, as: 'conversations' },
          { model: db.models.Notification, as: 'notifications', where: { read: false } }
        ]
      });

      if (!user) {
        throw new NotFoundError('用户不存在');
      }

      // 更新在线状态
      await user.update({ isOnline: true, lastSeen: new Date() });

      res.status(200).json({
        success: true,
        data: {
          user: user.toResponseObject(),
          unreadNotifications: user.notifications?.length || 0
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 更新用户信息
   */
  static async updateProfile(req, res, next) {
    try {
      // 验证请求数据
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new BadRequestError('请求数据验证失败', errors.array());
      }

      const userId = req.user.userId;
      const { 
        firstName, 
        lastName, 
        email, 
        phone, 
        avatar,
        timezone,
        language,
        settings
      } = req.body;

      // 查找用户
      const user = await User.findByPk(userId);
      if (!user) {
        throw new NotFoundError('用户不存在');
      }

      // 检查邮箱是否已被其他用户使用
      if (email && email !== user.email) {
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
          throw new ConflictError('邮箱已被使用');
        }
      }

      // 更新用户信息
      const updateData = {};
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (email !== undefined) updateData.email = email;
      if (phone !== undefined) updateData.phone = phone;
      if (avatar !== undefined) updateData.avatar = avatar;
      if (timezone !== undefined) updateData.timezone = timezone;
      if (language !== undefined) updateData.language = language;
      if (settings !== undefined) updateData.settings = settings;

      await user.update(updateData);

      // 记录更新日志
      await db.models.WorkLog.logUserUpdate({
        userId: user.id,
        updatedBy: req.user.id,
        changes: updateData
      });

      res.status(200).json({
        success: true,
        message: '用户信息更新成功',
        data: { user: user.toResponseObject() }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 更新密码
   */
  static async changePassword(req, res, next) {
    try {
      // 验证请求数据
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new BadRequestError('请求数据验证失败', errors.array());
      }

      const { currentPassword, newPassword } = req.body;
      const userId = req.user.userId;

      // 查找用户
      const user = await User.findByPk(userId);
      if (!user) {
        throw new NotFoundError('用户不存在');
      }

      // 验证当前密码
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        throw new BadRequestError('当前密码错误');
      }

      // 生成新密码哈希
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // 更新密码
      await user.update({ password: hashedPassword });

      // 记录密码更新日志
      await db.models.WorkLog.logPasswordChange({
        userId: user.id,
        changedBy: req.user.id
      });

      res.status(200).json({
        success: true,
        message: '密码更新成功'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 登出用户
   */
  static async logout(req, res, next) {
    try {
      const userId = req.user.userId;

      // 查找用户
      const user = await User.findByPk(userId);
      if (!user) {
        throw new NotFoundError('用户不存在');
      }

      // 更新在线状态
      await user.update({ isOnline: false, lastSeen: new Date() });

      // 记录登出日志
      await db.models.WorkLog.logLogout({
        userId: user.id,
        ipAddress: req.ip
      });

      res.status(200).json({
        success: true,
        message: '登出成功'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 管理员获取用户列表
   */
  static async getUsers(req, res, next) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        role, 
        status, 
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc' 
      } = req.query;

      // 构建查询条件
      const where = {};
      
      if (role) {
        where.role = role;
      }
      
      if (status) {
        where.status = status;
      }
      
      if (search) {
        where[db.Sequelize.Op.or] = [
          { username: { [db.Sequelize.Op.iLike]: `%${search}%` } },
          { email: { [db.Sequelize.Op.iLike]: `%${search}%` } },
          { firstName: { [db.Sequelize.Op.iLike]: `%${search}%` } },
          { lastName: { [db.Sequelize.Op.iLike]: `%${search}%` } }
        ];
      }

      // 计算偏移量
      const offset = (page - 1) * limit;

      // 排序配置
      const order = [[sortBy, sortOrder]];

      // 查询用户
      const { count, rows } = await User.findAndCountAll({
        where,
        offset,
        limit: parseInt(limit),
        order,
        attributes: {
          exclude: ['password', 'resetToken', 'resetTokenExpiry']
        }
      });

      res.status(200).json({
        success: true,
        data: {
          users: rows.map(user => user.toResponseObject()),
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(count / limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 管理员获取单个用户
   */
  static async getUserById(req, res, next) {
    try {
      const { userId } = req.params;

      // 查找用户
      const user = await User.findByPk(userId, {
        include: [
          { model: db.models.Conversation, as: 'conversations' },
          { model: db.models.Notification, as: 'notifications' },
          { model: db.models.Feedback, as: 'feedbacks' }
        ],
        attributes: {
          exclude: ['password', 'resetToken', 'resetTokenExpiry']
        }
      });

      if (!user) {
        throw new NotFoundError('用户不存在');
      }

      res.status(200).json({
        success: true,
        data: { user: user.toDetailResponseObject() }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 管理员更新用户
   */
  static async updateUser(req, res, next) {
    try {
      // 验证请求数据
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new BadRequestError('请求数据验证失败', errors.array());
      }

      const { userId } = req.params;
      const { role, status, ...otherFields } = req.body;

      // 查找用户
      const user = await User.findByPk(userId);
      if (!user) {
        throw new NotFoundError('用户不存在');
      }

      // 管理员不能修改自己的角色
      if (userId === req.user.userId && role && role !== user.role) {
        throw new ForbiddenError('不能修改自己的角色');
      }

      // 构建更新数据
      const updateData = { ...otherFields };
      
      if (role !== undefined) {
        updateData.role = role;
      }
      
      if (status !== undefined) {
        updateData.status = status;
      }

      // 更新用户
      await user.update(updateData);

      // 记录更新日志
      await db.models.WorkLog.logAdminUserUpdate({
        userId: user.id,
        updatedBy: req.user.id,
        changes: updateData
      });

      res.status(200).json({
        success: true,
        message: '用户信息更新成功',
        data: { user: user.toResponseObject() }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 管理员删除用户
   */
  static async deleteUser(req, res, next) {
    try {
      const { userId } = req.params;

      // 不能删除自己
      if (userId === req.user.userId) {
        throw new ForbiddenError('不能删除自己的账号');
      }

      // 查找用户
      const user = await User.findByPk(userId);
      if (!user) {
        throw new NotFoundError('用户不存在');
      }

      // 检查用户角色，管理员不能删除其他管理员
      if (user.role === 'admin' && req.user.role === 'admin') {
        throw new ForbiddenError('不能删除其他管理员账号');
      }

      // 软删除用户
      await user.destroy();

      // 记录删除日志
      await db.models.WorkLog.logUserDeletion({
        userId: user.id,
        deletedBy: req.user.id
      });

      res.status(200).json({
        success: true,
        message: '用户删除成功'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 重置用户密码
   */
  static async resetPassword(req, res, next) {
    try {
      const { email } = req.body;

      // 查找用户
      const user = await User.findOne({ where: { email } });
      if (!user) {
        throw new NotFoundError('未找到该邮箱对应的用户');
      }

      // 生成随机密码
      const randomPassword = Math.random().toString(36).substring(2, 10);
      
      // 生成密码哈希
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(randomPassword, salt);

      // 更新密码
      await user.update({ password: hashedPassword });

      // 这里应该发送新密码到用户邮箱
      // 实际项目中需要集成邮件服务
      console.log(`用户 ${user.username} 的新密码: ${randomPassword}`);

      // 记录重置日志
      await db.models.WorkLog.logPasswordReset({
        userId: user.id,
        resetBy: 'system'
      });

      res.status(200).json({
        success: true,
        message: '密码重置成功，新密码已发送到您的邮箱'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取在线客服列表
   */
  static async getOnlineAgents(req, res, next) {
    try {
      const agents = await User.findAll({
        where: {
          role: { [db.Sequelize.Op.in]: ['agent', 'supervisor', 'admin'] },
          status: 'active',
          isOnline: true
        },
        attributes: [
          'id', 'username', 'firstName', 'lastName', 'avatar', 
          'role', 'status', 'isOnline', 'lastSeen', 'availabilityStatus'
        ],
        order: [['availabilityStatus', 'ASC'], ['lastName', 'ASC']]
      });

      res.status(200).json({
        success: true,
        data: {
          agents: agents.map(agent => agent.toSafeObject())
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 更新用户可用性状态
   */
  static async updateAvailabilityStatus(req, res, next) {
    try {
      const { status } = req.body;
      const userId = req.user.userId;

      // 验证状态值
      const validStatuses = ['online', 'busy', 'away', 'offline'];
      if (!validStatuses.includes(status)) {
        throw new BadRequestError('无效的状态值');
      }

      // 查找用户
      const user = await User.findByPk(userId);
      if (!user) {
        throw new NotFoundError('用户不存在');
      }

      // 更新可用性状态
      await user.update({ availabilityStatus: status });

      res.status(200).json({
        success: true,
        message: '可用性状态更新成功',
        data: { availabilityStatus: status }
      });
    } catch (error) {
      next(error);
    }
  }
};

export default UserController;