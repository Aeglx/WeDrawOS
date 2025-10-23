/**
 * 内容管理仓库
 * 实现公告、帮助中心、知识库等内容管理相关的数据访问逻辑
 */

const logger = require('../../../core/logger');
const db = require('../../../core/database');

/**
 * 内容管理仓库类
 */
class ContentRepository {
  // 公告相关数据操作
  async createAnnouncement(data) {
    try {
      const [result] = await db('announcements').insert(data).returning('*');
      return result;
    } catch (error) {
      logger.error('创建公告数据失败:', error);
      throw error;
    }
  }

  async getAnnouncements(params) {
    try {
      const { page, pageSize, where, orderBy } = params;
      const offset = (page - 1) * pageSize;
      
      let query = db('announcements');
      
      // 添加查询条件
      if (where) {
        Object.entries(where).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.where(key, value);
          }
        });
      }
      
      // 添加排序
      if (orderBy) {
        Object.entries(orderBy).forEach(([field, direction]) => {
          query = query.orderBy(field, direction);
        });
      }
      
      // 添加分页
      query = query.limit(pageSize).offset(offset);
      
      return await query;
    } catch (error) {
      logger.error('获取公告列表数据失败:', error);
      throw error;
    }
  }

  async countAnnouncements(where) {
    try {
      let query = db('announcements');
      
      if (where) {
        Object.entries(where).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.where(key, value);
          }
        });
      }
      
      const result = await query.count('* as count');
      return result[0].count;
    } catch (error) {
      logger.error('统计公告数量失败:', error);
      throw error;
    }
  }

  async getAnnouncementById(id) {
    try {
      return await db('announcements').where('id', id).first();
    } catch (error) {
      logger.error(`获取公告详情数据失败: ${id}`, error);
      throw error;
    }
  }

  async updateAnnouncement(id, data) {
    try {
      const [result] = await db('announcements')
        .where('id', id)
        .update(data)
        .returning('*');
      return result;
    } catch (error) {
      logger.error(`更新公告数据失败: ${id}`, error);
      throw error;
    }
  }

  async deleteAnnouncement(id) {
    try {
      await db('announcements').where('id', id).del();
    } catch (error) {
      logger.error(`删除公告数据失败: ${id}`, error);
      throw error;
    }
  }

  // 帮助文章相关数据操作
  async createHelpArticle(data) {
    try {
      const [result] = await db('help_articles').insert(data).returning('*');
      return result;
    } catch (error) {
      logger.error('创建帮助文章数据失败:', error);
      throw error;
    }
  }

  async getHelpArticles(params) {
    try {
      const { page, pageSize, where, orderBy } = params;
      const offset = (page - 1) * pageSize;
      
      let query = db('help_articles');
      
      // 添加查询条件
      if (where) {
        Object.entries(where).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (key === 'keyword') {
              query = query.where(function() {
                this.where('title', 'ilike', `%${value}%`)
                  .orWhere('content', 'ilike', `%${value}%`);
              });
            } else {
              query = query.where(key, value);
            }
          }
        });
      }
      
      // 添加排序
      if (orderBy) {
        Object.entries(orderBy).forEach(([field, direction]) => {
          query = query.orderBy(field, direction);
        });
      }
      
      // 添加分页
      query = query.limit(pageSize).offset(offset);
      
      return await query;
    } catch (error) {
      logger.error('获取帮助文章列表数据失败:', error);
      throw error;
    }
  }

  async countHelpArticles(where) {
    try {
      let query = db('help_articles');
      
      if (where) {
        Object.entries(where).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (key === 'keyword') {
              query = query.where(function() {
                this.where('title', 'ilike', `%${value}%`)
                  .orWhere('content', 'ilike', `%${value}%`);
              });
            } else {
              query = query.where(key, value);
            }
          }
        });
      }
      
      const result = await query.count('* as count');
      return result[0].count;
    } catch (error) {
      logger.error('统计帮助文章数量失败:', error);
      throw error;
    }
  }

  async getHelpArticleById(id) {
    try {
      return await db('help_articles').where('id', id).first();
    } catch (error) {
      logger.error(`获取帮助文章详情数据失败: ${id}`, error);
      throw error;
    }
  }

  async incrementHelpArticleViewCount(id) {
    try {
      await db('help_articles')
        .where('id', id)
        .increment('viewCount', 1);
    } catch (error) {
      logger.error(`增加帮助文章浏览量失败: ${id}`, error);
      // 记录错误但不抛出，避免影响主流程
    }
  }

  async updateHelpArticle(id, data) {
    try {
      const [result] = await db('help_articles')
        .where('id', id)
        .update(data)
        .returning('*');
      return result;
    } catch (error) {
      logger.error(`更新帮助文章数据失败: ${id}`, error);
      throw error;
    }
  }

  async deleteHelpArticle(id) {
    try {
      await db('help_articles').where('id', id).del();
    } catch (error) {
      logger.error(`删除帮助文章数据失败: ${id}`, error);
      throw error;
    }
  }

  // 知识库文档相关数据操作
  async createKnowledgeDoc(data) {
    try {
      const [result] = await db('knowledge_docs').insert(data).returning('*');
      return result;
    } catch (error) {
      logger.error('创建知识库文档数据失败:', error);
      throw error;
    }
  }

  async getKnowledgeDocs(params) {
    try {
      const { page, pageSize, where, tag, orderBy } = params;
      const offset = (page - 1) * pageSize;
      
      let query = db('knowledge_docs').select('knowledge_docs.*');
      
      // 如果有标签过滤，使用联表查询
      if (tag) {
        query = query
          .join('knowledge_doc_tags', 'knowledge_docs.id', '=', 'knowledge_doc_tags.doc_id')
          .where('knowledge_doc_tags.tag', tag)
          .distinct('knowledge_docs.id');
      }
      
      // 添加查询条件
      if (where) {
        Object.entries(where).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.where(`knowledge_docs.${key}`, value);
          }
        });
      }
      
      // 添加排序
      if (orderBy) {
        Object.entries(orderBy).forEach(([field, direction]) => {
          query = query.orderBy(`knowledge_docs.${field}`, direction);
        });
      }
      
      // 添加分页
      query = query.limit(pageSize).offset(offset);
      
      return await query;
    } catch (error) {
      logger.error('获取知识库文档列表数据失败:', error);
      throw error;
    }
  }

  async countKnowledgeDocs(where, tag) {
    try {
      let query = db('knowledge_docs');
      
      // 如果有标签过滤，使用联表查询
      if (tag) {
        query = query
          .join('knowledge_doc_tags', 'knowledge_docs.id', '=', 'knowledge_doc_tags.doc_id')
          .where('knowledge_doc_tags.tag', tag)
          .distinct('knowledge_docs.id');
      }
      
      if (where) {
        Object.entries(where).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.where(key, value);
          }
        });
      }
      
      const result = await query.count('* as count');
      return result[0].count;
    } catch (error) {
      logger.error('统计知识库文档数量失败:', error);
      throw error;
    }
  }

  async getKnowledgeDocById(id) {
    try {
      return await db('knowledge_docs').where('id', id).first();
    } catch (error) {
      logger.error(`获取知识库文档详情数据失败: ${id}`, error);
      throw error;
    }
  }

  async getKnowledgeDocTags(docId) {
    try {
      const tags = await db('knowledge_doc_tags')
        .where('doc_id', docId)
        .pluck('tag');
      return tags;
    } catch (error) {
      logger.error(`获取知识库文档标签失败: ${docId}`, error);
      throw error;
    }
  }

  async createKnowledgeDocTags(docId, tags) {
    try {
      const tagData = tags.map(tag => ({
        doc_id: docId,
        tag
      }));
      await db('knowledge_doc_tags').insert(tagData);
    } catch (error) {
      logger.error(`创建知识库文档标签关联失败: ${docId}`, error);
      throw error;
    }
  }

  async updateKnowledgeDocTags(docId, tags) {
    try {
      // 先删除现有标签
      await db('knowledge_doc_tags').where('doc_id', docId).del();
      
      // 添加新标签
      if (tags && tags.length > 0) {
        const tagData = tags.map(tag => ({
          doc_id: docId,
          tag
        }));
        await db('knowledge_doc_tags').insert(tagData);
      }
    } catch (error) {
      logger.error(`更新知识库文档标签失败: ${docId}`, error);
      throw error;
    }
  }

  async deleteKnowledgeDocTags(docId) {
    try {
      await db('knowledge_doc_tags').where('doc_id', docId).del();
    } catch (error) {
      logger.error(`删除知识库文档标签失败: ${docId}`, error);
      throw error;
    }
  }

  async incrementKnowledgeDocViewCount(id) {
    try {
      await db('knowledge_docs')
        .where('id', id)
        .increment('viewCount', 1);
    } catch (error) {
      logger.error(`增加知识库文档浏览量失败: ${id}`, error);
      // 记录错误但不抛出，避免影响主流程
    }
  }

  async updateKnowledgeDoc(id, data) {
    try {
      const [result] = await db('knowledge_docs')
        .where('id', id)
        .update(data)
        .returning('*');
      return result;
    } catch (error) {
      logger.error(`更新知识库文档数据失败: ${id}`, error);
      throw error;
    }
  }

  async deleteKnowledgeDoc(id) {
    try {
      await db('knowledge_docs').where('id', id).del();
    } catch (error) {
      logger.error(`删除知识库文档数据失败: ${id}`, error);
      throw error;
    }
  }
}

module.exports = new ContentRepository();