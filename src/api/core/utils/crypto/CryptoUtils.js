/**
 * 加密工具
 * 提供高级加密和安全处理功能
 */

const crypto = require('crypto');
const { EventEmitter } = require('events');
const { logger } = require('../logger');
const { logContext } = require('../logger/LogContext');
const { performanceUtils } = require('../performance');
const { typeUtils } = require('../type');
const { stringUtils } = require('../string');

/**
 * 加密算法枚举
 */
const CryptoAlgorithm = {
  // 对称加密算法
  AES_256_CBC: 'aes-256-cbc',
  AES_256_GCM: 'aes-256-gcm',
  AES_192_CBC: 'aes-192-cbc',
  AES_128_CBC: 'aes-128-cbc',
  DES: 'des',
  3DES: 'des-ede3',
  // 非对称加密算法
  RSA: 'rsa',
  RSA_OAEP: 'rsa-oaep',
  // 哈希算法
  SHA256: 'sha256',
  SHA512: 'sha512',
  SHA1: 'sha1',
  MD5: 'md5',
  // HMAC算法
  HMAC_SHA256: 'sha256',
  HMAC_SHA512: 'sha512',
  // 签名算法
  RSA_SHA256: 'RSA-SHA256',
  RSA_SHA512: 'RSA-SHA512'
};

/**
 * 编码格式枚举
 */
const EncodingFormat = {
  BASE64: 'base64',
  BASE64URL: 'base64url',
  HEX: 'hex',
  UTF8: 'utf8',
  BINARY: 'binary'
};

/**
 * 密钥长度枚举（位）
 */
const KeyLength = {
  AES_128: 128,
  AES_192: 192,
  AES_256: 256,
  RSA_2048: 2048,
  RSA_4096: 4096
};

/**
 * 加密工具类
 * 提供高级加密、解密、哈希和安全处理功能
 */
class CryptoUtils extends EventEmitter {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   */
  constructor(options = {}) {
    super();

    this.options = {
      defaultAlgorithm: options.defaultAlgorithm || CryptoAlgorithm.AES_256_GCM,
      defaultHashAlgorithm: options.defaultHashAlgorithm || CryptoAlgorithm.SHA256,
      defaultEncoding: options.defaultEncoding || EncodingFormat.HEX,
      defaultKeyLength: options.defaultKeyLength || KeyLength.AES_256,
      ...options
    };

    // 统计信息
    this.stats = {
      encryptOperations: 0,
      decryptOperations: 0,
      hashOperations: 0,
      hmacOperations: 0,
      signOperations: 0,
      verifyOperations: 0,
      keyGenerations: 0,
      errors: 0
    };

    // 设置最大监听器
    this.setMaxListeners(50);

    logger.debug('加密工具初始化完成', {
      defaultAlgorithm: this.options.defaultAlgorithm,
      defaultHashAlgorithm: this.options.defaultHashAlgorithm
    });
  }

  /**
   * 生成随机密钥
   * @param {number} length - 密钥长度（位）
   * @param {string} encoding - 输出编码
   * @returns {string|Buffer} 随机密钥
   */
  generateKey(length = this.options.defaultKeyLength, encoding = this.options.defaultEncoding) {
    const startTime = performance.now();

    try {
      // 转换长度为字节
      const byteLength = Math.ceil(length / 8);
      
      // 生成随机字节
      const key = crypto.randomBytes(byteLength);
      
      // 更新统计信息
      this.stats.keyGenerations++;

      const duration = performance.now() - startTime;
      performanceUtils.recordTimer('crypto.generateKey', duration);

      logger.debug('生成随机密钥成功', {
        length,
        encoding,
        duration,
        requestId: logContext.getRequestId()
      });

      // 根据编码返回
      return encoding ? key.toString(encoding) : key;
    } catch (error) {
      this._handleError('generateKey', error);
      throw error;
    }
  }

