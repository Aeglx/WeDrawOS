/**
 * 网络工具
 * 提供HTTP客户端和网络请求功能
 */

const https = require('https');
const http = require('http');
const querystring = require('querystring');
const url = require('url');
const zlib = require('zlib');
const logger = require('../logger');
const { AppError } = require('../../exception/handlers/errorHandler');
const { NetworkError } = require('../../exception/handlers/errorHandler');

/**
 * HTTP方法类型
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
 * 内容类型
 */
const ContentType = {
  JSON: 'application/json',
  FORM_URLENCODED: 'application/x-www-form-urlencoded',
  FORM_DATA: 'multipart/form-data',
  TEXT_PLAIN: 'text/plain',
  TEXT_HTML: 'text/html',
  XML: 'application/xml',
  BINARY: 'application/octet-stream'
};

/**
 * 压缩类型
 */
const CompressionType = {
  GZIP: 'gzip',
  DEFLATE: 'deflate',
  BR: 'br'
};

/**
 * HTTP客户端类
 */
class HttpClient {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   */
  constructor(options = {}) {
    this.options = {
      baseURL: options.baseURL || '',
      timeout: options.timeout || 30000,
      maxRedirects: options.maxRedirects || 10,
      retryCount: options.retryCount || 3,
      retryDelay: options.retryDelay || 1000,
      retryableStatusCodes: options.retryableStatusCodes || [429, 500, 502, 503, 504],
      headers: options.headers || {},
      auth: options.auth || null,
      httpsAgent: options.httpsAgent || null,
      httpAgent: options.httpAgent || null,
      maxSockets: options.maxSockets || 100,
      keepAlive: options.keepAlive !== false,
      compress: options.compress !== false,
      validateStatus: options.validateStatus || ((status) => status >= 200 && status < 300),
      ...options
    };

    // 创建HTTP/HTTPS代理
    this._createAgents();
    
    // 请求计数器
    this.requestCount = 0;
    this.activeRequests = 0;
    this.completedRequests = 0;
    
    logger.debug('HTTP客户端初始化完成', {
      baseURL: this.options.baseURL,
      timeout: this.options.timeout,
      retryCount: this.options.retryCount
    });
  }

  /**
   * 创建HTTP/HTTPS代理
   * @private
   */
  _createAgents() {
    const agentOptions = {
      maxSockets: this.options.maxSockets,
      keepAlive: this.options.keepAlive,
      keepAliveMsecs: this.options.keepAliveMsecs || 1000
    };

    if (!this.options.httpAgent) {
      this.httpAgent = new http.Agent(agentOptions);
    }

    if (!this.options.httpsAgent) {
      this.httpsAgent = new https.Agent({
        ...agentOptions,
        rejectUnauthorized: this.options.rejectUnauthorized !== false
      });
    }
  }

  /**
   * 构建请求URL
   * @private
   * @param {string} path - 请求路径
   * @param {Object} params - 查询参数
   * @returns {string} 完整URL
   */
  _buildURL(path, params = {}) {
    let fullURL = path;

    if (this.options.baseURL && !path.startsWith('http')) {
      fullURL = this.options.baseURL.replace(/\/$/, '') + '/' + path.replace(/^\//, '');
    }

    // 添加查询参数
    if (Object.keys(params).length > 0) {
      const urlObj = new URL(fullURL);
      const searchParams = new URLSearchParams(urlObj.search);

      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          if (Array.isArray(value)) {
            value.forEach(v => searchParams.append(key, v));
          } else {
            searchParams.set(key, value);
          }
        }
      });

