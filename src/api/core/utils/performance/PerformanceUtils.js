/**
 * 性能监控工具
 * 提供应用性能分析和监控功能
 */

const { performance } = require('perf_hooks');
const { EventEmitter } = require('events');
const { timerUtils } = require('../timer');
const { typeUtils } = require('../type');
const { logger } = require('../logger');
const { logContext } = require('../logger/LogContext');

/**
 * 性能指标类型枚举
 */
const MetricType = {
  TIMER: 'timer',           // 计时器指标
  COUNTER: 'counter',       // 计数器指标
  GAUGE: 'gauge',           // 仪表盘指标
  HISTOGRAM: 'histogram',   // 直方图指标
  METER: 'meter'            // 计量器指标
};

/**
 * 性能监控工具类
 * 提供性能指标收集、分析和报告功能
 */
class PerformanceUtils extends EventEmitter {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   */
  constructor(options = {}) {
    super();

    this.options = {
      autoReport: options.autoReport !== undefined ? options.autoReport : true,
      reportInterval: options.reportInterval || 60000, // 默认1分钟
      enableGcTracking: options.enableGcTracking || false,
      thresholds: options.thresholds || {},
      maxSamples: options.maxSamples || 1000,
      ...options
    };

    // 存储各种性能指标
    this.metrics = {
      timers: new Map(),       // 计时器
      counters: new Map(),     // 计数器
      gauges: new Map(),       // 仪表盘
      histograms: new Map(),   // 直方图
      meters: new Map()        // 计量器
    };

    // 存储采样数据
    this.samples = new Map();

    // 性能标记和测量
    this.marks = new Map();
    this.measurements = [];

    // 报告定时器
    this.reportTimer = null;

    // 初始化
    this.initialize();
  }

  /**
   * 初始化性能监控
   * @private
   */
  initialize() {
    // 设置最大监听器数量
    this.setMaxListeners(100);

    // 启用自动报告
    if (this.options.autoReport) {
      this.startAutoReport();
    }

    // 启用垃圾回收跟踪
    if (this.options.enableGcTracking && global.gc) {
      this.startGcTracking();
    }

    logger.debug('性能监控工具初始化完成', {
      autoReport: this.options.autoReport,
      reportInterval: this.options.reportInterval,
      enableGcTracking: this.options.enableGcTracking
    });
  }

  /**
   * 开始自动报告
   */
  startAutoReport() {
    if (this.reportTimer) {
      clearInterval(this.reportTimer);
    }

    this.reportTimer = setInterval(() => {
      this.generateReport().then(report => {
        this.emit('report', report);
      }).catch(error => {
        logger.error('生成性能报告失败', { error: error.message });
      });
    }, this.options.reportInterval);

    logger.debug('性能自动报告已启动', { interval: this.options.reportInterval });
  }

  /**
   * 停止自动报告
   */
  stopAutoReport() {
    if (this.reportTimer) {
      clearInterval(this.reportTimer);
      this.reportTimer = null;
      logger.debug('性能自动报告已停止');
    }
  }

  /**
   * 开始垃圾回收跟踪
   * @private
   */
  startGcTracking() {
    const originalGc = global.gc;
    
    global.gc = () => {
      const startTime = performance.now();
      const result = originalGc();
      const duration = performance.now() - startTime;
      
      // 记录GC信息
      this.incrementCounter('gc.count');
      this.recordTimer('gc.time', duration);
      
      this.emit('gc', { count: this.getCounter('gc.count'), time: duration });
      
      return result;
    };

    logger.debug('垃圾回收跟踪已启用');
  }

  /**
   * 创建性能标记
   * @param {string} name - 标记名称
   */
  mark(name) {
    const timestamp = performance.now();
    this.marks.set(name, timestamp);
    return timestamp;
  }

  /**
   * 测量两个标记之间的时间
   * @param {string} name - 测量名称
   * @param {string} startMark - 开始标记名称
   * @param {string} endMark - 结束标记名称
   * @returns {number|null} 测量的时间（毫秒）
   */
  measure(name, startMark, endMark) {
    const start = this.marks.get(startMark);
    const end = endMark ? this.marks.get(endMark) : performance.now();

    if (start === undefined) {
      logger.warn('开始标记不存在', { startMark });
      return null;
    }

    const duration = end - start;
    
    const measurement = {
      name,
      startMark,
      endMark,
      start,
      end,
      duration,
      timestamp: Date.now()
    };

    this.measurements.push(measurement);
    this.emit('measurement', measurement);

    // 记录到计时器指标
    this.recordTimer(name, duration);

    return duration;
  }