  /**
   * 生成随机IV（初始化向量）
   * @param {string} algorithm - 加密算法
   * @param {string} encoding - 输出编码
   * @returns {string|Buffer} 随机IV
   */
  generateIV(algorithm = this.options.defaultAlgorithm, encoding = this.options.defaultEncoding) {
    const startTime = performance.now();

    try {
      // 获取算法所需的IV长度
      const ivLength = this._getIVLength(algorithm);
      
      // 生成随机字节
      const iv = crypto.randomBytes(ivLength);

      const duration = performance.now() - startTime;
      performanceUtils.recordTimer('crypto.generateIV', duration);

      logger.debug('生成随机IV成功', {
        algorithm,
        length: ivLength * 8,
        encoding,
        duration,
        requestId: logContext.getRequestId()
      });

      // 根据编码返回
      return encoding ? iv.toString(encoding) : iv;
    } catch (error) {
      this._handleError('generateIV', error);
      throw error;
    }
  }

  /**
   * 加密数据
   * @param {string|Buffer} data - 要加密的数据
   * @param {string|Buffer} key - 加密密钥
   * @param {Object} options - 加密选项
   * @returns {Object} 加密结果
   */
  encrypt(data, key, options = {}) {
    const startTime = performance.now();

    try {
      const algorithm = options.algorithm || this.options.defaultAlgorithm;
      const encoding = options.encoding || this.options.defaultEncoding;
      
      // 确保数据和密钥是Buffer
      const dataBuffer = this._toBuffer(data);
      const keyBuffer = this._toBuffer(key);
      
      // 生成IV
      const iv = options.iv ? this._toBuffer(options.iv) : this.generateIV(algorithm, null);
      
      let cipher;
      let encrypted;
      let authTag = null;
      
      // 根据算法类型进行加密
      if (algorithm.includes('gcm')) {
        // GCM模式需要额外的认证标签
        cipher = crypto.createCipheriv(algorithm, keyBuffer, iv);
        encrypted = Buffer.concat([cipher.update(dataBuffer), cipher.final()]);
        authTag = cipher.getAuthTag();
      } else {
        // CBC等其他模式
        cipher = crypto.createCipheriv(algorithm, keyBuffer, iv);
        encrypted = Buffer.concat([cipher.update(dataBuffer), cipher.final()]);
      }
      
      // 更新统计信息
      this.stats.encryptOperations++;

      const duration = performance.now() - startTime;
      performanceUtils.recordTimer('crypto.encrypt', duration);

      logger.debug('加密数据成功', {
        algorithm,
        dataSize: dataBuffer.length,
        encryptedSize: encrypted.length,
        duration,
        requestId: logContext.getRequestId()
      });

      this.emit('crypto.encrypt', {
        algorithm,
        dataSize: dataBuffer.length,
        encryptedSize: encrypted.length
      });

      // 根据编码返回结果
      return {
        encrypted: encoding ? encrypted.toString(encoding) : encrypted,
        iv: encoding ? iv.toString(encoding) : iv,
        authTag: authTag ? (encoding ? authTag.toString(encoding) : authTag) : null,
        algorithm
      };
    } catch (error) {
      this._handleError('encrypt', error);
      throw error;
    }
  }

  /**
   * 解密数据
   * @param {string|Buffer} encryptedData - 加密数据
   * @param {string|Buffer} key - 解密密钥
   * @param {string|Buffer} iv - 初始化向量
   * @param {Object} options - 解密选项
   * @returns {string|Buffer} 解密后的数据
   */
  decrypt(encryptedData, key, iv, options = {}) {
    const startTime = performance.now();

    try {
      const algorithm = options.algorithm || this.options.defaultAlgorithm;
      const encoding = options.encoding || this.options.defaultEncoding;
      const outputEncoding = options.outputEncoding || EncodingFormat.UTF8;
      
      // 确保数据、密钥和IV是Buffer
      const encryptedBuffer = this._toBuffer(encryptedData);
      const keyBuffer = this._toBuffer(key);
      const ivBuffer = this._toBuffer(iv);
      
      let decipher;
      let decrypted;
      
      // 根据算法类型进行解密
      if (algorithm.includes('gcm') && options.authTag) {
        // GCM模式需要认证标签
        const authTagBuffer = this._toBuffer(options.authTag);
        decipher = crypto.createDecipheriv(algorithm, keyBuffer, ivBuffer);
        decipher.setAuthTag(authTagBuffer);
        decrypted = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
      } else {
        // CBC等其他模式
        decipher = crypto.createDecipheriv(algorithm, keyBuffer, ivBuffer);
        decrypted = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
      }
      
      // 更新统计信息
      this.stats.decryptOperations++;

      const duration = performance.now() - startTime;
      performanceUtils.recordTimer('crypto.decrypt', duration);

      logger.debug('解密数据成功', {
        algorithm,
        encryptedSize: encryptedBuffer.length,
        decryptedSize: decrypted.length,
        duration,
        requestId: logContext.getRequestId()
      });

      this.emit('crypto.decrypt', {
        algorithm,
        encryptedSize: encryptedBuffer.length,
        decryptedSize: decrypted.length
      });

      // 根据输出编码返回
      return outputEncoding ? decrypted.toString(outputEncoding) : decrypted;
    } catch (error) {
      this._handleError('decrypt', error);
      throw error;
    }
  }

