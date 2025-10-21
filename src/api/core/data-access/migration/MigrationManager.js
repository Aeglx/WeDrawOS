/**
 * 数据迁移管理器
 * 提供数据库迁移和版本控制功能
 */

const logger = require('../../utils/logger');
const { AppError } = require('../../exception/handlers/errorHandler');
const { MigrationError } = require('../../exception/handlers/errorHandler');
const { FileUtils } = require('../../utils/file/FileUtils');
const { TimerUtils } = require('../../utils/timer/TimerUtils');
const { TransactionManager } = require('../database/TransactionManager');

/**
 * 迁移状态
 */
const MigrationStatus = {
  PENDING: 'pending',
  EXECUTING: 'executing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  SKIPPED: 'skipped'
};

/**
 * 迁移方向
 */
const MigrationDirection = {
  UP: 'up',
  DOWN: 'down'
};

/**
 * 数据迁移管理器
 */
class MigrationManager {
  /**
   * 构造函数
   * @param {Object} connection - 数据库连接
   * @param {Object} options - 配置选项
   */
  constructor(connection, options = {}) {
    this.connection = connection;
    this.options = {
      migrationsTable: 'migrations',
      migrationsDir: './migrations',
      migrationFilePattern: /^\d{14}_(\w+)\.js$/,
      transaction: true,
      autoCreateTable: true,
      timeout: 30000,
      ...options
    };

    this.transactionManager = new TransactionManager(connection, {
      defaultTimeout: this.options.timeout
    });
    this.timerUtils = TimerUtils.getInstance();
    this.migrations = [];
    this.appliedMigrations = new Map();

    logger.info('迁移管理器初始化完成', { options: this.options });
  }

  /**
   * 初始化迁移表
   * @returns {Promise<void>}
   */
  async initialize() {
    logger.info('初始化迁移管理器...');

    // 创建迁移表（如果不存在）
    if (this.options.autoCreateTable) {
      await this._createMigrationsTable();
    }

    // 加载已应用的迁移记录
    await this._loadAppliedMigrations();

    // 加载可用的迁移文件
    await this._loadMigrationsFromDir();

    logger.info(`迁移管理器初始化完成: 发现 ${this.migrations.length} 个迁移文件, 已应用 ${this.appliedMigrations.size} 个迁移`);
  }

  /**
   * 创建迁移表
   * @private
   * @returns {Promise<void>}
   */
  async _createMigrationsTable() {
    const tableName = this.options.migrationsTable;
    logger.debug(`创建迁移表: ${tableName}`);

    try {
      const createTableSql = `
        CREATE TABLE IF NOT EXISTS ${tableName} (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          filename VARCHAR(255) NOT NULL,
          direction VARCHAR(10) NOT NULL,
          status VARCHAR(20) NOT NULL,
          executed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          execution_time INTEGER,
          error TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_${tableName}_name ON ${tableName}(name);
        CREATE INDEX IF NOT EXISTS idx_${tableName}_status ON ${tableName}(status);
        CREATE INDEX IF NOT EXISTS idx_${tableName}_executed_at ON ${tableName}(executed_at);
      `;

      await this.connection.query(createTableSql);
      logger.debug(`迁移表 ${tableName} 创建成功`);
    } catch (error) {
      logger.error(`创建迁移表失败: ${error.message}`);
      throw new MigrationError('创建迁移表失败', error);
    }
  }

  /**
   * 加载已应用的迁移记录
   * @private
   * @returns {Promise<void>}
   */
  async _loadAppliedMigrations() {
    const tableName = this.options.migrationsTable;
    logger.debug('加载已应用的迁移记录');

    try {
      const result = await this.connection.query(
        `SELECT name, filename, direction, status, executed_at, execution_time 
         FROM ${tableName} 
         ORDER BY executed_at DESC`
      );

      result.rows.forEach(row => {
        this.appliedMigrations.set(row.name, row);
      });

      logger.debug(`已加载 ${this.appliedMigrations.size} 个已应用的迁移记录`);
    } catch (error) {
      logger.error(`加载已应用的迁移记录失败: ${error.message}`);
      throw new MigrationError('加载已应用的迁移记录失败', error);
    }
  }

