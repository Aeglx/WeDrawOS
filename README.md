# WeDraw - 模块化设计方案

## 1. 系统模块总览

### 核心框架模块

- 数据访问层
- 通用工具类
- 安全认证框架
- 异常处理机制
- 数据校验组件
- 缓存管理

### 公共API模块

- 接口文档
- 通用业务组件
- 消息队列定义
- 缓存配置
- 公共服务接口

### 买家端API

- 用户注册登录
- 商品浏览搜索
- 购物车管理
- 订单创建支付
- 个人中心
- 评价管理

### 卖家端API

- 店铺管理
- 商品发布管理
- 订单处理
- 营销活动设置
- 销售数据分析
- 财务结算

### 管理端

- 系统设置
- 用户管理
- 权限控制
- 数据统计
- 运营管理
- 内容管理
- 广告管理
- 公众号基础管理（账号信息、用户管理、素材管理）
- 公众号消息管理（模板消息、订阅通知、对话管理、自定义菜单管理）
- 企业微信外部群群发（支持向外部群通过群主发送消息）
- 企业微信素材管理（图片、文本、链接等素材管理）
- 企业微信发送统计（消息发送效果追踪分析）

### 管理员API

- 后台管理接口
- 权限管理
- 数据监控
- 系统日志
- 公众号和企业微信相关接口

### 消息消费者模块

- 订单消息
- 商品消息
- 会员消息
- 通知消息
- 售后服务消息

### 即时通讯API

- 消息推送
- 在线客服
- 通知系统
- WebSocket通信

### 定时任务模块

- 订单自动关闭
- 数据同步
- 统计报表生成
- 缓存刷新
- 定时任务调度

### 端口配置

- **后端API服务**：3000
- **买家端应用**：4000
- **卖家端应用**：5000
- **管理端应用**：6000
- **数据库服务**：3306
- **Redis服务**：6379

## 2. 功能权限说明

- **管理员端**：完全控制所有功能，包括完整的公众号和企业微信管理功能
- **卖家端**：仅可使用管理员授权的部分功能，无法直接使用公众号和企业微信内部功能
- **买家端**：仅可使用面向用户的购物和个人中心功能

## 3. 快速开始

### 环境要求

- Node.js >= 14.0.0
- MySQL >= 5.7
- Redis >= 6.0

### 安装步骤

1. 安装依赖
   
   ```bash
   npm install
   ```

2. 配置环境变量
   
   ```bash
   # 根据.env.example创建.env文件并配置相关参数
   # 数据库配置中user固定为root，password固定为123456，dbname固定为wedraw
   ```

3. 启动服务
   
   ```bash
   # 开发模式
   npm run dev
   ```

# 生产模式

npm start

```
## 4. API文档

启动服务后，可以通过以下地址访问Swagger API文档：
```

http://localhost:3000/api/docs

```
## 5. 项目结构
```

├── src/
│   ├── api/
│   │   ├── app.js              # 应用主入口
│   │   ├── core/               # 核心模块
│   │   │   ├── di/             # 依赖注入容器
│   │   │   ├── data-access/    # 数据访问层
│   │   │   ├── cache/          # 缓存管理
│   │   │   ├── security/       # 安全相关
│   │   │   ├── utils/          # 工具类
│   │   │   └── exception/      # 异常处理
│   │   ├── common-api/         # 通用API模块
│   │   ├── buyer-api/          # 买家API模块
│   │   ├── seller-api/         # 卖家API模块
│   │   ├── admin-api/          # 管理员API模块
│   │   ├── im-api/             # 即时通讯API模块
│   │   ├── message-consumer/   # 消息消费者模块
│   │   └── scheduler/          # 定时任务模块
├── .env                        # 环境变量配置
├── .env.example                # 环境变量示例
├── package.json                # 项目配置
└── build.js                    # 构建脚本

```
## 6. 安全措施

- JWT身份认证
- 密码加密存储(使用bcrypt)
- 输入验证
- SQL注入防护
- XSS防护
- CSRF防护
- 接口权限控制

## 7. 开发规范

- 遵循ESLint代码规范
- 采用模块化设计
- 优先使用依赖注入模式
- 统一错误处理和响应格式
- 完善的日志记录
- 编写单元测试
## 3. 授权机制

管理员可以通过权限控制系统，为卖家分配特定的功能权限。卖家端可以访问这些被授权的功能，但不能直接操作公众号和企业微信的核心功能，只能通过平台提供的接口或模板进行有限的操作。

## 2. 后端模块化设计

### 后端模块目录结构

### API文档集成

项目集成了Swagger UI，提供交互式API文档：

- **开发环境**：http://localhost:3000/api-docs
- **包含功能**：
  - 完整的接口说明
  - 参数示例
  - 在线测试功能
  - 接口权限说明

API文档自动从代码注释中生成，保持与实际代码的同步更新。

### 注意事项

- **端口规范**：所有服务必须严格按照端口规范使用，后端API服务使用3000端口，买家端应用使用4000端口，卖家端应用使用5000端口，管理端应用使用6000端口
- **功能权限**：公众号和企业微信功能已整合到管理端，卖家端无法直接使用这些功能，只能通过管理员授权使用部分功能
- **路由变更**：公众号和企业微信相关API路由已调整为管理端API的子路由，如`/api/admin/wechat/official`和`/api/admin/wework`
```

src/api/
├── core/                  # 核心框架模块
│   ├── data-access/      # 数据访问层
│   │   ├── repositories/ # 数据仓库
│   │   ├── transaction/  # 事务管理
│   │   └── baseModel/    # 基础模型
│   ├── utils/            # 通用工具类
│   │   ├── common/       # 常用函数
│   │   ├── date/         # 日期处理
│   │   ├── encryption/   # 加密工具
│   │   └── validator/    # 数据校验组件
│   ├── security/         # 安全认证框架
│   │   ├── auth/         # 认证实现
│   │   ├── jwt/          # JWT管理
│   │   ├── permission/   # 权限控制
│   │   └── securityUtils/# 安全工具
│   ├── exception/        # 异常处理机制
│   │   ├── handlers/     # 异常处理器
│   │   ├── custom/       # 自定义异常
│   │   └── response/     # 统一响应格式
│   ├── validation/       # 数据校验组件
│   │   ├── schemas/      # 校验模式
│   │   └── rules/        # 校验规则
│   ├── cache/            # 缓存管理
│   │   ├── redis/        # Redis实现
│   │   ├── local/        # 本地缓存
│   │   └── cacheManager/ # 缓存管理器
│   └── config/           # 配置管理
├── common-api/            # 公共API模块
│   ├── swagger/          # 接口文档
│   │   ├── definitions/  # 数据模型定义
│   │   └── routes/       # 路由文档
│   ├── components/       # 通用业务组件
│   ├── message-queue/    # 消息队列定义
│   │   ├── topics/       # 消息主题
│   │   └── producers/    # 消息生产者
│   ├── cache-config/     # 缓存配置
│   └── services/         # 公共服务接口
├── buyer-api/             # 买家端API
│   ├── user/             # 用户注册登录
│   ├── product/          # 商品浏览搜索
│   ├── cart/             # 购物车管理
│   ├── order/            # 订单创建支付
│   ├── profile/          # 个人中心
│   └── review/           # 评价管理
├── seller-api/            # 卖家端API
│   ├── shop/             # 店铺管理
│   ├── product/          # 商品发布管理
│   ├── order/            # 订单处理
│   ├── marketing/        # 营销活动设置
│   ├── analytics/        # 销售数据分析
│   └── finance/          # 财务结算
├── admin/                 # 管理端API
│   ├── system/           # 系统设置
│   ├── user/             # 用户管理
│   ├── permission/       # 权限控制
│   ├── statistics/       # 数据统计
│   ├── operation/        # 运营管理
│   ├── content/          # 内容管理
│   ├── advertising/      # 广告管理
│   ├── wechat-official/  # 公众号管理
│   │   ├── controllers/  # 控制器层，处理HTTP请求
│   │   ├── services/     # 服务层，实现业务逻辑
│   │   ├── models/       # 数据模型层，定义数据结构
│   │   ├── repositories/ # 数据访问层，数据库操作
│   │   ├── routes/       # 路由定义
│   │   ├── schemas/      # 数据校验模式
│   │   ├── middleware/   # 模块专用中间件
│   │   └── index.js      # 模块入口和注册
│   └── wework/           # 企业微信管理
│       ├── controllers/  # 控制器层，处理HTTP请求
│       ├── services/     # 服务层，实现业务逻辑
│       ├── models/       # 数据模型层，定义数据结构
│       ├── repositories/ # 数据访问层，数据库操作
│       ├── routes/       # 路由定义
│       ├── schemas/      # 数据校验模式
│       ├── middleware/   # 模块专用中间件
│       └── index.js      # 模块入口和注册
├── admin-api/             # 管理员API
│   ├── backend/          # 后台管理接口
│   ├── permission/       # 权限管理
│   ├── monitoring/       # 数据监控
│   └── logs/             # 系统日志
├── message-consumer/      # 消息消费者模块
│   ├── order/            # 订单消息
│   ├── product/          # 商品消息
│   ├── member/           # 会员消息
│   ├── notification/     # 通知消息
│   └── after-sales/      # 售后服务消息
├── im-api/                # 即时通讯API
│   ├── push/             # 消息推送
│   ├── customer-service/ # 在线客服
│   ├── notification/     # 通知系统
│   └── websocket/        # WebSocket通信
├── scheduler/             # 定时任务模块
│   ├── order/            # 订单自动关闭
│   ├── sync/             # 数据同步
│   ├── report/           # 统计报表生成
│   ├── cache/            # 缓存刷新
│   └── job/              # 定时任务调度

