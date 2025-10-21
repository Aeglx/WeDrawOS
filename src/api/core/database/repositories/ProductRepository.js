/**
 * 产品仓库模块
 * 负责产品相关的数据库操作
 */

// 导入基础仓库和错误类
const Repository = require('../repository');
const {
  AppError,
  DatabaseError,
  ValidationError
} = require('../../errors/appError');

/**
 * 产品仓库类
 */
class ProductRepository extends Repository {
  constructor(database, logger) {
    super(database, 'products', logger);
  }

  /**
   * 创建新产品
   * @param {Object} productData - 产品数据
   * @returns {Promise<Object>} 创建的产品
   */
  async create(productData) {
    try {
      // 开始事务
      const transaction = await this.database.beginTransaction();
      
      try {
        // 准备SQL
        const query = `
          INSERT INTO products 
          (name, description, price, discount_price, stock_quantity, 
           category_id, brand, sku, images, is_active, featured, 
           attributes, created_by, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        // 转换images为JSON字符串
        const imagesJson = JSON.stringify(productData.images || []);
        const attributesJson = JSON.stringify(productData.attributes || {});
        
        // 执行插入
        const params = [
          productData.name,
          productData.description,
          productData.price,
          productData.discount_price,
          productData.stock_quantity,
          productData.category_id,
          productData.brand,
          productData.sku,
          imagesJson,
          productData.is_active,
          productData.featured,
          attributesJson,
          productData.created_by,
          productData.created_at,
          productData.updated_at
        ];
        
        const result = await this.database.executeQuery(
          query,
          params,
          { transaction }
        );
        
        // 获取创建的产品
        const productId = result.insertId;
        const createdProduct = await this.findById(productId, { transaction });
        
        // 提交事务
        await transaction.commit();
        
        return createdProduct;
      } catch (error) {
        // 回滚事务
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      this.logger.error('Failed to create product', error);
      if (error.code === 'ER_DUP_ENTRY') {
        throw new ValidationError('SKU already exists', { sku: 'This SKU is already in use' });
      }
      throw new DatabaseError('Failed to create product', error);
    }
  }

  /**
   * 根据ID查找产品
   * @param {number} id - 产品ID
   * @param {Object} options - 查询选项
   * @returns {Promise<Object|null>} 产品对象或null
   */
  async findById(id, options = {}) {
    try {
      const query = `
        SELECT * FROM products 
        WHERE id = ?
        ${options.includeDeleted ? '' : ' AND deleted_at IS NULL'}
      `;
      
      const params = [id];
      const result = await this.database.executeQuery(
        query,
        params,
        { transaction: options.transaction }
      );
      
      if (result.length === 0) {
        return null;
      }
      
      // 解析JSON字段
      return this._parseProduct(result[0]);
    } catch (error) {
      this.logger.error(`Failed to find product by ID: ${id}`, error);
      throw new DatabaseError('Failed to find product', error);
    }
  }

  /**
   * 获取产品详情（包含关联数据）
   * @param {number} id - 产品ID
   * @returns {Promise<Object|null>} 完整的产品信息
   */
  async getProductWithDetails(id) {
    try {
      const query = `
        SELECT p.*, c.name as category_name, c.slug as category_slug
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.id = ? AND p.deleted_at IS NULL
      `;
      
      const result = await this.database.executeQuery(query, [id]);
      
      if (result.length === 0) {
        return null;
      }
      
      // 解析产品数据
      const product = this._parseProduct(result[0]);
      
      // 添加分类信息
      if (result[0].category_name) {
        product.category = {
          id: result[0].category_id,
          name: result[0].category_name,
          slug: result[0].category_slug
        };
      }
      
      return product;
    } catch (error) {
      this.logger.error(`Failed to get product details for ID: ${id}`, error);
      throw new DatabaseError('Failed to get product details', error);
    }
  }

  /**
   * 更新产品
   * @param {number} id - 产品ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<Object>} 更新后的产品
   */
  async update(id, updateData) {
    try {
      // 开始事务
      const transaction = await this.database.beginTransaction();
      
      try {
        // 准备更新字段
        const fields = [];
        const params = [];
        
        Object.keys(updateData).forEach(key => {
          if (key === 'images' || key === 'attributes') {
            fields.push(`${key} = ?`);
            params.push(JSON.stringify(updateData[key]));
          } else if (key !== 'id') {
            fields.push(`${key} = ?`);
            params.push(updateData[key]);
          }
        });
        
        // 添加产品ID到参数
        params.push(id);
        
        // 执行更新
        const query = `
          UPDATE products 
          SET ${fields.join(', ')}
          WHERE id = ? AND deleted_at IS NULL
        `;
        
        const result = await this.database.executeQuery(
          query,
          params,
          { transaction }
        );
        
        if (result.affectedRows === 0) {
          await transaction.rollback();
          throw new AppError('Product not found or already deleted', 'PRODUCT_NOT_FOUND');
        }
        
        // 获取更新后的产品
        const updatedProduct = await this.findById(id, { transaction });
        
        // 提交事务
        await transaction.commit();
        
        return updatedProduct;
      } catch (error) {
        // 回滚事务
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      this.logger.error(`Failed to update product ID: ${id}`, error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new DatabaseError('Failed to update product', error);
    }
  }

  /**
   * 删除产品（软删除）
   * @param {number} id - 产品ID
   * @returns {Promise<boolean>} 是否成功
   */
  async delete(id) {
    try {
      const query = `
        UPDATE products 
        SET deleted_at = NOW()
        WHERE id = ? AND deleted_at IS NULL
      `;
      
      const result = await this.database.executeQuery(query, [id]);
      
      if (result.affectedRows === 0) {
        return false;
      }
      
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete product ID: ${id}`, error);
      throw new DatabaseError('Failed to delete product', error);
    }
  }