  /**
   * 计算数据哈希
   * @param {string|Buffer} data - 要哈希的数据
   * @param {Object} options - 哈希选项
   * @returns {string|Buffer} 哈希值
   */
  hash(data, options = {}) {
    const startTime = performance.now();

    try {
      const algorithm = options.algorithm || this.options.defaultHashAlgorithm;
      const encoding = options.encoding || this.options.defaultEncoding;
      
      // 确保数据是Buffer
      const dataBuffer = this._toBuffer(data);
      
      // 创建哈希对象
      const hash = crypto.createHash(algorithm);
      
      // 更新哈希
      hash.update(dataBuffer);
      
      // 获取哈希结果
      const hashResult = hash.digest(encoding);
      
      // 更新统计信息
      this.stats.hashOperations++;

      const duration = performance.now() - startTime;
      performanceUtils.recordTimer('crypto.hash', duration);

      logger.debug('计算哈希成功', {
        algorithm,
        dataSize: dataBuffer.length,
        duration,
        requestId: logContext.getRequestId()
      });

      this.emit('crypto.hash', {
        algorithm,
        dataSize: dataBuffer.length
      });

      return hashResult;
    } catch (error) {
      this._handleError('hash', error);
      throw error;
    }
  }

  /**
   * 计算HMAC
   * @param {string|Buffer} data - 要签名的数据
   * @param {string|Buffer} key - HMAC密钥
   * @param {Object} options - HMAC选项
   * @returns {string|Buffer} HMAC值
   */
  hmac(data, key, options = {}) {
    const startTime = performance.now();

    try {
      const algorithm = options.algorithm || CryptoAlgorithm.HMAC_SHA256;
      const encoding = options.encoding || this.options.defaultEncoding;
      
      // 确保数据和密钥是Buffer
      const dataBuffer = this._toBuffer(data);
      const keyBuffer = this._toBuffer(key);
      
      // 创建HMAC对象
      const hmac = crypto.createHmac(algorithm, keyBuffer);
      
      // 更新HMAC
      hmac.update(dataBuffer);
      
      // 获取HMAC结果
      const hmacResult = hmac.digest(encoding);
      
      // 更新统计信息
      this.stats.hmacOperations++;

      const duration = performance.now() - startTime;
      performanceUtils.recordTimer('crypto.hmac', duration);

      logger.debug('计算HMAC成功', {
        algorithm,
        dataSize: dataBuffer.length,
        duration,
        requestId: logContext.getRequestId()
      });

      this.emit('crypto.hmac', {
        algorithm,
        dataSize: dataBuffer.length
      });

      return hmacResult;
    } catch (error) {
      this._handleError('hmac', error);
      throw error;
    }
  }

