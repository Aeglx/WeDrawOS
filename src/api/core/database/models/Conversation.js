/**
 * 会话模型
 * 存储即时通讯会话数据
 */

module.exports = (sequelize, DataTypes) => {
  const Conversation = sequelize.define('Conversation', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    type: {
      type: DataTypes.ENUM('private', 'group', 'customer_service'),
      defaultValue: 'private'
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    avatar: {
      type: DataTypes.STRING(512),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('active', 'archived', 'closed'),
      defaultValue: 'active'
    },
    lastMessageId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Messages',
        key: 'id'
      }
    },
    lastMessageAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    unreadCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    timestamps: true,
    tableName: 'conversations',
    indexes: [
      { fields: ['type'] },
      { fields: ['status'] },
      { fields: ['lastMessageAt'] }
    ]
  });

  Conversation.associate = (models) => {
    Conversation.hasMany(models.Message, {
      foreignKey: 'conversationId',
      as: 'messages'
    });
    Conversation.hasMany(models.ConversationParticipant, {
      foreignKey: 'conversationId',
      as: 'participants'
    });
    Conversation.belongsTo(models.Message, {
      foreignKey: 'lastMessageId',
      as: 'lastMessage'
    });
  };

  return Conversation;
};