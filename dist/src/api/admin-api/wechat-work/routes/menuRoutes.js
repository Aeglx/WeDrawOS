/**
 * 企业微信自定义菜单管理路由
 * 配置API接口路径和中间件
 */

const express = require('express');
const router = express.Router();
const { validateRequest } = require('../../../middlewares/validationMiddleware');
const { authMiddleware } = require('../../../middlewares/authMiddleware');
const { permissionMiddleware } = require('../../../middlewares/permissionMiddleware');
const menuController = require('../controllers/menuController');
const { 
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
} = require('../validations/menuValidation');

/**
 * @swagger
 * tags:
 *   name: WechatWorkMenu
 *   description: 企业微信自定义菜单管理
 */

// 自定义菜单管理
/**
 * @swagger
 * /api/admin-api/wechat-work/menu/create:  
 *   post:
 *     summary: 创建自定义菜单
 *     tags: [WechatWorkMenu]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               button: 
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name: 
 *                       type: string
 *                       description: 菜单名称
 *                     type: 
 *                       type: string
 *                       description: 菜单类型
 *                     key: 
 *                       type: string
 *                       description: 菜单KEY值
 *                     url: 
 *                       type: string
 *                       description: 网页链接
 *                     sub_button: 
 *                       type: array
 *                       items: 
 *                         type: object
 *     responses:
 *       200: 
 *         description: 创建成功
 *       400: 
 *         description: 参数错误
 *       401: 
 *         description: 未授权
 *       500: 
 *         description: 服务器错误
 */
router.post(
  '/create',
  authMiddleware,
  permissionMiddleware(['wechat_work_menu_create']),
  createMenuValidation,
  validateRequest,
  menuController.createMenu
);

/**
 * @swagger
 * /api/admin-api/wechat-work/menu/get:  
 *   get:
 *     summary: 获取自定义菜单
 *     tags: [WechatWorkMenu]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: 
 *         description: 获取成功
 *       401: 
 *         description: 未授权
 *       500: 
 *         description: 服务器错误
 */
router.get(
  '/get',
  authMiddleware,
  permissionMiddleware(['wechat_work_menu_view']),
  menuController.getMenu
);

/**
 * @swagger
 * /api/admin-api/wechat-work/menu/delete:  
 *   delete:
 *     summary: 删除自定义菜单
 *     tags: [WechatWorkMenu]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: 
 *         description: 删除成功
 *       401: 
 *         description: 未授权
 *       500: 
 *         description: 服务器错误
 */
router.delete(
  '/delete',
  authMiddleware,
  permissionMiddleware(['wechat_work_menu_delete']),
  menuController.deleteMenu
);

/**
 * @swagger
 * /api/admin-api/wechat-work/menu/save-config:  
 *   post:
 *     summary: 保存菜单配置
 *     tags: [WechatWorkMenu]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: 
 *                 type: string
 *                 description: 配置名称
 *               description: 
 *                 type: string
 *                 description: 配置描述
 *               menuData: 
 *                 type: object
 *                 description: 菜单数据
 *     responses:
 *       200: 
 *         description: 保存成功
 *       400: 
 *         description: 参数错误
 *       401: 
 *         description: 未授权
 *       500: 
 *         description: 服务器错误
 */
router.post(
  '/save-config',
  authMiddleware,
  permissionMiddleware(['wechat_work_menu_config_save']),
  saveMenuConfigValidation,
  validateRequest,
  menuController.saveMenuConfig
);

/**
 * @swagger
 * /api/admin-api/wechat-work/menu/list-config:  
 *   get:
 *     summary: 获取菜单配置列表
 *     tags: [WechatWorkMenu]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: 页码
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *         description: 每页数量
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: 搜索关键词
 *     responses:
 *       200: 
 *         description: 获取成功
 *       401: 
 *         description: 未授权
 *       500: 
 *         description: 服务器错误
 */
router.get(
  '/list-config',
  authMiddleware,
  permissionMiddleware(['wechat_work_menu_config_view']),
  listMenuConfigValidation,
  validateRequest,
  menuController.listMenuConfig
);

/**
 * @swagger
 * /api/admin-api/wechat-work/menu/get-config/{id}:  
 *   get:
 *     summary: 获取菜单配置详情
 *     tags: [WechatWorkMenu]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: 配置ID
 *     responses:
 *       200: 
 *         description: 获取成功
 *       400: 
 *         description: 参数错误
 *       401: 
 *         description: 未授权
 *       404: 
 *         description: 配置不存在
 *       500: 
 *         description: 服务器错误
 */
router.get(
  '/get-config/:id',
  authMiddleware,
  permissionMiddleware(['wechat_work_menu_config_view']),
  menuController.getMenuConfig
);