  /**
   * 生成RSA密钥对
   * @param {Object} options - 密钥生成选项
   * @returns {Object} 包含公钥和私钥的对象
   */
  async generateKeyPair(options = {}) {
    const startTime = performance.now();

    try {
      const modulusLength = options.modulusLength || KeyLength.RSA_2048;
      const publicKeyEncoding = options.publicKeyEncoding || {
        type: 'spki',
        format: 'pem'
      };
      const privateKeyEncoding = options.privateKeyEncoding || {
        type: 'pkcs8',
        format: 'pem',
        cipher: 'aes-256-cbc',
        passphrase: options.passphrase || ''
      };

      // 生成密钥对
      const keyPair = await new Promise((resolve, reject) => {
        crypto.generateKeyPair(
          'rsa',
          {
            modulusLength,
            publicKeyEncoding,
            privateKeyEncoding
          },
          (err, publicKey, privateKey) => {
            if (err) reject(err);
            else resolve({ publicKey, privateKey });
          }
        );
      });

      // 更新统计信息
      this.stats.keyGenerations++;

      const duration = performance.now() - startTime;
      performanceUtils.recordTimer('crypto.generateKeyPair', duration);

      logger.info('生成RSA密钥对成功', {
        modulusLength,
        duration,
        requestId: logContext.getRequestId()
      });

      this.emit('crypto.keyPairGenerated', {
        modulusLength
      });

      return keyPair;
    } catch (error) {
      this._handleError('generateKeyPair', error);
      throw error;
    }
  }

  /**
   * 使用私钥签名数据
   * @param {string|Buffer} data - 要签名的数据
   * @param {string|Buffer} privateKey - 私钥
   * @param {Object} options - 签名选项
   * @returns {string|Buffer} 签名数据
   */
  sign(data, privateKey, options = {}) {
    const startTime = performance.now();

    try {
      const algorithm = options.algorithm || CryptoAlgorithm.RSA_SHA256;
      const encoding = options.encoding || this.options.defaultEncoding;
      const passphrase = options.passphrase;
      
      // 确保数据是Buffer
      const dataBuffer = this._toBuffer(data);
      
      // 创建签名对象
      const sign = crypto.createSign(algorithm);
      
      // 更新签名
      sign.update(dataBuffer);
      
      // 获取签名结果
      const signature = sign.sign(
        { key: privateKey, passphrase },
        encoding
      );
      
      // 更新统计信息
      this.stats.signOperations++;

      const duration = performance.now() - startTime;
      performanceUtils.recordTimer('crypto.sign', duration);

      logger.debug('签名数据成功', {
        algorithm,
        dataSize: dataBuffer.length,
        duration,
        requestId: logContext.getRequestId()
      });

      this.emit('crypto.sign', {
        algorithm,
        dataSize: dataBuffer.length
      });

      return signature;
    } catch (error) {
      this._handleError('sign', error);
      throw error;
    }
  }

  /**
   * 使用公钥验证签名
   * @param {string|Buffer} data - 原始数据
   * @param {string|Buffer} signature - 签名数据
   * @param {string|Buffer} publicKey - 公钥
   * @param {Object} options - 验证选项
   * @returns {boolean} 验证结果
   */
  verify(data, signature, publicKey, options = {}) {
    const startTime = performance.now();

    try {
      const algorithm = options.algorithm || CryptoAlgorithm.RSA_SHA256;
      const signatureEncoding = options.signatureEncoding || this.options.defaultEncoding;
      
      // 确保数据和签名是Buffer
      const dataBuffer = this._toBuffer(data);
      const signatureBuffer = this._toBuffer(signature, signatureEncoding);
      
      // 创建验证对象
      const verify = crypto.createVerify(algorithm);
      
      // 更新验证
      verify.update(dataBuffer);
      
      // 验证签名
      const isValid = verify.verify(publicKey, signatureBuffer);
      
      // 更新统计信息
      this.stats.verifyOperations++;

      const duration = performance.now() - startTime;
      performanceUtils.recordTimer('crypto.verify', duration);

      logger.debug('验证签名结果', {
        algorithm,
        dataSize: dataBuffer.length,
        valid: isValid,
        duration,
        requestId: logContext.getRequestId()
      });

      this.emit('crypto.verify', {
        algorithm,
        dataSize: dataBuffer.length,
        valid: isValid
      });

      return isValid;
    } catch (error) {
      this._handleError('verify', error);
      throw error;
    }
  }

