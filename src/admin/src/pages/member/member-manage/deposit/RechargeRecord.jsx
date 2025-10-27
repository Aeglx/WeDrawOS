import React, { useState, useEffect } from 'react';
import { Input, Button, Table, Pagination, Spin, DatePicker, Space, Row, Col } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import './RechargeRecord.css';

const { Search } = Input;
const { RangePicker } = DatePicker;

// 生成随机订单号
const generateOrderNo = () => {
  return `Y${19800000000000000000 + Math.floor(Math.random() * 1000000000000000000)}`;
};

// 生成随机会员名称
const generateUsername = () => {
  const patterns = [
    '130****1111',
    'test10000000',
    `${Math.random().toString(36).substring(2, 15)}`
  ];
  return patterns[Math.floor(Math.random() * patterns.length)];
};

// 生成随机金额
const generateAmount = () => {
  const amounts = [1, 10, 100, 5000, 8000];
  return amounts[Math.floor(Math.random() * amounts.length)];
};

// 模拟充值记录数据
const generateMockData = (page, pageSize) => {
  const data = [];
  const baseId = (page - 1) * pageSize + 1;
  
  for (let i = 0; i < pageSize; i++) {
    // 生成随机时间（最近一个月内）
    const now = new Date();
    const randomDays = Math.floor(Math.random() * 30);
    const randomHours = Math.floor(Math.random() * 24);
    const randomMinutes = Math.floor(Math.random() * 60);
    const randomSeconds = Math.floor(Math.random() * 60);
    
    now.setDate(now.getDate() - randomDays);
    now.setHours(randomHours, randomMinutes, randomSeconds, 0);
    
    // 支付时间可能为空
    const hasPayTime = Math.random() < 0.3; // 30%概率有支付时间
    const payTime = hasPayTime ? new Date(now.getTime() + Math.random() * 3600000) : null;
    
    data.push({
      key: baseId + i,
      username: generateUsername(),
      orderNo: generateOrderNo(),
      amount: generateAmount(),
      paymentMethod: '', // 暂时留空
      paymentStatus: '未付款',
      rechargeTime: now,
      rechargeTimeDisplay: now.toLocaleString('zh-CN'),
      payTime: payTime,
      payTimeDisplay: payTime ? payTime.toLocaleString('zh-CN') : ''
    });
  }
  
  return data;
};

