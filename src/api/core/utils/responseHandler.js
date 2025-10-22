/**
 * 响应处理器
 * 提供标准化的HTTP响应格式化功能
 */

/**
 * 成功响应
 * @param {Object} res - Express响应对象
 * @param {*} data - 要返回的数据
 * @param {string} message - 响应消息
 * @param {number} statusCode - HTTP状态码
 */
function success(res, data = null, message = '操作成功', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    error: null
  });
}

/**
 * 错误响应
 * @param {Object} res - Express响应对象
 * @param {Error|string} error - 错误对象或错误消息
 * @param {number} statusCode - HTTP状态码
 * @param {*} data - 可选的附加数据
 */
function error(res, error = '操作失败', statusCode = 500, data = null) {
  const errorMessage = error instanceof Error ? error.message : error;
  
  return res.status(statusCode).json({
    success: false,
    message: errorMessage,
    data,
    error: error instanceof Error ? {
      message: error.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
    } : errorMessage
  });
}

/**
 * 分页响应
 * @param {Object} res - Express响应对象
 * @param {Array} items - 分页数据项
 * @param {number} page - 当前页码
 * @param {number} pageSize - 每页大小
 * @param {number} totalItems - 总数据量
 * @param {string} message - 响应消息
 */
function paginate(res, items = [], page = 1, pageSize = 10, totalItems = 0, message = '查询成功') {
  const totalPages = Math.ceil(totalItems / pageSize);
  
  return success(res, {
    items,
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  }, message);
}

/**
 * 验证错误响应
 * @param {Object} res - Express响应对象
 * @param {Object} validationErrors - 验证错误对象
 */
function validationError(res, validationErrors) {
  return error(res, '数据验证失败', 400, {
    validationErrors: Object.keys(validationErrors).map(field => ({
      field,
      message: validationErrors[field]
    }))
  });
}

/**
 * 未授权响应
 * @param {Object} res - Express响应对象
 * @param {string} message - 响应消息
 */
function unauthorized(res, message = '未授权访问') {
  return error(res, message, 401);
}

/**
 * 禁止访问响应
 * @param {Object} res - Express响应对象
 * @param {string} message - 响应消息
 */
function forbidden(res, message = '禁止访问') {
  return error(res, message, 403);
}

/**
 * 资源不存在响应
 * @param {Object} res - Express响应对象
 * @param {string} message - 响应消息
 */
function notFound(res, message = '资源不存在') {
  return error(res, message, 404);
}

module.exports = {
  success,
  error,
  paginate,
  validationError,
  unauthorized,
  forbidden,
  notFound
};