/**
 * 文件上传服务模块
 * 负责文件上传、保存和管理功能
 */

// 导入依赖
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const config = require('../config/config');
const logger = require('../logging/logger');
const {
  AppError,
  ValidationError,
  FileError
} = require('../errors/appError');
const stringUtils = require('../utils/stringUtils');

/**
 * 文件上传服务类
 */
class FileUploadService {
  constructor(di) {
    this.di = di;
    this.config = di.get('config');
    this.logger = di.get('logger');
    
    // 初始化配置
    this.uploadDir = this.config.get('uploads.dir') || path.join(process.cwd(), 'uploads');
    this.maxFileSize = this.config.get('uploads.maxSize') || 5 * 1024 * 1024; // 默认5MB
    this.allowedExtensions = this.config.get('uploads.allowedExtensions') || {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'application/pdf': '.pdf',
      'application/msword': '.doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
      'application/vnd.ms-excel': '.xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx'
    };
    
    // 确保上传目录存在
    this._ensureUploadDirExists();
  }

  /**
   * 确保上传目录存在
   * @private
   */
  async _ensureUploadDirExists() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      this.logger.error('Failed to create upload directory', error);
      throw new FileError('Failed to initialize file upload service', 'UPLOAD_DIR_ERROR');
    }
  }

  /**
   * 保存文件
   * @param {Object} file - 文件对象
   * @param {Object} options - 保存选项
   * @returns {Promise<Object>} 保存结果
   */
  async saveFile(file, options = {}) {
    try {
      // 验证文件
      this._validateFile(file, options);
      
      // 生成文件名
      const fileName = this._generateFileName(file);
      
      // 创建目标目录
      const targetDir = path.join(this.uploadDir, options.directory || 'default');
      await fs.mkdir(targetDir, { recursive: true });
      
      // 保存文件
      const filePath = path.join(targetDir, fileName);
      
      // 根据文件对象类型处理
      if (file.buffer) {
        // 处理Buffer类型文件
        await fs.writeFile(filePath, file.buffer);
      } else if (file.path) {
        // 处理临时文件
        await fs.copyFile(file.path, filePath);
        // 可选：删除临时文件
        if (options.deleteTempFile !== false) {
          await fs.unlink(file.path).catch(err => {
            this.logger.warn('Failed to delete temporary file', { path: file.path, error: err.message });
          });
        }
      } else {
        throw new ValidationError('Invalid file object', { file: 'File object must have buffer or path property' });
      }
      
      // 计算文件哈希值
      const fileHash = await this._calculateFileHash(filePath);
      
      // 生成文件URL
      const fileUrl = this._generateFileUrl(fileName, options.directory);
      
      const result = {
        fileName,
        originalName: file.originalname || '',
        mimeType: file.mimetype || this._getMimeType(fileName),
        size: file.size || (await fs.stat(filePath)).size,
        filePath: filePath,
        fileUrl: fileUrl,
        hash: fileHash
      };
      
      this.logger.info('File saved successfully', { fileName, directory: options.directory });
      
      return result;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      this.logger.error('Failed to save file', { error: error.message });
      throw new FileError('Failed to save file', 'FILE_SAVE_ERROR');
    }
  }

  /**
   * 批量上传文件
   * @param {Array} files - 文件数组
   * @param {Object} options - 保存选项
   * @returns {Promise<Array>} 保存结果数组
   */
  async batchUploadFiles(files, options = {}) {
    try {
      if (!Array.isArray(files)) {
        throw new ValidationError('Invalid files input', { files: 'Files must be an array' });
      }
      
      // 限制批量上传文件数量
      const maxFiles = options.maxFiles || 10;
      if (files.length > maxFiles) {
        throw new ValidationError('Too many files', { files: `Maximum ${maxFiles} files allowed` });
      }
      
      // 并发上传所有文件
      const uploadPromises = files.map(file => this.saveFile(file, options));
      const results = await Promise.all(uploadPromises);
      
      this.logger.info('Batch file upload completed', { count: results.length });
      
      return results;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      this.logger.error('Failed to batch upload files', { error: error.message });
      throw new FileError('Failed to batch upload files', 'BATCH_UPLOAD_ERROR');
    }
  }

  /**
   * 删除文件
   * @param {string} fileName - 文件名
   * @param {string} directory - 文件目录
   * @returns {Promise<boolean>} 是否删除成功
   */
  async deleteFile(fileName, directory = 'default') {
    try {
      const filePath = path.join(this.uploadDir, directory, fileName);
      
      // 检查文件是否存在
      try {
        await fs.access(filePath);
      } catch (error) {
        this.logger.warn('File not found for deletion', { filePath });
        return false;
      }
      
      // 删除文件
      await fs.unlink(filePath);
      
      this.logger.info('File deleted successfully', { fileName, directory });
      return true;
    } catch (error) {
      this.logger.error('Failed to delete file', { fileName, directory, error: error.message });
      throw new FileError('Failed to delete file', 'FILE_DELETE_ERROR');
    }
  }

  /**
   * 获取文件信息
   * @param {string} fileName - 文件名
   * @param {string} directory - 文件目录
   * @returns {Promise<Object|null>} 文件信息
   */
  async getFileInfo(fileName, directory = 'default') {
    try {
      const filePath = path.join(this.uploadDir, directory, fileName);
      
      // 获取文件状态
      const stats = await fs.stat(filePath);
      
      // 计算文件哈希
      const hash = await this._calculateFileHash(filePath);
      
      // 生成文件URL
      const fileUrl = this._generateFileUrl(fileName, directory);
      
      return {
        fileName,
        filePath,
        fileUrl,
        size: stats.size,
        mimeType: this._getMimeType(fileName),
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
        hash
      };
    } catch (error) {
      if (error.code === 'ENOENT') {
        this.logger.warn('File not found', { fileName, directory });
        return null;
      }
      
      this.logger.error('Failed to get file info', { fileName, directory, error: error.message });
      throw new FileError('Failed to get file info', 'FILE_INFO_ERROR');
    }
  }

  /**
   * 列出目录中的文件
   * @param {string} directory - 目录路径
   * @returns {Promise<Array>} 文件列表
   */
  async listFiles(directory = 'default') {
    try {
      const targetDir = path.join(this.uploadDir, directory);
      
      // 检查目录是否存在
      try {
        await fs.access(targetDir);
      } catch (error) {
        this.logger.warn('Directory not found', { directory });
        return [];
      }
      
      // 读取目录内容
      const files = await fs.readdir(targetDir, { withFileTypes: true });
      
      // 过滤出文件（不包括子目录）
      const fileList = [];
      
      for (const file of files) {
        if (file.isFile()) {
          try {
            const stats = await fs.stat(path.join(targetDir, file.name));
            fileList.push({
              fileName: file.name,
              size: stats.size,
              mimeType: this._getMimeType(file.name),
              createdAt: stats.birthtime,
              modifiedAt: stats.mtime,
              fileUrl: this._generateFileUrl(file.name, directory)
            });
          } catch (error) {
            this.logger.warn('Failed to get file details', { fileName: file.name, error: error.message });
          }
        }
      }
      
      return fileList;
    } catch (error) {
      this.logger.error('Failed to list files', { directory, error: error.message });
      throw new FileError('Failed to list files', 'LIST_FILES_ERROR');
    }
  }

  /**
   * 验证文件
   * @private
   * @param {Object} file - 文件对象
   * @param {Object} options - 验证选项
   */
  _validateFile(file, options = {}) {
    // 检查文件对象是否有效
    if (!file || (!file.buffer && !file.path)) {
      throw new ValidationError('Invalid file object', { file: 'File must have buffer or path property' });
    }
    
    // 检查文件大小
    if (file.size && file.size > (options.maxSize || this.maxFileSize)) {
      const maxSize = options.maxSize || this.maxFileSize;
      throw new ValidationError('File too large', { 
        file: `File size exceeds maximum allowed size of ${maxSize / (1024 * 1024)}MB` 
      });
    }
    
    // 检查文件类型
    if (options.allowedTypes) {
      if (!Array.isArray(options.allowedTypes)) {
        throw new ValidationError('Invalid allowedTypes', { 
          allowedTypes: 'allowedTypes must be an array' 
        });
      }
      
      if (file.mimetype && !options.allowedTypes.includes(file.mimetype)) {
        throw new ValidationError('File type not allowed', { 
          file: `File type ${file.mimetype} is not allowed. Allowed types: ${options.allowedTypes.join(', ')}` 
        });
      }
    }
    
    // 检查文件扩展名
    if (options.allowedExtensions) {
      const allowedExts = options.allowedExtensions;
      const fileExt = path.extname(file.originalname || '').toLowerCase();
      
      if (!allowedExts.includes(fileExt)) {
        throw new ValidationError('File extension not allowed', { 
          file: `File extension ${fileExt} is not allowed. Allowed extensions: ${allowedExts.join(', ')}` 
        });
      }
    }
    
    // 检查文件名
    if (file.originalname && file.originalname.length > 255) {
      throw new ValidationError('File name too long', { 
        file: 'File name cannot exceed 255 characters' 
      });
    }
  }

  /**
   * 生成唯一文件名
   * @private
   * @param {Object} file - 文件对象
   * @returns {string} 生成的文件名
   */
  _generateFileName(file) {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const fileExt = path.extname(file.originalname || '').toLowerCase() || 
                   (this.allowedExtensions[file.mimetype] || '.bin');
    
    // 确保扩展名存在
    const baseName = `${timestamp}_${randomString}${fileExt}`;
    return baseName.toLowerCase();
  }

  /**
   * 生成文件URL
   * @private
   * @param {string} fileName - 文件名
   * @param {string} directory - 文件目录
   * @returns {string} 文件URL
   */
  _generateFileUrl(fileName, directory = 'default') {
    const baseUrl = this.config.get('uploads.baseUrl') || '/uploads';
    // 根据配置决定是使用相对路径还是绝对路径
    return `${baseUrl}/${directory}/${fileName}`;
  }

  /**
   * 计算文件哈希值
   * @private
   * @param {string} filePath - 文件路径
   * @returns {Promise<string>} 文件哈希值
   */
  async _calculateFileHash(filePath) {
    try {
      const buffer = await fs.readFile(filePath);
      return crypto.createHash('md5').update(buffer).digest('hex');
    } catch (error) {
      this.logger.warn('Failed to calculate file hash', { filePath, error: error.message });
      return null;
    }
  }

  /**
   * 根据文件名获取MIME类型
   * @private
   * @param {string} fileName - 文件名
   * @returns {string} MIME类型
   */
  _getMimeType(fileName) {
    const fileExt = path.extname(fileName).toLowerCase();
    
    // 简单的MIME类型映射
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
    
    return mimeTypes[fileExt] || 'application/octet-stream';
  }

  /**
   * 清理过期文件
   * @param {string} directory - 文件目录
   * @param {number} maxAge - 最大保留时间（毫秒）
   * @returns {Promise<number>} 删除的文件数量
   */
  async cleanupOldFiles(directory = 'default', maxAge = 30 * 24 * 60 * 60 * 1000) { // 默认30天
    try {
      const targetDir = path.join(this.uploadDir, directory);
      const currentTime = Date.now();
      let deletedCount = 0;
      
      try {
        // 读取目录内容
        const files = await fs.readdir(targetDir, { withFileTypes: true });
        
        for (const file of files) {
          if (file.isFile()) {
            const filePath = path.join(targetDir, file.name);
            const stats = await fs.stat(filePath);
            
            // 检查文件是否过期
            if (currentTime - stats.mtime.getTime() > maxAge) {
              await fs.unlink(filePath);
              deletedCount++;
              this.logger.info('Cleaned up old file', { fileName: file.name, directory });
            }
          }
        }
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
        // 目录不存在，不处理
      }
      
      this.logger.info('Old files cleanup completed', { directory, deletedCount });
      return deletedCount;
    } catch (error) {
      this.logger.error('Failed to cleanup old files', { directory, error: error.message });
      throw new FileError('Failed to cleanup old files', 'CLEANUP_ERROR');
    }
  }

  /**
   * 创建文件缩略图（如果是图片）
   * @param {string} fileName - 原始文件名
   * @param {string} directory - 文件目录
   * @param {Object} options - 缩略图选项
   * @returns {Promise<Object|null>} 缩略图信息
   */
  async createThumbnail(fileName, directory = 'default', options = {}) {
    try {
      // 检查是否支持图片处理
      let sharp;
      try {
        sharp = require('sharp');
      } catch (error) {
        this.logger.warn('Sharp library not installed, cannot create thumbnails');
        return null;
      }
      
      const filePath = path.join(this.uploadDir, directory, fileName);
      const thumbnailExt = path.extname(fileName);
      const thumbnailName = `thumbnail_${fileName}`;
      const thumbnailPath = path.join(this.uploadDir, directory, thumbnailName);
      
      // 检查原文件是否存在
      try {
        await fs.access(filePath);
      } catch (error) {
        this.logger.warn('Original file not found for thumbnail creation', { filePath });
        return null;
      }
      
      // 创建缩略图
      const width = options.width || 200;
      const height = options.height || 200;
      const fit = options.fit || 'inside';
      
      await sharp(filePath)
        .resize(width, height, { fit })
        .toFile(thumbnailPath);
      
      // 获取缩略图信息
      const stats = await fs.stat(thumbnailPath);
      
      return {
        fileName: thumbnailName,
        filePath: thumbnailPath,
        fileUrl: this._generateFileUrl(thumbnailName, directory),
        size: stats.size,
        width,
        height
      };
    } catch (error) {
      this.logger.error('Failed to create thumbnail', { fileName, directory, error: error.message });
      // 缩略图创建失败不应影响主流程
      return null;
    }
  }
}

module.exports = FileUploadService;