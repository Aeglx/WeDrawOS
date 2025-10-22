import { DataTypes, Model } from 'sequelize';

/**
 * 会话模型
 * 管理客服系统中的会话数据
 */
class Conversation extends Model {
  /**
   * 初始化会话模型
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
        
        // 会话标题
        title: {
          type: DataTypes.STRING(255),
          allowNull: true
        },
        
        // 会话类型
        type: {
          type: DataTypes.ENUM('direct', 'group', 'customer_service', 'system'),
          allowNull: false,
          defaultValue: 'customer_service'
        },
        
        // 会话状态
        status: {
          type: DataTypes.ENUM('active', 'waiting', 'processing', 'pending', 'closed', 'archived'),
          allowNull: false,
          defaultValue: 'active'
        },
        
        // 优先级
        priority: {
          type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
          allowNull: false,
          defaultValue: 'medium'
        },
        
        // 主题
        subject: {
          type: DataTypes.STRING(255),
          allowNull: true
        },
        
        // 最后消息ID
        lastMessageId: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'messages',
            key: 'id'
          },
          onDelete: 'SET NULL'
        },
        
        // 最后消息时间
        lastMessageAt: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: DataTypes.NOW
        },
        
        // 消息总数
        messageCount: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0
        },
        
        // 未读消息总数
        unreadCount: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0
        },
        
        // 初始问题/描述
        initialQuestion: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        
        // 来源渠道
        source: {
          type: DataTypes.ENUM('web', 'mobile', 'email', 'phone', 'sms', 'social', 'api', 'other'),
          allowNull: false,
          defaultValue: 'web'
        },
        
        // 来源详情
        sourceDetails: {
          type: DataTypes.STRING(255),
          allowNull: true
        },
        
        // 用户设备信息
        userAgent: {
          type: DataTypes.STRING(255),
          allowNull: true
        },
        
        // IP地址
        ipAddress: {
          type: DataTypes.STRING(50),
          allowNull: true
        },
        
        // 语言代码
        languageCode: {
          type: DataTypes.STRING(10),
          allowNull: true,
          defaultValue: 'zh-CN'
        },
        
        // 首次响应时间
        firstResponseAt: {
          type: DataTypes.DATE,
          allowNull: true
        },
        
        // 首次响应时长（秒）
        firstResponseTime: {
          type: DataTypes.INTEGER,
          allowNull: true
        },
        
        // 平均响应时长（秒）
        avgResponseTime: {
          type: DataTypes.FLOAT,
          allowNull: true
        },
        
        // 总响应时长（秒）
        totalResponseTime: {
          type: DataTypes.INTEGER,
          allowNull: true,
          defaultValue: 0
        },
        
        // 响应次数
        responseCount: {
          type: DataTypes.INTEGER,
          allowNull: true,
          defaultValue: 0
        },
        
        // 满意度评分
        satisfactionScore: {
          type: DataTypes.INTEGER,
          allowNull: true,
          validate: {
            min: 1,
            max: 5
          }
        },
        
        // 会话结束原因
        closureReason: {
          type: DataTypes.STRING(255),
          allowNull: true
        },
        
        // 解决方案
        solution: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        
        // 备注
        notes: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        
        // 自动分类
        category: {
          type: DataTypes.STRING(100),
          allowNull: true
        },
        
        // 子分类
        subcategory: {
          type: DataTypes.STRING(100),
          allowNull: true
        },
        
        // 标记为垃圾会话
        isSpam: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        
        // 是否包含敏感内容
        hasSensitiveContent: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        
        // 结束时间
        endedAt: {
          type: DataTypes.DATE,
          allowNull: true
        },
        
        // 持续时间（秒）
        duration: {
          type: DataTypes.INTEGER,
          allowNull: true
        },
        
        // 自动回复次数
        autoReplyCount: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0
        },
        
        // 会话摘要
        summary: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        
        // 实体识别结果
        entities: {
          type: DataTypes.JSONB,
          allowNull: true,
          defaultValue: {}
        },
        
        // 附加元数据
        metadata: {
          type: DataTypes.JSONB,
          allowNull: true,
          defaultValue: {}
        },
        
        // 客户信息
        customerInfo: {
          type: DataTypes.JSONB,
          allowNull: true,
          defaultValue: {}
        },
        
        // 会话上下文
        context: {
          type: DataTypes.JSONB,
          allowNull: true,
          defaultValue: {}
        },
        
        // 是否需要跟进
        requiresFollowUp: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        
        // 跟进截止日期
        followUpBy: {
          type: DataTypes.DATE,
          allowNull: true
        },
        
        // 跟进状态
        followUpStatus: {
          type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'overdue'),
          allowNull: true
        },
        
        // 预计解决时间
        expectedResolutionTime: {
          type: DataTypes.DATE,
          allowNull: true
        }
      },
      {
        sequelize,
        modelName: 'Conversation',
        tableName: 'conversations',
        timestamps: true,
        paranoid: true,
        indexes: [
          { fields: ['type'] },
          { fields: ['status'] },
          { fields: ['priority'] },
          { fields: ['lastMessageAt'] },
          { fields: ['createdAt'] },
          { fields: ['endedAt'] },
          { fields: ['source'] },
          { fields: ['isSpam'] },
          { fields: ['hasSensitiveContent'] },
          { fields: ['requiresFollowUp'] },
          { fields: ['followUpBy'] },
          { fields: ['followUpStatus'] },
          {
            fields: ['status', 'priority'],
            name: 'idx_status_priority'
          },
          {
            fields: ['status', 'lastMessageAt'],
            name: 'idx_status_last_message'
          },
          {
            fields: ['type', 'status'],
            name: 'idx_type_status'
          },
          {
            fields: ['createdAt', 'status'],
            name: 'idx_created_status'
          },
          {
            fields: ['priority', 'lastMessageAt'],
            name: 'idx_priority_last_message'
          },
          {
            fields: ['source', 'status'],
            name: 'idx_source_status'
          },
          {
            fields: ['requiresFollowUp', 'followUpBy'],
            name: 'idx_follow_up'
          }
        ],
        hooks: {
          beforeCreate: async (conversation) => {
            // 如果没有标题，自动生成
            if (!conversation.title) {
              conversation.title = `会话 #${Math.random().toString(36).substr(2, 9)}`;
            }
          },
          
          beforeUpdate: async (conversation) => {
            // 当状态变为closed时，记录结束时间和持续时间
            if (conversation.changed('status') && conversation.status === 'closed' && !conversation.endedAt) {
              conversation.endedAt = new Date();
              conversation.duration = Math.floor((conversation.endedAt - conversation.createdAt) / 1000);
            }
            
            // 更新平均响应时间
            if (conversation.changed('totalResponseTime') || conversation.changed('responseCount')) {
              if (conversation.responseCount > 0) {
                conversation.avgResponseTime = conversation.totalResponseTime / conversation.responseCount;
              }
            }
          },
          
          afterUpdate: async (conversation) => {
            // 当状态变更时，发送通知
            if (conversation.changed('status')) {
              try {
                // 获取会话参与者
                const participants = await conversation.getParticipants();
                
                for (const participant of participants) {
                  // 发送状态变更通知
                  await sequelize.models.Notification.create({
                    userId: participant.userId,
                    type: 'conversation_status_changed',
                    data: {
                      conversationId: conversation.id,
                      conversationTitle: conversation.title,
                      oldStatus: conversation.previous('status'),
                      newStatus: conversation.status,
                      timestamp: new Date()
                    },
                    read: false
                  });
                }
              } catch (error) {
                console.error('Error sending conversation status change notification:', error);
              }
            }
          }
        }
      }
    );
  }
  
  /**
   * 关联模型
   */
  static associate(models) {
    // 关联用户（多对多）
    this.belongsToMany(models.User, {
      through: 'conversation_participants',
      foreignKey: 'conversationId',
      otherKey: 'userId',
      as: 'participants'
    });
    
    // 关联消息
    this.hasMany(models.Message, {
      foreignKey: 'conversationId',
      as: 'messages'
    });
    
    // 关联最后一条消息
    this.belongsTo(models.Message, {
      foreignKey: 'lastMessageId',
      as: 'lastMessage'
    });
    
    // 关联会话分配
    this.hasMany(models.ConversationAssignment, {
      foreignKey: 'conversationId',
      as: 'assignments'
    });
    
    // 关联标签
    this.belongsToMany(models.Tag, {
      through: 'conversation_tags',
      foreignKey: 'conversationId',
      otherKey: 'tagId',
      as: 'tags'
    });
    
    // 关联反馈
    this.hasMany(models.Feedback, {
      foreignKey: 'conversationId',
      as: 'feedbacks'
    });
    
    // 关联通知
    this.hasMany(models.Notification, {
      foreignKey: 'conversationId',
      as: 'notifications'
    });
    
    // 关联自动回复日志
    this.hasMany(models.AutoReplyLog, {
      foreignKey: 'conversationId',
      as: 'autoReplyLogs'
    });
    
    // 关联工作记录
    this.hasMany(models.WorkLog, {
      foreignKey: 'conversationId',
      as: 'workLogs'
    });
  }
  
