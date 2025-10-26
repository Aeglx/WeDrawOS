import React, { useState, useEffect } from 'react';
import { Card, Statistic, Row, Col, List, Tag, Avatar, Progress, Spin } from 'antd';
import { ShoppingCartOutlined, UserOutlined, OrderedListOutlined, DollarOutlined, CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import './Dashboard.css';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalProducts: 17579,
    totalUsers: 43755,
    totalOrders: 8928,
    totalSales: 1119,
    todoItems: [
      { name: '待审商品', count: 0 },
      { name: '待审核店铺', count: 0 },
      { name: '待处理投诉', count: 1 },
      { name: '待发货商品', count: 2 },
      { name: '待取货分别货', count: 0 },
      { name: '待审核分享', count: 0 }
    ],
    onlineCount: 1,
    visitorStats: {
      today: 52,
      yesterday: 61,
      last7Days: 341,
      last30Days: 1305
    },
    dailyStats: {
      orders: 1,
      salesAmount: 80.00,
      newComments: 0,
      newUsers: 11,
      newProducts: 0,
      newReviews: 0
    }
  });

  useEffect(() => {
    // 模拟加载数据
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="loading-wrapper">
        <Spin size="large" />
      </div>
    );
  }

  // 模拟图表数据
  const onlineData = [
    { time: '10:00', current: 5, lastWeek: 3 },
    { time: '10:30', current: 8, lastWeek: 5 },
    { time: '11:00', current: 6, lastWeek: 4 },
    { time: '11:30', current: 9, lastWeek: 6 },
    { time: '12:00', current: 7, lastWeek: 5 },
    { time: '12:30', current: 11, lastWeek: 8 },
    { time: '13:00', current: 9, lastWeek: 7 },
    { time: '13:30', current: 12, lastWeek: 9 },
    { time: '14:00', current: 15, lastWeek: 11 },
    { time: '14:30', current: 18, lastWeek: 13 },
    { time: '15:00', current: 12, lastWeek: 10 },
    { time: '15:30', current: 8, lastWeek: 6 },
    { time: '16:00', current: 14, lastWeek: 10 },
    { time: '16:30', current: 22, lastWeek: 15 },
    { time: '17:00', current: 17, lastWeek: 13 },
  ];

  const trafficTrendData = [
    { date: '2023-10-18', pv: 384, uv: 274 },
    { date: '2023-10-19', pv: 211, uv: 145 },
    { date: '2023-10-20', pv: 324, uv: 254 },
    { date: '2023-10-21', pv: 340, uv: 267 },
    { date: '2023-10-22', pv: 225, uv: 178 },
    { date: '2023-10-23', pv: 198, uv: 156 },
    { date: '2023-10-24', pv: 261, uv: 197 },
  ];

  const transactionTrendData = [
    { date: '2023-10-18', amount: 3442 },
    { date: '2023-10-19', amount: 2134 },
    { date: '2023-10-20', amount: 0 },
    { date: '2023-10-21', amount: 1986 },
    { date: '2023-10-22', amount: 6789 },
    { date: '2023-10-23', amount: 4132 },
    { date: '2023-10-24', amount: 1432 },
  ];

  const topProducts = [
    { name: 'MacBook Pro 15.4英寸', price: 19999, sales: 5 },
    { name: 'Apple iPhone 15 Pro', price: 8999, sales: 3 },
    { name: 'Sony WH-1000XM5', price: 2999, sales: 2 },
    { name: '智能手表 Pro', price: 1299, sales: 2 },
    { name: '无线蓝牙耳机', price: 999, sales: 5 },
    { name: '机械键盘 RGB背光', price: 399, sales: 3 },
    { name: '显示器 27英寸 4K', price: 2599, sales: 1 },
    { name: '游戏鼠标 有线', price: 299, sales: 1 },
    { name: '便携式充电宝 20000mAh', price: 199, sales: 4 },
    { name: 'USB-C转HDMI适配器', price: 99, sales: 1 },
  ];

  const topCustomers = [
    { name: '张三', amount: 3528.00, orders: 11 },
    { name: '李四', amount: 2937.50, orders: 8 },
    { name: '王五', amount: 1837.90, orders: 5 },
    { name: '赵六', amount: 1235.00, orders: 3 },
    { name: '钱七', amount: 928.00, orders: 2 },
  ];

  // 自定义工具提示
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="label">{`${label}`}</p>
          {payload.map((entry, index) => (
            <p key={`item-${index}`} style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="dashboard">
      {/* 基本信息卡片 */}
      <Row gutter={[16, 24]} className="stats-row">
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card product-card">
            <Statistic
                title="商品数量"
                value={dashboardData.totalProducts}
                valueStyle={{ color: '#ffffff', fontWeight: 700 }}
                titleStyle={{ color: 'rgba(255, 255, 255, 0.9)' }}
                prefix={<ShoppingCartOutlined style={{ color: 'white' }} />}
                suffix="个"
              />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card user-card">
            <Statistic
                title="会员数量"
                value={dashboardData.totalUsers}
                valueStyle={{ color: '#ffffff', fontWeight: 700 }}
                titleStyle={{ color: 'rgba(255, 255, 255, 0.9)' }}
                prefix={<UserOutlined style={{ color: 'white' }} />}
                suffix="人"
              />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card order-card">
            <Statistic
                title="订单数量"
                value={dashboardData.totalOrders}
                valueStyle={{ color: '#ffffff', fontWeight: 700 }}
                titleStyle={{ color: 'rgba(255, 255, 255, 0.9)' }}
                prefix={<OrderedListOutlined style={{ color: 'white' }} />}
                suffix="单"
              />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card sales-card">
            <Statistic
                title="销售金额"
                value={dashboardData.totalSales}
                valueStyle={{ color: '#ffffff', fontWeight: 700 }}
                titleStyle={{ color: 'rgba(255, 255, 255, 0.9)' }}
                prefix={<DollarOutlined style={{ color: 'white' }} />}
                suffix="元"
              />
          </Card>
        </Col>
      </Row>

      {/* 第二行：待办事项和在线人数 */}
      <Row gutter={[16, 24]} className="second-row">
        <Col xs={24} lg={16}>
          <Card title="今日待办" className="todo-card">
            <div className="todo-grid">
              {dashboardData.todoItems.map((item, index) => (
                <div key={index} className={`todo-item ${item.count > 0 ? 'has-count' : ''}`}>
                  <div className="todo-content">
                    <span className="todo-name">{item.name}</span>
                    <span className="todo-count">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
        
        <Col xs={24} lg={8}>
          <Card title="当前在线人数" className="online-card">
            <div className="online-info">
              <div className="online-number">{dashboardData.onlineCount}</div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 第三行：流量概览和今日概括 */}
      <Row gutter={[16, 24]} className="third-row">
        <Col xs={24} md={12}>
          <Card title="流量概览" className="traffic-card">
            <div className="traffic-grid">
              <div className="traffic-item">
                <div className="traffic-label">今日访客数</div>
                <div className="traffic-value">{dashboardData.visitorStats.today}</div>
              </div>
              <div className="traffic-item">
                <div className="traffic-label">昨日访客数</div>
                <div className="traffic-value">{dashboardData.visitorStats.yesterday}</div>
              </div>
              <div className="traffic-item">
                <div className="traffic-label">前七日访客数</div>
                <div className="traffic-value">{dashboardData.visitorStats.last7Days}</div>
              </div>
              <div className="traffic-item">
                <div className="traffic-label">前30日访客数</div>
                <div className="traffic-value">{dashboardData.visitorStats.last30Days}</div>
              </div>
            </div>
          </Card>
        </Col>
        
        <Col xs={24} md={12}>
          <Card title="今日概括" className="daily-card">
            <div className="daily-grid">
              <div className="daily-item">
                <div className="daily-label">今日订单数</div>
                <div className="daily-value">{dashboardData.dailyStats.orders}</div>
              </div>
              <div className="daily-item">
                <div className="daily-label">今日交易额</div>
                <div className="daily-value">¥{dashboardData.dailyStats.salesAmount}</div>
              </div>
              <div className="daily-item">
                <div className="daily-label">今日新增评论</div>
                <div className="daily-value">{dashboardData.dailyStats.newComments}</div>
              </div>
              <div className="daily-item">
                <div className="daily-label">今日新增会员</div>
                <div className="daily-value">{dashboardData.dailyStats.newUsers}</div>
              </div>
              <div className="daily-item">
                <div className="daily-label">今日上架商品</div>
                <div className="daily-value">{dashboardData.dailyStats.newProducts}</div>
              </div>
              <div className="daily-item">
                <div className="daily-label">今日新增评价</div>
                <div className="daily-value">{dashboardData.dailyStats.newReviews}</div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 第四行：在线人数图表 - 使用面积图增强视觉效果 */}
      <Row gutter={[16, 24]} className="charts-row">
        <Col span={24}>
          <Card title="最近48小时在线人数（整点为轴）">
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={onlineData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#40a9ff" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#40a9ff" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorLastWeek" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#95de64" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#95de64" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area type="monotone" dataKey="current" name="当前" stroke="#40a9ff" fillOpacity={1} fill="url(#colorCurrent)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Area type="monotone" dataKey="lastWeek" name="上周同期" stroke="#95de64" fillOpacity={1} fill="url(#colorLastWeek)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* 第五行：流量趋势和交易趋势 */}
      <Row gutter={[16, 24]} className="charts-row">
        <Col xs={24} md={12}>
          <Card title="流量趋势">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={trafficTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="pv" name="浏览量" fill="#95de64" radius={[4, 4, 0, 0]} />
                <Bar dataKey="uv" name="访客数" fill="#40a9ff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="交易趋势">
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={transactionTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#722ed1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#722ed1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  name="交易金额" 
                  stroke="#722ed1" 
                  strokeWidth={3} 
                  dot={{ r: 4, strokeWidth: 2 }} 
                  activeDot={{ r: 6 }} 
                  fillOpacity={1} 
                  fill="url(#colorAmount)" 
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* 第六行：热门商品和热门客户并列 */}
      <Row gutter={[16, 24]} className="lists-row">
        <Col xs={24} md={12}>
          <Card title="热门商品TOP10">
            <div className="top-list">
              {topProducts.map((product, index) => (
                <div key={index} className="list-item">
                  <div className="list-rank">{index + 1}</div>
                  <div className="list-info">
                    <div className="list-name">{product.name}</div>
                  </div>
                  <div className="list-price">¥{product.price}</div>
                  <div className="list-sales">{product.sales}件</div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="购买活跃TOP10">
            <div className="top-list">
              {topCustomers.map((customer, index) => (
                <div key={index} className="list-item">
                  <div className="list-rank">{index + 1}</div>
                  <div className="list-info">
                    <div className="list-name">{customer.name}</div>
                  </div>
                  <div className="list-price">¥{customer.amount}</div>
                  <div className="list-sales">{customer.orders}单</div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;