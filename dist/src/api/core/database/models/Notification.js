/**
 * 通知模型
 * 定义通知数据结构和相关功能
 */

const { Logger } = require('../../logging/logger');
const logger = Logger.getInstance();

/**
 * 定义通知模型
 * @param {Object} sequelize - Sequelize实例
 * @param {Object} DataTypes - Sequelize数据类型
 * @returns {Object} Notification模型
 */
module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
      validate: {
        isUUID: 4
      }
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    type: {
      type: DataTypes.ENUM(
        'system',
        'account',
        'transaction',
        'security',
        'notification',
        'reminder',
        'marketing',
        'promotion',
        'support',
        'custom'
      ),
      allowNull: false,
      defaultValue: 'notification'
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Title cannot be empty' },
        len: { args: [1, 200], msg: 'Title must be between 1 and 200 characters' }
      }
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Message cannot be empty' }
      }
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    is_urgent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    is_system_wide: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    sender_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },
    related_id: {
      type: DataTypes.UUID,
      allowNull: true,
      validate: {
        isUUID: 4
      }
    },
    related_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
      validate: {
        len: { args: [0, 50], msg: 'Related type must be less than 50 characters' }
      }
    },
    action_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: {
        len: { args: [0, 500], msg: 'Action URL must be less than 500 characters' },
        isUrl: { msg: 'Invalid URL format', skipNull: true }
      }
    },
    action_label: {
      type: DataTypes.STRING(50),
      allowNull: true,
      validate: {
        len: { args: [0, 50], msg: 'Action label must be less than 50 characters' }
      }
    },
    icon: {
      type: DataTypes.STRING(50),
      allowNull: true,
      validate: {
        len: { args: [0, 50], msg: 'Icon must be less than 50 characters' }
      }
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null
    },
    read_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null
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
    }
  }, {
    tableName: 'notifications',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['type'] },
      { fields: ['is_read'] },
      { fields: ['is_urgent'] },
      { fields: ['is_system_wide'] },
      { fields: ['sender_id'] },
      { fields: ['created_at'] },
      { fields: ['expires_at'] },
      { fields: ['read_at'] },
      { fields: ['user_id', 'is_read'] },
      { fields: ['user_id', 'type'] },
      { fields: ['user_id', 'created_at'] },
      { fields: ['related_id', 'related_type'] },
      { fields: ['created_at'], order: 'DESC' },
      { fields: ['user_id', 'is_urgent', 'created_at'] }
    ],
    hooks: {
      // 创建前记录
      beforeCreate: async (notification, options) => {
        logger.debug(`Creating notification for user ${notification.user_id}`, { type: notification.type });
      },
      // 创建后记录
      afterCreate: async (notification, options) => {
        logger.info(`Notification created: ${notification.id} for user ${notification.user_id}`, { type: notification.type });
      },
      // 删除前记录
      beforeDestroy: async (notification, options) => {
        logger.info(`Notification ${notification.id} is being deleted`, { userId: notification.user_id });
      }
    }
  });

  /**
   * 设置模型关联
   * @param {Object} models - 所有模型对象
   */
  Notification.associate = function(models) {
    // 与用户的一对多关系（接收者）
    Notification.belongsTo(models.User, {
      as: 'recipient',
      foreignKey: 'user_id',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    
    // 与用户的一对多关系（发送者）
    Notification.belongsTo(models.User, {
      as: 'sender',
      foreignKey: 'sender_id',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
  };

  /**
   * 实例方法：标记为已读
   * @returns {Promise<boolean>} 是否标记成功
   */
  Notification.prototype.markAsRead = async function() {
    try {
      if (!this.is_read) {
        this.is_read = true;
        this.read_at = new Date();
        await this.save();
        logger.info(`Notification ${this.id} marked as read by user ${this.user_id}`);
      }
      return true;
    } catch (error) {
      logger.error(`Error marking notification ${this.id} as read:`, error);
      return false;
    }
  };

  /**
   * 实例方法：标记为未读
   * @returns {Promise<boolean>} 是否标记成功
   */
  Notification.prototype.markAsUnread = async function() {
    try {
      if (this.is_read) {
        this.is_read = false;
        this.read_at = null;
        await this.save();
        logger.info(`Notification ${this.id} marked as unread by user ${this.user_id}`);
      }
      return true;
    } catch (error) {
      logger.error(`Error marking notification ${this.id} as unread:`, error);
      return false;
    }
  };

  /**
   * 实例方法：设置紧急状态
   * @param {boolean} isUrgent - 是否紧急
   * @returns {Promise<boolean>} 是否设置成功
   */
  Notification.prototype.setUrgency = async function(isUrgent) {
    try {
      this.is_urgent = isUrgent;
      await this.save();
      logger.info(`Notification ${this.id} urgency set to ${isUrgent}`, { userId: this.user_id });
      return true;
    } catch (error) {
      logger.error(`Error setting urgency for notification ${this.id}:`, error);
      return false;
    }
  };

  /**
   * 实例方法：更新操作按钮
   * @param {string} url - 操作URL
   * @param {string} label - 按钮标签
   * @returns {Promise<boolean>} 是否更新成功
   */
  Notification.prototype.updateAction = async function(url, label) {
    try {
      this.action_url = url;
      this.action_label = label;
      await this.save();
      logger.info(`Action updated for notification ${this.id}`, { userId: this.user_id });
      return true;
    } catch (error) {
      logger.error(`Error updating action for notification ${this.id}:`, error);
      return false;
    }
  };

  /**
   * 实例方法：更新元数据
   * @param {Object} metadata - 元数据对象
   * @returns {Promise<boolean>} 是否更新成功
   */
  Notification.prototype.updateMetadata = async function(metadata) {
    try {
      this.metadata = { ...this.metadata, ...metadata };
      await this.save();
      logger.info(`Metadata updated for notification ${this.id}`, { userId: this.user_id });
      return true;
    } catch (error) {
      logger.error(`Error updating metadata for notification ${this.id}:`, error);
      return false;
    }
  };

  /**
   * 实例方法：设置过期时间
   * @param {Date} date - 过期日期
   * @returns {Promise<boolean>} 是否设置成功
   */
  Notification.prototype.setExpiration = async function(date) {
    try {
      this.expires_at = date;
      await this.save();
      logger.info(`Expiration set for notification ${this.id}`, { userId: this.user_id });
      return true;
    } catch (error) {
      logger.error(`Error setting expiration for notification ${this.id}:`, error);
      return false;
    }
  };

  /**
   * 实例方法：检查是否已过期
   * @returns {boolean} 是否已过期
   */
  Notification.prototype.isExpired = function() {
    return this.expires_at && this.expires_at < new Date();
  };

  /**
   * 实例方法：序列化通知数据（用于API响应）
   * @returns {Object} 序列化后的通知数据
   */
  Notification.prototype.serialize = function() {
    return {
      id: this.id,
      user_id: this.user_id,
      type: this.type,
      title: this.title,
      message: this.message,
      is_read: this.is_read,
      is_urgent: this.is_urgent,
      is_system_wide: this.is_system_wide,
      sender_id: this.sender_id,
      related_id: this.related_id,
      related_type: this.related_type,
      action_url: this.action_url,
      action_label: this.action_label,
      icon: this.icon,
      metadata: this.metadata,
      expires_at: this.expires_at,
      read_at: this.read_at,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  };

  /**
   * 类方法：查找用户的通知
   * @param {string} userId - 用户ID
   * @param {Object} options - 查找选项
   * @returns {Promise<Array>} 通知列表
   */
  Notification.findByUserId = async function(userId, options = {}) {
    try {
      // 构建基本查询条件
      const where = {
        user_id: userId
      };
      
      // 添加未读条件
      if (options.unreadOnly) {
        where.is_read = false;
      }
      
      // 添加类型条件
      if (options.type) {
        where.type = options.type;
      }
      
      // 添加紧急状态条件
      if (options.urgentOnly !== undefined) {
        where.is_urgent = options.urgentOnly;
      }
      
      // 添加日期范围条件
      if (options.fromDate) {
        where.created_at = {
          ...where.created_at,
          [sequelize.Op.gte]: options.fromDate
        };
      }
      
      if (options.toDate) {
        where.created_at = {
          ...where.created_at,
          [sequelize.Op.lte]: options.toDate
        };
      }
      
      // 确保通知未过期
      where.expires_at = {
        [sequelize.Op.or]: [
          null,
          { [sequelize.Op.gt]: new Date() }
        ]
      };
      
      // 构建查询选项
      const queryOptions = {
        where,
        limit: options.limit || 20,
        offset: options.offset || 0,
        order: options.order || [['created_at', 'DESC']]
      };
      
      // 加载关联
      if (options.includeRelations) {
        queryOptions.include = [
          { model: sequelize.models.User, as: 'sender', attributes: ['id', 'username', 'first_name', 'last_name', 'profile_picture'] }
        ];
      }
      
      return await this.findAndCountAll(queryOptions);
    } catch (error) {
      logger.error(`Error finding notifications for user ${userId}:`, error);
      return { count: 0, rows: [] };
    }
  };

  /**
   * 类方法：获取用户未读通知数量
   * @param {string} userId - 用户ID
   * @param {Object} options - 查询选项
   * @returns {Promise<number>} 未读通知数量
   */
  Notification.getUnreadCount = async function(userId, options = {}) {
    try {
      const where = {
        user_id: userId,
        is_read: false,
        expires_at: {
          [sequelize.Op.or]: [
            null,
            { [sequelize.Op.gt]: new Date() }
          ]
        }
      };
      
      // 添加紧急状态条件
      if (options.urgentOnly !== undefined) {
        where.is_urgent = options.urgentOnly;
      }
      
      // 添加类型条件
      if (options.type) {
        where.type = options.type;
      }
      
      return await this.count({ where });
    } catch (error) {
      logger.error(`Error getting unread notification count for user ${userId}:`, error);
      return 0;
    }
  };

  /**
   * 类方法：标记用户所有通知为已读
   * @param {string} userId - 用户ID
   * @param {Object} options - 标记选项
   * @returns {Promise<number>} 已标记的通知数量
   */
  Notification.markAllAsRead = async function(userId, options = {}) {
    try {
      const where = {
        user_id: userId,
        is_read: false,
        expires_at: {
          [sequelize.Op.or]: [
            null,
            { [sequelize.Op.gt]: new Date() }
          ]
        }
      };
      
      // 添加类型条件
      if (options.type) {
        where.type = options.type;
      }
      
      const result = await this.update(
        {
          is_read: true,
          read_at: new Date()
        },
        {
          where,
          returning: true
        }
      );
      
      logger.info(`${result[0]} notifications marked as read for user ${userId}`);
      return result[0];
    } catch (error) {
      logger.error(`Error marking all notifications as read for user ${userId}:`, error);
      return 0;
    }
  };

  /**
   * 类方法：批量创建系统通知
   * @param {Array<string>} userIds - 用户ID列表
   * @param {Object} notificationData - 通知数据
   * @returns {Promise<Array>} 创建的通知列表
   */
  Notification.bulkCreateForUsers = async function(userIds, notificationData) {
    try {
      if (!Array.isArray(userIds) || userIds.length === 0) {
        return [];
      }
      
      // 创建通知记录
      const notificationsToCreate = userIds.map(userId => ({
        ...notificationData,
        user_id: userId,
        is_system_wide: true
      }));
      
      const createdNotifications = await this.bulkCreate(notificationsToCreate);
      logger.info(`Created ${createdNotifications.length} system notifications for ${userIds.length} users`, { type: notificationData.type });
      
      return createdNotifications;
    } catch (error) {
      logger.error(`Error creating bulk notifications:`, error);
      return [];
    }
  };

  /**
   * 类方法：发送系统范围通知
   * @param {Object} notificationData - 通知数据
   * @returns {Promise<number>} 创建的通知数量
   */
  Notification.sendSystemWide = async function(notificationData) {
    try {
      // 获取所有活跃用户
      const activeUsers = await sequelize.models.User.findAll({
        where: {
          status: 'active'
        },
        attributes: ['id']
      });
      
      const userIds = activeUsers.map(user => user.id);
      const createdNotifications = await this.bulkCreateForUsers(userIds, notificationData);
      
      logger.info(`Sent system-wide notification to ${userIds.length} active users`, { type: notificationData.type });
      return createdNotifications.length;
    } catch (error) {
      logger.error(`Error sending system-wide notification:`, error);
      return 0;
    }
  };

  /**
   * 类方法：删除用户的旧通知
   * @param {string} userId - 用户ID
   * @param {Date} beforeDate - 删除此日期之前的通知
   * @param {number} keepUnread - 是否保留未读通知
   * @returns {Promise<number>} 删除的通知数量
   */
  Notification.deleteOldNotifications = async function(userId, beforeDate, keepUnread = true) {
    try {
      const where = {
        user_id: userId,
        created_at: {
          [sequelize.Op.lt]: beforeDate
        }
      };
      
      // 如果保留未读通知
      if (keepUnread) {
        where.is_read = true;
      }
      
      const result = await this.destroy({ where });
      logger.info(`Deleted ${result} old notifications for user ${userId}`);
      return result;
    } catch (error) {
      logger.error(`Error deleting old notifications for user ${userId}:`, error);
      return 0;
    }
  };

  /**
   * 类方法：删除已过期的通知
   * @returns {Promise<number>} 删除的通知数量
   */
  Notification.deleteExpiredNotifications = async function() {
    try {
      const where = {
        expires_at: {
          [sequelize.Op.lt]: new Date()
        }
      };
      
      const result = await this.destroy({ where });
      logger.info(`Deleted ${result} expired notifications`);
      return result;
    } catch (error) {
      logger.error(`Error deleting expired notifications:`, error);
      return 0;
    }
  };

  /**
   * 类方法：获取通知统计信息
   * @param {string} userId - 用户ID（可选）
   * @returns {Promise<Object>} 统计信息
   */
  Notification.getStatistics = async function(userId = null) {
    try {
      const where = {
        expires_at: {
          [sequelize.Op.or]: [
            null,
            { [sequelize.Op.gt]: new Date() }
          ]
        }
      };
      
      if (userId) {
        where.user_id = userId;
      }
      
      // 获取总数
      const total = await this.count({ where });
      
      // 获取未读数量
      const unread = await this.count({
        where: {
          ...where,
          is_read: false
        }
      });
      
      // 获取紧急数量
      const urgent = await this.count({
        where: {
          ...where,
          is_urgent: true
        }
      });
      
      // 获取未读紧急数量
      const unreadUrgent = await this.count({
        where: {
          ...where,
          is_read: false,
          is_urgent: true
        }
      });
      
      // 获取按类型分布
      const typeDistribution = await this.count({
        where,
        group: 'type'
      });
      
      // 获取最近7天的通知数量
      const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recent7Days = await this.count({
        where: {
          ...where,
          created_at: {
            [sequelize.Op.gt]: last7Days
          }
        }
      });
      
      return {
        total,
        unread,
        read: total - unread,
        urgent,
        unreadUrgent,
        typeDistribution: typeDistribution.reduce((acc, count) => {
          acc[count.type] = count.count;
          return acc;
        }, {}),
        recent7Days
      };
    } catch (error) {
      logger.error(`Error getting notification statistics:`, error);
      return null;
    }
  };

  /**
   * 类方法：搜索通知
   * @param {string} query - 搜索查询
   * @param {string} userId - 用户ID（可选）
   * @param {Object} options - 搜索选项
   * @returns {Promise<Array>} 通知列表
   */
  Notification.search = async function(query, userId = null, options = {}) {
    try {
      const where = {
        [sequelize.Op.or]: [
          { title: { [sequelize.Op.iLike]: `%${query}%` } },
          { message: { [sequelize.Op.iLike]: `%${query}%` } }
        ],
        expires_at: {
          [sequelize.Op.or]: [
            null,
            { [sequelize.Op.gt]: new Date() }
          ]
        }
      };
      
      if (userId) {
        where.user_id = userId;
      }
      
      // 添加未读条件
      if (options.unreadOnly) {
        where.is_read = false;
      }
      
      // 添加类型条件
      if (options.type) {
        where.type = options.type;
      }
      
      const searchOptions = {
        where,
        limit: options.limit || 20,
        offset: options.offset || 0,
        order: options.order || [['created_at', 'DESC']]
      };
      
      return await this.findAndCountAll(searchOptions);
    } catch (error) {
      logger.error(`Error searching notifications:`, error);
      return { count: 0, rows: [] };
    }
  };

  return Notification;
};