/**
 * @swagger
 * tags:
 *   name: 卖家管理
 *   description: 卖家端管理相关接口
 */

const express = require('express');
const router = express.Router();

router.get('/goods', (req, res) => {
  const list = Array.from({ length: 10 }).map((_, i) => ({
    id: i + 1,
    image: 'https://via.placeholder.com/40',
    name: '示例商品' + (i + 1),
    price: 99 + i,
    stock: 100 - i * 3,
    status: i % 2 === 0 ? '在售' : '下架'
  }));
  res.json({ code: 200, data: list });
});

router.get('/goods/:id', (req, res) => {
  const id = req.params.id;
  const data = {
    id,
    name: '示例商品',
    price: 199,
    stock: 80,
    brand: '品牌A',
    category: '分类A/子类A1',
    status: '在售',
    images: ['https://via.placeholder.com/120']
  };
  res.json({ code: 200, data });
});

router.post('/goods', (req, res) => {
  res.json({ code: 200, data: { id: Date.now() } });
});

router.post('/goods/shelf', (req, res) => {
  res.json({ code: 200, data: true });
});

router.get('/orders', (req, res) => {
  const list = Array.from({ length: 10 }).map((_, i) => ({
    orderNo: 'ORD' + (1000 + i),
    buyer: '用户' + (i + 1),
    amount: 199 + i,
    status: i % 3 === 0 ? '待发货' : i % 3 === 1 ? '已发货' : '已完成',
    createdAt: '2025-01-01'
  }));
  res.json({ code: 200, data: list });
});

router.get('/orders/:orderNo', (req, res) => {
  const orderNo = req.params.orderNo;
  const data = {
    orderNo,
    buyer: '张三',
    amount: 299.9,
    status: '待发货',
    createdAt: '2025-01-01',
    items: [
      { name: '示例商品1', price: 99, qty: 1 },
      { name: '示例商品2', price: 200.9, qty: 1 }
    ],
    address: '北京市海淀区中关村大街100号'
  };
  res.json({ code: 200, data });
});

router.post('/orders/ship', (req, res) => {
  res.json({ code: 200, data: true });
});

router.get('/aftersale', (req, res) => {
  const list = Array.from({ length: 8 }).map((_, i) => ({
    requestNo: 'AS' + (100 + i),
    orderNo: 'ORD' + (1000 + i),
    type: i % 2 === 0 ? '退货' : '退款',
    status: i % 3 === 0 ? '待处理' : i % 3 === 1 ? '通过' : '拒绝',
    customer: '用户' + (i + 1),
    createdAt: '2025-01-01'
  }));
  res.json({ code: 200, data: list });
});

router.post('/aftersale/approve', (req, res) => {
  res.json({ code: 200, data: true });
});

router.post('/aftersale/reject', (req, res) => {
  res.json({ code: 200, data: true });
});

router.get('/coupons', (req, res) => {
  const list = Array.from({ length: 6 }).map((_, i) => ({
    title: '优惠券' + (i + 1),
    type: i % 2 === 0 ? '满减' : '折扣',
    amount: i % 2 === 0 ? 30 : 8.8,
    threshold: 199,
    validity: '2025-01-01 ~ 2025-12-31',
    status: i % 3 === 0 ? '未开始' : i % 3 === 1 ? '进行中' : '已结束'
  }));
  res.json({ code: 200, data: list });
});

router.post('/coupons/toggle', (req, res) => {
  res.json({ code: 200, data: true });
});

router.get('/promotion/flash', (req, res) => {
  const list = Array.from({ length: 6 }).map((_, i) => ({
    title: '秒杀活动' + (i + 1),
    time: '每日 10:00-12:00',
    status: i % 3 === 0 ? '未开始' : i % 3 === 1 ? '进行中' : '已结束'
  }));
  res.json({ code: 200, data: list });
});

router.post('/promotion/flash/toggle', (req, res) => {
  res.json({ code: 200, data: true });
});

router.get('/promotion/full-discount', (req, res) => {
  const list = Array.from({ length: 6 }).map((_, i) => ({
    title: '满减活动' + (i + 1),
    rule: '满199减30',
    status: i % 3 === 0 ? '未开始' : i % 3 === 1 ? '进行中' : '已结束'
  }));
  res.json({ code: 200, data: list });
});

router.post('/promotion/full-discount/toggle', (req, res) => {
  res.json({ code: 200, data: true });
});

router.get('/settlement', (req, res) => {
  const data = {
    summary: { balance: 12540.5, pending: 890.2 },
    data: Array.from({ length: 6 }).map((_, i) => ({
      billNo: 'ST' + (100 + i),
      period: '2025-01',
      amount: 1999 + i * 10,
      status: i % 2 === 0 ? '已结算' : '待结算'
    }))
  };
  res.json({ code: 200, data });
});

router.get('/finance/bill', (req, res) => {
  const list = Array.from({ length: 8 }).map((_, i) => ({ billNo: 'RB' + (100 + i), period: '2025-01', amount: 2999 + i * 10 }));
  res.json({ code: 200, data: list });
});

router.get('/shop', (req, res) => {
  res.json({ code: 200, data: { name: '示例店铺', description: '示例描述', address: '示例地址' } });
});

router.put('/shop', (req, res) => {
  res.json({ code: 200, data: true });
});

