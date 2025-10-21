/**
 * 文件操作工具类
 * 提供文件读写、目录操作、文件监控等功能
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { AppError } = require('../../exception/handlers/errorHandler');
const { CommonUtils } = require('../CommonUtils');
const logger = require('../logger');

/**
 * 文件操作工具类
 */
class FileUtils {
  /**
   * 读取文件内容
   * @param {string} filePath - 文件路径
   * @param {Object} options - 读取选项
   * @returns {Promise<string|Buffer>} 文件内容
   */
  static async readFile(filePath, options = {}) {
    try {
      const content = await fs.readFile(filePath, options);
      logger.debug(`文件读取成功: ${filePath}`);
      return content;
    } catch (error) {
      logger.error(`文件读取失败: ${filePath}`, { error });
      throw new AppError(`读取文件失败: ${filePath}`, 500, error);
    }
  }

  /**
   * 写入文件内容
   * @param {string} filePath - 文件路径
   * @param {string|Buffer} content - 文件内容
   * @param {Object} options - 写入选项
   * @returns {Promise<void>}
   */
  static async writeFile(filePath, content, options = {}) {
    try {
      // 确保目录存在
      await this.ensureDir(path.dirname(filePath));
      
      await fs.writeFile(filePath, content, options);
      logger.debug(`文件写入成功: ${filePath}`);
    } catch (error) {
      logger.error(`文件写入失败: ${filePath}`, { error });
      throw new AppError(`写入文件失败: ${filePath}`, 500, error);
    }
  }

  /**
   * 追加内容到文件
   * @param {string} filePath - 文件路径
   * @param {string|Buffer} content - 要追加的内容
   * @param {Object} options - 追加选项
   * @returns {Promise<void>}
   */
  static async appendFile(filePath, content, options = {}) {
    try {
      // 确保目录存在
      await this.ensureDir(path.dirname(filePath));
      
      await fs.appendFile(filePath, content, options);
      logger.debug(`内容追加成功: ${filePath}`);
    } catch (error) {
      logger.error(`内容追加失败: ${filePath}`, { error });
      throw new AppError(`追加文件失败: ${filePath}`, 500, error);
    }
  }

  /**
   * 复制文件
   * @param {string} srcPath - 源文件路径
   * @param {string} destPath - 目标文件路径
   * @param {Object} options - 复制选项
   * @returns {Promise<void>}
   */
  static async copyFile(srcPath, destPath, options = {}) {
    try {
      // 确保目标目录存在
      await this.ensureDir(path.dirname(destPath));
      
      await fs.copyFile(srcPath, destPath, options);
      logger.debug(`文件复制成功: ${srcPath} -> ${destPath}`);
    } catch (error) {
      logger.error(`文件复制失败: ${srcPath} -> ${destPath}`, { error });
      throw new AppError(`复制文件失败: ${srcPath} -> ${destPath}`, 500, error);
    }
  }

  /**
   * 移动文件
   * @param {string} oldPath - 原文件路径
   * @param {string} newPath - 新文件路径
   * @returns {Promise<void>}
   */
  static async moveFile(oldPath, newPath) {
    try {
      // 确保目标目录存在
      await this.ensureDir(path.dirname(newPath));
      
      await fs.rename(oldPath, newPath);
      logger.debug(`文件移动成功: ${oldPath} -> ${newPath}`);
    } catch (error) {
      // 如果跨设备重命名失败，尝试复制后删除
      if (error.code === 'EXDEV') {
        await this.copyFile(oldPath, newPath);
        await this.deleteFile(oldPath);
      } else {
        logger.error(`文件移动失败: ${oldPath} -> ${newPath}`, { error });
        throw new AppError(`移动文件失败: ${oldPath} -> ${newPath}`, 500, error);
      }
    }
  }

