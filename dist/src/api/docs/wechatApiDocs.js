/**
 * WeDrawOS API文档中心 - 微信开发文档样式
 * 提供完整的API接口文档，采用微信开放平台文档风格设计
 */

const express = require('express');
const router = express.Router();
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUI = require('swagger-ui-express');
const path = require('path');
const logger = require('@core/utils/logger');

// 微信开发文档风格CSS样式 - 增强版3栏式布局
const wechatThemeCss = `
/* 微信开发文档风格 - 3栏式布局增强版 */
:root {
  --wx-primary-color: #07C160;
  --wx-background-color: #f5f5f5;
  --wx-card-background: #ffffff;
  --wx-text-primary: #333333;
  --wx-text-secondary: #666666;
  --wx-border-color: #e0e0e0;
  --wx-success-color: #49cc90;
  --wx-info-color: #61affe;
  --wx-warning-color: #fca130;
  --wx-danger-color: #f93e3e;
  --wx-dark-green: #06b156;
  --wx-light-green: #e8f5e9;
  --wx-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  line-height: 1.6;
  color: var(--wx-text-primary);
  background-color: var(--wx-background-color);
  font-size: 14px;
}

/* 隐藏默认的Swagger UI顶部栏 */
.swagger-ui .topbar {
  display: none;
}

/* 主容器样式 */
.swagger-ui .wrapper {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

/* API信息区域样式 */
.swagger-ui .info {
  background: var(--wx-card-background);
  padding: 32px;
  border-radius: 8px;
  margin-bottom: 32px;
  border: 1px solid var(--wx-border-color);
  box-shadow: var(--wx-shadow);
}

.swagger-ui .info h2 {
  color: var(--wx-primary-color);
  font-size: 28px;
  margin-bottom: 16px;
  font-weight: 600;
}

.swagger-ui .info p {
  color: var(--wx-text-secondary);
  font-size: 15px;
  line-height: 1.8;
  margin-bottom: 12px;
}

.swagger-ui .info a {
  color: var(--wx-primary-color);
  text-decoration: none;
}

.swagger-ui .info a:hover {
  text-decoration: underline;
}

/* 标签区域样式 */
.swagger-ui .tags-wrapper {
  margin-bottom: 32px;
}

.swagger-ui .tag {
  background-color: var(--wx-light-green);
  color: var(--wx-dark-green);
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 13px;
  margin-right: 12px;
  margin-bottom: 12px;
  display: inline-block;
  transition: all 0.2s ease;
  cursor: pointer;
  border: 1px solid transparent;
}

.swagger-ui .tag:hover {
  background-color: var(--wx-primary-color);
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* API操作块样式 */
.swagger-ui .opblock {
  background: var(--wx-card-background);
  border: 1px solid var(--wx-border-color);
  border-radius: 8px;
  margin-bottom: 24px;
  overflow: hidden;
  box-shadow: var(--wx-shadow);
  transition: all 0.2s ease;
}

.swagger-ui .opblock:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.swagger-ui .opblock .opblock-summary {
  background: #f8f9fa;
  border-bottom: 1px solid var(--wx-border-color);
  padding: 16px 20px;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
}

.swagger-ui .opblock .opblock-summary:hover {
  background: #e9ecef;
}

/* HTTP方法标签样式 */
.swagger-ui .opblock.opblock-get {
  border-left: 4px solid var(--wx-info-color);
}

.swagger-ui .opblock.opblock-post {
  border-left: 4px solid var(--wx-success-color);
}

.swagger-ui .opblock.opblock-put {
  border-left: 4px solid var(--wx-warning-color);
}

.swagger-ui .opblock.opblock-delete {
  border-left: 4px solid var(--wx-danger-color);
}

.swagger-ui .opblock .opblock-summary-method {
  font-size: 12px;
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: 600;
  min-width: 80px;
  text-align: center;
  color: white;
}

.swagger-ui .opblock-get .opblock-summary-method {
  background-color: var(--wx-info-color);
}

.swagger-ui .opblock-post .opblock-summary-method {
  background-color: var(--wx-success-color);
}

.swagger-ui .opblock-put .opblock-summary-method {
  background-color: var(--wx-warning-color);
}

.swagger-ui .opblock-delete .opblock-summary-method {
  background-color: var(--wx-danger-color);
}

.swagger-ui .opblock .opblock-summary-path {
  font-size: 15px;
  font-weight: 600;
  margin-left: 16px;
  color: var(--wx-text-primary);
}

.swagger-ui .opblock .opblock-summary-description {
  font-size: 14px;
  color: var(--wx-text-secondary);
  margin-left: 16px;
  font-weight: 400;
}

/* API详情内容 */
.swagger-ui .opblock-body {
  padding: 24px;
}

/* 标签页样式 */
.swagger-ui .tab {
  border-radius: 4px 4px 0 0;
  padding: 10px 20px;
  font-size: 14px;
  border-bottom: 2px solid transparent;
  margin-right: 8px;
  background-color: #f8f9fa;
  border: 1px solid var(--wx-border-color);
  border-bottom: none;
  margin-bottom: -1px;
  color: var(--wx-text-secondary);
}

.swagger-ui .tab.active {
  color: var(--wx-primary-color);
  border-bottom-color: var(--wx-primary-color);
  font-weight: 500;
  background-color: var(--wx-card-background);
}

/* 参数表格样式 */
.swagger-ui table.parameters {
  border: 1px solid var(--wx-border-color);
  border-radius: 4px;
  overflow: hidden;
  width: 100%;
  margin-top: 16px;
}

.swagger-ui table.parameters th {
  background-color: #f8f9fa;
  border-bottom: 1px solid var(--wx-border-color);
  padding: 14px 16px;
  text-align: left;
  font-weight: 600;
  color: var(--wx-text-primary);
  font-size: 13px;
}

.swagger-ui table.parameters td {
  padding: 14px 16px;
  border-bottom: 1px solid var(--wx-border-color);
  font-size: 14px;
  vertical-align: top;
}

.swagger-ui table.parameters tbody tr:last-child td {
  border-bottom: none;
}

.swagger-ui table.parameters tbody tr:hover {
  background-color: #f8f9fa;
}

/* 参数类型样式 */
.swagger-ui .parameter__name {
  color: var(--wx-text-primary);
  font-weight: 600;
  font-size: 14px;
}

.swagger-ui .parameter__type {
  color: var(--wx-info-color);
  font-size: 13px;
  background-color: #e3f2fd;
  padding: 2px 6px;
  border-radius: 3px;
}

.swagger-ui .parameter__in {
  color: var(--wx-warning-color);
  font-size: 13px;
  background-color: #fff3e0;
  padding: 2px 6px;
  border-radius: 3px;
}

.swagger-ui .parameter__required {
  color: var(--wx-danger-color);
  font-size: 13px;
  background-color: #ffebee;
  padding: 2px 6px;
  border-radius: 3px;
}

/* 按钮样式 */
.swagger-ui .btn {
  background-color: var(--wx-primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 20px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
}

.swagger-ui .btn:hover {
  background-color: var(--wx-dark-green);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(7, 193, 96, 0.3);
}

.swagger-ui .btn.cancel {
  background-color: #999999;
}

.swagger-ui .btn.cancel:hover {
  background-color: #888888;
}

/* 代码区域样式 */
.swagger-ui .highlight-code {
  background-color: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
  padding: 20px;
  font-family: 'SF Mono', Monaco, 'Inconsolata', 'Roboto Mono', Consolas, 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  overflow-x: auto;
  margin-top: 16px;
}

.swagger-ui .CodeMirror {
  font-family: 'SF Mono', Monaco, 'Inconsolata', 'Roboto Mono', Consolas, 'Courier New', monospace;
  font-size: 13px;
  border-radius: 6px;
}

/* 响应示例样式 */
.swagger-ui .responses-inner {
  margin-top: 16px;
}

.swagger-ui .response-col_status {
  font-weight: 600;
  color: var(--wx-success-color);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .swagger-ui .wrapper {
    padding: 12px;
  }
  
  .swagger-ui .info {
    padding: 24px;
  }
  
  .swagger-ui .info h2 {
    font-size: 24px;
  }
  
  .swagger-ui .opblock-body {
    padding: 16px;
  }
  
  .swagger-ui .opblock .opblock-summary {
    padding: 12px;
    flex-wrap: wrap;
  }
  
  .swagger-ui .opblock .opblock-summary-method {
    min-width: 70px;
    padding: 6px 12px;
    font-size: 12px;
  }
  
  .swagger-ui .opblock .opblock-summary-path {
    margin-left: 8px;
    font-size: 13px;
  }
  
  .swagger-ui .tag {
    padding: 5px 12px;
    font-size: 12px;
    margin-right: 8px;
    margin-bottom: 8px;
  }
}

/* 加载状态 */
.swagger-ui .loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px;
  color: var(--wx-text-secondary);
}

/* 错误状态 */
.swagger-ui .error-container {
  background-color: #ffebee;
  border: 1px solid #ffcdd2;
  border-radius: 6px;
  padding: 24px;
  color: #c62828;
  margin: 20px 0;
  text-align: center;
}

/* 认证区域样式 */
.swagger-ui .auth-wrapper {
  background: var(--wx-card-background);
  border: 1px solid var(--wx-border-color);
  border-radius: 6px;
  padding: 20px;
  margin-bottom: 24px;
}

/* 搜索框样式 */
.swagger-ui .search-box {
  margin-bottom: 24px;
}

.swagger-ui .search-box .input {
  border: 1px solid var(--wx-border-color);
  border-radius: 4px;
  padding: 10px 16px;
  width: 100%;
  font-size: 14px;
}

.swagger-ui .search-box .input:focus {
  outline: none;
  border-color: var(--wx-primary-color);
  box-shadow: 0 0 0 2px rgba(7, 193, 96, 0.2);
}
`;

