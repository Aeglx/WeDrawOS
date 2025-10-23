/**
 * 内容管理控制器
 * 处理公告、帮助中心、知识库等内容管理相关的API请求
 */

const logger = require('../../../core/logger');
const contentService = require('../services/contentService');

/**
 * 内容管理控制器类
 */
class ContentController {
  /**
   * 创建公告
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件函数
   */
  async createAnnouncement(req, res, next) {
    try {
      const announcementData = req.body;
      const result = await contentService.createAnnouncement(announcementData);
      res.status(201).json({
        success: true,
        message: '公告创建成功',
        data: result
      });
    } catch (error) {
      logger.error('创建公告失败:', error);
      next(error);
    }
  }

  /**
   * 获取公告列表
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件函数
   */
  async getAnnouncements(req, res, next) {
    try {
      const { page = 1, pageSize = 10, status } = req.query;
      const result = await contentService.getAnnouncements({
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        status
      });
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('获取公告列表失败:', error);
      next(error);
    }
  }

  /**
   * 获取公告详情
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件函数
   */
  async getAnnouncementDetail(req, res, next) {
    try {
      const { id } = req.params;
      const announcement = await contentService.getAnnouncementById(id);
      if (!announcement) {
        return res.status(404).json({
          success: false,
          message: '公告不存在'
        });
      }
      res.json({
        success: true,
        data: announcement
      });
    } catch (error) {
      logger.error('获取公告详情失败:', error);
      next(error);
    }
  }

  /**
   * 更新公告
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件函数
   */
  async updateAnnouncement(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const result = await contentService.updateAnnouncement(id, updateData);
      res.json({
        success: true,
        message: '公告更新成功',
        data: result
      });
    } catch (error) {
      logger.error('更新公告失败:', error);
      next(error);
    }
  }

  /**
   * 删除公告
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件函数
   */
  async deleteAnnouncement(req, res, next) {
    try {
      const { id } = req.params;
      await contentService.deleteAnnouncement(id);
      res.json({
        success: true,
        message: '公告删除成功'
      });
    } catch (error) {
      logger.error('删除公告失败:', error);
      next(error);
    }
  }

  /**
   * 创建帮助文章
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件函数
   */
  async createHelpArticle(req, res, next) {
    try {
      const articleData = req.body;
      const result = await contentService.createHelpArticle(articleData);
      res.status(201).json({
        success: true,
        message: '帮助文章创建成功',
        data: result
      });
    } catch (error) {
      logger.error('创建帮助文章失败:', error);
      next(error);
    }
  }

  /**
   * 获取帮助文章列表
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件函数
   */
  async getHelpArticles(req, res, next) {
    try {
      const { page = 1, pageSize = 10, category, keyword } = req.query;
      const result = await contentService.getHelpArticles({
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        category,
        keyword
      });
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('获取帮助文章列表失败:', error);
      next(error);
    }
  }

  /**
   * 获取帮助文章详情
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件函数
   */
  async getHelpArticleDetail(req, res, next) {
    try {
      const { id } = req.params;
      const article = await contentService.getHelpArticleById(id);
      if (!article) {
        return res.status(404).json({
          success: false,
          message: '帮助文章不存在'
        });
      }
      res.json({
        success: true,
        data: article
      });
    } catch (error) {
      logger.error('获取帮助文章详情失败:', error);
      next(error);
    }
  }

  /**
   * 更新帮助文章
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件函数
   */
  async updateHelpArticle(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const result = await contentService.updateHelpArticle(id, updateData);
      res.json({
        success: true,
        message: '帮助文章更新成功',
        data: result
      });
    } catch (error) {
      logger.error('更新帮助文章失败:', error);
      next(error);
    }
  }

  /**
   * 删除帮助文章
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件函数
   */
  async deleteHelpArticle(req, res, next) {
    try {
      const { id } = req.params;
      await contentService.deleteHelpArticle(id);
      res.json({
        success: true,
        message: '帮助文章删除成功'
      });
    } catch (error) {
      logger.error('删除帮助文章失败:', error);
      next(error);
    }
  }

  /**
   * 创建知识库文档
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件函数
   */
  async createKnowledgeDoc(req, res, next) {
    try {
      const docData = req.body;
      const result = await contentService.createKnowledgeDoc(docData);
      res.status(201).json({
        success: true,
        message: '知识库文档创建成功',
        data: result
      });
    } catch (error) {
      logger.error('创建知识库文档失败:', error);
      next(error);
    }
  }

  /**
   * 获取知识库文档列表
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件函数
   */
  async getKnowledgeDocs(req, res, next) {
    try {
      const { page = 1, pageSize = 10, category, tag } = req.query;
      const result = await contentService.getKnowledgeDocs({
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        category,
        tag
      });
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('获取知识库文档列表失败:', error);
      next(error);
    }
  }

  /**
   * 获取知识库文档详情
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件函数
   */
  async getKnowledgeDocDetail(req, res, next) {
    try {
      const { id } = req.params;
      const doc = await contentService.getKnowledgeDocById(id);
      if (!doc) {
        return res.status(404).json({
          success: false,
          message: '知识库文档不存在'
        });
      }
      res.json({
        success: true,
        data: doc
      });
    } catch (error) {
      logger.error('获取知识库文档详情失败:', error);
      next(error);
    }
  }

  /**
   * 更新知识库文档
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件函数
   */
  async updateKnowledgeDoc(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const result = await contentService.updateKnowledgeDoc(id, updateData);
      res.json({
        success: true,
        message: '知识库文档更新成功',
        data: result
      });
    } catch (error) {
      logger.error('更新知识库文档失败:', error);
      next(error);
    }
  }

  /**
   * 删除知识库文档
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件函数
   */
  async deleteKnowledgeDoc(req, res, next) {
    try {
      const { id } = req.params;
      await contentService.deleteKnowledgeDoc(id);
      res.json({
        success: true,
        message: '知识库文档删除成功'
      });
    } catch (error) {
      logger.error('删除知识库文档失败:', error);
      next(error);
    }
  }
}

module.exports = new ContentController();