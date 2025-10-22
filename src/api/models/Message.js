import { DataTypes, Model } from 'sequelize';

/**
 * 消息模型
 * 管理客服系统中的消息数据
 */
class Message extends Model {
  /**
   * 初始化消息模型
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
        conversationId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'conversations',
            key: 'id'
          },
          onDelete: 'CASCADE'
        },
        
        senderId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          },
          onDelete: 'SET NULL'
        },
        
        // 可选的分配关联
        assignmentId: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'conversation_assignments',
            key: 'id'
          },
          onDelete: 'SET NULL'
        },
        
        // 消息类型
        type: {
          type: DataTypes.ENUM(
            'text',
            'image',
            'file',
            'audio',
            'video',
            'system',
            'notification',
            'auto_reply',
            'transfer_request',
            'transfer_response',
            'status_update',
            'error',
            'template',
            'quick_reply',
            'survey',
            'rating'
          ),
          allowNull: false,
          defaultValue: 'text'
        },
        
        // 消息内容
        content: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        
        // 媒体URL（用于非文本消息）
        mediaUrl: {
          type: DataTypes.STRING(255),
          allowNull: true
        },
        
        // 媒体文件名
        mediaFilename: {
          type: DataTypes.STRING(255),
          allowNull: true
        },
        
        // 媒体文件大小（字节）
        mediaSize: {
          type: DataTypes.BIGINT,
          allowNull: true
        },
        
        // 媒体类型（MIME类型）
        mediaType: {
          type: DataTypes.STRING(100),
          allowNull: true
        },
        
        // 消息状态
        status: {
          type: DataTypes.ENUM('sent', 'delivered', 'read', 'failed', 'pending'),
          allowNull: false,
          defaultValue: 'sent'
        },
        
        // 发送失败原因
        failureReason: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        
        // 是否是系统消息
        isSystemMessage: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        
        // 是否是自动回复
        isAutoReply: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        
        // 自动回复规则ID
        autoReplyRuleId: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'auto_reply_rules',
            key: 'id'
          },
          onDelete: 'SET NULL'
        },
        
        // 关联的父消息（回复消息）
        parentMessageId: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'messages',
            key: 'id'
          },
          onDelete: 'SET NULL'
        },
        
        // 引用的消息ID
        quotedMessageId: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'messages',
            key: 'id'
          },
          onDelete: 'SET NULL'
        },
        
        // 已读用户ID列表
        readBy: {
          type: DataTypes.ARRAY(DataTypes.UUID),
          allowNull: true,
          defaultValue: []
        },
        
        // 消息来源
        source: {
          type: DataTypes.ENUM('web', 'mobile', 'api', 'system', 'email', 'sms'),
          allowNull: false,
          defaultValue: 'web'
        },
        
        // 消息优先级
        priority: {
          type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
          allowNull: false,
          defaultValue: 'medium'
        },
        
        // 消息元数据
        metadata: {
          type: DataTypes.JSONB,
          allowNull: true,
          defaultValue: {}
        },
        
        // 语言代码
        languageCode: {
          type: DataTypes.STRING(10),
          allowNull: true,
          defaultValue: 'zh-CN'
        },
        
        // 是否包含敏感内容
        hasSensitiveContent: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        
        // 敏感内容标签
        sensitiveContentTags: {
          type: DataTypes.ARRAY(DataTypes.STRING(50)),
          allowNull: true,
          defaultValue: []
        },
        
        // 消息分类
        category: {
          type: DataTypes.ENUM('question', 'statement', 'feedback', 'complaint', 'request', 'greeting', 'farewell'),
          allowNull: true
        },
        
        // 意图识别
        intent: {
          type: DataTypes.STRING(100),
          allowNull: true
        },
        
        // 意图置信度
        intentConfidence: {
          type: DataTypes.FLOAT,
          allowNull: true,
          validate: {
            min: 0,
            max: 1
          }
        },
        
        // 情绪分析
        sentiment: {
          type: DataTypes.ENUM('positive', 'negative', 'neutral', 'mixed'),
          allowNull: true
        },
        
        // 情绪置信度
        sentimentConfidence: {
          type: DataTypes.FLOAT,
          allowNull: true,
          validate: {
            min: 0,
            max: 1
          }
        },
        
        // 实体识别结果
        entities: {
          type: DataTypes.JSONB,
          allowNull: true,
          defaultValue: []
        }
      },
      {
        sequelize,
        modelName: 'Message',
        tableName: 'messages',
        timestamps: true,
        paranoid: true,
        indexes: [
          { fields: ['conversationId'] },
          { fields: ['senderId'] },
          { fields: ['assignmentId'] },
          { fields: ['type'] },
          { fields: ['status'] },
          { fields: ['createdAt'] },
          { fields: ['isSystemMessage'] },
          { fields: ['isAutoReply'] },
          { fields: ['parentMessageId'] },
          { fields: ['quotedMessageId'] },
          { fields: ['priority'] },
          {
            fields: ['conversationId', 'createdAt'],
            name: 'idx_conversation_created'
          },
          {
            fields: ['conversationId', 'senderId'],
            name: 'idx_conversation_sender'
          },
          {
            fields: ['conversationId', 'status'],
            name: 'idx_conversation_status'
          },
          {
            fields: ['senderId', 'createdAt'],
            name: 'idx_sender_created'
          },
          {
            fields: ['createdAt', 'type'],
            name: 'idx_created_type'
          }
        ],
        hooks: {
          afterCreate: async (message) => {
            try {
              // 更新会话的最后消息时间
              const conversation = await message.getConversation();
              if (conversation) {
                await conversation.update({
                  lastMessageAt: message.createdAt,
                  lastMessageId: message.id,
                  messageCount: sequelize.literal('messageCount + 1')
                });
              }
              
              // 如果是用户发送的消息且非系统消息，更新会话的未读消息计数
              if (!message.isSystemMessage && !message.isAutoReply) {
                // 获取会话中的其他参与者
                const participants = await conversation.getParticipants();
                for (const participant of participants) {
                  if (participant.userId !== message.senderId) {
                    // 发送通知
                    await sequelize.models.Notification.createNewMessageNotification({
                      userId: participant.userId,
                      conversationId: message.conversationId,
                      messageId: message.id,
                      senderId: message.senderId,
                      senderName: message.metadata?.senderName || '用户',
                      content: message.content || ''
                    });
                  }
                }
              }
            } catch (error) {
              console.error('Error in message afterCreate hook:', error);
            }
          },
          beforeUpdate: async (message, options) => {
            // 更新消息状态时的处理
            if (message.changed('status')) {
              // 如果状态变为已读，记录读取时间
              if (message.status === 'read') {
                message.metadata = {
                  ...message.metadata,
                  readAt: new Date()
                };
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
    // 关联会话
    this.belongsTo(models.Conversation, {
      foreignKey: 'conversationId',
      as: 'conversation'
    });
    
    // 关联发送者
    this.belongsTo(models.User, {
      foreignKey: 'senderId',
      as: 'sender'
    });
    
    // 关联分配记录
    this.belongsTo(models.ConversationAssignment, {
      foreignKey: 'assignmentId',
      as: 'assignment'
    });
    
    // 关联自动回复规则
    this.belongsTo(models.AutoReplyRule, {
      foreignKey: 'autoReplyRuleId',
      as: 'autoReplyRule'
    });
    
    // 关联父消息
    this.belongsTo(models.Message, {
      foreignKey: 'parentMessageId',
      as: 'parentMessage'
    });
    
    // 关联引用消息
    this.belongsTo(models.Message, {
      foreignKey: 'quotedMessageId',
      as: 'quotedMessage'
    });
    
    // 一个消息可以有多个回复
    this.hasMany(models.Message, {
      foreignKey: 'parentMessageId',
      as: 'replies'
    });
    
    // 消息可以有多个标签
    this.belongsToMany(models.Tag, {
      through: 'message_tags',
      foreignKey: 'messageId',
      otherKey: 'tagId',
      as: 'tags'
    });
  }
  
  /**
   * 标记消息为已读
   * @param {string} userId - 读取消息的用户ID
   */
  async markAsRead(userId) {
    // 更新消息状态
    this.status = 'read';
    
    // 更新已读用户列表
    if (!this.readBy) {
      this.readBy = [];
    }
    
    if (!this.readBy.includes(userId)) {
      this.readBy.push(userId);
    }
    
    // 更新元数据中的读取时间
    this.metadata = {
      ...this.metadata,
      readAt: new Date(),
      readBy: this.readBy
    };
    
    await this.save();
    return this;
  }
  
