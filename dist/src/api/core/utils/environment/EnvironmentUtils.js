/**
 * 环境工具类
 * 提供环境变量处理、环境类型检测、平台检测等功能
 */

const os = require('os');
const path = require('path');

/**
 * 环境工具主类
 */
class EnvironmentUtils {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   */
  constructor(options = {}) {
    this.options = options;
    this.envCache = {};
    this.platformCache = null;
    this.environmentCache = null;
    this.nodeVersionCache = null;
  }

  /**
   * 获取环境变量
   * @param {string} key - 环境变量名称
   * @param {*} defaultValue - 默认值
   * @returns {*} 环境变量值或默认值
   */
  getEnv(key, defaultValue = undefined) {
    if (key in this.envCache) {
      return this.envCache[key];
    }

    const value = process.env[key];
    if (value === undefined) {
      return defaultValue;
    }

    // 尝试将字符串值转换为适当的类型
    let parsedValue = value;
    
    // 布尔值转换
    if (value.toLowerCase() === 'true') {
      parsedValue = true;
    } else if (value.toLowerCase() === 'false') {
      parsedValue = false;
    }
    // 数字转换
    else if (!isNaN(value) && value.trim() !== '') {
      parsedValue = Number(value);
    }
    // JSON转换
    else if ((value.startsWith('{') && value.endsWith('}')) || 
             (value.startsWith('[') && value.endsWith(']'))) {
      try {
        parsedValue = JSON.parse(value);
      } catch (e) {
        // 如果解析失败，保留原始字符串
      }
    }

    this.envCache[key] = parsedValue;
    return parsedValue;
  }

  /**
   * 设置环境变量
   * @param {string} key - 环境变量名称
   * @param {*} value - 环境变量值
   */
  setEnv(key, value) {
    const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    process.env[key] = stringValue;
    this.envCache[key] = value;
  }

  /**
   * 检查环境变量是否存在
   * @param {string} key - 环境变量名称
   * @returns {boolean} 是否存在
   */
  hasEnv(key) {
    return key in process.env;
  }

  /**
   * 删除环境变量
   * @param {string} key - 环境变量名称
   */
  deleteEnv(key) {
    delete process.env[key];
    delete this.envCache[key];
  }

  /**
   * 获取所有环境变量
   * @returns {Object} 所有环境变量
   */
  getAllEnv() {
    return { ...process.env };
  }

  /**
   * 获取环境类型
   * @returns {string} 环境类型 (development/production/test/staging)
   */
  getEnvironment() {
    if (this.environmentCache !== null) {
      return this.environmentCache;
    }

    const env = this.getEnv('NODE_ENV', 'development').toLowerCase();
    const validEnvs = ['development', 'production', 'test', 'staging'];
    
    this.environmentCache = validEnvs.includes(env) ? env : 'development';
    return this.environmentCache;
  }

  /**
   * 判断是否是开发环境
   * @returns {boolean} 是否是开发环境
   */
  isDevelopment() {
    return this.getEnvironment() === 'development';
  }

  /**
   * 判断是否是生产环境
   * @returns {boolean} 是否是生产环境
   */
  isProduction() {
    return this.getEnvironment() === 'production';
  }

  /**
   * 判断是否是测试环境
   * @returns {boolean} 是否是测试环境
   */
  isTest() {
    return this.getEnvironment() === 'test';
  }

  /**
   * 判断是否是预发布环境
   * @returns {boolean} 是否是预发布环境
   */
  isStaging() {
    return this.getEnvironment() === 'staging';
  }

  /**
   * 获取平台类型
   * @returns {string} 平台类型 (windows/linux/darwin/sunos)
   */
  getPlatform() {
    if (this.platformCache !== null) {
      return this.platformCache;
    }
    
    this.platformCache = os.platform();
    return this.platformCache;
  }

  /**
   * 判断是否是Windows系统
   * @returns {boolean} 是否是Windows
   */
  isWindows() {
    return this.getPlatform().includes('win');
  }

  /**
   * 判断是否是Linux系统
   * @returns {boolean} 是否是Linux
   */
  isLinux() {
    return this.getPlatform() === 'linux';
  }

  /**
   * 判断是否是MacOS系统
   * @returns {boolean} 是否是MacOS
   */
  isMacOS() {
    return this.getPlatform() === 'darwin';
  }

  /**
   * 判断是否是SunOS系统
   * @returns {boolean} 是否是SunOS
   */
  isSunOS() {
    return this.getPlatform() === 'sunos';
  }

  /**
   * 获取Node.js版本
   * @returns {string} Node.js版本号
   */
  getNodeVersion() {
    if (this.nodeVersionCache !== null) {
      return this.nodeVersionCache;
    }
    
    this.nodeVersionCache = process.version;
    return this.nodeVersionCache;
  }