      urlObj.search = searchParams.toString();
      fullURL = urlObj.toString();
    }

    return fullURL;
  }

  /**
   * 构建请求选项
   * @private
   * @param {string} method - HTTP方法
   * @param {string} url - 请求URL
   * @param {Object} options - 请求选项
   * @returns {Object} 请求选项对象
   */
  _buildRequestOptions(method, url, options = {}) {
    const parsedURL = new URL(url);
    const isHttps = parsedURL.protocol === 'https:';

    const requestOptions = {
      protocol: parsedURL.protocol,
      hostname: parsedURL.hostname,
      port: parsedURL.port || (isHttps ? 443 : 80),
      path: parsedURL.pathname + parsedURL.search,
      method: method.toUpperCase(),
      headers: {
        ...this.options.headers,
        ...options.headers,
        'Accept': options.headers?.['Accept'] || '*/*'
      },
      timeout: options.timeout || this.options.timeout,
      maxRedirects: options.maxRedirects || this.options.maxRedirects
    };

    // 设置压缩支持
    if (this.options.compress) {
      requestOptions.headers['Accept-Encoding'] = requestOptions.headers['Accept-Encoding'] || 'gzip, deflate, br';
    }

    // 设置授权信息
    if (this.options.auth && !options.headers?.['Authorization']) {
      if (this.options.auth.type === 'basic') {
        const authString = `${this.options.auth.username}:${this.options.auth.password}`;
        requestOptions.headers['Authorization'] = `Basic ${Buffer.from(authString).toString('base64')}`;
      } else if (this.options.auth.type === 'bearer') {
        requestOptions.headers['Authorization'] = `Bearer ${this.options.auth.token}`;
      }
    }

    // 设置代理
    requestOptions.agent = isHttps ? this.httpsAgent : this.httpAgent;

    return requestOptions;
  }

  /**
   * 处理请求体
   * @private
   * @param {Object|string|Buffer} data - 请求数据
   * @param {Object} headers - 请求头
   * @returns {Buffer|string} 处理后的请求体
   */
  _processRequestBody(data, headers) {
    if (!data) return null;

    const contentType = headers['Content-Type'] || headers['content-type'];

    if (typeof data === 'object' && !Buffer.isBuffer(data) && contentType?.includes('json')) {
      return JSON.stringify(data);
    } else if (typeof data === 'object' && !Buffer.isBuffer(data) && contentType?.includes('urlencoded')) {
      return querystring.stringify(data);
    } else if (Buffer.isBuffer(data) || typeof data === 'string') {
      return data;
    }

    return JSON.stringify(data);
  }

  /**
   * 处理响应数据
   * @private
   * @param {Buffer} responseData - 响应数据
   * @param {Object} response - 响应对象
   * @returns {Promise<any>} 处理后的响应数据
   */
  async _processResponseData(responseData, response) {
    const contentEncoding = response.headers['content-encoding'];
    let解压数据 = responseData;

    // 处理压缩数据
    if (contentEncoding === CompressionType.GZIP) {
     解压数据 = await this._gunzip(responseData);
    } else if (contentEncoding === CompressionType.DEFLATE) {
     解压数据 = await this._inflate(responseData);
    } else if (contentEncoding === CompressionType.BR) {
     解压数据 = await this._brotliDecompress(responseData);
    }

    // 转换为字符串
    const text = 解压数据.toString('utf8');

    // 尝试解析JSON
    const contentType = response.headers['content-type'];
    if (contentType && contentType.includes('application/json')) {
      try {
        return JSON.parse(text);
      } catch (e) {
        logger.warn('响应数据不是有效的JSON', { contentType });
      }
    }

    return text;
  }

  /**
   * GZIP解压
   * @private
   * @param {Buffer} data - 压缩数据
   * @returns {Promise<Buffer>} 解压后的数据
   */
  _gunzip(data) {
    return new Promise((resolve, reject) => {
      zlib.gunzip(data, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  /**
   * DEFLATE解压
   * @private
   * @param {Buffer} data - 压缩数据
   * @returns {Promise<Buffer>} 解压后的数据
   */
  _inflate(data) {
    return new Promise((resolve, reject) => {
      zlib.inflate(data, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  /**
   * Brotli解压
   * @private
   * @param {Buffer} data - 压缩数据
   * @returns {Promise<Buffer>} 解压后的数据
   */
  _brotliDecompress(data) {
    return new Promise((resolve, reject) => {
      zlib.brotliDecompress(data, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  /**
   * 执行HTTP请求
   * @private
   * @param {Object} options - 请求选项
   * @param {Buffer|string} body - 请求体
   * @returns {Promise<Object>} 响应对象
   */
  _executeRequest(options, body) {
    return new Promise((resolve, reject) => {
      const isHttps = options.protocol === 'https:';
      const httpModule = isHttps ? https : http;

      const req = httpModule.request(options, (res) => {
        let responseData = [];

        res.on('data', (chunk) => {
          responseData.push(chunk);
        });

        res.on('end', async () => {
          try {
            const buffer = Buffer.concat(responseData);
            const data = await this._processResponseData(buffer, res);

            const response = {
              status: res.statusCode,
              statusText: res.statusMessage,
              headers: res.headers,
              data,
              config: options
            };

            resolve(response);
          } catch (error) {
            reject(new NetworkError(`响应处理失败: ${error.message}`, {
              code: 'RESPONSE_PROCESS_ERROR',
              cause: error,
              status: res.statusCode
            }));
          }
        });
      });

      req.on('error', (error) => {
        reject(new NetworkError(`请求发送失败: ${error.message}`, {
          code: 'REQUEST_SEND_ERROR',
          cause: error,
          requestOptions: options
        }));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new NetworkError(`请求超时 (${options.timeout}ms)`, {
          code: 'REQUEST_TIMEOUT',
          requestOptions: options
        }));
      });

      // 发送请求体
      if (body) {
        req.write(body);
      }

      req.end();
    });
  }

  /**
   * 重试请求
   * @private
   * @param {Function} fn - 要重试的函数
   * @param {number} retryCount - 重试次数
   * @param {number} retryDelay - 重试延迟
   * @returns {Promise<any>} 请求结果
   */
  async _retryRequest(fn, retryCount, retryDelay) {
    let lastError;

    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        if (attempt > 0) {
          const delay = retryDelay * Math.pow(2, attempt - 1); // 指数退避
          logger.debug(`请求重试中 (${attempt}/${retryCount})，等待 ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        return await fn();
      } catch (error) {
        lastError = error;

        // 检查是否应该重试
        if (!this._shouldRetry(error, attempt, retryCount)) {
          throw error;
        }

        logger.warn(`请求失败，将重试 (${attempt + 1}/${retryCount})`, {
          error: error.message,
          status: error.status
        });
      }
    }

    throw lastError;
  }

  /**
   * 判断是否应该重试请求
   * @private
   * @param {Error} error - 错误对象
   * @param {number} attempt - 当前尝试次数
   * @param {number} maxAttempts - 最大尝试次数
   * @returns {boolean} 是否应该重试
   */
  _shouldRetry(error, attempt, maxAttempts) {
    if (attempt >= maxAttempts) return false;

    // 网络错误应该重试
    if (error.code === 'REQUEST_SEND_ERROR') return true;

    // 超时应该重试
    if (error.code === 'REQUEST_TIMEOUT') return true;

    // 根据状态码判断
    if (error.status && this.options.retryableStatusCodes.includes(error.status)) {
      return true;
    }

    return false;
  }

  /**
   * 发送HTTP请求
   * @param {string} method - HTTP方法
   * @param {string} path - 请求路径
   * @param {Object} options - 请求选项
   * @returns {Promise<Object>} 响应对象
   */
  async request(method, path, options = {}) {
    const startTime = Date.now();
    this.requestCount++;
    this.activeRequests++;

    try {
      // 构建完整URL
      const fullURL = this._buildURL(path, options.params);
      
      // 构建请求选项
      const requestOptions = this._buildRequestOptions(method, fullURL, options);
      
      // 处理请求体
      const body = this._processRequestBody(options.data, requestOptions.headers);
      
      // 设置Content-Length
      if (body && !requestOptions.headers['Content-Length'] && !requestOptions.headers['content-length']) {
        const length = Buffer.byteLength(body);
        requestOptions.headers['Content-Length'] = length;
      }

      // 执行请求（带重试）
      const retryCount = options.retryCount ?? this.options.retryCount;
      const retryDelay = options.retryDelay ?? this.options.retryDelay;
      
      const response = await this._retryRequest(
        () => this._executeRequest(requestOptions, body),
        retryCount,
        retryDelay
      );

      // 验证响应状态
      const validateStatus = options.validateStatus ?? this.options.validateStatus;
      if (!validateStatus(response.status)) {
        throw new NetworkError(
          `请求失败: ${response.status} ${response.statusText}`,
          {
            code: 'HTTP_ERROR',
            status: response.status,
            response
          }
        );
      }

      // 计算请求时间
      const duration = Date.now() - startTime;
      
      if (this.options.debug || duration > 1000) {
        logger.debug(`HTTP请求完成`, {
          method,
          url: fullURL,
          status: response.status,
          duration: `${duration}ms`
        });
      }

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error(`HTTP请求失败`, {
        method,
        url: path,
        error: error.message,
        duration: `${duration}ms`,
        stack: error.stack
      });
      
      throw error;
    } finally {
      this.activeRequests--;
      this.completedRequests++;
    }
  }

  /**
   * 发送GET请求
   * @param {string} path - 请求路径
   * @param {Object} options - 请求选项
   * @returns {Promise<Object>} 响应对象
   */
  get(path, options = {}) {
    return this.request(HttpMethod.GET, path, options);
  }

  /**
   * 发送POST请求
   * @param {string} path - 请求路径
   * @param {Object|string|Buffer} data - 请求数据
   * @param {Object} options - 请求选项
   * @returns {Promise<Object>} 响应对象
   */
  post(path, data, options = {}) {
    // 设置默认Content-Type
    if (!options.headers?.['Content-Type'] && !options.headers?.['content-type']) {
      if (typeof data === 'object' && !Buffer.isBuffer(data)) {
        options.headers = {
          ...options.headers,
          'Content-Type': ContentType.JSON
        };
      }
    }
    
    return this.request(HttpMethod.POST, path, { ...options, data });
  }

  /**
   * 发送PUT请求
   * @param {string} path - 请求路径
   * @param {Object|string|Buffer} data - 请求数据
   * @param {Object} options - 请求选项
   * @returns {Promise<Object>} 响应对象
   */
  put(path, data, options = {}) {
    // 设置默认Content-Type
    if (!options.headers?.['Content-Type'] && !options.headers?.['content-type']) {
      if (typeof data === 'object' && !Buffer.isBuffer(data)) {
        options.headers = {
          ...options.headers,
          'Content-Type': ContentType.JSON
        };
      }
    }
    
    return this.request(HttpMethod.PUT, path, { ...options, data });
  }

  /**
   * 发送DELETE请求
   * @param {string} path - 请求路径
   * @param {Object} options - 请求选项
   * @returns {Promise<Object>} 响应对象
   */
  delete(path, options = {}) {
    return this.request(HttpMethod.DELETE, path, options);
  }

  /**
   * 发送PATCH请求
   * @param {string} path - 请求路径
   * @param {Object|string|Buffer} data - 请求数据
   * @param {Object} options - 请求选项
   * @returns {Promise<Object>} 响应对象
   */
  patch(path, data, options = {}) {
    // 设置默认Content-Type
    if (!options.headers?.['Content-Type'] && !options.headers?.['content-type']) {
      if (typeof data === 'object' && !Buffer.isBuffer(data)) {
        options.headers = {
          ...options.headers,
          'Content-Type': ContentType.JSON
        };
      }
    }
    
    return this.request(HttpMethod.PATCH, path, { ...options, data });
  }

  /**
   * 发送HEAD请求
   * @param {string} path - 请求路径
   * @param {Object} options - 请求选项
   * @returns {Promise<Object>} 响应对象
   */
  head(path, options = {}) {
    return this.request(HttpMethod.HEAD, path, options);
  }

  /**
   * 发送OPTIONS请求
   * @param {string} path - 请求路径
   * @param {Object} options - 请求选项
   * @returns {Promise<Object>} 响应对象
   */
  options(path, options = {}) {
    return this.request(HttpMethod.OPTIONS, path, options);
  }

  /**
   * 设置基础URL
   * @param {string} baseURL - 基础URL
   * @returns {HttpClient} 当前实例（支持链式调用）
   */
  setBaseURL(baseURL) {
    this.options.baseURL = baseURL;
    return this;
  }

  /**
   * 设置默认头部
   * @param {Object} headers - 头部对象
   * @returns {HttpClient} 当前实例（支持链式调用）
   */
  setDefaultHeaders(headers) {
    this.options.headers = { ...this.options.headers, ...headers };
    return this;
  }

  /**
   * 设置超时时间
   * @param {number} timeout - 超时时间（毫秒）
   * @returns {HttpClient} 当前实例（支持链式调用）
   */
  setTimeout(timeout) {
    this.options.timeout = timeout;
    return this;
  }

  /**
   * 设置重试配置
   * @param {number} count - 重试次数
   * @param {number} delay - 重试延迟（毫秒）
   * @returns {HttpClient} 当前实例（支持链式调用）
   */
  setRetryConfig(count, delay) {
    this.options.retryCount = count;
    this.options.retryDelay = delay;
    return this;
  }

  /**
   * 获取请求统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    return {
      requestCount: this.requestCount,
      activeRequests: this.activeRequests,
      completedRequests: this.completedRequests
    };
  }

  /**
   * 创建请求拦截器
   * @param {Function} onFulfilled - 成功拦截函数
   * @param {Function} onRejected - 失败拦截函数
   * @returns {number} 拦截器ID
   */
  addRequestInterceptor(onFulfilled, onRejected) {
    // 此处可以实现请求拦截器功能
    logger.warn('请求拦截器功能暂未实现');
    return -1;
  }

  /**
   * 创建响应拦截器
   * @param {Function} onFulfilled - 成功拦截函数
   * @param {Function} onRejected - 失败拦截函数
   * @returns {number} 拦截器ID
   */
  addResponseInterceptor(onFulfilled, onRejected) {
    // 此处可以实现响应拦截器功能
    logger.warn('响应拦截器功能暂未实现');
    return -1;
  }

  /**
   * 关闭连接池
   */
  close() {
    if (this.httpAgent) {
      this.httpAgent.destroy();
    }
    if (this.httpsAgent) {
      this.httpsAgent.destroy();
    }
    
    logger.debug('HTTP客户端连接池已关闭');
  }

  /**
   * 静态实例
   * @private
   */
  static _instance = null;

  /**
   * 获取单例实例
   * @param {Object} options - 配置选项
   * @returns {HttpClient} HTTP客户端实例
   */
  static getInstance(options = {}) {
    if (!HttpClient._instance) {
      HttpClient._instance = new HttpClient(options);
    }
    return HttpClient._instance;
  }

  /**
   * 创建新的HTTP客户端实例
   * @param {Object} options - 配置选项
   * @returns {HttpClient} HTTP客户端实例
   */
  static create(options = {}) {
    return new HttpClient(options);
  }

  /**
   * 获取HTTP方法枚举
   * @returns {Object} HTTP方法枚举
   */
  static getHttpMethod() {
    return { ...HttpMethod };
  }

  /**
   * 获取内容类型枚举
   * @returns {Object} 内容类型枚举
   */
  static getContentType() {
    return { ...ContentType };
  }

  /**
   * 获取压缩类型枚举
   * @returns {Object} 压缩类型枚举
   */
  static getCompressionType() {
    return { ...CompressionType };
  }
}

// 创建默认实例
const defaultHttpClient = HttpClient.getInstance();

module.exports = {
  HttpClient,
  HttpMethod,
  ContentType,
  CompressionType,
  httpClient: defaultHttpClient
};