  /**
   * 加密文件
   * @param {string} inputPath - 输入文件路径
   * @param {string} outputPath - 输出文件路径
   * @param {string|Buffer} key - 加密密钥
   * @param {Object} options - 加密选项
   * @returns {Promise<Object>} 加密结果
   */
  async encryptFile(inputPath, outputPath, key, options = {}) {
    const startTime = performance.now();
    
    try {
      // 导入fs模块
      const fs = require('fs').promises;
      const path = require('path');
      
      // 读取输入文件
      const data = await fs.readFile(inputPath);
      
      // 加密数据
      const result = this.encrypt(data, key, options);
      
      // 确保输出目录存在
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      
      // 写入加密数据
      const encryptedData = result.authTag
        ? Buffer.concat([
            Buffer.from(result.iv, options.encoding || EncodingFormat.HEX),
            result.authTag,
            Buffer.from(result.encrypted, options.encoding || EncodingFormat.HEX)
          ])
        : Buffer.concat([
            Buffer.from(result.iv, options.encoding || EncodingFormat.HEX),
            Buffer.from(result.encrypted, options.encoding || EncodingFormat.HEX)
          ]);
      
      await fs.writeFile(outputPath, encryptedData);
      
      const duration = performance.now() - startTime;
      performanceUtils.recordTimer('crypto.encryptFile', duration);

      logger.info('加密文件成功', {
        inputPath,
        outputPath,
        dataSize: data.length,
        encryptedSize: encryptedData.length,
        duration,
        requestId: logContext.getRequestId()
      });

      this.emit('crypto.encryptFile', {
        inputPath,
        outputPath,
        dataSize: data.length,
        encryptedSize: encryptedData.length
      });

      return {
        ...result,
        inputPath,
        outputPath,
        originalSize: data.length,
        encryptedSize: encryptedData.length
      };
    } catch (error) {
      this._handleError('encryptFile', error, { inputPath, outputPath });
      throw error;
    }
  }

  /**
   * 解密文件
   * @param {string} inputPath - 输入文件路径
   * @param {string} outputPath - 输出文件路径
   * @param {string|Buffer} key - 解密密钥
   * @param {Object} options - 解密选项
   * @returns {Promise<Object>} 解密结果
   */
  async decryptFile(inputPath, outputPath, key, options = {}) {
    const startTime = performance.now();
    
    try {
      // 导入fs模块
      const fs = require('fs').promises;
      const path = require('path');
      
      // 读取加密文件
      const encryptedData = await fs.readFile(inputPath);
      
      // 获取算法和IV长度
      const algorithm = options.algorithm || this.options.defaultAlgorithm;
      const ivLength = this._getIVLength(algorithm);
      
      // 提取IV和加密数据
      let iv, authTag, encryptedContent;
      
      if (algorithm.includes('gcm')) {
        // GCM模式，需要提取认证标签
        iv = encryptedData.slice(0, ivLength);
        authTag = encryptedData.slice(ivLength, ivLength + 16); // GCM auth tag is 16 bytes
        encryptedContent = encryptedData.slice(ivLength + 16);
      } else {
        // 其他模式
        iv = encryptedData.slice(0, ivLength);
        encryptedContent = encryptedData.slice(ivLength);
      }
      
      // 解密数据
      const optionsWithIV = {
        ...options,
        iv,
        ...(authTag ? { authTag } : {})
      };
      
      const decryptedData = this.decrypt(encryptedContent, key, iv, { ...optionsWithIV, outputEncoding: null });
      
      // 确保输出目录存在
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      
      // 写入解密数据
      await fs.writeFile(outputPath, decryptedData);
      
      const duration = performance.now() - startTime;
      performanceUtils.recordTimer('crypto.decryptFile', duration);

      logger.info('解密文件成功', {
        inputPath,
        outputPath,
        encryptedSize: encryptedData.length,
        decryptedSize: decryptedData.length,
        duration,
        requestId: logContext.getRequestId()
      });

      this.emit('crypto.decryptFile', {
        inputPath,
        outputPath,
        encryptedSize: encryptedData.length,
        decryptedSize: decryptedData.length
      });

      return {
        inputPath,
        outputPath,
        encryptedSize: encryptedData.length,
        decryptedSize: decryptedData.length
      };
    } catch (error) {
      this._handleError('decryptFile', error, { inputPath, outputPath });
      throw error;
    }
  }

