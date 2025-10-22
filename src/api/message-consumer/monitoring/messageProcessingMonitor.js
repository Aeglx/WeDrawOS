/**
 * 消息处理监控器
 * 用于监控和统计消息处理情况
 */

const logger = require('@core/utils/logger');
const { getInstance: getEnhancedMessageQueue } = require('../../common-api/message-queue/enhancedMessageQueue');

class MessageProcessingMonitor {
  constructor(options = {}) {
    this.options = {
      enabled: true,
      statsInterval: 60000, // 1分钟
      alertThreshold: 0.8, // 错误率超过80%触发警报
      dashboardRefreshInterval: 10000, // 10秒
      ...options
    };

    this.queue = getEnhancedMessageQueue();
    this.channelStats = new Map();
    this.errorTrend = [];
    this.lastAlertTime = 0;
    this.alertCooldown = 300000; // 5分钟警报冷却
    this.isMonitoring = false;
  }

  /**
   * 启动监控
   */
  async start() {
    if (!this.options.enabled || this.isMonitoring) {
      return;
    }

    logger.info('消息处理监控器启动');
    this.isMonitoring = true;

    // 初始化通道统计
    this._initializeChannelStats();

    // 设置统计收集间隔
    this.statsInterval = setInterval(() => {
      this._collectStats();
      this._checkAlerts();
    }, this.options.statsInterval);

    // 订阅死信消息
    await this.queue.subscribe('deadletter.message', this._handleDeadLetter.bind(this));

    logger.info('消息处理监控器启动完成');
  }

  /**
   * 停止监控
   */
  stop() {
    if (!this.isMonitoring) {
      return;
    }

    logger.info('消息处理监控器停止');
    this.isMonitoring = false;

    if (this.statsInterval) {
      clearInterval(this.statsInterval);
    }
  }

  /**
   * 记录消息处理开始
   * @param {string} channel - 消息通道
   * @param {string} messageId - 消息ID
   */
  recordProcessingStart(channel, messageId) {
    const stats = this._getOrCreateChannelStats(channel);
    stats.processing[messageId] = {
      startTime: Date.now(),
      status: 'processing'
    };
  }

  /**
   * 记录消息处理完成
   * @param {string} channel - 消息通道
   * @param {string} messageId - 消息ID
   * @param {boolean} success - 是否成功
   * @param {number} attempts - 尝试次数
   */
  recordProcessingComplete(channel, messageId, success, attempts = 1) {
    const stats = this._getOrCreateChannelStats(channel);
    const processingInfo = stats.processing[messageId];
    
    if (processingInfo) {
      const latency = Date.now() - processingInfo.startTime;
      
      if (success) {
        stats.successful++;
        stats.totalLatency += latency;
        stats.averageLatency = stats.successful > 0 ? stats.totalLatency / stats.successful : 0;
        
        // 记录延迟分布
        if (latency < 100) {
          stats.latencyDistribution.under100ms++;
        } else if (latency < 500) {
          stats.latencyDistribution.under500ms++;
        } else if (latency < 1000) {
          stats.latencyDistribution.under1s++;
        } else {
          stats.latencyDistribution.over1s++;
        }
        
        // 记录重试次数分布
        if (attempts <= 1) {
          stats.retryDistribution.firstAttempt++;
        } else if (attempts <= 2) {
          stats.retryDistribution.secondAttempt++;
        } else {
          stats.retryDistribution.multipleAttempts++;
        }
      } else {
        stats.failed++;
      }
      
      // 移除处理中的记录
      delete stats.processing[messageId];
    }
  }

  /**
   * 记录处理错误
   * @param {string} channel - 消息通道
   * @param {string} messageId - 消息ID
   * @param {Error} error - 错误对象
   */
  recordProcessingError(channel, messageId, error) {
    const stats = this._getOrCreateChannelStats(channel);
    
    // 记录错误类型统计
    const errorType = error.name || 'UnknownError';
    stats.errorTypes[errorType] = (stats.errorTypes[errorType] || 0) + 1;
    
    // 记录最近错误
    if (stats.recentErrors.length < 10) { // 只保留最近10个错误
      stats.recentErrors.push({
        timestamp: new Date().toISOString(),
        messageId,
        errorType,
        errorMessage: error.message,
        stack: error.stack
      });
    }
  }