└── app.js                 # 应用入口

```
### 各模块实现规范

每个业务模块内部统一采用以下结构：
```

module-name/
├── controllers/  # 控制器层，处理HTTP请求
├── services/     # 服务层，实现业务逻辑
├── models/       # 数据模型层，定义数据结构
├── repositories/ # 数据访问层，数据库操作
├── routes/       # 路由定义
├── schemas/      # 数据校验模式
├── middleware/   # 模块专用中间件
└── index.js      # 模块入口和注册

### 模块化实现策略

1. **模块独立性**：
   
   - 每个业务模块独立管理自己的控制器、服务、模型和路由
   - 模块内部遵循分层架构设计（控制器层、服务层、数据访问层）
   - 模块间通过公共接口通信，避免直接依赖和硬编码耦合
   - 每个模块有独立的测试套件

2. **统一模块注册机制**：
   
   ```javascript
   // src/api/app.js
   const express = require('express');
   const app = express();
   
   // 核心模块初始化
   const coreModule = require('./core');
   coreModule.initialize(app);
   
   // 注册各业务模块
   const modules = [
     require('./common-api'),
     require('./buyer-api'),
     require('./seller-api'),
     require('./admin'),
     require('./admin-api'),
     require('./im-api')
   ];
   
   // 统一注册所有模块
   modules.forEach(module => {
     module.register(app);
   });
   
   // 注册Swagger UI
   const swaggerModule = require('./common-api/swagger');
   swaggerModule.setupSwagger(app);
   
   // Swagger UI路径配置
   // 开发环境: http://localhost:3000/api-docs
   // 注意：所有服务端口必须严格按照规范使用
   // 后端API服务端口：3000
   // 买家端应用端口：4000
   // 卖家端应用端口：5000
   // 管理端应用端口：6000
   
   // 启动消息消费者
   const messageConsumerModule = require('./message-consumer');
   messageConsumerModule.start();
   
   // 初始化定时任务
   const schedulerModule = require('./scheduler');
   schedulerModule.initialize();
   ```

3. **标准模块入口文件**：
   
   ```javascript
   // src/api/buyer-api/index.js (买家模块入口)
   const userRoutes = require('./user/routes');
   const productRoutes = require('./product/routes');
   const cartRoutes = require('./cart/routes');
   const orderRoutes = require('./order/routes');
   const profileRoutes = require('./profile/routes');
   const reviewRoutes = require('./review/routes');
   
   module.exports = {
     register: (app) => {
       // 注册买家端API路由
       app.use('/api/buyer/user', userRoutes);
       app.use('/api/buyer/product', productRoutes);
       app.use('/api/buyer/cart', cartRoutes);
       app.use('/api/buyer/order', orderRoutes);
       app.use('/api/buyer/profile', profileRoutes);
       app.use('/api/buyer/review', reviewRoutes);
     },
   
     // 提供给其他模块使用的公共方法
     getUserInfo: require('./user/services/userService').getUserInfo
   };
   
   // src/api/admin/index.js (管理端模块入口 - 包含公众号和企业微信功能)
   const systemRoutes = require('./system/routes');
   const userRoutes = require('./user/routes');
   const permissionRoutes = require('./permission/routes');
   const wechatOfficialRoutes = require('./wechat-official/routes');
   const weworkRoutes = require('./wework/routes');
   
   module.exports = {
     register: (app) => {
       // 注册管理端API路由
       app.use('/api/admin/system', systemRoutes);
       app.use('/api/admin/user', userRoutes);
       app.use('/api/admin/permission', permissionRoutes);
   
       // 公众号管理路由
       app.use('/api/admin/wechat/official', wechatOfficialRoutes);
   
       // 企业微信管理路由
       app.use('/api/admin/wework', weworkRoutes);
     },
   
     // 提供给其他模块使用的公共方法
     getSystemConfig: require('./system/services/systemService').getConfig,
     sendTemplateMessage: require('./wechat-official/message/services/messageService').sendTemplateMessage,
     sendGroupMessage: require('./wework/group-message/services/groupMessageService').sendGroupMessage
   };
   ```

4. **服务层实现示例**：
   
   ```javascript
   // src/api/buyer-api/order/services/orderService.js
   const orderRepository = require('../repositories/orderRepository');
   const paymentService = require('../../../../core/services/paymentService');
   const notificationService = require('../../../../common-api/services/notificationService');
   const { OrderNotFoundException } = require('../../../../core/exception/custom/orderExceptions');
   
   class OrderService {
     async createOrder(userId, orderData) {
       // 业务逻辑实现
       const order = await orderRepository.create({
         userId,
         ...orderData,
         status: 'PENDING_PAYMENT'
       });
   
       // 触发支付处理
       const paymentUrl = await paymentService.createPayment(order);
   
       // 发送通知
       await notificationService.sendOrderCreatedNotification(userId, order.id);
   
       return { order, paymentUrl };
     }
   
     async getOrderById(orderId) {
       const order = await orderRepository.findById(orderId);
       if (!order) {
         throw new OrderNotFoundException(`Order ${orderId} not found`);
       }
       return order;
     }
   }
   
   module.exports = new OrderService();
   
   // src/api/wechat-official/message/services/messageService.js
   const wechatApiClient = require('../../../../core/services/wechatApiClient');
   const messageRepository = require('../repositories/messageRepository');
   
   class MessageService {
     async sendTemplateMessage(templateId, touser, data, url) {
       try {
         // 调用微信API发送模板消息
         const result = await wechatApiClient.sendTemplateMessage({
           touser,
           template_id: templateId,
           data,
           url
         });
   
         // 记录发送日志
         await messageRepository.createTemplateMessageLog({
           touser,
           template_id: templateId,
           send_result: result,
           status: result.errcode === 0 ? 'SUCCESS' : 'FAILED'
         });
   
         return result;
       } catch (error) {
         console.error('发送模板消息失败:', error);
         throw new Error('发送模板消息失败');
       }
     }
   
     async getMessageList(params) {
       return await messageRepository.findMessages(params);
     }
   
     async createCustomMenu(menuData) {
       const result = await wechatApiClient.createMenu(menuData);
       if (result.errcode === 0) {
         await messageRepository.saveMenuConfig(menuData);
       }
       return result;
     }
   }
   
   module.exports = new MessageService();
   
   // src/api/wework/group-message/services/groupMessageService.js
   const weworkApiClient = require('../../../../core/services/weworkApiClient');
   const groupMessageRepository = require('../repositories/groupMessageRepository');
   
   class GroupMessageService {
     async sendGroupMessage(groupIds, content, sender) {
       try {
         const messageId = await weworkApiClient.sendGroupMessage({
           chatids: groupIds,
           msgtype: 'text',
           text: { content },
           sender
         });
   
         // 记录群发任务
         const task = await groupMessageRepository.createTask({
           message_id: messageId,
           group_ids: groupIds,
           content,
           sender,
           status: 'SENDING',
           created_at: new Date()
         });
   
         // 异步跟踪发送状态
         this.trackSendingStatus(task.id, messageId);
   
         return { messageId, taskId: task.id };
       } catch (error) {
         console.error('发送群消息失败:', error);
         throw new Error('发送群消息失败');
       }
     }
   
     async trackSendingStatus(taskId, messageId) {
       // 实现消息状态跟踪逻辑
     }
   
     async getTaskList(params) {
       return await groupMessageRepository.findTasks(params);
     }
   }
   
   module.exports = new GroupMessageService();
   ```

