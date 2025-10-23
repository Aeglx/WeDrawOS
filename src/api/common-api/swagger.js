/**
 * Swagger API文档配置 - 微信文档风格（3栏式布局）
 * 用于自动生成API文档
 */

const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

// 读取微信文档风格的CSS内容
const wechatThemePath = path.join(__dirname, '../core/docs/wechat-theme.css');
let wechatThemeCss = '.swagger-ui .topbar { display: none; }'; // 默认简单样式

try {
  if (fs.existsSync(wechatThemePath)) {
    wechatThemeCss = fs.readFileSync(wechatThemePath, 'utf8');
  }
} catch (error) {
  console.log('未找到微信文档风格CSS文件，使用默认样式');
}

// 添加3栏式布局的HTML和JavaScript - 微信文档风格
const customHtml = `
<div class="wx-header">
  <div class="logo">WeDraw 开发平台</div>
  <div class="nav">
    <div class="nav-item active">API文档</div>
    <div class="nav-item">开发者工具</div>
    <div class="nav-item">接入指南</div>
    <div class="nav-item">常见问题</div>
  </div>
</div>

<div class="wx-container">
  <div class="wx-sidebar">
    <div class="sidebar-header">
      <h3>API分类</h3>
    </div>
    <div class="sidebar-menu" id="api-sidebar-menu">
      <!-- 动态生成的导航项 -->
    </div>
  </div>

  <div class="wx-content">
    <!-- Swagger内容将在这里加载 -->
    <div id="swagger-ui-container"></div>
  </div>

  <div class="wx-right-panel">
    <div class="panel-title">接口调试</div>
    <div class="panel-item">
      <label for="api-key">API Key</label>
      <input type="text" id="api-key" placeholder="请输入API密钥">
    </div>
    <div class="panel-item">
      <label for="access-token">Access Token</label>
      <input type="text" id="access-token" placeholder="请输入访问令牌">
    </div>
    <button class="wx-btn">保存配置</button>
    
    <div class="panel-title" style="margin-top: 30px;">快速链接</div>
    <div class="panel-item">
      <a href="#" style="font-size: 14px; color: #07c160; text-decoration: none;">查看接口调用统计</a>
    </div>
    <div class="panel-item">
      <a href="#" style="font-size: 14px; color: #07c160; text-decoration: none;">下载SDK示例代码</a>
    </div>
    <div class="panel-item">
      <a href="#" style="font-size: 14px; color: #07c160; text-decoration: none;">反馈问题</a>
    </div>
  </div>
</div>

<script>
  // 等待Swagger UI加载完成
  window.addEventListener('load', function() {
    setTimeout(function() {
      generateSidebarMenu();
      setupThemeIntegration();
    }, 1000);
  });

  // 生成侧边栏菜单
  function generateSidebarMenu() {
    const sidebarMenu = document.getElementById('api-sidebar-menu');
    const tags = document.querySelectorAll('.swagger-ui .tag h2');
    
    tags.forEach(tag => {
      const menuItem = document.createElement('div');
      menuItem.className = 'menu-item';
      menuItem.textContent = tag.textContent;
      menuItem.dataset.target = tag.textContent;
      
      menuItem.addEventListener('click', function() {
        // 移除所有活动状态
        document.querySelectorAll('.menu-item').forEach(item => {
          item.classList.remove('active');
        });
        // 添加当前活动状态
        this.classList.add('active');
        // 滚动到对应标签
        const targetTag = Array.from(document.querySelectorAll('.swagger-ui .tag h2'))
          .find(h2 => h2.textContent === this.textContent);
        if (targetTag) {
          targetTag.scrollIntoView({ behavior: 'smooth' });
        }
      });
      
      sidebarMenu.appendChild(menuItem);
    });
    
    // 默认激活第一个菜单
    if (sidebarMenu.firstChild) {
      sidebarMenu.firstChild.classList.add('active');
    }
  }

  // 设置主题集成
  function setupThemeIntegration() {
    // 移动Swagger内容到内容区域
    const swaggerContent = document.querySelector('.swagger-ui section');
    const swaggerContainer = document.getElementById('swagger-ui-container');
    
    if (swaggerContent && swaggerContainer) {
      swaggerContainer.appendChild(swaggerContent);
    }
    
    // 修复样式冲突
    document.querySelector('.swagger-ui').style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    
    // 监听操作区块展开/收起
    document.querySelectorAll('.opblock-summary-control').forEach(control => {
      control.addEventListener('click', function() {
        setTimeout(function() {
          // 修复展开后的样式
          const opblock = control.closest('.opblock');
          if (opblock.classList.contains('is-open')) {
            opblock.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
          }
        }, 100);
      });
    });
  }
</script>
`;

