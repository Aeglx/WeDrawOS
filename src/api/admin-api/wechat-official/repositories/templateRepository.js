/**
 * 公众号模板消息管理仓库
 * 处理公众号模板消息和发送记录的数据持久化存储和访问
 */

const logger = require('../../../core/logger');
const db = require('../../../core/database');

/**
 * 公众号模板消息管理仓库类
 */
class TemplateRepository {
  /**
   * 保存模板信息
   * @param {Object} templateInfo - 模板信息
   * @returns {Promise<Object>} - 返回保存后的模板信息
   */
  async saveTemplate(templateInfo) {
    try {
      logger.info(`保存模板信息，模板ID: ${templateInfo.templateId}`);
      
      const result = await db('wechat_templates').insert({
        template_id: templateInfo.templateId,
        template_id_short: templateInfo.templateIdShort,
        title: templateInfo.title,
        primary_industry: templateInfo.primaryIndustry,
        deputy_industry: templateInfo.deputyIndustry,
        content: templateInfo.content,
        example: templateInfo.example,
        keyword_list: templateInfo.keywordList ? JSON.stringify(templateInfo.keywordList) : null,
        status: templateInfo.status || 'active',
        add_time: templateInfo.addTime || new Date(),
        update_time: new Date()
      }).returning('*');
      
      logger.info(`模板信息保存成功，模板ID: ${templateInfo.templateId}`);
      return result[0];
    } catch (error) {
      logger.error('保存模板信息失败:', error);
      throw error;
    }
  }

  /**
   * 更新模板信息
   * @param {number} id - 模板ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<Object>} - 返回更新后的模板信息
   */
  async updateTemplate(id, updateData) {
    try {
      logger.info(`更新模板信息，ID: ${id}`);
      
      const updateObj = {
        update_time: new Date()
      };
      
      // 转换需要更新的字段
      if (updateData.templateId !== undefined) updateObj.template_id = updateData.templateId;
      if (updateData.templateIdShort !== undefined) updateObj.template_id_short = updateData.templateIdShort;
      if (updateData.title !== undefined) updateObj.title = updateData.title;
      if (updateData.primaryIndustry !== undefined) updateObj.primary_industry = updateData.primaryIndustry;
      if (updateData.deputyIndustry !== undefined) updateObj.deputy_industry = updateData.deputyIndustry;
      if (updateData.content !== undefined) updateObj.content = updateData.content;
      if (updateData.example !== undefined) updateObj.example = updateData.example;
      if (updateData.keywordList !== undefined) updateObj.keyword_list = JSON.stringify(updateData.keywordList);
      if (updateData.status !== undefined) updateObj.status = updateData.status;
      
      const result = await db('wechat_templates')
        .where({ id })
        .update(updateObj)
        .returning('*');
      
      if (result.length === 0) {
        throw new Error(`模板不存在，ID: ${id}`);
      }
      
      logger.info(`模板信息更新成功，ID: ${id}`);
      return result[0];
    } catch (error) {
      logger.error(`更新模板信息失败，ID: ${id}`, error);
      throw error;
    }
  }

  /**
   * 更新模板状态
   * @param {string} templateId - 模板ID
   * @param {string} status - 状态
   * @returns {Promise<Object>} - 返回更新后的模板信息
   */
  async updateTemplateStatus(templateId, status) {
    try {
      logger.info(`更新模板状态，模板ID: ${templateId}，状态: ${status}`);
      
      const result = await db('wechat_templates')
        .where({ template_id: templateId })
        .update({
          status,
          update_time: new Date()
        })
        .returning('*');
      
      logger.info(`模板状态更新成功，模板ID: ${templateId}`);
      return result[0];
    } catch (error) {
      logger.error(`更新模板状态失败，模板ID: ${templateId}`, error);
      throw error;
    }
  }

  /**
   * 删除模板
   * @param {string} templateId - 模板ID
   * @returns {Promise<number>} - 返回删除的记录数
   */
  async deleteTemplate(templateId) {
    try {
      logger.info(`删除模板，模板ID: ${templateId}`);
      
      const result = await db('wechat_templates')
        .where({ template_id: templateId })
        .delete();
      
      if (result === 0) {
        logger.warn(`模板不存在，模板ID: ${templateId}`);
      } else {
        logger.info(`模板删除成功，模板ID: ${templateId}`);
      }
      
      return result;
    } catch (error) {
      logger.error(`删除模板失败，模板ID: ${templateId}`, error);
      throw error;
    }
  }

