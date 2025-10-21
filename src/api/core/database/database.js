/**
 * 数据库连接和初始化模块
 * 提供数据库连接管理、初始化和实用函数
 */

const { Pool } = require('pg');
const { Config } = require('../config/config');
const { Logger } = require('../logging/logger');
const { DatabaseError } = require('../errors/appError');

class Database {
  constructor() {
    this.pool = null;
    this.config = Config.getInstance();
    this.logger = Logger.getInstance();
    this.isConnected = false;
  }

  /**
   * 获取数据库连接实例（单例模式）
   * @returns {Database} 数据库实例
   */
  static getInstance() {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  /**
   * 建立数据库连接
   * @returns {Promise<void>}
   */
  async connect() {
    try {
      if (this.isConnected && this.pool) {
        this.logger.info('Database connection already established');
        return;
      }

      // 从配置中获取数据库连接参数
      const dbConfig = this.config.get('database', {});

      // 创建连接池
      this.pool = new Pool({
        host: dbConfig.host || 'localhost',
        port: dbConfig.port || 5432,
        user: dbConfig.user || 'postgres',
        password: dbConfig.password || '',
        database: dbConfig.name || 'postgres',
        ssl: dbConfig.ssl || false,
        max: dbConfig.maxConnections || 10,
        idleTimeoutMillis: dbConfig.idleTimeout || 30000,
        connectionTimeoutMillis: dbConfig.connectionTimeout || 20000
      });

      // 测试连接
      await this.pool.query('SELECT NOW()');
      this.isConnected = true;
      this.logger.info('Database connection established successfully');

      // 设置连接池事件监听
      this._setupEventListeners();
    } catch (error) {
      this.logger.error('Failed to connect to database:', error);
      throw new DatabaseError('Failed to connect to database', 500, error);
    }
  }

  /**
   * 关闭数据库连接
   * @returns {Promise<void>}
   */
  async disconnect() {
    try {
      if (this.pool) {
        await this.pool.end();
        this.pool = null;
        this.isConnected = false;
        this.logger.info('Database connection closed successfully');
      }
    } catch (error) {
      this.logger.error('Error closing database connection:', error);
      throw new DatabaseError('Failed to close database connection', 500, error);
    }
  }

  /**
   * 执行SQL查询
   * @param {string} sql - SQL查询语句
   * @param {Array} params - 查询参数
   * @returns {Promise<Object>} 查询结果
   */
  async query(sql, params = []) {
    try {
      if (!this.isConnected || !this.pool) {
        await this.connect();
      }

      this.logger.debug('Executing SQL query:', { sql, params });
      const startTime = Date.now();

      const result = await this.pool.query(sql, params);

      const duration = Date.now() - startTime;
      this.logger.debug(`Query executed in ${duration}ms`, { rows: result.rowCount });

      return result;
    } catch (error) {
      this.logger.error('Error executing query:', { sql, error });
      throw new DatabaseError(`Query error: ${error.message}`, 500, error);
    }
  }

  /**
   * 执行事务
   * @param {Function} callback - 事务回调函数，接收client参数
   * @returns {Promise<any>} 事务结果
   */
  async transaction(callback) {
    let client = null;

    try {
      if (!this.isConnected || !this.pool) {
        await this.connect();
      }

      // 获取客户端连接
      client = await this.pool.connect();

      // 开始事务
      await client.query('BEGIN');
      this.logger.debug('Transaction started');

      // 执行回调函数
      const result = await callback(client);

      // 提交事务
      await client.query('COMMIT');
      this.logger.debug('Transaction committed');

      return result;
    } catch (error) {
      // 发生错误时回滚事务
      if (client) {
        try {
          await client.query('ROLLBACK');
          this.logger.debug('Transaction rolled back');
        } catch (rollbackError) {
          this.logger.error('Error during rollback:', rollbackError);
        }
      }

      this.logger.error('Transaction failed:', error);
      throw new DatabaseError(`Transaction error: ${error.message}`, 500, error);
    } finally {
      // 释放客户端连接
      if (client) {
        client.release();
      }
    }
  }

  /**
   * 初始化数据库架构
   * @returns {Promise<void>}
   */
  async initializeSchema() {
    try {
      await this.connect();
      this.logger.info('Starting database schema initialization');

      // 执行数据库初始化脚本
      await this._createTables();
      await this._createIndexes();
      await this._createConstraints();
      await this._insertInitialData();

      this.logger.info('Database schema initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize database schema:', error);
      throw new DatabaseError('Failed to initialize database schema', 500, error);
    }
  }

  /**
   * 创建数据库表
   * @private
   */
  async _createTables() {
    // 用户表
    await this.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        role VARCHAR(20) NOT NULL DEFAULT 'user',
        phone_number VARCHAR(20),
        address JSONB,
        profile_image VARCHAR(255),
        is_active BOOLEAN NOT NULL DEFAULT true,
        is_deleted BOOLEAN NOT NULL DEFAULT false,
        is_email_verified BOOLEAN NOT NULL DEFAULT false,
        failed_login_attempts INTEGER NOT NULL DEFAULT 0,
        last_login_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL,
        updated_at TIMESTAMP NOT NULL,
        deleted_at TIMESTAMP
      );
    `);

    // 产品表
    await this.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        original_price DECIMAL(10, 2),
        stock_quantity INTEGER NOT NULL DEFAULT 0,
        category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
        SKU VARCHAR(100) UNIQUE,
        is_active BOOLEAN NOT NULL DEFAULT true,
        is_deleted BOOLEAN NOT NULL DEFAULT false,
        weight DECIMAL(10, 2),
        dimensions JSONB,
        specifications JSONB,
        rating DECIMAL(3, 2) DEFAULT 0,
        review_count INTEGER DEFAULT 0,
        view_count INTEGER DEFAULT 0,
        created_at TIMESTAMP NOT NULL,
        updated_at TIMESTAMP NOT NULL,
        deleted_at TIMESTAMP
      );
    `);

