/**
 * 响应格式化中间件
 * 提供统一的API响应格式和错误处理机制
 */

/**
 * 统一成功响应格式化
 * @param {*} res - Express响应对象
 * @param {*} data - 响应数据
 * @param {*} message - 响应消息
 * @param {*} statusCode - HTTP状态码
 */
const sendSuccessResponse = (res, data = null, message = '操作成功', statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
    error: null,
    timestamp: new Date().toISOString()
  });
};

/**
 * 统一错误响应格式化
 * @param {*} res - Express响应对象
 * @param {*} error - 错误对象或消息
 * @param {*} statusCode - HTTP状态码
 * @param {*} data - 可选的响应数据
 */
const sendErrorResponse = (res, error = '操作失败', statusCode = 500, data = null) => {
  // 处理不同类型的错误输入
  const errorMessage = error instanceof Error ? error.message : error;
  const errorDetails = error instanceof Error && process.env.NODE_ENV !== 'production' 
    ? { stack: error.stack } 
    : null;
  
  res.status(statusCode).json({
    success: false,
    message: errorMessage,
    data,
    error: errorDetails,
    timestamp: new Date().toISOString()
  });
};

/**
 * 验证错误响应格式化
 * @param {*} res - Express响应对象
 * @param {*} validationErrors - express-validator验证错误数组
 */
const sendValidationErrorResponse = (res, validationErrors) => {
  // 将验证错误数组转换为错误消息对象
  const errorDetails = {};
  validationErrors.forEach(error => {
    errorDetails[error.param] = error.msg;
  });
  
  res.status(400).json({
    success: false,
    message: '请求参数验证失败',
    data: null,
    error: {
      details: errorDetails,
      summary: '请检查请求参数格式'
    },
    timestamp: new Date().toISOString()
  });
};

/**
 * 分页响应格式化
 * @param {*} res - Express响应对象
 * @param {*} items - 分页数据项数组
 * @param {*} total - 总记录数
 * @param {*} page - 当前页码
 * @param {*} limit - 每页记录数
 * @param {*} message - 响应消息
 */
const sendPaginatedResponse = (res, items, total, page = 1, limit = 20, message = '查询成功') => {
  // 计算总页数
  const totalPages = Math.ceil(total / limit);
  
  // 计算下一页和上一页
  const nextPage = page < totalPages ? page + 1 : null;
  const prevPage = page > 1 ? page - 1 : null;
  
  res.status(200).json({
    success: true,
    message,
    data: {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        nextPage,
        prevPage
      }
    },
    error: null,
    timestamp: new Date().toISOString()
  });
};

/**
 * JWT认证错误响应
 */
const sendUnauthorizedResponse = (res, message = '认证失败，请重新登录') => {
  res.status(401).json({
    success: false,
    message,
    data: null,
    error: {
      code: 'UNAUTHORIZED',
      summary: '需要有效的认证令牌'
    },
    timestamp: new Date().toISOString()
  });
};

/**
 * 权限不足错误响应
 */
const sendForbiddenResponse = (res, message = '权限不足，无法执行此操作') => {
  res.status(403).json({
    success: false,
    message,
    data: null,
    error: {
      code: 'FORBIDDEN',
      summary: '当前用户没有执行此操作的权限'
    },
    timestamp: new Date().toISOString()
  });
};

/**
 * 资源不存在错误响应
 */
const sendNotFoundResponse = (res, message = '请求的资源不存在') => {
  res.status(404).json({
    success: false,
    message,
    data: null,
    error: {
      code: 'NOT_FOUND',
      summary: '找不到请求的资源'
    },
    timestamp: new Date().toISOString()
  });
};

/**
 * 内部服务器错误响应
 */
const sendServerErrorResponse = (res, error = null) => {
  const errorMessage = error ? (error.message || '服务器内部错误') : '服务器内部错误';
  const errorDetails = process.env.NODE_ENV !== 'production' && error ? {
    stack: error.stack,
    name: error.name
  } : null;
  
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? '服务器内部错误，请稍后重试' : errorMessage,
    data: null,
    error: errorDetails || {
      code: 'SERVER_ERROR',
      summary: '服务器处理请求时发生错误'
    },
    timestamp: new Date().toISOString()
  });
};

/**
 * 业务逻辑错误响应
 */
const sendBusinessErrorResponse = (res, message, statusCode = 400, details = null) => {
  res.status(statusCode).json({
    success: false,
    message,
    data: null,
    error: {
      code: 'BUSINESS_ERROR',
      details,
      summary: message
    },
    timestamp: new Date().toISOString()
  });
};

