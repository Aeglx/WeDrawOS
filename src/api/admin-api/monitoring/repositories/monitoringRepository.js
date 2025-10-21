const { BaseRepository } = require('../../../core');
const logger = require('../../../core/logger');

class MonitoringRepository extends BaseRepository {
  constructor() {
    super();
    this.logger = logger.getLogger('MonitoringRepository');
    
    // 模拟数据存储
    this.systemMetrics = this._generateMockSystemMetrics();
    this.apiStats = this._generateMockApiStats();
    this.alerts = this._generateMockAlerts();
    this.alertConfigs = this._generateMockAlertConfigs();
    this.dbMetrics = this._generateMockDatabaseMetrics();
  }

  /**
   * 获取系统监控概览
   * @returns {Promise<Object>} 系统监控概览数据
   */
  async getSystemOverview() {
    try {
      const cpuUsage = this.systemMetrics.cpu.reduce((sum, cpu) => sum + cpu.usagePercent, 0) / this.systemMetrics.cpu.length;
      
      return {
        status: 'normal',
        uptime: this.systemMetrics.uptime,
        cpuUsage: Math.round(cpuUsage * 100) / 100,
        memoryUsage: this.systemMetrics.memory.usagePercent,
        diskUsage: this.systemMetrics.disk.usagePercent,
        activeUsers: Math.floor(Math.random() * 1000) + 500,
        apiRequests: this.apiStats.totalRequests,
        errorRate: this.apiStats.errorRate,
        alertCount: this.alerts.filter(alert => alert.status === 'active').length
      };
    } catch (error) {
      this.logger.error('获取系统监控概览失败:', error);
      throw error;
    }
  }

  /**
   * 获取系统资源使用情况
   * @param {string} timeRange - 时间范围
   * @returns {Promise<Object>} 资源使用情况数据
   */
  async getResourceUsage(timeRange) {
    try {
      // 根据时间范围生成不同的数据点
      const points = this._getTimePoints(timeRange);
      
      return {
        cpuUsage: this._generateTimeSeriesData(points, 10, 80),
        memoryUsage: this._generateTimeSeriesData(points, 30, 90),
        diskIO: this._generateTimeSeriesData(points, 100, 1000),
        networkIO: this._generateTimeSeriesData(points, 50, 500)
      };
    } catch (error) {
      this.logger.error('获取系统资源使用情况失败:', error);
      throw error;
    }
  }

  /**
   * 获取API调用统计
   * @param {string} timeRange - 时间范围
   * @returns {Promise<Object>} API调用统计数据
   */
  async getApiStats(timeRange) {
    try {
      const points = this._getTimePoints(timeRange);
      
      return {
        totalRequests: this.apiStats.totalRequests,
        requestTrend: this._generateTimeSeriesData(points, 100, 1000),
        successCount: this.apiStats.successCount,
        errorCount: this.apiStats.errorCount,
        errorRate: this.apiStats.errorRate,
        topEndpoints: this.apiStats.topEndpoints,
        avgResponseTime: this.apiStats.avgResponseTime
      };
    } catch (error) {
      this.logger.error('获取API调用统计失败:', error);
      throw error;
    }
  }

