/**
 * 基础数据仓库类
 * 提供通用的数据访问方法，所有数据仓库都应继承此类
 */

const di = require('../di/container');

class BaseRepository {
  constructor() {
    this.di = di;
  }

  /**
   * 获取数据库连接
   * @returns {Promise<Object>} 数据库连接对象
   */
  async getConnection() {
    if (!this._connection) {
      this._connection = await this.di.resolve('database').getConnection();
    }
    return this._connection;
  }

  /**
   * 获取logger
   * @returns {Object} logger实例
   */
  getLogger() {
    if (!this._logger) {
      this._logger = this.di.resolve('logger');
    }
    return this._logger;
  }

  /**
   * 执行SQL查询
   * @param {string} sql - SQL语句
   * @param {Array} params - 参数数组
   * @returns {Promise<Array>} 查询结果
   */
  async query(sql, params = []) {
    try {
      const connection = await this.getConnection();
      this.getLogger().debug('执行SQL查询', { sql, params });
      const [rows] = await connection.query(sql, params);
      return rows;
    } catch (error) {
      this.getLogger().error('SQL查询失败', { sql, params, error: error.message });
      throw error;
    }
  }

  /**
   * 执行SQL更新
   * @param {string} sql - SQL语句
   * @param {Array} params - 参数数组
   * @returns {Promise<Object>} 更新结果
   */
  async execute(sql, params = []) {
    try {
      const connection = await this.getConnection();
      this.getLogger().debug('执行SQL更新', { sql, params });
      const [result] = await connection.execute(sql, params);
      return result;
    } catch (error) {
      this.getLogger().error('SQL更新失败', { sql, params, error: error.message });
      throw error;
    }
  }

  /**
   * 开始事务
   * @returns {Promise<Object>} 事务连接
   */
  async beginTransaction() {
    try {
      const connection = await this.getConnection();
      await connection.beginTransaction();
      this.getLogger().debug('开始事务');
      return connection;
    } catch (error) {
      this.getLogger().error('开始事务失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 提交事务
   * @param {Object} connection - 事务连接
   * @returns {Promise<void>}
   */
  async commit(connection) {
    try {
      await connection.commit();
      this.getLogger().debug('提交事务');
    } catch (error) {
      this.getLogger().error('提交事务失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 回滚事务
   * @param {Object} connection - 事务连接
   * @returns {Promise<void>}
   */
  async rollback(connection) {
    try {
      await connection.rollback();
      this.getLogger().debug('回滚事务');
    } catch (error) {
      this.getLogger().error('回滚事务失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 获取最后插入的ID
   * @param {Object} result - 插入结果
   * @returns {number} 最后插入的ID
   */
  getLastInsertId(result) {
    return result.insertId;
  }

  /**
   * 获取受影响的行数
   * @param {Object} result - 执行结果
   * @returns {number} 受影响的行数
   */
  getAffectedRows(result) {
    return result.affectedRows;
  }
}

module.exports = BaseRepository;