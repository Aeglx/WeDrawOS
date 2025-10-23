/**
 * HTTP客户端工具
 * 提供HTTP请求处理、重试机制、错误处理等功能
 */

const http = require('http');
const https = require('https');
const url = require('url');
const { AppError } = require('../../exception/handlers/errorHandler');
const { CommonUtils } = require('../CommonUtils');
const logger = require('../logger');

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
  OPTIONS: 'OPTIONS'
};

/**
 * HTTP状态码常量
 */
const HttpStatusCode = {
  // 成功
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  // 重定向
  MOVED_PERMANENTLY: 301,
  FOUND: 302,
  NOT_MODIFIED: 304,
  // 客户端错误
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  // 服务器错误
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503
};

/**
 * HTTP请求配置类
 */
class RequestOptions {
  constructor(options = {}) {
    this.url = options.url || '';
    this.method = options.method || HttpMethod.GET;
    this.headers = options.headers || {};
    this.body = options.body;
    this.timeout = options.timeout || 30000; // 默认30秒
    this.retries = options.retries || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.maxRetryDelay = options.maxRetryDelay || 10000;
    this.retryFactor = options.retryFactor || 2;
    this.followRedirects = options.followRedirects !== false; // 默认跟随重定向
    this.maxRedirects = options.maxRedirects || 10;
    this.auth = options.auth;
    this.proxy = options.proxy;
    this.ssl = options.ssl || {};
    this.queryParams = options.queryParams;
    this.transformRequest = options.transformRequest;
    this.transformResponse = options.transformResponse;
  }

  /**
   * 设置URL
   * @param {string} url - 请求URL
   * @returns {RequestOptions} 当前实例
   */
  setUrl(url) {
    this.url = url;
    return this;
  }

  /**
   * 设置请求方法
   * @param {string} method - HTTP方法
   * @returns {RequestOptions} 当前实例
   */
  setMethod(method) {
    this.method = method;
    return this;
  }

  /**
   * 设置请求头
   * @param {Object|string} headersOrKey - 头信息对象或头名称
   * @param {string} value - 头值
   * @returns {RequestOptions} 当前实例
   */
  setHeader(headersOrKey, value) {
    if (typeof headersOrKey === 'object') {
      this.headers = { ...this.headers, ...headersOrKey };
    } else {
      this.headers[headersOrKey] = value;
    }
    return this;
  }

  /**
   * 设置请求体
   * @param {*} body - 请求体
   * @returns {RequestOptions} 当前实例
   */
  setBody(body) {
    this.body = body;
    return this;
  }

  /**
   * 设置超时时间
   * @param {number} timeout - 超时时间（毫秒）
   * @returns {RequestOptions} 当前实例
   */
  setTimeout(timeout) {
    this.timeout = timeout;
    return this;
  }

  /**
   * 设置重试选项
   * @param {number} retries - 重试次数
   * @param {number} delay - 初始延迟
   * @param {number} maxDelay - 最大延迟
   * @param {number} factor - 延迟增长因子
   * @returns {RequestOptions} 当前实例
   */
  setRetryOptions(retries, delay = 1000, maxDelay = 10000, factor = 2) {
    this.retries = retries;
    this.retryDelay = delay;
    this.maxRetryDelay = maxDelay;
    this.retryFactor = factor;
    return this;
  }

  /**
   * 启用或禁用重定向跟随
   * @param {boolean} follow - 是否跟随
   * @param {number} maxRedirects - 最大重定向次数
   * @returns {RequestOptions} 当前实例
   */
  setFollowRedirects(follow, maxRedirects = 10) {
    this.followRedirects = follow;
    this.maxRedirects = maxRedirects;
    return this;
  }

  /**
   * 设置认证信息
   * @param {Object|string} auth - 认证信息
   * @returns {RequestOptions} 当前实例
   */
  setAuth(auth) {
    this.auth = auth;
    return this;
  }

