/**
 * 企业微信外部群管理服务
 * 实现企业微信外部群的管理和消息发送的业务逻辑
 */

const logger = require('../../../core/logger');
const groupRepository = require('../repositories/groupRepository');
const wechatWorkUtil = require('../utils/wechatWorkUtil');
const messageRepository = require('../repositories/messageRepository');

/**
 * 企业微信外部群管理服务类
 */
class GroupService {
  /**
   * 获取外部群列表
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} - 返回群组列表和分页信息
   */
  async getGroupList(options = {}) {
    try {
      logger.info('获取外部群列表');
      
      // 先从企业微信API获取最新的外部群列表
      const apiGroups = await wechatWorkUtil.getExternalGroupList();
      
      // 同步到本地数据库
      await this.syncGroupsToLocal(apiGroups);
      
      // 从本地数据库查询，支持分页和关键词搜索
      const result = await groupRepository.getGroups({
        page: options.page || 1,
        pageSize: options.pageSize || 20,
        keyword: options.keyword
      });
      
      return result;
    } catch (error) {
      logger.error('获取外部群列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取外部群详情
   * @param {string} chatId - 群聊ID
   * @returns {Promise<Object>} - 返回群聊详情
   */
  async getGroupDetail(chatId) {
    try {
      logger.info(`获取外部群详情，群聊ID: ${chatId}`);
      
      // 从企业微信API获取最新的群详情
      const groupDetail = await wechatWorkUtil.getExternalGroupDetail(chatId);
      
      // 更新本地数据库
      await groupRepository.updateGroupDetail(chatId, groupDetail);
      
      return groupDetail;
    } catch (error) {
      logger.error(`获取外部群详情失败，群聊ID: ${chatId}`, error);
      throw error;
    }
  }

  /**
   * 获取外部群成员列表
   * @param {string} chatId - 群聊ID
   * @returns {Promise<Array>} - 返回群成员列表
   */
  async getGroupMembers(chatId) {
    try {
      logger.info(`获取外部群成员列表，群聊ID: ${chatId}`);
      
      // 从企业微信API获取群成员列表
      const members = await wechatWorkUtil.getExternalGroupMembers(chatId);
      
      return members;
    } catch (error) {
      logger.error(`获取外部群成员列表失败，群聊ID: ${chatId}`, error);
      throw error;
    }
  }

  /**
   * 搜索外部群
   * @param {Object} options - 搜索选项
   * @returns {Promise<Object>} - 返回搜索结果和分页信息
   */
  async searchGroups(options = {}) {
    try {
      logger.info(`搜索外部群，关键词: ${options.keyword}`);
      
      const result = await groupRepository.searchGroups({
        keyword: options.keyword,
        page: options.page || 1,
        pageSize: options.pageSize || 20
      });
      
      return result;
    } catch (error) {
      logger.error(`搜索外部群失败，关键词: ${options.keyword}`, error);
      throw error;
    }
  }

  /**
   * 向外部群发送消息
   * @param {string} chatId - 群聊ID
   * @param {Object} messageData - 消息数据
   * @returns {Promise<Object>} - 返回发送结果
   */
  async sendGroupMessage(chatId, messageData) {
    try {
      logger.info(`向外部群发送消息，群聊ID: ${chatId}`);
      
      // 发送消息到企业微信
      const result = await wechatWorkUtil.sendGroupMessage(chatId, messageData);
      
      // 保存发送记录到本地数据库
      await messageRepository.saveMessageRecord({
        chatId,
        messageId: result.msgid,
        messageType: messageData.msgtype,
        messageContent: JSON.stringify(messageData),
        sendTime: new Date(),
        status: 'success'
      });
      
      return result;
    } catch (error) {
      logger.error(`向外部群发送消息失败，群聊ID: ${chatId}`, error);
      
      // 保存失败记录
      await messageRepository.saveMessageRecord({
        chatId,
        messageType: messageData.msgtype,
        messageContent: JSON.stringify(messageData),
        sendTime: new Date(),
        status: 'failed',
        errorMessage: error.message
      });
      
      throw error;
    }
  }

  /**
   * 批量向外部群发送消息
   * @param {Array} chatIds - 群聊ID数组
   * @param {Object} messageData - 消息数据
   * @returns {Promise<Object>} - 返回批量发送结果
   */
  async batchSendGroupMessage(chatIds, messageData) {
    try {
      logger.info(`批量向外部群发送消息，群组数量: ${chatIds.length}`);
      
      const results = [];
      let successCount = 0;
      let failedCount = 0;
      const failedGroups = [];
      
      // 逐个发送消息
      for (const chatId of chatIds) {
        try {
          const result = await this.sendGroupMessage(chatId, messageData);
          results.push({
            chatId,
            success: true,
            messageId: result.msgid
          });
          successCount++;
        } catch (error) {
          results.push({
            chatId,
            success: false,
            error: error.message
          });
          failedCount++;
          failedGroups.push({
            chatId,
            error: error.message
          });
        }
      }
      
      return {
        total: chatIds.length,
        successCount,
        failedCount,
        failedGroups,
        results
      };
    } catch (error) {
      logger.error('批量向外部群发送消息失败:', error);
      throw error;
    }
  }
  
  /**
   * 同步外部群列表
   * @returns {Promise<Object>} - 返回同步结果
   */
  async syncGroupList() {
    try {
      logger.info('同步外部群列表');
      
      // 从企业微信API获取最新的外部群列表
      const apiGroups = await wechatWorkUtil.getExternalGroupList();
      
      // 同步到本地数据库
      await this.syncGroupsToLocal(apiGroups);
      
      return {
        success: true,
        syncedCount: apiGroups.length,
        message: `成功同步${apiGroups.length}个外部群`
      };
    } catch (error) {
      logger.error('同步外部群列表失败:', error);
      throw error;
    }
  }
  
  /**
   * 同步单个群组信息
   * @param {string} chatId - 群聊ID
   * @returns {Promise<Object>} - 返回同步结果
   */
  async syncGroupInfo(chatId) {
    try {
      logger.info(`同步单个群组信息，群聊ID: ${chatId}`);
      
      // 从企业微信API获取最新的群详情
      const groupDetail = await wechatWorkUtil.getExternalGroupDetail(chatId);
      
      // 更新本地数据库
      await groupRepository.saveOrUpdateGroup(groupDetail);
      
      return {
        success: true,
        message: '群组信息同步成功',
        group: groupDetail
      };
    } catch (error) {
      logger.error(`同步群组信息失败，群聊ID: ${chatId}`, error);
      throw error;
    }
  }
  
  /**
   * 获取群群主信息
   * @param {string} chatId - 群聊ID
   * @returns {Promise<Object>} - 返回群主信息
   */
  async getGroupOwners(chatId) {
    try {
      logger.info(`获取群群主信息，群聊ID: ${chatId}`);
      
      // 从企业微信API获取群详情
      const groupDetail = await wechatWorkUtil.getExternalGroupDetail(chatId);
      
      // 提取群主信息
      const owner = groupDetail.owner ? {
        userId: groupDetail.owner,
        name: groupDetail.member_list.find(m => m.userid === groupDetail.owner)?.name || '未知'
      } : null;
      
      return { owner };
    } catch (error) {
      logger.error(`获取群群主信息失败，群聊ID: ${chatId}`, error);
      throw error;
    }
  }
  
  /**
   * 发送文本消息
   * @param {string} chatId - 群聊ID
   * @param {string} content - 消息内容
   * @returns {Promise<Object>} - 返回发送结果
   */
  async sendTextMessage(chatId, content) {
    try {
      logger.info(`发送文本消息，群聊ID: ${chatId}`);
      
      const messageData = {
        msgtype: 'text',
        text: { content }
      };
      
      return await this.sendGroupMessage(chatId, messageData);
    } catch (error) {
      logger.error(`发送文本消息失败，群聊ID: ${chatId}`, error);
      throw error;
    }
  }
  
  /**
   * 上传媒体文件
   * @param {string} fileType - 文件类型
   * @param {Buffer} fileData - 文件数据
   * @param {string} fileName - 文件名
   * @returns {Promise<Object>} - 返回上传结果
   */
  async uploadMediaFile(fileType, fileData, fileName) {
    try {
      logger.info(`上传媒体文件，文件名: ${fileName}`);
      
      const result = await wechatWorkUtil.uploadMedia(fileType, fileData, fileName);
      return result;
    } catch (error) {
      logger.error(`上传媒体文件失败，文件名: ${fileName}`, error);
      throw error;
    }
  }
  
  /**
   * 批量更新群组状态
   * @param {Array} groupUpdates - 群组更新数据
   * @returns {Promise<Object>} - 返回更新结果
   */
  async batchUpdateGroupStatus(groupUpdates) {
    try {
      logger.info(`批量更新群组状态，数量: ${groupUpdates.length}`);
      
      let successCount = 0;
      let failedCount = 0;
      const failedGroups = [];
      
      for (const update of groupUpdates) {
        try {
          await groupRepository.updateGroupStatus(update.chatId, update.status);
          successCount++;
        } catch (error) {
          failedCount++;
          failedGroups.push({
            chatId: update.chatId,
            error: error.message
          });
        }
      }
      
      return {
        total: groupUpdates.length,
        successCount,
        failedCount,
        failedGroups
      };
    } catch (error) {
      logger.error('批量更新群组状态失败:', error);
      throw error;
    }
  }
  
  /**
   * 导出群组列表
   * @param {Object} options - 导出选项
   * @returns {Promise<Object>} - 返回导出结果
   */
  async exportGroupList(options = {}) {
    try {
      logger.info('导出群组列表');
      
      const format = options.format || 'xlsx';
      // 调用现有的exportGroups方法
      return await this.exportGroups(format);
    } catch (error) {
      logger.error('导出群组列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取外部群聊天记录
   * @param {string} chatId - 群聊ID
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} - 返回聊天记录和分页信息
   */
  async getGroupChatRecords(chatId, options = {}) {
    try {
      logger.info(`获取外部群聊天记录，群聊ID: ${chatId}`);
      
      // 从企业微信API获取聊天记录
      const records = await wechatWorkUtil.getGroupChatRecords(chatId, {
        startTime: options.startTime,
        endTime: options.endTime,
        limit: options.pageSize || 20,
        cursor: options.cursor
      });
      
      // 保存聊天记录到本地数据库
      await messageRepository.batchSaveChatRecords(records.messages);
      
      return {
        records: records.messages,
        hasMore: records.has_more,
        nextCursor: records.next_cursor
      };
    } catch (error) {
      logger.error(`获取外部群聊天记录失败，群聊ID: ${chatId}`, error);
      throw error;
    }
  }

  /**
   * 更新外部群备注
   * @param {string} chatId - 群聊ID
   * @param {string} remark - 备注信息
   * @returns {Promise<Object>} - 返回更新结果
   */
  async updateGroupRemark(chatId, remark) {
    try {
      logger.info(`更新外部群备注，群聊ID: ${chatId}`);
      
      const result = await groupRepository.updateGroupRemark(chatId, remark);
      return result;
    } catch (error) {
      logger.error(`更新外部群备注失败，群聊ID: ${chatId}`, error);
      throw error;
    }
  }

  /**
   * 获取外部群统计信息
   * @param {Object} options - 统计选项
   * @returns {Promise<Object>} - 返回统计信息
   */
  async getGroupStatistics(options = {}) {
    try {
      logger.info('获取外部群统计信息');
      
      const result = await groupRepository.getGroupStatistics({
        startTime: options.startTime,
        endTime: options.endTime
      });
      
      return result;
    } catch (error) {
      logger.error('获取外部群统计信息失败:', error);
      throw error;
    }
  }

  /**
   * 导出外部群列表
   * @param {string} format - 导出格式
   * @returns {Promise<Object>} - 返回导出结果
   */
  async exportGroups(format = 'xlsx') {
    try {
      logger.info(`导出外部群列表，格式: ${format}`);
      
      const groups = await groupRepository.getAllGroups();
      
      // 根据格式生成不同的导出文件
      let exportResult;
      if (format === 'xlsx') {
        exportResult = await this.generateExcelExport(groups);
      } else if (format === 'csv') {
        exportResult = await this.generateCsvExport(groups);
      } else {
        throw new Error('不支持的导出格式');
      }
      
      return exportResult;
    } catch (error) {
      logger.error(`导出外部群列表失败，格式: ${format}`, error);
      throw error;
    }
  }

  /**
   * 标记外部群为重要
   * @param {string} chatId - 群聊ID
   * @param {boolean} isImportant - 是否重要
   * @returns {Promise<Object>} - 返回更新结果
   */
  async markGroupImportant(chatId, isImportant) {
    try {
      logger.info(`标记外部群为${isImportant ? '重要' : '普通'}，群聊ID: ${chatId}`);
      
      const result = await groupRepository.markGroupImportant(chatId, isImportant);
      return result;
    } catch (error) {
      logger.error(`标记外部群重要性失败，群聊ID: ${chatId}`, error);
      throw error;
    }
  }

  /**
   * 设置群提醒
   * @param {string} chatId - 群聊ID
   * @param {Object} reminderData - 提醒数据
   * @returns {Promise<Object>} - 返回设置结果
   */
  async setGroupReminder(chatId, reminderData) {
    try {
      logger.info(`设置群提醒，群聊ID: ${chatId}`);
      
      const result = await groupRepository.saveGroupReminder({
        chatId,
        ...reminderData,
        createTime: new Date()
      });
      
      return result;
    } catch (error) {
      logger.error(`设置群提醒失败，群聊ID: ${chatId}`, error);
      throw error;
    }
  }

  /**
   * 获取群提醒列表
   * @param {string} chatId - 群聊ID
   * @returns {Promise<Array>} - 返回提醒列表
   */
  async getGroupReminders(chatId) {
    try {
      logger.info(`获取群提醒列表，群聊ID: ${chatId}`);
      
      const reminders = await groupRepository.getGroupReminders(chatId);
      return reminders;
    } catch (error) {
      logger.error(`获取群提醒列表失败，群聊ID: ${chatId}`, error);
      throw error;
    }
  }

  /**
   * 删除群提醒
   * @param {string} reminderId - 提醒ID
   * @returns {Promise<Object>} - 返回删除结果
   */
  async deleteGroupReminder(reminderId) {
    try {
      logger.info(`删除群提醒，提醒ID: ${reminderId}`);
      
      const result = await groupRepository.deleteGroupReminder(reminderId);
      return result;
    } catch (error) {
      logger.error(`删除群提醒失败，提醒ID: ${reminderId}`, error);
      throw error;
    }
  }

  /**
   * 同步群组到本地数据库
   * @param {Array} groups - 群组列表
   * @private
   */
  async syncGroupsToLocal(groups) {
    try {
      logger.info('同步群组到本地数据库');
      
      // 批量保存或更新群组信息
      for (const group of groups) {
        await groupRepository.saveOrUpdateGroup(group);
      }
      
      logger.info(`成功同步${groups.length}个群组到本地数据库`);
    } catch (error) {
      logger.error('同步群组到本地数据库失败:', error);
      // 同步失败不抛出异常，避免影响主流程
    }
  }

  /**
   * 生成Excel导出
   * @param {Array} groups - 群组列表
   * @returns {Promise<Object>} - 返回导出结果
   * @private
   */
  async generateExcelExport(groups) {
    // 这里应该使用xlsx库生成Excel文件
    // 由于是模拟实现，返回简单的结果
    return {
      format: 'xlsx',
      filename: `external_groups_${Date.now()}.xlsx`,
      url: `/downloads/external_groups_${Date.now()}.xlsx`,
      count: groups.length
    };
  }

  /**
   * 生成CSV导出
   * @param {Array} groups - 群组列表
   * @returns {Promise<Object>} - 返回导出结果
   * @private
   */
  async generateCsvExport(groups) {
    // 这里应该生成CSV文件
    // 由于是模拟实现，返回简单的结果
    return {
      format: 'csv',
      filename: `external_groups_${Date.now()}.csv`,
      url: `/downloads/external_groups_${Date.now()}.csv`,
      count: groups.length
    };
  }
}

module.exports = new GroupService();