// 微信文档风格的Swagger配置选项
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'WeDraw API接口文档',
      description: '本接口文档提供WeDraw平台所有开放接口的详细说明，包括请求参数、返回值和错误码等信息。',
      version: '1.0.0',
      contact: {
        name: 'WeDraw开发团队',
        email: 'dev@wedraw.com'
      }
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: '本地开发环境'
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
      schemas: {
        SuccessResponse: {
          type: 'object',
          properties: {
            code: {
              type: 'number',
              example: 0
            },
            message: {
              type: 'string',
              example: '操作成功'
            },
            data: {
              type: 'object'
            },
            timestamp: {
              type: 'number',
              example: 1634567890123
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            code: {
              type: 'number',
              example: 500
            },
            message: {
              type: 'string',
              example: '服务器内部错误'
            },
            data: {
              type: 'object',
              nullable: true
            },
            timestamp: {
              type: 'number',
              example: 1634567890123
            }
          }
        }
      },
      // 通用响应模板
      responses: {
        200: {
          description: '请求成功',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/SuccessResponse'
              }
            }
          }
        },
        400: {
          description: '请求参数错误',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        401: {
          description: '未授权，请登录',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        403: {
          description: '拒绝访问，权限不足',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        404: {
          description: '请求的资源不存在',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        500: {
          description: '服务器内部错误',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      }
    },
    security: [{
      BearerAuth: []
    }]
  },
  apis: [
    './src/api/**/*.js',
    './src/api/**/*.yaml'
  ]
};

/**
 * 设置Swagger文档 - 微信文档风格
 * @param {Object} app - Express应用实例
 */
function setupSwagger(app) {
  // 生成Swagger文档
  const swaggerDocs = swaggerJsDoc(swaggerOptions);
  
  // 提供自定义CSS文件的访问路由
  app.get('/api-docs/wechat-theme.css', (req, res) => {
    res.setHeader('Content-Type', 'text/css');
    res.send(wechatThemeCss);
  });
  
  // 注册Swagger UI路由，应用微信文档风格（3栏式布局）
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs, {
    explorer: true,
    customCss: wechatThemeCss,
    customCssUrl: '/api-docs/wechat-theme.css',
    customHtml: customHtml,
    customSiteTitle: 'WeDraw API文档 - 微信文档风格',
    customfavIcon: 'https://res.wx.qq.com/a/wx_fed/assets/res/NTI4MWU5.ico',
    displayRequestDuration: true,
    showExtensions: true,
    showCommonExtensions: true,
    // 增强的标签排序 - 仿微信文档分类
    tagsSorter: (a, b) => {
      const tagOrder = {
        '公共接口': 1,
        '用户管理': 2,
        '商品管理': 3,
        '订单管理': 4,
        '支付接口': 5,
        '店铺管理': 6,
        '营销活动': 7,
        '数据分析': 8,
        '系统设置': 9
      };
      return (tagOrder[a] || 99) - (tagOrder[b] || 99);
    },
    // 操作排序 - 按HTTP方法优先级
    operationsSorter: (a, b) => {
      const methodOrder = { 'get': 1, 'post': 2, 'put': 3, 'delete': 4 };
      return (methodOrder[a.get('method')] || 99) - (methodOrder[b.get('method')] || 99);
    },
    // 过滤标签功能
    filter: true,
    // 深度链接支持
    deepLinking: true,
    // 显示请求持续时间
    displayRequestDuration: true,
    // 持久化授权信息
    persistAuthorization: true,
    // 模型展开深度
    defaultModelsExpandDepth: 1,
    defaultModelExpandDepth: 1,
    // 文档展开方式
    docExpansion: 'list',
    // 显示操作ID
    displayOperationId: true
  }));
  
  // 提供Swagger JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerDocs);
  });
  
  const PORT = process.env.PORT || 3001;
  console.log(`微信文档风格API文档（3栏式布局）已启动: http://localhost:${PORT}/api-docs`);
}

module.exports = {
  setupSwagger
};