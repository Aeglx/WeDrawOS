/**
 * 系统设置服务
 * 处理系统配置相关的业务逻辑
 */

const di = require('../../../core/di/container');
const systemRepository = di.resolve('systemRepository');
const logger = di.resolve('logger');
const cache = di.resolve('cache');
const fileService = di.resolve('fileService');
const fs = require('fs');
const path = require('path');

class SystemService {
  /**
   * 获取系统配置
   * @returns {Promise<Object>} 系统配置对象
   */
  async getSystemConfig() {
    try {
      // 尝试从缓存获取
      const cachedConfig = await cache.get('system:config');
      if (cachedConfig) {
        return JSON.parse(cachedConfig);
      }
      
      const config = await systemRepository.getSystemConfig();
      
      // 缓存系统配置
      await cache.set('system:config', JSON.stringify(config), 3600); // 1小时缓存
      
      return config;
    } catch (error) {
      logger.error('获取系统配置失败', { error: error.message });
      throw error;
    }
  }
  
  /**
   * 更新系统配置
   * @param {Object} configData - 配置数据
   * @returns {Promise<Object>} 更新后的配置
   */
  async updateSystemConfig(configData) {
    try {
      // 验证配置数据
      this.validateConfigData(configData);
      
      const updatedConfig = await systemRepository.updateSystemConfig(configData);
      
      // 清除缓存
      await cache.delete('system:config');
      
      logger.info('系统配置更新成功');
      
      return updatedConfig;
    } catch (error) {
      logger.error('更新系统配置失败', { error: error.message });
      throw error;
    }
  }
  
  /**
   * 获取系统日志
   * @param {Object} query - 查询参数
   * @returns {Promise<Object>} 日志列表
   */
  async getSystemLogs(query) {
    try {
      const logs = await systemRepository.getSystemLogs(query);
      return logs;
    } catch (error) {
      logger.error('获取系统日志失败', { error: error.message, query });
      throw error;
    }
  }
  
  /**
   * 获取系统信息
   * @returns {Promise<Object>} 系统信息
   */
  async getSystemInfo() {
    try {
      const systemInfo = {
        nodeVersion: process.version,
        platform: process.platform,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        timestamp: new Date()
      };
      
      return systemInfo;
    } catch (error) {
      logger.error('获取系统信息失败', { error: error.message });
      throw error;
    }
  }
  
  /**
   * 清除系统缓存
   * @returns {Promise<Object>} 清除结果
   */
  async clearSystemCache() {
    try {
      // 清除所有缓存
      const result = await cache.clearAll();
      
      logger.info('系统缓存清除成功', { result });
      
      return {
        cleared: true,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('清除系统缓存失败', { error: error.message });
      throw error;
    }
  }
  
  /**
   * 备份系统数据
   * @returns {Promise<Object>} 备份结果
   */
  async backupSystemData() {
    try {
      // 生成备份文件名
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `backup-${timestamp}.json`;
      const backupPath = path.join(__dirname, '../../../../backups', backupFileName);
      
      // 创建备份目录
      if (!fs.existsSync(path.join(__dirname, '../../../../backups'))) {
        fs.mkdirSync(path.join(__dirname, '../../../../backups'), { recursive: true });
      }
      
      // 获取系统所有数据
      const systemData = await systemRepository.getAllSystemData();
      
      // 写入备份文件
      fs.writeFileSync(backupPath, JSON.stringify(systemData, null, 2));
      
      const backupResult = {
        fileName: backupFileName,
        filePath: backupPath,
        fileSize: fs.statSync(backupPath).size,
        timestamp: new Date()
      };
      
      logger.info('系统数据备份成功', { backupFileName });
      
      return backupResult;
    } catch (error) {
      logger.error('备份系统数据失败', { error: error.message });
      throw error;
    }
  }
  
  /**
   * 上传系统Logo
   * @param {Object} file - 上传的文件对象
   * @returns {Promise<string>} Logo URL
   */
  async uploadSystemLogo(file) {
    try {
      // 验证文件类型
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.mimetype)) {
        throw new Error('只允许上传JPG、PNG、GIF格式的图片');
      }
      
      // 验证文件大小（最大5MB）
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error('文件大小不能超过5MB');
      }
      
      // 生成文件名
      const timestamp = Date.now();
      const extension = path.extname(file.originalname);
      const fileName = `logo-${timestamp}${extension}`;
      
      // 上传文件
      const logoUrl = await fileService.uploadFile(file.buffer, {
        fileName,
        directory: 'system',
        mimeType: file.mimetype
      });
      
      // 更新系统配置中的Logo URL
      await systemRepository.updateSystemConfig({ logoUrl });
      
      // 清除缓存
      await cache.delete('system:config');
      
      logger.info('系统Logo上传成功', { logoUrl });
      
      return logoUrl;
    } catch (error) {
      logger.error('上传系统Logo失败', { error: error.message });
      throw error;
    }
  }
  
  /**
   * 验证配置数据
   * @param {Object} configData - 配置数据
   */
  validateConfigData(configData) {
    // 验证系统名称
    if (configData.siteName && configData.siteName.length > 50) {
      throw new Error('系统名称长度不能超过50个字符');
    }
    
    // 验证联系方式
    if (configData.contactEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(configData.contactEmail)) {
        throw new Error('请输入有效的邮箱地址');
      }
    }
    
    // 验证手机号
    if (configData.contactPhone) {
      const phoneRegex = /^1[3-9]\d{9}$/;
      if (!phoneRegex.test(configData.contactPhone)) {
        throw new Error('请输入有效的手机号');
      }
    }
    
    // 验证分页设置
    if (configData.defaultPageSize && (configData.defaultPageSize < 1 || configData.defaultPageSize > 100)) {
      throw new Error('默认分页大小必须在1-100之间');
    }
  }
}

module.exports = new SystemService();