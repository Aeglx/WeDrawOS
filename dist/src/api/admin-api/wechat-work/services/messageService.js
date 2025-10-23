/**
 * 企业微信外部群消息管理服务
 * 处理企业微信外部群消息的发送和管理
 */

const logger = require('../../../core/logger');
const wechatWorkUtil = require('../../../utils/wechatWorkUtil');
const messageRepository = require('../repositories/messageRepository');

/**
 * 企业微信外部群消息管理服务类
 */
class MessageService {
  /**
   * 发送群消息
   * @param {string} chatId - 群聊ID
   * @param {Object} messageData - 消息数据
   * @returns {Promise<Object>} - 返回发送结果
   */
  async sendGroupMessage(chatId, messageData) {
    try {
      logger.info(`发送群消息，群聊ID: ${chatId}`);
      
      // 调用企业微信API发送消息
      const sendResult = await wechatWorkUtil.sendExternalGroupMessage(chatId, messageData);
      
      if (!sendResult || sendResult.errcode !== 0) {
        logger.error(`企业微信API发送消息失败，错误码: ${sendResult?.errcode || '未知'}，错误信息: ${sendResult?.errmsg || '未知'}`);
        throw new Error(`发送消息失败: ${sendResult?.errmsg || '未知错误'}`);
      }
      
      // 保存发送记录
      const recordData = {
        chat_id: chatId,
        msgid: sendResult.msgid,
        msgtype: messageData.msgtype,
        content: JSON.stringify(messageData),
        status: 'success',
        send_time: new Date()
      };
      
      const savedRecord = await messageRepository.saveMessageRecord(recordData);
      
      logger.info(`发送群消息成功，群聊ID: ${chatId}，消息ID: ${sendResult.msgid}`);
      return {
        success: true,
        msgid: sendResult.msgid,
        recordId: savedRecord.id
      };
    } catch (error) {
      logger.error(`发送群消息失败，群聊ID: ${chatId}`, error);
      
      // 保存失败记录
      try {
        const recordData = {
          chat_id: chatId,
          msgtype: messageData.msgtype,
          content: JSON.stringify(messageData),
          status: 'failed',
          error_message: error.message,
          send_time: new Date()
        };
        await messageRepository.saveMessageRecord(recordData);
      } catch (err) {
        logger.error(`保存消息失败记录失败: ${err.message}`);
      }
      
      throw error;
    }
  }

  /**
   * 批量发送群消息
   * @param {Array} groupList - 群组列表
   * @param {Object} messageData - 消息数据
   * @returns {Promise<Object>} - 返回批量发送结果
   */
  async batchSendGroupMessages(groupList, messageData) {
    try {
      logger.info(`批量发送群消息，群组数量: ${groupList.length}`);
      
      const results = {
        success: [],
        failed: []
      };
      
      // 逐个发送消息
      for (const group of groupList) {
        try {
          const result = await this.sendGroupMessage(group.chat_id, messageData);
          results.success.push({
            chat_id: group.chat_id,
            name: group.name,
            msgid: result.msgid,
            recordId: result.recordId
          });
        } catch (error) {
          logger.error(`发送消息到群组失败，群聊ID: ${group.chat_id}`, error);
          results.failed.push({
            chat_id: group.chat_id,
            name: group.name,
            error: error.message
          });
        }
      }
      
      logger.info(`批量发送群消息完成，成功: ${results.success.length}，失败: ${results.failed.length}`);
      return results;
    } catch (error) {
      logger.error('批量发送群消息失败:', error);
      throw error;
    }
  }

  /**
   * 获取群消息记录
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} - 返回消息记录和分页信息
   */
  async getGroupMessageRecords(options = {}) {
    try {
      logger.info('获取群消息记录');
      
      const result = await messageRepository.getMessageRecords(options);
      
      logger.info(`获取群消息记录成功，总数: ${result.pagination.total}，当前页: ${result.pagination.page}`);
      return result;
    } catch (error) {
      logger.error('获取群消息记录失败:', error);
      throw error;
    }
  }

