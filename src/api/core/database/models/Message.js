/**
 * 消息模型
 * 存储即时通讯消息数据
 */

module.exports = (sequelize, DataTypes) => {
  const Message = sequelize.define('Message', {
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
    senderId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    receiverId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('text', 'image', 'voice', 'video', 'file', 'system'),
      defaultValue: 'text'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('sending', 'sent', 'delivered', 'read', 'failed'),
      defaultValue: 'sending'
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    timestamps: true,
    tableName: 'messages',
    indexes: [
      { fields: ['conversationId'] },
      { fields: ['senderId'] },
      { fields: ['receiverId'] },
      { fields: ['createdAt'] },
      {
        fields: ['senderId', 'receiverId'],
        name: 'idx_sender_receiver'
      }
    ]
  });

  Message.associate = (models) => {
    Message.belongsTo(models.Conversation, {
      foreignKey: 'conversationId',
      as: 'conversation'
    });
  };

  return Message;
};