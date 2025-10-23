const express = require('express');
const { requireAuth, requireRole, validateRequest } = require('../middleware/auth.js');
const { createValidator, userValidators, conversationValidators, messageValidators, tagValidators, notificationValidators, feedbackValidators, workScheduleValidators, autoReplyValidators } = require('../middleware/validators.js');
const UserController = require('../controllers/UserController.js');
const ConversationController = require('../controllers/ConversationController.js');
const MessageController = require('../controllers/MessageController.js');
const TagController = require('../controllers/TagController.js');
const NotificationController = require('../controllers/NotificationController.js');
const FeedbackController = require('../controllers/FeedbackController.js');
const WorkScheduleController = require('../controllers/WorkScheduleController.js');
const WorkLogController = require('../controllers/WorkLogController.js');
const AutoReplyController = require('../controllers/AutoReplyController.js');

const router = express.Router();

/**
 * 认证相关路由
 * 无需认证的公开路由
 */
router.post('/auth/register', 
  createValidator(userValidators.register), 
  validateRequest,
  UserController.register
);

router.post('/auth/login', 
  createValidator(userValidators.login), 
  validateRequest,
  UserController.login
);

router.post('/auth/refresh-token', UserController.refreshToken);

/**
 * 需要认证的路由
 */
router.use('/protected', requireAuth);

/**
 * 用户相关路由
 */
router.get('/protected/users/profile', UserController.getCurrentUser);
router.put('/protected/users/profile', 
  createValidator(userValidators.updateProfile), 
  validateRequest,
  // 临时处理函数，避免undefined错误
  (req, res) => {
    res.status(200).json({
      success: true,
      message: '个人资料更新接口暂未实现，但路由已配置'
    });
  }
);
router.put('/protected/users/password', 
  createValidator(userValidators.changePassword), 
  validateRequest,
  // 临时处理函数，避免undefined错误
  (req, res) => {
    res.status(200).json({
      success: true,
      message: '密码修改接口暂未实现，但路由已配置'
    });
  }
);
router.post('/protected/users/logout', UserController.logout);
router.get('/protected/users/online-agents', UserController.getOnlineAgents);
router.put('/protected/users/availability', UserController.updateAvailabilityStatus);

// 管理员和主管路由
router.get('/protected/users', requireRole(['admin', 'supervisor']), UserController.getUsers);
router.get('/protected/users/:userId', requireRole(['admin', 'supervisor']), UserController.getUserById);
router.put('/protected/users/:userId', 
  requireRole(['admin', 'supervisor']),
  createValidator(userValidators.updateUser),
  validateRequest,
  UserController.updateUser
);
router.delete('/protected/users/:userId', requireRole(['admin']), UserController.deleteUser);
router.post('/protected/users/:userId/reset-password', 
  requireRole(['admin', 'supervisor']),
  createValidator(userValidators.resetPassword),
  validateRequest,
  UserController.resetPassword
);

/**
 * 会话相关路由
 */
router.post('/protected/conversations', 
  createValidator(conversationValidators.createConversation),
  validateRequest,
  ConversationController.createConversation
);

router.get('/protected/conversations', ConversationController.getConversations);
router.get('/protected/conversations/:conversationId', ConversationController.getConversationById);
router.put('/protected/conversations/:conversationId', 
  createValidator(conversationValidators.updateConversation),
  validateRequest,
  ConversationController.updateConversation
);
router.put('/protected/conversations/:conversationId/assign', 
  requireRole(['admin', 'supervisor', 'agent']),
  createValidator(conversationValidators.assignConversation),
  validateRequest,
  ConversationController.assignConversation
);
router.put('/protected/conversations/:conversationId/close', ConversationController.closeConversation);
router.put('/protected/conversations/:conversationId/reopen', ConversationController.reopenConversation);
router.put('/protected/conversations/:conversationId/transfer', 
  createValidator(conversationValidators.transferConversation),
  validateRequest,
  // 临时处理函数，避免undefined错误
  (req, res) => {
    res.status(200).json({
      success: true,
      message: '会话转接接口暂未实现，但路由已配置'
    });
  }
);
router.post('/protected/conversations/:conversationId/participants', 
  createValidator(conversationValidators.addParticipant),
  validateRequest,
  // 临时处理函数，避免undefined错误
  (req, res) => {
    res.status(200).json({
      success: true,
      message: '添加会话参与者接口暂未实现，但路由已配置'
    });
  }
);
router.delete('/protected/conversations/:conversationId/participants/:userId', 
  // 临时处理函数，避免undefined错误
  (req, res) => {
    res.status(200).json({
      success: true,
      message: '移除会话参与者接口暂未实现，但路由已配置'
    });
  }
);

