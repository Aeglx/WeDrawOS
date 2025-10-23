/**
 * 消息队列主题定义
 * 集中管理系统中所有的消息主题，便于维护和使用
 */

const MESSAGE_TOPICS = {
  // 用户相关消息
  USER: {
    REGISTERED: 'user.registered', // 用户注册成功
    LOGIN: 'user.login', // 用户登录
    LOGOUT: 'user.logout', // 用户登出
    PROFILE_UPDATED: 'user.profile.updated', // 用户信息更新
    PASSWORD_CHANGED: 'user.password.changed', // 密码修改
    VERIFICATION_REQUESTED: 'user.verification.requested', // 身份验证请求
    VERIFICATION_COMPLETED: 'user.verification.completed', // 身份验证完成
  },
  
  // 订单相关消息
  ORDER: {
    CREATED: 'order.created', // 订单创建
    PAID: 'order.paid', // 订单支付
    SHIPPED: 'order.shipped', // 订单发货
    DELIVERED: 'order.delivered', // 订单送达
    CANCELLED: 'order.cancelled', // 订单取消
    REFUNDED: 'order.refunded', // 订单退款
    REVIEWED: 'order.reviewed', // 订单评价
    STATUS_CHANGED: 'order.status.changed', // 订单状态变更
  },
  
  // 商品相关消息
  PRODUCT: {
    CREATED: 'product.created', // 商品创建
    UPDATED: 'product.updated', // 商品更新
    DELETED: 'product.deleted', // 商品删除
    STATUS_CHANGED: 'product.status.changed', // 商品状态变更
    STOCK_CHANGED: 'product.stock.changed', // 商品库存变更
    PRICE_CHANGED: 'product.price.changed', // 商品价格变更
  },
  
  // 店铺相关消息
  SHOP: {
    CREATED: 'shop.created', // 店铺创建
    UPDATED: 'shop.updated', // 店铺更新
    STATUS_CHANGED: 'shop.status.changed', // 店铺状态变更
    RATING_CHANGED: 'shop.rating.changed', // 店铺评分变更
  },
  
  // 支付相关消息
  PAYMENT: {
    CREATED: 'payment.created', // 支付创建
    SUCCESS: 'payment.success', // 支付成功
    FAILED: 'payment.failed', // 支付失败
    REFUNDED: 'payment.refunded', // 支付退款
    PROCESSING: 'payment.processing', // 支付处理中
  },
  
  // 营销活动相关消息
  MARKETING: {
    CAMPAIGN_CREATED: 'marketing.campaign.created', // 营销活动创建
    CAMPAIGN_UPDATED: 'marketing.campaign.updated', // 营销活动更新
    CAMPAIGN_STARTED: 'marketing.campaign.started', // 营销活动开始
    CAMPAIGN_ENDED: 'marketing.campaign.ended', // 营销活动结束
    COUPON_ISSUED: 'marketing.coupon.issued', // 优惠券发放
    COUPON_USED: 'marketing.coupon.used', // 优惠券使用
    DISCOUNT_APPLIED: 'marketing.discount.applied', // 折扣应用
  },
  
  // 系统相关消息
  SYSTEM: {
    HEALTH_CHECK: 'system.health.check', // 健康检查
    ERROR_LOGGED: 'system.error.logged', // 错误日志记录
    METRICS_COLLECTED: 'system.metrics.collected', // 指标收集
    CACHE_INVALIDATED: 'system.cache.invalidated', // 缓存失效
    BACKUP_COMPLETED: 'system.backup.completed', // 备份完成
  },
  
  // 通知相关消息
  NOTIFICATION: {
    SEND_EMAIL: 'notification.send.email', // 发送邮件
    SEND_SMS: 'notification.send.sms', // 发送短信
    SEND_PUSH: 'notification.send.push', // 发送推送通知
    SEND_SYSTEM_MESSAGE: 'notification.send.system.message', // 发送系统消息
  },
  
  // 搜索相关消息
  SEARCH: {
    PRODUCT_INDEXED: 'search.product.indexed', // 商品索引
    PRODUCT_REINDEXED: 'search.product.reindexed', // 商品重新索引
    PRODUCT_REMOVED: 'search.product.removed', // 商品从索引移除
    INDEX_REFRESHED: 'search.index.refreshed', // 索引刷新
  },
  
  // 数据统计相关消息
  STATISTICS: {
    VIEW_RECORDED: 'statistics.view.recorded', // 浏览记录
    CLICK_RECORDED: 'statistics.click.recorded', // 点击记录
    PURCHASE_RECORDED: 'statistics.purchase.recorded', // 购买记录
    REPORT_GENERATED: 'statistics.report.generated', // 报表生成
  },
  
  // 审核相关消息
  REVIEW: {
    PRODUCT_SUBMITTED: 'review.product.submitted', // 商品提交审核
    PRODUCT_APPROVED: 'review.product.approved', // 商品审核通过
    PRODUCT_REJECTED: 'review.product.rejected', // 商品审核拒绝
    SHOP_SUBMITTED: 'review.shop.submitted', // 店铺提交审核
    SHOP_APPROVED: 'review.shop.approved', // 店铺审核通过
    SHOP_REJECTED: 'review.shop.rejected', // 店铺审核拒绝
  },
};

/**
 * 获取主题的显示名称
 * @param {string} topic 主题键
 * @returns {string} 显示名称
 */
const getTopicDisplayName = (topic) => {
  const topicMap = {
    // 用户相关
    'user.registered': '用户注册',
    'user.login': '用户登录',
    'user.logout': '用户登出',
    'user.profile.updated': '用户资料更新',
    'user.password.changed': '密码修改',
    
    // 订单相关
    'order.created': '订单创建',
    'order.paid': '订单支付',
    'order.shipped': '订单发货',
    'order.delivered': '订单送达',
    'order.cancelled': '订单取消',
    
    // 商品相关
    'product.created': '商品创建',
    'product.updated': '商品更新',
    'product.deleted': '商品删除',
    
    // 默认返回主题本身
    default: topic,
  };
  
  return topicMap[topic] || topicMap.default;
};

/**
 * 检查是否是有效的消息主题
 * @param {string} topic 要检查的主题
 * @returns {boolean} 是否有效
 */
const isValidTopic = (topic) => {
  // 扁平化所有主题进行检查
  const flatTopics = Object.values(MESSAGE_TOPICS).flatMap(section => 
    Object.values(section)
  );
  
  return flatTopics.includes(topic);
};

module.exports = {
  MESSAGE_TOPICS,
  getTopicDisplayName,
  isValidTopic,
};