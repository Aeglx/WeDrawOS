/**
 * 序列化工具
 * 提供高级对象序列化和反序列化功能
 */

const { Buffer } = require('buffer');
const { EventEmitter } = require('events');
const { logger } = require('../logger');
const { typeUtils } = require('../type');
const { stringUtils } = require('../string');
const { performanceUtils } = require('../performance');
const { logContext } = require('../logger/LogContext');

/**
 * 序列化格式枚举
 */
const SerializationFormat = {
  JSON: 'json',
  CBOR: 'cbor',
  MESSAGE_PACK: 'messagepack',
  PROTOBUF: 'protobuf',
  YAML: 'yaml',
  XML: 'xml',
  CSV: 'csv',
  HTML_FORM: 'html_form',
  QUERY_STRING: 'query_string',
  PLAIN_TEXT: 'plain_text'
};

/**
 * 压缩格式枚举
 */
const CompressionFormat = {
  NONE: 'none',
  GZIP: 'gzip',
  DEFLATE: 'deflate',
  BROTLI: 'brotli',
  LZ4: 'lz4'
};

/**
 * 编码格式枚举
 */
const EncodingFormat = {
  UTF8: 'utf8',
  BASE64: 'base64',
  BASE64URL: 'base64url',
  HEX: 'hex',
  ASCII: 'ascii',
  BINARY: 'binary'
};

/**
 * 序列化工具类
 * 提供高级对象序列化和反序列化功能
 */
class SerializationUtils extends EventEmitter {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   */
  constructor(options = {}) {
    super();

    this.options = {
      defaultFormat: options.defaultFormat || SerializationFormat.JSON,
      defaultEncoding: options.defaultEncoding || EncodingFormat.UTF8,
      defaultCompression: options.defaultCompression || CompressionFormat.NONE,
      prettyPrint: options.prettyPrint !== undefined ? options.prettyPrint : false,
      maxDepth: options.maxDepth || 10,
      maxArrayLength: options.maxArrayLength || 10000,
      serializeFunctions: options.serializeFunctions !== undefined ? options.serializeFunctions : false,
      circularReferenceHandling: options.circularReferenceHandling || 'ignore', // 'ignore', 'error', 'reference'
      ...options
    };

    // 统计信息
    this.stats = {
      serializeCount: 0,
      deserializeCount: 0,
      serializeErrors: 0,
      deserializeErrors: 0,
      totalSerializeTime: 0,
      totalDeserializeTime: 0
    };

    // 压缩模块缓存
    this._compressionModules = {};

    // 序列化器和反序列化器映射
    this._serializers = this._registerSerializers();
    this._deserializers = this._registerDeserializers();

    // 设置最大监听器
    this.setMaxListeners(50);

    logger.debug('序列化工具初始化完成', {
      defaultFormat: this.options.defaultFormat,
      defaultEncoding: this.options.defaultEncoding
    });
  }

  /**
   * 注册序列化器
   * @returns {Object} 序列化器映射
   * @private
   */
  _registerSerializers() {
    return {
      [SerializationFormat.JSON]: this._serializeJSON.bind(this),
      [SerializationFormat.PLAIN_TEXT]: this._serializePlainText.bind(this),
      [SerializationFormat.QUERY_STRING]: this._serializeQueryString.bind(this),
      [SerializationFormat.CSV]: this._serializeCSV.bind(this),
      [SerializationFormat.HTML_FORM]: this._serializeHtmlForm.bind(this)
    };
  }

  /**
   * 注册反序列化器
   * @returns {Object} 反序列化器映射
   * @private
   */
  _registerDeserializers() {
    return {
      [SerializationFormat.JSON]: this._deserializeJSON.bind(this),
      [SerializationFormat.PLAIN_TEXT]: this._deserializePlainText.bind(this),
      [SerializationFormat.QUERY_STRING]: this._deserializeQueryString.bind(this),
      [SerializationFormat.CSV]: this._deserializeCSV.bind(this),
      [SerializationFormat.HTML_FORM]: this._deserializeHtmlForm.bind(this)
    };
  }

