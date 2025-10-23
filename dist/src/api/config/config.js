/**
 * 客服系统配置文件
 * 集中管理系统配置项
 */

// 从环境变量或默认值获取配置
const getEnv = (key, defaultValue) => {
  return process.env[key] !== undefined ? process.env[key] : defaultValue;
};

const getEnvNumber = (key, defaultValue) => {
  const value = process.env[key];
  return value !== undefined ? parseInt(value, 10) : defaultValue;
};

const getEnvBoolean = (key, defaultValue) => {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true';
};

/**
 * 系统配置对象
 */
export const config = {
  // 应用基本配置
  app: {
    name: getEnv('APP_NAME', 'WeDrawOS 客服系统'),
    version: getEnv('APP_VERSION', '1.0.0'),
    environment: getEnv('NODE_ENV', 'development'),
    debug: getEnvBoolean('DEBUG', true)
  },
  
  // 服务器配置
  server: {
    port: getEnvNumber('SERVER_PORT', 3000),
    host: getEnv('SERVER_HOST', '0.0.0.0'),
    timeout: getEnvNumber('SERVER_TIMEOUT', 30000)
  },
  
  // JWT配置
  jwt: {
    secret: getEnv('JWT_SECRET', 'your-secret-key-change-in-production'),
    refreshSecret: getEnv('JWT_REFRESH_SECRET', 'your-refresh-secret-key-change-in-production'),
    expiration: getEnv('JWT_EXPIRATION', '1h'),
    refreshExpiration: getEnv('JWT_REFRESH_EXPIRATION', '7d'),
    issuer: getEnv('JWT_ISSUER', 'wedrawos-customer-service'),
    audience: getEnv('JWT_AUDIENCE', 'wedrawos-users')
  },
  
  // 数据库配置
  database: {
    host: getEnv('DB_HOST', 'localhost'),
    port: getEnvNumber('DB_PORT', 5432),
    username: getEnv('DB_USERNAME', 'postgres'),
    password: getEnv('DB_PASSWORD', 'password'),
    database: getEnv('DB_NAME', 'wedrawos_customer_service'),
    dialect: getEnv('DB_DIALECT', 'postgres'),
    pool: {
      max: getEnvNumber('DB_POOL_MAX', 10),
      min: getEnvNumber('DB_POOL_MIN', 0),
      acquire: getEnvNumber('DB_POOL_ACQUIRE', 30000),
      idle: getEnvNumber('DB_POOL_IDLE', 10000)
    },
    logging: getEnvBoolean('DB_LOGGING', false)
  },
  
  // Redis配置（用于会话存储和缓存）
  redis: {
    host: getEnv('REDIS_HOST', 'localhost'),
    port: getEnvNumber('REDIS_PORT', 6379),
    password: getEnv('REDIS_PASSWORD', ''),
    db: getEnvNumber('REDIS_DB', 0),
    keyPrefix: getEnv('REDIS_KEY_PREFIX', 'wedrawos:')
  },
  
  // WebSocket配置
  websocket: {
    heartbeatInterval: getEnvNumber('WS_HEARTBEAT_INTERVAL', 30000), // 30秒
    maxMessageSize: getEnvNumber('WS_MAX_MESSAGE_SIZE', 1024 * 1024), // 1MB
    reconnectDelay: getEnvNumber('WS_RECONNECT_DELAY', 1000),
    maxReconnectAttempts: getEnvNumber('WS_MAX_RECONNECT_ATTEMPTS', 5)
  },
  
  // 文件上传配置
  upload: {
    maxFileSize: getEnvNumber('UPLOAD_MAX_SIZE', 5 * 1024 * 1024), // 5MB
    allowedFormats: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'txt'],
    uploadPath: getEnv('UPLOAD_PATH', './uploads')
  },
  
  // 自动回复配置
  autoReply: {
    enabled: getEnvBoolean('AUTO_REPLY_ENABLED', true),
    defaultReplyDelay: getEnvNumber('AUTO_REPLY_DEFAULT_DELAY', 1000), // 1秒
    maxKeywords: getEnvNumber('AUTO_REPLY_MAX_KEYWORDS', 50),
    priorityLevels: getEnvNumber('AUTO_REPLY_PRIORITY_LEVELS', 10)
  },
  
  // 会话配置
  session: {
    timeout: getEnvNumber('SESSION_TIMEOUT', 30 * 60 * 1000), // 30分钟
    maxConcurrentSessionsPerAgent: getEnvNumber('SESSION_MAX_PER_AGENT', 10),
    autoAssignEnabled: getEnvBoolean('SESSION_AUTO_ASSIGN', true),
    unassignedTimeout: getEnvNumber('SESSION_UNASSIGNED_TIMEOUT', 5 * 60 * 1000) // 5分钟
  },
  
  // 统计配置
  statistics: {
    cacheTimeout: getEnvNumber('STATS_CACHE_TIMEOUT', 5 * 60 * 1000), // 5分钟
    batchSize: getEnvNumber('STATS_BATCH_SIZE', 1000),
    retentionDays: getEnvNumber('STATS_RETENTION_DAYS', 90)
  },
  
  // 通知配置
  notification: {
    enabled: getEnvBoolean('NOTIFICATION_ENABLED', true),
    emailEnabled: getEnvBoolean('EMAIL_NOTIFICATION_ENABLED', true),
    webhookEnabled: getEnvBoolean('WEBHOOK_NOTIFICATION_ENABLED', false)
  },
  
  // 安全配置
  security: {
    cors: {
      enabled: getEnvBoolean('CORS_ENABLED', true),
      origins: getEnv('CORS_ORIGINS', '*').split(',')
    },
    rateLimit: {
      enabled: getEnvBoolean('RATE_LIMIT_ENABLED', true),
      windowMs: getEnvNumber('RATE_LIMIT_WINDOW', 15 * 60 * 1000), // 15分钟
      maxRequests: getEnvNumber('RATE_LIMIT_MAX', 100)
    }
  },
  
  // 日志配置
  logging: {
    level: getEnv('LOG_LEVEL', 'info'),
    format: getEnv('LOG_FORMAT', 'json'),
    file: getEnv('LOG_FILE', './logs/app.log')
  }
};

/**
 * 获取特定部分的配置
 * @param {string} section - 配置部分
 * @returns {Object} 配置对象
 */
export const getConfig = (section) => {
  if (!section) return config;
  
  const parts = section.split('.');
  let current = config;
  
  for (const part of parts) {
    if (current[part] === undefined) {
      return undefined;
    }
    current = current[part];
  }
  
  return current;
};

// 导出JWT配置的快捷方式
export const jwtSecret = config.jwt.secret;
export const jwtRefreshSecret = config.jwt.refreshSecret;
export const jwtExpiration = config.jwt.expiration;
export const jwtRefreshExpiration = config.jwt.refreshExpiration;