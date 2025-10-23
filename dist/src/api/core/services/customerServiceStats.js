/**
 * 客服系统统计服务
 * 提供客服工作效率和会话分析统计
 */

const { logger } = require('../utils/logger');
const customerServiceDb = require('./customerServiceDb');
const { getCurrentTime, formatTimeRange } = require('../utils/dateUtils');

class CustomerServiceStats {
  constructor() {
    this.db = customerServiceDb;
    // 缓存统计数据，减少数据库查询
    this.statsCache = new Map();
    this.cacheExpiry = 60000; // 缓存过期时间：1分钟
  }

  /**
   * 清除缓存
   * @param {string} cacheKey 缓存键
   */
  clearCache(cacheKey) {
    if (cacheKey) {
      this.statsCache.delete(cacheKey);
    } else {
      this.statsCache.clear();
    }
  }

  /**
   * 生成缓存键
   * @param {Object} params 参数对象
   * @returns {string} 缓存键
   */
  generateCacheKey(params) {
    return `stats_${JSON.stringify(params)}`;
  }

  /**
   * 从缓存获取数据
   * @param {string} key 缓存键
   * @returns {Object|null} 缓存数据
   */
  getFromCache(key) {
    const cached = this.statsCache.get(key);
    if (cached && cached.timestamp + this.cacheExpiry > Date.now()) {
      return cached.data;
    }
    // 缓存过期，删除
    if (cached) {
      this.statsCache.delete(key);
    }
    return null;
  }

