/**
 * HTTP工具
 * 提供HTTP请求和响应处理功能
 */

const http = require('http');
const https = require('https');
const querystring = require('querystring');
const { EventEmitter } = require('events');
const { logger } = require('../logger');
const { cryptoUtils } = require('../crypto');
const { typeUtils } = require('../type');
const { stringUtils } = require('../string');
const { urlUtils } = require('../url');
const { timeUtils } = require('../time');
const { performanceUtils } = require('../performance');
const { validationUtils } = require('../validation');
const { logContext } = require('../logger/LogContext');

/**
 * HTTP方法枚举
 */
const HttpMethod = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH',
  HEAD: 'HEAD',
  OPTIONS: 'OPTIONS',
  CONNECT: 'CONNECT',
  TRACE: 'TRACE'
};

/**
 * 响应类型枚举
 */
const ResponseType = {
  JSON: 'json',
  TEXT: 'text',
  BUFFER: 'buffer',
  STREAM: 'stream',
  BLOB: 'blob'
};

/**
 * HTTP工具类
 * 提供HTTP请求和响应处理功能
 */
class HttpUtils extends EventEmitter {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   */
  constructor(options = {}) {
    super();

    this.options = {
      defaultTimeout: options.defaultTimeout || 30000,
      defaultRetryCount: options.defaultRetryCount || 3,
      defaultRetryDelay: options.defaultRetryDelay || 1000,
      maxConcurrentRequests: options.maxConcurrentRequests || 100,
      defaultHeaders: options.defaultHeaders || {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'HttpUtils/1.0'
      },
      followRedirects: options.followRedirects !== undefined ? options.followRedirects : true,
      maxRedirects: options.maxRedirects || 10,
      ...options
    };

    // 并发控制
    this._activeRequests = 0;
    this._requestQueue = [];
    this._isProcessingQueue = false;

    // 重试逻辑相关
    this._retryableStatuses = [408, 429, 500, 502, 503, 504];

    // 缓存
    this._cache = new Map();
    this._cacheSize = 0;
    this._maxCacheSize = options.maxCacheSize || 100;

    // 统计信息
    this.stats = {
      requests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      redirectedRequests: 0,
      cachedResponses: 0,
      totalResponseTime: 0,
      totalBytesSent: 0,
      totalBytesReceived: 0,
      retries: 0
    };

    // 延迟加载第三方依赖
    this._dependencies = {};

    // 设置最大监听器
    this.setMaxListeners(50);

    logger.debug('HTTP工具初始化完成', {
      defaultTimeout: this.options.defaultTimeout,
      followRedirects: this.options.followRedirects,
      maxConcurrentRequests: this.options.maxConcurrentRequests
    });
  }

  /**
   * 加载依赖模块
   * @param {string} moduleName - 模块名称
   * @returns {Promise<any>} 模块实例
   * @private
   */
  async _loadDependency(moduleName) {
    if (!this._dependencies[moduleName]) {
      try {
        this._dependencies[moduleName] = require(moduleName);
      } catch (error) {
        logger.warn(`无法加载依赖模块 ${moduleName}，某些功能可能不可用`, { error: error.message });
        this._dependencies[moduleName] = null;
      }
    }
    return this._dependencies[moduleName];
  }

  /**
   * 执行HTTP请求
   * @param {string|Object} url - URL字符串或请求配置
   * @param {Object} options - 请求选项
   * @returns {Promise<any>} 请求结果
   */
  async request(url, options = {}) {
    const requestId = logContext.getRequestId() || cryptoUtils.generateUUID();
    let startTime = performance.now();
    
    // 标准化请求配置
    const config = this._normalizeRequestConfig(url, options, requestId);
    
    // 检查缓存
    const cacheKey = this._generateCacheKey(config);
    if (config.useCache && this._hasCachedResponse(cacheKey, config.cacheTtl)) {
      const cachedResponse = this._getCachedResponse(cacheKey);
      
      logger.debug('使用缓存的响应', {
        url: config.url,
        method: config.method,
        cacheKey,
        requestId
      });
      
      // 更新统计信息
      this.stats.cachedResponses++;
      
      this.emit('http.cacheHit', {
        url: config.url,
        method: config.method,
        cacheKey
      });
      
      return cachedResponse;
    }

    // 并发控制
    if (this._activeRequests >= this.options.maxConcurrentRequests) {
      logger.debug('请求被加入队列等待处理', {
        url: config.url,
        method: config.method,
        activeRequests: this._activeRequests,
        maxConcurrentRequests: this.options.maxConcurrentRequests,
        requestId
      });
      
      return new Promise((resolve, reject) => {
        this._requestQueue.push({ config, resolve, reject, startTime });
        this._processRequestQueue();
      });
    }

    // 执行请求
    return this._executeRequest(config, startTime);
  }

