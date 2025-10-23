# WeDrawOS 客服系统 API

## 系统概述

WeDrawOS 客服系统是一个完整的客户服务管理平台，提供会话管理、消息处理、标签系统、通知功能、客户反馈、工作时间管理等核心功能。本API服务基于Node.js和Express框架开发，使用Sequelize作为ORM工具，支持MySQL数据库。

## 主要功能模块

- **会话管理**：创建、查询、更新和删除客服会话
- **消息系统**：发送、接收、查询和管理各类消息
- **标签系统**：创建标签并应用到会话或消息
- **通知中心**：用户通知的发送和管理
- **客户反馈**：提交、处理和跟踪客户反馈
- **工作时间管理**：客服排班、打卡和休息管理
- **工作日志**：记录和统计客服工作活动

## 核心模块功能说明

**src/api/core/**：系统核心模块，提供基础架构和公共服务

- **cache/**: 多级缓存策略实现，支持本地缓存和Redis分布式缓存
- **config/**: 配置管理，支持多环境配置加载
- **data-access/**: 数据访问层，实现ORM映射和数据库操作抽象
- **di/**: 依赖注入容器，实现组件解耦和管理
- **exception/**: 统一异常处理机制，包括全局异常拦截和响应格式化
- **security/**: 安全模块，实现JWT认证、权限控制和数据加密
- **services/**: 核心业务服务，提供认证、支付、通知等公共服务
- **utils/**: 丰富的工具类库，覆盖各类开发场景

**src/api/buyer-api/**：买家端API模块

- **address/**: 收货地址管理功能
- **cart/**: 购物车功能实现
- **order/**: 订单创建、查询和状态管理
- **product/**: 商品浏览、搜索和详情展示
- **profile/**: 用户个人资料管理
- **review/**: 商品评价和评论系统
- **user/**: 用户认证和账户管理

**src/api/seller-api/**：卖家端API模块，提供店铺管理、商品管理、订单处理等功能

**src/api/admin-api/**：管理员API模块，提供系统管理、用户管理、权限配置等功能

**src/api/im-api/**：即时通讯API模块，实现实时消息推送和在线客服功能

**src/api/message-consumer/**：消息消费者模块，处理异步消息和事件

**src/api/scheduler/**：定时任务模块，处理订单超时、数据同步等定时任务

## 安全措施

- **JWT身份认证**：无状态认证，便于水平扩展
- **密码加密存储**：使用bcrypt算法加密
- **输入验证**：请求参数严格校验，防止注入攻击
- **SQL注入防护**：使用参数化查询，避免直接拼接SQL
- **XSS防护**：输出转义，防止跨站脚本攻击
- **CSRF防护**：请求来源验证，防止跨站请求伪造
- **接口权限控制**：基于角色的访问控制
- **敏感数据脱敏**：日志和响应中的敏感信息脱敏处理

## 技术栈

- **后端框架**：Node.js + Express
- **ORM工具**：Sequelize
- **数据库**：MySQL
- **缓存**：Redis
- **认证**：JWT (JSON Web Tokens)
- **API文档**：Swagger

## 安装与配置

### 前提条件

- Node.js >= 14.0.0
- MySQL >= 5.7
- Redis >= 6.0

### 安装步骤

1. **克隆项目**

```bash
git clone <repository-url>
cd WeDrawOS
```

2. **安装依赖**

```bash
npm install
```

3. **配置环境变量**

创建 `.env` 文件（或根据环境创建 `.env.development`, `.env.production` 等）：

```dotenv
# 服务器配置
PORT=3000
NODE_ENV=development

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=wedraw_customer_service
DB_USER=root
DB_PASSWORD=your_password

# Redis配置
REDIS_URL=redis://localhost:6379

# JWT配置
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_SECRET=your_refresh_token_secret

# CORS配置
CORS_ORIGINS=http://localhost:3000,http://localhost:8080

# 上传目录
UPLOAD_DIR=./uploads
```

4. **初始化数据库**

```bash
# 运行数据库迁移
npm run db:migrate

# 初始化种子数据
npm run db:seed
```

5. **启动服务**

开发环境：
```bash
npm run dev
```

生产环境：
```bash
npm start
```

## API文档

### 微信开发文档风格API文档

本系统提供采用微信开放平台文档风格设计的API接口文档，具有美观的界面和完善的接口说明：

- **文档地址**：`http://localhost:3000/api/wechat-docs`
- **JSON数据**：`http://localhost:3000/api/wechat-docs.json`
- **调试信息**：`http://localhost:3000/api/wechat-docs/debug`

### 功能特性

- ✅ 采用微信开放平台文档风格设计
- ✅ 三栏式布局，清晰展示接口分类
- ✅ 支持接口搜索和过滤
- ✅ 完整的请求参数和响应示例
- ✅ 支持在线接口调试
- ✅ 响应式设计，适配各种设备
- ✅ 完善的错误码说明

### 测试API文档

```bash
# 运行API文档测试脚本
cd src/api
node docs/test-docs.js
```

## 原有API文档

启动服务后，可以通过以下地址访问API文档：

- Swagger API文档：`http://localhost:3000/api/docs`
- API信息接口：`http://localhost:3000/api/info`
- 健康检查接口：`http://localhost:3000/api/health`

## API 接口列表

### 认证相关接口

- `POST /api/v1/auth/login` - 用户登录
- `POST /api/v1/auth/register` - 用户注册
- `POST /api/v1/auth/logout` - 用户登出
- `POST /api/v1/auth/refresh` - 刷新令牌
- `GET /api/v1/auth/profile` - 获取用户资料

### 会话管理接口

- `GET /api/v1/sessions` - 获取会话列表
- `POST /api/v1/sessions` - 创建新会话
- `GET /api/v1/sessions/:id` - 获取会话详情
- `PUT /api/v1/sessions/:id` - 更新会话信息
- `DELETE /api/v1/sessions/:id` - 删除会话

### 消息管理接口

- `GET /api/v1/sessions/:sessionId/messages` - 获取会话消息
- `POST /api/v1/messages` - 发送消息
- `GET /api/v1/messages/:id` - 获取消息详情
- `PUT /api/v1/messages/:id` - 更新消息
- `DELETE /api/v1/messages/:id` - 删除消息

### 标签管理接口

- `GET /api/v1/tags` - 获取标签列表
- `POST /api/v1/tags` - 创建标签
- `PUT /api/v1/tags/:id` - 更新标签
- `DELETE /api/v1/tags/:id` - 删除标签

### 通知管理接口

- `GET /api/v1/notifications` - 获取通知列表
- `PUT /api/v1/notifications/:id/read` - 标记通知已读
- `DELETE /api/v1/notifications/:id` - 删除通知

### 反馈管理接口

- `POST /api/v1/feedbacks` - 提交反馈
- `GET /api/v1/feedbacks` - 获取反馈列表
- `PUT /api/v1/feedbacks/:id/status` - 更新反馈状态

### 工作时间管理接口

- `GET /api/v1/work-schedules` - 获取排班列表
- `POST /api/v1/work-schedules` - 创建排班
- `POST /api/v1/clock-in` - 签到打卡
- `POST /api/v1/clock-out` - 签退打卡

## 数据库结构

系统包含以下主要数据表：

- `users` - 用户信息表
- `sessions` - 会话表
- `messages` - 消息表
- `tags` - 标签表
- `tag_assignments` - 标签分配表
- `notifications` - 通知表
- `feedbacks` - 反馈表
- `auto_reply_rules` - 自动回复规则表
- `work_schedules` - 工作时间表
- `work_logs` - 工作日志表

详细的数据库结构请参考 `migrations/init-database.js` 文件。

## 权限控制

系统使用基于角色的访问控制（RBAC），主要角色包括：

- `admin` - 管理员，具有所有权限
- `agent` - 客服人员，具有客户服务相关权限
- `user` - 普通用户，具有基本操作权限

## 错误处理

API响应采用统一格式：

```json
{
  "success": true,
  "data": {...}, // 响应数据
  "message": "操作成功", // 响应消息
  "error": null // 错误信息（仅在失败时返回）
}
```

常见错误码：
- `400` - 请求参数错误
- `401` - 未授权访问
- `403` - 权限不足
- `404` - 资源不存在
- `500` - 服务器内部错误

## 安全措施

- JWT令牌认证
- 请求速率限制
- 输入验证和净化
- SQL注入防护（使用Sequelize ORM）
- HTTPS支持
- 敏感数据加密

## 开发指南

### 添加新API端点

1. 在 `controllers/` 目录下创建控制器
2. 在 `routes/` 目录中注册路由
3. 在 `middleware/validators.js` 中添加请求验证规则

### 运行测试

```bash
npm test
```

### 代码规范

项目使用ESLint进行代码规范检查：

```bash
npm run lint
```

## 部署指南

### 生产环境部署

1. 配置生产环境变量（`.env.production`）
2. 安装生产依赖：`npm install --production`
3. 构建项目：`npm run build`
4. 启动服务：`npm start`

### Docker部署（推荐）

可以使用Docker Compose进行容器化部署，包含API服务、MySQL数据库和Redis缓存。

## 监控与日志

系统内置了详细的日志记录功能，包括：

- 请求日志
- 错误日志
- 性能日志
- 安全事件日志

日志文件存储在 `logs/` 目录下。

## 常见问题

### Q: 如何重置管理员密码？
A: 可以通过数据库直接更新 `users` 表中管理员账户的密码字段（需使用bcrypt加密）。

### Q: 如何扩展系统功能？
A: 遵循现有的模块化结构，在相应目录中添加新的控制器、模型和路由。

### Q: 如何配置邮件通知？
A: 在环境变量中配置SMTP服务器信息，并扩展通知服务。

## 版本历史

- v1.0.0 - 初始版本，包含核心客服功能

## 贡献指南

欢迎提交Issue和Pull Request来改进系统。

## 许可证

MIT License

## 联系信息

For support, contact: wedraw.support@example.com