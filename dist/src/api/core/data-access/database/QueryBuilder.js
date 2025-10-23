/**
 * 数据库查询构建器
 * 提供SQL查询构建、参数绑定和查询优化功能
 */

const logger = require('../../utils/logger');
const { AppError } = require('../../exception/handlers/errorHandler');
const { QueryError } = require('../../exception/handlers/errorHandler');

/**
 * 查询操作类型
 */
const QueryType = {
  SELECT: 'SELECT',
  INSERT: 'INSERT',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  COUNT: 'COUNT',
  AGGREGATE: 'AGGREGATE',
  RAW: 'RAW'
};

/**
 * 查询操作符
 */
const Operator = {
  EQUAL: '=',
  NOT_EQUAL: '!=',
  GREATER_THAN: '>',
  GREATER_THAN_OR_EQUAL: '>=',
  LESS_THAN: '<',
  LESS_THAN_OR_EQUAL: '<=',
  LIKE: 'LIKE',
  NOT_LIKE: 'NOT LIKE',
  IN: 'IN',
  NOT_IN: 'NOT IN',
  BETWEEN: 'BETWEEN',
  NOT_BETWEEN: 'NOT BETWEEN',
  IS_NULL: 'IS NULL',
  IS_NOT_NULL: 'IS NOT NULL',
  EXISTS: 'EXISTS',
  NOT_EXISTS: 'NOT EXISTS',
  REGEXP: 'REGEXP',
  NOT_REGEXP: 'NOT REGEXP'
};

/**
 * 排序方向
 */
const SortDirection = {
  ASC: 'ASC',
  DESC: 'DESC'
};

/**
 * 连接类型
 */
const JoinType = {
  INNER: 'INNER JOIN',
  LEFT: 'LEFT JOIN',
  RIGHT: 'RIGHT JOIN',
  FULL: 'FULL JOIN',
  CROSS: 'CROSS JOIN',
  NATURAL: 'NATURAL JOIN'
};

/**
 * 查询构建器
 */
class QueryBuilder {
  /**
   * 构造函数
   * @param {string} table - 表名
   * @param {Object} options - 配置选项
   */
  constructor(table, options = {}) {
    this.table = table;
    this.options = {
      escapeChar: '`', // 默认使用反引号作为标识符转义字符
      paramPrefix: '$', // 参数前缀
      caseSensitive: false,
      ...options
    };

    this.queryType = QueryType.SELECT;
    this.columns = [];
    this.joins = [];
    this.whereConditions = [];
    this.groupBy = [];
    this.havingConditions = [];
    this.orderBy = [];
    this.limit = null;
    this.offset = null;
    this.parameters = [];
    this.rawQuery = null;
    this.insertData = [];
    this.updateData = {};
    this.returningColumns = [];
    this.distinct = false;
    this.forUpdate = false;
    this.forShare = false;

    logger.debug('创建查询构建器实例', { table, options });
  }

  /**
   * 设置查询类型为SELECT
   * @param {Array<string>|string} columns - 要选择的列
   * @returns {QueryBuilder} 查询构建器实例
   */
  select(columns = ['*']) {
    this.queryType = QueryType.SELECT;
    this.columns = Array.isArray(columns) ? columns : [columns];
    return this;
  }

  /**
   * 设置查询类型为INSERT
   * @param {Object|Array<Object>} data - 要插入的数据
   * @returns {QueryBuilder} 查询构建器实例
   */
  insert(data) {
    this.queryType = QueryType.INSERT;
    this.insertData = Array.isArray(data) ? data : [data];
    return this;
  }

  /**
   * 设置查询类型为UPDATE
   * @param {Object} data - 要更新的数据
   * @returns {QueryBuilder} 查询构建器实例
   */
  update(data) {
    this.queryType = QueryType.UPDATE;
    this.updateData = data;
    return this;
  }