  /**
   * 清除性能标记
   * @param {string} name - 标记名称（可选，不提供则清除所有）
   */
  clearMarks(name) {
    if (name) {
      this.marks.delete(name);
    } else {
      this.marks.clear();
    }
  }

  /**
   * 清除性能测量
   * @param {string} name - 测量名称（可选，不提供则清除所有）
   */
  clearMeasurements(name) {
    if (name) {
      this.measurements = this.measurements.filter(m => m.name !== name);
    } else {
      this.measurements = [];
    }
  }

  /**
   * 记录计时器指标
   * @param {string} name - 指标名称
   * @param {number} value - 时间值（毫秒）
   */
  recordTimer(name, value) {
    if (!this.metrics.timers.has(name)) {
      this.metrics.timers.set(name, {
        count: 0,
        total: 0,
        min: Infinity,
        max: -Infinity,
        sumOfSquares: 0,
        lastValue: 0
      });
    }

    const timer = this.metrics.timers.get(name);
    timer.count++;
    timer.total += value;
    timer.min = Math.min(timer.min, value);
    timer.max = Math.max(timer.max, value);
    timer.sumOfSquares += value * value;
    timer.lastValue = value;

    // 检查阈值
    this.checkThreshold(name, MetricType.TIMER, value);

    // 存储样本
    this.storeSample(name, value);

    this.emit('timer', { name, value });
  }

  /**
   * 增加计数器指标
   * @param {string} name - 指标名称
   * @param {number} value - 增加值（默认1）
   */
  incrementCounter(name, value = 1) {
    if (!this.metrics.counters.has(name)) {
      this.metrics.counters.set(name, 0);
    }

    const current = this.metrics.counters.get(name);
    const newValue = current + value;
    this.metrics.counters.set(name, newValue);

    this.emit('counter', { name, value: newValue });
  }

  /**
   * 设置仪表盘指标
   * @param {string} name - 指标名称
   * @param {number} value - 指标值
   */
  setGauge(name, value) {
    this.metrics.gauges.set(name, value);

    // 检查阈值
    this.checkThreshold(name, MetricType.GAUGE, value);

    this.emit('gauge', { name, value });
  }

  /**
   * 记录直方图指标
   * @param {string} name - 指标名称
   * @param {number} value - 指标值
   */
  recordHistogram(name, value) {
    if (!this.metrics.histograms.has(name)) {
      this.metrics.histograms.set(name, {
        count: 0,
        values: [],
        min: Infinity,
        max: -Infinity,
        total: 0
      });
    }

    const histogram = this.metrics.histograms.get(name);
    histogram.count++;
    histogram.values.push(value);
    histogram.min = Math.min(histogram.min, value);
    histogram.max = Math.max(histogram.max, value);
    histogram.total += value;

    // 检查阈值
    this.checkThreshold(name, MetricType.HISTOGRAM, value);

    this.emit('histogram', { name, value });
  }

  /**
   * 记录计量器指标（速率）
   * @param {string} name - 指标名称
   * @param {number} value - 指标值（默认1）
   */
  markMeter(name, value = 1) {
    if (!this.metrics.meters.has(name)) {
      this.metrics.meters.set(name, {
        count: 0,
        startTime: Date.now(),
        lastMark: Date.now()
      });
    }

    const meter = this.metrics.meters.get(name);
    meter.count += value;
    meter.lastMark = Date.now();

    this.emit('meter', { name, count: meter.count });
  }

  /**
   * 获取计时器指标
   * @param {string} name - 指标名称
   * @returns {Object|null} 计时器统计信息
   */
  getTimer(name) {
    const timer = this.metrics.timers.get(name);
    if (!timer) return null;

    // 计算平均值和标准差
    const avg = timer.count > 0 ? timer.total / timer.count : 0;
    const variance = timer.count > 0 ? (timer.sumOfSquares / timer.count) - (avg * avg) : 0;
    const stdDev = Math.sqrt(variance);

    return {
      count: timer.count,
      total: timer.total,
      min: timer.min,
      max: timer.max,
      avg,
      stdDev,
      lastValue: timer.lastValue
    };
  }

  /**
   * 获取计数器指标
   * @param {string} name - 指标名称
   * @returns {number|null} 计数器值
   */
  getCounter(name) {
    return this.metrics.counters.get(name) || null;
  }

  /**
   * 获取仪表盘指标
   * @param {string} name - 指标名称
   * @returns {number|null} 仪表盘值
   */
  getGauge(name) {
    return this.metrics.gauges.get(name) || null;
  }

