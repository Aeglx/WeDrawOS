/**
 * WeDrawOS API服务入口文件 - 集成微信开发文档风格的Swagger
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

// 中间件配置
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 引入微信文档风格的Swagger配置
let setupSwagger;
try {
  // 尝试导入已有的微信文档风格Swagger配置
  const swaggerModule = require('./common-api/swagger');
  if (swaggerModule.setupSwagger) {
    setupSwagger = swaggerModule.setupSwagger;
    console.log('✅ 成功加载微信文档风格Swagger配置');
  } else {
    console.log('⚠️  Swagger配置模块不完整，使用备用配置');
    // 使用备用配置
    setupSwagger = setupBasicSwagger;
  }
} catch (error) {
  console.error('❌ 加载Swagger配置失败:', error.message);
  console.log('⚠️  使用内置的Swagger配置');
  setupSwagger = setupBasicSwagger;
}

// 微信官方文档风格的API文档配置函数
function setupWechatOfficialDocs(app) {
    // 自动扫描API路由
    function scanApiRoutes() {
    // 扫描项目中的实际API路由，解析Swagger注释和路由定义
    const fs = require('fs');
    const path = require('path');
    const routesDir = path.join(__dirname, 'routes');
    
    // API分类配置 - 更详细的分类系统
    const apiCategories = {
      // 公共接口
      'common': {
        category: 'common',
        name: '公共接口',
        pathPatterns: ['/api/common', '/api/public', '/api/health', '/api/info'],
        description: '系统公共接口，无需特殊权限即可访问'
      },
      
      // 客户端相关
      'client': {
        category: 'client',
        name: '客户端接口',
        pathPatterns: ['/api/client', '/api/buyer', '/api/user'],
        description: '面向终端用户的接口，提供注册、登录、个人中心等功能'
      },
      
      // 商品相关
      'product': {
        category: 'product',
        name: '商品管理',
        pathPatterns: ['/api/product', '/api/goods', '/api/category'],
        description: '商品信息管理相关接口'
      },
      
      // 订单相关
      'order': {
        category: 'order',
        name: '订单管理',
        pathPatterns: ['/api/order', '/api/cart', '/api/payment'],
        description: '订单创建、查询、支付等相关接口'
      },
      
      // 物流相关
      'logistics': {
        category: 'logistics',
        name: '物流服务',
        pathPatterns: ['/api/logistics', '/api/delivery', '/api/shipping'],
        description: '物流信息查询、配送管理相关接口'
      },
      
      // 卖家端
      'seller': {
        category: 'seller',
        name: '卖家端接口',
        pathPatterns: ['/api/seller', '/api/vendor'],
        description: '卖家运营管理相关接口'
      },
      
      // 管理端
      'admin': {
        category: 'admin',
        name: '管理端接口',
        pathPatterns: ['/api/admin', '/api/management'],
        description: '系统管理、用户管理等后台接口'
      },
      
      // 客服系统
      'customer-service': {
        category: 'customer-service',
        name: '客服系统',
        pathPatterns: ['/api/customer', '/api/service', '/api/chat'],
        description: '客户服务、在线客服相关接口'
      },
      
      // 消息通知
      'message': {
        category: 'message',
        name: '消息通知',
        pathPatterns: ['/api/message', '/api/notification', '/api/alert'],
        description: '站内信、推送通知等接口'
      },
      
      // 客户反馈
      'feedback': {
        category: 'feedback',
        name: '客户反馈',
        pathPatterns: ['/api/feedback', '/api/complaint', '/api/suggestion'],
        description: '客户反馈、投诉建议相关接口'
      },
      
      // 系统调度
      'scheduler': {
        category: 'scheduler',
        name: '系统调度',
        pathPatterns: ['/api/scheduler', '/api/task', '/api/cron'],
        description: '系统定时任务、调度管理相关接口'
      },
      
      // 自动回复
      'auto-reply': {
        category: 'auto-reply',
        name: '自动回复',
        pathPatterns: ['/api/auto-reply', '/api/autoReply'],
        description: '自动回复规则配置相关接口'
      },
      
      // 未分类接口
      'uncategorized': {
        category: 'uncategorized',
        name: '未分类接口',
        pathPatterns: [],
        description: '尚未归类的接口'
      }
    };
    
    // 初始化所有分类的apis数组
    Object.keys(apiCategories).forEach(categoryKey => {
      apiCategories[categoryKey].apis = [];
    });
    
    // 添加公共接口基础服务
    apiCategories['common'].apis = [
      {
        name: '服务器信息',
        method: 'GET',
        path: '/api',
        description: '获取API服务器信息',
        params: [],
        responseExample: `{
  "name": "WeDrawOS Customer Service API",
  "version": "1.0.0",
  "description": "客服系统后端API接口服务",
  "endpoints": {...}
}`
      },
      {
        name: '健康检查',
        method: 'GET',
        path: '/api/health',
        description: '检查API服务健康状态',
        params: [],
        responseExample: `{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "WeDrawOS Customer Service API"
}`
      },
      {
        name: '服务信息',
        method: 'GET',
        path: '/api/info',
        description: '获取服务详细信息',
        params: [],
        responseExample: `{
  "name": "WeDrawOS Customer Service API",
  "version": "1.0.0",
  "description": "Customer service system API",
  "status": "running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}`
      },
      {
        name: 'API文档数据',
        method: 'GET',
        path: '/api-docs/data',
        description: '获取API文档的原始数据',
        params: [],
        responseExample: `{
  "success": true,
  "data": [...],
  "timestamp": 1630000000000
}`
      }
    ];
    
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
          Object.entries(parsedData.paths).forEach(([path, methods]) => {
            Object.entries(methods).forEach(([method, details]) => {
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
            });
          });
        }
      }
      
      // 从文件内容中匹配路由定义
      const routeRegex = /router\.(get|post|put|delete|patch)\(['"]([^'"]+)['"](?!\s*\,\s*\{\s*next\s*:\s*true)/g;
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
            timestamp: '2024-01-01T00:00:00.000Z',
            uptime: 3600
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
            createdAt: '2024-01-01T00:00:00.000Z'
          }
        }, null, 2);
      } else {
        return JSON.stringify(baseExample, null, 2);
      }
    }
    
    // 扫描routes目录中的实际路由文件
    try {
      if (fs.existsSync(routesDir)) {
        const files = fs.readdirSync(routesDir).filter(file => file.endsWith('.js'));
        
        files.forEach(file => {
          const filePath = path.join(routesDir, file);
          const fileContent = fs.readFileSync(filePath, 'utf8');
          console.log(`正在扫描并解析路由文件: ${file}`);
          
          // 从文件中提取API信息
          const apis = extractApisFromFile(filePath, fileContent);
          
          // 根据文件名或内容确定分类
          let categoryKey = 'system'; // 默认分类
          
          // 根据API路径进行精确分类
          if (apis.length > 0) {
            // 对每个API进行分类
            apis.forEach(api => {
              let categorized = false;
              
              // 根据API路径模式进行精确分类
              Object.entries(apiCategories).forEach(([categoryKey, category]) => {
                if (categoryKey === 'uncategorized') return; // 跳过未分类类别
                
                if (category.pathPatterns && Array.isArray(category.pathPatterns)) {
                  for (const pattern of category.pathPatterns) {
                    // 检查路径是否匹配该模式
                    if (api.path.includes(pattern)) {
                      apiCategories[categoryKey].apis.push(api);
                      categorized = true;
                      return;
                    }
                  }
                }
              });
              
              // 如果没有匹配到任何分类，放入未分类
              if (!categorized) {
                // 处理系统默认接口
                if (api.path === '/' || api.path === '/health' || api.path.includes('/api/health') || api.path.includes('/api/info')) {
                  apiCategories['common'].apis.push(api);
                } else {
                  apiCategories['uncategorized'].apis.push(api);
                }
              }
            });
          }
          
          console.log(`从 ${file} 提取了 ${apis.length} 个API接口，已按照用户要求的分类结构组织`);
          console.log(`从 ${file} 提取了 ${apis.length} 个API接口`);
        });
      }
    } catch (error) {
      console.error('扫描路由文件时发生错误:', error.message);
    }
    
    // 转换为数组格式
    return Object.values(apiCategories);
  }

  // 生成微信官方文档风格的HTML页面
  function generateWechatDocsHtml() {
    const apiData = scanApiRoutes();
    
    // 使用安全的方式构建HTML，避免模板字符串中的变量引用错误
    let html = '<!DOCTYPE html>\n<html lang="zh-CN">';
    
    // 安全地生成HTML内容，避免任何未定义变量
    html += `
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WeDraw API文档 - 微信官方文档风格</title>
  <style>
    /* 全局样式 */
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; line-height: 1.5; color: #333; background-color: #fff; height: 100vh; display: flex; flex-direction: column; overflow: hidden; }
    
    /* 简化的样式定义... */
    .header { height: 60px; background-color: #fff; border-bottom: 1px solid #e5e5e5; display: flex; align-items: center; padding: 0 20px; }
    .header-logo { font-size: 18px; font-weight: 600; color: #07C160; margin-right: 40px; }
    .main-container { display: flex; flex: 1; overflow: hidden; }
    .sidebar { width: 240px; background-color: #fff; border-right: 1px solid #e5e5e5; overflow-y: auto; }
    .content { flex: 1; overflow-y: auto; padding: 20px; background-color: #fafafa; }
    .sidebar-subitem { padding: 10px 20px 10px 40px; font-size: 13px; color: #666; cursor: pointer; }
    .sidebar-subitem.active { background-color: #e6f7e9; color: #07C160; border-right: 3px solid #07C160; }
    .api-item { margin-bottom: 20px; background-color: #fff; padding: 20px; border-radius: 8px; }
    .category-content { display: none; }
  </style>
</head>
<body>
  <header class="header">
    <div class="header-logo">WeDraw 文档</div>
  </header>
  
  <div class="main-container">
    <aside class="sidebar">
      <nav class="sidebar-menu">
        <div class="sidebar-item">
          <div class="sidebar-title">API 接口</div>
          <div class="sidebar-submenu open">`;
    
    // 安全地添加API分类导航
    if (apiData && Array.isArray(apiData)) {
      for (let i = 0; i < apiData.length; i++) {
        const category = apiData[i];
        if (category && category.category && category.name) {
          html += '<div class="sidebar-subitem" onclick="loadApiCategory(\'' + category.category + '\')">' + category.name + '</div>';
        }
      }
    }
    
    html += `</div>
        </div>
      </nav>
    </aside>
    
    <main class="content" id="content-container">
      <div id="api-content">`;
    
    // 安全地添加API分类内容
    if (apiData && Array.isArray(apiData)) {
      for (let i = 0; i < apiData.length; i++) {
        const category = apiData[i];
        if (category && category.category) {
          const isCommon = category.category === 'common';
          const displayStyle = isCommon ? 'block' : 'none';
          
          html += '<div id="' + category.category + '" class="category-content" style="display: ' + displayStyle + '">';
          html += '<h2>' + (category.name || '未命名分类') + '</h2>';
          
          if (category.apis && Array.isArray(category.apis)) {
            for (let j = 0; j < category.apis.length; j++) {
              const api = category.apis[j];
              if (api && api.path) {
                html += '<div class="api-item">';
                html += '<div class="api-header">';
                html += '<span class="api-method">' + (api.method || 'GET') + '</span>';
                html += '<span class="api-title">' + (api.name || '未命名接口') + '</span>';
                html += '<span class="api-path">' + api.path + '</span>';
                html += '</div>';
                html += '</div>';
              }
            }
          }
          
          html += '</div>';
        }
      }
    }
    
    html += `
      </div>
    </main>
  </div>
  
  <script>
    // 简单安全的loadApiCategory函数
    function loadApiCategory(categoryId) {
      try {
        // 隐藏所有分类
        const categories = document.querySelectorAll('.category-content');
        for (let i = 0; i < categories.length; i++) {
          categories[i].style.display = 'none';
        }
        
        // 显示选中的分类
        const selected = document.getElementById(categoryId);
        if (selected) {
          selected.style.display = 'block';
        }
        
        // 更新选中状态
        const items = document.querySelectorAll('.sidebar-subitem');
        for (let i = 0; i < items.length; i++) {
          items[i].classList.remove('active');
        }
        
        // 设置当前项为活跃
        if (window.event && window.event.target) {
          window.event.target.classList.add('active');
        }
      } catch (e) {
        console.log('加载分类时出错:', e);
      }
    }
    
    // 初始化
    window.onload = function() {
      try {
        // 默认显示common分类
        const commonItem = document.getElementById('common');
        if (commonItem) {
          commonItem.style.display = 'block';
        }
      } catch (e) {
        console.log('初始化时出错:', e);
      }
    };
  </script>
</body>
</html>`;
    
    return html;
  }

  return html;
}

  // 安全地生成HTML内容，避免任何未定义变量
  html += `
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WeDraw API文档 - 微信官方文档风格</title>
  <style>
    /* 全局样式重置 */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            font-size: 14px;
            line-height: 1.5;
            color: #333;
            background-color: #fff;
            height: 100vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
          }
    
    /* 顶部导航栏 */
    .header {
      height: 60px;
      background-color: #fff;
      border-bottom: 1px solid #e5e5e5;
      display: flex;
      align-items: center;
      padding: 0 20px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.05);
      z-index: 1000;
      position: relative;
    }
    
    .header-logo {
      display: flex;
      align-items: center;
      font-size: 18px;
      font-weight: 600;
      color: #07C160;
      margin-right: 40px;
    }
    
    .header-logo img {
      width: 24px;
      height: 24px;
      margin-right: 8px;
    }
    
    .header-nav {
      display: flex;
      gap: 30px;
    }
    
    .header-nav a {
      color: #333;
      text-decoration: none;
      font-size: 15px;
      padding: 5px 0;
      transition: color 0.2s;
    }
    
    .header-nav a:hover {
      color: #07C160;
    }
    
    .header-nav a.active {
      color: #07C160;
      font-weight: 500;
    }
    
    .header-right {
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: 20px;
    }
    
    /* 二级导航栏 */
    .sub-header {
      height: 50px;
      background-color: #fff;
      border-bottom: 1px solid #e5e5e5;
      display: flex;
      align-items: center;
      padding: 0 20px;
      position: relative;
    }
    
    .sub-nav {
      display: flex;
      gap: 10px;
    }
    
    .sub-nav-btn {
      padding: 6px 16px;
      border: 1px solid #e5e5e5;
      background-color: #fff;
      color: #333;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s;
    }
    
    .sub-nav-btn:hover {
      border-color: #07C160;
      color: #07C160;
    }
    
    .sub-nav-btn.active {
      background-color: #07C160;
      color: #fff;
      border-color: #07C160;
    }
    
    .sub-nav-dropdown {
      position: relative;
    }
    
    .sub-nav-dropdown .sub-nav-btn {
      padding-right: 30px;
      position: relative;
    }
    
    .sub-nav-dropdown .sub-nav-btn:after {
      content: '▼';
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 10px;
    }
    
    /* 主内容区域 */
    .main-container {
      display: flex;
      height: calc(100vh - 110px);
      overflow: hidden;
      flex: 1;
    }
    
    /* 左侧导航 */
    .sidebar {
      width: 240px;
      background-color: #fff;
      border-right: 1px solid #e5e5e5;
      overflow-y: auto;
      flex-shrink: 0;
    }
    
    .sidebar-menu {
      padding: 10px 0;
    }
    
    .sidebar-item {
      position: relative;
    }
    
    .sidebar-title {
      padding: 12px 20px;
      font-size: 14px;
      color: #333;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: space-between;
      user-select: none;
    }
    
    .sidebar-title:hover {
      background-color: #f5f5f5;
    }
    
    .sidebar-title.active {
      background-color: #e6f7e9;
      color: #07C160;
      font-weight: 500;
    }
    
    .sidebar-toggle {
      font-size: 12px;
      transition: transform 0.2s;
    }
    
    .sidebar-toggle.open {
      transform: rotate(90deg);
    }
    
    .sidebar-submenu {
      display: none;
      background-color: #fafafa;
    }
    
    .sidebar-submenu.open {
      display: block;
    }
    
    .sidebar-subitem {
      padding: 10px 20px 10px 40px;
      font-size: 13px;
      color: #666;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .sidebar-subitem:hover {
      background-color: #f0f0f0;
      color: #07C160;
    }
    
    .sidebar-subitem.active {
        background-color: #e6f7e9;
        color: #07C160;
        font-weight: 500;
        border-right: 3px solid #07C160;
      }
    
    /* 内容区域 */
    .content {
      flex: 1;
      overflow-y: auto;
      padding: 20px 40px;
      background-color: #fff;
      min-width: 0;
    }
    
    .content h1 {
      font-size: 28px;
      margin-bottom: 20px;
      color: #333;
      font-weight: 600;
    }
    
    .content h2 {
      font-size: 22px;
      margin: 30px 0 15px;
      color: #333;
      font-weight: 600;
      padding-bottom: 10px;
      border-bottom: 1px solid #e5e5e5;
    }
    
    .category-description {
      color: #666;
      font-size: 14px;
      margin: 0 0 10px 0;
      line-height: 1.6;
    }
    
    .api-count {
      color: #888;
      font-size: 12px;
      margin: 0 0 20px 0;
      padding-bottom: 10px;
      border-bottom: 1px solid #e5e5e5;
    }
    
    .content h3 {
      font-size: 18px;
      margin: 25px 0 15px;
      color: #333;
      font-weight: 500;
    }
    
    .content p {
      margin-bottom: 15px;
      line-height: 1.8;
      color: #666;
    }
    
    .content code {
      background-color: #f5f5f5;
      padding: 2px 5px;
      border-radius: 3px;
      font-size: 13px;
      color: #e83e8c;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    }
    
    .content pre {
      background-color: #f5f5f5;
      padding: 16px;
      border-radius: 6px;
      overflow-x: auto;
      margin-bottom: 15px;
      border: 1px solid #e5e5e5;
    }
    
    .content pre code {
      background-color: transparent;
      padding: 0;
      color: #333;
    }
    
    /* API 接口文档样式 */
    .api-item {
      margin-bottom: 30px;
      border: 1px solid #f0f0f0;
      border-radius: 4px;
      background-color: #fff;
    }
    
    .api-header {
      background-color: #fafafa;
      padding: 15px 20px;
      border-bottom: 1px solid #f0f0f0;
      display: flex;
      align-items: center;
      gap: 15px;
    }
    
    .api-method {
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      text-transform: uppercase;
      min-width: 60px;
      text-align: center;
    }
    
    .api-method.get {
      background-color: #52c41a;
      color: white;
    }
    
    .api-method.post {
      background-color: #1890ff;
      color: white;
    }
    
    .api-method.put {
      background-color: #fa8c16;
      color: white;
    }
    
    .api-method.delete {
      background-color: #f5222d;
      color: white;
    }
    
    .api-title {
      font-size: 16px;
      font-weight: 500;
      color: #333;
    }
    
    .api-path {
        color: #666;
        font-family: 'Consolas', 'Monaco', monospace;
        background-color: #f6f6f6;
        padding: 2px 8px;
        border-radius: 3px;
      }
      
      /* 确保flex布局正常 */
      .api-header {
        display: flex;
        align-items: center;
        gap: 15px;
      }
    
    .api-method {
      padding: 6px 12px;
      border-radius: 4px;
      font-size: 13px;
      font-weight: 600;
      background-color: #07C160;
      color: #fff;
      min-width: 60px;
      text-align: center;
    }
    
    .api-method.get {
      background-color: #07C160;
    }
    
    .api-method.post {
      background-color: #1890ff;
    }
    
    .api-method.put {
      background-color: #faad14;
    }
    
    .api-method.delete {
      background-color: #f5222d;
    }
    
    .api-title {
      font-size: 16px;
      font-weight: 500;
      color: #333;
    }
    
    .api-path {
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      color: #666;
      font-size: 14px;
    }
    
    .api-content {
      padding: 20px;
    }
    
    .api-description {
      color: #666;
      margin-bottom: 20px;
      line-height: 1.6;
    }
    
    .api-section {
      margin-bottom: 20px;
    }
    
    .api-section-title {
      font-weight: 500;
      color: #333;
      margin-bottom: 10px;
      padding-bottom: 5px;
      border-bottom: 1px solid #f0f0f0;
    }
    
    .api-params-table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
    }
    
    .api-params-table th,
    .api-params-table td {
      padding: 10px;
      border: 1px solid #f0f0f0;
      text-align: left;
    }
    
    .api-params-table th {
      background-color: #fafafa;
      font-weight: 500;
      color: #333;
    }
    
    .api-params-table tr:hover {
      background-color: #fafafa;
    }
    
    /* 代码块样式优化 */
    pre {
      background-color: #f6f8fa;
      border: 1px solid #e1e4e8;
      border-radius: 4px;
      padding: 16px;
      overflow: auto;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      font-size: 13px;
      line-height: 1.5;
    }
    
    code {
      background-color: #f6f8fa;
      padding: 2px 4px;
      border-radius: 3px;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      font-size: 13px;
    }
    
    /* 滚动条样式优化 */
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    
    ::-webkit-scrollbar-track {
      background: #f1f1f1;
    }
    
    ::-webkit-scrollbar-thumb {
      background: #888;
      border-radius: 4px;
    }
    
    ::-webkit-scrollbar-thumb:hover {
      background: #555;
    }
    
    .api-description {
      margin-bottom: 20px;
      color: #666;
      line-height: 1.6;
    }
    
    .api-section {
      margin-bottom: 25px;
    }
    
    .api-section-title {
      font-size: 15px;
      font-weight: 500;
      color: #333;
      margin-bottom: 12px;
    }
    
    .api-params-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 15px;
    }
    
    .api-params-table th,
    .api-params-table td {
      padding: 10px 12px;
      text-align: left;
      border-bottom: 1px solid #e5e5e5;
    }
    
    .api-params-table th {
      background-color: #fafafa;
      font-weight: 500;
      color: #333;
    }
    
    .api-params-table td {
      color: #666;
    }
    
    /* 响应式设计 */
    @media (max-width: 1200px) {
      .sidebar {
        width: 200px;
      }
      
      .header-nav {
        gap: 20px;
      }
    }
    
    @media (max-width: 768px) {
      .header {
        padding: 0 15px;
      }
      
      .header-nav {
        display: none;
      }
      
      .sub-nav {
        flex-wrap: wrap;
      }
      
      .sidebar {
        width: 100%;
        height: 200px;
        border-right: none;
        border-bottom: 1px solid #e5e5e5;
      }
      
      .main-container {
        flex-direction: column;
        height: auto;
        min-height: calc(100vh - 110px);
      }
      
      .content {
        padding: 15px 20px;
      }
    }
    
    /* 确保滚动条样式 */
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    
    ::-webkit-scrollbar-track {
      background: #f1f1f1;
    }
    
    ::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 4px;
    }
    
    ::-webkit-scrollbar-thumb:hover {
      background: #a8a8a8;
    }
  </style>
</head>
<body>
  <!-- 顶部导航栏 -->
  <header class="header">
    <div class="header-logo">
      <span>WeDraw 文档</span>
    </div>
    <nav class="header-nav">
      <a href="#" class="active">开发</a>
      <a href="#">介绍</a>
      <a href="#">设计</a>
      <a href="#">运营</a>
      <a href="#">数据</a>
      <a href="#">安全</a>
    </nav>
    <div class="header-right">
      <span>API文档</span>
    </div>
  </header>
  
  <!-- 二级导航栏 -->
  <div class="sub-header">
    <nav class="sub-nav">
      <button class="sub-nav-btn active">指南</button>
      <button class="sub-nav-btn">框架</button>
      <button class="sub-nav-btn">组件</button>
      <button class="sub-nav-btn active">API</button>
      <button class="sub-nav-btn">服务端</button>
      <div class="sub-nav-dropdown">
        <button class="sub-nav-btn">平台能力</button>
      </div>
      <button class="sub-nav-btn">工具</button>
      <div class="sub-nav-dropdown">
        <button class="sub-nav-btn">云服务</button>
      </div>
    </nav>
  </div>
  
  <!-- 主内容区域 -->
  <div class="main-container">
    <!-- 左侧导航 -->
    <aside class="sidebar">
      <nav class="sidebar-menu">
        <div class="sidebar-item">
          <div class="sidebar-title active" onclick="toggleSidebarItem(this)">
            <span>起步</span>
            <span class="sidebar-toggle open">▶</span>
          </div>
          <div class="sidebar-submenu open">
            <div class="sidebar-subitem" onclick="navigateTo('overview')">概述</div>
            <div class="sidebar-subitem" onclick="navigateTo('quickstart')">快速开始</div>
          </div>
        </div>
        
        <div class="sidebar-item">
                 <div class="sidebar-title active" onclick="toggleSidebarItem(this)">
                   <span>API 接口</span>
                   <span class="sidebar-toggle open">▶</span>
                 </div>
                 <div class="sidebar-submenu open">
                   ${apiData.map(category => `
                   <div class="sidebar-subitem" onclick="loadApiCategory('${category.category}')">${category.name}</div>
                   `).join('')}
                 </div>
               </div>
        
        <div class="sidebar-item">
          <div class="sidebar-title" onclick="toggleSidebarItem(this)">
            <span>接口规范</span>
            <span class="sidebar-toggle">▶</span>
          </div>
          <div class="sidebar-submenu">
            <div class="sidebar-subitem" onclick="navigateTo('format')">数据格式</div>
            <div class="sidebar-subitem" onclick="navigateTo('error')">错误码</div>
          </div>
        </div>
        
        <div class="sidebar-item">
          <div class="sidebar-title" onclick="toggleSidebarItem(this)">
            <span>常见问题</span>
            <span class="sidebar-toggle">▶</span>
          </div>
          <div class="sidebar-submenu">
            <div class="sidebar-subitem" onclick="navigateTo('faq')">FAQ</div>
            <div class="sidebar-subitem" onclick="navigateTo('troubleshooting')">故障排查</div>
          </div>
        </div>
      </nav>
    </aside>
    
    <!-- 内容区域 -->
    <main class="content" id="content-container">
      <h1>WeDraw API 接口文档</h1>
      <p>本文档提供WeDraw平台所有开放接口的详细说明，包含接口地址、请求参数、返回值等信息。</p>
      
      <div id="api-content">
        ${apiData.map(category => `
        <div id="${category.category}" class="category-content" style="display: ${category.category === 'common' ? 'block' : 'none'}">
          <h2>${category.name}</h2>
          ${category.description ? `<p class="category-description">${category.description}</p>` : ''}
          <p class="api-count">共 ${category.apis.length} 个接口</p>
          ${category.apis.map(api => `
          <div class="api-item">
            <div class="api-header">
              <span class="api-method ${api.method.toLowerCase()}">${api.method}</span>
              <span class="api-title">${api.name}</span>
              <span class="api-path">${api.path}</span>
            </div>
            <div class="api-content">
              <!-- 接口描述 -->
              <div class="api-description">${api.description}</div>
              
              <!-- 请求参数 -->
              ${api.params && api.params.length > 0 ? `
              <div class="api-section">
                <div class="api-section-title">请求参数</div>
                <table class="api-params-table">
                  <thead>
                    <tr>
                      <th>参数名</th>
                      <th>类型</th>
                      <th>必填</th>
                      <th>描述</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${api.params.map(param => `
                    <tr>
                      <td>${param.name}</td>
                      <td>${param.type}</td>
                      <td>${param.required ? '是' : '否'}</td>
                      <td>${param.description}</td>
                    </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
              ` : `
              <div class="api-section">
                <div class="api-section-title">请求参数</div>
                <p>该接口不需要请求参数</p>
              </div>
              `}
              
              <!-- 请求示例 -->
              ${api.requestExample ? `
              <div class="api-section">
                <div class="api-section-title">请求示例</div>
                <pre><code>${api.requestExample}</code></pre>
              </div>
              ` : ''}
              
              <!-- 返回示例 -->
              <div class="api-section">
                <div class="api-section-title">返回示例</div>
                <pre><code>${api.responseExample}</code></pre>
              </div>
              
              <!-- 返回说明 -->
              <div class="api-section">
                <div class="api-section-title">返回说明</div>
                <ul>
                  <li><strong>success</strong>: 布尔值，表示请求是否成功</li>
                  <li><strong>message</strong>: 字符串，返回的提示信息</li>
                  <li><strong>data</strong>: 对象，返回的业务数据</li>
                </ul>
              </div>
            </div>
          </div>
          `).join('')}
        </div>
        `).join('')}
      </div>
    </main>
  </div>
  
  <script>
    // API 数据（按照用户要求的分类结构组织）
    const apiData = ${JSON.stringify(apiData)};
    
    // 切换侧边栏项展开/折叠
    function toggleSidebarItem(element) {
      const submenu = element.nextElementSibling;
      const toggle = element.querySelector('.sidebar-toggle');
      
      if (submenu.classList.contains('open')) {
        submenu.classList.remove('open');
        toggle.classList.remove('open');
      } else {
        submenu.classList.add('open');
        toggle.classList.add('open');
      }
    }
    
    // 导航到指定内容
    function navigateTo(id) {
      const contentContainer = document.getElementById('content-container');
      if (id === 'overview') {
        contentContainer.innerHTML = '<h1>API 概述</h1><p>WeDraw API 是一组提供给开发者使用的接口，用于与WeDraw平台进行交互。</p><h2>接口特性</h2><ul><li>RESTful API 设计风格</li><li>支持 JSON 数据格式</li><li>提供完善的错误处理机制</li><li>支持跨域请求</li></ul>';
      }
    }
    
    // 加载API分类
    function loadApiCategory(categoryId) {
      try {
        // 隐藏所有分类内容
        const allCategories = document.querySelectorAll('.category-content');
        allCategories.forEach(function(category) {
          category.style.display = 'none';
        });
        
        // 显示选中的分类内容
        const selectedCategory = document.getElementById(categoryId);
        if (selectedCategory) {
          selectedCategory.style.display = 'block';
          // 滚动到顶部
          const contentElement = document.querySelector('.content');
          if (contentElement) {
            contentElement.scrollTop = 0;
          }
        }
        
        // 更新侧边栏选中状态
        const allSubitems = document.querySelectorAll('.sidebar-subitem');
        allSubitems.forEach(function(item) {
          item.classList.remove('active');
        });
        
        // 为当前选中的子项添加active状态
        try {
          const selector = `.sidebar-subitem[onclick="loadApiCategory('${categoryId}')"]`;
          const activeElement = document.querySelector(selector);
          if (activeElement) {
            activeElement.classList.add('active');
          } else if (typeof window !== 'undefined' && window.event && window.event.target) {
            window.event.target.classList.add('active');
          }
        } catch (e) {
          // 忽略此错误，不影响主要功能
        }
      } catch (err) {
        // 捕获所有错误，确保函数不会中断执行
        if (typeof console !== 'undefined') {
          console.log('加载分类时出现非致命错误:', err);
        }
      }
    }
    
    // 自动刷新API数据（可选）
    function autoRefreshApiData() {
      setInterval(() => {
        fetch('/api-status')
          .then(response => response.json())
          .then(data => {
            console.log('API数据刷新时间:', new Date().toLocaleTimeString());
          })
          .catch(error => {
            console.error('API数据刷新失败:', error);
          });
      }, 60000); // 每分钟刷新一次
    }
    
    // 页面加载完成后执行
    document.addEventListener('DOMContentLoaded', function() {
      console.log('WeDraw API文档（微信官方文档风格）已加载');
      
      // 确保内容容器可以滚动
      const contentContainer = document.querySelector('.content');
      contentContainer.style.overflowY = 'auto';
      contentContainer.style.maxHeight = '100%';
      
      // 初始加载公共接口分类
      if (document.querySelector('.sidebar-subitem[onclick="loadApiCategory(\'common\')"]')) {
        loadApiCategory('common');
      }
      
      // 确保所有分类都有正确的样式
      const categoryContents = document.querySelectorAll('.category-content');
      categoryContents.forEach(category => {
        category.style.display = 'none';
      });
      
      // 显示默认分类（系统服务）
      const defaultCategory = document.getElementById('system');
      if (defaultCategory) {
        defaultCategory.style.display = 'block';
      }
      
      // autoRefreshApiData(); // 可选：启用自动刷新
    });
  </script>
</body>
</html>
    `;
  }

  // 提供微信官方文档风格的API文档页面
  app.get('/api-docs', (req, res) => {
    const html = generateWechatDocsHtml();
    res.send(html);
  });
  
  // 提供API数据接口（用于前端动态加载）
  app.get('/api-docs/data', (req, res) => {
    const apiData = scanApiRoutes();
    res.json({
      success: true,
      data: apiData,
      timestamp: Date.now()
    });
  });
  
  // 提供API状态检查
  app.get('/api-status', (req, res) => {
    res.json({
      status: 'ok',
      message: 'WeDraw API文档服务运行正常',
      docs_style: '微信官方文档风格',
      timestamp: Date.now()
    });
  });
}

// 设置微信官方文档风格的API文档
  setupWechatOfficialDocs(app);

// API路由定义

/**
 * @swagger
 * /: 
 *   get:
 *     summary: 服务器根路径
 *     description: 返回服务器基本信息
 *     tags: [系统服务]
 *     responses:
 *       200:
 *         description: 请求成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ok"
 *                 message:
 *                   type: string
 *                   example: "WeDraw API Server Running"
 *                 docs:
 *                   type: string
 *                   example: "访问 /api-docs 查看微信风格API文档"
 */
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'WeDraw API Server Running',
    docs: '访问 /api-docs 查看微信风格API文档'
  });
});