  /**
   * 处理请求队列
   * @private
   */
  _processRequestQueue() {
    if (this._isProcessingQueue || this._requestQueue.length === 0 || 
        this._activeRequests >= this.options.maxConcurrentRequests) {
      return;
    }

    this._isProcessingQueue = true;

    try {
      while (this._requestQueue.length > 0 && 
             this._activeRequests < this.options.maxConcurrentRequests) {
        const { config, resolve, reject, startTime } = this._requestQueue.shift();
        
        logger.debug('从队列中处理请求', {
          url: config.url,
          method: config.method,
          queueLength: this._requestQueue.length,
          activeRequests: this._activeRequests,
          requestId: config.headers['X-Request-ID']
        });

        // 执行请求但不等待结果
        this._executeRequest(config, startTime).then(resolve).catch(reject);
      }
    } finally {
      this._isProcessingQueue = false;
    }
  }

  /**
   * 标准化请求配置
   * @param {string|Object} url - URL或配置
   * @param {Object} options - 选项
   * @param {string} requestId - 请求ID
   * @returns {Object} 标准化后的配置
   * @private
   */
  _normalizeRequestConfig(url, options, requestId) {
    // 如果url是对象，则视为完整配置
    if (typeUtils.isObject(url)) {
      options = url;
      url = options.url;
    }

    // 合并默认选项
    const config = {
      url: url,
      method: (options.method || HttpMethod.GET).toUpperCase(),
      headers: {
        ...this.options.defaultHeaders,
        ...options.headers,
        'X-Request-ID': requestId
      },
      timeout: options.timeout || this.options.defaultTimeout,
      retryCount: options.retryCount !== undefined ? options.retryCount : this.options.defaultRetryCount,
      retryDelay: options.retryDelay || this.options.defaultRetryDelay,
      followRedirects: options.followRedirects !== undefined ? options.followRedirects : this.options.followRedirects,
      maxRedirects: options.maxRedirects || this.options.maxRedirects,
      responseType: options.responseType || ResponseType.JSON,
      proxy: options.proxy,
      auth: options.auth,
      useCache: options.useCache || false,
      cacheTtl: options.cacheTtl || 300000, // 默认5分钟
      ...options
    };

    // 处理认证信息
    if (config.auth) {
      if (typeof config.auth === 'string') {
        config.headers['Authorization'] = config.auth;
      } else if (typeUtils.isObject(config.auth) && config.auth.username && config.auth.password) {
        const authString = `${config.auth.username}:${config.auth.password}`;
        config.headers['Authorization'] = `Basic ${Buffer.from(authString).toString('base64')}`;
      }
    }

    // 处理查询参数
    if (config.params && Object.keys(config.params).length > 0) {
      const parsedUrl = new URL(config.url);
      const existingParams = Object.fromEntries(parsedUrl.searchParams.entries());
      const mergedParams = { ...existingParams, ...config.params };
      parsedUrl.search = new URLSearchParams(mergedParams).toString();
      config.url = parsedUrl.toString();
    }

    // 处理请求体
    if (config.method !== HttpMethod.GET && config.method !== HttpMethod.HEAD) {
      if (config.data) {
        const contentType = config.headers['Content-Type'] || '';
        
        if (contentType.includes('application/json')) {
          config.body = JSON.stringify(config.data);
        } else if (contentType.includes('application/x-www-form-urlencoded')) {
          config.body = querystring.stringify(config.data);
        } else if (typeUtils.isString(config.data) || typeUtils.isBuffer(config.data)) {
          config.body = config.data;
        } else {
          // 默认转为JSON
          config.body = JSON.stringify(config.data);
          config.headers['Content-Type'] = 'application/json';
        }
      }
    }

    // 添加Content-Length头
    if (config.body) {
      const bodyLength = typeUtils.isBuffer(config.body) ? 
        config.body.length : Buffer.byteLength(config.body);
      config.headers['Content-Length'] = bodyLength.toString();
      
      // 更新统计信息
      this.stats.totalBytesSent += bodyLength;
    }

    return config;
  }