  /**
   * 获取直方图指标
   * @param {string} name - 指标名称
   * @returns {Object|null} 直方图统计信息
   */
  getHistogram(name) {
    const histogram = this.metrics.histograms.get(name);
    if (!histogram || histogram.values.length === 0) return null;

    // 排序以计算分位数
    const sorted = [...histogram.values].sort((a, b) => a - b);
    const avg = histogram.count > 0 ? histogram.total / histogram.count : 0;

    // 计算分位数
    const p50 = this.calculateQuantile(sorted, 0.5);
    const p75 = this.calculateQuantile(sorted, 0.75);
    const p95 = this.calculateQuantile(sorted, 0.95);
    const p99 = this.calculateQuantile(sorted, 0.99);

    return {
      count: histogram.count,
      min: histogram.min,
      max: histogram.max,
      avg,
      p50,
      p75,
      p95,
      p99
    };
  }

  /**
   * 获取计量器指标
   * @param {string} name - 指标名称
   * @returns {Object|null} 计量器统计信息
   */
  getMeter(name) {
    const meter = this.metrics.meters.get(name);
    if (!meter) return null;

    const elapsed = (Date.now() - meter.startTime) / 1000; // 秒
    const ratePerSecond = elapsed > 0 ? meter.count / elapsed : 0;

    return {
      count: meter.count,
      ratePerSecond
    };
  }

  /**
   * 计算分位数
   * @param {Array<number>} sortedValues - 已排序的值数组
   * @param {number} quantile - 分位数 (0-1)
   * @returns {number} 分位数值
   * @private
   */
  calculateQuantile(sortedValues, quantile) {
    if (sortedValues.length === 0) return 0;
    
    const index = Math.floor(quantile * sortedValues.length);
    return sortedValues[Math.min(index, sortedValues.length - 1)];
  }

  /**
   * 存储样本
   * @param {string} name - 样本名称
   * @param {number} value - 样本值
   * @private
   */
  storeSample(name, value) {
    if (!this.samples.has(name)) {
      this.samples.set(name, []);
    }

    const sampleList = this.samples.get(name);
    sampleList.push(value);

    // 限制样本数量
    if (sampleList.length > this.options.maxSamples) {
      sampleList.shift(); // 移除最旧的样本
    }
  }

  /**
   * 获取样本
   * @param {string} name - 样本名称
   * @param {number} limit - 限制数量
   * @returns {Array<number>} 样本数组
   */
  getSamples(name, limit = null) {
    const sampleList = this.samples.get(name) || [];
    
    if (limit && sampleList.length > limit) {
      return sampleList.slice(-limit);
    }
    
    return sampleList;
  }

  /**
   * 检查阈值
   * @param {string} name - 指标名称
   * @param {string} type - 指标类型
   * @param {number} value - 指标值
   * @private
   */
  checkThreshold(name, type, value) {
    const threshold = this.options.thresholds[name];
    if (!threshold) return;

    let alert = false;
    let message = '';

    if (threshold.max !== undefined && value > threshold.max) {
      alert = true;
      message = `${name} exceeded maximum threshold: ${value} > ${threshold.max}`;
    } else if (threshold.min !== undefined && value < threshold.min) {
      alert = true;
      message = `${name} below minimum threshold: ${value} < ${threshold.min}`;
    }

    if (alert) {
      logger.warn(`性能阈值警报: ${message}`, {
        name,
        type,
        value,
        threshold
      });
      this.emit('threshold.alert', { name, type, value, threshold, message });
    }
  }

  /**
   * 设置阈值
   * @param {string} name - 指标名称
   * @param {Object} threshold - 阈值配置
   */
  setThreshold(name, threshold) {
    this.options.thresholds[name] = threshold;
  }

