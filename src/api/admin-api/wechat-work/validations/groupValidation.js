/**
 * 企业微信外部群管理验证规则
 * 确保API输入数据的合法性
 */

const { body, query, param } = require('express-validator');

/**
 * 获取群组列表验证规则
 */
exports.getGroupsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是正整数')
    .toInt(),
  
  query('pageSize')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量必须在1-100之间')
    .toInt(),
  
  query('keyword')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('搜索关键词长度不能超过100个字符')
];

/**
 * 获取群组详情验证规则
 */
exports.getGroupDetailValidation = [
  param('chatId')
    .notEmpty()
    .withMessage('群聊ID不能为空')
    .trim()
];

/**
 * 获取群成员列表验证规则
 */
exports.getGroupMembersValidation = [
  param('chatId')
    .notEmpty()
    .withMessage('群聊ID不能为空')
    .trim(),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是正整数')
    .toInt(),
  
  query('pageSize')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量必须在1-100之间')
    .toInt()
];

/**
 * 搜索群组验证规则
 */
exports.searchGroupsValidation = [
  query('keyword')
    .notEmpty()
    .withMessage('搜索关键词不能为空')
    .trim()
    .isLength({ max: 100 })
    .withMessage('搜索关键词长度不能超过100个字符'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是正整数')
    .toInt(),
  
  query('pageSize')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量必须在1-100之间')
    .toInt()
];

/**
 * 发送群消息验证规则
 */
exports.sendMessageValidation = [
  param('chatId')
    .notEmpty()
    .withMessage('群聊ID不能为空')
    .trim(),
  
  body('msgtype')
    .notEmpty()
    .withMessage('消息类型不能为空')
    .isIn(['text', 'image', 'file', 'video', 'link', 'miniprogram'])
    .withMessage('消息类型必须是text、image、file、video、link或miniprogram之一')
];

/**
 * 发送文本消息验证规则
 */
exports.sendTextMessageValidation = [
  param('chatId')
    .notEmpty()
    .withMessage('群聊ID不能为空')
    .trim(),
  
  body('content')
    .notEmpty()
    .withMessage('消息内容不能为空')
    .isLength({ max: 2000 })
    .withMessage('消息内容长度不能超过2000个字符')
    .trim()
];

/**
 * 发送图片消息验证规则
 */
exports.sendImageMessageValidation = [
  param('chatId')
    .notEmpty()
    .withMessage('群聊ID不能为空')
    .trim(),
  
  body('mediaId')
    .notEmpty()
    .withMessage('媒体ID不能为空')
    .trim()
];

/**
 * 发送文件消息验证规则
 */
exports.sendFileMessageValidation = [
  param('chatId')
    .notEmpty()
    .withMessage('群聊ID不能为空')
    .trim(),
  
  body('mediaId')
    .notEmpty()
    .withMessage('媒体ID不能为空')
    .trim()
];

/**
 * 发送视频消息验证规则
 */
exports.sendVideoMessageValidation = [
  param('chatId')
    .notEmpty()
    .withMessage('群聊ID不能为空')
    .trim(),
  
  body('mediaId')
    .notEmpty()
    .withMessage('媒体ID不能为空')
    .trim(),
  
  body('title')
    .optional()
    .isLength({ max: 100 })
    .withMessage('视频标题长度不能超过100个字符')
    .trim(),
  
  body('description')
    .optional()
    .isLength({ max: 200 })
    .withMessage('视频描述长度不能超过200个字符')
    .trim()
];

/**
 * 发送链接消息验证规则
 */
exports.sendLinkMessageValidation = [
  param('chatId')
    .notEmpty()
    .withMessage('群聊ID不能为空')
    .trim(),
  
  body('title')
    .notEmpty()
    .withMessage('链接标题不能为空')
    .isLength({ max: 100 })
    .withMessage('链接标题长度不能超过100个字符')
    .trim(),
  
  body('description')
    .optional()
    .isLength({ max: 200 })
    .withMessage('链接描述长度不能超过200个字符')
    .trim(),
  
  body('url')
    .notEmpty()
    .withMessage('链接地址不能为空')
    .isURL({ require_protocol: true })
    .withMessage('链接地址格式不正确')
    .trim(),
  
  body('picUrl')
    .optional()
    .isURL({ require_protocol: true })
    .withMessage('图片链接格式不正确')
    .trim()
];

/**
 * 批量发送消息验证规则
 */
exports.batchSendMessageValidation = [
  body('groups')
    .notEmpty()
    .withMessage('群组列表不能为空')
    .isArray()
    .withMessage('群组列表必须是数组格式')
    .custom((groups) => {
      if (groups.length === 0) {
        throw new Error('群组列表不能为空');
      }
      if (groups.length > 100) {
        throw new Error('单次批量发送最多支持100个群组');
      }
      // 验证每个群组对象
      for (const group of groups) {
        if (!group.chat_id) {
          throw new Error('群组对象中必须包含chat_id字段');
        }
      }
      return true;
    }),
  
  body('msgtype')
    .notEmpty()
    .withMessage('消息类型不能为空')
    .isIn(['text', 'image', 'file', 'video', 'link', 'miniprogram'])
    .withMessage('消息类型必须是text、image、file、video、link或miniprogram之一')
];

/**
 * 获取聊天记录验证规则
 */
exports.getChatRecordsValidation = [
  param('chatId')
    .notEmpty()
    .withMessage('群聊ID不能为空')
    .trim(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('记录数量必须在1-100之间')
    .toInt(),
  
  query('cursor')
    .optional()
    .trim(),
  
  query('startTime')
    .optional()
    .isISO8601()
    .withMessage('开始时间格式不正确')
    .toDate(),
  
  query('endTime')
    .optional()
    .isISO8601()
    .withMessage('结束时间格式不正确')
    .toDate()
];

/**
 * 更新群组备注验证规则
 */
exports.updateGroupRemarkValidation = [
  param('chatId')
    .notEmpty()
    .withMessage('群聊ID不能为空')
    .trim(),
  
  body('remark')
    .optional()
    .isLength({ max: 500 })
    .withMessage('备注长度不能超过500个字符')
    .trim()
];

/**
 * 获取群组统计信息验证规则
 */
exports.getGroupStatisticsValidation = [
  query('startTime')
    .optional()
    .isISO8601()
    .withMessage('开始时间格式不正确')
    .toDate(),
  
  query('endTime')
    .optional()
    .isISO8601()
    .withMessage('结束时间格式不正确')
    .toDate()
];

/**
 * 标记群组重要性验证规则
 */
exports.markGroupImportantValidation = [
  param('chatId')
    .notEmpty()
    .withMessage('群聊ID不能为空')
    .trim(),
  
  body('isImportant')
    .isBoolean()
    .withMessage('isImportant必须是布尔值')
];

/**
 * 设置群提醒验证规则
 */
exports.setGroupReminderValidation = [
  param('chatId')
    .notEmpty()
    .withMessage('群聊ID不能为空')
    .trim(),
  
  body('type')
    .notEmpty()
    .withMessage('提醒类型不能为空')
    .isIn(['text', 'link', 'image'])
    .withMessage('提醒类型必须是text、link或image之一')
    .trim(),
  
  body('content')
    .notEmpty()
    .withMessage('提醒内容不能为空')
    .isLength({ max: 1000 })
    .withMessage('提醒内容长度不能超过1000个字符')
    .trim(),
  
  body('reminderTime')
    .notEmpty()
    .withMessage('提醒时间不能为空')
    .isISO8601()
    .withMessage('提醒时间格式不正确')
    .toDate(),
  
  body('isRecurring')
    .optional()
    .isBoolean()
    .withMessage('isRecurring必须是布尔值'),
  
  body('recurringRule')
    .optional()
    .isObject()
    .withMessage('recurringRule必须是对象格式')
];

/**
 * 获取群提醒验证规则
 */
exports.getGroupRemindersValidation = [
  param('chatId')
    .notEmpty()
    .withMessage('群聊ID不能为空')
    .trim()
];

/**
 * 删除群提醒验证规则
 */
exports.deleteGroupReminderValidation = [
  param('reminderId')
    .notEmpty()
    .withMessage('提醒ID不能为空')
    .isInt({ min: 1 })
    .withMessage('提醒ID必须是正整数')
    .toInt()
];

/**
 * 批量更新群组状态验证规则
 */
exports.batchUpdateGroupStatusValidation = [
  body('chatIds')
    .notEmpty()
    .withMessage('群聊ID列表不能为空')
    .isArray()
    .withMessage('群聊ID列表必须是数组格式')
    .custom((chatIds) => {
      if (chatIds.length === 0) {
        throw new Error('群聊ID列表不能为空');
      }
      if (chatIds.length > 100) {
        throw new Error('单次批量操作最多支持100个群组');
      }
      return true;
    }),
  
  body('status')
    .notEmpty()
    .withMessage('状态不能为空')
    .isIn(['active', 'inactive'])
    .withMessage('状态必须是active或inactive之一')
    .trim()
];

/**
 * 上传媒体文件验证规则（用于multer配置）
 */
exports.uploadMediaValidation = {
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    // 根据文件类型进行验证
    const allowedTypes = {
      'image': ['image/jpeg', 'image/png', 'image/gif'],
      'file': ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
      'video': ['video/mp4', 'video/avi', 'video/mov']
    };
    
    const fileType = req.params.type || 'image';
    
    if (allowedTypes[fileType] && allowedTypes[fileType].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`不支持的文件类型，允许的类型: ${allowedTypes[fileType]?.join(', ') || 'image/jpeg, image/png, image/gif'}`), false);
    }
  }
};

/**
 * 通用ID验证规则
 */
exports.idValidation = [
  param('id')
    .notEmpty()
    .withMessage('ID不能为空')
    .trim()
];