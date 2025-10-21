/**
 * 业务异常类型定义
 * 提供各种业务场景下的具体异常类型
 */

const { AppError } = require('../handlers/errorHandler');
const { HttpStatus } = require('../../utils/http/ResponseFormatter');

/**
 * 用户相关异常
 */

/**
 * 用户未找到异常
 */
class UserNotFoundException extends AppError {
  constructor(userId, options = {}) {
    super(`用户不存在: ${userId || '未知用户ID'}`, {
      status: HttpStatus.NOT_FOUND,
      code: 'USER_NOT_FOUND',
      ...options
    });
    this.name = 'UserNotFoundException';
    this.userId = userId;
  }
}

/**
 * 用户已存在异常
 */
class UserExistsException extends AppError {
  constructor(identifier, options = {}) {
    super(`用户已存在: ${identifier}`, {
      status: HttpStatus.CONFLICT,
      code: 'USER_ALREADY_EXISTS',
      ...options
    });
    this.name = 'UserExistsException';
    this.identifier = identifier;
  }
}

/**
 * 用户权限不足异常
 */
class InsufficientPermissionException extends AppError {
  constructor(action = '执行此操作', options = {}) {
    super(`权限不足，无法${action}`, {
      status: HttpStatus.FORBIDDEN,
      code: 'INSUFFICIENT_PERMISSION',
      ...options
    });
    this.name = 'InsufficientPermissionException';
    this.action = action;
  }
}

/**
 * 认证相关异常
 */

/**
 * 登录失败异常
 */
class AuthenticationFailedException extends AppError {
  constructor(reason = '用户名或密码错误', options = {}) {
    super(`认证失败: ${reason}`, {
      status: HttpStatus.UNAUTHORIZED,
      code: 'AUTHENTICATION_FAILED',
      ...options
    });
    this.name = 'AuthenticationFailedException';
    this.reason = reason;
  }
}

/**
 * 令牌无效异常
 */
class InvalidTokenException extends AppError {
  constructor(reason = '无效的认证令牌', options = {}) {
    super(reason, {
      status: HttpStatus.UNAUTHORIZED,
      code: 'INVALID_TOKEN',
      ...options
    });
    this.name = 'InvalidTokenException';
  }
}

/**
 * 令牌过期异常
 */
class TokenExpiredException extends AppError {
  constructor(options = {}) {
    super('认证令牌已过期，请重新登录', {
      status: HttpStatus.UNAUTHORIZED,
      code: 'TOKEN_EXPIRED',
      ...options
    });
    this.name = 'TokenExpiredException';
  }
}

/**
 * 资源相关异常
 */

/**
 * 资源未找到异常
 */
class ResourceNotFoundException extends AppError {
  constructor(resourceType, resourceId, options = {}) {
    super(`${resourceType}不存在: ${resourceId || '未知ID'}`, {
      status: HttpStatus.NOT_FOUND,
      code: 'RESOURCE_NOT_FOUND',
      ...options
    });
    this.name = 'ResourceNotFoundException';
    this.resourceType = resourceType;
    this.resourceId = resourceId;
  }
}

/**
 * 资源冲突异常
 */
class ResourceConflictException extends AppError {
  constructor(resourceType, reason = '资源冲突', options = {}) {
    super(`${resourceType}${reason}`, {
      status: HttpStatus.CONFLICT,
      code: 'RESOURCE_CONFLICT',
      ...options
    });
    this.name = 'ResourceConflictException';
    this.resourceType = resourceType;
  }
}

/**
 * 资源访问被拒绝异常
 */
class ResourceAccessDeniedException extends AppError {
  constructor(resourceType, resourceId, options = {}) {
    super(`无权访问${resourceType}: ${resourceId || '未知ID'}`, {
      status: HttpStatus.FORBIDDEN,
      code: 'RESOURCE_ACCESS_DENIED',
      ...options
    });
    this.name = 'ResourceAccessDeniedException';
    this.resourceType = resourceType;
    this.resourceId = resourceId;
  }
}

/**
 * 操作相关异常
 */

/**
 * 操作失败异常
 */
class OperationFailedException extends AppError {
  constructor(operation, reason = '未知原因', options = {}) {
    super(`${operation}失败: ${reason}`, {
      status: HttpStatus.BAD_REQUEST,
      code: 'OPERATION_FAILED',
      ...options
    });
    this.name = 'OperationFailedException';
    this.operation = operation;
    this.reason = reason;
  }
}

/**
 * 操作超时异常
 */
class OperationTimeoutException extends AppError {
  constructor(operation, timeout, options = {}) {
    super(`${operation}超时，超过${timeout}毫秒`, {
      status: HttpStatus.REQUEST_TIMEOUT,
      code: 'OPERATION_TIMEOUT',
      ...options
    });
    this.name = 'OperationTimeoutException';
    this.operation = operation;
    this.timeout = timeout;
  }
}

/**
 * 验证相关异常
 */

/**
 * 参数验证异常
 */
