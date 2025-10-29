# WeDrawOS 操作文档

## 目录

- [1. 项目概述](#1-项目概述)
- [2. 系统架构](#2-系统架构)
- [3. 环境配置](#3-环境配置)
- [4. 开发流程](#4-开发流程)
- [5. API接口文档](#5-api接口文档)
- [6. 功能模块说明](#6-功能模块说明)
- [7. 常见问题](#7-常见问题)
- [8. 故障排查](#8-故障排查)

## 1. 项目概述

WeDrawOS是一个集成了多角色系统、微信生态集成和AI智能助手的综合操作系统，旨在为开发者提供强大的API和服务支持。

### 1.1 核心功能

- **多角色系统**：支持管理员、卖家、买家等多种角色
- **微信生态集成**：提供微信相关功能和接口
- **AI智能助手**：集成AI服务，提供智能交互和数据分析
- **完整的API文档**：提供详细的API接口说明和调试功能

## 2. 系统架构

### 2.1 技术栈

- **前端**：React、Vue.js
- **后端**：Node.js
- **数据库**：MongoDB/MySQL
- **中间件**：Express.js
- **API文档**：Swagger（Wedraw文档风格）

### 2.2 项目结构

```
├── src/
│   ├── api/          # 后端API服务
│   ├── admin/        # 管理员前端
│   ├── buyer/        # 买家前端
│   ├── frontend/     # 通用前端组件
│   ├── config/       # 配置文件
│   └── utils/        # 工具函数
├── uploads/          # 上传文件目录
├── README.md         # 项目说明文档
└── package.json      # 项目依赖配置
```

## 3. 环境配置

### 3.1 安装依赖

```bash
# 安装项目依赖
npm install

# 启动开发服务器
npm run dev
```

### 3.2 配置文件

项目根目录下的`.env.example`文件提供了环境变量示例。复制该文件并重命名为`.env`，然后根据实际情况修改配置：

```bash
# 复制环境变量示例文件
copy .env.example .env
```

### 3.3 端口配置

默认端口配置：
- API服务器：3000
- 前端开发服务器：根据各模块配置

## 4. 开发流程

### 4.1 启动API服务器

```bash
# 启动API服务器
node src/api/index.js

# 或者使用npm脚本
npm run dev
```

### 4.2 开发环境

- **API文档**：http://localhost:3000/api/wedraw-docs
- **健康检查**：http://localhost:3000/api/health
- **AI服务**：http://localhost:3000/api/ai

## 5. API接口文档

系统提供了完整的API文档，支持在线调试：

- **WeDraw文档风格API**：http://localhost:3000/api/wedraw-docs (唯一API文档入口)
- **API文档JSON**：http://localhost:3000/api/wedraw-docs/json
- **健康检查**：http://localhost:3000/api/health

### 5.1 访问文档

1. 确保API服务器已启动
2. 打开浏览器，访问 http://localhost:3000/api/wedraw-docs
3. 在文档页面可以查看所有可用的API接口、参数说明和返回格式
4. 支持在线调试功能，可以直接在浏览器中测试API

## 6. 功能模块说明

### 6.1 AI服务

AI服务路由注册在 `/api/ai` 路径，提供智能交互和数据分析功能。

### 6.2 多角色系统

- **管理员**：拥有最高权限，可管理所有用户和内容
- **卖家**：可管理商品、订单和客户信息
- **买家**：可浏览商品、下单和管理个人信息

### 6.3 微信集成

项目支持微信企业号集成，相关配置位于 `src/config/wechatWorkConfig.js`。

## 7. 常见问题

### 7.1 API服务器启动失败

- 检查端口是否被占用
- 检查环境变量配置是否正确
- 检查依赖是否安装完整

### 7.2 文档访问问题

- 确保API服务器已启动
- 访问正确的文档地址：http://localhost:3000/api/wedraw-docs
- 检查浏览器控制台是否有错误信息

## 8. 故障排查

### 8.1 端口占用问题

如果遇到端口占用错误（EADDRINUSE），可以使用以下命令查看占用端口的进程：

```bash
# Windows系统
netstat -ano | findstr :3000

# 或者使用PowerShell
Get-NetTCPConnection -LocalPort 3000 | Select-Object LocalAddress,LocalPort,OwningProcess
```

### 8.2 日志查看

API服务器启动后，会输出详细的日志信息，包括：
- 服务启动状态
- 路由注册情况
- 错误信息

通过查看日志可以快速定位问题所在。

### 8.3 健康检查

通过访问 `/api/health` 接口可以检查系统的运行状态。

---

本文档由WeDrawOS项目自动生成，最后更新时间：2025-10-29