  /**
   * 标记消息发送失败
   * @param {string} reason - 失败原因
   */
  async markAsFailed(reason) {
    this.status = 'failed';
    this.failureReason = reason;
    await this.save();
    return this;
  }
  
  /**
   * 创建系统消息
   * @param {Object} data - 消息数据
   * @returns {Message} 创建的消息
   */
  static async createSystemMessage(data) {
    const { conversationId, content, type = 'system', metadata = {} } = data;
    
    return await this.create({
      conversationId,
      senderId: 'system', // 系统用户ID
      type,
      content,
      status: 'sent',
      isSystemMessage: true,
      priority: 'medium',
      metadata
    });
  }
  
  /**
   * 创建自动回复消息
   * @param {Object} data - 消息数据
   * @returns {Message} 创建的消息
   */
  static async createAutoReplyMessage(data) {
    const { conversationId, senderId, content, ruleId, metadata = {} } = data;
    
    return await this.create({
      conversationId,
      senderId,
      type: 'auto_reply',
      content,
      status: 'sent',
      isAutoReply: true,
      autoReplyRuleId: ruleId,
      priority: 'medium',
      metadata
    });
  }
  
  /**
   * 获取会话中的未读消息数量
   * @param {string} conversationId - 会话ID
   * @param {string} userId - 用户ID
   * @returns {number} 未读消息数量
   */
  static async getUnreadCount(conversationId, userId) {
    return await this.count({
      where: {
        conversationId,
        senderId: { [this.sequelize.Op.ne]: userId },
        isSystemMessage: false,
        [this.sequelize.Op.or]: [
          { status: { [this.sequelize.Op.in]: ['sent', 'delivered'] } },
          { readBy: { [this.sequelize.Op.not]: { [this.sequelize.Op.contains]: [userId] } } }
        ]
      }
    });
  }
  
