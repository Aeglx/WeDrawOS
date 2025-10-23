/**
 * ORM映射系统
 * 提供对象关系映射功能，简化数据库操作
 */

const database = require('../database');
const logger = require('../../utils/logger');

/**
 * ORM基础模型类
 */
class Model {
  constructor(tableName, schema = {}) {
    this.tableName = tableName;
    this.schema = schema;
    this.logger = logger;
  }

  /**
   * 根据ID查询单条记录
   * @param {number|string} id - 记录ID
   * @returns {Promise<Object|null>} 查询结果
   */
  async findById(id) {
    try {
      const sql = `SELECT * FROM ${this.tableName} WHERE id = ?`;
      const results = await database.query(sql, [id]);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      this.logger.error(`查询${this.tableName}失败:`, error);
      throw error;
    }
  }

  /**
   * 查询所有记录
   * @param {Object} options - 查询选项
   * @returns {Promise<Array>} 查询结果数组
   */
  async findAll(options = {}) {
    try {
      let sql = `SELECT * FROM ${this.tableName}`;
      const params = [];

      // 添加WHERE条件
      if (options.where) {
        const conditions = [];
        for (const [key, value] of Object.entries(options.where)) {
          conditions.push(`${key} = ?`);
          params.push(value);
        }
        sql += ` WHERE ${conditions.join(' AND ')}`;
      }

      // 添加排序
      if (options.orderBy) {
        sql += ` ORDER BY ${options.orderBy}`;
      }

      // 添加分页
      if (options.limit && options.offset !== undefined) {
        sql += ' LIMIT ? OFFSET ?';
        params.push(options.limit, options.offset);
      }

      return await database.query(sql, params);
    } catch (error) {
      this.logger.error(`查询${this.tableName}列表失败:`, error);
      throw error;
    }
  }

  /**
   * 创建新记录
   * @param {Object} data - 记录数据
   * @returns {Promise<Object>} 创建的记录
   */
  async create(data) {
    try {
      // 验证数据结构
      const validatedData = this.validate(data);
      
      const fields = Object.keys(validatedData);
      const placeholders = fields.map(() => '?');
      const values = Object.values(validatedData);

      const sql = `INSERT INTO ${this.tableName} (${fields.join(', ')}) VALUES (${placeholders.join(', ')})`;
      const [result] = await database.query(sql, values);

      return this.findById(result.insertId);
    } catch (error) {
      this.logger.error(`创建${this.tableName}记录失败:`, error);
      throw error;
    }
  }

  /**
   * 更新记录
   * @param {number|string} id - 记录ID
   * @param {Object} data - 更新数据
   * @returns {Promise<Object|null>} 更新后的记录
   */
  async update(id, data) {
    try {
      // 验证数据结构
      const validatedData = this.validate(data);
      
      const fields = Object.keys(validatedData);
      const setClause = fields.map(field => `${field} = ?`).join(', ');
      const values = [...Object.values(validatedData), id];

      const sql = `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`;
      await database.query(sql, values);

      return this.findById(id);
    } catch (error) {
      this.logger.error(`更新${this.tableName}记录失败:`, error);
      throw error;
    }
  }

  /**
   * 删除记录
   * @param {number|string} id - 记录ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  async delete(id) {
    try {
      const sql = `DELETE FROM ${this.tableName} WHERE id = ?`;
      const [result] = await database.query(sql, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      this.logger.error(`删除${this.tableName}记录失败:`, error);
      throw error;
    }
  }

  /**
   * 验证数据结构
   * @param {Object} data - 待验证数据
   * @returns {Object} 验证后的数据
   */
  validate(data) {
    const validatedData = {};
    
    for (const [field, rules] of Object.entries(this.schema)) {
      if (data.hasOwnProperty(field)) {
        validatedData[field] = data[field];
      } else if (rules.required) {
        throw new Error(`字段 ${field} 是必填项`);
      }
    }
    
    return validatedData;
  }

  /**
   * 执行原始SQL查询
   * @param {string} sql - SQL查询语句
   * @param {Array} params - 查询参数
   * @returns {Promise<any>} 查询结果
   */
  async query(sql, params = []) {
    return database.query(sql, params);
  }
}

/**
 * ORM管理器
 */
class ORMManager {
  constructor() {
    this.models = {};
    this.logger = logger;
  }

  /**
   * 注册模型
   * @param {string} name - 模型名称
   * @param {string} tableName - 表名
   * @param {Object} schema - 模型schema
   * @returns {Model} 注册的模型
   */
  registerModel(name, tableName, schema = {}) {
    const model = new Model(tableName, schema);
    this.models[name] = model;
    this.logger.info(`模型 ${name} 已注册，映射表 ${tableName}`);
    return model;
  }

  /**
   * 获取模型
   * @param {string} name - 模型名称
   * @returns {Model} 模型实例
   */
  getModel(name) {
    if (!this.models[name]) {
      throw new Error(`模型 ${name} 未注册`);
    }
    return this.models[name];
  }
}

// 创建单例实例
const ormManager = new ORMManager();

module.exports = {
  Model,
  ORMManager,
  ormManager
};