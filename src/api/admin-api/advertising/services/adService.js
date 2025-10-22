/**
 * 广告管理服务
 * 实现广告位配置、素材上传、投放管理等业务逻辑
 */

const logger = require('../../../core/logger');
const adRepository = require('../repositories/adRepository');
const { ValidationError, NotFoundError, BusinessError } = require('../../../core/errors');

/**
 * 广告管理服务类
 */
class AdService {
  // 广告位管理相关方法
  async createAdSlot(adSlotData) {
    logger.info('创建广告位:', adSlotData.name);
    
    // 验证必填字段
    if (!adSlotData.name || !adSlotData.width || !adSlotData.height) {
      throw new ValidationError('广告位名称、宽度和高度为必填项');
    }
    
    // 验证广告位是否已存在
    const existingSlot = await adRepository.getAdSlotByName(adSlotData.name);
    if (existingSlot) {
      throw new BusinessError('同名广告位已存在');
    }
    
    // 设置默认值
    const slotToCreate = {
      ...adSlotData,
      status: adSlotData.status || 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    return await adRepository.createAdSlot(slotToCreate);
  }

  async getAdSlots({ page, pageSize, status }) {
    logger.info('获取广告位列表', { page, pageSize, status });
    
    const offset = (page - 1) * pageSize;
    const where = {};
    
    if (status) {
      where.status = status;
    }
    
    const [slots, total] = await Promise.all([
      adRepository.getAdSlots(where, offset, pageSize),
      adRepository.countAdSlots(where)
    ]);
    
    return {
      list: slots,
      pagination: {
        current: page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  }

  async getAdSlotById(id) {
    logger.info('获取广告位详情:', id);
    const slot = await adRepository.getAdSlotById(id);
    return slot;
  }

  async updateAdSlot(id, updateData) {
    logger.info('更新广告位:', id);
    
    // 验证广告位是否存在
    const existingSlot = await adRepository.getAdSlotById(id);
    if (!existingSlot) {
      throw new NotFoundError('广告位不存在');
    }
    
    // 如果更新名称，检查是否与其他广告位重名
    if (updateData.name && updateData.name !== existingSlot.name) {
      const nameExists = await adRepository.getAdSlotByName(updateData.name);
      if (nameExists && nameExists.id !== id) {
        throw new BusinessError('同名广告位已存在');
      }
    }
    
    const updateFields = {
      ...updateData,
      updatedAt: new Date()
    };
    
    return await adRepository.updateAdSlot(id, updateFields);
  }

  async deleteAdSlot(id) {
    logger.info('删除广告位:', id);
    
    // 验证广告位是否存在
    const existingSlot = await adRepository.getAdSlotById(id);
    if (!existingSlot) {
      throw new NotFoundError('广告位不存在');
    }
    
    // 检查是否有正在使用该广告位的投放
    const activeCampaigns = await adRepository.getActiveCampaignsByAdSlotId(id);
    if (activeCampaigns.length > 0) {
      throw new BusinessError('该广告位下存在活跃的广告投放，无法删除');
    }
    
    return await adRepository.deleteAdSlot(id);
  }

  // 广告素材管理相关方法
  async createAdMaterial(materialData) {
    logger.info('创建广告素材');
    
    // 验证必填字段
    if (!materialData.name || !materialData.type || !materialData.fileUrl) {
      throw new ValidationError('素材名称、类型和文件为必填项');
    }
    
    const materialToCreate = {
      ...materialData,
      status: materialData.status || 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    return await adRepository.createAdMaterial(materialToCreate);
  }

  async getAdMaterials({ page, pageSize, type, status }) {
    logger.info('获取广告素材列表', { page, pageSize, type, status });
    
    const offset = (page - 1) * pageSize;
    const where = {};
    
    if (type) {
      where.type = type;
    }
    
    if (status) {
      where.status = status;
    }
    
    const [materials, total] = await Promise.all([
      adRepository.getAdMaterials(where, offset, pageSize),
      adRepository.countAdMaterials(where)
    ]);
    
    return {
      list: materials,
      pagination: {
        current: page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  }

  async getAdMaterialById(id) {
    logger.info('获取广告素材详情:', id);
    const material = await adRepository.getAdMaterialById(id);
    return material;
  }

  async updateAdMaterial(id, updateData) {
    logger.info('更新广告素材:', id);
    
    // 验证素材是否存在
    const existingMaterial = await adRepository.getAdMaterialById(id);
    if (!existingMaterial) {
      throw new NotFoundError('广告素材不存在');
    }
    
    const updateFields = {
      ...updateData,
      updatedAt: new Date()
    };
    
    return await adRepository.updateAdMaterial(id, updateFields);
  }

  async deleteAdMaterial(id) {
    logger.info('删除广告素材:', id);
    
    // 验证素材是否存在
    const existingMaterial = await adRepository.getAdMaterialById(id);
    if (!existingMaterial) {
      throw new NotFoundError('广告素材不存在');
    }
    
    // 检查是否有正在使用该素材的投放
    const activeCampaigns = await adRepository.getActiveCampaignsByMaterialId(id);
    if (activeCampaigns.length > 0) {
      throw new BusinessError('该素材被活跃的广告投放使用中，无法删除');
    }
    
    return await adRepository.deleteAdMaterial(id);
  }

  // 广告投放管理相关方法
  async createAdCampaign(campaignData) {
    logger.info('创建广告投放:', campaignData.name);
    
    // 验证必填字段
    if (!campaignData.name || !campaignData.adSlotId || !campaignData.materialId) {
      throw new ValidationError('广告投放名称、广告位ID和素材ID为必填项');
    }
    
    // 验证广告位是否存在
    const adSlot = await adRepository.getAdSlotById(campaignData.adSlotId);
    if (!adSlot) {
      throw new NotFoundError('广告位不存在');
    }
    
    // 验证素材是否存在
    const material = await adRepository.getAdMaterialById(campaignData.materialId);
    if (!material) {
      throw new NotFoundError('广告素材不存在');
    }
    
    // 设置默认值
    const campaignToCreate = {
      ...campaignData,
      status: campaignData.status || 'pending',
      displayOrder: campaignData.displayOrder || 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    return await adRepository.createAdCampaign(campaignToCreate);
  }

  async getAdCampaigns({ page, pageSize, status, adSlotId }) {
    logger.info('获取广告投放列表', { page, pageSize, status, adSlotId });
    
    const offset = (page - 1) * pageSize;
    const where = {};
    
    if (status) {
      where.status = status;
    }
    
    if (adSlotId) {
      where.adSlotId = adSlotId;
    }
    
    const [campaigns, total] = await Promise.all([
      adRepository.getAdCampaigns(where, offset, pageSize),
      adRepository.countAdCampaigns(where)
    ]);
    
    // 获取关联信息
    for (const campaign of campaigns) {
      const [adSlot, material] = await Promise.all([
        adRepository.getAdSlotById(campaign.adSlotId),
        adRepository.getAdMaterialById(campaign.materialId)
      ]);
      
      campaign.adSlot = adSlot;
      campaign.material = material;
    }
    
    return {
      list: campaigns,
      pagination: {
        current: page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  }

  async getAdCampaignById(id) {
    logger.info('获取广告投放详情:', id);
    const campaign = await adRepository.getAdCampaignById(id);
    
    if (campaign) {
      // 获取关联信息
      const [adSlot, material] = await Promise.all([
        adRepository.getAdSlotById(campaign.adSlotId),
        adRepository.getAdMaterialById(campaign.materialId)
      ]);
      
      campaign.adSlot = adSlot;
      campaign.material = material;
    }
    
    return campaign;
  }

  async updateAdCampaign(id, updateData) {
    logger.info('更新广告投放:', id);
    
    // 验证广告投放是否存在
    const existingCampaign = await adRepository.getAdCampaignById(id);
    if (!existingCampaign) {
      throw new NotFoundError('广告投放不存在');
    }
    
    // 如果更新广告位，验证广告位是否存在
    if (updateData.adSlotId && updateData.adSlotId !== existingCampaign.adSlotId) {
      const adSlot = await adRepository.getAdSlotById(updateData.adSlotId);
      if (!adSlot) {
        throw new NotFoundError('广告位不存在');
      }
    }
    
    // 如果更新素材，验证素材是否存在
    if (updateData.materialId && updateData.materialId !== existingCampaign.materialId) {
      const material = await adRepository.getAdMaterialById(updateData.materialId);
      if (!material) {
        throw new NotFoundError('广告素材不存在');
      }
    }
    
    const updateFields = {
      ...updateData,
      updatedAt: new Date()
    };
    
    return await adRepository.updateAdCampaign(id, updateFields);
  }

  async updateAdCampaignStatus(id, status) {
    logger.info('更新广告投放状态:', { id, status });
    
    // 验证广告投放是否存在
    const existingCampaign = await adRepository.getAdCampaignById(id);
    if (!existingCampaign) {
      throw new NotFoundError('广告投放不存在');
    }
    
    // 验证状态值是否有效
    const validStatuses = ['pending', 'active', 'paused', 'ended'];
    if (!validStatuses.includes(status)) {
      throw new ValidationError(`无效的状态值，有效值为：${validStatuses.join(', ')}`);
    }
    
    return await adRepository.updateAdCampaign(id, { status, updatedAt: new Date() });
  }

  async deleteAdCampaign(id) {
    logger.info('删除广告投放:', id);
    
    // 验证广告投放是否存在
    const existingCampaign = await adRepository.getAdCampaignById(id);
    if (!existingCampaign) {
      throw new NotFoundError('广告投放不存在');
    }
    
    return await adRepository.deleteAdCampaign(id);
  }

  // 广告统计相关方法
  async getAdStatistics({ campaignId, adSlotId, startDate, endDate }) {
    logger.info('获取广告统计数据', { campaignId, adSlotId, startDate, endDate });
    
    // 验证日期格式
    if (startDate || endDate) {
      const startDateObj = startDate ? new Date(startDate) : null;
      const endDateObj = endDate ? new Date(endDate) : null;
      
      if (startDate && isNaN(startDateObj.getTime())) {
        throw new ValidationError('开始日期格式无效');
      }
      
      if (endDate && isNaN(endDateObj.getTime())) {
        throw new ValidationError('结束日期格式无效');
      }
      
      if (startDateObj && endDateObj && startDateObj > endDateObj) {
        throw new ValidationError('开始日期不能晚于结束日期');
      }
    }
    
    return await adRepository.getAdStatistics({ campaignId, adSlotId, startDate, endDate });
  }
}

module.exports = new AdService();