  /**
   * 批量标记会话消息为已读
   * @param {string} conversationId - 会话ID
   * @param {string} userId - 用户ID
   */
  static async markConversationMessagesAsRead(conversationId, userId) {
    const messages = await this.findAll({
      where: {
        conversationId,
        senderId: { [this.sequelize.Op.ne]: userId },
        isSystemMessage: false
      }
    });
    
    for (const message of messages) {
      await message.markAsRead(userId);
    }
    
    return messages.length;
  }
  
  /**
   * 获取会话中的最近消息
   * @param {string} conversationId - 会话ID
   * @param {number} limit - 限制数量
   * @param {string} beforeId - 在该消息之前
   * @returns {Array} 消息列表
   */
  static async getRecentMessages(conversationId, limit = 50, beforeId = null) {
    const where = { conversationId };
    
    if (beforeId) {
      where.id = { [this.sequelize.Op.lt]: beforeId };
    }
    
    return await this.findAll({
      where,
      include: [
        { model: this.sequelize.models.User, as: 'sender', attributes: ['id', 'firstName', 'lastName', 'avatar', 'role'] },
        { model: this, as: 'quotedMessage', attributes: ['id', 'content', 'type'] },
        { model: this.sequelize.models.Tag, as: 'tags', attributes: ['id', 'name', 'color'] }
      ],
      order: [['createdAt', 'DESC']],
      limit
    });
  }
  
  /**
   * 转换为响应对象
   * @returns {Object} 响应对象
   */
  toResponseObject() {
    return {
      id: this.id,
      conversationId: this.conversationId,
      senderId: this.senderId,
      assignmentId: this.assignmentId,
      type: this.type,
      content: this.content,
      mediaUrl: this.mediaUrl,
      mediaFilename: this.mediaFilename,
      mediaSize: this.mediaSize,
      mediaType: this.mediaType,
      status: this.status,
      isSystemMessage: this.isSystemMessage,
      isAutoReply: this.isAutoReply,
      autoReplyRuleId: this.autoReplyRuleId,
      parentMessageId: this.parentMessageId,
      quotedMessageId: this.quotedMessageId,
      readBy: this.readBy,
      source: this.source,
      priority: this.priority,
      metadata: this.metadata,
      languageCode: this.languageCode,
      hasSensitiveContent: this.hasSensitiveContent,
      sensitiveContentTags: this.sensitiveContentTags,
      category: this.category,
      intent: this.intent,
      intentConfidence: this.intentConfidence,
      sentiment: this.sentiment,
      sentimentConfidence: this.sentimentConfidence,
      entities: this.entities,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      // 关联信息会在查询时包含
      sender: this.sender ? this.sender.toSafeObject() : null,
      quotedMessage: this.quotedMessage ? this.quotedMessage.toResponseObject() : null,
      tags: this.tags ? this.tags.map(tag => tag.toResponseObject()) : []
    };
  }
  
  /**
   * 获取消息摘要
   * @returns {Object} 摘要信息
   */
  toSummary() {
    // 根据消息类型生成摘要
    let summary = '';
    
    switch (this.type) {
      case 'text':
        summary = this.content?.length > 50 ? this.content.substring(0, 50) + '...' : (this.content || '');
        break;
      case 'image':
        summary = '[图片]';
        break;
      case 'file':
        summary = `[文件] ${this.mediaFilename}`;
        break;
      case 'audio':
        summary = '[语音]';
        break;
      case 'video':
        summary = '[视频]';
        break;
      case 'auto_reply':
        summary = `[自动回复] ${this.content?.length > 30 ? this.content.substring(0, 30) + '...' : (this.content || '')}`;
        break;
      case 'system':
        summary = `[系统] ${this.content || ''}`;
        break;
      default:
        summary = `[${this.type}]`;
    }
    
    return {
      id: this.id,
      type: this.type,
      summary,
      senderId: this.senderId,
      isSystem: this.isSystemMessage,
      isAutoReply: this.isAutoReply,
      timestamp: this.createdAt,
      status: this.status
    };
  }