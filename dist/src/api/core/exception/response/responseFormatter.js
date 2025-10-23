/**
 * 响应格式化工具
 * 提供统一的API响应格式
 */

/**
 * 成功响应
 * @param {Object} res - Express响应对象
 * @param {any} data - 响应数据
 * @param {string} message - 响应消息
 * @param {number} statusCode - HTTP状态码
 */
function success(res, data = null, message = '操作成功', statusCode = 200) {
  const response = {
    code: 0,
    message,
    data: data || null,
    timestamp: Date.now()
  };
  
  res.status(statusCode).json(response);
}

/**
 * 错误响应
 * @param {Object} res - Express响应对象
 * @param {number} code - 错误代码
 * @param {string} message - 错误消息
 * @param {any} data - 附加数据
 * @param {number} statusCode - HTTP状态码
 */
function error(res, code = 500, message = '服务器内部错误', data = null, statusCode = 500) {
  const response = {
    code,
    message,
    data: data || null,
    timestamp: Date.now()
  };
  
  res.status(statusCode).json(response);
}

/**
 * 参数错误响应
 * @param {Object} res - Express响应对象
 * @param {string} message - 错误消息
 * @param {Object} errors - 具体参数错误信息
 */
function badRequest(res, message = '请求参数错误', errors = null) {
  error(res, 400, message, errors, 400);
}

/**
 * 未授权响应
 * @param {Object} res - Express响应对象
 * @param {string} message - 错误消息
 */
function unauthorized(res, message = '未授权访问') {
  error(res, 401, message, null, 401);
}

/**
 * 禁止访问响应
 * @param {Object} res - Express响应对象
 * @param {string} message - 错误消息
 */
function forbidden(res, message = '禁止访问') {
  error(res, 403, message, null, 403);
}

/**
 * 资源不存在响应
 * @param {Object} res - Express响应对象
 * @param {string} message - 错误消息
 */
function notFound(res, message = '资源不存在') {
  error(res, 404, message, null, 404);
}

/**
 * 服务器错误响应
 * @param {Object} res - Express响应对象
 * @param {string} message - 错误消息
 * @param {any} data - 附加数据
 */
function serverError(res, message = '服务器内部错误', data = null) {
  error(res, 500, message, data, 500);
}

/**
 * 分页响应
 * @param {Object} res - Express响应对象
 * @param {Array} items - 数据列表
 * @param {number} total - 总记录数
 * @param {number} page - 当前页码
 * @param {number} pageSize - 每页大小
 * @param {string} message - 响应消息
 */
function pagination(res, items = [], total = 0, page = 1, pageSize = 10, message = '查询成功') {
  const totalPages = Math.ceil(total / pageSize);
  
  const response = {
    code: 0,
    message,
    data: {
      items,
      pagination: {
        total,
        page,
        pageSize,
        totalPages
      }
    },
    timestamp: Date.now()
  };
  
  res.json(response);
}

/**
 * 统一响应格式中间件
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件
 */
function formatResponse(req, res, next) {
  // 保存原始的json方法
  const originalJson = res.json;
  
  // 重写json方法，添加统一格式
  res.json = function(data) {
    // 如果数据已经是统一格式，则直接返回
    if (data && typeof data === 'object' && 'code' in data && 'message' in data) {
      return originalJson.call(this, data);
    }
    
    // 否则，包装成统一格式
    const formattedData = {
      success: true,
      message: '操作成功',
      data: data || null,
      timestamp: Date.now()
    };
    
    return originalJson.call(this, formattedData);
  };
  
  next();
}

module.exports = {
  success,
  error,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  serverError,
  formatResponse
};