  /**
   * 加密流
   * @param {stream.Readable} inputStream - 输入流
   * @param {stream.Writable} outputStream - 输出流
   * @param {string|Buffer} key - 加密密钥
   * @param {Object} options - 加密选项
   * @returns {Promise<Object>} 加密结果
   */
  async encryptStream(inputStream, outputStream, key, options = {}) {
    const startTime = performance.now();

    try {
      const algorithm = options.algorithm || this.options.defaultAlgorithm;
      
      // 生成IV
      const iv = this.generateIV(algorithm, null);
      
      // 创建加密流
      const cipher = crypto.createCipheriv(algorithm, this._toBuffer(key), iv);
      
      // 首先写入IV
      outputStream.write(iv);
      
      // 管道连接
      inputStream.pipe(cipher).pipe(outputStream);
      
      // 等待完成
      await new Promise((resolve, reject) => {
        outputStream.on('finish', resolve);
        outputStream.on('error', reject);
        inputStream.on('error', reject);
        cipher.on('error', reject);
      });
      
      const duration = performance.now() - startTime;
      performanceUtils.recordTimer('crypto.encryptStream', duration);

      logger.info('加密流成功', {
        algorithm,
        duration,
        requestId: logContext.getRequestId()
      });

      this.emit('crypto.encryptStream', {
        algorithm,
        duration
      });

      return {
        algorithm,
        iv: iv.toString(this.options.defaultEncoding)
      };
    } catch (error) {
      this._handleError('encryptStream', error);
      throw error;
    }
  }

  /**
   * 解密流
   * @param {stream.Readable} inputStream - 输入流
   * @param {stream.Writable} outputStream - 输出流
   * @param {string|Buffer} key - 解密密钥
   * @param {Object} options - 解密选项
   * @returns {Promise<Object>} 解密结果
   */
  async decryptStream(inputStream, outputStream, key, options = {}) {
    const startTime = performance.now();

    try {
      const algorithm = options.algorithm || this.options.defaultAlgorithm;
      const ivLength = this._getIVLength(algorithm);
      
      // 读取IV
      const iv = await this._readIVFromStream(inputStream, ivLength);
      
      // 创建解密流
      const decipher = crypto.createDecipheriv(algorithm, this._toBuffer(key), iv);
      
      // 管道连接
      inputStream.pipe(decipher).pipe(outputStream);
      
      // 等待完成
      await new Promise((resolve, reject) => {
        outputStream.on('finish', resolve);
        outputStream.on('error', reject);
        inputStream.on('error', reject);
        decipher.on('error', reject);
      });
      
      const duration = performance.now() - startTime;
      performanceUtils.recordTimer('crypto.decryptStream', duration);

      logger.info('解密流成功', {
        algorithm,
        duration,
        requestId: logContext.getRequestId()
      });

      this.emit('crypto.decryptStream', {
        algorithm,
        duration
      });

      return {
        algorithm
      };
    } catch (error) {
      this._handleError('decryptStream', error);
      throw error;
    }
  }

  /**
   * 安全地比较两个值（防止时序攻击）
   * @param {string|Buffer} a - 第一个值
   * @param {string|Buffer} b - 第二个值
   * @returns {boolean} 是否相等
   */
  timingSafeEqual(a, b) {
    try {
      const bufferA = this._toBuffer(a);
      const bufferB = this._toBuffer(b);
      
      // 如果长度不同，直接返回false
      if (bufferA.length !== bufferB.length) {
        return false;
      }
      
      // 使用crypto的timingSafeEqual方法
      return crypto.timingSafeEqual(bufferA, bufferB);
    } catch (error) {
      this._handleError('timingSafeEqual', error);
      return false;
    }
  }

