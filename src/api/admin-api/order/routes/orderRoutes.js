/**
 * 订单管理路由
 * 定义订单相关的API接口路径
 */

// 引入控制器
const orderController = require('../controllers/orderController');

/**
 * 配置订单管理路由
 * @param {Object} router - Express路由器
 */
const configureOrderRoutes = (router) => {
  /**
   * @swagger
   * /api/admin/order/list: 
   *   get:
   *     summary: 获取订单列表
   *     description: 根据查询条件获取订单列表，支持分页
   *     tags: [订单管理]
   *     parameters:
   *       - name: page
   *         in: query
   *         description: 页码
   *         required: false
   *         type: integer
   *       - name: pageSize
   *         in: query
   *         description: 每页数量
   *         required: false
   *         type: integer
   *       - name: orderId
   *         in: query
   *         description: 订单号
   *         required: false
   *         type: string
   *       - name: memberName
   *         in: query
   *         description: 会员名称
   *         required: false
   *         type: string
   *       - name: startTime
   *         in: query
   *         description: 开始时间
   *         required: false
   *         type: string
   *       - name: endTime
   *         in: query
   *         description: 结束时间
   *         required: false
   *         type: string
   *       - name: status
   *         in: query
   *         description: 订单状态
   *         required: false
   *         type: string
   *     responses:
   *       200: 
   *         description: 成功
   *         content: 
   *           application/json: 
   *             schema: 
   *               type: object
   *               properties: 
   *                 success: 
   *                   type: boolean
   *                 data: 
   *                   type: array
   *                   items: 
   *                     type: object
   *                 total: 
   *                   type: integer
   */
  router.get('/api/admin/order/list', orderController.getOrderList);

  /**
   * @swagger
   * /api/admin/order/detail/{orderId}: 
   *   get:
   *     summary: 获取订单详情
   *     description: 根据订单ID获取订单详情信息
   *     tags: [订单管理]
   *     parameters:
   *       - name: orderId
   *         in: path
   *         description: 订单ID
   *         required: true
   *         type: string
   *     responses:
   *       200: 
   *         description: 成功
   *         content: 
   *           application/json: 
   *             schema: 
   *               type: object
   *               properties: 
   *                 success: 
   *                   type: boolean
   *                 data: 
   *                   type: object
   */
  router.get('/api/admin/order/detail/:orderId', orderController.getOrderDetail);

  /**
   * @swagger
   * /api/admin/order/collect/{orderId}: 
   *   post:
   *     summary: 订单收款
   *     description: 对指定订单进行收款操作
   *     tags: [订单管理]
   *     parameters:
   *       - name: orderId
   *         in: path
   *         description: 订单ID
   *         required: true
   *         type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               paymentMethod:
   *                 type: string
   *                 description: 支付方式
   *               transactionId:
   *                 type: string
   *                 description: 交易流水号
   *     responses:
   *       200: 
   *         description: 成功
   *         content: 
   *           application/json: 
   *             schema: 
   *               type: object
   *               properties: 
   *                 success: 
   *                   type: boolean
   *                 data: 
   *                   type: object
   */
  router.post('/api/admin/order/collect/:orderId', orderController.collectPayment);
};

module.exports = configureOrderRoutes;