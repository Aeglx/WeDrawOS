const { BaseRepository } = require('../../../core');
const logger = require('../../../core/logger');

class LogRepository extends BaseRepository {
  constructor() {
    super();
    this.logger = logger.getLogger('LogRepository');
    
    // 模拟数据存储
    this.logs = this._generateMockLogs();
    this.userOperationLogs = this._generateMockUserOperationLogs();
    this.loginLogs = this._generateMockLoginLogs();
  }

  /**
   * 获取系统日志列表
   * @param {Object} params - 查询参数
   * @returns {Promise<Object>} 日志列表数据
   */
  async getLogs({ page, pageSize, level, module, search, startTime, endTime }) {
    try {
      let filtered = [...this.logs];
      
      // 应用过滤条件
      if (level !== 'all') {
        filtered = filtered.filter(log => log.level === level);
      }
      
      if (module !== 'all') {
        filtered = filtered.filter(log => log.module === module);
      }
      
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter(log => 
          log.message.toLowerCase().includes(searchLower) || 
          log.module.toLowerCase().includes(searchLower) ||
          log.userId?.toLowerCase().includes(searchLower)
        );
      }
      
      if (startTime) {
        const start = new Date(startTime);
        filtered = filtered.filter(log => new Date(log.timestamp) >= start);
      }
      
      if (endTime) {
        const end = new Date(endTime);
        filtered = filtered.filter(log => new Date(log.timestamp) <= end);
      }
      
      // 按时间倒序排序
      filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      // 分页
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const paginated = filtered.slice(start, end);
      
      return {
        list: paginated,
        pagination: {
          total: filtered.length,
          page,
          pageSize,
          totalPages: Math.ceil(filtered.length / pageSize)
        }
      };
    } catch (error) {
      this.logger.error('获取系统日志列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取日志详情
   * @param {string} id - 日志ID
   * @returns {Promise<Object>} 日志详情
   */
  async getLogDetail(id) {
    try {
      const log = this.logs.find(l => l.id === id);
      if (!log) {
        throw new Error('日志不存在');
      }
      return log;
    } catch (error) {
      this.logger.error(`获取日志详情失败 [ID: ${id}]:`, error);
      throw error;
    }
  }

  /**
   * 获取日志统计信息
   * @param {string} timeRange - 时间范围
   * @returns {Promise<Object>} 日志统计数据
   */
  async getLogStats(timeRange) {
    try {
      const now = new Date();
      let startTime;
      
      // 根据时间范围设置起始时间
      switch (timeRange) {
        case '24h':
          startTime = new Date(now - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startTime = new Date(now - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startTime = new Date(now - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startTime = new Date(now - 24 * 60 * 60 * 1000);
      }
      
      // 过滤时间范围内的日志
      const filteredLogs = this.logs.filter(log => 
        new Date(log.timestamp) >= startTime
      );
      
      // 按级别统计
      const levelStats = {};
      filteredLogs.forEach(log => {
        levelStats[log.level] = (levelStats[log.level] || 0) + 1;
      });
      
      // 按模块统计
      const moduleStats = {};
      filteredLogs.forEach(log => {
        moduleStats[log.module] = (moduleStats[log.module] || 0) + 1;
      });
      
      // 转换为数组格式
      const modules = Object.entries(moduleStats)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // 取前10个模块
      
      return {
        totalCount: filteredLogs.length,
        levelStats,
        moduleStats: modules,
        errorCount: filteredLogs.filter(log => log.level === 'error').length,
        warningCount: filteredLogs.filter(log => log.level === 'warn').length
      };
    } catch (error) {
      this.logger.error('获取日志统计信息失败:', error);
      throw error;
    }
  }

  /**
   * 导出日志数据
   * @param {Object} params - 导出参数
   * @returns {Promise<string>} 导出的CSV数据
   */
  async exportLogs({ format, level, module, startTime, endTime }) {
    try {
      let filtered = [...this.logs];
      
      // 应用过滤条件
      if (level !== 'all') {
        filtered = filtered.filter(log => log.level === level);
      }
      
      if (module !== 'all') {
        filtered = filtered.filter(log => log.module === module);
      }
      
      if (startTime) {
        const start = new Date(startTime);
        filtered = filtered.filter(log => new Date(log.timestamp) >= start);
      }
      
      if (endTime) {
        const end = new Date(endTime);
        filtered = filtered.filter(log => new Date(log.timestamp) <= end);
      }
      
      // 按时间倒序排序
      filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      // 生成CSV格式
      const headers = ['时间戳', '级别', '模块', '用户ID', '消息', '详情'];
      const rows = filtered.map(log => [
        log.timestamp,
        log.level,
        log.module,
        log.userId || '',
        log.message,
        JSON.stringify(log.details || '')
      ]);
      
      // 组合CSV内容
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      
      return csvContent;
    } catch (error) {
      this.logger.error('导出日志数据失败:', error);
      throw error;
    }
  }

  /**
   * 获取日志模块列表
   * @returns {Promise<Array>} 日志模块列表
   */
  async getLogModules() {
    try {
      const modulesSet = new Set(this.logs.map(log => log.module));
      return Array.from(modulesSet).sort();
    } catch (error) {
      this.logger.error('获取日志模块列表失败:', error);
      throw error;
    }
  }

  /**
   * 清理日志
   * @param {number} days - 保留天数
   */
  async cleanLogs(days) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      // 过滤保留的日志
      this.logs = this.logs.filter(log => 
        new Date(log.timestamp) >= cutoffDate
      );
      
      this.userOperationLogs = this.userOperationLogs.filter(log => 
        new Date(log.timestamp) >= cutoffDate
      );
      
      this.loginLogs = this.loginLogs.filter(log => 
        new Date(log.timestamp) >= cutoffDate
      );
    } catch (error) {
      this.logger.error(`清理日志失败 [保留天数: ${days}]:`, error);
      throw error;
    }
  }

  /**
   * 获取用户操作日志
   * @param {Object} params - 查询参数
   * @returns {Promise<Object>} 用户操作日志列表
   */
  async getUserOperationLogs({ page, pageSize, userId, operationType, startTime, endTime }) {
    try {
      let filtered = [...this.userOperationLogs];
      
      // 应用过滤条件
      if (userId) {
        filtered = filtered.filter(log => log.userId === userId);
      }
      
      if (operationType !== 'all') {
        filtered = filtered.filter(log => log.operationType === operationType);
      }
      
      if (startTime) {
        const start = new Date(startTime);
        filtered = filtered.filter(log => new Date(log.timestamp) >= start);
      }
      
      if (endTime) {
        const end = new Date(endTime);
        filtered = filtered.filter(log => new Date(log.timestamp) <= end);
      }
      
      // 按时间倒序排序
      filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      // 分页
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const paginated = filtered.slice(start, end);
      
      return {
        list: paginated,
        pagination: {
          total: filtered.length,
          page,
          pageSize,
          totalPages: Math.ceil(filtered.length / pageSize)
        }
      };
    } catch (error) {
      this.logger.error('获取用户操作日志失败:', error);
      throw error;
    }
  }

  /**
   * 获取登录日志
   * @param {Object} params - 查询参数
   * @returns {Promise<Object>} 登录日志列表
   */
  async getLoginLogs({ page, pageSize, userId, status, startTime, endTime }) {
    try {
      let filtered = [...this.loginLogs];
      
      // 应用过滤条件
      if (userId) {
        filtered = filtered.filter(log => log.userId === userId);
      }
      
      if (status !== 'all') {
        filtered = filtered.filter(log => log.status === status);
      }
      
      if (startTime) {
        const start = new Date(startTime);
        filtered = filtered.filter(log => new Date(log.timestamp) >= start);
      }
      
      if (endTime) {
        const end = new Date(endTime);
        filtered = filtered.filter(log => new Date(log.timestamp) <= end);
      }
      
      // 按时间倒序排序
      filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      // 分页
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const paginated = filtered.slice(start, end);
      
      return {
        list: paginated,
        pagination: {
          total: filtered.length,
          page,
          pageSize,
          totalPages: Math.ceil(filtered.length / pageSize)
        }
      };
    } catch (error) {
      this.logger.error('获取登录日志失败:', error);
      throw error;
    }
  }

  // 辅助方法：生成模拟系统日志数据
  _generateMockLogs() {
    const now = new Date();
    const logs = [];
    const levels = ['debug', 'info', 'warn', 'error'];
    const modules = ['system', 'user', 'permission', 'statistics', 'operation', 'monitoring', 'api', 'database', 'cache'];
    const userIds = ['admin-1', 'admin-2', 'admin-3', 'user-1', 'user-2', null];
    
    for (let i = 1; i <= 200; i++) {
      const level = levels[i % levels.length];
      const module = modules[i % modules.length];
      const userId = userIds[i % userIds.length];
      const time = new Date(now - i * 30 * 60 * 1000); // 每30分钟一条
      
      logs.push({
        id: `log-${i}`,
        timestamp: time.toISOString(),
        level,
        module,
        userId,
        message: this._generateLogMessage(level, module),
        details: this._generateLogDetails(level, module)
      });
    }
    
    return logs;
  }

  // 辅助方法：生成模拟用户操作日志
  _generateMockUserOperationLogs() {
    const now = new Date();
    const logs = [];
    const operationTypes = ['create', 'update', 'delete', 'view', 'login', 'logout', 'export', 'import'];
    const userIds = ['admin-1', 'admin-2', 'admin-3', 'user-1', 'user-2'];
    const targetTypes = ['user', 'role', 'permission', 'product', 'order', 'category'];
    
    for (let i = 1; i <= 150; i++) {
      const operationType = operationTypes[i % operationTypes.length];
      const userId = userIds[i % userIds.length];
      const targetType = targetTypes[i % targetTypes.length];
      const targetId = `${targetType}-${i % 50 + 1}`;
      const time = new Date(now - i * 45 * 60 * 1000); // 每45分钟一条
      
      logs.push({
        id: `op-log-${i}`,
        timestamp: time.toISOString(),
        userId,
        operationType,
        targetType,
        targetId,
        ip: this._generateMockIp(),
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      });
    }
    
    return logs;
  }

  // 辅助方法：生成模拟登录日志
  _generateMockLoginLogs() {
    const now = new Date();
    const logs = [];
    const userIds = ['admin-1', 'admin-2', 'admin-3', 'user-1', 'user-2'];
    const statuses = ['success', 'failed'];
    
    for (let i = 1; i <= 100; i++) {
      const userId = userIds[i % userIds.length];
      const status = i % 10 === 0 ? 'failed' : 'success'; // 10%的失败率
      const time = new Date(now - i * 2 * 60 * 60 * 1000); // 每2小时一条
      
      logs.push({
        id: `login-log-${i}`,
        timestamp: time.toISOString(),
        userId,
        status,
        ip: this._generateMockIp(),
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        reason: status === 'failed' ? '密码错误' : null
      });
    }
    
    return logs;
  }

  // 辅助方法：生成日志消息
  _generateLogMessage(level, module) {
    const messages = {
      debug: [`${module}模块初始化完成`, `${module}缓存更新成功`],
      info: [`${module}模块正常运行`, `${module}数据同步完成`],
      warn: [`${module}模块性能下降`, `${module}资源使用接近阈值`],
      error: [`${module}模块发生错误`, `${module}服务不可用`]
    };
    
    const moduleMessages = messages[level] || messages.info;
    return moduleMessages[Math.floor(Math.random() * moduleMessages.length)];
  }

  // 辅助方法：生成日志详情
  _generateLogDetails(level, module) {
    if (level === 'error') {
      return {
        errorCode: Math.floor(Math.random() * 1000),
        stack: 'Error: 模拟错误\n    at Object.<anonymous> (file.js:10:15)\n    at Module._compile (internal/modules/cjs/loader.js:1063:30)'
      };
    }
    return {
      duration: Math.floor(Math.random() * 1000),
      memoryUsage: Math.floor(Math.random() * 100) + 10
    };
  }

  // 辅助方法：生成模拟IP地址
  _generateMockIp() {
    return `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
  }
}

module.exports = LogRepository;