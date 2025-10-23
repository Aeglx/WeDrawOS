/**
 * 企业微信自定义菜单管理控制器
 * 实现菜单创建、查询、删除等功能
 */

const logger = require('../../../core/logger');
const wechatWorkUtil = require('../../../utils/wechatWorkUtil');
const menuService = require('../services/menuService');
const menuRepository = require('../repositories/menuRepository');
const { responseUtil } = require('../../../utils/responseUtil');

/**
 * 企业微信自定义菜单控制器类
 */
class MenuController {
  /**
   * 创建自定义菜单
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async createMenu(req, res) {
    try {
      const { button } = req.body;
      const operator = req.user?.username || 'admin';
      
      logger.info(`创建企业微信自定义菜单，操作人: ${operator}`);
      
      // 调用企业微信API创建菜单
      const result = await wechatWorkUtil.createMenu({ button });
      
      // 记录操作日志
      await menuRepository.createMenuLog({
        type: 'create',
        menuData: JSON.stringify({ button }),
        operator,
        status: 'success'
      });
      
      logger.info('企业微信自定义菜单创建成功');
      return responseUtil.success(res, '自定义菜单创建成功', result);
    } catch (error) {
      const errorInfo = wechatWorkUtil.handleError(error);
      logger.error('创建企业微信自定义菜单失败:', errorInfo);
      
      // 记录失败日志
      try {
        await menuRepository.createMenuLog({
          type: 'create',
          menuData: JSON.stringify(req.body || {}),
          operator: req.user?.username || 'admin',
          status: 'fail',
          error: errorInfo.message
        });
      } catch (logError) {
        logger.error('记录菜单操作日志失败:', logError);
      }
      
      return responseUtil.error(res, errorInfo.message, errorInfo.code);
    }
  }

  /**
   * 获取自定义菜单
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async getMenu(req, res) {
    try {
      const operator = req.user?.username || 'admin';
      
      logger.info(`获取企业微信自定义菜单，操作人: ${operator}`);
      
      // 调用企业微信API获取菜单
      const result = await wechatWorkUtil.getMenu();
      
      logger.info('获取企业微信自定义菜单成功');
      return responseUtil.success(res, '自定义菜单获取成功', result);
    } catch (error) {
      const errorInfo = wechatWorkUtil.handleError(error);
      logger.error('获取企业微信自定义菜单失败:', errorInfo);
      return responseUtil.error(res, errorInfo.message, errorInfo.code);
    }
  }

  /**
   * 删除自定义菜单
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async deleteMenu(req, res) {
    try {
      const operator = req.user?.username || 'admin';
      
      logger.info(`删除企业微信自定义菜单，操作人: ${operator}`);
      
      // 调用企业微信API删除菜单
      const result = await wechatWorkUtil.deleteMenu();
      
      // 记录操作日志
      await menuRepository.createMenuLog({
        type: 'delete',
        menuData: '',
        operator,
        status: 'success'
      });
      
      logger.info('企业微信自定义菜单删除成功');
      return responseUtil.success(res, '自定义菜单删除成功', result);
    } catch (error) {
      const errorInfo = wechatWorkUtil.handleError(error);
      logger.error('删除企业微信自定义菜单失败:', errorInfo);
      
      // 记录失败日志
      try {
        await menuRepository.createMenuLog({
          type: 'delete',
          menuData: '',
          operator: req.user?.username || 'admin',
          status: 'fail',
          error: errorInfo.message
        });
      } catch (logError) {
        logger.error('记录菜单操作日志失败:', logError);
      }
      
      return responseUtil.error(res, errorInfo.message, errorInfo.code);
    }
  }

  /**
   * 保存菜单配置
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async saveMenuConfig(req, res) {
    try {
      const { name, description, menuData } = req.body;
      const operator = req.user?.username || 'admin';
      
      logger.info(`保存企业微信菜单配置，配置名称: ${name}，操作人: ${operator}`);
      
      // 保存菜单配置到数据库
      const configData = {
        name,
        description,
        menuData,
        createBy: operator,
        createTime: new Date()
      };
      
      const result = await menuRepository.saveMenuConfig(configData);
      
      logger.info(`企业微信菜单配置保存成功，配置ID: ${result.id}`);
      return responseUtil.success(res, '菜单配置保存成功', result);
    } catch (error) {
      logger.error('保存企业微信菜单配置失败:', error);
      return responseUtil.error(res, '菜单配置保存失败', 500);
    }
  }

  /**
   * 获取菜单配置列表
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async listMenuConfig(req, res) {
    try {
      const { page = 1, pageSize = 10, keyword = '' } = req.query;
      
      logger.info(`获取企业微信菜单配置列表，页码: ${page}，每页数量: ${pageSize}，关键词: ${keyword}`);
      
      // 查询菜单配置列表
      const result = await menuRepository.listMenuConfig({
        page,
        pageSize,
        keyword
      });
      
      logger.info(`获取企业微信菜单配置列表成功，总数: ${result.total}`);
      return responseUtil.success(res, '菜单配置列表获取成功', result);
    } catch (error) {
      logger.error('获取企业微信菜单配置列表失败:', error);
      return responseUtil.error(res, '菜单配置列表获取失败', 500);
    }
  }

  /**
   * 获取菜单配置详情
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async getMenuConfig(req, res) {
    try {
      const { id } = req.params;
      
      logger.info(`获取企业微信菜单配置详情，配置ID: ${id}`);
      
      // 查询菜单配置详情
      const result = await menuRepository.getMenuConfigById(id);
      
      if (!result) {
        return responseUtil.error(res, '菜单配置不存在', 404);
      }
      
      logger.info(`获取企业微信菜单配置详情成功，配置ID: ${id}`);
      return responseUtil.success(res, '菜单配置详情获取成功', result);
    } catch (error) {
      logger.error('获取企业微信菜单配置详情失败:', error);
      return responseUtil.error(res, '菜单配置详情获取失败', 500);
    }
  }

  /**
   * 更新菜单配置
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async updateMenuConfig(req, res) {
    try {
      const { id } = req.params;
      const { name, description, menuData } = req.body;
      const operator = req.user?.username || 'admin';
      
      logger.info(`更新企业微信菜单配置，配置ID: ${id}，操作人: ${operator}`);
      
      // 检查配置是否存在
      const existingConfig = await menuRepository.getMenuConfigById(id);
      if (!existingConfig) {
        return responseUtil.error(res, '菜单配置不存在', 404);
      }
      
      // 更新菜单配置
      const updateData = {
        name,
        description,
        menuData,
        updateBy: operator,
        updateTime: new Date()
      };
      
      const result = await menuRepository.updateMenuConfig(id, updateData);
      
      logger.info(`企业微信菜单配置更新成功，配置ID: ${id}`);
      return responseUtil.success(res, '菜单配置更新成功', result);
    } catch (error) {
      logger.error('更新企业微信菜单配置失败:', error);
      return responseUtil.error(res, '菜单配置更新失败', 500);
    }
  }

  /**
   * 删除菜单配置
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async deleteMenuConfig(req, res) {
    try {
      const { ids } = req.body;
      const operator = req.user?.username || 'admin';
      
      logger.info(`删除企业微信菜单配置，配置ID列表: ${ids.join(',')}，操作人: ${operator}`);
      
      // 删除菜单配置
      const result = await menuRepository.deleteMenuConfig(ids);
      
      logger.info(`企业微信菜单配置删除成功，删除数量: ${result}`);
      return responseUtil.success(res, '菜单配置删除成功', { deletedCount: result });
    } catch (error) {
      logger.error('删除企业微信菜单配置失败:', error);
      return responseUtil.error(res, '菜单配置删除失败', 500);
    }
  }

  /**
   * 测试菜单
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async testMenu(req, res) {
    try {
      const { userid } = req.body;
      const operator = req.user?.username || 'admin';
      
      logger.info(`测试企业微信菜单，测试用户: ${userid}，操作人: ${operator}`);
      
      // 获取当前菜单配置
      const menuData = await wechatWorkUtil.getMenu();
      
      // 记录测试日志
      await menuRepository.createMenuLog({
        type: 'test',
        menuData: JSON.stringify(menuData),
        operator,
        status: 'success',
        extra: `测试用户: ${userid}`
      });
      
      logger.info('企业微信菜单测试成功');
      return responseUtil.success(res, '菜单测试成功', { menuData, testUser: userid });
    } catch (error) {
      const errorInfo = wechatWorkUtil.handleError(error);
      logger.error('测试企业微信菜单失败:', errorInfo);
      
      return responseUtil.error(res, errorInfo.message, errorInfo.code);
    }
  }

  /**
   * 获取菜单分析数据
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async getMenuAnalysis(req, res) {
    try {
      const { startDate, endDate } = req.query;
      
      logger.info(`获取企业微信菜单分析数据，开始日期: ${startDate}，结束日期: ${endDate}`);
      
      // 计算日期范围内的分析数据
      const analysisData = await menuService.getMenuAnalysis(startDate, endDate);
      
      logger.info('获取企业微信菜单分析数据成功');
      return responseUtil.success(res, '菜单分析数据获取成功', analysisData);
    } catch (error) {
      logger.error('获取企业微信菜单分析数据失败:', error);
      return responseUtil.error(res, '菜单分析数据获取失败', 500);
    }
  }

  /**
   * 创建个性化菜单
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async createConditionalMenu(req, res) {
    try {
      const { button, matchrule } = req.body;
      const operator = req.user?.username || 'admin';
      
      logger.info(`创建企业微信个性化菜单，操作人: ${operator}`);
      
      // 创建个性化菜单
      const menuData = { button, matchrule };
      const result = await menuService.createConditionalMenu(menuData);
      
      // 记录操作日志
      await menuRepository.createMenuLog({
        type: 'create_conditional',
        menuData: JSON.stringify(menuData),
        operator,
        status: 'success'
      });
      
      logger.info(`企业微信个性化菜单创建成功，菜单ID: ${result.menuid}`);
      return responseUtil.success(res, '个性化菜单创建成功', result);
    } catch (error) {
      const errorInfo = wechatWorkUtil.handleError(error);
      logger.error('创建企业微信个性化菜单失败:', errorInfo);
      
      return responseUtil.error(res, errorInfo.message, errorInfo.code);
    }
  }

  /**
   * 获取个性化菜单列表
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async listConditionalMenu(req, res) {
    try {
      logger.info('获取企业微信个性化菜单列表');
      
      // 获取个性化菜单列表
      const result = await menuService.listConditionalMenu();
      
      logger.info(`获取企业微信个性化菜单列表成功，数量: ${result.length}`);
      return responseUtil.success(res, '个性化菜单列表获取成功', result);
    } catch (error) {
      const errorInfo = wechatWorkUtil.handleError(error);
      logger.error('获取企业微信个性化菜单列表失败:', errorInfo);
      return responseUtil.error(res, errorInfo.message, errorInfo.code);
    }
  }

  /**
   * 删除个性化菜单
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async deleteConditionalMenu(req, res) {
    try {
      const { menuid } = req.body;
      const operator = req.user?.username || 'admin';
      
      logger.info(`删除企业微信个性化菜单，菜单ID: ${menuid}，操作人: ${operator}`);
      
      // 删除个性化菜单
      const result = await menuService.deleteConditionalMenu(menuid);
      
      // 记录操作日志
      await menuRepository.createMenuLog({
        type: 'delete_conditional',
        menuData: '',
        operator,
        status: 'success',
        extra: `菜单ID: ${menuid}`
      });
      
      logger.info(`企业微信个性化菜单删除成功，菜单ID: ${menuid}`);
      return responseUtil.success(res, '个性化菜单删除成功', result);
    } catch (error) {
      const errorInfo = wechatWorkUtil.handleError(error);
      logger.error('删除企业微信个性化菜单失败:', errorInfo);
      return responseUtil.error(res, errorInfo.message, errorInfo.code);
    }
  }

  /**
   * 测试个性化菜单匹配
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async testConditionalMenu(req, res) {
    try {
      const { userid } = req.body;
      const operator = req.user?.username || 'admin';
      
      logger.info(`测试企业微信个性化菜单匹配，测试用户: ${userid}，操作人: ${operator}`);
      
      // 测试个性化菜单匹配
      const result = await menuService.testConditionalMenu(userid);
      
      logger.info(`企业微信个性化菜单匹配测试成功，测试用户: ${userid}`);
      return responseUtil.success(res, '个性化菜单匹配测试成功', result);
    } catch (error) {
      const errorInfo = wechatWorkUtil.handleError(error);
      logger.error('测试企业微信个性化菜单匹配失败:', errorInfo);
      return responseUtil.error(res, errorInfo.message, errorInfo.code);
    }
  }

  /**
   * 添加菜单事件
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async createMenuEvent(req, res) {
    try {
      const { name, key, type, action, description } = req.body;
      const operator = req.user?.username || 'admin';
      
      logger.info(`添加企业微信菜单事件，事件名称: ${name}，事件key: ${key}，操作人: ${operator}`);
      
      // 保存菜单事件
      const eventData = {
        name,
        key,
        type,
        action,
        description,
        createBy: operator,
        createTime: new Date()
      };
      
      const result = await menuRepository.createMenuEvent(eventData);
      
      logger.info(`企业微信菜单事件添加成功，事件ID: ${result.id}`);
      return responseUtil.success(res, '菜单事件添加成功', result);
    } catch (error) {
      logger.error('添加企业微信菜单事件失败:', error);
      return responseUtil.error(res, '菜单事件添加失败', 500);
    }
  }

  /**
   * 获取菜单事件列表
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async listMenuEvent(req, res) {
    try {
      const { page = 1, pageSize = 10, keyword = '' } = req.query;
      
      logger.info(`获取企业微信菜单事件列表，页码: ${page}，每页数量: ${pageSize}，关键词: ${keyword}`);
      
      // 查询菜单事件列表
      const result = await menuRepository.listMenuEvent({
        page,
        pageSize,
        keyword
      });
      
      logger.info(`获取企业微信菜单事件列表成功，总数: ${result.total}`);
      return responseUtil.success(res, '菜单事件列表获取成功', result);
    } catch (error) {
      logger.error('获取企业微信菜单事件列表失败:', error);
      return responseUtil.error(res, '菜单事件列表获取失败', 500);
    }
  }

  /**
   * 更新菜单事件
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async updateMenuEvent(req, res) {
    try {
      const { id } = req.params;
      const { name, key, type, action, description } = req.body;
      const operator = req.user?.username || 'admin';
      
      logger.info(`更新企业微信菜单事件，事件ID: ${id}，操作人: ${operator}`);
      
      // 检查事件是否存在
      const existingEvent = await menuRepository.getMenuEventById(id);
      if (!existingEvent) {
        return responseUtil.error(res, '菜单事件不存在', 404);
      }
      
      // 更新菜单事件
      const updateData = {
        name,
        key,
        type,
        action,
        description,
        updateBy: operator,
        updateTime: new Date()
      };
      
      const result = await menuRepository.updateMenuEvent(id, updateData);
      
      logger.info(`企业微信菜单事件更新成功，事件ID: ${id}`);
      return responseUtil.success(res, '菜单事件更新成功', result);
    } catch (error) {
      logger.error('更新企业微信菜单事件失败:', error);
      return responseUtil.error(res, '菜单事件更新失败', 500);
    }
  }

  /**
   * 删除菜单事件
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async deleteMenuEvent(req, res) {
    try {
      const { ids } = req.body;
      const operator = req.user?.username || 'admin';
      
      logger.info(`删除企业微信菜单事件，事件ID列表: ${ids.join(',')}，操作人: ${operator}`);
      
      // 删除菜单事件
      const result = await menuRepository.deleteMenuEvent(ids);
      
      logger.info(`企业微信菜单事件删除成功，删除数量: ${result}`);
      return responseUtil.success(res, '菜单事件删除成功', { deletedCount: result });
    } catch (error) {
      logger.error('删除企业微信菜单事件失败:', error);
      return responseUtil.error(res, '菜单事件删除失败', 500);
    }
  }

  /**
   * 同步菜单配置
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async syncMenu(req, res) {
    try {
      const operator = req.user?.username || 'admin';
      
      logger.info(`同步企业微信菜单配置，操作人: ${operator}`);
      
      // 从企业微信获取最新菜单配置
      const menuData = await wechatWorkUtil.getMenu();
      
      // 保存到本地数据库
      await menuRepository.saveSyncMenuData(menuData, operator);
      
      logger.info('企业微信菜单配置同步成功');
      return responseUtil.success(res, '菜单配置同步成功', menuData);
    } catch (error) {
      const errorInfo = wechatWorkUtil.handleError(error);
      logger.error('同步企业微信菜单配置失败:', errorInfo);
      return responseUtil.error(res, errorInfo.message, errorInfo.code);
    }
  }

  /**
   * 获取菜单操作日志
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async getMenuLogs(req, res) {
    try {
      const { page = 1, pageSize = 10, startDate, endDate } = req.query;
      
      logger.info(`获取企业微信菜单操作日志，页码: ${page}，每页数量: ${pageSize}`);
      
      // 查询操作日志
      const result = await menuRepository.getMenuLogs({
        page,
        pageSize,
        startDate,
        endDate
      });
      
      logger.info(`获取企业微信菜单操作日志成功，总数: ${result.total}`);
      return responseUtil.success(res, '菜单操作日志获取成功', result);
    } catch (error) {
      logger.error('获取企业微信菜单操作日志失败:', error);
      return responseUtil.error(res, '菜单操作日志获取失败', 500);
    }
  }
}

module.exports = new MenuController();