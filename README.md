# WeDrawOS - 模块化电商系统

## 项目简介

WeDrawOS是一个功能完备的模块化电商系统，提供买家、卖家和管理员全流程解决方案，同时集成了公众号和企业微信管理能力。系统采用前后端分离架构，支持多端访问和实时消息通信，并配备AI智能助手提供实时帮助。

## 核心功能特性

### 1. 多角色系统

- **买家端**：商品浏览、搜索、购物车、下单支付、个人中心
- **卖家端**：商品管理、订单处理、营销活动、销售数据分析
- **管理端**：用户管理、权限控制、数据统计、内容管理、运营管理

### 2. 微信生态集成

- **公众号管理**：账号配置、用户管理、素材管理、模板消息、自定义菜单
- **企业微信管理**：外部群群发、素材管理、消息发送统计

### 3. AI智能助手

- 集成本地AI模型，提供系统使用帮助
- 智能问答、常见问题解答
- 实时交互界面，支持预设问题快速访问

### 4. 即时通讯

- 实时消息推送
- 在线客服系统
- WebSocket通信支持

### 5. 系统运维

- 完整的日志管理
- 定时任务调度
- 数据统计与分析
- 性能监控

## 技术栈

### 后端

- **核心框架**：Node.js + Express
- **数据库**：MySQL (Sequelize ORM)
- **缓存**：Redis
- **认证**：JWT (JSON Web Token)
- **AI服务**：node-llama-cpp (本地运行AI模型)
- **通信**：WebSocket, AMQP
- **API文档**：Swagger

### 前端

- **框架**：React 18
- **UI组件库**：Ant Design 5
- **路由**：React Router 6
- **状态管理**：Context API
- **HTTP客户端**：Axios
- **构建工具**：Vite
- **开发工具**：concurrently (多服务并行启动)

## 项目结构

```
WeDrawOS/
├── .env                    # 环境变量配置
├── .env.example            # 环境变量示例
├── .gitignore              # Git忽略配置
├── README.md               # 项目文档
├── START.md                # 启动说明文档
├── build.js                # 构建脚本
├── package.json            # 项目配置和依赖
├── src/                    # 源代码目录
│   ├── admin/              # 管理端前端代码
│   │   ├── index.html      # HTML入口
│   │   ├── src/            # 管理端源码
│   │   └── vite.config.js  # Vite配置
│   ├── api/                # 后端API代码
│   │   ├── ai-service/     # AI服务模块
│   │   ├── admin-api/      # 管理员API
│   │   ├── buyer-api/      # 买家API
│   │   ├── common-api/     # 通用API
│   │   ├── core/           # 核心框架
│   │   ├── im-api/         # 即时通讯API
│   │   ├── message-consumer/# 消息消费者
│   │   ├── seller-api/     # 卖家API
│   │   └── index.js        # API入口
│   ├── buyer/              # 买家端代码
│   │   ├── App.jsx         # 应用主组件
│   │   ├── index.html      # HTML入口
│   │   ├── main.jsx        # React应用入口
│   │   ├── common/         # 通用组件
│   │   ├── components/     # UI组件
│   │   ├── pages/          # 页面组件
│   │   ├── services/       # 服务层
│   │   ├── static/         # 静态资源
│   │   ├── store/          # 状态管理
│   │   ├── utils/          # 工具函数
│   │   └── vite.config.js  # Vite配置
│   ├── config/             # 配置文件
│   └── utils/              # 通用工具
└── uploads/                # 上传文件目录
```

## 安装与配置

### 环境要求

- Node.js >= 14.0.0
- MySQL >= 5.7
- Redis >= 6.0

### 安装步骤

1. **克隆项目**
   
   ```bash
   git clone [项目仓库地址]
   cd WeDrawOS
   ```

2. **安装依赖**
   
   ```bash
   npm install
   ```

3. **配置环境变量**
   
   ```bash
   # 根据.env.example创建.env文件
   cp .env.example .env
   # 编辑.env文件，设置数据库连接和其他配置
   # 数据库配置中user固定为root，password固定为123456，dbname固定为wedraw
   ```

4. **初始化数据库**
   
   ```bash
   # 运行数据库迁移和初始化数据
   npm run db:reset
   ```

## 端口配置

- **后端API服务**：3000
- **管理端应用**：3001 (开发环境)
- **买家端应用**：3002 (开发环境)
- **数据库服务**：3306
- **Redis服务**：6379

## 开发与运行

### 一键启动所有服务

```bash
# 开发模式（同时启动API、管理端和买家端）
npm run dev:all
```

### 单独启动各服务

```bash
# 启动后端API服务（开发模式）
npm run dev

# 启动管理端前端（开发模式）
npm run admin:dev

# 启动买家端前端（开发模式）
npm run buyer:dev
```

### 生产环境部署

```bash
# 构建并启动生产环境API服务
npm run start:prod

# 仅构建生产版本
npm run build
```

### 构建与预览各前端项目

```bash
# 构建管理端生产版本
npm run admin:build

# 预览管理端生产版本
npm run admin:preview

# 构建买家端生产版本
npm run buyer:build

# 预览买家端生产版本
npm run buyer:preview
```

## 启动说明

详细的启动命令说明和部署流程请参考：

- [WeDrawOS启动说明](./START.md) - 包含完整的启动命令、环境配置和部署指南

## AI服务配置

### 本地AI模型

系统默认集成node-llama-cpp库，支持在本地运行AI模型提供智能回复。AI模型文件位于：

```
src/api/ai-service/models/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf
```

### AI智能助手访问

在管理端界面右上角，点击消息图标即可打开AI智能助手对话框，可直接与AI助手进行交互或选择预设问题获取帮助。

## API文档

项目提供完整的API文档，支持在线调试：

- **WeDraw文档风格API**：http://localhost:3000/api/wedraw-docs (唯一API文档入口)
- **API文档JSON**：http://localhost:3000/api/wedraw-docs/json
- **健康检查**：http://localhost:3000/api/health

## 项目操作文档

详细的系统操作指南请参考项目操作文档：

- [WeDrawOS操作文档](./OPERATION_GUIDE.md) - 包含完整的使用说明、开发流程和故障排查指南

## 安全与最佳实践

- 使用JWT进行身份认证和授权
- 实现请求限流，防止恶意请求
- 密码加密存储（bcrypt）
- 输入验证和参数清洗
- 跨域资源共享（CORS）配置
- 全面的错误处理和日志记录

## 许可证

此项目采用MIT许可证 - 详见LICENSE文件

## 贡献指南

欢迎提交Issue和Pull Request！请确保遵循项目的代码规范和提交信息格式。

## 联系方式

如有任何问题或建议，请通过以下方式联系我们：

- 项目邮箱：[team@wedraw.com](mailto:team@wedraw.com)
- 开发团队：WeDraw Team
