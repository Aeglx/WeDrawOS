/**
 * 公众号账号管理控制器
 * 处理公众号账号信息配置的API请求
 */

const logger = require('../../../core/logger');
const accountService = require('../services/accountService');

/**
 * 公众号账号管理控制器类
 */
class AccountController {
  /**
   * 获取公众号账号信息
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express中间件回调函数
   */
  async getAccountInfo(req, res, next) {
    try {
      const accountInfo = await accountService.getAccountInfo();
      res.json({
        success: true,
        data: accountInfo
      });
    } catch (error) {
      logger.error('获取公众号账号信息失败:', error);
      next(error);
    }
  }

  /**
   * 更新公众号账号信息
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express中间件回调函数
   */
  async updateAccountInfo(req, res, next) {
    try {
      const accountData = req.body;
      const result = await accountService.updateAccountInfo(accountData);
      res.json({
        success: true,
        message: '公众号账号信息更新成功',
        data: result
      });
    } catch (error) {
      logger.error('更新公众号账号信息失败:', error);
      next(error);
    }
  }

  /**
   * 获取公众号基本信息（从微信服务器）
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express中间件回调函数
   */
  async syncAccountInfo(req, res, next) {
    try {
      const result = await accountService.syncAccountInfoFromWechat();
      res.json({
        success: true,
        message: '公众号信息同步成功',
        data: result
      });
    } catch (error) {
      logger.error('同步公众号信息失败:', error);
      next(error);
    }
  }

  /**
   * 刷新公众号访问令牌
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express中间件回调函数
   */
  async refreshAccessToken(req, res, next) {
    try {
      const tokenInfo = await accountService.refreshAccessToken();
      res.json({
        success: true,
        message: '访问令牌刷新成功',
        data: tokenInfo
      });
    } catch (error) {
      logger.error('刷新访问令牌失败:', error);
      next(error);
    }
  }

  /**
   * 配置服务器信息
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express中间件回调函数
   */
  async configureServer(req, res, next) {
    try {
      const serverConfig = req.body;
      const result = await accountService.configureServer(serverConfig);
      res.json({
        success: true,
        message: '服务器配置更新成功',
        data: result
      });
    } catch (error) {
      logger.error('配置服务器失败:', error);
      next(error);
    }
  }

  /**
   * 验证服务器配置
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express中间件回调函数
   */
  async verifyServer(req, res, next) {
    try {
      const verifyResult = await accountService.verifyServerConfig(req.query);
      if (verifyResult) {
        res.send(verifyResult.echostr);
      } else {
        res.status(403).send('验证失败');
      }
    } catch (error) {
      logger.error('验证服务器配置失败:', error);
      res.status(500).send('验证失败');
    }
  }

  /**
   * 获取自定义菜单配置
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express中间件回调函数
   */
  async getMenuConfig(req, res, next) {
    try {
      const menuConfig = await accountService.getMenuConfig();
      res.json({
        success: true,
        data: menuConfig
      });
    } catch (error) {
      logger.error('获取自定义菜单配置失败:', error);
      next(error);
    }
  }

  /**
   * 设置自定义菜单
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express中间件回调函数
   */
  async setMenu(req, res, next) {
    try {
      const menuData = req.body;
      const result = await accountService.setMenu(menuData);
      res.json({
        success: true,
        message: '自定义菜单设置成功',
        data: result
      });
    } catch (error) {
      logger.error('设置自定义菜单失败:', error);
      next(error);
    }
  }

  /**
   * 删除自定义菜单
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express中间件回调函数
   */
  async deleteMenu(req, res, next) {
    try {
      await accountService.deleteMenu();
      res.json({
        success: true,
        message: '自定义菜单删除成功'
      });
    } catch (error) {
      logger.error('删除自定义菜单失败:', error);
      next(error);
    }
  }
}

module.exports = new AccountController();