  /**
   * 添加参与者
   * @param {string} userId - 用户ID
   */
  async addParticipant(userId) {
    const User = this.sequelize.models.User;
    const user = await User.findByPk(userId);
    
    if (!user) {
      throw new Error('用户不存在');
    }
    
    await this.addParticipant(user);
    return this;
  }
  
  /**
   * 移除参与者
   * @param {string} userId - 用户ID
   */
  async removeParticipant(userId) {
    const User = this.sequelize.models.User;
    const user = await User.findByPk(userId);
    
    if (!user) {
      throw new Error('用户不存在');
    }
    
    await this.removeParticipant(user);
    return this;
  }
  
  /**
   * 获取当前分配的客服
   */
  async getCurrentAssignee() {
    const ConversationAssignment = this.sequelize.models.ConversationAssignment;
    
    const assignment = await ConversationAssignment.findOne({
      where: {
        conversationId: this.id,
        status: 'active'
      },
      order: [['createdAt', 'DESC']],
      include: [{ model: this.sequelize.models.User, as: 'assignee' }]
    });
    
    return assignment?.assignee || null;
  }
  
  /**
   * 分配会话给客服
   * @param {string} userId - 客服ID
   * @param {string} assignedBy - 分配人ID
   * @param {string} reason - 分配原因
   */
  async assignTo(userId, assignedBy, reason = '手动分配') {
    const ConversationAssignment = this.sequelize.models.ConversationAssignment;
    
    // 检查用户是否存在
    const User = this.sequelize.models.User;
    const user = await User.findByPk(userId);
    
    if (!user) {
      throw new Error('用户不存在');
    }
    
    // 将现有分配设为非活跃状态
    await ConversationAssignment.update(
      { status: 'inactive' },
      { where: { conversationId: this.id, status: 'active' } }
    );
    
    // 创建新的分配记录
    const assignment = await ConversationAssignment.create({
      conversationId: this.id,
      assigneeId: userId,
      assignedBy,
      reason,
      status: 'active',
      assignedAt: new Date()
    });
    
    // 更新会话状态
    await this.update({
      status: 'processing'
    });
    
    // 发送通知
    await this.sequelize.models.Notification.create({
      userId,
      type: 'conversation_assigned',
      data: {
        conversationId: this.id,
        conversationTitle: this.title,
        assignedBy,
        reason,
        timestamp: new Date()
      },
      read: false
    });
    
    return assignment;
  }
  
