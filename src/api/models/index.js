import { Sequelize } from 'sequelize';
import config from '../config/config.js';

// 导入所有模型
import User from './User.js';
import Conversation from './Conversation.js';
import Message from './Message.js';
import ConversationAssignment from './ConversationAssignment.js';
import AutoReplyRule from './AutoReplyRule.js';
import AutoReplyLog from './AutoReplyLog.js';
import Tag from './Tag.js';
import Notification from './Notification.js';
import Feedback from './Feedback.js';
import WorkSchedule from './WorkSchedule.js';
import WorkLog from './WorkLog.js';

// 获取数据库配置
const dbConfig = config.getConfig('database');

// 创建 Sequelize 实例
const sequelize = new Sequelize(
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
export default db;

// 导出 Sequelize 实例和操作符
export { sequelize, Sequelize };

// 导出所有模型
export const { 
  User, 
  Conversation, 
  Message, 
  ConversationAssignment, 
  AutoReplyRule, 
  AutoReplyLog, 
  Tag, 
  Notification, 
  Feedback, 
  WorkSchedule, 
  WorkLog 
} = db.models;

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
export const initializeDatabase = async () => {
  return await db.initialize();
};

// 导出关闭函数
export const closeDatabase = async () => {
  return await db.close();
};