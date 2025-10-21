/**
 * 数据校验规则集合
 * 提供各种通用的校验规则
 */

const { body, query, param } = require('express-validator');

/**
 * 用户相关校验规则
 */
const userRules = {
  // 用户注册校验
  register: [
    body('username')
      .trim()
      .notEmpty().withMessage('用户名不能为空')
      .isLength({ min: 3, max: 20 }).withMessage('用户名长度必须在3-20个字符之间'),
    body('password')
      .trim()
      .notEmpty().withMessage('密码不能为空')
      .isLength({ min: 6 }).withMessage('密码长度不能少于6个字符'),
    body('email')
      .trim()
      .isEmail().withMessage('邮箱格式不正确')
      .optional({ nullable: true }),
    body('phone')
      .trim()
      .matches(/^1[3-9]\d{9}$/).withMessage('手机号格式不正确')
  ],
  
  // 用户登录校验
  login: [
    body('username').trim().notEmpty().withMessage('用户名不能为空'),
    body('password').trim().notEmpty().withMessage('密码不能为空')
  ]
};

/**
 * 分页参数校验规则
 */
const paginationRules = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('页码必须为大于0的整数')
    .toInt(),
  query('pageSize')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('每页大小必须为1-100之间的整数')
    .toInt()
];

/**
 * ID参数校验规则
 */
const idRule = param('id')
  .isInt({ min: 1 }).withMessage('ID必须为大于0的整数')
  .toInt();

/**
 * 字符串长度校验
 * @param {number} min - 最小长度
 * @param {number} max - 最大长度
 * @param {string} fieldName - 字段名称
 * @returns {Array} 校验规则数组
 */
function stringLengthRule(min, max, fieldName = '字段') {
  return [
    body(fieldName)
      .trim()
      .isLength({ min, max }).withMessage(`${fieldName}长度必须在${min}-${max}个字符之间`)
  ];
}

/**
 * 数值范围校验
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @param {string} fieldName - 字段名称
 * @returns {Array} 校验规则数组
 */
function numberRangeRule(min, max, fieldName = '数值') {
  return [
    body(fieldName)
      .isFloat({ min, max }).withMessage(`${fieldName}必须在${min}-${max}之间`)
  ];
}

module.exports = {
  userRules,
  paginationRules,
  idRule,
  stringLengthRule,
  numberRangeRule
};