  /**
   * 根据模板ID获取模板信息
   * @param {string} templateId - 模板ID
   * @returns {Promise<Object|null>} - 返回模板信息或null
   */
  async getTemplateByTemplateId(templateId) {
    try {
      logger.info(`根据模板ID获取模板信息，模板ID: ${templateId}`);
      
      const template = await db('wechat_templates')
        .where({ template_id: templateId })
        .first();
      
      // 解析JSON字段
      if (template && template.keyword_list) {
        template.keyword_list = JSON.parse(template.keyword_list);
      }
      
      return template;
    } catch (error) {
      logger.error(`根据模板ID获取模板信息失败，模板ID: ${templateId}`, error);
      throw error;
    }
  }

  /**
   * 获取模板列表
   * @param {Object} filter - 过滤条件
   * @returns {Promise<Array>} - 返回模板列表
   */
  async getTemplates(filter = {}) {
    try {
      logger.info('获取模板列表');
      
      const query = db('wechat_templates');
      
      // 添加过滤条件
      if (filter.status) {
        query.where({ status: filter.status });
      }
      if (filter.title) {
        query.where('title', 'LIKE', `%${filter.title}%`);
      }
      
      // 按添加时间降序排序
      query.orderBy('add_time', 'desc');
      
      const templates = await query;
      
      // 解析JSON字段
      templates.forEach(template => {
        if (template.keyword_list) {
          template.keyword_list = JSON.parse(template.keyword_list);
        }
      });
      
      logger.info(`获取模板列表成功，数量: ${templates.length}`);
      return templates;
    } catch (error) {
      logger.error('获取模板列表失败:', error);
      throw error;
    }
  }

  /**
   * 保存模板消息发送记录
   * @param {Object} record - 消息记录
   * @returns {Promise<Object>} - 返回保存后的记录
   */
  async saveMessageRecord(record) {
    try {
      logger.info(`保存模板消息发送记录，接收用户: ${record.touser}`);
      
      const result = await db('wechat_template_messages').insert({
        touser: record.touser,
        template_id: record.templateId,
        message_data: record.messageData,
        msg_id: record.msgId,
        status: record.status,
        error_code: record.errorCode,
        error_msg: record.errorMsg,
        send_time: record.sendTime || new Date()
      }).returning('*');
      
      logger.info(`模板消息发送记录保存成功，ID: ${result[0].id}`);
      return result[0];
    } catch (error) {
      logger.error('保存模板消息发送记录失败:', error);
      throw error;
    }
  }

  /**
   * 获取模板消息发送记录
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} - 返回消息记录列表和分页信息
   */
  async getMessageRecords(options = {}) {
    try {
      logger.info('获取模板消息发送记录');
      
      const query = db('wechat_template_messages');
      
      // 添加过滤条件
      if (options.status) {
        query.where({ status: options.status });
      }
      if (options.startTime) {
        query.where('send_time', '>=', options.startTime);
      }
      if (options.endTime) {
        query.where('send_time', '<=', options.endTime);
      }
      if (options.touser) {
        query.where('touser', 'LIKE', `%${options.touser}%`);
      }
      if (options.templateId) {
        query.where({ template_id: options.templateId });
      }
      
      // 获取总数
      const total = await query.count('id as count').first();
      
      // 添加分页参数
      const page = options.page || 1;
      const pageSize = options.pageSize || 20;
      const offset = (page - 1) * pageSize;
      
      query.offset(offset).limit(pageSize);
      
      // 按发送时间降序排序
      query.orderBy('send_time', 'desc');
      
      const records = await query;
      
      // 解析JSON字段
      records.forEach(record => {
        if (record.message_data) {
          try {
            record.message_data = JSON.parse(record.message_data);
          } catch (e) {
            // 如果解析失败，保持原样
          }
        }
      });
      
      logger.info(`获取模板消息发送记录成功，数量: ${records.length}`);
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
      logger.error('获取模板消息发送记录失败:', error);
      throw error;
    }
  }

