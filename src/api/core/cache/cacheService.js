/**
 * 缓存服务模块
 * 统一导出缓存相关的服务函数
 */

// 导入缓存管理器
const cacheManager = require('./cacheManager');

// 重新导出所有cacheManager中的函数和方法
module.exports = {
  ...cacheManager,
  // 明确导出常用的缓存操作方法
  initialize: cacheManager.initialize,
  set: cacheManager.set,
  get: cacheManager.get,
  delete: cacheManager.delete,
  clear: cacheManager.clear
};