5. **依赖注入容器**：
   
   ```javascript
   // src/api/core/di/container.js
   const container = {};
   
   // 注册服务
   function register(name, factory) {
     container[name] = factory;
   }
   
   // 获取服务实例
   function get(name) {
     if (!container[name]) {
       throw new Error(`Service ${name} not registered`);
     }
     return container[name]();
   }
   
   module.exports = { register, get };
   
   // src/api/common-api/swagger/index.js
   const swaggerJsdoc = require('swagger-jsdoc');
   const swaggerUi = require('swagger-ui-express');
   
   const options = {
     definition: {
       openapi: '3.0.0',
       info: {
         title: 'WeDraw API 文档',
         version: '1.0.0',
         description: 'WeDraw 项目的 RESTful API 文档'
       },
       servers: [
         {
           url: 'http://localhost:3000',
           description: '开发环境'
         }
       ]
     },
     apis: [
       './src/api/**/controllers/*.js',
       './src/api/**/routes/*.js'
     ] // 匹配所有控制器和路由文件
   };
   
   const swaggerSpec = swaggerJsdoc(options);
   
   module.exports = {
     setupSwagger: (app) => {
       // 设置Swagger UI路径
       app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
   
       // 提供OpenAPI规范JSON
       app.get('/api-docs/json', (req, res) => {
         res.setHeader('Content-Type', 'application/json');
         res.send(swaggerSpec);
       });
   
       console.log('Swagger UI 已启动: http://localhost:3000/api-docs');
     }
   };
   
   // Swagger 注释示例
   /**
    * @swagger
    * /api/wechat/official/message/template: 
    *   post:
    *     summary: 发送公众号模板消息
    *     tags: [公众号管理]
    *     requestBody:
    *       required: true
    *       content:
    *         application/json:
    *           schema:
    *             type: object
    *             properties:
    *               touser: 
    *                 type: string
    *                 description: 接收者openid
    *               template_id: 
    *                 type: string
    *                 description: 模板ID
    *               data: 
    *                 type: object
    *                 description: 模板数据
    *     responses:
    *       200:
    *         description: 发送成功
    *       500:
    *         description: 发送失败
    */
   
   // 使用示例
   // src/api/app.js
   const di = require('./core/di/container');
   
   // 注册核心服务
   di.register('database', () => require('./core/data-access/database'));
   di.register('cache', () => require('./core/cache/cacheManager'));
   di.register('logger', () => require('./core/utils/logger'));
   ```

6. **统一响应格式**：
   
   ```javascript
   // src/api/core/exception/response/responseFormatter.js
   function success(data = null, message = 'Success') {
     return {
       code: 200,
       message,
       data,
       timestamp: Date.now()
     };
   }
   
   function error(code = 500, message = 'Internal Server Error') {
     return {
       code,
       message,
       data: null,
       timestamp: Date.now()
     };
   }
   
   module.exports = { success, error };
   ```

7. **异常处理中间件**：
   
   ```javascript
   // src/api/core/exception/handlers/errorHandler.js
   const { error: formatError } = require('../response/responseFormatter');
   
   function errorHandler(err, req, res, next) {
     console.error(err.stack);
   
     // 处理自定义异常
     if (err.statusCode) {
       return res.status(err.statusCode).json(formatError(err.statusCode, err.message));
     }
   
     // 处理验证错误
     if (err.name === 'ValidationError') {
       return res.status(400).json(formatError(400, err.message));
     }
   
     // 默认500错误
     res.status(500).json(formatError(500, 'Internal Server Error'));
   }
   
   module.exports = errorHandler;
   ```

## 3. 前端模块化设计

### 前端应用架构

我们的前端架构将采用多应用模式，分别对应不同的用户角色：

1. **买家端** - 基于Uni-app实现，支持微信小程序、H5、App三端互通（端口：4000）
2. **卖家端** - 面向商家的管理平台（端口：5000）
3. **管理端** - 面向平台管理员的后台系统（端口：6000），包含公众号和企业微信管理功能

### 依赖统一管理策略

为解决管理后台与Uni-app多端应用的依赖冲突问题，项目采用以下依赖管理方案：

1. **公共依赖统一管理**
   
   - 所有应用共享的依赖（如axios、vue、pinia等）集中在根目录package.json中管理
   - 确保所有应用使用一致的核心依赖版本
   - 便于统一升级和维护

2. **端专属依赖隔离**
   
   - 各应用特有的依赖在各自子目录的package.json中管理
   - 买家端uni-app相关依赖（如@dcloudio/uni-app、@dcloudio/uni-ui等）
   - 管理端和卖家端特有的UI组件库和工具类

3. **构建配置适配**
   
   - 使用lerna或yarn workspace进行多包管理
   - 为不同平台（Web、小程序、App）配置差异化的构建选项
   - 确保各平台构建输出符合其规范要求

4. **版本强制兼容**
   
   - 制定严格的依赖版本锁定策略
   - 避免版本冲突导致的运行时错误
   - 定期更新依赖并进行兼容性测试

### 架构选择建议

根据项目需求，我们推荐以下架构选择原则：

1. **买家端**：必须使用Uni-app框架，以实现微信小程序、H5和App三端无缝互通
   
   - 优势：一套代码，多端运行，开发效率高
   - 适用场景：需要跨平台覆盖多端用户的场景

2. **管理端和卖家端**：建议使用Vue 3 + Element Plus + Pinia的技术栈
   
   - 优势：成熟稳定，组件丰富，适合构建复杂的后台管理系统
   - 适用场景：功能复杂、操作频繁的管理类应用

3. **后端**：保持现有的Express + MySQL + Redis架构
   
   - 优势：轻量高效，社区活跃，易于集成各种服务
   - 适用场景：需要快速开发和部署的Web应用

项目将严格遵循"公共依赖统一管理 + 端专属依赖隔离 + 构建配置适配 + 版本强制兼容"的方案，确保各应用能够协同工作，同时保持各自的技术特性和平台适配能力。

### 端口配置规范

所有应用和服务必须严格按照以下端口规范使用：

- **后端API服务**：3000
- **买家端应用**：4000
- **卖家端应用**：5000
- **管理端应用**：6000
- **数据库服务**：3306
- **Redis服务**：6379

### 功能权限架构

- **管理员端**：完全控制所有功能，包括完整的公众号和企业微信管理功能
- **卖家端**：仅可使用管理员授权的部分功能，无法直接使用公众号和企业微信内部功能
- **买家端**：仅可使用面向用户的购物和个人中心功能

### 买家端模块化结构 (Uni-app实现)

买家端应用基于Uni-app框架，支持微信小程序、H5和App三端互通：

```
src/buyer/
├── components/           # 公共组件（支持多端）
├── pages/                # 页面组件
│   ├── index/            # 首页
│   ├── user/             # 用户相关页面
│   ├── product/          # 商品相关页面
│   ├── cart/             # 购物车页面
│   ├── order/            # 订单相关页面
│   ├── profile/          # 个人中心页面
│   └── review/           # 评价页面
├── static/               # 静态资源（不被编译的文件）
├── unpackage/            # 打包输出目录
├── utils/                # 工具函数（多端兼容）
│   ├── request.js        # 网络请求封装
│   ├── storage.js        # 存储工具（兼容各端）
│   └── platform.js       # 平台判断工具
├── services/             # API服务层
│   ├── auth.js           # 认证服务
│   ├── product.js        # 商品服务
│   ├── cart.js           # 购物车服务
│   └── order.js          # 订单服务
├── store/                # 状态管理（使用Pinia多端兼容版）
│   ├── index.js          # 状态管理入口
│   └── modules/          # 业务模块状态
├── common/               # 公共资源
│   ├── styles/           # 公共样式
│   └── components/       # 通用组件
├── app.vue               # 应用根组件
├── main.js               # 应用入口文件
├── manifest.json         # 应用配置文件（Uni-app必须）
├── pages.json            # 页面路由配置（Uni-app必须）
└── vue.config.js         # Vue配置文件
```

### 管理端模块化结构

管理端应用包含所有核心管理功能，包括公众号和企业微信管理：

```
src/admin/src/
├── core/                 # 核心模块
│   ├── config/           # 全局配置
│   │   ├── api.js        # API配置
│   │   ├── theme.js      # 主题配置
│   │   └── env.js        # 环境配置
│   ├── utils/            # 工具函数
│   │   ├── request.js    # HTTP请求封装
│   │   ├── storage.js    # 存储工具
│   │   └── validator.js  # 验证工具
│   ├── router/           # 路由配置
│   │   ├── index.js      # 路由入口
│   │   ├── guards.js     # 路由守卫
│   │   └── routes.js     # 路由定义
│   ├── store/            # 全局状态管理
│   └── hooks/            # 自定义Hooks
├── modules/              # 业务模块
│   ├── system/           # 系统设置模块
│   ├── user/             # 用户管理模块
│   ├── permission/       # 权限管理模块
│   ├── statistics/       # 数据统计模块
│   ├── operation/        # 运营管理模块
│   ├── content/          # 内容管理模块
│   ├── advertising/      # 广告管理模块
│   ├── wechat-official/  # 公众号管理模块
│   │   ├── components/   # 组件
│   │   ├── views/        # 页面
│   │   ├── services/     # API服务
│   │   ├── store/        # 状态管理
│   │   ├── router/       # 模块路由
│   │   └── index.js      # 模块入口
│   └── wework/           # 企业微信管理模块
│       ├── components/   # 组件
│       ├── views/        # 页面
│       ├── services/     # API服务
│       ├── store/        # 状态管理
│       ├── router/       # 模块路由
│       └── index.js      # 模块入口
├── components/           # 公共组件
├── pages/                # 页面组件
├── services/             # API服务层
├── assets/               # 静态资源
├── styles/               # 样式文件
└── main.js               # 应用入口
```

