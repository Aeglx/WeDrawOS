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
import ProductAudit from './pages/product/ProductAudit';
import ProductCategory from './pages/product/ProductCategory';
import BrandList from './pages/product/BrandList';
import SpecList from './pages/product/SpecList';
import UnitList from './pages/product/UnitList';
import OrderList from './pages/order/OrderList';
import Statistics from './pages/statistics/Statistics';
import FlashSale from './pages/promotion/flash-sale/FlashSale';
import GroupBuy from './pages/promotion/group-buy/GroupBuy';
import Bargain from './pages/promotion/bargain/Bargain';
import LiveManage from './pages/promotion/live-stream/LiveManage';
import PointProduct from './pages/promotion/point-activity/PointProduct';
import AddPointProduct from './pages/promotion/point-activity/AddPointProduct';
import DesignatedPointProduct from './pages/promotion/point-activity/DesignatedPointProduct';
import NotFound from './pages/NotFound';
// 占位页面组件 - 实际项目中应替换为真实组件
import PlaceholderPage from './pages/PlaceholderPage';
import PrivacyPolicy from './pages/operation/privacy-policy/PrivacyPolicy';
import DistributionSetting from './pages/operation/distribution/DistributionSetting';
import DistributionApply from './pages/operation/distribution/DistributionApply';
import Distributor from './pages/operation/distribution/Distributor';

// 导入店铺相关组件
import ShopList from './pages/shop/ShopList';
import ShopReview from './pages/shop/ShopReview';
import ShopSettlement from './pages/shop/ShopSettlement';
import MerchantReconciliation from './pages/shop/MerchantReconciliation';
// 导入楼层装修组件
import FloorDecoration from './pages/floor/FloorDecoration';
import FloorDesigner from './pages/floor/FloorDesigner';
// 导入优惠券页面组件
import CouponList from './pages/promotion/coupon/CouponList';
import CouponActivity from './pages/promotion/coupon-activity/CouponActivity';
import FullDiscount from './pages/promotion/full-discount/FullDiscount';
import VirtualOrder from './pages/order/VirtualOrder';
import AfterSales from './pages/order/AfterSales';
import RechargeRecord from './pages/member/member-manage/deposit/RechargeRecord';
import WithdrawApply from './pages/member/member-manage/deposit/WithdrawApply';
import PointsHistory from './pages/member/member-manage/points/PointsHistory';
import PointCategory from './pages/member/member-manage/points/PointCategory';
import MemberFund from './pages/member/member-manage/deposit/MemberFund';
import RecycleBin from './pages/recyclebin/RecycleBin';
import ReviewList from './pages/review/ReviewList';
import AfterSaleReasons from './pages/order/after-sale/AfterSaleReasons';
import TradeComplaint from './pages/order/after-sale/TradeComplaint';
import CollectionRecord from './pages/order/flow/CollectionRecord';
import RefundFlow from './pages/order/after-sale/RefundFlow';

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
                <Route path="/order/after-sale/after-sale-manage" element={<AfterSales />} />
                <Route path="/order/after-sale/trade-complaint" element={<TradeComplaint />} />
                <Route path="/order/after-sale/after-sale-reason" element={<AfterSaleReasons />} />
                <Route path="/order/flow/collection-record" element={<CollectionRecord />} />
                <Route path="/order/flow/refund-flow" element={<RefundFlow />} />
                
                {/* 商品相关路由 */}
                <Route path="/product/product-manage/platform-product" element={<ProductList />} />
                <Route path="/product/product-manage/product-audit" element={<ProductAudit />} />
                <Route path="/product/relation-manage/product-category" element={<ProductCategory />} />
                <Route path="/product/relation-manage/brand-list" element={<BrandList />} />
                <Route path="/product/relation-manage/spec-list" element={<SpecList />} />
                <Route path="/product/relation-manage/unit" element={<UnitList />} />
                <Route path="/product/relation-manage" element={<PlaceholderPage title="关联管理" />} />
                
                {/* 促销相关路由 */}
                <Route path="/promotion/promotion-manage/coupon" element={<CouponList />} />
                <Route path="/promotion/promotion-manage/coupon-activity" element={<CouponActivity />} />
                <Route path="/promotion/promotion-manage/full-discount" element={<FullDiscount />} />
                <Route path="/promotion/promotion-manage/flash-sale" element={<FlashSale />} />
                <Route path="/promotion/promotion-manage/group-buy" element={<GroupBuy />} />
                <Route path="/promotion/promotion-manage/bargain" element={<Bargain />} />
                <Route path="/promotion/promotion-manage/live-stream/live-manage" element={<LiveManage />} />
                <Route path="/promotion/promotion-manage/point-activity/point-product" element={<PointProduct />} />
                <Route path="/promotion/promotion-manage/point-activity/add-point-product" element={<AddPointProduct />} />
                <Route path="/promotion/promotion-manage/point-activity/designated-point-product" element={<DesignatedPointProduct />} />
                <Route path="/promotion/promotion-manage/point-activity/point-category" element={<PointCategory />} />
                
                {/* 店铺相关路由 */}
                <Route path="/shop/shop-manage/shop-list" element={<ShopList />} />
                <Route path="/shop/shop-manage/shop-audit" element={<ShopReview />} />
                <Route path="/shop/shop-manage/shop-settlement/shop-settlement" element={<ShopSettlement />} />
                <Route path="/shop/shop-manage/shop-settlement/merchant-reconciliation" element={<MerchantReconciliation />} />
                
                {/* 运营相关路由 */}
                <Route path="/operation/floor-decoration/pc" element={<FloorDecoration />} />
            <Route path="/operation/floor-decoration/pc/designer" element={<FloorDesigner />} />
                <Route path="/operation/floor-decoration/mobile" element={<PlaceholderPage title="移动端装修" />} />
                <Route path="/operation/privacy-policy/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/operation/distribution/distribution-setting" element={<DistributionSetting />} />
                <Route path="/operation/distribution/distribution-apply" element={<DistributionApply />} />
                <Route path="/operation/distribution/distributor" element={<Distributor />} />
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