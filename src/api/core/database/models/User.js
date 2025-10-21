/**
 * 用户模型
 * 定义用户数据结构和相关功能
 */

const crypto = require('crypto');
const { passwordUtils } = require('../../utils/passwordUtils');
const { Logger } = require('../../logging/logger');
const logger = Logger.getInstance();

/**
 * 定义用户模型
 * @param {Object} sequelize - Sequelize实例
 * @param {Object} DataTypes - Sequelize数据类型
 * @returns {Object} User模型
 */
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
      validate: {
        isUUID: 4
      }
    },
    first_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'First name cannot be empty' },
        len: { args: [1, 50], msg: 'First name must be between 1 and 50 characters' }
      }
    },
    last_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Last name cannot be empty' },
        len: { args: [1, 50], msg: 'Last name must be between 1 and 50 characters' }
      }
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: {
        msg: 'Email address already in use'
      },
      validate: {
        notEmpty: { msg: 'Email cannot be empty' },
        isEmail: { msg: 'Invalid email format' },
        len: { args: [3, 100], msg: 'Email must be between 3 and 100 characters' }
      }
    },
    username: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: {
        msg: 'Username already in use'
      },
      validate: {
        notEmpty: { msg: 'Username cannot be empty' },
        len: { args: [3, 30], msg: 'Username must be between 3 and 30 characters' },
        isAlphanumeric: { msg: 'Username can only contain letters and numbers' }
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Password cannot be empty' }
      }
    },
    role: {
      type: DataTypes.ENUM('admin', 'user', 'moderator', 'guest'),
      defaultValue: 'user',
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'pending', 'suspended', 'banned'),
      defaultValue: 'pending',
      allowNull: false
    },
    email_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    phone_number: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        isNumeric: { msg: 'Phone number must contain only numbers' },
        len: { args: [5, 20], msg: 'Phone number must be between 5 and 20 characters' }
      }
    },
    profile_picture: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: { args: [0, 500], msg: 'Bio must be less than 500 characters' }
      }
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null
    },
    last_login_ip: {
      type: DataTypes.STRING(45),
      allowNull: true,
      defaultValue: null,
      validate: {
        isIP: { msg: 'Invalid IP address format' }
      }
    },
    login_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      validate: {
        isInt: { msg: 'Login count must be an integer' },
        min: { args: [0], msg: 'Login count cannot be negative' }
      }
    },
    failed_login_attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      validate: {
        isInt: { msg: 'Failed login attempts must be an integer' },
        min: { args: [0], msg: 'Failed login attempts cannot be negative' }
      }
    },
    account_locked_until: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null
    },
    timezone: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: 'UTC'
    },
    language: {
      type: DataTypes.STRING(10),
      allowNull: true,
      defaultValue: 'en',
      validate: {
        len: { args: [2, 10], msg: 'Language code must be between 2 and 10 characters' }
      }
    },
    theme: {
      type: DataTypes.ENUM('light', 'dark', 'auto'),
      defaultValue: 'light',
      allowNull: true
    },
    two_factor_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    two_factor_secret: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null
    },
    reset_password_token: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null
    },
    reset_password_expires: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null
    },
    verification_token: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null
    },
    verification_token_expires: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null
    },
    api_key: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
      unique: true
    },
    api_key_expires: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null
    },
    preferences: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      onUpdate: DataTypes.NOW
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null
    }
  }, {
    tableName: 'users',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ['email'] },
      { unique: true, fields: ['username'] },
      { fields: ['status'] },
      { fields: ['role'] },
      { fields: ['created_at'] },
      { fields: ['email_verified'] },
      { fields: ['reset_password_token'] },
      { fields: ['verification_token'] },
      { fields: ['api_key'] },
      { fields: ['last_login'] }
    ],
    hooks: {
      // 保存前对密码进行哈希
      beforeSave: async (user, options) => {
        if (user.changed('password')) {
          user.password = await passwordUtils.hashPassword(user.password);
        }
      },
      // 创建前生成验证令牌
      beforeCreate: async (user, options) => {
        if (!user.verification_token) {
          user.verification_token = await passwordUtils.generateSecureToken();
          user.verification_token_expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24小时后过期
        }
      },
      // 更新前记录
      beforeUpdate: async (user, options) => {
        logger.debug(`User ${user.id} is being updated`, { changes: user.changed() });
      },
      // 创建后记录
      afterCreate: async (user, options) => {
        logger.info(`New user created: ${user.username} (${user.email})`, { userId: user.id });
      },
      // 删除前记录
      beforeDestroy: async (user, options) => {
        logger.info(`User ${user.id} is being deleted`, { username: user.username, email: user.email });
      }
    }
  });

  /**
   * 实例方法：检查密码是否匹配
   * @param {string} password - 要验证的密码
   * @returns {Promise<boolean>} 密码是否匹配
   */
  User.prototype.verifyPassword = async function(password) {
    try {
      return await passwordUtils.verifyPassword(password, this.password);
    } catch (error) {
      logger.error(`Error verifying password for user ${this.id}:`, error);
      return false;
    }
  };

  /**
   * 实例方法：更新密码
   * @param {string} newPassword - 新密码
   * @returns {Promise<boolean>} 是否更新成功
   */
  User.prototype.updatePassword = async function(newPassword) {
    try {
      // 清除密码重置令牌
      this.password = newPassword;
      this.reset_password_token = null;
      this.reset_password_expires = null;
      
      await this.save();
      logger.info(`Password updated successfully for user ${this.id}`);
      return true;
    } catch (error) {
      logger.error(`Error updating password for user ${this.id}:`, error);
      return false;
    }
  };

  /**
   * 实例方法：生成密码重置令牌
   * @returns {Promise<string>} 重置令牌
   */
  User.prototype.generatePasswordResetToken = async function() {
    try {
      const token = await passwordUtils.generateSecureToken();
      this.reset_password_token = token;
      this.reset_password_expires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1小时后过期
      
      await this.save();
      logger.info(`Password reset token generated for user ${this.id}`);
      return token;
    } catch (error) {
      logger.error(`Error generating password reset token for user ${this.id}:`, error);
      throw error;
    }
  };

  /**
   * 实例方法：验证账户
   * @param {string} token - 验证令牌
   * @returns {Promise<boolean>} 是否验证成功
   */
  User.prototype.verifyAccount = async function(token) {
    try {
      if (this.verification_token !== token) {
        return false;
      }
      
      if (this.verification_token_expires && this.verification_token_expires < new Date()) {
        return false;
      }
      
      this.email_verified = true;
      this.verification_token = null;
      this.verification_token_expires = null;
      this.status = 'active';
      
      await this.save();
      logger.info(`Account verified successfully for user ${this.id}`);
      return true;
    } catch (error) {
      logger.error(`Error verifying account for user ${this.id}:`, error);
      return false;
    }
  };

  /**
   * 实例方法：刷新验证令牌
   * @returns {Promise<string>} 新的验证令牌
   */
  User.prototype.refreshVerificationToken = async function() {
    try {
      this.verification_token = await passwordUtils.generateSecureToken();
      this.verification_token_expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24小时后过期
      
      await this.save();
      logger.info(`Verification token refreshed for user ${this.id}`);
      return this.verification_token;
    } catch (error) {
      logger.error(`Error refreshing verification token for user ${this.id}:`, error);
      throw error;
    }
  };

  /**
   * 实例方法：增加登录失败次数
   * @returns {Promise<boolean>} 是否账户被锁定
   */
  User.prototype.incrementFailedLoginAttempts = async function() {
    try {
      this.failed_login_attempts += 1;
      
      // 如果失败次数超过阈值，锁定账户
      const maxAttempts = 5; // 可以从配置中获取
      const lockoutDuration = 300000; // 5分钟，可以从配置中获取
      
      let isLocked = false;
      if (this.failed_login_attempts >= maxAttempts) {
        this.account_locked_until = new Date(Date.now() + lockoutDuration);
        isLocked = true;
        logger.warn(`Account locked for user ${this.id} due to too many failed login attempts`);
      }
      
      await this.save();
      return isLocked;
    } catch (error) {
      logger.error(`Error incrementing failed login attempts for user ${this.id}:`, error);
      return false;
    }
  };

  /**
   * 实例方法：重置登录失败次数
   * @param {string} ipAddress - IP地址
   * @returns {Promise<boolean>} 是否重置成功
   */
  User.prototype.resetFailedLoginAttempts = async function(ipAddress) {
    try {
      this.failed_login_attempts = 0;
      this.account_locked_until = null;
      this.last_login = new Date();
      this.last_login_ip = ipAddress;
      this.login_count += 1;
      
      await this.save();
      logger.info(`Login successful for user ${this.id} from IP ${ipAddress}`);
      return true;
    } catch (error) {
      logger.error(`Error resetting failed login attempts for user ${this.id}:`, error);
      return false;
    }
  };

  /**
   * 实例方法：检查账户是否被锁定
   * @returns {boolean} 是否被锁定
   */
  User.prototype.isLocked = function() {
    return this.account_locked_until && this.account_locked_until > new Date();
  };

  /**
   * 实例方法：检查账户是否活跃
   * @returns {boolean} 是否活跃
   */
  User.prototype.isActive = function() {
    return this.status === 'active' && !this.isLocked() && this.email_verified;
  };

  /**
   * 实例方法：生成API密钥
   * @param {number} expiresInDays - 过期天数
   * @returns {Promise<string>} API密钥
   */
  User.prototype.generateApiKey = async function(expiresInDays = 365) {
    try {
      const apiKey = await passwordUtils.generateApiKey();
      this.api_key = apiKey;
      this.api_key_expires = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
      
      await this.save();
      logger.info(`API key generated for user ${this.id}`);
      return apiKey;
    } catch (error) {
      logger.error(`Error generating API key for user ${this.id}:`, error);
      throw error;
    }
  };

  /**
   * 实例方法：撤销API密钥
   * @returns {Promise<boolean>} 是否撤销成功
   */
  User.prototype.revokeApiKey = async function() {
    try {
      this.api_key = null;
      this.api_key_expires = null;
      
      await this.save();
      logger.info(`API key revoked for user ${this.id}`);
      return true;
    } catch (error) {
      logger.error(`Error revoking API key for user ${this.id}:`, error);
      return false;
    }
  };

  /**
   * 实例方法：更新用户偏好设置
   * @param {Object} preferences - 偏好设置对象
   * @returns {Promise<boolean>} 是否更新成功
   */
  User.prototype.updatePreferences = async function(preferences) {
    try {
      this.preferences = { ...this.preferences, ...preferences };
      await this.save();
      logger.info(`Preferences updated for user ${this.id}`);
      return true;
    } catch (error) {
      logger.error(`Error updating preferences for user ${this.id}:`, error);
      return false;
    }
  };

  /**
   * 实例方法：更新用户资料
   * @param {Object} profileData - 资料数据
   * @returns {Promise<boolean>} 是否更新成功
   */
  User.prototype.updateProfile = async function(profileData) {
    try {
      // 定义允许更新的字段
      const allowedFields = ['first_name', 'last_name', 'phone_number', 'bio', 'profile_picture', 'timezone', 'language', 'theme'];
      
      // 更新字段
      allowedFields.forEach(field => {
        if (profileData[field] !== undefined) {
          this[field] = profileData[field];
        }
      });
      
      await this.save();
      logger.info(`Profile updated for user ${this.id}`);
      return true;
    } catch (error) {
      logger.error(`Error updating profile for user ${this.id}:`, error);
      return false;
    }
  };

  /**
   * 实例方法：获取用户全名
   * @returns {string} 用户全名
   */
  User.prototype.getFullName = function() {
    return `${this.first_name} ${this.last_name}`;
  };

  /**
   * 实例方法：检查用户是否具有指定角色
   * @param {string} role - 角色名称
   * @returns {boolean} 是否具有该角色
   */
  User.prototype.hasRole = function(role) {
    return this.role === role;
  };

  /**
   * 实例方法：检查用户是否具有管理员权限
   * @returns {boolean} 是否为管理员
   */
  User.prototype.isAdmin = function() {
    return ['admin', 'moderator'].includes(this.role);
  };

  /**
   * 实例方法：序列化用户数据（用于API响应）
   * @returns {Object} 序列化后的用户数据
   */
  User.prototype.serialize = function() {
    return {
      id: this.id,
      first_name: this.first_name,
      last_name: this.last_name,
      email: this.email,
      username: this.username,
      role: this.role,
      status: this.status,
      email_verified: this.email_verified,
      phone_number: this.phone_number,
      profile_picture: this.profile_picture,
      bio: this.bio,
      last_login: this.last_login,
      timezone: this.timezone,
      language: this.language,
      theme: this.theme,
      two_factor_enabled: this.two_factor_enabled,
      preferences: this.preferences,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  };

  /**
   * 实例方法：序列化用户数据（用于令牌）
   * @returns {Object} 序列化后的用户数据
   */
  User.prototype.serializeForToken = function() {
    return {
      id: this.id,
      email: this.email,
      username: this.username,
      role: this.role
    };
  };

  /**
   * 类方法：查找用户（按电子邮件）
   * @param {string} email - 电子邮件地址
   * @returns {Promise<Object|null>} 用户实例或null
   */
  User.findByEmail = async function(email) {
    try {
      return await this.findOne({
        where: {
          email: email.toLowerCase()
        }
      });
    } catch (error) {
      logger.error(`Error finding user by email:`, error);
      return null;
    }
  };

  /**
   * 类方法：查找用户（按用户名）
   * @param {string} username - 用户名
   * @returns {Promise<Object|null>} 用户实例或null
   */
  User.findByUsername = async function(username) {
    try {
      return await this.findOne({
        where: {
          username: username
        }
      });
    } catch (error) {
      logger.error(`Error finding user by username:`, error);
      return null;
    }
  };

  /**
   * 类方法：查找用户（按API密钥）
   * @param {string} apiKey - API密钥
   * @returns {Promise<Object|null>} 用户实例或null
   */
  User.findByApiKey = async function(apiKey) {
    try {
      const now = new Date();
      return await this.findOne({
        where: {
          api_key: apiKey,
          api_key_expires: {
            [sequelize.Op.gt]: now
          },
          status: 'active'
        }
      });
    } catch (error) {
      logger.error(`Error finding user by API key:`, error);
      return null;
    }
  };

  /**
   * 类方法：检查电子邮件是否已存在
   * @param {string} email - 电子邮件地址
   * @param {string} excludeId - 排除的用户ID
   * @returns {Promise<boolean>} 是否已存在
   */
  User.isEmailTaken = async function(email, excludeId = null) {
    try {
      const query = {
        where: {
          email: email.toLowerCase()
        }
      };
      
      if (excludeId) {
        query.where.id = {
          [sequelize.Op.ne]: excludeId
        };
      }
      
      const count = await this.count(query);
      return count > 0;
    } catch (error) {
      logger.error(`Error checking if email is taken:`, error);
      return false;
    }
  };

  /**
   * 类方法：检查用户名是否已存在
   * @param {string} username - 用户名
   * @param {string} excludeId - 排除的用户ID
   * @returns {Promise<boolean>} 是否已存在
   */
  User.isUsernameTaken = async function(username, excludeId = null) {
    try {
      const query = {
        where: {
          username: username
        }
      };
      
      if (excludeId) {
        query.where.id = {
          [sequelize.Op.ne]: excludeId
        };
      }
      
      const count = await this.count(query);
      return count > 0;
    } catch (error) {
      logger.error(`Error checking if username is taken:`, error);
      return false;
    }
  };

  /**
   * 类方法：搜索用户
   * @param {string} query - 搜索查询
   * @param {Object} options - 搜索选项
   * @returns {Promise<Array>} 用户列表
   */
  User.search = async function(query, options = {}) {
    try {
      const searchCondition = {
        [sequelize.Op.or]: [
          { first_name: { [sequelize.Op.iLike]: `%${query}%` } },
          { last_name: { [sequelize.Op.iLike]: `%${query}%` } },
          { email: { [sequelize.Op.iLike]: `%${query}%` } },
          { username: { [sequelize.Op.iLike]: `%${query}%` } }
        ]
      };
      
      // 合并分页选项
      const searchOptions = {
        where: searchCondition,
        limit: options.limit || 20,
        offset: options.offset || 0,
        order: options.order || [['created_at', 'DESC']]
      };
      
      return await this.findAndCountAll(searchOptions);
    } catch (error) {
      logger.error(`Error searching users:`, error);
      return { count: 0, rows: [] };
    }
  };

  /**
   * 类方法：获取用户统计信息
   * @returns {Promise<Object>} 统计信息
   */
  User.getStatistics = async function() {
    try {
      const now = new Date();
      const last24Hours = new Date(now - 24 * 60 * 60 * 1000);
      const last7Days = new Date(now - 7 * 24 * 60 * 60 * 1000);
      
      // 获取各种状态的用户数量
      const statusCounts = await this.count({
        group: 'status'
      });
      
      // 获取最近注册的用户
      const newUsersLast24h = await this.count({
        where: {
          created_at: {
            [sequelize.Op.gt]: last24Hours
          }
        }
      });
      
      const newUsersLast7d = await this.count({
        where: {
          created_at: {
            [sequelize.Op.gt]: last7Days
          }
        }
      });
      
      // 获取验证状态的用户数量
      const verifiedUsers = await this.count({
        where: {
          email_verified: true
        }
      });
      
      const unverifiedUsers = await this.count({
        where: {
          email_verified: false
        }
      });
      
      // 获取角色分布
      const roleDistribution = await this.count({
        group: 'role'
      });
      
      return {
        total: await this.count(),
        statusCounts: statusCounts.reduce((acc, count) => {
          acc[count.status] = count.count;
          return acc;
        }, {}),
        verified: verifiedUsers,
        unverified: unverifiedUsers,
        newUsers: {
          last24h: newUsersLast24h,
          last7d: newUsersLast7d
        },
        roleDistribution: roleDistribution.reduce((acc, count) => {
          acc[count.role] = count.count;
          return acc;
        }, {})
      };
    } catch (error) {
      logger.error(`Error getting user statistics:`, error);
      return null;
    }
  };

  return User;
};