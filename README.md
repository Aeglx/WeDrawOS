# WeDrawOS - 模块化电商系统

## 项目介绍

- WeDrawOS 是一套多端协同的模块化电商系统，包含买家端、卖家端、管理端与后端 API，支持即时通讯与本地 AI 助手。
- 采用前后端分离、统一依赖与统一构建输出的工程策略，便于开发、构建与部署的一体化管理。
- 通过统一命令实现一键开发、构建与生产启动；AI 模型自动检测与下载在后台并行执行，长时间下载不影响项目启动与联调。

## 功能总览

- 买家端：商品浏览/搜索、购物车、订单、支付、个人中心。
- 卖家端：商品管理、订单处理、营销活动、销售数据分析。
- 管理端：用户与权限管理、内容运营、数据统计、系统配置。
- 即时通讯：在线客服与消息推送，WebSocket 通道。
- AI 助手：内置本地模型的智能问答与使用指导，支持健康检查与模拟回复模式。

## 构建结构与策略

- 统一依赖：所有子项目共用根目录依赖库 `d:\WeDrawOS\node_modules`（Vite 的 `resolve.modules` 定向至根）。
- 统一构建输出：所有产物编译至根目录 `d:\WeDrawOS\dist`，按子项目分目录：
  - `dist/admin`、`dist/buyer`、`dist/seller`、`dist/api`
- 仅编译打包：不进行文件移动/复制操作，避免产物与源码混杂。

## 技术栈

- 后端：Node.js、Express、Sequelize（MySQL）、Redis、JWT、WebSocket、AMQP。
- 前端：React 18、Ant Design 5、React Router 6、Axios、Vite。
- 文档与工具：Swagger、dotenv、concurrently。

## 目录结构

```
WeDrawOS/
├── dist/                  # 统一构建产物根目录
│   ├── admin/             # 管理端打包产物
│   ├── buyer/             # 买家端打包产物
│   ├── seller/            # 卖家端打包产物
│   └── api/               # 后端打包产物
├── node_modules/          # 统一依赖
├── src/
│   ├── admin/             # 管理端（Vite）
│   ├── buyer/             # 买家端（Vite）
│   ├── seller/            # 卖家端（Vite）
│   └── api/               # 后端API（Express）
└── package.json           # 脚本入口与统一命令
```

## 端口与代理

- 后端 API：`3000`（固定，所有前端通过 `/api` 代理到此端口）
- 管理端开发端口：`ADMIN_PORT=6000`（固定，严格端口）
- 买家端开发端口：`BUYER_PORT=4000`（固定，严格端口）
- 卖家端开发端口：`SELLER_PORT=5000`（固定，严格端口）

## 安装与环境

- Node.js ≥ 14（建议 ≥ 18）
- MySQL ≥ 5.7、Redis ≥ 6.0
- 安装依赖：`npm install`
- 配置环境：基于 `.env.example` 创建 `.env`，设置数据库、端口与 AI 配置。
- 初始化数据库：`npm run db:reset`（包含迁移与数据种子）。

## 一键命令

- 开发（并行启动 API/Admin/Buyer/Seller，并异步准备 AI）
  - `npm run dev:all`
- 构建（Admin/Buyer/Seller + 后端）
  - `npm run build:all`
- 生产（构建后并行启动 API 与前端预览，并异步准备 AI）
  - `npm run prod:all`

说明：AI 模型检测/下载采用软模式并行执行（`AI_PREPARE_SOFT=1`），下载时间较长但不影响项目启动；如需单独准备模型可执行 `npm run prepare:ai`。

### 端口清理命令（Windows）

- 清理 API 端口：`npm run port:kill:3000`
- 清理买家端端口：`npm run port:kill:4000`
- 清理卖家端端口：`npm run port:kill:5000`
- 清理管理端端口：`npm run port:kill:6000`
- 一键清理全部：`npm run port:kill:all`

## 开发要点与约定

- 单一 API 实例监听 `3000`，端口固定且禁止变更；若占用请先执行端口清理命令。
- 子项目通过 `resolve.modules` 指向根目录 `node_modules`，统一版本与依赖解析。
- 构建输出在各自 `vite.config.js` 中显式设置至 `../../dist/<子项目>`（避免本地 `dist` 杂散目录）。

## AI 模型

- 默认模型：TinyLlama GGUF（约 1GB）；路径可由 `AI_MODEL_PATH` 指定，默认位于 `src/api/ai-service/models/`。
- 并行准备：在 `dev:all`、`prod:all` 命令中后台并行下载，失败不阻塞（软模式）。
- 健康检查与模拟：在模型未就绪时提供模拟回复模式，确保联调不受阻。

## 常见问题

- 端口占用 `EADDRINUSE`：确保仅运行一个 API 实例；使用端口清理命令释放被占用端口（例如 `npm run port:kill:3000`）。
- 模型下载缓慢：属正常，建议保持后台执行；也可手动下载并置于 `AI_MODEL_PATH`。
- 依赖解析失败：确认各子项目 `resolve.modules` 包含根目录 `node_modules`。

## 部署与预览

- 生产启动：`npm run start:prod`（仅后端生产）或 `npm run prod:all`（含前端预览）。
- 产物路径：统一位于 `d:\WeDrawOS\dist` 下的各子目录，适合 Nginx/静态服务器指向使用。

## 安全与最佳实践

- 使用 JWT 进行认证与授权；开启 CORS 控制跨域。
- 输入校验、错误处理与日志记录；合理的限流与资源释放。

## 维护与支持

- 欢迎反馈与贡献，建议遵循统一依赖与统一构建的工程约定。