  /**
   * 序列化对象
   * @param {*} data - 要序列化的数据
   * @param {Object} options - 序列化选项
   * @returns {string|Buffer} 序列化后的数据
   */
  async serialize(data, options = {}) {
    const startTime = performance.now();
    
    try {
      const format = options.format || this.options.defaultFormat;
      const encoding = options.encoding || this.options.defaultEncoding;
      const compression = options.compression || this.options.defaultCompression;
      
      // 验证数据
      this._validateSerializeData(data, options);
      
      // 预处理数据
      const processedData = this._preprocessData(data, options);
      
      // 选择序列化器
      const serializer = this._serializers[format];
      if (!serializer) {
        throw new Error(`不支持的序列化格式: ${format}`);
      }
      
      // 执行序列化
      let serialized = serializer(processedData, options);
      
      // 压缩数据
      if (compression !== CompressionFormat.NONE) {
        serialized = await this._compress(serialized, compression);
      }
      
      // 转换编码
      if (Buffer.isBuffer(serialized) && encoding && encoding !== EncodingFormat.BINARY) {
        serialized = serialized.toString(encoding);
      }
      
      // 更新统计信息
      const duration = performance.now() - startTime;
      this.stats.serializeCount++;
      this.stats.totalSerializeTime += duration;
      
      performanceUtils.recordTimer('serialization.serialize', duration);
      
      logger.debug('序列化成功', {
        format,
        compression,
        dataType: typeUtils.getType(data),
        duration,
        requestId: logContext.getRequestId()
      });
      
      this.emit('serialize', {
        format,
        dataType: typeUtils.getType(data),
        duration
      });
      
      return serialized;
    } catch (error) {
      this._handleSerializeError(error, options);
      throw error;
    }
  }

  /**
   * 反序列化数据
   * @param {string|Buffer} data - 要反序列化的数据
   * @param {Object} options - 反序列化选项
   * @returns {*} 反序列化后的对象
   */
  async deserialize(data, options = {}) {
    const startTime = performance.now();
    
    try {
      const format = options.format || this.options.defaultFormat;
      const encoding = options.encoding || this.options.defaultEncoding;
      const compression = options.compression || this.options.defaultCompression;
      
      // 验证数据
      this._validateDeserializeData(data, options);
      
      // 解码数据
      let decodedData = data;
      if (typeof data === 'string' && encoding && encoding !== EncodingFormat.UTF8) {
        decodedData = Buffer.from(data, encoding);
      }
      
      // 解压缩数据
      if (compression !== CompressionFormat.NONE) {
        decodedData = await this._decompress(decodedData, compression);
      }
      
      // 选择反序列化器
      const deserializer = this._deserializers[format];
      if (!deserializer) {
        throw new Error(`不支持的反序列化格式: ${format}`);
      }
      
      // 执行反序列化
      let deserialized = deserializer(decodedData, options);
      
      // 后处理数据
      deserialized = this._postprocessData(deserialized, options);
      
      // 更新统计信息
      const duration = performance.now() - startTime;
      this.stats.deserializeCount++;
      this.stats.totalDeserializeTime += duration;
      
      performanceUtils.recordTimer('serialization.deserialize', duration);
      
      logger.debug('反序列化成功', {
        format,
        compression,
        duration,
        requestId: logContext.getRequestId()
      });
      
      this.emit('deserialize', {
        format,
        duration
      });
      
      return deserialized;
    } catch (error) {
      this._handleDeserializeError(error, options);
      throw error;
    }
  }

