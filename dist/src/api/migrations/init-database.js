/**
 * 数据库初始化迁移脚本
 * 创建客服系统所需的所有数据表结构
 */

module.exports = {
  /**
   * 执行数据库迁移
   */
  async up(queryInterface, Sequelize) {
    const { INTEGER, STRING, TEXT, BOOLEAN, DATE, FLOAT, UUID, UUIDV4, ENUM } = Sequelize;
    
    // 1. 创建用户表
    await queryInterface.createTable('users', {
      id: {
        type: INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      username: {
        type: STRING(50),
        unique: true,
        allowNull: false
      },
      email: {
        type: STRING(100),
        unique: true,
        allowNull: false,
        validate: {
          isEmail: true
        }
      },
      password: {
        type: STRING(255),
        allowNull: false
      },
      firstName: {
        type: STRING(50),
        allowNull: false
      },
      lastName: {
        type: STRING(50),
        allowNull: false
      },
      role: {
        type: ENUM('admin', 'supervisor', 'agent', 'user'),
        defaultValue: 'user',
        allowNull: false
      },
      status: {
        type: ENUM('active', 'inactive', 'suspended'),
        defaultValue: 'active',
        allowNull: false
      },
      availabilityStatus: {
        type: ENUM('online', 'offline', 'away', 'busy'),
        defaultValue: 'offline'
      },
      avatar: {
        type: STRING(255)
      },
      phone: {
        type: STRING(20)
      },
      department: {
        type: STRING(50)
      },
      lastLogin: {
        type: DATE
      },
      refreshToken: {
        type: STRING(255)
      },
      tokenExpiresAt: {
        type: DATE
      },
      createdAt: {
        type: DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // 2. 创建会话表
    await queryInterface.createTable('conversations', {
      id: {
        type: INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      title: {
        type: STRING(200)
      },
      type: {
        type: ENUM('chat', 'ticket', 'call'),
        defaultValue: 'chat',
        allowNull: false
      },
      status: {
        type: ENUM('open', 'closed', 'archived'),
        defaultValue: 'open',
        allowNull: false
      },
      priority: {
        type: ENUM('low', 'medium', 'high', 'urgent'),
        defaultValue: 'medium'
      },
      createdAt: {
        type: DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      },
      closedAt: {
        type: DATE
      },
      createdByUserId: {
        type: INTEGER,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      assignedToUserId: {
        type: INTEGER,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      metadata: {
        type: Sequelize.JSON
      }
    });

    // 3. 创建消息表
    await queryInterface.createTable('messages', {
      id: {
        type: INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      content: {
        type: TEXT,
        allowNull: false
      },
      type: {
        type: ENUM('text', 'image', 'file', 'system'),
        defaultValue: 'text',
        allowNull: false
      },
      senderId: {
        type: INTEGER,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      conversationId: {
        type: INTEGER,
        references: {
          model: 'conversations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        allowNull: false
      },
      createdAt: {
        type: DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      },
      isRead: {
        type: BOOLEAN,
        defaultValue: false
      },
      attachments: {
        type: Sequelize.JSON
      },
      metadata: {
        type: Sequelize.JSON
      }
    });

    // 4. 创建标签表
    await queryInterface.createTable('tags', {
      id: {
        type: INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      name: {
        type: STRING(50),
        unique: true,
        allowNull: false
      },
      color: {
        type: STRING(7),
        defaultValue: '#007bff'
      },
      description: {
        type: STRING(200)
      },
      createdAt: {
        type: DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // 5. 创建会话标签关联表
    await queryInterface.createTable('conversation_tags', {
      id: {
        type: INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      conversationId: {
        type: INTEGER,
        references: {
          model: 'conversations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        allowNull: false
      },
      tagId: {
        type: INTEGER,
        references: {
          model: 'tags',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        allowNull: false
      },
      createdAt: {
        type: DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // 6. 创建通知表
    await queryInterface.createTable('notifications', {
      id: {
        type: INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      userId: {
        type: INTEGER,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        allowNull: false
      },
      title: {
        type: STRING(100),
        allowNull: false
      },
      content: {
        type: TEXT,
        allowNull: false
      },
      type: {
        type: ENUM('system', 'task', 'alert', 'info'),
        defaultValue: 'info'
      },
      isRead: {
        type: BOOLEAN,
        defaultValue: false
      },
      isPermanent: {
        type: BOOLEAN,
        defaultValue: false
      },
      data: {
        type: Sequelize.JSON
      },
      createdAt: {
        type: DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      },
      readAt: {
        type: DATE
      }
    });

    // 7. 创建反馈表
    await queryInterface.createTable('feedback', {
      id: {
        type: INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      userId: {
        type: INTEGER,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      conversationId: {
        type: INTEGER,
        references: {
          model: 'conversations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      rating: {
        type: INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 5
        }
      },
      content: {
        type: TEXT
      },
      feedbackType: {
        type: ENUM('service', 'product', 'system', 'suggestion'),
        defaultValue: 'service'
      },
      status: {
        type: ENUM('pending', 'processing', 'resolved', 'closed'),
        defaultValue: 'pending'
      },
      priority: {
        type: ENUM('low', 'medium', 'high'),
        defaultValue: 'medium'
      },
      response: {
        type: TEXT
      },
      respondedAt: {
        type: DATE
      },
      respondedByUserId: {
        type: INTEGER,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      createdAt: {
        type: DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // 8. 创建自动回复规则表
    await queryInterface.createTable('auto_reply_rules', {
      id: {
        type: INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      name: {
        type: STRING(100),
        allowNull: false
      },
      keywords: {
        type: Sequelize.JSON,
        allowNull: false
      },
      response: {
        type: TEXT,
        allowNull: false
      },
      matchType: {
        type: ENUM('exact', 'contains', 'regex'),
        defaultValue: 'contains',
        allowNull: false
      },
      priority: {
        type: INTEGER,
        defaultValue: 5,
        validate: {
          min: 1,
          max: 10
        }
      },
      enabled: {
        type: BOOLEAN,
        defaultValue: true
      },
      createdAt: {
        type: DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      },
      createdByUserId: {
        type: INTEGER,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      }
    });

    // 9. 创建工作时间表
    await queryInterface.createTable('work_schedules', {
      id: {
        type: INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      userId: {
        type: INTEGER,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        allowNull: false
      },
      date: {
        type: DATE,
        allowNull: false
      },
      shiftType: {
        type: ENUM('morning', 'afternoon', 'night', 'full_day'),
        defaultValue: 'full_day'
      },
      scheduledStartTime: {
        type: DATE
      },
      scheduledEndTime: {
        type: DATE
      },
      actualStartTime: {
        type: DATE
      },
      actualEndTime: {
        type: DATE
      },
      breakStartTime: {
        type: DATE
      },
      breakEndTime: {
        type: DATE
      },
      status: {
        type: ENUM('scheduled', 'completed', 'absent', 'late'),
        defaultValue: 'scheduled'
      },
      notes: {
        type: TEXT
      },
      totalWorkHours: {
        type: FLOAT
      },
      createdAt: {
        type: DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // 10. 创建工作日志表
    await queryInterface.createTable('work_logs', {
      id: {
        type: INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      userId: {
        type: INTEGER,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        allowNull: false
      },
      conversationId: {
        type: INTEGER,
        references: {
          model: 'conversations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      activityType: {
        type: ENUM('chat_response', 'ticket_assignment', 'call_answered', 'system_action'),
        allowNull: false
      },
      duration: {
        type: INTEGER // 持续时间（秒）
      },
      description: {
        type: TEXT
      },
      metadata: {
        type: Sequelize.JSON
      },
      createdAt: {
        type: DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // 11. 创建会话参与者表
    await queryInterface.createTable('conversation_participants', {
      id: {
        type: INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      conversationId: {
        type: INTEGER,
        references: {
          model: 'conversations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        allowNull: false
      },
      userId: {
        type: INTEGER,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        allowNull: false
      },
      role: {
        type: ENUM('participant', 'observer'),
        defaultValue: 'participant'
      },
      joinedAt: {
        type: DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      lastReadMessageId: {
        type: INTEGER,
        references: {
          model: 'messages',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      }
    });

    // 12. 创建消息已读状态表
    await queryInterface.createTable('message_read_status', {
      id: {
        type: INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      messageId: {
        type: INTEGER,
        references: {
          model: 'messages',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        allowNull: false
      },
      userId: {
        type: INTEGER,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        allowNull: false
      },
      readAt: {
        type: DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // 创建唯一索引确保消息-用户组合的唯一性
    await queryInterface.addIndex('message_read_status', ['messageId', 'userId'], { unique: true });
    
    // 创建各种索引以提高查询性能
    await queryInterface.addIndex('users', ['email']);
    await queryInterface.addIndex('users', ['username']);
    await queryInterface.addIndex('conversations', ['createdByUserId']);
    await queryInterface.addIndex('conversations', ['assignedToUserId']);
    await queryInterface.addIndex('conversations', ['status']);
    await queryInterface.addIndex('messages', ['conversationId']);
    await queryInterface.addIndex('messages', ['senderId']);
    await queryInterface.addIndex('notifications', ['userId']);
    await queryInterface.addIndex('notifications', ['isRead']);
    await queryInterface.addIndex('feedback', ['userId']);
    await queryInterface.addIndex('feedback', ['conversationId']);
    await queryInterface.addIndex('feedback', ['status']);
    await queryInterface.addIndex('work_schedules', ['userId']);
    await queryInterface.addIndex('work_schedules', ['date']);
    await queryInterface.addIndex('work_logs', ['userId']);
    await queryInterface.addIndex('work_logs', ['conversationId']);
    await queryInterface.addIndex('conversation_participants', ['conversationId']);
    await queryInterface.addIndex('conversation_participants', ['userId']);
  },

  /**
   * 回滚数据库迁移
   */
  async down(queryInterface) {
    // 按依赖关系逆序删除表
    await queryInterface.dropTable('message_read_status');
    await queryInterface.dropTable('conversation_participants');
    await queryInterface.dropTable('work_logs');
    await queryInterface.dropTable('work_schedules');
    await queryInterface.dropTable('auto_reply_rules');
    await queryInterface.dropTable('feedback');
    await queryInterface.dropTable('notifications');
    await queryInterface.dropTable('conversation_tags');
    await queryInterface.dropTable('tags');
    await queryInterface.dropTable('messages');
    await queryInterface.dropTable('conversations');
    await queryInterface.dropTable('users');
  }
};