/**
 * @swagger
 * /api/admin-api/wechat-work/menu/update-config/{id}:  
 *   put:
 *     summary: 更新菜单配置
 *     tags: [WechatWorkMenu]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: 配置ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: 
 *                 type: string
 *                 description: 配置名称
 *               description: 
 *                 type: string
 *                 description: 配置描述
 *               menuData: 
 *                 type: object
 *                 description: 菜单数据
 *     responses:
 *       200: 
 *         description: 更新成功
 *       400: 
 *         description: 参数错误
 *       401: 
 *         description: 未授权
 *       404: 
 *         description: 配置不存在
 *       500: 
 *         description: 服务器错误
 */
router.put(
  '/update-config/:id',
  authMiddleware,
  permissionMiddleware(['wechat_work_menu_config_update']),
  saveMenuConfigValidation,
  validateRequest,
  menuController.updateMenuConfig
);

/**
 * @swagger
 * /api/admin-api/wechat-work/menu/delete-config:  
 *   delete:
 *     summary: 删除菜单配置
 *     tags: [WechatWorkMenu]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ids: 
 *                 type: array
 *                 items: 
 *                   type: string
 *                 description: 配置ID列表
 *     responses:
 *       200: 
 *         description: 删除成功
 *       400: 
 *         description: 参数错误
 *       401: 
 *         description: 未授权
 *       500: 
 *         description: 服务器错误
 */
router.delete(
  '/delete-config',
  authMiddleware,
  permissionMiddleware(['wechat_work_menu_config_delete']),
  deleteMenuConfigValidation,
  validateRequest,
  menuController.deleteMenuConfig
);

/**
 * @swagger
 * /api/admin-api/wechat-work/menu/test:  
 *   post:
 *     summary: 测试菜单
 *     tags: [WechatWorkMenu]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userid: 
 *                 type: string
 *                 description: 测试用户ID
 *     responses:
 *       200: 
 *         description: 测试成功
 *       400: 
 *         description: 参数错误
 *       401: 
 *         description: 未授权
 *       500: 
 *         description: 服务器错误
 */
router.post(
  '/test',
  authMiddleware,
  permissionMiddleware(['wechat_work_menu_test']),
  testMenuValidation,
  validateRequest,
  menuController.testMenu
);

/**
 * @swagger
 * /api/admin-api/wechat-work/menu/analysis:  
 *   get:
 *     summary: 获取菜单分析数据
 *     tags: [WechatWorkMenu]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *         required: true
 *         description: 开始日期 (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *         required: true
 *         description: 结束日期 (YYYY-MM-DD)
 *     responses:
 *       200: 
 *         description: 获取成功
 *       400: 
 *         description: 参数错误
 *       401: 
 *         description: 未授权
 *       500: 
 *         description: 服务器错误
 */
router.get(
  '/analysis',
  authMiddleware,
  permissionMiddleware(['wechat_work_menu_analysis']),
  getMenuAnalysisValidation,
  validateRequest,
  menuController.getMenuAnalysis
);

// 个性化菜单管理
/**
 * @swagger
 * /api/admin-api/wechat-work/menu/conditional/create:  
 *   post:
 *     summary: 创建个性化菜单
 *     tags: [WechatWorkMenu]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               button: 
 *                 type: array
 *                 items:
 *                   type: object
 *               matchrule: 
 *                 type: object
 *                 description: 匹配规则
 *     responses:
 *       200: 
 *         description: 创建成功
 *       400: 
 *         description: 参数错误
 *       401: 
 *         description: 未授权
 *       500: 
 *         description: 服务器错误
 */
router.post(
  '/conditional/create',
  authMiddleware,
  permissionMiddleware(['wechat_work_menu_conditional_create']),
  createConditionalMenuValidation,
  validateRequest,
  menuController.createConditionalMenu
);

/**
 * @swagger
 * /api/admin-api/wechat-work/menu/conditional/list:  
 *   get:
 *     summary: 获取个性化菜单列表
 *     tags: [WechatWorkMenu]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: 
 *         description: 获取成功
 *       401: 
 *         description: 未授权
 *       500: 
 *         description: 服务器错误
 */
router.get(
  '/conditional/list',
  authMiddleware,
  permissionMiddleware(['wechat_work_menu_conditional_view']),
  menuController.listConditionalMenu
);

/**
 * @swagger
 * /api/admin-api/wechat-work/menu/conditional/delete:  
 *   post:
 *     summary: 删除个性化菜单
 *     tags: [WechatWorkMenu]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               menuid: 
 *                 type: string
 *                 description: 菜单ID
 *     responses:
 *       200: 
 *         description: 删除成功
 *       400: 
 *         description: 参数错误
 *       401: 
 *         description: 未授权
 *       500: 
 *         description: 服务器错误
 */
router.post(
  '/conditional/delete',
  authMiddleware,
  permissionMiddleware(['wechat_work_menu_conditional_delete']),
  deleteConditionalMenuValidation,
  validateRequest,
  menuController.deleteConditionalMenu
);

