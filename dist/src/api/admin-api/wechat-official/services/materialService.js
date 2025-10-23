/**
 * 公众号素材管理服务
 * 处理公众号图文、视频、语音等素材管理的业务逻辑
 */

const logger = require('../../../core/logger');
const wechatUtil = require('../../../core/utils/wechatUtil');
const materialRepository = require('../repositories/materialRepository');
const fs = require('fs');
const path = require('path');

/**
 * 公众号素材管理服务类
 */
class MaterialService {
  // 永久素材相关方法
  /**
   * 上传永久图片素材
   * @param {Object} file - 上传的文件对象
   * @returns {Promise<Object>} - 返回素材信息
   */
  async uploadPermanentImage(file) {
    try {
      logger.info('开始上传永久图片素材');
      
      // 获取access_token
      const accessToken = await wechatUtil.getAccessToken();
      
      // 调用微信API上传永久图片素材
      const url = `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${accessToken}&type=image`;
      const formData = {
        media: fs.createReadStream(file.path)
      };
      
      const result = await wechatUtil.request({ url, method: 'POST', formData });
      
      // 保存素材信息到数据库
      const materialInfo = {
        mediaId: result.media_id,
        type: 'image',
        url: result.url,
        name: file.originalname,
        size: file.size,
        createTime: new Date(),
        isPermanent: true
      };
      
      await materialRepository.saveMaterial(materialInfo);
      
      // 清理临时文件
      fs.unlinkSync(file.path);
      
      logger.info(`永久图片素材上传成功，mediaId: ${result.media_id}`);
      return result;
    } catch (error) {
      logger.error('上传永久图片素材失败:', error);
      // 清理临时文件
      if (file && file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      throw error;
    }
  }

  /**
   * 上传永久语音素材
   * @param {Object} file - 上传的文件对象
   * @param {Object} options - 素材选项
   * @returns {Promise<Object>} - 返回素材信息
   */
  async uploadPermanentVoice(file, options = {}) {
    try {
      logger.info('开始上传永久语音素材');
      
      // 获取access_token
      const accessToken = await wechatUtil.getAccessToken();
      
      // 调用微信API上传永久语音素材
      const url = `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${accessToken}&type=voice`;
      const formData = {
        media: fs.createReadStream(file.path),
        description: JSON.stringify({
          title: options.title || '',
          introduction: options.introduction || ''
        })
      };
      
      const result = await wechatUtil.request({ url, method: 'POST', formData });
      
      // 保存素材信息到数据库
      const materialInfo = {
        mediaId: result.media_id,
        type: 'voice',
        name: file.originalname,
        size: file.size,
        title: options.title,
        introduction: options.introduction,
        createTime: new Date(),
        isPermanent: true
      };
      
      await materialRepository.saveMaterial(materialInfo);
      
      // 清理临时文件
      fs.unlinkSync(file.path);
      
      logger.info(`永久语音素材上传成功，mediaId: ${result.media_id}`);
      return result;
    } catch (error) {
      logger.error('上传永久语音素材失败:', error);
      // 清理临时文件
      if (file && file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      throw error;
    }
  }

  /**
   * 上传永久视频素材
   * @param {Object} file - 上传的文件对象
   * @param {Object} options - 素材选项
   * @returns {Promise<Object>} - 返回素材信息
   */
  async uploadPermanentVideo(file, options = {}) {
    try {
      logger.info('开始上传永久视频素材');
      
      // 获取access_token
      const accessToken = await wechatUtil.getAccessToken();
      
      // 调用微信API上传永久视频素材
      const url = `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${accessToken}&type=video`;
      const formData = {
        media: fs.createReadStream(file.path),
        description: JSON.stringify({
          title: options.title || '',
          introduction: options.description || ''
        })
      };
      
      const result = await wechatUtil.request({ url, method: 'POST', formData });
      
      // 保存素材信息到数据库
      const materialInfo = {
        mediaId: result.media_id,
        type: 'video',
        url: result.url,
        name: file.originalname,
        size: file.size,
        title: options.title,
        description: options.description,
        createTime: new Date(),
        isPermanent: true
      };
      
      await materialRepository.saveMaterial(materialInfo);
      
      // 清理临时文件
      fs.unlinkSync(file.path);
      
      logger.info(`永久视频素材上传成功，mediaId: ${result.media_id}`);
      return result;
    } catch (error) {
      logger.error('上传永久视频素材失败:', error);
      // 清理临时文件
      if (file && file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      throw error;
    }
  }

  /**
   * 上传永久图文素材
   * @param {Array} articles - 图文消息数组
   * @returns {Promise<Object>} - 返回素材信息
   */
  async uploadPermanentArticle(articles) {
    try {
      logger.info('开始上传永久图文素材');
      
      // 获取access_token
      const accessToken = await wechatUtil.getAccessToken();
      
      // 调用微信API上传永久图文素材
      const url = `https://api.weixin.qq.com/cgi-bin/material/add_news?access_token=${accessToken}`;
      const data = {
        articles: Array.isArray(articles) ? articles : [articles]
      };
      
      const result = await wechatUtil.request({ url, method: 'POST', data });
      
      // 保存素材信息到数据库
      const materialInfo = {
        mediaId: result.media_id,
        type: 'news',
        articles: data.articles,
        createTime: new Date(),
        isPermanent: true
      };
      
      await materialRepository.saveMaterial(materialInfo);
      
      logger.info(`永久图文素材上传成功，mediaId: ${result.media_id}`);
      return result;
    } catch (error) {
      logger.error('上传永久图文素材失败:', error);
      throw error;
    }
  }

  /**
   * 更新图文素材
   * @param {string} mediaId - 素材ID
   * @param {number} index - 要更新的文章在图文消息中的位置
   * @param {Object} articles - 图文消息
   * @returns {Promise<void>}
   */
  async updatePermanentArticle(mediaId, index, articles) {
    try {
      logger.info(`开始更新图文素材，mediaId: ${mediaId}`);
      
      // 获取access_token
      const accessToken = await wechatUtil.getAccessToken();
      
      // 调用微信API更新图文素材
      const url = `https://api.weixin.qq.com/cgi-bin/material/update_news?access_token=${accessToken}`;
      const data = {
        media_id: mediaId,
        index: parseInt(index),
        articles: articles
      };
      
      await wechatUtil.request({ url, method: 'POST', data });
      
      // 更新数据库中的素材信息
      await materialRepository.updateMaterial(mediaId, {
        articles: articles,
        updateTime: new Date()
      });
      
      logger.info(`图文素材更新成功，mediaId: ${mediaId}`);
    } catch (error) {
      logger.error(`更新图文素材失败，mediaId: ${mediaId}`, error);
      throw error;
    }
  }

  /**
   * 获取永久素材列表
   * @param {string} type - 素材类型
   * @param {Object} options - 分页选项
   * @returns {Promise<Object>} - 返回素材列表
   */
  async getPermanentMaterials(type, options = {}) {
    try {
      logger.info(`获取永久素材列表，类型: ${type}`);
      
      // 获取access_token
      const accessToken = await wechatUtil.getAccessToken();
      
      // 调用微信API获取永久素材列表
      const url = `https://api.weixin.qq.com/cgi-bin/material/batchget_material?access_token=${accessToken}`;
      const data = {
        type: type,
        offset: options.offset || 0,
        count: options.count || 20
      };
      
      const result = await wechatUtil.request({ url, method: 'POST', data });
      
      // 如果是news类型，更新本地数据库
      if (type === 'news' && result.item) {
        for (const item of result.item) {
          await materialRepository.updateMaterial(item.media_id, {
            articles: item.content.news_item,
            updateTime: new Date()
          });
        }
      }
      
      logger.info(`获取永久素材列表成功，类型: ${type}，数量: ${result.item ? result.item.length : 0}`);
      return result;
    } catch (error) {
      logger.error(`获取永久素材列表失败，类型: ${type}`, error);
      throw error;
    }
  }

  /**
   * 获取永久素材详情
   * @param {string} mediaId - 素材ID
   * @param {string} type - 素材类型
   * @returns {Promise<Object>} - 返回素材详情
   */
  async getPermanentMaterialDetail(mediaId, type) {
    try {
      logger.info(`获取永久素材详情，mediaId: ${mediaId}`);
      
      // 获取access_token
      const accessToken = await wechatUtil.getAccessToken();
      
      // 调用微信API获取永久素材详情
      const url = `https://api.weixin.qq.com/cgi-bin/material/get_material?access_token=${accessToken}`;
      const data = {
        media_id: mediaId
      };
      
      const result = await wechatUtil.request({ url, method: 'POST', data });
      
      logger.info(`获取永久素材详情成功，mediaId: ${mediaId}`);
      return result;
    } catch (error) {
      logger.error(`获取永久素材详情失败，mediaId: ${mediaId}`, error);
      throw error;
    }
  }

  /**
   * 删除永久素材
   * @param {string} mediaId - 素材ID
   * @returns {Promise<void>}
   */
  async deletePermanentMaterial(mediaId) {
    try {
      logger.info(`删除永久素材，mediaId: ${mediaId}`);
      
      // 获取access_token
      const accessToken = await wechatUtil.getAccessToken();
      
      // 调用微信API删除永久素材
      const url = `https://api.weixin.qq.com/cgi-bin/material/del_material?access_token=${accessToken}`;
      const data = {
        media_id: mediaId
      };
      
      await wechatUtil.request({ url, method: 'POST', data });
      
      // 从数据库中删除素材信息
      await materialRepository.deleteMaterial(mediaId);
      
      logger.info(`删除永久素材成功，mediaId: ${mediaId}`);
    } catch (error) {
      logger.error(`删除永久素材失败，mediaId: ${mediaId}`, error);
      throw error;
    }
  }

  /**
   * 获取永久素材总数
   * @returns {Promise<Object>} - 返回素材总数
   */
  async getPermanentMaterialCount() {
    try {
      logger.info('获取永久素材总数');
      
      // 获取access_token
      const accessToken = await wechatUtil.getAccessToken();
      
      // 调用微信API获取永久素材总数
      const url = `https://api.weixin.qq.com/cgi-bin/material/get_materialcount?access_token=${accessToken}`;
      const result = await wechatUtil.request({ url, method: 'GET' });
      
      logger.info('获取永久素材总数成功');
      return result;
    } catch (error) {
      logger.error('获取永久素材总数失败:', error);
      throw error;
    }
  }

  // 临时素材相关方法
  /**
   * 上传临时图片素材
   * @param {Object} file - 上传的文件对象
   * @returns {Promise<Object>} - 返回素材信息
   */
  async uploadTemporaryImage(file) {
    try {
      logger.info('开始上传临时图片素材');
      
      // 获取access_token
      const accessToken = await wechatUtil.getAccessToken();
      
      // 调用微信API上传临时图片素材
      const url = `https://api.weixin.qq.com/cgi-bin/media/upload?access_token=${accessToken}&type=image`;
      const formData = {
        media: fs.createReadStream(file.path)
      };
      
      const result = await wechatUtil.request({ url, method: 'POST', formData });
      
      // 保存素材信息到数据库
      const materialInfo = {
        mediaId: result.media_id,
        type: 'image',
        name: file.originalname,
        size: file.size,
        createTime: new Date(),
        expiresIn: result.expires_in,
        isPermanent: false
      };
      
      await materialRepository.saveMaterial(materialInfo);
      
      // 清理临时文件
      fs.unlinkSync(file.path);
      
      logger.info(`临时图片素材上传成功，mediaId: ${result.media_id}`);
      return result;
    } catch (error) {
      logger.error('上传临时图片素材失败:', error);
      // 清理临时文件
      if (file && file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      throw error;
    }
  }

  /**
   * 上传临时语音素材
   * @param {Object} file - 上传的文件对象
   * @returns {Promise<Object>} - 返回素材信息
   */
  async uploadTemporaryVoice(file) {
    try {
      logger.info('开始上传临时语音素材');
      
      // 获取access_token
      const accessToken = await wechatUtil.getAccessToken();
      
      // 调用微信API上传临时语音素材
      const url = `https://api.weixin.qq.com/cgi-bin/media/upload?access_token=${accessToken}&type=voice`;
      const formData = {
        media: fs.createReadStream(file.path)
      };
      
      const result = await wechatUtil.request({ url, method: 'POST', formData });
      
      // 保存素材信息到数据库
      const materialInfo = {
        mediaId: result.media_id,
        type: 'voice',
        name: file.originalname,
        size: file.size,
        createTime: new Date(),
        expiresIn: result.expires_in,
        isPermanent: false
      };
      
      await materialRepository.saveMaterial(materialInfo);
      
      // 清理临时文件
      fs.unlinkSync(file.path);
      
      logger.info(`临时语音素材上传成功，mediaId: ${result.media_id}`);
      return result;
    } catch (error) {
      logger.error('上传临时语音素材失败:', error);
      // 清理临时文件
      if (file && file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      throw error;
    }
  }

  /**
   * 上传临时视频素材
   * @param {Object} file - 上传的文件对象
   * @returns {Promise<Object>} - 返回素材信息
   */
  async uploadTemporaryVideo(file) {
    try {
      logger.info('开始上传临时视频素材');
      
      // 获取access_token
      const accessToken = await wechatUtil.getAccessToken();
      
      // 调用微信API上传临时视频素材
      const url = `https://api.weixin.qq.com/cgi-bin/media/upload?access_token=${accessToken}&type=video`;
      const formData = {
        media: fs.createReadStream(file.path)
      };
      
      const result = await wechatUtil.request({ url, method: 'POST', formData });
      
      // 保存素材信息到数据库
      const materialInfo = {
        mediaId: result.media_id,
        type: 'video',
        name: file.originalname,
        size: file.size,
        createTime: new Date(),
        expiresIn: result.expires_in,
        isPermanent: false
      };
      
      await materialRepository.saveMaterial(materialInfo);
      
      // 清理临时文件
      fs.unlinkSync(file.path);
      
      logger.info(`临时视频素材上传成功，mediaId: ${result.media_id}`);
      return result;
    } catch (error) {
      logger.error('上传临时视频素材失败:', error);
      // 清理临时文件
      if (file && file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      throw error;
    }
  }

  /**
   * 上传临时缩略图
   * @param {Object} file - 上传的文件对象
   * @returns {Promise<Object>} - 返回素材信息
   */
  async uploadTemporaryThumb(file) {
    try {
      logger.info('开始上传临时缩略图');
      
      // 获取access_token
      const accessToken = await wechatUtil.getAccessToken();
      
      // 调用微信API上传临时缩略图
      const url = `https://api.weixin.qq.com/cgi-bin/media/upload?access_token=${accessToken}&type=thumb`;
      const formData = {
        media: fs.createReadStream(file.path)
      };
      
      const result = await wechatUtil.request({ url, method: 'POST', formData });
      
      // 保存素材信息到数据库
      const materialInfo = {
        mediaId: result.media_id,
        type: 'thumb',
        name: file.originalname,
        size: file.size,
        createTime: new Date(),
        expiresIn: result.expires_in,
        isPermanent: false
      };
      
      await materialRepository.saveMaterial(materialInfo);
      
      // 清理临时文件
      fs.unlinkSync(file.path);
      
      logger.info(`临时缩略图上传成功，mediaId: ${result.media_id}`);
      return result;
    } catch (error) {
      logger.error('上传临时缩略图失败:', error);
      // 清理临时文件
      if (file && file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      throw error;
    }
  }

  /**
   * 获取临时素材
   * @param {string} mediaId - 素材ID
   * @param {string} type - 素材类型
   * @returns {Promise<Object|Buffer>} - 返回素材数据
   */
  async getTemporaryMaterial(mediaId, type) {
    try {
      logger.info(`获取临时素材，mediaId: ${mediaId}`);
      
      // 获取access_token
      const accessToken = await wechatUtil.getAccessToken();
      
      // 调用微信API获取临时素材
      const url = `https://api.weixin.qq.com/cgi-bin/media/get?access_token=${accessToken}&media_id=${mediaId}`;
      
      // 对于视频类型，微信返回的是JSON对象
      if (type === 'video') {
        const result = await wechatUtil.request({ url, method: 'GET' });
        logger.info(`获取临时视频素材成功，mediaId: ${mediaId}`);
        return result;
      }
      
      // 对于其他类型，微信返回的是二进制数据
      const result = await wechatUtil.requestBinary({ url, method: 'GET' });
      logger.info(`获取临时素材成功，mediaId: ${mediaId}`);
      return result;
    } catch (error) {
      logger.error(`获取临时素材失败，mediaId: ${mediaId}`, error);
      throw error;
    }
  }

  /**
   * 上传图文消息内的图片
   * @param {Object} file - 上传的文件对象
   * @returns {Promise<Object>} - 返回图片URL
   */
  async uploadArticleImage(file) {
    try {
      logger.info('开始上传图文消息内的图片');
      
      // 获取access_token
      const accessToken = await wechatUtil.getAccessToken();
      
      // 调用微信API上传图文消息内的图片
      const url = `https://api.weixin.qq.com/cgi-bin/media/uploadimg?access_token=${accessToken}`;
      const formData = {
        media: fs.createReadStream(file.path)
      };
      
      const result = await wechatUtil.request({ url, method: 'POST', formData });
      
      // 清理临时文件
      fs.unlinkSync(file.path);
      
      logger.info('图文消息内图片上传成功');
      return result;
    } catch (error) {
      logger.error('上传图文消息内的图片失败:', error);
      // 清理临时文件
      if (file && file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      throw error;
    }
  }

  /**
   * 批量上传图片
   * @param {Array} files - 文件对象数组
   * @returns {Promise<Array>} - 返回图片URL数组
   */
  async batchUploadImages(files) {
    try {
      logger.info(`开始批量上传图片，数量: ${files.length}`);
      
      const results = [];
      
      for (const file of files) {
        try {
          const result = await this.uploadArticleImage(file);
          results.push({
            success: true,
            url: result.url,
            name: file.originalname
          });
        } catch (error) {
          logger.error(`批量上传图片失败，文件: ${file.originalname}`, error);
          results.push({
            success: false,
            name: file.originalname,
            error: error.message
          });
        }
      }
      
      logger.info('批量上传图片完成');
      return results;
    } catch (error) {
      logger.error('批量上传图片失败:', error);
      throw error;
    }
  }
}

module.exports = new MaterialService();