router.get('/staff', (req, res) => {
  const list = Array.from({ length: 8 }).map((_, i) => ({ name: '员工' + (i + 1), role: i % 2 === 0 ? '店员' : '管理员', status: i % 3 === 0 ? '禁用' : '启用' }));
  res.json({ code: 200, data: list });
});

router.post('/staff', (req, res) => {
  res.json({ code: 200, data: true });
});

router.get('/roles', (req, res) => {
  const list = [
    { name: '管理员', permissions: ['商品', '订单', '促销', '财务', '设置'] },
    { name: '店员', permissions: ['商品', '订单'] }
  ];
  res.json({ code: 200, data: list });
});

router.post('/roles', (req, res) => {
  res.json({ code: 200, data: true });
});

router.get('/brands', (req, res) => {
  const list = Array.from({ length: 6 }).map((_, i) => ({ name: '品牌' + (i + 1), alias: 'Brand' + (i + 1) }));
  res.json({ code: 200, data: list });
});

router.post('/brands', (req, res) => {
  res.json({ code: 200, data: true });
});

router.get('/categories', (req, res) => {
  const list = [
    { title: '分类A', key: 'catA', children: [{ title: '子类A1', key: 'catA1' }] },
    { title: '分类B', key: 'catB', children: [{ title: '子类B1', key: 'catB1' }] }
  ];
  res.json({ code: 200, data: list });
});

router.post('/categories', (req, res) => {
  res.json({ code: 200, data: true });
});

/**
 * @swagger
 * /api/seller/register:
 *   post:
 *     summary: 卖家注册
 *     tags: [卖家管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - shopName
 *               - contactPhone
 *               - contactEmail
 *             properties:
 *               username: { type: string, description: '用户名' }
 *               password: { type: string, description: '密码' }
 *               shopName: { type: string, description: '店铺名称' }
 *               contactPhone: { type: string, description: '联系电话' }
 *               contactEmail: { type: string, description: '联系邮箱' }
 *               address: { type: string, description: '店铺地址' }
 *     responses:
 *       200: { $ref: '#/components/responses/200' }
 *       400: { $ref: '#/components/responses/400' }
 */
router.post('/register', async (req, res, next) => {
  try {
    res.json({ code: 200, message: '卖家注册路由', data: null });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/seller/login:
 *   post:
 *     summary: 卖家登录
 *     tags: [卖家管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username: { type: string, description: '用户名' }
 *               password: { type: string, description: '密码' }
 *     responses:
 *       200: { $ref: '#/components/responses/200' }
 *       400: { $ref: '#/components/responses/400' }
 *       401: { $ref: '#/components/responses/401' }
 */
router.post('/login', async (req, res, next) => {
  try {
    res.json({ code: 200, message: '卖家登录路由', data: null });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/seller/profile:
 *   get:
 *     summary: 获取卖家信息
 *     tags: [卖家管理]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200: { $ref: '#/components/responses/200' }
 *       401: { $ref: '#/components/responses/401' }
 */
router.get('/profile', async (req, res, next) => {
  try {
    res.json({ code: 200, message: '获取卖家信息路由', data: null });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/seller/profile:
 *   put:
 *     summary: 更新卖家信息
 *     tags: [卖家管理]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               shopName: { type: string, description: '店铺名称' }
 *               contactPhone: { type: string, description: '联系电话' }
 *               contactEmail: { type: string, description: '联系邮箱' }
 *               address: { type: string, description: '店铺地址' }
 *               description: { type: string, description: '店铺描述' }
 *               logo: { type: string, description: '店铺logo URL' }
 *     responses:
 *       200: { $ref: '#/components/responses/200' }
 *       400: { $ref: '#/components/responses/400' }
 *       401: { $ref: '#/components/responses/401' }
 */
router.put('/profile', async (req, res, next) => {
  try {
    res.json({ code: 200, message: '更新卖家信息路由', data: null });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/seller/password:
 *   put:
 *     summary: 修改密码
 *     tags: [卖家管理]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword: { type: string, description: '旧密码' }
 *               newPassword: { type: string, description: '新密码' }
 *     responses:
 *       200: { $ref: '#/components/responses/200' }
 *       400: { $ref: '#/components/responses/400' }
 *       401: { $ref: '#/components/responses/401' }
 */
router.put('/password', async (req, res, next) => {
  try {
    res.json({ code: 200, message: '修改密码路由', data: null });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /seller-api/seller/verify:
 *   post:
 *     summary: 卖家认证
 *     tags: [卖家管理]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - businessLicense
 *               - idCardFront
 *               - idCardBack
 *             properties:
 *               businessLicense: { type: string, description: '营业执照图片URL' }
 *               idCardFront: { type: string, description: '身份证正面图片URL' }
 *               idCardBack: { type: string, description: '身份证背面图片URL' }
 *               legalPersonName: { type: string, description: '法人姓名' }
 *               legalPersonIdCard: { type: string, description: '法人身份证号' }
 *     responses:
 *       200: { $ref: '#/components/responses/200' }
 *       400: { $ref: '#/components/responses/400' }
 *       401: { $ref: '#/components/responses/401' }
 */
router.post('/verify', async (req, res, next) => {
  try {
    res.json({ code: 200, message: '卖家认证路由', data: null });
  } catch (error) {
    next(error);
  }
});

module.exports = router;