/**
 * @swagger
 * /api/admin-api/wechat-work/menu/conditional/test:  
 *   post:
 *     summary: 测试个性化菜单匹配
 *     tags: [WechatWorkMenu]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userid: 
 *                 type: string
 *                 description: 测试用户ID
 *     responses:
 *       200: 
 *         description: 测试成功
 *       400: 
 *         description: 参数错误
 *       401: 
 *         description: 未授权
 *       500: 
 *         description: 服务器错误
 */
router.post(
  '/conditional/test',
  authMiddleware,
  permissionMiddleware(['wechat_work_menu_conditional_test']),
  testMenuValidation,
  validateRequest,
  menuController.testConditionalMenu
);

// 菜单事件管理
/**
 * @swagger
 * /api/admin-api/wechat-work/menu/event/create:  
 *   post:
 *     summary: 添加菜单事件
 *     tags: [WechatWorkMenu]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: 
 *                 type: string
 *                 description: 事件名称
 *               key: 
 *                 type: string
 *                 description: 事件key
 *               type: 
 *                 type: string
 *                 description: 事件类型
 *               action: 
 *                 type: string
 *                 description: 事件动作
 *               description: 
 *                 type: string
 *                 description: 描述
 *     responses:
 *       200: 
 *         description: 创建成功
 *       400: 
 *         description: 参数错误
 *       401: 
 *         description: 未授权
 *       500: 
 *         description: 服务器错误
 */
router.post(
  '/event/create',
  authMiddleware,
  permissionMiddleware(['wechat_work_menu_event_create']),
  menuEventValidation,
  validateRequest,
  menuController.createMenuEvent
);

/**
 * @swagger
 * /api/admin-api/wechat-work/menu/event/list:  
 *   get:
 *     summary: 获取菜单事件列表
 *     tags: [WechatWorkMenu]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: 页码
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *         description: 每页数量
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: 搜索关键词
 *     responses:
 *       200: 
 *         description: 获取成功
 *       401: 
 *         description: 未授权
 *       500: 
 *         description: 服务器错误
 */
router.get(
  '/event/list',
  authMiddleware,
  permissionMiddleware(['wechat_work_menu_event_view']),
  listMenuConfigValidation,
  validateRequest,
  menuController.listMenuEvent
);

/**
 * @swagger
 * /api/admin-api/wechat-work/menu/event/update/{id}:  
 *   put:
 *     summary: 更新菜单事件
 *     tags: [WechatWorkMenu]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: 事件ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: 
 *                 type: string
 *                 description: 事件名称
 *               key: 
 *                 type: string
 *                 description: 事件key
 *               type: 
 *                 type: string
 *                 description: 事件类型
 *               action: 
 *                 type: string
 *                 description: 事件动作
 *               description: 
 *                 type: string
 *                 description: 描述
 *     responses:
 *       200: 
 *         description: 更新成功
 *       400: 
 *         description: 参数错误
 *       401: 
 *         description: 未授权
 *       404: 
 *         description: 事件不存在
 *       500: 
 *         description: 服务器错误
 */
router.put(
  '/event/update/:id',
  authMiddleware,
  permissionMiddleware(['wechat_work_menu_event_update']),
  updateMenuEventValidation,
  validateRequest,
  menuController.updateMenuEvent
);

/**
 * @swagger
 * /api/admin-api/wechat-work/menu/event/delete:  
 *   delete:
 *     summary: 删除菜单事件
 *     tags: [WechatWorkMenu]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ids: 
 *                 type: array
 *                 items: 
 *                   type: string
 *                 description: 事件ID列表
 *     responses:
 *       200: 
 *         description: 删除成功
 *       400: 
 *         description: 参数错误
 *       401: 
 *         description: 未授权
 *       500: 
 *         description: 服务器错误
 */
router.delete(
  '/event/delete',
  authMiddleware,
  permissionMiddleware(['wechat_work_menu_event_delete']),
  deleteMenuEventValidation,
  validateRequest,
  menuController.deleteMenuEvent
);

// 其他菜单相关接口
/**
 * @swagger
 * /api/admin-api/wechat-work/menu/sync:  
 *   post:
 *     summary: 同步菜单配置
 *     tags: [WechatWorkMenu]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: 
 *         description: 同步成功
 *       401: 
 *         description: 未授权
 *       500: 
 *         description: 服务器错误
 */
router.post(
  '/sync',
  authMiddleware,
  permissionMiddleware(['wechat_work_menu_sync']),
  menuController.syncMenu
);

/**
 * @swagger
 * /api/admin-api/wechat-work/menu/logs:  
 *   get:
 *     summary: 获取菜单操作日志
 *     tags: [WechatWorkMenu]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: 页码
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *         description: 每页数量
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *         description: 开始日期
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *         description: 结束日期
 *     responses:
 *       200: 
 *         description: 获取成功
 *       401: 
 *         description: 未授权
 *       500: 
 *         description: 服务器错误
 */
router.get(
  '/logs',
  authMiddleware,
  permissionMiddleware(['wechat_work_menu_logs']),
  menuController.getMenuLogs
);

module.exports = router;