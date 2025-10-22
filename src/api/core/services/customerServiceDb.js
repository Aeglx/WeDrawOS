/**
 * 客服系统数据库服务
 * 提供客服会话和消息的数据库操作
 */

const { logger } = require('../utils/logger');
const db = require('../database/database');
const { Message, Conversation, ConversationParticipant } = db.models;

class CustomerServiceDb {
  constructor() {
    this.db = db;
    this.Message = Message;
    this.Conversation = Conversation;
    this.ConversationParticipant = ConversationParticipant;
  }

  /**
   * 创建客服会话
   * @param {Object} conversationData 会话数据
   * @param {Array} participants 参与者列表
   * @returns {Promise<Object>} 创建的会话
   */
  async createCustomerServiceConversation(conversationData, participants) {
    const transaction = await this.db.transaction();
    try {
      const conversation = await this.Conversation.create(
        {
          ...conversationData,
          type: 'customer_service',
          status: 'active'
        },
        { transaction }
      );

      // 创建参与者记录
      const participantRecords = participants.map(user => ({
        conversationId: conversation.id,
        userId: user.id,
        role: user.role || 'customer',
        joinTime: new Date()
      }));

      await this.ConversationParticipant.bulkCreate(participantRecords, {
        transaction
      });

      await transaction.commit();
      logger.info(`Created customer service conversation: ${conversation.id}`);
      return conversation;
    } catch (error) {
      await transaction.rollback();
      logger.error('Failed to create customer service conversation:', error);
      throw error;
    }
  }

  /**
   * 获取会话列表
   * @param {Object} filters 过滤条件
   * @param {Object} pagination 分页参数
   * @returns {Promise<Array>} 会话列表
   */
  async getConversations(filters = {}, pagination = {}) {
    const {
      type,
      status,
      userId,
      startTime,
      endTime
    } = filters;

    const {
      page = 1,
      pageSize = 20,
      orderBy = 'lastMessageAt',
      orderDirection = 'DESC'
    } = pagination;

    const offset = (page - 1) * pageSize;
    const limit = pageSize;

    const whereCondition = {};
    const include = [];

    if (type) {
      whereCondition.type = type;
    }

    if (status) {
      whereCondition.status = status;
    }

    if (startTime) {
      whereCondition.createdAt = {
        ...whereCondition.createdAt,
        [this.db.Sequelize.Op.gte]: new Date(startTime)
      };
    }

    if (endTime) {
      whereCondition.createdAt = {
        ...whereCondition.createdAt,
        [this.db.Sequelize.Op.lte]: new Date(endTime)
      };
    }

    if (userId) {
      include.push({
        model: this.ConversationParticipant,
        where: { userId, isActive: true },
        attributes: ['role', 'joinTime']
      });
    }

    // 包含最新消息和参与者信息
    include.push(
      {
        model: this.Message,
        as: 'lastMessage',
        attributes: ['id', 'content', 'senderId', 'createdAt']
      }
    );

    try {
      const { count, rows } = await this.Conversation.findAndCountAll({
        where: whereCondition,
        include,
        offset,
        limit,
        order: [[orderBy, orderDirection]],
        distinct: true
      });

      return {
        total: count,
        page,
        pageSize,
        totalPages: Math.ceil(count / pageSize),
        data: rows
      };
    } catch (error) {
      logger.error('Failed to get conversations:', error);
      throw error;
    }
  }

  /**
   * 获取会话详情
   * @param {string} conversationId 会话ID
   * @returns {Promise<Object>} 会话详情
   */
  async getConversationById(conversationId) {
    try {
      const conversation = await this.Conversation.findByPk(conversationId, {
        include: [
          {
            model: this.ConversationParticipant,
            as: 'participants',
            where: { isActive: true },
            required: false
          },
          {
            model: this.Message,
            as: 'lastMessage'
          }
        ]
      });

      if (!conversation) {
        throw new Error(`Conversation ${conversationId} not found`);
      }

      return conversation;
    } catch (error) {
      logger.error(`Failed to get conversation ${conversationId}:`, error);
      throw error;
    }
  }

  /**
   * 更新会话状态
   * @param {string} conversationId 会话ID
   * @param {string} status 新状态
   * @param {Object} metadata 额外数据
   * @returns {Promise<Object>} 更新后的会话
   */
  async updateConversationStatus(conversationId, status, metadata = {}) {
    try {
      const conversation = await this.Conversation.findByPk(conversationId);
      if (!conversation) {
        throw new Error(`Conversation ${conversationId} not found`);
      }

      await conversation.update({
        status,
        metadata: {
          ...conversation.metadata,
          ...metadata
        }
      });

      logger.info(`Updated conversation ${conversationId} status to ${status}`);
      return conversation;
    } catch (error) {
      logger.error(`Failed to update conversation ${conversationId} status:`, error);
      throw error;
    }
  }

