/**
 * 响应格式化模块
 * 提供统一的API响应格式，确保所有API响应具有一致的结构
 */

/**
 * 响应格式化器类
 * 提供各种类型的响应格式化方法
 */
class ResponseFormatter {
  /**
   * 成功响应
   * @param {Object} res - Express响应对象
   * @param {*} data - 要返回的数据
   * @param {string} message - 响应消息
   * @param {number} statusCode - HTTP状态码
   * @returns {Object} Express响应对象
   */
  static success(res, data = null, message = 'Success', statusCode = 200) {
    const response = {
      status: 'success',
      message,
      data,
      timestamp: new Date().toISOString()
    };

    return res.status(statusCode).json(response);
  }

  /**
   * 创建响应
   * @param {Object} res - Express响应对象
   * @param {*} data - 要返回的数据
   * @param {string} message - 响应消息
   * @param {number} statusCode - HTTP状态码
   * @returns {Object} Express响应对象
   */
  static created(res, data = null, message = 'Created successfully', statusCode = 201) {
    return this.success(res, data, message, statusCode);
  }

  /**
   * 空响应
   * @param {Object} res - Express响应对象
   * @param {string} message - 响应消息
   * @param {number} statusCode - HTTP状态码
   * @returns {Object} Express响应对象
   */
  static noContent(res, message = 'No content', statusCode = 204) {
    const response = {
      status: 'success',
      message,
      timestamp: new Date().toISOString()
    };

    return res.status(statusCode).json(response);
  }

