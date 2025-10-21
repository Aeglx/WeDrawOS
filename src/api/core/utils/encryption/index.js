/**
 * 加密工具类
 * 提供各种加密和哈希功能
 */

const crypto = require('crypto');

/**
 * 哈希算法类型
 */
const HASH_ALGORITHMS = {
  SHA256: 'sha256',
  SHA512: 'sha512',
  MD5: 'md5'
};

/**
 * 计算数据的哈希值
 * @param {string|Buffer} data - 要哈希的数据
 * @param {string} algorithm - 哈希算法
 * @param {string} encoding - 输出编码，默认为'hex'
 * @returns {string} 哈希值
 */
function hash(data, algorithm = HASH_ALGORITHMS.SHA256, encoding = 'hex') {
  return crypto
    .createHash(algorithm)
    .update(data)
    .digest(encoding);
}

/**
 * 生成HMAC签名
 * @param {string|Buffer} data - 要签名的数据
 * @param {string|Buffer} key - 密钥
 * @param {string} algorithm - 哈希算法
 * @param {string} encoding - 输出编码，默认为'hex'
 * @returns {string} HMAC签名
 */
function hmac(data, key, algorithm = HASH_ALGORITHMS.SHA256, encoding = 'hex') {
  return crypto
    .createHmac(algorithm, key)
    .update(data)
    .digest(encoding);
}

/**
 * AES加密
 * @param {string} text - 要加密的文本
 * @param {string} key - 加密密钥（必须是32字节）
 * @param {string} iv - 初始化向量（必须是16字节），可选
 * @returns {string} 加密后的文本（base64编码）
 */
function aesEncrypt(text, key, iv = null) {
  const algorithm = 'aes-256-cbc';
  const secretKey = key.padEnd(32, '0').slice(0, 32);
  const initializationVector = iv || crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, secretKey, initializationVector);
  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  return iv ? encrypted : `${initializationVector.toString('base64')}:${encrypted}`;
}

/**
 * AES解密
 * @param {string} encryptedText - 加密后的文本
 * @param {string} key - 解密密钥（必须是32字节）
 * @param {string} iv - 初始化向量，可选
 * @returns {string} 解密后的文本
 */
function aesDecrypt(encryptedText, key, iv = null) {
  try {
    const algorithm = 'aes-256-cbc';
    const secretKey = key.padEnd(32, '0').slice(0, 32);
    
    let initializationVector;
    let encrypted;
    
    if (iv) {
      initializationVector = iv;
      encrypted = encryptedText;
    } else {
      const parts = encryptedText.split(':');
      initializationVector = Buffer.from(parts[0], 'base64');
      encrypted = parts[1];
    }
    
    const decipher = crypto.createDecipheriv(algorithm, secretKey, initializationVector);
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error('解密失败');
  }
}

/**
 * 生成随机密钥
 * @param {number} length - 密钥长度
 * @param {string} encoding - 输出编码，默认为'hex'
 * @returns {string} 随机密钥
 */
function generateKey(length = 32, encoding = 'hex') {
  return crypto.randomBytes(length).toString(encoding);
}

/**
 * 生成盐值
 * @param {number} length - 盐值长度
 * @param {string} encoding - 输出编码，默认为'hex'
 * @returns {string} 盐值
 */
function generateSalt(length = 16, encoding = 'hex') {
  return crypto.randomBytes(length).toString(encoding);
}

/**
 * PBKDF2密码哈希
 * @param {string} password - 密码
 * @param {string} salt - 盐值
 * @param {number} iterations - 迭代次数
 * @param {number} keylen - 密钥长度
 * @param {string} digest - 摘要算法
 * @returns {string} 哈希后的密码
 */
function pbkdf2(password, salt, iterations = 10000, keylen = 64, digest = HASH_ALGORITHMS.SHA512) {
  return crypto
    .pbkdf2Sync(password, salt, iterations, keylen, digest)
    .toString('hex');
}

module.exports = {
  HASH_ALGORITHMS,
  hash,
  hmac,
  aesEncrypt,
  aesDecrypt,
  generateKey,
  generateSalt,
  pbkdf2
};