  /**
   * 从目录加载迁移文件
   * @private
   * @returns {Promise<void>}
   */
  async _loadMigrationsFromDir() {
    const migrationsDir = this.options.migrationsDir;
    logger.debug(`从目录加载迁移文件: ${migrationsDir}`);

    try {
      // 确保迁移目录存在
      if (!await FileUtils.exists(migrationsDir)) {
        await FileUtils.createDirectory(migrationsDir);
        logger.debug(`迁移目录 ${migrationsDir} 不存在，已创建`);
        return;
      }

      // 读取目录中的所有文件
      const files = await FileUtils.readDirectory(migrationsDir);
      const migrationFiles = files.filter(file => 
        this.options.migrationFilePattern.test(file)
      );

      // 按文件名排序（按时间戳顺序）
      migrationFiles.sort();

      // 加载每个迁移文件
      for (const file of migrationFiles) {
        const filePath = `${migrationsDir}/${file}`;
        const match = file.match(this.options.migrationFilePattern);
        
        if (match) {
          const timestamp = file.substring(0, 14);
          const name = match[1];
          const fullName = `${timestamp}_${name}`;
          
          try {
            const migration = require(filePath);
            
            if (typeof migration.up !== 'function') {
              logger.warn(`迁移文件 ${file} 缺少 up 函数，将被跳过`);
              continue;
            }

            this.migrations.push({
              name: fullName,
              filename: file,
              path: filePath,
              timestamp,
              migration
            });
          } catch (error) {
            logger.error(`加载迁移文件 ${file} 失败: ${error.message}`);
            // 继续加载其他迁移文件
          }
        }
      }

      logger.debug(`从目录加载了 ${this.migrations.length} 个迁移文件`);
    } catch (error) {
      logger.error(`从目录加载迁移文件失败: ${error.message}`);
      throw new MigrationError('从目录加载迁移文件失败', error);
    }
  }

  /**
   * 创建新的迁移文件
   * @param {string} name - 迁移名称
   * @returns {Promise<string>} 创建的迁移文件路径
   */
  async createMigration(name) {
    if (!name || typeof name !== 'string') {
      throw new AppError('迁移名称必须是有效的字符串', {
        code: 'INVALID_MIGRATION_NAME',
        status: 400
      });
    }

    // 生成时间戳
    const now = new Date();
    const timestamp = now.toISOString()
      .replace(/[-:.TZ]/g, '')
      .substring(0, 14);

    const filename = `${timestamp}_${name}.js`;
    const filePath = `${this.options.migrationsDir}/${filename}`;

    // 创建迁移文件内容
    const migrationContent = this._generateMigrationTemplate(name, timestamp);

    try {
      // 确保迁移目录存在
      if (!await FileUtils.exists(this.options.migrationsDir)) {
        await FileUtils.createDirectory(this.options.migrationsDir);
      }

      // 写入迁移文件
      await FileUtils.writeFile(filePath, migrationContent);
      
      logger.info(`创建迁移文件成功: ${filename}`);
      
      // 重新加载迁移
      await this._loadMigrationsFromDir();
      
      return filePath;
    } catch (error) {
      logger.error(`创建迁移文件失败: ${error.message}`);
      throw new MigrationError('创建迁移文件失败', error);
    }
  }

  /**
   * 生成迁移文件模板
   * @private
   * @param {string} name - 迁移名称
   * @param {string} timestamp - 时间戳
   * @returns {string} 迁移文件模板内容
   */
  _generateMigrationTemplate(name, timestamp) {
    return `/**
 * 迁移: ${name}
 * 时间戳: ${timestamp}
 */

module.exports = {
  /**
   * 执行迁移
   * @param {Object} connection - 数据库连接
   * @returns {Promise<void>}
   */
  async up(connection) {
    // TODO: 实现迁移逻辑
    // 例如：创建表、添加列、更新数据等
    // await connection.query('CREATE TABLE example (...);');
  },

  /**
   * 回滚迁移
   * @param {Object} connection - 数据库连接
   * @returns {Promise<void>}
   */
  async down(connection) {
    // TODO: 实现回滚逻辑
    // 例如：删除表、删除列等
    // await connection.query('DROP TABLE IF EXISTS example;');
  }
};
`;
  }

