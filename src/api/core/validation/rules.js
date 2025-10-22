/**
 * 数据校验规则集合
 * 提供常用的校验规则配置
 */

const { body, param, query } = require('express-validator');

/**
 * 用户相关校验规则
 */
const userRules = {
  /**
   * 用户注册校验规则
   */
  register: [
    body('username')
      .isLength({ min: 3, max: 50 })
      .withMessage('用户名长度必须在3-50个字符之间')
      .trim(),
    body('email')
      .isEmail()
      .withMessage('邮箱格式不正确')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 6 })
      .withMessage('密码长度至少6个字符')
      .matches(/\d/)
      .withMessage('密码必须包含数字')
      .matches(/[a-zA-Z]/)
      .withMessage('密码必须包含字母'),
    body('phone')
      .optional()
      .matches(/^1[3-9]\d{9}$/)
      .withMessage('手机号格式不正确')
  ],

  /**
   * 用户登录校验规则
   */
  login: [
    body('email')
      .isEmail()
      .withMessage('邮箱格式不正确')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('密码不能为空')
  ],

  /**
   * 更新用户信息校验规则
   */
  updateProfile: [
    body('nickname')
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage('昵称长度必须在1-50个字符之间'),
    body('phone')
      .optional()
      .matches(/^1[3-9]\d{9}$/)
      .withMessage('手机号格式不正确'),
    body('avatar')
      .optional()
      .isURL()
      .withMessage('头像URL格式不正确')
  ]
};

/**
 * 商品相关校验规则
 */
const productRules = {
  /**
   * 创建商品校验规则
   */
  create: [
    body('name')
      .notEmpty()
      .withMessage('商品名称不能为空')
      .isLength({ max: 200 })
      .withMessage('商品名称不能超过200个字符'),
    body('price')
      .isFloat({ min: 0 })
      .withMessage('价格必须大于等于0'),
    body('stock')
      .isInt({ min: 0 })
      .withMessage('库存必须大于等于0'),
    body('categoryId')
      .isInt()
      .withMessage('分类ID必须是整数'),
    body('description')
      .optional()
      .isLength({ max: 5000 })
      .withMessage('商品描述不能超过5000个字符')
  ],

  /**
   * 更新商品校验规则
   */
  update: [
    param('id')
      .isInt()
      .withMessage('商品ID必须是整数'),
    body('name')
      .optional()
      .isLength({ max: 200 })
      .withMessage('商品名称不能超过200个字符'),
    body('price')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('价格必须大于等于0'),
    body('stock')
      .optional()
      .isInt({ min: 0 })
      .withMessage('库存必须大于等于0')
  ],

  /**
   * 商品查询校验规则
   */
  query: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('页码必须大于等于1'),
    query('pageSize')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('每页数量必须在1-100之间'),
    query('categoryId')
      .optional()
      .isInt()
      .withMessage('分类ID必须是整数')
  ]
};

/**
 * 订单相关校验规则
 */
const orderRules = {
  /**
   * 创建订单校验规则
   */
  create: [
    body('items')
      .isArray()
      .withMessage('订单项必须是数组')
      .notEmpty()
      .withMessage('订单项不能为空'),
    body('items.*.productId')
      .isInt()
      .withMessage('商品ID必须是整数'),
    body('items.*.quantity')
      .isInt({ min: 1 })
      .withMessage('商品数量必须大于等于1'),
    body('addressId')
      .isInt()
      .withMessage('地址ID必须是整数')
  ],

  /**
   * 订单查询校验规则
   */
  query: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('页码必须大于等于1'),
    query('pageSize')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('每页数量必须在1-100之间'),
    query('status')
      .optional()
      .isString()
      .withMessage('订单状态必须是字符串')
  ]
};

/**
 * 通用ID校验规则
 */
const idRules = {
  /**
   * 路径参数中的ID校验
   */
  paramId: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('ID必须是正整数')
  ],

  /**
   * 查询参数中的ID校验
   */
  queryId: [
    query('id')
      .isInt({ min: 1 })
      .withMessage('ID必须是正整数')
  ]
};

/**
 * 分页校验规则
 */
const paginationRules = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须大于等于1')
    .toInt(),
  query('pageSize')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量必须在1-100之间')
    .toInt()
];

/**
 * 排序校验规则
 */
const sortRules = [
  query('sortBy')
    .optional()
    .isString()
    .withMessage('排序字段必须是字符串'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('排序顺序必须是asc或desc')
];

module.exports = {
  userRules,
  productRules,
  orderRules,
  idRules,
  paginationRules,
  sortRules,
  // 导出express-validator的校验器，方便扩展
  validators: {
    body,
    param,
    query
  }
};