  /**
   * 生成性能报告
   * @returns {Promise<Object>} 性能报告
   */
  async generateReport() {
    const report = {
      timestamp: Date.now(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      metrics: {
        timers: {},
        counters: {},
        gauges: {},
        histograms: {},
        meters: {}
      },
      measurements: this.measurements.slice(-100) // 只包含最近100个测量
    };

    // 收集所有指标
    this.metrics.timers.forEach((_, name) => {
      report.metrics.timers[name] = this.getTimer(name);
    });

    this.metrics.counters.forEach((value, name) => {
      report.metrics.counters[name] = value;
    });

    this.metrics.gauges.forEach((value, name) => {
      report.metrics.gauges[name] = value;
    });

    this.metrics.histograms.forEach((_, name) => {
      report.metrics.histograms[name] = this.getHistogram(name);
    });

    this.metrics.meters.forEach((_, name) => {
      report.metrics.meters[name] = this.getMeter(name);
    });

    return report;
  }

  /**
   * 导出性能数据
   * @returns {Object} 性能数据
   */
  exportData() {
    return {
      metrics: {
        timers: Object.fromEntries(this.metrics.timers),
        counters: Object.fromEntries(this.metrics.counters),
        gauges: Object.fromEntries(this.metrics.gauges),
        histograms: Object.fromEntries(this.metrics.histograms),
        meters: Object.fromEntries(this.metrics.meters)
      },
      measurements: this.measurements,
      samples: Object.fromEntries(this.samples)
    };
  }

  /**
   * 导入性能数据
   * @param {Object} data - 性能数据
   */
  importData(data) {
    if (data.metrics) {
      if (data.metrics.timers) {
        this.metrics.timers = new Map(Object.entries(data.metrics.timers));
      }
      if (data.metrics.counters) {
        this.metrics.counters = new Map(Object.entries(data.metrics.counters));
      }
      if (data.metrics.gauges) {
        this.metrics.gauges = new Map(Object.entries(data.metrics.gauges));
      }
      if (data.metrics.histograms) {
        this.metrics.histograms = new Map(Object.entries(data.metrics.histograms));
      }
      if (data.metrics.meters) {
        this.metrics.meters = new Map(Object.entries(data.metrics.meters));
      }
    }

    if (data.measurements) {
      this.measurements = data.measurements;
    }

    if (data.samples) {
      this.samples = new Map(Object.entries(data.samples));
    }
  }

  /**
   * 清除所有指标
   */
  clear() {
    this.metrics = {
      timers: new Map(),
      counters: new Map(),
      gauges: new Map(),
      histograms: new Map(),
      meters: new Map()
    };

    this.samples.clear();
    this.clearMarks();
    this.clearMeasurements();

    logger.debug('性能数据已清除');
  }

  /**
   * 创建性能监控中间件
   * @returns {Function} Express中间件
   */
  createExpressMiddleware() {
    return async (req, res, next) => {
      const startTime = performance.now();
      const route = `${req.method} ${req.path}`;

      // 记录请求开始
      this.incrementCounter('http.requests.total');
      this.incrementCounter(`http.requests.${req.method.toLowerCase()}`);

      try {
        await next();
      } catch (error) {
        // 记录错误
        this.incrementCounter('http.errors');
        throw error;
      } finally {
        // 计算请求处理时间
        const duration = performance.now() - startTime;
        
        // 记录响应时间
        this.recordTimer('http.response_time', duration);
        this.recordTimer(`http.response_time.${req.method.toLowerCase()}`, duration);

        // 记录状态码
        this.incrementCounter(`http.status.${res.statusCode}`);

        // 根据状态码分类
        const statusClass = Math.floor(res.statusCode / 100) * 100;
        this.incrementCounter(`http.status.${statusClass}xx`);

        // 检查慢请求
        if (duration > 1000) { // 1秒
          logger.warn('慢请求', {
            route,
            duration,
            statusCode: res.statusCode,
            requestId: logContext.getRequestId()
          });
        }
      }
    };
  }

  /**
   * 创建函数性能包装器
   * @param {Function} fn - 要包装的函数
   * @param {string} name - 指标名称
   * @returns {Function} 包装后的函数
   */
  wrapFunction(fn, name) {
    return async (...args) => {
      const startTime = performance.now();
      let result;
      let error;

      try {
        result = await fn(...args);
        return result;
      } catch (err) {
        error = err;
        throw err;
      } finally {
        const duration = performance.now() - startTime;
        this.recordTimer(name, duration);

        if (error) {
          this.incrementCounter(`${name}.errors`);
        } else {
          this.incrementCounter(`${name}.success`);
        }
      }
    };
  }

  /**
   * 监控代码块性能
   * @param {string} name - 指标名称
   * @param {Function} fn - 要执行的函数
   * @returns {Promise<*>} 函数执行结果
   */
  async monitor(name, fn) {
    const startTime = performance.now();
    let result;

    try {
      result = await fn();
      return result;
    } finally {
      const duration = performance.now() - startTime;
      this.recordTimer(name, duration);
    }
  }

  /**
   * 静态实例
   * @private
   */
  static _instance = null;

  /**
   * 获取单例实例
   * @returns {PerformanceUtils} 性能监控工具实例
   */
  static getInstance() {
    if (!PerformanceUtils._instance) {
      PerformanceUtils._instance = new PerformanceUtils();
    }
    return PerformanceUtils._instance;
  }

  /**
   * 创建新的性能监控工具实例
   * @returns {PerformanceUtils} 性能监控工具实例
   */
  static create() {
    return new PerformanceUtils();
  }
}

// 导出常量
module.exports.MetricType = MetricType;

// 创建默认实例
const defaultPerformanceUtils = PerformanceUtils.getInstance();

module.exports = {
  PerformanceUtils,
  performanceUtils: defaultPerformanceUtils
};