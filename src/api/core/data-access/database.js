const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// 数据库连接配置
const dbConfig = {
  host: 'localhost',  // 固定本地主机
  user: 'root',      // 固定root用户
  password: '123456', // 固定密码
  database: 'wedraw', // 固定数据库名
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// 创建数据库连接池
let pool = null;

/**
 * 初始化数据库连接
 */
async function initialize() {
  try {
    // 创建连接池
    pool = mysql.createPool(dbConfig);
    
    // 测试连接
    const [rows] = await pool.query('SELECT 1');
    console.log('数据库连接成功');
    
    // 初始化数据库表结构（如果需要）
    await initDatabaseSchema();
    
    return true;
  } catch (error) {
    console.error('数据库连接失败:', error);
    console.warn('数据库连接失败，但应用将继续运行（功能可能受限）');
    return false; // 返回false但不抛出错误，允许应用继续运行
  }
}

/**
 * 初始化数据库表结构
 */
async function initDatabaseSchema() {
  try {
    // 这里可以添加数据库表的初始化SQL语句
    // 实际项目中应该使用数据库迁移工具
    console.log('数据库表结构初始化完成');
  } catch (error) {
    console.error('数据库表结构初始化失败:', error);
  }
}

/**
 * 获取数据库连接
 * @returns {Promise<Object>} 数据库连接对象
 */
async function getConnection() {
  if (!pool) {
    throw new Error('数据库连接池未初始化');
  }
  return pool.getConnection();
}

/**
 * 执行SQL查询
 * @param {string} sql - SQL查询语句
 * @param {Array} params - 查询参数
 * @returns {Promise<Array>} 查询结果
 */
async function query(sql, params = []) {
  if (!pool) {
    throw new Error('数据库连接池未初始化');
  }
  
  try {
    const [rows] = await pool.query(sql, params);
    return rows;
  } catch (error) {
    console.error('数据库查询错误:', error);
    throw error;
  }
}

/**
 * 执行事务
 * @param {Function} callback - 事务回调函数，接收connection参数
 * @returns {Promise<any>} 事务执行结果
 */
async function transaction(callback) {
  if (!pool) {
    throw new Error('数据库连接池未初始化');
  }
  
  let connection = null;
  
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    const result = await callback(connection);
    
    await connection.commit();
    return result;
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('数据库事务执行失败:', error);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

/**
 * 关闭数据库连接池
 */
async function close() {
  if (pool) {
    await pool.end();
    console.log('数据库连接池已关闭');
  }
}

module.exports = {
  initialize,
  getConnection,
  query,
  transaction,
  close
};