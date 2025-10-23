/**
 * 企业微信外部群消息管理仓库
 * 处理企业微信外部群消息记录的数据持久化存储和访问
 */

const logger = require('../../../core/logger');
const db = require('../../../core/database');

/**
 * 企业微信外部群消息管理仓库类
 */
class MessageRepository {
  /**
   * 保存消息发送记录
   * @param {Object} recordData - 记录数据
   * @returns {Promise<Object>} - 返回保存后的记录
   */
  async saveMessageRecord(recordData) {
    try {
      logger.info(`保存消息发送记录，群聊ID: ${recordData.chat_id}`);
      
      const result = await db('wechat_work_message_records').insert({
        chat_id: recordData.chat_id,
        msgid: recordData.msgid,
        msgtype: recordData.msgtype,
        content: recordData.content,
        status: recordData.status,
        error_message: recordData.error_message,
        send_time: recordData.send_time,
        add_time: new Date()
      }).returning('*');
      
      logger.info(`保存消息发送记录成功，记录ID: ${result[0].id}`);
      return result[0];
    } catch (error) {
      logger.error(`保存消息发送记录失败，群聊ID: ${recordData.chat_id}`, error);
      throw error;
    }
  }

  /**
   * 保存聊天记录
   * @param {string} chatId - 群聊ID
   * @param {Array} messages - 消息列表
   * @returns {Promise<void>}
   */
  async saveChatRecords(chatId, messages) {
    try {
      logger.info(`保存聊天记录，群聊ID: ${chatId}，消息数量: ${messages.length}`);
      
      const recordData = messages.map(msg => ({
        chat_id: chatId,
        msgid: msg.msgid,
        sender: msg.sender,
        sender_type: msg.sender_type,
        msgtype: msg.msgtype,
        content: JSON.stringify(msg.msgcontent || {}),
        create_time: msg.send_time,
        add_time: new Date()
      }));
      
      // 批量插入
      if (recordData.length > 0) {
        await db('wechat_work_chat_records').insert(recordData);
      }
      
      logger.info(`保存聊天记录成功，群聊ID: ${chatId}`);
    } catch (error) {
      logger.error(`保存聊天记录失败，群聊ID: ${chatId}`, error);
      throw error;
    }
  }
  
  /**
   * 批量保存聊天记录
   * @param {Array} messages - 消息列表（每条消息应包含chat_id）
   * @returns {Promise<void>}
   */
  async batchSaveChatRecords(messages) {
    try {
      logger.info(`批量保存聊天记录，消息数量: ${messages.length}`);
      
      const recordData = messages.map(msg => ({
        chat_id: msg.chat_id,
        msgid: msg.msgid,
        sender: msg.sender,
        sender_type: msg.sender_type,
        msgtype: msg.msgtype,
        content: JSON.stringify(msg.msgcontent || {}),
        create_time: msg.send_time || msg.create_time,
        add_time: new Date()
      }));
      
      // 批量插入
      if (recordData.length > 0) {
        await db('wechat_work_chat_records').insert(recordData);
      }
      
      logger.info('批量保存聊天记录成功');
    } catch (error) {
      logger.error('批量保存聊天记录失败:', error);
      throw error;
    }
  }

  /**
   * 获取消息发送记录
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} - 返回消息记录和分页信息
   */
  async getMessageRecords(options = {}) {
    try {
      logger.info('获取消息发送记录');
      
      const query = db('wechat_work_message_records');
      
      // 添加过滤条件
      if (options.chatId) {
        query.where({ chat_id: options.chatId });
      }
      if (options.status) {
        query.where({ status: options.status });
      }
      if (options.msgType) {
        query.where({ msgtype: options.msgType });
      }
      if (options.startTime) {
        query.where('send_time', '>=', options.startTime);
      }
      if (options.endTime) {
        query.where('send_time', '<=', options.endTime);
      }
      
      // 获取总数
      const total = await query.count('id as count').first();
      
      // 添加分页
      const page = options.page || 1;
      const pageSize = options.pageSize || 20;
      const offset = (page - 1) * pageSize;
      
      const records = await query
        .offset(offset)
        .limit(pageSize)
        .orderBy('send_time', 'desc');
      
      // 解析JSON字段
      records.forEach(record => {
        try {
          record.content = JSON.parse(record.content);
        } catch (e) {
          logger.warn(`解析消息内容失败，记录ID: ${record.id}`);
        }
      });
      
      logger.info(`获取消息发送记录成功，总数: ${total.count}，当前页: ${page}`);
      return {
        records,
        pagination: {
          total: total.count,
          page,
          pageSize,
          totalPages: Math.ceil(total.count / pageSize)
        }
      };
    } catch (error) {
      logger.error('获取消息发送记录失败:', error);
      throw error;
    }
  }

