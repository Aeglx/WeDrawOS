import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Space, Tag, message, DatePicker, Row, Col } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import './OrderList.css';

const { RangePicker } = DatePicker;

const OrderList = () => {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [originalOrders, setOriginalOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  
  // 搜索参数状态 - 简化为图片中的三个字段
  const [searchParams, setSearchParams] = useState({
    orderId: '',
    memberName: '',
    dateRange: null
  });

  // 根据状态获取标签颜色
  const getStatusColor = (status) => {
    const colorMap = {
      pending: 'orange', // 未付款
      paid: 'blue',      // 已付款
      verification: 'orange', // 待核验
      completed: 'green', // 已完成
      cancelled: 'red'    // 已关闭
    };
    return colorMap[status] || 'default';
  };

  // 根据状态值获取状态文本
  const getStatusText = (status) => {
    const statusMap = {
      pending: '未付款',
      paid: '已付款',
      verification: '待核验',
      completed: '已完成',
      cancelled: '已关闭'
    };
    return statusMap[status] || status;
  };

  // 生成模拟订单数据 - 按照图片中的格式和数据
  const generateMockOrders = () => {
    const mockOrders = [];
    const statuses = ['pending', 'paid', 'verification', 'completed', 'cancelled'];
    const sources = ['移动端', 'PC端', '小程序端'];
    const buyerNames = ['130****1111', '181****3560', '4e14b7f4e1326cd1b8b577bfa0f1304c097b', '8030294c9f488b7tc'];
    
    // 生成1002条数据，与图片中的总数一致
    for (let i = 1; i <= 1002; i++) {
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      // 生成特定格式的订单号
      const id = `O2025${String(i).padStart(20, '0')}`;
      // 生成特定格式的下单时间
      const year = 2025;
      const month = Math.floor(Math.random() * 3) + 10; // 10-12月
      const day = Math.floor(Math.random() * 30) + 1;
      const hours = Math.floor(Math.random() * 24);
      const minutes = Math.floor(Math.random() * 60);
      const seconds = Math.floor(Math.random() * 60);
      const createdAt = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      
      // 根据状态设置不同的金额
      let amount;
      if (status === 'completed') {
        amount = 0.01;
      } else if (status === 'paid') {
        amount = 122.00;
      } else if (status === 'pending' || status === 'verification') {
        amount = Math.random() > 0.5 ? 0 : 1.00;
      } else {
        amount = Math.random() > 0.5 ? 0.10 : 899.00;
      }
      
      mockOrders.push({
        id,
        source: sources[Math.floor(Math.random() * sources.length)],
        buyerName: buyerNames[Math.floor(Math.random() * buyerNames.length)],
        amount: amount,
        status: status,
        statusText: getStatusText(status),
        statusColor: getStatusColor(status),
        createdAt
      });
    }
    
    return mockOrders;
  };

  // 加载订单列表
  const loadOrders = async () => {
    setLoading(true);
    try {
      // 生成模拟数据
      const mockOrders = generateMockOrders();
      setOrders(mockOrders);
      setOriginalOrders(mockOrders);
    } catch (error) {
      console.error('加载订单列表失败:', error);
      message.error('加载订单列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // 统一的筛选函数
  const filterOrders = (tabKey = activeTab) => {
    try {
      let filteredOrders = [...originalOrders];
      
      // 根据订单号搜索
      if (searchParams.orderId) {
        filteredOrders = filteredOrders.filter(order => 
          order.id.toLowerCase().includes(searchParams.orderId.toLowerCase())
        );
      }
      
      // 根据会员名称搜索
      if (searchParams.memberName) {
        filteredOrders = filteredOrders.filter(order => 
          order.buyerName.toLowerCase().includes(searchParams.memberName.toLowerCase())
        );
      }
      
      // 根据日期范围搜索
      if (searchParams.dateRange && searchParams.dateRange.length === 2) {
        const [startDate, endDate] = searchParams.dateRange;
        filteredOrders = filteredOrders.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate >= startDate && orderDate <= endDate;
        });
      }
      
      // 应用状态筛选
      if (tabKey !== 'all') {
        filteredOrders = filteredOrders.filter(order => order.status === tabKey);
      }
      
      return filteredOrders;
    } catch (error) {
      console.error('筛选订单失败:', error);
      return originalOrders;
    }
  };

  // 搜索功能
  const handleSearch = () => {
    setLoading(true);
    
    // 模拟搜索延迟
    setTimeout(() => {
      try {
        const filteredOrders = filterOrders();
        setOrders(filteredOrders);
        message.success(`找到 ${filteredOrders.length} 条订单`);
      } catch (error) {
        console.error('搜索订单失败:', error);
        message.error('搜索订单失败，请重试');
        setOrders(originalOrders);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  // 处理标签切换
  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    setLoading(true);
    
    // 模拟筛选延迟
    setTimeout(() => {
      try {
        const filteredOrders = filterOrders(tabKey);
        setOrders(filteredOrders);
        const statusText = tabKey === 'all' ? '' : getStatusText(tabKey);
        message.success(`找到 ${filteredOrders.length} 条${statusText}订单`);
      } catch (error) {
        console.error('状态筛选失败:', error);
        message.error('筛选订单失败，请重试');
        setOrders(originalOrders);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  // 查看订单详情
  const handleView = (record) => {
    message.info(`查看订单 ${record.id} 详情`);
  };

  // 收款功能
  const handleCollect = (record) => {
    message.info(`对订单 ${record.id} 进行收款操作`);
  };

  // 表格列配置 - 严格按照图片中的列进行配置
  const columns = [
    {
      title: '订单号',
      dataIndex: 'id',
      key: 'id',
      width: 250
    },
    {
      title: '下单时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180
    },
    {
      title: '订单来源',
      dataIndex: 'source',
      key: 'source',
      width: 100
    },
    {
      title: '买家名称',
      dataIndex: 'buyerName',
      key: 'buyerName',
      width: 120
    },
    {
      title: '订单金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 100,
      render: (amount) => `¥${amount.toFixed(2)}`,
      sorter: (a, b) => a.amount - b.amount
    },
    {
      title: '订单状态',
      key: 'status',
      width: 100,
      render: (_, record) => (
        <Tag color={record.statusColor}>{record.statusText}</Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="link" 
            size="small"
            onClick={() => handleCollect(record)}
            style={{ color: '#999' }}
          >
            收款
          </Button>
          <Button 
            type="link" 
            size="small"
            onClick={() => handleView(record)}
            style={{ color: '#ff7875' }}
          >
            查看
          </Button>
        </Space>
      )
    }
  ];

  // 状态标签配置 - 严格按照图片中的标签进行配置
  const statusTabs = [
    { key: 'all', label: '全部' },
    { key: 'pending', label: '未付款' },
    { key: 'paid', label: '已付款' },
    { key: 'verification', label: '待核验' },
    { key: 'completed', label: '已完成' },
    { key: 'cancelled', label: '已关闭' }
  ];

  return (
    <div className="order-list">
      {/* 搜索区域 - 简化为图片中的三个输入框和一个搜索按钮 */}
      <div className="search-area" style={{ padding: '16px', backgroundColor: '#fff', borderBottom: '1px solid #f0f0f0', marginBottom: '16px' }}>
        <Row gutter={16} align="middle">
          <Col>
            <span style={{ marginRight: '8px', color: '#666' }}>订单号</span>
            <Input 
              placeholder="请输入订单号" 
              value={searchParams.orderId} 
              onChange={(e) => setSearchParams({...searchParams, orderId: e.target.value})} 
              style={{ width: 180, height: 32 }}
            />
          </Col>
          <Col>
            <span style={{ marginRight: '8px', color: '#666' }}>会员名称</span>
            <Input 
              placeholder="请输入会员名称" 
              value={searchParams.memberName} 
              onChange={(e) => setSearchParams({...searchParams, memberName: e.target.value})} 
              style={{ width: 180, height: 32 }}
            />
          </Col>
          <Col>
            <span style={{ marginRight: '8px', color: '#666' }}>下单时间</span>
            <RangePicker 
              placeholder={['选择起始时间']}
              value={searchParams.dateRange}
              onChange={(dates) => setSearchParams({...searchParams, dateRange: dates})}
              style={{ width: 240, height: 32 }}
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
                backgroundColor: '#ff0000', 
                borderColor: '#ff0000', 
                color: '#ffffff !important',
                fontWeight: '500',
                fontSize: '14px',
                padding: '0 16px'
              }}
            >
              搜索
            </Button>
          </Col>
        </Row>
      </div>

      {/* 订单列表容器 */}
      <div className="order-table-container" style={{ backgroundColor: '#fff' }}>
        {/* 状态标签区域 - 严格按照图片中的标签样式 */}
        <div className="status-tabs" style={{ padding: '16px 0', borderBottom: '1px solid #f0f0f0' }}>
          <div className="tab-list" style={{ display: 'flex', paddingLeft: '16px' }}>
            {statusTabs.map(tab => (
              <div
                key={tab.key}
                className={`status-tab ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => handleTabChange(tab.key)}
                style={{
                  padding: '0 16px',
                  height: 32,
                  lineHeight: '32px',
                  cursor: 'pointer',
                  color: activeTab === tab.key ? '#ff4d4f' : '#666',
                  borderBottom: activeTab === tab.key ? '2px solid #ff4d4f' : 'none',
                  fontWeight: activeTab === tab.key ? 'bold' : 'normal',
                  marginRight: '16px'
                }}
              >
                {tab.label}
              </div>
            ))}
          </div>
        </div>

        {/* 表格区域 */}
        <Table
          columns={columns}
          dataSource={orders}
          rowKey={(record) => record.id}
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共${total}条`,
            pageSizeOptions: ['10条/页']
          }}
          className="order-table"
          style={{ padding: '0 16px' }}
        />
      </div>
    </div>
  );
};

export default OrderList;