  /**
   * 获取监控指标
   */
  getMetrics() {
    const metrics = {
      global: {},
      channels: {},
      alerts: []
    };

    let totalProcessed = 0;
    let totalFailed = 0;
    let totalSuccessful = 0;
    let totalLatency = 0;

    // 计算全局统计
    this.channelStats.forEach((stats, channel) => {
      const total = stats.successful + stats.failed;
      totalProcessed += total;
      totalFailed += stats.failed;
      totalSuccessful += stats.successful;
      totalLatency += stats.totalLatency;

      // 计算通道指标
      const errorRate = total > 0 ? stats.failed / total : 0;
      const successRate = total > 0 ? stats.successful / total : 0;
      
      metrics.channels[channel] = {
        processed: total,
        successful: stats.successful,
        failed: stats.failed,
        errorRate: Number(errorRate.toFixed(4)),
        successRate: Number(successRate.toFixed(4)),
        averageLatency: stats.successful > 0 ? Number(stats.averageLatency.toFixed(2)) : 0,
        processing: Object.keys(stats.processing).length,
        lastUpdated: stats.lastUpdated,
        errorTypes: stats.errorTypes,
        latencyDistribution: stats.latencyDistribution,
        retryDistribution: stats.retryDistribution,
        recentErrors: stats.recentErrors
      };
    });

    // 全局指标
    const globalErrorRate = totalProcessed > 0 ? totalFailed / totalProcessed : 0;
    const globalSuccessRate = totalProcessed > 0 ? totalSuccessful / totalProcessed : 0;
    const globalAvgLatency = totalSuccessful > 0 ? totalLatency / totalSuccessful : 0;

    metrics.global = {
      processed: totalProcessed,
      successful: totalSuccessful,
      failed: totalFailed,
      errorRate: Number(globalErrorRate.toFixed(4)),
      successRate: Number(globalSuccessRate.toFixed(4)),
      averageLatency: Number(globalAvgLatency.toFixed(2)),
      errorTrend: this.errorTrend.slice(-60), // 保留最近60个点（1小时）
      timestamp: new Date().toISOString()
    };

    return metrics;
  }

  /**
   * 导出报告
   */
  async exportReport(format = 'json') {
    const metrics = this.getMetrics();
    
    if (format === 'json') {
      return JSON.stringify(metrics, null, 2);
    } else if (format === 'csv') {
      // 生成CSV格式的通道统计
      let csv = 'channel,processed,successful,failed,errorRate,successRate,averageLatency,processing\n';
      
      Object.entries(metrics.channels).forEach(([channel, stats]) => {
        csv += `${channel},${stats.processed},${stats.successful},${stats.failed},${stats.errorRate},${stats.successRate},${stats.averageLatency},${stats.processing}\n`;
      });
      
      return csv;
    }
    
    return JSON.stringify(metrics, null, 2);
  }

  /**
   * 初始化通道统计
   * @private
   */
  _initializeChannelStats() {
    // 初始化主要的消息通道
    const channels = [
      'order.created', 'order.paid', 'order.canceled', 'order.shipped', 'order.completed',
      'product.created', 'product.updated', 'product.status_changed', 'product.inventory_changed', 'product.price_changed',
      'member.registered', 'member.level_changed', 'member.points_changed', 'member.birthday',
      'after_sales.created', 'after_sales.approved', 'after_sales.return_shipped', 'after_sales.refund_completed',
      'notification.send', 'notification.broadcast',
      'complaint.created', 'complaint.updated',
      'promotion.started', 'promotion.ended'
    ];

    channels.forEach(channel => {
      this._getOrCreateChannelStats(channel);
    });
  }

  /**
   * 获取或创建通道统计
   * @private
   */
  _getOrCreateChannelStats(channel) {
    if (!this.channelStats.has(channel)) {
      this.channelStats.set(channel, {
        successful: 0,
        failed: 0,
        totalLatency: 0,
        averageLatency: 0,
        processing: {}, // 正在处理的消息
        errorTypes: {},
        recentErrors: [],
        latencyDistribution: {
          under100ms: 0,
          under500ms: 0,
          under1s: 0,
          over1s: 0
        },
        retryDistribution: {
          firstAttempt: 0,
          secondAttempt: 0,
          multipleAttempts: 0
        },
        lastUpdated: new Date().toISOString()
      });
    }
    
    const stats = this.channelStats.get(channel);
    stats.lastUpdated = new Date().toISOString();
    
    return stats;
  }

