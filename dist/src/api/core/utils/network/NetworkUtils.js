/**
 * 网络工具类
 * 提供HTTP请求、WebSocket、网络检测、URL处理等功能
 */

const http = require('http');
const https = require('https');
const url = require('url');
const querystring = require('querystring');

/**
 * 网络工具主类
 */
class NetworkUtils {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   */
  constructor(options = {}) {
    this.options = {
      timeout: 30000,
      retryCount: 3,
      retryDelay: 1000,
      ...options
    };
    this.activeRequests = new Map();
    this.activeWebSockets = new Map();
  }

  /**
   * 发送HTTP请求
   * @param {string|Object} options - 请求选项或URL
   * @param {Object|null} data - 请求数据
   * @returns {Promise<Object>} 响应结果
   */
  async request(options, data = null) {
    const requestOptions = this._normalizeRequestOptions(options);
    const requestId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    
    // 存储活跃请求
    this.activeRequests.set(requestId, requestOptions);
    
    try {
      return await this._executeRequest(requestOptions, data, requestId);
    } finally {
      // 清理活跃请求
      this.activeRequests.delete(requestId);
    }
  }

  /**
   * 执行HTTP请求（支持重试）
   * @private
   */
  async _executeRequest(requestOptions, data, requestId, attempt = 0) {
    try {
      const response = await this._makeRequest(requestOptions, data);
      return response;
    } catch (error) {
      // 判断是否需要重试
      if (this._shouldRetry(error, attempt)) {
        attempt++;
        const delay = this._calculateRetryDelay(attempt);
        await this._delay(delay);
        return this._executeRequest(requestOptions, data, requestId, attempt);
      }
      throw error;
    }
  }

