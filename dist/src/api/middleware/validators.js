const { body, query, param, validationResult } = require('express-validator');

/**
 * 创建验证器中间件
 */
const createValidator = (validationRules) => {
  return async (req, res, next) => {
    try {
      // 执行所有验证规则
      await Promise.all(validationRules.map(rule => rule.run(req)));
      
      // 获取验证结果
      const errors = validationResult(req);
      
      if (!errors.isEmpty()) {
        req.validationErrors = errors.array();
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * 用户相关验证规则
 */
const userValidators = {
  // 注册验证
  register: [
    body('username')
      .trim()
      .isLength({ min: 3, max: 50 })
      .withMessage('用户名长度必须在3-50个字符之间')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('用户名只能包含字母、数字和下划线'),
    
    body('email')
      .trim()
      .isEmail()
      .withMessage('请输入有效的邮箱地址')
      .normalizeEmail(),
    
    body('password')
      .isLength({ min: 6 })
      .withMessage('密码长度至少为6个字符')
      .matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/)
      .withMessage('密码必须包含字母和数字'),
    
    body('firstName')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('名字长度必须在1-50个字符之间'),
    
    body('lastName')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('姓氏长度必须在1-50个字符之间'),
    
    body('role')
      .optional()
      .isIn(['admin', 'supervisor', 'agent', 'user'])
      .withMessage('角色必须是admin、supervisor、agent或user')
  ],
  
  // 登录验证
  login: [
    body('email')
      .trim()
      .isEmail()
      .withMessage('请输入有效的邮箱地址')
      .normalizeEmail(),
    
    body('password')
      .notEmpty()
      .withMessage('密码不能为空')
  ],
  
  // 更新个人资料验证
  updateProfile: [
    body('firstName')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('名字长度必须在1-50个字符之间'),
    
    body('lastName')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('姓氏长度必须在1-50个字符之间'),
    
    body('phone')
      .optional()
      .trim()
      .isLength({ max: 20 })
      .withMessage('电话号码长度不能超过20个字符'),
    
    body('avatar')
      .optional()
      .isURL()
      .withMessage('请输入有效的头像URL')
  ],
  
  // 修改密码验证
  changePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('当前密码不能为空'),
    
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('新密码长度至少为6个字符')
      .matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/)
      .withMessage('新密码必须包含字母和数字')
  ],
  
  // 更新用户验证（管理员用）
  updateUser: [
    body('firstName')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('名字长度必须在1-50个字符之间'),
    
    body('lastName')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('姓氏长度必须在1-50个字符之间'),
    
    body('role')
      .optional()
      .isIn(['admin', 'supervisor', 'agent', 'user'])
      .withMessage('角色必须是admin、supervisor、agent或user'),
    
    body('status')
      .optional()
      .isIn(['active', 'inactive', 'suspended'])
      .withMessage('状态必须是active、inactive或suspended'),
    
    body('availabilityStatus')
      .optional()
      .isIn(['online', 'offline', 'away', 'busy'])
      .withMessage('可用性状态必须是online、offline、away或busy')
  ],
  
  // 重置密码验证
  resetPassword: [
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('新密码长度至少为6个字符')
      .matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/)
      .withMessage('新密码必须包含字母和数字')
  ]
};

/**
 * 会话相关验证规则
 */
const conversationValidators = {
  // 创建会话验证
  createConversation: [
    body('title')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('会话标题长度不能超过200个字符'),
    
    body('type')
      .optional()
      .isIn(['chat', 'ticket', 'call'])
      .withMessage('会话类型必须是chat、ticket或call'),
    
    body('assignedToUserId')
      .optional()
      .isInt()
      .withMessage('负责人ID必须是整数'),
    
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'urgent'])
      .withMessage('优先级必须是low、medium、high或urgent'),
    
    body('metadata')
      .optional()
      .isObject()
      .withMessage('元数据必须是对象格式')
  ],
  
  // 更新会话验证
  updateConversation: [
    body('title')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('会话标题长度不能超过200个字符'),
    
    body('status')
      .optional()
      .isIn(['open', 'closed', 'archived'])
      .withMessage('状态必须是open、closed或archived'),
    
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'urgent'])
      .withMessage('优先级必须是low、medium、high或urgent'),
    
    body('metadata')
      .optional()
      .isObject()
      .withMessage('元数据必须是对象格式')
  ],
  
  // 分配会话验证
  assignConversation: [
    body('assignedToUserId')
      .isInt()
      .withMessage('负责人ID必须是整数')
  ],
  
  // 转接会话验证
  transferConversation: [
    body('newAssigneeId')
      .isInt()
      .withMessage('新负责人ID必须是整数'),
    
    body('reason')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('转接原因长度不能超过500个字符')
  ],
  
  // 添加参与者验证
  addParticipant: [
    body('userId')
      .isInt()
      .withMessage('参与者ID必须是整数'),
    
    body('role')
      .optional()
      .isIn(['participant', 'observer'])
      .withMessage('参与者角色必须是participant或observer')
  ]
};

/**
 * 消息相关验证规则
 */
