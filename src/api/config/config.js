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
const config = {
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
    name: getEnv('DB_NAME', 'wedrawos_customer_service'),
    username: getEnv('DB_USERNAME', 'root'),
    password: getEnv('DB_PASSWORD', 'password'),
    host: getEnv('DB_HOST', 'localhost'),
    port: getEnvNumber('DB_PORT', 3306),
    dialect: getEnv('DB_DIALECT', 'mysql'),
    dialectOptions: {
      connectTimeout: getEnvNumber('DB_TIMEOUT', 10000)
    },
    pool: {
      max: getEnvNumber('DB_POOL_MAX', 10),
      min: getEnvNumber('DB_POOL_MIN', 0),
      acquire: getEnvNumber('DB_POOL_ACQUIRE', 30000),
      idle: getEnvNumber('DB_POOL_IDLE', 10000)
    },
    logging: getEnvBoolean('DB_LOGGING', false),
    timezone: '+08:00'
  },
  
  // 文件上传配置
  upload: {
    maxSize: getEnvNumber('UPLOAD_MAX_SIZE', 10 * 1024 * 1024), // 默认10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    tempDir: getEnv('UPLOAD_TEMP_DIR', './temp'),
    storagePath: getEnv('UPLOAD_STORAGE_PATH', './uploads')
  },
  
  // 邮件配置
  mail: {
    host: getEnv('MAIL_HOST', 'smtp.example.com'),
    port: getEnvNumber('MAIL_PORT', 587),
    secure: getEnvBoolean('MAIL_SECURE', false),
    auth: {
      user: getEnv('MAIL_USER', 'your-email@example.com'),
      pass: getEnv('MAIL_PASS', 'your-email-password')
    },
    from: getEnv('MAIL_FROM', 'WeDrawOS 客服系统 <noreply@example.com>')
  },
  
  // WebSocket配置
  websocket: {
    pingInterval: getEnvNumber('WS_PING_INTERVAL', 30000),
    maxConnections: getEnvNumber('WS_MAX_CONNECTIONS', 1000),
    maxMessageSize: getEnvNumber('WS_MAX_MESSAGE_SIZE', 1024 * 1024) // 1MB
  },
  
  // Redis配置
  redis: {
    host: getEnv('REDIS_HOST', 'localhost'),
    port: getEnvNumber('REDIS_PORT', 6379),
    password: getEnv('REDIS_PASSWORD', ''),
    db: getEnvNumber('REDIS_DB', 0),
    maxRetriesPerRequest: getEnvNumber('REDIS_MAX_RETRIES', 5)
  },
  
  // 自动回复配置
  autoReply: {
    enabled: getEnvBoolean('AUTO_REPLY_ENABLED', true),
    delay: getEnvNumber('AUTO_REPLY_DELAY', 2000), // 毫秒
    maxAttempts: getEnvNumber('AUTO_REPLY_MAX_ATTEMPTS', 3)
  },
  
  // 通知配置
  notification: {
    enabled: getEnvBoolean('NOTIFICATION_ENABLED', true),
    pollingInterval: getEnvNumber('NOTIFICATION_POLLING_INTERVAL', 30000), // 30秒
    maxStored: getEnvNumber('NOTIFICATION_MAX_STORED', 100)
  },
  
  // 工作时间配置
  workHours: {
    start: getEnv('WORK_HOURS_START', '09:00'),
    end: getEnv('WORK_HOURS_END', '18:00'),
    weekdays: [1, 2, 3, 4, 5] // 周一到周五
  }
};

/**
 * 获取指定配置
 * @param {string} key - 配置键，支持点号分隔获取嵌套配置
 * @returns {*} 配置值
 */
const getConfig = (key) => {
  if (!key) return config;
  
  const parts = key.split('.');
  let current = config;
  
  for (const part of parts) {
    if (current[part] === undefined) {
      return undefined;
    }
    current = current[part];
  }
  
  return current;
};

// JWT配置的快捷方式
const jwtSecret = config.jwt.secret;
const jwtRefreshSecret = config.jwt.refreshSecret;
const jwtExpiration = config.jwt.expiration;
const jwtRefreshExpiration = config.jwt.refreshExpiration;

// 导出配置
module.exports = {
  config,
  getConfig,
  jwtSecret,
  jwtRefreshSecret,
  jwtExpiration,
  jwtRefreshExpiration
};