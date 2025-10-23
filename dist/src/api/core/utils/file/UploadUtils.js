/**
 * 文件上传工具
 * 提供文件上传、验证和处理功能
 */

const fs = require('fs');
const path = require('path');
const multer = require('multer');
const sharp = require('sharp');
const logger = require('../logger');
const { FileUtils } = require('./FileUtils');
const { AppError } = require('../../exception/handlers/errorHandler');
const { FileUploadError } = require('../../exception/handlers/errorHandler');

/**
 * 文件上传配置
 */
const UploadConfig = {
  DEFAULT_DESTINATION: './uploads',
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB 默认最大文件大小
  IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  PDF_TYPES: ['application/pdf'],
  DOC_TYPES: [
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ],
  VIDEO_TYPES: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv'],
  AUDIO_TYPES: ['audio/mpeg', 'audio/wav', 'audio/ogg']
};

/**
 * 文件上传工具类
 */
class UploadUtils {
  /**
   * 构造函数
   * @param {Object} options - 上传配置选项
   */
  constructor(options = {}) {
    this.options = {
      destination: options.destination || UploadConfig.DEFAULT_DESTINATION,
      maxFileSize: options.maxFileSize || UploadConfig.MAX_FILE_SIZE,
      allowedTypes: options.allowedTypes || null,
      ...options
    };
    
    // 确保上传目录存在
    this._ensureDirExists(this.options.destination);
    
    // 初始化 multer 存储引擎
    this.storage = this._createStorage();
    
    logger.debug('文件上传工具初始化完成', { options: this.options });
  }