  /**
   * 从流中读取IV
   * @param {stream.Readable} stream - 输入流
   * @param {number} ivLength - IV长度
   * @returns {Promise<Buffer>} IV缓冲区
   * @private
   */
  async _readIVFromStream(stream, ivLength) {
    return new Promise((resolve, reject) => {
      const ivChunks = [];
      let bytesRead = 0;
      
      const onData = (chunk) => {
        ivChunks.push(chunk);
        bytesRead += chunk.length;
        
        if (bytesRead >= ivLength) {
          // 移除事件监听器
          stream.removeListener('data', onData);
          stream.removeListener('error', onError);
          
          // 合并并截取IV
          const ivBuffer = Buffer.concat(ivChunks);
          const iv = ivBuffer.slice(0, ivLength);
          
          // 如果有剩余数据，放回流中
          if (ivBuffer.length > ivLength) {
            const remaining = ivBuffer.slice(ivLength);
            stream.unshift(remaining);
          }
          
          resolve(iv);
        }
      };
      
      const onError = (error) => {
        stream.removeListener('data', onData);
        stream.removeListener('error', onError);
        reject(error);
      };
      
      stream.on('data', onData);
      stream.on('error', onError);
    });
  }

  /**
   * 获取算法的IV长度
   * @param {string} algorithm - 加密算法
   * @returns {number} IV长度（字节）
   * @private
   */
  _getIVLength(algorithm) {
    // 根据算法返回对应的IV长度
    if (algorithm.includes('aes-256')) {
      return 16; // AES-256的IV长度为16字节
    } else if (algorithm.includes('aes-192')) {
      return 16; // AES-192的IV长度为16字节
    } else if (algorithm.includes('aes-128')) {
      return 16; // AES-128的IV长度为16字节
    } else if (algorithm.includes('des')) {
      return 8; // DES的IV长度为8字节
    } else {
      return 16; // 默认使用16字节
    }
  }

  /**
   * 将数据转换为Buffer
   * @param {string|Buffer} data - 要转换的数据
   * @param {string} encoding - 如果是字符串，指定其编码
   * @returns {Buffer} 转换后的Buffer
   * @private
   */
  _toBuffer(data, encoding = null) {
    if (Buffer.isBuffer(data)) {
      return data;
    }
    
    if (typeof data === 'string') {
      return encoding ? Buffer.from(data, encoding) : Buffer.from(data);
    }
    
    throw new Error('数据必须是字符串或Buffer');
  }

  /**
   * 处理错误
   * @param {string} operation - 操作类型
   * @param {Error} error - 错误对象
   * @param {Object} context - 上下文信息
   * @private
   */
  _handleError(operation, error, context = {}) {
    this.stats.errors++;
    
    logger.error(`加密操作失败: ${operation}`, {
      error: error.message,
      ...context,
      requestId: logContext.getRequestId()
    });
    
    this.emit('crypto.error', { operation, error, context });
  }

  /**
   * 获取统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * 重置统计信息
   */
  resetStats() {
    this.stats = {
      encryptOperations: 0,
      decryptOperations: 0,
      hashOperations: 0,
      hmacOperations: 0,
      signOperations: 0,
      verifyOperations: 0,
      keyGenerations: 0,
      errors: 0
    };
    
    logger.debug('加密工具统计信息已重置');
  }

  /**
   * 静态实例
   * @private
   */
  static _instance = null;

  /**
   * 获取单例实例
   * @param {Object} options - 配置选项
   * @returns {CryptoUtils} 加密工具实例
   */
  static getInstance(options = {}) {
    if (!CryptoUtils._instance) {
      CryptoUtils._instance = new CryptoUtils(options);
    }
    return CryptoUtils._instance;
  }

  /**
   * 创建新的加密工具实例
   * @param {Object} options - 配置选项
   * @returns {CryptoUtils} 加密工具实例
   */
  static create(options = {}) {
    return new CryptoUtils(options);
  }
}

// 创建默认实例
const defaultCryptoUtils = CryptoUtils.getInstance();

module.exports = {
  CryptoUtils,
  cryptoUtils: defaultCryptoUtils,
  CryptoAlgorithm,
  EncodingFormat,
  KeyLength
};