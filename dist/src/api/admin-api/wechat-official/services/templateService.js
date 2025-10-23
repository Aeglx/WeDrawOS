/**
 * 公众号模板消息管理服务
 * 处理公众号模板消息的获取、添加、删除、发送等业务逻辑
 */

const logger = require('../../../core/logger');
const wechatUtil = require('../../../core/utils/wechatUtil');
const templateRepository = require('../repositories/templateRepository');

/**
 * 公众号模板消息管理服务类
 */
class TemplateService {
  /**
   * 获取模板库模板列表
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} - 返回模板列表
   */
  async getPublicTemplates(options = {}) {
    try {
      logger.info('开始获取模板库模板列表');
      
      // 获取access_token
      const accessToken = await wechatUtil.getAccessToken();
      
      // 调用微信API获取模板库模板列表
      const url = `https://api.weixin.qq.com/cgi-bin/template/get_all_private_template?access_token=${accessToken}`;
      const result = await wechatUtil.request({ url, method: 'GET' });
      
      // 根据分页参数处理结果
      if (options.offset !== undefined && options.count !== undefined) {
        const offset = options.offset;
        const count = options.count;
        const totalCount = result.template_list ? result.template_list.length : 0;
        
        result.template_list = result.template_list ? 
          result.template_list.slice(offset, offset + count) : [];
        result.total_count = totalCount;
        result.offset = offset;
        result.count = count;
      }
      
      logger.info('获取模板库模板列表成功');
      return result;
    } catch (error) {
      logger.error('获取模板库模板列表失败:', error);
      throw error;
    }
  }

  /**
   * 搜索模板库模板
   * @param {string} keyword - 搜索关键词
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} - 返回搜索结果
   */
  async searchPublicTemplates(keyword, options = {}) {
    try {
      logger.info(`开始搜索模板库模板，关键词: ${keyword}`);
      
      // 获取access_token
      const accessToken = await wechatUtil.getAccessToken();
      
      // 调用微信API搜索模板库模板
      const url = `https://api.weixin.qq.com/cgi-bin/template/api_add_template?access_token=${accessToken}`;
      const data = {
        template_id_short: '', // 用于搜索时留空
        keyword: keyword
      };
      
      const result = await wechatUtil.request({ url, method: 'POST', data });
      
      // 由于微信官方API没有直接的搜索接口，这里需要根据实际API调整
      // 这里假设使用了一个自定义的搜索接口，实际开发中需要根据微信官方文档调整
      
      // 根据分页参数处理结果
      if (options.offset !== undefined && options.count !== undefined) {
        const offset = options.offset;
        const count = options.count;
        const totalCount = result.template_list ? result.template_list.length : 0;
        
        result.template_list = result.template_list ? 
          result.template_list.slice(offset, offset + count) : [];
        result.total_count = totalCount;
        result.offset = offset;
        result.count = count;
      }
      
      logger.info(`搜索模板库模板成功，关键词: ${keyword}`);
      return result;
    } catch (error) {
      logger.error(`搜索模板库模板失败，关键词: ${keyword}`, error);
      throw error;
    }
  }

  /**
   * 从模板库添加模板
   * @param {string} templateIdShort - 模板库中模板的编号
   * @param {Array} keywordList - 模板关键词列表
   * @returns {Promise<Object>} - 返回添加结果
   */
  async addTemplate(templateIdShort, keywordList = []) {
    try {
      logger.info(`开始从模板库添加模板，模板编号: ${templateIdShort}`);
      
      // 获取access_token
      const accessToken = await wechatUtil.getAccessToken();
      
      // 调用微信API添加模板
      const url = `https://api.weixin.qq.com/cgi-bin/template/api_add_template?access_token=${accessToken}`;
      const data = {
        template_id_short: templateIdShort,
        keyword_id_list: keywordList // 根据实际API可能需要调整
      };
      
      const result = await wechatUtil.request({ url, method: 'POST', data });
      
      // 保存模板信息到数据库
      if (result.template_id) {
        const templateInfo = {
          templateId: result.template_id,
          templateIdShort: templateIdShort,
          keywordList: keywordList,
          addTime: new Date(),
          status: 'active'
        };
        await templateRepository.saveTemplate(templateInfo);
      }
      
      logger.info(`从模板库添加模板成功，模板ID: ${result.template_id}`);
      return result;
    } catch (error) {
      logger.error(`从模板库添加模板失败，模板编号: ${templateIdShort}`, error);
      throw error;
    }
  }