  /**
   * 确保目录存在
   * @private
   * @param {string} dirPath - 目录路径
   */
  _ensureDirExists(dirPath) {
    try {
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        logger.debug(`创建上传目录: ${dirPath}`);
      }
    } catch (error) {
      logger.error(`创建目录失败: ${dirPath}`, { error: error.message });
      throw new AppError(`无法创建上传目录: ${error.message}`, {
        code: 'DIRECTORY_CREATION_FAILED',
        status: 500
      });
    }
  }

  /**
   * 创建 multer 存储引擎
   * @private
   * @returns {Object} multer 存储引擎
   */
  _createStorage() {
    return multer.diskStorage({
      destination: (req, file, cb) => {
        // 支持动态目录
        const dynamicDir = this._getDynamicDir(req, file);
        this._ensureDirExists(dynamicDir);
        cb(null, dynamicDir);
      },
      filename: (req, file, cb) => {
        // 生成唯一文件名
        const uniqueFileName = this._generateUniqueFileName(file);
        cb(null, uniqueFileName);
      }
    });
  }

  /**
   * 获取动态目录
   * @private
   * @param {Object} req - Express 请求对象
   * @param {Object} file - 文件对象
   * @returns {string} 动态目录路径
   */
  _getDynamicDir(req, file) {
    // 如果有动态目录生成器函数
    if (typeof this.options.dynamicDir === 'function') {
      const dynamicPath = this.options.dynamicDir(req, file);
      return path.join(this.options.destination, dynamicPath);
    }
    
    // 默认按日期分目录
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    return path.join(this.options.destination, `${year}/${month}/${day}`);
  }

  /**
   * 生成唯一文件名
   * @private
   * @param {Object} file - 文件对象
   * @returns {string} 唯一文件名
   */
  _generateUniqueFileName(file) {
    const originalName = file.originalname;
    const fileExt = path.extname(originalName);
    const fileNameWithoutExt = path.basename(originalName, fileExt);
    
    // 生成唯一标识符
    const uniqueId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // 清理文件名（移除特殊字符）
    const sanitizedName = fileNameWithoutExt.replace(/[^a-zA-Z0-9_-]/g, '_');
    
    return `${sanitizedName}_${uniqueId}${fileExt}`;
  }

  /**
   * 文件过滤器
   * @private
   * @param {Object} req - Express 请求对象
   * @param {Object} file - 文件对象
   * @param {Function} cb - 回调函数
   */
  _fileFilter(req, file, cb) {
    // 检查文件类型
    const allowedTypes = this.options.allowedTypes;
    if (allowedTypes && !allowedTypes.includes(file.mimetype)) {
      logger.warn(`不允许的文件类型: ${file.mimetype}`, {
        originalName: file.originalname,
        allowedTypes
      });
      
      cb(new FileUploadError(`不支持的文件类型: ${file.mimetype}`, {
        code: 'UNSUPPORTED_FILE_TYPE',
        status: 400,
        fileInfo: {
          originalName: file.originalname,
          mimetype: file.mimetype
        }
      }));
      return;
    }
    
    // 检查文件大小
    if (file.size && file.size > this.options.maxFileSize) {
      logger.warn(`文件大小超出限制`, {
        originalName: file.originalname,
        fileSize: file.size,
        maxSize: this.options.maxFileSize
      });
      
      cb(new FileUploadError(`文件大小超出限制，最大允许 ${this._formatFileSize(this.options.maxFileSize)}`, {
        code: 'FILE_TOO_LARGE',
        status: 400,
        fileInfo: {
          originalName: file.originalname,
          size: file.size,
          maxSize: this.options.maxFileSize
        }
      }));
      return;
    }
    
    // 如果有自定义过滤器
    if (typeof this.options.fileFilter === 'function') {
      try {
        const result = this.options.fileFilter(req, file);
        if (result !== true) {
          const errorMsg = result || '文件验证失败';
          cb(new FileUploadError(errorMsg, {
            code: 'FILE_VALIDATION_FAILED',
            status: 400,
            fileInfo: {
              originalName: file.originalname
            }
          }));
          return;
        }
      } catch (error) {
        cb(new FileUploadError(error.message || '文件验证失败', {
          code: 'FILE_VALIDATION_ERROR',
          status: 400,
          cause: error
        }));
        return;
      }
    }
    
    cb(null, true);
  }

  /**
   * 创建 multer 实例
   * @param {Object} multerOptions - multer 配置选项
   * @returns {Object} multer 实例
   */
  createMulterInstance(multerOptions = {}) {
    const options = {
      storage: this.storage,
      limits: {
        fileSize: this.options.maxFileSize,
        ...(multerOptions.limits || {})
      },
      fileFilter: this._fileFilter.bind(this),
      ...multerOptions
    };
    
    return multer(options);
  }

  /**
   * 创建单文件上传中间件
   * @param {string} fieldName - 字段名
   * @param {Object} options - 配置选项
   * @returns {Function} Express 中间件
   */
  single(fieldName, options = {}) {
    const multerInstance = this.createMulterInstance(options);
    const middleware = multerInstance.single(fieldName);
    
    return this._wrapMulterMiddleware(middleware);
  }

  /**
   * 创建多文件上传中间件
   * @param {string} fieldName - 字段名
   * @param {number} maxCount - 最大文件数量
   * @param {Object} options - 配置选项
   * @returns {Function} Express 中间件
   */
  array(fieldName, maxCount = 10, options = {}) {
    const multerInstance = this.createMulterInstance(options);
    const middleware = multerInstance.array(fieldName, maxCount);
    
    return this._wrapMulterMiddleware(middleware);
  }

  /**
   * 创建多字段文件上传中间件
   * @param {Array} fields - 字段配置数组
   * @param {Object} options - 配置选项
   * @returns {Function} Express 中间件
   */
  fields(fields, options = {}) {
    const multerInstance = this.createMulterInstance(options);
    const middleware = multerInstance.fields(fields);
    
    return this._wrapMulterMiddleware(middleware);
  }

  /**
   * 创建任意文件上传中间件
   * @param {Object} options - 配置选项
   * @returns {Function} Express 中间件
   */
  any(options = {}) {
    const multerInstance = this.createMulterInstance(options);
    const middleware = multerInstance.any();
    
    return this._wrapMulterMiddleware(middleware);
  }

  /**
   * 包装 multer 中间件
   * @private
   * @param {Function} middleware - multer 中间件
   * @returns {Function} 包装后的中间件
   */
  _wrapMulterMiddleware(middleware) {
    return (req, res, next) => {
      middleware(req, res, (err) => {
        if (err) {
          // 记录上传错误
          logger.error('文件上传失败', {
            error: err.message,
            field: err.field,
            code: err.code
          });
          
          // 转换 multer 错误为统一的错误格式
          if (err.code === 'LIMIT_FILE_SIZE') {
            next(new FileUploadError('文件大小超出限制', {
              code: 'FILE_TOO_LARGE',
              status: 400,
              cause: err
            }));
          } else if (err.code === 'LIMIT_FILE_COUNT') {
            next(new FileUploadError('文件数量超出限制', {
              code: 'FILE_COUNT_EXCEEDED',
              status: 400,
              cause: err
            }));
          } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            next(new FileUploadError(`意外的文件字段: ${err.field}`, {
              code: 'UNEXPECTED_FILE_FIELD',
              status: 400,
              cause: err
            }));
          } else {
            next(err);
          }
          return;
        }
        
        // 处理上传后的文件
        this._processUploadedFiles(req);
        
        next();
      });
    };
  }

  /**
   * 处理上传后的文件
   * @private
   * @param {Object} req - Express 请求对象
   */
  _processUploadedFiles(req) {
    // 处理单文件
    if (req.file) {
      this._enrichFileInfo(req.file);
      logger.info(`单文件上传成功`, {
        fileName: req.file.originalname,
        size: req.file.size,
        path: req.file.path
      });
    }
    
    // 处理多文件
    if (req.files) {
      // 检查是数组还是对象
      if (Array.isArray(req.files)) {
        req.files.forEach(file => this._enrichFileInfo(file));
      } else {
        Object.values(req.files).forEach(fileArray => {
          fileArray.forEach(file => this._enrichFileInfo(file));
        });
      }
      
      logger.info(`多文件上传成功`, {
        fileCount: this._getFileCount(req.files)
      });
    }
  }

  /**
   * 获取上传文件的数量
   * @private
   * @param {Array|Object} files - 文件对象或数组
   * @returns {number} 文件数量
   */
  _getFileCount(files) {
    if (Array.isArray(files)) {
      return files.length;
    } else {
      return Object.values(files).reduce((total, fileArray) => total + fileArray.length, 0);
    }
  }

  /**
   * 丰富文件信息
   * @private
   * @param {Object} file - 文件对象
   */
  _enrichFileInfo(file) {
    // 添加文件信息
    file.url = this._generateFileUrl(file);
    file.relativePath = path.relative(this.options.destination, file.path);
    file.sizeFormatted = this._formatFileSize(file.size);
    file.uploadedAt = new Date().toISOString();
    
    // 如果是图片，尝试获取尺寸信息
    if (UploadConfig.IMAGE_TYPES.includes(file.mimetype)) {
      this._getImageDimensions(file.path).then(dimensions => {
        file.dimensions = dimensions;
      }).catch(err => {
        logger.warn('获取图片尺寸失败', { path: file.path, error: err.message });
      });
    }
  }

  /**
   * 生成文件 URL
   * @private
   * @param {Object} file - 文件对象
   * @returns {string} 文件 URL
   */
  _generateFileUrl(file) {
    // 如果有自定义 URL 生成器
    if (typeof this.options.urlGenerator === 'function') {
      return this.options.urlGenerator(file);
    }
    
    // 默认返回相对路径
    const relativePath = path.relative(this.options.destination, file.path);
    return `/uploads/${relativePath.replace(/\\/g, '/')}`;
  }

  /**
   * 获取图片尺寸
   * @private
   * @param {string} filePath - 文件路径
   * @returns {Promise<Object>} 包含宽高的对象
   */
  async _getImageDimensions(filePath) {
    try {
      const metadata = await sharp(filePath).metadata();
      return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format
      };
    } catch (error) {
      throw new Error(`获取图片尺寸失败: ${error.message}`);
    }
  }

  /**
   * 处理图片上传（调整大小、裁剪等）
   * @param {string} inputPath - 输入文件路径
   * @param {string} outputPath - 输出文件路径
   * @param {Object} options - 处理选项
   * @returns {Promise<Object>} 处理后的图片信息
   */
  async processImage(inputPath, outputPath, options = {}) {
    try {
      const {
        width,
        height,
        resizeMode = 'contain', // contain, cover, fill
        format,
        quality = 80,
        crop,
        rotate,
        flip,
        flop
      } = options;
      
      let image = sharp(inputPath);
      
      // 调整大小
      if (width || height) {
        image = image.resize({
          width,
          height,
          fit: resizeMode === 'contain' ? 'contain' : 
               resizeMode === 'cover' ? 'cover' : 'fill',
          position: 'center'
        });
      }
      
      // 裁剪
      if (crop) {
        image = image.extract({
          left: crop.left,
          top: crop.top,
          width: crop.width,
          height: crop.height
        });
      }
      
      // 旋转
      if (rotate !== undefined) {
        image = image.rotate(rotate);
      }
      
      // 翻转
      if (flip) {
        image = image.flip();
      }
      
      if (flop) {
        image = image.flop();
      }
      
      // 设置格式和质量
      if (format) {
        image = image.toFormat(format, { quality });
      } else {
        image = image.jpeg({ quality });
      }
      
      // 确保输出目录存在
      const outputDir = path.dirname(outputPath);
      this._ensureDirExists(outputDir);
      
      // 保存文件
      await image.toFile(outputPath);
      
      // 获取处理后的文件信息
      const stats = fs.statSync(outputPath);
      const dimensions = await this._getImageDimensions(outputPath);
      
      logger.info(`图片处理成功`, {
        input: inputPath,
        output: outputPath,
        ...dimensions,
        size: stats.size
      });
      
      return {
        path: outputPath,
        size: stats.size,
        ...dimensions
      };
    } catch (error) {
      logger.error(`图片处理失败`, {
        input: inputPath,
        error: error.message
      });
      throw new FileUploadError(`图片处理失败: ${error.message}`, {
        code: 'IMAGE_PROCESSING_FAILED',
        status: 500,
        cause: error
      });
    }
  }

  /**
   * 创建图片缩略图
   * @param {string} imagePath - 原图路径
   * @param {string} thumbnailPath - 缩略图路径
   * @param {Object} options - 缩略图选项
   * @returns {Promise<Object>} 缩略图信息
   */
  async createThumbnail(imagePath, thumbnailPath, options = {}) {
    const {
      width = 200,
      height = 200,
      mode = 'cover',
      quality = 75,
      format = 'jpg'
    } = options;
    
    return this.processImage(imagePath, thumbnailPath, {
      width,
      height,
      resizeMode: mode,
      quality,
      format
    });
  }

  /**
   * 验证文件是否存在
   * @param {string} filePath - 文件路径
   * @returns {boolean} 是否存在
   */
  fileExists(filePath) {
    return fs.existsSync(filePath);
  }

  /**
   * 删除上传的文件
   * @param {string} filePath - 文件路径
   * @returns {boolean} 是否删除成功
   */
  deleteFile(filePath) {
    try {
      if (this.fileExists(filePath)) {
        fs.unlinkSync(filePath);
        logger.info(`文件已删除`, { path: filePath });
        return true;
      }
      logger.warn(`文件不存在，无法删除`, { path: filePath });
      return false;
    } catch (error) {
      logger.error(`删除文件失败`, { path: filePath, error: error.message });
      throw new AppError(`删除文件失败: ${error.message}`, {
        code: 'FILE_DELETION_FAILED',
        status: 500,
        cause: error
      });
    }
  }

  /**
   * 移动上传的文件
   * @param {string} sourcePath - 源文件路径
   * @param {string} destinationPath - 目标文件路径
   * @returns {boolean} 是否移动成功
   */
  moveFile(sourcePath, destinationPath) {
    try {
      // 确保目标目录存在
      const destDir = path.dirname(destinationPath);
      this._ensureDirExists(destDir);
      
      // 移动文件
      fs.renameSync(sourcePath, destinationPath);
      
      logger.info(`文件移动成功`, {
        source: sourcePath,
        destination: destinationPath
      });
      
      return true;
    } catch (error) {
      logger.error(`移动文件失败`, {
        source: sourcePath,
        destination: destinationPath,
        error: error.message
      });
      throw new AppError(`移动文件失败: ${error.message}`, {
        code: 'FILE_MOVE_FAILED',
        status: 500,
        cause: error
      });
    }
  }

  /**
   * 复制文件
   * @param {string} sourcePath - 源文件路径
   * @param {string} destinationPath - 目标文件路径
   * @returns {boolean} 是否复制成功
   */
  copyFile(sourcePath, destinationPath) {
    try {
      // 确保目标目录存在
      const destDir = path.dirname(destinationPath);
      this._ensureDirExists(destDir);
      
      // 复制文件
      fs.copyFileSync(sourcePath, destinationPath);
      
      logger.info(`文件复制成功`, {
        source: sourcePath,
        destination: destinationPath
      });
      
      return true;
    } catch (error) {
      logger.error(`复制文件失败`, {
        source: sourcePath,
        destination: destinationPath,
        error: error.message
      });
      throw new AppError(`复制文件失败: ${error.message}`, {
        code: 'FILE_COPY_FAILED',
        status: 500,
        cause: error
      });
    }
  }

  /**
   * 格式化文件大小
   * @private
   * @param {number} bytes - 字节数
   * @returns {string} 格式化的文件大小字符串
   */
  _formatFileSize(bytes) {
    if (bytes < 1024) {
      return bytes + ' B';
    } else if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(2) + ' KB';
    } else if (bytes < 1024 * 1024 * 1024) {
      return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    } else {
      return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
    }
  }

  /**
   * 获取文件 MIME 类型
   * @param {string} filePath - 文件路径
   * @returns {string} MIME 类型
   */
  getFileMimeType(filePath) {
    return FileUtils.getMimeType(filePath);
  }

  /**
   * 检查是否为图片文件
   * @param {string} mimeType - MIME 类型
   * @returns {boolean} 是否为图片
   */
  isImage(mimeType) {
    return UploadConfig.IMAGE_TYPES.includes(mimeType);
  }

  /**
   * 检查是否为 PDF 文件
   * @param {string} mimeType - MIME 类型
   * @returns {boolean} 是否为 PDF
   */
  isPdf(mimeType) {
    return UploadConfig.PDF_TYPES.includes(mimeType);
  }

  /**
   * 检查是否为文档文件
   * @param {string} mimeType - MIME 类型
   * @returns {boolean} 是否为文档
   */
  isDocument(mimeType) {
    return UploadConfig.DOC_TYPES.includes(mimeType);
  }

  /**
   * 检查是否为视频文件
   * @param {string} mimeType - MIME 类型
   * @returns {boolean} 是否为视频
   */
  isVideo(mimeType) {
    return UploadConfig.VIDEO_TYPES.includes(mimeType);
  }

  /**
   * 检查是否为音频文件
   * @param {string} mimeType - MIME 类型
   * @returns {boolean} 是否为音频
   */
  isAudio(mimeType) {
    return UploadConfig.AUDIO_TYPES.includes(mimeType);
  }

  /**
   * 获取上传配置枚举
   * @returns {Object} 上传配置枚举
   */
  static getConfig() {
    return { ...UploadConfig };
  }

  /**
   * 创建文件上传工具实例
   * @param {Object} options - 配置选项
   * @returns {UploadUtils} 上传工具实例
   */
  static create(options = {}) {
    return new UploadUtils(options);
  }
}

module.exports = {
  UploadUtils,
  UploadConfig
};