  /**
   * 搜索产品
   * @param {Object} conditions - 搜索条件
   * @param {number} page - 页码
   * @param {number} limit - 每页数量
   * @param {Array} sortBy - 排序字段和方向
   * @returns {Promise<Object>} 搜索结果和分页信息
   */
  async search(conditions = {}, page = 1, limit = 20, sortBy = ['created_at', 'DESC']) {
    try {
      // 准备WHERE子句
      const whereClause = this._buildWhereClause(conditions);
      
      // 准备ORDER BY子句
      const orderBy = sortBy[0] && sortBy[1] 
        ? `ORDER BY ${sortBy[0]} ${sortBy[1]}` 
        : 'ORDER BY created_at DESC';
      
      // 计算偏移量
      const offset = (page - 1) * limit;
      
      // 查询产品列表
      const productsQuery = `
        SELECT * FROM products
        ${whereClause.sql}
        ${orderBy}
        LIMIT ? OFFSET ?
      `;
      
      const productsParams = [...whereClause.params, limit, offset];
      const productsResult = await this.database.executeQuery(productsQuery, productsParams);
      
      // 查询总数
      const countQuery = `
        SELECT COUNT(*) as total FROM products
        ${whereClause.sql}
      `;
      
      const countResult = await this.database.executeQuery(countQuery, whereClause.params);
      const total = countResult[0].total;
      
      // 解析产品数据
      const products = productsResult.map(product => this._parseProduct(product));
      
      return {
        items: products,
        total
      };
    } catch (error) {
      this.logger.error('Failed to search products', error);
      throw new DatabaseError('Failed to search products', error);
    }
  }

  /**
   * 根据名称或描述搜索产品
   * @param {string} query - 搜索关键词
   * @param {number} limit - 限制数量
   * @param {number} categoryId - 分类ID（可选）
   * @returns {Promise<Array>} 搜索结果
   */
  async searchByNameOrDescription(query, limit = 50, categoryId = null) {
    try {
      let whereClause = `
        WHERE (name LIKE ? OR description LIKE ? OR sku LIKE ?)
        AND deleted_at IS NULL
      `;
      
      const params = [`%${query}%`, `%${query}%`, `%${query}%`];
      
      if (categoryId) {
        whereClause += ' AND category_id = ?';
        params.push(categoryId);
      }
      
      const sql = `
        SELECT * FROM products
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ?
      `;
      
      params.push(limit);
      const result = await this.database.executeQuery(sql, params);
      
      return result.map(product => this._parseProduct(product));
    } catch (error) {
      this.logger.error(`Failed to search products by query: ${query}`, error);
      throw new DatabaseError('Failed to search products', error);
    }
  }

  /**
   * 获取相关产品
   * @param {number} productId - 当前产品ID
   * @param {number} categoryId - 分类ID
   * @param {number} limit - 限制数量
   * @returns {Promise<Array>} 相关产品列表
   */
  async findRelatedProducts(productId, categoryId, limit = 4) {
    try {
      const query = `
        SELECT * FROM products
        WHERE id != ?
          AND category_id = ?
          AND is_active = true
          AND deleted_at IS NULL
        ORDER BY RAND()
        LIMIT ?
      `;
      
      const result = await this.database.executeQuery(query, [productId, categoryId, limit]);
      
      return result.map(product => this._parseProduct(product));
    } catch (error) {
      this.logger.error(`Failed to find related products for ID: ${productId}`, error);
      throw new DatabaseError('Failed to find related products', error);
    }
  }

