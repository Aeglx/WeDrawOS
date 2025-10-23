/**
 * 企业微信工具类
 * 提供与企业微信API交互的核心功能
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const logger = require('../core/logger');
const config = require('../config/wechatWorkConfig');

/**
 * 企业微信工具类
 */
class WechatWorkUtil {
  constructor() {
    this.accessToken = null;
    this.accessTokenExpireTime = 0;
  }

  /**
   * 获取访问令牌
   * @returns {Promise<string>} - 返回访问令牌
   */
  async getAccessToken() {
    try {
      // 检查令牌是否有效
      const now = Date.now();
      if (this.accessToken && now < this.accessTokenExpireTime) {
        return this.accessToken;
      }

      logger.info('获取企业微信访问令牌');
      const url = `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${config.corpid}&corpsecret=${config.corpsecret}`;
      const response = await axios.get(url);

      if (response.data.errcode !== 0) {
        logger.error(`获取访问令牌失败: ${response.data.errmsg}`);
        throw new Error(`获取访问令牌失败: ${response.data.errmsg}`);
      }

      this.accessToken = response.data.access_token;
      // 设置过期时间，提前10分钟刷新
      this.accessTokenExpireTime = now + (response.data.expires_in - 600) * 1000;

      logger.info('获取企业微信访问令牌成功');
      return this.accessToken;
    } catch (error) {
      logger.error('获取企业微信访问令牌异常:', error);
      throw error;
    }
  }

  /**
   * 获取外部群列表
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} - 返回群组列表
   */
  async getExternalGroupList(options = {}) {
    try {
      const accessToken = await this.getAccessToken();
      const url = `https://qyapi.weixin.qq.com/cgi-bin/externalcontact/groupchat/list?access_token=${accessToken}`;
      
      const requestData = {
        offset: options.offset || 0,
        limit: options.limit || 100
      };
      
      // 如果有开始时间和结束时间，添加到请求参数
      if (options.startTime && options.endTime) {
        requestData.start_time = options.startTime;
        requestData.end_time = options.endTime;
      }
      
      // 如果指定了群主，添加到请求参数
      if (options.ownerFilter) {
        requestData.owner_filter = options.ownerFilter;
      }
      
      const response = await axios.post(url, requestData);
      
      if (response.data.errcode !== 0) {
        logger.error(`获取外部群列表失败: ${response.data.errmsg}`);
        throw new Error(`获取外部群列表失败: ${response.data.errmsg}`);
      }
      
      logger.info(`获取外部群列表成功，数量: ${response.data.group_chat_list?.length || 0}`);
      return response.data;
    } catch (error) {
      logger.error('获取外部群列表异常:', error);
      throw error;
    }
  }

  /**
   * 获取外部群详情
   * @param {string} chatId - 群聊ID
   * @returns {Promise<Object>} - 返回群组详情
   */
  async getExternalGroupDetail(chatId) {
    try {
      const accessToken = await this.getAccessToken();
      const url = `https://qyapi.weixin.qq.com/cgi-bin/externalcontact/groupchat/get?access_token=${accessToken}`;
      
      const response = await axios.post(url, {
        chat_id: chatId
      });
      
      if (response.data.errcode !== 0) {
        logger.error(`获取外部群详情失败: ${response.data.errmsg}`);
        throw new Error(`获取外部群详情失败: ${response.data.errmsg}`);
      }
      
      logger.info(`获取外部群详情成功，群聊ID: ${chatId}`);
      return response.data.group_chat;
    } catch (error) {
      logger.error(`获取外部群详情异常，群聊ID: ${chatId}`, error);
      throw error;
    }
  }

  /**
   * 发送外部群消息
   * @param {string} chatId - 群聊ID
   * @param {Object} messageData - 消息数据
   * @returns {Promise<Object>} - 返回发送结果
   */
  async sendExternalGroupMessage(chatId, messageData) {
    try {
      const accessToken = await this.getAccessToken();
      const url = `https://qyapi.weixin.qq.com/cgi-bin/externalcontact/send?access_token=${accessToken}`;
      
      const requestData = {
        chatid: chatId,
        ...messageData
      };
      
      const response = await axios.post(url, requestData);
      
      logger.info(`发送外部群消息，群聊ID: ${chatId}，消息类型: ${messageData.msgtype}，结果: ${response.data.errcode === 0 ? '成功' : '失败'}`);
      return response.data;
    } catch (error) {
      logger.error(`发送外部群消息异常，群聊ID: ${chatId}`, error);
      throw error;
    }
  }