  /**
   * JSON序列化
   * @param {*} data - 要序列化的数据
   * @param {Object} options - 序列化选项
   * @returns {string} JSON字符串
   * @private
   */
  _serializeJSON(data, options = {}) {
    const prettyPrint = options.prettyPrint !== undefined ? options.prettyPrint : this.options.prettyPrint;
    const space = prettyPrint ? 2 : 0;
    
    // 创建自定义的replacer函数处理特殊对象
    const replacer = (key, value) => this._createReplacer(options)(key, value);
    
    return JSON.stringify(data, replacer, space);
  }

  /**
   * JSON反序列化
   * @param {string} data - JSON字符串
   * @param {Object} options - 反序列化选项
   * @returns {*} 反序列化后的对象
   * @private
   */
  _deserializeJSON(data, options = {}) {
    try {
      // 创建自定义的reviver函数恢复特殊对象
      const reviver = (key, value) => this._createReviver(options)(key, value);
      
      return JSON.parse(data, reviver);
    } catch (error) {
      throw new Error(`JSON解析失败: ${error.message}`);
    }
  }

  /**
   * 纯文本序列化
   * @param {*} data - 要序列化的数据
   * @param {Object} options - 序列化选项
   * @returns {string} 文本字符串
   * @private
   */
  _serializePlainText(data, options = {}) {
    if (typeUtils.isPrimitive(data)) {
      return String(data);
    }
    
    // 对于复杂对象，默认转为JSON
    return this._serializeJSON(data, { ...options, prettyPrint: true });
  }

  /**
   * 纯文本反序列化
   * @param {string} data - 文本字符串
   * @param {Object} options - 反序列化选项
   * @returns {*} 解析后的对象
   * @private
   */
  _deserializePlainText(data, options = {}) {
    // 尝试作为JSON解析
    try {
      return this._deserializeJSON(data, options);
    } catch (e) {
      // 如果不是有效JSON，返回原始字符串
      return data;
    }
  }

  /**
   * Query String序列化
   * @param {Object} data - 要序列化的数据
   * @param {Object} options - 序列化选项
   * @returns {string} 查询字符串
   * @private
   */
  _serializeQueryString(data, options = {}) {
    if (!typeUtils.isObject(data)) {
      throw new Error('Query String序列化需要对象类型的数据');
    }
    
    const entries = [];
    const separator = options.separator || '&';
    const equals = options.equals || '=';
    
    for (const [key, value] of Object.entries(data)) {
      if (Array.isArray(value)) {
        // 处理数组
        for (const item of value) {
          entries.push(`${encodeURIComponent(key)}${equals}${encodeURIComponent(String(item))}`);
        }
      } else if (typeUtils.isObject(value)) {
        // 处理嵌套对象
        for (const [nestedKey, nestedValue] of Object.entries(value)) {
          entries.push(`${encodeURIComponent(`${key}[${nestedKey}]`)}${equals}${encodeURIComponent(String(nestedValue))}`);
        }
      } else {
        entries.push(`${encodeURIComponent(key)}${equals}${encodeURIComponent(String(value))}`);
      }
    }
    
    return entries.join(separator);
  }

  /**
   * Query String反序列化
   * @param {string} data - 查询字符串
   * @param {Object} options - 反序列化选项
   * @returns {Object} 解析后的对象
   * @private
   */
  _deserializeQueryString(data, options = {}) {
    if (typeof data !== 'string') {
      throw new Error('Query String反序列化需要字符串类型的数据');
    }
    
    const result = {};
    const separator = options.separator || '&';
    const equals = options.equals || '=';
    
    const pairs = data.split(separator);
    for (const pair of pairs) {
      if (!pair) continue;
      
      const [key, value] = pair.split(equals).map(decodeURIComponent);
      
      // 处理嵌套对象格式
      if (key.includes('[')) {
        const match = key.match(/^([^\[]+)\[([^\]]+)\]$/);
        if (match) {
          const [, outerKey, innerKey] = match;
          if (!result[outerKey]) {
            result[outerKey] = {};
          }
          result[outerKey][innerKey] = this._convertStringValue(value);
        } else {
          result[key] = this._convertStringValue(value);
        }
      } else {
        // 检查是否已经存在此键
        if (result.hasOwnProperty(key)) {
          // 如果已存在，转换为数组
          if (!Array.isArray(result[key])) {
            result[key] = [result[key]];
          }
          result[key].push(this._convertStringValue(value));
        } else {
          result[key] = this._convertStringValue(value);
        }
      }
    }
    
    return result;
  }

