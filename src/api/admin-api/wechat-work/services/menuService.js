/**
 * 企业微信自定义菜单管理服务
 * 实现菜单创建、查询、删除等业务逻辑
 */

const logger = require('../../../core/logger');
const wechatWorkUtil = require('../../../utils/wechatWorkUtil');
const menuRepository = require('../repositories/menuRepository');
const config = require('../../../config/wechatWorkConfig');

/**
 * 企业微信自定义菜单服务类
 */
class MenuService {
  /**
   * 创建个性化菜单
   * @param {Object} menuData - 菜单数据
   * @returns {Promise<Object>} - 返回创建结果
   */
  async createConditionalMenu(menuData) {
    try {
      logger.info('开始创建企业微信个性化菜单');
      
      // 检查menuData格式
      if (!menuData || !menuData.button || !Array.isArray(menuData.button)) {
        throw new Error('菜单数据格式错误，必须包含button数组');
      }
      
      if (!menuData.matchrule || typeof menuData.matchrule !== 'object') {
        throw new Error('菜单数据格式错误，必须包含matchrule对象');
      }
      
      // 调用企业微信API创建个性化菜单
      // 注意：企业微信API中，个性化菜单的创建接口与普通菜单不同
      // 这里使用自定义的API调用方式
      const accessToken = await wechatWorkUtil.getAccessToken();
      const url = `https://qyapi.weixin.qq.com/cgi-bin/menu/addconditional?access_token=${accessToken}&agentid=${config.agentid}`;
      
      const axios = require('axios');
      const response = await axios.post(url, menuData);
      
      if (response.data.errcode !== 0) {
        logger.error(`创建个性化菜单失败: ${response.data.errmsg}`);
        throw new Error(`创建个性化菜单失败: ${response.data.errmsg}`);
      }
      
      // 保存个性化菜单信息到数据库
      await menuRepository.saveConditionalMenu({
        menuid: response.data.menuid,
        menuData: JSON.stringify(menuData),
        createTime: new Date()
      });
      
      logger.info(`个性化菜单创建成功，菜单ID: ${response.data.menuid}`);
      return response.data;
    } catch (error) {
      logger.error('创建企业微信个性化菜单异常:', error);
      throw error;
    }
  }

  /**
   * 获取个性化菜单列表
   * @returns {Promise<Array>} - 返回菜单列表
   */
  async listConditionalMenu() {
    try {
      logger.info('获取企业微信个性化菜单列表');
      
      // 调用企业微信API获取个性化菜单列表
      const accessToken = await wechatWorkUtil.getAccessToken();
      const url = `https://qyapi.weixin.qq.com/cgi-bin/menu/get?access_token=${accessToken}&agentid=${config.agentid}`;
      
      const axios = require('axios');
      const response = await axios.get(url);
      
      if (response.data.errcode !== 0) {
        logger.error(`获取个性化菜单列表失败: ${response.data.errmsg}`);
        throw new Error(`获取个性化菜单列表失败: ${response.data.errmsg}`);
      }
      
      // 处理返回的菜单数据
      const menuList = [];
      
      // 检查是否有个性化菜单
      if (response.data.menu && response.data.menu.conditionalmenu) {
        menuList.push(...response.data.menu.conditionalmenu);
      }
      
      // 从数据库获取额外的菜单信息
      const dbMenus = await menuRepository.listConditionalMenuFromDb();
      
      // 合并数据
      const mergedMenus = menuList.map(menu => {
        const dbMenu = dbMenus.find(dm => dm.menuid === menu.menuid);
        return {
          ...menu,
          createTime: dbMenu?.createTime || null,
          updateTime: dbMenu?.updateTime || null
        };
      });
      
      logger.info(`获取个性化菜单列表成功，数量: ${mergedMenus.length}`);
      return mergedMenus;
    } catch (error) {
      logger.error('获取企业微信个性化菜单列表异常:', error);
      throw error;
    }
  }

