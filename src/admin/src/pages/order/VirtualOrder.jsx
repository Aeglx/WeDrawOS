import React, { useState, useEffect } from 'react';
import { Table, Input, DatePicker, Button, Select, Tag, Space, message, Row, Col } from 'antd';
import { SearchOutlined, EyeOutlined, DollarOutlined } from '@ant-design/icons';
import './VirtualOrder.css';

const { RangePicker } = DatePicker;
const { Option } = Select;

// 生成模拟数据
const generateMockOrders = (count = 1002) => {
  const orders = [];
  const statuses = ['unpaid', 'paid', 'pending', 'completed', 'closed'];
  const sources = ['app', 'website', 'wechat', 'alipay'];
  
  for (let i = 1; i <= count; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const source = sources[Math.floor(Math.random() * sources.length)];
    const orderTime = new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000));
    
    orders.push({
      id: `VO${1000000 + i}`,
      orderTime: orderTime.toISOString(),
      source,
      buyerName: `用户${Math.floor(Math.random() * 10000)}`,
      amount: (Math.random() * 10000).toFixed(2),
      status
    });
  }
  
  return orders;
};

// 获取状态显示文本
const getStatusText = (status) => {
  const statusMap = {
    unpaid: '未付款',
    paid: '已付款',
    pending: '待核验',
    completed: '已完成',
    closed: '已关闭'
  };
  return statusMap[status] || '未知状态';
};

// 获取状态颜色
const getStatusColor = (status) => {
  const colorMap = {
    unpaid: '#ff4d4f',
    paid: '#1890ff',
    pending: '#faad14',
    completed: '#52c41a',
    closed: '#8c8c8c'
  };
  return colorMap[status] || '#8c8c8c';
};

