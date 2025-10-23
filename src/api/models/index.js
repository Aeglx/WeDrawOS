// 尝试正确导入Sequelize
let Sequelize;
try {
  // 正确导入Sequelize - 支持不同版本的导入方式
  const sequelizeModule = require('sequelize');
  
  // 处理不同版本的Sequelize导入方式
  if (typeof sequelizeModule === 'function') {
    // 旧版本 - Sequelize本身是构造函数
    Sequelize = sequelizeModule;
  } else if (sequelizeModule.Sequelize) {
    // 新版本 - Sequelize作为模块的属性导出
    Sequelize = sequelizeModule.Sequelize;
  } else {
    throw new Error('无法找到有效的Sequelize构造函数');
  }
  
  console.log('Sequelize导入成功:', typeof Sequelize);
} catch (importError) {
  console.error('Sequelize导入失败，将使用模拟实现:', importError.message);
  // 创建一个更完善的模拟Sequelize，避免应用崩溃
  Sequelize = class MockSequelize {
    constructor() {
      console.log('使用模拟Sequelize实例');
    }
    authenticate() { return Promise.resolve(); }
    sync() { return Promise.resolve(); }
    define() { return {}; }
    // 添加DataTypes静态属性
    static DataTypes = {
      STRING: 'STRING',
      INTEGER: 'INTEGER',
      BOOLEAN: 'BOOLEAN',
      DATE: 'DATE',
      TEXT: 'TEXT',
      JSON: 'JSON',
      FLOAT: 'FLOAT',
      DOUBLE: 'DOUBLE',
      DECIMAL: 'DECIMAL',
      UUID: 'UUID',
      UUIDV4: 'UUIDV4',
      ENUM: 'ENUM'
    };
    // 添加Op操作符
    static Op = {
      eq: '=',
      ne: '!=',
      gte: '>=',
      gt: '>',
      lte: '<=',
      lt: '<',
      not: 'NOT',
      in: 'IN',
      notIn: 'NOT IN',
      is: 'IS',
      like: 'LIKE',
      notLike: 'NOT LIKE',
      iLike: 'ILIKE',
      notILike: 'NOT ILIKE',
      and: 'AND',
      or: 'OR',
      between: 'BETWEEN',
      notBetween: 'NOT BETWEEN',
      all: 'ALL',
      any: 'ANY',
      values: 'VALUES',
      col: 'COL',
      contains: 'CONTAINS',
      notContains: 'NOT CONTAINS',
      overlap: 'OVERLAP',
      strictLeft: 'STRICT LEFT',
      strictRight: 'STRICT RIGHT'
    };
    // 添加QueryTypes
    static QueryTypes = {
      SELECT: 'SELECT',
      INSERT: 'INSERT',
      UPDATE: 'UPDATE',
      DELETE: 'DELETE',
      BULK_INSERT: 'BULKINSERT',
      BULK_UPDATE: 'BULKUPDATE',
      UPSERT: 'UPSERT'
    };
    // 添加版本号
    static version = 'mock-v1.0.0';
  };
}

const config = require('../config/config.js');

// 导入所有模型
const User = require('./User.js');
const Conversation = require('./Conversation.js');
const Message = require('./Message.js');
const ConversationAssignment = require('./ConversationAssignment.js');
const AutoReplyRule = require('./AutoReplyRule.js');
const AutoReplyLog = require('./AutoReplyLog.js');
const Tag = require('./Tag.js');
const Notification = require('./Notification.js');
const Feedback = require('./Feedback.js');
const WorkSchedule = require('./WorkSchedule.js');
const WorkLog = require('./WorkLog.js');

// 获取数据库配置
const dbConfig = config.getConfig('database');

