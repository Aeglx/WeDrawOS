/**
 * 邮件工具
 * 提供邮件发送和管理功能
 */

const nodemailer = require('nodemailer');
const { EventEmitter } = require('events');
const { logger } = require('../logger');
const { cryptoUtils } = require('../crypto');
const { typeUtils } = require('../type');
const { stringUtils } = require('../string');
const { fileUtils } = require('../file');
const { templateUtils } = require('../template');
const { timeUtils } = require('../time');
const { performanceUtils } = require('../performance');
const { queueUtils } = require('../queue');
const { logContext } = require('../logger/LogContext');

/**
 * 邮件优先级枚举
 */
const EmailPriority = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent'
};

/**
 * 邮件状态枚举
 */
const EmailStatus = {
  QUEUED: 'queued',
  SENDING: 'sending',
  SENT: 'sent',
  FAILED: 'failed',
  DELIVERED: 'delivered',
  OPENED: 'opened',
  CLICKED: 'clicked'
};

/**
 * 附件类型枚举
 */
const AttachmentType = {
  FILE: 'file',
  BUFFER: 'buffer',
  STREAM: 'stream',
  URL: 'url'
};

/**
 * 邮件模板引擎枚举
 */
const TemplateEngine = {
  PLAIN: 'plain',
  EJS: 'ejs',
  HANDLEBARS: 'handlebars',
  PUG: 'pug',
  MUSTACHE: 'mustache'
};

/**
 * 邮件工具类
 * 提供邮件发送和管理功能
 */
class EmailUtils extends EventEmitter {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   */
  constructor(options = {}) {
    super();

    this.options = {
      defaultFrom: options.defaultFrom || 'no-reply@example.com',
      defaultReplyTo: options.defaultReplyTo,
      transport: options.transport || {
        host: 'smtp.example.com',
        port: 587,
        secure: false,
        auth: {
          user: '',
          pass: ''
        }
      },
      queue: options.queue || true,
      queueOptions: options.queueOptions || {},
      templateEngine: options.templateEngine || TemplateEngine.PLAIN,
      templateDir: options.templateDir || './templates/email',
      tracking: options.tracking || false,
      clickTracking: options.clickTracking || true,
      openTracking: options.openTracking || true,
      throttle: options.throttle || null, // 如 { rate: 10, period: '1s' }
      retryOptions: options.retryOptions || {
        maxRetries: 3,
        retryDelay: 5000,
        exponentialBackoff: true
      },
      ...options
    };

    // 初始化邮件传输器
    this.transport = null;
    this._initTransport();

    // 初始化队列
    this.emailQueue = null;
    if (this.options.queue) {
      this._initQueue();
    }

    // 延迟加载第三方依赖
    this._dependencies = {};

    // 统计信息
    this.stats = {
      sent: 0,
      failed: 0,
      queued: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      attachments: 0,
      retries: 0,
      totalSendTime: 0
    };

    // 跟踪信息
    this._trackingIdMap = new Map();

    // 设置最大监听器
    this.setMaxListeners(50);

    logger.debug('邮件工具初始化完成', {
      defaultFrom: this.options.defaultFrom,
      queueEnabled: this.options.queue,
      templateEngine: this.options.templateEngine
    });
  }

  /**
   * 初始化邮件传输器
   * @private
   */
  _initTransport() {
    try {
      // 如果提供了自定义传输器
      if (this.options.transport && typeof this.options.transport.sendMail === 'function') {
        this.transport = this.options.transport;
      } else {
        // 创建nodemailer传输器
        this.transport = nodemailer.createTransport(this.options.transport);
      }
      
      logger.debug('邮件传输器初始化成功');
    } catch (error) {
      logger.error('邮件传输器初始化失败', {
        error: error.message
      });
      // 继续运行，但发送邮件时会失败
    }
  }

