/**
 * 配置管理模块
 * 统一管理应用的配置信息
 */

const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// 加载环境变量
const envFile = path.join(__dirname, '../../../../.env');
if (fs.existsSync(envFile)) {
  dotenv.config({ path: envFile });
} else {
  dotenv.config();
}

// 应用配置
const config = {
  // 服务器配置
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0',
    env: process.env.NODE_ENV || 'development'
  },

  // 数据库配置
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ecommerce',
    connectionLimit: process.env.DB_CONNECTION_LIMIT || 10,
    waitForConnections: true,
    queueLimit: 0
  },

  // Redis配置
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || '',
    db: process.env.REDIS_DB || 0
  },

  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET || 'your_secret_key_here',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },

  // 日志配置
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    dir: process.env.LOG_DIR || path.join(__dirname, '../../../../logs'),
    file: process.env.LOG_FILE || 'app.log',
    console: process.env.LOG_CONSOLE === 'true'
  },

  // 安全配置
  security: {
    rateLimit: {
      enabled: process.env.RATE_LIMIT_ENABLED === 'true',
      windowMs: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15分钟
      max: process.env.RATE_LIMIT_MAX || 100 // 每IP每分钟请求次数
    },
    cors: {
      enabled: process.env.CORS_ENABLED === 'true',
      origins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['*']
    },
    helmet: {
      enabled: process.env.HELMET_ENABLED === 'true'
    }
  },

  // 文件上传配置
  upload: {
    enabled: process.env.UPLOAD_ENABLED === 'true',
    directory: process.env.UPLOAD_DIR || path.join(__dirname, '../../../../uploads'),
    maxFileSize: process.env.UPLOAD_MAX_FILE_SIZE || 10 * 1024 * 1024, // 10MB
    allowedTypes: process.env.UPLOAD_ALLOWED_TYPES ? process.env.UPLOAD_ALLOWED_TYPES.split(',') : ['image/jpeg', 'image/png', 'image/gif']
  },

  // 缓存配置
  cache: {
    enabled: process.env.CACHE_ENABLED === 'true',
    defaultTTL: process.env.CACHE_DEFAULT_TTL || 3600, // 1小时
    productCacheTTL: process.env.CACHE_PRODUCT_TTL || 1800, // 30分钟
    userCacheTTL: process.env.CACHE_USER_TTL || 7200 // 2小时
  },

  // 业务配置
  business: {
    orderAutoCloseTime: process.env.ORDER_AUTO_CLOSE_TIME || 30, // 订单自动关闭时间（分钟）
    passwordMinLength: process.env.PASSWORD_MIN_LENGTH || 6,
    passwordMaxLength: process.env.PASSWORD_MAX_LENGTH || 20
  },

  // API配置
  api: {
    prefix: process.env.API_PREFIX || '/api',
    version: process.env.API_VERSION || 'v1',
    timeout: process.env.API_TIMEOUT || 30000 // 30秒
  },

  // 外部服务配置
  externalServices: {
    email: {
      enabled: process.env.EMAIL_ENABLED === 'true',
      host: process.env.EMAIL_HOST || 'smtp.example.com',
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      user: process.env.EMAIL_USER || '',
      password: process.env.EMAIL_PASSWORD || '',
      from: process.env.EMAIL_FROM || 'noreply@example.com'
    },
    sms: {
      enabled: process.env.SMS_ENABLED === 'true',
      provider: process.env.SMS_PROVIDER || '',
      apiKey: process.env.SMS_API_KEY || '',
      apiSecret: process.env.SMS_API_SECRET || ''
    }
  }
};

// 确保必要的目录存在
function ensureDirectories() {
  // 确保日志目录存在
  if (!fs.existsSync(config.logging.dir)) {
    fs.mkdirSync(config.logging.dir, { recursive: true });
  }

  // 确保上传目录存在
  if (config.upload.enabled && !fs.existsSync(config.upload.directory)) {
    fs.mkdirSync(config.upload.directory, { recursive: true });
  }
}

// 初始化配置
function initialize() {
  ensureDirectories();
  return config;
}

// 导出配置
exports = module.exports = initialize();

// 导出获取配置的方法
module.exports.get = function(path, defaultValue = null) {
  if (!path) {
    return config;
  }

  const parts = path.split('.');
  let value = config;

  for (const part of parts) {
    if (value === null || typeof value !== 'object') {
      return defaultValue;
    }
    value = value[part];
  }

  return value !== undefined ? value : defaultValue;
};

// 导出设置配置的方法（用于测试或运行时调整）
module.exports.set = function(path, value) {
  if (!path) {
    return false;
  }

  const parts = path.split('.');
  let target = config;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (target[part] === undefined || typeof target[part] !== 'object') {
      target[part] = {};
    }
    target = target[part];
  }

  target[parts[parts.length - 1]] = value;
  return true;
};

// 导出检查配置项是否存在的方法
module.exports.has = function(path) {
  if (!path) {
    return false;
  }

  const parts = path.split('.');
  let value = config;

  for (const part of parts) {
    if (value === null || typeof value !== 'object' || !(part in value)) {
      return false;
    }
    value = value[part];
  }

  return true;
};