/**
 * 批量操作响应格式化
 */
const sendBatchOperationResponse = (res, successCount, failedCount, message = '批量操作完成') => {
  res.status(200).json({
    success: true,
    message,
    data: {
      successCount,
      failedCount,
      totalCount: successCount + failedCount
    },
    error: null,
    timestamp: new Date().toISOString()
  });
};

/**
 * 中间件：验证错误处理
 * 检查请求中是否存在验证错误并返回格式化的错误响应
 */
const handleValidationErrors = (req, res, next) => {
  if (req.validationErrors && req.validationErrors.length > 0) {
    return sendValidationErrorResponse(res, req.validationErrors);
  }
  next();
};

/**
 * 中间件：错误处理
 * 捕获所有未处理的错误并返回格式化的错误响应
 */
const errorHandler = (err, req, res, next) => {
  // 日志记录错误
  console.error('API Error:', err);
  
  // 处理不同类型的错误
  if (err.name === 'ValidationError') {
    // Mongoose验证错误
    return sendValidationErrorResponse(res, Object.entries(err.errors).map(([key, value]) => ({
      param: key,
      msg: value.message
    })));
  }
  
  if (err.name === 'UnauthorizedError') {
    // JWT认证错误
    return sendUnauthorizedResponse(res, '无效的认证令牌');
  }
  
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    // Sequelize验证错误
    return sendValidationErrorResponse(res, err.errors.map(error => ({
      param: error.path,
      msg: error.message
    })));
  }
  
  if (err.statusCode) {
    // 自定义错误，带有状态码
    return sendErrorResponse(res, err.message, err.statusCode);
  }
  
  // 默认服务器错误
  return sendServerErrorResponse(res, err);
};

/**
 * 中间件：资源未找到处理
 * 处理所有未匹配的路由，返回404响应
 */
const notFoundHandler = (req, res, next) => {
  sendNotFoundResponse(res, `未找到请求的API路径: ${req.method} ${req.originalUrl}`);
};

/**
 * 生成API信息响应
 */
const sendApiInfoResponse = (res, version = '1.0.0', name = 'WeDrawOS Customer Service API') => {
  res.status(200).json({
    success: true,
    message: 'API服务正常运行',
    data: {
      name,
      version,
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      features: [
        '用户认证与管理',
        '会话管理',
        '消息发送与接收',
        '自动回复',
        '标签管理',
        '通知系统',
        '客户反馈',
        '工作时间管理',
        '工作日志'
      ]
    },
    error: null
  });
};

/**
 * 生成健康检查响应
 */
const sendHealthCheckResponse = (res, databaseStatus = 'connected', services = {}) => {
  const allServicesHealthy = Object.values(services).every(status => status === 'healthy');
  const status = databaseStatus === 'connected' && allServicesHealthy ? 'healthy' : 'unhealthy';
  
  res.status(status === 'healthy' ? 200 : 503).json({
    success: status === 'healthy',
    message: status === 'healthy' ? '所有服务运行正常' : '部分服务异常',
    data: {
      status,
      timestamp: new Date().toISOString(),
      database: databaseStatus,
      services: services || {
        api: 'healthy',
        database: databaseStatus,
        cache: 'healthy'
      }
    },
    error: status === 'unhealthy' ? {
      code: 'SERVICE_UNAVAILABLE',
      summary: '部分服务不可用'
    } : null
  });
};

/**
 * 响应头设置中间件
 */
const setupResponseHeaders = (req, res, next) => {
  // 设置内容类型
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  
  // 设置安全相关头
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // 添加API版本信息
  res.setHeader('X-API-Version', '1.0.0');
  
  next();
};

/**
 * 压缩响应中间件（简单版本，实际项目中可使用compression库）
 */
const compressResponse = (req, res, next) => {
  // 检查是否支持压缩
  const acceptsGzip = req.headers['accept-encoding'] && req.headers['accept-encoding'].includes('gzip');
  
  // 如果支持压缩，设置响应头
  if (acceptsGzip) {
    res.setHeader('Content-Encoding', 'gzip');
  }
  
  next();
};

module.exports = {
  sendSuccessResponse,
  sendErrorResponse,
  sendValidationErrorResponse,
  sendPaginatedResponse,
  sendUnauthorizedResponse,
  sendForbiddenResponse,
  sendNotFoundResponse,
  sendServerErrorResponse,
  sendBusinessErrorResponse,
  sendBatchOperationResponse,
  sendApiInfoResponse,
  sendHealthCheckResponse,
  handleValidationErrors,
  errorHandler,
  notFoundHandler,
  setupResponseHeaders,
  compressResponse
};