  /**
   * 设置查询类型为DELETE
   * @returns {QueryBuilder} 查询构建器实例
   */
  delete() {
    this.queryType = QueryType.DELETE;
    return this;
  }

  /**
   * 设置查询类型为COUNT
   * @param {string} column - 要计数的列，默认为 *
   * @returns {QueryBuilder} 查询构建器实例
   */
  count(column = '*') {
    this.queryType = QueryType.COUNT;
    this.columns = [`COUNT(${this._escapeIdentifier(column)}) as count`];
    return this;
  }

  /**
   * 设置原始SQL查询
   * @param {string} query - 原始SQL查询
   * @param {Array} params - 查询参数
   * @returns {QueryBuilder} 查询构建器实例
   */
  raw(query, params = []) {
    this.queryType = QueryType.RAW;
    this.rawQuery = query;
    this.parameters = params;
    return this;
  }

  /**
   * 添加JOIN子句
   * @param {string} table - 要连接的表名
   * @param {string|Array} condition - 连接条件
   * @param {string} type - 连接类型
   * @returns {QueryBuilder} 查询构建器实例
   */
  join(table, condition, type = JoinType.INNER) {
    this.joins.push({
      table,
      condition,
      type
    });
    return this;
  }

  /**
   * 添加LEFT JOIN子句
   * @param {string} table - 要连接的表名
   * @param {string|Array} condition - 连接条件
   * @returns {QueryBuilder} 查询构建器实例
   */
  leftJoin(table, condition) {
    return this.join(table, condition, JoinType.LEFT);
  }

  /**
   * 添加RIGHT JOIN子句
   * @param {string} table - 要连接的表名
   * @param {string|Array} condition - 连接条件
   * @returns {QueryBuilder} 查询构建器实例
   */
  rightJoin(table, condition) {
    return this.join(table, condition, JoinType.RIGHT);
  }

  /**
   * 添加WHERE子句
   * @param {string|Object} field - 字段名或条件对象
   * @param {string} [operator] - 操作符
   * @param {*} [value] - 值
   * @returns {QueryBuilder} 查询构建器实例
   */
  where(field, operator, value) {
    if (typeof field === 'object') {
      // 如果field是对象，遍历对象的键值对
      Object.entries(field).forEach(([key, val]) => {
        this._addWhereCondition(key, Operator.EQUAL, val);
      });
    } else if (arguments.length === 2) {
      // 如果只有两个参数，默认为等于操作
      this._addWhereCondition(field, Operator.EQUAL, operator);
    } else {
      // 标准三个参数的调用方式
      this._addWhereCondition(field, operator, value);
    }
    return this;
  }

  /**
   * 添加OR WHERE子句
   * @param {string|Object} field - 字段名或条件对象
   * @param {string} [operator] - 操作符
   * @param {*} [value] - 值
   * @returns {QueryBuilder} 查询构建器实例
   */
  orWhere(field, operator, value) {
    const condition = { type: 'OR' };
    this.whereConditions.push(condition);
    
    if (typeof field === 'object') {
      Object.entries(field).forEach(([key, val]) => {
        this._addWhereCondition(key, Operator.EQUAL, val);
      });
    } else if (arguments.length === 2) {
      this._addWhereCondition(field, Operator.EQUAL, operator);
    } else {
      this._addWhereCondition(field, operator, value);
    }
    return this;
  }

  /**
   * 添加WHERE IN子句
   * @param {string} field - 字段名
   * @param {Array} values - 值数组
   * @returns {QueryBuilder} 查询构建器实例
   */
  whereIn(field, values) {
    return this._addWhereCondition(field, Operator.IN, values);
  }

  /**
   * 添加WHERE NOT IN子句
   * @param {string} field - 字段名
   * @param {Array} values - 值数组
   * @returns {QueryBuilder} 查询构建器实例
   */
  whereNotIn(field, values) {
    return this._addWhereCondition(field, Operator.NOT_IN, values);
  }