  /**
   * CSV序列化
   * @param {Array} data - 要序列化的数据数组
   * @param {Object} options - 序列化选项
   * @returns {string} CSV字符串
   * @private
   */
  _serializeCSV(data, options = {}) {
    if (!Array.isArray(data)) {
      throw new Error('CSV序列化需要数组类型的数据');
    }
    
    const delimiter = options.delimiter || ',';
    const header = options.header !== undefined ? options.header : true;
    const quote = options.quote || '"';
    
    if (data.length === 0) {
      return header ? '' : '';
    }
    
    // 获取所有可能的列
    const columns = new Set();
    data.forEach(item => {
      if (typeUtils.isObject(item)) {
        Object.keys(item).forEach(key => columns.add(key));
      }
    });
    
    const columnArray = Array.from(columns);
    const lines = [];
    
    // 添加头部
    if (header) {
      lines.push(columnArray.map(col => this._quoteCSVValue(col, quote, delimiter)).join(delimiter));
    }
    
    // 添加数据行
    data.forEach(item => {
      const row = columnArray.map(col => {
        const value = typeUtils.isObject(item) ? item[col] : undefined;
        return this._quoteCSVValue(value, quote, delimiter);
      });
      lines.push(row.join(delimiter));
    });
    
    return lines.join('\n');
  }

  /**
   * CSV反序列化
   * @param {string} data - CSV字符串
   * @param {Object} options - 反序列化选项
   * @returns {Array} 解析后的数据数组
   * @private
   */
  _deserializeCSV(data, options = {}) {
    if (typeof data !== 'string') {
      throw new Error('CSV反序列化需要字符串类型的数据');
    }
    
    const delimiter = options.delimiter || ',';
    const hasHeader = options.header !== undefined ? options.header : true;
    const quote = options.quote || '"';
    
    const lines = data.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) {
      return [];
    }
    
    const result = [];
    let headers = [];
    let startIndex = 0;
    
    // 解析头部
    if (hasHeader) {
      headers = this._parseCSVLine(lines[0], delimiter, quote).map(h => h.trim());
      startIndex = 1;
    }
    
    // 解析数据行
    for (let i = startIndex; i < lines.length; i++) {
      const values = this._parseCSVLine(lines[i], delimiter, quote);
      const row = {};
      
      if (hasHeader) {
        headers.forEach((header, index) => {
          row[header] = this._convertStringValue(values[index]);
        });
      } else {
        // 如果没有头部，使用索引作为键
        values.forEach((value, index) => {
          row[index.toString()] = this._convertStringValue(value);
        });
      }
      
      result.push(row);
    }
    
