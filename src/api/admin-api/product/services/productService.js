/**
 * 产品管理服务
 * 处理产品相关的业务逻辑
 */

const logger = require('../../../../utils/logger');
const productRepository = require('../repositories/productRepository');

/**
 * 获取产品列表
 * @param {Object} params - 查询参数
 * @returns {Promise<Object>} 产品列表和分页信息
 */
exports.getProducts = async (params) => {
  try {
    const { name, id, auditStatus, page, pageSize } = params;
    
    const query = {};
    if (name) query.name = name;
    if (id) query.id = id;
    if (auditStatus) query.auditStatus = auditStatus;
    
    const products = await productRepository.findProducts(query, page, pageSize);
    const total = await productRepository.countProducts(query);
    
    return {
      products,
      total,
      page,
      pageSize
    };
  } catch (error) {
    logger.error('获取产品列表服务失败:', error);
    throw error;
  }
};

/**
 * 根据ID获取产品
 * @param {string} id - 产品ID
 * @returns {Promise<Object|null>} 产品信息或null
 */
exports.getProductById = async (id) => {
  try {
    return await productRepository.findProductById(id);
  } catch (error) {
    logger.error(`获取产品ID: ${id} 详情失败:`, error);
    throw error;
  }
};

/**
 * 审核产品
 * @param {string} id - 产品ID
 * @param {string} result - 审核结果 (pass/reject)
 * @param {string} remark - 审核备注
 * @returns {Promise<Object>} 更新后的产品信息
 */
exports.auditProduct = async (id, result, remark = '') => {
  try {
    const product = await productRepository.findProductById(id);
    if (!product) {
      throw new Error('产品不存在');
    }
    
    const updateData = {
      auditStatus: result === 'pass' ? '通过' : '未通过',
      status: result === 'pass' ? '上架' : '审核失败',
      auditRemark: remark,
      auditTime: new Date()
    };
    
    await productRepository.updateProduct(id, updateData);
    // 返回更新后的产品信息
    return await productRepository.findProductById(id);
  } catch (error) {
    logger.error(`审核产品ID: ${id} 失败:`, error);
    throw error;
  }
};

/**
 * 下架产品
 * @param {string} id - 产品ID
 * @returns {Promise<void>}
 */
exports.offlineProduct = async (id) => {
  try {
    const product = await productRepository.findProductById(id);
    if (!product) {
      throw new Error('产品不存在');
    }
    
    await productRepository.updateProduct(id, { status: '下架' });
  } catch (error) {
    logger.error(`下架产品ID: ${id} 失败:`, error);
    throw error;
  }
};