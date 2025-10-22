/**
 * 会话参与者模型
 * 管理会话和用户之间的关联关系
 */

module.exports = (sequelize, DataTypes) => {
  const ConversationParticipant = sequelize.define('ConversationParticipant', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    conversationId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Conversations',
        key: 'id'
      }
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('admin', 'participant', 'customer_service', 'customer'),
      defaultValue: 'participant'
    },
    lastReadMessageId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Messages',
        key: 'id'
      }
    },
    joinTime: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    leaveTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    timestamps: false,
    tableName: 'conversation_participants',
    indexes: [
      { fields: ['conversationId'] },
      { fields: ['userId'] },
      {
        fields: ['conversationId', 'userId'],
        unique: true,
        name: 'idx_conversation_user_unique'
      },
      { fields: ['isActive'] }
    ]
  });

  ConversationParticipant.associate = (models) => {
    ConversationParticipant.belongsTo(models.Conversation, {
      foreignKey: 'conversationId',
      as: 'conversation'
    });
    ConversationParticipant.belongsTo(models.Message, {
      foreignKey: 'lastReadMessageId',
      as: 'lastReadMessage'
    });
  };

  return ConversationParticipant;
};