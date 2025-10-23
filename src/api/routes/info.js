const express = require('express');
const router = express.Router();

/**
 * 服务信息路由
 */
router.get('/info', (req, res) => {
  res.status(200).json({
    name: 'WeDrawOS Customer Service API',
    version: '1.0.0',
    description: 'Customer service system API for WeDrawOS platform',
    status: 'running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * API文档信息
 */
router.get('/info/docs', (req, res) => {
  res.status(200).json({
    availableDocs: [
      {
        name: 'WeChat API Documentation',
        path: '/api/docs/wechat'
      }
    ]
  });
});

module.exports = router;