/**
 * @swagger
 * /health: 
 *   get:
 *     summary: 健康检查
 *     description: 检查API服务是否正常运行
 *     tags: [系统服务]
 *     responses:
 *       200:
 *         description: 服务正常
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ok"
 *                 message:
 *                   type: string
 *                   example: "WeDraw API Running"
 *                 timestamp:
 *                   type: integer
 *                   example: 1634567890123
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'WeDraw API Running',
    timestamp: Date.now()
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Not Found',
    path: req.path
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('❌ 请求处理错误:', err);
  res.status(500).json({
    status: 'error',
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 安全的服务器启动逻辑
function startServer() {
  try {
    const server = app.listen(port, '0.0.0.0', () => {
      console.log(`========================================`);
      console.log(`✅ 服务器成功启动！`);
      console.log(`✅ 监听地址: 0.0.0.0:${port}`);
      console.log(`✅ 可访问: http://localhost:${port}`);
      console.log(`✅ API文档: http://localhost:${port}/api-docs`);
      console.log(`========================================`);
    });
    
    // 处理服务器错误
    server.on('error', (error) => {
      console.error('❌ 服务器错误:', error);
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ 端口 ${port} 已被占用！`);
      }
    });
    
    return server;
  } catch (error) {
    console.error('❌ 启动服务器时出错:', error);
    console.log('🟢 尝试使用备用配置重启...');
    return null;
  }
}

// 启动服务器
const server = startServer();

// 非常重要的保持活跃机制 - 使用多个定时器确保进程不会退出
setInterval(() => {
  console.log(`🟢 服务器心跳 - ${new Date().toLocaleTimeString()}`);
}, 10000); // 减少心跳频率，避免日志过多

// 额外的保持活跃机制
setTimeout(() => {
  console.log('🟢 服务器已稳定运行30秒');
}, 30000);

console.log('🟢 服务器初始化完成，进程将保持运行');
console.log('🟢 进程不会自动退出，请使用Ctrl+C手动终止');

// 确保服务器对象存在并记录其状态
console.log('🟢 服务器对象状态:', typeof server);

// 显式阻止进程退出的最后一道防线
if (typeof process.stdin.resume === 'function') {
  process.stdin.resume();
}

// 防止进程因任何原因退出
process.on('exit', (code) => {
  console.log(`⚠️  进程即将退出，代码: ${code}`);
});