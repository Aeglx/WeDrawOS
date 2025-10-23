/**
 * 文件上传控制器
 * 处理各类文件上传请求
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const logger = require('../../core/utils/logger');
const commonService = require('../services/commonService');
const { MESSAGE_TOPICS } = require('../message-queue/topics/messageTopics');
const messageProducer = require('../message-queue/producers/messageProducer');

class FileUploadController {
  constructor() {
    this.uploadDir = path.join(process.cwd(), 'uploads');
    this.ensureUploadDir();
  }
  
  /**
   * 确保上传目录存在
   */
  async ensureUploadDir() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
      await fs.mkdir(path.join(this.uploadDir, 'images'), { recursive: true });
      await fs.mkdir(path.join(this.uploadDir, 'files'), { recursive: true });
    } catch (error) {
      logger.error('创建上传目录失败:', error);
    }
  }
  
  /**
   * 图片上传存储配置
   */
  getImageStorage() {
    return multer.diskStorage({
      destination: (req, file, cb) => {
        const type = req.body.type || 'product';
        const dir = path.join(this.uploadDir, 'images', type);
        fs.mkdir(dir, { recursive: true }).then(() => {
          cb(null, dir);
        }).catch(err => {
          cb(err);
        });
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `${path.basename(file.originalname, ext)}-${uniqueSuffix}${ext}`);
      }
    });
  }
  
  /**
   * 文件上传存储配置
   */
  getFileStorage() {
    return multer.diskStorage({
      destination: (req, file, cb) => {
        const type = req.body.type || 'document';
        const dir = path.join(this.uploadDir, 'files', type);
        fs.mkdir(dir, { recursive: true }).then(() => {
          cb(null, dir);
        }).catch(err => {
          cb(err);
        });
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `${path.basename(file.originalname, ext)}-${uniqueSuffix}${ext}`);
      }
    });
  }
  
  /**
   * 图片文件过滤器
   */
  imageFileFilter(req, file, cb) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的图片格式'), false);
    }
  }
  
  /**
   * 普通文件过滤器
   */
  fileFilter(req, file, cb) {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件格式'), false);
    }
  }
  
  /**
   * 图片上传处理器
   */
  uploadImage() {
    return multer({
      storage: this.getImageStorage(),
      fileFilter: this.imageFileFilter,
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      }
    }).single('file');
  }
  
  /**
   * 文件上传处理器
   */
  uploadFile() {
    return multer({
      storage: this.getFileStorage(),
      fileFilter: this.fileFilter,
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
      }
    }).single('file');
  }
  
  /**
   * 处理图片上传
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async handleImageUpload(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: '未上传文件' });
      }
      
      // 获取图片信息
      const fileInfo = {
        url: `/uploads/images/${req.body.type || 'product'}/${req.file.filename}`,
        filename: req.file.filename,
        size: req.file.size,
        mimeType: req.file.mimetype,
      };
      
      // 发送文件上传消息
      await messageProducer.send(MESSAGE_TOPICS.SYSTEM.CACHE_INVALIDATED, {
        type: 'file_upload',
        fileInfo,
      });
      
      logger.info(`图片上传成功: ${req.file.filename}`);
      res.json(fileInfo);
    } catch (error) {
      logger.error('图片上传失败:', error);
      res.status(500).json({ error: error.message || '图片上传失败' });
    }
  }
  
  /**
   * 处理文件上传
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async handleFileUpload(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: '未上传文件' });
      }
      
      // 获取文件信息
      const fileInfo = {
        url: `/uploads/files/${req.body.type || 'document'}/${req.file.filename}`,
        filename: req.file.filename,
        size: req.file.size,
        mimeType: req.file.mimetype,
      };
      
      // 发送文件上传消息
      await messageProducer.send(MESSAGE_TOPICS.SYSTEM.CACHE_INVALIDATED, {
        type: 'file_upload',
        fileInfo,
      });
      
      logger.info(`文件上传成功: ${req.file.filename}`);
      res.json(fileInfo);
    } catch (error) {
      logger.error('文件上传失败:', error);
      res.status(500).json({ error: error.message || '文件上传失败' });
    }
  }
  
  /**
   * 处理多图上传
   */
  uploadMultipleImages() {
    return multer({
      storage: this.getImageStorage(),
      fileFilter: this.imageFileFilter,
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB per file
        files: 10, // 最多10个文件
      }
    }).array('files', 10);
  }
  
  /**
   * 处理多文件上传
   */
  async handleMultipleImagesUpload(req, res) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: '未上传文件' });
      }
      
      const fileInfos = req.files.map(file => ({
        url: `/uploads/images/${req.body.type || 'product'}/${file.filename}`,
        filename: file.filename,
        size: file.size,
        mimeType: file.mimetype,
      }));
      
      logger.info(`多图上传成功，共 ${req.files.length} 个文件`);
      res.json(fileInfos);
    } catch (error) {
      logger.error('多图上传失败:', error);
      res.status(500).json({ error: error.message || '多图上传失败' });
    }
  }
}

module.exports = new FileUploadController();