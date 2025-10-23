const { DataTypes, Model } = require('sequelize');

/**
 * 工作记录模型
 * 记录客服的详细工作活动和操作日志
 */
class WorkLog extends Model {
  /**
   * 初始化工作记录模型
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
        
        scheduleId: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'work_schedules',
            key: 'id'
          },
          onDelete: 'SET NULL'
        },
        
        conversationId: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'conversations',
            key: 'id'
          },
          onDelete: 'SET NULL'
        },
        
        // 活动类型
        activityType: {
          type: DataTypes.ENUM(
            'login',
            'logout',
            'break_start',
            'break_end',
            'session_start',
            'session_end',
            'message_sent',
            'message_received',
            'auto_reply_sent',
            'tag_added',
            'tag_removed',
            'note_added',
            'note_updated',
            'transfer_request',
            'transfer_accept',
            'transfer_reject',
            'status_change',
            'priority_change',
            'customer_info_update',
            'attachment_upload',
            'attachment_download',
            'system_action',
            'report_generated',
            'settings_change',
            'training_module_accessed',
            'knowledge_base_accessed',
            'survey_sent',
            'feedback_received'
          ),
          allowNull: false
        },
        
        // 活动描述
        description: {
          type: DataTypes.TEXT,
          allowNull: false
        },
        
        // 活动详情
        details: {
          type: DataTypes.JSONB,
          allowNull: true,
          defaultValue: {}
        },
        
        // 资源类型
        resourceType: {
          type: DataTypes.STRING(50),
          allowNull: true
        },
        
        // 资源ID
        resourceId: {
          type: DataTypes.UUID,
          allowNull: true
        },
        
        // 持续时间（毫秒）
        duration: {
          type: DataTypes.INTEGER,
          allowNull: true,
          defaultValue: 0
        },
        
        // 结果状态
        resultStatus: {
          type: DataTypes.ENUM('success', 'failed', 'partial', 'pending'),
          allowNull: true,
          defaultValue: 'success'
        },
        
        // 错误信息（如果有）
        errorMessage: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        
        // 工作类别
        workCategory: {
          type: DataTypes.ENUM('chat', 'call', 'email', 'training', 'meeting', 'administrative', 'other'),
          allowNull: true,
          defaultValue: 'other'
        },
        
        // 是否可计费
        billable: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        
        // 计费时间（分钟）
        billableMinutes: {
          type: DataTypes.INTEGER,
          allowNull: true,
          defaultValue: 0
        },
        
        // 标签
        tags: {
          type: DataTypes.ARRAY(DataTypes.STRING),
          allowNull: true,
          defaultValue: []
        },
        
        // 系统信息
        ipAddress: {
          type: DataTypes.STRING(45),
          allowNull: true
        },
        
        userAgent: {
          type: DataTypes.STRING(255),
          allowNull: true
        },
        
        // 元数据
        metadata: {
          type: DataTypes.JSONB,
          allowNull: true,
          defaultValue: {}
        }
      },
      {
        sequelize,
        modelName: 'WorkLog',
        tableName: 'work_logs',
        timestamps: true,
        paranoid: false,
        indexes: [
          { fields: ['userId'] },
          { fields: ['conversationId'] },
          { fields: ['scheduleId'] },
          { fields: ['createdAt'] },
          { fields: ['activityType'] },
          { fields: ['workCategory'] },
          {
            fields: ['userId', 'createdAt'],
            name: 'idx_user_created_at'
          },
          {
            fields: ['userId', 'activityType'],
            name: 'idx_user_activity_type'
          },
          {
            fields: ['conversationId', 'createdAt'],
            name: 'idx_conversation_created_at'
          }
        ]
      }
    );
  }
  
  /**
   * 关联模型
   */
  static associate(models) {
    // 关联用户
    this.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
    
    // 关联会话
    this.belongsTo(models.Conversation, {
      foreignKey: 'conversationId',
      as: 'conversation'
    });
    
    // 关联工作日程
    this.belongsTo(models.WorkSchedule, {
      foreignKey: 'scheduleId',
      as: 'schedule'
    });
  }
  
  /**
   * 记录登录
   * @param {Object} data - 登录数据
   * @returns {WorkLog} 工作记录
   */
  static async logLogin(data) {
    const { userId, ipAddress, userAgent } = data;
    
    return await this.create({
      userId,
      activityType: 'login',
      description: '系统登录',
      details: {
        ipAddress,
        userAgent,
        timestamp: new Date()
      },
      resultStatus: 'success',
      ipAddress,
      userAgent
    });
  }
  
  /**
   * 记录登出
   * @param {Object} data - 登出数据
   * @returns {WorkLog} 工作记录
   */
  static async logLogout(data) {
    const { userId, ipAddress, userAgent, duration } = data;
    
    return await this.create({
      userId,
      activityType: 'logout',
      description: '系统登出',
      details: {
        ipAddress,
        userAgent,
        timestamp: new Date(),
        sessionDuration: duration
      },
      resultStatus: 'success',
      duration,
      ipAddress,
      userAgent
    });
  }
  