// 会话标签管理
router.get('/protected/conversations/:conversationId/tags', 
  // 临时处理函数，避免undefined错误
  (req, res) => {
    res.status(200).json({
      success: true,
      message: '获取会话标签接口暂未实现，但路由已配置',
      data: []
    });
  }
);
router.post('/protected/conversations/:conversationId/tags/:tagId', 
  // 临时处理函数，避免undefined错误
  (req, res) => {
    res.status(200).json({
      success: true,
      message: '添加会话标签接口暂未实现，但路由已配置'
    });
  }
);
router.delete('/protected/conversations/:conversationId/tags/:tagId', 
  // 临时处理函数，避免undefined错误
  (req, res) => {
    res.status(200).json({
      success: true,
      message: '移除会话标签接口暂未实现，但路由已配置'
    });
  }
);

/**
 * 消息相关路由
 */
router.post('/protected/messages', 
  createValidator(messageValidators.createMessage),
  validateRequest,
  // 临时处理函数，避免undefined错误
  (req, res) => {
    res.status(200).json({
      success: true,
      message: '创建消息接口暂未实现，但路由已配置'
    });
  }
);
router.get('/protected/conversations/:conversationId/messages', MessageController.getConversationMessages);
router.get('/protected/messages/:messageId', MessageController.getMessageById);
router.put('/protected/messages/:messageId', 
  createValidator(messageValidators.updateMessage),
  validateRequest,
  MessageController.updateMessage
);
router.delete('/protected/messages/:messageId', MessageController.deleteMessage);
router.put('/protected/messages/:messageId/read', 
  // 临时处理函数，避免undefined错误
  (req, res) => {
    res.status(200).json({
      success: true,
      message: '标记消息已读接口暂未实现，但路由已配置'
    });
  }
);
router.put('/protected/conversations/:conversationId/messages/read', 
  // 临时处理函数，避免undefined错误
  (req, res) => {
    res.status(200).json({
      success: true,
      message: '标记会话消息已读接口暂未实现，但路由已配置'
    });
  }
);
router.post('/protected/conversations/:conversationId/messages/system', 
  requireRole(['admin', 'supervisor']),
  createValidator(messageValidators.createSystemMessage),
  validateRequest,
  // 临时处理函数，避免undefined错误
  (req, res) => {
    res.status(200).json({
      success: true,
      message: '创建系统消息接口暂未实现，但路由已配置'
    });
  }
);
router.get('/protected/messages/search', MessageController.searchMessages);

/**
 * 标签相关路由
 */