  /**
   * 删除文件
   * @param {string} filePath - 文件路径
   * @returns {Promise<void>}
   */
  static async deleteFile(filePath) {
    try {
      await fs.unlink(filePath);
      logger.debug(`文件删除成功: ${filePath}`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // 文件不存在，忽略错误
        logger.debug(`文件不存在，跳过删除: ${filePath}`);
        return;
      }
      logger.error(`文件删除失败: ${filePath}`, { error });
      throw new AppError(`删除文件失败: ${filePath}`, 500, error);
    }
  }

  /**
   * 删除多个文件
   * @param {Array<string>} filePaths - 文件路径数组
   * @returns {Promise<void>}
   */
  static async deleteFiles(filePaths) {
    await Promise.all(filePaths.map(path => this.deleteFile(path)));
  }

  /**
   * 检查文件是否存在
   * @param {string} filePath - 文件路径
   * @returns {Promise<boolean>} 是否存在
   */
  static async fileExists(filePath) {
    try {
      await fs.access(filePath, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 检查文件是否可读写
   * @param {string} filePath - 文件路径
   * @returns {Promise<boolean>} 是否可读写
   */
  static async isFileReadable(filePath) {
    try {
      await fs.access(filePath, fs.constants.R_OK);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 检查文件是否可写
   * @param {string} filePath - 文件路径
   * @returns {Promise<boolean>} 是否可写
   */
  static async isFileWritable(filePath) {
    try {
      await fs.access(filePath, fs.constants.W_OK);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取文件状态
   * @param {string} filePath - 文件路径
   * @returns {Promise<Object>} 文件状态信息
   */
  static async getFileStats(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return {
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
        size: stats.size,
        createdAt: stats.birthtime || stats.ctime,
        modifiedAt: stats.mtime,
        accessedAt: stats.atime,
        inode: stats.ino,
        mode: stats.mode
      };
    } catch (error) {
      logger.error(`获取文件状态失败: ${filePath}`, { error });
      throw new AppError(`获取文件状态失败: ${filePath}`, 500, error);
    }
  }

  /**
   * 获取文件大小
   * @param {string} filePath - 文件路径
   * @returns {Promise<number>} 文件大小（字节）
   */
  static async getFileSize(filePath) {
    const stats = await this.getFileStats(filePath);
    return stats.size;
  }

  /**
   * 创建目录
   * @param {string} dirPath - 目录路径
   * @param {Object} options - 创建选项
   * @returns {Promise<void>}
   */
  static async createDirectory(dirPath, options = {}) {
    try {
      await fs.mkdir(dirPath, { recursive: options.recursive !== false, ...options });
      logger.debug(`目录创建成功: ${dirPath}`);
    } catch (error) {
      logger.error(`目录创建失败: ${dirPath}`, { error });
      throw new AppError(`创建目录失败: ${dirPath}`, 500, error);
    }
  }

  /**
   * 确保目录存在
   * @param {string} dirPath - 目录路径
   * @returns {Promise<void>}
   */
  static async ensureDir(dirPath) {
    return this.createDirectory(dirPath, { recursive: true });
  }

  /**
   * 删除目录
   * @param {string} dirPath - 目录路径
   * @returns {Promise<void>}
   */
  static async deleteDirectory(dirPath) {
    try {
      // 检查目录是否存在
      if (!await this.directoryExists(dirPath)) {
        logger.debug(`目录不存在，跳过删除: ${dirPath}`);
        return;
      }

      // 递归删除目录内容
      const files = await this.readDirectory(dirPath);
      
      for (const file of files) {
        const fullPath = path.join(dirPath, file.name);
        if (file.isDirectory) {
          await this.deleteDirectory(fullPath);
        } else {
          await this.deleteFile(fullPath);
        }
      }

      // 删除空目录
      await fs.rmdir(dirPath);
      logger.debug(`目录删除成功: ${dirPath}`);
    } catch (error) {
      logger.error(`目录删除失败: ${dirPath}`, { error });
      throw new AppError(`删除目录失败: ${dirPath}`, 500, error);
    }
  }

  /**
   * 检查目录是否存在
   * @param {string} dirPath - 目录路径
   * @returns {Promise<boolean>} 是否存在
   */
  static async directoryExists(dirPath) {
    try {
      const stats = await fs.stat(dirPath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * 读取目录内容
   * @param {string} dirPath - 目录路径
   * @param {Object} options - 读取选项
   * @returns {Promise<Array>} 目录内容列表
   */
  static async readDirectory(dirPath, options = {}) {
    try {
      const files = await fs.readdir(dirPath, { withFileTypes: true });
      
      return files.map(file => ({
        name: file.name,
        isDirectory: file.isDirectory(),
        isFile: file.isFile(),
        isSymbolicLink: file.isSymbolicLink(),
        path: path.join(dirPath, file.name)
      }));
    } catch (error) {
      logger.error(`读取目录失败: ${dirPath}`, { error });
      throw new AppError(`读取目录失败: ${dirPath}`, 500, error);
    }
  }

  /**
   * 递归读取目录内容
   * @param {string} dirPath - 目录路径
   * @param {Object} options - 读取选项
   * @returns {Promise<Array>} 目录内容列表
   */
  static async readDirectoryRecursive(dirPath, options = {}) {
    const results = [];
    const visited = new Set();

    async function traverse(currentPath) {
      // 避免循环引用
      if (visited.has(currentPath)) {
        return;
      }
      visited.add(currentPath);

      const entries = await this.readDirectory(currentPath);
      
      for (const entry of entries) {
        results.push({
          ...entry,
          relativePath: path.relative(dirPath, entry.path)
        });

        if (entry.isDirectory) {
          await traverse.call(this, entry.path);
        }
      }
    }

    await traverse.call(this, dirPath);
    return results;
  }

  /**
   * 查找文件
   * @param {string} dirPath - 起始目录路径
   * @param {string|RegExp} pattern - 文件名匹配模式
   * @param {Object} options - 查找选项
   * @returns {Promise<Array>} 匹配的文件列表
   */
  static async findFiles(dirPath, pattern, options = {}) {
    const allFiles = await this.readDirectoryRecursive(dirPath, options);
    
    return allFiles.filter(file => {
      if (!file.isFile) return false;
      
      if (typeof pattern === 'string') {
        return file.name === pattern || file.name.includes(pattern);
      } else if (pattern instanceof RegExp) {
        return pattern.test(file.name);
      }
      
      return false;
    });
  }

  /**
   * 复制目录
   * @param {string} srcDir - 源目录路径
   * @param {string} destDir - 目标目录路径
   * @param {Object} options - 复制选项
   * @returns {Promise<void>}
   */
  static async copyDirectory(srcDir, destDir, options = {}) {
    // 确保源目录存在
    if (!await this.directoryExists(srcDir)) {
      throw new AppError(`源目录不存在: ${srcDir}`, 404);
    }

    // 确保目标目录存在
    await this.ensureDir(destDir);

    // 读取源目录内容
    const entries = await this.readDirectory(srcDir);

    // 并发复制所有内容
    await Promise.all(entries.map(async entry => {
      const srcPath = path.join(srcDir, entry.name);
      const destPath = path.join(destDir, entry.name);

      if (entry.isDirectory) {
        await this.copyDirectory(srcPath, destPath, options);
      } else {
        await this.copyFile(srcPath, destPath, options);
      }
    }));

    logger.debug(`目录复制成功: ${srcDir} -> ${destDir}`);
  }

  /**
   * 移动目录
   * @param {string} oldPath - 原目录路径
   * @param {string} newPath - 新目录路径
   * @returns {Promise<void>}
   */
  static async moveDirectory(oldPath, newPath) {
    try {
      // 确保目标目录的父目录存在
      await this.ensureDir(path.dirname(newPath));
      
      await fs.rename(oldPath, newPath);
      logger.debug(`目录移动成功: ${oldPath} -> ${newPath}`);
    } catch (error) {
      // 如果跨设备重命名失败，尝试复制后删除
      if (error.code === 'EXDEV') {
        await this.copyDirectory(oldPath, newPath);
        await this.deleteDirectory(oldPath);
      } else {
        logger.error(`目录移动失败: ${oldPath} -> ${newPath}`, { error });
        throw new AppError(`移动目录失败: ${oldPath} -> ${newPath}`, 500, error);
      }
    }
  }

  /**
   * 读取JSON文件
   * @param {string} filePath - 文件路径
   * @returns {Promise<Object>} JSON对象
   */
  static async readJsonFile(filePath) {
    const content = await this.readFile(filePath, 'utf8');
    try {
      return JSON.parse(content);
    } catch (error) {
      logger.error(`解析JSON文件失败: ${filePath}`, { error });
      throw new AppError(`解析JSON文件失败: ${filePath}`, 500, error);
    }
  }

  /**
   * 写入JSON文件
   * @param {string} filePath - 文件路径
   * @param {Object} data - 要写入的数据
   * @param {Object} options - 写入选项
   * @returns {Promise<void>}
   */
  static async writeJsonFile(filePath, data, options = {}) {
    const { pretty = true, ...writeOptions } = options;
    const content = pretty 
      ? JSON.stringify(data, null, 2)
      : JSON.stringify(data);
    
    await this.writeFile(filePath, content, writeOptions);
  }

  /**
   * 更新JSON文件中的数据
   * @param {string} filePath - 文件路径
   * @param {Function|Object} updater - 更新函数或要合并的数据
   * @returns {Promise<Object>} 更新后的JSON对象
   */
  static async updateJsonFile(filePath, updater) {
    // 读取现有数据
    let data = {};
    if (await this.fileExists(filePath)) {
      data = await this.readJsonFile(filePath);
    }

    // 执行更新
    if (typeof updater === 'function') {
      data = updater(data);
    } else {
      data = CommonUtils.merge(data, updater);
    }

    // 写回文件
    await this.writeJsonFile(filePath, data);
    return data;
  }

  /**
   * 监控文件变化
   * @param {string} filePath - 文件路径
   * @param {Function} callback - 变化回调函数
   * @param {Object} options - 监控选项
   * @returns {Object} 监控器对象
   */
  static watchFile(filePath, callback, options = {}) {
    const watchOptions = {
      persistent: true,
      interval: 5007, // 默认轮询间隔
      ...options
    };

    const watcher = fsSync.watchFile(filePath, watchOptions, (curr, prev) => {
      try {
        // 检查是否有实际变化
        if (curr.mtime !== prev.mtime) {
          callback({
            path: filePath,
            event: 'change',
            previousStat: prev,
            currentStat: curr
          });
        }
      } catch (error) {
        logger.error(`文件监控回调执行失败: ${filePath}`, { error });
      }
    });

    return {
      close: () => {
        fsSync.unwatchFile(filePath);
        logger.debug(`文件监控已停止: ${filePath}`);
      },
      ref: () => watcher.ref(),
      unref: () => watcher.unref()
    };
  }

  /**
   * 监控目录变化
   * @param {string} dirPath - 目录路径
   * @param {Function} callback - 变化回调函数
   * @param {Object} options - 监控选项
   * @returns {Object} 监控器对象
   */
  static watchDirectory(dirPath, callback, options = {}) {
    const watchOptions = {
      persistent: true,
      recursive: options.recursive || false,
      ...options
    };

    const watcher = fsSync.watch(dirPath, watchOptions, (eventType, filename) => {
      if (!filename) return;

      const fullPath = path.join(dirPath, filename);
      
      try {
        callback({
          path: fullPath,
          filename: filename,
          event: eventType, // 'rename' 或 'change'
          directory: dirPath
        });
      } catch (error) {
        logger.error(`目录监控回调执行失败: ${fullPath}`, { error });
      }
    });

    return {
      close: () => {
        watcher.close();
        logger.debug(`目录监控已停止: ${dirPath}`);
      },
      ref: () => watcher.ref(),
      unref: () => watcher.unref()
    };
  }

  /**
   * 获取文件扩展名
   * @param {string} filename - 文件名或路径
   * @returns {string} 扩展名（不含点）
   */
  static getExtension(filename) {
    const parts = path.basename(filename).split('.');
    return parts.length > 1 ? parts.pop().toLowerCase() : '';
  }

  /**
   * 获取文件名（不含扩展名）
   * @param {string} filename - 文件名或路径
   * @returns {string} 文件名
   */
  static getFileNameWithoutExtension(filename) {
    const baseName = path.basename(filename);
    const dotIndex = baseName.lastIndexOf('.');
    return dotIndex > 0 ? baseName.substring(0, dotIndex) : baseName;
  }

  /**
   * 生成临时文件路径
   * @param {string} prefix - 前缀
   * @param {string} extension - 扩展名
   * @param {string} directory - 目录
   * @returns {string} 临时文件路径
   */
  static generateTempFilePath(prefix = 'tmp', extension = '', directory = null) {
    const tempDir = directory || require('os').tmpdir();
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const ext = extension ? `.${extension.replace(/^\./, '')}` : '';
    
    return path.join(tempDir, `${prefix}_${timestamp}_${random}${ext}`);
  }

  /**
   * 创建临时文件
   * @param {Object} options - 选项
   * @returns {Promise<Object>} 临时文件信息
   */
  static async createTempFile(options = {}) {
    const {
      prefix = 'tmp',
      extension = '',
      content = '',
      directory = null
    } = options;

    const tempPath = this.generateTempFilePath(prefix, extension, directory);
    await this.writeFile(tempPath, content);
    
    return {
      path: tempPath,
      cleanup: async () => {
        await this.deleteFile(tempPath);
      }
    };
  }

  /**
   * 创建临时目录
   * @param {Object} options - 选项
   * @returns {Promise<Object>} 临时目录信息
   */
  static async createTempDirectory(options = {}) {
    const {
      prefix = 'tmp',
      directory = null
    } = options;

    const tempPath = this.generateTempFilePath(prefix, '', directory);
    await this.createDirectory(tempPath);
    
    return {
      path: tempPath,
      cleanup: async () => {
        await this.deleteDirectory(tempPath);
      }
    };
  }

  /**
   * 计算文件哈希值
   * @param {string} filePath - 文件路径
   * @param {string} algorithm - 哈希算法
   * @returns {Promise<string>} 哈希值
   */
  static async calculateFileHash(filePath, algorithm = 'sha256') {
    const crypto = require('crypto');
    const stream = fsSync.createReadStream(filePath);
    const hash = crypto.createHash(algorithm);

    return new Promise((resolve, reject) => {
      stream.on('error', reject);
      stream.on('data', chunk => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest('hex')));
    });
  }

  /**
   * 检查两个文件是否相同
   * @param {string} filePath1 - 第一个文件路径
   * @param {string} filePath2 - 第二个文件路径
   * @returns {Promise<boolean>} 是否相同
   */
  static async areFilesEqual(filePath1, filePath2) {
    try {
      const [stats1, stats2] = await Promise.all([
        this.getFileStats(filePath1),
        this.getFileStats(filePath2)
      ]);

      // 快速检查：大小不同则文件不同
      if (stats1.size !== stats2.size) {
        return false;
      }

      // 计算并比较哈希值
      const [hash1, hash2] = await Promise.all([
        this.calculateFileHash(filePath1),
        this.calculateFileHash(filePath2)
      ]);

      return hash1 === hash2;
    } catch (error) {
      logger.error(`比较文件失败: ${filePath1} 和 ${filePath2}`, { error });
      return false;
    }
  }
}

module.exports = FileUtils;