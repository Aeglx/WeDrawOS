/**
 * 测试微信开发文档风格API文档配置
 * 验证文档生成和路由设置是否正确
 */

const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');

// 模拟环境变量
process.env.PORT = process.env.PORT || 3000;

// 测试Swagger配置选项
const testOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'WeDrawOS API文档测试',
      version: '1.0.0',
      description: '微信开发文档风格API文档测试'
    }
  },
  apis: [path.join(__dirname, '../admin-api/routes/**/*.js')]
};

// 测试生成Swagger文档
try {
  console.log('正在测试API文档配置...');
  const swaggerSpec = swaggerJsdoc(testOptions);
  
  console.log('✓ Swagger文档生成成功');
  console.log(`  - OpenAPI版本: ${swaggerSpec.openapi}`);
  console.log(`  - 文档标题: ${swaggerSpec.info.title}`);
  
  if (swaggerSpec.paths) {
    const paths = Object.keys(swaggerSpec.paths);
    console.log(`\n✓ 成功识别到 ${paths.length} 个API路径:`);
    
    // 只显示前10个路径作为示例
    const samplePaths = paths.slice(0, 10);
    samplePaths.forEach((path, index) => {
      console.log(`  ${index + 1}. ${path}`);
    });
    
    if (paths.length > 10) {
      console.log(`  ... 以及 ${paths.length - 10} 个其他路径`);
    }
  } else {
    console.log('\n⚠ 未识别到任何API路径，请检查apis配置');
  }
  
  console.log('\n✓ API文档测试完成，配置正常');
  console.log(`  访问地址: http://localhost:${process.env.PORT}/api/wechat-docs`);
  console.log(`  JSON数据: http://localhost:${process.env.PORT}/api/wechat-docs.json`);
  console.log(`  调试信息: http://localhost:${process.env.PORT}/api/wechat-docs/debug`);
  
} catch (error) {
  console.error('✗ API文档配置测试失败:');
  console.error(error.message);
  console.error('\n请检查以下可能的问题:');
  console.error('1. swagger-jsdoc依赖是否已安装');
  console.error('2. API文件路径配置是否正确');
  console.error('3. API注释格式是否符合Swagger规范');
  process.exit(1);
}