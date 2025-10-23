/**
 * 自动回复服务
 * 提供智能回复和关键词匹配功能
 */

const { logger } = require('../utils/logger');
const { AppError } = require('../utils/errors');
const customerServiceDb = require('./customerServiceDb');

class AutoReplyService {
  constructor() {
    this.db = customerServiceDb;
    // 内存缓存自动回复规则
    this.replyRules = [];
    // 常见问题（FAQ）集合
    this.faqCollection = [];
    // 初始化加载规则
    this.initialize();
  }

  /**
   * 初始化服务，加载规则和FAQ
   */
  async initialize() {
    try {
      // 这里应该从数据库加载规则和FAQ
      // 由于数据库模型可能尚未创建，先使用默认规则
      this.loadDefaultRules();
      this.loadDefaultFaq();
      logger.info('Auto reply service initialized with default rules');
    } catch (error) {
      logger.error('Failed to initialize auto reply service:', error);
    }
  }

  /**
   * 加载默认回复规则
   */
  loadDefaultRules() {
    this.replyRules = [
      {
        id: 'rule_welcome',
        name: '欢迎语',
        keywords: ['你好', '您好', '嗨', 'hi', 'hello'],
        reply: '您好！很高兴为您服务，请问有什么可以帮助您的？',
        priority: 10,
        enabled: true
      },
      {
        id: 'rule_thanks',
        name: '感谢回复',
        keywords: ['谢谢', '感谢', '谢了', 'thanks', 'thank'],
        reply: '不客气，这是我们应该做的！如果还有其他问题，请随时咨询。',
        priority: 10,
        enabled: true
      },
      {
        id: 'rule_wait',
        name: '等待提示',
        keywords: ['等', '等待', '稍等', 'hold on', 'wait'],
        reply: '请稍等片刻，我们的客服人员正在为您查询相关信息...',
        priority: 5,
        enabled: true
      },
      {
        id: 'rule_hours',
        name: '工作时间',
        keywords: ['工作时间', '营业时间', '什么时候上班', 'service hours', 'business hours'],
        reply: '我们的客服工作时间是周一至周日 9:00-22:00，节假日不休。',
        priority: 8,
        enabled: true
      },
      {
        id: 'rule_complaint',
        name: '投诉处理',
        keywords: ['投诉', '不满', '问题', '错误', 'bug', 'complain', 'issue'],
        reply: '非常抱歉给您带来不便，我们非常重视您的反馈。请详细描述您遇到的问题，我们将尽快为您解决。',
        priority: 15,
        enabled: true
      }
    ];
  }

  /**
   * 加载默认FAQ
   */
  loadDefaultFaq() {
    this.faqCollection = [
      {
        id: 'faq_001',
        question: '如何注册账号？',
        answer: '您可以通过我们的官网或APP点击"注册"按钮，按照提示填写相关信息即可完成注册。注册过程中如有任何问题，请随时联系我们。',
        category: '账号管理',
        tags: ['注册', '账号', 'account', 'register']
      },
      {
        id: 'faq_002',
        question: '忘记密码怎么办？',
        answer: '您可以点击登录页面的"忘记密码"，通过注册时的手机号或邮箱接收验证码，重置您的密码。',
        category: '账号管理',
        tags: ['密码', '忘记密码', 'password', 'reset']
      },
      {
        id: 'faq_003',
        question: '如何申请退款？',
        answer: '您可以在订单详情页面点击"申请退款"，填写退款原因并提交。我们会在1-3个工作日内审核处理您的退款申请。',
        category: '订单管理',
        tags: ['退款', '退货', 'refund', 'return']
      },
      {
        id: 'faq_004',
        question: '商品多久能送达？',
        answer: '一般情况下，我们会在您下单后48小时内发货。快递时效根据您的收货地址不同而有所差异，通常为3-7个工作日。',
        category: '物流配送',
        tags: ['配送', '快递', '发货', 'shipping', 'delivery']
      },
      {
        id: 'faq_005',
        question: '如何联系在线客服？',
        answer: '您可以在我们的网站或APP底部点击"在线客服"按钮，即可与我们的客服人员进行实时沟通。',
        category: '客户服务',
        tags: ['客服', '联系', 'contact', 'support']
      }
    ];
  }

  /**
   * 匹配回复规则
   * @param {string} message 消息内容
   * @param {Object} context 上下文信息
   * @returns {Object|null} 匹配的回复规则
   */
  matchRule(message, context = {}) {
    if (!message || typeof message !== 'string') {
      return null;
    }

    const lowerMessage = message.toLowerCase();
    const matchedRules = [];

    // 遍历所有规则进行匹配
    for (const rule of this.replyRules) {
      if (!rule.enabled) continue;

      // 检查是否包含任何关键词
      const hasKeyword = rule.keywords.some(keyword => 
        lowerMessage.includes(keyword.toLowerCase())
      );

      if (hasKeyword) {
        matchedRules.push(rule);
      }
    }

    // 按优先级排序，返回最高优先级的规则
    if (matchedRules.length > 0) {
      matchedRules.sort((a, b) => b.priority - a.priority);
      return matchedRules[0];
    }

    return null;
  }

