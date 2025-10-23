import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { authorizeRole } from '../middleware/authorize';
import customerServiceRoutes from './customerServiceRoutes';

/**
 * 客服系统路由模块
 * 整合所有客服相关的路由配置
 */
const router = express.Router();

// 应用认证中间件
router.use(authenticateToken);

// 客服系统核心路由
router.use('/customer-service', customerServiceRoutes);

// 管理员专用路由 - 仅管理员可访问
router.use('/admin/customer-service', 
  authorizeRole(['admin', 'customer_service_manager']),
  customerServiceRoutes
);

// 公开路由 - 不需要特殊权限的接口
router.use('/public/customer-service', (req, res, next) => {
  // 标记为公开路由
  req.isPublicRoute = true;
  next();
}, customerServiceRoutes);

/**
 * 健康检查路由
 * 用于监控客服系统是否正常运行
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'customer-service',
    timestamp: new Date().toISOString()
  });
});

/**
 * API版本信息
 */
router.get('/version', (req, res) => {
  res.status(200).json({
    version: '1.0.0',
    service: 'customer-service-system',
    features: [
      '实时聊天',
      '会话管理',
      '自动回复',
      '统计分析',
      '客服分配'
    ]
  });
});

// 错误处理中间件
router.use((err, req, res, next) => {
  console.error('客服系统路由错误:', err);
  
  // 处理特定类型的错误
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: '未授权访问',
      message: '请先登录'  
    });
  }
  
  if (err.name === 'ForbiddenError') {
    return res.status(403).json({
      error: '权限不足',
      message: '您没有权限执行此操作'
    });
  }
  
  // 处理验证错误
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: '验证失败',
      message: err.message,
      details: err.details
    });
  }
  
  // 默认错误处理
  res.status(err.status || 500).json({
    error: '服务器错误',
    message: err.message || '客服系统处理请求时发生错误',
    timestamp: new Date().toISOString()
  });
});

export default router;