  /**
   * 设置代理
   * @param {string|Object} proxy - 代理配置
   * @returns {RequestOptions} 当前实例
   */
  setProxy(proxy) {
    this.proxy = proxy;
    return this;
  }

  /**
   * 设置SSL选项
   * @param {Object} ssl - SSL配置
   * @returns {RequestOptions} 当前实例
   */
  setSslOptions(ssl) {
    this.ssl = ssl;
    return this;
  }

  /**
   * 设置查询参数
   * @param {Object|string} params - 查询参数
   * @returns {RequestOptions} 当前实例
   */
  setQueryParams(params) {
    this.queryParams = params;
    return this;
  }
}

/**
 * HTTP响应类
 */
class HttpResponse {
  constructor(rawResponse, body) {
    this.status = rawResponse.statusCode;
    this.statusText = rawResponse.statusMessage;
    this.headers = rawResponse.headers;
    this.body = body;
    this.request = rawResponse.req;
    this.redirectCount = rawResponse.redirectCount || 0;
    this.timing = rawResponse.timing || {};
  }

  /**
   * 检查响应是否成功
   * @returns {boolean} 是否成功
   */
  isSuccess() {
    return this.status >= 200 && this.status < 300;
  }

  /**
   * 检查是否重定向
   * @returns {boolean} 是否重定向
   */
  isRedirect() {
    return this.status >= 300 && this.status < 400;
  }

  /**
   * 检查是否客户端错误
   * @returns {boolean} 是否客户端错误
   */
  isClientError() {
    return this.status >= 400 && this.status < 500;
  }

  /**
   * 检查是否服务器错误
   * @returns {boolean} 是否服务器错误
   */
  isServerError() {
    return this.status >= 500;
  }

  /**
   * 获取响应的JSON数据
   * @returns {*} JSON数据
   */
  json() {
    if (this.body && typeof this.body === 'string') {
      try {
        return JSON.parse(this.body);
      } catch (error) {
        throw new Error('响应体不是有效的JSON');
      }
    }
    return this.body;
  }

  /**
   * 获取响应的文本数据
   * @returns {string} 文本数据
   */
  text() {
    return this.body && typeof this.body !== 'string' ? JSON.stringify(this.body) : this.body;
  }
}

/**
 * HTTP客户端类
 */
class HttpClient {
  /**
   * 构造函数
   * @param {Object} defaultOptions - 默认配置选项
   */
  constructor(defaultOptions = {}) {
    this.defaultOptions = new RequestOptions(defaultOptions);
    this.logger = logger;
  }

  /**
   * 发送HTTP请求
   * @param {Object|string} optionsOrUrl - 请求选项或URL
   * @returns {Promise<HttpResponse>} 响应对象
   */
  async request(optionsOrUrl) {
    let options;
    
    // 处理参数
    if (typeof optionsOrUrl === 'string') {
      options = new RequestOptions({
        url: optionsOrUrl,
        ...this.defaultOptions
      });
    } else {
      options = new RequestOptions({
        ...this.defaultOptions,
        ...optionsOrUrl
      });
    }

    // 验证URL
    if (!options.url) {
      throw new AppError('请求URL不能为空', 400);
    }

    // 处理查询参数
    const requestUrl = this._buildUrl(options.url, options.queryParams);
    
    // 处理重试逻辑
    return CommonUtils.retry(
      async (attempt) => {
        this.logger.debug(`发送HTTP请求 (尝试 ${attempt + 1}/${options.retries + 1})`, {
          method: options.method,
          url: requestUrl,
          attempt: attempt + 1
        });
        
        // 记录请求开始时间
        const startTime = Date.now();
        
        try {
          const response = await this._executeRequest(requestUrl, options, 0);
          
          // 记录请求结束时间
          const endTime = Date.now();
          response.timing = {
            total: endTime - startTime
          };
          
          // 记录请求日志
          this.logger.info(`HTTP请求完成`, {
            method: options.method,
            url: requestUrl,
            status: response.status,
            duration: response.timing.total + 'ms'
          });
          
          return response;
        } catch (error) {
          // 记录请求失败
          this.logger.error(`HTTP请求失败 (尝试 ${attempt + 1}/${options.retries + 1})`, {
            method: options.method,
            url: requestUrl,
            error: error.message,
            attempt: attempt + 1
          });
          
          throw error;
        }
      },
      {
        retries: options.retries,
        delay: options.retryDelay,
        maxDelay: options.maxRetryDelay,
        factor: options.retryFactor,
        shouldRetry: (error) => this._shouldRetryRequest(error, options)
      }
    );
  }