  /**
   * 错误响应
   * @param {Object} res - Express响应对象
   * @param {string} message - 错误消息
   * @param {Object} errors - 错误详情
   * @param {number} statusCode - HTTP状态码
   * @returns {Object} Express响应对象
   */
  static error(res, message = 'Error occurred', errors = null, statusCode = 400) {
    const response = {
      status: 'error',
      message,
      timestamp: new Date().toISOString()
    };

    if (errors) {
      response.errors = errors;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * 失败响应（客户端错误）
   * @param {Object} res - Express响应对象
   * @param {string} message - 失败消息
   * @param {Object} data - 附加数据
   * @param {number} statusCode - HTTP状态码
   * @returns {Object} Express响应对象
   */
  static fail(res, message = 'Operation failed', data = null, statusCode = 400) {
    const response = {
      status: 'fail',
      message,
      timestamp: new Date().toISOString()
    };

    if (data) {
      response.data = data;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * 分页响应
   * @param {Object} res - Express响应对象
   * @param {Array} items - 数据项数组
   * @param {number} total - 总记录数
   * @param {number} page - 当前页码
   * @param {number} limit - 每页记录数
   * @param {string} message - 响应消息
   * @param {number} statusCode - HTTP状态码
   * @returns {Object} Express响应对象
   */
  static paginate(res, items = [], total = 0, page = 1, limit = 20, message = 'Data retrieved successfully', statusCode = 200) {
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    const pagination = {
      total,
      page,
      limit,
      totalPages,
      hasNextPage,
      hasPrevPage
    };

    const response = {
      status: 'success',
      message,
      data: items,
      pagination,
      timestamp: new Date().toISOString()
    };

    return res.status(statusCode).json(response);
  }

  /**
   * 验证错误响应
   * @param {Object} res - Express响应对象
   * @param {Object|Array} validationErrors - 验证错误对象或数组
   * @param {string} message - 响应消息
   * @param {number} statusCode - HTTP状态码
   * @returns {Object} Express响应对象
   */
  static validationError(res, validationErrors = {}, message = 'Validation failed', statusCode = 422) {
    // 规范化错误格式
    const errors = Array.isArray(validationErrors)
      ? this._formatValidationErrorsArray(validationErrors)
      : validationErrors;

    const response = {
      status: 'error',
      message,
      errors,
      timestamp: new Date().toISOString()
    };

    return res.status(statusCode).json(response);
  }

  /**
   * 格式化验证错误数组
   * @private
   * @param {Array} errorsArray - 错误数组
   * @returns {Object} 格式化的错误对象
   */
  static _formatValidationErrorsArray(errorsArray) {
    const errors = {};
    
    errorsArray.forEach(error => {
      if (error.param) {
        errors[error.param] = error.msg || 'Invalid value';
      } else if (error.field) {
        errors[error.field] = error.message || 'Invalid value';
      }
    });

    return errors;
  }

  /**
   * 带有元数据的响应
   * @param {Object} res - Express响应对象
   * @param {*} data - 主要数据
   * @param {Object} metadata - 元数据
   * @param {string} message - 响应消息
   * @param {number} statusCode - HTTP状态码
   * @returns {Object} Express响应对象
   */
  static withMetadata(res, data = null, metadata = {}, message = 'Success', statusCode = 200) {
    const response = {
      status: 'success',
      message,
      data,
      metadata,
      timestamp: new Date().toISOString()
    };

    return res.status(statusCode).json(response);
  }

  /**
   * 批量操作响应
   * @param {Object} res - Express响应对象
   * @param {number} successCount - 成功操作数
   * @param {number} failureCount - 失败操作数
   * @param {Array} failures - 失败详情
   * @param {string} message - 响应消息
   * @param {number} statusCode - HTTP状态码
   * @returns {Object} Express响应对象
   */
  static batchOperation(res, successCount = 0, failureCount = 0, failures = [], message = 'Batch operation completed', statusCode = 200) {
    const response = {
      status: 'success',
      message,
      summary: {
        total: successCount + failureCount,
        success: successCount,
        failed: failureCount
      },
      timestamp: new Date().toISOString()
    };

    if (failures.length > 0) {
      response.failures = failures;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * 重定向响应
   * @param {Object} res - Express响应对象
   * @param {string} url - 重定向URL
   * @param {number} statusCode - HTTP状态码
   * @returns {Object} Express响应对象
   */
  static redirect(res, url, statusCode = 302) {
    return res.redirect(statusCode, url);
  }

  /**
   * 文件下载响应
   * @param {Object} res - Express响应对象
   * @param {string} filePath - 文件路径
   * @param {string} fileName - 下载文件名
   * @returns {Object} Express响应对象
   */
  static download(res, filePath, fileName = null) {
    if (fileName) {
      return res.download(filePath, fileName);
    }
    return res.download(filePath);
  }

  /**
   * 流响应
   * @param {Object} res - Express响应对象
   * @param {Stream} stream - 数据流
   * @param {Object} options - 选项
   * @returns {Object} Express响应对象
   */
  static stream(res, stream, options = {}) {
    const { headers = {}, statusCode = 200 } = options;
    
    // 设置响应头
    Object.keys(headers).forEach(key => {
      res.setHeader(key, headers[key]);
    });

    res.status(statusCode);
    return stream.pipe(res);
  }

  /**
   * 设置响应头
   * @param {Object} res - Express响应对象
   * @param {Object} headers - 要设置的响应头
   * @returns {Object} Express响应对象
   */
  static setHeaders(res, headers = {}) {
    Object.keys(headers).forEach(key => {
      res.setHeader(key, headers[key]);
    });
    return res;
  }

  /**
   * 创建响应中间件
   * @returns {Function} Express中间件函数
   */
  static createResponseMiddleware() {
    return (req, res, next) => {
      // 向响应对象添加格式化方法
      res.success = (data, message, statusCode) => 
        ResponseFormatter.success(res, data, message, statusCode);
      
      res.created = (data, message, statusCode) => 
        ResponseFormatter.created(res, data, message, statusCode);
      
      res.noContent = (message, statusCode) => 
        ResponseFormatter.noContent(res, message, statusCode);
      
      res.error = (message, errors, statusCode) => 
        ResponseFormatter.error(res, message, errors, statusCode);
      
      res.fail = (message, data, statusCode) => 
        ResponseFormatter.fail(res, message, data, statusCode);
      
      res.paginate = (items, total, page, limit, message, statusCode) => 
        ResponseFormatter.paginate(res, items, total, page, limit, message, statusCode);
      
      res.validationError = (errors, message, statusCode) => 
        ResponseFormatter.validationError(res, errors, message, statusCode);
      
      res.withMetadata = (data, metadata, message, statusCode) => 
        ResponseFormatter.withMetadata(res, data, metadata, message, statusCode);
      
      res.batchOperation = (successCount, failureCount, failures, message, statusCode) => 
        ResponseFormatter.batchOperation(res, successCount, failureCount, failures, message, statusCode);
      
      res.downloadFile = (filePath, fileName) => 
        ResponseFormatter.download(res, filePath, fileName);

      next();
    };
  }

  /**
   * 规范化数据响应
   * @param {*} data - 原始数据
   * @param {Object} options - 规范化选项
   * @returns {*} 规范化后的数据
   */
  static normalizeData(data, options = {}) {
    const { exclude = [], rename = {} } = options;
    
    if (Array.isArray(data)) {
      return data.map(item => this.normalizeData(item, options));
    }
    
    if (data && typeof data === 'object') {
      const normalized = {};
      
      Object.keys(data).forEach(key => {
        // 排除指定字段
        if (exclude.includes(key)) {
          return;
        }
        
        // 重命名字段
        const newKey = rename[key] || key;
        normalized[newKey] = data[key];
      });
      
      return normalized;
    }
    
    return data;
  }

  /**
   * 安全响应
   * 移除敏感数据后的响应
   * @param {Object} res - Express响应对象
   * @param {*} data - 要返回的数据
   * @param {Array} sensitiveFields - 敏感字段列表
   * @param {string} message - 响应消息
   * @param {number} statusCode - HTTP状态码
   * @returns {Object} Express响应对象
   */
  static secure(res, data, sensitiveFields = ['password', 'token', 'creditCard'], message = 'Success', statusCode = 200) {
    const secureData = this.normalizeData(data, { exclude: sensitiveFields });
    return this.success(res, secureData, message, statusCode);
  }
}

module.exports = ResponseFormatter;