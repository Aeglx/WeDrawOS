const express = require('express');
const router = express.Router();

/**
 * 健康检查路由
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'WeDrawOS Customer Service API'
  });
});

/**
 * 详细健康检查（包含服务状态）
 */
router.get('/health/detail', async (req, res) => {
  try {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'WeDrawOS Customer Service API',
      details: {
        api: 'running',
        database: 'simulated',
        websocket: 'initializing'
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;