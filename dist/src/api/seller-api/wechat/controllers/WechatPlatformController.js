/**
 * 企业微信平台接口控制器
 * 为卖家提供安全的企业微信和公众号功能访问接口
 * 所有功能都经过权限验证和安全控制
 */

const logger = require('../../../core/utils/logger');
const { ForbiddenError, ValidationError } = require('../../../core/exception/types/BusinessExceptions');
const SellerWechatService = require('../services/SellerWechatService');
const wechatService = require('../../../core/services/wechatService');
const messageQueue = require('../../../core/messageQueue');

class WechatPlatformController {
  /**
   * 通过平台发送企业微信或公众号消息
   * 卖家只能发送预设模板的消息，不能自定义所有内容
   */
  async sendMessage(req, res) {
    try {
      const sellerId = req.user.id;
      const { templateId, receiverType, receiverIds, params, type = 'template' } = req.body;

      // 参数验证
      if (!templateId || !receiverType || !receiverIds || !Array.isArray(receiverIds) || receiverIds.length === 0) {
        throw new ValidationError('缺少必要参数');
      }

      // 验证消息类型
      if (!['template', 'text', 'image'].includes(type)) {
        throw new ValidationError('不支持的消息类型');
      }

      // 验证接收者类型
      if (!['user', 'group', 'all'].includes(receiverType)) {
        throw new ValidationError('不支持的接收者类型');
      }

      // 限制消息发送数量（防止滥用）
      if (receiverIds.length > 100) {
        throw new ValidationError('单次发送消息数量不能超过100个接收者');
      }

      // 验证发送消息权限
      await SellerWechatService.verifyPermission(sellerId, 'wechat:message:send');
      
      // 检查消息发送配额
      const quotaCheck = await SellerWechatService.checkMessageQuota(sellerId, receiverIds.length);
      if (!quotaCheck.hasQuota) {
        throw new ValidationError(`消息发送配额不足，今日已发送${quotaCheck.used}条，剩余${quotaCheck.remaining}条`);
      }

      // 记录发送日志
      logger.info(`卖家请求发送消息，卖家ID: ${sellerId}，模板: ${templateId}，接收者数量: ${receiverIds.length}`);

      // 调用微信服务发送消息
      const result = await wechatService.sendPlatformMessage({
        templateId,
        receiverType,
        receiverIds,
        params,
        type,
        senderId: sellerId,
        senderType: 'seller'
      });

      // 记录微信操作日志
      await SellerWechatService.logWechatOperation(sellerId, 'SEND_MESSAGE', {
        templateId,
        receiverType,
        receiverCount: receiverIds.length,
        type,
        messageId: result.messageId
      });

      // 发送消息队列（用于统计和审计）
      await messageQueue.publish('WECHAT.MESSAGE.SENT', {
        sellerId,
        templateId,
        receiverCount: receiverIds.length,
        type,
        timestamp: new Date()
      });

      return res.status(200).json({
        success: true,
        message: '消息发送成功',
        data: {
          messageId: result.messageId,
          sentCount: result.sentCount,
          failedCount: result.failedCount,
          timestamp: new Date()
        }
      });
    } catch (error) {
      logger.error(`卖家发送消息失败: ${error.message}`);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || '发送消息失败',
        error: error.code || 'INTERNAL_ERROR'
      });
    }
  }
  
  /**
   * 获取资源使用情况
   * 卖家可以查看企业微信相关功能的资源使用情况
   */
  async getResourceUsage(req, res) {
    try {
      const sellerId = req.user.id;
      
      // 获取资源使用情况
      const usageData = await SellerWechatService.getResourceUsage(sellerId);
      
      return res.status(200).json({
        success: true,
        message: '获取资源使用情况成功',
        data: usageData
      });
    } catch (error) {
      logger.error(`卖家获取资源使用情况失败: ${error.message}`);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || '获取资源使用情况失败',
        error: error.code || 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * 使用预设模板发送消息
   * 卖家可以选择平台提供的模板，填入参数后发送
   */
  async useTemplate(req, res) {
    try {
      const sellerId = req.user.id;
      const { templateKey, receiverId, data } = req.body;

      // 参数验证
      if (!templateKey || !receiverId || !data) {
        throw new ValidationError('缺少必要参数');
      }

      // 验证使用模板权限
      await SellerWechatService.verifyPermission(sellerId, 'wechat:template:use');
      
      // 检查消息发送配额
      const quotaCheck = await SellerWechatService.checkMessageQuota(sellerId, 1);
      if (!quotaCheck.hasQuota) {
        throw new ValidationError(`消息发送配额不足，今日已发送${quotaCheck.used}条，剩余${quotaCheck.remaining}条`);
      }

      // 获取卖家可用的模板列表
      const availableTemplates = await SellerWechatService.getAvailableTemplates(sellerId);
      
      // 验证模板是否可用
      if (!availableTemplates.some(t => t.key === templateKey)) {
        throw new ForbiddenError('您没有权限使用该模板');
      }

      // 发送模板消息
      const result = await wechatService.sendTemplateMessage({
        templateKey,
        receiverId,
        data,
        senderId: sellerId,
        senderType: 'seller'
      });
      
      // 记录微信操作日志
      await SellerWechatService.logWechatOperation(sellerId, 'USE_TEMPLATE', {
        templateKey,
        receiverId,
        messageId: result.messageId
      });

      return res.status(200).json({
        success: true,
        message: '模板消息发送成功',
        data: {
          messageId: result.messageId,
          status: result.status
        }
      });
    } catch (error) {
      logger.error(`卖家使用模板失败: ${error.message}`);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || '使用模板失败',
        error: error.code || 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * 预览自定义菜单效果
   * 卖家可以预览菜单效果，但不能直接修改生产环境菜单
   */
  async previewMenu(req, res) {
    try {
      const sellerId = req.user.id;
      const { menuConfig } = req.body;

      // 参数验证
      if (!menuConfig || typeof menuConfig !== 'object') {
        throw new ValidationError('菜单配置无效');
      }

      // 验证预览菜单权限
      await SellerWechatService.verifyPermission(sellerId, 'wechat:menu:preview');

      // 限制菜单复杂度（防止滥用）
      const menuItemsCount = this._countMenuItems(menuConfig);
      if (menuItemsCount > 16) {
        throw new ValidationError('菜单项目数量超过限制');
      }

      // 生成预览URL（不直接应用到生产环境）
      const previewData = await wechatService.generateMenuPreview({
        menuConfig,
        sellerId,
        timestamp: Date.now()
      });
      
      // 记录微信操作日志
      await SellerWechatService.logWechatOperation(sellerId, 'PREVIEW_MENU', {
        menuItemsCount,
        previewUrl: previewData.previewUrl
      });

      return res.status(200).json({
        success: true,
        message: '菜单预览生成成功',
        data: {
          previewUrl: previewData.previewUrl,
          qrcodeUrl: previewData.qrcodeUrl,
          expiresAt: previewData.expiresAt
        }
      });
    } catch (error) {
      logger.error(`卖家预览菜单失败: ${error.message}`);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || '预览菜单失败',
        error: error.code || 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * 生成推广二维码
   * 卖家可以生成带参数的二维码用于推广
   */
  async generateQrcode(req, res) {
    try {
      const sellerId = req.user.id;
      const { scene, expireSeconds = 604800, size = 430 } = req.body;

      // 参数验证
      if (!scene || typeof scene !== 'string') {
        throw new ValidationError('场景值无效');
      }

      // 验证生成二维码权限
      await SellerWechatService.verifyPermission(sellerId, 'wechat:qrcode:generate');

      // 限制场景值长度
      if (scene.length > 64) {
        throw new ValidationError('场景值长度超过限制');
      }

      // 限制过期时间（最长30天）
      if (expireSeconds > 2592000) {
        throw new ValidationError('过期时间不能超过30天');
      }

      // 添加卖家标识到场景值
      const finalScene = `seller_${sellerId}_${scene}`;

      // 生成二维码
      const qrcodeData = await wechatService.generateQrcode({
        scene: finalScene,
        expireSeconds,
        size,
        source: 'seller_platform',
        sourceId: sellerId
      });
      
      // 记录微信操作日志
      await SellerWechatService.logWechatOperation(sellerId, 'GENERATE_QRCODE', {
        scene,
        expireSeconds,
        ticket: qrcodeData.ticket
      });

      return res.status(200).json({
        success: true,
        message: '二维码生成成功',
        data: {
          qrcodeUrl: qrcodeData.url,
          ticket: qrcodeData.ticket,
          expireSeconds: qrcodeData.expireSeconds,
          createdAt: new Date()
        }
      });
    } catch (error) {
      logger.error(`卖家生成二维码失败: ${error.message}`);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || '生成二维码失败',
        error: error.code || 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * 上传素材
   * 卖家可以上传图片、视频等素材，但有大小和类型限制
   */
  async uploadMedia(req, res) {
    try {
      const sellerId = req.user.id;
      const { type, media } = req.body;

      // 参数验证
      if (!type || !media) {
        throw new ValidationError('缺少必要参数');
      }

      // 验证上传媒体权限
      await SellerWechatService.verifyPermission(sellerId, 'wechat:media:upload');

      // 验证媒体类型
      const allowedTypes = ['image', 'voice', 'video', 'file'];
      if (!allowedTypes.includes(type)) {
        throw new ValidationError('不支持的媒体类型');
      }

      // 获取文件信息（这里简化处理，实际应该从文件流中获取）
      const fileSize = media.length || 0;
      
      // 大小限制
      const sizeLimits = {
        image: 10 * 1024 * 1024, // 10MB
        voice: 2 * 1024 * 1024,  // 2MB
        video: 20 * 1024 * 1024, // 20MB
        file: 10 * 1024 * 1024   // 10MB
      };

      if (fileSize > sizeLimits[type]) {
        throw new ValidationError(`文件大小超过限制，${type}类型文件最大为${sizeLimits[type] / 1024 / 1024}MB`);
      }

      // 上传媒体
      const uploadResult = await wechatService.uploadMedia({
        type,
        media,
        from: 'seller',
        fromId: sellerId
      });
      
      // 记录微信操作日志
      await SellerWechatService.logWechatOperation(sellerId, 'UPLOAD_MEDIA', {
        type,
        fileSize,
        mediaId: uploadResult.mediaId
      });

      return res.status(200).json({
        success: true,
        message: '媒体上传成功',
        data: {
          mediaId: uploadResult.mediaId,
          url: uploadResult.url,
          type: uploadResult.type,
          createdAt: new Date(),
          expiresAt: uploadResult.expiresAt
        }
      });
    } catch (error) {
      logger.error(`卖家上传媒体失败: ${error.message}`);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || '上传媒体失败',
        error: error.code || 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * 查看分析数据
   * 卖家可以查看消息发送和用户互动的统计数据
   */
  async getAnalyticsSummary(req, res) {
    try {
      const sellerId = req.user.id;
      const { startDate, endDate, type = 'message' } = req.query;

      // 参数验证
      if (!startDate || !endDate) {
        throw new ValidationError('请指定查询日期范围');
      }

      // 验证查看分析数据权限
      await SellerWechatService.verifyPermission(sellerId, 'wechat:analytics:view');

      // 验证日期格式
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new ValidationError('日期格式无效');
      }

      // 限制查询范围（最长90天）
      const daysDiff = Math.floor((end - start) / (1000 * 60 * 60 * 24));
      if (daysDiff > 90) {
        throw new ValidationError('查询时间范围不能超过90天');
      }

      // 获取分析数据
      const analyticsData = await wechatService.getSellerAnalytics({
        sellerId,
        startDate: start,
        endDate: end,
        type
      });
      
      // 记录微信操作日志
      await SellerWechatService.logWechatOperation(sellerId, 'VIEW_ANALYTICS', {
        startDate: startDate,
        endDate: endDate,
        type
      });

      return res.status(200).json({
        success: true,
        message: '获取分析数据成功',
        data: analyticsData
      });
    } catch (error) {
      logger.error(`卖家获取分析数据失败: ${error.message}`);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || '获取分析数据失败',
        error: error.code || 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * 计算菜单项目数量（辅助方法）
   * @private
   */
  _countMenuItems(menuConfig) {
    let count = 0;
    
    if (Array.isArray(menuConfig)) {
      menuConfig.forEach(item => {
        count++;
        if (item.sub_button && Array.isArray(item.sub_button)) {
          count += item.sub_button.length;
        }
      });
    }
    
    return count;
  }
}

module.exports = new WechatPlatformController();