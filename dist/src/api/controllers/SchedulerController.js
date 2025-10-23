/**
 * 定时任务监控控制器
 * 提供定时任务状态查询和管理功能
 */

const logger = require('../core/utils/logger');
const scheduler = require('../scheduler');

class SchedulerController {
  /**
   * 获取所有定时任务状态
   */
  static async getJobStatuses(req, res) {
    try {
      const jobStatuses = scheduler.getAllJobStatuses();
      
      return res.status(200).json({
        success: true,
        data: {
          jobs: jobStatuses,
          total: jobStatuses.length,
          timestamp: new Date().toISOString()
        },
        message: '定时任务状态获取成功'
      });
    } catch (error) {
      logger.error('获取定时任务状态失败:', error);
      return res.status(500).json({
        success: false,
        data: null,
        message: '获取定时任务状态失败: ' + error.message
      });
    }
  }

  /**
   * 立即执行指定任务
   */
  static async executeJob(req, res) {
    try {
      const { jobName } = req.params;
      
      if (!jobName) {
        return res.status(400).json({
          success: false,
          data: null,
          message: '任务名称不能为空'
        });
      }
      
      // 立即执行任务
      await scheduler.executeJobImmediately(jobName);
      
      return res.status(200).json({
        success: true,
        data: {
          jobName,
          status: 'executing',
          timestamp: new Date().toISOString()
        },
        message: `任务 ${jobName} 已开始执行`
      });
    } catch (error) {
      logger.error(`立即执行任务失败: ${req.params.jobName}`, error);
      return res.status(500).json({
        success: false,
        data: null,
        message: '执行任务失败: ' + error.message
      });
    }
  }

  /**
   * 获取定时任务统计信息
   */
  static async getJobStatistics(req, res) {
    try {
      const jobStatuses = scheduler.getAllJobStatuses();
      
      // 统计任务执行情况
      const stats = {
        totalJobs: jobStatuses.length,
        runningJobs: jobStatuses.filter(job => job.isRunning).length,
        successfulJobs: jobStatuses.filter(job => job.lastSuccessTime).length,
        failedJobs: jobStatuses.filter(job => job.consecutiveFailures > 0).length,
        jobsNeedingAttention: jobStatuses.filter(job => job.consecutiveFailures >= 3).length
      };
      
      // 获取最近执行的任务
      const recentlyExecuted = jobStatuses
        .filter(job => job.lastRunTime)
        .sort((a, b) => new Date(b.lastRunTime) - new Date(a.lastRunTime))
        .slice(0, 5);
      
      return res.status(200).json({
        success: true,
        data: {
          statistics: stats,
          recentlyExecuted: recentlyExecuted.map(job => ({
            name: job.name,
            lastRunTime: job.lastRunTime,
            lastSuccessTime: job.lastSuccessTime,
            consecutiveFailures: job.consecutiveFailures
          })),
          timestamp: new Date().toISOString()
        },
        message: '定时任务统计信息获取成功'
      });
    } catch (error) {
      logger.error('获取定时任务统计信息失败:', error);
      return res.status(500).json({
        success: false,
        data: null,
        message: '获取统计信息失败: ' + error.message
      });
    }
  }

  /**
   * 获取任务执行历史记录
   */
  static async getJobHistory(req, res) {
    try {
      const { jobName } = req.params;
      
      if (!jobName) {
        return res.status(400).json({
          success: false,
          data: null,
          message: '任务名称不能为空'
        });
      }
      
      // 这里应该从数据库或日志中获取历史记录
      // 暂时返回基于内存的基本信息
      const jobStatus = scheduler.getAllJobStatuses().find(job => job.name === jobName);
      
      if (!jobStatus) {
        return res.status(404).json({
          success: false,
          data: null,
          message: `任务 ${jobName} 不存在`
        });
      }
      
      // 模拟历史记录
      const history = {
        jobName: jobStatus.name,
        currentStatus: {
          isRunning: jobStatus.isRunning,
          lastRunTime: jobStatus.lastRunTime,
          lastSuccessTime: jobStatus.lastSuccessTime,
          consecutiveFailures: jobStatus.consecutiveFailures,
          cronExpression: jobStatus.cronExpression
        },
        // 实际应用中，这里应该返回数据库中的历史记录
        recentExecutions: [
          {
            timestamp: jobStatus.lastSuccessTime,
            status: 'success',
            duration: Math.floor(Math.random() * 10000) // 模拟执行时间
          }
        ],
        executionCount: {
          today: Math.floor(Math.random() * 50),
          thisWeek: Math.floor(Math.random() * 300),
          thisMonth: Math.floor(Math.random() * 1000)
        }
      };
      
      return res.status(200).json({
        success: true,
        data: history,
        message: `任务 ${jobName} 历史记录获取成功`
      });
    } catch (error) {
      logger.error(`获取任务历史记录失败: ${req.params.jobName}`, error);
      return res.status(500).json({
        success: false,
        data: null,
        message: '获取历史记录失败: ' + error.message
      });
    }
  }

  /**
   * 获取定时任务健康检查
   */
  static async healthCheck(req, res) {
    try {
      const jobStatuses = scheduler.getAllJobStatuses();
      const currentTime = new Date();
      
      // 检查是否有任务长时间未成功执行
      const unhealthyJobs = jobStatuses.filter(job => {
        if (!job.lastSuccessTime) return true;
        
        const hoursSinceLastSuccess = (currentTime - new Date(job.lastSuccessTime)) / (1000 * 60 * 60);
        return hoursSinceLastSuccess > 24; // 24小时未成功执行
      });
      
      const healthStatus = unhealthyJobs.length === 0 ? 'healthy' : 'unhealthy';
      
      return res.status(200).json({
        success: true,
        data: {
          status: healthStatus,
          totalJobs: jobStatuses.length,
          unhealthyJobs: unhealthyJobs.map(job => job.name),
          timestamp: currentTime.toISOString()
        },
        message: `定时任务系统${healthStatus === 'healthy' ? '运行正常' : '存在异常任务'}`
      });
    } catch (error) {
      logger.error('定时任务健康检查失败:', error);
      return res.status(500).json({
        success: false,
        data: null,
        message: '健康检查失败: ' + error.message
      });
    }
  }
}

module.exports = SchedulerController;