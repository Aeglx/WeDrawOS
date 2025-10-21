/**
 * 定时任务模块
 * 用于管理系统的定时任务
 */

const logger = require('../core/utils/logger');
const di = require('../core/di/container');

// 导入任务调度器
const jobScheduler = require('./job/jobScheduler');

// 导入具体的任务类
const OrderAutoCloseJob = require('./order/orderAutoCloseJob');
const DataSyncJob = require('./sync/dataSyncJob');
const ReportGenerationJob = require('./report/reportGenerationJob');
const CacheRefreshJob = require('./cache/cacheRefreshJob');

/**
 * 初始化定时任务
 */
function initialize() {
  logger.info('初始化定时任务模块');
  
  // 初始化任务调度器
  jobScheduler.initialize();
  
  // 注册定时任务
  registerScheduledTasks();
  
  logger.info('定时任务模块初始化完成');
}

/**
 * 注册所有定时任务
 */
function registerScheduledTasks() {
  logger.info('开始注册定时任务');
  
  try {
    // 注册订单自动关闭任务
    const orderAutoCloseJob = new OrderAutoCloseJob();
    jobScheduler.addJob(orderAutoCloseJob);
    
    // 注册数据同步任务
    const dataSyncJob = new DataSyncJob();
    jobScheduler.addJob(dataSyncJob);
    
    // 注册统计报表生成任务
    const reportGenerationJob = new ReportGenerationJob();
    jobScheduler.addJob(reportGenerationJob);
    
    // 注册缓存刷新任务
    const cacheRefreshJob = new CacheRefreshJob();
    jobScheduler.addJob(cacheRefreshJob);
    
    // 注册数据备份任务
    scheduleBackupTask();
    
    // 注册日志清理任务
    scheduleLogCleanupTask();
    
    logger.info(`定时任务注册完成，共注册 ${jobScheduler.getJobCount()} 个任务`);
    
  } catch (error) {
    logger.error('注册定时任务失败:', error);
  }
}

/**
 * 数据备份任务
 */
function scheduleBackupTask() {
  // 每天凌晨1点执行
  const task = cron.schedule('0 1 * * *', async () => {
    try {
      logger.info('开始执行数据备份任务');
      
      // TODO: 实现数据备份逻辑
      // 例如：备份数据库、重要文件等
      
      logger.info('数据备份任务执行完成');
    } catch (error) {
      logger.error('数据备份任务执行失败:', error);
    }
  });
  
  logger.info('数据备份定时任务已注册');
}

/**
 * 缓存清理任务 (已移至CacheRefreshJob类)
 * 此处保留作为向后兼容的参考
 */

/**
 * 报表生成任务 (已移至ReportGenerationJob类)
 * 此处保留作为向后兼容的参考
 */

/**
 * 订单超时检查任务 (已移至OrderAutoCloseJob类)
 * 此处保留作为向后兼容的参考
 */

/**
 * 库存同步任务 (已移至DataSyncJob类)
 * 此处保留作为向后兼容的参考
 */

/**
 * 日志清理任务
 */
function scheduleLogCleanupTask() {
  // 每天凌晨2点执行
  const task = cron.schedule('0 2 * * *', async () => {
    try {
      logger.info('开始执行日志清理任务');
      
      // TODO: 实现日志清理逻辑
      // 例如：删除超过指定天数的日志文件
      
      logger.info('日志清理任务执行完成');
    } catch (error) {
      logger.error('日志清理任务执行失败:', error);
    }
  });
  
  logger.info('日志清理定时任务已注册');
}

/**
 * 停止所有定时任务
 */
function stop() {
  logger.info('停止定时任务模块');
  jobScheduler.stop();
  logger.info('定时任务模块已停止');
}

/**
 * 获取所有任务状态
 */
function getAllJobStatuses() {
  return jobScheduler.getAllJobStatuses();
}

/**
 * 立即执行指定任务
 */
async function executeJobImmediately(jobName) {
  return await jobScheduler.executeJobImmediately(jobName);
}

module.exports = {
  initialize,
  stop,
  getAllJobStatuses,
  executeJobImmediately,
  jobScheduler
};