  /**
   * 搜索群消息记录
   * @param {Object} options - 搜索选项
   * @returns {Promise<Object>} - 返回搜索结果和分页信息
   */
  async searchGroupMessageRecords(options = {}) {
    try {
      logger.info(`搜索群消息记录，关键词: ${options.keyword || '无'}`);
      
      const result = await messageRepository.searchMessageRecords(options);
      
      logger.info(`搜索群消息记录成功，总数: ${result.pagination.total}，当前页: ${result.pagination.page}`);
      return result;
    } catch (error) {
      logger.error('搜索群消息记录失败:', error);
      throw error;
    }
  }

  /**
   * 获取群聊天记录
   * @param {string} chatId - 群聊ID
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} - 返回聊天记录和分页信息
   */
  async getGroupChatRecords(chatId, options = {}) {
    try {
      logger.info(`获取群聊天记录，群聊ID: ${chatId}`);
      
      // 调用企业微信API获取聊天记录
      const chatRecords = await wechatWorkUtil.getGroupChatRecords(chatId, options);
      
      if (!chatRecords || chatRecords.errcode !== 0) {
        logger.error(`企业微信API获取聊天记录失败，错误码: ${chatRecords?.errcode || '未知'}，错误信息: ${chatRecords?.errmsg || '未知'}`);
        throw new Error(`获取聊天记录失败: ${chatRecords?.errmsg || '未知错误'}`);
      }
      
      // 保存聊天记录到数据库
      if (chatRecords.msg_list && chatRecords.msg_list.length > 0) {
        await messageRepository.saveChatRecords(chatId, chatRecords.msg_list);
      }
      
      logger.info(`获取群聊天记录成功，群聊ID: ${chatId}，记录数量: ${chatRecords.msg_list?.length || 0}`);
      return {
        records: chatRecords.msg_list || [],
        pagination: {
          total: chatRecords.total || 0,
          hasMore: chatRecords.has_more || false,
          nextCursor: chatRecords.next_cursor || ''
        }
      };
    } catch (error) {
      logger.error(`获取群聊天记录失败，群聊ID: ${chatId}`, error);
      throw error;
    }
  }

  /**
   * 发送文本消息
   * @param {string} chatId - 群聊ID
   * @param {string} content - 文本内容
   * @returns {Promise<Object>} - 返回发送结果
   */
  async sendTextMessage(chatId, content) {
    try {
      const messageData = {
        msgtype: 'text',
        text: {
          content
        }
      };
      
      return await this.sendGroupMessage(chatId, messageData);
    } catch (error) {
      logger.error(`发送文本消息失败，群聊ID: ${chatId}`, error);
      throw error;
    }
  }

  /**
   * 发送图片消息
   * @param {string} chatId - 群聊ID
   * @param {string} mediaId - 图片媒体ID
   * @returns {Promise<Object>} - 返回发送结果
   */
  async sendImageMessage(chatId, mediaId) {
    try {
      const messageData = {
        msgtype: 'image',
        image: {
          media_id: mediaId
        }
      };
      
      return await this.sendGroupMessage(chatId, messageData);
    } catch (error) {
      logger.error(`发送图片消息失败，群聊ID: ${chatId}`, error);
      throw error;
    }
  }

  /**
   * 发送文件消息
   * @param {string} chatId - 群聊ID
   * @param {string} mediaId - 文件媒体ID
   * @returns {Promise<Object>} - 返回发送结果
   */
  async sendFileMessage(chatId, mediaId) {
    try {
      const messageData = {
        msgtype: 'file',
        file: {
          media_id: mediaId
        }
      };
      
      return await this.sendGroupMessage(chatId, messageData);
    } catch (error) {
      logger.error(`发送文件消息失败，群聊ID: ${chatId}`, error);
      throw error;
    }
  }

