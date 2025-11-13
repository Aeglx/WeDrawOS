# WeDrawOS 架构优化与 Vite 部署方案

## 目标

- 统一后端入口与文档，消除重复与冲突。
- 前端（管理端与买家端）使用 `vite build` 直接输出至根目录 `dist/` 下的独立子目录。
- 每个子项目可单独编译与独立部署在不同服务器，前后端跨域互通。
- 后端使用编译/压缩（例如 esbuild）生成可部署产物，减少体积并提升加载效率。

## 实施总览

- 修改起点（具体文件与位置）
  
  - 统一路由注册：`src/api/index.js:579-611`
  - 后端启动日志与文档地址：`src/api/index.js:644-651`
  - 管理端登录路由注释与实际路径：`src/api/admin-api/routes/adminRoutes.js:12-40`
  - 鉴权对会话的依赖：`src/api/middleware/auth.js:68-121`
  - 文档入口设置：`src/api/core/docs/swaggerConfig.js:428-477`
  - 管理端 Vite 配置：`src/admin/vite.config.js:6-27`
  - 买家端 Vite 配置：`src/buyer/vite.config.js:6-27`
  - 管理端登录页 API 基础地址：`src/admin/src/pages/Login.jsx:16-27`
  - 构建编排（如需）：`build.js:140-185`

- 分阶段步骤（如何修改）
  
  - 阶段 1｜统一后端入口与路由注册
    - 在 `src/api/index.js:579-611` 改为按模块调用 `register(app)` 或 `initialize(app)`，不要从 `./{dir}/routes` 强制返回 `router`。
    - 保留并主用 `src/api/index.js:644-651` 的单一启动与文档输出，避免与 `app.js` 并行启动产生冲突。
  - 阶段 2｜统一文档入口与注释路径
    - 在 `src/api/core/docs/swaggerConfig.js:428-477` 统一文档入口为 `/api/docs`。
    - 校正管理端登录等注释路径，使其与实际路由一致：`/api/admin/admins/login`（参考 `src/api/admin-api/routes/adminRoutes.js:12-40`）。
  - 阶段 3｜鉴权中间件短期修复
    - 在 `src/api/middleware/auth.js:91-121` 移除对 `db.models.Session` 的强依赖，改为 JWT 验证后查询 `db.models.User` 校验状态（active/禁用）。
    - 可选：后续新增 `Session` 模型并在登录/登出/刷新令牌路径维护会话。
  - 阶段 4｜前端 Vite 构建输出与跨域
    - 管理端 `src/admin/vite.config.js:6-27` 设置 `build.outDir = path.resolve(__dirname, '../../dist/admin')`，保留 `/api` 前缀代理，取消路径重写。
    - 买家端 `src/buyer/vite.config.js:6-27` 设置 `build.outDir = path.resolve(__dirname, '../../dist/buyer')`，同样保留前缀与取消重写。
    - 在 `src/admin/src/pages/Login.jsx:16-27` 使用 `import.meta.env.VITE_API_BASE` 拼接接口地址，避免硬编码。
  - 阶段 5｜后端编译与压缩
    - 使用构建器（如 `esbuild`）对 `src/api/index.js` 进行 `bundle/minify/sourcemap`，输出 `dist/api/index.js`，目标 `node18`。
    - 部署端执行 `npm ci --production` 或在打包阶段保留生产依赖。
  - 阶段 6｜新增“卖家端”前端（与管理端同架构）
    - 新建 `src/seller` 子项目，使用 React+Vite+Ant Design，输出到 `dist/seller`。
    - 目录结构与脚本：`vite.config.js`（`outDir` 指向根 `dist/seller`）、`src/main.jsx`、`src/App.jsx`、`src/pages/*`（仅商城管理：商品/分类/订单/库存/活动）、`src/services/api.js`（读取 `VITE_API_BASE`）。
    - 在根 `package.json` 增加 `seller:dev/build/preview` 脚本。

- 阶段 7｜依赖与模型统一（中期）
  
  - 升级 `sequelize` 至 v6 并回归；在两套数据访问层中选择一个作为主实现并统一模型注册。

## 卖家端前端初始化（与管理端一致架构）

