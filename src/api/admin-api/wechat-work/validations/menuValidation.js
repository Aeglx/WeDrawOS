/**
 * 企业微信自定义菜单管理验证规则
 * 确保API输入数据的合法性
 */

const { body, query } = require('express-validator');

/**
 * 自定义菜单创建验证规则
 */
const createMenuValidation = [
  body('button')
    .isArray()
    .withMessage('菜单按钮必须是数组格式')
    .custom((buttons) => {
      // 检查一级菜单数量限制
      if (buttons.length > 3) {
        throw new Error('一级菜单最多只能有3个');
      }
      
      // 检查每个一级菜单
      buttons.forEach((button, index) => {
        // 检查菜单名称
        if (!button.name || button.name.length === 0 || button.name.length > 16) {
          throw new Error(`第${index + 1}个一级菜单名称不能为空且不能超过16个字节`);
        }
        
        // 检查是否包含子菜单
        if (button.sub_button && Array.isArray(button.sub_button)) {
          // 检查子菜单数量限制
          if (button.sub_button.length > 5) {
            throw new Error(`第${index + 1}个一级菜单的子菜单最多只能有5个`);
          }
          
          // 检查子菜单不能同时存在type属性
          if (button.type) {
            throw new Error(`第${index + 1}个一级菜单包含子菜单时，不能设置type属性`);
          }
          
          // 检查每个子菜单
          button.sub_button.forEach((subButton, subIndex) => {
            if (!subButton.name || subButton.name.length === 0 || subButton.name.length > 40) {
              throw new Error(`第${index + 1}个一级菜单的第${subIndex + 1}个子菜单名称不能为空且不能超过40个字节`);
            }
            
            if (!subButton.type) {
              throw new Error(`第${index + 1}个一级菜单的第${subIndex + 1}个子菜单必须设置type属性`);
            }
            
            validateMenuButtonType(subButton, `第${index + 1}个一级菜单的第${subIndex + 1}个子菜单`);
          });
        } else {
          // 如果没有子菜单，必须有type属性
          if (!button.type) {
            throw new Error(`第${index + 1}个一级菜单必须设置type属性`);
          }
          
          validateMenuButtonType(button, `第${index + 1}个一级菜单`);
        }
      });
      
      return true;
    })
];

/**
 * 验证菜单按钮类型
 * @param {Object} button - 菜单按钮对象
 * @param {string} buttonDesc - 按钮描述
 */
function validateMenuButtonType(button, buttonDesc) {
  const { type, key, url, media_id, appid, pagepath } = button;
  
  // 检查支持的按钮类型
  const validTypes = ['click', 'view', 'scancode_push', 'scancode_waitmsg', 'pic_sysphoto', 
                     'pic_photo_or_album', 'pic_weixin', 'location_select', 'media_id', 
                     'view_limited', 'miniprogram'];
  
  if (!validTypes.includes(type)) {
    throw new Error(`${buttonDesc}的type属性必须是支持的类型`);
  }
  
  // 根据类型验证必需的属性
  switch (type) {
    case 'click':
    case 'scancode_push':
    case 'scancode_waitmsg':
    case 'pic_sysphoto':
    case 'pic_photo_or_album':
    case 'pic_weixin':
    case 'location_select':
      if (!key || key.length === 0 || key.length > 128) {
        throw new Error(`${buttonDesc}的key属性不能为空且不能超过128个字节`);
      }
      break;
      
    case 'view':
      if (!url || url.length === 0 || url.length > 256) {
        throw new Error(`${buttonDesc}的url属性不能为空且不能超过256个字节`);
      }
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        throw new Error(`${buttonDesc}的url属性必须以http://或https://开头`);
      }
      break;
      
    case 'media_id':
    case 'view_limited':
      if (!media_id || media_id.length === 0) {
        throw new Error(`${buttonDesc}的media_id属性不能为空`);
      }
      break;
      
    case 'miniprogram':
      if (!appid || appid.length === 0) {
        throw new Error(`${buttonDesc}的appid属性不能为空`);
      }
      if (!pagepath || pagepath.length === 0) {
        throw new Error(`${buttonDesc}的pagepath属性不能为空`);
      }
      if (!url || url.length === 0 || url.length > 256) {
        throw new Error(`${buttonDesc}的url属性不能为空且不能超过256个字节`);
      }
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        throw new Error(`${buttonDesc}的url属性必须以http://或https://开头`);
      }
      break;
  }
}

/**
 * 个性化菜单创建验证规则
 */