// Swagger 配置选项
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'WeDrawOS API接口文档中心',
      version: '2.0.0',
      description: `WeDrawOS客服系统是一个完整的客户服务管理平台，提供会话管理、消息处理、标签系统、通知功能、客户反馈、工作时间管理等核心功能。\n\n本接口文档采用微信开放平台文档风格设计，提供所有开放接口的详细说明，包括请求参数、返回值和错误码等信息。`,
      contact: {
        name: 'WeDraw开发团队',
        email: 'dev@wedraw.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: '开发环境'
      },
      {
        url: 'https://api.wedraw.com',
        description: '生产环境'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT认证令牌'
        },
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-KEY',
          description: 'API密钥认证'
        }
      },
      responses: {
        200: {
          description: '请求成功',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  code: { type: 'integer', example: 0 },
                  message: { type: 'string', example: '操作成功' },
                  data: { type: 'object' },
                  timestamp: { type: 'integer', example: 1634567890123 }
                }
              }
            }
          }
        },
        400: {
          description: '请求参数错误',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  code: { type: 'integer', example: 400 },
                  message: { type: 'string', example: '参数验证失败' },
                  errors: { type: 'object' },
                  timestamp: { type: 'integer', example: 1634567890123 }
                }
              }
            }
          }
        },
        401: {
          description: '未授权，请登录',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  code: { type: 'integer', example: 401 },
                  message: { type: 'string', example: '认证失败' },
                  timestamp: { type: 'integer', example: 1634567890123 }
                }
              }
            }
          }
        },
        403: {
          description: '拒绝访问，权限不足',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  code: { type: 'integer', example: 403 },
                  message: { type: 'string', example: '权限不足' },
                  timestamp: { type: 'integer', example: 1634567890123 }
                }
              }
            }
          }
        },
        404: {
          description: '请求的资源不存在',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  code: { type: 'integer', example: 404 },
                  message: { type: 'string', example: '资源不存在' },
                  timestamp: { type: 'integer', example: 1634567890123 }
                }
              }
            }
          }
        },
        500: {
          description: '服务器内部错误',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  code: { type: 'integer', example: 500 },
                  message: { type: 'string', example: '服务器内部错误' },
                  timestamp: { type: 'integer', example: 1634567890123 }
                }
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: '管理员管理',
        description: '管理端管理员相关接口，包括登录、权限管理等'
      },
      {
        name: '会话管理',
        description: '客服会话的创建、查询、更新和删除等接口'
      },
      {
        name: '消息系统',
        description: '各类消息的发送、接收、查询和管理接口'
      },
      {
        name: '标签系统',
        description: '标签的创建、查询和应用到会话或消息的接口'
      },
      {
        name: '通知中心',
        description: '用户通知的发送和管理接口'
      },
      {
        name: '客户反馈',
        description: '客户反馈的提交、处理和跟踪接口'
      },
      {
        name: '工作时间管理',
        description: '客服排班、打卡和休息管理接口'
      },
      {
        name: '工作日志',
        description: '客服工作活动记录和统计接口'
      },
      {
        name: '企业微信接口',
        description: '企业微信和公众号相关的功能接口'
      },
      {
        name: '商品服务',
        description: '商品信息和分类查询相关接口'
      },
      {
        name: '订单服务',
        description: '订单状态查询和管理相关接口'
      },
      {
        name: '系统服务',
        description: '系统配置、健康检查等通用接口'
      }
    ],
    security: [
      {
        BearerAuth: []
      }
    ]
  },
  // 使用绝对路径扫描API路由文件
  apis: [
    path.join(__dirname, '../buyer-api/routes/**/*.js'),
    path.join(__dirname, '../seller-api/routes/**/*.js'),
    path.join(__dirname, '../admin-api/routes/**/*.js'),
    path.join(__dirname, '../im-api/routes/**/*.js'),
    path.join(__dirname, '../common-api/routes/**/*.js'),
    path.join(__dirname, '../seller-api/wechat/routes/**/*.js'),
    path.join(__dirname, '../admin-api/wechat-work/routes/**/*.js')
  ]
};

