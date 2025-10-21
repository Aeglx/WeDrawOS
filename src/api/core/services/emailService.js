/**
 * 邮件服务
 * 提供邮件发送功能
 */

const nodemailer = require('nodemailer');
const { AppError } = require('../exception/handlers/errorHandler');
const logger = require('../utils/logger');
const config = require('../config/config');
const StringUtils = require('../utils/stringUtils');

class EmailService {
  constructor() {
    this.transporter = null;
    this.config = {
      host: config.get('email.host', ''),
      port: config.get('email.port', 587),
      secure: config.get('email.secure', false),
      auth: {
        user: config.get('email.username', ''),
        pass: config.get('email.password', '')
      },
      from: config.get('email.from', '')
    };
    
    this.initialize();
  }

  /**
   * 初始化邮件发送器
   */
  initialize() {
    try {
      // 验证必要配置
      if (!this.config.host || !this.config.auth.user || !this.config.auth.pass) {
        logger.warn('邮件服务配置不完整，将使用模拟模式');
        // 创建一个模拟的发送器
        this.transporter = {
          sendMail: async (mailOptions) => {
            logger.info('模拟发送邮件:', { to: mailOptions.to, subject: mailOptions.subject });
            return { messageId: 'mock-' + Date.now() };
          }
        };
      } else {
        // 创建真实的Nodemailer发送器
        this.transporter = nodemailer.createTransport({
          host: this.config.host,
          port: this.config.port,
          secure: this.config.secure,
          auth: this.config.auth,
          tls: {
            rejectUnauthorized: config.get('email.rejectUnauthorized', true)
          }
        });
        
        // 验证连接
        this.verifyConnection();
      }
      
      logger.info('邮件服务初始化成功');
    } catch (error) {
      logger.error('邮件服务初始化失败:', { error });
      // 即使初始化失败，也创建模拟发送器以避免应用崩溃
      this.transporter = {
        sendMail: async () => ({
          messageId: 'fallback-' + Date.now()
        })
      };
    }
  }

  /**
   * 验证邮件服务器连接
   */
  async verifyConnection() {
    try {
      await this.transporter.verify();
      logger.info('邮件服务器连接验证成功');
    } catch (error) {
      logger.warn('邮件服务器连接验证失败:', { error });
      // 不抛出错误，继续使用，让发送邮件时再处理错误
    }
  }

  /**
   * 发送邮件
   * @param {Object} options - 邮件选项
   * @param {string|Array<string>} options.to - 收件人
   * @param {string} options.subject - 邮件主题
   * @param {string} options.text - 纯文本内容
   * @param {string} options.html - HTML内容
   * @param {Array<Object>} options.attachments - 附件列表
   * @param {string} options.from - 发件人（覆盖配置）
   * @param {string|Array<string>} options.cc - 抄送
   * @param {string|Array<string>} options.bcc - 密送
   * @returns {Promise<Object>} 发送结果
   */
  async sendMail(options = {}) {
    try {
      // 验证必要参数
      if (!options.to) {
        throw new AppError('收件人不能为空', 400);
      }
      
      if (!options.subject) {
        throw new AppError('邮件主题不能为空', 400);
      }
      
      if (!options.text && !options.html) {
        throw new AppError('邮件内容不能为空', 400);
      }

      // 格式化收件人
      const to = Array.isArray(options.to) ? options.to.join(', ') : options.to;
      
      // 构建邮件选项
      const mailOptions = {
        from: options.from || this.config.from,
        to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        cc: options.cc,
        bcc: options.bcc,
        attachments: options.attachments
      };

      // 发送邮件
      const info = await this.transporter.sendMail(mailOptions);
      
      logger.info('邮件发送成功', {
        to,
        subject: options.subject,
        messageId: info.messageId
      });
      
      return info;
    } catch (error) {
      logger.error('邮件发送失败', {
        to: options.to,
        subject: options.subject,
        error: error.message
      });
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError(`邮件发送失败: ${error.message}`, 500);
    }
  }

  /**
   * 发送模板邮件
   * @param {string|Array<string>} to - 收件人
   * @param {string} subject - 邮件主题
   * @param {string} template - 模板内容
   * @param {Object} data - 模板数据
   * @returns {Promise<Object>} 发送结果
   */
  async sendTemplateMail(to, subject, template, data = {}) {
    try {
      // 替换模板变量
      let htmlContent = template;
      let textContent = template;
      
      // 简单的模板替换（支持 ${variable} 格式）
      Object.keys(data).forEach(key => {
        const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
        htmlContent = htmlContent.replace(regex, data[key] || '');
        textContent = textContent.replace(regex, data[key] || '');
      });

      // 移除HTML标签以生成纯文本版本
      textContent = textContent
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();

      return await this.sendMail({
        to,
        subject,
        html: htmlContent,
        text: textContent
      });
    } catch (error) {
      logger.error('发送模板邮件失败', { error });
      throw new AppError('模板邮件发送失败', 500);
    }
  }

