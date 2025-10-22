/**
 * 内容管理服务
 * 实现公告、帮助中心、知识库等内容管理相关的业务逻辑
 */

const logger = require('../../../core/logger');
const contentRepository = require('../repositories/contentRepository');

/**
 * 内容管理服务类
 */
class ContentService {
  // 公告相关方法
  async createAnnouncement(data) {
    try {
      // 添加创建时间和更新时间
      const announcementData = {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const result = await contentRepository.createAnnouncement(announcementData);
      logger.info(`公告创建成功: ${result.id}`);
      return result;
    } catch (error) {
      logger.error('创建公告失败:', error);
      throw error;
    }
  }

  async getAnnouncements(params) {
    try {
      const { page, pageSize, status } = params;
      const whereCondition = status ? { status } : {};
      
      const announcements = await contentRepository.getAnnouncements({
        page,
        pageSize,
        where: whereCondition,
        orderBy: { createdAt: 'desc' }
      });
      
      const total = await contentRepository.countAnnouncements(whereCondition);
      
      return {
        list: announcements,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      };
    } catch (error) {
      logger.error('获取公告列表失败:', error);
      throw error;
    }
  }

  async getAnnouncementById(id) {
    try {
      return await contentRepository.getAnnouncementById(id);
    } catch (error) {
      logger.error(`获取公告详情失败: ${id}`, error);
      throw error;
    }
  }

  async updateAnnouncement(id, data) {
    try {
      // 更新更新时间
      const updateData = {
        ...data,
        updatedAt: new Date()
      };
      
      const result = await contentRepository.updateAnnouncement(id, updateData);
      logger.info(`公告更新成功: ${id}`);
      return result;
    } catch (error) {
      logger.error(`更新公告失败: ${id}`, error);
      throw error;
    }
  }

  async deleteAnnouncement(id) {
    try {
      await contentRepository.deleteAnnouncement(id);
      logger.info(`公告删除成功: ${id}`);
    } catch (error) {
      logger.error(`删除公告失败: ${id}`, error);
      throw error;
    }
  }

  // 帮助文章相关方法
  async createHelpArticle(data) {
    try {
      // 添加创建时间和更新时间
      const articleData = {
        ...data,
        viewCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const result = await contentRepository.createHelpArticle(articleData);
      logger.info(`帮助文章创建成功: ${result.id}`);
      return result;
    } catch (error) {
      logger.error('创建帮助文章失败:', error);
      throw error;
    }
  }

  async getHelpArticles(params) {
    try {
      const { page, pageSize, category, keyword } = params;
      const whereCondition = {};
      
      if (category) {
        whereCondition.category = category;
      }
      
      if (keyword) {
        whereCondition.keyword = keyword;
      }
      
      const articles = await contentRepository.getHelpArticles({
        page,
        pageSize,
        where: whereCondition,
        orderBy: { updatedAt: 'desc' }
      });
      
      const total = await contentRepository.countHelpArticles(whereCondition);
      
      return {
        list: articles,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      };
    } catch (error) {
      logger.error('获取帮助文章列表失败:', error);
      throw error;
    }
  }

  async getHelpArticleById(id) {
    try {
      // 获取文章并增加浏览量
      const article = await contentRepository.getHelpArticleById(id);
      if (article) {
        await contentRepository.incrementHelpArticleViewCount(id);
      }
      return article;
    } catch (error) {
      logger.error(`获取帮助文章详情失败: ${id}`, error);
      throw error;
    }
  }

  async updateHelpArticle(id, data) {
    try {
      // 更新更新时间
      const updateData = {
        ...data,
        updatedAt: new Date()
      };
      
      const result = await contentRepository.updateHelpArticle(id, updateData);
      logger.info(`帮助文章更新成功: ${id}`);
      return result;
    } catch (error) {
      logger.error(`更新帮助文章失败: ${id}`, error);
      throw error;
    }
  }

  async deleteHelpArticle(id) {
    try {
      await contentRepository.deleteHelpArticle(id);
      logger.info(`帮助文章删除成功: ${id}`);
    } catch (error) {
      logger.error(`删除帮助文章失败: ${id}`, error);
      throw error;
    }
  }

  // 知识库文档相关方法
  async createKnowledgeDoc(data) {
    try {
      // 添加创建时间和更新时间
      const docData = {
        ...data,
        viewCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const result = await contentRepository.createKnowledgeDoc(docData);
      
      // 如果有标签，创建标签关联
      if (data.tags && data.tags.length > 0) {
        await contentRepository.createKnowledgeDocTags(result.id, data.tags);
      }
      
      logger.info(`知识库文档创建成功: ${result.id}`);
      return result;
    } catch (error) {
      logger.error('创建知识库文档失败:', error);
      throw error;
    }
  }

  async getKnowledgeDocs(params) {
    try {
      const { page, pageSize, category, tag } = params;
      const whereCondition = {};
      
      if (category) {
        whereCondition.category = category;
      }
      
      const docs = await contentRepository.getKnowledgeDocs({
        page,
        pageSize,
        where: whereCondition,
        tag,
        orderBy: { updatedAt: 'desc' }
      });
      
      const total = await contentRepository.countKnowledgeDocs(whereCondition, tag);
      
      return {
        list: docs,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      };
    } catch (error) {
      logger.error('获取知识库文档列表失败:', error);
      throw error;
    }
  }

  async getKnowledgeDocById(id) {
    try {
      // 获取文档并增加浏览量
      const doc = await contentRepository.getKnowledgeDocById(id);
      if (doc) {
        await contentRepository.incrementKnowledgeDocViewCount(id);
        // 获取文档标签
        doc.tags = await contentRepository.getKnowledgeDocTags(id);
      }
      return doc;
    } catch (error) {
      logger.error(`获取知识库文档详情失败: ${id}`, error);
      throw error;
    }
  }

  async updateKnowledgeDoc(id, data) {
    try {
      // 更新更新时间
      const updateData = {
        ...data,
        updatedAt: new Date()
      };
      
      // 移除tags字段，单独处理
      const { tags, ...updateFields } = updateData;
      
      const result = await contentRepository.updateKnowledgeDoc(id, updateFields);
      
      // 更新标签关联
      if (tags !== undefined) {
        await contentRepository.updateKnowledgeDocTags(id, tags);
      }
      
      logger.info(`知识库文档更新成功: ${id}`);
      return result;
    } catch (error) {
      logger.error(`更新知识库文档失败: ${id}`, error);
      throw error;
    }
  }

  async deleteKnowledgeDoc(id) {
    try {
      // 删除文档及其标签关联
      await contentRepository.deleteKnowledgeDoc(id);
      await contentRepository.deleteKnowledgeDocTags(id);
      logger.info(`知识库文档删除成功: ${id}`);
    } catch (error) {
      logger.error(`删除知识库文档失败: ${id}`, error);
      throw error;
    }
  }
}

module.exports = new ContentService();