  /**
   * 搜索FAQ
   * @param {string} query 搜索查询
   * @returns {Array} 匹配的FAQ列表
   */
  searchFaq(query) {
    if (!query || typeof query !== 'string') {
      return [];
    }

    const lowerQuery = query.toLowerCase();
    const results = [];

    // 在问题、答案和标签中搜索
    for (const faq of this.faqCollection) {
      const questionMatch = faq.question.toLowerCase().includes(lowerQuery);
      const answerMatch = faq.answer.toLowerCase().includes(lowerQuery);
      const tagMatch = faq.tags.some(tag => tag.toLowerCase().includes(lowerQuery));

      if (questionMatch || answerMatch || tagMatch) {
        results.push(faq);
      }
    }

    return results;
  }

  /**
   * 生成自动回复
   * @param {string} message 消息内容
   * @param {Object} context 上下文信息
   * @returns {Object|null} 自动回复
   */
  generateAutoReply(message, context = {}) {
    // 首先尝试匹配规则
    const matchedRule = this.matchRule(message, context);
    if (matchedRule) {
      return {
        type: 'rule',
        ruleId: matchedRule.id,
        content: matchedRule.reply,
        isAutoReply: true
      };
    }

    // 然后搜索FAQ
    const faqResults = this.searchFaq(message);
    if (faqResults.length > 0) {
      // 返回最相关的FAQ
      const faq = faqResults[0];
      return {
        type: 'faq',
        faqId: faq.id,
        question: faq.question,
        content: faq.answer,
        isAutoReply: true
      };
    }

    // 最后返回默认回复
    return {
      type: 'default',
      content: '感谢您的咨询。我们已经收到您的消息，客服人员会尽快为您回复。请您耐心等待。',
      isAutoReply: true
    };
  }

  /**
   * 处理消息并生成回复
   * @param {Object} messageData 消息数据
   * @returns {Promise<Object|null>} 自动回复
   */
  async processMessage(messageData) {
    try {
      const { content, senderId, conversationId } = messageData;

      // 获取会话信息作为上下文
      const conversation = await this.db.getConversationById(conversationId);
      const context = {
        senderId,
        conversationType: conversation.type,
        conversationStatus: conversation.status,
        // 可以添加更多上下文信息
      };

      // 生成自动回复
      const autoReply = this.generateAutoReply(content, context);
      if (autoReply) {
        // 记录自动回复日志
        logger.info(`Auto reply generated for conversation ${conversationId}: ${autoReply.type}`);
        return autoReply;
      }

      return null;
    } catch (error) {
      logger.error('Failed to process message for auto reply:', error);
      return null;
    }
  }

  /**
   * 添加自动回复规则
   * @param {Object} ruleData 规则数据
   * @returns {Object} 添加的规则
   */
  addAutoReplyRule(ruleData) {
    try {
      const newRule = {
        id: `rule_${Date.now()}`,
        priority: ruleData.priority || 5,
        enabled: ruleData.enabled !== false,
        ...ruleData
      };

      this.replyRules.push(newRule);
      logger.info(`Added new auto reply rule: ${newRule.id}`);
      
      // 这里应该将规则保存到数据库
      // await this.saveRuleToDatabase(newRule);
      
      return newRule;
    } catch (error) {
      logger.error('Failed to add auto reply rule:', error);
      throw new AppError('添加自动回复规则失败', 500);
    }
  }

  /**
   * 更新自动回复规则
   * @param {string} ruleId 规则ID
   * @param {Object} updates 更新数据
   * @returns {Object} 更新后的规则
   */
  updateAutoReplyRule(ruleId, updates) {
    try {
      const ruleIndex = this.replyRules.findIndex(r => r.id === ruleId);
      if (ruleIndex === -1) {
        throw new AppError('规则不存在', 404);
      }

      this.replyRules[ruleIndex] = {
        ...this.replyRules[ruleIndex],
        ...updates
      };

      logger.info(`Updated auto reply rule: ${ruleId}`);
      
      // 这里应该更新数据库中的规则
      // await this.updateRuleInDatabase(ruleId, updates);
      
      return this.replyRules[ruleIndex];
    } catch (error) {
      logger.error(`Failed to update auto reply rule ${ruleId}:`, error);
      throw error;
    }
  }

  /**
   * 删除自动回复规则
   * @param {string} ruleId 规则ID
   * @returns {boolean} 是否删除成功
   */
  deleteAutoReplyRule(ruleId) {
    try {
      const initialLength = this.replyRules.length;
      this.replyRules = this.replyRules.filter(r => r.id !== ruleId);
      
      if (this.replyRules.length === initialLength) {
        throw new AppError('规则不存在', 404);
      }

      logger.info(`Deleted auto reply rule: ${ruleId}`);
      
      // 这里应该从数据库删除规则
      // await this.deleteRuleFromDatabase(ruleId);
      
      return true;
    } catch (error) {
      logger.error(`Failed to delete auto reply rule ${ruleId}:`, error);
      throw error;
    }
  }

