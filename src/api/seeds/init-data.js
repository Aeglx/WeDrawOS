/**
 * 数据库种子脚本
 * 初始化系统所需的基础数据
 */

const bcrypt = require('bcryptjs');

module.exports = {
  /**
   * 执行种子脚本
   */
  async up(queryInterface, Sequelize) {
    const { DATE, UUID, UUIDV4 } = Sequelize;
    const now = new Date();
    
    // 1. 创建默认管理员账户
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    
    await queryInterface.bulkInsert('users', [
      {
        username: 'admin',
        email: 'admin@wedrawos.com',
        password: adminPasswordHash,
        firstName: '系统',
        lastName: '管理员',
        role: 'admin',
        status: 'active',
        availabilityStatus: 'online',
        department: '管理部',
        createdAt: now,
        updatedAt: now
      },
      {
        username: 'supervisor1',
        email: 'supervisor@wedrawos.com',
        password: adminPasswordHash,
        firstName: '客服',
        lastName: '主管',
        role: 'supervisor',
        status: 'active',
        availabilityStatus: 'online',
        department: '客服部',
        createdAt: now,
        updatedAt: now
      },
      {
        username: 'agent1',
        email: 'agent1@wedrawos.com',
        password: adminPasswordHash,
        firstName: '客服',
        lastName: '专员1',
        role: 'agent',
        status: 'active',
        availabilityStatus: 'online',
        department: '客服部',
        createdAt: now,
        updatedAt: now
      },
      {
        username: 'agent2',
        email: 'agent2@wedrawos.com',
        password: adminPasswordHash,
        firstName: '客服',
        lastName: '专员2',
        role: 'agent',
        status: 'active',
        availabilityStatus: 'online',
        department: '客服部',
        createdAt: now,
        updatedAt: now
      },
      {
        username: 'testuser',
        email: 'user@example.com',
        password: adminPasswordHash,
        firstName: '测试',
        lastName: '用户',
        role: 'user',
        status: 'active',
        availabilityStatus: 'online',
        createdAt: now,
        updatedAt: now
      }
    ]);

    // 2. 创建默认标签
    await queryInterface.bulkInsert('tags', [
      {
        name: '紧急',
        color: '#dc3545',
        description: '需要立即处理的问题',
        createdAt: now,
        updatedAt: now
      },
      {
        name: '技术支持',
        color: '#17a2b8',
        description: '技术相关的咨询和问题',
        createdAt: now,
        updatedAt: now
      },
      {
        name: '账户问题',
        color: '#ffc107',
        description: '账户相关的问题',
        createdAt: now,
        updatedAt: now
      },
      {
        name: '退款申请',
        color: '#28a745',
        description: '退款相关的申请',
        createdAt: now,
        updatedAt: now
      },
      {
        name: '产品咨询',
        color: '#6f42c1',
        description: '产品功能和使用咨询',
        createdAt: now,
        updatedAt: now
      },
      {
        name: '投诉',
        color: '#e83e8c',
        description: '客户投诉',
        createdAt: now,
        updatedAt: now
      },
      {
        name: '建议',
        color: '#fd7e14',
        description: '客户建议和反馈',
        createdAt: now,
        updatedAt: now
      }
    ]);

    // 3. 创建默认自动回复规则
    await queryInterface.bulkInsert('auto_reply_rules', [
      {
        name: '欢迎语',
        keywords: ['你好', '您好', 'hi', 'hello', '嗨'],
        response: '您好！欢迎使用WeDrawOS客服系统，我是您的专属客服助手。请问有什么可以帮助您的吗？',
        matchType: 'contains',
        priority: 10,
        enabled: true,
        createdByUserId: 1,
        createdAt: now,
        updatedAt: now
      },
      {
        name: '感谢语',
        keywords: ['谢谢', '感谢', 'thx', 'thanks'],
        response: '不客气！很高兴能够帮到您。如果您还有其他问题，随时欢迎咨询我们。',
        matchType: 'contains',
        priority: 9,
        enabled: true,
        createdByUserId: 1,
        createdAt: now,
        updatedAt: now
      },
      {
        name: '工作时间',
        keywords: ['工作时间', '什么时候上班', '营业时间', '客服时间'],
        response: '我们的客服工作时间是周一至周日 9:00-22:00。如有紧急问题，请发送邮件至 support@wedrawos.com，我们会尽快回复您。',
        matchType: 'contains',
        priority: 8,
        enabled: true,
        createdByUserId: 1,
        createdAt: now,
        updatedAt: now
      },
      {
        name: '退款政策',
        keywords: ['退款', '退货', '退钱', '退款政策'],
        response: '关于退款政策，请您提供订单号，我们的客服专员将为您查询并处理退款事宜。一般情况下，符合条件的退款申请将在3-7个工作日内处理完成。',
        matchType: 'contains',
        priority: 7,
        enabled: true,
        createdByUserId: 1,
        createdAt: now,
        updatedAt: now
      },
      {
        name: '技术支持',
        keywords: ['技术支持', '技术问题', '无法登录', '系统错误', '功能不正常', 'bug'],
        response: '对于技术问题，建议您尝试以下步骤：1. 清除浏览器缓存并刷新页面 2. 检查网络连接 3. 尝试使用其他浏览器。如果问题依然存在，请详细描述您遇到的问题，我们的技术团队将尽快为您解决。',
        matchType: 'contains',
        priority: 6,
        enabled: true,
        createdByUserId: 1,
        createdAt: now,
        updatedAt: now
      },
      {
        name: '等待中',
        keywords: ['有人吗', '还在吗', '等待', '怎么不说话', '没回应'],
        response: '非常抱歉让您久等了！我们的客服人员正在处理您的问题，请稍候片刻。如有紧急需求，请您告知，我们会优先处理。',
        matchType: 'contains',
        priority: 5,
        enabled: true,
        createdByUserId: 1,
        createdAt: now,
        updatedAt: now
      },
      {
        name: '再见',
        keywords: ['再见', '拜拜', '下次见', 'byebye', 'bye'],
        response: '感谢您的咨询！祝您生活愉快，如有任何问题，欢迎随时联系我们。',
        matchType: 'contains',
        priority: 4,
        enabled: true,
        createdByUserId: 1,
        createdAt: now,
        updatedAt: now
      }
    ]);

    // 4. 创建测试会话
    const conversationIds = await queryInterface.bulkInsert('conversations', [
      {
        title: '账户无法登录问题',
        type: 'chat',
        status: 'open',
        priority: 'high',
        createdByUserId: 5,
        assignedToUserId: 3,
        createdAt: now,
        updatedAt: now,
        metadata: { source: 'website', device: 'desktop' }
      },
      {
        title: '产品使用咨询',
        type: 'chat',
        status: 'open',
        priority: 'medium',
        createdByUserId: 5,
        assignedToUserId: 4,
        createdAt: now,
        updatedAt: now,
        metadata: { source: 'mobile', device: 'android' }
      },
      {
        title: '退款申请 #12345',
        type: 'ticket',
        status: 'processing',
        priority: 'high',
        createdByUserId: 5,
        assignedToUserId: 3,
        createdAt: now,
        updatedAt: now,
        metadata: { orderId: 'OD-12345', productId: 'P-67890' }
      }
    ], { returning: ['id'] });

    // 5. 为测试会话添加消息
    const messages = [
      // 第一个会话的消息
      {
        content: '你好，我无法登录我的账户，每次尝试都显示密码错误，但我确定密码是正确的。',
        type: 'text',
        senderId: 5,
        conversationId: conversationIds[0].id,
        isRead: true,
        createdAt: new Date(now.getTime() - 3600000), // 1小时前
        updatedAt: new Date(now.getTime() - 3600000)
      },
      {
        content: '您好，很抱歉听到您遇到了登录问题。请您尝试使用"忘记密码"功能重置密码，看看是否能解决问题。',
        type: 'text',
        senderId: 3,
        conversationId: conversationIds[0].id,
        isRead: true,
        createdAt: new Date(now.getTime() - 3500000), // 约35分钟前
        updatedAt: new Date(now.getTime() - 3500000)
      },
      // 第二个会话的消息
      {
        content: '请问如何使用模板功能？',
        type: 'text',
        senderId: 5,
        conversationId: conversationIds[1].id,
        isRead: false,
        createdAt: new Date(now.getTime() - 7200000), // 2小时前
        updatedAt: new Date(now.getTime() - 7200000)
      },
      // 第三个会话的消息
      {
        content: '我想申请退款，订单号是OD-12345，产品不符合我的预期。',
        type: 'text',
        senderId: 5,
        conversationId: conversationIds[2].id,
        isRead: true,
        createdAt: new Date(now.getTime() - 86400000), // 1天前
        updatedAt: new Date(now.getTime() - 86400000)
      },
      {
        content: '您好，我们已收到您的退款申请，正在为您处理。请提供一下退款原因和退款账号信息，以便我们尽快完成处理。',
        type: 'text',
        senderId: 3,
        conversationId: conversationIds[2].id,
        isRead: false,
        createdAt: new Date(now.getTime() - 82800000), // 约23小时前
        updatedAt: new Date(now.getTime() - 82800000)
      }
    ];
    
    await queryInterface.bulkInsert('messages', messages);

    // 6. 为会话添加参与者
    await queryInterface.bulkInsert('conversation_participants', [
      {
        conversationId: conversationIds[0].id,
        userId: 5,
        role: 'participant',
        joinedAt: new Date(now.getTime() - 3600000)
      },
      {
        conversationId: conversationIds[0].id,
        userId: 3,
        role: 'participant',
        joinedAt: new Date(now.getTime() - 3500000)
      },
      {
        conversationId: conversationIds[1].id,
        userId: 5,
        role: 'participant',
        joinedAt: new Date(now.getTime() - 7200000)
      },
      {
        conversationId: conversationIds[1].id,
        userId: 4,
        role: 'participant',
        joinedAt: new Date(now.getTime() - 7200000)
      },
      {
        conversationId: conversationIds[2].id,
        userId: 5,
        role: 'participant',
        joinedAt: new Date(now.getTime() - 86400000)
      },
      {
        conversationId: conversationIds[2].id,
        userId: 3,
        role: 'participant',
        joinedAt: new Date(now.getTime() - 82800000)
      }
    ]);

    // 7. 为会话添加标签
    await queryInterface.bulkInsert('conversation_tags', [
      { conversationId: conversationIds[0].id, tagId: 2, createdAt: now }, // 技术支持
      { conversationId: conversationIds[0].id, tagId: 3, createdAt: now }, // 账户问题
      { conversationId: conversationIds[1].id, tagId: 5, createdAt: now }, // 产品咨询
      { conversationId: conversationIds[2].id, tagId: 4, createdAt: now }, // 退款申请
      { conversationId: conversationIds[2].id, tagId: 1, createdAt: now }  // 紧急
    ]);

    // 8. 创建测试通知
    await queryInterface.bulkInsert('notifications', [
      {
        userId: 3,
        title: '新的会话分配',
        content: '有一个新的会话 #1 已分配给您处理',
        type: 'task',
        isRead: false,
        data: { conversationId: conversationIds[0].id },
        createdAt: now,
        updatedAt: now
      },
      {
        userId: 4,
        title: '新的会话分配',
        content: '有一个新的会话 #2 已分配给您处理',
        type: 'task',
        isRead: false,
        data: { conversationId: conversationIds[1].id },
        createdAt: now,
        updatedAt: now
      },
      {
        userId: 1,
        title: '系统通知',
        content: '数据库已成功备份，备份时间：' + now.toLocaleString(),
        type: 'system',
        isRead: true,
        isPermanent: true,
        readAt: new Date(now.getTime() - 300000), // 5分钟前
        createdAt: now,
        updatedAt: now
      },
      {
        userId: 5,
        title: '会话已更新',
        content: '您的会话 "账户无法登录问题" 有新的回复',
        type: 'info',
        isRead: false,
        data: { conversationId: conversationIds[0].id },
        createdAt: new Date(now.getTime() - 3500000),
        updatedAt: new Date(now.getTime() - 3500000)
      }
    ]);

    // 9. 创建测试反馈
    await queryInterface.bulkInsert('feedback', [
      {
        userId: 5,
        conversationId: conversationIds[0].id,
        rating: 4,
        content: '客服响应速度很快，问题解决得不错。',
        feedbackType: 'service',
        status: 'resolved',
        priority: 'medium',
        response: '感谢您的反馈！我们会继续努力提供更好的服务。',
        respondedAt: now,
        respondedByUserId: 3,
        createdAt: new Date(now.getTime() - 172800000), // 2天前
        updatedAt: now
      },
      {
        userId: 5,
        conversationId: null,
        rating: 5,
        content: '产品功能很好用，建议增加批量导出功能。',
        feedbackType: 'suggestion',
        status: 'processing',
        priority: 'low',
        createdAt: new Date(now.getTime() - 86400000), // 1天前
        updatedAt: now
      }
    ]);

    // 10. 创建测试工作日志
    await queryInterface.bulkInsert('work_logs', [
      {
        userId: 3,
        conversationId: conversationIds[0].id,
        activityType: 'chat_response',
        duration: 300, // 5分钟
        description: '解答用户登录问题',
        metadata: { responseCount: 1 },
        createdAt: new Date(now.getTime() - 3500000),
        updatedAt: new Date(now.getTime() - 3500000)
      },
      {
        userId: 3,
        conversationId: conversationIds[2].id,
        activityType: 'ticket_assignment',
        duration: 600, // 10分钟
        description: '处理退款申请',
        metadata: { ticketId: conversationIds[2].id },
        createdAt: new Date(now.getTime() - 82800000),
        updatedAt: new Date(now.getTime() - 82800000)
      },
      {
        userId: 4,
        conversationId: conversationIds[1].id,
        activityType: 'chat_response',
        duration: 180, // 3分钟
        description: '回复产品咨询',
        metadata: { responseCount: 0 },
        createdAt: new Date(now.getTime() - 7200000),
        updatedAt: new Date(now.getTime() - 7200000)
      }
    ]);

    // 11. 创建测试工作时间表
    await queryInterface.bulkInsert('work_schedules', [
      {
        userId: 3,
        date: new Date(now.toDateString()),
        shiftType: 'full_day',
        scheduledStartTime: new Date(`${now.toDateString()} 09:00:00`),
        scheduledEndTime: new Date(`${now.toDateString()} 18:00:00`),
        actualStartTime: new Date(`${now.toDateString()} 08:55:00`),
        status: 'scheduled',
        createdAt: now,
        updatedAt: now
      },
      {
        userId: 4,
        date: new Date(now.toDateString()),
        shiftType: 'full_day',
        scheduledStartTime: new Date(`${now.toDateString()} 09:00:00`),
        scheduledEndTime: new Date(`${now.toDateString()} 18:00:00`),
        actualStartTime: new Date(`${now.toDateString()} 09:05:00`),
        status: 'scheduled',
        createdAt: now,
        updatedAt: now
      },
      {
        userId: 3,
        date: new Date(now.getTime() - 86400000), // 昨天
        shiftType: 'full_day',
        scheduledStartTime: new Date((new Date(now.getTime() - 86400000)).toDateString() + ' 09:00:00'),
        scheduledEndTime: new Date((new Date(now.getTime() - 86400000)).toDateString() + ' 18:00:00'),
        actualStartTime: new Date((new Date(now.getTime() - 86400000)).toDateString() + ' 09:00:00'),
        actualEndTime: new Date((new Date(now.getTime() - 86400000)).toDateString() + ' 18:15:00'),
        totalWorkHours: 9.25,
        status: 'completed',
        createdAt: new Date(now.getTime() - 86400000),
        updatedAt: new Date(now.getTime() - 82800000)
      }
    ]);
  },

  /**
   * 回滚种子脚本
   */
  async down(queryInterface) {
    // 按依赖关系逆序删除数据
    await queryInterface.bulkDelete('work_schedules', null, {});
    await queryInterface.bulkDelete('work_logs', null, {});
    await queryInterface.bulkDelete('feedback', null, {});
    await queryInterface.bulkDelete('notifications', null, {});
    await queryInterface.bulkDelete('conversation_tags', null, {});
    await queryInterface.bulkDelete('conversation_participants', null, {});
    await queryInterface.bulkDelete('messages', null, {});
    await queryInterface.bulkDelete('auto_reply_rules', null, {});
    await queryInterface.bulkDelete('tags', null, {});
    await queryInterface.bulkDelete('conversations', null, {});
    await queryInterface.bulkDelete('users', null, {});
  }
};