  /**
   * 执行GET请求
   * @param {string} url - 请求URL
   * @param {Object} options - 请求选项
   * @returns {Promise<HttpResponse>} 响应对象
   */
  get(url, options = {}) {
    return this.request({
      ...options,
      url,
      method: HttpMethod.GET
    });
  }

  /**
   * 执行POST请求
   * @param {string} url - 请求URL
   * @param {*} data - 请求数据
   * @param {Object} options - 请求选项
   * @returns {Promise<HttpResponse>} 响应对象
   */
  post(url, data, options = {}) {
    return this.request({
      ...options,
      url,
      method: HttpMethod.POST,
      body: data
    });
  }

  /**
   * 执行PUT请求
   * @param {string} url - 请求URL
   * @param {*} data - 请求数据
   * @param {Object} options - 请求选项
   * @returns {Promise<HttpResponse>} 响应对象
   */
  put(url, data, options = {}) {
    return this.request({
      ...options,
      url,
      method: HttpMethod.PUT,
      body: data
    });
  }

  /**
   * 执行DELETE请求
   * @param {string} url - 请求URL
   * @param {Object} options - 请求选项
   * @returns {Promise<HttpResponse>} 响应对象
   */
  delete(url, options = {}) {
    return this.request({
      ...options,
      url,
      method: HttpMethod.DELETE
    });
  }

  /**
   * 执行PATCH请求
   * @param {string} url - 请求URL
   * @param {*} data - 请求数据
   * @param {Object} options - 请求选项
   * @returns {Promise<HttpResponse>} 响应对象
   */
  patch(url, data, options = {}) {
    return this.request({
      ...options,
      url,
      method: HttpMethod.PATCH,
      body: data
    });
  }

  /**
   * 执行HEAD请求
   * @param {string} url - 请求URL
   * @param {Object} options - 请求选项
   * @returns {Promise<HttpResponse>} 响应对象
   */
  head(url, options = {}) {
    return this.request({
      ...options,
      url,
      method: HttpMethod.HEAD
    });
  }

  /**
   * 执行OPTIONS请求
   * @param {string} url - 请求URL
   * @param {Object} options - 请求选项
   * @returns {Promise<HttpResponse>} 响应对象
   */
  options(url, options = {}) {
    return this.request({
      ...options,
      url,
      method: HttpMethod.OPTIONS
    });
  }

  /**
   * 创建带特定配置的HTTP客户端实例
   * @param {Object} options - 配置选项
   * @returns {HttpClient} HTTP客户端实例
   */
  createClient(options = {}) {
    const mergedOptions = {
      ...this.defaultOptions,
      ...options
    };
    return new HttpClient(mergedOptions);
  }