  /**
   * 初始化队列
   * @private
   */
  _initQueue() {
    try {
      this.emailQueue = queueUtils.createPriorityQueue({
        name: 'email',
        concurrency: this.options.queueOptions.concurrency || 5,
        autoStart: true,
        ...this.options.queueOptions
      });

      // 设置队列处理器
      this.emailQueue.process(this._processEmail.bind(this));

      // 监听队列事件
      this.emailQueue.on('error', (error) => {
        logger.error('邮件队列错误', {
          error: error.message
        });
      });

      this.emailQueue.on('task.completed', (task) => {
        this.emit('email.sent', {
          to: task.data.to,
          subject: task.data.subject,
          messageId: task.data.messageId
        });
      });

      logger.debug('邮件队列初始化成功');
    } catch (error) {
      logger.error('邮件队列初始化失败', {
        error: error.message
      });
      // 禁用队列回退到直接发送
      this.options.queue = false;
    }
  }

  /**
   * 加载依赖模块
   * @param {string} moduleName - 模块名称
   * @returns {Promise<any>} 模块实例
   * @private
   */
  async _loadDependency(moduleName) {
    if (!this._dependencies[moduleName]) {
      try {
        this._dependencies[moduleName] = require(moduleName);
      } catch (error) {
        logger.warn(`无法加载依赖模块 ${moduleName}，某些功能可能不可用`, { error: error.message });
        this._dependencies[moduleName] = null;
      }
    }
    return this._dependencies[moduleName];
  }