const RechargeRecord = () => {
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [orderNo, setOrderNo] = useState('');
  const [dateRange, setDateRange] = useState([]);
  const [dataSource, setDataSource] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 4218 // 总记录数，从图片中获取
  });

  // 加载数据
  const loadData = (page = 1, pageSize = 10) => {
    setLoading(true);
    
    // 模拟API请求延迟
    setTimeout(() => {
      const data = generateMockData(page, pageSize);
      
      // 如果有搜索条件，进行简单的过滤
      let filteredData = data;
      
      if (username) {
        filteredData = filteredData.filter(item => 
          item.username.includes(username)
        );
      }
      
      if (orderNo) {
        filteredData = filteredData.filter(item => 
          item.orderNo.includes(orderNo)
        );
      }
      
      // 如果有日期范围过滤
      if (dateRange && dateRange.length === 2) {
        const [startDate, endDate] = dateRange;
        filteredData = filteredData.filter(item => {
          const itemDate = item.rechargeTime;
          return itemDate >= startDate && itemDate <= endDate;
        });
      }
      
      setDataSource(filteredData);
      setLoading(false);
    }, 500);
  };

  // 处理搜索
  const handleSearch = () => {
    setPagination(prev => ({ ...prev, current: 1 }));
    loadData(1, pagination.pageSize);
  };

  // 处理分页变化
  const handlePageChange = (page, pageSize) => {
    setPagination(prev => ({ 
      ...prev, 
      current: page, 
      pageSize 
    }));
    loadData(page, pageSize);
  };

  // 初始加载
  useEffect(() => {
    loadData(pagination.current, pagination.pageSize);
  }, []);

  // 表格列配置
  const columns = [
    {
      title: '会员名称',
      dataIndex: 'username',
      key: 'username',
      width: 160,
      render: (text) => (
        <span className="usernameCell">{text}</span>
      )
    },
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 200,
      ellipsis: true,
      render: (text) => (
        <span className="orderNo" title={text}>{text}</span>
      )
    },
    {
      title: '充值金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      align: 'center',
      sorter: (a, b) => a.amount - b.amount,
      render: (value) => (
        <span className="amount">+{value.toFixed(2)}</span>
      )
    },
    {
      title: '充值方式',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      width: 120,
      align: 'center',
      render: (text) => (
        <span className="paymentMethod">{text || '-'}</span>
      )
    },
    {
      title: '支付状态',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      width: 100,
      align: 'center',
      render: (text) => (
        <span className="paymentStatusTag">{text}</span>
      )
    },
    {
      title: '充值时间',
      dataIndex: 'rechargeTimeDisplay',
      key: 'rechargeTime',
      width: 180,
      align: 'center',
      render: (text) => (
        <span className="timeCell">{text}</span>
      )
    },
    {
      title: '支付时间',
      dataIndex: 'payTimeDisplay',
      key: 'payTime',
      width: 180,
      align: 'center',
      render: (text) => (
        <span className="timeCell">{text || '-'}</span>
      )
    }
  ];

  return (
    <div className="container">
      {/* 搜索区域 - 按照统一样式优化 */}
      <div className="search-area" style={{ backgroundColor: '#fff', borderBottom: '1px solid #f0f0f0', marginBottom: '16px' }}>
        <Row gutter={16} align="middle" style={{ marginBottom: '16px' }}>
          <Col>
            <span style={{ marginRight: '8px', color: '#666' }}>会员名称</span>
            <Input
              placeholder="请输入会员名称"
              allowClear
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onPressEnter={handleSearch}
              style={{ width: 180, height: 32 }}
            />
          </Col>
          <Col>
            <span style={{ marginRight: '8px', color: '#666' }}>充值单号</span>
            <Input
              placeholder="请输入充值单号"
              allowClear
              value={orderNo}
              onChange={(e) => setOrderNo(e.target.value)}
              onPressEnter={handleSearch}
              style={{ width: 180, height: 32 }}
            />
          </Col>
          <Col>
            <span style={{ marginRight: '8px', color: '#666' }}>支付时间</span>
            <RangePicker
              placeholder={['选择起始时间', '选择结束时间']}
              value={dateRange}
              onChange={(dates) => setDateRange(dates)}
              style={{ width: 320, height: 32 }}
            />
          </Col>
        </Row>
        <Row gutter={16} align="middle">
          <Col>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={handleSearch}
              style={{ width: 80, height: 32, backgroundColor: '#ff4d4f', borderColor: '#ff4d4f' }}
            >
              搜索
            </Button>
          </Col>
        </Row>
      </div>

      {/* 表格区域 */}
      <div className="tableContainer">
        <Table
          columns={columns}
          dataSource={dataSource}
          pagination={false}
          loading={loading}
          rowKey="key"
          scroll={{ y: 500 }}
          rowClassName={(record, index) => index % 2 === 0 ? 'evenRow' : 'oddRow'}
          locale={{
            emptyText: loading ? <Spin size="small" /> : '暂无充值记录数据'
          }}
        />
      </div>

      {/* 分页区域 */}
      <div className="paginationContainer">
        <Pagination
          current={pagination.current}
          pageSize={pagination.pageSize}
          total={pagination.total}
          onChange={handlePageChange}
          showSizeChanger
          showQuickJumper
          showTotal={(total) => `共${total}条`}
          pageSizeOptions={['10', '20', '50', '100']}
          size="small"
        />
      </div>
    </div>
  );
};

export default RechargeRecord;