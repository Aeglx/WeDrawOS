/**
 * 认证中间件模块
 * 统一导出认证相关的中间件函数
 */

// 导入JWT认证中间件
const jwtAuth = require('./auth/jwtAuth');

// 重新导出所有jwtAuth中的函数和方法
module.exports = {
  ...jwtAuth,
  // 如果需要，可以在这里添加其他认证中间件
  verifyToken: jwtAuth.verifyToken,
  verifyUser: jwtAuth.verifyUser,
  verifyAdmin: jwtAuth.verifyAdmin,
  // 添加authenticate属性以兼容现有代码
  authenticate: jwtAuth.auth
};