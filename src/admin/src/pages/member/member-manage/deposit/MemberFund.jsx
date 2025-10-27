import React, { useState, useEffect } from 'react';
import { Input, Button, Table, Pagination, Spin, DatePicker, Space, Row, Col } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import './MemberFund.css';

const { Search } = Input;
const { RangePicker } = DatePicker;

// 模拟资金流水数据
const generateMockData = (page, pageSize) => {
  const data = [];
  const baseId = (page - 1) * pageSize + 1;
  
  // 业务类型
  const businessTypes = [
    '余额支付',
    '余额退款',
    '余额提现'
  ];
  
  for (let i = 0; i < pageSize; i++) {
    const randomIndex = Math.floor(Math.random() * businessTypes.length);
    const businessType = businessTypes[randomIndex];
    
    let amount, status, detail;
    
    if (businessType === '余额支付') {
      amount = -Math.floor(Math.random() * 1000) / 100;
      const orderNo = `20250${Math.floor(Math.random() * 10000000000000000000)}`;
      detail = `订单[${orderNo}]支付金额${Math.abs(amount).toFixed(2)}`;
    } else if (businessType === '余额退款') {
      amount = Math.floor(Math.random() * 10000) / 100;
      const orderNo = `20250${Math.floor(Math.random() * 10000000000000000000)}`;
      detail = `订单[${orderNo}]，售后订单取消，退还金额${amount.toFixed(2)}`;
    } else { // 余额提现
      amount = -Math.floor(Math.random() * 10000) / 100;
      detail = '提现金额已冻结';
    }
    
    // 生成随机时间（最近一个月内）
    const now = new Date();
    const randomDays = Math.floor(Math.random() * 30);
    const randomHours = Math.floor(Math.random() * 24);
    const randomMinutes = Math.floor(Math.random() * 60);
    const randomSeconds = Math.floor(Math.random() * 60);
    
    now.setDate(now.getDate() - randomDays);
    now.setHours(randomHours, randomMinutes, randomSeconds, 0);
    
    data.push({
      key: baseId + i,
      username: `130****1111`,
      amount: amount,
      amountDisplay: Math.abs(amount).toFixed(2),
      timestamp: now,
      timestampDisplay: now.toLocaleString('zh-CN'),
      businessType: businessType,
      detail: detail
    });
  }
  
  return data;
};

const MemberFund = () => {
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState([]);
  const [dataSource, setDataSource] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 8570 // 总记录数，从图片中获取
  });

  // 加载数据
  const loadData = (page = 1, pageSize = 10) => {
    setLoading(true);
    
    // 模拟API请求延迟
    setTimeout(() => {
      const data = generateMockData(page, pageSize);
      
      // 如果有搜索条件，进行简单的过滤
      let filteredData = data;
      
      if (searchText) {
        filteredData = filteredData.filter(item => 
          item.username.includes(searchText)
        );
      }
      
      // 如果有日期范围过滤
      if (dateRange && dateRange.length === 2) {
        const [startDate, endDate] = dateRange;
        filteredData = filteredData.filter(item => {
          const itemDate = item.timestamp;
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
      width: 120,
      render: (text) => (
        <span className="usernameCell">{text}</span>
      )
    },
    {
      title: '变动金额',
      dataIndex: ['amount', 'amountDisplay'],
      key: 'amount',
      width: 120,
      align: 'center',
      render: (_, record) => {
        const prefix = record.amount > 0 ? '+' : '-';
        const colorClass = record.amount > 0 ? 'positiveAmount' : 'negativeAmount';
        return (
          <span className={colorClass}>¥{prefix}{record.amountDisplay}</span>
        );
      }
    },
    {
      title: '变更时间',
      dataIndex: 'timestampDisplay',
      key: 'timestamp',
      width: 160,
      align: 'center',
      render: (text) => (
        <span className="timestamp">{text}</span>
      )
    },
    {
      title: '业务类型',
      dataIndex: 'businessType',
      key: 'businessType',
      width: 120,
      align: 'center',
      render: (text) => (
        <span className="businessType">{text}</span>
      )
    },
    {
      title: '详细',
      dataIndex: 'detail',
      key: 'detail',
      render: (text) => (
        <span className="detail" title={text}>{text}</span>
      )
    }
  ];

  return (
    <div className="container">
      {/* 搜索区域 - 按照统一样式优化 */}
      <div className="search-area" style={{ backgroundColor: '#fff', borderBottom: '1px solid #f0f0f0', marginBottom: '16px' }}>
        <Row gutter={16} align="middle">
          <Col>
            <span style={{ marginRight: '8px', color: '#666' }}>会员名称</span>
            <Input
              placeholder="请输入会员名称"
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
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
          <Col>
            <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={handleSearch}
            style={{ width: 80, height: 32, backgroundColor: '#ff0000', borderColor: '#ff0000', color: '#ffffff !important', fontWeight: '500', fontSize: '14px', padding: '0 16px' }}
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
            emptyText: loading ? <Spin size="small" /> : '暂无资金流水数据'
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

export default MemberFund;