  /**
   * 添加WHERE BETWEEN子句
   * @param {string} field - 字段名
   * @param {*} start - 起始值
   * @param {*} end - 结束值
   * @returns {QueryBuilder} 查询构建器实例
   */
  whereBetween(field, start, end) {
    return this._addWhereCondition(field, Operator.BETWEEN, [start, end]);
  }

  /**
   * 添加WHERE NOT BETWEEN子句
   * @param {string} field - 字段名
   * @param {*} start - 起始值
   * @param {*} end - 结束值
   * @returns {QueryBuilder} 查询构建器实例
   */
  whereNotBetween(field, start, end) {
    return this._addWhereCondition(field, Operator.NOT_BETWEEN, [start, end]);
  }

  /**
   * 添加WHERE IS NULL子句
   * @param {string} field - 字段名
   * @returns {QueryBuilder} 查询构建器实例
   */
  whereNull(field) {
    return this._addWhereCondition(field, Operator.IS_NULL, null);
  }

  /**
   * 添加WHERE IS NOT NULL子句
   * @param {string} field - 字段名
   * @returns {QueryBuilder} 查询构建器实例
   */
  whereNotNull(field) {
    return this._addWhereCondition(field, Operator.IS_NOT_NULL, null);
  }

  /**
   * 添加WHERE LIKE子句
   * @param {string} field - 字段名
   * @param {string} pattern - 匹配模式
   * @returns {QueryBuilder} 查询构建器实例
   */
  whereLike(field, pattern) {
    return this._addWhereCondition(field, Operator.LIKE, pattern);
  }

  /**
   * 添加WHERE NOT LIKE子句
   * @param {string} field - 字段名
   * @param {string} pattern - 匹配模式
   * @returns {QueryBuilder} 查询构建器实例
   */
  whereNotLike(field, pattern) {
    return this._addWhereCondition(field, Operator.NOT_LIKE, pattern);
  }

  /**
   * 添加GROUP BY子句
   * @param {Array<string>|string} fields - 分组字段
   * @returns {QueryBuilder} 查询构建器实例
   */
  groupBy(fields) {
    const groupFields = Array.isArray(fields) ? fields : [fields];
    this.groupBy = this.groupBy.concat(groupFields);
    return this;
  }

  /**
   * 添加HAVING子句
   * @param {string|Object} field - 字段名或条件对象
   * @param {string} [operator] - 操作符
   * @param {*} [value] - 值
   * @returns {QueryBuilder} 查询构建器实例
   */
  having(field, operator, value) {
    if (typeof field === 'object') {
      Object.entries(field).forEach(([key, val]) => {
        this._addHavingCondition(key, Operator.EQUAL, val);
      });
    } else if (arguments.length === 2) {
      this._addHavingCondition(field, Operator.EQUAL, operator);
    } else {
      this._addHavingCondition(field, operator, value);
    }
    return this;
  }

  /**
   * 添加ORDER BY子句
   * @param {string|Object} field - 字段名或排序对象
   * @param {string} [direction] - 排序方向
   * @returns {QueryBuilder} 查询构建器实例
   */
  orderBy(field, direction = SortDirection.ASC) {
    if (typeof field === 'object') {
      Object.entries(field).forEach(([key, val]) => {
        this.orderBy.push({
          field: key,
          direction: val
        });
      });
    } else {
      this.orderBy.push({
        field,
        direction
      });
    }
    return this;
  }

  /**
   * 设置LIMIT子句
   * @param {number} limit - 限制数量
   * @returns {QueryBuilder} 查询构建器实例
   */
  limit(limit) {
    this.limit = limit;
    return this;
  }

  /**
   * 设置OFFSET子句
   * @param {number} offset - 偏移量
   * @returns {QueryBuilder} 查询构建器实例
   */
  offset(offset) {
    this.offset = offset;
    return this;
  }