  /**
   * 执行HTTP请求
   * @param {Object} config - 请求配置
   * @param {number} startTime - 开始时间
   * @param {number} redirectCount - 重定向计数
   * @returns {Promise<any>} 请求结果
   * @private
   */
  async _executeRequest(config, startTime, redirectCount = 0) {
    const requestId = config.headers['X-Request-ID'];
    let attempts = 0;
    let lastError = null;

    // 增加活跃请求计数
    this._activeRequests++;
    
    try {
      // 更新统计信息
      this.stats.requests++;

      // 重试逻辑
      while (attempts <= config.retryCount) {
        attempts++;
        
        try {
          const result = await this._makeRequest(config, startTime, redirectCount);
          
          // 更新统计信息
          this.stats.successfulRequests++;
          
          // 缓存响应
          if (config.useCache && this._isCacheable(config, result)) {
            const cacheKey = this._generateCacheKey(config);
            this._cacheResponse(cacheKey, result, config.cacheTtl);
          }
          
          return result;
        } catch (error) {
          lastError = error;
          
          // 检查是否应该重试
          if (!this._shouldRetry(attempts, config, error)) {
            throw error;
          }
          
          // 计算重试延迟（指数退避）
          const delay = config.retryDelay * Math.pow(2, attempts - 1) + 
            Math.random() * 100; // 增加随机抖动
          
          logger.debug('请求失败，计划重试', {
            url: config.url,
            method: config.method,
            attempt: attempts,
            maxAttempts: config.retryCount + 1,
            delay: Math.round(delay),
            error: error.message,
            requestId
          });
          
          // 更新统计信息
          this.stats.retries++;
          
          // 等待延迟
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      // 所有重试都失败
      throw lastError;
    } catch (error) {
      // 更新统计信息
      this.stats.failedRequests++;
      
      const duration = performance.now() - startTime;
      performanceUtils.recordTimer('http.request.failure', duration);
      
      logger.error('HTTP请求失败', {
        url: config.url,
        method: config.method,
        error: error.message,
        duration,
        attempts,
        requestId
      });
      
      this.emit('http.requestError', {
        url: config.url,
        method: config.method,
        error: error.message,
        duration
      });
      
      throw error;
    } finally {
      // 减少活跃请求计数
      this._activeRequests--;
      
      // 处理队列中的下一个请求
      process.nextTick(() => this._processRequestQueue());
    }
  }

  /**
   * 执行单次HTTP请求
   * @param {Object} config - 请求配置
   * @param {number} startTime - 开始时间
   * @param {number} redirectCount - 重定向计数
   * @returns {Promise<any>} 请求结果
   * @private
   */
  _makeRequest(config, startTime, redirectCount) {
    const requestId = config.headers['X-Request-ID'];
    
    return new Promise((resolve, reject) => {
      // 解析URL
      const url = new URL(config.url);
      const isHttps = url.protocol === 'https:';
      const httpModule = isHttps ? https : http;

      // 构建请求选项
      const requestOptions = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method: config.method,
        headers: config.headers,
        auth: url.username && url.password ? `${url.username}:${url.password}` : undefined,
        ...(config.agent && { agent: config.agent }),
        ...(config.proxy && { proxy: config.proxy })
      };

      logger.debug('发送HTTP请求', {
        url: config.url,
        method: config.method,
        headers: this._sanitizeHeaders(config.headers),
        requestId
      });

      // 创建请求
      const req = httpModule.request(requestOptions, (res) => {
        // 处理重定向
        if (config.followRedirects && 
            [301, 302, 303, 307, 308].includes(res.statusCode) && 
            res.headers.location && 
            redirectCount < config.maxRedirects) {
          
          const redirectUrl = urlUtils.resolve(config.url, res.headers.location);
          
          logger.debug('处理HTTP重定向', {
            from: config.url,
            to: redirectUrl,
            statusCode: res.statusCode,
            redirectCount,
            maxRedirects: config.maxRedirects,
            requestId
          });
          
          // 更新统计信息
          this.stats.redirectedRequests++;
          
          this.emit('http.redirect', {
            from: config.url,
            to: redirectUrl,
            statusCode: res.statusCode
          });

          // 中止当前响应
          res.resume();
          
          // 发送重定向请求
          const redirectConfig = { ...config, url: redirectUrl };
          this._executeRequest(redirectConfig, startTime, redirectCount + 1)
            .then(resolve)
            .catch(reject);
          
          return;
        }

        // 处理响应
        this._processResponse(config, res, startTime, requestId)
          .then(resolve)
          .catch(reject);
      });

      // 设置超时
      req.setTimeout(config.timeout, () => {
        req.abort();
        reject(new Error(`请求超时: ${config.timeout}ms`));
      });

      // 处理错误
      req.on('error', (error) => {
        reject(new Error(`请求错误: ${error.message}`));
      });

      // 发送请求体
      if (config.body) {
        req.write(config.body);
      }

      // 结束请求
      req.end();
    });
  }

  /**
   * 处理HTTP响应
   * @param {Object} config - 请求配置
   * @param {Object} res - HTTP响应对象
   * @param {number} startTime - 开始时间
   * @param {string} requestId - 请求ID
   * @returns {Promise<any>} 处理后的响应
   * @private
   */
  async _processResponse(config, res, startTime, requestId) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      let totalBytes = 0;

      // 收集响应数据
      res.on('data', (chunk) => {
        chunks.push(chunk);
        totalBytes += chunk.length;
      });

      // 响应结束
      res.on('end', async () => {
        // 更新统计信息
        this.stats.totalBytesReceived += totalBytes;
        
        const duration = performance.now() - startTime;
        this.stats.totalResponseTime += duration;
        
        performanceUtils.recordTimer('http.response', duration);
        
        // 构建响应数据
        const buffer = Buffer.concat(chunks);
        let data = null;
        
        try {
          // 根据响应类型处理数据
          switch (config.responseType) {
            case ResponseType.JSON:
              try {
                data = JSON.parse(buffer.toString('utf8'));
              } catch (error) {
                // 如果不是有效的JSON，返回原始文本
                data = buffer.toString('utf8');
              }
              break;
            case ResponseType.TEXT:
              data = buffer.toString('utf8');
              break;
            case ResponseType.BUFFER:
              data = buffer;
              break;
            case ResponseType.STREAM:
              // 创建可读流
              const { Readable } = require('stream');
              data = new Readable();
              data._read = () => {};
              data.push(buffer);
              data.push(null);
              break;
            default:
              data = buffer;
          }
          
          // 构建响应对象
          const response = {
            data,
            status: res.statusCode,
            statusText: res.statusMessage,
            headers: res.headers,
            config,
            requestId,
            duration,
            size: totalBytes,
            fromCache: false
          };
          
          logger.debug('收到HTTP响应', {
            url: config.url,
            method: config.method,
            statusCode: res.statusCode,
            duration: Math.round(duration),
            size: totalBytes,
            requestId
          });
          
          this.emit('http.response', {
            url: config.url,
            method: config.method,
            statusCode: res.statusCode,
            duration,
            size: totalBytes
          });
          
          // 检查是否成功（2xx状态码）
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(response);
          } else {
            // 构建错误对象
            const error = new Error(`请求失败: ${res.statusCode} ${res.statusMessage}`);
            error.response = response;
            error.status = res.statusCode;
            reject(error);
          }
        } catch (error) {
          logger.error('处理响应数据失败', {
            url: config.url,
            method: config.method,
            error: error.message,
            requestId
          });
          reject(new Error(`处理响应失败: ${error.message}`));
        }
      });