const createConditionalMenuValidation = [
  ...createMenuValidation,
  body('matchrule')
    .isObject()
    .withMessage('匹配规则必须是对象格式')
    .custom((matchrule) => {
      // 检查匹配规则必须至少包含一个字段
      const hasRule = Object.keys(matchrule).some(key => matchrule[key] !== undefined && matchrule[key] !== null);
      if (!hasRule) {
        throw new Error('匹配规则必须至少包含一个匹配条件');
      }
      
      // 检查部门规则
      if (matchrule.tag_id_list && Array.isArray(matchrule.tag_id_list)) {
        if (matchrule.tag_id_list.length > 10) {
          throw new Error('标签列表最多只能包含10个标签ID');
        }
      }
      
      // 检查性别规则
      if (matchrule.sex !== undefined) {
        if (![0, 1, 2].includes(matchrule.sex)) {
          throw new Error('性别必须是0(未设置)、1(男性)或2(女性)');
        }
      }
      
      // 检查手机操作系统规则
      if (matchrule.client_platform_type !== undefined) {
        const validPlatforms = [0, 1, 2, 3, 4, 5];
        if (!validPlatforms.includes(matchrule.client_platform_type)) {
          throw new Error('手机操作系统必须是有效的平台类型');
        }
      }
      
      // 检查国家/地区规则
      if (matchrule.country && (matchrule.country.length === 0 || matchrule.country.length > 16)) {
        throw new Error('国家/地区名称不能为空且不能超过16个字节');
      }
      
      // 检查省份规则
      if (matchrule.province && (matchrule.province.length === 0 || matchrule.province.length > 16)) {
        throw new Error('省份名称不能为空且不能超过16个字节');
      }
      
      // 检查城市规则
      if (matchrule.city && (matchrule.city.length === 0 || matchrule.city.length > 16)) {
        throw new Error('城市名称不能为空且不能超过16个字节');
      }
      
      // 检查语言规则
      if (matchrule.language) {
        const validLanguages = ['zh_CN', 'zh_TW', 'en'];
        if (!validLanguages.includes(matchrule.language)) {
          throw new Error('语言必须是zh_CN、zh_TW或en');
        }
      }
      
      return true;
    })
];

/**
 * 个性化菜单删除验证规则
 */
const deleteConditionalMenuValidation = [
  body('menuid')
    .notEmpty()
    .withMessage('菜单ID不能为空')
    .trim()
];

/**
 * 菜单事件处理验证规则
 */
const menuEventValidation = [
  body('name')
    .notEmpty()
    .withMessage('事件名称不能为空')
    .trim()
    .isLength({ max: 50 })
    .withMessage('事件名称不能超过50个字符'),
    
  body('key')
    .notEmpty()
    .withMessage('事件key不能为空')
    .trim()
    .isLength({ max: 128 })
    .withMessage('事件key不能超过128个字符'),
    
  body('type')
    .notEmpty()
    .withMessage('事件类型不能为空')
    .trim()
    .isIn(['click', 'view', 'miniprogram', 'media_id', 'view_limited', 'scancode_push', 
           'scancode_waitmsg', 'pic_sysphoto', 'pic_photo_or_album', 'pic_weixin', 'location_select'])
    .withMessage('无效的事件类型'),
    
  body('action')
    .notEmpty()
    .withMessage('事件动作不能为空')
    .trim()
    .isLength({ max: 200 })
    .withMessage('事件动作不能超过200个字符'),
    
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('描述不能超过200个字符')
];

/**
 * 菜单事件更新验证规则
 */
const updateMenuEventValidation = [
  body('id')
    .notEmpty()
    .withMessage('事件ID不能为空')
    .trim(),
    
  ...menuEventValidation
];

/**
 * 菜单事件删除验证规则
 */
const deleteMenuEventValidation = [
  body('ids')
    .isArray()
    .withMessage('事件ID列表必须是数组格式')
    .custom((ids) => {
      if (ids.length === 0) {
        throw new Error('事件ID列表不能为空');
      }
      if (ids.length > 100) {
        throw new Error('一次最多只能删除100个事件');
      }
      return true;
    })
];

/**
 * 菜单测试验证规则
 */
const testMenuValidation = [
  body('userid')
    .notEmpty()
    .withMessage('测试用户ID不能为空')
    .trim()
];

/**
 * 菜单配置保存验证规则
 */
const saveMenuConfigValidation = [
  body('name')
    .notEmpty()
    .withMessage('配置名称不能为空')
    .trim()
    .isLength({ max: 50 })
    .withMessage('配置名称不能超过50个字符'),
    
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('配置描述不能超过200个字符'),
    
  body('menuData')
    .isObject()
    .withMessage('菜单数据必须是对象格式')
];

/**
 * 菜单配置列表验证规则
 */
const listMenuConfigValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是大于等于1的整数')
    .toInt(),
    
  query('pageSize')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量必须是1-100之间的整数')
    .toInt(),
    
  query('keyword')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('关键词不能超过50个字符')
];

/**
 * 菜单配置删除验证规则
 */
const deleteMenuConfigValidation = [
  body('ids')
    .isArray()
    .withMessage('配置ID列表必须是数组格式')
    .custom((ids) => {
      if (ids.length === 0) {
        throw new Error('配置ID列表不能为空');
      }
      if (ids.length > 50) {
        throw new Error('一次最多只能删除50个配置');
      }
      return true;
    })
];

/**
 * 菜单分析数据验证规则
 */
const getMenuAnalysisValidation = [
  query('startDate')
    .notEmpty()
    .withMessage('开始日期不能为空')
    .trim()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('开始日期格式必须为YYYY-MM-DD'),
    
  query('endDate')
    .notEmpty()
    .withMessage('结束日期不能为空')
    .trim()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('结束日期格式必须为YYYY-MM-DD')
];

module.exports = {
  createMenuValidation,
  createConditionalMenuValidation,
  deleteConditionalMenuValidation,
  menuEventValidation,
  updateMenuEventValidation,
  deleteMenuEventValidation,
  testMenuValidation,
  saveMenuConfigValidation,
  listMenuConfigValidation,
  deleteMenuConfigValidation,
  getMenuAnalysisValidation
};