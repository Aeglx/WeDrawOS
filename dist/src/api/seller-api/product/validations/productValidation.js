/**
 * 卖家端商品管理相关的验证规则
 */

const { body, param, query } = require('express-validator');

// 创建商品验证规则
const createProduct = [
  body('name')
    .notEmpty()
    .withMessage('商品名称不能为空')
    .isString()
    .withMessage('商品名称必须是字符串')
    .isLength({ min: 1, max: 200 })
    .withMessage('商品名称长度必须在1到200个字符之间'),
  
  body('categoryId')
    .notEmpty()
    .withMessage('分类ID不能为空')
    .isString()
    .withMessage('分类ID必须是字符串'),
  
  body('price')
    .notEmpty()
    .withMessage('售价不能为空')
    .isNumeric()
    .withMessage('售价必须是数字')
    .custom(value => parseFloat(value) >= 0)
    .withMessage('售价不能为负数'),
  
  body('originalPrice')
    .optional()
    .isNumeric()
    .withMessage('原价必须是数字')
    .custom(value => parseFloat(value) >= 0)
    .withMessage('原价不能为负数'),
  
  body('description')
    .optional()
    .isString()
    .withMessage('商品描述必须是字符串'),
  
  body('status')
    .optional()
    .isIn(['draft', 'active', 'inactive'])
    .withMessage('商品状态只能是draft、active或inactive'),
  
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('库存数量必须是非负整数'),
  
  body('variants')
    .optional()
    .isArray()
    .withMessage('商品变体必须是数组'),
  
  body('images')
    .optional()
    .isArray()
    .withMessage('商品图片必须是数组')
    .custom(array => array.every(item => typeof item === 'string'))
    .withMessage('图片URL必须是字符串')
];

// 获取商品列表验证规则
const getProducts = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是大于等于1的整数')
    .toInt(),
  
  query('pageSize')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量必须是1到100之间的整数')
    .toInt(),
  
  query('status')
    .optional()
    .isIn(['draft', 'active', 'inactive'])
    .withMessage('状态筛选只能是draft、active或inactive'),
  
  query('keyword')
    .optional()
    .isString()
    .withMessage('搜索关键词必须是字符串')
];

// 获取商品详情验证规则
const getProductDetail = [
  param('id')
    .notEmpty()
    .withMessage('商品ID不能为空')
    .isString()
    .withMessage('商品ID必须是字符串')
];

// 更新商品验证规则
const updateProduct = [
  param('id')
    .notEmpty()
    .withMessage('商品ID不能为空')
    .isString()
    .withMessage('商品ID必须是字符串'),
  
  body('name')
    .optional()
    .isString()
    .withMessage('商品名称必须是字符串')
    .isLength({ min: 1, max: 200 })
    .withMessage('商品名称长度必须在1到200个字符之间'),
  
  body('categoryId')
    .optional()
    .isString()
    .withMessage('分类ID必须是字符串'),
  
  body('price')
    .optional()
    .isNumeric()
    .withMessage('售价必须是数字')
    .custom(value => parseFloat(value) >= 0)
    .withMessage('售价不能为负数'),
  
  body('originalPrice')
    .optional()
    .isNumeric()
    .withMessage('原价必须是数字')
    .custom(value => parseFloat(value) >= 0)
    .withMessage('原价不能为负数'),
  
  body('description')
    .optional()
    .isString()
    .withMessage('商品描述必须是字符串'),
  
  body('images')
    .optional()
    .isArray()
    .withMessage('商品图片必须是数组')
    .custom(array => array.every(item => typeof item === 'string'))
    .withMessage('图片URL必须是字符串')
];

// 变更商品状态验证规则
const changeStatus = [
  param('id')
    .notEmpty()
    .withMessage('商品ID不能为空')
    .isString()
    .withMessage('商品ID必须是字符串'),
  
  body('status')
    .notEmpty()
    .withMessage('状态不能为空')
    .isIn(['draft', 'active', 'inactive'])
    .withMessage('商品状态只能是draft、active或inactive')
];

