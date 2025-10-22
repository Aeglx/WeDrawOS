/**
 * 速率限制中间件
 * 实现API请求频率控制，防止API滥用和DDoS攻击
 */

// 内存存储，实际生产环境可替换为Redis等持久化存储
class MemoryStore {
  constructor() {
    this.store = new Map();
  }

  /**
   * 获取IP的请求计数和过期时间
   */
  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;

    const { count, resetTime } = entry;
    // 检查是否过期
    if (Date.now() > resetTime) {
      this.store.delete(key);
      return null;
    }

    return { count, resetTime };
  }

  /**
   * 设置IP的请求计数和过期时间
   */
  set(key, value, ttl) {
    const resetTime = Date.now() + ttl;
    this.store.set(key, { ...value, resetTime });

    // 设置过期自动清理
    setTimeout(() => {
      if (this.store.has(key)) {
        const entry = this.store.get(key);
        if (entry.resetTime <= resetTime) {
          this.store.delete(key);
        }
      }
    }, ttl);
  }

  /**
   * 增加计数
   */
  increment(key, ttl) {
    const entry = this.get(key);
    
    if (entry) {
      // 已存在记录，增加计数
      const newCount = entry.count + 1;
      this.set(key, { count: newCount }, ttl);
      return { count: newCount, resetTime: entry.resetTime };
    } else {
      // 新记录，初始计数为1
      this.set(key, { count: 1 }, ttl);
      return { count: 1, resetTime: Date.now() + ttl };
    }
  }

  /**
   * 获取当前存储的大小
   */
  size() {
    // 清理过期记录
    for (const [key, { resetTime }] of this.store.entries()) {
      if (Date.now() > resetTime) {
        this.store.delete(key);
      }
    }
    return this.store.size;
  }
}

// 内存存储实例
const memoryStore = new MemoryStore();

/**
 * 生成速率限制键
 */
const generateKey = (req, options = {}) => {
  const { keyGenerator } = options;
  
  if (keyGenerator && typeof keyGenerator === 'function') {
    return keyGenerator(req);
  }
  
  // 默认使用IP地址作为限制键
  return req.ip || req.connection.remoteAddress;
};

/**
 * 速率限制中间件
 * @param {Object} options - 配置选项
 * @param {number} options.max - 时间窗口内的最大请求数
 * @param {number} options.windowMs - 时间窗口（毫秒）
 * @param {string} options.message - 限制时的错误消息
 * @param {number} options.statusCode - 限制时的HTTP状态码
 * @param {Function} options.keyGenerator - 自定义键生成函数
 * @param {Function} options.skip - 跳过限制的条件函数
 * @param {Function} options.onLimitReached - 达到限制时的回调函数
 * @param {Object} options.store - 存储实例，默认为内存存储
 */
export const rateLimiter = (options = {}) => {
  const {
    max = 100, // 默认时间窗口内最多100个请求
    windowMs = 60 * 1000, // 默认1分钟
    message = '请求过于频繁，请稍后再试',
    statusCode = 429,
    keyGenerator,
    skip,
    onLimitReached,
    store = memoryStore
  } = options;

  return (req, res, next) => {
    // 检查是否跳过限制
    if (skip && typeof skip === 'function' && skip(req, res)) {
      return next();
    }

    // 生成速率限制键
    const key = generateKey(req, { keyGenerator });
    
    // 增加计数
    const result = store.increment(key, windowMs);
    
    // 计算剩余请求数
    const remaining = Math.max(0, max - result.count);
    
    // 计算重置时间（秒）
    const resetTimeInSeconds = Math.ceil(result.resetTime / 1000);
    
    // 设置响应头
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetTimeInSeconds);
    res.setHeader('Retry-After', Math.ceil((result.resetTime - Date.now()) / 1000));

    // 检查是否超过限制
    if (result.count > max) {
      // 调用回调
      if (onLimitReached && typeof onLimitReached === 'function') {
        onLimitReached(req, res, options);
      }

      // 返回限制错误
      return res.status(statusCode).json({
        success: false,
        message,
        data: null,
        error: {
          code: 'RATE_LIMITED',
          limit: max,
          windowMs,
          resetTime: new Date(result.resetTime).toISOString()
        },
        timestamp: new Date().toISOString()
      });
    }

    next();
  };
};

