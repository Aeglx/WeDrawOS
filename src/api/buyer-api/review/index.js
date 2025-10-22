/**
 * 评价模块入口
 */

const reviewController = require('./controllers/reviewController');
const reviewService = require('./services/reviewService');
const reviewRepository = require('./repositories/reviewRepository');
const reviewRoutes = require('./routes/reviewRoutes');

/**
 * 注册评价模块
 * @param {Object} app - Express应用实例
 */
function register(app) {
  // 注册评价相关路由
  app.use('/api/reviews', reviewRoutes);
}

module.exports = {
  register,
  controllers: {
    reviewController
  },
  services: {
    reviewService
  },
  repositories: {
    reviewRepository
  },
  routes: {
    reviewRoutes
  }
};