- 目录结构（建议）
  
  - `src/seller/`
    - `vite.config.js`（`build.outDir = path.resolve(__dirname, '../../dist/seller')`，保留 `/api` 代理前缀）
    - `src/main.jsx`（应用入口）
    - `src/App.jsx`（布局与路由容器）
    - `src/router/index.jsx`（React Router 6，含登录守卫与鉴权）
    - `src/services/api.js`（Axios 封装，`baseURL = import.meta.env.VITE_API_BASE`）
    - `src/components/`（`Layout`, `Header`, `Sidebar`, `Table`, `Form`, `Uploader`, `Chart`）
    - `src/pages/`
      - `Login.jsx`（账号密码登录/验证码登录/忘记密码入口）
      - `Dashboard.jsx`（统计概览、图表、快捷入口）
      - `Products.jsx`（列表、筛选、批量操作）
      - `ProductEdit.jsx`（创建/编辑，主图/详情图、富文本）
      - `Categories.jsx`（分类树管理）
      - `Orders.jsx`（订单列表、筛选）
      - `OrderDetail.jsx`（订单详情、发货）
      - `Refunds.jsx`（售后/退款处理）
      - `Inventory.jsx`（SKU 与库存调整、预警）
      - `Promotions.jsx`（活动/优惠券）
      - `ShopSettings.jsx`（店铺信息、Logo/横幅、公告）

- 依赖与脚本（根级 `package.json` 增加）
  
  - 脚本：
    - `seller:dev`: `cd src/seller && vite`
    - `seller:build`: `cd src/seller && vite build`
    - `seller:preview`: `cd src/seller && vite preview`
  - 环境变量：
    - `VITE_API_BASE=https://api.example.com/api`
    - 如部署在子路径，设置 `base: '/seller/'` 并在路由中使用 `basename`。

- Vite 配置要点（与管理端一致）
  
  - 输出目录：`build.outDir = path.resolve(__dirname, '../../dist/seller')`
  - 构建选项：`assetsDir='assets'`, `sourcemap=false`, `minify='esbuild'`, `target='es2018'`
  - 开发代理：保留 `/api` 前缀指向 `http://localhost:3000`，不做 `rewrite`

- 登录页交互（参考商家后台通用形态）
  
  - 支持账号密码登录、验证码登录与忘记密码入口
  - 登录成功保存 token 与用户信息，跳转至仪表盘

## 卖家端接口映射（与现有后端对齐）

- 统一前缀：所有卖家端接口统一为 `'/api/seller'`
  
  - 模块注册：`src/api/seller-api/index.js:12-46`
  - 店铺模块注册：`src/api/seller-api/seller/index.js:12-16`
  - 商品模块注册：`src/api/seller-api/product/index.js:12-16`

- 账户与店铺
  
  - `POST /api/seller/login`（卖家登录）参照：`src/api/seller-api/routes/sellerRoutes.js:49-75`
  - `GET /api/seller/profile`（卖家信息）参照：`src/api/seller-api/routes/sellerRoutes.js:91-103`
  - `GET /api/seller/shop/info`（店铺信息）参照：`src/api/seller-api/seller/routes/sellerRoutes.js:29-37`
  - `PUT /api/seller/shop/info`（更新店铺信息）参照：`src/api/seller-api/seller/routes/sellerRoutes.js:51-...`

- 商品管理
  
  - `GET /api/seller/products`（查询列表）
  - `POST /api/seller/products`（创建）
  - `PUT /api/seller/products/{id}`（更新）参照：`src/api/seller-api/product/routes/productRoutes.js:164-214`
  - `DELETE /api/seller/products/{id}`（删除/下架）
  - 补充：图片上传、富文本详情、批量导入

- 订单与退款
  
  - `GET /api/seller/orders`、`GET /api/seller/orders/{id}`（详情）
  - `POST /api/seller/orders/{id}/deliver`（发货）
  - `GET /api/seller/refunds`、`POST /api/seller/refunds/{id}/approve|reject`（售后处理）

- 库存与分类
  
  - `GET /api/seller/inventory`、`PUT /api/seller/inventory/{skuId}`（库存调整）
  - `GET/POST/PUT/DELETE /api/seller/categories/*`（分类管理）

- 营销/促销
  
  - `GET /api/seller/promotions`、`POST /api/seller/promotions`、`PUT /api/seller/promotions/{id}`

## 路由与文档统一变更清单

- 统一文档入口：仅保留 `/api/docs`（`src/api/core/docs/swaggerConfig.js:428-477`）
- 将所有卖家端 Swagger 注释从 `/seller-api/*` 迁移为 `/api/seller/*`：
  - 登录与账户：`src/api/seller-api/routes/sellerRoutes.js:1-203`（路径项）
  - 店铺管理：`src/api/seller-api/seller/routes/sellerRoutes.js:1-242`（标签与路径项）
  - 商品管理：`src/api/seller-api/product/routes/productRoutes.js:164-214`（路径项）
- 后端入口统一：在 `src/api/index.js:579-611` 使用模块自注册（`register(app)`/`initialize(app)`），避免从 `./{dir}/routes` 返回 `router` 的假设。

