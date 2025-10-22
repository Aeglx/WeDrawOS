import { DataTypes, Model } from 'sequelize';

/**
 * 通知模型
 * 管理客服系统中的各类通知消息
 */
class Notification extends Model {
  /**
   * 初始化通知模型
   * @param {Object} sequelize - Sequelize实例
   */
  static init(sequelize) {
    return super.init(
      {
        // 基本字段
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false
        },
        
        // 关联字段
        userId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          },
          onDelete: 'CASCADE'
        },
        
        // 通知类型
        type: {
          type: DataTypes.ENUM(
            'new_message',
            'new_session',
            'session_assigned',
            'session_transferred',
            'session_closed',
            'priority_change',
            'auto_reply_triggered',
            'customer_feedback',
            'system_alert',
            'agent_status_change',
            'work_shift_reminder',
            'timeout_warning'
          ),
          allowNull: false
        },
        
        // 通知标题
        title: {
          type: DataTypes.STRING(100),
          allowNull: false,
          validate: {
            notEmpty: true,
            len: [1, 100]
          }
        },
        
        // 通知内容
        content: {
          type: DataTypes.TEXT,
          allowNull: false,
          validate: {
            notEmpty: true
          }
        },
        
        // 阅读状态
        isRead: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        
        // 已读时间
        readAt: {
          type: DataTypes.DATE,
          allowNull: true
        },
        
        // 重要程度
        priority: {
          type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
          allowNull: false,
          defaultValue: 'medium'
        },
        
        // 关联资源
        resourceType: {
          type: DataTypes.ENUM('conversation', 'message', 'user', 'assignment'),
          allowNull: true
        },
        
        resourceId: {
          type: DataTypes.UUID,
          allowNull: true
        },
        
        // 通知操作
        actionType: {
          type: DataTypes.STRING(50),
          allowNull: true
        },
        
        actionUrl: {
          type: DataTypes.STRING(255),
          allowNull: true
        },
        
