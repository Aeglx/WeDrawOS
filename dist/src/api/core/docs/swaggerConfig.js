/**
 * Swagger API文档配置 - 微信开发文档样式（3栏式）
 */

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUI = require('swagger-ui-express');
const path = require('path');

// 微信开发文档风格CSS样式 - 3栏式布局
const wechatThemeCss = `
/* 微信开发文档风格 - 3栏式布局 */
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
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.6;
  color: var(--wx-text-primary);
  background-color: var(--wx-background-color);
}

/* 隐藏默认的Swagger UI顶部栏 */
.swagger-ui .topbar {
  display: none;
}

/* API信息区域样式 */
.swagger-ui .info {
  background: var(--wx-card-background);
  padding: 24px;
  border-radius: 8px;
  margin-bottom: 24px;
  border: 1px solid var(--wx-border-color);
}

.swagger-ui .info h2 {
  color: var(--wx-primary-color);
  font-size: 24px;
  margin-bottom: 12px;
}

.swagger-ui .info p {
  color: var(--wx-text-secondary);
  font-size: 14px;
  line-height: 1.6;
}

/* API操作块样式 */
.swagger-ui .opblock {
  background: var(--wx-card-background);
  border: 1px solid var(--wx-border-color);
  border-radius: 8px;
  margin-bottom: 24px;
  overflow: hidden;
}

.swagger-ui .opblock .opblock-summary {
  background: #f8f9fa;
  border-bottom: 1px solid var(--wx-border-color);
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.swagger-ui .opblock .opblock-summary:hover {
  background: #e9ecef;
}

/* HTTP方法标签样式 */
.swagger-ui .opblock.opblock-get {
  border-color: var(--wx-info-color);
}

.swagger-ui .opblock.opblock-post {
  border-color: var(--wx-success-color);
}

.swagger-ui .opblock.opblock-put {
  border-color: var(--wx-warning-color);
}

.swagger-ui .opblock.opblock-delete {
  border-color: var(--wx-danger-color);
}

.swagger-ui .opblock .opblock-summary-method {
  font-size: 12px;
  padding: 6px 12px;
  border-radius: 4px;
  font-weight: 600;
  min-width: 70px;
  text-align: center;
}

.swagger-ui .opblock .opblock-summary-path {
  font-size: 14px;
  font-weight: 500;
  margin-left: 12px;
}

.swagger-ui .opblock .opblock-summary-description {
  font-size: 13px;
  color: var(--wx-text-secondary);
  margin-left: 12px;
}

/* API详情内容 */
.swagger-ui .opblock-body {
  padding: 20px;
}

/* 标签页样式 */
.swagger-ui .tab {
  border-radius: 4px 4px 0 0;
  padding: 8px 16px;
  font-size: 13px;
  border-bottom: 2px solid transparent;
}

.swagger-ui .tab.active {
  color: var(--wx-primary-color);
  border-bottom-color: var(--wx-primary-color);
  font-weight: 500;
}

/* 参数表格样式 */
.swagger-ui table.parameters {
  border: 1px solid var(--wx-border-color);
  border-radius: 4px;
  overflow: hidden;
}

.swagger-ui table.parameters th {
  background-color: #f8f9fa;
  border-bottom: 1px solid var(--wx-border-color);
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: var(--wx-text-primary);
}

.swagger-ui table.parameters td {
  padding: 12px;
  border-bottom: 1px solid var(--wx-border-color);
}

.swagger-ui table.parameters tbody tr:last-child td {
  border-bottom: none;
}

/* 参数类型样式 */
.swagger-ui .parameter__name {
  color: var(--wx-text-primary);
  font-weight: 600;
}

.swagger-ui .parameter__type {
  color: var(--wx-info-color);
  font-size: 12px;
}

.swagger-ui .parameter__in {
  color: var(--wx-warning-color);
  font-size: 12px;
}

.swagger-ui .parameter__required {
  color: var(--wx-danger-color);
  font-size: 12px;
}

/* 按钮样式 */
.swagger-ui .btn {
  background-color: var(--wx-primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.swagger-ui .btn:hover {
  background-color: #06b156;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
  border-radius: 4px;
  border: 1px solid #e9ecef;
  padding: 16px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .swagger-ui .info {
    padding: 20px;
  }
  
  .swagger-ui .info h2 {
    font-size: 24px;
  }
  
  .swagger-ui .opblock-body {
    padding: 15px;
  }
  
  .swagger-ui .opblock .opblock-summary {
    padding: 12px;
  }
  
  .swagger-ui .opblock .opblock-summary-method {
    min-width: 70px;
    padding: 6px 12px;
    font-size: 12px;
  }
}

/* 加载状态 */
.swagger-ui .loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: var(--wx-text-secondary);
}

/* 错误状态 */
.swagger-ui .error-container {
  background-color: #ffebee;
  border: 1px solid #ffcdd2;
  border-radius: 4px;
  padding: 20px;
  color: #c62828;
  margin: 20px 0;
  text-align: center;
}

/* 标签样式 */
.swagger-ui .tag {
  background-color: #e8f5e9;
  color: #2e7d32;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  margin-right: 8px;
  display: inline-block;
  margin-bottom: 8px;
}
`;

// Swagger 配置选项
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'WeDraw API接口文档',
      version: '1.0.0',
      description: '本接口文档提供WeDraw平台所有开放接口的详细说明，包括请求参数、返回值和错误码等信息。',
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
    }
  },
  // 使用绝对路径扫描API路由文件
  apis: [
    path.join(__dirname, '../../buyer-api/routes/**/*.js'),
    path.join(__dirname, '../../seller-api/routes/**/*.js'),
    path.join(__dirname, '../../admin-api/routes/**/*.js'),
    path.join(__dirname, '../../im-api/routes/**/*.js'),
    path.join(__dirname, '../../common-api/routes/**/*.js')
  ]
};

// 生成Swagger文档
const swaggerSpec = swaggerJsdoc(options);

/**
 * 配置Swagger API文档路由
 * @param {Object} app - Express应用实例
 */
function setupSwagger(app) {
  // 使用swagger-ui-express中间件提供API文档页面
  app.use('/api/docs', swaggerUI.serve, swaggerUI.setup(swaggerSpec, {
    customCss: wechatThemeCss,
    customSiteTitle: 'WeDraw API文档中心',
    swaggerOptions: {
      deepLinking: true,
      displayRequestDuration: true,
      showExtensions: true,
      showCommonExtensions: true,
      persistAuthorization: true,
      // 分类显示
      tagsSorter: 'alpha',
      operationsSorter: 'alpha'
    }
  }));
  
  // 提供JSON格式的API文档
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.json(swaggerSpec);
  });
  
  // 添加调试路由
  app.get('/api/docs/debug', (req, res) => {
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
          tags: swaggerSpec.tags || []
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
}

module.exports = { setupSwagger, swaggerSpec };