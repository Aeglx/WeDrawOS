const express = require('express');
const AIController = require('./aiController');
const router = express.Router();

// AI对话路由
router.post('/chat', AIController.chat);

// 健康检查路由
router.get('/health', AIController.healthCheck);

// 初始化模型路由（可选，用于手动触发模型加载）
router.post('/initialize', AIController.initialize);

// 释放资源路由（可选，用于手动释放模型）
router.post('/release', AIController.release);

module.exports = router;