  /**
   * 检查Node.js版本是否满足要求
   * @param {string} requiredVersion - 要求的版本号 (如 '14.0.0')
   * @returns {boolean} 是否满足要求
   */
  checkNodeVersion(requiredVersion) {
    const currentVersion = this.getNodeVersion().substring(1); // 移除 'v' 前缀
    return this._compareVersions(currentVersion, requiredVersion) >= 0;
  }

  /**
   * 比较版本号
   * @private
   */
  _compareVersions(version1, version2) {
    const parts1 = version1.split('.').map(Number);
    const parts2 = version2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;
      
      if (part1 > part2) return 1;
      if (part1 < part2) return -1;
    }
    
    return 0;
  }

  /**
   * 获取CPU信息
   * @returns {Object} CPU信息
   */
  getCPUInfo() {
    return os.cpus();
  }

  /**
   * 获取内存信息
   * @returns {Object} 内存信息
   */
  getMemoryInfo() {
    return {
      total: os.totalmem(),
      free: os.freemem(),
      used: os.totalmem() - os.freemem(),
      usage: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2)
    };
  }

  /**
   * 获取主机名
   * @returns {string} 主机名
   */
  getHostname() {
    return os.hostname();
  }

  /**
   * 获取IP地址列表
   * @returns {Array} IP地址数组
   */
  getIPAddresses() {
    const interfaces = os.networkInterfaces();
    const addresses = [];
    
    for (const interfaceName in interfaces) {
      const interfaceAddresses = interfaces[interfaceName];
      for (const addr of interfaceAddresses) {
        if (!addr.internal && addr.family === 'IPv4') {
          addresses.push({
            interface: interfaceName,
            address: addr.address,
            netmask: addr.netmask,
            family: addr.family
          });
        }
      }
    }
    
    return addresses;
  }

  /**
   * 获取当前工作目录
   * @returns {string} 当前工作目录
   */
  getCwd() {
    return process.cwd();
  }

  /**
   * 获取用户主目录
   * @returns {string} 用户主目录
   */
  getUserHome() {
    return os.homedir();
  }

  /**
   * 获取临时目录
   * @returns {string} 临时目录
   */
  getTempDir() {
    return os.tmpdir();
  }

  /**
   * 获取应用根目录
   * @returns {string} 应用根目录
   */
  getAppRoot() {
    // 尝试从package.json的位置确定根目录
    let currentDir = this.getCwd();
    
    while (currentDir !== path.parse(currentDir).root) {
      const packagePath = path.join(currentDir, 'package.json');
      try {
        require(packagePath);
        return currentDir;
      } catch (e) {
        currentDir = path.dirname(currentDir);
      }
    }
    
    // 如果找不到package.json，返回当前工作目录
    return this.getCwd();
  }

  /**
   * 获取应用名称
   * @returns {string} 应用名称
   */
  getAppName() {
    try {
      const packageJson = require(path.join(this.getAppRoot(), 'package.json'));
      return packageJson.name || 'unknown-app';
    } catch (e) {
      return 'unknown-app';
    }
  }

  /**
   * 获取应用版本
   * @returns {string} 应用版本
   */
  getAppVersion() {
    try {
      const packageJson = require(path.join(this.getAppRoot(), 'package.json'));
      return packageJson.version || '0.0.0';
    } catch (e) {
      return '0.0.0';
    }
  }

  /**
   * 加载环境变量文件
   * @param {string} filePath - 环境变量文件路径
   * @returns {boolean} 是否加载成功
   */
  loadEnvFile(filePath) {
    try {
      const fs = require('fs');
      const content = fs.readFileSync(filePath, 'utf8');
      
      content.split('\n').forEach(line => {
        // 忽略空行和注释行
        line = line.trim();
        if (!line || line.startsWith('#')) return;
        
        // 解析KEY=VALUE格式
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          const [, key, value] = match;
          // 移除引号
          const cleanValue = value.replace(/^['"]|['"]$/g, '');
          this.setEnv(key.trim(), cleanValue);
        }
      });
      
      return true;
    } catch (e) {
      console.error(`加载环境变量文件失败: ${filePath}`, e);
      return false;
    }
  }

  /**
   * 加载.env文件
   * @returns {boolean} 是否加载成功
   */
  loadDotEnv() {
    const envFile = path.join(this.getCwd(), '.env');
    return this.loadEnvFile(envFile);
  }

  /**
   * 加载特定环境的.env文件
   * @param {string} env - 环境名称
   * @returns {boolean} 是否加载成功
   */
  loadEnvForEnvironment(env = this.getEnvironment()) {
    const envFile = path.join(this.getCwd(), `.env.${env}`);
    return this.loadEnvFile(envFile);
  }

  /**
   * 检查是否在Docker容器中运行
   * @returns {boolean} 是否在Docker中
   */
  isInDocker() {
    try {
      const fs = require('fs');
      // 检查Docker特征文件
      if (fs.existsSync('/.dockerenv')) return true;
      // 检查proc文件系统特征
      if (fs.existsSync('/proc/1/cgroup')) {
        const cgroup = fs.readFileSync('/proc/1/cgroup', 'utf8');
        return cgroup.includes('docker') || cgroup.includes('/docker/');
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  /**
   * 检查是否在Kubernetes中运行
   * @returns {boolean} 是否在Kubernetes中
   */
  isInKubernetes() {
    try {
      // 检查Kubernetes环境变量
      if (this.hasEnv('KUBERNETES_SERVICE_HOST') || 
          this.hasEnv('KUBERNETES_SERVICE_PORT')) {
        return true;
      }
      // 检查Kubernetes特征文件
      const fs = require('fs');
      return fs.existsSync('/var/run/secrets/kubernetes.io/serviceaccount');
    } catch (e) {
      return false;
    }
  }

  /**
   * 检查是否在CI/CD环境中运行
   * @returns {boolean} 是否在CI环境中
   */
  isInCI() {
    const ciEnvVars = [
      'CI', 'CONTINUOUS_INTEGRATION', 'BUILD_NUMBER', 'TRAVIS', 'CIRCLECI',
      'GITHUB_ACTIONS', 'GITLAB_CI', 'JENKINS_URL', 'TEAMCITY_VERSION',
      'BITBUCKET_BUILD_NUMBER'
    ];
    
    return ciEnvVars.some(varName => this.hasEnv(varName));
  }

  /**
   * 获取CI环境名称
   * @returns {string|null} CI环境名称
   */
  getCIName() {
    if (this.hasEnv('TRAVIS')) return 'travis';
    if (this.hasEnv('CIRCLECI')) return 'circleci';
    if (this.hasEnv('GITHUB_ACTIONS')) return 'github';
    if (this.hasEnv('GITLAB_CI')) return 'gitlab';
    if (this.hasEnv('JENKINS_URL')) return 'jenkins';
    if (this.hasEnv('TEAMCITY_VERSION')) return 'teamcity';
    if (this.hasEnv('BITBUCKET_BUILD_NUMBER')) return 'bitbucket';
    if (this.hasEnv('CI')) return 'generic';
    return null;
  }

  /**
   * 获取环境变量前缀
   * @param {string} prefix - 前缀
   * @returns {Object} 带有指定前缀的环境变量
   */
  getEnvWithPrefix(prefix) {
    const result = {};
    const env = this.getAllEnv();
    
    for (const key in env) {
      if (key.startsWith(prefix)) {
        const cleanKey = key.substring(prefix.length);
        result[cleanKey] = this.getEnv(key);
      }
    }
    
    return result;
  }

  /**
   * 将对象转换为环境变量设置命令
   * @param {Object} obj - 环境变量对象
   * @param {string} platform - 平台类型 (windows/unix)
   * @returns {string} 设置命令字符串
   */
  objToEnvCommands(obj, platform = this.getPlatform()) {
    const isWindows = this.isWindows();
    const commands = [];
    
    for (const [key, value] of Object.entries(obj)) {
      const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      
      if (isWindows) {
        commands.push(`set "${key}=${stringValue}"`);
      } else {
        commands.push(`export ${key}="${stringValue}"`);
      }
    }
    
    return commands.join(isWindows ? '\r\n' : '\n');
  }

  /**
   * 清除环境缓存
   */
  clearCache() {
    this.envCache = {};
    this.platformCache = null;
    this.environmentCache = null;
    this.nodeVersionCache = null;
  }

  /**
   * 获取环境摘要信息
   * @returns {Object} 环境摘要
   */
  getEnvironmentSummary() {
    return {
      nodeVersion: this.getNodeVersion(),
      environment: this.getEnvironment(),
      platform: this.getPlatform(),
      hostname: this.getHostname(),
      cpuCount: os.cpus().length,
      memory: this.getMemoryInfo(),
      appName: this.getAppName(),
      appVersion: this.getAppVersion(),
      isDocker: this.isInDocker(),
      isKubernetes: this.isInKubernetes(),
      isCI: this.isInCI(),
      ciName: this.getCIName()
    };
  }

  /**
   * 检查端口是否被占用
   * @param {number} port - 端口号
   * @returns {Promise<boolean>} 是否被占用
   */
  async isPortInUse(port) {
    return new Promise((resolve) => {
      const net = require('net');
      const server = net.createServer();
      
      server.once('error', () => resolve(true));
      server.once('listening', () => {
        server.close(() => resolve(false));
      });
      
      server.listen(port);
    });
  }

  /**
   * 获取可用端口
   * @param {number} startPort - 起始端口
   * @param {number} maxAttempts - 最大尝试次数
   * @returns {Promise<number|null>} 可用端口或null
   */
  async getAvailablePort(startPort = 3000, maxAttempts = 100) {
    for (let i = 0; i < maxAttempts; i++) {
      const port = startPort + i;
      if (!(await this.isPortInUse(port))) {
        return port;
      }
    }
    return null;
  }
}

// 单例模式
let instance = null;

function getInstance(options = {}) {
  if (!instance) {
    instance = new EnvironmentUtils(options);
  }
  return instance;
}

module.exports = {
  EnvironmentUtils,
  getInstance
};