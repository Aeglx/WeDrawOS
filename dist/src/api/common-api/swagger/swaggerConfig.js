/**
 * Swagger API文档配置
 * 提供完整的API接口文档管理
 */

const path = require('path');
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const logger = require('@core/utils/logger');

/**
 * Swagger文档配置
 */
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '公共API服务接口文档',
      description: '提供跨模块调用的统一公共服务接口文档',
      version: '1.0.0',
      contact: {
        name: '系统管理员',
        email: 'admin@example.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: '/api/common',
        description: '公共API服务基础路径'
      },
      {
        url: '/api/v1/common',
        description: '公共API服务V1版本路径'
      }
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-KEY',
          description: 'API密钥认证'
        },
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT令牌认证'
        }
      },
      schemas: {
        ErrorResponse: {
          type: 'object',
          required: ['success', 'message', 'error'],
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: '操作失败'
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'VALIDATION_ERROR'
                },
                details: {
                  type: 'array',
                  items: {
                    type: 'object'
                  }
                }
              }
            }
          }
        },
        SuccessResponse: {
          type: 'object',
          required: ['success', 'message', 'data'],
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: '操作成功'
            },
            data: {
              type: 'object'
            }
          }
        },
        PaginationResponse: {
          type: 'object',
          required: ['success', 'message', 'data', 'pagination'],
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: '操作成功'
            },
            data: {
              type: 'array',
              items: {
                type: 'object'
              }
            },
            pagination: {
              type: 'object',
              properties: {
                page: {
                  type: 'integer',
                  example: 1
                },
                pageSize: {
                  type: 'integer',
                  example: 20
                },
                totalCount: {
                  type: 'integer',
                  example: 100
                },
                totalPages: {
                  type: 'integer',
                  example: 5
                }
              }
            }
          }
        },
        UserInfo: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: '1'
            },
            username: {
              type: 'string',
              example: 'user_1'
            },
            email: {
              type: 'string',
              example: 'user1@example.com'
            },
            phone: {
              type: 'string',
              example: '13800138001'
            },
            nickname: {
              type: 'string',
              example: '用户1'
            },
            avatar: {
              type: 'string',
              example: '/uploads/avatars/default.jpg'
            },
            roles: {
              type: 'array',
              items: {
                type: 'string'
              },
              example: ['user']
            },
            status: {
              type: 'string',
              example: 'active'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2023-01-01T00:00:00Z'
            }
          }
        },
        ProductInfo: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: '1'
            },
            name: {
              type: 'string',
              example: '商品1'
            },
            price: {
              type: 'number',
              example: 99.99
            },
            originalPrice: {
              type: 'number',
              example: 199.99
            },
            description: {
              type: 'string',
              example: '这是一个示例商品'
            },
            images: {
              type: 'array',
              items: {
                type: 'string'
              },
              example: ['/uploads/images/products/sample1.jpg', '/uploads/images/products/sample2.jpg']
            },
            stock: {
              type: 'integer',
              example: 100
            },
            sales: {
              type: 'integer',
              example: 0
            },
            categoryId: {
              type: 'integer',
              example: 1
            },
            shopId: {
              type: 'integer',
              example: 1
            },
            status: {
              type: 'string',
              example: 'active'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2023-01-01T00:00:00Z'
            }
          }
        },
        CategoryInfo: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1
            },
            name: {
              type: 'string',
              example: '数码产品'
            },
            parentId: {
              type: 'integer',
              example: 0
            },
            level: {
              type: 'integer',
              example: 1
            },
            icon: {
              type: 'string',
              example: '/icons/digital.svg'
            },
            sort: {
              type: 'integer',
              example: 1
            }
          }
        },
        OrderStatus: {
          type: 'object',
          properties: {
            orderId: {
              type: 'string',
              example: '1001'
            },
            status: {
              type: 'string',
              example: 'pending_payment'
            },
            statusText: {
              type: 'string',
              example: '待付款'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              example: '2023-01-01T00:00:00Z'
            }
          }
        }
      }
    },
    tags: [
      {
        name: '用户服务',
        description: '用户信息查询和权限验证相关接口'
      },
      {
        name: '商品服务',
        description: '商品信息和分类查询相关接口'
      },
      {
        name: '订单服务',
        description: '订单状态查询相关接口'
      },
      {
        name: '系统服务',
        description: '系统配置、健康检查等通用接口'
      },
      {
        name: '通知服务',
        description: '邮件和系统通知相关接口'
      },
      {
        name: '统计服务',
        description: '各类业务统计数据查询接口'
      }
    ],
    security: [
      {
        BearerAuth: []
      },
      {
        ApiKeyAuth: []
      }
    ]
  },
  // 指定API文档注释的路径
  apis: [
    path.join(__dirname, '../../../../src/api/routes/*.js'),
    path.join(__dirname, '../../../../src/api/controllers/*.js'),
    path.join(__dirname, '../../services/*.js')
  ]
};

/**
 * 创建Swagger文档
 */
const swaggerDocs = swaggerJSDoc(swaggerOptions);

/**
 * Swagger文档中间件
 * @param {Object} app - Express应用实例
 */
const setupSwagger = (app) => {
  try {
    // 设置Swagger UI路由
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs, {
      explorer: true,
      customCssUrl: '/swagger-ui-custom.css',
      customSiteTitle: '公共API服务接口文档',
      customfavIcon: '/favicon.ico'
    }));

    // 提供API文档JSON数据
    app.get('/api-docs.json', (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(swaggerDocs);
    });

    logger.info('Swagger API文档初始化完成');
    logger.info(`API文档地址: http://localhost:${process.env.PORT || 3000}/api-docs`);
  } catch (error) {
    logger.error('Swagger API文档初始化失败:', error);
  }
};

/**
 * 生成自定义Swagger UI CSS样式
 */
const customCss = `
.swagger-ui .topbar {
  background-color: #2c3e50;
}
.swagger-ui .info .title {
  color: #2c3e50;
}
.swagger-ui .scheme-container {
  background-color: #ecf0f1;
}
.swagger-ui .btn {
  background-color: #3498db;
}
.swagger-ui .btn:hover {
  background-color: #2980b9;
}
`;

/**
 * 导出Swagger配置
 */
module.exports = {
  swaggerOptions,
  swaggerDocs,
  setupSwagger,
  customCss
};