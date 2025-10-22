/**
 * 企业微信外部群管理控制器
 * 处理外部群的获取、消息发送等请求
 */

const logger = require('../../../core/logger');
const groupService = require('../services/groupService');
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
      const { page = 1, pageSize = 20, keyword } = req.query;
      
      const result = await groupService.getGroupList({
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        keyword
      });
      
      logger.info('获取外部群列表成功');
      return successResponse(res, result, '获取外部群列表成功');
    } catch (error) {
      logger.error('获取外部群列表失败:', error);
      return errorResponse(res, error.message || '获取外部群列表失败');
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
      
      const result = await groupService.getGroupMembers(chatId);
      
      logger.info(`获取外部群成员列表成功，群聊ID: ${chatId}`);
      return successResponse(res, result, '获取外部群成员列表成功');
    } catch (error) {
      logger.error(`获取外部群成员列表失败，群聊ID: ${req.params.chatId}`, error);
      return errorResponse(res, error.message || '获取外部群成员列表失败');
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
      
      const result = await groupService.searchGroups({
        keyword,
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
   * 向外部群发送消息
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async sendGroupMessage(req, res) {
    try {
      logger.info('向外部群发送消息请求');
      const { chatId } = req.params;
      const messageData = req.body;
      
      const result = await groupService.sendGroupMessage(chatId, messageData);
      
      logger.info(`向外部群发送消息成功，群聊ID: ${chatId}`);
      return successResponse(res, result, '发送消息成功');
    } catch (error) {
      logger.error(`向外部群发送消息失败，群聊ID: ${req.params.chatId}`, error);
      return errorResponse(res, error.message || '发送消息失败');
    }
  }

  /**
   * 批量向外部群发送消息
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async batchSendGroupMessage(req, res) {
    try {
      logger.info('批量向外部群发送消息请求');
      const { chatIds } = req.body;
      const messageData = req.body;
      
      const result = await groupService.batchSendGroupMessage(chatIds, messageData);
      
      logger.info(`批量向外部群发送消息成功，群组数量: ${chatIds.length}`);
      return successResponse(res, result, '批量发送消息成功');
    } catch (error) {
      logger.error('批量向外部群发送消息失败:', error);
      return errorResponse(res, error.message || '批量发送消息失败');
    }
  }

  /**
   * 获取外部群聊天记录
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async getGroupChatRecords(req, res) {
    try {
      logger.info('获取外部群聊天记录请求');
      const { chatId } = req.params;
      const { startTime, endTime, page = 1, pageSize = 20 } = req.query;
      
      const result = await groupService.getGroupChatRecords(chatId, {
        startTime,
        endTime,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      });
      
      logger.info(`获取外部群聊天记录成功，群聊ID: ${chatId}`);
      return successResponse(res, result, '获取聊天记录成功');
    } catch (error) {
      logger.error(`获取外部群聊天记录失败，群聊ID: ${req.params.chatId}`, error);
      return errorResponse(res, error.message || '获取聊天记录失败');
    }
  }

  /**
   * 更新外部群备注
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async updateGroupRemark(req, res) {
    try {
      logger.info('更新外部群备注请求');
      const { chatId } = req.params;
      const { remark } = req.body;
      
      const result = await groupService.updateGroupRemark(chatId, remark);
      
      logger.info(`更新外部群备注成功，群聊ID: ${chatId}`);
      return successResponse(res, result, '更新群备注成功');
    } catch (error) {
      logger.error(`更新外部群备注失败，群聊ID: ${req.params.chatId}`, error);
      return errorResponse(res, error.message || '更新群备注失败');
    }
  }

  /**
   * 获取外部群统计信息
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async getGroupStatistics(req, res) {
    try {
      logger.info('获取外部群统计信息请求');
      const { startTime, endTime } = req.query;
      
      const result = await groupService.getGroupStatistics({
        startTime,
        endTime
      });
      
      logger.info('获取外部群统计信息成功');
      return successResponse(res, result, '获取群统计信息成功');
    } catch (error) {
      logger.error('获取外部群统计信息失败:', error);
      return errorResponse(res, error.message || '获取群统计信息失败');
    }
  }

  /**
   * 导出外部群列表
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async exportGroups(req, res) {
    try {
      logger.info('导出外部群列表请求');
      const { format = 'xlsx' } = req.query;
      
      const result = await groupService.exportGroups(format);
      
      logger.info('导出外部群列表成功');
      return successResponse(res, result, '导出群列表成功');
    } catch (error) {
      logger.error('导出外部群列表失败:', error);
      return errorResponse(res, error.message || '导出群列表失败');
    }
  }

  /**
   * 标记外部群为重要
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async markGroupImportant(req, res) {
    try {
      logger.info('标记外部群为重要请求');
      const { chatId } = req.params;
      const { isImportant } = req.body;
      
      const result = await groupService.markGroupImportant(chatId, isImportant);
      
      logger.info(`标记外部群为${isImportant ? '重要' : '普通'}成功，群聊ID: ${chatId}`);
      return successResponse(res, result, `标记群为${isImportant ? '重要' : '普通'}成功`);
    } catch (error) {
      logger.error(`标记外部群为重要失败，群聊ID: ${req.params.chatId}`, error);
      return errorResponse(res, error.message || '标记群重要性失败');
    }
  }

  /**
   * 设置群提醒
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async setGroupReminder(req, res) {
    try {
      logger.info('设置群提醒请求');
      const { chatId } = req.params;
      const reminderData = req.body;
      
      const result = await groupService.setGroupReminder(chatId, reminderData);
      
      logger.info(`设置群提醒成功，群聊ID: ${chatId}`);
      return successResponse(res, result, '设置群提醒成功');
    } catch (error) {
      logger.error(`设置群提醒失败，群聊ID: ${req.params.chatId}`, error);
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
      logger.info('获取群提醒列表请求');
      const { chatId } = req.params;
      
      const result = await groupService.getGroupReminders(chatId);
      
      logger.info(`获取群提醒列表成功，群聊ID: ${chatId}`);
      return successResponse(res, result, '获取群提醒列表成功');
    } catch (error) {
      logger.error(`获取群提醒列表失败，群聊ID: ${req.params.chatId}`, error);
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
      logger.info('删除群提醒请求');
      const { reminderId } = req.params;
      
      const result = await groupService.deleteGroupReminder(reminderId);
      
      logger.info(`删除群提醒成功，提醒ID: ${reminderId}`);
      return successResponse(res, result, '删除群提醒成功');
    } catch (error) {
      logger.error(`删除群提醒失败，提醒ID: ${req.params.reminderId}`, error);
      return errorResponse(res, error.message || '删除群提醒失败');
    }
  }
}

module.exports = new GroupController();