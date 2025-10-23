/**
 * 任务调度器
 * 统一管理和调度所有定时任务
 */
const cron = require('node-cron');
const logger = require('../../core/utils/logger');
const JobBase = require('./jobBase');

class JobScheduler {
  constructor() {
    this.jobs = new Map();
    this.isInitialized = false;
  }

  /**
   * 初始化调度器
   */
  initialize() {
    if (this.isInitialized) {
      logger.warn('任务调度器已经初始化');
      return;
    }

    logger.info('初始化任务调度器');
    this.isInitialized = true;
  }

  /**
   * 添加任务
   * @param {JobBase} job 任务实例
   */
  addJob(job) {
    if (!(job instanceof JobBase)) {
      throw new Error('任务必须是JobBase的实例');
    }

    const jobName = job.name;
    
    // 如果任务已存在，先停止它
    if (this.jobs.has(jobName)) {
      logger.warn(`任务 [${jobName}] 已存在，将替换它`);
      const oldJob = this.jobs.get(jobName);
      if (oldJob.cronTask) {
        oldJob.cronTask.stop();
      }
      this.jobs.delete(jobName);
    }

    // 创建cron任务
    const cronTask = cron.schedule(job.cronExpression, async () => {
      try {
        await job.execute();
      } catch (error) {
        logger.error(`调度任务 [${jobName}] 失败:`, error);
      }
    });

    // 保存任务和cronTask的关联
    job.cronTask = cronTask;
    this.jobs.set(jobName, job);

    logger.info(`任务 [${jobName}] 已添加到调度器，cron表达式: ${job.cronExpression}`);
  }

  /**
   * 移除任务
   * @param {string} jobName 任务名称
   */
  removeJob(jobName) {
    if (!this.jobs.has(jobName)) {
      logger.warn(`任务 [${jobName}] 不存在`);
      return;
    }

    const job = this.jobs.get(jobName);
    if (job.cronTask) {
      job.cronTask.stop();
    }
    
    this.jobs.delete(jobName);
    logger.info(`任务 [${jobName}] 已从调度器移除`);
  }

  /**
   * 暂停所有任务
   */
  pauseAllJobs() {
    logger.info('暂停所有任务');
    for (const [jobName, job] of this.jobs.entries()) {
      job.pause();
    }
  }

  /**
   * 恢复所有任务
   */
  resumeAllJobs() {
    logger.info('恢复所有任务');
    for (const [jobName, job] of this.jobs.entries()) {
      job.resume();
    }
  }

  /**
   * 立即执行指定任务
   * @param {string} jobName 任务名称
   */
  async executeJobImmediately(jobName) {
    if (!this.jobs.has(jobName)) {
      throw new Error(`任务 [${jobName}] 不存在`);
    }

    const job = this.jobs.get(jobName);
    logger.info(`立即执行任务 [${jobName}]`);
    await job.execute();
  }

  /**
   * 获取所有任务状态
   */
  getAllJobStatuses() {
    const statuses = [];
    for (const [jobName, job] of this.jobs.entries()) {
      statuses.push(job.getStatus());
    }
    return statuses;
  }

  /**
   * 获取指定任务状态
   * @param {string} jobName 任务名称
   */
  getJobStatus(jobName) {
    if (!this.jobs.has(jobName)) {
      return null;
    }
    return this.jobs.get(jobName).getStatus();
  }

  /**
   * 停止调度器
   */
  stop() {
    logger.info('停止任务调度器');
    this.pauseAllJobs();
    this.jobs.clear();
    this.isInitialized = false;
  }

  /**
   * 获取任务数量
   */
  getJobCount() {
    return this.jobs.size;
  }
}

// 创建单例实例
const jobScheduler = new JobScheduler();

module.exports = jobScheduler;