  /**
   * 设置分页
   * @param {number} page - 页码，从1开始
   * @param {number} pageSize - 每页大小
   * @returns {QueryBuilder} 查询构建器实例
   */
  paginate(page, pageSize) {
    this.offset = (page - 1) * pageSize;
    this.limit = pageSize;
    return this;
  }

  /**
   * 添加RETURNING子句（用于PostgreSQL等支持的数据库）
   * @param {Array<string>|string} columns - 要返回的列
   * @returns {QueryBuilder} 查询构建器实例
   */
  returning(columns = ['*']) {
    this.returningColumns = Array.isArray(columns) ? columns : [columns];
    return this;
  }

  /**
   * 设置DISTINCT
   * @returns {QueryBuilder} 查询构建器实例
   */
  distinct() {
    this.distinct = true;
    return this;
  }

  /**
   * 设置FOR UPDATE锁
   * @returns {QueryBuilder} 查询构建器实例
   */
  forUpdate() {
    this.forUpdate = true;
    return this;
  }

  /**
   * 设置FOR SHARE锁
   * @returns {QueryBuilder} 查询构建器实例
   */
  forShare() {
    this.forShare = true;
    return this;
  }

  /**
   * 构建SQL查询
   * @returns {Object} 包含sql和parameters的对象
   */
  build() {
    try {
      logger.debug('开始构建SQL查询', { table: this.table, queryType: this.queryType });

      let sql = '';
      this.parameters = [];

      switch (this.queryType) {
        case QueryType.SELECT:
        case QueryType.COUNT:
          sql = this._buildSelectQuery();
          break;
        case QueryType.INSERT:
          sql = this._buildInsertQuery();
          break;
        case QueryType.UPDATE:
          sql = this._buildUpdateQuery();
          break;
        case QueryType.DELETE:
          sql = this._buildDeleteQuery();
          break;
        case QueryType.RAW:
          sql = this.rawQuery;
          break;
        default:
          throw new AppError('不支持的查询类型', {
            code: 'UNSUPPORTED_QUERY_TYPE',
            status: 400
          });
      }

      const result = { sql, parameters: this.parameters };
      logger.debug('SQL查询构建完成', result);
      return result;
    } catch (error) {
      logger.error('构建SQL查询失败', { error: error.message });
      throw new QueryError('构建SQL查询失败', error);
    }
  }

  /**
   * 构建SELECT查询
   * @private
   * @returns {string} SQL查询字符串
   */
  _buildSelectQuery() {
    let sql = 'SELECT ';

    // 添加DISTINCT
    if (this.distinct) {
      sql += 'DISTINCT ';
    }

    // 添加列
    sql += this._buildColumnsList();

    // 添加FROM子句
    sql += ` FROM ${this._escapeIdentifier(this.table)}`;

    // 添加JOIN子句
    sql += this._buildJoinClauses();

    // 添加WHERE子句
    sql += this._buildWhereClause();

    // 添加GROUP BY子句
    sql += this._buildGroupByClause();

    // 添加HAVING子句
    sql += this._buildHavingClause();

    // 添加ORDER BY子句
    sql += this._buildOrderByClause();

    // 添加LIMIT和OFFSET子句
    sql += this._buildLimitOffsetClause();

    // 添加锁子句
    sql += this._buildLockClause();

    return sql;
  }

  /**
   * 构建INSERT查询
   * @private
   * @returns {string} SQL查询字符串
   */
  _buildInsertQuery() {
    if (!this.insertData || this.insertData.length === 0) {
      throw new AppError('没有提供要插入的数据', {
        code: 'NO_INSERT_DATA',
        status: 400
      });
    }

    // 获取字段名（使用第一条记录）
    const fields = Object.keys(this.insertData[0]);
    const fieldList = fields.map(field => this._escapeIdentifier(field)).join(', ');

    let sql = `INSERT INTO ${this._escapeIdentifier(this.table)} (${fieldList}) VALUES `;

    // 构建值列表
    const valueLists = this.insertData.map(row => {
      const values = fields.map(field => {
        this.parameters.push(row[field]);
        return `${this.options.paramPrefix}${this.parameters.length}`;
      });
      return `(${values.join(', ')})`;
    });

    sql += valueLists.join(', ');

    // 添加RETURNING子句
    if (this.returningColumns.length > 0) {
      const returningList = this.returningColumns.map(col => this._escapeIdentifier(col)).join(', ');
      sql += ` RETURNING ${returningList}`;
    }

    return sql;
  }