  /**
   * 增加产品浏览次数
   * @param {number} productId - 产品ID
   * @returns {Promise<void>}
   */
  async incrementViews(productId) {
    try {
      const query = `
        UPDATE products
        SET views = COALESCE(views, 0) + 1
        WHERE id = ? AND deleted_at IS NULL
      `;
      
      await this.database.executeQuery(query, [productId]);
    } catch (error) {
      this.logger.warn(`Failed to increment views for product ID: ${productId}`, error);
      // 浏览次数更新失败不抛出错误
    }
  }

  /**
   * 统计产品数量
   * @param {Object} conditions - 统计条件
   * @returns {Promise<number>} 产品数量
   */
  async count(conditions = {}) {
    try {
      const whereClause = this._buildWhereClause(conditions);
      
      const query = `
        SELECT COUNT(*) as total FROM products
        ${whereClause.sql}
      `;
      
      const result = await this.database.executeQuery(query, whereClause.params);
      
      return result[0].total;
    } catch (error) {
      this.logger.error('Failed to count products', error);
      throw new DatabaseError('Failed to count products', error);
    }
  }

  /**
   * 按分类统计产品数量
   * @returns {Promise<Array>} 分类统计数据
   */
  async countByCategory() {
    try {
      const query = `
        SELECT 
          c.id as category_id,
          c.name as category_name,
          COUNT(p.id) as product_count
        FROM categories c
        LEFT JOIN products p ON c.id = p.category_id
          AND p.is_active = true
          AND p.deleted_at IS NULL
        WHERE c.deleted_at IS NULL
        GROUP BY c.id, c.name
        ORDER BY product_count DESC
      `;
      
      const result = await this.database.executeQuery(query);
      return result;
    } catch (error) {
      this.logger.error('Failed to count products by category', error);
      throw new DatabaseError('Failed to count products by category', error);
    }
  }

  /**
   * 获取特色产品
   * @param {number} limit - 限制数量
   * @returns {Promise<Array>} 特色产品列表
   */
  async getFeaturedProducts(limit = 10) {
    try {
      const query = `
        SELECT * FROM products
        WHERE featured = true
          AND is_active = true
          AND deleted_at IS NULL
        ORDER BY created_at DESC
        LIMIT ?
      `;
      
      const result = await this.database.executeQuery(query, [limit]);
      
      return result.map(product => this._parseProduct(product));
    } catch (error) {
      this.logger.error('Failed to get featured products', error);
      throw new DatabaseError('Failed to get featured products', error);
    }
  }

  /**
   * 获取畅销产品
   * @param {number} limit - 限制数量
   * @returns {Promise<Array>} 畅销产品列表
   */
  async getBestsellingProducts(limit = 10) {
    try {
      // 这里假设有一个订单商品表order_items
      const query = `
        SELECT 
          p.*,
          SUM(oi.quantity) as total_sold
        FROM products p
        JOIN order_items oi ON p.id = oi.product_id
        JOIN orders o ON oi.order_id = o.id
        WHERE p.deleted_at IS NULL
          AND o.status = 'completed'
          AND o.deleted_at IS NULL
        GROUP BY p.id
        ORDER BY total_sold DESC
        LIMIT ?
      `;
      
      const result = await this.database.executeQuery(query, [limit]);
      
      return result.map(product => this._parseProduct(product));
    } catch (error) {
      this.logger.error('Failed to get bestselling products', error);
      throw new DatabaseError('Failed to get bestselling products', error);
    }
  }

  /**
   * 获取新产品
   * @param {number} limit - 限制数量
   * @returns {Promise<Array>} 新产品列表
   */
  async getNewArrivals(limit = 10) {
    try {
      const query = `
        SELECT * FROM products
        WHERE is_active = true
          AND deleted_at IS NULL
        ORDER BY created_at DESC
        LIMIT ?
      `;
      
      const result = await this.database.executeQuery(query, [limit]);
      
      return result.map(product => this._parseProduct(product));
    } catch (error) {
      this.logger.error('Failed to get new arrivals', error);
      throw new DatabaseError('Failed to get new arrivals', error);
    }
  }