  /**
   * 发送单个HTTP请求
   * @private
   */
  _makeRequest(options, data) {
    return new Promise((resolve, reject) => {
      const httpModule = options.protocol === 'https:' ? https : http;
      const requestData = this._prepareRequestData(options.method, data, options.headers);
      
      // 添加Content-Length头
      if (requestData && options.headers['Content-Length'] === undefined) {
        options.headers['Content-Length'] = Buffer.byteLength(requestData);
      }
      
      const req = httpModule.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          const response = {
            status: res.statusCode,
            statusText: res.statusMessage,
            headers: res.headers,
            data: this._parseResponseData(responseData, res.headers['content-type'])
          };
          
          // 根据状态码判断是否成功
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(response);
          } else {
            const error = new Error(`Request failed with status code ${res.statusCode}`);
            error.response = response;
            reject(error);
          }
        });
      });
      
      // 设置超时
      req.setTimeout(this.options.timeout, () => {
        req.abort();
        reject(new Error(`Request timeout after ${this.options.timeout}ms`));
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      // 发送请求数据
      if (requestData) {
        req.write(requestData);
      }
      
      req.end();
    });
  }

  /**
   * 准备请求数据
   * @private
   */
  _prepareRequestData(method, data, headers) {
    if (!data || ['GET', 'HEAD', 'DELETE'].includes(method)) {
      return null;
    }
    
    const contentType = headers['Content-Type'] || headers['content-type'];
    
    if (contentType?.includes('application/json')) {
      return JSON.stringify(data);
    } else if (contentType?.includes('application/x-www-form-urlencoded')) {
      return querystring.stringify(data);
    } else if (Buffer.isBuffer(data)) {
      return data;
    } else if (typeof data === 'string') {
      return data;
    } else {
      // 默认转换为JSON
      headers['Content-Type'] = 'application/json';
      return JSON.stringify(data);
    }
  }

  /**
   * 解析响应数据
   * @private
   */
  _parseResponseData(data, contentType) {
    if (!data) return null;
    
    if (contentType?.includes('application/json')) {
      try {
        return JSON.parse(data);
      } catch (e) {
        // 如果解析失败，返回原始字符串
        return data;
      }
    }
    
    return data;
  }

  /**
   * 标准化请求选项
   * @private
   */
  _normalizeRequestOptions(options) {
    if (typeof options === 'string') {
      const parsedUrl = url.parse(options);
      return {
        protocol: parsedUrl.protocol || 'http:',
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.path,
        method: 'GET',
        headers: {}
      };
    }
    
    // 确保有默认的头部信息
    if (!options.headers) {
      options.headers = {};
    }
    
    // 设置默认User-Agent
    if (!options.headers['User-Agent']) {
      options.headers['User-Agent'] = 'NetworkUtils/1.0';
    }
    
    return options;
  }

  /**
   * 判断是否需要重试
   * @private
   */
  _shouldRetry(error, attempt) {
    if (attempt >= this.options.retryCount) return false;
    
    // 网络错误重试
    const retryableErrors = ['ECONNRESET', 'ETIMEDOUT', 'EADDRINFO', 'ENOTFOUND', 'ECONNREFUSED'];
    
    if (error.code && retryableErrors.includes(error.code)) {
      return true;
    }
    
    // 服务器错误重试
    if (error.response && error.response.status >= 500) {
      return true;
    }
    
    return false;
  }

  /**
   * 计算重试延迟（退避策略）
   * @private
   */
  _calculateRetryDelay(attempt) {
    return this.options.retryDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
  }

  /**
   * 延迟函数
   * @private
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 发送GET请求
   * @param {string} url - 请求URL
   * @param {Object} options - 请求选项
   * @returns {Promise<Object>} 响应结果
   */
  async get(url, options = {}) {
    const requestOptions = this._normalizeRequestOptions(url);
    return this.request({
      ...requestOptions,
      ...options,
      method: 'GET'
    });
  }

  /**
   * 发送POST请求
   * @param {string} url - 请求URL
   * @param {Object} data - 请求数据
   * @param {Object} options - 请求选项
   * @returns {Promise<Object>} 响应结果
   */
  async post(url, data = {}, options = {}) {
    const requestOptions = this._normalizeRequestOptions(url);
    return this.request({
      ...requestOptions,
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    }, data);
  }

  /**
   * 发送PUT请求
   * @param {string} url - 请求URL
   * @param {Object} data - 请求数据
   * @param {Object} options - 请求选项
   * @returns {Promise<Object>} 响应结果
   */
  async put(url, data = {}, options = {}) {
    const requestOptions = this._normalizeRequestOptions(url);
    return this.request({
      ...requestOptions,
      ...options,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    }, data);
  }

  /**
   * 发送DELETE请求
   * @param {string} url - 请求URL
   * @param {Object} options - 请求选项
   * @returns {Promise<Object>} 响应结果
   */
  async delete(url, options = {}) {
    const requestOptions = this._normalizeRequestOptions(url);
    return this.request({
      ...requestOptions,
      ...options,
      method: 'DELETE'
    });
  }

  /**
   * 发送PATCH请求
   * @param {string} url - 请求URL
   * @param {Object} data - 请求数据
   * @param {Object} options - 请求选项
   * @returns {Promise<Object>} 响应结果
   */
  async patch(url, data = {}, options = {}) {
    const requestOptions = this._normalizeRequestOptions(url);
    return this.request({
      ...requestOptions,
      ...options,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    }, data);
  }

  /**
   * 发送HEAD请求
   * @param {string} url - 请求URL
   * @param {Object} options - 请求选项
   * @returns {Promise<Object>} 响应结果
   */
  async head(url, options = {}) {
    const requestOptions = this._normalizeRequestOptions(url);
    return this.request({
      ...requestOptions,
      ...options,
      method: 'HEAD'
    });
  }

  /**
   * 发送OPTIONS请求
   * @param {string} url - 请求URL
   * @param {Object} options - 请求选项
   * @returns {Promise<Object>} 响应结果
   */
  async options(url, options = {}) {
    const requestOptions = this._normalizeRequestOptions(url);
    return this.request({
      ...requestOptions,
      ...options,
      method: 'OPTIONS'
    });
  }

  /**
   * 并发请求
   * @param {Array} requests - 请求配置数组
   * @param {number} concurrency - 并发数
   * @returns {Promise<Array>} 所有请求的结果
   */
  async concurrentRequests(requests, concurrency = 5) {
    const results = [];
    const queue = [...requests];
    const activeWorkers = new Set();
    
    const executeRequest = async (requestConfig) => {
      try {
        const result = typeof requestConfig === 'function' 
          ? await requestConfig() 
          : await this.request(requestConfig.url, requestConfig.data);
        return { success: true, result };
      } catch (error) {
        return { success: false, error };
      }
    };
    
    while (queue.length > 0 || activeWorkers.size > 0) {
      // 启动新的工作线程
      while (activeWorkers.size < concurrency && queue.length > 0) {
        const requestConfig = queue.shift();
        const promise = executeRequest(requestConfig).finally(() => {
          activeWorkers.delete(promise);
        });
        activeWorkers.add(promise);
        results.push(promise);
      }
      
      if (activeWorkers.size > 0) {
        await Promise.race(activeWorkers);
      }
    }
    
    return Promise.all(results);
  }

  /**
   * 批量请求（串行）
   * @param {Array} requests - 请求配置数组
   * @returns {Promise<Array>} 所有请求的结果
   */
  async batchRequests(requests) {
    const results = [];
    
    for (const requestConfig of requests) {
      try {
        const result = typeof requestConfig === 'function' 
          ? await requestConfig() 
          : await this.request(requestConfig.url, requestConfig.data);
        results.push({ success: true, result });
      } catch (error) {
        results.push({ success: false, error });
      }
    }
    
    return results;
  }

  /**
   * 构建查询字符串
   * @param {Object} params - 查询参数对象
   * @returns {string} 查询字符串
   */
  buildQueryString(params) {
    return querystring.stringify(params);
  }

  /**
   * 解析查询字符串
   * @param {string} queryString - 查询字符串
   * @returns {Object} 参数对象
   */
  parseQueryString(queryString) {
    return querystring.parse(queryString);
  }

  /**
   * 解析URL
   * @param {string} urlString - URL字符串
   * @returns {Object} 解析后的URL对象
   */
  parseUrl(urlString) {
    return url.parse(urlString, true);
  }

  /**
   * 格式化URL
   * @param {Object} urlObj - URL对象
   * @returns {string} 格式化后的URL字符串
   */
  formatUrl(urlObj) {
    return url.format(urlObj);
  }

  /**
   * 组合URL和查询参数
   * @param {string} baseUrl - 基础URL
   * @param {Object} params - 查询参数
   * @returns {string} 完整URL
   */
  combineUrl(baseUrl, params) {
    const parsedUrl = this.parseUrl(baseUrl);
    
    // 合并查询参数
    parsedUrl.query = {
      ...parsedUrl.query,
      ...params
    };
    
    // 删除search属性，让format方法重新生成
    delete parsedUrl.search;
    
    return this.formatUrl(parsedUrl);
  }

  /**
   * 验证URL是否有效
   * @param {string} urlString - URL字符串
   * @returns {boolean} 是否有效
   */
  isValidUrl(urlString) {
    try {
      new URL(urlString);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * 获取URL的域部分
   * @param {string} urlString - URL字符串
   * @returns {string} 域部分
   */
  getDomain(urlString) {
    try {
      const parsed = new URL(urlString);
      return parsed.hostname;
    } catch (e) {
      return null;
    }
  }

  /**
   * 检查是否是HTTPS URL
   * @param {string} urlString - URL字符串
   * @returns {boolean} 是否是HTTPS
   */
  isHttps(urlString) {
    try {
      const parsed = new URL(urlString);
      return parsed.protocol === 'https:';
    } catch (e) {
      return false;
    }
  }

  /**
   * 检查网络连接
   * @param {string} testUrl - 测试URL
   * @returns {Promise<boolean>} 是否连接成功
   */
  async checkConnection(testUrl = 'https://www.google.com') {
    try {
      await this.get(testUrl, { timeout: 5000 });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 获取IP地址信息
   * @returns {Promise<Object>} IP地址信息
   */
  async getIpInfo() {
    try {
      const response = await this.get('https://api.ipify.org?format=json');
      return response.data;
    } catch (error) {
      console.error('获取IP信息失败:', error);
      return null;
    }
  }

  /**
   * 创建WebSocket连接
   * @param {string} wsUrl - WebSocket URL
   * @param {Object} options - WebSocket选项
   * @returns {Promise<Object>} WebSocket连接对象
   */
  async createWebSocket(wsUrl, options = {}) {
    const WebSocket = require('ws');
    const wsId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(wsUrl, options);
      
      ws.on('open', () => {
        // 存储活跃的WebSocket连接
        this.activeWebSockets.set(wsId, ws);
        
        const wsWrapper = {
          id: wsId,
          send: (data) => this._sendWebSocketMessage(ws, data),
          close: () => this._closeWebSocket(wsId),
          on: (event, callback) => ws.on(event, callback),
          once: (event, callback) => ws.once(event, callback),
          off: (event, callback) => ws.off(event, callback)
        };
        
        resolve(wsWrapper);
      });
      
      ws.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * 发送WebSocket消息
   * @private
   */
  _sendWebSocketMessage(ws, data) {
    const message = typeof data === 'object' ? JSON.stringify(data) : String(data);
    ws.send(message);
  }

  /**
   * 关闭WebSocket连接
   * @private
   */
  _closeWebSocket(wsId) {
    const ws = this.activeWebSockets.get(wsId);
    if (ws) {
      ws.close();
      this.activeWebSockets.delete(wsId);
    }
  }

  /**
   * 关闭所有活跃的WebSocket连接
   */
  closeAllWebSockets() {
    for (const wsId of this.activeWebSockets.keys()) {
      this._closeWebSocket(wsId);
    }
  }

  /**
   * 取消所有活跃的HTTP请求
   */
  cancelAllRequests() {
    // 注意：在Node.js中无法直接取消HTTP请求，这里只是清理记录
    this.activeRequests.clear();
  }

  /**
   * 获取活跃连接统计
   * @returns {Object} 活跃连接统计
   */
  getActiveConnectionsStats() {
    return {
      httpRequests: this.activeRequests.size,
      webSockets: this.activeWebSockets.size
    };
  }

  /**
   * 设置代理
   * @param {string} proxyUrl - 代理URL
   * @returns {Object} 代理设置
   */
  setProxy(proxyUrl) {
    const parsedProxy = url.parse(proxyUrl);
    return {
      httpProxy: proxyUrl,
      httpsProxy: proxyUrl,
      noProxy: 'localhost,127.0.0.1'
    };
  }

  /**
   * 创建请求拦截器
   * @param {Function} requestInterceptor - 请求拦截器函数
   * @param {Function} responseInterceptor - 响应拦截器函数
   */
  createInterceptors(requestInterceptor, responseInterceptor) {
    // 保存原始方法
    const originalRequest = this.request.bind(this);
    
    // 重写request方法
    this.request = async (options, data) => {
      // 请求拦截
      if (requestInterceptor) {
        const intercepted = requestInterceptor(options, data);
        if (intercepted) {
          options = intercepted.options || options;
          data = intercepted.data || data;
        }
      }
      
      // 执行请求
      let response;
      try {
        response = await originalRequest(options, data);
        
        // 响应拦截
        if (responseInterceptor) {
          const intercepted = responseInterceptor(response);
          if (intercepted) {
            response = intercepted;
          }
        }
        
        return response;
      } catch (error) {
        // 错误响应拦截
        if (responseInterceptor && error.response) {
          const intercepted = responseInterceptor(error.response);
          if (intercepted) {
            return intercepted;
          }
        }
        throw error;
      }
    };
  }
}

// 单例模式
let instance = null;

function getInstance(options = {}) {
  if (!instance) {
    instance = new NetworkUtils(options);
  }
  return instance;
}

module.exports = {
  NetworkUtils,
  getInstance
};