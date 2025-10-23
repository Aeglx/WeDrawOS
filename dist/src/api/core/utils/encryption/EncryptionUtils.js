/**
 * 加密工具类
 * 提供数据加密、解密、哈希计算和安全处理功能
 */

const crypto = require('crypto');
const logger = require('../logger');
const { AppError } = require('../../exception/handlers/errorHandler');

/**
 * 加密工具类
 */
class EncryptionUtils {
  constructor() {
    this.logger = logger;
    this.logger.info('加密工具初始化');
  }

  /**
   * 生成随机字符串
   * @param {number} length - 字符串长度
   * @param {string} charset - 字符集，默认包含大小写字母和数字
   * @returns {string} 随机字符串
   */
  generateRandomString(length = 32, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
    let result = '';
    const charsetLength = charset.length;
    
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charsetLength));
    }
    
    return result;
  }

  /**
   * 生成安全的随机数
   * @param {number} min - 最小值
   * @param {number} max - 最大值
   * @returns {number} 随机数
   */
  generateSecureRandom(min, max) {
    const range = max - min + 1;
    const randomBuffer = crypto.randomBytes(4);
    const randomValue = randomBuffer.readUInt32BE(0);
    return min + (randomValue % range);
  }

  /**
   * 计算数据哈希值
   * @param {string|Buffer} data - 要哈希的数据
   * @param {string} algorithm - 哈希算法，如 'sha256', 'md5' 等
   * @param {string} encoding - 输出编码，'hex', 'base64', 'binary'
   * @returns {string} 哈希值
   */
  hash(data, algorithm = 'sha256', encoding = 'hex') {
    try {
      const hash = crypto.createHash(algorithm);
      hash.update(data);
      return hash.digest(encoding);
    } catch (error) {
      this.logger.error('哈希计算失败', { error, algorithm });
      throw new Error('哈希计算失败');
    }
  }

  /**
   * 计算HMAC哈希值
   * @param {string|Buffer} data - 要哈希的数据
   * @param {string|Buffer} secret - 密钥
   * @param {string} algorithm - 哈希算法
   * @param {string} encoding - 输出编码
   * @returns {string} HMAC哈希值
   */
  hmac(data, secret, algorithm = 'sha256', encoding = 'hex') {
    try {
      const hmac = crypto.createHmac(algorithm, secret);
      hmac.update(data);
      return hmac.digest(encoding);
    } catch (error) {
      this.logger.error('HMAC计算失败', { error, algorithm });
      throw new Error('HMAC计算失败');
    }
  }

  /**
   * 生成盐值
   * @param {number} length - 盐值长度
   * @returns {string} 盐值（Base64编码）
   */
  generateSalt(length = 16) {
    return crypto.randomBytes(length).toString('base64');
  }

  /**
   * 密码加密（使用bcrypt的替代实现）
   * 注意：生产环境推荐使用专门的bcrypt库
   * @param {string} password - 原始密码
   * @param {string} salt - 盐值（可选）
   * @returns {string} 加密后的密码
   */
  encryptPassword(password, salt = null) {
    try {
      const actualSalt = salt || this.generateSalt();
      const combined = password + actualSalt;
      const hashed = this.hash(combined, 'sha512');
      return `${actualSalt}:${hashed}`;
    } catch (error) {
      this.logger.error('密码加密失败', error);
      throw new Error('密码加密失败');
    }
  }

  /**
   * 验证密码
   * @param {string} password - 原始密码
   * @param {string} hashedPassword - 加密后的密码（包含盐值）
   * @returns {boolean} 是否匹配
   */
  verifyPassword(password, hashedPassword) {
    try {
      const [salt, hash] = hashedPassword.split(':');
      const combined = password + salt;
      const calculatedHash = this.hash(combined, 'sha512');
      return calculatedHash === hash;
    } catch (error) {
      this.logger.error('密码验证失败', error);
      return false;
    }
  }

  /**
   * 对称加密（AES）
   * @param {string|Buffer} data - 要加密的数据
   * @param {string|Buffer} key - 加密密钥
   * @param {string} algorithm - 加密算法，默认为 'aes-256-cbc'
   * @returns {Object} 包含iv和encrypted的对象
   */
  encrypt(data, key, algorithm = 'aes-256-cbc') {
    try {
      // 确保密钥长度适合算法
      const keyBuffer = this._normalizeKey(key, algorithm);
      
      // 生成随机IV
      const iv = crypto.randomBytes(16);
      
      // 创建加密器
      const cipher = crypto.createCipheriv(algorithm, keyBuffer, iv);
      
      // 加密数据
      let encrypted = cipher.update(data);
      encrypted = Buffer.concat([encrypted, cipher.final()]);
      
      return {
        iv: iv.toString('hex'),
        encrypted: encrypted.toString('hex')
      };
    } catch (error) {
      this.logger.error('数据加密失败', { error, algorithm });
      throw new Error('数据加密失败');
    }
  }

  /**
   * 对称解密（AES）
   * @param {string} encrypted - 加密的数据
   * @param {string} iv - 初始化向量
   * @param {string|Buffer} key - 解密密钥
   * @param {string} algorithm - 解密算法，默认为 'aes-256-cbc'
   * @returns {string} 解密后的数据
   */
  decrypt(encrypted, iv, key, algorithm = 'aes-256-cbc') {
    try {
      // 确保密钥长度适合算法
      const keyBuffer = this._normalizeKey(key, algorithm);
      
      // 创建解密器
      const decipher = crypto.createDecipheriv(
        algorithm, 
        keyBuffer, 
        Buffer.from(iv, 'hex')
      );
      
      // 解密数据
      let decrypted = decipher.update(Buffer.from(encrypted, 'hex'));
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      
      return decrypted.toString();
    } catch (error) {
      this.logger.error('数据解密失败', { error, algorithm });
      throw new Error('数据解密失败');
    }
  }

  /**
   * 生成RSA密钥对
   * @param {number} modulusLength - 模数长度
   * @returns {Object} 包含publicKey和privateKey的对象
   */
  generateRsaKeyPair(modulusLength = 2048) {
    try {
      const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
      });
      
      return { publicKey, privateKey };
    } catch (error) {
      this.logger.error('RSA密钥对生成失败', { error, modulusLength });
      throw new Error('RSA密钥对生成失败');
    }
  }

  /**
   * RSA加密
   * @param {string|Buffer} data - 要加密的数据
   * @param {string|Buffer} publicKey - 公钥
   * @returns {string} 加密后的数据（Base64编码）
   */
  rsaEncrypt(data, publicKey) {
    try {
      const encrypted = crypto.publicEncrypt({
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING
      }, Buffer.from(data));
      
      return encrypted.toString('base64');
    } catch (error) {
      this.logger.error('RSA加密失败', error);
      throw new Error('RSA加密失败');
    }
  }

  /**
   * RSA解密
   * @param {string} encryptedData - 加密的数据（Base64编码）
   * @param {string|Buffer} privateKey - 私钥
   * @returns {string} 解密后的数据
   */
  rsaDecrypt(encryptedData, privateKey) {
    try {
      const decrypted = crypto.privateDecrypt({
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING
      }, Buffer.from(encryptedData, 'base64'));
      
      return decrypted.toString();
    } catch (error) {
      this.logger.error('RSA解密失败', error);
      throw new Error('RSA解密失败');
    }
  }

  /**
   * 签名数据
   * @param {string|Buffer} data - 要签名的数据
   * @param {string|Buffer} privateKey - 私钥
   * @param {string} algorithm - 签名算法
   * @returns {string} 签名（Base64编码）
   */
  sign(data, privateKey, algorithm = 'sha256') {
    try {
      const sign = crypto.createSign(algorithm);
      sign.update(data);
      const signature = sign.sign(privateKey, 'base64');
      return signature;
    } catch (error) {
      this.logger.error('数据签名失败', { error, algorithm });
      throw new Error('数据签名失败');
    }
  }

  /**
   * 验证签名
   * @param {string|Buffer} data - 原始数据
   * @param {string} signature - 签名（Base64编码）
   * @param {string|Buffer} publicKey - 公钥
   * @param {string} algorithm - 签名算法
   * @returns {boolean} 是否验证通过
   */
  verifySignature(data, signature, publicKey, algorithm = 'sha256') {
    try {
      const verify = crypto.createVerify(algorithm);
      verify.update(data);
      return verify.verify(publicKey, signature, 'base64');
    } catch (error) {
      this.logger.error('签名验证失败', { error, algorithm });
      return false;
    }
  }

  /**
   * 脱敏处理敏感数据
   * @param {string} data - 原始数据
   * @param {Object} options - 脱敏选项
   * @returns {string} 脱敏后的数据
   */
  maskSensitiveData(data, options = {}) {
    const {
      type = 'default', // default, email, phone, idCard, bankCard
      maskChar = '*',
      visibleStart = 3,
      visibleEnd = 4
    } = options;

    if (!data || typeof data !== 'string') {
      return data;
    }

    switch (type) {
      case 'email':
        // 邮箱脱敏：保留用户名前2位和域名
        return data.replace(/(\w{2})\w*(\@.*)/, `$1${maskChar.repeat(4)}$2`);
      
      case 'phone':
        // 手机号脱敏：保留前3后4
        return data.replace(/(\d{3})\d{4}(\d{4})/, `$1${maskChar.repeat(4)}$2`);
      
      case 'idCard':
        // 身份证脱敏：保留前6后4
        return data.replace(/(\d{6})\d*(\d{4})/, `$1${maskChar.repeat(8)}$2`);
      
      case 'bankCard':
        // 银行卡脱敏：保留前4后4
        return data.replace(/(\d{4})\d*(\d{4})/, `$1${maskChar.repeat(8)}$2`);
      
      default:
        // 默认脱敏：保留前后部分
        if (data.length <= visibleStart + visibleEnd) {
          return data;
        }
        const maskLength = data.length - visibleStart - visibleEnd;
        return data.substring(0, visibleStart) + 
               maskChar.repeat(maskLength) + 
               data.substring(data.length - visibleEnd);
    }
  }

  /**
   * 规范化密钥长度
   * @private
   * @param {string|Buffer} key - 原始密钥
   * @param {string} algorithm - 加密算法
   * @returns {Buffer} 规范化后的密钥
   */
  _normalizeKey(key, algorithm) {
    // 根据算法获取所需密钥长度
    let keyLength = 32; // 默认AES-256
    
    if (algorithm.includes('128')) {
      keyLength = 16;
    } else if (algorithm.includes('192')) {
      keyLength = 24;
    }
    
    // 如果密钥是字符串，转换为Buffer并进行哈希以确保长度正确
    if (typeof key === 'string') {
      const hash = crypto.createHash('sha256').update(key).digest();
      return hash.subarray(0, keyLength);
    }
    
    // 如果是Buffer，确保长度正确
    if (key.length !== keyLength) {
      const hash = crypto.createHash('sha256').update(key).digest();
      return hash.subarray(0, keyLength);
    }
    
    return key;
  }

  /**
   * 安全比较（防止时序攻击）
   * @param {string|Buffer} a - 第一个值
   * @param {string|Buffer} b - 第二个值
   * @returns {boolean} 是否相等
   */
  timingSafeEqual(a, b) {
    try {
      // 转换为Buffer
      const bufferA = Buffer.isBuffer(a) ? a : Buffer.from(a);
      const bufferB = Buffer.isBuffer(b) ? b : Buffer.from(b);
      
      // 先比较长度，避免timingSafeEqual抛出错误
      if (bufferA.length !== bufferB.length) {
        return false;
      }
      
      // 使用安全比较
      return crypto.timingSafeEqual(bufferA, bufferB);
    } catch (error) {
      this.logger.error('安全比较失败', error);
      return false;
    }
  }

  /**
   * 生成唯一标识符（UUID v4）
   * @returns {string} UUID
   */
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = crypto.randomBytes(1)[0] % 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * 加密敏感配置信息
   * @param {string} configValue - 配置值
   * @param {string|Buffer} masterKey - 主密钥
   * @returns {string} 加密后的配置值
   */
  encryptConfig(configValue, masterKey) {
    const { iv, encrypted } = this.encrypt(configValue, masterKey);
    return `${iv}:${encrypted}`;
  }

  /**
   * 解密敏感配置信息
   * @param {string} encryptedConfig - 加密的配置值
   * @param {string|Buffer} masterKey - 主密钥
   * @returns {string} 解密后的配置值
   */
  decryptConfig(encryptedConfig, masterKey) {
    const [iv, encrypted] = encryptedConfig.split(':');
    return this.decrypt(encrypted, iv, masterKey);
  }
}

// 创建单例实例
const encryptionUtils = new EncryptionUtils();

module.exports = {
  EncryptionUtils,
  encryptionUtils
};