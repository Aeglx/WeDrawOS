/**
 * 企业微信自定义菜单管理仓库
 * 实现菜单数据的持久化存储和访问逻辑
 */

const logger = require('../../../core/logger');
const db = require('../../../core/database');

/**
 * 企业微信自定义菜单仓库类
 */
class MenuRepository {
  /**
   * 保存菜单配置
   * @param {Object} configData - 配置数据
   * @returns {Promise<Object>} - 保存结果
   */
  async saveMenuConfig(configData) {
    try {
      const query = `
        INSERT INTO wechat_work_menu_config 
        (name, description, menu_data, create_by, create_time, update_by, update_time) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      
      const [result] = await db.execute(query, [
        configData.name,
        configData.description || '',
        JSON.stringify(configData.menuData),
        configData.createBy,
        configData.createTime,
        configData.createBy,
        configData.createTime
      ]);
      
      return {
        id: result.insertId,
        ...configData
      };
    } catch (error) {
      logger.error('保存菜单配置失败:', error);
      throw error;
    }
  }

  /**
   * 获取菜单配置列表
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} - 查询结果
   */
  async listMenuConfig(options) {
    try {
      const { page, pageSize, keyword } = options;
      const offset = (page - 1) * pageSize;
      
      let query = `
        SELECT id, name, description, create_by, create_time, update_by, update_time 
        FROM wechat_work_menu_config 
        WHERE 1=1
      `;
      
      const params = [];
      
      if (keyword) {
        query += ` AND (name LIKE ? OR description LIKE ?)`;
        params.push(`%${keyword}%`, `%${keyword}%`);
      }
      
      query += ` ORDER BY create_time DESC LIMIT ? OFFSET ?`;
      params.push(pageSize, offset);
      
      const [rows] = await db.execute(query, params);
      
      // 获取总数
      let countQuery = `SELECT COUNT(*) as count FROM wechat_work_menu_config WHERE 1=1`;
      const countParams = [];
      
      if (keyword) {
        countQuery += ` AND (name LIKE ? OR description LIKE ?)`;
        countParams.push(`%${keyword}%`, `%${keyword}%`);
      }
      
      const [[countResult]] = await db.execute(countQuery, countParams);
      
      return {
        list: rows,
        total: countResult.count,
        page,
        pageSize
      };
    } catch (error) {
      logger.error('获取菜单配置列表失败:', error);
      throw error;
    }
  }

  /**
   * 根据ID获取菜单配置详情
   * @param {string} id - 配置ID
   * @returns {Promise<Object>} - 配置详情
   */
  async getMenuConfigById(id) {
    try {
      const query = `
        SELECT id, name, description, menu_data, create_by, create_time, update_by, update_time 
        FROM wechat_work_menu_config 
        WHERE id = ?
      `;
      
      const [[row]] = await db.execute(query, [id]);
      
      if (row) {
        return {
          ...row,
          menuData: JSON.parse(row.menu_data)
        };
      }
      
      return null;
    } catch (error) {
      logger.error(`获取菜单配置详情失败，ID: ${id}`, error);
      throw error;
    }
  }

  /**
   * 更新菜单配置
   * @param {string} id - 配置ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<Object>} - 更新结果
   */
  async updateMenuConfig(id, updateData) {
    try {
      const query = `
        UPDATE wechat_work_menu_config 
        SET name = ?, description = ?, menu_data = ?, update_by = ?, update_time = ? 
        WHERE id = ?
      `;
      
      await db.execute(query, [
        updateData.name,
        updateData.description || '',
        JSON.stringify(updateData.menuData),
        updateData.updateBy,
        updateData.updateTime,
        id
      ]);
      
      return await this.getMenuConfigById(id);
    } catch (error) {
      logger.error(`更新菜单配置失败，ID: ${id}`, error);
      throw error;
    }
  }

  /**
   * 删除菜单配置
   * @param {Array} ids - 配置ID列表
   * @returns {Promise<number>} - 删除数量
   */
  async deleteMenuConfig(ids) {
    try {
      const query = `DELETE FROM wechat_work_menu_config WHERE id IN (?)`;
      const [result] = await db.execute(query, [ids]);
      return result.affectedRows;
    } catch (error) {
      logger.error('删除菜单配置失败:', error);
      throw error;
    }
  }

  /**
   * 创建菜单操作日志
   * @param {Object} logData - 日志数据
   * @returns {Promise<Object>} - 日志记录
   */
  async createMenuLog(logData) {
    try {
      const query = `
        INSERT INTO wechat_work_menu_log 
        (type, menu_data, operator, status, error, extra, create_time) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      
      const [result] = await db.execute(query, [
        logData.type,
        logData.menuData || '',
        logData.operator,
        logData.status,
        logData.error || '',
        logData.extra || '',
        new Date()
      ]);
      
      return {
        id: result.insertId,
        ...logData,
        createTime: new Date()
      };
    } catch (error) {
      logger.error('创建菜单操作日志失败:', error);
      throw error;
    }
  }

