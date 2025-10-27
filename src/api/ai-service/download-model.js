const fs = require('fs');
const path = require('path');
const https = require('https');
const os = require('os');

// 模型配置
const MODEL_CONFIG = {
  name: 'tinyllama-1.1b-chat-v1.0',
  quantizedVersion: 'Q4_K_M',
  fullFilename: 'tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf',
  downloadUrl: 'https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf',
  expectedSize: 668 * 1024 * 1024, // 约668MB
  modelsDir: path.join(__dirname, 'models')
};

// 下载进度条函数
function showProgress(current, total, speed) {
  const percent = Math.floor((current / total) * 100);
  const barLength = 30;
  const filledLength = Math.floor((percent / 100) * barLength);
  const bar = '█'.repeat(filledLength) + '-'.repeat(barLength - filledLength);
  
  process.stdout.write(`\r下载进度: [${bar}] ${percent}% | ${formatBytes(current)} / ${formatBytes(total)} | ${formatSpeed(speed)}  `);
}

// 格式化字节数
function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
  return (bytes / 1073741824).toFixed(1) + ' GB';
}

// 格式化下载速度
function formatSpeed(bytesPerSec) {
  if (bytesPerSec < 1024) return bytesPerSec + ' B/s';
  if (bytesPerSec < 1048576) return (bytesPerSec / 1024).toFixed(1) + ' KB/s';
  return (bytesPerSec / 1048576).toFixed(1) + ' MB/s';
}

// 检查模型是否已存在
function checkModelExists() {
  const modelPath = path.join(MODEL_CONFIG.modelsDir, MODEL_CONFIG.fullFilename);
  return fs.existsSync(modelPath);
}

// 检查模型文件大小
function checkModelSize() {
  const modelPath = path.join(MODEL_CONFIG.modelsDir, MODEL_CONFIG.fullFilename);
  try {
    const stats = fs.statSync(modelPath);
    return {
      exists: true,
      size: stats.size,
      expectedSize: MODEL_CONFIG.expectedSize,
      isComplete: stats.size >= MODEL_CONFIG.expectedSize * 0.95 // 允许5%误差
    };
  } catch (error) {
    return { exists: false };
  }
}

// 创建模型目录
function createModelsDir() {
  if (!fs.existsSync(MODEL_CONFIG.modelsDir)) {
    console.log(`创建模型目录: ${MODEL_CONFIG.modelsDir}`);
    fs.mkdirSync(MODEL_CONFIG.modelsDir, { recursive: true });
  }
}

// 下载模型文件
async function downloadModel() {
  createModelsDir();
  
  const modelPath = path.join(MODEL_CONFIG.modelsDir, MODEL_CONFIG.fullFilename);
  const fileStream = fs.createWriteStream(modelPath);
  
  return new Promise((resolve, reject) => {
    console.log(`开始下载模型: ${MODEL_CONFIG.name}.${MODEL_CONFIG.quantizedVersion}`);
    console.log(`下载地址: ${MODEL_CONFIG.downloadUrl}`);
    console.log(`保存路径: ${modelPath}`);
    
    let startTime = Date.now();
    let downloadedBytes = 0;
    let lastProgressTime = startTime;
    
    https.get(MODEL_CONFIG.downloadUrl, (response) => {
      const totalBytes = parseInt(response.headers['content-length']) || MODEL_CONFIG.expectedSize;
      
      response.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        fileStream.write(chunk);
        
        const now = Date.now();
        if (now - lastProgressTime > 500) { // 每500ms更新一次进度
          const elapsed = (now - startTime) / 1000;
          const speed = downloadedBytes / elapsed;
          showProgress(downloadedBytes, totalBytes, speed);
          lastProgressTime = now;
        }
      });
      
      response.on('end', () => {
        fileStream.end();
        console.log('\n下载完成!');
        resolve(downloadedBytes);
      });
    }).on('error', (error) => {
      fileStream.close();
      if (fs.existsSync(modelPath)) {
        fs.unlinkSync(modelPath); // 删除不完整的文件
      }
      reject(new Error(`下载失败: ${error.message}`));
    });
  });
}

// 检查系统环境
function checkEnvironment() {
  console.log('检查系统环境...');
  
  // 检查内存
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  console.log(`系统内存: ${formatBytes(totalMemory)}`);
  console.log(`可用内存: ${formatBytes(freeMemory)}`);
  console.log(`CPU核心: ${os.cpus().length}`);
  
  // 检查磁盘空间
  try {
    const diskInfo = fs.statSync(MODEL_CONFIG.modelsDir);
    console.log(`磁盘空间状态: 可用`);
  } catch (error) {
    console.log(`磁盘空间状态: 检查失败`);
  }
}

// 主函数
async function main() {
  console.log('========================================');
  console.log('AI模型下载与管理工具');
  console.log('========================================');
  
  checkEnvironment();
  
  // 检查模型是否已存在
  if (checkModelExists()) {
    const sizeInfo = checkModelSize();
    console.log(`\n检测到现有模型文件`);
    console.log(`文件大小: ${formatBytes(sizeInfo.size)}`);
    console.log(`状态: ${sizeInfo.isComplete ? '完整' : '不完整，建议重新下载'}`);
    
    if (sizeInfo.isComplete) {
      console.log('\n✅ 模型文件已就绪，可直接使用');
      return;
    }
  }
  
  // 开始下载
  try {
    const downloadedSize = await downloadModel();
    const sizeInfo = checkModelSize();
    
    console.log('\n========================================');
    console.log(`下载结果: ${sizeInfo.isComplete ? '✅ 成功' : '❌ 可能不完整'}`);
    console.log(`最终文件大小: ${formatBytes(sizeInfo.size)}`);
    console.log(`期望文件大小: ${formatBytes(sizeInfo.expectedSize)}`);
    console.log('========================================');
    
    if (sizeInfo.isComplete) {
      console.log('\n🎉 模型已成功下载并准备就绪!');
      console.log(`📁 模型位置: ${path.join(MODEL_CONFIG.modelsDir, MODEL_CONFIG.fullFilename)}`);
      console.log(`📖 模型版本: ${MODEL_CONFIG.name}`);
      console.log(`⚙️  量化级别: ${MODEL_CONFIG.quantizedVersion}`);
      console.log('\n💡 提示: 您可以通过重启服务器来使用AI功能');
    }
  } catch (error) {
    console.error(`\n❌ 错误: ${error.message}`);
    console.log('\n请检查您的网络连接或尝试手动下载模型文件。');
    console.log(`手动下载地址: ${MODEL_CONFIG.downloadUrl}`);
    console.log(`下载后请将文件保存至: ${MODEL_CONFIG.modelsDir}`);
  }
}

// 运行主函数
if (require.main === module) {
  main();
} else {
  module.exports = { downloadModel, checkModelExists, checkModelSize };
}