  /**
   * 关闭会话
   * @param {Object} options - 关闭选项
   */
  async close(options = {}) {
    const { 
      reason = '已解决', 
      solution, 
      closedBy, 
      satisfactionScore 
    } = options;
    
    // 记录结束时间和持续时间
    const endedAt = new Date();
    const duration = Math.floor((endedAt - this.createdAt) / 1000);
    
    // 更新会话
    await this.update({
      status: 'closed',
      endedAt,
      duration,
      closureReason: reason,
      solution,
      satisfactionScore
    });
    
    // 发送系统消息
    await this.sequelize.models.Message.createSystemMessage({
      conversationId: this.id,
      content: `会话已关闭。原因: ${reason}`,
      metadata: {
        closedBy,
        timestamp: endedAt,
        duration
      }
    });
    
    return this;
  }
  
  /**
   * 重新打开会话
   * @param {string} reopenedBy - 重新打开的用户ID
   * @param {string} reason - 重新打开的原因
   */
  async reopen(reopenedBy, reason) {
    await this.update({
      status: 'active',
      endedAt: null,
      duration: null
    });
    
    // 发送系统消息
    await this.sequelize.models.Message.createSystemMessage({
      conversationId: this.id,
      content: `会话已重新打开。原因: ${reason}`,
      metadata: {
        reopenedBy,
        timestamp: new Date()
      }
    });
    
    return this;
  }
  