  /**
   * 获取会话消息
   * @param {string} conversationId 会话ID
   * @param {Object} pagination 分页参数
   * @returns {Promise<Object>} 消息列表
   */
  async getConversationMessages(conversationId, pagination = {}) {
    const {
      page = 1,
      pageSize = 50,
      orderBy = 'createdAt',
      orderDirection = 'ASC'
    } = pagination;

    const offset = (page - 1) * pageSize;
    const limit = pageSize;

    try {
      const { count, rows } = await this.Message.findAndCountAll({
        where: { conversationId },
        order: [[orderBy, orderDirection]],
        offset,
        limit
      });

      return {
        total: count,
        page,
        pageSize,
        totalPages: Math.ceil(count / pageSize),
        data: rows
      };
    } catch (error) {
      logger.error(`Failed to get messages for conversation ${conversationId}:`, error);
      throw error;
    }
  }

  /**
   * 创建消息
   * @param {Object} messageData 消息数据
   * @returns {Promise<Object>} 创建的消息
   */
  async createMessage(messageData) {
    const transaction = await this.db.transaction();
    try {
      const message = await this.Message.create(messageData, { transaction });

      // 更新会话的最后消息信息
      await this.Conversation.update(
        {
          lastMessageId: message.id,
          lastMessageAt: message.createdAt,
          unreadCount: this.db.Sequelize.literal('unreadCount + 1')
        },
        {
          where: { id: message.conversationId },
          transaction
        }
      );

      await transaction.commit();
      logger.info(`Created message: ${message.id} in conversation: ${message.conversationId}`);
      return message;
    } catch (error) {
      await transaction.rollback();
      logger.error('Failed to create message:', error);
      throw error;
    }
  }

  /**
   * 更新消息状态
   * @param {string} messageId 消息ID
   * @param {string} status 新状态
   * @returns {Promise<Object>} 更新后的消息
   */
  async updateMessageStatus(messageId, status) {
    try {
      const message = await this.Message.findByPk(messageId);
      if (!message) {
        throw new Error(`Message ${messageId} not found`);
      }

      await message.update({ status });
      logger.info(`Updated message ${messageId} status to ${status}`);
      return message;
    } catch (error) {
      logger.error(`Failed to update message ${messageId} status:`, error);
      throw error;
    }
  }

