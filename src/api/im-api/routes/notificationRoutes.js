/**
 * 通知路由模块
 * 处理即时通讯通知相关请求
 */

const express = require('express');
const router = express.Router();
const logger = require('../../core/utils/logger');
const db = require('../../core/database/database');
const pushService = require('../push/pushService');

/**
 * 获取通知列表
 * @route GET /api/im/notifications
 * @group 通知管理 - 通知相关操作
 * @param {number} req.query.page - 页码，默认1
 * @param {number} req.query.pageSize - 每页数量，默认20
 * @param {string} req.query.type - 通知类型筛选
 * @param {boolean} req.query.isRead - 是否已读筛选
 * @returns {Object} 200 - 通知列表
 */
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const type = req.query.type;
    const isRead = req.query.isRead !== undefined ? (req.query.isRead === 'true') : undefined;
    const offset = (page - 1) * pageSize;
    const userId = req.user.id || req.user.userId;
    
    logger.info(`用户 ${userId} 获取通知列表`);
    
    // 构建查询条件
    let query = `SELECT * FROM notifications WHERE user_id = $1`;
    let params = [userId];
    let countQuery = `SELECT COUNT(*) as count FROM notifications WHERE user_id = $1`;
    let countParams = [userId];
    
    // 添加筛选条件
    if (type) {
      query += ` AND type = $${params.length + 1}`;
      params.push(type);
      countQuery += ` AND type = $${countParams.length + 1}`;
      countParams.push(type);
    }
    
    if (isRead !== undefined) {
      query += ` AND is_read = $${params.length + 1}`;
      params.push(isRead);
      countQuery += ` AND is_read = $${countParams.length + 1}`;
      countParams.push(isRead);
    }
    
    // 添加排序和分页
    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(pageSize, offset);
    
    // 执行查询
    const result = await db.query(query, params);
    const notifications = result.rows;
    
    // 获取总数
    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);
    
    // 获取未读总数
    const unreadResult = await db.query(
      `SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = $1 AND is_read = false`,
      [userId]
    );
    const unreadCount = parseInt(unreadResult.rows[0].unread_count);
    
    res.json({ 
      message: '获取通知列表成功', 
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      }
    });
  } catch (error) {
    logger.error('获取通知列表失败:', error);
    res.status(500).json({ message: '服务器内部错误', success: false, error: error.message });
  }
});

/**
 * 标记通知已读
 * @route PUT /api/im/notifications/:id/read
 * @group 通知管理 - 通知相关操作
 * @param {string} req.params.id - 通知ID
 * @returns {Object} 200 - 标记成功
 */
router.put('/:id/read', async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.id || req.user.userId;
    
    logger.info(`用户 ${userId} 标记通知 ${notificationId} 为已读`);
    
    // 更新通知状态
    const query = `
      UPDATE notifications 
      SET is_read = true, read_at = $1 
      WHERE id = $2 AND user_id = $3
      RETURNING *
    `;
    const params = [new Date(), notificationId, userId];
    
    const result = await db.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: '通知不存在或无权操作', success: false });
    }
    
    res.json({ message: '通知已标记为已读', success: true });
  } catch (error) {
    logger.error('标记通知已读失败:', error);
    res.status(500).json({ message: '服务器内部错误', success: false, error: error.message });
  }
});

/**
 * 标记所有通知已读
 * @route PUT /api/im/notifications/read-all
 * @group 通知管理 - 通知相关操作
 * @param {string} req.query.type - 可选，按类型筛选
 * @returns {Object} 200 - 标记成功
 */
router.put('/read-all', async (req, res) => {
  try {
    const type = req.query.type;
    const userId = req.user.id || req.user.userId;
    
    logger.info(`用户 ${userId} 标记所有通知为已读`);
    
    // 构建更新语句
    let query = `UPDATE notifications SET is_read = true, read_at = $1 WHERE user_id = $2`;
    let params = [new Date(), userId];
    
    // 添加类型筛选
    if (type) {
      query += ` AND type = $${params.length + 1}`;
      params.push(type);
    }
    
    await db.query(query, params);
    
    res.json({ message: '所有通知已标记为已读', success: true });
  } catch (error) {
    logger.error('标记所有通知已读失败:', error);
    res.status(500).json({ message: '服务器内部错误', success: false, error: error.message });
  }
});

/**
 * 创建通知（管理员使用）
 * @route POST /api/im/notifications
 * @group 通知管理 - 通知相关操作
 * @param {Object} req.body - 通知数据
 * @param {string} req.body.userId - 接收用户ID
 * @param {string} req.body.title - 通知标题
 * @param {string} req.body.content - 通知内容
 * @param {string} req.body.type - 通知类型
 * @param {string} req.body.actionUrl - 操作链接
 * @param {Object} req.body.data - 附加数据
 * @returns {Object} 200 - 通知创建成功
 */
router.post('/', async (req, res) => {
  try {
    const { userId, title, content, type = 'system', actionUrl, data = {} } = req.body;
    const senderId = req.user.id || req.user.userId;
    
    if (!userId || !title || !content) {
      return res.status(400).json({ message: '缺少必要参数', success: false });
    }
    
    logger.info(`用户 ${senderId} 发送通知给 ${userId}`);
    
    // 创建通知
    const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 保存通知到数据库
    const query = `
      INSERT INTO notifications (id, user_id, type, title, message, is_read, sender_id, action_url, metadata, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    const params = [
      notificationId, userId, type, title, content, false, senderId, actionUrl, data, 
      new Date(), new Date()
    ];
    
    const result = await db.query(query, params);
    const notification = result.rows[0];
    
    // 推送通知
    await pushService.pushMessage({
      userId,
      title,
      content,
      type: 'notification',
      data: { notificationId, ...data },
      channels: ['websocket', 'app', 'email']
    });
    
    res.json({ 
      message: '通知创建成功', 
      success: true,
      data: notification
    });
  } catch (error) {
    logger.error('创建通知失败:', error);
    res.status(500).json({ message: '服务器内部错误', success: false, error: error.message });
  }
});

/**
 * 删除通知
 * @route DELETE /api/im/notifications/:id
 * @group 通知管理 - 通知相关操作
 * @param {string} req.params.id - 通知ID
 * @returns {Object} 200 - 删除成功
 */
router.delete('/:id', async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.id || req.user.userId;
    
    logger.info(`用户 ${userId} 删除通知 ${notificationId}`);
    
    // 删除通知
    const query = `DELETE FROM notifications WHERE id = $1 AND user_id = $2`;
    const params = [notificationId, userId];
    
    const result = await db.query(query, params);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ message: '通知不存在或无权操作', success: false });
    }
    
    res.json({ message: '通知删除成功', success: true });
  } catch (error) {
    logger.error('删除通知失败:', error);
    res.status(500).json({ message: '服务器内部错误', success: false, error: error.message });
  }
});

/**
 * 获取未读通知数量
 * @route GET /api/im/notifications/unread-count
 * @group 通知管理 - 通知相关操作
 * @returns {Object} 200 - 未读数量
 */
router.get('/unread-count', async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    
    // 获取未读通知数量
    const result = await db.query(
      `SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = $1 AND is_read = false`,
      [userId]
    );
    
    const unreadCount = parseInt(result.rows[0].unread_count);
    
    res.json({ 
      message: '获取未读通知数量成功', 
      success: true,
      data: { unreadCount }
    });
  } catch (error) {
    logger.error('获取未读通知数量失败:', error);
    res.status(500).json({ message: '服务器内部错误', success: false, error: error.message });
  }
});

module.exports = router;