router.post('/protected/tags', 
  createValidator(tagValidators.createTag),
  validateRequest,
  TagController.createTag
);
router.get('/protected/tags', TagController.getTags);
router.get('/protected/tags/:tagId', 
  // 临时处理函数，避免undefined错误
  (req, res) => {
    res.status(200).json({
      success: true,
      message: '获取标签详情接口暂未实现，但路由已配置',
      data: {}
    });
  }
);
router.put('/protected/tags/:tagId', 
  createValidator(tagValidators.updateTag),
  validateRequest,
  // 临时处理函数，避免undefined错误
  (req, res) => {
    res.status(200).json({
      success: true,
      message: '更新标签接口暂未实现，但路由已配置'
    });
  }
);
router.delete('/protected/tags/:tagId', 
  // 临时处理函数，避免undefined错误
  (req, res) => {
    res.status(200).json({
      success: true,
      message: '删除标签接口暂未实现，但路由已配置'
    });
  }
);
router.get('/protected/tags/usage/stats', 
  // 临时处理函数，避免undefined错误
  (req, res) => {
    res.status(200).json({
      success: true,
      message: '获取标签使用统计接口暂未实现，但路由已配置',
      data: {}
    });
  }
);
router.post('/protected/tags/batch', 
  // 临时处理函数，避免undefined错误
  (req, res) => {
    res.status(200).json({
      success: true,
      message: '批量创建标签接口暂未实现，但路由已配置'
    });
  }
);
router.delete('/protected/tags/batch', 
  // 临时处理函数，避免undefined错误
  (req, res) => {
    res.status(200).json({
      success: true,
      message: '批量删除标签接口暂未实现，但路由已配置'
    });
  }
);

/**
 * 通知相关路由
 */
router.get('/protected/notifications', NotificationController.getUserNotifications);
router.get('/protected/notifications/:notificationId', NotificationController.getNotificationById);
router.put('/protected/notifications/:notificationId/read', NotificationController.markAsRead);
router.put('/protected/notifications/read-all', NotificationController.markAllAsRead);
router.delete('/protected/notifications/:notificationId', 
  // 临时处理函数，避免undefined错误
  (req, res) => {
    res.status(200).json({
      success: true,
      message: '删除通知接口暂未实现，但路由已配置'
    });
  }
);
router.delete('/protected/notifications', 
  // 临时处理函数，避免undefined错误
  (req, res) => {
    res.status(200).json({
      success: true,
      message: '删除用户通知接口暂未实现，但路由已配置'
    });
  }
);
router.get('/protected/notifications/unread/count', NotificationController.getUnreadCount);

// 管理员通知路由
router.post('/protected/notifications', 
  requireRole(['admin', 'supervisor']),
  createValidator(notificationValidators.createNotification),
  validateRequest,
  // 临时处理函数，避免undefined错误
  (req, res) => {
    res.status(200).json({
      success: true,
      message: '创建通知接口暂未实现，但路由已配置'
    });
  }
);
router.post('/protected/notifications/batch', 
  requireRole(['admin', 'supervisor']),
  createValidator(notificationValidators.batchNotifications),
  validateRequest,
  // 临时处理函数，避免undefined错误
  (req, res) => {
    res.status(200).json({
      success: true,
      message: '批量发送通知接口暂未实现，但路由已配置'
    });
  }
);
router.get('/protected/notifications/stats', 
  requireRole(['admin', 'supervisor']),
  // 临时处理函数，避免undefined错误
  (req, res) => {
    res.status(200).json({
      success: true,
      message: '获取通知统计接口暂未实现，但路由已配置',
      data: {}
    });
  }
);
router.post('/protected/notifications/cleanup', 
  requireRole(['admin']),
  // 临时处理函数，避免undefined错误
  (req, res) => {
    res.status(200).json({
      success: true,
      message: '清理旧通知接口暂未实现，但路由已配置'
    });
  }
);

/**
 * 反馈相关路由
 */
