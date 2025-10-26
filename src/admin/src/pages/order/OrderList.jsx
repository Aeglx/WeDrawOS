import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Space, Tag, Modal, Select, message, DatePicker, Row, Col } from 'antd';
import { SearchOutlined, FilterOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import './OrderList.css';

const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

const OrderList = () => {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [originalOrders, setOriginalOrders] = useState([]); // 保存原始订单数据
  const [activeTab, setActiveTab] = useState('all');
  
  // 搜索参数状态
  const [searchParams, setSearchParams] = useState({
    keyword: '',
    orderId: '',
    memberName: '',
    productName: '',
    consignee: '',
    orderSource: '',
    paymentMethod: '',
    dateRange: null
  });

  // 生成模拟数据
  const generateMockOrders = () => {
    const sources = ['移动端', 'PC端', '微信小程序', '移动端应用'];
    const types = ['普通订单', '预售订单', '秒杀订单'];
    const statuses = [
      { text: '待付款', value: 'pending', color: 'orange' },
      { text: '已付款', value: 'paid', color: 'blue' },
      { text: '待发货', value: 'processing', color: 'cyan' },
      { text: '部分发货', value: 'partial', color: 'purple' },
      { text: '待收货', value: 'shipping', color: 'lime' },
      { text: '待核销', value: 'verification', color: 'geekblue' },
      { text: '已完成', value: 'completed', color: 'green' },
      { text: '已取消', value: 'cancelled', color: 'gray' }
    ];
    const paymentMethods = ['微信支付', '支付宝', '货到付款'];
    
    const mockOrders = [];
    
    for (let i = 0; i < 50; i++) {
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const hasPayment = ['pending', 'cancelled'].indexOf(status.value) === -1;
      
      mockOrders.push({
        id: `O${202505100000000000 + i}`,
        source: sources[Math.floor(Math.random() * sources.length)],
        type: types[Math.floor(Math.random() * types.length)],
        buyerName: `user${Math.floor(Math.random() * 10000)}@example.com`,
        memberId: `1${Math.random().toString().slice(2, 12)}`,
        storeName: '京东商城',
        amount: Math.random() * 1000,
        paymentMethod: hasPayment ? paymentMethods[Math.floor(Math.random() * paymentMethods.length)] : '',
        status: status.value,
        statusText: status.text,
        statusColor: status.color,
        createdAt: new Date(2025, 4, Math.floor(Math.random() * 30) + 1, Math.floor(Math.random() * 24), Math.floor(Math.random() * 60)).toLocaleString('zh-CN')
      });
    }
    
    return mockOrders;
  };

  // 加载订单列表
  const loadOrders = async () => {
    setLoading(true);
    try {
      // 模拟数据
      const mockOrders = generateMockOrders();
      setOrders(mockOrders);
      setOriginalOrders(mockOrders); // 保存原始订单数据
    } catch (error) {
      console.error('Load orders error:', error);
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
      
      // 应用搜索条件
      // 根据关键字搜索
      if (searchParams.keyword) {
        const keyword = searchParams.keyword.toLowerCase();
        filteredOrders = filteredOrders.filter(order => 
          order.id.toLowerCase().includes(keyword) || 
          order.buyerName.toLowerCase().includes(keyword) ||
          order.storeName.toLowerCase().includes(keyword)
        );
      }
      
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
      
      // 根据商品名称搜索（在模拟数据中我们通过订单号模糊匹配模拟）
      if (searchParams.productName) {
        filteredOrders = filteredOrders.filter(order => 
          order.id.toLowerCase().includes(searchParams.productName.toLowerCase())
        );
      }
      
      // 根据收货人搜索（在模拟数据中我们通过买家名称模糊匹配模拟）
      if (searchParams.consignee) {
        filteredOrders = filteredOrders.filter(order => 
          order.buyerName.toLowerCase().includes(searchParams.consignee.toLowerCase())
        );
      }
      
      // 根据订单来源搜索
      if (searchParams.orderSource) {
        const sourceMapping = {
          'mobile': '移动端',
          'pc': 'PC端',
          'wechat': '微信小程序'
        };
        const sourceText = sourceMapping[searchParams.orderSource] || searchParams.orderSource;
        filteredOrders = filteredOrders.filter(order => 
          order.source.includes(sourceText)
        );
      }
      
      // 根据支付方式搜索
      if (searchParams.paymentMethod) {
        const paymentMapping = {
          'wechat': '微信支付',
          'alipay': '支付宝',
          'cod': '货到付款'
        };
        const paymentText = paymentMapping[searchParams.paymentMethod] || searchParams.paymentMethod;
        filteredOrders = filteredOrders.filter(order => 
          order.paymentMethod.includes(paymentText)
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

  // 重置搜索条件
  const handleReset = () => {
    setSearchParams({
      keyword: '',
      orderId: '',
      memberName: '',
      productName: '',
      consignee: '',
      orderSource: '',
      paymentMethod: '',
      dateRange: null
    });
    setActiveTab('all');
    loadOrders();
  };

  // 切换状态标签并筛选订单
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
  
  // 导出订单功能
  const handleExport = () => {
    setLoading(true);
    
    // 模拟导出延迟
    setTimeout(() => {
      try {
        // 实际项目中，这里应该调用后端API导出订单
        // 这里我们只做一个简单的模拟
        message.success('订单导出成功！');
      } catch (error) {
        console.error('导出订单失败:', error);
        message.error('导出订单失败，请重试');
      } finally {
        setLoading(false);
      }
    }, 500);
  };
  
  // 根据状态值获取状态文本
  const getStatusText = (status) => {
    const statusMap = {
      pending: '未付款',
      paid: '已付款',
      processing: '待发货',
      partial: '部分发货',
      shipping: '待收货',
      verification: '待核销',
      completed: '已完成',
      cancelled: '已取消'
    };
    return statusMap[status] || status;
  };

  // 查看订单详情
  const handleView = (record) => {
    message.info(`查看订单 ${record.id} 详情`);
  };

  // 表格列配置
  const columns = [
    {
      title: '订单号',
      dataIndex: 'id',
      key: 'id',
      width: 180
    },
    {
      title: '订单来源',
      dataIndex: 'source',
      key: 'source',
      width: 100
    },
    {
      title: '订单类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type) => <Tag color="blue">{type}</Tag>
    },
    {
      title: '买家名称',
      dataIndex: 'buyerName',
      key: 'buyerName',
      width: 150
    },
    {
      title: '会员ID',
      dataIndex: 'memberId',
      key: 'memberId',
      width: 130
    },
    {
      title: '店铺名称',
      dataIndex: 'storeName',
      key: 'storeName',
      width: 100
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
      title: '支付方式',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      width: 100
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
      title: '下单时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="primary" 
            size="small"
            onClick={() => handleView(record)} 
          >
            查看
          </Button>
        </Space>
      )
    }
  ];

  // 计算各状态订单数量
  const getStatusCounts = () => {
    const counts = {
      all: originalOrders.length,
      pending: 0,
      paid: 0,
      processing: 0,
      partial: 0,
      shipping: 0,
      verification: 0,
      completed: 0,
      cancelled: 0
    };
    
    originalOrders.forEach(order => {
      if (counts.hasOwnProperty(order.status)) {
        counts[order.status]++;
      }
    });
    
    return counts;
  };
  
  const statusCounts = getStatusCounts();
  
  // 状态标签配置
  const statusTabs = [
    { key: 'all', label: '全部', count: null },
    { key: 'pending', label: '未付款', count: statusCounts.pending },
    { key: 'paid', label: '已付款', count: statusCounts.paid },
    { key: 'processing', label: '待发货', count: statusCounts.processing },
    { key: 'partial', label: '部分发货', count: statusCounts.partial },
    { key: 'shipping', label: '待收货', count: statusCounts.shipping },
    { key: 'verification', label: '待核销', count: statusCounts.verification },
    { key: 'completed', label: '已完成', count: statusCounts.completed },
    { key: 'cancelled', label: '已取消', count: statusCounts.cancelled }
  ];

  return (
    <div className="order-list">
      {/* 搜索区域 */}
      <div className="search-area">
        <Row gutter={16} style={{ marginBottom: '16px' }}>
          <Col span={24}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ marginRight: '8px', whiteSpace: 'nowrap' }}>关键字:</span>
              <Input 
                placeholder="请输入商品名称/收货人/收货人手机/店铺名称" 
                value={searchParams.keyword || ''} 
                onChange={(e) => setSearchParams({...searchParams, keyword: e.target.value})} 
                style={{ flex: 1 }}
              />
            </div>
          </Col>
        </Row>
        
        <Row gutter={16}>
          <Col span={5}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ marginRight: '8px', whiteSpace: 'nowrap' }}>订单号:</span>
              <Input 
                placeholder="请输入订单号" 
                value={searchParams.orderId} 
                onChange={(e) => setSearchParams({...searchParams, orderId: e.target.value})} 
                style={{ flex: 1 }}
              />
            </div>
          </Col>
          <Col span={5}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ marginRight: '8px', whiteSpace: 'nowrap' }}>会员名称:</span>
              <Input 
                placeholder="请输入会员名称" 
                value={searchParams.memberName} 
                onChange={(e) => setSearchParams({...searchParams, memberName: e.target.value})} 
                style={{ flex: 1 }}
              />
            </div>
          </Col>
          <Col span={5}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ marginRight: '8px', whiteSpace: 'nowrap' }}>商品名称:</span>
              <Input 
                placeholder="请输入商品名称" 
                value={searchParams.productName} 
                onChange={(e) => setSearchParams({...searchParams, productName: e.target.value})} 
                style={{ flex: 1 }}
              />
            </div>
          </Col>
          <Col span={5}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ marginRight: '8px', whiteSpace: 'nowrap' }}>收货人:</span>
              <Input 
                placeholder="请输入收货人姓名" 
                value={searchParams.consignee} 
                onChange={(e) => setSearchParams({...searchParams, consignee: e.target.value})} 
                style={{ flex: 1 }}
              />
            </div>
          </Col>

        </Row>
        
        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col span={5}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ marginRight: '8px', whiteSpace: 'nowrap' }}>订单来源:</span>
              <Select 
                placeholder="请选择" 
                value={searchParams.orderSource} 
                onChange={(value) => setSearchParams({...searchParams, orderSource: value})}
                allowClear
                style={{ flex: 1 }}
              >
                <Option value="mobile">移动端</Option>
                <Option value="pc">PC端</Option>
                <Option value="wechat">微信小程序</Option>
              </Select>
            </div>
          </Col>
          <Col span={5}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ marginRight: '8px', whiteSpace: 'nowrap' }}>支付方式:</span>
              <Select 
                placeholder="请选择" 
                value={searchParams.paymentMethod} 
                onChange={(value) => setSearchParams({...searchParams, paymentMethod: value})}
                allowClear
                style={{ flex: 1 }}
              >
                <Option value="wechat">微信支付</Option>
                <Option value="alipay">支付宝</Option>
                <Option value="cod">货到付款</Option>
              </Select>
            </div>
          </Col>
          <Col span={8}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ marginRight: '8px', whiteSpace: 'nowrap' }}>下单时间:</span>
              <RangePicker 
                placeholder={['开始时间', '结束时间']}
                value={searchParams.dateRange}
                onChange={(dates) => setSearchParams({...searchParams, dateRange: dates})}
                style={{ flex: 1 }}
              />
            </div>
          </Col>
          <Col span={2}>
            <Button type="primary" onClick={handleSearch} style={{ width: '100%' }}>
              搜索
            </Button>
          </Col>
          <Col span={2}>
            <Button onClick={handleReset} style={{ width: '100%' }}>
              重置
            </Button>
          </Col>
        </Row>
      </div>

      {/* 订单列表容器 - 包含标签和表格 */}
      <div className="order-table-container">
        {/* 状态标签区域 */}
        <div className="status-tabs">
          <div className="tab-list">
            {statusTabs.map(tab => (
              <div
                key={tab.key}
                className={`status-tab ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => handleTabChange(tab.key)}
              >
                {tab.label}
                {tab.count !== null && <span className="tab-count">({tab.count})</span>}
              </div>
            ))}
          </div>
        </div>

        {/* 导出按钮区域 */}
        <div style={{ textAlign: 'right', marginBottom: '16px', paddingRight: '20px' }}>
          <Button 
            type="primary" 
            onClick={handleExport} 
            style={{ 
              backgroundColor: '#1890ff', 
              borderColor: '#1890ff' 
            }}
          >
            导出订单
          </Button>
        </div>

        {/* 表格区域 */}
        <Table
          columns={columns}
          dataSource={orders}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20 }}
          className="order-table"
        />
      </div>
    </div>
  );
};

export default OrderList;