  /**
   * 删除个性化菜单
   * @param {string} menuid - 菜单ID
   * @returns {Promise<Object>} - 返回删除结果
   */
  async deleteConditionalMenu(menuid) {
    try {
      logger.info(`删除企业微信个性化菜单，菜单ID: ${menuid}`);
      
      // 调用企业微信API删除个性化菜单
      const accessToken = await wechatWorkUtil.getAccessToken();
      const url = `https://qyapi.weixin.qq.com/cgi-bin/menu/delconditional?access_token=${accessToken}&agentid=${config.agentid}`;
      
      const axios = require('axios');
      const response = await axios.post(url, { menuid });
      
      if (response.data.errcode !== 0) {
        logger.error(`删除个性化菜单失败: ${response.data.errmsg}`);
        throw new Error(`删除个性化菜单失败: ${response.data.errmsg}`);
      }
      
      // 从数据库删除菜单信息
      await menuRepository.deleteConditionalMenuFromDb(menuid);
      
      logger.info(`个性化菜单删除成功，菜单ID: ${menuid}`);
      return response.data;
    } catch (error) {
      logger.error('删除企业微信个性化菜单异常:', error);
      throw error;
    }
  }

  /**
   * 测试个性化菜单匹配
   * @param {string} userid - 用户ID
   * @returns {Promise<Object>} - 返回匹配结果
   */
  async testConditionalMenu(userid) {
    try {
      logger.info(`测试企业微信个性化菜单匹配，用户ID: ${userid}`);
      
      // 调用企业微信API测试菜单匹配
      const accessToken = await wechatWorkUtil.getAccessToken();
      const url = `https://qyapi.weixin.qq.com/cgi-bin/menu/trymatch?access_token=${accessToken}&agentid=${config.agentid}`;
      
      const axios = require('axios');
      const response = await axios.post(url, { userid });
      
      if (response.data.errcode !== 0) {
        logger.error(`测试个性化菜单匹配失败: ${response.data.errmsg}`);
        throw new Error(`测试个性化菜单匹配失败: ${response.data.errmsg}`);
      }
      
      logger.info(`测试个性化菜单匹配成功，用户ID: ${userid}`);
      return response.data;
    } catch (error) {
      logger.error('测试企业微信个性化菜单匹配异常:', error);
      throw error;
    }
  }

