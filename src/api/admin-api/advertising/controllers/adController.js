/**
 * 广告管理控制器
 * 处理广告位配置、素材上传、投放管理等广告相关的API请求
 */

const logger = require('../../../core/logger');
const adService = require('../services/adService');

/**
 * 广告管理控制器类
 */
class AdController {
  // 广告位管理相关方法
  async createAdSlot(req, res, next) {
    try {
      const adSlotData = req.body;
      const result = await adService.createAdSlot(adSlotData);
      res.status(201).json({
        success: true,
        message: '广告位创建成功',
        data: result
      });
    } catch (error) {
      logger.error('创建广告位失败:', error);
      next(error);
    }
  }

  async getAdSlots(req, res, next) {
    try {
      const { page = 1, pageSize = 10, status } = req.query;
      const result = await adService.getAdSlots({
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        status
      });
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('获取广告位列表失败:', error);
      next(error);
    }
  }

  async getAdSlotDetail(req, res, next) {
    try {
      const { id } = req.params;
      const adSlot = await adService.getAdSlotById(id);
      if (!adSlot) {
        return res.status(404).json({
          success: false,
          message: '广告位不存在'
        });
      }
      res.json({
        success: true,
        data: adSlot
      });
    } catch (error) {
      logger.error('获取广告位详情失败:', error);
      next(error);
    }
  }

  async updateAdSlot(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const result = await adService.updateAdSlot(id, updateData);
      res.json({
        success: true,
        message: '广告位更新成功',
        data: result
      });
    } catch (error) {
      logger.error('更新广告位失败:', error);
      next(error);
    }
  }

  async deleteAdSlot(req, res, next) {
    try {
      const { id } = req.params;
      await adService.deleteAdSlot(id);
      res.json({
        success: true,
        message: '广告位删除成功'
      });
    } catch (error) {
      logger.error('删除广告位失败:', error);
      next(error);
    }
  }

  // 广告素材管理相关方法
  async uploadAdMaterial(req, res, next) {
    try {
      // 文件上传逻辑在中间件中处理，这里获取上传结果
      const materialData = {
        ...req.body,
        fileUrl: req.file ? req.file.path : null,
        fileName: req.file ? req.file.filename : null,
        fileSize: req.file ? req.file.size : null,
        fileType: req.file ? req.file.mimetype : null
      };
      
      const result = await adService.createAdMaterial(materialData);
      res.status(201).json({
        success: true,
        message: '素材上传成功',
        data: result
      });
    } catch (error) {
      logger.error('上传广告素材失败:', error);
      next(error);
    }
  }

  async getAdMaterials(req, res, next) {
    try {
      const { page = 1, pageSize = 10, type, status } = req.query;
      const result = await adService.getAdMaterials({
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        type,
        status
      });
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('获取广告素材列表失败:', error);
      next(error);
    }
  }

  async getAdMaterialDetail(req, res, next) {
    try {
      const { id } = req.params;
      const material = await adService.getAdMaterialById(id);
      if (!material) {
        return res.status(404).json({
          success: false,
          message: '广告素材不存在'
        });
      }
      res.json({
        success: true,
        data: material
      });
    } catch (error) {
      logger.error('获取广告素材详情失败:', error);
      next(error);
    }
  }

  async updateAdMaterial(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = {
        ...req.body,
        fileUrl: req.file ? req.file.path : null,
        fileName: req.file ? req.file.filename : null,
        fileSize: req.file ? req.file.size : null,
        fileType: req.file ? req.file.mimetype : null
      };
      
      const result = await adService.updateAdMaterial(id, updateData);
      res.json({
        success: true,
        message: '广告素材更新成功',
        data: result
      });
    } catch (error) {
      logger.error('更新广告素材失败:', error);
      next(error);
    }
  }

  async deleteAdMaterial(req, res, next) {
    try {
      const { id } = req.params;
      await adService.deleteAdMaterial(id);
      res.json({
        success: true,
        message: '广告素材删除成功'
      });
    } catch (error) {
      logger.error('删除广告素材失败:', error);
      next(error);
    }
  }

  // 广告投放管理相关方法
  async createAdCampaign(req, res, next) {
    try {
      const campaignData = req.body;
      const result = await adService.createAdCampaign(campaignData);
      res.status(201).json({
        success: true,
        message: '广告投放创建成功',
        data: result
      });
    } catch (error) {
      logger.error('创建广告投放失败:', error);
      next(error);
    }
  }

  async getAdCampaigns(req, res, next) {
    try {
      const { page = 1, pageSize = 10, status, adSlotId } = req.query;
      const result = await adService.getAdCampaigns({
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        status,
        adSlotId
      });
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('获取广告投放列表失败:', error);
      next(error);
    }
  }

  async getAdCampaignDetail(req, res, next) {
    try {
      const { id } = req.params;
      const campaign = await adService.getAdCampaignById(id);
      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: '广告投放不存在'
        });
      }
      res.json({
        success: true,
        data: campaign
      });
    } catch (error) {
      logger.error('获取广告投放详情失败:', error);
      next(error);
    }
  }

  async updateAdCampaign(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const result = await adService.updateAdCampaign(id, updateData);
      res.json({
        success: true,
        message: '广告投放更新成功',
        data: result
      });
    } catch (error) {
      logger.error('更新广告投放失败:', error);
      next(error);
    }
  }

  async updateAdCampaignStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const result = await adService.updateAdCampaignStatus(id, status);
      res.json({
        success: true,
        message: '广告投放状态更新成功',
        data: result
      });
    } catch (error) {
      logger.error('更新广告投放状态失败:', error);
      next(error);
    }
  }

  async deleteAdCampaign(req, res, next) {
    try {
      const { id } = req.params;
      await adService.deleteAdCampaign(id);
      res.json({
        success: true,
        message: '广告投放删除成功'
      });
    } catch (error) {
      logger.error('删除广告投放失败:', error);
      next(error);
    }
  }

  // 广告统计相关方法
  async getAdStatistics(req, res, next) {
    try {
      const { campaignId, adSlotId, startDate, endDate } = req.query;
      const result = await adService.getAdStatistics({
        campaignId,
        adSlotId,
        startDate,
        endDate
      });
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('获取广告统计失败:', error);
      next(error);
    }
  }
}

module.exports = new AdController();