  /**
   * 记录会话开始
   * @param {Object} data - 会话数据
   * @returns {WorkLog} 工作记录
   */
  static async logSessionStart(data) {
    const { userId, conversationId, scheduleId, customerId, customerName } = data;
    
    return await this.create({
      userId,
      conversationId,
      scheduleId,
      activityType: 'session_start',
      description: `开始处理会话，客户: ${customerName || customerId}`,
      details: {
        customerId,
        customerName,
        startTime: new Date()
      },
      resultStatus: 'success',
      resourceType: 'conversation',
      resourceId: conversationId,
      workCategory: 'chat',
      billable: true
    });
  }
  
  /**
   * 记录会话结束
   * @param {Object} data - 会话数据
   * @returns {WorkLog} 工作记录
   */
  static async logSessionEnd(data) {
    const { userId, conversationId, scheduleId, startTime, duration, resolution } = data;
    
    return await this.create({
      userId,
      conversationId,
      scheduleId,
      activityType: 'session_end',
      description: `结束会话，${resolution || '已完成服务'}`,
      details: {
        startTime,
        endTime: new Date(),
        duration,
        resolution
      },
      resultStatus: 'success',
      duration,
      resourceType: 'conversation',
      resourceId: conversationId,
      workCategory: 'chat',
      billable: true,
      billableMinutes: Math.ceil(duration / 60000)
    });
  }
  
  /**
   * 记录消息发送
   * @param {Object} data - 消息数据
   * @returns {WorkLog} 工作记录
   */
  static async logMessageSent(data) {
    const { userId, conversationId, messageId, messageType } = data;
    
    return await this.create({
      userId,
      conversationId,
      activityType: 'message_sent',
      description: `发送${messageType || '文本'}消息`,
      details: {
        messageId,
        messageType,
        timestamp: new Date()
      },
      resultStatus: 'success',
      resourceType: 'message',
      resourceId: messageId,
      workCategory: 'chat',
      billable: true
    });
  }
  
  /**
   * 记录自动回复
   * @param {Object} data - 回复数据
   * @returns {WorkLog} 工作记录
   */
  static async logAutoReply(data) {
    const { conversationId, ruleId, messageId } = data;
    
    return await this.create({
      conversationId,
      activityType: 'auto_reply_sent',
      description: '自动回复消息',
      details: {
        ruleId,
        messageId,
        timestamp: new Date()
      },
      resultStatus: 'success',
      resourceType: 'message',
      resourceId: messageId,
      workCategory: 'chat',
      billable: false
    });
  }
  
  /**
   * 获取用户工作统计
   * @param {string} userId - 用户ID
   * @param {Date} startDate - 开始日期
   * @param {Date} endDate - 结束日期
   * @returns {Object} 统计数据
   */
  static async getUserStatistics(userId, startDate, endDate) {
    const where = {
      userId,
      createdAt: {
        [this.sequelize.Op.between]: [startDate, endDate]
      }
    };
    
    // 获取活动类型统计
    const activityStats = await this.findAll({
      attributes: [
        'activityType',
        [this.sequelize.fn('COUNT', '*'), 'count']
      ],
      where,
      group: ['activityType']
    });
    
    // 获取总工作时长
    const totalDuration = await this.sum('duration', {
      where: {
        ...where,
        billable: true
      }
    });
    
    // 获取会话数量
    const sessionCount = await this.count({
      where: {
        ...where,
        activityType: 'session_end'
      }
    });
    
    return {
      activityStats: activityStats.reduce((acc, stat) => {
        acc[stat.activityType] = parseInt(stat.count);
        return acc;
      }, {}),
      totalDuration: parseInt(totalDuration || 0),
      sessionCount,
      totalBillableMinutes: await this.sum('billableMinutes', { where })
    };
  }
  
  /**
   * 转换为响应对象
   * @returns {Object} 响应对象
   */
  toResponseObject() {
    return {
      id: this.id,
      userId: this.userId,
      conversationId: this.conversationId,
      scheduleId: this.scheduleId,
      activityType: this.activityType,
      description: this.description,
      details: this.details,
      resourceType: this.resourceType,
      resourceId: this.resourceId,
      duration: this.duration,
      resultStatus: this.resultStatus,
      errorMessage: this.errorMessage,
      workCategory: this.workCategory,
      billable: this.billable,
      billableMinutes: this.billableMinutes,
      tags: this.tags,
      createdAt: this.createdAt,
      // 关联信息会在查询时包含
      user: this.user ? this.user.toSafeObject() : null,
      conversation: this.conversation ? this.conversation.toSummary() : null
    };
  }
  
  /**
   * 转换为简化的显示对象
   * @returns {Object} 显示对象
   */
  toDisplayObject() {
    return {
      id: this.id,
      type: this.activityType,
      description: this.description,
      time: this.createdAt,
      user: this.user ? `${this.user.firstName} ${this.user.lastName}` : null,
      conversationId: this.conversationId
    };
  }
}

module.exports = WorkLog;