const messageValidators = {
  // 创建消息验证
  createMessage: [
    body('conversationId')
      .isInt()
      .withMessage('会话ID必须是整数'),
    
    body('content')
      .trim()
      .isLength({ min: 1, max: 10000 })
      .withMessage('消息内容长度必须在1-10000个字符之间'),
    
    body('type')
      .optional()
      .isIn(['text', 'image', 'file', 'system'])
      .withMessage('消息类型必须是text、image、file或system'),
    
    body('attachments')
      .optional()
      .isArray()
      .withMessage('附件必须是数组格式')
      .custom((value) => {
        // 验证每个附件对象
        if (value) {
          for (const attachment of value) {
            if (!attachment.url || !attachment.filename) {
              throw new Error('每个附件必须包含url和filename字段');
            }
          }
        }
        return true;
      })
  ],
  
  // 更新消息验证
  updateMessage: [
    body('content')
      .trim()
      .isLength({ min: 1, max: 10000 })
      .withMessage('消息内容长度必须在1-10000个字符之间'),
    
    body('attachments')
      .optional()
      .isArray()
      .withMessage('附件必须是数组格式')
  ],
  
  // 创建系统消息验证
  createSystemMessage: [
    body('content')
      .trim()
      .isLength({ min: 1, max: 5000 })
      .withMessage('系统消息内容长度必须在1-5000个字符之间'),
    
    body('type')
      .optional()
      .isIn(['notice', 'warning', 'success', 'info'])
      .withMessage('系统消息类型必须是notice、warning、success或info')
  ]
};

/**
 * 标签相关验证规则
 */
