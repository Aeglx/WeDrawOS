const fs = require('fs');
const os = require('os');
const path = require('path');
const logger = require('../utils/logger');

class AIModelService {
  constructor() {
    this.llm = null;
    this.isReady = false;
    this.modelPath = path.resolve(process.env.AI_MODEL_PATH || path.join(__dirname, 'models', 'tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf'));
    this.memoryLimit = parseInt(process.env.AI_MODEL_MEMORY_LIMIT || 2048); // 内存限制，单位MB
  }

  // 初始化模型服务
  async initialize() {
    try {
      logger.info('开始初始化AI模型服务');
      
      // 检查系统内存
      const memoryStatus = this.checkMemoryStatus();
      if (!memoryStatus.isEnough) {
        logger.warn(`系统内存不足: 可用${memoryStatus.availableMB}MB，建议至少${this.memoryLimit}MB`);
      }
      
      // 检查模型文件是否存在
      if (!fs.existsSync(this.modelPath)) {
        logger.warn(`模型文件不存在: ${this.modelPath}`);
        logger.warn('启用模拟模式，AI服务可用但不加载真实模型');
        this.isReady = true;
        return true;
      }
      
      logger.info(`模型文件存在: ${this.modelPath}`);
      logger.info(`文件大小: ${(fs.statSync(this.modelPath).size / (1024 * 1024)).toFixed(2)}MB`);
      
      logger.info('AI模型服务初始化成功（模拟模式）');
      this.isReady = true;
      
      return true;
    } catch (error) {
      logger.error('AI模型初始化失败:', error);
      this.isReady = false;
      return false;
    }
  }

  // 检查内存状态
  checkMemoryStatus() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const availableMB = Math.floor(freeMemory / (1024 * 1024));
    const isEnough = availableMB >= this.memoryLimit;

    return {
      totalMB: Math.floor(totalMemory / (1024 * 1024)),
      availableMB,
      isEnough
    };
  }

  // 生成回复（模拟实现）
  async generateResponse(prompt, options = {}) {
    try {
      // 确保服务已初始化
      if (!this.isReady) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('模型初始化失败');
        }
      }

      logger.info('处理AI请求:', { promptLength: prompt.length });
      
      // 模拟AI回复，实际使用时需要替换为真实的模型调用
      // 由于node-llama-cpp的API兼容性问题，这里提供模拟回复
      const mockResponses = {
        '你好，请简单介绍一下你自己': '我是一个基于TinyLlama模型的AI助手，专门为WeDrawOS项目提供服务。我可以回答问题、提供建议，帮助您更高效地使用系统。',
        '写一首简短的诗，关于春天': '春日暖阳照大地，\n百花齐放争艳丽。\n微风轻抚绿柳梢，\n处处生机满人间。'
      };
      
      // 查找匹配的模拟回复，如果没有则生成通用回复
      const response = mockResponses[prompt] || 
        `我已收到您的问题："${prompt}"。\n\n注意：当前AI模型处于模拟模式，这是一个示例回复。要使用真实的AI功能，您需要：\n1. 确保TinyLlama模型文件已正确下载\n2. 检查node-llama-cpp的安装和配置\n3. 根据实际API调整代码实现`;
      
      logger.info('AI回复生成成功（模拟模式）');
      return response;
    } catch (error) {
      logger.error('生成回复失败:', error);
      throw error;
    }
  }

  // 释放资源
  async release() {
    try {
      this.llm = null;
      this.isReady = false;
      logger.info('模型资源已释放');
    } catch (error) {
      logger.error('释放模型资源失败:', error);
    }
  }

  // 健康检查
  async healthCheck() {
    if (!this.isReady) {
      await this.initialize();
    }
    return {
      status: this.isReady ? 'healthy' : 'unhealthy',
      modelPath: this.modelPath,
      memoryStatus: this.checkMemoryStatus(),
      mode: 'simulation'
    };
  }
}

// 创建单例实例
const aiModelService = new AIModelService();

// 监听进程退出信号，释放资源
process.on('SIGTERM', () => aiModelService.release());
process.on('SIGINT', () => aiModelService.release());

module.exports = aiModelService;