    return result;
  }

  /**
   * HTML表单序列化
   * @param {Object} data - 要序列化的数据
   * @param {Object} options - 序列化选项
   * @returns {string} HTML表单数据
   * @private
   */
  _serializeHtmlForm(data, options = {}) {
    // HTML表单序列化与Query String类似
    return this._serializeQueryString(data, options);
  }

  /**
   * HTML表单反序列化
   * @param {string} data - HTML表单数据
   * @param {Object} options - 反序列化选项
   * @returns {Object} 解析后的对象
   * @private
   */
  _deserializeHtmlForm(data, options = {}) {
    // HTML表单反序列化与Query String类似
    return this._deserializeQueryString(data, options);
  }

  /**
   * 创建JSON replacer函数
   * @param {Object} options - 选项
   * @returns {Function} replacer函数
   * @private
   */
  _createReplacer(options = {}) {
    const visited = new WeakSet();
    const maxDepth = options.maxDepth !== undefined ? options.maxDepth : this.options.maxDepth;
    const serializeFunctions = options.serializeFunctions !== undefined ? options.serializeFunctions : this.options.serializeFunctions;
    const circularReferenceHandling = options.circularReferenceHandling || this.options.circularReferenceHandling;
    
    const replacer = (key, value, currentDepth = 0) => {
      // 检查递归深度
      if (currentDepth > maxDepth) {
        return '[Circular]';
      }
      
      // 处理null和undefined
      if (value === null || value === undefined) {
        return value;
      }
      
      // 处理函数
      if (typeof value === 'function') {
        if (serializeFunctions) {
          return { 
            __type: 'function', 
            value: value.toString() 
          };
        }
        return undefined;
      }
      
      // 处理日期
      if (value instanceof Date) {
        return { 
          __type: 'date', 
          value: value.toISOString() 
        };
      }
      
      // 处理正则表达式
      if (value instanceof RegExp) {
        return { 
          __type: 'regexp', 
          pattern: value.source,
          flags: value.flags 
        };
      }
      
      // 处理Buffer
      if (Buffer.isBuffer(value)) {
        return { 
          __type: 'buffer', 
          value: value.toString('base64') 
        };
      }
      
      // 处理错误对象
      if (value instanceof Error) {
        return { 
          __type: 'error', 
          name: value.name,
          message: value.message,
          stack: value.stack,
          ...Object.fromEntries(Object.getOwnPropertyNames(value)
            .filter(prop => !['name', 'message', 'stack'].includes(prop))
            .map(prop => [prop, value[prop]]))
        };
      }
      
      // 处理循环引用
      if (typeUtils.isObject(value)) {
        if (visited.has(value)) {
          switch (circularReferenceHandling) {
            case 'error':
              throw new Error('检测到循环引用');
            case 'ignore':
              return '[Circular]';
            case 'reference':
              return { __type: 'circular' };
            default:
              return '[Circular]';
          }
        }
        
        visited.add(value);
        
        // 递归处理对象属性
        if (Array.isArray(value)) {
          // 限制数组长度
          const maxArrayLength = options.maxArrayLength !== undefined ? options.maxArrayLength : this.options.maxArrayLength;
          if (value.length > maxArrayLength) {
            const result = value.slice(0, maxArrayLength);
            result.push(`[截断: 还有 ${value.length - maxArrayLength} 个元素]`);
            return result.map((item, index) => replacer(index.toString(), item, currentDepth + 1));
          }
          return value.map((item, index) => replacer(index.toString(), item, currentDepth + 1));
        } else {
          const obj = {};
          for (const [k, v] of Object.entries(value)) {
            obj[k] = replacer(k, v, currentDepth + 1);
          }
          return obj;
        }
      }
      
      // 返回原始值
      return value;
    };
    
    return (key, value) => replacer(key, value);
  }

  /**
   * 创建JSON reviver函数
   * @param {Object} options - 选项
   * @returns {Function} reviver函数
   * @private
   */
  _createReviver(options = {}) {
    return (key, value) => {
      // 检查是否有特殊类型标记
      if (typeUtils.isObject(value) && value.__type) {
        switch (value.__type) {
          case 'function':
            if (options.deserializeFunctions !== false) {
              try {
                return new Function(`return ${value.value}`)();
              } catch (e) {
                logger.warn('无法反序列化函数', { error: e.message });
                return undefined;
              }
            }
            return undefined;
          case 'date':
            return new Date(value.value);
          case 'regexp':
            return new RegExp(value.pattern, value.flags);
          case 'buffer':
            return Buffer.from(value.value, 'base64');
          case 'error':
            const error = new Error(value.message);
            error.name = value.name;
            error.stack = value.stack;
            // 添加其他属性
            for (const [k, v] of Object.entries(value)) {
              if (!['__type', 'name', 'message', 'stack'].includes(k)) {
                error[k] = v;
              }
            }
            return error;
          case 'circular':
            return '[Circular]';
          default:
            return value;
        }
      }
      return value;
    };
  }

  /**
   * 压缩数据
   * @param {string|Buffer} data - 要压缩的数据
   * @param {string} format - 压缩格式
   * @returns {Promise<Buffer>} 压缩后的数据
   * @private
   */
  async _compress(data, format) {
    const bufferData = typeof data === 'string' ? Buffer.from(data) : data;
    
    switch (format) {
      case CompressionFormat.GZIP:
        return this._getCompressionModule('zlib').then(zlib => {
          return new Promise((resolve, reject) => {
            zlib.gzip(bufferData, (err, compressed) => {
              if (err) reject(err);
              else resolve(compressed);
            });
          });
        });
      case CompressionFormat.DEFLATE:
        return this._getCompressionModule('zlib').then(zlib => {
          return new Promise((resolve, reject) => {
            zlib.deflate(bufferData, (err, compressed) => {
              if (err) reject(err);
              else resolve(compressed);
            });
          });
        });
      case CompressionFormat.BROTLI:
        try {
          return this._getCompressionModule('zlib').then(zlib => {
            if (zlib.brotliCompress) {
              return new Promise((resolve, reject) => {
                zlib.brotliCompress(bufferData, (err, compressed) => {
                  if (err) reject(err);
                  else resolve(compressed);
                });
              });
            } else {
              throw new Error('Brotli压缩在当前Node.js版本中不可用');
            }
          });
        } catch (error) {
          logger.warn('Brotli压缩不可用，回退到gzip', { error: error.message });
          return this._compress(data, CompressionFormat.GZIP);
        }
      default:
        throw new Error(`不支持的压缩格式: ${format}`);
    }
  }

  /**
   * 解压缩数据
   * @param {Buffer} data - 要解压缩的数据
   * @param {string} format - 压缩格式
   * @returns {Promise<Buffer>} 解压后的数据
   * @private
   */
  async _decompress(data, format) {
    if (!Buffer.isBuffer(data)) {
      throw new Error('解压缩需要Buffer类型的数据');
    }
    
    switch (format) {
      case CompressionFormat.GZIP:
        return this._getCompressionModule('zlib').then(zlib => {
          return new Promise((resolve, reject) => {
            zlib.gunzip(data, (err, decompressed) => {
              if (err) reject(err);
              else resolve(decompressed);
            });
          });
        });
      case CompressionFormat.DEFLATE:
        return this._getCompressionModule('zlib').then(zlib => {
          return new Promise((resolve, reject) => {
            zlib.inflate(data, (err, decompressed) => {
              if (err) reject(err);
              else resolve(decompressed);
            });
          });
        });
      case CompressionFormat.BROTLI:
        try {
          return this._getCompressionModule('zlib').then(zlib => {
            if (zlib.brotliDecompress) {
              return new Promise((resolve, reject) => {
                zlib.brotliDecompress(data, (err, decompressed) => {
                  if (err) reject(err);
                  else resolve(decompressed);
                });
              });
            } else {
              throw new Error('Brotli解压缩在当前Node.js版本中不可用');
            }
          });
        } catch (error) {
          logger.warn('Brotli解压缩不可用，尝试使用gzip', { error: error.message });
          return this._decompress(data, CompressionFormat.GZIP);
        }
      default:
        throw new Error(`不支持的解压缩格式: ${format}`);
    }
  }

  /**
   * 获取压缩模块
   * @param {string} moduleName - 模块名称
   * @returns {Promise<any>} 模块实例
   * @private
   */
  async _getCompressionModule(moduleName) {
    if (!this._compressionModules[moduleName]) {
      this._compressionModules[moduleName] = require(moduleName);
    }
    return this._compressionModules[moduleName];
  }

  /**
   * 验证序列化数据
   * @param {*} data - 要验证的数据
   * @param {Object} options - 选项
   * @private
   */
  _validateSerializeData(data, options = {}) {
    if (data === undefined) {
      throw new Error('不能序列化undefined');
    }
    
    // 检查数据大小（如果是对象）
    if (typeUtils.isObject(data) && options.maxSize) {
      const estimatedSize = this._estimateObjectSize(data);
      if (estimatedSize > options.maxSize) {
        throw new Error(`数据大小超过限制: ${estimatedSize} > ${options.maxSize}`);
      }
    }
  }

  /**
   * 验证反序列化数据
   * @param {*} data - 要验证的数据
   * @param {Object} options - 选项
   * @private
   */
  _validateDeserializeData(data, options = {}) {
    if (data === null || data === undefined) {
      throw new Error('不能反序列化null或undefined');
    }
    
    // 检查数据类型
    if (typeof data !== 'string' && !Buffer.isBuffer(data)) {
      throw new Error('反序列化需要字符串或Buffer类型的数据');
    }
    
    // 检查数据大小
    if (options.maxSize) {
      const size = Buffer.isBuffer(data) ? data.length : Buffer.byteLength(data);
      if (size > options.maxSize) {
        throw new Error(`数据大小超过限制: ${size} > ${options.maxSize}`);
      }
    }
  }

  /**
   * 预处理数据
   * @param {*} data - 要处理的数据
   * @param {Object} options - 选项
   * @returns {*} 处理后的数据
   * @private
   */
  _preprocessData(data, options = {}) {
    // 如果提供了自定义处理器，使用它
    if (options.preProcessor) {
      return options.preProcessor(data);
    }
    
    // 默认深拷贝数据以避免修改原始对象
    return typeUtils.deepClone(data);
  }

  /**
   * 后处理数据
   * @param {*} data - 要处理的数据
   * @param {Object} options - 选项
   * @returns {*} 处理后的数据
   * @private
   */
  _postprocessData(data, options = {}) {
    // 如果提供了自定义处理器，使用它
    if (options.postProcessor) {
      return options.postProcessor(data);
    }
    
    return data;
  }

  /**
   * CSV值引用处理
   * @param {*} value - 要处理的值
   * @param {string} quote - 引号字符
   * @param {string} delimiter - 分隔符
   * @returns {string} 处理后的值
   * @private
   */
  _quoteCSVValue(value, quote, delimiter) {
    if (value === null || value === undefined) {
      return '';
    }
    
    let strValue = String(value);
    
    // 如果值包含分隔符、引号或换行符，需要加引号
    if (strValue.includes(delimiter) || strValue.includes(quote) || strValue.includes('\n') || strValue.includes('\r')) {
      // 转义引号
      strValue = strValue.split(quote).join(quote + quote);
      return quote + strValue + quote;
    }
    
    return strValue;
  }

  /**
   * 解析CSV行
   * @param {string} line - CSV行
   * @param {string} delimiter - 分隔符
   * @param {string} quote - 引号字符
   * @returns {Array} 解析后的值数组
   * @private
   */
  _parseCSVLine(line, delimiter, quote) {
    const result = [];
    let current = '';
    let inQuotes = false;
    let i = 0;
    
    while (i < line.length) {
      const char = line[i];
      
      if (char === quote) {
        if (inQuotes) {
          // 检查是否是转义的引号
          if (i + 1 < line.length && line[i + 1] === quote) {
            current += quote;
            i += 2;
            continue;
          } else {
            inQuotes = false;
          }
        } else {
          inQuotes = true;
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
      
      i++;
    }
    
    // 添加最后一个值
    result.push(current);
    
    return result;
  }

  /**
   * 转换字符串值为适当的类型
   * @param {string} value - 字符串值
   * @returns {*} 转换后的值
   * @private
   */
  _convertStringValue(value) {
    if (value === null || value === undefined) {
      return null;
    }
    
    const str = String(value).trim();
    
    // 尝试解析数字
    if (/^\d+$/.test(str)) {
      return parseInt(str, 10);
    }
    
    if (/^\d+\.\d+$/.test(str)) {
      return parseFloat(str);
    }
    
    // 尝试解析布尔值
    if (str.toLowerCase() === 'true') {
      return true;
    }
    
    if (str.toLowerCase() === 'false') {
      return false;
    }
    
    // 尝试解析null
    if (str.toLowerCase() === 'null') {
      return null;
    }
    
    // 尝试解析undefined
    if (str.toLowerCase() === 'undefined') {
      return undefined;
    }
    
    // 保持为字符串
    return str;
  }

  /**
   * 估计对象大小
   * @param {*} obj - 要估计大小的对象
   * @returns {number} 估计的大小（字节）
   * @private
   */
  _estimateObjectSize(obj) {
    // 简单的对象大小估计
    try {
      return Buffer.byteLength(JSON.stringify(obj));
    } catch (error) {
      return 0;
    }
  }

  /**
   * 处理序列化错误
   * @param {Error} error - 错误对象
   * @param {Object} options - 选项
   * @private
   */
  _handleSerializeError(error, options = {}) {
    this.stats.serializeErrors++;
    
    logger.error('序列化失败', {
      error: error.message,
      format: options.format || this.options.defaultFormat,
      dataType: typeUtils.getType(options.data),
      requestId: logContext.getRequestId()
    });
    
    this.emit('serialize.error', { error, options });
  }

  /**
   * 处理反序列化错误
   * @param {Error} error - 错误对象
   * @param {Object} options - 选项
   * @private
   */
  _handleDeserializeError(error, options = {}) {
    this.stats.deserializeErrors++;
    
    logger.error('反序列化失败', {
      error: error.message,
      format: options.format || this.options.defaultFormat,
      dataSize: typeof options.data === 'string' ? options.data.length : (options.data ? options.data.length : 0),
      requestId: logContext.getRequestId()
    });
    
    this.emit('deserialize.error', { error, options });
  }

  /**
   * 获取统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    return {
      ...this.stats,
      avgSerializeTime: this.stats.serializeCount > 0 ? this.stats.totalSerializeTime / this.stats.serializeCount : 0,
      avgDeserializeTime: this.stats.deserializeCount > 0 ? this.stats.totalDeserializeTime / this.stats.deserializeCount : 0
    };
  }

  /**
   * 重置统计信息
   */
  resetStats() {
    this.stats = {
      serializeCount: 0,
      deserializeCount: 0,
      serializeErrors: 0,
      deserializeErrors: 0,
      totalSerializeTime: 0,
      totalDeserializeTime: 0
    };
    
    logger.debug('序列化工具统计信息已重置');
  }

  /**
   * 静态实例
   * @private
   */
  static _instance = null;

  /**
   * 获取单例实例
   * @param {Object} options - 配置选项
   * @returns {SerializationUtils} 序列化工具实例
   */
  static getInstance(options = {}) {
    if (!SerializationUtils._instance) {
      SerializationUtils._instance = new SerializationUtils(options);
    }
    return SerializationUtils._instance;
  }

  /**
   * 创建新的序列化工具实例
   * @param {Object} options - 配置选项
   * @returns {SerializationUtils} 序列化工具实例
   */
  static create(options = {}) {
    return new SerializationUtils(options);
  }
}

// 创建默认实例
const defaultSerializationUtils = SerializationUtils.getInstance();

module.exports = {
  SerializationUtils,
  serializationUtils: defaultSerializationUtils,
  SerializationFormat,
  CompressionFormat,
  EncodingFormat
};