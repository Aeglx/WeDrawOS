/**
 * WeDrawOS API文档中心
 * 提供完整的API接口文档，采用现代化文档风格设计
 */

const express = require('express');
const router = express.Router();
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUI = require('swagger-ui-express');
const path = require('path');

// 尝试导入logger模块，如果不存在则创建简单的日志函数
let logger;
try {
  const loggerPath = path.join(__dirname, '../core/utils/logger');
  logger = require(loggerPath);
} catch (error) {
  logger = {
    info: (message) => console.log(`[INFO] ${message}`),
    error: (message) => console.error(`[ERROR] ${message}`)
  };
}

// 微信官方开发文档风格CSS样式
const wechatThemeCss = `
/**
 * 微信官方开发文档样式
 */

/* 全局重置 - 微信文档默认样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Microsoft YaHei', 'PingFang SC', 'Hiragino Sans GB', sans-serif;
  font-size: 14px;
  color: #333;
  background-color: #fff;
  overflow: hidden;
  height: 100%;
  line-height: 1.5;
}

/* 隐藏Swagger默认的顶部栏 */
.swagger-ui .topbar {
  display: none !important;
}

/* 微信文档顶部导航栏 */
.wx-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
  z-index: 1000;
  display: flex;
  align-items: center;
  padding: 0 20px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.wx-header .logo {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.wx-header .nav {
  margin-left: 40px;
  display: flex;
  gap: 30px;
}

.wx-header .nav-item {
  position: relative;
  font-size: 15px;
  color: #666;
  cursor: pointer;
  padding: 0 5px;
  height: 60px;
  line-height: 60px;
  transition: color 0.2s;
}

.wx-header .nav-item:hover {
  color: #07c160;
}

.wx-header .nav-item.active {
  color: #07c160;
  font-weight: 500;
}

.wx-header .nav-item.active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 3px;
  background-color: #07c160;
}

/* 微信文档3栏布局主容器 */
.wx-container {
  display: flex;
  position: fixed;
  top: 60px;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #f7f7f7;
}

/* 左侧导航栏 */
.wx-sidebar {
  width: 220px;
  background-color: #fff;
  border-right: 1px solid #e6e6e6;
  overflow-y: auto;
  flex-shrink: 0;
  height: calc(100vh - 60px);
}

.wx-sidebar .sidebar-header {
  padding: 16px 20px 12px;
  border-bottom: 1px solid #f0f0f0;
}

.wx-sidebar .sidebar-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.wx-sidebar .menu-group-title {
  padding: 12px 20px 6px;
  font-size: 13px;
  color: #999;
  font-weight: 500;
}

.wx-sidebar .sub-menu {
  margin-bottom: 12px;
}

.wx-sidebar .menu-item {
  padding: 8px 20px;
  font-size: 14px;
  color: #333;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.wx-sidebar .menu-item:hover {
  background-color: #f6f8fa;
  color: #07c160;
}

.wx-sidebar .menu-item.active {
  background-color: #f6ffed;
  color: #07c160;
  border-right: 3px solid #07c160;
  font-weight: 500;
}

/* 中间内容区域 */
.wx-content {
  flex: 1;
  overflow-y: auto;
  background-color: #f7f7f7;
  padding: 20px;
  height: calc(100vh - 60px);
}

/* 右侧操作面板 */
.wx-right-panel {
  width: 280px;
  background-color: #fff;
  border-left: 1px solid #e6e6e6;
  overflow-y: auto;
  flex-shrink: 0;
  padding: 20px;
  height: calc(100vh - 60px);
}

/* Swagger UI容器样式重置 */
.swagger-ui {
  background-color: transparent !important;
  padding: 0 !important;
  margin: 0 !important;
  height: 100% !important;
}

/* Swagger内容容器 */
#swagger-ui-container {
  background-color: #fff;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  overflow: hidden;
  height: 100%;
}

/* 覆盖Swagger UI默认样式 */
.swagger-ui .info {
  background-color: #fff !important;
  padding: 24px 30px !important;
  border-bottom: 1px solid #f0f0f0 !important;
  margin: 0 !important;
  border-radius: 0 !important;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .wx-right-panel {
    display: none;
  }
}

@media (max-width: 768px) {
  .wx-sidebar {
    position: fixed;
    left: -220px;
    top: 60px;
    bottom: 0;
    z-index: 900;
    box-shadow: 2px 0 8px rgba(0,0,0,0.1);
    transition: left 0.3s;
  }
}
`;