// 生成Swagger文档
const swaggerSpec = swaggerJsdoc(options);

/**
 * 配置Swagger API文档路由
 * @param {Object} app - Express应用实例
 */
function setupWechatApiDocs(app) {
  try {
    // 使用swagger-ui-express中间件提供API文档页面
    app.use('/api/wechat-docs', swaggerUI.serve, swaggerUI.setup(swaggerSpec, {
      customCss: wechatThemeCss,
      customSiteTitle: 'WeDrawOS API文档中心 - 微信开发文档风格',
      swaggerOptions: {
        deepLinking: true,
        displayRequestDuration: true,
        showExtensions: true,
        showCommonExtensions: true,
        persistAuthorization: true,
        // 分类显示
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
        // 文档展开方式
        docExpansion: 'list',
        // 过滤功能
        filter: true,
        // 显示操作ID
        displayOperationId: true,
        // 模型展开深度
        defaultModelsExpandDepth: 2,
        defaultModelExpandDepth: 2
      }
    }));
    
    // 提供JSON格式的API文档
    app.get('/api/wechat-docs.json', (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.json(swaggerSpec);
    });
    
    // 添加调试路由
    app.get('/api/wechat-docs/debug', (req, res) => {
      try {
        const hasPaths = swaggerSpec.paths && Object.keys(swaggerSpec.paths).length > 0;
        const pathCount = hasPaths ? Object.keys(swaggerSpec.paths).length : 0;
        
        res.json({
          success: true,
          swaggerSpec: {
            openapi: swaggerSpec.openapi,
            info: swaggerSpec.info,
            hasPaths: hasPaths,
            pathCount: pathCount,
            paths: Object.keys(swaggerSpec.paths || {}),
            tags: swaggerSpec.tags || [],
            components: swaggerSpec.components || {}
          }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });
    
    logger.info('微信开发文档风格API文档初始化完成');
    logger.info(`API文档地址: http://localhost:${process.env.PORT || 3000}/api/wechat-docs`);
    
  } catch (error) {
    logger.error('微信开发文档风格API文档初始化失败:', error);
  }
}

module.exports = {
  setupWechatApiDocs,
  swaggerSpec
};