# WeDrawOS 客服系统 - 核心服务模块

本文档详细介绍了WeDrawOS客服系统中的核心服务模块，包括邮件服务、短信服务、Redis缓存服务和WebSocket服务。

## 1. Redis缓存服务

### 功能介绍
- 提供完整的Redis客户端封装
- 支持连接池管理和自动重连
- 实现发布/订阅功能
- 内置降级方案（本地内存缓存）
- 支持常用Redis操作（get、set、del等）

### 配置说明
在`config.js`中添加了Redis配置项：
```javascript
redis: {
  host: getEnv('REDIS_HOST', 'localhost'),
  port: getEnvNumber('REDIS_PORT', 6379),
  password: getEnv('REDIS_PASSWORD', ''),
  db: getEnvNumber('REDIS_DB', 0),
  maxRetriesPerRequest: getEnvNumber('REDIS_MAX_RETRIES', 5)
}
```

### 使用方法
```javascript
// 导入Redis客户端
const { redisClient } = require('./core/cache/redisClient');

// 设置缓存
await redisClient.set('key', 'value', 3600); // 3600秒过期

// 获取缓存
const value = await redisClient.get('key');

// 发布消息
await redisClient.publish('notifications', { type: 'new_message', content: 'Hello' });

// 订阅频道
await redisClient.subscribe('notifications', (channel, message) => {
  console.log('收到消息:', message);
});
```

## 2. 邮件服务

### 功能介绍
- 支持SMTP邮件发送
- 提供多种邮件模板（验证码、重置密码、账户激活等）
- 支持批量发送邮件
- 错误处理和日志记录

### 配置说明
邮件服务配置在`config.js`中：
```javascript
mail: {
  host: getEnv('MAIL_HOST', 'smtp.example.com'),
  port: getEnvNumber('MAIL_PORT', 587),
  secure: getEnvBoolean('MAIL_SECURE', false),
  auth: {
    user: getEnv('MAIL_USER', 'your-email@example.com'),
    pass: getEnv('MAIL_PASS', 'your-email-password')
  },
  from: getEnv('MAIL_FROM', 'WeDrawOS 客服系统 <noreply@example.com>')
}
```

### 使用方法
```javascript
const emailService = require('./core/services/emailService');

// 发送普通邮件
await emailService.sendMail({
  to: 'user@example.com',
  subject: '测试邮件',
  text: '这是一封测试邮件',
  html: '<h1>这是一封测试邮件</h1>'
});

// 发送验证码邮件
await emailService.sendVerificationCode({
  email: 'user@example.com',
  code: '123456',
  expireMinutes: 5
});

// 发送密码重置邮件
await emailService.sendPasswordResetEmail({
  email: 'user@example.com',
  resetToken: 'reset-token',
  expireHours: 24
});
```

## 3. 短信服务

### 功能介绍
- 支持多提供商（阿里云、腾讯云、Twilio）
- 提供验证码短信、通知短信发送
- 支持批量发送
- 内置模拟模式
- 短信发送历史记录

### 使用方法
```javascript
const smsService = require('./core/services/smsService');

// 发送验证码短信
await smsService.sendVerificationCode('13800138000', '123456', 5);

// 发送通知短信
await smsService.sendNotification('13800138000', '订单通知', '您的订单已发货');

// 发送自定义短信
await smsService.send({
  phone: '13800138000',
  content: '自定义短信内容',
  type: 'custom',
  provider: 'aliyun'
});

// 批量发送
const results = await smsService.sendBatch([
  { phone: '13800138000', content: '短信1' },
  { phone: '13900139000', content: '短信2' }
]);
```

## 4. WebSocket服务

### 功能介绍
- 支持用户认证
- 连接管理和心跳检测
- 消息广播和定向发送
- 房间管理
- 事件系统集成

### 配置说明
WebSocket配置在`config.js`中：
```javascript
websocket: {
  pingInterval: getEnvNumber('WS_PING_INTERVAL', 30000),
  maxConnections: getEnvNumber('WS_MAX_CONNECTIONS', 1000),
  maxMessageSize: getEnvNumber('WS_MAX_MESSAGE_SIZE', 1024 * 1024) // 1MB
}
```

### 使用方法
```javascript
const WebSocketService = require('./core/services/websocketService');

// 在HTTP服务器启动时初始化
const httpServer = http.createServer(app);
const wsService = WebSocketService.start(httpServer);

// 发送消息给指定用户
wsService.send(userId, {
  type: 'notification',
  data: { message: '新消息通知' }
});

// 广播消息
wsService.broadcast({
  type: 'system_announcement',
  data: { content: '系统维护通知' }
});

// 监听事件
wsService.on('user_connected', (data) => {
  console.log(`用户 ${data.userId} 已连接`);
});

wsService.on('message', (data) => {
  console.log('收到消息:', data);
});
```

## 5. 服务管理器

为了方便统一管理所有核心服务，我们添加了`serviceManager.js`，提供以下功能：

- 统一初始化所有服务
- 服务健康状态检查
- 优雅关闭服务
- 服务状态监控

### 使用方法
```javascript
const { 
  serviceManager, 
  initializeServices, 
  checkServicesHealth 
} = require('./core/services/serviceManager');

// 初始化所有服务
await initializeServices();

// 检查服务健康状态
const healthStatus = await checkServicesHealth();
console.log('服务健康状态:', healthStatus);

// 获取所有服务状态
const status = serviceManager.getServicesStatus();
console.log('服务状态:', status);

// 在应用关闭时优雅关闭服务
process.on('SIGTERM', async () => {
  await serviceManager.shutdown();
  process.exit(0);
});
```

## 6. 错误处理和降级策略

所有服务都实现了完善的错误处理和降级策略：

- Redis服务：当Redis不可用时，自动切换到本地内存缓存
- 邮件服务：发送失败时记录日志并重试
- 短信服务：提供模拟模式，支持多提供商切换
- WebSocket服务：连接断开自动清理，错误消息通知

## 7. 性能优化

- Redis连接池管理，避免频繁创建连接
- 批量操作支持，减少网络请求次数
- 内存缓存作为Redis降级方案
- 事件驱动架构，提高并发处理能力

## 8. 安全考虑

- 敏感信息通过环境变量配置
- 连接超时和重试机制
- 输入参数验证
- 错误信息脱敏
- 防止连接泄露和资源耗尽

---

通过以上核心服务模块，WeDrawOS客服系统能够提供可靠的消息通知、实时通信和数据缓存功能，为用户提供良好的使用体验。