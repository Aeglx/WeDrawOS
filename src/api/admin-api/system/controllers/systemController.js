/**
 * 系统设置控制器
 * 处理系统配置相关的HTTP请求
 */

const di = require('../../../core/di/container');
const systemService = di.resolve('systemService');
const logger = di.resolve('logger');

class SystemController {
  /**
   * 获取系统配置
   * @param {Object} req - HTTP请求对象
   * @param {Object} res - HTTP响应对象
   * @param {Function} next - 下一个中间件
   */
  async getSystemConfig(req, res, next) {
    try {
      logger.info('获取系统配置请求');
      
      const config = await systemService.getSystemConfig();
      
      res.json({
        success: true,
        message: '获取系统配置成功',
        data: config
      });
    } catch (error) {
      logger.error('获取系统配置失败', { error: error.message, stack: error.stack });
      next(error);
    }
  }
  
  /**
   * 更新系统配置
   * @param {Object} req - HTTP请求对象
   * @param {Object} res - HTTP响应对象
   * @param {Function} next - 下一个中间件
   */
  async updateSystemConfig(req, res, next) {
    try {
      const configData = req.body;
      logger.info('更新系统配置请求', { configData });
      
      const updatedConfig = await systemService.updateSystemConfig(configData);
      
      res.json({
        success: true,
        message: '系统配置更新成功',
        data: updatedConfig
      });
    } catch (error) {
      logger.error('更新系统配置失败', { error: error.message, stack: error.stack });
      next(error);
    }
  }
  
  /**
   * 获取系统日志
   * @param {Object} req - HTTP请求对象
   * @param {Object} res - HTTP响应对象
   * @param {Function} next - 下一个中间件
   */
  async getSystemLogs(req, res, next) {
    try {
      const { page = 1, limit = 20, level, date } = req.query;
      logger.info('获取系统日志请求', { page, limit, level, date });
      
      const logs = await systemService.getSystemLogs({
        page: parseInt(page),
        limit: parseInt(limit),
        level,
        date
      });
      
      res.json({
        success: true,
        message: '获取系统日志成功',
        data: logs
      });
    } catch (error) {
      logger.error('获取系统日志失败', { error: error.message, stack: error.stack });
      next(error);
    }
  }
  
  /**
   * 获取系统信息
   * @param {Object} req - HTTP请求对象
   * @param {Object} res - HTTP响应对象
   * @param {Function} next - 下一个中间件
   */
  async getSystemInfo(req, res, next) {
    try {
      logger.info('获取系统信息请求');
      
      const systemInfo = await systemService.getSystemInfo();
      
      res.json({
        success: true,
        message: '获取系统信息成功',
        data: systemInfo
      });
    } catch (error) {
      logger.error('获取系统信息失败', { error: error.message, stack: error.stack });
      next(error);
    }
  }
  
  /**
   * 清除系统缓存
   * @param {Object} req - HTTP请求对象
   * @param {Object} res - HTTP响应对象
   * @param {Function} next - 下一个中间件
   */
  async clearSystemCache(req, res, next) {
    try {
      logger.info('清除系统缓存请求');
      
      const result = await systemService.clearSystemCache();
      
      res.json({
        success: true,
        message: '系统缓存清除成功',
        data: result
      });
    } catch (error) {
      logger.error('清除系统缓存失败', { error: error.message, stack: error.stack });
      next(error);
    }
  }
  
  /**
   * 备份系统数据
   * @param {Object} req - HTTP请求对象
   * @param {Object} res - HTTP响应对象
   * @param {Function} next - 下一个中间件
   */
  async backupSystemData(req, res, next) {
    try {
      logger.info('备份系统数据请求');
      
      const backupResult = await systemService.backupSystemData();
      
      res.json({
        success: true,
        message: '系统数据备份成功',
        data: backupResult
      });
    } catch (error) {
      logger.error('备份系统数据失败', { error: error.message, stack: error.stack });
      next(error);
    }
  }
  
  /**
   * 上传系统Logo
   * @param {Object} req - HTTP请求对象
   * @param {Object} res - HTTP响应对象
   * @param {Function} next - 下一个中间件
   */
  async uploadSystemLogo(req, res, next) {
    try {
      logger.info('上传系统Logo请求');
      
      if (!req.file) {
        throw new Error('请选择要上传的文件');
      }
      
      const logoUrl = await systemService.uploadSystemLogo(req.file);
      
      res.json({
        success: true,
        message: '系统Logo上传成功',
        data: { logoUrl }
      });
    } catch (error) {
      logger.error('上传系统Logo失败', { error: error.message, stack: error.stack });
      next(error);
    }
  }
}

module.exports = new SystemController();