  /**
   * 执行所有待处理的迁移
   * @returns {Promise<Object>} 迁移结果统计
   */
  async migrateUp() {
    logger.info('开始执行迁移...');

    const pendingMigrations = this._getPendingMigrations();
    const stats = {
      total: pendingMigrations.length,
      executed: 0,
      failed: 0,
      skipped: 0,
      results: []
    };

    if (pendingMigrations.length === 0) {
      logger.info('没有待执行的迁移');
      return stats;
    }

    logger.info(`找到 ${pendingMigrations.length} 个待执行的迁移`);

    // 逐个执行迁移
    for (const migration of pendingMigrations) {
      const result = await this._executeMigration(
        migration,
        MigrationDirection.UP
      );

      stats.results.push(result);
      stats.executed += result.status === MigrationStatus.COMPLETED ? 1 : 0;
      stats.failed += result.status === MigrationStatus.FAILED ? 1 : 0;
      stats.skipped += result.status === MigrationStatus.SKIPPED ? 1 : 0;

      // 如果迁移失败并且不是配置为继续，就停止执行
      if (result.status === MigrationStatus.FAILED && !this.options.continueOnError) {
        logger.error('迁移执行失败，已停止');
        break;
      }
    }

    logger.info(`迁移执行完成: 执行 ${stats.executed}, 失败 ${stats.failed}, 跳过 ${stats.skipped}`);
    return stats;
  }

  /**
   * 回滚迁移
   * @param {number} steps - 回滚的步数
   * @returns {Promise<Object>} 回滚结果统计
   */
  async migrateDown(steps = 1) {
    logger.info(`开始回滚 ${steps} 个迁移...`);

    const appliedMigrations = this._getAppliedMigrations()
      .slice(0, steps);

    const stats = {
      total: appliedMigrations.length,
      executed: 0,
      failed: 0,
      skipped: 0,
      results: []
    };

    if (appliedMigrations.length === 0) {
      logger.info('没有已应用的迁移可以回滚');
      return stats;
    }

    logger.info(`找到 ${appliedMigrations.length} 个已应用的迁移可以回滚`);

    // 逐个回滚迁移
    for (const migrationRecord of appliedMigrations) {
      const migration = this._findMigrationByName(migrationRecord.name);
      
      if (!migration) {
        logger.warn(`找不到迁移文件: ${migrationRecord.name}，无法回滚`);
        stats.skipped++;
        continue;
      }

      const result = await this._executeMigration(
        migration,
        MigrationDirection.DOWN
      );

      stats.results.push(result);
      stats.executed += result.status === MigrationStatus.COMPLETED ? 1 : 0;
      stats.failed += result.status === MigrationStatus.FAILED ? 1 : 0;

      // 如果回滚失败并且不是配置为继续，就停止执行
      if (result.status === MigrationStatus.FAILED && !this.options.continueOnError) {
        logger.error('迁移回滚失败，已停止');
        break;
      }
    }

    logger.info(`迁移回滚完成: 执行 ${stats.executed}, 失败 ${stats.failed}, 跳过 ${stats.skipped}`);
    return stats;
  }