// Swagger 配置选项
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'WeDrawOS API接口文档中心',
      version: '2.0.0',
      description: 'WeDrawOS客服系统API文档',
      contact: {
        name: 'WeDraw开发团队',
        email: 'dev@wedraw.com'
      }
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: '开发环境'
      }
    ]
  },
  // 扫描所有可能的路由文件
  apis: [
    path.join(__dirname, '../**/routes/**/*.js'),
    path.join(__dirname, '../**/controllers/**/*.js'),
    path.join(__dirname, '../**/services/**/*.js'),
    path.join(__dirname, '../ai-service/**/*.js')
  ]
};

// 生成Swagger文档
const swaggerSpec = swaggerJsdoc(options);

/**
 * 配置微信开放平台风格的API文档路由
 * @param {Object} app - Express应用实例
 */
function setupWechatApiDocs(app) {
  try {
    logger.info('初始化WeDraw API文档系统');
    
    // 提供JSON格式的API文档
    app.get('/api/wedraw-docs/json', (req, res) => {
      logger.info('请求API文档JSON数据');
      res.setHeader('Content-Type', 'application/json');
      res.json(swaggerSpec);
    });

    // 提供完整的API文档HTML页面
    app.get('/api/wedraw-docs', (req, res) => {
      logger.info('访问API文档页面');
      
      // 构建HTML页面
      const html = `
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>WeDrawOS API文档中心</title>
        <link rel="stylesheet" type="text/css" href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.10.3/swagger-ui.min.css">
        <style>
          ${wechatThemeCss}
        </style>
      </head>
      <body>
        <!-- 微信文档顶部导航栏 -->
        <div class="wx-header">
          <div class="logo">WeDrawOS API文档中心</div>
          <div class="nav">
            <div class="nav-item active">接口文档</div>
            <div class="nav-item">快速开始</div>
            <div class="nav-item">认证指南</div>
            <div class="nav-item">错误码</div>
          </div>
        </div>
        
        <!-- 微信文档3栏布局主容器 -->
        <div class="wx-container">
          <!-- 左侧导航栏 -->
          <div class="wx-sidebar">
            <div class="sidebar-header">
              <h3>API 文档</h3>
            </div>
            
            <div class="menu-group-title">基础</div>
            <div class="sub-menu">
              <div class="menu-item active">概述</div>
              <div class="menu-item">快速开始</div>
              <div class="menu-item">认证机制</div>
            </div>
          </div>
          
          <!-- 中间内容区域 - Swagger UI -->
          <div class="wx-content">
            <div id="swagger-ui"></div>
          </div>
        </div>
        
        <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.10.3/swagger-ui-bundle.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.10.3/swagger-ui-standalone-preset.min.js"></script>
        <script>
          // 监控资源加载错误
          window.addEventListener('error', function(e) {
            console.error('资源加载错误:', e.target.src || e.target.href);
          }, true);
          
          console.log('页面加载完成，开始初始化Swagger UI');
          
          // 初始化 Swagger UI
          console.log('Initializing Swagger UI with URL:', window.location.origin + '/api/wedraw-docs/json');
          window.swaggerUi = SwaggerUIBundle({
            url: window.location.origin + '/api/wedraw-docs/json',
            dom_id: '#swagger-ui',
            presets: [
              SwaggerUIBundle.presets.apis,
              SwaggerUIStandalonePreset
            ],
            layout: 'BaseLayout',
            deepLinking: true,
            showExtensions: true,
            showCommonExtensions: true,
            explorer: true,
            filter: true,
            docExpansion: 'list',
            operationsSorter: 'alpha',
            tagsSorter: 'alpha',
            defaultModelsExpandDepth: 2,
            defaultModelExpandDepth: 2,
            tryItOutEnabled: true,
            displayRequestDuration: true,
            onComplete: function() {
              console.log('Swagger UI initialization complete');
            }
          });
          
          console.log('页面初始化完成，等待资源加载');
        </script>
      </body>
      </html>
      `;
      
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    });
    
    logger.info('WeDraw API文档系统初始化完成');
  } catch (error) {
    logger.error('WeDraw API文档系统初始化失败:', error);
    // 如果初始化失败，提供一个简单的回退页面
    app.get('/api/wedraw-docs', (req, res) => {
      res.status(500).json({
        code: 500,
        message: 'API文档系统初始化失败',
        error: error.message
      });
    });
  }
}

// 导出模块
try {
  module.exports = { setupWechatApiDocs, swaggerSpec };
} catch (error) {
  console.error('导出模块失败:', error);
  // 确保至少导出setupWechatApiDocs函数
  exports.setupWechatApiDocs = setupWechatApiDocs;
  exports.swaggerSpec = swaggerSpec;
}

console.log('WeDraw API文档模块已加载并准备就绪');