  /**
   * 获取模板消息发送统计
   * @param {string} startTime - 开始时间
   * @param {string} endTime - 结束时间
   * @returns {Promise<Object>} - 返回统计数据
   */
  async getMessageStatistics(startTime, endTime) {
    try {
      logger.info('获取模板消息发送统计');
      
      const query = db('wechat_template_messages');
      
      // 添加时间范围条件
      if (startTime) {
        query.where('send_time', '>=', startTime);
      }
      if (endTime) {
        query.where('send_time', '<=', endTime);
      }
      
      // 按状态分组统计
      const statusStats = await query
        .select('status')
        .count('id as count')
        .groupBy('status');
      
      // 按模板分组统计
      const templateStats = await query
        .select('template_id')
        .count('id as count')
        .groupBy('template_id');
      
      // 按日期分组统计
      const dailyStats = await query
        .select(db.raw('DATE(send_time) as date'))
        .count('id as count')
        .groupBy(db.raw('DATE(send_time)'))
        .orderBy(db.raw('DATE(send_time)'));
      
      // 转换为更易读的格式
      const statusMap = {};
      statusStats.forEach(stat => {
        statusMap[stat.status] = stat.count;
      });
      
      const templateMap = {};
      templateStats.forEach(stat => {
        templateMap[stat.template_id] = stat.count;
      });
      
      const dailyData = dailyStats.map(stat => ({
        date: stat.date,
        count: stat.count
      }));
      
      const statistics = {
        total: Object.values(statusMap).reduce((sum, count) => sum + count, 0),
        byStatus: statusMap,
        byTemplate: templateMap,
        dailyTrend: dailyData
      };
      
      logger.info('获取模板消息发送统计成功');
      return statistics;
    } catch (error) {
      logger.error('获取模板消息发送统计失败:', error);
      throw error;
    }
  }

  /**
   * 批量删除模板消息发送记录
   * @param {Array} ids - 记录ID数组
   * @returns {Promise<number>} - 返回删除的记录数
   */
  async batchDeleteMessageRecords(ids) {
    try {
      logger.info(`批量删除模板消息发送记录，数量: ${ids.length}`);
      
      const result = await db('wechat_template_messages')
        .whereIn('id', ids)
        .delete();
      
      logger.info(`批量删除模板消息发送记录成功，删除数量: ${result}`);
      return result;
    } catch (error) {
      logger.error('批量删除模板消息发送记录失败:', error);
      throw error;
    }
  }

  /**
   * 清理过期的模板消息发送记录
   * @param {number} days - 保留天数
   * @returns {Promise<number>} - 返回删除的记录数
   */
  async cleanupExpiredMessageRecords(days = 30) {
    try {
      logger.info(`清理${days}天前的模板消息发送记录`);
      
      // 计算过期时间
      const expireDate = new Date();
      expireDate.setDate(expireDate.getDate() - days);
      
      const result = await db('wechat_template_messages')
        .where('send_time', '<=', expireDate)
        .delete();
      
      logger.info(`清理过期模板消息发送记录成功，删除数量: ${result}`);
      return result;
    } catch (error) {
      logger.error('清理过期模板消息发送记录失败:', error);
      throw error;
    }
  }

  /**
   * 搜索模板消息发送记录
   * @param {string} keyword - 搜索关键词
   * @param {Object} pagination - 分页参数
   * @returns {Promise<Object>} - 返回搜索结果和分页信息
   */
  async searchMessageRecords(keyword, pagination = {}) {
    try {
      logger.info(`搜索模板消息发送记录，关键词: ${keyword}`);
      
      const query = db('wechat_template_messages')
        .where('touser', 'LIKE', `%${keyword}%`)
        .orWhere('message_data', 'LIKE', `%${keyword}%`);
      
      // 获取总数
      const total = await query.count('id as count').first();
      
      // 添加分页参数
      const page = pagination.page || 1;
      const pageSize = pagination.pageSize || 20;
      const offset = (page - 1) * pageSize;
      
      query.offset(offset).limit(pageSize);
      
      // 按发送时间降序排序
      query.orderBy('send_time', 'desc');
      
      const records = await query;
      
      // 解析JSON字段
      records.forEach(record => {
        if (record.message_data) {
          try {
            record.message_data = JSON.parse(record.message_data);
          } catch (e) {
            // 如果解析失败，保持原样
          }
        }
      });
      
      logger.info(`搜索模板消息发送记录成功，数量: ${records.length}`);
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
      logger.error(`搜索模板消息发送记录失败，关键词: ${keyword}`, error);
      throw error;
    }
  }
}

module.exports = new TemplateRepository();