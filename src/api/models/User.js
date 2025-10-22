import { DataTypes, Model } from 'sequelize';

/**
 * 用户模型
 * 支持客服系统中的用户管理
 */
class User extends Model {
  /**
   * 初始化用户模型
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
        
        // 用户账户信息
        username: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: true,
          validate: {
            notEmpty: true,
            len: [3, 50]
          }
        },
        
        email: {
          type: DataTypes.STRING(100),
          allowNull: false,
          unique: true,
          validate: {
            notEmpty: true,
            isEmail: true
          }
        },
        
        password: {
          type: DataTypes.STRING(255),
          allowNull: false,
          validate: {
            notEmpty: true
          }
        },
        
        // 用户基本信息
        fullName: {
          type: DataTypes.STRING(100),
          allowNull: true
        },
        
        avatar: {
          type: DataTypes.STRING(255),
          allowNull: true
        },
        
        phone: {
          type: DataTypes.STRING(20),
          allowNull: true
        },
        
        // 用户角色和权限
        role: {
          type: DataTypes.ENUM('admin', 'customer_service_manager', 'customer_service', 'customer', 'participant'),
          allowNull: false,
          defaultValue: 'customer'
        },
        
        permissions: {
          type: DataTypes.ARRAY(DataTypes.STRING),
          allowNull: true,
          defaultValue: []
        },
        
        // 客服特定信息
        department: {
          type: DataTypes.STRING(50),
          allowNull: true
        },
        
        position: {
          type: DataTypes.STRING(50),
          allowNull: true
        },
        
        skills: {
          type: DataTypes.ARRAY(DataTypes.STRING),
          allowNull: true,
          defaultValue: []
        },
        
        maxConcurrentSessions: {
          type: DataTypes.INTEGER,
          allowNull: true,
          defaultValue: 10
        },
        
        // 状态信息
        status: {
          type: DataTypes.ENUM('online', 'offline', 'away', 'busy'),
          allowNull: false,
          defaultValue: 'offline'
        },
        
        lastActive: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: DataTypes.NOW
        },
        
        // 账号状态
        isActive: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true
        },
        
        isVerified: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        
        // 系统信息
        lastLogin: {
          type: DataTypes.DATE,
          allowNull: true
        },
        
        loginCount: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0
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
        modelName: 'User',
        tableName: 'users',
        timestamps: true,
        paranoid: true,
        indexes: [
          { fields: ['username'] },
          { fields: ['email'] },
          { fields: ['role'] },
          { fields: ['status'] },
          { fields: ['isActive'] },
          { fields: ['department'] },
          { fields: ['lastActive'] }
        ]
      }
    );
  }
  
  /**
   * 关联模型
   */
  static associate(models) {
    // 一个用户可以参与多个会话
    this.belongsToMany(models.Conversation, {
      through: models.ConversationParticipant,
      foreignKey: 'userId',
      as: 'conversations'
    });
    
    // 一个用户可以发送多条消息
    this.hasMany(models.Message, {
      foreignKey: 'senderId',
      as: 'sentMessages'
    });
    
    // 客服可以有多个会话分配记录
    this.hasMany(models.ConversationAssignment, {
      foreignKey: 'agentId',
      as: 'assignedConversations'
    });
    
    // 用户可以有多个自动回复规则（仅限管理员和客服经理）
    this.hasMany(models.AutoReplyRule, {
      foreignKey: 'createdBy',
      as: 'autoReplyRules'
    });
    
    // 一个用户可以有多个通知
    this.hasMany(models.Notification, {
      foreignKey: 'userId',
      as: 'notifications'
    });
    
    // 一个用户可以有多个评价记录
    this.hasMany(models.Rating, {
      foreignKey: 'userId',
      as: 'ratingsGiven'
    });
    
    // 一个用户可以被评价多次
    this.hasMany(models.Rating, {
      foreignKey: 'targetUserId',
      as: 'ratingsReceived'
    });
  }
  
  /**
   * 检查用户是否有特定角色
   * @param {string} role - 角色名称
   * @returns {boolean} 是否有该角色
   */
  hasRole(role) {
    return this.role === role;
  }
  
  /**
   * 检查用户是否有特定权限
   * @param {string} permission - 权限名称
   * @returns {boolean} 是否有该权限
   */
  hasPermission(permission) {
    // 管理员拥有所有权限
    if (this.role === 'admin') {
      return true;
    }
    
    // 客服经理拥有大部分管理权限
    if (this.role === 'customer_service_manager') {
      return true;
    }
    
    // 检查用户权限列表
    return this.permissions && this.permissions.includes(permission);
  }
  
  /**
   * 检查用户是否在线
   * @returns {boolean} 是否在线
   */
  isOnline() {
    return this.status === 'online';
  }
  
  /**
   * 检查用户是否可用于分配会话
   * @returns {boolean} 是否可分配
   */
  isAvailableForAssignment() {
    return this.isActive && 
           (this.status === 'online' || this.status === 'away') &&
           (this.role === 'customer_service' || this.role === 'customer_service_manager');
  }
  
  /**
   * 更新用户最后活跃时间
   */
  async updateLastActive() {
    this.lastActive = new Date();
    await this.save();
  }
  
  /**
   * 更新用户状态
   * @param {string} newStatus - 新状态
   */
  async updateStatus(newStatus) {
    this.status = newStatus;
    this.lastActive = new Date();
    await this.save();
  }
  
  /**
   * 增加登录次数并更新最后登录时间
   */
  async incrementLoginCount() {
    this.loginCount += 1;
    this.lastLogin = new Date();
    await this.save();
  }
  
  /**
   * 转换为安全的用户信息（不包含敏感信息）
   * @returns {Object} 安全的用户信息
   */
  toSafeObject() {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      fullName: this.fullName,
      avatar: this.avatar,
      phone: this.phone,
      role: this.role,
      department: this.department,
      position: this.position,
      status: this.status,
      lastActive: this.lastActive,
      isActive: this.isActive,
      isVerified: this.isVerified,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
  
  /**
   * 转换为JWT载荷信息
   * @returns {Object} JWT载荷
   */
  toJwtPayload() {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      role: this.role,
      permissions: this.permissions || [],
      department: this.department
    };
  }
}

export default User;