  /**
   * 获取未读消息数量
   * @param {string} userId - 用户ID
   */
  async getUnreadCount(userId) {
    const Message = this.sequelize.models.Message;
    
    return await Message.count({
      where: {
        conversationId: this.id,
        senderId: { [this.sequelize.Op.ne]: userId },
        isSystemMessage: false,
        status: { [this.sequelize.Op.in]: ['sent', 'delivered'] }
      }
    });
  }
  
  /**
   * 标记所有消息为已读
   * @param {string} userId - 用户ID
   */
  async markAllAsRead(userId) {
    const Message = this.sequelize.models.Message;
    
    const updated = await Message.update(
      {
        status: 'read',
        readBy: this.sequelize.fn('array_append', this.sequelize.col('readBy'), userId)
      },
      {
        where: {
          conversationId: this.id,
          senderId: { [this.sequelize.Op.ne]: userId },
          isSystemMessage: false,
          status: { [this.sequelize.Op.in]: ['sent', 'delivered'] }
        }
      }
    );
    
    return updated[0];
  }
  
  /**
   * 添加标签
   * @param {string|Array} tagIds - 标签ID或ID数组
   */
  async addTags(tagIds) {
    const Tag = this.sequelize.models.Tag;
    const tags = await Tag.findAll({ where: { id: tagIds } });
    
    await this.addTags(tags);
    return this;
  }
  
  /**
   * 移除标签
   * @param {string|Array} tagIds - 标签ID或ID数组
   */
  async removeTags(tagIds) {
    const Tag = this.sequelize.models.Tag;
    const tags = await Tag.findAll({ where: { id: tagIds } });
    
    await this.removeTags(tags);
    return this;
  }
  
  /**
   * 更新响应统计
   * @param {number} responseTime - 响应时间（秒）
   */
  async updateResponseStats(responseTime) {
    // 更新首次响应时间
    if (!this.firstResponseAt) {
      await this.update({
        firstResponseAt: new Date(),
        firstResponseTime: responseTime,
        totalResponseTime: this.totalResponseTime + responseTime,
        responseCount: this.responseCount + 1
      });
    } else {
      await this.update({
        totalResponseTime: this.totalResponseTime + responseTime,
        responseCount: this.responseCount + 1
      });
    }
    
    return this;
  }
  
  /**
   * 记录自动回复
   * @param {Object} autoReplyData - 自动回复数据
   */
  async recordAutoReply(autoReplyData) {
    const { ruleId, messageId, triggeredAt = new Date() } = autoReplyData;
    
    // 创建自动回复日志
    await this.sequelize.models.AutoReplyLog.create({
      conversationId: this.id,
      ruleId,
      messageId,
      triggeredAt
    });
    
    // 更新自动回复计数
    await this.update({
      autoReplyCount: this.autoReplyCount + 1
    });
    
    return this;
  }
  