  /**
   * 执行单个迁移
   * @private
   * @param {Object} migration - 迁移对象
   * @param {string} direction - 迁移方向
   * @returns {Promise<Object>} 迁移执行结果
   */
  async _executeMigration(migration, direction) {
    const result = {
      name: migration.name,
      filename: migration.filename,
      direction,
      status: MigrationStatus.PENDING,
      startTime: Date.now(),
      endTime: null,
      executionTime: null,
      error: null
    };

    logger.info(`正在${direction === MigrationDirection.UP ? '执行' : '回滚'}迁移: ${migration.name}`);
    
    // 检查迁移文件是否包含对应方向的函数
    const migrationFunc = migration.migration[direction];
    if (typeof migrationFunc !== 'function') {
      logger.warn(`迁移 ${migration.name} 缺少 ${direction} 函数，跳过`);
      result.status = MigrationStatus.SKIPPED;
      return result;
    }

    try {
      // 更新状态
      result.status = MigrationStatus.EXECUTING;

      // 执行迁移
      if (this.options.transaction) {
        // 在事务中执行
        await this.transactionManager.executeInTransaction(async (connection) => {
          await migrationFunc(connection);
          await this._recordMigration(connection, result);
        });
      } else {
        // 直接执行
        await migrationFunc(this.connection);
        await this._recordMigration(this.connection, result);
      }

      // 更新结果
      result.status = MigrationStatus.COMPLETED;
      result.endTime = Date.now();
      result.executionTime = result.endTime - result.startTime;

      // 更新内存中的应用迁移记录
      if (direction === MigrationDirection.UP) {
        this.appliedMigrations.set(migration.name, {
          name: migration.name,
          filename: migration.filename,
          direction,
          status: MigrationStatus.COMPLETED,
          executed_at: new Date(),
          execution_time: result.executionTime
        });
      } else {
        this.appliedMigrations.delete(migration.name);
      }

      logger.info(`迁移 ${migration.name} ${direction === MigrationDirection.UP ? '执行' : '回滚'}成功，耗时 ${result.executionTime}ms`);
    } catch (error) {
      // 更新错误状态
      result.status = MigrationStatus.FAILED;
      result.endTime = Date.now();
      result.executionTime = result.endTime - result.startTime;
      result.error = error.message;

      logger.error(`迁移 ${migration.name} ${direction === MigrationDirection.UP ? '执行' : '回滚'}失败: ${error.message}`);
      logger.debug('迁移错误详情', { stack: error.stack });

      // 记录失败的迁移
      if (this.options.transaction) {
        // 事务已经回滚，单独记录失败
        try {
          await this._recordMigration(this.connection, result);
        } catch (recordError) {
          logger.error('记录失败的迁移时出错', { error: recordError.message });
        }
      }
    }

    return result;
  }

