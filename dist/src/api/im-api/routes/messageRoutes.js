/**
 * 消息路由模块
 * 处理即时通讯消息相关请求
 */

const express = require('express');
const router = express.Router();
const logger = require('../../core/utils/logger');
const db = require('../../core/database/database');
const websocketService = require('../websocket/websocketService');
const pushService = require('../push/pushService');

/**
 * 发送消息
 * @route POST /api/im/messages
 * @group 消息管理 - 消息相关操作
 * @param {Object} req.body - 消息数据
 * @param {string} req.body.conversationId - 会话ID
 * @param {string} req.body.receiverId - 接收者ID
 * @param {string} req.body.type - 消息类型(text/image/voice/video/file/system)
 * @param {string} req.body.content - 消息内容
 * @param {Object} req.body.metadata - 附加数据
 * @returns {Object} 200 - 消息发送成功
 */
router.post('/', async (req, res) => {
  try {
    const { conversationId, receiverId, type = 'text', content, metadata = {} } = req.body;
    const senderId = req.user.id || req.user.userId;
    
    if (!conversationId || !receiverId || !content) {
      return res.status(400).json({ message: '缺少必要参数', success: false });
    }

    logger.info(`用户 ${senderId} 发送消息给 ${receiverId}`);
    
    // 创建消息对象
    const message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      conversationId,
      senderId,
      receiverId,
      type,
      content,
      status: 'sent',
      isRead: false,
      metadata,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // 保存消息到数据库
    const query = `
      INSERT INTO messages (id, conversation_id, sender_id, receiver_id, type, content, status, is_read, metadata, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    const params = [
      message.id, conversationId, senderId, receiverId, type, content, 
      message.status, message.isRead, metadata, message.createdAt, message.updatedAt
    ];
    
    const dbResult = await db.query(query, params);
    const savedMessage = dbResult.rows[0];
    
    // 更新会话的最后消息
    await db.query(
      `UPDATE conversations SET last_message_id = $1, last_message_at = $2 WHERE id = $3`,
      [message.id, message.createdAt, conversationId]
    );
    
    // 通过WebSocket发送消息
    const wsResult = websocketService.send(receiverId, {
      type: 'message',
      data: savedMessage
    });
    
    // 如果WebSocket发送失败，使用其他推送渠道
    if (!wsResult) {
      await pushService.pushMessage({
        userId: receiverId,
        title: '新消息',
        content: type === 'text' ? content : `收到一条${type}消息`,
        type: 'message',
        data: { messageId: message.id, conversationId },
        channels: ['app', 'email', 'sms']
      });
    }
    
    res.json({ 
      message: '消息发送成功', 
      success: true,
      data: savedMessage
    });
  } catch (error) {
    logger.error('发送消息失败:', error);
    res.status(500).json({ message: '服务器内部错误', success: false, error: error.message });
  }
});

/**
 * 获取消息历史
 * @route GET /api/im/messages/conversation/:id
 * @group 消息管理 - 消息相关操作
 * @param {string} req.params.id - 会话ID
 * @param {number} req.query.page - 页码，默认1
 * @param {number} req.query.pageSize - 每页数量，默认20
 * @returns {Object} 200 - 消息列表
 */
router.get('/conversation/:id', async (req, res) => {
  try {
    const conversationId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const offset = (page - 1) * pageSize;
    const userId = req.user.id || req.user.userId;
    
    logger.info(`用户 ${userId} 获取会话 ${conversationId} 的消息历史`);
    
    // 检查用户是否有权限查看该会话
    const participantCheck = await db.query(
      `SELECT * FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2 AND is_active = true`,
      [conversationId, userId]
    );
    
    if (participantCheck.rows.length === 0) {
      return res.status(403).json({ message: '无权访问该会话', success: false });
    }
    
    // 获取消息列表
    const query = `
      SELECT * FROM messages 
      WHERE conversation_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3
    `;
    const params = [conversationId, pageSize, offset];
    
    const result = await db.query(query, params);
    const messages = result.rows.reverse(); // 按时间正序返回
    
    // 获取总数
    const countResult = await db.query(
      `SELECT COUNT(*) as count FROM messages WHERE conversation_id = $1`,
      [conversationId]
    );
    const total = parseInt(countResult.rows[0].count);
    
    res.json({ 
      message: '获取消息历史成功', 
      success: true,
      data: {
        messages,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      }
    });
  } catch (error) {
    logger.error('获取消息历史失败:', error);
    res.status(500).json({ message: '服务器内部错误', success: false, error: error.message });
  }
});

/**
 * 标记消息已读
 * @route PUT /api/im/messages/:id/read
 * @group 消息管理 - 消息相关操作
 * @param {string} req.params.id - 消息ID
 * @returns {Object} 200 - 标记成功
 */
router.put('/:id/read', async (req, res) => {
  try {
    const messageId = req.params.id;
    const userId = req.user.id || req.user.userId;
    
    logger.info(`用户 ${userId} 标记消息 ${messageId} 为已读`);
    
    // 更新消息状态
    const query = `
      UPDATE messages 
      SET is_read = true, read_at = $1 
      WHERE id = $2 AND receiver_id = $3
      RETURNING *
    `;
    const params = [new Date(), messageId, userId];
    
    const result = await db.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: '消息不存在或无权操作', success: false });
    }
    
    // 更新会话参与者的最后读取消息
    await db.query(
      `UPDATE conversation_participants 
       SET last_read_message_id = $1 
       WHERE conversation_id = $2 AND user_id = $3`,
      [messageId, result.rows[0].conversation_id, userId]
    );
    
    res.json({ message: '消息已标记为已读', success: true });
  } catch (error) {
    logger.error('标记消息已读失败:', error);
    res.status(500).json({ message: '服务器内部错误', success: false, error: error.message });
  }
});

/**
 * 批量标记消息已读
 * @route PUT /api/im/messages/batch-read
 * @group 消息管理 - 消息相关操作
 * @param {string} req.body.conversationId - 会话ID
 * @param {Array} req.body.messageIds - 消息ID列表
 * @returns {Object} 200 - 标记成功
 */
router.put('/batch-read', async (req, res) => {
  try {
    const { conversationId, messageIds } = req.body;
    const userId = req.user.id || req.user.userId;
    
    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({ message: '请提供有效的消息ID列表', success: false });
    }
    
    logger.info(`用户 ${userId} 批量标记 ${messageIds.length} 条消息为已读`);
    
    // 批量更新消息状态
    const query = `
      UPDATE messages 
      SET is_read = true, read_at = $1 
      WHERE id = ANY($2) AND receiver_id = $3 AND conversation_id = $4
    `;
    const params = [new Date(), messageIds, userId, conversationId];
    
    await db.query(query, params);
    
    // 更新会话参与者的最后读取消息（使用最新的消息ID）
    if (messageIds.length > 0) {
      await db.query(
        `UPDATE conversation_participants 
         SET last_read_message_id = $1 
         WHERE conversation_id = $2 AND user_id = $3`,
        [messageIds[messageIds.length - 1], conversationId, userId]
      );
    }
    
    res.json({ message: '批量标记已读成功', success: true });
  } catch (error) {
    logger.error('批量标记消息已读失败:', error);
    res.status(500).json({ message: '服务器内部错误', success: false, error: error.message });
  }
});

module.exports = router;