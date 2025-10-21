/**
 * 分类仓库模块
 * 负责产品分类相关的数据库操作
 */

// 导入基础仓库和错误类
const Repository = require('../repository');
const {
  AppError,
  DatabaseError,
  ValidationError
} = require('../../errors/appError');

/**
 * 分类仓库类
 */
class CategoryRepository extends Repository {
  constructor(database, logger) {
    super(database, 'categories', logger);
  }

  /**
   * 创建分类
   * @param {Object} categoryData - 分类数据
   * @returns {Promise<Object>} 创建的分类
   */
  async create(categoryData) {
    try {
      // 开始事务
      const transaction = await this.database.beginTransaction();
      
      try {
        // 检查分类名称是否已存在
        const existing = await this.findByName(categoryData.name, { transaction });
        if (existing) {
          await transaction.rollback();
          throw new ValidationError('Category already exists', { name: 'A category with this name already exists' });
        }
        
        // 准备SQL
        const query = `
          INSERT INTO categories 
          (name, slug, description, parent_id, sort_order, 
           image_url, is_active, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        // 执行插入
        const params = [
          categoryData.name,
          categoryData.slug || this._generateSlug(categoryData.name),
          categoryData.description,
          categoryData.parent_id || null,
          categoryData.sort_order || 0,
          categoryData.image_url || null,
          categoryData.is_active !== undefined ? categoryData.is_active : true,
          categoryData.created_at || new Date(),
          categoryData.updated_at || new Date()
        ];
        
        const result = await this.database.executeQuery(
          query,
          params,
          { transaction }
        );
        
        // 获取创建的分类
        const categoryId = result.insertId;
        const createdCategory = await this.findById(categoryId, { transaction });
        
        // 提交事务
        await transaction.commit();
        
        return createdCategory;
      } catch (error) {
        // 回滚事务
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      this.logger.error('Failed to create category', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new DatabaseError('Failed to create category', error);
    }
  }

  /**
   * 根据ID查找分类
   * @param {number} id - 分类ID
   * @param {Object} options - 查询选项
   * @returns {Promise<Object|null>} 分类对象或null
   */
  async findById(id, options = {}) {
    try {
      const query = `
        SELECT * FROM categories 
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
      
      return result[0];
    } catch (error) {
      this.logger.error(`Failed to find category by ID: ${id}`, error);
      throw new DatabaseError('Failed to find category', error);
    }
  }

  /**
   * 根据名称查找分类
   * @param {string} name - 分类名称
   * @param {Object} options - 查询选项
   * @returns {Promise<Object|null>} 分类对象或null
   */
  async findByName(name, options = {}) {
    try {
      const query = `
        SELECT * FROM categories 
        WHERE name = ?
        ${options.includeDeleted ? '' : ' AND deleted_at IS NULL'}
      `;
      
      const params = [name];
      const result = await this.database.executeQuery(
        query,
        params,
        { transaction: options.transaction }
      );
      
      if (result.length === 0) {
        return null;
      }
      
      return result[0];
    } catch (error) {
      this.logger.error(`Failed to find category by name: ${name}`, error);
      throw new DatabaseError('Failed to find category', error);
    }
  }

  /**
   * 根据slug查找分类
   * @param {string} slug - 分类slug
   * @returns {Promise<Object|null>} 分类对象或null
   */
  async findBySlug(slug) {
    try {
      const query = `
        SELECT * FROM categories 
        WHERE slug = ? AND deleted_at IS NULL
      `;
      
      const result = await this.database.executeQuery(query, [slug]);
      
      if (result.length === 0) {
        return null;
      }
      
      return result[0];
    } catch (error) {
      this.logger.error(`Failed to find category by slug: ${slug}`, error);
      throw new DatabaseError('Failed to find category', error);
    }
  }

  /**
   * 更新分类
   * @param {number} id - 分类ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<Object>} 更新后的分类
   */
  async update(id, updateData) {
    try {
      // 开始事务
      const transaction = await this.database.beginTransaction();
      
      try {
        // 检查是否重名
        if (updateData.name && updateData.name !== undefined) {
          const existing = await this.findByName(updateData.name, { transaction });
          if (existing && existing.id !== id) {
            await transaction.rollback();
            throw new ValidationError('Category already exists', { name: 'A category with this name already exists' });
          }
        }
        
        // 准备更新字段
        const fields = [];
        const params = [];
        
        Object.keys(updateData).forEach(key => {
          if (key !== 'id') {
            fields.push(`${key} = ?`);
            params.push(updateData[key]);
          }
        });
        
        // 如果更新slug并且没有提供新slug但提供了名称，生成新的slug
        if (updateData.name && !updateData.slug) {
          const existing = await this.findById(id, { transaction });
          if (existing && existing.name !== updateData.name) {
            fields.push(`slug = ?`);
            params.push(this._generateSlug(updateData.name));
          }
        }
        
        // 添加更新时间
        fields.push(`updated_at = ?`);
        params.push(new Date());
        
        // 添加产品ID到参数
        params.push(id);
        
        // 执行更新
        const query = `
          UPDATE categories 
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
          throw new AppError('Category not found or already deleted', 'CATEGORY_NOT_FOUND');
        }
        
        // 获取更新后的分类
        const updatedCategory = await this.findById(id, { transaction });
        
        // 提交事务
        await transaction.commit();
        
        return updatedCategory;
      } catch (error) {
        // 回滚事务
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      this.logger.error(`Failed to update category ID: ${id}`, error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new DatabaseError('Failed to update category', error);
    }
  }

  /**
   * 删除分类（软删除）
   * @param {number} id - 分类ID
   * @returns {Promise<boolean>} 是否成功
   */
  async delete(id) {
    try {
      // 检查分类下是否有产品
      const productCount = await this._getProductCountByCategory(id);
      if (productCount > 0) {
        throw new AppError('Cannot delete category with products', 'CATEGORY_HAS_PRODUCTS');
      }
      
      // 检查是否有子分类
      const subCategoryCount = await this._getSubCategoryCount(id);
      if (subCategoryCount > 0) {
        throw new AppError('Cannot delete category with subcategories', 'CATEGORY_HAS_SUBCATEGORIES');
      }
      
      const query = `
        UPDATE categories 
        SET deleted_at = NOW()
        WHERE id = ? AND deleted_at IS NULL
      `;
      
      const result = await this.database.executeQuery(query, [id]);
      
      if (result.affectedRows === 0) {
        return false;
      }
      
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete category ID: ${id}`, error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new DatabaseError('Failed to delete category', error);
    }
  }

  /**
   * 获取所有分类
   * @param {Object} options - 查询选项
   * @returns {Promise<Array>} 分类列表
   */
  async findAll(options = {}) {
    try {
      let query = `
        SELECT * FROM categories
        WHERE deleted_at IS NULL
      `;
      
      // 添加过滤条件
      const params = [];
      
      if (options.is_active !== undefined) {
        query += ' AND is_active = ?';
        params.push(options.is_active);
      }
      
      // 添加排序
      if (options.sort_by && options.sort_order) {
        query += ` ORDER BY ${options.sort_by} ${options.sort_order}`;
      } else {
        query += ' ORDER BY sort_order ASC, name ASC';
      }
      
      const result = await this.database.executeQuery(query, params);
      return result;
    } catch (error) {
      this.logger.error('Failed to find all categories', error);
      throw new DatabaseError('Failed to find all categories', error);
    }
  }

  /**
   * 获取顶级分类
   * @returns {Promise<Array>} 顶级分类列表
   */
  async getTopLevelCategories() {
    try {
      const query = `
        SELECT * FROM categories
        WHERE parent_id IS NULL
          AND deleted_at IS NULL
          AND is_active = true
        ORDER BY sort_order ASC, name ASC
      `;
      
      const result = await this.database.executeQuery(query);
      return result;
    } catch (error) {
      this.logger.error('Failed to get top level categories', error);
      throw new DatabaseError('Failed to get top level categories', error);
    }
  }

  /**
   * 获取子分类
   * @param {number} parentId - 父分类ID
   * @returns {Promise<Array>} 子分类列表
   */
  async getSubCategories(parentId) {
    try {
      const query = `
        SELECT * FROM categories
        WHERE parent_id = ?
          AND deleted_at IS NULL
          AND is_active = true
        ORDER BY sort_order ASC, name ASC
      `;
      
      const result = await this.database.executeQuery(query, [parentId]);
      return result;
    } catch (error) {
      this.logger.error(`Failed to get subcategories for parent ID: ${parentId}`, error);
      throw new DatabaseError('Failed to get subcategories', error);
    }
  }

  /**
   * 获取分类树
   * @returns {Promise<Array>} 分类树结构
   */
  async getCategoryTree() {
    try {
      // 获取所有分类
      const allCategories = await this.findAll({ is_active: true });
      
      // 构建分类树
      const categoryMap = {};
      const rootCategories = [];
      
      // 首先创建所有分类的映射
      allCategories.forEach(category => {
        categoryMap[category.id] = {
          ...category,
          children: []
        };
      });
      
      // 构建树结构
      allCategories.forEach(category => {
        if (category.parent_id === null) {
          // 顶级分类
          rootCategories.push(categoryMap[category.id]);
        } else if (categoryMap[category.parent_id]) {
          // 子分类
          categoryMap[category.parent_id].children.push(categoryMap[category.id]);
        }
      });
      
      return rootCategories;
    } catch (error) {
      this.logger.error('Failed to get category tree', error);
      throw new DatabaseError('Failed to get category tree', error);
    }
  }

  /**
   * 搜索分类
   * @param {string} keyword - 搜索关键词
   * @returns {Promise<Array>} 匹配的分类列表
   */
  async search(keyword) {
    try {
      const query = `
        SELECT * FROM categories
        WHERE (
          name LIKE ? OR 
          description LIKE ? OR
          slug LIKE ?
        )
        AND deleted_at IS NULL
        ORDER BY name ASC
      `;
      
      const searchTerm = `%${keyword}%`;
      const result = await this.database.executeQuery(
        query,
        [searchTerm, searchTerm, searchTerm]
      );
      
      return result;
    } catch (error) {
      this.logger.error(`Failed to search categories with keyword: ${keyword}`, error);
      throw new DatabaseError('Failed to search categories', error);
    }
  }

  /**
   * 更新分类排序
   * @param {Array} sortOrder - 分类ID和排序值的数组 [{id, sort_order}]
   * @returns {Promise<void>}
   */
  async updateSortOrder(sortOrder) {
    try {
      const transaction = await this.database.beginTransaction();
      
      try {
        for (const item of sortOrder) {
          const query = `
            UPDATE categories
            SET sort_order = ?
            WHERE id = ? AND deleted_at IS NULL
          `;
          
          await this.database.executeQuery(
            query,
            [item.sort_order, item.id],
            { transaction }
          );
        }
        
        await transaction.commit();
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      this.logger.error('Failed to update category sort order', error);
      throw new DatabaseError('Failed to update category sort order', error);
    }
  }

  /**
   * 获取分类和产品数量
   * @returns {Promise<Array>} 分类及产品数量列表
   */
  async getCategoriesWithProductCount() {
    try {
      const query = `
        SELECT 
          c.*,
          COUNT(p.id) as product_count
        FROM categories c
        LEFT JOIN products p ON c.id = p.category_id
          AND p.is_active = true
          AND p.deleted_at IS NULL
        WHERE c.deleted_at IS NULL
        GROUP BY c.id
        ORDER BY c.sort_order ASC, c.name ASC
      `;
      
      const result = await this.database.executeQuery(query);
      return result;
    } catch (error) {
      this.logger.error('Failed to get categories with product count', error);
      throw new DatabaseError('Failed to get categories with product count', error);
    }
  }

  /**
   * 获取分类路径（从根到当前分类）
   * @param {number} categoryId - 分类ID
   * @returns {Promise<Array>} 分类路径
   */
  async getCategoryPath(categoryId) {
    try {
      const path = [];
      let currentId = categoryId;
      
      // 循环查找父分类，直到到达顶级分类
      while (currentId) {
        const category = await this.findById(currentId);
        if (!category) {
          break;
        }
        
        // 插入到数组开头，确保路径顺序是从根到子
        path.unshift(category);
        currentId = category.parent_id;
      }
      
      return path;
    } catch (error) {
      this.logger.error(`Failed to get category path for ID: ${categoryId}`, error);
      throw new DatabaseError('Failed to get category path', error);
    }
  }

  /**
   * 统计分类数量
   * @param {Object} conditions - 统计条件
   * @returns {Promise<number>} 分类数量
   */
  async count(conditions = {}) {
    try {
      let query = `SELECT COUNT(*) as total FROM categories WHERE deleted_at IS NULL`;
      const params = [];
      
      if (conditions.is_active !== undefined) {
        query += ' AND is_active = ?';
        params.push(conditions.is_active);
      }
      
      if (conditions.parent_id !== undefined) {
        query += ' AND parent_id = ?';
        params.push(conditions.parent_id);
      }
      
      const result = await this.database.executeQuery(query, params);
      return result[0].total;
    } catch (error) {
      this.logger.error('Failed to count categories', error);
      throw new DatabaseError('Failed to count categories', error);
    }
  }

  /**
   * 生成分类slug
   * @private
   * @param {string} name - 分类名称
   * @returns {string} 生成的slug
   */
  _generateSlug(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  /**
   * 获取分类下产品数量
   * @private
   * @param {number} categoryId - 分类ID
   * @returns {Promise<number>} 产品数量
   */
  async _getProductCountByCategory(categoryId) {
    const query = `
      SELECT COUNT(*) as count FROM products
      WHERE category_id = ? AND deleted_at IS NULL
    `;
    
    const result = await this.database.executeQuery(query, [categoryId]);
    return result[0].count;
  }

  /**
   * 获取子分类数量
   * @private
   * @param {number} parentId - 父分类ID
   * @returns {Promise<number>} 子分类数量
   */
  async _getSubCategoryCount(parentId) {
    const query = `
      SELECT COUNT(*) as count FROM categories
      WHERE parent_id = ? AND deleted_at IS NULL
    `;
    
    const result = await this.database.executeQuery(query, [parentId]);
    return result[0].count;
  }

  /**
   * 批量更新分类状态
   * @param {Array} ids - 分类ID数组
   * @param {boolean} isActive - 是否激活
   * @returns {Promise<void>}
   */
  async batchUpdateStatus(ids, isActive) {
    try {
      const transaction = await this.database.beginTransaction();
      
      try {
        const placeholders = ids.map(() => '?').join(',');
        const query = `
          UPDATE categories
          SET is_active = ?, updated_at = NOW()
          WHERE id IN (${placeholders}) AND deleted_at IS NULL
        `;
        
        const params = [isActive, ...ids];
        await this.database.executeQuery(query, params, { transaction });
        
        // 同时更新相关产品状态
        if (!isActive) {
          const productQuery = `
            UPDATE products
            SET is_active = false, updated_at = NOW()
            WHERE category_id IN (${placeholders}) AND deleted_at IS NULL
          `;
          
          await this.database.executeQuery(productQuery, ids, { transaction });
        }
        
        await transaction.commit();
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      this.logger.error('Failed to batch update category status', error);
      throw new DatabaseError('Failed to batch update category status', error);
    }
  }
}

module.exports = CategoryRepository;