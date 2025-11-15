/**
 * WeDrawOS API服务入口文件
 */

console.log('========================================');
console.log('WeDraw API服务器启动中...');
console.log('========================================');

// 捕获所有可能导致进程退出的错误
process.on('unhandledRejection', (reason) => {
  console.error('❌ 未处理的Promise拒绝:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ 未捕获的异常:', error);
  console.log('🟢 进程将继续运行，不会退出');
});

// 强制保持进程运行的关键措施
process.stdin.resume();

// 加载环境变量
require('dotenv').config();

// 使用Express框架
const express = require('express');
const app = express();
const port = process.env.PORT || 3000; // 严格遵循README要求，使用3000端口
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const corsOrigins = (process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (!corsOrigins.length || corsOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// 中间件配置
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 统一在 registerApiRoutes 中注册 AI 路由

// 基本的Swagger配置
// setupBasicSwagger函数已移除，只使用Wedraw文档风格作为唯一的API文档入口

const { setupSwagger } = require('./core/docs/swaggerConfig');

// 扫描API路由函数
async function scanApiRoutes() {
  // API分类配置
  const apiCategories = {
    // 公共接口
    'common': {
      category: 'common',
      name: '公共接口',
      pathPatterns: ['/api/common', '/api/public', '/api/health', '/api/info'],
      description: '系统公共接口，无需特殊权限即可访问',
      apis: []
    },
    
    // 客户端相关
    'client': {
      category: 'client',
      name: '客户端接口',
      pathPatterns: ['/api/client', '/api/buyer', '/api/user'],
      description: '面向终端用户的接口，提供注册、登录、个人中心等功能',
      apis: []
    },
    
    // 商品相关
    'product': {
      category: 'product',
      name: '商品管理',
      pathPatterns: ['/api/product', '/api/goods', '/api/category'],
      description: '商品信息管理相关接口',
      apis: []
    },
    
    // 订单相关
    'order': {
      category: 'order',
      name: '订单管理',
      pathPatterns: ['/api/order', '/api/cart', '/api/payment'],
      description: '订单创建、查询、支付等相关接口',
      apis: []
    },
    
    // 物流相关
    'logistics': {
      category: 'logistics',
      name: '物流服务',
      pathPatterns: ['/api/logistics', '/api/delivery', '/api/shipping'],
      description: '物流信息查询、配送管理相关接口',
      apis: []
    },
    
    // 卖家端
    'seller': {
      category: 'seller',
      name: '卖家端接口',
      pathPatterns: ['/api/seller', '/api/vendor'],
      description: '卖家运营管理相关接口',
      apis: []
    },
    
    // 管理端
    'admin': {
      category: 'admin',
      name: '管理端接口',
      pathPatterns: ['/api/admin', '/api/management'],
      description: '系统管理、用户管理等后台接口',
      apis: []
    },
    
    // 客服系统
    'customer-service': {
      category: 'customer-service',
      name: '客服系统',
      pathPatterns: ['/api/customer', '/api/service', '/api/chat'],
      description: '客户服务、在线客服相关接口',
      apis: []
    },
    
    // 消息通知
    'message': {
      category: 'message',
      name: '消息通知',
      pathPatterns: ['/api/message', '/api/notification', '/api/alert'],
      description: '站内信、推送通知等接口',
      apis: []
    },
    
    // 客户反馈
    'feedback': {
      category: 'feedback',
      name: '客户反馈',
      pathPatterns: ['/api/feedback', '/api/complaint', '/api/suggestion'],
      description: '客户反馈、投诉建议相关接口',
      apis: []
    },
    
    // 系统调度
    'scheduler': {
      category: 'scheduler',
      name: '系统调度',
      pathPatterns: ['/api/scheduler', '/api/task', '/api/cron'],
      description: '系统定时任务、调度管理相关接口',
      apis: []
    },
    
    // 自动回复
    'auto-reply': {
      category: 'auto-reply',
      name: '自动回复',
      pathPatterns: ['/api/auto-reply', '/api/autoReply'],
      description: '自动回复规则配置相关接口',
      apis: []
    },
    
    // 未分类接口
    'uncategorized': {
      category: 'uncategorized',
      name: '未分类接口',
      pathPatterns: [],
      description: '尚未归类的接口',
      apis: []
    }
  };
  
  // 添加公共接口基础服务
  apiCategories['common'].apis = [
    {
      name: '服务器信息',
      method: 'GET',
      path: '/api',
      description: '获取API服务器信息',
      params: [],
      responseExample: `{\n  "name": "WeDrawOS Customer Service API",\n  "version": "1.0.0",\n  "description": "客服系统后端API接口服务",\n  "endpoints": {...}\n}`
    },
    {
      name: '健康检查',
      method: 'GET',
      path: '/api/health',
      description: '检查API服务健康状态',
      params: [],
      responseExample: `{\n  "status": "ok",\n  "timestamp": "2024-01-01T00:00:00.000Z",\n  "service": "WeDrawOS Customer Service API"\n}`
    },
    {
      name: '服务信息',
      method: 'GET',
      path: '/api/info',
      description: '获取服务详细信息',
      params: [],
      responseExample: `{\n  "name": "WeDrawOS Customer Service API",\n  "version": "1.0.0",\n  "description": "Customer service system API",\n  "status": "running",\n  "timestamp": "2024-01-01T00:00:00.000Z"\n}`
    },
    {
      name: 'API文档数据',
      method: 'GET',
      path: '/api-docs/data',
      description: '获取API文档的原始数据',
      params: [],
      responseExample: `{\n  "success": true,\n  "data": [...],\n  "timestamp": 1630000000000\n}`
    }
  ];
  
  // 扫描routes目录中的实际路由文件
  const routesDir = path.join(__dirname, 'routes');
  try {
    if (fs.existsSync(routesDir)) {
      const files = fs.readdirSync(routesDir).filter(file => file.endsWith('.js'));
      
      for (const file of files) {
        const filePath = path.join(routesDir, file);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        console.log(`正在扫描并解析路由文件: ${file}`);
        
        // 从文件中提取API信息
        const apis = extractApisFromFile(filePath, fileContent);
        
        // 对每个API进行分类
        for (const api of apis) {
          let categorized = false;
          
          // 根据API路径模式进行精确分类
          for (const [categoryKey, category] of Object.entries(apiCategories)) {
            if (categoryKey === 'uncategorized') continue; // 跳过未分类类别
            
            if (category.pathPatterns && Array.isArray(category.pathPatterns)) {
              for (const pattern of category.pathPatterns) {
                // 检查路径是否匹配该模式
                if (api.path.includes(pattern)) {
                  apiCategories[categoryKey].apis.push(api);
                  categorized = true;
                  break;
                }
              }
              if (categorized) break;
            }
          }
          
          // 如果没有匹配到任何分类，放入未分类
          if (!categorized) {
            // 处理系统默认接口
            if (api.path === '/' || api.path === '/health' || api.path.includes('/api/health') || api.path.includes('/api/info')) {
              apiCategories['common'].apis.push(api);
            } else {
              apiCategories['uncategorized'].apis.push(api);
            }
          }
        }
        
        console.log(`从 ${file} 提取了 ${apis.length} 个API接口`);
      }
    }
  } catch (error) {
    console.error('扫描路由文件时发生错误:', error.message);
  }
  
  // 转换为数组格式
  return Object.values(apiCategories);
}

// 解析Swagger注释的函数
function parseSwaggerComment(comment) {
  try {
    // 移除注释标记
    const cleanedComment = comment
      .replace(/\/\*\*|\*\//g, '')
      .replace(/^\s*\*/gm, '')
      .trim();
      
    // 增强版YAML解析
    let yamlData = {};
    let currentPath = null;
    let currentMethod = null;
    let currentParam = null;
    
    cleanedComment.split('\n').forEach(line => {
      line = line.trim();
      if (line.startsWith('/api/')) {
        // 路径行
        const pathMatch = line.match(/^(\/api\/[^:]+):$/);
        if (pathMatch) {
          currentPath = pathMatch[1];
          if (!yamlData.paths) yamlData.paths = {};
          yamlData.paths[currentPath] = {};
          currentMethod = null;
          currentParam = null;
        }
      } else if (currentPath && (line.startsWith('get:') || line.startsWith('post:') || line.startsWith('put:') || line.startsWith('delete:'))) {
        // HTTP方法
        currentMethod = line.split(':')[0];
        yamlData.paths[currentPath][currentMethod] = {
          summary: '',
          description: '',
          parameters: [],
          responses: {}
        };
        currentParam = null;
      } else if (currentPath && currentMethod) {
        // 处理路径下的属性
        if (line.startsWith('summary:')) {
          yamlData.paths[currentPath][currentMethod].summary = line.replace('summary:', '').trim();
        } else if (line.startsWith('description:')) {
          yamlData.paths[currentPath][currentMethod].description = line.replace('description:', '').trim();
        } else if (line.startsWith('tags:')) {
          yamlData.paths[currentPath][currentMethod].tags = line.replace('tags:', '').trim().replace(/\[|\]/g, '').split(',').map(tag => tag.trim());
        } else if (line.startsWith('- name:')) {
          // 开始新参数
          if (!yamlData.paths[currentPath][currentMethod].parameters) {
            yamlData.paths[currentPath][currentMethod].parameters = [];
          }
          const paramName = line.replace('- name:', '').trim();
          currentParam = { name: paramName };
          yamlData.paths[currentPath][currentMethod].parameters.push(currentParam);
        } else if (currentParam && line.startsWith('in:')) {
          currentParam.in = line.replace('in:', '').trim();
        } else if (currentParam && line.startsWith('type:')) {
          currentParam.type = line.replace('type:', '').trim();
        } else if (currentParam && line.startsWith('required:')) {
          currentParam.required = line.replace('required:', '').trim().toLowerCase() === 'true';
        } else if (currentParam && line.startsWith('description:')) {
          currentParam.description = line.replace('description:', '').trim();
        } else if (line.startsWith('responses:')) {
          // 响应信息开始
        } else if (line.match(/^\d+:/)) {
          // 响应状态码
          const statusCode = line.split(':')[0];
          yamlData.paths[currentPath][currentMethod].responses[statusCode] = {};
        }
      }
    });
    return yamlData;
  } catch (error) {
    console.error('解析Swagger注释失败:', error.message);
    return null;
  }
}

// 从路由文件中提取API信息
function extractApisFromFile(filePath, fileContent) {
  // 匹配Swagger注释块
  const swaggerRegex = /\/\*\*[\s\S]*?\*\//g;
  let match;
  const apiList = [];
  
  // 提取所有Swagger注释
  while ((match = swaggerRegex.exec(fileContent)) !== null) {
    const swaggerComment = match[0];
    const parsedData = parseSwaggerComment(swaggerComment);
    
    if (parsedData && parsedData.paths) {
      // 处理解析出的API信息
      for (const [path, methods] of Object.entries(parsedData.paths)) {
        for (const [method, details] of Object.entries(methods)) {
          // 转换参数格式
          const formattedParams = (details.parameters || []).map(param => ({
            name: param.name,
            type: param.type || 'string',
            required: param.required || false,
            description: param.description || '暂无描述'
          }));
          
          // 创建API对象
          const api = {
            name: details.summary || `未命名接口 (${method.toUpperCase()} ${path})`,
            method: method.toUpperCase(),
            path: path,
            description: details.description || details.summary || '暂无描述',
            params: formattedParams,
            requestExample: generateRequestExample(method, path, formattedParams),
            responseExample: generateResponseExample(method, path)
          };
          
          // 添加到列表
          apiList.push(api);
        }
      }
    }
  }
  
  // 从文件内容中匹配路由定义
  const routeRegex = /router\.(get|post|put|delete|patch)\(['"]([^'"]+)['"](?!\s*,\s*\{\s*next\s*:\s*true)/g;
  let routeMatch;
  
  while ((routeMatch = routeRegex.exec(fileContent)) !== null) {
    const routeMethod = routeMatch[1].toUpperCase();
    let routePath = routeMatch[2];
    
    // 添加/api前缀如果没有的话
    if (!routePath.startsWith('/api')) {
      routePath = '/api' + routePath;
    }
    
    // 检查是否已经在Swagger注释中提取
    const existingApi = apiList.find(api => api.method === routeMethod && api.path === routePath);
    
    if (!existingApi) {
      // 生成有意义的接口名称和描述
      let apiName = '';
      let apiDescription = '';
      
      // 根据路径生成更有意义的名称和描述
      if (routePath.includes('/health')) {
        apiName = '健康检查';
        apiDescription = '检查API服务健康状态，返回服务运行情况';
      } else if (routePath.includes('/info')) {
        apiName = '服务信息';
        apiDescription = '获取API服务的详细信息，包括版本、状态等';
      } else if (routePath.includes('/customer')) {
        apiName = '客户相关接口';
        apiDescription = '处理客户信息相关的操作';
      } else if (routePath.includes('/feedback')) {
        apiName = '客户反馈接口';
        apiDescription = '提交和管理客户反馈信息';
      } else if (routePath.includes('/auto-reply') || routePath.includes('/autoReply')) {
        apiName = '自动回复配置';
        apiDescription = '配置和管理自动回复规则';
      } else if (routePath.includes('/scheduler')) {
        apiName = '定时任务管理';
        apiDescription = '管理系统定时任务的执行和状态';
      } else {
        apiName = `接口 (${routeMethod} ${routePath})`;
        apiDescription = '提供系统功能的API接口';
      }
      
      // 添加没有Swagger注释的路由
      apiList.push({
        name: apiName,
        method: routeMethod,
        path: routePath,
        description: apiDescription,
        params: [],
        requestExample: generateRequestExample(routeMethod, routePath, []),
        responseExample: generateResponseExample(routeMethod, routePath)
      });
    }
  }
  
  return apiList;
}

// 生成请求示例
function generateRequestExample(method, path, params) {
  if (method === 'GET') {
    const queryParams = params
      .filter(p => p.in === 'query')
      .map(p => `${p.name}=${p.type === 'string' ? 'example' : '123'}`)
      .join('&');
      
    return `${method} ${path}${queryParams ? '?' + queryParams : ''}`;
  } else {
    const bodyParams = params
      .filter(p => p.in === 'body' || p.in === 'formData')
      .reduce((acc, p) => {
        acc[p.name] = p.type === 'string' ? 'example' : p.type === 'number' ? 123 : true;
        return acc;
      }, {});
      
    return `${method} ${path}\nContent-Type: application/json\n\n${JSON.stringify(bodyParams, null, 2)}`;
  }
}

// 生成响应示例
function generateResponseExample(method, path) {
  const baseExample = {
    success: true,
    message: '接口调用成功',
    data: {}
  };
  
  // 根据路径生成更具体的响应示例
  if (path.includes('/health')) {
    return JSON.stringify({
      ...baseExample,
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      }
    }, null, 2);
  } else if (path.includes('/info')) {
    return JSON.stringify({
      ...baseExample,
      data: {
        name: 'WeDrawOS API',
        version: '1.0.0',
        description: '智能客服系统API',
        status: 'running'
      }
    }, null, 2);
  } else if (path.includes('/customer')) {
    return JSON.stringify({
      ...baseExample,
      data: {
        customerId: '123456',
        name: '客户名称',
        status: 'active'
      }
    }, null, 2);
  } else if (path.includes('/feedback')) {
    return JSON.stringify({
      ...baseExample,
      data: {
        feedbackId: '789012',
        status: 'pending',
        createdAt: new Date().toISOString()
      }
    }, null, 2);
  } else {
    return JSON.stringify(baseExample, null, 2);
  }
}

// 基础路由
app.get('/', (req, res) => {
  res.json({
    name: 'WeDrawOS API',
    version: '1.0.0',
    description: '智能客服系统API服务',
    message: 'API服务运行正常',
    docs: '/api-docs',
    health: '/api/health',
    timestamp: new Date().toISOString()
  });
});

// 健康检查路由
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'WeDrawOS API',
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// 服务信息路由
app.get('/api/info', (req, res) => {
  res.json({
    name: 'WeDrawOS API',
    version: '1.0.0',
    description: '智能客服系统API服务',
    status: 'running',
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development'
  });
});

// 注册API路由
function registerApiRoutes(app) {
  // 先单独注册AI服务路由
  try {
    const aiRoutes = require('./ai-service/aiRoutes');
    if (aiRoutes) {
      app.use('/api/ai', aiRoutes);
      console.log('✅ AI服务路由已注册到 /api/ai 路径');
    }
  } catch (error) {
    console.warn('⚠️  加载AI服务路由失败:', error.message);
  }
  
  // 注册各模块，避免动态 require 影响打包
  try {
    const commonApi = require('./common-api');
    if (typeof commonApi.register === 'function') commonApi.register(app);
    else if (typeof commonApi.initialize === 'function') commonApi.initialize(app);
  } catch (e) { console.warn('⚠️  注册common-api模块失败:', e.message); }

  try {
    const buyerApi = require('./buyer-api');
    if (typeof buyerApi.register === 'function') buyerApi.register(app);
    else if (typeof buyerApi.initialize === 'function') buyerApi.initialize(app);
  } catch (e) { console.warn('⚠️  注册buyer-api模块失败:', e.message); }

  try {
    const sellerApi = require('./seller-api');
    if (typeof sellerApi.register === 'function') sellerApi.register(app);
    else if (typeof sellerApi.initialize === 'function') sellerApi.initialize(app);
  } catch (e) { console.warn('⚠️  注册seller-api模块失败:', e.message); }

  try {
    const adminApi = require('./admin-api');
    if (typeof adminApi.register === 'function') adminApi.register(app);
    else if (typeof adminApi.initialize === 'function') adminApi.initialize(app);
  } catch (e) { console.warn('⚠️  注册admin-api模块失败:', e.message); }

  try {
    const imApi = require('./im-api');
    if (typeof imApi.register === 'function') imApi.register(app);
    else if (typeof imApi.initialize === 'function') imApi.initialize(app);
  } catch (e) { console.warn('⚠️  注册im-api模块失败:', e.message); }
}

// 设置静态文件服务
app.use('/static', express.static(path.join(__dirname, 'static')));

// 设置API文档
setupSwagger(app);

// 注册API路由
registerApiRoutes(app);

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('API错误:', err);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在',
    path: req.path
  });
});

// 启动服务器
app.listen(port, () => {
  console.log('✅ WeDraw API服务器已启动');
  console.log('📡 服务地址: http://localhost:' + port);
  console.log('📚 API文档: http://localhost:' + port + '/api/docs');
  console.log('💚 健康检查: http://localhost:' + port + '/api/health');
  console.log('🔍 文档JSON: http://localhost:' + port + '/api/docs.json');
  console.log('========================================');
});

// 导出app实例供测试使用
module.exports = app;