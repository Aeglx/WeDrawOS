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

const { AutoReplyRule, AutoReplyLog, Conversation, Message, User } = db.models;

/**
 * 自动回复控制器
 * 处理自动回复规则相关的业务逻辑
 */
class AutoReplyController {
  /**
   * 创建自动回复规则
   */
  static async createRule(req, res, next) {
    try {
      // 验证请求数据
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new BadRequestError('请求数据验证失败', errors.array());
      }

      const {
        name,
        keywords,
        matchType = 'any',
        responseContent,
        enabled = true,
        priority = 0,
        department,
        targetGroup,
        timeRestriction,
        conditions,
        actions,
        variables
      } = req.body;
      
      const currentUserId = req.user.userId;

      // 检查权限：只有管理员和主管可以创建规则
      if (req.user.role !== 'admin' && req.user.role !== 'supervisor') {
        throw new ForbiddenError('无权创建自动回复规则');
      }

      // 验证关键字
      if (!keywords || keywords.length === 0) {
        throw new BadRequestError('关键字不能为空');
      }

      // 验证回复内容
      if (!responseContent) {
        throw new BadRequestError('回复内容不能为空');
      }

      // 创建规则
      const rule = await AutoReplyRule.create({
        name,
        keywords,
        matchType,
        responseContent,
        enabled,
        priority,
        department,
        targetGroup,
        timeRestriction,
        conditions,
        actions,
        variables,
        createdBy: currentUserId,
        usageCount: 0,
        lastUsedAt: null
      });

      // 记录创建日志
      await db.models.WorkLog.logAutoReplyRuleCreated({
        userId: currentUserId,
        ruleId: rule.id,
        ruleName: rule.name
      });

      res.status(201).json({
        success: true,
        message: '自动回复规则创建成功',
        data: { rule: rule.toResponseObject() }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取自动回复规则列表
   */
  static async getRules(req, res, next) {
    try {
      const {
        page = 1,
        limit = 10,
        enabled,
        department,
        targetGroup,
        search,
        sortBy = 'priority',
        sortOrder = 'desc'
      } = req.query;

      // 检查权限：只有管理员和主管可以查看所有规则，客服只能查看已启用的规则
      const canViewAllRules = req.user.role === 'admin' || req.user.role === 'supervisor';

      // 构建查询条件
      const where = {};
      
      // 非管理员和主管只能查看已启用的规则
      if (!canViewAllRules) {
        where.enabled = true;
      } else if (enabled !== undefined) {
        where.enabled = enabled === 'true' || enabled === true;
      }
      
      if (department) {
        where.department = department;
      }
      
      if (targetGroup) {
        where.targetGroup = targetGroup;
      }
      
      if (search) {
        where[db.Sequelize.Op.or] = [
          { name: { [db.Sequelize.Op.iLike]: `%${search}%` } },
          { responseContent: { [db.Sequelize.Op.iLike]: `%${search}%` } }
        ];
      }

      // 计算偏移量
      const offset = (page - 1) * limit;

      // 排序配置
      const order = [[sortBy, sortOrder]];

      // 查询规则
      const { count, rows } = await AutoReplyRule.findAndCountAll({
        where,
        offset,
        limit: parseInt(limit),
        order,
        include: [{ model: User, as: 'creator', attributes: ['id', 'username', 'firstName', 'lastName'] }]
      });

      res.status(200).json({
        success: true,
        data: {
          rules: rows.map(rule => rule.toResponseObject()),
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
   * 获取单个自动回复规则
   */
  static async getRuleById(req, res, next) {
    try {
      const { ruleId } = req.params;

      // 查找规则
      const rule = await AutoReplyRule.findByPk(ruleId, {
        include: [{ model: User, as: 'creator', attributes: ['id', 'username', 'firstName', 'lastName'] }]
      });

      if (!rule) {
        throw new NotFoundError('自动回复规则不存在');
      }

      // 检查权限：只有管理员和主管可以查看所有规则，客服只能查看已启用的规则
      if (!rule.enabled && req.user.role !== 'admin' && req.user.role !== 'supervisor') {
        throw new ForbiddenError('无权查看此规则');
      }

      res.status(200).json({
        success: true,
        data: { rule: rule.toResponseObject() }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 更新自动回复规则
   */
  static async updateRule(req, res, next) {
    try {
      // 验证请求数据
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new BadRequestError('请求数据验证失败', errors.array());
      }

      const { ruleId } = req.params;
      const {
        name,
        keywords,
        matchType,
        responseContent,
        enabled,
        priority,
        department,
        targetGroup,
        timeRestriction,
        conditions,
        actions,
        variables
      } = req.body;
      
      const currentUserId = req.user.userId;

      // 检查权限：只有管理员和主管可以更新规则
      if (req.user.role !== 'admin' && req.user.role !== 'supervisor') {
        throw new ForbiddenError('无权更新自动回复规则');
      }

      // 查找规则
      const rule = await AutoReplyRule.findByPk(ruleId);
      if (!rule) {
        throw new NotFoundError('自动回复规则不存在');
      }

      // 构建更新数据
      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (keywords !== undefined) updateData.keywords = keywords;
      if (matchType !== undefined) updateData.matchType = matchType;
      if (responseContent !== undefined) updateData.responseContent = responseContent;
      if (enabled !== undefined) updateData.enabled = enabled;
      if (priority !== undefined) updateData.priority = priority;
      if (department !== undefined) updateData.department = department;
      if (targetGroup !== undefined) updateData.targetGroup = targetGroup;
      if (timeRestriction !== undefined) updateData.timeRestriction = timeRestriction;
      if (conditions !== undefined) updateData.conditions = conditions;
      if (actions !== undefined) updateData.actions = actions;
      if (variables !== undefined) updateData.variables = variables;
      updateData.updatedBy = currentUserId;

      // 更新规则
      await rule.update(updateData);

      // 记录更新日志
      await db.models.WorkLog.logAutoReplyRuleUpdated({
        userId: currentUserId,
        ruleId: rule.id,
        ruleName: rule.name,
        changes: updateData
      });

      // 重新获取规则（包含关联数据）
      const updatedRule = await AutoReplyRule.findByPk(ruleId, {
        include: [{ model: User, as: 'creator', attributes: ['id', 'username', 'firstName', 'lastName'] }]
      });

      res.status(200).json({
        success: true,
        message: '自动回复规则更新成功',
        data: { rule: updatedRule.toResponseObject() }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 删除自动回复规则
   */
  static async deleteRule(req, res, next) {
    try {
      const { ruleId } = req.params;
      const currentUserId = req.user.userId;

      // 检查权限：只有管理员可以删除规则
      if (req.user.role !== 'admin') {
        throw new ForbiddenError('无权删除自动回复规则');
      }

      // 查找规则
      const rule = await AutoReplyRule.findByPk(ruleId);
      if (!rule) {
        throw new NotFoundError('自动回复规则不存在');
      }

      // 软删除规则
      await rule.destroy();

      // 记录删除日志
      await db.models.WorkLog.logAutoReplyRuleDeleted({
        userId: currentUserId,
        ruleId: rule.id,
        ruleName: rule.name
      });

      res.status(200).json({
        success: true,
        message: '自动回复规则删除成功'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 切换规则启用状态
   */
  static async toggleRuleStatus(req, res, next) {
    try {
      const { ruleId } = req.params;
      const currentUserId = req.user.userId;

      // 检查权限：只有管理员和主管可以切换规则状态
      if (req.user.role !== 'admin' && req.user.role !== 'supervisor') {
        throw new ForbiddenError('无权修改自动回复规则状态');
      }

      // 查找规则
      const rule = await AutoReplyRule.findByPk(ruleId);
      if (!rule) {
        throw new NotFoundError('自动回复规则不存在');
      }

      // 切换状态
      const newStatus = !rule.enabled;
      await rule.update({ enabled: newStatus, updatedBy: currentUserId });

      // 记录状态变更日志
      await db.models.WorkLog.logAutoReplyRuleStatusChanged({
        userId: currentUserId,
        ruleId: rule.id,
        ruleName: rule.name,
        enabled: newStatus
      });

      res.status(200).json({
        success: true,
        message: `自动回复规则已${newStatus ? '启用' : '禁用'}`,
        data: { rule: rule.toResponseObject() }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 处理消息匹配和自动回复
   */
  static async processAutoReply(req, res, next) {
    try {
      const { conversationId, message } = req.body;

      // 查找会话
      const conversation = await Conversation.findByPk(conversationId);
      if (!conversation) {
        throw new NotFoundError('会话不存在');
      }

      // 查找匹配的规则
      const matchingRule = await AutoReplyRule.findMatchingRule(message, {
        conversationId: conversation.id,
        department: conversation.category,
        targetGroup: conversation.metadata?.targetGroup,
        customerInfo: conversation.customerInfo
      });

      if (!matchingRule) {
        return res.status(200).json({
          success: true,
          matched: false,
          message: '没有找到匹配的自动回复规则'
        });
      }

      // 渲染回复内容（替换变量）
      let responseContent = matchingRule.responseContent;
      
      // 替换变量
      if (matchingRule.variables && conversation.customerInfo) {
        Object.entries(conversation.customerInfo).forEach(([key, value]) => {
          responseContent = responseContent.replace(new RegExp(`\{\{${key}\}\}`, 'g'), value);
        });
      }

      // 创建自动回复消息
      const autoReplyMessage = await Message.createAutoReplyMessage({
        conversationId: conversation.id,
        senderId: 'system',
        content: responseContent,
        ruleId: matchingRule.id,
        metadata: {
          ruleName: matchingRule.name,
          triggeredAt: new Date()
        }
      });

      // 增加规则使用计数
      await matchingRule.incrementUsage();

      // 记录自动回复日志
      await AutoReplyLog.create({
        conversationId: conversation.id,
        ruleId: matchingRule.id,
        messageId: autoReplyMessage.id,
        triggeredAt: new Date(),
        triggerMessage: message,
        responseContent: autoReplyMessage.content
      });

      // 更新会话的自动回复计数
      await conversation.recordAutoReply({
        ruleId: matchingRule.id,
        messageId: autoReplyMessage.id
      });

      res.status(200).json({
        success: true,
        matched: true,
        data: {
          rule: matchingRule.toResponseObject(),
          message: autoReplyMessage.toResponseObject()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 批量启用/禁用规则
   */
  static async batchUpdateRulesStatus(req, res, next) {
    try {
      const { ruleIds, enabled } = req.body;
      const currentUserId = req.user.userId;

      // 检查权限：只有管理员和主管可以批量更新规则状态
      if (req.user.role !== 'admin' && req.user.role !== 'supervisor') {
        throw new ForbiddenError('无权批量更新自动回复规则状态');
      }

      // 验证参数
      if (!Array.isArray(ruleIds) || ruleIds.length === 0) {
        throw new BadRequestError('请提供规则ID列表');
      }

      if (enabled === undefined) {
        throw new BadRequestError('请提供启用状态');
      }

      // 批量更新规则状态
      const [updatedCount] = await AutoReplyRule.update(
        { enabled, updatedBy: currentUserId },
        { where: { id: ruleIds } }
      );

      // 记录批量更新日志
      await db.models.WorkLog.logAutoReplyRulesBatchUpdated({
        userId: currentUserId,
        ruleIds,
        enabled,
        updatedCount
      });

      res.status(200).json({
        success: true,
        message: `成功${enabled ? '启用' : '禁用'}了 ${updatedCount} 条规则`,
        data: { updatedCount }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取规则使用统计
   */
  static async getRulesUsageStats(req, res, next) {
    try {
      const {
        startDate,
        endDate,
        department,
        targetGroup
      } = req.query;

      // 检查权限：只有管理员和主管可以查看统计
      if (req.user.role !== 'admin' && req.user.role !== 'supervisor') {
        throw new ForbiddenError('无权查看规则使用统计');
      }

      // 构建查询条件
      const where = {};
      
      if (department) {
        where.department = department;
      }
      
      if (targetGroup) {
        where.targetGroup = targetGroup;
      }

      // 查询规则及其使用日志
      const rules = await AutoReplyRule.findAll({
        where,
        include: [
          {
            model: AutoReplyLog,
            as: 'logs',
            where: startDate && endDate ? {
              triggeredAt: {
                [db.Sequelize.Op.between]: [new Date(startDate), new Date(endDate)]
              }
            } : {},
            required: false
          }
        ]
      });

      // 计算统计数据
      const stats = rules.map(rule => {
        // 按日期分组的使用次数
        const usageByDate = {};
        rule.logs.forEach(log => {
          const date = log.triggeredAt.toISOString().split('T')[0];
          usageByDate[date] = (usageByDate[date] || 0) + 1;
        });

        return {
          rule: rule.toResponseObject(),
          totalUsage: rule.usageCount,
          logsCount: rule.logs.length,
          usageByDate,
          lastUsed: rule.lastUsedAt,
          isActive: rule.enabled && rule.usageCount > 0
        };
      });

      res.status(200).json({
        success: true,
        data: {
          stats,
          totalRules: rules.length,
          enabledRules: rules.filter(r => r.enabled).length,
          totalUsages: rules.reduce((sum, r) => sum + r.usageCount, 0)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 测试规则匹配
   */
  static async testRuleMatching(req, res, next) {
    try {
      const { message, department, targetGroup, customerInfo } = req.body;

      // 查找匹配的规则
      const matchingRules = await AutoReplyRule.findAll({
        where: { enabled: true },
        order: [['priority', 'desc'], ['createdAt', 'desc']]
      });

      // 找出所有匹配的规则
      const results = [];
      for (const rule of matchingRules) {
        const matches = await rule.matches(message, {
          department,
          targetGroup,
          customerInfo
        });
        
        if (matches) {
          // 渲染回复内容用于测试
          let renderedContent = rule.responseContent;
          if (rule.variables && customerInfo) {
            Object.entries(customerInfo).forEach(([key, value]) => {
              renderedContent = renderedContent.replace(new RegExp(`\{\{${key}\}\}`, 'g'), value || '');
            });
          }

          results.push({
            rule: rule.toResponseObject(),
            renderedContent,
            matchedKeywords: rule.keywords.filter(keyword => 
              message.toLowerCase().includes(keyword.toLowerCase())
            )
          });
        }
      }

      res.status(200).json({
        success: true,
        data: {
          matches: results.length > 0,
          matchingRules: results,
          totalMatched: results.length
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 导入自动回复规则
   */
  static async importRules(req, res, next) {
    try {
      const { rules } = req.body;
      const currentUserId = req.user.userId;

      // 检查权限：只有管理员可以导入规则
      if (req.user.role !== 'admin') {
        throw new ForbiddenError('无权导入自动回复规则');
      }

      // 验证数据
      if (!Array.isArray(rules) || rules.length === 0) {
        throw new BadRequestError('请提供有效的规则数据');
      }

      let importedCount = 0;
      const errors = [];

      // 批量导入规则
      for (const ruleData of rules) {
        try {
          // 验证必要字段
          if (!ruleData.name || !ruleData.keywords || !ruleData.responseContent) {
            throw new Error('缺少必要字段');
          }

          // 创建规则
          await AutoReplyRule.create({
            name: ruleData.name,
            keywords: ruleData.keywords,
            matchType: ruleData.matchType || 'any',
            responseContent: ruleData.responseContent,
            enabled: ruleData.enabled !== undefined ? ruleData.enabled : true,
            priority: ruleData.priority || 0,
            department: ruleData.department,
            targetGroup: ruleData.targetGroup,
            timeRestriction: ruleData.timeRestriction,
            conditions: ruleData.conditions,
            actions: ruleData.actions,
            variables: ruleData.variables,
            createdBy: currentUserId,
            usageCount: 0,
            lastUsedAt: null
          });

          importedCount++;
        } catch (error) {
          errors.push({
            rule: ruleData.name || '未知规则',
            error: error.message
          });
        }
      }

      // 记录导入日志
      await db.models.WorkLog.logAutoReplyRulesImported({
        userId: currentUserId,
        importedCount,
        totalCount: rules.length,
        errorCount: errors.length
      });

      res.status(200).json({
        success: true,
        message: `成功导入 ${importedCount} 条规则，失败 ${errors.length} 条`,
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
   * 导出自动回复规则
   */
  static async exportRules(req, res, next) {
    try {
      const { ruleIds, includeDisabled = false } = req.query;

      // 检查权限：只有管理员和主管可以导出规则
      if (req.user.role !== 'admin' && req.user.role !== 'supervisor') {
        throw new ForbiddenError('无权导出自动回复规则');
      }

      // 构建查询条件
      const where = {};
      
      if (!includeDisabled) {
        where.enabled = true;
      }
      
      if (ruleIds) {
        where.id = ruleIds.split(',').map(id => id.trim());
      }

      // 查询规则
      const rules = await AutoReplyRule.findAll({
        where,
        order: [['priority', 'desc'], ['createdAt', 'desc']]
      });

      // 转换为导出格式
      const exportData = rules.map(rule => rule.toExportObject());

      // 设置响应头
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="auto-reply-rules-${new Date().toISOString().split('T')[0]}.json"`);

      res.status(200).json(exportData);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AutoReplyController;