const VirtualOrder = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useState({
    orderId: '',
    buyerName: '',
    orderTime: null
  });
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 加载订单数据
  const loadOrders = () => {
    setLoading(true);
    // 模拟API调用延迟
    setTimeout(() => {
      const mockData = generateMockOrders();
      setOrders(mockData);
      setFilteredOrders(mockData);
      setLoading(false);
    }, 500);
  };

  // 获取筛选后订单的基础数据（不包含状态筛选部分）
  const getBaseFilteredOrders = () => {
    let result = [...orders];
    
    // 仅应用搜索条件筛选，不包含状态筛选
    if (searchParams.orderId) {
      result = result.filter(order => 
        order.id.toLowerCase().includes(searchParams.orderId.toLowerCase())
      );
    }
    
    if (searchParams.buyerName) {
      result = result.filter(order => 
        order.buyerName.toLowerCase().includes(searchParams.buyerName.toLowerCase())
      );
    }
    
    if (searchParams.orderTime && searchParams.orderTime.length === 2) {
      const [startTime, endTime] = searchParams.orderTime;
      result = result.filter(order => {
        const orderDate = new Date(order.orderTime);
        return orderDate >= startTime && orderDate <= endTime;
      });
    }
    
    return result;
  };

  // 筛选订单 - 支持传入特定状态进行筛选
  const filterOrders = (statusToFilter = null) => {
    let result = getBaseFilteredOrders();
    
    // 使用传入的状态或当前状态进行筛选
    const status = statusToFilter !== null ? statusToFilter : selectedStatus;
    if (status !== 'all') {
      result = result.filter(order => order.status === status);
    }
    
    setFilteredOrders(result);
    setCurrentPage(1);
  };

  // 搜索处理
  const handleSearch = () => {
    filterOrders();
  };

  // 重置搜索
  const handleReset = () => {
    setSearchParams({
      orderId: '',
      buyerName: '',
      orderTime: null
    });
    setSelectedStatus('all');
    filterOrders('all'); // 直接传入'all'确保立即使用新状态
  };

  // 收款处理
  const handleCollect = (orderId) => {
    message.success(`订单 ${orderId} 收款成功`);
  };

  // 查看订单
  const handleView = (orderId) => {
    message.info(`查看订单 ${orderId} 详情`);
  };

  // 状态标签切换 - 直接传入新状态到filterOrders确保立即使用
  const handleStatusChange = (status) => {
    setSelectedStatus(status);
    filterOrders(status); // 直接传入新状态，避免依赖异步更新
  };

  // 组件挂载时加载数据
  useEffect(() => {
    loadOrders();
  }, []);

  // 表格列配置
  const columns = [
    {
      title: '订单号',
      dataIndex: 'id',
      key: 'id',
      width: 150,
    },
    {
      title: '下单时间',
      dataIndex: 'orderTime',
      key: 'orderTime',
      width: 180,
      render: (text) => new Date(text).toLocaleString('zh-CN'),
    },
    {
      title: '订单来源',
      dataIndex: 'source',
      key: 'source',
      width: 100,
      render: (text) => {
        const sourceMap = {
          app: 'App',
          website: '网站',
          wechat: '微信',
          alipay: '支付宝'
        };
        return sourceMap[text] || text;
      },
    },
    {
      title: '买家名称',
      dataIndex: 'buyerName',
      key: 'buyerName',
      width: 120,
    },
    {
      title: '订单金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 100,
      render: (text) => `¥${text}`,
    },
    {
      title: '订单状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (text) => (
        <Tag color={getStatusColor(text)}>
          {getStatusText(text)}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="link" 
            icon={<DollarOutlined />} 
            onClick={() => handleCollect(record.id)}
            style={{ color: '#ff4d4f' }}
            disabled={record.status !== 'unpaid'}
          >
            收款
          </Button>
          <Button 
            type="link" 
            icon={<EyeOutlined />} 
            onClick={() => handleView(record.id)}
            style={{ color: '#1890ff' }}
          >
            查看
          </Button>
        </Space>
      ),
    },
  ];

  // 状态标签配置 - 基于当前搜索条件（不含状态筛选）计算数量
  const baseFilteredOrders = getBaseFilteredOrders();
  const statusTabs = [
    { key: 'all', label: '全部', count: baseFilteredOrders.length },
    { key: 'unpaid', label: '未付款', count: baseFilteredOrders.filter(o => o.status === 'unpaid').length },
    { key: 'paid', label: '已付款', count: baseFilteredOrders.filter(o => o.status === 'paid').length },
    { key: 'pending', label: '待核验', count: baseFilteredOrders.filter(o => o.status === 'pending').length },
    { key: 'completed', label: '已完成', count: baseFilteredOrders.filter(o => o.status === 'completed').length },
    { key: 'closed', label: '已关闭', count: baseFilteredOrders.filter(o => o.status === 'closed').length },
  ];

  // 计算分页数据
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="virtual-order-container">
      {/* 搜索区域 - 按照统一样式优化 */}
      <div className="search-area" style={{ backgroundColor: '#fff', borderBottom: '1px solid #f0f0f0', marginBottom: '16px' }}>
        <Row gutter={16} align="middle">
          <Col>
            <span style={{ marginRight: '8px', color: '#666' }}>订单号</span>
            <Input
              placeholder="请输入订单号"
              value={searchParams.orderId}
              onChange={(e) => setSearchParams({ ...searchParams, orderId: e.target.value })}
              onPressEnter={handleSearch}
              style={{ width: 180, height: 32 }}
            />
          </Col>
          <Col>
            <span style={{ marginRight: '8px', color: '#666' }}>会员名称</span>
            <Input
              placeholder="请输入会员名称"
              value={searchParams.buyerName}
              onChange={(e) => setSearchParams({ ...searchParams, buyerName: e.target.value })}
              onPressEnter={handleSearch}
              style={{ width: 180, height: 32 }}
            />
          </Col>
          <Col>
            <span style={{ marginRight: '8px', color: '#666' }}>下单时间</span>
            <RangePicker
              value={searchParams.orderTime}
              onChange={(dates) => setSearchParams({ ...searchParams, orderTime: dates })}
              placeholder={['开始日期', '结束日期']}
              style={{ height: 32 }}
            />
          </Col>
          <Col>
            <Button 
              type="primary" 
              icon={<SearchOutlined />} 
              onClick={handleSearch}
              style={{ 
                width: 80, 
                height: 32, 
                backgroundColor: '#ff4d4f', 
                borderColor: '#ff4d4f' 
              }}
            >
              搜索
            </Button>
          </Col>
          <Col>
            <Button onClick={handleReset} style={{ height: 32 }}>
              重置
            </Button>
          </Col>
        </Row>
      </div>

      <div className="status-tabs">
        {statusTabs.map(tab => (
          <div
            key={tab.key}
            className={`status-tab ${selectedStatus === tab.key ? 'active' : ''}`}
            onClick={() => handleStatusChange(tab.key)}
          >
            <span>{tab.label}</span>
            <span className="tab-count">({tab.count})</span>
          </div>
        ))}
      </div>

      <div className="order-list">
        <Table
          columns={columns}
          dataSource={paginatedOrders}
          rowKey="id"
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: filteredOrders.length,
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            },
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条数据`,
          }}
          scroll={{ x: 'max-content' }}
        />
      </div>
    </div>
  );
};

export default VirtualOrder;