  /**
   * 获取已添加的模板列表
   * @returns {Promise<Array>} - 返回模板列表
   */
  async getTemplates() {
    try {
      logger.info('开始获取已添加的模板列表');
      
      // 首先从数据库获取本地存储的模板列表
      let templates = await templateRepository.getTemplates();
      
      // 然后从微信服务器同步最新的模板列表
      const accessToken = await wechatUtil.getAccessToken();
      const url = `https://api.weixin.qq.com/cgi-bin/template/get_all_private_template?access_token=${accessToken}`;
      const result = await wechatUtil.request({ url, method: 'GET' });
      
      // 更新数据库中的模板信息
      if (result.template_list && Array.isArray(result.template_list)) {
        // 获取微信服务器上存在的模板ID
        const serverTemplateIds = result.template_list.map(t => t.template_id);
        
        // 标记数据库中不存在于微信服务器的模板为无效
        for (const template of templates) {
          if (!serverTemplateIds.includes(template.templateId)) {
            await templateRepository.updateTemplateStatus(template.templateId, 'invalid');
          }
        }
        
        // 更新或添加数据库中的模板信息
        for (const serverTemplate of result.template_list) {
          const existingTemplate = templates.find(t => t.templateId === serverTemplate.template_id);
          if (existingTemplate) {
            await templateRepository.updateTemplate(existingTemplate.id, {
              title: serverTemplate.title,
              primaryIndustry: serverTemplate.primary_industry,
              deputyIndustry: serverTemplate.deputy_industry,
              content: serverTemplate.content,
              example: serverTemplate.example,
              updateTime: new Date(),
              status: 'active'
            });
          } else {
            await templateRepository.saveTemplate({
              templateId: serverTemplate.template_id,
              title: serverTemplate.title,
              primaryIndustry: serverTemplate.primary_industry,
              deputyIndustry: serverTemplate.deputy_industry,
              content: serverTemplate.content,
              example: serverTemplate.example,
              addTime: new Date(),
              status: 'active'
            });
          }
        }
        
        // 重新获取更新后的模板列表
        templates = await templateRepository.getTemplates();
      }
      
      logger.info('获取已添加的模板列表成功');
      return templates;
    } catch (error) {
      logger.error('获取已添加的模板列表失败:', error);
      throw error;
    }
  }

  /**
   * 删除模板
   * @param {string} templateId - 模板ID
   * @returns {Promise<void>}
   */
  async deleteTemplate(templateId) {
    try {
      logger.info(`开始删除模板，模板ID: ${templateId}`);
      
      // 获取access_token
      const accessToken = await wechatUtil.getAccessToken();
      
      // 调用微信API删除模板
      const url = `https://api.weixin.qq.com/cgi-bin/template/del_private_template?access_token=${accessToken}`;
      const data = {
        template_id: templateId
      };
      
      await wechatUtil.request({ url, method: 'POST', data });
      
      // 从数据库中删除模板信息
      await templateRepository.deleteTemplate(templateId);
      
      logger.info(`删除模板成功，模板ID: ${templateId}`);
    } catch (error) {
      logger.error(`删除模板失败，模板ID: ${templateId}`, error);
      throw error;
    }
  }