  /**
   * 获取菜单操作日志
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} - 查询结果
   */
  async getMenuLogs(options) {
    try {
      const { page, pageSize, startDate, endDate } = options;
      const offset = (page - 1) * pageSize;
      
      let query = `
        SELECT id, type, menu_data, operator, status, error, extra, create_time 
        FROM wechat_work_menu_log 
        WHERE 1=1
      `;
      
      const params = [];
      
      if (startDate) {
        query += ` AND create_time >= ?`;
        params.push(new Date(startDate));
      }
      
      if (endDate) {
        // 结束日期加一天，包含当天所有记录
        const endDatePlusOne = new Date(endDate);
        endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
        query += ` AND create_time < ?`;
        params.push(endDatePlusOne);
      }
      
      query += ` ORDER BY create_time DESC LIMIT ? OFFSET ?`;
      params.push(pageSize, offset);
      
      const [rows] = await db.execute(query, params);
      
      // 获取总数
      let countQuery = `SELECT COUNT(*) as count FROM wechat_work_menu_log WHERE 1=1`;
      const countParams = [];
      
      if (startDate) {
        countQuery += ` AND create_time >= ?`;
        countParams.push(new Date(startDate));
      }
      
      if (endDate) {
        const endDatePlusOne = new Date(endDate);
        endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
        countQuery += ` AND create_time < ?`;
        countParams.push(endDatePlusOne);
      }
      
      const [[countResult]] = await db.execute(countQuery, countParams);
      
      return {
        list: rows,
        total: countResult.count,
        page,
        pageSize
      };
    } catch (error) {
      logger.error('获取菜单操作日志失败:', error);
      throw error;
    }
  }

  /**
   * 保存个性化菜单
   * @param {Object} menuData - 菜单数据
   * @returns {Promise<Object>} - 保存结果
   */
  async saveConditionalMenu(menuData) {
    try {
      const query = `
        INSERT INTO wechat_work_conditional_menu 
        (menuid, menu_data, create_time, update_time) 
        VALUES (?, ?, ?, ?)
      `;
      
      const [result] = await db.execute(query, [
        menuData.menuid,
        menuData.menuData,
        menuData.createTime,
        menuData.createTime
      ]);
      
      return {
        id: result.insertId,
        ...menuData
      };
    } catch (error) {
      logger.error('保存个性化菜单失败:', error);
      throw error;
    }
  }

  /**
   * 从数据库获取个性化菜单列表
   * @returns {Promise<Array>} - 菜单列表
   */
  async listConditionalMenuFromDb() {
    try {
      const query = `
        SELECT id, menuid, menu_data, create_time, update_time 
        FROM wechat_work_conditional_menu 
        ORDER BY create_time DESC
      `;
      
      const [rows] = await db.execute(query);
      return rows;
    } catch (error) {
      logger.error('从数据库获取个性化菜单列表失败:', error);
      throw error;
    }
  }

  /**
   * 从数据库删除个性化菜单
   * @param {string} menuid - 菜单ID
   * @returns {Promise<void>}
   */
  async deleteConditionalMenuFromDb(menuid) {
    try {
      const query = `DELETE FROM wechat_work_conditional_menu WHERE menuid = ?`;
      await db.execute(query, [menuid]);
    } catch (error) {
      logger.error(`从数据库删除个性化菜单失败，菜单ID: ${menuid}`, error);
      throw error;
    }
  }