### 模块化实现策略

1. **Uni-app多端兼容模块化**：
   
   ```javascript
   // src/buyer/utils/request.js (多端兼容的请求封装)
   export default {
     async get(url, data) {
       return new Promise((resolve, reject) => {
         uni.request({
           url: process.env.VUE_APP_BASE_API + url,
           method: 'GET',
           data,
           success: (res) => resolve(res.data),
           fail: (err) => reject(err)
         });
       });
     },
   
     async post(url, data) {
       return new Promise((resolve, reject) => {
         uni.request({
           url: process.env.VUE_APP_BASE_API + url,
           method: 'POST',
           data,
           success: (res) => resolve(res.data),
           fail: (err) => reject(err)
         });
       });
     }
   };
   
   // src/buyer/services/product.js (API服务)
   import request from '../utils/request';
   
   export const getProductList = (params) => {
     return request.get('/api/buyer/product', params);
   };
   
   export const getProductDetail = (productId) => {
     return request.get(`/api/buyer/product/${productId}`);
   };
   ```

2. **Pinia状态管理模块化**：
   
   ```javascript
   // src/buyer/src/modules/order/store/orderStore.js
   import { defineStore } from 'pinia';
   import { getOrderList, getOrderDetail, createOrder } from '../services/orderService';
   
   export const useOrderStore = defineStore('order', {
     state: () => ({
       orders: [],
       currentOrder: null,
       loading: false,
       error: null
     }),
   
     getters: {
       pendingOrders: (state) => state.orders.filter(order => order.status === 'PENDING_PAYMENT'),
       completedOrders: (state) => state.orders.filter(order => order.status === 'COMPLETED')
     },
   
     actions: {
       async fetchOrders() {
         this.loading = true;
         this.error = null;
         try {
           this.orders = await getOrderList();
         } catch (err) {
           this.error = err.message;
         } finally {
           this.loading = false;
         }
       },
   
       async fetchOrderDetail(orderId) {
         this.loading = true;
         this.error = null;
         try {
           this.currentOrder = await getOrderDetail(orderId);
         } catch (err) {
           this.error = err.message;
         } finally {
           this.loading = false;
         }
       },
   
       async createNewOrder(orderData) {
         this.loading = true;
         this.error = null;
         try {
           const newOrder = await createOrder(orderData);
           this.orders.push(newOrder);
           return newOrder;
         } catch (err) {
           this.error = err.message;
           throw err;
         } finally {
           this.loading = false;
         }
       }
     }
   });
   ```

3. **Uni-app API服务模块化**：
   
   ```javascript
   // src/buyer/services/product.js
   import request from '../utils/request';
   
   // 产品列表
   export const getProductList = (params) => {
     return request.get('/api/buyer/product', params);
   };
   
   // 产品详情
   export const getProductDetail = (productId) => {
     return request.get(`/api/buyer/product/${productId}`);
   };
   
   // 产品搜索
   export const searchProducts = (keyword, filters = {}) => {
     return request.get('/api/buyer/product/search', {
       keyword, ...filters
     });
   };
   
   // 产品分类
   export const getProductCategories = () => {
     return request.get('/api/buyer/product/categories');
   };
   ```

4. **Uni-app自定义Composition函数**：
   
   ```javascript
   // src/buyer/utils/usePagination.js
   import { ref, computed } from 'vue';
   
   export function usePagination(fetchData, initialPage = 1, initialPageSize = 10) {
     const currentPage = ref(initialPage);
     const pageSize = ref(initialPageSize);
     const totalItems = ref(0);
     const loading = ref(false);
     const error = ref(null);
     const data = ref([]);
   
     const totalPages = computed(() => 
       Math.ceil(totalItems.value / pageSize.value)
     );
   
     const fetchPage = async (page = currentPage.value) => {
       loading.value = true;
       error.value = null;
       try {
         const result = await fetchData({
           page,
           pageSize: pageSize.value
         });
         data.value = result.items;
         totalItems.value = result.total;
         currentPage.value = page;
       } catch (err) {
         error.value = err.message;
       } finally {
         loading.value = false;
       }
     };
   
     const nextPage = () => {
       if (currentPage.value < totalPages.value) {
         fetchPage(currentPage.value + 1);
       }
     };
   
     const prevPage = () => {
       if (currentPage.value > 1) {
         fetchPage(currentPage.value - 1);
       }
     };
   
     const changePageSize = (newSize) => {
       pageSize.value = newSize;
       fetchPage(1);
     };
   
     // 初始加载
     fetchPage();
   
     return {
       currentPage,
       pageSize,
       totalItems,
       totalPages,
       loading,
       error,
       data,
       fetchPage,
       nextPage,
       prevPage,
       changePageSize
     };
   }
   ```

5. **应用入口模块化注册**：
   
   ```javascript
   // src/buyer/src/main.js
   import { createApp } from 'vue';
   import { createPinia } from 'pinia';
   import App from './App.vue';
   import router from './core/router';
   import ElementPlus from 'element-plus';
   import 'element-plus/dist/index.css';
   
   // 导入模块
   import authModule from './modules/auth';
   import productModule from './modules/product';
   import cartModule from './modules/cart';
   import orderModule from './modules/order';
   import profileModule from './modules/profile';
   import reviewModule from './modules/review';
   
   // 创建应用实例
   const app = createApp(App);
   
   // 使用插件
   app.use(createPinia());
   app.use(ElementPlus);
   
   // 注册模块
   [authModule, productModule, cartModule, orderModule, profileModule, reviewModule].forEach(module => {
     // 安装模块
     app.use(module);
     // 注册模块路由
     module.registerRoutes?.(router);
   });
   
   // 使用路由
   app.use(router);
   
   // 挂载应用
   app.mount('#app');
   ```

## 4. 模块间通信机制

### 后端模块通信

1. **REST API调用**
   
   - 定义清晰的接口契约
   
   - 使用标准化的请求/响应格式
   
   - 实现示例：
     
     ```javascript
     // src/api/buyer-api/order/services/orderService.js
     const paymentService = require('../../../../common-api/services/paymentService');
     ```
   
   async function processPayment(orderId, paymentData) {
     // 调用支付服务处理支付
     const paymentResult = await paymentService.processPayment({
   
       orderId,
       amount: paymentData.amount,
       method: paymentData.method
   
     });
   
     return paymentResult;
   }
   
   ```
   
   ```

2. **消息队列通信**
   
   - 基于Redis或RabbitMQ实现
   
   - 生产者-消费者模式
   
   - 实现示例：
     
     ```javascript
     // src/api/common-api/message-queue/producers/orderProducer.js
     const redisClient = require('../../../core/cache/redis/client');
     ```
   
   async function publishOrderCreatedEvent(order) {
     await redisClient.publish('order.created', JSON.stringify({
   
       orderId: order.id,
       userId: order.userId,
       amount: order.amount,
       timestamp: new Date().toISOString()
   
     }));
   }
   
   // src/api/message-consumer/order/orderCreatedConsumer.js
   const redisClient = require('../../../core/cache/redis/client');
   const notificationService = require('../../../common-api/services/notificationService');
   
   function startConsumer() {
     const subscriber = redisClient.duplicate();
     subscriber.subscribe('order.created');
   
     subscriber.on('message', async (channel, message) => {
   
       const event = JSON.parse(message);
       // 发送订单创建通知
       await notificationService.sendOrderCreatedNotification(event.userId, event.orderId);
   
     });
   }
   
   ```
   
   ```

3. **事件总线模式**
   
   - 中心化的事件注册和发布机制
   
   - 实现示例：
     
     ```javascript
     // src/api/core/event/eventBus.js
     class EventBus {
     constructor() {
       this.events = {};
     }
     
     on(event, handler) {
       if (!this.events[event]) {
         this.events[event] = [];
       }
       this.events[event].push(handler);
     }
     
     emit(event, ...args) {
       if (!this.events[event]) return;
       this.events[event].forEach(handler => handler(...args));
     }
     
     off(event, handler) {
       if (!this.events[event]) return;
       this.events[event] = this.events[event].filter(h => h !== handler);
     }
     }
     ```
   
   module.exports = new EventBus();
   
   // 使用示例
   const eventBus = require('../core/event/eventBus');
   
   // 注册事件监听器
   eventBus.on('user.login', (userId, userInfo) => {
     console.log(`User ${userId} logged in`);
   });
   
   // 触发事件
   eventBus.emit('user.login', 123, { username: 'testuser' });
   
   ```
   
   ```

