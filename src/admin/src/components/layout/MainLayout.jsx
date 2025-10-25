import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Button } from 'antd';
import { Outlet } from 'react-router-dom';
import { 
  HomeOutlined, 
  UserOutlined, 
  ShopOutlined, 
  ShoppingCartOutlined, 
  BarChartOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  GiftOutlined,
  DollarOutlined,
  ShopOutlined as ShoppingBagOutlined,
  FileTextOutlined,
  StarOutlined,
  WalletOutlined,
  DeleteOutlined,
  MessageOutlined,
  UnorderedListOutlined,
  CarOutlined,
  TagOutlined,
  ThunderboltOutlined,
  ShoppingOutlined,
  PieChartOutlined,
  MenuOutlined,
  ApartmentOutlined,
  CodeOutlined,
  FlagOutlined,
  EditOutlined,
  CommentOutlined,
  PhoneOutlined,
  WechatOutlined,
  CompassOutlined,
  MonitorOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './MainLayout.css';

const { Header, Sider, Content } = Layout;

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  // 处理菜单点击
  const handleMenuClick = (e) => {
    navigate(e.key);
  };

  // 处理登出
  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminInfo');
    navigate('/login');
  };

  // 头像下拉菜单
  const userMenuItems = [
    {
      key: '1',
      label: (
        <a onClick={() => navigate('/profile')}>个人设置</a>
      ),
    },
    {
      key: '2',
      label: (
        <a onClick={handleLogout}>退出登录</a>
      ),
    },
  ];

  // 获取管理员信息
  const getAdminInfo = () => {
    const adminInfo = localStorage.getItem('adminInfo');
    return adminInfo ? JSON.parse(adminInfo) : { username: '管理员' };
  };

  const adminInfo = getAdminInfo();

  return (
    <Layout className="main-layout">
      <Sider trigger={null} collapsible collapsed={collapsed} width={128}>
        <div className="logo-container">
          <h1 className={`logo-title ${collapsed ? 'collapsed' : ''}`}>
            WeDrawOS
          </h1>
        </div>
        <Menu
            mode="inline"
            theme="dark"
            selectedKeys={[window.location.pathname]}
            onClick={handleMenuClick}
            inlineCollapsed={collapsed}
            inlineIndent={20}
          >
            <Menu.Item key="/" icon={<HomeOutlined />}>
              仪表盘
            </Menu.Item>
            
            {/* 会员 */}
            <Menu.SubMenu key="/member" title="会员" icon={<UserOutlined />}>
              <Menu.SubMenu key="/member/member-manage" title="会员管理">
                <Menu.Item key="/member/member-manage/member-list">会员列表</Menu.Item>
                <Menu.Item key="/member/member-manage/recycle-bin">回收站</Menu.Item>
                <Menu.SubMenu key="/member/member-manage/comment" title="评价">
                  <Menu.Item key="/member/member-manage/comment/member-comment">会员评价</Menu.Item>
                </Menu.SubMenu>
                <Menu.SubMenu key="/member/member-manage/points" title="积分">
                  <Menu.Item key="/member/member-manage/points/points-history">积分历史</Menu.Item>
                </Menu.SubMenu>
                <Menu.SubMenu key="/member/member-manage/deposit" title="预存款">
                  <Menu.Item key="/member/member-manage/deposit/member-fund">会员资金</Menu.Item>
                  <Menu.Item key="/member/member-manage/deposit/recharge-record">充值记录</Menu.Item>
                  <Menu.Item key="/member/member-manage/deposit/withdraw-apply">提现申请</Menu.Item>
                </Menu.SubMenu>
              </Menu.SubMenu>
            </Menu.SubMenu>
            
            {/* 订单 */}
            <Menu.SubMenu key="/order" title="订单" icon={<ShoppingCartOutlined />}>
              <Menu.Item key="/order/product-order">商品订单</Menu.Item>
              <Menu.Item key="/order/virtual-order">虚拟订单</Menu.Item>
              <Menu.SubMenu key="/order/after-sale" title="售后">
                <Menu.Item key="/order/after-sale/after-sale-manage">售后管理</Menu.Item>
                <Menu.Item key="/order/after-sale/trade-complaint">交易投诉</Menu.Item>
                <Menu.Item key="/order/after-sale/after-sale-reason">售后原因</Menu.Item>
              </Menu.SubMenu>
              <Menu.SubMenu key="/order/flow" title="流水">
                <Menu.Item key="/order/flow/collection-record">收款记录</Menu.Item>
                <Menu.Item key="/order/flow/refund-flow">退款流水</Menu.Item>
              </Menu.SubMenu>
            </Menu.SubMenu>
            
            {/* 商品 */}
            <Menu.SubMenu key="/product" title="商品" icon={<ShopOutlined />}>
              <Menu.SubMenu key="/product/product-manage" title="商品管理">
                <Menu.Item key="/product/product-manage/platform-product">平台商品</Menu.Item>
                <Menu.Item key="/product/product-manage/product-audit">商品审核</Menu.Item>
                <Menu.Item key="/product/product-manage/relation-manage">关联管理</Menu.Item>
                <Menu.Item key="/product/product-manage/product-category">商品分类</Menu.Item>
                <Menu.Item key="/product/product-manage/brand-list">品牌列表</Menu.Item>
                <Menu.Item key="/product/product-manage/spec-list">规格列表</Menu.Item>
                <Menu.Item key="/product/product-manage/unit">计量单位</Menu.Item>
              </Menu.SubMenu>
            </Menu.SubMenu>
            
            {/* 促销 */}
            <Menu.SubMenu key="/promotion" title="促销" icon={<GiftOutlined />}>
              <Menu.SubMenu key="/promotion/promotion-manage" title="促销管理">
                <Menu.Item key="/promotion/promotion-manage/coupon">优惠券</Menu.Item>
                <Menu.Item key="/promotion/promotion-manage/coupon-activity">券活动</Menu.Item>
                <Menu.Item key="/promotion/promotion-manage/full-discount">满额活动</Menu.Item>
                <Menu.Item key="/promotion/promotion-manage/flash-sale">秒杀活动</Menu.Item>
                <Menu.Item key="/promotion/promotion-manage/group-buy">拼团活动</Menu.Item>
                <Menu.Item key="/promotion/promotion-manage/bargain">砍价活动</Menu.Item>
                <Menu.SubMenu key="/promotion/promotion-manage/live-stream" title="直播管理">
                  <Menu.Item key="/promotion/promotion-manage/live-stream/live-manage">直播管理</Menu.Item>
                </Menu.SubMenu>
                <Menu.SubMenu key="/promotion/promotion-manage/point-activity" title="积分活动">
                  <Menu.Item key="/promotion/promotion-manage/point-activity/point-product">积分商品</Menu.Item>
                  <Menu.Item key="/promotion/promotion-manage/point-activity/point-category">积分分类</Menu.Item>
                </Menu.SubMenu>
              </Menu.SubMenu>
            </Menu.SubMenu>
            
            {/* 店铺 */}
            <Menu.SubMenu key="/shop" title="店铺" icon={<ShoppingBagOutlined />}>
              <Menu.SubMenu key="/shop/shop-manage" title="店铺管理">
                <Menu.Item key="/shop/shop-manage/shop-list">店铺列表</Menu.Item>
                <Menu.Item key="/shop/shop-manage/shop-audit">店铺审核</Menu.Item>
                <Menu.SubMenu key="/shop/shop-manage/shop-settlement" title="店铺结算">
                  <Menu.Item key="/shop/shop-manage/shop-settlement/shop-settlement">店铺结算</Menu.Item>
                  <Menu.Item key="/shop/shop-manage/shop-settlement/merchant-reconciliation">商家对账</Menu.Item>
                </Menu.SubMenu>
              </Menu.SubMenu>
            </Menu.SubMenu>
            
            {/* 运营 */}
            <Menu.SubMenu key="/operation" title="运营" icon={<DollarOutlined />}>
              <Menu.SubMenu key="/operation/floor-decoration" title="楼层装修">
                <Menu.Item key="/operation/floor-decoration/pc">PC端</Menu.Item>
                <Menu.Item key="/operation/floor-decoration/mobile">移动端</Menu.Item>
              </Menu.SubMenu>
              <Menu.SubMenu key="/operation/privacy-policy" title="隐私协议">
                <Menu.Item key="/operation/privacy-policy/privacy-policy">隐私协议</Menu.Item>
              </Menu.SubMenu>
              <Menu.SubMenu key="/operation/distribution" title="分销管理">
                <Menu.Item key="/operation/distribution/distribution-setting">分销设置</Menu.Item>
                <Menu.Item key="/operation/distribution/distribution-apply">分销申请</Menu.Item>
                <Menu.Item key="/operation/distribution/distributor">分销员</Menu.Item>
                <Menu.Item key="/operation/distribution/distribution-product">分销商品</Menu.Item>
                <Menu.Item key="/operation/distribution/distribution-order">分销订单</Menu.Item>
                <Menu.Item key="/operation/distribution/distribution-withdraw">分销提现</Menu.Item>
              </Menu.SubMenu>
              <Menu.SubMenu key="/operation/article" title="文章管理">
                <Menu.Item key="/operation/article/article-manage">文章管理</Menu.Item>
                <Menu.Item key="/operation/article/hot-search">搜索热词</Menu.Item>
                <Menu.Item key="/operation/article/article-category">文章分类</Menu.Item>
                <Menu.Item key="/operation/article/es-segment">ES分词</Menu.Item>
              </Menu.SubMenu>
              <Menu.SubMenu key="/operation/feedback" title="意见反馈">
                <Menu.Item key="/operation/feedback/feedback">意见反馈</Menu.Item>
              </Menu.SubMenu>
              <Menu.SubMenu key="/operation/站内信" title="站内信">
                <Menu.Item key="/operation/站内信/站内信">站内信</Menu.Item>
              </Menu.SubMenu>
              <Menu.SubMenu key="/operation/sms" title="短信管理">
                <Menu.Item key="/operation/sms/sms">短信</Menu.Item>
              </Menu.SubMenu>
              <Menu.SubMenu key="/operation/wechat-official" title="公众号管理">
                <Menu.SubMenu key="/operation/wechat-official/basic" title="公众号基础管理">
                  <Menu.Item key="/operation/wechat-official/basic/account-info">账号信息</Menu.Item>
                  <Menu.Item key="/operation/wechat-official/basic/fan-manage">粉丝管理</Menu.Item>
                  <Menu.Item key="/operation/wechat-official/basic/material-manage">素材管理</Menu.Item>
                </Menu.SubMenu>
                <Menu.SubMenu key="/operation/wechat-official/message" title="公众号消息管理">
                  <Menu.Item key="/operation/wechat-official/message/template-message">模板消息</Menu.Item>
                  <Menu.Item key="/operation/wechat-official/message/subscription-notice">订阅通知</Menu.Item>
                  <Menu.Item key="/operation/wechat-official/message/chat-manage">对话管理</Menu.Item>
                  <Menu.Item key="/operation/wechat-official/message/custom-menu">自定义菜单管理</Menu.Item>
                </Menu.SubMenu>
              </Menu.SubMenu>
              <Menu.SubMenu key="/operation/wechat-work" title="企业微信管理">
                <Menu.Item key="/operation/wechat-work/external-group">企业微信外部群群发</Menu.Item>
                <Menu.Item key="/operation/wechat-work/material-manage">企业微信素材管理</Menu.Item>
                <Menu.Item key="/operation/wechat-work/send-statistics">企业微信发送统计</Menu.Item>
              </Menu.SubMenu>
            </Menu.SubMenu>
            
            {/* 统计 */}
            <Menu.SubMenu key="/statistics" title="统计" icon={<BarChartOutlined />}>
              <Menu.Item key="/statistics/member">会员统计</Menu.Item>
              <Menu.Item key="/statistics/order">订单统计</Menu.Item>
              <Menu.Item key="/statistics/product">商品统计</Menu.Item>
              <Menu.Item key="/statistics/traffic">流量统计</Menu.Item>
            </Menu.SubMenu>
            
            {/* 设置 */}
            <Menu.SubMenu key="/settings" title="设置" icon={<SettingOutlined />}>
              <Menu.SubMenu key="/settings/user-manage" title="用户管理">
                <Menu.Item key="/settings/user-manage/user-manage">用户管理</Menu.Item>
              </Menu.SubMenu>
              <Menu.Item key="/settings/menu-manage">菜单管理</Menu.Item>
              <Menu.Item key="/settings/department-manage">部门管理</Menu.Item>
              <Menu.Item key="/settings/role-permission">角色权限</Menu.Item>
              <Menu.SubMenu key="/settings/system-setting" title="系统设置">
                <Menu.Item key="/settings/system-setting/system-setting">系统设置</Menu.Item>
                <Menu.Item key="/settings/system-setting/oss">OSS资源</Menu.Item>
                <Menu.Item key="/settings/system-setting/region">行政地区</Menu.Item>
                <Menu.Item key="/settings/system-setting/logistics">物流公司</Menu.Item>
                <Menu.Item key="/settings/system-setting/wechat-message">微信消息</Menu.Item>
                <Menu.Item key="/settings/system-setting/oauth">信任登录</Menu.Item>
                <Menu.Item key="/settings/system-setting/payment">支付设置</Menu.Item>
                <Menu.Item key="/settings/system-setting/captcha">验证码</Menu.Item>
                <Menu.Item key="/settings/system-setting/sensitive-word">敏感词</Menu.Item>
                <Menu.Item key="/settings/system-setting/app-version">APP版本</Menu.Item>
              </Menu.SubMenu>
            </Menu.SubMenu>
            
            {/* 日志 */}
            <Menu.SubMenu key="/logs" title="日志" icon={<FileTextOutlined />}>
              <Menu.Item key="/logs/system-monitor">系统监控</Menu.Item>
              <Menu.Item key="/logs/log-manage">日志管理</Menu.Item>
            </Menu.SubMenu>
        </Menu>
      </Sider>
      <Layout className={collapsed ? 'sider-collapsed' : ''}>
        <Header className="header">
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            className="trigger"
          />
          <div className="header-right">
            <Dropdown menu={{ items: userMenuItems }}>
              <div className="user-info">
                <Avatar className="user-avatar">{adminInfo.username.charAt(0).toUpperCase()}</Avatar>
                <span>{adminInfo.username}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content>
          <div className="content-wrapper">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;