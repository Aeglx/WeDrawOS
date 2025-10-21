/**
 * 任务基类
 * 提供统一的任务接口和错误处理
 */
const logger = require('../../core/utils/logger');

class JobBase {
  constructor(options = {}) {
    this.name = options.name || this.constructor.name;
    this.cronExpression = options.cronExpression || '* * * * *'; // 默认每分钟执行
    this.timeout = options.timeout || 300000; // 默认5分钟超时
    this.isRunning = false;
    this.lastRunTime = null;
    this.lastSuccessTime = null;
    this.consecutiveFailures = 0;
  }

  /**
   * 执行任务
   */
  async execute() {
    if (this.isRunning) {
      logger.warn(`任务 [${this.name}] 正在执行中，跳过本次调度`);
      return;
    }

    this.isRunning = true;
    this.lastRunTime = new Date();
    let timeoutId = null;

    try {
      logger.info(`开始执行任务: ${this.name}`);

      // 设置任务超时
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`任务 [${this.name}] 执行超时（${this.timeout}ms）`));
        }, this.timeout);
      });

      // 执行具体的任务逻辑
      const taskPromise = this.run();

      // 等待任务完成或超时
      await Promise.race([taskPromise, timeoutPromise]);

      this.lastSuccessTime = new Date();
      this.consecutiveFailures = 0;
      logger.info(`任务 [${this.name}] 执行成功`);
    } catch (error) {
      this.consecutiveFailures++;
      logger.error(`任务 [${this.name}] 执行失败:`, error);
      logger.error(`连续失败次数: ${this.consecutiveFailures}`);
      
      // 处理连续失败的情况
      if (this.consecutiveFailures >= 5) {
        logger.error(`任务 [${this.name}] 连续失败5次，发送警报`);
        // TODO: 这里可以添加告警逻辑，如发送邮件或短信
      }
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      this.isRunning = false;
    }
  }

  /**
   * 具体的任务逻辑，由子类实现
   * @abstract
   */
  async run() {
    throw new Error('子类必须实现run方法');
  }

  /**
   * 获取任务状态
   */
  getStatus() {
    return {
      name: this.name,
      isRunning: this.isRunning,
      lastRunTime: this.lastRunTime,
      lastSuccessTime: this.lastSuccessTime,
      consecutiveFailures: this.consecutiveFailures,
      cronExpression: this.cronExpression
    };
  }

  /**
   * 暂停任务
   */
  pause() {
    logger.info(`暂停任务: ${this.name}`);
    if (this.cronTask) {
      this.cronTask.stop();
    }
  }

  /**
   * 恢复任务
   */
  resume() {
    logger.info(`恢复任务: ${this.name}`);
    if (this.cronTask) {
      this.cronTask.start();
    }
  }
}

module.exports = JobBase;