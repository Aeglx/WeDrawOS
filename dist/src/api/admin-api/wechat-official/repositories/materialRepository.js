/**
 * 公众号素材管理仓库
 * 处理公众号素材数据的持久化存储和访问
 */

const logger = require('../../../core/logger');
const db = require('../../../core/database');

/**
 * 公众号素材管理仓库类
 */
class MaterialRepository {
  /**
   * 保存素材信息
   * @param {Object} materialInfo - 素材信息
   * @returns {Promise<Object>} - 返回保存后的素材信息
   */
  async saveMaterial(materialInfo) {
    try {
      logger.info(`保存素材信息，mediaId: ${materialInfo.mediaId}`);
      
      // 检查是否已存在相同的素材
      const existingMaterial = await this.getMaterialByMediaId(materialInfo.mediaId);
      
      if (existingMaterial) {
        // 更新已存在的素材
        return await this.updateMaterial(materialInfo.mediaId, materialInfo);
      }
      
      // 插入新素材
      const result = await db('wechat_materials').insert({
        media_id: materialInfo.mediaId,
        type: materialInfo.type,
        name: materialInfo.name,
        size: materialInfo.size,
        url: materialInfo.url,
        title: materialInfo.title,
        description: materialInfo.description,
        introduction: materialInfo.introduction,
        articles: materialInfo.articles ? JSON.stringify(materialInfo.articles) : null,
        is_permanent: materialInfo.isPermanent,
        expires_in: materialInfo.expiresIn,
        create_time: materialInfo.createTime || new Date(),
        update_time: new Date()
      }).returning('*');
      
      logger.info(`素材信息保存成功，mediaId: ${materialInfo.mediaId}`);
      return result[0];
    } catch (error) {
      logger.error('保存素材信息失败:', error);
      throw error;
    }
  }

  /**
   * 更新素材信息
   * @param {string} mediaId - 素材ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<Object>} - 返回更新后的素材信息
   */
  async updateMaterial(mediaId, updateData) {
    try {
      logger.info(`更新素材信息，mediaId: ${mediaId}`);
      
      const updateObj = {
        update_time: new Date()
      };
      
      // 转换需要更新的字段
      if (updateData.type !== undefined) updateObj.type = updateData.type;
      if (updateData.name !== undefined) updateObj.name = updateData.name;
      if (updateData.size !== undefined) updateObj.size = updateData.size;
      if (updateData.url !== undefined) updateObj.url = updateData.url;
      if (updateData.title !== undefined) updateObj.title = updateData.title;
      if (updateData.description !== undefined) updateObj.description = updateData.description;
      if (updateData.introduction !== undefined) updateObj.introduction = updateData.introduction;
      if (updateData.articles !== undefined) updateObj.articles = JSON.stringify(updateData.articles);
      if (updateData.isPermanent !== undefined) updateObj.is_permanent = updateData.isPermanent;
      if (updateData.expiresIn !== undefined) updateObj.expires_in = updateData.expiresIn;
      if (updateData.createTime !== undefined) updateObj.create_time = updateData.createTime;
      
      const result = await db('wechat_materials')
        .where({ media_id: mediaId })
        .update(updateObj)
        .returning('*');
      
      if (result.length === 0) {
        throw new Error(`素材不存在，mediaId: ${mediaId}`);
      }
      
      logger.info(`素材信息更新成功，mediaId: ${mediaId}`);
      return result[0];
    } catch (error) {
      logger.error(`更新素材信息失败，mediaId: ${mediaId}`, error);
      throw error;
    }
  }

  /**
   * 删除素材
   * @param {string} mediaId - 素材ID
   * @returns {Promise<number>} - 返回删除的记录数
   */
  async deleteMaterial(mediaId) {
    try {
      logger.info(`删除素材，mediaId: ${mediaId}`);
      
      const result = await db('wechat_materials')
        .where({ media_id: mediaId })
        .delete();
      
      if (result === 0) {
        throw new Error(`素材不存在，mediaId: ${mediaId}`);
      }
      
      logger.info(`素材删除成功，mediaId: ${mediaId}`);
      return result;
    } catch (error) {
      logger.error(`删除素材失败，mediaId: ${mediaId}`, error);
      throw error;
    }
  }

