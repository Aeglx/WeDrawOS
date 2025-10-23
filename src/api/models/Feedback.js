const { DataTypes, Model } = require('sequelize');

/**
 * 客户反馈模型
 * 管理和记录用户对客服服务的评价和反馈信息
 */
class Feedback extends Model {
  /**
   * 初始化客户反馈模型
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
        
        conversationId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'conversations',
            key: 'id'
          },
          onDelete: 'CASCADE'
        },
        
        agentId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          },
          onDelete: 'CASCADE'
        },
        
        // 评分
        rating: {
          type: DataTypes.INTEGER,
          allowNull: false,
          validate: {
            min: 1,
            max: 5
          }
        },
        
        // 反馈类型
        type: {
          type: DataTypes.ENUM(
            'service_quality',
            'response_time',
            'problem_solving',
            'communication',
            'overall_satisfaction',
            'suggestion',
            'complaint',
            'praise'
          ),
          allowNull: false,
          defaultValue: 'overall_satisfaction'
        },
        
        // 反馈内容
        content: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        
        // 具体问题标签
        issueTags: {
          type: DataTypes.ARRAY(DataTypes.STRING(50)),
          allowNull: true,
          defaultValue: []
        },
        
        // 是否匿名
        isAnonymous: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        
        // 解决状态
        resolutionStatus: {
          type: DataTypes.ENUM('pending', 'in_progress', 'resolved', 'closed', 'escalated'),
          allowNull: false,
          defaultValue: 'pending'
        },
        
        // 优先级
        priority: {
          type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
          allowNull: false,
          defaultValue: 'medium'
        },
        
        // 响应内容
        responseContent: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        
        // 响应时间
        respondedAt: {
          type: DataTypes.DATE,
          allowNull: true
        },
        
        // 响应人
        responderId: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id'
          },
          onDelete: 'SET NULL'
        },
        
        // 首次响应时间
        firstResponseTime: {
          type: DataTypes.INTEGER,
          allowNull: true, // 秒
          comment: '首次响应时间（秒）'
        },
        
        // 问题解决时间
        resolutionTime: {
          type: DataTypes.INTEGER,
          allowNull: true, // 秒
          comment: '问题解决时间（秒）'
        },
        
        // 是否需要跟进
        needsFollowUp: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        
        // 跟进日期
        followUpDate: {
          type: DataTypes.DATE,
          allowNull: true
        },
        
        // 跟进人
        followUpBy: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id'
          },
          onDelete: 'SET NULL'
        },
        
        // 跟进记录
        followUpNotes: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        
        // 满意度调查回答
        satisfactionSurveyAnswers: {
          type: DataTypes.JSONB,
          allowNull: true,
          defaultValue: {}
        },
        
        // 是否是培训数据
        isTrainingData: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        
        // 反馈元数据
        metadata: {
          type: DataTypes.JSONB,
          allowNull: true,
          defaultValue: {}
        }
      },
      {
        sequelize,
        modelName: 'Feedback',
        tableName: 'feedbacks',
        timestamps: true,
        paranoid: true,
        indexes: [
          { fields: ['userId'] },
          { fields: ['conversationId'] },
          { fields: ['agentId'] },
          { fields: ['rating'] },
          { fields: ['type'] },
          { fields: ['resolutionStatus'] },
          { fields: ['priority'] },
          { fields: ['createdAt'] },
          { fields: ['respondedAt'] },
          {
            fields: ['userId', 'createdAt'],
            name: 'idx_user_created'
          },
          {
            fields: ['agentId', 'rating'],
            name: 'idx_agent_rating'
          },
          {
            fields: ['agentId', 'resolutionStatus'],
            name: 'idx_agent_status'
          },
          {
            fields: ['resolutionStatus', 'priority'],
            name: 'idx_status_priority'
          },
          {
            fields: ['needsFollowUp', 'followUpDate'],
            name: 'idx_followup'
          }
        ],
        hooks: {
          afterCreate: async (feedback) => {
            // 更新会话的反馈状态
            const conversation = await feedback.getConversation();
            if (conversation) {
              await conversation.update({
                hasFeedback: true,
                feedbackRating: feedback.rating
              });
            }
          },
          beforeUpdate: async (feedback, options) => {
            // 当状态变更为已解决时，记录解决时间
            if (feedback.changed('resolutionStatus') && feedback.resolutionStatus === 'resolved') {
              const conversation = await feedback.getConversation();
              if (conversation) {
                const resolutionTime = Math.floor((new Date() - conversation.createdAt) / 1000);
                feedback.resolutionTime = resolutionTime;
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
    // 关联用户（客户）
    this.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'customer'
    });
    
    // 关联客服人员
    this.belongsTo(models.User, {
      foreignKey: 'agentId',
      as: 'agent'
    });
    
    // 关联会话
    this.belongsTo(models.Conversation, {
      foreignKey: 'conversationId',
      as: 'conversation'
    });
    
    // 关联响应人
    this.belongsTo(models.User, {
      foreignKey: 'responderId',
      as: 'responder'
    });
    
    // 关联跟进人
    this.belongsTo(models.User, {
      foreignKey: 'followUpBy',
      as: 'follower'
    });
    
    // 一对多关系（一个反馈可能有多个标签）
    this.belongsToMany(models.Tag, {
      through: 'feedback_tags',
      as: 'tags',
      foreignKey: 'feedbackId',
      otherKey: 'tagId'
    });
  }
  
  /**
   * 更新解决状态
   * @param {string} status - 新状态
   * @param {string} userId - 操作用户ID
   */
  async updateResolutionStatus(status, userId) {
    this.resolutionStatus = status;
    
    if (status === 'resolved' && !this.resolutionTime) {
      const conversation = await this.getConversation();
      if (conversation) {
        this.resolutionTime = Math.floor((new Date() - conversation.createdAt) / 1000);
      }
    }
    
    if (userId && !this.responderId) {
      this.responderId = userId;
      this.respondedAt = new Date();
    }
    
    await this.save();
  }
  
