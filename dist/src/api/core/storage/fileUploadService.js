/**
 * 文件上传服务
 * 提供文件处理和存储功能
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mkdirp = require('mkdirp');
const { AppError } = require('../exception/handlers/errorHandler');
const logger = require('../utils/logger');
const StringUtils = require('../utils/stringUtils');
const config = require('../config/config');

class FileUploadService {
  constructor() {
    this.uploadDir = config.get('upload.directory', './uploads');
    this.maxFileSize = config.get('upload.maxFileSize', 10 * 1024 * 1024); // 默认10MB
    this.allowedExtensions = config.get('upload.allowedExtensions', []);
    this.allowedMimeTypes = config.get('upload.allowedMimeTypes', []);
    
    // 确保上传目录存在
    this.ensureUploadDir();
  }

  /**
   * 确保上传目录存在
   */
  ensureUploadDir() {
    try {
      mkdirp.sync(this.uploadDir, { recursive: true });
      logger.info(`确保上传目录存在: ${this.uploadDir}`);
    } catch (error) {
      logger.error(`创建上传目录失败: ${error.message}`, { error });
      throw new AppError('创建上传目录失败', 500);
    }
  }

  /**
   * 生成唯一文件名
   * @param {string} originalName - 原始文件名
   * @returns {string} 唯一文件名
   */
  generateUniqueFilename(originalName) {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(originalName);
    
    return `${timestamp}_${randomString}${ext}`;
  }

  /**
   * 验证文件类型
   * @param {string} filename - 文件名
   * @param {string} mimeType - MIME类型
   * @returns {boolean} 是否有效
   */
  validateFileType(filename, mimeType) {
    // 验证文件扩展名
    if (this.allowedExtensions.length > 0) {
      const ext = path.extname(filename).toLowerCase().slice(1);
      if (!this.allowedExtensions.includes(ext)) {
        return false;
      }
    }

    // 验证MIME类型
    if (this.allowedMimeTypes.length > 0 && !this.allowedMimeTypes.includes(mimeType)) {
      return false;
    }

    return true;
  }

  /**
   * 保存文件
   * @param {Buffer|Stream} fileData - 文件数据
   * @param {Object} options - 选项
   * @param {string} options.originalName - 原始文件名
   * @param {string} options.mimeType - MIME类型
   * @param {string} options.subDirectory - 子目录
   * @returns {Object} 文件信息
   */
  async saveFile(fileData, options = {}) {
    const { originalName, mimeType = 'application/octet-stream', subDirectory = '' } = options;
    
    // 验证文件大小（如果是Buffer）
    if (Buffer.isBuffer(fileData) && fileData.length > this.maxFileSize) {
      throw new AppError(`文件大小超过限制，最大允许 ${this.formatFileSize(this.maxFileSize)}`, 400);
    }

    // 验证文件类型
    if (originalName && !this.validateFileType(originalName, mimeType)) {
      throw new AppError('不支持的文件类型', 400);
    }

    // 生成文件名
    const filename = originalName ? this.generateUniqueFilename(originalName) : this.generateUniqueFilename('file');
    
    // 构建文件路径
    const fileDir = path.join(this.uploadDir, subDirectory);
    const filePath = path.join(fileDir, filename);
    
    // 确保目录存在
    mkdirp.sync(fileDir, { recursive: true });

    try {
      if (Buffer.isBuffer(fileData)) {
        // 保存Buffer数据
        await fs.promises.writeFile(filePath, fileData);
      } else if (fileData && typeof fileData.pipe === 'function') {
        // 保存流数据
        await this.saveStreamToFile(fileData, filePath);
      } else {
        throw new AppError('不支持的文件数据类型', 400);
      }

      // 获取文件信息
      const stats = await fs.promises.stat(filePath);
      
      // 检查实际文件大小
      if (stats.size > this.maxFileSize) {
        await fs.promises.unlink(filePath);
        throw new AppError(`文件大小超过限制，最大允许 ${this.formatFileSize(this.maxFileSize)}`, 400);
      }

      const fileInfo = {
        filename,
        originalName,
        mimeType,
        size: stats.size,
        path: filePath,
        relativePath: path.join(subDirectory, filename).replace(/\\/g, '/'),
        url: this.getFileUrl(subDirectory, filename),
        createdAt: new Date()
      };

      logger.info(`文件上传成功: ${filename}`, { fileInfo });
      return fileInfo;
    } catch (error) {
      logger.error(`保存文件失败: ${error.message}`, { error, filename });
      throw new AppError('文件保存失败', 500);
    }
  }

  /**
   * 将流保存到文件
   * @param {Stream} stream - 文件流
   * @param {string} filePath - 文件路径
   * @returns {Promise}
   */
  saveStreamToFile(stream, filePath) {
    return new Promise((resolve, reject) => {
      const writeStream = fs.createWriteStream(filePath);
      let totalBytes = 0;

      stream.on('data', (chunk) => {
        totalBytes += chunk.length;
        if (totalBytes > this.maxFileSize) {
          stream.destroy();
          writeStream.destroy();
          reject(new AppError(`文件大小超过限制，最大允许 ${this.formatFileSize(this.maxFileSize)}`, 400));
        }
      });

      stream.on('error', (error) => {
        reject(error);
      });

      writeStream.on('error', (error) => {
        reject(error);
      });

      writeStream.on('finish', () => {
        resolve();
      });

      stream.pipe(writeStream);
    });
  }

  /**
   * 删除文件
   * @param {string} filePath - 文件路径
   * @returns {Promise<boolean>} 是否删除成功
   */
  async deleteFile(filePath) {
    if (!filePath) return false;

    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(this.uploadDir, filePath);

    try {
      // 检查文件是否存在
      await fs.promises.access(fullPath);
      
      // 删除文件
      await fs.promises.unlink(fullPath);
      
      logger.info(`文件删除成功: ${filePath}`);
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        // 文件不存在，视为删除成功
        logger.warn(`文件不存在，跳过删除: ${filePath}`);
        return true;
      }
      
      logger.error(`删除文件失败: ${error.message}`, { error, filePath });
      return false;
    }
  }

  /**
   * 批量删除文件
   * @param {Array<string>} filePaths - 文件路径数组
   * @returns {Promise<Object>} 删除结果
   */
  async deleteFiles(filePaths) {
    const results = {
      success: [],
      failed: []
    };

    if (!Array.isArray(filePaths)) {
      return results;
    }

    await Promise.all(filePaths.map(async (filePath) => {
      const success = await this.deleteFile(filePath);
      if (success) {
        results.success.push(filePath);
      } else {
        results.failed.push(filePath);
      }
    }));

    return results;
  }

  /**
   * 读取文件
   * @param {string} filePath - 文件路径
   * @returns {Promise<Buffer>} 文件内容
   */
  async readFile(filePath) {
    if (!filePath) {
      throw new AppError('文件路径不能为空', 400);
    }

    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(this.uploadDir, filePath);

    try {
      return await fs.promises.readFile(fullPath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new AppError('文件不存在', 404);
      }
      logger.error(`读取文件失败: ${error.message}`, { error, filePath });
      throw new AppError('文件读取失败', 500);
    }
  }

  /**
   * 获取文件信息
   * @param {string} filePath - 文件路径
   * @returns {Promise<Object>} 文件信息
   */
  async getFileInfo(filePath) {
    if (!filePath) {
      throw new AppError('文件路径不能为空', 400);
    }

    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(this.uploadDir, filePath);

    try {
      const stats = await fs.promises.stat(fullPath);
      
      // 从文件路径提取相对路径
      const relativePath = path.relative(this.uploadDir, fullPath).replace(/\\/g, '/');
      const lastSlashIndex = relativePath.lastIndexOf('/');
      const subDirectory = lastSlashIndex > 0 ? relativePath.substring(0, lastSlashIndex) : '';
      const filename = lastSlashIndex > 0 ? relativePath.substring(lastSlashIndex + 1) : relativePath;

      return {
        filename,
        path: fullPath,
        relativePath,
        size: stats.size,
        url: this.getFileUrl(subDirectory, filename),
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime
      };
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new AppError('文件不存在', 404);
      }
      logger.error(`获取文件信息失败: ${error.message}`, { error, filePath });
      throw new AppError('获取文件信息失败', 500);
    }
  }

  /**
   * 获取文件URL
   * @param {string} subDirectory - 子目录
   * @param {string} filename - 文件名
   * @returns {string} 文件URL
   */
  getFileUrl(subDirectory, filename) {
    const baseUrl = config.get('server.baseUrl', 'http://localhost:3000');
    const fileRoute = config.get('upload.fileRoute', '/api/files');
    
    let relativePath = filename;
    if (subDirectory) {
      relativePath = `${subDirectory}/${filename}`;
    }
    
    // 确保路径格式正确
    const pathSegments = [baseUrl];
    if (fileRoute && !fileRoute.startsWith('/')) {
      pathSegments.push('');
    }
    pathSegments.push(fileRoute);
    pathSegments.push(relativePath);
    
    return pathSegments.join('').replace(/\/+/g, '/');
  }

  /**
   * 格式化文件大小
   * @param {number} bytes - 字节数
   * @returns {string} 格式化的文件大小
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 验证上传目录空间
   * @returns {Promise<Object>} 空间信息
   */
  async checkStorageSpace() {
    try {
      const stats = await fs.promises.stat(this.uploadDir);
      // 注意：这个方法在Windows上可能无法正确获取磁盘空间
      // 在生产环境中，可能需要使用第三方库如'diskusage'
      return {
        directory: this.uploadDir,
        available: 'N/A', // 无法直接获取
        total: 'N/A',     // 无法直接获取
        used: stats.size
      };
    } catch (error) {
      logger.error(`检查存储空间失败: ${error.message}`, { error });
      return {
        directory: this.uploadDir,
        available: 'Error',
        total: 'Error',
        used: 0
      };
    }
  }

  /**
   * 创建文件上传中间件
   * @param {Object} options - 中间件选项
   * @returns {Function} 中间件函数
   */
  createUploadMiddleware(options = {}) {
    const { 
      fieldName = 'file',
      maxFileSize = this.maxFileSize,
      allowedExtensions = this.allowedExtensions,
      allowedMimeTypes = this.allowedMimeTypes
    } = options;

    return (req, res, next) => {
      try {
        // 这里只是一个占位符，实际项目中应该使用multer等中间件
        // 这个方法需要与实际的文件上传中间件集成
        next();
      } catch (error) {
        next(new AppError('文件上传失败', 400));
      }
    };
  }
}

// 创建单例实例
const fileUploadService = new FileUploadService();

module.exports = fileUploadService;