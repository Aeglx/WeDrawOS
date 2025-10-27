# AI模型服务部署与使用指南

本文档提供了在WeDrawOS项目中部署和使用本地AI模型服务的完整指南。

## 目录结构

```
src/api/ai-service/
├── aiModelService.js    # AI模型服务核心类
├── aiController.js      # AI服务控制器
├── aiRoutes.js          # AI服务路由配置
├── test-ai-service.js   # 测试脚本
├── README.md            # 部署说明（本文档）
└── models/
    └── README.md        # 模型下载说明
```

## 环境要求

- Node.js >= 14.0.0
- 系统内存 >= 8GB（推荐）
- CPU: Intel i5 6代或更高
- 磁盘空间: >= 2GB（用于模型文件）

## 部署步骤

### 1. 安装依赖

确保已安装项目依赖和AI服务特定依赖：

```bash
# 在项目根目录执行
npm install --save node-llama-cpp
```

### 2. 下载AI模型

**重要：** 您需要手动下载TinyLlama模型文件。由于文件较大（约1GB），不包含在代码仓库中。

1. 访问Hugging Face下载页面：
   [TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF](https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF)

2. 下载推荐的量化版本：
   - 文件：`tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf`
   - 大小：约1GB
   - 量化级别：4-bit（平衡性能和内存占用）

3. 将下载的模型文件放置到以下目录：
   ```
   e:/WeDrawOS/src/api/ai-service/models/
   ```

### 3. 配置环境变量

环境变量已在项目根目录的`.env`文件中配置：

```
# AI模型配置
AI_MODEL_PATH=./src/api/ai-service/models/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf
AI_MODEL_CONTEXT_SIZE=512
AI_MODEL_THREADS=2
AI_MODEL_MAX_TOKENS=256
AI_MODEL_TEMPERATURE=0.7
AI_ENABLED=true
AI_CACHE_ENABLED=true
AI_CACHE_TTL=3600000
```

**配置说明：**
- `AI_MODEL_PATH`: 模型文件路径
- `AI_MODEL_CONTEXT_SIZE`: 上下文窗口大小（512 tokens，适合轻量级应用）
- `AI_MODEL_THREADS`: 使用的CPU线程数（2线程，适合6代i5）
- `AI_MODEL_MAX_TOKENS`: 最大生成token数
- `AI_MODEL_TEMPERATURE`: 生成文本的随机性（0.7为中等随机性）
- `AI_ENABLED`: 是否启用AI服务
- `AI_CACHE_ENABLED`: 是否启用请求缓存
- `AI_CACHE_TTL`: 缓存有效期（毫秒）

### 4. 启动项目

模型文件下载完成并配置好后，启动项目：

```bash
# 在项目根目录执行
npm start
```

AI服务将作为项目的一部分自动启动，并挂载到`/api/ai`路径下。

## API端点

### 1. 对话接口

**POST** `/api/ai/chat`

**请求体：**
```json
{
  "prompt": "你的问题或提示",
  "options": {
    "max_tokens": 256,
    "temperature": 0.7
  }
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "response": "AI生成的回复内容",
    "tokens": {
      "prompt": 约40,
      "completion": 约150
    }
  }
}
```

### 2. 健康检查

**GET** `/api/ai/health`

**响应：**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "modelLoaded": true,
    "memoryUsage": "1.2GB",
    "uptime": "5m 30s"
  }
}
```

### 3. 手动初始化模型

**POST** `/api/ai/initialize`

**响应：**
```json
{
  "success": true,
  "message": "模型初始化成功"
}
```

### 4. 释放模型资源

**POST** `/api/ai/release`

**响应：**
```json
{
  "success": true,
  "message": "模型资源已释放"
}
```

## 测试AI服务

项目包含一个测试脚本，用于验证AI服务功能：

```bash
# 安装测试依赖
npm install axios

# 运行测试脚本
cd src/api/ai-service
node test-ai-service.js
```

## 性能优化建议

1. **内存管理**：
   - 服务会自动检测系统内存，在内存不足时释放模型
   - 可以通过调整`AI_MODEL_THREADS`来控制CPU使用率

2. **缓存机制**：
   - 启用`AI_CACHE_ENABLED`可缓存常见请求，提高响应速度
   - 调整`AI_CACHE_TTL`可控制缓存有效期

3. **上下文窗口**：
   - 当前设置为`512` tokens，适合轻量级应用
   - 如需处理更长文本，可适当增加，但会增加内存占用

## 故障排除

1. **模型加载失败**：
   - 检查模型文件路径是否正确
   - 确认模型文件已完整下载
   - 检查系统内存是否充足

2. **响应缓慢**：
   - 减少`AI_MODEL_CONTEXT_SIZE`
   - 减少`AI_MODEL_THREADS`
   - 增加`AI_CACHE_ENABLED`缓存

3. **内存不足错误**：
   - 确保系统有足够的可用内存（至少2GB空闲）
   - 调整.env文件中的配置参数

## 注意事项

1. **首次启动**：
   - 首次加载模型可能需要30-60秒，请耐心等待
   - 之后的请求将更快响应

2. **资源占用**：
   - 模型加载后占用约1.2-1.5GB内存
   - 生成文本时会使用配置的CPU线程

3. **生产环境建议**：
   - 监控系统资源使用情况
   - 考虑增加服务器内存以获得更好性能
   - 实施请求限流机制

4. **模型性能**：
   - TinyLlama是轻量级模型，适合基本问答和简单生成任务
   - 对于复杂任务，可考虑使用更大的模型（但需要更多资源）

## 联系与支持

如有任何问题或需要帮助，请联系项目维护团队。