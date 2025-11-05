# WeDrawOS 启动说明

## 开发模式

### 启动单个服务

- **启动API服务**: `npm run dev`
  - 服务地址: http://localhost:3000
  - 使用nodemon实现热重载

- **启动管理端**: `npm run admin:dev`
  - 服务地址: http://localhost:3001
  - API代理到 http://localhost:3000

- **启动买家端**: `npm run buyer:dev`
  - 服务地址: http://localhost:3002
  - API代理到 http://localhost:3000

### 一键启动所有服务

- **同时启动API、管理端和买家端**: `npm run dev:all`
  - 使用concurrently同时运行三个服务
  - 适用于全栈开发场景

## 生产模式

### 构建并启动

- **构建并启动API服务**: `npm run start:prod`
  - 首先执行构建脚本，将所有项目编译打包到dist目录
  - 然后启动生产环境的API服务

### 部署流程

1. **执行构建**: `npm run build`
   - 构建脚本会:
     - 清理并创建dist目录
     - 编译前端项目(admin和buyer)，使用vite进行压缩优化
     - 复制API代码到对应目录
     - 复制必要的配置文件
     - 创建日志和上传目录

2. **配置静态服务器**:
   - 管理端静态文件: `dist/admin`
   - 买家端静态文件: `dist/buyer`
   - 推荐使用Nginx或Apache配置静态资源服务

3. **启动API服务**:
   - 可以使用PM2等进程管理工具: `pm2 start dist/api/index.js`
   - 或直接使用: `npm start`

## 环境变量配置

请确保在根目录创建了`.env`文件，配置必要的环境变量，可参考`.env.example`文件。

## 数据库初始化

首次运行前，请执行数据库初始化:

```bash
npm run db:reset
```

这将创建数据库表并初始化基础数据。