  /**
   * 发送邮件
   * @param {Object} options - 邮件选项
   * @returns {Promise<Object>} 发送结果
   */
  async send(options) {
    const startTime = performance.now();
    const requestId = logContext.getRequestId() || cryptoUtils.generateUUID();
    
    try {
      // 验证和标准化邮件选项
      const emailOptions = this._normalizeEmailOptions(options, requestId);
      
      logger.debug('准备发送邮件', {
        to: emailOptions.to,
        subject: emailOptions.subject,
        requestId
      });

      // 处理节流
      if (this.options.throttle) {
        await this._throttleCheck();
      }

      // 生成跟踪ID
      if (this.options.tracking) {
        const trackingId = this._generateTrackingId(emailOptions);
        emailOptions.headers = emailOptions.headers || {};
        emailOptions.headers['X-Email-Tracking-ID'] = trackingId;
      }

      // 处理模板
      if (emailOptions.template) {
        await this._processTemplate(emailOptions);
      }

      // 处理附件
      if (emailOptions.attachments) {
        await this._processAttachments(emailOptions);
      }

      // 处理跟踪像素
      if (this.options.tracking && this.options.openTracking) {
        await this._addOpenTracking(emailOptions);
      }

      // 处理链接跟踪
      if (this.options.tracking && this.options.clickTracking && emailOptions.html) {
        this._processClickTracking(emailOptions);
      }

      // 决定是队列还是直接发送
      if (this.options.queue && this.emailQueue) {
        return this._queueEmail(emailOptions, startTime, requestId);
      } else {
        return this._sendEmail(emailOptions, startTime, requestId);
      }
    } catch (error) {
      const duration = performance.now() - startTime;
      
      logger.error('发送邮件失败', {
        to: options.to,
        subject: options.subject,
        error: error.message,
        duration,
        requestId
      });
      
      this.emit('email.error', {
        to: options.to,
        subject: options.subject,
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * 标准化邮件选项
   * @param {Object} options - 原始选项
   * @param {string} requestId - 请求ID
   * @returns {Object} 标准化后的选项
   * @private
   */
  _normalizeEmailOptions(options, requestId) {
    const emailOptions = {
      from: options.from || this.options.defaultFrom,
      to: this._normalizeRecipients(options.to),
      subject: options.subject || '无主题',
      text: options.text,
      html: options.html,
      replyTo: options.replyTo || this.options.defaultReplyTo,
      cc: this._normalizeRecipients(options.cc),
      bcc: this._normalizeRecipients(options.bcc),
      headers: options.headers || {},
      attachments: options.attachments,
      template: options.template,
      templateData: options.templateData || {},
      priority: options.priority || EmailPriority.NORMAL,
      trackingId: options.trackingId,
      ...options
    };

    // 设置优先级头部
    if (emailOptions.priority !== EmailPriority.NORMAL) {
      emailOptions.headers['X-Priority'] = this._getPriorityHeader(emailOptions.priority);
    }

    // 添加请求ID
    emailOptions.headers['X-Request-ID'] = requestId;

    // 验证必需字段
    if (!emailOptions.to || emailOptions.to.length === 0) {
      throw new Error('收件人不能为空');
    }

    if (!emailOptions.text && !emailOptions.html && !emailOptions.template) {
      throw new Error('邮件内容（text、html或template）不能为空');
    }

    return emailOptions;
  }

  /**
   * 标准化收件人列表
   * @param {string|Array} recipients - 收件人
   * @returns {Array|null} 标准化后的收件人列表
   * @private
   */
  _normalizeRecipients(recipients) {
    if (!recipients) {
      return null;
    }

    if (typeUtils.isString(recipients)) {
      return recipients.split(/[,;]/).map(r => r.trim()).filter(r => r);
    }

    if (typeUtils.isArray(recipients)) {
      return recipients.filter(r => r);
    }

    return null;
  }

  /**
   * 获取优先级头部值
   * @param {string} priority - 优先级
   * @returns {string} 头部值
   * @private
   */
  _getPriorityHeader(priority) {
    switch (priority) {
      case EmailPriority.LOW:
        return '5';
      case EmailPriority.HIGH:
        return '2';
      case EmailPriority.URGENT:
        return '1';
      default:
        return '3';
    }
  }

  /**
   * 生成跟踪ID
   * @param {Object} emailOptions - 邮件选项
   * @returns {string} 跟踪ID
   * @private
   */
  _generateTrackingId(emailOptions) {
    const trackingId = cryptoUtils.generateUUID();
    
    // 存储跟踪信息
    this._trackingIdMap.set(trackingId, {
      to: emailOptions.to,
      subject: emailOptions.subject,
      sentAt: Date.now()
    });
    
    return trackingId;
  }

  /**
   * 处理模板
   * @param {Object} emailOptions - 邮件选项
   * @private
   */
  async _processTemplate(emailOptions) {
    try {
      // 使用模板工具渲染
      const result = await templateUtils.render(emailOptions.template, emailOptions.templateData, {
        engine: emailOptions.templateEngine || this.options.templateEngine,
        templateDir: this.options.templateDir
      });
      
      // 设置渲染后的内容
      if (result.html) {
        emailOptions.html = result.html;
      }
      if (result.text) {
        emailOptions.text = result.text;
      }
    } catch (error) {
      logger.error('渲染邮件模板失败', {
        template: emailOptions.template,
        error: error.message
      });
      throw new Error(`模板渲染失败: ${error.message}`);
    }
  }

  /**
   * 处理附件
   * @param {Object} emailOptions - 邮件选项
   * @private
   */
  async _processAttachments(emailOptions) {
    const processedAttachments = [];
    
    for (const attachment of emailOptions.attachments) {
      if (typeUtils.isString(attachment)) {
        // 字符串视为文件路径
        await this._processFileAttachment(attachment, processedAttachments);
      } else if (typeUtils.isObject(attachment)) {
        if (attachment.path) {
          // 文件路径类型
          await this._processFileAttachment(attachment, processedAttachments);
        } else if (attachment.url) {
          // URL类型
          await this._processUrlAttachment(attachment, processedAttachments);
        } else if (attachment.buffer) {
          // Buffer类型
          processedAttachments.push(attachment);
        } else if (attachment.content) {
          // 内容类型
          processedAttachments.push(attachment);
        }
      }
    }
    
    emailOptions.attachments = processedAttachments;
    this.stats.attachments += processedAttachments.length;
  }

  /**
   * 处理文件附件
   * @param {string|Object} attachment - 附件信息
   * @param {Array} processedAttachments - 处理后的附件列表
   * @private
   */
  async _processFileAttachment(attachment, processedAttachments) {
    let path;
    let filename;
    let options = {};
    
    if (typeUtils.isString(attachment)) {
      path = attachment;
      filename = fileUtils.basename(path);
    } else {
      path = attachment.path;
      filename = attachment.filename || fileUtils.basename(path);
      options = { ...attachment, path, filename };
      delete options.path; // 避免重复
    }
    
    // 检查文件是否存在
    if (await fileUtils.exists(path)) {
      processedAttachments.push({
        filename,
        path,
        ...options
      });
    } else {
      logger.warn('附件文件不存在', { path });
    }
  }

  /**
   * 处理URL附件
   * @param {Object} attachment - 附件信息
   * @param {Array} processedAttachments - 处理后的附件列表
   * @private
   */
  async _processUrlAttachment(attachment, processedAttachments) {
    try {
      const httpUtils = require('../http').httpUtils;
      const response = await httpUtils.get(attachment.url, {
        responseType: 'buffer'
      });
      
      const filename = attachment.filename || this._extractFilenameFromUrl(attachment.url);
      
      processedAttachments.push({
        filename,
        content: response.data,
        contentType: response.headers['content-type'] || 'application/octet-stream',
        ...attachment,
        // 移除url字段，使用content
        url: undefined
      });
    } catch (error) {
      logger.warn('下载URL附件失败', {
        url: attachment.url,
        error: error.message
      });
    }
  }

  /**
   * 从URL提取文件名
   * @param {string} url - URL
   * @returns {string} 文件名
   * @private
   */
  _extractFilenameFromUrl(url) {
    try {
      const parsedUrl = new URL(url);
      const pathname = parsedUrl.pathname;
      return pathname.substring(pathname.lastIndexOf('/') + 1) || 'attachment.bin';
    } catch {
      return 'attachment.bin';
    }
  }

  /**
   * 添加打开跟踪
   * @param {Object} emailOptions - 邮件选项
   * @private
   */
  async _addOpenTracking(emailOptions) {
    if (!emailOptions.html) {
      return;
    }

    const trackingId = emailOptions.headers['X-Email-Tracking-ID'];
    // 创建1x1像素的透明图片
    const pixelUrl = `https://${emailOptions.from.split('@')[1] || 'example.com'}/api/email/open/${trackingId}?t=${Date.now()}`;
    
    const trackingPixel = `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:none;" />`;
    
    // 添加到HTML内容末尾
    emailOptions.html += trackingPixel;
  }

  /**
   * 处理点击跟踪
   * @param {Object} emailOptions - 邮件选项
   * @private
   */
  _processClickTracking(emailOptions) {
    const trackingId = emailOptions.headers['X-Email-Tracking-ID'];
    
    // 使用正则表达式替换所有<a>标签中的href
    emailOptions.html = emailOptions.html.replace(/<a\s+href="([^"]+)"/gi, (match, originalUrl) => {
      // 只替换http/https链接
      if (originalUrl.startsWith('http://') || originalUrl.startsWith('https://')) {
        const encodedUrl = encodeURIComponent(originalUrl);
        const trackedUrl = `https://${emailOptions.from.split('@')[1] || 'example.com'}/api/email/click/${trackingId}?url=${encodedUrl}`;
        return `<a href="${trackedUrl}"`;
      }
      return match;
    });
  }

  /**
   * 节流检查
   * @private
   */
  async _throttleCheck() {
    // 简单的节流实现
    // 实际应用中可能需要更复杂的实现
    if (this._lastSendTime && this.options.throttle) {
      const { rate, period } = this.options.throttle;
      const periodMs = timeUtils.parseDuration(period);
      const minIntervalMs = periodMs / rate;
      const timeSinceLastSend = Date.now() - this._lastSendTime;
      
      if (timeSinceLastSend < minIntervalMs) {
        await new Promise(resolve => setTimeout(resolve, minIntervalMs - timeSinceLastSend));
      }
    }
    
    this._lastSendTime = Date.now();
  }

  /**
   * 队列邮件
   * @param {Object} emailOptions - 邮件选项
   * @param {number} startTime - 开始时间
   * @param {string} requestId - 请求ID
   * @returns {Promise<Object>} 队列结果
   * @private
   */
  _queueEmail(emailOptions, startTime, requestId) {
    return new Promise((resolve, reject) => {
      try {
        // 确定优先级
        let priority = 0;
        switch (emailOptions.priority) {
          case EmailPriority.URGENT:
            priority = 10;
            break;
          case EmailPriority.HIGH:
            priority = 5;
            break;
          case EmailPriority.LOW:
            priority = -5;
            break;
          default:
            priority = 0;
        }

        // 添加到队列
        const task = this.emailQueue.add(emailOptions, {
          priority,
          requestId
        });

        // 更新统计信息
        this.stats.queued++;

        logger.debug('邮件已加入队列', {
          to: emailOptions.to,
          subject: emailOptions.subject,
          taskId: task.id,
          priority,
          requestId
        });

        this.emit('email.queued', {
          to: emailOptions.to,
          subject: emailOptions.subject,
          taskId: task.id
        });

        resolve({
          status: EmailStatus.QUEUED,
          messageId: null,
          taskId: task.id,
          to: emailOptions.to,
          subject: emailOptions.subject
        });
      } catch (error) {
        reject(new Error(`队列邮件失败: ${error.message}`));
      }
    });
  }

  /**
   * 发送邮件
   * @param {Object} emailOptions - 邮件选项
   * @param {number} startTime - 开始时间
   * @param {string} requestId - 请求ID
   * @param {number} retryCount - 重试次数
   * @returns {Promise<Object>} 发送结果
   * @private
   */
  async _sendEmail(emailOptions, startTime, requestId, retryCount = 0) {
    try {
      if (!this.transport) {
        throw new Error('邮件传输器未初始化');
      }

      // 发送邮件
      const info = await this.transport.sendMail(emailOptions);
      
      const duration = performance.now() - startTime;
      
      // 更新统计信息
      this.stats.sent++;
      this.stats.totalSendTime += duration;
      
      performanceUtils.recordTimer('email.send', duration);
      
      logger.info('邮件发送成功', {
        to: emailOptions.to,
        subject: emailOptions.subject,
        messageId: info.messageId,
        duration: Math.round(duration),
        requestId
      });

      this.emit('email.sent', {
        to: emailOptions.to,
        subject: emailOptions.subject,
        messageId: info.messageId,
        duration
      });

      return {
        status: EmailStatus.SENT,
        messageId: info.messageId,
        to: emailOptions.to,
        subject: emailOptions.subject,
        duration
      };
    } catch (error) {
      // 处理重试
      if (retryCount < this.options.retryOptions.maxRetries && this._shouldRetry(error)) {
        this.stats.retries++;
        
        const delay = this._calculateRetryDelay(retryCount);
        
        logger.debug('邮件发送失败，准备重试', {
          to: emailOptions.to,
          subject: emailOptions.subject,
          error: error.message,
          retryCount: retryCount + 1,
          maxRetries: this.options.retryOptions.maxRetries,
          delay: Math.round(delay),
          requestId
        });

        // 等待延迟后重试
        await new Promise(resolve => setTimeout(resolve, delay));
        return this._sendEmail(emailOptions, startTime, requestId, retryCount + 1);
      }

      // 更新统计信息
      this.stats.failed++;
      
      const duration = performance.now() - startTime;
      
      logger.error('邮件发送失败', {
        to: emailOptions.to,
        subject: emailOptions.subject,
        error: error.message,
        duration,
        retryCount,
        requestId
      });

      this.emit('email.failed', {
        to: emailOptions.to,
        subject: emailOptions.subject,
        error: error.message
      });

      throw new Error(`邮件发送失败: ${error.message}`);
    }
  }

  /**
   * 处理队列中的邮件
   * @param {Object} task - 任务对象
   * @returns {Promise<void>}
   * @private
   */
  async _processEmail(task) {
    const emailOptions = task.data;
    const requestId = task.options.requestId || cryptoUtils.generateUUID();
    const startTime = performance.now();

    try {
      // 设置请求上下文
      logContext.setRequestId(requestId);

      logger.debug('处理队列中的邮件', {
        to: emailOptions.to,
        subject: emailOptions.subject,
        taskId: task.id,
        requestId
      });

      // 发送邮件
      const result = await this._sendEmail(emailOptions, startTime, requestId);

      // 更新任务结果
      task.result = result;
    } catch (error) {
      logger.error('处理队列邮件失败', {
        taskId: task.id,
        to: emailOptions.to,
        subject: emailOptions.subject,
        error: error.message,
        requestId
      });
      throw error;
    }
  }

  /**
   * 检查是否应该重试
   * @param {Error} error - 错误对象
   * @returns {boolean} 是否应该重试
   * @private
   */
  _shouldRetry(error) {
    // 网络错误应该重试
    const retryableErrors = [
      'ETIMEDOUT',
      'ECONNRESET',
      'ECONNREFUSED',
      'EAI_AGAIN',
      'Socket Error',
      'Connection timeout',
      'Service unavailable'
    ];

    return retryableErrors.some(err => error.message.includes(err));
  }

  /**
   * 计算重试延迟
   * @param {number} retryCount - 重试次数
   * @returns {number} 延迟时间（毫秒）
   * @private
   */
  _calculateRetryDelay(retryCount) {
    if (this.options.retryOptions.exponentialBackoff) {
      // 指数退避
      return this.options.retryOptions.retryDelay * Math.pow(2, retryCount) + 
        Math.random() * 1000; // 添加随机抖动
    } else {
      // 固定延迟
      return this.options.retryOptions.retryDelay;
    }
  }

  /**
   * 验证邮件地址
   * @param {string} email - 邮件地址
   * @returns {Object} 验证结果
   */
  validateEmail(email) {
    if (!typeUtils.isString(email)) {
      return { valid: false, reason: '不是有效的字符串' };
    }

    // 简单的邮件验证正则表达式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);

    if (!isValid) {
      return { valid: false, reason: '格式不正确' };
    }

    // 检查域名部分
    const parts = email.split('@');
    const domain = parts[1];
    
    // 检查常见的无效域名
    const invalidDomains = [
      'example.com',
      'test.com',
      'example.org'
    ];

    if (invalidDomains.includes(domain.toLowerCase())) {
      return { valid: false, reason: '测试域名' };
    }

    return { valid: true, email: email.trim() };
  }

  /**
   * 批量发送邮件
   * @param {Array} emails - 邮件配置数组
   * @param {Object} options - 批量选项
   * @returns {Promise<Array>} 发送结果数组
   */
  async sendBatch(emails, options = {}) {
    const concurrency = options.concurrency || 3;
    const results = [];
    
    // 使用分批处理
    for (let i = 0; i < emails.length; i += concurrency) {
      const batch = emails.slice(i, i + concurrency);
      
      logger.debug('处理邮件批次', {
        batchSize: batch.length,
        current: i + 1,
        total: emails.length
      });

      const batchPromises = batch.map((email, index) => {
        return this.send(email)
          .then(result => ({ index: i + index, result }))
          .catch(error => ({ index: i + index, error: error.message }));
      });

      const batchResults = await Promise.all(batchPromises);
      
      batchResults.forEach(({ index, result, error }) => {
        results[index] = error ? { error } : result;
      });

      // 可选的批处理间隔
      if (options.batchInterval && i + concurrency < emails.length) {
        await new Promise(resolve => setTimeout(resolve, options.batchInterval));
      }
    }

    return results;
  }

  /**
   * 创建邮件模板
   * @param {string} name - 模板名称
   * @param {Object} content - 模板内容
   * @param {Object} options - 选项
   * @returns {Promise<boolean>} 创建结果
   */
  async createTemplate(name, content, options = {}) {
    try {
      const engine = options.engine || this.options.templateEngine;
      const templateDir = options.templateDir || this.options.templateDir;
      
      // 确保模板目录存在
      await fileUtils.ensureDir(templateDir);
      
      // 根据引擎确定文件扩展名
      const ext = this._getTemplateExtension(engine);
      
      // 写入模板文件
      const templatePath = `${templateDir}/${name}${ext}`;
      await fileUtils.writeFile(templatePath, content);
      
      logger.info('邮件模板创建成功', {
        name,
        engine,
        path: templatePath
      });
      
      return true;
    } catch (error) {
      logger.error('创建邮件模板失败', {
        name,
        error: error.message
      });
      return false;
    }
  }

  /**
   * 获取模板文件扩展名
   * @param {string} engine - 模板引擎
   * @returns {string} 文件扩展名
   * @private
   */
  _getTemplateExtension(engine) {
    switch (engine) {
      case TemplateEngine.EJS:
        return '.ejs';
      case TemplateEngine.HANDLEBARS:
        return '.hbs';
      case TemplateEngine.PUG:
        return '.pug';
      case TemplateEngine.MUSTACHE:
        return '.mustache';
      default:
        return '.html';
    }
  }

  /**
   * 验证SMTP连接
   * @returns {Promise<Object>} 验证结果
   */
  async verifyConnection() {
    try {
      if (!this.transport) {
        throw new Error('邮件传输器未初始化');
      }

      const result = await this.transport.verify();
      
      logger.info('SMTP连接验证成功', { result });
      
      return { valid: true, message: result };
    } catch (error) {
      logger.error('SMTP连接验证失败', {
        error: error.message
      });
      
      return { valid: false, error: error.message };
    }
  }

  /**
   * 创建邮件预览URL
   * @param {Object} emailOptions - 邮件选项
   * @returns {Promise<string>} 预览URL
   */
  async createPreviewUrl(emailOptions) {
    try {
      // 安装预览依赖（如果需要）
      const preview = await this._loadDependency('preview-email');
      
      if (!preview) {
        throw new Error('预览功能不可用，请安装preview-email包');
      }

      // 标准化邮件选项
      const options = this._normalizeEmailOptions(emailOptions);
      
      // 生成预览URL
      const url = await preview(options);
      
      logger.debug('生成邮件预览成功');
      
      return url;
    } catch (error) {
      logger.error('生成邮件预览失败', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * 获取统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    return {
      ...this.stats,
      queueLength: this.emailQueue ? this.emailQueue.length : 0,
      avgSendTime: this.stats.sent > 0 ? 
        Math.round(this.stats.totalSendTime / this.stats.sent) : 0,
      trackingIds: this._trackingIdMap.size
    };
  }

  /**
   * 重置统计信息
   */
  resetStats() {
    this.stats = {
      sent: 0,
      failed: 0,
      queued: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      attachments: 0,
      retries: 0,
      totalSendTime: 0
    };
    
    logger.debug('邮件工具统计信息已重置');
  }

  /**
   * 静态实例
   * @private
   */
  static _instance = null;

  /**
   * 获取单例实例
   * @param {Object} options - 配置选项
   * @returns {EmailUtils} 邮件工具实例
   */
  static getInstance(options = {}) {
    if (!EmailUtils._instance) {
      EmailUtils._instance = new EmailUtils(options);
    }
    return EmailUtils._instance;
  }

  /**
   * 创建新的邮件工具实例
   * @param {Object} options - 配置选项
   * @returns {EmailUtils} 邮件工具实例
   */
  static create(options = {}) {
    return new EmailUtils(options);
  }
}

// 创建默认实例
const defaultEmailUtils = EmailUtils.getInstance();

module.exports = {
  EmailUtils,
  emailUtils: defaultEmailUtils,
  EmailPriority,
  EmailStatus,
  AttachmentType,
  TemplateEngine
};