  /**
   * 批量获取产品
   * @param {Array} ids - 产品ID数组
   * @returns {Promise<Array>} 产品列表
   */
  async findByIds(ids) {
    try {
      if (!ids || ids.length === 0) {
        return [];
      }
      
      const placeholders = ids.map(() => '?').join(',');
      const query = `
        SELECT * FROM products
        WHERE id IN (${placeholders})
          AND deleted_at IS NULL
      `;
      
      const result = await this.database.executeQuery(query, ids);
      
      return result.map(product => this._parseProduct(product));
    } catch (error) {
      this.logger.error('Failed to find products by IDs', error);
      throw new DatabaseError('Failed to find products by IDs', error);
    }
  }

  /**
   * 检查库存
   * @param {number} productId - 产品ID
   * @param {number} quantity - 需求数量
   * @returns {Promise<boolean>} 是否有足够库存
   */
  async checkStock(productId, quantity) {
    try {
      const query = `
        SELECT stock_quantity FROM products
        WHERE id = ? AND deleted_at IS NULL
      `;
      
      const result = await this.database.executeQuery(query, [productId]);
      
      if (result.length === 0) {
        return false;
      }
      
      return result[0].stock_quantity >= quantity;
    } catch (error) {
      this.logger.error(`Failed to check stock for product ID: ${productId}`, error);
      throw new DatabaseError('Failed to check product stock', error);
    }
  }

  /**
   * 解析产品数据中的JSON字段
   * @private
   * @param {Object} product - 数据库中的产品记录
   * @returns {Object} 解析后的产品对象
   */
  _parseProduct(product) {
    const parsedProduct = { ...product };
    
    // 解析images字段
    if (product.images) {
      try {
        parsedProduct.images = typeof product.images === 'string' 
          ? JSON.parse(product.images)
          : product.images;
      } catch (error) {
        this.logger.warn(`Failed to parse images for product ID: ${product.id}`, error);
        parsedProduct.images = [];
      }
    }
    
    // 解析attributes字段
    if (product.attributes) {
      try {
        parsedProduct.attributes = typeof product.attributes === 'string'
          ? JSON.parse(product.attributes)
          : product.attributes;
      } catch (error) {
        this.logger.warn(`Failed to parse attributes for product ID: ${product.id}`, error);
        parsedProduct.attributes = {};
      }
    }
    
    return parsedProduct;
  }

  /**
   * 构建WHERE子句
   * @private
   * @param {Object} conditions - 查询条件
   * @returns {Object} SQL和参数
   */
  _buildWhereClause(conditions) {
    let sql = 'WHERE deleted_at IS NULL';
    const params = [];
    
    // 添加其他条件
    Object.keys(conditions).forEach(key => {
      const value = conditions[key];
      
      if (value === null || value === undefined) {
        // 忽略null或undefined值
        return;
      }
      
      if (typeof value === 'object' && !Array.isArray(value)) {
        // 处理操作符条件 ($gt, $lt, $gte, $lte, $like等)
        Object.keys(value).forEach(operator => {
          sql += ` AND ${key}`;
          
          switch (operator) {
            case '$gt':
              sql += ' > ?';
              params.push(value[operator]);
              break;
            case '$lt':
              sql += ' < ?';
              params.push(value[operator]);
              break;
            case '$gte':
              sql += ' >= ?';
              params.push(value[operator]);
              break;
            case '$lte':
              sql += ' <= ?';
              params.push(value[operator]);
              break;
            case '$like':
              sql += ' LIKE ?';
              params.push(value[operator]);
              break;
            case '$in':
              const placeholders = value[operator].map(() => '?').join(',');
              sql += ` IN (${placeholders})`;
              params.push(...value[operator]);
              break;
          }
        });
      } else if (Array.isArray(value)) {
        // 处理IN条件
        const placeholders = value.map(() => '?').join(',');
        sql += ` AND ${key} IN (${placeholders})`;
        params.push(...value);
      } else {
        // 处理相等条件
        sql += ` AND ${key} = ?`;
        params.push(value);
      }
    });
    
    return { sql, params };
  }

  /**
   * 批量更新产品库存
   * @param {Array} updates - 库存更新数组 [{product_id, quantity}]
   * @returns {Promise<void>}
   */
  async batchUpdateStock(updates) {
    try {
      const transaction = await this.database.beginTransaction();
      
      try {
        for (const update of updates) {
          const query = `
            UPDATE products
            SET stock_quantity = stock_quantity + ?
            WHERE id = ? AND deleted_at IS NULL
          `;
          
          await this.database.executeQuery(
            query,
            [update.quantity, update.product_id],
            { transaction }
          );
        }
        
        await transaction.commit();
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      this.logger.error('Failed to batch update stock', error);
      throw new DatabaseError('Failed to batch update stock', error);
    }
  }
}

module.exports = ProductRepository;