  /**
   * 设置缓存数据
   * @param {string} key 缓存键
   * @param {Object} data 数据
   */
  setCache(key, data) {
    this.statsCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * 获取系统概览统计
   * @param {Object} timeRange 时间范围
   * @returns {Promise<Object>} 概览统计数据
   */
  async getSystemOverview(timeRange = {}) {
    const cacheKey = this.generateCacheKey({ type: 'overview', ...timeRange });
    const cachedData = this.getFromCache(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    try {
      const { startTime, endTime } = formatTimeRange(timeRange);
      const stats = await this.db.getCustomerServiceStatistics({
        startTime,
        endTime
      });

      // 获取活跃会话数
      const activeConversations = await this.db.Conversation.count({
        where: {
          type: 'customer_service',
          status: 'active'
        }
      });

      // 获取等待中会话数
      const waitingConversations = await this.db.Conversation.count({
        where: {
          type: 'customer_service',
          status: 'active',
          metadata: {
            isWaiting: true
          }
        }
      });

      const overview = {
        ...stats,
        activeConversations,
        waitingConversations,
        timestamp: getCurrentTime()
      };

      this.setCache(cacheKey, overview);
      return overview;
    } catch (error) {
      logger.error('Failed to get system overview statistics:', error);
      throw error;
    }
  }

  /**
   * 获取客服个人统计
   * @param {string} customerServiceId 客服ID
   * @param {Object} timeRange 时间范围
   * @returns {Promise<Object>} 客服统计数据
   */
  async getCustomerServiceStats(customerServiceId, timeRange = {}) {
    const cacheKey = this.generateCacheKey({
      type: 'cs',
      id: customerServiceId,
      ...timeRange
    });
    const cachedData = this.getFromCache(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    try {
      const { startTime, endTime } = formatTimeRange(timeRange);
      const stats = await this.db.getCustomerServiceStatistics({
        startTime,
        endTime,
        customerServiceId
      });

      // 获取当前处理的会话数
      const currentConversations = await this.db.ConversationParticipant.count({
        where: {
          userId: customerServiceId,
          role: 'customer_service',
          isActive: true
        }
      });

      // 计算平均响应时间
      const avgResponseTime = await this.calculateAverageResponseTime(
        customerServiceId,
        startTime,
        endTime
      );

      // 计算用户满意度（需要假设存在评价表）
      const satisfactionRate = await this.calculateSatisfactionRate(
        customerServiceId,
        startTime,
        endTime
      );

      const csStats = {
        ...stats,
        currentConversations,
        avgResponseTime,
        satisfactionRate,
        timestamp: getCurrentTime()
      };

      this.setCache(cacheKey, csStats);
      return csStats;
    } catch (error) {
      logger.error(`Failed to get statistics for customer service ${customerServiceId}:`, error);
      throw error;
    }
  }

  /**
   * 计算平均响应时间
   * @param {string} customerServiceId 客服ID
   * @param {Date} startTime 开始时间
   * @param {Date} endTime 结束时间
   * @returns {Promise<number>} 平均响应时间（秒）
   */
  async calculateAverageResponseTime(customerServiceId, startTime, endTime) {
    try {
      // 这里简化处理，实际应该查询客服回复消息的时间间隔
      // 假设查询客服第一条消息与用户最后一条消息的时间差
      const [result] = await this.db.db.query(
        `SELECT AVG(EXTRACT(EPOCH FROM (m1.createdAt - m2.createdAt))) as avg_response_time
         FROM messages m1
         JOIN messages m2 ON m1.conversationId = m2.conversationId
         WHERE m1.senderId = :customerServiceId
         AND m2.senderId != :customerServiceId
         AND m2.createdAt > :startTime
         AND m2.createdAt <= :endTime
         AND m1.createdAt > m2.createdAt
         AND NOT EXISTS (
           SELECT 1 FROM messages m3
           WHERE m3.conversationId = m1.conversationId
           AND m3.createdAt > m2.createdAt
           AND m3.createdAt < m1.createdAt
           AND m3.senderId = :customerServiceId
         )`,
        {
          replacements: {
            customerServiceId,
            startTime,
            endTime
          },
          type: this.db.db.QueryTypes.SELECT
        }
      );

      return result?.avg_response_time || 0;
    } catch (error) {
      logger.error('Failed to calculate average response time:', error);
      return 0;
    }
  }

  /**
   * 计算用户满意度
   * @param {string} customerServiceId 客服ID
   * @param {Date} startTime 开始时间
   * @param {Date} endTime 结束时间
   * @returns {Promise<number>} 满意度比例（0-1）
   */
  async calculateSatisfactionRate(customerServiceId, startTime, endTime) {
    try {
      // 这里假设存在一个会话评价表
      // 实际项目中需要创建对应的评价模型
      // 暂时返回一个模拟值
      return 0.92; // 92%的满意度
    } catch (error) {
      logger.error('Failed to calculate satisfaction rate:', error);
      return 0.85; // 返回默认值
    }
  }

  /**
   * 获取会话趋势统计
   * @param {string} interval 时间间隔（hour, day, week）
   * @param {number} limit 数据点数量
   * @returns {Promise<Array>} 趋势数据
   */
  async getConversationTrends(interval = 'day', limit = 7) {
    const cacheKey = this.generateCacheKey({ type: 'trends', interval, limit });
    const cachedData = this.getFromCache(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    try {
      // 根据不同时间间隔生成SQL
      let dateFormat;
      switch (interval) {
        case 'hour':
          dateFormat = "DATE_TRUNC('hour', createdAt)";
          break;
        case 'week':
          dateFormat = "DATE_TRUNC('week', createdAt)";
          break;
        case 'day':
        default:
          dateFormat = "DATE_TRUNC('day', createdAt)";
          break;
      }

      const [results] = await this.db.db.query(
        `SELECT ${dateFormat} as period,
               COUNT(*) as conversation_count,
               SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed_count
         FROM conversations
         WHERE type = 'customer_service'
         GROUP BY period
         ORDER BY period DESC
         LIMIT :limit`,
        {
          replacements: { limit },
          type: this.db.db.QueryTypes.SELECT
        }
      );

      // 反转顺序，使时间从早到晚
      const trends = results.reverse();
      this.setCache(cacheKey, trends);
      return trends;
    } catch (error) {
      logger.error('Failed to get conversation trends:', error);
      throw error;
    }
  }

  /**
   * 获取消息类型统计
   * @param {Object} timeRange 时间范围
   * @returns {Promise<Object>} 消息类型统计
   */
  async getMessageTypeStats(timeRange = {}) {
    const cacheKey = this.generateCacheKey({ type: 'message_types', ...timeRange });
    const cachedData = this.getFromCache(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    try {
      const { startTime, endTime } = formatTimeRange(timeRange);
      const whereConditions = [];
      const replacements = {};

      if (startTime) {
        whereConditions.push('createdAt >= :startTime');
        replacements.startTime = startTime;
      }

      if (endTime) {
        whereConditions.push('createdAt <= :endTime');
        replacements.endTime = endTime;
      }

      const whereClause = whereConditions.length
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

      const [results] = await this.db.db.query(
        `SELECT type, COUNT(*) as count
         FROM messages
         ${whereClause}
         GROUP BY type
         ORDER BY count DESC`,
        {
          replacements,
          type: this.db.db.QueryTypes.SELECT
        }
      );

      const typeStats = {};
      results.forEach(row => {
        typeStats[row.type] = row.count;
      });

      this.setCache(cacheKey, typeStats);
      return typeStats;
    } catch (error) {
      logger.error('Failed to get message type statistics:', error);
      throw error;
    }
  }

  /**
   * 获取等待时间统计
   * @param {Object} timeRange 时间范围
   * @returns {Promise<Object>} 等待时间统计
   */
  async getWaitingTimeStats(timeRange = {}) {
    try {
      const { startTime, endTime } = formatTimeRange(timeRange);
      
      // 计算会话从创建到分配客服的平均等待时间
      const [result] = await this.db.db.query(
        `SELECT AVG(EXTRACT(EPOCH FROM (cp.joinTime - c.createdAt))) as avg_waiting_time,
               MAX(EXTRACT(EPOCH FROM (cp.joinTime - c.createdAt))) as max_waiting_time,
               MIN(EXTRACT(EPOCH FROM (cp.joinTime - c.createdAt))) as min_waiting_time
         FROM conversations c
         JOIN conversation_participants cp ON c.id = cp.conversationId
         WHERE c.type = 'customer_service'
         AND cp.role = 'customer_service'
         ${startTime ? 'AND c.createdAt >= :startTime' : ''}
         ${endTime ? 'AND c.createdAt <= :endTime' : ''}`,
        {
          replacements: { startTime, endTime },
          type: this.db.db.QueryTypes.SELECT
        }
      );

      return {
        avgWaitingTime: result?.avg_waiting_time || 0,
        maxWaitingTime: result?.max_waiting_time || 0,
        minWaitingTime: result?.min_waiting_time || 0
      };
    } catch (error) {
      logger.error('Failed to get waiting time statistics:', error);
      throw error;
    }
  }

  /**
   * 生成客服工作报表
   * @param {string} customerServiceId 客服ID
   * @param {Object} timeRange 时间范围
   * @returns {Promise<Object>} 工作报表
   */
  async generateWorkReport(customerServiceId, timeRange = {}) {
    try {
      const { startTime, endTime } = formatTimeRange(timeRange);
      
      // 获取基本统计
      const basicStats = await this.getCustomerServiceStats(customerServiceId, timeRange);
      
      // 获取会话详情
      const participatedConversations = await this.db.Conversation.findAll({
        include: [{
          model: this.db.ConversationParticipant,
          where: {
            userId: customerServiceId,
            role: 'customer_service',
            isActive: true
          }
        }],
        where: {
          createdAt: {
            ...(startTime && { [this.db.db.Sequelize.Op.gte]: startTime }),
            ...(endTime && { [this.db.db.Sequelize.Op.lte]: endTime })
          }
        }
      });
      
      // 获取消息详情
      const messages = await this.db.Message.findAll({
        where: {
          senderId: customerServiceId,
          ...(startTime && { createdAt: { [this.db.db.Sequelize.Op.gte]: startTime } }),
          ...(endTime && { createdAt: { [this.db.db.Sequelize.Op.lte]: endTime } })
        }
      });
      
      return {
        reportId: `report_${customerServiceId}_${Date.now()}`,
        customerServiceId,
        timeRange: { startTime, endTime },
        generatedAt: new Date(),
        summary: basicStats,
        conversationCount: participatedConversations.length,
        messageCount: messages.length,
        // 可以添加更多详细数据
      };
    } catch (error) {
      logger.error(`Failed to generate work report for customer service ${customerServiceId}:`, error);
      throw error;
    }
  }

  /**
   * 监控实时会话状态
   * @returns {Promise<Object>} 实时状态数据
   */
  async getRealtimeStatus() {
    try {
      // 获取当前活跃客服
      const activeCustomerServices = await this.db.ConversationParticipant.count({
        distinct: true,
        col: 'userId',
        where: {
          role: 'customer_service',
          isActive: true
        }
      });
      
      // 获取等待中的会话
      const waitingConversations = await this.db.Conversation.count({
        where: {
          type: 'customer_service',
          status: 'active',
          metadata: {
            isWaiting: true
          }
        }
      });
      
      // 获取最近5分钟的新会话数
      const recentConversations = await this.db.Conversation.count({
        where: {
          type: 'customer_service',
          createdAt: {
            [this.db.db.Sequelize.Op.gt]: new Date(Date.now() - 5 * 60 * 1000)
          }
        }
      });
      
      // 获取平均在线客服处理会话数
      const totalActiveConversations = await this.db.Conversation.count({
        where: {
          type: 'customer_service',
          status: 'active'
        }
      });
      
      const avgConversationsPerCS = activeCustomerServices > 0
        ? totalActiveConversations / activeCustomerServices
        : 0;
      
      return {
        activeCustomerServices,
        waitingConversations,
        recentConversations,
        totalActiveConversations,
        avgConversationsPerCS,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('Failed to get realtime status:', error);
      throw error;
    }
  }
}

module.exports = new CustomerServiceStats();