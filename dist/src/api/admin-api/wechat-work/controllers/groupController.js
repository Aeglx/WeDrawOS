/**
 * 企业微信外部群管理控制器
 * 处理外部群管理相关的API请求
 */

const logger = require('../../../core/logger');
const groupService = require('../services/groupService');
const messageService = require('../services/messageService');
const { successResponse, errorResponse } = require('../../../core/response');

/**
 * 企业微信外部群管理控制器类
 */
class GroupController {
  /**
   * 获取外部群列表
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async getGroupList(req, res) {
    try {
      logger.info('获取外部群列表请求');
      const { page = 1, pageSize = 20, keyword, ownerId, status, startTime, endTime } = req.query;
      
      const result = await groupService.getGroupList({
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        keyword,
        ownerId,
        status,
        startTime,
        endTime
      });
      
      logger.info('获取外部群列表成功');
      return successResponse(res, result, '获取外部群列表成功');
    } catch (error) {
      logger.error('获取外部群列表失败:', error);
      return errorResponse(res, error.message || '获取外部群列表失败');
    }
  }

  /**
   * 同步企业微信外部群列表
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async syncGroupList(req, res) {
    try {
      logger.info('同步外部群列表请求');
      const { forceUpdate } = req.query;
      const result = await groupService.syncGroupList(forceUpdate === 'true');
      
      logger.info('外部群同步成功');
      return successResponse(res, result, '外部群同步成功');
    } catch (error) {
      logger.error('同步外部群列表失败:', error);
      return errorResponse(res, error.message || '同步外部群列表失败');
    }
  }

  /**
   * 同步特定群组信息
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async syncGroupInfo(req, res) {
    try {
      logger.info(`同步群组信息请求，群组ID: ${req.params.chatId}`);
      const { chatId } = req.params;
      
      const result = await groupService.syncGroupInfo(chatId);
      
      logger.info(`群组信息同步成功，群组ID: ${chatId}`);
      return successResponse(res, result, '群组信息同步成功');
    } catch (error) {
      logger.error(`同步群组信息失败，群组ID: ${req.params.chatId}`, error);
      return errorResponse(res, error.message || '同步群组信息失败');
    }
  }

  /**
   * 获取外部群详情
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async getGroupDetail(req, res) {
    try {
      logger.info('获取外部群详情请求');
      const { chatId } = req.params;
      
      const result = await groupService.getGroupDetail(chatId);
      
      logger.info(`获取外部群详情成功，群聊ID: ${chatId}`);
      return successResponse(res, result, '获取外部群详情成功');
    } catch (error) {
      logger.error(`获取外部群详情失败，群聊ID: ${req.params.chatId}`, error);
      return errorResponse(res, error.message || '获取外部群详情失败');
    }
  }

  /**
   * 获取外部群成员列表
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async getGroupMembers(req, res) {
    try {
      logger.info('获取外部群成员列表请求');
      const { chatId } = req.params;
      const { page = 1, pageSize = 20, role } = req.query;
      
      const result = await groupService.getGroupMembers(chatId, {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        role
      });
      
      logger.info(`获取外部群成员列表成功，群聊ID: ${chatId}`);
      return successResponse(res, result, '获取外部群成员列表成功');
    } catch (error) {
      logger.error(`获取外部群成员列表失败，群聊ID: ${req.params.chatId}`, error);
      return errorResponse(res, error.message || '获取外部群成员列表失败');
    }
  }

  /**
   * 获取所有群主列表
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async getGroupOwners(req, res) {
    try {
      logger.info('获取群主列表请求');
      const owners = await groupService.getGroupOwners();
      
      logger.info('获取群主列表成功');
      return successResponse(res, owners, '获取群主列表成功');
    } catch (error) {
      logger.error('获取群主列表失败:', error);
      return errorResponse(res, error.message || '获取群主列表失败');
    }
  }

  /**
   * 搜索外部群
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async searchGroups(req, res) {
    try {
      logger.info('搜索外部群请求');
      const { keyword, page = 1, pageSize = 20 } = req.query;
      
      const result = await groupService.searchGroups(keyword, {
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      });
      
      logger.info(`搜索外部群成功，关键词: ${keyword}`);
      return successResponse(res, result, '搜索外部群成功');
    } catch (error) {
      logger.error(`搜索外部群失败，关键词: ${req.query.keyword}`, error);
      return errorResponse(res, error.message || '搜索外部群失败');
    }
  }

  /**
   * 发送群消息
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async sendGroupMessage(req, res) {
    try {
      logger.info(`发送群消息请求，群组ID: ${req.params.chatId}`);
      const { chatId } = req.params;
      const messageData = req.body;
      
      const result = await messageService.sendGroupMessage(chatId, messageData);
      
      logger.info(`发送群消息成功，群组ID: ${chatId}`);
      return successResponse(res, result, '消息发送成功');
    } catch (error) {
      logger.error(`发送群消息失败，群组ID: ${req.params.chatId}`, error);
      return errorResponse(res, error.message || '发送群消息失败');
    }
  }

  /**
   * 发送文本消息到群
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async sendTextMessage(req, res) {
    try {
      logger.info(`发送文本消息请求，群组ID: ${req.params.chatId}`);
      const { chatId } = req.params;
      const { content, mentionedList, mentionedMobileList } = req.body;
      
      const result = await messageService.sendGroupMessage(chatId, {
        msgtype: 'text',
        text: {
          content,
          mentioned_list: mentionedList,
          mentioned_mobile_list: mentionedMobileList
        }
      });
      
      logger.info(`发送文本消息成功，群组ID: ${chatId}`);
      return successResponse(res, result, '文本消息发送成功');
    } catch (error) {
      logger.error(`发送文本消息失败，群组ID: ${req.params.chatId}`, error);
      return errorResponse(res, error.message || '发送文本消息失败');
    }
  }

  /**
   * 发送图片消息到群
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async sendImageMessage(req, res) {
    try {
      logger.info(`发送图片消息请求，群组ID: ${req.params.chatId}`);
      const { chatId } = req.params;
      const { mediaId } = req.body;
      
      const result = await messageService.sendGroupMessage(chatId, {
        msgtype: 'image',
        image: {
          media_id: mediaId
        }
      });
      
      logger.info(`发送图片消息成功，群组ID: ${chatId}`);
      return successResponse(res, result, '图片消息发送成功');
    } catch (error) {
      logger.error(`发送图片消息失败，群组ID: ${req.params.chatId}`, error);
      return errorResponse(res, error.message || '发送图片消息失败');
    }
  }

  /**
   * 发送文件消息到群
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async sendFileMessage(req, res) {
    try {
      logger.info(`发送文件消息请求，群组ID: ${req.params.chatId}`);
      const { chatId } = req.params;
      const { mediaId } = req.body;
      
      const result = await messageService.sendGroupMessage(chatId, {
        msgtype: 'file',
        file: {
          media_id: mediaId
        }
      });
      
      logger.info(`发送文件消息成功，群组ID: ${chatId}`);
      return successResponse(res, result, '文件消息发送成功');
    } catch (error) {
      logger.error(`发送文件消息失败，群组ID: ${req.params.chatId}`, error);
      return errorResponse(res, error.message || '发送文件消息失败');
    }
  }

  /**
   * 发送视频消息到群
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async sendVideoMessage(req, res) {
    try {
      logger.info(`发送视频消息请求，群组ID: ${req.params.chatId}`);
      const { chatId } = req.params;
      const { mediaId, title, description } = req.body;
      
      const result = await messageService.sendGroupMessage(chatId, {
        msgtype: 'video',
        video: {
          media_id: mediaId,
          title,
          description
        }
      });
      
      logger.info(`发送视频消息成功，群组ID: ${chatId}`);
      return successResponse(res, result, '视频消息发送成功');
    } catch (error) {
      logger.error(`发送视频消息失败，群组ID: ${req.params.chatId}`, error);
      return errorResponse(res, error.message || '发送视频消息失败');
    }
  }

  /**
   * 发送链接消息到群
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async sendLinkMessage(req, res) {
    try {
      logger.info(`发送链接消息请求，群组ID: ${req.params.chatId}`);
      const { chatId } = req.params;
      const { title, description, url, picUrl } = req.body;
      
      const result = await messageService.sendGroupMessage(chatId, {
        msgtype: 'link',
        link: {
          title,
          description,
          url,
          picurl: picUrl
        }
      });
      
      logger.info(`发送链接消息成功，群组ID: ${chatId}`);
      return successResponse(res, result, '链接消息发送成功');
    } catch (error) {
      logger.error(`发送链接消息失败，群组ID: ${req.params.chatId}`, error);
      return errorResponse(res, error.message || '发送链接消息失败');
    }
  }

  /**
   * 批量发送群消息
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async batchSendGroupMessage(req, res) {
    try {
      logger.info('批量发送群消息请求');
      const { chatIds, messageData, sendDelay = 0 } = req.body;
      
      const result = await messageService.batchSendGroupMessage(chatIds, messageData, parseInt(sendDelay));
      
      logger.info('批量消息发送成功');
      return successResponse(res, result, '批量消息发送成功');
    } catch (error) {
      logger.error('批量发送群消息失败:', error);
      return errorResponse(res, error.message || '批量发送群消息失败');
    }
  }

  /**
   * 获取群聊天记录
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async getGroupChatRecords(req, res) {
    try {
      logger.info(`获取群聊天记录请求，群组ID: ${req.params.chatId}`);
      const { chatId } = req.params;
      const { startTime, endTime, page = 1, pageSize = 20 } = req.query;
      
      const result = await messageService.getGroupChatRecords(chatId, {
        startTime,
        endTime,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      });
      
      logger.info(`获取群聊天记录成功，群组ID: ${chatId}`);
      return successResponse(res, result, '获取群聊天记录成功');
    } catch (error) {
      logger.error(`获取群聊天记录失败，群组ID: ${req.params.chatId}`, error);
      return errorResponse(res, error.message || '获取群聊天记录失败');
    }
  }

  /**
   * 搜索消息记录
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async searchMessageRecords(req, res) {
    try {
      logger.info('搜索消息记录请求');
      const { keyword, chatId, senderId, startTime, endTime, page = 1, pageSize = 20 } = req.query;
      
      const result = await messageService.searchMessageRecords({
        keyword,
        chatId,
        senderId,
        startTime,
        endTime,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      });
      
      logger.info('搜索消息记录成功');
      return successResponse(res, result, '搜索消息记录成功');
    } catch (error) {
      logger.error('搜索消息记录失败:', error);
      return errorResponse(res, error.message || '搜索消息记录失败');
    }
  }

  /**
   * 获取消息发送统计
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async getMessageStatistics(req, res) {
    try {
      logger.info('获取消息发送统计请求');
      const { startTime, endTime } = req.query;
      
      const result = await messageService.getMessageStatistics(startTime, endTime);
      
      logger.info('获取消息发送统计成功');
      return successResponse(res, result, '获取消息发送统计成功');
    } catch (error) {
      logger.error('获取消息发送统计失败:', error);
      return errorResponse(res, error.message || '获取消息发送统计失败');
    }
  }

  /**
   * 清理过期消息记录
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async cleanExpiredMessages(req, res) {
    try {
      logger.info('清理过期消息记录请求');
      const { days = 30 } = req.query;
      
      const result = await messageService.cleanExpiredMessages(parseInt(days));
      
      logger.info(`成功清理${days}天前的消息记录`);
      return successResponse(res, result, `成功清理${days}天前的消息记录`);
    } catch (error) {
      logger.error('清理过期消息记录失败:', error);
      return errorResponse(res, error.message || '清理过期消息记录失败');
    }
  }

  /**
   * 更新群备注
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async updateGroupRemark(req, res) {
    try {
      logger.info(`更新群备注请求，群组ID: ${req.params.chatId}`);
      const { chatId } = req.params;
      const { remark } = req.body;
      
      const result = await groupService.updateGroupRemark(chatId, remark);
      
      logger.info(`群备注更新成功，群组ID: ${chatId}`);
      return successResponse(res, result, '群备注更新成功');
    } catch (error) {
      logger.error(`更新群备注失败，群组ID: ${req.params.chatId}`, error);
      return errorResponse(res, error.message || '更新群备注失败');
    }
  }

  /**
   * 获取群组统计信息
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async getGroupStatistics(req, res) {
    try {
      logger.info('获取群组统计信息请求');
      const { startTime, endTime, type } = req.query;
      
      const result = await groupService.getGroupStatistics({
        startTime,
        endTime,
        type
      });
      
      logger.info('获取群组统计信息成功');
      return successResponse(res, result, '获取群组统计信息成功');
    } catch (error) {
      logger.error('获取群组统计信息失败:', error);
      return errorResponse(res, error.message || '获取群组统计信息失败');
    }
  }

  /**
   * 获取群活跃度排行
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async getGroupActivityRank(req, res) {
    try {
      logger.info('获取群活跃度排行请求');
      const { startTime, endTime, limit = 10 } = req.query;
      
      const result = await groupService.getGroupActivityRank({
        startTime,
        endTime,
        limit: parseInt(limit)
      });
      
      logger.info('获取群活跃度排行成功');
      return successResponse(res, result, '获取群活跃度排行成功');
    } catch (error) {
      logger.error('获取群活跃度排行失败:', error);
      return errorResponse(res, error.message || '获取群活跃度排行失败');
    }
  }

  /**
   * 标记群组重要性
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async markGroupImportant(req, res) {
    try {
      logger.info(`标记群组重要性请求，群组ID: ${req.params.chatId}`);
      const { chatId } = req.params;
      const { isImportant } = req.body;
      
      const result = await groupService.markGroupImportant(chatId, isImportant);
      
      logger.info(`标记群组重要性成功，群组ID: ${chatId}`);
      return successResponse(res, result, isImportant ? '群组标记为重要' : '取消群组重要标记');
    } catch (error) {
      logger.error(`标记群组重要性失败，群组ID: ${req.params.chatId}`, error);
      return errorResponse(res, error.message || '标记群组重要性失败');
    }
  }

  /**
   * 设置群提醒
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async setGroupReminder(req, res) {
    try {
      logger.info(`设置群提醒请求，群组ID: ${req.params.chatId}`);
      const { chatId } = req.params;
      const reminderData = req.body;
      
      const result = await groupService.setGroupReminder(chatId, reminderData);
      
      logger.info(`群提醒设置成功，群组ID: ${chatId}`);
      return successResponse(res, result, '群提醒设置成功');
    } catch (error) {
      logger.error(`设置群提醒失败，群组ID: ${req.params.chatId}`, error);
      return errorResponse(res, error.message || '设置群提醒失败');
    }
  }

  /**
   * 获取群提醒列表
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async getGroupReminders(req, res) {
    try {
      logger.info(`获取群提醒列表请求，群组ID: ${req.params.chatId}`);
      const { chatId } = req.params;
      
      const reminders = await groupService.getGroupReminders(chatId);
      
      logger.info(`获取群提醒列表成功，群组ID: ${chatId}`);
      return successResponse(res, reminders, '获取群提醒列表成功');
    } catch (error) {
      logger.error(`获取群提醒列表失败，群组ID: ${req.params.chatId}`, error);
      return errorResponse(res, error.message || '获取群提醒列表失败');
    }
  }

  /**
   * 删除群提醒
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async deleteGroupReminder(req, res) {
    try {
      logger.info(`删除群提醒请求，群组ID: ${req.params.chatId}`);
      const { chatId, reminderId } = req.params;
      
      await groupService.deleteGroupReminder(chatId, reminderId);
      
      logger.info(`群提醒删除成功，群组ID: ${chatId}`);
      return successResponse(res, null, '群提醒删除成功');
    } catch (error) {
      logger.error(`删除群提醒失败，群组ID: ${req.params.chatId}`, error);
      return errorResponse(res, error.message || '删除群提醒失败');
    }
  }

  /**
   * 批量更新群组状态
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async batchUpdateGroupStatus(req, res) {
    try {
      logger.info('批量更新群组状态请求');
      const { chatIds, status } = req.body;
      
      const result = await groupService.batchUpdateGroupStatus(chatIds, status);
      
      logger.info('群组状态更新成功');
      return successResponse(res, result, '群组状态更新成功');
    } catch (error) {
      logger.error('批量更新群组状态失败:', error);
      return errorResponse(res, error.message || '批量更新群组状态失败');
    }
  }

  /**
   * 上传媒体文件
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async uploadMediaFile(req, res) {
    try {
      logger.info('上传媒体文件请求');
      if (!req.file) {
        return errorResponse(res, '请选择要上传的文件', 400);
      }
      
      const { type } = req.params;
      const result = await messageService.uploadMediaFile(req.file, type);
      
      logger.info('文件上传成功');
      return successResponse(res, result, '文件上传成功');
    } catch (error) {
      logger.error('上传媒体文件失败:', error);
      return errorResponse(res, error.message || '上传媒体文件失败');
    }
  }

  /**
   * 导出群列表
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async exportGroupList(req, res) {
    try {
      logger.info('导出群列表请求');
      const { keyword, ownerId, status, startTime, endTime } = req.query;
      
      const excelBuffer = await groupService.exportGroupList({
        keyword,
        ownerId,
        status,
        startTime,
        endTime
      });
      
      logger.info('群列表导出成功');
      // 设置响应头
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=group_list_${Date.now()}.xlsx`);
      
      return res.send(excelBuffer);
    } catch (error) {
      logger.error('导出群列表失败:', error);
      return errorResponse(res, error.message || '导出群列表失败');
    }
  }
}

module.exports = new GroupController();