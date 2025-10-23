/**
 * 公众号素材管理控制器
 * 处理公众号图文、视频、语音等素材管理的API请求
 */

const logger = require('../../../core/logger');
const materialService = require('../services/materialService');

/**
 * 公众号素材管理控制器类
 */
class MaterialController {
  // 永久素材相关方法
  /**
   * 上传永久图片素材
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express中间件回调函数
   */
  async uploadPermanentImage(req, res, next) {
    try {
      // 文件上传逻辑在中间件中处理
      const result = await materialService.uploadPermanentImage(req.file);
      res.status(201).json({
        success: true,
        message: '永久图片素材上传成功',
        data: result
      });
    } catch (error) {
      logger.error('上传永久图片素材失败:', error);
      next(error);
    }
  }

  /**
   * 上传永久语音素材
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express中间件回调函数
   */
  async uploadPermanentVoice(req, res, next) {
    try {
      const { title, introduction } = req.body;
      const result = await materialService.uploadPermanentVoice(req.file, {
        title,
        introduction
      });
      res.status(201).json({
        success: true,
        message: '永久语音素材上传成功',
        data: result
      });
    } catch (error) {
      logger.error('上传永久语音素材失败:', error);
      next(error);
    }
  }

  /**
   * 上传永久视频素材
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express中间件回调函数
   */
  async uploadPermanentVideo(req, res, next) {
    try {
      const { title, description } = req.body;
      const result = await materialService.uploadPermanentVideo(req.file, {
        title,
        description
      });
      res.status(201).json({
        success: true,
        message: '永久视频素材上传成功',
        data: result
      });
    } catch (error) {
      logger.error('上传永久视频素材失败:', error);
      next(error);
    }
  }

  /**
   * 上传永久图文素材
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express中间件回调函数
   */
  async uploadPermanentArticle(req, res, next) {
    try {
      const articles = req.body;
      const result = await materialService.uploadPermanentArticle(articles);
      res.status(201).json({
        success: true,
        message: '永久图文素材上传成功',
        data: result
      });
    } catch (error) {
      logger.error('上传永久图文素材失败:', error);
      next(error);
    }
  }

  /**
   * 更新图文素材
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express中间件回调函数
   */
  async updatePermanentArticle(req, res, next) {
    try {
      const { mediaId } = req.params;
      const { index, articles } = req.body;
      await materialService.updatePermanentArticle(mediaId, index, articles);
      res.json({
        success: true,
        message: '图文素材更新成功'
      });
    } catch (error) {
      logger.error('更新图文素材失败:', error);
      next(error);
    }
  }

  /**
   * 获取永久素材列表
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express中间件回调函数
   */
  async getPermanentMaterials(req, res, next) {
    try {
      const { type, offset = 0, count = 20 } = req.query;
      const result = await materialService.getPermanentMaterials(type, {
        offset: parseInt(offset),
        count: parseInt(count)
      });
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('获取永久素材列表失败:', error);
      next(error);
    }
  }

  /**
   * 获取永久素材详情
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express中间件回调函数
   */
  async getPermanentMaterialDetail(req, res, next) {
    try {
      const { mediaId } = req.params;
      const { type } = req.query;
      const material = await materialService.getPermanentMaterialDetail(mediaId, type);
      res.json({
        success: true,
        data: material
      });
    } catch (error) {
      logger.error('获取永久素材详情失败:', error);
      next(error);
    }
  }

  /**
   * 删除永久素材
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express中间件回调函数
   */
  async deletePermanentMaterial(req, res, next) {
    try {
      const { mediaId } = req.params;
      await materialService.deletePermanentMaterial(mediaId);
      res.json({
        success: true,
        message: '永久素材删除成功'
      });
    } catch (error) {
      logger.error('删除永久素材失败:', error);
      next(error);
    }
  }

  /**
   * 获取永久素材总数
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express中间件回调函数
   */
  async getPermanentMaterialCount(req, res, next) {
    try {
      const count = await materialService.getPermanentMaterialCount();
      res.json({
        success: true,
        data: count
      });
    } catch (error) {
      logger.error('获取永久素材总数失败:', error);
      next(error);
    }
  }

  // 临时素材相关方法
  /**
   * 上传临时图片素材
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express中间件回调函数
   */
  async uploadTemporaryImage(req, res, next) {
    try {
      const result = await materialService.uploadTemporaryImage(req.file);
      res.status(201).json({
        success: true,
        message: '临时图片素材上传成功',
        data: result
      });
    } catch (error) {
      logger.error('上传临时图片素材失败:', error);
      next(error);
    }
  }

  /**
   * 上传临时语音素材
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express中间件回调函数
   */
  async uploadTemporaryVoice(req, res, next) {
    try {
      const result = await materialService.uploadTemporaryVoice(req.file);
      res.status(201).json({
        success: true,
        message: '临时语音素材上传成功',
        data: result
      });
    } catch (error) {
      logger.error('上传临时语音素材失败:', error);
      next(error);
    }
  }

  /**
   * 上传临时视频素材
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express中间件回调函数
   */
  async uploadTemporaryVideo(req, res, next) {
    try {
      const result = await materialService.uploadTemporaryVideo(req.file);
      res.status(201).json({
        success: true,
        message: '临时视频素材上传成功',
        data: result
      });
    } catch (error) {
      logger.error('上传临时视频素材失败:', error);
      next(error);
    }
  }

  /**
   * 上传临时缩略图
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express中间件回调函数
   */
  async uploadTemporaryThumb(req, res, next) {
    try {
      const result = await materialService.uploadTemporaryThumb(req.file);
      res.status(201).json({
        success: true,
        message: '临时缩略图上传成功',
        data: result
      });
    } catch (error) {
      logger.error('上传临时缩略图失败:', error);
      next(error);
    }
  }

  /**
   * 获取临时素材
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express中间件回调函数
   */
  async getTemporaryMaterial(req, res, next) {
    try {
      const { mediaId } = req.params;
      const { type } = req.query;
      const material = await materialService.getTemporaryMaterial(mediaId, type);
      
      // 根据素材类型返回不同格式的响应
      if (type === 'image') {
        // 对于图片，设置正确的Content-Type并返回图片数据
        res.set('Content-Type', 'image/jpeg');
        res.send(material);
      } else if (type === 'video') {
        // 对于视频，返回JSON格式的视频URL
        res.json({
          success: true,
          data: material
        });
      } else {
        // 对于其他类型，直接返回数据
        res.send(material);
      }
    } catch (error) {
      logger.error('获取临时素材失败:', error);
      next(error);
    }
  }

  // 图文消息相关方法
  /**
   * 上传图文消息内的图片
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express中间件回调函数
   */
  async uploadArticleImage(req, res, next) {
    try {
      const result = await materialService.uploadArticleImage(req.file);
      res.status(201).json({
        success: true,
        message: '图文消息图片上传成功',
        data: result
      });
    } catch (error) {
      logger.error('上传图文消息图片失败:', error);
      next(error);
    }
  }

  /**
   * 批量上传图片
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express中间件回调函数
   */
  async batchUploadImages(req, res, next) {
    try {
      const results = await materialService.batchUploadImages(req.files);
      res.status(201).json({
        success: true,
        message: '批量图片上传成功',
        data: results
      });
    } catch (error) {
      logger.error('批量上传图片失败:', error);
      next(error);
    }
  }
}

module.exports = new MaterialController();