  /**
   * 构建UPDATE查询
   * @private
   * @returns {string} SQL查询字符串
   */
  _buildUpdateQuery() {
    if (!this.updateData || Object.keys(this.updateData).length === 0) {
      throw new AppError('没有提供要更新的数据', {
        code: 'NO_UPDATE_DATA',
        status: 400
      });
    }

    let sql = `UPDATE ${this._escapeIdentifier(this.table)} SET `;

    // 构建SET子句
    const setClauses = Object.entries(this.updateData).map(([field, value]) => {
      this.parameters.push(value);
      return `${this._escapeIdentifier(field)} = ${this.options.paramPrefix}${this.parameters.length}`;
    });

    sql += setClauses.join(', ');

    // 添加WHERE子句
    sql += this._buildWhereClause();

    // 添加RETURNING子句
    if (this.returningColumns.length > 0) {
      const returningList = this.returningColumns.map(col => this._escapeIdentifier(col)).join(', ');
      sql += ` RETURNING ${returningList}`;
    }

    return sql;
  }

  /**
   * 构建DELETE查询
   * @private
   * @returns {string} SQL查询字符串
   */
  _buildDeleteQuery() {
    let sql = `DELETE FROM ${this._escapeIdentifier(this.table)}`;

    // 添加WHERE子句
    sql += this._buildWhereClause();

    // 添加RETURNING子句
    if (this.returningColumns.length > 0) {
      const returningList = this.returningColumns.map(col => this._escapeIdentifier(col)).join(', ');
      sql += ` RETURNING ${returningList}`;
    }

    return sql;
  }

  /**
   * 构建列列表
   * @private
   * @returns {string} 列列表字符串
   */
  _buildColumnsList() {
    if (!this.columns || this.columns.length === 0) {
      return '*';
    }

    return this.columns.map(column => {
      // 如果列包含函数或别名，不进行转义
      if (column.includes('(') || column.includes('AS ') || column.includes('as ')) {
        return column;
      }
      return this._escapeIdentifier(column);
    }).join(', ');
  }

  /**
   * 构建JOIN子句
   * @private
   * @returns {string} JOIN子句字符串
   */
  _buildJoinClauses() {
    if (!this.joins || this.joins.length === 0) {
      return '';
    }

    return this.joins.map(join => {
      let joinSql = ` ${join.type} ${this._escapeIdentifier(join.table)}`;
      
      if (join.condition) {
        joinSql += ' ON ';
        
        if (Array.isArray(join.condition)) {
          // 如果是条件数组，使用AND连接
          joinSql += join.condition.join(' AND ');
        } else {
          // 如果是单个条件，直接使用
          joinSql += join.condition;
        }
      }
      
      return joinSql;
    }).join('');
  }

  /**
   * 构建WHERE子句
   * @private
   * @returns {string} WHERE子句字符串
   */
  _buildWhereClause() {
    if (!this.whereConditions || this.whereConditions.length === 0) {
      return '';
    }

    let whereSql = ' WHERE ';
    let conditions = [];

    this.whereConditions.forEach(condition => {
      if (condition.type === 'OR') {
        if (conditions.length > 0) {
          conditions.push('OR');
        }
      } else {
        conditions.push(this._buildConditionString(condition));
      }
    });

    whereSql += conditions.join(' ');
    return whereSql;
  }

