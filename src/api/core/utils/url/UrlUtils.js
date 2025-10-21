/**
 * URL工具
 * 提供URL解析、构建和处理功能
 */

const url = require('url');
const querystring = require('querystring');
const crypto = require('crypto');
const logger = require('../logger');
const { AppError } = require('../../exception/handlers/errorHandler');
const { UrlError } = require('../../exception/handlers/errorHandler');

/**
 * URL工具类
 */
class UrlUtils {
  /**
   * 构造函数
   */
  constructor() {
    // URL协议正则表达式
    this.regex = {
      protocol: /^https?:\/\//i,
      domain: /^(?:https?:\/\/)?(?:[^@\/\n]+@)?(?:www\.)?([^:\/\n]+)/i,
      ipv4: /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/,
      ipv6: /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4})$/,
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      path: /^\/[^?#]*/,
      query: /\?([^#]*)/,
      fragment: /#(.*)/
    };
    
    logger.debug('URL工具初始化完成');
  }

  /**
   * 解析URL
   * @param {string} urlString - URL字符串
   * @returns {Object} 解析后的URL对象
   */
  parse(urlString) {
    if (!urlString || typeof urlString !== 'string') {
      throw new UrlError('URL必须是非空字符串', {
        code: 'INVALID_URL',
        url: urlString
      });
    }
    
    try {
      // 使用Node.js的url模块解析
      const parsed = url.parse(urlString, true);
      
      return {
        href: parsed.href,
        protocol: parsed.protocol,
        slashes: parsed.slashes,
        auth: parsed.auth,
        host: parsed.host,
        hostname: parsed.hostname,
        port: parsed.port,
        pathname: parsed.pathname,
        search: parsed.search,
        query: parsed.query,
        hash: parsed.hash,
        path: parsed.path
      };
    } catch (error) {
      logger.error('URL解析失败', {
        url: urlString,
        error: error.message
      });
      throw new UrlError(`URL解析失败: ${error.message}`, {
        code: 'URL_PARSE_ERROR',
        url: urlString,
        cause: error
      });
    }
  }

  /**
   * 构建URL
   * @param {Object} parts - URL部分
   * @returns {string} 构建的URL字符串
   */
  format(parts) {
    if (!parts || typeof parts !== 'object') {
      throw new UrlError('URL部分必须是对象', {
        code: 'INVALID_URL_PARTS',
        parts: parts
      });
    }
    
    try {
      return url.format(parts);
    } catch (error) {
      logger.error('URL构建失败', {
        parts: parts,
        error: error.message
      });
      throw new UrlError(`URL构建失败: ${error.message}`, {
        code: 'URL_FORMAT_ERROR',
        parts: parts,
        cause: error
      });
    }
  }

  /**
   * 规范化URL
   * @param {string} urlString - URL字符串
   * @returns {string} 规范化后的URL
   */
  normalize(urlString) {
    if (!urlString) {
      return '';
    }
    
    try {
      // 确保URL有协议
      let normalized = urlString;
      if (!this.regex.protocol.test(normalized)) {
        normalized = `http://${normalized}`;
      }
      
      const parsed = this.parse(normalized);
      
      // 移除末尾的斜杠（除了根路径）
      if (parsed.pathname && parsed.pathname !== '/' && parsed.pathname.endsWith('/')) {
        parsed.pathname = parsed.pathname.slice(0, -1);
      }
      
      // 移除空的查询字符串和哈希
      if (parsed.search === '?') {
        parsed.search = null;
      }
      if (parsed.hash === '#') {
        parsed.hash = null;
      }
      
      return this.format(parsed);
    } catch (error) {
      logger.warn('URL规范化失败，返回原始URL', {
        url: urlString,
        error: error.message
      });
      return urlString;
    }
  }

  /**
   * 连接URL路径
   * @param {...string} parts - URL路径部分
   * @returns {string} 连接后的URL
   */
  join(...parts) {
    if (!parts || parts.length === 0) {
      return '';
    }
    
    // 移除空部分并规范化路径分隔符
    const normalizedParts = parts
      .filter(part => part && part !== '')
      .map(part => String(part));
    
    if (normalizedParts.length === 0) {
      return '';
    }
    
    // 处理基础URL
    let base = normalizedParts[0];
    let pathParts = normalizedParts.slice(1);
    
    // 规范化路径分隔符
    pathParts = pathParts.map(part => part.replace(/^\/*|\/*$/g, ''));
    
    // 连接路径部分
    const joinedPath = pathParts.join('/');
    
    // 连接基础URL和路径
    if (joinedPath) {
      if (base.endsWith('/')) {
        return `${base}${joinedPath}`;
      } else {
        const hasProtocol = this.regex.protocol.test(base);
        if (hasProtocol && !joinedPath.startsWith('/')) {
          // 如果有协议但路径不以/开头，添加/
          return `${base}/${joinedPath}`;
        } else {
          return `${base}${joinedPath}`;
        }
      }
    }
    
    return base;
  }

  /**
   * 解析查询字符串
   * @param {string} queryString - 查询字符串
   * @returns {Object} 解析后的对象
   */
  parseQuery(queryString) {
    if (!queryString) {
      return {};
    }
    
    try {
      // 移除开头的?
      const cleanQuery = queryString.startsWith('?') 
        ? queryString.slice(1) 
        : queryString;
      
      return querystring.parse(cleanQuery);
    } catch (error) {
      logger.error('查询字符串解析失败', {
        queryString,
        error: error.message
      });
      throw new UrlError(`查询字符串解析失败: ${error.message}`, {
        code: 'QUERY_PARSE_ERROR',
        queryString,
        cause: error
      });
    }
  }

  /**
   * 构建查询字符串
   * @param {Object} query - 查询对象
   * @param {Object} options - 选项
   * @returns {string} 查询字符串
   */
  buildQuery(query, options = {}) {
    if (!query || typeof query !== 'object') {
      return '';
    }
    
    try {
      const { includeQuestionMark = false, encode = true } = options;
      
      // 过滤undefined和null值
      const validQuery = {};
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          validQuery[key] = value;
        }
      });
      
      const queryString = encode 
        ? querystring.stringify(validQuery) 
        : Object.entries(validQuery)
          .map(([key, value]) => `${key}=${value}`)
          .join('&');
      
      return includeQuestionMark && queryString ? `?${queryString}` : queryString;
    } catch (error) {
      logger.error('查询字符串构建失败', {
        query,
        error: error.message
      });
      throw new UrlError(`查询字符串构建失败: ${error.message}`, {
        code: 'QUERY_BUILD_ERROR',
        query,
        cause: error
      });
    }
  }

  /**
   * 添加查询参数到URL
   * @param {string} urlString - 原始URL
   * @param {Object} params - 要添加的参数
   * @returns {string} 新的URL
   */
  addQueryParams(urlString, params) {
    if (!urlString) {
      return '';
    }
    
    try {
      const parsed = this.parse(urlString);
      
      // 合并查询参数
      parsed.query = {
        ...parsed.query,
        ...params
      };
      
      // 清除search以确保重新构建
      parsed.search = null;
      
      return this.format(parsed);
    } catch (error) {
      logger.error('添加查询参数失败', {
        url: urlString,
        params,
        error: error.message
      });
      throw new UrlError(`添加查询参数失败: ${error.message}`, {
        code: 'ADD_QUERY_PARAMS_ERROR',
        url: urlString,
        params,
        cause: error
      });
    }
  }

  /**
   * 从URL中移除查询参数
   * @param {string} urlString - 原始URL
   * @param {Array<string>} paramNames - 要移除的参数名
   * @returns {string} 新的URL
   */
  removeQueryParams(urlString, paramNames) {
    if (!urlString) {
      return '';
    }
    
    try {
      const parsed = this.parse(urlString);
      
      // 移除指定的参数
      if (Array.isArray(paramNames)) {
        paramNames.forEach(paramName => {
          delete parsed.query[paramName];
        });
      } else if (paramNames) {
        delete parsed.query[paramNames];
      }
      
      // 清除search以确保重新构建
      parsed.search = null;
      
      return this.format(parsed);
    } catch (error) {
      logger.error('移除查询参数失败', {
        url: urlString,
        paramNames,
        error: error.message
      });
      throw new UrlError(`移除查询参数失败: ${error.message}`, {
        code: 'REMOVE_QUERY_PARAMS_ERROR',
        url: urlString,
        paramNames,
        cause: error
      });
    }
  }

  /**
   * 验证URL是否有效
   * @param {string} urlString - 要验证的URL
   * @returns {boolean} 是否有效
   */
  isValidUrl(urlString) {
    if (!urlString || typeof urlString !== 'string') {
      return false;
    }
    
    try {
      // 尝试解析URL
      const parsed = new URL(urlString);
      
      // 基本验证
      if (!parsed.protocol || !parsed.hostname) {
        return false;
      }
      
      // 验证协议
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return false;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 获取URL的协议
   * @param {string} urlString - URL字符串
   * @returns {string|null} 协议（如 'http:', 'https:'）
   */
  getProtocol(urlString) {
    if (!urlString) {
      return null;
    }
    
    try {
      const parsed = this.parse(urlString);
      return parsed.protocol;
    } catch (error) {
      return null;
    }
  }

  /**
   * 获取URL的域名
   * @param {string} urlString - URL字符串
   * @returns {string|null} 域名
   */
  getDomain(urlString) {
    if (!urlString) {
      return null;
    }
    
    try {
      const parsed = this.parse(urlString);
      return parsed.hostname;
    } catch (error) {
      return null;
    }
  }

  /**
   * 获取URL的路径
   * @param {string} urlString - URL字符串
   * @returns {string|null} 路径
   */
  getPath(urlString) {
    if (!urlString) {
      return null;
    }
    
    try {
      const parsed = this.parse(urlString);
      return parsed.pathname;
    } catch (error) {
      return null;
    }
  }

  /**
   * 获取URL的查询字符串
   * @param {string} urlString - URL字符串
   * @param {boolean} includeQuestionMark - 是否包含问号
   * @returns {string|null} 查询字符串
   */
  getQueryString(urlString, includeQuestionMark = false) {
    if (!urlString) {
      return null;
    }
    
    try {
      const parsed = this.parse(urlString);
      if (!parsed.search) {
        return '';
      }
      
      return includeQuestionMark ? parsed.search : parsed.search.slice(1);
    } catch (error) {
      return null;
    }
  }

  /**
   * 获取URL的哈希部分
   * @param {string} urlString - URL字符串
   * @param {boolean} includeHashSign - 是否包含哈希符号
   * @returns {string|null} 哈希部分
   */
  getHash(urlString, includeHashSign = false) {
    if (!urlString) {
      return null;
    }
    
    try {
      const parsed = this.parse(urlString);
      if (!parsed.hash) {
        return '';
      }
      
      return includeHashSign ? parsed.hash : parsed.hash.slice(1);
    } catch (error) {
      return null;
    }
  }

  /**
   * 比较两个URL是否相等
   * @param {string} url1 - 第一个URL
   * @param {string} url2 - 第二个URL
   * @param {Object} options - 比较选项
   * @returns {boolean} 是否相等
   */
  equals(url1, url2, options = {}) {
    const { 
      ignoreProtocol = false, 
      ignoreTrailingSlash = true,
      ignoreQueryParams = false,
      ignoreHash = true,
      normalize = true 
    } = options;
    
    try {
      // 规范化URL
      let normalizedUrl1 = normalize ? this.normalize(url1) : url1;
      let normalizedUrl2 = normalize ? this.normalize(url2) : url2;
      
      // 解析URL
      let parsed1 = this.parse(normalizedUrl1);
      let parsed2 = this.parse(normalizedUrl2);
      
      // 忽略协议
      if (ignoreProtocol) {
        parsed1.protocol = 'http:';
        parsed2.protocol = 'http:';
      }
      
      // 忽略末尾斜杠
      if (ignoreTrailingSlash) {
        if (parsed1.pathname && parsed1.pathname !== '/' && parsed1.pathname.endsWith('/')) {
          parsed1.pathname = parsed1.pathname.slice(0, -1);
        }
        if (parsed2.pathname && parsed2.pathname !== '/' && parsed2.pathname.endsWith('/')) {
          parsed2.pathname = parsed2.pathname.slice(0, -1);
        }
      }
      
      // 忽略查询参数
      if (ignoreQueryParams) {
        parsed1.query = {};
        parsed2.query = {};
        parsed1.search = null;
        parsed2.search = null;
      }
      
      // 忽略哈希
      if (ignoreHash) {
        parsed1.hash = null;
        parsed2.hash = null;
      }
      
      // 重新格式化并比较
      return this.format(parsed1) === this.format(parsed2);
    } catch (error) {
      logger.warn('URL比较失败', {
        url1,
        url2,
        error: error.message
      });
      return false;
    }
  }

  /**
   * 提取URL中的文件名
   * @param {string} urlString - URL字符串
   * @returns {string|null} 文件名
   */
  getFilename(urlString) {
    if (!urlString) {
      return null;
    }
    
    try {
      const parsed = this.parse(urlString);
      if (!parsed.pathname) {
        return null;
      }
      
      const pathParts = parsed.pathname.split('/');
      const lastPart = pathParts[pathParts.length - 1];
      
      // 如果最后一部分包含点号，认为是文件名
      if (lastPart.includes('.')) {
        return lastPart;
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * 提取URL中的文件扩展名
   * @param {string} urlString - URL字符串
   * @returns {string|null} 文件扩展名
   */
  getFileExtension(urlString) {
    const filename = this.getFilename(urlString);
    if (!filename) {
      return null;
    }
    
    const parts = filename.split('.');
    if (parts.length > 1) {
      return parts[parts.length - 1].toLowerCase();
    }
    
    return null;
  }

  /**
   * 将URL转换为绝对URL
   * @param {string} relativeUrl - 相对URL
   * @param {string} baseUrl - 基础URL
   * @returns {string} 绝对URL
   */
  toAbsolute(relativeUrl, baseUrl) {
    if (!relativeUrl) {
      return baseUrl || '';
    }
    
    // 如果已经是绝对URL，直接返回
    if (this.isValidUrl(relativeUrl)) {
      return relativeUrl;
    }
    
    if (!baseUrl) {
      throw new UrlError('无法将相对URL转换为绝对URL，缺少基础URL', {
        code: 'MISSING_BASE_URL',
        relativeUrl
      });
    }
    
    try {
      const absoluteUrl = new URL(relativeUrl, baseUrl).toString();
      return absoluteUrl;
    } catch (error) {
      logger.error('转换为绝对URL失败', {
        relativeUrl,
        baseUrl,
        error: error.message
      });
      throw new UrlError(`转换为绝对URL失败: ${error.message}`, {
        code: 'TO_ABSOLUTE_ERROR',
        relativeUrl,
        baseUrl,
        cause: error
      });
    }
  }

  /**
   * 编码URL组件
   * @param {string} component - URL组件
   * @returns {string} 编码后的组件
   */
  encodeComponent(component) {
    if (component === null || component === undefined) {
      return '';
    }
    
    try {
      return encodeURIComponent(String(component));
    } catch (error) {
      logger.error('URL组件编码失败', {
        component,
        error: error.message
      });
      throw new UrlError(`URL组件编码失败: ${error.message}`, {
        code: 'ENCODE_COMPONENT_ERROR',
        component,
        cause: error
      });
    }
  }

  /**
   * 解码URL组件
   * @param {string} component - 编码的URL组件
   * @returns {string} 解码后的组件
   */
  decodeComponent(component) {
    if (component === null || component === undefined) {
      return '';
    }
    
    try {
      return decodeURIComponent(String(component));
    } catch (error) {
      logger.error('URL组件解码失败', {
        component,
        error: error.message
      });
      throw new UrlError(`URL组件解码失败: ${error.message}`, {
        code: 'DECODE_COMPONENT_ERROR',
        component,
        cause: error
      });
    }
  }

  /**
   * 编码URL路径
   * @param {string} path - URL路径
   * @returns {string} 编码后的路径
   */
  encodePath(path) {
    if (path === null || path === undefined) {
      return '';
    }
    
    try {
      return encodeURI(String(path));
    } catch (error) {
      logger.error('URL路径编码失败', {
        path,
        error: error.message
      });
      throw new UrlError(`URL路径编码失败: ${error.message}`, {
        code: 'ENCODE_PATH_ERROR',
        path,
        cause: error
      });
    }
  }

  /**
   * 解码URL路径
   * @param {string} path - 编码的URL路径
   * @returns {string} 解码后的路径
   */
  decodePath(path) {
    if (path === null || path === undefined) {
      return '';
    }
    
    try {
      return decodeURI(String(path));
    } catch (error) {
      logger.error('URL路径解码失败', {
        path,
        error: error.message
      });
      throw new UrlError(`URL路径解码失败: ${error.message}`, {
        code: 'DECODE_PATH_ERROR',
        path,
        cause: error
      });
    }
  }

  /**
   * 生成URL友好的字符串（slug）
   * @param {string} text - 原始文本
   * @param {Object} options - 选项
   * @returns {string} URL友好的字符串
   */
  slugify(text, options = {}) {
    if (!text) {
      return '';
    }
    
    const { 
      lowercase = true, 
      separator = '-',
      maxLength = 100 
    } = options;
    
    try {
      let slug = String(text)
        // 移除特殊字符，保留字母数字和一些基本符号
        .replace(/[^\w\s\u4e00-\u9fa5-]/g, '')
        // 替换空白字符为分隔符
        .replace(/\s+/g, separator)
        // 移除多余的分隔符
        .replace(new RegExp(`${separator}+`, 'g'), separator)
        // 移除首尾分隔符
        .replace(new RegExp(`^${separator}+|${separator}+$`, 'g'), '');
      
      // 转换为小写
      if (lowercase) {
        slug = slug.toLowerCase();
      }
      
      // 限制长度
      if (maxLength && slug.length > maxLength) {
        slug = slug.slice(0, maxLength);
        // 确保不会截断到分隔符
        const lastSeparatorIndex = slug.lastIndexOf(separator);
        if (lastSeparatorIndex > maxLength * 0.8) {
          slug = slug.slice(0, lastSeparatorIndex);
        }
      }
      
      return slug;
    } catch (error) {
      logger.error('URL slug生成失败', {
        text,
        error: error.message
      });
      throw new UrlError(`URL slug生成失败: ${error.message}`, {
        code: 'SLUGIFY_ERROR',
        text,
        cause: error
      });
    }
  }

  /**
   * 生成短URL标识符
   * @param {string} urlString - 原始URL
   * @param {number} length - 短标识符长度
   * @returns {string} 短标识符
   */
  generateShortId(urlString, length = 6) {
    if (!urlString) {
      return '';
    }
    
    try {
      // 使用MD5哈希生成标识符
      const hash = crypto
        .createHash('md5')
        .update(urlString)
        .digest('base64')
        // 移除特殊字符，只保留字母和数字
        .replace(/[^A-Za-z0-9]/g, '')
        // 截取指定长度
        .slice(0, length);
      
      return hash;
    } catch (error) {
      logger.error('短URL标识符生成失败', {
        url: urlString,
        error: error.message
      });
      throw new UrlError(`短URL标识符生成失败: ${error.message}`, {
        code: 'GENERATE_SHORT_ID_ERROR',
        url: urlString,
        cause: error
      });
    }
  }

  /**
   * 解析URL中的域名部分
   * @param {string} hostname - 主机名
   * @returns {Object} 域名信息
   */
  parseDomain(hostname) {
    if (!hostname) {
      return null;
    }
    
    try {
      const parts = hostname.split('.');
      
      if (parts.length < 2) {
        return {
          subdomain: '',
          domain: hostname,
          tld: ''
        };
      }
      
      // 简单的域名解析
      const tld = parts[parts.length - 1];
      const domain = parts[parts.length - 2];
      const subdomain = parts.slice(0, -2).join('.');
      
      return {
        subdomain,
        domain: `${domain}.${tld}`,
        tld
      };
    } catch (error) {
      logger.error('域名解析失败', {
        hostname,
        error: error.message
      });
      return null;
    }
  }

  /**
   * 检查URL是否是内部URL（同域名）
   * @param {string} urlString - 要检查的URL
   * @param {string|Array<string>} baseDomains - 基础域名
   * @returns {boolean} 是否是内部URL
   */
  isInternalUrl(urlString, baseDomains) {
    if (!urlString || !baseDomains) {
      return false;
    }
    
    try {
      const parsed = this.parse(urlString);
      const urlDomain = parsed.hostname;
      
      const domains = Array.isArray(baseDomains) ? baseDomains : [baseDomains];
      
      return domains.some(domain => {
        // 精确匹配或子域名匹配
        return urlDomain === domain || urlDomain.endsWith(`.${domain}`);
      });
    } catch (error) {
      return false;
    }
  }

  /**
   * 静态实例
   * @private
   */
  static _instance = null;

  /**
   * 获取单例实例
   * @returns {UrlUtils} URL工具实例
   */
  static getInstance() {
    if (!UrlUtils._instance) {
      UrlUtils._instance = new UrlUtils();
    }
    return UrlUtils._instance;
  }

  /**
   * 创建新的URL工具实例
   * @returns {UrlUtils} URL工具实例
   */
  static create() {
    return new UrlUtils();
  }
}

// 创建默认实例
const defaultUrlUtils = UrlUtils.getInstance();

module.exports = {
  UrlUtils,
  urlUtils: defaultUrlUtils
};