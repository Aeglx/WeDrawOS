/**
 * 公众号自定义菜单管理控制器
 * 处理自定义菜单的创建、查询、删除等请求
 */

const logger = require('../../../core/logger');
const menuService = require('../services/menuService');
const { successResponse, errorResponse } = require('../../../core/response');

/**
 * 自定义菜单管理控制器类
 */
class MenuController {
  /**
   * 创建自定义菜单
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async createMenu(req, res) {
    try {
      logger.info('创建自定义菜单请求');
      const menuData = req.body;
      
      const result = await menuService.createMenu(menuData);
      
      logger.info('创建自定义菜单成功');
      return successResponse(res, result, '菜单创建成功');
    } catch (error) {
      logger.error('创建自定义菜单失败:', error);
      return errorResponse(res, error.message || '菜单创建失败');
    }
  }

  /**
   * 获取自定义菜单
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async getMenu(req, res) {
    try {
      logger.info('获取自定义菜单请求');
      
      const result = await menuService.getMenu();
      
      logger.info('获取自定义菜单成功');
      return successResponse(res, result, '获取菜单成功');
    } catch (error) {
      logger.error('获取自定义菜单失败:', error);
      return errorResponse(res, error.message || '获取菜单失败');
    }
  }

  /**
   * 删除自定义菜单
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async deleteMenu(req, res) {
    try {
      logger.info('删除自定义菜单请求');
      
      const result = await menuService.deleteMenu();
      
      logger.info('删除自定义菜单成功');
      return successResponse(res, result, '菜单删除成功');
    } catch (error) {
      logger.error('删除自定义菜单失败:', error);
      return errorResponse(res, error.message || '删除菜单失败');
    }
  }

  /**
   * 保存菜单配置（不立即发布）
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async saveMenuConfig(req, res) {
    try {
      logger.info('保存菜单配置请求');
      const menuConfig = req.body;
      
      const result = await menuService.saveMenuConfig(menuConfig);
      
      logger.info('保存菜单配置成功');
      return successResponse(res, result, '菜单配置保存成功');
    } catch (error) {
      logger.error('保存菜单配置失败:', error);
      return errorResponse(res, error.message || '保存菜单配置失败');
    }
  }

  /**
   * 获取保存的菜单配置
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async getSavedMenuConfig(req, res) {
    try {
      logger.info('获取保存的菜单配置请求');
      
      const result = await menuService.getSavedMenuConfig();
      
      logger.info('获取保存的菜单配置成功');
      return successResponse(res, result, '获取菜单配置成功');
    } catch (error) {
      logger.error('获取保存的菜单配置失败:', error);
      return errorResponse(res, error.message || '获取菜单配置失败');
    }
  }

  /**
   * 测试自定义菜单
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async testMenu(req, res) {
    try {
      logger.info('测试自定义菜单请求');
      const menuData = req.body;
      
      const result = await menuService.testMenu(menuData);
      
      logger.info('测试自定义菜单成功');
      return successResponse(res, result, '菜单测试成功');
    } catch (error) {
      logger.error('测试自定义菜单失败:', error);
      return errorResponse(res, error.message || '菜单测试失败');
    }
  }

  /**
   * 获取菜单分析数据
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async getMenuAnalysis(req, res) {
    try {
      logger.info('获取菜单分析数据请求');
      const { startTime, endTime } = req.query;
      
      const result = await menuService.getMenuAnalysis(startTime, endTime);
      
      logger.info('获取菜单分析数据成功');
      return successResponse(res, result, '获取菜单分析数据成功');
    } catch (error) {
      logger.error('获取菜单分析数据失败:', error);
      return errorResponse(res, error.message || '获取菜单分析数据失败');
    }
  }

  /**
   * 创建个性化菜单
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async createConditionalMenu(req, res) {
    try {
      logger.info('创建个性化菜单请求');
      const menuData = req.body;
      
      const result = await menuService.createConditionalMenu(menuData);
      
      logger.info('创建个性化菜单成功');
      return successResponse(res, result, '个性化菜单创建成功');
    } catch (error) {
      logger.error('创建个性化菜单失败:', error);
      return errorResponse(res, error.message || '个性化菜单创建失败');
    }
  }

  /**
   * 获取个性化菜单列表
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async getConditionalMenus(req, res) {
    try {
      logger.info('获取个性化菜单列表请求');
      
      const result = await menuService.getConditionalMenus();
      
      logger.info('获取个性化菜单列表成功');
      return successResponse(res, result, '获取个性化菜单列表成功');
    } catch (error) {
      logger.error('获取个性化菜单列表失败:', error);
      return errorResponse(res, error.message || '获取个性化菜单列表失败');
    }
  }

  /**
   * 删除个性化菜单
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async deleteConditionalMenu(req, res) {
    try {
      logger.info('删除个性化菜单请求');
      const { menuId } = req.params;
      
      const result = await menuService.deleteConditionalMenu(menuId);
      
      logger.info('删除个性化菜单成功');
      return successResponse(res, result, '个性化菜单删除成功');
    } catch (error) {
      logger.error('删除个性化菜单失败:', error);
      return errorResponse(res, error.message || '删除个性化菜单失败');
    }
  }

  /**
   * 测试个性化菜单匹配
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async testConditionalMenu(req, res) {
    try {
      logger.info('测试个性化菜单匹配请求');
      const { userOpenid } = req.query;
      
      const result = await menuService.testConditionalMenu(userOpenid);
      
      logger.info('测试个性化菜单匹配成功');
      return successResponse(res, result, '测试菜单匹配成功');
    } catch (error) {
      logger.error('测试个性化菜单匹配失败:', error);
      return errorResponse(res, error.message || '测试菜单匹配失败');
    }
  }

  /**
   * 为某个菜单添加事件处理
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async addMenuEventHandler(req, res) {
    try {
      logger.info('为菜单添加事件处理请求');
      const { menuKey, handlerType, handlerContent } = req.body;
      
      const result = await menuService.addMenuEventHandler(menuKey, handlerType, handlerContent);
      
      logger.info('为菜单添加事件处理成功');
      return successResponse(res, result, '菜单事件处理添加成功');
    } catch (error) {
      logger.error('为菜单添加事件处理失败:', error);
      return errorResponse(res, error.message || '菜单事件处理添加失败');
    }
  }

  /**
   * 获取菜单事件处理列表
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async getMenuEventHandlers(req, res) {
    try {
      logger.info('获取菜单事件处理列表请求');
      
      const result = await menuService.getMenuEventHandlers();
      
      logger.info('获取菜单事件处理列表成功');
      return successResponse(res, result, '获取菜单事件处理列表成功');
    } catch (error) {
      logger.error('获取菜单事件处理列表失败:', error);
      return errorResponse(res, error.message || '获取菜单事件处理列表失败');
    }
  }

  /**
   * 更新菜单事件处理
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async updateMenuEventHandler(req, res) {
    try {
      logger.info('更新菜单事件处理请求');
      const { id } = req.params;
      const { handlerType, handlerContent } = req.body;
      
      const result = await menuService.updateMenuEventHandler(id, handlerType, handlerContent);
      
      logger.info('更新菜单事件处理成功');
      return successResponse(res, result, '菜单事件处理更新成功');
    } catch (error) {
      logger.error('更新菜单事件处理失败:', error);
      return errorResponse(res, error.message || '菜单事件处理更新失败');
    }
  }

  /**
   * 删除菜单事件处理
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async deleteMenuEventHandler(req, res) {
    try {
      logger.info('删除菜单事件处理请求');
      const { id } = req.params;
      
      const result = await menuService.deleteMenuEventHandler(id);
      
      logger.info('删除菜单事件处理成功');
      return successResponse(res, result, '菜单事件处理删除成功');
    } catch (error) {
      logger.error('删除菜单事件处理失败:', error);
      return errorResponse(res, error.message || '菜单事件处理删除失败');
    }
  }

  /**
   * 同步菜单配置到公众号
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async syncMenu(req, res) {
    try {
      logger.info('同步菜单配置到公众号请求');
      
      const result = await menuService.syncMenu();
      
      logger.info('同步菜单配置到公众号成功');
      return successResponse(res, result, '菜单同步成功');
    } catch (error) {
      logger.error('同步菜单配置到公众号失败:', error);
      return errorResponse(res, error.message || '菜单同步失败');
    }
  }

  /**
   * 获取菜单操作日志
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async getMenuLogs(req, res) {
    try {
      logger.info('获取菜单操作日志请求');
      const { page = 1, pageSize = 20, type, startTime, endTime } = req.query;
      
      const result = await menuService.getMenuLogs({
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        type,
        startTime,
        endTime
      });
      
      logger.info('获取菜单操作日志成功');
      return successResponse(res, result, '获取菜单操作日志成功');
    } catch (error) {
      logger.error('获取菜单操作日志失败:', error);
      return errorResponse(res, error.message || '获取菜单操作日志失败');
    }
  }
}

module.exports = new MenuController();