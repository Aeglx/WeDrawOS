/**
 * 产品管理控制器
 * 处理产品相关的业务逻辑
 */

const logger = require('../../../../utils/logger');
const productService = require('../services/productService');

/**
 * 获取产品列表
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 */
exports.getProducts = async (req, res) => {
  try {
    const { name, id, auditStatus, page = 1, pageSize = 10 } = req.query;
    logger.info('获取产品列表请求', { name, id, auditStatus, page, pageSize });
    
    const result = await productService.getProducts({
      name,
      id,
      auditStatus,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });
    
    res.json({
      message: '获取产品列表成功',
      success: true,
      data: result.products,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize
    });
  } catch (error) {
    logger.error('获取产品列表失败:', error);
    res.status(500).json({ message: '服务器内部错误', success: false });
  }
};

/**
 * 审核产品
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 */
exports.auditProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { result, remark } = req.body;
    
    logger.info('审核产品请求', { productId, result, remark });
    
    // 验证参数
    if (!result || !['pass', 'reject'].includes(result)) {
      return res.status(400).json({
        success: false,
        message: '审核结果参数错误'
      });
    }
    
    const updatedProduct = await productService.auditProduct(productId, result, remark);
    
    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: '产品不存在'
      });
    }
    
    res.json({
      success: true,
      message: result === 'pass' ? '审核通过' : '审核驳回',
      data: updatedProduct
    });
  } catch (error) {
    logger.error('审核产品失败:', error);
    res.status(500).json({ message: '服务器内部错误', success: false });
  }
};

/**
 * 下架产品
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 */
exports.offlineProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    logger.info('下架产品请求', { id });
    
    await productService.offlineProduct(id);
    
    res.json({
      message: '产品下架成功',
      success: true
    });
  } catch (error) {
    logger.error('下架产品失败:', error);
    res.status(500).json({ message: '服务器内部错误', success: false });
  }
};

/**
 * 获取产品详情
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 */
exports.getProductDetail = async (req, res) => {
  try {
    const { productId } = req.params;
    
    logger.info('获取产品详情请求', { productId });
    
    const product = await productService.getProductById(productId);
    
    if (!product) {
      return res.status(404).json({ message: '产品不存在', success: false });
    }
    
    res.json({
      message: '获取产品详情成功',
      success: true,
      data: product
    });
  } catch (error) {
    logger.error('获取产品详情失败:', error);
    res.status(500).json({ message: '服务器内部错误', success: false });
  }
};