  /**
   * 创建菜单事件
   * @param {Object} eventData - 事件数据
   * @returns {Promise<Object>} - 创建结果
   */
  async createMenuEvent(eventData) {
    try {
      const query = `
        INSERT INTO wechat_work_menu_event 
        (name, key, type, action, description, create_by, create_time, update_by, update_time) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const [result] = await db.execute(query, [
        eventData.name,
        eventData.key,
        eventData.type,
        eventData.action,
        eventData.description || '',
        eventData.createBy,
        eventData.createTime,
        eventData.createBy,
        eventData.createTime
      ]);
      
      return {
        id: result.insertId,
        ...eventData
      };
    } catch (error) {
      logger.error('创建菜单事件失败:', error);
      throw error;
    }
  }

  /**
   * 获取菜单事件列表
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} - 查询结果
   */
  async listMenuEvent(options) {
    try {
      const { page, pageSize, keyword } = options;
      const offset = (page - 1) * pageSize;
      
      let query = `
        SELECT id, name, key, type, action, description, create_by, create_time, update_by, update_time 
        FROM wechat_work_menu_event 
        WHERE 1=1
      `;
      
      const params = [];
      
      if (keyword) {
        query += ` AND (name LIKE ? OR key LIKE ? OR description LIKE ?)`;
        params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
      }
      
      query += ` ORDER BY create_time DESC LIMIT ? OFFSET ?`;
      params.push(pageSize, offset);
      
      const [rows] = await db.execute(query, params);
      
      // 获取总数
      let countQuery = `SELECT COUNT(*) as count FROM wechat_work_menu_event WHERE 1=1`;
      const countParams = [];
      
      if (keyword) {
        countQuery += ` AND (name LIKE ? OR key LIKE ? OR description LIKE ?)`;
        countParams.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
      }
      
      const [[countResult]] = await db.execute(countQuery, countParams);
      
      return {
        list: rows,
        total: countResult.count,
        page,
        pageSize
      };
    } catch (error) {
      logger.error('获取菜单事件列表失败:', error);
      throw error;
    }
  }

  /**
   * 根据ID获取菜单事件
   * @param {string} id - 事件ID
   * @returns {Promise<Object>} - 事件详情
   */
  async getMenuEventById(id) {
    try {
      const query = `
        SELECT id, name, key, type, action, description, create_by, create_time, update_by, update_time 
        FROM wechat_work_menu_event 
        WHERE id = ?
      `;
      
      const [[row]] = await db.execute(query, [id]);
      return row || null;
    } catch (error) {
      logger.error(`根据ID获取菜单事件失败，ID: ${id}`, error);
      throw error;
    }
  }

  /**
   * 根据Key获取菜单事件
   * @param {string} key - 事件Key
   * @returns {Promise<Object>} - 事件详情
   */
  async getMenuEventByKey(key) {
    try {
      const query = `
        SELECT id, name, key, type, action, description 
        FROM wechat_work_menu_event 
        WHERE key = ?
      `;
      
      const [[row]] = await db.execute(query, [key]);
      return row || null;
    } catch (error) {
      logger.error(`根据Key获取菜单事件失败，Key: ${key}`, error);
      throw error;
    }
  }

  /**
   * 更新菜单事件
   * @param {string} id - 事件ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<Object>} - 更新结果
   */
  async updateMenuEvent(id, updateData) {
    try {
      const query = `
        UPDATE wechat_work_menu_event 
        SET name = ?, key = ?, type = ?, action = ?, description = ?, update_by = ?, update_time = ? 
        WHERE id = ?
      `;
      
      await db.execute(query, [
        updateData.name,
        updateData.key,
        updateData.type,
        updateData.action,
        updateData.description || '',
        updateData.updateBy,
        updateData.updateTime,
        id
      ]);
      
      return await this.getMenuEventById(id);
    } catch (error) {
      logger.error(`更新菜单事件失败，ID: ${id}`, error);
      throw error;
    }
  }

  /**
   * 删除菜单事件
   * @param {Array} ids - 事件ID列表
   * @returns {Promise<number>} - 删除数量
   */
  async deleteMenuEvent(ids) {
    try {
      const query = `DELETE FROM wechat_work_menu_event WHERE id IN (?)`;
      const [result] = await db.execute(query, [ids]);
      return result.affectedRows;
    } catch (error) {
      logger.error('删除菜单事件失败:', error);
      throw error;
    }
  }

  /**
   * 记录菜单点击
   * @param {Object} clickData - 点击数据
   * @returns {Promise<Object>} - 记录结果
   */
  async recordMenuClick(clickData) {
    try {
      const query = `
        INSERT INTO wechat_work_menu_click_log 
        (menu_key, menu_name, openid, click_time, event_type, event_data) 
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      const [result] = await db.execute(query, [
        clickData.menuKey,
        clickData.menuName || '',
        clickData.openid,
        clickData.clickTime,
        clickData.eventType,
        clickData.eventData
      ]);
      
      return {
        id: result.insertId,
        ...clickData
      };
    } catch (error) {
      logger.error('记录菜单点击失败:', error);
      throw error;
    }
  }