## 开发步骤（端到端连贯）

1. 后端统一
   
   - 在 `src/api/index.js:579-611` 切换为模块自注册；确认 `src/api/index.js:644-651` 启动与日志一致。
   - 文档统一到 `/api/docs`（`src/api/core/docs/swaggerConfig.js:428-477`）。
   - 同步卖家端注释路径到 `/api/seller/*`（见“路由与文档统一变更清单”）。

2. 鉴权与配置
   
   - 卖家端接口应用卖家鉴权（JWT + 角色 `seller`）；短期移除 `Session` 强依赖（`src/api/middleware/auth.js:91-121`）。
   - 启用 CORS 白名单以允许前端域；如有 WebSocket，校验 `Origin`。

3. 前端输出（管理端/买家端/卖家端）
   
   - 管理端与买家端 `vite.config.js`：`build.outDir` 指向根 `dist/admin`、`dist/buyer`；保留 `/api` 代理前缀。
   - 新建卖家端工程：`src/seller`，`vite.config.js` 输出 `dist/seller`；脚本 `seller:dev/build/preview`。
   - 统一通过 `VITE_API_BASE` 访问后端 API（组件中严禁硬编码 `/api/*`）。

4. 页面里程碑
   
   - 里程碑 1（登录+仪表盘）：`/api/seller/login`, `/api/seller/profile`, 统计接口。
   - 里程碑 2（商品管理）：商品 CRUD + 图片上传 + 富文本详情。
   - 里程碑 3（订单/退款）：列表、详情、发货与售后流程。
   - 里程碑 4（库存/分类）：SKU 与库存调整、分类树。
   - 里程碑 5（促销/店铺设置）：活动/优惠券、店铺信息与装修。

5. 构建与部署
   
   - 前端执行 `seller:build`/`admin:build`/`buyer:build`，产物分别在 `dist/seller|admin|buyer`。
   - 后端使用 `esbuild` 打包到 `dist/api/index.js`；部署端执行生产依赖安装。
   - 独立服务器或 CDN 托管静态站点，API 部署到 `api.example.com`；前端通过 `VITE_API_BASE` 跨域访问。

6. 验证与收敛
   
   - 文档 `/api/docs` 可访问，路径与真实路由一致。
   - 前端三端产物均指纹化与压缩；后端可运行且日志唯一。
   - 鉴权在无 `Session` 模型时可用；后续补会话模型与刷新令牌。

## 总体策略

- 前端：管理端与买家端分别构建到 `dist/admin` 与 `dist/buyer`；通过环境变量 `VITE_API_BASE` 指定后端 API 基础地址，支持跨域和多服务器部署。
- 后端：统一使用 `src/api/index.js` 作为唯一入口，路由采用模块自注册；统一 Swagger 文档入口 `/api/docs`；使用构建器进行编译与压缩并输出到 `dist/api`。
- 构建编排：根级 orchestrator 依次清理输出目录、构建每个子项目、生成后端产物并准备必要资源。

## 前端（管理端/买家端）

- 构建输出
  - 管理端：在 `src/admin/vite.config.js` 设置 `build.outDir = path.resolve(__dirname, '../../dist/admin')`。
  - 买家端：在 `src/buyer/vite.config.js` 设置 `build.outDir = path.resolve(__dirname, '../../dist/buyer')`。
  - 推荐的其他构建选项：
    - `build.assetsDir = 'assets'`
    - `build.sourcemap = false`
    - `build.minify = 'esbuild'`
    - `build.target = 'es2018'`
- 基础路径（可选）
  - 若部署在子路径：管理端设置 `base: '/admin/'`，买家端设置 `base: '/buyer/'`；路由层使用 `basename` 适配。
  - 若部署在根路径：`base: '/'` 即可。
- API 地址配置
  - 在 `.env` 或构建环境中设置 `VITE_API_BASE`：
    - 管理端示例：`VITE_API_BASE=https://api.example.com/api`
    - 买家端示例：`VITE_API_BASE=https://api.example.com/api`
  - 页面中读取 `import.meta.env.VITE_API_BASE` 并拼接接口路径。例如登录提交：
    - 位置参考：`src/admin/src/pages/Login.jsx:16-27`
- 开发代理
  - 保留 `/api` 前缀与后端一致，不使用路径重写。参考：
    - 管理端：`src/admin/vite.config.js:11-16`
    - 买家端：`src/buyer/vite.config.js:11-16`
- 构建命令
  - 管理端：`npm run admin:build`
  - 买家端：`npm run buyer:build`
  - 执行后产物将直接生成至根目录 `dist/admin` 与 `dist/buyer`。

## 后端

