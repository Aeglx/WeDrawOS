/**
 * 文件上传服务
 * 处理文件存储、检索和删除等操作
 */

const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const logger = require('@core/utils/logger');

class FileUploadService {
  constructor() {
    this.uploadDir = path.join(process.cwd(), 'uploads');
    this.imageDir = path.join(this.uploadDir, 'images');
    this.fileDir = path.join(this.uploadDir, 'files');
    this.initializeDirectories();
  }
  
  /**
   * 初始化上传目录
   */
  async initializeDirectories() {
    try {
      await fs.mkdir(this.imageDir, { recursive: true });
      await fs.mkdir(this.fileDir, { recursive: true });
      
      // 创建子目录
      const imageTypes = ['product', 'avatar', 'banner', 'category', 'other'];
      const fileTypes = ['document', 'contract', 'certificate', 'other'];
      
      for (const type of imageTypes) {
        await fs.mkdir(path.join(this.imageDir, type), { recursive: true });
      }
      
      for (const type of fileTypes) {
        await fs.mkdir(path.join(this.fileDir, type), { recursive: true });
      }
      
      logger.info('文件上传目录初始化完成');
    } catch (error) {
      logger.error('初始化文件上传目录失败:', error);
    }
  }
  
  /**
   * 保存文件
   * @param {Buffer} fileData - 文件数据
   * @param {string} fileName - 原始文件名
   * @param {string} mimeType - 文件MIME类型
   * @param {string} type - 文件类型分类
   * @returns {Object} 文件信息
   */
  async saveFile(fileData, fileName, mimeType, type = 'other') {
    try {
      const fileExt = path.extname(fileName).toLowerCase();
      const isImage = this.isImage(mimeType);
      
      // 生成唯一文件名
      const uniqueFileName = `${uuidv4()}${fileExt}`;
      
      // 确定存储目录
      const dir = isImage 
        ? path.join(this.imageDir, type)
        : path.join(this.fileDir, type);
      
      // 确保目录存在
      await fs.mkdir(dir, { recursive: true });
      
      // 保存文件
      const filePath = path.join(dir, uniqueFileName);
      await fs.writeFile(filePath, fileData);
      
      // 构建文件信息
      const fileInfo = {
        fileName: uniqueFileName,
        originalName: fileName,
        mimeType,
        size: fileData.length,
        type,
        url: isImage
          ? `/uploads/images/${type}/${uniqueFileName}`
          : `/uploads/files/${type}/${uniqueFileName}`,
        path: filePath,
        createdAt: new Date().toISOString()
      };
      
      logger.info(`文件保存成功: ${fileName} -> ${uniqueFileName}`);
      return fileInfo;
    } catch (error) {
      logger.error('保存文件失败:', error);
      throw new Error('文件保存失败');
    }
  }
  
  /**
   * 上传图片
   * @param {Array} files - 文件数组
   * @param {string} type - 图片类型
   * @returns {Array} 上传结果
   */
  async uploadImage(files, type = 'product') {
    if (!Array.isArray(files)) {
      files = [files];
    }
    
    const results = [];
    
    for (const file of files) {
      try {
        // 验证图片类型
        if (!this.isImage(file.mimetype)) {
          throw new Error(`不支持的图片类型: ${file.mimetype}`);
        }
        
        // 验证文件大小 (10MB)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error('图片大小不能超过10MB');
        }
        
        const fileInfo = await this.saveFile(file.data, file.name, file.mimetype, type);
        results.push({
          success: true,
          fileInfo
        });
      } catch (error) {
        results.push({
          success: false,
          fileName: file.name,
          error: error.message
        });
      }
    }
    
    return results;
  }
  
  /**
   * 上传文件
   * @param {Array} files - 文件数组
   * @param {string} type - 文件类型
   * @returns {Array} 上传结果
   */
  async uploadFile(files, type = 'document') {
    if (!Array.isArray(files)) {
      files = [files];
    }
    
    const results = [];
    
    for (const file of files) {
      try {
        // 验证文件大小 (50MB)
        if (file.size > 50 * 1024 * 1024) {
          throw new Error('文件大小不能超过50MB');
        }
        
        const fileInfo = await this.saveFile(file.data, file.name, file.mimetype, type);
        results.push({
          success: true,
          fileInfo
        });
      } catch (error) {
        results.push({
          success: false,
          fileName: file.name,
          error: error.message
        });
      }
    }
    
    return results;
  }
  
  /**
   * 删除文件
   * @param {string} fileName - 文件名
   * @param {string} type - 文件类型
   * @param {boolean} isImage - 是否为图片
   * @returns {boolean} 是否删除成功
   */
  async deleteFile(fileName, type = 'other', isImage = false) {
    try {
      const dir = isImage
        ? path.join(this.imageDir, type)
        : path.join(this.fileDir, type);
      
      const filePath = path.join(dir, fileName);
      
      // 检查文件是否存在
      try {
        await fs.access(filePath);
      } catch {
        logger.warn(`文件不存在: ${fileName}`);
        return false;
      }
      
      // 删除文件
      await fs.unlink(filePath);
      logger.info(`文件删除成功: ${fileName}`);
      return true;
    } catch (error) {
      logger.error('删除文件失败:', error);
      return false;
    }
  }
  
  /**
   * 获取文件信息
   * @param {string} fileName - 文件名
   * @param {string} type - 文件类型
   * @param {boolean} isImage - 是否为图片
   * @returns {Object|null} 文件信息
   */
  async getFileInfo(fileName, type = 'other', isImage = false) {
    try {
      const dir = isImage
        ? path.join(this.imageDir, type)
        : path.join(this.fileDir, type);
      
      const filePath = path.join(dir, fileName);
      
      // 检查文件是否存在
      try {
        await fs.access(filePath);
      } catch {
        return null;
      }
      
      // 获取文件统计信息
      const stats = await fs.stat(filePath);
      
      return {
        fileName,
        type,
        size: stats.size,
        url: isImage
          ? `/uploads/images/${type}/${fileName}`
          : `/uploads/files/${type}/${fileName}`,
        createdAt: stats.birthtime ? stats.birthtime.toISOString() : new Date().toISOString(),
        modifiedAt: stats.mtime ? stats.mtime.toISOString() : new Date().toISOString()
      };
    } catch (error) {
      logger.error('获取文件信息失败:', error);
      return null;
    }
  }
  
  /**
   * 检查是否为图片类型
   * @param {string} mimeType - MIME类型
   * @returns {boolean} 是否为图片
   */
  isImage(mimeType) {
    return mimeType && mimeType.startsWith('image/');
  }
  
  /**
   * 清理临时文件
   */
  async cleanupTempFiles() {
    // 这里可以实现清理逻辑，比如删除超过一定时间的临时文件
    logger.info('临时文件清理功能待实现');
  }
}

module.exports = new FileUploadService();