import express from 'express';
import { requireAuth, requireRole, validateRequest } from '../middleware/auth.js';
import { createValidator, userValidators, conversationValidators, messageValidators } from '../middleware/validators.js';

// 控制器导入
import UserController from '../controllers/UserController.js';
import ConversationController from '../controllers/ConversationController.js';
import MessageController from '../controllers/MessageController.js';
import TagController from '../controllers/TagController.js';
import NotificationController from '../controllers/NotificationController.js';
import FeedbackController from '../controllers/FeedbackController.js';
import WorkScheduleController from '../controllers/WorkScheduleController.js';
import WorkLogController from '../controllers/WorkLogController.js';
import AutoReplyController from '../controllers/AutoReplyController.js';

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
  UserController.updateCurrentUser
);
router.put('/protected/users/password', 
  createValidator(userValidators.changePassword), 
  validateRequest,
  UserController.changePassword
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
  ConversationController.transferConversation
);
router.post('/protected/conversations/:conversationId/participants', 
  createValidator(conversationValidators.addParticipant),
  validateRequest,
  ConversationController.addParticipant
);
router.delete('/protected/conversations/:conversationId/participants/:userId', 
  ConversationController.removeParticipant
);

// 会话标签管理
router.get('/protected/conversations/:conversationId/tags', ConversationController.getConversationTags);
router.post('/protected/conversations/:conversationId/tags/:tagId', ConversationController.addTagToConversation);
router.delete('/protected/conversations/:conversationId/tags/:tagId', ConversationController.removeTagFromConversation);

/**
 * 消息相关路由
 */
