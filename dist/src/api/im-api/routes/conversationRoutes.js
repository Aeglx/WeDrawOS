/**
 * 会话路由模块
 * 处理即时通讯会话相关请求
 */

const express = require('express');
const router = express.Router();
const logger = require('../../core/utils/logger');
const db = require('../../core/database/database');

/**
 * 获取会话列表
 * @route GET /api/im/conversations
 * @group 会话管理 - 会话相关操作
 * @param {number} req.query.page - 页码，默认1
 * @param {number} req.query.pageSize - 每页数量，默认20
 * @param {string} req.query.type - 会话类型筛选
 * @returns {Object} 200 - 会话列表
 */
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const type = req.query.type; // private, group, customer_service
    const offset = (page - 1) * pageSize;
    const userId = req.user.id || req.user.userId;
    
    logger.info(`用户 ${userId} 获取会话列表`);
    
    // 构建查询条件
    let query = `
      SELECT c.*, cp.role, cp.last_read_message_id 
      FROM conversations c
      JOIN conversation_participants cp ON c.id = cp.conversation_id
      WHERE cp.user_id = $1 AND cp.is_active = true
    `;
    let params = [userId];
    let countQuery = `
      SELECT COUNT(DISTINCT c.id) as count
      FROM conversations c
      JOIN conversation_participants cp ON c.id = cp.conversation_id
      WHERE cp.user_id = $1 AND cp.is_active = true
    `;
    let countParams = [userId];
    
    // 添加类型筛选
    if (type) {
      query += ` AND c.type = $${params.length + 1}`;
      params.push(type);
      countQuery += ` AND c.type = $${countParams.length + 1}`;
      countParams.push(type);
    }
    
    // 添加排序和分页
    query += ` ORDER BY c.last_message_at DESC NULLS LAST LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(pageSize, offset);
    
    // 执行查询
    const result = await db.query(query, params);
    const conversations = result.rows;
    
    // 获取未读数统计
    for (let conv of conversations) {
      const unreadResult = await db.query(
        `SELECT COUNT(*) as unread_count 
         FROM messages 
         WHERE conversation_id = $1 AND receiver_id = $2 AND is_read = false`,
        [conv.id, userId]
      );
      conv.unreadCount = parseInt(unreadResult.rows[0].unread_count);
    }
    
    // 获取总数
    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);
    
    res.json({ 
      message: '获取会话列表成功', 
      success: true,
      data: {
        conversations,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      }
    });
  } catch (error) {
    logger.error('获取会话列表失败:', error);
    res.status(500).json({ message: '服务器内部错误', success: false, error: error.message });
  }
});

/**
 * 创建会话
 * @route POST /api/im/conversations
 * @group 会话管理 - 会话相关操作
 * @param {Object} req.body - 会话数据
 * @param {string} req.body.type - 会话类型(private/group/customer_service)
 * @param {string} req.body.name - 会话名称(群组会话必填)
 * @param {Array} req.body.participants - 参与者ID列表
 * @returns {Object} 200 - 会话创建成功
 */
router.post('/', async (req, res) => {
  try {
    const { type = 'private', name, participants } = req.body;
    const creatorId = req.user.id || req.user.userId;
    
    // 验证参数
    if (type === 'private' && (!participants || participants.length !== 1)) {
      return res.status(400).json({ message: '私聊需要且只能指定一个参与者', success: false });
    }
    
    if (type === 'group' && (!name || !participants || participants.length < 2)) {
      return res.status(400).json({ message: '群聊需要名称且至少有两名参与者', success: false });
    }
    
    logger.info(`用户 ${creatorId} 创建${type}会话`);
    
    // 检查是否已存在私聊会话
    if (type === 'private') {
      const existingConvQuery = `
        SELECT c.id 
        FROM conversations c
        JOIN conversation_participants cp1 ON c.id = cp1.conversation_id
        JOIN conversation_participants cp2 ON c.id = cp2.conversation_id
        WHERE c.type = 'private' 
          AND cp1.user_id = $1 
          AND cp2.user_id = $2
          AND cp1.is_active = true
          AND cp2.is_active = true
      `;
      const existingConv = await db.query(existingConvQuery, [creatorId, participants[0]]);
      
      if (existingConv.rows.length > 0) {
        return res.json({ 
          message: '会话已存在', 
          success: true,
          data: { conversationId: existingConv.rows[0].id }
        });
      }
    }
    
    // 创建新会话
    const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 开启事务
    await db.query('BEGIN');
    
    try {
      // 插入会话
      await db.query(
        `INSERT INTO conversations (id, type, name, status, created_at, updated_at) 
         VALUES ($1, $2, $3, 'active', $4, $5)`,
        [conversationId, type, name, new Date(), new Date()]
      );
      
      // 添加创建者作为参与者
      await db.query(
        `INSERT INTO conversation_participants (conversation_id, user_id, role, join_time, is_active) 
         VALUES ($1, $2, $3, $4, true)`,
        [conversationId, creatorId, type === 'group' ? 'admin' : 'participant', new Date()]
      );
      
      // 添加其他参与者
      for (const participantId of participants) {
        await db.query(
          `INSERT INTO conversation_participants (conversation_id, user_id, role, join_time, is_active) 
           VALUES ($1, $2, 'participant', $3, true)`,
          [conversationId, participantId, new Date()]
        );
      }
      
      // 提交事务
      await db.query('COMMIT');
      
      res.json({ 
        message: '会话创建成功', 
        success: true,
        data: { conversationId }
      });
    } catch (err) {
      // 回滚事务
      await db.query('ROLLBACK');
      throw err;
    }
  } catch (error) {
    logger.error('创建会话失败:', error);
    res.status(500).json({ message: '服务器内部错误', success: false, error: error.message });
  }
});

/**
 * 获取会话详情
 * @route GET /api/im/conversations/:id
 * @group 会话管理 - 会话相关操作
 * @param {string} req.params.id - 会话ID
 * @returns {Object} 200 - 会话详情
 */
router.get('/:id', async (req, res) => {
  try {
    const conversationId = req.params.id;
    const userId = req.user.id || req.user.userId;
    
    logger.info(`用户 ${userId} 获取会话 ${conversationId} 详情`);
    
    // 检查用户是否有权限查看该会话
    const participantCheck = await db.query(
      `SELECT * FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2 AND is_active = true`,
      [conversationId, userId]
    );
    
    if (participantCheck.rows.length === 0) {
      return res.status(403).json({ message: '无权访问该会话', success: false });
    }
    
    // 获取会话信息
    const conversationResult = await db.query(
      `SELECT c.*, 
              (SELECT COUNT(*) FROM messages 
               WHERE conversation_id = c.id AND receiver_id = $2 AND is_read = false) as unread_count
       FROM conversations c WHERE c.id = $1`,
      [conversationId, userId]
    );
    
    if (conversationResult.rows.length === 0) {
      return res.status(404).json({ message: '会话不存在', success: false });
    }
    
    const conversation = conversationResult.rows[0];
    
    // 获取参与者列表
    const participantsResult = await db.query(
      `SELECT user_id, role, join_time FROM conversation_participants 
       WHERE conversation_id = $1 AND is_active = true`,
      [conversationId]
    );
    
    conversation.participants = participantsResult.rows;
    
    res.json({ 
      message: '获取会话详情成功', 
      success: true,
      data: conversation
    });
  } catch (error) {
    logger.error('获取会话详情失败:', error);
    res.status(500).json({ message: '服务器内部错误', success: false, error: error.message });
  }
});

/**
 * 关闭会话
 * @route PUT /api/im/conversations/:id/close
 * @group 会话管理 - 会话相关操作
 * @param {string} req.params.id - 会话ID
 * @returns {Object} 200 - 会话关闭成功
 */
router.put('/:id/close', async (req, res) => {
  try {
    const conversationId = req.params.id;
    const userId = req.user.id || req.user.userId;
    
    logger.info(`用户 ${userId} 关闭会话 ${conversationId}`);
    
    // 检查用户是否是会话参与者
    const participantCheck = await db.query(
      `SELECT role FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2 AND is_active = true`,
      [conversationId, userId]
    );
    
    if (participantCheck.rows.length === 0) {
      return res.status(403).json({ message: '无权操作该会话', success: false });
    }
    
    const role = participantCheck.rows[0].role;
    
    // 开启事务
    await db.query('BEGIN');
    
    try {
      if (role === 'admin' || role === 'customer_service') {
        // 管理员或客服可以关闭整个会话
        await db.query(
          `UPDATE conversations SET status = 'closed', closed_at = $1, updated_at = $1 WHERE id = $2`,
          [new Date(), conversationId]
        );
        
        // 设置所有参与者为非活跃
        await db.query(
          `UPDATE conversation_participants SET is_active = false, leave_time = $1 WHERE conversation_id = $2`,
          [new Date(), conversationId]
        );
      } else {
        // 普通用户只能退出会话
        await db.query(
          `UPDATE conversation_participants SET is_active = false, leave_time = $1 
           WHERE conversation_id = $2 AND user_id = $3`,
          [new Date(), conversationId, userId]
        );
        
        // 检查是否还有活跃参与者
        const activeCheck = await db.query(
          `SELECT COUNT(*) as count FROM conversation_participants 
           WHERE conversation_id = $1 AND is_active = true`,
          [conversationId]
        );
        
        if (parseInt(activeCheck.rows[0].count) === 0) {
          // 如果没有活跃参与者，关闭会话
          await db.query(
            `UPDATE conversations SET status = 'closed', closed_at = $1, updated_at = $1 WHERE id = $2`,
            [new Date(), conversationId]
          );
        }
      }
      
      await db.query('COMMIT');
      
      res.json({ message: '会话关闭成功', success: true });
    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    }
  } catch (error) {
    logger.error('关闭会话失败:', error);
    res.status(500).json({ message: '服务器内部错误', success: false, error: error.message });
  }
});

module.exports = router;