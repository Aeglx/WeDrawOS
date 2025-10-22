/**
 * 企业微信外部群管理仓库
 * 处理企业微信外部群的数据持久化存储和访问
 */

const logger = require('../../../core/logger');
const db = require('../../../core/database');

/**
 * 企业微信外部群管理仓库类
 */
class GroupRepository {
  /**
   * 保存或更新群组信息
   * @param {Object} groupInfo - 群组信息
   * @returns {Promise<Object>} - 返回保存后的群组信息
   */
  async saveOrUpdateGroup(groupInfo) {
    try {
      logger.info(`保存或更新群组信息，群聊ID: ${groupInfo.chat_id}`);
      
      // 检查群组是否已存在
      const existingGroup = await db('wechat_work_external_groups')
        .where({ chat_id: groupInfo.chat_id })
        .first();
      
      if (existingGroup) {
        // 更新现有群组
        const result = await db('wechat_work_external_groups')
          .where({ chat_id: groupInfo.chat_id })
          .update({
            name: groupInfo.name,
            owner: groupInfo.owner,
            create_time: groupInfo.create_time,
            member_count: groupInfo.member_count,
            status: groupInfo.status || 'active',
            update_time: new Date()
          })
          .returning('*');
        
        logger.info(`更新群组信息成功，群聊ID: ${groupInfo.chat_id}`);
        return result[0];
      } else {
        // 创建新群组
        const result = await db('wechat_work_external_groups').insert({
          chat_id: groupInfo.chat_id,
          name: groupInfo.name,
          owner: groupInfo.owner,
          create_time: groupInfo.create_time,
          member_count: groupInfo.member_count,
          status: groupInfo.status || 'active',
          add_time: new Date(),
          update_time: new Date()
        }).returning('*');
        
        logger.info(`创建群组信息成功，群聊ID: ${groupInfo.chat_id}`);
        return result[0];
      }
    } catch (error) {
      logger.error(`保存或更新群组信息失败，群聊ID: ${groupInfo.chat_id}`, error);
      throw error;
    }
  }

  /**
   * 更新群组详情
   * @param {string} chatId - 群聊ID
   * @param {Object} groupDetail - 群组详情
   * @returns {Promise<Object>} - 返回更新后的群组信息
   */
  async updateGroupDetail(chatId, groupDetail) {
    try {
      logger.info(`更新群组详情，群聊ID: ${chatId}`);
      
      const updateData = {
        name: groupDetail.name,
        owner: groupDetail.owner,
        create_time: groupDetail.create_time,
        member_count: groupDetail.member_count,
        chat_data: JSON.stringify(groupDetail),
        update_time: new Date()
      };
      
      // 保存群成员信息
      if (groupDetail.members) {
        await this.saveGroupMembers(chatId, groupDetail.members);
      }
      
      const result = await db('wechat_work_external_groups')
        .where({ chat_id: chatId })
        .update(updateData)
        .returning('*');
      
      if (result.length === 0) {
        // 如果不存在，则创建
        return await this.saveOrUpdateGroup({
          chat_id: chatId,
          ...groupDetail
        });
      }
      
      logger.info(`更新群组详情成功，群聊ID: ${chatId}`);
      return result[0];
    } catch (error) {
      logger.error(`更新群组详情失败，群聊ID: ${chatId}`, error);
      throw error;
    }
  }

  /**
   * 保存群成员信息
   * @param {string} chatId - 群聊ID
   * @param {Array} members - 成员列表
   * @returns {Promise<void>}
   * @private
   */
  async saveGroupMembers(chatId, members) {
    try {
      // 先删除旧的成员信息
      await db('wechat_work_external_group_members')
        .where({ chat_id: chatId })
        .delete();
      
      // 批量插入新的成员信息
      const memberData = members.map(member => ({
        chat_id: chatId,
        userid: member.userid,
        type: member.type,
        name: member.name,
        avatar: member.avatar,
        join_time: member.join_time,
        add_time: new Date()
      }));
      
      if (memberData.length > 0) {
        await db('wechat_work_external_group_members').insert(memberData);
      }
      
      logger.info(`保存群成员信息成功，群聊ID: ${chatId}，成员数量: ${members.length}`);
    } catch (error) {
      logger.error(`保存群成员信息失败，群聊ID: ${chatId}`, error);
      throw error;
    }
  }

