import React, { useState } from 'react'
import { Layout, Menu, Avatar, Dropdown, Button } from 'antd'
import { Outlet, useNavigate } from 'react-router-dom'
import {
  HomeOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  GiftOutlined,
  DollarOutlined,
  BarChartOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MessageOutlined
} from '@ant-design/icons'
import './SellerLayout.css'

const { Header, Sider, Content } = Layout

export default function SellerLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()

  const sellerInfo = (() => {
    const s = localStorage.getItem('sellerInfo')
    return s ? JSON.parse(s) : { username: '商家' }
  })()

  const menuItems = [
    { key: '/', label: '首页', icon: <HomeOutlined /> },
    {
      key: '/goods', label: '商品', icon: <ShopOutlined />, children: [
        { key: '/goods/list', label: '商品列表' },
        { key: '/goods/publish', label: '发布商品' },
        { key: '/goods/brand', label: '品牌管理' },
        { key: '/goods/category', label: '分类管理' }
      ]
    },
    {
      key: '/orders', label: '订单', icon: <ShoppingCartOutlined />, children: [
        { key: '/orders/list', label: '订单列表' },
        { key: '/orders/after-sale', label: '售后服务' }
      ]
    },
    {
      key: '/promotion', label: '促销', icon: <GiftOutlined />, children: [
        { key: '/promotion/coupon', label: '优惠券' },
        { key: '/promotion/flash', label: '秒杀' },
        { key: '/promotion/full-discount', label: '满减' }
      ]
    },
    {
      key: '/finance', label: '财务', icon: <DollarOutlined />, children: [
        { key: '/finance/settlement', label: '结算管理' },
        { key: '/finance/bill', label: '对账单' }
      ]
    },
    {
      key: '/statistics', label: '统计', icon: <BarChartOutlined />, children: [
        { key: '/statistics/member', label: '会员统计' },
        { key: '/statistics/order', label: '订单统计' },
        { key: '/statistics/product', label: '商品统计' },
        { key: '/statistics/traffic', label: '流量统计' }
      ]
    },
    {
      key: '/settings', label: '设置', icon: <SettingOutlined />, children: [
        { key: '/settings/shop', label: '店铺设置' },
        { key: '/settings/staff', label: '员工管理' },
        { key: '/settings/role', label: '角色权限' }
      ]
    }
  ]

  const userMenuItems = [
    { key: 'profile', label: '个人中心' },
    { key: 'logout', label: '退出登录' }
  ]

  const onMenuClick = ({ key }) => {
    navigate(key)
  }

  return (
    <Layout className={collapsed ? 'seller-layout collapsed' : 'seller-layout'}>
      <Sider collapsible collapsed={collapsed} trigger={null} width={220} theme="dark">
        <div className="logo-container">
          <h1 className={`logo-title ${collapsed ? 'collapsed' : ''}`}>Seller</h1>
        </div>
        <Menu
          mode="inline"
          theme="dark"
          selectedKeys={[window.location.pathname]}
          onClick={onMenuClick}
          inlineCollapsed={collapsed}
          inlineIndent={20}
          items={menuItems}
        />
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
            <Button type="text" icon={<MessageOutlined />} className="header-btn" title="消息" />
            <Dropdown menu={{ items: userMenuItems }}>
              <div className="user-info">
                <Avatar className="user-avatar">{sellerInfo.username.charAt(0).toUpperCase()}</Avatar>
                <span>{sellerInfo.username}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content className="content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}