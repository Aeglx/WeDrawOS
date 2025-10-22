console.log('开始测试应用模块导入...');

// 分步测试导入关键模块
try {
  console.log('1. 尝试导入app.js...');
  const appModule = require('./src/api/app');
  console.log('app.js导入成功，导出内容:', Object.keys(appModule));
} catch (error) {
  console.error('导入app.js失败:', error);
  console.error('错误堆栈:', error.stack);
}

console.log('测试完成');