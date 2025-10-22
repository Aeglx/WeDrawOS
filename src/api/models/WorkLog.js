import { DataTypes, Model } from 'sequelize';

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
        
        // 持续时间（秒）
        duration: {
          type: DataTypes.INTEGER,
          allowNull: true,
          comment: '活动持续时间（秒）'
        },
        
        // 结果状态
        resultStatus: {
          type: DataTypes.ENUM('success', 'failed', 'partial', 'pending', 'cancelled'),
          allowNull: false,
          defaultValue: 'success'
        },
        
        // 关联资源类型
        resourceType: {
          type: DataTypes.ENUM('user', 'conversation', 'message', 'tag', 'attachment', 'note', 'feedback'),
          allowNull: true
        },
        
        resourceId: {
          type: DataTypes.UUID,
          allowNull: true
        },
        
        // 相关用户ID（如转移目标、反馈提供者等）
        relatedUserId: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id'
          },
          onDelete: 'SET NULL'
        },
        
        // 数量信息
        quantity: {
          type: DataTypes.INTEGER,
          allowNull: true,
          defaultValue: 1
        },
        
        // 工作类别
        workCategory: {
          type: DataTypes.ENUM(
            'chat_service',
            'voice_service',
            'email_service',
            'video_service',
            'administrative',
            'training',
            'quality_management',
            'reporting',
            'system_maintenance'
          ),
          allowNull: false,
          defaultValue: 'chat_service'
        },
        
        // 是否可计费
        billable: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true
        },
        
        // 计费单位
        billingUnit: {
          type: DataTypes.ENUM('hour', 'minute', 'session', 'message', 'task'),
          allowNull: true,
          defaultValue: 'minute'
        },
        
        // 位置信息
        location: {
          type: DataTypes.JSONB,
          allowNull: true,
          defaultValue: {}
        },
        
        // 设备信息
        deviceInfo: {
          type: DataTypes.JSONB,
          allowNull: true,
          defaultValue: {}
        },
        
        // IP地址
        ipAddress: {
          type: DataTypes.STRING(45),
          allowNull: true
        },
        
        // 用户代理
        userAgent: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        
        // 是否为系统生成
        isSystemGenerated: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        
        // 是否为批量操作
        isBulkOperation: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        
        // 批量操作ID
        bulkOperationId: {
          type: DataTypes.UUID,
          allowNull: true
        },
        
        // 性能指标
        performanceMetrics: {
          type: DataTypes.JSONB,
          allowNull: true,
          defaultValue: {}
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
        paranoid: true,
        indexes: [
          { fields: ['userId'] },
          { fields: ['scheduleId'] },
          { fields: ['conversationId'] },
          { fields: ['activityType'] },
          { fields: ['createdAt'] },
          { fields: ['resultStatus'] },
          { fields: ['workCategory'] },
          { fields: ['resourceId'] },
          { fields: ['relatedUserId'] },
          {
            fields: ['userId', 'createdAt'],
            name: 'idx_user_created'
          },
          {
            fields: ['userId', 'activityType'],
            name: 'idx_user_activity'
          },
          {
            fields: ['conversationId', 'createdAt'],
            name: 'idx_conversation_created'
          },
          {
            fields: ['createdAt', 'activityType'],
            name: 'idx_created_activity'
          },
          {
            fields: ['workCategory', 'billable'],
            name: 'idx_category_billable'
          },
          {
            fields: ['bulkOperationId'],
            name: 'idx_bulk_operation'
          }
        ],
        hooks: {
          beforeCreate: async (workLog) => {
            // 如果有关联的排班记录，尝试更新工作统计
            if (workLog.scheduleId) {
              try {
                const schedule = await workLog.sequelize.models.WorkSchedule.findByPk(workLog.scheduleId);
                if (schedule) {
                  // 根据活动类型更新相应的统计数据
                  const workStats = { ...schedule.workStats };
                  
                  if (workLog.activityType === 'session_end' && workLog.resultStatus === 'success') {
                    workStats.resolvedSessions = (workStats.resolvedSessions || 0) + 1;
                  }
                  
                  if (workLog.activityType === 'session_start') {
                    workStats.totalSessions = (workStats.totalSessions || 0) + 1;
                  }
                  
                  if (workLog.activityType === 'feedback_received' && workLog.details?.rating) {
                    const currentRating = workStats.customerSatisfaction || 0;
                    const totalRatings = workStats.totalRatings || 0;
                    workStats.customerSatisfaction = 
                      (currentRating * totalRatings + workLog.details.rating) / (totalRatings + 1);
                    workStats.totalRatings = totalRatings + 1;
                  }
                  
                  await schedule.update({ workStats });
                }
              } catch (error) {
                // 记录错误但不阻止创建工作记录
                console.error('Failed to update work schedule stats:', error);
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
    // 关联用户
    this.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
    
    // 关联工作安排
    this.belongsTo(models.WorkSchedule, {
      foreignKey: 'scheduleId',
      as: 'schedule'
    });
    
    // 关联会话
    this.belongsTo(models.Conversation, {
      foreignKey: 'conversationId',
      as: 'conversation'
    });
    
    // 关联相关用户
    this.belongsTo(models.User, {
      foreignKey: 'relatedUserId',
      as: 'relatedUser'
    });
    
    // 关联资源（如消息、标签等）
    this.belongsTo(models.Message, {
      foreignKey: 'resourceId',
      constraints: false,
      as: 'message'
    });
    
    this.belongsTo(models.Tag, {
      foreignKey: 'resourceId',
      constraints: false,
      as: 'tag'
    });
  }
  
  /**
   * 记录登录活动
   * @param {Object} data - 登录数据
   * @returns {WorkLog} 工作记录
   */
  static async logLogin(data) {
    const { userId, location, deviceInfo, ipAddress, userAgent } = data;
    
    return await this.create({
      userId,
      activityType: 'login',
      description: '用户登录系统',
      details: {
        timestamp: new Date(),
        ...(location && { location }),
        ...(deviceInfo && { deviceInfo })
      },
      resultStatus: 'success',
      workCategory: 'administrative',
      billable: false,
      ipAddress,
      userAgent
    });
  }
  
  /**
   * 记录登出活动
   * @param {Object} data - 登出数据
   * @returns {WorkLog} 工作记录
   */
  static async logLogout(data) {
    const { userId, loginTime, duration } = data;
    
    return await this.create({
      userId,
      activityType: 'logout',
      description: '用户登出系统',
      details: {
        loginTime,
        logoutTime: new Date()
      },
      duration,
      resultStatus: 'success',
      workCategory: 'administrative',
      billable: false
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
      relatedUserId: customerId,
      workCategory: 'chat_service',
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
        resolution
      },
      duration,
      resultStatus: resolution === '已解决' ? 'success' : 'partial',
      resourceType: 'conversation',
      resourceId: conversationId,
      workCategory: 'chat_service',
      billable: true
    });
  }
  
  /**
   * 记录消息发送
   * @param {Object} data - 消息数据
   * @returns {WorkLog} 工作记录
   */
  static async logMessageSent(data) {
    const { userId, conversationId, scheduleId, messageId, messageType, contentLength } = data;
    
    return await this.create({
      userId,
      conversationId,
      scheduleId,
      activityType: 'message_sent',
      description: `发送${messageType || '文本'}消息`,
      details: {
        messageId,
        messageType,
        contentLength
      },
      resultStatus: 'success',
      resourceType: 'message',
      resourceId: messageId,
      quantity: contentLength || 1,
      workCategory: 'chat_service',
      billable: true,
      billingUnit: 'message'
    });
  }
  
  /**
   * 获取用户活动统计
   * @param {string} userId - 用户ID
   * @param {Date} startDate - 开始日期
   * @param {Date} endDate - 结束日期
   * @returns {Object} 统计数据
   */
  static async getUserActivityStats(userId, startDate, endDate) {
    const logs = await this.findAll({
      where: {
        userId,
        createdAt: {
          [this.sequelize.Op.between]: [startDate, endDate]
        }
      },
      attributes: ['activityType', 'createdAt', 'duration', 'billable']
    });
    
    const stats = {
      totalActivities: logs.length,
      byType: {},
      totalBillableMinutes: 0,
      sessionCount: 0,
      messageCount: 0
    };
    
    logs.forEach(log => {
      // 按类型统计
      if (!stats.byType[log.activityType]) {
        stats.byType[log.activityType] = 0;
      }
      stats.byType[log.activityType]++;
      
      // 统计计费时间
      if (log.billable && log.duration) {
        stats.totalBillableMinutes += Math.ceil(log.duration / 60);
      }
      
      // 统计会话数量
      if (log.activityType === 'session_start') {
        stats.sessionCount++;
      }
      
      // 统计消息数量
      if (log.activityType === 'message_sent' || log.activityType === 'message_received') {
        stats.messageCount++;
      }
    });
    
    return stats;
  }
  
  /**
   * 获取会话活动历史
   * @param {string} conversationId - 会话ID
   * @returns {Array} 活动列表
   */
  static async getConversationActivityHistory(conversationId) {
    return await this.findAll({
      where: {
        conversationId
      },
      include: [
        { model: this.sequelize.models.User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'avatar'] },
        { model: this.sequelize.models.User, as: 'relatedUser', attributes: ['id', 'firstName', 'lastName'] }
      ],
      order: [['createdAt', 'ASC']]
    });
  }
  
  /**
   * 获取工作统计摘要
   * @param {string} userId - 用户ID
   * @param {Date} date - 日期
   * @returns {Object} 统计摘要
   */
  static async getDailyWorkSummary(userId, date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const logs = await this.findAll({
      where: {
        userId,
        createdAt: {
          [this.sequelize.Op.between]: [startOfDay, endOfDay]
        }
      }
    });
    
    const summary = {
      totalSessions: 0,
      resolvedSessions: 0,
      messagesSent: 0,
      messagesReceived: 0,
      totalWorkMinutes: 0,
      breakMinutes: 0,
      firstLogin: null,
      lastLogout: null
    };
    
    let loginTime = null;
    let breakStartTime = null;
    
    logs.forEach(log => {
      switch (log.activityType) {
        case 'login':
          loginTime = new Date(log.createdAt);
          if (!summary.firstLogin || loginTime < summary.firstLogin) {
            summary.firstLogin = loginTime;
          }
          break;
        case 'logout':
          summary.lastLogout = new Date(log.createdAt);
          if (log.duration) {
            summary.totalWorkMinutes += Math.ceil(log.duration / 60);
          }
          break;
        case 'break_start':
          breakStartTime = new Date(log.createdAt);
          break;
        case 'break_end':
          if (breakStartTime) {
            const breakDuration = Math.ceil((new Date(log.createdAt) - breakStartTime) / (1000 * 60));
            summary.breakMinutes += breakDuration;
          }
          break;
        case 'session_start':
          summary.totalSessions++;
          break;
        case 'session_end':
          if (log.resultStatus === 'success') {
            summary.resolvedSessions++;
          }
          break;
        case 'message_sent':
          summary.messagesSent++;
          break;
        case 'message_received':
          summary.messagesReceived++;
          break;
      }
    });
    
    return summary;
  }
  
  /**
   * 转换为响应对象
   * @returns {Object} 响应对象
   */
  toResponseObject() {
    return {
      id: this.id,
      userId: this.userId,
      scheduleId: this.scheduleId,
      conversationId: this.conversationId,
      activityType: this.activityType,
      description: this.description,
      details: this.details,
      duration: this.duration,
      resultStatus: this.resultStatus,
      resourceType: this.resourceType,
      resourceId: this.resourceId,
      relatedUserId: this.relatedUserId,
      quantity: this.quantity,
      workCategory: this.workCategory,
      billable: this.billable,
      billingUnit: this.billingUnit,
      createdAt: this.createdAt,
      // 关联信息会在查询时包含
      user: this.user ? this.user.toSafeObject() : null,
      relatedUser: this.relatedUser ? this.relatedUser.toSafeObject() : null,
      conversation: this.conversation ? this.conversation.toResponseObject() : null
    };
  }
  
  /**
   * 获取摘要信息
   * @returns {Object} 摘要信息
   */
  toSummary() {
    return {
      id: this.id,
      type: this.activityType,
      description: this.description,
      time: this.createdAt,
      status: this.resultStatus,
      user: this.user ? `${this.user.firstName} ${this.user.lastName}` : null,
      conversationId: this.conversationId
    };
  }