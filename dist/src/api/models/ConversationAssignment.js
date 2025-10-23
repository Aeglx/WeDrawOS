import { DataTypes, Model } from 'sequelize';

/**
 * 会话分配模型
 * 记录客服人员和会话之间的分配关系
 */
class ConversationAssignment extends Model {
  /**
   * 初始化会话分配模型
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
        
        agentId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          },
          onDelete: 'CASCADE'
        },
        
        // 分配状态
        status: {
          type: DataTypes.ENUM('active', 'completed', 'transferred', 'abandoned'),
          allowNull: false,
          defaultValue: 'active'
        },
        
        // 分配方式
        assignmentType: {
          type: DataTypes.ENUM('auto', 'manual', 'transfer'),
          allowNull: false,
          defaultValue: 'auto'
        },
        
        // 分配者信息（如果是手动分配）
        assignedBy: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id'
          },
          onDelete: 'SET NULL'
        },
        
        // 转移信息
        transferredFrom: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id'
          },
          onDelete: 'SET NULL'
        },
        
        transferredTo: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id'
          },
          onDelete: 'SET NULL'
        },
        
        transferReason: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        
        // 时间信息
        assignedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW
        },
        
        acceptedAt: {
          type: DataTypes.DATE,
          allowNull: true
        },
        
        completedAt: {
          type: DataTypes.DATE,
          allowNull: true
        },
        
        transferredAt: {
          type: DataTypes.DATE,
          allowNull: true
        },
        
        // 工作时间统计
        handlingTime: {
          type: DataTypes.INTEGER,
          allowNull: true,
          comment: '处理时长（秒）'
        },
        
        // 满意度信息
        satisfactionScore: {
          type: DataTypes.INTEGER,
          allowNull: true,
          validate: {
            min: 1,
            max: 5
          },
          comment: '满意度评分（1-5）'
        },
        
        feedback: {
          type: DataTypes.TEXT,
          allowNull: true,
          comment: '客户反馈'
        },
        
        // 备注
        notes: {
          type: DataTypes.TEXT,
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
        modelName: 'ConversationAssignment',
        tableName: 'conversation_assignments',
        timestamps: true,
        paranoid: true,
        indexes: [
          { fields: ['conversationId'] },
          { fields: ['agentId'] },
          { fields: ['status'] },
          { fields: ['assignmentType'] },
          { fields: ['assignedAt'] },
          { fields: ['completedAt'] },
          { fields: ['transferredAt'] },
          {
            fields: ['agentId', 'status'],
            name: 'idx_agent_status'
          },
          {
            fields: ['conversationId', 'status'],
            name: 'idx_conversation_status'
          }
        ]
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
    
    // 关联客服
    this.belongsTo(models.User, {
      foreignKey: 'agentId',
      as: 'agent'
    });
    
    // 关联分配者
    this.belongsTo(models.User, {
      foreignKey: 'assignedBy',
      as: 'assigner'
    });
    
    // 关联转移来源
    this.belongsTo(models.User, {
      foreignKey: 'transferredFrom',
      as: 'transferSource'
    });
    
    // 关联转移目标
    this.belongsTo(models.User, {
      foreignKey: 'transferredTo',
      as: 'transferTarget'
    });
    
    // 一个分配记录可以有多个消息
    this.hasMany(models.Message, {
      foreignKey: 'assignmentId',
      as: 'messages'
    });
    
    // 一个分配记录可以有多个标签
    this.belongsToMany(models.Tag, {
      through: 'assignment_tags',
      foreignKey: 'assignmentId',
      otherKey: 'tagId',
      as: 'tags'
    });
  }
  
  /**
   * 接受分配
   */
  async accept() {
    if (this.status === 'active' && !this.acceptedAt) {
      this.acceptedAt = new Date();
      await this.save();
    }
  }
  
  /**
   * 完成分配
   * @param {Object} options - 完成选项
   * @param {number} options.score - 满意度评分
   * @param {string} options.feedback - 客户反馈
   * @param {string} options.notes - 备注
   */
  async complete(options = {}) {
    if (this.status === 'active') {
      this.status = 'completed';
      this.completedAt = new Date();
      
      // 计算处理时长
      if (this.acceptedAt) {
        this.handlingTime = Math.floor((this.completedAt - this.acceptedAt) / 1000);
      }
      
      // 设置满意度信息
      if (options.score !== undefined) {
        this.satisfactionScore = options.score;
      }
      
      if (options.feedback) {
        this.feedback = options.feedback;
      }
      
      if (options.notes) {
        this.notes = options.notes;
      }
      
      await this.save();
    }
  }
  
  /**
   * 转移分配
   * @param {string} targetAgentId - 目标客服ID
   * @param {string} reason - 转移原因
   * @param {string} transferredBy - 转移操作者ID
   */
  async transfer(targetAgentId, reason, transferredBy) {
    if (this.status === 'active') {
      this.status = 'transferred';
      this.transferredAt = new Date();
      this.transferredTo = targetAgentId;
      this.transferReason = reason;
      
      // 需要创建新的分配记录
      const models = this.sequelize.models;
      const newAssignment = await models.ConversationAssignment.create({
        conversationId: this.conversationId,
        agentId: targetAgentId,
        status: 'active',
        assignmentType: 'transfer',
        assignedBy: transferredBy,
        transferredFrom: this.agentId,
        assignedAt: new Date()
      });
      
      await this.save();
      return newAssignment;
    }
  }
  
  /**
   * 放弃分配
   * @param {string} reason - 放弃原因
   */
  async abandon(reason) {
    if (this.status === 'active') {
      this.status = 'abandoned';
      this.notes = reason;
      await this.save();
    }
  }
  
  /**
   * 获取当前活跃的分配
   * @param {string} conversationId - 会话ID
   * @returns {ConversationAssignment|null} 活跃的分配记录
   */
  static async getActiveAssignment(conversationId) {
    return await this.findOne({
      where: {
        conversationId,
        status: 'active'
      },
      order: [['assignedAt', 'DESC']]
    });
  }
  
  /**
   * 获取客服的活跃会话数
   * @param {string} agentId - 客服ID
   * @returns {number} 活跃会话数
   */
  static async getActiveConversationCount(agentId) {
    return await this.count({
      where: {
        agentId,
        status: 'active'
      }
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
      agentId: this.agentId,
      status: this.status,
      assignmentType: this.assignmentType,
      assignedBy: this.assignedBy,
      assignedAt: this.assignedAt,
      acceptedAt: this.acceptedAt,
      completedAt: this.completedAt,
      handlingTime: this.handlingTime,
      satisfactionScore: this.satisfactionScore,
      feedback: this.feedback,
      notes: this.notes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      // 关联信息会在查询时包含
      agent: this.agent ? this.agent.toSafeObject() : null,
      conversation: this.conversation ? this.conversation.toResponseObject() : null
    };
  }