  /**
   * 获取群组列表
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} - 返回群组列表和分页信息
   */
  async getGroups(options = {}) {
    try {
      logger.info('获取群组列表');
      
      const query = db('wechat_work_external_groups');
      
      // 添加关键词搜索
      if (options.keyword) {
        query.where('name', 'LIKE', `%${options.keyword}%`)
          .orWhere('chat_id', 'LIKE', `%${options.keyword}%`)
          .orWhere('owner', 'LIKE', `%${options.keyword}%`);
      }
      
      // 获取总数
      const total = await query.count('id as count').first();
      
      // 添加分页
      const page = options.page || 1;
      const pageSize = options.pageSize || 20;
      const offset = (page - 1) * pageSize;
      
      const groups = await query
        .offset(offset)
        .limit(pageSize)
        .orderBy('update_time', 'desc');
      
      logger.info(`获取群组列表成功，总数: ${total.count}，当前页: ${page}`);
      return {
        groups,
        pagination: {
          total: total.count,
          page,
          pageSize,
          totalPages: Math.ceil(total.count / pageSize)
        }
      };
    } catch (error) {
      logger.error('获取群组列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有群组
   * @returns {Promise<Array>} - 返回所有群组
   */
  async getAllGroups() {
    try {
      logger.info('获取所有群组');
      
      const groups = await db('wechat_work_external_groups')
        .orderBy('update_time', 'desc');
      
      logger.info(`获取所有群组成功，数量: ${groups.length}`);
      return groups;
    } catch (error) {
      logger.error('获取所有群组失败:', error);
      throw error;
    }
  }

  /**
   * 搜索群组
   * @param {Object} options - 搜索选项
   * @returns {Promise<Object>} - 返回搜索结果和分页信息
   */
  async searchGroups(options = {}) {
    try {
      logger.info(`搜索群组，关键词: ${options.keyword}`);
      
      const query = db('wechat_work_external_groups')
        .where('name', 'LIKE', `%${options.keyword}%`)
        .orWhere('chat_id', 'LIKE', `%${options.keyword}%`)
        .orWhere('owner', 'LIKE', `%${options.keyword}%`);
      
      // 获取总数
      const total = await query.count('id as count').first();
      
      // 添加分页
      const page = options.page || 1;
      const pageSize = options.pageSize || 20;
      const offset = (page - 1) * pageSize;
      
      const groups = await query
        .offset(offset)
        .limit(pageSize)
        .orderBy('update_time', 'desc');
      
      logger.info(`搜索群组成功，总数: ${total.count}，当前页: ${page}`);
      return {
        groups,
        pagination: {
          total: total.count,
          page,
          pageSize,
          totalPages: Math.ceil(total.count / pageSize)
        }
      };
    } catch (error) {
      logger.error(`搜索群组失败，关键词: ${options.keyword}`, error);
      throw error;
    }
  }

  /**
   * 更新群组备注
   * @param {string} chatId - 群聊ID
   * @param {string} remark - 备注信息
   * @returns {Promise<Object>} - 返回更新结果
   */
  async updateGroupRemark(chatId, remark) {
    try {
      logger.info(`更新群组备注，群聊ID: ${chatId}`);
      
      const result = await db('wechat_work_external_groups')
        .where({ chat_id: chatId })
        .update({
          remark,
          update_time: new Date()
        })
        .returning('*');
      
      if (result.length === 0) {
        throw new Error(`群组不存在，群聊ID: ${chatId}`);
      }
      
      logger.info(`更新群组备注成功，群聊ID: ${chatId}`);
      return result[0];
    } catch (error) {
      logger.error(`更新群组备注失败，群聊ID: ${chatId}`, error);
      throw error;
    }
  }

  /**
   * 标记群组重要性
   * @param {string} chatId - 群聊ID
   * @param {boolean} isImportant - 是否重要
   * @returns {Promise<Object>} - 返回更新结果
   */
  async markGroupImportant(chatId, isImportant) {
    try {
      logger.info(`标记群组重要性，群聊ID: ${chatId}，是否重要: ${isImportant}`);
      
      const result = await db('wechat_work_external_groups')
        .where({ chat_id: chatId })
        .update({
          is_important: isImportant,
          update_time: new Date()
        })
        .returning('*');
      
      if (result.length === 0) {
        throw new Error(`群组不存在，群聊ID: ${chatId}`);
      }
      
      logger.info(`标记群组重要性成功，群聊ID: ${chatId}`);
      return result[0];
    } catch (error) {
      logger.error(`标记群组重要性失败，群聊ID: ${chatId}`, error);
      throw error;
    }
  }

  /**
   * 保存群提醒
   * @param {Object} reminderData - 提醒数据
   * @returns {Promise<Object>} - 返回保存后的提醒
   */
  async saveGroupReminder(reminderData) {
    try {
      logger.info(`保存群提醒，群聊ID: ${reminderData.chatId}`);
      
      const result = await db('wechat_work_group_reminders').insert({
        chat_id: reminderData.chatId,
        reminder_type: reminderData.type,
        reminder_content: reminderData.content,
        reminder_time: reminderData.reminderTime,
        is_recurring: reminderData.isRecurring,
        recurring_rule: reminderData.recurringRule ? JSON.stringify(reminderData.recurringRule) : null,
        status: reminderData.status || 'active',
        create_time: reminderData.createTime || new Date(),
        update_time: new Date()
      }).returning('*');
      
      logger.info(`保存群提醒成功，ID: ${result[0].id}`);
      return result[0];
    } catch (error) {
      logger.error(`保存群提醒失败，群聊ID: ${reminderData.chatId}`, error);
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
      
      const reminders = await db('wechat_work_group_reminders')
        .where({ chat_id: chatId })
        .orderBy('reminder_time', 'asc');
      
      // 解析JSON字段
      reminders.forEach(reminder => {
        if (reminder.recurring_rule) {
          reminder.recurring_rule = JSON.parse(reminder.recurring_rule);
        }
      });
      
      logger.info(`获取群提醒列表成功，数量: ${reminders.length}`);
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
      
      const result = await db('wechat_work_group_reminders')
        .where({ id: reminderId })
        .delete();
      
      if (result === 0) {
        throw new Error(`提醒不存在，ID: ${reminderId}`);
      }
      
      logger.info(`删除群提醒成功，提醒ID: ${reminderId}`);
      return { deleted: result };
    } catch (error) {
      logger.error(`删除群提醒失败，提醒ID: ${reminderId}`, error);
      throw error;
    }
  }

  /**
   * 获取群组统计信息
   * @param {Object} options - 统计选项
   * @returns {Promise<Object>} - 返回统计信息
   */
  async getGroupStatistics(options = {}) {
    try {
      logger.info('获取群组统计信息');
      
      // 基础统计
      const totalGroups = await db('wechat_work_external_groups').count('id as count').first();
      const activeGroups = await db('wechat_work_external_groups').where({ status: 'active' }).count('id as count').first();
      const importantGroups = await db('wechat_work_external_groups').where({ is_important: true }).count('id as count').first();
      
      // 成员统计
      const totalMembers = await db('wechat_work_external_group_members').count('id as count').first();
      
      // 按创建时间统计
      const query = db('wechat_work_external_groups');
      if (options.startTime) {
        query.where('create_time', '>=', options.startTime);
      }
      if (options.endTime) {
        query.where('create_time', '<=', options.endTime);
      }
      
      const dailyStats = await query
        .select(db.raw('DATE(FROM_UNIXTIME(create_time)) as date'))
        .count('id as count')
        .groupBy(db.raw('DATE(FROM_UNIXTIME(create_time))'))
        .orderBy(db.raw('DATE(FROM_UNIXTIME(create_time))'));
      
      const statistics = {
        totalGroups: totalGroups.count,
        activeGroups: activeGroups.count,
        importantGroups: importantGroups.count,
        totalMembers: totalMembers.count,
        dailyTrend: dailyStats
      };
      
      logger.info('获取群组统计信息成功');
      return statistics;
    } catch (error) {
      logger.error('获取群组统计信息失败:', error);
      throw error;
    }
  }

  /**
   * 更新单个群组状态
   * @param {string} chatId - 群聊ID
   * @param {string} status - 状态
   * @returns {Promise<Object>} - 返回更新结果
   */
  async updateGroupStatus(chatId, status) {
    try {
      logger.info(`更新群组状态，群聊ID: ${chatId}，状态: ${status}`);
      
      const result = await db('wechat_work_external_groups')
        .where({ chat_id: chatId })
        .update({
          status,
          update_time: new Date()
        })
        .returning('*');
      
      if (result.length === 0) {
        throw new Error(`群组不存在，群聊ID: ${chatId}`);
      }
      
      logger.info(`更新群组状态成功，群聊ID: ${chatId}`);
      return result[0];
    } catch (error) {
      logger.error(`更新群组状态失败，群聊ID: ${chatId}`, error);
      throw error;
    }
  }
  
  /**
   * 批量更新群组状态
   * @param {Array} chatIds - 群聊ID数组
   * @param {string} status - 状态
   * @returns {Promise<number>} - 返回更新的记录数
   */
  async batchUpdateGroupStatus(chatIds, status) {
    try {
      logger.info(`批量更新群组状态，数量: ${chatIds.length}，状态: ${status}`);
      
      const result = await db('wechat_work_external_groups')
        .whereIn('chat_id', chatIds)
        .update({
          status,
          update_time: new Date()
        });
      
      logger.info(`批量更新群组状态成功，更新数量: ${result}`);
      return result;
    } catch (error) {
      logger.error('批量更新群组状态失败:', error);
      throw error;
    }
  }
}

module.exports = new GroupRepository();