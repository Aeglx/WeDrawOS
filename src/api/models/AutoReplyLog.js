import { DataTypes, Model } from 'sequelize';

/**
 * 自动回复日志模型
 * 记录自动回复规则的使用情况
 */
class AutoReplyLog extends Model {
  /**
   * 初始化自动回复日志模型
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
        ruleId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'auto_reply_rules',
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
        
        // 用户信息
        userId: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id'
          },
          onDelete: 'SET NULL'
        },
        
        // 触发的消息
        triggerMessage: {
          type: DataTypes.TEXT,
          allowNull: false
        },
        
        // 回复内容
        replyContent: {
          type: DataTypes.TEXT,
          allowNull: false
        },
        
        // 回复类型
        replyType: {
          type: DataTypes.ENUM('text', 'rich', 'image', 'file'),
          allowNull: false,
          defaultValue: 'text'
        },
        
        // 匹配方式
        matchType: {
          type: DataTypes.ENUM('any', 'all', 'exact', 'regex'),
          allowNull: true
        },
        
        // 匹配的关键词
        matchedKeywords: {
          type: DataTypes.ARRAY(DataTypes.STRING),
          allowNull: true,
          defaultValue: []
        },
        
        // 触发条件
        triggerCondition: {
          type: DataTypes.ENUM('immediate', 'no_response', 'session_start'),
          allowNull: true
        },
        
        // 延迟时间（实际使用的延迟）
        actualDelay: {
          type: DataTypes.INTEGER,
          allowNull: true,
          comment: '实际延迟时间（毫秒）'
        },
        
        // 响应状态
        responseStatus: {
          type: DataTypes.ENUM('sent', 'failed', 'ignored'),
          allowNull: false,
          defaultValue: 'sent'
        },
        
        // 失败原因（如果有）
        failureReason: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        
        // 用户反馈
        userFeedback: {
          type: DataTypes.ENUM('helpful', 'not_helpful', 'no_feedback'),
          allowNull: true,
          defaultValue: 'no_feedback'
        },
        
        // 用户反馈内容
        feedbackComment: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        
        // 会话上下文
        sessionContext: {
          type: DataTypes.JSONB,
          allowNull: true,
          defaultValue: {}
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
        modelName: 'AutoReplyLog',
        tableName: 'auto_reply_logs',
        timestamps: true,
        paranoid: false, // 日志通常不需要软删除
        indexes: [
          { fields: ['ruleId'] },
          { fields: ['conversationId'] },
          { fields: ['userId'] },
          { fields: ['createdAt'] },
          { fields: ['responseStatus'] },
          { fields: ['userFeedback'] },
          {
            fields: ['ruleId', 'createdAt'],
            name: 'idx_rule_created_at'
          },
          {
            fields: ['conversationId', 'createdAt'],
            name: 'idx_conversation_created_at'
          },
          {
            fields: ['userId', 'createdAt'],
            name: 'idx_user_created_at'
          }
        ]
      }
    );
  }
  
  /**
   * 关联模型
   */
  static associate(models) {
    // 关联自动回复规则
    this.belongsTo(models.AutoReplyRule, {
      foreignKey: 'ruleId',
      as: 'rule'
    });
    
    // 关联会话
    this.belongsTo(models.Conversation, {
      foreignKey: 'conversationId',
      as: 'conversation'
    });
    
    // 关联用户
    this.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  }
  
  /**
   * 记录用户反馈
   * @param {string} feedback - 反馈类型
   * @param {string} comment - 反馈内容
   */
  async recordFeedback(feedback, comment = null) {
    this.userFeedback = feedback;
    if (comment) {
      this.feedbackComment = comment;
    }
    await this.save();
  }
  
  /**
   * 更新响应状态
   * @param {string} status - 状态
   * @param {string} reason - 原因（如果失败）
   */
  async updateResponseStatus(status, reason = null) {
    this.responseStatus = status;
    if (status === 'failed' && reason) {
      this.failureReason = reason;
    }
    await this.save();
  }
  