- 统一入口
  - 使用 `src/api/index.js` 作为唯一后端入口（`package.json:5-11` 指向该入口）。
  - 路由注册采用模块自注册（`register(app)`/`initialize(app)`）：
    - 管理端：`src/api/admin-api/index.js:13-65`
    - 买家端：`src/api/buyer-api/index.js:21-35`
    - 卖家端：`src/api/seller-api/index.js:12-46`
- Swagger 文档统一
  - 使用 `/api/docs` 作为唯一文档入口，参考：`src/api/core/docs/swaggerConfig.js:428-477`。
  - 同步注释路径与实际路由。例如管理端登录应标注 `/api/admin/admins/login`（参考 `src/api/admin-api/routes/adminRoutes.js:12-40`）。
- 鉴权与模型
  - 当前 `requireAuth` 中依赖不存在的 `Session` 模型（`src/api/middleware/auth.js:91-99`）。短期方案：改为 JWT 验证 + 用户状态校验；中期方案：实现 `Session` 模型并在登录/登出/刷新中维护。
- 编译与压缩
  - 使用 `esbuild`：
    - 入口：`src/api/index.js`
    - 目标：`platform: 'node'`，`target: 'node18'`
    - 选项：`bundle: true`，`minify: true`，`sourcemap: true`
    - 输出：`dist/api/index.js`
  - 保留生产依赖或在部署端执行 `npm ci --production`。
- CORS 与 WebSocket 跨域
  - CORS：从配置读取白名单域名，允许管理端与买家端来源。参考中间件：`src/api/middleware/auth.js:436-447`。
  - WebSocket：在握手阶段校验 `Origin` 并允许前端域名。

## 多服务器部署拓扑

- 推荐部署拓扑：
  - 管理端静态：`admin.example.com`（托管 `dist/admin`）
  - 买家端静态：`buyer.example.com`（托管 `dist/buyer`）
  - API：`api.example.com`（运行 `node dist/api/index.js`）
  - 可选：WebSocket 推送服务、消息队列与缓存（Redis/RabbitMQ）独立机器或托管服务
- 前端通过 `VITE_API_BASE` 指向后端：
  - 管理端 `.env`：`VITE_API_BASE=https://api.example.com/api`
  - 买家端 `.env`：`VITE_API_BASE=https://api.example.com/api`
- 静态资源与缓存：
  - 建议 CDN 长缓存静态资源、短缓存 `index.html`；按需生成 `gzip/brotli` 预压缩文件。

## 根级构建编排（示例流程）

1. 清理输出目录：删除并重建 `dist/`。
2. 前端构建：在各自子目录执行 `vite build`，产物直接输出至 `dist/admin` 与 `dist/buyer`。
3. 后端构建：使用 `esbuild` 打包 `src/api/index.js`，输出至 `dist/api` 并最小化。
4. 复制必要配置与静态资源：将后端运行所需的配置、模板、静态资源复制到 `dist/api`。
5. （可选）在 `dist/api` 执行 `npm ci --production`，准备部署依赖。

## 验证清单

- 启动后端：`node dist/api/index.js`，日志仅出现一套服务地址与文档入口（参考 `src/api/index.js:644-651`）。
- 路由验证：`POST /api/admin/admins/login` 命中 `src/api/admin-api/routes/adminRoutes.js:34-40`。
- 文档验证：访问 `/api/docs`，文档路径与真实路由一致（`src/api/core/docs/swaggerConfig.js:428-477`）。
- 构建产物：存在 `dist/admin` 与 `dist/buyer`，并具备指纹化与压缩；`dist/api/index.js` 可执行。

## 风险与后续

- Sequelize 版本不匹配（`package.json:61-63` 使用旧版本，代码使用 v6 API）：建议升级至 `^6.37.0` 并做兼容性检查。
- 两套数据访问层并存（`src/api/models/index.js` 与 `src/api/core/data-access/database/db.js`）：需要选择其一作为主实现并统一模型注册。
- 鉴权的 `Session` 模型：短期以 JWT + 用户状态运行，后续补充会话管理与刷新令牌流程。
- Swagger 注释同步：逐步校准注释路径，确保文档可检索与路由匹配。

## 后续工作建议

- 路由注册统一：在 `src/api/index.js` 统一调用各模块 `register(app)` 或 `initialize(app)`。
- 文档统一：仅保留 `/api/docs`，将 WeDraw 风格作为主题或别名入口，避免重复。
- 前端 API 地址统一：组件内使用 `VITE_API_BASE`，避免硬编码路径；公共请求封装读取该变量。
- 部署脚本完善：在 CI/CD 中添加构建、产物打包与分发步骤，按项目维度进行发布。