  /**
   * 根据素材ID获取素材信息
   * @param {string} mediaId - 素材ID
   * @returns {Promise<Object|null>} - 返回素材信息或null
   */
  async getMaterialByMediaId(mediaId) {
    try {
      logger.info(`根据mediaId获取素材信息，mediaId: ${mediaId}`);
      
      const material = await db('wechat_materials')
        .where({ media_id: mediaId })
        .first();
      
      // 解析JSON字段
      if (material && material.articles) {
        material.articles = JSON.parse(material.articles);
      }
      
      return material;
    } catch (error) {
      logger.error(`根据mediaId获取素材信息失败，mediaId: ${mediaId}`, error);
      throw error;
    }
  }

  /**
   * 获取素材列表
   * @param {Object} filter - 过滤条件
   * @param {Object} pagination - 分页参数
   * @returns {Promise<Array>} - 返回素材列表
   */
  async getMaterials(filter = {}, pagination = {}) {
    try {
      logger.info('获取素材列表');
      
      const query = db('wechat_materials');
      
      // 添加过滤条件
      if (filter.type) {
        query.where({ type: filter.type });
      }
      if (filter.isPermanent !== undefined) {
        query.where({ is_permanent: filter.isPermanent });
      }
      if (filter.startDate) {
        query.where('create_time', '>=', filter.startDate);
      }
      if (filter.endDate) {
        query.where('create_time', '<=', filter.endDate);
      }
      if (filter.keyword) {
        query.where('name', 'LIKE', `%${filter.keyword}%`)
          .orWhere('title', 'LIKE', `%${filter.keyword}%`);
      }
      
      // 添加分页参数
      if (pagination.offset !== undefined) {
        query.offset(pagination.offset);
      }
      if (pagination.limit !== undefined) {
        query.limit(pagination.limit);
      }
      
      // 按创建时间降序排序
      query.orderBy('create_time', 'desc');
      
      const materials = await query;
      
      // 解析JSON字段
      materials.forEach(material => {
        if (material.articles) {
          material.articles = JSON.parse(material.articles);
        }
      });
      
      logger.info(`获取素材列表成功，数量: ${materials.length}`);
      return materials;
    } catch (error) {
      logger.error('获取素材列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取素材总数
   * @param {Object} filter - 过滤条件
   * @returns {Promise<number>} - 返回素材总数
   */
  async getMaterialsCount(filter = {}) {
    try {
      logger.info('获取素材总数');
      
      const query = db('wechat_materials');
      
      // 添加过滤条件
      if (filter.type) {
        query.where({ type: filter.type });
      }
      if (filter.isPermanent !== undefined) {
        query.where({ is_permanent: filter.isPermanent });
      }
      if (filter.startDate) {
        query.where('create_time', '>=', filter.startDate);
      }
      if (filter.endDate) {
        query.where('create_time', '<=', filter.endDate);
      }
      if (filter.keyword) {
        query.where('name', 'LIKE', `%${filter.keyword}%`)
          .orWhere('title', 'LIKE', `%${filter.keyword}%`);
      }
      
      const count = await query.count('id as total').first();
      
      logger.info(`获取素材总数成功，总数: ${count.total}`);
      return count.total;
    } catch (error) {
      logger.error('获取素材总数失败:', error);
      throw error;
    }
  }

  /**
   * 批量删除素材
   * @param {Array} mediaIds - 素材ID数组
   * @returns {Promise<number>} - 返回删除的记录数
   */
  async batchDeleteMaterials(mediaIds) {
    try {
      logger.info(`批量删除素材，数量: ${mediaIds.length}`);
      
      const result = await db('wechat_materials')
        .whereIn('media_id', mediaIds)
        .delete();
      
      logger.info(`批量删除素材成功，删除数量: ${result}`);
      return result;
    } catch (error) {
      logger.error('批量删除素材失败:', error);
      throw error;
    }
  }

  /**
   * 清理过期的临时素材
   * @returns {Promise<number>} - 返回删除的记录数
   */
  async cleanupExpiredMaterials() {
    try {
      logger.info('清理过期临时素材');
      
      // 计算过期时间（临时素材默认有效期为3天）
      const expireTime = new Date();
      expireTime.setDate(expireTime.getDate() - 3);
      
      const result = await db('wechat_materials')
        .where({ is_permanent: false })
        .where('create_time', '<=', expireTime)
        .delete();
      
      logger.info(`清理过期临时素材成功，删除数量: ${result}`);
      return result;
    } catch (error) {
      logger.error('清理过期临时素材失败:', error);
      throw error;
    }
  }

  /**
   * 按类型统计素材数量
   * @returns {Promise<Array>} - 返回按类型统计的结果
   */
  async countMaterialsByType() {
    try {
      logger.info('按类型统计素材数量');
      
      const result = await db('wechat_materials')
        .select('type', 'is_permanent')
        .count('id as count')
        .groupBy('type', 'is_permanent');
      
      logger.info('按类型统计素材数量成功');
      return result;
    } catch (error) {
      logger.error('按类型统计素材数量失败:', error);
      throw error;
    }
  }

  /**
   * 搜索素材
   * @param {string} keyword - 搜索关键词
   * @param {Object} pagination - 分页参数
   * @returns {Promise<Array>} - 返回搜索结果
   */
  async searchMaterials(keyword, pagination = {}) {
    try {
      logger.info(`搜索素材，关键词: ${keyword}`);
      
      const query = db('wechat_materials')
        .where('name', 'LIKE', `%${keyword}%`)
        .orWhere('title', 'LIKE', `%${keyword}%`)
        .orWhere('description', 'LIKE', `%${keyword}%`);
      
      // 添加分页参数
      if (pagination.offset !== undefined) {
        query.offset(pagination.offset);
      }
      if (pagination.limit !== undefined) {
        query.limit(pagination.limit);
      }
      
      // 按创建时间降序排序
      query.orderBy('create_time', 'desc');
      
      const materials = await query;
      
      // 解析JSON字段
      materials.forEach(material => {
        if (material.articles) {
          material.articles = JSON.parse(material.articles);
        }
      });
      
      logger.info(`搜索素材成功，关键词: ${keyword}，数量: ${materials.length}`);
      return materials;
    } catch (error) {
      logger.error(`搜索素材失败，关键词: ${keyword}`, error);
      throw error;
    }
  }

  /**
   * 获取最近上传的素材
   * @param {number} limit - 限制数量
   * @returns {Promise<Array>} - 返回素材列表
   */
  async getRecentMaterials(limit = 10) {
    try {
      logger.info(`获取最近上传的素材，数量: ${limit}`);
      
      const materials = await db('wechat_materials')
        .orderBy('create_time', 'desc')
        .limit(limit);
      
      // 解析JSON字段
      materials.forEach(material => {
        if (material.articles) {
          material.articles = JSON.parse(material.articles);
        }
      });
      
      logger.info(`获取最近上传的素材成功，数量: ${materials.length}`);
      return materials;
    } catch (error) {
      logger.error('获取最近上传的素材失败:', error);
      throw error;
    }
  }

  /**
   * 导出素材数据
   * @param {Object} filter - 过滤条件
   * @returns {Promise<Array>} - 返回导出的数据
   */
  async exportMaterials(filter = {}) {
    try {
      logger.info('导出素材数据');
      
      const query = db('wechat_materials');
      
      // 添加过滤条件
      if (filter.type) {
        query.where({ type: filter.type });
      }
      if (filter.isPermanent !== undefined) {
        query.where({ is_permanent: filter.isPermanent });
      }
      if (filter.startDate) {
        query.where('create_time', '>=', filter.startDate);
      }
      if (filter.endDate) {
        query.where('create_time', '<=', filter.endDate);
      }
      
      // 按创建时间降序排序
      query.orderBy('create_time', 'desc');
      
      const materials = await query;
      
      // 解析JSON字段并格式化数据
      const exportData = materials.map(material => {
        const exportItem = { ...material };
        if (exportItem.articles) {
          exportItem.articles = JSON.parse(exportItem.articles);
        }
        // 格式化时间
        exportItem.create_time = material.create_time ? new Date(material.create_time).toISOString() : null;
        exportItem.update_time = material.update_time ? new Date(material.update_time).toISOString() : null;
        return exportItem;
      });
      
      logger.info(`导出素材数据成功，数量: ${exportData.length}`);
      return exportData;
    } catch (error) {
      logger.error('导出素材数据失败:', error);
      throw error;
    }
  }
}

module.exports = new MaterialRepository();