class ParameterValidationException extends AppError {
  constructor(parameter, reason, options = {}) {
    super(`参数验证失败: ${parameter} ${reason}`, {
      status: HttpStatus.BAD_REQUEST,
      code: 'PARAMETER_VALIDATION_FAILED',
      ...options
    });
    this.name = 'ParameterValidationException';
    this.parameter = parameter;
    this.reason = reason;
  }
}

/**
 * 数据验证异常
 */
class DataValidationException extends AppError {
  constructor(field, reason, validationErrors = [], options = {}) {
    super(`数据验证失败: ${field} ${reason}`, {
      status: HttpStatus.UNPROCESSABLE_ENTITY,
      code: 'DATA_VALIDATION_FAILED',
      validationErrors,
      ...options
    });
    this.name = 'DataValidationException';
    this.field = field;
    this.reason = reason;
  }
}

/**
 * 业务规则异常
 */
class BusinessRuleException extends AppError {
  constructor(rule, message, options = {}) {
    super(message, {
      status: HttpStatus.BAD_REQUEST,
      code: 'BUSINESS_RULE_VIOLATION',
      ...options
    });
    this.name = 'BusinessRuleException';
    this.rule = rule;
  }
}

/**
 * 业务状态异常
 */
class BusinessStateException extends AppError {
  constructor(entity, currentState, expectedState, options = {}) {
    super(`${entity}当前状态为${currentState}，无法执行操作，请确保状态为${expectedState}`, {
      status: HttpStatus.BAD_REQUEST,
      code: 'INVALID_BUSINESS_STATE',
      ...options
    });
    this.name = 'BusinessStateException';
    this.entity = entity;
    this.currentState = currentState;
    this.expectedState = expectedState;
  }
}

/**
 * 系统相关异常
 */

/**
 * 配置错误异常
 */
class ConfigurationException extends AppError {
  constructor(configKey, reason, options = {}) {
    super(`配置错误: ${configKey} ${reason}`, {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'CONFIGURATION_ERROR',
      ...options
    });
    this.name = 'ConfigurationException';
    this.configKey = configKey;
    this.reason = reason;
  }
}

/**
 * 服务不可用异常
 */
class ServiceUnavailableException extends AppError {
  constructor(serviceName, reason = '暂时不可用', options = {}) {
    super(`${serviceName}${reason}`, {
      status: HttpStatus.SERVICE_UNAVAILABLE,
      code: 'SERVICE_UNAVAILABLE',
      ...options
    });
    this.name = 'ServiceUnavailableException';
    this.serviceName = serviceName;
  }
}

/**
 * 外部服务调用异常
 */
class ExternalServiceException extends AppError {
  constructor(serviceName, errorCode, message, options = {}) {
    super(`${serviceName}调用失败${message ? ': ' + message : ''}`, {
      status: HttpStatus.BAD_GATEWAY,
      code: 'EXTERNAL_SERVICE_ERROR',
      errorCode,
      ...options
    });
    this.name = 'ExternalServiceException';
    this.serviceName = serviceName;
    this.errorCode = errorCode;
  }
}

/**
 * 数据库相关异常
 */

/**
 * 数据操作异常
 */
class DataOperationException extends AppError {
  constructor(operation, reason = '未知错误', options = {}) {
    super(`数据操作失败: ${operation} ${reason}`, {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'DATA_OPERATION_ERROR',
      ...options
    });
    this.name = 'DataOperationException';
    this.operation = operation;
    this.reason = reason;
  }
}

/**
 * 数据约束违反异常
 */
class DataConstraintViolationException extends AppError {
  constructor(constraint, details, options = {}) {
    super(`数据约束违反: ${constraint}`, {
      status: HttpStatus.CONFLICT,
      code: 'DATA_CONSTRAINT_VIOLATION',
      details,
      ...options
    });
    this.name = 'DataConstraintViolationException';
    this.constraint = constraint;
  }
}

/**
 * 事务失败异常
 */
class TransactionFailedException extends AppError {
  constructor(operation, reason = '未知错误', options = {}) {
    super(`事务处理失败: ${operation} ${reason}`, {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'TRANSACTION_FAILED',
      ...options
    });
    this.name = 'TransactionFailedException';
    this.operation = operation;
    this.reason = reason;
  }
}

/**
 * 导出所有业务异常类型
 */
module.exports = {
  // 用户相关异常
  UserNotFoundException,
  UserExistsException,
  InsufficientPermissionException,
  
  // 认证相关异常
  AuthenticationFailedException,
  InvalidTokenException,
  TokenExpiredException,
  
  // 资源相关异常
  ResourceNotFoundException,
  ResourceConflictException,
  ResourceAccessDeniedException,
  
  // 操作相关异常
  OperationFailedException,
  OperationTimeoutException,
  
  // 验证相关异常
  ParameterValidationException,
  DataValidationException,
  BusinessRuleException,
  BusinessStateException,
  
  // 系统相关异常
  ConfigurationException,
  ServiceUnavailableException,
  ExternalServiceException,
  
  // 数据库相关异常
  DataOperationException,
  DataConstraintViolationException,
  TransactionFailedException
};