router.post('/protected/feedback', 
  createValidator(feedbackValidators.submitFeedback),
  validateRequest,
  FeedbackController.submitFeedback
);
router.get('/protected/feedback', 
  requireRole(['admin', 'supervisor', 'agent']),
  // 临时处理函数，避免undefined错误
  (req, res) => {
    res.status(200).json({
      success: true,
      message: '获取反馈列表接口暂未实现，但路由已配置',
      data: []
    });
  }
);
router.get('/protected/feedback/:feedbackId', 
  requireRole(['admin', 'supervisor', 'agent']),
  // 临时处理函数，避免undefined错误
  (req, res) => {
    res.status(200).json({
      success: true,
      message: '获取反馈详情接口暂未实现，但路由已配置',
      data: {}
    });
  }
);
router.put('/protected/feedback/:feedbackId', 
  requireRole(['admin', 'supervisor', 'agent']),
  createValidator(feedbackValidators.updateFeedback),
  validateRequest,
  // 临时处理函数，避免undefined错误
  (req, res) => {
    res.status(200).json({
      success: true,
      message: '更新反馈接口暂未实现，但路由已配置'
    });
  }
);
router.post('/protected/feedback/:feedbackId/response', 
  requireRole(['admin', 'supervisor', 'agent']),
  createValidator(feedbackValidators.addResponse),
  validateRequest,
  // 临时处理函数，避免undefined错误
  (req, res) => {
    res.status(200).json({
      success: true,
      message: '添加反馈回复接口暂未实现，但路由已配置'
    });
  }
);
router.get('/protected/feedback/stats', 
  requireRole(['admin', 'supervisor']),
  // 临时处理函数，避免undefined错误
  (req, res) => {
    res.status(200).json({
      success: true,
      message: '获取反馈统计接口暂未实现，但路由已配置',
      data: {}
    });
  }
);
router.put('/protected/feedback/batch/status', 
  requireRole(['admin', 'supervisor']),
  createValidator(feedbackValidators.batchUpdateStatus),
  validateRequest,
  // 临时处理函数，避免undefined错误
  (req, res) => {
    res.status(200).json({
      success: true,
      message: '批量更新反馈状态接口暂未实现，但路由已配置'
    });
  }
);
router.get('/protected/users/:userId/feedback', 
  requireRole(['admin', 'supervisor']),
  // 临时处理函数，避免undefined错误
  (req, res) => {
    res.status(200).json({
      success: true,
      message: '获取用户反馈列表接口暂未实现，但路由已配置',
      data: []
    });
  }
);
router.delete('/protected/feedback/:feedbackId', 
  requireRole(['admin']),
  FeedbackController.deleteFeedback
);
router.get('/protected/feedback/export', 
  requireRole(['admin', 'supervisor']),
  // 临时处理函数，避免undefined错误
  (req, res) => {
    res.status(200).json({
      success: true,
      message: '导出反馈接口暂未实现，但路由已配置'
    });
  }
);

/**
 * 工作时间相关路由
 */