router.post('/protected/messages', 
  createValidator(messageValidators.createMessage),
  validateRequest,
  MessageController.createMessage
);
router.get('/protected/conversations/:conversationId/messages', MessageController.getConversationMessages);
router.get('/protected/messages/:messageId', MessageController.getMessageById);
router.put('/protected/messages/:messageId', 
  createValidator(messageValidators.updateMessage),
  validateRequest,
  MessageController.updateMessage
);
router.delete('/protected/messages/:messageId', MessageController.deleteMessage);
router.put('/protected/messages/:messageId/read', MessageController.markAsRead);
router.put('/protected/conversations/:conversationId/messages/read', MessageController.markConversationMessagesAsRead);
router.post('/protected/conversations/:conversationId/messages/system', 
  requireRole(['admin', 'supervisor']),
  createValidator(messageValidators.createSystemMessage),
  validateRequest,
  MessageController.createSystemMessage
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
router.get('/protected/tags/:tagId', TagController.getTagById);
router.put('/protected/tags/:tagId', 
  createValidator(tagValidators.updateTag),
  validateRequest,
  TagController.updateTag
);
router.delete('/protected/tags/:tagId', TagController.deleteTag);
router.get('/protected/tags/usage/stats', TagController.getTagUsageStats);
router.post('/protected/tags/batch', TagController.batchCreateTags);
router.delete('/protected/tags/batch', TagController.batchDeleteTags);

/**
 * 通知相关路由
 */
router.get('/protected/notifications', NotificationController.getUserNotifications);
router.get('/protected/notifications/:notificationId', NotificationController.getNotificationById);
router.put('/protected/notifications/:notificationId/read', NotificationController.markAsRead);
router.put('/protected/notifications/read-all', NotificationController.markAllAsRead);
router.delete('/protected/notifications/:notificationId', NotificationController.deleteNotification);
router.delete('/protected/notifications', NotificationController.deleteUserNotifications);
router.get('/protected/notifications/unread/count', NotificationController.getUnreadCount);

// 管理员通知路由
router.post('/protected/notifications', 
  requireRole(['admin', 'supervisor']),
  createValidator(notificationValidators.createNotification),
  validateRequest,
  NotificationController.createNotification
);
router.post('/protected/notifications/batch', 
  requireRole(['admin', 'supervisor']),
  createValidator(notificationValidators.batchNotifications),
  validateRequest,
  NotificationController.sendBatchNotifications
);
router.get('/protected/notifications/stats', 
  requireRole(['admin', 'supervisor']),
  NotificationController.getNotificationStats
);
router.post('/protected/notifications/cleanup', 
  requireRole(['admin']),
  NotificationController.cleanupOldNotifications
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
  FeedbackController.getFeedbacks
);
router.get('/protected/feedback/:feedbackId', 
  requireRole(['admin', 'supervisor', 'agent']),
  FeedbackController.getFeedbackById
);
router.put('/protected/feedback/:feedbackId', 
  requireRole(['admin', 'supervisor', 'agent']),
  createValidator(feedbackValidators.updateFeedback),
  validateRequest,
  FeedbackController.updateFeedback
);
router.post('/protected/feedback/:feedbackId/response', 
  requireRole(['admin', 'supervisor', 'agent']),
  createValidator(feedbackValidators.addResponse),
  validateRequest,
  FeedbackController.addResponse
);
router.get('/protected/feedback/stats', 
  requireRole(['admin', 'supervisor']),
  FeedbackController.getFeedbackStats
);
router.put('/protected/feedback/batch/status', 
  requireRole(['admin', 'supervisor']),
  createValidator(feedbackValidators.batchUpdateStatus),
  validateRequest,
  FeedbackController.batchUpdateStatus
);
router.get('/protected/users/:userId/feedback', 
  requireRole(['admin', 'supervisor']),
  FeedbackController.getUserFeedbacks
);
router.delete('/protected/feedback/:feedbackId', 
  requireRole(['admin']),
  FeedbackController.deleteFeedback
);
router.get('/protected/feedback/export', 
  requireRole(['admin', 'supervisor']),
  FeedbackController.exportFeedbacks
);

/**
 * 工作时间相关路由
 */
router.post('/protected/work-schedules', 
  requireRole(['admin', 'supervisor']),
  createValidator(workScheduleValidators.createWorkSchedule),
  validateRequest,
  WorkScheduleController.createWorkSchedule
);
router.get('/protected/work-schedules', WorkScheduleController.getWorkSchedules);
router.get('/protected/work-schedules/:scheduleId', WorkScheduleController.getWorkScheduleById);
router.put('/protected/work-schedules/:scheduleId', 
  requireRole(['admin', 'supervisor']),
  createValidator(workScheduleValidators.updateWorkSchedule),
  validateRequest,
  WorkScheduleController.updateWorkSchedule
);
router.delete('/protected/work-schedules/:scheduleId', 
  requireRole(['admin', 'supervisor']),
  WorkScheduleController.deleteWorkSchedule
);
router.post('/protected/work-schedules/checkin', WorkScheduleController.checkIn);
router.post('/protected/work-schedules/checkout', WorkScheduleController.checkOut);
router.post('/protected/work-schedules/break/start', WorkScheduleController.startBreak);
router.post('/protected/work-schedules/break/end', WorkScheduleController.endBreak);
router.get('/protected/work-schedules/stats', WorkScheduleController.getWorkStats);
router.get('/protected/work-schedules/current/status', WorkScheduleController.getCurrentStatus);
router.post('/protected/work-schedules/batch', 
  requireRole(['admin', 'supervisor']),
  WorkScheduleController.batchCreateWorkSchedules
);
router.get('/protected/work-schedules/import/template', 
  requireRole(['admin', 'supervisor']),
  WorkScheduleController.getImportTemplate
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
  WorkLogController.getRealtimeActivity
);

/**
 * 自动回复相关路由
 */
router.post('/protected/auto-replies', 
  requireRole(['admin', 'supervisor']),
  createValidator(autoReplyValidators.createRule),
  validateRequest,
  AutoReplyController.createRule
);
router.get('/protected/auto-replies', AutoReplyController.getRules);
router.get('/protected/auto-replies/:ruleId', AutoReplyController.getRuleById);
router.put('/protected/auto-replies/:ruleId', 
  requireRole(['admin', 'supervisor']),
  createValidator(autoReplyValidators.updateRule),
  validateRequest,
  AutoReplyController.updateRule
);
router.delete('/protected/auto-replies/:ruleId', 
  requireRole(['admin', 'supervisor']),
  AutoReplyController.deleteRule
);
router.put('/protected/auto-replies/:ruleId/status', 
  requireRole(['admin', 'supervisor']),
  createValidator(autoReplyValidators.toggleStatus),
  validateRequest,
  AutoReplyController.toggleStatus
);
router.post('/protected/auto-replies/batch', 
  requireRole(['admin', 'supervisor']),
  AutoReplyController.batchCreateRules
);
router.delete('/protected/auto-replies/batch', 
  requireRole(['admin', 'supervisor']),
  AutoReplyController.batchDeleteRules
);
router.get('/protected/auto-replies/stats/usage', 
  requireRole(['admin', 'supervisor']),
  AutoReplyController.getUsageStats
);
router.post('/protected/auto-replies/test', 
  requireRole(['admin', 'supervisor']),
  createValidator(autoReplyValidators.testRule),
  validateRequest,
  AutoReplyController.testRule
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

export default router;