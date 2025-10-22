/**
 * 企业微信配置文件
 * 定义与企业微信API交互所需的配置参数
 */

// 从环境变量或默认值获取配置
const getEnv = (key, defaultValue) => {
  return process.env[key] || defaultValue;
};

/**
 * 企业微信配置
 */
const wechatWorkConfig = {
  // 企业ID
  corpid: getEnv('WECHAT_WORK_CORPID', 'wwXXXXXXXXXXXXXXXX'),
  
  // 应用密钥
  corpsecret: getEnv('WECHAT_WORK_CORPSECRET', 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'),
  
  // 应用ID
  agentid: getEnv('WECHAT_WORK_AGENTID', '1000001'),
  
  // 回调URL
  callbackUrl: getEnv('WECHAT_WORK_CALLBACK_URL', 'https://your-domain.com/api/wechat-work/callback'),
  
  // 消息加解密密钥
  encodingAESKey: getEnv('WECHAT_WORK_ENCODING_AES_KEY', 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'),
  
  // Token
  token: getEnv('WECHAT_WORK_TOKEN', 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'),
  
  // API请求超时时间（毫秒）
  requestTimeout: parseInt(getEnv('WECHAT_WORK_REQUEST_TIMEOUT', '10000'), 10),
  
  // 是否开启调试模式
  debug: getEnv('WECHAT_WORK_DEBUG', 'false') === 'true',
  
  // 外部群管理配置
  externalGroup: {
    // 每次获取群列表的最大数量
    maxListCount: parseInt(getEnv('WECHAT_WORK_EXTERNAL_GROUP_MAX_LIST_COUNT', '100'), 10),
    
    // 每次获取聊天记录的最大数量
    maxChatRecordsCount: parseInt(getEnv('WECHAT_WORK_EXTERNAL_GROUP_MAX_CHAT_RECORDS_COUNT', '50'), 10),
    
    // 群提醒有效期（天）
    reminderExpireDays: parseInt(getEnv('WECHAT_WORK_EXTERNAL_GROUP_REMINDER_EXPIRE_DAYS', '7'), 10)
  },
  
  // 消息发送配置
  message: {
    // 文本消息最大长度
    maxTextLength: parseInt(getEnv('WECHAT_WORK_MESSAGE_MAX_TEXT_LENGTH', '2000'), 10),
    
    // 图片消息最大大小（字节）
    maxImageSize: parseInt(getEnv('WECHAT_WORK_MESSAGE_MAX_IMAGE_SIZE', '2097152'), 10), // 2MB
    
    // 文件消息最大大小（字节）
    maxFileSize: parseInt(getEnv('WECHAT_WORK_MESSAGE_MAX_FILE_SIZE', '20971520'), 10), // 20MB
    
    // 视频消息最大大小（字节）
    maxVideoSize: parseInt(getEnv('WECHAT_WORK_MESSAGE_MAX_VIDEO_SIZE', '10485760'), 10), // 10MB
    
    // 批量发送消息的最大数量
    maxBatchSendCount: parseInt(getEnv('WECHAT_WORK_MESSAGE_MAX_BATCH_SEND_COUNT', '100'), 10)
  },
  
  // 媒体文件上传配置
  media: {
    // 允许的图片格式
    allowedImageFormats: ['jpg', 'jpeg', 'png', 'gif'],
    
    // 允许的文件格式
    allowedFileFormats: ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'pdf', 'txt', 'zip'],
    
    // 允许的视频格式
    allowedVideoFormats: ['mp4']
  },
  
  // 定时任务配置
  schedule: {
    // 同步群列表的定时任务表达式
    syncGroupListCron: getEnv('WECHAT_WORK_SCHEDULE_SYNC_GROUP_LIST_CRON', '0 */30 * * * *'), // 每30分钟执行一次
    
    // 清理过期消息记录的定时任务表达式
    cleanExpiredMessagesCron: getEnv('WECHAT_WORK_SCHEDULE_CLEAN_EXPIRED_MESSAGES_CRON', '0 0 1 * * *'), // 每天凌晨1点执行
    
    // 消息记录保留天数
    messageRetentionDays: parseInt(getEnv('WECHAT_WORK_SCHEDULE_MESSAGE_RETENTION_DAYS', '90'), 10)
  }
};

/**
 * 验证配置有效性
 * @returns {boolean} - 配置是否有效
 */
const validateConfig = () => {
  // 检查必要的配置项
  if (!wechatWorkConfig.corpid || wechatWorkConfig.corpid === 'wwXXXXXXXXXXXXXXXX') {
    console.error('警告: 企业微信配置未设置或使用默认值，请在生产环境中配置正确的企业ID');
  }
  
  if (!wechatWorkConfig.corpsecret || wechatWorkConfig.corpsecret === 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX') {
    console.error('警告: 企业微信配置未设置或使用默认值，请在生产环境中配置正确的应用密钥');
  }
  
  if (!wechatWorkConfig.agentid || wechatWorkConfig.agentid === '1000001') {
    console.error('警告: 企业微信配置未设置或使用默认值，请在生产环境中配置正确的应用ID');
  }
  
  return true;
};

// 验证配置
validateConfig();

module.exports = wechatWorkConfig;