  /**
   * 上传外部群聊媒体文件
   * @param {string} mediaType - 媒体类型
   * @param {string|Buffer} fileData - 文件数据或文件路径
   * @param {string} filename - 文件名（可选）
   * @returns {Promise<Object>} - 返回上传结果
   */
  async uploadExternalChatMedia(mediaType, fileData, filename = null) {
    try {
      const accessToken = await this.getAccessToken();
      const url = `https://qyapi.weixin.qq.com/cgi-bin/media/upload?access_token=${accessToken}&type=${mediaType}`;
      
      const formData = new FormData();
      
      // 处理文件数据
      if (typeof fileData === 'string' && fs.existsSync(fileData)) {
        // 如果是文件路径
        formData.append('media', fs.createReadStream(fileData));
      } else if (Buffer.isBuffer(fileData)) {
        // 如果是Buffer
        formData.append('media', fileData, {
          filename: filename || `upload.${mediaType}`,
          contentType: this.getMediaType(mediaType)
        });
      } else {
        throw new Error('文件数据必须是文件路径或Buffer');
      }
      
      const response = await axios.post(url, formData, {
        headers: formData.getHeaders(),
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });
      
      if (response.data.errcode !== 0) {
        logger.error(`上传媒体文件失败: ${response.data.errmsg}`);
        throw new Error(`上传媒体文件失败: ${response.data.errmsg}`);
      }
      
      logger.info(`上传媒体文件成功，媒体ID: ${response.data.media_id}`);
      return response.data;
    } catch (error) {
      logger.error(`上传媒体文件异常，类型: ${mediaType}`, error);
      throw error;
    }
  }

  /**
   * 获取群聊天记录
   * @param {string} chatId - 群聊ID
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} - 返回聊天记录
   */
  async getGroupChatRecords(chatId, options = {}) {
    try {
      const accessToken = await this.getAccessToken();
      const url = `https://qyapi.weixin.qq.com/cgi-bin/externalcontact/groupchat/roommsg?access_token=${accessToken}`;
      
      const requestData = {
        roomid: chatId,
        limit: options.limit || 50
      };
      
      // 添加分页游标
      if (options.cursor) {
        requestData.cursor = options.cursor;
      }
      
      // 添加时间范围
      if (options.startTime) {
        requestData.start_time = Math.floor(options.startTime / 1000);
      }
      if (options.endTime) {
        requestData.end_time = Math.floor(options.endTime / 1000);
      }
      
      const response = await axios.post(url, requestData);
      
      if (response.data.errcode !== 0) {
        logger.error(`获取群聊天记录失败: ${response.data.errmsg}`);
        throw new Error(`获取群聊天记录失败: ${response.data.errmsg}`);
      }
      
      logger.info(`获取群聊天记录成功，群聊ID: ${chatId}，记录数量: ${response.data.msg_list?.length || 0}`);
      return response.data;
    } catch (error) {
      logger.error(`获取群聊天记录异常，群聊ID: ${chatId}`, error);
      throw error;
    }
  }

  /**
   * 获取部门列表
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} - 返回部门列表
   */
  async getDepartmentList(options = {}) {
    try {
      const accessToken = await this.getAccessToken();
      let url = `https://qyapi.weixin.qq.com/cgi-bin/department/list?access_token=${accessToken}`;
      
      if (options.id) {
        url += `&id=${options.id}`;
      }
      
      const response = await axios.get(url);
      
      if (response.data.errcode !== 0) {
        logger.error(`获取部门列表失败: ${response.data.errmsg}`);
        throw new Error(`获取部门列表失败: ${response.data.errmsg}`);
      }
      
      logger.info(`获取部门列表成功，数量: ${response.data.department?.length || 0}`);
      return response.data;
    } catch (error) {
      logger.error('获取部门列表异常:', error);
      throw error;
    }
  }

  /**
   * 获取成员详情
   * @param {string} userId - 用户ID
   * @returns {Promise<Object>} - 返回成员详情
   */
  async getUserDetail(userId) {
    try {
      const accessToken = await this.getAccessToken();
      const url = `https://qyapi.weixin.qq.com/cgi-bin/user/get?access_token=${accessToken}&userid=${userId}`;
      
      const response = await axios.get(url);
      
      if (response.data.errcode !== 0) {
        logger.error(`获取成员详情失败: ${response.data.errmsg}`);
        throw new Error(`获取成员详情失败: ${response.data.errmsg}`);
      }
      
      logger.info(`获取成员详情成功，用户ID: ${userId}`);
      return response.data;
    } catch (error) {
      logger.error(`获取成员详情异常，用户ID: ${userId}`, error);
      throw error;
    }
  }

  /**
   * 获取标签列表
   * @returns {Promise<Object>} - 返回标签列表
   */
  async getTagList() {
    try {
      const accessToken = await this.getAccessToken();
      const url = `https://qyapi.weixin.qq.com/cgi-bin/externalcontact/get_corp_tag_list?access_token=${accessToken}`;
      
      const response = await axios.post(url, {});
      
      if (response.data.errcode !== 0) {
        logger.error(`获取标签列表失败: ${response.data.errmsg}`);
        throw new Error(`获取标签列表失败: ${response.data.errmsg}`);
      }
      
      logger.info(`获取标签列表成功`);
      return response.data;
    } catch (error) {
      logger.error('获取标签列表异常:', error);
      throw error;
    }
  }

