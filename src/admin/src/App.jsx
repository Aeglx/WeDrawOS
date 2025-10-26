import React from 'react';
import { ConfigProvider, Layout } from 'antd';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import zhCN from 'antd/locale/zh_CN';
import 'dayjs/locale/zh-cn';
import dayjs from 'dayjs';

// 导入页面组件
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminList from './pages/admin/AdminList';
import UserList from './pages/user/UserList';
import ProductList from './pages/product/ProductList';
import OrderList from './pages/order/OrderList';
import Statistics from './pages/statistics/Statistics';
import NotFound from './pages/NotFound';
// 占位页面组件 - 实际项目中应替换为真实组件
import PlaceholderPage from './pages/PlaceholderPage';
import VirtualOrder from './pages/order/VirtualOrder';
import RechargeRecord from './pages/member/member-manage/deposit/RechargeRecord';
import WithdrawApply from './pages/member/member-manage/deposit/WithdrawApply';
import PointsHistory from './pages/member/member-manage/points/PointsHistory';
import MemberFund from './pages/member/member-manage/deposit/MemberFund';
import RecycleBin from './pages/recyclebin/RecycleBin';
import ReviewList from './pages/review/ReviewList';

// 导入布局组件
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';

// 设置中文环境
dayjs.locale('zh-cn');

