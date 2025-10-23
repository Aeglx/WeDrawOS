const { DataTypes, Model } = require('sequelize');

/**
 * 标签模型
 * 用于对会话、消息进行分类和标记
 */
class Tag extends Model {
  /**
   * 初始化标签模型
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
        
        // 标签名称
        name: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: true,
          validate: {
            notEmpty: true,
            len: [1, 50]
          }
        },
        
        // 标签颜色（十六进制颜色代码）
        color: {
          type: DataTypes.STRING(7),
          allowNull: true,
          defaultValue: '#1890ff',
          validate: {
            is: /^#[0-9A-Fa-f]{6}$/
          }
        },
        
        // 标签描述
        description: {
          type: DataTypes.STRING(200),
          allowNull: true
        },
        
        // 标签类型
        type: {
          type: DataTypes.ENUM('conversation', 'message', 'assignment'),
          allowNull: false,
          defaultValue: 'conversation'
        },
        
        // 标签组（用于分类标签）
        category: {
          type: DataTypes.STRING(50),
          allowNull: true,
          defaultValue: 'default'
        },
        
        // 使用统计
        usageCount: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0
        },
        
        // 排序权重
        sortOrder: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0
        },
        
        // 状态
        isActive: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true
        },
        
        // 是否为系统标签
        isSystem: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        
        // 创建者
        createdBy: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id'
          },
          onDelete: 'SET NULL'
        },
        
        // 最后使用时间
        lastUsedAt: {
          type: DataTypes.DATE,
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
        modelName: 'Tag',
        tableName: 'tags',
        timestamps: true,
        paranoid: true,
        indexes: [
          { fields: ['name'] },
          { fields: ['type'] },
          { fields: ['category'] },
          { fields: ['isActive'] },
          { fields: ['sortOrder'] },
          { fields: ['lastUsedAt'] },
          {
            fields: ['type', 'category'],
            name: 'idx_type_category'
          },
          {
            fields: ['isActive', 'sortOrder'],
            name: 'idx_active_sort'
          }
        ]
      }
    );
  }
  
  /**
   * 关联模型
   */
  static associate(models) {
    // 关联创建者
    this.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });
    
    // 标签可以关联多个会话
    this.belongsToMany(models.Conversation, {
      through: 'conversation_tags',
      foreignKey: 'tagId',
      otherKey: 'conversationId',
      as: 'conversations'
    });
    
    // 标签可以关联多个消息
    this.belongsToMany(models.Message, {
      through: 'message_tags',
      foreignKey: 'tagId',
      otherKey: 'messageId',
      as: 'messages'
    });
    
    // 标签可以关联多个会话分配记录
    this.belongsToMany(models.ConversationAssignment, {
      through: 'assignment_tags',
      foreignKey: 'tagId',
      otherKey: 'assignmentId',
      as: 'assignments'
    });
  }
  
  /**
   * 增加使用次数
   */
  async incrementUsage() {
    this.usageCount += 1;
    this.lastUsedAt = new Date();
    await this.save();
  }
  
  /**
   * 减少使用次数
   */
  async decrementUsage() {
    if (this.usageCount > 0) {
      this.usageCount -= 1;
      await this.save();
    }
  }
  
  /**
   * 激活标签
   */
  async activate() {
    this.isActive = true;
    await this.save();
  }
  
  /**
   * 禁用标签
   */
  async deactivate() {
    // 系统标签不能禁用
    if (!this.isSystem) {
      this.isActive = false;
      await this.save();
    }
  }
  
  /**
   * 获取标签的使用统计
   * @returns {Promise<Object>} 统计数据
   */
  async getUsageStatistics() {
    const models = this.sequelize.models;
    let conversationCount = 0;
    let messageCount = 0;
    let assignmentCount = 0;
    
    try {
      if (this.type === 'conversation' || this.type === undefined) {
        conversationCount = await models.Conversation.count({
          include: [{
            model: models.Tag,
            as: 'tags',
            where: { id: this.id }
          }]
        });
      }
      
      if (this.type === 'message' || this.type === undefined) {
        messageCount = await models.Message.count({
          include: [{
            model: models.Tag,
            as: 'tags',
            where: { id: this.id }
          }]
        });
      }
      
      if (this.type === 'assignment' || this.type === undefined) {
        assignmentCount = await models.ConversationAssignment.count({
          include: [{
            model: models.Tag,
            as: 'tags',
            where: { id: this.id }
          }]
        });
      }
    } catch (error) {
      console.error('获取标签使用统计失败:', error);
    }
    
    return {
      conversationCount,
      messageCount,
      assignmentCount,
      totalCount: conversationCount + messageCount + assignmentCount
    };
  }
  
  /**
   * 创建常用系统标签
   * @param {Object} sequelize - Sequelize实例
   */
  static async createDefaultTags(sequelize) {
    const defaultTags = [
      // 会话标签
      { name: '紧急', color: '#ff4d4f', type: 'conversation', category: 'priority', isSystem: true },
      { name: '重要', color: '#fa8c16', type: 'conversation', category: 'priority', isSystem: true },
      { name: '普通', color: '#52c41a', type: 'conversation', category: 'priority', isSystem: true },
      { name: '咨询', color: '#1890ff', type: 'conversation', category: 'type', isSystem: true },
      { name: '投诉', color: '#eb2f96', type: 'conversation', category: 'type', isSystem: true },
      { name: '建议', color: '#722ed1', type: 'conversation', category: 'type', isSystem: true },
      { name: '需要跟进', color: '#faad14', type: 'conversation', category: 'status', isSystem: true },
      { name: '已解决', color: '#52c41a', type: 'conversation', category: 'status', isSystem: true },
      
      // 消息标签
      { name: '重要信息', color: '#1890ff', type: 'message', category: 'importance', isSystem: true },
      { name: '待处理', color: '#faad14', type: 'message', category: 'status', isSystem: true },
      { name: '已回复', color: '#52c41a', type: 'message', category: 'status', isSystem: true },
      
      // 分配标签
      { name: '技能不足', color: '#fa8c16', type: 'assignment', category: 'transfer', isSystem: true },
      { name: '超时处理', color: '#ff4d4f', type: 'assignment', category: 'transfer', isSystem: true },
      { name: '客户要求', color: '#722ed1', type: 'assignment', category: 'transfer', isSystem: true },
      { name: '部门转接', color: '#1890ff', type: 'assignment', category: 'transfer', isSystem: true }
    ];
    
    for (const tagData of defaultTags) {
      try {
        // 检查标签是否已存在
        const existingTag = await this.findOne({
          where: {
            name: tagData.name,
            type: tagData.type
          }
        });
        
        if (!existingTag) {
          await this.create(tagData);
        }
      } catch (error) {
        console.error(`创建默认标签 ${tagData.name} 失败:`, error);
      }
    }
  }
  
  /**
   * 转换为响应对象
   * @returns {Object} 响应对象
   */
  toResponseObject() {
    return {
      id: this.id,
      name: this.name,
      color: this.color,
      description: this.description,
      type: this.type,
      category: this.category,
      usageCount: this.usageCount,
      sortOrder: this.sortOrder,
      isActive: this.isActive,
      isSystem: this.isSystem,
      lastUsedAt: this.lastUsedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      createdBy: this.createdBy,
      // 关联信息会在查询时包含
      creator: this.creator ? this.creator.toSafeObject() : null
    };
  }
}

module.exports = Tag;