  /**
   * 发送验证码邮件
   * @param {string} to - 收件人
   * @param {string} code - 验证码
   * @param {number} expireMinutes - 过期时间（分钟）
   * @returns {Promise<Object>} 发送结果
   */
  async sendVerificationCode(to, code, expireMinutes = 15) {
    const subject = '您的验证码';
    const template = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">验证码</h2>
        <p>您好：</p>
        <p>您的验证码是：<strong style="font-size: 24px; color: #007bff;">${code}</strong></p>
        <p>请在 <strong>${expireMinutes}</strong> 分钟内使用此验证码，过期将失效。</p>
        <p>如果您没有请求此验证码，请忽略此邮件。</p>
        <p style="margin-top: 30px; color: #666;">此邮件为系统自动发送，请勿回复。</p>
      </div>
    `;

    return await this.sendTemplateMail(to, subject, template);
  }

  /**
   * 发送重置密码邮件
   * @param {string} to - 收件人
   * @param {string} resetUrl - 重置密码链接
   * @param {number} expireHours - 过期时间（小时）
   * @returns {Promise<Object>} 发送结果
   */
  async sendPasswordReset(to, resetUrl, expireHours = 24) {
    const subject = '重置您的密码';
    const template = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">重置密码</h2>
        <p>您好：</p>
        <p>我们收到了您重置密码的请求。请点击以下链接重置您的密码：</p>
        <p style="text-align: center; margin: 20px 0;">
          <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
            重置密码
          </a>
        </p>
        <p>此链接将在 <strong>${expireHours}</strong> 小时后过期。</p>
        <p>如果您没有请求重置密码，请忽略此邮件。</p>
        <p style="margin-top: 30px; color: #666;">此邮件为系统自动发送，请勿回复。</p>
      </div>
    `;

    return await this.sendTemplateMail(to, subject, template);
  }

  /**
   * 发送账户激活邮件
   * @param {string} to - 收件人
   * @param {string} activationUrl - 激活链接
   * @returns {Promise<Object>} 发送结果
   */
  async sendAccountActivation(to, activationUrl) {
    const subject = '激活您的账户';
    const template = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">账户激活</h2>
        <p>您好：</p>
        <p>感谢您注册我们的服务。请点击以下链接激活您的账户：</p>
        <p style="text-align: center; margin: 20px 0;">
          <a href="${activationUrl}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
            激活账户
          </a>
        </p>
        <p>如果您没有创建此账户，请忽略此邮件。</p>
        <p style="margin-top: 30px; color: #666;">此邮件为系统自动发送，请勿回复。</p>
      </div>
    `;

    return await this.sendTemplateMail(to, subject, template);
  }

  /**
   * 发送通知邮件
   * @param {string|Array<string>} to - 收件人
   * @param {string} subject - 邮件主题
   * @param {string} message - 通知消息
   * @param {Object} additionalInfo - 附加信息
   * @returns {Promise<Object>} 发送结果
   */
  async sendNotification(to, subject, message, additionalInfo = {}) {
    // 构建HTML内容
    let additionalInfoHtml = '';
    if (Object.keys(additionalInfo).length > 0) {
      additionalInfoHtml = '<div style="margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 4px;">';
      additionalInfoHtml += '<h4 style="margin-top: 0; color: #333;">附加信息：</h4>';
      additionalInfoHtml += '<ul>';
      
      Object.entries(additionalInfo).forEach(([key, value]) => {
        additionalInfoHtml += `<li><strong>${key}：</strong>${value}</li>`;
      });
      
      additionalInfoHtml += '</ul>';
      additionalInfoHtml += '</div>';
    }

    const template = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">${subject}</h2>
        <div style="line-height: 1.6; color: #555;">
          ${message}
        </div>
        ${additionalInfoHtml}
        <p style="margin-top: 30px; color: #666;">此邮件为系统自动发送，请勿回复。</p>
      </div>
    `;

    return await this.sendTemplateMail(to, subject, template);
  }

  /**
   * 批量发送邮件（用于发送相同内容给多个收件人）
   * @param {Array<string>} recipients - 收件人列表
   * @param {string} subject - 邮件主题
   * @param {string} text - 纯文本内容
   * @param {string} html - HTML内容
   * @param {boolean} individual - 是否单独发送（每个收件人单独一封邮件）
   * @returns {Promise<Object>} 批量发送结果
   */
  async sendBatchMail(recipients, subject, text, html, individual = false) {
    const results = {
      success: [],
      failed: []
    };

    if (!Array.isArray(recipients) || recipients.length === 0) {
      throw new AppError('收件人列表不能为空', 400);
    }

    if (individual) {
      // 单独发送给每个收件人
      await Promise.all(recipients.map(async (recipient) => {
        try {
          await this.sendMail({
            to: recipient,
            subject,
            text,
            html
          });
          results.success.push(recipient);
        } catch (error) {
          results.failed.push({
            email: recipient,
            error: error.message
          });
        }
      }));
    } else {
      // 一次发送给所有收件人
      try {
        await this.sendMail({
          to: recipients,
          subject,
          text,
          html
        });
        results.success.push(...recipients);
      } catch (error) {
        recipients.forEach(email => {
          results.failed.push({
            email,
            error: error.message
          });
        });
      }
    }

    logger.info('批量邮件发送完成', {
      total: recipients.length,
      success: results.success.length,
      failed: results.failed.length
    });

    return results;
  }

  /**
   * 检查邮箱格式是否有效
   * @param {string} email - 邮箱地址
   * @returns {boolean} 是否有效
   */
  isValidEmail(email) {
    return StringUtils.isValidEmail(email);
  }

  /**
   * 获取邮件队列状态（如果使用队列的话）
   * 注意：这是一个占位方法，实际项目中可能需要集成消息队列
   * @returns {Promise<Object>} 队列状态
   */
  async getQueueStatus() {
    // 这里只是一个示例实现
    return {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0
    };
  }
}

// 创建单例实例
const emailService = new EmailService();

module.exports = emailService;