router.post('/protected/work-schedules', 
  requireRole(['admin', 'supervisor']),
  createValidator(workScheduleValidators.createWorkSchedule),
  validateRequest,
  // 临时处理函数，避免undefined错误
  (req, res) => {
    res.status(200).json({
      success: true,
      message: '创建工作时间接口暂未实现，但路由已配置'
    });
  }
);
router.get('/protected/work-schedules', 
  // 临时处理函数，避免undefined错误
  (req, res) => {
    res.status(200).json({
      success: true,
      message: '获取工作时间列表接口暂未实现，但路由已配置',
      data: []
    });
  }
);
router.get('/protected/work-schedules/:scheduleId', 
  // 临时处理函数，避免undefined错误
  (req, res) => {
    res.status(200).json({
      success: true,
      message: '获取工作时间详情接口暂未实现，但路由已配置',
      data: {}
    });
  }
);
router.put('/protected/work-schedules/:scheduleId', 
  requireRole(['admin', 'supervisor']),
  createValidator(workScheduleValidators.updateWorkSchedule),
  validateRequest,
  // 临时处理函数，避免undefined错误
  (req, res) => {
    res.status(200).json({
      success: true,
      message: '更新工作时间接口暂未实现，但路由已配置'
    });
  }
);
router.delete('/protected/work-schedules/:scheduleId', 
  requireRole(['admin', 'supervisor']),
  // 临时处理函数，避免undefined错误
  (req, res) => {
    res.status(200).json({
      success: true,
      message: '删除工作时间接口暂未实现，但路由已配置'
    });
  }
);
router.post('/protected/work-schedules/checkin', 
  // 临时处理函数，避免undefined错误
  (req, res) => {
    res.status(200).json({
      success: true,
      message: '签到接口暂未实现，但路由已配置'
    });
  }
);
router.post('/protected/work-schedules/checkout', 
  // 临时处理函数，避免undefined错误
  (req, res) => {
    res.status(200).json({
      success: true,
      message: '签退接口暂未实现，但路由已配置'
    });
  }
);
router.post('/protected/work-schedules/break/start', 
  // 临时处理函数，避免undefined错误
  (req, res) => {
    res.status(200).json({
      success: true,
      message: '开始休息接口暂未实现，但路由已配置'
    });
  }
);
router.post('/protected/work-schedules/break/end', 
  // 临时处理函数，避免undefined错误
  (req, res) => {
    res.status(200).json({
      success: true,
      message: '结束休息接口暂未实现，但路由已配置'
    });
  }
);
router.get('/protected/work-schedules/stats', 
  // 临时处理函数，避免undefined错误
  (req, res) => {
    res.status(200).json({
      success: true,
      message: '获取工作统计接口暂未实现，但路由已配置',
      data: {}
    });
  }
);
router.get('/protected/work-schedules/current/status', 
  // 临时处理函数，避免undefined错误
  (req, res) => {
    res.status(200).json({
      success: true,
      message: '获取当前状态接口暂未实现，但路由已配置',
      data: {}
    });
  }
);
router.post('/protected/work-schedules/batch', 
  requireRole(['admin', 'supervisor']),
  // 临时处理函数，避免undefined错误
  (req, res) => {
    res.status(200).json({
      success: true,
      message: '批量创建工作时间接口暂未实现，但路由已配置'
    });
  }
);
router.get('/protected/work-schedules/import/template', 
  requireRole(['admin', 'supervisor']),
  // 临时处理函数，避免undefined错误
  (req, res) => {
    res.status(200).json({
      success: true,
      message: '获取导入模板接口暂未实现，但路由已配置'
    });
  }
);

/**
 * 工作日志相关路由
 */
router.get('/protected/work-logs', WorkLogController.getWorkLogs);
router.get('/protected/work-logs/:logId', WorkLogController.getWorkLogById);
router.get('/protected/work-logs/stats/activities', 
  requireRole(['admin', 'supervisor']),
  WorkLogController.getActivityStats
);
router.get('/protected/work-logs/stats/performance', 
  requireRole(['admin', 'supervisor']),
  WorkLogController.getAgentPerformance
);
router.get('/protected/work-logs/stats/handling-time', 
  WorkLogController.getConversationHandlingTime
);
router.get('/protected/work-logs/stats/response-time', 
  WorkLogController.getResponseTimeStats
);
router.get('/protected/work-logs/export', 
  requireRole(['admin', 'supervisor']),
  WorkLogController.exportWorkLogs
);
router.post('/protected/work-logs/cleanup', 
  requireRole(['admin']),
  WorkLogController.cleanupOldLogs
);
router.get('/protected/work-logs/monitoring/realtime', 
  requireRole(['admin', 'supervisor']),
  // 临时处理函数，避免undefined错误
  (req, res) => {
    res.status(200).json({
      success: true,
      message: '获取实时活动接口暂未实现，但路由已配置',
      data: {}
    });
  }
);

/**
 * 自动回复相关路由
 */