  /**
   * 记录迁移执行记录
   * @private
   * @param {Object} connection - 数据库连接
   * @param {Object} result - 迁移结果
   * @returns {Promise<void>}
   */
  async _recordMigration(connection, result) {
    const tableName = this.options.migrationsTable;
    
    if (result.direction === MigrationDirection.UP) {
      // 记录UP迁移
      await connection.query(
        `INSERT INTO ${tableName} (name, filename, direction, status, execution_time, error)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (name) DO UPDATE SET
           status = EXCLUDED.status,
           execution_time = EXCLUDED.execution_time,
           error = EXCLUDED.error,
           executed_at = CURRENT_TIMESTAMP`,
        [result.name, result.filename, result.direction, result.status, result.executionTime, result.error]
      );
    } else {
      // 记录DOWN迁移（可以选择删除或标记为回滚）
      if (this.options.keepMigrationHistory) {
        await connection.query(
          `INSERT INTO ${tableName} (name, filename, direction, status, execution_time, error)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [result.name, result.filename, result.direction, result.status, result.executionTime, result.error]
        );
      } else {
        // 删除UP迁移记录
        await connection.query(
          `DELETE FROM ${tableName} WHERE name = $1 AND direction = $2`,
          [result.name, MigrationDirection.UP]
        );
      }
    }
  }

  /**
   * 获取待执行的迁移列表
   * @private
   * @returns {Array<Object>} 待执行的迁移列表
   */
  _getPendingMigrations() {
    return this.migrations.filter(migration => 
      !this.appliedMigrations.has(migration.name) || 
      this.appliedMigrations.get(migration.name).status === MigrationStatus.FAILED
    );
  }

  /**
   * 获取已应用的迁移列表
   * @private
   * @returns {Array<Object>} 已应用的迁移列表
   */
  _getAppliedMigrations() {
    return Array.from(this.appliedMigrations.values())
      .filter(record => record.direction === MigrationDirection.UP)
      .sort((a, b) => new Date(b.executed_at) - new Date(a.executed_at));
  }

  /**
   * 根据名称查找迁移
   * @private
   * @param {string} name - 迁移名称
   * @returns {Object|null} 迁移对象
   */
  _findMigrationByName(name) {
    return this.migrations.find(migration => migration.name === name) || null;
  }

  /**
   * 获取迁移状态
   * @returns {Promise<Object>} 迁移状态信息
   */
  async getStatus() {
    const pending = this._getPendingMigrations();
    const applied = this._getAppliedMigrations();

    return {
      pending: pending.map(m => ({ name: m.name, filename: m.filename })),
      applied: applied.map(m => ({
        name: m.name,
        filename: m.filename,
        executedAt: m.executed_at,
        executionTime: m.execution_time
      })),
      totalPending: pending.length,
      totalApplied: applied.length,
      totalMigrations: this.migrations.length,
      lastMigration: applied.length > 0 ? applied[0] : null
    };
  }

  /**
   * 重置所有迁移（危险操作！）
   * @returns {Promise<void>}
   */
  async reset() {
    logger.warn('警告: 正在执行迁移重置，这将删除所有迁移记录！');

    const tableName = this.options.migrationsTable;
    
    try {
      await this.connection.query(`DELETE FROM ${tableName}`);
      this.appliedMigrations.clear();
      
      logger.info('迁移记录已重置');
    } catch (error) {
      logger.error('重置迁移记录失败', { error: error.message });
      throw new MigrationError('重置迁移记录失败', error);
    }
  }

  /**
   * 验证迁移状态
   * @returns {Promise<boolean>} 迁移状态是否有效
   */
  async validate() {
    const status = await this.getStatus();
    
    // 检查是否有重复的迁移名称
    const migrationNames = new Set();
    let hasDuplicates = false;
    
    for (const migration of this.migrations) {
      if (migrationNames.has(migration.name)) {
        logger.error(`发现重复的迁移名称: ${migration.name}`);
        hasDuplicates = true;
      }
      migrationNames.add(migration.name);
    }

    // 检查迁移文件是否都包含必要的函数
    let hasInvalidMigrations = false;
    
    for (const migration of this.migrations) {
      if (typeof migration.migration.up !== 'function') {
        logger.error(`迁移 ${migration.name} 缺少 up 函数`);
        hasInvalidMigrations = true;
      }
      if (typeof migration.migration.down !== 'function') {
        logger.warn(`迁移 ${migration.name} 缺少 down 函数`);
      }
    }

    const isValid = !hasDuplicates && !hasInvalidMigrations;
    
    if (isValid) {
      logger.info('迁移状态验证通过');
    } else {
      logger.error('迁移状态验证失败');
    }

    return isValid;
  }

  /**
   * 生成迁移报告
   * @returns {Promise<Object>} 迁移报告
   */
  async generateReport() {
    const status = await this.getStatus();
    const validation = await this.validate();

    return {
      status,
      validation: {
        isValid: validation,
        timestamp: new Date()
      },
      configuration: {
        migrationsTable: this.options.migrationsTable,
        migrationsDir: this.options.migrationsDir,
        useTransactions: this.options.transaction,
        autoCreateTable: this.options.autoCreateTable
      }
    };
  }

  /**
   * 获取迁移历史记录
   * @param {Object} options - 查询选项
   * @returns {Promise<Array<Object>>} 迁移历史记录
   */
  async getHistory(options = {}) {
    const { limit = 50, offset = 0, status } = options;
    const tableName = this.options.migrationsTable;

    let query = `SELECT * FROM ${tableName} ORDER BY executed_at DESC`;
    const params = [];

    if (status) {
      query = `SELECT * FROM ${tableName} WHERE status = $1 ORDER BY executed_at DESC`;
      params.push(status);
    }

    query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await this.connection.query(query, params);
    return result.rows;
  }

  /**
   * 获取迁移状态枚举
   * @returns {Object} 迁移状态枚举
   */
  static getStatusEnum() {
    return { ...MigrationStatus };
  }

  /**
   * 获取迁移方向枚举
   * @returns {Object} 迁移方向枚举
   */
  static getDirectionEnum() {
    return { ...MigrationDirection };
  }
}

module.exports = {
  MigrationManager,
  MigrationStatus,
  MigrationDirection
};