  /**
   * 构建GROUP BY子句
   * @private
   * @returns {string} GROUP BY子句字符串
   */
  _buildGroupByClause() {
    if (!this.groupBy || this.groupBy.length === 0) {
      return '';
    }

    const groupByList = this.groupBy.map(field => 
      this._escapeIdentifier(field)
    ).join(', ');

    return ` GROUP BY ${groupByList}`;
  }

  /**
   * 构建HAVING子句
   * @private
   * @returns {string} HAVING子句字符串
   */
  _buildHavingClause() {
    if (!this.havingConditions || this.havingConditions.length === 0) {
      return '';
    }

    let havingSql = ' HAVING ';
    const conditions = this.havingConditions.map(condition => 
      this._buildConditionString(condition)
    );

    havingSql += conditions.join(' AND ');
    return havingSql;
  }

  /**
   * 构建ORDER BY子句
   * @private
   * @returns {string} ORDER BY子句字符串
   */
  _buildOrderByClause() {
    if (!this.orderBy || this.orderBy.length === 0) {
      return '';
    }

    const orderByList = this.orderBy.map(order => 
      `${this._escapeIdentifier(order.field)} ${order.direction}`
    ).join(', ');

    return ` ORDER BY ${orderByList}`;
  }

  /**
   * 构建LIMIT和OFFSET子句
   * @private
   * @returns {string} LIMIT和OFFSET子句字符串
   */
  _buildLimitOffsetClause() {
    let limitOffsetSql = '';

    if (this.limit !== null) {
      limitOffsetSql += ` LIMIT ${this.limit}`;
      
      if (this.offset !== null) {
        limitOffsetSql += ` OFFSET ${this.offset}`;
      }
    }

    return limitOffsetSql;
  }

  /**
   * 构建锁子句
   * @private
   * @returns {string} 锁子句字符串
   */
  _buildLockClause() {
    if (this.forUpdate) {
      return ' FOR UPDATE';
    } else if (this.forShare) {
      return ' FOR SHARE';
    }
    return '';
  }

  /**
   * 添加WHERE条件
   * @private
   * @param {string} field - 字段名
   * @param {string} operator - 操作符
   * @param {*} value - 值
   * @returns {QueryBuilder} 查询构建器实例
   */
  _addWhereCondition(field, operator, value) {
    this.whereConditions.push({
      field,
      operator,
      value
    });
    return this;
  }

  /**
   * 添加HAVING条件
   * @private
   * @param {string} field - 字段名
   * @param {string} operator - 操作符
   * @param {*} value - 值
   * @returns {QueryBuilder} 查询构建器实例
   */
  _addHavingCondition(field, operator, value) {
    this.havingConditions.push({
      field,
      operator,
      value
    });
    return this;
  }

  /**
   * 构建条件字符串
   * @private
   * @param {Object} condition - 条件对象
   * @returns {string} 条件字符串
   */
  _buildConditionString(condition) {
    const { field, operator, value } = condition;
    const escapedField = this._escapeIdentifier(field);

    switch (operator) {
      case Operator.IS_NULL:
      case Operator.IS_NOT_NULL:
        return `${escapedField} ${operator}`;
      
      case Operator.IN:
      case Operator.NOT_IN:
        if (!Array.isArray(value) || value.length === 0) {
          return '';
        }
        
        const placeholders = value.map(() => {
          this.parameters.push(value[this.parameters.length]);
          return `${this.options.paramPrefix}${this.parameters.length}`;
        }).join(', ');
        
        return `${escapedField} ${operator} (${placeholders})`;
      
      case Operator.BETWEEN:
      case Operator.NOT_BETWEEN:
        if (!Array.isArray(value) || value.length !== 2) {
          return '';
        }
        
        this.parameters.push(value[0]);
        const startPlaceholder = `${this.options.paramPrefix}${this.parameters.length}`;
        
        this.parameters.push(value[1]);
        const endPlaceholder = `${this.options.paramPrefix}${this.parameters.length}`;
        
        return `${escapedField} ${operator} ${startPlaceholder} AND ${endPlaceholder}`;
      
      default:
        this.parameters.push(value);
        const placeholder = `${this.options.paramPrefix}${this.parameters.length}`;
        return `${escapedField} ${operator} ${placeholder}`;
    }
  }