        // 发送者信息
        senderId: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id'
          },
          onDelete: 'SET NULL'
        },
        
        // 发送者类型
        senderType: {
          type: DataTypes.ENUM('user', 'system', 'auto_reply'),
          allowNull: false,
          defaultValue: 'system'
        },
        
        // 是否需要确认
        requiresConfirmation: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        
        // 确认状态
        confirmed: {
          type: DataTypes.BOOLEAN,
          allowNull: true
        },
        
        confirmedAt: {
          type: DataTypes.DATE,
          allowNull: true
        },
        
        // 过期时间
        expiresAt: {
          type: DataTypes.DATE,
          allowNull: true
        },
        
        // 通知元数据
        metadata: {
          type: DataTypes.JSONB,
          allowNull: true,
          defaultValue: {}
        }
      },
      {
        sequelize,
        modelName: 'Notification',
        tableName: 'notifications',
        timestamps: true,
        paranoid: true,
        indexes: [
          { fields: ['userId'] },
          { fields: ['type'] },
          { fields: ['isRead'] },
          { fields: ['priority'] },
          { fields: ['createdAt'] },
          { fields: ['expiresAt'] },
          { fields: ['senderId'] },
          { fields: ['resourceId'] },
          {
            fields: ['userId', 'isRead'],
            name: 'idx_user_read'
          },
          {
            fields: ['userId', 'priority'],
            name: 'idx_user_priority'
          },
          {
            fields: ['userId', 'createdAt'],
            name: 'idx_user_created'
          }
        ]
      }
    );
  }
  
  /**
   * 关联模型
   */
  static associate(models) {
    // 关联用户（接收者）
    this.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'recipient'
    });
    
    // 关联发送者
    this.belongsTo(models.User, {
      foreignKey: 'senderId',
      as: 'sender'
    });
    
    // 关联会话（如果相关）
    this.belongsTo(models.Conversation, {
      foreignKey: 'resourceId',
      constraints: false,
      as: 'conversation'
    });
    
    // 关联消息（如果相关）
    this.belongsTo(models.Message, {
      foreignKey: 'resourceId',
      constraints: false,
      as: 'message'
    });
  }
  
  /**
   * 标记为已读
   */
  async markAsRead() {
    this.isRead = true;
    this.readAt = new Date();
    await this.save();
  }
  
  /**
   * 标记为未读
   */
  async markAsUnread() {
    this.isRead = false;
    this.readAt = null;
    await this.save();
  }
  
  /**
   * 确认通知
   * @param {boolean} value - 确认值
   */
  async confirm(value = true) {
    if (this.requiresConfirmation) {
      this.confirmed = value;
      this.confirmedAt = new Date();
      await this.save();
    }
  }
  
  /**
   * 检查是否已过期
   * @returns {boolean} 是否已过期
   */
  isExpired() {
    return this.expiresAt && new Date() > this.expiresAt;
  }
  
  /**
   * 获取用户未读通知数量
   * @param {string} userId - 用户ID
   * @returns {number} 未读通知数量
   */
  static async getUnreadCount(userId) {
    return await this.count({
      where: {
        userId,
        isRead: false,
        expiresAt: { [this.sequelize.Op.or]: [null, { [this.sequelize.Op.gt]: new Date() }] }
      }
    });
  }
  
  /**
   * 批量标记为已读
   * @param {string} userId - 用户ID
   * @param {Array<string>} ids - 通知ID列表
   */
  static async markMultipleAsRead(userId, ids) {
    return await this.update(
      {
        isRead: true,
        readAt: new Date()
      },
      {
        where: {
          userId,
          id: ids
        }
      }
    );
  }
  
  /**
   * 标记所有通知为已读
   * @param {string} userId - 用户ID
   */
  static async markAllAsRead(userId) {
    return await this.update(
      {
        isRead: true,
        readAt: new Date()
      },
      {
        where: {
          userId,
          isRead: false
        }
      }
    );
  }
  
  /**
   * 清理过期通知
   * @param {number} days - 保留天数
   */
  static async cleanupExpired(days = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return await this.destroy({
      where: {
        createdAt: { [this.sequelize.Op.lt]: cutoffDate }
      }
    });
  }
  
  /**
   * 创建新消息通知
   * @param {Object} data - 通知数据
   */
  static async createNewMessageNotification(data) {
    const { userId, conversationId, messageId, senderId, senderName, content } = data;
    
    return await this.create({
      userId,
      type: 'new_message',
      title: '新消息',
      content: `${senderName || '用户'}: ${content.length > 50 ? content.substring(0, 50) + '...' : content}`,
      priority: 'high',
      resourceType: 'message',
      resourceId: messageId,
      actionType: 'view_message',
      actionUrl: `/conversations/${conversationId}`,
      senderId,
      senderType: 'user'
    });
  }
  
  /**
   * 创建新会话通知
   * @param {Object} data - 通知数据
   */
  static async createNewSessionNotification(data) {
    const { userId, conversationId, customerId, customerName } = data;
    
    return await this.create({
      userId,
      type: 'new_session',
      title: '新会话请求',
      content: `${customerName || '客户'}发起了新的会话请求`,
      priority: 'urgent',
      resourceType: 'conversation',
      resourceId: conversationId,
      actionType: 'accept_session',
      actionUrl: `/conversations/${conversationId}`,
      senderId: customerId,
      senderType: 'user',
      requiresConfirmation: true
    });
  }
  
  /**
   * 创建会话分配通知
   * @param {Object} data - 通知数据
   */
  static async createSessionAssignedNotification(data) {
    const { userId, conversationId, assignedBy, customerName } = data;
    
    return await this.create({
      userId,
      type: 'session_assigned',
      title: '会话已分配',
      content: `您已被分配处理${customerName || '客户'}的会话`,
      priority: 'high',
      resourceType: 'conversation',
      resourceId: conversationId,
      actionType: 'view_session',
      actionUrl: `/conversations/${conversationId}`,
      senderId: assignedBy,
      senderType: 'user'
    });
  }
  
  /**
   * 转换为响应对象
   * @returns {Object} 响应对象
   */
  toResponseObject() {
    return {
      id: this.id,
      userId: this.userId,
      type: this.type,
      title: this.title,
      content: this.content,
      isRead: this.isRead,
      readAt: this.readAt,
      priority: this.priority,
      resourceType: this.resourceType,
      resourceId: this.resourceId,
      actionType: this.actionType,
      actionUrl: this.actionUrl,
      senderId: this.senderId,
      senderType: this.senderType,
      requiresConfirmation: this.requiresConfirmation,
      confirmed: this.confirmed,
      confirmedAt: this.confirmedAt,
      expiresAt: this.expiresAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      // 关联信息会在查询时包含
      sender: this.sender ? this.sender.toSafeObject() : null,
      conversation: this.conversation ? this.conversation.toResponseObject() : null
    };
  }