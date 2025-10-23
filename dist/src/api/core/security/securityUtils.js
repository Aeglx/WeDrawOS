const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'wedraw_secret_key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * 密码哈希
 * @param {string} password - 原始密码
 * @returns {string} 哈希后的密码
 */
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * 验证密码
 * @param {string} password - 原始密码
 * @param {string} hashedPassword - 哈希后的密码
 * @returns {boolean} 密码是否正确
 */
function verifyPassword(password, hashedPassword) {
  const [salt, originalHash] = hashedPassword.split(':');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return hash === originalHash;
}

/**
 * 生成JWT令牌
 * @param {Object} payload - JWT载荷
 * @param {string} expiresIn - 过期时间
 * @returns {string} JWT令牌
 */
function generateToken(payload, expiresIn = JWT_EXPIRES_IN) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

/**
 * 验证JWT令牌
 * @param {string} token - JWT令牌
 * @returns {Object} 解析后的载荷
 * @throws {Error} 令牌无效时抛出错误
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('无效的令牌');
  }
}

/**
 * 解析JWT令牌（不验证签名）
 * @param {string} token - JWT令牌
 * @returns {Object} 解析后的载荷
 */
function decodeToken(token) {
  return jwt.decode(token);
}

/**
 * 生成随机字符串
 * @param {number} length - 字符串长度
 * @returns {string} 随机字符串
 */
function generateRandomString(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * 加密数据
 * @param {string} text - 要加密的文本
 * @param {string} key - 加密密钥
 * @returns {string} 加密后的文本
 */
function encrypt(text, key = JWT_SECRET) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key, 'hex').slice(0, 32), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${encrypted}:${authTag}`;
}

/**
 * 解密数据
 * @param {string} encryptedText - 加密后的文本
 * @param {string} key - 解密密钥
 * @returns {string} 解密后的文本
 */
function decrypt(encryptedText, key = JWT_SECRET) {
  try {
    const [ivHex, encryptedHex, authTagHex] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(key, 'hex').slice(0, 32), iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, null, 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    throw new Error('解密失败');
  }
}

/**
 * 生成MD5哈希
 * @param {string} text - 要哈希的文本
 * @returns {string} MD5哈希值
 */
function md5(text) {
  return crypto.createHash('md5').update(text).digest('hex');
}

/**
 * 生成SHA256哈希
 * @param {string} text - 要哈希的文本
 * @returns {string} SHA256哈希值
 */
function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * 验证请求签名
 * @param {Object} req - Express请求对象
 * @param {string} secret - 签名密钥
 * @returns {boolean} 签名是否有效
 */
function verifyRequestSignature(req, secret) {
  const signature = req.headers['x-signature'];
  if (!signature) {
    return false;
  }
  
  const body = JSON.stringify(req.body);
  const timestamp = req.headers['x-timestamp'];
  if (!timestamp) {
    return false;
  }
  
  const dataToSign = `${timestamp}:${body}`;
  const expectedSignature = sha256(dataToSign + secret);
  
  return signature === expectedSignature;
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  decodeToken,
  generateRandomString,
  encrypt,
  decrypt,
  md5,
  sha256,
  verifyRequestSignature
};