  /**
   * 搜索消息记录
   * @param {Object} options - 搜索选项
   * @returns {Promise<Object>} - 返回搜索结果和分页信息
   */
  async searchMessageRecords(options = {}) {
    try {
      logger.info(`搜索消息记录，关键词: ${options.keyword || '无'}`);
      
      const query = db('wechat_work_message_records');
      
      // 添加关键词搜索
      if (options.keyword) {
        query.where('chat_id', 'LIKE', `%${options.keyword}%`)
          .orWhere('content', 'LIKE', `%${options.keyword}%`)
          .orWhere('msgtype', 'LIKE', `%${options.keyword}%`);
      }
      
      // 添加其他过滤条件
      if (options.status) {
        query.where({ status: options.status });
      }
      if (options.startTime) {
        query.where('send_time', '>=', options.startTime);
      }
      if (options.endTime) {
        query.where('send_time', '<=', options.endTime);
      }
      
      // 获取总数
      const total = await query.count('id as count').first();
      
      // 添加分页
      const page = options.page || 1;
      const pageSize = options.pageSize || 20;
      const offset = (page - 1) * pageSize;
      
      const records = await query
        .offset(offset)
        .limit(pageSize)
        .orderBy('send_time', 'desc');
      
      // 解析JSON字段
      records.forEach(record => {
        try {
          record.content = JSON.parse(record.content);
        } catch (e) {
          logger.warn(`解析消息内容失败，记录ID: ${record.id}`);
        }
      });
      
      logger.info(`搜索消息记录成功，总数: ${total.count}，当前页: ${page}`);
      return {
        records,
        pagination: {
          total: total.count,
          page,
          pageSize,
          totalPages: Math.ceil(total.count / pageSize)
        }
      };
    } catch (error) {
      logger.error('搜索消息记录失败:', error);
      throw error;
    }
  }

  /**
   * 获取聊天记录
   * @param {string} chatId - 群聊ID
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} - 返回聊天记录和分页信息
   */
  async getChatRecords(chatId, options = {}) {
    try {
      logger.info(`获取聊天记录，群聊ID: ${chatId}`);
      
      const query = db('wechat_work_chat_records').where({ chat_id: chatId });
      
      // 添加时间过滤
      if (options.startTime) {
        query.where('create_time', '>=', options.startTime);
      }
      if (options.endTime) {
        query.where('create_time', '<=', options.endTime);
      }
      if (options.sender) {
        query.where({ sender: options.sender });
      }
      if (options.msgType) {
        query.where({ msgtype: options.msgType });
      }
      
      // 获取总数
      const total = await query.count('id as count').first();
      
      // 添加分页
      const page = options.page || 1;
      const pageSize = options.pageSize || 50;
      const offset = (page - 1) * pageSize;
      
      const records = await query
        .offset(offset)
        .limit(pageSize)
        .orderBy('create_time', 'desc');
      
      // 解析JSON字段
      records.forEach(record => {
        try {
          record.content = JSON.parse(record.content);
        } catch (e) {
          logger.warn(`解析聊天记录内容失败，记录ID: ${record.id}`);
        }
      });
      
      logger.info(`获取聊天记录成功，群聊ID: ${chatId}，总数: ${total.count}`);
      return {
        records,
        pagination: {
          total: total.count,
          page,
          pageSize,
          totalPages: Math.ceil(total.count / pageSize)
        }
      };
    } catch (error) {
      logger.error(`获取聊天记录失败，群聊ID: ${chatId}`, error);
      throw error;
    }
  }

