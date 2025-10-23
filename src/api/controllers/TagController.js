const { validationResult } = require('express-validator');
const db = require('../models/index.js');
const {
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    ConflictError,
    InternalServerError
  } = require('../utils/errors.js');

const { Tag, Conversation, Message } = db.models;

/**
 * 标签控制器
 * 处理客服系统中的标签相关业务逻辑
 */
class TagController {
  /**
   * 创建标签
   */
  static async createTag(req, res, next) {
    try {
      // 验证请求数据
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new BadRequestError('请求数据验证失败', errors.array());
      }

      const { name, color, description, category } = req.body;
      const currentUserId = req.user.userId;

      // 检查权限：只有管理员和主管可以创建标签
      if (req.user.role !== 'admin' && req.user.role !== 'supervisor') {
        throw new ForbiddenError('无权创建标签');
      }

      // 验证标签名唯一性
      const existingTag = await Tag.findOne({
        where: { name, deletedAt: null }
      });

      if (existingTag) {
        throw new ConflictError('标签名已存在');
      }

      // 创建标签
      const tag = await Tag.create({
        name,
        color,
        description,
        category,
        createdBy: currentUserId,
        usageCount: 0
      });

      // 记录创建日志
      await db.models.WorkLog.logTagCreated({
        userId: currentUserId,
        tagId: tag.id,
        tagName: tag.name,
        tagColor: tag.color,
        tagCategory: tag.category
      });

      res.status(201).json({
        success: true,
        message: '标签创建成功',
        data: { tag: tag.toResponseObject() }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取标签列表
   */
  static async getTags(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        category,
        search,
        sortBy = 'usageCount',
        sortOrder = 'desc',
        includeArchived = false
      } = req.query;

      // 构建查询条件
      const where = {};
      
      if (!includeArchived) {
        where.deletedAt = null;
      }
      
      if (category) {
        where.category = category;
      }
      
      if (search) {
        where[db.Sequelize.Op.or] = [
          { name: { [db.Sequelize.Op.iLike]: `%${search}%` } },
          { description: { [db.Sequelize.Op.iLike]: `%${search}%` } }
        ];
      }

      // 计算偏移量
      const offset = (page - 1) * limit;

      // 排序配置
      const order = [[sortBy, sortOrder]];

      // 查询标签
      const { count, rows } = await Tag.findAndCountAll({
        where,
        offset,
        limit: parseInt(limit),
        order
      });

      res.status(200).json({
        success: true,
        data: {
          tags: rows.map(tag => tag.toResponseObject()),
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(count / limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取单个标签详情
   */
  static async getTagById(req, res, next) {
    try {
      const { tagId } = req.params;

      // 查找标签
      const tag = await Tag.findByPk(tagId);

      if (!tag) {
        throw new NotFoundError('标签不存在');
      }

      // 检查标签是否已归档
      if (tag.deletedAt && !['admin', 'supervisor'].includes(req.user.role)) {
        throw new NotFoundError('标签不存在');
      }

      res.status(200).json({
        success: true,
        data: { tag: tag.toResponseObject() }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 更新标签
   */
  static async updateTag(req, res, next) {
    try {
      // 验证请求数据
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new BadRequestError('请求数据验证失败', errors.array());
      }

      const { tagId } = req.params;
      const { name, color, description, category } = req.body;
      const currentUserId = req.user.userId;

      // 检查权限：只有管理员和主管可以更新标签
      if (req.user.role !== 'admin' && req.user.role !== 'supervisor') {
        throw new ForbiddenError('无权更新标签');
      }

      // 查找标签
      const tag = await Tag.findByPk(tagId);
      if (!tag) {
        throw new NotFoundError('标签不存在');
      }

      // 如果更新名称，验证唯一性
      if (name && name !== tag.name) {
        const existingTag = await Tag.findOne({
          where: { 
            name, 
            deletedAt: null,
            id: { [db.Sequelize.Op.ne]: tagId }
          }
        });

        if (existingTag) {
          throw new ConflictError('标签名已存在');
        }
      }

      // 构建更新数据
      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (color !== undefined) updateData.color = color;
      if (description !== undefined) updateData.description = description;
      if (category !== undefined) updateData.category = category;
      updateData.updatedAt = new Date();

      // 更新标签
      await tag.update(updateData);

      // 记录更新日志
      await db.models.WorkLog.logTagUpdated({
        userId: currentUserId,
        tagId: tag.id,
        tagName: tag.name,
        changes: updateData
      });

      res.status(200).json({
        success: true,
        message: '标签更新成功',
        data: { tag: tag.toResponseObject() }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 删除标签（软删除）
   */
  static async deleteTag(req, res, next) {
    try {
      const { tagId } = req.params;
      const currentUserId = req.user.userId;

      // 检查权限：只有管理员可以删除标签
      if (req.user.role !== 'admin') {
        throw new ForbiddenError('无权删除标签');
      }

      // 查找标签
      const tag = await Tag.findByPk(tagId);
      if (!tag) {
        throw new NotFoundError('标签不存在');
      }

      // 检查标签是否已归档
      if (tag.deletedAt) {
        throw new BadRequestError('标签已归档');
      }

      // 软删除标签
      await tag.destroy();

      // 记录删除日志
      await db.models.WorkLog.logTagDeleted({
        userId: currentUserId,
        tagId: tag.id,
        tagName: tag.name,
        tagUsageCount: tag.usageCount
      });

      res.status(200).json({
        success: true,
        message: '标签已归档'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 恢复已归档的标签
   */
  static async restoreTag(req, res, next) {
    try {
      const { tagId } = req.params;
      const currentUserId = req.user.userId;

      // 检查权限：只有管理员和主管可以恢复标签
      if (req.user.role !== 'admin' && req.user.role !== 'supervisor') {
        throw new ForbiddenError('无权恢复标签');
      }

      // 查找已归档的标签
      const tag = await Tag.findOne({
        where: {
          id: tagId,
          deletedAt: { [db.Sequelize.Op.not]: null }
        },
        paranoid: false
      });

      if (!tag) {
        throw new NotFoundError('未找到已归档的标签');
      }

      // 恢复标签
      await tag.restore();

      // 记录恢复日志
      await db.models.WorkLog.logTagRestored({
        userId: currentUserId,
        tagId: tag.id,
        tagName: tag.name
      });

      res.status(200).json({
        success: true,
        message: '标签恢复成功',
        data: { tag: tag.toResponseObject() }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 为会话添加标签
   */
  static async addTagToConversation(req, res, next) {
    try {
      const { conversationId, tagId } = req.params;
      const currentUserId = req.user.userId;

      // 查找会话
      const conversation = await Conversation.findByPk(conversationId);
      if (!conversation) {
        throw new NotFoundError('会话不存在');
      }

      // 检查权限：只有会话负责人、客服或管理员可以添加标签
      const hasPermission = conversation.assignedTo === currentUserId ||
                           ['admin', 'supervisor'].includes(req.user.role);
      
      if (!hasPermission) {
        throw new ForbiddenError('无权为此会话添加标签');
      }

      // 查找标签
      const tag = await Tag.findByPk(tagId);
      if (!tag || tag.deletedAt) {
        throw new NotFoundError('标签不存在');
      }

      // 检查是否已经添加过该标签
      const alreadyAdded = await conversation.hasTag(tagId);
      if (alreadyAdded) {
        throw new ConflictError('该标签已添加到会话');
      }

      // 添加标签到会话
      await conversation.addTag(tagId);

      // 增加标签使用计数
      await tag.incrementUsage();

      // 记录操作日志
      await db.models.WorkLog.logTagAddedToConversation({
        userId: currentUserId,
        tagId: tag.id,
        tagName: tag.name,
        conversationId: conversation.id
      });

      // 创建系统消息
      await Message.createSystemMessage({
        conversationId: conversation.id,
        content: `客服添加了标签: ${tag.name}`,
        createdBy: currentUserId,
        metadata: { tagId: tag.id, action: 'add_tag' }
      });

      res.status(200).json({
        success: true,
        message: '标签已添加到会话',
        data: {
          tag: tag.toResponseObject()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 从会话中移除标签
   */
  static async removeTagFromConversation(req, res, next) {
    try {
      const { conversationId, tagId } = req.params;
      const currentUserId = req.user.userId;

      // 查找会话
      const conversation = await Conversation.findByPk(conversationId);
      if (!conversation) {
        throw new NotFoundError('会话不存在');
      }

      // 检查权限：只有会话负责人、客服或管理员可以移除标签
      const hasPermission = conversation.assignedTo === currentUserId ||
                           ['admin', 'supervisor'].includes(req.user.role);
      
      if (!hasPermission) {
        throw new ForbiddenError('无权从此会话移除标签');
      }

      // 查找标签
      const tag = await Tag.findByPk(tagId);
      if (!tag || tag.deletedAt) {
        throw new NotFoundError('标签不存在');
      }

      // 检查是否已添加该标签
      const hasTag = await conversation.hasTag(tagId);
      if (!hasTag) {
        throw new BadRequestError('会话未添加此标签');
      }

      // 从会话中移除标签
      await conversation.removeTag(tagId);

      // 减少标签使用计数
      await tag.decrementUsage();

      // 记录操作日志
      await db.models.WorkLog.logTagRemovedFromConversation({
        userId: currentUserId,
        tagId: tag.id,
        tagName: tag.name,
        conversationId: conversation.id
      });

      // 创建系统消息
      await Message.createSystemMessage({
        conversationId: conversation.id,
        content: `客服移除了标签: ${tag.name}`,
        createdBy: currentUserId,
        metadata: { tagId: tag.id, action: 'remove_tag' }
      });

      res.status(200).json({
        success: true,
        message: '标签已从会话移除'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 批量为会话添加标签
   */
  static async batchAddTagsToConversation(req, res, next) {
    try {
      const { conversationId } = req.params;
      const { tagIds } = req.body;
      const currentUserId = req.user.userId;

      // 验证参数
      if (!tagIds || !Array.isArray(tagIds) || tagIds.length === 0) {
        throw new BadRequestError('请提供有效的标签ID列表');
      }

      // 查找会话
      const conversation = await Conversation.findByPk(conversationId);
      if (!conversation) {
        throw new NotFoundError('会话不存在');
      }

      // 检查权限
      const hasPermission = conversation.assignedTo === currentUserId ||
                           ['admin', 'supervisor'].includes(req.user.role);
      
      if (!hasPermission) {
        throw new ForbiddenError('无权为此会话添加标签');
      }

      // 查找有效的标签
      const tags = await Tag.findAll({
        where: {
          id: tagIds,
          deletedAt: null
        }
      });

      if (tags.length === 0) {
        throw new BadRequestError('未找到有效的标签');
      }

      // 获取会话已有的标签
      const existingTags = await conversation.getTags();
      const existingTagIds = new Set(existingTags.map(t => t.id));

      // 过滤掉已存在的标签
      const newTags = tags.filter(tag => !existingTagIds.has(tag.id));

      if (newTags.length === 0) {
        throw new BadRequestError('所有标签都已添加到会话');
      }

      // 批量添加标签
      await conversation.addTags(newTags.map(t => t.id));

      // 更新标签使用计数
      for (const tag of newTags) {
        await tag.incrementUsage();
      }

      // 记录操作日志
      await db.models.WorkLog.logTagsBatchAddedToConversation({
        userId: currentUserId,
        tagIds: newTags.map(t => t.id),
        tagNames: newTags.map(t => t.name),
        conversationId: conversation.id,
        addedCount: newTags.length
      });

      // 创建系统消息
      await Message.createSystemMessage({
        conversationId: conversation.id,
        content: `客服批量添加了标签: ${newTags.map(t => t.name).join(', ')}`,
        createdBy: currentUserId,
        metadata: { tagIds: newTags.map(t => t.id), action: 'batch_add_tags' }
      });

      res.status(200).json({
        success: true,
        message: `成功添加 ${newTags.length} 个标签到会话`,
        data: {
          tags: newTags.map(tag => tag.toResponseObject()),
          addedCount: newTags.length
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 为消息添加标签
   */
  static async addTagToMessage(req, res, next) {
    try {
      const { messageId, tagId } = req.params;
      const currentUserId = req.user.userId;

      // 查找消息
      const message = await Message.findByPk(messageId, {
        include: [{ model: Conversation }]
      });
      if (!message) {
        throw new NotFoundError('消息不存在');
      }

      // 检查权限：只有会话负责人、客服或管理员可以为消息添加标签
      const conversation = message.Conversation;
      const hasPermission = conversation.assignedTo === currentUserId ||
                           ['admin', 'supervisor'].includes(req.user.role);
      
      if (!hasPermission) {
        throw new ForbiddenError('无权为此消息添加标签');
      }

      // 查找标签
      const tag = await Tag.findByPk(tagId);
      if (!tag || tag.deletedAt) {
        throw new NotFoundError('标签不存在');
      }

      // 检查是否已经添加过该标签
      const alreadyAdded = await message.hasTag(tagId);
      if (alreadyAdded) {
        throw new ConflictError('该标签已添加到消息');
      }

      // 添加标签到消息
      await message.addTag(tagId);

      // 增加标签使用计数
      await tag.incrementUsage();

      // 记录操作日志
      await db.models.WorkLog.logTagAddedToMessage({
        userId: currentUserId,
        tagId: tag.id,
        tagName: tag.name,
        messageId: message.id,
        conversationId: conversation.id
      });

      res.status(200).json({
        success: true,
        message: '标签已添加到消息',
        data: {
          tag: tag.toResponseObject()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 从消息中移除标签
   */
  static async removeTagFromMessage(req, res, next) {
    try {
      const { messageId, tagId } = req.params;
      const currentUserId = req.user.userId;

      // 查找消息
      const message = await Message.findByPk(messageId, {
        include: [{ model: Conversation }]
      });
      if (!message) {
        throw new NotFoundError('消息不存在');
      }

      // 检查权限：只有会话负责人、客服或管理员可以从消息移除标签
      const conversation = message.Conversation;
      const hasPermission = conversation.assignedTo === currentUserId ||
                           ['admin', 'supervisor'].includes(req.user.role);
      
      if (!hasPermission) {
        throw new ForbiddenError('无权从此消息移除标签');
      }

      // 查找标签
      const tag = await Tag.findByPk(tagId);
      if (!tag || tag.deletedAt) {
        throw new NotFoundError('标签不存在');
      }

      // 检查是否已添加该标签
      const hasTag = await message.hasTag(tagId);
      if (!hasTag) {
        throw new BadRequestError('消息未添加此标签');
      }

      // 从消息中移除标签
      await message.removeTag(tagId);

      // 减少标签使用计数
      await tag.decrementUsage();

      // 记录操作日志
      await db.models.WorkLog.logTagRemovedFromMessage({
        userId: currentUserId,
        tagId: tag.id,
        tagName: tag.name,
        messageId: message.id,
        conversationId: conversation.id
      });

      res.status(200).json({
        success: true,
        message: '标签已从消息移除'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取标签使用统计
   */
  static async getTagUsageStats(req, res, next) {
    try {
      const {
        category,
        startDate,
        endDate,
        includeArchived = false
      } = req.query;

      // 检查权限：只有管理员和主管可以查看统计
      if (req.user.role !== 'admin' && req.user.role !== 'supervisor') {
        throw new ForbiddenError('无权查看标签使用统计');
      }

      // 构建查询条件
      const where = {};
      
      if (!includeArchived) {
        where.deletedAt = null;
      }
      
      if (category) {
        where.category = category;
      }

      // 查询标签
      const tags = await Tag.findAll({
        where,
        order: [['usageCount', 'desc']]
      });

      // 获取每个标签的会话和消息使用情况
      const statsPromises = tags.map(async tag => {
        // 获取使用此标签的会话数
        const conversationCount = await db.sequelize.models.ConversationTag.count({
          where: { tagId: tag.id }
        });

        // 获取使用此标签的消息数
        const messageCount = await db.sequelize.models.MessageTag.count({
          where: { tagId: tag.id }
        });

        // 如果有时间范围，获取该时间段内的使用情况
        let recentUsage = 0;
        if (startDate || endDate) {
          // 查询工作日志
          const logWhere = {
            actionType: {
              [db.Sequelize.Op.in]: ['tag_added_to_conversation', 'tag_added_to_message']
            },
            metadata: {
              [db.Sequelize.Op.contains]: { tagId: tag.id }
            }
          };

          if (startDate) logWhere.timestamp = { ...logWhere.timestamp, [db.Sequelize.Op.gte]: new Date(startDate) };
          if (endDate) logWhere.timestamp = { ...logWhere.timestamp, [db.Sequelize.Op.lte]: new Date(endDate) };

          recentUsage = await db.models.WorkLog.count({ where: logWhere });
        }

        return {
          tag: tag.toResponseObject(),
          conversationCount,
          messageCount,
          recentUsage,
          totalUsage: tag.usageCount
        };
      });

      const stats = await Promise.all(statsPromises);

      // 计算总计
      const totalTags = tags.length;
      const totalUsage = stats.reduce((sum, s) => sum + s.totalUsage, 0);
      const mostUsedTag = stats.length > 0 ? stats[0] : null;

      res.status(200).json({
        success: true,
        data: {
          stats,
          summary: {
            totalTags,
            totalUsage,
            averageUsagePerTag: totalTags > 0 ? totalUsage / totalTags : 0,
            mostUsedTag
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 导入标签
   */
  static async importTags(req, res, next) {
    try {
      const { tags } = req.body;
      const currentUserId = req.user.userId;

      // 检查权限：只有管理员可以导入标签
      if (req.user.role !== 'admin') {
        throw new ForbiddenError('无权导入标签');
      }

      // 验证数据
      if (!Array.isArray(tags) || tags.length === 0) {
        throw new BadRequestError('请提供有效的标签数据');
      }

      let importedCount = 0;
      const errors = [];

      // 批量导入标签
      for (const tagData of tags) {
        try {
          // 验证必要字段
          if (!tagData.name) {
            throw new Error('标签名不能为空');
          }

          // 检查标签名是否已存在
          const existingTag = await Tag.findOne({
            where: { name, deletedAt: null }
          });

          if (existingTag) {
            // 如果已存在，可以选择更新或跳过
            if (tagData.updateExisting) {
              await existingTag.update({
                color: tagData.color || existingTag.color,
                description: tagData.description || existingTag.description,
                category: tagData.category || existingTag.category,
                updatedBy: currentUserId
              });
              importedCount++;
            }
            continue;
          }

          // 创建新标签
          await Tag.create({
            name: tagData.name,
            color: tagData.color,
            description: tagData.description,
            category: tagData.category,
            createdBy: currentUserId,
            usageCount: 0
          });

          importedCount++;
        } catch (error) {
          errors.push({
            tag: tagData.name || '未知标签',
            error: error.message
          });
        }
      }

      // 记录导入日志
      await db.models.WorkLog.logTagsImported({
        userId: currentUserId,
        importedCount,
        totalCount: tags.length,
        errorCount: errors.length
      });

      res.status(200).json({
        success: true,
        message: `成功导入 ${importedCount} 个标签，失败 ${errors.length} 个`,
        data: {
          importedCount,
          failedCount: errors.length,
          errors
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 导出标签
   */
  static async exportTags(req, res, next) {
    try {
      const { tagIds, includeArchived = false } = req.query;

      // 检查权限：只有管理员和主管可以导出标签
      if (req.user.role !== 'admin' && req.user.role !== 'supervisor') {
        throw new ForbiddenError('无权导出标签');
      }

      // 构建查询条件
      const where = {};
      
      if (!includeArchived) {
        where.deletedAt = null;
      }
      
      if (tagIds) {
        where.id = tagIds.split(',').map(id => id.trim());
      }

      // 查询标签
      const tags = await Tag.findAll({
        where,
        order: [['name', 'asc']]
      });

      // 转换为导出格式
      const exportData = tags.map(tag => tag.toExportObject());

      // 设置响应头
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="tags-${new Date().toISOString().split('T')[0]}.json"`);

      res.status(200).json(exportData);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = TagController;