/**
 * 基于用户的速率限制
 * 需要req.user对象存在
 */
export const userRateLimiter = (options = {}) => {
  return rateLimiter({
    ...options,
    keyGenerator: (req) => {
      // 如果用户已认证，使用用户ID作为键
      if (req.user && req.user.id) {
        return `user:${req.user.id}`;
      }
      // 未认证用户使用IP
      return req.ip || req.connection.remoteAddress;
    }
  });
};

/**
 * 基于API端点的速率限制
 */
export const endpointRateLimiter = (endpointOptions = {}) => {
  return (req, res, next) => {
    const endpointKey = `${req.method}:${req.path}`;
    const options = endpointOptions[endpointKey] || endpointOptions.default || {};
    
    const limiter = rateLimiter(options);
    limiter(req, res, next);
  };
};

/**
 * 阶梯式速率限制
 * 实现多级速率限制规则
 */
export const tieredRateLimiter = (tiers = []) => {
  return (req, res, next) => {
    // 按优先级应用限制规则
    for (const tier of tiers) {
      // 检查是否满足层级条件
      if (!tier.condition || tier.condition(req, res)) {
        const limiter = rateLimiter(tier.options);
        
        // 替换next函数，确保满足当前层级后继续检查后续层级
        const originalNext = next;
        limiter(req, res, () => {
          // 当前层级通过后，继续下一个层级或最终的next
          originalNext();
        });
        
        // 每个请求只应用一个层级的限制
        return;
      }
    }
    
    // 没有匹配的层级，直接通过
    next();
  };
};

/**
 * 指数退避限制器
 * 随着连续超限次数增加，惩罚时间也增加
 */
export class ExponentialBackoffRateLimiter {
  constructor(options = {}) {
    this.max = options.max || 100;
    this.windowMs = options.windowMs || 60 * 1000;
    this.baseDelayMs = options.baseDelayMs || 1000; // 基础延迟
    this.maxDelayMs = options.maxDelayMs || 30 * 1000; // 最大延迟
    this.store = options.store || memoryStore;
  }

  middleware() {
    return (req, res, next) => {
      const key = req.ip || req.connection.remoteAddress;
      const violationKey = `violation:${key}`;
      
      // 获取当前违规次数
      const violationInfo = this.store.get(violationKey) || { count: 0, lastViolation: 0 };
      
      // 应用指数退避惩罚
      if (violationInfo.count > 0) {
        const backoffTime = Math.min(
          this.baseDelayMs * Math.pow(2, violationInfo.count - 1),
          this.maxDelayMs
        );
        
        // 检查是否在惩罚期内
        if (Date.now() - violationInfo.lastViolation < backoffTime) {
          const waitTime = Math.ceil((violationInfo.lastViolation + backoffTime - Date.now()) / 1000);
          
          return res.status(429).json({
            success: false,
            message: `请求过于频繁，请在${waitTime}秒后重试`,
            data: null,
            error: {
              code: 'RATE_LIMITED',
              retryAfter: waitTime,
              backoffTier: violationInfo.count
            },
            timestamp: new Date().toISOString()
          });
        }
      }
      
      // 标准速率限制逻辑
      const result = this.store.increment(key, this.windowMs);
      
      // 设置响应头
      res.setHeader('X-RateLimit-Limit', this.max);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, this.max - result.count));
      res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000));
      
      // 检查是否超限
      if (result.count > this.max) {
        // 增加违规计数
        this.store.set(violationKey, {
          count: violationInfo.count + 1,
          lastViolation: Date.now()
        }, 60 * 60 * 1000); // 违规记录保留1小时
        
        // 计算下次允许的时间
        const backoffTime = Math.min(
          this.baseDelayMs * Math.pow(2, violationInfo.count),
          this.maxDelayMs
        );
        const waitTime = Math.ceil(backoffTime / 1000);
        
        return res.status(429).json({
          success: false,
          message: `请求过于频繁，请在${waitTime}秒后重试`,
          data: null,
          error: {
            code: 'RATE_LIMITED',
            retryAfter: waitTime,
            backoffTier: violationInfo.count + 1
          },
          timestamp: new Date().toISOString()
        });
      }
      
      next();
    };
  }
}

