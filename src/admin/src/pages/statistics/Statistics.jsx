import React, { useState, useEffect } from 'react';
import { Card, Statistic, Row, Col, Select, DatePicker, message } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, UserOutlined, ShoppingCartOutlined, DollarOutlined, BarChartOutlined } from '@ant-design/icons';
import './Statistics.css';

const { RangePicker } = DatePicker;
const { Option } = Select;

const Statistics = () => {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState(null);
  const [viewType, setViewType] = useState('day'); // day, week, month
  const [statistics, setStatistics] = useState({
    totalUsers: 0,
    newUsers: 0,
    totalSales: 0,
    totalOrders: 0,
    conversionRate: 0,
    avgOrderValue: 0,
    dailyActiveUsers: 0,
    dailyNewUsers: 0,
    dailySales: 0,
    dailyOrders: 0
  });

  // 加载统计数据
  const loadStatistics = async () => {
    setLoading(true);
    try {
      // 模拟数据
      const mockStats = {
        totalUsers: 17579,
        newUsers: 43755,
        totalSales: 8928,
        totalOrders: 1119,
        conversionRate: 2.5,
        avgOrderValue: 156.80,
        dailyActiveUsers: 52,
        dailyNewUsers: 61,
        dailySales: 80.00,
        dailyOrders: 1
      };
      
      setStatistics(mockStats);
    } catch (error) {
      console.error('Load statistics error:', error);
      message.error('加载统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatistics();
  }, [dateRange, viewType]);

  // 切换视图类型
  const handleViewTypeChange = (value) => {
    setViewType(value);
  };

  // 切换日期范围
  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
  };

  return (
    <div className="statistics-page">
      <div className="statistics-header">
        <h2>数据统计</h2>
        <div className="statistics-filters">
          <Select
            defaultValue="day"
            style={{ width: 120, marginRight: 16 }}
            onChange={handleViewTypeChange}
          >
            <Option value="day">今日</Option>
            <Option value="week">本周</Option>
            <Option value="month">本月</Option>
            <Option value="year">本年</Option>
          </Select>
          <RangePicker onChange={handleDateRangeChange} />
        </div>
      </div>

      <div className="statistics-cards">
        <Row gutter={16}>
          <Col span={6}>
            <Card>
              <Statistic
                title="总用户数"
                value={statistics.totalUsers}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#3f8600' }}
                suffix="人"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="新增用户"
                value={statistics.newUsers}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#cf1322' }}
                suffix="人"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="总销售额"
                value={statistics.totalSales}
                prefix={<DollarOutlined />}
                valueStyle={{ color: '#1890ff' }}
                suffix="元"
                formatter={(value) => value.toFixed(2)}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="订单总数"
                value={statistics.totalOrders}
                prefix={<ShoppingCartOutlined />}
                valueStyle={{ color: '#722ed1' }}
                suffix="个"
              />
            </Card>
          </Col>
        </Row>
      </div>

      <div className="statistics-details">
        <Row gutter={16}>
          <Col span={8}>
            <Card title="今日待办">
              <div className="todo-list">
                <div className="todo-item">
                  <span className="todo-label">待审核商品</span>
                  <span className="todo-count">0</span>
                </div>
                <div className="todo-item">
                  <span className="todo-label">待处理订单</span>
                  <span className="todo-count">0</span>
                </div>
                <div className="todo-item">
                  <span className="todo-label">待审核评论</span>
                  <span className="todo-count">1</span>
                </div>
                <div className="todo-item">
                  <span className="todo-label">待处理售后</span>
                  <span className="todo-count">2</span>
                </div>
                <div className="todo-item">
                  <span className="todo-label">待处理分销提现</span>
                  <span className="todo-count">0</span>
                </div>
                <div className="todo-item">
                  <span className="todo-label">待解决争议</span>
                  <span className="todo-count">0</span>
                </div>
              </div>
            </Card>
          </Col>
          <Col span={8}>
            <Card title="当前在线人数">
              <div className="online-users">
                <div className="online-count">1</div>
                <div className="online-label">人正在浏览网站</div>
              </div>
            </Card>
          </Col>
          <Col span={8}>
            <Card title="今日概括">
              <div className="summary-list">
                <div className="summary-item">
                  <span className="summary-label">今日订单数</span>
                  <span className="summary-value primary">1</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">今日成交额</span>
                  <span className="summary-value primary">¥80.00</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">今日退款总额</span>
                  <span className="summary-value">0</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">今日新增会员数</span>
                  <span className="summary-value success">11</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">今日未付款订单</span>
                  <span className="summary-value">0</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">今日新增评论</span>
                  <span className="summary-value">0</span>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </div>

      <div className="traffic-overview">
        <Card title="流量概括">
          <Row gutter={16}>
            <Col span={6}>
              <div className="traffic-stat">
                <div className="traffic-title">今日访客数</div>
                <div className="traffic-value">52</div>
              </div>
            </Col>
            <Col span={6}>
              <div className="traffic-stat">
                <div className="traffic-title">昨日访客数</div>
                <div className="traffic-value">61</div>
              </div>
            </Col>
            <Col span={6}>
              <div className="traffic-stat">
                <div className="traffic-title">昨日浏览次数</div>
                <div className="traffic-value">341</div>
              </div>
            </Col>
            <Col span={6}>
              <div className="traffic-stat">
                <div className="traffic-title">近三日浏览次数</div>
                <div className="traffic-value">1305</div>
              </div>
            </Col>
          </Row>
        </Card>
      </div>
    </div>
  );
};

export default Statistics;