  /**
   * 获取菜单点击统计
   * @param {string} startDate - 开始日期
   * @param {string} endDate - 结束日期
   * @returns {Promise<Array>} - 统计数据
   */
  async getMenuClickStats(startDate, endDate) {
    try {
      const query = `
        SELECT 
          menu_key as menuKey,
          MAX(menu_name) as menuName,
          COUNT(*) as clickCount
        FROM wechat_work_menu_click_log 
        WHERE click_time >= ? AND click_time <= ?
        GROUP BY menu_key
        ORDER BY clickCount DESC
      `;
      
      // 结束日期加一天，包含当天所有记录
      const endDatePlusOne = new Date(endDate);
      endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
      
      const [rows] = await db.execute(query, [new Date(startDate), endDatePlusOne]);
      return rows;
    } catch (error) {
      logger.error('获取菜单点击统计失败:', error);
      throw error;
    }
  }

  /**
   * 获取每日菜单点击统计
   * @param {string} startDate - 开始日期
   * @param {string} endDate - 结束日期
   * @returns {Promise<Array>} - 每日统计数据
   */
  async getDailyMenuClickStats(startDate, endDate) {
    try {
      const query = `
        SELECT 
          DATE(click_time) as date,
          COUNT(*) as clickCount
        FROM wechat_work_menu_click_log 
        WHERE click_time >= ? AND click_time <= ?
        GROUP BY DATE(click_time)
        ORDER BY date
      `;
      
      // 结束日期加一天，包含当天所有记录
      const endDatePlusOne = new Date(endDate);
      endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
      
      const [rows] = await db.execute(query, [new Date(startDate), endDatePlusOne]);
      return rows;
    } catch (error) {
      logger.error('获取每日菜单点击统计失败:', error);
      throw error;
    }
  }

  /**
   * 获取热门菜单项
   * @param {number} limit - 数量限制
   * @returns {Promise<Array>} - 热门菜单项
   */
  async getHotMenuItems(limit = 10) {
    try {
      const query = `
        SELECT 
          menu_key as menuKey,
          MAX(menu_name) as menuName,
          COUNT(*) as clickCount
        FROM wechat_work_menu_click_log 
        WHERE click_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY menu_key
        ORDER BY clickCount DESC
        LIMIT ?
      `;
      
      const [rows] = await db.execute(query, [limit]);
      return rows;
    } catch (error) {
      logger.error('获取热门菜单项失败:', error);
      throw error;
    }
  }

  /**
   * 获取菜单事件日志
   * @param {string} startDate - 开始日期
   * @param {string} endDate - 结束日期
   * @returns {Promise<Array>} - 事件日志
   */
  async getMenuEventLogs(startDate, endDate) {
    try {
      const query = `
        SELECT 
          id, menu_key as menuKey, menu_name as menuName, openid, click_time as clickTime,
          event_type as eventType, event_data as eventData
        FROM wechat_work_menu_click_log 
        WHERE click_time >= ? AND click_time <= ?
        ORDER BY click_time DESC
        LIMIT 100
      `;
      
      // 结束日期加一天，包含当天所有记录
      const endDatePlusOne = new Date(endDate);
      endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
      
      const [rows] = await db.execute(query, [new Date(startDate), endDatePlusOne]);
      return rows;
    } catch (error) {
      logger.error('获取菜单事件日志失败:', error);
      throw error;
    }
  }

  /**
   * 保存同步的菜单数据
   * @param {Object} menuData - 菜单数据
   * @param {string} operator - 操作人
   * @returns {Promise<Object>} - 保存结果
   */
  async saveSyncMenuData(menuData, operator) {
    try {
      const query = `
        INSERT INTO wechat_work_menu_sync 
        (menu_data, sync_by, sync_time) 
        VALUES (?, ?, ?)
      `;
      
      const [result] = await db.execute(query, [
        JSON.stringify(menuData),
        operator,
        new Date()
      ]);
      
      return {
        id: result.insertId,
        menuData,
        syncBy: operator,
        syncTime: new Date()
      };
    } catch (error) {
      logger.error('保存同步的菜单数据失败:', error);
      throw error;
    }
  }
}

module.exports = new MenuRepository();