const App = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Layout className="app-container">
          <Routes>
            {/* 登录页面 */}
            <Route path="/login" element={<Login />} />
            
            {/* 受保护的路由，需要登录 */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<MainLayout />}>
                {/* 仪表盘 */}
                <Route index element={<Dashboard />} />
                
                {/* 测试路由 - 直接访问会员评价 */}
                <Route path="/review-test" element={<ReviewList />} />
                
                {/* 会员相关路由 */}
                <Route path="/member/member-manage/member-list" element={<UserList />} />
                <Route path="/member/member-manage/recycle-bin" element={<RecycleBin />} />
                <Route path="/member/member-manage/comment/member-comment" element={<ReviewList />} />
                <Route path="/member/member-manage/points/points-history" element={<PointsHistory />} />
                <Route path="/member/member-manage/deposit/member-fund" element={<MemberFund />} />
                <Route path="/member/member-manage/deposit/recharge-record" element={<RechargeRecord />} />
                <Route path="/member/member-manage/deposit/withdraw-apply" element={<WithdrawApply />} />
                
                {/* 订单相关路由 */}
                <Route path="/order/product-order" element={<OrderList />} />
                <Route path="/order/virtual-order" element={<VirtualOrder />} />
                <Route path="/order/after-sale/after-sale-manage" element={<PlaceholderPage title="售后管理" />} />
                <Route path="/order/after-sale/trade-complaint" element={<PlaceholderPage title="交易投诉" />} />
                <Route path="/order/after-sale/after-sale-reason" element={<PlaceholderPage title="售后原因" />} />
                <Route path="/order/flow/collection-record" element={<PlaceholderPage title="收款记录" />} />
                <Route path="/order/flow/refund-flow" element={<PlaceholderPage title="退款流水" />} />
                
                {/* 商品相关路由 */}
                <Route path="/product/product-manage/platform-product" element={<ProductList />} />
                <Route path="/product/product-manage/product-audit" element={<PlaceholderPage title="商品审核" />} />
                <Route path="/product/product-manage/relation-manage" element={<PlaceholderPage title="关联管理" />} />
                <Route path="/product/product-manage/product-category" element={<PlaceholderPage title="商品分类" />} />
                <Route path="/product/product-manage/brand-list" element={<PlaceholderPage title="品牌列表" />} />
                <Route path="/product/product-manage/spec-list" element={<PlaceholderPage title="规格列表" />} />
                <Route path="/product/product-manage/unit" element={<PlaceholderPage title="计量单位" />} />
                
                {/* 促销相关路由 */}
                <Route path="/promotion/promotion-manage/coupon" element={<PlaceholderPage title="优惠券" />} />
                <Route path="/promotion/promotion-manage/coupon-activity" element={<PlaceholderPage title="券活动" />} />
                <Route path="/promotion/promotion-manage/full-discount" element={<PlaceholderPage title="满额活动" />} />
                <Route path="/promotion/promotion-manage/flash-sale" element={<PlaceholderPage title="秒杀活动" />} />
                <Route path="/promotion/promotion-manage/group-buy" element={<PlaceholderPage title="拼团活动" />} />
                <Route path="/promotion/promotion-manage/bargain" element={<PlaceholderPage title="砍价活动" />} />
                <Route path="/promotion/promotion-manage/live-stream/live-manage" element={<PlaceholderPage title="直播管理" />} />
                <Route path="/promotion/promotion-manage/point-activity/point-product" element={<PlaceholderPage title="积分商品" />} />
                <Route path="/promotion/promotion-manage/point-activity/point-category" element={<PlaceholderPage title="积分分类" />} />
                
                {/* 店铺相关路由 */}
                <Route path="/shop/shop-manage/shop-list" element={<PlaceholderPage title="店铺列表" />} />
                <Route path="/shop/shop-manage/shop-audit" element={<PlaceholderPage title="店铺审核" />} />
                <Route path="/shop/shop-manage/shop-settlement/shop-settlement" element={<PlaceholderPage title="店铺结算" />} />
                <Route path="/shop/shop-manage/shop-settlement/merchant-reconciliation" element={<PlaceholderPage title="商家对账" />} />
                
                {/* 运营相关路由 */}
                <Route path="/operation/floor-decoration/pc" element={<PlaceholderPage title="PC端装修" />} />
                <Route path="/operation/floor-decoration/mobile" element={<PlaceholderPage title="移动端装修" />} />
                <Route path="/operation/privacy-policy/privacy-policy" element={<PlaceholderPage title="隐私协议" />} />
                <Route path="/operation/distribution/distribution-setting" element={<PlaceholderPage title="分销设置" />} />
                <Route path="/operation/distribution/distribution-apply" element={<PlaceholderPage title="分销申请" />} />
                <Route path="/operation/distribution/distributor" element={<PlaceholderPage title="分销员" />} />
                <Route path="/operation/distribution/distribution-product" element={<PlaceholderPage title="分销商品" />} />
                <Route path="/operation/distribution/distribution-order" element={<PlaceholderPage title="分销订单" />} />
                <Route path="/operation/distribution/distribution-withdraw" element={<PlaceholderPage title="分销提现" />} />
                <Route path="/operation/article/article-manage" element={<PlaceholderPage title="文章管理" />} />
                <Route path="/operation/article/hot-search" element={<PlaceholderPage title="搜索热词" />} />
                <Route path="/operation/article/article-category" element={<PlaceholderPage title="文章分类" />} />
                <Route path="/operation/article/es-segment" element={<PlaceholderPage title="ES分词" />} />
                <Route path="/operation/feedback/feedback" element={<PlaceholderPage title="意见反馈" />} />
                <Route path="/operation/站内信/站内信" element={<PlaceholderPage title="站内信" />} />
                <Route path="/operation/sms/sms" element={<PlaceholderPage title="短信" />} />
                <Route path="/operation/wechat-official/basic/account-info" element={<PlaceholderPage title="账号信息" />} />
                <Route path="/operation/wechat-official/basic/fan-manage" element={<PlaceholderPage title="粉丝管理" />} />
                <Route path="/operation/wechat-official/basic/material-manage" element={<PlaceholderPage title="素材管理" />} />
                <Route path="/operation/wechat-official/message/template-message" element={<PlaceholderPage title="模板消息" />} />
                <Route path="/operation/wechat-official/message/subscription-notice" element={<PlaceholderPage title="订阅通知" />} />
                <Route path="/operation/wechat-official/message/chat-manage" element={<PlaceholderPage title="对话管理" />} />
                <Route path="/operation/wechat-official/message/custom-menu" element={<PlaceholderPage title="自定义菜单管理" />} />
                <Route path="/operation/wechat-work/external-group" element={<PlaceholderPage title="企业微信外部群群发" />} />
                <Route path="/operation/wechat-work/material-manage" element={<PlaceholderPage title="企业微信素材管理" />} />
                <Route path="/operation/wechat-work/send-statistics" element={<PlaceholderPage title="企业微信发送统计" />} />
                
                {/* 统计相关路由 */}
                <Route path="/statistics" element={<Statistics />} />
                <Route path="/statistics/member" element={<PlaceholderPage title="会员统计" />} />
                <Route path="/statistics/order" element={<PlaceholderPage title="订单统计" />} />
                <Route path="/statistics/product" element={<PlaceholderPage title="商品统计" />} />
                <Route path="/statistics/traffic" element={<PlaceholderPage title="流量统计" />} />
                
                {/* 设置相关路由 */}
                <Route path="/settings/user-manage/user-manage" element={<AdminList />} />
                <Route path="/settings/menu-manage" element={<PlaceholderPage title="菜单管理" />} />
                <Route path="/settings/department-manage" element={<PlaceholderPage title="部门管理" />} />
                <Route path="/settings/role-permission" element={<PlaceholderPage title="角色权限" />} />
                <Route path="/settings/system-setting/system-setting" element={<PlaceholderPage title="系统设置" />} />
                <Route path="/settings/system-setting/oss" element={<PlaceholderPage title="OSS资源" />} />
                <Route path="/settings/system-setting/region" element={<PlaceholderPage title="行政地区" />} />
                <Route path="/settings/system-setting/logistics" element={<PlaceholderPage title="物流公司" />} />
                <Route path="/settings/system-setting/wechat-message" element={<PlaceholderPage title="微信消息" />} />
                <Route path="/settings/system-setting/oauth" element={<PlaceholderPage title="信任登录" />} />
                <Route path="/settings/system-setting/payment" element={<PlaceholderPage title="支付设置" />} />
                <Route path="/settings/system-setting/captcha" element={<PlaceholderPage title="验证码" />} />
                <Route path="/settings/system-setting/sensitive-word" element={<PlaceholderPage title="敏感词" />} />
                <Route path="/settings/system-setting/app-version" element={<PlaceholderPage title="APP版本" />} />
                
                {/* 日志相关路由 */}
                <Route path="/logs/system-monitor" element={<PlaceholderPage title="系统监控" />} />
                <Route path="/logs/log-manage" element={<PlaceholderPage title="日志管理" />} />
              </Route>
            </Route>
            
            {/* 404页面 */}
            <Route path="/404" element={<NotFound />} />
            
            {/* 默认重定向到登录页 */}
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </Layout>
      </Router>
    </ConfigProvider>
  );
};

export default App;