  /**
   * 转换为响应对象
   */
  toResponseObject(includeRelations = false) {
    const base = {
      id: this.id,
      title: this.title,
      type: this.type,
      status: this.status,
      priority: this.priority,
      subject: this.subject,
      lastMessageId: this.lastMessageId,
      lastMessageAt: this.lastMessageAt,
      messageCount: this.messageCount,
      unreadCount: this.unreadCount,
      initialQuestion: this.initialQuestion,
      source: this.source,
      sourceDetails: this.sourceDetails,
      languageCode: this.languageCode,
      firstResponseAt: this.firstResponseAt,
      firstResponseTime: this.firstResponseTime,
      avgResponseTime: this.avgResponseTime,
      satisfactionScore: this.satisfactionScore,
      closureReason: this.closureReason,
      solution: this.solution,
      notes: this.notes,
      category: this.category,
      subcategory: this.subcategory,
      isSpam: this.isSpam,
      hasSensitiveContent: this.hasSensitiveContent,
      endedAt: this.endedAt,
      duration: this.duration,
      autoReplyCount: this.autoReplyCount,
      summary: this.summary,
      entities: this.entities,
      metadata: this.metadata,
      customerInfo: this.customerInfo,
      context: this.context,
      requiresFollowUp: this.requiresFollowUp,
      followUpBy: this.followUpBy,
      followUpStatus: this.followUpStatus,
      expectedResolutionTime: this.expectedResolutionTime,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
    
    // 包含关联信息
    if (includeRelations) {
      base.participants = this.participants ? this.participants.map(p => p.toSafeObject()) : [];
      base.lastMessage = this.lastMessage ? this.lastMessage.toSummary() : null;
      base.tags = this.tags ? this.tags.map(t => t.toResponseObject()) : [];
    }
    
    return base;
  }
  
  /**
   * 获取会话摘要
   */
  toSummary() {
    const lastMessageSummary = this.lastMessage ? this.lastMessage.toSummary() : null;
    
    return {
      id: this.id,
      title: this.title,
      type: this.type,
      status: this.status,
      priority: this.priority,
      messageCount: this.messageCount,
      unreadCount: this.unreadCount,
      lastMessage: lastMessageSummary,
      lastMessageAt: this.lastMessageAt,
      createdAt: this.createdAt,
      participants: this.participants ? this.participants.map(p => ({
        id: p.id,
        name: p.fullName || p.username,
        role: p.role
      })) : []
    };
  }
  
  /**
   * 创建新会话
   * @param {Object} data - 会话数据
   */
  static async createConversation(data) {
    const { 
      participants = [], 
      title, 
      type = 'customer_service', 
      initialQuestion,
      source = 'web',
      customerInfo = {}
    } = data;
    
    // 开始事务
    const transaction = await this.sequelize.transaction();
    
    try {
      // 创建会话
      const conversation = await this.create({
        title: title || `会话 #${Math.random().toString(36).substr(2, 9)}`,
        type,
        status: 'active',
        initialQuestion,
        source,
        customerInfo,
        lastMessageAt: new Date()
      }, { transaction });
      
      // 添加参与者
      if (participants.length > 0) {
        const User = this.sequelize.models.User;
        const userInstances = await User.findAll({ 
          where: { id: participants },
          transaction 
        });
        
        await conversation.addParticipants(userInstances, { transaction });
      }
      
      // 如果有初始问题，创建系统消息
      if (initialQuestion) {
        await this.sequelize.models.Message.createSystemMessage({
          conversationId: conversation.id,
          content: `初始问题: ${initialQuestion}`,
          metadata: { type: 'initial_question' }
        }, { transaction });
      }
      
      // 提交事务
      await transaction.commit();
      
      return conversation;
    } catch (error) {
      // 回滚事务
      await transaction.rollback();
      throw error;
    }
  }