  /**
   * 获取菜单分析数据
   * @param {string} startDate - 开始日期
   * @param {string} endDate - 结束日期
   * @returns {Promise<Object>} - 返回分析数据
   */
  async getMenuAnalysis(startDate, endDate) {
    try {
      logger.info(`获取企业微信菜单分析数据，开始日期: ${startDate}，结束日期: ${endDate}`);
      
      // 验证日期格式
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      
      if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
        throw new Error('日期格式错误');
      }
      
      if (startDateObj > endDateObj) {
        throw new Error('开始日期不能晚于结束日期');
      }
      
      // 检查日期范围，不能超过30天
      const diffDays = Math.ceil((endDateObj - startDateObj) / (1000 * 60 * 60 * 24));
      if (diffDays > 30) {
        throw new Error('日期范围不能超过30天');
      }
      
      // 从数据库获取菜单点击统计
      const menuClickStats = await menuRepository.getMenuClickStats(startDate, endDate);
      
      // 从数据库获取菜单事件日志
      const menuEventLogs = await menuRepository.getMenuEventLogs(startDate, endDate);
      
      // 计算统计数据
      const totalClicks = menuClickStats.reduce((sum, stat) => sum + stat.clickCount, 0);
      const menuItemStats = menuClickStats.map(stat => ({
        key: stat.menuKey,
        name: stat.menuName || stat.menuKey,
        clickCount: stat.clickCount,
        clickRate: totalClicks > 0 ? ((stat.clickCount / totalClicks) * 100).toFixed(2) + '%' : '0%'
      }));
      
      // 按点击量排序
      menuItemStats.sort((a, b) => b.clickCount - a.clickCount);
      
      // 生成时间趋势数据
      const dateRange = this.generateDateRange(startDate, endDate);
      const dailyStats = await this.getDailyMenuStats(dateRange);
      
      // 生成分析结果
      const analysisData = {
        summary: {
          totalClicks,
          dateRange: `${startDate} 至 ${endDate}`,
          days: diffDays + 1,
          averageClicksPerDay: totalClicks > 0 ? (totalClicks / (diffDays + 1)).toFixed(2) : '0'
        },
        topMenuItems: menuItemStats.slice(0, 10),
        dailyTrend: dailyStats,
        eventLogs: menuEventLogs
      };
      
      logger.info('获取企业微信菜单分析数据成功');
      return analysisData;
    } catch (error) {
      logger.error('获取企业微信菜单分析数据异常:', error);
      throw error;
    }
  }

  /**
   * 生成日期范围数组
   * @param {string} startDate - 开始日期
   * @param {string} endDate - 结束日期
   * @returns {Array} - 日期数组
   * @private
   */
  generateDateRange(startDate, endDate) {
    const dates = [];
    const currentDate = new Date(startDate);
    const lastDate = new Date(endDate);
    
    while (currentDate <= lastDate) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
  }

  /**
   * 获取每日菜单统计数据
   * @param {Array} dateRange - 日期范围数组
   * @returns {Promise<Array>} - 每日统计数据
   * @private
   */
  async getDailyMenuStats(dateRange) {
    try {
      const dailyStats = await menuRepository.getDailyMenuClickStats(dateRange[0], dateRange[dateRange.length - 1]);
      
      // 构建日期到点击量的映射
      const statsMap = new Map();
      dailyStats.forEach(stat => {
        statsMap.set(stat.date, stat.clickCount);
      });
      
      // 填充所有日期的数据
      return dateRange.map(date => ({
        date,
        clickCount: statsMap.get(date) || 0
      }));
    } catch (error) {
      logger.error('获取每日菜单统计数据异常:', error);
      return dateRange.map(date => ({ date, clickCount: 0 }));
    }
  }

  /**
   * 解析菜单点击事件
   * @param {Object} eventData - 事件数据
   * @returns {Promise<Object>} - 解析后的事件信息
   */
  async parseMenuClickEvent(eventData) {
    try {
      logger.info('解析企业微信菜单点击事件');
      
      const { EventKey, FromUserName, CreateTime, MsgType, Event } = eventData;
      
      // 记录点击事件
      await menuRepository.recordMenuClick({
        menuKey: EventKey,
        openid: FromUserName,
        clickTime: new Date(CreateTime * 1000),
        eventType: Event,
        eventData: JSON.stringify(eventData)
      });
      
      // 查询对应的菜单事件配置
      const menuEvent = await menuRepository.getMenuEventByKey(EventKey);
      
      let action = null;
      if (menuEvent) {
        action = menuEvent.action;
      }
      
      return {
        menuKey: EventKey,
        openid: FromUserName,
        clickTime: new Date(CreateTime * 1000),
        action,
        menuEvent
      };
    } catch (error) {
      logger.error('解析企业微信菜单点击事件异常:', error);
      throw error;
    }
  }

  /**
   * 生成菜单配置建议
   * @returns {Promise<Object>} - 菜单配置建议
   */
  async generateMenuSuggestions() {
    try {
      logger.info('生成企业微信菜单配置建议');
      
      // 获取热门菜单点击
      const hotMenus = await menuRepository.getHotMenuItems(5);
      
      // 获取部门信息
      const departments = await wechatWorkUtil.getDepartmentList();
      
      // 获取标签信息
      const tags = await wechatWorkUtil.getTagList();
      
      // 生成建议
      const suggestions = {
        hotMenuItems: hotMenus.map(menu => ({
          key: menu.menuKey,
          name: menu.menuName || menu.menuKey,
          clickCount: menu.clickCount,
          suggestion: `建议将「${menu.menuName || menu.menuKey}」放在一级菜单以提高访问便捷性`
        })),
        conditionalMenuSuggestions: [],
        optimizationTips: []
      };
      
      // 添加个性化菜单建议
      if (departments && departments.department && departments.department.length > 0) {
        suggestions.conditionalMenuSuggestions.push({
          type: 'department',
          suggestion: '建议根据不同部门创建个性化菜单，提供针对性的功能入口',
          departments: departments.department.slice(0, 3).map(dept => dept.name)
        });
      }
      
      if (tags && tags.tag_group && tags.tag_group.length > 0) {
        suggestions.conditionalMenuSuggestions.push({
          type: 'tag',
          suggestion: '建议根据用户标签创建个性化菜单，满足不同用户群体的需求',
          tags: tags.tag_group.slice(0, 1).tags.slice(0, 3).map(tag => tag.name)
        });
      }
      
      // 添加优化建议
      suggestions.optimizationTips = [
        '建议菜单名称简洁明了，不超过16个字符',
        '一级菜单建议控制在2-3个，避免用户选择困难',
        '常用功能应放在更容易点击的位置',
        '定期更新菜单内容，保持功能的时效性',
        '结合业务场景，提供最相关的功能入口'
      ];
      
      logger.info('生成企业微信菜单配置建议成功');
      return suggestions;
    } catch (error) {
      logger.error('生成企业微信菜单配置建议异常:', error);
      throw error;
    }
  }

  /**
   * 导入菜单配置
   * @param {Object} menuData - 导入的菜单数据
   * @returns {Promise<Object>} - 导入结果
   */
  async importMenuConfig(menuData) {
    try {
      logger.info('导入企业微信菜单配置');
      
      // 验证菜单数据格式
      if (!menuData || typeof menuData !== 'object') {
        throw new Error('菜单数据格式错误');
      }
      
      // 检查是否为个性化菜单
      const isConditional = menuData.matchrule ? true : false;
      
      let result;
      
      if (isConditional) {
        // 导入个性化菜单
        result = await this.createConditionalMenu(menuData);
      } else {
        // 导入普通菜单
        result = await wechatWorkUtil.createMenu(menuData);
      }
      
      logger.info('导入企业微信菜单配置成功');
      return {
        success: true,
        message: '菜单配置导入成功',
        result,
        isConditional
      };
    } catch (error) {
      logger.error('导入企业微信菜单配置异常:', error);
      throw error;
    }
  }

  /**
   * 导出菜单配置
   * @param {string} menuType - 菜单类型
   * @param {string} menuid - 菜单ID（个性化菜单时需要）
   * @returns {Promise<Object>} - 菜单配置数据
   */
  async exportMenuConfig(menuType = 'default', menuid = null) {
    try {
      logger.info(`导出企业微信菜单配置，类型: ${menuType}`);
      
      if (menuType === 'conditional' && !menuid) {
        throw new Error('导出个性化菜单时必须提供菜单ID');
      }
      
      let menuData;
      
      if (menuType === 'conditional') {
        // 获取特定的个性化菜单
        const menuList = await this.listConditionalMenu();
        const targetMenu = menuList.find(menu => menu.menuid === menuid);
        
        if (!targetMenu) {
          throw new Error('指定的个性化菜单不存在');
        }
        
        menuData = targetMenu;
      } else {
        // 获取默认菜单
        menuData = await wechatWorkUtil.getMenu();
      }
      
      logger.info('导出企业微信菜单配置成功');
      return {
        menuData,
        exportTime: new Date(),
        exportType: menuType,
        version: '1.0'
      };
    } catch (error) {
      logger.error('导出企业微信菜单配置异常:', error);
      throw error;
    }
  }
}

module.exports = new MenuService();