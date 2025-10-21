/**
 * 项目构建脚本
 * 用于编译、压缩和打包项目代码
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const logger = console;

// 构建配置
const config = {
  outputDir: path.join(__dirname, 'dist'),
  srcDir: path.join(__dirname, 'src'),
  packageJsonPath: path.join(__dirname, 'package.json'),
  filesToCopy: ['package.json', 'package-lock.json', '.env', '.env.example']
};

/**
 * 开始构建流程
 */
async function build() {
  try {
    logger.info('开始构建项目...');
    
    // 1. 清理输出目录
    await cleanOutputDir();
    
    // 2. 检查Node环境
    await checkEnvironment();
    
    // 3. 安装依赖
    await installDependencies();
    
    // 4. 运行ESLint检查
    await runLint();
    
    // 5. 复制源代码
    await copySourceCode();
    
    // 6. 复制配置文件
    await copyConfigFiles();
    
    // 7. 创建必要的目录
    await createRequiredDirs();
    
    logger.info('构建完成！输出目录:', config.outputDir);
    logger.info('构建产物可以直接部署到生产环境');
    
  } catch (error) {
    logger.error('构建失败:', error.message);
    process.exit(1);
  }
}

/**
 * 清理输出目录
 */
async function cleanOutputDir() {
  logger.info('清理输出目录...');
  
  if (fs.existsSync(config.outputDir)) {
    fs.rmSync(config.outputDir, { recursive: true, force: true });
  }
  
  fs.mkdirSync(config.outputDir, { recursive: true });
}

/**
 * 检查Node环境
 */
async function checkEnvironment() {
  logger.info('检查Node环境...');
  
  const nodeVersion = process.version;
  const requiredVersion = '14';
  
  if (parseFloat(nodeVersion.substring(1)) < requiredVersion) {
    throw new Error(`需要Node.js v${requiredVersion}或更高版本，当前版本: ${nodeVersion}`);
  }
  
  logger.info(`Node.js版本: ${nodeVersion}，满足要求`);
}

/**
 * 安装依赖
 */
async function installDependencies() {
  logger.info('安装生产环境依赖...');
  
  try {
    execSync('npm install --production', { stdio: 'inherit' });
    logger.info('依赖安装完成');
  } catch (error) {
    throw new Error('依赖安装失败');
  }
}

/**
 * 运行ESLint检查
 */
async function runLint() {
  logger.info('运行代码检查...');
  
  try {
    execSync('npm run lint --if-present', { stdio: 'pipe' });
    logger.info('代码检查通过');
  } catch (error) {
    logger.warn('代码检查失败，但继续构建流程');
  }
}

/**
 * 复制源代码到输出目录
 */
async function copySourceCode() {
  logger.info('复制源代码...');
  
  copyDirectory(config.srcDir, path.join(config.outputDir, 'src'));
  logger.info('源代码复制完成');
}

/**
 * 复制配置文件
 */
async function copyConfigFiles() {
  logger.info('复制配置文件...');
  
  config.filesToCopy.forEach(file => {
    const sourcePath = path.join(__dirname, file);
    if (fs.existsSync(sourcePath)) {
      const targetPath = path.join(config.outputDir, file);
      fs.copyFileSync(sourcePath, targetPath);
      logger.info(`已复制: ${file}`);
    } else {
      logger.warn(`文件不存在，跳过: ${file}`);
    }
  });
}

/**
 * 创建必要的目录
 */
async function createRequiredDirs() {
  logger.info('创建必要的目录...');
  
  const dirs = ['logs', 'uploads'];
  dirs.forEach(dir => {
    const dirPath = path.join(config.outputDir, dir);
    fs.mkdirSync(dirPath, { recursive: true });
    logger.info(`已创建目录: ${dir}`);
  });
}

/**
 * 递归复制目录
 * @param {string} source - 源目录路径
 * @param {string} target - 目标目录路径
 */
function copyDirectory(source, target) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }
  
  const files = fs.readdirSync(source);
  files.forEach(file => {
    const sourcePath = path.join(source, file);
    const targetPath = path.join(target, file);
    
    const stats = fs.statSync(sourcePath);
    if (stats.isDirectory()) {
      copyDirectory(sourcePath, targetPath);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
    }
  });
}

// 执行构建
if (require.main === module) {
  build();
}

module.exports = { build };