  /**
   * 获取消息发送统计
   * @param {Object} options - 统计选项
   * @returns {Promise<Object>} - 返回统计信息
   */
  async getMessageStatistics(options = {}) {
    try {
      logger.info('获取消息发送统计');
      
      const query = db('wechat_work_message_records');
      
      // 添加时间过滤
      if (options.startTime) {
        query.where('send_time', '>=', options.startTime);
      }
      if (options.endTime) {
        query.where('send_time', '<=', options.endTime);
      }
      
      // 总体统计
      const totalMessages = await query.count('id as count').first();
      const successMessages = await query.where({ status: 'success' }).count('id as count').first();
      const failedMessages = await query.where({ status: 'failed' }).count('id as count').first();
      
      // 按消息类型统计
      const typeStats = await query
        .select('msgtype')
        .count('id as count')
        .groupBy('msgtype');
      
      // 按日期统计
      const dailyStats = await query
        .select(db.raw('DATE(send_time) as date'))
        .count('id as count')
        .groupBy(db.raw('DATE(send_time)'))
        .orderBy(db.raw('DATE(send_time)'));
      
      // 按群组统计
      const groupStats = await query
        .select('chat_id')
        .count('id as count')
        .groupBy('chat_id')
        .orderBy('count', 'desc')
        .limit(10);
      
      const statistics = {
        totalMessages: totalMessages.count,
        successMessages: successMessages.count,
        failedMessages: failedMessages.count,
        successRate: totalMessages.count > 0 ? (successMessages.count / totalMessages.count * 100).toFixed(2) + '%' : '0%',
        typeDistribution: typeStats.reduce((acc, item) => {
          acc[item.msgtype] = item.count;
          return acc;
        }, {}),
        dailyTrend: dailyStats,
        topGroups: groupStats
      };
      
      logger.info('获取消息发送统计成功');
      return statistics;
    } catch (error) {
      logger.error('获取消息发送统计失败:', error);
      throw error;
    }
  }

  /**
   * 批量删除消息记录
   * @param {Array} recordIds - 记录ID数组
   * @returns {Promise<Object>} - 返回删除结果
   */
  async batchDeleteMessageRecords(recordIds) {
    try {
      logger.info(`批量删除消息记录，数量: ${recordIds.length}`);
      
      const result = await db('wechat_work_message_records')
        .whereIn('id', recordIds)
        .delete();
      
      logger.info(`批量删除消息记录成功，删除数量: ${result}`);
      return { deleted: result };
    } catch (error) {
      logger.error('批量删除消息记录失败:', error);
      throw error;
    }
  }

  /**
   * 清理过期消息记录
   * @param {Date} cutoffDate - 截止日期
   * @returns {Promise<Object>} - 返回清理结果
   */
  async cleanupExpiredMessageRecords(cutoffDate) {
    try {
      logger.info(`清理过期消息记录，截止日期: ${cutoffDate}`);
      
      const result = await db('wechat_work_message_records')
        .where('send_time', '<', cutoffDate)
        .delete();
      
      // 同时清理过期聊天记录
      const chatRecordsResult = await db('wechat_work_chat_records')
        .where('create_time', '<', cutoffDate)
        .delete();
      
      logger.info(`清理过期消息记录成功，发送记录: ${result}，聊天记录: ${chatRecordsResult}`);
      return {
        deleted: result,
        chatRecordsDeleted: chatRecordsResult
      };
    } catch (error) {
      logger.error('清理过期消息记录失败:', error);
      throw error;
    }
  }

  /**
   * 获取指定群组的消息发送历史
   * @param {string} chatId - 群聊ID
   * @param {number} limit - 限制数量
   * @returns {Promise<Array>} - 返回消息记录
   */
  async getGroupMessageHistory(chatId, limit = 50) {
    try {
      logger.info(`获取群组消息历史，群聊ID: ${chatId}，限制: ${limit}`);
      
      const records = await db('wechat_work_message_records')
        .where({ chat_id: chatId })
        .orderBy('send_time', 'desc')
        .limit(limit);
      
      // 解析JSON字段
      records.forEach(record => {
        try {
          record.content = JSON.parse(record.content);
        } catch (e) {
          logger.warn(`解析消息内容失败，记录ID: ${record.id}`);
        }
      });
      
      logger.info(`获取群组消息历史成功，群聊ID: ${chatId}，数量: ${records.length}`);
      return records;
    } catch (error) {
      logger.error(`获取群组消息历史失败，群聊ID: ${chatId}`, error);
      throw error;
    }
  }

  /**
   * 更新消息发送状态
   * @param {string} msgid - 消息ID
   * @param {string} status - 新状态
   * @param {string} errorMessage - 错误消息（可选）
   * @returns {Promise<Object>} - 返回更新结果
   */
  async updateMessageStatus(msgid, status, errorMessage = null) {
    try {
      logger.info(`更新消息发送状态，消息ID: ${msgid}，状态: ${status}`);
      
      const updateData = {
        status,
        update_time: new Date()
      };
      
      if (errorMessage) {
        updateData.error_message = errorMessage;
      }
      
      const result = await db('wechat_work_message_records')
        .where({ msgid })
        .update(updateData)
        .returning('*');
      
      if (result.length === 0) {
        throw new Error(`消息记录不存在，消息ID: ${msgid}`);
      }
      
      logger.info(`更新消息发送状态成功，消息ID: ${msgid}`);
      return result[0];
    } catch (error) {
      logger.error(`更新消息发送状态失败，消息ID: ${msgid}`, error);
      throw error;
    }
  }
}

module.exports = new MessageRepository();