      // 处理响应错误
      res.on('error', (error) => {
        reject(new Error(`响应错误: ${error.message}`));
      });
    });
  }

  /**
   * 检查是否应该重试请求
   * @param {number} attempts - 当前尝试次数
   * @param {Object} config - 请求配置
   * @param {Error} error - 错误对象
   * @returns {boolean} 是否应该重试
   * @private
   */
  _shouldRetry(attempts, config, error) {
    // 如果已经达到最大重试次数，不重试
    if (attempts > config.retryCount) {
      return false;
    }

    // 如果有响应且状态码在可重试范围内
    if (error.response && this._retryableStatuses.includes(error.response.status)) {
      return true;
    }

    // 网络错误、超时等
    const networkErrors = ['ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'ENOTFOUND'];
    if (error.code && networkErrors.includes(error.code)) {
      return true;
    }

    // 超时错误
    if (error.message && error.message.includes('超时')) {
      return true;
    }

    return false;
  }

  /**
   * 生成缓存键
   * @param {Object} config - 请求配置
   * @returns {string} 缓存键
   * @private
   */
  _generateCacheKey(config) {
    const parts = [
      config.method,
      config.url
    ];
    
    // 对于GET请求，只缓存相同的URL和参数
    if (config.method === HttpMethod.GET) {
      return parts.join('|');
    }
    
    // 对于其他方法，也考虑请求体
    if (config.body) {
      const bodyStr = typeUtils.isBuffer(config.body) ? 
        config.body.toString('hex') : config.body;
      parts.push(bodyStr);
    }
    
    return parts.join('|');
  }

  /**
   * 检查是否可缓存
   * @param {Object} config - 请求配置
   * @param {Object} response - 响应对象
   * @returns {boolean} 是否可缓存
   * @private
   */
  _isCacheable(config, response) {
    // 只缓存成功的GET请求
    if (config.method !== HttpMethod.GET || 
        !response || response.status < 200 || response.status >= 300) {
      return false;
    }
    
    // 检查响应头是否允许缓存
    const cacheControl = response.headers['cache-control'] || '';
    if (cacheControl.includes('no-store') || cacheControl.includes('private')) {
      return false;
    }
    
    return true;
  }

  /**
   * 检查是否有缓存的响应
   * @param {string} key - 缓存键
   * @param {number} ttl - 过期时间（毫秒）
   * @returns {boolean} 是否有有效缓存
   * @private
   */
  _hasCachedResponse(key, ttl) {
    const cached = this._cache.get(key);
    if (!cached) {
      return false;
    }
    
    const isExpired = cached.timestamp + ttl < Date.now();
    if (isExpired) {
      this._cache.delete(key);
      this._cacheSize--;
      return false;
    }
    
    return true;
  }

  /**
   * 获取缓存的响应
   * @param {string} key - 缓存键
   * @returns {Object} 缓存的响应
   * @private
   */
  _getCachedResponse(key) {
    const cached = this._cache.get(key);
    if (!cached) {
      return null;
    }
    
    // 返回缓存的数据并标记为来自缓存
    return {
      ...cached.data,
      fromCache: true,
      cachedAt: cached.timestamp
    };
  }

  /**
   * 缓存响应
   * @param {string} key - 缓存键
   * @param {Object} response - 响应对象
   * @param {number} ttl - 过期时间（毫秒）
   * @private
   */
  _cacheResponse(key, response, ttl) {
    // 如果缓存已满，删除最旧的项
    if (this._cacheSize >= this._maxCacheSize) {
      const oldestKey = this._getOldestCacheKey();
      if (oldestKey) {
        this._cache.delete(oldestKey);
        this._cacheSize--;
      }
    }
    
    // 存储响应
    this._cache.set(key, {
      data: response,
      timestamp: Date.now()
    });
    
    this._cacheSize++;
    
    logger.debug('响应已缓存', {
      key,
      ttl,
      cacheSize: this._cacheSize,
      maxCacheSize: this._maxCacheSize
    });
  }

  /**
   * 获取最旧的缓存键
   * @returns {string|null} 最旧的缓存键
   * @private
   */
  _getOldestCacheKey() {
    let oldestKey = null;
    let oldestTimestamp = Infinity;
    
    for (const [key, entry] of this._cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }
    
    return oldestKey;
  }

  /**
   * 清理缓存
   * @param {string} pattern - 可选的缓存键模式
   */
  clearCache(pattern = null) {
    if (pattern) {
      // 清理匹配模式的缓存
      const regex = new RegExp(pattern);
      for (const key of this._cache.keys()) {
        if (regex.test(key)) {
          this._cache.delete(key);
          this._cacheSize--;
        }
      }
    } else {
      // 清理所有缓存
      this._cache.clear();
      this._cacheSize = 0;
    }
    
    logger.debug('HTTP缓存已清理', {
      pattern,
      remainingSize: this._cacheSize
    });
  }

  /**
   * 清理敏感信息的头部
   * @param {Object} headers - 原始头部
   * @returns {Object} 清理后的头部
   * @private
   */
  _sanitizeHeaders(headers) {
    const sanitized = { ...headers };
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
    
    for (const header of sensitiveHeaders) {
      if (sanitized[header]) {
        sanitized[header] = '***REDACTED***';
      }
    }
    
    return sanitized;
  }

  /**
   * GET请求快捷方法
   * @param {string} url - URL
   * @param {Object} options - 选项
   * @returns {Promise<any>} 请求结果
   */
  async get(url, options = {}) {
    return this.request(url, {
      ...options,
      method: HttpMethod.GET
    });
  }

  /**
   * POST请求快捷方法
   * @param {string} url - URL
   * @param {Object} data - 请求数据
   * @param {Object} options - 选项
   * @returns {Promise<any>} 请求结果
   */
  async post(url, data, options = {}) {
    return this.request(url, {
      ...options,
      method: HttpMethod.POST,
      data
    });
  }

  /**
   * PUT请求快捷方法
   * @param {string} url - URL
   * @param {Object} data - 请求数据
   * @param {Object} options - 选项
   * @returns {Promise<any>} 请求结果
   */
  async put(url, data, options = {}) {
    return this.request(url, {
      ...options,
      method: HttpMethod.PUT,
      data
    });
  }

  /**
   * DELETE请求快捷方法
   * @param {string} url - URL
   * @param {Object} options - 选项
   * @returns {Promise<any>} 请求结果
   */
  async delete(url, options = {}) {
    return this.request(url, {
      ...options,
      method: HttpMethod.DELETE
    });
  }

  /**
   * PATCH请求快捷方法
   * @param {string} url - URL
   * @param {Object} data - 请求数据
   * @param {Object} options - 选项
   * @returns {Promise<any>} 请求结果
   */
  async patch(url, data, options = {}) {
    return this.request(url, {
      ...options,
      method: HttpMethod.PATCH,
      data
    });
  }

  /**
   * HEAD请求快捷方法
   * @param {string} url - URL
   * @param {Object} options - 选项
   * @returns {Promise<any>} 请求结果
   */
  async head(url, options = {}) {
    return this.request(url, {
      ...options,
      method: HttpMethod.HEAD
    });
  }

  /**
   * 批量执行请求
   * @param {Array} requests - 请求配置数组
   * @param {Object} options - 批量选项
   * @returns {Promise<Array>} 请求结果数组
   */
  async batch(requests, options = {}) {
    const concurrency = options.concurrency || 5;
    const results = [];
    let index = 0;

    // 批量执行函数
    const executeBatch = async () => {
      const batchResults = [];
      
      while (index < requests.length) {
        const batchSize = Math.min(concurrency, requests.length - index);
        const batchRequests = requests.slice(index, index + batchSize);
        index += batchSize;
        
        const batchPromises = batchRequests.map((req, i) => {
          const reqIndex = index - batchSize + i;
          return this.request(req)
            .then(result => ({ index: reqIndex, result }))
            .catch(error => ({ index: reqIndex, error }));
        });
        
        const batchResults = await Promise.all(batchPromises);
        batchResults.forEach(({ index: reqIndex, result, error }) => {
          if (error) {
            results[reqIndex] = { error: error.message };
          } else {
            results[reqIndex] = result;
          }
        });
        
        // 可选的批处理间隔
        if (options.batchInterval && index < requests.length) {
          await new Promise(resolve => setTimeout(resolve, options.batchInterval));
        }
      }
    };

    await executeBatch();
    return results;
  }

  /**
   * 创建Express中间件
   * @param {Object} options - 中间件选项
   * @returns {Function} Express中间件
   */
  createMiddleware(options = {}) {
    return (req, res, next) => {
      const startTime = performance.now();
      const requestId = req.headers['x-request-id'] || cryptoUtils.generateUUID();
      
      // 添加请求ID
      req.requestId = requestId;
      res.setHeader('X-Request-ID', requestId);
      
      // 记录请求开始
      logger.debug('HTTP请求开始', {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        requestId
      });
      
      // 监听响应完成
      const originalSend = res.send;
      res.send = function(body) {
        const duration = performance.now() - startTime;
        const responseSize = typeUtils.isBuffer(body) ? body.length : Buffer.byteLength(String(body));
        
        // 记录响应
        logger.debug('HTTP响应完成', {
          method: req.method,
          url: req.originalUrl,
          status: res.statusCode,
          duration: Math.round(duration),
          size: responseSize,
          requestId
        });
        
        // 发送原始响应
        return originalSend.call(this, body);
      };
      
      next();
    };
  }

  /**
   * 创建CORS中间件
   * @param {Object} options - CORS选项
   * @returns {Function} Express中间件
   */
  createCorsMiddleware(options = {}) {
    const corsOptions = {
      origin: options.origin || '*',
      methods: options.methods || ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: options.allowedHeaders || ['Content-Type', 'Authorization', 'X-Request-ID'],
      exposedHeaders: options.exposedHeaders || ['X-Request-ID'],
      credentials: options.credentials !== undefined ? options.credentials : true,
      maxAge: options.maxAge || 86400, // 24小时
      ...options
    };

    return (req, res, next) => {
      // 设置CORS头部
      if (typeof corsOptions.origin === 'function') {
        corsOptions.origin(req, (err, origin) => {
          if (err) return next(err);
          res.setHeader('Access-Control-Allow-Origin', origin);
          this._setCorsHeaders(res, corsOptions);
          this._handlePreflight(req, res, next, corsOptions);
        });
      } else {
        res.setHeader('Access-Control-Allow-Origin', corsOptions.origin);
        this._setCorsHeaders(res, corsOptions);
        this._handlePreflight(req, res, next, corsOptions);
      }
    };
  }

  /**
   * 设置CORS头部
   * @param {Object} res - Express响应对象
   * @param {Object} options - CORS选项
   * @private
   */
  _setCorsHeaders(res, options) {
    if (options.credentials) {
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    
    if (options.exposedHeaders.length > 0) {
      res.setHeader('Access-Control-Expose-Headers', options.exposedHeaders.join(', '));
    }
    
    if (options.maxAge) {
      res.setHeader('Access-Control-Max-Age', options.maxAge.toString());
    }
  }

  /**
   * 处理预检请求
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - 下一个中间件
   * @param {Object} options - CORS选项
   * @private
   */
  _handlePreflight(req, res, next, options) {
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', options.methods.join(', '));
      
      const requestHeaders = req.headers['access-control-request-headers'];
      if (requestHeaders) {
        res.setHeader('Access-Control-Allow-Headers', requestHeaders);
      } else if (options.allowedHeaders.length > 0) {
        res.setHeader('Access-Control-Allow-Headers', options.allowedHeaders.join(', '));
      }
      
      res.status(204).end();
    } else {
      next();
    }
  }

  /**
   * 获取统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    return {
      ...this.stats,
      activeRequests: this._activeRequests,
      queuedRequests: this._requestQueue.length,
      cacheSize: this._cacheSize,
      avgResponseTime: this.stats.successfulRequests > 0 ? 
        Math.round(this.stats.totalResponseTime / this.stats.successfulRequests) : 0
    };
  }

  /**
   * 重置统计信息
   */
  resetStats() {
    this.stats = {
      requests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      redirectedRequests: 0,
      cachedResponses: 0,
      totalResponseTime: 0,
      totalBytesSent: 0,
      totalBytesReceived: 0,
      retries: 0
    };
    
    logger.debug('HTTP工具统计信息已重置');
  }

  /**
   * 静态实例
   * @private
   */
  static _instance = null;

  /**
   * 获取单例实例
   * @param {Object} options - 配置选项
   * @returns {HttpUtils} HTTP工具实例
   */
  static getInstance(options = {}) {
    if (!HttpUtils._instance) {
      HttpUtils._instance = new HttpUtils(options);
    }
    return HttpUtils._instance;
  }

  /**
   * 创建新的HTTP工具实例
   * @param {Object} options - 配置选项
   * @returns {HttpUtils} HTTP工具实例
   */
  static create(options = {}) {
    return new HttpUtils(options);
  }
}

// 创建默认实例
const defaultHttpUtils = HttpUtils.getInstance();

module.exports = {
  HttpUtils,
  httpUtils: defaultHttpUtils,
  HttpMethod,
  ResponseType
};