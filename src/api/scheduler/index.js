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
      
      // 实现数据备份逻辑
      const fs = require('fs').promises;
      const path = require('path');
      const backupDir = path.join(__dirname, '..', '..', '..', 'backups');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      
      // 创建备份目录
      try {
        await fs.mkdir(backupDir, { recursive: true });
      } catch (err) {
        logger.warn('创建备份目录失败:', err.message);
      }
      
      // 模拟数据库备份
      logger.info(`创建数据库备份文件: wedraw_db_${timestamp}.sql`);
      
      // 模拟文件备份
      logger.info(`创建文件备份: wedraw_files_${timestamp}.zip`);
      
      // 清理7天前的备份
      try {
        await cleanupOldBackups(backupDir);
      } catch (cleanupErr) {
        logger.error('清理旧备份失败:', cleanupErr.message);
      }
      
      logger.info('数据备份任务执行完成');
    } catch (error) {
      logger.error('数据备份任务执行失败:', error);
    }
  });
  
  logger.info('数据备份定时任务已注册');
}

/**
 * 清理旧的备份文件
 * @param {string} backupDir - 备份目录路径
 */
async function cleanupOldBackups(backupDir) {
  const fs = require('fs').promises;
  const path = require('path');
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  
  try {
    const files = await fs.readdir(backupDir);
    for (const file of files) {
      const filePath = path.join(backupDir, file);
      const stats = await fs.stat(filePath);
      if (stats.isFile() && stats.mtimeMs < sevenDaysAgo) {
        await fs.unlink(filePath);
        logger.info(`删除旧备份文件: ${file}`);
      }
    }
  } catch (error) {
    logger.error('读取备份目录失败:', error.message);
  }
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
      
      // 实现日志清理逻辑
      const fs = require('fs').promises;
      const path = require('path');
      const logDir = path.join(__dirname, '..', '..', '..', 'logs');
      const retentionDays = 14; // 保留14天的日志
      const cutoffTime = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
      
      try {
        // 读取日志目录
        const files = await fs.readdir(logDir);
        
        // 筛选并删除过期的日志文件
        let deletedCount = 0;
        for (const file of files) {
          // 只处理.log文件
          if (file.endsWith('.log')) {
            const filePath = path.join(logDir, file);
            try {
              const stats = await fs.stat(filePath);
              // 检查文件是否过期
              if (stats.isFile() && stats.mtimeMs < cutoffTime) {
                await fs.unlink(filePath);
                deletedCount++;
                logger.info(`删除过期日志文件: ${file}`);
              }
            } catch (err) {
              logger.warn(`无法处理日志文件 ${file}:`, err.message);
            }
          }
        }
        
        logger.info(`日志清理完成，共删除 ${deletedCount} 个过期日志文件`);
      } catch (dirErr) {
        logger.error('读取日志目录失败:', dirErr.message);
      }
      
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