  /**
   * 发送视频消息
   * @param {string} chatId - 群聊ID
   * @param {Object} videoData - 视频数据
   * @returns {Promise<Object>} - 返回发送结果
   */
  async sendVideoMessage(chatId, videoData) {
    try {
      const messageData = {
        msgtype: 'video',
        video: {
          media_id: videoData.mediaId,
          thumb_media_id: videoData.thumbMediaId,
          title: videoData.title,
          description: videoData.description
        }
      };
      
      return await this.sendGroupMessage(chatId, messageData);
    } catch (error) {
      logger.error(`发送视频消息失败，群聊ID: ${chatId}`, error);
      throw error;
    }
  }

  /**
   * 发送链接消息
   * @param {string} chatId - 群聊ID
   * @param {Object} linkData - 链接数据
   * @returns {Promise<Object>} - 返回发送结果
   */
  async sendLinkMessage(chatId, linkData) {
    try {
      const messageData = {
        msgtype: 'link',
        link: {
          title: linkData.title,
          description: linkData.description,
          url: linkData.url,
          picurl: linkData.picUrl
        }
      };
      
      return await this.sendGroupMessage(chatId, messageData);
    } catch (error) {
      logger.error(`发送链接消息失败，群聊ID: ${chatId}`, error);
      throw error;
    }
  }

  /**
   * 发送小程序消息
   * @param {string} chatId - 群聊ID
   * @param {Object} miniprogramData - 小程序数据
   * @returns {Promise<Object>} - 返回发送结果
   */
  async sendMiniprogramMessage(chatId, miniprogramData) {
    try {
      const messageData = {
        msgtype: 'miniprogram',
        miniprogram: {
          title: miniprogramData.title,
          thumb_media_id: miniprogramData.thumbMediaId,
          appid: miniprogramData.appid,
          page: miniprogramData.page
        }
      };
      
      return await this.sendGroupMessage(chatId, messageData);
    } catch (error) {
      logger.error(`发送小程序消息失败，群聊ID: ${chatId}`, error);
      throw error;
    }
  }

  /**
   * 上传媒体文件
   * @param {string} fileType - 文件类型
   * @param {string} filePath - 文件路径
   * @returns {Promise<Object>} - 返回上传结果
   */
  async uploadMedia(fileType, filePath) {
    try {
      logger.info(`上传媒体文件，类型: ${fileType}`);
      
      // 调用企业微信API上传媒体文件
      const uploadResult = await wechatWorkUtil.uploadExternalChatMedia(fileType, filePath);
      
      if (!uploadResult || uploadResult.errcode !== 0) {
        logger.error(`企业微信API上传媒体文件失败，错误码: ${uploadResult?.errcode || '未知'}，错误信息: ${uploadResult?.errmsg || '未知'}`);
        throw new Error(`上传媒体文件失败: ${uploadResult?.errmsg || '未知错误'}`);
      }
      
      logger.info(`上传媒体文件成功，媒体ID: ${uploadResult.media_id}`);
      return uploadResult;
    } catch (error) {
      logger.error(`上传媒体文件失败，类型: ${fileType}`, error);
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
      
      const statistics = await messageRepository.getMessageStatistics(options);
      
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
      
      const result = await messageRepository.batchDeleteMessageRecords(recordIds);
      
      logger.info(`批量删除消息记录成功，删除数量: ${result.deleted}`);
      return result;
    } catch (error) {
      logger.error('批量删除消息记录失败:', error);
      throw error;
    }
  }

  /**
   * 清理过期消息记录
   * @param {number} days - 保留天数
   * @returns {Promise<Object>} - 返回清理结果
   */
  async cleanupExpiredMessageRecords(days = 30) {
    try {
      logger.info(`清理过期消息记录，保留 ${days} 天`);
      
      // 计算截止日期
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const result = await messageRepository.cleanupExpiredMessageRecords(cutoffDate);
      
      logger.info(`清理过期消息记录成功，清理数量: ${result.deleted}`);
      return result;
    } catch (error) {
      logger.error('清理过期消息记录失败:', error);
      throw error;
    }
  }
}

module.exports = new MessageService();