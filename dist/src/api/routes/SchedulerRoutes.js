/**
 * 定时任务监控路由
 * 提供定时任务状态查询和管理API
 */

const express = require('express');
const router = express.Router();
const SchedulerController = require('../controllers/SchedulerController');
const authMiddleware = require('../middlewares/auth');
const roleMiddleware = require('../middlewares/role');

/**
 * 定时任务监控路由配置
 * 所有路由都需要管理员权限
 */

// 获取所有定时任务状态
router.get('/status', 
  authMiddleware.authenticate, 
  roleMiddleware.requireAdmin, 
  SchedulerController.getJobStatuses
);

// 立即执行指定任务
router.post('/execute/:jobName', 
  authMiddleware.authenticate, 
  roleMiddleware.requireAdmin, 
  SchedulerController.executeJob
);

// 获取定时任务统计信息
router.get('/statistics', 
  authMiddleware.authenticate, 
  roleMiddleware.requireAdmin, 
  SchedulerController.getJobStatistics
);

// 获取任务执行历史记录
router.get('/history/:jobName', 
  authMiddleware.authenticate, 
  roleMiddleware.requireAdmin, 
  SchedulerController.getJobHistory
);

// 定时任务健康检查
router.get('/health', 
  authMiddleware.authenticate, 
  roleMiddleware.requireAdmin, 
  SchedulerController.healthCheck
);

module.exports = router;