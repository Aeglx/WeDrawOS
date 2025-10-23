/**
 * 数据库连接模块
 * 管理数据库连接、初始化和连接池
 */

const { Sequelize } = require('sequelize');
const { config } = require('../config/config');
const { Logger } = require('../logging/logger');
const { DatabaseError } = require('../errors/appError');

const logger = Logger.getInstance();

class Database {
  constructor() {
    this.sequelize = null;
    this.models = {};
    this.isConnected = false;
    this.retryCount = 0;
    this.maxRetries = config.database.retry.max || 3;
    this.retryDelay = config.database.retry.delay || 1000;
  }

  /**
   * 获取数据库实例（单例模式）
   * @static
   * @returns {Database} 数据库实例
   */
  static getInstance() {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  /**
   * 初始化数据库连接
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      logger.info('Initializing database connection...');
      
      // 创建Sequelize实例
      this.sequelize = new Sequelize({
        url: config.database.url,
        dialect: config.database.dialect,
        host: config.database.host,
        port: config.database.port,
        database: config.database.database,
        username: config.database.username,
        password: config.database.password,
        logging: config.database.logging ? this._logQuery.bind(this) : false,
        dialectOptions: this._getDialectOptions(),
        pool: {
          max: config.database.pool.max,
          min: config.database.pool.min,
          acquire: config.database.pool.acquire,
          idle: config.database.pool.idle,
          handleDisconnects: true
        },
        define: {
          freezeTableName: true,
          timestamps: true,
          underscored: true,
          paranoid: true, // 启用软删除
          createdAt: 'created_at',
          updatedAt: 'updated_at',
          deletedAt: 'deleted_at'
        },
        retry: {
          match: [
            /SequelizeConnectionError/,
            /SequelizeConnectionRefusedError/,
            /SequelizeHostNotFoundError/,
            /SequelizeHostNotReachableError/,
            /SequelizeInvalidConnectionError/,
            /SequelizeConnectionTimedOutError/,
            /TimeoutError/
          ],
          name: 'query',
          backoffBase: 100,
          backoffExponent: 2,
          timeout: config.database.pool.acquire
        }
      });

      // 设置连接事件监听
      this._setupEventListeners();

      // 测试连接
      await this.testConnection();

      // 加载模型
      await this.loadModels();

      // 同步数据库
      if (config.database.sync !== false) {
        await this.syncDatabase();
      }

      logger.info('Database initialized successfully');
      this.isConnected = true;
    } catch (error) {
      logger.error('Failed to initialize database:', error);
      this.isConnected = false;
      
      // 尝试重试连接
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        logger.warn(`Attempting to reconnect to database... (${this.retryCount}/${this.maxRetries})`);
        
        return new Promise((resolve) => {
          setTimeout(async () => {
            try {
              await this.initialize();
              resolve();
            } catch (retryError) {
              throw new DatabaseError('Failed to initialize database after retries', 'initialize', null, retryError);
            }
          }, this.retryDelay * this.retryCount);
        });
      }

      throw new DatabaseError('Failed to initialize database', 'initialize', null, error);
    }
  }

  /**
   * 测试数据库连接
   * @returns {Promise<void>}
   */
  async testConnection() {
    try {
      const startTime = Date.now();
      await this.sequelize.authenticate();
      const endTime = Date.now();
      
      logger.info(`Database connection established successfully (${endTime - startTime}ms)`);
      this.isConnected = true;
    } catch (error) {
      logger.error('Database connection failed:', error);
      this.isConnected = false;
      throw new DatabaseError('Failed to connect to database', 'authenticate', null, error);
    }
  }

  /**
   * 加载所有模型
   * @returns {Promise<void>}
   */
  async loadModels() {
    try {
      logger.info('Loading database models...');
      
      // 动态加载模型目录中的所有模型文件
      const modelFiles = [
        '../models/User',
        '../models/Transaction',
        '../models/Notification',
        '../models/Product',
        '../models/Order',
        '../models/Category',
        '../models/Cart',
        '../models/CartItem',
        '../models/Review',
        '../models/Address',
        '../models/Role',
        '../models/Permission',
        '../models/UserRole',
        '../models/RolePermission',
        '../models/PaymentMethod',
        '../models/Subscription',
        '../models/Plan',
        '../models/Coupon',
        '../models/UsageLog'
      ];

      // 导入模型
      for (const modelPath of modelFiles) {
        try {
          // 尝试导入模型，如果文件不存在则跳过
          const modelModule = require(modelPath);
          const model = modelModule(this.sequelize, Sequelize.DataTypes);
          this.models[model.name] = model;
          logger.debug(`Loaded model: ${model.name}`);
        } catch (error) {
          if (error.code === 'MODULE_NOT_FOUND') {
            logger.warn(`Model file not found: ${modelPath}. Skipping...`);
          } else {
            logger.error(`Error loading model ${modelPath}:`, error);
          }
        }
      }

      // 设置模型关联
      await this._setupAssociations();
      
      logger.info(`Loaded ${Object.keys(this.models).length} database models`);
    } catch (error) {
      logger.error('Failed to load database models:', error);
      throw new DatabaseError('Failed to load database models', 'loadModels', null, error);
    }
  }

  /**
   * 同步数据库模型
   * @param {Object} [options={}] - 同步选项
   * @returns {Promise<void>}
   */
  async syncDatabase(options = {}) {
    try {
      const syncOptions = {
        force: options.force || false, // 是否强制同步（删除重建表）
        alter: options.alter || false, // 是否自动修改表结构
        logging: config.database.logging,
        ...options
      };

      if (syncOptions.force) {
        logger.warn('DATABASE SYNC: Forcing database sync - This will drop and recreate tables!');
      } else if (syncOptions.alter) {
        logger.warn('DATABASE SYNC: Altering database tables - This may modify existing tables!');
      }

      logger.info('Syncing database models...');
      const startTime = Date.now();
      
      await this.sequelize.sync(syncOptions);
      
      const endTime = Date.now();
      logger.info(`Database sync completed successfully (${endTime - startTime}ms)`);
    } catch (error) {
      logger.error('Failed to sync database models:', error);
      throw new DatabaseError('Failed to sync database models', 'sync', null, error);
    }
  }

  /**
   * 关闭数据库连接
   * @returns {Promise<void>}
   */
  async closeConnection() {
    try {
      if (this.sequelize) {
        logger.info('Closing database connection...');
        await this.sequelize.close();
        this.isConnected = false;
        logger.info('Database connection closed successfully');
      }
    } catch (error) {
      logger.error('Error closing database connection:', error);
    }
  }

  /**
   * 获取模型
   * @param {string} modelName - 模型名称
   * @returns {Model|null} 模型实例或null
   */
  getModel(modelName) {
    return this.models[modelName] || null;
  }

  /**
   * 获取所有模型
   * @returns {Object} 模型对象
   */
  getAllModels() {
    return { ...this.models };
  }

  /**
   * 执行原始SQL查询
   * @param {string} query - SQL查询语句
   * @param {Object} [options={}] - 查询选项
   * @returns {Promise<any>}
   */
  async executeQuery(query, options = {}) {
    try {
      const startTime = Date.now();
      const result = await this.sequelize.query(query, options);
      const endTime = Date.now();
      
      logger.debug(`Query executed in ${endTime - startTime}ms: ${query}`);
      return result;
    } catch (error) {
      logger.error(`Failed to execute query: ${query}`, error);
      throw new DatabaseError('Failed to execute query', 'query', null, error);
    }
  }

  /**
   * 开始事务
   * @param {Object} [options={}] - 事务选项
   * @returns {Promise<Transaction>}
   */
  async startTransaction(options = {}) {
    try {
      const transaction = await this.sequelize.transaction(options);
      logger.debug('Transaction started');
      return transaction;
    } catch (error) {
      logger.error('Failed to start transaction:', error);
      throw new DatabaseError('Failed to start transaction', 'transaction', null, error);
    }
  }

  /**
   * 执行事务操作
   * @param {Function} callback - 事务回调函数
   * @param {Object} [options={}] - 事务选项
   * @returns {Promise<any>}
   */
  async executeInTransaction(callback, options = {}) {
    const transaction = await this.startTransaction(options);
    
    try {
      const result = await callback(transaction);
      await transaction.commit();
      logger.debug('Transaction committed');
      return result;
    } catch (error) {
      await transaction.rollback();
      logger.error('Transaction rolled back due to error:', error);
      throw error;
    }
  }

  /**
   * 获取数据库连接状态
   * @returns {Object} 连接状态信息
   */
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      retryCount: this.retryCount,
      maxRetries: this.maxRetries,
      modelsLoaded: Object.keys(this.models).length
    };
  }

  /**
   * 健康检查
   * @returns {Promise<{status: string, details: Object}>}
   */
  async healthCheck() {
    try {
      await this.testConnection();
      
      return {
        status: 'healthy',
        details: {
          connected: true,
          models: Object.keys(this.models),
          connectionPool: {
            max: config.database.pool.max,
            min: config.database.pool.min
          }
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          connected: false,
          error: error.message
        }
      };
    }
  }

  /**
   * 获取方言特定选项
   * @private
   * @returns {Object} 方言选项
   */
  _getDialectOptions() {
    const options = {};
    
    // 根据不同数据库方言设置特定选项
    switch (config.database.dialect) {
      case 'postgres':
        options.ssl = config.database.ssl ? {
          require: true,
          rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
        } : false;
        options.timezone = 'UTC';
        break;
      case 'mysql':
        options.ssl = config.database.ssl ? {
          require: true
        } : false;
        options.timezone = '+00:00';
        break;
      case 'sqlite':
        options.storage = config.database.storage || ':memory:';
        break;
      default:
        options.timezone = 'UTC';
    }
    
    return options;
  }

  /**
   * 设置事件监听器
   * @private
   */
  _setupEventListeners() {
    if (!this.sequelize) return;

    // 连接事件
    this.sequelize.on('connection', (connection) => {
      logger.debug(`Database connection established: ${connection.threadId || 'new'}`);
    });

    // 错误事件
    this.sequelize.on('error', (error) => {
      logger.error('Database error:', error);
      this.isConnected = false;
    });

    // 断开连接事件
    this.sequelize.on('disconnect', () => {
      logger.warn('Database disconnected');
      this.isConnected = false;
    });

    // 重新连接事件
    this.sequelize.on('reconnect', () => {
      logger.info('Database reconnected');
      this.isConnected = true;
    });
  }

  /**
   * 设置模型关联
   * @private
   * @returns {Promise<void>}
   */
  async _setupAssociations() {
    try {
      // 用户与交易关联
      if (this.models.User && this.models.Transaction) {
        this.models.User.hasMany(this.models.Transaction, {
          foreignKey: 'user_id',
          as: 'transactions'
        });
        this.models.Transaction.belongsTo(this.models.User, {
          foreignKey: 'user_id',
          as: 'user'
        });
      }

      // 用户与通知关联
      if (this.models.User && this.models.Notification) {
        this.models.User.hasMany(this.models.Notification, {
          foreignKey: 'user_id',
          as: 'notifications'
        });
        this.models.Notification.belongsTo(this.models.User, {
          foreignKey: 'user_id',
          as: 'user'
        });
      }

      // 用户与角色关联（多对多）
      if (this.models.User && this.models.Role && this.models.UserRole) {
        this.models.User.belongsToMany(this.models.Role, {
          through: this.models.UserRole,
          foreignKey: 'user_id',
          otherKey: 'role_id',
          as: 'roles'
        });
        this.models.Role.belongsToMany(this.models.User, {
          through: this.models.UserRole,
          foreignKey: 'role_id',
          otherKey: 'user_id',
          as: 'users'
        });
      }

      // 角色与权限关联（多对多）
      if (this.models.Role && this.models.Permission && this.models.RolePermission) {
        this.models.Role.belongsToMany(this.models.Permission, {
          through: this.models.RolePermission,
          foreignKey: 'role_id',
          otherKey: 'permission_id',
          as: 'permissions'
        });
        this.models.Permission.belongsToMany(this.models.Role, {
          through: this.models.RolePermission,
          foreignKey: 'permission_id',
          otherKey: 'role_id',
          as: 'roles'
        });
      }

      // 用户与地址关联
      if (this.models.User && this.models.Address) {
        this.models.User.hasMany(this.models.Address, {
          foreignKey: 'user_id',
          as: 'addresses'
        });
        this.models.Address.belongsTo(this.models.User, {
          foreignKey: 'user_id',
          as: 'user'
        });
      }

      // 用户与支付方式关联
      if (this.models.User && this.models.PaymentMethod) {
        this.models.User.hasMany(this.models.PaymentMethod, {
          foreignKey: 'user_id',
          as: 'paymentMethods'
        });
        this.models.PaymentMethod.belongsTo(this.models.User, {
          foreignKey: 'user_id',
          as: 'user'
        });
      }

      // 用户与订阅关联
      if (this.models.User && this.models.Subscription && this.models.Plan) {
        this.models.User.hasMany(this.models.Subscription, {
          foreignKey: 'user_id',
          as: 'subscriptions'
        });
        this.models.Subscription.belongsTo(this.models.User, {
          foreignKey: 'user_id',
          as: 'user'
        });
        this.models.Subscription.belongsTo(this.models.Plan, {
          foreignKey: 'plan_id',
          as: 'plan'
        });
        this.models.Plan.hasMany(this.models.Subscription, {
          foreignKey: 'plan_id',
          as: 'subscriptions'
        });
      }

      // 类别与产品关联
      if (this.models.Category && this.models.Product) {
        this.models.Category.hasMany(this.models.Product, {
          foreignKey: 'category_id',
          as: 'products'
        });
        this.models.Product.belongsTo(this.models.Category, {
          foreignKey: 'category_id',
          as: 'category'
        });
      }

      // 用户与订单关联
      if (this.models.User && this.models.Order) {
        this.models.User.hasMany(this.models.Order, {
          foreignKey: 'user_id',
          as: 'orders'
        });
        this.models.Order.belongsTo(this.models.User, {
          foreignKey: 'user_id',
          as: 'user'
        });
      }

      // 订单与订单项关联
      if (this.models.Order && this.models.CartItem) {
        this.models.Order.hasMany(this.models.CartItem, {
          foreignKey: 'order_id',
          as: 'items'
        });
        this.models.CartItem.belongsTo(this.models.Order, {
          foreignKey: 'order_id',
          as: 'order'
        });
      }

      // 用户与购物车关联
      if (this.models.User && this.models.Cart) {
        this.models.User.hasOne(this.models.Cart, {
          foreignKey: 'user_id',
          as: 'cart'
        });
        this.models.Cart.belongsTo(this.models.User, {
          foreignKey: 'user_id',
          as: 'user'
        });
      }

      // 购物车与购物车项关联
      if (this.models.Cart && this.models.CartItem) {
        this.models.Cart.hasMany(this.models.CartItem, {
          foreignKey: 'cart_id',
          as: 'items'
        });
        this.models.CartItem.belongsTo(this.models.Cart, {
          foreignKey: 'cart_id',
          as: 'cart'
        });
      }

      // 产品与购物车项关联
      if (this.models.Product && this.models.CartItem) {
        this.models.Product.hasMany(this.models.CartItem, {
          foreignKey: 'product_id',
          as: 'cartItems'
        });
        this.models.CartItem.belongsTo(this.models.Product, {
          foreignKey: 'product_id',
          as: 'product'
        });
      }

      // 用户与评论关联
      if (this.models.User && this.models.Review && this.models.Product) {
        this.models.User.hasMany(this.models.Review, {
          foreignKey: 'user_id',
          as: 'reviews'
        });
        this.models.Review.belongsTo(this.models.User, {
          foreignKey: 'user_id',
          as: 'user'
        });
        this.models.Product.hasMany(this.models.Review, {
          foreignKey: 'product_id',
          as: 'reviews'
        });
        this.models.Review.belongsTo(this.models.Product, {
          foreignKey: 'product_id',
          as: 'product'
        });
      }

      logger.debug('Model associations configured successfully');
    } catch (error) {
      logger.error('Failed to configure model associations:', error);
      throw new DatabaseError('Failed to configure model associations', 'associations', null, error);
    }
  }

  /**
   * 记录查询日志
   * @private
   * @param {string} sql - SQL语句
   * @param {Array} timing - 执行时间信息
   * @param {string} options - 查询选项
   * @param {Object} benchmark - 基准测试信息
   */
  _logQuery(sql, timing, options, benchmark) {
    const executionTime = benchmark || timing[0] || 0;
    
    if (executionTime > 1000) { // 记录执行时间超过1秒的慢查询
      logger.warn(`Slow query detected (${executionTime}ms): ${sql}`);
    } else if (config.database.logging) {
      logger.debug(`Query executed in ${executionTime}ms: ${sql}`);
    }
  }
}

// 导出数据库实例
const database = Database.getInstance();

// 确保在应用程序关闭时关闭数据库连接
process.on('SIGINT', async () => {
  try {
    await database.closeConnection();
  } catch (error) {
    console.error('Error closing database connection during shutdown:', error);
  } finally {
    process.exit(0);
  }
});

module.exports = {
  database,
  Database,
  Sequelize
};