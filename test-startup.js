console.log('测试脚本开始执行');
console.log('Node.js版本:', process.version);

// 测试基本模块导入
try {
  const dotenv = require('dotenv');
  console.log('dotenv模块导入成功');
  
  // 测试环境变量加载
  dotenv.config();
  console.log('环境变量加载完成');
  console.log('PORT配置:', process.env.PORT);
} catch (error) {
  console.error('模块导入或环境变量加载失败:', error);
}

console.log('测试脚本执行结束');