    // 产品分类表
    await this.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP NOT NULL,
        updated_at TIMESTAMP NOT NULL,
        deleted_at TIMESTAMP
      );
    `);

    // 产品图片表
    await this.query(`
      CREATE TABLE IF NOT EXISTS product_images (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        image_url VARCHAR(255) NOT NULL,
        thumbnail_url VARCHAR(255),
        alt_text VARCHAR(255),
        is_primary BOOLEAN NOT NULL DEFAULT false,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP NOT NULL
      );
    `);

    // 用户认证表（用于存储重置令牌等）
    await this.query(`
      CREATE TABLE IF NOT EXISTS user_authentications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_type VARCHAR(50) NOT NULL,
        token_value VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        is_used BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL
      );
    `);

    // 文件表
    await this.query(`
      CREATE TABLE IF NOT EXISTS files (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        filepath VARCHAR(500) NOT NULL,
        file_size BIGINT NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        file_hash VARCHAR(255),
        uploader_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        is_public BOOLEAN NOT NULL DEFAULT false,
        expires_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL,
        updated_at TIMESTAMP NOT NULL
      );
    `);

    // API密钥表
    await this.query(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        key_name VARCHAR(100) NOT NULL,
        api_key_hash VARCHAR(255) NOT NULL,
        permissions JSONB DEFAULT '{}',
        is_active BOOLEAN NOT NULL DEFAULT true,
        expires_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL,
        updated_at TIMESTAMP NOT NULL,
        last_used_at TIMESTAMP
      );
    `);
  }

  /**
   * 创建数据库索引
   * @private
   */
  async _createIndexes() {
    // 用户表索引
    await this.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    await this.query('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)');
    await this.query('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)');
    await this.query('CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active)');

    // 产品表索引
    await this.query('CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id)');
    await this.query('CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active)');
    await this.query('CREATE INDEX IF NOT EXISTS idx_products_price ON products(price)');

    // 产品分类表索引
    await this.query('CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id)');
    await this.query('CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug)');

    // 产品图片表索引
    await this.query('CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id)');

    // 用户认证表索引
    await this.query('CREATE INDEX IF NOT EXISTS idx_user_authentications_user_id ON user_authentications(user_id)');
    await this.query('CREATE INDEX IF NOT EXISTS idx_user_authentications_token_value ON user_authentications(token_value)');
    await this.query('CREATE INDEX IF NOT EXISTS idx_user_authentications_expires_at ON user_authentications(expires_at)');

    // API密钥表索引
    await this.query('CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id)');
    await this.query('CREATE INDEX IF NOT EXISTS idx_api_keys_api_key_hash ON api_keys(api_key_hash)');
    await this.query('CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON api_keys(is_active)');
  }

  /**
   * 创建额外的约束
   * @private
   */
  async _createConstraints() {
    // 确保用户名和邮箱不区分大小写的唯一性
    await this.query(`
      CREATE OR REPLACE FUNCTION check_unique_email() RETURNS TRIGGER AS $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM users 
          WHERE LOWER(email) = LOWER(NEW.email) 
          AND id != NEW.id 
          AND is_deleted = false
        ) THEN
          RAISE EXCEPTION 'Email already exists';
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await this.query(`
      CREATE OR REPLACE FUNCTION check_unique_username() RETURNS TRIGGER AS $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM users 
          WHERE username = NEW.username 
          AND id != NEW.id 
          AND is_deleted = false
        ) THEN
          RAISE EXCEPTION 'Username already exists';
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // 创建触发器
    await this.query(`
      DROP TRIGGER IF EXISTS trigger_check_unique_email ON users;
      CREATE TRIGGER trigger_check_unique_email
      BEFORE INSERT OR UPDATE ON users
      FOR EACH ROW
      EXECUTE FUNCTION check_unique_email();
    `);

    await this.query(`
      DROP TRIGGER IF EXISTS trigger_check_unique_username ON users;
      CREATE TRIGGER trigger_check_unique_username
      BEFORE INSERT OR UPDATE ON users
      FOR EACH ROW
      EXECUTE FUNCTION check_unique_username();
    `);
  }

  /**
   * 插入初始数据
   * @private
   */
  async _insertInitialData() {
    // 插入默认管理员账户（如果不存在）
    const adminEmail = this.config.get('admin.email', 'admin@example.com');
    const adminExists = await this.query(
      'SELECT COUNT(*) FROM users WHERE email = $1',
      [adminEmail]
    );

    if (parseInt(adminExists.rows[0].count) === 0) {
      const adminPassword = this.config.get('admin.password', 'Admin@123456');
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      await this.query(
        `INSERT INTO users (username, email, password_hash, first_name, last_name, role, 
                           is_active, is_email_verified, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        ['admin', adminEmail, hashedPassword, 'System', 'Administrator', 'admin', 
         true, true, new Date(), new Date()]
      );

      this.logger.info('Default admin user created');
    }

    // 插入默认产品分类（如果不存在）
    const categoriesCount = await this.query(
      'SELECT COUNT(*) FROM categories WHERE parent_id IS NULL'
    );

    if (parseInt(categoriesCount.rows[0].count) === 0) {
      const categories = [
        { name: '电子产品', slug: 'electronics' },
        { name: '服装鞋帽', slug: 'clothing' },
        { name: '家居用品', slug: 'home' },
        { name: '食品饮料', slug: 'food' },
        { name: '运动户外', slug: 'sports' }
      ];

      for (const category of categories) {
        await this.query(
          `INSERT INTO categories (name, slug, created_at, updated_at)
           VALUES ($1, $2, $3, $4)`,
          [category.name, category.slug, new Date(), new Date()]
        );
      }

      this.logger.info('Default categories created');
    }
  }

  /**
   * 设置连接池事件监听
   * @private
   */
  _setupEventListeners() {
    if (!this.pool) return;

    // 连接错误事件
    this.pool.on('error', (error, client) => {
      this.logger.error('Unexpected error on idle database client:', error);
      this.isConnected = false;
    });

    // 客户端获取事件
    this.pool.on('acquire', (client) => {
      this.logger.debug('Client acquired from pool');
    });

    // 客户端释放事件
    this.pool.on('release', (client) => {
      this.logger.debug('Client released back to pool');
    });

    // 连接池满事件
    this.pool.on('remove', (client) => {
      this.logger.debug('Client removed from pool');
    });
  }

  /**
   * 获取连接池状态
   * @returns {Object} 连接池状态信息
   */
  getPoolStatus() {
    if (!this.pool) {
      return {
        connected: false,
        status: 'not_connected',
        poolSize: 0,
        idleConnections: 0,
        totalConnections: 0
      };
    }

    // 注意：pg Pool 不直接暴露这些统计信息，这里只是示例
    return {
      connected: this.isConnected,
      status: this.isConnected ? 'connected' : 'disconnected',
      poolSize: this.config.get('database.maxConnections', 10),
      idleConnections: this.pool.idleCount || 0,
      totalConnections: this.pool.totalCount || 0
    };
  }

  /**
   * 执行数据库备份（简单实现）
   * @param {string} filePath - 备份文件路径
   * @returns {Promise<void>}
   */
  async backupDatabase(filePath) {
    // 这是一个简化实现，实际应用中可能需要使用pg_dump等工具
    this.logger.warn('Database backup functionality is not fully implemented');
    throw new DatabaseError('Backup functionality not implemented', 501);
  }

  /**
   * 执行数据库恢复（简单实现）
   * @param {string} filePath - 备份文件路径
   * @returns {Promise<void>}
   */
  async restoreDatabase(filePath) {
    // 这是一个简化实现，实际应用中可能需要使用pg_restore等工具
    this.logger.warn('Database restore functionality is not fully implemented');
    throw new DatabaseError('Restore functionality not implemented', 501);
  }
}

module.exports = { Database };