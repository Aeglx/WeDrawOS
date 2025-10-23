/**
 * 广告管理仓库
 * 实现广告位配置、素材上传、投放管理等数据访问逻辑
 */

const logger = require('../../../core/logger');
const db = require('../../../core/database');

/**
 * 广告管理仓库类
 */
class AdRepository {
  // 广告位相关数据访问方法
  async createAdSlot(adSlotData) {
    try {
      const query = `
        INSERT INTO ad_slots (
          name, description, width, height, position,
          status, extra_config, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const [result] = await db.execute(query, [
        adSlotData.name,
        adSlotData.description || '',
        adSlotData.width,
        adSlotData.height,
        adSlotData.position || '',
        adSlotData.status,
        JSON.stringify(adSlotData.extraConfig || {}),
        adSlotData.createdAt,
        adSlotData.updatedAt
      ]);
      
      return await this.getAdSlotById(result.insertId);
    } catch (error) {
      logger.error('创建广告位数据库操作失败:', error);
      throw error;
    }
  }

  async getAdSlots(where, offset, limit) {
    try {
      let query = 'SELECT * FROM ad_slots';
      const params = [];
      
      if (Object.keys(where).length > 0) {
        query += ' WHERE ';
        const conditions = [];
        
        for (const [key, value] of Object.entries(where)) {
          conditions.push(`${key} = ?`);
          params.push(value);
        }
        
        query += conditions.join(' AND ');
      }
      
      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);
      
      const [rows] = await db.execute(query, params);
      
      // 解析JSON字段
      return rows.map(row => ({
        ...row,
        extraConfig: JSON.parse(row.extra_config),
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } catch (error) {
      logger.error('获取广告位列表数据库操作失败:', error);
      throw error;
    }
  }

  async getAdSlotById(id) {
    try {
      const query = 'SELECT * FROM ad_slots WHERE id = ?';
      const [rows] = await db.execute(query, [id]);
      
      if (rows.length === 0) return null;
      
      const row = rows[0];
      return {
        ...row,
        extraConfig: JSON.parse(row.extra_config),
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } catch (error) {
      logger.error('获取广告位详情数据库操作失败:', error);
      throw error;
    }
  }

  async getAdSlotByName(name) {
    try {
      const query = 'SELECT * FROM ad_slots WHERE name = ?';
      const [rows] = await db.execute(query, [name]);
      
      if (rows.length === 0) return null;
      
      const row = rows[0];
      return {
        ...row,
        extraConfig: JSON.parse(row.extra_config),
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } catch (error) {
      logger.error('根据名称获取广告位数据库操作失败:', error);
      throw error;
    }
  }

  async countAdSlots(where) {
    try {
      let query = 'SELECT COUNT(*) as count FROM ad_slots';
      const params = [];
      
      if (Object.keys(where).length > 0) {
        query += ' WHERE ';
        const conditions = [];
        
        for (const [key, value] of Object.entries(where)) {
          conditions.push(`${key} = ?`);
          params.push(value);
        }
        
        query += conditions.join(' AND ');
      }
      
      const [rows] = await db.execute(query, params);
      return rows[0].count;
    } catch (error) {
      logger.error('统计广告位数量数据库操作失败:', error);
      throw error;
    }
  }

  async updateAdSlot(id, updateData) {
    try {
      const fields = [];
      const params = [];
      
      for (const [key, value] of Object.entries(updateData)) {
        if (key === 'extraConfig') {
          fields.push('extra_config = ?');
          params.push(JSON.stringify(value));
        } else if (key === 'createdAt' || key === 'updatedAt') {
          fields.push(`${key === 'createdAt' ? 'created_at' : 'updated_at'} = ?`);
          params.push(value);
        } else {
          fields.push(`${key} = ?`);
          params.push(value);
        }
      }
      
      params.push(id);
      
      const query = `UPDATE ad_slots SET ${fields.join(', ')} WHERE id = ?`;
      await db.execute(query, params);
      
      return await this.getAdSlotById(id);
    } catch (error) {
      logger.error('更新广告位数据库操作失败:', error);
      throw error;
    }
  }

  async deleteAdSlot(id) {
    try {
      const query = 'DELETE FROM ad_slots WHERE id = ?';
      await db.execute(query, [id]);
      return true;
    } catch (error) {
      logger.error('删除广告位数据库操作失败:', error);
      throw error;
    }
  }

  // 广告素材相关数据访问方法
  async createAdMaterial(materialData) {
    try {
      const query = `
        INSERT INTO ad_materials (
          name, type, file_url, file_name, file_size, file_type,
          link_url, description, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const [result] = await db.execute(query, [
        materialData.name,
        materialData.type,
        materialData.fileUrl,
        materialData.fileName || '',
        materialData.fileSize || 0,
        materialData.fileType || '',
        materialData.linkUrl || '',
        materialData.description || '',
        materialData.status,
        materialData.createdAt,
        materialData.updatedAt
      ]);
      
      return await this.getAdMaterialById(result.insertId);
    } catch (error) {
      logger.error('创建广告素材数据库操作失败:', error);
      throw error;
    }
  }

  async getAdMaterials(where, offset, limit) {
    try {
      let query = 'SELECT * FROM ad_materials';
      const params = [];
      
      if (Object.keys(where).length > 0) {
        query += ' WHERE ';
        const conditions = [];
        
        for (const [key, value] of Object.entries(where)) {
          conditions.push(`${key} = ?`);
          params.push(value);
        }
        
        query += conditions.join(' AND ');
      }
      
      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);
      
      const [rows] = await db.execute(query, params);
      
      return rows.map(row => ({
        ...row,
        fileUrl: row.file_url,
        fileName: row.file_name,
        fileSize: row.file_size,
        fileType: row.file_type,
        linkUrl: row.link_url,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } catch (error) {
      logger.error('获取广告素材列表数据库操作失败:', error);
      throw error;
    }
  }

  async getAdMaterialById(id) {
    try {
      const query = 'SELECT * FROM ad_materials WHERE id = ?';
      const [rows] = await db.execute(query, [id]);
      
      if (rows.length === 0) return null;
      
      const row = rows[0];
      return {
        ...row,
        fileUrl: row.file_url,
        fileName: row.file_name,
        fileSize: row.file_size,
        fileType: row.file_type,
        linkUrl: row.link_url,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } catch (error) {
      logger.error('获取广告素材详情数据库操作失败:', error);
      throw error;
    }
  }

  async countAdMaterials(where) {
    try {
      let query = 'SELECT COUNT(*) as count FROM ad_materials';
      const params = [];
      
      if (Object.keys(where).length > 0) {
        query += ' WHERE ';
        const conditions = [];
        
        for (const [key, value] of Object.entries(where)) {
          conditions.push(`${key} = ?`);
          params.push(value);
        }
        
        query += conditions.join(' AND ');
      }
      
      const [rows] = await db.execute(query, params);
      return rows[0].count;
    } catch (error) {
      logger.error('统计广告素材数量数据库操作失败:', error);
      throw error;
    }
  }

  async updateAdMaterial(id, updateData) {
    try {
      const fields = [];
      const params = [];
      
      for (const [key, value] of Object.entries(updateData)) {
        if (key === 'fileUrl') fields.push('file_url = ?');
        else if (key === 'fileName') fields.push('file_name = ?');
        else if (key === 'fileSize') fields.push('file_size = ?');
        else if (key === 'fileType') fields.push('file_type = ?');
        else if (key === 'linkUrl') fields.push('link_url = ?');
        else if (key === 'createdAt') fields.push('created_at = ?');
        else if (key === 'updatedAt') fields.push('updated_at = ?');
        else fields.push(`${key} = ?`);
        
        params.push(value);
      }
      
      params.push(id);
      
      const query = `UPDATE ad_materials SET ${fields.join(', ')} WHERE id = ?`;
      await db.execute(query, params);
      
      return await this.getAdMaterialById(id);
    } catch (error) {
      logger.error('更新广告素材数据库操作失败:', error);
      throw error;
    }
  }

  async deleteAdMaterial(id) {
    try {
      const query = 'DELETE FROM ad_materials WHERE id = ?';
      await db.execute(query, [id]);
      return true;
    } catch (error) {
      logger.error('删除广告素材数据库操作失败:', error);
      throw error;
    }
  }

  // 广告投放相关数据访问方法
  async createAdCampaign(campaignData) {
    try {
      const query = `
        INSERT INTO ad_campaigns (
          name, description, ad_slot_id, material_id, start_time, end_time,
          status, display_order, click_url, impression_url, daily_budget,
          total_budget, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const [result] = await db.execute(query, [
        campaignData.name,
        campaignData.description || '',
        campaignData.adSlotId,
        campaignData.materialId,
        campaignData.startTime || null,
        campaignData.endTime || null,
        campaignData.status,
        campaignData.displayOrder || 0,
        campaignData.clickUrl || '',
        campaignData.impressionUrl || '',
        campaignData.dailyBudget || 0,
        campaignData.totalBudget || 0,
        campaignData.createdAt,
        campaignData.updatedAt
      ]);
      
      return await this.getAdCampaignById(result.insertId);
    } catch (error) {
      logger.error('创建广告投放数据库操作失败:', error);
      throw error;
    }
  }

  async getAdCampaigns(where, offset, limit) {
    try {
      let query = 'SELECT * FROM ad_campaigns';
      const params = [];
      
      if (Object.keys(where).length > 0) {
        query += ' WHERE ';
        const conditions = [];
        
        for (const [key, value] of Object.entries(where)) {
          if (key === 'adSlotId') conditions.push('ad_slot_id = ?');
          else conditions.push(`${key} = ?`);
          params.push(value);
        }
        
        query += conditions.join(' AND ');
      }
      
      query += ' ORDER BY display_order ASC, created_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);
      
      const [rows] = await db.execute(query, params);
      
      return rows.map(row => ({
        ...row,
        adSlotId: row.ad_slot_id,
        materialId: row.material_id,
        startTime: row.start_time,
        endTime: row.end_time,
        displayOrder: row.display_order,
        clickUrl: row.click_url,
        impressionUrl: row.impression_url,
        dailyBudget: row.daily_budget,
        totalBudget: row.total_budget,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } catch (error) {
      logger.error('获取广告投放列表数据库操作失败:', error);
      throw error;
    }
  }

  async getAdCampaignById(id) {
    try {
      const query = 'SELECT * FROM ad_campaigns WHERE id = ?';
      const [rows] = await db.execute(query, [id]);
      
      if (rows.length === 0) return null;
      
      const row = rows[0];
      return {
        ...row,
        adSlotId: row.ad_slot_id,
        materialId: row.material_id,
        startTime: row.start_time,
        endTime: row.end_time,
        displayOrder: row.display_order,
        clickUrl: row.click_url,
        impressionUrl: row.impression_url,
        dailyBudget: row.daily_budget,
        totalBudget: row.total_budget,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } catch (error) {
      logger.error('获取广告投放详情数据库操作失败:', error);
      throw error;
    }
  }

  async countAdCampaigns(where) {
    try {
      let query = 'SELECT COUNT(*) as count FROM ad_campaigns';
      const params = [];
      
      if (Object.keys(where).length > 0) {
        query += ' WHERE ';
        const conditions = [];
        
        for (const [key, value] of Object.entries(where)) {
          if (key === 'adSlotId') conditions.push('ad_slot_id = ?');
          else conditions.push(`${key} = ?`);
          params.push(value);
        }
        
        query += conditions.join(' AND ');
      }
      
      const [rows] = await db.execute(query, params);
      return rows[0].count;
    } catch (error) {
      logger.error('统计广告投放数量数据库操作失败:', error);
      throw error;
    }
  }

  async updateAdCampaign(id, updateData) {
    try {
      const fields = [];
      const params = [];
      
      for (const [key, value] of Object.entries(updateData)) {
        if (key === 'adSlotId') fields.push('ad_slot_id = ?');
        else if (key === 'materialId') fields.push('material_id = ?');
        else if (key === 'startTime') fields.push('start_time = ?');
        else if (key === 'endTime') fields.push('end_time = ?');
        else if (key === 'displayOrder') fields.push('display_order = ?');
        else if (key === 'clickUrl') fields.push('click_url = ?');
        else if (key === 'impressionUrl') fields.push('impression_url = ?');
        else if (key === 'dailyBudget') fields.push('daily_budget = ?');
        else if (key === 'totalBudget') fields.push('total_budget = ?');
        else if (key === 'createdAt') fields.push('created_at = ?');
        else if (key === 'updatedAt') fields.push('updated_at = ?');
        else fields.push(`${key} = ?`);
        
        params.push(value);
      }
      
      params.push(id);
      
      const query = `UPDATE ad_campaigns SET ${fields.join(', ')} WHERE id = ?`;
      await db.execute(query, params);
      
      return await this.getAdCampaignById(id);
    } catch (error) {
      logger.error('更新广告投放数据库操作失败:', error);
      throw error;
    }
  }

  async deleteAdCampaign(id) {
    try {
      const query = 'DELETE FROM ad_campaigns WHERE id = ?';
      await db.execute(query, [id]);
      return true;
    } catch (error) {
      logger.error('删除广告投放数据库操作失败:', error);
      throw error;
    }
  }

  // 关联查询方法
  async getActiveCampaignsByAdSlotId(adSlotId) {
    try {
      const query = `
        SELECT * FROM ad_campaigns 
        WHERE ad_slot_id = ? AND status = 'active' 
        LIMIT 1
      `;
      const [rows] = await db.execute(query, [adSlotId]);
      
      return rows.map(row => ({
        ...row,
        adSlotId: row.ad_slot_id,
        materialId: row.material_id,
        startTime: row.start_time,
        endTime: row.end_time,
        displayOrder: row.display_order,
        clickUrl: row.click_url,
        impressionUrl: row.impression_url,
        dailyBudget: row.daily_budget,
        totalBudget: row.total_budget,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } catch (error) {
      logger.error('获取广告位下活跃投放数据库操作失败:', error);
      throw error;
    }
  }

  async getActiveCampaignsByMaterialId(materialId) {
    try {
      const query = `
        SELECT * FROM ad_campaigns 
        WHERE material_id = ? AND status = 'active' 
        LIMIT 1
      `;
      const [rows] = await db.execute(query, [materialId]);
      
      return rows.map(row => ({
        ...row,
        adSlotId: row.ad_slot_id,
        materialId: row.material_id,
        startTime: row.start_time,
        endTime: row.end_time,
        displayOrder: row.display_order,
        clickUrl: row.click_url,
        impressionUrl: row.impression_url,
        dailyBudget: row.daily_budget,
        totalBudget: row.total_budget,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } catch (error) {
      logger.error('获取素材相关活跃投放数据库操作失败:', error);
      throw error;
    }
  }

  // 广告统计方法
  async getAdStatistics({ campaignId, adSlotId, startDate, endDate }) {
    try {
      let query = `
        SELECT 
          c.id as campaignId, 
          c.name as campaignName,
          s.id as slotId,
          s.name as slotName,
          COUNT(DISTINCT i.id) as impressions,
          COUNT(DISTINCT cl.id) as clicks,
          COUNT(DISTINCT i.id) > 0 ? COUNT(DISTINCT cl.id) / COUNT(DISTINCT i.id) : 0 as ctr
        FROM ad_campaigns c
        LEFT JOIN ad_slots s ON c.ad_slot_id = s.id
        LEFT JOIN ad_impressions i ON i.campaign_id = c.id
        LEFT JOIN ad_clicks cl ON cl.campaign_id = c.id
        WHERE 1=1
      `;
      
      const params = [];
      
      if (campaignId) {
        query += ' AND c.id = ?';
        params.push(campaignId);
      }
      
      if (adSlotId) {
        query += ' AND c.ad_slot_id = ?';
        params.push(adSlotId);
      }
      
      if (startDate) {
        query += ' AND i.created_at >= ?';
        params.push(startDate);
      }
      
      if (endDate) {
        query += ' AND i.created_at <= ?';
        params.push(endDate);
      }
      
      query += ' GROUP BY c.id, s.id';
      
      const [rows] = await db.execute(query, params);
      
      return rows.map(row => ({
        campaignId: row.campaignId,
        campaignName: row.campaignName,
        slotId: row.slotId,
        slotName: row.slotName,
        impressions: row.impressions,
        clicks: row.clicks,
        ctr: row.ctr
      }));
    } catch (error) {
      logger.error('获取广告统计数据库操作失败:', error);
      throw error;
    }
  }
}

module.exports = new AdRepository();