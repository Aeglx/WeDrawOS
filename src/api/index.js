/**
 * WeDrawOS 客服系统 API 入口文件
 * 负责启动和初始化整个应用，包括客服系统功能
 */

// 加载环境变量
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}

// 尝试从特定环境文件加载配置
require('dotenv').config({
  path: `.env.${process.env.NODE_ENV}`
});

// 再次加载默认环境变量（确保所有配置都被加载）
require('dotenv').config();

// 导入主应用启动模块
const { initialize } = require('./app');
const logger = require('./core/utils/logger') || console;

/**
 * 主函数
 * 启动应用程序，包括客服系统API
 */
async function main() {
  try {
    console.log('========================================');
    console.log('WeDrawOS 应用启动中...');
    console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
    console.log(`端口: ${process.env.PORT || 3000}`);
    console.log('========================================');
    
    // 启动应用（包括客服系统）
    await initialize();
    
    console.log('WeDrawOS 应用启动完成，客服系统API已集成');
  } catch (error) {
    logger.error('应用程序启动失败:', { error });
    
    // 记录详细的错误信息
    if (error.stack) {
      logger.error('错误堆栈:', error.stack);
    }
    
    // 设置超时，确保日志能够完整写入
    setTimeout(() => {
      process.exit(1);
    }, 100);
  }
}

// 启动应用程序
main();

// 处理SIGUSR2信号（用于Node.js调试重启）
process.on('SIGUSR2', () => {
  logger.info('收到SIGUSR2信号，准备重启...');
  // 在实际应用中，可以在这里添加一些清理逻辑
  process.exit(0);
});

// 处理退出事件
process.on('exit', (code) => {
  logger.info(`进程退出，退出码: ${code}`);
});

// 确保未捕获的异常能够被记录
process.on('uncaughtException', (error) => {
  console.error('严重错误: 未捕获的异常', error);
  console.error('错误堆栈:', error.stack);
  process.exit(1);
});

// 确保未处理的Promise拒绝能够被记录
process.on('unhandledRejection', (reason, promise) => {
  console.error('严重错误: 未处理的Promise拒绝', { reason, promise });
});