  /**
   * 收集统计信息
   * @private
   */
  async _collectStats() {
    try {
      // 从增强消息队列获取基础统计
      const queueStats = await this.queue.getStats();
      
      // 更新错误趋势
      const now = Date.now();
      const errorRate = queueStats.stats.failed > 0 
        ? queueStats.stats.failed / (queueStats.stats.processed + queueStats.stats.failed)
        : 0;
      
      this.errorTrend.push({
        timestamp: now,
        errorRate: Number(errorRate.toFixed(4))
      });
      
      // 清理旧的趋势数据（保留24小时）
      const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);
      this.errorTrend = this.errorTrend.filter(point => point.timestamp > twentyFourHoursAgo);
      
    } catch (error) {
      logger.error('收集消息处理统计失败:', error);
    }
  }

  /**
   * 检查并触发警报
   * @private
   */
  _checkAlerts() {
    const metrics = this.getMetrics();
    const now = Date.now();
    
    // 检查全局错误率
    if (metrics.global.errorRate > this.options.alertThreshold && 
        (now - this.lastAlertTime) > this.alertCooldown) {
      
      this.lastAlertTime = now;
      logger.warn(`消息处理警报: 全局错误率 ${(metrics.global.errorRate * 100).toFixed(2)}% 超过阈值 ${(this.options.alertThreshold * 100)}%`);
      
      // 这里可以集成告警系统，如发送邮件、短信等
      this._sendAlert({
        type: 'GLOBAL_ERROR_RATE',
        message: `消息处理全局错误率过高: ${(metrics.global.errorRate * 100).toFixed(2)}%`,
        severity: 'HIGH',
        timestamp: new Date().toISOString(),
        details: {
          errorRate: metrics.global.errorRate,
          threshold: this.options.alertThreshold,
          processed: metrics.global.processed
        }
      });
    }
    
    // 检查单个通道错误率
    Object.entries(metrics.channels).forEach(([channel, stats]) => {
      if (stats.processed > 10 && // 至少有10条消息才检查
          stats.errorRate > this.options.alertThreshold &&
          (now - this.lastAlertTime) > this.alertCooldown) {
        
        this.lastAlertTime = now;
        logger.warn(`消息处理警报: 通道 ${channel} 错误率 ${(stats.errorRate * 100).toFixed(2)}% 超过阈值 ${(this.options.alertThreshold * 100)}%`);
        
        this._sendAlert({
          type: 'CHANNEL_ERROR_RATE',
          message: `通道 ${channel} 错误率过高: ${(stats.errorRate * 100).toFixed(2)}%`,
          severity: 'MEDIUM',
          timestamp: new Date().toISOString(),
          details: {
            channel,
            errorRate: stats.errorRate,
            failed: stats.failed,
            processed: stats.processed
          }
        });
      }
    });
  }

  /**
   * 发送警报
   * @private
   */
  async _sendAlert(alert) {
    try {
      // 这里可以集成告警系统
      // 例如发送到监控服务、短信、邮件等
      logger.error(`发送警报: ${alert.message}`, alert);
      
      // 可以通过缓存管理器发布告警事件
      const cacheManager = require('@core/cache/cacheManager');
      if (cacheManager && cacheManager.publish) {
        await cacheManager.publish('monitoring.alert', alert);
      }
    } catch (error) {
      logger.error('发送警报失败:', error);
    }
  }

  /**
   * 处理死信消息
   * @private
   */
  _handleDeadLetter(deadLetterMessage) {
    try {
      const stats = this._getOrCreateChannelStats(deadLetterMessage.channel);
      stats.deadLetterCount = (stats.deadLetterCount || 0) + 1;
      
      logger.warn(`死信消息监控: ${deadLetterMessage.channel} (ID: ${deadLetterMessage.id})`, {
        attempts: deadLetterMessage.attempts,
        error: deadLetterMessage.error
      });
    } catch (error) {
      logger.error('处理死信消息监控失败:', error);
    }
  }
}

// 导出单例
let instance = null;
function getInstance(options = {}) {
  if (!instance) {
    instance = new MessageProcessingMonitor(options);
  }
  return instance;
}

module.exports = {
  MessageProcessingMonitor,
  getInstance
};