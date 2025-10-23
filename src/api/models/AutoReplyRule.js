const { DataTypes, Model } = require('sequelize');

/**
 * 自动回复规则模型
 * 管理客服系统的自动回复规则
 */
class AutoReplyRule extends Model {
  /**
   * 初始化自动回复规则模型
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
        
        // 规则基本信息
        name: {
          type: DataTypes.STRING(100),
          allowNull: false,
          validate: {
            notEmpty: true,
            len: [1, 100]
          }
        },
        
        // 关键词配置
        keywords: {
          type: DataTypes.ARRAY(DataTypes.STRING),
          allowNull: false,
          defaultValue: [],
          validate: {
            min: 1
          }
        },
        
        // 匹配类型
        matchType: {
          type: DataTypes.ENUM('any', 'all', 'exact', 'regex'),
          allowNull: false,
          defaultValue: 'any'
        },
        
        // 回复内容
        replyContent: {
          type: DataTypes.TEXT,
          allowNull: false,
          validate: {
            notEmpty: true
          }
        },
        
        // 回复类型
        replyType: {
          type: DataTypes.ENUM('text', 'rich', 'image', 'file'),
          allowNull: false,
          defaultValue: 'text'
        },
        
        // 优先级（1-10，10最高）
        priority: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 5,
          validate: {
            min: 1,
            max: 10
          }
        },
        
        // 延迟回复（毫秒）
        delay: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
          validate: {
            min: 0
          }
        },
        
        // 触发条件
        triggerCondition: {
          type: DataTypes.ENUM('immediate', 'no_response', 'session_start'),
          allowNull: false,
          defaultValue: 'immediate'
        },
        
        // 无响应触发的时间阈值（秒）
        noResponseTimeout: {
          type: DataTypes.INTEGER,
          allowNull: true,
          validate: {
            min: 1
          },
          defaultValue: 60
        },
        
        // 应用场景
        applicationScope: {
          type: DataTypes.ENUM('all', 'new_session', 'specific_department', 'specific_agent'),
          allowNull: false,
          defaultValue: 'all'
        },
        
        // 适用部门（如果applicationScope为specific_department）
        applicableDepartments: {
          type: DataTypes.ARRAY(DataTypes.STRING),
          allowNull: true,
          defaultValue: []
        },
        
        // 适用客服（如果applicationScope为specific_agent）
        applicableAgents: {
          type: DataTypes.ARRAY(DataTypes.UUID),
          allowNull: true,
          defaultValue: []
        },
        
        // 状态
        status: {
          type: DataTypes.ENUM('active', 'inactive'),
          allowNull: false,
          defaultValue: 'active'
        },
        
        // 使用统计
        usageCount: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0
        },
        
        lastUsedAt: {
          type: DataTypes.DATE,
          allowNull: true
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
        
        // 更新者
        updatedBy: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id'
          },
          onDelete: 'SET NULL'
        },
        
        // 备注
        description: {
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
        modelName: 'AutoReplyRule',
        tableName: 'auto_reply_rules',
        timestamps: true,
        paranoid: true,
        indexes: [
          { fields: ['name'] },
          { fields: ['status'] },
          { fields: ['priority'] },
          { fields: ['createdBy'] },
          { fields: ['lastUsedAt'] },
          {
            fields: ['status', 'priority'],
            name: 'idx_status_priority'
          },
          // GIN索引用于数组查询
          {
            fields: ['keywords'],
            using: 'GIN',
            name: 'idx_keywords_gin'
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
    
    // 关联更新者
    this.belongsTo(models.User, {
      foreignKey: 'updatedBy',
      as: 'updater'
    });
    
    // 一个规则可以有多个使用记录
    this.hasMany(models.AutoReplyLog, {
      foreignKey: 'ruleId',
      as: 'usageLogs'
    });
  }
  
  /**
   * 检查消息是否匹配此规则
   * @param {string} message - 消息内容
   * @returns {boolean} 是否匹配
   */
  matches(message) {
    if (!message || this.status !== 'active') {
      return false;
    }
    
    const lowerMessage = message.toLowerCase();
    
    switch (this.matchType) {
      case 'any':
        // 匹配任一关键词
        return this.keywords.some(keyword => 
          lowerMessage.includes(keyword.toLowerCase())
        );
        
      case 'all':
        // 匹配所有关键词
        return this.keywords.every(keyword => 
          lowerMessage.includes(keyword.toLowerCase())
        );
        
      case 'exact':
        // 完全匹配（任何一个关键词）
        return this.keywords.some(keyword => 
          lowerMessage.trim() === keyword.toLowerCase().trim()
        );
        
      case 'regex':
        // 正则表达式匹配
        return this.keywords.some(keyword => {
          try {
            const regex = new RegExp(keyword, 'i');
            return regex.test(lowerMessage);
          } catch (error) {
            console.error('正则表达式错误:', error);
            return false;
          }
        });
        
      default:
        return false;
    }
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
   * 启用规则
   */
  async activate() {
    this.status = 'active';
    await this.save();
  }
  
  /**
   * 禁用规则
   */
  async deactivate() {
    this.status = 'inactive';
    await this.save();
  }
  
  /**
   * 切换规则状态
   */
  async toggleStatus() {
    this.status = this.status === 'active' ? 'inactive' : 'active';
    await this.save();
  }
  
  /**
   * 查找匹配的规则
   * @param {string} message - 消息内容
   * @param {Object} options - 查询选项
   * @returns {Array<AutoReplyRule>} 匹配的规则列表
   */
  static async findMatchingRules(message, options = {}) {
    const { department, agentId } = options;
    
    const query = {
      where: {
        status: 'active'
      },
      order: [['priority', 'DESC'], ['createdAt', 'DESC']]
    };
    
    // 按应用场景过滤
    const scopeConditions = [];
    scopeConditions.push({ applicationScope: 'all' });
    scopeConditions.push({ applicationScope: 'new_session' });
    
    if (department) {
      scopeConditions.push({
        applicationScope: 'specific_department',
        applicableDepartments: { [this.sequelize.Op.contains]: [department] }
      });
    }
    
    if (agentId) {
      scopeConditions.push({
        applicationScope: 'specific_agent',
        applicableAgents: { [this.sequelize.Op.contains]: [agentId] }
      });
    }
    
    query.where[this.sequelize.Op.or] = scopeConditions;
    
    const rules = await this.findAll(query);
    
    // 过滤出真正匹配的规则
    return rules.filter(rule => rule.matches(message));
  }
  
  /**
   * 获取最匹配的规则
   * @param {string} message - 消息内容
   * @param {Object} options - 查询选项
   * @returns {AutoReplyRule|null} 最匹配的规则
   */
  static async findBestMatchingRule(message, options = {}) {
    const matchingRules = await this.findMatchingRules(message, options);
    return matchingRules.length > 0 ? matchingRules[0] : null;
  }
  
  /**
   * 转换为响应对象
   * @returns {Object} 响应对象
   */
  toResponseObject() {
    return {
      id: this.id,
      name: this.name,
      keywords: this.keywords,
      matchType: this.matchType,
      replyContent: this.replyContent,
      replyType: this.replyType,
      priority: this.priority,
      delay: this.delay,
      triggerCondition: this.triggerCondition,
      noResponseTimeout: this.noResponseTimeout,
      applicationScope: this.applicationScope,
      applicableDepartments: this.applicableDepartments,
      applicableAgents: this.applicableAgents,
      status: this.status,
      usageCount: this.usageCount,
      lastUsedAt: this.lastUsedAt,
      description: this.description,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      createdBy: this.createdBy,
      updatedBy: this.updatedBy,
      // 关联信息会在查询时包含
      creator: this.creator ? this.creator.toSafeObject() : null
    };
  }
}

module.exports = AutoReplyRule;