4. **共享服务模式**
   
   - 将公共功能抽象为独立服务
   
   - 通过依赖注入提供给各模块
     
     ```javascript
     // src/api/common-api/services/notificationService.js
     class NotificationService {
     async sendNotification(userId, type, content) {
       // 发送通知的实现
     }
     
     async sendOrderCreatedNotification(userId, orderId) {
       return this.sendNotification(userId, 'order_created', {
         orderId,
         message: '您的订单已创建成功'
       });
     }
     }
     ```
   
   module.exports = new NotificationService();
   
   ```
   
   ```

### 前端模块通信

1. **Uni-app Pinia共享状态**
   
   ```javascript
   // src/buyer/store/modules/cartStore.js
   import { defineStore } from 'pinia';
   
   export const useCartStore = defineStore('cart', {
     state: () => ({
       items: [],
       totalAmount: 0
     }),
   
     actions: {
       addToCart(product, quantity = 1) {
         const existingItem = this.items.find(item => item.productId === product.id);
         if (existingItem) {
           existingItem.quantity += quantity;
         } else {
           this.items.push({
             productId: product.id,
             name: product.name,
             price: product.price,
             quantity
           });
         }
         this.updateTotalAmount();
         // 同步到本地存储
         uni.setStorageSync('cart', this.items);
       },
   
       updateTotalAmount() {
         this.totalAmount = this.items.reduce(
           (total, item) => total + (item.price * item.quantity),
           0
         );
       },
   
       // 从本地存储加载购物车
       loadCartFromStorage() {
         const cart = uni.getStorageSync('cart');
         if (cart) {
           this.items = cart;
           this.updateTotalAmount();
         }
       }
     }
   });
   
   // 在其他模块中使用
   import { useCartStore } from '@/modules/cart/store/cartStore';
   
   export default {
     setup() {
       const cartStore = useCartStore();
   
       function checkout() {
         if (cartStore.items.length === 0) {
           alert('购物车为空');
           return;
         }
         // 处理结算逻辑
       }
   
       return {
         cartItems: cartStore.items,
         totalAmount: cartStore.totalAmount,
         checkout
       };
     }
   };
   ```

2. **事件总线**
   
   ```javascript
   // src/buyer/src/core/utils/eventBus.js
   class EventBus {
     constructor() {
       this.events = {};
     }
   
     on(event, callback) {
       if (!this.events[event]) {
         this.events[event] = [];
       }
       this.events[event].push(callback);
     }
   
     emit(event, ...args) {
       if (!this.events[event]) return;
       this.events[event].forEach(callback => callback(...args));
     }
   
     off(event, callback) {
       if (!this.events[event]) return;
       this.events[event] = this.events[event].filter(cb => cb !== callback);
     }
   }
   
   export default new EventBus();
   
   // 使用示例
   import eventBus from '@/core/utils/eventBus';
   
   // 组件A中触发事件
   eventBus.emit('product.added', { productId: 1, quantity: 2 });
   
   // 组件B中监听事件
   eventBus.on('product.added', (data) => {
     console.log('Product added to cart:', data);
     // 更新UI或执行其他操作
   });
   ```

3. **Vue 3 Provide/Inject API**
   
   ```javascript
   // 在父组件或应用级别提供服务
   import { provide } from 'vue';
   import { useCartStore } from '@/modules/cart/store/cartStore';
   
   export default {
     setup() {
       const cartStore = useCartStore();
   
       // 提供购物车服务给所有子组件
       provide('cartService', {
         addToCart: (product, quantity) => cartStore.addToCart(product, quantity),
         getCartItems: () => cartStore.items,
         getTotalAmount: () => cartStore.totalAmount
       });
   
       return {};
     }
   };
   
   // 在子组件中注入并使用
   import { inject } from 'vue';
   
   export default {
     setup() {
       const cartService = inject('cartService');
   
       function handleAddToCart(product) {
         cartService.addToCart(product, 1);
       }
   
       return {
         cartItems: cartService.getCartItems(),
         handleAddToCart
       };
     }
   };
   ```

4. **Uni-app路由参数传递与管理**
   
   ```javascript
   // 导航时传递参数
   export default {
     methods: {
       navigateToProduct(productId) {
         uni.navigateTo({
           url: `/pages/product/detail?id=${productId}&source=homepage`,
           success: () => {
             console.log('成功跳转到商品详情页');
           },
           fail: (err) => {
             console.error('跳转失败', err);
           }
         });
       }
     }
   };
   
   // 在目标页面接收参数
   export default {
     onLoad(options) {
       // options中包含传递的参数
       const productId = options.id;
       const source = options.source;
   
       // 使用参数加载数据
       this.loadProductDetail(productId);
     },
     data() {
       return {
         productDetail: null,
         loading: true
       };
     },
     methods: {
       loadProductDetail(id) {
         // 调用API获取商品详情
         this.loading = true;
         // 实际开发中这里应该调用API服务
         setTimeout(() => {
           this.productDetail = { id };
           this.loading = false;
         }, 500);
       }
     }
   };
   ```

## 5. 模块化的最佳实践

### 架构设计原则

1. **单一职责原则 (SRP)**
   
   - 每个模块只负责一个明确的业务领域，如订单模块专注订单管理，支付模块专注支付流程
   
   - 代码变更时影响范围最小化，降低维护复杂度
   
   - 示例：
     
     ```javascript
     // 订单服务 - 专注订单管理
     class OrderService {
       async createOrder() {}
       async getOrderById() {}
       async updateOrderStatus() {}
       // 不包含支付处理逻辑，这属于支付模块的职责
     }
     
     // 支付服务 - 专注支付流程
     class PaymentService {
       async processPayment() {}
       async refundPayment() {}
       async verifyPayment() {}
     }
     ```

2. **接口隔离原则 (ISP)**
   
   - 模块对外提供最小必要的接口，隐藏内部实现细节
   
   - 避免暴露私有方法和内部状态，提高模块安全性
   
   - 示例：
     
     ```javascript
     // 模块入口文件 - 仅导出公共API
     module.exports = {
       // 只导出必要的公共方法
       createUser: require('./services/userService').createUser,
       getUserInfo: require('./services/userService').getUserInfo,
       // 内部验证方法不导出
       // _validateUserInput: require('./services/userService')._validateUserInput
     };
     ```

3. **依赖倒置原则 (DIP)**
   
   - 高层模块依赖抽象接口，不依赖具体实现
   
   - 使用接口或抽象类定义模块间契约，便于替换实现
   
   - 示例：
     
     ```javascript
     // 抽象支付接口
     class PaymentGateway {
       processPayment() {
         throw new Error('Method not implemented');
       }
     }
     
     // 具体实现 - 支付宝
     class AlipayGateway extends PaymentGateway {
       async processPayment(order) {
         // 支付宝支付实现
       }
     }
     
     // 具体实现 - 微信支付
     class WechatPayGateway extends PaymentGateway {
       async processPayment(order) {
         // 微信支付实现
       }
     }
     
     // 使用抽象接口，不依赖具体实现
     class OrderService {
       constructor(paymentGateway) {
         this.paymentGateway = paymentGateway;
       }
     
       async processPayment(order) {
         return await this.paymentGateway.processPayment(order);
       }
     }
     ```

4. **高内聚低耦合**
   
   - 模块内部高度内聚：相关功能聚集在同一模块
   - 模块间低耦合：通过明确接口通信，不直接依赖内部实现
   - 使用依赖注入容器管理模块依赖关系
   - 建立事件总线机制，减少直接依赖

### 代码组织最佳实践

1. **一致的命名规范**
   
   - **文件命名**：使用kebab-case (如 `user-service.js`) 或 camelCase (如 `userService.js`)，保持项目内部一致性
   - **类名**：使用PascalCase (如 `UserService`)
   - **函数和变量**：使用camelCase (如 `getUserData`)
   - **常量**：使用SCREAMING_SNAKE_CASE (如 `MAX_RETRY_COUNT`)
   - **目录命名**：使用kebab-case (如 `src/buyer/pages/product-detail`)
   - **接口命名**：以I开头的PascalCase (如 `IOrderService`)

2. **模块化代码结构**
   
   - 按功能领域组织模块，遵循关注点分离原则
   
   - 每个模块内部结构保持一致，便于团队协作
   
   - 严格遵循分层架构：
     
     - 控制器层 (Controllers)：处理HTTP请求和响应
     - 服务层 (Services)：实现核心业务逻辑
     - 数据访问层 (Repositories)：处理数据库操作
   
   - **前端模块结构** (Uni-app):
     
     ```
     src/buyer/
     ├── pages/          # 页面组件，按功能组织
     ├── components/     # 可复用组件
     ├── services/       # API服务
     ├── store/          # Pinia状态管理
     ├── utils/          # 工具函数
     └── static/         # 静态资源
     ```