  /**
   * 发送模板消息
   * @param {Object} messageData - 消息数据
   * @returns {Promise<Object>} - 返回发送结果
   */
  async sendTemplateMessage(messageData) {
    try {
      logger.info(`开始发送模板消息，接收用户: ${messageData.touser}`);
      
      // 验证必要参数
      if (!messageData.touser || !messageData.template_id || !messageData.data) {
        throw new Error('缺少必要的消息参数');
      }
      
      // 获取access_token
      const accessToken = await wechatUtil.getAccessToken();
      
      // 调用微信API发送模板消息
      const url = `https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${accessToken}`;
      
      const result = await wechatUtil.request({ url, method: 'POST', data: messageData });
      
      // 保存发送记录到数据库
      const messageRecord = {
        touser: messageData.touser,
        templateId: messageData.template_id,
        messageData: JSON.stringify(messageData),
        msgId: result.msgid,
        status: result.errcode === 0 ? 'success' : 'failed',
        errorCode: result.errcode,
        errorMsg: result.errmsg,
        sendTime: new Date()
      };
      
      await templateRepository.saveMessageRecord(messageRecord);
      
      // 如果发送失败，抛出错误
      if (result.errcode !== 0) {
        throw new Error(`发送失败: ${result.errmsg}`);
      }
      
      logger.info(`模板消息发送成功，消息ID: ${result.msgid}`);
      return result;
    } catch (error) {
      logger.error(`发送模板消息失败，接收用户: ${messageData.touser}`, error);
      throw error;
    }
  }

  /**
   * 获取模板消息发送记录
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} - 返回消息记录列表
   */
  async getMessageRecords(options = {}) {
    try {
      logger.info('开始获取模板消息发送记录');
      
      const records = await templateRepository.getMessageRecords(options);
      
      logger.info(`获取模板消息发送记录成功，数量: ${records.records.length}`);
      return records;
    } catch (error) {
      logger.error('获取模板消息发送记录失败:', error);
      throw error;
    }
  }

  /**
   * 预览模板消息
   * @param {Object} messageData - 消息数据
   * @returns {Promise<Object>} - 返回预览结果
   */
  async previewTemplateMessage(messageData) {
    try {
      logger.info(`开始预览模板消息，接收用户: ${messageData.touser}`);
      
      // 验证必要参数
      if (!messageData.touser || !messageData.template_id || !messageData.data) {
        throw new Error('缺少必要的消息参数');
      }
      
      // 获取access_token
      const accessToken = await wechatUtil.getAccessToken();
      
      // 调用微信API预览模板消息
      const url = `https://api.weixin.qq.com/cgi-bin/message/template/preview?access_token=${accessToken}`;
      
      const result = await wechatUtil.request({ url, method: 'POST', data: messageData });
      
      logger.info('模板消息预览成功');
      return result;
    } catch (error) {
      logger.error(`预览模板消息失败，接收用户: ${messageData.touser}`, error);
      throw error;
    }
  }

  /**
   * 批量发送模板消息
   * @param {Object} batchData - 批量发送数据
   * @returns {Promise<Object>} - 返回发送结果统计
   */
  async batchSendTemplateMessage(batchData) {
    try {
      logger.info(`开始批量发送模板消息，用户数量: ${batchData.user_list.length}`);
      
      // 验证必要参数
      if (!batchData.template_id || !batchData.data || !batchData.user_list || !Array.isArray(batchData.user_list)) {
        throw new Error('缺少必要的批量发送参数');
      }
      
      const results = {
        total: batchData.user_list.length,
        success: 0,
        failed: 0,
        details: []
      };
      
      // 逐个发送模板消息
      for (const touser of batchData.user_list) {
        try {
          const messageData = {
            touser,
            template_id: batchData.template_id,
            data: batchData.data,
            url: batchData.url,
            miniprogram: batchData.miniprogram
          };
          
          const result = await this.sendTemplateMessage(messageData);
          
          results.success++;
          results.details.push({
            touser,
            success: true,
            msgId: result.msgid
          });
          
          // 添加延时，避免触发微信API频率限制
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          results.failed++;
          results.details.push({
            touser,
            success: false,
            error: error.message
          });
        }
      }
      
      logger.info(`批量发送模板消息完成，成功: ${results.success}，失败: ${results.failed}`);
      return results;
    } catch (error) {
      logger.error('批量发送模板消息失败:', error);
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
      logger.info('开始获取模板消息发送统计');
      
      const statistics = await templateRepository.getMessageStatistics(startTime, endTime);
      
      logger.info('获取模板消息发送统计成功');
      return statistics;
    } catch (error) {
      logger.error('获取模板消息发送统计失败:', error);
      throw error;
    }
  }
}

module.exports = new TemplateService();