  /**
   * 标记消息为已读
   * @param {string} conversationId 会话ID
   * @param {string} userId 用户ID
   * @param {string} lastReadMessageId 最后已读消息ID
   * @returns {Promise<void>}
   */
  async markMessagesAsRead(conversationId, userId, lastReadMessageId) {
    const transaction = await this.db.transaction();
    try {
      // 更新会话参与者的最后已读消息
      await this.ConversationParticipant.update(
        {
          lastReadMessageId,
          leaveTime: null,
          isActive: true
        },
        {
          where: { conversationId, userId },
          transaction
        }
      );

      // 标记该用户在会话中的消息为已读
      await this.Message.update(
        { isRead: true, readAt: new Date() },
        {
          where: {
            conversationId,
            receiverId: userId,
            status: { [this.db.Sequelize.Op.not]: 'failed' },
            id: { [this.db.Sequelize.Op.lte]: lastReadMessageId }
          },
          transaction
        }
      );

      // 重置会话未读计数
      await this.Conversation.update(
        { unreadCount: 0 },
        {
          where: { id: conversationId },
          transaction
        }
      );

      await transaction.commit();
      logger.info(`Marked messages as read for user ${userId} in conversation ${conversationId}`);
    } catch (error) {
      await transaction.rollback();
      logger.error(`Failed to mark messages as read for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * 获取用户参与的会话
   * @param {string} userId 用户ID
   * @param {Object} filters 过滤条件
   * @param {Object} pagination 分页参数
   * @returns {Promise<Object>} 会话列表
   */
  async getUserConversations(userId, filters = {}, pagination = {}) {
    return this.getConversations(
      {
        ...filters,
        userId
      },
      pagination
    );
  }

  /**
   * 添加用户到会话
   * @param {string} conversationId 会话ID
   * @param {string} userId 用户ID
   * @param {string} role 角色
   * @returns {Promise<Object>} 参与者记录
   */
  async addUserToConversation(conversationId, userId, role = 'participant') {
    try {
      // 检查是否已经是参与者
      let participant = await this.ConversationParticipant.findOne({
        where: { conversationId, userId }
      });

      if (participant) {
        // 如果已存在，激活并更新角色
        await participant.update({
          role,
          leaveTime: null,
          isActive: true
        });
      } else {
        // 否则创建新的参与者记录
        participant = await this.ConversationParticipant.create({
          conversationId,
          userId,
          role,
          joinTime: new Date()
        });
      }

      logger.info(`Added user ${userId} to conversation ${conversationId} with role ${role}`);
      return participant;
    } catch (error) {
      logger.error(`Failed to add user ${userId} to conversation ${conversationId}:`, error);
      throw error;
    }
  }

  /**
   * 从会话中移除用户
   * @param {string} conversationId 会话ID
   * @param {string} userId 用户ID
   * @returns {Promise<void>}
   */
  async removeUserFromConversation(conversationId, userId) {
    try {
      await this.ConversationParticipant.update(
        {
          leaveTime: new Date(),
          isActive: false
        },
        {
          where: { conversationId, userId }
        }
      );

      logger.info(`Removed user ${userId} from conversation ${conversationId}`);
    } catch (error) {
      logger.error(`Failed to remove user ${userId} from conversation ${conversationId}:`, error);
      throw error;
    }
  }

  /**
   * 获取客服统计数据
   * @param {Object} filters 过滤条件
   * @returns {Promise<Object>} 统计数据
   */
  async getCustomerServiceStatistics(filters = {}) {
    const {
      startTime,
      endTime,
      customerServiceId
    } = filters;

    try {
      const whereClause = {};

      if (startTime) {
        whereClause.createdAt = {
          ...whereClause.createdAt,
          [this.db.Sequelize.Op.gte]: new Date(startTime)
        };
      }

      if (endTime) {
        whereClause.createdAt = {
          ...whereClause.createdAt,
          [this.db.Sequelize.Op.lte]: new Date(endTime)
        };
      }

      // 统计对话数
      const conversationCount = await this.Conversation.count({
        where: {
          ...whereClause,
          type: 'customer_service'
        }
      });

      // 统计消息数
      const messageCount = await this.Message.count({
        where: whereClause
      });

      // 统计未读消息数
      const unreadMessageCount = await this.Message.count({
        where: {
          ...whereClause,
          isRead: false
        }
      });

      // 如果指定了客服ID，获取该客服的统计
      if (customerServiceId) {
        const csWhereClause = {
          userId: customerServiceId,
          role: 'customer_service',
          isActive: true
        };

        const csParticipations = await this.ConversationParticipant.findAll({
          where: csWhereClause,
          attributes: ['conversationId']
        });

        const conversationIds = csParticipations.map(p => p.conversationId);

        const csMessageCount = await this.Message.count({
          where: {
            ...whereClause,
            senderId: customerServiceId
          }
        });

        return {
          conversationCount,
          messageCount,
          unreadMessageCount,
          csConversationCount: conversationIds.length,
          csMessageCount
        };
      }

      return {
        conversationCount,
        messageCount,
        unreadMessageCount
      };
    } catch (error) {
      logger.error('Failed to get customer service statistics:', error);
      throw error;
    }
  }

  /**
   * 检查用户是否是会话参与者
   * @param {string} conversationId 会话ID
   * @param {string} userId 用户ID
   * @returns {Promise<boolean>}
   */
  async isUserInConversation(conversationId, userId) {
    try {
      const participant = await this.ConversationParticipant.findOne({
        where: { conversationId, userId, isActive: true }
      });
      return !!participant;
    } catch (error) {
      logger.error(`Failed to check if user ${userId} is in conversation ${conversationId}:`, error);
      return false;
    }
  }

  /**
   * 获取用户在会话中的角色
   * @param {string} conversationId 会话ID
   * @param {string} userId 用户ID
   * @returns {Promise<string|null>}
   */
  async getUserRoleInConversation(conversationId, userId) {
    try {
      const participant = await this.ConversationParticipant.findOne({
        where: { conversationId, userId, isActive: true }
      });
      return participant ? participant.role : null;
    } catch (error) {
      logger.error(`Failed to get role for user ${userId} in conversation ${conversationId}:`, error);
      return null;
    }
  }
}

module.exports = new CustomerServiceDb();