/**
 * 登录尝试限制器
 * 防止暴力破解登录
 */
export const loginRateLimiter = (options = {}) => {
  const {
    maxAttempts = 5, // 最大尝试次数
    windowMs = 15 * 60 * 1000, // 15分钟内
    message = '登录尝试次数过多，请15分钟后再试'
  } = options;

  return rateLimiter({
    max: maxAttempts,
    windowMs,
    message,
    keyGenerator: (req) => {
      // 基于用户名/邮箱和IP的组合键，防止针对特定账号的暴力攻击
      const identifier = req.body.username || req.body.email || 'unknown';
      const ip = req.ip || req.connection.remoteAddress;
      return `login:${identifier}:${ip}`;
    },
    onLimitReached: (req, res, options) => {
      // 可以在这里记录安全事件
      console.warn(`检测到可能的暴力登录尝试: ${req.body.username || req.body.email}, IP: ${req.ip}`);
    }
  });
};

/**
 * 批量操作限制器
 * 限制批量操作的大小和频率
 */
export const batchOperationRateLimiter = (options = {}) => {
  const {
    maxBatchSize = 100, // 最大批量大小
    maxOperationsPerMinute = 500, // 每分钟最大操作数
    message = '批量操作大小或频率超过限制'
  } = options;

  return (req, res, next) => {
    // 检查批量大小
    const items = req.body.items || req.body.ids || [];
    if (Array.isArray(items) && items.length > maxBatchSize) {
      return res.status(400).json({
        success: false,
        message: `批量操作大小不能超过${maxBatchSize}个项目`,
        data: null,
        error: {
          code: 'BATCH_SIZE_LIMIT_EXCEEDED',
          maxBatchSize
        },
        timestamp: new Date().toISOString()
      });
    }

    // 应用频率限制
    const rateLimiterOptions = {
      max: maxOperationsPerMinute,
      windowMs: 60 * 1000,
      message,
      // 基于用户ID（已认证）或IP
      keyGenerator: (req) => {
        if (req.user && req.user.id) {
          return `batch:user:${req.user.id}`;
        }
        return `batch:ip:${req.ip || req.connection.remoteAddress}`;
      }
    };

    const limiter = rateLimiter(rateLimiterOptions);
    limiter(req, res, next);
  };
};

/**
 * 高级速率限制配置
 */
export const advancedRateLimiters = {
  // 一般API限制
  general: rateLimiter({
    max: 100,
    windowMs: 60 * 1000, // 1分钟
    message: 'API请求过于频繁，请稍后再试'
  }),
  
  // 严格限制的API（如登录、注册等）
  strict: rateLimiter({
    max: 10,
    windowMs: 60 * 1000, // 1分钟
    message: '此接口请求过于频繁，请稍后再试'
  }),
  
  // 宽松限制的API
  relaxed: rateLimiter({
    max: 500,
    windowMs: 60 * 1000, // 1分钟
    message: 'API请求过于频繁，请稍后再试'
  }),
  
  // 基于IP的限制
  ipBased: rateLimiter({
    max: 200,
    windowMs: 60 * 1000,
    keyGenerator: (req) => req.ip || req.connection.remoteAddress
  })
};

export default {
  rateLimiter,
  userRateLimiter,
  endpointRateLimiter,
  tieredRateLimiter,
  ExponentialBackoffRateLimiter,
  loginRateLimiter,
  batchOperationRateLimiter,
  advancedRateLimiters,
  MemoryStore
};