// 批量变更商品状态验证规则
const batchChangeStatus = [
  body('productIds')
    .notEmpty()
    .withMessage('商品ID列表不能为空')
    .isArray()
    .withMessage('商品ID列表必须是数组')
    .custom(array => array.length > 0)
    .withMessage('商品ID列表不能为空数组')
    .custom(array => array.every(item => typeof item === 'string'))
    .withMessage('商品ID必须是字符串'),
  
  body('status')
    .notEmpty()
    .withMessage('状态不能为空')
    .isIn(['draft', 'active', 'inactive'])
    .withMessage('商品状态只能是draft、active或inactive')
];

// 更新库存验证规则
const updateInventory = [
  param('id')
    .notEmpty()
    .withMessage('商品ID不能为空')
    .isString()
    .withMessage('商品ID必须是字符串'),
  
  body('variants')
    .notEmpty()
    .withMessage('变体数据不能为空')
    .isArray()
    .withMessage('变体数据必须是数组')
    .custom(array => array.length > 0)
    .withMessage('变体数据不能为空数组')
    .custom(array => {
      // 验证每个变体对象
      return array.every(variant => {
        if (typeof variant !== 'object' || !variant.skuId) {
          return false;
        }
        if (variant.quantity === undefined || typeof variant.quantity !== 'number' || variant.quantity < 0) {
          return false;
        }
        return true;
      });
    })
    .withMessage('变体数据格式错误，每个变体必须包含skuId和非负的quantity')
];

// 更新价格验证规则
const updatePrice = [
  param('id')
    .notEmpty()
    .withMessage('商品ID不能为空')
    .isString()
    .withMessage('商品ID必须是字符串'),
  
  body('variants')
    .notEmpty()
    .withMessage('变体数据不能为空')
    .isArray()
    .withMessage('变体数据必须是数组')
    .custom(array => array.length > 0)
    .withMessage('变体数据不能为空数组')
    .custom(array => {
      // 验证每个变体对象
      return array.every(variant => {
        if (typeof variant !== 'object' || !variant.skuId) {
          return false;
        }
        if (variant.price !== undefined) {
          if (typeof variant.price !== 'number' || variant.price < 0) {
            return false;
          }
        }
        if (variant.originalPrice !== undefined) {
          if (typeof variant.originalPrice !== 'number' || variant.originalPrice < 0) {
            return false;
          }
        }
        return true;
      });
    })
    .withMessage('变体数据格式错误')
];

// 复制商品验证规则
const copyProduct = [
  param('id')
    .notEmpty()
    .withMessage('商品ID不能为空')
    .isString()
    .withMessage('商品ID必须是字符串'),
  
  body('name')
    .optional()
    .isString()
    .withMessage('商品名称必须是字符串')
    .isLength({ min: 1, max: 200 })
    .withMessage('商品名称长度必须在1到200个字符之间')
];

// 删除商品验证规则
const deleteProduct = [
  param('id')
    .notEmpty()
    .withMessage('商品ID不能为空')
    .isString()
    .withMessage('商品ID必须是字符串')
];

// 批量删除商品验证规则
const batchDeleteProducts = [
  body('productIds')
    .notEmpty()
    .withMessage('商品ID列表不能为空')
    .isArray()
    .withMessage('商品ID列表必须是数组')
    .custom(array => array.length > 0)
    .withMessage('商品ID列表不能为空数组')
    .custom(array => array.every(item => typeof item === 'string'))
    .withMessage('商品ID必须是字符串')
];

module.exports = {
  createProduct,
  getProducts,
  getProductDetail,
  updateProduct,
  changeStatus,
  batchChangeStatus,
  updateInventory,
  updatePrice,
  copyProduct,
  deleteProduct,
  batchDeleteProducts
};