  /**
   * 转义SQL标识符
   * @private
   * @param {string} identifier - 标识符
   * @returns {string} 转义后的标识符
   */
  _escapeIdentifier(identifier) {
    if (!identifier || identifier === '*') {
      return identifier;
    }

    // 如果标识符已经包含转义字符，不重复转义
    if (identifier.startsWith(this.options.escapeChar) && 
        identifier.endsWith(this.options.escapeChar)) {
      return identifier;
    }

    // 处理表别名
    if (identifier.includes('.')) {
      return identifier.split('.')
        .map(part => `${this.options.escapeChar}${part}${this.options.escapeChar}`)
        .join('.');
    }

    return `${this.options.escapeChar}${identifier}${this.options.escapeChar}`;
  }

  /**
   * 执行查询
   * @param {Object} connection - 数据库连接
   * @returns {Promise<any>} 查询结果
   */
  async execute(connection) {
    try {
      const { sql, parameters } = this.build();
      logger.debug('执行SQL查询', { sql, parameterCount: parameters.length });

      const startTime = Date.now();
      let result;

      if (connection.query) {
        result = await connection.query(sql, parameters);
      } else if (connection.execute) {
        result = await connection.execute(sql, parameters);
      } else {
        throw new AppError('不支持的数据库连接接口', {
          code: 'UNSUPPORTED_CONNECTION_INTERFACE',
          status: 500
        });
      }

      const duration = Date.now() - startTime;
      logger.debug('SQL查询执行完成', { duration, queryType: this.queryType });

      return result;
    } catch (error) {
      logger.error('执行SQL查询失败', { error: error.message });
      throw new QueryError('执行SQL查询失败', error);
    }
  }

  /**
   * 克隆查询构建器
   * @returns {QueryBuilder} 新的查询构建器实例
   */
  clone() {
    const cloned = new QueryBuilder(this.table, this.options);
    
    cloned.queryType = this.queryType;
    cloned.columns = [...this.columns];
    cloned.joins = JSON.parse(JSON.stringify(this.joins));
    cloned.whereConditions = JSON.parse(JSON.stringify(this.whereConditions));
    cloned.groupBy = [...this.groupBy];
    cloned.havingConditions = JSON.parse(JSON.stringify(this.havingConditions));
    cloned.orderBy = JSON.parse(JSON.stringify(this.orderBy));
    cloned.limit = this.limit;
    cloned.offset = this.offset;
    cloned.parameters = [...this.parameters];
    cloned.rawQuery = this.rawQuery;
    cloned.insertData = JSON.parse(JSON.stringify(this.insertData));
    cloned.updateData = { ...this.updateData };
    cloned.returningColumns = [...this.returningColumns];
    cloned.distinct = this.distinct;
    cloned.forUpdate = this.forUpdate;
    cloned.forShare = this.forShare;
    
    return cloned;
  }

  /**
   * 获取查询类型枚举
   * @returns {Object} 查询类型枚举
   */
  static getQueryTypes() {
    return { ...QueryType };
  }

  /**
   * 获取操作符枚举
   * @returns {Object} 操作符枚举
   */
  static getOperators() {
    return { ...Operator };
  }

  /**
   * 获取排序方向枚举
   * @returns {Object} 排序方向枚举
   */
  static getSortDirections() {
    return { ...SortDirection };
  }

  /**
   * 获取连接类型枚举
   * @returns {Object} 连接类型枚举
   */
  static getJoinTypes() {
    return { ...JoinType };
  }
}

module.exports = {
  QueryBuilder,
  QueryType,
  Operator,
  SortDirection,
  JoinType
};