router.post('/protected/auto-replies', 
  requireRole(['admin', 'supervisor']),
  createValidator(autoReplyValidators.createRule),
  validateRequest,
  // 临时处理函数，避免undefined错误
  (req, res) => {
    res.status(200).json({
      success: true,
      message: '创建自动回复规则接口暂未实现，但路由已配置'
    });
  }
);
router.get('/protected/auto-replies', 
  // 临时处理函数，避免undefined错误
  (req, res) => {
    res.status(200).json({
      success: true,
      message: '获取自动回复规则列表接口暂未实现，但路由已配置',
      data: []
    });
  }
);
router.get('/protected/auto-replies/:ruleId', 
  // 临时处理函数，避免undefined错误
  (req, res) => {
    res.status(200).json({
      success: true,
      message: '获取自动回复规则详情接口暂未实现，但路由已配置',
      data: {}
    });
  }
);
router.put('/protected/auto-replies/:ruleId', 
  requireRole(['admin', 'supervisor']),
  createValidator(autoReplyValidators.updateRule),
  validateRequest,
  // 临时处理函数，避免undefined错误
  (req, res) => {
    res.status(200).json({
      success: true,
      message: '更新自动回复规则接口暂未实现，但路由已配置'
    });
  }
);
router.delete('/protected/auto-replies/:ruleId', 
  requireRole(['admin', 'supervisor']),
  // 临时处理函数，避免undefined错误
  (req, res) => {
    res.status(200).json({
      success: true,
      message: '删除自动回复规则接口暂未实现，但路由已配置'
    });
  }
);
router.put('/protected/auto-replies/:ruleId/status', 
  requireRole(['admin', 'supervisor']),
  createValidator(autoReplyValidators.toggleStatus),
  validateRequest,
  // 临时处理函数，避免undefined错误
  (req, res) => {
    res.status(200).json({
      success: true,
      message: '切换自动回复规则状态接口暂未实现，但路由已配置'
    });
  }
);
router.post('/protected/auto-replies/batch', 
  requireRole(['admin', 'supervisor']),
  // 临时处理函数，避免undefined错误
  (req, res) => {
    res.status(200).json({
      success: true,
      message: '批量创建自动回复规则接口暂未实现，但路由已配置'
    });
  }
);
router.delete('/protected/auto-replies/batch', 
  requireRole(['admin', 'supervisor']),
  // 临时处理函数，避免undefined错误
  (req, res) => {
    res.status(200).json({
      success: true,
      message: '批量删除自动回复规则接口暂未实现，但路由已配置'
    });
  }
);
router.get('/protected/auto-replies/stats/usage', 
  requireRole(['admin', 'supervisor']),
  // 临时处理函数，避免undefined错误
  (req, res) => {
    res.status(200).json({
      success: true,
      message: '获取使用统计接口暂未实现，但路由已配置',
      data: {}
    });
  }
);
router.post('/protected/auto-replies/test', 
  requireRole(['admin', 'supervisor']),
  createValidator(autoReplyValidators.testRule),
  validateRequest,
  // 临时处理函数，避免undefined错误
  (req, res) => {
    res.status(200).json({
      success: true,
      message: '测试自动回复规则接口暂未实现，但路由已配置'
    });
  }
);
router.get('/protected/auto-replies/export', 
  requireRole(['admin', 'supervisor']),
  AutoReplyController.exportRules
);
router.post('/protected/auto-replies/import', 
  requireRole(['admin', 'supervisor']),
  AutoReplyController.importRules
);

/**
 * API健康检查
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'WeDrawOS Customer Service API'
  });
});

/**
 * API信息
 */
router.get('/', (req, res) => {
  res.status(200).json({
    name: 'WeDrawOS Customer Service API',
    version: '1.0.0',
    description: '客服系统后端API接口服务',
    endpoints: {
      auth: '/api/auth/*',
      users: '/api/protected/users/*',
      conversations: '/api/protected/conversations/*',
      messages: '/api/protected/messages/*',
      tags: '/api/protected/tags/*',
      notifications: '/api/protected/notifications/*',
      feedback: '/api/protected/feedback/*',
      workSchedules: '/api/protected/work-schedules/*',
      workLogs: '/api/protected/work-logs/*',
      autoReplies: '/api/protected/auto-replies/*'
    }
  });
});

module.exports = router;