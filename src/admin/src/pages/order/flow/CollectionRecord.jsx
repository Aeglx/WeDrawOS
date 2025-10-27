import React, { useState, useEffect } from 'react';
import { Input, Select, Button, Table, Tag, Space, Pagination } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import './CollectionRecord.css';

const { Option } = Select;
const { Search } = Input;

// 生成模拟数据
const generateMockData = () => {
  const data = [];
  const statuses = ['success', 'pending'];
  const paymentMethods = ['支付宝', '微信支付', '银联支付'];
  const clients = ['PC网页', '移动端'];
  const stores = ['店铺1', '店铺2', '店铺3', '测试店铺123', '测试小程序店铺'];
  
  for (let i = 1; i <= 895; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
    const client = clients[Math.floor(Math.random() * clients.length)];
    const store = stores[Math.floor(Math.random() * stores.length)];
    
    // 生成订单编号
    const orderId = `O2025${String(Math.floor(Math.random() * 10000000000000000000)).padStart(20, '0')}`;
    
    // 生成支付时间
    const now = new Date();
    const randomDays = Math.floor(Math.random() * 30);
    const randomHours = Math.floor(Math.random() * 24);
    const randomMinutes = Math.floor(Math.random() * 60);
    const randomSeconds = Math.floor(Math.random() * 60);
    
    now.setDate(now.getDate() - randomDays);
    now.setHours(randomHours, randomMinutes, randomSeconds, 0);
    
    // 根据状态设置金额和第三方流水
    let amount;
    let thirdPartyId;
    if (status === 'success') {
      const amounts = [0.01, 0.02, 2.00, 9.00, 12.25, 122.00, 242.00, 4198.00, 29000.00];
      amount = amounts[Math.floor(Math.random() * amounts.length)];
      thirdPartyId = Math.random() > 0.5 ? '第三方流水号' : '-1';
    } else {
      amount = [29000.00, 4198.00, 242.00][Math.floor(Math.random() * 3)];
      thirdPartyId = '第三方流水号';
    }
    
    data.push({
      key: i,
      orderId,
      storeName: store,
      paymentMethod,
      thirdPartyId,
      client,
      payTime: now.toLocaleString('zh-CN'),
      amount,
      status
    });
  }
  
  return data;
};