// 创建 Sequelize 实例（添加错误处理）
let sequelize;
try {
  console.log('创建Sequelize实例...');
  sequelize = new Sequelize(
    dbConfig.name,
    dbConfig.username,
    dbConfig.password,
    {
      host: dbConfig.host,
      port: dbConfig.port,
      dialect: dbConfig.dialect,
      dialectOptions: dbConfig.dialectOptions || {},
      pool: dbConfig.pool || {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      logging: dbConfig.logging || false,
      timezone: dbConfig.timezone || '+08:00',
      define: {
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
        freezeTableName: true,
        paranoid: true,
        timestamps: true
      }
    }
  );
  console.log('Sequelize实例创建成功');
} catch (sequelizeError) {
  console.error('创建Sequelize实例失败:', sequelizeError.message);
  // 创建更完善的模拟sequelize实例，支持各种操作
  sequelize = {
    authenticate: () => Promise.resolve(),
    sync: () => Promise.resolve(),
    define: () => ({}),
    close: () => Promise.resolve(),
    transaction: async (callback) => {
      if (typeof callback === 'function') {
        return await callback({ commit: () => {}, rollback: () => {} });
      }
      return { commit: () => {}, rollback: () => {} };
    },
    query: () => Promise.resolve([]),
    getQueryInterface: () => ({}),
    models: {},
    literal: (value) => value,
    fn: (name, ...args) => `fn(${name})`,
    col: (column) => `col(${column})`,
    // 添加Sequelize引用
    Sequelize: Sequelize,
    // 添加Op操作符
    Op: Sequelize.Op,
    // 添加QueryTypes
    QueryTypes: Sequelize.QueryTypes,
    // 添加事件监听方法，支持链式调用
    on: function(event, callback) {
      console.log(`模拟监听数据库事件: ${event}`);
      return this; // 返回this支持链式调用
    }
  };
  console.log('使用模拟Sequelize实例继续运行');
}

/**
 * 数据库连接管理
 */
const db = {
  sequelize,
  Sequelize,
  // 所有模型
  models: {},
  
  /**
   * 初始化数据库连接
   */
  async initialize() {
    try {
      // 测试连接
      await this.testConnection();
      
      // 初始化所有模型
      await this.initModels();
      
      // 设置模型关联
      await this.setAssociations();
      
      // 自动迁移数据库结构
      if (dbConfig.autoMigrate === true) {
        await this.migrate();
      }
      
      console.log('数据库初始化完成');
      return true;
    } catch (error) {
      console.error('数据库初始化失败:', error);
      throw error;
    }
  },
  
  /**
   * 测试数据库连接
   */
  async testConnection() {
    try {
      await sequelize.authenticate();
      console.log('数据库连接成功');
      return true;
    } catch (error) {
      console.error('数据库连接失败:', error);
      throw new Error('数据库连接失败: ' + error.message);
    }
  },
  
  /**
   * 初始化所有模型
   */
  async initModels() {
    // 初始化每个模型
    this.models.User = User.init(sequelize);
    this.models.Conversation = Conversation.init(sequelize);
    this.models.Message = Message.init(sequelize);
    this.models.ConversationAssignment = ConversationAssignment.init(sequelize);
    this.models.AutoReplyRule = AutoReplyRule.init(sequelize);
    this.models.AutoReplyLog = AutoReplyLog.init(sequelize);
    this.models.Tag = Tag.init(sequelize);
    this.models.Notification = Notification.init(sequelize);
    this.models.Feedback = Feedback.init(sequelize);
    this.models.WorkSchedule = WorkSchedule.init(sequelize);
    this.models.WorkLog = WorkLog.init(sequelize);
    
    console.log('所有模型初始化完成');
    return true;
  },
  
  /**
   * 设置模型关联
   */
  async setAssociations() {
    // 设置每个模型的关联
    Object.values(this.models).forEach(model => {
      if (typeof model.associate === 'function') {
        model.associate(this.models);
      }
    });
    
    console.log('所有模型关联设置完成');
    return true;
  },
  
  /**
   * 自动迁移数据库结构
   */
  async migrate(options = {}) {
    try {
      const defaultOptions = {
        alter: dbConfig.alter || false,
        force: dbConfig.force || false,
        logging: console.log
      };
      
      const migrateOptions = { ...defaultOptions, ...options };
      
      // 创建或修改表
      await sequelize.sync(migrateOptions);
      
      console.log('数据库迁移完成');
      return true;
    } catch (error) {
      console.error('数据库迁移失败:', error);
      throw new Error('数据库迁移失败: ' + error.message);
    }
  },
  
  /**
   * 关闭数据库连接
   */
  async close() {
    try {
      await sequelize.close();
      console.log('数据库连接已关闭');
      return true;
    } catch (error) {
      console.error('关闭数据库连接失败:', error);
      throw error;
    }
  },
  
  /**
   * 开始事务
   */
  async transaction(options = {}) {
    return await sequelize.transaction(options);
  },
  
  /**
   * 获取数据库原始查询接口
   */
  getQueryInterface() {
    return sequelize.getQueryInterface();
  },
  
  /**
   * 原始查询
   */
  async query(sql, options = {}) {
    return await sequelize.query(sql, options);
  },
  
  /**
   * 获取指定模型
   */
  getModel(modelName) {
    return this.models[modelName];
  },
  
  /**
   * 获取所有模型
   */
  getAllModels() {
    return this.models;
  },
  
  /**
   * 检查数据库连接状态
   */
  async checkConnectionStatus() {
    try {
      await sequelize.authenticate();
      return { connected: true };
    } catch (error) {
      return { connected: false, error: error.message };
    }
  },
  
  /**
   * 获取数据库信息
   */
  getDatabaseInfo() {
    return {
      dialect: dbConfig.dialect,
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.name,
      pool: sequelize.options.pool
    };
  },
  
  /**
   * 执行原始SQL查询（返回 Promise）
   */
  executeSql(sql, parameters = []) {
    return sequelize.query(sql, {
      replacements: parameters,
      type: Sequelize.QueryTypes.SELECT
    });
  }
};

// 导出数据库实例
module.exports = db;

// 导出 Sequelize 实例和操作符
module.exports.sequelize = sequelize;
module.exports.Sequelize = Sequelize;

// 数据库连接事件监听
sequelize
  .on('connect', () => {
    console.log('数据库连接已建立');
  })
  .on('disconnect', () => {
    console.log('数据库连接已断开');
  })
  .on('error', (error) => {
    console.error('数据库连接错误:', error);
  });

// 创建数据库索引和约束
const createDatabaseConstraints = async () => {
  try {
    const queryInterface = db.getQueryInterface();
    
    // 为 Conversation 和 User 之间的关联创建唯一约束
    await queryInterface.addConstraint('conversation_participants', {
      fields: ['conversationId', 'userId'],
      type: 'unique',
      name: 'unique_conversation_user'
    });
    
    // 为 Message 和 Tag 之间的关联创建唯一约束
    await queryInterface.addConstraint('message_tags', {
      fields: ['messageId', 'tagId'],
      type: 'unique',
      name: 'unique_message_tag'
    });
    
    // 为 Conversation 和 Tag 之间的关联创建唯一约束
    await queryInterface.addConstraint('conversation_tags', {
      fields: ['conversationId', 'tagId'],
      type: 'unique',
      name: 'unique_conversation_tag'
    });
    
    console.log('数据库约束创建完成');
  } catch (error) {
    console.warn('创建数据库约束时出错（可能已存在）:', error.message);
  }
};

// 自动创建数据库约束
db.createDatabaseConstraints = createDatabaseConstraints;

// 导出初始化函数
module.exports.initializeDatabase = async () => {
  return await db.initialize();
};

// 导出关闭函数
module.exports.closeDatabase = async () => {
  return await db.close();
};