  /**
   * 获取所有自动回复规则
   * @param {Object} filters 过滤条件
   * @returns {Array} 规则列表
   */
  getAutoReplyRules(filters = {}) {
    let rules = [...this.replyRules];
    
    if (filters.enabled !== undefined) {
      rules = rules.filter(r => r.enabled === filters.enabled);
    }
    
    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase();
      rules = rules.filter(r => 
        r.name.toLowerCase().includes(keyword) ||
        r.keywords.some(k => k.toLowerCase().includes(keyword))
      );
    }
    
    // 按优先级排序
    rules.sort((a, b) => b.priority - a.priority);
    
    return rules;
  }

  /**
   * 批量导入自动回复规则
   * @param {Array} rules 规则列表
   * @returns {Object} 导入结果
   */
  importAutoReplyRules(rules) {
    try {
      let importedCount = 0;
      const errors = [];
      
      for (let i = 0; i < rules.length; i++) {
        try {
          this.addAutoReplyRule(rules[i]);
          importedCount++;
        } catch (error) {
          errors.push({
            index: i,
            error: error.message
          });
        }
      }
      
      logger.info(`Imported ${importedCount} auto reply rules, ${errors.length} errors`);
      
      return {
        importedCount,
        totalCount: rules.length,
        errors
      };
    } catch (error) {
      logger.error('Failed to import auto reply rules:', error);
      throw new AppError('导入自动回复规则失败', 500);
    }
  }

  /**
   * 添加FAQ
   * @param {Object} faqData FAQ数据
   * @returns {Object} 添加的FAQ
   */
  addFaq(faqData) {
    try {
      const newFaq = {
        id: `faq_${Date.now()}`,
        ...faqData
      };

      this.faqCollection.push(newFaq);
      logger.info(`Added new FAQ: ${newFaq.id}`);
      
      // 这里应该将FAQ保存到数据库
      // await this.saveFaqToDatabase(newFaq);
      
      return newFaq;
    } catch (error) {
      logger.error('Failed to add FAQ:', error);
      throw new AppError('添加FAQ失败', 500);
    }
  }

  /**
   * 获取所有FAQ
   * @param {Object} filters 过滤条件
   * @returns {Array} FAQ列表
   */
  getFaqs(filters = {}) {
    let faqs = [...this.faqCollection];
    
    if (filters.category) {
      faqs = faqs.filter(f => f.category === filters.category);
    }
    
    if (filters.tag) {
      const tag = filters.tag.toLowerCase();
      faqs = faqs.filter(f => 
        f.tags.some(t => t.toLowerCase().includes(tag))
      );
    }
    
    return faqs;
  }

  /**
   * 更新FAQ
   * @param {string} faqId FAQ ID
   * @param {Object} updates 更新数据
   * @returns {Object} 更新后的FAQ
   */
  updateFaq(faqId, updates) {
    try {
      const faqIndex = this.faqCollection.findIndex(f => f.id === faqId);
      if (faqIndex === -1) {
        throw new AppError('FAQ不存在', 404);
      }

      this.faqCollection[faqIndex] = {
        ...this.faqCollection[faqIndex],
        ...updates
      };

      logger.info(`Updated FAQ: ${faqId}`);
      return this.faqCollection[faqIndex];
    } catch (error) {
      logger.error(`Failed to update FAQ ${faqId}:`, error);
      throw error;
    }
  }

  /**
   * 删除FAQ
   * @param {string} faqId FAQ ID
   * @returns {boolean} 是否删除成功
   */
  deleteFaq(faqId) {
    try {
      const initialLength = this.faqCollection.length;
      this.faqCollection = this.faqCollection.filter(f => f.id !== faqId);
      
      if (this.faqCollection.length === initialLength) {
        throw new AppError('FAQ不存在', 404);
      }

      logger.info(`Deleted FAQ: ${faqId}`);
      return true;
    } catch (error) {
      logger.error(`Failed to delete FAQ ${faqId}:`, error);
      throw error;
    }
  }

  /**
   * 导出自动回复规则
   * @returns {Array} 规则列表
   */
  exportAutoReplyRules() {
    return [...this.replyRules];
  }

  /**
   * 导出FAQ
   * @returns {Array} FAQ列表
   */
  exportFaqs() {
    return [...this.faqCollection];
  }

  /**
   * 清空所有规则
   */
  clearAllRules() {
    this.replyRules = [];
    logger.info('Cleared all auto reply rules');
  }

  /**
   * 清空所有FAQ
   */
  clearAllFaqs() {
    this.faqCollection = [];
    logger.info('Cleared all FAQs');
  }
}

module.exports = new AutoReplyService();