  /**
   * 获取规则使用统计
   * @param {string} ruleId - 规则ID
   * @param {Date} startDate - 开始日期
   * @param {Date} endDate - 结束日期
   * @returns {Object} 统计数据
   */
  static async getRuleStatistics(ruleId, startDate, endDate) {
    const where = {
      ruleId,
      createdAt: {
        [this.sequelize.Op.between]: [startDate, endDate]
      }
    };
    
    const [total, successful, failed, helpful, notHelpful] = await Promise.all([
      this.count({ where }),
      this.count({ where: { ...where, responseStatus: 'sent' } }),
      this.count({ where: { ...where, responseStatus: 'failed' } }),
      this.count({ where: { ...where, userFeedback: 'helpful' } }),
      this.count({ where: { ...where, userFeedback: 'not_helpful' } })
    ]);
    
    return {
      total,
      successful,
      failed,
      helpful,
      notHelpful,
      helpfulRate: total > 0 ? ((helpful + notHelpful) > 0 ? (helpful / (helpful + notHelpful) * 100) : 0) : 0
    };
  }
  
  /**
   * 获取使用趋势
   * @param {string} ruleId - 规则ID
   * @param {Date} startDate - 开始日期
   * @param {Date} endDate - 结束日期
   * @param {string} interval - 时间间隔（day, week, month）
   * @returns {Array} 趋势数据
   */
  static async getUsageTrend(ruleId, startDate, endDate, interval = 'day') {
    // 这里使用Sequelize的聚合函数，根据实际的数据库和ORM版本调整
    const groupBy = interval === 'day' ? [
      this.sequelize.fn('DATE', this.sequelize.col('createdAt'))
    ] : interval === 'week' ? [
      this.sequelize.fn('DATE_TRUNC', 'week', this.sequelize.col('createdAt'))
    ] : [
      this.sequelize.fn('DATE_TRUNC', 'month', this.sequelize.col('createdAt'))
    ];
    
    const result = await this.findAll({
      attributes: [
        ...groupBy,
        [this.sequelize.fn('COUNT', '*'), 'count'],
        [this.sequelize.fn('SUM', this.sequelize.literal('CASE WHEN "userFeedback" = \'helpful\' THEN 1 ELSE 0 END')), 'helpfulCount'],
        [this.sequelize.fn('SUM', this.sequelize.literal('CASE WHEN "responseStatus" = \'failed\' THEN 1 ELSE 0 END')), 'failedCount']
      ],
      where: {
        ruleId,
        createdAt: {
          [this.sequelize.Op.between]: [startDate, endDate]
        }
      },
      group: groupBy,
      order: groupBy
    });
    
    return result.map(row => ({
      date: row.dataValues[Object.keys(row.dataValues)[0]],
      count: parseInt(row.dataValues.count),
      helpfulCount: parseInt(row.dataValues.helpfulCount || 0),
      failedCount: parseInt(row.dataValues.failedCount || 0)
    }));
  }
  
  /**
   * 转换为响应对象
   * @returns {Object} 响应对象
   */
  toResponseObject() {
    return {
      id: this.id,
      ruleId: this.ruleId,
      conversationId: this.conversationId,
      userId: this.userId,
      triggerMessage: this.triggerMessage,
      replyContent: this.replyContent,
      replyType: this.replyType,
      matchType: this.matchType,
      matchedKeywords: this.matchedKeywords,
      triggerCondition: this.triggerCondition,
      actualDelay: this.actualDelay,
      responseStatus: this.responseStatus,
      failureReason: this.failureReason,
      userFeedback: this.userFeedback,
      feedbackComment: this.feedbackComment,
      createdAt: this.createdAt,
      // 关联信息会在查询时包含
      rule: this.rule ? this.rule.toResponseObject() : null,
      user: this.user ? this.user.toSafeObject() : null
    };
  }