  /**
   * 获取告警列表
   * @param {Object} params - 查询参数
   * @returns {Promise<Object>} 告警列表数据
   */
  async getAlerts({ status, page, pageSize }) {
    try {
      let filtered = [...this.alerts];
      
      if (status !== 'all') {
        filtered = filtered.filter(alert => alert.status === status);
      }
      
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
      this.logger.error('获取告警列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取告警详情
   * @param {string} id - 告警ID
   * @returns {Promise<Object>} 告警详情
   */
  async getAlertDetail(id) {
    try {
      const alert = this.alerts.find(a => a.id === id);
      if (!alert) {
        throw new Error('告警不存在');
      }
      return alert;
    } catch (error) {
      this.logger.error(`获取告警详情失败 [ID: ${id}]:`, error);
      throw error;
    }
  }

  /**
   * 处理告警
   * @param {string} id - 告警ID
   * @param {Object} data - 处理数据
   */
  async handleAlert(id, data) {
    try {
      const index = this.alerts.findIndex(a => a.id === id);
      if (index === -1) {
        throw new Error('告警不存在');
      }
      
      this.alerts[index] = {
        ...this.alerts[index],
        ...data,
        status: 'handled'
      };
    } catch (error) {
      this.logger.error(`处理告警失败 [ID: ${id}]:`, error);
      throw error;
    }
  }

  /**
   * 获取告警配置列表
   * @returns {Promise<Array>} 告警配置列表
   */
  async getAlertConfigs() {
    try {
      return this.alertConfigs;
    } catch (error) {
      this.logger.error('获取告警配置列表失败:', error);
      throw error;
    }
  }

  /**
   * 更新告警配置
   * @param {string} id - 配置ID
   * @param {Object} configData - 配置数据
   */
  async updateAlertConfig(id, configData) {
    try {
      const index = this.alertConfigs.findIndex(c => c.id === id);
      if (index === -1) {
        throw new Error('告警配置不存在');
      }
      
      this.alertConfigs[index] = {
        ...this.alertConfigs[index],
        ...configData,
        updatedAt: new Date()
      };
    } catch (error) {
      this.logger.error(`更新告警配置失败 [ID: ${id}]:`, error);
      throw error;
    }
  }

  /**
   * 获取数据库性能监控
   * @param {string} timeRange - 时间范围
   * @returns {Promise<Object>} 数据库性能数据
   */
  async getDatabaseMetrics(timeRange) {
    try {
      const points = this._getTimePoints(timeRange);
      
      return {
        connections: this.dbMetrics.connections,
        queryCount: this._generateTimeSeriesData(points, 500, 5000),
        slowQueryCount: this._generateTimeSeriesData(points, 10, 100),
        avgQueryTime: this._generateTimeSeriesData(points, 10, 200),
        transactionCount: this._generateTimeSeriesData(points, 100, 1000)
      };
    } catch (error) {
      this.logger.error('获取数据库性能监控失败:', error);
      throw error;
    }
  }

  /**
   * 获取错误率趋势
   * @param {string} timeRange - 时间范围
   * @returns {Promise<Object>} 错误率趋势数据
   */
  async getErrorRateTrend(timeRange) {
    try {
      const points = this._getTimePoints(timeRange);
      
      return {
        errorRateTrend: this._generateTimeSeriesData(points, 0.1, 10),
        errorByType: this.apiStats.errorsByType,
        errorByEndpoint: this.apiStats.errorsByEndpoint
      };
    } catch (error) {
      this.logger.error('获取错误率趋势失败:', error);
      throw error;
    }
  }

  // 辅助方法：生成模拟系统指标数据
  _generateMockSystemMetrics() {
    return {
      uptime: '7d 12h 30m',
      cpu: [
        { usagePercent: 25.5, model: 'CPU 0' },
        { usagePercent: 30.2, model: 'CPU 1' },
        { usagePercent: 22.8, model: 'CPU 2' },
        { usagePercent: 28.1, model: 'CPU 3' }
      ],
      memory: {
        total: 16 * 1024 * 1024 * 1024,
        used: 8.5 * 1024 * 1024 * 1024,
        usagePercent: 53.1
      },
      disk: {
        total: 1000 * 1024 * 1024 * 1024,
        used: 450 * 1024 * 1024 * 1024,
        usagePercent: 45.0
      }
    };
  }

  // 辅助方法：生成模拟API统计数据
  _generateMockApiStats() {
    return {
      totalRequests: 125000,
      successCount: 118750,
      errorCount: 6250,
      errorRate: 5.0,
      avgResponseTime: 120,
      topEndpoints: [
        { endpoint: '/api/products', requests: 25000 },
        { endpoint: '/api/users', requests: 20000 },
        { endpoint: '/api/orders', requests: 18000 },
        { endpoint: '/api/categories', requests: 15000 },
        { endpoint: '/api/payments', requests: 12000 }
      ],
      errorsByType: [
        { type: '404 Not Found', count: 2500 },
        { type: '500 Internal Server Error', count: 1800 },
        { type: '401 Unauthorized', count: 1200 },
        { type: '403 Forbidden', count: 750 }
      ],
      errorsByEndpoint: [
        { endpoint: '/api/products/:id', count: 1200 },
        { endpoint: '/api/users/:id', count: 800 },
        { endpoint: '/api/orders', count: 600 }
      ]
    };
  }

  // 辅助方法：生成模拟告警数据
  _generateMockAlerts() {
    const now = new Date();
    const alerts = [];
    
    for (let i = 1; i <= 25; i++) {
      const status = i % 3 === 0 ? 'handled' : 'active';
      const level = i % 4 === 0 ? 'critical' : (i % 4 === 1 ? 'warning' : 'info');
      const time = new Date(now - i * 60 * 60 * 1000);
      
      alerts.push({
        id: `alert-${i}`,
        title: `系统${level}告警 #${i}`,
        level,
        status,
        source: ['CPU', 'Memory', 'Disk', 'Database', 'API'][i % 5],
        message: `检测到${level}级异常，需要立即处理。`,
        createdAt: time,
        handledAt: status === 'handled' ? new Date(time.getTime() + 30 * 60 * 1000) : null,
        handler: status === 'handled' ? `admin-${i % 3 + 1}` : null,
        remark: status === 'handled' ? '问题已解决' : null
      });
    }
    
    return alerts;
  }

  // 辅助方法：生成模拟告警配置
  _generateMockAlertConfigs() {
    return [
      {
        id: 'config-1',
        name: 'CPU使用率告警',
        type: 'cpu_usage',
        threshold: 80,
        duration: 5,
        enabled: true,
        notificationChannels: ['email', 'sms'],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        id: 'config-2',
        name: '内存使用率告警',
        type: 'memory_usage',
        threshold: 90,
        duration: 5,
        enabled: true,
        notificationChannels: ['email'],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        id: 'config-3',
        name: '磁盘使用率告警',
        type: 'disk_usage',
        threshold: 95,
        duration: 5,
        enabled: true,
        notificationChannels: ['email', 'sms'],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        id: 'config-4',
        name: 'API错误率告警',
        type: 'api_error_rate',
        threshold: 10,
        duration: 1,
        enabled: true,
        notificationChannels: ['email', 'sms'],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        id: 'config-5',
        name: '慢查询告警',
        type: 'slow_query',
        threshold: 50,
        duration: 1,
        enabled: true,
        notificationChannels: ['email'],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      }
    ];
  }

  // 辅助方法：生成模拟数据库指标
  _generateMockDatabaseMetrics() {
    return {
      connections: {
        total: 150,
        active: 45,
        max: 200
      }
    };
  }

  // 辅助方法：获取时间点数组
  _getTimePoints(timeRange) {
    const points = [];
    const now = new Date();
    let interval = 60 * 1000; // 1分钟
    let count = 12;
    
    if (timeRange === '24h') {
      interval = 60 * 60 * 1000; // 1小时
      count = 24;
    } else if (timeRange === '7d') {
      interval = 24 * 60 * 60 * 1000; // 1天
      count = 7;
    }
    
    for (let i = count - 1; i >= 0; i--) {
      points.push(new Date(now - i * interval));
    }
    
    return points;
  }

  // 辅助方法：生成时间序列数据
  _generateTimeSeriesData(points, min, max) {
    return points.map(point => ({
      timestamp: point.toISOString(),
      value: Math.round((Math.random() * (max - min) + min) * 100) / 100
    }));
  }
}

module.exports = MonitoringRepository;