  /**
   * 添加响应
   * @param {string} content - 响应内容
   * @param {string} userId - 响应人ID
   */
  async addResponse(content, userId) {
    this.responseContent = content;
    this.responderId = userId;
    this.respondedAt = new Date();
    
    // 自动更新状态为已回复
    if (this.resolutionStatus === 'pending') {
      this.resolutionStatus = 'in_progress';
    }
    
    await this.save();
  }
  
  /**
   * 设置跟进
   * @param {Date} date - 跟进日期
   * @param {string} userId - 跟进人ID
   * @param {string} notes - 跟进记录
   */
  async setFollowUp(date, userId, notes = '') {
    this.needsFollowUp = true;
    this.followUpDate = date;
    this.followUpBy = userId;
    if (notes) {
      this.followUpNotes = notes;
    }
    
    await this.save();
  }
  
  /**
   * 完成跟进
   * @param {string} notes - 跟进结果记录
   */
  async completeFollowUp(notes = '') {
    this.needsFollowUp = false;
    this.followUpNotes = this.followUpNotes ? `${this.followUpNotes}\n${notes}` : notes;
    
    await this.save();
  }
  
  /**
   * 获取客服的平均评分
   * @param {string} agentId - 客服ID
   * @returns {number} 平均评分
   */
  static async getAgentAverageRating(agentId) {
    const result = await this.findOne({
      attributes: [
        [this.sequelize.fn('AVG', this.sequelize.col('rating')), 'averageRating'],
        [this.sequelize.fn('COUNT', this.sequelize.col('id')), 'totalFeedback']
      ],
      where: {
        agentId,
        rating: { [this.sequelize.Op.ne]: null }
      },
      raw: true
    });
    
    return result ? {
      averageRating: parseFloat(result.averageRating) || 0,
      totalFeedback: parseInt(result.totalFeedback) || 0
    } : { averageRating: 0, totalFeedback: 0 };
  }
  
  /**
   * 获取评分统计
   * @param {Object} filters - 过滤条件
   * @returns {Object} 评分统计
   */
  static async getRatingStats(filters = {}) {
    const stats = await this.findAll({
      attributes: [
        'rating',
        [this.sequelize.fn('COUNT', this.sequelize.col('id')), 'count']
      ],
      where: filters,
      group: ['rating'],
      raw: true
    });
    
    const result = {};
    for (let i = 1; i <= 5; i++) {
      result[i] = 0;
    }
    
    stats.forEach(stat => {
      result[stat.rating] = parseInt(stat.count) || 0;
    });
    
    return result;
  }
  
  /**
   * 获取待处理的反馈数量
   * @returns {number} 待处理数量
   */
  static async getPendingCount() {
    return await this.count({
      where: {
        resolutionStatus: { [this.sequelize.Op.in]: ['pending', 'in_progress'] }
      }
    });
  }
  
  /**
   * 获取需要跟进的反馈
   * @param {Date} date - 日期
   * @returns {Array} 反馈列表
   */
  static async getFollowUpsForDate(date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return await this.findAll({
      where: {
        needsFollowUp: true,
        followUpDate: {
          [this.sequelize.Op.between]: [startOfDay, endOfDay]
        }
      },
      include: ['customer', 'agent', 'follower']
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
      conversationId: this.conversationId,
      agentId: this.agentId,
      rating: this.rating,
      type: this.type,
      content: this.content,
      issueTags: this.issueTags,
      isAnonymous: this.isAnonymous,
      resolutionStatus: this.resolutionStatus,
      priority: this.priority,
      responseContent: this.responseContent,
      respondedAt: this.respondedAt,
      responderId: this.responderId,
      firstResponseTime: this.firstResponseTime,
      resolutionTime: this.resolutionTime,
      needsFollowUp: this.needsFollowUp,
      followUpDate: this.followUpDate,
      followUpBy: this.followUpBy,
      followUpNotes: this.followUpNotes,
      satisfactionSurveyAnswers: this.satisfactionSurveyAnswers,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      // 关联信息会在查询时包含
      customer: this.customer ? this.customer.toSafeObject() : null,
      agent: this.agent ? this.agent.toSafeObject() : null,
      conversation: this.conversation ? this.conversation.toResponseObject() : null,
      responder: this.responder ? this.responder.toSafeObject() : null,
      follower: this.follower ? this.follower.toSafeObject() : null,
      tags: this.tags ? this.tags.map(tag => tag.toResponseObject()) : []
    };
  }
  
  /**
   * 获取摘要信息
   * @returns {Object} 摘要信息
   */
  toSummary() {
    return {
      id: this.id,
      rating: this.rating,
      type: this.type,
      resolutionStatus: this.resolutionStatus,
      priority: this.priority,
      needsFollowUp: this.needsFollowUp,
      createdAt: this.createdAt,
      respondedAt: this.respondedAt,
      customerName: this.customer ? `${this.customer.firstName} ${this.customer.lastName}` : null,
      agentName: this.agent ? `${this.agent.firstName} ${this.agent.lastName}` : null
    };
  }
}

module.exports = Feedback;