const tagValidators = {
  // 创建标签验证
  createTag: [
    body('name')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('标签名称长度必须在1-50个字符之间'),
    
    body('color')
      .optional()
      .matches(/^#[0-9A-F]{6}$/i)
      .withMessage('颜色必须是有效的十六进制格式，如#FF0000'),
    
    body('description')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('标签描述长度不能超过200个字符')
  ],
  
  // 更新标签验证
  updateTag: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('标签名称长度必须在1-50个字符之间'),
    
    body('color')
      .optional()
      .matches(/^#[0-9A-F]{6}$/i)
      .withMessage('颜色必须是有效的十六进制格式，如#FF0000'),
    
    body('description')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('标签描述长度不能超过200个字符')
  ]
};

/**
 * 通知相关验证规则
 */
const notificationValidators = {
  // 创建通知验证
  createNotification: [
    body('userId')
      .isInt()
      .withMessage('用户ID必须是整数'),
    
    body('title')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('通知标题长度必须在1-100个字符之间'),
    
    body('content')
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage('通知内容长度必须在1-1000个字符之间'),
    
    body('type')
      .optional()
      .isIn(['system', 'task', 'alert', 'info'])
      .withMessage('通知类型必须是system、task、alert或info'),
    
    body('data')
      .optional()
      .isObject()
      .withMessage('通知数据必须是对象格式')
  ],
  
  // 批量发送通知验证
  batchNotifications: [
    body('userIds')
      .isArray()
      .withMessage('用户ID列表必须是数组格式')
      .custom((value) => {
        if (value.length === 0) {
          throw new Error('用户ID列表不能为空');
        }
        for (const id of value) {
          if (!Number.isInteger(id)) {
            throw new Error('所有用户ID必须是整数');
          }
        }
        return true;
      }),
    
    body('title')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('通知标题长度必须在1-100个字符之间'),
    
    body('content')
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage('通知内容长度必须在1-1000个字符之间')
  ]
};

/**
 * 反馈相关验证规则
 */
const feedbackValidators = {
  // 提交反馈验证
  submitFeedback: [
    body('conversationId')
      .optional()
      .isInt()
      .withMessage('会话ID必须是整数'),
    
    body('rating')
      .isInt({ min: 1, max: 5 })
      .withMessage('评分必须是1-5之间的整数'),
    
    body('content')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('反馈内容长度不能超过2000个字符'),
    
    body('feedbackType')
      .optional()
      .isIn(['service', 'product', 'system', 'suggestion'])
      .withMessage('反馈类型必须是service、product、system或suggestion')
  ],
  
  // 更新反馈验证
  updateFeedback: [
    body('status')
      .optional()
      .isIn(['pending', 'processing', 'resolved', 'closed'])
      .withMessage('状态必须是pending、processing、resolved或closed'),
    
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high'])
      .withMessage('优先级必须是low、medium或high')
  ],
  
  // 添加回复验证
  addResponse: [
    body('response')
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage('回复内容长度必须在1-1000个字符之间')
  ],
  
  // 批量更新状态验证
  batchUpdateStatus: [
    body('feedbackIds')
      .isArray()
      .withMessage('反馈ID列表必须是数组格式')
      .custom((value) => {
        if (value.length === 0) {
          throw new Error('反馈ID列表不能为空');
        }
        for (const id of value) {
          if (!Number.isInteger(id)) {
            throw new Error('所有反馈ID必须是整数');
          }
        }
        return true;
      }),
    
    body('status')
      .isIn(['pending', 'processing', 'resolved', 'closed'])
      .withMessage('状态必须是pending、processing、resolved或closed')
  ]
};

/**
 * 工作时间相关验证规则
 */
const workScheduleValidators = {
  // 创建工作时间验证
  createWorkSchedule: [
    body('userId')
      .isInt()
      .withMessage('用户ID必须是整数'),
    
    body('date')
      .isDate()
      .withMessage('日期格式无效'),
    
    body('shiftType')
      .optional()
      .isIn(['morning', 'afternoon', 'night', 'full_day'])
      .withMessage('班次类型必须是morning、afternoon、night或full_day'),
    
    body('scheduledStartTime')
      .optional()
      .isISO8601()
      .withMessage('计划开始时间格式无效'),
    
    body('scheduledEndTime')
      .optional()
      .isISO8601()
      .withMessage('计划结束时间格式无效')
  ],
  
  // 更新工作时间验证
  updateWorkSchedule: [
    body('shiftType')
      .optional()
      .isIn(['morning', 'afternoon', 'night', 'full_day'])
      .withMessage('班次类型必须是morning、afternoon、night或full_day'),
    
    body('scheduledStartTime')
      .optional()
      .isISO8601()
      .withMessage('计划开始时间格式无效'),
    
    body('scheduledEndTime')
      .optional()
      .isISO8601()
      .withMessage('计划结束时间格式无效'),
    
    body('status')
      .optional()
      .isIn(['scheduled', 'completed', 'absent', 'late'])
      .withMessage('状态必须是scheduled、completed、absent或late')
  ]
};

/**
 * 自动回复相关验证规则
 */
const autoReplyValidators = {
  // 创建规则验证
  createRule: [
    body('name')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('规则名称长度必须在1-100个字符之间'),
    
    body('keywords')
      .isArray()
      .withMessage('关键词必须是数组格式')
      .custom((value) => {
        if (value.length === 0) {
          throw new Error('关键词列表不能为空');
        }
        for (const keyword of value) {
          if (typeof keyword !== 'string' || !keyword.trim()) {
            throw new Error('每个关键词必须是非空字符串');
          }
        }
        return true;
      }),
    
    body('response')
      .trim()
      .isLength({ min: 1, max: 5000 })
      .withMessage('回复内容长度必须在1-5000个字符之间'),
    
    body('matchType')
      .optional()
      .isIn(['exact', 'contains', 'regex'])
      .withMessage('匹配类型必须是exact、contains或regex'),
    
    body('priority')
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage('优先级必须是1-10之间的整数')
  ],
  
  // 更新规则验证
  updateRule: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('规则名称长度必须在1-100个字符之间'),
    
    body('keywords')
      .optional()
      .isArray()
      .withMessage('关键词必须是数组格式')
      .custom((value) => {
        if (value && value.length === 0) {
          throw new Error('关键词列表不能为空');
        }
        if (value) {
          for (const keyword of value) {
            if (typeof keyword !== 'string' || !keyword.trim()) {
              throw new Error('每个关键词必须是非空字符串');
            }
          }
        }
        return true;
      }),
    
    body('response')
      .optional()
      .trim()
      .isLength({ min: 1, max: 5000 })
      .withMessage('回复内容长度必须在1-5000个字符之间'),
    
    body('matchType')
      .optional()
      .isIn(['exact', 'contains', 'regex'])
      .withMessage('匹配类型必须是exact、contains或regex'),
    
    body('priority')
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage('优先级必须是1-10之间的整数')
  ],
  
  // 切换状态验证
  toggleStatus: [
    body('enabled')
      .isBoolean()
      .withMessage('状态必须是布尔值')
  ],
  
  // 测试规则验证
  testRule: [
    body('text')
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage('测试文本长度必须在1-1000个字符之间')
  ]
};

/**
 * 通用参数验证规则
 */
const commonValidators = {
  // ID参数验证
  idParam: [
    param('id')
      .isInt()
      .withMessage('ID必须是整数')
  ],
  
  // 分页参数验证
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('页码必须是大于0的整数')
      .toInt(),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('每页数量必须是1-100之间的整数')
      .toInt()
  ],
  
  // 日期范围验证
  dateRange: [
    query('startDate')
      .optional()
      .isDate()
      .withMessage('开始日期格式无效'),
    
    query('endDate')
      .optional()
      .isDate()
      .withMessage('结束日期格式无效')
      .custom((value, { req }) => {
        if (value && req.query.startDate && new Date(value) < new Date(req.query.startDate)) {
          throw new Error('结束日期不能早于开始日期');
        }
        return true;
      })
  ],
  
  // 排序参数验证
  sorting: [
    query('sortBy')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('排序字段长度必须在1-50个字符之间'),
    
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('排序方向必须是asc或desc')
  ]
};

module.exports = {
  createValidator,
  userValidators,
  conversationValidators,
  messageValidators,
  tagValidators,
  notificationValidators,
  feedbackValidators,
  workScheduleValidators,
  autoReplyValidators,
  commonValidators
};