3. **代码复用策略**
   
   - **通用逻辑提取**：将重复使用的功能封装为工具函数或共享服务
   - **组件化**：将UI拆分为可复用的组件，特别是在Uni-app多端应用中
   - **组合模式**：优先使用组合而非继承实现代码复用
   - **遵循DRY原则** (Don't Repeat Yourself)，避免代码复制粘贴
   - **共享库**：在根目录创建共享库，供各端复用核心业务逻辑

4. **错误处理标准化**
   
   - **统一错误格式**：定义标准化的错误响应结构
   
   - **错误类型分层**：区分系统错误、业务错误、参数错误等
   
   - **友好错误信息**：对用户展示友好的错误提示，记录详细错误日志
   
   - **全局错误处理**：实现统一的异常捕获和处理机制
   
   - 示例：
     
     ```javascript
     // 自定义错误基类
     class BusinessError extends Error {
       constructor(message, statusCode = 400, errorCode) {
         super(message);
         this.name = this.constructor.name;
         this.statusCode = statusCode;
         this.errorCode = errorCode;
         Error.captureStackTrace(this, this.constructor);
       }
     }
     
     // 具体错误类型
     class NotFoundError extends BusinessError {
       constructor(resource, id) {
         super(`${resource} with ID ${id} not found`, 404, 'RESOURCE_NOT_FOUND');
       }
     }
     
     // 全局错误处理中间件 (Express)
     function errorHandler(err, req, res, next) {
       if (err instanceof BusinessError) {
         return res.status(err.statusCode).json({
           success: false,
           error: {
             code: err.errorCode,
             message: err.message
           }
         });
       }
     
       // 未预期的错误
       console.error('Unexpected error:', err);
       return res.status(500).json({
         success: false,
         error: {
           code: 'INTERNAL_ERROR',
           message: 'Internal server error'
         }
       });
     }
     ```

### 测试与文档

1. **自动化测试策略**
   
   - **测试分层**：
     
     - **单元测试**：测试模块内部函数和类，确保单个组件功能正确
     - **集成测试**：测试模块间的交互，验证模块集成后的功能
     - **端到端测试**：测试完整的业务流程，模拟用户操作
   
   - **测试覆盖率目标**：
     
     - 核心业务逻辑：≥80%
     - 公共库和工具函数：≥90%
     - 边界条件和异常处理：100%
   
   - **前端测试工具**（Uni-app兼容）：
     
     - Jest + Vue Test Utils：组件和函数单元测试
     - Cypress：端到端测试
     - 小程序模拟器：多端兼容性测试
   
   - **测试示例**：
     
     ```javascript
     // userService.test.js - 单元测试示例
     const userService = require('../services/userService');
     const userRepository = require('../repositories/userRepository');
     
     // 模拟依赖
     jest.mock('../repositories/userRepository');
     
     describe('UserService', () => {
       beforeEach(() => {
         // 重置所有模拟
         jest.clearAllMocks();
       });
     
       test('should create user successfully', async () => {
         // 准备测试数据
         const userData = { username: 'test', email: 'test@example.com' };
         const mockUser = { id: 1, ...userData };
     
         // 配置模拟行为
         userRepository.create.mockResolvedValue(mockUser);
     
         // 执行被测函数
         const result = await userService.createUser(userData);
     
         // 验证结果
         expect(result).toEqual(mockUser);
         expect(userRepository.create).toHaveBeenCalledWith(userData);
       });
     
       test('should throw error when username is invalid', async () => {
         // 准备无效数据
         const invalidUser = { username: '', email: 'test@example.com' };
     
         // 验证错误抛出
         await expect(userService.createUser(invalidUser))
           .rejects.toThrow('Username is required');
       });
     });
     ```

2. **文档化要求**
   
   - **API接口文档**：
     
     - 使用Swagger/OpenAPI 3.0规范
     - 提供完整的请求参数、响应格式和错误码说明
     - 包含接口示例和测试功能
     - 自动同步代码变更
   
   - **代码注释标准**：
     
     - 使用JSDoc格式为函数、类和参数添加注释
     - 核心业务逻辑添加详细说明
     - 复杂算法提供实现思路
   
   - **架构文档**：
     
     - 模块关系图和依赖分析
     - 关键设计决策和理由
     - 数据流和交互流程
     - 多端兼容性说明（针对Uni-app）
   
   - **注释示例**：
     
     ```javascript
     /**
      * 用户服务类 - 处理用户管理相关业务逻辑
      * @class UserService
      */
     class UserService {
       /**
        * 创建新用户
        * @param {Object} userData - 用户数据
        * @param {string} userData.username - 用户名 (必填，3-20字符)
        * @param {string} userData.email - 邮箱地址 (必填，有效格式)
        * @param {string} userData.password - 密码 (必填，至少8位)
        * @returns {Promise<Object>} 创建的用户对象
        * @throws {ValidationError} 当输入数据无效时
        * @throws {DuplicateError} 当用户名或邮箱已存在时
        */
       async createUser(userData) {
         // 实现逻辑
       }
     }
     ```

3. **模块化代码审查清单**
   
   - **设计审查**：
     - 模块职责是否单一明确？
     - 模块间耦合是否最小化？
     - 是否遵循了依赖倒置原则？
     - 是否考虑了多端兼容性？
   - **实现审查**：
     - 是否有完善的错误处理机制？
     - 是否遵循了统一的命名规范？
     - 是否正确处理了异步操作和边界条件？
     - 是否避免了重复代码？
   - **质量审查**：
     - 是否有充分的测试覆盖？
     - 文档是否完整清晰？
     - 是否有性能优化考虑？
     - 是否存在潜在的安全风险？

### 性能与安全

1. **性能优化策略**
   
   - **代码层面优化**：
     
     - **懒加载**：组件和路由懒加载，减少初始加载时间
     - **代码分割**：将代码分割为更小的块，按需加载
     - **Tree Shaking**：移除未使用的代码，减小打包体积
     - **虚拟滚动**：处理大量数据列表时使用虚拟滚动
   
   - **网络优化**：
     
     - **请求合并**：减少HTTP请求次数
     - **缓存策略**：合理使用浏览器缓存和本地存储
     - **CDN加速**：静态资源使用CDN分发
     - **压缩传输**：启用Gzip/Brotli压缩
   
   - **数据库优化**：
     
     - 索引优化：合理创建和使用索引
     - 查询优化：避免全表扫描，优化JOIN查询
     - 连接池：使用数据库连接池管理连接
     - 读写分离：分离数据库读写操作
   
   - **Uni-app多端性能优化**：
     
     - **条件编译**：针对不同平台使用条件编译优化
     - **分包加载**：使用分包机制减小主包体积
     - **预加载**：预加载可能访问的页面
     - **组件复用**：提取公共组件减少重复渲染
     - **资源压缩**：压缩图片、字体等静态资源
     
     ```javascript
     // Uni-app分包配置示例 - pages.json
     {
       "pages": [
         { "path": "pages/index/index" },
         { "path": "pages/product/list" }
       ],
       "subpackages": [
         {
           "root": "subpackages/cart",
           "pages": [
             { "path": "index/index" },
             { "path": "checkout/index" }
           ]
         },
         {
           "root": "subpackages/user",
           "pages": [
             { "path": "center/index" },
             { "path": "orders/index" }
           ]
         }
       ]
     }
     ```

2. **安全最佳实践**
   
   - **前端安全**：
     
     - **XSS防护**：对用户输入进行转义和过滤
     - **CSRF防护**：实施跨站请求伪造防护措施
     - **数据加密**：敏感数据在前端进行加密存储
     - **安全存储**：使用安全的存储方式，避免使用localStorage存储敏感信息
     - **输入验证**：前端实施输入验证（与后端验证双重保障）
   
   - **后端安全**：
     
     - **认证授权**：实施强认证和细粒度授权
     - **密码存储**：使用bcrypt等算法安全存储密码
     - **SQL注入防护**：使用参数化查询或ORM框架
     - **API安全**：实施API访问限制和速率控制
     - **错误处理**：避免在响应中暴露敏感信息
   
   - **Uni-app多端安全**：
     
     - **小程序安全**：遵循各平台小程序安全规范
     - **API请求封装**：统一处理请求授权和错误
     - **敏感操作验证**：关键操作增加二次验证
     - **权限控制**：前端路由权限控制
   
   - **通用安全措施**：
     
     - **HTTPS**：全站使用HTTPS加密传输
     - **安全头部**：配置适当的安全响应头
     - **CORS配置**：正确配置跨域资源共享策略
     - **日志监控**：记录安全相关事件和异常
     - **定期安全审计**：定期进行安全漏洞扫描
     
     ```javascript
     // API请求安全封装示例
     import axios from 'axios';
     import store from './store';
     import { showToast } from './utils/UI';
     
     const api = axios.create({
       baseURL: process.env.VUE_APP_API_BASE_URL,
       timeout: 10000,
       headers: {
         'Content-Type': 'application/json'
       }
     });
     
     // 请求拦截器 - 添加认证信息
     api.interceptors.request.use(config => {
       const token = store.getters.token;
       if (token) {
         config.headers.Authorization = `Bearer ${token}`;
       }
       return config;
     }, error => {
       return Promise.reject(error);
     });
     
     // 响应拦截器 - 统一错误处理和安全检查
     api.interceptors.response.use(response => {
       return response.data;
     }, error => {
       // 处理401未授权
       if (error.response && error.response.status === 401) {
         // 清除token并重定向到登录
         store.dispatch('logout');
         uni.redirectTo({ url: '/pages/auth/login' });
       }
     
       // 显示友好错误信息
       const errorMsg = error.response?.data?.message || 'Network error';
       showToast(errorMsg, 'error');
     
       return Promise.reject(error);
     });
     
     export default api;
     ```

## 6. 模块化迁移策略

### 迁移准备阶段

1. **现状评估与分析**
   
   - 对现有代码库进行全面分析
   - 识别核心功能模块和业务流程
   - 评估现有代码质量和技术债务
   - 制定详细的迁移计划和时间表

2. **基础设施准备**
   
   - 建立新的项目结构和目录
   - 配置构建工具和自动化脚本
   - 设置代码规范和质量检查工具
   - 准备版本控制分支策略

### 渐进式重构策略

1. **核心模块优先**
   
   - 首先迁移核心基础设施模块
     
     ```javascript
     // 示例：迁移核心工具类到新结构
     // 1. 创建新目录结构
     // mkdir -p src/api/core/utils
     ```
   
   // 2. 迁移现有工具函数
   // cp old-path/utils.js src/api/core/utils/common.js
   
   // 3. 创建模块入口文件
   // src/api/core/utils/index.js
   module.exports = {
     common: require('./common'),
     date: require('./date'),
     encryption: require('./encryption')
   };
   
   ```
   
   ```

2. **适配层模式**
   
   - 创建适配层连接新旧系统
   
   - 实现平滑过渡
     
     ```javascript
     // 适配层示例
     // src/api/adapters/legacyAdapter.js
     const legacyOrderService = require('../../legacy/services/orderService');
     const newOrderService = require('../buyer-api/order/services/orderService');
     ```
   
   module.exports = {
     // 优先使用新服务，失败时回退到旧服务
     async createOrder(orderData) {
   
       try {
         return await newOrderService.createOrder(orderData);
       } catch (error) {
         console.warn('New order service failed, falling back to legacy:', error);
         return await legacyOrderService.createOrder(orderData);
       }
   
     }
   };
   
   ```
   
   ```

3. **增量迁移计划**
   
   - 制定分阶段迁移路线图
   - 每个阶段专注于特定模块或功能
   - 设定明确的成功标准和验收条件
   
   | 阶段  | 时间  | 迁移内容    | 成功标准     |
   | --- | --- | ------- | -------- |
   | 1   | 2周  | 核心框架模块  | 基础功能正常运行 |
   | 2   | 3周  | 公共API模块 | API文档可访问 |
   | 3   | 4周  | 买家端API  | 买家功能测试通过 |
   | 4   | 4周  | 卖家端API  | 卖家功能测试通过 |
   | 5   | 3周  | 管理端功能   | 管理功能测试通过 |
   | 6   | 2周  | 消息和定时任务 | 异步功能正常   |

### 实施策略

1. **功能隔离**
   
   - 新增功能直接在新模块中实现
   - 标记需要重构的旧功能，按优先级排期
   - 避免修改待迁移的旧代码

2. **并行运行与逐步切换**
   
   - 使用特性开关控制新旧代码路径
     
     ```javascript
     // 使用特性开关
     const featureFlags = require('../core/config/featureFlags');
     ```
   
   function processRequest(req, res) {
     if (featureFlags.useNewOrderModule) {
   
       // 使用新模块处理
       newOrderModule.handleRequest(req, res);
   
     } else {
   
       // 使用旧模块处理
       legacyOrderHandler(req, res);
   
     }
   }
   
   ```
   
   ```

3. **数据迁移策略**
   
   - 数据库模式逐步演进
   - 使用数据库视图兼容新旧数据结构
   - 实施双写机制确保数据一致性

### 验证与质量保障

1. **多层次测试策略**
   
   - 单元测试：确保每个模块功能正确
   - 集成测试：验证模块间交互
   - 端到端测试：保障完整业务流程
   - 性能测试：确保性能不退化

2. **监控与回滚机制**
   
   - 部署监控系统跟踪关键指标
   
   - 设置自动告警阈值
   
   - 准备详细的回滚计划和应急预案
     
     ```javascript
     // 监控配置示例
     // src/api/core/monitoring/config.js
     module.exports = {
     metrics: {
       responseTime: { enabled: true, threshold: 1000 },
       errorRate: { enabled: true, threshold: 0.01 },
       requestCount: { enabled: true }
     },
     alerts: {
       email: ['admin@example.com'],
       slack: '#alerts-channel'
     }
     };
     ```

3. **用户反馈与迭代**
   
   - 收集用户反馈验证功能正确性
   - 基于反馈持续优化模块设计
   - 定期回顾迁移进度并调整计划

## 6. 技术栈选择建议

### 后端技术选型

1. **核心框架**
   
   - **Express.js**：成熟稳定，社区活跃，中间件丰富，适合大多数Web应用
   - **Koa.js**：更现代的异步支持，错误处理更优雅，适合高性能需求
   - **NestJS**：基于TypeScript的企业级框架，模块化设计，支持微服务
   - **选择建议**：中小项目首选Express；对性能要求高或团队技术栈较新的项目可选择Koa；大型企业级应用推荐NestJS

2. **ORM/数据库访问**
   
   - **Sequelize**：全功能ORM，支持多数据库，事务处理强大
   - **Prisma**：新一代ORM，类型安全，开发体验好，性能优异
   - **TypeORM**：TypeScript支持优秀，适合TypeScript项目
   - **选择建议**：传统项目选Sequelize；新项目且使用TypeScript推荐Prisma

3. **数据库**
   
   - **MySQL (>= 8.0)**：关系型数据库，成熟稳定，适合结构化数据存储
   - **PostgreSQL**：功能强大，支持复杂查询和JSON，扩展性好
   - **MongoDB**：NoSQL数据库，适合文档型数据和快速迭代
   - **Redis (>= 6.0)**：用于缓存、会话管理和消息队列
   - **选择建议**：电商类项目首选MySQL；数据分析场景可选PostgreSQL；灵活多变的场景可考虑MongoDB

4. **消息队列**
   
   - **RabbitMQ**：功能完善，可靠性高，支持多种消息模式
   - **Redis**：简单轻量，适合实时性要求高的场景
   - **Kafka**：高吞吐量，适合大数据量场景
   - **选择建议**：一般场景Redis足够；需要保证消息可靠性选RabbitMQ；大数据场景选Kafka

5. **认证与授权**
   
   - **JWT (jsonwebtoken)**：无状态认证，适合分布式系统
   - **Passport.js**：灵活的认证中间件，支持多种认证策略
   - **OAuth 2.0**：第三方认证授权标准
   - **选择建议**：前后端分离架构使用JWT；需要多种认证方式集成Passport.js

6. **API文档**
   
   - **Swagger UI**：行业标准，自动生成交互式文档
   - **Postman**：接口测试和文档管理
   - **选择建议**：开发阶段使用Swagger，配合Postman进行测试

### 前端技术选型

1. **框架与构建工具**
   
   - **Uni-app + Vue 3 + Vite**：跨平台框架，支持小程序、H5、App多端部署，Vue 3提供更好的性能和开发体验
   - **Vue 3 + Vite + TypeScript**：现代轻量级框架，开发体验优异，性能出色，适合管理后台
   - **选择建议**：
     - **买家端**：强制使用Uni-app实现3端互通（小程序、H5、App）
     - **卖家端/管理端**：Vue 3 + Vite + TypeScript，提供更好的开发体验和维护性

2. **状态管理**
   
   - **Pinia**：Vue 3推荐的状态管理库，简洁易用，TypeScript支持好，Uni-app兼容
   - **Vuex**：成熟的Vue状态管理方案
   - **选择建议**：全项目统一使用Pinia，保持技术栈一致性，简化学习成本

3. **UI组件库**
   
   - **Uni-app内置组件 + uView UI**：专为Uni-app设计，多端兼容性好，适合买家端
   - **Element Plus**：专为Vue 3设计，组件丰富，文档完善，适合管理后台
   - **Ant Design Vue**：企业级UI组件库，设计规范，功能强大，适合复杂管理界面
   - **Vant**：轻量级移动端UI库，适合移动端Web应用
   - **选择建议**：
     - **买家端**：Uni-app内置组件 + uView UI
     - **卖家端/管理端**：Element Plus

4. **HTTP客户端**
   
   - **Axios**：功能全面，拦截器强大，错误处理友好，Uni-app兼容
   - **Fetch API**：浏览器原生，轻量简洁
   - **选择建议**：全项目统一使用Axios，配合请求封装实现统一的认证和错误处理

5. **图表与可视化**
   
   - **ECharts**：功能全面，支持各种图表类型，有Uni-app适配版本
   - **AntV**：阿里开源可视化库，性能优异
   - **选择建议**：复杂可视化需求选ECharts，确保使用Uni-app适配版本

6. **内容编辑与数据处理**
   
   - **wangEditor**：轻量级富文本编辑器，中文友好，有Uni-app适配版本
   - **exceljs, xlsx**：Excel文件处理库
   - **选择建议**：内容编辑选wangEditor；Excel数据处理选exceljs或xlsx

### DevOps与基础设施

1. **容器化与编排**
   
   - **Docker + Docker Compose**：轻量级容器化解决方案
   - **Kubernetes**：大规模容器编排平台
   - **选择建议**：中小项目用Docker Compose；大型分布式系统用Kubernetes

2. **CI/CD工具**
   
   - **GitHub Actions**：与GitHub集成紧密，配置简单
   - **Jenkins**：高度可定制，插件丰富
   - **GitLab CI**：与GitLab集成，一站式解决方案
   - **选择建议**：使用GitHub托管代码选GitHub Actions；需要复杂构建流程选Jenkins

3. **监控与日志**
   
   - **Prometheus + Grafana**：强大的监控和可视化
   - **ELK Stack**：日志收集、分析和可视化
   - **Winston + Morgan**：Node.js日志解决方案
   - **选择建议**：生产环境推荐Prometheus + Grafana + ELK；开发环境可用Winston + Morgan

### 统一依赖管理策略

根据项目需求，采用以下依赖管理策略：

1. **公共依赖统一管理**
   
   - 在根目录创建`packages/common`目录存放公共依赖
   - 公共依赖包括：工具函数、业务模型、API接口定义等
   - 使用Lerna或Nx进行monorepo管理

2. **端专属依赖隔离**
   
   - 买家端(Uni-app)、卖家端、管理端各自维护专属依赖
   - 在各自目录的`package.json`中定义端特定依赖
   - 避免版本冲突和不必要的依赖加载

3. **构建配置适配**
   
   - 买家端：配置Uni-app特有的构建参数和平台适配
   - 管理后台：配置Vue项目的构建优化
   - 统一环境变量管理

4. **版本强制兼容**
   
   - 使用`package.json`的`engines`字段指定Node.js版本
   - 使用npm hooks确保依赖安装一致性
   - 使用`yarn.lock`或`package-lock.json`锁定版本

### 推荐技术栈组合

**小型项目（快速上线）**：

- 后端：Express.js + Sequelize + MySQL + Redis
- 前端：
  - 买家端：Uni-app + Vue 3 + Pinia + uView UI + Axios
  - 管理端：Vue 3 + Vite + Pinia + Element Plus + Axios
- DevOps：Docker Compose + GitHub Actions + Winston

**中型项目（功能丰富）**：

- 后端：Express.js + Prisma + MySQL + Redis + RabbitMQ
- 前端：
  - 买家端：Uni-app + Vue 3 + Pinia + uView UI + Axios
  - 管理端：Vue 3 + Vite + TypeScript + Pinia + Element Plus + Axios + ECharts
- DevOps：Docker Compose + GitHub Actions + Prometheus + Grafana

**大型项目（高并发、分布式）**：

- 后端：NestJS + Prisma + PostgreSQL + Redis + Kafka
- 前端：
  - 买家端：Uni-app + Vue 3 + Pinia + uView UI + Axios
  - 管理端：Vue 3 + Vite + TypeScript + Pinia + Ant Design Vue + Axios + ECharts
- DevOps：Kubernetes + Jenkins + Prometheus + Grafana + ELK

## 8. 部署与扩展策略

### 统一部署启动方案

为确保项目在不同环境下的一致性和可维护性，我们采用统一的部署和启动命令，并严格规范端口使用。

#### 端口统一管理

遵循以下端口分配原则，确保各服务端口按顺序分配且不冲突：

- **API服务**: 3000 端口
- **管理端**: 4000 端口
- **买家端(积分商城)**: 5000 端口

#### 开发模式命令

开发模式下，使用 `dev` 前缀的命令：

```bash
# 启动所有服务（API + 管理端 + 买家端）
npm run dev

# 仅启动API服务
npm run dev:api

# 仅启动管理端
npm run dev:admin

# 仅启动买家端(积分商城)
npm run dev:mall
```

#### 生产模式命令

生产模式下，使用 `prod` 前缀的命令，会自动构建并启动生产版本：

```bash
# 构建并启动所有服务（API + 管理端 + 买家端）
npm run prod

# 仅构建并启动API服务
npm run prod:api

# 仅构建并启动管理端
npm run prod:admin

# 仅构建并启动买家端(积分商城)
npm run prod:mall
```

#### 仅启动生产版本

如果已经构建过，可以直接启动生产版本：

```bash
# 启动所有生产版本服务
npm run start:prod

# 仅启动API生产版本
npm run start:prod:api

# 仅启动管理端生产版本
npm run start:prod:admin

# 仅启动买家端生产版本
npm run start:prod:mall
```

#### 环境配置

环境配置通过 `.env` 文件统一管理，主要环境变量包括：

- `NODE_ENV`: 环境标识（development/production）
- `API_PORT`: API服务端口（固定为3000）
- `ADMIN_PORT`: 管理端端口（固定为4000）
- `MALL_PORT`: 买家端端口（固定为5000）
- 数据库、Redis等其他配置

### 部署架构设计

1. **多环境部署策略**
   
   - **开发环境**：本地开发 + Docker容器
   - **测试环境**：完整的环境副本，自动部署
   - **预发布环境**：模拟生产环境，用于最终验证
   - **生产环境**：高可用配置，多实例部署

2. **服务部署架构**
   
   - **负载均衡**：使用Nginx或云服务商提供的负载均衡器
   - **自动扩缩容**：基于流量和资源使用情况自动调整实例数
   - **滚动更新**：确保服务零停机更新
   - **蓝绿部署**：通过切换路由实现快速回滚

3. **数据库部署**
   
   - **主从复制**：实现读写分离，提高性能
   - **定期备份**：自动备份策略和恢复演练
   - **连接池**：优化数据库连接管理

4. **缓存策略**
   
   - **Redis集群**：确保缓存高可用
   - **缓存预热**：系统启动时加载热点数据
   - **缓存过期策略**：合理设置TTL，避免内存溢出

### 扩展策略

1. **水平扩展**
   
   - 无状态服务多实例部署
   - 数据库分片策略
   - 缓存集群扩容

2. **垂直扩展**
   
   - 资源瓶颈分析
   - 服务规格升级
   - 数据库优化和索引调整

3. **功能扩展**
   
   - 插件化架构设计
   - 微服务拆分准备
   - API版本控制策略

### 监控与运维

1. **系统监控**
   
   - 服务健康检查
   - 资源使用率监控
   - 响应时间和吞吐量监控

2. **日志管理**
   
   - 集中式日志收集
   - 日志分析和告警
   - 日志保留策略

3. **故障处理**
   
   - 故障自动检测
   - 自动恢复机制
   - 故障演练和预案

### 性能优化策略

1. **代码层面优化**
   
   - 数据库查询优化
   - 异步处理非关键路径
   - 资源压缩和合并

2. **架构层面优化**
   
   - CDN加速静态资源
   - 读写分离
   - 数据分片

3. **缓存策略优化**
   
   - 多级缓存设计
   - 缓存命中率监控
   - 缓存失效策略优化

## 9. 总结

通过采用上述模块化设计方案，我们可以将一个混乱的项目结构转变为一个清晰、可维护、可扩展的系统架构。这种设计不仅提高了开发效率，降低了维护成本，还为未来的功能扩展和性能优化提供了坚实的基础。

模块化设计的核心优势包括：

1. **关注点分离**：每个模块专注于自己的业务领域
2. **代码复用**：公共功能可以被多个模块共享
3. **可维护性**：问题定位和修复更加容易
4. **可扩展性**：新功能可以在不影响现有功能的情况下添加
5. **团队协作**：不同团队可以并行开发不同模块

最后，模块化设计不是一次性的工作，而是一个持续改进的过程。随着业务的发展和技术的进步，我们需要不断地调整和优化模块结构，以适应新的需求和挑战。# WeDraw

# 