  /**
   * 内部方法：执行实际的HTTP请求
   * @private
   * @param {string} requestUrl - 请求URL
   * @param {RequestOptions} options - 请求选项
   * @param {number} redirectCount - 当前重定向次数
   * @returns {Promise<HttpResponse>} 响应对象
   */
  async _executeRequest(requestUrl, options, redirectCount) {
    // 解析URL
    const parsedUrl = url.parse(requestUrl);
    const isHttps = parsedUrl.protocol === 'https:';
    const httpModule = isHttps ? https : http;

    // 构建请求选项
    const reqOptions = this._buildRequestOptions(parsedUrl, options);

    // 处理请求体
    const body = await this._prepareRequestBody(options.body, reqOptions.headers);
    
    return new Promise((resolve, reject) => {
      let timeoutId;

      const req = httpModule.request(reqOptions, (res) => {
        // 清除超时
        clearTimeout(timeoutId);

        // 处理重定向
        if (options.followRedirects && this._isRedirectStatus(res.statusCode)) {
          if (redirectCount >= options.maxRedirects) {
            reject(new AppError(`超过最大重定向次数: ${options.maxRedirects}`, 400));
            return;
          }

          const location = res.headers.location;
          if (location) {
            const redirectUrl = this._resolveRedirectUrl(requestUrl, location);
            this.logger.debug('HTTP重定向', {
              from: requestUrl,
              to: redirectUrl,
              status: res.statusCode
            });
            
            // 递归处理重定向
            return this._executeRequest(redirectUrl, options, redirectCount + 1)
              .then(redirectedRes => {
                // 保留重定向计数
                redirectedRes.redirectCount = redirectCount + 1;
                resolve(redirectedRes);
              })
              .catch(reject);
          }
        }

        // 收集响应数据
        let responseData = '';
        res.setEncoding('utf8');

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', async () => {
          try {
            // 处理响应数据
            let parsedBody = responseData;
            
            // 尝试解析JSON
            const contentType = res.headers['content-type'] || '';
            if (contentType.includes('application/json') && responseData) {
              parsedBody = JSON.parse(responseData);
            }

            // 应用响应转换器
            if (options.transformResponse) {
              parsedBody = await options.transformResponse(parsedBody, res);
            }

            // 创建响应对象
            const response = new HttpResponse(res, parsedBody);
            response.redirectCount = redirectCount;

            // 处理错误状态码
            if (!response.isSuccess()) {
              const error = this._createRequestError(response);
              reject(error);
              return;
            }

            resolve(response);
          } catch (error) {
            reject(new AppError(`处理响应失败: ${error.message}`, 500, error));
          }
        });
      });

      // 处理请求错误
      req.on('error', (error) => {
        clearTimeout(timeoutId);
        reject(new AppError(`请求发送失败: ${error.message}`, 500, error));
      });

      // 设置超时
      timeoutId = setTimeout(() => {
        req.abort();
        reject(new AppError(`请求超时: ${options.timeout}ms`, 408));
      }, options.timeout);

      // 发送请求体
      if (body) {
        req.write(body);
      }

      req.end();
    });
  }

  /**
   * 内部方法：构建URL
   * @private
   * @param {string} baseUrl - 基础URL
   * @param {Object|string} queryParams - 查询参数
   * @returns {string} 构建后的URL
   */
  _buildUrl(baseUrl, queryParams) {
    if (!queryParams) return baseUrl;

    const parsedUrl = url.parse(baseUrl, true);
    parsedUrl.query = { ...parsedUrl.query, ...queryParams };
    parsedUrl.search = null; // 清除search，让format方法重新生成
    
    return url.format(parsedUrl);
  }

  /**
   * 内部方法：构建请求选项
   * @private
   * @param {Object} parsedUrl - 解析后的URL对象
   * @param {RequestOptions} options - 请求选项
   * @returns {Object} 请求选项
   */
  _buildRequestOptions(parsedUrl, options) {
    const headers = { ...options.headers };

    // 设置默认User-Agent
    if (!headers['User-Agent']) {
      headers['User-Agent'] = 'HttpClient/1.0';
    }

    // 处理认证
    if (options.auth) {
      if (typeof options.auth === 'string') {
        headers['Authorization'] = options.auth;
      } else if (options.auth.username && options.auth.password) {
        const authString = `${options.auth.username}:${options.auth.password}`;
        headers['Authorization'] = `Basic ${Buffer.from(authString).toString('base64')}`;
      } else if (options.auth.bearer) {
        headers['Authorization'] = `Bearer ${options.auth.bearer}`;
      }
    }

    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.path,
      method: options.method,
      headers: headers,
      ...(parsedUrl.protocol === 'https:' ? options.ssl : {})
    };

    // 处理代理
    if (options.proxy) {
      const proxyUrl = typeof options.proxy === 'string' 
        ? url.parse(options.proxy) 
        : options.proxy;

      requestOptions.hostname = proxyUrl.hostname;
      requestOptions.port = proxyUrl.port || 8080;
      requestOptions.path = parsedUrl.href;
      
      // 代理认证
      if (proxyUrl.auth) {
        headers['Proxy-Authorization'] = `Basic ${Buffer.from(proxyUrl.auth).toString('base64')}`;
      }
    }

    return requestOptions;
  }

  /**
   * 内部方法：准备请求体
   * @private
   * @param {*} body - 请求体
   * @param {Object} headers - 请求头
   * @returns {Promise<string|null>} 处理后的请求体
   */
  async _prepareRequestBody(body, headers) {
    if (body === null || body === undefined) {
      return null;
    }

    // 应用请求转换器
    if (typeof this.defaultOptions.transformRequest === 'function') {
      body = await this.defaultOptions.transformRequest(body, headers);
    }

    // 如果已经是字符串，直接返回
    if (typeof body === 'string') {
      return body;
    }

    // 对象转换为JSON
    if (typeof body === 'object') {
      if (!headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }
      return JSON.stringify(body);
    }

    // 其他类型转换为字符串
    return String(body);
  }

  /**
   * 内部方法：检查是否为重定向状态码
   * @private
   * @param {number} statusCode - 状态码
   * @returns {boolean} 是否为重定向
   */
  _isRedirectStatus(statusCode) {
    return [
      HttpStatusCode.MOVED_PERMANENTLY,
      HttpStatusCode.FOUND,
      303, // See Other
      307, // Temporary Redirect
      308  // Permanent Redirect
    ].includes(statusCode);
  }

  /**
   * 内部方法：解析重定向URL
   * @private
   * @param {string} currentUrl - 当前URL
   * @param {string} location - 重定向目标
   * @returns {string} 解析后的URL
   */
  _resolveRedirectUrl(currentUrl, location) {
    // 如果是绝对URL，直接返回
    if (location.startsWith('http://') || location.startsWith('https://')) {
      return location;
    }

    // 相对URL，需要解析
    const parsedCurrent = url.parse(currentUrl);
    
    // 处理相对于根路径的URL
    if (location.startsWith('/')) {
      return `${parsedCurrent.protocol}//${parsedCurrent.host}${location}`;
    }

    // 处理相对于当前路径的URL
    const currentPath = parsedCurrent.pathname || '';
    const basePath = currentPath.substring(0, currentPath.lastIndexOf('/') + 1);
    return `${parsedCurrent.protocol}//${parsedCurrent.host}${basePath}${location}`;
  }

  /**
   * 内部方法：创建请求错误
   * @private
   * @param {HttpResponse} response - 响应对象
   * @returns {AppError} 错误对象
   */
  _createRequestError(response) {
    const message = response.body && typeof response.body === 'object' && response.body.message
      ? response.body.message
      : `HTTP请求失败: ${response.status} ${response.statusText}`;

    return new AppError(message, response.status, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      body: response.body
    });
  }

  /**
   * 内部方法：判断是否应该重试请求
   * @private
   * @param {Error} error - 错误对象
   * @param {RequestOptions} options - 请求选项
   * @returns {boolean} 是否应该重试
   */
  _shouldRetryRequest(error, options) {
    // 不重试客户端错误，除非是429（Too Many Requests）
    if (error.status && error.status >= 400 && error.status < 500 && error.status !== 429) {
      return false;
    }

    // 重试网络错误和服务器错误
    return error.status >= 500 || 
           error.code === 'ECONNRESET' || 
           error.code === 'ETIMEDOUT' || 
           error.code === 'EAI_AGAIN' || 
           error.code === 'ENOTFOUND';
  }
}

// 创建默认HTTP客户端实例
const defaultHttpClient = new HttpClient();

module.exports = {
  HttpClient,
  RequestOptions,
  HttpResponse,
  HttpMethod,
  HttpStatusCode,
  defaultHttpClient
};