  /**
   * 刷新外部联系人
   * @param {Array} userIds - 用户ID数组
   * @returns {Promise<Object>} - 返回刷新结果
   */
  async refreshExternalContact(userIds) {
    try {
      const accessToken = await this.getAccessToken();
      const url = `https://qyapi.weixin.qq.com/cgi-bin/externalcontact/batch/get_by_user?access_token=${accessToken}`;
      
      const response = await axios.post(url, {
        userid_list: userIds
      });
      
      if (response.data.errcode !== 0) {
        logger.error(`刷新外部联系人失败: ${response.data.errmsg}`);
        throw new Error(`刷新外部联系人失败: ${response.data.errmsg}`);
      }
      
      logger.info(`刷新外部联系人成功，用户数量: ${userIds.length}`);
      return response.data;
    } catch (error) {
      logger.error('刷新外部联系人异常:', error);
      throw error;
    }
  }

  /**
   * 创建自定义菜单
   * @param {Object} menuData - 菜单数据
   * @returns {Promise<Object>} - 返回创建结果
   */
  async createMenu(menuData) {
    try {
      const accessToken = await this.getAccessToken();
      const url = `https://qyapi.weixin.qq.com/cgi-bin/menu/create?access_token=${accessToken}&agentid=${config.agentid}`;
      
      const response = await axios.post(url, menuData);
      
      if (response.data.errcode !== 0) {
        logger.error(`创建自定义菜单失败: ${response.data.errmsg}`);
        throw new Error(`创建自定义菜单失败: ${response.data.errmsg}`);
      }
      
      logger.info('创建自定义菜单成功');
      return response.data;
    } catch (error) {
      logger.error('创建自定义菜单异常:', error);
      throw error;
    }
  }

  /**
   * 获取自定义菜单
   * @returns {Promise<Object>} - 返回菜单信息
   */
  async getMenu() {
    try {
      const accessToken = await this.getAccessToken();
      const url = `https://qyapi.weixin.qq.com/cgi-bin/menu/get?access_token=${accessToken}&agentid=${config.agentid}`;
      
      const response = await axios.get(url);
      
      if (response.data.errcode !== 0) {
        logger.error(`获取自定义菜单失败: ${response.data.errmsg}`);
        throw new Error(`获取自定义菜单失败: ${response.data.errmsg}`);
      }
      
      logger.info('获取自定义菜单成功');
      return response.data;
    } catch (error) {
      logger.error('获取自定义菜单异常:', error);
      throw error;
    }
  }

  /**
   * 删除自定义菜单
   * @returns {Promise<Object>} - 返回删除结果
   */
  async deleteMenu() {
    try {
      const accessToken = await this.getAccessToken();
      const url = `https://qyapi.weixin.qq.com/cgi-bin/menu/delete?access_token=${accessToken}&agentid=${config.agentid}`;
      
      const response = await axios.get(url);
      
      if (response.data.errcode !== 0) {
        logger.error(`删除自定义菜单失败: ${response.data.errmsg}`);
        throw new Error(`删除自定义菜单失败: ${response.data.errmsg}`);
      }
      
      logger.info('删除自定义菜单成功');
      return response.data;
    } catch (error) {
      logger.error('删除自定义菜单异常:', error);
      throw error;
    }
  }

  /**
   * 发送应用消息
   * @param {Object} messageData - 消息数据
   * @returns {Promise<Object>} - 返回发送结果
   */
  async sendApplicationMessage(messageData) {
    try {
      const accessToken = await this.getAccessToken();
      const url = `https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${accessToken}`;
      
      const requestData = {
        agentid: config.agentid,
        ...messageData
      };
      
      const response = await axios.post(url, requestData);
      
      if (response.data.errcode !== 0) {
        logger.error(`发送应用消息失败: ${response.data.errmsg}`);
        throw new Error(`发送应用消息失败: ${response.data.errmsg}`);
      }
      
      logger.info('发送应用消息成功');
      return response.data;
    } catch (error) {
      logger.error('发送应用消息异常:', error);
      throw error;
    }
  }

  /**
   * 获取媒体类型
   * @param {string} mediaType - 媒体类型
   * @returns {string} - 返回MIME类型
   * @private
   */
  getMediaType(mediaType) {
    const typeMap = {
      'image': 'image/jpeg',
      'file': 'application/octet-stream',
      'video': 'video/mp4'
    };
    return typeMap[mediaType] || 'application/octet-stream';
  }

  /**
   * 处理错误响应
   * @param {Object} error - 错误对象
   * @returns {Object} - 标准化的错误信息
   */
  handleError(error) {
    let errorMessage = '未知错误';
    let errorCode = 500;
    
    if (error.response) {
      // 服务器返回错误响应
      errorMessage = error.response.data?.errmsg || error.response.statusText;
      errorCode = error.response.data?.errcode || error.response.status;
    } else if (error.request) {
      // 请求已发送但没有收到响应
      errorMessage = '网络连接失败，请检查企业微信API连接';
    } else {
      // 请求配置出错
      errorMessage = error.message;
    }
    
    return {
      code: errorCode,
      message: errorMessage,
      originalError: error
    };
  }
}

module.exports = new WechatWorkUtil();