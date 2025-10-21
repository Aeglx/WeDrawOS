const { Controller } = require('../../../core');
const { inject } = require('../../../core/di');
const logger = require('../../../core/logger');

class LogController extends Controller {
  constructor() {
    super();
    inject(this, 'logService');
    this.logger = logger.getLogger('LogController');
  }

  /**
   * 获取系统日志列表
   * @param {Request} req - Express请求对象
   * @param {Response} res - Express响应对象
   */
  async getLogs(req, res) {
    try {
      const {
        page = 1,
        pageSize = 20,
        level = 'all',
        module = 'all',
        search = '',
        startTime = '',
        endTime = ''
      } = req.query;

      const logs = await this.logService.getLogs({
        page,
        pageSize,
        level,
        module,
        search,
        startTime,
        endTime
      });

      this.success(res, logs);
    } catch (error) {
      this.logger.error('获取系统日志列表失败:', error);
      this.error(res, error.message, 500);
    }
  }

  /**
   * 获取日志详情
   * @param {Request} req - Express请求对象
   * @param {Response} res - Express响应对象
   */
  async getLogDetail(req, res) {
    try {
      const { id } = req.params;
      const log = await this.logService.getLogDetail(id);
      this.success(res, log);
    } catch (error) {
      this.logger.error(`获取日志详情失败 [ID: ${req.params.id}]:`, error);
      this.error(res, error.message, 500);
    }
  }

  /**
   * 获取日志统计信息
   * @param {Request} req - Express请求对象
   * @param {Response} res - Express响应对象
   */
  async getLogStats(req, res) {
    try {
      const { timeRange = '24h' } = req.query;
      const stats = await this.logService.getLogStats(timeRange);
      this.success(res, stats);
    } catch (error) {
      this.logger.error('获取日志统计信息失败:', error);
      this.error(res, error.message, 500);
    }
  }

  /**
   * 导出日志数据
   * @param {Request} req - Express请求对象
   * @param {Response} res - Express响应对象
   */
  async exportLogs(req, res) {
    try {
      const {
        format = 'csv',
        level = 'all',
        module = 'all',
        startTime = '',
        endTime = ''
      } = req.query;

      const exportData = await this.logService.exportLogs({
        format,
        level,
        module,
        startTime,
        endTime
      });

      // 设置响应头
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="logs-${new Date().toISOString().split('T')[0]}.${format}"`);
      
      this.success(res, exportData);
    } catch (error) {
      this.logger.error('导出日志数据失败:', error);
      this.error(res, error.message, 500);
    }
  }

  /**
   * 获取日志模块列表
   * @param {Request} req - Express请求对象
   * @param {Response} res - Express响应对象
   */
  async getLogModules(req, res) {
    try {
      const modules = await this.logService.getLogModules();
      this.success(res, modules);
    } catch (error) {
      this.logger.error('获取日志模块列表失败:', error);
      this.error(res, error.message, 500);
    }
  }

  /**
   * 清理日志
   * @param {Request} req - Express请求对象
   * @param {Response} res - Express响应对象
   */
  async cleanLogs(req, res) {
    try {
      const { days } = req.body;
      await this.logService.cleanLogs(days);
      this.success(res, { message: '日志清理成功' });
    } catch (error) {
      this.logger.error('清理日志失败:', error);
      this.error(res, error.message, 500);
    }
  }

  /**
   * 获取用户操作日志
   * @param {Request} req - Express请求对象
   * @param {Response} res - Express响应对象
   */
  async getUserOperationLogs(req, res) {
    try {
      const {
        page = 1,
        pageSize = 20,
        userId = '',
        operationType = 'all',
        startTime = '',
        endTime = ''
      } = req.query;

      const logs = await this.logService.getUserOperationLogs({
        page,
        pageSize,
        userId,
        operationType,
        startTime,
        endTime
      });

      this.success(res, logs);
    } catch (error) {
      this.logger.error('获取用户操作日志失败:', error);
      this.error(res, error.message, 500);
    }
  }

  /**
   * 获取登录日志
   * @param {Request} req - Express请求对象
   * @param {Response} res - Express响应对象
   */
  async getLoginLogs(req, res) {
    try {
      const {
        page = 1,
        pageSize = 20,
        userId = '',
        status = 'all',
        startTime = '',
        endTime = ''
      } = req.query;

      const logs = await this.logService.getLoginLogs({
        page,
        pageSize,
        userId,
        status,
        startTime,
        endTime
      });

      this.success(res, logs);
    } catch (error) {
      this.logger.error('获取登录日志失败:', error);
      this.error(res, error.message, 500);
    }
  }
}

module.exports = LogController;