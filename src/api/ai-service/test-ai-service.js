const axios = require('axios');
const path = require('path');

// 测试脚本 - 用于验证AI服务功能
async function testAIService() {
  console.log('========================================');
  console.log('开始测试AI服务...');
  console.log('========================================');

  // 定义测试用例
  const testCases = [
    {
      name: '简单对话测试',
      prompt: '你好，请简单介绍一下你自己',
      description: '验证基本对话功能'
    },
    {
      name: '创意写作测试',
      prompt: '写一首简短的诗，关于春天',
      description: '验证创意生成能力'
    },
    {
      name: '健康检查测试',
      endpoint: '/health',
      method: 'get',
      description: '验证服务健康状态'
    }
  ];

  // API基础URL
  const baseUrl = 'http://localhost:3000/api/ai';

  try {
    // 遍历测试用例
    for (const testCase of testCases) {
      console.log(`\n🔍 测试: ${testCase.name}`);
      console.log(`📝 描述: ${testCase.description}`);
      console.log('----------------------------------------');

      try {
        let response;
        
        if (testCase.endpoint === '/health' && testCase.method === 'get') {
          // 健康检查测试
          response = await axios.get(`${baseUrl}${testCase.endpoint}`);
        } else {
          // 对话测试
          console.log(`📤 发送请求: ${testCase.prompt.substring(0, 50)}${testCase.prompt.length > 50 ? '...' : ''}`);
          response = await axios.post(`${baseUrl}/chat`, {
            prompt: testCase.prompt,
            options: {
              max_tokens: 128,
              temperature: 0.7
            }
          });
        }

        // 显示响应
        if (response.data.success) {
          console.log('✅ 测试成功!');
          
          if (testCase.endpoint === '/health') {
            // 显示健康状态
            console.log('🩺 健康状态:', JSON.stringify(response.data.data, null, 2));
          } else {
            // 显示AI回复
            console.log('💬 AI回复:', response.data.data.response);
            console.log(`📊 Token统计: 输入约${response.data.data.tokens.prompt} tokens, 输出约${response.data.data.tokens.completion} tokens`);
          }
        } else {
          console.error('❌ 测试失败:', response.data.message);
        }
      } catch (error) {
        console.error('❌ 测试执行失败:', error.response ? error.response.data : error.message);
      }
    }

    console.log('\n========================================');
    console.log('AI服务测试完成');
    console.log('========================================');
    console.log('提示: 如需使用AI服务，确保TinyLlama模型文件已下载到指定路径');
    console.log('模型下载地址: https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF');
    console.log('推荐下载: tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf (约1GB)');
    console.log('放置路径: ./src/api/ai-service/models/');
    console.log('========================================');
  } catch (error) {
    console.error('\n❌ 测试框架发生错误:', error);
    console.log('\n请确保服务器正在运行（npm start）并且AI服务已正确集成');
  }
}

// 运行测试
if (require.main === module) {
  // 检查是否已安装axios
  try {
    require('axios');
    testAIService();
  } catch (error) {
    console.log('需要先安装axios依赖: npm install axios');
    console.log('然后再运行: node test-ai-service.js');
  }
} else {
  // 作为模块导出
  module.exports = { testAIService };
}