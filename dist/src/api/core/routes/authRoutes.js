/**
 * 认证路由模块
 * 处理用户登录、注册、注销等认证相关功能
 */

const { di } = require('../di/dependencyInjector');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { rateLimit } = require('../middleware/authMiddleware');
const logger = require('../utils/logger');
const { ValidationError } = require('../exception/handlers/errorHandler');
const validator = require('../validation/validator');

/**
 * 配置认证路由
 * @param {Object} router - 路由实例
 */
function configureAuthRoutes(router) {
  // 从依赖注入容器获取认证服务
  const authService = di.get('authService');
  
  if (!authService) {
    logger.error('认证服务未找到，无法配置认证路由');
    return;
  }

  // 登录请求限制中间件（防止暴力破解）
  const loginRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 5, // 每个IP限制5次请求
    message: '登录尝试次数过多，请稍后再试',
    skipSuccessfulRequests: true
  });

  // 密码重置请求限制中间件
  const resetRateLimit = rateLimit({
    windowMs: 60 * 60 * 1000, // 1小时
    max: 3, // 每个IP限制3次请求
    message: '重置密码请求次数过多，请稍后再试'
  });

  // 认证路由组
  router.group('/auth', (authGroup) => {
    // 公开路由（无需认证）
    authGroup
      // 用户登录
      .post('/login', [loginRateLimit, validateLogin], async (req, res) => {
        const { username, password, rememberMe = false } = req.body;
        
        const result = await authService.login(username, password, rememberMe);
        
        // 如果配置了使用Cookie存储token
        if (authService.useCookie) {
          res.cookie('token', result.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : null // 7天或会话结束
          });
        }
        
        res.success(result, '登录成功');
      })

      // 用户注册
      .post('/register', validateRegister, async (req, res) => {
        const userData = req.body;
        const user = await authService.register(userData);
        res.status(201).success(user, '注册成功');
      })

      // 发送重置密码邮件
      .post('/forgot-password', [resetRateLimit, validateForgotPassword], async (req, res) => {
        const { email } = req.body;
        await authService.sendResetPasswordEmail(email);
        res.success(null, '重置密码邮件已发送');
      })

      // 重置密码
      .post('/reset-password', validateResetPassword, async (req, res) => {
        const { token, newPassword, confirmPassword } = req.body;
        
        if (newPassword !== confirmPassword) {
          throw new ValidationError('两次输入的密码不一致', 'PASSWORD_MISMATCH');
        }
        
        await authService.resetPassword(token, newPassword);
        res.success(null, '密码重置成功');
      })

      // 验证token
      .post('/verify-token', async (req, res) => {
        const { token } = req.body;
        const isValid = await authService.validateToken(token);
        res.success({ isValid }, 'Token验证成功');
      });

    // 需要认证的路由
    authGroup
      // 用户登出
      .post('/logout', authenticate(), async (req, res) => {
        await authService.logout(req.token);
        
        // 如果使用Cookie，清除token
        if (authService.useCookie) {
          res.clearCookie('token');
        }
        
        res.success(null, '登出成功');
      })

      // 刷新token
      .post('/refresh-token', authenticate(), async (req, res) => {
        const newTokens = await authService.refreshToken(req.token);
        
        // 如果配置了使用Cookie存储token
        if (authService.useCookie) {
          res.cookie('token', newTokens.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7天
          });
        }
        
        res.success(newTokens, 'Token刷新成功');
      })

      // 修改密码
      .post('/change-password', [authenticate(), validateChangePassword], async (req, res) => {
        const { currentPassword, newPassword } = req.body;
        await authService.changePassword(req.user.id, currentPassword, newPassword);
        res.success(null, '密码修改成功');
      })

      // 获取当前用户信息
      .get('/me', authenticate(), async (req, res) => {
        const userInfo = await authService.getUserInfo(req.user.id);
        res.success(userInfo, '获取用户信息成功');
      })

      // 更新当前用户信息
      .put('/me', [authenticate(), validateUpdateProfile], async (req, res) => {
        const userData = req.body;
        // 确保不能修改某些敏感字段
        const allowedFields = ['name', 'email', 'phone', 'avatar'];
        const filteredData = Object.keys(userData)
          .filter(key => allowedFields.includes(key))
          .reduce((obj, key) => {
            obj[key] = userData[key];
            return obj;
          }, {});
        
        const updatedUser = await authService.updateUserProfile(req.user.id, filteredData);
        res.success(updatedUser, '用户信息更新成功');
      });

    // 管理员路由
    authGroup
      // 获取用户列表（管理员）
      .get('/users', [authenticate(), authorize('admin')], async (req, res) => {
        const { page = 1, pageSize = 10, search = '' } = req.query;
        const users = await authService.getUsers({
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          search
        });
        res.success(users, '获取用户列表成功');
      })

      // 禁用/启用用户（管理员）
      .put('/users/:id/status', [authenticate(), authorize('admin')], async (req, res) => {
        const { id } = req.params;
        const { status } = req.body;
        await authService.updateUserStatus(id, status);
        res.success(null, `用户已${status === 'active' ? '启用' : '禁用'}`);
      });
  });
}

// 登录验证中间件
function validateLogin(req, res, next) {
  try {
    validator.validate(req.body, {
      username: 'required|string',
      password: 'required|string|min:6',
      rememberMe: 'boolean' // 可选
    });
    next();
  } catch (error) {
    next(error);
  }
}

// 注册验证中间件
function validateRegister(req, res, next) {
  try {
    validator.validate(req.body, {
      username: 'required|string|min:3|max:50',
      email: 'required|email',
      password: 'required|string|min:6|max:50',
      passwordConfirm: 'required|string|same:password',
      name: 'required|string|max:100',
      phone: 'string|max:20' // 可选
    });
    next();
  } catch (error) {
    next(error);
  }
}

// 忘记密码验证中间件
function validateForgotPassword(req, res, next) {
  try {
    validator.validate(req.body, {
      email: 'required|email'
    });
    next();
  } catch (error) {
    next(error);
  }
}

// 重置密码验证中间件
function validateResetPassword(req, res, next) {
  try {
    validator.validate(req.body, {
      token: 'required|string',
      newPassword: 'required|string|min:6|max:50',
      confirmPassword: 'required|string'
    });
    next();
  } catch (error) {
    next(error);
  }
}

// 修改密码验证中间件
function validateChangePassword(req, res, next) {
  try {
    validator.validate(req.body, {
      currentPassword: 'required|string',
      newPassword: 'required|string|min:6|max:50'
    });
    next();
  } catch (error) {
    next(error);
  }
}

// 更新个人资料验证中间件
function validateUpdateProfile(req, res, next) {
  try {
    validator.validate(req.body, {
      name: 'string|max:100',
      email: 'email',
      phone: 'string|max:20',
      avatar: 'string' // 可选的头像URL
    });
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = configureAuthRoutes;