const CollectionRecord = () => {
  const [dataSource, setDataSource] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useState({
    orderId: '',
    status: '',
    paymentMethod: ''
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  
  // 加载数据
  const loadData = () => {
    setLoading(true);
    // 模拟API请求延迟
    setTimeout(() => {
      const mockData = generateMockData();
      setDataSource(mockData);
      setFilteredData(mockData);
      setPagination(prev => ({ ...prev, total: mockData.length }));
      setLoading(false);
    }, 500);
  };
  
  // 初始化加载数据
  useEffect(() => {
    loadData();
  }, []);
  
  // 搜索功能
  const handleSearch = () => {
    let filtered = [...dataSource];
    
    if (searchParams.orderId) {
      filtered = filtered.filter(item => 
        item.orderId.toLowerCase().includes(searchParams.orderId.toLowerCase())
      );
    }
    
    if (searchParams.status) {
      filtered = filtered.filter(item => item.status === searchParams.status);
    }
    
    if (searchParams.paymentMethod) {
      filtered = filtered.filter(item => item.paymentMethod === searchParams.paymentMethod);
    }
    
    setFilteredData(filtered);
    setPagination({
      current: 1,
      pageSize: pagination.pageSize,
      total: filtered.length
    });
  };
  
  // 分页变化
  const handlePageChange = (page, pageSize) => {
    setPagination({
      current: page,
      pageSize,
      total: filteredData.length
    });
  };
  
  // 状态文本和颜色配置
  const getStatusConfig = (status) => {
    if (status === 'success') {
      return {
        text: '已完成',
        color: 'green',
        className: 'status-success'
      };
    }
    return {
      text: '未完成',
      color: 'red',
      className: 'status-pending'
    };
  };
  
  // 表格列配置
  const columns = [
    {
      title: '订单交易编号',
      dataIndex: 'orderId',
      key: 'orderId',
      width: 240,
      ellipsis: true
    },
    {
      title: '店铺名称',
      dataIndex: 'storeName',
      key: 'storeName',
      width: 150
    },
    {
      title: '支付方式',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      width: 100,
      render: (text) => (
        <span className="payment-method">{text}</span>
      )
    },
    {
      title: '第三方流水',
      dataIndex: 'thirdPartyId',
      key: 'thirdPartyId',
      width: 120
    },
    {
      title: '客户端',
      dataIndex: 'client',
      key: 'client',
      width: 100
    },
    {
      title: '支付时间',
      dataIndex: 'payTime',
      key: 'payTime',
      width: 180
    },
    {
      title: '订单金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (value) => (
        <span className="amount">¥{value.toFixed(2)}</span>
      )
    },
    {
      title: '支付状态',
      key: 'status',
      width: 100,
      render: (_, record) => {
        const statusConfig = getStatusConfig(record.status);
        return (
          <Tag color={statusConfig.color} className={statusConfig.className}>
            {statusConfig.text}
          </Tag>
        );
      }
    }
  ];
  
  // 计算当前页数据
  const currentPageData = filteredData.slice(
    (pagination.current - 1) * pagination.pageSize,
    pagination.current * pagination.pageSize
  );
  
  return (
    <div className="collection-record">
      {/* 搜索区域 */}
      <div className="search-area" style={{ padding: '16px', backgroundColor: '#fff', borderBottom: '1px solid #f0f0f0', marginBottom: '16px' }}>
        <Space size="middle">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: '8px', color: '#666' }}>订单号</span>
            <Input
              placeholder="请输入订单号"
              value={searchParams.orderId}
              onChange={(e) => setSearchParams({...searchParams, orderId: e.target.value})}
              style={{ width: 200, height: 32 }}
              onPressEnter={handleSearch}
            />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: '8px', color: '#666' }}>付款状态</span>
            <Select
              placeholder="全部"
              style={{ width: 150, height: 32 }}
              value={searchParams.status}
              onChange={(value) => setSearchParams({...searchParams, status: value})}
              allowClear
            >
              <Option value="success">已完成</Option>
              <Option value="pending">未完成</Option>
            </Select>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: '8px', color: '#666' }}>支付方式</span>
            <Select
              placeholder="全部"
              style={{ width: 150, height: 32 }}
              value={searchParams.paymentMethod}
              onChange={(value) => setSearchParams({...searchParams, paymentMethod: value})}
              allowClear
            >
              <Option value="支付宝">支付宝</Option>
              <Option value="微信支付">微信支付</Option>
              <Option value="银联支付">银联支付</Option>
            </Select>
          </div>
          
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={handleSearch}
            style={{ backgroundColor: '#ff0000', borderColor: '#ff0000', color: '#ffffff !important', height: 32, fontWeight: '500', fontSize: '14px', padding: '0 16px', width: 80 }}
          >
            搜索
          </Button>
        </Space>
      </div>
      
      {/* 表格区域 */}
      <div className="table-area" style={{ backgroundColor: '#fff' }}>
        <Table
          columns={columns}
          dataSource={currentPageData}
          pagination={false}
          loading={loading}
          className="collection-table"
          rowKey="key"
        />
        
        {/* 分页区域 */}
        <div className="pagination-area" style={{ padding: '16px', borderTop: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="total-text" style={{ color: '#666', fontSize: '14px' }}>
              共 {pagination.total} 条
            </span>
            <Pagination
              current={pagination.current}
              pageSize={pagination.pageSize}
              total={pagination.total}
              onChange={handlePageChange}
              showSizeChanger
              showQuickJumper
              showTotal={(total) => `共 ${total} 条`}
              pageSizeOptions={['10', '20', '50', '100']}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectionRecord;